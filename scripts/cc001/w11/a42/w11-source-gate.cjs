'use strict';
// CC-001 R17-W11 A42: fail-closed A70 candidate contract. Read-only Git; not a Unity build.
const cp=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const A70_REF='integration/cc001-r17-w11-multiplayer-qa-candidate-20261030';
const PINNED='173273122c11cbf738e8b954e32506a6196fe8ec';
const UNITY='unity/cc001-r16/CoreClash-V149-Unity/';
const unit={
 network:'Assets/CoreClash/Networking/NetworkGameSession.cs',
 ngo:'Assets/CoreClash/Networking/NgoGameSession.cs',
 smoother:'Assets/CoreClash/Presentation/RemoteBallSmoother.cs',
 app:'Assets/CoreClash/Presentation/CoreClashApp.cs',
 board:'Assets/CoreClash/Presentation/BoardView.cs',
 ball:'Assets/CoreClash/Presentation/BallView.cs',
 match:'Assets/CoreClash/Presentation/MatchView.cs',
 selection:'Assets/CoreClash/Presentation/BallSelection.cs',
 protocol:'Assets/CoreClash/Networking/NgoWireProtocol.cs',
 revisionTests:'Tests/RemoteBallSmootherTests.cs',
 authorityTests:'Tests/AbilityTests.cs',
 testsProgram:'Tests/Program.cs'
};
const protectedPrefixes=['unity/cc001-r16/CoreClash-V149-Unity/Assets/Resources/Data/',
 'unity/cc001-r16/CoreClash-V149-Unity/ProjectSettings/',
 'unity/cc001-r16/CoreClash-V149-Unity/Packages/',
 'unity/cc001-r16/CoreClash-V149-Unity/Assets/Scenes/'];
const approvedA41ParityTools=new Set(['scripts/cc001/w11/a41/state-parity.cjs','scripts/cc001/w11/a41/state-parity.test.cjs']);
const protectedExact=[
 UNITY+'Assets/CoreClash/Networking/NgoWireProtocol.cs',
 UNITY+'Assets/CoreClash/Editor/BuildTools.cs',
 UNITY+'Tests/Program.cs.meta'
];
const expectedPatterns={
 ADAPTIVE_CADENCE:[
  ['class',/class NetworkSnapshotRate/],
  ['small',/MovingSeconds\s*=\s*0?\.05f/],
  ['8K',/compressedBytes\s*>=\s*8\s*\*\s*1024/],
  ['16K',/compressedBytes\s*>=\s*16\s*\*\s*1024/],
  ['64K',/compressedBytes\s*>=\s*64\s*\*\s*1024/]],
 ACK_SEQUENCE:[
  ['receipt',/class NetworkIntentReceipt/],
  ['match',/NetworkIntentReceipt\.MatchesPending\s*\(/]],
 SNAPSHOT_WIRING:[
  ['rate',/NetworkSnapshotRate\.Interval\s*\(/],
  ['compressedSize',/\.Interval\s*\(\s*app\.Simulation\.State\.phase\s*,\s*packed\.Length\s*\)/],
  ['adapter',/adapter\.Apply\s*\(/],
  ['receive',/app\.ReceiveNetworkState\s*\(\s*adapter\.State\s*,\s*revision\s*\)/]],
 VISUAL_INTERPOLATION:[
  ['class',/class RemoteBallSmoother/],
  ['observe',/\bObserve\s*\(\s*GameState/],
  ['tryPose',/\bTryGetPosition\s*\(/],
  ['instants',/class RemoteSnapshotEvents/],
  ['appObserve',/remoteBallSmoother\.Observe\s*\(/],
  ['appState',/Simulation\.State\s*=\s*state/],
  ['boardTry',/remoteVisual\.TryGetPosition\s*\(/],
  ['boardDraw',/BallView\.Render\s*\(/]],
 REVISION_GUARD:[
  ['appSignature',/ReceiveNetworkState\s*\(\s*GameState\s+state\s*,\s*int\s+snapshotRevision(?:\s*=\s*-1)?\s*\)/],
  ['appForward',/remoteBallSmoother\.Observe\s*\(\s*state\s*,\s*Time\.unscaledTime\s*,\s*instantBallIds\s*,\s*snapshotRevision\s*\)/],
  ['smootherSignature',/void\s+Observe\s*\(\s*GameState\s+state\s*,\s*float\s+now\s*,\s*ISet<int>\s+instantBallIds\s*=\s*null\s*,\s*int\s+snapshotRevision\s*=\s*-1\s*\)/],
  ['staleRefusal',/snapshotRevision\s*<=\s*lastSnapshotRevision\s*\)\s*return/],
  ['applicationGuard',/RemoteSnapshotEvents\.IsFreshRevision\s*\(\s*remoteLastRevision\s*,\s*snapshotRevision\s*\)\s*\)\s*return/],
  ['sessionCursorReset',/remoteLastEventId\s*=\s*remoteLastRevision\s*=\s*0/],
  ['4HzDuration',/MaxDuration\s*=\s*0?\.25f/],
  ['clientGuardRegressionTest',/A30 W11 application rejects duplicate, zero and reversed revisions/],
  ['lastAccepted',/lastSnapshotRevision\s*=\s*snapshotRevision/],
  ['sessionReset',/void\s+Reset\s*\(\s*\)\s*\{[^}]*lastSnapshotRevision\s*=\s*-1/],
  ['revisionRegressionTests',/A70 W11 repeated and older snapshot revisions cannot overwrite client visual pose/],
  ['resetRegressionTests',/A70 W11 new session reset allows low snapshot revision again/],
  ['p2AuthorityTests',/W10 A40 P2 authoritative snapshot preserves moving ball owner position and action/],
  ['phoenixAuthorTests',/W10 A40 P2 ready Phoenix hand is consumed exactly once by authoritative remote intent/],
  ['registeredTests',/RemoteBallSmootherTests\s*\(\s*\)/]],
 PLAYER_UI:[
  ['localOwner',/LocalTurnPresentation\.ActionHint\s*\(/],
  ['localDeck',/LocalDeckContent\.DisplayOwner\s*\(/],
  ['aimStroke',/\bAimStroke\s*\(/],
  ['perspective',/viewOwner\s*=\s*localOwner\s*==\s*1/]]
};
function contracts(s) {
 const files=Object.fromEntries(Object.entries(unit).map(([key,p])=>[key,String(s[key]||'')]));
 const join={
  ADAPTIVE_CADENCE:files.network,
  ACK_SEQUENCE:files.network+'\n'+files.ngo,
  SNAPSHOT_WIRING:files.ngo,
  VISUAL_INTERPOLATION:files.smoother+'\n'+files.app+'\n'+files.board,
  REVISION_GUARD:files.app+'\n'+files.smoother+'\n'+files.revisionTests+'\n'+files.authorityTests+'\n'+files.testsProgram,
  PLAYER_UI:files.selection+'\n'+files.match+'\n'+files.board
 };
 let faults=[];
 for(const [group,patterns] of Object.entries(expectedPatterns)){
  for(const [name,re] of patterns)if(!re.test(join[group]))faults.push(group+'/'+name);
 }
 if(/\blastPower\b|\breleasedAt\b/.test(files.match))faults.push('POWER_UI/POST_SHOT_METER');
 if(/CC001_PHOENIX_DIAGNOSTIC/.test(Object.values(files).join('\n')))faults.push('PROTECTED/DIAGNOSTIC_MARKER');
 if(!/RemoteSnapshotEvents\.InstantBallIds/.test(files.app))faults.push('VISUAL_INTERPOLATION/PORTAL_INSTANT');
 if(!/remoteBallSmoother\.Reset\s*\(/.test(files.app))faults.push('VISUAL_INTERPOLATION/SESSION_RESET');
 const ui=files.app.slice(files.app.indexOf('ReceiveNetworkState('));
 const guard=ui.indexOf('RemoteSnapshotEvents.IsFreshRevision');
 const stateWrite=ui.indexOf('Simulation.State=state');
 const cursorWrite=ui.indexOf('remoteLastEventId=latestEventId');
 if(guard<0||stateWrite<0||guard>=stateWrite||(cursorWrite>=0&&guard>=cursorWrite))faults.push('REVISION_GUARD/BEFORE_STATE_AND_EVENT_CURSOR');
 return [...new Set(faults)];
}
const sha=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const safeChanged=x=>{
 if(typeof x!=='string'||!x.startsWith(UNITY)||x.includes('\\')||x.includes('..'))return false;
 const local=x.slice(UNITY.length);
 return (/^Assets\/CoreClash\/Networking\/[^/]+\.cs$/.test(local)||
  /^Assets\/CoreClash\/Presentation\/[^/]+\.cs(?:\.meta)?$/.test(local)||
  /^Tests\/[^/]+\.(?:cs|csproj)$/.test(local));
};
function assess(input) {
 const failures=[];
 if(input.ref!==A70_REF) failures.push('UNAPPROVED_A70_BRANCH');
 if(!sha(input.head)||input.head===RC1) failures.push('INVALID_NEW_SHA');
 if(input.head!==PINNED) failures.push('NOT_PINNED_W11_PR207_SHA');
 if(input.ownerRemoteSha!==input.head) failures.push('A70_REF_NOT_AT_EXACT_SHA');
 if(input.mergeBase!==RC1) failures.push('NOT_DESCENDANT_OF_FROZEN_RC1');
 if(input.dirty) failures.push('WORKTREE_NOT_CLEAN');
 if(input.diffCheck!==true) failures.push('GIT_DIFF_CHECK_FAILED');
 const changes=input.changes||[];
 const seen=new Set();
 for(const x of changes){
  if(seen.has(x.path))failures.push('DUPLICATE_CHANGED_PATH');
  seen.add(x.path);
  if(x.status==='D'||x.status==='R'||x.status==='C')failures.push('DELETION_RENAME_COPY_FORBIDDEN');
  if(!safeChanged(x.path)&&!(approvedA41ParityTools.has(x.path)&&x.status==='A')&&!x.path.startsWith('scripts/cc001/w9/a33/')&&!x.path.startsWith('docs/cc001/swarm/w9/A33/'))
   failures.push('CHANGED_PATH_OUTSIDE_GAMEPLAY_SCOPE');
  if(protectedPrefixes.some(pre=>x.path.startsWith(pre))||protectedExact.includes(x.path))
   failures.push('PROTECTED_SOURCE_CHANGED');
  if(x.path.endsWith('.meta')){
   if(x.status!=='A'||!seen.has(x.path.slice(0,-5))) {
    // Pair need not appear before .meta in sorted changes: verified in second pass below.
    if(x.status!=='A')failures.push('EXISTING_META_CHANGED');
   }
  }
 }
 for(const x of changes.filter(x=>x.path.endsWith('.meta')))
  if(!seen.has(x.path.slice(0,-5)))failures.push('ORPHAN_NEW_META');
 if(!changes.length)failures.push('NO_SELECTED_SOURCE_CHANGES');
 const sourceFaults=contracts(input.sources||{});
 failures.push(...sourceFaults);
 const errors=[...new Set(failures)];
 return {schema:'CC001-W11-A42-SOURCE-1',status:errors.length?'HOLD':'SOURCE_CONTRACT_READY_FOR_A70_A72_REVIEW',
  candidateSHA:input.head||null,ownerRef:A70_REF,frozenRC1:RC1,changedPaths:changes.length,
  failures:errors,sourceFaults,
  gates:{nativeUnity:'NOT_RUN',windowsPlayer:'NOT_RUN',pc1Pc2:'NOT_RUN',independentA60:'NOT_RUN',release:'STOP'},
  meaning:'Source and owner-ref evidence only. Never assert that physical ball stutter, synchronization or Windows build passed.'};
}
function git(cwd,args) {
 const r=cp.spawnSync('git',args,{cwd,encoding:'utf8',maxBuffer:12*1024*1024});
 if(r.error||r.status!==0)throw Error('GIT_'+args[0]+'_FAILED '+(r.stderr||r.error?.message||''));
 return r.stdout.trim();
}
function assessRepository(cwd,expected) {
 if(!sha(expected)||expected===RC1)throw Error('EXPECTED_NEW_A70_SHA_REQUIRED');
 const remote=git(cwd,['ls-remote','--exit-code','origin','refs/heads/'+A70_REF]);
 const ownerRemoteSha=remote.split(/\s+/)[0];
 const head=git(cwd,['rev-parse',expected+'^{commit}']);
 const mergeBase=git(cwd,['merge-base',RC1,head]);
 const dirty=Boolean(git(cwd,['status','--porcelain=v1','--untracked-files=normal']));
 const check=cp.spawnSync('git',['diff','--check',RC1,head],{cwd,encoding:'utf8'});
 const raw=cp.spawnSync('git',['diff','--name-status','-z','--no-renames',RC1,head],{cwd,encoding:'buffer'});
 if(raw.error||raw.status!==0)throw Error('GIT_DIFF_NAMES_FAILED');
 const entries=raw.stdout.toString('utf8').split('\0').filter(Boolean),changes=[];
 if(entries.length%2)throw Error('MALFORMED_GIT_DIFF');
 for(let i=0;i<entries.length;i+=2)changes.push({status:entries[i],path:entries[i+1]});
 const sources={};
 for(const [k,p] of Object.entries(unit)){
  if(k==='protocol')continue; // exact protocol drift is already blocked in changed-path protection
  try{sources[k]=git(cwd,['show',head+':'+UNITY+p])}catch(e){sources[k]='';}
 }
 return assess({ref:A70_REF,head,ownerRemoteSha,mergeBase,dirty,diffCheck:check.status===0,changes,sources});
}
function argsMap(argv) {
 let args={};
 for(const x of argv){const m=/^--(repo|sha|out)=(.+)$/.exec(x);
  if(!m||args[m[1]])throw Error('Usage: node w11-source-gate.cjs --repo=FULL_GIT_CLONE --sha=EXACT_A70_SHA [--out=FRESH_RESULT_JSON]');
  args[m[1]]=m[2];
 }
 if(!args.repo||!args.sha)throw Error('Missing --repo or --sha');
 return args;
}
if(require.main===module){
 try{
  const a=argsMap(process.argv.slice(2)),report=assessRepository(path.resolve(a.repo),a.sha),json=JSON.stringify(report,null,2)+'\n';
  if(a.out)fs.writeFileSync(a.out,json,{flag:'wx'});else process.stdout.write(json);
  process.exitCode=report.status==='HOLD'?2:0;
 }catch(e){process.stderr.write('A42_W11_HOLD '+e.message+'\n');process.exitCode=3;}
}
module.exports={RC1,A70_REF,PINNED,UNITY,unit,contracts,assess,assessRepository};
