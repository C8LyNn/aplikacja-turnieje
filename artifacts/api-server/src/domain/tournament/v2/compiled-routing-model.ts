import type {
  StageFormatIdV2,
  TournamentEngineModelVersion,
} from "./stage-model";

export const COMPILED_ROUTING_PLAN_VERSION_V2 = 1 as const;

export type CompiledRoutingPlanVersionV2 =
  typeof COMPILED_ROUTING_PLAN_VERSION_V2;

type Brand<Value, Name extends string> = Value & {
  readonly __brand: Name;
};

export type StageKeyV2 = Brand<string, "StageKeyV2">;
export type RegistrationBucketKeyV2 = Brand<
  string,
  "RegistrationBucketKeyV2"
>;
export type EntryPointKeyV2 = Brand<string, "EntryPointKeyV2">;
export type LogicalMatchKeyV2 = Brand<string, "LogicalMatchKeyV2">;
export type StageOutputKeyV2 = Brand<string, "StageOutputKeyV2">;
export type RouteKeyV2 = Brand<string, "RouteKeyV2">;
export type RoutingNodeKeyV2 = Brand<string, "RoutingNodeKeyV2">;

export type MatchOutcomeV2 = "winner" | "loser";
export type MatchSlotV2 = 1 | 2;

export interface CompiledRegistrationBucketV2 {
  bucketKey: RegistrationBucketKeyV2;
  name: string;
  exactCapacity: number;
  priority: number;
}

export type CompiledStageSelectionCapabilitiesV2 =
  | { type: "none" }
  | {
      type: "groups";
      exactGroupCount: number;
      exactGroupSizes: readonly number[];
      maximumQualifiersPerGroup: number;
    };

export interface CompiledStageV2 {
  stageKey: StageKeyV2;
  name: string;
  displayOrder: number;
  exactParticipantCapacity: number;
  selectionCapabilities: CompiledStageSelectionCapabilitiesV2;
  formatId: StageFormatIdV2;
  formatRulesVersion: number;
}

export interface CompiledStageEntryPointV2 {
  stageKey: StageKeyV2;
  entryKey: EntryPointKeyV2;
  name?: string;
  exactCapacity: number;
  priority: number;
  completeness: { type: "exact" };
}

export interface CompiledLogicalMatchV2 {
  matchKey: LogicalMatchKeyV2;
  stageKey: StageKeyV2;
  name?: string;
  order: number;
  slots: readonly [1, 2];
}

export interface CompiledStageOutputV2 {
  stageKey: StageKeyV2;
  outputKey: StageOutputKeyV2;
  name?: string;
  exactCapacity: number;
  priority: number;
}

/**
 * Closed, execution-ready participant selection. Unlike the authoring model,
 * every variant carries the exact number of participants that it yields.
 */
export type CompiledParticipantSelectionV2 =
  | {
      type: "all";
      exactCardinality: number;
    }
  | {
      type: "top_n";
      count: number;
      exactCardinality: number;
    }
  | {
      type: "rank_range";
      from: number;
      to: number;
      exactCardinality: number;
    }
  | {
      type: "top_n_per_group";
      countPerGroup: number;
      groupCount: number;
      exactGroupSizes: readonly number[];
      exactCardinality: number;
    }
  | {
      type: "named_output";
      outputKey: StageOutputKeyV2;
      exactCardinality: number;
    }
  | {
      type: "best_not_selected";
      count: number;
      exactCardinality: number;
    };

export type CompiledRouteSourceV2 =
  | {
      type: "registration_bucket";
      bucketKey: RegistrationBucketKeyV2;
      selection: CompiledParticipantSelectionV2;
    }
  | {
      type: "stage_result";
      stageKey: StageKeyV2;
      selection: CompiledParticipantSelectionV2;
    }
  | {
      type: "stage_entry";
      stageKey: StageKeyV2;
      entryKey: EntryPointKeyV2;
      position: number;
    }
  | {
      type: "match_outcome";
      stageKey: StageKeyV2;
      matchKey: LogicalMatchKeyV2;
      outcome: MatchOutcomeV2;
    };

export type CompiledRouteTargetV2 =
  | {
      type: "stage_entry";
      stageKey: StageKeyV2;
      entryKey: EntryPointKeyV2;
    }
  | {
      type: "match_slot";
      stageKey: StageKeyV2;
      matchKey: LogicalMatchKeyV2;
      slot: MatchSlotV2;
    }
  | {
      type: "stage_output";
      stageKey: StageKeyV2;
      outputKey: StageOutputKeyV2;
    };

export type CompiledParticipantLineageV2 =
  | {
      type: "stage_entry";
      stageKey: StageKeyV2;
      entryKey: EntryPointKeyV2;
    }
  | {
      type: "route";
      routeKey: RouteKeyV2;
    };

export type CompiledRoutingConditionV2 =
  | { type: "always" }
  | {
      type: "participant_lineage";
      lineage: CompiledParticipantLineageV2;
    }
  | {
      type: "match_winner_lineage";
      matchKey: LogicalMatchKeyV2;
      lineage: CompiledParticipantLineageV2;
    };

export interface CompiledParticipantRouteV2 {
  routeKey: RouteKeyV2;
  source: CompiledRouteSourceV2;
  target: CompiledRouteTargetV2;
  reservedSlots: number;
  priority: number;
  order: number;
  condition: CompiledRoutingConditionV2;
}

export interface CompiledRoutingDependencyV2 {
  routeKey: RouteKeyV2;
  sourceNodeKey: RoutingNodeKeyV2;
  targetNodeKey: RoutingNodeKeyV2;
}

/**
 * Canonical, infrastructure-neutral result of compiling an authoring
 * blueprint. Routes are graph edges; dependencies expose the same graph in a
 * form suitable for deterministic topological validation and future runtimes.
 */
export interface CompiledTournamentRoutingPlanV2 {
  compiledPlanVersion: CompiledRoutingPlanVersionV2;
  blueprintModelVersion: TournamentEngineModelVersion;
  registrationBuckets: readonly CompiledRegistrationBucketV2[];
  stages: readonly CompiledStageV2[];
  entryPoints: readonly CompiledStageEntryPointV2[];
  logicalMatches: readonly CompiledLogicalMatchV2[];
  outputs: readonly CompiledStageOutputV2[];
  routes: readonly CompiledParticipantRouteV2[];
  dependencies: readonly CompiledRoutingDependencyV2[];
}

function branded<Value extends string, Name extends string>(
  value: Value,
): Brand<Value, Name> {
  return value as Brand<Value, Name>;
}

export function stageKeyV2(value: string): StageKeyV2 {
  return branded<string, "StageKeyV2">(value);
}

export function registrationBucketKeyV2(
  value: string,
): RegistrationBucketKeyV2 {
  return branded<string, "RegistrationBucketKeyV2">(value);
}

export function entryPointKeyV2(value: string): EntryPointKeyV2 {
  return branded<string, "EntryPointKeyV2">(value);
}

export function logicalMatchKeyV2(
  stageKey: StageKeyV2,
  localKey: string,
): LogicalMatchKeyV2 {
  return branded<string, "LogicalMatchKeyV2">(
    `${encodeURIComponent(stageKey)}/match/${encodeURIComponent(localKey)}`,
  );
}

export function stageOutputKeyV2(value: string): StageOutputKeyV2 {
  return branded<string, "StageOutputKeyV2">(value);
}

export function blueprintRouteKeyV2(value: string): RouteKeyV2 {
  return branded<string, "RouteKeyV2">(
    `blueprint/${encodeURIComponent(value)}`,
  );
}

export function formatRouteKeyV2(
  stageKey: StageKeyV2,
  localKey: string,
): RouteKeyV2 {
  return branded<string, "RouteKeyV2">(
    `${encodeURIComponent(stageKey)}/route/${encodeURIComponent(localKey)}`,
  );
}

export function routingNodeKeyV2(value: string): RoutingNodeKeyV2 {
  return branded<string, "RoutingNodeKeyV2">(value);
}

export function routeSourceNodeKeyV2(
  source: CompiledRouteSourceV2,
): RoutingNodeKeyV2 {
  switch (source.type) {
    case "registration_bucket":
      return routingNodeKeyV2(`registration/${encodeURIComponent(source.bucketKey)}`);
    case "stage_result":
      return routingNodeKeyV2(`stage/${encodeURIComponent(source.stageKey)}/output`);
    case "stage_entry":
      return routingNodeKeyV2(
        `stage/${encodeURIComponent(source.stageKey)}/entry/${encodeURIComponent(source.entryKey)}`,
      );
    case "match_outcome":
      return routingNodeKeyV2(`match/${encodeURIComponent(source.matchKey)}`);
  }
}

export function routeTargetNodeKeyV2(
  target: CompiledRouteTargetV2,
): RoutingNodeKeyV2 {
  switch (target.type) {
    case "stage_entry":
      return routingNodeKeyV2(
        `stage/${encodeURIComponent(target.stageKey)}/entry/${encodeURIComponent(target.entryKey)}`,
      );
    case "match_slot":
      return routingNodeKeyV2(`match/${encodeURIComponent(target.matchKey)}`);
    case "stage_output":
      return routingNodeKeyV2(`stage/${encodeURIComponent(target.stageKey)}/output`);
  }
}
