#!/usr/bin/env node
'use strict';
// A60 R17-W10: fail closed if the accepted NGO snapshot revision is discarded
// before the non-authoritative client visual smoother observes the snapshot.
const fs=require('node:fs');
const assert=require('node:assert/strict');
function inspect(ngo,app,board){
  const calls=[...ngo.matchAll(/\bapp\s*\.\s*ReceiveNetworkState\s*\(([^)]*)\)/g)]
    .map(m=>m[1].replace(/\s+/g,''));
  const forwarded=calls.length>0&&calls.every(s=>s==='adapter.State,revision');
  const admission=/adapter\.Apply\s*\(/.test(ngo);
  const accepts=/remoteBallPoseSmoother\.AcceptSnapshot\s*\(\s*snapshotRevision\s*,\s*state\s*,\s*Time\.unscaledTime\s*\)/.test(app);
  const guarded=/snapshotRevision\s*>=\s*0/.test(app);
  const drawn=/remoteVisual\.TryPose\s*\(/.test(board);
  const results={snapshotAdapterAdmission:admission,revisionForwarded:forwarded,smootherRevisionGuard:guarded,smootherAcceptsRevision:accepts,boardUsesSmoothedPose:drawn};
  return {decision:Object.values(results).every(Boolean)?'PASS':'FAIL',results,calls};
}
function selfTest(){
  const ngo='if(adapter.Apply(packet, decode, out reason))app.ReceiveNetworkState(adapter.State,revision);';
  const app='if(snapshotRevision>=0)remoteBallPoseSmoother.AcceptSnapshot(snapshotRevision,state,Time.unscaledTime);';
  const board='remoteVisual.TryPose(ball.id,Time.unscaledTime,out var x,out var y)';
  assert.equal(inspect(ngo,app,board).decision,'PASS');
  assert.equal(inspect(ngo.replace('adapter.State,revision','adapter.State'),app,board).decision,'FAIL');
  assert.equal(inspect(ngo,app.replace('AcceptSnapshot','Reset'),board).decision,'FAIL');
  assert.equal(inspect(ngo,app,board.replace('TryPose','IgnorePose')).decision,'FAIL');
  console.log('A60 W10 revision gate: 4/4 self-tests PASS (synthetic fixtures)');
}
if(require.main===module){
  if(process.argv[2]==='--self-test')selfTest();
  else if(process.argv.length!==5){console.error('Usage: node cc001-w10-snapshot-revision-gate.cjs NgoGameSession.cs CoreClashApp.cs BoardView.cs | --self-test');process.exitCode=64;}
  else {try{const files=process.argv.slice(2).map(p=>fs.readFileSync(p,'utf8'));const res=inspect(...files);console.log(JSON.stringify(res,null,2));process.exitCode=res.decision==='PASS'?0:1;}
  catch(e){console.error('Source read failed: '+e.message);process.exitCode=64;}}
}
module.exports={inspect};
