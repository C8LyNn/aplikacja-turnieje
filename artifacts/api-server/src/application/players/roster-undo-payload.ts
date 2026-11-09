/** Only allow documented roster snapshot columns to reach an Undo write. */
export class InvalidRosterUndoPayloadError extends Error {
  readonly code = "INVALID_ROSTER_UNDO_PAYLOAD";
  constructor() {
    super("Persisted roster Undo action has an invalid type, target or snapshot.");
    this.name = "InvalidRosterUndoPayloadError";
  }
}

type PreviousSnapshot = Partial<{
  name: string;
  rank: string | null;
  country: string | null;
  teamName: string | null;
  seed: number | null;
}>;
type RosterUndoPayload =
  | { type: "delete_player"; playerId: number }
  | { type: "restore_player"; playerId: number; prevData: PreviousSnapshot };

function fail(): never { throw new InvalidRosterUndoPayloadError(); }
function record(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) fail();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) fail();
  return input as Record<string, unknown>;
}
function fields(row: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(row).some(key => !allowed.includes(key))) fail();
}
function positiveId(input: unknown): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input <= 0 || input > 2_147_483_647) fail();
  return input;
}

/** Pure validation, not authorization, LIFO enforcement or a CAS issuer. */
export function parseRosterUndoPayload(input: unknown, actionType: string): RosterUndoPayload {
  const data = record(input);
  const playerId = positiveId(data.playerId);
  if (data.type === "delete_player" && actionType === "player_added") {
    fields(data, ["type", "playerId"]);
    return { type: "delete_player", playerId };
  }
  if (data.type !== "restore_player" || actionType !== "player_edited") fail();
  fields(data, ["type", "playerId", "prevData"]);
  const raw = record(data.prevData);
  fields(raw, ["name", "rank", "country", "teamName", "seed"]);
  if (!Object.keys(raw).length) fail();
  const prevData: PreviousSnapshot = {};
  if (Object.hasOwn(raw, "name")) {
    if (typeof raw.name !== "string" || !raw.name.trim()) fail();
    prevData.name = raw.name.trim();
  }
  for (const key of ["rank", "country", "teamName"] as const) {
    if (!Object.hasOwn(raw, key)) continue;
    if (raw[key] !== null && typeof raw[key] !== "string") fail();
    prevData[key] = raw[key] as string | null;
  }
  if (Object.hasOwn(raw, "seed")) prevData.seed = raw.seed === null ? null : positiveId(raw.seed);
  return { type: "restore_player", playerId, prevData };
}
