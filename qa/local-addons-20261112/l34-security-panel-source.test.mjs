import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync('artifacts/tournament-manager/src/components/security-panel.tsx', 'utf8');
test('L34: support password label targets actual input', () => {
  assert.match(source, /<Label htmlFor="support-new-password"[^>]*>Nowe hasło wsparcia<\/Label>/);
  assert.match(source, /<Input\s+id="support-new-password"/);
});
test('L34: support password visibility control exposes action and target', () => {
  assert.match(source, /aria-label=\{showNewPw \? "Ukryj hasło wsparcia" : "Pokaż hasło wsparcia"\}/);
  assert.match(source, /aria-controls="support-new-password"/);
  assert.match(source, /aria-pressed=\{showNewPw\}/);
});
test('L34: two sensitive handlers use synchronous locks', () => {
  assert.match(source, /const changePasswordLock = useRef\(false\)/);
  assert.match(source, /const setOrganizerPasswordLock = useRef\(false\)/);
  assert.match(source, /if \(changePasswordLock\.current \|\| changingPw\) return;/);
  assert.match(source, /if \(setOrganizerPasswordLock\.current \|\| settingOrganizerPassword\) return;/);
});
test('L34: both locks release even after rejection', () => {
  assert.match(source, /finally \{\s*changePasswordLock\.current = false;\s*setChangingPw\(false\)/);
  assert.match(source, /finally \{\s*setOrganizerPasswordLock\.current = false;\s*setSettingOrganizerPassword\(false\)/);
});
test('L34: error/success statuses are announced', () => {
  assert.match(source, /\{pwError && <p role="alert"/);
  assert.match(source, /\{pwSuccess && <p role="status"/);
  assert.match(source, /<p role="alert" className="text-xs text-destructive">\{organizerPasswordError\}/);
});
test('L34: refresh button has a keyboard-friendly target and accessible name', () => {
  assert.match(source, /<button type="button" onClick=\{refresh\}[^>]+aria-label="Odśwież sesje i logi"/);
  assert.match(source, /min-h-11 min-w-11/);
});
