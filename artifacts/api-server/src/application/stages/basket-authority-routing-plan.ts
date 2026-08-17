import { calculateBalancedGroupSizes } from "../../domain/tournament/group-stage";
import {
  compileTournamentBlueprintV2,
  doubleEliminationFormatEngineV2,
  TOURNAMENT_ENGINE_MODEL_VERSION,
  type CompiledTournamentRoutingPlanV2,
  type SeedAssignmentPolicyV2,
  type StagePlacementPolicyV2,
  type TournamentBlueprintV2,
  type TournamentStageDefinitionV2,
} from "../../domain/tournament/v2";
import type {
  StageBasketDefinition,
  StageBasketRouteDefinition,
} from "../../domain/tournament/stage-baskets";

export interface BasketAuthorityRoutingStage {
  id: number;
  stageKey: string;
  position: number;
  name: string;
  format:
    | "swiss"
    | "round_robin"
    | "group_stage"
    | "single_elimination"
    | "double_elimination";
  participantCount: number;
  bestOf: number;
  plannedRounds: number | null;
  advancingCount: number | null;
  groupCount: number | null;
  participantsPerGroup: number | null;
  qualifiersPerGroup: number | null;
  seedingPolicy: string;
  entrySeedingPolicy: string;
  resultSeedingPolicy: string;
  randomSeed: string | null;
  randomRevealOrder: "instant" | "sequential";
}

function stagePlacement(
  stage: BasketAuthorityRoutingStage,
): StagePlacementPolicyV2 {
  if (stage.format === "group_stage") {
    return stage.seedingPolicy === "random_groups"
      ? { type: "random", randomSeed: stage.randomSeed ?? undefined }
      : { type: "snake_groups" };
  }
  if (
    stage.format === "single_elimination" ||
    stage.format === "double_elimination"
  ) {
    return stage.seedingPolicy === "random_bracket"
      ? { type: "random", randomSeed: stage.randomSeed ?? undefined }
      : { type: "standard_seeded_bracket", reseedEachRound: false };
  }
  return { type: "format_default" };
}

function entrySeeding(
  stage: BasketAuthorityRoutingStage,
): SeedAssignmentPolicyV2 {
  if (stage.entrySeedingPolicy === "random") {
    return {
      type: "random",
      reveal: stage.randomRevealOrder,
      randomSeed: stage.randomSeed ?? undefined,
    };
  }
  if (stage.entrySeedingPolicy === "manual") return { type: "manual" };
  if (stage.entrySeedingPolicy === "preserve") return { type: "preserve" };
  return {
    type: "policy_ref",
    policyId: stage.entrySeedingPolicy,
    settings: {},
  };
}

function resultSeeding(
  stage: BasketAuthorityRoutingStage,
): SeedAssignmentPolicyV2 {
  if (stage.format === "group_stage") {
    const withinBand = [
      {
        metric: "match_win_rate",
        direction: "descending" as const,
        scope: "within_rank_band" as const,
      },
      {
        metric: "game_diff_per_match",
        direction: "descending" as const,
        scope: "within_rank_band" as const,
      },
      {
        metric: "stage_seed",
        direction: "ascending" as const,
        scope: "within_rank_band" as const,
      },
    ];
    return stage.resultSeedingPolicy === "rank_bands"
      ? {
          type: "rank_bands",
          bandMetric: "group_rank",
          withinBand,
          unresolvedTie: "previous_seed",
        }
      : {
          type: "classification_order",
          criteria: [
            {
              metric: "overall_rank",
              direction: "ascending",
              scope: "global",
            },
          ],
          unresolvedTie: "previous_seed",
        };
  }
  return {
    type: "classification_order",
    criteria: [
      { metric: "overall_rank", direction: "ascending", scope: "global" },
      {
        metric: "stage_seed",
        direction: "ascending",
        scope: "within_rank_band",
      },
    ],
    unresolvedTie: "previous_seed",
  };
}

function stageDefinition(
  stage: BasketAuthorityRoutingStage,
): TournamentStageDefinitionV2 {
  const settings: Record<string, unknown> = {
    entrySeeding: stage.entrySeedingPolicy,
    randomRevealOrder: stage.randomRevealOrder,
  };
  if (stage.randomSeed != null) settings.randomSeed = stage.randomSeed;
  if (stage.format === "swiss") settings.rounds = stage.plannedRounds;
  if (stage.format === "group_stage") {
    settings.groupCount = stage.groupCount;
    settings.participantsPerGroup = stage.participantsPerGroup;
    settings.qualifiersPerGroup = stage.qualifiersPerGroup;
    settings.initialPlacement =
      stage.seedingPolicy === "random_groups" ? "random" : "snake";
    settings.resultSeeding = stage.resultSeedingPolicy;
  }
  if (
    stage.format === "single_elimination" ||
    stage.format === "double_elimination"
  ) {
    settings.initialPlacement =
      stage.seedingPolicy === "random_bracket" ? "random" : "standard";
  }
  if (stage.format === "single_elimination" && stage.advancingCount != null) {
    settings.advancingCount = stage.advancingCount;
  }

  return {
    key: stage.stageKey,
    name: stage.name,
    displayOrder: stage.position,
    capacity: { type: "exact", count: stage.participantCount },
    selectionCapabilities:
      stage.format === "group_stage"
        ? {
            type: "groups",
            exactGroupSizes: calculateBalancedGroupSizes(
              stage.participantCount,
              stage.groupCount!,
            ),
            maximumQualifiersPerGroup: stage.participantsPerGroup!,
          }
        : { type: "none" },
    format: {
      id: stage.format,
      rulesVersion: 1,
      settings,
    },
    matchRules: { bestOf: stage.bestOf },
    classification: {
      type: "format_default",
      policyId:
        stage.format === "swiss"
          ? "swiss_v1"
          : stage.format === "round_robin"
            ? "round_robin_v1"
            : stage.format === "group_stage"
              ? "group_v1"
              : "elimination_bracket_v1",
    },
  };
}

export type CompileBasketAuthorityRoutingPlanResult =
  | { valid: true; value: CompiledTournamentRoutingPlanV2 }
  | { valid: false; problems: readonly { code: string; message: string }[] };

/** Compiles the persisted compatibility projection without restoring linear flow. */
export function compileBasketAuthorityRoutingPlan(
  stages: readonly BasketAuthorityRoutingStage[],
  baskets: readonly StageBasketDefinition[],
  routes: readonly StageBasketRouteDefinition[],
): CompileBasketAuthorityRoutingPlanResult {
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const basketById = new Map(baskets.map((basket) => [basket.id, basket]));
  const directInputs = baskets.filter(
    (basket) => basket.type === "input" && basket.participantIds.length > 0,
  );
  const buckets = directInputs.map((basket, index) => ({
    key: `direct:${basket.id}`,
    name: `Direct entrants: ${basket.id}`,
    exactCapacity: new Set(basket.participantIds).size,
    priority: index,
  }));

  const outputRankStart = new Map<string, number>();
  for (const stage of stages) {
    let nextRank = 1;
    for (const output of baskets
      .filter(
        (basket) => basket.stageId === stage.id && basket.type === "output",
      )
      .sort((left, right) => left.order - right.order)) {
      outputRankStart.set(output.id, nextRank);
      nextRank += output.qualifierCount ?? 0;
    }
  }

  const transitions: TournamentBlueprintV2["transitions"] = [
    ...directInputs.map((basket, index) => {
      const target = stageById.get(basket.stageId)!;
      const exactCapacity = new Set(basket.participantIds).size;
      return {
        key: `direct:${basket.id}`,
        source: { type: "registration" as const, bucketKey: `direct:${basket.id}` },
        target: { stageKey: target.stageKey },
        selection: { type: "all" as const },
        seedAssignment: entrySeeding(target),
        placement: stagePlacement(target),
        reservedSlots: exactCapacity,
        priority: index,
      };
    }),
    ...routes.map((route, index) => {
      const sourceBasket = basketById.get(route.sourceBasketId)!;
      const targetBasket = basketById.get(route.targetBasketId)!;
      const source = stageById.get(sourceBasket.stageId)!;
      const target = stageById.get(targetBasket.stageId)!;
      const count = sourceBasket.qualifierCount!;
      const from = outputRankStart.get(sourceBasket.id)!;
      return {
        key: `route:${route.id}`,
        source: { type: "stage_result" as const, stageKey: source.stageKey },
        target: { stageKey: target.stageKey },
        selection: { type: "rank_range" as const, from, to: from + count - 1 },
        seedAssignment: resultSeeding(source),
        placement: stagePlacement(target),
        reservedSlots: count,
        priority: directInputs.length + index,
      };
    }),
  ];

  const blueprint: TournamentBlueprintV2 = {
    modelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    initialParticipantCount: buckets.reduce(
      (sum, bucket) => sum + bucket.exactCapacity,
      0,
    ),
    buckets,
    stages: stages.map(stageDefinition),
    transitions,
  };
  const compiled = compileTournamentBlueprintV2(blueprint, [
    doubleEliminationFormatEngineV2,
  ]);
  return compiled.valid
    ? { valid: true, value: compiled.value }
    : { valid: false, problems: compiled.problems };
}
