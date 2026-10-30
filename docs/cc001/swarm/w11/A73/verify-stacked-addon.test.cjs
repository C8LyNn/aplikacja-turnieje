#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const original=fs.readFileSync(path.join(__dirname,'verify-stacked-addon.cjs'),'utf8');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w11-a73-'));
let successes=0;function run(...args){const r=cp.spawnSync('git',args,{cwd:dir,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function put(p,v){const f=path.join(dir,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,v);}
function commit(m){run('add','.');run('commit','-m',m);return run('rev-parse','HEAD');}
function test(n,f){f();successes++;console.log('PASS',successes,n);}
const root='unity/cc001-r16/CoreClash-V149-Unity/';
try{
 run('init','-b','main');run('config','user.name','A73 Fixture');run('config','user.email','fixture@example.invalid');
 put(root+'Assets/CoreClash/Presentation/DetailsView.cs','old');put(root+'Assets/CoreClash/Networking/NgoWireProtocol.cs','protected');
 put(root+'Tests/Program.cs','old');put('docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json','frozen');
 const rc=commit('frozen base');
 const replacement=original.replace(/const RC1='[0-9a-f]{40}';/,"const RC1='"+rc+"';");
 const copy=path.join(dir,'.git','stacked-gate.cjs');fs.writeFileSync(copy,replacement);
 const {inspect,parseNames,safe}=require(copy);
 run('switch','-c','a70',rc);put(root+'Assets/CoreClash/Presentation/DetailsView.cs','A70 preserved');const base=commit('A70 candidate');
 run('switch','-c','a30',base);
 const changed=root+'Assets/CoreClash/Presentation/RemoteBallSmoother.cs';
 const meta=changed+'.meta';const reg=root+'Tests/Program.cs';
 put(changed,'new');put(meta,'fileFormatVersion: 2\nguid: 0123456789abcdef0123456789abcdef\n');put(reg,'registered');const addon=commit('A30 addon');
 const blob=p=>run('rev-parse','a30:'+p),retained=root+'Assets/CoreClash/Presentation/DetailsView.cs';
 const manifest={schemaVersion:2,immutableRc1:rc,baseRef:'a70',baseSha:base,addonRef:'a30',addonSha:addon,expectedChanges:{[changed]:{status:'A',blob:blob(changed)},[meta]:{status:'A',blob:blob(meta)},[reg]:{status:'M',blob:blob(reg)}},retainedBlobs:{[retained]:run('rev-parse','a70:'+retained),[root+'Assets/CoreClash/Networking/NgoWireProtocol.cs']:run('rev-parse','a70:'+root+'Assets/CoreClash/Networking/NgoWireProtocol.cs')}};
 const clone=()=>JSON.parse(JSON.stringify(manifest));
 test('pinned stacked addon accepted',()=>{const x=inspect(manifest,dir);assert.equal(x.verdict,'PASS_SOURCE_SCOPE_ONLY');assert.equal(x.counts.matchedBlobs,3);});
 test('wrong addon SHA is HOLD',()=>{const x=clone();x.addonSha='a'.repeat(40);assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('wrong base SHA is HOLD',()=>{const x=clone();x.baseSha='b'.repeat(40);assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('tampered blob pin is HOLD',()=>{const x=clone();x.expectedChanges[changed].blob='c'.repeat(40);assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('unlisted added path is HOLD',()=>{const x=clone();delete x.expectedChanges[meta];assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('status substitution M vs A is HOLD',()=>{const x=clone();x.expectedChanges[changed].status='M';assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('added meta requires added C# companion',()=>{const x=clone();delete x.expectedChanges[changed];assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('retention mismatch is HOLD',()=>{const x=clone();x.retainedBlobs[retained]='d'.repeat(40);assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('unmatched base ancestry HOLD',()=>{const x=clone();x.baseRef='main';x.baseSha=rc;assert.equal(inspect(x,dir).verdict,'HOLD');});
 test('reject unsafe traversal',()=>{const x=clone();x.expectedChanges['../unsafe']={status:'A',blob:'a'.repeat(40)};assert.throws(()=>inspect(x,dir));});
 test('reject protected protocol change',()=>{
  run('switch','-c','bad',base);put(root+'Assets/CoreClash/Networking/NgoWireProtocol.cs','wrong');const bad=commit('modify protocol');
  const x={schemaVersion:2,immutableRc1:rc,baseRef:'a70',baseSha:base,addonRef:'bad',addonSha:bad,expectedChanges:{[root+'Assets/CoreClash/Networking/NgoWireProtocol.cs']:{status:'M',blob:run('rev-parse','bad:'+root+'Assets/CoreClash/Networking/NgoWireProtocol.cs')}},retainedBlobs:{[retained]:run('rev-parse','a70:'+retained)}};assert.equal(inspect(x,dir).verdict,'HOLD');
 });
 test('git NUL status parser and safe path input',()=>{assert.deepEqual(parseNames('M\0x\0A\0y\0'),[{status:'M',path:'x'},{status:'A',path:'y'}]);assert.equal(safe('../danger'),false);assert.equal(safe('a\\b'),false);});
 test('all refs were not mutated by checker',()=>{assert.equal(run('rev-parse','main'),rc);assert.equal(run('rev-parse','a70'),base);assert.equal(run('rev-parse','a30'),addon);});
 console.log('TOTAL',successes,'PASS');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
