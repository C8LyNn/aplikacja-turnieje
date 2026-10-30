#!/usr/bin/env node
'use strict';
// CC-001 W11 / A73: read-only Git provenance and protected-source gate for a stacked addon.
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const PROJECT='unity/cc001-r16/CoreClash-V149-Unity/';
const SHA=/^[0-9a-f]{40}$/;
function safe(p){return typeof p==='string' && p.length>0 && !p.startsWith('/') && !/[\\\r\n\0:]/.test(p) && p.split('/').every(x=>x && x!=='.' && x!=='..');}
function command(args,cwd){const r=cp.spawnSync('git',args,{cwd,encoding:'utf8',maxBuffer:16000000});if(r.error)throw Error(r.error.message);return{code:r.status,stdout:r.stdout||'',stderr:r.stderr||''};}
function git(args,cwd){const r=command(args,cwd);if(r.code!==0)throw Error('git '+args[0]+' exit '+r.code+': '+r.stderr.trim().slice(0,200));return r.stdout.trim();}
function objectSha(ref,p,cwd){return git(['rev-parse','--verify',ref+':'+p],cwd);}
function parseNames(raw){const xs=raw.split('\0');if(xs.at(-1)==='')xs.pop();if(xs.length%2)throw Error('malformed NUL-separated name-status output');const out=[];for(let i=0;i<xs.length;i+=2)out.push({status:xs[i],path:xs[i+1]});return out;}
function inspect(m,cwd=process.cwd()){
  if(!m||m.schemaVersion!==2||!SHA.test(m.baseSha||'')||!SHA.test(m.addonSha||'')||!SHA.test(m.immutableRc1||'')||m.immutableRc1!==RC1||!m.baseRef||!m.addonRef||!m.expectedChanges||typeof m.expectedChanges!=='object'||Array.isArray(m.expectedChanges)||!m.retainedBlobs||typeof m.retainedBlobs!=='object'||Array.isArray(m.retainedBlobs))throw Error('invalid pinned manifest schema');
  const changes=Object.entries(m.expectedChanges),retained=Object.entries(m.retainedBlobs);
  if(changes.length<1||retained.length<1)throw Error('empty change or retention pins');
  for(const [p,z] of changes)if(!safe(p)||!z||!['A','M'].includes(z.status)||!SHA.test(z.blob||''))throw Error('invalid changed path/status/blob: '+p);
  for(const [p,sha] of retained)if(!safe(p)||!SHA.test(sha))throw Error('invalid retained path/blob: '+p);
  const issues=[],details=[];
  const rc=git(['rev-parse','--verify',RC1+'^{commit}'],cwd);
  if(rc!==RC1)issues.push('RC1_COMMIT_INVALID');
  const base=git(['rev-parse','--verify',m.baseRef+'^{commit}'],cwd);
  const addon=git(['rev-parse','--verify',m.addonRef+'^{commit}'],cwd);
  if(base!==m.baseSha)issues.push('BASE_REF_DRIFT');
  if(addon!==m.addonSha)issues.push('ADDON_REF_DRIFT');
  if(command(['merge-base','--is-ancestor',RC1,base],cwd).code!==0)issues.push('BASE_NOT_RC1_DESCENDANT');
  if(command(['merge-base','--is-ancestor',base,addon],cwd).code!==0)issues.push('ADDON_NOT_BASE_DESCENDANT');
  if(git(['merge-base',base,addon],cwd)!==base)issues.push('MERGE_BASE_MISMATCH');
  const diff=command(['diff','--name-status','--no-renames','-z',base,addon],cwd);
  if(diff.code!==0)throw Error('git diff returned exit '+diff.code+': '+diff.stderr.trim().slice(0,180));
  const actual=parseNames(diff.stdout);
  const observed=new Set(),expected=new Map(changes);
  for(const item of actual){
    if(!safe(item.path)){issues.push('UNSAFE_PATH');continue;}
    observed.add(item.path);
    const e=expected.get(item.path);
    if(!e){issues.push('UNLISTED_PATH '+item.path);continue;}
    if(item.status!==e.status){issues.push('STATUS_MISMATCH '+item.path);continue;}
    const blob=objectSha(addon,item.path,cwd);
    details.push({path:item.path,status:item.status,blob,match:blob===e.blob});
    if(blob!==e.blob)issues.push('BLOB_MISMATCH '+item.path);
    if(/\.meta$/i.test(item.path)){
      const companion=item.path.slice(0,-5);
      if(item.status!=='A'||!expected.has(companion)||expected.get(companion).status!=='A')issues.push('META_UNPAIRED_OR_MODIFIED '+item.path);
      const src=git(['show',addon+':'+item.path],cwd);
      if(!/^fileFormatVersion:\s*2\s*\nguid:\s*[a-f0-9]{32}\s*$/m.test(src.trim()))issues.push('META_INVALID '+item.path);
    }
    if(item.path.startsWith('.github/')||item.path.includes('/Reference/')||/Protocol149|NgoWireProtocol|R17_A70_SOURCE_MANIFEST|ProjectSettings\/|Packages\//i.test(item.path))issues.push('PROTECTED_CHANGED '+item.path);
  }
  for(const [p] of changes)if(!observed.has(p))issues.push('MISSING_CHANGED_PATH '+p);
  for(const [p,sha] of retained){
    if(observed.has(p))issues.push('RETAINED_PATH_MODIFIED '+p);
    try{const original=objectSha(base,p,cwd),actualSha=objectSha(addon,p,cwd);if(original!==sha||actualSha!==sha)issues.push('RETAINED_BLOB_MISMATCH '+p);}
    catch(e){issues.push('RETAINED_UNAVAILABLE '+p+': '+e.message);}
  }
  // This verifies Git-source identity only; no build, network or gameplay result is implied.
  return {gate:'A73_W11_STACKED_SOURCE',baseSha:base,addonSha:addon,verdict:issues.length?'HOLD':'PASS_SOURCE_SCOPE_ONLY',counts:{expected:changes.length,observed:actual.length,matchedBlobs:details.filter(x=>x.match).length,retained:retained.length},issues,details};
}
function cli(argv){if(argv.length!==2||argv[0]!=='--manifest')throw Error('Usage: node verify-stacked-addon.cjs --manifest pinned.json');const m=JSON.parse(fs.readFileSync(path.resolve(argv[1]),'utf8'));return inspect(m);}
if(require.main===module){try{const r=cli(process.argv.slice(2));process.stdout.write(JSON.stringify(r,null,2)+'\n');process.exitCode=r.issues.length?1:0;}catch(e){console.error('HOLD: '+e.message);process.exitCode=2;}}
module.exports={inspect,parseNames,safe,RC1};
