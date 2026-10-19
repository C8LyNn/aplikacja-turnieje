import {test} from 'node:test';
import assert from 'node:assert/strict';
import { firstFailureEvidence, redactEvidence } from './failure-evidence.mjs';

test('first failure after passing TAP and retained final counters', () => {
  const input='TAP version 13\nok 1 - green\nnot ok 2 - fails\n  ---\n  error: mismatch\n# tests 2\n# pass 1\n# fail 1\n';
  const v=firstFailureEvidence(input, '');
  assert.equal(v.firstFailingTap,'not ok 2 - fails');
  assert.equal(v.firstDiagnostic,'error: mismatch');
  assert.equal(v.summary.fail,1);
});
test('nested failing TAP', () => assert.equal(firstFailureEvidence('    not ok 6 - nested\n', '').firstFailingTap, 'not ok 6 - nested'));
test('passing TAP is not invented as failure', () => assert.equal(firstFailureEvidence('TAP version 13\nok 1 - pass\n# fail 0\n', '').firstFailingTap,null));
test('output without TAP stays unknown', () => assert.equal(firstFailureEvidence('partial TAP:', '').firstFailingTap,null));
test('redact URLs, bearer tokens and key values', () => {
  const v=redactEvidence('not ok 5 - postgresql://user:secret@prod/base Bearer abcdef TOKEN:banana');
  assert.ok(!v.includes('secret@'));
  assert.ok(!v.includes('abcdef'));
  assert.ok(!v.includes('banana'));
});
test('bound evidence output to 400 characters', () => assert.equal(redactEvidence('x'.repeat(1000)).length,400));
test('counter preservation', () => assert.equal(firstFailureEvidence('# tests 3\n# pass 2\n# fail 1\n','').summary.fail,1));
test('diagnostic extraction', () => assert.equal(firstFailureEvidence('not ok 1 - failed\n  error: assertion failed\n','').firstDiagnostic, 'error: assertion failed'));

// Wave 2 regression cases: all DATABASE-FREE.
test('extract first not ok carried only in stderr', () => {
  const v=firstFailureEvidence('start\n# tests 0\n', 'TAP version 13\nnot ok 1 - integration import crashed\n  error: ERR_MODULE_NOT_FOUND\n');
  assert.equal(v.firstFailingTap,'not ok 1 - integration import crashed');
  assert.equal(v.firstDiagnostic,'error: ERR_MODULE_NOT_FOUND');
});
test('first stderr diagnostic with empty TAP stdout remains visible', () => {
  const v=firstFailureEvidence('', 'Error: failed to resolve module\n');
  assert.equal(v.firstFailingTap,null);
  assert.equal(v.firstDiagnostic,'Error: failed to resolve module');
});
test('multiple large passing chunks before failing line preserves first named failure', () => {
  const pre='ok 1 - success\n'.repeat(180000);
  const v=firstFailureEvidence('TAP version 13\n'+pre+'not ok 180001 - actual failing case\n# tests 180001\n# fail 1\n', '');
  assert.equal(v.firstFailingTap,'not ok 180001 - actual failing case');
  assert.equal(v.summary.tests,180001);
});
test('redacts general HTTPS URL with bearer-style embedded credential', () => {
  const v=redactEvidence('not ok 3 - https://me:verysecret@example.com/private');
  assert.ok(!v.includes('verysecret'));
});
test('explicit absent summary counters stay null', () => {
  const v=firstFailureEvidence('no TAP output', '');
  assert.equal(v.summary.tests,null);
  assert.equal(v.summary.fail,null);
});
test('first of two failing records is retained', () => {
  const v=firstFailureEvidence('not ok 1 - first\nnot ok 2 - second\n','');
  assert.equal(v.firstFailingTap,'not ok 1 - first');
});
test('ANSI and Windows CRLF normalize without swallowing failure', () => {
  const v=firstFailureEvidence('\u001b[31mnot ok 2 - broke\u001b[0m\r\n# fail 1\r\n','');
  assert.equal(v.firstFailingTap,'not ok 2 - broke');
});
test('secret-like test title is redacted before printing', () => {
  const v=firstFailureEvidence('not ok 1 - API_KEY=abcdefghij\n','');
  assert.ok(v.firstFailingTap.includes('[REDACTED]'));
  assert.ok(!v.firstFailingTap.includes('abcdefghij'));
});
