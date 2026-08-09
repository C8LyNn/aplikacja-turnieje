import {
  COMPILED_ROUTING_PLAN_VERSION_V2,
  routeSourceNodeKeyV2,
  routeTargetNodeKeyV2,
  routingNodeKeyV2,
  type CompiledParticipantLineageV2,
  type CompiledParticipantRouteV2,
  type EntryPointKeyV2,
  type LogicalMatchKeyV2,
  type RouteKeyV2,
  type StageKeyV2,
} from "./compiled-routing-model";
import {
  isNonEmptyString,
  isNonNegativeInteger,
  isPositiveInteger,
  pairKey,
  type AddCompiledRoutingProblemV2,
} from "./compiled-routing-validation-model";
import { validateCompiledOutputCapacitiesV2 } from "./validate-compiled-routing-capacity";
import { validateCompiledRoutingGraphV2 } from "./validate-compiled-routing-graph";
import { validateCompiledRoutingStructureV2 } from "./validate-compiled-routing-structure";
import { TOURNAMENT_ENGINE_MODEL_VERSION } from "./stage-model";

export type {
  CompiledRoutingProblemCodeV2,
  CompiledRoutingProblemV2,
  CompiledRoutingValidationResultV2,
} from "./compiled-routing-validation-model";
import type {
  CompiledRoutingProblemV2,
  CompiledRoutingValidationResultV2,
} from "./compiled-routing-validation-model";

function validateLineageReferences(
  lineage: CompiledParticipantLineageV2,
  path: string,
  routeKeys: ReadonlySet<RouteKeyV2>,
  entryKeys: ReadonlySet<string>,
  add: AddCompiledRoutingProblemV2,
): void {
  switch (lineage.type) {
    case "stage_entry":
      if (!entryKeys.has(pairKey(lineage.stageKey, lineage.entryKey))) {
        add(
          "UNKNOWN_CONDITION_ENTRY_POINT",
          path,
          `Condition references unknown entry point ${lineage.stageKey}/${lineage.entryKey}.`,
        );
      }
      return;
    case "route":
      if (!routeKeys.has(lineage.routeKey)) {
        add(
          "UNKNOWN_CONDITION_ROUTE",
          path,
          `Condition references unknown route ${lineage.routeKey}.`,
        );
      }
  }
}

function hasConflictingRoute(
  existing: readonly CompiledParticipantRouteV2[],
): boolean {
  return existing.length > 0;
}

function isReachable(
  edges: ReadonlyMap<string, readonly string[]>,
  source: string,
  target: string,
): boolean {
  if (source === target) return true;
  const visited = new Set<string>();
  const queue = [...(edges.get(source) ?? [])];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...(edges.get(current) ?? []));
  }
  return false;
}

function hasDirectedCycle(
  nodes: readonly string[],
  edges: ReadonlyMap<string, readonly string[]>,
): boolean {
  const state = new Map<string, "visiting" | "visited">();
  const visit = (node: string): boolean => {
    const current = state.get(node);
    if (current === "visiting") return true;
    if (current === "visited") return false;
    state.set(node, "visiting");
    for (const target of edges.get(node) ?? []) {
      if (visit(target)) return true;
    }
    state.set(node, "visited");
    return false;
  };
  return nodes.some(visit);
}

export function validateCompiledTournamentRoutingPlanV2(
  input: unknown,
): CompiledRoutingValidationResultV2 {
  const structure = validateCompiledRoutingStructureV2(input);
  if (!structure.valid) return structure;
  const plan = structure.value;
  const problems: CompiledRoutingProblemV2[] = [];
  const add: AddCompiledRoutingProblemV2 = (code, path, message): void => {
    problems.push({ code, path, message });
  };

  if (plan.compiledPlanVersion !== COMPILED_ROUTING_PLAN_VERSION_V2) {
    add(
      "INVALID_COMPILED_PLAN_VERSION",
      "compiledPlanVersion",
      `compiledPlanVersion must equal ${COMPILED_ROUTING_PLAN_VERSION_V2}.`,
    );
  }
  if (plan.blueprintModelVersion !== TOURNAMENT_ENGINE_MODEL_VERSION) {
    add(
      "INVALID_BLUEPRINT_MODEL_VERSION",
      "blueprintModelVersion",
      `blueprintModelVersion must equal ${TOURNAMENT_ENGINE_MODEL_VERSION}.`,
    );
  }

  const bucketKeys = new Set<string>();
  const bucketCapacities = new Map<string, number>();
  plan.registrationBuckets.forEach((bucket, index) => {
    const path = `registrationBuckets[${index}]`;
    if (!isNonEmptyString(bucket.bucketKey)) {
      add("INVALID_KEY", `${path}.bucketKey`, "Bucket key cannot be empty.");
    } else if (bucketKeys.has(bucket.bucketKey)) {
      add(
        "INVALID_KEY",
        `${path}.bucketKey`,
        `Duplicate registration bucket key: ${bucket.bucketKey}.`,
      );
    } else {
      bucketKeys.add(bucket.bucketKey);
      bucketCapacities.set(bucket.bucketKey, bucket.exactCapacity);
    }
    if (!isPositiveInteger(bucket.exactCapacity)) {
      add(
        "INVALID_CAPACITY",
        `${path}.exactCapacity`,
        "Bucket exactCapacity must be a positive integer.",
      );
    }
    if (!isNonNegativeInteger(bucket.priority)) {
      add(
        "INVALID_PRIORITY",
        `${path}.priority`,
        "Bucket priority must be a non-negative integer.",
      );
    }
  });

  const stageKeys = new Set<StageKeyV2>();
  const stageCapacities = new Map<StageKeyV2, number>();
  const stagesByKey = new Map<
    StageKeyV2,
    (typeof plan.stages)[number]
  >();
  plan.stages.forEach((stage, index) => {
    const path = `stages[${index}]`;
    if (!isNonEmptyString(stage.stageKey)) {
      add("INVALID_KEY", `${path}.stageKey`, "Stage key cannot be empty.");
    } else if (stageKeys.has(stage.stageKey)) {
      add(
        "DUPLICATE_STAGE_KEY",
        `${path}.stageKey`,
        `Duplicate stage key: ${stage.stageKey}.`,
      );
    } else {
      stageKeys.add(stage.stageKey);
      stageCapacities.set(stage.stageKey, stage.exactParticipantCapacity);
      stagesByKey.set(stage.stageKey, stage);
    }
    if (!isPositiveInteger(stage.displayOrder)) {
      add(
        "INVALID_ORDER",
        `${path}.displayOrder`,
        "Stage displayOrder must be a positive integer.",
      );
    }
    if (!isPositiveInteger(stage.exactParticipantCapacity)) {
      add(
        "INVALID_CAPACITY",
        `${path}.exactParticipantCapacity`,
        "Stage exactParticipantCapacity must be a positive integer.",
      );
    }
    if (stage.selectionCapabilities.type === "groups") {
      const sizes = stage.selectionCapabilities.exactGroupSizes;
      const total = sizes.reduce((sum, size) => sum + size, 0);
      const maximum = sizes.length > 0 ? Math.max(...sizes) : 0;
      if (
        stage.selectionCapabilities.exactGroupCount !== sizes.length ||
        sizes.length === 0 ||
        sizes.some((size) => !isPositiveInteger(size)) ||
        total !== stage.exactParticipantCapacity ||
        stage.selectionCapabilities.maximumQualifiersPerGroup !== maximum
      ) {
        add(
          "INVALID_GROUP_SELECTION",
          `${path}.selectionCapabilities`,
          "Compiled group capabilities must describe exact group sizes summing to stage capacity.",
        );
      }
    }
  });

  const entryKeys = new Set<string>();
  const entryCapacity = new Map<string, number>();
  const entriesByStage = new Map<StageKeyV2, number>();
  plan.entryPoints.forEach((entryPoint, index) => {
    const path = `entryPoints[${index}]`;
    const key = pairKey(entryPoint.stageKey, entryPoint.entryKey);
    if (!stageKeys.has(entryPoint.stageKey)) {
      add(
        "UNKNOWN_TARGET_STAGE",
        `${path}.stageKey`,
        `Entry point references unknown stage ${entryPoint.stageKey}.`,
      );
    }
    if (!isNonEmptyString(entryPoint.entryKey)) {
      add("INVALID_KEY", `${path}.entryKey`, "Entry point key cannot be empty.");
    } else if (entryKeys.has(key)) {
      add(
        "DUPLICATE_ENTRY_POINT_KEY",
        `${path}.entryKey`,
        `Duplicate entry point ${entryPoint.stageKey}/${entryPoint.entryKey}.`,
      );
    } else {
      entryKeys.add(key);
      entryCapacity.set(key, entryPoint.exactCapacity);
    }
    if (!isPositiveInteger(entryPoint.exactCapacity)) {
      add(
        "INVALID_CAPACITY",
        `${path}.exactCapacity`,
        "Entry point exactCapacity must be a positive integer.",
      );
    }
    if (!isNonNegativeInteger(entryPoint.priority)) {
      add(
        "INVALID_PRIORITY",
        `${path}.priority`,
        "Entry point priority must be a non-negative integer.",
      );
    }
    entriesByStage.set(
      entryPoint.stageKey,
      (entriesByStage.get(entryPoint.stageKey) ?? 0) +
        entryPoint.exactCapacity,
    );
  });

  for (const stage of plan.stages) {
    const provided = entriesByStage.get(stage.stageKey) ?? 0;
    if (provided !== stage.exactParticipantCapacity) {
      add(
        "STAGE_ENTRY_CAPACITY_MISMATCH",
        "entryPoints",
        `Entry points for ${stage.stageKey} provide ${provided} slots, but stage capacity is ${stage.exactParticipantCapacity}.`,
      );
    }
  }

  const matchKeys = new Set<LogicalMatchKeyV2>();
  const matchStage = new Map<LogicalMatchKeyV2, StageKeyV2>();
  plan.logicalMatches.forEach((match, index) => {
    const path = `logicalMatches[${index}]`;
    if (!isNonEmptyString(match.matchKey)) {
      add("INVALID_KEY", `${path}.matchKey`, "Logical match key cannot be empty.");
    } else if (matchKeys.has(match.matchKey)) {
      add(
        "DUPLICATE_LOGICAL_MATCH_KEY",
        `${path}.matchKey`,
        `Duplicate logical match key: ${match.matchKey}.`,
      );
    } else {
      matchKeys.add(match.matchKey);
      matchStage.set(match.matchKey, match.stageKey);
    }
    if (!stageKeys.has(match.stageKey)) {
      add(
        "UNKNOWN_TARGET_STAGE",
        `${path}.stageKey`,
        `Logical match references unknown stage ${match.stageKey}.`,
      );
    }
    if (!isNonNegativeInteger(match.order)) {
      add(
        "INVALID_ORDER",
        `${path}.order`,
        "Logical match order must be a non-negative integer.",
      );
    }
  });

  const outputKeys = new Set<string>();
  const outputCapacity = new Map<string, number>();
  plan.outputs.forEach((output, index) => {
    const path = `outputs[${index}]`;
    const key = pairKey(output.stageKey, output.outputKey);
    if (!stageKeys.has(output.stageKey)) {
      add(
        "UNKNOWN_TARGET_STAGE",
        `${path}.stageKey`,
        `Output references unknown stage ${output.stageKey}.`,
      );
    }
    if (!isNonEmptyString(output.outputKey)) {
      add("INVALID_KEY", `${path}.outputKey`, "Output key cannot be empty.");
    } else if (outputKeys.has(key)) {
      add(
        "DUPLICATE_OUTPUT_KEY",
        `${path}.outputKey`,
        `Duplicate output ${output.stageKey}/${output.outputKey}.`,
      );
    } else {
      outputKeys.add(key);
      outputCapacity.set(key, output.exactCapacity);
    }
    if (!isPositiveInteger(output.exactCapacity)) {
      add(
        "INVALID_CAPACITY",
        `${path}.exactCapacity`,
        "Output exactCapacity must be a positive integer.",
      );
    }
    if (!isNonNegativeInteger(output.priority)) {
      add(
        "INVALID_PRIORITY",
        `${path}.priority`,
        "Output priority must be a non-negative integer.",
      );
    }
  });

  const routeKeys = new Set<RouteKeyV2>();
  const routesByKey = new Map<RouteKeyV2, CompiledParticipantRouteV2>();
  const conditionRouteEdges = new Map<string, string[]>();
  plan.routes.forEach((route, index) => {
    const path = `routes[${index}]`;
    if (!isNonEmptyString(route.routeKey)) {
      add("INVALID_KEY", `${path}.routeKey`, "Route key cannot be empty.");
    } else if (routeKeys.has(route.routeKey)) {
      add(
        "DUPLICATE_ROUTE_KEY",
        `${path}.routeKey`,
        `Duplicate route key: ${route.routeKey}.`,
      );
    } else {
      routeKeys.add(route.routeKey);
      routesByKey.set(route.routeKey, route);
    }
  });

  const targetEntryReservations = new Map<string, number>();
  const occupiedSlots = new Map<string, CompiledParticipantRouteV2[]>();
  const matchOutcomes = new Map<string, CompiledParticipantRouteV2[]>();
  const entryPositions = new Map<string, CompiledParticipantRouteV2[]>();
  const graphNodes = new Set<string>();
  const graphEdges = new Map<string, string[]>();
  const expectedDependencies = new Map<
    RouteKeyV2,
    { source: string; target: string }
  >();

  const appendEdge = (source: string, target: string): void => {
    graphNodes.add(source);
    graphNodes.add(target);
    const targets = graphEdges.get(source) ?? [];
    targets.push(target);
    graphEdges.set(source, targets);
  };

  for (const entryPoint of plan.entryPoints) {
    const entryNode = routingNodeKeyV2(
      `stage/${encodeURIComponent(entryPoint.stageKey)}/entry/${encodeURIComponent(entryPoint.entryKey)}`,
    );
    const outputNode = routingNodeKeyV2(
      `stage/${encodeURIComponent(entryPoint.stageKey)}/output`,
    );
    appendEdge(entryNode, outputNode);
  }

  plan.routes.forEach((route, index) => {
    const path = `routes[${index}]`;
    if (!isPositiveInteger(route.reservedSlots)) {
      add(
        "INVALID_RESERVED_SLOTS",
        `${path}.reservedSlots`,
        "reservedSlots must be a positive integer.",
      );
    }
    if (!isNonNegativeInteger(route.priority)) {
      add(
        "INVALID_PRIORITY",
        `${path}.priority`,
        "Route priority must be a non-negative integer.",
      );
    }
    if (!isNonNegativeInteger(route.order)) {
      add(
        "INVALID_ORDER",
        `${path}.order`,
        "Route order must be a non-negative integer.",
      );
    }

    let sourceStage: StageKeyV2 | undefined;
    switch (route.source.type) {
      case "registration_bucket":
        if (!bucketKeys.has(route.source.bucketKey)) {
          add(
            "UNKNOWN_REGISTRATION_BUCKET",
            `${path}.source.bucketKey`,
            `Unknown registration bucket ${route.source.bucketKey}.`,
          );
        }
        if (
          route.source.selection.type === "named_output" ||
          route.source.selection.type === "top_n_per_group"
        ) {
          add(
            "INVALID_SELECTION",
            `${path}.source.selection`,
            `${route.source.selection.type} cannot select from a registration bucket.`,
          );
        }
        break;
      case "stage_result":
        sourceStage = route.source.stageKey;
        if (!stageKeys.has(route.source.stageKey)) {
          add(
            "UNKNOWN_SOURCE_STAGE",
            `${path}.source.stageKey`,
            `Unknown source stage ${route.source.stageKey}.`,
          );
        }
        if (route.source.selection.type === "named_output") {
          const key = pairKey(
            route.source.stageKey,
            route.source.selection.outputKey,
          );
          if (!outputKeys.has(key)) {
            add(
              "UNKNOWN_SOURCE_OUTPUT",
              `${path}.source.selection.outputKey`,
              `Unknown source output ${route.source.stageKey}/${route.source.selection.outputKey}.`,
            );
          } else if (
            outputCapacity.get(key) !==
            route.source.selection.exactCardinality
          ) {
            add(
              "INVALID_SELECTION",
              `${path}.source.selection.exactCardinality`,
              "named_output cardinality must equal the referenced exact output capacity.",
            );
          }
        }
        break;
      case "stage_entry": {
        sourceStage = route.source.stageKey;
        const key = pairKey(route.source.stageKey, route.source.entryKey);
        if (!entryKeys.has(key)) {
          add(
            "UNKNOWN_SOURCE_ENTRY_POINT",
            `${path}.source`,
            `Unknown source entry point ${route.source.stageKey}/${route.source.entryKey}.`,
          );
        }
        const capacity = entryCapacity.get(key);
        if (
          !isPositiveInteger(route.source.position) ||
          (capacity != null && route.source.position > capacity)
        ) {
          add(
            "INVALID_ENTRY_POSITION",
            `${path}.source.position`,
            `Entry position must be within the exact capacity of ${route.source.stageKey}/${route.source.entryKey}.`,
          );
        }
        if (route.reservedSlots !== 1) {
          add(
            "INVALID_RESERVED_SLOTS",
            `${path}.reservedSlots`,
            "A stage entry position routes exactly one participant.",
          );
        }
        const positionKey = `${key}\u0000${route.source.position}`;
        const existing = entryPositions.get(positionKey) ?? [];
        if (hasConflictingRoute(existing)) {
          add(
            "STAGE_ENTRY_POSITION_FAN_OUT",
            `${path}.source`,
            "Stage entry position is already routed.",
          );
        }
        existing.push(route);
        entryPositions.set(positionKey, existing);
        break;
      }
      case "match_outcome": {
        sourceStage = route.source.stageKey;
        if (
          !matchKeys.has(route.source.matchKey) ||
          matchStage.get(route.source.matchKey) !== route.source.stageKey
        ) {
          add(
            "UNKNOWN_SOURCE_MATCH",
            `${path}.source.matchKey`,
            `Unknown source match ${route.source.matchKey} in stage ${route.source.stageKey}.`,
          );
        }
        if (route.reservedSlots !== 1) {
          add(
            "INVALID_RESERVED_SLOTS",
            `${path}.reservedSlots`,
            "A match outcome routes exactly one participant.",
          );
        }
        const outcomeKey = `${route.source.matchKey}\u0000${route.source.outcome}`;
        const existing = matchOutcomes.get(outcomeKey) ?? [];
        if (hasConflictingRoute(existing)) {
          add(
            "MATCH_OUTCOME_FAN_OUT",
            `${path}.source`,
            "Match outcome is already routed.",
          );
        }
        existing.push(route);
        matchOutcomes.set(outcomeKey, existing);
        break;
      }
    }

    const selection =
      route.source.type === "registration_bucket" ||
      route.source.type === "stage_result"
        ? route.source.selection
        : undefined;
    const sourceCapacity =
      route.source.type === "registration_bucket"
        ? bucketCapacities.get(route.source.bucketKey)
        : route.source.type === "stage_result"
          ? stageCapacities.get(route.source.stageKey)
          : undefined;
    if (selection != null && sourceCapacity != null) {
      switch (selection.type) {
        case "all":
          if (selection.exactCardinality !== sourceCapacity) {
            add(
              route.source.type === "registration_bucket"
                ? "REGISTRATION_BUCKET_CAPACITY_MISMATCH"
                : "SELECTION_CARDINALITY_MISMATCH",
              `${path}.source.selection.exactCardinality`,
              `all selection must equal authoritative source capacity ${sourceCapacity}.`,
            );
          }
          break;
        case "top_n":
        case "best_not_selected":
          if (selection.count > sourceCapacity) {
            add(
              "SELECTION_EXCEEDS_SOURCE_CAPACITY",
              `${path}.source.selection.count`,
              `Selection count ${selection.count} exceeds source capacity ${sourceCapacity}.`,
            );
          }
          break;
        case "rank_range":
          if (
            selection.from < 1 ||
            selection.to < selection.from ||
            selection.to > sourceCapacity
          ) {
            add(
              "SELECTION_EXCEEDS_SOURCE_CAPACITY",
              `${path}.source.selection`,
              `Rank range ${selection.from}-${selection.to} is outside source capacity ${sourceCapacity}.`,
            );
          }
          break;
        case "top_n_per_group": {
          const stage =
            route.source.type === "stage_result"
              ? stagesByKey.get(route.source.stageKey)
              : undefined;
          if (stage?.selectionCapabilities.type !== "groups") {
            add(
              "GROUP_SELECTION_CAPABILITY_REQUIRED",
              `${path}.source.selection`,
              "top_n_per_group requires compiled group selection capabilities.",
            );
            break;
          }
          const capability = stage.selectionCapabilities;
          const exactCardinality = capability.exactGroupSizes.reduce(
            (sum, groupSize) =>
              sum + Math.min(selection.countPerGroup, groupSize),
            0,
          );
          if (
            selection.countPerGroup >
              capability.maximumQualifiersPerGroup ||
            selection.groupCount !== capability.exactGroupCount ||
            selection.exactGroupSizes.length !==
              capability.exactGroupSizes.length ||
            selection.exactGroupSizes.some(
              (size, index) => size !== capability.exactGroupSizes[index],
            ) ||
            selection.exactCardinality !== exactCardinality ||
            selection.exactCardinality > sourceCapacity
          ) {
            add(
              "INVALID_GROUP_SELECTION",
              `${path}.source.selection`,
              "top_n_per_group does not match the source stage group capabilities.",
            );
          }
          break;
        }
        case "named_output":
          break;
      }
    }
    if (
      selection != null &&
      selection.exactCardinality !== route.reservedSlots
    ) {
      add(
        "SELECTION_CARDINALITY_MISMATCH",
        `${path}.source.selection.exactCardinality`,
        `Selection yields ${selection.exactCardinality} participants, but route reserves ${route.reservedSlots}.`,
      );
    }

    let targetStage: StageKeyV2 | undefined;
    switch (route.target.type) {
      case "stage_entry": {
        targetStage = route.target.stageKey;
        const key = pairKey(route.target.stageKey, route.target.entryKey);
        if (!stageKeys.has(route.target.stageKey)) {
          add(
            "UNKNOWN_TARGET_STAGE",
            `${path}.target.stageKey`,
            `Unknown target stage ${route.target.stageKey}.`,
          );
        }
        if (!entryKeys.has(key)) {
          add(
            "UNKNOWN_TARGET_ENTRY_POINT",
            `${path}.target.entryKey`,
            `Unknown target entry point ${route.target.stageKey}/${route.target.entryKey}.`,
          );
        }
        if (route.condition.type !== "always") {
          add(
            "CONDITIONAL_EXACT_ENTRY_ROUTE",
            `${path}.condition`,
            `Conditional routes cannot deliver directly to exact entry ${route.target.stageKey}/${route.target.entryKey}.`,
          );
        } else {
          targetEntryReservations.set(
            key,
            (targetEntryReservations.get(key) ?? 0) + route.reservedSlots,
          );
        }
        break;
      }
      case "match_slot": {
        targetStage = route.target.stageKey;
        if (
          !matchKeys.has(route.target.matchKey) ||
          matchStage.get(route.target.matchKey) !== route.target.stageKey
        ) {
          add(
            "UNKNOWN_TARGET_MATCH",
            `${path}.target.matchKey`,
            `Unknown target match ${route.target.matchKey} in stage ${route.target.stageKey}.`,
          );
        }
        if (route.reservedSlots !== 1) {
          add(
            "INVALID_RESERVED_SLOTS",
            `${path}.reservedSlots`,
            "A match slot accepts exactly one participant.",
          );
        }
        const slotKey = `${route.target.matchKey}\u0000${route.target.slot}`;
        const existing = occupiedSlots.get(slotKey) ?? [];
        if (hasConflictingRoute(existing)) {
          add(
            "TARGET_SLOT_CONFLICT",
            `${path}.target`,
            "Target match slot is already reserved.",
          );
        }
        existing.push(route);
        occupiedSlots.set(slotKey, existing);
        break;
      }
      case "stage_output":
        targetStage = route.target.stageKey;
        if (
          !outputKeys.has(
            pairKey(route.target.stageKey, route.target.outputKey),
          )
        ) {
          add(
            "UNKNOWN_TARGET_OUTPUT",
            `${path}.target.outputKey`,
            `Unknown target output ${route.target.stageKey}/${route.target.outputKey}.`,
          );
        }
        break;
    }

    if (
      sourceStage != null &&
      targetStage != null &&
      route.target.type === "match_slot" &&
      sourceStage !== targetStage
    ) {
      add(
        "CROSS_STAGE_MATCH_ROUTE",
        path,
        "Routes targeting a match slot must stay within one stage.",
      );
    }
    if (
      targetStage != null &&
      route.target.type === "stage_output" &&
      (route.source.type !== "match_outcome" || sourceStage !== targetStage)
    ) {
      add(
        "INVALID_STAGE_OUTPUT_ROUTE",
        path,
        "Stage outputs must be produced by a match outcome in the same stage.",
      );
    }

    switch (route.condition.type) {
      case "always":
        break;
      case "participant_lineage":
        validateLineageReferences(
          route.condition.lineage,
          `${path}.condition.lineage`,
          routeKeys,
          entryKeys,
          add,
        );
        break;
      case "match_winner_lineage":
        if (!matchKeys.has(route.condition.matchKey)) {
          add(
            "UNKNOWN_CONDITION_MATCH",
            `${path}.condition.matchKey`,
            `Condition references unknown match ${route.condition.matchKey}.`,
          );
        }
        validateLineageReferences(
          route.condition.lineage,
          `${path}.condition.lineage`,
          routeKeys,
          entryKeys,
          add,
        );
        break;
    }

    const sourceNode = routeSourceNodeKeyV2(route.source);
    const targetNode = routeTargetNodeKeyV2(route.target);
    expectedDependencies.set(route.routeKey, {
      source: sourceNode,
      target: targetNode,
    });
    appendEdge(sourceNode, targetNode);
  });

  plan.routes.forEach((route, index) => {
    if (route.condition.type === "always") return;
    const path = `routes[${index}].condition`;
    const sourceNode = routeSourceNodeKeyV2(route.source);
    const currentStage =
      route.source.type === "registration_bucket"
        ? undefined
        : route.source.stageKey;
    if (currentStage == null) {
      add(
        "INVALID_LINEAGE_REFERENCE",
        path,
        "Conditional routing requires a stage-local participant source.",
      );
      return;
    }

    if (route.condition.type === "match_winner_lineage") {
      const conditionMatchStage = matchStage.get(route.condition.matchKey);
      if (
        conditionMatchStage != null &&
        conditionMatchStage !== currentStage
      ) {
        add(
          "CONDITION_CROSS_STAGE_REFERENCE",
          `${path}.matchKey`,
          "Condition match must belong to the protected route stage.",
        );
      } else if (
        route.source.type !== "match_outcome" ||
        route.condition.matchKey !== route.source.matchKey
      ) {
        const conditionNode = routingNodeKeyV2(
          `match/${encodeURIComponent(route.condition.matchKey)}`,
        );
        add(
          isReachable(graphEdges, sourceNode, conditionNode)
            ? "CONDITION_DEPENDENCY_CYCLE"
            : "CONDITION_NOT_PREDECESSOR",
          `${path}.matchKey`,
          "match_winner_lineage must inspect the same match as the protected match_outcome source.",
        );
      }
    }

    const lineage = route.condition.lineage;
    let predecessorNode: string | undefined;
    if (lineage.type === "stage_entry") {
      if (lineage.stageKey !== currentStage) {
        add(
          "CONDITION_CROSS_STAGE_REFERENCE",
          `${path}.lineage`,
          "Condition entry point must belong to the protected route stage.",
        );
        return;
      }
      if (!entryKeys.has(pairKey(lineage.stageKey, lineage.entryKey))) {
        return;
      }
      predecessorNode = routingNodeKeyV2(
        `stage/${encodeURIComponent(lineage.stageKey)}/entry/${encodeURIComponent(lineage.entryKey)}`,
      );
    } else {
      if (lineage.routeKey === route.routeKey) {
        add(
          "CONDITION_SELF_REFERENCE",
          `${path}.lineage.routeKey`,
          "A route condition cannot reference its own route.",
        );
        return;
      }
      const predecessor = routesByKey.get(lineage.routeKey);
      if (predecessor == null) return;
      const predecessorSourceStage =
        predecessor.source.type === "registration_bucket"
          ? undefined
          : predecessor.source.stageKey;
      if (
        predecessor.target.stageKey !== currentStage ||
        (predecessorSourceStage != null &&
          predecessorSourceStage !== currentStage)
      ) {
        add(
          "CONDITION_CROSS_STAGE_REFERENCE",
          `${path}.lineage.routeKey`,
          "Condition route must be local to the protected route stage.",
        );
        return;
      }
      predecessorNode = routeTargetNodeKeyV2(predecessor.target);
      const dependents = conditionRouteEdges.get(lineage.routeKey) ?? [];
      dependents.push(route.routeKey);
      conditionRouteEdges.set(lineage.routeKey, dependents);
    }

    if (isReachable(graphEdges, predecessorNode, sourceNode)) return;
    if (isReachable(graphEdges, sourceNode, predecessorNode)) {
      add(
        "CONDITION_DEPENDENCY_CYCLE",
        path,
        "Condition depends on a downstream element of the protected route.",
      );
    } else {
      add(
        "CONDITION_NOT_PREDECESSOR",
        path,
        "Condition lineage is not a reachable predecessor of the protected route.",
      );
    }
  });
  if (
    hasDirectedCycle(
      plan.routes.map((route) => route.routeKey),
      conditionRouteEdges,
    )
  ) {
    add(
      "CONDITION_DEPENDENCY_CYCLE",
      "routes",
      "Route conditions form a cyclic dependency.",
    );
  }

  for (const entryPoint of plan.entryPoints) {
    const key = pairKey(entryPoint.stageKey, entryPoint.entryKey);
    const reserved = targetEntryReservations.get(key) ?? 0;
    if (reserved !== entryPoint.exactCapacity) {
      add(
        "ENTRY_POINT_CAPACITY_MISMATCH",
        "routes",
        `Routes reserve ${reserved} slots for ${entryPoint.stageKey}/${entryPoint.entryKey}, but exact capacity is ${entryPoint.exactCapacity}.`,
      );
    }
  }

  validateCompiledOutputCapacitiesV2(plan.outputs, plan.routes, add);

  const dependencyKeys = new Set<string>();
  plan.dependencies.forEach((dependency, index) => {
    const path = `dependencies[${index}]`;
    const key = `${dependency.routeKey}\u0000${dependency.sourceNodeKey}\u0000${dependency.targetNodeKey}`;
    if (dependencyKeys.has(key)) {
      add(
        "DUPLICATE_DEPENDENCY",
        path,
        `Duplicate dependency for route ${dependency.routeKey}.`,
      );
    } else {
      dependencyKeys.add(key);
    }
    const expected = expectedDependencies.get(dependency.routeKey);
    if (
      expected == null ||
      expected.source !== dependency.sourceNodeKey ||
      expected.target !== dependency.targetNodeKey
    ) {
      add(
        "INVALID_DEPENDENCY",
        path,
        `Dependency does not match route ${dependency.routeKey}.`,
      );
    }
  });

  for (const [routeKey, expected] of expectedDependencies) {
    const key = `${routeKey}\u0000${expected.source}\u0000${expected.target}`;
    if (!dependencyKeys.has(key)) {
      add(
        "INVALID_DEPENDENCY",
        "dependencies",
        `Missing dependency for route ${routeKey}.`,
      );
    }
  }

  validateCompiledRoutingGraphV2(graphNodes, graphEdges, add);

  if (problems.length > 0) return { valid: false, problems };
  return { valid: true, value: structuredClone(plan) };
}
