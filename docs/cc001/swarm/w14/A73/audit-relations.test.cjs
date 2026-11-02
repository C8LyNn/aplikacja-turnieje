#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {safeRef,safePath,changed}=require('./audit-relations.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a73-w14-git-'));
function git(...args){const r=cp.spawnSync('git',args,{cwd:tmp,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function write(f,s){const p=path.join(tmp,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);}
function commit(s){git('add','.');git('commit','-m',s);return git('rev-parse','HEAD');}
const ref='integration/cc001-r17-w11-qa-freeze-20261030';
let gate;
let freeze;
function pin(pr,name,sha){return {pr,ref:name,sha};}
let base;
try{
 git('init','-b','main');git('config','user.name','A73 fixtures');git('config','user.email','a73-tests@example.invalid');
 write('unity/Assets/Networking.cs','base\n');write('unity/Assets/Presentation.cs','base\n');write('unity/Tests/Tests.cs','base\n');commit('fixture base');
 git('switch','-c',ref);write('docs/freeze.txt','freeze\n');freeze=commit('frozen source');
 const source=fs.readFileSync(path.join(__dirname,'audit-relations.cjs'),'utf8');
 const sandbox=path.join(tmp,'.git','audit-relations-pinned.cjs');
 fs.writeFileSync(sandbox,source.replace(/const FREEZE='[0-9a-f]{40}';/,"const FREEZE='"+freeze+"';"));
 gate=require(sandbox);
 git('switch','-c','feat/a41-parent',freeze);write('unity/Assets/Networking.cs','A41 W12\n');const parent=commit('A41 W12');
 git('switch','-c','feat/a41-head',parent);write('unity/Tests/Tests.cs','A41 W13 tests\n');const oldHead=commit('A41 W13 old');
 git('switch','-c','feat/a41-child',oldHead);write('docs/a41-child.txt','child capacity\n');const child=commit('capacity child on old W13');
 git('switch','feat/a41-head');write('docs/a41-extra.txt','new W13 parent fix\n');const newHead=commit('W13 parent advanced after child');
 git('switch','-c','feat/a83-head',freeze);write('unity/Assets/Presentation.cs','A83 visuals\n');write('unity/Tests/Tests.cs','A83 presentation tests\n');const a83=commit('A83');
 git('switch','-c','feat/a20-head',freeze);write('unity/Assets/Presentation.cs','A20 notices\n');write('docs/a20-note.txt','notice\n');const a20=commit('A20');
 git('switch','-c','feat/disjoint',freeze);write('docs/unrelated.txt','something\n');const disjoint=commit('independent disjoint');
 base={schemaVersion:1,freezeRef:ref,freezeSha:freeze,relations:[
  {id:'A41_STACK',kind:'stack',left:pin(241,'feat/a41-head',newHead),right:pin(250,'feat/a41-child',child)},
  {id:'A83_A20',kind:'independent',left:pin(229,'feat/a83-head',a83),right:pin(246,'feat/a20-head',a20)}
 ]};
 const clone=()=>structuredClone(base);
 test('source paths and ref validation prevents traversal and option-like refs',()=>{
  assert.equal(safeRef('feat/cc001-a73'),true);
  for(const x of ['--help','../feat','feat/x..y','feat/a//b','integration/protected','feat/a.lock','feat/a/'])assert.equal(safeRef(x),false,x);
  for(const x of ['../test','/root','some\\name','a\nb','a//b','a:b'])assert.equal(safePath(x),false,x);
 });
 test('real diverged upstream child is HOLD and identifies its merge base',()=>{
  const v=gate.inspect(base,tmp);assert.equal(v.verdict,'HOLD');assert.ok(v.issues.some(s=>s.includes('UPSTREAM_FORK')));
  assert.equal(v.relations[0].mergeBase,oldHead);
 });
 test('real independent changes to same source path require review',()=>{
  const v=gate.inspect(base,tmp);assert.ok(v.issues.some(s=>s.includes('CROSS_OWNER_OVERLAP_REVIEW')));
  assert.deepEqual(v.relations[1].overlappingPaths,['unity/Assets/Presentation.cs']);
 });
 test('safe linear stack passes source-only, not native QA',()=>{
  const m=clone();m.relations=[{id:'A41_OK',kind:'stack',left:pin(241,'feat/a41-head',oldHead),right:pin(250,'feat/a41-child',child)}];
  // Ref actually advanced; first validate pinned-head drift rather than accepting old SHA.
  assert.equal(gate.inspect(m,tmp).verdict,'HOLD');
  git('branch','feat/a41-old',oldHead);m.relations[0].left.ref='feat/a41-old';
  const v=gate.inspect(m,tmp);assert.equal(v.verdict,'SOURCE_RELATIONS_ONLY',JSON.stringify(v.issues));
  assert.equal(v.physicalPc1Pc2,'NOT_ASSESSED');
 });
 test('separate disjoint branches pass source-only',()=>{
  const m=clone();m.relations=[{id:'A83_DISJOINT',kind:'independent',left:pin(229,'feat/a83-head',a83),right:pin(247,'feat/disjoint',disjoint)}];
  assert.equal(gate.inspect(m,tmp).verdict,'SOURCE_RELATIONS_ONLY');
 });
 test('stale pin is HOLD',()=>{const m=clone();m.relations=[m.relations[0]];m.relations[0].right.sha='f'.repeat(40);assert.ok(gate.inspect(m,tmp).issues.some(s=>s.includes('PIN_DRIFT')));});
 test('foreign ancestry from main is HOLD',()=>{
  const m=clone();git('switch','main');git('switch','-c','feat/oldroot');write('docs/oldroot.txt','old\n');const sha=commit('oldroot');
  m.relations[0].right=pin(250,'feat/oldroot',sha);assert.ok(gate.inspect(m,tmp).issues.some(s=>s.includes('NOT_FROZEN_DESCENDANT')));
 });
 test('missing correct frozen ref rejected before git preview',()=>{const m=clone();m.freezeSha='e'.repeat(40);assert.throws(()=>gate.inspect(m,tmp),/invalid manifest/);});
 test('ref moved after pin is rejected',()=>{const m=clone();m.relations=[m.relations[0]];git('branch','-f','feat/a41-child',newHead);assert.ok(gate.inspect(m,tmp).issues.some(s=>s.includes('PIN_DRIFT')));git('branch','-f','feat/a41-child',child);});
 test('changed paths are real on disk Git diffs, not strings in manifest',()=>{assert.deepEqual(changed(freeze,a83,tmp),['unity/Assets/Presentation.cs','unity/Tests/Tests.cs']);});
 test('actual CLI returns HOLD exit1 and JSON with no release claim',()=>{
  const p=path.join(tmp,'pins.json');fs.writeFileSync(p,JSON.stringify(base));const r=cp.spawnSync(process.execPath,[sandbox,'--manifest',p],{cwd:tmp,encoding:'utf8'});
  assert.equal(r.status,1,r.stderr);assert.ok(r.stdout.startsWith('{'),JSON.stringify({stderr:r.stderr,stdout:r.stdout,status:r.status}));const doc=JSON.parse(r.stdout);assert.equal(doc.verdict,'HOLD');assert.equal(doc.integration,'NOT_PERFORMED');
 });
 test('actual CLI rejects malformed input with exit2',()=>{
  const r=cp.spawnSync(process.execPath,[sandbox,'--manifest',path.join(tmp,'no-such.json')],{cwd:tmp,encoding:'utf8'});
  assert.equal(r.status,2,JSON.stringify({stderr:r.stderr,stdout:r.stdout,status:r.status}));assert.match(r.stderr,/HOLD:/);
 });
 test('does not move any source branch or freeze reference',()=>{
  assert.equal(git('rev-parse',ref),freeze);assert.equal(git('rev-parse','feat/a41-head'),newHead);
  assert.equal(git('rev-parse','feat/a41-child'),child);assert.equal(git('rev-parse','feat/a83-head'),a83);
 });
}finally{
 // node:test queues execution after main body; defer cleanup until test runner finish.
 process.on('exit',()=>fs.rmSync(tmp,{recursive:true,force:true}));
}
