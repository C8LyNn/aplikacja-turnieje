import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadCatalogStagingAuditConfig, inspectCatalogStagingData,
} from "../scripts/audit-game-catalog-staging.mjs";

const env = {
  CATALOG_PREFLIGHT_DATABASE_URL: "postgresql://observer:SECRET_SENTINEL@smoke.qa.example:5432/catalog_staging?sslmode=require",
  CATALOG_PREFLIGHT_EXPECTED_HOST: "smoke.qa.example",
  CATALOG_PREFLIGHT_EXPECTED_DATABASE: "catalog_staging",
  CATALOG_PREFLIGHT_EXPECTED_SCHEMA: "public",
  CATALOG_PREFLIGHT_ENVIRONMENT: "staging",
  CATALOG_AUDIT_EXPECTED_APPIDS: "620,367520,413150,646570,1145360",
  CATALOG_AUDIT_MIN_TERMS: "109",
  CATALOG_AUDIT_MIN_ASSIGNMENTS_PER_GAME: "6",
  CATALOG_AUDIT_EXPECTED_STATUS: "review",
};
const ids = [620, 367520, 413150, 646570, 1145360];

function fakeClient({ database = "catalog_staging", totals = null, games = null } = {}) {
  const calls = [];
  const values = totals ?? {
    games: 5, terms: 109, assignments: 44,
    unclassified: 0, review: 5, ready: 0,
  };
  const data = games ?? ids.map((appId, index) => ({
    appId, name: "Sample " + appId, status: "review", revision: 2,
    assignments: [8, 9, 11, 8, 8][index], facets: 6,
  }));
  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.startsWith("BEGIN TRANSACTION")) return { rows: [] };
      if (sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("current_database()")) return { rows: [{ name: database }] };
      if (sql.includes("SELECT (SELECT count(*)::integer")) return { rows: [values] };
      if (sql.includes("g.steam_app_id AS")) return { rows: data };
      throw new Error("Unexpected query in staging audit");
    },
  };
}

test("staging audit requires explicit host, DB, unique AppIDs and non-production mode", () => {
  const cfg = loadCatalogStagingAuditConfig(env);
  assert.deepEqual(cfg.expectedIds, ids);
  assert.equal(cfg.minAssignments, 6);
  assert.equal(cfg.expectedStatus, "review");
  assert.throws(() => loadCatalogStagingAuditConfig({
    ...env, CATALOG_PREFLIGHT_ENVIRONMENT: "production",
    CATALOG_PREFLIGHT_ALLOW_PRODUCTION: "YES_READ_ONLY",
  }), /staging-only/);
  assert.throws(() => loadCatalogStagingAuditConfig({
    ...env, CATALOG_PREFLIGHT_EXPECTED_HOST: "production.example",
  }), /Host does not match/);
  assert.throws(() => loadCatalogStagingAuditConfig({
    ...env, CATALOG_AUDIT_EXPECTED_APPIDS: "620,620",
  }), /unique/);
  assert.throws(() => loadCatalogStagingAuditConfig({
    ...env, CATALOG_AUDIT_EXPECTED_APPIDS: "620,0",
  }), /AppIDs/);
  assert.throws(() => loadCatalogStagingAuditConfig({
    ...env, CATALOG_AUDIT_MIN_TERMS: "1;DROP TABLE",
  }), /minimum/);
});

test("staging audit sees five reviewed games and 44 taxonomy assignments in read-only snapshot", async () => {
  const client = fakeClient();
  const report = await inspectCatalogStagingData(client, loadCatalogStagingAuditConfig(env));
  assert.equal(report.passed, true);
  assert.equal(report.games.length, 5);
  assert.equal(report.totals.review, 5);
  assert.equal(report.totals.assignments, 44);
  assert.ok(report.checks.every((c) => c.passed));
  assert.ok(client.calls[0].sql.includes("READ ONLY"));
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
  assert.ok(client.calls.every(({ sql }) => !/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql)));
  assert.deepEqual(client.calls.find((c) => c.sql.includes("g.steam_app_id AS")).params[0], ids);
  assert.doesNotMatch(JSON.stringify(report), /SECRET_SENTINEL/);
});

test("audit detects stale revision, missing tags and unexpectedly published games", async () => {
  const client = fakeClient({ games: ids.map((appId, index) => ({
    appId, name: "Sample", status: index ? "review" : "ready",
    revision: index ? 2 : 1, assignments: index ? 8 : 1, facets: index ? 6 : 1,
  })) });
  const report = await inspectCatalogStagingData(client, loadCatalogStagingAuditConfig(env));
  assert.equal(report.passed, false);
  for (const name of ["game:620:status", "game:620:revision",
    "game:620:assignments", "game:620:facets"]) {
    assert.equal(report.checks.find((c) => c.name === name)?.passed, false);
  }
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
});

test("audit fails closed on wrong database and missing source games", async () => {
  const cfg = loadCatalogStagingAuditConfig(env);
  const badDb = fakeClient({ database: "other" });
  const first = await inspectCatalogStagingData(badDb, cfg);
  assert.equal(first.passed, false);
  assert.equal(first.games.length, 0);
  assert.equal(badDb.calls.at(-1).sql, "ROLLBACK");

  const missing = fakeClient({
    totals: { games: 4, terms: 10, assignments: 5, unclassified: 4, review: 0, ready: 0 },
    games: [],
  });
  const second = await inspectCatalogStagingData(missing, cfg);
  assert.equal(second.passed, false);
  assert.equal(second.checks.find((c) => c.name === "game:620:exists").passed, false);
  assert.equal(missing.calls.at(-1).sql, "ROLLBACK");
});
