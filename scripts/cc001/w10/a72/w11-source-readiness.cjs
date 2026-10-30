'use strict';
// CC-001 W11 A72: source-level Windows-build admission for the selected A70 candidate.
// This gates *build spending*, never attests rendering, networking, physics or G3.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ROOT = 'unity/cc001-r16/CoreClash-V149-Unity';
const SHA = /^[a-f0-9]{40}$/;
const FILES = Object.freeze({
  ngo:'Assets/CoreClash/Networking/NgoGameSession.cs',
  app:'Assets/CoreClash/Presentation/CoreClashApp.cs',
  board:'Assets/CoreClash/Presentation/BoardView.cs',
  match:'Assets/CoreClash/Presentation/MatchView.cs',
  smoother:'Assets/CoreClash/Presentation/RemoteBallSmoother.cs',
});
function inspect(source, candidateSHA) {
  if (!SHA.test(candidateSHA || '')) throw Error('An exact candidate SHA is mandatory');
  for (const key of Object.keys(FILES)) if (typeof source[key] !== 'string' || !source[key].length) throw Error('Missing source: '+FILES[key]);
  const ngo=source.ngo, app=source.app, board=source.board, match=source.match, smoother=source.smoother;
  const gates = [
    {id:'snapshot_revision_admitted',pass:/\badapter\.Apply\s*\(/.test(ngo)&&/\bLastAppliedRevision\s*=\s*revision\s*;/.test(ngo),why:'NGO must accept authoritative revision via adapter before rendering'},
    {id:'revision_forwarded_and_monotonic',pass:/\bapp\.ReceiveNetworkState\s*\(\s*adapter\.State\s*,\s*revision\s*\)/.test(ngo)&&/\bReceiveNetworkState\s*\(\s*GameState\s+state\s*,\s*int\s+snapshotRevision/.test(app)&&/\bremoteBallSmoother\.Observe\s*\(\s*state\s*,\s*Time\.unscaledTime\s*,\s*instantBallIds\s*,\s*snapshotRevision\s*\)/.test(app)&&/snapshotRevision\s*<=\s*lastSnapshotRevision/.test(smoother)&&/\bvoid\s+Reset\s*\(/.test(smoother),why:'Accepted NGO revision must reach A34 smoother, with monotonic visual sample guard and session reset'},
    {id:'local_visual_smoother_wired',pass:/\bRemoteBallSmoother\b/.test(app)&&/\bremoteBallSmoother\.Observe\s*\(/.test(app)&&/\bTryGetPosition\s*\(/.test(board),why:'Client must sample a visual pose buffer; mere unconnected helper does not qualify'},
    {id:'visual_pose_not_authority',pass:/\bSimulation\.State\s*=\s*state\s*;/.test(app)&&/\bremoteVisual\b/.test(board),why:'Visual cache must not replace authoritative game state'},
    {id:'residual_postshot_strength_strip_absent',pass:!/\bw\s*\*\s*lastPower\b/.test(match)&&!/\bDraw\.Round\s*\([^;]*\blastPower\b/s.test(match),why:'After-shot MatchView strength bar must not remain'},
    {id:'diagnostic_symbol_absent',pass:![ngo,app,board,match,smoother].some(s=>s.includes('CC001_PHOENIX_DIAGNOSTIC')),why:'No W7 diagnostic-only source allowed'},
  ];
  return {schema:'CC001-W11-A72-PREBUILD-1',candidateSHA,
    status:gates.every(x=>x.pass)?'GO_SOURCE_SHAPE_ONLY':'HOLD_SOURCE_BLOCKER',
    gates:gates.map(x=>({...x,status:x.pass?'PASS':'HOLD'})),
    note:'Source contract only. No Unity/.NET/PC1-PC2 runtime or gameplay PASS can be inferred.'};
}
function inspectDirectory(project,sha){
  const data={};for(const [key,rel] of Object.entries(FILES)){
    const p=path.join(project,...rel.split('/'));
    const st=fs.lstatSync(p);if(!st.isFile()||st.isSymbolicLink())throw Error('Unsafe source: '+rel);
    data[key]=fs.readFileSync(p,'utf8');
  }
  return inspect(data,sha);
}
function selfTest() {
  const sha='a'.repeat(40),pass={
    ngo:'if (adapter.Apply(packet, decode, out var reason)) { LastAppliedRevision=revision; app.ReceiveNetworkState(adapter.State,revision); }',
    app:'readonly RemoteBallSmoother remoteBallSmoother=new RemoteBallSmoother(); void ReceiveNetworkState(GameState state,int snapshotRevision=-1) { remoteBallSmoother.Observe(state,Time.unscaledTime,instantBallIds,snapshotRevision); Simulation.State=state; }',
    board:'if (remoteVisual != null && remoteVisual.TryGetPosition(id,now,out x,out y)) {}',
    match:'Draw.Text("TURN PLAYER");',
    smoother:'if(snapshotRevision>=0&&lastSnapshotRevision>=0&&snapshotRevision<=lastSnapshotRevision)return; void Reset() { lastSnapshotRevision=-1; }',
  };
  let n=0;const t=fn=>{fn();n++};const mutate=(key,content)=>({...pass,[key]:content});
  t(()=>assert.equal(inspect(pass,sha).status,'GO_SOURCE_SHAPE_ONLY'));
  t(()=>assert.equal(inspect(mutate('app','Simulation.State=state;'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('board','Draw.Text("BALL");'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('match','Draw.Round(new Rect(0,y+32,w*lastPower,5),color);'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('match','Draw.Round(new Rect(0,y+32,w * lastPower,5),color);'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('ngo','LastAppliedRevision=revision;'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('ngo','adapter.Apply(packet,decode,out reason);'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('app','RemoteBallSmoother x; remoteBallSmoother.Observe(state,now);'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('app',pass.app+' CC001_PHOENIX_DIAGNOSTIC'),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.throws(()=>inspect(pass,'NOT_SHA')));
  t(()=>assert.throws(()=>inspect(mutate('ngo',''),sha)));
  t(()=>assert.equal(inspect(pass,sha).gates.length,6));
  t(()=>assert.equal(inspect(pass,sha).candidateSHA,sha));
  t(()=>assert.equal(inspect(pass,sha).schema,'CC001-W11-A72-PREBUILD-1'));
  t(()=>assert.equal(inspect(pass,sha).gates.every(g=>g.status==='PASS'),true));
  t(()=>assert.equal(inspect(mutate('board','remoteVisual.TryGetPosition(ballId,now,out x,out y);'),sha).status,'GO_SOURCE_SHAPE_ONLY'));
  t(()=>assert.equal(inspect(mutate('match','// lastPower removed.\nDraw.Text("OK");'),sha).status,'GO_SOURCE_SHAPE_ONLY'));
  t(()=>assert.equal(inspect(mutate('ngo','adapter.Apply(packet,decode,out reason); LastAppliedRevision = revision ; app.ReceiveNetworkState(adapter.State,revision);'),sha).status,'GO_SOURCE_SHAPE_ONLY'));
  t(()=>assert.equal(inspect(mutate('ngo',pass.ngo.replace('adapter.State,revision','adapter.State')),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('app',pass.app.replace('instantBallIds,snapshotRevision','instantBallIds')),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('smoother',pass.smoother.replace('<=lastSnapshotRevision','>lastSnapshotRevision')),sha).status,'HOLD_SOURCE_BLOCKER'));
  t(()=>assert.equal(inspect(mutate('smoother',pass.smoother.replace('void Reset()', 'void Clear()')),sha).status,'HOLD_SOURCE_BLOCKER'));
  console.log(JSON.stringify({suite:'CC001-W11-A72-source-readiness',passed:n,failed:0}));
}
function main(args){if(args.length===1&&args[0]==='--self-test'){selfTest();return;}
  if(args.length!==2||!args[0].startsWith('--project=')||!args[1].startsWith('--sha='))throw Error('Usage: node w11-source-readiness.cjs --project=ABSOLUTE_UNITY_PROJECT --sha=EXACT40');
  const root=args[0].slice(10),sha=args[1].slice(6);
  if(!path.isAbsolute(root))throw Error('Absolute project path required');
  const result=inspectDirectory(root,sha);console.log(JSON.stringify(result,null,2));
  if(result.status!=='GO_SOURCE_SHAPE_ONLY')process.exitCode=2;
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error('A72 SOURCE STOP: '+e.message);process.exitCode=1;}}
module.exports={inspect,inspectDirectory,FILES,ROOT};
