'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluate,RC1,REF}=require('./w11-build-chain.cjs');
const SHA='173273122c11cbf738e8b954e32506a6196fe8ec';
const entry=(path)=>({path,bytes:100,sha256:'A'.repeat(64)});
function sample() {
 const inv=[entry('CoreClash.exe'),entry('CoreClash_Data/Managed/Assembly-CSharp.dll'),
  ...Array.from({length:50},(_,i)=>entry('CoreClash_Data/file'+i))];
 const build={schema:'CC001-W10-A72-WINDOWS-1',ref:REF,candidateSHA:SHA,rc1Base:RC1,
  status:'PASS_BUILD_EVIDENCE_ONLY',unity:{exitCode:0},buildReport:{result:'Succeeded',errors:0},
  playerCount:inv.length,playerInventory:inv,blockers:[],
  gates:{sourcePreExact:true,sourceAfterMaterialized:true,sourceNotMutated:true,unityExitZero:true,
   buildSucceeded:true,playerComplete:true,compilerResponseCaptured:true,playerDefineCorrect:true,
   noDiagnostic:true,buildMarker:true}};
 const receipt={schema:'CC001-W10-A72-RECEIPT-1',candidateSHA:SHA,rc1:RC1,status:'PASS_BUILD_EVIDENCE_ONLY'};
 const pc={status:'PASS_BINARY_INTEGRITY_ONLY',candidateSHA:SHA,expectedFiles:inv.length,actualFiles:inv.length,failures:[]};
 return {selectedSHA:SHA,a70RefSHA:SHA,sourceGate:{schema:'CC001-W11-A42-SOURCE-1',status:'SOURCE_CONTRACT_READY_FOR_A70_A72_REVIEW',candidateSHA:SHA,ownerRef:REF,frozenRC1:RC1,failures:[],sourceFaults:[]},build,receipt,pc1:{...pc},pc2:{...pc}};
}
function hold(code,x){const r=evaluate(x);assert.equal(r.status,'HOLD');assert(r.reasonCodes.includes(code),r.reasonCodes.join(','));}
test('matched source, build and two PC hashes only permits A60 review',()=>{const x=evaluate(sample());
 assert.equal(x.status,'READY_FOR_A60_INDEPENDENT_QA_REVIEW_ONLY');assert.equal(x.scope.g3,'NOT_ATTESTED');
 assert.equal(x.scope.gameBoot,'NOT_ATTESTED')});
test('missing everything cannot pass',()=>hold('UNPINNED_OR_RC1_CANDIDATE',{}));
test('stale A70 integration head rejects addon',()=>hold('A70_REF_CHANGED_OR_NOT_ADMITTED',{...sample(),a70RefSHA:'3d377767e72473cebd90e49293a0cd5dada70464'}));
test('RC1 source cannot satisfy new build',()=>hold('UNPINNED_OR_RC1_CANDIDATE',{...sample(),selectedSHA:RC1}));
test('different build SHA rejects',()=>{const s=sample();s.build.candidateSHA='0'.repeat(40);hold('BUILD_SHA_NOT_SELECTED_SHA',s)});
test('wrong source ref rejects',()=>{const s=sample();s.build.ref='feat/other';hold('WRONG_A70_SOURCE_REF',s)});
test('HOLD build status rejects',()=>{const s=sample();s.build.status='HOLD';hold('NATIVE_BUILD_NOT_PASSED',s)});
test('Unity subprocess failure rejects',()=>{const s=sample();s.build.unity.exitCode=1;hold('UNITY_EXIT_NOT_ZERO',s)});
test('BuildPipeline failed rejects',()=>{const s=sample();s.build.buildReport.result='Failed';hold('BUILD_REPORT_NOT_SUCCEEDED',s)});
test('bad count rejects',()=>{const s=sample();s.build.playerCount=51;hold('INCOMPLETE_PLAYER_INVENTORY',s)});
test('missing DLL rejects',()=>{const s=sample();s.build.playerInventory[1].path='bad.dll';hold('EXE_OR_DLL_MISSING',s)});
test('compiler/source provenance HOLD rejects',()=>{const s=sample();s.build.gates.playerDefineCorrect=false;hold('A72_PROVENANCE_GATE_NOT_PASSED',s)});
test('A72 blocker receipt rejects',()=>{const s=sample();s.build.blockers=['source'];hold('A72_BLOCKERS_NONEMPTY',s)});
test('wrong receipt SHA rejects',()=>{const s=sample();s.receipt.candidateSHA='0'.repeat(40);hold('RECEIPT_SHA_OR_STATUS_MISMATCH',s)});
test('wrong receipt schema rejects',()=>{const s=sample();s.receipt.schema='WRONG';hold('BAD_RECEIPT_SCHEMA',s)});
test('PC1 evidence missing rejects',()=>{const s=sample();delete s.pc1;hold('PC1_BINARY_NOT_VERIFIED',s)});
test('PC2 candidate mismatch rejects',()=>{const s=sample();s.pc2.candidateSHA='0'.repeat(40);hold('PC2_WRONG_CANDIDATE',s)});
test('PC1 file mismatch rejects',()=>{const s=sample();s.pc1.actualFiles--;hold('PC1_FILE_COUNT_MISMATCH',s)});
test('PC2 tamper failures reject',()=>{const s=sample();s.pc2.failures=['HASH_MISMATCH'];hold('PC2_BINARY_FAILURES',s)});
test('empty missing inventory rejects',()=>{const s=sample();s.build.playerInventory=[];hold('INCOMPLETE_PLAYER_INVENTORY',s)});
test('missing A72 build report rejects',()=>{const s=sample();delete s.build.buildReport;hold('BUILD_REPORT_NOT_SUCCEEDED',s)});
test('no PC2 QA claim is made even on apparent positive input',()=>{const r=evaluate(sample());assert.equal(r.scope.physicalSynchronization,'NOT_ATTESTED')});
test('source gate mismatched SHA blocks',()=>{const s=sample();s.sourceGate.candidateSHA='0'.repeat(40);hold('SOURCE_GATE_NOT_APPROVED',s)});
test('source gate held blocks',()=>{const s=sample();s.sourceGate.status='HOLD';hold('SOURCE_GATE_NOT_APPROVED',s)});
test('source gate absent blocks despite apparent clean binary reports',()=>{const s=sample();delete s.sourceGate;hold('SOURCE_GATE_NOT_APPROVED',s)});
test('old A30 addon cannot be relabeled W11 PR207',()=>{const s=sample();s.selectedSHA='3a6fb11f70cbdd354ca319b6c48e5c080a1ae193';hold('UNPINNED_OR_RC1_CANDIDATE',s)});
test('old W10 A70 SHA cannot be relabeled W11 PR207',()=>{const s=sample();s.selectedSHA='3d377767e72473cebd90e49293a0cd5dada70464';hold('UNPINNED_OR_RC1_CANDIDATE',s)});
test('source evidence must refer to official W11 A70 branch',()=>{const s=sample();s.sourceGate.ownerRef='integration/wrong';hold('SOURCE_GATE_NOT_APPROVED',s)});
test('source evidence must preserve RC1 ancestry record',()=>{const s=sample();s.sourceGate.frozenRC1='0'.repeat(40);hold('SOURCE_GATE_NOT_APPROVED',s)});
test('source evidence cannot carry failing rules',()=>{const s=sample();s.sourceGate.failures.push('NET_REGRESSION');hold('SOURCE_GATE_NOT_APPROVED',s)});
test('source evidence cannot carry failing source checks',()=>{const s=sample();s.sourceGate.sourceFaults.push('MISSING_REVISION');hold('SOURCE_GATE_NOT_APPROVED',s)});
test('binary inventory rejects duplicate file names',()=>{const s=sample();s.build.playerInventory[2].path='CoreClash.exe';hold('INVALID_OR_DUPLICATE_PLAYER_INVENTORY',s)});
test('binary inventory rejects invalid SHA hex',()=>{const s=sample();s.build.playerInventory[2].sha256='BAD';hold('INVALID_OR_DUPLICATE_PLAYER_INVENTORY',s)});
test('binary inventory rejects traversal',()=>{const s=sample();s.build.playerInventory[2].path='../foo';hold('INVALID_OR_DUPLICATE_PLAYER_INVENTORY',s)});
test('binary inventory rejects negative byte count',()=>{const s=sample();s.build.playerInventory[2].bytes=-1;hold('INVALID_OR_DUPLICATE_PLAYER_INVENTORY',s)});
test('empty fabricated A72 build gates cannot pass',()=>{const s=sample();s.build.gates={};hold('A72_PROVENANCE_GATE_NOT_PASSED',s)});
test('missing A72 blockers ledger cannot pass',()=>{const s=sample();delete s.build.blockers;hold('A72_BLOCKERS_NONEMPTY',s)});
