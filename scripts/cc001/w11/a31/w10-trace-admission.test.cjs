'use strict';
// A31 R17-W11: synthetic contract for A41 W10 sampled telemetry.
// No hardware, Unity or actual network has been exercised by this fixture.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const a=require('../../w9/a31/analyze-network-logs.cjs');
const host=(revision,action,period=50)=>'CC_W10_NET_HOST revision='+revision+' action='+action+
  ' turn=1 phase=Moving balls=3 packedBytes=5100 chunks=6 periodMs='+period;
const client=(revision,action,received,skipped=0)=>'CC_W10_NET_CLIENT revision='+revision+' action='+action+
  ' turn=1 phase=Moving balls=3 received='+received+' skippedRevisions='+skipped;
test('exact event token, rejects prefix spoof',()=>{
  assert.equal(a.parse('CC_W10_NET_HOSTED revision=10 action=3').w10Host.length,0);
  assert.equal(a.parse(host(10,3)).w10Host.length,1);
});
test('parse real W10 host keys and scheduled period, not network latency',()=>{
  const p=a.analyze([host(10,3),host(28,4,125)].join('\n'),'');
  assert.deepEqual(p.w10.host.scheduledPeriodMsValues,[50,125]);
  assert.equal(p.w10.host.scheduledCadenceOnly,true);
  assert.equal(p.w10.actionParity,'UNALIGNED_NOT_ASSESSED');
});
test('W10 sampled streams never satisfy G3 state parity',()=>{
  const p=a.analyze([host(10,3),host(30,4)].join('\n'),
    [client(10,3,10),client(27,4,27,3)].join('\n'));
  assert.equal(p.gate,'INSUFFICIENT_FOR_G3_PASS');
  assert.equal(p.w10.stateParity,'NOT_ASSESSED');
  assert.ok(p.blockers.includes('W10_TRACE_IS_SAMPLED_NOT_PER_SNAPSHOT'));
});
test('monotonically increasing sampled revisions admitted as samples only',()=>{
  const p=a.analyze([host(10,3),host(30,4)].join('\n'),
    [client(10,3,10),client(27,4,27)].join('\n'));
  assert.equal(p.w10.host.revisionOrder,'INCREASING');
  assert.equal(p.w10.client.revisionOrder,'INCREASING');
  assert.equal(p.w10.client.receivedOrder,'INCREASING');
});
test('host revision reset cannot be silently treated as continuity',()=>{
  const p=a.analyze([host(20,4),host(1,0)].join('\n'),'');
  assert.equal(p.anomalies.w10HostRevisionRegression,true);
});
test('client skipped counter regression exposed',()=>{
  const p=a.analyze('',[client(10,3,10,5),client(20,4,20,2)].join('\n'));
  assert.equal(p.anomalies.w10ClientSkippedCounterRegression,true);
});
test('client skipped counter increase recorded but not claimed as packet loss proof',()=>{
  const p=a.analyze('',[client(10,3,10,0),client(20,4,20,5)].join('\n'));
  assert.equal(p.w10.client.lastSkippedRevisions,5);
  assert.equal(p.w10.client.skippedRevisionsOrder,'NON_DECREASING');
});
test('non-numeric and invalid count rejected as insufficient',()=>{
  const p=a.analyze('',client(2,3,4).replace('received=4','received=bad'));
  assert.equal(p.w10.client.missingOrInvalidFields,true);
});
test('original P2 strict owner regression remains guarded',()=>{
  assert.equal(a.parse('CC_NET_INTENT_ACCEPTED owner=1 seq=1 action=2').accept.length,0);
  assert.equal(a.parse('CC_NET_INTENT_ACCEPT owner=10 seq=1 action=2').accept.length,0);
  assert.equal(a.parse('CC_NET_INTENT_ACCEPT owner=1 seq=1 action=2').accept.length,1);
});
test('single W10 sample still flags incomplete paired evidence',()=>{
  const p=a.analyze(host(10,3),client(10,3,10));
  assert.ok(p.blockers.includes('W10_PAIRED_SAMPLED_TRACE_INSUFFICIENT'));
  assert.equal(p.gate,'INSUFFICIENT_FOR_G3_PASS');
});
