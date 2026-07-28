import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  actionLogTable,
  appSchemaMigrationsTable,
  matchesTable,
  tournamentStagesTable,
} from "@workspace/db/schema";
import { getTableConfig } from "drizzle-orm/pg-core";

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

describe("authoritative Drizzle schema", () => {
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
});
