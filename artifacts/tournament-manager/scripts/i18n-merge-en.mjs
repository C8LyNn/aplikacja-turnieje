#!/usr/bin/env node
// #323-E · merges English translations ({ "key": "English text" } JSON files) into src/i18n/catalog/en.generated.ts.
//   node scripts/i18n-merge-en.mjs <translations.json…>     → also prints keys of pl.generated still without English
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const EN = path.join(ROOT, "src/i18n/catalog/en.generated.ts");
const PL = path.join(ROOT, "src/i18n/catalog/pl.generated.ts");
const body = (file) => { const s = readFileSync(file, "utf8"); return JSON.parse(s.slice(s.indexOf("= {") + 2, s.lastIndexOf("}") + 1)); };
const en = body(EN);
const pl = body(PL);
for (const file of process.argv.slice(2)) Object.assign(en, JSON.parse(readFileSync(file, "utf8")));
const unknown = Object.keys(en).filter((k) => !(k in pl));
for (const k of unknown) delete en[k];
const sorted = Object.fromEntries(Object.entries(en).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(EN, `// English texts for the generated keys (scripts/i18n-merge-en.mjs). Every Polish key must be here — a missing one is a type error.\nimport type { plGenerated } from "./pl.generated";\n// prettier-ignore\nexport const enGenerated: Record<keyof typeof plGenerated, string> = ${JSON.stringify(sorted, null, 2)};\n`);
const missing = Object.keys(pl).filter((k) => !(k in sorted));
console.log(JSON.stringify({ english: Object.keys(sorted).length, polish: Object.keys(pl).length, missing: missing.length, droppedUnknown: unknown.length }));
if (missing.length) console.log(missing.slice(0, 50).join("\n"));
