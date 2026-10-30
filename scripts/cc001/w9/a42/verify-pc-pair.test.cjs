'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {verify,main}=require('./verify-pc-pair.cjs');
function logs() {
  return {
    h:['CC_NET_HOST_READY port=7777', 'CC_NET_PEER_CONNECTED id=4 owner=1',
      'CC_NET_INTENT_ACCEPT owner=1 seq=7 action=3',
      'CC_NET_TRACE_TX rev=10 serial=2 turn=2 tms=1000',
      'CC_NET_TRACE_TX rev=11 serial=3 turn=3 tms=1200'].join('\n'),
    c:['CORE_CLASH_LAUNCH owner=1', 'CC_NET_STATE_APPLIED revision=10 owner=1',
      'CC_NET_TRACE_RX rev=10 serial=2 turn=2 tms=1100',
      'CC_NET_TRACE_RX rev=11 serial=3 turn=3 tms=1310'].join('\n')
  };
}
const change=(s,a,b)=>s.replace(a,b);
test('two matching revisions and accepted P2 intent = trace consistent, never physical G3 pass',()=>{
  const {h,c}=logs(),r=verify(h,c);
  assert.equal(r.status,'TRACE_CONSISTENT');assert.equal(r.physicalG3,'NOT_ATTESTED');
  assert.equal(r.trace.matchingSnapshots.length,2);assert.equal(r.trace.acceptedP2Propagated,true);
});
test('same revision with changed serial rejects',()=>{
  const {h,c}=logs(),r=verify(h,change(c,'rev=11 serial=3','rev=11 serial=4'));
  assert.equal(r.status,'FAIL');assert(r.failures.includes('CROSS_DEVICE_SNAPSHOT_CONTENT_MISMATCH_REV_11'));
});
test('same revision with changed turn rejects',()=>{
  const {h,c}=logs(),r=verify(h,change(c,'rev=11 serial=3 turn=3','rev=11 serial=3 turn=4'));
  assert.equal(r.status,'FAIL');
});
test('out-of-order revision rejects',()=>{
  const {h,c}=logs(),r=verify(h,change(c,'rev=11 serial=3','rev=9 serial=3'));
  assert.equal(r.status,'FAIL');assert(r.failures.includes('PC2_RX_NON_INCREASING_REVISION'));
});
test('duplicate accepted P2 sequence rejects',()=>{
  const {h,c}=logs();const r=verify(h+'\nCC_NET_INTENT_ACCEPT owner=1 seq=7 action=4',c);
  assert.equal(r.status,'FAIL');assert(r.failures.includes('P2_ACCEPT_SEQUENCE_INVALID_OR_DUPLICATE'));
});
test('accepted move absent from snapshots means incomplete, not pass',()=>{
  const {h,c}=logs();const r=verify(change(h,'action=3','action=6'),c);
  assert.equal(r.status,'INCOMPLETE_EVIDENCE');assert(r.missing.includes('P2_ACCEPTED_ACTION_NOT_OBSERVED_ON_PC2'));
});
test('missing owner identity blocks trace gate',()=>{
  const {h,c}=logs();const r=verify(h,change(c,'CORE_CLASH_LAUNCH owner=1',''));
  assert.equal(r.status,'INCOMPLETE_EVIDENCE');assert(r.missing.includes('P2_LOCAL_OWNER_IDENTITY'));
});
test('missing logs never passes',()=>{
  const r=verify('','');assert.equal(r.status,'INCOMPLETE_EVIDENCE');
});
test('nonmonotonic action serial rejects',()=>{
  const {h,c}=logs();const r=verify(h,change(c,'rev=11 serial=3','rev=11 serial=1'));
  assert.equal(r.status,'FAIL');assert(r.failures.includes('PC2_RX_ACTION_SERIAL_REGRESSION'));
});
test('CLI creates SHA receipt once, refuses accidental overwrite',()=>{
  const {h,c}=logs(),d=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a42-'));
  try {
    fs.writeFileSync(path.join(d,'pc1.log'),h);fs.writeFileSync(path.join(d,'pc2.log'),c);
    const arg=['--host',path.join(d,'pc1.log'),'--client',path.join(d,'pc2.log'),'--out',path.join(d,'result.json')];
    assert.equal(main(arg),0);
    const r=JSON.parse(fs.readFileSync(path.join(d,'result.json'),'utf8'));
    assert.match(r.inputs.pc1.sha256,/^[0-9a-f]{64}$/);assert.equal(r.inputs.pc2.sizeBytes,Buffer.byteLength(c));
    assert.throws(()=>main(arg),/EEXIST/);
  } finally {fs.rmSync(d,{recursive:true,force:true});}
});
