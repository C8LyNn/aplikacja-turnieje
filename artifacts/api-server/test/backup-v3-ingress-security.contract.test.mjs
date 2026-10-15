/**
 * WEB-005-T030-A30-R23C-BACKUP-INGRESS-SECURITY
 *
 * EXECUTABLE FAIL-FIRST SECURITY ACCEPTANCE; NOT AN IMPLEMENTATION.
 * Run without dependencies: node --test ./test/backup-v3-ingress-security.contract.test.mjs
 *
 * Expected current state: RED. There is NO production ingress adapter.
 * Supply WEB005_BACKUP_INGRESS_SECURITY_ADAPTER only after separate A00 GO.
 * The adapter is a future test-only seam, NOT a trusted user-provided flag.
 * See docs/web-005/agent-reports/A30/WEB-005_A30_R23C_BACKUP_INGRESS_SECURITY_CONTRACT.md.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync, sign } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CASE_IDS, CORPUS_VERSION, deepCopy, legacyV2, legacyV3,
  mismatchedActionTarget, requestWith, strictBackup,
  untrustedLegacyUndo, untrustedStrictEnvelope,
} from "./fixtures/backup-v3-ingress-security.v1.mjs";

/**
 * Required future adapter exported API:
 *   evaluateRawIngress({rawJson, issuers, captureWrite}) =>
 *      { decision, httpStatus?, code?, authenticated, capabilities?, parsedBackup?, ... }
 *   validateStrictSourceGraph({backup}) => {ok, code?, issues?}
 *   canonicalSigningBytes({envelope,backup}) => Uint8Array
 *   inspectZodRoundTrip({rawJson}) =>
 *      {rawProfile,parsedProfile,profilePreserved,backupVersion}
 *
 * No import/export function from PR56/58 satisfies this full contract yet.
 */
let adapterPromise;
async function requireAdapter() {
  const configured = process.env.WEB005_BACKUP_INGRESS_SECURITY_ADAPTER;
  assert.ok(configured,
    "EXPECTED RED / NOT_IMPLEMENTED: set WEB005_BACKUP_INGRESS_SECURITY_ADAPTER only after A00 authorizes a test-only ingress adapter; PR56/58 are NOT_WIRED");
  adapterPromise ??= import(pathToFileURL(resolve(configured)).href);
  const adapter = await adapterPromise;
  assert.equal(typeof adapter.evaluateRawIngress, "function",
    "EXPECTED RED: adapter.evaluateRawIngress(raw, issuers, captureWrite) missing");
  return adapter;
}
function noPrivileges(x) {
  assert.equal(x?.historicalUndo, false);
  assert.equal(x?.historicalRevert, false);
  assert.equal(x?.historicalCasReplay, false);
}
function deny(result, writes) {
  assert.equal(result?.decision, "REJECT",
    "Untrusted/malformed input must not become authenticated, eligible strict or unrestricted legacy");
  assert.equal(result?.httpStatus, 400, "Invalid Backup V3 => HTTP 400");
  assert.equal(result?.code, "INVALID_BACKUP_V3");
  assert.notEqual(result?.authenticated, true);
  assert.equal(writes.length, 0, "NO prevalidation writes");
}
async function ingress(backupOrEnvelope, { issuers = {} } = {}) {
  const adapter = await requireAdapter();
  const writes = [];
  const rawJson = JSON.stringify(requestWith(backupOrEnvelope));
  const result = await adapter.evaluateRawIngress({
    rawJson, issuers,
    captureWrite: (entry) => writes.push(entry),
  });
  return { result, writes, rawJson, adapter };
}

test("CORPUS v1 is an explicit immutable list of test obligations (no implied runtime PASS)", () => {
  assert.equal(CORPUS_VERSION, "web005.a30.backup_ingress_security.corpus.v1");
  assert.equal(new Set(CASE_IDS).size, CASE_IDS.length);
  assert.equal(CASE_IDS.length, 16);
  assert.equal(strictBackup().strictPolicy.version, 1);
  assert.deepEqual(legacyV3().actionLog, []);
});

test("BI-01-STRIP: strict marker stripped but envelope/modern fields remain => 400 preclone", async () => {
  const signedShape = untrustedStrictEnvelope();
  delete signedShape.backup.strictPolicy;
  deny(...Object.values(await ingress(signedShape)).slice(0, 2));
});

test("BI-02-UNKNOWN-ISSUER: unrecognized keyId/issuer => 400; no self-signed trust", async () => {
  const {result,writes} = await ingress(untrustedStrictEnvelope(), {issuers:{}});
  deny(result,writes);
});

test("BI-03-BAD-SIGNATURE: known ephemeral issuer with tampered signature => 400", async () => {
  const {publicKey} = generateKeyPairSync("ed25519"); // generated IN MEMORY, never stored
  const x = untrustedStrictEnvelope();
  x.issuerId = "test-ephemeral"; x.keyId = "2026-ephemeral";
  const issuers = { "test-ephemeral/2026-ephemeral": publicKey.export({type:"spki",format:"pem"}) };
  const {result,writes} = await ingress(x, {issuers});
  deny(result,writes);
});

test("BI-04-PROFILE-CONFUSION: V2/V3 discriminant, unknown profile, signed version confusion fail", async () => {
  for (const alter of [
    x => { x.backup.schemaVersion = 2; },
    x => { x.backup.strictPolicy.version = 99; },
    x => { x.profile = "unknown.strict.v42"; },
    x => { x.backup.strictPolicy.profile = "unknown.strict.v42"; },
    x => { x.envelopeVersion = 2; },
  ]) {
    const x = untrustedStrictEnvelope(); alter(x);
    const {result,writes} = await ingress(x);
    deny(result,writes);
  }
});

test("BI-05-ZOD-STRIP: raw strictPolicy must survive parsed object unchanged or fail 400", async () => {
  const a = await requireAdapter();
  assert.equal(typeof a.inspectZodRoundTrip, "function",
    "EXPECTED RED: no raw-before-Zod + typed-profile parity proof");
  const rawJson = JSON.stringify(requestWith(strictBackup()));
  const outcome = await a.inspectZodRoundTrip({rawJson});
  assert.equal(outcome.rawProfile, "web005.backup-v3.strict.v1");
  assert.equal(outcome.parsedProfile, outcome.rawProfile,
    "Zod must not strip strictPolicy and secretly dispatch to permissive V3");
  assert.equal(outcome.profilePreserved, true);
  assert.equal(outcome.backupVersion, 3);
});

test("BI-06-LEGACY-UNDO: positive historical V3 shape never resurrects unsafe Undo/Revert/CAS", async () => {
  const x = untrustedLegacyUndo();
  const {result,writes} = await ingress(x);
  assert.equal(writes.length, 0);
  assert.ok(result.decision === "REJECT" || result.decision === "LEGACY_RESTRICTED",
    "Legacy corrupt record must be rejected or strictly quarantined under signed policy");
  if (result.decision === "LEGACY_RESTRICTED") {
    assert.equal(result.authenticated, false);
    noPrivileges(result.capabilities);
    assert.equal(result.serverEnforcedRestrictions, true,
      "A UI-only disable is insufficient");
  } else {
    assert.equal(result.httpStatus, 400);
  }
});

test("BI-07-FOREIGN-ID: unexported nested player/match ID fails strict graph closure", async () => {
  const a = await requireAdapter();
  assert.equal(typeof a.validateStrictSourceGraph, "function");
  for (const mutate of [
    x => { x.actionLog[0].undoPayload.matchId = 999_999; },
    x => { x.actionLog[0].undoPayload.winnerId = 999_999; },
  ]) {
    const backup = strictBackup(); mutate(backup);
    const result = await a.validateStrictSourceGraph({backup});
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_BACKUP_V3");
  }
});

test("BI-08-ACTION-LOCAL: in-export wrong-match ID must fail even though globally known", async () => {
  const a = await requireAdapter();
  assert.equal(typeof a.validateStrictSourceGraph, "function");
  const x = mismatchedActionTarget();
  assert.ok(x.matches.some(m => m.backupId === x.actionLog[0].undoPayload.matchId));
  assert.notEqual(x.actionLog[0].undoPayload.matchId, x.actionLog[0].matchBackupId);
  const result = await a.validateStrictSourceGraph({backup:x});
  assert.equal(result.ok, false,
    "Membership-only Set.has(id) is insufficient: compare action-local target");
  assert.equal(result.code, "INVALID_BACKUP_V3");
});

test("BI-09-PRECLONE-WRITES: no write-capable action before signature/profile/graph checks", async () => {
  const corrupt = strictBackup(); corrupt.actionLog[0].undoPayload.matchId = 888_888;
  const {result,writes} = await ingress(untrustedStrictEnvelope(corrupt));
  deny(result,writes);
});

test("BI-10-LEGACY-V2: genuine V2 structure is never elevated to historic auth authority", async () => {
  const {result,writes} = await ingress(legacyV2());
  assert.equal(writes.length,0);
  assert.ok(["REJECT","LEGACY_RESTRICTED"].includes(result.decision));
  assert.equal(result.authenticated,false);
  if (result.decision === "LEGACY_RESTRICTED") {
    noPrivileges(result.capabilities);
    assert.equal(result.serverEnforcedRestrictions,true);
  }
});

test("BI-11-LEGACY-V3: empty histories/actions remain eligible ONLY for restricted restore", async () => {
  const {result,writes} = await ingress(legacyV3());
  assert.equal(writes.length,0);
  assert.ok(["REJECT","LEGACY_RESTRICTED"].includes(result.decision));
  assert.equal(result.authenticated,false);
  if (result.decision === "LEGACY_RESTRICTED") {
    noPrivileges(result.capabilities);
    assert.equal(result.serverEnforcedRestrictions,true);
  }
});

test("BI-12-SIGNED-POSITIVE: ephemeral Ed25519 proof, verified issuer and payload binding", async () => {
  const a=await requireAdapter();
  assert.equal(typeof a.canonicalSigningBytes,"function",
    "EXPECTED RED: canonical signed bytes and domain separation not implemented");
  const {publicKey,privateKey}=generateKeyPairSync("ed25519"); // RAM-only
  const envelope=untrustedStrictEnvelope();
  envelope.issuerId="test-ephemeral"; envelope.keyId="ephemeral-v1";
  envelope.signature="";
  const bytes=await a.canonicalSigningBytes({envelope,backup:envelope.backup});
  assert.ok(bytes instanceof Uint8Array);
  envelope.signature=sign(null,Buffer.from(bytes),privateKey).toString("base64url");
  const issuers={"test-ephemeral/ephemeral-v1":publicKey.export({type:"spki",format:"pem"})};
  const {result,writes}=await ingress(envelope,{issuers});
  assert.equal(writes.length,0);
  assert.equal(result.decision,"STRICT_VERIFIED");
  assert.equal(result.authenticated,true);
  const tampered=deepCopy(envelope);
  tampered.backup.tournament.name="TAMPERED after signature";
  const denied=await ingress(tampered,{issuers});
  deny(denied.result,denied.writes);
});
