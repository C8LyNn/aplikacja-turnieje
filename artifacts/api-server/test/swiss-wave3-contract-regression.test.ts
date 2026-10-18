import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateSwissPairings } from "../src/domain/tournament/swiss";
import type {
  StandingProjection,
  StandingsMatch,
  StandingsPlayer,
} from "../src/domain/tournament/standings";

// WEB-005 A80 WAVE3: contract-only tests on PR118. No implementation edits.
// All histories are synthetic and scoped by the CALLER, not by swiss.ts;
// actual HTTP stageId filtering is separately covered by PR61 (PG16 pending).
function field(size: number, groupedScores = false): {
  players: StandingsPlayer[];
  standings: StandingProjection[];
} {
  const players: StandingsPlayer[] = Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    name: "Swiss-" + (index + 1),
    seed: index + 1,
    status: "active",
  }));
  const standings: StandingProjection[] = players.map((player, index) => ({
    playerId: player.id,
    playerName: player.name,
    rankName: null,
    teamName: null,
    country: null,
    seed: player.seed ?? null,
    status: "active",
    rank: index + 1,
    matchesPlayed: 0,
    matchWins: groupedScores ? Math.ceil(size / 4) - Math.floor(index / 4) : 0,
    matchLosses: 0,
    gameWins: 0,
    gameLosses: 0,
    gameDiff: 0,
    buchholz: 0,
  }));
  return { players, standings };
}

function complete(
  first: number,
  second: number | null,
  resultType: "played" | "walkover" | "no_contest" | "bye",
): StandingsMatch {
  return { player1Id: first, player2Id: second, status: "completed", resultType };
}

// Reproducible, non-cryptographic RNG independent of test execution order.
function seededHistory(size: number, seed: number): StandingsMatch[] {
  let state = seed >>> 0;
  const random = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const matches: StandingsMatch[] = [];
  for (let first = 1; first <= size; first += 1) {
    for (let second = first + 1; second <= size; second += 1) {
      if (random() < 0.40) {
        const type = (first + second) % 3 === 0 ? "walkover" : "no_contest";
        matches.push(complete(first, second, type));
      }
    }
  }
  return matches;
}

function key(first: number, second: number): string {
  return first < second ? first + ":" + second : second + ":" + first;
}

function assertCompletePairing(
  pairings: ReturnType<typeof generateSwissPairings>,
  size: number,
  standings: StandingProjection[],
  expectedRound: number,
  expectedGap?: number,
): void {
  const ids: number[] = [];
  let gap = 0;
  const wins = new Map(standings.map((entry) => [entry.playerId, entry.matchWins]));
  let byeCount = 0;
  for (const [index, pairing] of pairings.entries()) {
    assert.equal(pairing.round, expectedRound);
    assert.equal(pairing.matchNumber, index + 1);
    ids.push(pairing.player1Id);
    if (pairing.player2Id === null) {
      byeCount += 1;
      assert.equal(pairing.resultType, "bye");
      continue;
    }
    assert.equal(pairing.resultType, null);
    ids.push(pairing.player2Id);
    gap += Math.abs(wins.get(pairing.player1Id)! - wins.get(pairing.player2Id)!);
  }
  assert.equal(byeCount, size % 2, "one BYE iff the roster is odd");
  assert.equal(pairings.length, Math.ceil(size / 2));
  assert.equal(ids.length, size);
  assert.equal(new Set(ids).size, size, "no player duplicated or omitted");
  assert.deepEqual([...ids].sort((a, b) => a - b),
    Array.from({ length: size }, (_, index) => index + 1));
  if (expectedGap !== undefined) {
    assert.equal(gap, expectedGap, "score-gap priority must not be lost");
  }
}

describe("A80 WAVE3 / Swiss owner S3-S4-S4H contract-only regression", () => {
  // >16 crosses exact-DP boundary, 64/65 crosses extra 3-pair search limit,
  // 66 exercises the >32 paired-slot branch, 128 bounds the fallback path.
  for (const size of [18, 32, 64, 65, 66, 128]) {
    test("dense completed-history stability for " + size + " participants", () => {
      const { players, standings } = field(size, true);
      const previousMatches = seededHistory(size, 20261018 + size);
      const args = { players, standings, previousMatches, round: 7 };
      const actual = generateSwissPairings(args);
      const reordered = generateSwissPairings({
        players: [...players].reverse(),
        standings: [...standings].reverse(),
        previousMatches: [...previousMatches].reverse(),
        round: 7,
      });
      assert.deepEqual(actual, reordered,
        "same competition must give the same results independent of DB row order");
      assertCompletePairing(actual, size, standings, 7, 0);
    });
  }

  test("same players in stages A and B: A's prior BYE must not enter B's input", () => {
    const { players, standings } = field(21);
    // Stage B history: completed walkover/no_contest are earlier opponents.
    const bHistory: StandingsMatch[] = [
      complete(1, 2, "walkover"),
      complete(3, 4, "no_contest"),
      { status: "cancelled", resultType: "played", player1Id: 5, player2Id: 6 },
    ];
    const aHistory: StandingsMatch[] = [complete(21, null, "bye")];
    const legalB = generateSwissPairings({
      players, standings, previousMatches: bHistory, round: 2,
    });
    assertCompletePairing(legalB, 21, standings, 2);
    assert.deepEqual(legalB.filter((item) => item.resultType === "bye")
      .map((item) => item.player1Id), [21],
      "lowest B-ranked player is eligible despite previous BYE in A");

    // Deliberately wrong input proves WHY the caller's stageId filter matters.
    // This is NOT a claim that the pure generator can identify other stages.
    const contaminated = generateSwissPairings({
      players, standings,
      previousMatches: [...bHistory, ...aHistory],
      round: 2,
    });
    assert.deepEqual(contaminated.filter((item) => item.resultType === "bye")
      .map((item) => item.player1Id), [20],
      "tournament-wide history would corrupt B-stage BYE fairness");
  });

  test("one-stage BYE exhaustion is count-first, bottom standing second", () => {
    const { players, standings } = field(19);
    const history = players.map((player) => complete(player.id, null, "bye"));
    history.push(complete(19, null, "bye"));
    const first = generateSwissPairings({
      players, standings, previousMatches: history, round: 22,
    });
    assert.equal(first.at(-1)?.player1Id, 18);
    history.push(complete(18, null, "bye"));
    const second = generateSwissPairings({
      players, standings, previousMatches: history, round: 23,
    });
    assert.equal(second.at(-1)?.player1Id, 17);
    assertCompletePairing(first, 19, standings, 22);
    assertCompletePairing(second, 19, standings, 23);
  });

  test("completed NC/walkover matter; cancelled/pending/postponed do not", () => {
    const { players, standings } = field(18);
    const prior = [complete(1, 2, "no_contest"), complete(3, 4, "walkover")];
    const baseline = generateSwissPairings({
      players, standings, previousMatches: prior, round: 3,
    });
    const ignored: StandingsMatch[] = [
      { status: "cancelled", resultType: "played", player1Id: 5, player2Id: 6 },
      { status: "pending", resultType: "played", player1Id: 7, player2Id: 8 },
      { status: "postponed", resultType: "no_contest", player1Id: 9, player2Id: 10 },
    ];
    const withIgnored = generateSwissPairings({
      players, standings, previousMatches: [...prior, ...ignored], round: 3,
    });
    assert.deepEqual(baseline, withIgnored);
    assertCompletePairing(baseline, 18, standings, 3, 0);
    const pairs = new Set(baseline.filter((item) => item.player2Id !== null)
      .map((item) => key(item.player1Id, item.player2Id!)));
    assert.equal(pairs.has(key(1, 2)), false);
    assert.equal(pairs.has(key(3, 4)), false);
  });

  test("BYEs have no phantom opponent; unrelated stage history is caller-owned", () => {
    const { players, standings } = field(18);
    const withBye = generateSwissPairings({
      players, standings, previousMatches: [complete(1, null, "bye")], round: 4,
    });
    const clean = generateSwissPairings({
      players, standings, previousMatches: [], round: 4,
    });
    assert.deepEqual(withBye, clean,
      "a historical BYE has no opponent and does not penalize an even roster");
  });
});
