import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateSwissPairings } from "../src/domain/tournament/swiss";
import type { StandingProjection, StandingsMatch, StandingsPlayer } from "../src/domain/tournament/standings";

// Wave 2 exact fixture: 18 players with equal Swiss match wins, 84 unique
// completed no_contest encounters, and a legal zero-rematch perfect matching.
// PR102 bounded TWO-pair search leaves 1 repeat: the remaining improvement
// requires rearranging THREE current pairs, without increasing score gap.
// no_contest outcomes avoid inventing wins inconsistent with equal standings.
const priorOpponentPairs: ReadonlyArray<readonly [number, number]> = [
  [1, 3], [1, 4], [1, 5], [1, 7], [1, 8], [1, 10], [1, 11], [1, 12],
  [1, 15], [1, 17], [2, 5], [2, 7], [2, 8], [2, 11], [2, 12], [2, 14],
  [2, 17], [2, 18], [3, 4], [3, 6], [3, 7], [3, 8], [3, 10], [3, 14],
  [3, 17], [3, 18], [4, 5], [4, 6], [4, 8], [4, 10], [4, 16], [4, 18],
  [5, 8], [5, 15], [5, 16], [5, 17], [6, 11], [6, 12], [6, 14], [6, 15],
  [7, 8], [7, 10], [7, 11], [7, 16], [7, 18], [8, 9], [8, 11], [8, 12],
  [8, 14], [8, 17], [8, 18], [9, 10], [9, 11], [9, 13], [9, 14], [9, 15],
  [9, 17], [9, 18], [10, 11], [10, 12], [10, 14], [10, 17], [11, 12], [11, 13],
  [11, 15], [11, 17], [12, 13], [12, 14], [12, 15], [12, 16], [12, 17], [13, 14],
  [13, 16], [13, 17], [13, 18], [14, 15], [14, 16], [14, 17], [14, 18], [15, 17],
  [15, 18], [16, 17], [16, 18], [17, 18],
];
const zeroRepeatWitness: ReadonlyArray<readonly [number, number]> = [
  [1, 9], [2, 16], [3, 15], [4, 17], [5, 14],
  [6, 13], [7, 12], [8, 10], [11, 18],
];

function playersAndStandings(size: number): { players: StandingsPlayer[]; standings: StandingProjection[] } {
  const players: StandingsPlayer[] = Array.from({ length: size }, (_, i) => ({
    id: i + 1, name: "Swiss P" + (i + 1), seed: i + 1, status: "active",
  }));
  const standings: StandingProjection[] = players.map((player, index) => ({
    playerId: player.id, playerName: player.name, rankName: null, teamName: null,
    country: null, seed: player.seed ?? null, status: "active", rank: index + 1,
    matchesPlayed: 0, matchWins: 0, matchLosses: 0, gameWins: 0, gameLosses: 0,
    gameDiff: 0, buchholz: 0,
  }));
  return { players, standings };
}

function encounterHistory(): StandingsMatch[] {
  return priorOpponentPairs.map(([player1Id, player2Id]) => ({
    status: "completed", resultType: "no_contest", player1Id, player2Id,
  }));
}

function key(a: number, b: number): string {
  return [a, b].sort((x, y) => x - y).join(":");
}

function countRematches(pairings: ReturnType<typeof generateSwissPairings>): number {
  const history = new Set(priorOpponentPairs.map(([a, b]) => key(a, b)));
  return pairings.filter((pairing) => pairing.player2Id !== null
    && history.has(key(pairing.player1Id, pairing.player2Id))).length;
}

describe("Swiss >16: bounded 3-pair local exchange preserves score-first priority", () => {
  test("18-player dense NC history: zero-repeat matching is feasible and deterministic", () => {
    const { players, standings } = playersAndStandings(18);
    const previousMatches = encounterHistory();
    const witnessKeys = zeroRepeatWitness.map(([a, b]) => key(a, b));
    const historicalKeys = new Set(priorOpponentPairs.map(([a, b]) => key(a, b)));
    assert.equal(priorOpponentPairs.length, 84);
    assert.equal(new Set(witnessKeys).size, 9);
    assert.equal(new Set(zeroRepeatWitness.flat()).size, 18);
    assert.ok(witnessKeys.every((witness) => !historicalKeys.has(witness)));

    const a = generateSwissPairings({ players, standings, previousMatches, round: 11 });
    const b = generateSwissPairings({
      players: [...players].reverse(), standings: [...standings].reverse(),
      previousMatches: [...previousMatches].reverse(), round: 11,
    });
    assert.deepEqual(a, b, "history and input order must not affect outcomes");
    assert.equal(a.length, 9);
    assert.equal(new Set(a.flatMap((p) => [p.player1Id, p.player2Id])).size, 18);
    assert.ok(a.every((p) => p.resultType === null));
    assert.equal(countRematches(a), 0, "zero-repeat feasible; previous 2-pair fallback left 1");
    // Every player has the same 0 wins: all perfect pairings have scoreGap=0.
    assert.ok(a.every((pairing) =>
      standings.find((s) => s.playerId === pairing.player1Id)?.matchWins
      === standings.find((s) => s.playerId === pairing.player2Id)?.matchWins));
  });

  test("65-player repeated BYE and historical opponent types stay deterministic", () => {
    const { players, standings } = playersAndStandings(65);
    const previousMatches: StandingsMatch[] = [
      { status: "completed", resultType: "bye", player1Id: 65, player2Id: null },
      { status: "completed", resultType: "walkover", player1Id: 1, player2Id: 2 },
      { status: "completed", resultType: "no_contest", player1Id: 3, player2Id: 4 },
      { status: "cancelled", resultType: "played", player1Id: 5, player2Id: 6 },
    ];
    const a = generateSwissPairings({ players, standings, previousMatches, round: 6 });
    const b = generateSwissPairings({ players, standings: [...standings].reverse(),
      previousMatches: [...previousMatches].reverse(), round: 6 });
    assert.deepEqual(a, b);
    assert.equal(a.length, 33);
    assert.deepEqual(a.filter((pairing) => pairing.resultType === "bye").map((p) => p.player1Id), [64]);
    const ids = a.flatMap((pairing) => pairing.player2Id == null
      ? [pairing.player1Id] : [pairing.player1Id, pairing.player2Id]);
    assert.equal(ids.length, 65);
    assert.equal(new Set(ids).size, 65);
  });
});
