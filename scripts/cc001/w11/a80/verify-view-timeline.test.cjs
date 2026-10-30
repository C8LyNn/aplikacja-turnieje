'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {SCHEMA,analyze}=require('./verify-view-timeline.cjs');
const has=(items,k)=>items.some(x=>x.code===k);
function fixture(){
 const obs=(dev,owner,rev,turn,serial)=>({device:dev,localOwner:owner,networkConnected:true,
  evidence:{screenshotPath:'private/'+dev+'-'+rev+'.png',logPath:'private/'+dev+'.log',captureUtc:'2026-10-30T18:00:'+String(rev).padStart(2,'0')+'Z',sourceSha:'a'.repeat(40),playerAssemblySha256:'b'.repeat(64)},
  authoritative:{revision:rev,turn,phase:'Aiming',actionSerial:serial,stateDigest:'digest-'+rev},
  ui:{turnBannerOwner:turn,yourTurnShown:turn===owner,deckOwner:owner,inputEnabled:turn===owner,
    localPlayerAtBottom:true,powerBarVisible:false,powerPercentVisible:false,
    aim:{dragActive:false,arrowVisible:false,arrowAlignedWithDrag:false}}});
 return {schema:SCHEMA,policy:{perspective:'local-player-bottom',powerIndicator:'arrow-only',targetSourceSha:'a'.repeat(40)},
  frames:[{index:1,observations:[obs('PC1',0,11,0,1),obs('PC2',1,11,0,1)]},
          {index:2,observations:[obs('PC1',0,12,1,2),obs('PC2',1,12,1,2)]}]};
}
test('W11 honest two-frame two-seat timeline is internally consistent, never G3',()=>{const a=analyze(fixture());assert.equal(a.verdict,'OBSERVATION_SEQUENCE_CONSISTENT');assert.equal(a.physicalG3Status,'NOT_ASSESSED');});
test('W11 stale P2 turn label fails',()=>{const s=fixture();s.frames[1].observations[0].ui.yourTurnShown=true;assert.ok(has(analyze(s).contradictions,'YOUR_TURN_LABEL_MISMATCH'));});
test('W11 P2 local controls cannot activate during P1 turn',()=>{const s=fixture();s.frames[0].observations[1].ui.inputEnabled=true;assert.ok(has(analyze(s).contradictions,'INPUT_ENABLED_OUTSIDE_LOCAL_TURN'));});
test('W11 local identity cannot change between two captures',()=>{const s=fixture();s.frames[1].observations[1].localOwner=0;assert.ok(has(analyze(s).contradictions,'LOCAL_OWNER_CHANGED_IN_SESSION'));});
test('W11 duplicate frame index is rejected',()=>{const s=fixture();s.frames[1].index=1;assert.ok(has(analyze(s).contradictions,'FRAME_SEQUENCE_NOT_INCREASING'));});
test('W11 monotonically increasing snapshot revision is required',()=>{const s=fixture();s.frames[1].observations[1].authoritative.revision=10;assert.ok(has(analyze(s).contradictions,'SNAPSHOT_REVISION_ROLLBACK'));});
test('W11 same revision cannot report two different turns on PC1',()=>{const s=fixture();s.frames[1].observations[0].authoritative.revision=11;assert.ok(has(analyze(s).contradictions,'STATE_CHANGED_WITHOUT_REVISION'));});
test('W11 same revision state digest cannot change',()=>{const s=fixture();const o=s.frames[1].observations[0];o.authoritative.revision=11;o.authoritative.turn=0;o.ui.turnBannerOwner=0;o.ui.yourTurnShown=true;o.ui.inputEnabled=true;assert.ok(has(analyze(s).contradictions,'DIGEST_CHANGED_WITHOUT_REVISION'));});
test('W11 action serial cannot roll back',()=>{const s=fixture();s.frames[1].observations[0].authoritative.actionSerial=0;assert.ok(has(analyze(s).contradictions,'ACTION_SERIAL_ROLLBACK'));});
test('W11 action serial unchanged revision is contradictory',()=>{const s=fixture();const o=s.frames[1].observations[0];o.authoritative.revision=11;o.authoritative.turn=0;o.ui.turnBannerOwner=0;o.ui.yourTurnShown=true;o.ui.inputEnabled=true;assert.ok(has(analyze(s).contradictions,'ACTION_SERIAL_CHANGED_WITHOUT_REVISION'));});
test('W11 assembly hash cannot change mid-session',()=>{const s=fixture();s.frames[1].observations[0].evidence.playerAssemblySha256='c'.repeat(64);assert.ok(has(analyze(s).contradictions,'BINARY_CHANGED_DURING_CAPTURE'));});
test('W11 power percentage must remain absent',()=>{const s=fixture();s.frames[1].observations[1].ui.powerPercentVisible=true;assert.ok(has(analyze(s).contradictions,'REDUNDANT_POWER_HUD_VISIBLE'));});
test('W11 absent source SHA is evidence gap, never PASS',()=>{const s=fixture();delete s.frames[0].observations[0].evidence.sourceSha;assert.equal(analyze(s).verdict,'INSUFFICIENT_EVIDENCE');});
test('W11 missing action serial is evidence gap',()=>{const s=fixture();delete s.frames[0].observations[0].authoritative.actionSerial;assert.ok(has(analyze(s).gaps,'ACTION_SERIAL_NOT_OBSERVED'));});
test('W11 bad UTC timestamps are evidence gaps',()=>{const s=fixture();s.frames[0].observations[0].evidence.captureUtc='not-a-date';assert.ok(has(analyze(s).gaps,'UTC_CAPTURE_TIME_INVALID'));});
test('W11 same-device UTC goes backward is a contradiction',()=>{const s=fixture();s.frames[1].observations[0].evidence.captureUtc='2026-10-30T17:59:59Z';assert.ok(has(analyze(s).contradictions,'CAPTURE_CLOCK_WENT_BACKWARD'));});
test('W11 mismatched PC1 and PC2 revisions are incomplete, not desync PASS',()=>{const s=fixture();s.frames[0].observations[1].authoritative.revision=10;assert.equal(analyze(s).verdict,'INSUFFICIENT_EVIDENCE');});
test('W11 one frame does not establish progression',()=>{const s=fixture();s.frames.pop();assert.ok(has(analyze(s).gaps,'MINIMUM_TWO_CAPTURE_FRAMES_REQUIRED'));});
test('W11 same-revision cross-device full-state hashes must match',()=>{const s=fixture();s.frames[1].observations[1].authoritative.stateDigest='distinct';assert.ok(has(analyze(s).contradictions,'SAME_REV_STATE_DIVERGENCE'));});
test('W11 opponent turn cannot actively drag',()=>{const s=fixture();s.frames[0].observations[1].ui.aim.dragActive=true;assert.ok(has(analyze(s).contradictions,'AIM_DRAG_OUTSIDE_LOCAL_TURN'));});
test('W11 equal revision, different phase on separate PCs is contradiction',()=>{const s=fixture();const p=s.frames[1].observations[1];p.authoritative.phase='Moving';p.ui.yourTurnShown=false;p.ui.inputEnabled=false;assert.ok(has(analyze(s).contradictions,'SAME_REV_PHASE_DIVERGENCE'));});
