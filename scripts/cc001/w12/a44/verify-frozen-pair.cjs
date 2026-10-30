'use strict';
// A44 W12: offline operator-side check for the A70 W11 QA FREEZE, NOT current #207 HEAD.
// Invokes the existing A72 full WindowsPlayer verifier twice; never claims physical G3 PASS.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const FROZEN='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const HEX64=/^[a-f0-9]{64}$/i;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const need=(yes,why)=>{if(!yes)throw Error(why);};
function readJson(filename){
 const st=fs.lstatSync(filename);
 need(st.isFile()&&!st.isSymbolicLink()&&st.size>0&&st.size<=8*1024*1024,'INVALID_JSON_FILE');
 const bytes=fs.readFileSync(filename);
 return {data:JSON.parse(bytes.toString('utf8')),hash:sha(bytes)};
}
function inventoryCheck(summary){
 need(summary?.schema==='CC001-W10-A72-WINDOWS-1','WRONG_A72_SCHEMA');
 need(summary.candidateSHA===FROZEN,'NOT_FROZEN_QA_SHA');
 need(summary.rc1Base===RC1,'WRONG_PROTECTED_BASE');
 need(summary.status==='PASS_BUILD_EVIDENCE_ONLY'&&Array.isArray(summary.blockers)&&summary.blockers.length===0,'A72_BUILD_NOT_ACCEPTED');
 const xs=summary.playerInventory;
 need(Array.isArray(xs)&&xs.length>50&&xs.length<10000&&xs.length===summary.playerCount,'BAD_PLAYER_INVENTORY_COUNT');
 const names=new Map();
 for(const x of xs){
  need(x&&typeof x.path==='string'&&x.path.length<512&&!x.path.startsWith('/')&&!x.path.includes('\\')&&!x.path.includes(':')&&x.path.split('/').every(s=>s&&s!=='.'&&s!=='..'),'INVALID_PLAYER_PATH');
  need(!names.has(x.path)&&Number.isSafeInteger(x.bytes)&&x.bytes>=0&&HEX64.test(x.sha256),'BAD_INVENTORY_ITEM');
  names.set(x.path,{bytes:x.bytes,sha256:x.sha256.toLowerCase()});
 }
 const exe=names.get('CoreClash.exe'),dll=names.get('CoreClash_Data/Managed/Assembly-CSharp.dll');
 need(exe&&dll&&exe.bytes>0&&dll.bytes>0,'EXE_OR_DLL_MISSING');
 return {count:xs.length,exe:exe.sha256,dll:dll.sha256};
}
function sessionCheck(session,exe){
 need(session?.schemaVersion===1&&session.project==='CC-001'&&session.agent==='A44'&&session.wave==='R17-W10','WRONG_SESSION_SCHEMA');
 need(session.baselineCommitReference===RC1,'WRONG_SESSION_BASE');
 need(typeof session.sessionId==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(session.sessionId),'INVALID_SESSION_ID');
 need(session.qaDisposition==='PENDING_INDEPENDENT_A60_PHYSICAL_QA'&&session.defectFixClaims==='NONE','UNAUTHORIZED_QA_CLAIM');
 need(session.buildIdentity?.pairExeByteIdentity==='MATCHED','PAIR_BINARY_NOT_LINKED');
 need(session.buildIdentity.pc1ExeSha256?.toLowerCase()===exe&&session.buildIdentity.pc2ExeSha256?.toLowerCase()===exe,'EXE_SHA_NOT_A72');
 for(const k of ['pc1LogSha256','pc2LogSha256','originalPc1Sha256','originalPc2Sha256'])need(HEX64.test(session.evidence?.[k]),'MISSING_LOG_SHA');
 need(Array.isArray(session.scenarios)&&Array.isArray(session.issues),'MISSING_OPERATOR_OBSERVATIONS');
 return {sessionId:session.sessionId,pc1LogSha:session.evidence.pc1LogSha256,pc2LogSha:session.evidence.pc2LogSha256};
}
function resolvedPlayerRoot(dir){
 const st=fs.lstatSync(dir);need(st.isDirectory()&&!st.isSymbolicLink(),'BAD_PLAYER_DIRECTORY');
 return fs.realpathSync(dir);
}
function verifyNative(script,summaryFile,dir,count){
 const args=[script,'--manifest='+summaryFile,'--player='+dir,'--sha='+FROZEN];
 const p=cp.spawnSync(process.execPath,args,{encoding:'utf8',timeout:120000,maxBuffer:1024*1024,windowsHide:true,stdio:['ignore','pipe','pipe']});
 need(!p.error&&p.status===0&&!p.signal,'A72_NATIVE_VERIFIER_FAILED');
 let d;
 try {d=JSON.parse(p.stdout)}catch{throw Error('A72_NATIVE_VERIFIER_NON_JSON');}
 need(d.status==='PASS_BINARY_INTEGRITY_ONLY','A72_PLAYER_INTEGRITY_HOLD');
 need(d.candidateSHA===FROZEN&&d.expectedFiles===count&&d.actualFiles===count,'A72_PLAYER_IDENTITY_MISMATCH');
 need(Array.isArray(d.failures)&&d.failures.length===0,'A72_PLAYER_FILE_FAILURE');
 return {status:'A72_LOCAL_PLAYER_CHECK_PASS_SCOPED',expectedFiles:d.expectedFiles,reportStdoutSha256:sha(Buffer.from(p.stdout,'utf8'))};
}
function run(o){
 for(const k of ['summary','session','verifier','verifierSha','pc1','pc2','out'])need(typeof o?.[k]==='string'&&o[k].length>0,'MISSING_'+k);
 need(HEX64.test(o.verifierSha),'INVALID_VERIFIER_SHA');
 const destination=path.resolve(o.out);
 need(!fs.existsSync(destination)&&fs.existsSync(path.dirname(destination)),'OUTPUT_PATH_NOT_NEW');
 const vstat=fs.lstatSync(o.verifier);
 need(vstat.isFile()&&!vstat.isSymbolicLink()&&vstat.size>0&&vstat.size<256*1024,'VERIFIER_FILE_INVALID');
 const verifierBytes=fs.readFileSync(o.verifier);
 need(sha(verifierBytes)===o.verifierSha.toLowerCase(),'A72_VERIFIER_SHA_MISMATCH');
 const p1=resolvedPlayerRoot(o.pc1),p2=resolvedPlayerRoot(o.pc2);
 need(p1!==p2&&!p1.startsWith(p2+path.sep)&&!p2.startsWith(p1+path.sep),'DUPLICATE_OR_NESTED_PLAYER_ROOTS');
 const summaryFile=fs.realpathSync(o.summary),sessionFile=fs.realpathSync(o.session);
 const s=readJson(summaryFile),q=readJson(sessionFile);
 const inv=inventoryCheck(s.data),session=sessionCheck(q.data,inv.exe);
 // A72 owns the full-folder verifier. This wrapper never rewrites or emulates it.
 const pc1=verifyNative(fs.realpathSync(o.verifier),summaryFile,p1,inv.count);
 const pc2=verifyNative(fs.realpathSync(o.verifier),summaryFile,p2,inv.count);
 const result={schema:'CC001-W12-A44-FROZEN-PAIR-INTEGRITY-1',frozenCandidate:FROZEN,protectedRc1:RC1,
  originalPr207HeadExcludedFromThisGate:true,sessionId:session.sessionId,
  a72OriginalSourceEvidence:{summarySha256:s.hash,verifierSha256:sha(verifierBytes),fullPlayerFileCount:inv.count,exeSha256:inv.exe,assemblyCSharpSha256:inv.dll},
  a44Evidence:{sessionRecordSha256:q.hash,pc1SanitizedLogSha256:session.pc1LogSha,pc2SanitizedLogSha256:session.pc2LogSha},
  pc1,pc2,operatorScopedResult:'TWO_LOCAL_PLAYER_DIRECTORIES_PASS_A72_INTEGRITY_ONLY',
  isTwoPhysicalPCsProven:false,isNetworkSynchronizationProven:false,isSmoothnessProven:false,
  physicalDeviceAttestation:'NOT_ATTESTED_BY_A44',qaDisposition:'PENDING_INDEPENDENT_A60_PHYSICAL_QA',
  mergeMain:'PROHIBITED',releaseApproval:'NO',
  caveat:'Two distinct local folders may originate from one device; successful checks do not prove delivery, distinct physical PCs, live game execution, network state parity, FPS or G3.'};
 fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
 return result;
}
function flags(argv){
 const names={'--summary':'summary','--session':'session','--a72-verifier':'verifier','--verifier-sha256':'verifierSha','--pc1-player':'pc1','--pc2-player':'pc2','--out':'out'};
 const o={};for(let i=0;i<argv.length;i+=2){need(names[argv[i]]&&argv[i+1]&&!argv[i+1].startsWith('--'),'BAD_ARGUMENT');need(!Object.hasOwn(o,names[argv[i]]),'DUPLICATE_ARGUMENT');o[names[argv[i]]]=argv[i+1];}
 for(const k of Object.values(names))need(o[k],'MISSING_'+k);return o;
}
module.exports={run,flags,inventoryCheck,sessionCheck,FROZEN,RC1};
if(require.main===module){try{const r=run(flags(process.argv.slice(2)));console.log('A44_FROZEN_PLAYER_INTEGRITY_ONLY '+r.frozenCandidate+' '+r.sessionId);}catch(e){console.error('A44_FROZEN_HOLD '+e.message);process.exitCode=2;}}
