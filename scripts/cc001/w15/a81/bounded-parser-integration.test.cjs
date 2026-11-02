'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parse,analyze}=require('../../w11/a81/verify-candidate207-telemetry.cjs');
const host=(revision='3')=>'CC_W10_NET_HOST revision='+revision+' action=1 turn=1 phase=Moving balls=20 packedBytes=1024 chunks=2 periodMs=50';
const client=(revision='3')=>'CC_W10_NET_CLIENT revision='+revision+' action=1 turn=1 phase=Moving balls=20 received=1 skippedRevisions=0';
test('1501 malformed host events bounded and counted exactly',()=>{
 const p=parse(Array(1501).fill(host('bad')).join('\n'),'HOST');
 assert.equal(p.found,1501);assert.equal(p.errors.length,100);assert.equal(p.omittedErrors,1401);assert.equal(p.records.length,0);
});
test('PC2 corrupt log cannot silently pass after capped errors',()=>{
 const r=analyze(host(),Array(1003).fill(client('bad')).join('\n'));
 assert.equal(r.verdict,'ANOMALY_IN_SUPPLIED_LOGS');assert.equal(r.omittedClientErrorDetails,903);
 assert.ok(r.notices.includes('TRACE_ERRORS_CAPPED_OMITTED_COUNTS_RETAINED'));
});
test('over 20000 markers report truncation explicitly and reject false green',()=>{
 const hs=Array(20001).fill(host()).join('\n');const p=parse(hs,'HOST');
 assert.equal(p.found,20001);assert.equal(p.records.length,20000);assert.equal(p.omittedMarkers,1);
 assert.ok(p.errors.some(e=>e.code==='TRACE_MARKER_LIMIT_EXCEEDED'));
 const r=analyze(hs,client());assert.equal(r.verdict,'ANOMALY_IN_SUPPLIED_LOGS');
 assert.equal(r.omittedHostMarkers,1);
 assert.ok(r.notices.includes('TRACE_MARKER_LIMIT_EXCEEDED_CROP_TO_ONE_MATCH'));
});
test('small legitimate matching samples preserve diagnostic-only semantics',()=>{
 const r=analyze(host(),client());assert.equal(r.verdict,'SAMPLED_DIAGNOSTIC_ONLY');
 assert.equal(r.omittedHostMarkers,0);assert.equal(r.omittedClientMarkers,0);
 assert.equal(r.omittedHostErrorDetails,0);assert.equal(r.omittedClientErrorDetails,0);
 assert.equal(r.gameplayGate,'NOT_ATTESTED');assert.equal(r.physicalPc1Pc2Qa,'NOT_ATTESTED');
});
test('mixed bad and valid samples preserve first detailed error and no G3 claim',()=>{
 const r=analyze(host('bad')+'\n'+host(),client());
 assert.equal(r.verdict,'ANOMALY_IN_SUPPLIED_LOGS');assert.equal(r.matchingRevisionSamples,1);
 assert.ok(r.errors.some(e=>e.code==='MALFORMED_HOST'));
 assert.equal(r.gameplayGate,'NOT_ATTESTED');
});
