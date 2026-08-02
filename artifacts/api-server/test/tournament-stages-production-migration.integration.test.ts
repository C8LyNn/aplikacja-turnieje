import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  renderSeriesV1MigrationForTestSchema,
  type TestDatabaseConfig,
} from "./test-database";
// @ts-expect-error The production migration runner intentionally stays plain ESM for direct Node execution.
import { renderTournamentStagesConsoleMigration } from "../../../lib/db/scripts/migrate-tournament-stages-v1.mjs";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

const SERIES_V1_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0001_series_v1_clean_cutover.sql",
  import.meta.url,
);
const STAGES_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0002_tournament_stages_v1.sql",
  import.meta.url,
);

let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaCreated = false;

async function rows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  database = (await import("@workspace/db")) as DatabaseModule;
  await database.pool.query(`DROP SCHEMA IF EXISTS "${config.schema}" CASCADE`);
  await database.pool.query(`CREATE SCHEMA "${config.schema}"`);
  await database.pool.query(`SET search_path TO "${config.schema}"`);
  schemaCreated = true;
  const seriesSql = renderSeriesV1MigrationForTestSchema(
    await readFile(SERIES_V1_MIGRATION_URL, "utf8"),
    config.schema,
  );
  await database.pool.query(seriesSql);
  await database.pool.query(`
    INSERT INTO "${config.schema}".app_schema_migrations (
      migration_key, app_commit, target_schema, deployment_environment
    ) VALUES (
      'series_v1_clean_cutover', 'verified-series-v1-fixture',
      '${config.schema}', 'production'
    );
  `);
});

after(async () => {
  if (schemaCreated) await dropTestSchema(database.pool, config.schema);
  await database.pool.end();
});

test("migrates two linked legacy matches through the idempotent Production console script", async () => {
  const [tournament] = await rows<{ id: number }>(
    `INSERT INTO tournaments (
       name, format, status, default_best_of, current_round, total_rounds
     ) VALUES ('Production legacy fixture', 'single_elimination', 'active', 3, 1, 2)
     RETURNING id`,
  );
  const players: number[] = [];
  for (let seed = 1; seed <= 4; seed += 1) {
    const [player] = await rows<{ id: number }>(
      "INSERT INTO players (tournament_id, name, seed) VALUES ($1, $2, $3) RETURNING id",
      [tournament.id, `Legacy player ${seed}`, seed],
    );
    players.push(player.id);
  }
  const [semifinal] = await rows<{ id: number }>(
    `INSERT INTO matches (
       tournament_id, round, match_number, player1_id, player2_id, best_of
     ) VALUES ($1, 1, 1, $2, $3, 3) RETURNING id`,
    [tournament.id, players[0], players[1]],
  );
  const [final] = await rows<{ id: number }>(
    `INSERT INTO matches (tournament_id, round, match_number, best_of)
     VALUES ($1, 2, 1, 3) RETURNING id`,
    [tournament.id],
  );
  await database.pool.query("UPDATE matches SET next_match_id = $1 WHERE id = $2", [
    final.id,
    semifinal.id,
  ]);

  const databaseName = decodeURIComponent(
    new URL(config.connectionString).pathname.replace(/^\//, ""),
  );
  const migrationSql = renderTournamentStagesConsoleMigration(
    await readFile(STAGES_MIGRATION_URL, "utf8"),
    config.schema,
  )
    .replaceAll("__EXPECTED_DATABASE_NAME__", databaseName)
    .replaceAll(
      "__DEPLOYED_APP_COMMIT__",
      "0123456789abcdef0123456789abcdef01234567",
    );
  await database.pool.query(migrationSql);

  const [stage] = await rows<{
    id: number;
    name: string;
    stage_key: string;
    participant_count: number;
  }>(
    `SELECT id, name, stage_key, participant_count
     FROM tournament_stages WHERE tournament_id = $1`,
    [tournament.id],
  );
  assert.deepEqual(
    { name: stage.name, stageKey: stage.stage_key, participantCount: stage.participant_count },
    { name: "Etap 1", stageKey: "stage-1", participantCount: 4 },
  );
  assert.equal(
    (await rows<{ count: number }>(
      "SELECT count(*)::int AS count FROM stage_participants WHERE stage_id = $1",
      [stage.id],
    ))[0].count,
    4,
  );

  const migratedMatches = await rows<{
    id: number;
    stage_id: number;
    next_match_id: number | null;
  }>("SELECT id, stage_id, next_match_id FROM matches ORDER BY id");
  assert.equal(migratedMatches.length, 2);
  assert.ok(migratedMatches.every((match) => match.stage_id === stage.id));
  assert.equal(migratedMatches[0].next_match_id, final.id);
  assert.equal(migratedMatches[1].next_match_id, null);

  const [stageColumn] = await rows<{ required: boolean }>(
    `SELECT attribute.attnotnull AS required
     FROM pg_attribute attribute
     WHERE attribute.attrelid = to_regclass($1)
       AND attribute.attname = 'stage_id' AND NOT attribute.attisdropped`,
    [`${config.schema}.matches`],
  );
  assert.equal(stageColumn.required, true);

  const constraints = await rows<{
    conname: string;
    contype: string;
    delete_action: string | null;
    columns: string[];
    referenced_columns: string[];
  }>(
    `SELECT constraint_row.conname, constraint_row.contype,
            CASE WHEN constraint_row.contype = 'f'
              THEN constraint_row.confdeltype::text ELSE NULL END AS delete_action,
            ARRAY(
              SELECT attribute.attname::text
              FROM unnest(constraint_row.conkey) WITH ORDINALITY AS key(attnum, position)
              JOIN pg_attribute attribute
                ON attribute.attrelid = constraint_row.conrelid AND attribute.attnum = key.attnum
              ORDER BY key.position
            ) AS columns,
            ARRAY(
              SELECT attribute.attname::text
              FROM unnest(constraint_row.confkey) WITH ORDINALITY AS key(attnum, position)
              JOIN pg_attribute attribute
                ON attribute.attrelid = constraint_row.confrelid AND attribute.attnum = key.attnum
              ORDER BY key.position
            ) AS referenced_columns
     FROM pg_constraint constraint_row
     WHERE constraint_row.conrelid = to_regclass($1)
       AND constraint_row.conname IN (
         'matches_id_stage_id_unique', 'matches_next_match_same_stage_fk'
       )
     ORDER BY constraint_row.conname`,
    [`${config.schema}.matches`],
  );
  assert.deepEqual(constraints, [
    {
      conname: "matches_id_stage_id_unique",
      contype: "u",
      delete_action: null,
      columns: ["id", "stage_id"],
      referenced_columns: [],
    },
    {
      conname: "matches_next_match_same_stage_fk",
      contype: "f",
      delete_action: "a",
      columns: ["next_match_id", "stage_id"],
      referenced_columns: ["id", "stage_id"],
    },
  ]);

  const countsBeforeRepeat = await rows<{ stages: number; participants: number; matches: number }>(
    `SELECT
       (SELECT count(*)::int FROM tournament_stages) AS stages,
       (SELECT count(*)::int FROM stage_participants) AS participants,
       (SELECT count(*)::int FROM matches) AS matches`,
  );
  await database.pool.query(migrationSql);
  const countsAfterRepeat = await rows<{ stages: number; participants: number; matches: number }>(
    `SELECT
       (SELECT count(*)::int FROM tournament_stages) AS stages,
       (SELECT count(*)::int FROM stage_participants) AS participants,
       (SELECT count(*)::int FROM matches) AS matches`,
  );
  assert.deepEqual(countsAfterRepeat, countsBeforeRepeat);
  const markers = await rows<{
    app_commit: string;
    target_schema: string;
    deployment_environment: string;
  }>(
    `SELECT app_commit, target_schema, deployment_environment
     FROM app_schema_migrations WHERE migration_key = 'tournament_stages_v1'`,
  );
  assert.deepEqual(markers, [
    {
      app_commit: "0123456789abcdef0123456789abcdef01234567",
      target_schema: config.schema,
      deployment_environment: "production",
    },
  ]);
});
