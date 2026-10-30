#!/usr/bin/env node
'use strict';
// A60 R17-W11 independent, OFFLINE, source-contract admission test.
// It never builds Unity, starts a game, merges, or confers a G3/G4 runtime PASS.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = 'unity/cc001-r16/CoreClash-V149-Unity/';
const names = {
  ngo:'Assets/CoreClash/Networking/NgoGameSession.cs',
  net:'Assets/CoreClash/Networking/NetworkGameSession.cs',
  app:'Assets/CoreClash/Presentation/CoreClashApp.cs',
  board:'Assets/CoreClash/Presentation/BoardView.cs',
  match:'Assets/CoreClash/Presentation/MatchView.cs',
  sel:'Assets/CoreClash/Presentation/BallSelection.cs',
  deck:'Assets/CoreClash/Presentation/LocalDeckContent.cs',
  smooth:'Assets/CoreClash/Presentation/RemoteBallSmoother.cs',
  layout:'Assets/CoreClash/Presentation/MatchLayout.cs',
  runner:'Tests/Program.cs',
  csproj:'Tests/CoreClash.Tests.csproj',
  smoothtests:'Tests/RemoteBallSmootherTests.cs',
  decktests:'Tests/LocalDeckContentTests.cs',
  ntests:'Tests/NetworkSeatTests.cs',
  atests:'Tests/AbilityTests.cs',
  ptests:'Tests/PresentationTests.cs',
  smoothmeta:'Assets/CoreClash/Presentation/RemoteBallSmoother.cs.meta',
  deckmeta:'Assets/CoreClash/Presentation/LocalDeckContent.cs.meta'
};
function audit(s, sources = Object.keys(names)){
  const checks = {};
  const has=(k,re)=>typeof s[k]==='string' && (re instanceof RegExp?re.test(s[k]):s[k].includes(re));
  const gate=(name,ok,detail)=>checks[name]={status:ok?'PASS':'FAIL',detail};
  gate('ALL_REQUIRED_SOURCE_FILES',Object.keys(names).every(k=>typeof s[k]==='string'), 'All source and C# test/meta files must be present');
  gate('PROTOCOL149_NO_CHANGED_AUTHORITY',has('net',/\[Serializable\]\s*public\s+sealed\s+class\s+SessionSnapshot\s*\{[^}]*protocol=149/) &&
    !has('net',/\bprotocol\s*=\s*(?!149\b)\d+/) &&
    has('ngo',/command\.owner\s*!=\s*LocalOwner/) && has('ngo',/seat\.Owns\(sender\)/),
    'Protocol149 and authoritative identity admission');
  gate('SINGLE_ADAPTIVE_NETWORK_POLICY',has('net','class NetworkSnapshotRate') &&
    has('ngo',/NetworkSnapshotRate\.Interval\(\s*app\.Simulation\.State\.phase\s*,\s*packed\.Length\s*\)/) &&
    !has('ngo','NetworkSnapshotCadence.For('),
    'One compressed-bytes-aware broadcast rate; not the incompatible A30 fixed cadence');
  gate('RATE_20_12_8_4_HZ',has('net',/compressedBytes\s*>=\s*64\s*\*\s*1024/) &&
    has('net',/compressedBytes\s*>=\s*16\s*\*\s*1024/) &&
    has('net',/compressedBytes\s*>=\s*8\s*\*\s*1024/) &&
    has('net','return 1f/12f') && has('net','return 0.125f') &&
    has('net','return MovingSeconds'),
    'A41 rate limits are encoded, but actual throughput not measured');
  gate('STALE_P2_ACK_REJECTED',has('ngo','NetworkIntentReceipt.MatchesPending(') &&
    has('net','class NetworkIntentReceipt'),
    'An old P2 intent receipt cannot clear pending new command');
  gate('SINGLE_REMOTE_SMOOTHER',has('app','new RemoteBallSmoother()') &&
    has('smooth','class RemoteBallSmoother') &&
    !sources.some(x=>/RemoteBallPoseSmoother|Physics\/RemoteBallPoseSmoother/.test(x)) &&
    !Object.values(s).some(x=>typeof x==='string'&&x.includes('new RemoteBallPoseSmoother(')),
    'A34 wired visual smoother selected, A50 competing class not installed');
  gate('REMOTE_RENDER_PATH_WIRED',has('app',/remoteBallSmoother\.Observe\(\s*state\s*,\s*Time\.unscaledTime\s*,\s*instantBallIds\s*,\s*snapshotRevision\s*\)/) &&
    has('match','remoteBallSmoother:null') && has('board','remoteVisual.TryGetPosition(') &&
    has('ngo','app.ReceiveNetworkState(adapter.State,revision)'),
    'Accepted client snapshot reaches smoother and rendered ball position; not gameplay state');
  gate('W11_REVISION_FORWARD_AND_STALE_GUARD',
    has('ngo',/adapter\.Apply\(packet,JsonUtility\.FromJson<GameState>,out var reason\)/) &&
    has('ngo','app.ReceiveNetworkState(adapter.State,revision)') &&
    has('app',/ReceiveNetworkState\(GameState state,int snapshotRevision=-1\)/) &&
    has('app','remoteBallSmoother.Observe(state,Time.unscaledTime,instantBallIds,snapshotRevision)') &&
    has('smooth',/snapshotRevision>=0&&lastSnapshotRevision>=0&&snapshotRevision<=lastSnapshotRevision\)return/) &&
    has('smooth',/public void Reset\(\)\s*\{[^}]*lastSnapshotRevision=-1;/) &&
    has('smooth','lastSnapshotRevision=snapshotRevision;'),
    'Accepted Protocol149 revision propagates into client visual cache, rejecting duplicate/old samples');
  gate('SHORT_PORTAL_SNAP',has('smooth',/e\.kind\s*==\s*"PORTAL"/) &&
    has('smooth','instantBallIds.Contains(ball.id)') &&
    has('app','RemoteSnapshotEvents.InstantBallIds(state,remoteLastEventId,') &&
    has('app','remoteLastEventId=latestEventId'),
    'Fresh PORTAL event is one-shot bypass of interpolation');
  gate('SIMULATION_AUTHORITY_PRESERVED',has('app','Simulation.State=state') &&
    !has('smooth','Simulation.State=') && !has('smooth','sim.TryCommand('),
    'Visual-only pose path never writes authoritative physics/gameplay');
  gate('P2_LOCAL_TURN_AND_ACTION_GUARD',has('match','LocalTurnPresentation.ActionHint(') &&
    has('match','LocalTurnPresentation.Status(') &&
    has('sel',/multiplayer\s*&&\s*state\.turn\s*!=\s*localOwner/) &&
    has('sel',/multiplayer\s*&&\s*!connected/),
    'Connected local seat controls YOUR SHOT and drag action hints');
  gate('P2_OWN_BOTTOM_Y_INVERSE_X_CANONICAL',has('layout',/ViewX\([^\n]*=>\s*simulationX\s*;/) &&
    has('layout',/SimulationX\([^\n]*=>\s*viewX\s*;/) &&
    has('layout',/WorldHeight\s*-\s*simulationY/) &&
    has('layout',/WorldHeight\s*-\s*viewY/) &&
    has('app','MatchPerspective.SimulationY(viewY,ViewOwner)') &&
    has('board','MatchPerspective.ViewY('),
    'P2 vertical reflection and inverse pointer; gameplay uses canonical coordinates');
  gate('LOCAL_DECK_FAIL_CLOSED',has('match','LocalDeckContent.DisplayOwner(') &&
    has('deck',/networkOwner\.Value\s*==\s*0\s*\|\|\s*networkOwner\.Value\s*==\s*1/) &&
    has('deck','simulation.State.turn==owner') &&
    has('deck','localInputEnabled'),
    'Unknown network seat cannot activate P2 stock');
  gate('A10_ARROW_ONLY_NO_POWER_METER',!has('match','lastPower') &&
    !has('match','releasedAt') && !has('app','lastPower') &&
    !has('board',/RoundToInt\(\s*power\s*\*\s*100/) &&
    has('board','AimStroke(') && has('board','AimGuide.Trace('),
    'Arrow-only cue, no stale aftershot strip, aim guide retained');
  gate('W10_TESTS_REGISTERED',has('runner','RemoteBallSmootherTests();') &&
    has('runner','LocalDeckContentTests();') &&
    (has('csproj','<Compile Include="*.cs" />') || (has('csproj','RemoteBallSmootherTests.cs') && has('csproj','LocalDeckContentTests.cs'))) &&
    has('smoothtests','PORTAL') && has('decktests','LocalDeckContentTests') &&
    has('ntests','NetworkSnapshotRate.Interval') && has('ptests','NET-UX-01'),
    'New managed test definitions registered; tests NOT compiled by this gate');
  gate('W11_A40_AND_A70_CSHARP_REGRESSIONS',
    has('atests','host') && has('atests','Phoenix') && has('atests','snapshot') &&
    has('smoothtests','repeated and older snapshot revisions') &&
    has('smoothtests','new session reset allows low snapshot revision again') &&
    has('csproj','<Compile Include="*.cs" />'),
    'A40 P2/host/Phoenix and A70 revision managed test definitions included, not executed');
  gate('UNITY_NEW_ASSET_META',has('smoothmeta',/^guid:\s*[0-9a-f]{32}\s*$/m) &&
    has('deckmeta',/^guid:\s*[0-9a-f]{32}\s*$/m) &&
    (s.smoothmeta.match(/guid:\s*([0-9a-f]{32})/)||[])[1] !== (s.deckmeta.match(/guid:\s*([0-9a-f]{32})/)||[])[1],
    'New C# files have distinct Unity .meta GUIDs (full project GUID scan delegated to A71)');
  gate('RATE_TRACE_AND_SNAPSHOT_LOGGING',has('ngo','CC_W10_NET_HOST revision=') &&
    has('ngo','CC_W10_NET_CLIENT revision=') &&
    has('ngo','NetworkSnapshotTrace.Due('),
    'Trace exists, but 1Hz sampled logs cannot establish every-frame physics parity');
  const counts={pass:Object.values(checks).filter(x=>x.status==='PASS').length,
    fail:Object.values(checks).filter(x=>x.status==='FAIL').length};
  return {decision:counts.fail?'FAIL_SOURCE_CONTRACT':'PASS_SOURCE_CONTRACT_ONLY',counts,checks,
    physicalWindowsBuild:'NOT_RUN',physicalTwoPC:'NOT_RUN',release:'HOLD'};
}
function selfTest(){
  const keys=Object.keys(names),sample={};
  for(const k of keys)sample[k]='placeholder';
  const x=audit(sample);
  assert.equal(x.decision,'FAIL_SOURCE_CONTRACT');
  assert.equal(x.counts.fail>0,true);
  assert.equal(x.checks.ALL_REQUIRED_SOURCE_FILES.status,'PASS');
  const missing={...sample};delete missing.ngo;
  assert.equal(audit(missing).checks.ALL_REQUIRED_SOURCE_FILES.status,'FAIL');
  const badList=keys.concat('Assets/CoreClash/Physics/RemoteBallPoseSmoother.cs');
  assert.equal(audit(sample,badList).checks.SINGLE_REMOTE_SMOOTHER.status,'FAIL');
  assert.equal(audit(sample).physicalTwoPC,'NOT_RUN');
  console.log('A60 W11 gate: 6/6 synthetic control assertions PASS; actual source must be supplied separately');
}
if(require.main===module){
  if(process.argv[2]==='--self-test')selfTest();
  else if(process.argv.length!==4){
    console.error('Usage: node cc001-w11-candidate-contract.cjs REPO_ROOT EXACT_40_HEX_SHA | --self-test');
    process.exitCode=64;
  }else{
    try{
      const worktree=path.resolve(process.argv[2]),expected=process.argv[3];
      if(!/^[a-f0-9]{40}$/i.test(expected))throw Error('Expected 40-char SHA required');
      const actual=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8'}).trim();
      if(actual!==expected){console.log(JSON.stringify({decision:'HOLD_WRONG_HEAD',actual,expected}));process.exitCode=2;}
      else{
        const s={};
        for(const [k,p] of Object.entries(names))s[k]=fs.readFileSync(path.join(worktree,root,p),'utf8');
        const available=Object.values(names).concat('Assets/CoreClash/Physics/RemoteBallPoseSmoother.cs')
          .filter(p=>fs.existsSync(path.join(worktree,root,p)));
        const result=audit(s,available);
        console.log(JSON.stringify({expectedSha:expected,...result},null,2));
        process.exitCode=result.counts.fail?1:0;
      }
    }catch(e){console.error('Input unavailable: '+e.message);process.exitCode=64;}
  }
}
module.exports={audit,names};
