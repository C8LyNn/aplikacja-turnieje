import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isUndoPayloadStructurallyAvailable,
  parseUndoPayloadForAction,
  UNDO_PAYLOAD_BY_ACTION,
} from "../src/domain/tournament/undo-payload";

test("undo payload parser accepts all supported persisted action types", () => {
  for (const [actionType, payloadType] of Object.entries(UNDO_PAYLOAD_BY_ACTION)) {
    const parsed = parseUndoPayloadForAction(
      actionType,
      JSON.stringify({ type: payloadType, marker: 123 }),
    );
    assert.equal(parsed?.type, payloadType, actionType);
    assert.equal(parsed?.marker, 123, actionType);
  }
});

test("undo payload parser rejects invalid JSON and non-object documents", () => {
  for (const payload of [
    null,
    undefined,
    "",
    "{",
    "null",
    "false",
    "42",
    '"restore_status"',
    "[]",
    "{}",
    '{"type":null}',
    '{"type":[]}',
  ]) {
    assert.equal(
      parseUndoPayloadForAction("match_started", payload),
      null,
      JSON.stringify(payload),
    );
  }
});

test("undo payload parser rejects cross-type and unknown action combinations", () => {
  assert.equal(
    parseUndoPayloadForAction("match_bo_changed", '{"type":"restore_players_swap"}'),
    null,
  );
  assert.equal(
    parseUndoPayloadForAction("player_added", '{"type":"restore_player"}'),
    null,
  );
  assert.equal(
    parseUndoPayloadForAction("match_result_reverted", '{"type":"restore_status"}'),
    null,
  );
  assert.equal(
    parseUndoPayloadForAction("unrecognized_action", '{"type":"delete_player"}'),
    null,
  );
});

test("undo payload parser recognizes legacy action types without requiring new metadata", () => {
  assert.deepEqual(
    parseUndoPayloadForAction(
      "match_bo_changed",
      '{"type":"restore_best_of","matchId":4,"prevBestOf":1}',
    ),
    { type: "restore_best_of", matchId: 4, prevBestOf: 1 },
  );
});

test("action-log affordance rejects legacy roster undo without nextData", () => {
  const payload = JSON.stringify({ type: "delete_player", playerId: 12 });
  assert.equal(parseUndoPayloadForAction("player_added", payload)?.playerId, 12);
  assert.equal(isUndoPayloadStructurallyAvailable("player_added", payload), false);
});

test("action-log affordance accepts a complete roster post-state snapshot", () => {
  const nextData = {
    name: "Example",
    rank: null,
    country: null,
    teamName: null,
    seed: 2,
    status: "active",
  };
  const payload = JSON.stringify({
    type: "restore_player", playerId: 10, nextData,
  });
  assert.equal(isUndoPayloadStructurallyAvailable("player_edited", payload), true);
  assert.equal(isUndoPayloadStructurallyAvailable("player_added", payload), false);
  const tampered = JSON.stringify({
    type: "restore_player", playerId: 10, nextData: { ...nextData, tournamentId: 55 },
  });
  assert.equal(isUndoPayloadStructurallyAvailable("player_edited", tampered), false);
  assert.equal(
    isUndoPayloadStructurallyAvailable("player_edited",
      JSON.stringify({ type: "restore_player", playerId: 10, nextData: { ...nextData, seed: "2" } })),
    false,
  );
});
