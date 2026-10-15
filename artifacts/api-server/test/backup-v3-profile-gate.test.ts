import assert from "node:assert/strict";
import test from "node:test";
import {
  preflightBackupV3Profile,
  PROFILE_GATE_LIMITS,
} from "../src/application/backups/backup-v3-profile-gate";

function v2(): Record<string, any> {
  return {
    schemaVersion: 2, resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1", exportedAt: "2026-09-01T00:00:00.000Z",
    tournament: {
      name: "Archived", format: "swiss", status: "completed",
      visibility: "private_offline", defaultBestOf: 3,
    },
    players: [{ backupId: 1, name: "One", status: "active" }],
    matches: [{
      backupId: 4, round: 1, matchNumber: 1, bestOf: 3,
      status: "completed", resultType: "bye", resultReason: "system_bye",
    }],
    resultHistory: [], actionLog: [],
  };
}
function v3(): Record<string, any> {
  return {
    schemaVersion: 3, resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1", exportedAt: "2026-09-01T00:00:00.000Z",
    tournament: { name: "Archived", status: "active", visibility: "private_offline" },
    players: [{ backupId: 1, name: "One", status: "active" }],
    stages: [{
      backupId: 2, stageKey: "swiss", position: 1, name: "Swiss",
      format: "swiss", status: "active", participantCount: 1, bestOf: 3,
      rankingPolicy: "swiss_v1", qualificationMode: "none",
      seedingPolicy: "original_seed", version: 1,
      createdAt: "2026-09-01T00:00:00.000Z",
    }],
    groups: [], stageParticipants: [], matches: [],
    resultHistory: [], actionLog: [],
  };
}
function strict(): Record<string, any> {
  const modern = v3();
  modern.strictPolicy = {
    profile: "web005.backup-v3.strict.v1", version: 1,
    matchStateRevisions: [], actionOrder: [], completionActions: [],
  };
  return modern;
}
function status(value: unknown, expected: string): void {
  const result = preflightBackupV3Profile(value);
  assert.equal(result.status, expected, JSON.stringify(result));
  assert.equal(result.authenticated, false);
  assert.equal(result.capabilities.historicalUndo, false);
  assert.equal(result.capabilities.historicalRevert, false);
  assert.equal(result.capabilities.historicalCasReplay, false);
  assert.equal(result.capabilities.importAuthorized, false);
}

test("AD-P14 historical V2 has positive structure, remains unauthenticated and capability restricted", () => {
  status(v2(), "LEGACY_COMPAT_UNATTESTED");
  status(JSON.stringify(v2()), "LEGACY_COMPAT_UNATTESTED");
  assert.equal(preflightBackupV3Profile(v2()).schemaVersion, 2);
});
test("AD-P13 historical V3 optional phases absent, empty history/actions and null payload accepted only as shape", () => {
  const old = v3();
  old.actionLog = [{
    actionType: "match_result_submitted", description: "Old",
    stageBackupId: 2, matchBackupId: null, canUndo: false,
    undoPayload: null, isUndone: true, createdAt: old.exportedAt,
  }];
  status(old, "LEGACY_COMPAT_UNATTESTED");
  status(v3(), "LEGACY_COMPAT_UNATTESTED");
  assert.equal(preflightBackupV3Profile(old).schemaVersion, 3);
});
test("AD-N01 marker-bearing strict remains authentication-required, even if caller supplies trusted=true", () => {
  status(strict(), "STRICT_AUTH_REQUIRED");
  const spoof = strict();
  spoof.trusted = true;
  status(spoof, "REJECT");
  const nestedSpoof = strict();
  nestedSpoof.strictPolicy.trusted = true;
  status(nestedSpoof, "REJECT");
});
test("AD-N02 missing marker plus leftover modern-only sidecars is rejected, not legacy", () => {
  const modern = strict();
  delete modern.strictPolicy;
  modern.matchStateRevisions = [{ matchBackupId: 1, stateRevision: 8 }];
  status(modern, "REJECT");
  const markerStripped = strict();
  markerStripped.matches = [{ backupId: 3, status: "pending", stateRevision: 10 }];
  delete markerStripped.strictPolicy;
  status(markerStripped, "REJECT");
});
test("AD-N03 fully erased strict metadata, byte-identical to historical shape, has NO authenticity or authority", () => {
  const stripped = strict();
  delete stripped.strictPolicy;
  status(stripped, "LEGACY_COMPAT_UNATTESTED");
  assert.equal(preflightBackupV3Profile(stripped).reason, "POSITIVE_HISTORICAL_SHAPE_ONLY");
});
test("AD-N04 forged, unknown or partial strict profile cannot fall through to legacy", () => {
  for (const mutation of [
    (x: any) => { x.strictPolicy.profile = "evil.strict.1"; },
    (x: any) => { x.strictPolicy.version = 2; },
    (x: any) => { x.strictPolicy.producer = "unrecognized-vendor"; },
    (x: any) => { delete x.strictPolicy.profile; },
    (x: any) => { delete x.strictPolicy.matchStateRevisions; },
    (x: any) => { x.strictPolicy.actionOrder = null; },
    (x: any) => { x.strictPolicy.signature = "forged-client-proof"; },
  ]) {
    const x = strict(); mutation(x);
    status(x, "REJECT");
  }
});
test("AD-N06 inconsistent V2/V3 version and mixed envelopes fail closed", () => {
  const v2hybrid = v2(); v2hybrid.stages = v3().stages;
  status(v2hybrid, "REJECT");
  const modernV2 = strict(); modernV2.schemaVersion = 2;
  status(modernV2, "REJECT");
  const v3hybrid = v3(); v3hybrid.tournament.defaultBestOf = 3;
  v3hybrid.tournament.format = "swiss";
  status(v3hybrid, "REJECT");
  const absentPhase = v3(); delete absentPhase.stageParticipants;
  status(absentPhase, "REJECT");
});
test("AD-N06 critical versions and shape spoofing fail closed", () => {
  for (const mutation of [
    (x: any) => { x.schemaVersion = 99; },
    (x: any) => { x.schemaVersion = "3"; },
    (x: any) => { x.resultModelVersion = "series_v2"; },
    (x: any) => { x.rankingPolicy = "match_record_v2"; },
    (x: any) => { x.exportedAt = "not a timestamp"; },
    (x: any) => { x.tournament = {}; },
    (x: any) => { x.players = "not a list"; },
    (x: any) => { x.stages = []; },
    (x: any) => { x.actionLog = [{}]; },
  ]) {
    const x = v3(); mutation(x); status(x, "REJECT");
  }
});
test("AD-N02 nested modern-only critical field on historical action is not a legacy extension", () => {
  const x = v3();
  x.actionLog = [{
    actionType: "match_started", description: "a", stageBackupId: 2,
    matchBackupId: null, canUndo: false, undoPayload: null,
    isUndone: false, createdAt: x.exportedAt,
    portableActionId: "strict-token",
  }];
  status(x, "REJECT");
});
test("AD-N04 client-provided trust, issuer, signature and capability cannot grant authority", () => {
  for (const key of ["trusted", "issuer", "signature", "capabilities", "strictProfile"]) {
    const x = v3();
    x[key] = key === "trusted" ? true : "client asserted";
    status(x, "REJECT");
  }
});
test("AD-N16 raw JSON duplicate object members are rejected BEFORE JSON.parse erases their ambiguity", () => {
  const text = JSON.stringify(v3()).replace('"schemaVersion":3', '"schemaVersion":2,"schemaVersion":3');
  status(text, "REJECT");
  assert.equal(preflightBackupV3Profile(text).reason, "DUPLICATE_JSON_KEY");
});
test("AD-N16 raw JSON grammar errors and root arrays are rejected", () => {
  status('{"schemaVersion":3,', "REJECT");
  status("[]", "REJECT");
  status(null, "REJECT");
});
test("AD-N16 limits block oversized raw input and deep structures, including JS-object inputs", () => {
  status(" ".repeat(PROFILE_GATE_LIMITS.maxJsonChars + 1), "REJECT");
  const deep = v3(); let cursor: any = deep;
  for (let i = 0; i < PROFILE_GATE_LIMITS.maxDepth + 4; i++) {
    cursor.unrelated = {}; cursor = cursor.unrelated;
  }
  status(deep, "REJECT");
  const hugeArray = v3(); hugeArray.players = Array(PROFILE_GATE_LIMITS.maxArrayItems + 1).fill(null);
  status(hugeArray, "REJECT");
  const cycle: any = v3(); cycle.self = cycle;
  status(cycle, "REJECT");
});
test("AD-N16 malformed marker and unknown opaque historical field behavior is bounded/fail-closed", () => {
  const backup = v3();
  backup.strictPolicy = null;
  status(backup, "REJECT");
  const legacy = v3();
  legacy.actionLog = [{
    actionType: "match_started", description: "old", stageBackupId: null,
    matchBackupId: null, canUndo: false, isUndone: false,
    undoPayload: { unknownDiagnostic: 123456 }, createdAt: legacy.exportedAt,
  }];
  status(legacy, "LEGACY_COMPAT_UNATTESTED");
});
