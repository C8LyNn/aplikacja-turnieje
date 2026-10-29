/** Pack20 no-database source-level safety contract. Run from monorepo root. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';
const get = p => readFileSync(p,'utf8');

test('Pack20 action plan never grants permission or performs writes',()=>{
  const s=get('artifacts/api-server/src/domain/tournament/se-correction-action-plan.ts');
  assert.match(s,/executionEnabled:false/);assert.match(s,/writePerformed:false/);
  assert.match(s,/advisoryOnly:true/);
  assert.doesNotMatch(s,/\b(?:update|insert|delete)\s*\(\s*tournament/);
});
test('Readiness endpoint keeps a read-only repeatable-read transaction',()=>{
  const s=get('artifacts/api-server/src/routes/tournament-se-correction-readiness.ts');
  assert.match(s,/isolationLevel:\s*["']repeatable read["']\s*,\s*accessMode:\s*["']read only["']/);
  assert.match(s,/deriveSeCorrectionActionPlan\(/);
  assert.doesNotMatch(s,/\.insert\(|\.update\(|\.delete\(/);
});
test('Plan is derived inside consistent snapshot and never from independently fetched data',()=>{
  const s=get('artifacts/api-server/src/routes/tournament-se-correction-readiness.ts');
  const idx=s.indexOf('deriveSeCorrectionActionPlan');
  assert.ok(idx>=0);
  assert.match(s.slice(idx),/originalScore1:match\.score1,originalScore2:match\.score2/);
});
test('Client renders plan as hypothetical with no SE execute control',()=>{
  const s=get('artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx');
  assert.match(s,/Hipotetyczny plan korekty SE/);
  assert.match(s,/seReadiness\.actionPlan/);
  assert.match(s,/executionEnabled:false/);
});
test('OpenAPI advertises advisory-only action plan',()=>{
  const s=get('lib/api-spec/openapi.yaml');
  assert.match(s,/se_correction_advisory_plan/);
  assert.match(s,/Advisory hypothetical SE recovery plan/);
});
test('CI runs the pack20 tests',()=>{
  const s=get('.github/workflows/tournament-correction-ci.yml');
  assert.match(s,/test\/se-correction-action-plan\.test\.ts/);
  assert.match(s,/qa\/pack20\/source-contract\.test\.mjs/);
});
test('No unexpected SE mutation route was added',()=>{
  const s=get('artifacts/api-server/src/routes/index.ts');
  assert.doesNotMatch(s,/tournament-se-correction-execute/);
  assert.ok(existsSync('artifacts/api-server/src/domain/tournament/se-correction-action-plan.ts'));
});
