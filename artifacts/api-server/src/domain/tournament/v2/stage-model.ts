/**
 * Tournament engine v2 is a neutral domain contract. It intentionally does not
 * persist data or alter the v1 runtime. Concrete format handlers and transition
 * evaluators can be added behind these references without changing the graph.
 */
export const TOURNAMENT_ENGINE_MODEL_VERSION = 2 as const;

export type TournamentEngineModelVersion = typeof TOURNAMENT_ENGINE_MODEL_VERSION;

export type BuiltinStageFormatIdV2 =
  | "swiss"
  | "round_robin"
  | "group_stage"
  | "single_elimination"
  | "double_elimination"
  | "gsl_groups"
  | "stepladder"
  | "gauntlet"
  | "repechage"
  | "classification_playoff"
  | "last_chance";

export type StageFormatIdV2 = BuiltinStageFormatIdV2 | `custom:${string}`;

export interface ParticipantBucketV2 {
  key: string;
  name: string;
  /** Lower values are considered first when a policy needs a stable bucket order. */
  priority: number;
}

export type ParticipantCapacityV2 =
  | { type: "exact"; count: number }
  | { type: "range"; minimum: number; maximum: number; preferred?: number };

export interface StageFormatRefV2 {
  id: StageFormatIdV2;
  rulesVersion: number;
  settings: Readonly<Record<string, unknown>>;
}

export interface StageMatchRulesV2 {
  bestOf: number;
}

export type RankingDirectionV2 = "ascending" | "descending";
export type RankingScopeV2 = "global" | "within_group" | "within_rank_band";

export interface RankingCriterionV2 {
  metric: string;
  direction: RankingDirectionV2;
  scope: RankingScopeV2;
}

export type UnresolvedTiePolicyV2 =
  | "shared_rank_band"
  | "previous_seed"
  | "random"
  | "manual";

export type StageClassificationPolicyV2 =
  | { type: "format_default"; policyId: string }
  | {
      type: "ordered_criteria";
      criteria: readonly RankingCriterionV2[];
      unresolvedTie: UnresolvedTiePolicyV2;
    }
  | { type: "policy_ref"; policyId: string; settings: Readonly<Record<string, unknown>> };

export interface TournamentStageDefinitionV2 {
  key: string;
  name: string;
  /** Presentation hint only. Graph edges remain the source of participant flow. */
  displayOrder: number;
  capacity: ParticipantCapacityV2;
  format: StageFormatRefV2;
  matchRules: StageMatchRulesV2;
  classification: StageClassificationPolicyV2;
}

export type TransitionSourceV2 =
  | { type: "registration"; bucketKey: string }
  | { type: "stage_result"; stageKey: string };

export interface TransitionTargetV2 {
  stageKey: string;
  /** Optional named entry point, for example `upper_round_2` or `play_in`. */
  entryPoint?: string;
}

export type ParticipantSelectionRuleV2 =
  | { type: "all" }
  | { type: "top_n"; count: number }
  | { type: "rank_range"; from: number; to: number }
  | { type: "top_n_per_group"; count: number }
  | { type: "best_not_selected"; count: number }
  | { type: "round_outcome"; round: number; outcome: "winner" | "loser" }
  | { type: "policy_ref"; policyId: string; settings: Readonly<Record<string, unknown>> };

export type SeedAssignmentPolicyV2 =
  | { type: "preserve" }
  | {
      type: "classification_order";
      criteria: readonly RankingCriterionV2[];
      unresolvedTie: Exclude<UnresolvedTiePolicyV2, "shared_rank_band">;
    }
  | {
      type: "rank_bands";
      bandMetric: "overall_rank" | "group_rank" | string;
      withinBand: readonly RankingCriterionV2[];
      unresolvedTie: Exclude<UnresolvedTiePolicyV2, "shared_rank_band">;
    }
  | { type: "fixed_range"; firstSeed: number }
  | { type: "random"; reveal: "instant" | "sequential"; randomSeed?: string }
  | { type: "manual" }
  | { type: "policy_ref"; policyId: string; settings: Readonly<Record<string, unknown>> };

export type StagePlacementPolicyV2 =
  | { type: "format_default" }
  | { type: "standard_seeded_bracket"; reseedEachRound: boolean }
  | { type: "snake_groups" }
  | { type: "random"; randomSeed?: string }
  | { type: "manual" }
  | { type: "policy_ref"; policyId: string; settings: Readonly<Record<string, unknown>> };

export interface StageTransitionV2 {
  key: string;
  source: TransitionSourceV2;
  target: TransitionTargetV2;
  selection: ParticipantSelectionRuleV2;
  seedAssignment: SeedAssignmentPolicyV2;
  placement: StagePlacementPolicyV2;
  /**
   * Optional slot reservation in the target stage. Multiple incoming routes can
   * reserve independent portions of the same target capacity.
   */
  reservedSlots?: number;
  priority: number;
}

export interface TournamentBlueprintV2 {
  modelVersion: TournamentEngineModelVersion;
  initialParticipantCount: number;
  buckets: readonly ParticipantBucketV2[];
  stages: readonly TournamentStageDefinitionV2[];
  transitions: readonly StageTransitionV2[];
}

export interface RankBandV2 {
  from: number;
  to: number;
}

export type StageMetricValueV2 = number | string | boolean | null;

export interface StageStandingV2 {
  participantKey: string;
  stageSeed: number;
  rankBand: RankBandV2;
  group?: { key: string; rankBand: RankBandV2 };
  metrics: Readonly<Record<string, StageMetricValueV2>>;
}

/** Pure classification produced by a format. It contains no routing decisions. */
export interface StageResultV2 {
  stageKey: string;
  revision: number;
  status: "provisional" | "final";
  standings: readonly StageStandingV2[];
}

export interface StageTransitionAssignmentV2 {
  transitionKey: string;
  participantKey: string;
  targetStageKey: string;
  targetEntryPoint?: string;
  nextStageSeed: number;
  placementKey?: string;
}

/**
 * Output of evaluating one or more transitions against a final StageResultV2.
 * Kept separate from StageResultV2 so qualification and seeding never mutate
 * the format's classification.
 */
export interface StageRoutingResultV2 {
  sourceStageKey: string;
  sourceRevision: number;
  assignments: readonly StageTransitionAssignmentV2[];
  unassignedParticipantKeys: readonly string[];
}
