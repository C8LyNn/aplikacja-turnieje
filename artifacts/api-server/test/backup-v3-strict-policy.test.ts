import assert from "node:assert/strict";
import test from "node:test";
import {
  BackupV3StrictPolicyError,
  STRICT_BACKUP_V3_PROFILE,
  classifyBackupV3StrictProfile,
  validateStrictBackupV3Policy,
} from "../src/application/backups/backup-v3-strict-policy";

function modernSpecimen() {
  return {
    schemaVersion: 3,
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    exportedAt: "2026-10-14T12:00:00.000Z",
    players: [{ backupId: 11 }, { backupId: 12 }],
    matches: [{
      backupId: 21, stageBackupId: 3, round: 1, matchNumber: 1,
      player1BackupId: 11, player2BackupId: 12, winnerBackupId: 11,
      score1: 2, score2: 0, bestOf: 3, resultType: "played",
      resultReason: null, status: "completed",
      completedAt: "2026-10-14T11:00:00.000Z",
    }],
    resultHistory: [{
      matchBackupId: 21, stageBackupId: 3, revision: 2,
      round: 1, matchNumber: 1, player1BackupId: 11, player2BackupId: 12,
      winnerBackupId: 11, score1: 2, score2: 0, bestOf: 3,
      resultType: "played", resultReason: null,
      completedAt: "2026-10-14T11:00:00.000Z",
      recordedAt: "2026-10-14T11:01:00.000Z",
    }],
    actionLog: [{
      actionType: "match_result_submitted", description: "Synthetic completion",
      stageBackupId: 3, matchBackupId: 21, canUndo: true,
      undoPayload: { matchId: 21, winnerId: 11, nested: { player1Id: 11 } },
      isUndone: false, createdAt: "2026-10-14T11:01:00.000Z",
    }],
    strictPolicy: {
      profile: STRICT_BACKUP_V3_PROFILE, version: 1,
      matchStateRevisions: [{ matchBackupId: 21, stateRevision: 7 }],
      actionOrder: [{ sourceActionIndex: 0, portableActionId: "act-01", ordinal: 1 }],
      completionActions: [{
        sourceActionIndex: 0, matchBackupId: 21, historyRevision: 2, active: true,
      }],
    },
  };
}

function rejectsInvalid(value: unknown, reason: string): void {
  assert.throws(
    () => validateStrictBackupV3Policy(value),
    (err: unknown) =>
      err instanceof BackupV3StrictPolicyError &&
      err.code === "INVALID_BACKUP_V3" &&
      err.issues.length > 0,
    reason,
  );
}

test("B2 MOD positive: strict completed match/history parity and distinct state revision", () => {
  const backup = modernSpecimen();
  assert.equal(classifyBackupV3StrictProfile(backup), "STRICT_MARKED");
  assert.doesNotThrow(() => validateStrictBackupV3Policy(backup));
  assert.notEqual(backup.strictPolicy.matchStateRevisions[0].stateRevision,
    backup.resultHistory[0].revision, "CAS state != historical result sequence is valid");
});

test("B1 / B2 downgrade boundary: absence is UNATTESTED, never a trusted legacy classification", () => {
  const noMarker: Record<string, unknown> = structuredClone(modernSpecimen());
  delete noMarker.strictPolicy;
  assert.equal(classifyBackupV3StrictProfile(noMarker), "UNATTESTED");
  rejectsInvalid(noMarker, "strict entrypoint rejects a stripped strict marker");
  const historic = structuredClone(noMarker);
  historic.resultHistory = [];
  historic.actionLog = [];
  delete historic.routeExecutions;
  assert.equal(classifyBackupV3StrictProfile(historic), "UNATTESTED");
  // This pure strict-only entrypoint MUST NOT be substituted for a V2/legacy importer.
  rejectsInvalid(historic, "legal legacy is outside the new strict-only validator");
  const corrupt = modernSpecimen();
  (corrupt.strictPolicy as { profile: string }).profile = "web005.strict-v3/unknown";
  assert.equal(classifyBackupV3StrictProfile(corrupt), "INVALID_PROFILE");
  rejectsInvalid(corrupt, "mismatched marker fails closed");
});

test("B2 contradictory last history winner, score, timestamp and missing completion reject", () => {
  for (const mutate of [
    (v: ReturnType<typeof modernSpecimen>) => { v.resultHistory[0].winnerBackupId = 12; },
    (v: ReturnType<typeof modernSpecimen>) => { v.resultHistory[0].score1 = 3; },
    (v: ReturnType<typeof modernSpecimen>) => { v.resultHistory[0].completedAt = "2026-10-14T11:00:01.000Z"; },
    (v: ReturnType<typeof modernSpecimen>) => { v.resultHistory = []; },
    (v: ReturnType<typeof modernSpecimen>) => { v.resultHistory[0].resultType = "walkover"; },
  ]) {
    const copy = modernSpecimen();
    mutate(copy);
    rejectsInvalid(copy, "modern contradictions/missing history cannot fall through to legacy");
  }
});

test("B3 every match has one positive portable state revision; history revision is independent", () => {
  for (const mutate of [
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.matchStateRevisions = []; },
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.matchStateRevisions[0].stateRevision = 0; },
    (v: ReturnType<typeof modernSpecimen>) => {
      v.strictPolicy.matchStateRevisions.push({ matchBackupId: 21, stateRevision: 8 });
    },
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.matchStateRevisions[0].matchBackupId = 999; },
  ]) {
    const copy = modernSpecimen();
    mutate(copy);
    rejectsInvalid(copy, "missing, invalid, duplicated or unknown CAS state revision");
  }
});

test("B4 action provenance: portable total order even when timestamps tie", () => {
  const b = modernSpecimen();
  b.actionLog.push({
    actionType: "stage_metadata_changed", description: "Synthetic metadata",
    stageBackupId: 3, matchBackupId: 21, canUndo: false,
    undoPayload: { matchId: 21 }, isUndone: false,
    createdAt: b.actionLog[0].createdAt,
  });
  b.strictPolicy.actionOrder.push({
    sourceActionIndex: 1, portableActionId: "act-02", ordinal: 2,
  });
  assert.doesNotThrow(() => validateStrictBackupV3Policy(b));
  b.strictPolicy.actionOrder[1].ordinal = 1;
  rejectsInvalid(b, "createdAt tie is insufficient for total order");
});

test("B4 completion action link, revision, active identity and Undo provenance reject contradictions", () => {
  for (const mutate of [
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.completionActions = []; },
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.completionActions[0].historyRevision = 100; },
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.completionActions[0].active = false; },
    (v: ReturnType<typeof modernSpecimen>) => { v.actionLog[0].isUndone = true; },
    (v: ReturnType<typeof modernSpecimen>) => { v.actionLog[0].undoPayload = null as unknown as typeof v.actionLog[0]["undoPayload"]; },
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.actionOrder[0].portableActionId = ""; },
    (v: ReturnType<typeof modernSpecimen>) => { v.strictPolicy.completionActions[0].matchBackupId = 1000; },
  ]) {
    const copy = modernSpecimen();
    mutate(copy);
    rejectsInvalid(copy, "source completion and active action must match typed provenance");
  }
});

test("B5 recognized nested foreign, absent or malformed IDs reject; unknown opaque keys are not inferred", () => {
  const lawful = modernSpecimen();
  lawful.actionLog[0].undoPayload.nested = {
    player1Id: 11, diagnosticCounter: 999_999,
  };
  assert.doesNotThrow(() => validateStrictBackupV3Policy(lawful));
  for (const p of [
    { matchId: 9999 }, { nested: { winnerId: 9999 } },
    { playerId: "11" }, { list: [{ prevFeaturedMatchId: 10000 }] },
  ]) {
    const copy = modernSpecimen();
    copy.actionLog[0].undoPayload = p as typeof copy.actionLog[0]["undoPayload"];
    rejectsInvalid(copy, "recognized nested ID cannot silently keep a foreign/original ID");
  }
});

test("B6 typed INVALID_BACKUP_V3 is a pure error, not an HTTP/SQL transaction claim", () => {
  const broken = modernSpecimen();
  broken.strictPolicy.version = 2;
  assert.throws(
    () => validateStrictBackupV3Policy(broken),
    (error: unknown) => error instanceof BackupV3StrictPolicyError &&
      error.code === "INVALID_BACKUP_V3" && error.issues.length > 0,
  );
});
