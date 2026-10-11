import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, type TestDatabaseConfig } from "./test-database";

type Db = typeof import("@workspace/db");
const EDIT_KEY = randomBytes(32).toString("base64url");
const MIGRATIONS = [
  "0029_steam_game_catalog_v1.sql",
  "0030_steam_catalog_abstract_world.sql",
  "0031_steam_catalog_pagination_indexes.sql",
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
    assert.ok(counts.terms >= 80);
    const indexes = await rows<{ indexname: string }>(
      "SELECT indexname FROM pg_indexes WHERE schemaname=$1 AND tablename='steam_catalog_games'",
      [config.schema],
    );
    const names = new Set(indexes.map((x) => x.indexname));
    assert.ok(names.has("steam_catalog_games_name_id_idx"));
    assert.ok(names.has("steam_catalog_games_status_name_id_idx"));
  });

  test("2000+ records: bounded stable pages, metadata and clamping", async () => {
    const first = await request(app).get("/api/steam-catalog/games?page=1&pageSize=25").expect(200);
    const second = await request(app).get("/api/steam-catalog/games?page=2&pageSize=25").expect(200);
    assert.equal(first.body.pagination.total, 2003);
    assert.equal(first.body.pagination.totalPages, 81);
    assert.equal(first.body.games.length, 25);
    assert.equal(second.body.games.length, 25);
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
      status: "review", assignments: [{ termId: genre.id, role: "default" }],
    }).expect(200);
    const draft = await request(app).get(url).expect(200);
    assert.equal(draft.body.game.status, "review");
    assert.deepEqual(draft.body.game.assignments.map((x: { termId: number }) => x.termId), [genre.id]);

    const failed = await request(app).put(url + "/classification").set(edit()).send({
      status: "ready", assignments: [{ termId: genre.id, role: "default" }],
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
    await request(app).put(url + "/classification").set(edit()).send({ status: "ready", assignments }).expect(200);
    const ready = await request(app).get(url).expect(200);
    assert.equal(ready.body.game.status, "ready");
    assert.equal(ready.body.game.assignments.length, assignments.length);
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
      status: "review", assignments: [{ termId: genre.id, role: "default" }],
    }).expect(200);

    const originalFetch = globalThis.fetch;
    let steamRequests = 0;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
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
});
