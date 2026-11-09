import { rollback } from "./tournament-exp-pack-01-stability-lib.mjs";

try {
  rollback();
  console.log("[tournament-exp-pack-01-stability] Rollback zakończony.");
} catch (error) {
  console.error("[tournament-exp-pack-01-stability] ROLLBACK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
