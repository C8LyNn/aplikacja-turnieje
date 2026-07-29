import type {
  CompiledLogicalMatchV2,
  CompiledParticipantRouteV2,
  CompiledStageOutputV2,
  EntryPointKeyV2,
  LogicalMatchKeyV2,
  RouteKeyV2,
  StageKeyV2,
  StageOutputKeyV2,
} from "./compiled-routing-model";
import type {
  StageFormatIdV2,
  TournamentStageDefinitionV2,
} from "./stage-model";

export interface StageFormatKeyFactoryV2 {
  entryPoint(localKey: string): EntryPointKeyV2;
  logicalMatch(localKey: string): LogicalMatchKeyV2;
  output(localKey: string): StageOutputKeyV2;
  route(localKey: string): RouteKeyV2;
}

export interface StageFormatCompilationContextV2 {
  stage: Readonly<TournamentStageDefinitionV2>;
  stageKey: StageKeyV2;
  keys: StageFormatKeyFactoryV2;
}

export interface StageFormatCompilationV2 {
  logicalMatches: readonly CompiledLogicalMatchV2[];
  outputs: readonly CompiledStageOutputV2[];
  routes: readonly CompiledParticipantRouteV2[];
}

/**
 * Pure contract for a future format compiler. Implementations receive only
 * immutable domain data and deterministic key factories.
 */
export interface StageFormatEngineV2 {
  readonly formatId: StageFormatIdV2;
  readonly rulesVersion: number;
  compile(
    context: Readonly<StageFormatCompilationContextV2>,
  ): StageFormatCompilationV2;
}
