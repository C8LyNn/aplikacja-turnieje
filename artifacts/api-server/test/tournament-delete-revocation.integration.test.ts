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
type Headers = Record<string, string>;

let dbm: Database;
let app: Express;
let config: TestDatabaseConfig;
let schemaReady = false;
let signOrganizer: typeof import("../src/auth").signVersionedOrganizerToken;
let signViewer: typeof import("../src/auth").signViewerToken;

before(async () => {
  // Fail-closed preflight refuses unapproved production/shared targets.
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `s1b-delete-${randomUUID()}`;
  dbm = await import("@workspace/db");
  await resetTestSchema(dbm.pool as unknown as TestPool, config.schema);
  schemaReady = true;
  ({ signVersionedOrganizerToken: signOrganizer, signViewerToken: signViewer } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!dbm || !config) return;
  if (schemaReady) await dropTestSchema(dbm.pool as unknown as TestPool, config.schema);
  await dbm.pool.end();
});

interface Fixture {
  tournamentId: number;
  organizerHeaders: Headers;
  viewerHeaders: Headers;
  supportHeaders: Headers;
}

async function makeFixture(): Promise<Fixture> {
  const organizerHash = `delete-r11-hash-${randomUUID()}`;
  const [tournament] = await dbm.db.insert(dbm.tournamentsTable).values({
    name: `R11 deletion fixture ${randomUUID()}`,
    format: "single_elimination",
    status: "draft",
    visibility: "public_online",
    organizerPasswordHash: organizerHash,
    defaultBestOf: 3,
  }).returning();
  await dbm.db.insert(dbm.playersTable).values([
    { tournamentId: tournament.id, name: `Alpha ${randomUUID()}`, seed: 1 },
    { tournamentId: tournament.id, name: `Beta ${randomUUID()}`, seed: 2 },
  ]);
  const organizerHeaders = {
    "x-organizer-token": signOrganizer(tournament.id, organizerHash),
  };
  await request(app).post(`/api/tournaments/${tournament.id}/start`)
    .set(organizerHeaders).expect(200);
  const [match] = await dbm.db.select().from(dbm.matchesTable)
    .where(eq(dbm.matchesTable.tournamentId, tournament.id));
  assert.ok(match?.id, "fixture must have a persisted match");
  // Complete a match via its real API, creating result_history and action_log.
  await request(app).post(`/api/matches/${match.id}/complete`).set(organizerHeaders)
    .send({ expectedRevision: match.revision, resultType: "played", score1: 2, score2: 0 })
    .expect(200);

  const supportToken = randomBytes(32).toString("hex");
  await dbm.db.insert(dbm.supportSessionsTable).values({
    tournamentId: tournament.id, nick: "Delete tester",
    sessionToken: supportToken, passwordVersion: tournament.supportPasswordVersion,
  });
  return {
    tournamentId: tournament.id,
    organizerHeaders,
    viewerHeaders: { "x-viewer-token": signViewer(tournament.id, tournament.viewerPasswordVersion) },
    supportHeaders: { "x-support-token": supportToken },
  };
}

async function snapshot(tournamentId: number) {
  const [tournaments, players, stages, matches, histories, actions] = await Promise.all([
    dbm.db.select().from(dbm.tournamentsTable).where(eq(dbm.tournamentsTable.id, tournamentId)),
    dbm.db.select().from(dbm.playersTable).where(eq(dbm.playersTable.tournamentId, tournamentId)),
    dbm.db.select().from(dbm.tournamentStagesTable).where(eq(dbm.tournamentStagesTable.tournamentId, tournamentId)),
    dbm.db.select().from(dbm.matchesTable).where(eq(dbm.matchesTable.tournamentId, tournamentId)),
    dbm.db.select().from(dbm.resultHistoryTable).where(eq(dbm.resultHistoryTable.tournamentId, tournamentId)),
    dbm.db.select().from(dbm.actionLogTable).where(eq(dbm.actionLogTable.tournamentId, tournamentId)),
  ]);
  return { tournaments, players, stages, matches, histories, actions };
}

function deleteRequest(f: Fixture, headers: Headers) {
  return request(app).delete(`/api/tournaments/${f.tournamentId}`).set(headers);
}

async function observeLockWaiter(timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  do {
    const row = await dbm.pool.query<{ count: string }>(`
      SELECT count(*)::text AS count FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid()
        AND wait_event_type = 'Lock' AND query ILIKE '%tournaments%'
    `);
    if (Number(row.rows[0]?.count) > 0) return;
    await new Promise<void>(resolve => setTimeout(resolve, 20));
  } while (Date.now() < deadline);
  throw new Error("DELETE_RACE_NOT_EXERCISED: no observed row-lock waiter");
}

describe("T080-S1B-D DELETE tournament after organizer revocation", () => {
  test("stale authorized DELETE waits for rotation, then 403 without cascades", { timeout: 25000 }, async () => {
    const f = await makeFixture();
    const initial = await snapshot(f.tournamentId);
    assert.equal(initial.tournaments.length, 1);
    assert.equal(initial.players.length, 2);
    assert.ok(initial.stages.length > 0 && initial.matches.length > 0);
    assert.ok(initial.histories.length > 0 && initial.actions.length > 0);

    const locker = await dbm.pool.connect();
    let transactionOpen = false;
    let pending: Promise<{ status: number; code?: string }> | undefined;
    try {
      await locker.query("BEGIN");
      transactionOpen = true;
      await locker.query(`SELECT id FROM "${config.schema}".tournaments WHERE id = $1 FOR UPDATE`, [f.tournamentId]);
      // The physical PostgreSQL waiter proves the request reached the lock.
      pending = deleteRequest(f, f.organizerHeaders).then(res => ({
        status: res.status, code: (res.body as { code?: string }).code,
      }));
      await observeLockWaiter();
      await locker.query(
        `UPDATE "${config.schema}".tournaments SET organizer_password_hash = $1 WHERE id = $2`,
        [`revoked-${randomUUID()}`, f.tournamentId],
      );
      await locker.query("COMMIT");
      transactionOpen = false;
      const response = await pending;
      assert.equal(response.status, 403);
      assert.equal(response.code, "SUPPORT_SESSION_EXPIRED", "existing error code");
      const after = await snapshot(f.tournamentId);
      const expected = {
        ...initial,
        tournaments: initial.tournaments.map(t => ({
          ...t, organizerPasswordHash: after.tournaments[0]?.organizerPasswordHash,
        })),
      };
      assert.deepEqual(after, expected, "revoked delete must preserve all dependent records");
    } finally {
      if (transactionOpen) await locker.query("ROLLBACK");
      locker.release();
      await pending?.catch(() => undefined);
    }
  });

  test("current organizer returns 204 and cascades dependent rows", async () => {
    const f = await makeFixture();
    const before = await snapshot(f.tournamentId);
    assert.ok(before.histories.length > 0, "history fixture must exist");
    await deleteRequest(f, f.organizerHeaders).expect(204);
    const after = await snapshot(f.tournamentId);
    for (const [name, values] of Object.entries(after)) {
      assert.equal(values.length, 0, `${name} must cascade on approved delete`);
    }
  });

  test("support, viewer, anonymous cannot delete", async () => {
    const f = await makeFixture();
    const before = await snapshot(f.tournamentId);
    for (const headers of [f.supportHeaders, f.viewerHeaders, {}]) {
      await deleteRequest(f, headers).expect(403);
      assert.deepEqual(await snapshot(f.tournamentId), before);
    }
  });

  test("organizer token for another tournament is rejected", async () => {
    const target = await makeFixture();
    const other = await makeFixture();
    const before = await snapshot(target.tournamentId);
    await deleteRequest(target, other.organizerHeaders).expect(403);
    assert.deepEqual(await snapshot(target.tournamentId), before);
  });

  test("already-revoked organizer token denied at initial guard", async () => {
    const f = await makeFixture();
    await dbm.db.update(dbm.tournamentsTable).set({
      organizerPasswordHash: `changed-${randomUUID()}`,
    }).where(eq(dbm.tournamentsTable.id, f.tournamentId));
    const before = await snapshot(f.tournamentId);
    await deleteRequest(f, f.organizerHeaders).expect(403);
    assert.deepEqual(await snapshot(f.tournamentId), before);
  });
});
