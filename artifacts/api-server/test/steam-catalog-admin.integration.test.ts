import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, type TestDatabaseConfig } from "./test-database";

type Db = typeof import("@workspace/db");
const ADMIN = randomBytes(32).toString("base64url");
const INVALID_ADMIN = randomBytes(32).toString("base64url");
const SCHEMA = "tm_test_t030_auth";
const HEADERS = () => ({ "x-steam-catalog-admin-token": ADMIN });

let config: TestDatabaseConfig;
let db: Db;
let app: Express;
let gameId = 0;
let initialized = false;
const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  STEAM_CATALOG_ADMIN_TOKEN: process.env.STEAM_CATALOG_ADMIN_TOKEN,
  SESSION_SECRET: process.env.SESSION_SECRET,
};
const originalFetch = globalThis.fetch;

function restore(name: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

async function snapshot() {
  const result = await db.pool.query<{
    games: number; terms: number; assignments: number; fixture_status: string;
  }>(`
    SELECT
      (SELECT count(*)::int FROM steam_catalog_games) AS games,
      (SELECT count(*)::int FROM steam_catalog_terms) AS terms,
      (SELECT count(*)::int FROM steam_catalog_game_terms) AS assignments,
      (SELECT status FROM steam_catalog_games WHERE id = $1) AS fixture_status
  `, [gameId]);
  return result.rows[0];
}

const mutations = [
  { method: "post" as const, path: "/api/steam-catalog/taxonomy", body: { facet: "genre", label: "T030 Rejected" } },
  { method: "post" as const, path: "/api/steam-catalog/import", body: { appId: 1800556 } },
  { method: "put" as const, path: "/api/steam-catalog/games/:gameId/classification", body: { status: "ready", assignments: [] } },
];

async function mutate(
  mutation: typeof mutations[number],
  headers: Record<string, string> = {},
) {
  const path = mutation.path.replace(":gameId", String(gameId));
  return request(app)[mutation.method](path).set(headers).send(mutation.body);
}

before(async () => {
  // This helper rejects non-test DBs, suspicious hosts, and any unconfirmed reset.
  config = getSafeTestDatabaseConfig({
    ...process.env,
    TEST_DATABASE_SCHEMA: SCHEMA,
  });
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = "t030-test-only-session-secret";
  process.env.STEAM_CATALOG_ADMIN_TOKEN = ADMIN;
  db = await import("@workspace/db");

  await db.pool.query(`DROP SCHEMA IF EXISTS "${config.schema}" CASCADE`);
  await db.pool.query(`CREATE SCHEMA "${config.schema}"`);
  initialized = true;
  const migration = await readFile(
    new URL("../../../lib/db/migrations/0029_steam_game_catalog_v1.sql", import.meta.url),
    "utf8",
  );
  await db.pool.query(migration);
  const inserted = await db.pool.query<{ id: number }>(`
    INSERT INTO steam_catalog_games (steam_app_id, name, steam_url, status)
    VALUES (1800555, 'T030 Fixture', 'https://store.steampowered.com/app/1800555', 'review')
    RETURNING id
  `);
  gameId = inserted.rows[0].id;
  app = (await import("../src/app")).createApp();
});

after(async () => {
  globalThis.fetch = originalFetch;
  restore("STEAM_CATALOG_ADMIN_TOKEN", originalEnv.STEAM_CATALOG_ADMIN_TOKEN);
  restore("SESSION_SECRET", originalEnv.SESSION_SECRET);
  restore("DATABASE_URL", originalEnv.DATABASE_URL);
  if (!db) return;
  try {
    if (initialized) await dropTestSchema(db.pool, config.schema);
  } finally {
    await db.pool.end();
  }
});

describe("T030 Steam Catalog authorization on real router and isolated PostgreSQL", () => {
  test("public games and taxonomy reads remain usable", async () => {
    const games = await request(app).get("/api/steam-catalog/games");
    const taxonomy = await request(app).get("/api/steam-catalog/taxonomy");
    assert.equal(games.status, 200, games.text);
    assert.equal(taxonomy.status, 200, taxonomy.text);
    assert.ok(games.body.games.some((g: { id: number }) => g.id === gameId));
  });

  test("unconfigured admin returns 503 and causes zero DB mutations", async () => {
    const original = await snapshot();
    delete process.env.STEAM_CATALOG_ADMIN_TOKEN;
    try {
      for (const mutation of mutations) {
        const response = await mutate(mutation, HEADERS());
        assert.equal(response.status, 503, response.text);
        assert.equal(response.body.code, "STEAM_CATALOG_ADMIN_NOT_CONFIGURED");
      }
      process.env.STEAM_CATALOG_ADMIN_TOKEN = "short";
      for (const mutation of mutations) {
        const response = await mutate(mutation, HEADERS());
        assert.equal(response.status, 503, response.text);
      }
      assert.deepEqual(await snapshot(), original);
    } finally {
      process.env.STEAM_CATALOG_ADMIN_TOKEN = ADMIN;
    }
  });

  test("anonymous, tournament-only roles and invalid admin token get 403 without DB writes", async () => {
    const { signVersionedOrganizerToken, signViewerToken } = await import("../src/auth");
    const actors: Array<[string, Record<string, string>]> = [
      ["anonymous", {}],
      ["viewer", { "x-viewer-token": signViewerToken(9, 1) }],
      ["support", { "x-support-token": randomBytes(32).toString("hex") }],
      ["tournament organizer", { "x-organizer-token": signVersionedOrganizerToken(9, null) }],
      ["invalid catalog admin", { "x-steam-catalog-admin-token": INVALID_ADMIN }],
      ["organizer and invalid catalog admin", {
        "x-organizer-token": signVersionedOrganizerToken(9, null),
        "x-steam-catalog-admin-token": INVALID_ADMIN,
      }],
    ];
    const original = await snapshot();
    let upstreamCalls = 0;
    globalThis.fetch = async () => {
      upstreamCalls++;
      throw new Error("Unauthorized request reached Steam upstream");
    };
    try {
      for (const [actorName, headers] of actors) {
        for (const mutation of mutations) {
          const response = await mutate(mutation, headers);
          assert.equal(response.status, 403, `${actorName}: ${mutation.path}: ${response.text}`);
          assert.equal(response.body.code, "STEAM_CATALOG_ADMIN_REQUIRED");
          assert.deepEqual(await snapshot(), original, `${actorName}: unauthorized DB mutation`);
        }
      }
      assert.equal(upstreamCalls, 0, "Unauthorized Steam import must not call an upstream API");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("valid catalog-admin authorizes taxonomy, import and classification writes", async () => {
    const taxonomy = await request(app).post("/api/steam-catalog/taxonomy")
      .set(HEADERS()).send({ facet: "genre", label: "T030 Allowed Genre" });
    assert.equal(taxonomy.status, 201, taxonomy.text);
    const termId = taxonomy.body.term.id as number;
    assert.ok(Number.isInteger(termId));

    let steamCalls = 0;
    globalThis.fetch = async () => {
      steamCalls++;
      return new Response(JSON.stringify({
        "1800557": {
          success: true,
          data: { name: "T030 Mock Steam Game", developers: ["Fixture Studio"] },
        },
      }), { status: 200, headers: { "content-type": "application/json" } });
    };
    try {
      const imported = await request(app).post("/api/steam-catalog/import")
        .set(HEADERS()).send({ appId: 1800557 });
      assert.equal(imported.status, 201, imported.text);
      assert.equal(imported.body.game.steamAppId, 1800557);
      assert.equal(steamCalls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }

    const classified = await request(app)
      .put(`/api/steam-catalog/games/${gameId}/classification`)
      .set(HEADERS())
      .send({ status: "ready", assignments: [{ termId, position: 0 }] });
    assert.equal(classified.status, 200, classified.text);
    const after = await snapshot();
    assert.equal(after.fixture_status, "ready");
    assert.ok(after.assignments >= 1);
    assert.ok(after.games >= 2);
  });
});
