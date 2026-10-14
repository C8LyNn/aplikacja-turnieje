import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, test } from "node:test";
import express from "express";
import request from "supertest";
import {
  createSteamCatalogWriteAuth,
  isAuthorizedSteamCatalogWrite,
} from "../src/http/steam-catalog-write-auth";
import {
  signVersionedOrganizerToken,
  signViewerToken,
} from "../src/auth";

const ADMIN_TOKEN = randomBytes(32).toString("hex");
const WRONG_TOKEN = randomBytes(32).toString("hex");

function testWriteApp(configuredToken?: string) {
  const app = express();
  app.use(express.json());
  app.post(
    "/write",
    createSteamCatalogWriteAuth({
      STEAM_CATALOG_ADMIN_TOKEN: configuredToken,
    }),
    (_req, res) => res.status(200).json({ ok: true }),
  );
  return app;
}

describe("Steam Catalog global write authorization", () => {
  test("fails closed when no credential or an undersized credential is configured", async () => {
    for (const key of [undefined, "", "short"]) {
      const response = await request(testWriteApp(key))
        .post("/write")
        .set("x-steam-catalog-admin-token", ADMIN_TOKEN)
        .send({});
      assert.equal(response.status, 403);
      assert.equal(response.body.code, "STEAM_CATALOG_WRITE_FORBIDDEN");
    }
  });

  test("accepts only an exact global admin token; does not leak credentials", async () => {
    assert.equal(isAuthorizedSteamCatalogWrite(ADMIN_TOKEN, ADMIN_TOKEN), true);
    assert.equal(isAuthorizedSteamCatalogWrite(WRONG_TOKEN, ADMIN_TOKEN), false);
    assert.equal(isAuthorizedSteamCatalogWrite(undefined, ADMIN_TOKEN), false);

    const unauthorized = await request(testWriteApp(ADMIN_TOKEN))
      .post("/write")
      .set("x-steam-catalog-admin-token", WRONG_TOKEN)
      .send({});
    assert.equal(unauthorized.status, 403);
    assert.equal(JSON.stringify(unauthorized.body).includes(ADMIN_TOKEN), false);
    assert.equal(JSON.stringify(unauthorized.body).includes(WRONG_TOKEN), false);

    const authorized = await request(testWriteApp(ADMIN_TOKEN))
      .post("/write")
      .set("x-steam-catalog-admin-token", ADMIN_TOKEN)
      .send({});
    assert.equal(authorized.status, 200);
    assert.deepEqual(authorized.body, { ok: true });
  });

  test("tournament organizer and viewer credentials do not grant global write access", async () => {
    const app = testWriteApp(ADMIN_TOKEN);
    for (const [header, token] of [
      ["x-organizer-token", signVersionedOrganizerToken(17, null)],
      ["x-viewer-token", signViewerToken(17, 1)],
      ["x-support-token", randomBytes(32).toString("hex")],
    ]) {
      const response = await request(app)
        .post("/write")
        .set(header, token)
        .send({});
      assert.equal(response.status, 403, header);
    }
  });

  test("the three real mutation routes reject non-admin actors before any DB or upstream call", async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousAdminToken = process.env.STEAM_CATALOG_ADMIN_TOKEN;
    // Connection configuration is deliberately non-production and unreachable.
    // The test asserts the guard stops requests before route handlers execute.
    process.env.DATABASE_URL = "postgresql://offline:offline@127.0.0.1:65430/t030";
    process.env.STEAM_CATALOG_ADMIN_TOKEN = ADMIN_TOKEN;

    try {
      const { default: catalogRouter } = await import("../src/routes/steam-game-catalog");
      const app = express();
      app.use(express.json());
      app.use("/api", catalogRouter);
      const mutations = [
        { method: "post" as const, path: "/api/steam-catalog/taxonomy", body: { facet: "genre", label: "Fixture" } },
        { method: "post" as const, path: "/api/steam-catalog/import", body: { appId: 10 } },
        { method: "put" as const, path: "/api/steam-catalog/games/1/classification", body: { status: "ready", assignments: [] } },
      ];
      const actors: Array<[string, string] | null> = [
        null,
        ["x-viewer-token", signViewerToken(17, 1)],
        ["x-support-token", randomBytes(32).toString("hex")],
        ["x-organizer-token", signVersionedOrganizerToken(17, null)],
      ];

      for (const mutation of mutations) {
        for (const actor of actors) {
          let query = request(app)[mutation.method](mutation.path);
          if (actor) query = query.set(actor[0], actor[1]);
          const response = await query.send(mutation.body);
          assert.equal(response.status, 403, `${mutation.method} ${mutation.path}: ${actor?.[0] ?? "anonymous"}`);
          assert.equal(response.body.code, "STEAM_CATALOG_WRITE_FORBIDDEN");
        }
      }
    } finally {
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
      if (previousAdminToken === undefined) delete process.env.STEAM_CATALOG_ADMIN_TOKEN;
      else process.env.STEAM_CATALOG_ADMIN_TOKEN = previousAdminToken;
    }
  });
});
