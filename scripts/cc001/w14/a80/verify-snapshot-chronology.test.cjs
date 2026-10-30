'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {chronology}=require('./verify-snapshot-chronology.cjs');
const digest=n=>String(n).repeat(64);
function sample(rev=41, turn=0, phase='Aiming', serial=rev) {
 return {observations:[{device:'PC1',localOwner:0,binaryAssemblySha256:digest('a'),authoritative:{revision:rev,turn,phase,stateDigest:digest('b'),actionSerial:serial}},
 {device:'PC2',localOwner:1,binaryAssemblySha256:digest('a'),authoritative:{revision:rev,turn,phase,stateDigest:digest('b'),actionSerial:serial}}]};
}
function seq(a,b){a.index=1;b.index=2;return [a,b]}
const has=(list,code)=>list.some(x=>x.code===code);
test('legitimate consecutive revisions on two seats remain consistent, no G3',()=>{const r=chronology(seq(sample(41),sample(42)));assert.equal(r.errors.length,0);assert.equal(r.gaps.length,0);assert.equal(r.physicalG3Status,'NOT_ASSESSED')});
test('duplicate snapshot at same revision with unchanged state is valid',()=>{const r=chronology(seq(sample(41),sample(41)));assert.equal(r.errors.length,0)});
test('host authoritative revision rollback is rejected',()=>{const x=seq(sample(42),sample(41));assert.ok(has(chronology(x).errors,'AUTHORITATIVE_REVISION_ROLLBACK'))});
test('client-only rollback is rejected even when host continues',()=>{const x=seq(sample(41),sample(42));x[1].observations[1].authoritative.revision=39;assert.ok(has(chronology(x).errors,'AUTHORITATIVE_REVISION_ROLLBACK'))});
test('same revision change in visible turn is rejected',()=>{const x=seq(sample(41),sample(41));x[1].observations[0].authoritative.turn=1;assert.ok(has(chronology(x).errors,'TURN_OR_PHASE_CHANGED_WITHOUT_REVISION'))});
test('same revision change in phase is rejected',()=>{const x=seq(sample(41),sample(41));x[1].observations[1].authoritative.phase='Moving';assert.ok(has(chronology(x).errors,'TURN_OR_PHASE_CHANGED_WITHOUT_REVISION'))});
test('same revision with source-bound digest mutation is rejected',()=>{const x=seq(sample(41),sample(41));x[1].observations[1].authoritative.stateDigest=digest('c');assert.ok(has(chronology(x).errors,'DIGEST_CHANGED_WITHOUT_REVISION'))});
test('digest change on newer revision is not itself an error',()=>{const x=seq(sample(41),sample(42));x[1].observations[1].authoritative.stateDigest=digest('c');assert.equal(chronology(x).errors.length,0)});
test('local seat swap between captures is rejected',()=>{const x=seq(sample(41),sample(42));x[1].observations[1].localOwner=0;assert.ok(has(chronology(x).errors,'LOCAL_SEAT_CHANGED_WITHIN_CAPTURE'))});
test('same PC changing binary assembly SHA during capture is rejected',()=>{const x=seq(sample(41),sample(42));x[1].observations[0].binaryAssemblySha256=digest('f');assert.ok(has(chronology(x).errors,'PLAYER_ASSEMBLY_CHANGED_WITHIN_CAPTURE'))});
test('action serial rollback is rejected',()=>{const x=seq(sample(41,0,'Aiming',9),sample(42,0,'Aiming',8));assert.ok(has(chronology(x).errors,'ACTION_SERIAL_ROLLBACK'))});
test('action serial change without revision is rejected',()=>{const x=seq(sample(41,0,'Aiming',9),sample(41,0,'Aiming',10));assert.ok(has(chronology(x).errors,'ACTION_SERIAL_CHANGED_WITHOUT_REVISION'))});
test('missing optional action serial does not invent a value',()=>{const x=seq(sample(41),sample(42));delete x[1].observations[1].authoritative.actionSerial;assert.equal(chronology(x).errors.length,0)});
test('skipped revisions are noted, not treated as packet loss',()=>{const r=chronology(seq(sample(41),sample(45)));assert.equal(r.errors.length,0);assert.ok(has(r.notes,'INTERVENING_REVISIONS_NOT_OBSERVED'))});
test('missing authoritative revision is a gap, not physical PASS',()=>{const x=seq(sample(41),sample(42));delete x[1].observations[1].authoritative.revision;const r=chronology(x);assert.ok(has(r.gaps,'AUTHORITATIVE_REVISION_NOT_CAPTURED'));assert.equal(r.physicalG3Status,'NOT_ASSESSED')});
test('missing input does not claim sufficient evidence',()=>{const r=chronology(null);assert.equal(r.errors.length,0);assert.equal(r.physicalG3Status,'NOT_ASSESSED')});
test('same code handles only PC1/PC2 and does not misread other metadata',()=>{const x=seq(sample(41),sample(42));x[1].observations.push({device:'PC3',authoritative:{revision:0}});const r=chronology(x);assert.equal(r.gaps.length,0)});
test('per-device isolation: host still coherent if client advances twice',()=>{const x=seq(sample(41),sample(42));x[1].observations[1].authoritative.revision=44;assert.equal(chronology(x).errors.length,0)});
