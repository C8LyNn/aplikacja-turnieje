import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  TOURNAMENT_ENGINE_MODEL_VERSION,
  compileTournamentBlueprintV2,
  type ParticipantSelectionRuleV2,
  type StageFormatEngineV2,
  type TournamentBlueprintV2,
} from "../src/domain/tournament/v2/index";
import {
  compilationCauseCodes,
  directAndQualifiedBlueprint,
  minimalBlueprint,
} from "./tournament-routing-test-helpers";

function twoStageBlueprint(
  selection: ParticipantSelectionRuleV2,
  reservedSlots: number,
  settings: Readonly<Record<string, unknown>> = {},
  sourceFormat: TournamentBlueprintV2["stages"][number]["format"]["id"] =
    "single_elimination",
  exactGroupSizes?: readonly number[],
  sourceParticipantCount = 8,
): TournamentBlueprintV2 {
  return {
    modelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    initialParticipantCount: sourceParticipantCount,
    buckets: [
      {
        key: "default",
        name: "All",
        exactCapacity: sourceParticipantCount,
        priority: 0,
      },
    ],
    stages: [
      {
        key: "source",
        name: "Source",
        displayOrder: 1,
        capacity: { type: "exact", count: sourceParticipantCount },
        ...(exactGroupSizes == null
          ? {}
          : {
              selectionCapabilities: {
                type: "groups" as const,
                exactGroupSizes,
                maximumQualifiersPerGroup: Math.max(...exactGroupSizes),
              },
            }),
        format: {
          id: sourceFormat,
          rulesVersion: 1,
          settings,
        },
        matchRules: { bestOf: 1 },
        classification: { type: "format_default", policyId: "source" },
      },
      {
        key: "target",
        name: "Target",
        displayOrder: 2,
        capacity: { type: "exact", count: reservedSlots },
        format: {
          id: "single_elimination",
          rulesVersion: 1,
          settings: {},
        },
        matchRules: { bestOf: 1 },
        classification: { type: "format_default", policyId: "target" },
      },
    ],
    transitions: [
      {
        key: "registration",
        source: { type: "registration", bucketKey: "default" },
        target: { stageKey: "source" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: sourceParticipantCount,
        priority: 0,
      },
      {
        key: "qualification",
        source: { type: "stage_result", stageKey: "source" },
        target: { stageKey: "target" },
        selection,
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots,
        priority: 0,
      },
    ],
  };
}

function outputEngine(
  exactCapacity: number,
  outputRouteCount: number,
  conditional: boolean,
): StageFormatEngineV2 {
  return {
    formatId: "custom:output-capacity",
    rulesVersion: 1,
    compile({ stageKey, keys }) {
      const outputKey = keys.output("qualified");
      const matches = Array.from({ length: outputRouteCount }, (_, index) => ({
        matchKey: keys.logicalMatch(`match-${index + 1}`),
        stageKey,
        order: index,
        slots: [1, 2] as const,
      }));
      const entryRoutes = matches.map((match, index) => ({
        routeKey: keys.route(`entry-${index + 1}`),
        source: {
          type: "stage_entry" as const,
          stageKey,
          entryKey: keys.entryPoint("default"),
          position: index + 1,
        },
        target: {
          type: "match_slot" as const,
          stageKey,
          matchKey: match.matchKey,
          slot: 1 as const,
        },
        reservedSlots: 1,
        priority: 0,
        order: index,
        condition: { type: "always" as const },
      }));
      const outputRoutes = matches.map((match, index) => ({
        routeKey: keys.route(`winner-${index + 1}`),
        source: {
          type: "match_outcome" as const,
          stageKey,
          matchKey: match.matchKey,
          outcome: "winner" as const,
        },
        target: {
          type: "stage_output" as const,
          stageKey,
          outputKey,
        },
        reservedSlots: 1,
        priority: 0,
        order: entryRoutes.length + index,
        condition: conditional
          ? {
              type: "participant_lineage" as const,
              lineage: {
                type: "route" as const,
                routeKey: entryRoutes[index].routeKey,
              },
            }
          : { type: "always" as const },
      }));
      return {
        logicalMatches: matches,
        outputs: [
          { stageKey, outputKey, exactCapacity, priority: 0 },
        ],
        routes: [...entryRoutes, ...outputRoutes],
      };
    },
  };
}

describe("compiled selection cardinality", () => {
  test("accepts named entry points only when their exact capacities are filled", () => {
    const valid = compileTournamentBlueprintV2(
      directAndQualifiedBlueprint(),
    );
    assert.equal(valid.valid, true);

    const invalid = directAndQualifiedBlueprint();
    invalid.transitions = invalid.transitions.map((transition) =>
      transition.key === "direct-to-main"
        ? {
            ...transition,
            target: { stageKey: "main", entryPoint: "qualified" },
          }
        : transition.key === "qualified-to-main"
          ? {
              ...transition,
              target: { stageKey: "main", entryPoint: "direct" },
            }
          : transition,
    );
    assert.ok(
      compilationCauseCodes(
        compileTournamentBlueprintV2(invalid),
      ).includes("ENTRY_POINT_CAPACITY_MISMATCH"),
    );
  });

  test("accepts eight direct entrants plus eight qualifiers into an exact 16-player stage", () => {
    const blueprint = directAndQualifiedBlueprint();
    blueprint.initialParticipantCount = 16;
    blueprint.buckets = blueprint.buckets.map((bucket) =>
      bucket.key === "direct" ? { ...bucket, exactCapacity: 8 } : bucket,
    );
    blueprint.stages = blueprint.stages.map((stage) =>
      stage.key === "main"
        ? {
            ...stage,
            capacity: { type: "exact", count: 16 },
            entryPoints: stage.entryPoints?.map((entryPoint) =>
              entryPoint.key === "direct"
                ? {
                    ...entryPoint,
                    capacity: { type: "exact", count: 8 },
                  }
                : entryPoint,
            ),
          }
        : stage,
    );
    blueprint.transitions = blueprint.transitions.map((transition) =>
      transition.key === "direct-to-main"
        ? { ...transition, reservedSlots: 8 }
        : transition,
    );

    assert.equal(compileTournamentBlueprintV2(blueprint).valid, true);
  });

  test("rejects range capacity in compiled plan version one", () => {
    const blueprint = minimalBlueprint();
    blueprint.stages[0].capacity = {
      type: "range",
      minimum: 2,
      maximum: 4,
      preferred: 4,
    };
    const result = compileTournamentBlueprintV2(blueprint);
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "UNSUPPORTED_CAPACITY",
        ),
    );
  });

  test("rejects top_n 8 with seven reserved slots", () => {
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint({ type: "top_n", count: 8 }, 7),
      ),
    );
    assert.ok(
      codes.includes("SELECTION_CARDINALITY_MISMATCH"),
      JSON.stringify(codes),
    );
  });

  test("rejects top_n beyond the authoritative source capacity", () => {
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint({ type: "top_n", count: 9 }, 9),
      ),
    );
    assert.ok(codes.includes("SELECTION_EXCEEDS_SOURCE_CAPACITY"));
  });

  test("accepts top_n equal to the authoritative source capacity", () => {
    assert.equal(
      compileTournamentBlueprintV2(
        twoStageBlueprint({ type: "top_n", count: 8 }, 8),
      ).valid,
      true,
    );
  });

  test("rejects a four-rank range with three reserved slots", () => {
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint({ type: "rank_range", from: 2, to: 5 }, 3),
      ),
    );
    assert.ok(codes.includes("SELECTION_CARDINALITY_MISMATCH"));
  });

  test("rejects a rank range beyond the authoritative source capacity", () => {
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint({ type: "rank_range", from: 6, to: 9 }, 4),
      ),
    );
    assert.ok(codes.includes("SELECTION_EXCEEDS_SOURCE_CAPACITY"));
  });

  test("accepts a rank range within the authoritative source capacity", () => {
    assert.equal(
      compileTournamentBlueprintV2(
        twoStageBlueprint({ type: "rank_range", from: 5, to: 8 }, 4),
      ).valid,
      true,
    );
  });

  test("rejects registration all when reserved slots differ from bucket capacity", () => {
    const blueprint = minimalBlueprint("single_elimination", 8);
    blueprint.stages[0].capacity = { type: "exact", count: 4 };
    blueprint.transitions = [
      {
        ...blueprint.transitions[0],
        reservedSlots: 4,
      },
    ];
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(blueprint),
    );
    assert.ok(codes.includes("REGISTRATION_BUCKET_CAPACITY_MISMATCH"));
  });

  test("accepts registration all at exact bucket capacity", () => {
    assert.equal(compileTournamentBlueprintV2(minimalBlueprint()).valid, true);
  });

  test("resolves top_n_per_group from group count", () => {
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint(
          { type: "top_n_per_group", count: 2 },
          7,
          {},
          "group_stage",
          [2, 2, 2, 2],
        ),
      ),
    );
    assert.ok(codes.includes("SELECTION_CARDINALITY_MISMATCH"));
  });

  test("rejects unresolved top_n_per_group and policy_ref", () => {
    const missingGroups = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint({ type: "top_n_per_group", count: 2 }, 4),
      ),
    );
    assert.ok(missingGroups.includes("GROUP_SELECTION_CAPABILITY_REQUIRED"));

    const policy = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint(
          { type: "policy_ref", policyId: "future", settings: {} },
          4,
        ),
      ),
    );
    assert.ok(policy.includes("UNRESOLVED_SELECTION_POLICY"));
  });

  test("rejects qualifiers exceeding exact participants per group", () => {
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(
        twoStageBlueprint(
          { type: "top_n_per_group", count: 5 },
          20,
          {},
          "group_stage",
          [4, 4, 4, 4],
          16,
        ),
      ),
    );
    assert.ok(codes.includes("INVALID_GROUP_SELECTION"));
  });

  test("accepts top_n_per_group from validated group capabilities", () => {
    assert.equal(
      compileTournamentBlueprintV2(
        twoStageBlueprint(
          { type: "top_n_per_group", count: 2 },
          8,
          {},
          "group_stage",
          [4, 4, 4, 4],
          16,
        ),
      ).valid,
      true,
    );
  });

  test("resolves named_output from its exact capacity", () => {
    const blueprint = twoStageBlueprint(
      { type: "named_output", outputKey: "qualified" },
      1,
      {},
      "custom:output-capacity",
    );
    blueprint.stages[1].capacity = { type: "exact", count: 2 };
    blueprint.transitions = [
      ...blueprint.transitions,
      {
        key: "direct-target-slot",
        source: { type: "registration", bucketKey: "default" },
        target: { stageKey: "target" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: 1,
        priority: 1,
      },
    ];
    const codes = compilationCauseCodes(
      compileTournamentBlueprintV2(blueprint, [
        outputEngine(2, 2, false),
      ]),
    );
    assert.ok(
      codes.includes("SELECTION_CARDINALITY_MISMATCH"),
      JSON.stringify(codes),
    );
  });
});

describe("exact output capacity", () => {
  test("accepts two independent unconditional routes for exact capacity two", () => {
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:output-capacity"),
      [outputEngine(2, 2, false)],
    );
    assert.equal(result.valid, true);
  });

  test("rejects exact capacity two with one reachable route", () => {
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:output-capacity"),
      [outputEngine(2, 1, false)],
    );
    assert.ok(
      compilationCauseCodes(result).includes("OUTPUT_CAPACITY_UNDERFILLED"),
    );
  });

  test("rejects two independent routes for exact capacity one", () => {
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:output-capacity"),
      [outputEngine(1, 2, false)],
    );
    assert.ok(
      compilationCauseCodes(result).includes("OUTPUT_CAPACITY_EXCEEDED"),
    );
  });

  test("rejects independent conditional routes with unprovable capacity", () => {
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:output-capacity"),
      [outputEngine(1, 1, true)],
    );
    assert.ok(
      compilationCauseCodes(result).includes(
        "CONDITIONAL_EXACT_OUTPUT_ROUTE",
      ),
    );
  });
});
