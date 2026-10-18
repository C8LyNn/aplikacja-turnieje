import assert from "node:assert/strict";
import test from "node:test";
import { preflightBackupV3Profile } from "../src/application/backups/backup-v3-profile-gate";
import { validateBackupV3 } from "../src/application/backups/backup-v3";
import { validateRawBackupBeforeClone } from "../src/application/backups/backup-preclone-adapter";
import type { BackupPreclonePorts } from "../src/application/backups/backup-preclone-adapter";

/**
 * WAVE3 / A90: an independent, DB-FREE synthetic boundary contract.
 * Synthetic data is NOT an archived authentic V2/V3 exporter fixture.
 * Ports below are invocation spies; they are NOT release semantic validators.
 * No HTTP ingress, signature verifier, or DB calls are made in these tests.
 */
const stamp = "2026-10-18T08:00:00.000Z";
const encode = (value: unknown) => JSON.stringify(value);
function historicV2(): Record<string, any> {
  return {
    schemaVersion: 2, resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1", exportedAt: stamp,
    tournament: {
      name: "Historical sample", format: "swiss", status: "completed",
      visibility: "private_offline", defaultBestOf: 3,
    },
    players: [{ backupId: 11, name: "One", status: "active" }],
    matches: [{
      backupId: 21, round: 1, matchNumber: 1, bestOf: 3,
      status: "completed", resultType: "bye", resultReason: "system_bye",
      player1BackupId: 11, player2BackupId: null, winnerBackupId: 11,
      score1: null, score2: null, completedAt: stamp,
    }],
    resultHistory: [{
      matchBackupId: 21, revision: 1, round: 1, matchNumber: 1, bestOf: 3,
      player1BackupId: 11, player2BackupId: null, winnerBackupId: 11,
      score1: null, score2: null, resultType: "bye",
      resultReason: "system_bye", completedAt: stamp, recordedAt: stamp,
    }],
    actionLog: [{
      actionType: "system_bye_assigned", description: "System BYE",
      matchBackupId: 21, canUndo: false, undoPayload: null,
      isUndone: false, createdAt: stamp,
    }],
  };
}
function historicV3(): Record<string, any> {
  return {
    schemaVersion: 3, resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1", exportedAt: stamp,
    tournament: {
      name: "Historical sample", status: "active",
      visibility: "private_offline", activeStageBackupId: 3,
    },
    players: [{ backupId: 11, name: "One", status: "active" }],
    stages: [{
      backupId: 3, stageKey: "swiss", position: 1, name: "Swiss",
      format: "swiss", status: "active", participantCount: 1, bestOf: 3,
      rankingPolicy: "swiss_v1", qualificationMode: "none",
      seedingPolicy: "standings_order", version: 1,
      createdAt: stamp, startedAt: stamp,
    }],
    groups: [], stageParticipants: [], matches: [],
    resultHistory: [], actionLog: [],
  };
}
function strictV3(): Record<string, any> {
  const doc = historicV3();
  doc.matches = [{
    backupId: 21, stageBackupId: 3, round: 1, matchNumber: 1, bestOf: 3,
    player1BackupId: 11, player2BackupId: null, winnerBackupId: 11,
    score1: null, score2: null, resultType: "bye",
    resultReason: "system_bye", status: "completed", completedAt: stamp,
  }];
  doc.resultHistory = [{
    matchBackupId: 21, stageBackupId: 3, revision: 2, round: 1,
    matchNumber: 1, bestOf: 3, player1BackupId: 11, player2BackupId: null,
    winnerBackupId: 11, score1: null, score2: null, resultType: "bye",
    resultReason: "system_bye", completedAt: stamp, recordedAt: stamp,
  }];
  doc.actionLog = [{
    actionType: "system_bye_assigned", description: "System BYE",
    stageBackupId: 3, matchBackupId: 21, canUndo: false, undoPayload: null,
    isUndone: false, createdAt: stamp,
  }];
  doc.strictPolicy = {
    profile: "web005.backup-v3.strict.v1", version: 1,
    matchStateRevisions: [{ matchBackupId: 21, stateRevision: 7 }],
    actionOrder: [{
      sourceActionIndex: 0, portableActionId: "wave3-a1", ordinal: 1,
    }],
    completionActions: [],
  };
  return doc;
}
function spies(events: string[]): BackupPreclonePorts {
  return {
    parseV2: (raw) => { events.push("parseV2"); return structuredClone(raw); },
    parseV3: (raw) => { events.push("parseV3"); return structuredClone(raw); },
    validateV2: () => { events.push("semanticV2"); },
    validateV3: () => { events.push("semanticV3"); },
    validateActionLocalV3: () => { events.push("actionLocal"); },
  };
}
function assertNoAuthority(out: ReturnType<typeof validateRawBackupBeforeClone>): void {
  assert.equal(out.authenticated, false);
  assert.equal(out.importAuthorized, false);
  assert.deepEqual(out.capabilities, {
    importAuthorized: false, historicalUndo: false,
    historicalRevert: false, historicalCasReplay: false,
  });
  assert.ok(Object.isFrozen(out));
  assert.ok(Object.isFrozen(out.profile));
  assert.ok(Object.isFrozen(out.profile.capabilities));
}

test("WAVE3-A90-01: source-coherent raw V2 BYE -> historical only after versioned callback", () => {
  const events: string[] = [];
  const raw = encode(historicV2());
  assert.equal(preflightBackupV3Profile(raw).status, "LEGACY_COMPAT_UNATTESTED");
  const out = validateRawBackupBeforeClone(raw, spies(events));
  assert.equal(out.code, "LEGACY_COMPAT_RESTRICTED");
  assert.equal(out.profile.schemaVersion, 2);
  assert.equal(out.semanticValidated, true);
  assert.deepEqual(events, ["parseV2", "semanticV2"]);
  assertNoAuthority(out);
});

test("WAVE3-A90-02: raw V3 legacy classified, never accepts historical Undo/CAS", () => {
  const events: string[] = [];
  const raw = encode(historicV3());
  assert.equal(preflightBackupV3Profile(raw).status, "LEGACY_COMPAT_UNATTESTED");
  const out = validateRawBackupBeforeClone(raw, spies(events));
  assert.equal(out.code, "LEGACY_COMPAT_RESTRICTED");
  assert.equal(out.profile.schemaVersion, 3);
  assert.deepEqual(events, ["parseV3", "semanticV3"]);
  assertNoAuthority(out);
});

test("WAVE3-A90-03: strict marker passes core checks but cannot authenticate issuer", () => {
  const events: string[] = [];
  const raw = encode(strictV3());
  assert.equal(preflightBackupV3Profile(raw).status, "STRICT_AUTH_REQUIRED");
  const out = validateRawBackupBeforeClone(raw, spies(events));
  assert.equal(out.code, "STRICT_ATTESTATION_REQUIRED");
  assert.equal(out.profile.status, "STRICT_AUTH_REQUIRED");
  assert.deepEqual(events, ["parseV3", "semanticV3", "actionLocal"]);
  assert.equal(out.actionLocalValidated, true); // synthetic callback invocation ONLY
  assertNoAuthority(out);
});

test("WAVE3-A90-04: detectable marker stripping + modern sidecar -> reject before parser", () => {
  const x = strictV3();
  delete x.strictPolicy;
  x.matchStateRevisions = [{ matchBackupId: 21, stateRevision: 7 }];
  const events: string[] = [];
  const out = validateRawBackupBeforeClone(encode(x), spies(events));
  assert.equal(out.code, "PROFILE_REJECTED");
  assert.deepEqual(events, []);
  assertNoAuthority(out);
});

test("WAVE3-A90-05: indistinguishably stripped strict is NEVER treated as verified source", () => {
  const x = strictV3();
  delete x.strictPolicy;
  const out = validateRawBackupBeforeClone(encode(x), spies([]));
  assert.equal(out.code, "LEGACY_COMPAT_RESTRICTED");
  assert.equal(out.profile.status, "LEGACY_COMPAT_UNATTESTED");
  assertNoAuthority(out);
});

test("WAVE3-A90-06: raw nested duplicate key rejected before parser/semantic callbacks", () => {
  const raw = encode(strictV3()).replace(
    '"strictPolicy":{',
    '"strictPolicy":{"version":1,'
  );
  const events: string[] = [];
  const profile = preflightBackupV3Profile(raw);
  assert.equal(profile.status, "REJECT");
  assert.equal(profile.reason, "DUPLICATE_JSON_KEY");
  const out = validateRawBackupBeforeClone(raw, spies(events));
  assert.equal(out.code, "PROFILE_REJECTED");
  assert.deepEqual(events, []);
  assertNoAuthority(out);
});

test("WAVE3-A90-07: parser dropping strict extension rejected before semantic validation", () => {
  const events: string[] = [];
  const p = spies(events);
  p.parseV3 = (raw: any) => {
    events.push("parseV3");
    const doc = structuredClone(raw);
    delete doc.strictPolicy;
    return doc;
  };
  const out = validateRawBackupBeforeClone(encode(strictV3()), p);
  assert.equal(out.code, "PARSED_PROFILE_CONFLICT");
  assert.deepEqual(events, ["parseV3"]);
  assertNoAuthority(out);
});

test("WAVE3-A90-08: V3-to-V2 post-parse confusion cannot dispatch wrong semantic version", () => {
  const events: string[] = [];
  const p = spies(events);
  p.parseV3 = (raw: any) => {
    events.push("parseV3");
    return { ...structuredClone(raw), schemaVersion: 2 };
  };
  const out = validateRawBackupBeforeClone(encode(historicV3()), p);
  assert.equal(out.code, "PARSED_PROFILE_CONFLICT");
  assert.deepEqual(events, ["parseV3"]);
  assertNoAuthority(out);
});

test("WAVE3-A90-09: invalid completed historical BYE rejected without executing domain port", () => {
  const x = historicV2();
  x.matches[0].winnerBackupId = 999;
  const events: string[] = [];
  const out = validateRawBackupBeforeClone(encode(x), spies(events));
  assert.equal(out.code, "PROFILE_REJECTED");
  assert.deepEqual(events, []);
  assertNoAuthority(out);
});

test("WAVE3-A90-10: source-shaped but invalid domain result must be rejected by domain port", () => {
  const doc = historicV2();
  doc.matches.push({ ...doc.matches[0], backupId: 22 }); // duplicate round/match number
  const events: string[] = [];
  const p = spies(events);
  p.validateV2 = (value: any) => {
    events.push("semanticV2");
    const keys = new Set<string>();
    for (const match of value.matches) {
      const key = `${match.round}:${match.matchNumber}`;
      if (keys.has(key)) throw new Error("duplicate round/match");
      keys.add(key);
    }
  };
  const out = validateRawBackupBeforeClone(encode(doc), p);
  assert.equal(out.code, "SEMANTIC_VALIDATION_FAILED");
  assert.deepEqual(events, ["parseV2", "semanticV2"]);
  assert.equal(out.semanticValidated, false);
  assertNoAuthority(out);
});

test("WAVE3-A90-11: strict last-history conflict rejected before action-local port", () => {
  const doc = strictV3();
  doc.resultHistory[0].completedAt = "2026-10-18T08:00:01.000Z";
  const events: string[] = [];
  const out = validateRawBackupBeforeClone(encode(doc), spies(events));
  assert.equal(out.code, "STRICT_POLICY_FAILED");
  assert.deepEqual(events, ["parseV3", "semanticV3"]);
  assertNoAuthority(out);
});

test("WAVE3-A90-12: missing real source action-local port fails closed", () => {
  const p = spies([]);
  delete p.validateActionLocalV3;
  const out = validateRawBackupBeforeClone(encode(strictV3()), p);
  assert.equal(out.code, "MISSING_DEPENDENCY");
  assert.equal(out.actionLocalValidated, false);
  assertNoAuthority(out);
});

test("WAVE3-A90-13: async semantic/A70 ports never become positive security authorization", () => {
  const p = spies([]);
  p.validateV3 = async () => {};
  let out = validateRawBackupBeforeClone(encode(strictV3()), p);
  assert.equal(out.code, "SEMANTIC_VALIDATION_FAILED");
  assert.equal(out.semanticValidated, false);
  assertNoAuthority(out);
  p.validateV3 = () => {};
  p.validateActionLocalV3 = async () => {};
  out = validateRawBackupBeforeClone(encode(strictV3()), p);
  assert.equal(out.code, "ACTION_LOCAL_CLOSURE_FAILED");
  assert.equal(out.actionLocalValidated, false);
  assertNoAuthority(out);
});

test("WAVE3-A90-14: client-supplied trust boolean and marker never produce verified ingress", () => {
  const root = strictV3();
  root.trusted = true;
  const rejected = validateRawBackupBeforeClone(encode(root), spies([]));
  assert.equal(rejected.code, "PROFILE_REJECTED");
  assertNoAuthority(rejected);
  const ports = spies([]) as BackupPreclonePorts & { verified?: boolean };
  ports.verified = true;
  const strict = validateRawBackupBeforeClone(encode(strictV3()), ports);
  assert.equal(strict.code, "STRICT_ATTESTATION_REQUIRED");
  assertNoAuthority(strict);
});


/**
 * WAVE4: synthesis models JSON projection of an already-fetched V3 export.
 * It does NOT execute exportBackupV3 (which requires PostgreSQL), nor the
 * importBackupV3 writer. The real DB-free validateBackupV3 is used below.
 */
function syntheticExportSnapshotV3(): Record<string, any> {
  const doc = historicV3();
  // A planned first stage permits a draft export without current matches.
  doc.tournament.status = "draft";
  doc.tournament.activeStageBackupId = null;
  doc.stages[0].status = "planned";
  doc.stages[0].startedAt = null;
  // These ISO timestamps and optional nulls match the exporter's projection
  // conventions, but this is NOT an archived exporter-produced fixture.
  return JSON.parse(JSON.stringify(doc)) as Record<string, any>;
}

test("WAVE4-A90-01: synthetic V3 export snapshot passes real DB-free V3 semantic validator", () => {
  const doc = syntheticExportSnapshotV3();
  try { validateBackupV3(doc as any); } catch (error) {
    assert.fail(error instanceof Error && "details" in error
      ? JSON.stringify((error as { details: string[] }).details)
      : String(error));
  } // REAL source validator, unlike WAVE3 spies
  const events: string[] = [];
  const p = spies(events);
  p.validateV3 = (parsed) => {
    events.push("realValidateBackupV3");
    validateBackupV3(parsed as any);
  };
  const out = validateRawBackupBeforeClone(encode(doc), p);
  assert.equal(out.code, "LEGACY_COMPAT_RESTRICTED");
  assert.equal(out.semanticValidated, true);
  assert.deepEqual(events, ["parseV3", "realValidateBackupV3"]);
  assertNoAuthority(out);
});

test("WAVE4-A90-02: synthetic V3 export with contradictory active-stage pointer fails real domain validation", () => {
  const doc = syntheticExportSnapshotV3();
  // Structurally V3, but semantically impossible: active status + no active stage.
  doc.tournament.status = "active";
  assert.equal(preflightBackupV3Profile(encode(doc)).status, "LEGACY_COMPAT_UNATTESTED");
  const events: string[] = [];
  const p = spies(events);
  p.validateV3 = (parsed) => {
    events.push("realValidateBackupV3");
    validateBackupV3(parsed as any);
  };
  const out = validateRawBackupBeforeClone(encode(doc), p);
  assert.equal(out.code, "SEMANTIC_VALIDATION_FAILED");
  assert.equal(out.semanticValidated, false);
  assert.deepEqual(events, ["parseV3", "realValidateBackupV3"]);
  assertNoAuthority(out);
});

test("WAVE4-A90-03: exporter-shaped stale featured-match reference fails real V3 semantics", () => {
  const doc = syntheticExportSnapshotV3();
  doc.tournament.featuredMatchBackupId = 999;
  assert.equal(preflightBackupV3Profile(encode(doc)).status, "LEGACY_COMPAT_UNATTESTED");
  const p = spies([]);
  p.validateV3 = (parsed) => validateBackupV3(parsed as any);
  const out = validateRawBackupBeforeClone(encode(doc), p);
  assert.equal(out.code, "SEMANTIC_VALIDATION_FAILED");
  assertNoAuthority(out);
});

test("WAVE4-A90-04: source-valid synthetic export cannot be promoted without a full semantic port", () => {
  const doc = syntheticExportSnapshotV3();
  const p = spies([]);
  delete p.validateV3;
  const out = validateRawBackupBeforeClone(encode(doc), p);
  assert.equal(out.code, "MISSING_DEPENDENCY");
  assert.equal(out.semanticValidated, false);
  assertNoAuthority(out);
});
