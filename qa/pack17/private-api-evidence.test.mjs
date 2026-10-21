/** Synthetic-only native DB-free regression tests for W6F streaming recorder. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { capturePrivateEvidence, redactEvidence } from './private-api-evidence.mjs';

const summary=(tests,pass,fail)=> `1..${tests}\n# tests ${tests}\n# pass ${pass}\n# fail ${fail}\n# cancelled 0\n# skipped 0\n# todo 0\n`;
async function launch(js,{headers=1}={}){
  const r=await capturePrivateEvidence({command:process.execPath,args:['-e',js],env:{PATH:process.env.PATH||'',NODE_ENV:'test'},expectedHeaders:headers});
  const stdout=readFileSync(join(r.privateFolder,'stdout.raw'));
  const stderr=readFileSync(join(r.privateFolder,'stderr.raw'));
  const stored=JSON.parse(readFileSync(join(r.privateFolder,'receipt.json'),'utf8'));
  try {
    assert.equal(r.stdoutSha256,createHash('sha256').update(stdout).digest('hex'));
    assert.equal(r.stderrSha256,createHash('sha256').update(stderr).digest('hex'));
    assert.equal(stored.stdoutSha256,r.stdoutSha256);
    if(process.platform!=='win32'){
      assert.equal(statSync(r.privateFolder).mode & 0o777,0o700);
      assert.equal(statSync(join(r.privateFolder,'stdout.raw')).mode & 0o777,0o600);
    }
    return {r,stdout:stdout.toString(),stderr:stderr.toString()};
  } finally { rmSync(r.privateFolder,{recursive:true,force:true}); }
}
test('full single TAP exit 0 is accepted (no database)', async()=>{
  const a=await launch(`process.stdout.write(${JSON.stringify('TAP version 13\nok 1 - healthy\n'+summary(1,1,0))})`);
  assert.equal(a.r.exitCode,0);assert.equal(a.r.success,true);assert.equal(a.r.summary.counters.tests,1);
  assert.equal(a.r.summary.tapComplete,true);
});
test('first failing assertion is retained with true exit 1',async()=>{
  const a=await launch(`process.stdout.write(${JSON.stringify('TAP version 13\nok 1 - fine\nnot ok 2 - actual named test\n'+summary(2,1,1))});process.exitCode=1`);
  assert.equal(a.r.exitCode,1);assert.equal(a.r.success,false);
  assert.equal(a.r.summary.firstFailingTap,'not ok 2 - actual named test');
  assert.equal(a.r.summary.counters.fail,1);
});
test('streaming beyond old 64 MiB buffer keeps every raw byte and trailing TAP',async()=>{
  const js=`const block='Y'.repeat(1024*1024)+'\\n';process.stdout.write('TAP version 13\\n');for(let i=0;i<66;i++)process.stdout.write(block);process.stdout.write('not ok 1 - trailing failure after large TAP\\n${summary(1,0,1).replace(/\n/g,'\\n')}');process.stderr.write('Z'.repeat(2*1024*1024)+'\\n');process.exitCode=1`;
  const a=await launch(js);
  assert.equal(a.r.exitCode,1);assert.equal(a.r.success,false);
  assert.ok(a.r.summary.stdoutBytes>64*1024*1024);
  assert.ok(a.r.summary.stderrBytes>2*1024*1024);
  assert.equal(a.r.summary.firstFailingTap,'not ok 1 - trailing failure after large TAP');
  assert.match(a.stdout,/trailing failure after large TAP/);
});
test('early failure with incomplete TAP remains non-PASS',async()=>{
  const a=await launch(`process.stdout.write('TAP version 13\\nnot ok 1 - early throw\\n');process.exitCode=1`);
  assert.equal(a.r.exitCode,1);assert.equal(a.r.success,false);
  assert.equal(a.r.summary.tapComplete,false);assert.equal(a.r.summary.firstFailingTap,'not ok 1 - early throw');
});
test('incomplete TAP even with exit zero is fail-closed',async()=>{
  const a=await launch(`process.stdout.write('TAP version 13\\nok 1 - incomplete\\n');`);
  assert.equal(a.r.exitCode,0);assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});
test('quoted Basic, Bearer, URL and key=value synthetic secrets redacted only in public',async()=>{
  const secret='YTpi';
  const text='TAP version 13\nnot ok 1 - Authorization: Basic "'+secret+'" Bearer abcDEF PASSWD=private postgresql://me:password@db/test\n'+summary(1,0,1);
  const a=await launch(`process.stdout.write(${JSON.stringify(text)});process.exitCode=1`);
  assert.ok(a.stdout.includes(secret),'raw private evidence is complete');
  const e=a.r.summary.firstFailingTap;
  for(const value of [secret,'abcDEF','private','password@'])assert.ok(!e.includes(value));
  assert.match(e,/Basic \[REDACTED\]/);assert.equal(a.r.exitCode,1);
});
test('terminated by signal recorded, no successful TAP fabricated',async(t)=>{
  if(process.platform==='win32'){t.skip('signal semantics vary on Windows; operator test required');return;}
  const a=await launch(`process.stdout.write('TAP version 13\\nok 1 - started\\n');process.kill(process.pid,'SIGTERM');`);
  assert.equal(a.r.signal,'SIGTERM');assert.equal(a.r.exitCode,null);assert.equal(a.r.success,false);
  assert.equal(a.r.summary.tapComplete,false);
});
test('missing child executable is fail-closed with private manifest',async()=>{
  const r=await capturePrivateEvidence({command:'/nonexistent-web005-evidence-command',args:[],expectedHeaders:1});
  try { assert.equal(r.success,false);assert.ok(r.errorCode);assert.equal(r.summary.tapComplete,false);
  } finally {rmSync(r.privateFolder,{recursive:true,force:true});}
});
test('duplicate/missing TAP summary markers never pass',async()=>{
  const tap='TAP version 13\nok 1 - fine\n# tests 1\n# pass 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)})`);
  assert.equal(a.r.exitCode,0);assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});
test('sanitizer matches PR105 approved sample for token secrecy',()=>{
  assert.equal(redactEvidence('Authorization: Basic "YTpi"'),'Authorization: Basic [REDACTED]');
});
test('exit 7 is preserved instead of masking as exit 1',async()=>{
  const a=await launch(`process.stdout.write('TAP version 13\\nnot ok 1 - deliberate exit7\\n');process.exitCode=7`);
  assert.equal(a.r.exitCode,7);assert.equal(a.r.success,false);
  assert.equal(a.r.summary.firstFailingTap,'not ok 1 - deliberate exit7');
});
test('stderr-only first failure retained with stdout incomplete',async()=>{
  const a=await launch(`process.stdout.write('TAP version 13\\n');process.stderr.write('not ok 1 - stderr first\\nError: synthetic\\n');process.exitCode=1`);
  assert.equal(a.r.exitCode,1);assert.equal(a.r.success,false);
  assert.equal(a.r.summary.firstFailingTap,'not ok 1 - stderr first');
  assert.equal(a.r.summary.firstDiagnostic,'Error: synthetic');
});
test('contradictory TAP with not ok and forged PASS counters must fail closed',async()=>{
  const forged='TAP version 13\nok 1 - fake\nnot ok 2 - genuine failure\n# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  const a=await launch(`process.stdout.write(${JSON.stringify(forged)})`);
  assert.equal(a.r.exitCode,0);assert.equal(a.r.success,false);
  assert.equal(a.r.summary.firstFailingTap,'not ok 2 - genuine failure');
});
test('oversized uninspectable TAP line is privately retained, public PASS denied',async()=>{
  const data='TAP version 13\n'+('Z'.repeat(10000))+'\nok 1 - pass\n'+summary(1,1,0);
  const a=await launch(`process.stdout.write(${JSON.stringify(data)})`);
  assert.equal(a.r.exitCode,0);assert.equal(a.r.summary.oversizedLine,true);
  assert.equal(a.r.success,false);assert.ok(a.stdout.includes('Z'.repeat(10000)));
});

// W6F-R2: negative proof against forged TAP success counters, plus Node nesting.
test('W6F-R2 counters-only exit0 cannot pass without an assertion or root plan',async()=>{
  const tap='TAP version 13\n# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)})`);
  assert.equal(a.r.exitCode,0);assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});
test('W6F-R2 plan plus counters but no assertion remains invalid',async()=>{
  const tap='TAP version 13\n1..1\n'+summary(1,1,0).replace('1..1\n','');
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)})`);
  assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});
test('W6F-R2 actual assertion and counters without root plan is incomplete',async()=>{
  const tap='TAP version 13\nok 1 - synthetic\n'+summary(1,1,0).replace('1..1\n','');
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)})`);
  assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});
test('W6F-R2 root plan and assertion numbering must agree',async()=>{
  const tap='TAP version 13\nok 1 - only one\n1..2\n'+summary(1,1,0).replace('1..1\n','');
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)})`);
  assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});
test('W6F-R2 duplicated root assertion identifiers must fail',async()=>{
  const tap='TAP version 13\nok 1 - one\nok 1 - forged duplicate\n'+summary(2,2,0);
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)})`);
  assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});
test('W6F-R2 real native Node nested test TAP validates nested plans',async()=>{
  const js=`const {test}=require('node:test');test('outer',async t=>{await t.test('child 1',()=>{});await t.test('child 2',()=>{});});`;
  const a=await launch(js);
  assert.equal(a.r.exitCode,0);assert.equal(a.r.success,true);
  assert.equal(a.r.summary.tapComplete,true);assert.equal(a.r.summary.counters.tests,3);
  assert.match(a.stdout,/    1\.\.2/);assert.match(a.stdout,/^1\.\.1$/m);
});
test('W6F-R2 nested assertions with no nested plan cannot pass',async()=>{
  const tap='TAP version 13\n    ok 1 - child\nok 1 - parent\n1..1\n'+summary(2,2,0).replace('1..2\n','');
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)})`);
  assert.equal(a.r.success,false);assert.equal(a.r.summary.tapComplete,false);
});

// W6F-R4: A60 nested-assertion identity / A30 quoted-Bearer disclosure regressions.
test('W6F-R4 A60 rejects duplicate child assertion ID within one nested scope', async()=>{
  // Derive malicious TAP from a real native Node nested test run, altering only ID 2 -> 1.
  const js=`const {test}=require('node:test');test('outer',async t=>{await t.test('child 1',()=>{});await t.test('child 2',()=>{});});`;
  const original=await launch(js);
  assert.equal(original.r.success,true);
  assert.match(original.stdout,/^    ok 2 - child 2/m);
  const forged=original.stdout.replace(/^    ok 2 - child 2/m,'    ok 1 - child 2');
  const a=await launch(`process.stdout.write(${JSON.stringify(forged)})`);
  assert.equal(a.r.exitCode,0);
  assert.equal(a.r.summary.tapComplete,false);
  assert.equal(a.r.success,false);
});
test('W6F-R4 A60 accepts legitimate nested ID resets across separate scopes',async()=>{
  const js=`const {test}=require('node:test');test('outer',async t=>{await t.test('first group',async t=>{await t.test('leaf A',()=>{});});await t.test('second group',async t=>{await t.test('leaf B',()=>{});});});`;
  const a=await launch(js);
  assert.equal(a.r.exitCode,0);
  assert.equal(a.r.summary.tapComplete,true);
  assert.equal(a.r.success,true);
  assert.equal(a.r.summary.counters.tests,5);
  assert.match(a.stdout,/^        ok 1 - leaf A/m);
  assert.match(a.stdout,/^        ok 1 - leaf B/m);
});
test('W6F-R4 A30 quoted double-Bearer is hidden from public TAP first failure',async()=>{
  const token='SYNTHONLY.abc_123';
  const tap=`TAP version 13\nnot ok 1 - Authorization: Bearer "${token}"\n${summary(1,0,1)}`;
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)});process.exitCode=1`);
  assert.ok(a.stdout.includes(token));
  assert.ok(!a.r.summary.firstFailingTap.includes(token));
  assert.match(a.r.summary.firstFailingTap,/Bearer \[REDACTED\]/);
  assert.equal(a.r.exitCode,1);
});
test('W6F-R4 A30 quoted single-Bearer is hidden from public child stderr',async()=>{
  const token='SYNTHONLY.abc_123';
  const tap='TAP version 13\nnot ok 1 - deliberate\n'+summary(1,0,1);
  const stderr=`Error: Proxy-Authorization: Bearer '${token}'\n`;
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)});process.stderr.write(${JSON.stringify(stderr)});process.exitCode=1`);
  assert.ok(a.stderr.includes(token));
  assert.ok(!a.r.summary.firstDiagnostic.includes(token));
  assert.match(a.r.summary.firstDiagnostic,/Bearer \[REDACTED\]/);
});
test('W6F-R4 A30 receipt public summary fields redact both quoted Bearer variants',async()=>{
  const token='SYNTHONLY.abc_123';
  const tap=`TAP version 13\nnot ok 1 - Authorization: Bearer "${token}"\n${summary(1,0,1)}`;
  const stderr=`Error: Proxy-Authorization: Bearer '${token}'\n`;
  const a=await launch(`process.stdout.write(${JSON.stringify(tap)});process.stderr.write(${JSON.stringify(stderr)});process.exitCode=1`);
  assert.ok(a.stdout.includes(token));assert.ok(a.stderr.includes(token));
  for(const value of [a.r.summary.firstFailingTap,a.r.summary.firstDiagnostic]){
    assert.ok(!value.includes(token));
    assert.match(value,/Bearer \[REDACTED\]/);
  }
});
