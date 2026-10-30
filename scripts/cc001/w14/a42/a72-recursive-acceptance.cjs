'use strict';
// A42 independent A72 verifier acceptance probe; tests A72 owner's unmodified CLI.
// Generated Player fixtures are synthetic: NO Unity/Windows/PC1-PC2 game QA is claimed.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const writeFile=(root,relative,data)=>{const full=path.join(root,...relative.split('/'));fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,data)};
function fixture(root){
 const names=['CoreClash.exe','CoreClash_Data/Managed/Assembly-CSharp.dll','CoreClash_Data/Managed/UnityEngine.CoreModule.dll',
  ...Array.from({length:52},(_,i)=>`CoreClash_Data/StreamingAssets/Maps/world-${i.toString().padStart(2,'0')}.bytes`)];
 const inventory=[];
 for(const name of names){const data=Buffer.from(`A42-CANONICAL-W14-${name}`, 'utf8');writeFile(root,name,data);inventory.push({path:name,bytes:data.length,sha256:sha256(data)})}
 return {schema:'CC001-W10-A72-WINDOWS-1',status:'PASS_BUILD_EVIDENCE_ONLY',candidateSHA:FREEZE,playerInventory:inventory};
}
function exercise(verifier,expectedBlob){
 if(typeof verifier!=='string'||!path.isAbsolute(verifier))throw Error('VERIFIER_ABSOLUTE_PATH_REQUIRED');
 const raw=fs.readFileSync(verifier);
 const blob=gitBlob(raw);
 if(!/^[a-f0-9]{40}$/.test(expectedBlob||'')||blob!==expectedBlob)throw Error('A72_VERIFIER_GIT_BLOB_NOT_PINNED');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-a42-a72-'));const root=path.join(tmp,'Player'),manifestFile=path.join(tmp,'manifest.json');
 try{
  fs.mkdirSync(root);const manifest=fixture(root);fs.writeFileSync(manifestFile,JSON.stringify(manifest));
  const run=()=>{const p=cp.spawnSync(process.execPath,[verifier,'--manifest='+manifestFile,'--player='+root,'--sha='+FREEZE],{encoding:'utf8',maxBuffer:2*1024*1024,timeout:30000});let data=null;try{data=JSON.parse(p.stdout)}catch{}return {exit:p.status,signal:p.signal,report:data};};
  const checks=[];
  const check=(id,condition,observed)=>checks.push({id,pass:Boolean(condition),observed});
  let r=run();check('NESTED_CANONICAL_55FILES',r.exit===0&&r.report?.status==='PASS_BINARY_INTEGRITY_ONLY'&&r.report?.expectedFiles===55&&r.report?.actualFiles===55,{exit:r.exit,status:r.report?.status,failures:r.report?.failures?.length??null});
  const dll=path.join(root,'CoreClash_Data','Managed','Assembly-CSharp.dll');const original=fs.readFileSync(dll);
  fs.appendFileSync(dll,'tamper');r=run();check('NESTED_DLL_TAMPER_HOLD',r.exit===2&&r.report?.status==='HOLD'&&r.report?.failures?.some(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'),{exit:r.exit,status:r.report?.status});fs.writeFileSync(dll,original);
  fs.unlinkSync(dll);r=run();check('MISSING_NESTED_DLL_HOLD',r.exit===2&&r.report?.status==='HOLD',{exit:r.exit,status:r.report?.status});fs.writeFileSync(dll,original);
  writeFile(root,'CoreClash_Data/Managed/unexpected.dll','untracked');r=run();check('EXTRA_NESTED_DLL_HOLD',r.exit===2&&r.report?.status==='HOLD',{exit:r.exit,status:r.report?.status});fs.unlinkSync(path.join(root,'CoreClash_Data','Managed','unexpected.dll'));
  const wrong=cp.spawnSync(process.execPath,[verifier,'--manifest='+manifestFile,'--player='+root,'--sha='+'0'.repeat(40)],{encoding:'utf8',timeout:30000});check('SOURCE_PIN_MISMATCH_STOP',wrong.status!==0,{exit:wrong.status});
  return {schema:'CC001-W14-A42-A72-VERIFIER-CONTRACT-1',verifierBlob:blob,sourceSha:FREEZE,verdict:checks.every(x=>x.pass)?'A72_VERIFIER_FIXTURE_CONTRACT_ACCEPTED':'A72_VERIFIER_CONTRACT_HOLD',checks,
   syntheticOnly:true,nativeWindowsPlayer:'NOT_TESTED',dotnet9:'NOT_TESTED',physicalTwoPC:'NOT_TESTED',G3:'NOT_ATTESTED',release:'STOP'};
 } finally{fs.rmSync(tmp,{recursive:true,force:true})}
}
function argsMap(args){const o={};for(const a of args){const m=/^--(verifier|sha|out)=(.+)$/.exec(a);if(!m||o[m[1]])throw Error('INVALID_ARGUMENT');o[m[1]]=m[2]}if(!o.verifier||!o.sha)throw Error('MISSING_REQUIRED_ARGUMENT');return o}
function main(argv){const a=argsMap(argv),r=exercise(a.verifier,a.sha),output=JSON.stringify(r,null,2)+'\n';if(a.out)fs.writeFileSync(a.out,output,{flag:'wx'});else process.stdout.write(output);return r.verdict==='A72_VERIFIER_FIXTURE_CONTRACT_ACCEPTED'?0:2}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2))}catch(e){console.error('A42_W14_STOP '+e.message);process.exitCode=3}}
module.exports={FREEZE,gitBlob,fixture,exercise,argsMap,main};
