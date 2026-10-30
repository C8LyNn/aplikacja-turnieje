#!/usr/bin/env node
'use strict';
// CC-001 A73 W14: git-only, fail-closed branch relation and changed-path admission.
// No branch/commit mutations, no game/native test claims.
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const FREEZE_REF='integration/cc001-r17-w11-qa-freeze-20261030';
const HEX=/^[0-9a-f]{40}$/;
const safeRef=s=>typeof s==='string'&&s.length<=180&&/^feat\/[a-z0-9][a-z0-9._/-]*$/.test(s)&&!s.includes('..')&&!s.includes('//')&&!s.endsWith('/')&&!s.endsWith('.lock');
const safePath=s=>typeof s==='string'&&s.length>0&&!s.startsWith('/')&&!/[\\\r\n\0:]/.test(s)&&s.split('/').every(x=>x!==''&&x!=='.'&&x!=='..');
function run(args,cwd){
 const r=cp.spawnSync('git',args,{cwd,encoding:'utf8',maxBuffer:32*1024*1024,timeout:120000});
 if(r.error)throw Error('git unavailable: '+r.error.message);
 if(r.status===null)throw Error('git interrupted');
 return {code:r.status,out:r.stdout||'',err:r.stderr||''};
}
function git(args,cwd){const r=run(args,cwd);if(r.code)throw Error('git '+args[0]+' failed ('+r.code+'): '+r.err.slice(0,160));return r.out.trim();}
function changed(base,head,cwd){
 const result=run(['diff','--name-only','--no-renames','-z',base,head],cwd);
 if(result.code)throw Error('git diff failure ('+result.code+')');
 const a=result.out.split('\0');if(a.at(-1)==='')a.pop();
 if(a.some(p=>!safePath(p)))throw Error('unsafe changed path');
 if(new Set(a).size!==a.length)throw Error('duplicate changed path');
 return a.sort();
}
function inspect(manifest,cwd=process.cwd()){
 if(!manifest||manifest.schemaVersion!==1||manifest.freezeSha!==FREEZE||manifest.freezeRef!==FREEZE_REF||!Array.isArray(manifest.relations)||!manifest.relations.length||manifest.relations.length>20)throw Error('invalid manifest / QA freeze identity');
 if(git(['rev-parse','--verify','refs/heads/'+FREEZE_REF+'^{commit}'],cwd)!==FREEZE)throw Error('IMMUTABLE_QA_REF_DRIFT');
 const output=[],allIssues=[];
 for(const rel of manifest.relations){
  if(!rel||typeof rel.id!=='string'||!/^A[0-9A-Za-z_-]{1,45}$/.test(rel.id)||!['stack','independent'].includes(rel.kind)||!rel.left||!rel.right)throw Error('invalid relation');
  const sides={};let issues=[];
  for(const [name,source] of Object.entries({left:rel.left,right:rel.right})){
   if(!safeRef(source.ref)||!HEX.test(source.sha||'')||!Number.isInteger(source.pr)||source.pr<=0)throw Error('unsafe pinned ref/SHA/PR '+name);
   const live=git(['rev-parse','--verify','refs/heads/'+source.ref+'^{commit}'],cwd);
   if(live!==source.sha)issues.push('PIN_DRIFT '+name+' PR#'+source.pr);
   const ancestor=run(['merge-base','--is-ancestor',FREEZE,live],cwd);
   if(ancestor.code!==0)issues.push('NOT_FROZEN_DESCENDANT '+name);
   sides[name]={pr:source.pr,ref:source.ref,expectedSha:source.sha,liveSha:live,paths:changed(FREEZE,live,cwd)};
  }
  const [l,r]=[sides.left,sides.right];
  const mergeBase=git(['merge-base',l.liveSha,r.liveSha],cwd);
  const common=l.paths.filter(p=>r.paths.includes(p));
  if(rel.kind==='stack'){
   if(mergeBase!==l.liveSha)issues.push('UPSTREAM_FORK: downstream excludes current upstream HEAD');
  } else {
   if(mergeBase!==FREEZE)issues.push('INDEPENDENT_BASE_DRIFT');
   if(common.length)issues.push('CROSS_OWNER_OVERLAP_REVIEW '+common.length+' paths');
  }
  const out={id:rel.id,kind:rel.kind,left:l,right:r,mergeBase,overlappingPaths:common,verdict:issues.length?'HOLD':'SOURCE_RELATION_ONLY',issues};
  output.push(out);allIssues.push(...issues.map(x=>rel.id+': '+x));
 }
 return {gate:'A73_R17_W14_GIT_RELATIONS',freezeSha:FREEZE,verdict:allIssues.length?'HOLD':'SOURCE_RELATIONS_ONLY',issues:allIssues,relations:output,managedDotnet9:'NOT_ASSESSED',unityWindowsPlayer:'NOT_ASSESSED',physicalPc1Pc2:'NOT_ASSESSED',integration:'NOT_PERFORMED',advisory:'Git relation/path check only; no actual merge, compilation, Windows build or physical network QA'};
}
if(require.main===module){
 try{
  if(process.argv.length!==4||process.argv[2]!=='--manifest')throw Error('usage: node audit-relations.cjs --manifest pins.json');
  const data=JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8'));
  const output=inspect(data);console.log(JSON.stringify(output,null,2));process.exitCode=output.verdict==='SOURCE_RELATIONS_ONLY'?0:1;
 }catch(e){console.error('HOLD: '+e.message);process.exitCode=2;}
}
module.exports={inspect,changed,safeRef,safePath,FREEZE,FREEZE_REF};
