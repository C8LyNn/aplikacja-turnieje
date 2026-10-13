import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
const read = p => readFileSync(path.join(process.cwd(),p),"utf8");
const server=read("artifacts/api-server/src/routes/tournament-se-correction-readiness.ts");
const ui=read("artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx");
const spec=read("lib/api-spec/openapi.yaml");
const ci=read(".github/workflows/tournament-correction-ci.yml");
const engine=read("artifacts/api-server/src/domain/tournament/se-correction-impact-risk-report.ts");
const tests=read("artifacts/api-server/test/se-correction-impact-risk-report.test.ts");
test("Pack26 derives risk report only from existing Pack25 consistent snapshot",()=>{
 assert.match(server,/deriveSeCorrectionImpactGraph\(\{/);
 assert.match(server,/deriveSeCorrectionImpactRiskReport\(impactGraph\)/);
 assert.match(server,/\{isolationLevel:"repeatable read",readOnly:true\}/);
});
test("no new API route, reuses organizer-only readiness",()=>{
 assert.match(server,/requireOrganizer\(req,res,tournamentId\)/);
 assert.match(server,/se-correction-readiness/);
});
test("one response includes both graph and report",()=>{
 assert.match(server,/\{ \.\.\.result, actionPlan, diagnostic, impactGraph, impactRiskReport \}/);
});
test("strictly no DB or browser writes in pure report engine",()=>{
 assert.doesNotMatch(engine,/\b(?:db|localStorage|sessionStorage|fetch)\s*\./);
 assert.doesNotMatch(engine,/\b(?:insert|update|delete)\s*\(/);
});
test("report enforces fail-closed flag consistency",()=>{
 assert.match(engine,/g\.advisoryOnly !== true/);
 assert.match(engine,/g\.executionEnabled !== false/);
 assert.match(engine,/g\.writePerformed !== false/);
});
test("panel accepts typed report without enabling execution",()=>{
 assert.match(ui,/type SeImpactRiskReport = \{/);
 assert.match(ui,/impactRiskReport: SeImpactRiskReport/);
 assert.match(ui,/impactRiskReport\.executionEnabled === false/);
 assert.match(ui,/impactRiskReport\.writePerformed === false/);
});
test("UI requires risk report to refer to current SE impact graph",()=>{
 assert.match(ui,/impactRiskReport\.matchId === (?:chosen\?\.id|seReadiness\.impactGraph\.matchId)/);
 assert.match(ui,/impactGraph\.matchId === chosen\?\.id/);
});
test("UI labels confirmed versus potential versus incomplete",()=>{
 assert.match(ui,/(?:Fakt z odczytu|Potwierdzone w odczycie)/);
 assert.match(ui,/Możliwy wpływ/);
 assert.match(ui,/(?:Niepełne dane|Niekompletne dane)/);
});
test("UI shows actual affected match IDs and stage IDs",()=>{
 assert.match(ui,/(?:item|risk)\.affectedMatchIds\.join/);
 assert.match(ui,/(?:item|risk)\.affectedStageIds\.join/);
});
test("OpenAPI explicitly states advisory-only with denied write",()=>{
 assert.match(spec,/impactRiskReport:\s*\n\s*type: object/);
 assert.match(spec,/kind: \{ type: string, enum: \[se_correction_impact_risk_report\] \}/);
 assert.match(spec,/writePerformed: \{ type: boolean, const: false \}/);
});
test("CI includes Pack26 tests for pushes and pull requests",()=>{
 assert.match(ci,/test\/se-correction-impact-risk-report\.test\.ts/);
 assert.match(ci,/qa\/pack26\/source-contract\.test\.mjs/);
 assert.equal((ci.match(/qa\/pack26\/\*\*/g)||[]).length,2);
});
test("regression tests cover invalid flags, duplicates, and counter mismatches",()=>{
 assert.match(tests,/malformed flags fail closed/);
 assert.match(tests,/duplicates in descendant IDs fail closed/);
 assert.match(tests,/counter mismatch fails closed/);
});
