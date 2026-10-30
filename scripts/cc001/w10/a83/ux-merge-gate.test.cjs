'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const { spawnSync }=require('node:child_process');
const cli=path.resolve(__dirname,'ux-merge-gate.cjs');
const files={
'Assets/CoreClash/Presentation/MatchView.cs':`TurnPerspective.TurnLabel(state,true,true,1); TurnPerspective.ActionHint(state,true,true,1,false,false); TurnPerspective.CompactPhase(state,true,true,1); ActionText(boardInspection,gesture.Active); var a=LocalDeckContent.StockIds(state,NetworkLink.LocalOwner); var b=LocalDeckContent.StockIds(state,NetworkLink.LocalOwner); var c=LocalDeckContent.StockIds(state,NetworkLink.LocalOwner); LocalDeckContent.DisplayOwner(state.turn,NetworkLink.LocalOwner); LocalDeckContent.CanActivate(simulation,owner,id,CanChoose);`,
'Assets/CoreClash/Presentation/TurnPerspective.cs':`networked && (!connected || !ValidSeat(localOwner)); WAITING FOR CONNECTION; state.turn != localOwner; OPPONENT;`,
'Assets/CoreClash/Presentation/BallSelection.cs':`owner != simulation.State.turn`,
'Assets/CoreClash/Presentation/BoardView.cs':`AimGuide.Trace(); Draw.Line();`,
'Assets/CoreClash/Presentation/CoreClashApp.cs':`public void Update(){}`,
'Tests/Program.cs':`A21TurnPerspectiveTests();`,
'Tests/CoreClash.Tests.csproj':`TurnPerspective.cs`
};
function run(override={},args=[]){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a83-w10-'));
 for(const [name,content] of Object.entries({...files,...override})){const dest=path.join(dir,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);}
 const cp=spawnSync(process.execPath,[cli,dir,...args],{encoding:'utf8'});
 fs.rmSync(dir,{recursive:true,force:true});
 return {exit:cp.status,data:JSON.parse(cp.stdout)};
}
test('reference merge passes source-only gate',()=>{const r=run();assert.equal(r.exit,0);assert.equal(r.data.status,'PASS_SOURCE_ONLY');assert.equal(r.data.runtimeQa,'NOT_RUN');});
test('duplicate local-turn strategies are held',()=>{const r=run({'Assets/CoreClash/Presentation/MatchView.cs':files['Assets/CoreClash/Presentation/MatchView.cs']+' MatchTurnCopy.TurnText();'});assert.equal(r.exit,1);assert(r.data.failures.includes('UX02_SINGLE_TURN'));});
test('disconnection guard absent is held',()=>{const r=run({'Assets/CoreClash/Presentation/TurnPerspective.cs':'state.turn != localOwner; OPPONENT;'});assert.equal(r.exit,1);assert(r.data.failures.includes('UX03_DISCONNECT'));});
test('opponent turn unguarded is held',()=>{const r=run({'Assets/CoreClash/Presentation/TurnPerspective.cs':'networked && (!connected || !ValidSeat(localOwner)); WAITING FOR CONNECTION;'});assert.equal(r.exit,1);assert(r.data.failures.includes('UX04_OPPONENT_TURN'));});
test('opponent deck exposure is held',()=>{const r=run({'Assets/CoreClash/Presentation/MatchView.cs':files['Assets/CoreClash/Presentation/MatchView.cs'].replaceAll('LocalDeckContent.StockIds','state.players[state.turn].stock')});assert.equal(r.exit,1);assert(r.data.failures.includes('UX06_LOCAL_DECK'));});
test('rotating aim matrix is held',()=>{const r=run({'Assets/CoreClash/Presentation/BoardView.cs':'AimGuide.Trace(); GUIUtility.RotateAroundPivot();'});assert.equal(r.exit,1);assert(r.data.failures.includes('UX08_AIM'));});
test('optional A10 no-power condition is fail closed',()=>{const r=run({'Assets/CoreClash/Presentation/MatchView.cs':files['Assets/CoreClash/Presentation/MatchView.cs']+' lastPower'},['--require-no-power']);assert.equal(r.exit,1);assert(r.data.failures.includes('UX10_POWER'));});
test('optional no-power condition accepts candidate without meter',()=>{const r=run({},['--require-no-power']);assert.equal(r.exit,0);});
test('lost test registration is held',()=>{const r=run({'Tests/Program.cs':'NoTests();'});assert.equal(r.exit,1);assert(r.data.failures.includes('UX09_TEST_WIRING'));});
