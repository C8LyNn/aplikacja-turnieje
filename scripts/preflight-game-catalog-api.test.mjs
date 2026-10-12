import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadCatalogApiProbeConfig, inspectCatalogApi,
} from "./preflight-game-catalog-api.mjs";

const env = {
  CATALOG_PREFLIGHT_API_BASE_URL: "https://staging.example.app/",
  CATALOG_PREFLIGHT_EXPECTED_API_HOST: "staging.example.app",
};
const config = loadCatalogApiProbeConfig(env);

function replies({ badTotals = false, html = false, missingQueue = false } = {}) {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    const path = new URL(url).pathname;
    if (html) return new Response("<!doctype html><h1>Not live</h1>", {
      status: 200, headers: { "content-type": "text/html" },
    });
    if (path.endsWith("/games")) return Response.json({
      games: [{ id: 1, steamAppId: 570, name: "Dota 2" }],
      pagination: { page: 1, pageSize: 1, total: 4, totalPages: 4 },
      counts: { all: badTotals ? 5 : 4, unclassified: 2, review: 1, ready: 1 },
    });
    if (path.endsWith("/taxonomy")) return Response.json({ terms: [] });
    if (missingQueue) return new Response("not found", { status: 404 });
    if (path.endsWith("/queue")) return Response.json({
      pendingCount: 3, nextId: 1,
    });
    throw new Error("Unexpected URL");
  };
  return { fetchImpl, requests };
}

test("public API probe accepts consistent read-only endpoints", async () => {
  const mock = replies();
  const result = await inspectCatalogApi(config, mock.fetchImpl);
  assert.equal(result.passed, true, JSON.stringify(result.checks));
  assert.equal(result.counts.all, 4);
  assert.deepEqual(mock.requests.map((x) => new URL(x.url).pathname), [
    "/api/steam-catalog/games",
    "/api/steam-catalog/taxonomy",
    "/api/steam-catalog/queue",
  ]);
  assert.ok(mock.requests.every((x) => x.options.method === "GET"));
  assert.ok(mock.requests.every((x) => !JSON.stringify(x.options).includes("admin")));
});

test("HTML hosting placeholder is rejected even if HTTP status is 200", async () => {
  const mock = replies({ html: true });
  const result = await inspectCatalogApi(config, mock.fetchImpl);
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((x) => x.name === "games_content_type").passed, false);
});

test("API count mismatches and missing classification queue block release", async () => {
  const result = await inspectCatalogApi(config, replies({
    badTotals: true, missingQueue: true,
  }).fetchImpl);
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((x) => x.name === "catalog_counts").passed, false);
  assert.equal(result.checks.find((x) => x.name === "queue_http").passed, false);
});

test("API preflight refuses unexpected target or credential-bearing origin", () => {
  assert.throws(() => loadCatalogApiProbeConfig({
    ...env, CATALOG_PREFLIGHT_API_BASE_URL: "http://staging.example.app",
  }), /HTTPS origin/);
  assert.throws(() => loadCatalogApiProbeConfig({
    ...env, CATALOG_PREFLIGHT_API_BASE_URL: "https://token@staging.example.app/",
  }), /HTTPS origin/);
  assert.throws(() => loadCatalogApiProbeConfig({
    ...env, CATALOG_PREFLIGHT_API_BASE_URL: "https://staging.example.app/private",
  }), /HTTPS origin/);
  assert.throws(() => loadCatalogApiProbeConfig({
    ...env, CATALOG_PREFLIGHT_EXPECTED_API_HOST: "production.example.app",
  }), /does not match/);
});
