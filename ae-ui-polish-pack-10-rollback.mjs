import fs from "node:fs";
import path from "node:path";

const root =
  process.cwd();

const backupRoot =
  "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-10-ui-polish-2026-09-28_21-36-00-817";

const manifestPath =
  path.join(
    backupRoot,
    "backup-manifest.json",
  );

if (
  !fs.existsSync(
    manifestPath,
  )
) {
  console.error(
    "Brak backupu:",
    manifestPath,
  );
  process.exit(
    1,
  );
}

const manifest =
  JSON.parse(
    fs.readFileSync(
      manifestPath,
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
  "UI Polish Pack 10 cofnięty.",
);
