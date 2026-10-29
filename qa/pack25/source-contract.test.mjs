import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
const read = p => readFileSync(path.join(process.cwd(),p),"utf8");
const server=read("artifacts/api-server/src/routes/tournament-se-correction-readiness.ts");
const ui=read("artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx");
const spec=read("lib/api-spec/openapi.yaml");
const ci=read(".github/workflows/tournament-correction-ci.yml");
const engine=read("artifacts/api-server/src/domain/tournament/se-correction-impact-graph.ts");
test("Pack25 output is generated from consistent existing SE readiness transaction",()=>{
  assert.match(server,/deriveSeCorrectionImpactGraph\(\{/);
  assert.match(server,/matchId:match\.id,stage,stages,stageMatches:matches,actionPlan/);
  assert.match(server,/isolationLevel:\s*["']repeatable read["']\s*,\s*accessMode:\s*["']read only["']/);
});
test("no extra write route; reuses organizer access and read-only endpoint",()=>{
  assert.match(server,/requireOrganizer\(req,res,tournamentId\)/);
  assert.match(server,/se-correction-readiness/);
  assert.doesNotMatch(engine,/\b(?:insert|update|delete)\s*\(/);
  assert.doesNotMatch(engine,/\b(?:fetch|db|localStorage|sessionStorage)\s*\./);
});
test("server returns graph together with prior diagnostic and action plan",()=>{
  assert.match(server,/return \{ \.\.\.result, actionPlan, diagnostic, impactGraph(?:, impactRiskReport)? \}/);
});
test("panel includes graph type and field",()=>{
  assert.match(ui,/type SeImpactGraph = \{/);
  assert.match(ui,/impactGraph: SeImpactGraph/);
});
test("panel only renders the same chosen match and requires advisory flags",()=>{
  assert.match(ui,/seReadiness\.impactGraph\.matchId === chosen\?\.id/);
  assert.match(ui,/seReadiness\.impactGraph\.executionEnabled === false/);
  assert.match(ui,/seReadiness\.impactGraph\.writePerformed === false/);
});
test("panel distinguishes actual slot from possible future path",()=>{
  assert.match(ui,/directSuccessorCount/);assert.match(ui,/potentialLaterMatchCount/);
  assert.match(ui,/item\.relationship/); // relation exists in UI type
  assert.match(ui,/alreadyStarted/);
});
test("panel visibly warns when graph is incomplete",()=>{
  assert.match(ui,/status === "incomplete"/);
  assert.match(ui,/Niekompletny graf/);
});
test("panel displays later stages as separate assessment",()=>{
  assert.match(ui,/laterStages\.map/);
  assert.match(ui,/osobnej oceny routingu/);
});
test("OpenAPI contains advisory-only schema and explicit no-write flags",()=>{
  assert.match(spec,/impactGraph:\s*\n\s*type: object/);
  assert.match(spec,/se_correction_impact_graph/);
  assert.match(spec,/status: \{ type: string, enum: \[outlined, review_required, incomplete\] \}/);
  assert.match(spec,/writePerformed: \{ type: boolean, const: false \}/);
});
test("CI executes domain tests and static contract",()=>{
  assert.match(ci,/test\/se-correction-impact-graph\.test\.ts/);
  assert.match(ci,/qa\/pack25\/source-contract\.test\.mjs/);
});
test("CI includes both push and PR path filters",()=>{
  assert.equal((ci.match(/qa\/pack25\/\*\*/g)||[]).length,2);
});
test("existing safety history and triage remain intact",()=>{
  assert.match(ui,/seAssessmentHistorySummary/);
  assert.match(ui,/seRemediationPriority/);
});
