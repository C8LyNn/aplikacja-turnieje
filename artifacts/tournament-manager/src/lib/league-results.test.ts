import assert from "node:assert/strict";
import { test } from "node:test";
import { checkScore, isDrawResult, matchResultLabel, scoreCap, scoreEntryHint, stageAllowsDraws } from "./league-results";

test("series stages keep the BO rule; draw leagues accept a free score", () => {
  assert.equal(scoreCap(3, false), 2);
  assert.equal(scoreCap(1, true), 999);
  assert.deepEqual(checkScore(2, 1, 3, false), { ok: true, outcome: "player1" });
  assert.equal(checkScore(1, 1, 1, false).ok, false);
  assert.match((checkScore(1, 1, 3, false) as { description: string }).description, /2 wygranych/);
  assert.deepEqual(checkScore(2, 2, 1, true), { ok: true, outcome: "draw" });
  assert.deepEqual(checkScore(0, 0, 1, true), { ok: true, outcome: "draw" });
  assert.deepEqual(checkScore(4, 1, 1, true), { ok: true, outcome: "player1" });
  assert.equal(checkScore(1000, 1, 1, true).ok, false);
  assert.equal(checkScore(-1, 1, 1, true).ok, false);
});

test("result labels say 'remis' only for real draws", () => {
  assert.equal(matchResultLabel({ resultType: "played", score1: 2, score2: 2, winnerId: null }), "2:2 · remis");
  assert.equal(matchResultLabel({ resultType: "played", score1: 2, score2: 1, winnerId: 5 }), "2:1");
  assert.equal(matchResultLabel({ resultType: "walkover", winnerId: 5 }), "W.O.");
  assert.equal(matchResultLabel({ resultType: "no_contest" }), "N/C");
  assert.equal(matchResultLabel({ resultType: "bye", winnerId: 1 }), "BYE");
  assert.equal(isDrawResult({ resultType: "no_contest", score1: null, score2: null, winnerId: null }), false);
});

test("stage rules and hints", () => {
  assert.equal(stageAllowsDraws({ leagueRules: { allowDraws: true } }), true);
  assert.equal(stageAllowsDraws({ leagueRules: null }), false);
  assert.equal(stageAllowsDraws(undefined), false);
  assert.match(scoreEntryHint(1, true), /Równy wynik to remis/);
  assert.match(scoreEntryHint(3, false), /2 wygranych/);
});

test("tie notes explain places decided by a tie-breaker or by seeding", async () => {
  const { standingsTieNotes, standingsHavePoints } = await import("./league-results");
  const rows = [
    { playerId: 1, playerName: "Orły", points: 6, decidedBy: null },
    { playerId: 2, playerName: "Wilki", points: 6, decidedBy: "head_to_head" },
    { playerId: 3, playerName: "Rysie", points: 3, decidedBy: "points" },
    { playerId: 4, playerName: "Sowy", points: 3, decidedBy: "seed", tiedAfterAllRules: true },
  ];
  assert.equal(standingsHavePoints(rows), true);
  assert.deepEqual(standingsTieNotes(rows), [
    "Orły przed Wilki (po 6 pkt): mecze bezpośrednie.",
    "Rysie przed Sowy (po 3 pkt): rozstawienie (remis po wszystkich kryteriach).",
  ]);
  assert.deepEqual(standingsTieNotes([{ playerId: 1, playerName: "A", points: null }]), []);
});
