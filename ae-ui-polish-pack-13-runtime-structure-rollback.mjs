import fs from "node:fs";
import path from "node:path";

const root =
  process.cwd();

const backupRoot =
  "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-13-ui-runtime-structure-2026-09-28_22-18-34-065";

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
    fs.mkdirSync(
      path.dirname(
        target,
      ),
      {
        recursive:
          true,
      },
    );

    fs.copyFileSync(
      backup,
      target,
    );
  } else {
    fs.rmSync(
      target,
      {
        recursive:
          true,
        force:
          true,
      },
    );
  }
}

console.log(
  "UI Polish Pack 13 cofnięty.",
);
