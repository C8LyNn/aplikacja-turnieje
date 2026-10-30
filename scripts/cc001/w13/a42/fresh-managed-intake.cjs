'use strict';
// A42 W13: independent, fail-closed cross-check of A72's ORIGINAL managed test evidence.
// It does not execute C# or certify Unity/PC1-PC2 runtime behavior.
const fs = require('node:fs');
const crypto = require('node:crypto');
const SHA = '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const RC1 = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const REF = 'integration/cc001-r17-w11-qa-freeze-20261030';
function evaluate({summary,receipt,managed,events,log}) {
  const failures=[];
  const fail=(test,code)=>{if(test)failures.push(code);};
  fail(summary?.schema!=='CC001-W10-A72-WINDOWS-1'||summary?.status!=='PASS_BUILD_EVIDENCE_ONLY'||summary?.candidateSHA!==SHA||summary?.ref!==REF||summary?.rc1Base!==RC1,'WRONG_A72_BUILD_SOURCE');
  fail(receipt?.schema!=='CC001-W10-A72-RECEIPT-1'||receipt?.status!=='PASS_BUILD_EVIDENCE_ONLY'||receipt?.candidateSHA!==SHA||receipt?.rc1!==RC1,'WRONG_A72_RECEIPT');
  fail(!/^9\./.test(summary?.managedSdk||'')||summary?.managed?.exitCode!==0||summary?.managed?.signal!==null||summary?.gates?.managedDotnet9!==true,'MANAGED_PROCESS_UNVERIFIED');
  const startRows=typeof events==='string'?events.split(/\r?\n/).filter(x=>/ START /.test(x)):[];
  fail(startRows.length!==1||!startRows[0]?.includes('ref='+REF+' sha='+SHA),'MISSING_EXACT_FROZEN_RUN_START');
  const start=startRows.length===1?Date.parse(startRows[0].split(' ')[0]):NaN;
  const end=Date.parse(receipt?.utc||'');
  const tested=Date.parse(managed?.testedAt||'');
  fail(!Number.isFinite(start)||!Number.isFinite(end)||end<start||end-start>3*60*60*1000,'INVALID_BUILD_TIME_WINDOW');
  fail(!Number.isFinite(tested)||!Number.isFinite(start)||!Number.isFinite(end)||tested<start-3000||tested>end+3000,'STALE_OR_OUT_OF_WINDOW_MANAGED_JSON');
  const records=managed?.results;
  fail(managed?.spec!=='V149 UNITY'||!Number.isSafeInteger(managed?.passed)||managed.passed<1||managed?.failed!==0||!Array.isArray(records)||records.length!==managed.passed||!records.every(r=>r?.pass===true&&typeof r.name==='string'&&r.name.trim().length>0),'INVALID_MANAGED_TEST_CASES');
  fail(summary?.managedTests?.passed!==managed?.passed||summary?.managedTests?.failed!==managed?.failed,'SUMMARY_TEST_COUNTS_DIFFER_FROM_RAW_JSON');
  const lines=typeof log==='string'?log.split(/\r?\n/).map(x=>x.trimEnd()):[];
  const passRows=lines.filter(x=>x.startsWith('PASS ')).map(x=>x.slice(5));
  const terminal=lines.filter(x=>/^RESULT: \d+ passed, \d+ failed$/.test(x));
  fail(passRows.length!==managed?.passed||terminal.length!==1||terminal[0]!==('RESULT: '+managed?.passed+' passed, 0 failed'),'DOTNET_LOG_RESULT_MISMATCH');
  if(Array.isArray(records)) {
    const expected=new Map();
    for(const row of records) if(typeof row?.name==='string')expected.set(row.name,(expected.get(row.name)||0)+1);
    for(const row of passRows) expected.set(row,(expected.get(row)||0)-1);
    fail([...expected.values()].some(n=>n!==0),'DOTNET_LOG_CASE_NAME_MISMATCH');
  }
  return {schema:'CC001-W13-A42-MANAGED-FRESHNESS-1',sourceSha:SHA,sourceRef:REF,
    status:failures.length?'HOLD':'RAW_MANAGED_EVIDENCE_COHERENT_ONLY',reasonCodes:[...new Set(failures)],
    testCount:Number.isInteger(managed?.passed)?managed.passed:null,
    freshnessMeaning:'Timestamp, original runner log and case count agree; independent proof of execution origin/host is NOT established.',
    dotnetExecution:'NOT_INDEPENDENTLY_ATTESTED',unityPlayer:'NOT_ATTESTED',pc1Pc2:'NOT_ATTESTED',G3:'NOT_ATTESTED',G4:'NOT_ATTESTED',release:'STOP'};
}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function argsMap(argv) {
  const valid=new Set(['summary','receipt','managed','events','log','out']);const args={};
  for(const item of argv){const x=/^--([a-z]+)=(.+)$/.exec(item);if(!x||!valid.has(x[1])||args[x[1]])throw Error('INVALID_ARGUMENT');args[x[1]]=x[2];}
  for(const k of ['summary','receipt','managed','events','log'])if(!args[k])throw Error('MISSING_'+k.toUpperCase());
  return args;
}
function main(argv){
  const args=argsMap(argv),raw={};
  for(const key of ['summary','receipt','managed','events','log'])raw[key]=fs.readFileSync(args[key]);
  const report=evaluate({summary:JSON.parse(raw.summary.toString('utf8')),receipt:JSON.parse(raw.receipt.toString('utf8')),
    managed:JSON.parse(raw.managed.toString('utf8')),events:raw.events.toString('utf8'),log:raw.log.toString('utf8')});
  report.inputs=Object.fromEntries(Object.entries(raw).map(([k,b])=>[k,{sha256:sha(b),bytes:b.length}]));
  const out=JSON.stringify(report,null,2)+'\n';
  if(args.out)fs.writeFileSync(args.out,out,{flag:'wx'});else process.stdout.write(out);
  return report.status==='HOLD'?2:0;
}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2));}catch(e){process.stderr.write('A42_W13_HOLD '+e.message+'\n');process.exitCode=3;}}
module.exports={SHA,RC1,REF,evaluate,argsMap,main};
