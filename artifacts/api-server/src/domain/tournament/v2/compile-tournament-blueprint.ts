import { canonicalStringifyV2, CanonicalSerializationError } from "./canonical-json";
import {
  COMPILED_ROUTING_PLAN_VERSION_V2,
  blueprintRouteKeyV2,
  entryPointKeyV2,
  formatRouteKeyV2,
  logicalMatchKeyV2,
  registrationBucketKeyV2,
  routeSourceNodeKeyV2,
  routeTargetNodeKeyV2,
  stageKeyV2,
  stageOutputKeyV2,
  type CompiledLogicalMatchV2,
  type CompiledParticipantSelectionV2,
  type CompiledParticipantRouteV2,
  type CompiledRegistrationBucketV2,
  type CompiledRoutingDependencyV2,
  type CompiledStageEntryPointV2,
  type CompiledStageOutputV2,
  type CompiledStageV2,
  type CompiledTournamentRoutingPlanV2,
  type StageKeyV2,
} from "./compiled-routing-model";
import type {
  StageFormatCompilationContextV2,
  StageFormatCompilationV2,
  StageFormatEngineV2,
} from "./stage-format-engine";
import {
  TOURNAMENT_ENGINE_MODEL_VERSION,
  type ParticipantSelectionRuleV2,
  type TournamentBlueprintV2,
  type TournamentStageDefinitionV2,
} from "./stage-model";
import {
  validateCompiledTournamentRoutingPlanV2,
  type CompiledRoutingProblemV2,
} from "./validate-compiled-routing-plan";
import {
  validateTournamentBlueprintV2,
  type TournamentBlueprintProblemV2,
} from "./validate-tournament-blueprint";
import type {
  TournamentStagePlanProblem,
} from "../tournament-stage-plan";
import {
  adaptV1StagePlanToV2,
} from "./v1-stage-plan-adapter";

export type TournamentRoutingCompilationProblemCodeV2 =
  | "BLUEPRINT_INVALID"
  | "UNSUPPORTED_CAPACITY"
  | "DUPLICATE_FORMAT_ENGINE"
  | "NON_SERIALIZABLE_CONFIGURATION"
  | "FORMAT_ENGINE_FAILURE"
  | "NONDETERMINISTIC_FORMAT_ENGINE"
  | "UNRESOLVED_SELECTION_POLICY"
  | "SELECTION_EXCEEDS_SOURCE_CAPACITY"
  | "REGISTRATION_BUCKET_CAPACITY_MISMATCH"
  | "UNKNOWN_REGISTRATION_BUCKET"
  | "GROUP_SELECTION_CAPABILITY_REQUIRED"
  | "INVALID_GROUP_SELECTION"
  | "SELECTION_CARDINALITY_MISMATCH"
  | "FORMAT_ENGINE_STAGE_MISMATCH"
  | "FORMAT_ENGINE_CROSS_STAGE_ROUTE"
  | "FORMAT_ENGINE_CROSS_STAGE_CONDITION"
  | "FORMAT_ENGINE_UNKNOWN_LOCAL_REFERENCE"
  | "FORMAT_ENGINE_CONDITION_DEPENDENCY"
  | "COMPILED_PLAN_INVALID";

export interface TournamentRoutingCompilationProblemV2 {
  code: TournamentRoutingCompilationProblemCodeV2;
  path: string;
  message: string;
  causeCode?: string;
}

export type CompileTournamentRoutingResultV2 =
  | { valid: true; value: CompiledTournamentRoutingPlanV2 }
  | { valid: false; problems: TournamentRoutingCompilationProblemV2[] };

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function engineKey(engine: StageFormatEngineV2): string {
  return `${engine.formatId}@${engine.rulesVersion}`;
}

function stageEngineKey(stage: TournamentStageDefinitionV2): string {
  return `${stage.format.id}@${stage.format.rulesVersion}`;
}

function stageEntryPoints(
  stage: TournamentStageDefinitionV2,
  compiledStageKey: StageKeyV2,
): CompiledStageEntryPointV2[] {
  if (stage.capacity.type !== "exact") return [];
  if (stage.entryPoints == null || stage.entryPoints.length === 0) {
    return [
      {
        stageKey: compiledStageKey,
        entryKey: entryPointKeyV2("default"),
        name: "Default",
        exactCapacity: stage.capacity.count,
        priority: 0,
        completeness: { type: "exact" },
      },
    ];
  }
  return stage.entryPoints.map((entryPoint) => ({
    stageKey: compiledStageKey,
    entryKey: entryPointKeyV2(entryPoint.key),
    ...(entryPoint.name == null ? {} : { name: entryPoint.name }),
    exactCapacity: entryPoint.capacity.count,
    priority: entryPoint.priority,
    completeness: { type: "exact" as const },
  }));
}

function formatContext(
  stage: TournamentStageDefinitionV2,
  compiledStageKey: StageKeyV2,
): StageFormatCompilationContextV2 {
  return {
    stage: structuredClone(stage),
    stageKey: compiledStageKey,
    keys: {
      entryPoint: entryPointKeyV2,
      logicalMatch: (localKey) =>
        logicalMatchKeyV2(compiledStageKey, localKey),
      output: stageOutputKeyV2,
      route: (localKey) => formatRouteKeyV2(compiledStageKey, localKey),
    },
  };
}

function canonicalizeFormatCompilation(
  compilation: StageFormatCompilationV2,
): StageFormatCompilationV2 {
  return {
    logicalMatches: [...compilation.logicalMatches]
      .map((match) => structuredClone(match))
      .sort(
        (left, right) =>
          left.order - right.order ||
          compareText(left.matchKey, right.matchKey),
      ),
    outputs: [...compilation.outputs]
      .map((output) => structuredClone(output))
      .sort(
        (left, right) =>
          left.priority - right.priority ||
          compareText(left.outputKey, right.outputKey),
      ),
    routes: [...compilation.routes]
      .map((route) => structuredClone(route))
      .sort(
        (left, right) =>
          left.priority - right.priority ||
          left.order - right.order ||
          compareText(left.routeKey, right.routeKey),
      ),
  };
}

function assertFormatCompilationShape(
  value: unknown,
): asserts value is StageFormatCompilationV2 {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Format engine result must be a plain object.");
  }
  const candidate = value as Readonly<Record<string, unknown>>;
  if (
    !Array.isArray(candidate.logicalMatches) ||
    !Array.isArray(candidate.outputs) ||
    !Array.isArray(candidate.routes)
  ) {
    throw new Error(
      "Format engine result must contain logicalMatches, outputs and routes arrays.",
    );
  }
  canonicalStringifyV2(value);
}

function validateFormatCompilationBoundary(
  compilation: StageFormatCompilationV2,
  stage: TournamentStageDefinitionV2,
  compiledStageKey: StageKeyV2,
): TournamentRoutingCompilationProblemV2 | undefined {
  const mismatch = compilation.logicalMatches.find(
    (match) => match.stageKey !== compiledStageKey,
  );
  if (mismatch != null) {
    return {
      code: "FORMAT_ENGINE_STAGE_MISMATCH",
      path: `stages.${stage.key}.format.logicalMatches`,
      message: `Format engine for ${stage.key} emitted match ${mismatch.matchKey} for stage ${mismatch.stageKey}.`,
    };
  }
  const outputMismatch = compilation.outputs.find(
    (output) => output.stageKey !== compiledStageKey,
  );
  if (outputMismatch != null) {
    return {
      code: "FORMAT_ENGINE_STAGE_MISMATCH",
      path: `stages.${stage.key}.format.outputs`,
      message: `Format engine for ${stage.key} emitted output ${outputMismatch.outputKey} for stage ${outputMismatch.stageKey}.`,
    };
  }

  for (const route of compilation.routes) {
    if (
      route.source.type === "registration_bucket" ||
      route.source.type === "stage_result" ||
      route.target.type === "stage_entry"
    ) {
      return {
        code: "FORMAT_ENGINE_CROSS_STAGE_ROUTE",
        path: `stages.${stage.key}.format.routes`,
        message:
          "Format engines may emit only internal stage-entry, match-outcome, match-slot and stage-output routing.",
      };
    }
    if (
      route.source.stageKey !== compiledStageKey ||
      route.target.stageKey !== compiledStageKey
    ) {
      return {
        code: "FORMAT_ENGINE_CROSS_STAGE_ROUTE",
        path: `stages.${stage.key}.format.routes`,
        message: `Format engine for ${stage.key} emitted cross-stage route ${route.routeKey}.`,
      };
    }
  }

  const localMatches = new Set(
    compilation.logicalMatches.map((match) => match.matchKey),
  );
  const localRoutes = new Map(
    compilation.routes.map((route) => [route.routeKey, route] as const),
  );
  const localEntries = new Set(
    (stage.entryPoints == null || stage.entryPoints.length === 0
      ? ["default"]
      : stage.entryPoints.map((entry) => entry.key)
    ).map(entryPointKeyV2),
  );
  const edges = new Map<string, string[]>();
  const appendEdge = (source: string, target: string): void => {
    const targets = edges.get(source) ?? [];
    targets.push(target);
    edges.set(source, targets);
  };
  for (const route of compilation.routes) {
    appendEdge(
      routeSourceNodeKeyV2(route.source),
      routeTargetNodeKeyV2(route.target),
    );
  }
  const isReachable = (source: string, target: string): boolean => {
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
  };
  const localRoutePrefix = `${encodeURIComponent(compiledStageKey)}/route/`;
  const localMatchPrefix = `${encodeURIComponent(compiledStageKey)}/match/`;

  for (const route of compilation.routes) {
    if (route.condition.type === "always") continue;
    const path = `stages.${stage.key}.format.routes.${route.routeKey}.condition`;
    if (route.condition.type === "match_winner_lineage") {
      if (!localMatches.has(route.condition.matchKey)) {
        return {
          code: route.condition.matchKey.startsWith(localMatchPrefix)
            ? "FORMAT_ENGINE_UNKNOWN_LOCAL_REFERENCE"
            : "FORMAT_ENGINE_CROSS_STAGE_CONDITION",
          path: `${path}.matchKey`,
          message: `Format condition references non-local match ${route.condition.matchKey}.`,
        };
      }
      if (
        route.source.type !== "match_outcome" ||
        route.condition.matchKey !== route.source.matchKey
      ) {
        return {
          code: "FORMAT_ENGINE_CONDITION_DEPENDENCY",
          path: `${path}.matchKey`,
          message:
            "match_winner_lineage must inspect the same match as the protected match_outcome route source.",
        };
      }
    }

    const lineage = route.condition.lineage;
    let predecessorNode: string;
    if (lineage.type === "stage_entry") {
      if (lineage.stageKey !== compiledStageKey) {
        return {
          code: "FORMAT_ENGINE_CROSS_STAGE_CONDITION",
          path: `${path}.lineage`,
          message: `Format condition references entry point in stage ${lineage.stageKey}.`,
        };
      }
      if (!localEntries.has(lineage.entryKey)) {
        return {
          code: "FORMAT_ENGINE_UNKNOWN_LOCAL_REFERENCE",
          path: `${path}.lineage.entryKey`,
          message: `Format condition references unknown local entry point ${lineage.entryKey}.`,
        };
      }
      predecessorNode = routeTargetNodeKeyV2({
        type: "stage_entry",
        stageKey: lineage.stageKey,
        entryKey: lineage.entryKey,
      });
    } else {
      if (lineage.routeKey === route.routeKey) {
        return {
          code: "FORMAT_ENGINE_CONDITION_DEPENDENCY",
          path: `${path}.lineage.routeKey`,
          message: "A route condition cannot reference its own route.",
        };
      }
      const predecessor = localRoutes.get(lineage.routeKey);
      if (predecessor == null) {
        return {
          code: lineage.routeKey.startsWith(localRoutePrefix)
            ? "FORMAT_ENGINE_UNKNOWN_LOCAL_REFERENCE"
            : "FORMAT_ENGINE_CROSS_STAGE_CONDITION",
          path: `${path}.lineage.routeKey`,
          message: `Format condition references non-local route ${lineage.routeKey}.`,
        };
      }
      predecessorNode = routeTargetNodeKeyV2(predecessor.target);
    }
    const sourceNode = routeSourceNodeKeyV2(route.source);
    if (!isReachable(predecessorNode, sourceNode)) {
      return {
        code: "FORMAT_ENGINE_CONDITION_DEPENDENCY",
        path,
        message:
          "Condition lineage must be an available predecessor of the protected route source.",
      };
    }
  }
  return undefined;
}

function compileFormatTwice(
  engine: StageFormatEngineV2,
  stage: TournamentStageDefinitionV2,
  compiledStageKey: StageKeyV2,
):
  | { valid: true; value: StageFormatCompilationV2 }
  | { valid: false; problem: TournamentRoutingCompilationProblemV2 } {
  try {
    const firstRaw: unknown = engine.compile(
      formatContext(stage, compiledStageKey),
    );
    assertFormatCompilationShape(firstRaw);
    const first = canonicalizeFormatCompilation(
      firstRaw,
    );
    const secondRaw: unknown = engine.compile(
      formatContext(stage, compiledStageKey),
    );
    assertFormatCompilationShape(secondRaw);
    const second = canonicalizeFormatCompilation(
      secondRaw,
    );
    const firstSerialized = canonicalStringifyV2(first);
    const secondSerialized = canonicalStringifyV2(second);
    if (firstSerialized !== secondSerialized) {
      return {
        valid: false,
        problem: {
          code: "NONDETERMINISTIC_FORMAT_ENGINE",
          path: `stages.${stage.key}.format`,
          message: `Format engine ${engineKey(engine)} produced different results for identical input.`,
        },
      };
    }
    const boundaryProblem = validateFormatCompilationBoundary(
      first,
      stage,
      compiledStageKey,
    );
    if (boundaryProblem != null) {
      return { valid: false, problem: boundaryProblem };
    }
    return { valid: true, value: structuredClone(first) };
  } catch (error) {
    if (error instanceof CanonicalSerializationError) {
      return {
        valid: false,
        problem: {
          code: "NON_SERIALIZABLE_CONFIGURATION",
          path: `stages.${stage.key}.format`,
          message: error.message,
        },
      };
    }
    return {
      valid: false,
      problem: {
        code: "FORMAT_ENGINE_FAILURE",
        path: `stages.${stage.key}.format`,
        message:
          error instanceof Error
            ? `Format engine ${engineKey(engine)} failed: ${error.message}`
            : `Format engine ${engineKey(engine)} failed with a non-Error value.`,
      },
    };
  }
}

function sourceStageOrder(
  route: CompiledParticipantRouteV2,
  orders: ReadonlyMap<StageKeyV2, number>,
): number {
  switch (route.source.type) {
    case "registration_bucket":
      return -1;
    case "stage_result":
    case "stage_entry":
    case "match_outcome":
      return orders.get(route.source.stageKey) ?? Number.MAX_SAFE_INTEGER;
  }
}

function targetStageOrder(
  route: CompiledParticipantRouteV2,
  orders: ReadonlyMap<StageKeyV2, number>,
): number {
  return orders.get(route.target.stageKey) ?? Number.MAX_SAFE_INTEGER;
}

function canonicalizePlan(
  plan: CompiledTournamentRoutingPlanV2,
): CompiledTournamentRoutingPlanV2 {
  const orders = new Map(
    plan.stages.map((stage) => [stage.stageKey, stage.displayOrder] as const),
  );
  const registrationBuckets = [...plan.registrationBuckets].sort(
    (left, right) =>
      left.priority - right.priority ||
      compareText(left.bucketKey, right.bucketKey),
  );
  const stages = [...plan.stages].sort(
    (left, right) =>
      left.displayOrder - right.displayOrder ||
      compareText(left.stageKey, right.stageKey),
  );
  const entryPoints = [...plan.entryPoints].sort(
    (left, right) =>
      (orders.get(left.stageKey) ?? Number.MAX_SAFE_INTEGER) -
        (orders.get(right.stageKey) ?? Number.MAX_SAFE_INTEGER) ||
      left.priority - right.priority ||
      compareText(left.entryKey, right.entryKey),
  );
  const logicalMatches = [...plan.logicalMatches].sort(
    (left, right) =>
      (orders.get(left.stageKey) ?? Number.MAX_SAFE_INTEGER) -
        (orders.get(right.stageKey) ?? Number.MAX_SAFE_INTEGER) ||
      left.order - right.order ||
      compareText(left.matchKey, right.matchKey),
  );
  const outputs = [...plan.outputs].sort(
    (left, right) =>
      (orders.get(left.stageKey) ?? Number.MAX_SAFE_INTEGER) -
        (orders.get(right.stageKey) ?? Number.MAX_SAFE_INTEGER) ||
      left.priority - right.priority ||
      compareText(left.outputKey, right.outputKey),
  );
  const routes = [...plan.routes].sort(
    (left, right) =>
      sourceStageOrder(left, orders) - sourceStageOrder(right, orders) ||
      targetStageOrder(left, orders) - targetStageOrder(right, orders) ||
      left.priority - right.priority ||
      left.order - right.order ||
      compareText(left.routeKey, right.routeKey),
  );
  const dependencies = routes.map<CompiledRoutingDependencyV2>((route) => ({
    routeKey: route.routeKey,
    sourceNodeKey: routeSourceNodeKeyV2(route.source),
    targetNodeKey: routeTargetNodeKeyV2(route.target),
  }));

  return {
    compiledPlanVersion: plan.compiledPlanVersion,
    blueprintModelVersion: plan.blueprintModelVersion,
    registrationBuckets,
    stages,
    entryPoints,
    logicalMatches,
    outputs,
    routes,
    dependencies,
  };
}

function blueprintProblem(
  problem: TournamentBlueprintProblemV2,
): TournamentRoutingCompilationProblemV2 {
  return {
    code: "BLUEPRINT_INVALID",
    path: problem.path,
    message: problem.message,
    causeCode: problem.code,
  };
}

function compiledProblem(
  problem: CompiledRoutingProblemV2,
): TournamentRoutingCompilationProblemV2 {
  return {
    code: "COMPILED_PLAN_INVALID",
    path: problem.path,
    message: problem.message,
    causeCode: problem.code,
  };
}

type CompileSelectionResult =
  | { valid: true; value: CompiledParticipantSelectionV2 }
  | { valid: false; problem: TournamentRoutingCompilationProblemV2 };

function selectionCompilationProblem(
  code:
    | "UNRESOLVED_SELECTION_POLICY"
    | "SELECTION_EXCEEDS_SOURCE_CAPACITY"
    | "REGISTRATION_BUCKET_CAPACITY_MISMATCH"
    | "UNKNOWN_REGISTRATION_BUCKET"
    | "GROUP_SELECTION_CAPABILITY_REQUIRED"
    | "INVALID_GROUP_SELECTION"
    | "SELECTION_CARDINALITY_MISMATCH",
  path: string,
  message: string,
): CompileSelectionResult {
  return { valid: false, problem: { code, path, message } };
}

type SelectionSourceV2 =
  | {
      type: "registration_bucket";
      bucket: CompiledRegistrationBucketV2;
    }
  | {
      type: "stage_result";
      stage: CompiledStageV2;
    };

function compileSelection(
  selection: ParticipantSelectionRuleV2,
  reservedSlots: number,
  path: string,
  source: SelectionSourceV2,
  outputCapacities: ReadonlyMap<string, number>,
): CompileSelectionResult {
  const sourceCapacity =
    source.type === "registration_bucket"
      ? source.bucket.exactCapacity
      : source.stage.exactParticipantCapacity;
  let compiled: CompiledParticipantSelectionV2;
  switch (selection.type) {
    case "all": {
      compiled = { type: "all", exactCardinality: sourceCapacity };
      break;
    }
    case "top_n":
      if (selection.count > sourceCapacity) {
        return selectionCompilationProblem(
          "SELECTION_EXCEEDS_SOURCE_CAPACITY",
          path,
          `top_n selects ${selection.count} participants from a source with exact capacity ${sourceCapacity}.`,
        );
      }
      compiled = {
        type: "top_n",
        count: selection.count,
        exactCardinality: selection.count,
      };
      break;
    case "rank_range":
      if (
        selection.from < 1 ||
        selection.to < selection.from ||
        selection.to > sourceCapacity
      ) {
        return selectionCompilationProblem(
          "SELECTION_EXCEEDS_SOURCE_CAPACITY",
          path,
          `rank_range ${selection.from}-${selection.to} is outside source capacity ${sourceCapacity}.`,
        );
      }
      compiled = {
        type: "rank_range",
        from: selection.from,
        to: selection.to,
        exactCardinality: selection.to - selection.from + 1,
      };
      break;
    case "top_n_per_group": {
      if (
        source.type !== "stage_result" ||
        source.stage.selectionCapabilities.type !== "groups"
      ) {
        return selectionCompilationProblem(
          "GROUP_SELECTION_CAPABILITY_REQUIRED",
          path,
          "top_n_per_group requires validated group selection capabilities on the source stage.",
        );
      }
      const capability = source.stage.selectionCapabilities;
      if (
        selection.count <= 0 ||
        selection.count > capability.maximumQualifiersPerGroup
      ) {
        return selectionCompilationProblem(
          "INVALID_GROUP_SELECTION",
          path,
          `top_n_per_group count ${selection.count} exceeds the maximum ${capability.maximumQualifiersPerGroup}.`,
        );
      }
      const exactCardinality = capability.exactGroupSizes.reduce(
        (sum, groupSize) => sum + Math.min(selection.count, groupSize),
        0,
      );
      compiled = {
        type: "top_n_per_group",
        countPerGroup: selection.count,
        groupCount: capability.exactGroupCount,
        exactGroupSizes: [...capability.exactGroupSizes],
        exactCardinality,
      };
      break;
    }
    case "named_output": {
      if (source.type !== "stage_result") {
        return selectionCompilationProblem(
          "UNRESOLVED_SELECTION_POLICY",
          path,
          "named_output can only select from a stage result.",
        );
      }
      const outputKey = stageOutputKeyV2(selection.outputKey);
      const capacity = outputCapacities.get(
        `${source.stage.stageKey}\u0000${outputKey}`,
      );
      if (capacity == null) {
        return selectionCompilationProblem(
          "UNRESOLVED_SELECTION_POLICY",
          path,
          `named_output references unknown exact output ${source.stage.stageKey}/${selection.outputKey}.`,
        );
      }
      compiled = {
        type: "named_output",
        outputKey,
        exactCardinality: capacity,
      };
      break;
    }
    case "best_not_selected":
      if (selection.count > sourceCapacity) {
        return selectionCompilationProblem(
          "SELECTION_EXCEEDS_SOURCE_CAPACITY",
          path,
          `best_not_selected selects ${selection.count} participants from a source with exact capacity ${sourceCapacity}.`,
        );
      }
      compiled = {
        type: "best_not_selected",
        count: selection.count,
        exactCardinality: selection.count,
      };
      break;
    case "round_outcome":
    case "policy_ref":
      return selectionCompilationProblem(
        "UNRESOLVED_SELECTION_POLICY",
        path,
        `Selection ${selection.type} cannot be resolved to an exact cardinality by compiled plan version 1.`,
      );
  }

  if (compiled.exactCardinality !== reservedSlots) {
    return selectionCompilationProblem(
      source.type === "registration_bucket" && selection.type === "all"
        ? "REGISTRATION_BUCKET_CAPACITY_MISMATCH"
        : "SELECTION_CARDINALITY_MISMATCH",
      path,
      `Selection yields exactly ${compiled.exactCardinality} participants, but the route reserves ${reservedSlots} slots.`,
    );
  }
  return { valid: true, value: compiled };
}

export function compileTournamentBlueprintV2(
  input: TournamentBlueprintV2,
  formatEngines: readonly StageFormatEngineV2[] = [],
): CompileTournamentRoutingResultV2 {
  let authoring;
  try {
    canonicalStringifyV2(input);
    authoring = validateTournamentBlueprintV2(input);
  } catch (error) {
    return {
      valid: false,
      problems: [
        {
          code: "NON_SERIALIZABLE_CONFIGURATION",
          path:
            error instanceof CanonicalSerializationError ? error.path : "$",
          message:
            error instanceof Error
              ? error.message
              : "Blueprint contains a non-serializable value.",
        },
      ],
    };
  }
  if (!authoring.valid) {
    return {
      valid: false,
      problems: authoring.problems.map(blueprintProblem),
    };
  }

  const problems: TournamentRoutingCompilationProblemV2[] = [];
  for (const [index, stage] of authoring.value.stages.entries()) {
    if (stage.capacity.type !== "exact") {
      problems.push({
        code: "UNSUPPORTED_CAPACITY",
        path: `stages[${index}].capacity`,
        message:
          "Compiled routing plan version 1 supports exact stage capacity only.",
      });
    }
  }

  const enginesByKey = new Map<string, StageFormatEngineV2>();
  formatEngines.forEach((engine, index) => {
    const key = engineKey(engine);
    if (enginesByKey.has(key)) {
      problems.push({
        code: "DUPLICATE_FORMAT_ENGINE",
        path: `formatEngines[${index}]`,
        message: `Duplicate format engine registration: ${key}.`,
      });
    } else {
      enginesByKey.set(key, engine);
    }
  });
  if (problems.length > 0) return { valid: false, problems };

  const registrationBuckets: CompiledRegistrationBucketV2[] =
    authoring.value.buckets.map((bucket) => ({
      bucketKey: registrationBucketKeyV2(bucket.key),
      name: bucket.name,
      exactCapacity: bucket.exactCapacity,
      priority: bucket.priority,
    }));
  const stages: CompiledStageV2[] = authoring.value.stages.map((stage) => ({
    stageKey: stageKeyV2(stage.key),
    name: stage.name,
    displayOrder: stage.displayOrder,
    exactParticipantCapacity:
      stage.capacity.type === "exact" ? stage.capacity.count : 0,
    selectionCapabilities:
      stage.selectionCapabilities?.type === "groups"
        ? {
            type: "groups",
            exactGroupCount: stage.selectionCapabilities.exactGroupSizes.length,
            exactGroupSizes: [...stage.selectionCapabilities.exactGroupSizes],
            maximumQualifiersPerGroup:
              stage.selectionCapabilities.maximumQualifiersPerGroup,
          }
        : { type: "none" },
    formatId: stage.format.id,
    formatRulesVersion: stage.format.rulesVersion,
  }));
  const compiledStageKeys = new Map(
    stages.map((stage) => [stage.stageKey as string, stage.stageKey] as const),
  );
  const entryPoints = authoring.value.stages.flatMap((stage) =>
    stageEntryPoints(stage, compiledStageKeys.get(stage.key)!),
  );

  const routes: CompiledParticipantRouteV2[] = [];
  const logicalMatches: CompiledLogicalMatchV2[] = [];
  const outputs: CompiledStageOutputV2[] = [];
  for (const stage of authoring.value.stages) {
    const engine = enginesByKey.get(stageEngineKey(stage));
    if (engine == null) continue;
    const compiled = compileFormatTwice(
      engine,
      stage,
      compiledStageKeys.get(stage.key)!,
    );
    if (!compiled.valid) {
      problems.push(compiled.problem);
      continue;
    }
    logicalMatches.push(...compiled.value.logicalMatches);
    outputs.push(...compiled.value.outputs);
    routes.push(...compiled.value.routes);
  }
  if (problems.length > 0) return { valid: false, problems };

  const outputCapacities = new Map(
    outputs.map((output) => [
      `${output.stageKey}\u0000${output.outputKey}`,
      output.exactCapacity,
    ]),
  );
  const compiledStages = new Map(
    stages.map((stage) => [stage.stageKey as string, stage] as const),
  );
  const compiledBuckets = new Map(
    registrationBuckets.map((bucket) => [
      bucket.bucketKey as string,
      bucket,
    ] as const),
  );
  authoring.value.transitions.forEach((transition, index) => {
    const reservedSlots = transition.reservedSlots ?? 0;
    const compiledSourceStageKey =
      transition.source.type === "stage_result"
        ? compiledStageKeys.get(transition.source.stageKey)
        : undefined;
    const selectionSource: SelectionSourceV2 | undefined =
      transition.source.type === "registration"
        ? (() => {
            const bucket = compiledBuckets.get(transition.source.bucketKey);
            return bucket == null
              ? undefined
              : { type: "registration_bucket" as const, bucket };
          })()
        : (() => {
            const stage = compiledStages.get(transition.source.stageKey);
            return stage == null
              ? undefined
              : { type: "stage_result" as const, stage };
          })();
    if (selectionSource == null) {
      problems.push({
        code: "UNKNOWN_REGISTRATION_BUCKET",
        path: `transitions[${index}].source`,
        message: "Transition references an unknown aggregate source.",
      });
      return;
    }
    const selection = compileSelection(
      transition.selection,
      reservedSlots,
      `transitions[${index}].selection`,
      selectionSource,
      outputCapacities,
    );
    if (!selection.valid) {
      problems.push(selection.problem);
      return;
    }
    const targetStageKey = compiledStageKeys.get(
      transition.target.stageKey,
    )!;
    routes.push({
      routeKey: blueprintRouteKeyV2(transition.key),
      source:
        transition.source.type === "registration"
          ? {
              type: "registration_bucket",
              bucketKey: registrationBucketKeyV2(
                transition.source.bucketKey,
              ),
              selection: selection.value,
            }
          : {
              type: "stage_result",
              stageKey: compiledSourceStageKey!,
              selection: selection.value,
            },
      target: {
        type: "stage_entry",
        stageKey: targetStageKey,
        entryKey: entryPointKeyV2(
          transition.target.entryPoint ?? "default",
        ),
      },
      reservedSlots,
      priority: transition.priority,
      order: transition.priority,
      condition: { type: "always" },
    });
  });
  if (problems.length > 0) return { valid: false, problems };

  const plan = canonicalizePlan({
    compiledPlanVersion: COMPILED_ROUTING_PLAN_VERSION_V2,
    blueprintModelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    registrationBuckets,
    stages,
    entryPoints,
    logicalMatches,
    outputs,
    routes,
    dependencies: [],
  });
  const validation = validateCompiledTournamentRoutingPlanV2(plan);
  if (!validation.valid) {
    return {
      valid: false,
      problems: validation.problems.map(compiledProblem),
    };
  }
  return { valid: true, value: validation.value };
}

export function serializeCompiledTournamentRoutingPlanV2(
  plan: CompiledTournamentRoutingPlanV2,
): string {
  return canonicalStringifyV2(plan);
}

export function compileV1StagePlanToRoutingV2(
  input: unknown,
  formatEngines: readonly StageFormatEngineV2[] = [],
): CompileV1StagePlanToRoutingResultV2 {
  const adapted = adaptV1StagePlanToV2(input);
  if (!adapted.valid) {
    if (adapted.source === "v1") {
      return {
        valid: false,
        source: "v1",
        problems: adapted.problems,
      };
    }
    return {
      valid: false,
      source: "v2-authoring",
      problems: adapted.problems,
    };
  }
  const compiled = compileTournamentBlueprintV2(
    adapted.value,
    formatEngines,
  );
  if (!compiled.valid) {
    return {
      valid: false,
      source: "v2-compiled",
      problems: compiled.problems,
    };
  }
  return {
    valid: true,
    blueprint: adapted.value,
    value: compiled.value,
  };
}

export type CompileV1StagePlanToRoutingResultV2 =
  | {
      valid: true;
      blueprint: TournamentBlueprintV2;
      value: CompiledTournamentRoutingPlanV2;
    }
  | {
      valid: false;
      source: "v1";
      problems: readonly TournamentStagePlanProblem[];
    }
  | {
      valid: false;
      source: "v2-authoring";
      problems: readonly TournamentBlueprintProblemV2[];
    }
  | {
      valid: false;
      source: "v2-compiled";
      problems: readonly TournamentRoutingCompilationProblemV2[];
    };
