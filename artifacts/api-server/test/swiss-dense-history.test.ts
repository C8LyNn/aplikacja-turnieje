import assert from "node:assert/strict";
import { test } from "node:test";
import { generateSwissPairings } from "../src/domain/tournament/swiss";
import type { StandingProjection, StandingsMatch, StandingsPlayer } from "../src/domain/tournament/standings";

// PR118 regression: two-pair exchanges alone leave a repeat, although a legal
// zero-repeat matching exists. All 84 historical encounters are no-contests.
const historyPairs: [number, number][] = [
  [1,3],[1,4],[1,5],[1,7],[1,8],[1,10],[1,11],[1,12],[1,15],[1,17],
  [2,5],[2,7],[2,8],[2,11],[2,12],[2,14],[2,17],[2,18],
  [3,4],[3,6],[3,7],[3,8],[3,10],[3,14],[3,17],[3,18],
  [4,5],[4,6],[4,8],[4,10],[4,16],[4,18],
  [5,8],[5,15],[5,16],[5,17],[6,11],[6,12],[6,14],[6,15],
  [7,8],[7,10],[7,11],[7,16],[7,18],
  [8,9],[8,11],[8,12],[8,14],[8,17],[8,18],
  [9,10],[9,11],[9,13],[9,14],[9,15],[9,17],[9,18],
  [10,11],[10,12],[10,14],[10,17],[11,12],[11,13],[11,15],[11,17],
  [12,13],[12,14],[12,15],[12,16],[12,17],
  [13,14],[13,16],[13,17],[13,18],[14,15],[14,16],[14,17],[14,18],
  [15,17],[15,18],[16,17],[16,18],[17,18],
];
function fixture(size: number) {
  const players: StandingsPlayer[] = Array.from({ length: size }, (_, i) => ({
    id: i + 1, name: `P${i + 1}`, seed: i + 1, status: "active",
  }));
  const standings: StandingProjection[] = players.map((player, i) => ({
    playerId: player.id, playerName: player.name, seed: player.seed ?? null,
    rankName: null, teamName: null, country: null, status: "active", rank: i + 1,
    matchesPlayed: 0, matchWins: 0, matchLosses: 0, gameWins: 0, gameLosses: 0, gameDiff: 0, buchholz: 0,
  }));
  return { players, standings };
}
const key = (a: number, b: number) => [a,b].sort((x,y) => x-y).join(":");

test("18-player dense history has no avoidable repeats, omissions or ordering instability", () => {
  const { players, standings } = fixture(18);
  const previousMatches: StandingsMatch[] = historyPairs.map(([player1Id, player2Id]) => ({
    player1Id, player2Id, status: "completed", resultType: "no_contest",
  }));
  const historical = new Set(historyPairs.map(([a,b]) => key(a,b)));
  const witness = [[1,9],[2,16],[3,15],[4,17],[5,14],[6,13],[7,12],[8,10],[11,18]];
  assert.equal(historyPairs.length, 84);
  assert.equal(new Set(witness.flat()).size, 18);
  assert.ok(witness.every(([a,b]) => !historical.has(key(a,b))));
  const result = generateSwissPairings({ players, standings, previousMatches, round: 11 });
  assert.equal(result.length, 9);
  assert.equal(new Set(result.flatMap(p => [p.player1Id, p.player2Id])).size, 18);
  assert.ok(result.every(p => p.player2Id !== null && !historical.has(key(p.player1Id, p.player2Id))));
  assert.deepEqual(result, generateSwissPairings({
    players: [...players].reverse(), standings: [...standings].reverse(),
    previousMatches: [...previousMatches].reverse(), round: 11,
  }));
});

test("65 entrants receive exactly one BYE with no duplicates; prior BYEs rotate", () => {
  const { players, standings } = fixture(65);
  const previousMatches: StandingsMatch[] = [
    { player1Id: 65, player2Id: null, status: "completed", resultType: "bye" },
    { player1Id: 1, player2Id: 2, status: "completed", resultType: "walkover" },
    { player1Id: 3, player2Id: 4, status: "completed", resultType: "no_contest" },
    { player1Id: 5, player2Id: 6, status: "cancelled", resultType: "played" },
  ];
  const result = generateSwissPairings({ players, standings, previousMatches, round: 6 });
  assert.equal(result.length, 33);
  assert.deepEqual(result.filter(p => p.resultType === "bye").map(p => p.player1Id), [64]);
  const ids = result.flatMap(p => p.player2Id === null ? [p.player1Id] : [p.player1Id, p.player2Id]);
  assert.equal(ids.length, 65);
  assert.equal(new Set(ids).size, 65);
  assert.deepEqual(result, generateSwissPairings({ players, standings: [...standings].reverse(), previousMatches, round: 6 }));
});

test("when everyone has a BYE, minimum count wins before lowest standing", () => {
  const { players, standings } = fixture(5);
  const previousMatches: StandingsMatch[] = [1,2,3,4,5,5,4].map(player1Id => ({
    player1Id, player2Id: null, status: "completed", resultType: "bye",
  }));
  assert.equal(generateSwissPairings({ players, standings, previousMatches, round: 8 }).find(p => p.resultType === "bye")?.player1Id, 3);
});
