'use strict';
// A42 non-invasive PC1/PC2 regression evidence gate; no network or release actions.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const a31 = require('../a31/analyze-network-logs.cjs');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const integer = n => Number.isSafeInteger(n) && n >= 0;

function verify(hostText, clientText) {
  const h = a31.parse(hostText), c = a31.parse(clientText);
  const baseline = a31.analyze(hostText, clientText);
  const failures = [], missing = [];
  if (!String(hostText).trim()) missing.push('PC1_LOG');
  if (!String(clientText).trim()) missing.push('PC2_LOG');
  if (!h.hostReady) missing.push('PC1_HOST_READY');
  if (!h.peerConnected) missing.push('P2_SEAT_BIND');
  if (!h.accept.length) missing.push('P2_INTENT_ACCEPT');
  if (!c.clientFirstSnapshot) missing.push('P2_FIRST_SNAPSHOT');
  if (!c.clientLaunch) missing.push('P2_LOCAL_OWNER_IDENTITY');
  if (h.tx.length < 2) missing.push('PC1_TX_TRACE_TWO_REVISIONS');
  if (c.rx.length < 2) missing.push('PC2_RX_TRACE_TWO_REVISIONS');
  if (h.hostReady > 1 || h.peerConnected > 1 || c.clientLaunch > 1) missing.push('SINGLE_SESSION_IDENTITY');
  if (h.failures || c.failures) failures.push('NETWORK_ERROR_MARKER');

  function verifySequence(events, label) {
    let previous = -1, prevSerial = -1, prevTurn = -1;
    const indexed = new Map();
    for (const item of events) {
      if (![item.rev,item.serial,item.turn].every(integer) || item.rev === 0) {
        failures.push(label + '_INVALID_TRACE_FIELD'); continue;
      }
      if (item.rev <= previous) failures.push(label + '_NON_INCREASING_REVISION');
      if (item.serial < prevSerial) failures.push(label + '_ACTION_SERIAL_REGRESSION');
      if (item.turn < prevTurn) failures.push(label + '_TURN_REGRESSION');
      previous = item.rev; prevSerial = item.serial; prevTurn = item.turn;
      if (indexed.has(item.rev)) failures.push(label + '_DUPLICATE_REVISION');
      indexed.set(item.rev, item);
    }
    return indexed;
  }
  const hostByRev = verifySequence(h.tx, 'PC1_TX');
  const clientByRev = verifySequence(c.rx, 'PC2_RX');
  let lastSeq = -1, lastAction = -1;
  for (const item of h.accept) {
    if (!integer(item.seq) || !integer(item.action) || item.seq <= lastSeq)
      failures.push('P2_ACCEPT_SEQUENCE_INVALID_OR_DUPLICATE');
    if (!integer(item.action) || item.action <= lastAction)
      failures.push('P2_ACCEPT_ACTION_SERIAL_NON_INCREASING');
    lastSeq = item.seq; lastAction = item.action;
  }
  const matches = [];
  for (const [rev, rx] of clientByRev) {
    const tx = hostByRev.get(rev);
    if (!tx) continue; // Loss is evidence of missing correlation, not an invented contradiction.
    if (tx.serial !== rx.serial || tx.turn !== rx.turn)
      failures.push('CROSS_DEVICE_SNAPSHOT_CONTENT_MISMATCH_REV_' + rev);
    else matches.push({revision:rev, actionSerial:rx.serial, turn:rx.turn});
  }
  if (!matches.length) missing.push('NO_COMMON_HOST_CLIENT_SNAPSHOT');
  if (lastAction >= 0 && !matches.some(m => m.actionSerial >= lastAction))
    missing.push('P2_ACCEPTED_ACTION_NOT_OBSERVED_ON_PC2');
  const uniqueFailures = [...new Set(failures)];
  const uniqueMissing = [...new Set(missing)];
  const status = uniqueFailures.length ? 'FAIL' : uniqueMissing.length ? 'INCOMPLETE_EVIDENCE' : 'TRACE_CONSISTENT';
  return {
    tool:'CC-001/A42/R17-W9/pc-pair-v1', status, physicalG3:'NOT_ATTESTED',
    note:'Offline diagnostic only; no physical-device provenance, state hash, clock synchronisation, visual lag or gameplay acceptance inferred.',
    failures:uniqueFailures, missing:uniqueMissing,
    trace:{hostTx:h.tx.length,clientRx:c.rx.length,matchingSnapshots:matches,
      hostAcceptedP2:h.accept,clientOwnerOneLaunchCount:c.clientLaunch,
      acceptedP2Propagated:lastAction >= 0 && matches.some(m => m.actionSerial >= lastAction)},
    a31Gate:baseline.gate,
    a31Anomalies:baseline.anomalies
  };
}
function main(argv) {
  const args = new Map();
  for (let i=0;i<argv.length;i+=2) {
    if (!['--host','--client','--out'].includes(argv[i]) || !argv[i+1])
      throw new Error('Usage: node verify-pc-pair.cjs --host PC1_Player.log --client PC2_Player.log [--out result.json]');
    if (args.has(argv[i])) throw new Error('Duplicate argument: '+argv[i]);
    args.set(argv[i],argv[i+1]);
  }
  if (!args.has('--host') || !args.has('--client')) throw new Error('Both log paths required');
  const host = fs.readFileSync(args.get('--host')), client = fs.readFileSync(args.get('--client'));
  const report = verify(host.toString('utf8'),client.toString('utf8'));
  report.inputs = {
    pc1:{sha256:sha(host),sizeBytes:host.length},
    pc2:{sha256:sha(client),sizeBytes:client.length}
  };
  const output=JSON.stringify(report,null,2)+'\n';
  if (args.has('--out')) {
    const target=path.resolve(args.get('--out'));
    fs.writeFileSync(target,output,{flag:'wx'}); // never overwrite prior evidence
  } else process.stdout.write(output);
  return report.status === 'TRACE_CONSISTENT' ? 0 : report.status === 'FAIL' ? 1 : 2;
}
module.exports={verify,main};
if (require.main === module) {
  try { process.exitCode=main(process.argv.slice(2)); }
  catch(e) { process.stderr.write('A42_PAIR_GATE_ERROR '+e.message+'\n');process.exitCode=3; }
}
