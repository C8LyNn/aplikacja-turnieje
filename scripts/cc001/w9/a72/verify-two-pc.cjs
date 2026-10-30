'use strict';
// CC-001 R17-W9 A72. Offline, read-only, fail-closed PC1/PC2 artifact verifier.
// Does NOT certify animation smoothness, full snapshot parity or gameplay correctness.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sha = b => crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
const EXPECTED_EXE = '97845574417B7FC4DB70BFBAA4D3F941EAB8628DF2BCC9424DBA328D3A6549C3';
const EXPECTED_DLL = 'D80AB677155F44FF05BD9FE0972F8833F37BA25AB79CDF7D1F77D60FB418883F';
const RC1 = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const checked = (condition, msg) => { if (!condition) throw new Error(msg); };
const file = (dir, rel) => { const p=path.resolve(dir, rel); checked(p.startsWith(path.resolve(dir)+path.sep), 'Unsafe artifact path'); checked(fs.statSync(p).isFile(), 'Not regular file: '+rel); return fs.readFileSync(p); };
const finite = n => typeof n==='number' && Number.isFinite(n);
function load(dir, expectedRole) {
  checked(fs.statSync(dir).isDirectory(), 'Capture directory missing');
  const m = JSON.parse(file(dir, 'capture.json').toString('utf8'));
  checked(m.schema==='CC001-W9-A72-CAPTURE-1', 'Unsupported schema');
  checked(m.role===expectedRole, 'Role mismatch: expected '+expectedRole);
  checked(m.rc1===RC1, 'Wrong RC1 SHA');
  checked(typeof m.runId==='string'&&/^[a-zA-Z0-9_-]{6,64}$/.test(m.runId), 'Malformed runId');
  checked(m.playerExeSha256===EXPECTED_EXE, 'Player EXE SHA mismatch');
  checked(m.playerDllSha256===EXPECTED_DLL, 'Player DLL SHA mismatch');
  checked(typeof m.logSha256==='string'&&/^[A-Fa-f0-9]{64}$/.test(m.logSha256), 'Missing Player.log hash');
  checked(typeof m.samplesSha256==='string'&&/^[A-Fa-f0-9]{64}$/.test(m.samplesSha256), 'Missing samples hash');
  const logBytes=file(dir,'Player.log'), sampleBytes=file(dir,'samples.csv');
  checked(sha(logBytes)===m.logSha256.toUpperCase(), 'Player.log BYTES mismatch');
  checked(sha(sampleBytes)===m.samplesSha256.toUpperCase(), 'samples.csv BYTES mismatch');
  checked(!m.captureMayBePartial, 'Game still running at sample end: log may be incomplete');
  const log=logBytes.toString('utf8');
  const events=log.split(/\r?\n/).filter(l=>l.includes('CC_NET_'));
  const stats = { role:m.role, runId:m.runId, events:events.length,
    connected:events.filter(l=>l.includes('CC_NET_PEER_CONNECTED')&&/owner=1\b/.test(l)).length,
    hostP2Accepted:events.filter(l=>/CC_NET_INTENT_ACCEPT owner=1\b/.test(l)&&/seq=\d+\b/.test(l)&&/action=\d+\b/.test(l)),
    firstP2Snapshot:events.filter(l=>/CC_NET_STATE_APPLIED revision=\d+ owner=1\b/.test(l)),
    snapshotErrors:events.filter(l=>/CC_NET_SNAPSHOT_ERROR/.test(l)),
    rejected:events.filter(l=>/CC_NET_INTENT_REJECT/.test(l)),
    failed:log.includes('CC_LAN_CONNECTION_FAILED'),
    sampledRows:sampleBytes.toString('utf8').split(/\r?\n/).filter(x=>x.trim()).length-1,
    usedIp: /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(log),
    sourceLogSHA256:m.logSha256,
    sourceSamplesSHA256:m.samplesSha256 };
  checked(stats.sampledRows>=1,'No health samples');
  return stats;
}
function run(hostDir,clientDir){
  const h=load(hostDir,'host'), c=load(clientDir,'client');
  checked(h.runId===c.runId,'Different two-PC test run IDs');
  const gates = [
    {name:'same_RC1_binary_identity',status:'PASS'},
    {name:'same_test_run_id',status:'PASS'},
    {name:'host_P2_connected',status:h.connected>0?'PASS':'HOLD',detail:'host CC_NET_PEER_CONNECTED owner=1'},
    {name:'host_P2_accepted_intent',status:h.hostP2Accepted.length===1?'PASS':'HOLD',detail:'accepted='+h.hostP2Accepted.length+'; required exactly one P2 command for NET-W6-01'},
    {name:'client_first_authoritative_snapshot',status:c.firstP2Snapshot.length>0?'PASS':'HOLD'},
    {name:'no_explicit_snapshot_failure',status:!h.failed&&!c.failed&&!h.snapshotErrors.length&&!c.snapshotErrors.length?'PASS':'HOLD'},
    {name:'continuous_snapshot_revision_parity',status:'NOT_OBSERVABLE',detail:'RC1 logs only first client CC_NET_STATE_APPLIED; no per-snapshot sequence/state hashes'},
    {name:'P2_viewpoint_turn_aim_and_strength_UI',status:'NOT_OBSERVABLE',detail:'requires native game screenshot/operator evidence and independent A60 QA'},
    {name:'stutter_frame_timing',status:'NOT_OBSERVABLE',detail:'process health samples are not frame-presentation timings'}
  ];
  const statuses=gates.filter(x=>x.status==='HOLD');
  const verdict=statuses.length?'HOLD':'PASS_LOG_SUBSET_ONLY';
  return {schema:'CC001-W9-A72-VERDICT-1',rc1:RC1,runId:h.runId,verdict,gates,
    host:{connected:h.connected,acceptedP2:h.hostP2Accepted.length,events:h.events,samples:h.sampledRows},
    client:{firstSnapshots:c.firstP2Snapshot.length,events:c.events,samples:c.sampledRows},
    privacy:{hostLogContainsIPv4:h.usedIp,clientLogContainsIPv4:c.usedIp,advice:'Do not paste raw Player.log or private IP into public issue; share original artifacts privately with QA.'},
    qualification:'Never mark NET-W6-01 or G3 PASS from this offline verifier alone; A31/A60 must validate paired state, actual P2 gameplay and screens.'};
}
function cli(args){
  if(args[0]==='--self-test')return selfTest();
  checked(args.length===2,'Usage: node verify-two-pc.cjs <HOST-capture-dir> <CLIENT-capture-dir>');
  const report=run(args[0],args[1]);
  console.log(JSON.stringify(report,null,2));
  if(report.verdict!=='PASS_LOG_SUBSET_ONLY')process.exitCode=2;
}
function selfTest(){
 const os=require('node:os'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w9-a72-test-'));
 const mk=(role,log)=>{let d=path.join(temp,role);fs.mkdirSync(d);let lb=Buffer.from(log),sb=Buffer.from('utc,processId,workingSetBytes,processorSeconds,tcpEstablished\n2026-10-30T18:00:00Z,123,1000,0.1,1\n');fs.writeFileSync(path.join(d,'Player.log'),lb);fs.writeFileSync(path.join(d,'samples.csv'),sb);let obj={schema:'CC001-W9-A72-CAPTURE-1',role,runId:'TEST001',rc1:RC1,playerExeSha256:EXPECTED_EXE,playerDllSha256:EXPECTED_DLL,logSha256:sha(lb),samplesSha256:sha(sb),captureMayBePartial:false};fs.writeFileSync(path.join(d,'capture.json'),JSON.stringify(obj));return d};
 const h=mk('host','CC_NET_PEER_CONNECTED id=3 owner=1\nCC_NET_INTENT_ACCEPT owner=1 seq=1 action=2\n'),c=mk('client','CC_NET_STATE_APPLIED revision=9 owner=1\n');
 let count=0;const test=(name,cb)=>{try{cb();count++;}catch(e){throw Error(name+': '+e.message)}};
 const rejects=(fn)=>{try{fn()}catch{return}throw Error('Expected rejection')};
 try {
  test('positive host/client',()=>checked(run(h,c).verdict==='PASS_LOG_SUBSET_ONLY','positive failed'));
  test('no fake snapshot parity',()=>checked(run(h,c).gates.find(x=>x.name==='continuous_snapshot_revision_parity').status==='NOT_OBSERVABLE','parity falsely pass'));
  test('negative missing P2 intent',()=>{fs.writeFileSync(path.join(h,'Player.log'),'CC_NET_PEER_CONNECTED id=3 owner=1\n');const m=JSON.parse(file(h,'capture.json'));m.logSha256=sha(file(h,'Player.log'));fs.writeFileSync(path.join(h,'capture.json'),JSON.stringify(m));checked(run(h,c).verdict==='HOLD','intent should HOLD')});
  test('negative wrong log SHA',()=>{fs.appendFileSync(path.join(h,'Player.log'),'ALTERED');rejects(()=>run(h,c))});
  test('negative mixed run',()=>{fs.writeFileSync(path.join(h,'Player.log'),'CC_NET_PEER_CONNECTED id=3 owner=1\nCC_NET_INTENT_ACCEPT owner=1 seq=1 action=2\n');let m=JSON.parse(file(h,'capture.json'));m.logSha256=sha(file(h,'Player.log'));fs.writeFileSync(path.join(h,'capture.json'),JSON.stringify(m));m=JSON.parse(file(c,'capture.json'));m.runId='ANOTHER';fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));rejects(()=>run(h,c))});
  test('negative wrong RC1',()=>{let m=JSON.parse(file(c,'capture.json'));m.runId='TEST001';m.rc1='f'.repeat(40);fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));rejects(()=>run(h,c))});
  test('negative wrong exe',()=>{let m=JSON.parse(file(c,'capture.json'));m.rc1=RC1;m.playerExeSha256='f'.repeat(64);fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));rejects(()=>run(h,c))});
  test('negative partial capture',()=>{let m=JSON.parse(file(c,'capture.json'));m.playerExeSha256=EXPECTED_EXE;m.captureMayBePartial=true;fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));rejects(()=>run(h,c))});
  test('negative no samples',()=>{let m=JSON.parse(file(c,'capture.json'));m.captureMayBePartial=false;fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));fs.writeFileSync(path.join(c,'samples.csv'),'utc,processId,workingSetBytes,processorSeconds,tcpEstablished\n');m.samplesSha256=sha(file(c,'samples.csv'));fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));rejects(()=>run(h,c))});
  test('negative duplicate intent',()=>{let m=JSON.parse(file(c,'capture.json'));fs.writeFileSync(path.join(c,'samples.csv'),'utc,processId,workingSetBytes,processorSeconds,tcpEstablished\n2026-10-30T18:00:00Z,123,1000,0.1,1\n');m.samplesSha256=sha(file(c,'samples.csv'));fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));fs.appendFileSync(path.join(h,'Player.log'),'CC_NET_INTENT_ACCEPT owner=1 seq=2 action=3\n');m=JSON.parse(file(h,'capture.json'));m.logSha256=sha(file(h,'Player.log'));fs.writeFileSync(path.join(h,'capture.json'),JSON.stringify(m));checked(run(h,c).verdict==='HOLD','duplicate P2 not held')});
  test('negative false role',()=>{let m=JSON.parse(file(c,'capture.json'));m.role='host';fs.writeFileSync(path.join(c,'capture.json'),JSON.stringify(m));rejects(()=>run(h,c))});
  test('negative missing log',()=>{fs.rmSync(path.join(c,'Player.log'));rejects(()=>run(h,c))});
  console.log(JSON.stringify({selfTest:'PASS',passed:count,failed:0},null,2));
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
}
try{cli(process.argv.slice(2))}catch(e){console.error('A72 STOP: '+e.message);process.exitCode=1}
