import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-06-polish-02-2026-09-27_14-26-42-722";
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(backupRoot, "backup-manifest.json"),
    "utf8"
  )
);
const existed = new Set(manifest.existed);

for (const rel of manifest.touched) {
  const target = path.join(root, rel);
  const source = path.join(backupRoot, rel);

  if (existed.has(rel)) {
    fs.mkdirSync(path.dirname(target), { recursive:true });
    fs.copyFileSync(source, target);
  } else {
    fs.rmSync(target, { recursive:true, force:true });
  }
}

console.log("Pack 06 Polish 02 cofnięty.");
