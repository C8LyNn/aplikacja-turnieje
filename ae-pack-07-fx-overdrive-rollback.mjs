import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const backupRoot = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-07-fx-overdrive-2026-09-27_17-42-11-932";
const manifestPath = path.join(backupRoot, "backup-manifest.json");
if (!fs.existsSync(manifestPath)) { console.error("Brak backupu:", manifestPath); process.exit(1); }
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const existed = new Set(manifest.existed);
for (const rel of manifest.touched) {
  const target = path.join(root, rel);
  const backup = path.join(backupRoot, rel);
  if (existed.has(rel)) {
    if (!fs.existsSync(backup)) { console.error("Brak pliku backupu:", rel); process.exit(1); }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
  } else {
    fs.rmSync(target, { recursive: true, force: true });
  }
}
console.log("Pack 07 FX Overdrive cofnięty.");
