import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const source = resolve(root, 'artifacts/tournament-manager/src/lib/organizer-next-step.ts');
function load() {
  const compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
    fileName: source, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length ?? 0, 0);
  const exports = {};
  const deps = {
    './stage-lifecycle-feedback': { stageReadinessFeedback: (r, name) => ({ summary: name + ': ' + r.message, counts: '', action: '' }) },
    './organizer-stage-summary': { organizerStageSummary: () => ({ round: 1 }) },
  };
  vm.runInNewContext(compiled.outputText, { exports, require: n => {
    assert.ok(Object.hasOwn(deps, n), `unknown import ${n}`); return deps[n];
  } }, { filename: source });
  return exports;
}
const m = load();
const stage = (id, position, status, format = 'single_elimination') => ({
  id, position, name: `Etap ${id}`, status, format, participantCount: 4, currentRound: 1, totalRounds: 1, advancingCount: 1,
});
const caps = (overrides = {}) => ({ canManageLifecycle: true, canStartTournament: true, canGenerateRound: true, canAccessConducting: true, ...overrides });
const params = (stages, more = {}) => ({
  tournament: { id: 81, status: 'active', currentRound: 1, totalRounds: 1 },
  stages, surface: 'details', capabilities: caps(),
  matches: [{ id: 3, stageId: stages.find(s => s.status === 'active')?.id ?? -1, status: 'completed' }],
  plannedStageReadiness: { ready: true }, ...more,
});

test('L59 active stage references next planned position even with gaps', () => {
  const result = m.deriveOrganizerNextStep(params([stage(1, 2, 'active'), stage(2, 8, 'planned')]));
  assert.equal(result.kind, 'complete_stage');
  assert.match(result.description, /etapu „Etap 2”/);
});
test('L59 contiguous positions keep original next stage copy', () => {
  const result = m.deriveOrganizerNextStep(params([stage(1, 1, 'active'), stage(2, 2, 'planned')]));
  assert.match(result.description, /etapu „Etap 2”/);
});
test('L59 active stage ignores already completed higher stages', () => {
  const result = m.deriveOrganizerNextStep(params([stage(1, 1, 'active'), stage(9, 2, 'completed'), stage(2, 4, 'planned')]));
  assert.match(result.description, /etapu „Etap 2”/);
  assert.doesNotMatch(result.description, /„Etap 9”/);
});
test('L59 last active stage without planned successor has generic completion instruction', () => {
  const result = m.deriveOrganizerNextStep(params([stage(3, 50, 'active')]));
  assert.match(result.description, /warunki zakończenia etapu/);
});
test('L59 completed predecessor with position gap requires lifecycle capability', () => {
  const result = m.deriveOrganizerNextStep(params([stage(1, 1, 'completed'), stage(2, 9, 'planned')], {
    matches: [], capabilities: caps({ canManageLifecycle: false, canStartTournament: true }),
  }));
  assert.equal(result.kind, 'next_stage');
  assert.equal(result.actionHref, undefined);
  assert.equal(result.actionLabel, undefined);
});
test('L59 completed predecessor with gap grants only lifecycle-capable user action', () => {
  const result = m.deriveOrganizerNextStep(params([stage(1, 1, 'completed'), stage(2, 9, 'planned')], { matches: [] }));
  assert.equal(result.kind, 'next_stage');
  assert.match(result.actionHref, /action=start/);
});
test('L59 first planned stage is still a first-stage action', () => {
  const result = m.deriveOrganizerNextStep(params([stage(2, 11, 'planned')], { matches: [], capabilities: caps({ canManageLifecycle: false, canStartTournament: true }) }));
  assert.equal(result.kind, 'planned_stage');
  assert.match(result.actionHref, /action=start/);
});
test('L59 planned stage without confirmed readiness shows preparation, never start', () => {
  const result = m.deriveOrganizerNextStep(params([stage(1, 1, 'completed'), stage(2, 6, 'planned')], { matches: [], plannedStageReadiness: undefined }));
  assert.equal(result.kind, 'stage_preparation');
  assert.doesNotMatch(result.actionHref ?? '', /action=start/);
});
test('L59 active matches still route to the conducting panel when allowed', () => {
  const result = m.deriveOrganizerNextStep(params([stage(1, 1, 'active')], {
    matches: [{ id: 1, stageId: 1, status: 'pending' }],
  }));
  assert.equal(result.kind, 'active_matches');
  assert.match(result.actionHref, /host\?tab=prowadzenie/);
});
test('L59 input array is never mutated by local sorting', () => {
  const stages = Object.freeze([stage(2, 8, 'planned'), stage(1, 1, 'completed')]);
  const result = m.deriveOrganizerNextStep(params(stages, { matches: [] }));
  assert.equal(result.kind, 'next_stage');
  assert.equal(stages[0].id, 2);
});
test('L59 estimateStageMatches preserves supported formats', () => {
  assert.equal(m.estimateStageMatches(stage(1, 1, 'planned')), 3);
  assert.equal(m.estimateStageMatches(stage(2, 2, 'planned', 'round_robin')), 6);
  assert.equal(m.estimateStageMatches(stage(3, 3, 'planned', 'swiss')), undefined);
});
