#!/usr/bin/env node
'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const {verify,hashLog,args,FREEZE_SHA,main} = require('./bind-original-player-logs.cjs');
const digest = content => crypto.createHash('sha256').update(content).digest('hex');
const mk = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'a51-w14-'));
  const pc1 = path.join(dir,'pc1.log');
  const pc2 = path.join(dir,'pc2.log');
  const c1 = 'CC_W10_NET_HOST revision=1 action=0 turn=0 phase=Moving balls=5 packedBytes=100 chunks=1 periodMs=50\n';
  const c2 = 'CC_W10_NET_CLIENT revision=1 action=0 turn=0 phase=Moving balls=5 received=1 skippedRevisions=0\n';
  fs.writeFileSync(pc1,c1);fs.writeFileSync(pc2,c2);
  const report = {
    schema:'CC001_R17_W11_A51_NATIVE_TRACE_V2',
    candidateSourceSha:'173273122c11cbf738e8b954e32506a6196fe8ec',
    evidence:'NATIVE_LOG_FORMAT_PARSER',producer:'A41',traceCoverage:'SPARSE_A41_SAMPLED',
    sources:{pc1:{sha256:digest(c1),bytes:Buffer.byteLength(c1)},
             pc2:{sha256:digest(c2),bytes:Buffer.byteLength(c2)}},
    findings:[],
    observations:{hostRows:1,clientRows:1,pairedRevisionRows:1,unpairedHostRows:0,
      unpairedClientRows:0,hostCadencePolicyChecks:1,hostCadencePolicyViolations:0,
      hostIntervalSamples:[50],maxReportedSkippedClientRevisions:0,
      localOneWayLatencyMs:null,payloadHashPairs:0,frameCoordinates:0,
      w11DigestMarkers:{pc1Tx:0,pc2Rx:0,wrongSideOrUnknown:0}},
    qualification:{parser:'TRACE_FIELDS_OBSERVED',sameRevisionMetadata:'MATCHED_METADATA_ONLY',
      authoritativeStateParity:'NOT_PROVEN_NO_PAYLOAD_HASH',visualSmoothness:'NOT_PROVEN_NO_FRAMES',
      G3:'NOT_CERTIFIED_BY_ANALYZER',G4:'NOT_CERTIFIED_BY_ANALYZER'}
  };
  const analysis=path.join(dir,'a51-report.json');
  fs.writeFileSync(analysis,JSON.stringify(report));
  return {dir,pc1,pc2,report,analysis};
};
const fixtureTest=(name,fn)=>test(name,()=>{const a=mk();try{fn(a);}finally{fs.rmSync(a.dir,{recursive:true,force:true});}});
const cli=(a,extra=[])=>cp.spawnSync(process.execPath,[path.join(__dirname,'bind-original-player-logs.cjs'),
  '--analysis',a.analysis,'--source-sha',FREEZE_SHA,'--pc1',a.pc1,'--pc2',a.pc2,...extra],{encoding:'utf8'});
fixtureTest('byte-identical reported original logs: metadata-only, never G3/G4',a=>{
  const out=verify(a.report,FREEZE_SHA,a.pc1,a.pc2);
  assert.equal(out.status,'LOG_FINGERPRINT_MATCHED_METADATA_ONLY');
  assert.equal(out.guarantees.G3,'HOLD');assert.equal(out.guarantees.G4,'HOLD');
  assert.equal(out.guarantees.sameRun,'NOT_ATTESTED');
  assert.equal(out.guarantees.sameWindowsPlayer,'NOT_ATTESTED');
  assert.equal(out.guarantees.reportCountersDerivedFromLogs,'NOT_REVERIFIED_BY_THIS_GATE');
});
fixtureTest('native CLI positive exit0 means hashes matched, not runtime pass',a=>{
  const x=cli(a);assert.equal(x.status,0,x.stderr);
  const result=JSON.parse(x.stdout);assert.equal(result.status,'LOG_FINGERPRINT_MATCHED_METADATA_ONLY');
  assert.equal(result.guarantees.G3,'HOLD');
});
fixtureTest('native CLI detects edited PC1 log byte',a=>{
  fs.appendFileSync(a.pc1,'tampered');const x=cli(a);assert.equal(x.status,1);
  assert.ok(JSON.parse(x.stdout).reasons.includes('PC1_ORIGINAL_LOG_FINGERPRINT_MISMATCH'));
});
fixtureTest('native CLI detects edited PC2 log byte',a=>{
  fs.appendFileSync(a.pc2,'tampered');const x=cli(a);assert.equal(x.status,1);
  assert.ok(JSON.parse(x.stdout).reasons.includes('PC2_ORIGINAL_LOG_FINGERPRINT_MISMATCH'));
});
fixtureTest('claimed log digest spoofing cannot promote result',a=>{
  a.report.sources.pc1.sha256='c'.repeat(64);
  assert.equal(verify(a.report,FREEZE_SHA,a.pc1,a.pc2).status,'FAIL_LOG_BYTE_PROVENANCE');
});
fixtureTest('claimed log size spoofing cannot promote result',a=>{
  a.report.sources.pc1.bytes++;
  assert.equal(verify(a.report,FREEZE_SHA,a.pc1,a.pc2).status,'FAIL_LOG_BYTE_PROVENANCE');
});
fixtureTest('reusing same physical log for both sides fails',a=>{
  const out=verify(a.report,FREEZE_SHA,a.pc1,a.pc1);
  assert.equal(out.status,'FAIL_LOG_BYTE_PROVENANCE');
  assert.ok(out.reasons.includes('SAME_ORIGINAL_LOG_PATH'));
});
fixtureTest('same bytes in two distinct log files fails',a=>{
  fs.copyFileSync(a.pc1,a.pc2);
  const out=verify(a.report,FREEZE_SHA,a.pc1,a.pc2);
  assert.equal(out.status,'FAIL_LOG_BYTE_PROVENANCE');
  assert.ok(out.reasons.includes('IDENTICAL_ORIGINAL_LOG_BYTES'));
});
fixtureTest('symlinked log cannot masquerade as original regular file',a=>{
  const link=path.join(a.dir,'link.log');fs.symlinkSync(a.pc1,link);
  assert.throws(()=>hashLog(link),/INVALID_LOG_FILE/);
});
fixtureTest('directory instead of log fails closed',a=>{
  assert.throws(()=>hashLog(a.dir),/INVALID_LOG_FILE/);
});
fixtureTest('empty original file fails closed',a=>{
  fs.writeFileSync(a.pc1,'');assert.throws(()=>hashLog(a.pc1),/INVALID_LOG_SIZE/);
});
fixtureTest('missing physical log fails input with redacted stderr',a=>{
  fs.unlinkSync(a.pc1);const x=cli(a);
  assert.equal(x.status,2);assert.equal(x.stdout,'');
  assert.ok(!x.stderr.includes(a.dir));
  assert.match(x.stderr,/A51_W14_ORIGINAL_LOG_INPUT_ERROR/);
});
fixtureTest('native CLI rejects wrong QA source SHA',a=>{
  const x=cli(a,['--out',path.join(a.dir,'result.json')]);assert.equal(x.status,0);
  const y=cp.spawnSync(process.execPath,[path.join(__dirname,'bind-original-player-logs.cjs'),
    '--analysis',a.analysis,'--source-sha','173273122c11cbf738e8b954e32506a6196fe8ec',
    '--pc1',a.pc1,'--pc2',a.pc2],{encoding:'utf8'});
  assert.equal(y.status,1);assert.equal(JSON.parse(y.stdout).status,'FAIL_PROFILE_OR_TRACE');
});
fixtureTest('native CLI refuses to overwrite existing proof file',a=>{
  const out=path.join(a.dir,'output.json');fs.writeFileSync(out,'SENTINEL');
  const x=cli(a,['--out',out]);assert.equal(x.status,2);
  assert.equal(fs.readFileSync(out,'utf8'),'SENTINEL');
});
fixtureTest('native CLI writes new output with exclusive create',a=>{
  const out=path.join(a.dir,'output.json');const x=cli(a,['--out',out]);
  assert.equal(x.status,0);assert.equal(x.stdout,'');
  assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).guarantees.release,'STOP');
});
fixtureTest('missing --pc2 rejected, even when analysis is populated',a=>{
  assert.throws(()=>args(['--analysis',a.analysis,'--source-sha',FREEZE_SHA,'--pc1',a.pc1]));
});
fixtureTest('duplicate input parameters rejected',a=>{
  assert.throws(()=>args(['--analysis',a.analysis,'--analysis',a.analysis,'--source-sha',FREEZE_SHA,'--pc1',a.pc1,'--pc2',a.pc2]));
});
fixtureTest('trace anomaly still FAIL despite exact original files',a=>{
  a.report.findings=[{code:'DUPLICATE_REVISION',severity:'ERROR'}];
  assert.equal(verify(a.report,FREEZE_SHA,a.pc1,a.pc2).status,'FAIL_PROFILE_OR_TRACE');
});
fixtureTest('incomplete sample HOLD despite exact original files',a=>{
  a.report.observations.pairedRevisionRows=0;
  a.report.observations.unpairedHostRows=1;
  a.report.observations.unpairedClientRows=1;
  a.report.qualification.sameRevisionMetadata='NOT_PROVEN';
  assert.equal(verify(a.report,FREEZE_SHA,a.pc1,a.pc2).status,'HOLD_INCOMPLETE_TRACE');
});
fixtureTest('W11 digest marker from newer dev PR cannot certify frozen profile',a=>{
  a.report.observations.w11DigestMarkers.pc1Tx=1;
  assert.equal(verify(a.report,FREEZE_SHA,a.pc1,a.pc2).status,'FAIL_PROFILE_OR_TRACE');
});
fixtureTest('raw host/client secrets and paths never appear in emitted JSON',a=>{
  fs.appendFileSync(a.pc1,'\n10.0.0.11 ROOM_TOKEN=SECRET\n');
  a.report.sources.pc1.sha256=hashLog(a.pc1).sha256;
  a.report.sources.pc1.bytes=hashLog(a.pc1).bytes;
  const result=JSON.stringify(verify(a.report,FREEZE_SHA,a.pc1,a.pc2));
  assert.ok(!result.includes('ROOM_TOKEN'));
  assert.ok(!result.includes('10.0.0.11'));
  assert.ok(!result.includes(a.dir));
});
fixtureTest('frozen SHA is required independently of matching file bytes',a=>{
  const wrong='87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c';
  assert.equal(verify(a.report,wrong,a.pc1,a.pc2).status,'FAIL_PROFILE_OR_TRACE');
});
