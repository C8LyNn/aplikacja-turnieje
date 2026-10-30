'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {analyze,PROFILES,EXIT}=require('./check-displacement-trace.cjs');
const FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const DEV='87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c';
function sample(revision,kind,ballId=7,otherId=0){
  return {device:'PC2',observation:'POST_APPLY_POST_OBSERVE',phase:'Moving',
    revision,actionSerial:revision,cursorBefore:revision-1,cursorAfter:revision,
    events:[{id:revision,kind,ballId,otherId}],
    hostBalls:[{id:7,x:112,y:230},{id:8,x:201,y:220}],
    renderedBalls:[{id:7,x:112,y:230},{id:8,x:201,y:220}]};
}
function trace(sha=DEV){return {schema:'CC001-A82-DISPLACEMENT-TRACE-v2',sourceSha:sha,
  sourceProfile:PROFILES[sha].name,evidence:{captureType:'synthetic'},
  samples:sha===FREEZE?[sample(1,'PORTAL')]:[
    sample(1,'PORTAL'),sample(2,'TELEPORT'),sample(3,'SWAP',7,8)]};}
function result(mutator,sha=DEV){const t=trace(sha);mutator?.(t);return analyze(t,sha);}
function is(status,mutator,sha=DEV){const r=result(mutator,sha);assert.equal(r.status,status,JSON.stringify(r));return r;}
function cli(input,sha=DEV){const d=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a82-w13-'));try{
  const f=path.join(d,'data.json');if(input!==null)fs.writeFileSync(f,JSON.stringify(input));
  return spawnSync(process.execPath,[path.join(__dirname,'check-displacement-trace.cjs'),'--expected-sha',sha,f],{encoding:'utf8'});
}finally{fs.rmSync(d,{recursive:true,force:true});}}

test('dev exact SHA supports three observed displacement kinds; always G3 NOT_ASSESSED',()=>{
  const r=is('PASS_SCOPED');assert.equal(r.metrics.snapBallChecks,4);
  assert.equal(r.fullDisplacementCapability,true);assert.equal(r.physicalG3Status,'NOT_ASSESSED');
});
test('freeze exact SHA supports only PORTAL, not false three-mechanic coverage',()=>{
  const r=is('PASS_SCOPED',undefined,FREEZE);
  assert.equal(r.fullDisplacementCapability,false);assert.deepEqual(r.excludedKinds,['TELEPORT','SWAP']);
  assert.match(r.reason,/Only PORTAL/);assert.equal(r.metrics.snapBallChecks,1);
});
test('W12 synthetic three-event fixture at freeze is refused as HOLD',()=>{
  const t=trace(DEV);t.sourceSha=FREEZE;t.sourceProfile=PROFILES[FREEZE].name;
  const r=analyze(t,FREEZE);assert.equal(r.status,'HOLD');assert.equal(r.unsupportedObserved.length,2);
});
test('unexpected TELEPORT at freeze is HOLD, never implied PASS',()=>{
  const r=is('HOLD',t=>t.samples.push(sample(2,'TELEPORT')),FREEZE);
  assert.equal(r.unsupportedObserved.length,1);
});
test('unexpected two-ball SWAP at freeze is HOLD',()=>{
  const r=is('HOLD',t=>t.samples.push(sample(2,'SWAP',7,8)),FREEZE);
  assert.equal(r.unsupportedObserved.length,1);
});
test('unreviewed exact SHA is HOLD, cannot be assigned dev profile',()=>{
  const t=trace(DEV),sha='a'.repeat(40);t.sourceSha=sha;t.sourceProfile=PROFILES[DEV].name;
  const r=analyze(t,sha);assert.equal(r.status,'HOLD');assert.equal(r.fullDisplacementCapability,false);
});
test('wrong recorded source SHA fails',()=>is('FAIL',t=>t.sourceSha=FREEZE));
test('wrong source profile fails even with correct SHA',()=>is('FAIL',t=>t.sourceProfile=PROFILES[FREEZE].name));
test('legacy v1 schema HOLD, does not falsely certify freeze',()=>is('HOLD',t=>t.schema='CC001-A82-DISPLACEMENT-TRACE-v1'));
test('missing input HOLD',()=>assert.equal(analyze(null,DEV).status,'HOLD'));
test('malformed SHA HOLD',()=>assert.equal(analyze(trace(), 'x').status,'HOLD'));
test('missing capture type HOLD',()=>is('HOLD',t=>delete t.evidence));
test('unsupported captureType HOLD',()=>is('HOLD',t=>t.evidence.captureType='verified'));
test('zero samples HOLD',()=>is('HOLD',t=>t.samples=[]));
test('missing TELEPORT observation on dev HOLD',()=>is('HOLD',t=>t.samples.splice(1,1)));
test('missing SWAP observation on dev HOLD',()=>is('HOLD',t=>t.samples.pop()));
test('wrong TELEPORT actor pose FAIL, even when displacement short',()=>is('FAIL',t=>t.samples[1].renderedBalls[0].x+=55));
test('SWAP target mismatched pose FAIL',()=>is('FAIL',t=>t.samples[2].renderedBalls[1].x+=5));
test('SWAP source mismatched pose FAIL',()=>is('FAIL',t=>t.samples[2].renderedBalls[0].x+=5));
test('SWAP missing target ID FAIL (does not count as two-ball test)',()=>is('FAIL',t=>t.samples[2].events[0].otherId=0));
test('SWAP target same as source FAIL',()=>is('FAIL',t=>t.samples[2].events[0].otherId=7));
test('invalid TELEPORT actor FAIL',()=>is('FAIL',t=>t.samples[1].events[0].ballId=0));
test('missing host participant FAIL',()=>is('FAIL',t=>t.samples[2].hostBalls.pop()));
test('missing rendered participant FAIL',()=>is('FAIL',t=>t.samples[2].renderedBalls.pop()));
test('duplicate host ball FAIL',()=>is('FAIL',t=>t.samples[0].hostBalls.push({...t.samples[0].hostBalls[0]})));
test('duplicate rendered ball FAIL',()=>is('FAIL',t=>t.samples[0].renderedBalls.push({...t.samples[0].renderedBalls[0]})));
test('nonfinite host position FAIL',()=>is('FAIL',t=>t.samples[0].hostBalls[0].x=Infinity));
test('nonfinite render position FAIL',()=>is('FAIL',t=>t.samples[0].renderedBalls[0].x=NaN));
test('repeated snapshot revision FAIL',()=>is('FAIL',t=>t.samples[2].revision=2));
test('actionSerial regresses across revisions FAIL',()=>is('FAIL',t=>t.samples[2].actionSerial=0));
test('event cursor claims unobserved event FAIL',()=>is('FAIL',t=>t.samples[2].cursorAfter=99));
test('cursor discontinuity HOLD, not asserted PASS',()=>{
 const r=is('HOLD',t=>{t.samples[2].cursorBefore=9;t.samples[2].events[0].id=10;t.samples[2].cursorAfter=10;});
 assert.match(r.reason,/cursor discontinuity/);
});
test('duplicated event ids within one sample FAIL',()=>is('FAIL',t=>t.samples[2].events.push({...t.samples[2].events[0]})));
test('event ids reordered within one sample FAIL',()=>is('FAIL',t=>{
 t.samples[2].events=[{id:3,kind:'SWAP',ballId:7,otherId:8},{id:2,kind:'HIT',ballId:7,otherId:0}];
}));
test('already consumed historical event does not count as fresh and results HOLD',()=>is('HOLD',t=>{
 t.samples[2].events[0].id=2;t.samples[2].cursorAfter=2;
}));
test('unrelated event never forces pose snap',()=>{
 const r=is('HOLD',t=>{t.samples[2].events[0].kind='DAMAGE';t.samples[2].renderedBalls[0].x+=123;});
 assert.deepEqual(r.missing,['SWAP']);
});
test('invalid observation stage FAIL',()=>is('FAIL',t=>t.samples[0].observation='PRE_APPLY'));
test('non PC2 sample FAIL',()=>is('FAIL',t=>t.samples[0].device='PC1'));
test('negative pose tolerance HOLD',()=>assert.equal(analyze(trace(),DEV,{tolerance:-1}).status,'HOLD'));
test('operator-labelled trace never confers physical G3',()=>{
 const r=is('PASS_SCOPED',t=>t.evidence.captureType='operator');assert.equal(r.physicalG3Status,'NOT_ASSESSED');
});
test('CLI full dev fixture exit0, physical NOT_ASSESSED',()=>{
 const r=cli(trace());assert.equal(r.status,EXIT.PASS,r.stderr);assert.equal(JSON.parse(r.stdout).physicalG3Status,'NOT_ASSESSED');
});
test('CLI freeze portal-only fixture exit0, explicit missing capabilities',()=>{
 const r=cli(trace(FREEZE),FREEZE);assert.equal(r.status,EXIT.PASS,r.stderr);assert.equal(JSON.parse(r.stdout).fullDisplacementCapability,false);
});
test('CLI freeze rejects 3-event fixture as HOLD/exit2',()=>{
 const t=trace();t.sourceSha=FREEZE;t.sourceProfile=PROFILES[FREEZE].name;
 const r=cli(t,FREEZE);assert.equal(r.status,EXIT.HOLD,r.stdout);
});
test('CLI wrong SHA exit1',()=>assert.equal(cli(trace(),FREEZE).status,EXIT.FAIL));
test('CLI no file exit2',()=>assert.equal(cli(null).status,EXIT.HOLD));
test('CLI unknown SHA exit2',()=>assert.equal(cli(trace(),'a'.repeat(40)).status,EXIT.HOLD));
test('CLI invalid args exit64',()=>{
 const r=spawnSync(process.execPath,[path.join(__dirname,'check-displacement-trace.cjs')],{encoding:'utf8'});
 assert.equal(r.status,EXIT.USAGE);
});
