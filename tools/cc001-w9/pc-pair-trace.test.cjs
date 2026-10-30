'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseLog,summarize} = require('./pc-pair-trace.cjs');
const trace = (e) => 'CC_W9_TRACE '+JSON.stringify(e);

test('legacy RC1 markers report missing continuous snapshot and turn evidence, not PASS',()=>{
  const h='CC_NET_HOST_READY port=7777\nCC_NET_PEER_CONNECTED id=77\nCC_NET_INTENT_ACCEPT owner=1 seq=1 action=2';
  const c='CC_NET_STATE_APPLIED revision=1 owner=1';
  const r=summarize(h,c);
  assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.p2_intent_host_accepted_count,1);
  assert.deepEqual(r.missing_observations.includes('continuous_snapshot_trace'),true);
  assert.equal(JSON.stringify(r).includes('id=77'),false);
});

test('monotonic per-client revisions and aligned ball snapshots',()=>{
  const h=[trace({type:'snapshot_sent',revision:5}),trace({type:'snapshot_sent',revision:7}),trace({type:'ball_state',revision:7,actionSerial:3,ballId:8,layer:'simulation',x:2,y:3})].join('\n');
  const c=[trace({type:'snapshot_applied',revision:5,monotonicMs:100}),trace({type:'snapshot_applied',revision:7,monotonicMs:350}),trace({type:'ball_state',revision:7,actionSerial:3,ballId:8,layer:'simulation',x:2.1,y:3}),trace({type:'turn_state',revision:7,turn:0,localOwner:1,phase:'aiming',banner:'opponent_turn'})].join('\n');
  const r=summarize(h,c,{driftThreshold:.2});
  assert.equal(r.coverage.matched_snapshot_revisions,2);
  assert.equal(r.client.sample_intervals_ms[0],250);
  assert.equal(r.paired_ball_samples,1);
  assert.equal(r.worst_ball_distance.distance,0.1);
  assert.equal(r.above_threshold_samples,0);
});

test('flag client revision regression but do not assume lost transport data',()=>{
  const c=[trace({type:'snapshot_applied',revision:4}),trace({type:'snapshot_applied',revision:2})].join('\n');
  const r=summarize('',c);
  assert.equal(r.verdict,'OBSERVED_CONTRADICTION');
  assert.equal(r.anomalies[0].code,'CLIENT_REVISION_NONMONOTONIC');
  assert.equal(r.coverage.client_applied_without_matching_host_sample,2);
});

test('P2 is not your turn during P1 aiming',()=>{
  const c=trace({type:'turn_state',revision:6,turn:0,localOwner:1,phase:'aiming',banner:'your_turn'});
  const r=summarize('',c);
  assert.equal(r.turn_mismatches[0].code,'TURN_BANNER_MISMATCH');
  assert.equal(r.turn_mismatches[0].expected,'opponent_turn');
});

test('moving phase cannot show actionable your-turn banner',()=>{
  const r=summarize(trace({type:'turn_state',revision:6,turn:0,localOwner:0,phase:'moving',banner:'your_turn'}),'');
  assert.equal(r.turn_mismatches[0].expected,'inactive');
});

test('drift comparison only matches same revision/action/ball/layer',()=>{
  const h=trace({type:'ball_state',revision:6,actionSerial:2,ballId:1,layer:'render',x:0,y:0});
  const c=[trace({type:'ball_state',revision:7,actionSerial:2,ballId:1,layer:'render',x:100,y:100}),trace({type:'ball_state',revision:6,actionSerial:2,ballId:1,layer:'render',x:1,y:0})].join('\n');
  const r=summarize(h,c,{driftThreshold:0.5});
  assert.equal(r.paired_ball_samples,1);
  assert.equal(r.above_threshold_samples,1);
  assert.equal(r.worst_ball_distance.distance,1);
});

test('invalid JSON and malformed non-finite fields handled safely',()=>{
  const p=parseLog('CC_W9_TRACE {bad\n'+trace({type:'ball_state',revision:1,actionSerial:1,ballId:1,layer:'simulation',x:'NaN',y:0}),'client');
  assert.equal(p.malformed,2);assert.equal(p.events.length,0);
});

test('reject invalid threshold and do not leak error messages',()=>{
  assert.throws(()=>summarize('','',{driftThreshold:-1}),/Invalid drift/);
  const r=summarize('CC_NET_SNAPSHOT_ERROR internal token=secret','','');
  assert.equal(r.host.legacy.snapshot_error,1);
  assert.equal(JSON.stringify(r).includes('secret'),false);
});
