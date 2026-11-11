import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../artifacts/tournament-manager/src/components/layout.tsx', import.meta.url), 'utf8');

test('L17 ordinary pages expose a direct skip link to the main content', () => {
  assert.match(source, /href=\{isExperimentalTournamentView\s*\?\s*"#experimental-main"\s*:\s*"#main-content"\}/);
});

test('L17 standard main content has the matching target id', () => {
  assert.match(source, /<main[^>]*id=\{isExperimentalTournamentView\s*\?\s*"experimental-main"\s*:\s*"main-content"\}/s);
});

test('L17 skip link is hidden visually until keyboard focus on standard pages', () => {
  assert.match(source, /className=\{isExperimentalTournamentView\s*\?\s*"experimental-skip-link"\s*:\s*"[^"]*sr-only[^"]*focus:not-sr-only[^"]*focus-visible:ring-2[^"]*"\}/s);
});

test('L17 keyboard destination can receive focus without adding tab order', () => {
  assert.match(source, /<main[^>]*tabIndex=\{-1\}/s);
});

test('L17 legacy experimental skip-link styling and target remain preserved', () => {
  assert.match(source, /"experimental-skip-link"/);
  assert.match(source, /"#experimental-main"/);
  assert.match(source, /"experimental-main"/);
});

test('L17 visible skip-link copy stays in Polish', () => {
  assert.match(source, /Przejdź do głównej treści/);
});
