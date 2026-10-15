/**
 * WEB-005 / A30 R23C — PHYSICAL PG16/HTTP CONTRACT, NOT EXECUTED BY A30.
 *
 * This suite SKIPS every case until A20 has certified a physically isolated
 * PostgreSQL16 test host and explicitly approved tm_test_* DROP_SCHEMA reset.
 * Setting flags on a shared/prod DB is FORBIDDEN. Never treat SKIP as PASS.
 *
 * After separate authorized code GO, A50 supplies a test-only adapter exposing
 * runPgScenario({caseId, rawJson, failpoint?, ...}) and authentic DB snapshots.
 * It MUST perform real HTTP/PG16, not return invented synthetic results.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  requestWith, strictBackup, legacyV3, legacyV2,
  mismatchedActionTarget, untrustedStrictEnvelope,
} from "./fixtures/backup-v3-ingress-security.v1.mjs";

function physicallyApproved() {
  const e = process.env;
  if (e.WEB005_A20_PG16_APPROVED !== "YES" ||
      e.WEB005_ALLOW_ISOLATED_PG16 !== "YES" ||
      e.NODE_TEST_CONTEXT !== "1" ||
      e.TEST_DATABASE_RESET !== "DROP_TM_TEST_SCHEMA" ||
      !/^tm_test_[a-z0-9_]+$/.test(e.TEST_DATABASE_SCHEMA || "") ||
      !e.WEB005_PG16_HOST_ATTESTATION ||
      !e.WEB005_BACKUP_INGRESS_PG_ADAPTER ||
      !e.TEST_DATABASE_URL) return false;
  try {
    const u = new URL(e.TEST_DATABASE_URL);
    const name = decodeURIComponent(u.pathname.slice(1)).toLowerCase();
    if (!["postgres:", "postgresql:"].includes(u.protocol) ||
        !name.includes("test") ||
        /prod|production|main|live|staging/.test(name)) return false;
    return true;
  } catch { return false; }
}
const allowed = physicallyApproved();
const gate = allowed ? undefined :
  "NOT_EXECUTED: A20 physically isolated PG16/explicit reset and A50 real HTTP adapter are not approved. Never run on shared/prod DB.";

let adapterPromise;
async function requirePgAdapter() {
  assert.ok(allowed,gate);
  adapterPromise ??= import(pathToFileURL(resolve(process.env.WEB005_BACKUP_INGRESS_PG_ADAPTER)).href);
  const a = await adapterPromise;
  assert.equal(typeof a.runPgScenario,"function",
    "EXPECTED RED: missing actual isolated HTTP/PG16 executor");
  return a;
}
async function scenario(caseId, backup, options={}) {
  const adapter=await requirePgAdapter();
  const proof=await adapter.runPgScenario({
    caseId,rawJson:JSON.stringify(requestWith(backup)),
    ...options,
  });
  assert.ok(proof && typeof proof === "object");
  assert.ok(typeof proof.headSha==="string" && proof.headSha.length===40,
    "Exact code HEAD required");
  assert.ok(proof.databaseAttested, "A20 physical host identity required");
  assert.ok(proof.realHttp===true && proof.realPg16===true,
    "Mock/test-memory DB does not certify a physical rollback");
  return proof;
}
function noPartial(proof) {
  assert.deepEqual(proof.before,proof.after,
    "ALL observed clone tables must be byte/count equivalent after failed transaction");
  assert.ok(!proof.organizerToken,"Never issue credential on failure");
  assert.ok(!proof.orphanedChildren,"No stage/player/match/history/action/basket/routing orphans");
}
function invalid(proof) {
  assert.equal(proof.httpStatus,400);
  assert.equal(proof.code,"INVALID_BACKUP_V3");
  assert.equal(proof.preCloneWrites,0);
  noPartial(proof);
}
function noLeak(proof) {
  const serialized=JSON.stringify(proof.publicResponse ?? {});
  assert.doesNotMatch(serialized, /stack|passwordhash|privatekey|supporttoken|bearer/i);
}

test("BI-09-PRECLONE-WRITES: invalid strict foreign nested ID never creates a clone",{
  skip:gate,
},async()=>{
  const backup=strictBackup();
  backup.actionLog[0].undoPayload.winnerId=999_999;
  const proof=await scenario("BI-09-PRECLONE-WRITES",backup,
    {requiresTrustedEphemeralIssuer:true});
  assert.equal(proof.signatureVerified,true,"Must reach actual post-signature nested-ID guard");
  invalid(proof);noLeak(proof);
});

test("BI-13-LATE-ROLLBACK: induced DB failure after child inserts is atomic",{
  skip:gate,
},async()=>{
  const proof=await scenario("BI-13-LATE-ROLLBACK",strictBackup(),{
    failpoint:"AFTER_CHILD_ROWS_BEFORE_COMMIT",
    requiresTrustedEphemeralIssuer:true,
  });
  assert.equal(proof.signatureVerified,true,"Must reach DB after authentic test-only signature");
  assert.ok(proof.failpointTriggered,"Must prove the deliberate failure actually fired");
  assert.ok(proof.inTransactionWrites>0,"Test must reach post-insert rollback path");
  assert.ok(proof.httpStatus>=400 && proof.httpStatus<600,
    "Late DB failure is not a 2xx/partial-success response");
  assert.equal(proof.code,"BACKUP_IMPORT_ROLLED_BACK");
  noPartial(proof);noLeak(proof);
});

test("BI-14-RESTORE-AUTH: new clone credential only, source token cannot cross tenant",{
  skip:gate,
},async()=>{
  const proof=await scenario("BI-14-RESTORE-AUTH",legacyV3());
  assert.equal(proof.httpStatus,201);
  assert.ok(proof.cloneId && proof.cloneId!==proof.sourceId,
    "Restored tournament must be distinct from source");
  assert.equal(proof.sourceCredentialAgainstClone,403);
  assert.equal(proof.cloneCredentialAgainstSource,403);
  assert.equal(proof.validCloneOrganizerAgainstClone,200);
  assert.equal(proof.historicUndoAllowed,false);
  assert.equal(proof.historicCasReplayAllowed,false);
  assert.equal(proof.serverRestrictionsEnforced,true);
});

test("BI-15-PRIVATE-VIEWER: private_online requires newly bound viewer secret",{
  skip:gate,
},async()=>{
  const input=legacyV2();
  input.tournament.visibility="private_online";
  const proof=await scenario("BI-15-PRIVATE-VIEWER",input);
  assert.equal(proof.httpStatus,201);
  assert.equal(proof.anonymousViewerAgainstClone,403);
  assert.equal(proof.oldViewerAgainstClone,403);
  assert.equal(proof.newViewerAgainstClone,200);
  assert.equal(proof.oldSupportAgainstClone,403);
});

test("BI-16-CLONE-ISOLATION: valid restored graph uses only local mapped IDs",{
  skip:gate,
},async()=>{
  const backup=strictBackup();
  delete backup.strictPolicy; // historical-looking V3 with non-empty completed history/action
  const proof=await scenario("BI-16-CLONE-ISOLATION",backup);
  assert.equal(proof.httpStatus,201);
  assert.ok(proof.cloneMatchCount>=2,"Nontrivial populated clone, not vacuous empty graph");
  assert.equal(proof.foreignMatchReferences,0);
  assert.equal(proof.foreignPlayerReferences,0);
  assert.equal(proof.foreignStageReferences,0);
  assert.equal(proof.foreignActionReferences,0);
  assert.equal(proof.unsafeHistoricalActionCapabilities,0);
  assert.equal(proof.orphanedChildren,0);
});

test("BI-08-ACTION-LOCAL HTTP: mismatched but exported match IDs must 400 with zero rows",{
  skip:gate,
},async()=>{
  const proof=await scenario("BI-08-ACTION-LOCAL",
    mismatchedActionTarget(),{requiresTrustedEphemeralIssuer:true});
  assert.equal(proof.signatureVerified,true,"Must test wrong-action ID after trusted profile");
  invalid(proof);
});
