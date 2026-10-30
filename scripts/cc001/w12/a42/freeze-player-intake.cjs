'use strict';
// CC-001 W12 A42: strict source-to-original-player-byte admission, NOT a physical G3 test.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const FREEZE = '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const RC1 = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const REF = 'integration/cc001-r17-w11-qa-freeze-20261030';
const HEX = /^[0-9a-f]{64}$/i;
const REQUIRED_GATES = ['sourcePreExact','sourceAfterMaterialized','sourceNotMutated','unityExitZero','buildSucceeded','playerComplete','compilerResponseCaptured','playerDefineCorrect','noDiagnostic','buildMarker'];
const err = message => { throw new Error(message); };
function safeName(n) {
  return typeof n === 'string' && n.length > 0 && !n.startsWith('/') && !n.includes('\\') && !n.includes(':') &&
    n.split('/').every(p => p && p !== '.' && p !== '..' && !/[\u0000-\u001f]/.test(p));
}
function playerManifest(build) {
  const failures = [];
  if (!build || build.schema !== 'CC001-W10-A72-WINDOWS-1' || build.status !== 'PASS_BUILD_EVIDENCE_ONLY') failures.push('INVALID_A72_BUILD_REPORT');
  if (build?.ref !== REF || build?.candidateSHA !== FREEZE || build?.rc1Base !== RC1) failures.push('WRONG_A72_SOURCE_REF_OR_SHA');
  if (build?.unity?.exitCode !== 0 || build?.buildReport?.result !== 'Succeeded' || build?.buildReport?.errors !== 0) failures.push('UNITY_BUILD_UNVERIFIED');
  if (!build?.gates || REQUIRED_GATES.some(k => build.gates[k] !== true) || Object.values(build.gates).some(v => v !== true)) failures.push('BUILD_PROVENANCE_GATES_MISSING');
  if (!Array.isArray(build?.blockers) || build.blockers.length || !Array.isArray(build?.sourceChanges) || build.sourceChanges.length) failures.push('A72_SOURCE_OR_BLOCKER_LEDGER_INVALID');
  const entries = build?.playerInventory;
  const expected = new Map();
  if (!Array.isArray(entries) || !Number.isSafeInteger(build.playerCount) || build.playerCount < 50 || entries.length !== build.playerCount) failures.push('PLAYER_MANIFEST_INCOMPLETE');
  for (const e of Array.isArray(entries) ? entries : []) {
    if (!e || !safeName(e.path) || !Number.isSafeInteger(e.bytes) || e.bytes < 0 || !HEX.test(e.sha256 || '')) { failures.push('INVALID_PLAYER_ENTRY'); continue; }
    const key = e.path.toLowerCase();
    if (expected.has(key)) failures.push('DUPLICATE_WINDOWS_PLAYER_PATH');
    else expected.set(key, {path:e.path,bytes:e.bytes,sha256:e.sha256.toUpperCase()});
  }
  if (!expected.has('coreclash.exe') || !expected.has('coreclash_data/managed/assembly-csharp.dll')) failures.push('WINDOWS_EXE_OR_GAME_DLL_MISSING');
  return { failures:[...new Set(failures)], expected };
}
function checkReceipt(receipt) {
  return !!receipt && receipt.schema === 'CC001-W10-A72-RECEIPT-1' && receipt.status === 'PASS_BUILD_EVIDENCE_ONLY' && receipt.candidateSHA === FREEZE && receipt.rc1 === RC1;
}
function hashFile(file) {
  const st = fs.lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink()) err('NON_REGULAR_PLAYER_FILE');
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  const buf = Buffer.allocUnsafe(262144);
  try { for (;;) { const len = fs.readSync(fd,buf,0,buf.length,null); if (len === 0) break; hash.update(buf.subarray(0,len)); } }
  finally { fs.closeSync(fd); }
  return {bytes:st.size, sha256:hash.digest('hex').toUpperCase()};
}
function collect(root) {
  const real = fs.realpathSync(root); if (!fs.statSync(real).isDirectory()) err('PLAYER_NOT_DIRECTORY');
  const entries = new Map(), stack = [{absolute:real,relative:''}];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir.absolute,{withFileTypes:true})) {
      const name = dir.relative ? dir.relative+'/'+ent.name : ent.name;
      if (!safeName(name)) err('UNSAFE_PLAYER_PATH');
      const absolute = path.join(dir.absolute,ent.name), st=fs.lstatSync(absolute);
      if (st.isSymbolicLink()) err('PLAYER_SYMLINK');
      if (st.isDirectory()) stack.push({absolute,relative:name});
      else if (st.isFile()) {
        const key=name.toLowerCase();if(entries.has(key))err('DUPLICATE_WINDOWS_PATH');
        entries.set(key,{path:name,...hashFile(absolute)});
      } else err('PLAYER_SPECIAL_FILE');
    }
  }
  return {real,entries};
}
function inspectCopy(expected,root) {
  const problems=[];
  let actual;
  try { actual=collect(root); }
  catch(e) { return {status:'HOLD',count:0,problems:['FILE_READ_OR_UNSAFE:'+e.message]}; }
  for (const [key,record] of expected) {
    const entry=actual.entries.get(key);
    if (!entry) problems.push('MISSING:'+record.path);
    else if (entry.bytes!==record.bytes || entry.sha256!==record.sha256 || entry.path!==record.path) problems.push('BYTES_DIFFER:'+record.path);
  }
  for (const [key,record] of actual.entries) if (!expected.has(key)) problems.push('EXTRA:'+record.path);
  return {status:problems.length?'HOLD':'MATCHING_ORIGINAL_PLAYER_BYTES_ONLY',count:actual.entries.size,problems,real:actual.real};
}
function assessEvidence(build,receipt,pc1,pc2,source) {
  const parsed=playerManifest(build), failures=[...parsed.failures];
  if (!checkReceipt(receipt)) failures.push('INVALID_A72_RECEIPT');
  if (!source || source.ref!==REF || source.sha!==FREEZE || source.base!==RC1 || source.verified!==true) failures.push('FROZEN_GIT_SOURCE_NOT_VERIFIED');
  if (path.resolve(pc1) === path.resolve(pc2)) failures.push('DUPLICATE_PC_ROOT');
  const a=inspectCopy(parsed.expected,pc1),b=inspectCopy(parsed.expected,pc2);
  if (a.real && b.real && a.real===b.real) failures.push('IDENTICAL_PC_DIRECTORY');
  if (a.status!=='MATCHING_ORIGINAL_PLAYER_BYTES_ONLY') failures.push('PC1_PLAYER_BYTES_HOLD');
  if (b.status!=='MATCHING_ORIGINAL_PLAYER_BYTES_ONLY') failures.push('PC2_PLAYER_BYTES_HOLD');
  return {schema:'CC001-W12-A42-FREEZE-INTAKE-1', sourceSha:FREEZE, sourceRef:REF,
    status:failures.length?'HOLD':'READY_FOR_A60_INDEPENDENT_QA_ONLY',reasonCodes:[...new Set(failures)],
    pc1:{status:a.status,count:a.count,problems:a.problems},pc2:{status:b.status,count:b.count,problems:b.problems},
    physicalPcs:'NOT_ATTESTED',gameplay:'NOT_ATTESTED',G3:'NOT_ATTESTED',G4:'NOT_ATTESTED',release:'STOP'};
}
function git(repo,args) {
  const p=cp.spawnSync('git',['-C',repo,...args],{encoding:'utf8',maxBuffer:4*1024*1024});
  if (p.error || p.status!==0) err('GIT_CHECK_FAILED:'+args[0]);
  return p.stdout.trim();
}
function verifyFreeze(repo) {
  const absolute=path.resolve(repo);
  const line=git(absolute,['ls-remote','--exit-code','origin','refs/heads/'+REF]);
  const remote=line.split(/\s+/)[0];
  if (remote!==FREEZE) err('FREEZE_REF_MOVED');
  if (git(absolute,['rev-parse','HEAD'])!==FREEZE) err('SOURCE_CHECKOUT_WRONG_SHA');
  if (git(absolute,['merge-base',RC1,FREEZE])!==RC1) err('RC1_ANCESTRY_BROKEN');
  if (git(absolute,['status','--porcelain=v1','--untracked-files=normal'])) err('SOURCE_WORKTREE_DIRTY');
  const diff=cp.spawnSync('git',['-C',absolute,'diff','--check',RC1,FREEZE],{encoding:'utf8'});
  if (diff.error || diff.status!==0)err('SOURCE_GIT_DIFF_CHECK_FAILED');
  return {ref:REF,sha:FREEZE,base:RC1,verified:true};
}
function parseArgs(argv) {
  const accepted=new Set(['repo','summary','receipt','pc1','pc2','out']);const x={};
  for (const arg of argv) {const m=/^--([a-z0-9]+)=(.+)$/.exec(arg);if(!m||!accepted.has(m[1])||x[m[1]])err('INVALID_CLI_ARG');x[m[1]]=m[2];}
  for (const key of ['repo','summary','receipt','pc1','pc2'])if(!x[key])err('MISSING_ARG_'+key);
  return x;
}
function main(argv) {
  const a=parseArgs(argv),source=verifyFreeze(a.repo);
  const files={};for (const key of ['summary','receipt']) {const input=fs.readFileSync(a[key]);files[key]={sha256:crypto.createHash('sha256').update(input).digest('hex'),bytes:input.length};}
  const report=assessEvidence(JSON.parse(fs.readFileSync(a.summary,'utf8')),JSON.parse(fs.readFileSync(a.receipt,'utf8')),a.pc1,a.pc2,source);
  report.originalEvidence=files;const body=JSON.stringify(report,null,2)+'\n';
  if(a.out)fs.writeFileSync(a.out,body,{flag:'wx'});else process.stdout.write(body);
  return report.status==='HOLD'?2:0;
}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2))}catch(e){console.error('A42_W12_STOP '+e.message);process.exitCode=3}}
module.exports={FREEZE,RC1,REF,playerManifest,checkReceipt,hashFile,collect,inspectCopy,assessEvidence,verifyFreeze,parseArgs,main};
