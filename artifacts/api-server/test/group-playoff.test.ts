import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildGroupPlayoffSlots,
  type GroupPlayoffSlot,
} from "../src/domain/tournament/group-playoff";

interface VariantCase {
  name: string;
  groupCount: number;
  qualifiersPerGroup: number;
  expected: GroupPlayoffSlot[];
}

const variants: VariantCase[] = [
  {
    name: "2 groups with 1 qualifier",
    groupCount: 2,
    qualifiersPerGroup: 1,
    expected: [
      { matchPosition: 1, side: "player1", source: { groupKey: "A", groupRank: 1 } },
      { matchPosition: 1, side: "player2", source: { groupKey: "B", groupRank: 1 } },
    ],
  },
  {
    name: "2 groups with 2 qualifiers",
    groupCount: 2,
    qualifiersPerGroup: 2,
    expected: [
      { matchPosition: 1, side: "player1", source: { groupKey: "A", groupRank: 1 } },
      { matchPosition: 1, side: "player2", source: { groupKey: "B", groupRank: 2 } },
      { matchPosition: 2, side: "player1", source: { groupKey: "B", groupRank: 1 } },
      { matchPosition: 2, side: "player2", source: { groupKey: "A", groupRank: 2 } },
    ],
  },
  {
    name: "4 groups with 1 qualifier",
    groupCount: 4,
    qualifiersPerGroup: 1,
    expected: [
      { matchPosition: 1, side: "player1", source: { groupKey: "A", groupRank: 1 } },
      { matchPosition: 1, side: "player2", source: { groupKey: "B", groupRank: 1 } },
      { matchPosition: 2, side: "player1", source: { groupKey: "C", groupRank: 1 } },
      { matchPosition: 2, side: "player2", source: { groupKey: "D", groupRank: 1 } },
    ],
  },
  {
    name: "4 groups with 2 qualifiers",
    groupCount: 4,
    qualifiersPerGroup: 2,
    expected: [
      { matchPosition: 1, side: "player1", source: { groupKey: "A", groupRank: 1 } },
      { matchPosition: 1, side: "player2", source: { groupKey: "B", groupRank: 2 } },
      { matchPosition: 2, side: "player1", source: { groupKey: "C", groupRank: 1 } },
      { matchPosition: 2, side: "player2", source: { groupKey: "D", groupRank: 2 } },
      { matchPosition: 3, side: "player1", source: { groupKey: "B", groupRank: 1 } },
      { matchPosition: 3, side: "player2", source: { groupKey: "A", groupRank: 2 } },
      { matchPosition: 4, side: "player1", source: { groupKey: "D", groupRank: 1 } },
      { matchPosition: 4, side: "player2", source: { groupKey: "C", groupRank: 2 } },
    ],
  },
];

const sourceKey = (slot: GroupPlayoffSlot) =>
  `${slot.source.groupKey}:${slot.source.groupRank}`;

describe("buildGroupPlayoffSlots", () => {
  for (const variant of variants) {
    test(`builds exact deterministic slots for ${variant.name}`, () => {
      const first = buildGroupPlayoffSlots(variant);
      const second = buildGroupPlayoffSlots(variant);
      assert.equal(first.ok, true);
      assert.deepEqual(first, second);
      if (!first.ok) return;

      assert.deepEqual(first.slots, variant.expected);
      assert.equal(first.slots.length, variant.groupCount * variant.qualifiersPerGroup);

      const sourceKeys = first.slots.map(sourceKey);
      assert.equal(new Set(sourceKeys).size, sourceKeys.length);

      const matches = new Map<number, GroupPlayoffSlot[]>();
      for (const slot of first.slots) {
        const match = matches.get(slot.matchPosition) ?? [];
        match.push(slot);
        matches.set(slot.matchPosition, match);
      }
      for (const match of matches.values()) {
        assert.equal(match.length, 2);
        assert.notEqual(match[0].source.groupKey, match[1].source.groupKey);
      }

      if (variant.qualifiersPerGroup === 2) {
        const matchCount = matches.size;
        const firstHalfLastMatch = matchCount / 2;
        for (const groupKey of ["A", "B", ...(variant.groupCount === 4 ? ["C", "D"] : [])]) {
          const positions: number[] = first.slots
            .filter((slot) => slot.source.groupKey === groupKey)
            .map((slot) => slot.matchPosition);
          assert.equal(positions.length, 2);
          assert.notEqual(
            positions[0] <= firstHalfLastMatch,
            positions[1] <= firstHalfLastMatch,
          );
        }
      }
    });
  }

  test("rejects a fifth unsupported variant", () => {
    const result = buildGroupPlayoffSlots({ groupCount: 3, qualifiersPerGroup: 2 });
    assert.deepEqual(result, {
      ok: false,
      error: {
        code: "UNSUPPORTED_GROUP_PLAYOFF_VARIANT",
        message: "Only 2 or 4 equal groups with 1 or 2 qualifiers per group are supported.",
      },
    });
  });
});
