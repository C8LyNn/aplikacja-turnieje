'use strict';
/** CC-001 W15 / A80: conditional cross-device same-revision consistency from
 * operator annotations, even when PC1/PC2 captured a revision in different
 * pairs. NO clock sync, real device provenance, source-bound digest proof or G3. */
const HASH = /^[a-f0-9]{64}$/i;
const revisionOK = n => Number.isSafeInteger(n) && n > 0;
const pointOK = p => p && typeof p.x === 'number' && Number.isFinite(p.x) &&
  typeof p.y === 'number' && Number.isFinite(p.y);
const digest = s => typeof s === 'string' && HASH.test(s) ? s.toLowerCase() : null;
const ballPositions = obs => {
  const out = new Map();
  for (const b of Array.isArray(obs?.balls) ? obs.balls : []) {
    if (Number.isSafeInteger(b?.id) && b.id > 0 && pointOK(b?.canonical))
      out.set(b.id, b.canonical);
  }
  return out;
};
function crossPairRevisions(pairs) {
  const errors = [], gaps = [], notes = [];
  const ledger = new Map();
  for (const pair of Array.isArray(pairs) ? pairs : []) {
    for (const obs of Array.isArray(pair?.observations) ? pair.observations : []) {
      if (obs?.device !== 'PC1' && obs?.device !== 'PC2') continue;
      const revision = obs.authoritative?.revision;
      if (!revisionOK(revision)) continue; // W12/W14 own missing-state gaps.
      let record = ledger.get(revision);
      if (!record) {record = new Map(); ledger.set(revision, record);}
      const otherDevice = obs.device === 'PC1' ? 'PC2' : 'PC1';
      const other = record.get(otherDevice);
      if (other) {
        const where = {revision, device:obs.device, otherDevice,
          pair:pair.index, otherPair:other.pair};
        const a = obs.authoritative, b = other.obs.authoritative;
        if (a.turn !== b.turn || a.phase !== b.phase)
          errors.push({code:'CROSS_PAIR_TURN_OR_PHASE_MISMATCH',...where});
        if (Number.isSafeInteger(a.actionSerial) && a.actionSerial >= 0 &&
          Number.isSafeInteger(b.actionSerial) && b.actionSerial >= 0 &&
          a.actionSerial !== b.actionSerial)
          errors.push({code:'CROSS_PAIR_ACTION_SERIAL_MISMATCH',...where});
        const d1 = digest(a.stateDigest), d2 = digest(b.stateDigest);
        if (!d1 || !d2) gaps.push({code:'CROSS_PAIR_SOURCE_DIGEST_UNVERIFIED',...where});
        else if (d1 !== d2) errors.push({code:'CROSS_PAIR_STATE_DIGEST_MISMATCH',...where});
        const bin1 = digest(obs.binaryAssemblySha256), bin2 = digest(other.obs.binaryAssemblySha256);
        if (!bin1 || !bin2) gaps.push({code:'CROSS_PAIR_ASSEMBLY_DIGEST_UNVERIFIED',...where});
        else if (bin1 !== bin2) errors.push({code:'CROSS_PAIR_ASSEMBLY_MISMATCH',...where});
        const x = ballPositions(obs), y = ballPositions(other.obs);
        if (x.size === 0 || y.size === 0 || x.size !== y.size || [...x.keys()].some(id=>!y.has(id)))
          gaps.push({code:'CROSS_PAIR_CANONICAL_SET_INCOMPLETE',...where});
        for (const [id,pos] of x) if (y.has(id)) {
          const counterpart = y.get(id);
          if (pos.x !== counterpart.x || pos.y !== counterpart.y)
            errors.push({code:'CROSS_PAIR_CANONICAL_POSE_MISMATCH',id,...where});
        }
        if (other.pair !== pair.index)
          notes.push({code:'ASYNCHRONOUS_SAME_REVISION_MATCH',...where});
      }
      // Retain earliest observation per device/revision. Each later observation
      // is still compared to the other device's earliest observation.
      if (!record.has(obs.device)) record.set(obs.device, {obs,pair:pair.index});
    }
  }
  return {errors,gaps,notes,physicalG3Status:'NOT_ASSESSED'};
}
module.exports = {crossPairRevisions};
