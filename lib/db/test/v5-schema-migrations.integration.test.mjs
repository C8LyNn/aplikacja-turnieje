import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import pg from "pg";
import { assertContiguousMigrationSequence } from "../scripts/migration-sequence.mjs";
import { applyV5Migrations, preflightV5Migrations, V5_MIGRATION_CONFIRMATION } from "../scripts/v5-schema-migrations.mjs";
import { describeSchemaGaps, inspectSchemaRequirements } from "../src/schema-requirements.mjs";

// Test only. Creates and drops its own throwaway databases on a LOCAL test cluster:
//   V5_MIGRATION_TEST_DATABASE_URL=postgresql://user@127.0.0.1:PORT/<any db with "test" in its name>
function adminUrl() {
  assert.ok(process.env.NODE_TEST_CONTEXT, "The Node test runner is required");
  assert.notEqual(process.env.REPLIT_DEPLOYMENT, "1");
  const url = new URL(process.env.V5_MIGRATION_TEST_DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "local cluster only");
  assert.match(url.pathname, /test/i);
  assert.doesNotMatch(url.toString(), /prod/i);
  return url;
}

const source = new URL("../migrations/", import.meta.url);
const stripRunnerBlocks = /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const stripBoundaries = /^(?:BEGIN|COMMIT);\r?\n?/gm;
const created = [];
let admin;
let files;

async function createDatabase(suffix) {
  const name = `tm_v5mig_test_${randomUUID().replaceAll("-", "").slice(0, 8)}_${suffix}`;
  await admin.query(`CREATE DATABASE "${name}"`);
  created.push(name);
  const url = adminUrl();
  url.pathname = `/${name}`;
  url.search = "";
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  return { name, url: url.toString(), client };
}

async function applyFiles(client, database, list) {
  for (const file of list) {
    const sql = await readFile(new URL(file, source), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(
        "SELECT set_config('tournament_manager.expected_database_name',$1,true)," +
        "set_config('tournament_manager.deployment_environment','development',true)," +
        "set_config('tournament_manager.app_commit',$2,true)",
        [database, "0000000000000000000000000000000000000000"],
      );
      await client.query(sql.replace(stripRunnerBlocks, "").replace(stripBoundaries, ""));
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

const NEW_COLUMNS = ["round_robin_legs", "participant_type", "team_roster_min", "team_roster_max", "league_rules", "schedule_time_zone", "schedule_plan", "participant_fields", "custom_fields", "point_adjustments"];
async function fingerprint(client) {
  const tables = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map((row) => row.tablename);
  const result = {};
  for (const table of tables) {
    const row = `(to_jsonb(t) - ${NEW_COLUMNS.map((column) => `'${column}'`).join(" - ")})`;
    const where = table === "app_schema_migrations" ? " WHERE migration_key NOT LIKE 'v5_%'" : "";
    result[table] = (await client.query(
      `SELECT count(*)::integer AS rows, md5(COALESCE(string_agg(${row}::text, E'\\n' ORDER BY ${row}::text), '')) AS checksum FROM public."${table}" t${where}`,
    )).rows[0];
  }
  return result;
}

// New V5 tables start empty; compare only tables that existed before the migration.
function pick(after, before) {
  for (const [table, value] of Object.entries(after)) if (!(table in before)) assert.equal(value.rows, 0, `${table} must start empty`);
  return Object.fromEntries(Object.keys(before).map((table) => [table, after[table]]));
}

async function catalog(client) {
  return (await client.query(`
    SELECT 'column' AS kind, table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable || ' ' || COALESCE(column_default, '') AS item
      FROM information_schema.columns
     WHERE table_schema = 'public' AND (table_name IN ('tournament_teams', 'team_members') OR column_name = ANY($1))
    UNION ALL
    SELECT 'constraint', rel.relname || '.' || con.conname || ' ' || pg_get_constraintdef(con.oid)
      FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace
     WHERE ns.nspname = 'public' AND (rel.relname IN ('tournament_teams', 'team_members') OR con.conname LIKE 'tournament_stages_round_robin%' OR con.conname LIKE 'tournaments_participant%' OR con.conname LIKE 'tournaments_team_roster%')
    UNION ALL
    SELECT 'index', indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('tournament_teams', 'team_members')
    ORDER BY 1, 2`, [NEW_COLUMNS])).rows.map((row) => `${row.kind}: ${row.item}`);
}

async function seed(client) {
  await client.query(`
    INSERT INTO tournaments(name,format,organizer_password_hash,support_password_hash,viewer_password_hash,host_code,description)
    VALUES ('SYNTHETIC_V5_RR','round_robin','fixture-hash','fixture-hash','fixture-hash','fixture-host-1','keep'),
           ('SYNTHETIC_V5_SE','single_elimination','fixture-hash','fixture-hash','fixture-hash','fixture-host-2',NULL);
    INSERT INTO players(tournament_id,name) SELECT id, 'SYNTHETIC_' || g FROM tournaments, generate_series(1,4) g;`);
}

before(async () => {
  admin = new pg.Client({ connectionString: adminUrl().toString() });
  await admin.connect();
  files = assertContiguousMigrationSequence(await readdir(source));
  assert.equal(files[39], "0040_steam_catalog_global_source_throttle.sql");
});

after(async () => {
  for (const name of created) {
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  }
  await admin.end();
});

test("existing 0040 database: preflight, one-transaction apply, no data change, verified no-op re-run", async () => {
  const { name, url, client } = await createDatabase("existing");
  try {
    await applyFiles(client, name, files.slice(0, 40));
    await seed(client);
    const before = await fingerprint(client);
    const guardBefore = await inspectSchemaRequirements(client);
    assert.equal(guardBefore.compatible, false, "the API guard must refuse a 0040 schema");
    assert.match(describeSchemaGaps(guardBefore), /0041_round_robin_legs\.sql absent.*0042_tournament_teams\.sql absent.*0043_league_rules_and_schedule\.sql absent.*0044_participant_fields\.sql absent.*0045_stage_point_adjustments\.sql absent/);

    const preflight = await preflightV5Migrations({ connectionString: url });
    assert.equal(preflight.safe, true, preflight.blockers.join(" "));
    assert.equal(preflight.status, "needed");
    assert.deepEqual(preflight.pending, ["0041_round_robin_legs.sql", "0042_tournament_teams.sql", "0043_league_rules_and_schedule.sql", "0044_participant_fields.sql", "0045_stage_point_adjustments.sql"]);

    await assert.rejects(applyV5Migrations({ connectionString: url, confirmation: "yes" }), /V5_MIGRATION_CONFIRM/);
    const result = await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION, appCommit: "test", environment: "test" });
    assert.deepEqual(result.applied, ["0041_round_robin_legs.sql", "0042_tournament_teams.sql", "0043_league_rules_and_schedule.sql", "0044_participant_fields.sql", "0045_stage_point_adjustments.sql"]);
    assert.deepEqual(pick(await fingerprint(client), before), before, "existing rows unchanged");
    assert.equal((await inspectSchemaRequirements(client)).compatible, true);
    const defaults = (await client.query(
      "SELECT (SELECT array_agg(DISTINCT round_robin_legs) FROM tournament_stages) AS legs, (SELECT array_agg(DISTINCT participant_type) FROM tournaments) AS types, (SELECT count(*)::int FROM tournament_stages WHERE league_rules IS NOT NULL OR schedule_time_zone IS NOT NULL OR schedule_plan IS NOT NULL) AS ruled",
    )).rows[0];
    assert.deepEqual(defaults, { legs: [1], types: ["players"], ruled: 0 });
    const markers = (await client.query("SELECT migration_key FROM app_schema_migrations WHERE migration_key LIKE 'v5%'")).rows.map((row) => row.migration_key).sort();
    assert.deepEqual(markers, ["v53_league_rules_and_schedule_0043", "v54_participant_fields_0044", "v55_stage_point_adjustments_0045", "v5_round_robin_legs_0041", "v5_tournament_teams_0042"].sort());
    const v53Marker = (await client.query("SELECT count(*)::int AS n FROM app_schema_migrations WHERE migration_key = 'v53_league_rules_and_schedule_0043'")).rows[0].n;
    assert.equal(v53Marker, 1);

    const again = await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION });
    assert.deepEqual(again.applied, []);
    assert.deepEqual(pick(await fingerprint(client), before), before);
    assert.equal((await preflightV5Migrations({ connectionString: url })).status, "applied");
  } finally {
    await client.end();
  }
});

test("existing V5.2 database (0001–0042): 0043 and 0044 are pending; stages keep legacy rules", async () => {
  const { name, url, client } = await createDatabase("v52");
  try {
    await applyFiles(client, name, files.slice(0, 42));
    await seed(client);
    const before = await fingerprint(client);
    const guard = await inspectSchemaRequirements(client);
    assert.equal(guard.compatible, false, "the V5.3 API must refuse a V5.2 schema");
    assert.match(describeSchemaGaps(guard), /0043_league_rules_and_schedule\.sql absent/);
    const preflight = await preflightV5Migrations({ connectionString: url });
    assert.equal(preflight.safe, true, preflight.blockers.join(" "));
    assert.deepEqual(preflight.pending, ["0043_league_rules_and_schedule.sql", "0044_participant_fields.sql", "0045_stage_point_adjustments.sql"]);
    await assert.rejects(applyV5Migrations({ connectionString: url, confirmation: "apply-0041-0042" }), /V5_MIGRATION_CONFIRM=apply-0041-0045/);
    const result = await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION });
    assert.deepEqual(result.applied, ["0043_league_rules_and_schedule.sql", "0044_participant_fields.sql", "0045_stage_point_adjustments.sql"]);
    assert.deepEqual(pick(await fingerprint(client), before), before, "existing rows unchanged");
    const ruled = (await client.query("SELECT count(*)::int AS n FROM tournament_stages WHERE league_rules IS NOT NULL OR schedule_time_zone IS NOT NULL")).rows[0].n;
    assert.equal(ruled, 0, "old stages keep the pre-V5.3 rules");
    await assert.rejects(
      client.query("UPDATE tournament_stages SET league_rules = '{}'::jsonb WHERE format = 'single_elimination'"),
      /tournament_stages_league_rules_supported/,
    );
    await assert.rejects(
      client.query("UPDATE tournament_stages SET schedule_time_zone = 'Europe/Warsaw; DROP' WHERE true"),
      /tournament_stages_schedule_time_zone_shape/,
    );
    await assert.rejects(
      client.query(`UPDATE tournament_stages SET schedule_plan = '{"startDate":"2026-12-01"}'::jsonb WHERE true`),
      /tournament_stages_schedule_plan_supported/,
      "a schedule plan without a time zone is refused",
    );
    // The new result shape accepts a draw (equal scores, no winner) and still refuses a winnerless decisive score.
    const shape = (await client.query("SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'matches_result_shape_v53'")).rows[0].def;
    assert.match(shape, /winner_id IS NOT NULL\) OR \(score1 = score2\)/);
    assert.equal((await client.query("SELECT count(*)::int AS n FROM pg_constraint WHERE conname = 'matches_result_shape'")).rows[0].n, 0);
    assert.deepEqual((await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION })).applied, []);
  } finally {
    await client.end();
  }
});

test("existing V5.3 database (0001–0043): 0044 and 0045 are pending; players keep their data", async () => {
  const { name, url, client } = await createDatabase("v53");
  try {
    await applyFiles(client, name, files.slice(0, 43));
    await seed(client);
    const before = await fingerprint(client);
    const guard = await inspectSchemaRequirements(client);
    assert.equal(guard.compatible, false, "the V5.4 API must refuse a V5.3 schema");
    assert.match(describeSchemaGaps(guard), /0044_participant_fields\.sql absent/);
    const preflight = await preflightV5Migrations({ connectionString: url });
    assert.equal(preflight.safe, true, preflight.blockers.join(" "));
    assert.deepEqual(preflight.pending, ["0044_participant_fields.sql", "0045_stage_point_adjustments.sql"]);
    await assert.rejects(applyV5Migrations({ connectionString: url, confirmation: "apply-0041-0043" }), /V5_MIGRATION_CONFIRM=apply-0041-0045/, "the V5.3 token no longer applies");
    const result = await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION });
    assert.deepEqual(result.applied, ["0044_participant_fields.sql", "0045_stage_point_adjustments.sql"]);
    assert.deepEqual(pick(await fingerprint(client), before), before, "existing rows unchanged");
    const touched = (await client.query("SELECT (SELECT count(*)::int FROM tournaments WHERE participant_fields IS NOT NULL) + (SELECT count(*)::int FROM players WHERE custom_fields IS NOT NULL) AS n")).rows[0].n;
    assert.equal(touched, 0, "old tournaments get no extra fields");
    await assert.rejects(client.query(`UPDATE players SET custom_fields = '[1,2]'::jsonb WHERE true`), /players_custom_fields_shape/);
    await assert.rejects(
      client.query(`UPDATE players SET custom_fields = jsonb_build_object('x', repeat('a', 40000)) WHERE true`),
      /players_custom_fields_shape/,
      "values are bounded in size",
    );
    await assert.rejects(client.query(`UPDATE tournaments SET participant_fields = '"x"'::jsonb WHERE true`), /tournaments_participant_fields_shape/);
    assert.deepEqual((await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION })).applied, []);
  } finally {
    await client.end();
  }
});

test("existing V5.4 database (0001–0044): only 0045 is pending; stages keep no adjustments", async () => {
  const { name, url, client } = await createDatabase("v54");
  try {
    await applyFiles(client, name, files.slice(0, 44));
    await seed(client);
    const before = await fingerprint(client);
    const guard = await inspectSchemaRequirements(client);
    assert.equal(guard.compatible, false, "the V5.5 API must refuse a V5.4 schema");
    assert.match(describeSchemaGaps(guard), /0045_stage_point_adjustments\.sql absent/);
    const preflight = await preflightV5Migrations({ connectionString: url });
    assert.equal(preflight.safe, true, preflight.blockers.join(" "));
    assert.deepEqual(preflight.pending, ["0045_stage_point_adjustments.sql"]);
    await assert.rejects(applyV5Migrations({ connectionString: url, confirmation: "apply-0041-0044" }), /V5_MIGRATION_CONFIRM=apply-0041-0045/, "the V5.4 token no longer applies");
    const result = await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION });
    assert.deepEqual(result.applied, ["0045_stage_point_adjustments.sql"]);
    assert.deepEqual(pick(await fingerprint(client), before), before, "existing rows unchanged");
    assert.equal((await client.query("SELECT count(*)::int AS n FROM tournament_stages WHERE point_adjustments IS NOT NULL")).rows[0].n, 0);
    await assert.rejects(
      client.query(`UPDATE tournament_stages SET point_adjustments = '[]'::jsonb WHERE league_rules IS NULL`),
      /tournament_stages_point_adjustments_supported/,
      "only stages with a points table may carry adjustments",
    );
    await assert.rejects(client.query(`UPDATE tournament_stages SET point_adjustments = '{}'::jsonb WHERE true`), /tournament_stages_point_adjustments_supported/);
    assert.deepEqual((await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION })).applied, []);
  } finally {
    await client.end();
  }
});

test("fresh install: 0001–N gives exactly the same V5 schema as an upgraded database", async () => {
  const fresh = await createDatabase("fresh");
  const upgraded = await createDatabase("upgraded");
  try {
    await applyFiles(fresh.client, fresh.name, files);
    const report = await inspectSchemaRequirements(fresh.client);
    assert.equal(report.compatible, true, describeSchemaGaps(report));
    await applyFiles(upgraded.client, upgraded.name, files.slice(0, 40));
    await applyV5Migrations({ connectionString: upgraded.url, confirmation: V5_MIGRATION_CONFIRMATION });
    const freshCatalog = await catalog(fresh.client);
    assert.ok(freshCatalog.length >= 25);
    assert.deepEqual(await catalog(upgraded.client), freshCatalog);
    // Replaying every migration on the fresh database is also harmless for V5 objects.
    await applyFiles(fresh.client, fresh.name, files.slice(40));
    assert.deepEqual(await catalog(fresh.client), freshCatalog);
  } finally {
    await fresh.client.end();
    await upgraded.client.end();
  }
});

test("conflicting objects block the run and nothing is half-applied; a partial state is completed", async () => {
  const { name, url, client } = await createDatabase("partial");
  try {
    await applyFiles(client, name, files.slice(0, 40));
    await seed(client);
    await client.query("CREATE TABLE public.tournament_teams (id serial PRIMARY KEY, label text)");
    const blocked = await preflightV5Migrations({ connectionString: url });
    assert.equal(blocked.safe, false);
    assert.match(blocked.blockers.join(" "), /tournament_teams already exists with a different shape/);
    await assert.rejects(applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION }), /preflight refused/);
    const legs = (await client.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='tournament_stages' AND column_name='round_robin_legs'")).rows[0].n;
    assert.equal(legs, 0, "0041 must not be applied when the run is refused");

    // Interrupted manual attempt: column added, constraint missing.
    await client.query("DROP TABLE public.tournament_teams");
    await client.query("ALTER TABLE public.tournament_stages ADD COLUMN round_robin_legs smallint NOT NULL DEFAULT 1");
    const partial = await preflightV5Migrations({ connectionString: url });
    assert.equal(partial.safe, true);
    assert.equal(partial.migrations[0].status, "partial");
    assert.deepEqual(partial.migrations[0].missing, ["constraint tournament_stages.tournament_stages_round_robin_legs_supported"]);
    const before = await fingerprint(client);
    await applyV5Migrations({ connectionString: url, confirmation: V5_MIGRATION_CONFIRMATION });
    assert.equal((await inspectSchemaRequirements(client)).compatible, true);
    assert.deepEqual(pick(await fingerprint(client), before), before);

    // Data that violates a new rule is reported before anything runs.
    await client.query("ALTER TABLE public.tournament_stages DROP CONSTRAINT tournament_stages_round_robin_legs_supported");
    await client.query("UPDATE public.tournament_stages SET round_robin_legs = 2 WHERE format <> 'round_robin'");
    const invalid = await preflightV5Migrations({ connectionString: url });
    assert.equal(invalid.safe, false);
    assert.match(invalid.blockers.join(" "), /violate the round_robin_legs rule/);
  } finally {
    await client.end();
  }
});
