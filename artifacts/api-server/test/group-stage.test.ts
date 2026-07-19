import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildSnakeGroupAssignments,
  calculateBalancedGroupSizes,
  calculateGroupAdvancingCount,
  calculateGroupQualifierCounts,
  groupKeyFromIndex,
  seedQualifiedGroupEntries,
} from "../src/domain/tournament/group-stage";

describe("flexible group sizes", () => {
  test("balances arbitrary participant and group counts with at most one player of difference", () => {
    assert.deepEqual(calculateBalancedGroupSizes(17, 4), [5, 4, 4, 4]);
    assert.deepEqual(calculateBalancedGroupSizes(32, 7), [5, 5, 5, 5, 4, 4, 4]);
    assert.deepEqual(calculateBalancedGroupSizes(40, 6), [7, 7, 7, 7, 6, 6]);
    assert.deepEqual(calculateBalancedGroupSizes(32, 16), Array(16).fill(2));
  });

  test("rejects group counts that would create a one-player group", () => {
    assert.throws(() => calculateBalancedGroupSizes(32, 17), RangeError);
    assert.throws(() => calculateBalancedGroupSizes(3, 2), RangeError);
  });

  test("caps qualifiers at the real size of each group", () => {
    const sizes = calculateBalancedGroupSizes(17, 4);
    assert.deepEqual(calculateGroupQualifierCounts(sizes, 5), [5, 4, 4, 4]);
    assert.deepEqual(calculateGroupQualifierCounts(sizes, 4), [4, 4, 4, 4]);
    assert.equal(calculateGroupAdvancingCount(17, 4, 5), 17);
    assert.equal(calculateGroupAdvancingCount(17, 4, 4), 16);
  });
});

describe("group assignment and labels", () => {
  test("assigns uneven groups with capacity-aware snake seeding", () => {
    assert.deepEqual(
      buildSnakeGroupAssignments(17, 4),
      [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
    );
  });

  test("creates labels beyond group Z", () => {
    assert.equal(groupKeyFromIndex(0), "A");
    assert.equal(groupKeyFromIndex(25), "Z");
    assert.equal(groupKeyFromIndex(26), "AA");
    assert.equal(groupKeyFromIndex(51), "AZ");
  });
});

describe("rank-band reseeding", () => {
  test("puts all group winners before all runners-up and resolves ties deterministically", () => {
    const seeded = seedQualifiedGroupEntries([
      {
        playerId: 10,
        groupKey: "A",
        groupRank: 1,
        stageSeed: 2,
        matchWins: 3,
        matchLosses: 0,
        gameWins: 3,
        gameLosses: 0,
        gameDiff: 3,
      },
      {
        playerId: 20,
        groupKey: "B",
        groupRank: 1,
        stageSeed: 1,
        matchWins: 2,
        matchLosses: 0,
        gameWins: 2,
        gameLosses: 0,
        gameDiff: 2,
      },
      {
        playerId: 30,
        groupKey: "A",
        groupRank: 2,
        stageSeed: 3,
        matchWins: 2,
        matchLosses: 1,
        gameWins: 2,
        gameLosses: 1,
        gameDiff: 1,
      },
      {
        playerId: 40,
        groupKey: "B",
        groupRank: 2,
        stageSeed: 4,
        matchWins: 1,
        matchLosses: 1,
        gameWins: 1,
        gameLosses: 1,
        gameDiff: 0,
      },
    ]);

    assert.deepEqual(
      seeded.map(({ playerId, groupRank, nextStageSeed }) => ({
        playerId,
        groupRank,
        nextStageSeed,
      })),
      [
        { playerId: 20, groupRank: 1, nextStageSeed: 1 },
        { playerId: 10, groupRank: 1, nextStageSeed: 2 },
        { playerId: 30, groupRank: 2, nextStageSeed: 3 },
        { playerId: 40, groupRank: 2, nextStageSeed: 4 },
      ],
    );
  });
});
