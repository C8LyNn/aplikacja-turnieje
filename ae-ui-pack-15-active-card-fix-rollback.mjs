import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "artifacts/animated-effects/src/style.css");
const backup = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-15-active-card-2026-09-28_22-55-39-238\\artifacts\\animated-effects\\src\\style.css";

if (!fs.existsSync(backup)) {
  console.error("Brak backupu:", backup);
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("Pack 15 cofnięty.");
