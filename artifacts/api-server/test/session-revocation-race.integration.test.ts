import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

type Database = typeof import("@workspace/db");
type Credentials = { "x-organizer-token"?: string; "x-support-token"?: string; "x-viewer-token"?: string };
type Target = "bans" | "picks";
type Principal = "organizer" | "support";

let database: Database;
let app: Express;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let signViewerToken: typeof import("../src/auth").signViewerToken;

before(async () => {
  // The preflight refuses non-test URLs, production/shared names and unsafe schema resets.
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `r10-revocation-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  ({ signVersionedOrganizerToken: signOrganizerToken, signViewerToken } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !config) return;
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

interface Fixture {
  tournamentId: number;
  playerId: number;
  matchId: number;
  organizerHash: string;
  organizer: Credentials;
  support: Credentials;
  viewer: Credentials;
}

async function fixture(): Promise<Fixture> {
  const organizerHash = `r10-organizer-${randomUUID()}`;
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: `Revocation test ${randomUUID()}`,
    format: "single_elimination",
    status: "draft",
    visibility: "public_online",
    organizerPasswordHash: organizerHash,
    defaultBestOf: 3,
  }).returning();
  const players = await database.db.insert(database.playersTable).values([
    { tournamentId: tournament.id, name: "Alpha", seed: 1 },
    { tournamentId: tournament.id, name: "Bravo", seed: 2 },
  ]).returning();
  const organizer = { "x-organizer-token": signOrganizerToken(tournament.id, organizerHash) };
  await request(app).post(`/api/tournaments/${tournament.id}/start`).set(organizer).expect(200);
  const matches = await request(app).get(`/api/tournaments/${tournament.id}/matches`).set(organizer).expect(200);
  assert.ok(matches.body.length > 0, "start must create a match");
  const supportToken = randomBytes(32).toString("hex");
  await database.db.insert(database.supportSessionsTable).values({
    tournamentId: tournament.id,
    nick: "Support fixture",
    sessionToken: supportToken,
    passwordVersion: 1,
    lastActiveAt: new Date(),
  });
  return {
    tournamentId: tournament.id,
    playerId: players[0].id,
    matchId: matches.body[0].id as number,
    organizerHash,
    organizer,
    support: { "x-support-token": supportToken },
    viewer: { "x-viewer-token": signViewerToken(tournament.id, 1) },
  };
}

function mutate(f: Fixture, target: Target, headers: Credentials) {
  return target === "bans"
    ? request(app).put(`/api/players/${f.playerId}/bans`).set(headers)
        .send({ bannedHeroIds: ["haze"] })
    : request(app).put(`/api/matches/${f.matchId}/game-picks/1`).set(headers)
        .send({ player1HeroId: "haze", player2HeroId: null });
}

async function rows(f: Fixture, target: Target): Promise<unknown> {
  if (target === "bans") {
    const data = await database.db.select().from(database.playerDeadlockBansTable)
      .where(eq(database.playerDeadlockBansTable.playerId, f.playerId));
    return data.map(r => ({ playerId: r.playerId, bannedHeroIds: r.bannedHeroIds }));
  }
  const data = await database.db.select().from(database.matchGamePicksTable)
    .where(eq(database.matchGamePicksTable.matchId, f.matchId));
  return data.map(r => ({
    gameNumber: r.gameNumber,
    p1: r.player1HeroId,
    p2: r.player2HeroId,
    side: r.player1Side,
  }));
}

async function waitForQueuedTournamentLock(timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  do {
    const result = await database.pool.query<{ queued: string }>(`
      SELECT count(*)::text AS queued
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid() AND datname = current_database()
        AND wait_event_type = 'Lock'
        AND query ILIKE '%tournaments%'
    `);
    if (Number(result.rows[0]?.queued) > 0) return;
    await new Promise<void>(resolve => setTimeout(resolve, 20));
  } while (Date.now() < deadline);
  throw new Error("REQUEST_NOT_BLOCKED_ON_TOURNAMENT_LOCK: no pre-auth->lock barrier observed");
}

async function revokeUnderBarrier(
  f: Fixture,
  target: Target,
  principal: Principal,
  preparePreviousRow: boolean,
): Promise<void> {
  const headers = principal === "organizer" ? f.organizer : f.support;
  if (preparePreviousRow) {
    await mutate(f, target, headers).expect(200);
  }
  const beforeRows = await rows(f, target);
  const locker = await database.pool.connect();
  let transactionOpen = false;
  let pending: Promise<import("supertest").Response> | undefined;
  try {
    await locker.query("BEGIN");
    transactionOpen = true;
    await locker.query(`SELECT id FROM "${config.schema}".tournaments WHERE id = $1 FOR UPDATE`, [f.tournamentId]);
    // Start only AFTER the lock is held. Observing a PG row-lock waiter establishes
    // that the HTTP request has completed its initial auth and reached the lock.
    pending = mutate(f, target, headers).then(response => response);
    await waitForQueuedTournamentLock();
    if (principal === "organizer") {
      await locker.query(
        `UPDATE "${config.schema}".tournaments SET organizer_password_hash = $1 WHERE id = $2`,
        [`rotated-${randomUUID()}`, f.tournamentId],
      );
    } else {
      await locker.query(
        `UPDATE "${config.schema}".tournaments
         SET support_password_version = support_password_version + 1 WHERE id = $1`,
        [f.tournamentId],
      );
    }
    await locker.query("COMMIT");
    transactionOpen = false;
    const response = await pending;
    assert.equal(response.status, 403, `${principal}/${target} must fail closed`);
    assert.equal(response.body.code, "SUPPORT_SESSION_EXPIRED", "existing wire error contract preserved");
    assert.deepEqual(await rows(f, target), beforeRows, "revocation must cause zero table writes");
  } finally {
    if (transactionOpen) await locker.query("ROLLBACK");
    locker.release();
    if (pending) await pending.catch(() => undefined);
  }
}

describe("T080-S1A post-lock revocation with PostgreSQL row-lock barriers", () => {
  for (const principal of ["organizer", "support"] as const) {
    for (const target of ["bans", "picks"] as const) {
      test(`${principal} / ${target}: old token queued behind revocation gets 403, zero insert`, { timeout: 25000 }, async () => {
        const f = await fixture();
        await revokeUnderBarrier(f, target, principal, false);
      });
      test(`${principal} / ${target}: revoked request cannot overwrite existing row`, { timeout: 25000 }, async () => {
        const f = await fixture();
        await revokeUnderBarrier(f, target, principal, true);
      });
      test(`${principal} / ${target}: current credential remains allowed`, async () => {
        const f = await fixture();
        await mutate(f, target, principal === "organizer" ? f.organizer : f.support).expect(200);
        assert.equal((await rows(f, target) as unknown[]).length, 1);
      });
    }
  }
  for (const target of ["bans", "picks"] as const) {
    test(`${target}: viewer and anonymous cannot write`, async () => {
      const f = await fixture();
      await mutate(f, target, f.viewer).expect(403);
      await mutate(f, target, {}).expect(403);
      assert.deepEqual(await rows(f, target), []);
    });
  }
});
