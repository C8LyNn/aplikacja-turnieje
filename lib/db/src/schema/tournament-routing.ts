import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// Drizzle declares every graph-internal FK and its NO ACTION semantics below.
// Migration 0012 additionally owns DEFERRABLE INITIALLY DEFERRED because the
// current Drizzle FK builder cannot express that PostgreSQL attribute. This
// lets a plan deletion cascade all direct children while a direct deletion of
// a referenced slot or node remains blocked at transaction commit.
import {
  tournamentStagesTable,
  tournamentsTable,
} from "./tournaments";

export const tournamentRoutingPlansTable = pgTable(
  "tournament_routing_plans",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    compiledPlanVersion: integer("compiled_plan_version").notNull(),
    blueprintModelVersion: integer("blueprint_model_version").notNull(),
    checksum: text("checksum").notNull(),
    canonicalPayload: text("canonical_payload").notNull(),
    status: text("status").notNull().default("sealed"),
    sourceKind: text("source_kind").notNull().default("compiled"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sealedAt: timestamp("sealed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("tournament_routing_plans_tournament_revision_unique").on(
      table.tournamentId,
      table.revision,
    ),
    unique("tournament_routing_plans_id_tournament_unique").on(
      table.id,
      table.tournamentId,
    ),
    check("tournament_routing_plans_revision_positive", sql`${table.revision} > 0`),
    check(
      "tournament_routing_plans_model_versions_positive",
      sql`${table.compiledPlanVersion} > 0 AND ${table.blueprintModelVersion} > 0`,
    ),
    check(
      "tournament_routing_plans_checksum_sha256",
      sql`${table.checksum} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "tournament_routing_plans_status_supported",
      sql`${table.status} = 'sealed'`,
    ),
    check(
      "tournament_routing_plans_source_kind_nonempty",
      sql`length(trim(${table.sourceKind})) > 0`,
    ),
  ],
);

export const tournamentRoutingBucketsTable = pgTable(
  "tournament_routing_buckets",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => tournamentRoutingPlansTable.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    bucketKey: text("bucket_key").notNull(),
    name: text("name").notNull(),
    exactCapacity: integer("exact_capacity").notNull(),
    priority: integer("priority").notNull(),
  },
  (table) => [
    unique("tournament_routing_buckets_plan_key_unique").on(
      table.planId,
      table.bucketKey,
    ),
    unique("tournament_routing_buckets_plan_ordinal_unique").on(
      table.planId,
      table.ordinal,
    ),
    unique("tournament_routing_buckets_plan_id_unique").on(
      table.planId,
      table.id,
    ),
    check(
      "tournament_routing_buckets_values_valid",
      sql`${table.ordinal} >= 0 AND ${table.exactCapacity} > 0 AND ${table.priority} >= 0`,
    ),
  ],
);

export const tournamentRoutingStagesTable = pgTable(
  "tournament_routing_stages",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id").notNull(),
    tournamentId: integer("tournament_id").notNull(),
    stageId: integer("stage_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    stageKey: text("stage_key").notNull(),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull(),
    exactParticipantCapacity: integer("exact_participant_capacity").notNull(),
    selectionCapabilityType: text("selection_capability_type").notNull(),
    exactGroupCount: integer("exact_group_count"),
    maximumQualifiersPerGroup: integer("maximum_qualifiers_per_group"),
    formatId: text("format_id").notNull(),
    formatRulesVersion: integer("format_rules_version").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.tournamentId],
      foreignColumns: [
        tournamentRoutingPlansTable.id,
        tournamentRoutingPlansTable.tournamentId,
      ],
      name: "tournament_routing_stages_plan_tournament_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tournamentId, table.stageId],
      foreignColumns: [
        tournamentStagesTable.tournamentId,
        tournamentStagesTable.id,
      ],
      name: "tournament_routing_stages_stage_tournament_fk",
    }).onDelete("no action"),
    unique("tournament_routing_stages_plan_key_unique").on(
      table.planId,
      table.stageKey,
    ),
    unique("tournament_routing_stages_plan_stage_unique").on(
      table.planId,
      table.stageId,
    ),
    unique("tournament_routing_stages_plan_ordinal_unique").on(
      table.planId,
      table.ordinal,
    ),
    unique("tournament_routing_stages_plan_id_unique").on(
      table.planId,
      table.id,
    ),
    index("tournament_routing_stages_tournament_stage_idx").on(
      table.tournamentId,
      table.stageId,
    ),
    check(
      "tournament_routing_stages_values_valid",
      sql`${table.ordinal} >= 0
        AND ${table.displayOrder} >= 0
        AND ${table.exactParticipantCapacity} > 0
        AND ${table.formatRulesVersion} > 0`,
    ),
    check(
      "tournament_routing_stages_selection_shape",
      sql`(
          ${table.selectionCapabilityType} = 'none'
          AND ${table.exactGroupCount} IS NULL
          AND ${table.maximumQualifiersPerGroup} IS NULL
        ) OR (
          ${table.selectionCapabilityType} = 'groups'
          AND ${table.exactGroupCount} > 0
          AND ${table.maximumQualifiersPerGroup} > 0
        )`,
    ),
  ],
);

export const tournamentRoutingStageGroupSizesTable = pgTable(
  "tournament_routing_stage_group_sizes",
  {
    planId: integer("plan_id").notNull(),
    routingStageId: integer("routing_stage_id").notNull(),
    position: integer("position").notNull(),
    exactGroupSize: integer("exact_group_size").notNull(),
  },
  (table) => [
    primaryKey({
      name: "tournament_routing_stage_group_sizes_pk",
      columns: [table.routingStageId, table.position],
    }),
    foreignKey({
      columns: [table.planId, table.routingStageId],
      foreignColumns: [
        tournamentRoutingStagesTable.planId,
        tournamentRoutingStagesTable.id,
      ],
      name: "tournament_routing_stage_group_sizes_stage_fk",
    }).onDelete("cascade"),
    check(
      "tournament_routing_stage_group_sizes_values_valid",
      sql`${table.position} >= 0 AND ${table.exactGroupSize} > 0`,
    ),
  ],
);

export const tournamentRoutingEntryPointsTable = pgTable(
  "tournament_routing_entry_points",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id").notNull(),
    routingStageId: integer("routing_stage_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    entryKey: text("entry_key").notNull(),
    name: text("name"),
    exactCapacity: integer("exact_capacity").notNull(),
    priority: integer("priority").notNull(),
    completenessType: text("completeness_type").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.routingStageId],
      foreignColumns: [
        tournamentRoutingStagesTable.planId,
        tournamentRoutingStagesTable.id,
      ],
      name: "tournament_routing_entry_points_stage_fk",
    }).onDelete("cascade"),
    unique("tournament_routing_entry_points_stage_key_unique").on(
      table.routingStageId,
      table.entryKey,
    ),
    unique("tournament_routing_entry_points_plan_ordinal_unique").on(
      table.planId,
      table.ordinal,
    ),
    unique("tournament_routing_entry_points_plan_id_unique").on(
      table.planId,
      table.id,
    ),
    unique("tournament_routing_entry_points_plan_stage_id_unique").on(
      table.planId,
      table.routingStageId,
      table.id,
    ),
    check(
      "tournament_routing_entry_points_values_valid",
      sql`${table.ordinal} >= 0
        AND ${table.exactCapacity} > 0
        AND ${table.priority} >= 0
        AND ${table.completenessType} = 'exact'`,
    ),
  ],
);

export const tournamentRoutingLogicalMatchesTable = pgTable(
  "tournament_routing_logical_matches",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id").notNull(),
    routingStageId: integer("routing_stage_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    matchKey: text("match_key").notNull(),
    name: text("name"),
    matchOrder: integer("match_order").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.routingStageId],
      foreignColumns: [
        tournamentRoutingStagesTable.planId,
        tournamentRoutingStagesTable.id,
      ],
      name: "tournament_routing_logical_matches_stage_fk",
    }).onDelete("cascade"),
    unique("tournament_routing_logical_matches_plan_key_unique").on(
      table.planId,
      table.matchKey,
    ),
    unique("tournament_routing_logical_matches_plan_ordinal_unique").on(
      table.planId,
      table.ordinal,
    ),
    unique("tournament_routing_logical_matches_plan_id_unique").on(
      table.planId,
      table.id,
    ),
    unique("tournament_routing_logical_matches_plan_stage_id_unique").on(
      table.planId,
      table.routingStageId,
      table.id,
    ),
    index("tournament_routing_logical_matches_stage_idx").on(
      table.routingStageId,
    ),
    check(
      "tournament_routing_logical_matches_values_valid",
      sql`${table.ordinal} >= 0 AND ${table.matchOrder} >= 0`,
    ),
  ],
);

export const tournamentRoutingLogicalMatchSlotsTable = pgTable(
  "tournament_routing_logical_match_slots",
  {
    planId: integer("plan_id").notNull(),
    routingStageId: integer("routing_stage_id").notNull(),
    logicalMatchId: integer("logical_match_id").notNull(),
    slot: integer("slot").notNull(),
  },
  (table) => [
    primaryKey({
      name: "tournament_routing_logical_match_slots_pk",
      columns: [table.logicalMatchId, table.slot],
    }),
    foreignKey({
      columns: [table.planId, table.routingStageId, table.logicalMatchId],
      foreignColumns: [
        tournamentRoutingLogicalMatchesTable.planId,
        tournamentRoutingLogicalMatchesTable.routingStageId,
        tournamentRoutingLogicalMatchesTable.id,
      ],
      name: "tournament_routing_logical_match_slots_match_fk",
    }).onDelete("cascade"),
    unique("tournament_routing_match_slots_plan_stage_match_slot_uq").on(
      table.planId,
      table.routingStageId,
      table.logicalMatchId,
      table.slot,
    ),
    check(
      "tournament_routing_logical_match_slots_supported",
      sql`${table.slot} IN (1, 2)`,
    ),
  ],
);

export const tournamentRoutingOutputsTable = pgTable(
  "tournament_routing_outputs",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id").notNull(),
    routingStageId: integer("routing_stage_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    outputKey: text("output_key").notNull(),
    name: text("name"),
    exactCapacity: integer("exact_capacity").notNull(),
    priority: integer("priority").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.routingStageId],
      foreignColumns: [
        tournamentRoutingStagesTable.planId,
        tournamentRoutingStagesTable.id,
      ],
      name: "tournament_routing_outputs_stage_fk",
    }).onDelete("cascade"),
    unique("tournament_routing_outputs_stage_key_unique").on(
      table.routingStageId,
      table.outputKey,
    ),
    unique("tournament_routing_outputs_plan_ordinal_unique").on(
      table.planId,
      table.ordinal,
    ),
    unique("tournament_routing_outputs_plan_id_unique").on(
      table.planId,
      table.id,
    ),
    unique("tournament_routing_outputs_plan_stage_id_unique").on(
      table.planId,
      table.routingStageId,
      table.id,
    ),
    check(
      "tournament_routing_outputs_values_valid",
      sql`${table.ordinal} >= 0
        AND ${table.exactCapacity} > 0
        AND ${table.priority} >= 0`,
    ),
  ],
);

export const tournamentRoutingRoutesTable = pgTable(
  "tournament_routing_routes",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => tournamentRoutingPlansTable.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    routeKey: text("route_key").notNull(),
    reservedSlots: integer("reserved_slots").notNull(),
    priority: integer("priority").notNull(),
    routeOrder: integer("route_order").notNull(),
  },
  (table) => [
    unique("tournament_routing_routes_plan_key_unique").on(
      table.planId,
      table.routeKey,
    ),
    unique("tournament_routing_routes_plan_ordinal_unique").on(
      table.planId,
      table.ordinal,
    ),
    unique("tournament_routing_routes_plan_id_unique").on(
      table.planId,
      table.id,
    ),
    unique("tournament_routing_routes_plan_id_cardinality_unique").on(
      table.planId,
      table.id,
      table.reservedSlots,
    ),
    check(
      "tournament_routing_routes_values_valid",
      sql`${table.ordinal} >= 0
        AND ${table.reservedSlots} > 0
        AND ${table.priority} >= 0
        AND ${table.routeOrder} >= 0`,
    ),
  ],
);

export const tournamentRoutingSelectionsTable = pgTable(
  "tournament_routing_selections",
  {
    routeId: integer("route_id").primaryKey(),
    planId: integer("plan_id").notNull(),
    routingStageId: integer("routing_stage_id"),
    selectionType: text("selection_type").notNull(),
    exactCardinality: integer("exact_cardinality").notNull(),
    count: integer("count"),
    rangeFrom: integer("range_from"),
    rangeTo: integer("range_to"),
    countPerGroup: integer("count_per_group"),
    groupCount: integer("group_count"),
    namedOutputId: integer("named_output_id"),
  },
  (table) => [
    unique("tournament_routing_selections_plan_route_unique").on(
      table.planId,
      table.routeId,
    ),
    foreignKey({
      columns: [table.planId, table.routeId, table.exactCardinality],
      foreignColumns: [
        tournamentRoutingRoutesTable.planId,
        tournamentRoutingRoutesTable.id,
        tournamentRoutingRoutesTable.reservedSlots,
      ],
      name: "tournament_routing_selections_route_cardinality_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.planId, table.routeId, table.routingStageId],
      foreignColumns: [
        tournamentRoutingRouteSourcesTable.planId,
        tournamentRoutingRouteSourcesTable.routeId,
        tournamentRoutingRouteSourcesTable.routingStageId,
      ],
      name: "tournament_routing_selections_source_stage_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.planId, table.routingStageId, table.namedOutputId],
      foreignColumns: [
        tournamentRoutingOutputsTable.planId,
        tournamentRoutingOutputsTable.routingStageId,
        tournamentRoutingOutputsTable.id,
      ],
      name: "tournament_routing_selections_output_fk",
    }).onDelete("no action"),
    check(
      "tournament_routing_selections_cardinality_positive",
      sql`${table.exactCardinality} > 0`,
    ),
    check(
      "tournament_routing_selections_shape",
      sql`(
          ${table.selectionType} = 'all'
          AND ${table.count} IS NULL
          AND ${table.rangeFrom} IS NULL
          AND ${table.rangeTo} IS NULL
          AND ${table.countPerGroup} IS NULL
          AND ${table.groupCount} IS NULL
          AND ${table.namedOutputId} IS NULL
        ) OR (
          ${table.selectionType} IN ('top_n', 'best_not_selected')
          AND ${table.count} = ${table.exactCardinality}
          AND ${table.rangeFrom} IS NULL
          AND ${table.rangeTo} IS NULL
          AND ${table.countPerGroup} IS NULL
          AND ${table.groupCount} IS NULL
          AND ${table.namedOutputId} IS NULL
        ) OR (
          ${table.selectionType} = 'rank_range'
          AND ${table.rangeFrom} > 0
          AND ${table.rangeTo} >= ${table.rangeFrom}
          AND ${table.exactCardinality} = ${table.rangeTo} - ${table.rangeFrom} + 1
          AND ${table.count} IS NULL
          AND ${table.countPerGroup} IS NULL
          AND ${table.groupCount} IS NULL
          AND ${table.namedOutputId} IS NULL
        ) OR (
          ${table.selectionType} = 'top_n_per_group'
          AND ${table.countPerGroup} > 0
          AND ${table.groupCount} > 0
          AND ${table.exactCardinality} = ${table.countPerGroup} * ${table.groupCount}
          AND ${table.count} IS NULL
          AND ${table.rangeFrom} IS NULL
          AND ${table.rangeTo} IS NULL
          AND ${table.namedOutputId} IS NULL
        ) OR (
          ${table.selectionType} = 'named_output'
          AND ${table.routingStageId} IS NOT NULL
          AND ${table.namedOutputId} IS NOT NULL
          AND ${table.count} IS NULL
          AND ${table.rangeFrom} IS NULL
          AND ${table.rangeTo} IS NULL
          AND ${table.countPerGroup} IS NULL
          AND ${table.groupCount} IS NULL
        )`,
    ),
  ],
);

export const tournamentRoutingSelectionGroupSizesTable = pgTable(
  "tournament_routing_selection_group_sizes",
  {
    planId: integer("plan_id").notNull(),
    routeId: integer("route_id").notNull(),
    position: integer("position").notNull(),
    exactGroupSize: integer("exact_group_size").notNull(),
  },
  (table) => [
    primaryKey({
      name: "tournament_routing_selection_group_sizes_pk",
      columns: [table.routeId, table.position],
    }),
    foreignKey({
      columns: [table.planId, table.routeId],
      foreignColumns: [
        tournamentRoutingSelectionsTable.planId,
        tournamentRoutingSelectionsTable.routeId,
      ],
      name: "tournament_routing_selection_group_sizes_selection_fk",
    }).onDelete("cascade"),
    check(
      "tournament_routing_selection_group_sizes_values_valid",
      sql`${table.position} >= 0 AND ${table.exactGroupSize} > 0`,
    ),
  ],
);

export const tournamentRoutingRouteSourcesTable = pgTable(
  "tournament_routing_route_sources",
  {
    routeId: integer("route_id").primaryKey(),
    planId: integer("plan_id").notNull(),
    sourceType: text("source_type").notNull(),
    bucketId: integer("bucket_id"),
    routingStageId: integer("routing_stage_id"),
    entryPointId: integer("entry_point_id"),
    logicalMatchId: integer("logical_match_id"),
    entryPosition: integer("entry_position"),
    matchOutcome: text("match_outcome"),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.routeId],
      foreignColumns: [
        tournamentRoutingRoutesTable.planId,
        tournamentRoutingRoutesTable.id,
      ],
      name: "tournament_routing_route_sources_route_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.planId, table.bucketId],
      foreignColumns: [
        tournamentRoutingBucketsTable.planId,
        tournamentRoutingBucketsTable.id,
      ],
      name: "tournament_routing_route_sources_bucket_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.routingStageId],
      foreignColumns: [
        tournamentRoutingStagesTable.planId,
        tournamentRoutingStagesTable.id,
      ],
      name: "tournament_routing_route_sources_stage_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.routingStageId, table.entryPointId],
      foreignColumns: [
        tournamentRoutingEntryPointsTable.planId,
        tournamentRoutingEntryPointsTable.routingStageId,
        tournamentRoutingEntryPointsTable.id,
      ],
      name: "tournament_routing_route_sources_stage_entry_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.routingStageId, table.logicalMatchId],
      foreignColumns: [
        tournamentRoutingLogicalMatchesTable.planId,
        tournamentRoutingLogicalMatchesTable.routingStageId,
        tournamentRoutingLogicalMatchesTable.id,
      ],
      name: "tournament_routing_route_sources_stage_match_fk",
    }).onDelete("no action"),
    unique("tournament_routing_route_sources_plan_route_stage_unique").on(
      table.planId,
      table.routeId,
      table.routingStageId,
    ),
    check(
      "tournament_routing_route_sources_shape",
      sql`(
          ${table.sourceType} = 'registration_bucket'
          AND ${table.bucketId} IS NOT NULL
          AND ${table.routingStageId} IS NULL
          AND ${table.entryPointId} IS NULL
          AND ${table.logicalMatchId} IS NULL
          AND ${table.entryPosition} IS NULL
          AND ${table.matchOutcome} IS NULL
        ) OR (
          ${table.sourceType} = 'stage_result'
          AND ${table.bucketId} IS NULL
          AND ${table.routingStageId} IS NOT NULL
          AND ${table.entryPointId} IS NULL
          AND ${table.logicalMatchId} IS NULL
          AND ${table.entryPosition} IS NULL
          AND ${table.matchOutcome} IS NULL
        ) OR (
          ${table.sourceType} = 'stage_entry'
          AND ${table.bucketId} IS NULL
          AND ${table.routingStageId} IS NOT NULL
          AND ${table.entryPointId} IS NOT NULL
          AND ${table.logicalMatchId} IS NULL
          AND ${table.entryPosition} > 0
          AND ${table.matchOutcome} IS NULL
        ) OR (
          ${table.sourceType} = 'match_outcome'
          AND ${table.bucketId} IS NULL
          AND ${table.routingStageId} IS NOT NULL
          AND ${table.entryPointId} IS NULL
          AND ${table.logicalMatchId} IS NOT NULL
          AND ${table.entryPosition} IS NULL
          AND ${table.matchOutcome} IN ('winner', 'loser')
        )`,
    ),
  ],
);

export const tournamentRoutingRouteTargetsTable = pgTable(
  "tournament_routing_route_targets",
  {
    routeId: integer("route_id").primaryKey(),
    planId: integer("plan_id").notNull(),
    targetType: text("target_type").notNull(),
    routingStageId: integer("routing_stage_id"),
    entryPointId: integer("entry_point_id"),
    logicalMatchId: integer("logical_match_id"),
    outputId: integer("output_id"),
    matchSlot: integer("match_slot"),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.routeId],
      foreignColumns: [
        tournamentRoutingRoutesTable.planId,
        tournamentRoutingRoutesTable.id,
      ],
      name: "tournament_routing_route_targets_route_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.planId, table.routingStageId],
      foreignColumns: [
        tournamentRoutingStagesTable.planId,
        tournamentRoutingStagesTable.id,
      ],
      name: "tournament_routing_route_targets_stage_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.routingStageId, table.entryPointId],
      foreignColumns: [
        tournamentRoutingEntryPointsTable.planId,
        tournamentRoutingEntryPointsTable.routingStageId,
        tournamentRoutingEntryPointsTable.id,
      ],
      name: "tournament_routing_route_targets_stage_entry_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.routingStageId, table.logicalMatchId],
      foreignColumns: [
        tournamentRoutingLogicalMatchesTable.planId,
        tournamentRoutingLogicalMatchesTable.routingStageId,
        tournamentRoutingLogicalMatchesTable.id,
      ],
      name: "tournament_routing_route_targets_stage_match_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [
        table.planId,
        table.routingStageId,
        table.logicalMatchId,
        table.matchSlot,
      ],
      foreignColumns: [
        tournamentRoutingLogicalMatchSlotsTable.planId,
        tournamentRoutingLogicalMatchSlotsTable.routingStageId,
        tournamentRoutingLogicalMatchSlotsTable.logicalMatchId,
        tournamentRoutingLogicalMatchSlotsTable.slot,
      ],
      name: "tournament_routing_route_targets_match_slot_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.routingStageId, table.outputId],
      foreignColumns: [
        tournamentRoutingOutputsTable.planId,
        tournamentRoutingOutputsTable.routingStageId,
        tournamentRoutingOutputsTable.id,
      ],
      name: "tournament_routing_route_targets_stage_output_fk",
    }).onDelete("no action"),
    unique("tournament_routing_route_targets_match_slot_unique").on(
      table.planId,
      table.logicalMatchId,
      table.matchSlot,
    ),
    check(
      "tournament_routing_route_targets_shape",
      sql`(
          ${table.targetType} = 'stage_entry'
          AND ${table.routingStageId} IS NOT NULL
          AND ${table.entryPointId} IS NOT NULL
          AND ${table.logicalMatchId} IS NULL
          AND ${table.outputId} IS NULL
          AND ${table.matchSlot} IS NULL
        ) OR (
          ${table.targetType} = 'match_slot'
          AND ${table.routingStageId} IS NOT NULL
          AND ${table.entryPointId} IS NULL
          AND ${table.logicalMatchId} IS NOT NULL
          AND ${table.outputId} IS NULL
          AND ${table.matchSlot} IN (1, 2)
        ) OR (
          ${table.targetType} = 'stage_output'
          AND ${table.routingStageId} IS NOT NULL
          AND ${table.entryPointId} IS NULL
          AND ${table.logicalMatchId} IS NULL
          AND ${table.outputId} IS NOT NULL
          AND ${table.matchSlot} IS NULL
        )`,
    ),
  ],
);

export const tournamentRoutingRouteConditionsTable = pgTable(
  "tournament_routing_route_conditions",
  {
    routeId: integer("route_id").primaryKey(),
    planId: integer("plan_id").notNull(),
    conditionType: text("condition_type").notNull(),
    lineageType: text("lineage_type"),
    lineageEntryPointId: integer("lineage_entry_point_id"),
    lineageRouteId: integer("lineage_route_id"),
    logicalMatchId: integer("logical_match_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.routeId],
      foreignColumns: [
        tournamentRoutingRoutesTable.planId,
        tournamentRoutingRoutesTable.id,
      ],
      name: "tournament_routing_route_conditions_route_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.planId, table.lineageEntryPointId],
      foreignColumns: [
        tournamentRoutingEntryPointsTable.planId,
        tournamentRoutingEntryPointsTable.id,
      ],
      name: "tournament_routing_route_conditions_entry_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.lineageRouteId],
      foreignColumns: [
        tournamentRoutingRoutesTable.planId,
        tournamentRoutingRoutesTable.id,
      ],
      name: "tournament_routing_route_conditions_lineage_route_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.planId, table.logicalMatchId],
      foreignColumns: [
        tournamentRoutingLogicalMatchesTable.planId,
        tournamentRoutingLogicalMatchesTable.id,
      ],
      name: "tournament_routing_route_conditions_match_fk",
    }).onDelete("no action"),
    check(
      "tournament_routing_route_conditions_shape",
      sql`(
          ${table.conditionType} = 'always'
          AND ${table.lineageType} IS NULL
          AND ${table.lineageEntryPointId} IS NULL
          AND ${table.lineageRouteId} IS NULL
          AND ${table.logicalMatchId} IS NULL
        ) OR (
          ${table.conditionType} = 'participant_lineage'
          AND ${table.logicalMatchId} IS NULL
          AND (
            (
              ${table.lineageType} = 'stage_entry'
              AND ${table.lineageEntryPointId} IS NOT NULL
              AND ${table.lineageRouteId} IS NULL
            ) OR (
              ${table.lineageType} = 'route'
              AND ${table.lineageEntryPointId} IS NULL
              AND ${table.lineageRouteId} IS NOT NULL
              AND ${table.lineageRouteId} <> ${table.routeId}
            )
          )
        ) OR (
          ${table.conditionType} = 'match_winner_lineage'
          AND ${table.logicalMatchId} IS NOT NULL
          AND (
            (
              ${table.lineageType} = 'stage_entry'
              AND ${table.lineageEntryPointId} IS NOT NULL
              AND ${table.lineageRouteId} IS NULL
            ) OR (
              ${table.lineageType} = 'route'
              AND ${table.lineageEntryPointId} IS NULL
              AND ${table.lineageRouteId} IS NOT NULL
              AND ${table.lineageRouteId} <> ${table.routeId}
            )
          )
        )`,
    ),
  ],
);

export const tournamentRoutingDependenciesTable = pgTable(
  "tournament_routing_dependencies",
  {
    routeId: integer("route_id").primaryKey(),
    planId: integer("plan_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    sourceNodeKey: text("source_node_key").notNull(),
    targetNodeKey: text("target_node_key").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.planId, table.routeId],
      foreignColumns: [
        tournamentRoutingRoutesTable.planId,
        tournamentRoutingRoutesTable.id,
      ],
      name: "tournament_routing_dependencies_route_fk",
    }).onDelete("cascade"),
    unique("tournament_routing_dependencies_plan_ordinal_unique").on(
      table.planId,
      table.ordinal,
    ),
    check(
      "tournament_routing_dependencies_values_valid",
      sql`${table.ordinal} >= 0
        AND length(${table.sourceNodeKey}) > 0
        AND length(${table.targetNodeKey}) > 0`,
    ),
  ],
);

export type TournamentRoutingPlan =
  typeof tournamentRoutingPlansTable.$inferSelect;
