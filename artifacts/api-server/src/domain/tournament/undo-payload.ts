/**
 * Interprets persisted undo history as untrusted data.
 *
 * History may contain records from older builds, imports, or manual repairs.
 * Reject invalid JSON and mismatched action types before executing writes.
 * Do not silently skip a malformed latest action: undo-last must fail closed.
 */
export const UNDO_PAYLOAD_BY_ACTION = {
  player_added: "delete_player",
  player_edited: "restore_player",
  match_result_submitted: "revert_match",
  match_started: "restore_status",
  match_postponed: "restore_status",
  match_restored: "restore_status",
  match_bo_changed: "restore_best_of",
  match_featured: "restore_featured",
  match_unfeatured: "restore_featured",
  match_cancelled: "restore_cancelled_match",
  match_players_swapped: "restore_players_swap",
} as const;

export type ParsedUndoPayload = Record<string, unknown> & { type: string };

export function parseUndoPayloadForAction(
  actionType: string,
  rawPayload: string | null | undefined,
): ParsedUndoPayload | null {
  if (typeof rawPayload !== "string" || rawPayload.length === 0) return null;
  const expectedType = UNDO_PAYLOAD_BY_ACTION[
    actionType as keyof typeof UNDO_PAYLOAD_BY_ACTION
  ];
  if (!expectedType) return null;
  try {
    const candidate: unknown = JSON.parse(rawPayload);
    if (
      candidate === null ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) return null;
    const payload = candidate as Record<string, unknown>;
    if (payload.type !== expectedType) return null;
    return payload as ParsedUndoPayload;
  } catch {
    return null;
  }
}

const PLAYER_UNDO_KEYS = [
  "name", "rank", "country", "teamName", "seed", "status",
] as const;

/**
 * Conservative affordance for the action-log UI. No DB state is read here:
 * an eligible action can still conflict with subsequent changes at execution time.
 */
export function isUndoPayloadStructurallyAvailable(
  actionType: string,
  rawPayload: string | null | undefined,
): boolean {
  const payload = parseUndoPayloadForAction(actionType, rawPayload);
  if (!payload) return false;
  if (actionType !== "player_added" && actionType !== "player_edited") return true;
  if (!Number.isSafeInteger(payload.playerId) ||
      (payload.playerId as number) < 1) return false;
  const nextData = payload.nextData;
  if (!nextData || typeof nextData !== "object" || Array.isArray(nextData)) return false;
  const snapshot = nextData as Record<string, unknown>;
  const keys = Object.keys(snapshot);
  return keys.length === PLAYER_UNDO_KEYS.length &&
    PLAYER_UNDO_KEYS.every((key) =>
      Object.prototype.hasOwnProperty.call(snapshot, key)) &&
    typeof snapshot.name === "string" && snapshot.name.trim().length > 0 &&
    ["active", "eliminated", "winner"].includes(snapshot.status as string) &&
    ["rank", "country", "teamName"].every((field) =>
      snapshot[field] === null || typeof snapshot[field] === "string") &&
    (snapshot.seed === null ||
      (Number.isSafeInteger(snapshot.seed) && (snapshot.seed as number) > 0));
}
