import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";
import { requireSteamCatalogAdmin } from "../src/application/catalog/steam-catalog-access";

const KEY = "catalog-admin-0123456789-abcdefghijklmnopqrstuvwxyz";

function testApp() {
  const app = express();
  app.use(express.json());
  app.get("/catalog/games", (_req, res) => { res.json({ ok: true }); });
  app.post("/catalog/import", requireSteamCatalogAdmin, (_req, res) => { res.json({ ok: true }); });
  app.post("/catalog/taxonomy", requireSteamCatalogAdmin, (_req, res) => { res.json({ ok: true }); });
  app.put("/catalog/games/1/classification", requireSteamCatalogAdmin, (_req, res) => { res.json({ ok: true }); });
  return app;
}

test("catalog remains publicly readable while all editor mutation types require the key", async () => {
  const previous = process.env.STEAM_CATALOG_ADMIN_TOKEN;
  const app = testApp();
  try {
    delete process.env.STEAM_CATALOG_ADMIN_TOKEN;
    const publicResult = await request(app).get("/catalog/games");
    assert.equal(publicResult.status, 200);

    for (const method of [
      { type: "post" as const, path: "/catalog/import" },
      { type: "post" as const, path: "/catalog/taxonomy" },
      { type: "put" as const, path: "/catalog/games/1/classification" },
    ]) {
      const unconfigured = await request(app)[method.type](method.path).send({});
      assert.equal(unconfigured.status, 503);
      assert.equal(unconfigured.body.code, "STEAM_CATALOG_ADMIN_NOT_CONFIGURED");
    }

    process.env.STEAM_CATALOG_ADMIN_TOKEN = KEY;
    const denied = await request(app).post("/catalog/import").send({});
    assert.equal(denied.status, 403);
    assert.equal(denied.body.code, "STEAM_CATALOG_ADMIN_REQUIRED");

    const allowed = await request(app)
      .post("/catalog/import")
      .set("x-steam-catalog-admin-token", KEY)
      .send({});
    assert.equal(allowed.status, 200);
    assert.deepEqual(allowed.body, { ok: true });
  } finally {
    if (previous === undefined) delete process.env.STEAM_CATALOG_ADMIN_TOKEN;
    else process.env.STEAM_CATALOG_ADMIN_TOKEN = previous;
  }
});
