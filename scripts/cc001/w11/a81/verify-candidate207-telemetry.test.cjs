'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {parse,expectedMs,analyze,PIN}=require('./verify-candidate207-telemetry.cjs');
const h=(rev=1,packedBytes=1000,periodMs=50,phase='Moving',action=1,turn=1,balls=3)=>
  'CC_W10_NET_HOST revision='+rev+' action='+action+' turn='+turn+' phase='+phase+' balls='+balls+' packedBytes='+packedBytes+' chunks=1 periodMs='+periodMs;
const c=(rev=1,phase='Moving',action=1,turn=1,balls=3,received=rev,skipped=0)=>
  'CC_W10_NET_CLIENT revision='+rev+' action='+action+' turn='+turn+' phase='+phase+' balls='+balls+' received='+received+' skippedRevisions='+skipped;
test('pins exactly #207',()=>a.equal(PIN,'173273122c11cbf738e8b954e32506a6196fe8ec'));
test('parses exact host marker',()=>a.equal(parse(h(),'HOST').records.length,1));
test('parses exact client marker',()=>a.equal(parse(c(),'CLIENT').records.length,1));
test('ignores old A31 marker, not a false candidate PASS',()=>a.equal(parse('CC_NET_TRACE_TX rev=1 serial=1','HOST').found,0));
test('ignores marker prefixes',()=>a.equal(parse('XCC_W10_NET_HOST revision=1','HOST').found,0));
test('rejects client event on host',()=>a.equal(parse(c(),'HOST').errors[0].code,'WRONG_ENDPOINT'));
test('rejects missing field',()=>a.equal(parse(h().replace(' chunks=1',''),'HOST').errors.length,1));
test('rejects extra field',()=>a.equal(parse(h()+' fake=9','HOST').errors.length,1));
test('rejects duplicate field',()=>a.equal(parse(h()+' revision=99','HOST').errors.length,1));
test('rejects wrong turn number',()=>a.equal(parse(h().replace('turn=1','turn=10'),'HOST').errors.length,1));
test('rejects negative revision',()=>a.equal(parse(h().replace('revision=1','revision=-1'),'HOST').errors.length,1));
test('rejects unsafe numeric overflow',()=>a.equal(parse(h().replace('revision=1','revision=9007199254740993'),'HOST').errors.length,1));
test('rejects invalid phase',()=>a.equal(parse(h().replace('phase=Moving','phase=Moving;bad'),'HOST').errors.length,1));
test('rejects zero balls or bytes',()=>{a.equal(parse(h().replace('balls=3','balls=0'),'HOST').errors.length,1);a.equal(parse(h().replace('packedBytes=1000','packedBytes=0'),'HOST').errors.length,1);});
test('adaptive thresholds 8192 and 16384 and 65536',()=>{
  a.equal(expectedMs('Moving',8191),50);a.equal(expectedMs('Moving',8192),83);
  a.equal(expectedMs('Moving',16383),83);a.equal(expectedMs('Moving',16384),125);
  a.equal(expectedMs('Moving',65535),125);a.equal(expectedMs('Moving',65536),250);
});
test('all idle phases 250ms',()=>a.equal(expectedMs('Aiming',10),250));
test('selected sample no player QA pass',()=>{const r=analyze(h(),c());a.equal(r.verdict,'SAMPLED_DIAGNOSTIC_ONLY');a.equal(r.gameplayGate,'NOT_ATTESTED');a.equal(r.physicalPc1Pc2Qa,'NOT_ATTESTED');});
test('flags false 20 Hz at large payload',()=>a.ok(analyze(h(1,70000,50),c()).errors.some(e=>e.code==='ADAPTIVE_CADENCE_MISMATCH')));
test('flags distinct action on identical snapshot revision',()=>a.ok(analyze(h(),c(1,'Moving',2)).errors.some(e=>e.code==='MATCHED_REVISION_METADATA_MISMATCH')));
test('flags phase drift on same revision',()=>a.ok(analyze(h(),c(1,'Aiming')).errors.some(e=>e.field==='phase')));
test('flags ball count drift on same revision',()=>a.ok(analyze(h(),c(1,'Moving',1,1,4)).errors.some(e=>e.field==='balls')));
test('flags revision rollback',()=>a.ok(analyze(h(2)+'\n'+h(1),c()).errors.some(e=>e.code==='NONINCREASING_REVISION')));
test('flags accepted action rollback',()=>a.ok(analyze(h(1,1000,50,'Moving',5)+'\n'+h(2),c()).errors.some(e=>e.code==='ACTION_ROLLBACK')));
test('flags client received-count rollback',()=>a.ok(analyze(h(),c(1,'Moving',1,1,3,3)+'\n'+c(2,'Moving',1,1,3,2)).errors.some(e=>e.code==='RECEIVED_COUNTER_ROLLBACK')));
test('flags skipped-count rollback',()=>a.ok(analyze(h(),c(1,'Moving',1,1,3,1,5)+'\n'+c(2,'Moving',1,1,3,2,4)).errors.some(e=>e.code==='SKIPPED_COUNTER_ROLLBACK')));
test('unpaired sparse 1Hz sample is NOT network failure',()=>{const r=analyze(h(1),c(2));a.equal(r.errors.length,0);a.ok(r.notices.includes('NO_COMMON_REVISION_IN_SPARSE_1HZ_SAMPLE'));});
test('missing both logs is insufficient',()=>a.equal(analyze('','').verdict,'INSUFFICIENT_SELECTED_LOGS'));
test('missing client logs is insufficient',()=>a.equal(analyze(h(),'').verdict,'INSUFFICIENT_SELECTED_LOGS'));
test('arbitrary P1/PC2 local times not estimated',()=>a.equal('oneWayLatencyMs' in analyze(h(),c()),false));
test('schema anchor never masquerades as runtime binary proof',()=>{const r=analyze(h(),c());a.equal(r.schemaAnchorSha,PIN);a.equal(r.runtimeBinarySourceSha,'NOT_VERIFIED');a.equal('candidateSha' in r,false);});

test('W12 freeze ref independently pinned; no automatic moving-head admission',()=>{
 const m=require('./verify-candidate207-telemetry.cjs');a.equal(m.QA_FREEZE,'3f972cdbaea6289a7e33ce608f5d3256cfdab0a3');
 const r=analyze(h(),c());a.equal(r.qaFreezeSourceSha,m.QA_FREEZE);a.equal(r.runtimeBinarySourceSha,'NOT_VERIFIED');
});
test('W12 no intersecting sparse samples MUST HOLD, not exit-zero readiness',()=>{
 const r=analyze(h(1),c(2));a.equal(r.verdict,'INSUFFICIENT_SELECTED_LOGS');
 a.equal(r.matchingRevisionSamples,0);a.equal(r.errors.length,0);
});
test('W12 two host matches in one log MUST HOLD, not false network fault',()=>{
 const r=analyze('CC_NET_HOST_READY port=7777\n'+h(1)+'\nCC_NET_HOST_READY port=7777\n'+h(1),c(1));
 a.equal(r.verdict,'INSUFFICIENT_SELECTED_LOGS');a.equal(r.errors.length,0);
 a.ok(r.notices.includes('MULTIPLE_SESSIONS_CROP_ORIGINAL_LOGS_TO_ONE_MATCH'));
});
test('W12 two client match boundaries MUST HOLD',()=>{
 const r=analyze(h(1),'CC_NET_STATE_APPLIED revision=1 owner=1\n'+c(1)+'\nCC_NET_STATE_APPLIED revision=1 owner=1\n'+c(1));
 a.equal(r.verdict,'INSUFFICIENT_SELECTED_LOGS');a.equal(r.errors.length,0);
});
test('W12 one host/client session marker still allows bounded comparison',()=>{
 const r=analyze('CC_NET_HOST_READY port=7777\n'+h(1),'CC_NET_STATE_APPLIED revision=1 owner=1\n'+c(1));
 a.equal(r.verdict,'SAMPLED_DIAGNOSTIC_ONLY');
});
test('W12 newer A41 wire digest marker is not compatible with frozen QA input',()=>{
 const r=analyze(h(1)+'\nCC_W11_STATE_TX rev=1',c(1));
 a.equal(r.verdict,'ANOMALY_IN_SUPPLIED_LOGS');
 a.ok(r.errors.some(e=>e.code==='POST_FREEZE_TELEMETRY_PRESENT'));
});
test('W12 newer client digest marker is rejected even if sampled metadata matches',()=>{
 const r=analyze(h(1),c(1)+'\nCC_W11_STATE_RX rev=1');
 a.ok(r.errors.some(e=>e.code==='POST_FREEZE_TELEMETRY_PRESENT'));
});
test('W12 unrelated event prefix never triggers foreign marker',()=>{
 const r=analyze(h(1)+'\nXCC_W11_STATE_TX rev=1',c(1));
 a.equal(r.verdict,'SAMPLED_DIAGNOSTIC_ONLY');
});
