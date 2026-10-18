import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateSwissPairings } from "../src/domain/tournament/swiss";
import type { StandingProjection, StandingsMatch, StandingsPlayer } from "../src/domain/tournament/standings";

// A80 DEVELOPMENT_FIRST: independent large-field regression fixture.
// Score groups of four are isolated by win totals. In each group, the
// deterministic greedy matching chooses (1,2)+(3,4); only the latter pair
// has been played. Exchanging (1,3)+(2,4) keeps score distance ZERO and
// avoids that rematch. There are 8+ such independent exchanges at 32/64.
function field(size: number): {
  players: StandingsPlayer[];
  standings: StandingProjection[];
  history: StandingsMatch[];
} {
  const players: StandingsPlayer[] = Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    name: "Swiss " + (i + 1),
    seed: i + 1,
    status: "active",
  }));
  const standings: StandingProjection[] = players.map((player, i) => ({
    playerId: player.id,
    playerName: player.name,
    rankName: null,
    teamName: null,
    country: null,
    seed: player.seed ?? null,
    status: "active",
    rank: i + 1,
    matchesPlayed: 3,
    matchWins: Math.ceil(size / 4) + 3 - Math.floor(i / 4),
    matchLosses: 0,
    gameWins: 0,
    gameLosses: 0,
    gameDiff: 0,
    buchholz: 0,
  }));
  const history: StandingsMatch[] = [];
  for (let start = 1; start + 3 <= size; start += 4) {
    history.push({
      status: "completed",
      resultType: start % 12 === 1 ? "played" : start % 12 === 5 ? "walkover" : "no_contest",
      player1Id: start + 2,
      player2Id: start + 3,
    });
  }
  // Cancelled fixtures never count as historical opponents.
  history.push({ status: "cancelled", resultType: "played", player1Id: 1, player2Id: 2 });
  return { players, standings, history };
}

function metrics(
  pairings: ReturnType<typeof generateSwissPairings>,
  standings: StandingProjection[],
  history: StandingsMatch[],
): { scoreGap: number; rematches: number; uniqueIds: number; pairedIds: number } {
  const wins = new Map(standings.map((entry) => [entry.playerId, entry.matchWins]));
  const previous = new Set(
    history
      .filter((match) =>
        match.status === "completed" &&
        match.resultType !== "bye" &&
        match.player1Id != null &&
        match.player2Id != null)
      .map((match) => [match.player1Id!, match.player2Id!].sort((a, b) => a - b).join(":")),
  );
  const played = pairings.filter((pairing) => pairing.resultType === null);
  return {
    scoreGap: played.reduce((sum, pair) =>
      sum + Math.abs(wins.get(pair.player1Id)! - wins.get(pair.player2Id!)!), 0),
    rematches: played.filter((pair) =>
      previous.has([pair.player1Id, pair.player2Id!].sort((a, b) => a - b).join(":"))).length,
    uniqueIds: new Set(pairings.flatMap((pair) =>
      pair.player2Id === null ? [pair.player1Id] : [pair.player1Id, pair.player2Id])).size,
    pairedIds: pairings.reduce((count, pair) => count + (pair.player2Id === null ? 1 : 2), 0),
  };
}

describe("Swiss >16 SCORE_GROUP_FIRST bounded fallback: adversarial disjoint local improvements", () => {
  for (const size of [18, 32, 64]) {
    test("field " + size + " closes all independent zero-cost repeat repairs", () => {
      const { players, standings, history } = field(size);
      const actual = generateSwissPairings({ players, standings, previousMatches: history, round: 4 });
      const reversed = generateSwissPairings({
        players: [...players].reverse(),
        standings: [...standings].reverse(),
        previousMatches: [...history].reverse(),
        round: 4,
      });
      assert.deepEqual(actual, reversed, "stable seed/rank/ID tie-break and history order");
      const outcome = metrics(actual, standings, history);
      assert.deepEqual(outcome, {
        scoreGap: 0,
        rematches: 0,
        uniqueIds: size,
        pairedIds: size,
      });
      assert.equal(actual.length, size / 2);
      assert.ok(actual.every((pair) => pair.resultType === null));
    });
  }

  test("odd 65 entrants: minimum completed stage BYE count precedes bottom rank", () => {
    const { players, standings, history } = field(65);
    history.push({ status: "completed", resultType: "bye", player1Id: 65, player2Id: null });
    const actual = generateSwissPairings({ players, standings, previousMatches: history, round: 5 });
    const bye = actual.filter((pair) => pair.resultType === "bye");
    assert.equal(bye.length, 1);
    assert.equal(bye[0].player1Id, 64, "65 already had a BYE; 64 is lowest eligible");
    const outcome = metrics(actual, standings, history);
    assert.equal(outcome.uniqueIds, 65);
    assert.equal(outcome.pairedIds, 65);
  });
});
