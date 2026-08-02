import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { after, before, beforeEach, describe, test } from "node:test";
import pg from "pg";
import {
  ADVISORY_LOCK_KEYS,
  DELETE_CONFIRMATION,
  DEVELOPMENT_DELETE_CONFIRMATION,
  DOMAIN_TABLES,
  DOMAIN_TYPES,
  MIGRATION_KEY,
} from "../scripts/series-v1-reset-plan.mjs";
import {
  loadDestructiveResetConfig,
  performDestructiveSeriesV1Reset,
} from "../scripts/series-v1-reset-runtime.mjs";

const { Client } = pg;
const TEMP_CLUSTER_CONFIRMATION = "USE_ISOLATED_TEMPORARY_POSTGRES_CLUSTER";
const PREFLIGHT_SCRIPT = fileURLToPath(
  new URL("../scripts/preflight-series-v1-reset.mjs", import.meta.url),
);
const RESET_SCRIPT = fileURLToPath(
  new URL("../scripts/destructive-series-v1-reset.mjs", import.meta.url),
);
const DEVELOPMENT_RESET_SCRIPT = fileURLToPath(
  new URL("../scripts/destructive-development-series-v1-reset.mjs", import.meta.url),
);
const MIGRATION_URL = new URL(
  "../migrations/0001_series_v1_clean_cutover.sql",
  import.meta.url,
);
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

const LEGACY_FIXTURE_SQL = `
  CREATE TYPE public.tournament_format AS ENUM ('single_elimination', 'round_robin', 'swiss');
  CREATE TYPE public.tournament_status AS ENUM ('draft', 'active', 'completed');
  CREATE TYPE public.player_status AS ENUM ('active', 'eliminated', 'winner');
  CREATE TYPE public.match_status AS ENUM ('pending', 'in_progress', 'postponed', 'completed', 'cancelled');

  CREATE TABLE public.tournaments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    format public.tournament_format NOT NULL,
    status public.tournament_status NOT NULL DEFAULT 'draft',
    allow_draws BOOLEAN NOT NULL DEFAULT FALSE
  );
  CREATE TABLE public.players (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status public.player_status NOT NULL DEFAULT 'active',
    wins INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE public.matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL DEFAULT 1,
    match_number INTEGER NOT NULL DEFAULT 1,
    score1 INTEGER,
    score2 INTEGER,
    winner_id INTEGER REFERENCES public.players(id),
    best_of INTEGER DEFAULT 1,
    status public.match_status NOT NULL DEFAULT 'pending'
  );
  CREATE TABLE public.result_history (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES public.matches(id) ON DELETE CASCADE,
    tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE
  );
  CREATE TABLE public.action_log (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE
  );
  CREATE TABLE public.support_sessions (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE
  );
  CREATE TABLE public.auth_audit_log (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES public.tournaments(id) ON DELETE CASCADE
  );

  INSERT INTO public.tournaments (name, format, allow_draws)
    VALUES ('Legacy tournament', 'single_elimination', TRUE);
  INSERT INTO public.players (tournament_id, name, wins, draws, losses, points)
    VALUES (1, 'Legacy player', 2, 1, 0, 7);
`;

let connectionString;
let databaseName;
let adminClient;
let migrationSql;

function isolatedTestDatabaseUrl() {
  if (process.env.SERIES_V1_RESET_TEST_CONFIRM !== TEMP_CLUSTER_CONFIRMATION) {
    throw new Error(
      `SERIES_V1_RESET_TEST_CONFIRM must equal ${TEMP_CLUSTER_CONFIRMATION}.`,
    );
  }
  const raw = process.env.SERIES_V1_RESET_TEST_DATABASE_URL;
  if (!raw) throw new Error("SERIES_V1_RESET_TEST_DATABASE_URL is required.");
  const parsed = new URL(raw);
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("Reset safety tests require PostgreSQL.");
  }
  if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw new Error("Reset safety tests require a loopback-only temporary cluster.");
  }
  if (!parsed.port || parsed.port === "5432") {
    throw new Error("Reset safety tests refuse the default PostgreSQL port.");
  }
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!name.toLowerCase().includes("test")) {
    throw new Error("Reset safety tests require a database name containing test.");
  }
  return { connectionString: parsed.toString(), databaseName: name };
}

function resetEnvironment(url = connectionString) {
  return {
    DATABASE_URL: url,
    ALLOW_DESTRUCTIVE_TOURNAMENT_RESET: "true",
    EXPECTED_DATABASE_NAME: databaseName,
    EXPECTED_DATABASE_SCHEMA: "public",
    EXPECTED_DEPLOYMENT_ENVIRONMENT: "production",
    DEPLOYMENT_ENVIRONMENT: "production",
    CONFIRM_TOURNAMENT_DATA_DELETION: DELETE_CONFIRMATION,
    APP_COMMIT: "test-commit-series-v1-safety",
  };
}

function developmentResetEnvironment(url = connectionString) {
  return {
    DEVELOPMENT_DATABASE_URL: url,
    ALLOW_DESTRUCTIVE_DEVELOPMENT_TOURNAMENT_RESET: "true",
    EXPECTED_DEVELOPMENT_DATABASE_NAME: databaseName,
    EXPECTED_DEVELOPMENT_DATABASE_SCHEMA: "public",
    EXPECTED_DEVELOPMENT_ENVIRONMENT: "development",
    DEVELOPMENT_ENVIRONMENT: "development",
    CONFIRM_DEVELOPMENT_TOURNAMENT_DATA_DELETION:
      DEVELOPMENT_DELETE_CONFIRMATION,
    DEVELOPMENT_APP_COMMIT: "test-development-series-v1-safety",
  };
}

function runCli(script, overrides = {}, url = connectionString) {
  const env = { ...process.env, ...resetEnvironment(url), ...overrides };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: REPO_ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

function runDevelopmentCli(overrides = {}, url = connectionString) {
  const env = {
    ...process.env,
    ...developmentResetEnvironment(url),
    ...overrides,
  };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [DEVELOPMENT_RESET_SCRIPT], {
      cwd: REPO_ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

async function resetPublicSchema() {
  await adminClient.query("DROP SCHEMA IF EXISTS shadow CASCADE");
  await adminClient.query("DROP SCHEMA IF EXISTS public CASCADE");
  await adminClient.query("CREATE SCHEMA public AUTHORIZATION CURRENT_USER");
}

async function createLegacyFixture() {
  await adminClient.query(LEGACY_FIXTURE_SQL);
}

async function scalar(sql, values = []) {
  return (await adminClient.query(sql, values)).rows[0]?.value;
}

async function assertLegacyDataIntact() {
  assert.equal(
    await scalar("SELECT count(*)::int AS value FROM public.tournaments"),
    1,
  );
  assert.equal(
    await scalar("SELECT count(*)::int AS value FROM public.players"),
    1,
  );
  assert.equal(
    await scalar("SELECT to_regclass('public.app_schema_migrations') IS NULL AS value"),
    true,
  );
}

async function markerCount() {
  return scalar(
    "SELECT count(*)::int AS value FROM public.app_schema_migrations WHERE migration_key = $1",
    [MIGRATION_KEY],
  );
}

before(async () => {
  const config = isolatedTestDatabaseUrl();
  connectionString = config.connectionString;
  databaseName = config.databaseName;
  migrationSql = await readFile(MIGRATION_URL, "utf8");
  adminClient = new Client({ connectionString });
  await adminClient.connect();
});

beforeEach(async () => {
  await resetPublicSchema();
});

after(async () => {
  if (!adminClient) return;
  await resetPublicSchema();
  await adminClient.end();
});

describe("isolated series_v1 deployment reset safety", () => {
  test("refuses a missing destructive flag before attempting a connection", async () => {
    const result = await runCli(
      RESET_SCRIPT,
      { ALLOW_DESTRUCTIVE_TOURNAMENT_RESET: undefined },
      "postgresql://invalid.invalid/should-not-connect",
    );
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /Refusing destructive tournament reset/);
    assert.doesNotMatch(result.stderr, /ENOTFOUND|connect ECONN/);
  });

  test("refuses a missing deletion phrase without changing legacy data", async () => {
    await createLegacyFixture();
    const result = await runCli(RESET_SCRIPT, {
      CONFIRM_TOURNAMENT_DATA_DELETION: undefined,
    });
    assert.notEqual(result.code, 0);
    await assertLegacyDataIntact();
  });

  test("refuses an unexpected database name without changing legacy data", async () => {
    await createLegacyFixture();
    const result = await runCli(RESET_SCRIPT, {
      EXPECTED_DATABASE_NAME: "different_database",
    });
    assert.notEqual(result.code, 0);
    assert.match(result.stdout + result.stderr, /identifies database/);
    await assertLegacyDataIntact();
  });

  test("refuses any target schema other than public", async () => {
    await createLegacyFixture();
    const result = await runCli(RESET_SCRIPT, {
      EXPECTED_DATABASE_SCHEMA: "shadow",
    });
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /must equal public/);
    await assertLegacyDataIntact();
  });

  test("refuses a deployment environment mismatch", async () => {
    await createLegacyFixture();
    const result = await runCli(RESET_SCRIPT, {
      DEPLOYMENT_ENVIRONMENT: "staging",
    });
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /does not match/);
    await assertLegacyDataIntact();
  });

  test("targets only public even when search_path starts with another schema", async () => {
    await createLegacyFixture();
    await adminClient.query("CREATE SCHEMA shadow");
    await adminClient.query("CREATE TABLE shadow.tournaments (id int primary key, note text)");
    await adminClient.query("CREATE TABLE shadow.players (id int primary key, note text)");
    await adminClient.query("INSERT INTO shadow.tournaments VALUES (1, 'keep')");
    await adminClient.query("INSERT INTO shadow.players VALUES (1, 'keep')");
    const url = new URL(connectionString);
    url.searchParams.set("options", "-c search_path=shadow,public");

    const result = await runCli(RESET_SCRIPT, {}, url.toString());
    assert.equal(result.code, 0, result.stderr);
    assert.equal(await scalar("SELECT count(*)::int AS value FROM shadow.tournaments"), 1);
    assert.equal(await scalar("SELECT count(*)::int AS value FROM shadow.players"), 1);
    assert.equal(await markerCount(), 1);
  });

  test("preserves an unrelated table without dependencies", async () => {
    await createLegacyFixture();
    await adminClient.query("CREATE TABLE public.unrelated_sentinel (id int primary key, value text)");
    await adminClient.query("INSERT INTO public.unrelated_sentinel VALUES (1, 'keep')");

    const result = await runCli(RESET_SCRIPT);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(
      await scalar("SELECT value FROM public.unrelated_sentinel WHERE id = 1"),
      "keep",
    );
  });

  test("preflight blocks an external view depending on public.players", async () => {
    await createLegacyFixture();
    await adminClient.query("CREATE VIEW public.external_player_view AS SELECT id, name FROM public.players");

    const preflight = await runCli(PREFLIGHT_SCRIPT);
    assert.notEqual(preflight.code, 0);
    assert.match(preflight.stdout, /external_player_view/);
    const reset = await runCli(RESET_SCRIPT);
    assert.notEqual(reset.code, 0);
    assert.equal(await scalar("SELECT count(*)::int AS value FROM public.external_player_view"), 1);
    await assertLegacyDataIntact();
  });

  test("preflight blocks an external foreign key to public.tournaments", async () => {
    await createLegacyFixture();
    await adminClient.query(`
      CREATE TABLE public.external_notes (
        id int primary key,
        tournament_id int REFERENCES public.tournaments(id)
      );
      INSERT INTO public.external_notes VALUES (1, 1);
    `);

    const preflight = await runCli(PREFLIGHT_SCRIPT);
    assert.notEqual(preflight.code, 0);
    assert.match(preflight.stdout, /external_notes/);
    const reset = await runCli(RESET_SCRIPT);
    assert.notEqual(reset.code, 0);
    assert.equal(await scalar("SELECT count(*)::int AS value FROM public.external_notes"), 1);
    await assertLegacyDataIntact();
  });

  test("blocks an external function depending on a tournament enum", async () => {
    await createLegacyFixture();
    await adminClient.query(`
      CREATE FUNCTION public.external_tournament_status_label(public.tournament_status)
      RETURNS text LANGUAGE sql IMMUTABLE AS 'SELECT $1::text'
    `);

    const preflight = await runCli(PREFLIGHT_SCRIPT);
    assert.notEqual(preflight.code, 0);
    assert.match(preflight.stdout, /external_tournament_status_label/);
    const reset = await runCli(RESET_SCRIPT);
    assert.notEqual(reset.code, 0);
    assert.equal(
      await scalar("SELECT to_regprocedure('public.external_tournament_status_label(public.tournament_status)') IS NOT NULL AS value"),
      true,
    );
    await assertLegacyDataIntact();
  });

  test("performs one valid legacy-to-series_v1 reset and writes the marker", async () => {
    await createLegacyFixture();
    const result = await runCli(RESET_SCRIPT);
    assert.equal(result.code, 0, result.stderr);
    const output = result.stdout + result.stderr;
    const databasePassword = decodeURIComponent(new URL(connectionString).password);
    assert.equal(output.includes(connectionString), false);
    if (databasePassword) assert.equal(output.includes(databasePassword), false);
    assert.equal(await markerCount(), 1);
    assert.equal(
      await scalar("SELECT count(*)::int AS value FROM public.tournaments"),
      0,
    );
    assert.equal(
      await scalar("SELECT result_model_version = 'series_v1' AS value FROM public.tournaments LIMIT 1"),
      undefined,
    );
    const columns = await adminClient.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'players'",
    );
    const names = columns.rows.map((row) => row.column_name);
    assert.equal(names.includes("points"), false);
    assert.equal(names.includes("wins"), false);
  });

  test("Development wrapper uses the shared reset and records a Development marker", async () => {
    await createLegacyFixture();
    const result = await runDevelopmentCli();
    assert.equal(result.code, 0, result.stderr);
    assert.equal(await markerCount(), 1);
    assert.equal(
      await scalar(
        "SELECT deployment_environment = 'development' AS value FROM public.app_schema_migrations WHERE migration_key = $1",
        [MIGRATION_KEY],
      ),
      true,
    );
    assert.equal(
      await scalar(
        "SELECT count(*)::int AS value FROM information_schema.columns WHERE table_schema = 'public' AND column_name IN ('points', 'draws') AND table_name IN ('players', 'tournaments')",
      ),
      0,
    );
  });

  test("refuses a second reset and preserves data created after cutover", async () => {
    await createLegacyFixture();
    assert.equal((await runCli(RESET_SCRIPT)).code, 0);
    await adminClient.query(
      "INSERT INTO public.tournaments (name, format) VALUES ('New series data', 'single_elimination')",
    );

    const second = await runCli(RESET_SCRIPT);
    assert.notEqual(second.code, 0);
    assert.match(second.stdout + second.stderr, /marker|already exists/i);
    assert.equal(
      await scalar("SELECT count(*)::int AS value FROM public.tournaments WHERE name = 'New series data'"),
      1,
    );
    assert.equal(await markerCount(), 1);
  });

  test("allows only one of two parallel resets to succeed", async () => {
    await createLegacyFixture();
    const [first, second] = await Promise.all([runCli(RESET_SCRIPT), runCli(RESET_SCRIPT)]);
    const codes = [first.code, second.code].sort();
    assert.deepEqual(codes, [0, 1]);
    assert.equal(await markerCount(), 1);
    assert.equal(
      await scalar("SELECT count(*)::int AS value FROM public.tournaments"),
      0,
    );
  });

  test("fails fast while another transaction owns the advisory lock", async () => {
    await createLegacyFixture();
    const lockClient = new Client({ connectionString });
    await lockClient.connect();
    await lockClient.query("BEGIN");
    await lockClient.query("SELECT pg_advisory_xact_lock($1, $2)", ADVISORY_LOCK_KEYS);
    try {
      const result = await runCli(RESET_SCRIPT);
      assert.notEqual(result.code, 0);
      assert.match(result.stdout + result.stderr, /advisory lock/i);
      await assertLegacyDataIntact();
    } finally {
      await lockClient.query("ROLLBACK");
      await lockClient.end();
    }
  });

  test("rolls back legacy data and marker when migration fails mid-transaction", async () => {
    await createLegacyFixture();
    const client = new Client({ connectionString });
    await client.connect();
    const config = loadDestructiveResetConfig(resetEnvironment());
    const failingMigration = migrationSql.replace(
      "CREATE TABLE public.matches",
      "SELECT 1 / 0;\nCREATE TABLE public.matches",
    );
    try {
      await assert.rejects(
        performDestructiveSeriesV1Reset({ client, config, migrationSql: failingMigration }),
        (error) => error?.code === "22012",
      );
    } finally {
      await client.end();
    }
    await assertLegacyDataIntact();
    assert.equal(
      await scalar("SELECT column_name IS NULL AS value FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'result_model_version'"),
      undefined,
    );
  });

  test("bootstraps a fresh database and records the cutover", async () => {
    const result = await runCli(RESET_SCRIPT);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(await markerCount(), 1);
    const tableCount = await scalar(
      "SELECT count(*)::int AS value FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
      [DOMAIN_TABLES],
    );
    const typeCount = await scalar(
      `SELECT count(*)::int AS value
       FROM pg_type type JOIN pg_namespace ns ON ns.oid = type.typnamespace
       WHERE ns.nspname = 'public' AND type.typname = ANY($1::text[])`,
      [DOMAIN_TYPES],
    );
    assert.equal(tableCount, DOMAIN_TABLES.length);
    assert.equal(typeCount, DOMAIN_TYPES.length);
  });

  test("refuses a series_v1 database whose marker is missing", async () => {
    await adminClient.query("BEGIN");
    try {
      await adminClient.query(migrationSql);
      await adminClient.query("COMMIT");
    } catch (error) {
      await adminClient.query("ROLLBACK");
      throw error;
    }
    await adminClient.query(
      "INSERT INTO public.tournaments (name, format) VALUES ('Unmarked series data', 'single_elimination')",
    );

    const result = await runCli(RESET_SCRIPT);
    assert.notEqual(result.code, 0);
    assert.match(result.stdout + result.stderr, /series_v1.*marker is missing/i);
    assert.equal(
      await scalar("SELECT count(*)::int AS value FROM public.tournaments WHERE name = 'Unmarked series data'"),
      1,
    );
    assert.equal(await markerCount(), 0);
  });
});
