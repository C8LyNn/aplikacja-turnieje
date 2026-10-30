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
// R17-W10 / A80: A10-approved arrow-only power UX and paired exact-build provenance.
function w10Fixture(){
  const f=fixture(); const sha='a'.repeat(40), bin='b'.repeat(64);
  f.policy={...f.policy, powerIndicator:'arrow-only',requireSameBuild:true,
    targetSourceSha:sha, requireConnectionState:true,requireInputParity:true};
  for(const o of f.observations){
    o.networkConnected=true;
    o.evidence.sourceSha=sha; o.evidence.playerAssemblySha256=bin;
    o.ui.powerBarVisible=false; o.ui.powerPercentVisible=false;
    o.ui.inputEnabled=o.localOwner===o.authoritative.turn;
  }
  return f;
}
test('W10 both seats have A10 arrow-only power UI with exact same source and binary',()=>{
  const r=assess(w10Fixture());assert.equal(r.verdict,'OBSERVATION_CONTRACT_CONSISTENT');
});
test('W10 obsolete power bar on PC2 is rejected',()=>{
  const v=w10Fixture();v.observations[1].ui.powerBarVisible=true;
  assert.ok(codes(assess(v)).includes('REDUNDANT_POWER_HUD_VISIBLE'));
});
test('W10 obsolete power percentage on PC1 is rejected',()=>{
  const v=w10Fixture();v.observations[0].ui.powerPercentVisible=true;
  assert.ok(codes(assess(v)).includes('REDUNDANT_POWER_HUD_VISIBLE'));
});
test('W10 no inspection of power HUD is incomplete evidence, not PASS',()=>{
  const v=w10Fixture();delete v.observations[0].ui.powerBarVisible;
  assert.equal(assess(v).verdict,'INSUFFICIENT_EVIDENCE');
});
test('W10 PC2 cannot actively drag during P1 turn',()=>{
  const v=w10Fixture();v.observations[1].ui.aim.dragActive=true;
  assert.ok(codes(assess(v)).includes('AIM_DRAG_OUTSIDE_LOCAL_TURN'));
});
test('W10 PC2 control accidentally enabled on P1 turn is rejected',()=>{
  const v=w10Fixture();v.observations[1].ui.inputEnabled=true;
  assert.ok(codes(assess(v)).includes('INPUT_ENABLED_OUTSIDE_LOCAL_TURN'));
});
test('W10 disconnected P1 cannot show Your Turn nor enable controls',()=>{
  const v=w10Fixture();v.observations[0].networkConnected=false;
  const out=assess(v);assert.ok(codes(out).includes('YOUR_TURN_LABEL_MISMATCH'));
  assert.ok(codes(out).includes('INPUT_ENABLED_OUTSIDE_LOCAL_TURN'));
});
test('W10 both PCs must run same compiled player assembly',()=>{
  const v=w10Fixture();v.observations[1].evidence.playerAssemblySha256='c'.repeat(64);
  assert.ok(codes(assess(v)).includes('PC_PLAYER_ASSEMBLY_MISMATCH'));
});
test('W10 valid but different source SHA is rejected against pinned target',()=>{
  const v=w10Fixture();v.observations[1].evidence.sourceSha='c'.repeat(40);
  assert.ok(codes(assess(v)).includes('SOURCE_NOT_TARGET_SHA'));
  assert.ok(codes(assess(v)).includes('PC_BUILD_SOURCE_MISMATCH'));
});
test('W10 missing actual assembly hash is an evidence gap',()=>{
  const v=w10Fixture();v.observations[0].evidence.playerAssemblySha256='unverified';
  const r=assess(v);assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');
  assert.ok(r.gaps.some(x=>x.code==='PLAYER_ASSEMBLY_SHA256_UNVERIFIED'));
});
test('W10 disconnected seat with no turn/readiness claim is consistent',()=>{
  const v=w10Fixture();v.observations[1].networkConnected=false;
  v.observations[1].ui.yourTurnShown=false;
  v.observations[1].ui.inputEnabled=false;
  assert.equal(assess(v).verdict,'OBSERVATION_CONTRACT_CONSISTENT');
});
test('W10 missing explicit transport connection state is incomplete',()=>{
  const v=w10Fixture();delete v.observations[0].networkConnected;
  assert.equal(assess(v).verdict,'INSUFFICIENT_EVIDENCE');
});
