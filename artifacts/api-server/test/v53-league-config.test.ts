import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AI_CONFIG_EXAMPLES,
  buildAiConfigJsonSchema,
  validateAiTournamentConfig,
} from "../src/domain/tournament/ai-tournament-config";
import { PresetError, previewPreset } from "../src/domain/tournament/tournament-presets";
import { validateTournamentStagePlan } from "../src/domain/tournament/tournament-stage-plan";

const leagueExample = AI_CONFIG_EXAMPLES.find((example) => example.title.startsWith("Liga 12 drużyn"))!;
const customRulesExample = AI_CONFIG_EXAMPLES.find((example) => example.title.startsWith("Własna punktacja"))!;

test("AI example: 12-team home-and-away league with draws, 3/1/0 and a weekly schedule is accepted as is", () => {
  const result = validateAiTournamentConfig(leagueExample.config);
  assert.equal(result.valid, true, JSON.stringify(!result.valid && result.problems));
  if (!result.valid) return;
  assert.equal(result.preview.totals.matches.min, 132);
  assert.equal(result.preview.totals.rounds.min, 22);
  assert.deepEqual(result.preview.leagueRules, {
    version: 1, allowDraws: true, points: { win: 3, draw: 1, loss: 0 },
    tieBreakers: ["head_to_head", "score_difference", "scored", "wins"],
  });
  assert.deepEqual(result.preview.schedule, {
    stageName: "Każdy z każdym — mecz i rewanż",
    timeZone: "Europe/Warsaw",
    startDate: "2026-12-05",
    intervalDays: 7,
    defaultTime: "18:00",
    rounds: 22,
    firstDate: "2026-12-05",
    lastDate: "2027-05-01",
  });
  // The note written for the organizer matches what the engine computed.
  assert.match(String(leagueExample.config.notes), /132 mecze w 22 kolejkach, ostatnia kolejka 1 maja 2027/);
  const stage = result.preview.creation.stagePlan!.stages[0]! as { leagueRules?: unknown; scheduleTimeZone?: string; schedulePlan?: unknown };
  assert.deepEqual(stage.schedulePlan, { startDate: "2026-12-05", intervalDays: 7, defaultTime: "18:00" });
  assert.equal(stage.scheduleTimeZone, "Europe/Warsaw");
  assert.equal(validateTournamentStagePlan(result.preview.creation.stagePlan).valid, true);
  assert.match(result.preview.tieRules.join(" "), /remis 1 pkt.*Remisy dozwolone/);
});

test("AI example: custom points and tie-breaker order go straight into the stage plan", () => {
  const result = validateAiTournamentConfig(customRulesExample.config);
  assert.equal(result.valid, true, JSON.stringify(!result.valid && result.problems));
  if (!result.valid) return;
  const stage = result.preview.stagePlan.stages[0]! as { leagueRules?: { points: unknown; tieBreakers: unknown; allowDraws: boolean } };
  assert.deepEqual(stage.leagueRules?.points, { win: 2, draw: 1, loss: 0 });
  assert.deepEqual(stage.leagueRules?.tieBreakers, ["score_difference", "head_to_head", "wins"]);
  assert.equal(stage.leagueRules?.allowDraws, false);
  assert.equal(result.continueIn, "advanced");
});

test("AI import rejects league rules the engine would not honour", () => {
  const base = (stage: Record<string, unknown>) => ({
    schemaVersion: 1, participants: { count: 6 },
    structure: { type: "stages", stages: [{ label: "Liga", format: "round_robin", ...stage }] },
  });
  const problems = (config: unknown) => {
    const result = validateAiTournamentConfig(config);
    return result.valid ? [] : result.problems;
  };
  assert.ok(problems(base({ bestOf: 3, leagueRules: { allowDraws: true, points: { win: 3, draw: 1, loss: 0 } } }))
    .some((problem) => /jedna gra/.test(problem.message)));
  assert.ok(problems(base({ leagueRules: { points: { win: 3, draw: 1, loss: 0 }, bonusPoints: 1 } }))
    .some((problem) => problem.path === "structure.stages[0].leagueRules.bonusPoints"));
  assert.ok(problems(base({ leagueRules: { points: { win: 1, draw: 2, loss: 0 } } }))
    .some((problem) => /remis/.test(problem.message)));
  assert.ok(problems({
    schemaVersion: 1, participants: { count: 8 },
    structure: { type: "stages", stages: [{ label: "Puchar", format: "single_elimination", leagueRules: { points: { win: 3, draw: 1, loss: 0 } } }] },
  }).some((problem) => /tylko round_robin i group_stage/.test(problem.message)));
});

test("AI schedule: DST-skipped hour and a structure without a league are explained", () => {
  const dst = validateAiTournamentConfig({
    ...leagueExample.config,
    schedule: { timeZone: "Europe/Warsaw", startDate: "2027-03-14", intervalDays: 7, defaultTime: "02:30" },
  });
  assert.equal(dst.valid, false);
  assert.ok(!dst.valid && dst.problems.some((problem) => problem.path === "schedule" && /Kolejka 3: .*nie istnieje/.test(problem.message)));
  const noLeague = validateAiTournamentConfig({
    schemaVersion: 1, participants: { count: 8 },
    structure: { type: "preset", presetId: "single_elimination", params: {} },
    schedule: { startDate: "2026-12-05", intervalDays: 7, defaultTime: "18:00" },
  });
  assert.ok(!noLeague.valid && noLeague.problems.some((problem) => /lidze .* fazie grupowej/.test(problem.message)));
  const badZone = validateAiTournamentConfig({ ...leagueExample.config, schedule: { timeZone: "Mars/Base", startDate: "2026-12-05", intervalDays: 7, defaultTime: "18:00" } });
  assert.ok(!badZone.valid && badZone.problems.some((problem) => problem.path === "schedule.timeZone"));
});

test("AI schedule on a flexible single-leg league goes into creation, not a stage plan", () => {
  const result = validateAiTournamentConfig({
    schemaVersion: 1, kind: "league", participants: { count: 8 },
    structure: { type: "preset", presetId: "round_robin", params: { legs: 1 } },
    schedule: { startDate: "2026-12-01", intervalDays: 3, defaultTime: "20:15" },
  });
  assert.equal(result.valid, true, JSON.stringify(!result.valid && result.problems));
  if (!result.valid) return;
  assert.equal(result.preview.creation.stagePlan, undefined);
  assert.equal(result.preview.creation.scheduleTimeZone, "Europe/Warsaw");
  assert.deepEqual(result.preview.creation.schedulePlan, { startDate: "2026-12-01", intervalDays: 3, defaultTime: "20:15" });
  assert.equal(result.preview.schedule?.rounds, 7);
  assert.equal(result.preview.schedule?.lastDate, "2026-12-19");
});

test("presets: new leagues rank by points (3/1/0, no draws by default); draws need one game", () => {
  const league = previewPreset({ presetId: "round_robin", params: { participantCount: 8 } });
  assert.deepEqual(league.leagueRules?.points, { win: 3, draw: 1, loss: 0 });
  assert.equal(league.leagueRules?.allowDraws, false);
  assert.equal(league.participants.mode, "up_to", "a single-leg league keeps its flexible participant count");
  assert.deepEqual(league.creation.leagueRules, league.leagueRules);
  assert.deepEqual(league.params, { participantCount: 8, bestOf: 1, legs: 1, allowDraws: 0, pointsWin: 3, pointsDraw: 1, pointsLoss: 0 });
  const custom = previewPreset({ presetId: "round_robin", params: { participantCount: 8, allowDraws: 1, pointsWin: 2 } });
  assert.deepEqual(custom.leagueRules?.points, { win: 2, draw: 1, loss: 0 });
  assert.match(custom.tieRules[0]!, /zwycięstwo 2 pkt, remis 1 pkt/);
  assert.throws(() => previewPreset({ presetId: "round_robin", params: { participantCount: 8, allowDraws: 1, bestOf: 3 } }), (error: unknown) =>
    error instanceof PresetError && error.param === "allowDraws");
  assert.throws(() => previewPreset({ presetId: "round_robin", params: { participantCount: 8, pointsWin: 1, pointsDraw: 2 } }), PresetError);
  const groups = previewPreset({ presetId: "groups_playoff", params: { participantCount: 16, allowDraws: 1 } });
  const groupStage = groups.stagePlan.stages[0]! as { format: string; leagueRules?: { allowDraws: boolean } };
  assert.equal(groupStage.format, "group_stage");
  assert.equal(groupStage.leagueRules?.allowDraws, true);
  assert.equal("leagueRules" in groups.stagePlan.stages[1]!, false, "the play-off bracket has no draws");
  const swiss = previewPreset({ presetId: "swiss", params: { participantCount: 8 } });
  assert.equal(swiss.leagueRules, null);
});

test("JSON schema exposes exactly the implemented options", () => {
  const schema = buildAiConfigJsonSchema() as { properties: Record<string, { properties?: Record<string, unknown> }> };
  assert.deepEqual(Object.keys(schema.properties.schedule!.properties!), ["timeZone", "startDate", "intervalDays", "defaultTime"]);
  const text = JSON.stringify(schema);
  for (const key of ["allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "leagueRules", "tieBreakers", "head_to_head"]) {
    assert.ok(text.includes(`"${key}"`), key);
  }
});
