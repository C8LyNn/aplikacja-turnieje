'use strict';
const fs=require('node:fs');
const path=require('node:path');
const base='Assets/CoreClash/Presentation/';
function check(files){
 const match=files.match||'', helper=files.helper||'', suite=files.suite||'', project=files.project||'',runner=files.runner||'';
 const tests=[
 ['W11_SEAT_01_CONNECTED_MARKER', /networked\s*&&\s*connected/.test(helper) && /seat\s*==\s*localOwner/.test(helper)],
 ['W11_SEAT_02_LOCAL_LAUNCHER_ONLY', /!canChoose/.test(helper) && /activeOwner\s*==\s*localOwner/.test(helper) && /if\s*\(!networked\)\s*return\s+true/.test(helper)],
 ['W11_SEAT_03_PREVIEW_WIRED', /LocalSeatVisuals\.ShowSelectedPreview\(/.test(match) && /showLauncherPreview\s*\?\s*Catalog\.Ball\(selected\)\s*:\s*null/.test(match)],
 ['W11_SEAT_04_MARKERS_WIRED', /ShowLocalSeatMarker\(i\)/.test(match) && /ShowLocalSeatMarker\(owner\)/.test(match) && /LocalSeatVisuals\.ShowLocalMarker\(/.test(match)],
 ['W11_SEAT_05_P2_DECK_UNCHANGED', /LocalDeckContent\.StockIds\(state,displayOwner\)/.test(match) && /LocalDeckContent\.CanActivate/.test(match)],
 ['W11_SEAT_06_TEST_REGISTRATION', /R17W11A83SeatVisualTests\(\)/.test(runner) && /LocalSeatVisuals\.cs/.test(project) && /static\s+void\s+R17W11A83SeatVisualTests\(/.test(suite)],
 ['W11_SEAT_07_CASE_COVERAGE', (suite.match(/Test\("A83 W11/g)||[]).length>=5 && /disconnected/.test(suite) && /opponent|P1 launcher/i.test(suite)],
 ['W11_SEAT_08_POWER_CLEANUP', !/lastPower|releasedAt|power\*100|power\s*\*\s*100/.test(match)],
 ['W11_SEAT_09_HELPER_READ_ONLY', !/\.turn\s*=|\.State\s*=|Submit\s*\(/.test(helper)],
 ];
 return {status:tests.every(t=>t[1])?'PASS_SOURCE_ONLY':'HOLD',checks:tests.map(([id,pass])=>({id,pass}))};
}
function fromProject(root){
 const file=(x)=>fs.readFileSync(path.join(root,x),'utf8');
 return {
  match:file(base+'MatchView.cs'),helper:file(base+'LocalSeatVisuals.cs'),
  suite:file('Tests/R17W11A83SeatVisualTests.cs'),runner:file('Tests/Program.cs'),project:file('Tests/CoreClash.Tests.csproj')
 };
}
if(require.main===module){
 try{
 const result=check(fromProject(process.argv[2]||'unity/cc001-r16/CoreClash-V149-Unity'));
 console.log(JSON.stringify(result,null,2));process.exitCode=result.status==='PASS_SOURCE_ONLY'?0:1;
 }catch(e){console.error('W11 A83 HOLD: '+e.message);process.exitCode=2;}
}
module.exports={check};
