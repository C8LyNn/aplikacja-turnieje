import { createHash } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  matchesTable,
  resultHistoryTable,
  tournamentRoutingBucketsTable,
  tournamentRoutingDependenciesTable,
  tournamentRoutingEntryPointsTable,
  tournamentRoutingLogicalMatchesTable,
  tournamentRoutingLogicalMatchSlotsTable,
  tournamentRoutingOutputsTable,
  tournamentRoutingPlansTable,
  tournamentRoutingRouteConditionsTable,
  tournamentRoutingRouteSourcesTable,
  tournamentRoutingRouteTargetsTable,
  tournamentRoutingRoutesTable,
  tournamentRoutingSelectionGroupSizesTable,
  tournamentRoutingSelectionsTable,
  tournamentRoutingStageGroupSizesTable,
  tournamentRoutingStagesTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  COMPILED_ROUTING_PLAN_VERSION_V2,
  TOURNAMENT_ENGINE_MODEL_VERSION,
  canonicalStringifyV2,
  validateCompiledTournamentRoutingPlanV2,
  type CompiledParticipantSelectionV2,
  type CompiledTournamentRoutingPlanV2,
} from "../../domain/tournament/v2";
import {
  RoutingPlanPersistenceError,
  type RoutingPlanPersistenceErrorCode,
} from "./routing-plan-errors";

type RoutingTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface SaveCompiledRoutingPlanInput {
  tournamentId: number;
  revision?: number;
  plan: unknown;
  stageIdsByKey:
    | ReadonlyMap<string, number>
    | Readonly<Record<string, number>>;
  sourceKind?: string;
  testHooks?: {
    /** Test-only seam; never wired to HTTP, environment variables or runtime flags. */
    afterPlanWritten?: () => void | Promise<void>;
    /** Test-only seam; never wired to HTTP, environment variables or runtime flags. */
    afterGraphWritten?: () => void | Promise<void>;
  };
}

export interface LoadedCompiledRoutingPlan {
  planId: number;
  tournamentId: number;
  revision: number;
  checksum: string;
  canonicalPayload: string;
  sourceKind: string;
  createdAt: Date;
  sealedAt: Date;
  plan: CompiledTournamentRoutingPlanV2;
}

export interface SavedCompiledRoutingPlan extends LoadedCompiledRoutingPlan {
  applied: boolean;
}

interface PlanLookup {
  planId?: number;
  tournamentId?: number;
  revision?: number;
}

function sha256Hex(payload: string): string {
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

function pairKey(left: string, right: string): string {
  return `${left}\u0000${right}`;
}

function mappingEntries(
  mapping: SaveCompiledRoutingPlanInput["stageIdsByKey"],
): Array<readonly [string, number]> {
  return mapping instanceof Map
    ? [...mapping.entries()]
    : Object.entries(mapping);
}

function invalidPlanCode(
  problems: readonly { code: string }[],
): RoutingPlanPersistenceErrorCode {
  return problems.some(
    (problem) =>
      problem.code === "DUPLICATE_ROUTE_KEY" ||
      problem.code === "TARGET_SLOT_CONFLICT",
  )
    ? "DUPLICATE_ROUTE_OR_SLOT_TARGET"
    : "INVALID_COMPILED_ROUTING_PLAN";
}

function assertSupportedVersions(
  compiledPlanVersion: number,
  blueprintModelVersion: number,
): void {
  if (
    compiledPlanVersion !== COMPILED_ROUTING_PLAN_VERSION_V2 ||
    blueprintModelVersion !== TOURNAMENT_ENGINE_MODEL_VERSION
  ) {
    throw new RoutingPlanPersistenceError(
      "UNSUPPORTED_ROUTING_MODEL_VERSION",
      { compiledPlanVersion, blueprintModelVersion },
    );
  }
}

function requireValue<T>(
  value: T | null | undefined,
  details: Readonly<Record<string, unknown>>,
): T {
  if (value == null) {
    throw new RoutingPlanPersistenceError("CORRUPTED_ROUTING_GRAPH", details);
  }
  return value;
}

function unknownDiscriminant(
  kind: string,
  value: string,
): never {
  throw new RoutingPlanPersistenceError(
    "UNKNOWN_PERSISTED_DISCRIMINANT",
    { kind, value },
  );
}

function assertContiguousSequence(
  values: readonly number[],
  relation: string,
  startAt = 0,
): void {
  values.forEach((value, index) => {
    const expected = startAt + index;
    if (value !== expected) {
      throw new RoutingPlanPersistenceError(
        "CORRUPTED_ROUTING_ORDINAL_SEQUENCE",
        { relation, expected, actual: value },
      );
    }
  });
}

function uniqueMapByNumber<T>(
  rows: readonly T[],
  keyOf: (row: T) => number,
  relation: string,
): Map<number, T> {
  const result = new Map<number, T>();
  for (const row of rows) {
    const key = keyOf(row);
    if (result.has(key)) {
      throw new RoutingPlanPersistenceError(
        "UNEXPECTED_ROUTING_CHILD_ROW",
        { relation, key, reason: "duplicate" },
      );
    }
    result.set(key, row);
  }
  return result;
}

function unexpectedChild(
  relation: string,
  details: Readonly<Record<string, unknown>>,
): never {
  throw new RoutingPlanPersistenceError("UNEXPECTED_ROUTING_CHILD_ROW", {
    relation,
    ...details,
  });
}

function selectionInsert(
  selection: CompiledParticipantSelectionV2,
  planId: number,
  routeId: number,
  routingStageId: number | null,
  namedOutputId: number | null,
): typeof tournamentRoutingSelectionsTable.$inferInsert {
  const base = {
    routeId,
    planId,
    routingStageId,
    selectionType: selection.type,
    exactCardinality: selection.exactCardinality,
    count: null,
    rangeFrom: null,
    rangeTo: null,
    countPerGroup: null,
    groupCount: null,
    namedOutputId,
  };
  switch (selection.type) {
    case "all":
      return base;
    case "top_n":
    case "best_not_selected":
      return { ...base, count: selection.count };
    case "rank_range":
      return {
        ...base,
        rangeFrom: selection.from,
        rangeTo: selection.to,
      };
    case "top_n_per_group":
      return {
        ...base,
        countPerGroup: selection.countPerGroup,
        groupCount: selection.groupCount,
      };
    case "named_output":
      return base;
  }
}

async function loadRelationalPlan(
  tx: RoutingTransaction,
  lookup: PlanLookup,
): Promise<LoadedCompiledRoutingPlan> {
  const where =
    lookup.planId != null
      ? eq(tournamentRoutingPlansTable.id, lookup.planId)
      : lookup.tournamentId != null && lookup.revision != null
        ? and(
            eq(tournamentRoutingPlansTable.tournamentId, lookup.tournamentId),
            eq(tournamentRoutingPlansTable.revision, lookup.revision),
          )
        : lookup.tournamentId != null
          ? eq(tournamentRoutingPlansTable.tournamentId, lookup.tournamentId)
          : undefined;
  if (where == null) {
    throw new RoutingPlanPersistenceError("ROUTING_PLAN_NOT_FOUND");
  }
  const [root] = await tx
    .select()
    .from(tournamentRoutingPlansTable)
    .where(where)
    .orderBy(desc(tournamentRoutingPlansTable.revision))
    .limit(1);
  if (!root) {
    throw new RoutingPlanPersistenceError("ROUTING_PLAN_NOT_FOUND");
  }
  assertSupportedVersions(
    root.compiledPlanVersion,
    root.blueprintModelVersion,
  );

  // A Drizzle transaction owns one pg client. Keep catalog reads sequential so
  // the driver never has multiple queries in flight on that client.
  const bucketRows = await tx.select().from(tournamentRoutingBucketsTable)
      .where(eq(tournamentRoutingBucketsTable.planId, root.id))
      .orderBy(asc(tournamentRoutingBucketsTable.ordinal));
  const stageRows = await tx.select().from(tournamentRoutingStagesTable)
      .where(eq(tournamentRoutingStagesTable.planId, root.id))
      .orderBy(asc(tournamentRoutingStagesTable.ordinal));
  const stageGroupSizeRows = await tx.select().from(tournamentRoutingStageGroupSizesTable)
      .where(eq(tournamentRoutingStageGroupSizesTable.planId, root.id))
      .orderBy(
        asc(tournamentRoutingStageGroupSizesTable.routingStageId),
        asc(tournamentRoutingStageGroupSizesTable.position),
      );
  const entryRows = await tx.select().from(tournamentRoutingEntryPointsTable)
      .where(eq(tournamentRoutingEntryPointsTable.planId, root.id))
      .orderBy(asc(tournamentRoutingEntryPointsTable.ordinal));
  const logicalMatchRows = await tx.select().from(tournamentRoutingLogicalMatchesTable)
      .where(eq(tournamentRoutingLogicalMatchesTable.planId, root.id))
      .orderBy(asc(tournamentRoutingLogicalMatchesTable.ordinal));
  const logicalMatchSlotRows = await tx.select().from(tournamentRoutingLogicalMatchSlotsTable)
      .where(eq(tournamentRoutingLogicalMatchSlotsTable.planId, root.id))
      .orderBy(
        asc(tournamentRoutingLogicalMatchSlotsTable.logicalMatchId),
        asc(tournamentRoutingLogicalMatchSlotsTable.slot),
      );
  const outputRows = await tx.select().from(tournamentRoutingOutputsTable)
      .where(eq(tournamentRoutingOutputsTable.planId, root.id))
      .orderBy(asc(tournamentRoutingOutputsTable.ordinal));
  const routeRows = await tx.select().from(tournamentRoutingRoutesTable)
      .where(eq(tournamentRoutingRoutesTable.planId, root.id))
      .orderBy(asc(tournamentRoutingRoutesTable.ordinal));
  const selectionRows = await tx.select().from(tournamentRoutingSelectionsTable)
      .where(eq(tournamentRoutingSelectionsTable.planId, root.id));
  const selectionGroupSizeRows = await tx.select().from(tournamentRoutingSelectionGroupSizesTable)
      .where(eq(tournamentRoutingSelectionGroupSizesTable.planId, root.id))
      .orderBy(
        asc(tournamentRoutingSelectionGroupSizesTable.routeId),
        asc(tournamentRoutingSelectionGroupSizesTable.position),
      );
  const sourceRows = await tx.select().from(tournamentRoutingRouteSourcesTable)
      .where(eq(tournamentRoutingRouteSourcesTable.planId, root.id));
  const targetRows = await tx.select().from(tournamentRoutingRouteTargetsTable)
      .where(eq(tournamentRoutingRouteTargetsTable.planId, root.id));
  const conditionRows = await tx.select().from(tournamentRoutingRouteConditionsTable)
      .where(eq(tournamentRoutingRouteConditionsTable.planId, root.id));
  const dependencyRows = await tx.select().from(tournamentRoutingDependenciesTable)
      .where(eq(tournamentRoutingDependenciesTable.planId, root.id))
      .orderBy(asc(tournamentRoutingDependenciesTable.ordinal));

  assertContiguousSequence(
    bucketRows.map((row) => row.ordinal),
    "registration_buckets",
  );
  assertContiguousSequence(
    stageRows.map((row) => row.ordinal),
    "routing_stages",
  );
  assertContiguousSequence(
    stageRows.map((row) => row.displayOrder),
    "routing_stages.display_order",
    1,
  );
  assertContiguousSequence(
    entryRows.map((row) => row.ordinal),
    "entry_points",
  );
  assertContiguousSequence(
    logicalMatchRows.map((row) => row.ordinal),
    "logical_matches",
  );
  assertContiguousSequence(
    outputRows.map((row) => row.ordinal),
    "outputs",
  );
  assertContiguousSequence(
    routeRows.map((row) => row.ordinal),
    "routes",
  );
  assertContiguousSequence(
    dependencyRows.map((row) => row.ordinal),
    "dependencies",
  );

  const stageById = new Map(stageRows.map((row) => [row.id, row]));
  const entryById = new Map(entryRows.map((row) => [row.id, row]));
  const matchById = new Map(logicalMatchRows.map((row) => [row.id, row]));
  for (const stage of stageRows) {
    assertContiguousSequence(
      logicalMatchRows
        .filter((row) => row.routingStageId === stage.id)
        .map((row) => row.matchOrder),
      `logical_matches.match_order:${stage.id}`,
    );
  }
  const outputById = new Map(outputRows.map((row) => [row.id, row]));
  const routeById = new Map(routeRows.map((row) => [row.id, row]));
  const bucketById = new Map(bucketRows.map((row) => [row.id, row]));
  const selectionByRoute = uniqueMapByNumber(
    selectionRows,
    (row) => row.routeId,
    "route_selection",
  );
  const sourceByRoute = uniqueMapByNumber(
    sourceRows,
    (row) => row.routeId,
    "route_source",
  );
  const targetByRoute = uniqueMapByNumber(
    targetRows,
    (row) => row.routeId,
    "route_target",
  );
  const conditionByRoute = uniqueMapByNumber(
    conditionRows,
    (row) => row.routeId,
    "route_condition",
  );
  const dependencyByRoute = uniqueMapByNumber(
    dependencyRows,
    (row) => row.routeId,
    "route_dependency",
  );

  const groupSizesByStage = new Map<number, number[]>();
  for (const row of stageGroupSizeRows) {
    if (!stageById.has(row.routingStageId)) {
      unexpectedChild("stage_group_size", {
        routingStageId: row.routingStageId,
        reason: "unknown_stage",
      });
    }
    const values = groupSizesByStage.get(row.routingStageId) ?? [];
    if (row.position !== values.length) {
      throw new RoutingPlanPersistenceError(
        "CORRUPTED_ROUTING_ORDINAL_SEQUENCE",
        {
          relation: "stage_group_sizes",
          routingStageId: row.routingStageId,
          expected: values.length,
          actual: row.position,
        },
      );
    }
    values.push(row.exactGroupSize);
    groupSizesByStage.set(row.routingStageId, values);
  }
  const slotsByMatch = new Map<number, number[]>();
  for (const row of logicalMatchSlotRows) {
    const match = matchById.get(row.logicalMatchId);
    if (!match) {
      unexpectedChild("logical_match_slot", {
        logicalMatchId: row.logicalMatchId,
        reason: "unknown_match",
      });
    }
    if (row.routingStageId !== match.routingStageId) {
      throw new RoutingPlanPersistenceError(
        "MISSING_LOGICAL_MATCH_SLOT",
        {
          logicalMatchId: row.logicalMatchId,
          reason: "stage_mismatch",
        },
      );
    }
    const values = slotsByMatch.get(row.logicalMatchId) ?? [];
    const expectedSlot = values.length + 1;
    if (row.slot !== expectedSlot) {
      throw new RoutingPlanPersistenceError(
        "CORRUPTED_ROUTING_ORDINAL_SEQUENCE",
        {
          relation: "logical_match_slots",
          logicalMatchId: row.logicalMatchId,
          expected: expectedSlot,
          actual: row.slot,
        },
      );
    }
    values.push(row.slot);
    slotsByMatch.set(row.logicalMatchId, values);
  }
  const selectionGroupSizesByRoute = new Map<number, number[]>();
  for (const row of selectionGroupSizeRows) {
    if (!routeById.has(row.routeId)) {
      unexpectedChild("selection_group_size", {
        routeId: row.routeId,
        reason: "unknown_route",
      });
    }
    const values = selectionGroupSizesByRoute.get(row.routeId) ?? [];
    if (row.position !== values.length) {
      throw new RoutingPlanPersistenceError(
        "CORRUPTED_ROUTING_ORDINAL_SEQUENCE",
        {
          relation: "selection_group_sizes",
          routeId: row.routeId,
          expected: values.length,
          actual: row.position,
        },
      );
    }
    values.push(row.exactGroupSize);
    selectionGroupSizesByRoute.set(row.routeId, values);
  }

  function stageForEntry(entryId: number | null): {
    entry: (typeof entryRows)[number];
    stage: (typeof stageRows)[number];
  } {
    const entry = requireValue(entryId == null ? null : entryById.get(entryId), {
      relation: "entry_point",
      entryId,
    });
    const stage = requireValue(stageById.get(entry.routingStageId), {
      relation: "entry_stage",
      entryId,
    });
    return { entry, stage };
  }

  function stageForMatch(matchId: number | null): {
    match: (typeof logicalMatchRows)[number];
    stage: (typeof stageRows)[number];
  } {
    const match = requireValue(matchId == null ? null : matchById.get(matchId), {
      relation: "logical_match",
      matchId,
    });
    const stage = requireValue(stageById.get(match.routingStageId), {
      relation: "logical_match_stage",
      matchId,
    });
    return { match, stage };
  }

  function selectionForRoute(routeId: number): unknown {
    const row = requireValue(selectionByRoute.get(routeId), {
      relation: "route_selection",
      routeId,
    });
    const source = requireValue(sourceByRoute.get(routeId), {
      relation: "route_source",
      routeId,
    });
    if (
      source.sourceType !== "registration_bucket" &&
      source.sourceType !== "stage_result"
    ) {
      unexpectedChild("route_selection", {
        routeId,
        sourceType: source.sourceType,
      });
    }
    const expectedStageId =
      source.sourceType === "stage_result" ? source.routingStageId : null;
    if (row.routingStageId !== expectedStageId) {
      throw new RoutingPlanPersistenceError(
        row.selectionType === "named_output"
          ? "NAMED_OUTPUT_STAGE_MISMATCH"
          : "UNEXPECTED_ROUTING_CHILD_ROW",
        {
          routeId,
          selectionStageId: row.routingStageId,
          sourceStageId: expectedStageId,
        },
      );
    }
    const persistedGroupSizes =
      selectionGroupSizesByRoute.get(routeId) ?? [];
    const exactCardinality = row.exactCardinality;
    switch (row.selectionType) {
      case "all":
        if (persistedGroupSizes.length !== 0) {
          unexpectedChild("selection_group_size", {
            routeId,
            selectionType: row.selectionType,
          });
        }
        return { type: "all", exactCardinality };
      case "top_n":
        if (persistedGroupSizes.length !== 0) {
          unexpectedChild("selection_group_size", {
            routeId,
            selectionType: row.selectionType,
          });
        }
        return {
          type: "top_n",
          count: requireValue(row.count, { routeId, field: "count" }),
          exactCardinality,
        };
      case "rank_range":
        if (persistedGroupSizes.length !== 0) {
          unexpectedChild("selection_group_size", {
            routeId,
            selectionType: row.selectionType,
          });
        }
        return {
          type: "rank_range",
          from: requireValue(row.rangeFrom, { routeId, field: "range_from" }),
          to: requireValue(row.rangeTo, { routeId, field: "range_to" }),
          exactCardinality,
        };
      case "top_n_per_group":
        if (
          row.groupCount == null ||
          persistedGroupSizes.length !== row.groupCount
        ) {
          unexpectedChild("selection_group_size", {
            routeId,
            selectionType: row.selectionType,
            expected: row.groupCount,
            actual: persistedGroupSizes.length,
          });
        }
        return {
          type: "top_n_per_group",
          countPerGroup: requireValue(row.countPerGroup, {
            routeId,
            field: "count_per_group",
          }),
          groupCount: requireValue(row.groupCount, {
            routeId,
            field: "group_count",
          }),
          exactGroupSizes: persistedGroupSizes,
          exactCardinality,
        };
      case "named_output": {
        const output = requireValue(
          row.namedOutputId == null
            ? null
            : outputById.get(row.namedOutputId),
          { routeId, relation: "named_output" },
        );
        if (
          row.routingStageId == null ||
          source.routingStageId !== row.routingStageId ||
          output.routingStageId !== row.routingStageId
        ) {
          throw new RoutingPlanPersistenceError(
            "NAMED_OUTPUT_STAGE_MISMATCH",
            {
              routeId,
              selectionStageId: row.routingStageId,
              sourceStageId: source.routingStageId,
              outputStageId: output.routingStageId,
            },
          );
        }
        if (persistedGroupSizes.length !== 0) {
          unexpectedChild("selection_group_size", {
            routeId,
            selectionType: row.selectionType,
          });
        }
        return {
          type: "named_output",
          outputKey: output.outputKey,
          exactCardinality,
        };
      }
      case "best_not_selected":
        if (persistedGroupSizes.length !== 0) {
          unexpectedChild("selection_group_size", {
            routeId,
            selectionType: row.selectionType,
          });
        }
        return {
          type: "best_not_selected",
          count: requireValue(row.count, { routeId, field: "count" }),
          exactCardinality,
        };
      default:
        return unknownDiscriminant("selection_type", row.selectionType);
    }
  }

  function sourceForRoute(routeId: number): unknown {
    const row = requireValue(sourceByRoute.get(routeId), {
      relation: "route_source",
      routeId,
    });
    switch (row.sourceType) {
      case "registration_bucket": {
        const bucket = requireValue(
          row.bucketId == null ? null : bucketById.get(row.bucketId),
          { routeId, relation: "source_bucket" },
        );
        return {
          type: "registration_bucket",
          bucketKey: bucket.bucketKey,
          selection: selectionForRoute(routeId),
        };
      }
      case "stage_result": {
        const stage = requireValue(
          row.routingStageId == null
            ? null
            : stageById.get(row.routingStageId),
          { routeId, relation: "source_stage" },
        );
        return {
          type: "stage_result",
          stageKey: stage.stageKey,
          selection: selectionForRoute(routeId),
        };
      }
      case "stage_entry": {
        if (selectionByRoute.has(routeId)) {
          unexpectedChild("route_selection", {
            routeId,
            sourceType: row.sourceType,
          });
        }
        const { entry, stage } = stageForEntry(row.entryPointId);
        return {
          type: "stage_entry",
          stageKey: stage.stageKey,
          entryKey: entry.entryKey,
          position: requireValue(row.entryPosition, {
            routeId,
            field: "entry_position",
          }),
        };
      }
      case "match_outcome": {
        if (selectionByRoute.has(routeId)) {
          unexpectedChild("route_selection", {
            routeId,
            sourceType: row.sourceType,
          });
        }
        const { match, stage } = stageForMatch(row.logicalMatchId);
        if (row.matchOutcome !== "winner" && row.matchOutcome !== "loser") {
          return unknownDiscriminant(
            "match_outcome",
            row.matchOutcome ?? "null",
          );
        }
        return {
          type: "match_outcome",
          stageKey: stage.stageKey,
          matchKey: match.matchKey,
          outcome: row.matchOutcome,
        };
      }
      default:
        return unknownDiscriminant("source_type", row.sourceType);
    }
  }

  function targetForRoute(routeId: number): unknown {
    const row = requireValue(targetByRoute.get(routeId), {
      relation: "route_target",
      routeId,
    });
    switch (row.targetType) {
      case "stage_entry": {
        const { entry, stage } = stageForEntry(row.entryPointId);
        return {
          type: "stage_entry",
          stageKey: stage.stageKey,
          entryKey: entry.entryKey,
        };
      }
      case "match_slot": {
        const { match, stage } = stageForMatch(row.logicalMatchId);
        const slot = requireValue(row.matchSlot, {
          routeId,
          field: "match_slot",
        });
        if (!(slotsByMatch.get(match.id) ?? []).includes(slot)) {
          throw new RoutingPlanPersistenceError(
            "MISSING_LOGICAL_MATCH_SLOT",
            {
              routeId,
              logicalMatchId: match.id,
              slot,
            },
          );
        }
        return {
          type: "match_slot",
          stageKey: stage.stageKey,
          matchKey: match.matchKey,
          slot,
        };
      }
      case "stage_output": {
        const output = requireValue(
          row.outputId == null ? null : outputById.get(row.outputId),
          { routeId, relation: "target_output" },
        );
        const stage = requireValue(stageById.get(output.routingStageId), {
          routeId,
          relation: "target_output_stage",
        });
        return {
          type: "stage_output",
          stageKey: stage.stageKey,
          outputKey: output.outputKey,
        };
      }
      default:
        return unknownDiscriminant("target_type", row.targetType);
    }
  }

  function lineageForCondition(
    routeId: number,
    row: (typeof conditionRows)[number],
  ): unknown {
    switch (row.lineageType) {
      case "stage_entry": {
        const { entry, stage } = stageForEntry(row.lineageEntryPointId);
        return {
          type: "stage_entry",
          stageKey: stage.stageKey,
          entryKey: entry.entryKey,
        };
      }
      case "route": {
        const lineageRoute = requireValue(
          row.lineageRouteId == null
            ? null
            : routeById.get(row.lineageRouteId),
          { routeId, relation: "condition_lineage_route" },
        );
        return { type: "route", routeKey: lineageRoute.routeKey };
      }
      default:
        return unknownDiscriminant(
          "lineage_type",
          row.lineageType ?? "null",
        );
    }
  }

  function conditionForRoute(routeId: number): unknown {
    const row = requireValue(conditionByRoute.get(routeId), {
      relation: "route_condition",
      routeId,
    });
    switch (row.conditionType) {
      case "always":
        return { type: "always" };
      case "participant_lineage":
        return {
          type: "participant_lineage",
          lineage: lineageForCondition(routeId, row),
        };
      case "match_winner_lineage": {
        const match = requireValue(
          row.logicalMatchId == null
            ? null
            : matchById.get(row.logicalMatchId),
          { routeId, relation: "condition_match" },
        );
        return {
          type: "match_winner_lineage",
          matchKey: match.matchKey,
          lineage: lineageForCondition(routeId, row),
        };
      }
      default:
        return unknownDiscriminant("condition_type", row.conditionType);
    }
  }

  const relational: unknown = {
    compiledPlanVersion: root.compiledPlanVersion,
    blueprintModelVersion: root.blueprintModelVersion,
    registrationBuckets: bucketRows.map((row) => ({
      bucketKey: row.bucketKey,
      name: row.name,
      exactCapacity: row.exactCapacity,
      priority: row.priority,
    })),
    stages: stageRows.map((row) => {
      const base = {
        stageKey: row.stageKey,
        name: row.name,
        displayOrder: row.displayOrder,
        exactParticipantCapacity: row.exactParticipantCapacity,
        formatId: row.formatId,
        formatRulesVersion: row.formatRulesVersion,
      };
      switch (row.selectionCapabilityType) {
        case "none":
          if ((groupSizesByStage.get(row.id) ?? []).length !== 0) {
            unexpectedChild("stage_group_size", {
              routingStageId: row.id,
              selectionCapabilityType: row.selectionCapabilityType,
            });
          }
          return {
            ...base,
            selectionCapabilities: { type: "none" },
          };
        case "groups":
          if (
            row.exactGroupCount == null ||
            (groupSizesByStage.get(row.id) ?? []).length !==
              row.exactGroupCount
          ) {
            unexpectedChild("stage_group_size", {
              routingStageId: row.id,
              selectionCapabilityType: row.selectionCapabilityType,
              expected: row.exactGroupCount,
              actual: (groupSizesByStage.get(row.id) ?? []).length,
            });
          }
          return {
            ...base,
            selectionCapabilities: {
              type: "groups",
              exactGroupCount: requireValue(row.exactGroupCount, {
                stageId: row.id,
                field: "exact_group_count",
              }),
              exactGroupSizes: groupSizesByStage.get(row.id) ?? [],
              maximumQualifiersPerGroup: requireValue(
                row.maximumQualifiersPerGroup,
                {
                  stageId: row.id,
                  field: "maximum_qualifiers_per_group",
                },
              ),
            },
          };
        default:
          return unknownDiscriminant(
            "selection_capability_type",
            row.selectionCapabilityType,
          );
      }
    }),
    entryPoints: entryRows.map((row) => {
      const stage = requireValue(stageById.get(row.routingStageId), {
        relation: "entry_stage",
        entryId: row.id,
      });
      return {
        stageKey: stage.stageKey,
        entryKey: row.entryKey,
        ...(row.name == null ? {} : { name: row.name }),
        exactCapacity: row.exactCapacity,
        priority: row.priority,
        completeness: { type: row.completenessType },
      };
    }),
    logicalMatches: logicalMatchRows.map((row) => {
      const stage = requireValue(stageById.get(row.routingStageId), {
        relation: "logical_match_stage",
        matchId: row.id,
      });
      const slots = slotsByMatch.get(row.id) ?? [];
      if (slots.length !== 2 || slots[0] !== 1 || slots[1] !== 2) {
        throw new RoutingPlanPersistenceError(
          "MISSING_LOGICAL_MATCH_SLOT",
          {
            logicalMatchId: row.id,
            slots,
          },
        );
      }
      return {
        matchKey: row.matchKey,
        stageKey: stage.stageKey,
        ...(row.name == null ? {} : { name: row.name }),
        order: row.matchOrder,
        slots,
      };
    }),
    outputs: outputRows.map((row) => {
      const stage = requireValue(stageById.get(row.routingStageId), {
        relation: "output_stage",
        outputId: row.id,
      });
      return {
        stageKey: stage.stageKey,
        outputKey: row.outputKey,
        ...(row.name == null ? {} : { name: row.name }),
        exactCapacity: row.exactCapacity,
        priority: row.priority,
      };
    }),
    routes: routeRows.map((row) => ({
      routeKey: row.routeKey,
      source: sourceForRoute(row.id),
      target: targetForRoute(row.id),
      reservedSlots: row.reservedSlots,
      priority: row.priority,
      order: row.routeOrder,
      condition: conditionForRoute(row.id),
    })),
    dependencies: dependencyRows.map((row) => {
      const route = requireValue(routeById.get(row.routeId), {
        relation: "dependency_route",
        routeId: row.routeId,
      });
      return {
        routeKey: route.routeKey,
        sourceNodeKey: row.sourceNodeKey,
        targetNodeKey: row.targetNodeKey,
      };
    }),
  };

  if (
    routeRows.length !== sourceRows.length ||
    routeRows.length !== targetRows.length ||
    routeRows.length !== conditionRows.length ||
    routeRows.length !== dependencyRows.length
  ) {
    throw new RoutingPlanPersistenceError("CORRUPTED_ROUTING_GRAPH", {
      relation: "route_components",
    });
  }
  for (const [routeId] of selectionByRoute) {
    if (!routeById.has(routeId)) {
      unexpectedChild("route_selection", {
        routeId,
        reason: "unknown_route",
      });
    }
  }
  for (const [routeId] of sourceByRoute) {
    if (!routeById.has(routeId)) {
      unexpectedChild("route_source", {
        routeId,
        reason: "unknown_route",
      });
    }
  }
  for (const [routeId] of targetByRoute) {
    if (!routeById.has(routeId)) {
      unexpectedChild("route_target", {
        routeId,
        reason: "unknown_route",
      });
    }
  }
  for (const [routeId] of conditionByRoute) {
    if (!routeById.has(routeId)) {
      unexpectedChild("route_condition", {
        routeId,
        reason: "unknown_route",
      });
    }
  }
  for (const [routeId] of dependencyByRoute) {
    if (!routeById.has(routeId)) {
      unexpectedChild("route_dependency", {
        routeId,
        reason: "unknown_route",
      });
    }
  }
  for (const route of routeRows) {
    if (!dependencyByRoute.has(route.id)) {
      throw new RoutingPlanPersistenceError("CORRUPTED_ROUTING_GRAPH", {
        relation: "dependency",
        routeId: route.id,
      });
    }
  }

  const validation = validateCompiledTournamentRoutingPlanV2(relational);
  if (!validation.valid) {
    throw new RoutingPlanPersistenceError("CORRUPTED_ROUTING_GRAPH", {
      problems: validation.problems,
    });
  }
  const relationalPayload = canonicalStringifyV2(validation.value);

  let payloadValue: unknown;
  try {
    payloadValue = JSON.parse(root.canonicalPayload) as unknown;
  } catch {
    throw new RoutingPlanPersistenceError("ROUTING_PLAN_PAYLOAD_MISMATCH", {
      reason: "invalid_json",
    });
  }
  const payloadValidation =
    validateCompiledTournamentRoutingPlanV2(payloadValue);
  if (!payloadValidation.valid) {
    throw new RoutingPlanPersistenceError("ROUTING_PLAN_PAYLOAD_MISMATCH", {
      reason: "invalid_payload",
      problems: payloadValidation.problems,
    });
  }
  const normalizedStoredPayload = canonicalStringifyV2(
    payloadValidation.value,
  );
  if (sha256Hex(root.canonicalPayload) !== root.checksum) {
    throw new RoutingPlanPersistenceError(
      "ROUTING_PLAN_CHECKSUM_MISMATCH",
    );
  }
  if (
    normalizedStoredPayload !== root.canonicalPayload ||
    relationalPayload !== root.canonicalPayload
  ) {
    throw new RoutingPlanPersistenceError(
      "ROUTING_PLAN_PAYLOAD_MISMATCH",
    );
  }

  return {
    planId: root.id,
    tournamentId: root.tournamentId,
    revision: root.revision,
    checksum: root.checksum,
    canonicalPayload: root.canonicalPayload,
    sourceKind: root.sourceKind,
    createdAt: root.createdAt,
    sealedAt: root.sealedAt,
    plan: validation.value,
  };
}

export async function loadCompiledRoutingPlanV2(
  lookup: PlanLookup,
): Promise<LoadedCompiledRoutingPlan> {
  return db.transaction((tx) => loadRelationalPlan(tx, lookup));
}

export async function saveCompiledRoutingPlanV2(
  input: SaveCompiledRoutingPlanInput,
): Promise<SavedCompiledRoutingPlan> {
  const validation = validateCompiledTournamentRoutingPlanV2(input.plan);
  if (!validation.valid) {
    throw new RoutingPlanPersistenceError(
      invalidPlanCode(validation.problems),
      { problems: validation.problems },
    );
  }
  const plan = validation.value;
  assertSupportedVersions(
    plan.compiledPlanVersion,
    plan.blueprintModelVersion,
  );
  const revision = input.revision ?? 1;
  if (!Number.isInteger(revision) || revision <= 0) {
    throw new RoutingPlanPersistenceError(
      "INVALID_COMPILED_ROUTING_PLAN",
      { field: "revision" },
    );
  }
  const sourceKind = input.sourceKind?.trim() || "compiled";
  const canonicalPayload = canonicalStringifyV2(plan);
  const checksum = sha256Hex(canonicalPayload);
  const suppliedMapping = new Map(mappingEntries(input.stageIdsByKey));
  if (
    suppliedMapping.size !== plan.stages.length ||
    plan.stages.some(
      (stage) =>
        !suppliedMapping.has(stage.stageKey) ||
        !Number.isInteger(suppliedMapping.get(stage.stageKey)),
    )
  ) {
    throw new RoutingPlanPersistenceError("INCOMPLETE_STAGE_MAPPING");
  }
  if (new Set(suppliedMapping.values()).size !== suppliedMapping.size) {
    throw new RoutingPlanPersistenceError(
      "ROUTING_PLAN_DUPLICATE_STAGE_MAPPING",
    );
  }

  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId))
      .for("update");
    if (!tournament) {
      throw new RoutingPlanPersistenceError("FOREIGN_STAGE_MAPPING", {
        reason: "tournament_not_found",
      });
    }
    const persistedStages = await tx
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, input.tournamentId))
      .orderBy(asc(tournamentStagesTable.id))
      .for("update");
    const persistedStageById = new Map(
      persistedStages.map((stage) => [stage.id, stage]),
    );
    if (
      tournament.status !== "draft" ||
      tournament.activeStageId != null ||
      persistedStages.some((stage) => stage.status !== "planned")
    ) {
      throw new RoutingPlanPersistenceError(
        "ROUTING_PLAN_PERSISTENCE_NOT_ALLOWED",
      );
    }

    const lockedMatches = await tx
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.tournamentId, input.tournamentId))
      .orderBy(asc(matchesTable.id))
      .for("update");
    const lockedResults = await tx
      .select({ id: resultHistoryTable.id })
      .from(resultHistoryTable)
      .where(eq(resultHistoryTable.tournamentId, input.tournamentId))
      .orderBy(asc(resultHistoryTable.id))
      .for("update");
    if (lockedMatches.length > 0 || lockedResults.length > 0) {
      throw new RoutingPlanPersistenceError(
        "ROUTING_PLAN_PERSISTENCE_NOT_ALLOWED",
      );
    }

    const existingPlans = await tx
      .select()
      .from(tournamentRoutingPlansTable)
      .where(eq(tournamentRoutingPlansTable.tournamentId, input.tournamentId))
      .orderBy(asc(tournamentRoutingPlansTable.revision))
      .for("update");
    const existing = existingPlans.find(
      (candidate) => candidate.revision === revision,
    );
    if (existing) {
      if (
        existing.checksum !== checksum ||
        existing.canonicalPayload !== canonicalPayload
      ) {
        throw new RoutingPlanPersistenceError(
          "ROUTING_PLAN_VERSION_CONFLICT",
        );
      }
      const loaded = await loadRelationalPlan(tx, { planId: existing.id });
      return { ...loaded, applied: false };
    }

    const stageRows = plan.stages.map((stage) => {
      const stageId = requireValue(suppliedMapping.get(stage.stageKey), {
        stageKey: stage.stageKey,
      });
      const persisted = persistedStageById.get(stageId);
      if (!persisted || persisted.tournamentId !== input.tournamentId) {
        throw new RoutingPlanPersistenceError("FOREIGN_STAGE_MAPPING", {
          stageKey: stage.stageKey,
          stageId,
        });
      }
      if (persisted.participantCount !== stage.exactParticipantCapacity) {
        throw new RoutingPlanPersistenceError(
          "STAGE_CAPACITY_MISMATCH",
          {
            stageKey: stage.stageKey,
            compiled: stage.exactParticipantCapacity,
            persisted: persisted.participantCount,
          },
        );
      }
      if (
        ![
          "swiss",
          "round_robin",
          "group_stage",
          "single_elimination",
        ].includes(stage.formatId) ||
        persisted.format !== stage.formatId
      ) {
        throw new RoutingPlanPersistenceError(
          "ROUTING_PLAN_STAGE_FORMAT_MISMATCH",
          {
            stageKey: stage.stageKey,
            compiled: stage.formatId,
            persisted: persisted.format,
          },
        );
      }
      return { stage, stageId };
    });

    const [root] = await tx
      .insert(tournamentRoutingPlansTable)
      .values({
        tournamentId: input.tournamentId,
        revision,
        compiledPlanVersion: plan.compiledPlanVersion,
        blueprintModelVersion: plan.blueprintModelVersion,
        checksum,
        canonicalPayload,
        status: "sealed",
        sourceKind,
      })
      .returning();
    await input.testHooks?.afterPlanWritten?.();

    const bucketRows =
      plan.registrationBuckets.length === 0
        ? []
        : await tx
            .insert(tournamentRoutingBucketsTable)
            .values(
              plan.registrationBuckets.map((bucket, ordinal) => ({
                planId: root.id,
                ordinal,
                bucketKey: bucket.bucketKey,
                name: bucket.name,
                exactCapacity: bucket.exactCapacity,
                priority: bucket.priority,
              })),
            )
            .returning();
    const bucketIdByKey = new Map(
      bucketRows.map((row) => [row.bucketKey, row.id]),
    );

    const insertedStages = await tx
      .insert(tournamentRoutingStagesTable)
      .values(
        stageRows.map(({ stage, stageId }, ordinal) => ({
          planId: root.id,
          tournamentId: input.tournamentId,
          stageId,
          ordinal,
          stageKey: stage.stageKey,
          name: stage.name,
          displayOrder: stage.displayOrder,
          exactParticipantCapacity: stage.exactParticipantCapacity,
          selectionCapabilityType: stage.selectionCapabilities.type,
          exactGroupCount:
            stage.selectionCapabilities.type === "groups"
              ? stage.selectionCapabilities.exactGroupCount
              : null,
          maximumQualifiersPerGroup:
            stage.selectionCapabilities.type === "groups"
              ? stage.selectionCapabilities.maximumQualifiersPerGroup
              : null,
          formatId: stage.formatId,
          formatRulesVersion: stage.formatRulesVersion,
        })),
      )
      .returning();
    const routingStageIdByKey = new Map(
      insertedStages.map((row) => [row.stageKey, row.id]),
    );
    const stageGroupSizes = plan.stages.flatMap((stage) =>
      stage.selectionCapabilities.type === "groups"
        ? stage.selectionCapabilities.exactGroupSizes.map(
            (exactGroupSize, position) => ({
              planId: root.id,
              routingStageId: requireValue(
                routingStageIdByKey.get(stage.stageKey),
                { stageKey: stage.stageKey },
              ),
              position,
              exactGroupSize,
            }),
          )
        : [],
    );
    if (stageGroupSizes.length > 0) {
      await tx
        .insert(tournamentRoutingStageGroupSizesTable)
        .values(stageGroupSizes);
    }

    const insertedEntries =
      plan.entryPoints.length === 0
        ? []
        : await tx
            .insert(tournamentRoutingEntryPointsTable)
            .values(
              plan.entryPoints.map((entry, ordinal) => ({
                planId: root.id,
                routingStageId: requireValue(
                  routingStageIdByKey.get(entry.stageKey),
                  { stageKey: entry.stageKey },
                ),
                ordinal,
                entryKey: entry.entryKey,
                name: entry.name ?? null,
                exactCapacity: entry.exactCapacity,
                priority: entry.priority,
                completenessType: entry.completeness.type,
              })),
            )
            .returning();
    const entryIdByKey = new Map(
      insertedEntries.map((row) => [
        pairKey(
          requireValue(
            insertedStages.find(
              (stage) => stage.id === row.routingStageId,
            )?.stageKey,
            { entryId: row.id },
          ),
          row.entryKey,
        ),
        row.id,
      ]),
    );

    const insertedMatches =
      plan.logicalMatches.length === 0
        ? []
        : await tx
            .insert(tournamentRoutingLogicalMatchesTable)
            .values(
              plan.logicalMatches.map((match, ordinal) => ({
                planId: root.id,
                routingStageId: requireValue(
                  routingStageIdByKey.get(match.stageKey),
                  { stageKey: match.stageKey },
                ),
                ordinal,
                matchKey: match.matchKey,
                name: match.name ?? null,
                matchOrder: match.order,
              })),
            )
            .returning();
    const logicalMatchIdByKey = new Map(
      insertedMatches.map((row) => [row.matchKey, row.id]),
    );
    if (insertedMatches.length > 0) {
      await tx.insert(tournamentRoutingLogicalMatchSlotsTable).values(
        insertedMatches.flatMap((match) => [
          {
            planId: root.id,
            routingStageId: match.routingStageId,
            logicalMatchId: match.id,
            slot: 1,
          },
          {
            planId: root.id,
            routingStageId: match.routingStageId,
            logicalMatchId: match.id,
            slot: 2,
          },
        ]),
      );
    }

    const insertedOutputs =
      plan.outputs.length === 0
        ? []
        : await tx
            .insert(tournamentRoutingOutputsTable)
            .values(
              plan.outputs.map((output, ordinal) => ({
                planId: root.id,
                routingStageId: requireValue(
                  routingStageIdByKey.get(output.stageKey),
                  { stageKey: output.stageKey },
                ),
                ordinal,
                outputKey: output.outputKey,
                name: output.name ?? null,
                exactCapacity: output.exactCapacity,
                priority: output.priority,
              })),
            )
            .returning();
    const outputIdByKey = new Map(
      insertedOutputs.map((row) => [
        pairKey(
          requireValue(
            insertedStages.find(
              (stage) => stage.id === row.routingStageId,
            )?.stageKey,
            { outputId: row.id },
          ),
          row.outputKey,
        ),
        row.id,
      ]),
    );

    const insertedRoutes = await tx
      .insert(tournamentRoutingRoutesTable)
      .values(
        plan.routes.map((route, ordinal) => ({
          planId: root.id,
          ordinal,
          routeKey: route.routeKey,
          reservedSlots: route.reservedSlots,
          priority: route.priority,
          routeOrder: route.order,
        })),
      )
      .returning();
    const routeIdByKey = new Map(
      insertedRoutes.map((row) => [row.routeKey, row.id]),
    );

    await tx.insert(tournamentRoutingRouteSourcesTable).values(
      plan.routes.map((route) => {
        const routeId = requireValue(routeIdByKey.get(route.routeKey), {
          routeKey: route.routeKey,
        });
        const base = {
          routeId,
          planId: root.id,
          sourceType: route.source.type,
          bucketId: null,
          routingStageId: null,
          entryPointId: null,
          logicalMatchId: null,
          entryPosition: null,
          matchOutcome: null,
        };
        switch (route.source.type) {
          case "registration_bucket":
            return {
              ...base,
              bucketId: requireValue(
                bucketIdByKey.get(route.source.bucketKey),
                { routeKey: route.routeKey },
              ),
            };
          case "stage_result":
            return {
              ...base,
              routingStageId: requireValue(
                routingStageIdByKey.get(route.source.stageKey),
                { routeKey: route.routeKey },
              ),
            };
          case "stage_entry":
            return {
              ...base,
              routingStageId: requireValue(
                routingStageIdByKey.get(route.source.stageKey),
                { routeKey: route.routeKey },
              ),
              entryPointId: requireValue(
                entryIdByKey.get(
                  pairKey(route.source.stageKey, route.source.entryKey),
                ),
                { routeKey: route.routeKey },
              ),
              entryPosition: route.source.position,
            };
          case "match_outcome":
            return {
              ...base,
              routingStageId: requireValue(
                routingStageIdByKey.get(route.source.stageKey),
                { routeKey: route.routeKey },
              ),
              logicalMatchId: requireValue(
                logicalMatchIdByKey.get(route.source.matchKey),
                { routeKey: route.routeKey },
              ),
              matchOutcome: route.source.outcome,
            };
        }
      }),
    );

    const selections = plan.routes.flatMap((route) => {
      if (
        route.source.type !== "registration_bucket" &&
        route.source.type !== "stage_result"
      ) {
        return [];
      }
      const selection = route.source.selection;
      const routeId = requireValue(routeIdByKey.get(route.routeKey), {
        routeKey: route.routeKey,
      });
      const stageKey =
        route.source.type === "stage_result"
          ? route.source.stageKey
          : null;
      const routingStageId =
        stageKey == null
          ? null
          : requireValue(routingStageIdByKey.get(stageKey), {
              routeKey: route.routeKey,
              stageKey,
            });
      const namedOutputId =
        selection.type === "named_output" && stageKey != null
          ? requireValue(
              outputIdByKey.get(pairKey(stageKey, selection.outputKey)),
              { routeKey: route.routeKey, outputKey: selection.outputKey },
            )
          : null;
      return [
        {
          row: selectionInsert(
            selection,
            root.id,
            routeId,
            routingStageId,
            namedOutputId,
          ),
          groupSizes:
            selection.type === "top_n_per_group"
              ? selection.exactGroupSizes
              : [],
        },
      ];
    });
    if (selections.length > 0) {
      await tx
        .insert(tournamentRoutingSelectionsTable)
        .values(selections.map((selection) => selection.row));
      const groupSizeRows = selections.flatMap((selection) =>
        selection.groupSizes.map((exactGroupSize, position) => ({
          planId: root.id,
          routeId: selection.row.routeId,
          position,
          exactGroupSize,
        })),
      );
      if (groupSizeRows.length > 0) {
        await tx
          .insert(tournamentRoutingSelectionGroupSizesTable)
          .values(groupSizeRows);
      }
    }

    await tx.insert(tournamentRoutingRouteTargetsTable).values(
      plan.routes.map((route) => {
        const routeId = requireValue(routeIdByKey.get(route.routeKey), {
          routeKey: route.routeKey,
        });
        const base = {
          routeId,
          planId: root.id,
          targetType: route.target.type,
          routingStageId: null,
          entryPointId: null,
          logicalMatchId: null,
          outputId: null,
          matchSlot: null,
        };
        switch (route.target.type) {
          case "stage_entry":
            return {
              ...base,
              routingStageId: requireValue(
                routingStageIdByKey.get(route.target.stageKey),
                { routeKey: route.routeKey },
              ),
              entryPointId: requireValue(
                entryIdByKey.get(
                  pairKey(route.target.stageKey, route.target.entryKey),
                ),
                { routeKey: route.routeKey },
              ),
            };
          case "match_slot":
            return {
              ...base,
              routingStageId: requireValue(
                routingStageIdByKey.get(route.target.stageKey),
                { routeKey: route.routeKey },
              ),
              logicalMatchId: requireValue(
                logicalMatchIdByKey.get(route.target.matchKey),
                { routeKey: route.routeKey },
              ),
              matchSlot: route.target.slot,
            };
          case "stage_output":
            return {
              ...base,
              routingStageId: requireValue(
                routingStageIdByKey.get(route.target.stageKey),
                { routeKey: route.routeKey },
              ),
              outputId: requireValue(
                outputIdByKey.get(
                  pairKey(route.target.stageKey, route.target.outputKey),
                ),
                { routeKey: route.routeKey },
              ),
            };
        }
      }),
    );

    await tx.insert(tournamentRoutingRouteConditionsTable).values(
      plan.routes.map((route) => {
        const routeId = requireValue(routeIdByKey.get(route.routeKey), {
          routeKey: route.routeKey,
        });
        const base = {
          routeId,
          planId: root.id,
          conditionType: route.condition.type,
          lineageType: null,
          lineageEntryPointId: null,
          lineageRouteId: null,
          logicalMatchId: null,
        };
        if (route.condition.type === "always") return base;
        const lineage = route.condition.lineage;
        const lineageValues =
          lineage.type === "stage_entry"
            ? {
                lineageType: lineage.type,
                lineageEntryPointId: requireValue(
                  entryIdByKey.get(
                    pairKey(lineage.stageKey, lineage.entryKey),
                  ),
                  { routeKey: route.routeKey },
                ),
                lineageRouteId: null,
              }
            : {
                lineageType: lineage.type,
                lineageEntryPointId: null,
                lineageRouteId: requireValue(
                  routeIdByKey.get(lineage.routeKey),
                  { routeKey: route.routeKey },
                ),
              };
        return {
          ...base,
          ...lineageValues,
          logicalMatchId:
            route.condition.type === "match_winner_lineage"
              ? requireValue(
                  logicalMatchIdByKey.get(route.condition.matchKey),
                  { routeKey: route.routeKey },
                )
              : null,
        };
      }),
    );

    await tx.insert(tournamentRoutingDependenciesTable).values(
      plan.dependencies.map((dependency, ordinal) => ({
        planId: root.id,
        routeId: requireValue(routeIdByKey.get(dependency.routeKey), {
          routeKey: dependency.routeKey,
        }),
        ordinal,
        sourceNodeKey: dependency.sourceNodeKey,
        targetNodeKey: dependency.targetNodeKey,
      })),
    );
    await input.testHooks?.afterGraphWritten?.();

    const loaded = await loadRelationalPlan(tx, { planId: root.id });
    if (
      loaded.checksum !== checksum ||
      loaded.canonicalPayload !== canonicalPayload
    ) {
      throw new RoutingPlanPersistenceError(
        "ROUTING_PLAN_PAYLOAD_MISMATCH",
      );
    }
    return { ...loaded, applied: true };
  });
}
