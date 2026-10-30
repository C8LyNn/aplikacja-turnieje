#!/usr/bin/env node
'use strict';
// A82 W12: offline, mechanics-specific visual-pose contract checker.
// This is not a Unity/NGO runner and does not certify physical G3/G4.
const fs=require('node:fs');
const SHA=/^[0-9a-f]{40}$/i;
const LIMIT=2000;
const REQUIRED=['PORTAL','TELEPORT','SWAP'];
const EXIT={PASS:0,FAIL:1,HOLD:2,USAGE:64};

function analyze(trace,expectedSha,{tolerance=0.5}={}){
  const faults=[],missing=[],kinds=new Set();
  const metrics={samples:0,snapBallChecks:0,newEvents:0,perKind:{PORTAL:0,TELEPORT:0,SWAP:0}};
  const report=(status,reason)=>({status,reason,sourceSha:trace?.sourceSha??null,expectedSha,metrics,faults,missing,physicalG3Status:'NOT_ASSESSED'});
  if(!SHA.test(expectedSha||''))return report('HOLD','Invalid expected source SHA');
  if(!trace||typeof trace!=='object'||Array.isArray(trace))return report('HOLD','Missing trace JSON object');
  if(trace.schema!=='CC001-A82-DISPLACEMENT-TRACE-v1')return report('HOLD','Unknown trace schema');
  if(!SHA.test(trace.sourceSha||'')||trace.sourceSha.toLowerCase()!==expectedSha.toLowerCase())return report('FAIL','Source SHA mismatch');
  if(!trace.evidence||typeof trace.evidence!=='object'||Array.isArray(trace.evidence)||
    !['synthetic','operator'].includes(trace.evidence.captureType))return report('HOLD','Missing capture type');
  if(!Array.isArray(trace.samples)||trace.samples.length===0||trace.samples.length>LIMIT)return report('HOLD','Missing or invalid samples');
  if(!Number.isFinite(tolerance)||tolerance<0||tolerance>5)return report('HOLD','Invalid tolerance');
  let previousRevision=0,previousCursor=-1;
  const isInt=v=>Number.isSafeInteger(v);
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const validBall=b=>b&&isInt(b.id)&&b.id>0&&finite(b.x)&&finite(b.y);
  for(let i=0;i<trace.samples.length;i++){
    const s=trace.samples[i];const at=`samples[${i}]`;
    if(!s||s.device!=='PC2'||s.observation!=='POST_APPLY_POST_OBSERVE'||s.phase!=='Moving'||
      !isInt(s.revision)||s.revision<=previousRevision||!isInt(s.actionSerial)||s.actionSerial<0||
      !isInt(s.cursorBefore)||s.cursorBefore<previousCursor||!isInt(s.cursorAfter)||s.cursorAfter<s.cursorBefore||
      !Array.isArray(s.events)||!Array.isArray(s.hostBalls)||!Array.isArray(s.renderedBalls)){
      faults.push(`${at}: malformed / non-monotonic accepted revision, cursor, or observation stage`);continue;
    }
    previousRevision=s.revision;previousCursor=s.cursorAfter;metrics.samples++;
    const host=new Map(),rendered=new Map();
    for(const b of s.hostBalls){if(!validBall(b)||host.has(b.id))faults.push(`${at}: invalid/duplicate host ball`);else host.set(b.id,b);}
    for(const b of s.renderedBalls){if(!validBall(b)||rendered.has(b.id))faults.push(`${at}: invalid/duplicate rendered ball`);else rendered.set(b.id,b);}
    let cursor=s.cursorBefore;
    const ids=new Set();
    for(const e of s.events){
      if(!e||!isInt(e.id)||e.id<1||typeof e.kind!=='string'||!isInt(e.ballId)||!isInt(e.otherId)){
        faults.push(`${at}: invalid event`);continue;
      }
      if(e.id<=s.cursorBefore)continue;
      cursor=Math.max(cursor,e.id);metrics.newEvents++;
      if(!REQUIRED.includes(e.kind))continue;
      kinds.add(e.kind);metrics.perKind[e.kind]++;
      if(e.ballId>0)ids.add(e.ballId);
      if(e.kind==='SWAP'&&e.otherId>0)ids.add(e.otherId);
    }
    if(cursor!==s.cursorAfter)faults.push(`${at}: event cursor ${s.cursorAfter} differs from expected ${cursor}`);
    for(const id of ids){
      const h=host.get(id),r=rendered.get(id);
      if(!h||!r){faults.push(`${at}: displaced ball ${id} missing in host/rendered pose`);continue;}
      metrics.snapBallChecks++;
      if(Math.hypot(h.x-r.x,h.y-r.y)>tolerance)faults.push(`${at}: ball ${id} snap divergence host (${h.x},${h.y}) versus client visual (${r.x},${r.y})`);
    }
  }
  if(faults.length)return report('FAIL','Displacement contract violation');
  for(const kind of REQUIRED)if(!kinds.has(kind))missing.push(kind);
  if(missing.length)return report('HOLD','No direct observation for all three displacement kinds');
  if(metrics.snapBallChecks<4)return report('HOLD','Insufficient snapped-pose observations');
  return report('PASS_SCOPED',trace.evidence.captureType==='synthetic'?'Synthetic event/pose fixture only':'Self-reported operator samples, pending independent validation');
}
function main(argv=process.argv.slice(2)){
  if(argv.length!==3||argv[0]!=='--expected-sha'){
    console.error('Usage: node check-displacement-trace.cjs --expected-sha <40hex> <trace.json>');return EXIT.USAGE;
  }
  let trace;
  try{trace=JSON.parse(fs.readFileSync(argv[2],'utf8'));}
  catch(err){console.log(JSON.stringify({status:'HOLD',reason:'Missing/unreadable/invalid trace JSON',physicalG3Status:'NOT_ASSESSED'}));return EXIT.HOLD;}
  const outcome=analyze(trace,argv[1]);
  console.log(JSON.stringify(outcome,null,2));
  return outcome.status==='PASS_SCOPED'?EXIT.PASS:outcome.status==='FAIL'?EXIT.FAIL:EXIT.HOLD;
}
if(require.main===module)process.exitCode=main();
module.exports={analyze,main,EXIT};
