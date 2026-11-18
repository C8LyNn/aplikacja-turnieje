import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bestOfForMatchRules,
  describeMatchRules,
  evaluateSetMatch,
  MATCH_RULE_PRESETS,
  parseMatchRules,
  setMatchProgress,
  setState,
  validateMatchRulesForStage,
  type SetMatchRules,
} from "@workspace/match-rules";

const to11: SetMatchRules = { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 };
const to11noLead: SetMatchRules = { ...to11, winBy: 1 };
const set = (score1: number, score2: number) => ({ score1, score2 });

test("a set ends exactly at the target with the lead, or exactly when the lead is reached after it", () => {
  assert.deepEqual(setState(set(11, 9), to11), { kind: "finished", winner: 1 });
  assert.deepEqual(setState(set(5, 11), to11), { kind: "finished", winner: 2 });
  assert.deepEqual(setState(set(12, 10), to11), { kind: "finished", winner: 1 });
  assert.deepEqual(setState(set(15, 17), to11), { kind: "finished", winner: 2 });
  assert.equal(setState(set(11, 10), to11).kind, "in_progress", "lead of one is not enough");
  assert.equal(setState(set(13, 13), to11).kind, "in_progress");
  assert.equal(setState(set(10, 4), to11).kind, "in_progress");
  const overshoot = setState(set(13, 10), to11);
  assert.equal(overshoot.kind === "invalid" && overshoot.problem.code, "SET_SCORE_IMPOSSIBLE");
  const runaway = setState(set(15, 3), to11);
  assert.equal(runaway.kind === "invalid" && runaway.problem.code, "SET_SCORE_IMPOSSIBLE");
  assert.match(runaway.kind === "invalid" ? runaway.problem.message : "", /Set 1: wynik 15:3 jest niemożliwy/);
  // Without a required lead the set ends the moment someone reaches the target.
  assert.deepEqual(setState(set(11, 10), to11noLead), { kind: "finished", winner: 1 });
  assert.equal(setState(set(12, 11), to11noLead).kind, "invalid");
  assert.equal(setState(set(11, 11), to11noLead).kind, "invalid");
  assert.equal(setState(set(-1, 3), to11).kind, "invalid");
  assert.equal(setState(set(1.5, 3), to11).kind, "invalid");
});

test("a match is decided by the required number of sets; nothing may follow the deciding set", () => {
  const won = evaluateSetMatch([set(11, 7), set(9, 11), set(11, 5)], to11);
  assert.ok(won.ok);
  assert.deepEqual(won.ok && { s1: won.value.setsWon1, s2: won.value.setsWon2, p1: won.value.points1, p2: won.value.points2, w: won.value.winnerSide }, { s1: 2, s2: 1, p1: 31, p2: 23, w: 1 });
  const extra = evaluateSetMatch([set(11, 7), set(11, 5), set(4, 11)], to11);
  assert.equal(!extra.ok && extra.problem.code, "SET_AFTER_MATCH_DECIDED");
  const undecided = evaluateSetMatch([set(11, 7), set(9, 11)], to11);
  assert.equal(!undecided.ok && undecided.problem.code, "MATCH_NOT_DECIDED");
  const unfinished = evaluateSetMatch([set(11, 7), set(10, 10)], to11);
  assert.equal(!unfinished.ok && unfinished.problem.code, "SET_NOT_FINISHED");
  const gap = evaluateSetMatch([set(8, 7), set(11, 5), set(11, 3)], to11);
  assert.equal(!gap.ok && gap.problem.code, "SET_NOT_FINISHED", "an unfinished set cannot be followed by another");
  assert.equal(!evaluateSetMatch([], to11).ok && "SETS_REQUIRED", "SETS_REQUIRED");
});

test("progress tells what is missing and whether another set may be added", () => {
  const running = setMatchProgress([set(11, 7), set(6, 4)], to11);
  assert.ok(running.ok);
  assert.equal(running.ok && running.value.canAddSet, false);
  assert.match(running.ok ? running.value.missing : "", /Set 2 trwa \(6:4\)/);
  const between = setMatchProgress([set(11, 7)], to11);
  assert.equal(between.ok && between.value.canAddSet, true);
  assert.match(between.ok ? between.value.missing : "", /zawodnikowi A — 1 set, zawodnikowi B — 2 sety/);
  const done = setMatchProgress([set(11, 7), set(11, 9)], to11);
  assert.equal(done.ok && done.value.decided, true);
  assert.equal(done.ok && done.value.canAddSet, false);
});

test("rules parse strictly, describe themselves plainly and fit the stage", () => {
  assert.deepEqual(parseMatchRules({ kind: "sets", setsToWin: 3, pointsPerSet: 25, winBy: 2 }), { ok: true, value: { version: 1, kind: "sets", setsToWin: 3, pointsPerSet: 25, winBy: 2 } });
  const bad = parseMatchRules({ kind: "sets", setsToWin: 5, pointsPerSet: 2, winBy: 3, extra: 1 });
  assert.equal(bad.ok, false);
  assert.deepEqual(!bad.ok && bad.problems.map((problem) => problem.code).sort(), ["MATCH_RULES_UNKNOWN_FIELD", "POINTS_PER_SET_INVALID", "SETS_TO_WIN_INVALID", "WIN_BY_INVALID"]);
  assert.deepEqual(parseMatchRules(null), { ok: true, value: null });
  assert.equal(describeMatchRules(to11, { bestOf: 3, allowDraws: false }), "Mecz do dwóch wygranych setów. Każdy set do 11 punktów, z przewagą dwóch.");
  assert.equal(describeMatchRules(null, { bestOf: 3, allowDraws: false }), "Mecz do dwóch wygranych gier (seria do 3).");
  assert.equal(describeMatchRules(null, { bestOf: 1, allowDraws: true }), "Mecz to jedna gra; wynik to gole lub punkty, remis jest możliwy.");
  assert.equal(bestOfForMatchRules(to11), 3);
  assert.deepEqual(validateMatchRulesForStage(to11, { format: "round_robin", bestOf: 3, allowDraws: false }), []);
  assert.deepEqual(validateMatchRulesForStage(to11, { format: "round_robin", bestOf: 1, allowDraws: true }).map((problem) => problem.code), ["MATCH_RULES_DRAWS_CONFLICT", "MATCH_RULES_BEST_OF_CONFLICT"]);
  // Preset names describe the rules, never a sport.
  for (const preset of MATCH_RULE_PRESETS) assert.doesNotMatch(preset.label, /siatk|tenis|badminton|squash|ping|volley/i);
});

test("a set stage reads the same tie-breakers as sets; the order and the rules stay as they are", async () => {
  const { describeLeagueRules, withSetTieWording, LEAGUE_TIE_BREAKER_LABELS } = await import("../src/domain/tournament/league-rules");
  const { previewPreset } = await import("../src/domain/tournament/tournament-presets");
  const rules = { version: 1 as const, allowDraws: false, points: { win: 3, draw: 1, loss: 0 }, tieBreakers: ["head_to_head", "score_difference", "scored", "wins"] as const };
  const plain = describeLeagueRules({ ...rules, tieBreakers: [...rules.tieBreakers] });
  const sets = describeLeagueRules({ ...rules, tieBreakers: [...rules.tieBreakers] }, { sets: true });
  assert.match(plain, /mecze bezpośrednie, różnica wyników, zdobyte \(gole\/punkty\), liczba zwycięstw/);
  assert.match(sets, /mecze bezpośrednie, różnica setów, wygrane sety, liczba zwycięstw/);
  assert.equal(withSetTieWording(plain), sets);
  assert.equal(LEAGUE_TIE_BREAKER_LABELS.score_difference, "różnica wyników", "older stages keep their wording");
  const withSets = previewPreset({ presetId: "round_robin", params: { participantCount: 6, setsToWin: 2 } });
  assert.match(withSets.tieRules.join(" "), /różnica setów, wygrane sety/);
  const without = previewPreset({ presetId: "round_robin", params: { participantCount: 6 } });
  assert.match(without.tieRules.join(" "), /różnica wyników, zdobyte \(gole\/punkty\)/);
});
