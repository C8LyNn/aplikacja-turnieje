#!/usr/bin/env node
'use strict';
// A73 W11: run both exact-source contracts, never promote source PASS to game QA.
const fs = require('node:fs');
const path = require('node:path');
const {inspect} = require('./verify-stacked-addon.cjs');
const RC1 = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const A30 = '3a6fb11f70cbdd354ca319b6c48e5c080a1ae193';
const W11 = '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const A40 = '93202589e0a80f43935b7cfed96c5a7666980e67';
const P = 'unity/cc001-r16/CoreClash-V149-Unity/Tests/AbilityTests.cs';
function validate(full,delta) {
  const problems=[];
  if(full.schemaVersion!==2||delta.schemaVersion!==2)problems.push('SCHEMA_MISMATCH');
  if(full.immutableRc1!==RC1||delta.immutableRc1!==RC1)problems.push('RC1_MISMATCH');
  if(full.baseSha!==RC1||full.baseRef!=='integration/cc001-r17-w8-phoenix-rc1')problems.push('FULL_BASE_MISMATCH');
  if(delta.baseSha!==A30||delta.baseRef!=='fix/cc001-r17-w10-a30-on-a70-candidate')problems.push('DELTA_BASE_MISMATCH');
  if(full.addonSha!==W11||delta.addonSha!==W11||full.addonRef!=='integration/cc001-r17-w11-multiplayer-qa-candidate-20261030'||full.addonRef!==delta.addonRef)problems.push('CANDIDATE_MISMATCH');
  if(Object.keys(full.expectedChanges||{}).length!==22||Object.keys(delta.expectedChanges||{}).length!==10)problems.push('WRONG_PATH_COUNT');
  if(Object.keys(full.retainedBlobs||{}).length!==97||Object.keys(delta.retainedBlobs||{}).length!==100)problems.push('WRONG_PROTECTION_COUNT');
  if(full.expectedChanges?.[P]?.blob!==A40||delta.expectedChanges?.[P]?.blob!==A40)problems.push('A40_ORIGINAL_BLOB_MISSING');
  for(const [p,change] of Object.entries(delta.expectedChanges||{}))if(full.expectedChanges?.[p]?.blob!==change.blob)problems.push('INCONSISTENT_CHANGED_BLOB '+p);
  return problems;
}
function run(full,delta,cwd=process.cwd(),validator=inspect) {
  const errors=validate(full,delta);
  if(errors.length)return {verdict:'HOLD',issues:errors,sourceOnly:true};
  const x=validator(full,cwd),y=validator(delta,cwd);
  return {verdict:x.verdict==='PASS_SOURCE_SCOPE_ONLY'&&y.verdict==='PASS_SOURCE_SCOPE_ONLY'?'PASS_SOURCE_SCOPE_ONLY':'HOLD',sourceOnly:true,issues:[...x.issues,...y.issues],checks:{full:x.counts,delta:y.counts},baseSha:RC1,addonSha:W11};
}
if(require.main===module){
  try{
    if(process.argv.length!==4)throw Error('usage: node w11-finalize.cjs <full.json> <delta.json>');
    const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
    const result=run(read(process.argv[2]),read(process.argv[3]));
    console.log(JSON.stringify(result,null,2));process.exitCode=result.verdict==='PASS_SOURCE_SCOPE_ONLY'?0:1;
  }catch(e){console.error('HOLD: '+e.message);process.exitCode=2;}
}
module.exports={validate,run,RC1,A30,W11,A40};
