import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema,
  type TestDatabaseConfig, type TestPool,
} from "./test-database";

let app: Express;
let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `ops-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});
after(async () => {
  if (database) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
    await database.pool.end();
  }
});

test("assistant exposes a non-mutating structured operations snapshot and keeps legacy fields", async () => {
  const created = await request(app).post("/api/tournaments").send({
    name: `Operations ${randomUUID()}`, organizerPassword: "operations-test-password",
    format: "round_robin", defaultBestOf: 1,
  }).expect(201);
  const tournamentId = created.body.id as number;
  const auth = {"x-organizer-token": created.body.organizerToken as string};
  const url = `/api/tournaments/${tournamentId}/assistant`;
  const beforeRead = await database.pool.query("SELECT count(*)::int AS count FROM action_log WHERE tournament_id=$1", [tournamentId]);
  const first = await request(app).get(url).set(auth).expect(200);
  assert.equal(typeof first.body.stepTitle, "string");
  assert.equal(typeof first.body.nextAction, "string");
  assert.ok(Array.isArray(first.body.warnings));
  assert.equal(first.body.operations.version, 1);
  assert.equal(first.body.operations.advisory, true);
  assert.equal(first.body.operations.recommendedAction.code, "ADD_PARTICIPANTS");
  assert.equal(first.body.operations.recommendedAction.availability, "blocked");
  assert.equal(first.body.operations.progress.percent, null);
  const afterRead = await database.pool.query("SELECT count(*)::int AS count FROM action_log WHERE tournament_id=$1", [tournamentId]);
  assert.deepEqual(afterRead.rows, beforeRead.rows, "snapshot GET must not add audit actions");

  for (let seed = 1; seed <= 2; seed++) {
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(auth)
      .send({name: `Player-${seed}`, seed}).expect(201);
  }
  const withPlayers = await request(app).get(url).set(auth).expect(200);
  assert.equal(withPlayers.body.operations.progress.total, 0);
  assert.notEqual(withPlayers.body.operations.recommendedAction.code, "ADD_PARTICIPANTS");
  assert.equal(withPlayers.body.operations.recommendedAction.requiresConfirmation !== undefined, true);
});
