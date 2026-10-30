'use strict';
// CC-001 A42 W15 — admission of A72 #262 generated reports, not of arbitrary source mutation.
// No filesystem writes, no Unity run, no physical-player QA assertion.
const ROOT = 'unity/cc001-r16/CoreClash-V149-Unity/Evidence/R16/Unity/';
const GENERATED = Object.freeze([ROOT + 'unity-smoke.json', ROOT + 'build-StandaloneWindows64.json']);
const allowed = new Set(GENERATED);
const HEX = /^[a-f\d]{64}$/i;

function validateLedger(build) {
  const faults = [];
  const fail = (condition, code) => { if (condition) faults.push(code); };
  const changes = build?.sourceChanges;
  const generated = build?.generatedSourceChanges;
  const unexpected = build?.unexpectedSourceChanges;
  fail(!Array.isArray(changes) || !Array.isArray(generated) || !Array.isArray(unexpected), 'MISSING_SOURCE_LEDGER');
  const safeChanges = Array.isArray(changes) ? changes : [];
  const validRecord = x => x && typeof x === 'object' && !Array.isArray(x) && typeof x.path === 'string' && x.path.length > 0;
  fail(safeChanges.some(x => !validRecord(x)), 'INVALID_SOURCE_CHANGE_RECORD');
  const allowlisted = safeChanges.filter(x => validRecord(x) && allowed.has(x.path));
  const denied = safeChanges.filter(x => !validRecord(x) || !allowed.has(x.path));
  fail(denied.length > 0, 'UNAUTHORIZED_SOURCE_CHANGE');
  fail(allowlisted.length > 2 || new Set(allowlisted.map(x => x.path)).size !== allowlisted.length,
    'DUPLICATE_GENERATED_REPORT_CHANGE');
  fail(Array.isArray(generated) && JSON.stringify(generated) !== JSON.stringify(allowlisted),
    'GENERATED_LEDGER_MISMATCH');
  fail(Array.isArray(unexpected) && (unexpected.length !== 0 || JSON.stringify(unexpected) !== JSON.stringify(denied)),
    'UNEXPECTED_LEDGER_NONEMPTY');
  fail(build?.gates?.freshUnityReports !== true || build?.gates?.sourceNotMutated !== true ||
    build?.gates?.sourceAfterMaterialized !== true, 'A72_GENERATED_REPORT_GATES_MISSING');
  const proofs = build?.unityGenerated;
  fail(!proofs || typeof proofs !== 'object' || Array.isArray(proofs) ||
    !HEX.test(proofs.build || '') || !HEX.test(proofs.smoke || ''), 'UNITY_FRESH_REPORT_SHA_MISSING');
  const report = build?.buildReport;
  fail(report?.target !== 'StandaloneWindows64' || report?.result !== 'Succeeded' || report?.errors !== 0,
    'UNITY_BUILD_RESULT_INCONSISTENT');
  return { status: faults.length ? 'HOLD' : 'GENERATED_REPORT_LEDGER_COHERENT_ONLY',
    reasonCodes: [...new Set(faults)], allowedGeneratedPaths: [...GENERATED],
    acceptedChangeCount: allowlisted.length, physicalPCs: 'NOT_ATTESTED', G3: 'NOT_ATTESTED' };
}
module.exports = { ROOT, GENERATED, validateLedger };
