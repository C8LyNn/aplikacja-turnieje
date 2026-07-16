import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import { eq } from "drizzle-orm";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
}

interface TournamentFixture {
  tournamentId: number;
  stageIds: number[];
  organizerHeaders: Record<string, string>;
}

const SESSION_SECRET = `stages-initial-start-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;

async function addPlayers(tournamentId: number, count: number): Promise<void> {
  const headers = { "x-organizer-token": signOrganizerToken(tournamentId) };
  for (let seed = 1; seed <= count; seed += 1) {
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set(headers)
      .send({ name: `Player ${seed}-${randomUUID()}`, seed })
      .expect(201);
  }
}

async function createMultiStageTournament(): Promise<TournamentFixture> {
  const response = await request(app)
    .post("/api/tournaments")
    .send({
      name: `Initial multi-stage start ${randomUUID()}`,
      format: "swiss",
      defaultBestOf: 1,
      stagePlan: {
        initialParticipantCount: 16,
        stages: [
          {
            key: "swiss",
            position: 1,
            name: "Swiss",
            format: "swiss",
            participantCount: 16,
            bestOf: 1,
            rounds: 4,
            advancingCount: 8,
          },
          {
            key: "groups",
            position: 2,
            name: "Group Stage",
            format: "group_stage",
            participantCount: 8,
            bestOf: 3,
            groupCount: 2,
            participantsPerGroup: 4,
            qualifiersPerGroup: 2,
            seedingMethod: "snake",
          },
          {
            key: "playoff",
            position: 3,
            name: "Play-off",
            format: "single_elimination",
            participantCount: 4,
            bestOf: 5,
          },
        ],
      },
    })
    .expect(201);
  const tournamentId = response.body.id as number;
  await addPlayers(tournamentId, 16);
  const stages = await database.db
    .select({ id: database.tournamentStagesTable.id })
    .from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournamentId))
    .orderBy(database.tournamentStagesTable.position);
  return {
    tournamentId,
    stageIds: stages.map((stage) => stage.id),
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournamentId) },
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
  ({ signOrganizerToken } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

describe("initial Tournament Stages start", () => {
  test("starts Swiss -> Group Stage -> Single Elimination through the frontend endpoint exactly once", async () => {
    const fixture = await createMultiStageTournament();
    const response = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);

    assert.equal(response.body.status, "active");
    assert.equal(response.body.activeStageId, fixture.stageIds[0]);
    const stageState = await database.pool.query(
      "SELECT id, status FROM tournament_stages WHERE tournament_id = $1 ORDER BY position",
      [fixture.tournamentId],
    );
    assert.deepEqual(stageState.rows, [
      { id: fixture.stageIds[0], status: "active" },
      { id: fixture.stageIds[1], status: "planned" },
      { id: fixture.stageIds[2], status: "planned" },
    ]);
    const firstRound = await database.pool.query(
      "SELECT stage_id, round, status FROM matches WHERE tournament_id = $1 ORDER BY match_number",
      [fixture.tournamentId],
    );
    assert.equal(firstRound.rows.length, 8);
    assert.ok(firstRound.rows.every((match) =>
      match.stage_id === fixture.stageIds[0] && match.round === 1 && match.status === "pending"));
    const apiMatches = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/matches`)
      .expect(200);
    assert.equal(apiMatches.body.length, 8);
    assert.ok(apiMatches.body.every((match: Record<string, unknown>) =>
      Object.hasOwn(match, "stageId") &&
      Object.hasOwn(match, "stageGroupId") &&
      match.stageId === fixture.stageIds[0] &&
      match.stageGroupId === null));

    const retry = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/start`)
      .set(fixture.organizerHeaders);
    assert.equal(retry.status, 409, retry.text);
    assert.equal(retry.body.code, "STAGE_ALREADY_STARTED");
    assert.equal(
      (await database.pool.query("SELECT count(*)::int AS count FROM matches WHERE tournament_id = $1", [fixture.tournamentId])).rows[0].count,
      8,
    );
  });

  test("rolls back the complete initial transition when match generation fails", async () => {
    const fixture = await createMultiStageTournament();
    const functionName = `test_fail_initial_stage_${randomUUID().replaceAll("-", "")}`;
    await database.pool.query(`
      CREATE FUNCTION ${functionName}() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.stage_id = ${fixture.stageIds[0]} AND NEW.match_number = 2 THEN
          RAISE EXCEPTION 'intentional initial stage failure';
        END IF;
        RETURN NEW;
      END;
      $$;
      CREATE TRIGGER ${functionName}
      BEFORE INSERT ON matches
      FOR EACH ROW EXECUTE FUNCTION ${functionName}();
    `);
    try {
      await request(app)
        .post(`/api/tournaments/${fixture.tournamentId}/start`)
        .set(fixture.organizerHeaders)
        .expect(500);
    } finally {
      await database.pool.query(`DROP TRIGGER ${functionName} ON matches`);
      await database.pool.query(`DROP FUNCTION ${functionName}()`);
    }

    const state = await database.pool.query(
      `SELECT tournament.status AS tournament_status,
              tournament.active_stage_id,
              array_agg(stage.status::text ORDER BY stage.position) AS stage_statuses,
              count(match.id)::int AS match_count
       FROM tournaments tournament
       JOIN tournament_stages stage ON stage.tournament_id = tournament.id
       LEFT JOIN matches match ON match.tournament_id = tournament.id
       WHERE tournament.id = $1
       GROUP BY tournament.status, tournament.active_stage_id`,
      [fixture.tournamentId],
    );
    assert.deepEqual(state.rows[0], {
      tournament_status: "draft",
      active_stage_id: null,
      stage_statuses: ["planned", "planned", "planned"],
      match_count: 0,
    });
  });

  test("keeps the one-stage tournament start compatible", async () => {
    const created = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Initial one-stage start ${randomUUID()}`,
        format: "swiss",
        defaultBestOf: 1,
        swissRounds: 2,
      })
      .expect(201);
    const tournamentId = created.body.id as number;
    await addPlayers(tournamentId, 4);
    const [stage] = await database.db
      .select({ id: database.tournamentStagesTable.id })
      .from(database.tournamentStagesTable)
      .where(eq(database.tournamentStagesTable.tournamentId, tournamentId));

    const response = await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set({ "x-organizer-token": signOrganizerToken(tournamentId) })
      .expect(200);
    assert.equal(response.body.status, "active");
    assert.equal(response.body.activeStageId, stage.id);
    assert.equal(
      (await database.pool.query("SELECT count(*)::int AS count FROM matches WHERE stage_id = $1", [stage.id])).rows[0].count,
      2,
    );
  });
});
