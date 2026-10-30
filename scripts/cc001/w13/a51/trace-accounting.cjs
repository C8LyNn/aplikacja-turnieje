'use strict';
/** Frozen W11 A51 V2 metadata accounting; never a transport or runtime verdict. */
const whole = n => Number.isSafeInteger(n) && n >= 0;
const PERIODS = new Set([50, 83, 125, 250]);
const BASELINE_POLICY_SHA = '173273122c11cbf738e8b954e32506a6196fe8ec';
function checkAggregate(report) {
  const reasons = [];
  const add = code => { if (!reasons.includes(code)) reasons.push(code); };
  const r = report && typeof report === 'object' && !Array.isArray(report) ? report : {};
  const o = r.observations && typeof r.observations === 'object' && !Array.isArray(r.observations)
    ? r.observations : {};
  const h = o.hostRows, c = o.clientRows, p = o.pairedRevisionRows;
  const uh = o.unpairedHostRows, uc = o.unpairedClientRows;
  if ([h,c,p,uh,uc].every(whole)) {
    if (p + uh !== h || p + uc !== c) add('REVISION_ACCOUNTING_MISMATCH');
  }
  if (whole(h) && whole(o.hostCadencePolicyChecks) &&
      h !== o.hostCadencePolicyChecks) add('HOST_SAMPLE_CADENCE_COUNT_MISMATCH');
  if (whole(o.hostCadencePolicyViolations) && whole(o.hostCadencePolicyChecks) &&
      o.hostCadencePolicyViolations > o.hostCadencePolicyChecks)
    add('IMPOSSIBLE_CADENCE_VIOLATION_COUNT');
  if (!Array.isArray(o.hostIntervalSamples) ||
      !whole(h) || o.hostIntervalSamples.length !== h ||
      o.hostIntervalSamples.some(ms => !PERIODS.has(ms)))
    add('INVALID_HOST_INTERVAL_SAMPLES');
  if (!whole(o.maxReportedSkippedClientRevisions)) add('INVALID_CLIENT_SKIP_COUNTER');
  if (whole(p) && r.qualification && typeof r.qualification === 'object') {
    const expected = p > 0 ? 'MATCHED_METADATA_ONLY' : 'NOT_PROVEN';
    if (r.qualification.sameRevisionMetadata !== expected)
      add('PAIRED_REVISION_QUALIFICATION_MISMATCH');
  }
  if (o.localOneWayLatencyMs !== null || o.payloadHashPairs !== 0 || o.frameCoordinates !== 0)
    add('UNSUPPORTED_RUNTIME_EVIDENCE_CLAIM');
  const q = r.qualification || {};
  if (q.authoritativeStateParity !== 'NOT_PROVEN_NO_PAYLOAD_HASH' ||
      q.visualSmoothness !== 'NOT_PROVEN_NO_FRAMES' ||
      q.G3 !== 'NOT_CERTIFIED_BY_ANALYZER' || q.G4 !== 'NOT_CERTIFIED_BY_ANALYZER')
    add('UNSUPPORTED_QA_QUALIFICATION');
  // This is a source *policy label*, not proof of binary identity.
  if (r.candidateSourceSha !== BASELINE_POLICY_SHA) add('UNEXPECTED_CADENCE_POLICY_LABEL');
  return reasons;
}
module.exports={checkAggregate,BASELINE_POLICY_SHA};
