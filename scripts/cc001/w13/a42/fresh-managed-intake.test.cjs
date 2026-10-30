'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {SHA,RC1,REF,evaluate,argsMap}=require('./fresh-managed-intake.cjs');
function fixture(){
 const begin='2026-10-30T20:00:00.000Z',tested='2026-10-30T20:02:00.000Z',finish='2026-10-30T20:04:00.000Z';
 return {summary:{schema:'CC001-W10-A72-WINDOWS-1',status:'PASS_BUILD_EVIDENCE_ONLY',candidateSHA:SHA,ref:REF,rc1Base:RC1,managedSdk:'9.0.306',managed:{exitCode:0,signal:null},managedTests:{passed:3,failed:0},gates:{managedDotnet9:true}},
 receipt:{schema:'CC001-W10-A72-RECEIPT-1',status:'PASS_BUILD_EVIDENCE_ONLY',candidateSHA:SHA,rc1:RC1,utc:finish},
 managed:{spec:'V149 UNITY',testedAt:tested,passed:3,failed:0,results:[{name:'Alpha',pass:true},{name:'Beta',pass:true},{name:'Gamma',pass:true}]},
 events:begin+' START ref='+REF+' sha='+SHA+'\n'+finish+' UNITY exit=0 signal=null\n',
 log:'SDK 9\nPASS Alpha\nPASS Beta\nPASS Gamma\nRESULT: 3 passed, 0 failed\n'};
}
function held(failure,modify){const a=fixture();modify(a);const result=evaluate(a);assert.equal(result.status,'HOLD');assert(result.reasonCodes.includes(failure),JSON.stringify(result.reasonCodes));}
test('complete frozen original evidence admits review ONLY',()=>{const r=evaluate(fixture());assert.equal(r.status,'RAW_MANAGED_EVIDENCE_COHERENT_ONLY');assert.equal(r.pc1Pc2,'NOT_ATTESTED');assert.equal(r.G3,'NOT_ATTESTED')});
test('wrong A70 moving source ref rejected',()=>held('WRONG_A72_BUILD_SOURCE',x=>x.summary.ref='integration/cc001-r17-w11-multiplayer-qa-candidate-20261030'));
test('old user-dispatched SHA rejected',()=>held('WRONG_A72_BUILD_SOURCE',x=>x.summary.candidateSHA='173273122c11cbf738e8b954e32506a6196fe8ec'));
test('receipt cannot claim different source',()=>held('WRONG_A72_RECEIPT',x=>x.receipt.candidateSHA='0'.repeat(40)));
test('managed compiler failed',()=>held('MANAGED_PROCESS_UNVERIFIED',x=>x.summary.managed.exitCode=1));
test('wrong SDK major rejected',()=>held('MANAGED_PROCESS_UNVERIFIED',x=>x.summary.managedSdk='8.0.100'));
test('missing managed provenance flag rejected',()=>held('MANAGED_PROCESS_UNVERIFIED',x=>delete x.summary.gates.managedDotnet9));
test('missing original start event rejected',()=>held('MISSING_EXACT_FROZEN_RUN_START',x=>x.events=''));
test('two disjoint START records rejected',()=>held('MISSING_EXACT_FROZEN_RUN_START',x=>x.events+=x.events));
test('historical R16 Oct16 test report rejected',()=>held('STALE_OR_OUT_OF_WINDOW_MANAGED_JSON',x=>x.managed.testedAt='2026-10-16T23:53:45.5602531Z'));
test('future test date beyond receipt rejected',()=>held('STALE_OR_OUT_OF_WINDOW_MANAGED_JSON',x=>x.managed.testedAt='2026-10-30T22:05:00.000Z'));
test('build receipt predates run start rejected',()=>held('INVALID_BUILD_TIME_WINDOW',x=>x.receipt.utc='2026-10-30T19:59:00.000Z'));
test('result JSON with only aggregate counters rejected',()=>held('INVALID_MANAGED_TEST_CASES',x=>delete x.managed.results));
test('false-green case rejected',()=>held('INVALID_MANAGED_TEST_CASES',x=>x.managed.results[1].pass=false));
test('inaccurate case count rejected',()=>held('INVALID_MANAGED_TEST_CASES',x=>x.managed.passed=4));
test('summary disagrees with raw JSON',()=>held('SUMMARY_TEST_COUNTS_DIFFER_FROM_RAW_JSON',x=>x.summary.managedTests.passed=180));
test('missing process log makes old JSON insufficient',()=>held('DOTNET_LOG_RESULT_MISMATCH',x=>x.log=''));
test('forged terminal aggregate without test PASS lines rejected',()=>held('DOTNET_LOG_RESULT_MISMATCH',x=>x.log='RESULT: 3 passed, 0 failed\n'));
test('same number but wrong test names rejected',()=>held('DOTNET_LOG_CASE_NAME_MISMATCH',x=>{x.log=x.log.replace('PASS Beta','PASS Wrong')}));
test('duplicate case names matched by occurrence count',()=>{const x=fixture();x.managed.results[2].name='Alpha';x.log=x.log.replace('PASS Gamma','PASS Alpha');assert.equal(evaluate(x).status,'RAW_MANAGED_EVIDENCE_COHERENT_ONLY')});
test('reject invalid/duplicate CLI args',()=>{assert.throws(()=>argsMap(['--unknown=x']),/INVALID_ARGUMENT/);assert.throws(()=>argsMap(['--summary=x','--summary=y']),/INVALID_ARGUMENT/)});
test('reject incomplete CLI args',()=>assert.throws(()=>argsMap(['--summary=x']),/MISSING_/));
test('real CLI exercise writes no false QA PASS and refuses overwrite',t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a42-w13-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const x=fixture(),args=[];for(const key of ['summary','receipt','managed','events','log']){const file=path.join(tmp,key+'.txt');fs.writeFileSync(file,typeof x[key]==='string'?x[key]:JSON.stringify(x[key]));args.push('--'+key+'='+file)}
 const out=path.join(tmp,'result.json'),cmd=process.execPath,script=path.join(__dirname,'fresh-managed-intake.cjs');
 let r=cp.spawnSync(cmd,[script,...args,'--out='+out],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);let report=JSON.parse(fs.readFileSync(out));assert.equal(report.G3,'NOT_ATTESTED');assert.equal(Object.keys(report.inputs).length,5);
 r=cp.spawnSync(cmd,[script,...args,'--out='+out],{encoding:'utf8'});assert.equal(r.status,3);assert.match(r.stderr,/EEXIST/);
});
test('real CLI synthetic historical report HOLD exit2',t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a42-w13-stale-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const x=fixture();x.managed.testedAt='2026-10-16T23:53:45.5602531Z';const args=[];for(const key of ['summary','receipt','managed','events','log']){const p=path.join(dir,key+'.txt');fs.writeFileSync(p,typeof x[key]==='string'?x[key]:JSON.stringify(x[key]));args.push('--'+key+'='+p)}const r=cp.spawnSync(process.execPath,[path.join(__dirname,'fresh-managed-intake.cjs'),...args],{encoding:'utf8'});assert.equal(r.status,2,r.stderr);assert.match(r.stdout,/STALE_OR_OUT_OF_WINDOW_MANAGED_JSON/);});
