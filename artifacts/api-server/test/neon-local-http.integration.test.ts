import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { after, before, describe, test } from "node:test";
import request from "supertest";
import type { Express } from "express";
import {
  dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema,
  type TestDatabaseConfig, type TestPool,
} from "./test-database";

const runProcess = promisify(execFile);
let app: Express;
let config: TestDatabaseConfig;
let pool: typeof import("@workspace/db").pool;
let db: typeof import("@workspace/db").db;
let tables: typeof import("@workspace/db");
let schemaPrepared = false;
const SESSION_SECRET = "neon-staging-http-ci-" + randomUUID();

before(async () => {
  config = getSafeTestDatabaseConfig();
  if (!config.connectionString.includes("/tournament_readiness_test") ||
      new URL(config.connectionString).hostname !== "127.0.0.1") {
    throw new Error("This integration test only runs on disposable local PostgreSQL.");
  }
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  process.env.NODE_ENV = "test";
  tables = await import("@workspace/db");
  ({ pool, db } = tables);
  await resetTestSchema(pool as unknown as TestPool, config.schema);
  schemaPrepared = true;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!pool) return;
  if (schemaPrepared) await dropTestSchema(pool as unknown as TestPool, config.schema);
  await pool.end();
});

describe("real HTTP staging-equivalent smoke on disposable local PostgreSQL", () => {
  test("seeds isolated public tournament then exercises GET routes read-only", async () => {
    const created = await request(app).post("/api/tournaments").send({
      name: "Disposable Neon staging smoke fixture",
      format: "single_elimination",
      visibility: "public_online",
      organizerPassword: "synthetic-fixture-password-for-only-test",
      maxPlayers: 8,
    });
    assert.equal(created.status, 201, "Fixture API creation must pass");
    const tournamentId = created.body.id as number;
    assert.ok(Number.isSafeInteger(tournamentId) && tournamentId > 0);

    const players = await db.insert(tables.playersTable).values([
      { tournamentId, name: "Synthetic Player Alpha", seed: 1 },
      { tournamentId, name: "Synthetic Player Beta", seed: 2 },
    ]).returning();
    await db.insert(tables.matchesTable).values({
      tournamentId, round: 1, matchNumber: 1, status: "pending",
      player1Id: players[0].id, player2Id: players[1].id,
    });

    const rowsBefore = await pool.query(
      "SELECT (SELECT count(*)::int FROM tournaments) AS t, " +
      "(SELECT count(*)::int FROM matches) AS m, " +
      "(SELECT count(*)::int FROM players) AS p",
    );

    const readonlyUrl = new URL(config.connectionString);
    readonlyUrl.searchParams.set("options",
      "-c search_path=" + config.schema + " -c default_transaction_read_only=on");
    const result = await runProcess(
      process.execPath, ["--import", "tsx", "src/scripts/neon-local-http-smoke.ts"],
      {
        cwd: process.cwd(),
        timeout: 90_000,
        maxBuffer: 4_096,
        env: {
          ...process.env,
          NODE_ENV: "test",
          DATABASE_URL: readonlyUrl.toString(),
          DB_HEALTH_TIMEOUT_MS: "10000",
          NEON_LOCAL_HTTP_SMOKE: "isolated-ci-fixture",
        },
      },
    );
    const summary = JSON.parse(result.stdout.trim()) as {
      result: string; checkedRoutes: number; skippedRouteGroups: number;
      rowCountsUnchanged: boolean;
    };
    assert.equal(summary.result, "pass");
    assert.equal(summary.checkedRoutes, 8);
    assert.equal(summary.skippedRouteGroups, 0);
    assert.equal(summary.rowCountsUnchanged, true);

    const rowsAfter = await pool.query(
      "SELECT (SELECT count(*)::int FROM tournaments) AS t, " +
      "(SELECT count(*)::int FROM matches) AS m, " +
      "(SELECT count(*)::int FROM players) AS p",
    );
    assert.deepEqual(rowsAfter.rows, rowsBefore.rows);
  });
});
