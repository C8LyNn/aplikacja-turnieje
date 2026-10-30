#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const ROOT='unity/cc001-r16/CoreClash-V149-Unity/';
function git(args){const p=cp.spawnSync('git',args,{encoding:'utf8',maxBuffer:8000000});if(p.error||p.status===null)throw Error(p.error?.message||'git failed');return p;}
function ok(args){const r=git(args);if(r.status)throw Error('git '+args[0]+' exit '+r.status+': '+r.stderr);return r.stdout.trim();}
function safe(p){return typeof p==='string'&&p&&!p.startsWith('/')&&!/[\\:\r\n\0]/.test(p)&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');}
function protectedPath(p){return /(^|\/)(Reference|Packages|ProjectSettings|Library|Temp|Builds|Logs)\//i.test(p)||/\.meta$|(^|\/)Tests\/Program\.cs$|NgoWireProtocol\.cs$|Protocol[_-]?149|V148|R17_A70_SOURCE_MANIFEST|^\.github\/|\.(dll|exe|pdb|apk|zip)$/i.test(p);}
function verify(data){
 if(data.schemaVersion!==1||data.baseSha!==RC1||!Array.isArray(data.candidates)||!data.candidates.length||data.candidates.length>5)throw Error('invalid schema/base; RC1 is immutable');
 if(ok(['rev-parse','--verify',RC1+'^{commit}'])!==RC1)throw Error('RC1 missing');
 const issues=[],seen=new Map(),owners=new Set(),res=[];
 for(const c of data.candidates){
  if(!/^A\d\d$/.test(c.owner||'')||!c.ref||!/^[0-9a-f]{40}$/.test(c.expectedSha||'')||!Array.isArray(c.allowedPaths)||!Array.isArray(c.requiredTests)||!c.requiredTests.length||!c.expectedBlobs||typeof c.expectedBlobs!=='object'||Array.isArray(c.expectedBlobs))throw Error('bad candidate manifest (exact expectedBlobs required)');
  if(owners.has(c.owner))issues.push(c.owner+': DUPLICATE_OWNER');else owners.add(c.owner);
  const pinned=Object.keys(c.expectedBlobs);
  if([...c.allowedPaths,...c.requiredTests,...pinned].some(p=>!safe(p)))throw Error('unsafe path');
  if(new Set(c.allowedPaths).size!==c.allowedPaths.length)issues.push(c.owner+': DUPLICATE_ALLOWLIST_PATH');
  const head=ok(['rev-parse','--verify',c.ref+'^{commit}']);
  if(head!==c.expectedSha)issues.push(c.owner+': HEAD_DRIFT');
  if(git(['merge-base','--is-ancestor',RC1,head]).status!==0)issues.push(c.owner+': NOT_RC1_DESCENDANT');
  const raw=git(['diff','--name-status','-z','--no-renames',RC1,head]);if(raw.status)throw Error('diff failed');
  const fields=raw.stdout.split('\0').filter(Boolean);if(fields.length%2)throw Error('bad diff');
  const changed=[],blobs={};
  for(let i=0;i<fields.length;i+=2){
   const status=fields[i],p=fields[i+1];changed.push(p);
   if(status!=='A'&&status!=='M')issues.push(c.owner+': UNSAFE_CHANGE '+status+' '+p);
   if(!c.allowedPaths.includes(p)||protectedPath(p))issues.push(c.owner+': FORBIDDEN_PATH '+p);
   if(safe(p)&&/^[AM]$/.test(status)){
    const blob=ok(['rev-parse',head+':'+p]);blobs[p]=blob;
    if(!/^[0-9a-f]{40}$/.test(c.expectedBlobs[p]||'')||c.expectedBlobs[p]!==blob)issues.push(c.owner+': BLOB_DRIFT '+p);
   }
   seen.set(p,[...(seen.get(p)||[]),c.owner]);
  }
  for(const p of pinned)if(!changed.includes(p))issues.push(c.owner+': EXTRA_BLOB_PIN '+p);
  for(const p of c.requiredTests)if(!c.allowedPaths.includes(p)||!p.startsWith(ROOT+'Tests/')||!p.endsWith('.cs')||!changed.includes(p))issues.push(c.owner+': REQUIRED_TEST_NOT_CHANGED '+p);
  if(!changed.length)issues.push(c.owner+': NO_CHANGED_PATHS');
  res.push({owner:c.owner,ref:c.ref,head,changed,blobs});
 }
 for(const [p,ownersForPath] of seen)if(ownersForPath.length>1)issues.push('CROSS_AGENT_PATH_OVERLAP '+p+' '+ownersForPath.join(','));
 const previews=[];
 if(!issues.length)for(let i=0;i<res.length;i++)for(let j=i+1;j<res.length;j++){
  const r=git(['merge-tree','--write-tree',res[i].head,res[j].head]);previews.push({owners:[res[i].owner,res[j].owner],exitCode:r.status,tree:r.status===0?r.stdout.trim().split('\n')[0]:null});
  if(r.status)issues.push('MERGE_TREE_UNVERIFIED_OR_CONFLICT '+res[i].owner+'/'+res[j].owner);
 }
 return {baseSha:RC1,verdict:issues.length?'HOLD':'PASS_SOURCE_SCOPE_ONLY',issues,candidates:res,pairwiseMergeTree:previews};
}
if(require.main===module){try{if(process.argv.length!==4||process.argv[2]!=='--manifest')throw Error('usage: node guard-short.cjs --manifest approved.json');const r=verify(JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8')));console.log(JSON.stringify(r,null,2));process.exitCode=r.issues.length?1:0;}catch(e){console.error('HOLD: '+e.message);process.exitCode=2;}}
module.exports={verify,RC1};
