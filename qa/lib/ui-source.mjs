// #323-E moved the UI texts of components into the translation catalog: a component now calls t("key") and the Polish
// sentence lives in src/i18n/catalog/pl*.ts. Source-contract tests that check what the organizer sees must therefore
// read the component source TOGETHER WITH the Polish texts of exactly the keys that component uses — not the whole
// catalog, so "this component shows X" and "this component never shows Y" keep their meaning.
import { readFileSync } from "node:fs";

const CATALOGS = [
  "artifacts/tournament-manager/src/i18n/catalog/pl.ts",
  "artifacts/tournament-manager/src/i18n/catalog/pl.generated.ts",
];

let polish;
function polishTexts() {
  if (polish) return polish;
  polish = new Map();
  for (const file of CATALOGS) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/"([A-Za-z0-9_.]+)":\s*"((?:[^"\\]|\\.)*)"/g)) {
      polish.set(match[1], JSON.parse(`"${match[2]}"`));
    }
  }
  return polish;
}

/** The component source followed by the Polish catalog text of every t("key") it references. */
export function readUiSource(path) {
  const source = readFileSync(path, "utf8");
  const texts = polishTexts();
  const used = [...new Set([...source.matchAll(/\bt\(\s*"([A-Za-z0-9_.]+)"/g)].map((match) => match[1]))];
  const missing = used.filter((key) => !texts.has(key));
  if (missing.length) throw new Error(`${path}: keys without a Polish text: ${missing.slice(0, 5).join(", ")}`);
  return `${source}\n/* Polish UI texts of the keys used above */\n${used.map((key) => texts.get(key)).join("\n")}\n`;
}
