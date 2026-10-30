'use strict';
// A72: standalone fail-closed exact Windows Player distribution gate. No state mutation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const SHA=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
const validSha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const ensure=(v,msg)=>{if(!v)throw Error(msg)};
const safePath=x=>typeof x==='string'&&x.length>0&&!x.startsWith('/')&&!x.includes('\\')&&!x.includes(':')&&x.split('/').every(x=>x&&x!=='.'&&x!=='..');
function files(root,playerRoot=root){let out=[];for(const x of fs.readdirSync(root,{withFileTypes:true})){const f=path.join(root,x.name),s=fs.lstatSync(f);ensure(!s.isSymbolicLink(),'Symlink forbidden: '+f);if(s.isDirectory())out=out.concat(files(f,playerRoot));else{ensure(s.isFile(),'Not regular file');out.push({path:path.relative(playerRoot,f).split(path.sep).join('/'),bytes:s.size,sha256:SHA(fs.readFileSync(f))})}}return out;}
function check(manifest,player,sha){
 ensure(validSha(sha),'Expected exact candidate SHA required');
 ensure(manifest&&manifest.schema==='CC001-W10-A72-WINDOWS-1','Wrong W10 build manifest');
 ensure(manifest.candidateSHA===sha,'Candidate SHA mismatch');
 ensure(manifest.status==='PASS_BUILD_EVIDENCE_ONLY','Source build evidence not passed: '+manifest.status);
 ensure(fs.statSync(player).isDirectory(),'Player directory not found');
 const expected=manifest.playerInventory;ensure(Array.isArray(expected)&&expected.length>50,'Missing full Player inventory');
 ensure(expected.some(x=>x.path==='CoreClash.exe')&&expected.some(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'),'Required original EXE and nested Assembly-CSharp.dll missing from manifest');
 const seen=new Set();for(const x of expected){ensure(safePath(x.path)&&!seen.has(x.path),'Invalid/duplicate Player path');seen.add(x.path);ensure(x.bytes>=0&&/^[A-Fa-f0-9]{64}$/.test(x.sha256),'Bad inventory entry')}
 const current=files(player);const actual=new Map(current.map(x=>[x.path,x]));let failures=[];
 for(const x of expected){const y=actual.get(x.path);if(!y)failures.push({path:x.path,reason:'MISSING'});else if(y.bytes!==x.bytes||y.sha256!==x.sha256.toUpperCase())failures.push({path:x.path,reason:'SHA256_OR_SIZE_MISMATCH'})}
 for(const x of current){if(!seen.has(x.path))failures.push({path:x.path,reason:'EXTRA_UNMANIFESTED_FILE'})}
 return {status:failures.length?'HOLD':'PASS_BINARY_INTEGRITY_ONLY',candidateSHA:sha,expectedFiles:expected.length,actualFiles:current.length,failures,scope:'Standalone local Player bytes only, NOT multiplayer/G3 or A60 independent QA'};
}
function argumentsMap(args){let obj={};for(const x of args){const m=/^--([a-z-]+)=(.*)$/.exec(x);ensure(m,'Use --name=value');obj[m[1]]=m[2]}return obj}
function selfTest(){const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'cc001w10verify-'));let count=0;const test=fn=>{fn();count++};const rejected=fn=>{assert.throws(fn)};
try{const root=path.join(temp,'player');fs.mkdirSync(root);fs.writeFileSync(path.join(root,'CoreClash.exe'),'abc');const data=path.join(root,'CoreClash_Data');fs.mkdirSync(data);for(let i=0;i<50;i++)fs.writeFileSync(path.join(data,`file-${i}.dat`),`hello-${i}`);const managed=path.join(data,'Managed');fs.mkdirSync(managed);fs.writeFileSync(path.join(managed,'Assembly-CSharp.dll'),'original-compiled-assembly');const sha='1'.repeat(40);const manifest={schema:'CC001-W10-A72-WINDOWS-1',candidateSHA:sha,status:'PASS_BUILD_EVIDENCE_ONLY',playerInventory:files(root)};
 test(()=>assert.equal(check(manifest,root,sha).status,'PASS_BINARY_INTEGRITY_ONLY'));
 test(()=>assert.equal(files(root).some(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'),true));
 test(()=>assert.equal(files(root).some(x=>x.path==='Assembly-CSharp.dll'),false));
 test(()=>assert.equal(files(root).some(x=>x.path==='CoreClash_Data/file-1.dat'),true));
 test(()=>rejected(()=>check({...manifest,playerInventory:manifest.playerInventory.map(x=>({...x,path:x.path.split('/').at(-1)}))},root,sha)));
 test(()=>{fs.appendFileSync(path.join(managed,'Assembly-CSharp.dll'),'tampered');assert.equal(check(manifest,root,sha).status,'HOLD');fs.writeFileSync(path.join(managed,'Assembly-CSharp.dll'),'original-compiled-assembly')});
 test(()=>rejected(()=>check({...manifest,playerInventory:manifest.playerInventory.filter(x=>x.path!=='CoreClash_Data/Managed/Assembly-CSharp.dll')},root,sha)));
 test(()=>rejected(()=>check(manifest,root,'a'.repeat(40))));
 test(()=>rejected(()=>check({...manifest,status:'HOLD'},root,sha)));
 test(()=>rejected(()=>check({...manifest,playerInventory:[]},root,sha)));
 test(()=>rejected(()=>check({...manifest,playerInventory:[...manifest.playerInventory,{path:'../bad',bytes:1,sha256:'0'.repeat(64)}]},root,sha)));
 test(()=>rejected(()=>check({...manifest,playerInventory:[...manifest.playerInventory,manifest.playerInventory[0]]},root,sha)));
 test(()=>{fs.appendFileSync(path.join(root,'CoreClash.exe'),'bad');assert.equal(check(manifest,root,sha).status,'HOLD');fs.writeFileSync(path.join(root,'CoreClash.exe'),'abc')});
 test(()=>{fs.unlinkSync(path.join(data,'file-1.dat'));assert.equal(check(manifest,root,sha).status,'HOLD');fs.writeFileSync(path.join(data,'file-1.dat'),'hello-1')});
 test(()=>{fs.writeFileSync(path.join(data,'unexpected.tmp'),'x');assert.equal(check(manifest,root,sha).status,'HOLD');fs.unlinkSync(path.join(data,'unexpected.tmp'))});
 test(()=>assert.equal(safePath('CoreClash_Data/Managed/Assembly-CSharp.dll'),true));
 test(()=>assert.equal(safePath('/abs.exe'),false));
 test(()=>assert.equal(safePath('C:\\evil'),false));
 console.log(JSON.stringify({suite:'CC001-W10-A72-binary-distribution',pass:count,fail:0}));
}finally{fs.rmSync(temp,{recursive:true,force:true})}}
if(require.main===module){try{if(process.argv[2]==='--self-test'){selfTest();}else{const a=argumentsMap(process.argv.slice(2)),m=JSON.parse(fs.readFileSync(a.manifest,'utf8')),r=check(m,a.player,a.sha);console.log(JSON.stringify(r,null,2));if(r.status!=='PASS_BINARY_INTEGRITY_ONLY')process.exitCode=2}}catch(e){console.error('A72 STOP: '+e.message);process.exitCode=1}}
module.exports={check,files,safePath};
