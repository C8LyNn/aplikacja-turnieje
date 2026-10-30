#!/usr/bin/env node
'use strict';
/** CC-001 R17-W11 A81: offline F1 diagnostic TX/RX trace correlation.
 * Reads only operator-supplied, independent PC1 + PC2 Player.log files.
 * Checks sampled same-revision metadata, NOT positions, physics or live connectivity.
 * Never derives one-way latency from unsynchronized monotonic clocks.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const MAX_LOG_BYTES = 32 * 1024 * 1024;
const KEYS = ['rev', 'serial', 'tms', 'turn', 'phase', 'chunks'];
const MAX_ERRORS = 100;

function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function nonneg(value) {
  return typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value) &&
    Number.isSafeInteger(Number(value)) ? Number(value) : null;
}
function parse(text, side) {
  if (!['PC1', 'PC2'].includes(side)) throw new Error('Invalid peer role');
  const expected = side === 'PC1' ? 'TX' : 'RX';
  const records = [], errors = [];
  let seen = 0;
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = /(?:^|\s)CC_NET_TRACE_(TX|RX)(?=\s|$)/.exec(line);
    if (!marker) continue;
    seen++;
    const kind = marker[1];
    if (kind !== expected) {
      errors.push({code: 'WRONG_ENDPOINT_TRACE_KIND', peer: side, line: i + 1});
      continue;
    }
    const tail = line.slice(marker.index + marker[0].length).trim();
    const tokens = tail ? tail.split(/\s+/) : [];
    const fields = Object.create(null);
    let bad = false;
    for (const token of tokens) {
      const m = /^([a-z]+)=(\S+)$/.exec(token);
      if (!m || Object.hasOwn(fields, m[1])) { bad = true; break; }
      fields[m[1]] = m[2];
    }
    const allowed = kind === 'TX' ? [...KEYS, 'bytes'] : KEYS;
    if (!bad && (Object.keys(fields).some(k => !allowed.includes(k)) ||
        allowed.some(k => !Object.hasOwn(fields, k)))) bad = true;
    const rec = {peer: side, kind, line: i + 1};
    if (!bad) {
      for (const k of ['rev', 'serial', 'tms', 'turn', 'chunks', ...(kind === 'TX' ? ['bytes'] : [])]) {
        rec[k] = nonneg(fields[k]);
        if (rec[k] === null) bad = true;
      }
      if (rec.turn !== 0 && rec.turn !== 1) bad = true;
      if (rec.chunks < 1 || (kind === 'TX' && rec.bytes < 1)) bad = true;
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(fields.phase || '')) bad = true;
      rec.phase = fields.phase;
    }
    if (bad) errors.push({code: 'MALFORMED_TRACE_MARKER', peer: side, line: i + 1});
    else records.push(rec);
  }
  return {seen, records, errors};
}
function verify(hostText, clientText) {
  const h = parse(hostText, 'PC1'), c = parse(clientText, 'PC2');
  const errors = [...h.errors, ...c.errors];
  const notices = [];
  function issue(code, details) {
    if (errors.length < MAX_ERRORS) errors.push({code, ...details});
  }
  function classify(records, side) {
    const map = new Map();
    let lastRev = null, lastMs = null, lastSerial = null;
    let gaps = 0;
    for (const e of records) {
      if (map.has(e.rev)) issue('DUPLICATE_REVISION', {peer: side, rev: e.rev});
      else map.set(e.rev, e);
      if (lastRev !== null) {
        if (e.rev <= lastRev) issue('NON_INCREASING_REVISION', {peer: side, rev: e.rev, previous: lastRev});
        if (e.rev > lastRev + 1) gaps++;
      }
      if (lastMs !== null && e.tms < lastMs) issue('LOCAL_TIME_REVERSAL', {peer: side, rev: e.rev});
      if (lastSerial !== null && e.serial < lastSerial) issue('ACTION_SERIAL_REVERSAL', {peer: side, rev: e.rev});
      lastRev = e.rev; lastMs = e.tms; lastSerial = e.serial;
    }
    return {map, gaps};
  }
  const hm = classify(h.records, 'PC1'), cm = classify(c.records, 'PC2');
  let paired = 0, mismatches = 0;
  const mismatchedFields = [];
  const unpairedHost = [], unpairedClient = [];
  for (const [rev, host] of hm.map) {
    const client = cm.map.get(rev);
    if (!client) {unpairedHost.push(rev); continue;}
    paired++;
    for (const field of ['serial', 'turn', 'phase', 'chunks']) {
      if (host[field] !== client[field]) {
        mismatches++;
        mismatchedFields.push({rev, field});
        issue('SAME_REVISION_METADATA_MISMATCH', {rev, field});
      }
    }
  }
  for (const rev of cm.map.keys()) if (!hm.map.has(rev)) unpairedClient.push(rev);
  if (!h.records.length || !c.records.length) notices.push('MISSING_F1_TRACE_ON_ONE_OR_BOTH_ENDPOINTS');
  if (paired < 2) notices.push('FEWER_THAN_TWO_MATCHED_SNAPSHOTS');
  if (unpairedHost.length || unpairedClient.length) notices.push('UNPAIRED_TRACE_REVISIONS_NOT_PACKET_LOSS_PROOF');
  if (hm.gaps || cm.gaps) notices.push('OBSERVED_REVISION_GAPS_NOT_PACKET_LOSS_PROOF');
  // A sampled, metadata-only consistency check, never an end-to-end game or physical QA PASS.
  const verdict = errors.length ? 'ANOMALY_IN_SUPPLIED_TRACE' :
    (paired < 2 || unpairedHost.length || unpairedClient.length ? 'INSUFFICIENT_TRACE' : 'CONSISTENT_SAMPLED_METADATA_ONLY');
  return {
    schema: 'CC001_R17_W11_A81_TRACE_METADATA_V1',
    verdict, gameplayGate: 'NOT_ATTESTED', twoPcPhysicalQa: 'NOT_ATTESTED',
    timingPolicy: 'MONOTONIC_TIME_WITHIN_EACH_DEVICE_ONLY; NO_ONE_WAY_LATENCY',
    constraints: 'NO_BALL_POSE_HASH_OR_FRAME_RENDER_PARITY; NO_CAUSAL_PACKET_LOSS_CLAIM; NO_PROTOCOL_MODIFICATION',
    host: {validTx: h.records.length, encounteredMarkers: h.seen, revisionGaps: hm.gaps},
    client: {validRx: c.records.length, encounteredMarkers: c.seen, revisionGaps: cm.gaps},
    pairedRevisions: paired,
    hostOnlyCount: unpairedHost.length, clientOnlyCount: unpairedClient.length,
    mismatches, mismatchedFields: mismatchedFields.slice(0, MAX_ERRORS),
    errors: errors.slice(0, MAX_ERRORS), notices
  };
}
function cli(argv) {
  if (argv.includes('--help')) {
    process.stdout.write('node verify-snapshot-traces.cjs --host PC1_Player.log --client PC2_Player.log [--out report.json]\n');
    return 0;
  }
  const names = new Set(['--host', '--client', '--out']);
  const args = Object.create(null);
  for (let i = 0; i < argv.length; i += 2) {
    if (i + 1 >= argv.length || !names.has(argv[i]) || Object.hasOwn(args, argv[i]) || argv[i + 1].startsWith('--'))
      throw new Error('Invalid CLI arguments; use --help');
    args[argv[i]] = argv[i + 1];
  }
  if (!args['--host'] || !args['--client'] || args['--host'] === args['--client'])
    throw new Error('Two distinct --host and --client log paths are required');
  const files = [args['--host'], args['--client']];
  const buffers = files.map(p => {
    const stat = fs.statSync(p);
    if (!stat.isFile() || stat.size > MAX_LOG_BYTES) throw new Error('Input must be a regular log <=32MiB');
    return fs.readFileSync(p);
  });
  const report = verify(buffers[0].toString('utf8'), buffers[1].toString('utf8'));
  report.inputEvidence = {host: {sha256: sha256(buffers[0]), bytes: buffers[0].length},
    client: {sha256: sha256(buffers[1]), bytes: buffers[1].length}};
  const out = JSON.stringify(report, null, 2) + '\n';
  if (args['--out']) fs.writeFileSync(args['--out'], out, {flag: 'wx'});
  else process.stdout.write(out);
  return report.verdict === 'CONSISTENT_SAMPLED_METADATA_ONLY' ? 0 :
    report.verdict === 'ANOMALY_IN_SUPPLIED_TRACE' ? 1 : 2;
}
module.exports = {parse, verify, nonneg, cli};
if (require.main === module) {
  try {process.exitCode = cli(process.argv.slice(2));}
  catch (error) {process.stderr.write('A81_TRACE_INPUT_ERROR ' + error.message + '\n'); process.exitCode = 3;}
}
