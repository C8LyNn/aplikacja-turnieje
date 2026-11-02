'use strict';
/**
 * A51 W15: regression for a lost W12 commit in a stacked, review-only A51 PR.
 * Node/unit fixtures, not a genuine two-PC Unity multiplayer acceptance run.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const cp=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const parser=require('../../w11/a51/native-snapshot-trace.cjs');
const gate=require('../../w12/a51/freeze-trace-gate.cjs');
const host=(revision=12,action=8)=>`CC_W10_NET_HOST revision=${revision} action=${action} turn=1 phase=Moving balls=14 packedBytes=8901 chunks=2 periodMs=83\n`;
const client=(revision=12,action=8)=>`CC_W10_NET_CLIENT revision=${revision} action=${action} turn=1 phase=Moving balls=14 received=12 skippedRevisions=0\n`;
const tx=()=>`CC_NET_TRACE_TX rev=12 serial=8 tms=100 turn=1 phase=Moving bytes=5432 chunks=2\n`;
const rx=(chunks=2)=>`CC_NET_TRACE_RX rev=12 serial=8 tms=200 turn=1 phase=Moving chunks=${chunks}\n`;
const analyze=(a=host(),b=client())=>parser.analyze(
  parser.parseLogBuffer(Buffer.from(a),'PC1'),parser.parseLogBuffer(Buffer.from(b),'PC2'));
test('valid frozen A41 host/client missing optional chunks has no false-positive finding',()=>{
  const r=analyze();
  assert.deepEqual(r.findings,[]);
  assert.equal(r.qualification.sameRevisionMetadata,'MATCHED_METADATA_ONLY');
  assert.equal(r.observations.pairedRevisionRows,1);
  assert.equal(r.qualification.G3,'NOT_CERTIFIED_BY_ANALYZER');
});
test('real existing A51 freeze gate accepts valid sampled A41 pair as metadata ONLY',()=>{
  const r=gate.assess(analyze(),gate.FREEZE_SHA);
  assert.equal(r.status,'METADATA_CONSISTENT_ONLY');
  assert.equal(r.guarantees.G3,'HOLD');
  assert.equal(r.guarantees.gameRuntime,'NOT_CERTIFIED');
});
test('A31 both-known chunks discrepancy is still flagged',()=>{
  const r=analyze(tx(),rx(3));
  assert.ok(r.findings.some(f=>f.field==='chunks'));
  assert.equal(r.qualification.sameRevisionMetadata,'HOLD_ERRORS');
});
test('A41 valid missing chunks does not mask actionSerial mismatch',()=>{
  const r=analyze(host(12,8),client(12,9));
  assert.deepEqual(r.findings.filter(f=>f.field==='actionSerial').length,1);
  assert.ok(!r.findings.some(f=>f.field==='chunks'));
});
test('A41 real balls field still compared',()=>{
  const r=analyze(host(),client().replace('balls=14','balls=13'));
  assert.ok(r.findings.some(f=>f.field==='balls'));
  assert.ok(!r.findings.some(f=>f.field==='chunks'));
});
test('zero common sampled revisions means HOLD, never packet loss or PASS',()=>{
  const r=gate.assess(analyze(host(12),client(13)),gate.FREEZE_SHA);
  assert.equal(r.status,'HOLD_INCOMPLETE_TRACE');
  assert.ok(r.reasons.includes('NO_SHARED_REVISION_SAMPLES'));
  assert.equal(r.guarantees.G3,'HOLD');
});
test('wrong candidate source cannot masquerade as frozen QA build',()=>{
  assert.equal(gate.assess(analyze(),'87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c').status,'FAIL_PROFILE_OR_TRACE');
});
test('newer W11 digest marker in original input rejected for freeze profile',()=>{
  const a=host()+'CC_W11_STATE_TX revision=12 sha256='+ 'a'.repeat(64)+' action=8 turn=1\n';
  const r=gate.assess(analyze(a,client()),gate.FREEZE_SHA);
  assert.equal(r.status,'FAIL_PROFILE_OR_TRACE');
  assert.ok(r.reasons.includes('POST_FREEZE_W11_DIGEST_MARKER_PRESENT'));
});
test('native CLI parser->gate end-to-end returns metadata0 with G3 HOLD',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a51-w15-chain-'));
  try {
    const pc1=path.join(dir,'PC1.log'),pc2=path.join(dir,'PC2.log'),out=path.join(dir,'a51.json');
    fs.writeFileSync(pc1,host());fs.writeFileSync(pc2,client());
    const parserCli=path.resolve(__dirname,'../../w11/a51/native-snapshot-trace.cjs');
    const gateCli=path.resolve(__dirname,'../../w12/a51/freeze-trace-gate.cjs');
    const a=cp.spawnSync(process.execPath,[parserCli,'--pc1',pc1,'--pc2',pc2,'--out',out],{encoding:'utf8'});
    assert.equal(a.status,0,a.stderr);
    const b=cp.spawnSync(process.execPath,[gateCli,'--analysis',out,'--source-sha',gate.FREEZE_SHA],{encoding:'utf8'});
    assert.equal(b.status,0,b.stderr);
    const result=JSON.parse(b.stdout);
    assert.equal(result.status,'METADATA_CONSISTENT_ONLY');
    assert.equal(result.guarantees.G3,'HOLD');
    assert.equal(result.guarantees.stateParity,'NOT_PROVEN_NO_FREEZE_STATE_DIGEST');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
