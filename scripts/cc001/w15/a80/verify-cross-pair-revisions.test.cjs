'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const {crossPairRevisions} = require('./verify-cross-pair-revisions.cjs');
const hash = c => c.repeat(64);
const obs = (device, revision, options={}) => ({
  device,localOwner:device==='PC1'?0:1,binaryAssemblySha256:hash('a'),
  authoritative:{revision,turn:0,phase:'Moving',stateDigest:hash('b')},
  balls:[{id:1,canonical:{x:20,y:30}},{id:2,canonical:{x:40,y:50}}],...options
});
const pair = (index,a,b) => ({index,observations:[a,b]});
const staggered = () => [pair(1,obs('PC1',42),obs('PC2',41)),
  pair(2,obs('PC1',43),obs('PC2',42))];
const contains = (rows,code) => rows.some(x=>x.code===code);
test('staggered equal revision across pairs is matched without clock assumptions',()=>{
 const result=crossPairRevisions(staggered());
 assert.equal(result.errors.length,0); assert.equal(result.gaps.length,0);
 assert.ok(contains(result.notes,'ASYNCHRONOUS_SAME_REVISION_MATCH'));
 assert.equal(result.physicalG3Status,'NOT_ASSESSED');
});
test('contradictory same-revision turn across different pairs is rejected',()=>{
 const x=staggered(); x[1].observations[1].authoritative.turn=1;
 assert.ok(contains(crossPairRevisions(x).errors,'CROSS_PAIR_TURN_OR_PHASE_MISMATCH'));
});
test('contradictory phase across different pairs is rejected',()=>{
 const x=staggered(); x[1].observations[1].authoritative.phase='Aiming';
 assert.ok(contains(crossPairRevisions(x).errors,'CROSS_PAIR_TURN_OR_PHASE_MISMATCH'));
});
test('digest contradiction across pairs is detected',()=>{
 const x=staggered(); x[1].observations[1].authoritative.stateDigest=hash('c');
 assert.ok(contains(crossPairRevisions(x).errors,'CROSS_PAIR_STATE_DIGEST_MISMATCH'));
});
test('missing digest is a gap, not fabricated parity',()=>{
 const x=staggered(); delete x[1].observations[1].authoritative.stateDigest;
 const r=crossPairRevisions(x); assert.ok(contains(r.gaps,'CROSS_PAIR_SOURCE_DIGEST_UNVERIFIED'));
 assert.equal(r.physicalG3Status,'NOT_ASSESSED');
});
test('assembly mismatch across pairs is detected',()=>{
 const x=staggered(); x[1].observations[1].binaryAssemblySha256=hash('f');
 assert.ok(contains(crossPairRevisions(x).errors,'CROSS_PAIR_ASSEMBLY_MISMATCH'));
});
test('missing assembly SHA is an evidence gap',()=>{
 const x=staggered(); delete x[1].observations[1].binaryAssemblySha256;
 assert.ok(contains(crossPairRevisions(x).gaps,'CROSS_PAIR_ASSEMBLY_DIGEST_UNVERIFIED'));
});
test('canonical ball-position discrepancy across pairs is rejected',()=>{
 const x=staggered(); x[1].observations[1].balls[0].canonical.x=24;
 assert.ok(contains(crossPairRevisions(x).errors,'CROSS_PAIR_CANONICAL_POSE_MISMATCH'));
});
test('one missing ball sample is a gap without a fake pose failure',()=>{
 const x=staggered(); x[1].observations[1].balls.pop();
 const r=crossPairRevisions(x);
 assert.ok(contains(r.gaps,'CROSS_PAIR_CANONICAL_SET_INCOMPLETE'));
 assert.equal(contains(r.errors,'CROSS_PAIR_CANONICAL_POSE_MISMATCH'),false);
});
test('matching same-pair revision is accepted, not excluded',()=>{
 const r=crossPairRevisions([pair(1,obs('PC1',42),obs('PC2',42))]);
 assert.equal(r.errors.length,0); assert.equal(r.gaps.length,0);
 assert.equal(contains(r.notes,'ASYNCHRONOUS_SAME_REVISION_MATCH'),false);
});
test('no falsely compared snapshots from different revisions',()=>{
 const r=crossPairRevisions([pair(1,obs('PC1',41),obs('PC2',42))]);
 assert.equal(r.errors.length,0); assert.equal(r.gaps.length,0);
});
test('unrecognized device is ignored, not evidence of third player',()=>{
 const x=staggered(); x[1].observations.push(obs('PC3',42));
 assert.equal(crossPairRevisions(x).errors.length,0);
});
test('same PC repeat still checks against earlier other device',()=>{
 const x=[pair(1,obs('PC1',42),obs('PC2',42)),pair(2,obs('PC1',42,{balls:[{id:1,canonical:{x:22,y:30}},{id:2,canonical:{x:40,y:50}}]}),obs('PC2',43))];
 assert.ok(contains(crossPairRevisions(x).errors,'CROSS_PAIR_CANONICAL_POSE_MISMATCH'));
});
test('invalid revision and missing pairs cannot yield G3 pass',()=>{
 const r=crossPairRevisions([pair(1,obs('PC1',0),obs('PC2',0))]);
 assert.equal(r.errors.length,0);assert.equal(r.physicalG3Status,'NOT_ASSESSED');
 const none=crossPairRevisions(null);assert.equal(none.physicalG3Status,'NOT_ASSESSED');
});
test('same revision comparison is case-insensitive for SHA digests',()=>{
 const x=staggered(); x[1].observations[1].authoritative.stateDigest=hash('B');
 assert.equal(crossPairRevisions(x).errors.length,0);
});
test('a different pair can provide same revision in reversed PC order',()=>{
 const x=[pair(1,obs('PC1',40),obs('PC2',42)),pair(2,obs('PC1',42),obs('PC2',43))];
 const r=crossPairRevisions(x);assert.equal(r.errors.length,0);
 assert.ok(contains(r.notes,'ASYNCHRONOUS_SAME_REVISION_MATCH'));
});
test('different valid actionSerial at equal revision is a contradiction',()=>{
 const x=staggered(); x[0].observations[0].authoritative.actionSerial=3;
 x[1].observations[1].authoritative.actionSerial=4;
 assert.ok(contains(crossPairRevisions(x).errors,'CROSS_PAIR_ACTION_SERIAL_MISMATCH'));
});
test('missing optional actionSerial is not invented',()=>{
 const x=staggered();x[0].observations[0].authoritative.actionSerial=3;
 assert.equal(crossPairRevisions(x).errors.length,0);
});
