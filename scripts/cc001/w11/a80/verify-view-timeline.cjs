'use strict';
/** W11 A80 -- chronology-aware, offline 2-PC visual-observation contract.
 * Never treats synthetic fixture success as Unity/network G3 PASS.
 * Deliberately does not parse network packet traces: A31/A60 own that work.
 */
const fs=require('node:fs'),crypto=require('node:crypto');
const {assess}=require('../../w9/a80/verify-player-view.cjs');
const SCHEMA='cc001-r17-w11-player-view-timeline-v1';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const hasSha=s=>typeof s==='string'&&/^[a-f\d]{64}$/i.test(s);
function analyze(session){
  const contradictions=[],gaps=[],frames=[],last=new Map(),seen=new Set();
  function fail(code,context){contradictions.push({code,...context});}
  function missing(code,context){gaps.push({code,...context});}
  if(session?.schema!==SCHEMA)missing('SESSION_SCHEMA_UNVERIFIED',{});
  const entries=Array.isArray(session?.frames)?session.frames:[];
  if(entries.length<2)missing('MINIMUM_TWO_CAPTURE_FRAMES_REQUIRED',{});
  if(entries.length>1000)missing('FRAME_LIMIT_EXCEEDED',{});
  let priorIndex=-1;
  const policy={...session?.policy,requireConnectionState:true,requireInputParity:true,requireSameBuild:true};
  if(!policy.targetSourceSha)missing('TARGET_SOURCE_SHA_REQUIRED',{});
  for(const [i,frame] of entries.slice(0,1000).entries()){
    if(!Number.isSafeInteger(frame?.index)||frame.index<=priorIndex){
      fail('FRAME_SEQUENCE_NOT_INCREASING',{frame:i});
    }else priorIndex=frame.index;
    if(seen.has(frame?.index))fail('FRAME_ID_REPEATED',{frame:i});
    seen.add(frame?.index);
    const frameReport=assess({schema:'cc001-r17-w9-player-view-v1',policy,observations:frame?.observations});
    frames.push({index:frame?.index,verdict:frameReport.verdict,checks:frameReport.summary.checks,errors:frameReport.summary.errors,gaps:frameReport.summary.gaps});
    for(const e of frameReport.errors)fail(e.code,{frame:frame?.index,device:e.device});
    for(const e of frameReport.gaps)missing(e.code,{frame:frame?.index,device:e.device});
    if(!Array.isArray(frame?.observations))continue;
    for(const o of frame.observations){
      if(!o||!['PC1','PC2'].includes(o.device))continue;
      const a=o.authoritative||{},ev=o.evidence||{},prev=last.get(o.device);
      if(!Number.isSafeInteger(a.actionSerial)||a.actionSerial<0)missing('ACTION_SERIAL_NOT_OBSERVED',{frame:frame.index,device:o.device});
      const ms=Date.parse(ev.captureUtc);
      if(!Number.isFinite(ms))missing('UTC_CAPTURE_TIME_INVALID',{frame:frame.index,device:o.device});
      if(prev){
        if(o.localOwner!==prev.localOwner)fail('LOCAL_OWNER_CHANGED_IN_SESSION',{frame:frame.index,device:o.device});
        if(Number.isFinite(ms)&&Number.isFinite(prev.ms)&&ms<prev.ms)fail('CAPTURE_CLOCK_WENT_BACKWARD',{frame:frame.index,device:o.device});
        if(Number.isSafeInteger(a.revision)&&Number.isSafeInteger(prev.revision)){
          if(a.revision<prev.revision)fail('SNAPSHOT_REVISION_ROLLBACK',{frame:frame.index,device:o.device});
          if(a.revision===prev.revision){
            if(a.turn!==prev.turn||a.phase!==prev.phase)fail('STATE_CHANGED_WITHOUT_REVISION',{frame:frame.index,device:o.device});
            if(typeof a.stateDigest==='string'&&typeof prev.stateDigest==='string'&&a.stateDigest!==prev.stateDigest)
              fail('DIGEST_CHANGED_WITHOUT_REVISION',{frame:frame.index,device:o.device});
            if(Number.isSafeInteger(a.actionSerial)&&Number.isSafeInteger(prev.serial)&&a.actionSerial!==prev.serial)
              fail('ACTION_SERIAL_CHANGED_WITHOUT_REVISION',{frame:frame.index,device:o.device});
          }
        }
        if(Number.isSafeInteger(a.actionSerial)&&Number.isSafeInteger(prev.serial)&&a.actionSerial<prev.serial)
          fail('ACTION_SERIAL_ROLLBACK',{frame:frame.index,device:o.device});
        if(hasSha(ev.playerAssemblySha256)&&hasSha(prev.dll)&&ev.playerAssemblySha256.toLowerCase()!==prev.dll.toLowerCase())
          fail('BINARY_CHANGED_DURING_CAPTURE',{frame:frame.index,device:o.device});
      }
      last.set(o.device,{localOwner:o.localOwner,ms,revision:a.revision,turn:a.turn,phase:a.phase,serial:a.actionSerial,stateDigest:a.stateDigest,dll:ev.playerAssemblySha256});
    }
  }
  if(!frames.some(x=>x.verdict==='OBSERVATION_CONTRACT_CONSISTENT'))missing('NO_COMPLETE_SAME_REVISION_PAIR',{});
  const verdict=contradictions.length?'OBSERVED_CONTRACT_FAIL':gaps.length?'INSUFFICIENT_EVIDENCE':'OBSERVATION_SEQUENCE_CONSISTENT';
  return {schema:SCHEMA,verdict,physicalG3Status:'NOT_ASSESSED',source:'operator-annotated frames; source/assembly digests, log contents and screenshots NOT rehashed',
    summary:{frames:frames.length,contradictions:contradictions.length,gaps:gaps.length},frames,contradictions,gaps};
}
module.exports={SCHEMA,analyze};
if(require.main===module){
  const args=process.argv.slice(2),i=args.indexOf('--input'),o=args.indexOf('--out');
  if(i<0||!args[i+1]){process.stderr.write('Usage: node verify-view-timeline.cjs --input session.json [--out report.json]\n');process.exitCode=2;}
  else{try{const raw=fs.readFileSync(args[i+1]);const report=analyze(JSON.parse(raw.toString('utf8')));report.inputSha256=digest(raw);
      const json=JSON.stringify(report,null,2)+'\n';if(o>=0&&args[o+1])fs.writeFileSync(args[o+1],json);else process.stdout.write(json);
      process.exitCode=report.verdict==='OBSERVED_CONTRACT_FAIL'?1:report.verdict==='INSUFFICIENT_EVIDENCE'?3:0;
    }catch(e){process.stderr.write('A80_W11_ERROR '+e.message+'\n');process.exitCode=4;}}
}