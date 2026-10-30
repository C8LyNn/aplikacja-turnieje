'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {checkAggregate,BASELINE_POLICY_SHA}=require('./trace-accounting.cjs');
const sample=()=>({
 candidateSourceSha:BASELINE_POLICY_SHA,
 observations:{hostRows:3,clientRows:2,pairedRevisionRows:1,unpairedHostRows:2,unpairedClientRows:1,
   hostCadencePolicyChecks:3,hostCadencePolicyViolations:0,hostIntervalSamples:[50,83,250],
   maxReportedSkippedClientRevisions:3,localOneWayLatencyMs:null,payloadHashPairs:0,frameCoordinates:0},
 qualification:{sameRevisionMetadata:'MATCHED_METADATA_ONLY',authoritativeStateParity:'NOT_PROVEN_NO_PAYLOAD_HASH',
   visualSmoothness:'NOT_PROVEN_NO_FRAMES',G3:'NOT_CERTIFIED_BY_ANALYZER',G4:'NOT_CERTIFIED_BY_ANALYZER'}
});
const codes=x=>checkAggregate(x);
test('valid frozen metadata accounting has no inconsistencies',()=>assert.deepEqual(codes(sample()),[]));
test('host revision equation mismatch',()=>{const x=sample();x.observations.unpairedHostRows=0;assert.ok(codes(x).includes('REVISION_ACCOUNTING_MISMATCH'));});
test('client revision equation mismatch',()=>{const x=sample();x.observations.unpairedClientRows=0;assert.ok(codes(x).includes('REVISION_ACCOUNTING_MISMATCH'));});
test('cadence checked count must match host sample count',()=>{const x=sample();x.observations.hostCadencePolicyChecks=2;assert.ok(codes(x).includes('HOST_SAMPLE_CADENCE_COUNT_MISMATCH'));});
test('cadence violations cannot exceed checks',()=>{const x=sample();x.observations.hostCadencePolicyViolations=4;assert.ok(codes(x).includes('IMPOSSIBLE_CADENCE_VIOLATION_COUNT'));});
test('missing intervals rejected',()=>{const x=sample();delete x.observations.hostIntervalSamples;assert.ok(codes(x).includes('INVALID_HOST_INTERVAL_SAMPLES'));});
test('wrong interval count rejected',()=>{const x=sample();x.observations.hostIntervalSamples=[50];assert.ok(codes(x).includes('INVALID_HOST_INTERVAL_SAMPLES'));});
test('unsupported interval value rejected',()=>{const x=sample();x.observations.hostIntervalSamples=[50,60,250];assert.ok(codes(x).includes('INVALID_HOST_INTERVAL_SAMPLES'));});
test('non-numeric reported skipped count rejected',()=>{const x=sample();x.observations.maxReportedSkippedClientRevisions='3';assert.ok(codes(x).includes('INVALID_CLIENT_SKIP_COUNTER'));});
test('paired revisions cannot claim NOT_PROVEN metadata',()=>{const x=sample();x.qualification.sameRevisionMetadata='NOT_PROVEN';assert.ok(codes(x).includes('PAIRED_REVISION_QUALIFICATION_MISMATCH'));});
test('zero paired revisions must not claim metadata match',()=>{const x=sample();x.observations.pairedRevisionRows=0;x.observations.unpairedHostRows=3;x.observations.unpairedClientRows=2;assert.ok(codes(x).includes('PAIRED_REVISION_QUALIFICATION_MISMATCH'));});
test('non-null one-way latency is unsupported evidence',()=>{const x=sample();x.observations.localOneWayLatencyMs=0;assert.ok(codes(x).includes('UNSUPPORTED_RUNTIME_EVIDENCE_CLAIM'));});
test('claimed payload hash pairs cannot be supported by frozen marker',()=>{const x=sample();x.observations.payloadHashPairs=1;assert.ok(codes(x).includes('UNSUPPORTED_RUNTIME_EVIDENCE_CLAIM'));});
test('claimed G3 pass is rejected',()=>{const x=sample();x.qualification.G3='PASS';assert.ok(codes(x).includes('UNSUPPORTED_QA_QUALIFICATION'));});
test('claimed visual smoothness is rejected',()=>{const x=sample();x.qualification.visualSmoothness='PASS';assert.ok(codes(x).includes('UNSUPPORTED_QA_QUALIFICATION'));});
test('wrong parser policy source label rejected',()=>{const x=sample();x.candidateSourceSha='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';assert.ok(codes(x).includes('UNEXPECTED_CADENCE_POLICY_LABEL'));});
test('malformed missing report cannot succeed',()=>assert.ok(codes(null).length>0));
test('stable reason list and no mutation of input',()=>{const x=sample(),prior=JSON.stringify(x);assert.deepEqual(codes(x),codes(x));assert.equal(JSON.stringify(x),prior);});
