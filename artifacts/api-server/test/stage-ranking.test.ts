import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  rankRoundRobinOrGroup,
  rankSwissStage,
  type RankedRoundRobinStageEntry,
  type RankedSwissStageEntry,
  type RoundRobinStageRankingEntry,
  type StageHeadToHeadResult,
  type StageRankingResult,
  type SwissStageRankingEntry,
} from "../src/domain/tournament/stage-ranking";

const swissEntry = (
  participantKey: string,
  stageSeed: number | null | undefined,
  overrides: Partial<SwissStageRankingEntry> = {},
): SwissStageRankingEntry => ({
  participantKey,
  matchWins: 3,
  buchholz: 10,
  gameDiff: 4,
  gameWins: 8,
  stageSeed,
  ...overrides,
});

const rrEntry = (
  participantKey: string,
  stageSeed: number | null | undefined,
  overrides: Partial<RoundRobinStageRankingEntry> = {},
): RoundRobinStageRankingEntry => ({
  participantKey,
  matchWins: 3,
  gameDiff: 4,
  gameWins: 8,
  stageSeed,
  ...overrides,
});

const keys = <T extends { participantKey: string }>(standings: readonly T[]) =>
  standings.map((standing) => standing.participantKey);

function requireValid<T>(result: StageRankingResult<T>): T[] {
  assert.equal(result.valid, true);
  return result.valid ? result.standings : [];
}

describe("rankSwissStage", () => {
  const cases: ReadonlyArray<{
    name: string;
    entries: SwissStageRankingEntry[];
    expected: string[];
  }> = [
    {
      name: "matchWins before every other value",
      entries: [
        swissEntry("A", 1, { matchWins: 2, buchholz: 100, gameDiff: 100, gameWins: 100 }),
        swissEntry("B", 2, { matchWins: 3, buchholz: 0, gameDiff: 0, gameWins: 0 }),
      ],
      expected: ["B", "A"],
    },
    {
      name: "Buchholz after matchWins",
      entries: [swissEntry("A", 1, { buchholz: 5 }), swissEntry("B", 2, { buchholz: 6 })],
      expected: ["B", "A"],
    },
    {
      name: "gameDiff after Buchholz",
      entries: [swissEntry("A", 1, { gameDiff: 1 }), swissEntry("B", 2, { gameDiff: 2 })],
      expected: ["B", "A"],
    },
    {
      name: "gameWins after gameDiff",
      entries: [swissEntry("A", 1, { gameWins: 7 }), swissEntry("B", 2, { gameWins: 8 })],
      expected: ["B", "A"],
    },
    {
      name: "stageSeed as the final tie-break",
      entries: [swissEntry("A", 4), swissEntry("B", 2), swissEntry("C", 3)],
      expected: ["B", "C", "A"],
    },
  ];

  for (const testCase of cases) {
    test(`orders by ${testCase.name}`, () => {
      const standings = requireValid(rankSwissStage(testCase.entries));
      assert.deepEqual(keys(standings), testCase.expected);
      assert.deepEqual(standings.map((standing) => standing.rank), [1, 2, 3].slice(0, standings.length));
    });
  }

  test("does not mutate its input", () => {
    const entries = [swissEntry("A", 2), swissEntry("B", 1, { matchWins: 4 })];
    const snapshot = structuredClone(entries);
    rankSwissStage(entries);
    assert.deepEqual(entries, snapshot);
  });

  test("rejects a missing stageSeed", () => {
    const result = rankSwissStage([swissEntry("A", undefined)]);
    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.problems[0].code, "MISSING_STAGE_SEED");
  });

  test("rejects a duplicate stageSeed", () => {
    const result = rankSwissStage([swissEntry("A", 1), swissEntry("B", 1)]);
    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.problems[0].code, "DUPLICATE_STAGE_SEED");
  });

  test("is deterministic independently of input order", () => {
    const entries = [
      swissEntry("A", 3, { matchWins: 2 }),
      swissEntry("B", 1, { matchWins: 4 }),
      swissEntry("C", 2, { matchWins: 3 }),
    ];
    const forward = requireValid(rankSwissStage(entries));
    const reverse = requireValid(rankSwissStage([...entries].reverse()));
    assert.deepEqual(forward, reverse);
  });
});

describe("rankRoundRobinOrGroup", () => {
  const played = (
    participant1Key: string,
    participant2Key: string,
    winnerKey: string | null,
    resultType: "played" | "walkover" | "no_contest" = "played",
  ): StageHeadToHeadResult => ({
    participant1Key,
    participant2Key,
    winnerKey,
    resultType,
    status: "completed",
  });

  test("orders by matchWins first", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { matchWins: 1, gameDiff: 50 }),
      rrEntry("B", 2, { matchWins: 2, gameDiff: -10 }),
    ], []));
    assert.deepEqual(keys(standings), ["B", "A"]);
  });

  test("uses a decisive head-to-head for exactly two players tied on matchWins", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { gameDiff: 10 }),
      rrEntry("B", 2, { gameDiff: -2 }),
      rrEntry("C", 3, { matchWins: 1 }),
    ], [played("A", "B", "B")]));
    assert.deepEqual(keys(standings).slice(0, 2), ["B", "A"]);
  });

  test("does not use head-to-head for three players tied on matchWins", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { gameDiff: 5 }),
      rrEntry("B", 2, { gameDiff: 5 }),
      rrEntry("C", 3, { gameDiff: 4 }),
    ], [played("A", "B", "B")]));
    assert.deepEqual(keys(standings), ["A", "B", "C"]);
  });

  test("no contest does not decide head-to-head", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { gameDiff: 1 }),
      rrEntry("B", 2, { gameDiff: 2 }),
    ], [played("A", "B", null, "no_contest")]));
    assert.deepEqual(keys(standings), ["B", "A"]);
  });

  test("uses gameDiff when head-to-head is unavailable", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { gameDiff: 1 }),
      rrEntry("B", 2, { gameDiff: 3 }),
    ], []));
    assert.deepEqual(keys(standings), ["B", "A"]);
  });

  test("uses gameWins after gameDiff", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { gameWins: 8 }),
      rrEntry("B", 2, { gameWins: 9 }),
    ], []));
    assert.deepEqual(keys(standings), ["B", "A"]);
  });

  test("uses stageSeed as the final tie-break", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 3),
      rrEntry("B", 1),
      rrEntry("C", 2),
    ], []));
    assert.deepEqual(keys(standings), ["B", "C", "A"]);
  });

  test("accepts a walkover as a decisive head-to-head result", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { gameDiff: 10 }),
      rrEntry("B", 2, { gameDiff: -2 }),
    ], [played("A", "B", "B", "walkover")]));
    assert.deepEqual(keys(standings), ["B", "A"]);
  });

  test("does not reapply head-to-head after gameDiff narrows a three-player tie", () => {
    const standings = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 1, { gameDiff: 5 }),
      rrEntry("B", 2, { gameDiff: 5 }),
      rrEntry("C", 3, { gameDiff: 4 }),
    ], [played("A", "B", "B")]));
    assert.deepEqual(keys(standings), ["A", "B", "C"]);
  });

  test("ranks two groups independently", () => {
    const groupA = requireValid(rankRoundRobinOrGroup([
      rrEntry("A1", 1, { matchWins: 2 }),
      rrEntry("A2", 4, { matchWins: 1 }),
    ], [played("A1", "A2", "A1")]));
    const groupB = requireValid(rankRoundRobinOrGroup([
      rrEntry("B1", 2, { matchWins: 1 }),
      rrEntry("B2", 3, { matchWins: 2 }),
    ], [played("B1", "B2", "B2")]));
    assert.deepEqual(keys(groupA), ["A1", "A2"]);
    assert.deepEqual(keys(groupB), ["B2", "B1"]);
  });

  test("does not mutate entries or head-to-head results", () => {
    const entries = [rrEntry("A", 2), rrEntry("B", 1)];
    const results = [played("A", "B", "A")];
    const entriesSnapshot = structuredClone(entries);
    const resultsSnapshot = structuredClone(results);
    rankRoundRobinOrGroup(entries, results);
    assert.deepEqual(entries, entriesSnapshot);
    assert.deepEqual(results, resultsSnapshot);
  });

  test("rejects duplicate seeds before sorting", () => {
    const result = rankRoundRobinOrGroup([rrEntry("A", 1), rrEntry("B", 1)], []);
    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.problems[0].code, "DUPLICATE_STAGE_SEED");
  });

  test("assigns unique consecutive ranks", () => {
    const standings: RankedRoundRobinStageEntry[] = requireValid(rankRoundRobinOrGroup([
      rrEntry("A", 2),
      rrEntry("B", 1),
      rrEntry("C", 3),
    ], []));
    assert.deepEqual(standings.map((standing) => standing.rank), [1, 2, 3]);
  });
});

test("Swiss output assigns unique consecutive ranks", () => {
  const standings: RankedSwissStageEntry[] = requireValid(rankSwissStage([
    swissEntry("A", 2),
    swissEntry("B", 1),
    swissEntry("C", 3),
  ]));
  assert.deepEqual(standings.map((standing) => standing.rank), [1, 2, 3]);
});
