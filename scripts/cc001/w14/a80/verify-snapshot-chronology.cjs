'use strict';
/** CC-001 W14 / A80. Read-only temporal consistency of operator-annotated
 * authoritative PC1/PC2 snapshots. Does NOT infer transport causality or G3. */
const SHA256 = /^[a-f0-9]{64}$/i;
const validRev = v => Number.isSafeInteger(v) && v > 0;
const validSerial = v => Number.isSafeInteger(v) && v >= 0;
const validOwner = v => v === 0 || v === 1;
function chronology(pairs) {
  const errors = [], gaps = [], notes = [];
  const last = new Map();
  for (const pair of Array.isArray(pairs) ? pairs : []) {
    const id = pair?.index;
    for (const obs of Array.isArray(pair?.observations) ? pair.observations : []) {
      if (obs?.device !== 'PC1' && obs?.device !== 'PC2') continue;
      const where = {pair:id,device:obs.device};
      const a = obs.authoritative || {}, revision = a.revision;
      if (!validRev(revision)) { gaps.push({code:'AUTHORITATIVE_REVISION_NOT_CAPTURED',...where}); continue; }
      const state = {revision, turn:a.turn, phase:a.phase,
        digest:typeof a.stateDigest === 'string' && SHA256.test(a.stateDigest) ? a.stateDigest.toLowerCase():null,
        localOwner:obs.localOwner, binary:typeof obs.binaryAssemblySha256 === 'string' && SHA256.test(obs.binaryAssemblySha256) ? obs.binaryAssemblySha256.toLowerCase():null,
        serial:validSerial(a.actionSerial)?a.actionSerial:null};
      const prev = last.get(obs.device);
      if (prev) {
        if (validOwner(prev.localOwner) && validOwner(state.localOwner) && prev.localOwner !== state.localOwner)
          errors.push({code:'LOCAL_SEAT_CHANGED_WITHIN_CAPTURE',...where});
        if (prev.binary && state.binary && prev.binary !== state.binary)
          errors.push({code:'PLAYER_ASSEMBLY_CHANGED_WITHIN_CAPTURE',...where});
        if (state.revision < prev.revision)
          errors.push({code:'AUTHORITATIVE_REVISION_ROLLBACK',...where,previousRevision:prev.revision,currentRevision:state.revision});
        if (state.revision === prev.revision) {
          if (state.turn !== prev.turn || state.phase !== prev.phase)
            errors.push({code:'TURN_OR_PHASE_CHANGED_WITHOUT_REVISION',...where});
          if (prev.digest && state.digest && prev.digest !== state.digest)
            errors.push({code:'DIGEST_CHANGED_WITHOUT_REVISION',...where});
          if (prev.serial !== null && state.serial !== null && prev.serial !== state.serial)
            errors.push({code:'ACTION_SERIAL_CHANGED_WITHOUT_REVISION',...where});
        }
        if (prev.serial !== null && state.serial !== null && state.serial < prev.serial)
          errors.push({code:'ACTION_SERIAL_ROLLBACK',...where});
        if (state.revision > prev.revision+1)
          notes.push({code:'INTERVENING_REVISIONS_NOT_OBSERVED',...where,previousRevision:prev.revision,currentRevision:state.revision});
      }
      last.set(obs.device, state);
    }
  }
  return {errors,gaps,notes,physicalG3Status:'NOT_ASSESSED'};
}
module.exports={chronology};
