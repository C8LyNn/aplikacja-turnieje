// #323-E · "is this literal Polish?" for the extractor and the completeness scanner.
// A text is Polish when it has Polish letters or a word that occurs in the Polish catalog and never in the English one
// (so "Start", "Format" or "Swiss", used in both languages, do not count). The vocabulary grows with the catalog.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function catalog(file) {
  if (!existsSync(file)) return {};
  const source = readFileSync(file, "utf8");
  const json = source.slice(source.indexOf("{", source.indexOf("= {")), source.lastIndexOf("}") + 1);
  try { return JSON.parse(json); } catch { return {}; }
}
const text = (v) => (typeof v === "string" ? v : Object.values(v).join(" "));
const wordsOf = (text) => text.toLowerCase().match(/[a-ząćęłńóśźż]{3,}/g) ?? [];

export function polishDetector(root) {
  // only keys translated in both languages: a fresh, untranslated Polish entry (which may hold a technical word such as
  // "classic" picked up by mistake) must not teach the detector that this word is Polish
  const pl = catalog(path.join(root, "src/i18n/catalog/pl.generated.ts"));
  const en = catalog(path.join(root, "src/i18n/catalog/en.generated.ts"));
  const both = Object.keys(pl).filter((k) => k in en);
  const plWords = new Set(both.flatMap((k) => wordsOf(text(pl[k]))));
  const enWords = new Set(both.flatMap((k) => wordsOf(text(en[k]))));
  for (const word of ["the", "and", "for", "with", "from", "not", "you", "are", "all", "start", "test", "status", "format", "online", "offline", "live", "seed", "swiss", "bye"]) enWords.add(word);
  const polishOnly = new Set([...plWords].filter((w) => !enWords.has(w)));
  return (text) => /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/.test(text) || wordsOf(text).some((w) => polishOnly.has(w));
}
