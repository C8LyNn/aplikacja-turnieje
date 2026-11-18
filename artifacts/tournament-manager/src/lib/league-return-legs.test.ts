import assert from "node:assert/strict";
import { test } from "node:test";
import { returnLegNote, type ScheduleMatchLite } from "./league-return-legs";

const m = (matchId: number, round: number, p1: number, p2: number, score?: [number, number]): ScheduleMatchLite => ({
  matchId, round, player1Id: p1, player2Id: p2, player1Name: p1 === 1 ? "Wilki" : "Orły", player2Name: p2 === 1 ? "Wilki" : "Orły",
  score1: score?.[0] ?? null, score2: score?.[1] ?? null, scheduleState: score ? "completed" : "scheduled",
});

test("V5.10 P2: a home-and-away schedule names the first meeting and the return, with the first result", () => {
  const first = m(1, 1, 1, 2, [2, 1]);
  const back = m(7, 4, 2, 1);
  assert.equal(returnLegNote([first, back], first), "1. mecz · rewanż w kolejce 4");
  assert.equal(returnLegNote([first, back], back), "rewanż · 1. mecz: Wilki 2:1 Orły");
  const unplayed = m(1, 1, 1, 2);
  assert.equal(returnLegNote([unplayed, back], back), "rewanż · 1. mecz (kolejka 1) jeszcze bez wyniku");
  assert.equal(returnLegNote([first], first), null, "a single round robin has no return fixture");
  assert.equal(returnLegNote([first, back], { ...back, player1Id: null }), null);
});
