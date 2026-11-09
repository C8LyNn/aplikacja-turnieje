import {
  assertBaseline,
  assertInstalledStructure,
  assertSourceWhitelist,
  copyTemplatesIntoRepo,
  makeBackup,
  patchExistingFiles,
  rollbackFromBackup,
} from "./tournament-exp-pack-01-lib.mjs";

let backupMade = false;

try {
  const state = assertBaseline();
  if (state.alreadyInstalled) {
    assertInstalledStructure();
    console.log("[tournament-exp-pack-01] Pack 01 jest już zainstalowany. Nic nie zmieniono.");
    process.exit(0);
  }

  makeBackup();
  backupMade = true;

  copyTemplatesIntoRepo();
  patchExistingFiles();

  assertInstalledStructure();
  assertSourceWhitelist();

  console.log("[tournament-exp-pack-01] Instalacja zakończona.");
  console.log("Stary /tournaments/new pozostał aktywny.");
  console.log("Nowy wybór wersji: /tournaments/create");
  console.log("Experimental: /experimental/tournaments/new");
  console.log("");
  console.log("Teraz uruchom:");
  console.log("  node tournament-exp-pack-01-verify.mjs");
} catch (error) {
  console.error("[tournament-exp-pack-01] INSTALL FAIL");
  console.error(error?.message ?? error);

  if (backupMade) {
    try {
      rollbackFromBackup({ removeBackup: false });
      console.error("Zmiany Pack 01 zostały automatycznie cofnięte z backupu.");
      console.error("Backup pozostawiono do ręcznej kontroli.");
    } catch (rollbackError) {
      console.error("UWAGA: automatyczny rollback również się nie powiódł:");
      console.error(rollbackError?.message ?? rollbackError);
    }
  }
  process.exitCode = 1;
}
