import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { count, ilike, or } from "drizzle-orm";
import { dropTestSchema, getSafeTestDatabaseConfig, type TestDatabaseConfig } from "./test-database";

type Db = typeof import("@workspace/db");
const EDIT_KEY = randomBytes(32).toString("base64url");
const MIGRATIONS = [
  "0029_steam_game_catalog_v1.sql",
  "0030_steam_catalog_abstract_world.sql",
  "0031_steam_catalog_pagination_indexes.sql",
  "0032_steam_catalog_classification_revision.sql",
  "0033_steam_catalog_trigram_search.sql",
  "0034_steam_catalog_exact_status_counters.sql",
  "0035_steam_catalog_import_jobs.sql",
] as const;
const MIGRATION_ROOT = new URL("../../../lib/db/migrations/", import.meta.url);
let database: Db;
let app: Express;
let config: TestDatabaseConfig;
let schemaCreated = false;
const edit = () => ({ "x-steam-catalog-admin-token": EDIT_KEY });

async function rows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.STEAM_CATALOG_ADMIN_TOKEN = EDIT_KEY;
  database = await import("@workspace/db") as Db;

  await database.pool.query('DROP SCHEMA IF EXISTS "' + config.schema + '" CASCADE');
  await database.pool.query('CREATE SCHEMA "' + config.schema + '"');
  schemaCreated = true;
  for (const migration of MIGRATIONS) {
    const sql = await readFile(new URL(migration, MIGRATION_ROOT), "utf8");
    await database.pool.query(sql);
    await database.pool.query(sql); // Idempotent deployment retry.
  }
  await database.pool.query([
    "INSERT INTO steam_catalog_games (steam_app_id, name, steam_url, developer, publisher, status)",
    "SELECT 1500000+n, 'Test Game ' || lpad(n::text, 4, '0'),",
    "'https://store.steampowered.com/app/' || (1500000+n),",
    "CASE WHEN n%2=0 THEN 'Developer Studio' ELSE 'Indie Workshop' END,",
    "CASE WHEN n%4=0 THEN 'Example Publisher' ELSE 'Other Publisher' END,",
    "CASE WHEN n%7=0 THEN 'ready' WHEN n%3=0 THEN 'review' ELSE 'unclassified' END",
    "FROM generate_series(1,2000) n",
  ].join(" "));
  await database.pool.query(
    "INSERT INTO steam_catalog_games (steam_app_id, name, steam_url, status) VALUES " +
    "(1700001,'Special 100% Game','https://store.steampowered.com/app/1700001','review')," +
    "(1700002,'Special 1000 Game','https://store.steampowered.com/app/1700002','review')," +
    "(1700003,'Special_One','https://store.steampowered.com/app/1700003','review')",
  );
  const { createApp } = await import("../src/app");
  app = createApp();
});

after(async () => {
  delete process.env.STEAM_CATALOG_ADMIN_TOKEN;
  if (!database) return;
  try {
    if (schemaCreated) await dropTestSchema(database.pool, config.schema);
  } finally {
    await database.pool.end();
  }
});

describe("Steam catalog — real PostgreSQL API", () => {
  test("migration idempotence, taxonomy and pagination indexes", async () => {
    const [counts] = await rows<{ games: number; terms: number }>(
      "SELECT (SELECT count(*)::integer FROM steam_catalog_games) AS games, " +
      "(SELECT count(*)::integer FROM steam_catalog_terms) AS terms",
    );
    assert.equal(counts.games, 2003);
    const [counter] = await rows<{ unclassified: string; review: string; ready: string }>(
      "SELECT unclassified,review,ready FROM steam_catalog_status_counts WHERE id=1",
    );
    assert.ok(counter);
    assert.equal(Number(counter.unclassified) + Number(counter.review) + Number(counter.ready), 2003);
    const [versions] = await rows<{ min_version: number; max_version: number }>(
      "SELECT min(classification_revision)::integer AS min_version, max(classification_revision)::integer AS max_version FROM steam_catalog_games",
    );
    assert.equal(versions.min_version, 1);
    assert.equal(versions.max_version, 1);
    assert.ok(counts.terms >= 80);
    const indexes = await rows<{ indexname: string }>(
      "SELECT indexname FROM pg_indexes WHERE schemaname=$1 AND tablename='steam_catalog_games'",
      [config.schema],
    );
    const names = new Set(indexes.map((x) => x.indexname));
    assert.ok(names.has("steam_catalog_games_name_id_idx"));
    assert.ok(names.has("steam_catalog_games_status_name_id_idx"));
    const [trigram] = await rows<{ enabled: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_trgm') AS enabled",
    );
    if (trigram.enabled) {
      for (const col of ["name", "developer", "publisher"]) {
        assert.ok(names.has("steam_catalog_games_" + col + "_trgm_idx"));
      }
    }
  });

  test("2000+ records: bounded stable pages, metadata and clamping", async () => {
    const first = await request(app).get("/api/steam-catalog/games?page=1&pageSize=25").expect(200);
    const second = await request(app).get("/api/steam-catalog/games?page=2&pageSize=25").expect(200);
    assert.equal(first.body.pagination.total, 2003);
    assert.equal(first.body.pagination.totalPages, 81);
    assert.equal(first.body.games.length, 25);
    assert.equal(second.body.games.length, 25);
    assert.equal(typeof first.body.pagination.nextCursor, "string");
    const keyed = await request(app).get("/api/steam-catalog/games")
      .query({ page: 2, pageSize: 25, cursor: first.body.pagination.nextCursor }).expect(200);
    assert.deepEqual(
      keyed.body.games.map((x: { id: number }) => x.id),
      second.body.games.map((x: { id: number }) => x.id),
    );
    await request(app).get("/api/steam-catalog/games")
      .query({ page: 2, pageSize: 25, cursor: first.body.pagination.nextCursor, status: "ready" }).expect(400);
    await request(app).get("/api/steam-catalog/games")
      .query({ page: 2, pageSize: 25, cursor: "bad*cursor" }).expect(400);
    const ids = [...first.body.games, ...second.body.games].map((x: { id: number }) => x.id);
    assert.equal(new Set(ids).size, 50);
    assert.ok(first.body.games.every((x: Record<string, unknown>) => !("assignments" in x) && !("steamRawData" in x)));
    const last = await request(app).get("/api/steam-catalog/games?page=81&pageSize=25").expect(200);
    const clamped = await request(app).get("/api/steam-catalog/games?page=500&pageSize=25").expect(200);
    assert.equal(last.body.games.length, 3);
    assert.equal(clamped.body.pagination.page, 81);
    assert.deepEqual(clamped.body.games.map((x: { id: number }) => x.id), last.body.games.map((x: { id: number }) => x.id));
  });

  test("status counts are global, not page-local", async () => {
    const result = await request(app).get("/api/steam-catalog/games?pageSize=5&status=review").expect(200);
    assert.equal(result.body.games.length, 5);
    assert.ok(result.body.games.every((x: { status: string }) => x.status === "review"));
    assert.equal(result.body.counts.all, 2003);
    assert.ok(result.body.counts.ready > 0);
    assert.ok(result.body.pagination.total < 2003);
  });


  test("exact counters track bulk inserts, status transitions, deletes and rollbacks", async () => {
    type Totals = { unclassified: string; review: string; ready: string };
    async function getCounters() {
      const [item] = await rows<Totals>(
        "SELECT unclassified,review,ready FROM steam_catalog_status_counts WHERE id=1",
      );
      return [Number(item.unclassified), Number(item.review), Number(item.ready)] as const;
    }
    async function getActual() {
      const [row] = await rows<{ u: string; r: string; y: string }>(
        "SELECT count(*) FILTER (WHERE status='unclassified') AS u, " +
        "count(*) FILTER (WHERE status='review') AS r, " +
        "count(*) FILTER (WHERE status='ready') AS y FROM steam_catalog_games",
      );
      return [Number(row.u), Number(row.r), Number(row.y)] as const;
    }
    const original = await getCounters();
    assert.deepEqual(original, await getActual());

    // Replaying 0034 must not reset counters or install duplicate triggers.
    const migration = await readFile(new URL("0034_steam_catalog_exact_status_counters.sql", MIGRATION_ROOT), "utf8");
    await database.pool.query(migration);
    assert.deepEqual(await getCounters(), original);

    await database.pool.query(
      "INSERT INTO steam_catalog_games (steam_app_id,name,steam_url,status) VALUES " +
      "(1999901,'Count Sample A','https://store.steampowered.com/app/1999901','unclassified')," +
      "(1999902,'Count Sample B','https://store.steampowered.com/app/1999902','review')," +
      "(1999903,'Count Sample C','https://store.steampowered.com/app/1999903','ready')",
    );
    assert.deepEqual(await getCounters(), original.map((x) => x + 1));
    await database.pool.query(
      "UPDATE steam_catalog_games SET status='ready' WHERE steam_app_id IN (1999901,1999902)",
    );
    assert.deepEqual(await getCounters(), [original[0], original[1], original[2] + 3]);
    await database.pool.query(
      "UPDATE steam_catalog_games SET developer='Updated' WHERE steam_app_id IN (1999901,1999902)",
    );
    assert.deepEqual(await getCounters(), [original[0], original[1], original[2] + 3]);

    const connection = await database.pool.connect();
    try {
      await connection.query("BEGIN");
      await connection.query(
        "UPDATE steam_catalog_games SET status='review' WHERE steam_app_id IN (1999901,1999902)",
      );
      const preview = (await connection.query(
        "SELECT review,ready FROM steam_catalog_status_counts WHERE id=1",
      )).rows[0];
      assert.equal(Number(preview.review), original[1] + 2);
      await connection.query("ROLLBACK");
    } finally {
      connection.release();
    }
    assert.deepEqual(await getCounters(), [original[0], original[1], original[2] + 3]);
    await database.pool.query(
      "DELETE FROM steam_catalog_games WHERE steam_app_id BETWEEN 1999901 AND 1999903",
    );
    assert.deepEqual(await getCounters(), original);
    assert.deepEqual(await getCounters(), await getActual());

    const response = await request(app).get("/api/steam-catalog/games").expect(200);
    assert.equal(response.body.counts.all, 2003);
    const pending = await request(app).get("/api/steam-catalog/queue").expect(200);
    assert.equal(pending.body.pendingCount, original[0] + original[1]);
  });

  test("48 simultaneous editors preserve classification versions and exact global counters", async () => {
    const edits = await rows<{ id: number; status: string; classification_revision: number }>(
      "SELECT id,status,classification_revision FROM steam_catalog_games " +
      "WHERE name BETWEEN 'Test Game 0101' AND 'Test Game 0148' ORDER BY name",
    );
    assert.equal(edits.length, 48);
    assert.ok(edits.every((item) => item.classification_revision === 1));
    const [before] = await rows<{ u: string; r: string; y: string }>(
      "SELECT unclassified::text AS u,review::text AS r,ready::text AS y " +
      "FROM steam_catalog_status_counts WHERE id=1",
    );
    const changed = edits.map((item) => ({
      ...item,
      next: item.status === "review" ? "unclassified" : "review",
    }));
    const started = performance.now();
    const writes = await Promise.all(changed.map((item) =>
      request(app).put("/api/steam-catalog/games/" + item.id + "/classification")
        .set(edit()).send({ status: item.next, expectedRevision: item.classification_revision, assignments: [] }),
    ));
    const elapsed = Math.round((performance.now() - started) * 100) / 100;
    assert.deepEqual([...new Set(writes.map((response) => response.status))], [200]);
    assert.ok(writes.every((response) => response.body.classificationRevision === 2));
    const ids = edits.map((item) => item.id);
    const refreshed = await rows<{ id: number; status: string; classification_revision: number }>(
      "SELECT id,status,classification_revision FROM steam_catalog_games WHERE id=ANY($1::integer[])",
      [ids],
    );
    const byId = new Map(refreshed.map((item) => [item.id, item]));
    for (const edit of changed) {
      assert.equal(byId.get(edit.id)?.classification_revision, 2);
      assert.equal(byId.get(edit.id)?.status, edit.next);
    }
    const [after] = await rows<{ u: string; r: string; y: string }>(
      "SELECT unclassified::text AS u,review::text AS r,ready::text AS y " +
      "FROM steam_catalog_status_counts WHERE id=1",
    );
    const expectedUnclassifiedDelta = changed.filter((x) => x.next === "unclassified").length -
      changed.filter((x) => x.status === "unclassified").length;
    const expectedReviewDelta = changed.filter((x) => x.next === "review").length -
      changed.filter((x) => x.status === "review").length;
    const expectedReadyDelta = changed.filter((x) => x.next === "ready").length -
      changed.filter((x) => x.status === "ready").length;
    assert.equal(Number(after.u), Number(before.u) + expectedUnclassifiedDelta);
    assert.equal(Number(after.r), Number(before.r) + expectedReviewDelta);
    assert.equal(Number(after.y), Number(before.y) + expectedReadyDelta);
    const actual = await rows<{ status: string; total: string }>(
      "SELECT status,count(*)::text AS total FROM steam_catalog_games GROUP BY status",
    );
    for (const row of actual) {
      const expected = Number(after[row.status === "unclassified" ? "u" : row.status === "review" ? "r" : "y"]);
      assert.equal(Number(row.total), expected);
    }
    console.log("CATALOG_48_PARALLEL_EDITS " + JSON.stringify({ count: writes.length, elapsed_ms: elapsed }));
  });

  test("literal SQL wildcards, publisher and exact AppID", async () => {
    const percent = await request(app).get("/api/steam-catalog/games").query({ query: "100%" }).expect(200);
    assert.deepEqual(percent.body.games.map((x: { name: string }) => x.name), ["Special 100% Game"]);
    const underscore = await request(app).get("/api/steam-catalog/games").query({ query: "Special_" }).expect(200);
    assert.deepEqual(underscore.body.games.map((x: { name: string }) => x.name), ["Special_One"]);
    const id = await request(app).get("/api/steam-catalog/games").query({ query: "1700002" }).expect(200);
    assert.deepEqual(id.body.games.map((x: { steamAppId: number }) => x.steamAppId), [1700002]);
    const publisher = await request(app).get("/api/steam-catalog/games").query({ query: "Example Publisher" }).expect(200);
    assert.ok(publisher.body.pagination.total > 100);
  });

  test("filtered search cursors preserve pagination order and status constraints", async () => {
    const base = "/api/steam-catalog/games?query=Example%20Publisher&status=review&pageSize=7";
    const first = await request(app).get(base + "&page=1").expect(200);
    assert.equal(first.body.games.length, 7);
    assert.ok(first.body.pagination.total > 7);
    const nextCursor = first.body.pagination.nextCursor;
    assert.equal(typeof nextCursor, "string");
    const offset = await request(app).get(base + "&page=2").expect(200);
    const keyed = await request(app).get(base + "&page=2&cursor=" + encodeURIComponent(nextCursor)).expect(200);
    assert.deepEqual(
      keyed.body.games.map((x: { id: number }) => x.id),
      offset.body.games.map((x: { id: number }) => x.id),
    );
    assert.ok(keyed.body.games.every((x: { status: string }) => x.status === "review"));
    await request(app).get(
      "/api/steam-catalog/games?query=Example%20Publisher&status=ready&page=2&pageSize=7&cursor=" +
      encodeURIComponent(nextCursor),
    ).expect(400);
  });

  test("strict query bounds and read ID validation", async () => {
    await request(app).get("/api/steam-catalog/games?page=0").expect(400);
    await request(app).get("/api/steam-catalog/games?pageSize=101").expect(400);
    await request(app).get("/api/steam-catalog/games/12abc").expect(400);
    await request(app).get("/api/steam-catalog/queue?currentId=2abc").expect(400);
    await request(app).put("/api/steam-catalog/games/1/classification")
      .send({ status: "review", assignments: [] }).expect(403);
  });

  test("next pending game advances and wraps without returning itself", async () => {
    const [start] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_games WHERE name='Test Game 0001'",
    );
    const queue = await request(app).get("/api/steam-catalog/queue").query({ currentId: start.id }).expect(200);
    const [expected] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_games WHERE status <> 'ready' " +
      "AND (name, id) > ('Test Game 0001', $1) ORDER BY name, id LIMIT 1", [start.id],
    );
    assert.equal(queue.body.nextId, expected.id);
    const [last] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_games WHERE status <> 'ready' ORDER BY name DESC,id DESC LIMIT 1",
    );
    const [earliest] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_games WHERE status <> 'ready' ORDER BY name,id LIMIT 1",
    );
    const wrapped = await request(app).get("/api/steam-catalog/queue").query({ currentId: last.id }).expect(200);
    assert.equal(wrapped.body.nextId, earliest.id);
    assert.ok(wrapped.body.pendingCount > 1500);
    const noCurrent = await request(app).get("/api/steam-catalog/queue").expect(200);
    assert.equal(noCurrent.body.nextId, earliest.id);
    const missingCurrent = await request(app).get("/api/steam-catalog/queue")
      .query({ currentId: 2147483647 }).expect(200);
    assert.equal(missingCurrent.body.nextId, earliest.id);
    assert.equal(missingCurrent.body.pendingCount, wrapped.body.pendingCount);
    const [readyGame] = await rows<{ id: number; name: string }>(
      "SELECT id,name FROM steam_catalog_games WHERE status='ready' ORDER BY name,id LIMIT 1",
    );
    const [expectedAfterReady] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_games WHERE status<>'ready' " +
      "AND (name,id)>($1,$2) ORDER BY name,id LIMIT 1",
      [readyGame.name, readyGame.id],
    );
    const fromReady = await request(app).get("/api/steam-catalog/queue")
      .query({ currentId: readyGame.id }).expect(200);
    assert.equal(fromReady.body.nextId, expectedAfterReady.id);
  });

  test("editor saves a draft, rejects incomplete ready, accepts complete ready", async () => {
    const [game] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_games WHERE name='Test Game 0010'",
    );
    const [genre] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_terms WHERE facet='genre' ORDER BY id LIMIT 1",
    );
    const [mechanic] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_terms WHERE facet='mechanic' ORDER BY id LIMIT 1",
    );
    const url = "/api/steam-catalog/games/" + game.id;
    await request(app).put(url + "/classification").set(edit()).send({
      status: "review", expectedRevision: 1, assignments: [{ termId: genre.id, role: "default" }],
    }).expect(200);
    const draft = await request(app).get(url).expect(200);
    assert.equal(draft.body.game.status, "review");
    assert.equal(draft.body.game.classificationRevision, 2);
    assert.deepEqual(draft.body.game.assignments.map((x: { termId: number }) => x.termId), [genre.id]);

    const failed = await request(app).put(url + "/classification").set(edit()).send({
      status: "ready", expectedRevision: 2, assignments: [{ termId: genre.id, role: "default" }],
    }).expect(422);
    assert.equal(failed.body.code, "INCOMPLETE_CLASSIFICATION");
    assert.equal((await request(app).get(url).expect(200)).body.game.status, "review");

    const rest = await rows<{ id: number; facet: string }>(
      "SELECT DISTINCT ON (facet) id,facet FROM steam_catalog_terms " +
      "WHERE facet IN ('mode','structure','world','visual') ORDER BY facet,id",
    );
    const assignments = [
      { termId: genre.id, role: "default" },
      { termId: mechanic.id, role: "main" },
      ...rest.map((x) => ({ termId: x.id, role: "default" })),
    ];
    await request(app).put(url + "/classification").set(edit()).send({ status: "ready", expectedRevision: 2, assignments }).expect(200);
    const ready = await request(app).get(url).expect(200);
    assert.equal(ready.body.game.status, "ready");
    assert.equal(ready.body.game.classificationRevision, 3);
    assert.equal(ready.body.game.assignments.length, assignments.length);
  });


  test("two concurrent editors cannot overwrite each other's assignments", async () => {
    const [game] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_games WHERE name='Test Game 0020'",
    );
    const [genre] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_terms WHERE facet='genre' ORDER BY id LIMIT 1",
    );
    const url = "/api/steam-catalog/games/" + game.id;
    const initial = await request(app).get(url).expect(200);
    assert.equal(initial.body.game.classificationRevision, 1);
    const required = await request(app).put(url + "/classification").set(edit())
      .send({ status: "review", assignments: [] }).expect(428);
    assert.equal(required.body.code, "CLASSIFICATION_REVISION_REQUIRED");

    const [first, second] = await Promise.all([
      request(app).put(url + "/classification").set(edit()).send({
        expectedRevision: 1, status: "review",
        assignments: [{ termId: genre.id, role: "default" }],
      }),
      request(app).put(url + "/classification").set(edit()).send({
        expectedRevision: 1, status: "review", assignments: [],
      }),
    ]);
    assert.deepEqual([first.status, second.status].sort(), [200, 409]);
    assert.equal((first.status === 409 ? first : second).body.code, "CLASSIFICATION_CONFLICT");
    const actual = await request(app).get(url).expect(200);
    assert.equal(actual.body.game.classificationRevision, 2);
    assert.equal(actual.body.game.assignments.length, first.status === 200 ? 1 : 0);

    await request(app).put(url + "/classification").set(edit()).send({
      expectedRevision: 2, status: "review",
      assignments: [{ termId: genre.id, role: "default" }],
    }).expect(200);
    const latest = await request(app).get(url).expect(200);
    assert.equal(latest.body.game.classificationRevision, 3);
    assert.equal(latest.body.game.assignments.length, 1);
  });

  test("taxonomy modifications require the secret and become publicly readable", async () => {
    await request(app).post("/api/steam-catalog/taxonomy")
      .send({ facet: "mechanic", label: "Integration Lab" }).expect(403);
    const created = await request(app).post("/api/steam-catalog/taxonomy").set(edit())
      .send({ facet: "mechanic", label: "Integration Lab" }).expect(201);
    assert.equal(created.body.term.slug, "integration-lab");
    const publicTerms = await request(app).get("/api/steam-catalog/taxonomy").expect(200);
    assert.ok(publicTerms.body.terms.some((x: { id: number }) => x.id === created.body.term.id));
  });


  test("re-importing Steam metadata preserves manual classification and status", async () => {
    const [game] = await rows<{ id: number; steam_app_id: number }>(
      "SELECT id,steam_app_id FROM steam_catalog_games WHERE name='Test Game 0005'",
    );
    const [genre] = await rows<{ id: number }>(
      "SELECT id FROM steam_catalog_terms WHERE facet='genre' ORDER BY id LIMIT 1",
    );
    const url = "/api/steam-catalog/games/" + game.id;
    await request(app).put(url + "/classification").set(edit()).send({
      status: "review", expectedRevision: 1, assignments: [{ termId: genre.id, role: "default" }],
    }).expect(200);

    const originalFetch = globalThis.fetch;
    let steamRequests = 0;
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const upstream = String(input);
      assert.ok(upstream.startsWith("https://store.steampowered.com/api/appdetails"));
      assert.ok(upstream.includes(String(game.steam_app_id)));
      steamRequests += 1;
      return Response.json({
        [game.steam_app_id]: {
          success: true,
          data: {
            name: "Test Game 0005 (Steam updated)",
            developers: ["Updated Studio"],
            publishers: ["Updated Publisher"],
            short_description: "New public description",
          },
        },
      });
    }) as typeof fetch;
    try {
      const imported = await request(app).post("/api/steam-catalog/import").set(edit())
        .send({ appId: game.steam_app_id }).expect(201);
      assert.equal(imported.body.game.id, game.id);
      assert.equal(steamRequests, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
    const preserved = await request(app).get(url).expect(200);
    assert.equal(preserved.body.game.name, "Test Game 0005 (Steam updated)");
    assert.equal(preserved.body.game.developer, "Updated Studio");
    assert.equal(preserved.body.game.status, "review");
    assert.deepEqual(preserved.body.game.assignments.map((x: { termId: number }) => x.termId), [genre.id]);
  });

  test("anonymous imports are blocked before calling Steam", async () => {
    await request(app).post("/api/steam-catalog/import").send({ appId: 620 }).expect(403);
    await request(app).post("/api/steam-catalog/import").set(edit()).send({ appId: "invalid" }).expect(400);
  });
  test("discovery uses the server-only Steam key, paginates and hides existing games", async () => {
    const priorKey = process.env.STEAM_WEB_API_KEY;
    const priorFetch = globalThis.fetch;
    let steamCalls = 0;
    try {
      delete process.env.STEAM_WEB_API_KEY;
      await request(app).post("/api/steam-catalog/discover")
        .send({ cursor: 1500000 }).expect(403);
      const missingKey = await request(app).post("/api/steam-catalog/discover").set(edit())
        .send({ cursor: 1500000 }).expect(503);
      assert.equal(missingKey.body.code, "STEAM_DISCOVERY_NOT_CONFIGURED");
      process.env.STEAM_WEB_API_KEY = "0123456789abcdef0123456789abcdef";
      globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
        const source = new URL(String(input));
        assert.equal(source.hostname, "api.steampowered.com");
        assert.equal(source.pathname, "/IStoreService/GetAppList/v1/");
        assert.equal(source.searchParams.get("key"), process.env.STEAM_WEB_API_KEY);
        assert.equal(source.searchParams.get("include_dlc"), "false");
        assert.equal(source.searchParams.get("last_appid"), "1500000");
        steamCalls++;
        return Response.json({ response: {
          apps: [
            { appid: 1500001, name: "Test Game 0001" },
            { appid: 1900123, name: "New Steam Game" },
            { appid: 1900124, name: "Another Steam Game" },
          ],
          last_appid: 1900124,
          have_more_results: true,
        } });
      }) as typeof fetch;
      const discovery = await request(app).post("/api/steam-catalog/discover").set(edit())
        .send({ cursor: 1500000, pageSize: 10 }).expect(200);
      assert.equal(steamCalls, 1);
      assert.deepEqual(discovery.body.candidates, [
        { appId: 1900123, name: "New Steam Game" },
        { appId: 1900124, name: "Another Steam Game" },
      ]);
      assert.equal(discovery.body.alreadyInCatalog, 1);
      assert.equal(discovery.body.nextCursor, 1900124);
      assert.equal(discovery.body.hasMore, true);
    } finally {
      globalThis.fetch = priorFetch;
      if (priorKey === undefined) delete process.env.STEAM_WEB_API_KEY;
      else process.env.STEAM_WEB_API_KEY = priorKey;
    }
  });

  test("batch import grows catalogue with real-game checks, dedup and exact counters", async () => {
    const previousFetch = globalThis.fetch;
    const appIds = [1900123, 1900124, 1900125, 1500001];
    const seen: number[] = [];
    const [original] = await rows<{ total: string }>(
      "SELECT unclassified+review+ready AS total FROM steam_catalog_status_counts WHERE id=1",
    );
    try {
      globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
        const url = new URL(String(input));
        assert.equal(url.hostname, "store.steampowered.com");
        const appId = Number(url.searchParams.get("appids"));
        seen.push(appId);
        return Response.json({ [appId]: appId === 1900125
          ? { success: false }
          : { success: true, data: {
              name: appId === 1900123 ? "Imported Game" : "Imported DLC",
              type: appId === 1900123 ? "game" : "dlc",
              developers: ["Real Studio"], publishers: ["Real Publisher"],
            } },
        });
      }) as typeof fetch;
      const denied = await request(app).post("/api/steam-catalog/import-batch")
        .send({ appIds }).expect(403);
      assert.equal(denied.body.code, "STEAM_CATALOG_ADMIN_REQUIRED");
      await request(app).post("/api/steam-catalog/import-batch").set(edit())
        .send({ appIds: Array.from({ length: 11 }, (_, index) => index + 1) }).expect(400);
      const first = await request(app).post("/api/steam-catalog/import-batch").set(edit())
        .send({ appIds }).expect(200);
      assert.deepEqual(seen, [1900123, 1900124, 1900125]);
      assert.equal(first.body.inserted, 1);
      assert.equal(first.body.existing, 1);
      assert.equal(first.body.ignored, 2);
      assert.equal(first.body.failed, 0);
      assert.equal(first.body.aborted, false);
      const [imported] = await rows<{ name: string; status: string; developer: string }>(
        "SELECT name,status,developer FROM steam_catalog_games WHERE steam_app_id=1900123",
      );
      assert.deepEqual(imported, { name: "Imported Game", status: "unclassified", developer: "Real Studio" });
      const [updated] = await rows<{ total: string }>(
        "SELECT unclassified+review+ready AS total FROM steam_catalog_status_counts WHERE id=1",
      );
      assert.equal(Number(updated.total), Number(original.total) + 1);
      seen.length = 0;
      const second = await request(app).post("/api/steam-catalog/import-batch").set(edit())
        .send({ appIds: [1900123, 1500001] }).expect(200);
      assert.equal(second.body.inserted, 0);
      assert.equal(second.body.existing, 2);
      assert.deepEqual(seen, []);
    } finally {
      globalThis.fetch = previousFetch;
      await database.pool.query("DELETE FROM steam_catalog_games WHERE steam_app_id=1900123");
    }
    const [restored] = await rows<{ total: string }>(
      "SELECT unclassified+review+ready AS total FROM steam_catalog_status_counts WHERE id=1",
    );
    assert.equal(Number(restored.total), Number(original.total));
  });

  test("server import job survives pauses and lease recovery, inserts real games transactionally", async () => {
    const oldKey = process.env.STEAM_WEB_API_KEY;
    const oldFetch = globalThis.fetch;
    const { runCatalogImportStep } = await import("../src/application/catalog/steam-catalog-import-jobs");
    const [before] = await rows<{ total: string }>(
      "SELECT (unclassified + review + ready)::text AS total FROM steam_catalog_status_counts WHERE id=1",
    );
    const calls: string[] = [];
    let jobId = 0;
    try {
      delete process.env.STEAM_WEB_API_KEY;
      await request(app).post("/api/steam-catalog/import-job")
        .set(edit()).send({ maxGames: 5 }).expect(503);
      await request(app).post("/api/steam-catalog/import-job")
        .set(edit()).send({ maxGames: 20_001 }).expect(400);
      await request(app).get("/api/steam-catalog/import-job").expect(403);
      process.env.STEAM_WEB_API_KEY = "0123456789abcdef0123456789abcdef";
      globalThis.fetch = (async (url: Parameters<typeof fetch>[0]) => {
        const address = new URL(String(url));
        if (address.hostname === "api.steampowered.com") {
          calls.push("discover");
          assert.equal(address.searchParams.get("key"), process.env.STEAM_WEB_API_KEY);
          assert.equal(address.searchParams.get("last_appid"), "0");
          return Response.json({ response: {
            apps: [
              { appid: 1500001, name: "Already imported" },
              { appid: 1900401, name: "Fresh verified game" },
              { appid: 1900402, name: "Not a game" },
            ], last_appid: 1900402, have_more_results: false,
          } });
        }
        assert.equal(address.hostname, "store.steampowered.com");
        const id = Number(address.searchParams.get("appids"));
        calls.push("details-" + id);
        return Response.json({ [id]: { success: true, data: {
          type: id === 1900401 ? "game" : "dlc",
          name: id === 1900401 ? "Fresh verified game" : "DLC must be ignored",
          publishers: ["Studio"], developers: ["Studio"],
        } } });
      }) as typeof fetch;
      const started = await request(app).post("/api/steam-catalog/import-job")
        .set(edit()).send({ maxGames: 5 }).expect(201);
      jobId = Number(started.body.job.id);
      assert.equal(started.body.job.status, "running");
      assert.equal(started.body.job.maxGames, 5);
      await request(app).post("/api/steam-catalog/import-job")
        .set(edit()).send({ maxGames: 5 }).expect(409);
      const claims = await Promise.all([runCatalogImportStep(), runCatalogImportStep()]);
      assert.deepEqual(claims.sort(), [false, true]);
      assert.deepEqual(calls, ["discover"]);
      const discovered = await request(app).get("/api/steam-catalog/import-job")
        .set(edit()).expect(200);
      assert.equal(discovered.body.job.pending, 3);
      assert.equal(discovered.body.job.cursor, 1900402);
      assert.equal(discovered.body.job.scanned, 3);
      await request(app).post("/api/steam-catalog/import-job/" + jobId + "/pause")
        .set(edit()).expect(200);
      assert.equal(await runCatalogImportStep(), false);
      const paused = await request(app).get("/api/steam-catalog/import-job")
        .set(edit()).expect(200);
      assert.equal(paused.body.job.status, "paused");
      await request(app).post("/api/steam-catalog/import-job/" + jobId + "/resume")
        .set(edit()).expect(200);
      // Simulate crashed worker's expired lease to test cross-process reclaim.
      await database.pool.query(
        "UPDATE steam_catalog_import_jobs SET lease_token=$1::uuid, " +
        "lease_expires_at=now()-interval '1 second',next_run_at=now() WHERE id=$2",
        ["48bf8188-59f3-4d52-9a90-bfb668bc887b", jobId],
      );
      for (let index = 0; index < 3; index++) {
        await database.pool.query(
          "UPDATE steam_catalog_import_jobs SET next_run_at=now() WHERE id=$1", [jobId],
        );
        assert.equal(await runCatalogImportStep(), true);
      }
      const ended = await request(app).get("/api/steam-catalog/import-job")
        .set(edit()).expect(200);
      assert.equal(ended.body.job.status, "completed");
      assert.equal(ended.body.job.processed, 3);
      assert.equal(ended.body.job.inserted, 1);
      assert.equal(ended.body.job.existing, 1);
      assert.equal(ended.body.job.ignored, 1);
      assert.equal(ended.body.job.pending, 0);
      assert.deepEqual(calls, ["discover", "details-1900401", "details-1900402"]);
      const imported = await rows<{ name: string; status: string }>(
        "SELECT name,status FROM steam_catalog_games WHERE steam_app_id=1900401",
      );
      assert.deepEqual(imported, [{ name: "Fresh verified game", status: "unclassified" }]);
      const [after] = await rows<{ total: string }>(
        "SELECT (unclassified + review + ready)::text AS total FROM steam_catalog_status_counts WHERE id=1",
      );
      assert.equal(Number(after.total), Number(before.total) + 1);
    } finally {
      globalThis.fetch = oldFetch;
      if (oldKey === undefined) delete process.env.STEAM_WEB_API_KEY;
      else process.env.STEAM_WEB_API_KEY = oldKey;
      await database.pool.query("DELETE FROM steam_catalog_games WHERE steam_app_id=1900401");
      if (jobId) await database.pool.query("DELETE FROM steam_catalog_import_jobs WHERE id=$1", [jobId]);
    }
  });

  test("20k-record workload: paged browse, text search and pending queue", async () => {
    await database.pool.query([
      "INSERT INTO steam_catalog_games (steam_app_id, name, steam_url, developer, publisher, status)",
      "SELECT 1500000+n, 'Test Game ' || n::text,",
      "'https://store.steampowered.com/app/' || (1500000+n),",
      "'Bulk Studio', 'Bulk Publisher',",
      "CASE WHEN n%7=0 THEN 'ready' WHEN n%3=0 THEN 'review' ELSE 'unclassified' END",
      "FROM generate_series(2001,20000) n",
    ].join(" "));
    const timings: Record<string, number> = {};
    const measured = async (key: string, url: string) => {
      const started = performance.now();
      const res = await request(app).get(url).expect(200);
      timings[key] = Math.round((performance.now() - started) * 100) / 100;
      return res.body;
    };
    const first = await measured("browse_first_ms", "/api/steam-catalog/games?page=1&pageSize=25");
    const middle = await measured("browse_middle_ms", "/api/steam-catalog/games?page=400&pageSize=25");
    const last = await measured("browse_last_ms", "/api/steam-catalog/games?page=801&pageSize=25");
    // Resolve a deep anchor only once with the legacy page API. Subsequent
    // navigation must match page 400 without scanning ~10k preceding rows.
    const prior = await measured("browse_previous_offset_ms", "/api/steam-catalog/games?page=399&pageSize=25");
    assert.equal(typeof prior.pagination.nextCursor, "string");
    const withCursor = await measured(
      "browse_middle_cursor_ms",
      "/api/steam-catalog/games?page=400&pageSize=25&cursor=" + encodeURIComponent(prior.pagination.nextCursor),
    );
    assert.deepEqual(
      withCursor.games.map((x: { id: number }) => x.id),
      middle.games.map((x: { id: number }) => x.id),
    );
    const searched = await measured("exact_name_ms", "/api/steam-catalog/games?query=Test%20Game%2019999");
    const filtered = await measured("status_filter_ms", "/api/steam-catalog/games?pageSize=50&status=review");
    const queue = await measured("pending_queue_ms", "/api/steam-catalog/queue");
    const parallelStarted = performance.now();
    const parallel = await Promise.all(Array.from({ length: 12 }, () =>
      request(app).get("/api/steam-catalog/games?page=400&pageSize=25&cursor=" +
        encodeURIComponent(prior.pagination.nextCursor)).expect(200),
    ));
    timings.twelve_parallel_cursor_ms = Math.round((performance.now() - parallelStarted) * 100) / 100;
    assert.ok(parallel.every((item) => item.body.games.length === 25));
    assert.ok(parallel.every((item) =>
      item.body.games.every((game: { id: number }, index: number) => game.id === withCursor.games[index].id)));

    assert.equal(first.pagination.total, 20003);
    assert.equal(first.games.length, 25);
    assert.equal(middle.games.length, 25);
    assert.equal(last.games.length, 3);
    assert.equal(searched.pagination.total, 1);
    assert.equal(searched.games[0].name, "Test Game 19999");
    assert.equal(filtered.games.length, 50);
    assert.equal(queue.pendingCount, first.counts.unclassified + first.counts.review);
    assert.ok(Number.isInteger(queue.nextId));
    assert.equal(first.games.some((x: Record<string, unknown>) => "assignments" in x), false);
    // Environment-dependent observations, NOT a production latency SLA.
    console.log("CATALOG_20K_HTTP_TIMINGS_MS " + JSON.stringify(timings));
  });


  test("100k records: status totals, selective substring searches, legacy and cursor pages", async () => {
    // Fast PostgreSQL set-based seed; no external Steam traffic or user data.
    await database.pool.query([
      "INSERT INTO steam_catalog_games (steam_app_id,name,steam_url,developer,publisher,status)",
      "SELECT 1500000+n, 'Large Game ' || n::text,",
      "'https://store.steampowered.com/app/' || (1500000+n),",
      "'Scale Test Studio', 'Scale Test Publisher',",
      "CASE WHEN n%7=0 THEN 'ready' WHEN n%3=0 THEN 'review' ELSE 'unclassified' END",
      "FROM generate_series(20001,100000) n",
    ].join(" "));
    // A single huge seed leaves unflushed entries in pg_trgm GIN pending
    // lists. Measure fresh-import behavior separately from steady-state reads.
    const beforeVacuum = performance.now();
    await request(app).get("/api/steam-catalog/games?query=Large%20Game%2099999").expect(200);
    const beforeVacuumMs = Math.round((performance.now() - beforeVacuum) * 100) / 100;
    const vacuumStarted = performance.now();
    await database.pool.query("VACUUM (ANALYZE) steam_catalog_games");
    const vacuumMs = Math.round((performance.now() - vacuumStarted) * 100) / 100;
    const afterVacuum = performance.now();
    await request(app).get("/api/steam-catalog/games?query=Large%20Game%2099999").expect(200);
    const afterVacuumMs = Math.round((performance.now() - afterVacuum) * 100) / 100;
    console.log("CATALOG_100K_GIN_MAINTENANCE " + JSON.stringify({
      fresh_import_http_ms: beforeVacuumMs,
      vacuum_ms: vacuumMs,
      after_vacuum_http_ms: afterVacuumMs,
    }));

    const metrics: Record<string, number> = {};
    const measure = async (label: string, url: string) => {
      const start = performance.now();
      const result = await request(app).get(url).expect(200);
      metrics[label] = Math.round((performance.now() - start) * 100) / 100;
      return result.body;
    };
    const first = await measure("first_page_ms", "/api/steam-catalog/games?pageSize=25");
    assert.equal(first.pagination.total, 100003);
    assert.equal(first.counts.all, 100003);
    assert.equal(first.games.length, 25);
    assert.equal(first.counts.ready + first.counts.review + first.counts.unclassified, 100003);
    // Trigger counter must agree with the live 100k-row table after bulk import.
    const [actualCounts] = await rows<{ u: string; r: string; y: string }>(
      "SELECT count(*) FILTER (WHERE status='unclassified') AS u," +
      "count(*) FILTER (WHERE status='review') AS r," +
      "count(*) FILTER (WHERE status='ready') AS y FROM steam_catalog_games",
    );
    assert.deepEqual(
      [first.counts.unclassified, first.counts.review, first.counts.ready],
      [Number(actualCounts.u), Number(actualCounts.r), Number(actualCounts.y)],
    );

    const filter = await measure("ready_filter_ms", "/api/steam-catalog/games?status=ready&pageSize=25");
    assert.equal(filter.pagination.total, first.counts.ready);
    assert.equal(filter.counts.all, 100003);

    const exact = await measure("selective_name_ms", "/api/steam-catalog/games?query=Large%20Game%2099999");
    assert.equal(exact.pagination.total, 1);
    assert.equal(exact.games[0].name, "Large Game 99999");
    const publisher = await measure("selective_publisher_ms", "/api/steam-catalog/games?query=Example%20Publisher");
    assert.ok(publisher.pagination.total > 100);
    const id = await measure("app_id_ms", "/api/steam-catalog/games?query=1600000");
    assert.equal(id.pagination.total, 1);
    assert.equal(id.games[0].steamAppId, 1600000);
    // Compare an exact-count window plan with the two-query implementation
    // for a broad search. This is diagnostic until repeat measurements justify
    // any production SQL change.
    const broadSql = [
      "SELECT id,name,count(*) OVER() AS matching_total FROM steam_catalog_games",
      "WHERE status='ready' AND (name ILIKE $1 OR developer ILIKE $1 OR publisher ILIKE $1)",
      "ORDER BY name,id LIMIT 26",
    ].join(" ");
    const broadWindow: number[] = [];
    const broadSplit: number[] = [];
    for (let i = 0; i < 3; i++) {
      const startedWindow = performance.now();
      const windowRows = await rows<{ id: number; matching_total: string }>(
        broadSql, ["%Scale Test Publisher%"],
      );
      broadWindow.push(Math.round((performance.now() - startedWindow) * 100) / 100);
      assert.ok(windowRows.length === 26);
      const startedSplit = performance.now();
      const [countRow] = await rows<{ n: string }>(
        "SELECT count(*) AS n FROM steam_catalog_games WHERE status='ready' " +
        "AND (name ILIKE $1 OR developer ILIKE $1 OR publisher ILIKE $1)",
        ["%Scale Test Publisher%"],
      );
      const firstRows = await rows<{ id: number }>(
        "SELECT id FROM steam_catalog_games WHERE status='ready' " +
        "AND (name ILIKE $1 OR developer ILIKE $1 OR publisher ILIKE $1) " +
        "ORDER BY name,id LIMIT 26",
        ["%Scale Test Publisher%"],
      );
      broadSplit.push(Math.round((performance.now() - startedSplit) * 100) / 100);
      assert.equal(Number(countRow.n), Number(windowRows[0].matching_total));
      assert.deepEqual(firstRows.map(x=>x.id),windowRows.map(x=>x.id));
    }
    console.log("CATALOG_100K_BROAD_WINDOW_COMPARE " + JSON.stringify({
      window_ms: broadWindow, split_ms: broadSplit,
    }));
    const broad = await measure(
      "broad_publisher_ms", "/api/steam-catalog/games?query=Scale%20Test%20Publisher&status=ready",
    );
    assert.ok(broad.pagination.total > 2_000);
    assert.ok(broad.games.every((x: { status: string }) => x.status === "ready"));
    const literal = await measure("literal_percent_ms", "/api/steam-catalog/games?query=100%25");
    assert.deepEqual(literal.games.map((x: { name: string }) => x.name), ["Special 100% Game"]);

    const legacy = await measure("deep_offset_ms", "/api/steam-catalog/games?page=3500&pageSize=25");
    const previous = await measure("anchor_offset_ms", "/api/steam-catalog/games?page=3499&pageSize=25");
    const cursorUrl = "/api/steam-catalog/games?page=3500&pageSize=25&cursor=" +
      encodeURIComponent(previous.pagination.nextCursor);
    const keyed = await measure("deep_cursor_ms", cursorUrl);
    assert.deepEqual(keyed.games.map((x: { id: number }) => x.id),
      legacy.games.map((x: { id: number }) => x.id));

    const begin = performance.now();
    const batch = await Promise.all(Array.from({ length: 12 }, () => request(app).get(cursorUrl).expect(200)));
    metrics.parallel_12_cursor_ms = Math.round((performance.now() - begin) * 100) / 100;
    assert.ok(batch.every((response) =>
      response.body.games.map((x: { id: number }) => x.id).join(",") ===
      keyed.games.map((x: { id: number }) => x.id).join(",")));
    // Repeat each HTTP request three times to separate actual SQL stages
    // from routing, ORM, network and test-runner scheduling overhead.
    const probes: Record<string, Array<{ http_ms: number; stages: string }>> = {};
    for (const [name, url] of [
      ["name", "/api/steam-catalog/games?query=Large%20Game%2099999"],
      ["publisher", "/api/steam-catalog/games?query=Example%20Publisher"],
      ["app_id", "/api/steam-catalog/games?query=1600000"],
      ["literal", "/api/steam-catalog/games?query=100%25"],
      ["unfiltered", "/api/steam-catalog/games?pageSize=25"],
    ] as const) {
      probes[name] = [];
      for (let n = 0; n < 3; n++) {
        const started = performance.now();
        const response = await request(app).get(url).set("x-catalog-perf-probe", "1").expect(200);
        const elapsed = Math.round((performance.now() - started) * 100) / 100;
        const header = String(response.headers["server-timing"] ?? "");
        assert.match(header, /^global_counts;dur=[\d.]+, match_count;dur=[\d.]+, page_select;dur=[\d.]+$/);
        probes[name].push({ http_ms: elapsed, stages: header });
      }
    }
    const withoutProbe = await request(app).get("/api/steam-catalog/games?query=1600000").expect(200);
    assert.equal(withoutProbe.headers["server-timing"], undefined);
    console.log("CATALOG_100K_STAGE_TIMINGS " + JSON.stringify(probes));
    // Record the database access plan separately from HTTP timings to
    // distinguish GIN index use from global-count and sequential-scan costs.
    const like = "%Large Game 99999%";
    const generated = database.db.select({ total: count() })
      .from(database.steamCatalogGames)
      .where(or(
        ilike(database.steamCatalogGames.name, like),
        ilike(database.steamCatalogGames.developer, like),
        ilike(database.steamCatalogGames.publisher, like),
      )).toSQL();
    const driverBench: Record<string, number[]> = { raw: [], drizzle: [], raw_publisher: [] };
    for (let i = 0; i < 3; i++) {
      const rawBegin = performance.now();
      const pgResult = await database.pool.query(generated.sql, generated.params);
      driverBench.raw.push(Math.round((performance.now() - rawBegin) * 100) / 100);
      assert.equal(Number(pgResult.rows[0].count), 1);

      const drizzleBegin = performance.now();
      const ormResult = await database.db.select({ total: count() })
        .from(database.steamCatalogGames)
        .where(or(
          ilike(database.steamCatalogGames.name, like),
          ilike(database.steamCatalogGames.developer, like),
          ilike(database.steamCatalogGames.publisher, like),
        ));
      driverBench.drizzle.push(Math.round((performance.now() - drizzleBegin) * 100) / 100);
      assert.equal(Number(ormResult[0].total), 1);

      const publisherBegin = performance.now();
      await database.pool.query(generated.sql, Array(3).fill("%Example Publisher%"));
      driverBench.raw_publisher.push(Math.round((performance.now() - publisherBegin) * 100) / 100);
    }
    console.log("CATALOG_100K_DRIVER_BENCH " + JSON.stringify(driverBench));
    const generatedPlan = await rows<{ "QUERY PLAN": unknown }>(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + generated.sql, generated.params,
    );
    console.log("CATALOG_100K_DRIZZLE_QUERY " + JSON.stringify(generated));
    console.log("CATALOG_100K_DRIZZLE_EXPLAIN " + JSON.stringify(generatedPlan[0]?.["QUERY PLAN"]).slice(0, 8500));
    const searchPlans = await rows<{ "QUERY PLAN": unknown }>(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT count(*) FROM steam_catalog_games " +
      "WHERE name ILIKE $1 OR developer ILIKE $1 OR publisher ILIKE $1",
      ["%Large Game 99999%"],
    );
    const countPlans = await rows<{ "QUERY PLAN": unknown }>(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT count(*), " +
      "count(*) FILTER (WHERE status='review') FROM steam_catalog_games",
    );
    const orderedSearchPlans = await rows<{ "QUERY PLAN": unknown }>(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id,name,steam_app_id,developer,publisher " +
      "FROM steam_catalog_games WHERE name ILIKE $1 OR developer ILIKE $1 OR publisher ILIKE $1 " +
      "ORDER BY name,id LIMIT 26",
      ["%Large Game 99999%"],
    );
    const materializedPlans = await rows<{ "QUERY PLAN": unknown }>(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) WITH search_hits AS MATERIALIZED (" +
      "SELECT id FROM steam_catalog_games WHERE name ILIKE $1 OR developer ILIKE $1 OR publisher ILIKE $1" +
      ") SELECT g.id,g.name,g.steam_app_id,g.developer,g.publisher FROM steam_catalog_games g " +
      "JOIN search_hits hits ON hits.id=g.id ORDER BY g.name,g.id LIMIT 26",
      ["%Large Game 99999%"],
    );
    console.log("CATALOG_100K_ORDERED_EXPLAIN " + JSON.stringify(orderedSearchPlans[0]?.["QUERY PLAN"]).slice(0, 9000));
    console.log("CATALOG_100K_MATERIALIZED_EXPLAIN " + JSON.stringify(materializedPlans[0]?.["QUERY PLAN"]).slice(0, 9000));
    console.log("CATALOG_100K_SEARCH_EXPLAIN " + JSON.stringify(searchPlans[0]?.["QUERY PLAN"]).slice(0, 8000));
    console.log("CATALOG_100K_COUNTS_EXPLAIN " + JSON.stringify(countPlans[0]?.["QUERY PLAN"]).slice(0, 4000));
    const [counterPlans] = await rows<{ "QUERY PLAN": unknown }>(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT unclassified,review,ready FROM steam_catalog_status_counts WHERE id=1",
    );
    console.log("CATALOG_100K_COUNTER_ROW_EXPLAIN " + JSON.stringify(counterPlans?.["QUERY PLAN"]).slice(0, 4000));
    // Mixed public traffic exercises indexed listing, count+search, keyset
    // navigation and queue reads against the same 100k-row database.
    const scenarios = [
      "/api/steam-catalog/games?query=Large%20Game%2099999",
      "/api/steam-catalog/games?query=Scale%20Test%20Publisher&status=ready",
      "/api/steam-catalog/games?status=review&pageSize=25",
      cursorUrl,
      "/api/steam-catalog/queue",
    ];
    const scheduled = Array.from({ length: 60 }, (_, i) => ({
      type: i % scenarios.length,
      path: scenarios[i % scenarios.length],
    }));
    const loadStart = performance.now();
    const loadResults = await Promise.all(scheduled.map(async (job) => {
      const started = performance.now();
      const result = await request(app).get(job.path);
      return { type: job.type, status: result.status, body: result.body,
        duration: Math.round((performance.now() - started) * 100) / 100 };
    }));
    assert.ok(loadResults.every((item) => item.status === 200));
    const cohorts: Array<{ scenario: string; median_ms: number; p95_ms: number; n: number }> = [];
    for (let i = 0; i < scenarios.length; i++) {
      const bucket = loadResults.filter((x) => x.type === i);
      assert.equal(bucket.length, 12);
      if (i === 0) assert.ok(bucket.every((x) => x.body.pagination.total === 1));
      if (i === 1) assert.ok(bucket.every((x) => x.body.pagination.total > 2000));
      if (i === 2) assert.ok(bucket.every((x) => x.body.counts.all === 100003));
      if (i === 3) assert.ok(bucket.every((x) =>
        x.body.games.map((game: { id: number }) => game.id).join(",") ===
          keyed.games.map((game: { id: number }) => game.id).join(",")));
      if (i === 4) assert.ok(bucket.every((x) => Number.isInteger(x.body.nextId)));
      const durations = bucket.map((x) => x.duration).sort((a, b) => a - b);
      cohorts.push({ scenario: ["name", "broad_search", "status_filter", "cursor", "queue"][i],
        median_ms: durations[Math.floor(durations.length / 2)],
        p95_ms: durations[Math.ceil(durations.length * 0.95) - 1], n: durations.length });
    }
    console.log("CATALOG_100K_MIXED_LOAD " + JSON.stringify({
      requests: scheduled.length,
      total_elapsed_ms: Math.round((performance.now() - loadStart) * 100) / 100,
      cohorts,
    }));
    // Repeated bursts at independent concurrency levels. Use both identical
    // requests (eligible for coalescing) and different search strings (which
    // must never be merged). These are diagnostic measurements, not SLAs.
    const concurrencyProfiles: Array<{
      scenario: string; parallel: number; rounds: number;
      median_batch_ms: number; p95_batch_ms: number;
      median_request_ms: number; p95_request_ms: number;
    }> = [];
    const percentile = (sorted: number[], fraction: number) =>
      sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
    for (const parallel of [1, 8, 24, 48]) {
      for (const scenario of ["identical_selective", "distinct_selective", "identical_broad"] as const) {
        const batches: number[] = [];
        const individual: number[] = [];
        for (let round = 0; round < 3; round++) {
          const started = performance.now();
          const group = await Promise.all(Array.from({ length: parallel }, async (_, i) => {
            const searchTerm = scenario === "identical_broad"
              ? "Scale Test Publisher"
              : scenario === "distinct_selective"
                ? "Large Game " + (95000 + i)
                : "Large Game 99999";
            const url = "/api/steam-catalog/games?query=" + encodeURIComponent(searchTerm) +
              (scenario === "identical_broad" ? "&status=ready" : "");
            const startedRequest = performance.now();
            const response = await request(app).get(url).expect(200);
            individual.push(Math.round((performance.now() - startedRequest) * 100) / 100);
            if (scenario === "identical_broad") {
              assert.ok(response.body.pagination.total > 2_000);
              assert.ok(response.body.games.every((x: { status: string }) => x.status === "ready"));
            } else {
              assert.equal(response.body.pagination.total, 1);
              assert.equal(response.body.games[0].name, searchTerm);
            }
          }));
          assert.equal(group.length, parallel);
          batches.push(Math.round((performance.now() - started) * 100) / 100);
        }
        batches.sort((a, b) => a - b);
        individual.sort((a, b) => a - b);
        concurrencyProfiles.push({
          scenario, parallel, rounds: 3,
          median_batch_ms: percentile(batches, 0.5),
          p95_batch_ms: percentile(batches, 0.95),
          median_request_ms: percentile(individual, 0.5),
          p95_request_ms: percentile(individual, 0.95),
        });
      }
    }
    console.log("CATALOG_100K_CONCURRENCY_PROFILE " + JSON.stringify(concurrencyProfiles));
    console.log("CATALOG_100K_HTTP_TIMINGS_MS " + JSON.stringify(metrics));
  });


});
