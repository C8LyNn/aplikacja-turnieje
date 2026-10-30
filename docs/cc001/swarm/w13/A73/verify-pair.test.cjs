#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w13-a73-pair-'));
const ROOT='unity/cc001-r16/CoreClash-V149-Unity/';
function git(...args){const r=cp.spawnSync('git',args,{cwd:tmp,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function write(p,s){const out=path.join(tmp,p);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,s);}
function commit(m){git('add','.');git('commit','-m',m);return git('rev-parse','HEAD');}
let count=0;function test(name,fn){fn();console.log('PASS',++count,name);}
try{
 git('init','-b','main');git('config','user.email','a73-fixture@example.invalid');git('config','user.name','A73 Fixture');git('config','core.filemode','true');
 const network=ROOT+'Assets/CoreClash/Networking/NetworkGameSession.cs',ntest=ROOT+'Tests/NetworkSeatTests.cs';
 const view=ROOT+'Assets/CoreClash/Presentation/MatchView.cs',vtest=ROOT+'Tests/PresentationTests.cs';
 const protectedPath=ROOT+'Assets/CoreClash/Core/GameSimulation.cs';
 for(const p of [network,ntest,view,vtest,protectedPath])write(p,'original '+p+'\n');
 const rc=commit('initial sample');
 const FREEZE_REF='integration/cc001-r17-w11-qa-freeze-20261030';
 git('switch','-c',FREEZE_REF);write('docs/w11-freeze-identity.txt','frozen');const freeze=commit('freeze');
 const source=fs.readFileSync(path.join(__dirname,'verify-pair.cjs'),'utf8');
 const altered=source.replace(/const FREEZE='[0-9a-f]{40}';/,"const FREEZE='"+freeze+"';");
 const fixtureSource=path.join(tmp,'.git','test-gate.cjs');fs.writeFileSync(fixtureSource,altered);
 const {inspect,treeEntry,goodPath,diffRecords}=require(fixtureSource);
 git('switch','-c','feat/a41',freeze);write(network,'network fix\n');write(ntest,'network test\n');const sha41=commit('A41 source and test');
 git('switch','-c','feat/a83',freeze);write(view,'UI fix\n');write(vtest,'UI test\n');const sha83=commit('A83 source and test');
 const candidate=(owner,ref,sha,paths,tests)=>({owner,ref,sha,paths:Object.fromEntries(paths.map(p=>[p,{status:git('diff','--name-status',freeze,sha,'--',p).split('\t')[0],blob:git('rev-parse',ref+':'+p)}])),requiredTests:tests});
 const base={schemaVersion:1,freezeRef:FREEZE_REF,freezeSha:freeze,candidates:[candidate('A41','feat/a41',sha41,[network,ntest],[ntest]),candidate('A83','feat/a83',sha83,[view,vtest],[vtest])]};
 const clone=()=>structuredClone(base);
 test('real divergent branches merge cleanly and preserve all four source blobs',()=>{
  const v=inspect(base,tmp);assert.equal(v.verdict,'PASS_PAIRWISE_SOURCE_ONLY',JSON.stringify(v.issues));assert.equal(v.mergePreview,'TREE_CREATED');assert.equal(v.overlap.length,0);
  for(const c of base.candidates)for(const [p,obj] of Object.entries(c.paths))assert.equal(treeEntry(v.mergeTree,p,tmp).sha,obj.blob);
 });
 test('real CLI returns exit0 and source-only verdict',()=>{
  const fp=path.join(tmp,'.git','candidate.json');fs.writeFileSync(fp,JSON.stringify(base));const r=cp.spawnSync(process.execPath,[fixtureSource,'--manifest',fp],{cwd:tmp,encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/PASS_PAIRWISE_SOURCE_ONLY/);
 });
 test('HEAD drift holds',()=>{const m=clone();m.candidates[0].sha='a'.repeat(40);assert.equal(inspect(m,tmp).verdict,'HOLD');});
 test('wrong blob pin holds',()=>{const m=clone();m.candidates[1].paths[view].blob='c'.repeat(40);assert.equal(inspect(m,tmp).verdict,'HOLD');});
 test('undeclared changed path holds',()=>{const m=clone();delete m.candidates[0].paths[network];assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('UNDECLARED_PATH')));});
 test('missing changed regression test holds',()=>{const m=clone();m.candidates[0].requiredTests=[ROOT+'Tests/Unchanged.cs'];assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('TEST_NOT_CHANGED')));});
 test('overlapping owner path is not silently merged',()=>{
  git('switch','-c','feat/overlap',freeze);write(network,'other network fix\n');write(vtest,'other network regression\n');const sha=commit('overlap');
  const m=clone();m.candidates[1]=candidate('A83','feat/overlap',sha,[network,vtest],[vtest]);assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('CROSS_OWNER_PATH_COLLISION')));
 });
 test('protected core mutation is rejected even when explicitly declared',()=>{
  git('switch','-c','feat/core',freeze);write(protectedPath,'unsafe core edit');write(vtest,'core regression test');const sha=commit('core mutation');
  const m=clone();m.candidates[1]=candidate('A83','feat/core',sha,[protectedPath,vtest],[vtest]);assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('PROTECTED_PATH')));
 });
 test('non-descendant branch is blocked',()=>{
  git('switch','-c','feat/oldroot',rc);write(view,'oldroot UI');write(vtest,'oldroot test');const sha=commit('off frozen history');
  const m=clone();m.candidates[1]=candidate('A83','feat/oldroot',sha,[view,vtest],[vtest]);assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('NOT_FROZEN_DESCENDANT')));
 });
 test('executable Git tree mode rejected with correct blob SHA',()=>{
  git('switch','-c','feat/exe',freeze);write(view,'UI executable');write(vtest,'exe case');fs.chmodSync(path.join(tmp,view),0o755);const sha=commit('executable mode');
  const m=clone();m.candidates[1]=candidate('A83','feat/exe',sha,[view,vtest],[vtest]);assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('UNSAFE_OBJECT_MODE')));
 });
 test('new Unity C# missing companion meta rejected',()=>{
  git('switch','-c','feat/newasset',freeze);const added=ROOT+'Assets/CoreClash/Presentation/Added.cs';write(added,'class Added {}');write(vtest,'new asset test');const sha=commit('new asset without meta');
  const m=clone();m.candidates[1]={owner:'A83',ref:'feat/newasset',sha,paths:{[added]:{status:'A',blob:git('rev-parse','feat/newasset:'+added)},[vtest]:{status:'M',blob:git('rev-parse','feat/newasset:'+vtest)}},requiredTests:[vtest]};assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('MISSING_ASSET_META')));
 });
 test('new Unity C# with paired valid .meta is accepted in real Git merge preview',()=>{
  git('switch','-c','feat/pairmeta',freeze);const added=ROOT+'Assets/CoreClash/Presentation/AddedValid.cs',meta=added+'.meta';
  write(added,'class AddedValid {}');write(meta,'fileFormatVersion: 2\nguid: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n');write(vtest,'added valid test');const sha=commit('valid new Unity asset meta');
  const m=clone();m.candidates[1]=candidate('A83','feat/pairmeta',sha,[added,meta,vtest],[vtest]);
  const v=inspect(m,tmp);assert.equal(v.verdict,'PASS_PAIRWISE_SOURCE_ONLY',JSON.stringify(v.issues));
 });
 test('malformed .cs.meta is rejected despite correct SHA pins',()=>{
  git('switch','-c','feat/badmeta',freeze);const added=ROOT+'Assets/CoreClash/Presentation/BadMeta.cs',meta=added+'.meta';
  write(added,'class BadMeta {}');write(meta,'fileFormatVersion: 2\nguid: INVALID\n');write(vtest,'bad meta test');const sha=commit('bad meta');
  const m=clone();m.candidates[1]=candidate('A83','feat/badmeta',sha,[added,meta,vtest],[vtest]);
  assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('INVALID_UNITY_META')));
 });
 test('new .cs.meta without newly added C# is rejected',()=>{
  git('switch','-c','feat/orphanmeta',freeze);const meta=ROOT+'Assets/CoreClash/Presentation/Orphan.cs.meta';
  write(meta,'fileFormatVersion: 2\nguid: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n');write(vtest,'orphan test');const sha=commit('orphan meta');
  const m=clone();m.candidates[1]=candidate('A83','feat/orphanmeta',sha,[meta,vtest],[vtest]);
  assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('ORPHAN_CS_META')));
 });
 test('duplicated new GUID across both owner branches is rejected',()=>{
  const left=ROOT+'Assets/CoreClash/Networking/AddonA.cs',lm=left+'.meta';
  git('switch','-c','feat/guida',freeze);write(left,'class AddonA {}');write(lm,'fileFormatVersion: 2\nguid: cccccccccccccccccccccccccccccccc\n');write(ntest,'guid test a');const ha=commit('first guid');
  const right=ROOT+'Assets/CoreClash/Presentation/AddonB.cs',rm=right+'.meta';
  git('switch','-c','feat/guidb',freeze);write(right,'class AddonB {}');write(rm,'fileFormatVersion: 2\nguid: cccccccccccccccccccccccccccccccc\n');write(vtest,'guid test b');const hb=commit('duplicate guid');
  const m=clone();m.candidates[0]=candidate('A41','feat/guida',ha,[left,lm,ntest],[ntest]);m.candidates[1]=candidate('A83','feat/guidb',hb,[right,rm,vtest],[vtest]);
  assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('DUPLICATE_NEW_GUID')));
 });
 test('re-pinning old A83 commit while branch moves is HOLD',()=>{
  const m=clone();m.candidates[1].sha='69d20ca863aa7f195a9b0a506032025a477ba68b';
  assert.ok(inspect(m,tmp).issues.some(x=>x.startsWith('REF_DRIFT')));
 });
 test('invalid pin path traversal refused',()=>{const m=clone();m.candidates[0].paths['../escape']={status:'A',blob:'0'.repeat(40)};assert.throws(()=>inspect(m,tmp));});
 test('freeze SHA mismatch refused before any merge preview',()=>{const m=clone();m.freezeSha='0'.repeat(40);assert.throws(()=>inspect(m,tmp));});
 test('invalid NUL diff detected and path safety rejects traversal',()=>{assert.throws(()=>diffRecords('M\0a\0X\0'));assert.equal(goodPath('../bad'),false);assert.equal(goodPath('a\\b'),false);});
 test('candidate and protected branch refs unaffected by preview',()=>{assert.equal(git('rev-parse',FREEZE_REF),freeze);assert.equal(git('rev-parse','feat/a41'),sha41);assert.equal(git('rev-parse','feat/a83'),sha83);assert.equal(git('rev-parse','main'),rc);});
 console.log('TOTAL',count,'PASS');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
