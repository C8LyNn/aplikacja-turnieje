import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";
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
  nextMatchId: number;
  playerIds: [number, number, number, number];
  organizerHeaders: Headers;
  supportHeaders: Headers;
  viewerHeaders: Headers;
}

interface MatchSnapshot {
  match: unknown;
  players: unknown[];
  resultHistory: number;
  resultActions: number;
  nextMatch: unknown;
  tournament: unknown;
}

interface CompletePayload {
  score1: number;
  score2: number;
  winnerId?: number | null;
  isDraw?: boolean;
}

const SESSION_SECRET = `complete-match-test-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let testSchemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;
let signViewerToken: typeof import("../src/auth").signViewerToken;
let completeMatchUseCase: typeof import("../src/application/matches/complete-match").completeMatch;

async function createFixture(options: { allowDraws?: boolean } = {}): Promise<MatchFixture> {
  const suffix = randomUUID();
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `Complete fixture ${suffix}`,
      format: "single_elimination",
      status: "active",
      visibility: "public_online",
      allowDraws: options.allowDraws ?? false,
      defaultBestOf: 3,
      currentRound: 1,
      totalRounds: 2,
    })
    .returning();

  const players = await database.db
    .insert(database.playersTable)
    .values([1, 2, 3, 4].map((seed) => ({
      tournamentId: tournament.id,
      name: `Player ${seed} ${suffix}`,
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
        player2Id: players[1].id,
        bestOf: 3,
        status: "pending" as const,
      },
      {
        tournamentId: tournament.id,
        round: 1,
        matchNumber: 2,
        player1Id: players[2].id,
        player2Id: players[3].id,
        bestOf: 3,
        status: "pending" as const,
      },
      {
        tournamentId: tournament.id,
        round: 2,
        matchNumber: 1,
        bestOf: 3,
        status: "pending" as const,
      },
    ])
    .returning();

  const supportToken = randomUUID();
  await database.db.insert(database.supportSessionsTable).values({
    tournamentId: tournament.id,
    nick: "Complete Match Support",
    sessionToken: supportToken,
    passwordVersion: 1,
  });

  return {
    tournamentId: tournament.id,
    matchId: matches[0].id,
    nextMatchId: matches[2].id,
    playerIds: [players[0].id, players[1].id, players[2].id, players[3].id],
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournament.id) },
    supportHeaders: { "x-support-token": supportToken },
    viewerHeaders: { "x-viewer-token": signViewerToken(tournament.id) },
  };
}

async function createForeignPlayer(): Promise<{ tournamentId: number; playerId: number }> {
  const suffix = randomUUID();
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `Foreign tournament ${suffix}`,
      format: "single_elimination",
      status: "active",
      visibility: "public_online",
    })
    .returning();
  const [player] = await database.db
    .insert(database.playersTable)
    .values({ tournamentId: tournament.id, name: `Foreign player ${suffix}`, seed: 1 })
    .returning();
  return { tournamentId: tournament.id, playerId: player.id };
}

function defaultPayload(fixture: MatchFixture): CompletePayload {
  void fixture;
  return {
    score1: 1,
    score2: 0,
    isDraw: false,
  };
}

async function postComplete(
  fixture: MatchFixture,
  headers: Headers,
  payload: CompletePayload = defaultPayload(fixture),
): Promise<Response> {
  return request(app)
    .post(`/api/matches/${fixture.matchId}/complete`)
    .set(headers)
    .send(payload);
}

async function snapshot(fixture: MatchFixture, extraPlayerIds: number[] = []): Promise<MatchSnapshot> {
  const playerIds = [...fixture.playerIds, ...extraPlayerIds];
  const [match, players, resultHistory, resultActions, nextMatch, tournament] = await Promise.all([
    database.pool.query(
      "SELECT status, score1, score2, winner_id, is_draw, completed_at FROM matches WHERE id = $1",
      [fixture.matchId],
    ),
    database.pool.query(
      "SELECT id, tournament_id, wins, draws, losses, points, status FROM players WHERE id = ANY($1::int[]) ORDER BY id",
      [playerIds],
    ),
    database.pool.query(
      "SELECT COUNT(*)::int AS count FROM result_history WHERE match_id = $1",
      [fixture.matchId],
    ),
    database.pool.query(
      "SELECT COUNT(*)::int AS count FROM action_log WHERE match_id = $1 AND action_type = 'match_result_submitted'",
      [fixture.matchId],
    ),
    database.pool.query(
      "SELECT player1_id, player2_id, status FROM matches WHERE id = $1",
      [fixture.nextMatchId],
    ),
    database.pool.query(
      "SELECT status, winner_id, current_round FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    ),
  ]);

  return {
    match: match.rows[0],
    players: players.rows,
    resultHistory: (resultHistory.rows[0] as { count: number }).count,
    resultActions: (resultActions.rows[0] as { count: number }).count,
    nextMatch: nextMatch.rows[0],
    tournament: tournament.rows[0],
  };
}

function assertSafeDomainError(response: Response, expectedStatus: number): void {
  assert.equal(response.status, expectedStatus);
  assert.equal(typeof response.body?.error, "string");
  assert.equal(typeof response.body?.code, "string");
  assert.deepEqual(Object.keys(response.body).sort(), ["code", "error"]);
  assert.doesNotMatch(JSON.stringify(response.body), /Player \d|Foreign|Complete fixture/i);
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;

  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  testSchemaInitialized = true;

  const auth = await import("../src/auth");
  signOrganizerToken = auth.signOrganizerToken;
  signViewerToken = auth.signViewerToken;
  completeMatchUseCase = (await import("../src/application/matches/complete-match")).completeMatch;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (testSchemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  }
  await database.pool.end();
});

describe("atomic CompleteMatch", () => {
  test("completes a legacy BO3 1:0, applies 3/1/0 stats, history, log, elimination and advancement", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, fixture.organizerHeaders);
    assert.equal(response.status, 200);
    assert.equal(response.body.status, "completed");
    assert.equal(response.body.score1, 1);
    assert.equal(response.body.score2, 0);
    assert.equal(response.body.winnerId, fixture.playerIds[0]);

    const state = await snapshot(fixture);
    assert.deepEqual(state.match, {
      status: "completed",
      score1: 1,
      score2: 0,
      winner_id: fixture.playerIds[0],
      is_draw: false,
      completed_at: (state.match as { completed_at: Date }).completed_at,
    });
    assert.ok((state.match as { completed_at: Date | null }).completed_at);
    const winner = state.players.find((player) => (player as { id: number }).id === fixture.playerIds[0]) as Record<string, unknown>;
    const loser = state.players.find((player) => (player as { id: number }).id === fixture.playerIds[1]) as Record<string, unknown>;
    assert.equal(winner.wins, 1);
    assert.equal(winner.points, 3);
    assert.equal(loser.losses, 1);
    assert.equal(loser.status, "eliminated");
    assert.equal(state.resultHistory, 1);
    assert.equal(state.resultActions, 1);
    assert.equal((state.nextMatch as { player1_id: number | null }).player1_id, fixture.playerIds[0]);
    assert.deepEqual(state.tournament, { status: "active", winner_id: null, current_round: 1 });
  });

  test("finalizes a single-elimination tournament after the final match", async () => {
    const fixture = await createFixture();
    const roundOneMatches = await database.pool.query(
      "SELECT id FROM matches WHERE tournament_id = $1 AND round = 1 ORDER BY match_number",
      [fixture.tournamentId],
    );
    const secondSemiFinalId = (roundOneMatches.rows[1] as { id: number }).id;

    assert.equal((await postComplete(fixture, fixture.organizerHeaders)).status, 200);
    assert.equal(
      (await request(app)
        .post(`/api/matches/${secondSemiFinalId}/complete`)
        .set(fixture.organizerHeaders)
        .send({ score1: 1, score2: 0, isDraw: false })).status,
      200,
    );
    const finalResponse = await request(app)
      .post(`/api/matches/${fixture.nextMatchId}/complete`)
      .set(fixture.organizerHeaders)
      .send({ score1: 1, score2: 0, isDraw: false });
    assert.equal(finalResponse.status, 200);

    const tournament = await database.pool.query(
      "SELECT status, winner_id, current_round FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    );
    assert.deepEqual(tournament.rows[0], {
      status: "completed",
      winner_id: fixture.playerIds[0],
      current_round: 2,
    });
    const players = await database.pool.query(
      "SELECT id, wins, losses, points, status FROM players WHERE tournament_id = $1 ORDER BY seed",
      [fixture.tournamentId],
    );
    assert.deepEqual(players.rows[0], {
      id: fixture.playerIds[0],
      wins: 2,
      losses: 0,
      points: 6,
      status: "winner",
    });
    assert.deepEqual(players.rows[2], {
      id: fixture.playerIds[2],
      wins: 1,
      losses: 1,
      points: 3,
      status: "eliminated",
    });
    const sideEffects = await database.pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM result_history WHERE tournament_id = $1) AS history_count,
        (SELECT COUNT(*)::int FROM action_log WHERE tournament_id = $1 AND action_type = 'match_result_submitted') AS action_count`,
      [fixture.tournamentId],
    );
    assert.deepEqual(sideEffects.rows[0], { history_count: 3, action_count: 3 });
  });

  test("rejects a winner outside the match but inside the tournament without side effects", async () => {
    const fixture = await createFixture();
    const beforeState = await snapshot(fixture);
    const response = await postComplete(fixture, fixture.organizerHeaders, {
      ...defaultPayload(fixture),
      winnerId: fixture.playerIds[2],
    });
    assertSafeDomainError(response, 422);
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("rejects a winner from another tournament without side effects", async () => {
    const fixture = await createFixture();
    const foreign = await createForeignPlayer();
    const beforeState = await snapshot(fixture, [foreign.playerId]);
    const response = await postComplete(fixture, fixture.organizerHeaders, {
      ...defaultPayload(fixture),
      winnerId: foreign.playerId,
    });
    assertSafeDomainError(response, 422);
    assert.deepEqual(await snapshot(fixture, [foreign.playerId]), beforeState);
  });

  test("rejects a cross-tournament participant without side effects", async () => {
    const fixture = await createFixture();
    const foreign = await createForeignPlayer();
    await database.db
      .update(database.matchesTable)
      .set({ player2Id: foreign.playerId })
      .where(eq(database.matchesTable.id, fixture.matchId));
    const beforeState = await snapshot(fixture, [foreign.playerId]);
    const response = await postComplete(fixture, fixture.organizerHeaders, {
      score1: 1,
      score2: 0,
      winnerId: fixture.playerIds[0],
      isDraw: false,
    });
    assertSafeDomainError(response, 422);
    assert.deepEqual(await snapshot(fixture, [foreign.playerId]), beforeState);
  });

  test("rejects a match with a missing participant without side effects", async () => {
    const fixture = await createFixture();
    await database.db
      .update(database.matchesTable)
      .set({ player2Id: null })
      .where(eq(database.matchesTable.id, fixture.matchId));
    const beforeState = await snapshot(fixture);
    const response = await postComplete(fixture, fixture.organizerHeaders);
    assertSafeDomainError(response, 422);
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("returns 409 on a repeated CompleteMatch and applies side effects exactly once", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture, fixture.organizerHeaders)).status, 200);
    const response = await postComplete(fixture, fixture.organizerHeaders);
    assertSafeDomainError(response, 409);

    const state = await snapshot(fixture);
    const winner = state.players.find((player) => (player as { id: number }).id === fixture.playerIds[0]) as Record<string, unknown>;
    const loser = state.players.find((player) => (player as { id: number }).id === fixture.playerIds[1]) as Record<string, unknown>;
    assert.equal(winner.wins, 1);
    assert.equal(winner.points, 3);
    assert.equal(loser.losses, 1);
    assert.equal(state.resultHistory, 1);
    assert.equal(state.resultActions, 1);
    assert.equal((state.nextMatch as { player1_id: number | null }).player1_id, fixture.playerIds[0]);
  });

  test("serializes two real parallel requests: one succeeds and one receives 409", async () => {
    const fixture = await createFixture();
    const [first, second] = await Promise.all([
      postComplete(fixture, fixture.organizerHeaders),
      postComplete(fixture, fixture.organizerHeaders),
    ]);
    assert.deepEqual([first.status, second.status].sort((a, b) => a - b), [200, 409]);

    const state = await snapshot(fixture);
    const winner = state.players.find((player) => (player as { id: number }).id === fixture.playerIds[0]) as Record<string, unknown>;
    const loser = state.players.find((player) => (player as { id: number }).id === fixture.playerIds[1]) as Record<string, unknown>;
    assert.equal(winner.wins, 1);
    assert.equal(winner.points, 3);
    assert.equal(loser.losses, 1);
    assert.equal(state.resultHistory, 1);
    assert.equal(state.resultActions, 1);
    assert.equal((state.nextMatch as { player1_id: number | null }).player1_id, fixture.playerIds[0]);
  });

  test("rolls back every table when the test seam fails after the match update", async () => {
    const fixture = await createFixture();
    const beforeState = await snapshot(fixture);
    await assert.rejects(
      () => completeMatchUseCase(
        { matchId: fixture.matchId, ...defaultPayload(fixture) },
        { afterMatchUpdated: () => { throw new Error("controlled transaction fault"); } },
      ),
      /controlled transaction fault/,
    );
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("preserves the legacy allowed-draw behavior of +1 draw and +1 point", async () => {
    const fixture = await createFixture({ allowDraws: true });
    const response = await postComplete(fixture, fixture.organizerHeaders, {
      score1: 1,
      score2: 1,
      winnerId: null,
      isDraw: true,
    });
    assert.equal(response.status, 200);
    const state = await snapshot(fixture);
    const participants = state.players.filter((player) =>
      fixture.playerIds.slice(0, 2).includes((player as { id: number }).id),
    ) as Array<Record<string, unknown>>;
    assert.equal(participants.length, 2);
    for (const participant of participants) {
      assert.equal(participant.draws, 1);
      assert.equal(participant.points, 1);
      assert.equal(participant.wins, 0);
      assert.equal(participant.losses, 0);
    }
    assert.equal(state.resultHistory, 1);
    assert.equal(state.resultActions, 1);
  });

  for (const status of ["cancelled", "bye"] as const) {
    test(`rejects a ${status} match with 422 and no side effects`, async () => {
      const fixture = await createFixture();
      await database.db
        .update(database.matchesTable)
        .set({ status })
        .where(eq(database.matchesTable.id, fixture.matchId));
      const beforeState = await snapshot(fixture);
      const response = await postComplete(fixture, fixture.organizerHeaders);
      assertSafeDomainError(response, 422);
      assert.deepEqual(await snapshot(fixture), beforeState);
    });
  }

  test("treats a pre-existing walkover as an already finalized 409 conflict", async () => {
    const fixture = await createFixture();
    await database.db
      .update(database.matchesTable)
      .set({ status: "walkover" })
      .where(eq(database.matchesTable.id, fixture.matchId));
    const beforeState = await snapshot(fixture);
    const response = await postComplete(fixture, fixture.organizerHeaders);
    assertSafeDomainError(response, 409);
    assert.deepEqual(await snapshot(fixture), beforeState);
  });
});

describe("legacy CompleteMatch payload validation", () => {
  const invalidPayloads: Array<{ name: string; payload: (fixture: MatchFixture) => CompletePayload }> = [
    { name: "negative score", payload: (fixture) => ({ ...defaultPayload(fixture), score1: -1 }) },
    { name: "fractional score", payload: (fixture) => ({ ...defaultPayload(fixture), score1: 1.5 }) },
    { name: "unequal draw score", payload: () => ({ score1: 2, score2: 1, isDraw: true, winnerId: null }) },
    { name: "equal non-draw score", payload: (fixture) => ({ score1: 1, score2: 1, isDraw: false, winnerId: fixture.playerIds[0] }) },
    { name: "winner contradicting score", payload: (fixture) => ({ score1: 0, score2: 1, isDraw: false, winnerId: fixture.playerIds[0] }) },
    { name: "draw forbidden by tournament", payload: () => ({ score1: 1, score2: 1, isDraw: true, winnerId: null }) },
    { name: "draw with an explicit winner", payload: (fixture) => ({ score1: 1, score2: 1, isDraw: true, winnerId: fixture.playerIds[0] }) },
  ];

  for (const invalidCase of invalidPayloads) {
    test(`rejects ${invalidCase.name} with 422 and no side effects`, async () => {
      const fixture = await createFixture({
        allowDraws:
          invalidCase.name === "draw with an explicit winner" ||
          invalidCase.name === "unequal draw score",
      });
      const beforeState = await snapshot(fixture);
      const response = await postComplete(fixture, fixture.organizerHeaders, invalidCase.payload(fixture));
      assertSafeDomainError(response, 422);
      assert.deepEqual(await snapshot(fixture), beforeState);
    });
  }
});

describe("CompleteMatch permissions", () => {
  test("denies anonymous", async () => {
    const fixture = await createFixture();
    const beforeState = await snapshot(fixture);
    const response = await postComplete(fixture, {});
    assert.equal(response.status, 403);
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("denies viewer", async () => {
    const fixture = await createFixture();
    const beforeState = await snapshot(fixture);
    const response = await postComplete(fixture, fixture.viewerHeaders);
    assert.equal(response.status, 403);
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("allows support", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, fixture.supportHeaders);
    assert.equal(response.status, 200);
    assert.equal((await snapshot(fixture)).resultHistory, 1);
  });

  test("allows organizer", async () => {
    const fixture = await createFixture();
    const response = await postComplete(fixture, fixture.organizerHeaders);
    assert.equal(response.status, 200);
    assert.equal((await snapshot(fixture)).resultHistory, 1);
  });

  test("rejects an organizer credential from tournament A for a match in tournament B", async () => {
    const fixtureA = await createFixture();
    const fixtureB = await createFixture();
    const beforeState = await snapshot(fixtureB);
    const response = await postComplete(fixtureB, fixtureA.organizerHeaders);
    assert.equal(response.status, 403);
    assert.deepEqual(await snapshot(fixtureB), beforeState);
  });
});

describe("PATCH cannot bypass CompleteMatch", () => {
  for (const status of ["completed", "walkover", "bye"] as const) {
    test(`rejects PATCH status ${status}`, async () => {
      const fixture = await createFixture();
      const beforeState = await snapshot(fixture);
      const response = await request(app)
        .patch(`/api/matches/${fixture.matchId}`)
        .set(fixture.organizerHeaders)
        .send({ status });
      assertSafeDomainError(response, 422);
      assert.deepEqual(await snapshot(fixture), beforeState);
    });
  }

  for (const field of ["score1", "score2", "winnerId", "isDraw"] as const) {
    test(`rejects direct PATCH field ${field}`, async () => {
      const fixture = await createFixture();
      const beforeState = await snapshot(fixture);
      const value = field === "isDraw" ? false : field === "winnerId" ? fixture.playerIds[0] : 1;
      const response = await request(app)
        .patch(`/api/matches/${fixture.matchId}`)
        .set(fixture.organizerHeaders)
        .send({ [field]: value });
      assertSafeDomainError(response, 422);
      assert.deepEqual(await snapshot(fixture), beforeState);
    });
  }

  test("preserves in_progress, postponed, pending and pre-start bestOf changes", async () => {
    const fixture = await createFixture();
    const patch = (body: Record<string, unknown>) => request(app)
      .patch(`/api/matches/${fixture.matchId}`)
      .set(fixture.organizerHeaders)
      .send(body);

    assert.equal((await patch({ status: "in_progress" })).status, 200);
    const blockedBestOf = await patch({ bestOf: 5 });
    assertSafeDomainError(blockedBestOf, 422);
    assert.equal((await patch({ status: "postponed" })).status, 200);
    assert.equal((await patch({ status: "pending" })).status, 200);
    const bestOfResponse = await patch({ bestOf: 5 });
    assert.equal(bestOfResponse.status, 200);
    assert.equal(bestOfResponse.body.bestOf, 5);

    const state = await snapshot(fixture);
    assert.equal((state.match as { status: string }).status, "pending");
    assert.equal(state.resultHistory, 0);
    assert.equal(state.resultActions, 0);
    assert.equal((state.nextMatch as { player1_id: number | null }).player1_id, null);
  });
});

describe("revert compatibility", () => {
  test("reverts one successful CompleteMatch using the existing legacy behavior", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture, fixture.organizerHeaders)).status, 200);

    const response = await request(app)
      .post(`/api/matches/${fixture.matchId}/revert`)
      .set(fixture.organizerHeaders)
      .send();
    assert.equal(response.status, 200);

    const state = await snapshot(fixture);
    assert.deepEqual(state.match, {
      status: "pending",
      score1: null,
      score2: null,
      winner_id: null,
      is_draw: false,
      completed_at: null,
    });
    for (const player of state.players as Array<Record<string, unknown>>) {
      assert.equal(player.wins, 0);
      assert.equal(player.draws, 0);
      assert.equal(player.losses, 0);
      assert.equal(player.points, 0);
    }
    assert.equal(state.resultHistory, 0);
    assert.equal((state.nextMatch as { player1_id: number | null }).player1_id, null);

    const logs = await database.pool.query(
      "SELECT action_type, is_undone FROM action_log WHERE match_id = $1 ORDER BY id",
      [fixture.matchId],
    );
    assert.deepEqual(logs.rows, [
      { action_type: "match_result_submitted", is_undone: true },
      { action_type: "match_result_reverted", is_undone: false },
    ]);
  });
});
