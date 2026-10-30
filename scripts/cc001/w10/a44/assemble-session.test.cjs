'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs');
const os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {create,validateObservation,clean,cli}=require('./assemble-session.cjs');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(fn){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w10-a44-'));
 const pack=path.join(dir,'pack');fs.mkdirSync(pack);
 const h=Buffer.from('CC_NET_HOST_READY\n'),c=Buffer.from('CC_NET_STATE_APPLIED\n');
 fs.writeFileSync(path.join(pack,'PC1_Player.redacted.log'),h);
 fs.writeFileSync(path.join(pack,'PC2_Player.redacted.log'),c);
 const info={schemaVersion:1,project:'CC-001',agent:'A44',sessionId:'W10_PC_PAIR_001',baselineCommitReference:'10f64e4d213f17a352ed8fa83bc75884a39549f0',evidenceStatus:'CAPTURED_UNVERIFIED_BY_A60',pc1:{seatClaim:'P1',log:{file:'PC1_Player.redacted.log',originalSha256:sha(h),sanitizedSha256:sha(h),sanitizedBytes:h.length},exe:{status:'MATCHES_OPERATOR_EXPECTATION',sha256:sha(Buffer.from('EXE'))}},pc2:{seatClaim:'P2',log:{file:'PC2_Player.redacted.log',originalSha256:sha(c),sanitizedSha256:sha(c),sanitizedBytes:c.length},exe:{status:'MATCHES_OPERATOR_EXPECTATION',sha256:sha(Buffer.from('EXE'))}}};
 fs.writeFileSync(path.join(pack,'evidence-manifest.json'),JSON.stringify(info));
 const obs={schemaVersion:1,sessionId:info.sessionId,startedAtUtc:'2026-10-30T18:00:00Z',endedAtUtc:'2026-10-30T18:10:00Z',topology:'PRIVATE_LAN',environment:'LOCAL_WINDOWS_TWO_PC',pc1:{deviceClass:'WINDOWS_DESKTOP',role:'HOST',screenResolution:'1920x1080'},pc2:{deviceClass:'WINDOWS_DESKTOP',role:'CLIENT',screenResolution:'1366x768'},scenarios:[{id:'CONNECT',status:'OBSERVED_OK'},{id:'MOVING_SYNC',status:'ISSUE',note:'ball jumps on PC2'}],issues:[{category:'SYNC_TELEPORT',priority:'HIGH',risk:'MEDIUM',scope:'SMALL',device:'PC2',expected:'smooth ball motion',actual:'jumped 400 units',reproduce:'shoot then observe'}]};
 const observations=path.join(dir,'observations.json'),out=path.join(dir,'record.json');fs.writeFileSync(observations,JSON.stringify(obs));
 try{fn({dir,pack,packDir:pack,obs,info,observations,out});}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('creates linked record without granting QA PASS',()=>fixture(o=>{const d=create(o);assert.equal(d.qaDisposition,'PENDING_INDEPENDENT_A60_PHYSICAL_QA');assert.equal(d.buildIdentity.pairExeByteIdentity,'MATCHED');assert.equal(d.issues[0].routeTo,'A31');assert.equal(JSON.parse(fs.readFileSync(o.out)).sessionId,'W10_PC_PAIR_001');}));
test('blocks tampered sanitized log',()=>fixture(o=>{fs.appendFileSync(path.join(o.pack,'PC1_Player.redacted.log'),'x');assert.throws(()=>create(o),/LOG_FILE_INVALID|SANITIZED_LOG_TAMPERED/);assert.equal(fs.existsSync(o.out),false);}));
test('blocks wrong seat',()=>fixture(o=>{o.info.pc2.seatClaim='P1';fs.writeFileSync(path.join(o.pack,'evidence-manifest.json'),JSON.stringify(o.info));assert.throws(()=>create(o),/INVALID_SEAT_CLAIMS/);}));
test('reject session ID mismatch',()=>fixture(o=>{o.obs.sessionId='BAD';fs.writeFileSync(o.observations,JSON.stringify(o.obs));assert.throws(()=>create(o),/SESSION_ID_MISMATCH/);}));
test('reject bad time range',()=>fixture(o=>{o.obs.endedAtUtc='2026-10-29T17:00:00Z';fs.writeFileSync(o.observations,JSON.stringify(o.obs));assert.throws(()=>create(o),/INVALID_SESSION_TIME/);}));
test('duplicate scenarios blocked',()=>fixture(o=>{o.obs.scenarios.push(o.obs.scenarios[0]);fs.writeFileSync(o.observations,JSON.stringify(o.obs));assert.throws(()=>create(o),/UNKNOWN_OR_DUPLICATE_SCENARIO/);}));
test('no issue without separate priority/risk/scope',()=>fixture(o=>{delete o.obs.issues[0].risk;fs.writeFileSync(o.observations,JSON.stringify(o.obs));assert.throws(()=>create(o),/INVALID_TRIAGE/);}));
test('claims cannot bypass QA verdict',()=>fixture(o=>{o.obs.qaDisposition='PASS';fs.writeFileSync(o.observations,JSON.stringify(o.obs));const d=create(o);assert.equal(d.qaDisposition,'PENDING_INDEPENDENT_A60_PHYSICAL_QA');}));
test('no build hash gives UNVERIFIED',()=>fixture(o=>{o.info.pc1.exe={status:'NOT_PROVIDED'};fs.writeFileSync(path.join(o.pack,'evidence-manifest.json'),JSON.stringify(o.info));assert.equal(create(o).buildIdentity.pairExeByteIdentity,'UNVERIFIED');}));
test('mismatched binary hash gives MISMATCHED',()=>fixture(o=>{o.info.pc2.exe.sha256=sha(Buffer.from('OTHER'));fs.writeFileSync(path.join(o.pack,'evidence-manifest.json'),JSON.stringify(o.info));assert.equal(create(o).buildIdentity.pairExeByteIdentity,'MISMATCHED');}));
test('cannot overwrite existing output',()=>fixture(o=>{create(o);assert.throws(()=>create(o),/OUTPUT_EXISTS/);}));
test('privacy redaction covers common leaks',()=>{const s=clean('192.168.1.5 user@example.org token=abcdef https://example.org/test');assert(!s.includes('192.168.1.5'));assert(!s.includes('abcdef'));assert(!s.includes('example.org'));});
test('CLI parser rejects duplicate and invalid flags',()=>{assert.deepEqual(cli(['--pack','p','--observations','o','--out','x']),{packDir:'p',observations:'o',out:'x'});assert.throws(()=>cli(['--pack','p','--pack','q']),/DUPLICATE_FLAG/);assert.throws(()=>cli(['--wat','a']),/INVALID_FLAG/);});
test('missing scenarios rejected',()=>fixture(o=>{o.obs.scenarios=[];fs.writeFileSync(o.observations,JSON.stringify(o.obs));assert.throws(()=>create(o),/SCENARIOS_REQUIRED/);}));

test('end-to-end W9 packer to W10 record retains original log hashes',()=>{
 const {capture}=require('../../w9/a44/pack-multiplayer-evidence.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a44-e2e-'));
 try {
  const pc1=path.join(dir,'pc1.log'),pc2=path.join(dir,'pc2.log');
  fs.writeFileSync(pc1,'CC_NET_HOST_READY addr=192.168.1.3\n');
  fs.writeFileSync(pc2,'CC_NET_STATE_APPLIED rev=3\n');
  const pack=path.join(dir,'bundle');
  const manifest=capture({host:pc1,client:pc2,out:pack,session:'W10_REAL_PAIR_01'});
  const obs={schemaVersion:1,sessionId:'W10_REAL_PAIR_01',startedAtUtc:'2026-10-30T18:00:00Z',endedAtUtc:'2026-10-30T18:02:00Z',topology:'PRIVATE_LAN',environment:'LOCAL_WINDOWS_TWO_PC',pc1:{deviceClass:'WINDOWS_DESKTOP',role:'HOST',screenResolution:'1920x1080'},pc2:{deviceClass:'WINDOWS_DESKTOP',role:'CLIENT',screenResolution:'1366x768'},scenarios:[{id:'MOVING_SYNC',status:'ISSUE',note:'PC2 snap'}],issues:[]};
  const obsFile=path.join(dir,'observations.json'),out=path.join(dir,'record.json');
  fs.writeFileSync(obsFile,JSON.stringify(obs));
  const d=create({packDir:pack,observations:obsFile,out});
  assert.equal(d.evidence.originalPc1Sha256,manifest.pc1.log.originalSha256);
  assert.equal(d.buildIdentity.pairExeByteIdentity,'UNVERIFIED');
  assert.equal(d.qaDisposition,'PENDING_INDEPENDENT_A60_PHYSICAL_QA');
  assert.equal(fs.readFileSync(path.join(pack,'PC1_Player.redacted.log'),'utf8').includes('192.168.1.3'),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('strips unapproved PC metadata from submitted records',()=>fixture(o=>{
 o.obs.pc1.privateAddress='192.168.10.3';o.obs.pc1.username='private-user';
 fs.writeFileSync(o.observations,JSON.stringify(o.obs));
 const d=create(o);assert.equal(d.devices.pc1.privateAddress,undefined);assert.equal(d.devices.pc1.username,undefined);
}));
test('each classified issue becomes a separate route and unique issue ID',()=>fixture(o=>{
 o.obs.issues.push({category:'AIM_ARROW',priority:'MEDIUM',risk:'LOW',scope:'SMALL',device:'PC2',expected:'one arrow',actual:'three arrows'});
 fs.writeFileSync(o.observations,JSON.stringify(o.obs));const d=create(o);
 assert.equal(d.issues.length,2);assert.equal(d.issues[0].routeTo,'A31');assert.equal(d.issues[1].routeTo,'A20');assert.notEqual(d.issues[0].issueId,d.issues[1].issueId);
}));