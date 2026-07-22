import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  renderSeriesV1MigrationForTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

interface CompositeForeignKeySpec {
  table: string;
  name: string;
  columns: string[];
  foreignTable: string;
  foreignColumns: string[];
  deleteClause: string;
  deleteAction: string;
  setNullColumns?: string[];
  deferrable?: boolean;
}

interface ForeignKeyMetadata {
  table_name: string;
  constraint_name: string;
  columns: string[];
  foreign_table: string;
  foreign_columns: string[];
  delete_action: string;
  set_null_columns: string[];
  is_deferrable: boolean;
  initially_deferred: boolean;
  validated: boolean;
}

const execFileAsync = promisify(execFile);
const PROCEDURAL_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0008_restore_stage_procedural_objects.sql",
  import.meta.url,
);
const COMPOSITE_FOREIGN_KEYS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0009_reconcile_composite_foreign_keys.sql",
  import.meta.url,
);
const DRIZZLE_KIT_URL = new URL(
  "../../../lib/db/node_modules/drizzle-kit/bin.cjs",
  import.meta.url,
);
const DB_WORKSPACE_URL = new URL("../../../lib/db/", import.meta.url);
const SESSION_SECRET = `composite-foreign-keys-${randomUUID()}`;

const TARGET_FOREIGN_KEYS: CompositeForeignKeySpec[] = [
  {
    table: "stage_participants",
    name: "stage_participants_stage_same_tournament_fk",
    columns: ["tournament_id", "stage_id"],
    foreignTable: "tournament_stages",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "c",
    deleteClause: "ON DELETE CASCADE",
  },
  {
    table: "stage_participants",
    name: "stage_participants_player_same_tournament_fk",
    columns: ["tournament_id", "player_id"],
    foreignTable: "players",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "c",
    deleteClause: "ON DELETE CASCADE",
  },
  {
    table: "stage_participants",
    name: "stage_participants_group_same_stage_fk",
    columns: ["stage_id", "group_id"],
    foreignTable: "stage_groups",
    foreignColumns: ["stage_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "stage_participants",
    name: "stage_participants_source_same_tournament_fk",
    columns: ["tournament_id", "source_stage_participant_id"],
    foreignTable: "stage_participants",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "r",
    deleteClause: "ON DELETE RESTRICT",
  },
  {
    table: "tournaments",
    name: "tournaments_active_stage_same_tournament_fk",
    columns: ["id", "active_stage_id"],
    foreignTable: "tournament_stages",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
    deferrable: true,
  },
  {
    table: "tournament_stages",
    name: "tournament_stages_winner_same_tournament_fk",
    columns: ["tournament_id", "winner_id"],
    foreignTable: "players",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "tournament_stages",
    name: "tournament_stages_winner_same_stage_fk",
    columns: ["id", "winner_id"],
    foreignTable: "stage_participants",
    foreignColumns: ["stage_id", "player_id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
    deferrable: true,
  },
  {
    table: "matches",
    name: "matches_stage_same_tournament_fk",
    columns: ["tournament_id", "stage_id"],
    foreignTable: "tournament_stages",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_group_same_stage_fk",
    columns: ["stage_id", "stage_group_id"],
    foreignTable: "stage_groups",
    foreignColumns: ["stage_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_player1_same_stage_fk",
    columns: ["stage_id", "player1_id"],
    foreignTable: "stage_participants",
    foreignColumns: ["stage_id", "player_id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_player2_same_stage_fk",
    columns: ["stage_id", "player2_id"],
    foreignTable: "stage_participants",
    foreignColumns: ["stage_id", "player_id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_winner_same_stage_fk",
    columns: ["stage_id", "winner_id"],
    foreignTable: "stage_participants",
    foreignColumns: ["stage_id", "player_id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_player1_same_tournament_fk",
    columns: ["tournament_id", "player1_id"],
    foreignTable: "players",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_player2_same_tournament_fk",
    columns: ["tournament_id", "player2_id"],
    foreignTable: "players",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_winner_same_tournament_fk",
    columns: ["tournament_id", "winner_id"],
    foreignTable: "players",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "matches",
    name: "matches_next_match_same_stage_fk",
    columns: ["next_match_id", "stage_id"],
    foreignTable: "matches",
    foreignColumns: ["id", "stage_id"],
    deleteAction: "a",
    deleteClause: "ON DELETE NO ACTION",
  },
  {
    table: "action_log",
    name: "action_log_stage_same_tournament_fk",
    columns: ["tournament_id", "stage_id"],
    foreignTable: "tournament_stages",
    foreignColumns: ["tournament_id", "id"],
    deleteAction: "n",
    deleteClause: "ON DELETE SET NULL (stage_id)",
    setNullColumns: ["stage_id"],
  },
  {
    table: "action_log",
    name: "action_log_match_same_tournament_stage_fk",
    columns: ["tournament_id", "stage_id", "match_id"],
    foreignTable: "matches",
    foreignColumns: ["tournament_id", "stage_id", "id"],
    deleteAction: "n",
    deleteClause: "ON DELETE SET NULL (stage_id, match_id)",
    setNullColumns: ["stage_id", "match_id"],
  },
];

let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function renderDrizzleSchema(sql: string, schema: string): string {
  const quotedSchema = quoteIdentifier(schema);
  const rendered = sql
    .replaceAll('"public".', `${quotedSchema}.`)
    .replaceAll("public.", `${quotedSchema}.`);
  const statements = rendered
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  const baseObjects = statements.filter((statement) =>
    !statement.startsWith("ALTER TABLE") &&
    !statement.startsWith("CREATE UNIQUE INDEX") &&
    !statement.startsWith("CREATE INDEX")
  );
  const uniqueIndexes = statements.filter((statement) =>
    statement.startsWith("CREATE UNIQUE INDEX")
  );
  const foreignKeys = statements.filter((statement) =>
    statement.startsWith("ALTER TABLE")
  );
  const ordinaryIndexes = statements.filter((statement) =>
    statement.startsWith("CREATE INDEX")
  );
  return [baseObjects, uniqueIndexes, foreignKeys, ordinaryIndexes]
    .flat()
    .map((statement) => `${statement};`)
    .join("\n");
}

async function exportCurrentDrizzleSchema(): Promise<string> {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      fileURLToPath(DRIZZLE_KIT_URL),
      "export",
      "--schema",
      "./src/schema/*.ts",
      "--dialect",
      "postgresql",
    ],
    {
      cwd: fileURLToPath(DB_WORKSPACE_URL),
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return stdout;
}

function qualifiedTable(schema: string, table: string): string {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
}

function columnList(columns: string[]): string {
  return columns.map(quoteIdentifier).join(", ");
}

async function installReversedForeignKeys(): Promise<void> {
  for (const spec of TARGET_FOREIGN_KEYS) {
    await database.pool.query(
      `ALTER TABLE ${qualifiedTable(config.schema, spec.table)} DROP CONSTRAINT IF EXISTS ${quoteIdentifier(spec.name)}`,
    );
    await database.pool.query(`
      ALTER TABLE ${qualifiedTable(config.schema, spec.table)}
      ADD CONSTRAINT ${quoteIdentifier(spec.name)}
      FOREIGN KEY (${columnList([...spec.columns].reverse())})
      REFERENCES ${qualifiedTable(config.schema, spec.foreignTable)} (${columnList(spec.foreignColumns)})
      ON UPDATE NO ACTION ${spec.deleteClause}
      ${spec.deferrable ? "DEFERRABLE INITIALLY DEFERRED" : "NOT DEFERRABLE"}
    `);
  }
}

async function foreignKeyMetadata(names: string[]): Promise<ForeignKeyMetadata[]> {
  const result = await database.pool.query<ForeignKeyMetadata>(`
    SELECT
      table_row.relname AS table_name,
      constraint_row.conname AS constraint_name,
      ARRAY(
        SELECT attribute_row.attname::text
        FROM unnest(constraint_row.conkey) WITH ORDINALITY
          AS constraint_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.conrelid
         AND attribute_row.attnum = constraint_column.attribute_number
        ORDER BY constraint_column.position
      ) AS columns,
      foreign_table_row.relname AS foreign_table,
      ARRAY(
        SELECT attribute_row.attname::text
        FROM unnest(constraint_row.confkey) WITH ORDINALITY
          AS constraint_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.confrelid
         AND attribute_row.attnum = constraint_column.attribute_number
        ORDER BY constraint_column.position
      ) AS foreign_columns,
      constraint_row.confdeltype::text AS delete_action,
      ARRAY(
        SELECT attribute_row.attname::text
        FROM unnest(COALESCE(constraint_row.confdelsetcols, ARRAY[]::smallint[])) WITH ORDINALITY
          AS constraint_column(attribute_number, position)
        JOIN pg_attribute attribute_row
          ON attribute_row.attrelid = constraint_row.conrelid
         AND attribute_row.attnum = constraint_column.attribute_number
        ORDER BY constraint_column.position
      ) AS set_null_columns,
      constraint_row.condeferrable AS is_deferrable,
      constraint_row.condeferred AS initially_deferred,
      constraint_row.convalidated AS validated
    FROM pg_constraint constraint_row
    JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
    JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
    JOIN pg_class foreign_table_row ON foreign_table_row.oid = constraint_row.confrelid
    WHERE namespace_row.nspname = current_schema()
      AND constraint_row.contype = 'f'
      AND constraint_row.conname = ANY($1::text[])
    ORDER BY constraint_row.conname
  `, [names]);
  return result.rows;
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;

  const quotedSchema = quoteIdentifier(config.schema);
  await database.pool.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
  await database.pool.query(`CREATE SCHEMA ${quotedSchema}`);
  schemaInitialized = true;
  await database.pool.query(`SET search_path TO ${quotedSchema}`);
  await database.pool.query(renderDrizzleSchema(
    await exportCurrentDrizzleSchema(),
    config.schema,
  ));

  const proceduralMigration = renderSeriesV1MigrationForTestSchema(
    await readFile(PROCEDURAL_MIGRATION_URL, "utf8"),
    config.schema,
  );
  await database.pool.query(proceduralMigration);
  await installReversedForeignKeys();

  ({ signOrganizerToken } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

describe("0009 composite foreign key reconciliation", () => {
  test("repairs reversed Production constraints, preserves result_history, and remains idempotent", async () => {
    const targetNames = TARGET_FOREIGN_KEYS.map((spec) => spec.name);
    const reversed = await foreignKeyMetadata(targetNames);
    assert.equal(reversed.length, TARGET_FOREIGN_KEYS.length);
    for (const spec of TARGET_FOREIGN_KEYS) {
      const actual = reversed.find((constraint) => constraint.constraint_name === spec.name);
      assert.deepEqual(actual?.columns, [...spec.columns].reverse());
    }

    const resultHistoryBefore = await database.pool.query(`
      SELECT constraint_row.oid, constraint_row.conname, pg_get_constraintdef(constraint_row.oid) AS definition
      FROM pg_constraint constraint_row
      JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
      JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
      WHERE namespace_row.nspname = current_schema()
        AND table_row.relname = 'result_history'
        AND constraint_row.conname IN (
          'result_history_match_same_stage_fk',
          'result_history_match_same_tournament_stage_fk'
        )
      ORDER BY constraint_row.conname
    `);
    assert.equal(resultHistoryBefore.rows.length, 2);

    const migrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(COMPOSITE_FOREIGN_KEYS_MIGRATION_URL, "utf8"),
      config.schema,
    );
    await database.pool.query(migrationSql);
    await database.pool.query(migrationSql);

    const reconciled = await foreignKeyMetadata(targetNames);
    assert.equal(reconciled.length, TARGET_FOREIGN_KEYS.length);
    for (const spec of TARGET_FOREIGN_KEYS) {
      const actual = reconciled.find((constraint) => constraint.constraint_name === spec.name);
      assert.ok(actual, `missing ${spec.name}`);
      assert.deepEqual(actual.columns, spec.columns, spec.name);
      assert.equal(actual.foreign_table, spec.foreignTable, spec.name);
      assert.deepEqual(actual.foreign_columns, spec.foreignColumns, spec.name);
      assert.equal(actual.delete_action, spec.deleteAction, spec.name);
      assert.deepEqual(actual.set_null_columns, spec.setNullColumns ?? [], spec.name);
      assert.equal(actual.is_deferrable, spec.deferrable ?? false, spec.name);
      assert.equal(actual.initially_deferred, spec.deferrable ?? false, spec.name);
      assert.equal(actual.validated, true, spec.name);
    }

    const resultHistoryAfter = await database.pool.query(`
      SELECT constraint_row.oid, constraint_row.conname, pg_get_constraintdef(constraint_row.oid) AS definition
      FROM pg_constraint constraint_row
      JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
      JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
      WHERE namespace_row.nspname = current_schema()
        AND table_row.relname = 'result_history'
        AND constraint_row.conname IN (
          'result_history_match_same_stage_fk',
          'result_history_match_same_tournament_stage_fk'
        )
      ORDER BY constraint_row.conname
    `);
    assert.deepEqual(resultHistoryAfter.rows, resultHistoryBefore.rows);

    const tournament = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Composite FK 32 to 16 to 8 ${randomUUID()}`,
        format: "single_elimination",
        defaultBestOf: 1,
        stagePlan: {
          initialParticipantCount: 32,
          stages: [
            {
              key: "top-16", position: 1, name: "Top 16",
              format: "single_elimination", participantCount: 32,
              advancingCount: 16, bestOf: 1,
            },
            {
              key: "top-8", position: 2, name: "Top 8",
              format: "single_elimination", participantCount: 16,
              advancingCount: 8, bestOf: 1,
            },
            {
              key: "final", position: 3, name: "Final",
              format: "single_elimination", participantCount: 8, bestOf: 1,
            },
          ],
        },
      })
      .expect(201);
    const tournamentId = tournament.body.id as number;
    const organizerHeaders = {
      "x-organizer-token": signOrganizerToken(tournamentId),
    };
    const csv = [
      "name,seed",
      ...Array.from({ length: 32 }, (_, index) => `Player ${index + 1},${index + 1}`),
    ].join("\n");
    const imported = await request(app)
      .post(`/api/tournaments/${tournamentId}/players/import`)
      .set(organizerHeaders)
      .send({ csv, mode: "append" })
      .expect(200);
    assert.equal(imported.body.imported, 32);
    assert.equal(imported.body.skipped, 0);

    const started = await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set(organizerHeaders)
      .expect(200);
    assert.equal(started.body.status, "active");
    const stages = await database.pool.query(
      "SELECT id, status, participant_count FROM tournament_stages WHERE tournament_id = $1 ORDER BY position",
      [tournamentId],
    );
    assert.deepEqual(stages.rows.map((stage) => Number(stage.participant_count)), [32, 16, 8]);
    assert.deepEqual(stages.rows.map((stage) => stage.status), ["active", "planned", "planned"]);

    const match = await database.pool.query(
      `SELECT id, player1_id, player2_id
       FROM matches
       WHERE tournament_id = $1 AND stage_id = $2 AND status = 'pending'
       ORDER BY match_number
       LIMIT 1`,
      [tournamentId, stages.rows[0].id],
    );
    assert.equal(match.rows.length, 1);
    await request(app)
      .post(`/api/matches/${match.rows[0].id}/complete`)
      .set(organizerHeaders)
      .send({ resultType: "played", score1: 1, score2: 0 })
      .expect(200);

    const historyAndLog = await database.pool.query(`
      SELECT
        (SELECT count(*)::int FROM result_history
          WHERE tournament_id = $1 AND stage_id = $2 AND match_id = $3) AS history_count,
        (SELECT count(*)::int FROM action_log
          WHERE tournament_id = $1 AND stage_id = $2 AND match_id = $3
            AND action_type = 'match_result_submitted') AS log_count
    `, [tournamentId, stages.rows[0].id, match.rows[0].id]);
    assert.equal(historyAndLog.rows[0].history_count, 1);
    assert.equal(historyAndLog.rows[0].log_count, 1);
  });
});
