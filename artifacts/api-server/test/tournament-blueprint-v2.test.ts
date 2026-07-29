import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  TOURNAMENT_ENGINE_MODEL_VERSION,
  adaptV1StagePlanToV2,
  validateTournamentBlueprintV2,
  type TournamentBlueprintProblemCodeV2,
  type TournamentBlueprintV2,
} from "../src/domain/tournament/v2/index";

function minimalBlueprint(): TournamentBlueprintV2 {
  return {
    modelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    initialParticipantCount: 8,
    buckets: [
      {
        key: "default",
        name: "Wszyscy uczestnicy",
        exactCapacity: 8,
        priority: 0,
      },
    ],
    stages: [
      {
        key: "playoff",
        name: "Play-off",
        displayOrder: 1,
        capacity: { type: "exact", count: 8 },
        format: { id: "single_elimination", rulesVersion: 1, settings: {} },
        matchRules: { bestOf: 3 },
        classification: {
          type: "format_default",
          policyId: "elimination_bracket_v1",
        },
      },
    ],
    transitions: [
      {
        key: "registration-to-playoff",
        source: { type: "registration", bucketKey: "default" },
        target: { stageKey: "playoff" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "standard_seeded_bracket", reseedEachRound: false },
        reservedSlots: 8,
        priority: 0,
      },
    ],
  };
}

function problemCodes(blueprint: TournamentBlueprintV2): TournamentBlueprintProblemCodeV2[] {
  const result = validateTournamentBlueprintV2(blueprint);
  assert.equal(result.valid, false);
  return result.valid ? [] : result.problems.map((problem) => problem.code);
}

describe("validateTournamentBlueprintV2", () => {
  test("accepts the simple default: one bucket, one stage and one registration route", () => {
    const input = minimalBlueprint();
    const snapshot = structuredClone(input);
    const result = validateTournamentBlueprintV2(input);

    assert.equal(result.valid, true);
    assert.deepEqual(input, snapshot);
    if (!result.valid) return;
    assert.notEqual(result.value, input);
    assert.deepEqual(result.value, input);
  });

  test("supports multiple incoming routes with reserved target slots", () => {
    const blueprint = minimalBlueprint();
    blueprint.initialParticipantCount = 12;
    blueprint.buckets = [
      {
        key: "invited",
        name: "Zaproszeni",
        exactCapacity: 4,
        priority: 0,
      },
      {
        key: "open",
        name: "Otwarte kwalifikacje",
        exactCapacity: 8,
        priority: 1,
      },
    ];
    blueprint.stages = [
      {
        ...blueprint.stages[0],
        key: "qualifier",
        name: "Kwalifikacje",
        displayOrder: 1,
        capacity: { type: "exact", count: 8 },
      },
      {
        ...blueprint.stages[0],
        key: "main",
        name: "Etap główny",
        displayOrder: 2,
        capacity: { type: "exact", count: 12 },
      },
    ];
    blueprint.transitions = [
      {
        key: "open-to-qualifier",
        source: { type: "registration", bucketKey: "open" },
        target: { stageKey: "qualifier" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: 8,
        priority: 0,
      },
      {
        key: "invited-to-main",
        source: { type: "registration", bucketKey: "invited" },
        target: { stageKey: "main" },
        selection: { type: "all" },
        seedAssignment: { type: "fixed_range", firstSeed: 1 },
        placement: { type: "standard_seeded_bracket", reseedEachRound: false },
        reservedSlots: 4,
        priority: 0,
      },
      {
        key: "qualifier-to-main",
        source: { type: "stage_result", stageKey: "qualifier" },
        target: { stageKey: "main" },
        selection: { type: "top_n", count: 8 },
        seedAssignment: { type: "fixed_range", firstSeed: 5 },
        placement: { type: "standard_seeded_bracket", reseedEachRound: false },
        reservedSlots: 8,
        priority: 1,
      },
    ];

    assert.equal(validateTournamentBlueprintV2(blueprint).valid, true);
  });

  test("rejects an unknown route target", () => {
    const blueprint = minimalBlueprint();
    blueprint.transitions = [
      {
        ...blueprint.transitions[0],
        target: { stageKey: "missing" },
      },
    ];
    assert.ok(problemCodes(blueprint).includes("UNKNOWN_TARGET_STAGE"));
  });

  test("rejects overbooking an exact target capacity", () => {
    const blueprint = minimalBlueprint();
    blueprint.transitions = [
      blueprint.transitions[0],
      {
        ...blueprint.transitions[0],
        key: "second-route",
        reservedSlots: 1,
      },
    ];
    assert.ok(problemCodes(blueprint).includes("TARGET_CAPACITY_EXCEEDED"));
  });

  test("requires explicit sources to reserve exactly every target slot", () => {
    const missingReservation = minimalBlueprint();
    delete missingReservation.transitions[0].reservedSlots;
    assert.ok(problemCodes(missingReservation).includes("TARGET_CAPACITY_UNRESERVED"));

    const unexplainedParticipants = minimalBlueprint();
    unexplainedParticipants.transitions[0].reservedSlots = 7;
    assert.ok(problemCodes(unexplainedParticipants).includes("TARGET_CAPACITY_MISMATCH"));
  });

  test("rejects overbooking a flexible target capacity", () => {
    const blueprint = minimalBlueprint();
    blueprint.stages = [
      {
        ...blueprint.stages[0],
        capacity: { type: "range", minimum: 4, maximum: 8, preferred: 8 },
      },
    ];
    blueprint.transitions = [
      blueprint.transitions[0],
      {
        ...blueprint.transitions[0],
        key: "second-route",
        reservedSlots: 1,
      },
    ];

    assert.ok(problemCodes(blueprint).includes("TARGET_CAPACITY_EXCEEDED"));
  });

  test("rejects unreachable stages and cycles", () => {
    const blueprint = minimalBlueprint();
    blueprint.stages = [
      blueprint.stages[0],
      {
        ...blueprint.stages[0],
        key: "loop-a",
        name: "Loop A",
        displayOrder: 2,
      },
      {
        ...blueprint.stages[0],
        key: "loop-b",
        name: "Loop B",
        displayOrder: 3,
      },
    ];
    blueprint.transitions = [
      blueprint.transitions[0],
      {
        key: "a-to-b",
        source: { type: "stage_result", stageKey: "loop-a" },
        target: { stageKey: "loop-b" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        priority: 0,
      },
      {
        key: "b-to-a",
        source: { type: "stage_result", stageKey: "loop-b" },
        target: { stageKey: "loop-a" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        priority: 0,
      },
    ];

    const codes = problemCodes(blueprint);
    assert.ok(codes.includes("CYCLIC_STAGE_GRAPH"));
    assert.ok(codes.includes("UNREACHABLE_STAGE"));
  });
});

describe("adaptV1StagePlanToV2", () => {
  test("preserves a valid one-stage v1 plan without changing runtime code", () => {
    const result = adaptV1StagePlanToV2({
      initialParticipantCount: 8,
      stages: [
        {
          key: "playoff",
          position: 1,
          name: "Play-off",
          format: "single_elimination",
          participantCount: 8,
          bestOf: 3,
        },
      ],
    });

    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.value.modelVersion, 2);
    assert.equal(result.value.buckets.length, 1);
    assert.equal(result.value.stages.length, 1);
    assert.equal(result.value.transitions.length, 1);
    assert.equal(result.value.transitions[0].source.type, "registration");
  });

  test("maps group qualification, rank-band reseeding and standard bracket placement to separate policies", () => {
    const result = adaptV1StagePlanToV2({
      initialParticipantCount: 8,
      stages: [
        {
          key: "groups",
          position: 1,
          name: "Groups",
          format: "group_stage",
          participantCount: 8,
          bestOf: 3,
          groupCount: 2,
          participantsPerGroup: 4,
          qualifiersPerGroup: 2,
          seedingMethod: "snake",
        },
        {
          key: "playoff",
          position: 2,
          name: "Play-off",
          format: "single_elimination",
          participantCount: 4,
          bestOf: 5,
        },
      ],
    });

    assert.equal(result.valid, true);
    if (!result.valid) return;
    const transition = result.value.transitions.find(
      (candidate) => candidate.key === "groups-to-playoff",
    );
    assert.ok(transition);
    if (!transition) return;
    assert.deepEqual(transition.selection, { type: "top_n_per_group", count: 2 });
    assert.deepEqual(transition.seedAssignment, {
      type: "rank_bands",
      bandMetric: "group_rank",
      withinBand: [
        { metric: "match_win_rate", direction: "descending", scope: "within_rank_band" },
        { metric: "game_diff_per_match", direction: "descending", scope: "within_rank_band" },
        { metric: "game_wins_per_match", direction: "descending", scope: "within_rank_band" },
        { metric: "stage_seed", direction: "ascending", scope: "within_rank_band" },
      ],
      unresolvedTie: "previous_seed",
    });
    assert.deepEqual(transition.placement, {
      type: "standard_seeded_bracket",
      reseedEachRound: false,
    });
    assert.equal(transition.reservedSlots, 4);
  });

  test("keeps all-participant advancement representable", () => {
    const result = adaptV1StagePlanToV2({
      initialParticipantCount: 4,
      stages: [
        {
          key: "ranking",
          position: 1,
          name: "Ranking",
          format: "round_robin",
          participantCount: 4,
          bestOf: 1,
          advancingCount: 4,
        },
        {
          key: "playoff",
          position: 2,
          name: "Play-off",
          format: "single_elimination",
          participantCount: 4,
          bestOf: 3,
        },
      ],
    });

    assert.equal(result.valid, true);
    if (!result.valid) return;
    const transition = result.value.transitions.find(
      (candidate) => candidate.key === "ranking-to-playoff",
    );
    assert.deepEqual(transition?.selection, { type: "top_n", count: 4 });
    assert.equal(transition?.seedAssignment.type, "classification_order");
  });

  test("returns v1 validation problems instead of adapting an invalid plan", () => {
    const result = adaptV1StagePlanToV2({ initialParticipantCount: 1, stages: [] });
    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.source, "v1");
  });
});
