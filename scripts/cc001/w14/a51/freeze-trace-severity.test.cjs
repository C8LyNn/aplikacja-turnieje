'use strict';
/** W14 A51: real Node regression coverage for frozen W11 metadata severity. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {FREEZE_SHA,assess}=require('../../w12/a51/freeze-trace-gate.cjs');
const sample=()=>({
  schema:'CC001_R17_W11_A51_NATIVE_TRACE_V2',evidence:'NATIVE_LOG_FORMAT_PARSER',
  candidateSourceSha:'173273122c11cbf738e8b954e32506a6196fe8ec',
  sources:{pc1:{sha256:'a'.repeat(64),bytes:100},pc2:{sha256:'b'.repeat(64),bytes:101}},
  findings:[],producer:'A41',traceCoverage:'SPARSE_A41_SAMPLED',
  observations:{hostRows:2,clientRows:2,pairedRevisionRows:1,unpairedHostRows:1,
    unpairedClientRows:1,hostCadencePolicyChecks:2,hostCadencePolicyViolations:0,
    hostIntervalSamples:[50,83],maxReportedSkippedClientRevisions:0,
    localOneWayLatencyMs:null,payloadHashPairs:0,frameCoordinates:0,
    w11DigestMarkers:{pc1Tx:0,pc2Rx:0,wrongSideOrUnknown:0}},
  qualification:{parser:'TRACE_FIELDS_OBSERVED',sameRevisionMetadata:'MATCHED_METADATA_ONLY',
    authoritativeStateParity:'NOT_PROVEN_NO_PAYLOAD_HASH',
    visualSmoothness:'NOT_PROVEN_NO_FRAMES',G3:'NOT_CERTIFIED_BY_ANALYZER',
    G4:'NOT_CERTIFIED_BY_ANALYZER'}
});
function reject(change,reason){
  const r=sample();change(r);
  const before=JSON.stringify(r),out=assess(r,FREEZE_SHA);
  assert.equal(out.status,'FAIL_PROFILE_OR_TRACE',JSON.stringify(out));
  assert.ok(out.reasons.includes(reason),JSON.stringify(out.reasons));
  assert.equal(JSON.stringify(r),before,'evaluation must be read-only');
  assert.equal(out.guarantees.G3,'HOLD');
  assert.equal(out.guarantees.G4,'HOLD');
  return r;
}
test('valid complete frozen metadata remains metadata-only, never G3/G4',()=>{
  const out=assess(sample(),FREEZE_SHA);
  assert.equal(out.status,'METADATA_CONSISTENT_ONLY');
  assert.equal(out.guarantees.G3,'HOLD');
  assert.equal(out.guarantees.release,'STOP');
});
test('missing host intervals are invalid evidence, not merely unavailable PC',()=>{
  reject(r=>delete r.observations.hostIntervalSamples,'INVALID_HOST_INTERVAL_SAMPLES');
});
test('host interval sample count is self-contradictory',()=>{
  reject(r=>r.observations.hostIntervalSamples=[50],'INVALID_HOST_INTERVAL_SAMPLES');
});
test('host interval unsupported for frozen source is inconsistent',()=>{
  reject(r=>r.observations.hostIntervalSamples=[50,60],'INVALID_HOST_INTERVAL_SAMPLES');
});
test('host interval encoded as string is not a valid period',()=>{
  reject(r=>r.observations.hostIntervalSamples=['50',83],'INVALID_HOST_INTERVAL_SAMPLES');
});
test('skipped client revisions must not be a string',()=>{
  reject(r=>r.observations.maxReportedSkippedClientRevisions='0','INVALID_CLIENT_SKIP_COUNTER');
});
test('skipped client revisions cannot be negative',()=>{
  reject(r=>r.observations.maxReportedSkippedClientRevisions=-1,'INVALID_CLIENT_SKIP_COUNTER');
});
test('skipped client revisions cannot exceed JS safe-integer domain',()=>{
  reject(r=>r.observations.maxReportedSkippedClientRevisions=Number.MAX_SAFE_INTEGER+1,
    'INVALID_CLIENT_SKIP_COUNTER');
});
test('zero shared revisions is incomplete coverage HOLD, not invalid accounting',()=>{
  const r=sample();r.observations.pairedRevisionRows=0;
  r.observations.unpairedHostRows=2;r.observations.unpairedClientRows=2;
  r.qualification.sameRevisionMetadata='NOT_PROVEN';
  assert.equal(assess(r,FREEZE_SHA).status,'HOLD_INCOMPLETE_TRACE');
});
test('one-sided missing log remains HOLD, not data contradiction FAIL',()=>{
  const r=sample();r.sources.pc2=null;r.observations.clientRows=0;
  r.observations.pairedRevisionRows=0;r.observations.unpairedHostRows=2;
  r.observations.unpairedClientRows=0;r.qualification.sameRevisionMetadata='NOT_PROVEN';
  r.traceCoverage='ONE_SIDED_HOLD';
  assert.equal(assess(r,FREEZE_SHA).status,'HOLD_INCOMPLETE_TRACE');
});
test('native Node CLI returns exit1 for invalid interval payload, not exit2',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a51-w14-'));
  try{
    const input=path.join(dir,'report.json'),r=sample();
    r.observations.hostIntervalSamples=[50,60];
    fs.writeFileSync(input,JSON.stringify(r));
    const cli=path.resolve(__dirname,'../../w12/a51/freeze-trace-gate.cjs');
    const run=cp.spawnSync(process.execPath,[cli,'--analysis',input,'--source-sha',FREEZE_SHA],
      {encoding:'utf8'});
    assert.equal(run.status,1,run.stderr);
    assert.equal(JSON.parse(run.stdout).status,'FAIL_PROFILE_OR_TRACE');
    assert.equal(JSON.parse(run.stdout).guarantees.G3,'HOLD');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native Node CLI retains exit0 for valid metadata without certifying runtime',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a51-w14-'));
  try{
    const input=path.join(dir,'report.json');fs.writeFileSync(input,JSON.stringify(sample()));
    const cli=path.resolve(__dirname,'../../w12/a51/freeze-trace-gate.cjs');
    const run=cp.spawnSync(process.execPath,[cli,'--analysis',input,'--source-sha',FREEZE_SHA],
      {encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    assert.equal(JSON.parse(run.stdout).guarantees.gameRuntime,'NOT_CERTIFIED');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
