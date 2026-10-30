#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const os=require('node:os'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {FREEZE_SHA,assess,args}=require('./freeze-trace-gate.cjs');
const hex = c => c.repeat(64);
function sample(overrides={}) {
  return {
    schema:'CC001_R17_W11_A51_NATIVE_TRACE_V2',evidence:'NATIVE_LOG_FORMAT_PARSER',
    sources:{pc1:{sha256:hex('a'),bytes:112},pc2:{sha256:hex('b'),bytes:113}},
    findings:[],producer:'A41',traceCoverage:'SPARSE_A41_SAMPLED',
    observations:{hostRows:2,clientRows:2,pairedRevisionRows:1,
      unpairedHostRows:1,unpairedClientRows:1,hostCadencePolicyChecks:2,
      hostCadencePolicyViolations:0,
      w11DigestMarkers:{pc1Tx:0,pc2Rx:0,wrongSideOrUnknown:0}},
    qualification:{parser:'TRACE_FIELDS_OBSERVED',sameRevisionMetadata:'MATCHED_METADATA_ONLY'},
    ...overrides};
}
const check=(r)=>assess(r,FREEZE_SHA);
test('valid frozen A41 paired metadata is explicitly NOT a G3 pass',()=>{
  const x=check(sample());assert.equal(x.status,'METADATA_CONSISTENT_ONLY');
  assert.equal(x.guarantees.G3,'HOLD');assert.equal(x.guarantees.G4,'HOLD');
  assert.equal(x.guarantees.stateParity,'NOT_PROVEN_NO_FREEZE_STATE_DIGEST');
});
test('operator supplied source SHA is not proof of binary',()=>{
  const x=check(sample());assert.match(x.guarantees.sourceSha,/NOT_BINARY_ATTESTED/);
});
test('historical #207 SHA rejected',()=>{
  assert.deepEqual(assess(sample(),'173273122c11cbf738e8b954e32506a6196fe8ec').reasons,
    ['WRONG_FREEZE_SOURCE_SELECTION']);
});
test('moving #207 SHA rejected',()=>{
  assert.equal(assess(sample(),'87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c').status,'FAIL_PROFILE_OR_TRACE');
});
test('post-freeze A41 digest on PC1 fails source modality',()=>{
  const s=sample();s.observations.w11DigestMarkers.pc1Tx=1;
  assert.ok(check(s).reasons.includes('POST_FREEZE_W11_DIGEST_MARKER_PRESENT'));
});
test('post-freeze A41 digest on PC2 fails source modality',()=>{
  const s=sample();s.observations.w11DigestMarkers.pc2Rx=2;
  assert.equal(check(s).status,'FAIL_PROFILE_OR_TRACE');
});
test('wrong-side W11 digest cannot pass',()=>{
  const s=sample();s.observations.w11DigestMarkers.wrongSideOrUnknown=1;
  assert.equal(check(s).status,'FAIL_PROFILE_OR_TRACE');
});
test('analyzer parse error fails',()=>{
  assert.equal(check(sample({findings:[{code:'DUPLICATE_REVISION',severity:'ERROR'}]})).status,'FAIL_PROFILE_OR_TRACE');
});
test('wrong source producer cannot count as freeze A41 source',()=>{
  assert.ok(check(sample({producer:'A31'})).reasons.includes('EXPECTED_FREEZE_A41_DUAL_SOURCE_MISSING'));
});
test('one-sided trace is HOLD',()=>{
  const s=sample();s.sources.pc2=null;s.observations.clientRows=0;
  s.observations.pairedRevisionRows=0;s.traceCoverage='ONE_SIDED_HOLD';
  assert.equal(check(s).status,'HOLD_INCOMPLETE_TRACE');
});
test('zero shared sampled revisions is HOLD not packet loss',()=>{
  const s=sample();s.observations.pairedRevisionRows=0;
  assert.deepEqual(check(s).reasons,['NO_SHARED_REVISION_SAMPLES']);
});
test('impossible paired count fails',()=>{
  const s=sample();s.observations.pairedRevisionRows=3;
  assert.ok(check(s).reasons.includes('IMPOSSIBLE_PAIR_COUNT'));
});
test('reported cadence policy breach fails',()=>{
  const s=sample();s.observations.hostCadencePolicyViolations=1;
  assert.equal(check(s).status,'FAIL_PROFILE_OR_TRACE');
});
test('same log for PC1 and PC2 fails',()=>{
  const s=sample();s.sources.pc2.sha256=s.sources.pc1.sha256;
  assert.ok(check(s).reasons.includes('IDENTICAL_PC1_PC2_LOG_FINGERPRINT'));
});
test('counter tampering and invalid counts are rejected',()=>{
  const s=sample();s.observations.hostRows=-1;
  s.observations.w11DigestMarkers.pc2Rx='0';
  assert.ok(check(s).reasons.includes('INVALID_OBSERVATION_COUNTER'));
  assert.ok(check(s).reasons.includes('INVALID_W11_MARKER_COUNT'));
});
test('malformed/missing analysis is HOLD not interpreted as success',()=>{
  assert.equal(check(null).status,'HOLD_INCOMPLETE_TRACE');
  assert.equal(check({}).status,'HOLD_INCOMPLETE_TRACE');
});
test('output has no raw log text, player address, or session token',()=>{
  const s=sample({privateLog:'10.0.0.1 ROOM_SECRET=abc123'});
  const out=JSON.stringify(check(s));
  assert.ok(!out.includes('10.0.0.1')&&!out.includes('ROOM_SECRET'));
});
test('duplicate or missing CLI arguments fail',()=>{
  assert.throws(()=>args(['--analysis','x','--analysis','y','--source-sha',FREEZE_SHA]));
  assert.throws(()=>args(['--analysis','x']));
});
test('native Node CLI returns scoped metadata, not game PASS',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a51-freeze-'));
  try {
    const inp=path.join(dir,'a51.json');fs.writeFileSync(inp,JSON.stringify(sample()));
    const x=cp.spawnSync(process.execPath,[__dirname+'/freeze-trace-gate.cjs',
      '--analysis',inp,'--source-sha',FREEZE_SHA],{encoding:'utf8'});
    assert.equal(x.status,0,x.stderr);
    assert.equal(JSON.parse(x.stdout).status,'METADATA_CONSISTENT_ONLY');
    assert.equal(JSON.parse(x.stdout).guarantees.G3,'HOLD');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native Node CLI refuses output overwrite',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a51-freeze-'));
  try {
    const inp=path.join(dir,'a51.json'),out=path.join(dir,'out.json');
    fs.writeFileSync(inp,JSON.stringify(sample()));fs.writeFileSync(out,'preserve');
    const x=cp.spawnSync(process.execPath,[__dirname+'/freeze-trace-gate.cjs',
      '--analysis',inp,'--source-sha',FREEZE_SHA,'--out',out],{encoding:'utf8'});
    assert.equal(x.status,2);assert.equal(fs.readFileSync(out,'utf8'),'preserve');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native Node CLI rejects wrong SHA with nonzero exit',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a51-freeze-'));
  try {
    const inp=path.join(dir,'a51.json');fs.writeFileSync(inp,JSON.stringify(sample()));
    const x=cp.spawnSync(process.execPath,[__dirname+'/freeze-trace-gate.cjs',
      '--analysis',inp,'--source-sha','173273122c11cbf738e8b954e32506a6196fe8ec'],{encoding:'utf8'});
    assert.equal(x.status,1);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
