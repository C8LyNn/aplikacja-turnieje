import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidRosterUndoPayloadError, parseRosterUndoPayload } from "../src/application/players/roster-undo-payload";

test("roster Undo accepts legitimate add/edit payloads and copies snapshots", () => {
  assert.deepEqual(parseRosterUndoPayload({ type: "delete_player", playerId: 1 }, "player_added"), { type: "delete_player", playerId: 1 });
  const snapshot = { name: " Alpha ", seed: null, teamName: null, country: "PL", rank: "Gold" };
  const result = parseRosterUndoPayload({ type: "restore_player", playerId: 2, prevData: snapshot }, "player_edited");
  assert.equal(result.type, "restore_player");
  if (result.type !== "restore_player") throw new Error("Unexpected payload");
  assert.deepEqual(result.prevData, { ...snapshot, name: "Alpha" });
  assert.notEqual(result.prevData, snapshot);
});

test("roster Undo rejects corrupt IDs, mismatched action types and extra authority fields", () => {
  for (const playerId of [null, "1", 0, -1, 1.5, NaN, Infinity, 2_147_483_648]) {
    assert.throws(() => parseRosterUndoPayload({ type: "delete_player", playerId }, "player_added"), InvalidRosterUndoPayloadError);
  }
  for (const data of [
    null, [], {},
    { type: "delete_player", playerId: 1, expectedRevision: 2 },
    { type: "restore_player", playerId: 1, prevData: {} },
    ...["id", "tournamentId", "status", "matchWins", "__proto__", "constructor"].map(field => ({
      type: "restore_player", playerId: 1, prevData: JSON.parse(`{"${field}":1}`),
    })),
    { type: "restore_player", playerId: 1, prevData: { name: " " } },
    { type: "restore_player", playerId: 1, prevData: { seed: "2" } },
    { type: "restore_player", playerId: 1, prevData: { country: 12 } },
  ]) assert.throws(() => parseRosterUndoPayload(data, "player_edited"), InvalidRosterUndoPayloadError);
  assert.throws(() => parseRosterUndoPayload({ type: "delete_player", playerId: 1 }, "player_edited"), InvalidRosterUndoPayloadError);
  assert.throws(() => parseRosterUndoPayload({ type: "restore_player", playerId: 1, prevData: { name: "A" } }, "player_added"), InvalidRosterUndoPayloadError);
});
