import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import request from "supertest";
import { readFileSync } from "node:fs";
import {
  createSteamCatalogImportRouter, parseSteamAppId, steamGameValues,
} from "../src/routes/steam-catalog-import";

const token = "test-only-admin-credential-not-a-real-secret";
const payload = (type = "game", id = 570, success: unknown = true) => ({
  "570": { success, data: { type, steam_appid: id, name: "Dota 2" } },
});

test("strict ID and Steam Store URL validation", () => {
  for (const valid of [570, "570", "https://store.steampowered.com/app/570/Dota_2/"]) {
    assert.equal(parseSteamAppId(valid), 570);
  }
  for (const invalid of [0, -1, 1.5, "0", "00", "1e3", "NaN", 2147483648,
    "9007199254740993", "https://evil.test/store.steampowered.com/app/570",
    "https://store.steampowered.com.evil.test/app/570",
    "https://user@store.steampowered.com/app/570",
    "http://store.steampowered.com/app/570", null, {}]) {
    assert.equal(parseSteamAppId(invalid), null, String(invalid));
  }
});

test("requires exact success, game type, matching ID and real name", () => {
  assert.equal(steamGameValues(570, payload())?.steamAppId, 570);
  for (const data of [payload("dlc"), payload("software"), payload("game", 730),
    payload("game", 570, "true"), payload("game", 570, false), null,
    { "570": { success: true, data: { type: "game", steam_appid: 570, name: "" } } }]) {
    assert.equal(steamGameValues(570, data), null);
  }
  const values = steamGameValues(570, payload())!;
  assert.equal("status" in values, false);
  assert.equal("assignments" in values, false);
  assert.equal("createdAt" in values, false);
});

function fixture(options: { configured?: boolean; body?: unknown; existing?: boolean; upstreamStatus?: number; fetchError?: boolean } = {}) {
  let fetched = 0;
  let writes = 0;
  const existing = { steamAppId: 570, name: "Original", status: "ready" };
  const app = express();
  app.use(express.json());
  app.use("/api", createSteamCatalogImportRouter({
    adminToken: () => options.configured === false ? undefined : token,
    fetchSteam: async () => {
      fetched++;
      if (options.fetchError) throw new Error("Test upstream failure");
      return new Response(JSON.stringify(options.body ?? payload()), {
        status: options.upstreamStatus ?? 200,
      });
    },
    insertOnly: async (values) => {
      writes++;
      return options.existing
        ? { game: existing, inserted: false }
        : { game: values, inserted: true };
    },
  }));
  app.use((_error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: "Import failed" });
  });
  return { app, calls: () => ({ fetched, writes }), existing };
}

test("missing configuration fails closed before external or DB access", async () => {
  const f = fixture({ configured: false });
  await request(f.app).post("/api/steam-catalog/import").send({ appId: 570 }).expect(503);
  assert.deepEqual(f.calls(), { fetched: 0, writes: 0 });
});

test("absent, incorrect, organizer and support credentials cannot import", async () => {
  const f = fixture();
  for (const authorization of ["", "Bearer wrong", `Bearer ${token}extra`, `Basic ${token}`]) {
    await request(f.app).post("/api/steam-catalog/import")
      .set("authorization", authorization).set("x-organizer-token", token)
      .set("x-support-token", token).send({ appId: 570 }).expect(401);
  }
  assert.deepEqual(f.calls(), { fetched: 0, writes: 0 });
});

test("authorized invalid IDs are rejected without fetching or writing", async () => {
  const f = fixture();
  await request(f.app).post("/api/steam-catalog/import")
    .set("authorization", `Bearer ${token}`).send({ appId: 2147483648 }).expect(400);
  assert.deepEqual(f.calls(), { fetched: 0, writes: 0 });
});

test("non-game and mismatched appdetails never write", async () => {
  for (const body of [payload("dlc"), payload("software"), payload("game", 730), payload("game", 570, false)]) {
    const f = fixture({ body });
    await request(f.app).post("/api/steam-catalog/import")
      .set("authorization", `Bearer ${token}`).send({ appId: 570 }).expect(422);
    assert.deepEqual(f.calls(), { fetched: 1, writes: 0 });
  }
});

test("Steam failures never write", async () => {
  for (const options of [{ upstreamStatus: 503 }, { fetchError: true }]) {
    const f = fixture(options);
    const r = await request(f.app).post("/api/steam-catalog/import")
      .set("authorization", `Bearer ${token}`).send({ appId: 570 });
    assert.ok(r.status >= 500);
    assert.deepEqual(f.calls(), { fetched: 1, writes: 0 });
  }
});

test("authorized game insert reports inserted; duplicate returns unchanged existing data", async () => {
  for (const existing of [false, true]) {
    const f = fixture({ existing });
    const r = await request(f.app).post("/api/steam-catalog/import")
      .set("authorization", `Bearer ${token}`).send({ appId: 570, status: "review", assignments: [] });
    assert.equal(r.status, existing ? 200 : 201);
    assert.equal(r.body.outcome, existing ? "existing" : "inserted");
    if (existing) assert.deepEqual(r.body.game, f.existing);
    assert.deepEqual(f.calls(), { fetched: 1, writes: 1 });
  }
});

test("production repository adapter is insert-only, with no classification writes", () => {
  const source = readFileSync(new URL("../src/routes/steam-game-catalog.ts", import.meta.url), "utf8");
  const adapter = source.split("router.use(createSteamCatalogImportRouter(")[1].split("router.put(")[0];
  assert.match(adapter, /\.onConflictDoNothing\(\{ target: steamCatalogGames\.steamAppId \}\)/);
  assert.doesNotMatch(adapter, /onConflictDoUpdate|\.update\(|\.delete\(|steamCatalogGameTerms/);
});
