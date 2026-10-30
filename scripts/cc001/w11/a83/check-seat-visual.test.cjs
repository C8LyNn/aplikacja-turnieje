'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {check}=require('./check-seat-visual.cjs');
const valid={
 helper:'return networked && connected && seat == localOwner; if (!canChoose) return false; if (!networked) return true; return connected && activeOwner == localOwner;',
 match:'LocalSeatVisuals.ShowSelectedPreview(1,2,3,4,5); BoardView.Render(showLauncherPreview?Catalog.Ball(selected):null); ShowLocalSeatMarker(i); ShowLocalSeatMarker(owner); LocalSeatVisuals.ShowLocalMarker(1); LocalDeckContent.StockIds(state,displayOwner); LocalDeckContent.CanActivate(1);',
 suite:'static void R17W11A83SeatVisualTests(){'+('Test("A83 W11 disconnected P1 launcher",()=>{});').repeat(5)+'}',
 runner:'R17W11A83SeatVisualTests();',
 project:'<Compile Include="../Assets/CoreClash/Presentation/LocalSeatVisuals.cs" />'
};
test('W11 A83 good fixture passes nine source contracts',()=>{
 const r=check(valid); assert.equal(r.status,'PASS_SOURCE_ONLY');assert.equal(r.checks.length,9);
});
test('W11 A83 disconnected badge must fail closed',()=>{
 const r=check({...valid,helper:valid.helper.replace('networked && connected','networked')});assert.equal(r.status,'HOLD');assert.equal(r.checks[0].pass,false);
});
test('W11 A83 unguarded preview must fail closed',()=>{
 const r=check({...valid,match:valid.match.replace('showLauncherPreview?Catalog.Ball(selected):null','Catalog.Ball(selected)')});assert.equal(r.status,'HOLD');assert.equal(r.checks[2].pass,false);
});
test('W11 A83 stale opponent-deck binding is rejected',()=>{
 const r=check({...valid,match:valid.match.replace('LocalDeckContent.StockIds(state,displayOwner)','state.players[state.turn].stock')});assert.equal(r.checks[4].pass,false);
});
test('W11 A83 missing C# runner registration is rejected',()=>{
 const r=check({...valid,runner:''});assert.equal(r.checks[5].pass,false);
});
test('W11 A83 missing negative coverage is rejected',()=>{
 const r=check({...valid,suite:valid.suite.replaceAll('disconnected','active')});assert.equal(r.checks[6].pass,false);
});
test('W11 A83 accidental power bar resurrection is rejected',()=>{
 const r=check({...valid,match:valid.match+' lastPower'});assert.equal(r.checks[7].pass,false);
});
test('W11 A83 state mutation in pure helper is rejected',()=>{
 const r=check({...valid,helper:valid.helper+' sim.State=other;'});assert.equal(r.checks[8].pass,false);
});
