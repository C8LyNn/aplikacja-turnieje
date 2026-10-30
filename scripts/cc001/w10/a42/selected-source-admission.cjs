'use strict';
/*
 * CC-001 R17-W10 A42 fail-closed selected-source admission.
 * Read-only Git operations. Not a build, merge, or physical multiplayer test.
 */
const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const BASE = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const SELECTED = 'e6470dce9ff02fc294c4df15bde82952350b42b2'; // A30 draft PR #175, proposed for A70 review
const ROOT = 'unity/cc001-r16/CoreClash-V149-Unity/';
const required = [
 'Assets/CoreClash/Networking/NetworkGameSession.cs',
 'Assets/CoreClash/Networking/NgoGameSession.cs',
 'Assets/CoreClash/Presentation/BallView.cs',
 'Assets/CoreClash/Presentation/BoardView.cs',
 'Assets/CoreClash/Presentation/CoreClashApp.cs',
 'Assets/CoreClash/Presentation/MatchLayout.cs',
 'Assets/CoreClash/Presentation/MatchView.cs',
 'Tests/NetworkSeatTests.cs',
 'Tests/PresentationTests.cs'
].map(x => ROOT+x).sort();
const competing = Object.freeze({
 '163':['Assets/CoreClash/Networking/NetworkGameSession.cs','Assets/CoreClash/Networking/NgoGameSession.cs','Tests/NetworkSeatTests.cs'],
 '168':['Assets/CoreClash/Presentation/BoardView.cs','Assets/CoreClash/Presentation/MatchView.cs','Tests/PresentationTests.cs'],
 '170':['Assets/CoreClash/Presentation/MatchView.cs'],
 '174':['Assets/CoreClash/Presentation/BallView.cs','Assets/CoreClash/Presentation/BoardView.cs','Assets/CoreClash/Presentation/CoreClashApp.cs','Assets/CoreClash/Presentation/MatchView.cs'],
 '160':['Assets/CoreClash/Presentation/MatchView.cs'],
 '173':['Assets/CoreClash/Presentation/MatchView.cs']
});
function overlap(pathList, competitors=competing) {
  const s=new Set(pathList);
  return Object.fromEntries(Object.entries(competitors)
    .map(([pr,ps])=>[pr,ps.map(x=>ROOT+x).filter(x=>s.has(x))])
    .filter(([,common])=>common.length));
}
function assess(input) {
  const failures=[];
  if(input.base!==BASE) failures.push('WRONG_FROZEN_RC1_SHA');
  if(input.head!==SELECTED) failures.push('UNPINNED_SELECTED_SHA');
  if(input.mergeBase!==BASE) failures.push('CANDIDATE_NOT_EXACT_RC1_DESCENDANT');
  if(input.dirty===true) failures.push('DIRTY_CHECKOUT');
  if(input.diffCheck!==true) failures.push('GIT_DIFF_CHECK_FAILED');
  const changes=(input.changes||[]).slice().sort(), unique=new Set(changes);
  if(unique.size!==changes.length) failures.push('DUPLICATE_CHANGED_PATH');
  if(changes.some(x=>x.includes('..') || x.includes('\\') || x.startsWith('/') || /(^|\/)\.git(\/|$)/.test(x))) failures.push('UNSAFE_PATH');
  const extra=changes.filter(x=>!required.includes(x)),missing=required.filter(x=>!unique.has(x));
  if(extra.length) failures.push('UNEXPECTED_CHANGED_PATHS');
  if(missing.length) failures.push('MISSING_SELECTED_PATHS');
  if((input.deletions||[]).length) failures.push('DELETION_NOT_ALLOWED');
  if((input.additions||[]).length) failures.push('UNEXPECTED_ADDITION');
  const cadence=String(input.cadenceSource||''),session=String(input.sessionSource||'');
  if(!/MovingSeconds\s*=\s*\.05f\s*;/.test(cadence)||
     !/StableSeconds\s*=\s*\.25f\s*;/.test(cadence)||
     !/MatchPhase\.Moving\s*\?\s*MovingSeconds\s*:\s*StableSeconds/.test(cadence))
    failures.push('SOURCE_CADENCE_CONTRACT_MISMATCH');
  if(!/nextSnapshot\s*=\s*Time\.unscaledTime\s*\+\s*NetworkSnapshotCadence\.For\s*\(/.test(session))
    failures.push('SOURCE_CADENCE_NOT_WIRED');
  if(/CC001_PHOENIX_DIAGNOSTIC/.test(cadence+session)) failures.push('DIAGNOSTIC_MARKER_FORBIDDEN');
  const clashes=overlap(changes);
  return {
    subject:'CC-001/R17-W10/A42/selected-source',
    selectedPr:175, sourceSha:SELECTED, baseSha:BASE, status:failures.length?'HOLD':'SOURCE_SCOPE_READY_FOR_A70_REVIEW',
    checks:{sourcePaths:changes.length,expectedPaths:required.length,extra,missing},
    competingPrFileOverlaps:clashes,
    selectedPolicy:'ONE A30 #175 source candidate only; do NOT stack PR163/168/170/174/160/173 as whole branches',
    sourceNote:'Original RC1 Moving cadence is 0.2s, NOT 2.0s. A30 proposed is 0.05s; runtime bandwidth/stutter still requires A60 two-PC evidence.',
    execution:{unityBuild:'NOT_RUN',pc1Pc2:'NOT_RUN',independentQA:'NOT_RUN',release:'STOP'},
    failures
  };
}
function runGit(cwd,args) {
  const r=cp.spawnSync('git',args,{cwd,encoding:'utf8',maxBuffer:8*1024*1024});
  if(r.error||r.status!==0) throw Error('GIT_'+args[0]+'_FAILED '+(r.stderr||r.error?.message||''));
  return r.stdout;
}
function assessRepo(cwd) {
  const mergeBase=runGit(cwd,['merge-base',BASE,SELECTED]).trim();
  const status=runGit(cwd,['status','--porcelain=v1','--untracked-files=normal']);
  const raw=runGit(cwd,['diff','--name-status','-z',BASE,SELECTED]).split('\0').filter(Boolean);
  const changes=[],deletions=[],additions=[];
  for(let i=0;i<raw.length;i++){
    const action=raw[i++];
    const name=raw[i];
    if(/^[RC]/.test(action)) throw Error('RENAMED_OR_COPIED_PATH_FORBIDDEN');
    changes.push(name);
    if(action==='D') deletions.push(name);
    if(action==='A') additions.push(name);
  }
  const diffCheck=cp.spawnSync('git',['diff','--check',BASE,SELECTED],{cwd,encoding:'utf8'});
  const cadenceSource=runGit(cwd,['show',SELECTED+':'+ROOT+'Assets/CoreClash/Networking/NetworkGameSession.cs']);
  const sessionSource=runGit(cwd,['show',SELECTED+':'+ROOT+'Assets/CoreClash/Networking/NgoGameSession.cs']);
  return assess({base:BASE,head:SELECTED,mergeBase,dirty:Boolean(status.trim()),diffCheck:diffCheck.status===0,
    changes,deletions,additions,cadenceSource,sessionSource});
}
if(require.main===module) {
  try {
    const result=assessRepo(process.argv[2]||process.cwd());
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    process.exitCode=result.failures.length?2:0;
  }catch(e){process.stderr.write('A42_W10_ADMISSION_ERROR '+e.message+'\n');process.exitCode=3;}
}
module.exports={BASE,SELECTED,ROOT,required,competing,overlap,assess,assessRepo};
