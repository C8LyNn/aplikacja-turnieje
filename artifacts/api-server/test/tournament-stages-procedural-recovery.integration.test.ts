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

const execFileAsync = promisify(execFile);
const PROCEDURAL_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0008_restore_stage_procedural_objects.sql",
  import.meta.url,
);
const DRIZZLE_KIT_URL = new URL(
  "../../../lib/db/node_modules/drizzle-kit/bin.cjs",
  import.meta.url,
);
const DB_WORKSPACE_URL = new URL("../../../lib/db/", import.meta.url);
const MIGRATION_RUNNER_TRANSACTION_BLOCK =
  /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const SESSION_SECRET = `stage-procedural-recovery-${randomUUID()}`;
const EXPECTED_FUNCTIONS = [
  "compat_assign_action_log_stage",
  "compat_assign_result_history_stage",
  "compat_assign_single_stage_match",
  "compat_count_single_stage_participants_after_delete",
  "compat_create_single_stage",
  "compat_prepare_single_stage_player_seed",
  "compat_resequence_single_stage_participants",
  "compat_sync_active_stage_pointer",
  "compat_sync_single_stage_from_tournament",
  "compat_sync_single_stage_participant",
  "prevent_last_tournament_stage_delete",
  "validate_active_stage_pointer",
  "validate_single_stage_lifecycle_alignment",
  "validate_stage_group_configuration",
  "validate_tournament_stage_participant_flow",
] as const;
const EXPECTED_TRIGGERS = [
  "action_log_assign_stage",
  "matches_assign_single_stage",
  "players_count_single_stage_after_delete",
  "players_prepare_single_stage_seed",
  "players_sync_single_stage_participant",
  "result_history_assign_stage",
  "stage_groups_validate_configuration",
  "tournament_stages_require_at_least_one",
  "tournament_stages_sync_active_pointer",
  "tournament_stages_validate_participant_flow",
  "tournaments_create_single_stage",
  "tournaments_sync_single_stage",
  "tournaments_validate_active_stage_pointer",
  "tournaments_validate_single_stage_lifecycle",
] as const;

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
  // drizzle-kit export emits composite foreign keys before the unique indexes
  // they reference. Reordering those generated statements changes no schema
  // definition and makes the empty-schema export executable by PostgreSQL.
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

async function stageParticipantCounts(tournamentId: number): Promise<number[]> {
  const result = await database.pool.query(
    "SELECT participant_count FROM tournament_stages WHERE tournament_id = $1 ORDER BY position",
    [tournamentId],
  );
  return result.rows.map((row) => Number(row.participant_count));
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

  const drizzleSchema = renderDrizzleSchema(
    await exportCurrentDrizzleSchema(),
    config.schema,
  );
  await database.pool.query(drizzleSchema);

  ({ signOrganizerToken } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

describe("0008 procedural object recovery", () => {
  test("restores a Drizzle-only stage schema and remains idempotent", async () => {
    const beforeFunctions = await database.pool.query(`
      SELECT count(*)::int AS count
      FROM pg_proc procedure
      JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = current_schema()
    `);
    const beforeTriggers = await database.pool.query(`
      SELECT count(*)::int AS count
      FROM pg_trigger trigger_row
      JOIN pg_class relation ON relation.oid = trigger_row.tgrelid
      JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()
        AND NOT trigger_row.tgisinternal
    `);
    assert.equal(beforeFunctions.rows[0].count, 0);
    assert.equal(beforeTriggers.rows[0].count, 0);

    const migrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(PROCEDURAL_MIGRATION_URL, "utf8"),
      config.schema,
    ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await database.pool.query("BEGIN");
      try {
        await database.pool.query(migrationSql);
        await database.pool.query("COMMIT");
      } catch (error) {
        await database.pool.query("ROLLBACK");
        throw error;
      }
    }

    const functions = await database.pool.query(`
      SELECT procedure.proname
      FROM pg_proc procedure
      JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = current_schema()
      ORDER BY procedure.proname
    `);
    const triggers = await database.pool.query(`
      SELECT trigger_row.tgname
      FROM pg_trigger trigger_row
      JOIN pg_class relation ON relation.oid = trigger_row.tgrelid
      JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()
        AND NOT trigger_row.tgisinternal
      ORDER BY trigger_row.tgname
    `);
    assert.deepEqual(
      functions.rows.map((row) => row.proname),
      [...EXPECTED_FUNCTIONS],
    );
    assert.deepEqual(
      triggers.rows.map((row) => row.tgname),
      [...EXPECTED_TRIGGERS],
    );

    const singleStage = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Recovered single stage ${randomUUID()}`,
        format: "single_elimination",
        defaultBestOf: 3,
      })
      .expect(201);
    const singleStageId = singleStage.body.id as number;
    const singleHeaders = {
      "x-organizer-token": signOrganizerToken(singleStageId),
    };
    assert.deepEqual(await stageParticipantCounts(singleStageId), [0]);
    const firstSinglePlayer = await request(app)
      .post(`/api/tournaments/${singleStageId}/players`)
      .set(singleHeaders)
      .send({ name: `Single 1 ${randomUUID()}`, seed: 1 })
      .expect(201);
    const secondSinglePlayer = await request(app)
      .post(`/api/tournaments/${singleStageId}/players`)
      .set(singleHeaders)
      .send({ name: `Single 2 ${randomUUID()}`, seed: 2 })
      .expect(201);
    assert.ok(firstSinglePlayer.body.id);
    assert.deepEqual(await stageParticipantCounts(singleStageId), [2]);
    await request(app)
      .delete(`/api/players/${secondSinglePlayer.body.id}`)
      .set(singleHeaders)
      .expect(204);
    assert.deepEqual(await stageParticipantCounts(singleStageId), [1]);

    const multiStage = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Recovered 32 to 16 to 8 ${randomUUID()}`,
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
              advancingCount: 8, bestOf: 3,
            },
            {
              key: "final", position: 3, name: "Final",
              format: "single_elimination", participantCount: 8, bestOf: 5,
            },
          ],
        },
      })
      .expect(201);
    const multiStageId = multiStage.body.id as number;
    const multiHeaders = {
      "x-organizer-token": signOrganizerToken(multiStageId),
    };
    assert.deepEqual(await stageParticipantCounts(multiStageId), [32, 16, 8]);

    const removable = await request(app)
      .post(`/api/tournaments/${multiStageId}/players`)
      .set(multiHeaders)
      .send({ name: `Removable ${randomUUID()}`, seed: 1 })
      .expect(201);
    assert.deepEqual(await stageParticipantCounts(multiStageId), [32, 16, 8]);
    await request(app)
      .delete(`/api/players/${removable.body.id}`)
      .set(multiHeaders)
      .expect(204);
    assert.deepEqual(await stageParticipantCounts(multiStageId), [32, 16, 8]);

    for (let seed = 1; seed <= 32; seed += 1) {
      await request(app)
        .post(`/api/tournaments/${multiStageId}/players`)
        .set(multiHeaders)
        .send({ name: `Player ${seed} ${randomUUID()}`, seed })
        .expect(201);
    }
    const started = await request(app)
      .post(`/api/tournaments/${multiStageId}/start`)
      .set(multiHeaders)
      .expect(200);
    assert.equal(started.body.status, "active");
    const stageState = await database.pool.query(
      "SELECT id, status FROM tournament_stages WHERE tournament_id = $1 ORDER BY position",
      [multiStageId],
    );
    assert.deepEqual(stageState.rows.map((row) => row.status), [
      "active",
      "planned",
      "planned",
    ]);
    assert.equal(started.body.activeStageId, stageState.rows[0].id);
    const firstRound = await database.pool.query(
      "SELECT count(*)::int AS count FROM matches WHERE tournament_id = $1 AND stage_id = $2",
      [multiStageId, stageState.rows[0].id],
    );
    assert.equal(firstRound.rows[0].count, 16);
  });
});
