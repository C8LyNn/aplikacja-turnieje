import fs from "node:fs";
import path from "node:path";

const root =
  process.cwd();

const styleFile =
  path.join(
    root,
    "artifacts/animated-effects/src/style.css",
  );

const backup =
  "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-11-ui-compact-2026-09-28_21-56-54-925\\artifacts\\animated-effects\\src\\style.css";

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
  styleFile,
);

console.log(
  "UI Polish Pack 11 cofnięty.",
);
