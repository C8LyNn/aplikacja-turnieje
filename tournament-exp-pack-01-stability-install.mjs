import {
  assertReady,
  assertInstalled,
  backup,
  installTemplates,
  rollback,
} from "./tournament-exp-pack-01-stability-lib.mjs";

let madeBackup = false;

try {
  const state = assertReady();
  if (state.alreadyInstalled) {
    assertInstalled();
    console.log("[tournament-exp-pack-01-stability] Aktualizacja jest już zainstalowana.");
    process.exit(0);
  }

  backup();
  madeBackup = true;
  installTemplates();
  assertInstalled();

  console.log("[tournament-exp-pack-01-stability] Instalacja zakończona.");
  console.log("Uruchom:");
  console.log("  node tournament-exp-pack-01-stability-verify.mjs");
} catch (error) {
  console.error("[tournament-exp-pack-01-stability] INSTALL FAIL");
  console.error(error?.message ?? error);
  if (madeBackup) {
    try {
      rollback();
      console.error("Zmiany zostały automatycznie cofnięte.");
    } catch (rollbackError) {
      console.error("Rollback również się nie powiódł:");
      console.error(rollbackError?.message ?? rollbackError);
    }
  }
  process.exitCode = 1;
}
