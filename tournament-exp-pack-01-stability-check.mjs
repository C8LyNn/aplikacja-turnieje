import { assertReady } from "./tournament-exp-pack-01-stability-lib.mjs";

try {
  const state = assertReady();
  if (state.alreadyInstalled) {
    console.log("[tournament-exp-pack-01-stability] PASS: aktualizacja jest już zainstalowana.");
  } else {
    console.log("[tournament-exp-pack-01-stability] PASS: repo jest gotowe do aktualizacji.");
    console.log("Uruchom:");
    console.log("  node tournament-exp-pack-01-stability-install.mjs");
  }
} catch (error) {
  console.error("[tournament-exp-pack-01-stability] CHECK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
