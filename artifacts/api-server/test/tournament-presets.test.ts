import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  PRESET_DEFINITIONS,
  PRESET_IDS,
  PresetError,
  parsePresetPreviewRequest,
  parseWizardAnswers,
  previewPreset,
  recommendPresets,
  type PresetId,
} from "../src/domain/tournament/tournament-presets";
import { validateTournamentStagePlan } from "../src/domain/tournament/tournament-stage-plan";

const code = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    if (error instanceof PresetError) return error.code;
    throw error;
  }
  assert.fail("expected PresetError");
};

describe("V5 presets: every preset is valid across its whole participant range", () => {
  for (const presetId of PRESET_IDS) {
    const [min, max] = PRESET_DEFINITIONS[presetId].participantRange;
    test(`${presetId}: ${min}..${max} produce engine-valid plans with consistent totals`, () => {
      for (let n = min; n <= max; n += 1) {
        const preview = previewPreset({ presetId, params: { participantCount: n } });
        assert.equal(preview.stagePlan.initialParticipantCount, n);
        assert.equal(validateTournamentStagePlan(preview.stagePlan).valid, true, `${presetId} n=${n}`);
        assert.equal(preview.stages.length, preview.stagePlan.stages.length);
        const sumMin = preview.stages.reduce((sum, stage) => sum + stage.matches.min, 0);
        assert.equal(preview.totals.matches.min, sumMin);
        assert.ok(preview.totals.matches.max >= preview.totals.matches.min);
        assert.ok(preview.totals.matchesPerParticipant.min >= 1, `${presetId} n=${n} everyone plays`);
        // Stage flow: next stage participant count equals advancing count.
        preview.stages.slice(0, -1).forEach((stage, index) => {
          assert.equal(preview.stages[index + 1].participantCount, stage.advancingCount);
        });
        assert.equal(preview.stages.at(-1)!.advancingCount, null);
        if (preview.stages.length === 1) {
          assert.equal(preview.participants.mode, "up_to");
          assert.equal(preview.creation.stagePlan, undefined);
        } else {
          assert.equal(preview.participants.mode, "exact");
          assert.deepEqual(preview.creation.stagePlan, preview.stagePlan);
        }
        for (const limit of preview.paramLimits) {
          assert.ok(limit.options.includes(limit.value), `${presetId} n=${n} ${limit.key} default is allowed`);
        }
      }
    });
  }
});

describe("V5 presets: match and round arithmetic", () => {
  test("16 players, 4 groups → 4×4, top 2 → 8-player play-off", () => {
    const preview = previewPreset({ presetId: "groups_playoff", params: { participantCount: 16, groupCount: 4, qualifiersPerGroup: 2 } });
    assert.deepEqual(preview.stages[0].groupSizes, [4, 4, 4, 4]);
    assert.equal(preview.stages[0].advancingCount, 8);
    assert.equal(preview.stages[1].participantCount, 8);
    assert.equal(preview.totals.matches.min, 4 * 6 + 7);
    assert.equal(preview.stages[0].rounds.max, 3);
    assert.equal(preview.stages[1].rounds.max, 3);
    assert.equal(preview.totals.matchesPerParticipant.min, 3);
  });
  test("uneven groups are balanced and reported", () => {
    const preview = previewPreset({ presetId: "groups_playoff", params: { participantCount: 14, groupCount: 3 } });
    assert.deepEqual(preview.stages[0].groupSizes, [5, 5, 4]);
    assert.ok(preview.warnings.some((warning) => warning.includes("nie są równe")));
    assert.equal(preview.stages[0].advancingCount, 6);
    assert.equal(preview.stages[1].byes, 2);
  });
  test("single elimination with 6 reports 2 byes and 5 matches", () => {
    const preview = previewPreset({ presetId: "single_elimination", params: { participantCount: 6 } });
    assert.equal(preview.stages[0].byes, 2);
    assert.equal(preview.totals.matches.min, 5);
    assert.equal(preview.totals.rounds.min, 3);
  });
  test("double elimination counts grand-final reset in maximum", () => {
    const preview = previewPreset({ presetId: "double_elimination", params: { participantCount: 8 } });
    assert.deepEqual(preview.totals.matches, { min: 14, max: 15 });
  });
  test("round robin odd count has n rounds", () => {
    const preview = previewPreset({ presetId: "round_robin", params: { participantCount: 5 } });
    assert.equal(preview.totals.matches.min, 10);
    assert.equal(preview.totals.rounds.min, 5);
  });
  test("swiss defaults to ceil(log2 n) rounds, accurate adds one", () => {
    assert.equal(previewPreset({ presetId: "swiss", params: { participantCount: 16 } }).params.swissRounds, 4);
    assert.equal(previewPreset({ presetId: "swiss", params: { participantCount: 16 }, priority: "accurate" }).params.swissRounds, 5);
    assert.equal(previewPreset({ presetId: "swiss", params: { participantCount: 3 } }).params.swissRounds, 2);
  });
  test("league + play-off: 10 players, top 4", () => {
    const preview = previewPreset({ presetId: "league_playoff", params: { participantCount: 10, advancingCount: 4, playoffBestOf: 3 } });
    assert.equal(preview.totals.matches.min, 45 + 3);
    assert.equal(preview.stagePlan.stages[1].bestOf, 3);
    assert.equal(preview.stagePlan.stages[0].bestOf, 1);
  });
  test("single stage swiss carries swissRounds in creation payload", () => {
    const preview = previewPreset({ presetId: "swiss", params: { participantCount: 9, swissRounds: 3, bestOf: 3 } });
    assert.deepEqual(preview.creation, { format: "swiss", maxPlayers: 9, defaultBestOf: 3, swissRounds: 3 });
  });
  test("multi-stage creation uses a compatible legacy format column", () => {
    assert.equal(previewPreset({ presetId: "groups_playoff", params: { participantCount: 12 } }).creation.format, "round_robin");
    assert.equal(previewPreset({ presetId: "swiss_playoff", params: { participantCount: 12 } }).creation.format, "swiss");
  });
  test("preview is deterministic", () => {
    const request = { presetId: "swiss_playoff" as PresetId, params: { participantCount: 24 } };
    assert.deepEqual(previewPreset(request), previewPreset(request));
  });
});

const BOUNDARY_CASES: Array<[{ presetId: string; params: Record<string, number> }, string]> = [
    [{ presetId: "round_robin", params: { participantCount: 33 } }, "PRESET_PARTICIPANT_COUNT_OUT_OF_RANGE"],
    [{ presetId: "double_elimination", params: { participantCount: 3 } }, "PRESET_PARTICIPANT_COUNT_OUT_OF_RANGE"],
    [{ presetId: "groups_playoff", params: { participantCount: 12, groupCount: 5 } }, "PRESET_PARAM_OUT_OF_RANGE"],
    [{ presetId: "groups_playoff", params: { participantCount: 12, groupCount: 4, qualifiersPerGroup: 3 } }, "PRESET_PARAM_OUT_OF_RANGE"],
    [{ presetId: "swiss_playoff", params: { participantCount: 16, advancingCount: 6 } }, "PRESET_PARAM_OUT_OF_RANGE"],
    [{ presetId: "swiss_playoff", params: { participantCount: 16, advancingCount: 16 } }, "PRESET_PARAM_OUT_OF_RANGE"],
    [{ presetId: "swiss", params: { participantCount: 8, swissRounds: 8 } }, "PRESET_PARAM_OUT_OF_RANGE"],
    [{ presetId: "single_elimination", params: { participantCount: 8, bestOf: 2 } }, "PRESET_PARAM_OUT_OF_RANGE"],
];

describe("V5 presets: validation and boundaries", () => {
  for (const [request, expected] of BOUNDARY_CASES) {
    test(`${JSON.stringify(request)} → ${expected}`, () => {
      assert.equal(code(() => previewPreset(request as never)), expected);
    });
  }
  test("parameter errors name the offending parameter", () => {
    try {
      previewPreset({ presetId: "groups_playoff", params: { participantCount: 12, groupCount: 9 } });
      assert.fail("expected error");
    } catch (error) {
      assert.ok(error instanceof PresetError);
      assert.equal(error.param, "groupCount");
      assert.match(error.message, /2–4|2, 3, 4/);
    }
  });
  test("request parser rejects unknown fields, presets and non-integers", () => {
    assert.equal(code(() => parsePresetPreviewRequest({ presetId: "swiss", params: {}, name: "x" })), "INVALID_PRESET_REQUEST");
    assert.equal(code(() => parsePresetPreviewRequest({ presetId: "league_home_away", params: {} })), "UNKNOWN_PRESET");
    assert.equal(code(() => parsePresetPreviewRequest({ presetId: "swiss", params: { organizerPassword: 1 } })), "INVALID_PRESET_REQUEST");
    assert.equal(code(() => parsePresetPreviewRequest({ presetId: "swiss", params: { participantCount: 8.5 } })), "PRESET_PARAM_OUT_OF_RANGE");
    assert.equal(code(() => parsePresetPreviewRequest([])), "INVALID_PRESET_REQUEST");
    assert.deepEqual(parsePresetPreviewRequest({ presetId: "swiss", params: { participantCount: 8, swissRounds: null } }).params, { participantCount: 8 });
  });
  test("answer parser applies safe defaults and rejects garbage", () => {
    assert.deepEqual(parseWizardAnswers({ participantCount: 8 }), {
      kind: "tournament", participantType: "players", grouping: "any", priority: "accurate", participantCount: 8,
    });
    assert.equal(code(() => parseWizardAnswers({ participantCount: 1 })), "INVALID_ANSWERS");
    assert.equal(code(() => parseWizardAnswers({ participantCount: 8, kind: "cup" })), "INVALID_ANSWERS");
    assert.equal(code(() => parseWizardAnswers({ participantCount: 8, extra: true })), "INVALID_ANSWERS");
  });
});

describe("V5 presets: recommendations", () => {
  const top = (answers: Partial<Parameters<typeof parseWizardAnswers>[0]>) =>
    recommendPresets(parseWizardAnswers({ participantCount: 16, ...answers })).recommendations[0];
  test("short events recommend single elimination", () => {
    assert.equal(top({ priority: "short" }).presetId, "single_elimination");
  });
  test("asking for groups recommends groups + play-off", () => {
    assert.equal(top({ grouping: "yes" }).presetId, "groups_playoff");
    assert.equal(top({ grouping: "yes", priority: "short" }).presetId, "groups_playoff");
  });
  test("small league recommends round robin", () => {
    assert.equal(top({ kind: "league", participantCount: 8, priority: "more_matches" }).presetId, "round_robin");
  });
  test("large league does not recommend 1000+ match round robin", () => {
    const result = recommendPresets(parseWizardAnswers({ participantCount: 64, kind: "league" }));
    const roundRobin = result.recommendations.find((item) => item.presetId === "round_robin")!;
    assert.equal(roundRobin.available, false);
    assert.notEqual(result.recommendations[0].presetId, "round_robin");
    assert.equal(result.recommendations[0].available, true);
  });
  test("exactly one available preset is recommended and unavailable ones explain why", () => {
    for (const participantCount of [2, 3, 5, 7, 8, 16, 33, 100, 128]) {
      const result = recommendPresets(parseWizardAnswers({ participantCount }));
      assert.equal(result.recommendations.filter((item) => item.recommended).length, 1);
      assert.ok(result.recommendations[0].recommended && result.recommendations[0].available);
      for (const item of result.recommendations) {
        if (item.available) assert.ok(item.preview && Array.isArray(item.reasons));
        else assert.ok(item.unavailableReason && item.preview === null);
      }
    }
  });
  test("planned league features are listed as unavailable, never as presets", () => {
    const result = recommendPresets(parseWizardAnswers({ participantCount: 8, kind: "league" }));
    assert.deepEqual(result.planned.map((item) => item.id), ["league_schedule"]);
    assert.ok(result.recommendations.every((item) => !String(item.presetId).startsWith("league_home")));
  });
});

test("V5.1: recommendations explain answers that cannot be honoured", () => {
  const groups = recommendPresets(parseWizardAnswers({ kind: "tournament", participantCount: 5, grouping: "yes", priority: "short" }));
  assert.equal(groups.recommendations.find((item) => item.presetId === "groups_playoff")?.available, false);
  assert.deepEqual(groups.notes, ["Podział na grupy jest możliwy od 6 uczestników. Przy 5 pokazujemy formaty bez grup."]);
  const shortLeague = recommendPresets(parseWizardAnswers({ kind: "league", participantCount: 10, priority: "short" }));
  assert.equal(shortLeague.recommendations[0].presetId, "round_robin");
  assert.match(shortLeague.notes[0], /każdy gra z każdym \(45 meczów\).*„System szwajcarski”: 20 meczów/);
  assert.deepEqual(recommendPresets(parseWizardAnswers({ kind: "tournament", participantCount: 16, grouping: "yes" })).notes, []);
});

test("V5.2: recommendation notes use Polish plurals and no 'series' wording for a single game", () => {
  const notes = recommendPresets(parseWizardAnswers({ kind: "league", participantCount: 4, priority: "short" })).notes;
  assert.match(notes[0] ?? "", /każdy gra z każdym \(6 meczów\).*„System szwajcarski”: 4 mecze,/);
  const single = JSON.stringify(previewPreset({ presetId: "single_elimination", params: { participantCount: 8 } }));
  assert.match(single, /Remisów nie ma: każdy mecz musi mieć zwycięzcę./);
  assert.doesNotMatch(single, /seria do przewagi/);
});
