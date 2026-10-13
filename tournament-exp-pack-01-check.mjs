import {
  assertBaseline,
  assertInstalledStructure,
  BASELINE_COMMIT,
} from "./tournament-exp-pack-01-lib.mjs";

try {
  const result = assertBaseline();
  if (result.alreadyInstalled) {
    assertInstalledStructure();
    console.log("[tournament-exp-pack-01] PASS: paczka jest już poprawnie zainstalowana.");
  } else {
    console.log(`[tournament-exp-pack-01] PASS: repo jest gotowe do instalacji (baseline ${BASELINE_COMMIT}).`);
    console.log("Brak zmian został zapisany. Możesz uruchomić:");
    console.log("  node tournament-exp-pack-01-install.mjs");
  }
} catch (error) {
  console.error("[tournament-exp-pack-01] CHECK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
