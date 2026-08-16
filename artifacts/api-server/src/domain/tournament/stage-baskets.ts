export type StageBasketType = "input" | "output";

export interface StageBasketDefinition {
  id: string;
  stageId: number;
  type: StageBasketType;
  ordinal: number;
  order: number;
  colorId: string | null;
  participantIds: readonly number[];
  /**
   * How many ranked participants this basket captures after stage execution.
   * • Input baskets: always `null` (players are assigned, not ranked in).
   * • Output baskets in explicit config: positive integer set by the organizer.
   * • Output baskets in legacy implicit config: `null` (not stored in DB;
   *   the API layer computes a read-only value from `advancingCount`).
   */
  qualifierCount: number | null;
}

export interface StageBasketRouteDefinition {
  id: string;
  sourceBasketId: string;
  targetBasketId: string;
}

export interface StageBasketValidationStage {
  id: number;
  position: number;
  /** Used to validate that the sum of output basket qualifierCounts does not
   *  exceed the number of participants entering the stage. */
  participantCount: number;
}

export type StageBasketProblemCode =
  | "STAGE_BASKET_STAGE_NOT_FOUND"
  | "STAGE_BASKET_ID_INVALID"
  | "STAGE_BASKET_ID_DUPLICATE"
  | "STAGE_INPUT_BASKET_COUNT_INVALID"
  | "STAGE_OUTPUT_BASKET_COUNT_INVALID"
  | "STAGE_BASKET_ORDINAL_DUPLICATE"
  | "STAGE_BASKET_ORDINAL_INVALID"
  | "STAGE_BASKET_ORDER_DUPLICATE"
  | "STAGE_BASKET_ORDER_INVALID"
  | "STAGE_BASKET_COLOR_ID_INVALID"
  | "STAGE_BASKET_PARTICIPANT_NOT_FOUND"
  | "STAGE_OUTPUT_BASKET_PARTICIPANTS_NOT_ALLOWED"
  | "STAGE_BASKET_PARTICIPANT_DUPLICATE"
  | "STAGE_BASKET_ROUTE_ID_INVALID"
  | "STAGE_BASKET_ROUTE_ID_DUPLICATE"
  | "STAGE_BASKET_ROUTE_SOURCE_NOT_FOUND"
  | "STAGE_BASKET_ROUTE_TARGET_NOT_FOUND"
  | "STAGE_BASKET_ROUTE_SOURCE_NOT_OUTPUT"
  | "STAGE_BASKET_ROUTE_TARGET_NOT_INPUT"
  | "STAGE_BASKET_ROUTE_OUTPUT_REUSED"
  | "STAGE_BASKET_ROUTE_NOT_FORWARD"
  | "STAGE_BASKET_ROUTE_CYCLE"
  /** Input basket carries a non-null qualifierCount, which is never allowed. */
  | "STAGE_INPUT_BASKET_QUALIFIER_COUNT_NOT_ALLOWED"
  /** Output basket in explicit config has no qualifierCount (null/undefined). */
  | "STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED"
  /** Output basket qualifierCount is provided but is not a positive integer. */
  | "STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_INVALID"
  /** Sum of output basket qualifierCounts exceeds the stage participantCount. */
  | "STAGE_OUTPUT_BASKET_QUOTA_EXCEEDS_PARTICIPANT_COUNT";

export interface StageBasketProblemContext {
  stageId?: number;
  basketId?: string;
  routeId?: string;
  participantId?: number;
  sourceStageId?: number;
  targetStageId?: number;
}

export interface StageBasketProblem {
  code: StageBasketProblemCode;
  message: string;
  context: StageBasketProblemContext;
}

export interface StageBasketValidationResult {
  valid: boolean;
  problems: StageBasketProblem[];
}

export interface StageBasketConfigurationInput {
  stages: readonly StageBasketValidationStage[];
  playerIds: readonly number[];
  baskets: readonly StageBasketDefinition[];
  routes: readonly StageBasketRouteDefinition[];
}

const STABLE_ID = /^[a-z0-9][a-z0-9._:-]{0,99}$/;

export function defaultStageBasketId(
  stageId: number,
  type: StageBasketType,
): string {
  return `stage-${stageId}-${type}-default`;
}

export function defaultStageBasketRouteId(
  sourceStageId: number,
  targetStageId: number,
): string {
  return `stage-${sourceStageId}-to-${targetStageId}-default`;
}

function addProblem(
  problems: StageBasketProblem[],
  code: StageBasketProblemCode,
  message: string,
  context: StageBasketProblemContext,
): void {
  problems.push({ code, message, context });
}

function duplicateValues(values: readonly number[]): Set<number> {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return duplicates;
}

function graphHasCycle(
  edges: ReadonlyMap<number, ReadonlySet<number>>,
): boolean {
  const visiting = new Set<number>();
  const visited = new Set<number>();
  const visit = (stageId: number): boolean => {
    if (visiting.has(stageId)) return true;
    if (visited.has(stageId)) return false;
    visiting.add(stageId);
    for (const target of edges.get(stageId) ?? []) {
      if (visit(target)) return true;
    }
    visiting.delete(stageId);
    visited.add(stageId);
    return false;
  };
  return [...edges.keys()].some(visit);
}

/**
 * Validates the editable, stage-level basket graph. Match routing remains owned
 * by Tournament Engine V2; this graph only partitions stage entry/exit flow.
 *
 * @param mode
 *   - `"explicit"` — every output basket must carry a positive qualifierCount.
 *     Use for PUT stage-baskets, Backup V3 restore, and any future runtime flow.
 *   - `"legacy"` (default) — output baskets may have null qualifierCount for
 *     backward-compatible implicit configurations (terminal stages, group stages
 *     with ambiguous advancing counts, etc.).  Never use this path to drive
 *     Phase 2+ runtime basket transfer.
 */
export function validateStageBasketConfiguration(
  input: StageBasketConfigurationInput,
  mode: "explicit" | "legacy" = "legacy",
): StageBasketValidationResult {
  const problems: StageBasketProblem[] = [];
  const stageById = new Map(input.stages.map((stage) => [stage.id, stage]));
  const playerIds = new Set(input.playerIds);
  const basketById = new Map<string, StageBasketDefinition>();
  const seenBasketIds = new Set<string>();

  for (const basket of input.baskets) {
    if (!STABLE_ID.test(basket.id)) {
      addProblem(
        problems,
        "STAGE_BASKET_ID_INVALID",
        "Basket id must be a stable lowercase identifier.",
        {
          stageId: basket.stageId,
          basketId: basket.id,
        },
      );
    }
    if (seenBasketIds.has(basket.id)) {
      addProblem(
        problems,
        "STAGE_BASKET_ID_DUPLICATE",
        "Basket id is duplicated.",
        {
          stageId: basket.stageId,
          basketId: basket.id,
        },
      );
    } else {
      seenBasketIds.add(basket.id);
      basketById.set(basket.id, basket);
    }
    if (!stageById.has(basket.stageId)) {
      addProblem(
        problems,
        "STAGE_BASKET_STAGE_NOT_FOUND",
        "Basket references a missing stage.",
        {
          stageId: basket.stageId,
          basketId: basket.id,
        },
      );
    }
    if (
      !Number.isInteger(basket.ordinal) ||
      basket.ordinal < 1 ||
      basket.ordinal > 4
    ) {
      addProblem(
        problems,
        "STAGE_BASKET_ORDINAL_INVALID",
        "Basket ordinal must be an integer from 1 to 4.",
        {
          stageId: basket.stageId,
          basketId: basket.id,
        },
      );
    }
    if (
      !Number.isInteger(basket.order) ||
      basket.order < 1 ||
      basket.order > 4
    ) {
      addProblem(
        problems,
        "STAGE_BASKET_ORDER_INVALID",
        "Basket order must be an integer from 1 to 4.",
        {
          stageId: basket.stageId,
          basketId: basket.id,
        },
      );
    }
    if (
      basket.colorId != null &&
      (basket.colorId.trim().length < 1 || basket.colorId.trim().length > 64)
    ) {
      addProblem(
        problems,
        "STAGE_BASKET_COLOR_ID_INVALID",
        "Basket color id must contain from 1 to 64 characters.",
        {
          stageId: basket.stageId,
          basketId: basket.id,
        },
      );
    }
    if (basket.type === "output" && basket.participantIds.length > 0) {
      addProblem(
        problems,
        "STAGE_OUTPUT_BASKET_PARTICIPANTS_NOT_ALLOWED",
        "Output basket contents are produced by stage execution and cannot be assigned manually.",
        {
          stageId: basket.stageId,
          basketId: basket.id,
        },
      );
    }
    // qualifierCount invariant: input baskets must have null.
    if (basket.type === "input" && basket.qualifierCount !== null) {
      addProblem(
        problems,
        "STAGE_INPUT_BASKET_QUALIFIER_COUNT_NOT_ALLOWED",
        "Input baskets cannot carry qualifierCount; it must be null.",
        { stageId: basket.stageId, basketId: basket.id },
      );
    }
    // qualifierCount invariant: when set on an output basket it must be a
    // positive integer (zero or negative values are not meaningful).
    if (
      basket.type === "output" &&
      basket.qualifierCount !== null &&
      (!Number.isInteger(basket.qualifierCount) || basket.qualifierCount < 1)
    ) {
      addProblem(
        problems,
        "STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_INVALID",
        "Output basket qualifierCount must be a positive integer when provided.",
        { stageId: basket.stageId, basketId: basket.id },
      );
    }
    // In explicit mode every output basket must carry a positive qualifierCount.
    // Legacy mode allows null on outputs (terminal stages, group stages with
    // ambiguous advancingCount, etc.) for backward compatibility only.
    // This null must NEVER be treated as a valid explicit runtime quota.
    if (
      mode === "explicit" &&
      basket.type === "output" &&
      basket.qualifierCount === null
    ) {
      addProblem(
        problems,
        "STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED",
        "Explicit output basket must have a positive qualifierCount.",
        { stageId: basket.stageId, basketId: basket.id },
      );
    }
  }

  for (const stage of input.stages) {
    const stageBaskets = input.baskets.filter(
      (basket) => basket.stageId === stage.id,
    );
    for (const type of ["input", "output"] as const) {
      const typed = stageBaskets.filter((basket) => basket.type === type);
      if (typed.length < 1 || typed.length > 4) {
        addProblem(
          problems,
          type === "input"
            ? "STAGE_INPUT_BASKET_COUNT_INVALID"
            : "STAGE_OUTPUT_BASKET_COUNT_INVALID",
          `Stage must have between 1 and 4 ${type} baskets.`,
          { stageId: stage.id },
        );
      }
      for (const ordinal of duplicateValues(
        typed.map((basket) => basket.ordinal),
      )) {
        addProblem(
          problems,
          "STAGE_BASKET_ORDINAL_DUPLICATE",
          "Basket ordinal is duplicated within its stage and type.",
          {
            stageId: stage.id,
            basketId: typed.find((basket) => basket.ordinal === ordinal)?.id,
          },
        );
      }
      for (const order of duplicateValues(
        typed.map((basket) => basket.order),
      )) {
        addProblem(
          problems,
          "STAGE_BASKET_ORDER_DUPLICATE",
          "Basket order is duplicated within its stage and type.",
          {
            stageId: stage.id,
            basketId: typed.find((basket) => basket.order === order)?.id,
          },
        );
      }
    }

    // qualifierCount sum invariant: total qualifying slots must not exceed the
    // number of participants the stage can host.
    const outputQualifierCounts = stageBaskets
      .filter((b) => b.type === "output" && b.qualifierCount !== null)
      .map((b) => b.qualifierCount as number);
    if (outputQualifierCounts.length > 0) {
      const totalQuota = outputQualifierCounts.reduce((a, b) => a + b, 0);
      if (totalQuota > stage.participantCount) {
        addProblem(
          problems,
          "STAGE_OUTPUT_BASKET_QUOTA_EXCEEDS_PARTICIPANT_COUNT",
          `Total qualifier quota (${totalQuota}) exceeds stage participant count (${stage.participantCount}).`,
          { stageId: stage.id },
        );
      }
    }

    const assignedParticipants = new Set<number>();
    for (const basket of stageBaskets.filter(
      (candidate) => candidate.type === "input",
    )) {
      for (const participantId of basket.participantIds) {
        if (!playerIds.has(participantId)) {
          addProblem(
            problems,
            "STAGE_BASKET_PARTICIPANT_NOT_FOUND",
            "Input basket references a player outside its tournament.",
            {
              stageId: stage.id,
              basketId: basket.id,
              participantId,
            },
          );
        }
        if (assignedParticipants.has(participantId)) {
          addProblem(
            problems,
            "STAGE_BASKET_PARTICIPANT_DUPLICATE",
            "Participant is assigned to more than one input basket in the same stage.",
            {
              stageId: stage.id,
              basketId: basket.id,
              participantId,
            },
          );
        }
        assignedParticipants.add(participantId);
      }
    }
  }

  const routeIds = new Set<string>();
  const usedOutputs = new Set<string>();
  const graph = new Map<number, Set<number>>();
  for (const route of input.routes) {
    if (!STABLE_ID.test(route.id)) {
      addProblem(
        problems,
        "STAGE_BASKET_ROUTE_ID_INVALID",
        "Route id must be a stable lowercase identifier.",
        {
          routeId: route.id,
        },
      );
    }
    if (routeIds.has(route.id)) {
      addProblem(
        problems,
        "STAGE_BASKET_ROUTE_ID_DUPLICATE",
        "Route id is duplicated.",
        { routeId: route.id },
      );
    }
    routeIds.add(route.id);
    const source = basketById.get(route.sourceBasketId);
    const target = basketById.get(route.targetBasketId);
    if (!source) {
      addProblem(
        problems,
        "STAGE_BASKET_ROUTE_SOURCE_NOT_FOUND",
        "Route source basket does not exist.",
        {
          routeId: route.id,
          basketId: route.sourceBasketId,
        },
      );
    }
    if (!target) {
      addProblem(
        problems,
        "STAGE_BASKET_ROUTE_TARGET_NOT_FOUND",
        "Route target basket does not exist.",
        {
          routeId: route.id,
          basketId: route.targetBasketId,
        },
      );
    }
    if (source?.type !== "output") {
      addProblem(
        problems,
        "STAGE_BASKET_ROUTE_SOURCE_NOT_OUTPUT",
        "Route source must be an output basket.",
        {
          routeId: route.id,
          basketId: route.sourceBasketId,
          sourceStageId: source?.stageId,
        },
      );
    }
    if (target?.type !== "input") {
      addProblem(
        problems,
        "STAGE_BASKET_ROUTE_TARGET_NOT_INPUT",
        "Route target must be an input basket.",
        {
          routeId: route.id,
          basketId: route.targetBasketId,
          targetStageId: target?.stageId,
        },
      );
    }
    if (usedOutputs.has(route.sourceBasketId)) {
      addProblem(
        problems,
        "STAGE_BASKET_ROUTE_OUTPUT_REUSED",
        "An output basket can source only one route.",
        {
          routeId: route.id,
          basketId: route.sourceBasketId,
        },
      );
    }
    usedOutputs.add(route.sourceBasketId);
    if (source && target) {
      const sourceStage = stageById.get(source.stageId);
      const targetStage = stageById.get(target.stageId);
      if (
        !sourceStage ||
        !targetStage ||
        targetStage.position <= sourceStage.position
      ) {
        addProblem(
          problems,
          "STAGE_BASKET_ROUTE_NOT_FORWARD",
          "Basket routing must point to a later stage.",
          {
            routeId: route.id,
            sourceStageId: source.stageId,
            targetStageId: target.stageId,
          },
        );
      }
      const targets = graph.get(source.stageId) ?? new Set<number>();
      targets.add(target.stageId);
      graph.set(source.stageId, targets);
    }
  }
  if (graphHasCycle(graph)) {
    addProblem(
      problems,
      "STAGE_BASKET_ROUTE_CYCLE",
      "Basket routing graph contains a cycle.",
      {},
    );
  }

  return { valid: problems.length === 0, problems };
}
