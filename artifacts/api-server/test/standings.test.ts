import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  calculateMatchRecordStandings,
  type StandingsMatch,
  type StandingsPlayer,
} from "../src/domain/tournament/standings";

const players: StandingsPlayer[] = [
  { id: 1, name: "A", seed: 1, status: "active" },
  { id: 2, name: "B", seed: 2, status: "active" },
  { id: 3, name: "C", seed: 3, status: "active" },
  { id: 4, name: "D", seed: 4, status: "active" },
];

const result = (overrides: Partial<StandingsMatch>): StandingsMatch => ({
  status: "completed",
  resultType: "played",
  player1Id: 1,
  player2Id: 2,
  winnerId: 1,
  score1: 2,
  score2: 1,
  ...overrides,
});

const byId = (standings: ReturnType<typeof calculateMatchRecordStandings>, id: number) =>
  standings.find((standing) => standing.playerId === id)!;

describe("match-derived standings", () => {
  test("played updates match and game records", () => {
    const standings = calculateMatchRecordStandings(players, [result({})], "round_robin");
    assert.deepEqual(
      { ...byId(standings, 1) },
      {
        playerId: 1, playerName: "A", rankName: null, teamName: null, country: null,
        seed: 1, status: "active", rank: 1, matchesPlayed: 1, matchWins: 1,
        matchLosses: 0, gameWins: 2, gameLosses: 1, gameDiff: 1, buchholz: null,
      },
    );
    assert.equal(byId(standings, 2).matchLosses, 1);
    assert.equal(byId(standings, 2).gameDiff, -1);
  });

  test("walkover updates only match record", () => {
    const standings = calculateMatchRecordStandings(players, [result({ resultType: "walkover", score1: null, score2: null })], "swiss");
    assert.equal(byId(standings, 1).matchWins, 1);
    assert.equal(byId(standings, 2).matchLosses, 1);
    assert.equal(byId(standings, 1).gameWins, 0);
    assert.equal(byId(standings, 2).gameLosses, 0);
  });

  test("Swiss bye is one match win without games or opponent Buchholz", () => {
    const standings = calculateMatchRecordStandings(players, [result({ resultType: "bye", player2Id: null, winnerId: 1, score1: null, score2: null })], "swiss");
    assert.equal(byId(standings, 1).matchesPlayed, 1);
    assert.equal(byId(standings, 1).matchWins, 1);
    assert.equal(byId(standings, 1).gameDiff, 0);
    assert.equal(byId(standings, 1).buchholz, 0);
  });

  test("single-elimination bye changes no record", () => {
    const standings = calculateMatchRecordStandings(players, [result({ resultType: "bye", player2Id: null, winnerId: 1, score1: null, score2: null })], "single_elimination");
    assert.equal(byId(standings, 1).matchesPlayed, 0);
    assert.equal(byId(standings, 1).matchWins, 0);
    assert.equal(byId(standings, 1).gameWins, 0);
  });

  test("no contest changes no record", () => {
    const standings = calculateMatchRecordStandings(players, [result({ resultType: "no_contest", winnerId: null, score1: null, score2: null })], "round_robin");
    assert.equal(byId(standings, 1).matchesPlayed, 0);
    assert.equal(byId(standings, 2).matchesPlayed, 0);
  });

  test("round robin uses head-to-head for exactly two players tied on match wins", () => {
    const matches = [
      result({ player1Id: 1, player2Id: 2, winnerId: 2, score1: 1, score2: 2 }),
      result({ player1Id: 1, player2Id: 3, winnerId: 1, score1: 2, score2: 0 }),
      result({ player1Id: 2, player2Id: 4, winnerId: 2, score1: 2, score2: 1 }),
    ];
    const standings = calculateMatchRecordStandings(players, matches, "round_robin");
    assert.equal(standings[0].playerId, 2);
    assert.equal(standings[1].playerId, 1);
  });

  test("round robin uses gameDiff after match wins when more than two are tied", () => {
    const matches = [
      result({ player1Id: 1, player2Id: 4, winnerId: 1, score1: 2, score2: 0 }),
      result({ player1Id: 2, player2Id: 4, winnerId: 2, score1: 2, score2: 1 }),
      result({ player1Id: 3, player2Id: 4, winnerId: 3, score1: 2, score2: 1 }),
    ];
    const standings = calculateMatchRecordStandings(players, matches, "round_robin");
    assert.deepEqual(standings.slice(0, 3).map((standing) => standing.playerId), [1, 2, 3]);
  });

  test("Swiss Buchholz sums opponents' match wins and keeps walkover opponents", () => {
    const matches = [
      result({ player1Id: 1, player2Id: 2, winnerId: 1 }),
      result({ resultType: "walkover", player1Id: 2, player2Id: 3, winnerId: 2, score1: null, score2: null }),
      result({ player1Id: 3, player2Id: 4, winnerId: 3, score1: 2, score2: 0 }),
      result({ resultType: "bye", player1Id: 1, player2Id: null, winnerId: 1, score1: null, score2: null }),
    ];
    const standings = calculateMatchRecordStandings(players, matches, "swiss");
    assert.equal(byId(standings, 1).buchholz, 1);
    assert.equal(byId(standings, 2).buchholz, 3);
    assert.equal(byId(standings, 3).buchholz, 1);
  });

  test("projection exposes no points or draws", () => {
    const [standing] = calculateMatchRecordStandings(players, [], "swiss");
    assert.equal("points" in standing, false);
    assert.equal("draws" in standing, false);
    assert.equal("pointDiff" in standing, false);
  });
});
