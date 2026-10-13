import {
  assertInstalled,
  runFocusedTest,
} from "./tournament-exp-pack-01-test-hotfix-lib.mjs";

try {
  assertInstalled();
  console.log("[tournament-exp-pack-01-test-hotfix] Uruchamiam 14 testów Experimental...");
  runFocusedTest();
  console.log("");
  console.log("[tournament-exp-pack-01-test-hotfix] VERIFY PASS");
} catch (error) {
  console.error("");
  console.error("[tournament-exp-pack-01-test-hotfix] VERIFY FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
