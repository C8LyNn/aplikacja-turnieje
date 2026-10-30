#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const mod=require('./native-snapshot-trace.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w11-a51-'));
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const pc1=s=>mod.parseLogBuffer(Buffer.from(s),'PC1'),pc2=s=>mod.parseLogBuffer(Buffer.from(s),'PC2');
const tx=(rev,extra='')=>`CC_NET_TRACE_TX rev=${rev} serial=8 tms=${rev*100} turn=1 phase=Moving bytes=5432 chunks=2${extra}\n`;
const rx=(rev,extra='')=>`CC_NET_TRACE_RX rev=${rev} serial=8 tms=${rev*100+100000} turn=1 phase=Moving chunks=2${extra}\n`;
const host=(rev,extra='')=>`CC_W10_NET_HOST revision=${rev} action=8 turn=1 phase=Moving balls=14 packedBytes=8901 chunks=2 periodMs=83${extra}\n`;
const client=(rev,extra='')=>`CC_W10_NET_CLIENT revision=${rev} action=8 turn=1 phase=Moving balls=14 received=12 skippedRevisions=0${extra}\n`;
try{
 test('A31 actual format parses on both machines',()=>{const a=mod.analyze(pc1(tx(3)+tx(4)),pc2(rx(3)+rx(4)));assert.equal(a.producer,'A31');assert.equal(a.observations.pairedRevisionRows,2);assert.equal(a.findings.length,0);assert.equal(a.qualification.sameRevisionMetadata,'MATCHED_METADATA_ONLY');});
 test('A31 paired metadata does not claim parity',()=>{const a=mod.analyze(pc1(tx(2)),pc2(rx(2)));assert.equal(a.qualification.authoritativeStateParity,'NOT_PROVEN_NO_PAYLOAD_HASH');assert.equal(a.qualification.G3,'NOT_CERTIFIED_BY_ANALYZER');});
 test('A31 per-machine tms difference never used as one-way latency',()=>{const a=mod.analyze(pc1(tx(2)),pc2(rx(2)));assert.equal(a.observations.localOneWayLatencyMs,null);assert.ok(a.warnings.some(x=>x.includes('process-specific')));});
 test('A31 actionSerial divergence detected',()=>{const a=mod.analyze(pc1(tx(2)),pc2(rx(2).replace('serial=8','serial=9')));assert.ok(a.findings.some(f=>f.field==='actionSerial'));});
 test('A31 turn divergence detected',()=>{const a=mod.analyze(pc1(tx(2)),pc2(rx(2).replace('turn=1','turn=0')));assert.ok(a.findings.some(f=>f.field==='turn'));});
 test('A31 phase divergence detected',()=>{const a=mod.analyze(pc1(tx(2)),pc2(rx(2).replace('phase=Moving','phase=Aiming')));assert.ok(a.findings.some(f=>f.field==='phase'));});
 test('A31 chunk count divergence detected',()=>{const a=mod.analyze(pc1(tx(2)),pc2(rx(2).replace('chunks=2','chunks=3')));assert.ok(a.findings.some(f=>f.field==='chunks'));});
 test('A41 actual sparse sampled log parses without false parity',()=>{const a=mod.analyze(pc1(host(12)),pc2(client(12)));assert.equal(a.producer,'A41');assert.equal(a.observations.pairedRevisionRows,1);assert.equal(a.traceCoverage,'SPARSE_A41_SAMPLED');assert.equal(a.qualification.G3,'NOT_CERTIFIED_BY_ANALYZER');});
 test('A41 skipped count is observation not packet-loss conclusion',()=>{const a=mod.analyze(pc1(host(12)),pc2(client(12).replace('skippedRevisions=0','skippedRevisions=5')));assert.equal(a.observations.maxReportedSkippedClientRevisions,5);assert.ok(!a.findings.some(f=>/PACKET_LOSS/.test(f.code)));});
 test('A41 unequal ball count fails same-revision field consistency',()=>{const a=mod.analyze(pc1(host(12)),pc2(client(12).replace('balls=14','balls=13')));assert.ok(a.findings.some(f=>f.field==='balls'));});
 test('A41 sampled unmatched lines do not claim packet loss',()=>{const a=mod.analyze(pc1(host(10)+host(12)),pc2(client(12)));assert.equal(a.observations.unpairedHostRows,1);assert.ok(a.warnings.some(x=>x.includes('NOT prove packet loss')));});
 test('duplicate TX revision preserved and flagged',()=>{const a=mod.analyze(pc1(tx(2)+tx(2).replace('serial=8','serial=9')),pc2(rx(2)));assert.ok(a.findings.some(f=>f.code==='DUPLICATE_REVISION'));assert.equal(a.qualification.sameRevisionMetadata,'HOLD_ERRORS');});
 test('RX backward revision fails',()=>{const a=mod.analyze(pc1(tx(2)+tx(3)),pc2(rx(3)+rx(2)));assert.ok(a.findings.some(f=>f.code==='NON_MONOTONIC_REVISION'));});
 test('malformed numeric marker is rejected not ignored',()=>{const a=mod.analyze(pc1(tx(1).replace('rev=1','rev=NaN')),pc2(rx(1)));assert.ok(a.findings.some(f=>f.code==='INVALID_TRACE_NUMBER'));});
 test('missing field marker is rejected not silently ignored',()=>{const a=mod.analyze(pc1(tx(1).replace(' bytes=5432','')),pc2(rx(1)));assert.ok(a.findings.some(f=>f.code==='MISSING_TRACE_FIELD'));});
 test('duplicate key marker is rejected',()=>{const a=mod.analyze(pc1(tx(1,' serial=20')),pc2(rx(1)));assert.ok(a.findings.some(f=>f.code==='DUPLICATE_TRACE_FIELD'));});
 test('wrong peer-side producer marker is rejected',()=>{const a=mod.analyze(pc1(rx(1)),pc2(tx(1)));assert.equal(a.findings.filter(f=>f.code==='WRONG_TRACE_SIDE').length,2);});
 test('mixed A31/A41 source producer cannot be claimed consistent',()=>{const a=mod.analyze(pc1(tx(1)+host(2)),pc2(rx(1)+client(2)));assert.equal(a.producer,'MIXED');assert.ok(a.findings.some(f=>f.code==='MIXED_TRACE_PRODUCERS'));assert.equal(a.observations.pairedRevisionRows,0);});
 test('one-sided log yields evidence HOLD',()=>{const a=mod.analyze(pc1(tx(4)),null);assert.equal(a.traceCoverage,'ONE_SIDED_HOLD');assert.equal(a.qualification.sameRevisionMetadata,'NOT_PROVEN');});
 test('no tags yields no trace, no false PASS',()=>{const a=mod.analyze(pc1('CC_NET_HOST_READY port=7777\n'),pc2('CC_NET_STATE_APPLIED revision=1 owner=1\n'));assert.equal(a.traceCoverage,'NO_TRACE_ROWS');assert.equal(a.qualification.parser,'NO_TRACE');});
 test('raw address/account lines never appear in report',()=>{const a=mod.analyze(pc1(tx(1)+'PRIVATE 10.0.0.3 SECRET_JOIN_CODE=abc123\n'),pc2(rx(1)));const s=JSON.stringify(a);assert.ok(!s.includes('10.0.0.3'));assert.ok(!s.includes('abc123'));});
 test('source SHA records correct original bytes',()=>{const b=Buffer.from(tx(1));const a=mod.parseLogBuffer(b,'PC1');assert.equal(a.source.bytes,b.length);assert.match(a.source.sha256,/^[a-f0-9]{64}$/);});
 test('CLI with physical-format fixture runs and outputs JSON',()=>{const a=path.join(tmp,'pc1.log'),b=path.join(tmp,'pc2.log');fs.writeFileSync(a,tx(10));fs.writeFileSync(b,rx(10));const r=cp.spawnSync(process.execPath,[path.join(__dirname,'native-snapshot-trace.cjs'),'--pc1',a,'--pc2',b],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).observations.pairedRevisionRows,1);});
 test('CLI refuses output overwrite',()=>{const a=path.join(tmp,'pc1.log'),o=path.join(tmp,'occupied');fs.writeFileSync(a,tx(3));fs.writeFileSync(o,'KEEP');const r=cp.spawnSync(process.execPath,[path.join(__dirname,'native-snapshot-trace.cjs'),'--pc1',a,'--out',o],{encoding:'utf8'});assert.equal(r.status,2);assert.equal(fs.readFileSync(o,'utf8'),'KEEP');});
 test('CLI with no inputs exits 2',()=>{const r=cp.spawnSync(process.execPath,[path.join(__dirname,'native-snapshot-trace.cjs')],{encoding:'utf8'});assert.equal(r.status,2);});
 test('reports deterministic for identical inputs',()=>{const a=pc1(tx(4)),b=pc2(rx(4));assert.equal(JSON.stringify(mod.analyze(a,b)),JSON.stringify(mod.analyze(a,b)));});

 // W11 FINALIZATION — exact candidate #207 adaptive policy, parsed-log-only evidence.
 test('source SHA pins exact #207 candidate policy not Player binary',()=>{
   assert.equal(mod.CANDIDATE_SHA,'173273122c11cbf738e8b954e32506a6196fe8ec');
   const a=mod.analyze(pc1(host(1)),pc2(client(1)));
   assert.equal(a.candidateSourceSha,mod.CANDIDATE_SHA);
   assert.match(a.warnings.join(' '),/not a proof of the Unity Player binary/);
 });
 test('candidate moving policy 20Hz below 8KiB',()=>{
   assert.equal(mod.expectedPeriodMs('Moving',8191),50);
   assert.equal(mod.analyze(pc1(host(1).replace('8901','8191').replace('periodMs=83','periodMs=50')),pc2(client(1))).observations.hostCadencePolicyViolations,0);
 });
 test('candidate moving policy 12Hz at 8KiB inclusive',()=>{
   assert.equal(mod.expectedPeriodMs('Moving',8192),83);
   assert.equal(mod.analyze(pc1(host(1).replace('8901','8192')),pc2(client(1))).observations.hostCadencePolicyViolations,0);
 });
 test('candidate moving policy 8Hz at 16KiB inclusive',()=>{
   assert.equal(mod.expectedPeriodMs('Moving',16384),125);
   assert.equal(mod.analyze(pc1(host(1).replace('8901','16384').replace('periodMs=83','periodMs=125')),pc2(client(1))).observations.hostCadencePolicyViolations,0);
 });
 test('candidate moving policy 4Hz at 64KiB inclusive',()=>{
   assert.equal(mod.expectedPeriodMs('Moving',65536),250);
   assert.equal(mod.analyze(pc1(host(1).replace('8901','65536').replace('periodMs=83','periodMs=250')),pc2(client(1))).observations.hostCadencePolicyViolations,0);
 });
 test('candidate aiming and over phases always report 250ms',()=>{
   const a=host(1).replace('phase=Moving','phase=Aiming').replace('periodMs=83','periodMs=250');
   const b=host(3).replace('phase=Moving','phase=Over').replace('periodMs=83','periodMs=250');
   assert.equal(mod.analyze(pc1(a+b),null).observations.hostCadencePolicyViolations,0);
 });
 test('reported 20Hz for 9KiB payload is flagged as candidate policy mismatch',()=>{
   const a=mod.analyze(pc1(host(1).replace('periodMs=83','periodMs=50')),pc2(client(1)));
   assert.equal(a.observations.hostCadencePolicyChecks,1);
   assert.equal(a.observations.hostCadencePolicyViolations,1);
   assert.ok(a.findings.some(f=>f.code==='REPORTED_CADENCE_POLICY_MISMATCH'&&f.expectedMs===83));
   assert.equal(a.qualification.sameRevisionMetadata,'HOLD_ERRORS');
 });
 test('single host actionSerial rewind may indicate mixed sessions and is not labelled packet loss',()=>{
   const a=mod.analyze(pc1(host(1)+host(2).replace('action=8','action=7')),pc2(client(1)+client(2)));
   assert.ok(a.findings.some(f=>f.code==='ACTION_SERIAL_REWIND_OR_MIXED_SESSIONS'));
   assert.ok(!a.findings.some(f=>/PACKET_LOSS/.test(f.code)));
 });
 test('valid increasing actionSerial with sparse revision gap is not a rewind',()=>{
   const a=mod.analyze(pc1(host(1)+host(20).replace('action=8','action=9')),pc2(client(1)+client(20).replace('action=8','action=9')));
   assert.ok(!a.findings.some(f=>f.code==='ACTION_SERIAL_REWIND_OR_MIXED_SESSIONS'));
 });
 test('zero revision not a valid admitted snapshot',()=>{
   const a=mod.analyze(pc1(host(0)),pc2(client(0)));
   assert.ok(a.findings.filter(f=>f.code==='INVALID_TRACE_DOMAIN').length>=2);
   assert.equal(a.qualification.authoritativeStateParity,'NOT_PROVEN_NO_PAYLOAD_HASH');
 });
 test('zero chunks in host sample rejected before pairing',()=>{
   const a=mod.analyze(pc1(host(1).replace('chunks=2','chunks=0')),pc2(client(1)));
   assert.ok(a.findings.some(f=>f.code==='INVALID_TRACE_DOMAIN'));
 });
 test('zero compressed packet size rejected before cadence admission',()=>{
   const a=mod.analyze(pc1(host(1).replace('8901','0')),pc2(client(1)));
   assert.ok(a.findings.some(f=>f.code==='INVALID_TRACE_DOMAIN'));
 });
 test('zero client received counter rejected as impossible accepted sample',()=>{
   const a=mod.analyze(pc1(host(1)),pc2(client(1).replace('received=12','received=0')));
   assert.ok(a.findings.some(f=>f.code==='INVALID_TRACE_DOMAIN'));
 });
 test('old A31 TX/RX format remains independent of A41 cadence policy',()=>{
   const a=mod.analyze(pc1(tx(9)),pc2(rx(9)));
   assert.equal(a.observations.hostCadencePolicyChecks,0);
   assert.equal(a.observations.hostCadencePolicyViolations,0);
 });
 console.log(`RESULT: ${count}/${count} PASS, 0 FAIL`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
