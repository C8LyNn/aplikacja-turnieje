// SWARM-006 V4: GET /tournaments carries a read-only `activity` summary used by the
// Experimental dashboard to group tournaments by the action they need.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

type Db = typeof import("@workspace/db");
let app: Express;
let database: Db;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = `list-activity-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  schemaInitialized = true;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  await database?.pool.end();
});

async function tournament(values: Partial<typeof database.tournamentsTable.$inferInsert>) {
  const [row] = await database.db.insert(database.tournamentsTable).values({
    name: `Activity ${randomUUID()}`,
    format: "single_elimination",
    status: "draft",
    visibility: "public_online",
    defaultBestOf: 1,
    ...values,
  }).returning();
  return row!;
}

async function players(tournamentId: number, count: number) {
  if (count === 0) return [];
  return database.db.insert(database.playersTable).values(
    Array.from({ length: count }, (_, i) => ({ tournamentId, name: `P${i + 1}-${randomUUID().slice(0, 6)}`, seed: i + 1 })),
  ).returning();
}

test("list reports player, ready and live match counts per tournament", async () => {
  const draftEmpty = await tournament({ status: "draft" });
  const draftReady = await tournament({ status: "draft" });
  await players(draftReady.id, 3);
  const active = await tournament({ status: "active", currentRound: 1, totalRounds: 3 });
  const p = await players(active.id, 8);
  await database.db.insert(database.matchesTable).values([
    { tournamentId: active.id, round: 1, matchNumber: 1, player1Id: p[0]!.id, player2Id: p[1]!.id, bestOf: 1, status: "pending" },
    { tournamentId: active.id, round: 1, matchNumber: 2, player1Id: p[2]!.id, player2Id: p[3]!.id, bestOf: 1, status: "pending" },
    { tournamentId: active.id, round: 1, matchNumber: 3, player1Id: p[4]!.id, player2Id: p[5]!.id, bestOf: 1, status: "in_progress" },
    { tournamentId: active.id, round: 1, matchNumber: 4, player1Id: p[6]!.id, player2Id: p[7]!.id, bestOf: 1, status: "completed", winnerId: p[6]!.id, score1: 1, score2: 0, resultType: "played", completedAt: new Date() },
    // Unpaired future match: not ready.
    { tournamentId: active.id, round: 2, matchNumber: 5, player1Id: p[6]!.id, player2Id: null, bestOf: 1, status: "pending" },
  ]);
  const hidden = await tournament({ status: "active", visibility: "private_offline" });

  const response = await request(app).get("/api/tournaments").expect(200);
  const byId = new Map<number, { activity?: { playerCount: number; readyMatchCount: number; liveMatchCount: number } }>(
    response.body.map((t: { id: number }) => [t.id, t]),
  );

  // V5.11 adds optional stage fields; the three V4 counts keep their meaning.
  const counts = (activity?: { playerCount: number; readyMatchCount: number; liveMatchCount: number }) =>
    activity && { playerCount: activity.playerCount, readyMatchCount: activity.readyMatchCount, liveMatchCount: activity.liveMatchCount };
  assert.deepEqual(counts(byId.get(draftEmpty.id)?.activity), { playerCount: 0, readyMatchCount: 0, liveMatchCount: 0 });
  assert.deepEqual(counts(byId.get(draftReady.id)?.activity), { playerCount: 3, readyMatchCount: 0, liveMatchCount: 0 });
  assert.deepEqual(counts(byId.get(active.id)?.activity), { playerCount: 8, readyMatchCount: 2, liveMatchCount: 1 });
  assert.equal(byId.has(hidden.id), false, "private_offline tournaments stay unlisted");
});

test("V5.11: activity carries the stage plan, the current stage and the draft's start readiness from the engine", async () => {
  const preview = await request(app).post("/api/tournaments/presets/preview")
    .send({ presetId: "groups_playoff", params: { participantCount: 16, groupCount: 4, qualifiersPerGroup: 2 } }).expect(200);
  const created = await request(app).post("/api/tournaments")
    .send({ name: `Activity plan ${randomUUID()}`, organizerPassword: `pw-${randomUUID()}`, ...preview.body.creation }).expect(201);
  for (let i = 1; i <= 5; i++) {
    await request(app).post(`/api/tournaments/${created.body.id}/players`).set("x-organizer-token", created.body.organizerToken)
      .send({ name: `Gracz ${i}`, seed: i }).expect(201);
  }
  const response = await request(app).get("/api/tournaments").expect(200);
  const listed = response.body.find((t: { id: number }) => t.id === created.body.id);
  assert.deepEqual(listed.activity.stageFormats, ["group_stage", "single_elimination"]);
  assert.equal(listed.activity.currentStage.format, "group_stage");
  assert.equal(listed.activity.currentStage.status, "planned");
  assert.equal(listed.activity.currentStage.matchesTotal, 0);
  assert.deepEqual(listed.activity.startReadiness, { ready: false, reasonCode: "STAGE_PARTICIPANTS_INCONSISTENT", participantCount: 5, requiredParticipantCount: 16 });
  // Readiness is read for drafts only.
  const active = response.body.find((t: { status: string; activity?: unknown }) => t.status === "active");
  if (active) assert.equal("startReadiness" in (active.activity ?? {}), false);
});

test("V5.11: the dashboard talks about the active stage, else the next planned one, else the last one", async () => {
  const { pickActivityStage } = await import("../src/routes/tournaments");
  const stage = (position: number, status: string) => ({ position, status });
  assert.deepEqual(pickActivityStage([stage(2, "planned"), stage(1, "active")]), stage(1, "active"));
  assert.deepEqual(pickActivityStage([stage(1, "completed"), stage(2, "planned"), stage(3, "planned")]), stage(2, "planned"));
  assert.deepEqual(pickActivityStage([stage(2, "completed"), stage(1, "completed")]), stage(2, "completed"));
  assert.equal(pickActivityStage([]), null);
});

test("single-tournament endpoint is unchanged (no activity field)", async () => {
  const t = await tournament({ status: "draft" });
  const response = await request(app).get(`/api/tournaments/${t.id}`).expect(200);
  assert.equal(response.body.id, t.id);
  assert.equal("activity" in response.body, false);
});
