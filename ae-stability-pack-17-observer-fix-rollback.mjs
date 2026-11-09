import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-17-observer-stability-2026-09-28_23-22-52-800";

for (const relative of [
  "artifacts/animated-effects/src/pack09/customization.ts",
  "artifacts/animated-effects/src/pack08/uiQa.ts",
]) {
  const source =
    path.join(backupRoot, relative);

  const target =
    path.join(root, relative);

  if (!fs.existsSync(source)) {
    console.error("Brak backupu:", source);
    process.exit(1);
  }

  fs.copyFileSync(source, target);
}

console.log("Pack 17 cofnięty.");
