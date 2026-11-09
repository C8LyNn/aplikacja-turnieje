import { assertInstalled } from "./tournament-exp-pack-02-lib.mjs";

try {
  assertInstalled();
  console.log("[Pack 02 expanded] ROUTE/UI AUDIT PASS");
  console.log("- Experimental route surface: OK");
  console.log("- Known Stable-route leaks: not detected");
  console.log("- Experimental overview: wired");
  console.log("- Dashboard filters/search: wired");
  console.log("- Density preference: wired");
  console.log("- Draft lifecycle summary: wired");
  console.log("- Organizer context bar: wired");
  console.log("- Host command center: wired");
  console.log("- Accessible dashboard dialogs: wired");
  console.log("- Experimental checklist: wired");
  console.log("- Players workspace: wired");
  console.log("- Stage/Basket presentation surfaces: wired");
  console.log("- Host Focus mode: wired");
  console.log("- Unified query-state hooks: wired");
} catch (error) {
  console.error("[Pack 02 expanded] ROUTE/UI AUDIT FAIL");
  console.error(error?.message ?? error);
  process.exitCode = 1;
}
