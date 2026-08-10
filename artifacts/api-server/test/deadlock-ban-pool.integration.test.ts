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

type Headers = Record<string, string>;

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  playersTable: typeof import("@workspace/db").playersTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
}

const SESSION_SECRET = `deadlock-ban-pool-${randomUUID()}`;
const ORGANIZER_PASSWORD = "deadlock-bp-organizer";
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
const ORGANIZER_PASSWORD_HASH = "test-bp-hash";

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  schemaInitialized = true;
  signOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  }
  await database.pool.end();
});

interface DeadlockFixture {
  tournamentId: number;
  matchId: number;
  playerIds: [number, number];
  organizerHeaders: Headers;
}

async function createDeadlockTournament(
  banMode: "shared_pool" | "opponent_only",
  bansPerPlayer: number,
): Promise<DeadlockFixture> {
  const suffix = randomUUID();
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `Deadlock ban pool ${suffix}`,
      format: "single_elimination",
      status: "draft",
      visibility: "public_online",
      organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
      defaultBestOf: 3,
    })
    .returning();

  const players = await database.db
    .insert(database.playersTable)
    .values([
      { tournamentId: tournament.id, name: `Player 1 ${suffix}`, seed: 1 },
      { tournamentId: tournament.id, name: `Player 2 ${suffix}`, seed: 2 },
    ])
    .returning();

  const organizerHeaders: Headers = {
    "x-organizer-token": signOrganizerToken(tournament.id, ORGANIZER_PASSWORD_HASH),
  };

  // Set game config with banMode and bansPerPlayer
  await request(app)
    .patch(`/api/tournaments/${tournament.id}`)
    .set(organizerHeaders)
    .send({
      gameConfig: {
        gameId: "deadlock",
        configVersion: 1,
        config: { banMode, bansPerPlayer },
      },
    })
    .expect(200);

  // Start tournament
  await request(app)
    .post(`/api/tournaments/${tournament.id}/start`)
    .set(organizerHeaders)
    .expect(200);

  // Get the created match
  const matchesRes = await request(app)
    .get(`/api/tournaments/${tournament.id}/matches`)
    .set(organizerHeaders)
    .expect(200);

  const match = matchesRes.body.find(
    (m: { player1Id: number; player2Id: number }) =>
      m.player1Id === players[0].id && m.player2Id === players[1].id,
  ) ?? matchesRes.body[0];

  return {
    tournamentId: tournament.id,
    matchId: match.id,
    playerIds: [players[0].id, players[1].id],
    organizerHeaders,
  };
}

async function setBans(
  app: Express,
  playerId: number,
  heroIds: string[],
  headers: Headers,
): Promise<number> {
  const res = await request(app)
    .put(`/api/players/${playerId}/bans`)
    .set(headers)
    .send({ bannedHeroIds: heroIds });
  return res.status;
}

async function setPick(
  app: Express,
  matchId: number,
  gameNumber: number,
  player1HeroId: string | null,
  player2HeroId: string | null,
  headers: Headers,
): Promise<number> {
  const res = await request(app)
    .put(`/api/matches/${matchId}/game-picks/${gameNumber}`)
    .set(headers)
    .send({ player1HeroId, player2HeroId });
  return res.status;
}

// ---------------------------------------------------------------------------
// Ban-count enforcement tests
// ---------------------------------------------------------------------------

describe("Deadlock ban-count enforcement", () => {
  test("bansPerPlayer=2: 2 bans → 200, 3 bans → 422", async () => {
    const fixture = await createDeadlockTournament("shared_pool", 2);
    const [p1] = fixture.playerIds;

    const ok = await setBans(app, p1, ["haze", "infernus"], fixture.organizerHeaders);
    assert.equal(ok, 200, "2 bans should be accepted");

    const rejected = await setBans(app, p1, ["haze", "infernus", "abrams"], fixture.organizerHeaders);
    assert.equal(rejected, 422, "3 bans should be rejected when limit is 2");
  });

  test("bansPerPlayer=0: 1 ban → 422", async () => {
    const fixture = await createDeadlockTournament("shared_pool", 0);
    const [p1] = fixture.playerIds;

    const rejected = await setBans(app, p1, ["haze"], fixture.organizerHeaders);
    assert.equal(rejected, 422, "any ban should be rejected when bansPerPlayer=0");
  });

  test("bansPerPlayer=1: 1 ban → 200", async () => {
    const fixture = await createDeadlockTournament("shared_pool", 1);
    const [p1] = fixture.playerIds;

    const ok = await setBans(app, p1, ["haze"], fixture.organizerHeaders);
    assert.equal(ok, 200, "1 ban should be accepted when limit is 1");
  });
});

// ---------------------------------------------------------------------------
// Shared-pool mode tests
// ---------------------------------------------------------------------------

describe("Deadlock shared_pool ban mode", () => {
  let fixture: DeadlockFixture;

  before(async () => {
    fixture = await createDeadlockTournament("shared_pool", 5);
    const [p1, p2] = fixture.playerIds;
    // P1 bans haze; P2 bans abrams
    await setBans(app, p1, ["haze"], fixture.organizerHeaders);
    await setBans(app, p2, ["abrams"], fixture.organizerHeaders);
  });

  test("P1 bans haze; P1 picks haze → 422 (own ban blocks self in shared_pool)", async () => {
    const status = await setPick(app, fixture.matchId, 1, "haze", null, fixture.organizerHeaders);
    assert.equal(status, 422);
  });

  test("P1 bans haze; P2 picks haze → 422", async () => {
    const status = await setPick(app, fixture.matchId, 1, null, "haze", fixture.organizerHeaders);
    assert.equal(status, 422);
  });

  test("P2 bans abrams; P1 picks abrams → 422", async () => {
    const status = await setPick(app, fixture.matchId, 1, "abrams", null, fixture.organizerHeaders);
    assert.equal(status, 422);
  });

  test("P2 bans abrams; P2 picks abrams → 422 (own ban blocks self in shared_pool)", async () => {
    const status = await setPick(app, fixture.matchId, 1, null, "abrams", fixture.organizerHeaders);
    assert.equal(status, 422);
  });

  test("Both ban wraith (P1 bans wraith added to existing); P1 picks wraith → 422", async () => {
    const [p1] = fixture.playerIds;
    await setBans(app, p1, ["haze", "wraith"], fixture.organizerHeaders);
    const status = await setPick(app, fixture.matchId, 2, "wraith", null, fixture.organizerHeaders);
    assert.equal(status, 422);
    // restore
    await setBans(app, p1, ["haze"], fixture.organizerHeaders);
  });

  test("P1 picks infernus (not banned) → 200", async () => {
    const status = await setPick(app, fixture.matchId, 3, "infernus", null, fixture.organizerHeaders);
    assert.equal(status, 200);
  });
});

// ---------------------------------------------------------------------------
// Opponent-only mode tests
// ---------------------------------------------------------------------------

describe("Deadlock opponent_only ban mode", () => {
  let fixture: DeadlockFixture;

  before(async () => {
    fixture = await createDeadlockTournament("opponent_only", 5);
    const [p1, p2] = fixture.playerIds;
    // P1 bans haze; P2 bans abrams
    await setBans(app, p1, ["haze"], fixture.organizerHeaders);
    await setBans(app, p2, ["abrams"], fixture.organizerHeaders);
  });

  test("P1 bans haze; P1 picks haze → 200 (own ban does not block self)", async () => {
    const status = await setPick(app, fixture.matchId, 1, "haze", null, fixture.organizerHeaders);
    assert.equal(status, 200);
  });

  test("P1 bans haze; P2 picks haze → 422", async () => {
    const status = await setPick(app, fixture.matchId, 2, null, "haze", fixture.organizerHeaders);
    assert.equal(status, 422);
  });

  test("P2 bans abrams; P2 picks abrams → 200 (own ban does not block self)", async () => {
    const status = await setPick(app, fixture.matchId, 3, null, "abrams", fixture.organizerHeaders);
    assert.equal(status, 200);
  });

  test("P2 bans abrams; P1 picks abrams → 422", async () => {
    const status = await setPick(app, fixture.matchId, 4, "abrams", null, fixture.organizerHeaders);
    assert.equal(status, 422);
  });
});
