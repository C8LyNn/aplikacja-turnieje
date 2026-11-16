// SWARM-006 UX v3 (user-first): source-level guards that the new conveniences stay
// Experimental-only and do not change the Stable markup or behaviour.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const src = p => readFileSync(resolve(root, 'artifacts/tournament-manager/src', p), 'utf8');

test('support entry: availability, search and remembered nick are Experimental-only', () => {
  const s = src('pages/support-entry.tsx');
  assert.match(s, /isExperimental \? \(\(\) => \{/);
  assert.match(s, /hasSupportPassword/);
  assert.match(s, /tm_exp_support_nick_v1/);
  // nick prefill only on experimental paths
  assert.match(s, /if \(!isExperimentalTournamentPath\(window\.location\.pathname\)\) return "";/);
  // Stable branch keeps its original copy
  assert.match(s, /Wybierz turniej:<\/p>/);
});

test('add-player form collapses optional fields only in Experimental', () => {
  const s = src('pages/tournament-detail.tsx');
  assert.match(s, /experimental-add-player-more/);
  assert.match(s, /Więcej danych \(ranga, drużyna, kraj, rozstawienie\)/);
});

test('host result preview renders only in Experimental', () => {
  const s = src('pages/tournament-host.tsx');
  const i = s.indexOf('experimental-result-preview');
  assert.ok(i > 0);
  assert.match(s.slice(Math.max(0, i - 400), i), /isExperimental/);
});

test('dialog close label is Polish only under /experimental/', () => {
  const s = src('components/ui/dialog.tsx');
  assert.match(s, /startsWith\("\/experimental\/"\)/);
  assert.match(s, /"Close"/);
});

test('scroll reset on navigation is limited to Experimental views', () => {
  const s = src('components/layout.tsx');
  assert.match(s, /if \(isExperimentalTournamentView\) window\.scrollTo/);
});

test('v3 CSS is scoped to Experimental roots', () => {
  const css = src('experimental-design-system.css');
  const start = css.indexOf('/* v3 · support entry');
  assert.ok(start > 0);
  for (const line of css.slice(start).split('\n').filter(l => /\{\s*$/.test(l) && !l.trim().startsWith('}'))) {
    assert.match(line, /experimental-/, `unscoped selector: ${line}`);
  }
});

test('Experimental create form and correction panel use Polish format names; Stable copy kept', () => {
  const create = src('pages/experimental/tournaments/create-tournament-experimental.tsx');
  assert.doesNotMatch(create, /"Single Elimination"|"Round Robin"|"Double Elimination"/);
  const panel = src('components/tournament-result-correction-panel.tsx');
  assert.match(panel, /experimental \? "Drabinka eliminacyjna" : "Single Elimination"/);
});
