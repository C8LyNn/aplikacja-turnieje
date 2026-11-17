import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
let initialized = false;
const legacySchema = "tm_test_schema_guard_legacy";

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.DATABASE_URL = config.connectionString;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
});

after(async () => {
  await database.pool.query(`DROP SCHEMA IF EXISTS "${legacySchema}" CASCADE`);
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

test("a fully migrated schema passes the startup guard", async () => {
  const { assertSchemaCompatible } = await import("../src/lib/schema-guard");
  const report = await assertSchemaCompatible(database.pool);
  assert.equal(report.compatible, true);
  assert.equal(report.schema, config.schema);
});

test("a pre-V5 schema is refused with a clear, credential-free reason", async () => {
  const { assertSchemaCompatible, SchemaIncompatibleError } = await import("../src/lib/schema-guard");
  await database.pool.query(`DROP SCHEMA IF EXISTS "${legacySchema}" CASCADE`);
  await database.pool.query(`CREATE SCHEMA "${legacySchema}"`);
  await database.pool.query(`CREATE TABLE "${legacySchema}".tournaments (id serial PRIMARY KEY)`);
  await database.pool.query(`CREATE TABLE "${legacySchema}".tournament_stages (id serial PRIMARY KEY, format text)`);
  await database.pool.query(`CREATE TABLE "${legacySchema}".players (id serial PRIMARY KEY, tournament_id integer)`);
  const url = new URL(config.connectionString);
  url.searchParams.set("options", `-c search_path=${legacySchema}`);
  // A second pool of the same driver, bound to the legacy schema.
  const Pool = database.pool.constructor as new (options: { connectionString: string; max: number }) => typeof database.pool;
  const client = new Pool({ connectionString: url.toString(), max: 1 });
  try {
    await assert.rejects(assertSchemaCompatible(client), (error: Error) => {
      assert.ok(error instanceof SchemaIncompatibleError);
      assert.match(error.message, /0041_round_robin_legs\.sql absent/);
      assert.match(error.message, /0042_tournament_teams\.sql absent/);
      assert.match(error.message, /migrate:v5/);
      assert.doesNotMatch(error.message, /postgres(ql)?:\/\//);
      return true;
    });
    // One applied migration is still incompatible (the second is missing).
    await client.query(`ALTER TABLE tournament_stages ADD COLUMN round_robin_legs smallint NOT NULL DEFAULT 1,
      ADD CONSTRAINT tournament_stages_round_robin_legs_supported CHECK (round_robin_legs IN (1, 2))`);
    await assert.rejects(assertSchemaCompatible(client), /0042_tournament_teams\.sql absent/);
  } finally {
    await client.end();
  }
});

test("startup runs the guard before the HTTP app is loaded", async () => {
  const source = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");
  const guard = source.indexOf("assertSchemaCompatible(pool)");
  assert.ok(guard > 0);
  assert.ok(guard < source.indexOf('await import("./app")'));
});
