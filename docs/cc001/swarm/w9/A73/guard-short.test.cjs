#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const here=__dirname,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a73-w9-'));
function git(...a){const r=cp.spawnSync('git',a,{cwd:tmp,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function put(p,s){p=path.join(tmp,p);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);}
function commit(m){git('add','.');git('commit','-m',m);return git('rev-parse','HEAD');}
const root='unity/cc001-r16/CoreClash-V149-Unity/';
try{
git('init','-b','main');git('config','user.name','Fixture');git('config','user.email','fixture@invalid.example');
put(root+'Tests/NetworkSeatTests.cs','old');put(root+'Tests/PresentationTests.cs','old');put(root+'Assets/CoreClash/Networking/NetworkGameSession.cs','old');put(root+'Assets/CoreClash/Presentation/MatchView.cs','old');put(root+'Tests/Program.cs','safe');
const base=commit('base');
const src=fs.readFileSync(path.join(here,'guard-short.cjs'),'utf8');
const copy=path.join(tmp,'.git','test-guard.cjs');fs.writeFileSync(copy,src.replace("const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';","const RC1='"+base+"';"));
const {verify}=require(copy);
const originalCwd=process.cwd();process.chdir(tmp);
git('switch','-c','net',base);put(root+'Assets/CoreClash/Networking/NetworkGameSession.cs','new');put(root+'Tests/NetworkSeatTests.cs','new');const a=commit('network');
git('switch','-c','ui',base);put(root+'Assets/CoreClash/Presentation/MatchView.cs','new');put(root+'Tests/PresentationTests.cs','new');const b=commit('ui');
function pins(ref,ps){return Object.fromEntries(ps.map(p=>[p,git('rev-parse',ref+':'+p)]));}
const m={schemaVersion:1,baseSha:base,candidates:[{owner:'A31',ref:'net',expectedSha:a,allowedPaths:[root+'Assets/CoreClash/Networking/NetworkGameSession.cs',root+'Tests/NetworkSeatTests.cs'],requiredTests:[root+'Tests/NetworkSeatTests.cs'],expectedBlobs:pins('net',[root+'Assets/CoreClash/Networking/NetworkGameSession.cs',root+'Tests/NetworkSeatTests.cs'])},{owner:'A20',ref:'ui',expectedSha:b,allowedPaths:[root+'Assets/CoreClash/Presentation/MatchView.cs',root+'Tests/PresentationTests.cs'],requiredTests:[root+'Tests/PresentationTests.cs'],expectedBlobs:pins('ui',[root+'Assets/CoreClash/Presentation/MatchView.cs',root+'Tests/PresentationTests.cs'])}]};
function test(name,fn){fn();console.log('PASS '+name);}
const pre=[git('rev-parse','main'),git('rev-parse','net'),git('rev-parse','ui')];
test('disjoint refs merge-tree',()=>{const r=verify(m);assert.equal(r.verdict,'PASS_SOURCE_SCOPE_ONLY');assert.equal(r.pairwiseMergeTree[0].exitCode,0);});
test('head pinning',()=>{const v=structuredClone(m);v.candidates[0].expectedSha=b;assert.equal(verify(v).verdict,'HOLD');});
test('allowlist',()=>{const v=structuredClone(m);v.candidates[0].allowedPaths.shift();assert.equal(verify(v).verdict,'HOLD');});
test('required regression tests',()=>{const v=structuredClone(m);v.candidates[0].requiredTests=[root+'Tests/PresentationTests.cs'];assert.equal(verify(v).verdict,'HOLD');});
test('overlap',()=>{const v=structuredClone(m);v.candidates[1]={...v.candidates[0]};assert.equal(verify(v).verdict,'HOLD');});
git('switch','-c','bad',base);put(root+'Tests/Program.cs','unsafe');put(root+'Tests/NetworkSeatTests.cs','new');const bad=commit('bad');
test('protected path',()=>{const v=structuredClone(m);v.candidates=[{owner:'A31',ref:'bad',expectedSha:bad,allowedPaths:[root+'Tests/Program.cs',root+'Tests/NetworkSeatTests.cs'],requiredTests:[root+'Tests/NetworkSeatTests.cs'],expectedBlobs:pins('bad',[root+'Tests/Program.cs',root+'Tests/NetworkSeatTests.cs'])}];assert.equal(verify(v).verdict,'HOLD');});
test('wrong blob pin rejected',()=>{const v=structuredClone(m);v.candidates[0].expectedBlobs[root+'Tests/NetworkSeatTests.cs']='f'.repeat(40);assert.equal(verify(v).verdict,'HOLD');});
test('missing blob pin rejected',()=>{const v=structuredClone(m);delete v.candidates[0].expectedBlobs[root+'Tests/NetworkSeatTests.cs'];assert.equal(verify(v).verdict,'HOLD');});
test('extra blob pin rejected',()=>{const v=structuredClone(m);v.candidates[0].expectedBlobs[root+'Tests/Program.cs']=git('rev-parse','main:'+root+'Tests/Program.cs');assert.equal(verify(v).verdict,'HOLD');});
test('duplicate owner rejected',()=>{const v=structuredClone(m);v.candidates[1].owner=v.candidates[0].owner;assert.equal(verify(v).verdict,'HOLD');});
test('original refs preserved',()=>assert.deepEqual(pre,[git('rev-parse','main'),git('rev-parse','net'),git('rev-parse','ui')]));
}finally{process.chdir(here);fs.rmSync(tmp,{recursive:true,force:true});}
