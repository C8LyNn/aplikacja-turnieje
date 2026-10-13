import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-22-library-interaction-2026-09-29_00-12-22-388";
const files = ["artifacts/animated-effects/src/main.ts","artifacts/animated-effects/src/style.css","artifacts/animated-effects/src/pack06/polish02.ts"];

for (const relative of files) {
  const backup = path.join(backupRoot, relative);
  const target = path.join(root, relative);

  if (!fs.existsSync(backup)) {
    console.error("Brak backupu:", backup);
    process.exit(1);
  }

  fs.copyFileSync(backup, target);
}

console.log("Library Interaction Pack 22 cofnięty.");
