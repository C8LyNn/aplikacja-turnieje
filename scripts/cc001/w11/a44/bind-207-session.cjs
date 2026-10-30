'use strict';
// A44 W11: fail-closed static evidence receipt linkage to A70 #207 / A72 Windows Player.
// Does NOT execute/attest A72 verification, Unity, physical PC QA, or release.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const APPROVED_SHA = '173273122c11cbf738e8b954e32506a6196fe8ec';
const RC1_SHA = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const HEX64 = /^[a-f0-9]{64}$/i;
function sha256(b) { return crypto.createHash('sha256').update(b).digest('hex'); }
function need(ok, code) { if (!ok) throw Error(code); }
function jsonFile(filename, limit = 5*1024*1024) {
  const s = fs.lstatSync(filename);
  need(s.isFile() && !s.isSymbolicLink() && s.size > 0 && s.size <= limit, 'FILE_NOT_REGULAR_OR_SIZE_INVALID');
  const bytes = fs.readFileSync(filename);
  return {value:JSON.parse(bytes.toString('utf8')), sha256:sha256(bytes), bytes:bytes.length};
}
function validInventory(inventory) {
  need(Array.isArray(inventory) && inventory.length > 50 && inventory.length < 10000, 'A72_INVENTORY_MISSING');
  const seen = new Set();
  const byName = new Map();
  for (const x of inventory) {
    need(x && typeof x.path === 'string' && x.path.length < 512 && !x.path.startsWith('/') && !x.path.includes('\\') && !x.path.includes(':') && x.path.split('/').every(p=>p && p!=='.' && p!=='..'), 'A72_UNSAFE_PATH');
    need(!seen.has(x.path) && Number.isSafeInteger(x.bytes) && x.bytes >= 0 && HEX64.test(x.sha256), 'A72_BAD_INVENTORY_ENTRY');
    seen.add(x.path);
    byName.set(x.path,{bytes:x.bytes,sha256:x.sha256.toLowerCase()});
  }
  const exe = byName.get('CoreClash.exe');
  const dll = byName.get('CoreClash_Data/Managed/Assembly-CSharp.dll');
  need(exe && dll && exe.bytes > 0 && dll.bytes > 0, 'A72_EXE_OR_MANAGED_DLL_MISSING');
  return {entries:inventory.length,exe,dll};
}
function verifyReceipt(r, label, expectedCount) {
  need(r && r.status === 'PASS_BINARY_INTEGRITY_ONLY',label+'_BINARY_VERIFIER_NOT_PASS');
  need(r.candidateSHA === APPROVED_SHA,label+'_CANDIDATE_MISMATCH');
  need(r.expectedFiles === expectedCount && r.actualFiles === expectedCount,label+'_INVENTORY_COUNT_MISMATCH');
  need(Array.isArray(r.failures) && r.failures.length === 0,label+'_VERIFIER_FAILURES');
}
function validate(summary, record, pc1, pc2) {
  need(summary?.schema==='CC001-W10-A72-WINDOWS-1','A72_WRONG_SCHEMA');
  need(summary.candidateSHA===APPROVED_SHA, 'A72_WRONG_CANDIDATE');
  need(summary.rc1Base===RC1_SHA,'A72_WRONG_ANCESTRY');
  need(summary.status==='PASS_BUILD_EVIDENCE_ONLY' && Array.isArray(summary.blockers) && summary.blockers.length===0,'A72_BUILD_HOLD');
  const inv=validInventory(summary.playerInventory);
  need(summary.playerCount === inv.entries,'A72_COUNT_MISMATCH');
  verifyReceipt(pc1,'PC1',inv.entries);
  verifyReceipt(pc2,'PC2',inv.entries);
  need(record?.schemaVersion===1 && record.project==='CC-001' && record.wave==='R17-W10' && record.agent==='A44','WRONG_SESSION_RECORD');
  need(record.baselineCommitReference===RC1_SHA, 'SESSION_WRONG_BASELINE');
  need(typeof record.sessionId==='string' && /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(record.sessionId),'SESSION_ID_INVALID');
  need(record.qaDisposition==='PENDING_INDEPENDENT_A60_PHYSICAL_QA' && record.defectFixClaims==='NONE','SESSION_FALSE_QA_CLAIM');
  need(record.buildIdentity?.pairExeByteIdentity==='MATCHED','SESSION_EXE_PAIR_NOT_MATCHED');
  need(record.buildIdentity.pc1ExeSha256?.toLowerCase()===inv.exe.sha256 && record.buildIdentity.pc2ExeSha256?.toLowerCase()===inv.exe.sha256,'SESSION_EXE_NOT_A72_BUILD');
  for (const x of ['originalPc1Sha256','originalPc2Sha256','pc1LogSha256','pc2LogSha256']) {
    need(HEX64.test(record.evidence?.[x]),'SESSION_LOG_PROVENANCE_MISSING');
  }
  need(Array.isArray(record.scenarios) && Array.isArray(record.issues),'SESSION_OBSERVATIONS_MISSING');
  return {
    schema:'CC001-W11-A44-207-SESSION-LINK-1',
    candidateCommit:APPROVED_SHA, protectedBaseCommit:RC1_SHA,
    sessionId:record.sessionId,
    a72Inventory:{entries:inv.entries,exeSha256:inv.exe.sha256,dllSha256:inv.dll.sha256},
    devices:{pc1:'OPERATOR_A72_BINARY_VERIFIER_RECEIPT_PASS',pc2:'OPERATOR_A72_BINARY_VERIFIER_RECEIPT_PASS'},
    logSha256:{pc1:record.evidence.pc1LogSha256,pc2:record.evidence.pc2LogSha256},
    receiptConsistency:'PASS_STATIC_RECEIPT_LINK_ONLY',
    receiptAuthenticity:'NOT_ATTESTED_BY_A44',
    realDeviceProvenance:'NOT_ATTESTED_BY_A44',
    gameplaySynchronization:'NOT_ASSESSED',
    qaDisposition:'PENDING_INDEPENDENT_A60_PHYSICAL_QA',
    releaseApproval:'NO',
    caveat:'A72 receipts are operator-supplied JSON; this tool checks consistency but cannot prove reports originated from live binary execution. A60 must independently validate original files/devices.'
  };
}
function parseFlags(argv){
 const map={'--summary':'summary','--session':'session','--pc1-receipt':'pc1','--pc2-receipt':'pc2','--out':'out'};
 const found={};
 for(let i=0;i<argv.length;i+=2){
  need(map[argv[i]] && argv[i+1] && !argv[i+1].startsWith('--'),'BAD_ARGUMENTS');
  need(!Object.hasOwn(found,map[argv[i]]),'DUPLICATE_ARGUMENT');
  found[map[argv[i]]]=argv[i+1];
 }
 for(const k of Object.values(map))need(found[k],'MISSING_ARGUMENT_'+k);
 return found;
}
function run(o){
 need(o && o.summary && o.session && o.pc1 && o.pc2 && o.out,'MISSING_ARGUMENT');
 const destination=path.resolve(o.out);
 need(!fs.existsSync(destination),'OUTPUT_ALREADY_EXISTS');
 need(fs.existsSync(path.dirname(destination)),'OUTPUT_PARENT_MISSING');
 const s=jsonFile(o.summary),record=jsonFile(o.session),a=jsonFile(o.pc1),b=jsonFile(o.pc2);
 const result=validate(s.value,record.value,a.value,b.value);
 result.inputSha256={a72Summary:s.sha256,a44Session:record.sha256,pc1Receipt:a.sha256,pc2Receipt:b.sha256};
 fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
 return result;
}
module.exports={validate,run,parseFlags,validInventory,APPROVED_SHA};
if(require.main===module){
 try{const r=run(parseFlags(process.argv.slice(2)));console.log('A44_RECEIPT_LINK_PASS_STATIC_ONLY '+r.sessionId+' candidate='+r.candidateCommit);}
 catch(e){console.error('A44_RECEIPT_LINK_HOLD '+e.message);process.exitCode=2;}
}