import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "tournament-exp-pack-02-lib.mjs");

if (!fs.existsSync(file)) {
  console.error("[Pack 02 hotfix 02] FAIL — brak tournament-exp-pack-02-lib.mjs w bieżącym katalogu.");
  process.exit(1);
}

let source = fs.readFileSync(file, "utf8");

const broken =
  '<div className={\\`grid md:grid-cols-3 gap-6 ${isExperimental ? "mt-4" : ""}\\`}>';
const fixed =
  '<div className={\\`grid md:grid-cols-3 gap-6 \\${isExperimental ? "mt-4" : ""}\\`}>';

if (source.includes(fixed)) {
  console.log("[Pack 02 hotfix 02] Hotfix runtime jest już zastosowany.");
  process.exit(0);
}

if (!source.includes(broken)) {
  console.error("[Pack 02 hotfix 02] FAIL — nie rozpoznaję oczekiwanej wersji instalatora.");
  process.exit(1);
}

source = source.replace(broken, fixed);
fs.writeFileSync(file, source, "utf8");

console.log("[Pack 02 hotfix 02] PASS — poprawiono niezamierzoną interpolację isExperimental w instalatorze.");
