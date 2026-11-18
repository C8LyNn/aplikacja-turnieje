import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bestOfForMatchRules,
  describeMatchRules,
  describeTie,
  legScoreFromHomeFirst,
  legScoreHomeFirst,
  matchDecisionKind,
  matchRulePresetsFor,
  matchRulesFromStorage,
  parseMatchRules,
  tieAggregate,
  tieState,
  validateDecisionReason,
  validateLegScore,
  validateMatchRulesForStage,
  type LegScore,
} from "@workspace/match-rules";
import { previewPreset, PresetError } from "../src/domain/tournament/tournament-presets";
import { buildAiSpecification, validateAiTournamentConfigText } from "../src/domain/tournament/ai-tournament-config";

const legs = (a: [number, number] | null, b: [number, number] | null): LegScore[] => [
  { leg: 1, status: a ? "completed" : "pending", score1: a?.[0] ?? null, score2: a?.[1] ?? null },
  { leg: 2, status: b ? "completed" : "pending", score1: b?.[0] ?? null, score2: b?.[1] ?? null },
];

test("level B: two-legged rules parse strictly; the level-aggregate policy is only the organizer's decision", () => {
  assert.deepEqual(parseMatchRules({ kind: "two_legs" }), { ok: true, value: { version: 1, kind: "two_legs", levelAggregate: "organizer_decision" } });
  const awayGoals = parseMatchRules({ kind: "two_legs", levelAggregate: "away_goals" });
  assert.equal(awayGoals.ok, false);
  assert.equal(!awayGoals.ok && awayGoals.problems[0].code, "LEVEL_AGGREGATE_POLICY_INVALID");
  const extra = parseMatchRules({ kind: "two_legs", setsToWin: 2 });
  assert.equal(!extra.ok && extra.problems[0].code, "MATCH_RULES_UNKNOWN_FIELD");
  assert.equal(matchRulesFromStorage({ kind: "two_legs", levelAggregate: "organizer_decision", version: 1 })?.kind, "two_legs");
  assert.equal(bestOfForMatchRules({ version: 1, kind: "two_legs", levelAggregate: "organizer_decision" }), 1);
  // Sets keep the V5.7 meaning.
  assert.equal(matchRulesFromStorage({ version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 })?.kind, "sets");
});

test("level B: a two-legged tie runs only in a single-elimination bracket with one game per leg", () => {
  const rules = { version: 1 as const, kind: "two_legs" as const, levelAggregate: "organizer_decision" as const };
  assert.deepEqual(validateMatchRulesForStage(rules, { format: "single_elimination", bestOf: 1, allowDraws: false }), []);
  for (const format of ["round_robin", "group_stage", "swiss", "double_elimination"]) {
    assert.equal(validateMatchRulesForStage(rules, { format, bestOf: 1, allowDraws: false })[0].code, "MATCH_RULES_FORMAT_UNSUPPORTED", format);
  }
  assert.equal(validateMatchRulesForStage(rules, { format: "single_elimination", bestOf: 3, allowDraws: false })[0].code, "MATCH_RULES_BEST_OF_CONFLICT");
  assert.equal(matchDecisionKind(rules, { bestOf: 1, allowDraws: false }), "two_legs");
  assert.equal(matchDecisionKind(null, { bestOf: 3, allowDraws: false }), "series");
  assert.equal(matchDecisionKind(null, { bestOf: 1, allowDraws: true }), "score_draws");
  assert.match(describeMatchRules(rules, { bestOf: 1, allowDraws: false }), /Przy równej sumie rozstrzyga organizator/);
});

test("level A/B: the aggregate, the state and the home-first reading of each leg", () => {
  // A 2:1 B (leg 1, A home), B 3:1 A (leg 2, B home) → stored 1:3 → aggregate A 3:4 B.
  assert.deepEqual(legScoreFromHomeFirst(2, 3, 1), { score1: 1, score2: 3 });
  assert.deepEqual(legScoreHomeFirst({ leg: 2, status: "completed", score1: 1, score2: 3 }), { home: 3, away: 1 });
  const decided = tieAggregate(legs([2, 1], [1, 3]));
  assert.deepEqual([decided.total1, decided.total2, decided.complete, decided.aggregateWinner], [3, 4, true, 2]);
  assert.equal(tieState(legs(null, null), false), "not_started");
  assert.equal(tieState(legs([2, 1], null), false), "first_leg_played");
  assert.equal(tieState(legs([1, 1], [2, 2]), false), "awaiting_decision");
  assert.equal(tieState(legs([1, 1], [2, 2]), true), "decided");
  assert.equal(tieState(legs([2, 1], [1, 3]), false), "decided");
  assert.equal(tieAggregate(legs([1, 1], [2, 2])).aggregateWinner, null, "a level aggregate never names a winner");
  const names = { name1: "Drużyna A", name2: "Drużyna B" };
  assert.equal(describeTie(legs([2, 1], [1, 3]), names, null), "Łącznie 3:4 — awansuje Drużyna B.");
  assert.match(describeTie(legs([1, 1], [2, 2]), names, null), /czeka na rozstrzygnięcie organizatora, awans wstrzymany/);
  assert.match(describeTie(legs([1, 1], [2, 2]), names, { winnerSide: 1, reason: "rzuty karne 5:4" }), /awansuje Drużyna A \(decyzja organizatora: rzuty karne 5:4\)/);
});

test("level A: leg scores and decision reasons are checked", () => {
  assert.deepEqual(validateLegScore(0, 0), { ok: true });
  assert.equal((validateLegScore(-1, 0) as { code: string }).code, "LEG_SCORE_NEGATIVE");
  assert.equal((validateLegScore(1.5, 0) as { code: string }).code, "LEG_SCORE_NOT_INTEGER");
  assert.equal((validateLegScore(1000, 0) as { code: string }).code, "LEG_SCORE_TOO_HIGH");
  assert.equal(validateDecisionReason("  ").ok, false);
  assert.equal(validateDecisionReason("x".repeat(301)).ok, false);
  assert.deepEqual(validateDecisionReason("  Dogrywka 1:0 "), { ok: true, value: "Dogrywka 1:0" });
});

test("presets: the two-legged option is offered only for single elimination and always explains itself", () => {
  assert.ok(matchRulePresetsFor("single_elimination").some((preset) => preset.id === "two_legs"));
  for (const format of ["round_robin", "group_stage", "swiss", "double_elimination"]) {
    assert.equal(matchRulePresetsFor(format).some((preset) => preset.id === "two_legs"), false, format);
  }
  for (const preset of matchRulePresetsFor("single_elimination")) assert.ok(preset.description.length > 20, preset.id);
  const cup = previewPreset({ presetId: "single_elimination", params: { participantCount: 8, twoLegs: 1 } });
  assert.equal(cup.creation.matchRules?.kind, "two_legs");
  assert.equal(cup.stages[0].matches.max, 14, "7 ties × 2 legs");
  assert.ok(cup.tieRules.some((rule) => /równej sumie organizator/.test(rule)));
  const plain = previewPreset({ presetId: "single_elimination", params: { participantCount: 8 } });
  assert.equal(plain.params.twoLegs, undefined, "existing previews keep their shape");
  assert.throws(() => previewPreset({ presetId: "round_robin", params: { participantCount: 6, twoLegs: 1 } }), (error: unknown) => error instanceof PresetError && error.param === "twoLegs");
  assert.throws(() => previewPreset({ presetId: "double_elimination", params: { participantCount: 8, twoLegs: 1 } }), PresetError);
});

test("AI: spec 1.1 lists the two-legged option, examples import, an impossible configuration is refused", () => {
  const spec = buildAiSpecification();
  assert.equal(spec.specVersion, "1.1");
  assert.ok(spec.matchDecisions.some((option) => option.id === "two_legs" && option.formats.join() === "single_elimination"));
  for (const example of spec.examples.filter((item) => JSON.stringify(item.config).includes("two"))) {
    const result = validateAiTournamentConfigText(JSON.stringify(example.config));
    assert.equal(result.valid, true, `${example.title}: ${JSON.stringify(!result.valid && result.problems)}`);
  }
  const bad = validateAiTournamentConfigText(JSON.stringify({ schemaVersion: 1, participants: { count: 8 }, structure: { type: "preset", presetId: "swiss", params: { twoLegs: 1 } } }));
  assert.equal(bad.valid, false);
  const forbidden = validateAiTournamentConfigText(JSON.stringify({ schemaVersion: 1, participants: { count: 8 }, name: "Puchar", structure: { type: "preset", presetId: "single_elimination", params: { twoLegs: 1 } } }));
  assert.equal(forbidden.valid, false, "names, passwords and results stay out of the AI file");
});
