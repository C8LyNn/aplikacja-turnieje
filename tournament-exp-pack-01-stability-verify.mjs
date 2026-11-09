import { assertInstalled, runPnpm } from "./tournament-exp-pack-01-stability-lib.mjs";

try {
  console.log("[tournament-exp-pack-01-stability] 1/4 struktura...");
  assertInstalled();

  console.log("[tournament-exp-pack-01-stability] 2/4 typecheck...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "typecheck"]);

  console.log("[tournament-exp-pack-01-stability] 3/4 testy...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "test"]);

  console.log("[tournament-exp-pack-01-stability] 4/4 build...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "build"]);

  console.log("");
  console.log("[tournament-exp-pack-01-stability] VERIFY PASS");
} catch (error) {
  console.error("");
  console.error("[tournament-exp-pack-01-stability] VERIFY FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
