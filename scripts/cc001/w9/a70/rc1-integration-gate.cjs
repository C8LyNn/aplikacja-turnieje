#!/usr/bin/env node
'use strict';
/*
 * CC-001 R17-W9 / A70. Fail-closed, SOURCE-ONLY integration admission gate.
 * Does not change refs, perform a merge, run Unity, or certify multiplayer QA.
 * Authorized path/author/blob pairs are supplied by HQ as a separate manifest;
 * this tool MUST NOT invent or expand them.
 */
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PINNED_RC1 = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const PINNED_REF = 'refs/heads/integration/cc001-r17-w8-phoenix-rc1';
const UNITY_PREFIX = 'unity/cc001-r16/CoreClash-V149-Unity/';
const SCHEMA = 'CC001_R17_W9_A70_INTEGRATION_ALLOWLIST_V1';
const HEX40 = /^[a-f0-9]{40}$/;
const BAD_MARKERS = ['CC001_PHOENIX_DIAGNOSTIC'];

function git(repo, ...args) {
  const p = cp.spawnSync('git', ['-C', repo, ...args], { encoding:'utf8', timeout:30000, maxBuffer:16*1024*1024 });
  if (p.error || p.status !== 0) throw new Error('git '+args[0]+' failed: '+(p.stderr||p.error?.message||p.status));
  return p.stdout;
}
function validGitPath(p) {
  return typeof p === 'string' && p.startsWith(UNITY_PREFIX) &&
    !p.includes('\\') && !p.includes('\0') &&
    !p.split('/').some(s=>!s || s === '..' || s === '.') &&
    p.endsWith('.cs');
}
function protectedPath(p) {
  return p.endsWith('.meta') || p.endsWith('/Tests/Program.cs') ||
    /(?:^|\/)(?:Packages|ProjectSettings|Reference|Resources\/Data)\//.test(p) ||
    /(?:catalog|NgoWireProtocol|\.gitattributes|\.gitignore)/i.test(p) ||
    p.includes('/Evidence/R16/');
}
function validateManifest(manifest, base) {
  if (!manifest || manifest.schema !== SCHEMA) throw new Error('schema mismatch');
  if (manifest.baseSha !== base) throw new Error('manifest base SHA mismatch');
  if (!Array.isArray(manifest.changes) || manifest.changes.length===0) throw new Error('missing changes');
  const approved = new Map();
  for (const item of manifest.changes) {
    if(!validGitPath(item?.path) || protectedPath(item.path)) throw new Error('unsafe/unsupported source path: '+item?.path);
    if(!/^A(?:20|31|40|41|50|51|72)$/.test(item.owner||'')) throw new Error('owner must be named approved CC-001 role');
    if(!HEX40.test(item.blobSha||'')) throw new Error('missing exact Git blob SHA: '+item.path);
    if(approved.has(item.path)) throw new Error('duplicate manifest path: '+item.path);
    approved.set(item.path,item);
  }
  return approved;
}
function evaluate({repo, candidate, manifest, base=PINNED_RC1, requirePinnedRef=true}) {
  const errors=[], checks={};
  try {
    if(!HEX40.test(base) || !HEX40.test(candidate)) throw new Error('expected 40-hex commit SHAs');
    const root=path.resolve(repo);
    const actualBase=git(root,'rev-parse','--verify',base+'^{commit}').trim();
    const actualCandidate=git(root,'rev-parse','--verify',candidate+'^{commit}').trim();
    checks.exactCommitInputs=actualBase===base && actualCandidate===candidate;
    if(!checks.exactCommitInputs)throw new Error('unresolved commit SHA input');
    if(requirePinnedRef) {
      const liveRef=git(root,'rev-parse','--verify',PINNED_REF).trim();
      checks.rc1RefUnchanged=liveRef===PINNED_RC1 && base===PINNED_RC1;
      if(!checks.rc1RefUnchanged) errors.push('protected RC1 ref drift: '+liveRef);
    }
    const ancestor=git(root,'merge-base',base,candidate).trim();
    checks.linearDescendant=ancestor===base;
    if(!checks.linearDescendant)errors.push('candidate does not descend directly from the pinned RC1 source');
    const approved=validateManifest(manifest,base);
    const raw=git(root,'diff','--name-status','-z','--no-renames',base,candidate);
    const parts=raw?raw.split('\0').filter(Boolean):[];
    const delta=[];
    for(let i=0;i<parts.length;i+=2){
      const status=parts[i],file=parts[i+1];
      if(!file){errors.push('malformed diff output');break;}
      delta.push({status,path:file});
      if(status!=='M')errors.push('only in-place source modifications permitted: '+status+' '+file);
      if(!validGitPath(file) || protectedPath(file)) errors.push('path excluded from A70 W9 integration: '+file);
      const allow=approved.get(file);
      if(!allow) errors.push('HQ exact path authorization missing: '+file);
      if(allow && status==='M'){
        const observed=git(root,'rev-parse',candidate+':'+file).trim();
        if(observed!==allow.blobSha)errors.push('source blob differs from pinned owner SHA: '+file+' expected='+allow.blobSha+' actual='+observed);
        const content=git(root,'show',candidate+':'+file);
        for(const marker of BAD_MARKERS)if(content.includes(marker))errors.push('diagnostic compile marker forbidden: '+file);
      }
    }
    if(delta.length===0)errors.push('candidate has no W9 code changes');
    for(const p of approved.keys())if(!delta.some(x=>x.path===p))errors.push('manifest claims path missing from candidate delta: '+p);
    checks.allowlistExact=errors.length===0;
    return {gate:errors.length?'HOLD':'SOURCE_ONLY_PASS',baseSha:base,candidateSha:candidate,changes:delta,checks,errors,
      limits:'NO Unity/managed/network QA performed; no ref updates, merge, main or release.'};
  }catch(e){return {gate:'HOLD',baseSha:base,candidateSha:candidate,checks,errors:[...errors,e.message],
    limits:'Input/config/Git validation failed; no write performed.'};}
}
function main(args) {
  const options={};
  for (const a of args) {
    const m=/^--(repo|candidate|manifest)=(.+)$/.exec(a);
    if(!m) { console.error('Usage: node rc1-integration-gate.cjs --repo=/path/repo --candidate=EXACT_40HEX_SHA --manifest=/path/HQ_manifest.json'); return 2; }
    options[m[1]]=m[2];
  }
  if(!options.repo || !options.candidate || !options.manifest){console.error('Missing required args: --repo, --candidate, --manifest');return 2;}
  let manifest;
  try{manifest=JSON.parse(fs.readFileSync(options.manifest,'utf8'));}catch(e){console.error('Invalid manifest: '+e.message);return 2;}
  const result=evaluate({repo:options.repo,candidate:options.candidate,manifest});
  console.log(JSON.stringify(result,null,2));
  return result.gate==='SOURCE_ONLY_PASS'?0:1;
}
if (require.main===module) process.exitCode=main(process.argv.slice(2));
module.exports={PINNED_RC1,PINNED_REF,SCHEMA,evaluate,validGitPath,protectedPath,validateManifest};
