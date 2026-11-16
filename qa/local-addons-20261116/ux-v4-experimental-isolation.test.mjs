// SWARM-006 UX v4: source-level guards that the v4 panels are rendered only on
// Experimental branches, that Stable keeps its own UI, and that v4 CSS is scoped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const src = p => readFileSync(resolve(root, 'artifacts/tournament-manager/src', p), 'utf8');

const usages = [
  ['pages/dashboard.tsx', '<ExperimentalResumeCard'],
  ['pages/tournament-detail.tsx', '<ExperimentalRosterHealth'],
  ['pages/tournament-detail.tsx', '<ExperimentalStageMap'],
  ['pages/tournament-detail.tsx', '<ExperimentalBulkPaste'],
  ['pages/tournament-host.tsx', '<ExperimentalMatchFlow'],
];

for (const [file, tag] of usages) {
  test(`${tag.slice(1)} renders only behind isExperimental in ${file}`, () => {
    const s = src(file);
    const parts = s.split(tag);
    assert.equal(parts.length, 2, `${tag} must be used exactly once`);
    // The nearest preceding JSX expression must open with the isExperimental guard.
    const before = parts[0].slice(-1200);
    const expr = before.slice(before.lastIndexOf('{isExperimental'));
    assert.ok(expr.startsWith('{isExperimental && '), `unguarded: ${tag}`);
    assert.ok(!/\)\}\s*\n/.test(expr), `${tag} is outside the guarded expression`);
  });
}

test('Stable keeps its CSV import panel and button label', () => {
  const s = src('pages/tournament-detail.tsx');
  assert.match(s, /\{!isExperimental && showCsvImport && capabilities\.canManageParticipants && \(/);
  assert.match(s, /showCsvImport \? "Zamknij" : isExperimental \? "Wklej listę" : "Import CSV"/);
  assert.match(s, /Format pliku CSV/);
});

test('v4 panels never reach Stable routes', () => {
  for (const file of ['features/experimental-tournaments/experimental-v4-panels.tsx', 'features/experimental-tournaments/experimental-v4-model.ts']) {
    const s = src(file);
    assert.doesNotMatch(s, /tournamentHref\([^)]*,\s*false/);
    assert.doesNotMatch(s, /["'`]\/tournaments\//, `${file} links to a Stable path`);
  }
});

test('tournament list keeps V3 lifecycle grouping when the API has no activity', () => {
  const s = src('features/experimental-tournaments/experimental-tournament-list.tsx');
  assert.match(s, /const actionMode = tournaments\.some/);
  assert.match(s, /\{ status: "active", title: "Trwające"/);
});

test('v4 CSS is scoped to the Experimental shell and sits before the v3 support block', () => {
  const css = src('experimental-design-system.css');
  const start = css.indexOf('v4 — resume card');
  const end = css.indexOf('/* v3 · support entry', start);
  assert.ok(start > 0 && end > start, 'v4 block must sit before the v3 support-entry block');
  const selectors = css.slice(start, end).split(/\r?\n/)
    .filter(l => l.includes('{') && !l.trim().startsWith('@'))
    .map(l => l.slice(0, l.indexOf('{')));
  assert.ok(selectors.length > 80, `only ${selectors.length} selectors`);
  for (const sel of selectors) {
    // Split the selector list on top-level commas only (not inside :is(...)).
    const parts = [];
    let depth = 0, cur = '';
    for (const ch of sel) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
    }
    parts.push(cur);
    for (const part of parts.map(p => p.trim()).filter(Boolean)) {
      assert.match(part, /^\.experimental-tournament-shell /, `unscoped selector: ${part}`);
    }
  }
});
