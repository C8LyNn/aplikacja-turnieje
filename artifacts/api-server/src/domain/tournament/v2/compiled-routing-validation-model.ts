import type { CompiledTournamentRoutingPlanV2 } from "./compiled-routing-model";

export type CompiledRoutingProblemCodeV2 =
  | "INVALID_COMPILED_PLAN_VERSION"
  | "INVALID_BLUEPRINT_MODEL_VERSION"
  | "INVALID_STRUCTURE"
  | "INVALID_KEY"
  | "INVALID_PRIORITY"
  | "INVALID_ORDER"
  | "INVALID_CAPACITY"
  | "INVALID_RESERVED_SLOTS"
  | "INVALID_ENTRY_COMPLETENESS"
  | "DUPLICATE_STAGE_KEY"
  | "DUPLICATE_ENTRY_POINT_KEY"
  | "DUPLICATE_LOGICAL_MATCH_KEY"
  | "DUPLICATE_ROUTE_KEY"
  | "DUPLICATE_OUTPUT_KEY"
  | "DUPLICATE_DEPENDENCY"
  | "UNKNOWN_SOURCE_TYPE"
  | "UNKNOWN_TARGET_TYPE"
  | "UNKNOWN_CONDITION_TYPE"
  | "UNKNOWN_LINEAGE_TYPE"
  | "UNKNOWN_SELECTION_TYPE"
  | "UNKNOWN_MATCH_OUTCOME"
  | "INVALID_SELECTION"
  | "SELECTION_CARDINALITY_MISMATCH"
  | "SELECTION_EXCEEDS_SOURCE_CAPACITY"
  | "REGISTRATION_BUCKET_CAPACITY_MISMATCH"
  | "UNKNOWN_REGISTRATION_BUCKET"
  | "GROUP_SELECTION_CAPABILITY_REQUIRED"
  | "INVALID_GROUP_SELECTION"
  | "UNKNOWN_SOURCE_STAGE"
  | "UNKNOWN_SOURCE_ENTRY_POINT"
  | "UNKNOWN_SOURCE_MATCH"
  | "UNKNOWN_SOURCE_OUTPUT"
  | "UNKNOWN_TARGET_STAGE"
  | "UNKNOWN_TARGET_ENTRY_POINT"
  | "UNKNOWN_TARGET_MATCH"
  | "UNKNOWN_TARGET_OUTPUT"
  | "INVALID_TARGET_SLOT"
  | "INVALID_ENTRY_POSITION"
  | "ENTRY_POINT_CAPACITY_MISMATCH"
  | "STAGE_ENTRY_CAPACITY_MISMATCH"
  | "OUTPUT_CAPACITY_UNDERFILLED"
  | "OUTPUT_CAPACITY_EXCEEDED"
  | "CONDITIONAL_EXACT_OUTPUT_ROUTE"
  | "CONDITIONAL_EXACT_ENTRY_ROUTE"
  | "TARGET_SLOT_CONFLICT"
  | "MATCH_OUTCOME_FAN_OUT"
  | "STAGE_ENTRY_POSITION_FAN_OUT"
  | "CROSS_STAGE_MATCH_ROUTE"
  | "INVALID_STAGE_OUTPUT_ROUTE"
  | "UNKNOWN_CONDITION_ROUTE"
  | "UNKNOWN_CONDITION_MATCH"
  | "UNKNOWN_CONDITION_ENTRY_POINT"
  | "CONDITION_NOT_PREDECESSOR"
  | "CONDITION_SELF_REFERENCE"
  | "CONDITION_CROSS_STAGE_REFERENCE"
  | "CONDITION_DEPENDENCY_CYCLE"
  | "INVALID_LINEAGE_REFERENCE"
  | "INVALID_DEPENDENCY"
  | "CYCLIC_ROUTING_GRAPH";

export interface CompiledRoutingProblemV2 {
  code: CompiledRoutingProblemCodeV2;
  path: string;
  message: string;
}

export type CompiledRoutingValidationResultV2 =
  | { valid: true; value: CompiledTournamentRoutingPlanV2 }
  | { valid: false; problems: CompiledRoutingProblemV2[] };

export type AddCompiledRoutingProblemV2 = (
  code: CompiledRoutingProblemCodeV2,
  path: string,
  message: string,
) => void;

export function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

export function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

export function pairKey(stageKey: string, localKey: string): string {
  return `${stageKey}\u0000${localKey}`;
}
