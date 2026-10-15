/**
 * WEB-005 / T040 R23C — isolated pre-clone action-local provenance validator.
 *
 * Pure, non-mutating, strict V3 only. Requires the full V3 stage/member graph
 * (unlike the smaller projection accepted by PR56's isolated strict core).
 * NO importer/exporter/HTTP/DB wiring. A self-declared strict profile is NOT
 * authentication; success MUST NOT be used as permission to import, undo,
 * direct-revert or transplant match CAS/action identities into a new clone.
 *
 * Read alongside WEB-005_A70_R23A_ACTION_PROVENANCE_CONTRACT.md.
 */
export type ActionLocalProvenanceIssueCode =
  | "PROFILE" | "SHAPE" | "DUPLICATE_ID" | "STAGE_MEMBERSHIP"
  | "RESULT_SHAPE" | "HISTORY_CONTEXT" | "HISTORY_PARITY"
  | "MATCH_STATE_REVISION" | "ACTION_ORDER" | "ACTION_CONTEXT"
  | "ACTION_STAGE" | "ACTION_TYPE" | "ACTION_LOCAL_MATCH"
  | "REFERENCE_UNMAPPED" | "SOURCE_AUTHORITY" | "COMPLETION_PROVENANCE";

export type ActionLocalProvenanceIssue = Readonly<{
  code: ActionLocalProvenanceIssueCode;
  path: string;
  message: string;
}>;

export class ActionLocalProvenanceError extends Error {
  readonly code = "INVALID_BACKUP_V3" as const;
  constructor(readonly issues: readonly ActionLocalProvenanceIssue[]) {
    super("Backup V3 action-local provenance validation failed.");
    this.name = "ActionLocalProvenanceError";
  }
}

type Row = Record<string, unknown>;
const STRICT_PROFILE = "web005.backup-v3.strict.v1";
const STAGE_FORMATS = new Set([
  "single_elimination", "double_elimination", "round_robin",
  "swiss", "group_stage",
]);
const NO_CONTEST_FORMATS = new Set(["round_robin", "swiss", "group_stage"]);
const LIVE_STATUSES = new Set(["pending", "in_progress", "postponed", "cancelled"]);
const RESULT_TYPES = new Set(["played", "walkover", "no_contest", "bye"]);
const ACTION_UNDO_TYPES: Readonly<Record<string, string>> = Object.freeze({
  match_result_submitted: "revert_match",
  match_started: "restore_status",
  match_postponed: "restore_status",
  match_restored: "restore_status",
  match_cancelled: "restore_cancelled_match",
  match_bo_changed: "restore_best_of",
  match_players_swapped: "restore_players_swap",
  match_featured: "restore_featured",
  match_unfeatured: "restore_featured",
  player_added: "delete_player",
  player_edited: "restore_player",
});
const MATCH_TARGET_UNDO = new Set([
  "match_result_submitted", "match_started", "match_postponed",
  "match_restored", "match_cancelled", "match_bo_changed",
  "match_players_swapped",
]);
const AUDIT_ONLY_TYPES = new Set([
  "system_bye_assigned", "match_result_reverted", "player_removed",
  "stage_completed", "stage_started", "tournament_started",
  "tournament_completed",
]);
const PLAYER_REFERENCE_KEYS = new Set(["playerId", "player1Id", "player2Id", "winnerId"]);
const MATCH_REFERENCE_KEYS = new Set(["matchId", "prevFeaturedMatchId"]);
const SOURCE_AUTHORITY_KEYS = new Set([
  "id", "actionId", "sourceActionId", "expectedCompletionActionId",
  "expectedMatchRevision", "expectedRevision", "revision",
  "sourceCas", "casToken",
]);

function fail(code: ActionLocalProvenanceIssueCode, path: string, message: string): never {
  throw new ActionLocalProvenanceError([{ code, path, message }]);
}
function isRow(x: unknown): x is Row {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}
function row(x: unknown, path: string): Row {
  if (!isRow(x)) fail("SHAPE", path, "Expected object.");
  return x;
}
function array(x: unknown, path: string): Row[] {
  if (!Array.isArray(x)) fail("SHAPE", path, "Expected array.");
  if (x.length > 100_000) fail("SHAPE", path, "Excessive number of entries.");
  return x.map((entry, index) => row(entry, path + "[" + index + "]"));
}
function positive(x: unknown): x is number {
  return typeof x === "number" && Number.isSafeInteger(x) && x > 0;
}
function id(x: unknown, path: string): number {
  if (!positive(x)) fail("SHAPE", path, "Expected positive safe integer.");
  return x;
}
function maybeId(x: unknown, path: string): number | null {
  return x == null ? null : id(x, path);
}
function integerScore(x: unknown): x is number {
  return typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
}
function dateValue(x: unknown): number {
  if (typeof x !== "string" || x.length > 64) return NaN;
  return Date.parse(x);
}
function same(a: unknown, b: unknown): boolean { return (a ?? null) === (b ?? null); }
function nullableReason(x: unknown): boolean { return x == null || typeof x === "string"; }
function indexed(
  rows: Row[], name: string,
  key = "backupId",
): Map<number, Row> {
  const m = new Map<number, Row>();
  for (let i = 0; i < rows.length; i++) {
    const keyId = id(rows[i][key], name + "[" + i + "]." + key);
    if (m.has(keyId)) fail("DUPLICATE_ID", name + "[" + i + "]." + key, "Duplicate source ID.");
    m.set(keyId, rows[i]);
  }
  return m;
}
function recognizedRefs(
  payload: Row,
  path: string,
  action: Row,
  match: Row | undefined,
  matches: Map<number, Row>,
  players: Set<number>,
  members: Set<string>,
): void {
  const seen = new WeakSet<object>();
  const visit = (value: unknown, key: string | null, where: string, depth: number): void => {
    if (depth > 32) fail("SHAPE", where, "Undo payload nesting too deep.");
    if (key && (PLAYER_REFERENCE_KEYS.has(key) || MATCH_REFERENCE_KEYS.has(key))) {
      const actionType = action.actionType;
      const allowed =
        key === "prevFeaturedMatchId"
          ? actionType === "match_featured" || actionType === "match_unfeatured"
          : key === "matchId"
            ? MATCH_TARGET_UNDO.has(String(actionType))
            : key === "playerId"
              ? actionType === "player_added" || actionType === "player_edited"
              : key === "player1Id" || key === "player2Id"
                ? actionType === "match_players_swapped"
                : false;
      if (!allowed) {
        fail("ACTION_TYPE", where, "Recognized Undo reference is not part of this action's documented payload.");
      }
      if (value == null && key !== "prevFeaturedMatchId" &&
          key !== "player1Id" && key !== "player2Id" && key !== "winnerId") {
        fail("REFERENCE_UNMAPPED", where, "Nonnullable recognized Undo reference.");
      }
      if (value != null) {
        if (!positive(value)) fail("REFERENCE_UNMAPPED", where, "Recognized ID must be a scalar positive safe integer.");
        if (MATCH_REFERENCE_KEYS.has(key)) {
          const target = matches.get(value);
          if (!target) fail("REFERENCE_UNMAPPED", where, "Match ID is not in source tournament.");
          if (key === "matchId" && (action.matchBackupId !== value || !match)) {
            fail("ACTION_LOCAL_MATCH", where, "Undo match must equal action's own match.");
          }
          // prevFeaturedMatchId: prior match in THIS tournament, NOT the
          // currently featured match or necessarily the same stage.
        } else {
          if (!players.has(value)) fail("REFERENCE_UNMAPPED", where, "Player ID is not in source tournament.");
          if (match && !members.has(String(match.stageBackupId) + ":" + value)) {
            fail("STAGE_MEMBERSHIP", where, "Undo player is not a member of the action match's stage.");
          }
        }
      }
      return; // Do NOT descend arrays/objects under recognized scalar keys.
    }
    if (value == null || typeof value !== "object") return;
    if (seen.has(value)) fail("SHAPE", where, "Cyclic Undo payload is not JSON.");
    seen.add(value);
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) visit(value[i], null, where + "[" + i + "]", depth + 1);
    } else {
      if (!isRow(value)) fail("SHAPE", where, "Unexpected Undo object shape.");
      for (const [childKey, child] of Object.entries(value)) {
        visit(child, childKey, where + "." + childKey, depth + 1);
      }
    }
    seen.delete(value);
  };
  visit(payload, null, path, 0);
}
function resultShape(
  result: Row, format: string, players: Set<number>,
  members: Set<string>, where: string,
): void {
  const stage = id(result.stageBackupId, where + ".stageBackupId");
  const p1 = maybeId(result.player1BackupId, where + ".player1BackupId");
  const p2 = maybeId(result.player2BackupId, where + ".player2BackupId");
  const winner = maybeId(result.winnerBackupId, where + ".winnerBackupId");
  for (const p of [p1, p2, winner]) {
    if (p != null && (!players.has(p) || !members.has(stage + ":" + p))) {
      fail("STAGE_MEMBERSHIP", where, "Match/history player must belong to this stage.");
    }
  }
  const bestOf = id(result.bestOf, where + ".bestOf");
  if (bestOf % 2 !== 1) fail("RESULT_SHAPE", where + ".bestOf", "Best-of must be odd.");
  const kind = result.resultType;
  if (!RESULT_TYPES.has(String(kind))) fail("RESULT_SHAPE", where, "Unsupported completed result kind.");
  const score1 = result.score1, score2 = result.score2;
  if (!nullableReason(result.resultReason) || !Number.isFinite(dateValue(result.completedAt))) {
    fail("RESULT_SHAPE", where, "Invalid result reason or completed timestamp.");
  }
  if (kind === "bye") {
    if (p1 == null || p2 != null || winner !== p1 ||
        score1 != null || score2 != null || result.resultReason !== "system_bye") {
      fail("RESULT_SHAPE", where, "System BYE must have one player, no scores, winner=player1, system_bye reason.");
    }
    return;
  }
  if (p1 == null || p2 == null || p1 === p2) {
    fail("RESULT_SHAPE", where, "Manual completion requires two different stage entrants.");
  }
  if (kind === "played") {
    const threshold = Math.floor(bestOf / 2) + 1;
    if (!integerScore(score1) || !integerScore(score2) ||
        Math.max(score1, score2) !== threshold ||
        Math.min(score1, score2) >= threshold ||
        score1 === score2 || winner !== (score1 > score2 ? p1 : p2) ||
        result.resultReason != null) {
      fail("RESULT_SHAPE", where, "Played series score/winner/bestOf inconsistent.");
    }
  } else if (kind === "walkover") {
    if (score1 != null || score2 != null || (winner !== p1 && winner !== p2)) {
      fail("RESULT_SHAPE", where, "Walkover has no scores and winner is an entrant.");
    }
  } else if (kind === "no_contest") {
    if (!NO_CONTEST_FORMATS.has(format) ||
        score1 != null || score2 != null || winner != null) {
      fail("RESULT_SHAPE", where, "No-contest is only lawful outside SE/DE and has no winner/scores.");
    }
  }
}
function checkAuthorityFields(value: Row, where: string): void {
  for (const key of SOURCE_AUTHORITY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      fail("SOURCE_AUTHORITY", where + "." + key, "Untrusted original action/CAS field is not a clone authority.");
    }
  }
}

/** Throws on a forged/ambiguous STRICT modern source graph. Returns no token. */
export function validateBackupV3ActionLocalProvenance(input: unknown): void {
  const root = row(input, "backup");
  if (root.schemaVersion !== 3 ||
      root.resultModelVersion !== "series_v1" ||
      root.rankingPolicy !== "match_record_v1") {
    fail("PROFILE", "backup", "Requires modern V3 series_v1 strict profile.");
  }
  const policy = row(root.strictPolicy, "strictPolicy");
  if (policy.profile !== STRICT_PROFILE || policy.version !== 1) {
    fail("PROFILE", "strictPolicy", "A strict marker is required but is not proof of producer authentication.");
  }
  checkAuthorityFields(policy, "strictPolicy");
  const players = indexed(array(root.players, "players"), "players");
  const playerIds = new Set(players.keys());
  const stages = indexed(array(root.stages, "stages"), "stages");
  const members = new Set<string>();
  for (const [ix, member] of array(root.stageParticipants, "stageParticipants").entries()) {
    const s = id(member.stageBackupId, "stageParticipants[" + ix + "].stageBackupId");
    const p = id(member.playerBackupId, "stageParticipants[" + ix + "].playerBackupId");
    if (!stages.has(s) || !players.has(p)) {
      fail("STAGE_MEMBERSHIP", "stageParticipants[" + ix + "]", "Stage/member source ID missing.");
    }
    const key = s + ":" + p;
    if (members.has(key)) fail("DUPLICATE_ID", "stageParticipants[" + ix + "]", "Duplicate membership.");
    members.add(key);
  }
  for (const [sid, stage] of stages) {
    if (!STAGE_FORMATS.has(String(stage.format))) {
      fail("SHAPE", "stages." + sid, "Unrecognized stage format.");
    }
  }
  const matches = indexed(array(root.matches, "matches"), "matches");
  for (const [mid, match] of matches) {
    const s = id(match.stageBackupId, "matches." + mid + ".stageBackupId");
    const stage = stages.get(s);
    if (!stage) fail("ACTION_STAGE", "matches." + mid, "Match stage not declared.");
    if (match.status === "completed") {
      resultShape(match, String(stage.format), playerIds, members, "matches." + mid);
    } else {
      if (!LIVE_STATUSES.has(String(match.status)) ||
          match.resultType != null || match.resultReason != null ||
          match.score1 != null || match.score2 != null ||
          match.winnerBackupId != null || match.completedAt != null) {
        fail("RESULT_SHAPE", "matches." + mid, "Noncompleted match carries illegal result.");
      }
      for (const key of ["player1BackupId", "player2BackupId"] as const) {
        const p = maybeId(match[key], "matches." + mid + "." + key);
        if (p != null && !members.has(s + ":" + p)) {
          fail("STAGE_MEMBERSHIP", "matches." + mid, "Noncompleted match entrant in wrong stage.");
        }
      }
    }
  }
  const history = array(root.resultHistory, "resultHistory");
  const historyIndex = new Map<string, Row>();
  const lastHistory = new Map<number, Row>();
  for (const [ix, h] of history.entries()) {
    const mid = id(h.matchBackupId, "resultHistory[" + ix + "].matchBackupId");
    const match = matches.get(mid);
    if (!match || h.stageBackupId !== match.stageBackupId ||
        h.round !== match.round || h.matchNumber !== match.matchNumber) {
      fail("HISTORY_CONTEXT", "resultHistory[" + ix + "]", "Historical event belongs to another match/stage/round.");
    }
    const rev = id(h.revision, "resultHistory[" + ix + "].revision");
    const key = mid + ":" + rev;
    if (historyIndex.has(key)) fail("DUPLICATE_ID", "resultHistory[" + ix + "]", "Duplicate historical sequence.");
    const stage = stages.get(id(h.stageBackupId, "resultHistory.stageBackupId"))!;
    resultShape(h, String(stage.format), playerIds, members, "resultHistory[" + ix + "]");
    historyIndex.set(key, h);
    const older = lastHistory.get(mid);
    if (!older || Number(older.revision) < rev) lastHistory.set(mid, h);
  }
  const parityFields = [
    "stageBackupId", "round", "matchNumber", "player1BackupId",
    "player2BackupId", "score1", "score2", "bestOf",
    "winnerBackupId", "resultType", "resultReason",
  ];
  for (const [mid, match] of matches) {
    if (match.status !== "completed") continue;
    const h = lastHistory.get(mid);
    if (!h) fail("HISTORY_PARITY", "matches." + mid, "Completed match lacks history.");
    for (const field of parityFields) {
      if (!same(match[field], h[field])) {
        fail("HISTORY_PARITY", "matches." + mid + "." + field, "Latest historical result differs from current match.");
      }
    }
    if (dateValue(match.completedAt) !== dateValue(h.completedAt)) {
      fail("HISTORY_PARITY", "matches." + mid + ".completedAt", "Latest historical time differs.");
    }
  }
  const revisionStates = array(policy.matchStateRevisions, "strictPolicy.matchStateRevisions");
  const revisionSeen = new Set<number>();
  for (const [i, state] of revisionStates.entries()) {
    const mid = state.matchBackupId;
    if (!positive(mid) || !matches.has(mid) || !positive(state.stateRevision) ||
        revisionSeen.has(mid)) {
      fail("MATCH_STATE_REVISION", "strictPolicy.matchStateRevisions[" + i + "]", "Portable state revision missing/duplicate/invalid.");
    }
    revisionSeen.add(mid);
  }
  if (revisionSeen.size !== matches.size || revisionStates.length !== matches.size) {
    fail("MATCH_STATE_REVISION", "strictPolicy.matchStateRevisions", "Each match requires exactly one portable state revision.");
  }

  const actions = array(root.actionLog, "actionLog");
  const ordering = array(policy.actionOrder, "strictPolicy.actionOrder");
  const seenIdx = new Set<number>(), seenOrdinal = new Set<number>();
  const seenPortable = new Set<string>();
  const indexToOrdinal = new Map<number, number>();
  for (const [i, ord] of ordering.entries()) {
    const ix = ord.sourceActionIndex;
    const n = ord.ordinal;
    if (typeof ix !== "number" || !Number.isSafeInteger(ix) || ix < 0 ||
        ix >= actions.length || seenIdx.has(ix) || !positive(n) || n > actions.length ||
        seenOrdinal.has(n) || typeof ord.portableActionId !== "string" ||
        ord.portableActionId.trim() === "" || seenPortable.has(ord.portableActionId)) {
      fail("ACTION_ORDER", "strictPolicy.actionOrder[" + i + "]", "Nonunique/incomplete portable LIFO order.");
    }
    checkAuthorityFields(ord, "strictPolicy.actionOrder[" + i + "]");
    seenIdx.add(ix); seenOrdinal.add(n);
    seenPortable.add(ord.portableActionId);
    indexToOrdinal.set(ix, n);
  }
  if (ordering.length !== actions.length ||
      seenIdx.size !== actions.length || seenOrdinal.size !== actions.length) {
    fail("ACTION_ORDER", "strictPolicy.actionOrder", "Every exported action requires a contiguous total-order slot.");
  }
  let previousTime = -Infinity;
  for (const [ix] of [...indexToOrdinal].sort((a, b) => a[1] - b[1])) {
    const now = dateValue(actions[ix].createdAt);
    if (!Number.isFinite(now) || now < previousTime) {
      fail("ACTION_ORDER", "actionLog[" + ix + "]", "Action order contradicts chronological timestamps.");
    }
    previousTime = now;
  }

  const manualActions = new Set<number>();
  const systemByes = new Map<number, number>();
  for (const [i, action] of actions.entries()) {
    const where = "actionLog[" + i + "]";
    checkAuthorityFields(action, where);
    if (typeof action.actionType !== "string" ||
        typeof action.canUndo !== "boolean" || typeof action.isUndone !== "boolean") {
      fail("ACTION_TYPE", where, "Malformed action type or Undo flags.");
    }
    const actionType = action.actionType;
    const sid = maybeId(action.stageBackupId, where + ".stageBackupId");
    const mid = maybeId(action.matchBackupId, where + ".matchBackupId");
    const match = mid != null ? matches.get(mid) : undefined;
    if ((sid != null && !stages.has(sid)) ||
        (mid != null && !match)) {
      fail("ACTION_CONTEXT", where, "Referenced stage/match outside export.");
    }
    if (match && sid != null && sid !== match.stageBackupId) {
      fail("ACTION_STAGE", where, "Action's stage does not own its match.");
    }
    const undoType = ACTION_UNDO_TYPES[actionType];
    if (undoType === undefined) {
      if (action.undoPayload != null || action.canUndo || action.isUndone) {
        fail("ACTION_TYPE", where, "Unknown or audit-only action must never be executable Undo.");
      }
      // Unknown audit-only actions are accepted strictly as inert data, without
      // declaring their unrecognized actionType to be a supported write command.
      if (actionType === "system_bye_assigned") {
        if (!match || mid == null || sid !== match.stageBackupId ||
            match.status !== "completed" || match.resultType !== "bye") {
          fail("COMPLETION_PROVENANCE", where, "System BYE action must target completed BYE in same stage.");
        }
        systemByes.set(mid, (systemByes.get(mid) ?? 0) + 1);
      }
      continue;
    }
    if (!isRow(action.undoPayload)) {
      fail("ACTION_TYPE", where, "Recognized Undo action requires a typed Undo object.");
    }
    const payload = action.undoPayload;
    if (payload.type !== undoType) {
      fail("ACTION_TYPE", where + ".undoPayload.type", "Payload type does not match source action type.");
    }
    const expectedCanUndo = action.isUndone === false;
    if (action.canUndo !== expectedCanUndo) {
      fail("ACTION_TYPE", where, "Action canUndo disagrees with isUndone and payload.");
    }
    if (MATCH_TARGET_UNDO.has(actionType)) {
      if (!match || !positive(mid)) {
        fail("ACTION_LOCAL_MATCH", where, "Undo action requires its declared match.");
      }
      if (payload.matchId !== mid) {
        fail("ACTION_LOCAL_MATCH", where + ".undoPayload.matchId", "Undo target is not the source action match.");
      }
    }
    if (actionType === "match_result_submitted") {
      if (!match || !positive(mid) ||
          (match.status === "completed" && match.resultType === "bye")) {
        fail("COMPLETION_PROVENANCE", where, "Manual completion cannot impersonate a system BYE.");
      }
      if (sid !== match.stageBackupId) {
        fail("ACTION_STAGE", where, "Manual completion must carry exact stage.");
      }
      manualActions.add(i);
    } else if (actionType === "match_featured") {
      if (!match || mid == null) fail("ACTION_LOCAL_MATCH", where, "Featured action requires newly featured match.");
      if (!Object.prototype.hasOwnProperty.call(payload, "prevFeaturedMatchId")) {
        fail("ACTION_TYPE", where, "Featured Undo requires prior pointer (nullable).");
      }
    } else if (actionType === "match_unfeatured") {
      if (mid !== null) fail("ACTION_LOCAL_MATCH", where, "Unfeatured action has null new featured match.");
      if (!Object.prototype.hasOwnProperty.call(payload, "prevFeaturedMatchId")) {
        fail("ACTION_TYPE", where, "Unfeatured Undo requires prior pointer (nullable).");
      }
    } else if (actionType === "match_players_swapped") {
      if (!match || !positive(mid)) fail("ACTION_LOCAL_MATCH", where, "Swap must have target match.");
      const p1 = maybeId(payload.player1Id, where + ".undoPayload.player1Id");
      const p2 = maybeId(payload.player2Id, where + ".undoPayload.player2Id");
      if (p1 != null && p1 === p2) fail("STAGE_MEMBERSHIP", where, "Historical swap players cannot be identical.");
      for (const p of [p1, p2]) {
        if (p != null && !members.has(String(match.stageBackupId) + ":" + p)) {
          fail("STAGE_MEMBERSHIP", where, "Historical pre-swap participant belongs to another stage.");
        }
      }
    } else if (actionType === "match_bo_changed") {
      if (!positive(payload.prevBestOf) || payload.prevBestOf % 2 !== 1) {
        fail("ACTION_TYPE", where, "Prior bestOf must be positive odd.");
      }
    } else if (actionType === "match_started" || actionType === "match_postponed" ||
               actionType === "match_restored" || actionType === "match_cancelled") {
      if (!LIVE_STATUSES.has(String(payload.prevStatus))) {
        fail("ACTION_TYPE", where, "Unknown historical match status.");
      }
      if (actionType === "match_cancelled" && payload.prevNote != null &&
          typeof payload.prevNote !== "string") {
        fail("ACTION_TYPE", where, "Prior cancellation note must be text or null.");
      }
    } else if (actionType === "player_added" || actionType === "player_edited") {
      if (!positive(payload.playerId) || !players.has(payload.playerId)) {
        fail("REFERENCE_UNMAPPED", where, "Roster Undo references an unexported/foreign player.");
      }
      if (actionType === "player_edited" && !isRow(payload.prevData)) {
        fail("ACTION_TYPE", where, "Restore-player Undo requires typed historical prevData.");
      }
    }
    recognizedRefs(payload, where + ".undoPayload", action, match, matches, playerIds, members);
  }

  const links = array(policy.completionActions, "strictPolicy.completionActions");
  const seenCompletionIndex = new Set<number>();
  const activeForMatch = new Map<number, number>();
  const completionOrderByMatch = new Map<number, Array<{ ordinal: number; revision: number }>>();
  const historyKeyClaimed = new Set<string>();
  for (const [i, link] of links.entries()) {
    const where = "strictPolicy.completionActions[" + i + "]";
    checkAuthorityFields(link, where);
    const ix = link.sourceActionIndex;
    if (typeof ix !== "number" || !Number.isSafeInteger(ix) ||
        !manualActions.has(ix) || seenCompletionIndex.has(ix)) {
      fail("COMPLETION_PROVENANCE", where, "Completion link must identify exactly one manual action.");
    }
    seenCompletionIndex.add(ix);
    const action = actions[ix];
    const mid = link.matchBackupId;
    const rev = link.historyRevision;
    if (!positive(mid) || !positive(rev) || !matches.has(mid) ||
        action.matchBackupId !== mid || !historyIndex.has(mid + ":" + rev)) {
      fail("COMPLETION_PROVENANCE", where, "Completion action/history match identity or revision is forged.");
    }
    const match = matches.get(mid)!;
    if (typeof link.active !== "boolean" ||
        link.active !== (action.isUndone === false && action.canUndo === true)) {
      fail("COMPLETION_PROVENANCE", where, "Active completion contradicts original Undo flags.");
    }
    const historyRow = historyIndex.get(mid + ":" + rev)!;
    if (historyRow.resultType === "bye") {
      fail("COMPLETION_PROVENANCE", where, "System BYE cannot have a manual completion.");
    }
    const ord = indexToOrdinal.get(ix)!;
    const seq = completionOrderByMatch.get(mid) ?? [];
    seq.push({ ordinal: ord, revision: rev });
    completionOrderByMatch.set(mid, seq);
    const key = mid + ":" + rev;
    if (historyKeyClaimed.has(key)) {
      fail("COMPLETION_PROVENANCE", where, "Multiple manual actions claim the same result-history event.");
    }
    historyKeyClaimed.add(key);
    if (link.active) {
      activeForMatch.set(mid, (activeForMatch.get(mid) ?? 0) + 1);
      if (match.status !== "completed" ||
          lastHistory.get(mid)?.revision !== rev) {
        fail("COMPLETION_PROVENANCE", where, "Active action does not match current latest completed result.");
      }
    }
  }
  if (manualActions.size !== seenCompletionIndex.size) {
    fail("COMPLETION_PROVENANCE", "strictPolicy.completionActions", "Manual completion is missing its typed history link.");
  }
  for (const [mid, seq] of completionOrderByMatch) {
    seq.sort((a, b) => a.ordinal - b.ordinal);
    for (let i = 1; i < seq.length; i++) {
      if (seq[i].revision <= seq[i - 1].revision) {
        fail("COMPLETION_PROVENANCE", "strictPolicy.completionActions",
          "A later completion action cannot claim an earlier history revision for match " + mid + ".");
      }
    }
  }
  for (const [mid, match] of matches) {
    const active = activeForMatch.get(mid) ?? 0;
    if (match.status !== "completed") {
      if (active !== 0) fail("COMPLETION_PROVENANCE", "matches." + mid, "Noncompleted match has active completion.");
    } else if (match.resultType === "bye") {
      if (systemByes.get(mid) !== 1 || active !== 0) {
        fail("COMPLETION_PROVENANCE", "matches." + mid, "System BYE needs exactly one system action and no active manual completion.");
      }
    } else if (active !== 1) {
      fail("COMPLETION_PROVENANCE", "matches." + mid, "Current manual result requires exactly one active completion.");
    }
  }
  // SUCCESS IS VOID: never return portableActionId, source CAS, tokens or permission.
}
