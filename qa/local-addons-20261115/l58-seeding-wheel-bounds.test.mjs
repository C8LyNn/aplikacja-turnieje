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
const source = resolve(root, 'artifacts/tournament-manager/src/lib/seeding-ceremony-view.ts');
function load() {
  const compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
    fileName: source, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length ?? 0, 0);
  const exports = {};
  vm.runInNewContext(compiled.outputText, { exports, require: () => { throw Error('unexpected runtime import'); } }, { filename: source });
  return exports;
}
const m = load();
const draw = (n, seed = n, label = `Grupa ${n}`) => ({ drawNumber: n, seed, placement: { label } });
const state = (revealedCount, draws = [draw(1, 3), draw(2, 1), draw(3, 2)], drawMode = 'seed') => ({ draws, revealedCount, drawMode });
const nums = draws => Array.from(draws, d => d.drawNumber);

test('L58 normal revealed and remaining draws keep canonical seed sorting', () => {
  const s = state(1);
  assert.deepEqual(nums(m.revealedCeremonyDraws(s)), [1]);
  assert.deepEqual(nums(m.remainingWheelDraws(s)), [2, 3]);
});
test('L58 negative reveal count must not mark hidden tail as revealed', () => {
  const s = state(-1);
  assert.deepEqual(nums(m.revealedCeremonyDraws(s)), []);
  assert.deepEqual(nums(m.remainingWheelDraws(s)), [2, 3, 1]);
});
test('L58 invalid infinite reveal count cannot hide every unrevealed entry', () => {
  assert.deepEqual(nums(m.remainingWheelDraws(state(Infinity))), [2, 3, 1]);
  assert.deepEqual(nums(m.revealedCeremonyDraws(state(Infinity))), []);
});
test('L58 reveal count beyond length clamps to all revealed', () => {
  assert.deepEqual(nums(m.revealedCeremonyDraws(state(500))), [1, 2, 3]);
  assert.deepEqual(nums(m.remainingWheelDraws(state(500))), []);
});
test('L58 fractional reveal count is truncated toward zero', () => {
  assert.deepEqual(nums(m.revealedCeremonyDraws(state(1.9))), [1]);
  assert.deepEqual(nums(m.remainingWheelDraws(state(1.9))), [2, 3]);
});
test('L58 NaN reveal count defaults to no revealed entries', () => {
  assert.deepEqual(nums(m.revealedCeremonyDraws(state(NaN))), []);
  assert.deepEqual(nums(m.remainingWheelDraws(state(NaN))), [2, 3, 1]);
});
test('L58 zero visible limit remains empty even when target draw is supplied', () => {
  assert.deepEqual(nums(m.visibleWheelDraws(state(0), 1, 0)), []);
});
test('L58 negative visible limit must not render entries', () => {
  assert.deepEqual(nums(m.visibleWheelDraws(state(0), 1, -1)), []);
});
test('L58 fractional visible limit respects maximum integer count', () => {
  assert.deepEqual(nums(m.visibleWheelDraws(state(0), undefined, 1.8)), [2]);
});
test('L58 unseen target is included without exceeding requested slots', () => {
  assert.deepEqual(nums(m.visibleWheelDraws(state(0), 1, 2)), [2, 1]);
});
test('L58 available target is not duplicated', () => {
  assert.deepEqual(nums(m.visibleWheelDraws(state(0), 2, 2)), [2, 3]);
});
test('L58 unknown target does not displace visible draws', () => {
  assert.deepEqual(nums(m.visibleWheelDraws(state(0), 500, 2)), [2, 3]);
});
test('L58 wheel sorting does not mutate frozen backend draw data', () => {
  const s = state(0, Object.freeze([draw(1, 2), draw(2, 1)]));
  assert.deepEqual(nums(m.remainingWheelDraws(s)), [2, 1]);
  assert.deepEqual(nums(s.draws), [1, 2]);
});
test('L58 sequential ceremony readiness keeps original lifecycle policy', () => {
  const stage = { entrySeedingPolicy: 'random', randomRevealOrder: 'sequential' };
  assert.equal(m.stageRequiresSequentialCeremony(stage), true);
  assert.equal(m.isSequentialCeremonyReady(stage, null), false);
  assert.equal(m.isSequentialCeremonyReady(stage, { status: 'completed' }), true);
  assert.equal(m.isSequentialCeremonyReady(stage, { status: 'applied' }), true);
  assert.equal(m.isSequentialCeremonyReady(stage, { status: 'prepared' }), false);
});
