import { assertReady } from "./tournament-exp-pack-01-test-hotfix-lib.mjs";

try {
  const state = assertReady();
  console.log(
    state.alreadyInstalled
      ? "[tournament-exp-pack-01-test-hotfix] PASS: hotfix jest już zainstalowany."
      : "[tournament-exp-pack-01-test-hotfix] PASS: można zainstalować hotfix.",
  );
  if (!state.alreadyInstalled) console.log("Uruchom: node tournament-exp-pack-01-test-hotfix-install.mjs");
} catch (error) {
  console.error("[tournament-exp-pack-01-test-hotfix] CHECK FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
