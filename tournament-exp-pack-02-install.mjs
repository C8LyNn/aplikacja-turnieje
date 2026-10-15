import {
  assertReady,
  backup,
  install,
  assertInstalled,
  rollback,
} from "./tournament-exp-pack-02-lib.mjs";

let madeBackup = false;

try {
  const state = assertReady();

  if (state.alreadyInstalled) {
    assertInstalled();
    console.log("[Pack 02 expanded] Pack jest już zainstalowany.");
    process.exit(0);
  }

  backup();
  madeBackup = true;
  install();
  assertInstalled();

  console.log("[Pack 02 expanded] INSTALL PASS");
  console.log("Następnie: node tournament-exp-pack-02-verify.mjs");
} catch (error) {
  console.error("[Pack 02 expanded] INSTALL FAIL");
  console.error(error?.message ?? error);

  if (madeBackup) {
    try {
      rollback();
      console.error("Zmiany zostały automatycznie cofnięte.");
    } catch (rollbackError) {
      console.error("Automatyczny rollback również się nie powiódł:");
      console.error(rollbackError?.message ?? rollbackError);
    }
  }

  process.exitCode = 1;
}
