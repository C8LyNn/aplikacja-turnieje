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
const source = resolve(root, 'artifacts/tournament-manager/src/lib/stage-lifecycle-feedback.ts');
function load() {
  const compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
    fileName: source, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length ?? 0, 0);
  const exports = {};
  const errorMessages = { FORBIDDEN: 'Ta operacja jest dostępna wyłącznie dla organizatora.' };
  const deps = {
    './tournament-stages-ui': { getApiErrorMessage: error => errorMessages[error?.data?.code] || error?.data?.error || error?.message || 'Nie udało się wykonać operacji.' },
    './stage-configuration-feedback': { configurationProblemMessage: item => `Koszyk: ${item.message}` },
  };
  vm.runInNewContext(compiled.outputText, { exports, require: n => {
    assert.ok(Object.hasOwn(deps, n), `unknown import ${n}`); return deps[n];
  } }, { filename: source });
  return exports;
}
const m = load();
const readiness = (reasonCode, message = 'Szczegółowy problem') => ({
  ready: false, reasonCode, message, participantCount: 4, requiredParticipantCount: 6,
  missingSeeds: [], basketValidation: { problems: [] },
});

test('L60 known stage conflict retains actionable Polish message and diagnostic code', () => {
  const text = m.stageLifecycleError({ status: 409, data: { code: 'STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE' } });
  assert.match(text, /Odśwież propozycję/);
  assert.match(text, /Kod diagnostyczny: STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE/);
});
test('L60 unknown uppercase code has stable diagnostic fallback', () => {
  const text = m.stageLifecycleError({ status: 409, data: { code: 'UNKNOWN_CODE' } });
  assert.match(text, /Nie udało się wykonać operacji/);
  assert.match(text, /Kod diagnostyczny: UNKNOWN_CODE/);
});
test('L60 reserved Object key toString cannot surface a function as message', () => {
  const text = m.stageLifecycleError({ status: 409, data: { code: 'toString' } });
  assert.match(text, /Nie udało się potwierdzić operacji/);
  assert.doesNotMatch(text, /function|native code|Kod diagnostyczny/);
});
test('L60 reserved Object key constructor cannot surface a function', () => {
  const text = m.stageLifecycleError({ status: 409, data: { code: 'constructor' } });
  assert.match(text, /Nie udało się potwierdzić operacji/);
  assert.doesNotMatch(text, /function|native code|Kod diagnostyczny/);
});
test('L60 reserved Object key __proto__ cannot surface an inherited object', () => {
  const text = m.stageLifecycleError({ status: 409, data: { code: '__proto__' } });
  assert.match(text, /Nie udało się potwierdzić operacji/);
  assert.doesNotMatch(text, /\[object Object\]|Kod diagnostyczny/);
});
test('L60 nonstring code never appears in the user-visible diagnostic', () => {
  const text = m.stageLifecycleError({ status: 422, data: { code: { bogus: true } } });
  assert.match(text, /Nie udało się potwierdzić operacji/);
  assert.doesNotMatch(text, /\[object Object\]|Kod diagnostyczny/);
});
test('L60 malformed code retains useful server error string', () => {
  const text = m.stageLifecycleError({ status: 422, data: { code: '__proto__', error: 'Brak ukończonych meczów' } });
  assert.match(text, /Brak ukończonych meczów/);
  assert.doesNotMatch(text, /Kod diagnostyczny/);
});
test('L60 no-response error preserves retry guidance', () => {
  assert.match(m.stageLifecycleError(new Error('Offline')), /Sprawdź połączenie/);
});
test('L60 FORBIDDEN remains an actionable authorization response', () => {
  const text = m.stageLifecycleError({ status: 403, data: { code: 'FORBIDDEN' } });
  assert.match(text, /wyłącznie dla organizatora/);
});
test('L60 readiness with reserved key toString preserves raw reason rather than crashing', () => {
  const result = m.stageReadinessFeedback(readiness('toString'), 'Finał');
  assert.equal(result.summary, 'Finał: Szczegółowy problem');
});
test('L60 readiness with reserved key constructor preserves raw reason', () => {
  const result = m.stageReadinessFeedback(readiness('constructor'), 'Półfinał');
  assert.equal(result.summary, 'Półfinał: Szczegółowy problem');
});
test('L60 known readiness mismatch preserves exact server counts', () => {
  const result = m.stageReadinessFeedback(readiness('STAGE_PARTICIPANTS_INCONSISTENT'), 'Finał');
  assert.match(result.summary, /Liczba uczestników/);
  assert.match(result.counts, /6.*4/);
});
test('L60 readiness ready returns no warnings', () => {
  assert.equal(Array.from(m.stageReadinessMessages({ ...readiness('NONE'), ready: true })).length, 0);
});
test('L60 readiness warnings retain raw server explanation', () => {
  const result = Array.from(m.stageReadinessMessages({ ...readiness('STAGE_BASKET_CONFIGURATION_INVALID'), missingSeeds: [1, 2] }));
  assert.ok(result.includes('Szczegółowy problem'));
  assert.ok(result.some(s => s.includes('1, 2')));
});
