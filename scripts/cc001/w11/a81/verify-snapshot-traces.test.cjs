'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');
const {parse, verify, nonneg} = require('./verify-snapshot-traces.cjs');
const self = path.join(__dirname, 'verify-snapshot-traces.cjs');
const tx = (rev,serial=1,tms=100+rev*50,turn=1,phase='Moving',chunks=2) =>
  '2026/10/30 19:00:00 CC_NET_TRACE_TX rev='+rev+' serial='+serial+' tms='+tms+' turn='+turn+' phase='+phase+' bytes=8192 chunks='+chunks;
const rx = (rev,serial=1,tms=3000+rev*55,turn=1,phase='Moving',chunks=2) =>
  '2026/10/30 19:00:01 CC_NET_TRACE_RX rev='+rev+' serial='+serial+' tms='+tms+' turn='+turn+' phase='+phase+' chunks='+chunks;
const h2 = () => [tx(3), tx(4)].join('\n');
const c2 = () => [rx(3), rx(4)].join('\n');

test('two matched snapshots produce only metadata-scoped result', () => {
  const r=verify(h2(),c2());
  assert.equal(r.verdict,'CONSISTENT_SAMPLED_METADATA_ONLY');
  assert.equal(r.pairedRevisions,2);
  assert.equal(r.gameplayGate,'NOT_ATTESTED');
  assert.equal(r.twoPcPhysicalQa,'NOT_ATTESTED');
  assert.match(r.timingPolicy,/NO_ONE_WAY_LATENCY/);
});
test('missing F1 trace on both sides fails closed',()=>{
  const r=verify('CC_NET_HOST_READY port=7777','CC_NET_STATE_APPLIED revision=5 owner=1');
  assert.equal(r.verdict,'INSUFFICIENT_TRACE');assert.equal(r.pairedRevisions,0);
});
test('one matching revision remains insufficient',()=>assert.equal(verify(tx(3),rx(3)).verdict,'INSUFFICIENT_TRACE'));
test('host-only extra revision remains insufficient not false packet-loss',()=>{
  const r=verify(h2()+'\n'+tx(5),c2());
  assert.equal(r.verdict,'INSUFFICIENT_TRACE');assert.equal(r.hostOnlyCount,1);
  assert.match(r.notices.join('|'),/NOT_PACKET_LOSS_PROOF/);
});
test('client-only extra revision remains insufficient',()=>{
  const r=verify(h2(),c2()+'\n'+rx(5));assert.equal(r.verdict,'INSUFFICIENT_TRACE');assert.equal(r.clientOnlyCount,1);
});
test('matching local rev with different serial is detected',()=>{
  const r=verify(h2(),[rx(3,2),rx(4)].join('\n'));assert.equal(r.verdict,'ANOMALY_IN_SUPPLIED_TRACE');
  assert.ok(r.errors.some(e=>e.field==='serial'));
});
test('matching local rev with different turn is detected',()=>{
  const r=verify(h2(),[rx(3,1,3100,0),rx(4)].join('\n'));assert.ok(r.errors.some(e=>e.field==='turn'));
});
test('matching phase mismatch is detected',()=>{
  const r=verify(h2(),[rx(3,1,3100,1,'Aiming'),rx(4)].join('\n'));assert.ok(r.errors.some(e=>e.field==='phase'));
});
test('matching chunk-count mismatch is detected',()=>{
  const r=verify(h2(),[rx(3,1,3100,1,'Moving',3),rx(4)].join('\n'));assert.ok(r.errors.some(e=>e.field==='chunks'));
});
test('duplicate host revision flagged even if metadata equal',()=>{
  const r=verify(h2()+'\n'+tx(4),c2());assert.ok(r.errors.some(e=>e.code==='DUPLICATE_REVISION'));
});
test('client out-of-order revision flagged',()=>{
  const r=verify(h2(),[rx(4),rx(3)].join('\n'));assert.ok(r.errors.some(e=>e.code==='NON_INCREASING_REVISION'));
});
test('host revision gap is a notice not an assumed drop',()=>{
  const r=verify([tx(3),tx(5)].join('\n'),[rx(3),rx(5)].join('\n'));
  assert.equal(r.verdict,'CONSISTENT_SAMPLED_METADATA_ONLY');assert.equal(r.host.revisionGaps,1);
});
test('reversed local clock detected while remote clock offset ignored',()=>{
  assert.equal(verify(h2(),[rx(3,1,5100),rx(4,1,4900)].join('\n')).verdict,'ANOMALY_IN_SUPPLIED_TRACE');
  assert.equal(verify(h2(),[rx(3,1,999999),rx(4,1,1000100)].join('\n')).verdict,'CONSISTENT_SAMPLED_METADATA_ONLY');
});
test('authoritative serial reversal detected',()=>{
  assert.ok(verify([tx(3,5),tx(4,4)].join('\n'),[rx(3,5),rx(4,4)].join('\n'))
    .errors.some(e=>e.code==='ACTION_SERIAL_REVERSAL'));
});
test('phase accepts valid Unity enum-like tokens, not arbitrary text',()=>{
  assert.equal(parse(tx(3,1,250,1,'Moving'),'PC1').records.length,1);
  assert.equal(parse(tx(3,1,250,1,'Moving;bad'),'PC1').errors.length,1);
});
test('invalid negative, scientific, hex, float, NaN and overflow rejected',()=>{
  for(const n of ['-1','1e3','0x1','1.1','NaN','9007199254740992','+1','01'])assert.equal(nonneg(n),null);
});
test('zero bytes and zero chunks disallowed',()=>{
  assert.equal(parse(tx(3).replace('bytes=8192','bytes=0'),'PC1').errors.length,1);
  assert.equal(parse(rx(3).replace('chunks=2','chunks=0'),'PC2').errors.length,1);
});
test('duplicate or extra key marks trace malformed',()=>{
  assert.equal(parse(tx(3)+' bytes=3','PC1').errors.length,1);
  assert.equal(parse(rx(3)+' owner=1','PC2').errors.length,1);
});
test('wrong endpoint trace type flagged',()=>{
  assert.ok(verify(rx(3),h2()).errors.some(e=>e.code==='WRONG_ENDPOINT_TRACE_KIND'));
});
test('near-miss event prefix not counted as trace',()=>{
  assert.equal(parse('XCC_NET_TRACE_TX rev=3 serial=1','PC1').seen,0);
});
test('an otherwise valid local log with malformed marker is never PASS',()=>{
  const r=verify(h2()+'\n'+tx(5).replace('serial=1','serial=foo'),c2());
  assert.equal(r.verdict,'ANOMALY_IN_SUPPLIED_TRACE');
});
test('unexpected turn number rejected',()=>{
  assert.equal(parse(tx(3,1,200,2),'PC1').errors.length,1);
});
test('CLI valid fixture emits SHA receipts and scoped exit0',()=>{
  const d=fs.mkdtempSync(path.join(os.tmpdir(),'a81-cc001-'));
  try{
    const hp=path.join(d,'host.log'),cp=path.join(d,'client.log'),out=path.join(d,'report.json');
    fs.writeFileSync(hp,h2());fs.writeFileSync(cp,c2());
    const result=spawnSync(process.execPath,[self,'--host',hp,'--client',cp,'--out',out],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const report=JSON.parse(fs.readFileSync(out,'utf8'));
    assert.match(report.inputEvidence.host.sha256,/^[a-f0-9]{64}$/);
    assert.equal(report.inputEvidence.client.bytes,Buffer.byteLength(c2()));
    assert.equal(report.gameplayGate,'NOT_ATTESTED');
    // Never overwrite a previous evidence report.
    assert.equal(spawnSync(process.execPath,[self,'--host',hp,'--client',cp,'--out',out],{encoding:'utf8'}).status,3);
  }finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('CLI missing, same-file and nonsensical args fail closed',()=>{
  for(const args of [[],['--host','x'],['--host','x','--client','x'],['--nonsense','x']]){
    const r=spawnSync(process.execPath,[self,...args],{encoding:'utf8'});assert.equal(r.status,3);
  }
});
test('CLI inconsistent trace exits1; incomplete trace exits2',()=>{
  const d=fs.mkdtempSync(path.join(os.tmpdir(),'a81-cc001-'));
  try {
    const hp=path.join(d,'h.log'),cp=path.join(d,'c.log');fs.writeFileSync(hp,h2());
    fs.writeFileSync(cp,[rx(3,2),rx(4)].join('\n'));
    assert.equal(spawnSync(process.execPath,[self,'--host',hp,'--client',cp]).status,1);
    fs.writeFileSync(cp,rx(3));
    assert.equal(spawnSync(process.execPath,[self,'--host',hp,'--client',cp]).status,2);
  }finally{fs.rmSync(d,{recursive:true,force:true});}
});
