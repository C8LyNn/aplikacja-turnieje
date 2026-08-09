import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import pg from "pg";
import { compareReplitSchemaCatalogs } from "../scripts/compare-replit-schema-catalogs.mjs";

const DEVELOPMENT_DATABASE_URL =
  process.env.SCHEMA_COMPARE_TEST_DEVELOPMENT_DATABASE_URL?.trim();
const PRODUCTION_DATABASE_URL =
  process.env.SCHEMA_COMPARE_TEST_PRODUCTION_DATABASE_URL?.trim();
const ENABLED = Boolean(
  DEVELOPMENT_DATABASE_URL &&
    PRODUCTION_DATABASE_URL &&
    process.env.SCHEMA_COMPARE_TEST_CONFIRM ===
      "USE_TWO_ISOLATED_SCHEMA_COMPARE_DATABASES",
);
const MIGRATION_TRANSACTION_BLOCK =
  /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const MIGRATION_NAMES = [
  "series_v1_clean_cutover",
  "tournament_stages_v1",
  "flexible_group_stages_v2",
  "configurable_seeding_v2",
  "stage_participant_flow",
  "fix_multistage_participant_compat",
  "reconcile_stage_schema",
  "restore_stage_procedural_objects",
  "reconcile_composite_foreign_keys",
  "auth_credential_rate_limits",
  "reconcile_replit_schema_catalog",
];
const MIGRATIONS = MIGRATION_NAMES.map((name, index) => {
  const number = String(index + 1).padStart(4, "0");
  return new URL(`../migrations/${number}_${name}.sql`, import.meta.url);
});

function isolatedDatabase(url, label) {
  assert.ok(url);
  const parsed = new URL(url);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  assert.ok(new Set(["127.0.0.1", "localhost", "::1"]).has(parsed.hostname));
  assert.notEqual(parsed.port || "5432", "5432");
  assert.match(databaseName, /test/i);
  assert.doesNotMatch(`${parsed.hostname}/${databaseName}`, /prod/i);
  return { label, databaseUrl: url, expectedDatabase: databaseName };
}

function comparisonConfig() {
  const development = isolatedDatabase(DEVELOPMENT_DATABASE_URL, "development");
  const production = isolatedDatabase(PRODUCTION_DATABASE_URL, "production");
  assert.notEqual(development.databaseUrl, production.databaseUrl);
  assert.notEqual(development.expectedDatabase, production.expectedDatabase);
  return { development, production, expectedSchema: "public" };
}

async function migrationSql(index) {
  const sql = await readFile(MIGRATIONS[index - 1], "utf8");
  return new Set([2, 7, 8, 9, 10, 11]).has(index)
    ? sql.replace(MIGRATION_TRANSACTION_BLOCK, "")
    : sql;
}

async function resetCanonicalDatabase(databaseUrl) {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public");
    for (let index = 1; index <= MIGRATIONS.length; index += 1) {
      await client.query(await migrationSql(index));
    }
  } finally {
    await client.end();
  }
}

describe("two-database read-only Replit schema catalog comparison", () => {
  test(
    "reports equivalent canonical Development and Production catalogs",
    { skip: !ENABLED },
    async () => {
      const config = comparisonConfig();
      await resetCanonicalDatabase(config.development.databaseUrl);
      await resetCanonicalDatabase(config.production.databaseUrl);

      const report = await compareReplitSchemaCatalogs(config);

      assert.equal(report.safe, true, [
        ...report.development.problems,
        ...report.production.problems,
      ].join("\n"));
      assert.equal(report.equivalent, true);
      assert.deepEqual(report.development.problems, []);
      assert.deepEqual(report.production.problems, []);
      assert.equal(report.development.target.transactionReadOnly, "on");
      assert.equal(report.production.target.transactionReadOnly, "on");
    },
  );

  test(
    "reports a controlled catalog difference without repairing either database",
    { skip: !ENABLED },
    async () => {
      const config = comparisonConfig();
      await resetCanonicalDatabase(config.development.databaseUrl);
      await resetCanonicalDatabase(config.production.databaseUrl);
      const fixtureClient = new pg.Client({
        connectionString: config.production.databaseUrl,
      });
      await fixtureClient.connect();
      try {
        await fixtureClient.query(
          "DROP INDEX public.auth_credential_rate_limits_cleanup_idx",
        );
      } finally {
        await fixtureClient.end();
      }

      const report = await compareReplitSchemaCatalogs(config);

      assert.equal(report.safe, false);
      assert.equal(report.equivalent, false);
      assert.equal(report.development.safe, true);
      assert.equal(report.production.safe, false);
      assert.equal(report.development.target.transactionReadOnly, "on");
      assert.equal(report.production.target.transactionReadOnly, "on");
      assert.match(
        report.production.problems.join("\n"),
        /auth_credential_rate_limits_cleanup_idx/,
      );
    },
  );
});
