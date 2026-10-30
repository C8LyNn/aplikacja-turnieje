'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {RC1,A70_REF,UNITY,unit,assess,contracts}=require('./w11-source-gate.cjs');
const S='3a6fb11f70cbdd354ca319b6c48e5c080a1ae193';
const path=k=>UNITY+unit[k];
function sources(){
 return {
  network:'public class NetworkSnapshotRate { const float MovingSeconds=.05f; if(compressedBytes>=8*1024){} if(compressedBytes>=16*1024){} if(compressedBytes>=64*1024){} } class NetworkIntentReceipt {}',
  ngo:'NetworkIntentReceipt.MatchesPending(pendingIntent,pendingSequence,sequence);NetworkSnapshotRate.Interval(app.Simulation.State.phase,packed.Length);adapter.Apply(packet,parse,out reason);app.ReceiveNetworkState(adapter.State);',
  smoother:'class RemoteSnapshotEvents {} class RemoteBallSmoother { void Observe(GameState state){} bool TryGetPosition(int id){} }',
  app:'remoteBallSmoother.Observe(state);Simulation.State=state; RemoteSnapshotEvents.InstantBallIds(state);remoteBallSmoother.Reset();',
  board:'remoteVisual.TryGetPosition(ball.id);BallView.Render(foo); AimStroke(x,y); viewOwner=localOwner==1?1:0;',
  match:'LocalTurnPresentation.ActionHint(state); LocalDeckContent.DisplayOwner(turn,localOwner);',
  selection:'public class LocalTurnPresentation{}',
  ball:'BallView'
 };
}
function valid(extra={}) {
 return {ref:A70_REF,head:S,ownerRemoteSha:S,mergeBase:RC1,dirty:false,diffCheck:true,
 changes:[{path:path('network'),status:'M'},{path:path('ngo'),status:'M'},{path:path('smoother'),status:'A'},
 {path:path('smoother')+'.meta',status:'A'}],sources:sources(),...extra};
}
function expected(code,patch) {
 const report=assess(patch);
 assert.equal(report.status,'HOLD');
 assert(report.failures.includes(code),JSON.stringify(report.failures));
}
test('correct owner-selected candidate returns only source readiness, never build or QA PASS',()=>{
 const r=assess(valid());assert.equal(r.status,'SOURCE_CONTRACT_READY_FOR_A70_A72_REVIEW');
 assert.equal(r.gates.windowsPlayer,'NOT_RUN');assert.equal(r.gates.pc1Pc2,'NOT_RUN');
});
test('unapproved feature branch ALT_HOLD',()=>expected('UNAPPROVED_A70_BRANCH',valid({ref:'fix/cc001-r17-w10-a30-on-a70-candidate'})));
test('unadmitted W10 addon ref mismatch ALT_HOLD',()=>expected('A70_REF_NOT_AT_EXACT_SHA',valid({ownerRemoteSha:'3d377767e72473cebd90e49293a0cd5dada70464'})));
test('frozen RC1 cannot be selected as a new candidate',()=>expected('INVALID_NEW_SHA',valid({head:RC1,ownerRemoteSha:RC1})));
test('non-40hex candidate rejected',()=>expected('INVALID_NEW_SHA',valid({head:'abc',ownerRemoteSha:'abc'})));
test('unexpected merge-base blocks',()=>expected('NOT_DESCENDANT_OF_FROZEN_RC1',valid({mergeBase:'a'.repeat(40)})));
test('dirty checkout blocks',()=>expected('WORKTREE_NOT_CLEAN',valid({dirty:true})));
test('git whitespace error blocks',()=>expected('GIT_DIFF_CHECK_FAILED',valid({diffCheck:false})));
test('missing worktree changes blocks',()=>expected('NO_SELECTED_SOURCE_CHANGES',valid({changes:[]})));
test('changed frozen Protocol149 source blocks',()=>expected('PROTECTED_SOURCE_CHANGED',valid({changes:[...valid().changes,{path:path('protocol'),status:'M'}]})));
test('changed project settings blocks',()=>expected('PROTECTED_SOURCE_CHANGED',valid({changes:[...valid().changes,{path:UNITY+'ProjectSettings/ProjectSettings.asset',status:'M'}]})));
test('changing outside Unity and A33 instrumentation blocks',()=>expected('CHANGED_PATH_OUTSIDE_GAMEPLAY_SCOPE',valid({changes:[...valid().changes,{path:'artifacts/tournament-manager/src/foo.ts',status:'M'}]})));
test('new C# with orphan meta rejected',()=>expected('ORPHAN_NEW_META',valid({changes:valid().changes.filter(x=>x.path!==path('smoother'))})));
test('modifying existing .meta rejected',()=>expected('EXISTING_META_CHANGED',valid({changes:valid().changes.map(x=>x.path.endsWith('.meta')?{...x,status:'M'}:x)})));
test('deletion blocked',()=>expected('DELETION_RENAME_COPY_FORBIDDEN',valid({changes:[...valid().changes,{path:UNITY+'Tests/Program.cs',status:'D'}]})));
test('duplicate changes blocked',()=>expected('DUPLICATE_CHANGED_PATH',valid({changes:[...valid().changes,valid().changes[0]]})));
test('fixed unconditional 20Hz instead of adaptive budget rejected',()=>{let s=sources();s.network='class NetworkSnapshotCadence {} class NetworkIntentReceipt {}';expected('ADAPTIVE_CADENCE/class',valid({sources:s}));});
test('adaptive compressed payload rate threshold 64KiB absent rejected',()=>{let s=sources();s.network=s.network.replace('compressedBytes>=64*1024','compressedBytes>=65*1024');expected('ADAPTIVE_CADENCE/64K',valid({sources:s}));});
test('unwired stale ACK guard rejected',()=>{let s=sources();s.ngo=s.ngo.replace('NetworkIntentReceipt.MatchesPending','OldReceipt.MatchesPending');expected('ACK_SEQUENCE/match',valid({sources:s}));});
test('client snapshot no longer accepted by adapter rejected',()=>{let s=sources();s.ngo=s.ngo.replace('adapter.Apply','adapter.Bypass');expected('SNAPSHOT_WIRING/adapter',valid({sources:s}));});
test('remote smoother not wired into board rendering rejected',()=>{let s=sources();s.board=s.board.replace('remoteVisual.TryGetPosition','remoteVisual.Missing');expected('VISUAL_INTERPOLATION/boardTry',valid({sources:s}));});
test('PORTAL teleport identity reset missing rejected',()=>{let s=sources();s.app=s.app.replace('RemoteSnapshotEvents.InstantBallIds','Other.InstantBallIds');expected('VISUAL_INTERPOLATION/PORTAL_INSTANT',valid({sources:s}));});
test('remote smoother session reset missing rejected',()=>{let s=sources();s.app=s.app.replace('remoteBallSmoother.Reset','Other.Reset');expected('VISUAL_INTERPOLATION/SESSION_RESET',valid({sources:s}));});
test('postshot strength bar regression rejected',()=>{let s=sources();s.match+=' float lastPower=0;';expected('POWER_UI/POST_SHOT_METER',valid({sources:s}));});
test('missing local player action hint rejected',()=>{let s=sources();s.match=s.match.replace('LocalTurnPresentation.ActionHint','Obsolete.ActionHint');expected('PLAYER_UI/localOwner',valid({sources:s}));});
test('missing AimStroke rejected',()=>{let s=sources();s.board=s.board.replace('AimStroke','OldArrow');expected('PLAYER_UI/aimStroke',valid({sources:s}));});
test('diagnostic compiled symbol never admitted',()=>{let s=sources();s.ngo+='CC001_PHOENIX_DIAGNOSTIC';expected('PROTECTED/DIAGNOSTIC_MARKER',valid({sources:s}));});
test('contract extractor is deterministic for identical source input',()=>assert.deepEqual(contracts(sources()),contracts(sources())));
