#!/usr/bin/env node
'use strict';
// A82 W13: exact-SHA, source-capability-aware event-to-render pose checker.
// Checks supplied samples ONLY; never certifies their origin or PC1/PC2 G3/G4.
const fs=require('node:fs');
const SHA=/^[0-9a-f]{40}$/i;
const LIMIT=2000;
const KINDS=['PORTAL','TELEPORT','SWAP'];
const EXIT={PASS:0,FAIL:1,HOLD:2,USAGE:64};
const PROFILES=Object.freeze({
  '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3':Object.freeze({
    name:'W11_QA_FREEZE_PORTAL_ONLY',supported:Object.freeze(['PORTAL']),
    excluded:Object.freeze(['TELEPORT','SWAP'])
  }),
  '87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c':Object.freeze({
    name:'POSTFREEZE_PR207_RELOCATIONS',supported:Object.freeze(['PORTAL','TELEPORT','SWAP']),
    excluded:Object.freeze([])
  })
});

function analyze(trace,expectedSha,{tolerance=0.5}={}){
  const faults=[],missing=[],unsupportedObserved=[];
  const metrics={samples:0,snapBallChecks:0,newEvents:0,perKind:{PORTAL:0,TELEPORT:0,SWAP:0}};
  const expected=typeof expectedSha==='string'?expectedSha.toLowerCase():'';
  const profile=PROFILES[expected];
  const observed=new Set();
  const report=(status,reason)=>({
    status,reason,expectedSha,sourceSha:trace?.sourceSha??null,
    sourceProfile:profile?.name??null,
    supportedKinds:profile?.supported??[],excludedKinds:profile?.excluded??[],
    fullDisplacementCapability:profile?.supported.length===KINDS.length,
    metrics,faults,missing,unsupportedObserved,
    physicalG3Status:'NOT_ASSESSED'
  });
  if(!SHA.test(expectedSha||''))return report('HOLD','Missing/invalid expected SHA');
  if(!profile)return report('HOLD','Unreviewed SHA: no source-capability profile; do not infer support');
  if(!trace||typeof trace!=='object'||Array.isArray(trace))return report('HOLD','Missing trace object');
  if(trace.schema!=='CC001-A82-DISPLACEMENT-TRACE-v2')return report('HOLD','Unsupported trace schema; v1 cannot assert source capability');
  if(!SHA.test(trace.sourceSha||'')||trace.sourceSha.toLowerCase()!==expected)return report('FAIL','Source SHA mismatch');
  if(trace.sourceProfile!==profile.name)return report('FAIL','Trace source profile inconsistent with exact SHA');
  if(!trace.evidence||!['synthetic','operator'].includes(trace.evidence.captureType))return report('HOLD','Capture type missing');
  if(!Array.isArray(trace.samples)||!trace.samples.length||trace.samples.length>LIMIT)return report('HOLD','No bounded sample set');
  if(!Number.isFinite(tolerance)||tolerance<0||tolerance>5)return report('HOLD','Invalid pose tolerance');
  const integer=Number.isSafeInteger;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const validBall=b=>b&&integer(b.id)&&b.id>0&&finite(b.x)&&finite(b.y);
  let revision=0,eventCursor=null,actionSerial=-1;
  let missingSpan=false;
  for(let i=0;i<trace.samples.length;i++){
    const s=trace.samples[i],where=`samples[${i}]`;
    if(!s||s.device!=='PC2'||s.observation!=='POST_APPLY_POST_OBSERVE'||s.phase!=='Moving'||
      !integer(s.revision)||s.revision<=revision||!integer(s.actionSerial)||s.actionSerial<actionSerial||
      !integer(s.cursorBefore)||s.cursorBefore<0||!integer(s.cursorAfter)||s.cursorAfter<s.cursorBefore||
      !Array.isArray(s.events)||!Array.isArray(s.hostBalls)||!Array.isArray(s.renderedBalls)){
      faults.push(`${where}: invalid snapshot, observation, monotonic revision/action/cursor, or arrays`);continue;
    }
    if(eventCursor!==null&&s.cursorBefore!==eventCursor){
      // Samples could be missing; this is not proof of a game defect.
      missingSpan=true;
    }
    revision=s.revision;actionSerial=s.actionSerial;eventCursor=s.cursorAfter;
    metrics.samples++;
    const hosts=new Map(),renders=new Map();
    for(const ball of s.hostBalls){
      if(!validBall(ball)||hosts.has(ball.id))faults.push(`${where}: invalid or duplicate authoritative ball`);
      else hosts.set(ball.id,ball);
    }
    for(const ball of s.renderedBalls){
      if(!validBall(ball)||renders.has(ball.id))faults.push(`${where}: invalid or duplicate rendered ball`);
      else renders.set(ball.id,ball);
    }
    let maxId=s.cursorBefore,lastId=0;
    const snap=new Set();
    for(const e of s.events){
      if(!e||!integer(e.id)||e.id<=0||!integer(e.ballId)||!integer(e.otherId)||typeof e.kind!=='string'||e.id<=lastId){
        faults.push(`${where}: invalid, duplicated or unordered game event`);continue;
      }
      lastId=e.id;
      if(e.id<=s.cursorBefore)continue;
      maxId=Math.max(maxId,e.id);
      metrics.newEvents++;
      if(!KINDS.includes(e.kind))continue;
      metrics.perKind[e.kind]++;
      if(!profile.supported.includes(e.kind)){
        unsupportedObserved.push(`${where}: ${e.kind} is NOT explicit-snap-capable at this source SHA`);
        continue;
      }
      observed.add(e.kind);
      if(e.ballId<=0||e.kind==='SWAP'&&(e.otherId<=0||e.otherId===e.ballId)){
        faults.push(`${where}: ${e.kind} missing distinct valid displacement participant IDs`);
        continue;
      }
      snap.add(e.ballId);
      if(e.kind==='SWAP')snap.add(e.otherId);
    }
    if(maxId!==s.cursorAfter)faults.push(`${where}: claimed event cursor ${s.cursorAfter} != observed ${maxId}`);
    for(const id of snap){
      const host=hosts.get(id),render=renders.get(id);
      if(!host||!render){faults.push(`${where}: displaced ball ${id} missing from paired host/render samples`);continue;}
      metrics.snapBallChecks++;
      if(Math.hypot(host.x-render.x,host.y-render.y)>tolerance)
        faults.push(`${where}: ball ${id} misleading visual path; host (${host.x},${host.y}), render (${render.x},${render.y})`);
    }
  }
  if(faults.length)return report('FAIL','Source-semantic pose or trace-integrity violation');
  if(unsupportedObserved.length)return report('HOLD','Observed events not covered by explicit-snap source capability');
  if(missingSpan)return report('HOLD','Event cursor discontinuity: missing accepted observation span');
  for(const kind of profile.supported)if(!observed.has(kind))missing.push(kind);
  if(missing.length||metrics.snapBallChecks<profile.supported.length)
    return report('HOLD','Insufficient event and per-participant pose coverage for this SHA');
  return report('PASS_SCOPED',profile.excluded.length?
    'Only PORTAL snap is supported/tested by frozen W11; TELEPORT/SWAP remain source capability gaps':
    'All registered displacement kinds matched supplied trace; independent physical QA still required');
}
function main(args=process.argv.slice(2)){
  if(args.length!==3||args[0]!=='--expected-sha'){
    console.error('Usage: node check-displacement-trace.cjs --expected-sha <approved SHA> <trace.json>');return EXIT.USAGE;
  }
  let input;
  try{input=JSON.parse(fs.readFileSync(args[2],'utf8'));}
  catch(e){console.log(JSON.stringify({status:'HOLD',reason:'Missing/unreadable trace JSON',physicalG3Status:'NOT_ASSESSED'}));return EXIT.HOLD;}
  const res=analyze(input,args[1]);console.log(JSON.stringify(res,null,2));
  return res.status==='PASS_SCOPED'?EXIT.PASS:res.status==='FAIL'?EXIT.FAIL:EXIT.HOLD;
}
if(require.main===module)process.exitCode=main();
module.exports={analyze,main,PROFILES,EXIT};
