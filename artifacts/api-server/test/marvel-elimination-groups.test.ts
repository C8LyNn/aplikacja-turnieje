import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMarvelInitialGroups,
  buildMarvelPairedMergeGroups,
  buildMarvelRandomGroups,
  calculateMarvelRoundParticipantCounts,
  rankMarvelGroupResult,
  validateMarvelManualGroups,
} from "../src/domain/tournament/marvel-elimination-groups";

test("32-player Marvel flow is 4x8, 2x8, then one final group", () => {
  assert.deepEqual(
    calculateMarvelRoundParticipantCounts(32, 8, 4),
    [32, 16, 8],
  );
  const initial = buildMarvelInitialGroups(
    Array.from({ length: 32 }, (_, index) => ({
      playerId: index + 1,
      seed: index + 1,
    })),
    8,
  );
  assert.deepEqual(
    initial.map((group) => group.playerIds.length),
    [8, 8, 8, 8],
  );
  assert.deepEqual(initial[0].playerIds, [1, 8, 9, 16, 17, 24, 25, 32]);

  const roundTwo = buildMarvelPairedMergeGroups(
    initial.map((group) => group.playerIds.slice(0, 4)),
    8,
  );
  assert.deepEqual(
    roundTwo.map((group) => group.playerIds.length),
    [8, 8],
  );
  assert.deepEqual(roundTwo[0].playerIds, [1, 8, 9, 16, 2, 7, 10, 15]);

  const final = buildMarvelPairedMergeGroups(
    roundTwo.map((group) => group.playerIds.slice(0, 4)),
    8,
  );
  assert.equal(final.length, 1);
  assert.equal(final[0].playerIds.length, 8);
});

test("64-player Marvel flow is 8x8, 4x8, 2x8, then one final group", () => {
  assert.deepEqual(
    calculateMarvelRoundParticipantCounts(64, 8, 4),
    [64, 32, 16, 8],
  );
  let groups = buildMarvelInitialGroups(
    Array.from({ length: 64 }, (_, index) => ({
      playerId: index + 1,
      seed: index + 1,
    })),
    8,
  );
  assert.deepEqual(
    groups.map((group) => group.playerIds.length),
    Array(8).fill(8),
  );
  groups = buildMarvelPairedMergeGroups(
    groups.map((group) => group.playerIds.slice(0, 4)),
    8,
  );
  assert.deepEqual(
    groups.map((group) => group.playerIds.length),
    Array(4).fill(8),
  );
  groups = buildMarvelPairedMergeGroups(
    groups.map((group) => group.playerIds.slice(0, 4)),
    8,
  );
  assert.deepEqual(
    groups.map((group) => group.playerIds.length),
    [8, 8],
  );
  groups = buildMarvelPairedMergeGroups(
    groups.map((group) => group.playerIds.slice(0, 4)),
    8,
  );
  assert.deepEqual(
    groups.map((group) => group.playerIds.length),
    [8],
  );
});

test("TOP 4 qualifies, places 5-8 are eliminated, and kills never reorder the result", () => {
  const result = rankMarvelGroupResult(
    [1, 2, 3, 4, 5, 6, 7, 8],
    [
      { playerId: 3, kills: 20 },
      { playerId: 1, kills: 17 },
      { playerId: 8, kills: 13 },
      { playerId: 2, kills: 13 },
      { playerId: 4, kills: 19 },
      { playerId: 5, kills: 11 },
      { playerId: 6, kills: 8 },
      { playerId: 7, kills: 5 },
    ],
    4,
    false,
  );
  assert.deepEqual(
    result.slice(0, 4).map((entry) => entry.qualified),
    [true, true, true, true],
  );
  assert.deepEqual(
    result.slice(4).map((entry) => entry.qualified),
    [false, false, false, false],
  );
  assert.deepEqual(
    result.map((entry) => entry.playerId),
    [3, 1, 8, 2, 4, 5, 6, 7],
  );
  assert.equal(result[2].kills, result[3].kills);
});

test("the final produces no qualifiers and keeps place one as the winner", () => {
  const final = rankMarvelGroupResult(
    [1, 2, 3, 4, 5, 6, 7, 8],
    [1, 2, 3, 4, 5, 6, 7, 8].map((playerId) => ({ playerId })),
    4,
    true,
  );
  assert.equal(final[0].placement, 1);
  assert.equal(final[0].playerId, 1);
  assert.ok(final.every((entry) => !entry.qualified));
});

test("random grouping is deterministic and preserves every qualifier", () => {
  const players = Array.from({ length: 16 }, (_, index) => index + 1);
  const first = buildMarvelRandomGroups(players, 8, "persisted-round-seed");
  const refreshed = buildMarvelRandomGroups(players, 8, "persisted-round-seed");
  assert.deepEqual(refreshed, first);
  assert.deepEqual(
    first
      .flatMap((group) => group.playerIds)
      .sort((left, right) => left - right),
    players,
  );
});

test("manual grouping accepts a complete assignment and rejects duplicates", () => {
  const players = Array.from({ length: 16 }, (_, index) => index + 1);
  assert.deepEqual(
    validateMarvelManualGroups(
      players,
      [
        { position: 1, playerIds: [1, 3, 5, 7, 9, 11, 13, 15] },
        { position: 2, playerIds: [2, 4, 6, 8, 10, 12, 14, 16] },
      ],
      8,
    ).map((group) => group.playerIds.length),
    [8, 8],
  );
  assert.throws(() =>
    validateMarvelManualGroups(
      players,
      [
        { position: 1, playerIds: [1, 1, 2, 3, 4, 5, 6, 7] },
        { position: 2, playerIds: [8, 9, 10, 11, 12, 13, 14, 15] },
      ],
      8,
    ),
  );
});
