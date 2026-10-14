import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
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

type DB = typeof import("@workspace/db");
type Headers = Record<string, string>;
type Operation = "support-password" | "viewer-password" | "visibility" | "remove-viewer-password";
const operations: readonly Operation[] = [
  "support-password", "viewer-password", "visibility", "remove-viewer-password",
];

let database: DB;
let app: Express;
let cfg: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizer: typeof import("../src/auth").signVersionedOrganizerToken;
let signViewer: typeof import("../src/auth").signViewerToken;

before(async () => {
  // Protected by the existing fail-closed test-only DB/schema/reset preflight.
  cfg = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = cfg.connectionString;
  process.env.SESSION_SECRET = `web005-r12-a100-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, cfg.schema);
  schemaInitialized = true;
  ({ signVersionedOrganizerToken: signOrganizer, signViewerToken: signViewer } =
    await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !cfg) return;
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, cfg.schema);
  }
  await database.pool.end();
});

interface Fixture {
  id: number;
  organizer: Headers;
  viewer: Headers;
  support: Headers;
}

function digestForEvidence(raw: string | null): string | null {
  return raw == null ? null : createHash("sha256").update(raw).digest("hex");
}

async function createFixture(): Promise<Fixture> {
  const oldOrganizerHash = `r12-organizer-${randomUUID()}`;
  const [t] = await database.db.insert(database.tournamentsTable).values({
    name: `R12 S1B-P ${randomUUID()}`,
    format: "single_elimination",
    status: "draft",
    visibility: "public_online",
    organizerPasswordHash: oldOrganizerHash,
    supportPasswordHash: "initial-test-support-hash",
    viewerPasswordHash: "initial-test-viewer-hash",
    supportPasswordVersion: 1,
    viewerPasswordVersion: 1,
    defaultBestOf: 3,
  }).returning();
  const supportToken = randomBytes(32).toString("hex");
  await database.db.insert(database.supportSessionsTable).values({
    tournamentId: t.id,
    nick: "Test support",
    sessionToken: supportToken,
    passwordVersion: t.supportPasswordVersion,
  });
  return {
    id: t.id,
    organizer: { "x-organizer-token": signOrganizer(t.id, oldOrganizerHash) },
    support: { "x-support-token": supportToken },
    viewer: { "x-viewer-token": signViewer(t.id, t.viewerPasswordVersion) },
  };
}

function invoke(f: Fixture, op: Operation, headers: Headers) {
  switch (op) {
    case "support-password":
      return request(app)
        .post(`/api/tournaments/${f.id}/auth/change-support-password`)
        .set(headers).send({ newPassword: "new-support-password-r12" });
    case "viewer-password":
      return request(app)
        .post(`/api/tournaments/${f.id}/auth/change-viewer-password`)
        .set(headers).send({ newPassword: "new-viewer-password-r12" });
    case "visibility":
      return request(app)
        .post(`/api/tournaments/${f.id}/auth/change-visibility`)
        .set(headers).send({ visibility: "private_offline" });
    case "remove-viewer-password":
      return request(app)
        .delete(`/api/tournaments/${f.id}/auth/viewer-password`)
        .set(headers);
  }
}

// Report digest only, never expose the stored password hashes or raw session tokens.
async function snapshot(id: number) {
  const [rows, sessions, audit] = await Promise.all([
    database.db.select({
      organizerPasswordHash: database.tournamentsTable.organizerPasswordHash,
      supportPasswordHash: database.tournamentsTable.supportPasswordHash,
      supportPasswordVersion: database.tournamentsTable.supportPasswordVersion,
      viewerPasswordHash: database.tournamentsTable.viewerPasswordHash,
      viewerPasswordVersion: database.tournamentsTable.viewerPasswordVersion,
      visibility: database.tournamentsTable.visibility,
    }).from(database.tournamentsTable).where(eq(database.tournamentsTable.id, id)),
    database.db.select({
      id: database.supportSessionsTable.id,
      passwordVersion: database.supportSessionsTable.passwordVersion,
    }).from(database.supportSessionsTable).where(eq(database.supportSessionsTable.tournamentId, id)),
    database.db.select({
      id: database.authAuditLogTable.id,
      action: database.authAuditLogTable.action,
    }).from(database.authAuditLogTable).where(eq(database.authAuditLogTable.tournamentId, id)),
  ]);
  assert.equal(rows.length, 1, "tournament fixture must exist");
  return {
    tournament: {
      organizerProof: digestForEvidence(rows[0].organizerPasswordHash),
      supportProof: digestForEvidence(rows[0].supportPasswordHash),
      supportVersion: rows[0].supportPasswordVersion,
      viewerProof: digestForEvidence(rows[0].viewerPasswordHash),
      viewerVersion: rows[0].viewerPasswordVersion,
      visibility: rows[0].visibility,
    },
    sessions,
    audit,
  };
}

async function observeQueuedTournamentLock(timeoutMs = 12000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  do {
    const result = await database.pool.query<{ waiting: string }>(`
      SELECT count(*)::text AS waiting FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND wait_event_type = 'Lock'
        AND query ILIKE '%tournaments%'
    `);
    if (Number(result.rows[0]?.waiting) > 0) return;
    await new Promise<void>(resolve => setTimeout(resolve, 20));
  } while (Date.now() < deadline);
  throw new Error("R12_S1B_P_BARRIER_NOT_OBSERVED: request did not reach locked tournament row");
}

async function raceOldOrganizer(op: Operation): Promise<void> {
  const f = await createFixture();
  const initial = await snapshot(f.id);
  const locker = await database.pool.connect();
  let transactionOpen = false;
  let pending: Promise<{ status: number; code?: string }> | undefined;
  try {
    await locker.query("BEGIN");
    transactionOpen = true;
    await locker.query(
      `SELECT id FROM "${cfg.schema}".tournaments WHERE id = $1 FOR UPDATE`,
      [f.id],
    );
    // A passes initial requireOrganizer while the row is locked by B;
    // pg_stat_activity must prove that A reached the blocked SELECT FOR UPDATE.
    pending = invoke(f, op, f.organizer).then(res => ({
      status: res.status,
      code: (res.body as { code?: string }).code,
    }));
    await observeQueuedTournamentLock();
    await locker.query(
      `UPDATE "${cfg.schema}".tournaments SET organizer_password_hash = $1 WHERE id = $2`,
      [`revoked-r12-${randomUUID()}`, f.id],
    );
    await locker.query("COMMIT");
    transactionOpen = false;
    const denied = await pending;
    assert.equal(denied.status, 403, `${op}: revoked actor must fail closed`);
    assert.equal(denied.code, "SUPPORT_SESSION_EXPIRED", "preserve established 403 API code");
    const actual = await snapshot(f.id);
    assert.notEqual(actual.tournament.organizerProof, initial.tournament.organizerProof,
      "B must have committed credential rotation");
    const expected = {
      ...initial,
      tournament: { ...initial.tournament, organizerProof: actual.tournament.organizerProof },
    };
    assert.deepEqual(actual, expected,
      `${op}: stale A must not modify credential, visibility, sessions or audit`);
  } finally {
    if (transactionOpen) await locker.query("ROLLBACK");
    locker.release();
    await pending?.catch(() => undefined);
  }
}

describe("WEB-005 R12 A100 S1B-P locked organizer credential revalidation", () => {
  for (const op of operations) {
    test(`${op}: revoked organizer queued behind lock receives 403 and zero writes`,
      { timeout: 30000 }, async () => {
        await raceOldOrganizer(op);
      });

    test(`${op}: valid current organizer succeeds without changing organizer credential`,
      async () => {
        const f = await createFixture();
        const before = await snapshot(f.id);
        await invoke(f, op, f.organizer).expect(200);
        const after = await snapshot(f.id);
        assert.equal(after.tournament.organizerProof, before.tournament.organizerProof);
        assert.equal(after.audit.length, before.audit.length + 1, "authorized audit recorded");
        assert.deepEqual(after.sessions, before.sessions, "existing session rows retained");
        if (op === "support-password") {
          assert.equal(after.tournament.supportVersion, before.tournament.supportVersion + 1);
          assert.notEqual(after.tournament.supportProof, before.tournament.supportProof);
        } else if (op === "viewer-password") {
          assert.equal(after.tournament.viewerVersion, before.tournament.viewerVersion + 1);
          assert.notEqual(after.tournament.viewerProof, before.tournament.viewerProof);
        } else if (op === "visibility") {
          assert.equal(after.tournament.visibility, "private_offline");
          assert.equal(after.tournament.viewerVersion, before.tournament.viewerVersion + 1);
          assert.equal(after.tournament.viewerProof, null);
        } else {
          assert.equal(after.tournament.viewerVersion, before.tournament.viewerVersion + 1);
          assert.equal(after.tournament.viewerProof, null);
          assert.equal(after.tournament.visibility, before.tournament.visibility);
        }
      });

    test(`${op}: support, viewer and anonymous denied without protected writes`,
      async () => {
        const f = await createFixture();
        const before = await snapshot(f.id);
        for (const headers of [f.support, f.viewer, {}]) {
          await invoke(f, op, headers).expect(403);
          assert.deepEqual(await snapshot(f.id), before);
        }
      });

    test(`${op}: token invalidated before initial authorization is denied`,
      async () => {
        const f = await createFixture();
        await database.db.update(database.tournamentsTable).set({
          organizerPasswordHash: `already-revoked-${randomUUID()}`,
        }).where(eq(database.tournamentsTable.id, f.id));
        const before = await snapshot(f.id);
        await invoke(f, op, f.organizer).expect(403);
        assert.deepEqual(await snapshot(f.id), before);
      });
  }

  test("viewer-password removal remains 409 when visibility is private_online", async () => {
    const f = await createFixture();
    await database.db.update(database.tournamentsTable).set({
      visibility: "private_online",
    }).where(eq(database.tournamentsTable.id, f.id));
    const before = await snapshot(f.id);
    const res = await invoke(f, "remove-viewer-password", f.organizer).expect(409);
    assert.equal(res.body.code, "VIEWER_PASSWORD_REQUIRED");
    assert.deepEqual(await snapshot(f.id), before);
  });
});
