import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "artifacts/animated-effects/src/main.ts");
const backup = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-18-diagnostic-isolation-2026-09-28_23-47-00-470\\artifacts\\animated-effects\\src\\main.ts";

if (!fs.existsSync(backup)) {
  console.error("Brak backupu:", backup);
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("Diagnostic Isolation Pack 18 cofnięty.");
