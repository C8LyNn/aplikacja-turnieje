import type {
  CompiledParticipantSelectionV2,
  CompiledTournamentRoutingPlanV2,
} from "./compiled-routing-model";
import {
  hasOnlyKeys,
  isNonEmptyString,
  isPlainRecord,
  isPositiveInteger,
  type AddCompiledRoutingProblemV2,
  type CompiledRoutingProblemV2,
} from "./compiled-routing-validation-model";

type StructureValidationResult =
  | { valid: true; value: CompiledTournamentRoutingPlanV2 }
  | { valid: false; problems: CompiledRoutingProblemV2[] };

function validateExactKeys(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  path: string,
  code: "INVALID_STRUCTURE" | "INVALID_SELECTION",
  add: AddCompiledRoutingProblemV2,
): void {
  if (!hasOnlyKeys(value, keys)) {
    add(code, path, `Object contains fields that do not belong to this variant.`);
  }
}

function validateSelection(
  value: unknown,
  path: string,
  add: AddCompiledRoutingProblemV2,
): value is CompiledParticipantSelectionV2 {
  if (!isPlainRecord(value)) {
    add("INVALID_SELECTION", path, "Compiled selection must be a plain object.");
    return false;
  }
  const type = value.type;
  switch (type) {
    case "all":
      validateExactKeys(
        value,
        ["type", "exactCardinality"],
        path,
        "INVALID_SELECTION",
        add,
      );
      if (!isPositiveInteger(value.exactCardinality)) {
        add(
          "INVALID_SELECTION",
          `${path}.exactCardinality`,
          "all selection requires a positive exactCardinality.",
        );
      }
      return true;
    case "top_n":
    case "best_not_selected":
      validateExactKeys(
        value,
        ["type", "count", "exactCardinality"],
        path,
        "INVALID_SELECTION",
        add,
      );
      if (
        !isPositiveInteger(value.count) ||
        value.exactCardinality !== value.count
      ) {
        add(
          "INVALID_SELECTION",
          path,
          `${type} requires positive count and exactCardinality equal to count.`,
        );
      }
      return true;
    case "rank_range": {
      validateExactKeys(
        value,
        ["type", "from", "to", "exactCardinality"],
        path,
        "INVALID_SELECTION",
        add,
      );
      const valid =
        isPositiveInteger(value.from) &&
        isPositiveInteger(value.to) &&
        value.to >= value.from &&
        value.exactCardinality === value.to - value.from + 1;
      if (!valid) {
        add(
          "INVALID_SELECTION",
          path,
          "rank_range requires positive ordered bounds and their exact cardinality.",
        );
      }
      return true;
    }
    case "top_n_per_group": {
      validateExactKeys(
        value,
        [
          "type",
          "countPerGroup",
          "groupCount",
          "exactGroupSizes",
          "exactCardinality",
        ],
        path,
        "INVALID_SELECTION",
        add,
      );
      const valid =
        isPositiveInteger(value.countPerGroup) &&
        isPositiveInteger(value.groupCount) &&
        Array.isArray(value.exactGroupSizes) &&
        value.exactGroupSizes.length === value.groupCount &&
        value.exactGroupSizes.every(isPositiveInteger) &&
        value.exactCardinality ===
          value.exactGroupSizes.reduce(
            (sum, size) => sum + Math.min(value.countPerGroup as number, size),
            0,
          );
      if (!valid) {
        add(
          "INVALID_SELECTION",
          path,
          "top_n_per_group requires exact positive group sizes and a matching exactCardinality.",
        );
      }
      return true;
    }
    case "named_output":
      validateExactKeys(
        value,
        ["type", "outputKey", "exactCardinality"],
        path,
        "INVALID_SELECTION",
        add,
      );
      if (
        !isNonEmptyString(value.outputKey) ||
        !isPositiveInteger(value.exactCardinality)
      ) {
        add(
          "INVALID_SELECTION",
          path,
          "named_output requires an outputKey and positive exactCardinality.",
        );
      }
      return true;
    default:
      add(
        "UNKNOWN_SELECTION_TYPE",
        `${path}.type`,
        `Unsupported compiled selection type: ${String(type)}.`,
      );
      return false;
  }
}

function validateSelectionCapabilities(
  value: unknown,
  path: string,
  add: AddCompiledRoutingProblemV2,
): void {
  if (!isPlainRecord(value)) {
    add(
      "INVALID_STRUCTURE",
      path,
      "Stage selectionCapabilities must be a plain object.",
    );
    return;
  }
  if (value.type === "none") {
    validateExactKeys(value, ["type"], path, "INVALID_STRUCTURE", add);
    return;
  }
  if (value.type === "groups") {
    validateExactKeys(
      value,
      [
        "type",
        "exactGroupCount",
        "exactGroupSizes",
        "maximumQualifiersPerGroup",
      ],
      path,
      "INVALID_STRUCTURE",
      add,
    );
    if (
      !isPositiveInteger(value.exactGroupCount) ||
      !Array.isArray(value.exactGroupSizes) ||
      value.exactGroupSizes.length !== value.exactGroupCount ||
      !value.exactGroupSizes.every(isPositiveInteger) ||
      !isPositiveInteger(value.maximumQualifiersPerGroup)
    ) {
      add(
        "INVALID_GROUP_SELECTION",
        path,
        "Group capabilities require a positive count, exact positive sizes and maximum qualifiers.",
      );
    }
    return;
  }
  add(
    "INVALID_STRUCTURE",
    `${path}.type`,
    `Unsupported stage selection capability: ${String(value.type)}.`,
  );
}

function validateLineage(
  value: unknown,
  path: string,
  add: AddCompiledRoutingProblemV2,
): void {
  if (!isPlainRecord(value)) {
    add("INVALID_STRUCTURE", path, "Lineage must be a plain object.");
    return;
  }
  switch (value.type) {
    case "stage_entry":
      validateExactKeys(
        value,
        ["type", "stageKey", "entryKey"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (
        !isNonEmptyString(value.stageKey) ||
        !isNonEmptyString(value.entryKey)
      ) {
        add(
          "INVALID_STRUCTURE",
          path,
          "stage_entry lineage requires stageKey and entryKey.",
        );
      }
      return;
    case "route":
      validateExactKeys(
        value,
        ["type", "routeKey"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (!isNonEmptyString(value.routeKey)) {
        add(
          "INVALID_STRUCTURE",
          `${path}.routeKey`,
          "route lineage requires routeKey.",
        );
      }
      return;
    default:
      add(
        "UNKNOWN_LINEAGE_TYPE",
        `${path}.type`,
        `Unsupported participant lineage type: ${String(value.type)}.`,
      );
  }
}

function validateCondition(
  value: unknown,
  path: string,
  add: AddCompiledRoutingProblemV2,
): void {
  if (!isPlainRecord(value)) {
    add("INVALID_STRUCTURE", path, "Route condition must be a plain object.");
    return;
  }
  switch (value.type) {
    case "always":
      validateExactKeys(
        value,
        ["type"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      return;
    case "participant_lineage":
      validateExactKeys(
        value,
        ["type", "lineage"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      validateLineage(value.lineage, `${path}.lineage`, add);
      return;
    case "match_winner_lineage":
      validateExactKeys(
        value,
        ["type", "matchKey", "lineage"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (!isNonEmptyString(value.matchKey)) {
        add(
          "INVALID_STRUCTURE",
          `${path}.matchKey`,
          "match_winner_lineage requires matchKey.",
        );
      }
      validateLineage(value.lineage, `${path}.lineage`, add);
      return;
    default:
      add(
        "UNKNOWN_CONDITION_TYPE",
        `${path}.type`,
        `Unsupported route condition type: ${String(value.type)}.`,
      );
  }
}

function validateSource(
  value: unknown,
  path: string,
  add: AddCompiledRoutingProblemV2,
): void {
  if (!isPlainRecord(value)) {
    add("INVALID_STRUCTURE", path, "Route source must be a plain object.");
    return;
  }
  switch (value.type) {
    case "registration_bucket":
      validateExactKeys(
        value,
        ["type", "bucketKey", "selection"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (!isNonEmptyString(value.bucketKey)) {
        add(
          "INVALID_STRUCTURE",
          `${path}.bucketKey`,
          "registration_bucket requires bucketKey.",
        );
      }
      validateSelection(value.selection, `${path}.selection`, add);
      return;
    case "stage_result":
      validateExactKeys(
        value,
        ["type", "stageKey", "selection"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (!isNonEmptyString(value.stageKey)) {
        add(
          "INVALID_STRUCTURE",
          `${path}.stageKey`,
          "stage_result requires stageKey.",
        );
      }
      validateSelection(value.selection, `${path}.selection`, add);
      return;
    case "stage_entry":
      validateExactKeys(
        value,
        ["type", "stageKey", "entryKey", "position"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (
        !isNonEmptyString(value.stageKey) ||
        !isNonEmptyString(value.entryKey) ||
        !isPositiveInteger(value.position)
      ) {
        add(
          "INVALID_STRUCTURE",
          path,
          "stage_entry requires stageKey, entryKey and positive position.",
        );
      }
      return;
    case "match_outcome":
      validateExactKeys(
        value,
        ["type", "stageKey", "matchKey", "outcome"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (
        !isNonEmptyString(value.stageKey) ||
        !isNonEmptyString(value.matchKey)
      ) {
        add(
          "INVALID_STRUCTURE",
          path,
          "match_outcome requires stageKey and matchKey.",
        );
      }
      if (value.outcome !== "winner" && value.outcome !== "loser") {
        add(
          "UNKNOWN_MATCH_OUTCOME",
          `${path}.outcome`,
          `Unsupported match outcome: ${String(value.outcome)}.`,
        );
      }
      return;
    default:
      add(
        "UNKNOWN_SOURCE_TYPE",
        `${path}.type`,
        `Unsupported route source type: ${String(value.type)}.`,
      );
  }
}

function validateTarget(
  value: unknown,
  path: string,
  add: AddCompiledRoutingProblemV2,
): void {
  if (!isPlainRecord(value)) {
    add("INVALID_STRUCTURE", path, "Route target must be a plain object.");
    return;
  }
  switch (value.type) {
    case "stage_entry":
      validateExactKeys(
        value,
        ["type", "stageKey", "entryKey"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (
        !isNonEmptyString(value.stageKey) ||
        !isNonEmptyString(value.entryKey)
      ) {
        add(
          "INVALID_STRUCTURE",
          path,
          "stage_entry target requires stageKey and entryKey.",
        );
      }
      return;
    case "match_slot":
      validateExactKeys(
        value,
        ["type", "stageKey", "matchKey", "slot"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (
        !isNonEmptyString(value.stageKey) ||
        !isNonEmptyString(value.matchKey)
      ) {
        add(
          "INVALID_STRUCTURE",
          path,
          "match_slot requires stageKey and matchKey.",
        );
      }
      if (value.slot !== 1 && value.slot !== 2) {
        add(
          "INVALID_TARGET_SLOT",
          `${path}.slot`,
          "Target match slot must equal 1 or 2.",
        );
      }
      return;
    case "stage_output":
      validateExactKeys(
        value,
        ["type", "stageKey", "outputKey"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (
        !isNonEmptyString(value.stageKey) ||
        !isNonEmptyString(value.outputKey)
      ) {
        add(
          "INVALID_STRUCTURE",
          path,
          "stage_output requires stageKey and outputKey.",
        );
      }
      return;
    default:
      add(
        "UNKNOWN_TARGET_TYPE",
        `${path}.type`,
        `Unsupported route target type: ${String(value.type)}.`,
      );
  }
}

function validateRecordArray(
  value: unknown,
  path: string,
  add: AddCompiledRoutingProblemV2,
  visit: (
    record: Readonly<Record<string, unknown>>,
    itemPath: string,
  ) => void,
): void {
  if (!Array.isArray(value)) {
    add("INVALID_STRUCTURE", path, `${path} must be an array.`);
    return;
  }
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isPlainRecord(item)) {
      add("INVALID_STRUCTURE", itemPath, "Item must be a plain object.");
      return;
    }
    visit(item, itemPath);
  });
}

export function validateCompiledRoutingStructureV2(
  input: unknown,
): StructureValidationResult {
  const problems: CompiledRoutingProblemV2[] = [];
  const add: AddCompiledRoutingProblemV2 = (code, path, message) => {
    problems.push({ code, path, message });
  };
  if (!isPlainRecord(input)) {
    return {
      valid: false,
      problems: [
        {
          code: "INVALID_STRUCTURE",
          path: "$",
          message: "Compiled routing plan must be a plain object.",
        },
      ],
    };
  }
  validateExactKeys(
    input,
    [
      "compiledPlanVersion",
      "blueprintModelVersion",
      "registrationBuckets",
      "stages",
      "entryPoints",
      "logicalMatches",
      "outputs",
      "routes",
      "dependencies",
    ],
    "$",
    "INVALID_STRUCTURE",
    add,
  );

  validateRecordArray(
    input.registrationBuckets,
    "registrationBuckets",
    add,
    (bucket, path) => {
      validateExactKeys(
        bucket,
        ["bucketKey", "name", "exactCapacity", "priority"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (!isNonEmptyString(bucket.bucketKey)) {
        add("INVALID_STRUCTURE", `${path}.bucketKey`, "bucketKey is required.");
      }
      if (!isPositiveInteger(bucket.exactCapacity)) {
        add(
          "INVALID_CAPACITY",
          `${path}.exactCapacity`,
          "Bucket exactCapacity must be a positive integer.",
        );
      }
    },
  );
  validateRecordArray(input.stages, "stages", add, (stage, path) => {
    validateExactKeys(
      stage,
      [
        "stageKey",
        "name",
        "displayOrder",
        "exactParticipantCapacity",
        "selectionCapabilities",
        "formatId",
        "formatRulesVersion",
      ],
      path,
      "INVALID_STRUCTURE",
      add,
    );
    if (!isNonEmptyString(stage.stageKey)) {
      add("INVALID_STRUCTURE", `${path}.stageKey`, "stageKey is required.");
    }
    if (!isPositiveInteger(stage.exactParticipantCapacity)) {
      add(
        "INVALID_CAPACITY",
        `${path}.exactParticipantCapacity`,
        "Stage exactParticipantCapacity must be positive.",
      );
    }
    validateSelectionCapabilities(
      stage.selectionCapabilities,
      `${path}.selectionCapabilities`,
      add,
    );
  });
  validateRecordArray(
    input.entryPoints,
    "entryPoints",
    add,
    (entry, path) => {
      validateExactKeys(
        entry,
        [
          "stageKey",
          "entryKey",
          "name",
          "exactCapacity",
          "priority",
          "completeness",
        ],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (!isPlainRecord(entry.completeness)) {
        add(
          "INVALID_ENTRY_COMPLETENESS",
          `${path}.completeness`,
          "Entry completeness must be a plain object.",
        );
      } else if (
        entry.completeness.type !== "exact" ||
        !hasOnlyKeys(entry.completeness, ["type"])
      ) {
        add(
          "INVALID_ENTRY_COMPLETENESS",
          `${path}.completeness`,
          "Only exact entry completeness is supported.",
        );
      }
    },
  );
  validateRecordArray(
    input.logicalMatches,
    "logicalMatches",
    add,
    (match, path) => {
      validateExactKeys(
        match,
        ["matchKey", "stageKey", "name", "order", "slots"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
      if (
        !Array.isArray(match.slots) ||
        match.slots.length !== 2 ||
        match.slots[0] !== 1 ||
        match.slots[1] !== 2
      ) {
        add(
          "INVALID_TARGET_SLOT",
          `${path}.slots`,
          "Logical match slots must equal [1, 2].",
        );
      }
    },
  );
  validateRecordArray(input.outputs, "outputs", add, (output, path) => {
    validateExactKeys(
      output,
      ["stageKey", "outputKey", "name", "exactCapacity", "priority"],
      path,
      "INVALID_STRUCTURE",
      add,
    );
  });
  validateRecordArray(input.routes, "routes", add, (route, path) => {
    validateExactKeys(
      route,
      [
        "routeKey",
        "source",
        "target",
        "reservedSlots",
        "priority",
        "order",
        "condition",
      ],
      path,
      "INVALID_STRUCTURE",
      add,
    );
    validateSource(route.source, `${path}.source`, add);
    validateTarget(route.target, `${path}.target`, add);
    validateCondition(route.condition, `${path}.condition`, add);
  });
  validateRecordArray(
    input.dependencies,
    "dependencies",
    add,
    (dependency, path) => {
      validateExactKeys(
        dependency,
        ["routeKey", "sourceNodeKey", "targetNodeKey"],
        path,
        "INVALID_STRUCTURE",
        add,
      );
    },
  );

  if (problems.length > 0) return { valid: false, problems };
  return {
    valid: true,
    value: structuredClone(input) as unknown as CompiledTournamentRoutingPlanV2,
  };
}
