import assert from "node:assert/strict";
import { describe, test } from "node:test";
import express from "express";
import request from "supertest";
import { createHealthRouter } from "../src/routes/health";

function healthApp(options: Parameters<typeof createHealthRouter>[0]) {
  const app = express();
  app.use("/api", createHealthRouter(options));
  return app;
}

describe("database-aware healthcheck", () => {
  test("returns 200 when the database query succeeds", async () => {
    const response = await request(
      healthApp({ databaseCheck: async () => ({ rows: [{ one: 1 }] }) }),
    ).get("/api/healthz");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: "ok", database: "ok" });
  });

  test("returns a redacted 503 when the database query fails", async () => {
    // Synthetic fixture only: .invalid is reserved and no connection is made.
    const syntheticDsn = new URL("postgresql://healthcheck.invalid/fixture");
    syntheticDsn.username = "synthetic-health-user";
    syntheticDsn.password = "NOT_A_REAL_CREDENTIAL";
    const logged: Array<Record<string, unknown>> = [];
    const response = await request(
      healthApp({
        databaseCheck: async () => {
          throw new Error(syntheticDsn.toString());
        },
        log: { warn: (bindings) => logged.push(bindings) },
      }),
    ).get("/api/healthz");

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, { status: "error", database: "unavailable" });
    const responseJson = JSON.stringify(response.body);
    assert.equal(responseJson.includes("secret"), false);
    assert.equal(responseJson.includes(syntheticDsn.toString()), false);
    assert.equal(responseJson.includes(syntheticDsn.password), false);
    assert.equal(responseJson.includes(syntheticDsn.username), false);
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
