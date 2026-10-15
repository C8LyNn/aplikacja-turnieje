/**
 * WEB-005 / R22 — isolated, pure modern Backup V3 strict-policy prototype.
 *
 * IMPORTANT: Not wired to importBackupV3/exportBackupV3 or generated OpenAPI.
 * A marker supplied by untrusted JSON is NOT a cryptographic producer proof.
 * Missing marker => UNATTESTED, never an automatic LEGACY classification.
 * Existing V2/V3 compatibility, clone-local CAS and actual rollback belong
 * to a later separately approved adapter/DB/API integration.
 */
export const STRICT_BACKUP_V3_PROFILE = "web005.backup-v3.strict.v1" as const;

export type StrictBackupProfileClassification =
  | "STRICT_MARKED"
  | "UNATTESTED"
  | "INVALID_PROFILE";

export class BackupV3StrictPolicyError extends Error {
  readonly code = "INVALID_BACKUP_V3" as const;
  constructor(readonly issues: readonly string[]) {
    super("Backup V3 modern strict-policy validation failed.");
    this.name = "BackupV3StrictPolicyError";
  }
}

type JsonObject = Record<string, unknown>;

function record(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : null;
}

function positiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function arrayRecords(
  value: unknown,
  name: string,
  errors: string[],
): JsonObject[] {
  if (!Array.isArray(value)) {
    errors.push(name + " must be an array.");
    return [];
  }
  return value.flatMap((entry: unknown, index: number) => {
    const item = record(entry);
    if (!item) errors.push(name + "[" + index + "] must be an object.");
    return item ? [item] : [];
  });
}

export function classifyBackupV3StrictProfile(
  value: unknown,
): StrictBackupProfileClassification {
  const root = record(value);
  if (!root) return "INVALID_PROFILE";
  if (!Object.prototype.hasOwnProperty.call(root, "strictPolicy")) {
    // Untrusted JSON with no marker cannot prove it came from an old producer.
    return "UNATTESTED";
  }
  const profile = record(root.strictPolicy);
  return profile?.profile === STRICT_BACKUP_V3_PROFILE && profile.version === 1
    ? "STRICT_MARKED"
    : "INVALID_PROFILE";
}

/**
 * Validates only the NEW strict-profile extension plus its source-confirmed
 * V3 match/history/action projections; it is not a substitute for the full
 * legacy V3 schema/authorization/ref integrity validator in backup-v3.ts.
 *
 * No caller may use UNATTESTED as a trusted legacy-import authorization.
 */
export function validateStrictBackupV3Policy(
  input: unknown,
): void {
  const errors: string[] = [];
  const root = record(input);
  if (!root) throw new BackupV3StrictPolicyError(["Backup must be an object."]);
  if (classifyBackupV3StrictProfile(root) !== "STRICT_MARKED") {
    throw new BackupV3StrictPolicyError([
      "Strict-profile marker missing, unsupported, or malformed; untrusted input must not downgrade to legacy.",
    ]);
  }
  if (root.schemaVersion !== 3 ||
      root.resultModelVersion !== "series_v1" ||
      root.rankingPolicy !== "match_record_v1") {
    errors.push("Strict profile requires V3 series_v1/match_record_v1.");
  }

  const policy = record(root.strictPolicy)!;
  const players = arrayRecords(root.players, "players", errors);
  const matches = arrayRecords(root.matches, "matches", errors);
  const history = arrayRecords(root.resultHistory, "resultHistory", errors);
  const logs = arrayRecords(root.actionLog, "actionLog", errors);
  const states = arrayRecords(policy.matchStateRevisions, "strictPolicy.matchStateRevisions", errors);
  const ordered = arrayRecords(policy.actionOrder, "strictPolicy.actionOrder", errors);
  const completions = arrayRecords(policy.completionActions, "strictPolicy.completionActions", errors);

  const playerIds = new Set<number>();
  for (const player of players) {
    if (!positiveInt(player.backupId) || playerIds.has(player.backupId)) {
      errors.push("Player backup ID must be a distinct positive integer.");
    } else playerIds.add(player.backupId);
  }

  const matchById = new Map<number, JsonObject>();
  for (const match of matches) {
    if (!positiveInt(match.backupId) || matchById.has(match.backupId)) {
      errors.push("Match backup ID must be a distinct positive integer.");
    } else matchById.set(match.backupId, match);
  }

  // B3: portable match state revision, distinct from result history revision.
  const revisions = new Map<number, number>();
  for (const state of states) {
    const id = state.matchBackupId, rev = state.stateRevision;
    if (!positiveInt(id) || !matchById.has(id) ||
        !positiveInt(rev) || revisions.has(id)) {
      errors.push("Match state revision has an unknown/duplicate match or invalid CAS revision.");
    } else revisions.set(id, rev);
  }
  if (states.length !== matches.length || revisions.size !== matchById.size) {
    errors.push("Strict match state revision coverage must equal all exported matches.");
  }

  // B2: for completed matches, the newest result-history record must exist and
  // agree on actual fields the current V3 format serializes.  No equality
  // between history.revision and portable match stateRevision is imposed.
  const newest = new Map<number, JsonObject>();
  const seenHist = new Set<string>();
  for (const entry of history) {
    const id = entry.matchBackupId, rev = entry.revision;
    if (!positiveInt(id) || !matchById.has(id) || !positiveInt(rev)) {
      errors.push("Result history has unknown match or invalid sequence revision.");
      continue;
    }
    const key = id + ":" + rev;
    if (seenHist.has(key)) errors.push("Duplicate result-history revision for match " + id + ".");
    seenHist.add(key);
    if (!newest.has(id) || rev > (newest.get(id)!.revision as number)) {
      newest.set(id, entry);
    }
  }

  const parityFields = [
    "stageBackupId", "round", "matchNumber", "player1BackupId",
    "player2BackupId", "winnerBackupId", "score1", "score2",
    "bestOf", "resultType", "resultReason",
  ] as const;
  for (const [id, match] of matchById) {
    if (match.status !== "completed") continue;
    const last = newest.get(id);
    if (!last) {
      errors.push("Completed strict match " + id + " lacks result history.");
      continue;
    }
    for (const field of parityFields) {
      if ((match[field] ?? null) !== (last[field] ?? null)) {
        errors.push("Latest history contradicts completed match " + id + " field " + field + ".");
      }
    }
    const left = match.completedAt, right = last.completedAt;
    const leftTime = typeof left === "string" ? Date.parse(left) : NaN;
    const rightTime = typeof right === "string" ? Date.parse(right) : NaN;
    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime) || leftTime !== rightTime) {
      errors.push("Latest history completedAt differs from completed match " + id + ".");
    }
  }

  // B4: every exported action has a stable, non-ambiguous ordinal and
  // portable identity; two equal timestamps are allowed only with an explicit
  // distinct order. Original DB action IDs do not exist in current V3.
  const seenIndices = new Set<number>(), seenOrdinals = new Set<number>();
  const seenPortableIds = new Set<string>();
  for (const item of ordered) {
    const index = item.sourceActionIndex, ordinal = item.ordinal;
    const portable = item.portableActionId;
    if (!Number.isSafeInteger(index) || typeof index !== "number" ||
        index < 0 || index >= logs.length || seenIndices.has(index)) {
      errors.push("Invalid/duplicate portable action source index.");
    } else seenIndices.add(index);
    if (!positiveInt(ordinal) || seenOrdinals.has(ordinal)) {
      errors.push("Invalid/duplicate portable action ordinal.");
    } else seenOrdinals.add(ordinal);
    if (typeof portable !== "string" || portable.trim().length === 0 ||
        seenPortableIds.has(portable)) {
      errors.push("Invalid/duplicate portable action identity.");
    } else seenPortableIds.add(portable);
  }
  if (ordered.length !== logs.length ||
      seenIndices.size !== logs.length ||
      [...seenOrdinals].some(n => n > logs.length) ||
      seenOrdinals.size !== logs.length) {
    errors.push("Every action needs exactly one contiguous total-order slot.");
  }

  // P23-01: real Swiss system BYEs are completed by system_bye_assigned,
  // not by an undoable match_result_submitted. Restrict this exception to
  // the exact system BYE shape emitted by the stage/round writers.
  const legalSystemByeIds = new Set<number>();
  for (const [id, match] of matchById) {
    if (match.status !== "completed" || match.resultType !== "bye") continue;
    if (match.resultReason !== "system_bye" ||
        !positiveInt(match.player1BackupId) ||
        !playerIds.has(match.player1BackupId) ||
        match.player2BackupId != null ||
        match.winnerBackupId !== match.player1BackupId ||
        match.score1 != null || match.score2 != null) {
      errors.push("Completed system BYE has invalid source player, winner, scores or reason.");
    } else {
      legalSystemByeIds.add(id);
    }
  }
  const systemByeActionCount = new Map<number, number>();
  for (const action of logs) {
    if (action.actionType !== "system_bye_assigned") continue;
    const id = action.matchBackupId;
    const match = positiveInt(id) ? matchById.get(id) : undefined;
    if (!match || !legalSystemByeIds.has(id) ||
        action.stageBackupId !== match.stageBackupId ||
        action.canUndo !== false || action.undoPayload !== null ||
        action.isUndone !== false) {
      errors.push("System BYE action must reference its completed BYE and cannot be undoable.");
      continue;
    }
    systemByeActionCount.set(id, (systemByeActionCount.get(id) ?? 0) + 1);
  }

  const completionIndices = new Set<number>();
  const activeCount = new Map<number, number>();
  for (const completion of completions) {
    const index = completion.sourceActionIndex, id = completion.matchBackupId;
    if (!Number.isSafeInteger(index) || typeof index !== "number" ||
        index < 0 || index >= logs.length || completionIndices.has(index)) {
      errors.push("Completion provenance has an invalid/duplicate source-action index.");
      continue;
    }
    completionIndices.add(index);
    const action = logs[index];
    if (!positiveInt(id) || !matchById.has(id) ||
        matchById.get(id)?.resultType === "bye" ||
        action.actionType !== "match_result_submitted" ||
        action.matchBackupId !== id) {
      errors.push("Completion action type or match identity does not match its source action.");
    }
    const historyRev = completion.historyRevision;
    if (!positiveInt(historyRev) || !history.some(row =>
      row.matchBackupId === id && row.revision === historyRev)) {
      errors.push("Completion action refers to missing result-history revision.");
    }
    const expectedActive = action.isUndone === false && action.canUndo === true &&
      record(action.undoPayload) !== null;
    if (typeof completion.active !== "boolean" ||
        completion.active !== expectedActive) {
      errors.push("Active completion identity contradicts Undo action state.");
    }
    if (completion.active === true && positiveInt(id)) {
      activeCount.set(id, (activeCount.get(id) ?? 0) + 1);
      if (newest.get(id)?.revision !== historyRev ||
          matchById.get(id)?.status !== "completed") {
        errors.push("Active completion does not refer to the current completed result.");
      }
    }
  }
  for (const [index, action] of logs.entries()) {
    if (action.actionType === "match_result_submitted" &&
        !completionIndices.has(index)) {
      errors.push("Strict completion source action has no typed provenance.");
    }
  }
  for (const [id, match] of matchById) {
    if (match.status !== "completed") continue;
    if (match.resultType === "bye") {
      if (!legalSystemByeIds.has(id) ||
          systemByeActionCount.get(id) !== 1 ||
          (activeCount.get(id) ?? 0) !== 0) {
        errors.push("Completed system BYE needs exactly one valid system action and no manual completion.");
      }
    } else if (activeCount.get(id) !== 1) {
      errors.push("Completed strict match must have one provable active manual completion action.");
    }
  }

  // B5: only the exact nested ID keys already recognized by the existing
  // remapper. Unknown opaque legacy keys must NOT be interpreted as IDs.
  const playerKeys = new Set(["playerId", "player1Id", "player2Id", "winnerId"]);
  const matchKeys = new Set(["matchId", "prevFeaturedMatchId"]);
  function inspect(value: unknown, key: string | undefined, seen: WeakSet<object>, depth: number): void {
    if (depth > 48) {
      errors.push("Undo payload nesting is too deep.");
      return;
    }
    const ids = key && playerKeys.has(key) ? playerIds
      : key && matchKeys.has(key) ? matchById
      : null;
    if (ids !== null && value != null && (!positiveInt(value) || !ids.has(value))) {
      errors.push("Strict Undo payload contains a missing/foreign recognized " + key + " ID.");
    }
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) {
      errors.push("Undo payload is cyclic, not legal JSON.");
      return;
    }
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) inspect(item, key, seen, depth + 1);
    } else {
      for (const [childKey, child] of Object.entries(value as JsonObject)) {
        inspect(child, childKey, seen, depth + 1);
      }
    }
    seen.delete(value);
  }
  for (const action of logs) {
    if (action.undoPayload != null && !record(action.undoPayload)) {
      errors.push("Strict Undo payload must be an object or null.");
    } else if (action.undoPayload != null) {
      inspect(action.undoPayload, undefined, new WeakSet<object>(), 0);
    }
  }

  if (errors.length) throw new BackupV3StrictPolicyError(errors);
}
