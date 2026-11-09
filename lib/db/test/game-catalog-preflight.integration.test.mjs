import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import pg from "pg";
import { inspectCatalogPreflight } from "../scripts/preflight-game-catalog.mjs";

const { Client } = pg;
const TEST_SCHEMA = "tm_test_catalog_preflight";
const migrations = [
  "0029_steam_game_catalog_v1.sql",
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

function configFromEnvironment(env = process.env) {
  if (!env.NODE_TEST_CONTEXT || env.TEST_DATABASE_RESET !== "DROP_TM_TEST_SCHEMA") {
    throw new Error("Refusing catalog preflight integration outside a confirmed Node test runner.");
  }
  const raw = env.TEST_DATABASE_URL;
  if (!raw) throw new Error("TEST_DATABASE_URL is required.");
  const url = new URL(raw);
  const db = decodeURIComponent(url.pathname.replace(/^\/+/, "")).toLowerCase();
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !db.includes("test") || (url.hostname + db).toLowerCase().includes("prod")) {
    throw new Error("Refusing catalog preflight integration on non-test database.");
  }
  return { connectionString: raw, expectedDatabase: db, schema: TEST_SCHEMA,
    environment: "staging" };
}

test("actual PostgreSQL 16 catalog preflight sees migrated schema and detects broken counters", async () => {
  const config = configFromEnvironment();
  const client = new Client({ connectionString: config.connectionString });
  await client.connect();
  try {
    // Own disposable schema, never public; guard above refuses non-test DBs.
    await client.query('DROP SCHEMA IF EXISTS "' + TEST_SCHEMA + '" CASCADE');
    await client.query('CREATE SCHEMA "' + TEST_SCHEMA + '"');
    await client.query('SET search_path TO "' + TEST_SCHEMA + '"');
    for (const file of migrations) {
      const sql = await readFile(new URL("../migrations/" + file, import.meta.url), "utf8");
      await client.query(sql);
    }
    // Complete migration set should pass with an empty but initialized catalog.
    const ready = await inspectCatalogPreflight(client, config);
    assert.equal(ready.passed, true, JSON.stringify(ready.checks.filter((x) => !x.passed)));
    assert.deepEqual(ready.counts, { games: "0", counted: "0" });

    await client.query("INSERT INTO steam_catalog_games (steam_app_id,name,steam_url) VALUES (1900901,'Preflight test game','https://store.steampowered.com/app/1900901')");
    const withGame = await inspectCatalogPreflight(client, config);
    assert.equal(withGame.passed, true);
    assert.deepEqual(withGame.counts, { games: "1", counted: "1" });

    // Mutate only the disposable test schema to model a missing counter trigger.
    await client.query("ALTER TABLE steam_catalog_games DISABLE TRIGGER steam_catalog_count_insert");
    await client.query("INSERT INTO steam_catalog_games (steam_app_id,name,steam_url) VALUES (1900902,'Another game','https://store.steampowered.com/app/1900902')");
    const broken = await inspectCatalogPreflight(client, config);
    assert.equal(broken.passed, false);
    assert.ok(broken.checks.some((x) => x.name === "exact_counts" && !x.passed));
    assert.ok(broken.checks.some((x) =>
      x.name === "trigger:steam_catalog_count_insert" && !x.passed));
  } finally {
    await client.query('DROP SCHEMA IF EXISTS "' + TEST_SCHEMA + '" CASCADE');
    await client.end();
  }
});
