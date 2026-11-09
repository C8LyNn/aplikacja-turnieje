import { rollback } from "./tournament-exp-pack-01-test-hotfix-lib.mjs";

try {
  rollback();
  console.log("[tournament-exp-pack-01-test-hotfix] Rollback zakończony.");
} catch (error) {
  console.error("[tournament-exp-pack-01-test-hotfix] ROLLBACK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
