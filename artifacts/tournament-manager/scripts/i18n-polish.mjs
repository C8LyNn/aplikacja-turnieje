// #323-E · "is this literal Polish?" for the extractor and the completeness scanner.
// A text is Polish when it has Polish letters or a word that occurs in the Polish catalog and never in the English one
// (so "Start", "Format" or "Swiss", used in both languages, do not count). The vocabulary grows with the catalog.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function catalogValues(file) {
  if (!existsSync(file)) return [];
  const source = readFileSync(file, "utf8");
  const json = source.slice(source.indexOf("{", source.indexOf("= {")), source.lastIndexOf("}") + 1);
  try { return Object.values(JSON.parse(json)).map((v) => (typeof v === "string" ? v : Object.values(v).join(" "))); } catch { return []; }
}
const wordsOf = (text) => text.toLowerCase().match(/[a-ząćęłńóśźż]{3,}/g) ?? [];

export function polishDetector(root) {
  const plWords = new Set(catalogValues(path.join(root, "src/i18n/catalog/pl.generated.ts")).flatMap(wordsOf));
  const enWords = new Set(catalogValues(path.join(root, "src/i18n/catalog/en.generated.ts")).flatMap(wordsOf));
  for (const word of ["the", "and", "for", "with", "from", "not", "you", "are", "all", "start", "test", "status", "format", "online", "offline", "live", "seed", "swiss", "bye"]) enWords.add(word);
  const polishOnly = new Set([...plWords].filter((w) => !enWords.has(w)));
  return (text) => /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/.test(text) || wordsOf(text).some((w) => polishOnly.has(w));
}
