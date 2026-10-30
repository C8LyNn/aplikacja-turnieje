#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {validate,run,RC1,A30,W11,A40}=require('./w11-finalize.cjs');
const P='unity/cc001-r16/CoreClash-V149-Unity/Tests/AbilityTests.cs';
const mk=()=>{
 const changes=Object.fromEntries(Array.from({length:21},(_,i)=>['path/'+i,{status:'M',blob:'a'.repeat(40)}]));changes[P]={status:'M',blob:A40};
 const delta=Object.fromEntries(Object.entries(changes).slice(0,9).map(([p,v])=>[p,{...v}]).concat([[P,{...changes[P]}]]));
 return [{schemaVersion:2,immutableRc1:RC1,baseRef:'integration/cc001-r17-w8-phoenix-rc1',baseSha:RC1,addonRef:'integration/cc001-r17-w11-multiplayer-qa-candidate-20261030',addonSha:W11,expectedChanges:changes,retainedBlobs:Object.fromEntries(Array.from({length:97},(_,i)=>['keep/'+i,'c'.repeat(40)]))},{schemaVersion:2,immutableRc1:RC1,baseRef:'fix/cc001-r17-w10-a30-on-a70-candidate',baseSha:A30,addonRef:'integration/cc001-r17-w11-multiplayer-qa-candidate-20261030',addonSha:W11,expectedChanges:delta,retainedBlobs:Object.fromEntries(Array.from({length:100},(_,i)=>['keep/'+i,'c'.repeat(40)]))}];
};
let passed=0;function test(label,f){f();console.log('PASS',++passed,label);}
test('exact two-manifest selection validates',()=>assert.deepEqual(validate(...mk()),[]));
test('RC1 mismatch fails closed',()=>{let [a,b]=mk();a.immutableRc1='0'.repeat(40);assert.ok(validate(a,b).includes('RC1_MISMATCH'));});
test('wrong A70 candidate SHA fails closed',()=>{let [a,b]=mk();b.addonSha='0'.repeat(40);assert.ok(validate(a,b).includes('CANDIDATE_MISMATCH'));});
test('original dispatched 173273 SHA is now rejected',()=>{let [a,b]=mk();b.addonSha='173273122c11cbf738e8b954e32506a6196fe8ec';assert.ok(validate(a,b).includes('CANDIDATE_MISMATCH'));});
test('intermediate d1ec SHA is rejected',()=>{let [a,b]=mk();a.addonSha='d1ec2a6079df5b696869e7ac8cd09b890fa65314';assert.ok(validate(a,b).includes('CANDIDATE_MISMATCH'));});
test('wrong A30 base SHA fails closed',()=>{let [a,b]=mk();b.baseSha='0'.repeat(40);assert.ok(validate(a,b).includes('DELTA_BASE_MISMATCH'));});
test('missing exact A40 blob fails closed',()=>{let [a,b]=mk();b.expectedChanges[P].blob='1'.repeat(40);assert.ok(validate(a,b).includes('A40_ORIGINAL_BLOB_MISSING'));});
test('mismatched changed file blob fails closed',()=>{let [a,b]=mk();b.expectedChanges['path/0'].blob='9'.repeat(40);assert.ok(validate(a,b).some(x=>x.startsWith('INCONSISTENT_CHANGED_BLOB')));});
test('missing full changed path fails closed',()=>{let [a,b]=mk();delete a.expectedChanges['path/0'];assert.ok(validate(a,b).includes('WRONG_PATH_COUNT'));});
test('retention count regression fails closed',()=>{let [a,b]=mk();delete b.retainedBlobs['keep/0'];assert.ok(validate(a,b).includes('WRONG_PROTECTION_COUNT'));});
test('two independent source PASS results required',()=>{let n=0;let r=run(...mk(),undefined,()=>{n++;return {verdict:'PASS_SOURCE_SCOPE_ONLY',issues:[],counts:{expected:n}}});assert.equal(r.verdict,'PASS_SOURCE_SCOPE_ONLY');assert.equal(n,2);assert.equal(r.sourceOnly,true);});
test('second source HOLD blocks overall PASS',()=>{let n=0;const r=run(...mk(),undefined,()=>({verdict:++n===1?'PASS_SOURCE_SCOPE_ONLY':'HOLD',issues:n===2?['bad']:[],counts:{}}));assert.equal(r.verdict,'HOLD');assert.deepEqual(r.issues,['bad']);});
test('invalid manifest never invokes Git verifier',()=>{let [a,b]=mk();a.addonSha='0'.repeat(40);let called=false;const r=run(a,b,undefined,()=>{called=true});assert.equal(r.verdict,'HOLD');assert.equal(called,false);});
console.log('TOTAL',passed,'PASS');
