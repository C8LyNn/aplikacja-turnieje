/**
 * T040 WAVE 2 — pure boundary for persisted roster Undo action data.
 *
 * The action log may include historical/imported JSON. A TypeScript cast is
 * not validation: only the documented snapshot columns may reach Drizzle's
 * update().set(). Caller retains tournament/actor/global-LIFO transaction
 * checks. This module never authorizes a replay or grants a CAS token.
 */

export class InvalidRosterUndoPayloadError extends Error {
  readonly code = "INVALID_ROSTER_UNDO_PAYLOAD" as const;
  constructor() {
    super("Persisted roster Undo action has an invalid type, target or snapshot.");
    this.name = "InvalidRosterUndoPayloadError";
  }
}

export type RosterPreviousSnapshot = Partial<{
  name: string;
  rank: string | null;
  country: string | null;
  teamName: string | null;
  seed: number | null;
}>;

export type ParsedRosterUndoPayload =
  | Readonly<{ type: "delete_player"; playerId: number }>
  | Readonly<{
      type: "restore_player";
      playerId: number;
      prevData: RosterPreviousSnapshot;
    }>;

const POSTGRES_INT_MAX = 2_147_483_647;

function fail(): never {
  throw new InvalidRosterUndoPayloadError();
}

function record(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) fail();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) fail();
  return input as Record<string, unknown>;
}

function fields(
  row: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): void {
  if (Object.keys(row).some((key) => !allowed.has(key))) fail();
}

function pgPositiveInteger(input: unknown): number {
  if (
    typeof input !== "number" ||
    !Number.isSafeInteger(input) ||
    input <= 0 ||
    input > POSTGRES_INT_MAX
  ) fail();
  return input;
}

function previousSnapshot(input: unknown): RosterPreviousSnapshot {
  const raw = record(input);
  fields(raw, new Set(["name", "seed", "rank", "country", "teamName"]));
  if (Object.keys(raw).length === 0) fail();

  const snapshot: RosterPreviousSnapshot = {};
  if (Object.hasOwn(raw, "name")) {
    if (typeof raw.name !== "string" || raw.name.trim().length === 0) fail();
    snapshot.name = raw.name.trim();
  }
  for (const field of ["rank", "country", "teamName"] as const) {
    if (!Object.hasOwn(raw, field)) continue;
    if (raw[field] !== null && typeof raw[field] !== "string") fail();
    snapshot[field] = raw[field] as string | null;
  }
  if (Object.hasOwn(raw, "seed")) {
    snapshot.seed = raw.seed === null ? null : pgPositiveInteger(raw.seed);
  }
  return snapshot;
}

/**
 * Parse an Undo payload ONLY when the action_log.actionType is the matching
 * roster event. Distinguishes malformed snapshots from lawful stale-LIFO
 * conflicts; caller maps this error to ROSTER_UNDO_UNAVAILABLE.
 *
 * Pure and side-effect free: returns a fresh, allowlisted payload. It DOES NOT
 * decide whether a selected action is latest, not-yet-undone or authorized.
 */
export function parseRosterUndoPayload(
  input: unknown,
  actionType: string,
): ParsedRosterUndoPayload {
  const data = record(input);
  const playerId = pgPositiveInteger(data.playerId);
  if (data.type === "delete_player" && actionType === "player_added") {
    fields(data, new Set(["type", "playerId"]));
    return { type: "delete_player", playerId };
  }
  if (data.type === "restore_player" && actionType === "player_edited") {
    fields(data, new Set(["type", "playerId", "prevData"]));
    return {
      type: "restore_player",
      playerId,
      prevData: previousSnapshot(data.prevData),
    };
  }
  return fail();
}
