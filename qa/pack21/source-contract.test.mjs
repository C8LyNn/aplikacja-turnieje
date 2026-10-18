/** Pack21 no-database source contract, from monorepo root. */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {test} from "node:test";
const get=p=>readFileSync(p,"utf8");
const withoutComments = source => source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '');
test("diagnostic never authorizes a SE write",()=>{
  const s=get("artifacts/api-server/src/domain/tournament/se-correction-diagnostic.ts");
  assert.match(s,/executionEnabled:false/);assert.match(s,/writePerformed:false/);
  assert.match(s,/validity:"snapshot_only"/);
  assert.doesNotMatch(s,/\btx\.(?:update|insert|delete)\s*\(/);
});
test("diagnostic generated inside one read-only repeatable-read DB snapshot",()=>{
  const s=get("artifacts/api-server/src/routes/tournament-se-correction-readiness.ts");
  assert.match(s,/deriveSeCorrectionDiagnostic\(/);
  assert.match(withoutComments(s),/\},\s*\{(?=[^{}]*\bisolationLevel\s*:\s*["']repeatable read["'])(?=[^{}]*\baccessMode\s*:\s*["']read only["'])(?![^{}]*\baccessMode\s*:[^{}]*\baccessMode\s*:)(?![^{}]*\bisolationLevel\s*:[^{}]*\bisolationLevel\s*:)[^{}]*\}\s*\)/);
  assert.doesNotMatch(s,/\btx\.(?:update|insert|delete)\s*\(/);
});
test("assessment is tied to original completion action and proposed score",()=>{
  const s=get("artifacts/api-server/src/domain/tournament/se-correction-diagnostic.ts");
  assert.match(s,/input\.expectedCompletionActionId/);
  assert.match(s,/p\.score\.current,p\.score\.proposed/);
});
test("client displays human readable blockers and assessment ID as advisory",()=>{
  const s=get("artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx");
  assert.match(s,/seReadiness\.diagnostic\.blockers/);
  assert.match(s,/Identyfikator analizy/);
  assert.match(s,/Tylko podgląd/);
});
test("OpenAPI exposes diagnostics without write capability",()=>{
  const s=get("lib/api-spec/openapi.yaml");
  assert.match(s,/se_correction_diagnostic/);
  assert.match(s,/assessmentId:/);
});
test("CI runs the new tests and keeps prior gates",()=>{
  const s=get(".github/workflows/tournament-correction-ci.yml");
  assert.match(s,/test\/se-correction-diagnostic\.test\.ts/);
  assert.match(s,/test\/se-correction-action-plan\.test\.ts/);
  assert.match(s,/qa\/pack21\/source-contract\.test\.mjs/);
});
test("no SE correction write route enabled",()=>{
  const s=get("artifacts/api-server/src/routes/index.ts");
  assert.doesNotMatch(s,/tournament-se-correction-execute/);
  assert.ok(existsSync("artifacts/api-server/src/domain/tournament/se-correction-diagnostic.ts"));
});
