import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync('artifacts/tournament-manager/src/components/organizer-login-modal.tsx', 'utf8');
test('L33: legacy host code has an associated visible label', () => {
  assert.match(source, /<Label htmlFor="organizer-login-host-code">Kod prowadzącego<\/Label>/);
  assert.match(source, /<Input\s+id="organizer-login-host-code"\s+type="password"/);
});
test('L33: form authentication error is announced', () => {
  assert.match(source, /\{error && \(\s*<p id="organizer-login-error" role="alert"/);
});
test('L33: credential-state fetch error is announced outside form', () => {
  assert.match(source, /\{error && credentialState == null && !stateLoading && \(\s*<p role="alert"/);
});
test('L33: editing password or host code clears stale authentication error', () => {
  assert.match(source, /onChange=\{\(event\) => \{ setHostCode\(event\.target\.value\); setError\(null\); \}\}/);
  assert.match(source, /onChange=\{\(e\) => \{ setPassword\(e\.target\.value\); setError\(null\); \}\}/);
});
test('L33: password field points to visible error and exposes invalid state', () => {
  assert.match(source, /id="organizer-login-password"[\s\S]*?aria-invalid=\{Boolean\(error\)\}/);
  assert.match(source, /aria-describedby=\{error \? "organizer-login-error" : undefined\}/);
});
test('L33: modal close button is explicit button with visible focus', () => {
  assert.match(source, /<button\s+type="button"\s+onClick=\{handleClose\}/);
  assert.match(source, /focus-visible:ring-2/);
});
