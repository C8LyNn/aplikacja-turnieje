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
  // V5.4: the advanced editor shares the wizard draft and the server preset engine (one source of truth).
  assert.match(src('pages/experimental/tournaments/create-tournament-experimental-advanced.tsx'), /ExperimentalAdvancedEditor/);
  const editor = src('features/experimental-tournaments/experimental-advanced-editor.tsx');
  assert.match(editor, /\/api\/tournaments\/presets\/preview/);
  assert.match(editor, /readWizardDraft/);
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

test('V5-B: AI import only sends the raw file to the read-only validator', () => {
  const ui = src('features/experimental-tournaments/experimental-ai-import.tsx');
  assert.match(ui, /fetch\("\/api\/tournaments\/ai-config\/validate"/);
  assert.match(ui, /body: JSON\.stringify\(\{ text: raw \}\)/);
  assert.doesNotMatch(ui, /\/api\/tournaments"\s*,|useCreateTournament|dangerouslySetInnerHTML/);
  const wizard = src('features/experimental-tournaments/experimental-create-wizard.tsx');
  const apply = wizard.slice(wizard.indexOf('const applyImported'), wizard.indexOf('const openAdvanced'));
  assert.ok(apply.length > 100, 'applyImported exists');
  assert.doesNotMatch(apply, /password/i, 'imported config never touches passwords');
  assert.doesNotMatch(apply, /name: config|name: result/, 'imported config never sets the tournament name');
});

test('V5-B: AI routes are read-only and registered before the tournament id routes', () => {
  const index = readFileSync(resolve(root, 'artifacts/api-server/src/routes/index.ts'), 'utf8');
  assert.ok(index.indexOf('router.use(tournamentAiConfigRouter)') < index.indexOf('router.use(tournamentsRouter)'));
  const routes = readFileSync(resolve(root, 'artifacts/api-server/src/routes/tournament-ai-config.ts'), 'utf8');
  assert.doesNotMatch(routes, /\bdb\b|insert\(|update\(|delete\(/);
});

test('V5-D: team roster panel renders only in Experimental team tournaments', () => {
  const detail = src('pages/tournament-detail.tsx');
  const parts = detail.split('<ExperimentalTeamRosters');
  assert.equal(parts.length, 2, 'used exactly once');
  const before = parts[0].slice(parts[0].lastIndexOf('{isExperimental'));
  assert.ok(before.startsWith('{isExperimental && tournament.participantType === "teams" && ('), 'guarded by Experimental and team mode');
  for (const file of ['pages/create-tournament.tsx', 'pages/tournament-create-choice.tsx']) {
    assert.doesNotMatch(src(file), /ExperimentalTeamRosters|participantType/, `${file} stays unchanged`);
  }
});

test('V5-E: appearance studio CSS only targets Experimental roots or its own panel', () => {
  const css = src('experimental-design-system.css');
  const start = css.indexOf('/* v5 · appearance studio: tokens');
  const end = css.indexOf('/* v5 · guided creation wizard */');
  assert.ok(start > 0 && end > start, 'appearance block sits before the wizard block');
  const selectors = [];
  for (const line of css.slice(start, end).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('@') || trimmed.startsWith('--') || /^[a-z-]+:/.test(trimmed) || trimmed === '}') continue;
    const head = trimmed.includes('{') ? trimmed.slice(0, trimmed.indexOf('{')) : trimmed;
    let level = 0, current = '';
    for (const ch of head) {
      if (ch === '(') level += 1;
      if (ch === ')') level -= 1;
      if (ch === ',' && level === 0) { if (current.trim()) selectors.push(current.trim()); current = ''; } else current += ch;
    }
    if (current.trim()) selectors.push(current.trim());
  }
  assert.ok(selectors.length > 30, `found ${selectors.length}`);
  const roots = ':is(.experimental-tournament-shell, .experimental-tournament-entry, .experimental-tournament-create, .experimental-tournament-public, .experimental-tournament-stage-view)';
  for (const selector of selectors) {
    const ok = selector.startsWith('.experimental-appearance-panel ') ||
      (/^html\[data-x-(type|shape|cards|fx|contrast|motion)="[a-z]+"\] /.test(selector) && selector.includes(roots));
    assert.ok(ok, `unscoped selector: ${selector}`);
  }
});

test('V5-E: appearance stays a viewer preference (no tournament writes)', () => {
  const ui = src('features/experimental-tournaments/experimental-appearance.tsx');
  assert.doesNotMatch(ui, /fetch\(|useUpdateTournament|api-client-react/);
  assert.match(ui, /Nie zmienia ustawień turnieju/);
});

test('V5.1: lab pages are code-split, tournament pages (Stable fallback) stay in the main bundle', () => {
  const app = src('App.tsx');
  for (const page of ['TournamentDetail', 'TournamentHost', 'TournamentBracket', 'TournamentAudience', 'TournamentProjector', 'CreateTournament', 'TournamentsHome', 'Dashboard', 'Landing']) {
    assert.match(app, new RegExp(`^import ${page} from "@/pages/`, 'm'), `${page} must stay eager`);
  }
  for (const page of ['RandomizerProperPage', 'GameCatalogAdminPage', 'StreamPage', 'MinigamesPage', 'LudologyPage']) {
    assert.ok(app.includes(`const ${page} = lazy(() => import("`), `${page} must be lazy`);
  }
  assert.match(app, /<Suspense fallback=\{<RouteFallback \/>\}>/);
});
