// CC-001 R17-W11 A33 — local-owner inspection and F1 color source-contract tests.
// Run from repository root: node --test scripts/cc001/w11/a33/candidate207-owner-cues.test.cjs
// Native Unity/PC1-PC2 acceptance is NOT implied by these tests.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const base=path.join(root,'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation');
const details=fs.readFileSync(path.join(base,'DetailsView.cs'),'utf8');
const draw=fs.readFileSync(path.join(base,'Draw.cs'),'utf8');
const inspect=fs.readFileSync(path.join(base,'BallInspection.cs'),'utf8');
const start=details.indexOf('static string W11BallOwnerCue(');
const end=details.indexOf('void RenderInfo()',start);
assert.ok(start>=0&&end>start,'W11BallOwnerCue helper missing');
const ownerFn=details.slice(start,end);
function expected(owner,local){
  const id=owner===0?'P1':owner===1?'P2':'?';
  if(local===null||local<0||local>1)return id;
  return id+(owner===local?' (YOU)':' (OPPONENT)');
}
const truth=[
  [0,0,'P1 (YOU)'],[1,0,'P2 (OPPONENT)'],
  [0,1,'P1 (OPPONENT)'],[1,1,'P2 (YOU)'],
  [0,null,'P1'],[1,null,'P2'],[0,-1,'P1'],[1,2,'P2']
];
for(const [ballOwner,localOwner,want] of truth){
  test('A33 seat owner='+ballOwner+' local='+localOwner,()=>assert.equal(expected(ballOwner,localOwner),want));
}
test('A33 owner source uses canonical P1/P2 owner, not turn',()=>{
  assert.match(ownerFn,/BallInspection\.OwnerMark\(ballOwner\)/);
  assert.match(ownerFn,/ballOwner==localOwner\.Value\?" \(YOU\)":" \(OPPONENT\)"/);
  assert.doesNotMatch(ownerFn,/\.turn|State\.turn/);
  assert.match(inspect,/OwnerMark\(int owner\).*?"P1".*?"P2"/);
});
test('A33 networked seat cues fail closed if disconnected',()=>{
  assert.match(details,/NetworkLink!=null&&NetworkLink\.IsConnected\?NetworkLink\.LocalOwner:\(int\?\)null/);
  assert.match(ownerFn,/!localOwner\.HasValue\|\|localOwner\.Value<0\|\|localOwner\.Value>1/);
});
test('A33 inspected HP and canonical owner preserved',()=>{
  assert.match(details,/W11BallOwnerCue\(current\.Owner,localSeat\)\+"  \/  "\+current\.Hp\+" \/ "\+current\.MaxHp\+" HP"/);
  assert.match(details,/BallView\.Preview\(.*current\?\.Owner\?\?Simulation\.State\.turn/);
});
test('A33 F1 labels match actual Draw.Owner palette',()=>{
  assert.match(draw,/Color Owner\(int owner\)=>owner==0\?Cyan:Pink/);
  assert.equal((details.match(/"P2 \/ PINK"/g)||[]).length,2);
  assert.equal((details.match(/P2 \/ RED/g)||[]).length,0);
});
test('A33 F1 displays real snapshot counters and local seat',()=>{
  for(const k of ['ReceivedSnapshots','LastAppliedRevision','AcceptedLocalIntents','RejectedLocalIntents','AcceptedRemoteIntents','RejectedRemoteIntents'])
    assert.ok(details.includes('ngo.'+k),k+' absent');
  assert.match(details,/LOCAL SEAT:/);
  assert.match(details,/ACTIVE SEAT:/);
});
test('A33 no network/gameplay mutation in DetailsView',()=>{
  assert.doesNotMatch(details,/Simulation\.State\s*=|\.TryCommand\(|NetworkLink\.Submit\(|Simulation\.Step\(/);
});
