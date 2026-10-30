'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {SCHEMA,assess}=require('./verify-player-view.cjs');
function fixture() {
  const make=(device,localOwner)=>({device,localOwner,
    evidence:{screenshotPath:'evidence/'+device+'.png',logPath:'evidence/'+device+'.log',captureUtc:'2026-10-30T17:00:00Z'},
    authoritative:{turn:0,phase:'Aiming',revision:12,stateDigest:'sha256:matching'},
    ui:{turnBannerOwner:0,yourTurnShown:localOwner===0,deckOwner:localOwner,
      localPlayerAtBottom:true,aim:{dragActive:localOwner===0,arrowVisible:true,arrowAlignedWithDrag:true}}});
  return {schema:SCHEMA,policy:{perspective:'local-player-bottom'},observations:[make('PC1',0),make('PC2',1)]};
}
function codes(report) {return report.errors.map(x=>x.code);}
test('two seats and honest turn/aim annotations are logically consistent, not physical PASS',()=>{
  const r=assess(fixture());assert.equal(r.verdict,'OBSERVATION_CONTRACT_CONSISTENT');assert.equal(r.physicalG3Status,'NOT_ASSESSED');
});
test('PC2 must never say Your Turn while P1 is aiming',()=>{
  const v=fixture();v.observations[1].ui.yourTurnShown=true;
  assert.ok(codes(assess(v)).includes('YOUR_TURN_LABEL_MISMATCH'));
});
test('turn label distinguishes global turn from local owner',()=>{
  const v=fixture();v.observations[1].ui.turnBannerOwner=1;
  assert.ok(codes(assess(v)).includes('TURN_BANNER_OWNER_MISMATCH'));
});
test('PC2 sees own deck, not opponent stock',()=>{
  const v=fixture();v.observations[1].ui.deckOwner=0;
  assert.ok(codes(assess(v)).includes('DECK_OWNER_MISMATCH'));
});
test('local-player-bottom requirement is independent of seat color',()=>{
  const v=fixture();v.observations[1].ui.localPlayerAtBottom=false;
  assert.ok(codes(assess(v)).includes('LOCAL_PERSPECTIVE_NOT_BOTTOM'));
});
test('P2 turn after authoritative switch has correct local state',()=>{
  const v=fixture();for(const o of v.observations){o.authoritative.turn=1;o.authoritative.revision=13;o.ui.turnBannerOwner=1;o.ui.yourTurnShown=o.localOwner===1;o.ui.aim.dragActive=o.localOwner===1;}
  assert.equal(assess(v).verdict,'OBSERVATION_CONTRACT_CONSISTENT');
});
test('no Your Turn while match is Moving, even if owner seat equals current turn',()=>{
  const v=fixture();for(const o of v.observations){o.authoritative.phase='Moving';o.ui.yourTurnShown=false;o.ui.aim.dragActive=false;}
  assert.equal(assess(v).verdict,'OBSERVATION_CONTRACT_CONSISTENT');
});
test('active drag without visible aim arrow is a problem',()=>{
  const v=fixture();v.observations[0].ui.aim.arrowVisible=false;
  assert.ok(codes(assess(v)).includes('AIM_ARROW_ABSENT'));
});
test('active drag with backward aim arrow is a problem',()=>{
  const v=fixture();v.observations[0].ui.aim.arrowAlignedWithDrag=false;
  assert.ok(codes(assess(v)).includes('AIM_ARROW_MISALIGNED'));
});
test('same revision with divergent state digests is a synchronization failure',()=>{
  const v=fixture();v.observations[1].authoritative.stateDigest='sha256:different';
  assert.ok(codes(assess(v)).includes('SAME_REV_STATE_DIVERGENCE'));
});
test('different revisions must not be compared as if snapshots synchronized',()=>{
  const v=fixture();v.observations[1].authoritative.revision=11;
  const r=assess(v);assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');assert.ok(r.gaps.some(x=>x.code==='SAME_REVISION_PAIR_NOT_CAPTURED'));
});
test('no operator screenshot provenance is not clean evidence',()=>{
  const v=fixture();v.observations[0].evidence.screenshotPath='';
  assert.equal(assess(v).verdict,'INSUFFICIENT_EVIDENCE');
});
test('duplicate seats are a hard contradiction',()=>{
  const v=fixture();v.observations[1].localOwner=0;
  assert.ok(codes(assess(v)).includes('LOCAL_SEAT_COLLISION'));
});
test('missing visible turn or aim fields cannot quietly PASS',()=>{
  const v=fixture();delete v.observations[1].ui.yourTurnShown;delete v.observations[0].ui.aim;
  const r=assess(v);assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');
  assert.ok(r.gaps.some(x=>x.code==='YOUR_TURN_LABEL_UNVERIFIED'));
});
test('unverified full-state digest never establishes state parity',()=>{
  const v=fixture();delete v.observations[1].authoritative.stateDigest;
  const r=assess(v);assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');
});
test('non-Aiming phases cannot accept operator-observed active aiming',()=>{
  const v=fixture();v.observations[0].authoritative.phase='Over';v.observations[0].ui.yourTurnShown=false;
  assert.ok(codes(assess(v)).includes('DRAG_ACTIVE_DURING_NON_AIMING_PHASE'));
});
