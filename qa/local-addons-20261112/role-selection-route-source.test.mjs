import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source=readFileSync('artifacts/tournament-manager/src/components/app-navigation.tsx','utf8');
test('L31 role selection links to the role selector, not UI variant selector', () => {
  assert.match(source, /experimental\s*\?\s*"\/experimental\/tournaments"\s*:\s*"\/tournaments\/stable"/);
  assert.match(source, /aria-current=\{location === selectionHref \? "page" : undefined\}/);
});
test('L31 mobile link has a concise non-wrapping visible label and full accessible name', () => {
  assert.match(source, /aria-label="Zmień rolę turniejową"/);
  assert.match(source, /whitespace-nowrap/);
  assert.match(source, /className="sm:hidden"[^>]*>Zmień rolę<\/span>/);
  assert.match(source, /className="hidden sm:inline"[^>]*>Zmień rolę turniejową<\/span>/);
});
