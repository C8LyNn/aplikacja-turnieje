'use strict';
// CC-001 A43: standalone, opt-in evidence analyzer; never instruments certified game bytes.
const fs = require('node:fs');
const path = require('node:path');

const PREFIX = 'CC_W9_TRACE ';
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_EVENTS = 200000;
const TYPES = new Set(['snapshot_sent','snapshot_applied','intent_accepted','turn_state','ball_state','client_error']);

function finiteInt(n) { return Number.isSafeInteger(n) && n >= 0; }
function parseLog(input, side) {
  const events = [], legacy = { host_ready:0, peer_connected:0, accepted_local:0,
    accepted_p2:0, rejected:0, first_snapshot_applied:0, snapshot_error:0, connection_failed:0 };
  let malformed = 0, ignored = 0;
  for (const line of input.split(/\r?\n/)) {
    if (line.includes('CC_NET_HOST_READY')) legacy.host_ready++;
    if (line.includes('CC_NET_PEER_CONNECTED')) legacy.peer_connected++;
    if (/CC_NET_INTENT_ACCEPT\s+owner=0\b/.test(line)) legacy.accepted_local++;
    if (/CC_NET_INTENT_ACCEPT\s+owner=1\b/.test(line)) legacy.accepted_p2++;
    if (line.includes('CC_NET_INTENT_REJECT')) legacy.rejected++;
    if (line.includes('CC_NET_STATE_APPLIED')) legacy.first_snapshot_applied++;
    if (line.includes('CC_NET_SNAPSHOT_ERROR')) legacy.snapshot_error++;
    if (line.includes('CC_LAN_CONNECTION_FAILED')) legacy.connection_failed++;
    const i = line.indexOf(PREFIX);
    if (i < 0) continue;
    try {
      const e = JSON.parse(line.slice(i + PREFIX.length));
      if (!e || Array.isArray(e) || typeof e !== 'object' || !TYPES.has(e.type)) { ignored++; continue; }
      if (e.revision !== undefined && !finiteInt(e.revision)) { malformed++; continue; }
      if (e.actionSerial !== undefined && !finiteInt(e.actionSerial)) { malformed++; continue; }
      if (e.type === 'ball_state' && (!finiteInt(e.revision) || !finiteInt(e.actionSerial) || !finiteInt(e.ballId) ||
          (e.layer !== 'simulation' && e.layer !== 'render') || !Number.isFinite(e.x) || !Number.isFinite(e.y))) { malformed++; continue; }
      if (e.type === 'turn_state' && (!finiteInt(e.revision) || ![0,1].includes(e.turn) ||
          ![0,1].includes(e.localOwner) || !['aiming','moving','over'].includes(e.phase) ||
          !['your_turn','opponent_turn','inactive'].includes(e.banner))) { malformed++; continue; }
      if (events.length >= MAX_EVENTS) { malformed++; break; }
      events.push({ ...e, side });
    } catch (_) { malformed++; }
  }
  return { events, legacy, malformed, ignored };
}

function summarize(hostText, clientText, opts = {}) {
  const host = parseLog(hostText, 'host'), client = parseLog(clientText, 'client');
  const all = host.events.concat(client.events), anomalies = [];
  const by = (events, type) => events.filter(e => e.type === type);
  const hostSends = by(host.events, 'snapshot_sent').filter(e => finiteInt(e.revision));
  const clientApplies = by(client.events, 'snapshot_applied').filter(e => finiteInt(e.revision));
  const regressions = []; let last = -1;
  for (const e of clientApplies) { if (e.revision <= last) regressions.push(e.revision); last = e.revision; }
  if (regressions.length) anomalies.push({ code:'CLIENT_REVISION_NONMONOTONIC', count:regressions.length });
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
  const hostBalls = new Map();
  for (const e of by(host.events, 'ball_state')) hostBalls.set(`${e.revision}:${e.actionSerial}:${e.layer}:${e.ballId}`,e);
  const drift = []; let paired = 0;
  for (const e of by(client.events, 'ball_state')) {
    const h = hostBalls.get(`${e.revision}:${e.actionSerial}:${e.layer}:${e.ballId}`);
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
  const hostP2 = by(host.events, 'intent_accepted').filter(e=>e.owner===1);
  const p2AcceptCount = Math.max(hostP2.length,host.legacy.accepted_p2);
  const gaps = [];
  for(let i=1;i<clientApplies.length;i++){
    const a=clientApplies[i-1],b=clientApplies[i];
    if(Number.isFinite(a.monotonicMs)&&Number.isFinite(b.monotonicMs)&&b.monotonicMs>=a.monotonicMs)
      gaps.push(b.monotonicMs-a.monotonicMs);
  }
  const missing = [];
  if (!hostSends.length || !clientApplies.length) missing.push('continuous_snapshot_trace');
  if (!by(all,'turn_state').length) missing.push('authoritative_turn_and_local_banner');
  if (!paired) missing.push('revision_aligned_ball_state_samples');
  if (!p2AcceptCount) missing.push('confirmed_host_p2_intent_acceptance');
  const coverage = {
    matched_snapshot_revisions: [...appliedRevs].filter(x=>sentRevs.has(x)).length,
    client_applied_without_matching_host_sample: [...appliedRevs].filter(x=>!sentRevs.has(x)).length,
    note:'Unmatched host/client samples do not alone establish packet loss: logging may be incomplete.'
  };
  return {
    schema:'CC001_R17_W9_A43_DIAGNOSTIC_REPORT_001',
    verdict:anomalies.length?'OBSERVED_CONTRADICTION':missing.length?'INSUFFICIENT_EVIDENCE':'OBSERVATIONS_AVAILABLE_NOT_QA_PASS',
    host:{ legacy:host.legacy, trace_events:host.events.length, malformed:host.malformed, ignored:host.ignored, snapshot_sent:hostSends.length },
    client:{ legacy:client.legacy, trace_events:client.events.length, malformed:client.malformed, ignored:client.ignored, snapshot_applied:clientApplies.length, last_applied_revision:clientApplies.at(-1)?.revision??null, sample_intervals_ms:gaps },
    p2_intent_host_accepted_count:p2AcceptCount,
    coverage,
    turn_mismatches:turnMismatches,
    paired_ball_samples:paired,
    worst_ball_distance:drift[0]||null,
    above_threshold_samples:above,
    distance_threshold_world_units:threshold,
    anomalies,missing_observations:missing,
    caveats:['No real two-PC verification is implied by parsing logs.',
      'Cross-PC event latency cannot be calculated by subtracting unsynchronized timestamps.',
      'No visual teleportation verdict from simulation coordinates alone; render samples must be independently instrumented.',
      'No raw IP addresses, client IDs, names or source log lines are copied to the report.']
  };
}

function main(argv) {
  const args={};for(let i=0;i<argv.length;i++){
    if(!['--host','--client','--out','--drift-threshold'].includes(argv[i]) || !argv[i+1]) throw new Error('Usage: node pc-pair-trace.cjs --host PC1.log --client PC2.log [--out report.json] [--drift-threshold 0.25]');
    args[argv[i].slice(2)]=argv[++i];
  }
  if(!args.host||!args.client) throw new Error('Both --host and --client are required');
  function safeRead(file){if(fs.statSync(file).size>MAX_BYTES)throw new Error('Log exceeds 16 MiB limit');return fs.readFileSync(file,'utf8');}
  const out=summarize(safeRead(args.host),safeRead(args.client),{driftThreshold:args['drift-threshold']===undefined?undefined:Number(args['drift-threshold'])});
  const data=JSON.stringify(out,null,2)+'\n';
  if(args.out){fs.mkdirSync(path.dirname(args.out),{recursive:true});fs.writeFileSync(args.out,data,'utf8');} else process.stdout.write(data);
  return out;
}
if (require.main===module) {try{main(process.argv.slice(2));}catch(e){process.stderr.write(e.message+'\n');process.exitCode=2;}}
module.exports={parseLog,summarize,main};
