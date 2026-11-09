import { assertReady } from "./tournament-exp-pack-01-expanded-lib.mjs";

try {
  const state = assertReady();
  if (state.alreadyInstalled) {
    console.log("[tournament-exp-pack-01-expanded] PASS: rozszerzona wersja jest już zainstalowana.");
  } else {
    console.log("[tournament-exp-pack-01-expanded] PASS: repo jest gotowe do aktualizacji.");
    console.log("Uruchom:");
    console.log("  node tournament-exp-pack-01-expanded-install.mjs");
  }
} catch (error) {
  console.error("[tournament-exp-pack-01-expanded] CHECK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
