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

type Headers = Record<string, string>;
type Format = "single_elimination" | "round_robin" | "swiss";

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  playersTable: typeof import("@workspace/db").playersTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
  resultHistoryTable: typeof import("@workspace/db").resultHistoryTable;
  actionLogTable: typeof import("@workspace/db").actionLogTable;
  supportSessionsTable: typeof import("@workspace/db").supportSessionsTable;
}

interface MatchFixture {
  tournamentId: number;
  matchId: number;
  nextMatchId: number | null;
  playerIds: [number, number, number, number];
  organizerHeaders: Headers;
  supportHeaders: Headers;
  viewerHeaders: Headers;
}

const SESSION_SECRET = `complete-series-v1-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;
let signViewerToken: typeof import("../src/auth").signViewerToken;
let completeMatchUseCase: typeof import("../src/application/matches/complete-match").completeMatch;

async function createFixture(options: {
  bestOf?: number;
  format?: Format;
  lifecycle?: "pending" | "in_progress" | "postponed" | "cancelled";
  bracket?: boolean;
} = {}): Promise<MatchFixture> {
  const suffix = randomUUID();
  const format = options.format ?? "single_elimination";
  const bracket = options.bracket ?? format === "single_elimination";
  const bestOf = options.bestOf ?? 3;
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: `Complete ${suffix}`,
    format,
    status: "active",
    visibility: "public_online",
    defaultBestOf: bestOf,
    currentRound: 1,
    totalRounds: bracket ? 2 : 1,
    swissRounds: format === "swiss" ? 1 : null,
  }).returning();
  const players = await database.db.insert(database.playersTable).values(
    [1, 2, 3, 4].map((seed) => ({ tournamentId: tournament.id, name: `P${seed}-${suffix}`, seed })),
  ).returning();
  const values: Array<typeof database.matchesTable.$inferInsert> = [{
    tournamentId: tournament.id,
    round: 1,
    matchNumber: 1,
    player1Id: players[0].id,
    player2Id: players[1].id,
    bestOf,
    status: options.lifecycle ?? "pending",
  }];
  if (bracket) {
    values.push(
      {
        tournamentId: tournament.id,
        round: 1,
        matchNumber: 2,
        player1Id: players[2].id,
        player2Id: players[3].id,
        bestOf,
        status: "pending",
      },
      { tournamentId: tournament.id, round: 2, matchNumber: 1, bestOf, status: "pending" },
    );
  }
  const matches = await database.db.insert(database.matchesTable).values(values).returning();
  const supportToken = randomUUID();
  await database.db.insert(database.supportSessionsTable).values({
    tournamentId: tournament.id,
    nick: "Support",
    sessionToken: supportToken,
  });
  return {
    tournamentId: tournament.id,
    matchId: matches[0].id,
    nextMatchId: bracket ? matches[2].id : null,
    playerIds: [players[0].id, players[1].id, players[2].id, players[3].id],
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournament.id) },
    supportHeaders: { "x-support-token": supportToken },
    viewerHeaders: { "x-viewer-token": signViewerToken(tournament.id) },
  };
}

async function postComplete(
  fixture: MatchFixture,
  payload: Record<string, unknown>,
  headers: Headers = fixture.organizerHeaders,
): Promise<Response> {
  return request(app).post(`/api/matches/${fixture.matchId}/complete`).set(headers).send(payload);
}

async function snapshot(fixture: MatchFixture) {
  const [match, players, history, actions, downstream] = await Promise.all([
    database.pool.query(
      "SELECT status, result_type, result_reason, score1, score2, winner_id, completed_at FROM matches WHERE id = $1",
      [fixture.matchId],
    ),
    database.pool.query("SELECT id, status FROM players WHERE tournament_id = $1 ORDER BY id", [fixture.tournamentId]),
    database.pool.query("SELECT revision, result_type, score1, score2, winner_id, best_of FROM result_history WHERE match_id = $1 ORDER BY revision", [fixture.matchId]),
    database.pool.query("SELECT action_type, undo_payload FROM action_log WHERE match_id = $1 ORDER BY id", [fixture.matchId]),
    fixture.nextMatchId == null
      ? Promise.resolve({ rows: [] })
      : database.pool.query("SELECT player1_id, player2_id, status FROM matches WHERE id = $1", [fixture.nextMatchId]),
  ]);
  return { match: match.rows[0], players: players.rows, history: history.rows, actions: actions.rows, downstream: downstream.rows[0] };
}

function assertDomainError(response: Response, status: number, code?: string): void {
  assert.equal(response.status, status);
  assert.equal(typeof response.body?.error, "string");
  if (code) assert.equal(response.body?.code, code);
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  schemaInitialized = true;
  const auth = await import("../src/auth");
  signOrganizerToken = auth.signOrganizerToken;
  signViewerToken = auth.signViewerToken;
  completeMatchUseCase = (await import("../src/application/matches/complete-match")).completeMatch;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  await database.pool.end();
});

describe("CompleteMatch series_v1 played results", () => {
  const validCases = [
    { bestOf: 1, score1: 1, score2: 0, winner: 0 },
    { bestOf: 1, score1: 0, score2: 1, winner: 1 },
    { bestOf: 3, score1: 2, score2: 0, winner: 0 },
    { bestOf: 3, score1: 2, score2: 1, winner: 0 },
    { bestOf: 3, score1: 0, score2: 2, winner: 1 },
    { bestOf: 5, score1: 3, score2: 2, winner: 0 },
    { bestOf: 7, score1: 4, score2: 0, winner: 0 },
    { bestOf: 7, score1: 3, score2: 4, winner: 1 },
  ];
  for (const scenario of validCases) {
    test(`accepts BO${scenario.bestOf} ${scenario.score1}:${scenario.score2}`, async () => {
      const fixture = await createFixture({ bestOf: scenario.bestOf });
      const response = await postComplete(fixture, { resultType: "played", score1: scenario.score1, score2: scenario.score2 });
      assert.equal(response.status, 200);
      assert.equal(response.body.resultType, "played");
      assert.equal(response.body.winnerId, fixture.playerIds[scenario.winner]);
      const state = await snapshot(fixture);
      assert.equal(state.history.length, 1);
      assert.equal(state.history[0].revision, 1);
      assert.equal(state.actions.length, 1);
      assert.equal(state.downstream.player1_id, fixture.playerIds[scenario.winner]);
      assert.deepEqual(Object.keys(state.players[0]).sort(), ["id", "status"]);
    });
  }

  const invalidCases = [
    { name: "BO3 1:0", bestOf: 3, score1: 1, score2: 0, code: "WIN_THRESHOLD_NOT_REACHED" },
    { name: "BO5 2:1", bestOf: 5, score1: 2, score2: 1, code: "WIN_THRESHOLD_NOT_REACHED" },
    { name: "equal unfinished", bestOf: 3, score1: 1, score2: 1, code: "WIN_THRESHOLD_NOT_REACHED" },
    { name: "zero-zero", bestOf: 3, score1: 0, score2: 0, code: "WIN_THRESHOLD_NOT_REACHED" },
    { name: "winner exceeds threshold", bestOf: 3, score1: 3, score2: 0, code: "SCORE_EXCEEDS_WIN_THRESHOLD" },
    { name: "both reach threshold", bestOf: 3, score1: 2, score2: 2, code: "BOTH_SIDES_REACHED_WIN_THRESHOLD" },
    { name: "both exceed threshold", bestOf: 3, score1: 3, score2: 3, code: "BOTH_SIDES_REACHED_WIN_THRESHOLD" },
    { name: "negative player1", bestOf: 3, score1: -1, score2: 2, code: "SCORE_NEGATIVE" },
    { name: "negative player2", bestOf: 3, score1: 2, score2: -1, code: "SCORE_NEGATIVE" },
    { name: "fractional player1", bestOf: 3, score1: 2.5, score2: 0, code: "SCORE_NOT_INTEGER" },
    { name: "fractional player2", bestOf: 3, score1: 2, score2: 0.5, code: "SCORE_NOT_INTEGER" },
  ];
  for (const scenario of invalidCases) {
    test(`rejects ${scenario.name} without side effects`, async () => {
      const fixture = await createFixture({ bestOf: scenario.bestOf });
      const beforeState = await snapshot(fixture);
      const response = await postComplete(fixture, { resultType: "played", score1: scenario.score1, score2: scenario.score2 });
      assertDomainError(response, 422, scenario.code);
      assert.deepEqual(await snapshot(fixture), beforeState);
    });
  }

  test("derives winner from score and ignores an attempted arbitrary winner field", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, {
      resultType: "played",
      score1: 2,
      score2: 0,
      winnerId: fixture.playerIds[1],
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.winnerId, fixture.playerIds[0]);
  });
});

describe("CompleteMatch result types", () => {
  test("walkover has a winner, reason and no score", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, { resultType: "walkover", winnerId: fixture.playerIds[1], reason: "nieobecność" });
    assert.equal(response.status, 200);
    assert.equal(response.body.resultType, "walkover");
    assert.equal(response.body.score1, null);
    assert.equal(response.body.score2, null);
    assert.equal(response.body.resultReason, "nieobecność");
    const state = await snapshot(fixture);
    assert.equal(state.downstream.player1_id, fixture.playerIds[1]);
    assert.equal(state.history[0].result_type, "walkover");
    assert.equal(state.history[0].score1, null);
    assert.equal(state.history[0].score2, null);
    const standings = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`).expect(200);
    const winner = standings.body.find((entry: any) => entry.playerId === fixture.playerIds[1]);
    const loser = standings.body.find((entry: any) => entry.playerId === fixture.playerIds[0]);
    assert.deepEqual(
      { matchWins: winner.matchWins, gameWins: winner.gameWins, gameLosses: winner.gameLosses },
      { matchWins: 1, gameWins: 0, gameLosses: 0 },
    );
    assert.deepEqual(
      { matchLosses: loser.matchLosses, gameWins: loser.gameWins, gameLosses: loser.gameLosses },
      { matchLosses: 1, gameWins: 0, gameLosses: 0 },
    );
  });

  test("walkover rejects a winner outside the match", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, { resultType: "walkover", winnerId: fixture.playerIds[2] });
    assertDomainError(response, 422, "WINNER_NOT_PARTICIPANT");
  });

  test("no contest completes a round-robin match with no winner or score", async () => {
    const fixture = await createFixture({ format: "round_robin", bracket: false });
    const response = await postComplete(fixture, { resultType: "no_contest", reason: "awaria" });
    assert.equal(response.status, 200);
    assert.equal(response.body.resultType, "no_contest");
    assert.equal(response.body.winnerId, null);
    assert.equal(response.body.score1, null);
    const standings = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`);
    assert.equal(standings.status, 200);
    assert.ok(standings.body.every((standing: any) => standing.matchWins === 0 && standing.matchLosses === 0 && standing.gameDiff === 0));
  });

  test("no contest cannot advance a single-elimination bracket", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, { resultType: "no_contest", reason: "awaria" });
    assertDomainError(response, 422, "NO_CONTEST_REQUIRES_RESOLUTION");
  });

  test("public CompleteMatch cannot create a system bye", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, { resultType: "bye", winnerId: fixture.playerIds[0] });
    assert.equal(response.status, 422);
    assert.equal(response.body.code, "INVALID_MATCH_RESULT");
    assert.equal((await snapshot(fixture)).history.length, 0);
  });
});

describe("CompleteMatch authorization and state guards", () => {
  test("support may complete a match", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture, { resultType: "played", score1: 2, score2: 0 }, fixture.supportHeaders)).status, 200);
  });

  test("viewer may not complete a match", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture, { resultType: "played", score1: 2, score2: 0 }, fixture.viewerHeaders)).status, 403);
  });

  test("anonymous caller may not complete a protected operation", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture, { resultType: "played", score1: 2, score2: 0 }, {})).status, 403);
  });

  test("cancelled match is not completable", async () => {
    const fixture = await createFixture({ lifecycle: "cancelled" });
    assertDomainError(await postComplete(fixture, { resultType: "played", score1: 2, score2: 0 }), 422, "MATCH_STATE_NOT_COMPLETABLE");
  });

  test("match without both participants is not completable", async () => {
    const fixture = await createFixture({ format: "round_robin", bracket: false });
    await database.pool.query("UPDATE matches SET player2_id = NULL WHERE id = $1", [fixture.matchId]);
    assertDomainError(await postComplete(fixture, { resultType: "played", score1: 2, score2: 0 }), 422, "PARTICIPANTS_REQUIRED");
  });

  test("occupied downstream slot blocks completion without partial writes", async () => {
    const fixture = await createFixture();
    await database.pool.query("UPDATE matches SET player1_id = $1 WHERE id = $2", [fixture.playerIds[3], fixture.nextMatchId]);
    const beforeState = await snapshot(fixture);
    assertDomainError(await postComplete(fixture, { resultType: "played", score1: 2, score2: 0 }), 422, "MATCH_STATE_NOT_COMPLETABLE");
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("database rejects a cross-tournament participant", async () => {
    const fixture = await createFixture();
    const other = await createFixture({ format: "round_robin", bracket: false });
    await assert.rejects(database.pool.query("UPDATE matches SET player1_id = $1 WHERE id = $2", [other.playerIds[0], fixture.matchId]));
  });
});

describe("CompleteMatch atomicity", () => {
  test("duplicate request changes state exactly once", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture, { resultType: "played", score1: 2, score2: 1 })).status, 200);
    assertDomainError(await postComplete(fixture, { resultType: "played", score1: 2, score2: 1 }), 409, "MATCH_ALREADY_FINALIZED");
    const state = await snapshot(fixture);
    assert.equal(state.history.length, 1);
    assert.equal(state.actions.length, 1);
  });

  test("concurrent requests produce one completion and one history revision", async () => {
    const fixture = await createFixture();
    const responses = await Promise.all(Array.from({ length: 6 }, () =>
      postComplete(fixture, { resultType: "played", score1: 2, score2: 0 })));
    assert.equal(responses.filter((response) => response.status === 200).length, 1);
    assert.equal(responses.filter((response) => response.status === 409).length, 5);
    const state = await snapshot(fixture);
    assert.equal(state.history.length, 1);
    assert.equal(state.actions.length, 1);
  });

  test("fault after match update rolls back every side effect", async () => {
    const fixture = await createFixture();
    const beforeState = await snapshot(fixture);
    await assert.rejects(
      completeMatchUseCase(
        { matchId: fixture.matchId, resultType: "played", score1: 2, score2: 0 },
        { afterMatchUpdated: () => { throw new Error("injected rollback"); } },
      ),
      /injected rollback/,
    );
    assert.deepEqual(await snapshot(fixture), beforeState);
  });
});

describe("general PATCH cannot finalize a result", () => {
  for (const field of ["score1", "score2", "winnerId", "resultType", "resultReason", "completedAt"]) {
    test(`rejects ${field}`, async () => {
      const fixture = await createFixture();
      const value = field === "winnerId"
        ? fixture.playerIds[0]
        : field === "resultType"
          ? "played"
          : field === "resultReason"
            ? "x"
            : field === "completedAt"
              ? new Date().toISOString()
              : 1;
      const response = await request(app).patch(`/api/matches/${fixture.matchId}`).set(fixture.organizerHeaders).send({ [field]: value });
      assertDomainError(response, 422, "MATCH_RESULT_REQUIRES_COMPLETE");
      assert.equal((await snapshot(fixture)).history.length, 0);
    });
  }

  test("rejects raw lifecycle status completed", async () => {
    const fixture = await createFixture();
    const response = await request(app).patch(`/api/matches/${fixture.matchId}`).set(fixture.organizerHeaders).send({ status: "completed" });
    assertDomainError(response, 422, "MATCH_FINAL_STATUS_REQUIRES_DEDICATED_ACTION");
  });
});
