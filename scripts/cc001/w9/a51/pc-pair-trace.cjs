#!/usr/bin/env node
'use strict';
/**
 * CC-001 R17-W9 A51 — offline PC1/PC2 network evidence analyzer.
 * No Unity, network, RC1, or Protocol149 modification; ZERO network I/O.
 * Player.log is intentionally sparse: a first STATE_APPLIED line is NOT a revision stream.
 * Optional structured event JSONL provides a richer, separately authored capture format.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');

const SOURCE_SHA = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const SCHEMA = 'CC001_R17_W9_A51_TRACE_V1';
const PHASE_AIMING = 'Aiming';
const EVENT_KINDS = new Set(['SNAPSHOT_SENT','SNAPSHOT_APPLIED','FRAME_PRESENTED','LOCAL_TURN_DISPLAYED','INTENT_ACCEPTED','INTENT_REJECTED','CLOCK_SYNC']);
const LOG_RULES = [
  [/CC_NET_HOST_READY\s+port=(\d+)/,m=>({kind:'HOST_READY',port:Number(m[1])})],
  [/CC_NET_PEER_CONNECTED\s+id=\d+\s+owner=(\d+)/,m=>({kind:'PEER_CONNECTED',owner:Number(m[1])})],
  [/CC_NET_STATE_APPLIED\s+revision=(\d+)\s+owner=(\d+)/,m=>({kind:'FIRST_STATE_APPLIED',revision:Number(m[1]),owner:Number(m[2])})],
  [/CC_NET_INTENT_ACCEPT\s+owner=(\d+)\s+seq=(\d+)(?:\s+action=(\d+))?/,m=>({kind:'INTENT_ACCEPT_LOG',owner:Number(m[1]),sequence:Number(m[2]),actionSerial:m[3]?Number(m[3]):null})],
  [/CC_NET_INTENT_REJECT\b/,()=>({kind:'INTENT_REJECT_LOG'})],
  [/CC_NET_SNAPSHOT_ERROR\b/,()=>({kind:'SNAPSHOT_ERROR_LOG'})],
  [/CC_NET_BRIDGE_SPAWNED\s+server=(True|False|true|false)/,m=>({kind:'BRIDGE_SPAWNED',server:m[1].toLowerCase()==='true'})],
];
function sha256(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
function finite(n){return typeof n==='number'&&Number.isFinite(n);}
function integer(n){return Number.isSafeInteger(n)&&n>=0;}
function readLog(file,peer){
  const content=fs.readFileSync(file);const text=content.toString('utf8');const events=[];
  for (const [i,line] of text.split(/\r?\n/).entries()) for(const [re,decode] of LOG_RULES){
    const match=re.exec(line);if(match){events.push({peer,line:i+1,...decode(match)});break;}
  }
  return {peer,source:{sha256:sha256(content),bytes:content.length,basename:path.basename(file)},events};
}
function readJsonl(file){
  const content=fs.readFileSync(file);let events=[];
  for(const [i,line] of content.toString('utf8').split(/\r?\n/).entries()){
    if(!line.trim())continue;
    let event;try{event=JSON.parse(line);}catch(e){throw new Error('Invalid JSONL at line '+(i+1)+': '+e.message);}
    if(event.schema!==SCHEMA)throw new Error('Wrong schema at line '+(i+1));
    if(!EVENT_KINDS.has(event.kind))throw new Error('Unrecognized event kind at line '+(i+1));
    if(!['PC1','PC2'].includes(event.peer))throw new Error('Missing/invalid peer at line '+(i+1));
    if(!integer(event.sequence))throw new Error('Missing/invalid per-peer sequence at line '+(i+1));
    if(['SNAPSHOT_SENT','SNAPSHOT_APPLIED'].includes(event.kind)&&!integer(event.revision))throw new Error('Missing/invalid snapshot revision at line '+(i+1));
    if(['FRAME_PRESENTED','SNAPSHOT_SENT','SNAPSHOT_APPLIED'].includes(event.kind) && event.balls!==undefined){
      if(!Array.isArray(event.balls))throw new Error('Invalid ball array at line '+(i+1));
      const unique=new Set();for(const b of event.balls){
        if(!b||!integer(b.id)||!finite(b.x)||!finite(b.y)||unique.has(b.id))throw new Error('Invalid ball position/id at line '+(i+1));
        unique.add(b.id);
      }
    }
    if(event.runId!==undefined&&(typeof event.runId!=='string'||!/^[A-Za-z0-9_.-]{8,96}$/.test(event.runId)))throw new Error('Invalid runId at line '+(i+1));
    if(event.stateHash!==undefined&&!/^[0-9a-f]{64}$/i.test(event.stateHash))throw new Error('Invalid stateHash at line '+(i+1));
    if(event.utcMs!==undefined&&!finite(event.utcMs))throw new Error('Invalid utcMs at line '+(i+1));
    if(event.localOwner!==undefined&&![0,1].includes(event.localOwner))throw new Error('Invalid localOwner at line '+(i+1));
    if(event.turnOwner!==undefined&&![0,1].includes(event.turnOwner))throw new Error('Invalid turnOwner at line '+(i+1));
    events.push(event);
  }
  return {source:{sha256:sha256(content),bytes:content.length,basename:path.basename(file)},events};
}
const count=(items,fn)=>items.filter(fn).length;
const numericalStats=(nums)=>nums.length?{samples:nums.length,min:Math.min(...nums),max:Math.max(...nums),mean:nums.reduce((a,b)=>a+b,0)/nums.length}:null;
function analyze({pc1=null,pc2=null,structured=null,jumpThreshold=80}){
  if(!finite(jumpThreshold)||jumpThreshold<=0)throw new Error('jumpThreshold must be positive');
  const logs=[pc1,pc2].filter(Boolean), rawLogs=logs.flatMap(l=>l.events);
  const events=structured?.events??[];
  const warnings=[],findings=[];
  const add=(code,severity,details)=>findings.push({code,severity,...details});
  const byPeer={PC1:events.filter(e=>e.peer==='PC1'),PC2:events.filter(e=>e.peer==='PC2')};
  for(const peer of ['PC1','PC2']){
    let last=-1;
    for(const e of byPeer[peer]){
      if(e.sequence<=last)add('EVENT_SEQUENCE_NON_MONOTONIC','ERROR',{peer,sequence:e.sequence,previousSequence:last});
      last=e.sequence;
    }
  }
  for(const peer of ['PC1','PC2']){
    let applied=-1;
    for(const e of byPeer[peer].filter(e=>e.kind==='SNAPSHOT_APPLIED')){
      if(e.revision<=applied)add('APPLIED_REVISION_NON_MONOTONIC','ERROR',{peer,revision:e.revision,previousRevision:applied});
      applied=Math.max(applied,e.revision);
    }
  }
  // Fail closed: a duplicated revision or cross-run collision must never be hidden
  // by Map.set() last-write-wins. This diagnostic does NOT alter network admission.
  let lastSent=-1;
  for(const e of byPeer.PC1.filter(e=>e.kind==='SNAPSHOT_SENT')){
    if(e.revision<=lastSent)add('SENT_REVISION_NON_MONOTONIC','ERROR',{peer:'PC1',revision:e.revision,previousRevision:lastSent});
    lastSent=Math.max(lastSent,e.revision);
  }
  const hostByRevision=new Map(),clientByRevision=new Map();
  const duplicates=[];
  for(const e of events){
    const map=e.peer==='PC1'&&e.kind==='SNAPSHOT_SENT'?hostByRevision:
      e.peer==='PC2'&&e.kind==='SNAPSHOT_APPLIED'?clientByRevision:null;
    if(!map)continue;
    if(map.has(e.revision)){
      const prior=map.get(e.revision);
      const conflict=prior.stateHash!==e.stateHash||prior.runId!==e.runId;
      const detail={peer:e.peer,kind:e.kind,revision:e.revision,previousSequence:prior.sequence,sequence:e.sequence,conflict};
      duplicates.push(detail);add('DUPLICATE_SNAPSHOT_REVISION','ERROR',detail);
      // Retain earliest evidence. Never silently replace it with a later record.
      continue;
    }
    map.set(e.revision,e);
  }
  let comparedHashes=0,unpairedHost=0,unpairedClient=0,runAmbiguous=0;
  const matchingRevisions=[];
  for(const [revision,host] of hostByRevision){
    const client=clientByRevision.get(revision);
    if(!client){unpairedHost++;continue;}
    if(host.runId!==undefined&&client.runId!==undefined&&host.runId!==client.runId){
      add('CROSS_RUN_REVISION_COLLISION','ERROR',{revision,hostRunId:host.runId,clientRunId:client.runId});
      continue;
    }
    if(host.runId===undefined||client.runId===undefined)runAmbiguous++;
    if(!host.stateHash||!client.stateHash)continue;
    comparedHashes++;matchingRevisions.push(revision);
    if(host.stateHash!==client.stateHash)add('AUTHORITATIVE_STATE_MISMATCH','ERROR',{revision,hostHash:host.stateHash,clientHash:client.stateHash});
  }
  for(const revision of clientByRevision.keys())if(!hostByRevision.has(revision))unpairedClient++;
  for(const peer of ['PC1','PC2'])for(const e of byPeer[peer].filter(e=>e.kind==='LOCAL_TURN_DISPLAYED')){
    const expected=peer==='PC1'?0:1;
    if(e.localOwner!==undefined&&e.localOwner!==expected)
      add('LOCAL_OWNER_PEER_MISMATCH','ERROR',{peer,sequence:e.sequence,expectedOwner:expected,reportedOwner:e.localOwner});
  }
  if(runAmbiguous>0)warnings.push('Some paired revision hashes have no matching explicit runId on both endpoints; cross-session identity is NOT VERIFIED.');
  if(duplicates.length>0)warnings.push('Duplicate snapshot revisions found; last-write-wins comparison prohibited. Parity is not qualified.');
  if(unpairedHost||unpairedClient)warnings.push('Snapshot sends/applies are not fully paired: missing observation is NOT equivalent to packet loss.');
  const jumpObservations=[];
  for(const peer of ['PC1','PC2']){
    const lastPositions=new Map();
    for(const e of byPeer[peer].filter(e=>e.kind==='FRAME_PRESENTED')){
      if(!Array.isArray(e.balls))continue;
      const current=new Set();
      for(const b of e.balls){current.add(b.id);const prev=lastPositions.get(b.id);
        if(prev){const distance=Math.hypot(b.x-prev.x,b.y-prev.y);
          jumpObservations.push(distance);
          if(distance>jumpThreshold)add('FRAME_POSITION_JUMP','OBSERVATION',{peer,ballId:b.id,previousSequence:prev.seq,sequence:e.sequence,distance,threshold:jumpThreshold,interpretation:'Not proof of network defect; legitimate Blink/TimeShift/teleport may cause a jump.'});
        }
        lastPositions.set(b.id,{x:b.x,y:b.y,seq:e.sequence});
      }
      for(const key of lastPositions.keys())if(!current.has(key))lastPositions.delete(key);
    }
  }
  for(const e of events.filter(e=>e.kind==='LOCAL_TURN_DISPLAYED')){
    if(e.localOwner===undefined||e.turnOwner===undefined||typeof e.label!=='string'||typeof e.isAiming!=='boolean')continue;
    if(/\bYOUR\s+SHOT\b/i.test(e.label)&&(!e.isAiming||e.localOwner!==e.turnOwner))add('FALSE_LOCAL_TURN_LABEL','ERROR',{peer:e.peer,sequence:e.sequence,turnOwner:e.turnOwner,localOwner:e.localOwner,label:'YOUR SHOT'});
    if(e.cameraBottomOwner!==undefined&&e.cameraBottomOwner!==e.localOwner)add('VIEW_NOT_LOCAL_BOTTOM','OBSERVATION',{peer:e.peer,sequence:e.sequence,localOwner:e.localOwner,cameraBottomOwner:e.cameraBottomOwner});
  }
  const intentHost=rawLogs.filter(e=>e.peer==='PC1'&&e.kind==='INTENT_ACCEPT_LOG'&&e.owner===1);
  const acceptedStructured=events.filter(e=>e.peer==='PC1'&&e.kind==='INTENT_ACCEPTED'&&e.owner===1);
  // When raw and enriched traces describe the same event, prefer enriched evidence once.
  const acceptedSource=acceptedStructured.length?acceptedStructured:intentHost;
  const phase=structured?'STRUCTURED_PRESENT':'LEGACY_LOG_ONLY';
  if(!structured)warnings.push('RC1 Player.log logs only FIRST successfully applied snapshot, not the entire per-revision stream. Cannot determine movement cadence, visual interpolation, state parity, or turn label from legacy logs.');
  if(!pc1||!pc2)warnings.push('Two independently sourced Player.log files not both supplied: cannot corroborate both endpoints.');
  if(comparedHashes===0)warnings.push('No paired same-revision host/client authoritative state hashes: SNAPSHOT_PARITY=NOT_PROVEN.');
  if(!events.some(e=>e.kind==='FRAME_PRESENTED'))warnings.push('No frame-level position traces: visual stutter/teleport cannot be quantified.');
  warnings.push('Cross-PC one-way latency is intentionally NOT COMPUTED: wall-clock timestamps and CLOCK_SYNC markers alone do not establish calibrated clock offset/error bounds.');
  return {schema:'CC001_R17_W9_A51_ANALYSIS_V1',pinnedSourceSha:SOURCE_SHA,mode:phase,inputs:{pc1:pc1?.source??null,pc2:pc2?.source??null,structured:structured?.source??null},observations:{hostP2AcceptedIntentCount:acceptedSource.length,hostP2AcceptedIntentSequences:acceptedSource.map(e=>e.intentSequence??e.sequence).filter(integer),firstClientAppliedRevision:rawLogs.find(e=>e.peer==='PC2'&&e.kind==='FIRST_STATE_APPLIED')?.revision??null,legacySnapshotErrorCount:count(rawLogs,e=>e.kind==='SNAPSHOT_ERROR_LOG'),structuredEvents:events.length,pairedStateHashesCompared:comparedHashes,matchingRevisions,duplicateSnapshotRevisions:duplicates.length,unpairedHostRevisions:unpairedHost,unpairedClientRevisions:unpairedClient,unboundRunPairs:runAmbiguous,frameDelta:numericalStats(jumpObservations),crossPcOneWayLatencyMs:null},findings,warnings,qualification:{transportPeerEvidence:rawLogs.some(e=>e.kind==='PEER_CONNECTED')?'HOST_LOG_PEER_CONNECTED':'NOT_PROVEN_BY_INPUT',clientReceivedAuthoritativeState:rawLogs.some(e=>e.peer==='PC2'&&e.kind==='FIRST_STATE_APPLIED')||byPeer.PC2.some(e=>e.kind==='SNAPSHOT_APPLIED')?'OBSERVED':'NOT_PROVEN',snapshotParity:duplicates.length?'INVALID_DUPLICATE_REVISION':findings.some(f=>f.code==='CROSS_RUN_REVISION_COLLISION')?'INVALID_RUN_COLLISION':comparedHashes?'COMPARED_PAIRWISE':'NOT_PROVEN',snapshotParityScope:comparedHashes?(runAmbiguous?'RUN_ID_MISSING':'SAME_RUN_ID'):'NOT_PROVEN',G3:'NOT_CERTIFIED_BY_ANALYZER',runtimeEvidenceKind:structured?'USER_SUPPLIED_STRUCTURED_TRACE':'PLAYER_LOG_SPARSE'}};
}
function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){
  let key=argv[i];if(!/^--(pc1|pc2|events|out|jump-threshold)$/.test(key))throw Error('Unknown flag '+key);
  const val=argv[++i];if(!val)throw Error('Missing value for '+key);out[key.slice(2)]=val;
}if(!out.pc1&&!out.pc2&&!out.events)throw Error('Supply --pc1, --pc2, and/or --events');return out;}
function cli(argv){const args=parseArgs(argv);const result=analyze({pc1:args.pc1?readLog(args.pc1,'PC1'):null,pc2:args.pc2?readLog(args.pc2,'PC2'):null,structured:args.events?readJsonl(args.events):null,jumpThreshold:args['jump-threshold']?Number(args['jump-threshold']):80});
const value=JSON.stringify(result,null,2)+'\n';if(args.out)fs.writeFileSync(args.out,value,{flag:'wx'});else process.stdout.write(value);
}
if(require.main===module){try{cli(process.argv.slice(2));}catch(err){process.stderr.write('A51_TRACE_INPUT_ERROR: '+err.message+'\n');process.exitCode=2;}}
module.exports={analyze,readLog,readJsonl,parseArgs,SCHEMA};
