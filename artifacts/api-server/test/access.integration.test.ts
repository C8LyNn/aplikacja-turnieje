import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request, { type Response } from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

type Visibility = "public_online" | "private_online" | "private_offline";
type ActorName = "anonymous" | "viewer" | "support" | "organizer";
type Headers = Record<string, string>;

interface TournamentFixture {
  id: number;
  name: string;
  visibility: Visibility;
  matchId: number;
  actors: Record<ActorName, Headers>;
}

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  playersTable: typeof import("@workspace/db").playersTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
  actionLogTable: typeof import("@workspace/db").actionLogTable;
}

const PASSWORDS = {
  organizer: `test-organizer-${randomUUID()}`,
  support: `test-support-${randomUUID()}`,
  viewer: `test-viewer-${randomUUID()}`,
};
const SESSION_SECRET = `test-session-${randomUUID()}`;
const sensitiveValues = new Set<string>([...Object.values(PASSWORDS), SESSION_SECRET]);

let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let hashPassword: typeof import("../src/auth").hashPassword;
let signViewerToken: typeof import("../src/auth").signViewerToken;
let testSchemaInitialized = false;
const fixtures = new Map<Visibility, TournamentFixture>();

function headersFor(fixture: TournamentFixture, actor: ActorName): Headers {
  return fixture.actors[actor];
}

function assertNoSensitiveKeys(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.doesNotMatch(key, /password|hash|token|secret/i);
    assertNoSensitiveKeys(child);
  }
}

function assertSafeDeniedResponse(response: Response): void {
  assert.equal(response.status, 403);
  assert.match(response.headers["content-type"] ?? "", /application\/json/i);
  assert.equal(typeof response.body?.error, "string");
  assert.deepEqual(
    Object.keys(response.body).sort(),
    Object.keys(response.body).filter((key) => key === "error" || key === "code").sort(),
  );

  assertNoSensitiveKeys(response.body);
  const serialized = JSON.stringify(response.body);
  for (const sensitiveValue of sensitiveValues) {
    assert.equal(serialized.includes(sensitiveValue), false);
  }
}

async function loginActors(tournamentId: number, visibility: Visibility): Promise<Record<ActorName, Headers>> {
  const organizerLogin = await request(app)
    .post(`/api/tournaments/${tournamentId}/auth/organizer-login`)
    .send({ password: PASSWORDS.organizer })
    .expect(200);

  const supportLogin = await request(app)
    .post(`/api/tournaments/${tournamentId}/auth/support-login`)
    .send({ password: PASSWORDS.support, nick: "Test Support" })
    .expect(200);

  let viewerToken: string;
  if (visibility === "private_online") {
    const viewerLogin = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/viewer-login`)
      .send({ password: PASSWORDS.viewer })
      .expect(200);
    viewerToken = viewerLogin.body.token as string;
  } else {
    viewerToken = signViewerToken(tournamentId);
  }

  const actors: Record<ActorName, Headers> = {
    anonymous: {},
    viewer: { "x-viewer-token": viewerToken },
    support: { "x-support-token": supportLogin.body.sessionToken as string },
    organizer: { "x-organizer-token": organizerLogin.body.token as string },
  };
  for (const actorHeaders of Object.values(actors)) {
    for (const value of Object.values(actorHeaders)) sensitiveValues.add(value);
  }
  return actors;
}

async function createTournamentFixture(visibility: Visibility): Promise<TournamentFixture> {
  const organizerPasswordHash = await hashPassword(PASSWORDS.organizer);
  const supportPasswordHash = await hashPassword(PASSWORDS.support);
  const viewerPasswordHash = await hashPassword(PASSWORDS.viewer);
  const name = `Access ${visibility}`;

  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name,
      format: "single_elimination",
      status: "active",
      visibility,
      organizerPasswordHash,
      supportPasswordHash,
      viewerPasswordHash,
      currentRound: 1,
      totalRounds: 1,
    })
    .returning();

  const players = await database.db
    .insert(database.playersTable)
    .values([
      { tournamentId: tournament.id, name: `${name} Player 1`, seed: 1 },
      { tournamentId: tournament.id, name: `${name} Player 2`, seed: 2 },
    ])
    .returning();

  const [match] = await database.db
    .insert(database.matchesTable)
    .values({
      tournamentId: tournament.id,
      round: 1,
      matchNumber: 1,
      player1Id: players[0].id,
      player2Id: players[1].id,
      status: "completed",
      score1: 1,
      score2: 0,
      winnerId: players[0].id,
      resultType: "played",
      completedAt: new Date(),
    })
    .returning();

  await database.db.insert(database.actionLogTable).values({
    tournamentId: tournament.id,
    actionType: "fixture_created",
    description: "Integration access fixture",
    matchId: match.id,
  });

  return {
    id: tournament.id,
    name,
    visibility,
    matchId: match.id,
    actors: await loginActors(tournament.id, visibility),
  };
}

async function createSwissFixture(): Promise<TournamentFixture> {
  const organizerPasswordHash = await hashPassword(PASSWORDS.organizer);
  const supportPasswordHash = await hashPassword(PASSWORDS.support);
  const name = `Swiss access ${Date.now()} ${Math.random()}`;

  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name,
      format: "swiss",
      status: "active",
      visibility: "public_online",
      organizerPasswordHash,
      supportPasswordHash,
      currentRound: 1,
      totalRounds: 3,
      swissRounds: 3,
    })
    .returning();

  const players = await database.db
    .insert(database.playersTable)
    .values([1, 2, 3, 4].map((seed) => ({
      tournamentId: tournament.id,
      name: `${name} Player ${seed}`,
      seed,
    })))
    .returning();

  const matches = await database.db
    .insert(database.matchesTable)
    .values([
      {
        tournamentId: tournament.id,
        round: 1,
        matchNumber: 1,
        player1Id: players[0].id,
        player2Id: players[2].id,
        winnerId: players[0].id,
        score1: 1,
        score2: 0,
        resultType: "played" as const,
        status: "completed" as const,
        completedAt: new Date(),
      },
      {
        tournamentId: tournament.id,
        round: 1,
        matchNumber: 2,
        player1Id: players[1].id,
        player2Id: players[3].id,
        winnerId: players[1].id,
        score1: 1,
        score2: 0,
        resultType: "played" as const,
        status: "completed" as const,
        completedAt: new Date(),
      },
    ])
    .returning();

  return {
    id: tournament.id,
    name,
    visibility: "public_online",
    matchId: matches[0].id,
    actors: await loginActors(tournament.id, "public_online"),
  };
}

async function countRows(table: "matches" | "action_log", tournamentId: number): Promise<number> {
  const result = await database.pool.query(
    `SELECT COUNT(*)::int AS count FROM ${table} WHERE tournament_id = $1`,
    [tournamentId],
  );
  return (result.rows[0] as { count: number }).count;
}

async function snapshotSwiss(tournamentId: number) {
  const [tournamentResult, playersResult] = await Promise.all([
    database.pool.query("SELECT current_round FROM tournaments WHERE id = $1", [tournamentId]),
    database.pool.query(
      "SELECT id, seed, status FROM players WHERE tournament_id = $1 ORDER BY id",
      [tournamentId],
    ),
  ]);
  return {
    currentRound: (tournamentResult.rows[0] as { current_round: number }).current_round,
    matches: await countRows("matches", tournamentId),
    actionLog: await countRows("action_log", tournamentId),
    players: playersResult.rows,
  };
}

before(async () => {
  const validGuardEnv: NodeJS.ProcessEnv = {
    NODE_TEST_CONTEXT: process.env.NODE_TEST_CONTEXT ?? "integration-test",
    TEST_DATABASE_URL: "postgresql://tm_test@127.0.0.1:5432/tournament_manager_test",
    TEST_DATABASE_SCHEMA: "tm_test_access",
    TEST_DATABASE_RESET: "DROP_TM_TEST_SCHEMA",
  };
  assert.throws(
    () => getSafeTestDatabaseConfig({ ...validGuardEnv, TEST_DATABASE_URL: undefined }),
    /TEST_DATABASE_URL is required/,
  );
  assert.throws(
    () => getSafeTestDatabaseConfig({
      ...validGuardEnv,
      TEST_DATABASE_URL: "postgresql://tm_test@production.local:5432/tournament_manager_test",
    }),
    /must not contain 'prod'/,
  );
  assert.throws(
    () => getSafeTestDatabaseConfig({ ...validGuardEnv, TEST_DATABASE_SCHEMA: "public" }),
    /must match/,
  );
  assert.throws(
    () => getSafeTestDatabaseConfig({ ...validGuardEnv, TEST_DATABASE_RESET: "yes" }),
    /DROP_TM_TEST_SCHEMA/,
  );
  let unsafeQueryCalled = false;
  const unsafePool: TestPool = {
    query: async () => {
      unsafeQueryCalled = true;
      return { rows: [], rowCount: 0 };
    },
    end: async () => undefined,
  };
  await assert.rejects(() => resetTestSchema(unsafePool, "public"), /unsafe test schema/);
  assert.equal(unsafeQueryCalled, false);

  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;

  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  testSchemaInitialized = true;

  const auth = await import("../src/auth");
  hashPassword = auth.hashPassword;
  signViewerToken = auth.signViewerToken;
  app = (await import("../src/app")).default;

  for (const visibility of ["public_online", "private_online", "private_offline"] as const) {
    fixtures.set(visibility, await createTournamentFixture(visibility));
  }
});

after(async () => {
  if (!database || !testConfig) return;
  if (testSchemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  }
  await database.pool.end();
});

describe("tournament read access matrix", () => {
  const endpoints = [
    ["tournament detail", (fixture: TournamentFixture) => `/api/tournaments/${fixture.id}`],
    ["assistant", (fixture: TournamentFixture) => `/api/tournaments/${fixture.id}/assistant`],
    ["action log", (fixture: TournamentFixture) => `/api/tournaments/${fixture.id}/action-log`],
    ["single match", (fixture: TournamentFixture) => `/api/matches/${fixture.matchId}`],
  ] as const;

  const expectedAccess: Record<Visibility, Record<ActorName, boolean>> = {
    public_online: { anonymous: true, viewer: true, support: true, organizer: true },
    private_online: { anonymous: false, viewer: true, support: true, organizer: true },
    private_offline: { anonymous: false, viewer: false, support: true, organizer: true },
  };

  for (const [endpointName, endpoint] of endpoints) {
    for (const visibility of Object.keys(expectedAccess) as Visibility[]) {
      for (const actor of Object.keys(expectedAccess[visibility]) as ActorName[]) {
        test(`${endpointName}: ${visibility} / ${actor}`, async () => {
          const fixture = fixtures.get(visibility)!;
          const response = await request(app)
            .get(endpoint(fixture))
            .set(headersFor(fixture, actor));

          if (expectedAccess[visibility][actor]) {
            assert.equal(response.status, 200);
          } else {
            assertSafeDeniedResponse(response);
          }

          if (endpointName === "tournament detail" && visibility === "private_online" && actor === "anonymous") {
            const foreignFixture = fixtures.get("public_online")!;
            for (const foreignActor of ["viewer", "support", "organizer"] as const) {
              const crossTournamentResponse = await request(app)
                .get(endpoint(fixture))
                .set(headersFor(foreignFixture, foreignActor));
              assertSafeDeniedResponse(crossTournamentResponse);
            }
          }
        });
      }
    }
  }
});

describe("full export access", () => {
  for (const visibility of ["public_online", "private_online", "private_offline"] as const) {
    for (const actor of ["anonymous", "viewer", "support", "organizer"] as const) {
      test(`${visibility} / ${actor}`, async () => {
        const fixture = fixtures.get(visibility)!;
        const response = await request(app)
          .get(`/api/tournaments/${fixture.id}/export`)
          .set(headersFor(fixture, actor));

        if (actor === "organizer") {
          assert.equal(response.status, 200);
          assert.equal(response.body.schemaVersion, 2);
          assert.equal(response.body.resultModelVersion, "series_v1");
          assert.equal(response.body.rankingPolicy, "match_record_v1");
          assert.equal(response.body.tournament.name, fixture.name);
          assert.ok(Array.isArray(response.body.players));
          assert.ok(Array.isArray(response.body.matches));
          assert.ok(Array.isArray(response.body.resultHistory));
          assert.ok(Array.isArray(response.body.actionLog));
          assertNoSensitiveKeys(response.body);
        } else {
          assertSafeDeniedResponse(response);
        }
      });
    }
  }
});

describe("Swiss round generation access", () => {
  for (const actor of ["anonymous", "viewer"] as const) {
    test(`denies ${actor} without database side effects`, async () => {
      const fixture = await createSwissFixture();
      const beforeState = await snapshotSwiss(fixture.id);

      const response = await request(app)
        .post(`/api/tournaments/${fixture.id}/generate-round`)
        .set(headersFor(fixture, actor));

      assertSafeDeniedResponse(response);
      assert.deepEqual(await snapshotSwiss(fixture.id), beforeState);
    });
  }

  for (const actor of ["support", "organizer"] as const) {
    test(`allows ${actor}`, async () => {
      const fixture = await createSwissFixture();
      const beforeState = await snapshotSwiss(fixture.id);

      const response = await request(app)
        .post(`/api/tournaments/${fixture.id}/generate-round`)
        .set(headersFor(fixture, actor));

      assert.equal(response.status, 200);
      assert.equal(response.body.currentRound, 2);
      const afterState = await snapshotSwiss(fixture.id);
      assert.equal(afterState.currentRound, 2);
      assert.ok(afterState.matches > beforeState.matches);
    });
  }
});
