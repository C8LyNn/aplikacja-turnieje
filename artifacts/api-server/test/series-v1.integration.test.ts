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

type Format = "single_elimination" | "round_robin" | "swiss";
type Headers = Record<string, string>;

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  playersTable: typeof import("@workspace/db").playersTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
}

interface StartedFixture {
  tournamentId: number;
  playerIds: number[];
  organizerHeaders: Headers;
}

const SESSION_SECRET = `series-v1-integration-${randomUUID()}`;
const ORGANIZER_PASSWORD_HASH = "test-organizer-hash";
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

async function createStartedTournament(
  format: Format,
  playerCount: number,
  options: { bestOf?: number; swissRounds?: number } = {},
): Promise<StartedFixture> {
  const suffix = randomUUID();
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: `Series v1 ${format} ${suffix}`,
    format,
    status: "draft",
    visibility: "public_online",
    organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
    defaultBestOf: options.bestOf ?? 1,
    swissRounds: format === "swiss" ? (options.swissRounds ?? 3) : null,
  }).returning();
  const players = await database.db.insert(database.playersTable).values(
    Array.from({ length: playerCount }, (_, index) => ({
      tournamentId: tournament.id,
      name: `Player ${index + 1} ${suffix}`,
      seed: index + 1,
    })),
  ).returning();
  const organizerHeaders = {
    "x-organizer-token": signOrganizerToken(
      tournament.id,
      ORGANIZER_PASSWORD_HASH,
    ),
  };
  await request(app).post(`/api/tournaments/${tournament.id}/start`).set(organizerHeaders).expect(200);
  return { tournamentId: tournament.id, playerIds: players.map((player) => player.id), organizerHeaders };
}

async function rows<T = Record<string, unknown>>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

async function completePendingRound(
  fixture: StartedFixture,
  round: number,
): Promise<void> {
  const matches = await rows<{ id: number; status: string }>(
    "SELECT id, status FROM matches WHERE tournament_id = $1 AND round = $2 ORDER BY match_number",
    [fixture.tournamentId, round],
  );
  for (const match of matches.filter((candidate) => candidate.status === "pending")) {
    await request(app)
      .post(`/api/matches/${match.id}/complete`)
      .set(fixture.organizerHeaders)
      .send({ resultType: "played", score1: 1, score2: 0 })
      .expect(200);
  }
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  schemaInitialized = true;
  signOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  await database.pool.end();
});

describe("series_v1 tournament creation", () => {
  test("creates series_v1 with match-record ranking and no legacy fields", async () => {
    const response = await request(app).post("/api/tournaments").send({
      name: `Creation ${randomUUID()}`,
      organizerPassword: "integration-organizer-password",
      format: "single_elimination",
      defaultBestOf: 3,
    }).expect(201);
    assert.equal(response.body.resultModelVersion, "series_v1");
    assert.equal(response.body.rankingPolicy, "match_record_v1");
    assert.equal(response.body.defaultBestOf, 3);
    assert.equal("allowDraws" in response.body, false);
  });

  test("accepts standalone double elimination", async () => {
    const response = await request(app).post("/api/tournaments").send({
      name: `Standalone double elimination ${randomUUID()}`,
      organizerPassword: "integration-organizer-password",
      format: "double_elimination",
    }).expect(201);
    assert.equal(response.body.format, "double_elimination");
  });

  test("rejects standalone group stage with the stable rule code", async () => {
    const response = await request(app).post("/api/tournaments").send({
      name: `Standalone group stage ${randomUUID()}`,
      organizerPassword: "integration-organizer-password",
      format: "group_stage",
    }).expect(422);
    assert.equal(response.body.code, "STAGE_FORMAT_NOT_SUPPORTED");
  });

  test("accepts group stage through a valid multi-stage plan", async () => {
    const response = await request(app).post("/api/tournaments").send({
      name: `Multi-stage group stage ${randomUUID()}`,
      organizerPassword: "integration-organizer-password",
      format: "group_stage",
      stagePlan: {
        initialParticipantCount: 4,
        stages: [
          {
            key: "groups",
            position: 1,
            name: "Groups",
            format: "group_stage",
            participantCount: 4,
            bestOf: 1,
            groupCount: 2,
            participantsPerGroup: 2,
            qualifiersPerGroup: 1,
            entrySeedingMethod: "preserve",
            placementMethod: "snake",
            resultSeedingMethod: "rank_bands",
          },
          {
            key: "final",
            position: 2,
            name: "Final",
            format: "single_elimination",
            participantCount: 2,
            bestOf: 1,
            entrySeedingMethod: "preserve",
            placementMethod: "standard",
          },
        ],
      },
    }).expect(201);
    assert.equal(response.body.id > 0, true);
    const stages = await request(app)
      .get(`/api/tournaments/${response.body.id}/stages`)
      .expect(200);
    assert.deepEqual(
      stages.body.map((stage: { format: string }) => stage.format),
      ["group_stage", "single_elimination"],
    );
  });

  test("rejects an even defaultBestOf", async () => {
    const response = await request(app).post("/api/tournaments").send({
      name: "Invalid BO",
      organizerPassword: "integration-organizer-password",
      format: "round_robin",
      defaultBestOf: 4,
    }).expect(422);
    assert.equal(response.body.code, "INVALID_DEFAULT_BEST_OF");
  });

  test("enforces the optional organizer password contract on direct POST requests", async () => {
    for (const [label, organizerPassword] of [
      ["missing", undefined],
      ["empty", ""],
      ["eight", "12345678"],
      ["longer", "organizer-password-longer"],
    ] as const) {
      const response = await request(app).post("/api/tournaments").send({
        name: `Password ${label} ${randomUUID()}`,
        format: "single_elimination",
        ...(organizerPassword === undefined ? {} : { organizerPassword }),
      }).expect(201);
      assert.equal(response.body.hasOrganizerPassword, organizerPassword !== undefined && organizerPassword.length >= 8);
    }

    for (const length of [1, 7]) {
      const response = await request(app).post("/api/tournaments").send({
        name: `Rejected password ${length}`,
        format: "single_elimination",
        organizerPassword: "x".repeat(length),
      }).expect(400);
      assert.equal(response.body.code, "ORGANIZER_PASSWORD_TOO_SHORT");
      assert.equal(
        response.body.error,
        "Hasło organizatora musi być puste albo mieć co najmniej 8 znaków.",
      );
    }
  });
});

describe("round-robin API schedule and finalization", () => {
  for (const playerCount of [3, 4, 5, 6]) {
    test(`starts a conflict-free circle schedule for ${playerCount} players`, async () => {
      const fixture = await createStartedTournament("round_robin", playerCount);
      const matches = await rows<{ round: number; player1_id: number; player2_id: number }>(
        "SELECT round, player1_id, player2_id FROM matches WHERE tournament_id = $1 ORDER BY round, match_number",
        [fixture.tournamentId],
      );
      assert.equal(matches.length, playerCount * (playerCount - 1) / 2);
      const pairs = new Set<string>();
      const participantsByRound = new Map<number, Set<number>>();
      for (const match of matches) {
        const pair = [match.player1_id, match.player2_id].sort((a, b) => a - b).join(":");
        assert.equal(pairs.has(pair), false);
        pairs.add(pair);
        const participants = participantsByRound.get(match.round) ?? new Set<number>();
        assert.equal(participants.has(match.player1_id), false);
        assert.equal(participants.has(match.player2_id), false);
        participants.add(match.player1_id);
        participants.add(match.player2_id);
        participantsByRound.set(match.round, participants);
      }
      assert.equal(participantsByRound.size, playerCount % 2 === 0 ? playerCount - 1 : playerCount);
    });
  }

  test("finalizes with the same first place returned by standings", async () => {
    const fixture = await createStartedTournament("round_robin", 4);
    const roundRows = await rows<{ round: number }>(
      "SELECT DISTINCT round FROM matches WHERE tournament_id = $1 ORDER BY round",
      [fixture.tournamentId],
    );
    for (const entry of roundRows) await completePendingRound(fixture, entry.round);
    const standings = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`).expect(200);
    const [tournament] = await rows<{ status: string; winner_id: number }>(
      "SELECT status, winner_id FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    );
    assert.equal(tournament.status, "completed");
    assert.equal(tournament.winner_id, standings.body[0].playerId);
    assert.equal("points" in standings.body[0], false);
    assert.equal("draws" in standings.body[0], false);
  });

  test("API standings applies head-to-head before gameDiff for exactly two tied players", async () => {
    const suffix = randomUUID();
    const [tournament] = await database.db.insert(database.tournamentsTable).values({
      name: `RR head-to-head ${suffix}`,
      format: "round_robin",
      status: "active",
      visibility: "public_online",
      defaultBestOf: 3,
    }).returning();
    const players = await database.db.insert(database.playersTable).values(
      [1, 2, 3].map((seed) => ({ tournamentId: tournament.id, name: `H2H ${seed} ${suffix}`, seed })),
    ).returning();
    const completedAt = new Date();
    await database.db.insert(database.matchesTable).values([
      {
        tournamentId: tournament.id,
        round: 1,
        matchNumber: 1,
        player1Id: players[0].id,
        player2Id: players[2].id,
        winnerId: players[0].id,
        bestOf: 5,
        score1: 3,
        score2: 0,
        resultType: "played",
        status: "completed",
        completedAt,
      },
      {
        tournamentId: tournament.id,
        round: 2,
        matchNumber: 1,
        player1Id: players[0].id,
        player2Id: players[1].id,
        winnerId: players[1].id,
        bestOf: 3,
        score1: 1,
        score2: 2,
        resultType: "played",
        status: "completed",
        completedAt,
      },
    ]);

    const response = await request(app).get(`/api/tournaments/${tournament.id}/standings`).expect(200);
    assert.equal(response.body[0].playerId, players[1].id);
    assert.equal(response.body[1].playerId, players[0].id);
    assert.equal(response.body[0].matchWins, response.body[1].matchWins);
    assert.ok(response.body[0].gameDiff < response.body[1].gameDiff);
  });
});

describe("system bye policies", () => {
  test("single-elimination bye advances without affecting the match or game record", async () => {
    const fixture = await createStartedTournament("single_elimination", 3, { bestOf: 3 });
    const [bye] = await rows<{ winner_id: number }>(
      "SELECT winner_id FROM matches WHERE tournament_id = $1 AND result_type = 'bye'",
      [fixture.tournamentId],
    );
    assert.ok(bye?.winner_id);
    const [downstream] = await rows<{ player1_id: number | null; player2_id: number | null }>(
      "SELECT player1_id, player2_id FROM matches WHERE tournament_id = $1 AND round = 2",
      [fixture.tournamentId],
    );
    assert.ok(downstream.player1_id === bye.winner_id || downstream.player2_id === bye.winner_id);
    const standings = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`).expect(200);
    const record = standings.body.find((entry: any) => entry.playerId === bye.winner_id);
    assert.deepEqual(
      { matchesPlayed: record.matchesPlayed, matchWins: record.matchWins, gameWins: record.gameWins, gameDiff: record.gameDiff },
      { matchesPlayed: 0, matchWins: 0, gameWins: 0, gameDiff: 0 },
    );
  });
});

describe("Swiss generation policy", () => {
  test("serializes round generation, rotates bye and blocks postponed matches", async () => {
    const fixture = await createStartedTournament("swiss", 5, { swissRounds: 3 });
    const [roundOneBye] = await rows<{ winner_id: number }>(
      "SELECT winner_id FROM matches WHERE tournament_id = $1 AND round = 1 AND result_type = 'bye'",
      [fixture.tournamentId],
    );
    assert.ok(roundOneBye?.winner_id);
    const initialStandings = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`).expect(200);
    const byeRecord = initialStandings.body.find((entry: any) => entry.playerId === roundOneBye.winner_id);
    assert.deepEqual(
      { matchWins: byeRecord.matchWins, gameWins: byeRecord.gameWins, gameLosses: byeRecord.gameLosses, buchholz: byeRecord.buchholz },
      { matchWins: 1, gameWins: 0, gameLosses: 0, buchholz: 0 },
    );
    await completePendingRound(fixture, 1);

    const generated = await Promise.all([
      request(app).post(`/api/tournaments/${fixture.tournamentId}/generate-round`).set(fixture.organizerHeaders),
      request(app).post(`/api/tournaments/${fixture.tournamentId}/generate-round`).set(fixture.organizerHeaders),
    ]);
    assert.deepEqual(generated.map((response) => response.status).sort(), [200, 409]);
    const roundTwo = await rows<{ id: number; status: string; result_type: string | null; winner_id: number | null }>(
      "SELECT id, status, result_type, winner_id FROM matches WHERE tournament_id = $1 AND round = 2 ORDER BY match_number",
      [fixture.tournamentId],
    );
    assert.equal(roundTwo.length, 3);
    const roundTwoBye = roundTwo.find((match) => match.result_type === "bye");
    assert.ok(roundTwoBye?.winner_id);
    assert.notEqual(roundTwoBye.winner_id, roundOneBye.winner_id);

    const pending = roundTwo.filter((match) => match.status === "pending");
    await request(app)
      .patch(`/api/matches/${pending[0].id}`)
      .set(fixture.organizerHeaders)
      .send({ status: "postponed" })
      .expect(200);
    await request(app)
      .post(`/api/matches/${pending[1].id}/complete`)
      .set(fixture.organizerHeaders)
      .send({ resultType: "played", score1: 1, score2: 0 })
      .expect(200);
    const blocked = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/generate-round`)
      .set(fixture.organizerHeaders)
      .expect(409);
    assert.equal(blocked.body.code, "ROUND_NOT_COMPLETE");
  });
});

describe("backup v3 export and import", () => {
  test("round-trips a complete tournament and preserves standings", async () => {
    const fixture = await createStartedTournament("round_robin", 3);
    const roundRows = await rows<{ round: number }>(
      "SELECT DISTINCT round FROM matches WHERE tournament_id = $1 ORDER BY round",
      [fixture.tournamentId],
    );
    for (const entry of roundRows) await completePendingRound(fixture, entry.round);
    const originalStandings = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`).expect(200);
    const exported = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/export`)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(exported.body.schemaVersion, 3);
    assert.equal(exported.body.resultModelVersion, "series_v1");

    const imported = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: exported.body,
        organizerPassword: "restored-organizer-password",
      })
      .expect(201);
    const importedId = imported.body.tournament.id as number;
    const restoredStandings = await request(app).get(`/api/tournaments/${importedId}/standings`).expect(200);
    const semantic = (entries: Array<Record<string, unknown>>) => entries.map((entry) => ({
      playerName: entry.playerName,
      rank: entry.rank,
      matchesPlayed: entry.matchesPlayed,
      matchWins: entry.matchWins,
      matchLosses: entry.matchLosses,
      gameWins: entry.gameWins,
      gameLosses: entry.gameLosses,
      gameDiff: entry.gameDiff,
      buchholz: entry.buchholz,
      status: entry.status,
      seed: entry.seed,
    }));
    assert.deepEqual(semantic(restoredStandings.body), semantic(originalStandings.body));
    assert.equal(imported.body.playersImported, exported.body.players.length);
    assert.equal(imported.body.matchesImported, exported.body.matches.length);
  });

  test("rejects legacy v1 without creating a tournament", async () => {
    const source = await createStartedTournament("single_elimination", 2);
    const [{ count: beforeCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM tournaments");
    const response = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: { version: "1" },
        organizerPassword: "restored-organizer-password",
      })
      .expect(400);
    assert.equal(response.body.code, "LEGACY_BACKUP_UNSUPPORTED");
    const [{ count: afterCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM tournaments");
    assert.equal(afterCount, beforeCount);
  });

  test("validates the full v3 document before any insert", async () => {
    const fixture = await createStartedTournament("single_elimination", 2);
    await completePendingRound(fixture, 1);
    const exported = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/export`)
      .set(fixture.organizerHeaders)
      .expect(200);
    exported.body.matches[0].winnerBackupId = 999_999;
    const [{ count: beforeCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM tournaments");
    const response = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup: exported.body,
        organizerPassword: "restored-organizer-password",
      })
      .expect(400);
    assert.equal(response.body.code, "INVALID_BACKUP_V3");
    const [{ count: afterCount }] = await rows<{ count: string }>("SELECT count(*)::text AS count FROM tournaments");
    assert.equal(afterCount, beforeCount);
  });
});
