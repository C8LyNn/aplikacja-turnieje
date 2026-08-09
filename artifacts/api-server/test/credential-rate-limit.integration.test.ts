import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

const SESSION_SECRET = `credential-rate-limit-${randomUUID()}`;
const ORGANIZER_PASSWORD = "organizer-password";
const SUPPORT_PASSWORD = "support-password";
const VIEWER_PASSWORD = "viewer-password";

let app: Express;
let secondApp: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let hashPassword: typeof import("../src/auth").hashPassword;
let executeCredentialAttempt: typeof import("../src/application/auth/credential-rate-limit").executeCredentialAttempt;
let cleanupExpiredRows: typeof import("../src/application/auth/credential-rate-limit").deleteExpiredCredentialRateLimitRowsForTest;

async function createCredentialTournament(): Promise<number> {
  const response = await request(app).post("/api/tournaments").send({
    name: `Credential limiter ${randomUUID()}`,
    format: "single_elimination",
    maxPlayers: 8,
    organizerPassword: ORGANIZER_PASSWORD,
    supportPassword: SUPPORT_PASSWORD,
    viewerPassword: VIEWER_PASSWORD,
    visibility: "private_online",
  });
  assert.equal(response.status, 201, response.text);
  return response.body.id as number;
}

async function createLegacyTournament(hostCode: string): Promise<number> {
  const result = await database.pool.query<{ id: number }>(
    `INSERT INTO tournaments (
       name, format, status, visibility, default_best_of, max_players, host_code
     ) VALUES ($1, 'single_elimination', 'draft', 'public_online', 1, 8, $2)
     RETURNING id`,
    [`Legacy limiter ${randomUUID()}`, hostCode],
  );
  return result.rows[0]!.id;
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  ({ hashPassword } = await import("../src/auth"));
  ({
    executeCredentialAttempt,
    deleteExpiredCredentialRateLimitRowsForTest: cleanupExpiredRows,
  } = await import("../src/application/auth/credential-rate-limit"));
  const appModule = await import("../src/app");
  app = appModule.createApp({});
  secondApp = appModule.createApp({});
});

after(async () => {
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

describe("durable credential rate limiter", () => {
  test("checks an active block before invoking the expensive verifier", async () => {
    const policy = {
      sourceMaxFailures: 1,
      tournamentMaxFailures: 10,
      windowMs: 10_000,
      blockMs: 10_000,
      retentionMs: 60_000,
      cleanupBatchSize: 10,
    };
    let verificationCalls = 0;
    await assert.rejects(
      executeCredentialAttempt({
        tournamentId: 701_001,
        credentialType: "organizer",
        sourceFingerprint: "first-source",
        policy,
        verify: async () => {
          verificationCalls += 1;
          return { ok: false } as const;
        },
      }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "AUTH_RATE_LIMITED",
    );
    await assert.rejects(
      executeCredentialAttempt({
        tournamentId: 701_001,
        credentialType: "organizer",
        sourceFingerprint: "first-source",
        policy,
        verify: async () => {
          verificationCalls += 1;
          return { ok: true, value: true } as const;
        },
      }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "AUTH_RATE_LIMITED",
    );
    assert.equal(verificationCalls, 1);
  });

  test("reports remaining Retry-After and resets both scopes after success", async () => {
    const policy = {
      sourceMaxFailures: 2,
      tournamentMaxFailures: 10,
      windowMs: 10_000,
      blockMs: 2_500,
      retentionMs: 60_000,
      cleanupBatchSize: 10,
    };
    const input = {
      tournamentId: 701_002,
      credentialType: "viewer" as const,
      sourceFingerprint: "retry-source",
      policy,
    };
    await assert.rejects(
      executeCredentialAttempt({
        ...input,
        verify: async () => ({ ok: false } as const),
      }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "INVALID_CREDENTIALS",
    );
    let firstRetry = 0;
    await assert.rejects(
      executeCredentialAttempt({
        ...input,
        verify: async () => ({ ok: false } as const),
      }),
      (error: unknown) => {
        firstRetry =
          error instanceof Error && "retryAfterSeconds" in error
            ? Number(error.retryAfterSeconds)
            : 0;
        return firstRetry >= 2;
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    let secondRetry = 0;
    await assert.rejects(
      executeCredentialAttempt({
        ...input,
        verify: async () => ({ ok: true, value: true } as const),
      }),
      (error: unknown) => {
        secondRetry =
          error instanceof Error && "retryAfterSeconds" in error
            ? Number(error.retryAfterSeconds)
            : 0;
        return secondRetry > 0;
      },
    );
    assert.ok(secondRetry < firstRetry, `${secondRetry} !< ${firstRetry}`);

    await database.pool.query(
      `UPDATE auth_credential_rate_limits
       SET blocked_until = CURRENT_TIMESTAMP - INTERVAL '1 second',
           window_started_at = CURRENT_TIMESTAMP - INTERVAL '11 seconds'
       WHERE tournament_id = $1`,
      [input.tournamentId],
    );
    assert.equal(
      await executeCredentialAttempt({
        ...input,
        verify: async () => ({ ok: true, value: "accepted" } as const),
      }),
      "accepted",
    );
    const remaining = await database.pool.query<{
      failure_count: number;
      blocked_until: Date | null;
    }>(
      `SELECT failure_count, blocked_until
       FROM auth_credential_rate_limits
       WHERE tournament_id = $1
       ORDER BY scope_type`,
      [input.tournamentId],
    );
    assert.equal(remaining.rows.length, 2);
    assert.ok(
      remaining.rows.every(
        (row) => row.failure_count === 0 && row.blocked_until === null,
      ),
    );
  });

  test("atomically serializes attempts across two application instances", async () => {
    const tournamentId = await createCredentialTournament();
    const attempts = Array.from({ length: 8 }, (_, index) =>
      request(index % 2 === 0 ? app : secondApp)
        .post(`/api/tournaments/${tournamentId}/auth/organizer-login`)
        .send({ password: `wrong-${index}` }),
    );
    const responses = await Promise.all(attempts);
    assert.equal(responses.filter((response) => response.status === 403).length, 4);
    assert.equal(responses.filter((response) => response.status === 429).length, 4);
    assert.ok(
      responses
        .filter((response) => response.status === 429)
        .every((response) => Number(response.headers["retry-after"]) > 0),
    );
  });

  test("protects organizer, viewer, support, and legacy upgrade endpoints", async () => {
    const cases: Array<{
      tournamentId: number;
      path: (id: number) => string;
      body: Record<string, string>;
    }> = [];
    for (const kind of ["organizer", "viewer", "support"] as const) {
      const tournamentId = await createCredentialTournament();
      cases.push({
        tournamentId,
        path: (id) => `/api/tournaments/${id}/auth/${kind}-login`,
        body:
          kind === "support"
            ? { password: "wrong-password", nick: "Tester" }
            : { password: "wrong-password" },
      });
    }
    const hostCode = `legacy-${randomUUID()}`;
    const legacyId = await createLegacyTournament(hostCode);
    cases.push({
      tournamentId: legacyId,
      path: (id) => `/api/tournaments/${id}/auth/upgrade-legacy-organizer`,
      body: {
        hostCode: "wrong-host-code",
        organizerPassword: "replacement-password",
      },
    });

    for (const limiterCase of cases) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const response = await request(app)
          .post(limiterCase.path(limiterCase.tournamentId))
          .send(limiterCase.body);
        assert.equal(response.status, 403, response.text);
        assert.equal(response.body.code, "INVALID_CREDENTIALS");
      }
      const blocked = await request(app)
        .post(limiterCase.path(limiterCase.tournamentId))
        .send(limiterCase.body);
      assert.equal(blocked.status, 429, blocked.text);
      assert.equal(blocked.body.code, "AUTH_RATE_LIMITED");
    }
  });

  test("keeps scopes independent while a tournament-global scope still limits source rotation", async () => {
    const policy = {
      sourceMaxFailures: 5,
      tournamentMaxFailures: 3,
      windowMs: 60_000,
      blockMs: 60_000,
      retentionMs: 60_000,
      cleanupBatchSize: 10,
    };
    for (const sourceFingerprint of ["source-a", "source-b"]) {
      await assert.rejects(
        executeCredentialAttempt({
          tournamentId: 701_003,
          credentialType: "support",
          sourceFingerprint,
          policy,
          verify: async () => ({ ok: false } as const),
        }),
        (error: unknown) =>
          error instanceof Error &&
          "code" in error &&
          error.code === "INVALID_CREDENTIALS",
      );
    }
    await assert.rejects(
      executeCredentialAttempt({
        tournamentId: 701_003,
        credentialType: "support",
        sourceFingerprint: "source-c",
        policy,
        verify: async () => ({ ok: false } as const),
      }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "AUTH_RATE_LIMITED",
    );
    assert.equal(
      await executeCredentialAttempt({
        tournamentId: 701_004,
        credentialType: "support",
        sourceFingerprint: "source-c",
        policy,
        verify: async () => ({ ok: true, value: "other-tournament" } as const),
      }),
      "other-tournament",
    );
    assert.equal(
      await executeCredentialAttempt({
        tournamentId: 701_003,
        credentialType: "viewer",
        sourceFingerprint: "source-c",
        policy,
        verify: async () => ({ ok: true, value: "other-credential" } as const),
      }),
      "other-credential",
    );
  });

  test("retains no raw source or secret and performs bounded indexed cleanup", async () => {
    await database.pool.query(
      `INSERT INTO auth_credential_rate_limits (
         scope_type, tournament_id, credential_type, source_fingerprint,
         window_started_at, failure_count, blocked_until, last_updated_at
       ) VALUES
       ('source', 701005, 'organizer', $1, CURRENT_TIMESTAMP - INTERVAL '10 days', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days'),
       ('tournament', 701005, 'organizer', 'global', CURRENT_TIMESTAMP - INTERVAL '10 days', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '10 days')`,
      ["a".repeat(64)],
    );
    await cleanupExpiredRows(new Date());
    const rows = await database.pool.query<{
      source_fingerprint: string;
      count: number;
    }>(
      `SELECT source_fingerprint, count(*)::int AS count
       FROM auth_credential_rate_limits
       GROUP BY source_fingerprint`,
    );
    assert.equal(
      rows.rows.some((row) => row.source_fingerprint.includes("127.0.0.1")),
      false,
    );
    assert.equal(
      rows.rows.some((row) => row.source_fingerprint.includes(ORGANIZER_PASSWORD)),
      false,
    );
    const indexes = await database.pool.query<{ indexname: string }>(
      `SELECT indexname
       FROM pg_indexes
       WHERE schemaname = current_schema()
         AND tablename = 'auth_credential_rate_limits'`,
    );
    assert.ok(
      indexes.rows.some(
        (row) => row.indexname === "auth_credential_rate_limits_cleanup_idx",
      ),
    );
  });

  test("fails closed when the durable limiter store is unavailable", async () => {
    const tournamentId = await createCredentialTournament();
    await database.pool.query(
      "ALTER TABLE auth_credential_rate_limits RENAME TO auth_credential_rate_limits_unavailable",
    );
    try {
      const response = await request(app)
        .post(`/api/tournaments/${tournamentId}/auth/organizer-login`)
        .send({ password: ORGANIZER_PASSWORD });
      assert.equal(response.status, 500, response.text);
      assert.equal(response.body.code, "INTERNAL_SERVER_ERROR");
      assert.equal(response.body.token, undefined);
    } finally {
      await database.pool.query(
        "ALTER TABLE auth_credential_rate_limits_unavailable RENAME TO auth_credential_rate_limits",
      );
    }
  });

  test("accepts historical short password hashes while new setters require eight characters", async () => {
    const historicalHash = await hashPassword("short");
    const result = await database.pool.query<{ id: number }>(
      `INSERT INTO tournaments (
         name, format, status, visibility, default_best_of, max_players,
         organizer_password_hash
       ) VALUES ($1, 'single_elimination', 'draft', 'public_online', 1, 8, $2)
       RETURNING id`,
      [`Historical password ${randomUUID()}`, historicalHash],
    );
    const historicalId = result.rows[0]!.id;
    const login = await request(app)
      .post(`/api/tournaments/${historicalId}/auth/organizer-login`)
      .send({ password: "short" });
    assert.equal(login.status, 200, login.text);

    const rejected = await request(app).post("/api/tournaments").send({
      name: "Too short",
      format: "single_elimination",
      organizerPassword: "seven77",
    });
    assert.equal(rejected.status, 400);
    assert.equal(rejected.body.code, "ORGANIZER_PASSWORD_TOO_SHORT");
  });

  test("strictly rejects malformed ids on every authentication route", async () => {
    const operations = [
      (id: string) => request(app).get(`/api/tournaments/${id}/auth/credential-state`),
      (id: string) => request(app).post(`/api/tournaments/${id}/auth/organizer-login`).send({ password: "password" }),
      (id: string) => request(app).post(`/api/tournaments/${id}/auth/upgrade-legacy-organizer`).send({ hostCode: "code", organizerPassword: "password" }),
      (id: string) => request(app).post(`/api/tournaments/${id}/auth/support-login`).send({ password: "password", nick: "nick" }),
      (id: string) => request(app).get(`/api/tournaments/${id}/auth/support-sessions`),
      (id: string) => request(app).post(`/api/tournaments/${id}/auth/change-support-password`).send({ newPassword: "password" }),
      (id: string) => request(app).post(`/api/tournaments/${id}/auth/viewer-login`).send({ password: "password" }),
      (id: string) => request(app).post(`/api/tournaments/${id}/auth/change-viewer-password`).send({ newPassword: "password" }),
      (id: string) => request(app).post(`/api/tournaments/${id}/auth/change-visibility`).send({ visibility: "public_online" }),
      (id: string) => request(app).delete(`/api/tournaments/${id}/auth/viewer-password`),
      (id: string) => request(app).get(`/api/tournaments/${id}/audit-log`),
    ];
    for (const invalidId of [
      "123abc",
      "1.5",
      "-1",
      "0",
      "2147483648",
      "9007199254740992",
    ]) {
      for (const operation of operations) {
        const response = await operation(invalidId);
        assert.equal(response.status, 400, `${invalidId}: ${response.text}`);
        assert.equal(response.body.code, "INVALID_TOURNAMENT_ID");
      }
    }
  });
});
