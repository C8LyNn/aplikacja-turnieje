import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadCatalogPreflightConfig, inspectCatalogPreflight,
} from "../scripts/preflight-game-catalog.mjs";

const validConfig = {
  CATALOG_PREFLIGHT_DATABASE_URL: "postgresql://observer:secret@staging.db.example:5432/catalog_qa?sslmode=require",
  CATALOG_PREFLIGHT_EXPECTED_HOST: "staging.db.example",
  CATALOG_PREFLIGHT_EXPECTED_DATABASE: "catalog_qa",
  CATALOG_PREFLIGHT_EXPECTED_SCHEMA: "public",
  CATALOG_PREFLIGHT_ENVIRONMENT: "staging",
};

const tables = [
  "steam_catalog_games", "steam_catalog_terms", "steam_catalog_game_terms",
  "steam_catalog_status_counts", "steam_catalog_import_jobs",
  "steam_catalog_source_poll_limiter",
];

function fakeClient({
  missingColumn = null, missingIndex = null,
  triggerDisabled = null, actualGames = "12", countedGames = "12",
  databaseName = "catalog_qa",
} = {}) {
  const calls = [];
  const columns = [
    ...["steam_app_id", "name", "status", "classification_revision", "steam_raw_data"]
      .map((column_name) => ({
        table_name: "steam_catalog_games", column_name, data_type: "text", is_nullable: "NO",
      })),
    ...["source", "next_allowed_at", "updated_at"].map((column_name) => ({
      table_name: "steam_catalog_source_poll_limiter", column_name,
      data_type: "text", is_nullable: "NO",
    })),
    ...["id", "unclassified", "review", "ready"].map((column_name) => ({
      table_name: "steam_catalog_status_counts", column_name,
      data_type: "bigint", is_nullable: "NO",
    })),
    ...["id", "source", "source_page", "steam_cursor", "pending", "has_more", "retry_count",
      "max_games", "processed", "inserted", "existing", "ignored", "failed",
      "scanned", "status", "lease_token", "lease_expires_at", "next_run_at"].map((column_name) => ({
      table_name: "steam_catalog_import_jobs", column_name,
      data_type: column_name === "source" ? "text" :
        column_name === "source_page" ? "integer" : "text",
      is_nullable: "NO",
    })),
  ].filter((row) => row.table_name + "." + row.column_name !== missingColumn);
  const indexNames = [
    "steam_catalog_games_app_id_uidx",
    "steam_catalog_import_jobs_single_active_idx",
  ];
  const triggerNames = [
    "steam_catalog_count_insert", "steam_catalog_count_update",
    "steam_catalog_count_delete",
  ];
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith("BEGIN") || sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("current_database()")) return { rows: [{ name: databaseName }] };
      if (sql.includes("information_schema.tables")) {
        return { rows: tables.map((table_name) => ({ table_name })) };
      }
      if (sql.includes("information_schema.columns")) return { rows: columns };
      if (sql.includes("FROM pg_index")) return { rows: indexNames
        .filter((name) => name !== missingIndex)
        .map((name) => ({ name, valid: true, unique: true })) };
      if (sql.includes("FROM pg_trigger")) return { rows: triggerNames
        .map((name) => ({ name, enabled: name === triggerDisabled ? "D" : "O" })) };
      if (sql.includes("AS counter_rows")) return { rows: [{
        total: actualGames, counted: countedGames, counter_rows: 1,
      }] };
      throw new Error("Unexpected SQL: " + sql.slice(0, 100));
    },
  };
}

test("preflight configuration requires explicit exact host, database and environment", () => {
  const config = loadCatalogPreflightConfig(validConfig);
  assert.equal(config.expectedDatabase, "catalog_qa");
  assert.equal(config.schema, "public");
  assert.equal(config.environment, "staging");
  assert.throws(() => loadCatalogPreflightConfig({
    ...validConfig, CATALOG_PREFLIGHT_EXPECTED_HOST: "production.db.example",
  }), /Host does not match/);
  assert.throws(() => loadCatalogPreflightConfig({
    ...validConfig, CATALOG_PREFLIGHT_EXPECTED_DATABASE: "prod",
  }), /Database name/);
  assert.throws(() => loadCatalogPreflightConfig({
    ...validConfig, CATALOG_PREFLIGHT_EXPECTED_SCHEMA: "public;DROP TABLE",
  }), /Invalid expected schema/);
  assert.throws(() => loadCatalogPreflightConfig({
    ...validConfig, CATALOG_PREFLIGHT_DATABASE_URL: "file:///tmp/cache",
  }), /Preflight requires/);
  assert.throws(() => loadCatalogPreflightConfig({
    ...validConfig, CATALOG_PREFLIGHT_DATABASE_URL: "postgres://observer:secret@staging.db.example/catalog_qa?options=-c%20search_path%3Dpublic",
  }), /Remove search_path/);
});

test("production read-only inspection requires an explicit separate permission flag", () => {
  const production = {
    ...validConfig, CATALOG_PREFLIGHT_ENVIRONMENT: "production",
  };
  assert.throws(() => loadCatalogPreflightConfig(production), /Production inspection requires/);
  assert.equal(loadCatalogPreflightConfig({
    ...production, CATALOG_PREFLIGHT_ALLOW_PRODUCTION: "YES_READ_ONLY",
  }).environment, "production");
});

test("complete schema preflight passes without writing and hides credentials", async () => {
  const client = fakeClient();
  const result = await inspectCatalogPreflight(client, loadCatalogPreflightConfig(validConfig));
  assert.equal(result.passed, true);
  assert.deepEqual(result.counts, { games: "12", counted: "12" });
  assert.ok(result.checks.length >= 35);
  assert.equal(client.calls[0].sql, "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
  for (const { sql } of client.calls) {
    assert.doesNotMatch(sql, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|COMMIT|CREATE|TRUNCATE)\b/i);
  }
  assert.doesNotMatch(JSON.stringify(result), /observer|secret|staging.db.example/);
});

test("missing 0038 column, invalid index, disabled trigger and counter drift fail closed", async () => {
  const client = fakeClient({
    missingColumn: "steam_catalog_import_jobs.source_page",
    missingIndex: "steam_catalog_import_jobs_single_active_idx",
    triggerDisabled: "steam_catalog_count_update",
    actualGames: "13", countedGames: "12",
  });
  const result = await inspectCatalogPreflight(client, loadCatalogPreflightConfig(validConfig));
  assert.equal(result.passed, false);
  for (const name of [
    "column:steam_catalog_import_jobs.source_page",
    "source_page_type",
    "unique_index:steam_catalog_import_jobs_single_active_idx",
    "trigger:steam_catalog_count_update",
    "exact_counts",
  ]) {
    assert.equal(result.checks.find((item) => item.name === name)?.passed, false, name);
  }
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
});

test("a mismatched live database identity is rejected by report", async () => {
  const client = fakeClient({ databaseName: "wrong_db" });
  const result = await inspectCatalogPreflight(client, loadCatalogPreflightConfig(validConfig));
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((item) => item.name === "database_identity")?.passed, false);
});
