import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const target =
  path.join(
    root,
    "artifacts/animated-effects/src/pack09/uiStructuralFix.ts",
  );

const backup =
  "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-13-freeze-hotfix-2026-09-28_22-34-22-846\\artifacts\\animated-effects\\src\\pack09\\uiStructuralFix.ts";

if (!fs.existsSync(backup)) {
  console.error("Brak backupu:", backup);
  process.exit(1);
}

fs.copyFileSync(
  backup,
  target,
);

console.log("Pack 13 freeze hotfix cofnięty.");
