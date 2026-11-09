import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import pg from "pg";
import { inspectCatalogPreflight } from "../scripts/preflight-game-catalog.mjs";

// Test only. Never imported by application startup, build, or publishing.
function isolatedConfig(env = process.env) {
  assert.equal(env.NODE_ENV, "test", "NODE_ENV=test is required");
  assert.ok(env.NODE_TEST_CONTEXT, "The Node test runner is required");
  assert.notEqual(env.REPLIT_DEPLOYMENT, "1", "Deployment execution is forbidden");
  assert.equal(env.TEST_DATABASE_RESET, "EMPTY_RELEASE_TEST_DATABASE");
  let url;
  try { url = new URL(env.TEST_DATABASE_URL); }
  catch { throw new Error("A valid, explicit test connection is required"); }
  assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname));
  assert.match(url.pathname, /^\/tm_release_0030_0040_test(?:_[a-z0-9]+)?$/);
  assert.equal(url.username, "release_test_owner");
  assert.equal(url.password, "", "Only a disposable, passwordless local cluster is allowed");
  assert.equal(url.search, "", "Connection overrides are forbidden");
  return { connectionString: url.toString(), expectedDatabase: url.pathname.slice(1) };
}

const source = new URL("../migrations/", import.meta.url);
const stripRunnerBlocks = /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const stripBoundaries = /^(?:BEGIN|COMMIT);\r?\n?/gm;
const quote = (name) => '"' + name.replaceAll('"', '""') + '"';

async function apply(client, file, database) {
  const sql = await readFile(new URL(file, source), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(
      "SELECT set_config('tournament_manager.expected_database_name',$1,true)," +
      "set_config('tournament_manager.deployment_environment','development',true)," +
      "set_config('tournament_manager.app_commit',$2,true)",
      [database, "e85365b45da5fba10e04c4caa72ba591b88df2fe"],
    );
    await client.query(sql.replace(stripRunnerBlocks, "").replace(stripBoundaries, ""));
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function fingerprint(client, tables) {
  const result = {};
  for (const table of tables) {
    // The new revision column and the new abstract term are intentional additions.
    const row = table === "steam_catalog_games"
      ? "(to_jsonb(t) - 'classification_revision')" : "to_jsonb(t)";
    const where = table === "steam_catalog_terms"
      ? " WHERE NOT (facet='world' AND slug='abstract-no-setting')" : "";
    result[table] = (await client.query(
      `SELECT count(*)::integer AS rows,
       md5(COALESCE(string_agg(${row}::text,E'\\n' ORDER BY ${row}::text),'')) AS checksum
       FROM public.${quote(table)} t${where}`,
    )).rows[0];
  }
  return result;
}

async function counts(client, expected) {
  const actual = (await client.query(
    "SELECT unclassified::integer,review::integer,ready::integer FROM steam_catalog_status_counts WHERE id=1",
  )).rows[0];
  assert.deepEqual(actual, expected);
}

test("0030–0040 preserve baseline data and install complete forward SQL on an empty isolated cluster", async () => {
  const config = isolatedConfig();
  const client = new pg.Client(config);
  await client.connect();
  try {
    const identity = (await client.query(
      "SELECT current_database() AS db,current_user AS role,host(inet_server_addr()) AS host",
    )).rows[0];
    assert.equal(identity.db, config.expectedDatabase);
    assert.equal(identity.role, "release_test_owner");
    assert.ok(["127.0.0.1", "::1"].includes(identity.host));
    const initial = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    assert.equal(initial.rowCount, 0, "Refusing any existing public tables; no reset is performed");

    const files = (await readdir(source)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
    assert.equal(files.length, 40);
    assert.ok(files.every((f, i) => Number(f.slice(0, 4)) === i + 1));
    // 0001's reset is used ONLY to create this verified empty, disposable baseline.
    for (const file of files.slice(0, 29)) await apply(client, file, config.expectedDatabase);
    await client.query(`
      INSERT INTO tournaments(name,format,organizer_password_hash,support_password_hash,
        viewer_password_hash,host_code,description)
      VALUES ('SYNTHETIC_RELEASE_TEST','single_elimination','fixture-organizer-hash',
        'fixture-support-hash','fixture-viewer-hash','fixture-host-code','preserve-config');
      INSERT INTO players(tournament_id,name)
        SELECT id,'SYNTHETIC_PLAYER' FROM tournaments;
      INSERT INTO support_sessions(tournament_id,nick,session_token)
        SELECT id,'SYNTHETIC_SUPPORT','not-a-real-session' FROM tournaments;
      INSERT INTO steam_catalog_terms(facet,slug,label)
        VALUES ('genre','fixture-action','Fixture action');
      INSERT INTO steam_catalog_games(steam_app_id,name,status,steam_url)
        VALUES (2000002001,'SYNTHETIC_A','unclassified','https://store.steampowered.com/app/2000002001/'),
               (2000002002,'SYNTHETIC_B','review','https://store.steampowered.com/app/2000002002/'),
               (2000002003,'SYNTHETIC_C','ready','https://store.steampowered.com/app/2000002003/');
    `);
    const tables = (await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    )).rows.map((r) => r.tablename);
    const before = await fingerprint(client, tables);
    const rolesBefore = (await client.query(
      "SELECT rolname,rolsuper,rolcreatedb,rolcreaterole,rolcanlogin FROM pg_roles ORDER BY rolname",
    )).rows;
    assert.equal((await client.query(
      "SELECT to_regclass('public.tournament_correction_operations') AS target",
    )).rows[0].target, null);
    const baselineReady = await inspectCatalogPreflight(client, {
      expectedDatabase: config.expectedDatabase, schema: "public", environment: "staging",
    });
    assert.equal(baselineReady.passed, false, "An empty publish diff must not certify the old baseline");

    for (const file of files.slice(29)) await apply(client, file, config.expectedDatabase);
    assert.deepEqual(await fingerprint(client, tables), before, "Existing rows changed");
    assert.deepEqual((await client.query(
      "SELECT rolname,rolsuper,rolcreatedb,rolcreaterole,rolcanlogin FROM pg_roles ORDER BY rolname",
    )).rows, rolesBefore, "Database roles changed");
    const checks = (await client.query(
      "SELECT conname,convalidated,pg_get_constraintdef(oid) AS definition FROM pg_constraint " +
      "WHERE conrelid='public.tournament_correction_operations'::regclass AND contype='c'",
    )).rows;
    assert.ok(checks.length >= 6 && checks.every((c) => c.convalidated));
    assert.ok(checks.some((c) => c.conname.endsWith("status_check") && c.definition.includes("corrected")));
    assert.ok(checks.some((c) => c.conname.endsWith("receipt_consistency_check") &&
      c.definition.includes("completion_action_id") && c.definition.includes("corrected_match_revision")));
    const ready = await inspectCatalogPreflight(client, {
      expectedDatabase: config.expectedDatabase, schema: "public", environment: "staging",
    });
    assert.equal(ready.passed, true, JSON.stringify(ready.checks));
    assert.equal((await client.query(
      "SELECT count(*)::integer AS n FROM steam_catalog_terms WHERE facet='world' AND slug='abstract-no-setting'",
    )).rows[0].n, 1);
    await counts(client, { unclassified: 1, review: 1, ready: 1 });

    // Exercise INSERT / UPDATE / DELETE triggers, then roll back the fixture operations.
    await client.query("BEGIN");
    try {
      await client.query(
        "INSERT INTO steam_catalog_games(steam_app_id,name,status,steam_url) " +
        "VALUES(2000002099,'SYNTHETIC_TRIGGER','unclassified','https://store.steampowered.com/app/2000002099/')",
      );
      await counts(client, { unclassified: 2, review: 1, ready: 1 });
      await client.query("UPDATE steam_catalog_games SET status='ready' WHERE steam_app_id=2000002099");
      await counts(client, { unclassified: 1, review: 1, ready: 2 });
      await client.query("DELETE FROM steam_catalog_games WHERE steam_app_id=2000002099");
      await counts(client, { unclassified: 1, review: 1, ready: 1 });
    } finally { await client.query("ROLLBACK"); }

    // Idempotent repeat of only 0030–0040 must also preserve all baseline rows.
    for (const file of files.slice(29)) await apply(client, file, config.expectedDatabase);
    assert.deepEqual(await fingerprint(client, tables), before);
    await counts(client, { unclassified: 1, review: 1, ready: 1 });
    const finalReady = await inspectCatalogPreflight(client, {
      expectedDatabase: config.expectedDatabase, schema: "public", environment: "staging",
    });
    assert.equal(finalReady.passed, true);
    console.log(JSON.stringify({
      migrationsApplied: 11, repeated: 11, baselineTablesPreserved: tables.length,
      accountAndConfigDataPreserved: true, rolesPreserved: true,
      checksValidated: true, countersAndTriggersVerified: true,
      catalogPreflight: "PASS", productionTouched: false,
    }));
  } finally { await client.end(); }
});
