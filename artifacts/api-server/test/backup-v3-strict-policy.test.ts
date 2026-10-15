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
    undoPayload: { matchId: 21, winnerId: 11, nested: { player1Id: 11 } }, isUndone: false,
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
  } as typeof lawful.actionLog[0]["undoPayload"]["nested"];
  assert.doesNotThrow(() => validateStrictBackupV3Policy(lawful));
  for (const p of [
    { matchId: 9999 }, { nested: { winnerId: 9999 } },
    { playerId: "11" }, { list: [{ prevFeaturedMatchId: 10000 }] },
  ]) {
    const copy = modernSpecimen();
    copy.actionLog[0].undoPayload = p as unknown as typeof copy.actionLog[0]["undoPayload"];
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


/**
 * P23-01: The REAL Swiss startup and next-round writer completes a system BYE,
 * inserts matching resultHistory and writes system_bye_assigned (never a
 * phantom match_result_submitted, undo token or active manual completion).
 */
function systemByeSpecimen() {
  const base = modernSpecimen();
  return {
    ...base,
    matches: [{
      ...base.matches[0],
      player2BackupId: null as number | null,
      winnerBackupId: 11,
      score1: null as number | null,
      score2: null as number | null,
      resultType: "bye",
      resultReason: "system_bye",
    }],
    resultHistory: [{
      ...base.resultHistory[0],
      revision: 1,
      player2BackupId: null as number | null,
      winnerBackupId: 11,
      score1: null as number | null,
      score2: null as number | null,
      resultType: "bye",
      resultReason: "system_bye",
    }],
    actionLog: [{
      ...base.actionLog[0],
      actionType: "system_bye_assigned",
      canUndo: false,
      undoPayload: null as Record<string, unknown> | null,
      isUndone: false,
    }],
    strictPolicy: {
      ...base.strictPolicy,
      matchStateRevisions: [{ matchBackupId: 21, stateRevision: 1 }],
      completionActions: [],
    },
  };
}

test("P23-01 legal system BYE: actual Swiss history and non-undoable action are accepted", () => {
  const bye = systemByeSpecimen();
  assert.equal(bye.matches[0].status, "completed");
  assert.equal(bye.matches[0].resultType, "bye");
  assert.equal(bye.matches[0].resultReason, "system_bye");
  assert.equal(bye.matches[0].player2BackupId, null);
  assert.equal(bye.actionLog[0].actionType, "system_bye_assigned");
  assert.equal(bye.actionLog[0].undoPayload, null);
  assert.equal(bye.actionLog[0].canUndo, false);
  assert.equal(bye.strictPolicy.completionActions.length, 0);
  assert.doesNotThrow(() => validateStrictBackupV3Policy(bye));
});

test("P23-01 legal mixed completed played + system BYE keeps disjoint provenance", () => {
  const played = modernSpecimen();
  const bye = systemByeSpecimen();
  const hybrid = {
    ...played,
    matches: [played.matches[0], {
      ...bye.matches[0], backupId: 22, round: 2,
    }],
    resultHistory: [played.resultHistory[0], {
      ...bye.resultHistory[0], matchBackupId: 22, round: 2,
    }],
    actionLog: [played.actionLog[0], {
      ...bye.actionLog[0], matchBackupId: 22,
    }],
    strictPolicy: {
      ...played.strictPolicy,
      matchStateRevisions: [
        played.strictPolicy.matchStateRevisions[0],
        { matchBackupId: 22, stateRevision: 1 },
      ],
      actionOrder: [
        played.strictPolicy.actionOrder[0],
        { sourceActionIndex: 1, portableActionId: "act-system-bye", ordinal: 2 },
      ],
    },
  };
  assert.doesNotThrow(() => validateStrictBackupV3Policy(hybrid));
  // A system action must never be promoted to a second manual completion.
  hybrid.strictPolicy.completionActions.push({
    sourceActionIndex: 1, matchBackupId: 22, historyRevision: 1, active: true,
  });
  rejectsInvalid(hybrid, "system BYE may not acquire an active manual completion token");
});

test("P23-01 completed system BYE missing/mismatched latest history fails closed", () => {
  const noHistory = systemByeSpecimen();
  noHistory.resultHistory = [];
  rejectsInvalid(noHistory, "system BYE requires genuine history");
  const wrongHistory = systemByeSpecimen();
  wrongHistory.resultHistory[0].winnerBackupId = 12;
  rejectsInvalid(wrongHistory, "system BYE history winner contradiction rejects");
});

test("P23-01 forged system BYE entrants, winner, score and reason are rejected even if history matches", () => {
  for (const mutate of [
    (b: ReturnType<typeof systemByeSpecimen>) => {
      b.matches[0].player2BackupId = 12;
      b.resultHistory[0].player2BackupId = 12;
    },
    (b: ReturnType<typeof systemByeSpecimen>) => {
      b.matches[0].winnerBackupId = 12;
      b.resultHistory[0].winnerBackupId = 12;
    },
    (b: ReturnType<typeof systemByeSpecimen>) => {
      b.matches[0].player1BackupId = 12;
      b.resultHistory[0].player1BackupId = 12;
    },
    (b: ReturnType<typeof systemByeSpecimen>) => {
      b.matches[0].score1 = 1;
      b.resultHistory[0].score1 = 1;
    },
    (b: ReturnType<typeof systemByeSpecimen>) => {
      b.matches[0].resultReason = "other_reason";
      b.resultHistory[0].resultReason = "other_reason";
    },
  ]) {
    const b = systemByeSpecimen();
    mutate(b);
    rejectsInvalid(b, "forged BYE cannot gain a system-completion exception");
  }
});

test("P23-01 forged, missing, stale or undoable system BYE action fails closed", () => {
  for (const mutate of [
    (b: ReturnType<typeof systemByeSpecimen>) => { b.actionLog[0].actionType = "match_result_submitted"; },
    (b: ReturnType<typeof systemByeSpecimen>) => { b.actionLog[0].matchBackupId = 999; },
    (b: ReturnType<typeof systemByeSpecimen>) => { b.actionLog[0].stageBackupId = 77; },
    (b: ReturnType<typeof systemByeSpecimen>) => { b.actionLog[0].canUndo = true; },
    (b: ReturnType<typeof systemByeSpecimen>) => { b.actionLog[0].undoPayload = { matchId: 21 }; },
    (b: ReturnType<typeof systemByeSpecimen>) => { b.actionLog[0].isUndone = true; },
    (b: ReturnType<typeof systemByeSpecimen>) => {
      b.actionLog = [];
      b.strictPolicy.actionOrder = [];
    },
    (b: ReturnType<typeof systemByeSpecimen>) => {
      b.actionLog.push({ ...b.actionLog[0] });
      b.strictPolicy.actionOrder.push({
        sourceActionIndex: 1, portableActionId: "duplicate-system-bye", ordinal: 2,
      });
    },
  ]) {
    const b = systemByeSpecimen();
    mutate(b);
    rejectsInvalid(b, "exactly one valid, non-undoable system BYE action is required");
  }
});

test("P23-01 manual played and non-BYE results may not masquerade as a system BYE", () => {
  const played = modernSpecimen();
  played.actionLog[0].actionType = "system_bye_assigned";
  played.actionLog[0].canUndo = false;
  played.actionLog[0].isUndone = false;
  played.actionLog[0].undoPayload = null as unknown as typeof played.actionLog[0]["undoPayload"];
  played.strictPolicy.completionActions = [];
  rejectsInvalid(played, "manual played result still requires active typed manual completion");

  // No broad 'resultType != played' bypass for NC/walkover.
  for (const resultType of ["walkover", "no_contest"]) {
    const b = systemByeSpecimen();
    b.matches[0].resultType = resultType;
    b.resultHistory[0].resultType = resultType;
    rejectsInvalid(b, "unsupported forged system resolution is not a completed BYE");
  }
});
