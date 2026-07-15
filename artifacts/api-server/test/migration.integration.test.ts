import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
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

const MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0001_series_v1_clean_cutover.sql",
  import.meta.url,
);

let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;

async function rows<T = Record<string, unknown>>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  schemaInitialized = true;
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  await database.pool.end();
});

describe("versioned destructive series_v1 migration", () => {
  test("creates the new schema on a fresh test schema", async () => {
    const columns = await rows<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'players'",
    );
    const names = columns.map((column) => column.column_name);
    assert.equal(names.includes("wins"), false);
    assert.equal(names.includes("draws"), false);
    assert.equal(names.includes("losses"), false);
    assert.equal(names.includes("points"), false);
    const [tournament] = await rows<{ result_model_version: string; ranking_policy: string; default_best_of: number }>(
      "INSERT INTO tournaments (name, format, default_best_of) VALUES ('Fresh series', 'single_elimination', 3) RETURNING result_model_version, ranking_policy, default_best_of",
    );
    assert.deepEqual(tournament, {
      result_model_version: "series_v1",
      ranking_policy: "match_record_v1",
      default_best_of: 3,
    });
  });

  test("removes legacy tournament data while preserving an unrelated table", async () => {
    await database.pool.query("CREATE TABLE unrelated_migration_sentinel (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");
    await database.pool.query("INSERT INTO unrelated_migration_sentinel (id, value) VALUES (1, 'preserve-me')");
    await database.pool.query("ALTER TABLE tournaments ADD COLUMN allow_draws BOOLEAN NOT NULL DEFAULT TRUE");
    await database.pool.query("ALTER TABLE players ADD COLUMN wins INTEGER NOT NULL DEFAULT 0, ADD COLUMN draws INTEGER NOT NULL DEFAULT 0, ADD COLUMN losses INTEGER NOT NULL DEFAULT 0, ADD COLUMN points INTEGER NOT NULL DEFAULT 0");
    const [{ id: tournamentId }] = await rows<{ id: number }>(
      "INSERT INTO tournaments (name, format, allow_draws) VALUES ('Legacy data', 'round_robin', TRUE) RETURNING id",
    );
    await database.pool.query(
      "INSERT INTO players (tournament_id, name, wins, draws, losses, points) VALUES ($1, 'Legacy player', 2, 1, 0, 7)",
      [tournamentId],
    );

    const migrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(MIGRATION_URL, "utf8"),
      testConfig.schema,
    );
    await database.pool.query("BEGIN");
    try {
      await database.pool.query(migrationSql);
      await database.pool.query("COMMIT");
    } catch (error) {
      await database.pool.query("ROLLBACK");
      throw error;
    }

    const [{ count: tournamentCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM tournaments");
    const [{ count: playerCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM players");
    assert.equal(tournamentCount, "0");
    assert.equal(playerCount, "0");
    const [sentinel] = await rows<{ value: string }>("SELECT value FROM unrelated_migration_sentinel WHERE id = 1");
    assert.equal(sentinel.value, "preserve-me");
    const legacyColumns = await rows<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND ((table_name = 'tournaments' AND column_name = 'allow_draws') OR (table_name = 'players' AND column_name IN ('wins', 'draws', 'losses', 'points')))",
    );
    assert.deepEqual(legacyColumns, []);
  });

  test("ordinary application startup and the unconfirmed reset script preserve data", async () => {
    await database.pool.query(
      "INSERT INTO tournaments (name, format) VALUES ('Must survive ordinary start', 'single_elimination')",
    );
    const [{ count: beforeCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM tournaments");

    delete process.env.ALLOW_DESTRUCTIVE_TOURNAMENT_RESET;
    const guardUrl = new URL(
      `../../../lib/db/scripts/destructive-series-v1-reset.mjs?guard=${Date.now()}`,
      import.meta.url,
    );
    await assert.rejects(import(guardUrl.href), /Refusing destructive tournament reset/);
    await import("../src/app");

    const [{ count: afterCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM tournaments");
    assert.equal(afterCount, beforeCount);
  });
});
