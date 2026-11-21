#!/usr/bin/env node
// #323-E · completeness scanner: lists Polish text still written in the source instead of the catalog.
//
//   node scripts/i18n-scan.mjs [--json] [--list] [--max=N] [paths…]     (default path: src)
//
// A string or template literal counts as untranslated Polish when it has Polish letters or a common Polish word and is
// not: a test, the catalog itself, an import path, a console/log message, a comparison operand (logic on stored data)
// or a property key. --max=N exits with code 1 when more than N literals remain (used by the parity test).
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
import { polishDetector } from "./i18n-polish.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const list = args.includes("--list");
const max = Number((args.find((a) => a.startsWith("--max=")) ?? "").slice(6) || NaN);
const roots = args.filter((a) => !a.startsWith("--"));
if (!roots.length) roots.push(path.join(ROOT, "src"));

const POLISH = /[ąćęłńśźżĄĆĘŁŃŚŹŻ]|\b(nie|brak|oraz|lub|jest|dla|przez|wynik|mecz|mecze|etap|etapy|gracz|gracze|graczy|turniej|turnieju|runda|rundy|grupa|grupy|koszyk|zapisz|anuluj|zamknij|dodaj|usun|otworz|kolejka|uczestnik|uczestnicy|druzyna|wyniki|tabela|drabinka|awans|zwyciezca|zakonczony|aktywny|planowany)\b/i;
const TECH_PROPS = new Set(["id", "key", "value", "slug", "type", "kind", "code", "status", "format", "variant", "href", "to", "path", "url", "icon", "color", "className", "testId", "role", "mode", "tone", "field", "column", "event", "action", "route", "tab", "query", "param", "lang", "locale", "pattern", "regex", "separator", "delimiter", "storageKey"]);
const TECH_ATTRS = new Set(["className", "id", "key", "href", "to", "type", "name", "value", "defaultValue", "role", "htmlFor", "variant", "size", "src", "method", "autoComplete", "inputMode", "pattern", "rel", "target", "form", "accept", "dir", "lang", "style"]);
const IGNORE = /i18n-ignore/;
const isClassList = (text) => { const tokens = text.trim().split(/\s+/); return !/[A-ZĄĆĘŁŃÓŚŹŻąćęłńóśźż{}]/.test(text) && tokens.filter((x) => /[-:\/\[]/.test(x)).length / tokens.length >= 0.5; };
const SKIP_FILE = /(\.test\.|\.spec\.|[\\/]i18n[\\/]catalog[\\/]|[\\/]test[\\/]|\.d\.ts$)/;

function walk(target, out) {
  const stat = statSync(target);
  if (stat.isDirectory()) { for (const entry of readdirSync(target)) walk(path.join(target, entry), out); return out; }
  if (/\.(tsx?|mts)$/.test(target) && !SKIP_FILE.test(target)) out.push(target);
  return out;
}

function isLogic(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isExternalModuleReference(parent)) return true;
  if (ts.isPropertyAssignment(parent) && (parent.name === node || TECH_PROPS.has(parent.name.getText().replace(/["']/g, "")))) return true;
  if (ts.isJsxAttribute(parent) && (TECH_ATTRS.has(parent.name.getText()) || parent.name.getText().startsWith("data-"))) return true;
  if (ts.isJsxExpression(parent) && parent.parent && ts.isJsxAttribute(parent.parent) && (TECH_ATTRS.has(parent.parent.name.getText()) || parent.parent.name.getText().startsWith("data-"))) return true;
  if (ts.isLiteralTypeNode(parent)) return true;
  if (ts.isCaseClause(parent)) return true;
  if (ts.isBinaryExpression(parent) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(parent.operatorToken.kind)) return true;
  if (ts.isCallExpression(parent)) {
    const callee = parent.expression.getText();
    if (/^(console\.\w+|logger\.\w+|log|debug|require|t|tr|tp|hasKey)$/.test(callee) || /\.(includes|startsWith|endsWith|split|replace|match|test|indexOf|get|has|getItem|setItem)$/.test(callee)) return true;
  }
  if (ts.isElementAccessExpression(parent)) return true;
  return false;
}

const isPolishVocab = polishDetector(ROOT);
const rows = [];
for (const file of roots.flatMap((r) => walk(path.resolve(r), []))) {
  const source = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const hits = [];
  const lines = source.split(/\r?\n/);
  const visit = (node) => {
    let text = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
    else if (ts.isTemplateExpression(node)) text = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join("{}");
    else if (ts.isJsxText(node)) text = node.text.trim();
    const lineNo = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
    if (text && /[A-Za-zÀ-ž]{2}/.test(text) && !/^\s*[\/?#]|[?&]\w+=|^[\w.-]+\.(json|csv)$/.test(text) && (POLISH.test(text) || isPolishVocab(text)) && !isLogic(node) && !isClassList(text) && !IGNORE.test(lines[lineNo] ?? "")) {
      hits.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text: text.replace(/\s+/g, " ").slice(0, 120) });
    }
    if (!ts.isTemplateExpression(node)) ts.forEachChild(node, visit);
    else node.templateSpans.forEach((span) => ts.forEachChild(span.expression, visit) || visit(span.expression));
  };
  visit(sf);
  if (hits.length) rows.push({ file: path.relative(ROOT, file).replace(/\\/g, "/"), count: hits.length, hits });
}
rows.sort((a, b) => b.count - a.count);
const total = rows.reduce((n, r) => n + r.count, 0);
if (asJson) console.log(JSON.stringify({ total, files: rows.map(({ file, count }) => ({ file, count })) }, null, 1));
else {
  for (const row of rows) {
    console.log(`${String(row.count).padStart(5)}  ${row.file}`);
    if (list) for (const hit of row.hits) console.log(`         ${hit.line}: ${hit.text}`);
  }
  console.log(`total ${total} Polish literals in ${rows.length} files`);
}
if (Number.isFinite(max) && total > max) process.exit(1);
