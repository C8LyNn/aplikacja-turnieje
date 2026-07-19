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
    settings.initialPlacement = stage.seedingMethod;
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
  if (stage.format === "swiss" || stage.format === "round_robin") {
    return { type: "top_n", count: stage.advancingCount! };
  }
  throw new Error("A v1 single-elimination stage cannot have an outgoing transition.");
}

function transitionSeeding(stage: TournamentStagePlan): SeedAssignmentPolicyV2 {
  if (stage.format === "group_stage") {
    return {
      type: "policy_ref",
      policyId: "legacy_group_cross_seed_v1",
      settings: {
        groupCount: stage.groupCount,
        qualifiersPerGroup: stage.qualifiersPerGroup,
      },
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
  if (source.format === "group_stage" && target.format === "single_elimination") {
    return {
      type: "policy_ref",
      policyId: "legacy_group_playoff_slots_v1",
      settings: {
        groupCount: source.groupCount,
        qualifiersPerGroup: source.qualifiersPerGroup,
      },
    };
  }
  if (target.format === "group_stage") return { type: "snake_groups" };
  if (target.format === "single_elimination") {
    return { type: "standard_seeded_bracket", reseedEachRound: false };
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
      seedAssignment: { type: "preserve" },
      placement:
        plan.stages[0].format === "group_stage"
          ? { type: "snake_groups" }
          : { type: "format_default" },
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
