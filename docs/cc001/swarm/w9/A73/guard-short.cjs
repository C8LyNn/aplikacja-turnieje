#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const ROOT='unity/cc001-r16/CoreClash-V149-Unity/';
function git(args){const p=cp.spawnSync('git',args,{encoding:'utf8',maxBuffer:8000000});if(p.error||p.status===null)throw Error(p.error?.message||'git failed');return p;}
function ok(args){const r=git(args);if(r.status)throw Error('git '+args[0]+' exit '+r.status+': '+r.stderr);return r.stdout.trim();}
function safe(p){return typeof p==='string'&&p&&!p.startsWith('/')&&!p.includes('\\')&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');}
function protectedPath(p){return /(^|\/)(Reference|Packages|ProjectSettings|Library|Temp|Builds|Logs)\//i.test(p)||/\.meta$|(^|\/)Tests\/Program\.cs$|NgoWireProtocol\.cs$|Protocol[_-]?149|V148|R17_A70_SOURCE_MANIFEST|^\.github\/|\.(dll|exe|pdb|apk|zip)$/i.test(p);}
function verify(data){
if(data.schemaVersion!==1||data.baseSha!==RC1||!Array.isArray(data.candidates)||!data.candidates.length||data.candidates.length>5)throw Error('invalid schema/base; RC1 is immutable');
if(ok(['rev-parse','--verify',RC1+'^{commit}'])!==RC1)throw Error('RC1 missing');
const errs=[],seen=new Map(),res=[];
for(const c of data.candidates){
if(!/^A\d\d$/.test(c.owner||'')||!c.ref||!/^([0-9a-f]{40})$/.test(c.expectedSha||'')||!Array.isArray(c.allowedPaths)||!Array.isArray(c.requiredTests)||!c.requiredTests.length)throw Error('bad candidate manifest');
if([...c.allowedPaths,...c.requiredTests].some(p=>!safe(p)))throw Error('unsafe path');
const head=ok(['rev-parse','--verify',c.ref+'^{commit}']);
if(head!==c.expectedSha)errs.push(c.owner+': HEAD_DRIFT');
if(git(['merge-base','--is-ancestor',RC1,head]).status!==0)errs.push(c.owner+': NOT_RC1_DESCENDANT');
const raw=git(['diff','--name-status','-z','--no-renames',RC1,head]);if(raw.status)throw Error('diff failed');
const fields=raw.stdout.split('\0').filter(Boolean);if(fields.length%2)throw Error('bad diff');
const changed=[];
for(let i=0;i<fields.length;i+=2){const status=fields[i],p=fields[i+1];changed.push(p);
if(status!=='A'&&status!=='M')errs.push(c.owner+': unsafe change '+status+' '+p);
if(!c.allowedPaths.includes(p)||protectedPath(p))errs.push(c.owner+': forbidden path '+p);
seen.set(p,[...(seen.get(p)||[]),c.owner]);}
for(const p of c.requiredTests)if(!c.allowedPaths.includes(p)||!p.startsWith(ROOT+'Tests/')||!p.endsWith('.cs')||!changed.includes(p))errs.push(c.owner+': missing test '+p);
res.push({owner:c.owner,ref:c.ref,head,changed});}
for(const [p,owners] of seen)if(owners.length>1)errs.push('OVERLAP '+p+' '+owners.join(','));
const dry=[];if(!errs.length)for(let i=0;i<res.length;i++)for(let j=i+1;j<res.length;j++){const r=git(['merge-tree','--write-tree',res[i].head,res[j].head]);dry.push({owners:[res[i].owner,res[j].owner],exit:r.status,tree:r.status===0?r.stdout.trim().split('\n')[0]:null});if(r.status)errs.push('MERGE_TREE_HOLD '+res[i].owner+'/'+res[j].owner);}
return {baseSha:RC1,verdict:errs.length?'HOLD':'PASS_SOURCE_SCOPE_ONLY',issues:errs,candidates:res,dry};}
if(require.main===module){try{if(process.argv.length!==4||process.argv[2]!=='--manifest')throw Error('usage: --manifest approved.json');const r=verify(JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8')));console.log(JSON.stringify(r,null,2));process.exitCode=r.issues.length?1:0;}catch(e){console.error('HOLD: '+e.message);process.exitCode=2;}}
module.exports={verify,RC1};
