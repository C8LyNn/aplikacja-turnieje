import {
  assertReady,
  assertInstalled,
  backup,
  install,
  rollback,
} from "./tournament-exp-pack-01-test-hotfix-lib.mjs";

let madeBackup = false;

try {
  const state = assertReady();
  if (state.alreadyInstalled) {
    assertInstalled();
    console.log("[tournament-exp-pack-01-test-hotfix] Hotfix jest już zainstalowany.");
    process.exit(0);
  }

  backup();
  madeBackup = true;
  install();
  assertInstalled();

  console.log("[tournament-exp-pack-01-test-hotfix] Instalacja zakończona.");
  console.log("Uruchom: node tournament-exp-pack-01-test-hotfix-verify.mjs");
} catch (error) {
  console.error("[tournament-exp-pack-01-test-hotfix] INSTALL FAIL");
  console.error(error?.message ?? error);
  if (madeBackup) {
    try {
      rollback();
      console.error("Hotfix został automatycznie cofnięty.");
    } catch (rollbackError) {
      console.error("Rollback również się nie powiódł:");
      console.error(rollbackError?.message ?? rollbackError);
    }
  }
  process.exitCode = 1;
}
