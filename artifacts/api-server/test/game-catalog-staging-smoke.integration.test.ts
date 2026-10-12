import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { type AddressInfo } from "node:net";
import { test } from "node:test";
import type { Server } from "node:http";
import { getSafeTestDatabaseConfig } from "./test-database";
import { inspectCatalogApi } from "../../../scripts/preflight-game-catalog-api.mjs";
import { inspectCatalogPreflight } from "../../../lib/db/scripts/preflight-game-catalog.mjs";

const TEST_SCHEMA = "tm_test_catalog_smoke";
const FILES = [
  "0029_steam_game_catalog_v1.sql",
  "0030_steam_catalog_abstract_world.sql",
  "0031_steam_catalog_pagination_indexes.sql",
  "0032_steam_catalog_classification_revision.sql",
  "0033_steam_catalog_trigram_search.sql",
  "0034_steam_catalog_exact_status_counters.sql",
  "0035_steam_catalog_import_jobs.sql",
  "0036_steam_catalog_import_job_sources.sql",
  "0037_steam_catalog_import_retry_backoff.sql",
  "0038_steam_catalog_global_source_throttle.sql",
] as const;
const ROOT = new URL("../../../lib/db/migrations/", import.meta.url);

test("isolated HTTP staging: migration, keyless import, pause/resume and counters", { timeout: 90_000 }, async () => {
  const target = getSafeTestDatabaseConfig({
    ...process.env,
    TEST_DATABASE_SCHEMA: TEST_SCHEMA,
  });
  const dbName = decodeURIComponent(new URL(target.connectionString).pathname.slice(1));
  const saved = {
    database: process.env.DATABASE_URL,
    admin: process.env.STEAM_CATALOG_ADMIN_TOKEN,
    steam: process.env.STEAM_WEB_API_KEY,
    mode: process.env.NODE_ENV,
    fetch: globalThis.fetch,
  };
  const adminToken = randomBytes(32).toString("base64url");
  let database: typeof import("@workspace/db") | null = null;
  let server: Server | null = null;
  let created = false;
  const outbound: string[] = [];
  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  try {
    process.env.NODE_ENV = "test"; // Worker is manually stepped; no automatic network activity.
    process.env.DATABASE_URL = target.connectionString;
    process.env.STEAM_CATALOG_ADMIN_TOKEN = adminToken;
    delete process.env.STEAM_WEB_API_KEY;

    database = await import("@workspace/db");
    const pool = database.pool;
    await pool.query('DROP SCHEMA IF EXISTS "' + TEST_SCHEMA + '" CASCADE');
    await pool.query('CREATE SCHEMA "' + TEST_SCHEMA + '"');
    created = true;

    for (const file of FILES) {
      const sql = await readFile(new URL(file, ROOT), "utf8");
      await pool.query(sql);
    }
    await pool.query(
      "INSERT INTO steam_catalog_games (steam_app_id,name,steam_url,status) VALUES " +
      "(1500001,'Existing reviewed classic','https://store.steampowered.com/app/1500001','ready')",
    );
    const initialStatus = (await pool.query(
      "SELECT id,status,classification_revision FROM steam_catalog_games WHERE steam_app_id=1500001",
    )).rows[0];

    const assertDbGate = async (expected: string) => {
      const client = await pool.connect();
      try {
        const result = await inspectCatalogPreflight(client, {
          expectedDatabase: dbName, schema: TEST_SCHEMA, environment: "staging",
        });
        assert.equal(result.passed, true,
          JSON.stringify(result.checks.filter((item: { passed: boolean }) => !item.passed)));
        assert.deepEqual(result.counts, { games: expected, counted: expected });
      } finally {
        client.release();
      }
    };
    await assertDbGate("1");

    const { createApp } = await import("../src/app");
    const { runCatalogImportStep } = await import("../src/application/catalog/steam-catalog-import-jobs");
    const { resetSteamSpyPageCacheForTests } = await import("../src/application/catalog/steam-catalog-steamspy");
    resetSteamSpyPageCacheForTests();

    server = await new Promise<Server>((resolve, reject) => {
      const started = createApp().listen(0, "127.0.0.1", () => resolve(started));
      started.on("error", reject);
    });
    const port = (server.address() as AddressInfo).port;
    const origin = "http://127.0.0.1:" + port;
    const nativeFetch = saved.fetch;
    const publicProbe = () => inspectCatalogApi({ baseUrl: origin, expectedHost: "127.0.0.1" }, nativeFetch);
    let before = await publicProbe();
    assert.equal(before.passed, true, JSON.stringify(before.checks));
    assert.equal(before.counts?.all, 1);

    const unauthorized = await nativeFetch(origin + "/api/steam-catalog/import-job", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "steamspy", maxGames: 5 }),
    });
    assert.equal(unauthorized.status, 403);
    const headers = {
      "x-steam-catalog-admin-token": adminToken,
      "content-type": "application/json",
    };
    type JobEnvelope = {
      job: {
        id: string; source: "steam" | "steamspy"; status: string;
        pending: number; processed: number; inserted: number;
        existing: number; ignored: number; failed: number;
      };
    };
    const send = async (path: string, body?: unknown) => {
      const response = await nativeFetch(origin + path, {
        method: "POST", headers, body: body === undefined ? "{}" : JSON.stringify(body),
      });
      const payload = await response.json() as JobEnvelope;
      return { code: response.status, payload };
    };
    const readJob = async () => {
      const response = await nativeFetch(origin + "/api/steam-catalog/import-job", {
        headers: { "x-steam-catalog-admin-token": adminToken },
      });
      assert.equal(response.status, 200);
      return (await response.json() as JobEnvelope).job;
    };

    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const url = new URL(String(input));
      outbound.push(url.hostname);
      if (url.hostname === "steamspy.com") {
        assert.equal(url.searchParams.get("request"), "all");
        assert.equal(url.searchParams.get("page"), "0");
        return Response.json(Object.fromEntries([
          [1500001, "Already classified"],
          [1900801, "Verified one"],
          [1900802, "DLC to reject"],
          [1900803, "Verified two"],
          [1900804, "Verified three"],
        ].map(([id, name]) => [String(id), { appid: Number(id), name }])));
      }
      if (url.hostname === "store.steampowered.com") {
        const id = Number(url.searchParams.get("appids"));
        assert.ok([1900801, 1900802, 1900803, 1900804].includes(id));
        return Response.json({ [id]: { success: true, data: {
          type: id === 1900802 ? "dlc" : "game",
          name: "Verified " + id,
          developers: ["Test developer"],
        } } });
      }
      throw new Error("Unapproved network destination in isolated catalog test.");
    }) as typeof fetch;

    const started = await send("/api/steam-catalog/import-job", {
      source: "steamspy", maxGames: 5,
    });
    assert.equal(started.code, 201, JSON.stringify(started.payload));
    const id = started.payload.job.id as string;
    assert.equal(started.payload.job.source, "steamspy");
    assert.equal(await runCatalogImportStep(), true); // Discover from mocked SteamSpy.
    assert.equal((await readJob()).pending, 5);

    await pool.query("UPDATE steam_catalog_import_jobs SET next_run_at=now() WHERE id=$1", [id]);
    assert.equal(await runCatalogImportStep(), true); // Existing AppID, no Store call.
    const paused = await send("/api/steam-catalog/import-job/" + id + "/pause");
    assert.equal(paused.code, 200);
    assert.equal(paused.payload.job.status, "paused");
    assert.equal(await runCatalogImportStep(), false);
    const resumed = await send("/api/steam-catalog/import-job/" + id + "/resume");
    assert.equal(resumed.code, 200);
    assert.equal(resumed.payload.job.status, "running");

    for (let index = 0; index < 4; index++) {
      await pool.query("UPDATE steam_catalog_import_jobs SET next_run_at=now() WHERE id=$1", [id]);
      assert.equal(await runCatalogImportStep(), true);
    }
    const job = await readJob();
    assert.equal(job.status, "completed");
    assert.deepEqual(
      [job.processed, job.inserted, job.existing, job.ignored, job.failed],
      [5, 3, 1, 1, 0],
    );

    // The API must return the new unique-game total, not candidate counts.
    const after = await publicProbe();
    assert.equal(after.passed, true, JSON.stringify(after.checks));
    assert.deepEqual(after.counts, { all: 4, unclassified: 3, review: 0, ready: 1 });
    await assertDbGate("4");
    const currentStatus = (await pool.query(
      "SELECT id,status,classification_revision FROM steam_catalog_games WHERE steam_app_id=1500001",
    )).rows[0];
    assert.deepEqual(currentStatus, initialStatus);
    assert.deepEqual(outbound, [
      "steamspy.com", "store.steampowered.com", "store.steampowered.com",
      "store.steampowered.com", "store.steampowered.com",
    ]);
  } finally {
    globalThis.fetch = saved.fetch;
    restore("STEAM_WEB_API_KEY", saved.steam);
    restore("STEAM_CATALOG_ADMIN_TOKEN", saved.admin);
    restore("NODE_ENV", saved.mode);
    restore("DATABASE_URL", saved.database);
    if (server) await new Promise<void>((resolve, reject) =>
      server!.close((error) => error ? reject(error) : resolve()));
    if (database) {
      if (created) await database.pool.query('DROP SCHEMA IF EXISTS "' + TEST_SCHEMA + '" CASCADE');
      await database.pool.end();
    }
  }
});
