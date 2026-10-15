import { rollback } from "./tournament-exp-pack-02-lib.mjs";

try {
  rollback();
  console.log("[Pack 02 expanded] ROLLBACK PASS");
} catch (error) {
  console.error("[Pack 02 expanded] ROLLBACK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
