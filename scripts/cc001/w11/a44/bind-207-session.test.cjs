'use strict';
const test=require('node:test');
const a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {validate,run,parseFlags,APPROVED_SHA}=require('./bind-207-session.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function fixture(){
 const inventory=[{path:'CoreClash.exe',bytes:3,sha256:hash('exe')},{path:'CoreClash_Data/Managed/Assembly-CSharp.dll',bytes:3,sha256:hash('dll')}];
 for(let n=0;n<51;n++)inventory.push({path:'CoreClash_Data/file_'+n+'.dat',bytes:1,sha256:hash(String(n))});
 const summary={schema:'CC001-W10-A72-WINDOWS-1',candidateSHA:APPROVED_SHA,rc1Base:'10f64e4d213f17a352ed8fa83bc75884a39549f0',status:'PASS_BUILD_EVIDENCE_ONLY',blockers:[],playerCount:inventory.length,playerInventory:inventory};
 const record={schemaVersion:1,project:'CC-001',wave:'R17-W10',agent:'A44',sessionId:'PC1_PC2_W11_01',baselineCommitReference:summary.rc1Base,qaDisposition:'PENDING_INDEPENDENT_A60_PHYSICAL_QA',defectFixClaims:'NONE',buildIdentity:{pairExeByteIdentity:'MATCHED',pc1ExeSha256:hash('exe'),pc2ExeSha256:hash('exe')},scenarios:[{id:'MOVING_SYNC',status:'NOT_RUN'}],issues:[],evidence:{pc1LogSha256:hash('1'),pc2LogSha256:hash('2'),originalPc1Sha256:hash('3'),originalPc2Sha256:hash('4')}};
 const receipt={status:'PASS_BINARY_INTEGRITY_ONLY',candidateSHA:APPROVED_SHA,expectedFiles:inventory.length,actualFiles:inventory.length,failures:[]};
 return {summary,record,pc1:{...receipt},pc2:{...receipt}};
}
function valid(){const x=fixture();return validate(x.summary,x.record,x.pc1,x.pc2);}
test('links exact #207 candidate to W10 session with no QA PASS',()=>{let r=valid();a.equal(r.candidateCommit,APPROVED_SHA);a.equal(r.receiptConsistency,'PASS_STATIC_RECEIPT_LINK_ONLY');a.equal(r.gameplaySynchronization,'NOT_ASSESSED');a.equal(r.qaDisposition,'PENDING_INDEPENDENT_A60_PHYSICAL_QA');});
test('reject other candidate in A72 summary',()=>{let x=fixture();x.summary.candidateSHA='1'.repeat(40);a.throws(()=>validate(...Object.values(x)),/A72_WRONG_CANDIDATE/);});
test('reject A72 HOLD even if receipts claim PASS',()=>{let x=fixture();x.summary.status='HOLD';a.throws(()=>validate(...Object.values(x)),/A72_BUILD_HOLD/);});
test('reject wrong RC1 ancestry',()=>{let x=fixture();x.summary.rc1Base='2'.repeat(40);a.throws(()=>validate(...Object.values(x)),/A72_WRONG_ANCESTRY/);});
test('reject missing managed DLL',()=>{let x=fixture();x.summary.playerInventory.splice(1,1);x.summary.playerCount--;a.throws(()=>validate(...Object.values(x)),/A72_EXE_OR_MANAGED_DLL_MISSING/);});
test('reject invented inventory or duplicate path',()=>{let x=fixture();x.summary.playerInventory.push(x.summary.playerInventory[0]);x.summary.playerCount++;a.throws(()=>validate(...Object.values(x)),/A72_BAD_INVENTORY_ENTRY/);});
test('reject traversal in A72 paths',()=>{let x=fixture();x.summary.playerInventory[3].path='../escape';a.throws(()=>validate(...Object.values(x)),/A72_UNSAFE_PATH/);});
test('reject PC2 receipt for another candidate',()=>{let x=fixture();x.pc2.candidateSHA='3'.repeat(40);a.throws(()=>validate(...Object.values(x)),/PC2_CANDIDATE_MISMATCH/);});
test('reject missing PC1 verified full inventory',()=>{let x=fixture();x.pc1.actualFiles=1;a.throws(()=>validate(...Object.values(x)),/PC1_INVENTORY_COUNT_MISMATCH/);});
test('reject mismatched Player EXE despite two receipts',()=>{let x=fixture();x.record.buildIdentity.pc2ExeSha256=hash('different');a.throws(()=>validate(...Object.values(x)),/SESSION_EXE_NOT_A72_BUILD/);});
test('reject unverified PC binary parity',()=>{let x=fixture();x.record.buildIdentity.pairExeByteIdentity='UNVERIFIED';a.throws(()=>validate(...Object.values(x)),/SESSION_EXE_PAIR_NOT_MATCHED/);});
test('reject false QA PASS in user session',()=>{let x=fixture();x.record.qaDisposition='PASS';a.throws(()=>validate(...Object.values(x)),/SESSION_FALSE_QA_CLAIM/);});
test('reject log SHA omissions',()=>{let x=fixture();delete x.record.evidence.originalPc2Sha256;a.throws(()=>validate(...Object.values(x)),/SESSION_LOG_PROVENANCE_MISSING/);});
test('parseFlags fail closed on missing, repeated and unknown flags',()=>{a.throws(()=>parseFlags(['--summary','a']),/MISSING_ARGUMENT/);a.throws(()=>parseFlags(['--summary','a','--summary','b']),/DUPLICATE_ARGUMENT/);a.throws(()=>parseFlags(['--junk','x']),/BAD_ARGUMENTS/);});
test('real CLI writes digest receipts only, refuses overwrite',()=>{
 const x=fixture(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w11-a44-'));
 try{
   const o={out:path.join(dir,'out.json')};for(const k of ['summary','record','pc1','pc2']){o[k==='record'?'session':k]=path.join(dir,k+'.json');fs.writeFileSync(path.join(dir,k+'.json'),JSON.stringify(x[k]));}
   const r=run(o);a.equal(r.receiptAuthenticity,'NOT_ATTESTED_BY_A44');
   const saved=JSON.parse(fs.readFileSync(o.out,'utf8'));
   a.equal(saved.inputSha256.a44Session,hash(fs.readFileSync(o.session)));a.equal(saved.a72Inventory.entries,53);
   a.equal(saved.releaseApproval,'NO');a.ok(!fs.readFileSync(o.out,'utf8').includes('playerInventory'));
   a.throws(()=>run(o),/OUTPUT_ALREADY_EXISTS/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('tampered full-inventory count rejected',()=>{let x=fixture();x.summary.playerCount=77;a.throws(()=>validate(...Object.values(x)),/A72_COUNT_MISMATCH/);});
test('full W9 capture -> W10 session -> W11 #207 binding on synthetic paired evidence',()=>{
 const {capture}=require('../../w9/a44/pack-multiplayer-evidence.cjs');
 const {create}=require('../../w10/a44/assemble-session.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w11-a44-e2e-'));
 try {
  const host=path.join(dir,'h.log'),client=path.join(dir,'c.log'),hExe=path.join(dir,'h.exe'),cExe=path.join(dir,'c.exe');
  fs.writeFileSync(host,'CC_NET_HOST_READY token=SECRET_TEST_X addr=192.168.1.2\nCC_NET_INTENT_ACCEPT owner=1 seq=1 action=2\n');
  fs.writeFileSync(client,'CC_NET_STATE_APPLIED rev=5\nCC_NET_TRACE_RX rev=5 serial=2 turn=1\n');
  fs.writeFileSync(hExe,'exe');fs.writeFileSync(cExe,'exe');
  const pack=path.join(dir,'pack');
  const manifest=capture({host,client,out:pack,session:'PC1_PC2_W11_REAL_01',hostExe:hExe,clientExe:cExe,expectedExeSha:hash('exe')});
  a.equal(manifest.pc1.exe.status,'MATCHES_OPERATOR_EXPECTATION');
  a.ok(!fs.readFileSync(path.join(pack,'PC1_Player.redacted.log'),'utf8').includes('SECRET_TEST_X'));
  const obs={schemaVersion:1,sessionId:manifest.sessionId,startedAtUtc:'2026-10-30T18:00:00Z',endedAtUtc:'2026-10-30T18:05:00Z',topology:'PRIVATE_LAN',environment:'LOCAL_WINDOWS_TWO_PC',pc1:{deviceClass:'WINDOWS_DESKTOP',role:'HOST',screenResolution:'1920x1080'},pc2:{deviceClass:'WINDOWS_DESKTOP',role:'CLIENT',screenResolution:'1366x768'},scenarios:[{id:'MOVING_SYNC',status:'NOT_RUN'}],issues:[]};
  const obsPath=path.join(dir,'observations.json');fs.writeFileSync(obsPath,JSON.stringify(obs));
  const recordPath=path.join(dir,'record.json'); const rec=create({packDir:pack,observations:obsPath,out:recordPath});
  a.equal(rec.buildIdentity.pairExeByteIdentity,'MATCHED');
  const x=fixture();
  const summaryPath=path.join(dir,'summary.json'),p1=path.join(dir,'pc1.json'),p2=path.join(dir,'pc2.json');
  for(const [file,value] of [[summaryPath,x.summary],[p1,x.pc1],[p2,x.pc2]])fs.writeFileSync(file,JSON.stringify(value));
  const result=run({summary:summaryPath,session:recordPath,pc1:p1,pc2:p2,out:path.join(dir,'bound.json')});
  a.equal(result.candidateCommit,APPROVED_SHA);
  a.equal(result.logSha256.pc1,manifest.pc1.log.sanitizedSha256);
  a.equal(result.qaDisposition,'PENDING_INDEPENDENT_A60_PHYSICAL_QA');
  a.equal(result.realDeviceProvenance,'NOT_ATTESTED_BY_A44');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
