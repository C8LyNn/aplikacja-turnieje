'use strict';
// A43 W15: inspect ORIGINAL operator-initiated A33 F1/COPY QA clipboard captures.
// A33 #263 is post-freeze development: never pretend these samples originate from
// frozen W11 source, or transform clicks into continuous rendered frame evidence.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {TextDecoder}=require('node:util');
const FREEZE='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const SCHEMA='CC001_A43_W15_F1_POSE_001';
const MAX_BYTES=4*1024*1024,MAX_CAPTURES=128;
const isInt=x=>Number.isSafeInteger(x)&&x>=0;
const asInt=(x,field)=>{if(!/^\d+$/.test(String(x)))throw Error('invalid '+field);const v=Number(x);if(!isInt(v))throw Error('invalid '+field);return v};
const asFinite=(x,field)=>{if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(String(x)))throw Error('invalid '+field);const v=Number(x);if(!Number.isFinite(v))throw Error('invalid '+field);return v};
function one(lines,index){
  if(lines[0]!=='CC001_W12_F1_QA_CAPTURE')throw Error('missing capture marker at '+index);
  const find=(regex,label)=>{const hit=lines.filter(s=>regex.test(s));if(hit.length!==1)throw Error('expected exactly one '+label+' in capture '+index);return hit[0].match(regex)};
  const utc=find(/^UTC=(\S+)$/,'UTC')[1];
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z$/.test(utc)||!Number.isFinite(Date.parse(utc)))throw Error('invalid UTC');
  const seq=asInt(find(/^CAPTURE_SEQ=(\d+)$/,'CAPTURE_SEQ')[1],'CAPTURE_SEQ');
  if(seq<1)throw Error('invalid CAPTURE_SEQ');
  find(/^SOURCE_SHA=UNVERIFIED$/,'unverified source');
  find(/^CLOCK_SYNC=UNVERIFIED$/,'unsynchronized clock');
  find(/^G3_STATUS=NOT_ATTESTED \/ RAW WIN11 BUILD AND TWO-PC EVIDENCE REQUIRED$/,'G3 disclaimer');
  const ids=find(/^TURN=(\d+) REVISION=(\d+) FRAME=(\d+) ACTION_SERIAL=(\d+)$/,'authoritative identity');
  const turn=asInt(ids[1],'turn'),revision=asInt(ids[2],'revision'),frame=asInt(ids[3],'frame'),actionSerial=asInt(ids[4],'action');
  const role=find(/^ROLE: (HOST|CLIENT) \/ CONNECTION: (READY|NOT READY)$/,'network role');
  const seats=find(/^LOCAL SEAT: (P1|P2|UNASSIGNED)(?: \/ (?:CYAN|RED|PINK))? \/ ACTIVE SEAT: (P1|P2|UNKNOWN)(?: \/ (?:CYAN|RED|PINK))?$/,'seats');
  if(role[1]!=='CLIENT'||role[2]!=='READY'||seats[1]!=='P2')throw Error('not an active P2 client capture');
  const sample=find(/^POSE_SAMPLE=(CANONICAL_STATE_PLUS_LOCAL_RENDER \/ ADVISORY_ONLY|UNAVAILABLE \/ NULL_STATE)$/,'pose marker');
  if(sample[1]==='UNAVAILABLE / NULL_STATE')return {captureSeq:seq,utc,turn,revision,frame,actionSerial,phase:null,observations:0,missing:'NULL_STATE_POSE_UNAVAILABLE'};
  find(/^RENDER_POSE_PARITY_PROOF=NO \/ COMPARE ONLY SAME ACCEPTED REVISION$/,'parity disclaimer');
  const phaseRow=find(/^PHASE=(Aiming|Moving|Over) \/ UNITY_UNSCALED_TIME=(\S+)$/,'phase and Unity clock');
  const unitySeconds=asFinite(phaseRow[2],'Unity time');if(unitySeconds<0)throw Error('negative Unity time');
  const phase=phaseRow[1];
  const counts=find(/^ACTIVE_BALL_COUNT=(\d+) \/ SAMPLED=(\d+) \/ TRUNCATED=(\d+) \/ FOCUS_ID=(\d+) \/ FOCUS_STATUS=(NONE|NOT_ACTIVE|INCLUDED)$/,'sample counts');
  const active=asInt(counts[1],'active'),sampled=asInt(counts[2],'sampled'),truncated=asInt(counts[3],'truncated'),focusId=asInt(counts[4],'focus id'),focusStatus=counts[5];
  if(sampled>24||active!==sampled+truncated||
    (focusId===0&&focusStatus!=='NONE')||(focusId>0&&focusStatus==='NONE'))throw Error('invalid sample count/focus');
  const ballLines=lines.filter(s=>s.startsWith('BALL '));if(ballLines.length!==sampled)throw Error('sample count does not match pose rows');
  const balls=[];let priorId=0,invalidModes=0;
  for(const s of ballLines){
    const m=s.match(/^BALL ID=(\d+) OWNER=(\d+) HP=(\S+) STATE_X=(\S+) STATE_Y=(\S+) RENDER_X=(\S+) RENDER_Y=(\S+) RENDER_MODE=(SMOOTHED|CANONICAL)$/);
    if(!m)throw Error('invalid BALL row');
    const ballId=asInt(m[1],'ball ID'),owner=asInt(m[2],'owner'),hp=asFinite(m[3],'HP');
    if(ballId<=priorId||owner>1||hp<0)throw Error('invalid ball identity/order');
    priorId=ballId;
    const x=asFinite(m[4],'STATE_X'),y=asFinite(m[5],'STATE_Y'),renderX=asFinite(m[6],'RENDER_X'),renderY=asFinite(m[7],'RENDER_Y');
    const mode=m[8];const delta=Math.hypot(x-renderX,y-renderY);
    if(phase!=='Moving'&&mode==='SMOOTHED')invalidModes++;
    if(mode==='CANONICAL'&&delta>0.0001)invalidModes++;
    balls.push({ballId,owner,mode,canonicalRenderDistance:Math.round(delta*1e5)/1e5});
  }
  if(focusStatus==='INCLUDED'&&!balls.some(b=>b.ballId===focusId))throw Error('focused ball omitted');
  if(focusStatus==='NOT_ACTIVE'&&balls.some(b=>b.ballId===focusId))throw Error('focused ball status contradiction');
  return {captureSeq:seq,utc,turn,revision,frame,actionSerial,phase,unitySeconds,activeBalls:active,sampledBalls:sampled,
    truncatedBalls:truncated,focusId,focusStatus,observations:balls.length,invalidModes,balls};
}
function analyze(raw){
  if(typeof raw!=='string')throw Error('input must be UTF-8 text');
  const data=raw.replace(/\r\n/g,'\n').split('\n'),segments=[];let current=null;
  for(const line of data){
    if(line==='CC001_W12_F1_QA_CAPTURE'){
      current=[];segments.push(current);
      if(segments.length>MAX_CAPTURES)throw Error('too many captures');
    }
    if(!current){if(line.trim())throw Error('unframed clipboard text');continue;}
    if(line.trim())current.push(line);
  }
  if(!segments.length)throw Error('no F1 capture');
  const samples=segments.map((s,i)=>one(s,i));
  const totalBalls=samples.reduce((a,s)=>a+s.observations,0);
  const invalidModes=samples.reduce((a,s)=>a+(s.invalidModes||0),0);
  const truncated=samples.reduce((a,s)=>a+(s.truncatedBalls||0),0);
  const missing=[];
  if(!totalBalls)missing.push('NO_POSE_ROWS');
  if(truncated)missing.push('SOME_BALLS_UNSAMPLED');
  if(samples.some(s=>s.missing))missing.push('NULL_STATE_POSE_UNAVAILABLE');
  missing.push('SOURCE_SHA_UNVERIFIED_BY_A33','PHYSICAL_PC2_NOT_AUTHENTICATED','POST_FREEZE_A33_ONLY');
  return {schema:SCHEMA,status:invalidModes?'CAPTURE_CONTRADICTION':totalBalls?'LOCAL_POSE_SAMPLES_ONLY':'INSUFFICIENT',
    frozenW11QaSha:FREEZE,sourceSha:'UNVERIFIED',availableInFrozenW11:false,physicalG3Attested:false,windowsBuildAttested:false,
    transportParityAttested:false,frameTiming:null,continuousFrameSampling:false,
    totals:{captures:samples.length,poseRows:totalBalls,truncatedBalls:truncated,invalidRenderModes:invalidModes},
    missing, samples,
    limitations:'A33 F1 COPY QA is an operator-triggered post-freeze developer feature. Samples are not continuous frames, not authenticated Windows Player bytes and not independent two-PC QA.'};
}
function main(args){
  if(args.length<1||args.length>2)throw Error('usage: node qa-f1-pose.cjs F1_CLIPBOARD.txt [REPORT.json]');
  const s=fs.lstatSync(args[0]);if(!s.isFile()||s.isSymbolicLink()||s.size>MAX_BYTES)throw Error('original regular file required (max 4MiB)');
  const data=fs.readFileSync(args[0]);if(data.length>MAX_BYTES)throw Error('input too large');
  const output=analyze(new TextDecoder('utf-8',{fatal:true}).decode(data));
  output.input={sha256:crypto.createHash('sha256').update(data).digest('hex'),bytes:data.length};
  const body=JSON.stringify(output,null,2)+'\n';
  if(args[1]){if(path.resolve(args[0])===path.resolve(args[1]))throw Error('refusing input overwrite');fs.writeFileSync(args[1],body,{flag:'wx'});}
  else process.stdout.write(body);
  return output.status==='CAPTURE_CONTRADICTION'?1:output.status==='INSUFFICIENT'?2:0;
}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2))}catch(e){process.stderr.write('A43_F1_ERROR '+e.message+'\n');process.exitCode=3}}
module.exports={analyze,main,FREEZE};
