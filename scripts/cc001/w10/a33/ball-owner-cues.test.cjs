// CC-001 R17-W10 A33 local-seat ball-inspection cues.
// Run: node --test scripts/cc001/w10/a33/ball-owner-cues.test.cjs
// Static presentation contract + synthetic reference truth table (NOT Unity runtime QA).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const ui=fs.readFileSync(path.join(root,'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs'),'utf8');
const app=fs.readFileSync(path.join(root,'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/CoreClashApp.cs'),'utf8');
const ownerFn=ui.slice(ui.indexOf('static string W10OwnerMark('),ui.indexOf('void RenderInfo()'));
const refLabel=(ballOwner,localOwner)=>{
 const canonical=ballOwner===0?'P1':ballOwner===1?'P2':'?';
 if(localOwner===null||localOwner<0||localOwner>1)return canonical;
 return canonical+(ballOwner===localOwner?' (YOU)':' (OPPONENT)');
};
test('W10-A33-01: connected P1 sees own P1 as YOU',()=>assert.equal(refLabel(0,0),'P1 (YOU)'));
test('W10-A33-02: connected P1 sees P2 as OPPONENT',()=>assert.equal(refLabel(1,0),'P2 (OPPONENT)'));
test('W10-A33-03: connected P2 sees P1 as OPPONENT',()=>assert.equal(refLabel(0,1),'P1 (OPPONENT)'));
test('W10-A33-04: connected P2 sees own P2 as YOU',()=>assert.equal(refLabel(1,1),'P2 (YOU)'));
test('W10-A33-05: offline hotseat remains canonical',()=>assert.equal(refLabel(1,null),'P2'));
test('W10-A33-06: invalid local owner does not infer identity',()=>assert.equal(refLabel(0,2),'P1'));
test('W10-A33-07: uses existing canonical identity',()=>assert.match(ownerFn,/BallInspection\.OwnerMark\(ballOwner\)/));
test('W10-A33-08: marker is seat-relative, not turn-relative',()=>{assert.match(ownerFn,/ballOwner==connectedLocalOwner\.Value\?" \(YOU\)":" \(OPPONENT\)"/);assert.doesNotMatch(ownerFn,/\.turn|State\.turn|state\.turn/);});
test('W10-A33-09: only display cue when network is ready',()=>assert.match(ui,/NetworkLink!=null&&NetworkLink\.IsConnected\?NetworkLink\.LocalOwner:\(int\?\)null/));
test('W10-A33-10: runtime ball HP remains untouched',()=>assert.match(ui,/W10OwnerMark\(current\.Owner,localSeat\)\+"  \/  "\+current\.Hp\+" \/ "\+current\.MaxHp\+" HP"/));
test('W10-A33-11: no mutation of simulation or network in DetailsView',()=>{assert.doesNotMatch(ui,/Simulation\.State\s*=|NetworkLink\.Submit\(|\.TryCommand\(|Simulation\.Step\(/);});
test('W10-A33-12: underlying gameplay CanChoose remains canonical',()=>assert.match(app,/State\.turn==NetworkLink\.LocalOwner/));
