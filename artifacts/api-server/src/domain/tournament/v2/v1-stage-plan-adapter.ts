import {
  validateTournamentStagePlan,
  type TournamentStagePlan,
  type TournamentStagePlanProblem,
  type TournamentStagesPlan,
} from "../tournament-stage-plan";
import {
  TOURNAMENT_ENGINE_MODEL_VERSION,
  type ParticipantSelectionRuleV2,
  type SeedAssignmentPolicyV2,
  type StagePlacementPolicyV2,
  type TournamentBlueprintV2,
  type TournamentStageDefinitionV2,
} from "./stage-model";
import { validateTournamentBlueprintV2, type TournamentBlueprintProblemV2 } from "./validate-tournament-blueprint";

export type AdaptV1StagePlanResult =
  | { valid: true; value: TournamentBlueprintV2 }
  | { valid: false; source: "v1"; problems: TournamentStagePlanProblem[] }
  | { valid: false; source: "v2"; problems: TournamentBlueprintProblemV2[] };

function stageDefinition(stage: TournamentStagePlan): TournamentStageDefinitionV2 {
  const settings: Record<string, unknown> = {};
  if (stage.format === "swiss") settings.rounds = stage.rounds;
  if (stage.format === "group_stage") {
    settings.groupCount = stage.groupCount;
    settings.participantsPerGroup = stage.participantsPerGroup;
    settings.qualifiersPerGroup = stage.qualifiersPerGroup;
    settings.initialPlacement = stage.placementMethod;
    settings.resultSeeding = stage.resultSeedingMethod;
  }
  settings.entrySeeding = stage.entrySeedingMethod;
  settings.randomRevealOrder = stage.randomRevealOrder;
  if (stage.randomSeed != null) settings.randomSeed = stage.randomSeed;
  if (stage.format === "single_elimination") {
    settings.initialPlacement = stage.placementMethod;
    if (stage.advancingCount != null) settings.advancingCount = stage.advancingCount;
  }

  const policyId =
    stage.format === "swiss"
      ? "swiss_v1"
      : stage.format === "round_robin"
        ? "round_robin_v1"
        : stage.format === "group_stage"
          ? "group_v1"
          : "elimination_bracket_v1";

  return {
    key: stage.key,
    name: stage.name,
    displayOrder: stage.position,
    capacity: { type: "exact", count: stage.participantCount },
    format: { id: stage.format, rulesVersion: 1, settings },
    matchRules: { bestOf: stage.bestOf },
    classification: { type: "format_default", policyId },
  };
}

function transitionSelection(stage: TournamentStagePlan): ParticipantSelectionRuleV2 {
  if (stage.format === "group_stage") {
    return { type: "top_n_per_group", count: stage.qualifiersPerGroup };
  }
  if (stage.format === "swiss" || stage.format === "round_robin" || stage.format === "single_elimination") {
    return { type: "top_n", count: stage.advancingCount! };
  }
  throw new Error("Unsupported outgoing stage transition.");
}

function transitionSeeding(stage: TournamentStagePlan): SeedAssignmentPolicyV2 {
  if (stage.format === "group_stage") {
    const withinBand = [
      { metric: "match_win_rate", direction: "descending" as const, scope: "within_rank_band" as const },
      { metric: "game_diff_per_match", direction: "descending" as const, scope: "within_rank_band" as const },
      { metric: "game_wins_per_match", direction: "descending" as const, scope: "within_rank_band" as const },
      { metric: "stage_seed", direction: "ascending" as const, scope: "within_rank_band" as const },
    ];
    if (stage.resultSeedingMethod === "rank_bands") {
      return {
        type: "rank_bands",
        bandMetric: "group_rank",
        withinBand,
        unresolvedTie: "previous_seed",
      };
    }
    return {
      type: "classification_order",
      criteria: [
        { metric: "match_win_rate", direction: "descending", scope: "global" },
        { metric: "game_diff_per_match", direction: "descending", scope: "global" },
        { metric: "game_wins_per_match", direction: "descending", scope: "global" },
        { metric: "group_rank", direction: "ascending", scope: "global" },
        { metric: "stage_seed", direction: "ascending", scope: "global" },
      ],
      unresolvedTie: "previous_seed",
    };
  }
  return {
    type: "classification_order",
    criteria: [
      { metric: "overall_rank", direction: "ascending", scope: "global" },
      { metric: "stage_seed", direction: "ascending", scope: "within_rank_band" },
    ],
    unresolvedTie: "previous_seed",
  };
}

function transitionPlacement(
  source: TournamentStagePlan,
  target: TournamentStagePlan,
): StagePlacementPolicyV2 {
  if (target.format === "group_stage") {
    return target.placementMethod === "random"
      ? { type: "random", randomSeed: target.randomSeed }
      : { type: "snake_groups" };
  }
  if (target.format === "single_elimination") {
    return target.placementMethod === "random"
      ? { type: "random", randomSeed: target.randomSeed }
      : { type: "standard_seeded_bracket", reseedEachRound: false };
  }
  return { type: "format_default" };
}

function blueprintFromValidatedV1(plan: TournamentStagesPlan): TournamentBlueprintV2 {
  const transitions: TournamentBlueprintV2["transitions"] = [
    {
      key: "registration-to-first-stage",
      source: { type: "registration", bucketKey: "default" },
      target: { stageKey: plan.stages[0].key },
      selection: { type: "all" },
      seedAssignment: (() => {
        const first = plan.stages[0];
        if (first.entrySeedingMethod === "random") {
          return { type: "random" as const, reveal: first.randomRevealOrder, randomSeed: first.randomSeed };
        }
        if (first.entrySeedingMethod === "manual") return { type: "manual" as const };
        if (first.entrySeedingMethod === "preserve") return { type: "preserve" as const };
        return {
          type: "policy_ref" as const,
          policyId: first.entrySeedingMethod,
          settings: {},
        };
      })(),
      placement: transitionPlacement(plan.stages[0], plan.stages[0]),
      reservedSlots: plan.initialParticipantCount,
      priority: 0,
    },
    ...plan.stages.slice(0, -1).map((stage, index) => {
      const target = plan.stages[index + 1];
      return {
        key: `${stage.key}-to-${target.key}`,
        source: { type: "stage_result" as const, stageKey: stage.key },
        target: { stageKey: target.key },
        selection: transitionSelection(stage),
        seedAssignment: transitionSeeding(stage),
        placement: transitionPlacement(stage, target),
        reservedSlots: target.participantCount,
        priority: 0,
      };
    }),
  ];

  return {
    modelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    initialParticipantCount: plan.initialParticipantCount,
    buckets: [{ key: "default", name: "Wszyscy uczestnicy", priority: 0 }],
    stages: plan.stages.map(stageDefinition),
    transitions,
  };
}

export function adaptV1StagePlanToV2(input: unknown): AdaptV1StagePlanResult {
  const v1 = validateTournamentStagePlan(input);
  if (!v1.valid) return { valid: false, source: "v1", problems: v1.problems };

  const blueprint = blueprintFromValidatedV1(v1.value);
  const v2 = validateTournamentBlueprintV2(blueprint);
  if (!v2.valid) return { valid: false, source: "v2", problems: v2.problems };
  return { valid: true, value: v2.value };
}
