import assert from "node:assert/strict";
import { describe, test } from "node:test";
import express from "express";
import request from "supertest";
import {
  createHealthRouter, DATABASE_HEALTH_TIMEOUT_MS,
  MAX_DATABASE_HEALTH_TIMEOUT_MS, resolveHealthTimeoutMs,
} from "../src/routes/health";

function healthApp(options: Parameters<typeof createHealthRouter>[0]) {
  const app = express();
  app.use("/api", createHealthRouter(options));
  return app;
}

describe("Neon cold-start health timeout configuration", () => {
  test("preserves the existing Replit default when unset or malformed", () => {
    for (const value of [
      undefined, "", "0", "-1", "999", "15001", "Infinity",
      "5e3", "10000ms", " 8000 ", "0008000", "123456",
    ]) {
      assert.equal(resolveHealthTimeoutMs(value), DATABASE_HEALTH_TIMEOUT_MS);
    }
  });

  test("accepts bounded integer settings up to 15 seconds", () => {
    for (const time of [1000, 5000, 8000, 10000, 15000]) {
      assert.equal(resolveHealthTimeoutMs(String(time)), time);
    }
    assert.equal(MAX_DATABASE_HEALTH_TIMEOUT_MS, 15000);
  });

  test("permits a slow but successful database wake-up within the staging timeout", async () => {
    const response = await request(
      healthApp({
        databaseCheck: async () => new Promise((resolve) =>
          setTimeout(() => resolve({ rows: [{ one: 1 }] }), 40)),
        timeoutMs: 150,
        log: { warn: () => assert.fail("No failure should be logged") },
      }),
    ).get("/api/healthz");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: "ok", database: "ok" });
  });

  test("rejects a response exceeding the staging timeout without secrets", async () => {
    const logged: Array<Record<string, unknown>> = [];
    const response = await request(
      healthApp({
        databaseCheck: async () => new Promise((resolve) =>
          setTimeout(() => resolve({ rows: [{ one: 1 }] }), 80)),
        timeoutMs: 5,
        log: { warn: bindings => logged.push(bindings) },
      }),
    ).get("/api/healthz");
    assert.equal(response.status, 503);
    assert.deepEqual(response.body, { status: "error", database: "unavailable" });
    assert.deepEqual(logged, [{ errorType: "timeout" }]);
  });
});

describe("database-aware healthcheck", () => {
  test("returns 200 when the database query succeeds", async () => {
    const response = await request(
      healthApp({ databaseCheck: async () => ({ rows: [{ one: 1 }] }) }),
    ).get("/api/healthz");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: "ok", database: "ok" });
  });

  test("returns a redacted 503 when the database query fails", async () => {
    const logged: Array<Record<string, unknown>> = [];
    const response = await request(
      healthApp({
        databaseCheck: async () => {
          throw new Error("postgresql://user:password@secret-host/secret-db");
        },
        log: { warn: (bindings) => logged.push(bindings) },
      }),
    ).get("/api/healthz");

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, { status: "error", database: "unavailable" });
    assert.equal(JSON.stringify(response.body).includes("secret"), false);
    assert.deepEqual(logged, [{ errorType: "query_failed" }]);
  });

  test("returns 503 when the database check exceeds the timeout", async () => {
    const logged: Array<Record<string, unknown>> = [];
    const response = await request(
      healthApp({
        databaseCheck: () => new Promise(() => {}),
        timeoutMs: 5,
        log: { warn: (bindings) => logged.push(bindings) },
      }),
    ).get("/api/healthz");

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, { status: "error", database: "unavailable" });
    assert.deepEqual(logged, [{ errorType: "timeout" }]);
  });
});
