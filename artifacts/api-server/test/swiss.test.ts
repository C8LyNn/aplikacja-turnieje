import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateSwissPairings } from "../src/domain/tournament/swiss";
import type { StandingProjection, StandingsPlayer } from "../src/domain/tournament/standings";

const players: StandingsPlayer[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  name: `P${index + 1}`,
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
  matchWins: 5 - index,
  matchLosses: index,
  gameWins: 0,
  gameLosses: 0,
  gameDiff: 0,
  buchholz: 0,
}));

describe("Swiss pairing", () => {
  test("pairs in standings order and gives first bye to the lowest ranked eligible player", () => {
    const pairings = generateSwissPairings({ players, standings, previousMatches: [], round: 1 });
    assert.deepEqual(pairings.slice(0, 2).map((pairing) => [pairing.player1Id, pairing.player2Id]), [[1, 2], [3, 4]]);
    assert.deepEqual(pairings[2], { round: 1, matchNumber: 3, player1Id: 5, player2Id: null, resultType: "bye" });
  });

  test("avoids an immediate rematch within equal score groups", () => {
    const pairings = generateSwissPairings({
      players: players.slice(0, 4),
      standings: standings.slice(0, 4).map(standing => ({ ...standing, matchWins: 0 })),
      previousMatches: [{ status: "completed", player1Id: 1, player2Id: 2, resultType: "played" }],
      round: 2,
    });
    assert.notDeepEqual([pairings[0].player1Id, pairings[0].player2Id], [1, 2]);
  });

  test("score distance has priority over avoiding a rematch", () => {
    const pairings = generateSwissPairings({
      players: players.slice(0, 4),
      standings: standings.slice(0, 4),
      previousMatches: [{ status: "completed", player1Id: 1, player2Id: 2, resultType: "played" }],
      round: 2,
    });
    assert.deepEqual(pairings.map(p => [p.player1Id, p.player2Id]), [[1, 2], [3, 4]]);
  });

  test("does not repeat a bye while another eligible player has none", () => {
    const pairings = generateSwissPairings({
      players,
      standings,
      previousMatches: [{ status: "completed", player1Id: 5, player2Id: null, resultType: "bye" }],
      round: 2,
    });
    const bye = pairings.find((pairing) => pairing.resultType === "bye")!;
    assert.equal(bye.player1Id, 4);
  });

  test("may repeat a bye only after every eligible player already received one", () => {
    const previousMatches = players.map((player) => ({ status: "completed" as const, player1Id: player.id, player2Id: null, resultType: "bye" as const }));
    const pairings = generateSwissPairings({ players, standings, previousMatches, round: 6 });
    assert.equal(pairings.find((pairing) => pairing.resultType === "bye")?.player1Id, 5);
  });
});
