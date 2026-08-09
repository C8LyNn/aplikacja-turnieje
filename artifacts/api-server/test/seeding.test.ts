import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  assignSeeds,
  deterministicShuffle,
  type SeedableEntry,
} from "../src/domain/tournament/seeding";

const entries: SeedableEntry[] = [
  { participantKey: "p1", displayName: "Żaneta", registrationOrder: 1, previousSeed: 3, manualSeed: 2 },
  { participantKey: "p2", displayName: "adam", registrationOrder: 2, previousSeed: 1, manualSeed: 3 },
  { participantKey: "p3", displayName: "Bartek", registrationOrder: 3, previousSeed: 2, manualSeed: 1 },
];

function order(result: ReturnType<typeof assignSeeds>): string[] {
  assert.equal(result.ok, true);
  return result.ok ? result.seeded.map(({ entry }) => entry.participantKey) : [];
}

describe("assignSeeds", () => {
  test("supports registration, alphabetical, preserved and manual seed orders", () => {
    assert.deepEqual(order(assignSeeds(entries, { type: "registration_order" })), ["p1", "p2", "p3"]);
    assert.deepEqual(order(assignSeeds(entries, { type: "alphabetical", locale: "pl" })), ["p2", "p3", "p1"]);
    assert.deepEqual(order(assignSeeds(entries, { type: "preserve" })), ["p2", "p3", "p1"]);
    assert.deepEqual(order(assignSeeds(entries, { type: "manual" })), ["p3", "p1", "p2"]);
  });

  test("random seeding is reproducible and stores an audit order", () => {
    const first = assignSeeds(entries, { type: "random", randomSeed: "draw-2026-07-19" });
    const second = assignSeeds(entries, { type: "random", randomSeed: "draw-2026-07-19" });
    const other = assignSeeds(entries, { type: "random", randomSeed: "different-draw" });
    assert.deepEqual(first, second);
    assert.equal(first.ok, true);
    assert.equal(other.ok, true);
    if (!first.ok || !other.ok) return;
    assert.equal(first.audit.randomSeed, "draw-2026-07-19");
    assert.deepEqual(first.audit.participantOrder, first.seeded.map(({ entry }) => entry.participantKey));
    assert.deepEqual(first.audit.draws.map((draw) => draw.participantKey), ["p1", "p2", "p3"]);
    assert.deepEqual(
      [...first.audit.draws.map((draw) => draw.seed)].sort((left, right) => left - right),
      [1, 2, 3],
    );
    assert.notDeepEqual(first.audit.participantOrder, other.audit.participantOrder);
  });

  test("sequential random draw assigns one remaining seed to each participant in list order", () => {
    const drawEntries = Array.from({ length: 24 }, (_, index) => ({
      participantKey: `player-${index + 1}`,
      registrationOrder: index + 1,
    }));
    const result = assignSeeds(drawEntries, {
      type: "random",
      randomSeed: "public-wheel-draw",
      revealOrder: "participant_order",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.audit.draws.length, 24);
    assert.deepEqual(
      result.audit.draws.map((draw) => draw.participantKey),
      drawEntries.map((entry) => entry.participantKey),
    );
    assert.equal(new Set(result.audit.draws.map((draw) => draw.seed)).size, 24);
    assert.deepEqual(
      result.seeded.map(({ seed }) => seed),
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
  });

  test("rank bands cannot be crossed by a lower place even with better metrics", () => {
    const result = assignSeeds([
      { participantKey: "a1", rankBand: 1, previousSeed: 4, metrics: { score: 50 } },
      { participantKey: "b1", rankBand: 1, previousSeed: 1, metrics: { score: 40 } },
      { participantKey: "a2", rankBand: 2, previousSeed: 2, metrics: { score: 100 } },
      { participantKey: "b2", rankBand: 2, previousSeed: 3, metrics: { score: 90 } },
    ], {
      type: "rank_bands",
      withinBand: [
        { field: "metric:score", direction: "descending" },
        { field: "previous_seed", direction: "ascending" },
      ],
    });
    assert.deepEqual(order(result), ["a1", "b1", "a2", "b2"]);
  });

  test("ordered criteria support missing values and deterministic random final ties", () => {
    const result = assignSeeds([
      { participantKey: "a", metrics: { rating: 100 } },
      { participantKey: "b", metrics: { rating: 100 } },
      { participantKey: "c", metrics: { rating: null } },
    ], {
      type: "ordered_criteria",
      criteria: [{ field: "metric:rating", direction: "descending" }],
      randomSeed: "tie-break",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.seeded.at(-1)?.entry.participantKey, "c");
    assert.deepEqual(result, assignSeeds([
      { participantKey: "a", metrics: { rating: 100 } },
      { participantKey: "b", metrics: { rating: 100 } },
      { participantKey: "c", metrics: { rating: null } },
    ], {
      type: "ordered_criteria",
      criteria: [{ field: "metric:rating", direction: "descending" }],
      randomSeed: "tie-break",
    }));
  });

  test("rejects incomplete or duplicate manual seed assignments", () => {
    const result = assignSeeds([
      { participantKey: "a", manualSeed: 1 },
      { participantKey: "b", manualSeed: 1 },
    ], { type: "manual" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.problems.some((problem) => problem.code === "INVALID_MANUAL_SEED"), true);
  });
});

describe("deterministicShuffle", () => {
  test("does not mutate input and is portable for a fixed seed", () => {
    const source = [1, 2, 3, 4, 5, 6];
    const shuffled = deterministicShuffle(source, "fixed");
    assert.deepEqual(source, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(shuffled, deterministicShuffle(source, "fixed"));
    assert.deepEqual([...shuffled].sort((a, b) => a - b), source);
  });
});
