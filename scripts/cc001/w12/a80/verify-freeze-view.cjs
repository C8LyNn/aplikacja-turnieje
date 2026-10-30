'use strict';
/**
 * CC-001 R17-W12 A80: frozen-commit, paired, canonical vs visual board position contract.
 * Offline observation checker; cannot certify physical QA or retrieve any real screenshots.
 * Input XY are operator-annotated WORLD BOARD LOGICAL units (540x900), NOT screenshot pixels.
 * Does not conflate remote smoothing with authoritative state parity.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const PIN = '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const SCHEMA = 'cc001-r17-w12-a80-frozen-view-v1';
const PHASES = new Set(['Aiming','Moving','Over']);
const positiveInt = v => Number.isSafeInteger(v) && v > 0;
const owner = v => v === 0 || v === 1;
const sha256 = s => typeof s === 'string' && /^[0-9a-f]{64}$/i.test(s);
const finite = v => typeof v === 'number' && Number.isFinite(v);
const clone = o => ({...o});
function inspect(input) {
  const problems = [], gaps = [], checks = [], notes = [];
  const fail=(code,where={})=>problems.push({code,...where});
  const gap=(code,where={})=>gaps.push({code,...where});
  const pass=(code,yes,where={})=>{checks.push({code,pass:yes,...where}); if(!yes)fail(code,where);};
  if(input?.schema!==SCHEMA)gap('SCHEMA_UNVERIFIED');
  pass('QA_FREEZE_SHA_MISMATCH',input?.qaSourceSha===PIN);
  if(input?.lane!=='W11_QA_FREEZE')gap('QA_LANE_MISSING');
  const obs=Array.isArray(input?.observations)?input.observations:[];
  if(obs.length!==2)gap('TWO_PHYSICAL_DEVICE_OBSERVATIONS_REQUIRED');
  const by=new Map();
  for(const o of obs){
    if(!o || !['PC1','PC2'].includes(o.device)||by.has(o.device)){
      fail('INVALID_OR_DUPLICATE_DEVICE');continue;
    }
    by.set(o.device,o);
  }
  for(const device of ['PC1','PC2'])if(!by.has(device))gap('DEVICE_MISSING',{device});
  for(const [device,o] of by){
    const loc={device};
    pass('DEVICE_SOURCE_SHA_MISMATCH',o.sourceSha===PIN,loc);
    if(!sha256(o.binaryAssemblySha256))gap('ASSEMBLY_DIGEST_UNVERIFIED',loc);
    if(!owner(o.localOwner)){gap('LOCAL_OWNER_UNVERIFIED',loc);continue;}
    if(!positiveInt(o.authoritative?.revision)||!owner(o.authoritative?.turn)||!PHASES.has(o.authoritative?.phase)){
      gap('AUTHORITATIVE_STATE_UNVERIFIED',loc);continue;
    }
    const a=o.authoritative,u=o.ui||{};
    if(typeof o.networkConnected!=='boolean')gap('NETWORK_CONNECTION_UNVERIFIED',loc);
    if(typeof u.yourTurnShown!=='boolean'||typeof u.inputEnabled!=='boolean')gap('LOCAL_UI_TURN_UNVERIFIED',loc);
    else{
      const canAct=a.turn===o.localOwner&&a.phase==='Aiming'&&o.networkConnected===true;
      pass('YOUR_TURN_NOT_LOCAL',u.yourTurnShown===canAct,loc);
      pass('LOCAL_INPUT_AUTHORITY_MISMATCH',u.inputEnabled===canAct,loc);
    }
    if(owner(u.deckOwner))pass('LOCAL_DECK_IDENTITY_MISMATCH',u.deckOwner===o.localOwner,loc);
    else gap('LOCAL_DECK_UNVERIFIED',loc);
    if(u.powerBarVisible!==false||u.powerPercentVisible!==false){
      if(typeof u.powerBarVisible==='boolean'&&typeof u.powerPercentVisible==='boolean')fail('REDUNDANT_POWER_UI_VISIBLE',loc);
      else gap('POWER_HUD_UNVERIFIED',loc);
    }
    if(!Array.isArray(o.balls)||!o.balls.length){gap('BALL_SAMPLES_MISSING',loc);continue;}
    const visited=new Set();
    for(const b of o.balls){
      const bLoc={device,id:b?.id};
      if(!positiveInt(b?.id)||visited.has(b.id)){fail('INVALID_OR_DUPLICATE_BALL_ID',bLoc);continue;}
      visited.add(b.id);
      if(!finite(b.canonical?.x)||!finite(b.canonical?.y)||!finite(b.view?.x)||!finite(b.view?.y)){
        gap('BALL_POSITION_UNVERIFIED',bLoc);continue;
      }
      // The visual surface is intentionally smoothed in Moving. Never demand perfect
      // replica-vs-rendered equality on ordinary movement frames.
      const kind=b.sampleKind;
      if(kind==='MOVING_INTERPOLATED'){
        if(a.phase!=='Moving')fail('MOVING_SAMPLE_OUTSIDE_MOVING_PHASE',bLoc);
        else notes.push({code:'MOVING_FRAME_GEOMETRY_NOT_ASSESSED',...bLoc});
        continue;
      }
      if(kind==='EVENT_SNAP'){
        if(b.eventKind!=='PORTAL'){
          gap('EVENT_SNAP_NOT_IN_FROZEN_SOURCE_SCOPE',bLoc);
          continue;
        }
      }else if(kind==='SETTLED'){
        if(a.phase==='Moving') {gap('SETTLED_CLAIM_DURING_MOVING_REQUIRES_ORACLE',bLoc);continue;}
      }else{gap('BALL_SAMPLE_KIND_UNVERIFIED',bLoc);continue;}
      const epsilon=input?.toleranceWorldUnits;
      if(!finite(epsilon)||epsilon<0||epsilon>2){gap('TOLERANCE_UNDECLARED_OR_OUT_OF_RANGE',bLoc);continue;}
      const x=b.canonical.x;
      const y=o.localOwner===1?900-b.canonical.y:b.canonical.y;
      pass('VIEW_X_NOT_CANONICAL',Math.abs(b.view.x-x)<=epsilon,bLoc);
      pass('VIEW_Y_NOT_LOCAL_PERSPECTIVE',Math.abs(b.view.y-y)<=epsilon,bLoc);
    }
  }
  const p1=by.get('PC1'),p2=by.get('PC2');
  if(p1&&p2){
    if(owner(p1.localOwner)&&owner(p2.localOwner))pass('PC1_PC2_OWNER_MAPPING_MISMATCH',p1.localOwner===0&&p2.localOwner===1);
    if(sha256(p1.binaryAssemblySha256)&&sha256(p2.binaryAssemblySha256))
      pass('PC_ASSEMBLY_SHA_MISMATCH',p1.binaryAssemblySha256.toLowerCase()===p2.binaryAssemblySha256.toLowerCase());
    const x=p1.authoritative,y=p2.authoritative;
    if(positiveInt(x?.revision)&&positiveInt(y?.revision)){
      if(x.revision!==y.revision)gap('NO_SAME_REVISION_PAIR');
      else{
        pass('SAME_REVISION_TURN_MISMATCH',x.turn===y.turn);
        pass('SAME_REVISION_PHASE_MISMATCH',x.phase===y.phase);
        if(sha256(x.stateDigest)&&sha256(y.stateDigest))pass('SAME_REVISION_STATE_DIGEST_MISMATCH',x.stateDigest.toLowerCase()===y.stateDigest.toLowerCase());
        else gap('SOURCE_BOUND_STATE_DIGEST_MISSING');
        // P1/P2 canonical samples are compared only for shared IDs at the same
        // authoritative revision. No invented packet latency/FPS metrics.
        const lhs=new Map((p1.balls||[]).filter(b=>positiveInt(b?.id)&&finite(b.canonical?.x)&&finite(b.canonical?.y)).map(b=>[b.id,b.canonical]));
        const rhs=new Map((p2.balls||[]).filter(b=>positiveInt(b?.id)&&finite(b.canonical?.x)&&finite(b.canonical?.y)).map(b=>[b.id,b.canonical]));
        if(lhs.size!==rhs.size||[...lhs.keys()].some(id=>!rhs.has(id)))gap('CANONICAL_BALL_SET_INCOMPLETE');
        for(const [id,l] of lhs)if(rhs.has(id)){
          const r=rhs.get(id);
          pass('SAME_REVISION_CANONICAL_POSE_MISMATCH',l.x===r.x && l.y===r.y,{id});
        }
      }
    }
  }
  const verdict=problems.length?'OBSERVATION_FAIL':gaps.length?'INSUFFICIENT_EVIDENCE':'OBSERVATIONS_LOGICALLY_CONSISTENT';
  return {schema:SCHEMA,qaSourceSha:PIN,verdict,physicalG3Status:'NOT_ASSESSED',
   inspectedOriginalImages:false,verifiedBuildBinary:false,measuredFPS:false,
   observationBasis:'operator supplied canonical/view board coordinates, not native raster or source-extracted state',
   summary:{checks:checks.length,passed:checks.filter(z=>z.pass).length,problems:problems.length,gaps:gaps.length},
   problems,gaps,notes};
}
module.exports={SCHEMA,PIN,inspect};
if(require.main===module){
 const args=process.argv.slice(2),get=k=>{let i=args.indexOf(k);return i<0?null:args[i+1];};
 const input=get('--input'),output=get('--out');
 if(!input){process.stderr.write('Usage: node verify-freeze-view.cjs --input PRIVATE/frame.json [--out PRIVATE/report.json]\n');process.exitCode=2;}
 else try{
  const original=fs.readFileSync(input),report=inspect(JSON.parse(original.toString('utf8')));
  report.inputSha256=crypto.createHash('sha256').update(original).digest('hex');
  const text=JSON.stringify(report,null,2)+'\n';
  if(output)fs.writeFileSync(output,text,{encoding:'utf8',flag:'wx'});else process.stdout.write(text);
  process.exitCode=report.verdict==='OBSERVATION_FAIL'?1:report.verdict==='INSUFFICIENT_EVIDENCE'?3:0;
 }catch(e){process.stderr.write('A80_W12_FREEZE_ERROR '+e.message+'\n');process.exitCode=4;}
}
