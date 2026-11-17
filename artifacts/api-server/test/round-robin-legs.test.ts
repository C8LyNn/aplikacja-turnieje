import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateRoundRobinSchedule, normaliseRoundRobinLegs } from "../src/domain/tournament/round-robin";
import { rankRoundRobinOrGroup } from "../src/domain/tournament/stage-ranking";
import { validateTournamentStagePlan } from "../src/domain/tournament/tournament-stage-plan";
import { previewPreset, PLANNED_PRESETS } from "../src/domain/tournament/tournament-presets";
import { validateAiTournamentConfig } from "../src/domain/tournament/ai-tournament-config";

const players = (n: number) => Array.from({ length: n }, (_, index) => ({ id: index + 1, seed: index + 1 }));
const pairKey = (a: number, b: number) => [a, b].sort((x, y) => x - y).join(":");

describe("V5-C: home-and-away schedule", () => {
  for (const n of [2, 3, 4, 5, 8, 9]) {
    test(`${n} participants: every pair meets exactly twice with swapped sides`, () => {
      const single = generateRoundRobinSchedule(players(n));
      const double = generateRoundRobinSchedule(players(n), 2);
      const rounds = n % 2 === 0 ? n - 1 : n;
      assert.equal(double.length, single.length * 2);
      assert.equal(Math.max(...double.map((pairing) => pairing.round)), rounds * 2);
      assert.deepEqual(double.slice(0, single.length), single, "first leg is unchanged");
      const meetings = new Map<string, Array<[number, number]>>();
      for (const pairing of double) {
        const key = pairKey(pairing.player1Id, pairing.player2Id);
        meetings.set(key, [...(meetings.get(key) ?? []), [pairing.player1Id, pairing.player2Id]]);
      }
      assert.equal(meetings.size, (n * (n - 1)) / 2);
      for (const [key, games] of meetings) {
        assert.equal(games.length, 2, key);
        assert.deepEqual(games[1], [games[0][1], games[0][0]], `${key} sides swapped`);
      }
      // Nobody plays twice in the same round.
      for (let round = 1; round <= rounds * 2; round += 1) {
        const ids = double.filter((pairing) => pairing.round === round).flatMap((pairing) => [pairing.player1Id, pairing.player2Id]);
        assert.equal(new Set(ids).size, ids.length, `round ${round}`);
      }
      // Unique (round, matchNumber) slots, as the database requires.
      assert.equal(new Set(double.map((pairing) => `${pairing.round}:${pairing.matchNumber}`)).size, double.length);
    });
  }
  test("legs normalisation is defensive", () => {
    assert.equal(normaliseRoundRobinLegs(2), 2);
    for (const value of [1, 0, 3, null, undefined, "2"]) assert.equal(normaliseRoundRobinLegs(value), 1);
  });
});

describe("V5-C: head-to-head with two legs", () => {
  const entry = (key: string, matchWins: number, stageSeed: number) => ({ participantKey: key, matchWins, gameDiff: 0, gameWins: 0, stageSeed });
  const result = (p1: string, p2: string, winner: string) => ({ participant1Key: p1, participant2Key: p2, winnerKey: winner, status: "completed" as const, resultType: "played" as const });
  test("2–0 in the direct duel separates a two-way tie", () => {
    const ranking = rankRoundRobinOrGroup([entry("a", 3, 1), entry("b", 3, 2), entry("c", 0, 3)], [result("a", "b", "b"), result("b", "a", "b")]);
    assert.ok(ranking.valid);
    if (ranking.valid) assert.deepEqual(ranking.standings.map((standing) => standing.participantKey), ["b", "a", "c"]);
  });
  test("1–1 in the direct duel falls through to the next criteria (seed here)", () => {
    const ranking = rankRoundRobinOrGroup([entry("a", 3, 2), entry("b", 3, 1)], [result("a", "b", "a"), result("b", "a", "b")]);
    assert.ok(ranking.valid);
    if (ranking.valid) assert.deepEqual(ranking.standings.map((standing) => standing.participantKey), ["b", "a"]);
  });
  test("a single leg behaves exactly as before", () => {
    const ranking = rankRoundRobinOrGroup([entry("a", 1, 1), entry("b", 1, 2)], [result("a", "b", "b")]);
    assert.ok(ranking.valid);
    if (ranking.valid) assert.equal(ranking.standings[0].participantKey, "b");
  });
});

describe("V5-C: plan validation, presets and AI import", () => {
  const rr = (legs: unknown, format = "round_robin") => ({
    initialParticipantCount: 6,
    stages: [{ key: "l", position: 1, name: "Liga", format, participantCount: 6, bestOf: 1, legs, ...(format === "swiss" ? { rounds: 3 } : {}) }],
  });
  test("legs is accepted for round robin and kept only when it equals 2", () => {
    const two = validateTournamentStagePlan(rr(2));
    assert.ok(two.valid);
    if (two.valid) assert.equal((two.value.stages[0] as { legs?: number }).legs, 2);
    const one = validateTournamentStagePlan(rr(1));
    assert.ok(one.valid);
    if (one.valid) assert.equal("legs" in one.value.stages[0], false, "V1-compatible shape");
  });
  test("legs is rejected elsewhere or with other values", () => {
    for (const plan of [rr(3), rr("2"), rr(2, "swiss")]) {
      const result = validateTournamentStagePlan(plan);
      assert.equal(result.valid, false);
      if (!result.valid) assert.ok(result.problems.some((problem) => problem.code === "INVALID_ROUND_ROBIN_LEGS"));
    }
  });
  test("home-and-away preset doubles matches and rounds and requires a fixed plan", () => {
    const one = previewPreset({ presetId: "round_robin", params: { participantCount: 6 } });
    const two = previewPreset({ presetId: "round_robin", params: { participantCount: 6, legs: 2 } });
    assert.equal(one.participants.mode, "up_to");
    assert.equal(two.participants.mode, "exact");
    assert.equal(two.totals.matches.min, 30);
    assert.equal(two.totals.rounds.min, 10);
    assert.equal(two.totals.matchesPerParticipant.min, 10);
    assert.equal((two.creation.stagePlan!.stages[0] as { legs?: number }).legs, 2);
    const league = previewPreset({ presetId: "league_playoff", params: { participantCount: 8, legs: 2, advancingCount: 4 } });
    assert.equal(league.totals.matches.min, 56 + 3);
    assert.equal(PLANNED_PRESETS.some((item) => (item.id as string) === "league_home_away"), false, "no longer advertised as planned");
  });
  test("AI files can request home and away for presets and custom round robin stages only", () => {
    const preset = validateAiTournamentConfig({ schemaVersion: 1, kind: "league", participants: { type: "teams", count: 6 }, structure: { type: "preset", presetId: "round_robin", params: { legs: 2 } } });
    assert.ok(preset.valid);
    if (preset.valid) assert.equal(preset.preview.totals.matches.min, 30);
    const custom = validateAiTournamentConfig({ schemaVersion: 1, participants: { count: 8 }, structure: { type: "stages", stages: [
      { label: "Liga", format: "round_robin", legs: 2, advancingCount: 4 },
      { label: "Finały", format: "single_elimination", bestOf: 3 },
    ] } });
    assert.ok(custom.valid, JSON.stringify(!custom.valid && custom.problems));
    if (custom.valid) assert.equal(custom.preview.totals.matches.min, 56 + 3);
    const wrong = validateAiTournamentConfig({ schemaVersion: 1, participants: { count: 8 }, structure: { type: "stages", stages: [{ label: "S", format: "swiss", rounds: 3, legs: 2 }] } });
    assert.equal(wrong.valid, false);
    if (!wrong.valid) assert.ok(wrong.problems.some((problem) => problem.path === "structure.stages[0].legs"));
  });
});
