'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {parse,analyze,monotonic,intervals}=require('./analyze-network-logs.cjs');

test('exact P2 binding; owner=10 and owner=100 are not P2',()=>{
  assert.equal(parse('CC_NET_PEER_CONNECTED id=3 owner=1').peerConnected,1);
  assert.equal(parse('CC_NET_PEER_CONNECTED id=3 owner=10').peerConnected,0);
  assert.equal(parse('CC_NET_PEER_CONNECTED id=3 owner=100').peerConnected,0);
});
test('owner=10 cannot fabricate a remote P2 acceptance',()=>{
  assert.equal(parse('CC_NET_INTENT_ACCEPT owner=10 seq=1 action=2').accept.length,0);
  assert.equal(parse('CC_NET_INTENT_ACCEPT owner=11 seq=1 action=2').accept.length,0);
  assert.equal(parse('CC_NET_INTENT_ACCEPT owner=0 seq=1 action=2').accept.length,0);
});
test('only genuine P2 host-accepted sequence counts',()=>{
  assert.deepEqual(parse('CC_NET_INTENT_ACCEPT owner=1 seq=12 action=44').accept,[{seq:12,action:44}]);
});
test('duplicate accepted sequence is an anomaly, not G3 PASS',()=>{
  const h='CC_NET_INTENT_ACCEPT owner=1 seq=12 action=44\nCC_NET_INTENT_ACCEPT owner=1 seq=12 action=45';
  assert.deepEqual(analyze(h,'').anomalies.duplicateAcceptedP2Sequences,[12]);
  assert.equal(analyze(h,'').gate,'INSUFFICIENT_FOR_G3_PASS');
});
test('non-increasing authoritative action serial detected',()=>{
  const h='CC_NET_INTENT_ACCEPT owner=1 seq=12 action=44\nCC_NET_INTENT_ACCEPT owner=1 seq=13 action=43';
  assert.equal(analyze(h,'').anomalies.nonIncreasingAcceptedActionSerial,true);
});
test('initial snapshot is not evidence of a continuous revision stream',()=>{
  const x=analyze('','CC_NET_STATE_APPLIED revision=20 owner=1');
  assert.equal(x.client.firstSnapshotMarkers,1);
  assert.equal(x.client.rxRevisionOrder,'INSUFFICIENT');
  assert.ok(x.blockers.includes('NO_PER_SNAPSHOT_TIMING_MARKERS_IN_RC1'));
});
test('sampled revisions must increase strictly',()=>{
  assert.equal(monotonic([{rev:1},{rev:2}]),'MONOTONIC');
  assert.equal(monotonic([{rev:2},{rev:2}]),'NON_MONOTONIC');
  assert.equal(monotonic([{rev:2},{rev:1}]),'NON_MONOTONIC');
});
test('intervals are per-device, not fake one-way latency',()=>{
  assert.equal(intervals([{tms:100},{tms:310}]).meanMs,210);
  assert.equal(intervals([{tms:310},{tms:100}]),null);
  assert.equal(Object.hasOwn(analyze('',''),'oneWayLatencyMs'),false);
});
test('empty/incomplete logs never claim physical verification',()=>{
  const x=analyze('','');
  assert.equal(x.gate,'INSUFFICIENT_FOR_G3_PASS');
  assert.ok(x.blockers.includes('MISSING_PC1_LOG'));
  assert.ok(x.blockers.includes('MISSING_PC2_LOG'));
});
