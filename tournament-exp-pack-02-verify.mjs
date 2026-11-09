import { assertInstalled, runPnpm } from "./tournament-exp-pack-02-lib.mjs";

try {
  console.log("[Pack 02 expanded] 1/4 struktura, overview, dashboard i route-leak checks...");
  assertInstalled();

  console.log("[Pack 02 expanded] 2/4 typecheck...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "typecheck"]);

  console.log("[Pack 02 expanded] 3/4 pełne testy frontendu...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "test"]);

  console.log("[Pack 02 expanded] 4/4 build...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "build"]);

  console.log("");
  console.log("[Pack 02 expanded] VERIFY PASS");
} catch (error) {
  console.error("");
  console.error("[Pack 02 expanded] VERIFY FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
