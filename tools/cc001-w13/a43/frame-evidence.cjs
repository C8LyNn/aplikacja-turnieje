'use strict';
// A43 W13: read-only P2 frame observation contract (never a G3 acceptance gate).
const fs=require('node:fs'),crypto=require('node:crypto');
const FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const natural=n=>Number.isSafeInteger(n)&&n>=0;
function analyze(lines,holdMs=180){
  if(!finite(holdMs)||holdMs<=0)throw Error('invalid threshold');
  const items=String(lines).split(/\r?\n/).filter(x=>x.trim()).map((s,i)=>{try{return JSON.parse(s)}catch{throw Error('invalid json row '+i)}});
  const h=items.shift();
  if(!h||h.kind!=='header'||h.role!=='client'||h.schema!=='CC001_A43_W13_FRAMES_001'||!['runtime','video'].includes(h.origin)||typeof h.sourceSha!=='string')throw Error('invalid header');
  const signals=[],missing=[],byBall=new Map(),seen=new Set(),frameTimes=new Map();
  let lastFrame=-1,lastTime=-1,holds=0,portals=0,unsupported=0;
  if(h.sourceSha!==FREEZE)missing.push('WRONG_FROZEN_SOURCE_DECLARATION');
  for(const e of items){
    if(!e||e.kind!=='frame'||!natural(e.frame)||!natural(e.ballId)||e.ballId===0||!natural(e.revision)||e.revision===0||
      !natural(e.actionSerial)||!finite(e.ms)||e.ms<0||!finite(e.x)||!finite(e.y)||!finite(e.authX)||!finite(e.authY)||
      !finite(e.speed)||e.speed<0||!['Moving','Aiming','Over'].includes(e.phase)||!['NONE','PORTAL','TELEPORT','SWAP'].includes(e.event))throw Error('invalid frame');
    if(e.frame<lastFrame||e.ms<lastTime||(e.frame>lastFrame&&e.ms<=lastTime))throw Error('unordered local frame/clock');
    if(frameTimes.has(e.frame)&&frameTimes.get(e.frame)!==e.ms)throw Error('frame clock contradiction');
    const k=e.frame+':'+e.ballId;
    if(seen.has(k))throw Error('duplicate frame ball');
    seen.add(k);frameTimes.set(e.frame,e.ms);lastFrame=e.frame;lastTime=e.ms;
    const p=byBall.get(e.ballId);
    if(p&&e.revision<p.revision)signals.push({code:'REVISION_REGRESSION',frame:e.frame,ballId:e.ballId});
    if(e.event==='PORTAL'){
      portals++;if(Math.hypot(e.x-e.authX,e.y-e.authY)>0.5)signals.push({code:'PORTAL_SNAP_MISMATCH',frame:e.frame,ballId:e.ballId});
    }else if(e.event!=='NONE')unsupported++;
    const same=p&&e.frame===p.frame+1&&e.phase==='Moving'&&p.phase==='Moving'&&
      e.actionSerial===p.actionSerial&&e.event==='NONE'&&p.event==='NONE'&&e.speed>=1&&p.speed>=1&&
      Math.hypot(e.x-p.x,e.y-p.y)<0.001;
    if(same){
      const start=p.holdStart??p.ms;
      e.holdStart=start;e.holdReported=p.holdReported;
      if(e.ms-start>=holdMs&&!e.holdReported){holds++;signals.push({code:'VISUAL_POSE_HOLD_CANDIDATE',frame:e.frame,ballId:e.ballId});e.holdReported=true;}
    }
    byBall.set(e.ballId,e);
  }
  const times=[...frameTimes],intervals=[];
  for(let i=1;i<times.length;i++){
    if(times[i][0]!==times[i-1][0]+1)missing.push('MISSING_FRAME_IDS');
    else intervals.push(times[i][1]-times[i-1][1]);
  }
  if(times.length<3)missing.push('INSUFFICIENT_FRAME_SAMPLE_COUNT');
  if(h.origin!=='runtime')missing.push('VIDEO_TIMING_NOT_ENGINE_TIMING');
  if(!items.some(e=>e.phase==='Moving'))missing.push('NO_MOVING_SAMPLES');
  if(unsupported)missing.push('TELEPORT_SWAP_ONLY_IN_LATER_207_NOT_FROZEN_W11');
  const pct=(p)=>intervals.length?[...intervals].sort((a,b)=>a-b)[Math.ceil(p*intervals.length)-1]:null;
  const timing=h.origin==='runtime'&&!missing.includes('MISSING_FRAME_IDS')&&intervals.length>=2?
    {p50Ms:pct(.5),p95Ms:pct(.95),p99Ms:pct(.99),sampleCount:intervals.length}:null;
  const status=h.sourceSha!==FREEZE?'WRONG_SOURCE_DECLARATION':signals.length?'OBSERVATIONAL_SIGNALS':missing.length?'INSUFFICIENT':'OBSERVATIONS_ONLY';
  return {schema:'CC001_A43_W13_FRAME_REPORT_001',status,qaFreezeSha:FREEZE,declaredSourceSha:h.sourceSha,
    actualBinaryAttested:false,physicalPcPairAttested:false,independentG3Attested:false,
    totals:{observations:items.length,frames:times.length,portals,unsupportedLaterEvents:unsupported,holdCandidates:holds},
    frameTiming:timing,missing:[...new Set(missing)],signals:signals.slice(0,80),
    truncatedSignals:signals.length>80,limitations:'Operator declarations are not verified binary identity; render observations are not transport or physical G3 proof.'};
}
function main(args){
  if(!args[0]||args.length>3)throw Error('usage node frame-evidence.cjs CAPTURE.ndjson [REPORT.json]');
  const b=fs.readFileSync(args[0]);if(b.length>16*1024*1024)throw Error('input too large');
  const report=analyze(b.toString('utf8'));report.input={sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length};
  const json=JSON.stringify(report,null,2)+'\n';
  if(args[1]){if(require('node:path').resolve(args[0])===require('node:path').resolve(args[1]))throw Error('refusing to overwrite input');fs.writeFileSync(args[1],json,{flag:'wx'});}
  else process.stdout.write(json);
  return report.status==='WRONG_SOURCE_DECLARATION'?1:report.status==='INSUFFICIENT'?2:0;
}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2))}catch(e){process.stderr.write('A43_FRAME_ERROR '+e.message+'\n');process.exitCode=3}}
module.exports={analyze,FREEZE};
