import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidRosterUndoPayloadError,
  parseRosterUndoPayload,
} from "../src/application/players/roster-undo-payload";

const player = 47;
const oldSnapshot = {
  name: " Former Name ",
  seed: 3,
  rank: "Gold",
  country: null,
  teamName: "Teal",
};

function rejected(raw: unknown, actionType: string): void {
  assert.throws(
    () => parseRosterUndoPayload(raw, actionType),
    (error: unknown) => error instanceof InvalidRosterUndoPayloadError &&
      error.code === "INVALID_ROSTER_UNDO_PAYLOAD",
  );
}

test("R01 latest valid delete_player is correctly scoped to player_added", () => {
  assert.deepEqual(
    parseRosterUndoPayload({ type: "delete_player", playerId: player }, "player_added"),
    { type: "delete_player", playerId: player },
  );
});

test("R02 valid restore_player preserves only historical allowed snapshot", () => {
  assert.deepEqual(
    parseRosterUndoPayload(
      { type: "restore_player", playerId: player, prevData: oldSnapshot },
      "player_edited",
    ),
    { type: "restore_player", playerId: player, prevData: {
      name: "Former Name", rank: "Gold", country: null, teamName: "Teal", seed: 3,
    } },
  );
});

test("R03 backward-compatible sparse historical snapshot is valid", () => {
  assert.deepEqual(
    parseRosterUndoPayload({
      type: "restore_player", playerId: 5, prevData: { rank: null, seed: null },
    }, "player_edited"),
    { type: "restore_player", playerId: 5, prevData: { rank: null, seed: null } },
  );
});

test("R04 action-provenance mismatch cannot convert status or other action into player deletion", () => {
  for (const actual of ["match_started", "player_edited", "match_result_submitted", "player_removed"]) {
    rejected({ type: "delete_player", playerId: player }, actual);
  }
  for (const actual of ["player_added", "match_started", "player_removed"]) {
    rejected({ type: "restore_player", playerId: player, prevData: oldSnapshot }, actual);
  }
});

test("R05 forged identity/status/tenant field cannot be replayed on restore_player", () => {
  for (const key of [
    "id", "tournamentId", "status", "createdAt", "isUndone",
    "__proto__", "toString", "constructor",
  ]) {
    const prevData: Record<string, unknown> = Object.assign(
      Object.create(null) as Record<string, unknown>,
      { name: "Valid" },
    );
    Object.defineProperty(prevData, key, { value: 99, configurable: true, enumerable: true });
    rejected({ type: "restore_player", playerId: player, prevData }, "player_edited");
  }
});

test("R06 repeated/stale malformed Undo IDs are refused; no coercion, NaN, unsafe integer", () => {
  for (const bad of [
    "47", null, undefined, 0, -1, 4.7, Number.NaN,
    Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1,
    2_147_483_648, {}, [47], true,
  ]) {
    rejected({ type: "delete_player", playerId: bad }, "player_added");
    rejected({ type: "restore_player", playerId: bad, prevData: oldSnapshot }, "player_edited");
  }
});

test("R07 incompatible previous snapshot types fail before any DB mutation", () => {
  const badSnapshots: unknown[] = [
    null, undefined, {}, [], "snapshot", 47,
    { name: " " },
    { name: null },
    { seed: 0 },
    { seed: -2 },
    { seed: 1.5 },
    { seed: "4" },
    { seed: 2_147_483_648 },
    { rank: 123 },
    { country: ["PL"] },
    { teamName: { text: "Example" } },
  ];
  for (const prevData of badSnapshots) {
    rejected({ type: "restore_player", playerId: player, prevData }, "player_edited");
  }
});

test("R08 unknown, unexpected or nested root attributes cannot smuggle clone/local revisions", () => {
  for (const key of [
    "id", "tournamentId", "expectedRevision", "expectedMatchRevision",
    "actionId", "sourceActionId", "undoPayload", "prevData",
  ]) {
    const bad: Record<string, unknown> = { type: "delete_player", playerId: player };
    bad[key] = { nested: true };
    rejected(bad, "player_added");
  }
});

test("R09 valid parser never mutates input even if later operation is interrupted", () => {
  const prevData = Object.freeze({ ...oldSnapshot });
  const raw = Object.freeze({ type: "restore_player", playerId: player, prevData });
  const first = parseRosterUndoPayload(raw, "player_edited");
  assert.equal(prevData.name, " Former Name ");
  assert.equal(first.type, "restore_player");
  if (first.type !== "restore_player") throw new Error("Expected restore action");
  assert.equal(first.prevData.name, "Former Name");
  assert.notStrictEqual(first.prevData, prevData);
  const second = parseRosterUndoPayload(raw, "player_edited");
  assert.deepEqual(second, first);
});

test("R10 error neither authorizes same-action retry nor substitutes an action revision", () => {
  const invalid = { type: "restore_player", playerId: player, prevData: {
    name: "Valid", status: "winner",
  } };
  rejected(invalid, "player_edited");
  assert.deepEqual(invalid.prevData, { name: "Valid", status: "winner" });
  // Global LIFO conflict and repeated-Undo idempotency remain transaction
  // responsibilities. This pure validator does not issue a mutation token.
  assert.equal(parseRosterUndoPayload({ type: "delete_player", playerId: player }, "player_added").type, "delete_player");
});

test("R11 malformed JSON-decoded payload primitives, unknown action types and arrays fail closed", () => {
  for (const raw of [null, 0, "", [], "{}", true]) rejected(raw, "player_added");
  rejected({ type: "restore_status", matchId: player }, "match_started");
  rejected({ type: "delete_player", playerId: player }, "");
  rejected({ type: "delete_player", playerId: player }, "player_added "); 
});
