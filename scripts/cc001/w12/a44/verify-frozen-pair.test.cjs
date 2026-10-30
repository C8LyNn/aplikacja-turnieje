'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const {run,inventoryCheck,sessionCheck,flags,FROZEN,RC1,A72_VERIFIER_BLOB,gitBlobSha}=require('./verify-frozen-pair.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const testDoubleSource=`'use strict';
// TEST DOUBLE ONLY. Not the original A72 verifier, never evidence of a real Windows build.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
let arg={};for(let x of process.argv.slice(2)){let i=x.indexOf('=');arg[x.slice(0,i)]=x.slice(i+1)}
const m=JSON.parse(fs.readFileSync(arg['--manifest'],'utf8'));let missing=[];let count=0;
for(let f of m.playerInventory){let b=path.join(arg['--player'],f.path);if(!fs.existsSync(b)||hash(fs.readFileSync(b))!==f.sha256.toUpperCase())missing.push(f.path);else count++}
const correct=!missing.length&&fs.existsSync(arg['--player'])&&arg['--sha']===m.candidateSHA;
console.log(JSON.stringify({status:correct?'PASS_BINARY_INTEGRITY_ONLY':'HOLD',candidateSHA:arg['--sha'],expectedFiles:m.playerInventory.length,actualFiles:count,failures:missing.map(path=>({path,reason:'MISMATCH'}))}));process.exitCode=correct?0:2;
`;
// Regression fixture: literal exact A72 #188 verifier bytes (Git blob b8181229bcf8a6fdb51a0d89be1c4f547fd9407f).
// Included only in test source; production A44 code does not load this literal as its executable verifier.
const source="'use strict';\n// A72: standalone fail-closed exact Windows Player distribution gate. No state mutation.\nconst fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');\nconst SHA=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();\nconst validSha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);\nconst ensure=(v,msg)=>{if(!v)throw Error(msg)};\nconst safePath=x=>typeof x==='string'&&x.length>0&&!x.startsWith('/')&&!x.includes('\\\\')&&!x.includes(':')&&x.split('/').every(x=>x&&x!=='.'&&x!=='..');\nfunction files(dir,playerRoot=dir){\n let out=[];\n for(const x of fs.readdirSync(dir,{withFileTypes:true})){\n  const f=path.join(dir,x.name),s=fs.lstatSync(f);\n  ensure(!s.isSymbolicLink(),'Symlink forbidden: '+f);\n  if(s.isDirectory())out=out.concat(files(f,playerRoot));\n  else {\n   ensure(s.isFile(),'Not regular Player file');\n   const rel=path.relative(playerRoot,f).split(path.sep).join('/');\n   ensure(safePath(rel),'Unsafe Player path: '+rel);\n   out.push({path:rel,bytes:s.size,sha256:SHA(fs.readFileSync(f))});\n  }\n }\n return out;\n}\nfunction check(manifest,player,sha){\n ensure(validSha(sha),'Expected exact candidate SHA required');\n ensure(manifest&&manifest.schema==='CC001-W10-A72-WINDOWS-1','Wrong W10 build manifest');\n ensure(manifest.candidateSHA===sha,'Candidate SHA mismatch');\n ensure(manifest.status==='PASS_BUILD_EVIDENCE_ONLY','Source build evidence not passed: '+manifest.status);\n ensure(fs.statSync(player).isDirectory(),'Player directory not found');\n const expected=manifest.playerInventory;ensure(Array.isArray(expected)&&expected.length>50,'Missing full Player inventory');\n const seen=new Set();for(const x of expected){ensure(safePath(x.path)&&!seen.has(x.path),'Invalid/duplicate Player path');seen.add(x.path);ensure(Number.isSafeInteger(x.bytes)&&x.bytes>=0&&/^[A-Fa-f0-9]{64}$/.test(x.sha256),'Bad inventory entry')}\n ensure(seen.has('CoreClash.exe')&&seen.has('CoreClash_Data/Managed/Assembly-CSharp.dll'),'Required Player EXE/DLL missing from inventory');\n ensure(expected.filter(x=>x.path==='CoreClash.exe'||x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll').every(x=>x.bytes>0),'Required Player EXE/DLL cannot have zero bytes');\n const current=files(player);const actual=new Map(current.map(x=>[x.path,x]));let failures=[];\n for(const x of expected){const y=actual.get(x.path);if(!y)failures.push({path:x.path,reason:'MISSING'});else if(y.bytes!==x.bytes||y.sha256!==x.sha256.toUpperCase())failures.push({path:x.path,reason:'SHA256_OR_SIZE_MISMATCH'})}\n for(const x of current){if(!seen.has(x.path))failures.push({path:x.path,reason:'EXTRA_UNMANIFESTED_FILE'})}\n return {status:failures.length?'HOLD':'PASS_BINARY_INTEGRITY_ONLY',candidateSHA:sha,expectedFiles:expected.length,actualFiles:current.length,failures,scope:'Standalone local Player bytes only, NOT multiplayer/G3 or A60 independent QA'};\n}\nfunction argumentsMap(args){let obj={};for(const x of args){const m=/^--([a-z-]+)=(.*)$/.exec(x);ensure(m,'Use --name=value');obj[m[1]]=m[2]}return obj}\nfunction selfTest(){const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'cc001w10verify-'));let count=0;const test=fn=>{fn();count++};const rejected=fn=>{assert.throws(fn)};\ntry{\n const root=path.join(temp,'player');fs.mkdirSync(root);\n fs.writeFileSync(path.join(root,'CoreClash.exe'),'abc');\n const data=path.join(root,'CoreClash_Data');fs.mkdirSync(data);\n const managed=path.join(data,'Managed');fs.mkdirSync(managed);\n const dll=path.join(managed,'Assembly-CSharp.dll');fs.writeFileSync(dll,'fresh-binary-dll');\n // Independent hard-coded manifest paths: do not derive expected paths using files().\n const inventory=[{path:'CoreClash.exe',bytes:3,sha256:SHA(Buffer.from('abc'))},{path:'CoreClash_Data/Managed/Assembly-CSharp.dll',bytes:16,sha256:SHA(Buffer.from('fresh-binary-dll'))}];\n for(let i=0;i<52;i++){const payload='hello-'+i;fs.writeFileSync(path.join(data,`file-${i}.dat`),payload);inventory.push({path:`CoreClash_Data/file-${i}.dat`,bytes:Buffer.byteLength(payload),sha256:SHA(Buffer.from(payload))})}\n const sha='1'.repeat(40);const manifest={schema:'CC001-W10-A72-WINDOWS-1',candidateSHA:sha,status:'PASS_BUILD_EVIDENCE_ONLY',playerInventory:inventory};\n test(()=>assert.equal(check(manifest,root,sha).status,'PASS_BINARY_INTEGRITY_ONLY'));\n test(()=>rejected(()=>check(manifest,root,'a'.repeat(40))));\n test(()=>rejected(()=>check({...manifest,status:'HOLD'},root,sha)));\n test(()=>rejected(()=>check({...manifest,playerInventory:[]},root,sha)));\n test(()=>rejected(()=>check({...manifest,playerInventory:[...manifest.playerInventory,{path:'../bad',bytes:1,sha256:'0'.repeat(64)}]},root,sha)));\n test(()=>rejected(()=>check({...manifest,playerInventory:[...manifest.playerInventory,manifest.playerInventory[0]]},root,sha)));\n test(()=>{fs.appendFileSync(path.join(root,'CoreClash.exe'),'bad');assert.equal(check(manifest,root,sha).status,'HOLD');fs.writeFileSync(path.join(root,'CoreClash.exe'),'abc')});\n test(()=>{fs.unlinkSync(path.join(data,'file-1.dat'));assert.equal(check(manifest,root,sha).status,'HOLD');fs.writeFileSync(path.join(data,'file-1.dat'),'hello-1')});\n test(()=>{fs.writeFileSync(path.join(data,'unexpected.tmp'),'x');assert.equal(check(manifest,root,sha).status,'HOLD');fs.unlinkSync(path.join(data,'unexpected.tmp'))});\n test(()=>assert.equal(files(root).some(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'),true));\n test(()=>assert.equal(files(root).some(x=>x.path==='Assembly-CSharp.dll'),false));\n test(()=>{fs.appendFileSync(dll,'tamper');assert.equal(check(manifest,root,sha).status,'HOLD');fs.writeFileSync(dll,'fresh-binary-dll')});\n test(()=>rejected(()=>check({...manifest,playerInventory:inventory.filter(x=>x.path!=='CoreClash_Data/Managed/Assembly-CSharp.dll')},root,sha)));\n test(()=>rejected(()=>check({...manifest,playerInventory:[...inventory,inventory[1]]},root,sha)));\n test(()=>rejected(()=>check({...manifest,playerInventory:inventory.map(x=>x.path==='CoreClash.exe'?{...x,bytes:0}:x)},root,sha)));\n test(()=>rejected(()=>check({...manifest,playerInventory:inventory.map(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'?{...x,bytes:0}:x)},root,sha)));\n test(()=>assert.equal(safePath('CoreClash_Data/Managed/Assembly-CSharp.dll'),true));\n test(()=>assert.equal(safePath('/abs.exe'),false));\n test(()=>assert.equal(safePath('C:\\\\evil'),false));\n console.log(JSON.stringify({suite:'CC001-W10-A72-binary-distribution',pass:count,fail:0}));\n}finally{fs.rmSync(temp,{recursive:true,force:true})}}\nif(require.main===module){try{if(process.argv[2]==='--self-test'){selfTest();}else{const a=argumentsMap(process.argv.slice(2)),m=JSON.parse(fs.readFileSync(a.manifest,'utf8')),r=check(m,a.player,a.sha);console.log(JSON.stringify(r,null,2));if(r.status!=='PASS_BINARY_INTEGRITY_ONLY')process.exitCode=2}}catch(e){console.error('A72 STOP: '+e.message);process.exitCode=1}}\nmodule.exports={check,files,safePath};\n";
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
test('genuine A72 verifier test fixture has exact remote Git blob identity',()=>{
 a.equal(gitBlobSha(Buffer.from(source)),A72_VERIFIER_BLOB);
 a.equal(A72_VERIFIER_BLOB,'b8181229bcf8a6fdb51a0d89be1c4f547fd9407f');
});
test('freeze pin is exact 3f, never moving PR207 HEAD',()=>{a.equal(FROZEN,'3f972cdbaea6289a7e33ce608f5d3256cfdab0a3')});
test('genuine CURRENT A72 verifier PASSES all 54 genuinely nested manifest paths',()=>fixture(f=>{
 const args=[f.paths.verifier,'--manifest='+f.paths.summary,'--player='+f.pc1,'--sha='+FROZEN];
 const child=cp.spawnSync(process.execPath,args,{encoding:'utf8'});
 a.equal(child.status,0,child.stderr);const report=JSON.parse(child.stdout);
 a.equal(report.status,'PASS_BINARY_INTEGRITY_ONLY');a.equal(report.expectedFiles,54);a.equal(report.actualFiles,54);
 a.deepEqual(report.failures,[]);
 const receipt=run(f.paths);
 a.equal(receipt.a72OriginalSourceEvidence.verifierGitBlob,A72_VERIFIER_BLOB);
 a.equal(receipt.pc1.status,'A72_LOCAL_PLAYER_CHECK_PASS_SCOPED');
 a.equal(receipt.pc2.status,'A72_LOCAL_PLAYER_CHECK_PASS_SCOPED');
 a.equal(receipt.isTwoPhysicalPCsProven,false);
 a.equal(receipt.qaDisposition,'PENDING_INDEPENDENT_A60_PHYSICAL_QA');
}));
test('genuine corrected A72 self-test independently covers nested Player paths',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a72-selftest-'));
 try {const file=path.join(dir,'v.cjs');fs.writeFileSync(file,source);
  const proc=cp.spawnSync(process.execPath,[file,'--self-test'],{encoding:'utf8'});
  a.equal(proc.status,0,proc.stderr);a.match(proc.stdout,/"pass":19/);
 }finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('W14 CLI reports only scoped local-folder integrity on corrected A72 code',()=>fixture(f=>{
 const cmd=[__filename.replace(/\.test\.cjs$/,'.cjs'),'--summary',f.paths.summary,'--session',f.paths.session,'--a72-verifier',f.paths.verifier,'--verifier-sha256',f.paths.verifierSha,'--pc1-player',f.pc1,'--pc2-player',f.pc2,'--out',f.paths.out];
 const res=cp.spawnSync(process.execPath,cmd,{encoding:'utf8'});
 a.equal(res.status,0,res.stderr);a.match(res.stdout,/A44_FROZEN_PLAYER_INTEGRITY_ONLY/);
 const receipt=JSON.parse(fs.readFileSync(f.paths.out,'utf8'));
 a.equal(receipt.isTwoPhysicalPCsProven,false);
 a.equal(receipt.isNetworkSynchronizationProven,false);
 a.equal(receipt.releaseApproval,'NO');
}));
test('reject newer #207 HEAD and stale original 173273',()=>fixture(f=>{
 for(const s of ['87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c','173273122c11cbf738e8b954e32506a6196fe8ec']){
 f.summary.candidateSHA=s;f.write();a.throws(()=>run(f.paths),/NOT_FROZEN_QA_SHA/);a.equal(fs.existsSync(f.paths.out),false);
 }
}));
test('reject old RC1, wrong A72 source root',()=>fixture(f=>{f.summary.rc1Base='1'.repeat(40);f.write();a.throws(()=>run(f.paths),/WRONG_PROTECTED_BASE/)}));
test('reject build that never passed native evidence',()=>fixture(f=>{f.summary.status='HOLD';f.write();a.throws(()=>run(f.paths),/A72_BUILD_NOT_ACCEPTED/)}));
test('refuse replaced or tampered A72 verifier',()=>fixture(f=>{fs.appendFileSync(f.paths.verifier,'\n// modified');a.throws(()=>run(f.paths),/A72_VERIFIER_SHA_MISMATCH/)}));
test('reject counterfeit A72 verifier even when attacker supplies matching SHA256',()=>fixture(f=>{
 fs.writeFileSync(f.paths.verifier,testDoubleSource);
 f.paths.verifierSha=sha(Buffer.from(testDoubleSource));
 a.throws(()=>run(f.paths),/A72_VERIFIER_UNTRUSTED_BLOB/);
 a.equal(fs.existsSync(f.paths.out),false);
}));
test('reject symlinked A72 summary before realpath resolution',()=>fixture(f=>{
 const link=path.join(f.root,'summary-link.json');
 try{fs.symlinkSync(f.paths.summary,link,'file')}catch(e){if(e.code==='EPERM'||e.code==='EACCES')return;throw e}
 f.paths.summary=link;
 a.throws(()=>run(f.paths),/INVALID_JSON_FILE/);
}));
test('reject symlinked A44 session before realpath resolution',()=>fixture(f=>{
 const link=path.join(f.root,'session-link.json');
 try{fs.symlinkSync(f.paths.session,link,'file')}catch(e){if(e.code==='EPERM'||e.code==='EACCES')return;throw e}
 f.paths.session=link;
 a.throws(()=>run(f.paths),/INVALID_JSON_FILE/);
}));
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
test('do not overwrite existing output file',()=>fixture(f=>{fs.writeFileSync(f.paths.out,'existing');a.throws(()=>run(f.paths),/OUTPUT_PATH_NOT_NEW/);a.equal(fs.readFileSync(f.paths.out,'utf8'),'existing')}));
test('CLI flags require every field and reject duplicates',()=>{
 a.throws(()=>flags(['--summary','abc']),/MISSING_/);
 a.throws(()=>flags(['--wat','abc']),/BAD_ARGUMENT/);
 a.throws(()=>flags(['--summary','abc','--summary','def']),/DUPLICATE_ARGUMENT/);
});
test('W14 HOLD on tampered actual Player never emits private paths or a fake receipt',()=>fixture(f=>{
 fs.appendFileSync(path.join(f.pc1,'CoreClash_Data/Managed/Assembly-CSharp.dll'),'MUTATED');
 a.throws(()=>run(f.paths),/A72_NATIVE_VERIFIER_FAILED/);
 a.equal(fs.existsSync(f.paths.out),false);
}));

test('W15 old A72 7b704 blob is refused regardless of operator SHA',()=>fixture(f=>{
 // On a trusted host a stale verifier is inadmissible even if its hash matches itself.
 const old=String.raw`'use strict'; // old A72 script is no longer approved`;
 fs.writeFileSync(f.paths.verifier,old);
 f.paths.verifierSha=sha(Buffer.from(old));
 a.throws(()=>run(f.paths),/A72_VERIFIER_UNTRUSTED_BLOB/);
 a.equal(fs.existsSync(f.paths.out),false);
}));

test('W15 previous 677100 A72 binary verifier is rejected even with genuine self-matching SHA256',()=>fixture(f=>{
 const old=source
   .replace(" ensure(expected.filter(x=>x.path==='CoreClash.exe'||x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll').every(x=>x.bytes>0),'Required Player EXE/DLL cannot have zero bytes');\n",'')
   .replace(" test(()=>rejected(()=>check({...manifest,playerInventory:inventory.map(x=>x.path==='CoreClash.exe'?{...x,bytes:0}:x)},root,sha)));\n",'')
   .replace(" test(()=>rejected(()=>check({...manifest,playerInventory:inventory.map(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'?{...x,bytes:0}:x)},root,sha)));\n",'');
 a.equal(gitBlobSha(Buffer.from(old)),'677100ff45e50c2fecb1d2b7fbc25851f4722db7');
 fs.writeFileSync(f.paths.verifier,old);
 f.paths.verifierSha=sha(Buffer.from(old));
 a.throws(()=>run(f.paths),/A72_VERIFIER_UNTRUSTED_BLOB/);
 a.equal(fs.existsSync(f.paths.out),false);
}));

test('W15 zero-byte player EXE and managed DLL inventory are both rejected before A72 invocation',()=>fixture(f=>{
 for(const target of ['CoreClash.exe','CoreClash_Data/Managed/Assembly-CSharp.dll']){
  const x=f.inventory.find(x=>x.path===target);
  const previous=x.bytes;x.bytes=0;f.write();
  a.throws(()=>run(f.paths),/EXE_OR_DLL_MISSING/);
  a.equal(fs.existsSync(f.paths.out),false);
  x.bytes=previous;
 }
}));
