/**
 * WEB-005 A70 WAVE 3 — test-only, no DB/HTTP.
 * Boundary checks for the existing PR119 roster Undo JSON parser.
 * These tests do NOT assert global-LIFO, HTTP idempotence, actor auth, or
 * transactional rollback; those require the separately approved PG16 suite.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidRosterUndoPayloadError,
  parseRosterUndoPayload,
} from "../src/application/players/roster-undo-payload";

const playerId = 47;
const previous = {
  name: " Previous ",
  rank: "Gold",
  seed: 3,
  country: null,
  teamName: "Blue",
};

function reject(payload: unknown, actionType = "player_edited"): void {
  assert.throws(
    () => parseRosterUndoPayload(payload, actionType),
    (error: unknown) =>
      error instanceof InvalidRosterUndoPayloadError &&
      error.code === "INVALID_ROSTER_UNDO_PAYLOAD",
  );
}
function restore(prevData: unknown, extra: Record<string, unknown> = {}): unknown {
  return { type: "restore_player", playerId, prevData, ...extra };
}
function replay(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

test("W3-01 deterministic repeated parsing never consumes or marks an action undone", () => {
  const raw = Object.freeze(restore(Object.freeze({ ...previous })));
  const before = JSON.stringify(raw);
  const first = parseRosterUndoPayload(raw, "player_edited");
  const second = parseRosterUndoPayload(raw, "player_edited");
  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
  assert.equal(JSON.stringify(raw), before);
  assert.ok(!Object.hasOwn(first, "actionId"));
  assert.ok(!Object.hasOwn(first, "isUndone"));
  // This is deterministic *parsing*, not evidence of HTTP/DB idempotence.
});

test("W3-02 legal full historic JSON snapshot roundtrips without new authority", () => {
  const raw = replay(restore(previous));
  assert.deepEqual(parseRosterUndoPayload(raw, "player_edited"), {
    type: "restore_player", playerId, prevData: {
      name: "Previous", rank: "Gold", seed: 3, country: null, teamName: "Blue",
    },
  });
});

test("W3-03 sparse historic snapshot stays legal, empty snapshot does not", () => {
  assert.deepEqual(parseRosterUndoPayload(replay(restore({ rank: null })), "player_edited"), {
    type: "restore_player", playerId, prevData: { rank: null },
  });
  reject(replay(restore({})));
});

test("W3-04 missing completion data and target IDs fail without coercion", () => {
  for (const invalid of [
    { type: "restore_player", playerId },
    { type: "restore_player", prevData: previous },
    { type: "delete_player" },
    { type: "restore_player", playerId: null, prevData: previous },
    { type: "restore_player", playerId: "47", prevData: previous },
    { type: "restore_player", playerId, prevData: null },
    { playerId, prevData: previous },
  ]) {
    reject(invalid, invalid.type === "delete_player" ? "player_added" : "player_edited");
  }
});

test("W3-05 wrong action provenance cannot replay a player_added Undo as player_edited", () => {
  for (const sourceType of ["player_added", "match_started", "player_removed", "match_result_submitted"]) {
    reject(restore(previous), sourceType);
  }
  reject({ type: "delete_player", playerId }, "player_edited");
  reject({ type: "delete_player", playerId }, "match_result_submitted");
});

test("W3-06 stale or foreign CAS/action identity fields cannot travel in Undo JSON", () => {
  for (const key of [
    "expectedMatchRevision", "expectedCompletionActionId", "expectedRevision",
    "actionId", "sourceActionId", "revision", "isUndone", "canUndo",
    "sourceActionOrder", "tournamentId",
  ]) {
    reject(restore(previous, { [key]: 99 }));
    reject({ type: "delete_player", playerId, [key]: 99 }, "player_added");
  }
  // Repeated parsing of a clean action is legal and is not a concurrency token.
  assert.equal(parseRosterUndoPayload({ type: "delete_player", playerId }, "player_added").playerId, playerId);
});

test("W3-07 forged historical snapshot identity/status fields fail closed", () => {
  for (const key of [
    "id", "tournamentId", "status", "createdAt", "isUndone",
    "expectedRevision", "expectedCompletionActionId",
  ]) {
    reject(replay(restore({ ...previous, [key]: 100 })));
  }
});

test("W3-08 nullable historical fields are preserved without synthesizing absent fields", () => {
  const parsed = parseRosterUndoPayload(
    replay(restore({ seed: null, rank: null, teamName: "", country: null })),
    "player_edited",
  );
  assert.deepEqual(parsed, {
    type: "restore_player", playerId,
    prevData: { rank: null, country: null, teamName: "", seed: null },
  });
});

test("W3-09 malformed persisted JSON syntax fails before the pure parser", () => {
  for (const json of ['{"type":', '{"type":"restore_player",', "{", "not-json"]) {
    assert.throws(() => JSON.parse(json), SyntaxError);
  }
  // Route-level error mapping is a separate TODO; no claim that HTTP catches this.
});

test("W3-10 valid restored payload is never changed by an interrupted caller", () => {
  const payload = replay(restore(previous));
  const before = JSON.stringify(payload);
  const parsed = parseRosterUndoPayload(payload, "player_edited");
  assert.equal(parsed.type, "restore_player");
  assert.throws(() => { throw new Error("injected after parse, before DB"); }, /injected/);
  assert.equal(JSON.stringify(payload), before);
  // This verifies input immutability only, not PostgreSQL transactional rollback.
});

test("W3-11 malformed imported __proto__ key cannot override snapshot authority", () => {
  const raw = JSON.parse(
    '{"type":"restore_player","playerId":47,"prevData":{"name":"Old","__proto__":{"status":"winner"}}}',
  );
  reject(raw);
  const root = JSON.parse(
    '{"type":"delete_player","playerId":47,"__proto__":{"actionId":1}}',
  );
  reject(root, "player_added");
});

test("W3-12 player IDs outside PG positive int range never reach the Undo service", () => {
  for (const invalid of [
    0, -1, 1.25, 2147483648, 99999999999999, null, true, [47], { id: 47 },
  ]) {
    reject({ type: "delete_player", playerId: invalid }, "player_added");
  }
  assert.deepEqual(parseRosterUndoPayload(
    { type: "delete_player", playerId: 2147483647 }, "player_added"),
    { type: "delete_player", playerId: 2147483647 },
  );
});

test("W3-13 corrupted scalar values reject; JSON NaN normalization is distinguishable only before serialization", () => {
  for (const fieldAndValue of [
    ["name", null], ["name", " "], ["seed", "3"], ["seed", 0],
    ["seed", 1.5], ["rank", 23], ["country", ["PL"]],
    ["teamName", { label: "Blue" }],
  ] as const) {
    reject(restore({ [fieldAndValue[0]]: fieldAndValue[1] }));
  }
  // JSON.stringify converts NaN to null, which is a valid historic seed.
  // The parser cannot infer that a valid parsed null previously was NaN.
  const serialized = JSON.parse(JSON.stringify(restore({ seed: Number.NaN })));
  assert.deepEqual(parseRosterUndoPayload(serialized, "player_edited"), {
    type: "restore_player", playerId, prevData: { seed: null },
  });
  assert.throws(() => JSON.parse('{"seed":NaN}'), SyntaxError);
});

test("W3-14 undocumented nested operational snapshots cannot be replayed as PlayerUpdate", () => {
  reject(restore({ name: "Old", prevData: { id: playerId } }));
  reject(restore({ name: "Old", changes: { status: "winner" } }));
  reject(restore([{ name: "Old" }]));
});

test("W3-15 rejected historical input is not partially mutated or repaired", () => {
  const raw = replay(restore({ name: " Old ", status: "winner" }));
  const previousBytes = JSON.stringify(raw);
  reject(raw);
  assert.equal(JSON.stringify(raw), previousBytes);
});
