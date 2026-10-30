'use strict';
/**
 * CC-001 R17-W11 A80: offline byte-level evidence attachment for view-timeline observations.
 * No original screenshot/log content in output, and NO implied visual validation or physical G3.
 * Scope: files already captured by the operator, not network snapshot producers.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {analyze}=require('./verify-view-timeline.cjs');
const PINNED_SHA='173273122c11cbf738e8b954e32506a6196fe8ec';
const isSha=s=>typeof s==='string' && /^[a-f0-9]{64}$/i.test(s);
const isCommit=s=>typeof s==='string' && /^[a-f0-9]{40}$/i.test(s);
const isImage=buffer=>buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) ||
 (buffer.length>=3&&buffer.subarray(0,3).equals(Buffer.from('ffd8ff','hex'))) ||
 (buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP');
function inside(base,p){const r=path.relative(base,p);return r!==''&&!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r);}
function readFileDigest(root,rel,maxBytes,expectImage){
 if(typeof rel!=='string'||!rel||path.isAbsolute(rel)||rel.split(/[\\/]/).includes('..')||rel.includes('\0'))
  return {status:'INVALID_PATH'};
 let resolved;try{resolved=fs.realpathSync(path.resolve(root,rel));}catch{return {status:'FILE_NOT_FOUND'};}
 if(!inside(root,resolved))return {status:'PATH_OUTSIDE_CAPTURE_ROOT'};
 let st;try{st=fs.statSync(resolved);}catch{return {status:'FILE_UNREADABLE'};}
 if(!st.isFile()||st.size===0||st.size>maxBytes)return {status:'EMPTY_OR_OVERSIZE_FILE'};
 let fd,sz=0,first=Buffer.alloc(0),h=crypto.createHash('sha256');
 try{
  fd=fs.openSync(resolved,'r');let b=Buffer.alloc(65536),n;
  while((n=fs.readSync(fd,b,0,b.length,null))>0){
   sz+=n;if(sz>maxBytes)return {status:'FILE_CHANGED_OR_TOO_LARGE'};
   if(first.length<16)first=Buffer.concat([first,b.subarray(0,Math.min(16-first.length,n))]);
   h.update(b.subarray(0,n));
  }
 }catch{return {status:'FILE_UNREADABLE'};}finally{if(fd!==undefined)fs.closeSync(fd);}
 if(sz!==st.size)return {status:'FILE_CHANGED_DURING_HASH'};
 if(expectImage&&!isImage(first))return {status:'UNRECOGNIZED_SCREENSHOT_HEADER'};
 return {status:'HASHED',bytes:sz,sha256:h.digest('hex')};
}
function verify(session,{root,expectedSourceSha=PINNED_SHA}={}){
 const contradictions=[],gaps=[],attestations=[];
 const error=(code,ctx={})=>contradictions.push({code,...ctx});
 const gap=(code,ctx={})=>gaps.push({code,...ctx});
 const timeline=analyze(session);
 if(!isCommit(expectedSourceSha)||expectedSourceSha.toLowerCase()!==PINNED_SHA)error('WRONG_CANDIDATE_EXPECTED_SHA');
 if(!isCommit(session?.policy?.targetSourceSha)||session.policy.targetSourceSha.toLowerCase()!==PINNED_SHA)error('WRONG_CANDIDATE_SESSION_SHA');
 let base;
 if(typeof root!=='string'||!root){gap('CAPTURE_ROOT_REQUIRED');}
 else {try{base=fs.realpathSync(root);}catch{gap('CAPTURE_ROOT_NOT_FOUND');}}
 const frames=Array.isArray(session?.frames)?session.frames:[];
 if(frames.length>1000)gap('FRAME_LIMIT_EXCEEDED');
 if(base){
  const cache=new Map();
  for(const f of frames.slice(0,1000))for(const o of (Array.isArray(f?.observations)?f.observations:[])){
   if(!['PC1','PC2'].includes(o?.device))continue;
   const ctx={frame:f?.index,device:o.device};
   if(!isCommit(o.evidence?.sourceSha)||o.evidence.sourceSha.toLowerCase()!==PINNED_SHA){error('DEVICE_NOT_ON_PINNED_SOURCE',ctx);}
   for(const kind of ['screenshot','log']){
    const rel=o.evidence?.[kind+'Path'],expected=o.evidence?.[kind+'Sha256'];
    if(!isSha(expected)){gap('UNVERIFIED_'+kind.toUpperCase()+'_SHA',ctx);continue;}
    let k=JSON.stringify([kind,rel]);let value=cache.get(k);
    if(!value){value=readFileDigest(base,rel,kind==='screenshot'?32*1024*1024:128*1024*1024,kind==='screenshot');cache.set(k,value);}
    if(value.status!=='HASHED'){error(kind.toUpperCase()+'_'+value.status,ctx);continue;}
    if(value.sha256!==expected.toLowerCase()){error(kind.toUpperCase()+'_SHA_MISMATCH',ctx);continue;}
    attestations.push({...ctx,kind,bytes:value.bytes,sha256:value.sha256});
   }
  }
 }
 const verdict=contradictions.length||timeline.verdict==='OBSERVED_CONTRACT_FAIL'?'EVIDENCE_OR_CONTRACT_FAIL':
   gaps.length||timeline.verdict!=='OBSERVATION_SEQUENCE_CONSISTENT'?'INSUFFICIENT_EVIDENCE':'BYTES_AND_ANNOTATIONS_CONSISTENT';
 return {schema:'cc001-r17-w11-a80-evidence-bind-v1',pinnedCandidateSha:PINNED_SHA,verdict,
  physicalG3Status:'NOT_ASSESSED',imageContentSemanticallyReviewed:false,
  disclaimer:'Screenshot bytes are SHA-256 verified but NOT decoded or semantically inspected. No source, Player.log, network or in-game claims are verified by this tool.',
  timelineVerdict:timeline.verdict,
  summary:{frames:timeline.summary.frames,filesVerified:attestations.length,
    contradictions:contradictions.length+timeline.summary.contradictions,gaps:gaps.length+timeline.summary.gaps},
  contradictions,gaps,sourceTimelineContradictions:timeline.contradictions,sourceTimelineGaps:timeline.gaps,attestations};
}
module.exports={verify,PINNED_SHA};
if(require.main===module){
 const args=process.argv.slice(2),val=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
 const input=val('--input'),root=val('--root'),out=val('--out');
 if(!input||!root){console.error('Usage: node verify-view-evidence.cjs --input session.json --root PRIVATE_CAPTURE_ROOT [--out report.json]');process.exitCode=2;}
 else {try{
  const raw=fs.readFileSync(input);const report=verify(JSON.parse(raw.toString('utf8')),{root});report.inputSha256=crypto.createHash('sha256').update(raw).digest('hex');
  const rendered=JSON.stringify(report,null,2)+'\n';
  if(out){if(fs.existsSync(out))throw new Error('Output exists; refusing overwrite');fs.writeFileSync(out,rendered,{encoding:'utf8',flag:'wx'});}else process.stdout.write(rendered);
  process.exitCode=report.verdict==='EVIDENCE_OR_CONTRACT_FAIL'?1:report.verdict==='INSUFFICIENT_EVIDENCE'?3:0;
 }catch(e){console.error('A80_EVIDENCE_CHECK_ERROR '+e.message);process.exitCode=4;}}
}
