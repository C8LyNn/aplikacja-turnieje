import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('artifacts/tournament-manager/src/components/password-field.tsx', 'utf8');
test('L10-SRC-01: reveal button explicitly controls the matching password input', () => {
  assert.match(source, /aria-controls=\{id\}/);
  assert.match(source, /id=\{id\}/);
});
test('L10-SRC-02: reveal control has a visible keyboard focus treatment', () => {
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /focus-visible:ring-offset-2/);
});
test('L10-SRC-03: reveal control has a larger hit area and the input avoids overlap', () => {
  assert.match(source, /\bh-10\b/);
  assert.match(source, /\bw-10\b/);
  assert.match(source, /className="pr-12"/);
});
test('L10-SRC-04: visual icons do not get duplicate speech labels', () => {
  assert.match(source, /<EyeOff\s+aria-hidden="true"/);
  assert.match(source, /<Eye\s+aria-hidden="true"/);
});
test('L10-SRC-05: do not break native button semantics or password control', () => {
  assert.match(source, /type="button"/);
  assert.match(source, /aria-label=\{visible \? "Ukryj hasło" : "Pokaż hasło"\}/);
  assert.match(source, /onClick=\{onToggle\}/);
  assert.match(source, /type=\{visible \? "text" : "password"\}/);
});
