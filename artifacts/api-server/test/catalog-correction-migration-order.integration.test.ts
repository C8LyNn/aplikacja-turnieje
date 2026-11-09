import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  dropTestSchema, getSafeTestDatabaseConfig,
  renderSeriesV1MigrationForTestSchema, resetTestSchema,
} from "./test-database";

test("catalog migrations coexist with unchanged organizer correction migrations", async () => {
  const config = getSafeTestDatabaseConfig({
    ...process.env, TEST_DATABASE_SCHEMA: "tm_test_catalog_corrections",
  });
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  const { pool } = await import("@workspace/db");
  const migrations = [
    "0029_steam_game_catalog_v1.sql",
    "0030_controlled_correction_operations.sql",
    "0031_atomic_correction_receipts.sql",
    "0032_steam_catalog_abstract_world.sql",
    "0033_steam_catalog_pagination_indexes.sql",
    "0034_steam_catalog_classification_revision.sql",
    "0035_steam_catalog_trigram_search.sql",
    "0036_steam_catalog_exact_status_counters.sql",
    "0037_steam_catalog_import_jobs.sql",
    "0038_steam_catalog_import_job_sources.sql",
    "0039_steam_catalog_import_retry_backoff.sql",
    "0040_steam_catalog_global_source_throttle.sql",
  ];
  try {
    await resetTestSchema(pool, config.schema);
    for (const file of migrations) {
      const sql = await readFile(new URL("../../../lib/db/migrations/" + file, import.meta.url), "utf8");
      await pool.query(renderSeriesV1MigrationForTestSchema(sql, config.schema));
    }
    const result = await pool.query<{ table_name: string; column_name: string }>(
      "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=$1",
      [config.schema],
    );
    const columns = new Set(result.rows.map((row) => row.table_name + "." + row.column_name));
    for (const required of [
      "tournament_correction_operations.completion_action_id",
      "tournament_correction_operations.corrected_match_revision",
      "steam_catalog_games.classification_revision",
      "steam_catalog_status_counts.review",
      "steam_catalog_import_jobs.next_run_at",
    ]) assert.ok(columns.has(required), required);
    const counts = await pool.query("SELECT unclassified,review,ready FROM steam_catalog_status_counts");
    assert.equal(counts.rows.length, 1);
  } finally {
    await dropTestSchema(pool, config.schema);
    await pool.end();
  }
});
