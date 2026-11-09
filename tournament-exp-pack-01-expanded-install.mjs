import {
  assertReady,
  assertInstalled,
  backup,
  installTemplates,
  rollback,
} from "./tournament-exp-pack-01-expanded-lib.mjs";

let backupCreated = false;

try {
  const state = assertReady();
  if (state.alreadyInstalled) {
    assertInstalled();
    console.log("[tournament-exp-pack-01-expanded] Aktualizacja jest już zainstalowana.");
    process.exit(0);
  }

  backup();
  backupCreated = true;
  installTemplates();
  assertInstalled();

  console.log("[tournament-exp-pack-01-expanded] Instalacja zakończona.");
  console.log("Uruchom:");
  console.log("  node tournament-exp-pack-01-expanded-verify.mjs");
} catch (error) {
  console.error("[tournament-exp-pack-01-expanded] INSTALL FAIL");
  console.error(error?.message ?? error);
  if (backupCreated) {
    try {
      rollback();
      console.error("Zmiany zostały automatycznie cofnięte.");
    } catch (rollbackError) {
      console.error("Automatyczny rollback nie powiódł się:");
      console.error(rollbackError?.message ?? rollbackError);
    }
  }
  process.exitCode = 1;
}
