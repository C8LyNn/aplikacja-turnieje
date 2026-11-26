/**
 * V6.2 · group → play-off seeding and points-table qualification:
 *  - qualifiers from one group meet as late as possible in a seeded bracket (two per group: at the earliest in
 *    the final; ADR_TOURNAMENT_STAGES_V1 §9), only by exchanging seeds within the same group place;
 *  - groups with league rules compare qualifiers by points per match first (draws and adjustments count);
 *  - a round robin ranked by league points calls a basket boundary tied only when seed alone separated it.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  seedQualifiedGroupEntries,
  seedQualifiedGroupEntriesGlobally,
  separateGroupMatesInBracket,
  type GroupStageRankingEntry,
} from "../src/domain/tournament/group-stage";
import { nextPowerOfTwo, standardBracketSeedOrder } from "../src/domain/tournament/stage-placement";
import {
  buildQualificationProposal,
  hasTieAtBoundary,
  type ScoredParticipant,
} from "../src/domain/tournament/stage-basket-qualification";

interface Seeded { groupKey: string; groupRank: number; nextStageSeed: number }

const label = (entry: { groupKey: string; groupRank: number }) => `${entry.groupKey}${entry.groupRank}`;

/** Bands in the given order with consecutive seeds, e.g. [["A","B"],["B","A"]] → A1 #1, B1 #2, B2 #3, A2 #4. */
function bands(order: string[][]): Seeded[] {
  let seed = 0;
  return order.flatMap((keys, index) => keys.map((groupKey) => ({ groupKey, groupRank: index + 1, nextStageSeed: ++seed })));
}

/** First-round pairs of the standard seeded bracket ("bye" for an empty slot). */
function firstRound(entries: readonly Seeded[]): string[] {
  const bySeed = new Map(entries.map((entry) => [entry.nextStageSeed, label(entry)]));
  const order = standardBracketSeedOrder(nextPowerOfTwo(entries.length));
  const pairs: string[] = [];
  for (let index = 0; index < order.length; index += 2) {
    pairs.push(`${bySeed.get(order[index]!) ?? "bye"}-${bySeed.get(order[index + 1]!) ?? "bye"}`);
  }
  return pairs;
}

/** Earliest round in which two seeds can meet (1 = first round, log2(size) = final). */
function meetingRound(size: number, left: number, right: number): number {
  const slot = new Map(standardBracketSeedOrder(size).map((seed, index) => [seed, index]));
  const a = slot.get(left)!;
  const b = slot.get(right)!;
  let round = 1;
  while (a >> round !== b >> round) round += 1;
  return round;
}

function noGroupPairInFirstRound(entries: readonly Seeded[]): boolean {
  return firstRound(entries).every((pair) => {
    const [left, right] = pair.split("-");
    return left === "bye" || right === "bye" || left![0] !== right![0];
  });
}

function earliestGroupMeeting(entries: readonly Seeded[]): number {
  const size = nextPowerOfTwo(entries.length);
  let earliest = Number.POSITIVE_INFINITY;
  for (const left of entries) {
    for (const right of entries) {
      if (left === right || left.groupKey !== right.groupKey) continue;
      earliest = Math.min(earliest, meetingRound(size, left.nextStageSeed, right.nextStageSeed));
    }
  }
  return earliest;
}

describe("V6.2 · qualifiers from one group are kept apart in the play-off bracket", () => {
  test("two groups, two qualifiers: winners keep their seeds and the semi-finals are A1–B2 and B1–A2", () => {
    // The V6.1 audit case: B2 had the better record of the runners-up, so 1v4 and 2v3 were both group re-matches.
    const incoming = bands([["A", "B"], ["B", "A"]]);
    assert.deepEqual(firstRound(incoming), ["A1-A2", "B1-B2"]);
    const separated = separateGroupMatesInBracket(incoming);
    assert.deepEqual(firstRound(separated), ["A1-B2", "B1-A2"]);
    assert.deepEqual(separated.filter((entry) => entry.groupRank === 1), incoming.filter((entry) => entry.groupRank === 1));
    assert.equal(earliestGroupMeeting(separated), 2, "they can meet again only in the final");
  });

  test("an order that already separates the groups is returned unchanged", () => {
    const incoming = bands([["A", "B"], ["A", "B"]]);
    assert.deepEqual(firstRound(incoming), ["A1-B2", "B1-A2"]);
    assert.deepEqual(separateGroupMatesInBracket(incoming), incoming);
  });

  test("four groups, two qualifiers: every runner-up is in the half opposite to its group winner", () => {
    const incoming = bands([["C", "A", "D", "B"], ["A", "C", "B", "D"]]);
    const separated = separateGroupMatesInBracket(incoming);
    assert.equal(earliestGroupMeeting(separated), 3, "group mates can meet only in the final of 8");
    assert.deepEqual(
      separated.filter((entry) => entry.groupRank === 1).map((entry) => [label(entry), entry.nextStageSeed]),
      [["C1", 1], ["A1", 2], ["D1", 3], ["B1", 4]],
    );
    assert.deepEqual(
      separated.filter((entry) => entry.groupRank === 2).map((entry) => entry.nextStageSeed).sort((a, b) => a - b),
      [5, 6, 7, 8],
    );
  });

  test("three groups (play-off with BYEs): no group pair in the first round, group mates meet at the earliest in the final", () => {
    for (const order of [[["A", "B", "C"], ["A", "B", "C"]], [["C", "B", "A"], ["A", "B", "C"]], [["B", "A", "C"], ["C", "A", "B"]]]) {
      const separated = separateGroupMatesInBracket(bands(order));
      assert.ok(noGroupPairInFirstRound(separated), firstRound(separated).join(", "));
      assert.equal(earliestGroupMeeting(separated), 3);
    }
  });

  test("three qualifiers per group: never two of one group in the first round", () => {
    const incoming = bands([["A", "B", "C", "D"], ["D", "C", "B", "A"], ["A", "B", "C", "D"]]);
    const separated = separateGroupMatesInBracket(incoming);
    assert.ok(noGroupPairInFirstRound(separated), firstRound(separated).join(", "));
    assert.equal(earliestGroupMeeting(separated), 3, "with three per group in a bracket of 16, the semi-final at the earliest");
  });

  test("scattered seeds of one place (overall ranking) are exchanged only among that place", () => {
    // Overall ranking: A1 #1, B2 #2, B1 #3, A2 #4 → 1v4 A1–A2 and 2v3 B2–B1; only the runners-up may swap.
    const incoming: Seeded[] = [
      { groupKey: "A", groupRank: 1, nextStageSeed: 1 },
      { groupKey: "B", groupRank: 2, nextStageSeed: 2 },
      { groupKey: "B", groupRank: 1, nextStageSeed: 3 },
      { groupKey: "A", groupRank: 2, nextStageSeed: 4 },
    ];
    const separated = separateGroupMatesInBracket(incoming);
    assert.deepEqual(separated.map((entry) => [label(entry), entry.nextStageSeed]), [["A1", 1], ["B2", 4], ["B1", 3], ["A2", 2]]);
    assert.equal(earliestGroupMeeting(separated), 2);
  });

  test("one qualifier per group, or only two qualifiers, changes nothing; the result is deterministic", () => {
    const winnersOnly = bands([["B", "A", "D", "C"]]);
    assert.deepEqual(separateGroupMatesInBracket(winnersOnly), winnersOnly);
    const final = bands([["A", "B"]]);
    assert.deepEqual(separateGroupMatesInBracket(final), final);
    const incoming = bands([["E", "A", "C", "B", "D"], ["B", "D", "A", "E", "C"]]);
    assert.deepEqual(separateGroupMatesInBracket(incoming), separateGroupMatesInBracket(incoming));
  });
});

function entry(playerId: number, groupKey: string, groupRank: number, record: Partial<GroupStageRankingEntry>): GroupStageRankingEntry {
  return { playerId, groupKey, groupRank, stageSeed: playerId, matchWins: 0, matchLosses: 0, gameWins: 0, gameLosses: 0, gameDiff: 0, ...record };
}

describe("V6.2 · groups with league rules seed the play-off by points", () => {
  // The V6.1 audit case (3/1/0, draws): A: P1 1W 1D 4 pts (3:0), P4 1W 1D 4 pts (1:0); B: P2 2W 6 pts (2:0), P3 1W 1L 3 pts.
  const league = [
    entry(1, "A", 1, { matchWins: 1, matchDraws: 1, matchLosses: 0, gameWins: 3, gameLosses: 0, gameDiff: 3, points: 4 }),
    entry(2, "B", 1, { matchWins: 2, matchDraws: 0, matchLosses: 0, gameWins: 2, gameLosses: 0, gameDiff: 2, points: 6 }),
    entry(3, "B", 2, { matchWins: 1, matchDraws: 0, matchLosses: 1, gameWins: 1, gameLosses: 1, gameDiff: 0, points: 3 }),
    entry(4, "A", 2, { matchWins: 1, matchDraws: 1, matchLosses: 0, gameWins: 1, gameLosses: 0, gameDiff: 1, points: 4 }),
  ];
  const order = (seeded: Array<{ playerId: number; nextStageSeed: number }>) =>
    [...seeded].sort((left, right) => left.nextStageSeed - right.nextStageSeed).map((item) => item.playerId);

  test("group winners: 6 points ahead of 4 points (a draw is a played match, not a missing one)", () => {
    assert.deepEqual(order(seedQualifiedGroupEntries(league)), [2, 1, 4, 3]);
  });

  test("overall ranking: points per match first, then the earlier criteria", () => {
    assert.deepEqual(order(seedQualifiedGroupEntriesGlobally(league)), [2, 1, 4, 3]);
  });

  test("point adjustments count, because the table points include them", () => {
    const penalised = league.map((item) => (item.playerId === 2 ? { ...item, points: 3 } : item));
    assert.deepEqual(order(seedQualifiedGroupEntries(penalised)), [1, 2, 4, 3]);
  });

  test("groups without league rules keep the earlier order (no points, no draws)", () => {
    const classic = [
      entry(1, "A", 1, { matchWins: 2, matchLosses: 0, gameWins: 4, gameLosses: 0, gameDiff: 4 }),
      entry(2, "B", 1, { matchWins: 2, matchLosses: 0, gameWins: 4, gameLosses: 2, gameDiff: 2 }),
      entry(3, "B", 2, { matchWins: 1, matchLosses: 1, gameWins: 3, gameLosses: 2, gameDiff: 1 }),
      entry(4, "A", 2, { matchWins: 1, matchLosses: 1, gameWins: 2, gameLosses: 3, gameDiff: -1 }),
    ];
    assert.deepEqual(order(seedQualifiedGroupEntries(classic)), [1, 2, 3, 4]);
    assert.deepEqual(order(seedQualifiedGroupEntriesGlobally(classic)), [1, 2, 3, 4]);
  });
});

function scored(playerId: number, rank: number, decidedBy: string | null): ScoredParticipant {
  // Same wins, goals and goal difference for everybody: only the points table tells them apart.
  return { playerId, rank, stageSeed: playerId, matchWins: 1, gameWins: 2, gameDiff: -1, buchholz: null, decidedBy };
}

describe("V6.2 · a points table decides ties at a basket boundary", () => {
  test("rows separated by points or a tie-breaker are not a tie; rows separated by seed alone are", () => {
    for (const [decidedBy, tie] of [["points", false], ["head_to_head", false], ["score_difference", false], ["wins", false], ["seed", true]] as const) {
      const ranked = [scored(1, 1, null), scored(2, 2, decidedBy)];
      assert.equal(hasTieAtBoundary({ format: "round_robin", ranked, boundaryAfterIndex: 0, rawMatches: [], leagueTable: true }), tie, decidedBy);
    }
  });

  test("without league rules the earlier round-robin check is unchanged", () => {
    const ranked = [scored(1, 1, null), scored(2, 2, "points")];
    assert.equal(hasTieAtBoundary({ format: "round_robin", ranked, boundaryAfterIndex: 0, rawMatches: [] }), true);
  });

  test("the V6.1 audit table (4 pts vs 3 pts at the boundary) produces a proposal", () => {
    const ranked = [scored(1, 1, null), scored(2, 2, "points"), scored(3, 3, "points"), scored(4, 4, "head_to_head")];
    const result = buildQualificationProposal({
      format: "round_robin",
      ranked,
      outputBaskets: [{ id: "league-out", order: 1, qualifierCount: 2 }],
      rawMatches: [],
      leagueTable: true,
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok ? result.entries.map((item) => item.playerId) : [], [1, 2]);
  });
});
