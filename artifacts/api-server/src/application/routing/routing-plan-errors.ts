export type RoutingPlanPersistenceErrorCode =
  | "INVALID_COMPILED_ROUTING_PLAN"
  | "DUPLICATE_ROUTE_OR_SLOT_TARGET"
  | "INCOMPLETE_STAGE_MAPPING"
  | "ROUTING_PLAN_DUPLICATE_STAGE_MAPPING"
  | "FOREIGN_STAGE_MAPPING"
  | "STAGE_CAPACITY_MISMATCH"
  | "ROUTING_PLAN_STAGE_FORMAT_MISMATCH"
  | "ROUTING_PLAN_PERSISTENCE_NOT_ALLOWED"
  | "ROUTING_PLAN_VERSION_CONFLICT"
  | "ROUTING_PLAN_NOT_FOUND"
  | "ROUTING_PLAN_CHECKSUM_MISMATCH"
  | "ROUTING_PLAN_PAYLOAD_MISMATCH"
  | "CORRUPTED_ROUTING_GRAPH"
  | "CORRUPTED_ROUTING_ORDINAL_SEQUENCE"
  | "UNEXPECTED_ROUTING_CHILD_ROW"
  | "NAMED_OUTPUT_STAGE_MISMATCH"
  | "MISSING_LOGICAL_MATCH_SLOT"
  | "UNKNOWN_PERSISTED_DISCRIMINANT"
  | "UNSUPPORTED_ROUTING_MODEL_VERSION";

const MESSAGES: Record<RoutingPlanPersistenceErrorCode, string> = {
  INVALID_COMPILED_ROUTING_PLAN:
    "Compiled tournament routing plan is invalid.",
  DUPLICATE_ROUTE_OR_SLOT_TARGET:
    "Compiled tournament routing plan contains a duplicate route or slot target.",
  INCOMPLETE_STAGE_MAPPING:
    "Every compiled stage must map to exactly one persisted tournament stage.",
  ROUTING_PLAN_DUPLICATE_STAGE_MAPPING:
    "Two compiled stages cannot map to the same persisted tournament stage.",
  FOREIGN_STAGE_MAPPING:
    "A mapped tournament stage belongs to another tournament.",
  STAGE_CAPACITY_MISMATCH:
    "Compiled stage capacity does not match the persisted tournament stage.",
  ROUTING_PLAN_STAGE_FORMAT_MISMATCH:
    "Compiled stage format does not match the persisted tournament stage.",
  ROUTING_PLAN_PERSISTENCE_NOT_ALLOWED:
    "A compiled routing plan can be persisted only before tournament execution begins.",
  ROUTING_PLAN_VERSION_CONFLICT:
    "This tournament routing plan revision already contains different content.",
  ROUTING_PLAN_NOT_FOUND:
    "Tournament routing plan was not found.",
  ROUTING_PLAN_CHECKSUM_MISMATCH:
    "Persisted tournament routing plan checksum does not match its canonical payload.",
  ROUTING_PLAN_PAYLOAD_MISMATCH:
    "Relational tournament routing data does not match its canonical payload.",
  CORRUPTED_ROUTING_GRAPH:
    "Persisted tournament routing graph is incomplete or invalid.",
  CORRUPTED_ROUTING_ORDINAL_SEQUENCE:
    "Persisted tournament routing data contains a non-contiguous ordinal sequence.",
  UNEXPECTED_ROUTING_CHILD_ROW:
    "Persisted tournament routing data contains an unexpected child row.",
  NAMED_OUTPUT_STAGE_MISMATCH:
    "Persisted named output does not belong to the route source stage.",
  MISSING_LOGICAL_MATCH_SLOT:
    "Persisted route target references a missing logical match slot.",
  UNKNOWN_PERSISTED_DISCRIMINANT:
    "Persisted tournament routing data contains an unknown discriminant.",
  UNSUPPORTED_ROUTING_MODEL_VERSION:
    "Persisted tournament routing plan uses an unsupported model version.",
};

export class RoutingPlanPersistenceError extends Error {
  constructor(
    public readonly code: RoutingPlanPersistenceErrorCode,
    public readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(MESSAGES[code]);
    this.name = "RoutingPlanPersistenceError";
  }
}
