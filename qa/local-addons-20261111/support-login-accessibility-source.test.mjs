import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../artifacts/tournament-manager/src/components/support-login-modal.tsx', import.meta.url), 'utf8');

test('L13-01: nickname label targets a named, stable field', () => {
  assert.match(source, /<Label\s+htmlFor="support-login-nick"/);
  assert.match(source, /<Input\s+id="support-login-nick"/);
});

test('L13-02: password label targets its input and has appropriate autocomplete', () => {
  assert.match(source, /<Label\s+htmlFor="support-login-password"/);
  assert.match(source, /<Input\s+id="support-login-password"[^>]*?type="password"/s);
  assert.match(source, /autoComplete="current-password"/);
});

test('L13-03: authentication failure is announced to assistive technologies', () => {
  assert.match(source, /\{error\s*&&\s*\(\s*<p\s+id="support-login-error"\s+role="alert"/s);
});

test('L13-04: password is associated with the reported error when it exists', () => {
  assert.match(source, /aria-describedby=\{error\s*\?\s*"support-login-error"\s*:\s*undefined\}/);
});

test('L13-05: close button is keyboard-visible and an explicit non-submit control', () => {
  assert.match(source, /<button\s+type="button"\s+onClick=\{handleClose\}/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /min-h-10\s+min-w-10/);
});

test('L13-06: decorative icons do not create duplicate spoken labels', () => {
  assert.match(source, /<Users\s+aria-hidden="true"/);
  assert.match(source, /<User\s+aria-hidden="true"/);
  assert.match(source, /<Lock\s+aria-hidden="true"/);
});

test('L13-07: support authentication/session flow remains structurally preserved', () => {
  assert.match(source, /apiSupportLogin\(tournamentId, password, nick\)/);
  assert.match(source, /storeSupSession\(tournamentId, sessionToken, confirmedNick\)/);
  assert.match(source, /setActiveSupportToken\(sessionToken\)/);
  assert.match(source, /setActiveOrganizerToken\(null\)/);
  assert.match(source, /onSuccess\(sessionToken, confirmedNick\)/);
});
