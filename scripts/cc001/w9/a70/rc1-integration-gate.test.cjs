#!/usr/bin/env node
'use strict';
/* Self-contained synthetic Git integration tests: no network, Unity, writes to RC1. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {evaluate,SCHEMA,PINNED_RC1,validGitPath}=require('./rc1-integration-gate.cjs');
const R='unity/cc001-r16/CoreClash-V149-Unity/';
function git(repo,...cmd){const p=cp.spawnSync('git',['-C',repo,...cmd],{encoding:'utf8'});if(p.status!==0)throw Error(cmd.join(' ')+': '+p.stderr);return p.stdout.trim();}
function write(repo,p,s){const dest=path.join(repo,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,s);}
function commit(repo,label){git(repo,'add','-A');git(repo,'commit','-m',label);return git(repo,'rev-parse','HEAD');}
function manifest(base,changed){return {schema:SCHEMA,baseSha:base,changes:changed.map(p=>({path:p,owner:'A31',blobSha:git(dir,'rev-parse','HEAD:'+p)}))};}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a70-w9-'));
let successes=0;
function test(label,fn){fn();successes++;console.log('PASS '+label);}
try{
  git(dir,'init','-q');git(dir,'config','user.email','tests@invalid.local');git(dir,'config','user.name','A70 Test');
  const one=R+'Assets/CoreClash/Networking/NetworkGameSession.cs';
  const two=R+'Assets/CoreClash/Presentation/MatchView.cs';
  const protectedCode=R+'Assets/CoreClash/Networking/NgoWireProtocol.cs';
  write(dir,one,'namespace A { class B {} }\n');write(dir,two,'namespace A { class C {} }\n');
  write(dir,protectedCode,'// PROTECTED PROTOCOL 149\n');
  const base=commit(dir,'synthetic RC1');
  write(dir,one,'namespace A { class B { public int Count; } }\n');
  const ok=commit(dir,'approved network source');
  const m=manifest(base,[one]);
  const run=(sha,data=m,opts={})=>evaluate({repo:dir,base,candidate:sha,manifest:data,requirePinnedRef:false,...opts});
  test('one exact owner source Git blob admitted',()=>assert.equal(run(ok).gate,'SOURCE_ONLY_PASS'));
  test('no-op candidate is HOLD',()=>assert.equal(run(base).gate,'HOLD'));
  test('wrong pinned source blob fails',()=>assert.equal(run(ok,{...m,changes:[{...m.changes[0],blobSha:'0'.repeat(40)}]}).gate,'HOLD'));
  test('HQ owner absent rejects source admission',()=>assert.equal(run(ok,{...m,changes:[{...m.changes[0],owner:''}]}).gate,'HOLD'));
  test('unlisted modified file rejects admission',()=>{write(dir,two,'namespace A { class C { int n; } }\n');const sha=commit(dir,'unlisted edit');assert.equal(run(sha).gate,'HOLD');});
  test('Protocol149 code change rejects admission',()=>{write(dir,protectedCode,'// CHANGED PROTOCOL\n');const sha=commit(dir,'protected protocol touched');assert.equal(run(sha).gate,'HOLD');});
  test('diagnostic define in allowed file rejects admission',()=>{write(dir,one,'#if CC001_PHOENIX_DIAGNOSTIC\n#endif\n');const sha=commit(dir,'diagnostic code entered');const mm=manifest(base,[one,two]);assert.equal(run(sha,mm).gate,'HOLD');});
  test('nonlinear unrelated candidate is HOLD',()=>{git(dir,'checkout','-q','-b','other',base);write(dir,one,'namespace A { class C2 {} }\n');const sha=commit(dir,'divergent implementation');assert.equal(run(sha,manifest(base,[one])).gate,'SOURCE_ONLY_PASS');const diverged=evaluate({repo:dir,base:ok,candidate:sha,manifest:{schema:SCHEMA,baseSha:ok,changes:[]},requirePinnedRef:false});assert.equal(diverged.gate,'HOLD');});
  test('missing manifest is HOLD',()=>assert.equal(run(ok,null).gate,'HOLD'));
  test('path traversal denied',()=>assert.equal(validGitPath(R+'../CoreClash/Networking/Thing.cs'),false));
  test('pinned RC1 exact SHA is stable',()=>assert.equal(PINNED_RC1,'10f64e4d213f17a352ed8fa83bc75884a39549f0'));
  test('reject no owner-approval implicit baseline',()=>assert.equal(run(ok,{schema:SCHEMA,baseSha:base,changes:[]}).gate,'HOLD'));
  console.log('RESULT: '+successes+'/'+successes+' SOURCE-ONLY local synthetic tests PASS');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
