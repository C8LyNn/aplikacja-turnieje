import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactEvidence, firstFailureEvidence } from './failure-evidence.mjs';
const syntheticBasic = 'dXNlcjpwYXNzd29yZA==';

test('Basic Authorization header secret redacted', () => {
  const output=redactEvidence('Authorization: Basic '+syntheticBasic);
  assert.equal(output,'Authorization: Basic [REDACTED]');
  assert.ok(!output.includes(syntheticBasic));
});
test('Proxy-Authorization with lowercase basic and padded bytes redacted', () => {
  const output=redactEvidence('Proxy-Authorization=basic '+syntheticBasic);
  assert.equal(output,'Proxy-Authorization=basic [REDACTED]');
});
test('JSON-wrapped Authorization Basic redacted', () => {
  const output=redactEvidence('{"Authorization": "Basic '+syntheticBasic+'"}');
  assert.ok(!output.includes(syntheticBasic));
  assert.ok(output.includes('Basic [REDACTED]'));
});
test('Basic credential in first failure TAP is redacted but test name survives', () => {
  const value=firstFailureEvidence('not ok 2 - request Authorization: Basic '+syntheticBasic+' denied\n# fail 1\n','');
  assert.ok(value.firstFailingTap.includes('not ok 2 - request'));
  assert.ok(!value.firstFailingTap.includes(syntheticBasic));
  assert.equal(value.summary.fail,1);
});
test('Basic credential on diagnostic stderr redacted', () => {
  const value=firstFailureEvidence('', 'Error: rejected Authorization: Basic '+syntheticBasic+'\n');
  assert.ok(value.firstDiagnostic.includes('Basic [REDACTED]'));
  assert.ok(!value.firstDiagnostic.includes(syntheticBasic));
});
test('existing Bearer and DSN redaction remains intact', () => {
  const input='Bearer abcTOKEN postgresql://u:p@db/db Authorization: Basic '+syntheticBasic;
  const result=redactEvidence(input);
  for(const secret of ['abcTOKEN','u:p',''+syntheticBasic])assert.ok(!result.includes(secret));
});
test('missing Basic secret is not fabricated', () => {
  assert.equal(redactEvidence('Authorization: Basic'), 'Authorization: Basic');
});
