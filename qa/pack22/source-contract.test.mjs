/** Pack22: no DB, no browser, no deployment. Run from workspace root. */
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {test} from "node:test";
const get=(path)=>readFileSync(path,"utf8");
test("snapshot compare is in-memory, advisory and never stores auth-like tokens",()=>{
  const s=get("artifacts/tournament-manager/src/lib/se-diagnostic-comparison.ts");
  assert.match(s,/kind: "different_scope"/);
  assert.match(s,/executionEnabled: false/);
  assert.doesNotMatch(s,/(?:localStorage|sessionStorage|fetch\(|\.update\(|\.insert\(|\.delete\()/);
});
test("panel preserves same-score prior analysis through a refreshed preview",()=>{
  const s=get("artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx");
  assert.match(s,/resetOnChange\(true\)/);
  assert.match(s,/setSeAssessmentPair\(/);
  assert.match(s,/compareSeAssessments\(/);
});
test("panel removes comparison when selected match or score changes",()=>{
  const s=get("artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx");
  assert.match(s,/setSeAssessmentPair\(null\)/);
  assert.match(s,/resetOnChange\(\);/);
});
test("panel labels differences as non-authoritative",()=>{
  const s=get("artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx");
  assert.match(s,/Dodane blokady/);
  assert.match(s,/Usunięte z podglądu/);
  assert.match(s,/Nie jest to zgoda/);
});
test("ci runs Pack22 unit and source contract gates",()=>{
  const s=get(".github/workflows/tournament-correction-ci.yml");
  assert.match(s,/se-diagnostic-comparison\.test\.ts/);
  assert.match(s,/qa\/pack22\/source-contract\.test\.mjs/);
});
test("no new SE write endpoints have been enabled",()=>{
  const s=get("artifacts/api-server/src/routes/index.ts");
  assert.doesNotMatch(s,/tournament-se-correction-execute/);
  assert.ok(existsSync("artifacts/tournament-manager/src/lib/se-diagnostic-comparison.ts"));
});
