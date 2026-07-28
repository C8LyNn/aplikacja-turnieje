import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  renderSeriesV1MigrationForTestSchema,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

const RECONCILIATION_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0007_reconcile_stage_schema.sql",
  import.meta.url,
);
const MIGRATION_RUNNER_TRANSACTION_BLOCK =
  /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const SESSION_SECRET = `stage-reconcile-${randomUUID()}`;

let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

async function organizerTokenFor(tournamentId: number): Promise<string> {
  const result = await database.pool.query<{ organizer_password_hash: string }>(
    "SELECT organizer_password_hash FROM tournaments WHERE id = $1",
    [tournamentId],
  );
  const passwordHash = result.rows[0]?.organizer_password_hash;
  assert.ok(passwordHash, "created tournament must have organizer credentials");
  return signOrganizerToken(tournamentId, passwordHash);
}

function oldProductionStateSql(schema: string): string {
  return renderSeriesV1MigrationForTestSchema(`
ALTER TABLE public.tournament_stages
  DROP CONSTRAINT IF EXISTS tournament_stages_qualification_configuration;

ALTER TABLE public.tournament_stages
  ADD CONSTRAINT tournament_stages_qualification_configuration CHECK (
    (qualification_mode = 'none' AND advancing_count IS NULL)
    OR (qualification_mode = 'top_n'
      AND format IN ('swiss', 'round_robin')
      AND advancing_count IS NOT NULL
      AND advancing_count <= participant_count)
    OR (qualification_mode = 'top_n_per_group'
      AND format = 'group_stage'
      AND advancing_count IS NULL)
  );

CREATE OR REPLACE FUNCTION public.compat_sync_single_stage_participant()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
BEGIN
  IF current_setting('tournament_manager.resequencing', true) = 'on' THEN
    RETURN NEW;
  END IF;
  SELECT id INTO target_stage_id
  FROM public.tournament_stages
  WHERE tournament_id = NEW.tournament_id AND position = 1;
  INSERT INTO public.stage_participants (
    tournament_id, stage_id, player_id, stage_seed, status,
    qualification_source, created_at
  ) VALUES (
    NEW.tournament_id, target_stage_id, NEW.id, NEW.seed,
    NEW.status::text::public.stage_participant_status,
    'registration', NEW.created_at
  )
  ON CONFLICT (stage_id, player_id) DO UPDATE SET
    stage_seed = EXCLUDED.stage_seed,
    status = EXCLUDED.status;
  PERFORM public.compat_resequence_single_stage_participants(
    NEW.tournament_id,
    target_stage_id
  );
  UPDATE public.tournament_stages
  SET participant_count = (
    SELECT count(*) FROM public.players
    WHERE tournament_id = NEW.tournament_id
  )
  WHERE id = target_stage_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.compat_count_single_stage_participants_after_delete()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_stage_id INTEGER;
BEGIN
  SELECT id INTO target_stage_id
  FROM public.tournament_stages
  WHERE tournament_id = OLD.tournament_id AND position = 1;
  IF target_stage_id IS NOT NULL THEN
    PERFORM public.compat_resequence_single_stage_participants(
      OLD.tournament_id,
      target_stage_id
    );
  END IF;
  UPDATE public.tournament_stages
  SET participant_count = (
    SELECT count(*) FROM public.players
    WHERE tournament_id = OLD.tournament_id
  )
  WHERE tournament_id = OLD.tournament_id AND position = 1;
  RETURN OLD;
END;
$$;
`, schema);
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
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  ({ signVersionedOrganizerToken: signOrganizerToken } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

describe("0007 stage schema reconciliation", () => {
  test("repairs the Production drift and preserves single- and multi-stage participant semantics", async () => {
    await database.pool.query(oldProductionStateSql(config.schema));

    const oldDefinitions = await database.pool.query(`
      SELECT
        pg_get_constraintdef(constraint_row.oid) AS constraint_definition,
        pg_get_functiondef(sync_function.oid) AS sync_definition,
        pg_get_functiondef(delete_function.oid) AS delete_definition
      FROM pg_constraint constraint_row
      CROSS JOIN pg_proc sync_function
      CROSS JOIN pg_proc delete_function
      WHERE constraint_row.conrelid = 'tournament_stages'::regclass
        AND constraint_row.conname = 'tournament_stages_qualification_configuration'
        AND sync_function.oid = 'compat_sync_single_stage_participant()'::regprocedure
        AND delete_function.oid = 'compat_count_single_stage_participants_after_delete()'::regprocedure
    `);
    assert.equal(oldDefinitions.rows.length, 1);
    assert.doesNotMatch(oldDefinitions.rows[0].constraint_definition, /single_elimination/);
    assert.doesNotMatch(oldDefinitions.rows[0].sync_definition, /stage_count\s*=\s*1/);
    assert.doesNotMatch(oldDefinitions.rows[0].delete_definition, /stage_count\s*=\s*1/);

    const migrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(RECONCILIATION_MIGRATION_URL, "utf8"),
      config.schema,
    ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    await database.pool.query("BEGIN");
    try {
      await database.pool.query(migrationSql);
      await database.pool.query("COMMIT");
    } catch (error) {
      await database.pool.query("ROLLBACK");
      throw error;
    }
    // A second application must remain safe and leave the same validated schema.
    await database.pool.query("BEGIN");
    try {
      await database.pool.query(migrationSql);
      await database.pool.query("COMMIT");
    } catch (error) {
      await database.pool.query("ROLLBACK");
      throw error;
    }

    const repairedDefinitions = await database.pool.query(`
      SELECT
        constraint_row.convalidated,
        pg_get_constraintdef(constraint_row.oid) AS constraint_definition,
        pg_get_functiondef(sync_function.oid) AS sync_definition,
        pg_get_functiondef(delete_function.oid) AS delete_definition
      FROM pg_constraint constraint_row
      CROSS JOIN pg_proc sync_function
      CROSS JOIN pg_proc delete_function
      WHERE constraint_row.conrelid = 'tournament_stages'::regclass
        AND constraint_row.conname = 'tournament_stages_qualification_configuration'
        AND sync_function.oid = 'compat_sync_single_stage_participant()'::regprocedure
        AND delete_function.oid = 'compat_count_single_stage_participants_after_delete()'::regprocedure
    `);
    assert.equal(repairedDefinitions.rows.length, 1);
    assert.equal(repairedDefinitions.rows[0].convalidated, true);
    assert.match(repairedDefinitions.rows[0].constraint_definition, /single_elimination/);
    assert.match(repairedDefinitions.rows[0].sync_definition, /stage_count\s*=\s*1/);
    assert.match(repairedDefinitions.rows[0].delete_definition, /stage_count\s*=\s*1/);

    const multiStage = await request(app)
      .post("/api/tournaments")
      .send({
        organizerPassword: "integration-organizer-password",
        name: `Reconciled eliminations ${randomUUID()}`,
        format: "single_elimination",
        defaultBestOf: 1,
        stagePlan: {
          initialParticipantCount: 32,
          stages: [
            {
              key: "qualifier-32", position: 1, name: "Top 16",
              format: "single_elimination", participantCount: 32,
              advancingCount: 16, bestOf: 1,
            },
            {
              key: "qualifier-16", position: 2, name: "Top 8",
              format: "single_elimination", participantCount: 16,
              advancingCount: 8, bestOf: 3,
            },
            {
              key: "final-8", position: 3, name: "Final",
              format: "single_elimination", participantCount: 8, bestOf: 5,
            },
          ],
        },
      })
      .expect(201);
    const multiStageId = multiStage.body.id as number;
    const multiStageHeaders = {
      "x-organizer-token": await organizerTokenFor(multiStageId),
    };
    assert.deepEqual(await stageParticipantCounts(multiStageId), [32, 16, 8]);

    const player = await request(app)
      .post(`/api/tournaments/${multiStageId}/players`)
      .set(multiStageHeaders)
      .send({ name: `Multi-${randomUUID()}`, seed: 1 })
      .expect(201);
    assert.deepEqual(await stageParticipantCounts(multiStageId), [32, 16, 8]);
    await request(app)
      .delete(`/api/players/${player.body.id}`)
      .set(multiStageHeaders)
      .expect(204);
    assert.deepEqual(await stageParticipantCounts(multiStageId), [32, 16, 8]);

    const singleStage = await request(app)
      .post("/api/tournaments")
      .send({
        organizerPassword: "integration-organizer-password",
        name: `Reconciled legacy ${randomUUID()}`,
        format: "single_elimination",
        defaultBestOf: 3,
      })
      .expect(201);
    const singleStageId = singleStage.body.id as number;
    const singleStageHeaders = {
      "x-organizer-token": await organizerTokenFor(singleStageId),
    };
    const firstSinglePlayer = await request(app)
      .post(`/api/tournaments/${singleStageId}/players`)
      .set(singleStageHeaders)
      .send({ name: `Single-1-${randomUUID()}`, seed: 1 })
      .expect(201);
    const secondSinglePlayer = await request(app)
      .post(`/api/tournaments/${singleStageId}/players`)
      .set(singleStageHeaders)
      .send({ name: `Single-2-${randomUUID()}`, seed: 2 })
      .expect(201);
    assert.ok(firstSinglePlayer.body.id);
    assert.deepEqual(await stageParticipantCounts(singleStageId), [2]);
    await request(app)
      .delete(`/api/players/${secondSinglePlayer.body.id}`)
      .set(singleStageHeaders)
      .expect(204);
    assert.deepEqual(await stageParticipantCounts(singleStageId), [1]);
  });
});
