import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildRandomBracket,
  buildRandomGroupPlacements,
  buildReseededRoundPairings,
  buildSnakeGroupPlacements,
  buildStandardSeededBracket,
  nextPowerOfTwo,
  standardBracketSeedOrder,
} from "../src/domain/tournament/stage-placement";

function participants(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    participantKey: `p${index + 1}`,
    seed: index + 1,
  }));
}

describe("standard seeded bracket", () => {
  test("places top seeds so 1 and 2 can only meet in the final", () => {
    assert.deepEqual(standardBracketSeedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
    const bracket = buildStandardSeededBracket(participants(8));
    assert.deepEqual(
      bracket.firstRound.map((match) => [match.player1.expectedSeed, match.player2.expectedSeed]),
      [[1, 8], [4, 5], [2, 7], [3, 6]],
    );
  });

  test("supports arbitrary participant counts and awards byes to the highest seeds", () => {
    const bracket = buildStandardSeededBracket(participants(17));
    assert.equal(bracket.bracketSize, 32);
    assert.equal(bracket.firstRound.length, 16);
    assert.equal(bracket.firstRound.filter((match) => match.byeWinner != null).length, 15);
    const played = bracket.firstRound.find((match) => match.byeWinner == null)!;
    assert.deepEqual(
      [played.player1.participant?.seed, played.player2.participant?.seed].sort((a, b) => a! - b!),
      [16, 17],
    );
    assert.equal(bracket.firstRound.find((match) => match.player1.expectedSeed === 1)?.byeWinner?.seed, 1);
  });

  test("random bracket placement is deterministic without changing participant seed data", () => {
    const source = participants(12);
    const first = buildRandomBracket(source, "public-draw");
    const second = buildRandomBracket(source, "public-draw");
    assert.deepEqual(first, second);
    assert.deepEqual(source, participants(12));
  });
});

describe("reseeded rounds", () => {
  test("pairs strongest remaining seed with weakest remaining seed", () => {
    const pairings = buildReseededRoundPairings([
      { participantKey: "p1", seed: 1 },
      { participantKey: "p3", seed: 3 },
      { participantKey: "p6", seed: 6 },
      { participantKey: "p8", seed: 8 },
    ]);
    assert.deepEqual(pairings.map((pairing) => [pairing.player1.seed, pairing.player2?.seed]), [[1, 8], [3, 6]]);
  });
});

describe("group placement", () => {
  test("snake placement supports unequal balanced groups", () => {
    const placements = buildSnakeGroupPlacements(participants(17), [5, 4, 4, 4]);
    assert.deepEqual(placements.map((placement) => placement.groupIndex), [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0]);
    assert.deepEqual(
      [0, 1, 2, 3].map((groupIndex) => placements.filter((placement) => placement.groupIndex === groupIndex).length),
      [5, 4, 4, 4],
    );
  });

  test("random placement is deterministic and keeps exact capacities", () => {
    const first = buildRandomGroupPlacements(participants(10), [4, 3, 3], "group-draw");
    const second = buildRandomGroupPlacements(participants(10), [4, 3, 3], "group-draw");
    assert.deepEqual(first, second);
    assert.deepEqual(
      [0, 1, 2].map((groupIndex) => first.filter((placement) => placement.groupIndex === groupIndex).length),
      [4, 3, 3],
    );
    assert.equal(new Set(first.map((placement) => placement.participant.participantKey)).size, 10);
  });
});

describe("capacity helpers", () => {
  test("calculates the next valid bracket size", () => {
    assert.equal(nextPowerOfTwo(2), 2);
    assert.equal(nextPowerOfTwo(17), 32);
    assert.equal(nextPowerOfTwo(32), 32);
  });
});
