'use strict';
// CC-001 W11 A42: independently link A72 source/build receipts and two PC byte-verifier reports.
// Never implies native gameplay, physical QA or release approval.
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process'),path=require('node:path');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const REF='integration/cc001-r17-w11-multiplayer-qa-candidate-20261030';
const PINNED='173273122c11cbf738e8b954e32506a6196fe8ec';
const valid=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x)&&x!==RC1;
const count=x=>Number.isSafeInteger(x)&&x>50;
function evaluate(input) {
 const fail=[],source=input.sourceGate||{},build=input.build||{},receipt=input.receipt||{},pcs=[input.pc1||{},input.pc2||{}],
 selected=input.selectedSHA,remote=input.a70RefSHA;
 const bad=(condition,code)=>{if(condition)fail.push(code)};
 bad(!valid(selected)||selected!==PINNED,'UNPINNED_OR_RC1_CANDIDATE');
 bad(remote!==selected,'A70_REF_CHANGED_OR_NOT_ADMITTED');
 bad(source.schema!=='CC001-W11-A42-SOURCE-1'||source.status!=='SOURCE_CONTRACT_READY_FOR_A70_A72_REVIEW'||source.candidateSHA!==selected||source.ownerRef!==REF||source.frozenRC1!==RC1||!Array.isArray(source.failures)||source.failures.length>0||!Array.isArray(source.sourceFaults)||source.sourceFaults.length>0,'SOURCE_GATE_NOT_APPROVED');
 bad(build.schema!=='CC001-W10-A72-WINDOWS-1','WRONG_BUILD_SCHEMA');
 bad(build.ref!==REF,'WRONG_A70_SOURCE_REF');
 bad(build.candidateSHA!==selected,'BUILD_SHA_NOT_SELECTED_SHA');
 bad(build.rc1Base!==RC1,'BUILD_RC1_MISMATCH');
 bad(build.status!=='PASS_BUILD_EVIDENCE_ONLY','NATIVE_BUILD_NOT_PASSED');
 bad(build.unity?.exitCode!==0,'UNITY_EXIT_NOT_ZERO');
 bad(build.buildReport?.result!=='Succeeded'||build.buildReport?.errors!==0,'BUILD_REPORT_NOT_SUCCEEDED');
 bad(!count(build.playerCount)||!Array.isArray(build.playerInventory)||build.playerInventory.length!==build.playerCount,'INCOMPLETE_PLAYER_INVENTORY');
 const seen=new Set();
 for(const item of build.playerInventory||[]){
  const safe=typeof item.path==='string'&&item.path.length>0&&!item.path.startsWith('/')&&!item.path.includes('\\')&&!item.path.includes(':')&&item.path.split('/').every(p=>p&&p!=='.'&&p!=='..');
  if(!safe||seen.has(item.path)||!Number.isSafeInteger(item.bytes)||item.bytes<0||!/^[0-9a-fA-F]{64}$/.test(item.sha256||'')){
   fail.push('INVALID_OR_DUPLICATE_PLAYER_INVENTORY');break;
  }
  seen.add(item.path);
 }
 bad(!build.playerInventory?.some(x=>x.path==='CoreClash.exe')||
     !build.playerInventory?.some(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'),'EXE_OR_DLL_MISSING');
 const requiredGates=['sourcePreExact','sourceAfterMaterialized','sourceNotMutated','unityExitZero','buildSucceeded','playerComplete','compilerResponseCaptured','playerDefineCorrect','noDiagnostic','buildMarker'];
 bad(!build.gates||requiredGates.some(k=>build.gates[k]!==true)||Object.values(build.gates||{}).some(v=>v!==true),'A72_PROVENANCE_GATE_NOT_PASSED');
 bad(!Array.isArray(build.blockers)||build.blockers.length>0,'A72_BLOCKERS_NONEMPTY');
 bad(receipt.schema!=='CC001-W10-A72-RECEIPT-1','BAD_RECEIPT_SCHEMA');
 bad(receipt.candidateSHA!==selected||receipt.rc1!==RC1||receipt.status!=='PASS_BUILD_EVIDENCE_ONLY','RECEIPT_SHA_OR_STATUS_MISMATCH');
 for(const [i,x] of pcs.entries()){
  const pre='PC'+(i+1)+'_';
  bad(x.status!=='PASS_BINARY_INTEGRITY_ONLY',pre+'BINARY_NOT_VERIFIED');
  bad(x.candidateSHA!==selected,pre+'WRONG_CANDIDATE');
  bad(!count(x.expectedFiles)||x.expectedFiles!==build.playerCount||x.actualFiles!==build.playerCount,pre+'FILE_COUNT_MISMATCH');
  bad(!Array.isArray(x.failures)||x.failures.length!==0,pre+'BINARY_FAILURES');
 }
 return {schema:'CC001-W11-A42-HANDOFF-1',
  status:fail.length?'HOLD':'READY_FOR_A60_INDEPENDENT_QA_REVIEW_ONLY',
  selectedSHA:selected||null,reasonCodes:[...new Set(fail)],
  recorded:{buildStatus:build.status||'MISSING',expectedPlayerFiles:build.playerCount||0,
   pc1Status:pcs[0].status||'MISSING',pc2Status:pcs[1].status||'MISSING'},
  scope:{windowsBuild:'A72_EXTERNAL_PROVENANCE_ONLY',twoPCBinary:'FILE_HASH_ONLY',g3:'NOT_ATTESTED',
   gameBoot:'NOT_ATTESTED',physicalSynchronization:'NOT_ATTESTED',a60IndependentQA:'REQUIRED',release:'STOP'},
  warning:'Checks the consistency of supplied files, not their independent authenticity. A60 must verify original raw evidence before any runtime QA decision.'};
}
function opts(argv) {
 const allowed=new Set(['--selected-sha','--repo','--source-gate','--build','--receipt','--pc1','--pc2','--out']),x={};
 for(let i=0;i<argv.length;i+=2){if(!allowed.has(argv[i])||!argv[i+1]||x[argv[i]])throw Error('Invalid arguments');x[argv[i]]=argv[i+1]}
 for(const key of ['--selected-sha','--repo','--source-gate','--build','--receipt','--pc1','--pc2'])
  if(!x[key])throw Error('Missing '+key);
 return x;
}
function main(argv) {
 const a=opts(argv),read=f=>JSON.parse(fs.readFileSync(f,'utf8')),bytes={};
 const query=cp.spawnSync('git',['-C',path.resolve(a['--repo']),'ls-remote','--exit-code','origin','refs/heads/'+REF],{encoding:'utf8'});
 if(query.error||query.status!==0)throw Error('A70_REMOTE_REF_NOT_VERIFIED');
 const remoteSha=query.stdout.trim().split(/\s+/)[0];
 if(!/^[a-f0-9]{40}$/.test(remoteSha))throw Error('A70_REMOTE_SHA_INVALID');
 for(const key of ['--source-gate','--build','--receipt','--pc1','--pc2']) {
  const value=fs.readFileSync(a[key]);bytes[key.slice(2)]={
   sha256:crypto.createHash('sha256').update(value).digest('hex'),
   bytes:value.length};
 }
 const result=evaluate({selectedSHA:a['--selected-sha'],a70RefSHA:remoteSha,
  sourceGate:read(a['--source-gate']),build:read(a['--build']),receipt:read(a['--receipt']),pc1:read(a['--pc1']),pc2:read(a['--pc2'])});
 result.inputs=bytes;const content=JSON.stringify(result,null,2)+'\n';
 if(a['--out'])fs.writeFileSync(a['--out'],content,{flag:'wx'});else process.stdout.write(content);
 return result.status==='HOLD'?2:0;
}
if(require.main===module) {
 try{process.exitCode=main(process.argv.slice(2))}
 catch(e){process.stderr.write('A42_W11_CHAIN_HOLD '+e.message+'\n');process.exitCode=3}
}
module.exports={evaluate,main,RC1,REF,PINNED};
