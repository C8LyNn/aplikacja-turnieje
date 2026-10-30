'use strict';
/** W13 A81: real Node child-process acceptance tests against the exact W12 A81
 * offline analyzer. All telemetry is synthetic. Not Unity or two-PC QA. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const CLI=path.resolve(__dirname,'../../w11/a81/verify-candidate207-telemetry.cjs');
const FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const host=(rev=7,period=50,packed=2048)=>'CC_NET_HOST_READY port=7777\nCC_W10_NET_HOST revision='+rev+' action=3 turn=1 phase=Moving balls=20 packedBytes='+packed+' chunks=3 periodMs='+period+'\n';
const client=(rev=7)=>'CC_NET_STATE_APPLIED revision=1 owner=1\nCC_W10_NET_CLIENT revision='+rev+' action=3 turn=1 phase=Moving balls=20 received=7 skippedRevisions=0\n';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture(t,h=host(),c=client()){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a81-w13-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const hp=path.join(dir,'PC1_Player.log'),cp=path.join(dir,'PC2_Player.log');
  fs.writeFileSync(hp,h);fs.writeFileSync(cp,c);
  const cmd=(...extra)=>spawnSync(process.execPath,[CLI,'--host',hp,'--client',cp,...extra],{encoding:'utf8',timeout:10000});
  return {dir,hp,cp,h,c,cmd};
}
test('real child CLI: matching samples exit0 but never G3 PASS',t=>{
  const {cmd}=fixture(t);const r=cmd();assert.equal(r.status,0,r.stderr);
  const j=JSON.parse(r.stdout);assert.equal(j.verdict,'SAMPLED_DIAGNOSTIC_ONLY');
  assert.equal(j.qaFreezeSourceSha,FREEZE);assert.equal(j.runtimeBinarySourceSha,'NOT_VERIFIED');
  assert.equal(j.gameplayGate,'NOT_ATTESTED');assert.equal(j.physicalPc1Pc2Qa,'NOT_ATTESTED');
  assert.equal(j.matchingRevisionSamples,1);
});
test('real child CLI: unrelated sparse revisions exit2, not an inferred packet drop',t=>{
  const {cmd}=fixture(t,host(7),client(8));const r=cmd();assert.equal(r.status,2,r.stderr);
  const j=JSON.parse(r.stdout);assert.equal(j.verdict,'INSUFFICIENT_SELECTED_LOGS');
  assert.equal(j.matchingRevisionSamples,0);assert.equal(j.errors.length,0);
});
test('real child CLI: same revision but mismatched authoritative action exit1',t=>{
  const {cmd}=fixture(t,host(),client().replace('action=3','action=4'));const r=cmd();
  assert.equal(r.status,1,r.stderr);assert.ok(JSON.parse(r.stdout).errors.some(e=>e.field==='action'));
});
test('real child CLI: host duplicate match boundaries HOLD, not fabricated parity',t=>{
  const {cmd}=fixture(t,host()+host());const r=cmd();assert.equal(r.status,2,r.stderr);
  assert.ok(JSON.parse(r.stdout).notices.includes('MULTIPLE_SESSIONS_CROP_ORIGINAL_LOGS_TO_ONE_MATCH'));
});
test('real child CLI: client duplicate match boundaries HOLD',t=>{
  const {cmd}=fixture(t,host(),client()+client());const r=cmd();assert.equal(r.status,2,r.stderr);
});
test('real child CLI: newer STATE_TX telemetry is rejected on W11 freeze',t=>{
  const {cmd}=fixture(t,host()+'CC_W11_STATE_TX rev=7 hash=abc\n');const r=cmd();
  assert.equal(r.status,1,r.stderr);
  assert.ok(JSON.parse(r.stdout).errors.some(e=>e.code==='POST_FREEZE_TELEMETRY_PRESENT'));
});
test('real child CLI: newer STATE_RX telemetry is rejected on W11 freeze',t=>{
  const {cmd}=fixture(t,host(),client()+'CC_W11_STATE_RX rev=7 hash=abc\n');const r=cmd();
  assert.equal(r.status,1,r.stderr);
});
test('real child CLI: no selected client marker HOLD',t=>{
  const {cmd}=fixture(t,host(),'CC_NET_STATE_APPLIED revision=7 owner=1\n');const r=cmd();
  assert.equal(r.status,2,r.stderr);assert.equal(JSON.parse(r.stdout).validClient,0);
});
test('real child CLI: compressed payload cadence mismatch exit1',t=>{
  const {cmd}=fixture(t,host(7,50,65536));const r=cmd();assert.equal(r.status,1,r.stderr);
  assert.ok(JSON.parse(r.stdout).errors.some(e=>e.code==='ADAPTIVE_CADENCE_MISMATCH'));
});
test('real child CLI: SHA256 receipts bind the exact on-disk log bytes',t=>{
  const f=fixture(t);const out=path.join(f.dir,'evidence.json');const r=f.cmd('--out',out);
  assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,'');
  const j=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(j.inputReceipts.PC1.sha256,digest(fs.readFileSync(f.hp)));
  assert.equal(j.inputReceipts.PC2.sha256,digest(fs.readFileSync(f.cp)));
  assert.equal(j.inputReceipts.PC1.bytes,Buffer.byteLength(f.h));
  assert.equal(j.inputReceipts.PC2.bytes,Buffer.byteLength(f.c));
});
test('real child CLI: existing evidence report is never overwritten',t=>{
  const f=fixture(t);const out=path.join(f.dir,'existing.json');fs.writeFileSync(out,'ORIGINAL');
  const r=f.cmd('--out',out);assert.equal(r.status,3);assert.equal(fs.readFileSync(out,'utf8'),'ORIGINAL');
});
test('real child CLI: same input file is rejected',t=>{
  const f=fixture(t);const r=spawnSync(process.execPath,[CLI,'--host',f.hp,'--client',f.hp],{encoding:'utf8'});
  assert.equal(r.status,3);assert.match(r.stderr,/Two distinct logs required/);
});
test('real child CLI: unknown/duplicate arguments are rejected before read',t=>{
  const f=fixture(t);const r=f.cmd('--host',f.cp);assert.equal(r.status,3);
  const r2=f.cmd('--foo','bar');assert.equal(r2.status,3);
});
test('real child CLI: privacy — report never prints raw log contents, IP or local paths',t=>{
  const secret='SECRET_LAN_HOST_10.1.2.3';
  const f=fixture(t,host()+secret+'\n',client()+secret+'\n');const r=f.cmd();assert.equal(r.status,0,r.stderr);
  assert.ok(!r.stdout.includes(secret));assert.ok(!r.stdout.includes(f.hp));assert.ok(!r.stdout.includes(f.cp));
});
test('real child CLI: invalid input paths exit3',()=>{
  const r=spawnSync(process.execPath,[CLI,'--host','/does/not/exist.log','--client','/also/missing.log'],{encoding:'utf8'});
  assert.equal(r.status,3);assert.match(r.stderr,/A81_INPUT_ERROR/);
});
