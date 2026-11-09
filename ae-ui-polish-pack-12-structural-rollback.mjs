import fs from "node:fs";
import path from "node:path";

const root =
  process.cwd();

const backupRoot =
  "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-12-ui-structural-2026-09-28_22-07-54-249";

for (
  const relative of [
    "artifacts/animated-effects/src/style.css",
    "artifacts/animated-effects/src/pack06/install.ts",
  ]
) {
  const backup =
    path.join(
      backupRoot,
      relative,
    );

  const target =
    path.join(
      root,
      relative,
    );

  if (
    !fs.existsSync(
      backup,
    )
  ) {
    console.error(
      "Brak backupu:",
      backup,
    );
    process.exit(
      1,
    );
  }

  fs.copyFileSync(
    backup,
    target,
  );
}

console.log(
  "UI Polish Pack 12 cofnięty.",
);
