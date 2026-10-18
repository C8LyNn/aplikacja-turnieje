import assert from "node:assert/strict";
import test from "node:test";
import {
  ActionLocalProvenanceError,
  validateBackupV3ActionLocalProvenance,
} from "../src/application/backups/backup-v3-action-provenance";

type Action = {
  actionType: string; stageBackupId: number | null; matchBackupId: number | null;
  canUndo: boolean; isUndone: boolean; createdAt: string;
  undoPayload: Record<string, unknown> | null;
};
type Data = ReturnType<typeof fixture>;
const at = "2026-10-15T10:00:00.000Z";
function fixture() {
  return {
    schemaVersion: 3,
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    tournament: { name: "Fixture", status: "active" },
    players: [{ backupId: 11 }, { backupId: 12 }, { backupId: 13 }, { backupId: 14 }],
    stages: [
      { backupId: 3, format: "swiss" },
      { backupId: 4, format: "round_robin" },
    ],
    stageParticipants: [
      { stageBackupId: 3, playerBackupId: 11 },
      { stageBackupId: 3, playerBackupId: 12 },
      { stageBackupId: 4, playerBackupId: 13 },
      { stageBackupId: 4, playerBackupId: 14 },
    ],
    matches: [{
      backupId: 21, stageBackupId: 3, round: 1, matchNumber: 1,
      player1BackupId: 11, player2BackupId: 12,
      status: "completed", resultType: "played", resultReason: null,
      score1: 2, score2: 0, bestOf: 3, winnerBackupId: 11,
      completedAt: at,
    }, {
      backupId: 22, stageBackupId: 4, round: 1, matchNumber: 1,
      player1BackupId: 13, player2BackupId: 14,
      status: "pending", resultType: null, resultReason: null,
      score1: null, score2: null, bestOf: 3, winnerBackupId: null,
      completedAt: null,
    }],
    resultHistory: [{
      matchBackupId: 21, stageBackupId: 3, revision: 1,
      round: 1, matchNumber: 1,
      player1BackupId: 11, player2BackupId: 12,
      score1: 2, score2: 0, bestOf: 3, winnerBackupId: 11,
      resultType: "played", resultReason: null, completedAt: at,
    }],
    actionLog: [{
      actionType: "match_result_submitted", stageBackupId: 3,
      matchBackupId: 21, canUndo: true, isUndone: false,
      createdAt: at,
      undoPayload: { type: "revert_match", matchId: 21 },
    }] as Action[],
    strictPolicy: {
      profile: "web005.backup-v3.strict.v1", version: 1,
      matchStateRevisions: [
        { matchBackupId: 21, stateRevision: 8 },
        { matchBackupId: 22, stateRevision: 1 },
      ],
      actionOrder: [{ sourceActionIndex: 0, portableActionId: "portable-0", ordinal: 1 }],
      completionActions: [{
        sourceActionIndex: 0, matchBackupId: 21, historyRevision: 1, active: true,
      }],
    },
  };
}
function valid(value: unknown): void {
  assert.doesNotThrow(() => validateBackupV3ActionLocalProvenance(value));
  assert.equal(validateBackupV3ActionLocalProvenance(value), undefined, "validator never grants authority");
}
function invalid(value: unknown, expectedCode?: string): void {
  assert.throws(
    () => validateBackupV3ActionLocalProvenance(value),
    (error: unknown) => error instanceof ActionLocalProvenanceError &&
      error.code === "INVALID_BACKUP_V3" &&
      error.issues.length > 0 &&
      (!expectedCode || error.issues.some(issue => issue.code === expectedCode)),
  );
}
function addAction(b: Data, action: Data["actionLog"][number], id: string): void {
  b.actionLog.push(action);
  b.strictPolicy.actionOrder.push({
    sourceActionIndex: b.actionLog.length - 1, portableActionId: id,
    ordinal: b.actionLog.length,
  });
}
function clone(b: Data): Data { return structuredClone(b); }

test("AP01 valid played, match state revision distinct from history revision, no authority returned", () => {
  const b = fixture(); valid(b);
  assert.notEqual(b.strictPolicy.matchStateRevisions[0].stateRevision, b.resultHistory[0].revision);
});
test("AP02 walkover with no scores and participating winner has manual completion", () => {
  const b = fixture();
  Object.assign(b.matches[0], { resultType: "walkover", score1: null, score2: null, winnerBackupId: 12, resultReason: "forfeit" });
  Object.assign(b.resultHistory[0], { resultType: "walkover", score1: null, score2: null, winnerBackupId: 12, resultReason: "forfeit" });
  valid(b);
});
test("AP03 no_contest permitted in Swiss/RR, forbidden in SE/DE", () => {
  for (const format of ["swiss", "round_robin"]) {
    const b = fixture();
    b.stages[0].format = format;
    Object.assign(b.matches[0], { resultType: "no_contest", score1: null, score2: null, winnerBackupId: null, resultReason: "void" });
    Object.assign(b.resultHistory[0], { resultType: "no_contest", score1: null, score2: null, winnerBackupId: null, resultReason: "void" });
    valid(b);
    b.stages[0].format = "single_elimination";
    invalid(b, "RESULT_SHAPE");
  }
});
test("P23-01 AP04 actual completed system BYE needs history and system action, not a manual completion", () => {
  const b = fixture();
  Object.assign(b.matches[0], {
    player2BackupId: null, winnerBackupId: 11, score1: null, score2: null,
    resultType: "bye", resultReason: "system_bye",
  });
  Object.assign(b.resultHistory[0], {
    player2BackupId: null, winnerBackupId: 11, score1: null, score2: null,
    resultType: "bye", resultReason: "system_bye",
  });
  Object.assign(b.actionLog[0], {
    actionType: "system_bye_assigned", undoPayload: null, canUndo: false, isUndone: false,
  });
  b.strictPolicy.completionActions = [];
  valid(b);
  for (const mutate of [
    (v: Data) => { v.actionLog[0].actionType = "match_result_submitted"; },
    (v: Data) => { v.actionLog[0].canUndo = true; },
    (v: Data) => { v.actionLog[0].undoPayload = { type: "revert_match", matchId: 21 }; },
    (v: Data) => { v.actionLog[0].stageBackupId = 4; },
    (v: Data) => { v.actionLog[0].matchBackupId = 22; },
    (v: Data) => { v.resultHistory = []; },
    (v: Data) => { v.actionLog[0].isUndone = true; },
  ]) { const copy = clone(b); mutate(copy); invalid(copy); }
  addAction(b, clone(fixture()).actionLog[0], "fake-manual");
  invalid(b, "COMPLETION_PROVENANCE");
});
test("AP06 action-local match A vs valid exported match B must fail, not only set membership", () => {
  const b = fixture();
  b.actionLog[0].undoPayload = { type: "revert_match", matchId: 22 };
  invalid(b, "ACTION_LOCAL_MATCH");
});
test("AP07 wrong-stage participant and wrong-stage action fail", () => {
  const b = fixture(); b.matches[0].player1BackupId = 13; invalid(b, "STAGE_MEMBERSHIP");
  const c = fixture(); c.actionLog[0].stageBackupId = 4; invalid(c, "ACTION_STAGE");
  const d = fixture(); d.resultHistory[0].stageBackupId = 4; invalid(d, "HISTORY_CONTEXT");
});
test("AP08 featured previous match may be distinct and in another stage of same tournament", () => {
  const b = fixture();
  addAction(b, {
    actionType: "match_featured", stageBackupId: null,
    matchBackupId: 21, canUndo: true, isUndone: false, createdAt: at,
    undoPayload: { type: "restore_featured", prevFeaturedMatchId: 22 },
  }, "featured");
  valid(b);
  b.actionLog[1].undoPayload = { type: "restore_featured", prevFeaturedMatchId: null };
  valid(b);
  b.actionLog[1].actionType = "match_unfeatured";
  b.actionLog[1].matchBackupId = null;
  valid(b);
});
test("AP09 previous featured ID foreign/unmapped and invalid nested reference rejected", () => {
  for (const v of [9999, "22", [22], { matchId: 22 }]) {
    const b = fixture();
    addAction(b, {
      actionType: "match_featured", stageBackupId: null,
      matchBackupId: 21, canUndo: true, isUndone: false, createdAt: at,
      undoPayload: { type: "restore_featured", prevFeaturedMatchId: v },
    }, "featured");
    invalid(b);
  }
});
test("AP10 recognized scalar key cannot be array/string/object even when every ID exists", () => {
  for (const value of [[21], "21", { nested: 21 }, null]) {
    const b = fixture();
    b.actionLog[0].undoPayload = { type: "revert_match", matchId: value };
    invalid(b, "ACTION_LOCAL_MATCH");
  }
});
test("AP11 complete → revert → recomplete: immutable history, prior action undone, newer active", () => {
  const b = fixture();
  const old = { ...b.actionLog[0], isUndone: true, canUndo: false, undoPayload: { type: "revert_match", matchId: 21 } };
  b.actionLog[0] = old;
  b.resultHistory.push({ ...b.resultHistory[0], revision: 2, winnerBackupId: 12, score1: 1, score2: 2 });
  Object.assign(b.matches[0], { winnerBackupId: 12, score1: 1, score2: 2 });
  addAction(b, { ...old, isUndone: false, canUndo: true }, "recompleted");
  b.strictPolicy.completionActions[0].active = false;
  b.strictPolicy.completionActions.push({
    sourceActionIndex: 1, matchBackupId: 21, historyRevision: 2, active: true,
  });
  valid(b);
  b.actionLog[1].isUndone = true;
  b.actionLog[1].canUndo = false;
  b.strictPolicy.completionActions[1].active = false;
  Object.assign(b.matches[0], {
    status: "pending", resultType: null, score1: null, score2: null,
    winnerBackupId: null, completedAt: null,
  });
  valid(b);
});
test("AP12 same timestamp portable order required; duplicate ordinal/id and out-of-range source index reject", () => {
  const b = fixture();
  addAction(b, {
    actionType: "stage_completed", matchBackupId: null, stageBackupId: 3,
    canUndo: false, isUndone: false, undoPayload: null, createdAt: at,
  }, "audit");
  valid(b);
  b.strictPolicy.actionOrder[1].ordinal = 1; invalid(b, "ACTION_ORDER");
  b.strictPolicy.actionOrder[1].ordinal = 2;
  b.strictPolicy.actionOrder[1].portableActionId = "portable-0"; invalid(b, "ACTION_ORDER");
  b.strictPolicy.actionOrder[1].portableActionId = "audit";
  b.strictPolicy.actionOrder[1].sourceActionIndex = 100; invalid(b, "ACTION_ORDER");
});
test("AP13 generic status Undo audit must not be inferred as a manual completion", () => {
  const b = fixture();
  addAction(b, {
    actionType: "match_result_reverted", matchBackupId: 22, stageBackupId: 4,
    canUndo: false, isUndone: false, undoPayload: null, createdAt: at,
  }, "generic-undo-audit");
  valid(b);
  b.actionLog[1].undoPayload = { type: "revert_match", matchId: 22 };
  invalid(b, "ACTION_TYPE");
});
test("AP14 stage or player ID globally present but wrong action scope fails", () => {
  const b = fixture();
  addAction(b, {
    actionType: "match_players_swapped", matchBackupId: 21, stageBackupId: 3,
    canUndo: true, isUndone: false, createdAt: at,
    undoPayload: { type: "restore_players_swap", matchId: 21, player1Id: 13, player2Id: 12 },
  }, "swap");
  invalid(b, "STAGE_MEMBERSHIP");
});
test("AP15 historical undone manual completion may remain while current match pending", () => {
  const b = fixture();
  b.actionLog[0].isUndone = true;
  b.actionLog[0].canUndo = false;
  b.strictPolicy.completionActions[0].active = false;
  Object.assign(b.matches[0], { status: "pending", resultType: null, score1: null, score2: null, winnerBackupId: null, completedAt: null });
  valid(b);
});
test("AP16 unknown undoable action, mismatched type or source action ID authority rejected", () => {
  const b = fixture();
  b.actionLog[0].undoPayload = { type: "restore_status", matchId: 21, prevStatus: "pending" };
  invalid(b, "ACTION_TYPE");
  const c = fixture();
  (c.actionLog[0] as unknown as Record<string, unknown>).id = 777;
  invalid(c, "SOURCE_AUTHORITY");
  const d = fixture();
  addAction(d, { actionType: "undocumented_write", matchBackupId: 21, stageBackupId: 3,
    canUndo: true, isUndone: false, createdAt: at, undoPayload: { type: "revert_match", matchId: 21 } }, "unsafe");
  invalid(d, "ACTION_TYPE");
});
test("AP17 incomplete completion identity, forged revision and duplicate active actions rejected", () => {
  const b = fixture();
  b.strictPolicy.completionActions[0].historyRevision = 9; invalid(b, "COMPLETION_PROVENANCE");
  const c = fixture(); c.strictPolicy.completionActions = []; invalid(c, "COMPLETION_PROVENANCE");
  const d = fixture(); d.strictPolicy.completionActions[0].active = false; invalid(d, "COMPLETION_PROVENANCE");
});
test("AP18 match state CAS token is validated but NEVER returned as clone authority", () => {
  const b = fixture(); valid(b);
  b.strictPolicy.matchStateRevisions[0].stateRevision = 0;
  invalid(b, "MATCH_STATE_REVISION");
  const c = fixture(); (c.strictPolicy as unknown as Record<string, unknown>).expectedCompletionActionId = 17;
  invalid(c, "SOURCE_AUTHORITY");
});
test("AP19 result history parity, negative scores, invalid series winner and BYE manual impersonation", () => {
  const b = fixture(); Object.assign(b.resultHistory[0], { winnerBackupId: 12, score1: 1, score2: 2 }); invalid(b, "HISTORY_PARITY");
  const c = fixture(); c.matches[0].score1 = -1; invalid(c, "RESULT_SHAPE");
  const d = fixture(); d.matches[0].winnerBackupId = 12; d.resultHistory[0].winnerBackupId = 12; invalid(d, "RESULT_SHAPE");
  const e = fixture(); Object.assign(e.matches[0], { resultType: "bye", player2BackupId: null, score1: null, score2: null, resultReason: "system_bye" });
  Object.assign(e.resultHistory[0], { resultType: "bye", player2BackupId: null, score1: null, score2: null, resultReason: "system_bye" });
  invalid(e, "COMPLETION_PROVENANCE");
});

test("DF01 nested source action and CAS-looking keys are rejected from a valid match Undo", () => {
  for (const key of [
    "expectedCompletionActionId", "expectedMatchRevision",
    "expectedRevision", "sourceActionId", "actionId",
    "sourceCas", "casToken", "portableActionId",
    "sourceActionIndex", "stateRevision",
  ]) {
    const b = fixture();
    b.actionLog[0].undoPayload = {
      type: "revert_match", matchId: 21,
      diagnostic: { nested: { [key]: 777 } },
    };
    invalid(b, "SOURCE_AUTHORITY");
  }
});

test("DF02 operational payload arrays reject disguised tokens but keep opaque diagnostics", () => {
  const clean = fixture();
  clean.actionLog[0].undoPayload = {
    type: "revert_match", matchId: 21,
    diagnostic: [{ counter: 99999 }, { label: "scrim", value: 4 }],
  };
  valid(clean);

  const poisoned = fixture();
  poisoned.actionLog[0].undoPayload = {
    type: "revert_match", matchId: 21,
    diagnostic: [{ counter: 99999 }, { sourceActionIndex: 0 }],
  };
  invalid(poisoned, "SOURCE_AUTHORITY");
});

test("DF03 valid cross-stage prevFeaturedMatchId survives; nested foreign authority does not", () => {
  const validFeature = fixture();
  addAction(validFeature, {
    actionType: "match_featured", matchBackupId: 21, stageBackupId: null,
    canUndo: true, isUndone: false, createdAt: at,
    undoPayload: { type: "restore_featured", prevFeaturedMatchId: 22 },
  }, "featured-safe");
  valid(validFeature);

  validFeature.actionLog[1].undoPayload = {
    type: "restore_featured", prevFeaturedMatchId: 22,
    before: { casToken: "external-source-token" },
  };
  invalid(validFeature, "SOURCE_AUTHORITY");
});
