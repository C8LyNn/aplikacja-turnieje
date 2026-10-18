'use strict';
// CC-001 R17-W4 A72: pure, fail-closed commit/scope policy; no network or disk writes.
const FROZEN = 'de1fe4b88fce3bd08ef383165dc2cd622af2536b';
const DISPATCH = '661660d3a3dc8a4fa2c9afea489050247f64c38c';
const PROJECT = 'unity/cc001-r16/CoreClash-V149-Unity/';
const W3 = Object.freeze({
  'w3-a20': {sha:'1f87595a9d73de30179e5158a5848eae3b965885', tests:276, paths:['Assets/CoreClash/Presentation/MatchLayout.cs','Assets/CoreClash/Presentation/MatchView.cs','Tests/PresentationTests.cs']},
  'w3-a41': {sha:'8eb0b2517c049c95fc2257d73f0139d7bc17fd2c', tests:286, paths:['Tests/NetworkSeatTests.cs']},
  'w3-a50': {sha:'4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5', tests:270, paths:['Tests/ElementalTests.cs'], expectedRed:true},
  'w3-a51': {sha:'92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5', tests:292, paths:['Tests/StabilityR16Tests.cs']}
});
const CANDIDATE_SOURCE = new Set([
  'Assets/CoreClash/Core/LifecycleEffects.cs', 'Assets/CoreClash/Core/GameState.cs',
  'Assets/CoreClash/Core/AbilityResolver.cs', 'Assets/CoreClash/Core/TurnSystem.cs',
  'Assets/CoreClash/Core/ElementalEffects.cs', 'Assets/CoreClash/Physics/CollisionResolver.cs',
  'Assets/CoreClash/Presentation/MatchLayout.cs', 'Assets/CoreClash/Presentation/MatchView.cs',
  'Tests/AbilityTests.cs', 'Tests/ElementalTests.cs', 'Tests/NetworkSeatTests.cs',
  'Tests/PresentationTests.cs', 'Tests/StabilityR16Tests.cs'
]);
function select(target, candidateSha='') {
  if (target === 'baseline') {
    if(candidateSha) throw Error('baseline forbids candidate SHA');
    return {sha:FROZEN, expectedMinTests:269, expectedRed:false};
  }
  if (Object.hasOwn(W3,target)) {
    if(candidateSha) throw Error('W3 snapshots must use pinned SHAs, not external overrides');
    return {sha:W3[target].sha,expectedMinTests:W3[target].tests,expectedRed:!!W3[target].expectedRed};
  }
  if(target === 'candidate') {
    if(!/^[0-9a-f]{40}$/.test(candidateSha)) throw Error('Candidate must be an exact lower-case 40-hex Git commit SHA');
    if(candidateSha===FROZEN) throw Error('Use baseline mode for frozen commit');
    return {sha:candidateSha, expectedMinTests:269,expectedRed:false};
  }
  throw Error('Disallowed target: '+String(target));
}
function checkPaths(target, paths) {
  if(!Array.isArray(paths) || paths.some(p=>typeof p!=='string'||!p||p.startsWith('/')||p.includes('\\')||p.split('/').some(x=>x==='.'||x==='..')))
    throw Error('Invalid changed-path list');
  if(target==='baseline' && paths.length!==0)throw Error('Frozen baseline changed unexpectedly');
  const w3=W3[target];
  const required=new Set(w3?.paths.map(p=>PROJECT+p)||[]);
  for(const p of paths) {
    if(p.startsWith('docs/cc001/swarm/'))continue;
    if(target==='candidate' && (p.startsWith('scripts/cc001/')||p==='.github/workflows/cc001-r17-managed.yml'))continue;
    if(!p.startsWith(PROJECT))throw Error('Change outside isolated CC-001: '+p);
    const relative=p.slice(PROJECT.length);
    if(w3 && required.has(p))continue;
    if(target==='candidate' && CANDIDATE_SOURCE.has(relative))continue;
    throw Error('Unapproved changed path: '+p);
  }
  for(const p of required)if(!paths.includes(p))throw Error('Required W3 test/source delta missing: '+p);
  return {changed:paths.length,sourceChanges:paths.filter(p=>p.startsWith(PROJECT)).length};
}
function selfTest() {
  let passed=0;const failures=[];
  function ok(label,fn){try{if(!fn())throw Error('assertion false');passed++}catch(e){failures.push(label+': '+e.message)}}
  function rejects(fn){try{fn();return false}catch{return true}}
  ok('frozen selection',()=>select('baseline').sha===FROZEN);
  ok('pin A51',()=>select('w3-a51').sha===W3['w3-a51'].sha);
  ok('A50 explicitly red',()=>select('w3-a50').expectedRed===true);
  ok('reject shell substitution',()=>rejects(()=>select('candidate','$(id)')));
  ok('reject short sha',()=>rejects(()=>select('candidate','a'.repeat(12))));
  ok('reject override for W3',()=>rejects(()=>select('w3-a41','a'.repeat(40))));
  ok('reject unknown scenario',()=>rejects(()=>select('arbitrary')));
  ok('baseline no diff',()=>checkPaths('baseline',[]).sourceChanges===0);
  ok('reject baseline source mutation',()=>rejects(()=>checkPaths('baseline',[PROJECT+'Tests/Program.cs'])));
  ok('reject tournament code',()=>rejects(()=>checkPaths('candidate',['backend/server.py'])));
  ok('reject V148',()=>rejects(()=>checkPaths('candidate',[PROJECT+'../Reference/V148_reference_original.html'])));
  ok('reject catalog',()=>rejects(()=>checkPaths('candidate',[PROJECT+'Assets/Resources/Data/catalog.json'])));
  ok('reject protocol',()=>rejects(()=>checkPaths('candidate',[PROJECT+'Assets/CoreClash/Networking/NgoWireProtocol.cs'])));
  ok('reject missing W3 source',()=>rejects(()=>checkPaths('w3-a41',['docs/cc001/swarm/w3/A41/report.md'])));
  ok('allow scoped A41',()=>checkPaths('w3-a41',['docs/cc001/swarm/w3/A41/report.md',PROJECT+'Tests/NetworkSeatTests.cs']).sourceChanges===1);
  ok('allow narrow W4 candidate',()=>checkPaths('candidate',[PROJECT+'Tests/AbilityTests.cs',PROJECT+'Assets/CoreClash/Core/LifecycleEffects.cs']).sourceChanges===2);
  return {passed,failed:failures.length,failures};
}
module.exports={FROZEN,DISPATCH,PROJECT,W3,CANDIDATE_SOURCE,select,checkPaths,selfTest};
