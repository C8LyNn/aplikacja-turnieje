import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import type { TournamentBackupV2 } from "@workspace/api-zod";
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

const SESSION_SECRET = `security-integrity-${randomUUID()}`;
const ORGANIZER_PASSWORD = "organizer-password";
const SUPPORT_PASSWORD = "support-password";
const VIEWER_PASSWORD = "viewer-password";

let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signViewerToken: typeof import("../src/auth").signViewerToken;
let signVersionedOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let hashPassword: typeof import("../src/auth").hashPassword;
let importTournamentPlayers: typeof import("../src/application/players/tournament-roster").importTournamentPlayers;
let upgradeLegacyOrganizerCredentials: typeof import("../src/application/auth/legacy-organizer-credentials").upgradeLegacyOrganizerCredentials;
let upgradeLegacyOrganizerCredentialsRateLimited: typeof import("../src/application/auth/legacy-organizer-credentials").upgradeLegacyOrganizerCredentialsRateLimited;
let recoverLegacyOrganizerCredentials: typeof import("../src/application/auth/legacy-organizer-credentials").recoverLegacyOrganizerCredentials;
const organizerTokens = new Map<number, string>();

test("organizer recovery after session loss preserves independent sessions and denies viewers", async () => {
  const password = "durable-organizer-password";
  const created = await request(app).post("/api/tournaments").send({
    name: "Recoverable owner", format: "single_elimination", organizerPassword: password,
  }).expect(201);
  const id = created.body.id as number;
  const original = { "x-organizer-token": created.body.organizerToken as string };
  assert.equal(created.body.hasOrganizerPassword, true);
  await request(app).post(`/api/tournaments/${id}/players`).set(original)
    .send({ name: "Before session loss", seed: 1 }).expect(201);
  // Losing the browser token leaves an ordinary unauthenticated request.
  await request(app).post(`/api/tournaments/${id}/players`)
    .send({ name: "No credential", seed: 2 }).expect(403);
  const viewer = { "x-viewer-token": signViewerToken(id) };
  await request(app).post(`/api/tournaments/${id}/players`).set(viewer)
    .send({ name: "Viewer cannot write", seed: 2 }).expect(403);
  const wrong = await request(app).post(`/api/tournaments/${id}/auth/organizer-login`)
    .send({ password: "incorrect-secret" }).expect(403);
  const absent = await request(app).post("/api/tournaments/2147483647/auth/organizer-login")
    .send({ password: "incorrect-secret" }).expect(403);
  assert.deepEqual(wrong.body, absent.body);
  assert.equal(wrong.body.token, undefined);
  const login = await request(app).post(`/api/tournaments/${id}/auth/organizer-login`)
    .send({ password }).expect(200);
  const second = await request(app).post(`/api/tournaments/${id}/auth/organizer-login`)
    .send({ password }).expect(200);
  for (const [index, token] of [original["x-organizer-token"], login.body.token, second.body.token].entries()) {
    await request(app).post(`/api/tournaments/${id}/players`).set("x-organizer-token", token)
      .send({ name: `Independent session ${index}`, seed: index + 2 }).expect(201);
  }
  const publicRead = await request(app).get(`/api/tournaments/${id}`).expect(200);
  const stored = await database.pool.query("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [id]);
  const serialized = JSON.stringify(publicRead.body);
  for (const secret of [password, stored.rows[0].organizer_password_hash, original["x-organizer-token"], login.body.token]) {
    assert.equal(serialized.includes(secret), false);
  }
  assert.notEqual(stored.rows[0].organizer_password_hash, password);
});

function organizerHeaders(tournamentId: number): Record<string, string> {
  const token = organizerTokens.get(tournamentId);
  assert.ok(token, `Missing organizer token for tournament ${tournamentId}`);
  return { "x-organizer-token": token };
}

async function createTournament(input: Record<string, unknown> = {}) {
  const response = await request(app)
    .post("/api/tournaments")
    .send({
      name: `Security fixture ${randomUUID()}`,
      format: "single_elimination",
      defaultBestOf: 1,
      maxPlayers: 64,
      organizerPassword: ORGANIZER_PASSWORD,
      supportPassword: SUPPORT_PASSWORD,
      ...input,
    });
  assert.equal(response.status, 201, response.text);
  const tournament = response.body as { id: number };
  const login = await request(app)
    .post(`/api/tournaments/${tournament.id}/auth/organizer-login`)
    .send({ password: ORGANIZER_PASSWORD });
  assert.equal(login.status, 200, login.text);
  organizerTokens.set(tournament.id, login.body.token as string);
  return tournament;
}

async function addPlayer(tournamentId: number, name: string, seed: number) {
  const response = await request(app)
    .post(`/api/tournaments/${tournamentId}/players`)
    .set(organizerHeaders(tournamentId))
    .send({ name, seed });
  assert.equal(response.status, 201, response.text);
  return response.body as { id: number; name: string };
}

async function supportHeaders(tournamentId: number): Promise<Record<string, string>> {
  return supportHeadersForPassword(tournamentId, SUPPORT_PASSWORD);
}

async function supportHeadersForPassword(
  tournamentId: number,
  password: string,
): Promise<Record<string, string>> {
  const response = await request(app)
    .post(`/api/tournaments/${tournamentId}/auth/support-login`)
    .send({ password, nick: "Security support" });
  assert.equal(response.status, 200, response.text);
  return { "x-support-token": response.body.sessionToken as string };
}

async function createLegacyTournament(input: {
  hostCode?: string | null;
  organizerPassword?: string | null;
  visibility?: "public_online" | "private_online" | "private_offline";
} = {}): Promise<number> {
  const organizerPasswordHash = input.organizerPassword == null
    ? null
    : await hashPassword(input.organizerPassword);
  const result = await database.pool.query<{ id: number }>(
    `INSERT INTO tournaments (
       name, format, status, visibility, default_best_of, max_players,
       host_code, organizer_password_hash
     )
     VALUES ($1, 'single_elimination', 'draft', $2, 1, 64, $3, $4)
     RETURNING id`,
    [
      `Legacy fixture ${randomUUID()}`,
      input.visibility ?? "public_online",
      input.hostCode ?? null,
      organizerPasswordHash,
    ],
  );
  return result.rows[0].id;
}

async function rosterNames(tournamentId: number): Promise<string[]> {
  const result = await database.pool.query<{ name: string }>(
    "SELECT name FROM players WHERE tournament_id = $1 ORDER BY seed NULLS LAST, id",
    [tournamentId],
  );
  return result.rows.map((row) => row.name);
}

async function waitForBlockedDatabaseRequests(minimum: number): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const result = await database.pool.query<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM pg_stat_activity
       WHERE datname = current_database()
         AND pid <> pg_backend_pid()
         AND wait_event_type = 'Lock'`,
    );
    if (result.rows[0].count >= minimum) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for ${minimum} blocked database requests`);
}

async function runSupportRevocationRace(input: {
  tournamentId: number;
  support: Record<string, string>;
  mutate: () => Promise<request.Response>;
}): Promise<request.Response> {
  const lockClient = await database.pool.connect();
  try {
    await lockClient.query("BEGIN");
    await lockClient.query(
      "SELECT id FROM tournaments WHERE id = $1 FOR UPDATE",
      [input.tournamentId],
    );

    const rotation = request(app)
      .post(`/api/tournaments/${input.tournamentId}/auth/change-support-password`)
      .set(organizerHeaders(input.tournamentId))
      .send({ newPassword: `rotated-${randomUUID()}` })
      .then((response) => response);
    await waitForBlockedDatabaseRequests(1);

    const mutation = input.mutate();
    await waitForBlockedDatabaseRequests(2);
    await lockClient.query("COMMIT");

    const [rotationResponse, mutationResponse] = await Promise.all([
      rotation,
      mutation,
    ]);
    assert.equal(rotationResponse.status, 200, rotationResponse.text);
    assert.equal(mutationResponse.status, 403, mutationResponse.text);
    assert.equal(mutationResponse.body.code, "SUPPORT_SESSION_EXPIRED");
    return mutationResponse;
  } finally {
    try {
      await lockClient.query("ROLLBACK");
    } catch {}
    lockClient.release();
  }
}

function minimalBackupV2(
  visibility: "public_online" | "private_online" | "private_offline" = "public_online",
): TournamentBackupV2 {
  return {
    schemaVersion: 2,
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    exportedAt: new Date().toISOString(),
    tournament: {
      name: `Standalone backup v2 ${randomUUID()}`,
      description: null,
      format: "round_robin",
      status: "draft",
      maxPlayers: 8,
      currentRound: null,
      totalRounds: null,
      swissRounds: null,
      defaultBestOf: 3,
      visibility,
      winnerBackupId: null,
      featuredMatchBackupId: null,
    },
    players: [],
    matches: [],
    resultHistory: [],
    actionLog: [],
  };
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  ({ signViewerToken, signVersionedOrganizerToken, hashPassword } = await import("../src/auth"));
  ({ importTournamentPlayers } = await import("../src/application/players/tournament-roster"));
  ({
    upgradeLegacyOrganizerCredentials,
    upgradeLegacyOrganizerCredentialsRateLimited,
    recoverLegacyOrganizerCredentials,
  } = await import("../src/application/auth/legacy-organizer-credentials"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

describe("security and tournament integrity regressions", () => {
  test("exposes only neutral organizer bootstrap metadata for every legacy state", async () => {
    const publicHostOnly = await createLegacyTournament({
      hostCode: `public-${randomUUID()}`,
    });
    const privateOnlineHostOnly = await createLegacyTournament({
      hostCode: `private-online-${randomUUID()}`,
      visibility: "private_online",
    });
    const privateOfflineHostOnly = await createLegacyTournament({
      hostCode: `private-offline-${randomUUID()}`,
      visibility: "private_offline",
    });
    const privatePasswordOnly = await createLegacyTournament({
      organizerPassword: ORGANIZER_PASSWORD,
      visibility: "private_online",
    });
    const privateNoCredentials = await createLegacyTournament({
      visibility: "private_offline",
    });

    const expectations = [
      [publicHostOnly, { exists: true, accessMode: "legacy_upgrade", private: false }],
      [privateOnlineHostOnly, { exists: true, accessMode: "legacy_upgrade", private: true }],
      [privateOfflineHostOnly, { exists: true, accessMode: "legacy_upgrade", private: true }],
      [privatePasswordOnly, { exists: true, accessMode: "organizer_login", private: true }],
      [privateNoCredentials, { exists: true, accessMode: "admin_recovery", private: true }],
      [2_147_483_000, { exists: false, accessMode: null, private: false }],
    ] as const;

    for (const [tournamentId, expected] of expectations) {
      const response = await request(app)
        .get(`/api/tournaments/${tournamentId}/auth/credential-state`);
      assert.equal(response.status, 200, response.text);
      assert.deepEqual(response.body, expected);
      assert.deepEqual(
        Object.keys(response.body).sort(),
        ["accessMode", "exists", "private"],
      );
      const serialized = JSON.stringify(response.body);
      for (const forbidden of [
        "hostCode",
        "organizerPasswordHash",
        "players",
        "settings",
        ORGANIZER_PASSWORD,
      ]) {
        assert.equal(serialized.includes(forbidden), false, forbidden);
      }
    }

    for (const tournamentId of [
      privateOnlineHostOnly,
      privateOfflineHostOnly,
      privatePasswordOnly,
      privateNoCredentials,
    ]) {
      const read = await request(app).get(`/api/tournaments/${tournamentId}`);
      assert.equal(read.status, 403);
    }
  });

  test("upgrades a private host-only tournament without exposing it anonymously", async () => {
    const hostCode = `private-upgrade-${randomUUID()}`;
    const organizerPassword = "private-upgraded-organizer";
    const tournamentId = await createLegacyTournament({
      hostCode,
      visibility: "private_offline",
    });

    await request(app).get(`/api/tournaments/${tournamentId}`).expect(403);
    const wrong = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode: "wrong", organizerPassword });
    assert.equal(wrong.status, 403);
    assert.deepEqual(wrong.body, {
      error: "Nie udało się zweryfikować poświadczeń.",
      code: "INVALID_CREDENTIALS",
    });

    const upgraded = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode, organizerPassword });
    assert.equal(upgraded.status, 200, upgraded.text);
    assert.equal(typeof upgraded.body.token, "string");

    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set({ "x-host-code": hostCode })
      .send({ name: "Old host code denied", seed: 1 })
      .expect(403);
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set({ "x-organizer-token": upgraded.body.token as string })
      .send({ name: "Versioned organizer accepted", seed: 1 })
      .expect(201);
    await request(app)
      .get(`/api/tournaments/${tournamentId}`)
      .set({ "x-organizer-token": upgraded.body.token as string })
      .expect(200);
  });

  test("durably rate-limits failed legacy upgrades by tournament and source", async () => {
    const hostCode = `rate-limit-${randomUUID()}`;
    const tournamentId = await createLegacyTournament({ hostCode });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const failed = await request(app)
        .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
        .send({
          hostCode: `wrong-${attempt}`,
          organizerPassword: "rate-limited-password",
        });
      assert.equal(failed.status, 403, failed.text);
      assert.deepEqual(failed.body, {
        error: "Nie udało się zweryfikować poświadczeń.",
        code: "INVALID_CREDENTIALS",
      });
    }

    const limited = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode: "fifth-wrong", organizerPassword: "rate-limited-password" });
    assert.equal(limited.status, 429, limited.text);
    assert.equal(limited.body.code, "AUTH_RATE_LIMITED");
    assert.ok(Number.parseInt(limited.headers["retry-after"] ?? "", 10) > 0);
    assert.match(limited.headers["content-type"] ?? "", /application\/json/);

    const otherTournamentHostCode = `other-rate-${randomUUID()}`;
    const otherTournamentId = await createLegacyTournament({
      hostCode: otherTournamentHostCode,
    });
    const otherTournament = await request(app)
      .post(`/api/tournaments/${otherTournamentId}/auth/upgrade-legacy-organizer`)
      .send({
        hostCode: otherTournamentHostCode,
        organizerPassword: "first-attempt-succeeds",
      });
    assert.equal(otherTournament.status, 200, otherTournament.text);

    await database.pool.query(
      `UPDATE auth_credential_rate_limits
       SET blocked_until = CURRENT_TIMESTAMP - INTERVAL '1 second',
           window_started_at = CURRENT_TIMESTAMP - INTERVAL '16 minutes'
       WHERE tournament_id = $1
         AND credential_type = 'legacy_upgrade'`,
      [tournamentId],
    );
    const afterWindow = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode, organizerPassword: "rate-limited-password" });
    assert.equal(afterWindow.status, 200, afterWindow.text);

    const sourceHostCode = `source-rate-${randomUUID()}`;
    const sourceTournamentId = await createLegacyTournament({
      hostCode: sourceHostCode,
    });
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await assert.rejects(
        upgradeLegacyOrganizerCredentialsRateLimited({
          tournamentId: sourceTournamentId,
          hostCode: "wrong",
          organizerPassword: "source-isolated-password",
          requestSourceFingerprint: "source-a",
        }),
        (error: unknown) =>
          error instanceof Error &&
          "code" in error &&
          error.code === "INVALID_CREDENTIALS",
      );
    }
    await assert.rejects(
      upgradeLegacyOrganizerCredentialsRateLimited({
        tournamentId: sourceTournamentId,
        hostCode: "wrong",
        organizerPassword: "source-isolated-password",
        requestSourceFingerprint: "source-a",
      }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "AUTH_RATE_LIMITED",
    );
    const sourceIsolated = await upgradeLegacyOrganizerCredentialsRateLimited({
      tournamentId: sourceTournamentId,
      hostCode: sourceHostCode,
      organizerPassword: "source-isolated-password",
      requestSourceFingerprint: "source-b",
    });
    assert.equal(sourceIsolated.id, sourceTournamentId);
    assert.equal(sourceIsolated.hostCode, null);
  });

  test("removes the standalone legacy host-code verification oracle", async () => {
    const tournamentId = await createLegacyTournament({
      hostCode: `verify-removed-${randomUUID()}`,
    });
    const response = await request(app)
      .post(`/api/tournaments/${tournamentId}/verify-host-code`)
      .send({ code: "anything" });
    assert.equal(response.status, 404);
  });

  test("creates immediately manageable tournaments with required organizer credentials and validates private viewer access", async () => {
    const base = { name: `Credentials ${randomUUID()}`, format: "single_elimination" };
    const noOrganizer = await request(app).post("/api/tournaments").send(base);
    assert.equal(noOrganizer.status, 400, noOrganizer.text);
    assert.equal(noOrganizer.body.organizerToken, undefined);

    const emptyOrganizerName = `Empty organizer ${randomUUID()}`;
    const emptyOrganizer = await request(app).post("/api/tournaments").send({
      ...base,
      name: emptyOrganizerName,
      organizerPassword: "",
    });
    assert.equal(emptyOrganizer.status, 400, emptyOrganizer.text);
    assert.equal(emptyOrganizer.body.organizerToken, undefined);
    const missingRows = await database.pool.query("SELECT id FROM tournaments WHERE name = ANY($1)", [[base.name, emptyOrganizerName]]);
    assert.equal(missingRows.rowCount, 0);

    const privateName = `Private without viewer ${randomUUID()}`;
    const privateWithoutViewer = await request(app).post("/api/tournaments").send({
      ...base,
      name: privateName,
      visibility: "private_online",
      organizerPassword: ORGANIZER_PASSWORD,
    });
    assert.equal(privateWithoutViewer.status, 422);
    assert.equal(privateWithoutViewer.body.code, "VIEWER_PASSWORD_REQUIRED");
    const privateRows = await database.pool.query(
      "SELECT id FROM tournaments WHERE name = $1",
      [privateName],
    );
    assert.equal(privateRows.rowCount, 0);

    for (const organizerPassword of ["x", "1234567"]) {
      const short = await request(app).post("/api/tournaments").send({
        ...base,
        name: `Short organizer ${randomUUID()}`,
        organizerPassword,
      });
      assert.equal(short.status, 400);
      assert.equal(short.body.code, "ORGANIZER_PASSWORD_TOO_SHORT");
    }

    for (const body of [
      { ...base, organizerPassword: ORGANIZER_PASSWORD },
      {
        ...base,
        visibility: "private_online",
        viewerPassword: VIEWER_PASSWORD,
        organizerPassword: ORGANIZER_PASSWORD,
      },
      { ...base, visibility: "private_offline", organizerPassword: ORGANIZER_PASSWORD },
    ]) {
      const response = await request(app).post("/api/tournaments").send(body);
      assert.equal(response.status, 201, response.text);
    }
  });

  test("lets only a passwordless organizer set the first password and rotates its token", async () => {
    // Historical data and an already issued session, no longer created by the public API.
    const tournamentId = await createLegacyTournament();
    await database.pool.query("UPDATE tournaments SET support_password_hash = $1 WHERE id = $2", [await hashPassword(SUPPORT_PASSWORD), tournamentId]);
    const passwordlessToken = signVersionedOrganizerToken(tournamentId, null);
    assert.equal(typeof passwordlessToken, "string");

    const support = await supportHeaders(tournamentId);
    const viewer = { "x-viewer-token": signViewerToken(tournamentId, 1) };
    for (const headers of [{}, support, viewer, { "x-host-code": "legacy-is-not-auth" }]) {
      const denied = await request(app)
        .post(`/api/tournaments/${tournamentId}/auth/set-organizer-password`)
        .set(headers)
        .send({ newPassword: "new-organizer-password" });
      assert.equal(denied.status, 403, denied.text);
    }

    for (const body of [
      {},
      { newPassword: "" },
      { newPassword: "x" },
      { newPassword: "1234567" },
    ]) {
      const rejected = await request(app)
        .post(`/api/tournaments/${tournamentId}/auth/set-organizer-password`)
        .set({ "x-organizer-token": passwordlessToken })
        .send(body);
      assert.equal(rejected.status, 400, rejected.text);
      assert.equal(rejected.body.code, "ORGANIZER_PASSWORD_TOO_SHORT");
    }

    const newPassword = "new-organizer-password";
    const established = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/set-organizer-password`)
      .set({ "x-organizer-token": passwordlessToken })
      .send({ newPassword });
    assert.equal(established.status, 200, established.text);
    const rotatedToken = established.body.token as string;
    assert.equal(typeof rotatedToken, "string");
    assert.notEqual(rotatedToken, passwordlessToken);

    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set({ "x-organizer-token": passwordlessToken })
      .send({ name: "Old token must fail", seed: 1 })
      .expect(403);
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set({ "x-organizer-token": rotatedToken })
      .send({ name: "New token works", seed: 1 })
      .expect(201);

    const login = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/organizer-login`)
      .send({ password: newPassword });
    assert.equal(login.status, 200, login.text);
    assert.equal(typeof login.body.token, "string");

    const repeated = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/set-organizer-password`)
      .set({ "x-organizer-token": rotatedToken })
      .send({ newPassword: "another-organizer-password" });
    assert.equal(repeated.status, 409, repeated.text);
    assert.equal(repeated.body.code, "ORGANIZER_PASSWORD_ALREADY_SET");
  });

  test("never treats hostCode as organizer when an organizer password exists", async () => {
    const hostCode = `host-${randomUUID()}`;
    const tournamentId = await createLegacyTournament({
      hostCode,
      organizerPassword: ORGANIZER_PASSWORD,
    });
    const otherTournamentId = await createLegacyTournament({
      hostCode: `other-${randomUUID()}`,
      organizerPassword: ORGANIZER_PASSWORD,
    });
    await database.pool.query(
      "UPDATE tournaments SET support_password_hash = $1 WHERE id = $2",
      [await hashPassword(SUPPORT_PASSWORD), tournamentId],
    );
    const support = await supportHeaders(tournamentId);

    for (const headers of [
      { "x-host-code": hostCode },
      { "x-host-code": "wrong-host-code" },
      { "x-host-code": hostCode, "x-viewer-token": signViewerToken(tournamentId, 1) },
      { "x-host-code": hostCode, ...support },
      { "x-host-code": hostCode, ...(await supportHeadersForPassword(
        otherTournamentId,
        SUPPORT_PASSWORD,
      ).catch(() => ({ "x-support-token": "other-tournament-session" }))) },
    ]) {
      const response = await request(app)
        .post(`/api/tournaments/${tournamentId}/auth/change-visibility`)
        .set(headers)
        .send({ visibility: "public_online" });
      assert.equal(response.status, 403, response.text);
    }

    const login = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/organizer-login`)
      .send({ password: ORGANIZER_PASSWORD })
      .expect(200);
    await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/change-visibility`)
      .set({ "x-organizer-token": login.body.token as string })
      .send({ visibility: "public_online" })
      .expect(200);
  });

  test("upgrades a host-code-only legacy tournament exactly once and atomically", async () => {
    const hostCode = `legacy-${randomUUID()}`;
    const otherHostCode = `other-${randomUUID()}`;
    const tournamentId = await createLegacyTournament({ hostCode });
    await createLegacyTournament({ hostCode: otherHostCode });

    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set({ "x-host-code": hostCode })
      .send({ name: "Host must not mutate", seed: 1 })
      .expect(403);
    const wrong = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode: "wrong", organizerPassword: "new-organizer-password" });
    assert.equal(wrong.status, 403);
    assert.equal(wrong.body.code, "INVALID_CREDENTIALS");
    const other = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode: otherHostCode, organizerPassword: "new-organizer-password" });
    assert.equal(other.status, 403);
    assert.equal(other.body.code, "INVALID_CREDENTIALS");
    assert.deepEqual(other.body, wrong.body);
    const short = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode, organizerPassword: "abc" });
    assert.equal(short.status, 422);
    assert.equal(short.body.code, "ORGANIZER_PASSWORD_TOO_SHORT");

    const attempts = await Promise.all([
      request(app)
        .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
        .send({ hostCode, organizerPassword: "new-organizer-password" }),
      request(app)
        .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
        .send({ hostCode, organizerPassword: "new-organizer-password" }),
    ]);
    assert.deepEqual(
      attempts.map((response) => response.status).sort((left, right) => left - right),
      [200, 403],
    );
    const successful = attempts.find((response) => response.status === 200)!;
    assert.equal(typeof successful.body.token, "string");
    const stored = await database.pool.query<{
      host_code: string | null;
      organizer_password_hash: string | null;
    }>(
      "SELECT host_code, organizer_password_hash FROM tournaments WHERE id = $1",
      [tournamentId],
    );
    assert.equal(stored.rows[0].host_code, null);
    assert.ok(stored.rows[0].organizer_password_hash);

    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set({ "x-organizer-token": successful.body.token as string })
      .send({ name: "Managed after upgrade", seed: 1 })
      .expect(201);
    const reuse = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode, organizerPassword: "another-password" });
    assert.equal(reuse.status, 403);
    assert.equal(reuse.body.code, "INVALID_CREDENTIALS");

    const rollbackId = await createLegacyTournament({ hostCode: `rollback-${randomUUID()}` });
    await assert.rejects(
      upgradeLegacyOrganizerCredentials({
        tournamentId: rollbackId,
        hostCode: (await database.pool.query<{ host_code: string }>(
          "SELECT host_code FROM tournaments WHERE id = $1",
          [rollbackId],
        )).rows[0].host_code,
        organizerPassword: "rollback-password",
        testHooks: {
          afterCredentialsUpdated() {
            throw new Error("intentional legacy upgrade fault");
          },
        },
      }),
      /intentional legacy upgrade fault/,
    );
    const rolledBack = await database.pool.query<{
      host_code: string | null;
      organizer_password_hash: string | null;
    }>(
      "SELECT host_code, organizer_password_hash FROM tournaments WHERE id = $1",
      [rollbackId],
    );
    assert.ok(rolledBack.rows[0].host_code);
    assert.equal(rolledBack.rows[0].organizer_password_hash, null);
  });

  test("keeps no-credential legacy tournaments read-only until offline admin recovery", async () => {
    const tournamentId = await createLegacyTournament();
    const visible = await request(app).get(`/api/tournaments/${tournamentId}`);
    assert.equal(visible.status, 200);
    assert.equal(visible.body.hasHostCode, false);
    assert.equal(visible.body.hasOrganizerPassword, false);
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set({ "x-host-code": "invented" })
      .send({ name: "Cannot take over", seed: 1 })
      .expect(403);
    const publicUpgrade = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/upgrade-legacy-organizer`)
      .send({ hostCode: "invented", organizerPassword: "takeover-password" });
    assert.equal(publicUpgrade.status, 403);
    assert.equal(publicUpgrade.body.code, "INVALID_CREDENTIALS");

    const dryRun = await recoverLegacyOrganizerCredentials({
      tournamentId,
      organizerPassword: "recovered-organizer-password",
      dryRun: true,
    });
    assert.deepEqual(dryRun, { tournamentId, applied: false });
    const afterDryRun = await database.pool.query(
      "SELECT organizer_password_hash FROM tournaments WHERE id = $1",
      [tournamentId],
    );
    assert.equal(afterDryRun.rows[0].organizer_password_hash, null);

    await assert.rejects(
      recoverLegacyOrganizerCredentials({
        tournamentId,
        organizerPassword: "recovered-organizer-password",
        dryRun: false,
        testHooks: {
          afterCredentialsUpdated() {
            throw new Error("intentional admin recovery fault");
          },
        },
      }),
      /intentional admin recovery fault/,
    );
    const afterFault = await database.pool.query(
      "SELECT organizer_password_hash FROM tournaments WHERE id = $1",
      [tournamentId],
    );
    assert.equal(afterFault.rows[0].organizer_password_hash, null);

    const recovered = await recoverLegacyOrganizerCredentials({
      tournamentId,
      organizerPassword: "recovered-organizer-password",
      dryRun: false,
    });
    assert.deepEqual(recovered, { tournamentId, applied: true });
    await assert.rejects(
      recoverLegacyOrganizerCredentials({
        tournamentId,
        organizerPassword: "replacement-must-fail",
        dryRun: false,
      }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "LEGACY_CREDENTIALS_ALREADY_UPGRADED",
    );
    const login = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/organizer-login`)
      .send({ password: "recovered-organizer-password" });
    assert.equal(login.status, 200, login.text);
  });

  test("classifies and safely handles all four persisted credential states", async () => {
    const none = await createLegacyTournament();
    const hostOnly = await createLegacyTournament({ hostCode: `host-${randomUUID()}` });
    const passwordOnly = await createLegacyTournament({ organizerPassword: ORGANIZER_PASSWORD });
    const both = await createLegacyTournament({
      hostCode: `both-${randomUUID()}`,
      organizerPassword: ORGANIZER_PASSWORD,
    });
    const states = await database.pool.query<{
      id: number;
      host_code: string | null;
      organizer_password_hash: string | null;
    }>(
      `SELECT id, host_code, organizer_password_hash
       FROM tournaments WHERE id = ANY($1::int[]) ORDER BY id`,
      [[none, hostOnly, passwordOnly, both]],
    );
    const classification = states.rows.map((row) =>
      `${row.host_code ? "host" : "no-host"}:${row.organizer_password_hash ? "password" : "no-password"}`,
    );
    assert.deepEqual(classification.sort(), [
      "host:no-password",
      "host:password",
      "no-host:no-password",
      "no-host:password",
    ]);

    for (const id of [passwordOnly, both]) {
      const login = await request(app)
        .post(`/api/tournaments/${id}/auth/organizer-login`)
        .send({ password: ORGANIZER_PASSWORD });
      assert.equal(login.status, 200, login.text);
    }
    for (const id of [none, hostOnly]) {
      const login = await request(app)
        .post(`/api/tournaments/${id}/auth/organizer-login`)
        .send({ password: ORGANIZER_PASSWORD });
      assert.equal(login.status, 403, login.text);
      assert.equal(login.body.code, "INVALID_CREDENTIALS");
    }
  });

  test("enforces the anonymous/viewer/support/organizer mutation matrix and token scope", async () => {
    for (const actor of ["anonymous", "viewer", "support", "organizer"] as const) {
      const tournament = await createTournament();
      const headers = actor === "viewer"
        ? { "x-viewer-token": signViewerToken(tournament.id, 1) }
        : actor === "support"
          ? await supportHeaders(tournament.id)
          : actor === "organizer"
            ? organizerHeaders(tournament.id)
            : {};
      const response = await request(app)
        .post(`/api/tournaments/${tournament.id}/players`)
        .set(headers)
        .send({ name: `Actor ${actor}`, seed: 1 });
      assert.equal(response.status, actor === "support" || actor === "organizer" ? 201 : 403);
    }

    const first = await createTournament();
    const second = await createTournament();
    for (const badToken of [
      "",
      "a.b",
      "not-base64.not-a-signature",
      organizerTokens.get(first.id)!,
    ]) {
      const response = await request(app)
        .post(`/api/tournaments/${second.id}/players`)
        .set(badToken ? { "x-organizer-token": badToken } : {})
        .send({ name: `Denied ${randomUUID()}` });
      assert.equal(response.status, 403);
      assert.equal(response.type, "application/json");
    }
  });

  test("invalidates viewer tokens after password and visibility changes", async () => {
    const tournament = await createTournament({
      visibility: "private_online",
      viewerPassword: VIEWER_PASSWORD,
    });
    const login = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
      .send({ password: VIEWER_PASSWORD })
      .expect(200);
    const oldViewer = { "x-viewer-token": login.body.token as string };
    await request(app).get(`/api/tournaments/${tournament.id}`).set(oldViewer).expect(200);

    await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-viewer-password`)
      .set(organizerHeaders(tournament.id))
      .send({ newPassword: "new-viewer-password" })
      .expect(200);
    await request(app).get(`/api/tournaments/${tournament.id}`).set(oldViewer).expect(403);

    const newLogin = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
      .send({ password: "new-viewer-password" })
      .expect(200);
    const secondViewer = { "x-viewer-token": newLogin.body.token as string };
    const deleteWhilePrivate = await request(app)
      .delete(`/api/tournaments/${tournament.id}/auth/viewer-password`)
      .set(organizerHeaders(tournament.id));
    assert.equal(deleteWhilePrivate.status, 409);
    assert.equal(deleteWhilePrivate.body.code, "VIEWER_PASSWORD_REQUIRED");
    await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-visibility`)
      .set(organizerHeaders(tournament.id))
      .send({ visibility: "public_online" })
      .expect(200);
    await request(app)
      .delete(`/api/tournaments/${tournament.id}/auth/viewer-password`)
      .set(organizerHeaders(tournament.id))
      .expect(200);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-visibility`)
      .set(organizerHeaders(tournament.id))
      .send({ visibility: "private_online", viewerPassword: "third-viewer-password" })
      .expect(200);
    await request(app).get(`/api/tournaments/${tournament.id}`).set(secondViewer).expect(403);
  });

  test("serializes concurrent viewer password rotations and accepts only the final version", async () => {
    const tournament = await createTournament({
      visibility: "private_online",
      viewerPassword: VIEWER_PASSWORD,
    });
    const oldLogin = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
      .send({ password: VIEWER_PASSWORD })
      .expect(200);
    const oldToken = { "x-viewer-token": oldLogin.body.token as string };

    const responses = await Promise.all([
      request(app)
        .post(`/api/tournaments/${tournament.id}/auth/change-viewer-password`)
        .set(organizerHeaders(tournament.id))
        .send({ newPassword: "viewer-concurrent-a" }),
      request(app)
        .post(`/api/tournaments/${tournament.id}/auth/change-viewer-password`)
        .set(organizerHeaders(tournament.id))
        .send({ newPassword: "viewer-concurrent-b" }),
    ]);
    assert.deepEqual(responses.map((response) => response.status), [200, 200]);
    const version = await database.pool.query<{ viewer_password_version: number }>(
      "SELECT viewer_password_version FROM tournaments WHERE id = $1",
      [tournament.id],
    );
    assert.equal(version.rows[0].viewer_password_version, 3);
    await request(app).get(`/api/tournaments/${tournament.id}`).set(oldToken).expect(403);

    const candidateLogins = await Promise.all(
      ["viewer-concurrent-a", "viewer-concurrent-b"].map((password) =>
        request(app)
          .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
          .send({ password }),
      ),
    );
    assert.deepEqual(
      candidateLogins.map((response) => response.status).sort((left, right) => left - right),
      [200, 403],
    );
    const finalToken = candidateLogins.find((response) => response.status === 200)!.body.token as string;
    await request(app)
      .get(`/api/tournaments/${tournament.id}`)
      .set({ "x-viewer-token": finalToken })
      .expect(200);
  });

  test("invalidates viewer tokens issued before and between sequential rotations", async () => {
    const tournament = await createTournament({
      visibility: "private_online",
      viewerPassword: VIEWER_PASSWORD,
    });
    const before = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
      .send({ password: VIEWER_PASSWORD })
      .expect(200);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-viewer-password`)
      .set(organizerHeaders(tournament.id))
      .send({ newPassword: "viewer-between" })
      .expect(200);
    const between = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
      .send({ password: "viewer-between" })
      .expect(200);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-viewer-password`)
      .set(organizerHeaders(tournament.id))
      .send({ newPassword: "viewer-final" })
      .expect(200);
    const after = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
      .send({ password: "viewer-final" })
      .expect(200);

    for (const token of [before.body.token, between.body.token]) {
      await request(app)
        .get(`/api/tournaments/${tournament.id}`)
        .set({ "x-viewer-token": token as string })
        .expect(403);
    }
    await request(app)
      .get(`/api/tournaments/${tournament.id}`)
      .set({ "x-viewer-token": after.body.token as string })
      .expect(200);
  });

  test("serializes visibility and viewer-password changes without losing a version", async () => {
    const tournament = await createTournament({
      visibility: "private_online",
      viewerPassword: VIEWER_PASSWORD,
    });
    const oldLogin = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
      .send({ password: VIEWER_PASSWORD })
      .expect(200);
    const responses = await Promise.all([
      request(app)
        .post(`/api/tournaments/${tournament.id}/auth/change-viewer-password`)
        .set(organizerHeaders(tournament.id))
        .send({ newPassword: "viewer-password-race" }),
      request(app)
        .post(`/api/tournaments/${tournament.id}/auth/change-visibility`)
        .set(organizerHeaders(tournament.id))
        .send({
          visibility: "private_online",
          viewerPassword: "viewer-visibility-race",
        }),
    ]);
    assert.deepEqual(responses.map((response) => response.status), [200, 200]);
    const version = await database.pool.query<{
      viewer_password_version: number;
      visibility: string;
    }>(
      "SELECT viewer_password_version, visibility FROM tournaments WHERE id = $1",
      [tournament.id],
    );
    assert.deepEqual(version.rows[0], {
      viewer_password_version: 3,
      visibility: "private_online",
    });
    await request(app)
      .get(`/api/tournaments/${tournament.id}`)
      .set({ "x-viewer-token": oldLogin.body.token as string })
      .expect(403);
    const candidateLogins = await Promise.all(
      ["viewer-password-race", "viewer-visibility-race"].map((password) =>
        request(app)
          .post(`/api/tournaments/${tournament.id}/auth/viewer-login`)
          .send({ password }),
      ),
    );
    assert.deepEqual(
      candidateLogins.map((response) => response.status).sort((left, right) => left - right),
      [200, 403],
    );
  });

  test("serializes support password rotations and invalidates every older session", async () => {
    const tournament = await createTournament();
    const oldSupport = await supportHeaders(tournament.id);
    const responses = await Promise.all([
      request(app)
        .post(`/api/tournaments/${tournament.id}/auth/change-support-password`)
        .set(organizerHeaders(tournament.id))
        .send({ newPassword: "support-concurrent-a" }),
      request(app)
        .post(`/api/tournaments/${tournament.id}/auth/change-support-password`)
        .set(organizerHeaders(tournament.id))
        .send({ newPassword: "support-concurrent-b" }),
    ]);
    assert.deepEqual(responses.map((response) => response.status), [200, 200]);
    const version = await database.pool.query<{ support_password_version: number }>(
      "SELECT support_password_version FROM tournaments WHERE id = $1",
      [tournament.id],
    );
    assert.equal(version.rows[0].support_password_version, 3);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/players`)
      .set(oldSupport)
      .send({ name: "Old support denied", seed: 1 })
      .expect(403);

    const candidateLogins = await Promise.all(
      ["support-concurrent-a", "support-concurrent-b"].map((password) =>
        request(app)
          .post(`/api/tournaments/${tournament.id}/auth/support-login`)
          .send({ password, nick: `Candidate ${password}` }),
      ),
    );
    assert.deepEqual(
      candidateLogins.map((response) => response.status).sort((left, right) => left - right),
      [200, 403],
    );
    const finalSession = candidateLogins.find((response) => response.status === 200)!.body.sessionToken as string;
    await request(app)
      .post(`/api/tournaments/${tournament.id}/players`)
      .set({ "x-support-token": finalSession })
      .send({ name: "Final support accepted", seed: 1 })
      .expect(201);
  });

  test("revalidates an in-flight support session after the tournament lock", async () => {
    const rosterTournament = await createTournament();
    const rosterSupport = await supportHeaders(rosterTournament.id);
    await runSupportRevocationRace({
      tournamentId: rosterTournament.id,
      support: rosterSupport,
      mutate: () => request(app)
        .post(`/api/tournaments/${rosterTournament.id}/players`)
        .set(rosterSupport)
        .send({ name: "Revoked roster write", seed: 1 })
        .then((response) => response),
    });
    assert.deepEqual(await rosterNames(rosterTournament.id), []);

    const startTournament = await createTournament();
    await addPlayer(startTournament.id, "Start one", 1);
    await addPlayer(startTournament.id, "Start two", 2);
    const startSupport = await supportHeaders(startTournament.id);
    await runSupportRevocationRace({
      tournamentId: startTournament.id,
      support: startSupport,
      mutate: () => request(app)
        .post(`/api/tournaments/${startTournament.id}/start`)
        .set(startSupport)
        .then((response) => response),
    });
    const startState = await database.pool.query<{
      status: string;
      matches: number;
    }>(
      `SELECT status,
         (SELECT count(*)::int FROM matches WHERE tournament_id = tournaments.id) AS matches
       FROM tournaments WHERE id = $1`,
      [startTournament.id],
    );
    assert.deepEqual(startState.rows[0], { status: "draft", matches: 0 });

    const completeTournament = await createTournament();
    await addPlayer(completeTournament.id, "Complete one", 1);
    await addPlayer(completeTournament.id, "Complete two", 2);
    await request(app)
      .post(`/api/tournaments/${completeTournament.id}/start`)
      .set(organizerHeaders(completeTournament.id))
      .expect(200);
    const completeMatch = await database.pool.query<{ id: number }>(
      "SELECT id FROM matches WHERE tournament_id = $1 ORDER BY id LIMIT 1",
      [completeTournament.id],
    );
    const completeSupport = await supportHeaders(completeTournament.id);
    await runSupportRevocationRace({
      tournamentId: completeTournament.id,
      support: completeSupport,
      mutate: () => request(app)
        .post(`/api/matches/${completeMatch.rows[0].id}/complete`)
        .set(completeSupport)
        .send({ resultType: "played", score1: 1, score2: 0 })
        .then((response) => response),
    });
    const afterComplete = await database.pool.query<{ status: string }>(
      "SELECT status FROM matches WHERE id = $1",
      [completeMatch.rows[0].id],
    );
    assert.equal(afterComplete.rows[0].status, "pending");

    const revertTournament = await createTournament();
    await addPlayer(revertTournament.id, "Revert one", 1);
    await addPlayer(revertTournament.id, "Revert two", 2);
    await request(app)
      .post(`/api/tournaments/${revertTournament.id}/start`)
      .set(organizerHeaders(revertTournament.id))
      .expect(200);
    const revertMatchRow = await database.pool.query<{ id: number }>(
      "SELECT id FROM matches WHERE tournament_id = $1 ORDER BY id LIMIT 1",
      [revertTournament.id],
    );
    await request(app)
      .post(`/api/matches/${revertMatchRow.rows[0].id}/complete`)
      .set(organizerHeaders(revertTournament.id))
      .send({ resultType: "played", score1: 1, score2: 0 })
      .expect(200);
    const revertSupport = await supportHeaders(revertTournament.id);
    await runSupportRevocationRace({
      tournamentId: revertTournament.id,
      support: revertSupport,
      mutate: () => request(app)
        .post(`/api/matches/${revertMatchRow.rows[0].id}/revert`)
        .set(revertSupport)
        .then((response) => response),
    });
    const afterRevert = await database.pool.query<{ status: string }>(
      "SELECT status FROM matches WHERE id = $1",
      [revertMatchRow.rows[0].id],
    );
    assert.equal(afterRevert.rows[0].status, "completed");
  });

  test("credential mutation remains successful when best-effort audit persistence fails", async () => {
    const tournament = await createTournament();
    await database.pool.query(`
      CREATE FUNCTION security_test_fail_auth_audit() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'intentional audit persistence failure';
      END;
      $$;
      CREATE TRIGGER security_test_fail_auth_audit
      BEFORE INSERT ON auth_audit_log
      FOR EACH ROW EXECUTE FUNCTION security_test_fail_auth_audit();
    `);
    try {
      const changed = await request(app)
        .post(`/api/tournaments/${tournament.id}/auth/change-support-password`)
        .set(organizerHeaders(tournament.id))
        .send({ newPassword: "support-after-audit-failure" });
      assert.equal(changed.status, 200, changed.text);
      await request(app)
        .post(`/api/tournaments/${tournament.id}/auth/support-login`)
        .send({ password: SUPPORT_PASSWORD, nick: "Old credential" })
        .expect(403);
      await request(app)
        .post(`/api/tournaments/${tournament.id}/auth/support-login`)
        .send({
          password: "support-after-audit-failure",
          nick: "New credential",
        })
        .expect(200);
    } finally {
      await database.pool.query(
        "DROP TRIGGER security_test_fail_auth_audit ON auth_audit_log",
      );
      await database.pool.query(
        "DROP FUNCTION security_test_fail_auth_audit()",
      );
    }
  });

  test("locks add, edit, delete and CSV import after tournament start", async () => {
    const tournament = await createTournament();
    const first = await addPlayer(tournament.id, "Locked one", 1);
    await addPlayer(tournament.id, "Locked two", 2);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/start`)
      .set(organizerHeaders(tournament.id))
      .expect(200);

    const operations = [
      request(app)
        .post(`/api/tournaments/${tournament.id}/players`)
        .set(organizerHeaders(tournament.id))
        .send({ name: "Too late" }),
      request(app)
        .patch(`/api/players/${first.id}`)
        .set(organizerHeaders(tournament.id))
        .send({ name: "Changed too late" }),
      request(app)
        .delete(`/api/players/${first.id}`)
        .set(organizerHeaders(tournament.id)),
      request(app)
        .post(`/api/tournaments/${tournament.id}/players/import`)
        .set(organizerHeaders(tournament.id))
        .send({ mode: "replace", csv: "name,seed\nReplacement,1" }),
    ];
    for (const operation of operations) {
      const response = await operation;
      assert.equal(response.status, 409, response.text);
      assert.equal(response.body.code, "ROSTER_LOCKED");
    }
    const undoRosterChange = await request(app)
      .post(`/api/tournaments/${tournament.id}/undo-last`)
      .set(organizerHeaders(tournament.id));
    assert.equal(undoRosterChange.status, 409, undoRosterChange.text);
    assert.equal(undoRosterChange.body.code, "ROSTER_LOCKED");
    const roster = await database.pool.query(
      "SELECT count(*)::int AS count FROM players WHERE tournament_id = $1",
      [tournament.id],
    );
    assert.equal(roster.rows[0].count, 2);
  });

  test("keeps security configuration organizer-only while support remains operational", async () => {
    const tournament = await createTournament();
    const support = await supportHeaders(tournament.id);
    const deniedHostCode = await request(app)
      .patch(`/api/tournaments/${tournament.id}`)
      .set(support)
      .send({ hostCode: "support-must-not-set-this" });
    assert.equal(deniedHostCode.status, 403);
    const deniedVisibility = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-visibility`)
      .set(support)
      .send({ visibility: "private_online", viewerPassword: VIEWER_PASSWORD });
    assert.equal(deniedVisibility.status, 403);
    const organizerVisibility = await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-visibility`)
      .set(organizerHeaders(tournament.id))
      .send({ visibility: "private_online", viewerPassword: VIEWER_PASSWORD });
    assert.equal(organizerVisibility.status, 200, organizerVisibility.text);
  });

  test("touches support lastActiveAt only after a valid support operation", async () => {
    const tournament = await createTournament();
    const support = await supportHeaders(tournament.id);
    const sessionToken = support["x-support-token"];
    const oldActivity = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await database.pool.query(
      "UPDATE support_sessions SET last_active_at = $1 WHERE session_token = $2",
      [oldActivity, sessionToken],
    );
    const before = await database.pool.query<{
      created_at: Date;
      last_active_at: Date;
    }>(
      "SELECT created_at, last_active_at FROM support_sessions WHERE session_token = $1",
      [sessionToken],
    );
    await request(app)
      .post(`/api/tournaments/${tournament.id}/players`)
      .set(support)
      .send({ name: "Support activity", seed: 1 })
      .expect(201);
    const afterValid = await database.pool.query<{
      created_at: Date;
      last_active_at: Date;
    }>(
      "SELECT created_at, last_active_at FROM support_sessions WHERE session_token = $1",
      [sessionToken],
    );
    assert.equal(
      new Date(afterValid.rows[0].created_at).getTime(),
      new Date(before.rows[0].created_at).getTime(),
    );
    assert.ok(
      new Date(afterValid.rows[0].last_active_at).getTime() >
        new Date(before.rows[0].last_active_at).getTime(),
    );

    await database.pool.query(
      "UPDATE support_sessions SET last_active_at = $1 WHERE session_token = $2",
      [oldActivity, sessionToken],
    );
    await request(app)
      .post(`/api/tournaments/${tournament.id}/players`)
      .set({ "x-support-token": "invalid-session" })
      .send({ name: "Invalid support", seed: 2 })
      .expect(403);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/auth/change-visibility`)
      .set(support)
      .send({ visibility: "private_online", viewerPassword: VIEWER_PASSWORD })
      .expect(403);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/players`)
      .set(organizerHeaders(tournament.id))
      .send({ name: "Organizer activity", seed: 2 })
      .expect(201);
    await request(app)
      .get(`/api/tournaments/${tournament.id}`)
      .set({ "x-viewer-token": signViewerToken(tournament.id, 1) })
      .expect(200);
    const afterOthers = await database.pool.query<{ last_active_at: Date }>(
      "SELECT last_active_at FROM support_sessions WHERE session_token = $1",
      [sessionToken],
    );
    assert.equal(
      new Date(afterOthers.rows[0].last_active_at).getTime(),
      oldActivity.getTime(),
    );
  });

  test("rolls back a replace import fault after deleting the old roster", async () => {
    const tournament = await createTournament();
    await addPlayer(tournament.id, "Original one", 1);
    await addPlayer(tournament.id, "Original two", 2);
    const beforePlayers = await database.pool.query(
      "SELECT name, seed FROM players WHERE tournament_id = $1 ORDER BY seed",
      [tournament.id],
    );
    const beforeLog = await database.pool.query(
      "SELECT count(*)::int AS count FROM action_log WHERE tournament_id = $1",
      [tournament.id],
    );

    await assert.rejects(
      importTournamentPlayers({
        tournamentId: tournament.id,
        mode: "replace",
        csv: "name,seed\nReplacement one,1\nReplacement two,2",
        testHooks: {
          afterExistingPlayersDeleted() {
            throw new Error("intentional replace failure");
          },
        },
      }),
      /intentional replace failure/,
    );

    const afterPlayers = await database.pool.query(
      "SELECT name, seed FROM players WHERE tournament_id = $1 ORDER BY seed",
      [tournament.id],
    );
    const afterLog = await database.pool.query(
      "SELECT count(*)::int AS count FROM action_log WHERE tournament_id = $1",
      [tournament.id],
    );
    assert.deepEqual(afterPlayers.rows, beforePlayers.rows);
    assert.deepEqual(afterLog.rows, beforeLog.rows);
  });

  test("never clears a roster for an invalid or empty replace CSV", async () => {
    const tournament = await createTournament({ maxPlayers: 2 });
    await addPlayer(tournament.id, "Original one", 1);
    await addPlayer(tournament.id, "Original two", 2);
    const original = await rosterNames(tournament.id);
    const cases = [
      {
        csv: "seed,team\n1,A",
        code: "CSV_INVALID_HEADER",
      },
      {
        csv: "name,seed\n\n   \n",
        code: "CSV_NO_VALID_PLAYERS",
      },
      {
        csv: "name,seed\n,1\n,2",
        code: "CSV_NO_VALID_PLAYERS",
      },
      {
        csv: "name,seed\nDuplicate,1\nDuplicate,2",
        code: "CSV_DUPLICATE_PLAYERS",
      },
      {
        csv: "name,seed\nOne,1\nTwo,2\nThree,3",
        code: "CSV_PLAYER_LIMIT_EXCEEDED",
      },
    ];
    for (const item of cases) {
      const response = await request(app)
        .post(`/api/tournaments/${tournament.id}/players/import`)
        .set(organizerHeaders(tournament.id))
        .send({ mode: "replace", csv: item.csv });
      assert.equal(response.status, 422, response.text);
      assert.equal(response.body.code, item.code);
      assert.deepEqual(await rosterNames(tournament.id), original);
    }
  });

  test("reports an explicit partial CSV import instead of hiding skipped rows", async () => {
    const tournament = await createTournament({ maxPlayers: 4 });
    const response = await request(app)
      .post(`/api/tournaments/${tournament.id}/players/import`)
      .set(organizerHeaders(tournament.id))
      .send({
        mode: "append",
        csv: "name,seed\nAccepted,1\nInvalid seed,not-a-seed",
      });
    assert.equal(response.status, 200, response.text);
    assert.equal(response.body.imported, 1);
    assert.equal(response.body.skipped, 1);
    assert.equal(response.body.totalCsvDataRows, 2);
    assert.equal(response.body.writePerformed, true);
    assert.equal(Array.isArray(response.body.errors), true);
    assert.match(response.body.errors[0].reason, /seed|rozstawienie/i);
    assert.deepEqual(await rosterNames(tournament.id), ["Accepted"]);
  });

  test("serializes concurrent replace imports without leaving a mixed roster", async () => {
    const tournament = await createTournament();
    await addPlayer(tournament.id, "Before one", 1);
    await addPlayer(tournament.id, "Before two", 2);
    let releaseFirst!: () => void;
    let firstDeleted!: () => void;
    const firstReachedDelete = new Promise<void>((resolve) => {
      firstDeleted = resolve;
    });
    const release = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = importTournamentPlayers({
      tournamentId: tournament.id,
      mode: "replace",
      csv: "name,seed\nFirst one,1\nFirst two,2",
      testHooks: {
        async afterExistingPlayersDeleted() {
          firstDeleted();
          await release;
        },
      },
    });
    await firstReachedDelete;
    const second = importTournamentPlayers({
      tournamentId: tournament.id,
      mode: "replace",
      csv: "name,seed\nSecond one,1\nSecond two,2",
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    releaseFirst();
    const [firstResult, secondResult] = await Promise.all([first, second]);
    assert.equal(firstResult.imported, 2);
    assert.equal(secondResult.imported, 2);
    assert.deepEqual(await rosterNames(tournament.id), ["Second one", "Second two"]);
  });

  test("undoes a draft roster action atomically and only once", async () => {
    const tournament = await createTournament();
    await addPlayer(tournament.id, "Undo draft player", 1);
    const undone = await request(app)
      .post(`/api/tournaments/${tournament.id}/undo-last`)
      .set(organizerHeaders(tournament.id));
    assert.equal(undone.status, 200, undone.text);
    const roster = await database.pool.query(
      "SELECT count(*)::int AS count FROM players WHERE tournament_id = $1",
      [tournament.id],
    );
    assert.equal(roster.rows[0].count, 0);
    await request(app)
      .post(`/api/tournaments/${tournament.id}/undo-last`)
      .set(organizerHeaders(tournament.id))
      .expect(404);
  });

  test("serializes a replace import against tournament start", async () => {
    const tournament = await createTournament();
    await addPlayer(tournament.id, "Before one", 1);
    await addPlayer(tournament.id, "Before two", 2);
    let releaseImport!: () => void;
    let importLocked!: () => void;
    const locked = new Promise<void>((resolve) => { importLocked = resolve; });
    const release = new Promise<void>((resolve) => { releaseImport = resolve; });
    const importPromise = importTournamentPlayers({
      tournamentId: tournament.id,
      mode: "replace",
      csv: "name,seed\nAfter one,1\nAfter two,2",
      testHooks: {
        async afterExistingPlayersDeleted() {
          importLocked();
          await release;
        },
      },
    });
    await locked;
    const startPromise = request(app)
      .post(`/api/tournaments/${tournament.id}/start`)
      .set(organizerHeaders(tournament.id))
      .then((response) => response);
    await new Promise((resolve) => setTimeout(resolve, 30));
    releaseImport();
    const [imported, started] = await Promise.all([importPromise, startPromise]);
    assert.equal(imported.imported, 2);
    assert.equal(started.status, 200, started.text);
    const state = await database.pool.query(
      `SELECT
         (SELECT count(*)::int FROM players WHERE tournament_id = $1) AS players,
         (SELECT count(*)::int FROM matches WHERE tournament_id = $1) AS matches,
         (SELECT status FROM tournaments WHERE id = $1) AS status`,
      [tournament.id],
    );
    assert.deepEqual(state.rows[0], { players: 2, matches: 1, status: "active" });
  });

  test("restores a standalone V3 backup with new scoped credentials and no source dependency", async () => {
    const source = await createTournament();
    await addPlayer(source.id, "Backup one", 1);
    await addPlayer(source.id, "Backup two", 2);
    const exported = await request(app)
      .get(`/api/tournaments/${source.id}/export`)
      .set(organizerHeaders(source.id))
      .expect(200);
    await database.pool.query("DELETE FROM tournaments WHERE id = $1", [source.id]);
    const restored = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: exported.body,
        organizerPassword: "restored-organizer-password",
      });
    assert.equal(restored.status, 201, restored.text);
    assert.equal(typeof restored.body.organizerToken, "string");
    await request(app)
      .post(`/api/tournaments/${restored.body.tournament.id}/auth/organizer-login`)
      .send({ password: "restored-organizer-password" })
      .expect(200);
    await request(app)
      .post(`/api/tournaments/${restored.body.tournament.id}/players`)
      .set({ "x-organizer-token": restored.body.organizerToken })
      .send({ name: "Managed after restore", seed: 3 })
      .expect(201);
  });

  test("restores standalone V2 and private-online backups with newly supplied credentials", async () => {
    const publicRestore = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: minimalBackupV2(),
        organizerPassword: "restored-v2-organizer",
      });
    assert.equal(publicRestore.status, 201, publicRestore.text);
    const publicId = publicRestore.body.tournament.id as number;
    await request(app)
      .post(`/api/tournaments/${publicId}/auth/organizer-login`)
      .send({ password: "restored-v2-organizer" })
      .expect(200);

    const privateRestore = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: minimalBackupV2("private_online"),
        organizerPassword: "restored-private-organizer",
        viewerPassword: "restored-private-viewer",
        supportPassword: "restored-private-support",
      });
    assert.equal(privateRestore.status, 201, privateRestore.text);
    const privateId = privateRestore.body.tournament.id as number;
    const unauthenticated = await request(app).get(`/api/tournaments/${privateId}`);
    assert.equal(unauthenticated.status, 403);
    const viewerLogin = await request(app)
      .post(`/api/tournaments/${privateId}/auth/viewer-login`)
      .send({ password: "restored-private-viewer" })
      .expect(200);
    await request(app)
      .get(`/api/tournaments/${privateId}`)
      .set({ "x-viewer-token": viewerLogin.body.token as string })
      .expect(200);
    await request(app)
      .post(`/api/tournaments/${privateId}/auth/support-login`)
      .send({ password: "restored-private-support", nick: "Restored support" })
      .expect(200);
  });

  test("rejects short restore credentials and reports every missing private credential", async () => {
    const privateBackup = minimalBackupV2("private_online");
    const missingBoth = await request(app)
      .post("/api/tournaments/import")
      .send({ backup: privateBackup });
    assert.equal(missingBoth.status, 422);
    assert.equal(missingBoth.body.code, "ORGANIZER_PASSWORD_REQUIRED");
    assert.deepEqual(missingBoth.body.missingFields, [
      "organizerPassword",
      "viewerPassword",
    ]);
    const shortOrganizer = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: privateBackup,
        organizerPassword: "abc",
        viewerPassword: "valid-viewer",
      });
    assert.equal(shortOrganizer.status, 422);
    assert.equal(shortOrganizer.body.code, "ORGANIZER_PASSWORD_REQUIRED");
    const shortViewer = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: privateBackup,
        organizerPassword: "valid-organizer",
        viewerPassword: "abc",
      });
    assert.equal(shortViewer.status, 422);
    assert.equal(shortViewer.body.code, "VIEWER_PASSWORD_REQUIRED");
  });

  test("rolls back an invalid or failed restore without partial tournament data", async () => {
    const before = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    const invalidBackup = minimalBackupV2();
    invalidBackup.tournament.defaultBestOf = 2;
    const invalid = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: invalidBackup,
        organizerPassword: "valid-organizer",
      });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.code, "INVALID_BACKUP_V2");
    const afterInvalid = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    assert.equal(afterInvalid.rows[0].count, before.rows[0].count);

    await database.pool.query(`
      CREATE FUNCTION security_test_fail_backup_player_insert() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.name = 'Restore write failure' THEN
          RAISE EXCEPTION 'sensitive restore write detail';
        END IF;
        RETURN NEW;
      END;
      $$;
      CREATE TRIGGER security_test_fail_backup_player_insert
      BEFORE INSERT ON players
      FOR EACH ROW EXECUTE FUNCTION security_test_fail_backup_player_insert();
    `);
    try {
      const writeFailure = minimalBackupV2();
      writeFailure.players.push({
        backupId: 1,
        name: "Restore write failure",
        rank: null,
        country: null,
        teamName: null,
        seed: 1,
        status: "active",
      });
      const failed = await request(app)
        .post("/api/tournaments/import")
        .send({
          backup: writeFailure,
          organizerPassword: "valid-organizer",
        });
      assert.equal(failed.status, 400);
      assert.equal(failed.body.code, "BACKUP_IMPORT_ROLLED_BACK");
      assert.equal(JSON.stringify(failed.body).includes("sensitive restore write detail"), false);
    } finally {
      await database.pool.query(
        "DROP TRIGGER security_test_fail_backup_player_insert ON players",
      );
      await database.pool.query(
        "DROP FUNCTION security_test_fail_backup_player_insert()",
      );
    }
    const afterFailure = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    assert.equal(afterFailure.rows[0].count, before.rows[0].count);
  });

  test("exports no credentials and scopes every restored organizer token", async () => {
    const source = await createTournament({
      visibility: "private_online",
      viewerPassword: VIEWER_PASSWORD,
    });
    const exported = await request(app)
      .get(`/api/tournaments/${source.id}/export`)
      .set(organizerHeaders(source.id))
      .expect(200);
    const serialized = JSON.stringify(exported.body);
    for (const forbidden of [
      ORGANIZER_PASSWORD,
      SUPPORT_PASSWORD,
      VIEWER_PASSWORD,
      "organizerPasswordHash",
      "viewerPasswordHash",
      "supportPasswordHash",
      "hostCode",
      "sessionToken",
      SESSION_SECRET,
    ]) {
      assert.equal(serialized.includes(forbidden), false, forbidden);
    }
    const restoredA = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: exported.body,
        organizerPassword: "restore-scope-a",
        viewerPassword: "restore-viewer-a",
      });
    assert.equal(restoredA.status, 201, restoredA.text);
    const restoredB = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: exported.body,
        organizerPassword: "restore-scope-b",
        viewerPassword: "restore-viewer-b",
      });
    assert.equal(restoredB.status, 201, restoredB.text);
    await request(app)
      .post(`/api/tournaments/${restoredB.body.tournament.id}/players`)
      .set({ "x-organizer-token": restoredA.body.organizerToken as string })
      .send({ name: "Cross-scope denied", seed: 1 })
      .expect(403);
    await request(app)
      .post(`/api/tournaments/${restoredA.body.tournament.id}/players`)
      .set({ "x-organizer-token": restoredA.body.organizerToken as string })
      .send({ name: "Own-scope accepted", seed: 1 })
      .expect(201);
  });

  test("requires new restore credentials and never accepts a bare legacy client body", async () => {
    const source = await createTournament();
    const exported = await request(app)
      .get(`/api/tournaments/${source.id}/export`)
      .set(organizerHeaders(source.id))
      .expect(200);
    const bare = await request(app).post("/api/tournaments/import").send(exported.body);
    assert.equal(bare.status, 422);
    assert.equal(bare.body.code, "ORGANIZER_PASSWORD_REQUIRED");
    assert.match(bare.headers["content-type"] ?? "", /application\/json/);

    exported.body.tournament.visibility = "private_online";
    const missingViewer = await request(app)
      .post("/api/tournaments/import")
      .send({ backup: exported.body, organizerPassword: "new-organizer-password" });
    assert.equal(missingViewer.status, 422);
    assert.equal(missingViewer.body.code, "VIEWER_PASSWORD_REQUIRED");
  });

  test("returns stable JSON errors for malformed, empty, invalid and domain-error requests", async () => {
    const malformed = await request(app)
      .post("/api/tournaments")
      .set("Content-Type", "application/json")
      .send('{"organizerPassword":"secret",');
    assert.equal(malformed.status, 400);
    assert.match(malformed.headers["content-type"] ?? "", /application\/json/);
    assert.equal(malformed.body.code, "INVALID_JSON");
    const malformedText = JSON.stringify(malformed.body);
    assert.equal(malformedText.includes("SyntaxError"), false);
    assert.equal(malformedText.includes("Unexpected"), false);
    assert.equal(malformedText.includes("stack"), false);
    assert.equal(malformedText.includes("secret"), false);

    const empty = await request(app)
      .post("/api/tournaments")
      .set("Content-Type", "application/json")
      .send("");
    assert.equal(empty.status, 400);
    assert.match(empty.headers["content-type"] ?? "", /application\/json/);

    const invalid = await request(app)
      .post("/api/tournaments")
      .send({
        organizerPassword: ORGANIZER_PASSWORD,
        name: "",
        format: "not-a-format",
      });
    assert.equal(invalid.status, 400);
    assert.match(invalid.headers["content-type"] ?? "", /application\/json/);

    const tournament = await createTournament();
    await addPlayer(tournament.id, "Domain duplicate", 1);
    const domain = await request(app)
      .post(`/api/tournaments/${tournament.id}/players`)
      .set(organizerHeaders(tournament.id))
      .send({ name: "Domain duplicate", seed: 2 });
    assert.equal(domain.status, 409);
    assert.equal(domain.body.code, "DUPLICATE_PLAYER_NAME");
    assert.match(domain.headers["content-type"] ?? "", /application\/json/);
  });

  test("returns redacted JSON for an unexpected database exception", async () => {
    const tournament = await createTournament();
    await database.pool.query(`
      CREATE FUNCTION security_test_fail_player_insert() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'sensitive test detail'; END; $$;
      CREATE TRIGGER security_test_fail_player_insert
      BEFORE INSERT ON players
      FOR EACH ROW EXECUTE FUNCTION security_test_fail_player_insert();
    `);
    try {
      const response = await request(app)
        .post(`/api/tournaments/${tournament.id}/players`)
        .set(organizerHeaders(tournament.id))
        .send({ name: "Will fail", seed: 1 });
      assert.equal(response.status, 500);
      assert.match(response.headers["content-type"] ?? "", /application\/json/);
      assert.equal(response.body.code, "INTERNAL_SERVER_ERROR");
      assert.equal(typeof response.body.requestId, "string");
      assert.equal(JSON.stringify(response.body).includes("sensitive test detail"), false);
      assert.equal(JSON.stringify(response.body).includes("stack"), false);
    } finally {
      await database.pool.query("DROP TRIGGER security_test_fail_player_insert ON players");
      await database.pool.query("DROP FUNCTION security_test_fail_player_insert()");
    }
  });
});
