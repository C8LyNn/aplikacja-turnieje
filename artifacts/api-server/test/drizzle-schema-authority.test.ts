import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  actionLogTable,
  appSchemaMigrationsTable,
  matchesTable,
  resultHistoryTable,
  stageBasketParticipantsTable,
  stageBasketRoutesTable,
  stageBasketsTable,
  stageGroupsTable,
  stageParticipantsTable,
  tournamentRoutingEntryPointsTable,
  tournamentRoutingExecutionsTable,
  tournamentRoutingLogicalMatchSlotsTable,
  tournamentRoutingLogicalMatchesTable,
  tournamentRoutingOutputsTable,
  tournamentRoutingPlansTable,
  tournamentRoutingRouteSourcesTable,
  tournamentRoutingRouteTargetsTable,
  tournamentRoutingRoutesTable,
  tournamentRoutingSelectionsTable,
  tournamentRoutingStagesTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db/schema";
import { getTableConfig } from "drizzle-orm/pg-core";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function foreignKeyConfig(
  table: Parameters<typeof getTableConfig>[0],
  name: string,
) {
  const foreignKey = getTableConfig(table).foreignKeys.find(
    (candidate) => candidate.getName() === name,
  );
  assert.ok(foreignKey, `missing Drizzle foreign key ${name}`);
  const reference = foreignKey.reference();
  return {
    columns: reference.columns.map((column) => column.name),
    foreignTable: getTableConfig(reference.foreignTable).name,
    foreignColumns: reference.foreignColumns.map((column) => column.name),
    onDelete: foreignKey.onDelete,
  };
}

function expectUniqueConstraint(
  table: Parameters<typeof getTableConfig>[0],
  name: string,
  columns: string[],
): void {
  const config = getTableConfig(table);
  assert.ok(
    config.uniqueConstraints.some(
      (constraint) =>
        constraint.getName() === name &&
        constraint.columns.map((column) => column.name).join(",") ===
          columns.join(","),
    ),
    `missing Drizzle UNIQUE constraint ${name}`,
  );
  assert.equal(
    config.indexes.some((index) => index.config.name === name),
    false,
    `${name} must not be declared as a standalone index`,
  );
}

describe("authoritative Drizzle schema", () => {
  test("persists basket-flow authority as an explicit compatibility-safe version", () => {
    const tournaments = getTableConfig(tournamentsTable);
    const authorityVersion = tournaments.columns.find(
      (column) => column.name === "basket_flow_authority_version",
    );

    assert.ok(authorityVersion, "missing basket_flow_authority_version column");
    assert.equal(authorityVersion.notNull, true);
    assert.equal(authorityVersion.default, 0);
    assert.ok(
      tournaments.checks.some(
        (check) =>
          check.name ===
          "tournaments_basket_flow_authority_version_supported",
      ),
    );

    const migration = readFileSync(
      resolve(
        repositoryRoot,
        "lib/db/migrations/0024_basket_flow_authority.sql",
      ),
      "utf8",
    );
    assert.match(
      migration,
      /SET basket_flow_authority_version = 0\s+WHERE basket_flow_authority_version IS NULL/,
    );
    assert.match(
      migration,
      /ALTER COLUMN basket_flow_authority_version SET DEFAULT 0/,
    );
    assert.match(
      migration,
      /ALTER COLUMN basket_flow_authority_version SET NOT NULL/,
    );
    assert.match(
      migration,
      /CHECK \(basket_flow_authority_version IN \(0, 1\)\)/,
    );
  });

  test("declares stage baskets with stable identities and relational routing guards", () => {
    const baskets = getTableConfig(stageBasketsTable);
    const routes = getTableConfig(stageBasketRoutesTable);
    const assignments = getTableConfig(stageBasketParticipantsTable);

    assert.ok(baskets.primaryKeys.some(
      (key) => key.getName() === "stage_baskets_pkey" &&
        key.columns.map((column) => column.name).join(",") === "tournament_id,id",
    ));
    expectUniqueConstraint(
      stageBasketRoutesTable,
      "stage_basket_routes_source_unique",
      ["tournament_id", "source_basket_id"],
    );
    expectUniqueConstraint(
      stageBasketParticipantsTable,
      "stage_basket_participants_stage_player_unique",
      ["tournament_id", "stage_id", "player_id"],
    );
    assert.deepEqual(
      foreignKeyConfig(
        stageBasketRoutesTable,
        "stage_basket_routes_source_same_tournament_fk",
      ),
      {
        columns: ["tournament_id", "source_stage_id", "source_basket_id"],
        foreignTable: "stage_baskets",
        foreignColumns: ["tournament_id", "stage_id", "id"],
        onDelete: "cascade",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        stageBasketParticipantsTable,
        "stage_basket_participants_player_same_tournament_fk",
      ),
      {
        columns: ["tournament_id", "player_id"],
        foreignTable: "players",
        foreignColumns: ["tournament_id", "id"],
        onDelete: "cascade",
      },
    );
    assert.ok(routes.checks.some((check) => check.name === "stage_basket_routes_distinct_baskets"));
    assert.ok(assignments.primaryKeys.some(
      (key) => key.getName() === "stage_basket_participants_pkey",
    ));
  });

  test("declares the routing execution snapshot table", () => {
    const config = getTableConfig(tournamentRoutingExecutionsTable);
    assert.equal(config.name, "tournament_routing_executions");
    assert.deepEqual(
      config.columns.map((column) => column.name),
      ["plan_id", "stage_key", "revision", "state", "created_at", "updated_at"],
    );
    assert.ok(
      config.primaryKeys.some(
        (key) =>
          key.getName() === "tournament_routing_executions_pk" &&
          key.columns.map((column) => column.name).join(",") ===
            "plan_id,stage_key",
      ),
    );
    assert.deepEqual(
      foreignKeyConfig(
        tournamentRoutingExecutionsTable,
        "tournament_routing_executions_stage_fk",
      ),
      {
        columns: ["plan_id", "stage_key"],
        foreignTable: "tournament_routing_stages",
        foreignColumns: ["plan_id", "stage_key"],
        onDelete: "cascade",
      },
    );
  });

  test("keeps Replit push outside the application-owned public schema", () => {
    const pushSchema = readFileSync(
      resolve(repositoryRoot, "lib/db/replit-push-schema.ts"),
      "utf8",
    );
    const pushConfig = readFileSync(
      resolve(repositoryRoot, "lib/db/drizzle.config.ts"),
      "utf8",
    );

    assert.match(pushSchema, /pgSchema\(["']information_schema["']\)/);
    assert.match(pushConfig, /schema:\s*["']\.\/replit-push-schema\.ts["']/);
    assert.match(
      pushConfig,
      /tablesFilter:\s*\[\s*["']__replit_push_manages_no_tables__["']\s*\]/,
    );
    assert.match(
      pushConfig,
      /schemaFilter:\s*\[\s*["']information_schema["']\s*\]/,
    );
  });

  test("declares migration infrastructure and the required composite foreign keys", () => {
    const migrationConfig = getTableConfig(appSchemaMigrationsTable);
    assert.equal(migrationConfig.name, "app_schema_migrations");
    assert.deepEqual(
      migrationConfig.columns.map((column) => column.name),
      [
        "migration_key",
        "applied_at",
        "app_commit",
        "target_schema",
        "deployment_environment",
      ],
    );

    assert.deepEqual(
      foreignKeyConfig(
        tournamentStagesTable,
        "tournament_stages_winner_same_stage_fk",
      ),
      {
        columns: ["id", "winner_id"],
        foreignTable: "stage_participants",
        foreignColumns: ["stage_id", "player_id"],
        onDelete: "no action",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(actionLogTable, "action_log_stage_same_tournament_fk"),
      {
        columns: ["tournament_id", "stage_id"],
        foreignTable: "tournament_stages",
        foreignColumns: ["tournament_id", "id"],
        onDelete: "set null (stage_id)",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        actionLogTable,
        "action_log_match_same_tournament_stage_fk",
      ),
      {
        columns: ["tournament_id", "stage_id", "match_id"],
        foreignTable: "matches",
        foreignColumns: ["tournament_id", "stage_id", "id"],
        onDelete: "set null (stage_id, match_id)",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        resultHistoryTable,
        "result_history_match_same_stage_fk",
      ),
      {
        columns: ["match_id", "stage_id"],
        foreignTable: "matches",
        foreignColumns: ["id", "stage_id"],
        onDelete: "no action",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        resultHistoryTable,
        "result_history_match_same_tournament_stage_fk",
      ),
      {
        columns: ["tournament_id", "stage_id", "match_id"],
        foreignTable: "matches",
        foreignColumns: ["tournament_id", "stage_id", "id"],
        onDelete: "cascade",
      },
    );
  });

  test("declares only the canonical matches id/stage unique constraint", () => {
    const matchesConfig = getTableConfig(matchesTable);
    assert.ok(
      matchesConfig.uniqueConstraints.some(
        (constraint) =>
          constraint.getName() === "matches_id_stage_id_unique" &&
          constraint.columns.map((column) => column.name).join(",") ===
            "id,stage_id",
      ),
    );
    assert.equal(
      matchesConfig.uniqueConstraints.some(
        (constraint) =>
          constraint.getName() === "matches_stage_id_id_unique",
      ) ||
        matchesConfig.indexes.some(
          (index) => index.config.name === "matches_stage_id_id_unique",
        ),
      false,
    );
  });

  test("declares reconciled catalog invariants as UNIQUE constraints", () => {
    expectUniqueConstraint(
      tournamentStagesTable,
      "tournament_stages_tournament_id_id_unique",
      ["tournament_id", "id"],
    );
    expectUniqueConstraint(
      stageGroupsTable,
      "stage_groups_stage_id_id_unique",
      ["stage_id", "id"],
    );
    expectUniqueConstraint(
      stageParticipantsTable,
      "stage_participants_tournament_id_id_unique",
      ["tournament_id", "id"],
    );
    expectUniqueConstraint(
      stageParticipantsTable,
      "stage_participants_stage_seed_unique",
      ["stage_id", "stage_seed"],
    );
    expectUniqueConstraint(
      matchesTable,
      "matches_tournament_stage_id_id_unique",
      ["tournament_id", "stage_id", "id"],
    );
    expectUniqueConstraint(
      matchesTable,
      "matches_stage_round_number_unique",
      ["stage_id", "round", "match_number"],
    );
  });

  test("declares the compiled routing catalog with plan-scoped relational integrity", () => {
    assert.equal(getTableConfig(tournamentRoutingPlansTable).name, "tournament_routing_plans");
    expectUniqueConstraint(
      tournamentRoutingPlansTable,
      "tournament_routing_plans_tournament_revision_unique",
      ["tournament_id", "revision"],
    );
    expectUniqueConstraint(
      tournamentRoutingStagesTable,
      "tournament_routing_stages_plan_stage_unique",
      ["plan_id", "stage_id"],
    );
    expectUniqueConstraint(
      tournamentRoutingEntryPointsTable,
      "tournament_routing_entry_points_plan_stage_id_unique",
      ["plan_id", "routing_stage_id", "id"],
    );
    expectUniqueConstraint(
      tournamentRoutingLogicalMatchesTable,
      "tournament_routing_logical_matches_plan_stage_id_unique",
      ["plan_id", "routing_stage_id", "id"],
    );
    expectUniqueConstraint(
      tournamentRoutingOutputsTable,
      "tournament_routing_outputs_plan_stage_id_unique",
      ["plan_id", "routing_stage_id", "id"],
    );
    expectUniqueConstraint(
      tournamentRoutingLogicalMatchSlotsTable,
      "tournament_routing_match_slots_plan_stage_match_slot_uq",
      ["plan_id", "routing_stage_id", "logical_match_id", "slot"],
    );
    expectUniqueConstraint(
      tournamentRoutingRoutesTable,
      "tournament_routing_routes_plan_id_cardinality_unique",
      ["plan_id", "id", "reserved_slots"],
    );
    assert.deepEqual(
      foreignKeyConfig(
        tournamentRoutingSelectionsTable,
        "tournament_routing_selections_route_cardinality_fk",
      ),
      {
        columns: ["plan_id", "route_id", "exact_cardinality"],
        foreignTable: "tournament_routing_routes",
        foreignColumns: ["plan_id", "id", "reserved_slots"],
        onDelete: "cascade",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        tournamentRoutingSelectionsTable,
        "tournament_routing_selections_output_fk",
      ),
      {
        columns: ["plan_id", "routing_stage_id", "named_output_id"],
        foreignTable: "tournament_routing_outputs",
        foreignColumns: ["plan_id", "routing_stage_id", "id"],
        onDelete: "no action",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        tournamentRoutingSelectionsTable,
        "tournament_routing_selections_source_stage_fk",
      ),
      {
        columns: ["plan_id", "route_id", "routing_stage_id"],
        foreignTable: "tournament_routing_route_sources",
        foreignColumns: ["plan_id", "route_id", "routing_stage_id"],
        onDelete: "cascade",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        tournamentRoutingRouteSourcesTable,
        "tournament_routing_route_sources_stage_match_fk",
      ),
      {
        columns: ["plan_id", "routing_stage_id", "logical_match_id"],
        foreignTable: "tournament_routing_logical_matches",
        foreignColumns: ["plan_id", "routing_stage_id", "id"],
        onDelete: "no action",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        tournamentRoutingRouteTargetsTable,
        "tournament_routing_route_targets_match_slot_fk",
      ),
      {
        columns: [
          "plan_id",
          "routing_stage_id",
          "logical_match_id",
          "match_slot",
        ],
        foreignTable: "tournament_routing_logical_match_slots",
        foreignColumns: [
          "plan_id",
          "routing_stage_id",
          "logical_match_id",
          "slot",
        ],
        onDelete: "no action",
      },
    );
    assert.deepEqual(
      foreignKeyConfig(
        tournamentRoutingRouteTargetsTable,
        "tournament_routing_route_targets_stage_output_fk",
      ),
      {
        columns: ["plan_id", "routing_stage_id", "output_id"],
        foreignTable: "tournament_routing_outputs",
        foreignColumns: ["plan_id", "routing_stage_id", "id"],
        onDelete: "no action",
      },
    );
    assert.equal(
      getTableConfig(tournamentRoutingEntryPointsTable).indexes.some(
        (index) =>
          index.config.name === "tournament_routing_entry_points_stage_idx",
      ),
      false,
    );
    assert.equal(
      getTableConfig(tournamentRoutingOutputsTable).indexes.some(
        (index) =>
          index.config.name === "tournament_routing_outputs_stage_idx",
      ),
      false,
    );
  });
});
