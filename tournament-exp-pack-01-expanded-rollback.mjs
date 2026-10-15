import { rollback } from "./tournament-exp-pack-01-expanded-lib.mjs";

try {
  rollback();
  console.log("[tournament-exp-pack-01-expanded] Rollback zakończony.");
} catch (error) {
  console.error("[tournament-exp-pack-01-expanded] ROLLBACK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
