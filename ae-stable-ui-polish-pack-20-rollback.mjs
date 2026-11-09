import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-20-stable-ui-polish-2026-09-28_23-54-15-214";

const manifest =
  JSON.parse(
    fs.readFileSync(
      path.join(
        backupRoot,
        "backup-manifest.json",
      ),
      "utf8",
    ),
  );

const existed =
  new Set(
    manifest.existed,
  );

for (
  const relative of
    manifest.touched
) {
  const target =
    path.join(
      root,
      relative,
    );

  const backup =
    path.join(
      backupRoot,
      relative,
    );

  if (
    existed.has(
      relative,
    )
  ) {
    fs.copyFileSync(
      backup,
      target,
    );
  } else {
    fs.rmSync(
      target,
      {
        force: true,
      },
    );
  }
}

console.log(
  "Stable UI Polish Pack 20 cofnięty.",
);
