'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {FREEZE,RC1,REF,hashFile,playerManifest,assessEvidence,parseArgs,verifyFreeze}=require('./freeze-player-intake.cjs');
const file=(root,p,contents='data')=>{const full=path.join(root,p);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,contents)};
function fixture(t){
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a42-'));
 t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 const p1=path.join(home,'pc1'),p2=path.join(home,'pc2');fs.mkdirSync(p1);fs.mkdirSync(p2);
 const paths=['CoreClash.exe','CoreClash_Data/Managed/Assembly-CSharp.dll',...Array.from({length:50},(_,i)=>'CoreClash_Data/resources/'+i.toString().padStart(2,'0')+'.bytes')];
 for (let i=0;i<paths.length;i++){file(p1,paths[i],'content_'+i);file(p2,paths[i],'content_'+i)}
 const inventory=paths.map(p=>({path:p,...hashFile(path.join(p1,p))}));
 const build={schema:'CC001-W10-A72-WINDOWS-1',ref:REF,candidateSHA:FREEZE,rc1Base:RC1,status:'PASS_BUILD_EVIDENCE_ONLY',unity:{exitCode:0},buildReport:{target:'StandaloneWindows64',result:'Succeeded',errors:0},playerCount:inventory.length,playerInventory:inventory,blockers:[],sourceChanges:[],generatedSourceChanges:[],unexpectedSourceChanges:[],unityGenerated:{build:'a'.repeat(64),smoke:'b'.repeat(64)},gates:Object.fromEntries(['sourcePreExact','sourceAfterMaterialized','sourceNotMutated','freshUnityReports','unityExitZero','buildSucceeded','playerComplete','compilerResponseCaptured','playerDefineCorrect','noDiagnostic','buildMarker'].map(k=>[k,true]))};
 const receipt={schema:'CC001-W10-A72-RECEIPT-1',candidateSHA:FREEZE,rc1:RC1,status:'PASS_BUILD_EVIDENCE_ONLY'};
 const source={ref:REF,sha:FREEZE,base:RC1,verified:true};
 const inspect=()=>assessEvidence(build,receipt,p1,p2,source);
 return {home,p1,p2,paths,build,receipt,source,inspect};
}
const codes=r=>r.reasonCodes;
test('matching original bytes, correct frozen SHA yields review-only, never G3',t=>{const x=fixture(t),r=x.inspect();assert.equal(r.status,'READY_FOR_A60_INDEPENDENT_QA_ONLY');assert.equal(r.G3,'NOT_ATTESTED');assert.equal(r.physicalPcs,'NOT_ATTESTED');assert.equal(r.pc1.count,52)});
test('no Windows Player inputs produces HOLD',()=>{const r=assessEvidence({}, {},'/nonexistent1','/nonexistent2',{});assert.equal(r.status,'HOLD');assert(codes(r).includes('INVALID_A72_BUILD_REPORT'))});
test('old W10 source SHA rejected',t=>{const x=fixture(t);x.build.candidateSHA='173273122c11cbf738e8b954e32506a6196fe8ec';assert(codes(x.inspect()).includes('WRONG_A72_SOURCE_REF_OR_SHA'))});
test('moving A70 PR ref rejected',t=>{const x=fixture(t);x.build.ref='integration/cc001-r17-w11-multiplayer-qa-candidate-20261030';assert(codes(x.inspect()).includes('WRONG_A72_SOURCE_REF_OR_SHA'))});
test('wrong A72 receipt SHA rejected',t=>{const x=fixture(t);x.receipt.candidateSHA='0'.repeat(40);assert(codes(x.inspect()).includes('INVALID_A72_RECEIPT'))});
test('fabricated successful Unity exit rejected',t=>{const x=fixture(t);x.build.unity.exitCode=1;assert(codes(x.inspect()).includes('UNITY_BUILD_UNVERIFIED'))});
test('missing source provenance gate rejected',t=>{const x=fixture(t);delete x.build.gates.sourceAfterMaterialized;assert(codes(x.inspect()).includes('BUILD_PROVENANCE_GATES_MISSING'))});
test('blank build gate map rejected',t=>{const x=fixture(t);x.build.gates={};assert(codes(x.inspect()).includes('BUILD_PROVENANCE_GATES_MISSING'))});
test('missing or nonempty builder blockers ledger rejected',t=>{const x=fixture(t);delete x.build.blockers;assert(codes(x.inspect()).includes('A72_SOURCE_OR_BLOCKER_LEDGER_INVALID'));x.build.blockers=['failed'];assert(codes(x.inspect()).includes('A72_SOURCE_OR_BLOCKER_LEDGER_INVALID'))});
test('source mutation ledger rejected',t=>{const x=fixture(t);x.build.sourceChanges=[{path:'modified.cs'}];assert(codes(x.inspect()).includes('UNAUTHORIZED_SOURCE_CHANGE'))});
test('same directory passed twice cannot pretend to be two PC copies',t=>{const x=fixture(t);assert(codes(assessEvidence(x.build,x.receipt,x.p1,x.p1,x.source)).includes('DUPLICATE_PC_ROOT'))});
test('tampered PC2 DLL is detected by real SHA256',t=>{const x=fixture(t);file(x.p2,'CoreClash_Data/Managed/Assembly-CSharp.dll','tampered');const r=x.inspect();assert(codes(r).includes('PC2_PLAYER_BYTES_HOLD'));assert(r.pc2.problems.some(s=>s.includes('BYTES_DIFFER:CoreClash_Data/Managed/Assembly-CSharp.dll')))});
test('missing PC1 EXE detected',t=>{const x=fixture(t);fs.rmSync(path.join(x.p1,'CoreClash.exe'));assert(codes(x.inspect()).includes('PC1_PLAYER_BYTES_HOLD'))});
test('extra PC2 file detected',t=>{const x=fixture(t);file(x.p2,'Unexpected.txt','x');assert(x.inspect().pc2.problems.some(s=>s==='EXTRA:Unexpected.txt'))});
test('symbolic link in PC2 directory rejected',t=>{const x=fixture(t);fs.symlinkSync(path.join(x.p1,'CoreClash.exe'),path.join(x.p2,'link.exe'));assert(codes(x.inspect()).includes('PC2_PLAYER_BYTES_HOLD'))});
test('Windows case-insensitive manifest duplicate rejected',t=>{const x=fixture(t);x.build.playerInventory[2].path='coreclash.exe';assert(codes(x.inspect()).includes('DUPLICATE_WINDOWS_PLAYER_PATH'))});
test('manifest path traversal rejected',t=>{const x=fixture(t);x.build.playerInventory[2].path='../escape';assert(codes(x.inspect()).includes('INVALID_PLAYER_ENTRY'))});
test('invalid manifest digest rejected',t=>{const x=fixture(t);x.build.playerInventory[2].sha256='garbage';assert(codes(x.inspect()).includes('INVALID_PLAYER_ENTRY'))});
test('missing key game DLL rejected even with 52 files',t=>{const x=fixture(t);x.build.playerInventory[1].path='other.dll';assert(codes(x.inspect()).includes('WINDOWS_EXE_OR_GAME_DLL_MISSING'))});
test('source freeze proof is mandatory',t=>{const x=fixture(t);x.source.verified=false;assert(codes(x.inspect()).includes('FROZEN_GIT_SOURCE_NOT_VERIFIED'))});
test('CLI rejects absent args and smuggled flags',()=>{assert.throws(()=>parseArgs(['--repo=a']),/MISSING_ARG_/);assert.throws(()=>parseArgs(['--repo=x','--ref=moving']),/INVALID_CLI_ARG/)});
test('no .git remote is NOT accepted as freeze proof',t=>{const x=fixture(t);assert.throws(()=>verifyFreeze(x.home),/GIT_CHECK_FAILED/)});
test('binary inventory count mismatch rejected',t=>{const x=fixture(t);x.build.playerCount=51;assert(codes(x.inspect()).includes('PLAYER_MANIFEST_INCOMPLETE'))});

test('valid two Unity-generated report changes are scoped ADMITTED for A60 review only',t=>{const x=fixture(t),root='unity/cc001-r16/CoreClash-V149-Unity/Evidence/R16/Unity/';x.build.sourceChanges=[{path:root+'unity-smoke.json'},{path:root+'build-StandaloneWindows64.json'}];x.build.generatedSourceChanges=x.build.sourceChanges.map(e=>({...e}));const result=x.inspect();assert.equal(result.status,'READY_FOR_A60_INDEPENDENT_QA_ONLY',JSON.stringify(result.reasonCodes));assert.equal(result.G3,'NOT_ATTESTED')});
test('generated report declaration cannot conceal C# source modification',t=>{const x=fixture(t);x.build.sourceChanges=[{path:'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Core/GameSimulation.cs'}];assert(codes(x.inspect()).includes('UNAUTHORIZED_SOURCE_CHANGE'))});
test('generated report SHA metadata is mandatory',t=>{const x=fixture(t);delete x.build.unityGenerated.smoke;assert(codes(x.inspect()).includes('UNITY_FRESH_REPORT_SHA_MISSING'))});
test('A72 fake full-source changes with empty generated list rejected',t=>{const x=fixture(t);x.build.sourceChanges=[{path:'unity/cc001-r16/CoreClash-V149-Unity/Evidence/R16/Unity/unity-smoke.json'}];assert(codes(x.inspect()).includes('GENERATED_LEDGER_MISMATCH'))});
