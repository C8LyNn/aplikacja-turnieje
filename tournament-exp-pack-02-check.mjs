import { assertReady } from "./tournament-exp-pack-02-lib.mjs";

try {
  const state = assertReady();
  console.log(
    state.alreadyInstalled
      ? "[Pack 02 expanded] Pack jest już zainstalowany."
      : "[Pack 02 expanded] CHECK PASS — repo jest kompatybilne.",
  );
  if (!state.alreadyInstalled) {
    console.log("Następnie: node tournament-exp-pack-02-install.mjs");
  }
} catch (error) {
  console.error("[Pack 02 expanded] CHECK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
