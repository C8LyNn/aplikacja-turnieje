// V5 · Stage A guards: the guided wizard lives only in Experimental, Stable creation is
// untouched, the advanced form keeps its route, and wizard CSS stays scoped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const src = p => readFileSync(resolve(root, 'artifacts/tournament-manager/src', p), 'utf8');

test('Experimental /new renders the wizard; the full form moved to /new/advanced', () => {
  const app = src('App.tsx');
  const advanced = app.indexOf('path="/experimental/tournaments/new/advanced"');
  const wizard = app.indexOf('path="/experimental/tournaments/new"');
  assert.ok(advanced > 0 && wizard > advanced, 'advanced route is registered before the wizard route');
  assert.match(src('pages/experimental/tournaments/create-tournament-experimental.tsx'), /<ExperimentalCreateWizard \/>/);
  assert.match(src('pages/experimental/tournaments/create-tournament-experimental-advanced.tsx'), /TournamentTemplatePlanner/);
});

test('Stable creation does not import the wizard or the preset API', () => {
  for (const file of ['pages/create-tournament.tsx', 'pages/tournament-create-choice.tsx']) {
    const s = src(file);
    assert.doesNotMatch(s, /experimental-create-wizard|presets\/(recommend|preview)/, file);
  }
  assert.match(src('App.tsx'), /path="\/tournaments\/new" component=\{CreateTournament\}/);
});

test('wizard never stores passwords in the draft and never sends name/passwords to preset endpoints', () => {
  const model = src('features/experimental-tournaments/experimental-create-wizard-model.ts');
  const draftType = model.slice(model.indexOf('export interface WizardDraft'), model.indexOf('export const DEFAULT_DRAFT'));
  assert.doesNotMatch(draftType, /password/i);
  const wizard = src('features/experimental-tournaments/experimental-create-wizard.tsx');
  const calls = wizard.match(/postJson<\w+>\(\s*"\/api\/tournaments\/presets[\s\S]*?controller\.signal/g) ?? [];
  assert.equal(calls.length, 2, 'recommend + preview calls');
  for (const call of calls) {
    assert.doesNotMatch(call, /password|draft\.name/i, call);
  }
});

test('wizard only offers presets from the server catalog (no client-side format list)', () => {
  const wizard = src('features/experimental-tournaments/experimental-create-wizard.tsx');
  assert.match(wizard, /\/api\/tournaments\/presets\/recommend/);
  assert.match(wizard, /\/api\/tournaments\/presets\/preview/);
  assert.doesNotMatch(wizard, /"double_elimination"|"round_robin"|"swiss_playoff"/, 'no hard-coded format offers');
});

test('v5 CSS is scoped to Experimental create/shell and sits before the v4 block', () => {
  const css = src('experimental-design-system.css');
  const start = css.indexOf('/* v5 · guided creation wizard */');
  const end = css.indexOf('v4 — resume card');
  assert.ok(start > 0 && end > start, 'v5 block must sit before the v4 block');
  const block = css.slice(start, css.lastIndexOf('/*', end));
  const selectors = [];
  let depth = 0;
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@media') || trimmed.startsWith('@supports')) { depth += 1; continue; }
    if (!trimmed.includes('{')) continue;
    const head = trimmed.slice(0, trimmed.indexOf('{'));
    let level = 0, current = '';
    for (const ch of head) {
      if (ch === '(') level += 1;
      if (ch === ')') level -= 1;
      if (ch === ',' && level === 0) { selectors.push(current.trim()); current = ''; } else current += ch;
    }
    if (current.trim()) selectors.push(current.trim());
  }
  assert.ok(selectors.length > 60, `expected many wizard selectors, got ${selectors.length}`);
  for (const selector of selectors) {
    assert.match(selector, /^(\.experimental-tournament-shell |:is\(\.experimental-tournament-shell, \.experimental-tournament-create\) |:is\(\.experimental-tournament-create\) )/, `unscoped selector: ${selector}`);
  }
});
