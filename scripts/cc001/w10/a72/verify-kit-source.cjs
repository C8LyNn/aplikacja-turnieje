'use strict';
// A72 CC-001 W11: standalone input-integrity gate for the existing operator kit.
// This certifies only local kit bytes; never Unity, binary, PC1-PC2 or G3/G4.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const FROZEN='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const REQUIRED=Object.freeze(['build-w10-rc1.cjs','w11-source-readiness.cjs','Start-W10-WindowsBuild.ps1','verify-w10-player.cjs','URUCHOM_W11_PR207.cmd','README_W11_PR207.md']);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
function verify(root,manifest){
 if(!manifest||manifest.project!=='CC-001'||manifest.candidateSHA!==FROZEN)throw Error('WRONG_KIT_CANDIDATE');
 if(!manifest.files||JSON.stringify(Object.keys(manifest.files).sort())!==JSON.stringify([...REQUIRED].sort()))throw Error('WRONG_KIT_FILE_LIST');
 for(const name of REQUIRED){
  const spec=manifest.files[name];
  if(!spec||!Number.isSafeInteger(spec.bytes)||spec.bytes<=0||!/^[A-F0-9]{64}$/.test(spec.SHA256||''))throw Error('INVALID_KIT_MANIFEST '+name);
  const file=path.join(root,name);
  let st;try{st=fs.lstatSync(file)}catch{throw Error('MISSING_KIT_FILE '+name)}
  if(!st.isFile()||st.isSymbolicLink())throw Error('UNSAFE_KIT_FILE '+name);
  const actual=fs.readFileSync(file);
  if(actual.length!==spec.bytes||digest(actual)!==spec.SHA256)throw Error('KIT_BYTES_MISMATCH '+name);
 }
 return {status:'PASS_KIT_BYTES_ONLY',candidateSHA:FROZEN,verified:REQUIRED.length};
}
function selfTest(){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a72-kit-'));
 const data=Object.fromEntries(REQUIRED.map(name=>[name,Buffer.from('unit:'+name)]));
 const spec=Object.fromEntries(REQUIRED.map(name=>[name,{bytes:data[name].length,SHA256:digest(data[name])}]));
 const manifest={project:'CC-001',candidateSHA:FROZEN,files:spec};
 let passed=0;const check=fn=>{fn();passed++};
 try{
  for(const name of REQUIRED)fs.writeFileSync(path.join(folder,name),data[name]);
  check(()=>assert.equal(verify(folder,manifest).verified,6));
  check(()=>assert.throws(()=>verify(folder,{...manifest,candidateSHA:'173273122c11cbf738e8b954e32506a6196fe8ec'}),/WRONG_KIT_CANDIDATE/));
  check(()=>assert.throws(()=>verify(folder,{...manifest,project:'OTHER'}),/WRONG_KIT_CANDIDATE/));
  check(()=>assert.throws(()=>verify(folder,{...manifest,files:{}}),/WRONG_KIT_FILE_LIST/));
  check(()=>assert.throws(()=>verify(folder,{...manifest,files:{...spec,rogue:{bytes:1,SHA256:digest('x')}}}),/WRONG_KIT_FILE_LIST/));
  check(()=>assert.throws(()=>verify(folder,{...manifest,files:{...spec,[REQUIRED[0]]:{bytes:-1,SHA256:'broken'}}}),/INVALID_KIT_MANIFEST/));
  fs.appendFileSync(path.join(folder,REQUIRED[0]),'tampered');
  check(()=>assert.throws(()=>verify(folder,manifest),/KIT_BYTES_MISMATCH/));
  fs.writeFileSync(path.join(folder,REQUIRED[0]),data[REQUIRED[0]]);
  fs.unlinkSync(path.join(folder,REQUIRED[1]));
  check(()=>assert.throws(()=>verify(folder,manifest),/MISSING_KIT_FILE/));
  fs.symlinkSync(path.join(folder,REQUIRED[0]),path.join(folder,REQUIRED[1]));
  check(()=>assert.throws(()=>verify(folder,manifest),/UNSAFE_KIT_FILE/));
  fs.unlinkSync(path.join(folder,REQUIRED[1]));
  fs.writeFileSync(path.join(folder,REQUIRED[1]),data[REQUIRED[1]]);
  check(()=>assert.equal(verify(folder,manifest).status,'PASS_KIT_BYTES_ONLY'));
  console.log(JSON.stringify({suite:'A72-W11-operator-kit-integrity',passed,failed:0}));
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
}
if(require.main===module){try{
 const arg=process.argv.slice(2);
 if(arg.length===1&&arg[0]==='--self-test')selfTest();
 else if(arg.length===1&&arg[0]==='--check'){
  const root=__dirname,raw=fs.readFileSync(path.join(root,'FILE_SHA256.json'),'utf8');
  console.log(JSON.stringify(verify(root,JSON.parse(raw))));
 }else throw Error('Use --self-test or --check');
}catch(e){console.error('A72 KIT HOLD: '+e.message);process.exitCode=2}}
module.exports={verify,REQUIRED,FROZEN};
