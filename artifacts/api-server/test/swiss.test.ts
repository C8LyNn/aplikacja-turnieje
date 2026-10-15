import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateSwissPairings } from "../src/domain/tournament/swiss";
import type { StandingProjection, StandingsMatch, StandingsPlayer } from "../src/domain/tournament/standings";

function fixture(size: number, wins: (index: number) => number = () => 0): {
  players: StandingsPlayer[];
  standings: StandingProjection[];
} {
  const players: StandingsPlayer[] = Array.from({ length: size }, (_, index) => ({
    id: index + 1, name: "P" + (index + 1), seed: index + 1, status: "active",
  }));
  const standings: StandingProjection[] = players.map((player, index) => ({
    playerId: player.id, playerName: player.name, rankName: null,
    teamName: null, country: null, seed: player.seed ?? null,
    status: "active", rank: index + 1, matchesPlayed: 0,
    matchWins: wins(index), matchLosses: 0,
    gameWins: 0, gameLosses: 0, gameDiff: 0, buchholz: 0,
  }));
  return { players, standings };
}

function completed(player1Id: number, player2Id: number | null, resultType: "played" | "walkover" | "no_contest" | "bye"): StandingsMatch {
  return { status: "completed", player1Id, player2Id, resultType };
}

function playingPairs(pairings: ReturnType<typeof generateSwissPairings>): number[][] {
  return pairings.filter((pairing) => pairing.resultType === null)
    .map(({ player1Id, player2Id }) => [player1Id, player2Id!]);
}

function rematchCount(pairs: number[][], prior: StandingsMatch[]): number {
  return pairs.filter(([a, b]) => prior.some((match) =>
    match.status === "completed" && match.resultType !== "bye"
    && ((match.player1Id === a && match.player2Id === b)
      || (match.player1Id === b && match.player2Id === a)))).length;
}

describe("Swiss pairing — owner S3 SCORE_GROUP_FIRST / S4 fair BYE and history", () => {
  test("pairs equal-score players in deterministic standings order; first BYE goes to the lowest-ranked", () => {
    const { players, standings } = fixture(5);
    const pairings = generateSwissPairings({ players, standings, previousMatches: [], round: 1 });
    assert.deepEqual(playingPairs(pairings), [[1, 2], [3, 4]]);
    assert.deepEqual(pairings[2], {
      round: 1, matchNumber: 3, player1Id: 5, player2Id: null, resultType: "bye",
    });
  });

  test("avoids rematches SECOND within equally close score groups", () => {
    const { players, standings } = fixture(4);
    const prior = [completed(1, 2, "played")];
    const pairs = playingPairs(generateSwissPairings({ players, standings, previousMatches: prior, round: 2 }));
    assert.deepEqual(pairs, [[1, 3], [2, 4]]);
    assert.equal(rematchCount(pairs, prior), 0);
  });

  test("SCORE_GROUP_FIRST allows a rematch rather than crossing two different score groups", () => {
    const { players, standings } = fixture(4, (index) => index < 2 ? 2 : 0);
    const prior = [completed(1, 2, "played")];
    const pairs = playingPairs(generateSwissPairings({ players, standings, previousMatches: prior, round: 3 }));
    assert.deepEqual(pairs, [[1, 2], [3, 4]]);
    assert.equal(rematchCount(pairs, prior), 1);
  });

  test("Swiss5 R3: one BYE and zero rematches when no score gap must increase", () => {
    const { players, standings } = fixture(5);
    const prior = [completed(1, 2, "played"), completed(3, 4, "played")];
    const pairings = generateSwissPairings({ players, standings, previousMatches: prior, round: 3 });
    assert.deepEqual(playingPairs(pairings), [[1, 3], [2, 4]]);
    assert.equal(rematchCount(playingPairs(pairings), prior), 0);
    assert.equal(pairings.at(-1)?.player1Id, 5);
  });

  test("Swiss6 R3: deterministic non-greedy zero-repeat solution within tied group", () => {
    const { players, standings } = fixture(6);
    const prior = [
      completed(1, 2, "played"), completed(3, 4, "walkover"),
      completed(5, 6, "played"), completed(1, 3, "played"),
    ];
    const a = generateSwissPairings({ players, standings, previousMatches: prior, round: 3 });
    const b = generateSwissPairings({ players, standings: [...standings].reverse(), previousMatches: [...prior].reverse(), round: 3 });
    assert.deepEqual(a, b);
    assert.equal(rematchCount(playingPairs(a), prior), 0);
    assert.equal(playingPairs(a).length, 3);
  });

  test("Swiss4 forced history chooses the globally minimal ONE repeat; exhaustive history forces TWO", () => {
    const { players, standings } = fixture(4);
    const forced = [
      completed(1, 2, "played"), completed(1, 3, "played"), completed(1, 4, "played"),
      completed(2, 3, "played"), completed(2, 4, "played"),
    ];
    const pairings = generateSwissPairings({ players, standings, previousMatches: forced, round: 5 });
    assert.equal(rematchCount(playingPairs(pairings), forced), 1);
    const exhausted = [...forced, completed(3, 4, "played")];
    assert.equal(rematchCount(playingPairs(generateSwissPairings({
      players, standings, previousMatches: exhausted, round: 6,
    })), exhausted), 2);
  });

  test("repeat BYE stays forbidden while an entrant with zero BYEs exists in the stage", () => {
    const { players, standings } = fixture(5);
    const prior = [completed(5, null, "bye")];
    const pairings = generateSwissPairings({ players, standings, previousMatches: prior, round: 2 });
    assert.equal(pairings.at(-1)?.player1Id, 4);
  });

  test("once everyone had a BYE, minimum BYE count precedes lowest rank", () => {
    const { players, standings } = fixture(5);
    const previousMatches = players.map(({ id }) => completed(id, null, "bye"));
    previousMatches.push(completed(5, null, "bye"));
    const pairings = generateSwissPairings({ players, standings, previousMatches, round: 7 });
    assert.equal(pairings.at(-1)?.player1Id, 4);
    previousMatches.push(completed(4, null, "bye"));
    const next = generateSwissPairings({ players, standings, previousMatches, round: 8 });
    assert.equal(next.at(-1)?.player1Id, 3);
  });

  test("S4 is stage-local: only supplied matches count; other-stage BYEs must be filtered by caller", () => {
    const { players, standings } = fixture(5);
    // The production caller queries matchesTable by stageId. Prior-stage BYEs are absent here.
    assert.equal(generateSwissPairings({ players, standings, previousMatches: [], round: 1 }).at(-1)?.player1Id, 5);
  });

  test("completed no_contest and walkover count as paired; cancelled match does not", () => {
    const { players, standings } = fixture(4);
    for (const resultType of ["played", "no_contest", "walkover"] as const) {
      const prior = [completed(1, 2, resultType)];
      const pairs = playingPairs(generateSwissPairings({ players, standings, previousMatches: prior, round: 2 }));
      assert.equal(rematchCount(pairs, prior), 0, resultType);
      assert.deepEqual(pairs, [[1, 3], [2, 4]], resultType);
    }
    const cancelled: StandingsMatch[] = [{ status: "cancelled", player1Id: 1, player2Id: 2, resultType: "played" }];
    assert.deepEqual(playingPairs(generateSwissPairings({
      players, standings, previousMatches: cancelled, round: 2,
    })), [[1, 2], [3, 4]]);
  });

  test("a completed BYE never creates a phantom prior opponent", () => {
    const { players, standings } = fixture(4);
    const pairs = playingPairs(generateSwissPairings({
      players, standings, previousMatches: [completed(1, null, "bye")], round: 2,
    }));
    assert.deepEqual(pairs, [[1, 2], [3, 4]]);
  });

  test("same-score tournament of 64 finishes via bounded deterministic fallback", () => {
    const { players, standings } = fixture(64, (index) => 15 - Math.floor(index / 4));
    const prior = Array.from({ length: 32 }, (_, index) => completed(index * 2 + 1, index * 2 + 2, "played"));
    const args = { players, standings, previousMatches: prior, round: 5 };
    const a = generateSwissPairings(args);
    const b = generateSwissPairings({ ...args, standings: [...standings].reverse() });
    assert.deepEqual(a, b);
    assert.equal(a.length, 32);
    assert.deepEqual(a.flatMap((pairing) => [pairing.player1Id, pairing.player2Id]).sort((x, y) => x! - y!),
      players.map((player) => player.id));
    const byId = new Map(standings.map((standing) => [standing.playerId, standing.matchWins]));
    assert.ok(playingPairs(a).every(([one, two]) => byId.get(one) === byId.get(two)));
  });

  test("odd 65-player fallback completes once with exactly one stage-local BYE", () => {
    const { players, standings } = fixture(65);
    const pairings = generateSwissPairings({ players, standings, previousMatches: [], round: 1 });
    assert.equal(pairings.length, 33);
    assert.deepEqual(pairings.filter((item) => item.resultType === "bye").map((item) => item.player1Id), [65]);
    const ids = pairings.flatMap((item) => item.player2Id === null ? [item.player1Id] : [item.player1Id, item.player2Id]);
    assert.equal(new Set(ids).size, 65);
  });
});
