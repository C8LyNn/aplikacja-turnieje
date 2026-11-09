import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-08-full-ui-batch-gif-2026-09-27_21-51-38-218";
const manifestPath = path.join(
  backupRoot,
  "backup-manifest.json"
);

if (!fs.existsSync(manifestPath)) {
  console.error("Brak manifestu backupu:", manifestPath);
  process.exit(1);
}

const manifest =
  JSON.parse(
    fs.readFileSync(
      manifestPath,
      "utf8"
    )
  );

const existed =
  new Set(
    manifest.existed
  );

for (const relative of manifest.touched) {
  const target =
    path.join(
      root,
      relative
    );

  const backup =
    path.join(
      backupRoot,
      relative
    );

  if (existed.has(relative)) {
    if (!fs.existsSync(backup)) {
      console.error("Brak pliku backupu:", relative);
      process.exit(1);
    }

    fs.mkdirSync(
      path.dirname(target),
      { recursive: true }
    );

    fs.copyFileSync(
      backup,
      target
    );
  } else {
    fs.rmSync(
      target,
      {
        recursive: true,
        force: true,
      }
    );
  }
}

console.log("Pack 08 cofnięty. Uruchom: pnpm install");
