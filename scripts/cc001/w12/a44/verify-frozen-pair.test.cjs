'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const {run,inventoryCheck,sessionCheck,flags,FROZEN,RC1}=require('./verify-frozen-pair.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=`'use strict';
// TEST DOUBLE ONLY. Not the original A72 verifier, never evidence of a real Windows build.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
let arg={};for(let x of process.argv.slice(2)){let i=x.indexOf('=');arg[x.slice(0,i)]=x.slice(i+1)}
const m=JSON.parse(fs.readFileSync(arg['--manifest'],'utf8'));let missing=[];let count=0;
for(let f of m.playerInventory){let b=path.join(arg['--player'],f.path);if(!fs.existsSync(b)||hash(fs.readFileSync(b))!==f.sha256.toUpperCase())missing.push(f.path);else count++}
const correct=!missing.length&&fs.existsSync(arg['--player'])&&arg['--sha']===m.candidateSHA;
console.log(JSON.stringify({status:correct?'PASS_BINARY_INTEGRITY_ONLY':'HOLD',candidateSHA:arg['--sha'],expectedFiles:m.playerInventory.length,actualFiles:count,failures:missing.map(path=>({path,reason:'MISMATCH'}))}));process.exitCode=correct?0:2;
`;
function fixture(fn){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w12-a44-'));
 const pc1=path.join(root,'pc1'),pc2=path.join(root,'pc2');fs.mkdirSync(pc1);fs.mkdirSync(pc2);
 const items=[['CoreClash.exe','EXE-TEST-BYTES'],['CoreClash_Data/Managed/Assembly-CSharp.dll','DLL-TEST-BYTES']];
 for(let i=0;i<52;i++)items.push(['CoreClash_Data/data'+i+'.bin','bytes'+i]);
 for(const [f,content] of items)for(const dir of [pc1,pc2]){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),content)}
 const inventory=items.map(([p,data])=>({path:p,bytes:Buffer.byteLength(data),sha256:sha(Buffer.from(data)).toUpperCase()}));
 const summary={schema:'CC001-W10-A72-WINDOWS-1',candidateSHA:FROZEN,rc1Base:RC1,status:'PASS_BUILD_EVIDENCE_ONLY',blockers:[],playerCount:inventory.length,playerInventory:inventory};
 const session={schemaVersion:1,project:'CC-001',wave:'R17-W10',agent:'A44',sessionId:'W12_FROZEN_3F_PAIR',baselineCommitReference:RC1,qaDisposition:'PENDING_INDEPENDENT_A60_PHYSICAL_QA',defectFixClaims:'NONE',
  buildIdentity:{pairExeByteIdentity:'MATCHED',pc1ExeSha256:inventory[0].sha256.toLowerCase(),pc2ExeSha256:inventory[0].sha256.toLowerCase()},
  evidence:{pc1LogSha256:sha('one'),pc2LogSha256:sha('two'),originalPc1Sha256:sha('1'),originalPc2Sha256:sha('2')},
  scenarios:[{id:'CONNECT',status:'NOT_RUN'}],issues:[]};
 const paths={summary:path.join(root,'summary.json'),session:path.join(root,'session.json'),verifier:path.join(root,'test-double-verifier.cjs'),pc1,pc2,out:path.join(root,'out.json')};
 fs.writeFileSync(paths.verifier,source);paths.verifierSha=sha(Buffer.from(source));
 const write=()=>{fs.writeFileSync(paths.summary,JSON.stringify(summary));fs.writeFileSync(paths.session,JSON.stringify(session));};write();
 try{fn({paths,root,pc1,pc2,summary,session,write,inventory});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('freeze pin is exact 3f, never moving PR207 HEAD',()=>{a.equal(FROZEN,'3f972cdbaea6289a7e33ce608f5d3256cfdab0a3')});
test('real Node child process verifies two complete synthetic player folders',()=>fixture(f=>{
 const r=run(f.paths);a.equal(r.frozenCandidate,FROZEN);a.equal(r.pc1.status,'A72_LOCAL_PLAYER_CHECK_PASS_SCOPED');a.equal(r.pc2.expectedFiles,54);
 a.equal(r.qaDisposition,'PENDING_INDEPENDENT_A60_PHYSICAL_QA');a.equal(r.physicalDeviceAttestation,'NOT_ATTESTED_BY_A44');a.equal(r.isNetworkSynchronizationProven,false);
 a.equal(JSON.parse(fs.readFileSync(f.paths.out)).a72OriginalSourceEvidence.exeSha256,sha('EXE-TEST-BYTES'));
 a.equal(r.a72OriginalSourceEvidence.summarySha256,sha(fs.readFileSync(f.paths.summary)));
 a.ok(!fs.readFileSync(f.paths.out,'utf8').includes('playerInventory'));
}));
test('shell CLI executes and cannot pretend physical two-PC PASS',()=>fixture(f=>{
 const cmd=[__filename.replace(/\.test\.cjs$/,'.cjs'),'--summary',f.paths.summary,'--session',f.paths.session,'--a72-verifier',f.paths.verifier,'--verifier-sha256',f.paths.verifierSha,'--pc1-player',f.pc1,'--pc2-player',f.pc2,'--out',f.paths.out];
 const res=cp.spawnSync(process.execPath,cmd,{encoding:'utf8'});a.equal(res.status,0,res.stderr);a.match(res.stdout,/A44_FROZEN_PLAYER_INTEGRITY_ONLY/);
 a.equal(JSON.parse(fs.readFileSync(f.paths.out)).isTwoPhysicalPCsProven,false);
}));
test('reject newer #207 HEAD and stale original 173273',()=>fixture(f=>{
 for(const s of ['87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c','173273122c11cbf738e8b954e32506a6196fe8ec']){
 f.summary.candidateSHA=s;f.write();a.throws(()=>run(f.paths),/NOT_FROZEN_QA_SHA/);a.equal(fs.existsSync(f.paths.out),false);
 }
}));
test('reject old RC1, wrong A72 source root',()=>fixture(f=>{f.summary.rc1Base='1'.repeat(40);f.write();a.throws(()=>run(f.paths),/WRONG_PROTECTED_BASE/)}));
test('reject build that never passed native evidence',()=>fixture(f=>{f.summary.status='HOLD';f.write();a.throws(()=>run(f.paths),/A72_BUILD_NOT_ACCEPTED/)}));
test('refuse replaced or tampered A72 verifier',()=>fixture(f=>{fs.appendFileSync(f.paths.verifier,'\n// modified');a.throws(()=>run(f.paths),/A72_VERIFIER_SHA_MISMATCH/)}));
test('reject missing or mutated PC2 Player files, with no partial receipt',()=>fixture(f=>{
 fs.appendFileSync(path.join(f.pc2,'CoreClash.exe'),'TAMPER');a.throws(()=>run(f.paths),/A72_NATIVE_VERIFIER_FAILED/);a.equal(fs.existsSync(f.paths.out),false);
}));
test('reject tampered PC1 Assembly-CSharp.dll',()=>fixture(f=>{fs.writeFileSync(path.join(f.pc1,'CoreClash_Data/Managed/Assembly-CSharp.dll'),'WRONG');a.throws(()=>run(f.paths),/A72_NATIVE_VERIFIER_FAILED/)}));
test('reject duplicate player roots (no false two-PC evidence)',()=>fixture(f=>{f.paths.pc2=f.paths.pc1;a.throws(()=>run(f.paths),/DUPLICATE_OR_NESTED_PLAYER_ROOTS/)}));
test('reject nested player roots',()=>fixture(f=>{f.paths.pc2=path.join(f.pc1,'CoreClash_Data');a.throws(()=>run(f.paths),/DUPLICATE_OR_NESTED_PLAYER_ROOTS/)}));
test('reject session with different EXE digest even if both directories pass',()=>fixture(f=>{f.session.buildIdentity.pc2ExeSha256=sha('WRONG');f.write();a.throws(()=>run(f.paths),/EXE_SHA_NOT_A72/)}));
test('reject forged QA success from operator session',()=>fixture(f=>{f.session.qaDisposition='PASS';f.write();a.throws(()=>run(f.paths),/UNAUTHORIZED_QA_CLAIM/)}));
test('reject absent log SHA',()=>fixture(f=>{delete f.session.evidence.pc2LogSha256;f.write();a.throws(()=>run(f.paths),/MISSING_LOG_SHA/)}));
test('reject wrong inventory count and path traversal',()=>fixture(f=>{f.summary.playerCount--;a.throws(()=>inventoryCheck(f.summary),/BAD_PLAYER_INVENTORY_COUNT/);f.summary.playerCount++;f.summary.playerInventory[5].path='../etc/passwd';a.throws(()=>inventoryCheck(f.summary),/INVALID_PLAYER_PATH/)}));
test('reject duplicate manifest paths and missing DLL',()=>fixture(f=>{f.summary.playerInventory[3].path=f.summary.playerInventory[2].path;a.throws(()=>inventoryCheck(f.summary),/BAD_INVENTORY_ITEM/);f.summary.playerInventory.splice(1,1);f.summary.playerCount--;f.summary.playerInventory[2].path='fixed';a.throws(()=>inventoryCheck(f.summary),/EXE_OR_DLL_MISSING|BAD_INVENTORY_ITEM/)}));
test('do not overwrite existing output file',()=>fixture(f=>{run(f.paths);a.throws(()=>run(f.paths),/OUTPUT_PATH_NOT_NEW/)}));
test('CLI flags require every field and reject duplicates',()=>{
 a.throws(()=>flags(['--summary','abc']),/MISSING_/);
 a.throws(()=>flags(['--wat','abc']),/BAD_ARGUMENT/);
 a.throws(()=>flags(['--summary','abc','--summary','def']),/DUPLICATE_ARGUMENT/);
});
test('run result does not include operator private paths or raw Player.log',()=>fixture(f=>{
 const r=run(f.paths);const t=JSON.stringify(r);a.ok(!t.includes(f.root));a.ok(!t.includes('Player.log'));a.ok(!t.includes('192.168.'));
}));
