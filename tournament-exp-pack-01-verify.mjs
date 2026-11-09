import {
  assertInstalledStructure,
  assertSourceWhitelist,
  runPnpm,
} from "./tournament-exp-pack-01-lib.mjs";

try {
  console.log("[tournament-exp-pack-01] 1/4 kontrola struktury...");
  assertInstalledStructure();

  console.log("[tournament-exp-pack-01] 2/4 kontrola whitelisty zmian frontendowych...");
  assertSourceWhitelist();

  console.log("[tournament-exp-pack-01] 3/4 typecheck + testy...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "typecheck"]);
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "test"]);

  console.log("[tournament-exp-pack-01] 4/4 build...");
  runPnpm(["--filter", "@workspace/tournament-manager", "run", "build"]);

  // Build może odświeżyć wygenerowany public/stream/animated-effects/index.html.
  // Whitelista źródeł nadal powinna pozostać czysta poza Pack 01.
  assertSourceWhitelist();

  console.log("");
  console.log("[tournament-exp-pack-01] VERIFY PASS");
  console.log("Pack 01 przeszedł kontrolę struktury, typecheck, testy i build.");
} catch (error) {
  console.error("");
  console.error("[tournament-exp-pack-01] VERIFY FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
