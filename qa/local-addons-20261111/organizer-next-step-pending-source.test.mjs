import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../artifacts/tournament-manager/src/components/organizer-next-step.tsx', import.meta.url), 'utf8');

test('L14-01: callback-based action remains unavailable while pending', () => {
  assert.match(source, /<Button[^>]*onClick=\{onAction\}[^>]*disabled=\{pending\}/s);
});

test('L14-02: pending callback visibly changes the action label', () => {
  assert.match(source, /\{pending\s*\?\s*"Wykonywanie…"\s*:\s*step\.actionLabel\}/);
});

test('L14-03: pending callback has a separate polite status announcement', () => {
  assert.match(source, /\{action\s*&&\s*onAction\s*&&\s*pending\s*&&\s*\(\s*<span\s+role="status"\s+aria-live="polite"/s);
});

test('L14-04: progress icon is decorative and motion marks loading', () => {
  assert.match(source, /<Loader2\s+aria-hidden="true"[^>]*animate-spin/);
});

test('L14-05: callback pending applies busy state only to its actual button', () => {
  assert.match(source, /<Button\s+onClick=\{onAction\}\s+disabled=\{pending\}\s+aria-busy=\{pending\}/);
});

test('L14-06: role-based navigation and completed status are retained', () => {
  assert.match(source, /tournamentModeHref\(step\.actionHref, experimental\)/);
  assert.match(source, /<Link href=\{actionHref\}>/);
  assert.match(source, /step\.kind === "completed"/);
});
