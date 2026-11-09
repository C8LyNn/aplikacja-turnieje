import {
  rollbackFromBackup,
} from "./tournament-exp-pack-01-lib.mjs";

try {
  rollbackFromBackup({ removeBackup: true });
  console.log("[tournament-exp-pack-01] Rollback zakończony.");
  console.log("Przywrócono pliki sprzed Pack 01 i usunięto pliki utworzone przez paczkę.");
} catch (error) {
  console.error("[tournament-exp-pack-01] ROLLBACK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
