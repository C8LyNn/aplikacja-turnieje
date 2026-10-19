import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactEvidence, firstFailureEvidence } from './failure-evidence.mjs';
const dummy='YTpi'; // synthetic Base64, NOT a real user credential

test('A30-01 double-quoted Basic is masked',()=>{
  const out=redactEvidence('Authorization: Basic "'+dummy+'"');
  assert.equal(out,'Authorization: Basic [REDACTED]');
});
test('A30-02 single-quoted Basic is masked',()=>{
  assert.equal(redactEvidence("Authorization: Basic '"+dummy+"'"),'Authorization: Basic [REDACTED]');
});
test('A30-03 Proxy-Authorization double-quoted Basic is masked',()=>{
  assert.equal(redactEvidence('Proxy-Authorization: Basic "'+dummy+'"'),'Proxy-Authorization: Basic [REDACTED]');
});
test('A30-04 first TAP failure preserves identifier but not quoted Basic',()=>{
  const r=firstFailureEvidence('not ok 1 - Authorization: Basic "'+dummy+'" denied\n# fail 1\n','');
  assert.equal(r.firstFailingTap,'not ok 1 - Authorization: Basic [REDACTED] denied');
  assert.equal(r.summary.fail,1);
});
test('A30-05 stderr diagnostic masks double-quoted Basic',()=>{
  const r=firstFailureEvidence('', 'Error: Authorization: Basic "'+dummy+'" rejected\n');
  assert.equal(r.firstDiagnostic,'Error: Authorization: Basic [REDACTED] rejected');
});
test('A30-06 unquoted Basic supported',()=>{
  assert.equal(redactEvidence('Authorization: Basic '+dummy),'Authorization: Basic [REDACTED]');
});
test('A30-07 original DSN and Bearer still masked',()=>{
  const v=redactEvidence('Bearer fakeabcdef postgresql://u:p@db/base');
  assert.ok(!v.includes('fakeabcdef') && !v.includes('u:p'));
});
test('A30-08 JSON-like value with single quotes scrubbed',()=>{
  const v=redactEvidence('{"Authorization":"Basic \''+dummy+'\'"}');
  assert.ok(!v.includes(dummy));
});
test('A30-09 no false TAP success on diagnostic-only stderr',()=>{
  const v=firstFailureEvidence('', 'Error: Authorization: Basic \''+dummy+'\'\n');
  assert.equal(v.firstFailingTap,null);
  assert.ok(v.firstDiagnostic.includes('[REDACTED]'));
});
test('A30-10 no fabricated secret or skipped tests',()=>{
  const v=firstFailureEvidence('not ok 1 - Basic\n# fail 1\n','');
  assert.equal(v.firstFailingTap,'not ok 1 - Basic');
  assert.equal(v.summary.fail,1);
});
