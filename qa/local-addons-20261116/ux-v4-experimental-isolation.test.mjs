// SWARM-006 UX v4: source-level guards that the v4 panels are rendered only on
// Experimental branches and that their CSS is scoped to the Experimental shell.
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
  ['pages/tournament-detail.tsx', '<ExperimentalStageRail'],
  ['pages/tournament-host.tsx', '<ExperimentalMatchFlow'],
];

for (const [file, tag] of usages) {
  test(`${tag.slice(1)} renders only behind isExperimental in ${file}`, () => {
    const s = src(file);
    const parts = s.split(tag);
    assert.equal(parts.length, 2, `${tag} must be used exactly once`);
    const before = parts[0].slice(-200);
    // The JSX expression that renders the tag must be guarded by isExperimental.
    const expr = before.slice(before.lastIndexOf('{'));
    assert.match(expr, /^\{isExperimental && /, `unguarded: ${expr}`);
  });
}

test('v4 panels never reach Stable routes', () => {
  const panels = src('features/experimental-tournaments/experimental-v4-panels.tsx');
  assert.doesNotMatch(panels, /tournamentHref\([^)]*,\s*false/);
  assert.match(panels, /tournamentHref\(tournament\.id, true, "\/host"\)/);
});

test('v4 CSS is scoped to the Experimental shell', () => {
  const css = src('experimental-design-system.css');
  const start = css.indexOf('v4 — resume card');
  const end = css.indexOf('/* v3 · support entry', start);
  assert.ok(start > 0 && end > start, 'v4 block must sit before the v3 support-entry block');
  const selectors = css.slice(start, end).split(/\r?\n/)
    .filter(l => l.includes('{') && !l.trim().startsWith('@'))
    .map(l => l.slice(0, l.indexOf('{')));
  assert.ok(selectors.length > 30);
  for (const sel of selectors) assert.match(sel, /^\s*\.experimental-tournament-shell /, `unscoped selector: ${sel}`);
});
