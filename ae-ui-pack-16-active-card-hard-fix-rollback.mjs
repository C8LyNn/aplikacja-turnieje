import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "artifacts/animated-effects/src/pack06/install.ts");
const backup = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-16-active-card-hard-fix-2026-09-28_23-00-20-514\\artifacts\\animated-effects\\src\\pack06\\install.ts";

if (!fs.existsSync(backup)) {
  console.error("Brak backupu:", backup);
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("Pack 16 cofnięty.");
