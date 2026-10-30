#!/usr/bin/env node
'use strict';
/**
 * A51 R17-W12: strict FREEZE-only admission of an already generated A51 V2
 * PC1/PC2 Player.log metadata report. This does not read/reinterpret wire
 * payloads or compare hashes (A41), verify binary identity (A72/A60), or
 * certify multiplayer G3/G4. Source SHA is an operator-supplied selection,
 * not an attestation of the executable that produced the logs.
 */
const fs = require('node:fs');
const {checkAggregate} = require('../../w13/a51/trace-accounting.cjs');
const FREEZE_SHA = '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const SCHEMA = 'CC001_R17_W11_A51_NATIVE_TRACE_V2';
const DIGEST = /^[a-f0-9]{64}$/;
const isUInt = n => Number.isSafeInteger(n) && n >= 0;

function assess(report, selectedSha) {
  const reasons = [];
  const safeSelectedSha = typeof selectedSha === 'string' && /^[a-f0-9]{40}$/.test(selectedSha) ? selectedSha : null;
  const add = (code) => { if (!reasons.includes(code)) reasons.push(code); };
  if (selectedSha !== FREEZE_SHA) add('WRONG_FREEZE_SOURCE_SELECTION');
  if (!report || typeof report !== 'object' || Array.isArray(report))
    add('INVALID_A51_REPORT');
  const r = report && typeof report === 'object' && !Array.isArray(report) ? report : {};
  if (r.schema !== SCHEMA || r.evidence !== 'NATIVE_LOG_FORMAT_PARSER')
    add('INVALID_A51_REPORT_SCHEMA');
  const src = r.sources && typeof r.sources === 'object' ? r.sources : {};
  for (const side of ['pc1', 'pc2']) {
    const f = src[side];
    if (!f || !DIGEST.test(f.sha256 || '') || !isUInt(f.bytes) || f.bytes === 0)
      add('MISSING_OR_INVALID_' + side.toUpperCase() + '_ORIGINAL_LOG_FINGERPRINT');
  }
  if (src.pc1 && src.pc2 && DIGEST.test(src.pc1.sha256 || '') &&
      src.pc1.sha256 === src.pc2.sha256) add('IDENTICAL_PC1_PC2_LOG_FINGERPRINT');
  if (!Array.isArray(r.findings)) add('MISSING_FINDINGS');
  else if (r.findings.length > 0) add('TRACE_ANOMALY_PRESENT');
  if (!r.observations || typeof r.observations !== 'object') add('MISSING_OBSERVATIONS');
  const o = r.observations || {};
  for (const k of ['hostRows','clientRows','pairedRevisionRows','hostCadencePolicyChecks',
                    'hostCadencePolicyViolations','unpairedHostRows','unpairedClientRows']) {
    if (!isUInt(o[k])) add('INVALID_OBSERVATION_COUNTER');
  }
  if (isUInt(o.pairedRevisionRows) && isUInt(o.hostRows) && isUInt(o.clientRows) &&
      o.pairedRevisionRows > Math.min(o.hostRows,o.clientRows)) add('IMPOSSIBLE_PAIR_COUNT');
  if (isUInt(o.hostCadencePolicyViolations) && o.hostCadencePolicyViolations > 0)
    add('REPORTED_CADENCE_POLICY_VIOLATION');
  if (o.w11DigestMarkers === null || typeof o.w11DigestMarkers !== 'object' ||
      Array.isArray(o.w11DigestMarkers)) add('MISSING_W11_MARKER_COUNTS');
  else {
    for (const k of ['pc1Tx','pc2Rx','wrongSideOrUnknown']) {
      if (!isUInt(o.w11DigestMarkers[k])) add('INVALID_W11_MARKER_COUNT');
      else if (o.w11DigestMarkers[k] !== 0) add('POST_FREEZE_W11_DIGEST_MARKER_PRESENT');
    }
  }
  // W13: validate arithmetic identities and unsupported QA claims in the existing
  // A51 V2 summary. This is accounting, not a second trace parser.
  if (r.schema === SCHEMA && r.evidence === 'NATIVE_LOG_FORMAT_PARSER') {
    for (const code of checkAggregate(r)) add(code);
  }
  if (r.producer !== 'A41' || r.traceCoverage !== 'SPARSE_A41_SAMPLED')
    add('EXPECTED_FREEZE_A41_DUAL_SOURCE_MISSING');
  if (o.hostRows === 0 || o.clientRows === 0) add('NO_BOTH_SIDES_SAMPLED');
  if (r.qualification?.parser !== 'TRACE_FIELDS_OBSERVED' ||
      !['MATCHED_METADATA_ONLY','NOT_PROVEN'].includes(r.qualification?.sameRevisionMetadata))
    add('PARSER_OR_METADATA_NOT_ADMISSIBLE');
  const invalid = reasons.filter(x => x !== 'NO_SHARED_REVISION_SAMPLES');
  if (invalid.length === 0 && o.pairedRevisionRows === 0) add('NO_SHARED_REVISION_SAMPLES');
  const hard = reasons.some(x => ['WRONG_FREEZE_SOURCE_SELECTION',
    'POST_FREEZE_W11_DIGEST_MARKER_PRESENT','TRACE_ANOMALY_PRESENT',
    'REPORTED_CADENCE_POLICY_VIOLATION','IMPOSSIBLE_PAIR_COUNT',
    'IDENTICAL_PC1_PC2_LOG_FINGERPRINT',
    'REVISION_ACCOUNTING_MISMATCH','HOST_SAMPLE_CADENCE_COUNT_MISMATCH',
    'IMPOSSIBLE_CADENCE_VIOLATION_COUNT','PAIRED_REVISION_QUALIFICATION_MISMATCH',
    'UNSUPPORTED_RUNTIME_EVIDENCE_CLAIM','UNSUPPORTED_QA_QUALIFICATION',
    'UNEXPECTED_CADENCE_POLICY_LABEL'].includes(x));
  const status = hard ? 'FAIL_PROFILE_OR_TRACE' : reasons.length ? 'HOLD_INCOMPLETE_TRACE' :
    'METADATA_CONSISTENT_ONLY';
  return {
    schema:'CC001_R17_W12_A51_FREEZE_TRACE_GATE_V1',
    selectedSourceSha:safeSelectedSha, requiredSourceSha:FREEZE_SHA,
    status, reasons,
    sourceLogs:{pc1:src.pc1 && DIGEST.test(src.pc1.sha256 || '') ?
      {sha256:src.pc1.sha256, bytes:src.pc1.bytes}:null,
      pc2:src.pc2 && DIGEST.test(src.pc2.sha256 || '') ?
      {sha256:src.pc2.sha256, bytes:src.pc2.bytes}:null},
    rows:{host:isUInt(o.hostRows)?o.hostRows:null,client:isUInt(o.clientRows)?o.clientRows:null,
      paired:isUInt(o.pairedRevisionRows)?o.pairedRevisionRows:null},
    guarantees:{sourceSha:'OPERATOR_SELECTED_NOT_BINARY_ATTESTED',
      observedCounters:'LOGGED_VALUES_NOT_WALL_CLOCK_MEASUREMENTS',
      stateParity:'NOT_PROVEN_NO_FREEZE_STATE_DIGEST',
      gameRuntime:'NOT_CERTIFIED', G3:'HOLD',G4:'HOLD',release:'STOP'}
  };
}
function args(argv) {
  const found = {};
  for(let i=0;i<argv.length;i++){
    const k=argv[i];
    if(!['--analysis','--source-sha','--out'].includes(k) || k in found)
      throw Error('Unknown or duplicate argument '+k);
    const value=argv[++i];
    if(!value || value.startsWith('--')) throw Error('Missing value for '+k);
    found[k]=value;
  }
  if(!found['--analysis'] || !found['--source-sha'])
    throw Error('Require --analysis A51.json --source-sha '+FREEZE_SHA);
  return found;
}
function main(argv) {
  try {
    const a=args(argv);
    const report=JSON.parse(fs.readFileSync(a['--analysis'],'utf8'));
    const result=assess(report,a['--source-sha']);
    const output=JSON.stringify(result,null,2)+'\n';
    if(a['--out']) fs.writeFileSync(a['--out'],output,{flag:'wx'});
    else process.stdout.write(output);
    return result.status==='METADATA_CONSISTENT_ONLY'?0:
      result.status==='FAIL_PROFILE_OR_TRACE'?1:2;
  } catch(e) {
    process.stderr.write('A51_FREEZE_TRACE_INPUT_ERROR '+e.message+'\n');
    return 2;
  }
}
module.exports={FREEZE_SHA,assess,args,main};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
