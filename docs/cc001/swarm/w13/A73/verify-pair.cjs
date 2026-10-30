#!/usr/bin/env node
'use strict';
// CC-001 A73 W13: read-only two-author Git merge preview, never a release gate.
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const FREEZE_REF='integration/cc001-r17-w11-qa-freeze-20261030';
const ROOT='unity/cc001-r16/CoreClash-V149-Unity/';
const HEX=/^[a-f0-9]{40}$/;
const goodPath=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!/[\\\0\r\n:]/.test(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..');
function command(args,cwd){const r=cp.spawnSync('git',args,{cwd,encoding:'utf8',maxBuffer:16000000});if(r.error)throw Error(r.error.message);if(r.status===null)throw Error('git terminated without exit code');return {code:r.status,out:r.stdout||'',err:r.stderr||''};}
function git(args,cwd){const r=command(args,cwd);if(r.code!==0)throw Error('git '+args[0]+' exit '+r.code+': '+r.err.slice(0,200));return r.out.trim();}
function diffRecords(raw){let fields=raw.split('\0');if(fields.at(-1)==='')fields.pop();if(fields.length%2)throw Error('corrupt NUL diff');const records=[];for(let i=0;i<fields.length;i+=2)records.push({status:fields[i],path:fields[i+1]});return records;}
function treeEntry(commit,p,cwd){const s=git(['ls-tree','-z',commit,'--',p],cwd);const match=/^(\d{6}) (blob|commit) ([a-f0-9]{40})\t([^\0]+)\0$/.exec(s);if(!match||match[4]!==p)throw Error('ambiguous/missing tree path '+p);return {mode:match[1],type:match[2],sha:match[3]};}
function forbidden(p){return p.startsWith('.github/')||p.includes('/Reference/')||/\/ProjectSettings\/|\/Packages\/|NgoWireProtocol|Protocol149|V148|R17_A70_SOURCE_MANIFEST|\/Core\/|\/Physics\/|\/Catalog\//i.test(p);}
function inspect(m,cwd=process.cwd()){
 if(!m||m.schemaVersion!==1||m.freezeRef!==FREEZE_REF||m.freezeSha!==FREEZE||!Array.isArray(m.candidates)||m.candidates.length!==2)throw Error('invalid exact two-candidate schema/freeze');
 if(git(['rev-parse','--verify',FREEZE_REF+'^{commit}'],cwd)!==FREEZE)throw Error('frozen ref moved / missing');
 const issues=[],sets=[],descriptors=[];const owners=new Set(),newMetaGuids=new Map();
 for(const c of m.candidates){
  if(!/^A\d\d$/.test(c.owner||'')||!c.ref||!HEX.test(c.sha||'')||!c.paths||typeof c.paths!=='object'||Array.isArray(c.paths)||!Array.isArray(c.requiredTests)||c.requiredTests.length===0)throw Error('candidate schema invalid');
  if(owners.has(c.owner))issues.push('DUPLICATE_OWNER '+c.owner);owners.add(c.owner);
  const entries=Object.entries(c.paths);if(!entries.length)throw Error('no declared changed files');
  for(const [p,v] of entries)if(!goodPath(p)||!v||!['A','M'].includes(v.status)||!HEX.test(v.blob||''))throw Error('unsafe path/status/blob '+p);
  for(const p of c.requiredTests)if(!goodPath(p)||!p.startsWith(ROOT+'Tests/')||!p.endsWith('.cs'))throw Error('invalid managed test requirement '+p);
  const sha=git(['rev-parse','--verify',c.ref+'^{commit}'],cwd);
  if(sha!==c.sha)issues.push('REF_DRIFT '+c.owner);
  if(command(['merge-base','--is-ancestor',FREEZE,sha],cwd).code!==0)issues.push('NOT_FROZEN_DESCENDANT '+c.owner);
  const diff=command(['diff','--name-status','--no-renames','-z',FREEZE,sha],cwd);
  if(diff.code!==0)throw Error('diff error for '+c.owner);
  const actual=diffRecords(diff.out),observed=new Set(),verified={};
  for(const {status,path:p} of actual){
   if(!goodPath(p))throw Error('unexpected unsafe changed path');observed.add(p);
   const expected=c.paths[p];if(!expected){issues.push('UNDECLARED_PATH '+c.owner+' '+p);continue;}
   if(status!==expected.status)issues.push('STATUS_MISMATCH '+c.owner+' '+p);
   if(!['A','M'].includes(status))issues.push('DESTRUCTIVE_CHANGE '+c.owner+' '+p);
   if(forbidden(p))issues.push('PROTECTED_PATH '+c.owner+' '+p);
   if(['A','M'].includes(status)){
    const e=treeEntry(sha,p,cwd);verified[p]=e.sha;
    if(e.sha!==expected.blob)issues.push('BLOB_MISMATCH '+c.owner+' '+p);
    if(e.mode!=='100644'||e.type!=='blob')issues.push('UNSAFE_OBJECT_MODE '+c.owner+' '+p);
    if(status==='A'&&p.startsWith(ROOT+'Assets/')&&p.endsWith('.cs')&&(!c.paths[p+'.meta']||c.paths[p+'.meta'].status!=='A'))issues.push('MISSING_ASSET_META '+c.owner+' '+p);
    if(p.endsWith('.meta')){
     if(status!=='A')issues.push('MODIFIED_OR_DELETED_META '+c.owner+' '+p);
     if(p.endsWith('.cs.meta')&&(!c.paths[p.slice(0,-5)]||c.paths[p.slice(0,-5)].status!=='A'))issues.push('ORPHAN_CS_META '+c.owner+' '+p);
     if(status==='A'){
      const meta=git(['show',sha+':'+p],cwd);
      const parsed=/^fileFormatVersion: 2\r?\nguid: ([a-f0-9]{32})$/.exec(meta);
      if(!parsed)issues.push('INVALID_UNITY_META '+c.owner+' '+p);
      else if(newMetaGuids.has(parsed[1]))issues.push('DUPLICATE_NEW_GUID '+c.owner+' '+p+' vs '+newMetaGuids.get(parsed[1]));
      else newMetaGuids.set(parsed[1],c.owner+':'+p);
     }
    }
   }
  }
  for(const [p] of entries)if(!observed.has(p))issues.push('PIN_NOT_IN_DIFF '+c.owner+' '+p);
  for(const t of c.requiredTests)if(!observed.has(t))issues.push('TEST_NOT_CHANGED '+c.owner+' '+t);
  sets.push(observed);descriptors.push({owner:c.owner,sha,changed:actual.length,verifiedBlobs:verified});
 }
 const overlap=[...sets[0]].filter(x=>sets[1].has(x));
 for(const p of overlap)issues.push('CROSS_OWNER_PATH_COLLISION '+p);
 let tree=null,preview='NOT_RUN';
 if(!issues.length){
  const r=command(['merge-tree','--write-tree',descriptors[0].sha,descriptors[1].sha],cwd);
  if(r.code!==0){issues.push('GIT_MERGE_TREE_CONFLICT_OR_ERROR '+r.code);preview='HOLD';}
  else{
   const t=r.out.trim().split('\n')[0];if(!HEX.test(t))throw Error('unrecognized merge-tree result');tree=t;preview='TREE_CREATED';
   for(const d of descriptors)for(const [p,sha] of Object.entries(d.verifiedBlobs)){
    const e=treeEntry(tree,p,cwd);
    if(e.sha!==sha||e.mode!=='100644'||e.type!=='blob')issues.push('MERGED_BLOB_LOST '+d.owner+' '+p);
   }
  }
 }
 return {gate:'A73_W13_PAIRWISE_SOURCE_ONLY',freezeSha:FREEZE,verdict:issues.length?'HOLD':'PASS_PAIRWISE_SOURCE_ONLY',issues,overlap,mergePreview:preview,mergeTree:tree,candidates:descriptors,advisory:'Two-source Git preview only; no W11 native QA, no A70 selection and no release approval'};
}
if(require.main===module){try{if(process.argv.length!==4||process.argv[2]!=='--manifest')throw Error('usage: node verify-pair.cjs --manifest pinned.json');const data=JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8'));const result=inspect(data);console.log(JSON.stringify(result,null,2));process.exitCode=result.verdict==='PASS_PAIRWISE_SOURCE_ONLY'?0:1;}catch(e){console.error('HOLD: '+e.message);process.exitCode=2;}}
module.exports={inspect,diffRecords,treeEntry,goodPath,FREEZE,FREEZE_REF};
