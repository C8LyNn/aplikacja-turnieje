'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {QA,PROJECT,gitBlob,verifyFrozenCheckout}=require('./verify-frozen-checkout.cjs');
function fixture(extraIgnore=''){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w13-a71-'));
 const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-q');git('config','user.email','a71@local.invalid');git('config','user.name','A71 Fixture');
 const p=PROJECT+'Assets/CoreClash/Test.cs';
 fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),'class Test {}\n');
 if(extraIgnore)fs.writeFileSync(path.join(root,'.gitignore'),extraIgnore);
 git('add','.');git('commit','-q','-m','fixture');
 const head=git('rev-parse','HEAD'),sha=git('hash-object',p);
 const entries=[{path:p,sha,mode:'100644'}];
 return {root,git,head,entries,p,close(){fs.rmSync(root,{recursive:true,force:true});}};
}
function run(f){return verifyFrozenCheckout(f.root,f.entries,{expectedSha:f.head});}
test('Git blob hashing matches real git hash-object',()=>{const f=fixture();try{assert.equal(gitBlob(fs.readFileSync(path.join(f.root,f.p))),f.entries[0].sha);}finally{f.close();}});
test('real clean Git checkout with frozen HEAD and authentic bytes passes source-only',()=>{const f=fixture();try{const z=run(f);assert.equal(z.verdict,'PASS_CLEAN_FROZEN_WORKTREE_ONLY');assert.equal(z.checkedFiles,1);assert.equal(z.nativeWindows,'NOT_ATTESTED');}finally{f.close();}});
test('changed tracked C# rejected',()=>{const f=fixture();try{fs.appendFileSync(path.join(f.root,f.p),'// changed\n');assert.throws(()=>run(f),/WORKTREE_DIRTY_OR_UNTRACKED/);}finally{f.close();}});
test('staged C# change rejected',()=>{const f=fixture();try{fs.appendFileSync(path.join(f.root,f.p),'// staged\n');f.git('add',f.p);assert.throws(()=>run(f),/WORKTREE_DIRTY_OR_UNTRACKED/);}finally{f.close();}});
test('untracked fake C# in Assets rejected',()=>{const f=fixture();try{fs.writeFileSync(path.join(f.root,PROJECT+'Assets/CoreClash/Injected.cs'),'class Injection {}');assert.throws(()=>run(f),/WORKTREE_DIRTY_OR_UNTRACKED/);}finally{f.close();}});
test('ignored malicious Unity C# rejected despite git status clean',()=>{const f=fixture('**/Hidden.cs\n');try{const q=PROJECT+'Assets/CoreClash/Hidden.cs';fs.writeFileSync(path.join(f.root,q),'class Hidden{}');assert.equal(f.git('status','--porcelain'), '');assert.throws(()=>run(f),/IGNORED_UNITY_SOURCE_PRESENT/);}finally{f.close();}});
test('ignored Unity Tests payload rejected',()=>{const f=fixture('**/IgnoredTests.cs\n');try{fs.writeFileSync(path.join(f.root,PROJECT+'Assets/CoreClash/IgnoredTests.cs'),'class Hidden{}');assert.throws(()=>run(f),/IGNORED_UNITY_SOURCE_PRESENT/);}finally{f.close();}});
test('assume-unchanged tracked code rejected (never trust clean status)',()=>{const f=fixture();try{f.git('update-index','--assume-unchanged',f.p);fs.appendFileSync(path.join(f.root,f.p),'// hidden\n');assert.equal(f.git('status','--porcelain'),'');assert.throws(()=>run(f),/INDEX_SKIP_OR_ASSUME_UNCHANGED|CHECKOUT_BYTES_NOT_FROZEN/);}finally{f.close();}});
test('skip-worktree tracked code rejected',()=>{const f=fixture();try{f.git('update-index','--skip-worktree',f.p);assert.throws(()=>run(f),/INDEX_SKIP_OR_ASSUME_UNCHANGED/);}finally{f.close();}});
test('new valid commit HEAD rejected despite clean checkout',()=>{const f=fixture();try{fs.appendFileSync(path.join(f.root,f.p),'// new\n');f.git('add',f.p);f.git('commit','-q','-m','new');assert.throws(()=>run(f),/WORKTREE_HEAD_NOT_FROZEN/);}finally{f.close();}});
test('wrong expected candidate SHA rejected',()=>{const f=fixture();try{assert.throws(()=>verifyFrozenCheckout(f.root,f.entries,{expectedSha:QA}),/WORKTREE_HEAD_NOT_FROZEN/);}finally{f.close();}});
test('blob hash mismatch rejected when Git tree manifest is stale',()=>{const f=fixture();try{const arr=[{...f.entries[0],sha:'a'.repeat(40)}];assert.throws(()=>verifyFrozenCheckout(f.root,arr,{expectedSha:f.head}),/CHECKOUT_BYTES_NOT_FROZEN/);}finally{f.close();}});
test('missing frozen source path fails',()=>{const f=fixture();try{const a=[{...f.entries[0],path:PROJECT+'Assets/CoreClash/Missing.cs'}];assert.throws(()=>verifyFrozenCheckout(f.root,a,{expectedSha:f.head}),/ENOENT/);}finally{f.close();}});
test('path traversal rejected',()=>{const f=fixture();try{const a=[{...f.entries[0],path:'../hidden'}];assert.throws(()=>verifyFrozenCheckout(f.root,a,{expectedSha:f.head}),/INVALID_FROZEN_ENTRY/);}finally{f.close();}});
test('duplicate manifest entry rejected',()=>{const f=fixture();try{assert.throws(()=>verifyFrozenCheckout(f.root,[...f.entries,...f.entries],{expectedSha:f.head}),/INVALID_FROZEN_ENTRY/);}finally{f.close();}});
test('non-root path refused',()=>{const f=fixture();try{assert.throws(()=>verifyFrozenCheckout(path.join(f.root,PROJECT),f.entries,{expectedSha:f.head}),/ROOT_NOT_GIT_TOP_LEVEL/);}finally{f.close();}});
test('executable bit drift denied',()=>{const f=fixture();try{fs.chmodSync(path.join(f.root,f.p),0o755);assert.throws(()=>run(f),/WORKTREE_DIRTY_OR_UNTRACKED|CHECKOUT_MODE_MISMATCH/);}finally{f.close();}});
