'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {BASE,SELECTED,required,assess,overlap}=require('./selected-source-admission.cjs');
function ok(extra={}) {
  return {
    base:BASE,head:SELECTED,mergeBase:BASE,dirty:false,diffCheck:true,
    changes:[...required],deletions:[],additions:[],
    cadenceSource:'public const float MovingSeconds=.05f; public const float StableSeconds=.25f; public static float For(MatchPhase phase)=>phase==MatchPhase.Moving?MovingSeconds:StableSeconds;',
    sessionSource:'nextSnapshot=Time.unscaledTime+NetworkSnapshotCadence.For(app.Simulation.State.phase);',
    ...extra
  };
}
function blocked(input,code) {
  const r=assess(input);
  assert.equal(r.status,'HOLD');
  assert(r.failures.includes(code),'missing error '+code+' in '+JSON.stringify(r.failures));
}
test('proposed A30 sole selected source only returns SOURCE_SCOPE_READY, never build/QA PASS',()=>{
  const r=assess(ok());
  assert.equal(r.status,'SOURCE_SCOPE_READY_FOR_A70_REVIEW');
  assert.equal(r.failures.length,0);
  assert.equal(r.execution.pc1Pc2,'NOT_RUN');
  assert.equal(r.execution.unityBuild,'NOT_RUN');
  assert.equal(r.execution.independentQA,'NOT_RUN');
});
test('bad RC1 base fails closed',()=>blocked(ok({base:'BAD'}),'WRONG_FROZEN_RC1_SHA'));
test('unapproved alternate head fails',()=>blocked(ok({head:'BAD'}),'UNPINNED_SELECTED_SHA'));
test('not a direct RC1 descendant fails',()=>blocked(ok({mergeBase:'OTHER'}),'CANDIDATE_NOT_EXACT_RC1_DESCENDANT'));
test('dirty worktree fails',()=>blocked(ok({dirty:true}),'DIRTY_CHECKOUT'));
test('git diff whitespace failure blocks',()=>blocked(ok({diffCheck:false}),'GIT_DIFF_CHECK_FAILED'));
test('missing changed file blocks',()=>blocked(ok({changes:required.slice(1)}),'MISSING_SELECTED_PATHS'));
test('unexpected protected source path blocks',()=>blocked(ok({changes:[...required,'unity/cc001-r16/CoreClash-V149-Unity/Assets/Resources/Data/network-settings.json']}),'UNEXPECTED_CHANGED_PATHS'));
test('unsafe path blocks',()=>blocked(ok({changes:[...required,'../Protocol149.cs']}),'UNSAFE_PATH'));
test('duplicate path blocks',()=>blocked(ok({changes:[...required,required[0]]}),'DUPLICATE_CHANGED_PATH'));
test('deleted file blocks',()=>blocked(ok({deletions:[required[0]]}),'DELETION_NOT_ALLOWED'));
test('added path blocks',()=>blocked(ok({additions:[required[0]]}),'UNEXPECTED_ADDITION'));
test('wrong moving cadence blocks',()=>blocked(ok({cadenceSource:ok().cadenceSource.replace('.05f','.2f')}),'SOURCE_CADENCE_CONTRACT_MISMATCH'));
test('wrong stable cadence blocks',()=>blocked(ok({cadenceSource:ok().cadenceSource.replace('.25f','1f')}),'SOURCE_CADENCE_CONTRACT_MISMATCH'));
test('unwired cadence blocks',()=>blocked(ok({sessionSource:'nextSnapshot=Time.unscaledTime+2f;'}),'SOURCE_CADENCE_NOT_WIRED'));
test('diagnostic marker blocks',()=>blocked(ok({sessionSource:ok().sessionSource+' CC001_PHOENIX_DIAGNOSTIC'}),'DIAGNOSTIC_MARKER_FORBIDDEN'));
test('collision graph detects A30 overlaps with A41/A20/A34',()=>{
  const hits=overlap(required);
  assert(hits['163'].some(p=>p.endsWith('NgoGameSession.cs')));
  assert(hits['168'].some(p=>p.endsWith('BoardView.cs')));
  assert(hits['174'].some(p=>p.endsWith('BallView.cs')));
});
test('no collision for non-conflicting auxiliary tool path',()=>assert.deepEqual(overlap(['scripts/cc001/w9/a42/verify-pc-pair.cjs']),{}));
