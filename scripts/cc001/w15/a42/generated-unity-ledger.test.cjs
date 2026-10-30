'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {ROOT,GENERATED,validateLedger} = require('./generated-unity-ledger.cjs');
const record = path => ({path,reason:'CONTENT_CHANGED'});
function fixture(){
  const changes=GENERATED.map(record);
  return {sourceChanges:changes,generatedSourceChanges:changes.map(x=>({...x})),unexpectedSourceChanges:[],
    gates:{freshUnityReports:true,sourceNotMutated:true,sourceAfterMaterialized:true},
    unityGenerated:{build:'a'.repeat(64),smoke:'b'.repeat(64)},
    buildReport:{target:'StandaloneWindows64',result:'Succeeded',errors:0}};
}
const accepted=x=>assert.equal(validateLedger(x).status,'GENERATED_REPORT_LEDGER_COHERENT_ONLY',JSON.stringify(validateLedger(x)));
const rejected=(x,reason)=>{const result=validateLedger(x);assert.equal(result.status,'HOLD');assert(result.reasonCodes.includes(reason),JSON.stringify(result));};
test('two original A72 #262 Unity-generated JSON changes admitted scoped',()=>{const x=fixture();accepted(x);assert.equal(validateLedger(x).G3,'NOT_ATTESTED')});
test('no changed bytes still admissible when fresh output evidence exists',()=>{const x=fixture();x.sourceChanges=[];x.generatedSourceChanges=[];accepted(x)});
test('single generated report modified is allowed',()=>{const x=fixture();x.sourceChanges=x.sourceChanges.slice(0,1);x.generatedSourceChanges=x.generatedSourceChanges.slice(0,1);accepted(x)});
test('gameplay C# changed -> HOLD',()=>{const x=fixture();x.sourceChanges.push(record(ROOT.replace('Evidence/R16/Unity/','Assets/CoreClash/Core/')+'GameSimulation.cs'));rejected(x,'UNAUTHORIZED_SOURCE_CHANGE')});
test('Unity scene changed -> HOLD',()=>{const x=fixture();x.sourceChanges.push(record('unity/cc001-r16/CoreClash-V149-Unity/Assets/Scenes/Main.unity'));rejected(x,'UNAUTHORIZED_SOURCE_CHANGE')});
test('ProjectSettings changed -> HOLD',()=>{const x=fixture();x.sourceChanges.push(record('unity/cc001-r16/CoreClash-V149-Unity/ProjectSettings/ProjectSettings.asset'));rejected(x,'UNAUTHORIZED_SOURCE_CHANGE')});
test('unknown generated JSON changed -> HOLD',()=>{const x=fixture();x.sourceChanges.push(record(ROOT+'unknown.json'));rejected(x,'UNAUTHORIZED_SOURCE_CHANGE')});
test('path traversal is not allowlisted',()=>{const x=fixture();x.sourceChanges.push(record(ROOT+'../unity-smoke.json'));rejected(x,'UNAUTHORIZED_SOURCE_CHANGE')});
test('missing source ledger -> HOLD',()=>{const x=fixture();delete x.sourceChanges;rejected(x,'MISSING_SOURCE_LEDGER')});
test('missing generated ledger -> HOLD',()=>{const x=fixture();delete x.generatedSourceChanges;rejected(x,'MISSING_SOURCE_LEDGER')});
test('fabricated nonempty unexpected ledger -> HOLD',()=>{const x=fixture();x.unexpectedSourceChanges.push(record('scene.unity'));rejected(x,'UNEXPECTED_LEDGER_NONEMPTY')});
test('generated entries must exactly match sourceChanges',()=>{const x=fixture();x.generatedSourceChanges=[];rejected(x,'GENERATED_LEDGER_MISMATCH')});
test('duplicated allowed path -> HOLD',()=>{const x=fixture();x.sourceChanges.push(record(GENERATED[0]));rejected(x,'DUPLICATE_GENERATED_REPORT_CHANGE')});
test('missing fresh reports gate -> HOLD',()=>{const x=fixture();x.gates.freshUnityReports=false;rejected(x,'A72_GENERATED_REPORT_GATES_MISSING')});
test('missing post-source gate -> HOLD',()=>{const x=fixture();x.gates.sourceAfterMaterialized=false;rejected(x,'A72_GENERATED_REPORT_GATES_MISSING')});
test('missing source mutation gate -> HOLD',()=>{const x=fixture();x.gates.sourceNotMutated=false;rejected(x,'A72_GENERATED_REPORT_GATES_MISSING')});
test('missing generated smoke hash -> HOLD',()=>{const x=fixture();delete x.unityGenerated.smoke;rejected(x,'UNITY_FRESH_REPORT_SHA_MISSING')});
test('non-hex generated SHA -> HOLD',()=>{const x=fixture();x.unityGenerated.build='not-a-sha';rejected(x,'UNITY_FRESH_REPORT_SHA_MISSING')});
test('historical build target mismatch -> HOLD',()=>{const x=fixture();x.buildReport.target='StandaloneLinux64';rejected(x,'UNITY_BUILD_RESULT_INCONSISTENT')});
test('historical build succeeded with errors -> HOLD',()=>{const x=fixture();x.buildReport.errors=3;rejected(x,'UNITY_BUILD_RESULT_INCONSISTENT')});
test('impossible non-path ledger record -> HOLD',()=>{const x=fixture();x.sourceChanges.push({why:'bad'});rejected(x,'INVALID_SOURCE_CHANGE_RECORD')});
