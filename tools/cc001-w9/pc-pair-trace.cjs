'use strict';
// CC-001 A43: standalone, opt-in evidence analyzer; never instruments certified game bytes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PREFIX = 'CC_W9_TRACE ';
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_EVENTS = 200000;
const TYPES = new Set(['snapshot_sent','snapshot_applied','intent_accepted','turn_state','ball_state','client_error']);

function finiteInt(n) { return Number.isSafeInteger(n) && n >= 0; }
function parseLog(input, side) {
  const events = [], legacy = { host_ready:0, peer_connected:0, accepted_local:0,
    accepted_p2:0, rejected:0, first_snapshot_applied:0, snapshot_error:0, connection_failed:0 };
  let malformed = 0, ignored = 0;
  const a31Snapshots = [];
  const acceptedP2 = [];
  const w10Samples = [];
  for (const line of input.split(/\r?\n/)) {
    if (line.includes('CC_NET_HOST_READY')) legacy.host_ready++;
    if (line.includes('CC_NET_PEER_CONNECTED')) legacy.peer_connected++;
    if (/CC_NET_INTENT_ACCEPT\s+owner=0\b/.test(line)) legacy.accepted_local++;
    if (/CC_NET_INTENT_ACCEPT\s+owner=1\b/.test(line)) {
      legacy.accepted_p2++;
      const seq = /\bseq=(\d+)\b/.exec(line), action = /\baction=(\d+)\b/.exec(line);
      if (seq && action && finiteInt(Number(seq[1])) && finiteInt(Number(action[1]))) {
        acceptedP2.push({sequence:Number(seq[1]),actionSerial:Number(action[1])});
      }
    }
    if (line.includes('CC_NET_INTENT_REJECT')) legacy.rejected++;
    if (line.includes('CC_NET_STATE_APPLIED')) legacy.first_snapshot_applied++;
    if (line.includes('CC_NET_SNAPSHOT_ERROR')) legacy.snapshot_error++;
    if (line.includes('CC_LAN_CONNECTION_FAILED')) legacy.connection_failed++;
    // A31 native optional network trace, emitted by a separately reviewed producer.
    // Never assume these markers exist in the pinned RC1 Windows Player build.
    const native = /CC_NET_TRACE_(TX|RX)\s+/.exec(line);
    if (native) {
      const tail=line.slice(native.index+native[0].length);
      const get=k=>{const m=new RegExp('(?:^|\\s)'+k+'=(-?\\d+)(?=\\s|$)').exec(tail);return m?Number(m[1]):null;};
      const revision=get('rev'),actionSerial=get('serial'),monotonicMs=get('tms'),turn=get('turn');
      if (!finiteInt(revision)||revision===0||!finiteInt(actionSerial)||!finiteInt(monotonicMs)||![0,1].includes(turn)) malformed++;
      else a31Snapshots.push({type:native[1]==='TX'?'snapshot_sent':'snapshot_applied',
        revision,actionSerial,monotonicMs,turn,source:'A31_NATIVE',side});
    }
    // A41 W10 optional ~1Hz operational samples; NOT per-snapshot TX/RX receipts.
    // Strict named tokens avoid interpreting quoted or similarly-prefixed messages.
    const w10 = /(?:^|\s)CC_W10_NET_(HOST|CLIENT)\s+/.exec(line);
    if (w10) {
      const tail=line.slice(w10.index+w10[0].length);
      const fields=Object.create(null); let valid=true;
      for (const token of tail.trim().split(/\s+/)) {
        if (!token)continue;
        const match=/^([A-Za-z]+)=([A-Za-z0-9]+)$/.exec(token);
        if(!match || Object.hasOwn(fields,match[1])) {valid=false;break;}
        fields[match[1]]=match[2];
      }
      const numeric=(key,required=true)=>{
        if(!Object.hasOwn(fields,key))return required?NaN:null;
        return /^\d+$/.test(fields[key])?Number(fields[key]):NaN;
      };
      const type=w10[1], allowed=type==='HOST'
        ? ['revision','action','turn','phase','balls','packedBytes','chunks','periodMs']
        : ['revision','action','turn','phase','balls','received','skippedRevisions'];
      const exact=Object.keys(fields).length===allowed.length && allowed.every(k=>Object.hasOwn(fields,k));
      const values={};
      for(const key of allowed){if(key!=='phase')values[key]=numeric(key);}
      if(!valid || !exact || !allowed.every(k=>k==='phase'||finiteInt(values[k])) ||
         ![0,1].includes(values.turn)||values.revision===0||
         !['Aiming','Moving','Over'].includes(fields.phase) ||
         (type==='HOST' && (values.packedBytes===0||values.chunks===0||values.periodMs===0)) ||
         (type==='CLIENT' && values.received===0)) malformed++;
      else if(w10Samples.length>=MAX_EVENTS)malformed++;
      else w10Samples.push({type:type.toLowerCase(),...values,phase:fields.phase});
    }
    const i = line.indexOf(PREFIX);
    if (i < 0) continue;
    try {
      const e = JSON.parse(line.slice(i + PREFIX.length));
      if (!e || Array.isArray(e) || typeof e !== 'object' || !TYPES.has(e.type)) { ignored++; continue; }
      if (e.revision !== undefined && !finiteInt(e.revision)) { malformed++; continue; }
      if (e.actionSerial !== undefined && !finiteInt(e.actionSerial)) { malformed++; continue; }
      if (e.monotonicMs !== undefined && (!Number.isFinite(e.monotonicMs) || e.monotonicMs < 0)) { malformed++; continue; }
      if ((e.type === 'snapshot_sent' || e.type === 'snapshot_applied') && !finiteInt(e.revision)) { malformed++; continue; }
      if (e.type === 'intent_accepted' && (![0,1].includes(e.owner) || !finiteInt(e.sequence))) { malformed++; continue; }
      if (e.type === 'ball_state' && (!finiteInt(e.revision) || !finiteInt(e.actionSerial) || !finiteInt(e.ballId) ||
          (e.layer !== 'simulation' && e.layer !== 'render') || !Number.isFinite(e.x) || !Number.isFinite(e.y))) { malformed++; continue; }
      if (e.type === 'turn_state' && (!finiteInt(e.revision) || ![0,1].includes(e.turn) ||
          ![0,1].includes(e.localOwner) || !['aiming','moving','over'].includes(e.phase) ||
          !['your_turn','opponent_turn','inactive'].includes(e.banner))) { malformed++; continue; }
      if (events.length >= MAX_EVENTS) { malformed++; break; }
      events.push({ ...e, side });
    } catch (_) { malformed++; }
  }
  return { events, legacy, malformed, ignored, a31Snapshots, acceptedP2, w10Samples };
}

function summarize(hostText, clientText, opts = {}) {
  const host = parseLog(hostText, 'host'), client = parseLog(clientText, 'client');
  const all = host.events.concat(client.events), anomalies = [];
  const by = (events, type) => events.filter(e => e.type === type);
  function chooseSnapshots(side,type) {
    const structured=by(side.events,type).filter(e=>finiteInt(e.revision));
    // If both producer formats exist, prefer structured and avoid duplicate revision samples.
    return structured.length?structured:side.a31Snapshots.filter(e=>e.type===type);
  }
  // Sampled W10 diagnostics are kept separate: sparse 1Hz logging cannot prove
  // that the receiver got every snapshot or that the real client rendered smoothly.
  const hostOps=host.w10Samples.filter(e=>e.type==='host');
  const clientOps=client.w10Samples.filter(e=>e.type==='client');
  const hostCadenceMismatches=[];
  function expectedPeriod(phase,bytes){
    if(phase!=='Moving')return 250;
    if(bytes>=65536)return 250;
    if(bytes>=16384)return 125;
    if(bytes>=8192)return 83;
    return 50;
  }
  for(const sample of hostOps){
    const expected=expectedPeriod(sample.phase,sample.packedBytes);
    if(sample.periodMs!==expected) hostCadenceMismatches.push({revision:sample.revision,
      observed_period_ms:sample.periodMs,expected_period_ms:expected});
  }
  if(hostCadenceMismatches.length)anomalies.push({code:'W10_REPORTED_CADENCE_POLICY_MISMATCH',count:hostCadenceMismatches.length});
  function regressionsInSamples(samples,field){
    let count=0;for(let i=1;i<samples.length;i++)if(samples[i][field]<samples[i-1][field])count++;
    return count;
  }
  const multipleSessions=host.legacy.host_ready>1 || host.legacy.peer_connected>1 || client.legacy.first_snapshot_applied>1;
  // In a multi-session logfile, revision reset is expected; never join the sessions.
  const hostOpRegressions=multipleSessions?null:regressionsInSamples(hostOps,'revision');
  const clientOpRegressions=multipleSessions?null:regressionsInSamples(clientOps,'revision');
  const clientSkippedRegressions=multipleSessions?null:regressionsInSamples(clientOps,'skippedRevisions');
  if(hostOpRegressions)anomalies.push({code:'W10_HOST_SAMPLED_REVISION_REGRESSION',count:hostOpRegressions});
  if(clientOpRegressions)anomalies.push({code:'W10_CLIENT_SAMPLED_REVISION_REGRESSION',count:clientOpRegressions});
  if(clientSkippedRegressions)anomalies.push({code:'W10_CLIENT_SKIPPED_COUNTER_REGRESSION',count:clientSkippedRegressions});
  const hostOpByRev=new Map(hostOps.map(e=>[e.revision,e]));
  let w10Aligned=0;const w10Mismatches=[];
  // Even matching sparse samples are observations only, not a full parity gate.
  if(!multipleSessions)for(const rx of clientOps){
    const tx=hostOpByRev.get(rx.revision);
    if(!tx)continue;
    w10Aligned++;
    if(tx.action!==rx.action||tx.turn!==rx.turn||tx.phase!==rx.phase||tx.balls!==rx.balls)
      w10Mismatches.push({revision:rx.revision,
        host:{action:tx.action,turn:tx.turn,phase:tx.phase,balls:tx.balls},
        client:{action:rx.action,turn:rx.turn,phase:rx.phase,balls:rx.balls}});
  }
  if(w10Mismatches.length)anomalies.push({code:'W10_SAMPLED_AUTHORITATIVE_CONTENT_MISMATCH',count:w10Mismatches.length});
  const hostSends = chooseSnapshots(host,'snapshot_sent');
  const clientApplies = chooseSnapshots(client,'snapshot_applied');
  const regressions = []; let last = -1;
  for (const e of clientApplies) { if (e.revision <= last) regressions.push(e.revision); last = e.revision; }
  if (regressions.length) anomalies.push({ code:'CLIENT_REVISION_NONMONOTONIC', count:regressions.length });
  const timeRegressions=[];
  for(let i=1;i<clientApplies.length;i++) {
    const a=clientApplies[i-1],b=clientApplies[i];
    if(Number.isFinite(a.monotonicMs)&&Number.isFinite(b.monotonicMs)&&b.monotonicMs<a.monotonicMs)
      timeRegressions.push(b.revision);
  }
  if(timeRegressions.length) anomalies.push({code:'CLIENT_LOCAL_TIME_NONMONOTONIC',count:timeRegressions.length});
  const serialRegressions=[];
  let lastAction=-1;
  for (const e of clientApplies) {
    if (finiteInt(e.actionSerial)) {
      if (e.actionSerial < lastAction) serialRegressions.push(e.revision);
      lastAction=Math.max(lastAction,e.actionSerial);
    }
  }
  if (serialRegressions.length) anomalies.push({code:'CLIENT_ACTION_SERIAL_REGRESSION',count:serialRegressions.length});
  const sentRevs = new Set(hostSends.map(e => e.revision));
  const appliedRevs = new Set(clientApplies.map(e => e.revision));
  const turnMismatches = [];
  for (const e of by(all, 'turn_state')) {
    if (e.side === 'host' && e.localOwner !== 0 || e.side === 'client' && e.localOwner !== 1) {
      turnMismatches.push({ side:e.side, revision:e.revision, code:'LOCAL_OWNER_MISMATCH' }); continue;
    }
    const expected = e.phase !== 'aiming' ? 'inactive' : e.turn === e.localOwner ? 'your_turn' : 'opponent_turn';
    if (e.banner !== expected) turnMismatches.push({ side:e.side, revision:e.revision, code:'TURN_BANNER_MISMATCH', expected, actual:e.banner });
  }
  if (turnMismatches.length) anomalies.push({ code:'TURN_UI_CONTRADICTION', count:turnMismatches.length });
  // Only same authoritative revision/serial may be compared. Different revisions are unknown, not desync.
  // The local owner is intentionally NOT part of the canonical turn key: host=0, client=1.
  const hostTurns=new Map();
  for (const e of by(host.events,'turn_state')) {
    if (finiteInt(e.actionSerial)) hostTurns.set(`${e.revision}:${e.actionSerial}`,e);
  }
  let alignedTurns=0, turnContradictions=0;
  for (const e of by(client.events,'turn_state')) {
    const h=finiteInt(e.actionSerial)?hostTurns.get(`${e.revision}:${e.actionSerial}`):null;
    if (!h) continue;
    alignedTurns++;
    if (h.turn!==e.turn || h.phase!==e.phase) turnContradictions++;
  }
  if(turnContradictions) anomalies.push({code:'PAIRED_AUTHORITATIVE_TURN_MISMATCH',count:turnContradictions});
  // Render-layer poses can differ legitimately across PCs at the same snapshot revision:
  // remote smoothing and frame sampling use independent clocks. Never compare them as authoritative state.
  const hostBalls = new Map();
  for (const e of by(host.events, 'ball_state').filter(e=>e.layer==='simulation'))
    hostBalls.set(`${e.revision}:${e.actionSerial}:${e.ballId}`,e);
  const drift = []; let paired = 0;
  for (const e of by(client.events, 'ball_state').filter(e=>e.layer==='simulation')) {
    const h = hostBalls.get(`${e.revision}:${e.actionSerial}:${e.ballId}`);
    if (!h) continue;
    const distance = Math.hypot(e.x-h.x,e.y-h.y);
    paired++;
    drift.push({ revision:e.revision, actionSerial:e.actionSerial, ballId:e.ballId, layer:e.layer, distance:Math.round(distance*10000)/10000 });
  }
  drift.sort((a,b)=>b.distance-a.distance);
  const threshold = opts.driftThreshold === undefined ? null : opts.driftThreshold;
  if (threshold !== null && (!Number.isFinite(threshold) || threshold < 0)) throw new Error('Invalid drift threshold');
  const above = threshold === null ? null : drift.filter(x=>x.distance>threshold).length;
  if (above > 0) anomalies.push({ code:'PAIRED_BALL_DISTANCE_ABOVE_THRESHOLD', count:above });
  const hostByRev=new Map(hostSends.map(e=>[e.revision,e]));
  const snapshotDifferences=[];let comparable=0;
  for(const rx of clientApplies) {
    const tx=hostByRev.get(rx.revision);
    if(!tx)continue;
    if(!finiteInt(tx.actionSerial)||!finiteInt(rx.actionSerial)||![0,1].includes(tx.turn)||![0,1].includes(rx.turn))continue;
    comparable++;
    if(tx.actionSerial!==rx.actionSerial||tx.turn!==rx.turn)
      snapshotDifferences.push({revision:rx.revision,actionSerialHost:tx.actionSerial,
        actionSerialClient:rx.actionSerial,turnHost:tx.turn,turnClient:rx.turn});
  }
  if(snapshotDifferences.length)anomalies.push({code:'SNAPSHOT_AUTHORITY_MISMATCH',count:snapshotDifferences.length});
  const hostP2 = by(host.events, 'intent_accepted').filter(e=>e.owner===1);
  const p2AcceptCount = Math.max(hostP2.length,host.legacy.accepted_p2);
  const hostP2Sequences=hostP2.map(e=>e.sequence);
  const duplicateP2Sequences=hostP2Sequences.length-new Set(hostP2Sequences).size;
  // Repeated ACK lines or resets after reconnect are NOT proof that the game applied twice.
  // Report only an evidence anomaly; do not infer exactly-once from uncorrelated log counters.
  if (duplicateP2Sequences) anomalies.push({code:'DUPLICATE_P2_ACCEPT_TRACE_SEQUENCE',count:duplicateP2Sequences});
  const acceptedSequenceErrors=[];
  for(let i=1;i<host.acceptedP2.length;i++){
    const a=host.acceptedP2[i-1],b=host.acceptedP2[i];
    if(b.sequence<=a.sequence||b.actionSerial<=a.actionSerial)acceptedSequenceErrors.push(i);
  }
  if(acceptedSequenceErrors.length)anomalies.push({code:'P2_ACCEPT_SEQUENCE_OR_ACTION_NONMONOTONIC',count:acceptedSequenceErrors.length});
  const lastAcceptedAction=host.acceptedP2.at(-1)?.actionSerial??null;
  const p2ActionObserved=lastAcceptedAction===null?null:clientApplies.some(e=>finiteInt(e.actionSerial)&&e.actionSerial>=lastAcceptedAction&&
    hostByRev.has(e.revision)&&hostByRev.get(e.revision).actionSerial===e.actionSerial&&hostByRev.get(e.revision).turn===e.turn);
  const gaps = [];
  for(let i=1;i<clientApplies.length;i++){
    const a=clientApplies[i-1],b=clientApplies[i];
    if(Number.isFinite(a.monotonicMs)&&Number.isFinite(b.monotonicMs)&&b.monotonicMs>=a.monotonicMs)
      gaps.push(b.monotonicMs-a.monotonicMs);
  }
  const missing = [];
  if(multipleSessions)missing.push('multiple_sessions_require_separate_input_files');
  if (hostSends.length<2 || clientApplies.length<2 || [...appliedRevs].filter(x=>sentRevs.has(x)).length<2) missing.push('continuous_snapshot_trace');
  if (!by(host.events,'turn_state').length || !by(client.events,'turn_state').length) missing.push('authoritative_turn_and_local_banner_both_peers');
  if (!paired) missing.push('revision_aligned_simulation_ball_samples');
  if (!p2AcceptCount) missing.push('confirmed_host_p2_intent_acceptance');
  if (p2AcceptCount && !host.acceptedP2.length) missing.push('p2_accepted_action_serial_missing');
  if (lastAcceptedAction!==null && !p2ActionObserved) missing.push('p2_accepted_action_not_observed_on_client');
  if (host.malformed||client.malformed)missing.push('malformed_telemetry_records');
  const coverage = {
    matched_snapshot_revisions: [...appliedRevs].filter(x=>sentRevs.has(x)).length,
    client_applied_without_matching_host_sample: [...appliedRevs].filter(x=>!sentRevs.has(x)).length,
    comparable_authoritative_snapshots: comparable,
    authoritative_content_mismatches: snapshotDifferences.length,
    structured_or_native_source_host:hostSends.length?(hostSends[0].source||'CC_W9_TRACE'):'NONE',
    structured_or_native_source_client:clientApplies.length?(clientApplies[0].source||'CC_W9_TRACE'):'NONE',
    accepted_p2_action_serial:lastAcceptedAction,
    p2_accepted_action_seen_in_aligned_client_snapshot:p2ActionObserved,
    note:'Unmatched host/client samples do not alone establish packet loss: logging may be incomplete.',
    aligned_authoritative_turn_samples:alignedTurns
  };
  const periodCounts=new Map();
  for(const e of hostOps)periodCounts.set(e.periodMs,(periodCounts.get(e.periodMs)||0)+1);
  return {
    schema:'CC001_R17_W11_A43_DIAGNOSTIC_REPORT_003',
    verdict:anomalies.length?'OBSERVED_CONTRADICTION':missing.length?'INSUFFICIENT_EVIDENCE':'OBSERVATIONS_AVAILABLE_NOT_QA_PASS',
    host:{ legacy:host.legacy, trace_events:host.events.length, native_trace_events:host.a31Snapshots.length, malformed:host.malformed, ignored:host.ignored, snapshot_sent:hostSends.length },
    client:{ legacy:client.legacy, trace_events:client.events.length, native_trace_events:client.a31Snapshots.length, malformed:client.malformed, ignored:client.ignored, snapshot_applied:clientApplies.length, last_applied_revision:clientApplies.at(-1)?.revision??null, sample_intervals_ms:gaps },
    w10_operational_samples:{
      host_count:hostOps.length,client_count:clientOps.length,
      same_revision_pairs:w10Aligned,content_mismatches:w10Mismatches,
      host_reported_period_policy_mismatches:hostCadenceMismatches,
      host_reported_period_histogram_ms:Object.fromEntries([...periodCounts.entries()].sort((a,b)=>a[0]-b[0]).map(([k,v])=>[String(k),v])),
      client_last_skipped_revisions:clientOps.at(-1)?.skippedRevisions??null,
      host_revision_regressions:hostOpRegressions,client_revision_regressions:clientOpRegressions,
      client_skipped_counter_regressions:clientSkippedRegressions,
      multiple_sessions_detected:multipleSessions,
      note:'W10 rate-limited ~1Hz operational observations; NOT a per-packet stream, packet-loss proof, measured network latency, client FPS or physical QA.'
    },
    p2_intent_host_accepted_count:p2AcceptCount,
    p2_accept_trace_duplicate_sequences:duplicateP2Sequences,
    coverage,
    turn_mismatches:turnMismatches,
    paired_authoritative_turn_contradictions:turnContradictions,
    snapshot_authority_mismatches:snapshotDifferences,
    paired_ball_samples:paired,
    ignored_unaligned_render_pose_samples:by(all,'ball_state').filter(e=>e.layer==='render').length,
    worst_ball_distance:drift[0]||null,
    above_threshold_samples:above,
    distance_threshold_world_units:threshold,
    anomalies,missing_observations:missing,
    caveats:['No real two-PC verification is implied by parsing logs.',
      'CC_W10_NET_HOST/CLIENT entries are approximately 1Hz samples; reported periodMs is a configured interval, not measured throughput.',
      'Host/client W10 entries may sample different revisions; unmatched samples do not imply packet loss.',
      'Native CC_NET_TRACE_TX/RX markers are optional and not present in the pinned RC1 by assumption.',
      'Cross-PC event latency cannot be calculated by subtracting unsynchronized timestamps.',
      'Render poses at identical snapshot revisions may differ due to independent frame clocks and interpolation; they are never compared as authoritative state.',
      'No visual teleportation verdict from simulation coordinates alone; render jump and frame-timing checks require independently captured frame series.',
      'Duplicate accept trace sequences can indicate logging/reconnect repetition and do not by themselves prove duplicate game actions.',
      'No raw IP addresses, client IDs, names or source log lines are copied to the report.']
  };
}

function main(argv) {
  const args={};for(let i=0;i<argv.length;i++){
    if(!['--host','--client','--out','--drift-threshold'].includes(argv[i]) || !argv[i+1]) throw new Error('Usage: node pc-pair-trace.cjs --host PC1.log --client PC2.log [--out report.json] [--drift-threshold 0.25]');
    const key=argv[i].slice(2);if(Object.hasOwn(args,key))throw new Error('Duplicate option: '+key);
    args[key]=argv[++i];
  }
  if(!args.host||!args.client) throw new Error('Both --host and --client are required');
  if(path.resolve(args.host)===path.resolve(args.client))throw new Error('PC1 and PC2 must be separate files');
  if(args.out&&[args.host,args.client].some(p=>path.resolve(p)===path.resolve(args.out)))throw new Error('Output must differ from input logs');
  const hostBytes=fs.readFileSync(args.host),clientBytes=fs.readFileSync(args.client);
  if(hostBytes.length>MAX_BYTES||clientBytes.length>MAX_BYTES)throw new Error('Log exceeds 16 MiB limit');
  const out=summarize(hostBytes.toString('utf8'),clientBytes.toString('utf8'),
    {driftThreshold:args['drift-threshold']===undefined?undefined:Number(args['drift-threshold'])});
  out.input_fingerprints={host_sha256:crypto.createHash('sha256').update(hostBytes).digest('hex'),
    client_sha256:crypto.createHash('sha256').update(clientBytes).digest('hex'),
    host_size_bytes:hostBytes.length,client_size_bytes:clientBytes.length};
  const data=JSON.stringify(out,null,2)+'\n';
  if(args.out){fs.mkdirSync(path.dirname(args.out),{recursive:true});fs.writeFileSync(args.out,data,{encoding:'utf8',flag:'wx'});} else process.stdout.write(data);
  return out;
}
if (require.main===module) {try{
  const result=main(process.argv.slice(2));
  process.exitCode=result.verdict==='OBSERVED_CONTRADICTION'?1:result.verdict==='INSUFFICIENT_EVIDENCE'?2:0;
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=3;}}
module.exports={parseLog,summarize,main};
