/** Synthetic-only native DB-free regression tests for W6F streaming recorder. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { capturePrivateEvidence, redactEvidence } from './private-api-evidence.mjs';

const summary=(tests,pass,fail)=> `# tests ${tests}\n# pass ${pass}\n# fail ${fail}\n# cancelled 0\n# skipped 0\n# todo 0\n`;
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
