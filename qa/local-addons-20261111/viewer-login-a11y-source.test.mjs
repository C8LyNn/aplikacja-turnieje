import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const file = path.join(root, "artifacts/tournament-manager/src/components/viewer-login-modal.tsx");
const source = readFileSync(file, "utf8");
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function jsxAttributes(tagName) {
  const out = [];
  function visit(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(ast) === tagName) {
      const attrs = Object.fromEntries(node.attributes.properties
        .filter(ts.isJsxAttribute)
        .map(attr => [attr.name.getText(ast), attr.initializer?.getText(ast)]));
      out.push(attrs);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return out;
}
const input = jsxAttributes("Input")[0];
const label = jsxAttributes("Label")[0];
const buttons = jsxAttributes("button");
const toggle = buttons.find(button => button["aria-label"]?.includes("showPass"));

// This suite intentionally checks source-level accessibility contracts. React/DOM tests are separate.
test("L12-S01: TSX parses without diagnostics", () => {
  assert.equal(ast.parseDiagnostics.length, 0);
});
test("L12-S02: password input has a unique useId-based id", () => {
  assert.match(source, /import\s*\{[^}]*\buseId\b[^}]*\}\s*from\s*["']react["']/);
  assert.match(source, /const passwordInputId = useId\(\)/);
  assert.equal(input.id, "{passwordInputId}");
});
test("L12-S03: text label targets password input, not an anonymous input", () => {
  assert.equal(label.htmlFor, "{passwordInputId}");
});
test("L12-S04: failed authentication marks the input invalid and connects the alert", () => {
  assert.equal(input["aria-invalid"], "{!!error}");
  assert.equal(input["aria-describedby"], "{error ? passwordErrorId : undefined}");
  assert.match(source, /const passwordErrorId = useId\(\)/);
});
test("L12-S05: visibility control has a changing screen-reader name", () => {
  assert.ok(toggle, "button with dynamic aria-label must exist");
  assert.match(toggle["aria-label"], /Pokaż hasło widza/);
  assert.match(toggle["aria-label"], /Ukryj hasło widza/);
});
test("L12-S06: visibility button exposes state and controls relationship", () => {
  assert.ok(toggle);
  assert.equal(toggle["aria-controls"], "{passwordInputId}");
  assert.equal(toggle["aria-pressed"], "{showPass}");
  assert.equal(toggle.type, '"button"');
});
test("L12-S07: visibility toggle has keyboard focus and a minimum click target", () => {
  assert.ok(toggle);
  const className = toggle.className ?? "";
  assert.match(className, /focus-visible:ring-2/);
  assert.match(className, /min-h-9/);
  assert.match(className, /min-w-9/);
});
test("L12-S08: decorative eye icons are hidden from assistive technology", () => {
  assert.match(source, /<EyeOff\s+aria-hidden="true"\s+className="w-4 h-4"\s*\/>/);
  assert.match(source, /<Eye\s+aria-hidden="true"\s+className="w-4 h-4"\s*\/>/);
});
test("L12-S09: authentication error is an associated accessible alert", () => {
  assert.match(source, /<div\s+id=\{passwordErrorId\}\s+role="alert"/);
  assert.match(source, /\{error\}/);
});
test("L12-S10: login behavior remains routed through original API and existing form", () => {
  assert.match(source, /const token = await apiViewerLogin\(tournamentId, password\)/);
  assert.match(source, /onSuccess\(token\)/);
  assert.match(source, /<form onSubmit=\{handleSubmit\}/);
});
