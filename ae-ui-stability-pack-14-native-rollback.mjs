import fs from "node:fs";
import path from "node:path";

const root=process.cwd();

const backupRoot=
  "C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-14-ui-native-stability-2026-09-28_22-40-44-177";

for(const relative of[
  "artifacts/animated-effects/src/main.ts",
  "artifacts/animated-effects/src/pack06/install.ts",
  "artifacts/animated-effects/src/style.css",
]){
  const backup=
    path.join(
      backupRoot,
      relative,
    );

  const target=
    path.join(
      root,
      relative,
    );

  if(!fs.existsSync(backup)){
    console.error(
      "Brak backupu:",
      backup,
    );
    process.exit(1);
  }

  fs.copyFileSync(
    backup,
    target,
  );
}

console.log(
  "UI Stability Pack 14 cofnięty.",
);
