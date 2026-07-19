import {
  TOURNAMENT_ENGINE_MODEL_VERSION,
  type ParticipantCapacityV2,
  type ParticipantSelectionRuleV2,
  type SeedAssignmentPolicyV2,
  type TournamentBlueprintV2,
} from "./stage-model";

export type TournamentBlueprintProblemCodeV2 =
  | "INVALID_MODEL_VERSION"
  | "INVALID_INITIAL_PARTICIPANT_COUNT"
  | "NO_BUCKETS"
  | "NO_STAGES"
  | "INVALID_KEY"
  | "EMPTY_BUCKET_NAME"
  | "EMPTY_STAGE_NAME"
  | "DUPLICATE_BUCKET_KEY"
  | "DUPLICATE_STAGE_KEY"
  | "DUPLICATE_TRANSITION_KEY"
  | "INVALID_PRIORITY"
  | "INVALID_DISPLAY_ORDER"
  | "INVALID_CAPACITY"
  | "INVALID_FORMAT"
  | "INVALID_RULES_VERSION"
  | "INVALID_BEST_OF"
  | "INVALID_CLASSIFICATION"
  | "INVALID_ENTRY_POINT"
  | "UNKNOWN_SOURCE_BUCKET"
  | "UNKNOWN_SOURCE_STAGE"
  | "UNKNOWN_TARGET_STAGE"
  | "SELF_TRANSITION"
  | "INVALID_SELECTION"
  | "INVALID_SEED_ASSIGNMENT"
  | "INVALID_PLACEMENT"
  | "INVALID_RESERVED_SLOTS"
  | "TARGET_CAPACITY_EXCEEDED"
  | "STAGE_WITHOUT_INPUT"
  | "UNREACHABLE_STAGE"
  | "CYCLIC_STAGE_GRAPH";

export interface TournamentBlueprintProblemV2 {
  code: TournamentBlueprintProblemCodeV2;
  path: string;
  message: string;
}

export type TournamentBlueprintValidationResultV2 =
  | { valid: true; value: TournamentBlueprintV2 }
  | { valid: false; problems: TournamentBlueprintProblemV2[] };

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isNonEmptyKey(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function maximumCapacity(capacity: ParticipantCapacityV2): number {
  return capacity.type === "exact" ? capacity.count : capacity.maximum;
}

function validateCapacity(capacity: ParticipantCapacityV2): boolean {
  if (capacity.type === "exact") {
    return isPositiveInteger(capacity.count) && capacity.count >= 2;
  }
  if (
    !isPositiveInteger(capacity.minimum) ||
    !isPositiveInteger(capacity.maximum) ||
    capacity.minimum < 2
  ) {
    return false;
  }
  if (capacity.minimum > capacity.maximum) return false;
  if (capacity.preferred == null) return true;
  return (
    isPositiveInteger(capacity.preferred) &&
    capacity.preferred >= capacity.minimum &&
    capacity.preferred <= capacity.maximum
  );
}


function validateRankingCriteria(
  criteria: readonly { metric: string }[],
  allowEmpty: boolean,
): boolean {
  return (allowEmpty || criteria.length > 0) && criteria.every((criterion) => isNonEmptyKey(criterion.metric));
}

function validateClassification(
  classification: TournamentBlueprintV2["stages"][number]["classification"],
): boolean {
  switch (classification.type) {
    case "format_default":
      return isNonEmptyKey(classification.policyId);
    case "ordered_criteria":
      return validateRankingCriteria(classification.criteria, false);
    case "policy_ref":
      return isNonEmptyKey(classification.policyId);
  }
}

function validateSelection(selection: ParticipantSelectionRuleV2): boolean {
  switch (selection.type) {
    case "all":
      return true;
    case "top_n":
    case "top_n_per_group":
    case "best_not_selected":
      return isPositiveInteger(selection.count);
    case "rank_range":
      return (
        isPositiveInteger(selection.from) &&
        isPositiveInteger(selection.to) &&
        selection.from <= selection.to
      );
    case "round_outcome":
      return isPositiveInteger(selection.round);
    case "policy_ref":
      return isNonEmptyKey(selection.policyId);
  }
}

function validateSeedAssignment(policy: SeedAssignmentPolicyV2): boolean {
  switch (policy.type) {
    case "preserve":
    case "manual":
      return true;
    case "classification_order":
      return validateRankingCriteria(policy.criteria, false);
    case "rank_bands":
      return (
        isNonEmptyKey(policy.bandMetric) &&
        validateRankingCriteria(policy.withinBand, true)
      );
    case "fixed_range":
      return isPositiveInteger(policy.firstSeed);
    case "random":
      return policy.randomSeed == null || policy.randomSeed.length > 0;
    case "policy_ref":
      return isNonEmptyKey(policy.policyId);
  }
}


function validatePlacement(
  placement: TournamentBlueprintV2["transitions"][number]["placement"],
): boolean {
  switch (placement.type) {
    case "format_default":
    case "standard_seeded_bracket":
    case "snake_groups":
    case "manual":
      return true;
    case "random":
      return placement.randomSeed == null || placement.randomSeed.length > 0;
    case "policy_ref":
      return isNonEmptyKey(placement.policyId);
  }
}

function detectCycle(
  stageKeys: readonly string[],
  edges: ReadonlyMap<string, readonly string[]>,
): boolean {
  const state = new Map<string, "visiting" | "visited">();

  const visit = (stageKey: string): boolean => {
    const current = state.get(stageKey);
    if (current === "visiting") return true;
    if (current === "visited") return false;

    state.set(stageKey, "visiting");
    for (const target of edges.get(stageKey) ?? []) {
      if (visit(target)) return true;
    }
    state.set(stageKey, "visited");
    return false;
  };

  return stageKeys.some((stageKey) => visit(stageKey));
}

export function validateTournamentBlueprintV2(
  input: TournamentBlueprintV2,
): TournamentBlueprintValidationResultV2 {
  const problems: TournamentBlueprintProblemV2[] = [];
  const add = (
    code: TournamentBlueprintProblemCodeV2,
    path: string,
    message: string,
  ): void => {
    problems.push({ code, path, message });
  };

  if (input.modelVersion !== TOURNAMENT_ENGINE_MODEL_VERSION) {
    add("INVALID_MODEL_VERSION", "modelVersion", "modelVersion must equal 2.");
  }
  if (!isPositiveInteger(input.initialParticipantCount) || input.initialParticipantCount < 2) {
    add(
      "INVALID_INITIAL_PARTICIPANT_COUNT",
      "initialParticipantCount",
      "initialParticipantCount must be an integer of at least 2.",
    );
  }
  if (input.buckets.length === 0) add("NO_BUCKETS", "buckets", "At least one bucket is required.");
  if (input.stages.length === 0) add("NO_STAGES", "stages", "At least one stage is required.");

  const bucketKeys = new Set<string>();
  input.buckets.forEach((bucket, index) => {
    if (!isNonEmptyKey(bucket.key)) add("INVALID_KEY", `buckets[${index}].key`, "Bucket key cannot be empty.");
    else if (bucketKeys.has(bucket.key)) {
      add("DUPLICATE_BUCKET_KEY", `buckets[${index}].key`, `Duplicate bucket key: ${bucket.key}.`);
    } else bucketKeys.add(bucket.key);

    if (typeof bucket.name !== "string" || bucket.name.trim().length === 0) {
      add("EMPTY_BUCKET_NAME", `buckets[${index}].name`, "Bucket name cannot be empty.");
    }
    if (!isNonNegativeInteger(bucket.priority)) {
      add("INVALID_PRIORITY", `buckets[${index}].priority`, "Bucket priority must be a non-negative integer.");
    }
  });

  const stageKeys = new Set<string>();
  input.stages.forEach((stage, index) => {
    const path = `stages[${index}]`;
    if (!isNonEmptyKey(stage.key)) add("INVALID_KEY", `${path}.key`, "Stage key cannot be empty.");
    else if (stageKeys.has(stage.key)) {
      add("DUPLICATE_STAGE_KEY", `${path}.key`, `Duplicate stage key: ${stage.key}.`);
    } else stageKeys.add(stage.key);

    if (typeof stage.name !== "string" || stage.name.trim().length === 0) {
      add("EMPTY_STAGE_NAME", `${path}.name`, "Stage name cannot be empty.");
    }
    if (!isPositiveInteger(stage.displayOrder)) {
      add("INVALID_DISPLAY_ORDER", `${path}.displayOrder`, "displayOrder must be a positive integer.");
    }
    if (!validateCapacity(stage.capacity)) {
      add("INVALID_CAPACITY", `${path}.capacity`, "Stage capacity is invalid.");
    }
    if (
      !isNonEmptyKey(stage.format.id) ||
      (stage.format.id.startsWith("custom:") && stage.format.id.slice("custom:".length).trim().length === 0)
    ) {
      add("INVALID_FORMAT", `${path}.format.id`, "Stage format id is invalid.");
    }
    if (!isPositiveInteger(stage.format.rulesVersion)) {
      add("INVALID_RULES_VERSION", `${path}.format.rulesVersion`, "rulesVersion must be a positive integer.");
    }
    if (!isPositiveInteger(stage.matchRules.bestOf) || stage.matchRules.bestOf % 2 === 0) {
      add(
        "INVALID_BEST_OF",
        `${path}.matchRules.bestOf`,
        "bestOf must be a positive odd integer.",
      );
    }
    if (!validateClassification(stage.classification)) {
      add(
        "INVALID_CLASSIFICATION",
        `${path}.classification`,
        "Stage classification policy is invalid.",
      );
    }
  });

  const transitionKeys = new Set<string>();
  const incomingCount = new Map<string, number>();
  const reservedByTarget = new Map<string, number>();
  const edges = new Map<string, string[]>();
  const registrationTargets = new Set<string>();

  input.transitions.forEach((transition, index) => {
    const path = `transitions[${index}]`;
    if (!isNonEmptyKey(transition.key)) {
      add("INVALID_KEY", `${path}.key`, "Transition key cannot be empty.");
    }
    else if (transitionKeys.has(transition.key)) {
      add(
        "DUPLICATE_TRANSITION_KEY",
        `${path}.key`,
        `Duplicate transition key: ${transition.key}.`,
      );
    } else transitionKeys.add(transition.key);

    if (!isNonNegativeInteger(transition.priority)) {
      add(
        "INVALID_PRIORITY",
        `${path}.priority`,
        "Transition priority must be a non-negative integer.",
      );
    }

    if (transition.source.type === "registration") {
      if (!bucketKeys.has(transition.source.bucketKey)) {
        add(
          "UNKNOWN_SOURCE_BUCKET",
          `${path}.source.bucketKey`,
          `Unknown source bucket: ${transition.source.bucketKey}.`,
        );
      }
      registrationTargets.add(transition.target.stageKey);
    } else if (!stageKeys.has(transition.source.stageKey)) {
      add(
        "UNKNOWN_SOURCE_STAGE",
        `${path}.source.stageKey`,
        `Unknown source stage: ${transition.source.stageKey}.`,
      );
    }

    if (
      transition.target.entryPoint != null &&
      !isNonEmptyKey(transition.target.entryPoint)
    ) {
      add(
        "INVALID_ENTRY_POINT",
        `${path}.target.entryPoint`,
        "Target entryPoint cannot be empty when provided.",
      );
    }

    if (!stageKeys.has(transition.target.stageKey)) {
      add(
        "UNKNOWN_TARGET_STAGE",
        `${path}.target.stageKey`,
        `Unknown target stage: ${transition.target.stageKey}.`,
      );
    }

    if (
      transition.source.type === "stage_result" &&
      transition.source.stageKey === transition.target.stageKey
    ) {
      add("SELF_TRANSITION", path, "A stage cannot route participants to itself.");
    }

    if (!validateSelection(transition.selection)) {
      add(
        "INVALID_SELECTION",
        `${path}.selection`,
        "Participant selection rule is invalid.",
      );
    }
    if (!validateSeedAssignment(transition.seedAssignment)) {
      add(
        "INVALID_SEED_ASSIGNMENT",
        `${path}.seedAssignment`,
        "Seed assignment rule is invalid.",
      );
    }
    if (!validatePlacement(transition.placement)) {
      add(
        "INVALID_PLACEMENT",
        `${path}.placement`,
        "Stage placement policy is invalid.",
      );
    }
    if (transition.reservedSlots != null && !isPositiveInteger(transition.reservedSlots)) {
      add(
        "INVALID_RESERVED_SLOTS",
        `${path}.reservedSlots`,
        "reservedSlots must be a positive integer.",
      );
    }

    if (stageKeys.has(transition.target.stageKey)) {
      incomingCount.set(
        transition.target.stageKey,
        (incomingCount.get(transition.target.stageKey) ?? 0) + 1,
      );
      if (transition.reservedSlots != null) {
        reservedByTarget.set(
          transition.target.stageKey,
          (reservedByTarget.get(transition.target.stageKey) ?? 0) + transition.reservedSlots,
        );
      }
    }

    if (
      transition.source.type === "stage_result" &&
      stageKeys.has(transition.source.stageKey) &&
      stageKeys.has(transition.target.stageKey)
    ) {
      const targets = edges.get(transition.source.stageKey) ?? [];
      targets.push(transition.target.stageKey);
      edges.set(transition.source.stageKey, targets);
    }
  });

  input.stages.forEach((stage, index) => {
    if ((incomingCount.get(stage.key) ?? 0) === 0) {
      add(
        "STAGE_WITHOUT_INPUT",
        `stages[${index}]`,
        `Stage ${stage.key} has no incoming transition.`,
      );
    }
    const maximum = maximumCapacity(stage.capacity);
    const reserved = reservedByTarget.get(stage.key) ?? 0;
    if (reserved > maximum) {
      add(
        "TARGET_CAPACITY_EXCEEDED",
        `stages[${index}].capacity`,
        `Incoming routes reserve ${reserved} slots, exceeding maximum capacity ${maximum}.`,
      );
    }
  });

  const reachable = new Set<string>();
  const queue = [...registrationTargets].filter((stageKey) => stageKeys.has(stageKey));
  while (queue.length > 0) {
    const stageKey = queue.shift()!;
    if (reachable.has(stageKey)) continue;
    reachable.add(stageKey);
    queue.push(...(edges.get(stageKey) ?? []));
  }
  input.stages.forEach((stage, index) => {
    if (!reachable.has(stage.key)) {
      add(
        "UNREACHABLE_STAGE",
        `stages[${index}]`,
        `Stage ${stage.key} is unreachable from registration.`,
      );
    }
  });

  if (detectCycle([...stageKeys], edges)) {
    add("CYCLIC_STAGE_GRAPH", "transitions", "Stage graph must be acyclic.");
  }

  if (problems.length > 0) return { valid: false, problems };
  return { valid: true, value: structuredClone(input) };
}
