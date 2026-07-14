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
  actionLogTable: typeof import("@workspace/db").actionLogTable;
  supportSessionsTable: typeof import("@workspace/db").supportSessionsTable;
}

interface MatchFixture {
  tournamentId: number;
  matchId: number;
  secondMatchId: number | null;
  nextMatchId: number | null;
  playerIds: number[];
  organizerHeaders: Headers;
  supportHeaders: Headers;
  viewerHeaders: Headers;
}

interface RevertSnapshot {
  match: unknown;
  players: unknown[];
  downstream: unknown | null;
  tournament: unknown;
  history: unknown[];
  logs: unknown[];
}

const SESSION_SECRET = `revert-match-test-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let testSchemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;
let signViewerToken: typeof import("../src/auth").signViewerToken;
let revertMatchUseCase: typeof import("../src/application/matches/revert-match").revertMatch;

async function createFixture(options: { allowDraws?: boolean } = {}): Promise<MatchFixture> {
  const suffix = randomUUID();
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `Revert fixture ${suffix}`,
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
      name: `Revert player ${seed} ${suffix}`,
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
    nick: "Revert support",
    sessionToken: supportToken,
    passwordVersion: 1,
  });

  return {
    tournamentId: tournament.id,
    matchId: matches[0].id,
    secondMatchId: matches[1].id,
    nextMatchId: matches[2].id,
    playerIds: players.map((player) => player.id),
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournament.id) },
    supportHeaders: { "x-support-token": supportToken },
    viewerHeaders: { "x-viewer-token": signViewerToken(tournament.id) },
  };
}

async function createRoundRobinFixture(): Promise<MatchFixture> {
  const suffix = randomUUID();
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `Round robin revert ${suffix}`,
      format: "round_robin",
      status: "active",
      visibility: "public_online",
      currentRound: 1,
      totalRounds: 1,
    })
    .returning();
  const players = await database.db
    .insert(database.playersTable)
    .values([1, 2].map((seed) => ({
      tournamentId: tournament.id,
      name: `RR player ${seed} ${suffix}`,
      seed,
    })))
    .returning();
  const [match] = await database.db
    .insert(database.matchesTable)
    .values({
      tournamentId: tournament.id,
      round: 1,
      matchNumber: 1,
      player1Id: players[0].id,
      player2Id: players[1].id,
      bestOf: 3,
      status: "pending",
    })
    .returning();
  const supportToken = randomUUID();
  await database.db.insert(database.supportSessionsTable).values({
    tournamentId: tournament.id,
    nick: "RR support",
    sessionToken: supportToken,
    passwordVersion: 1,
  });

  return {
    tournamentId: tournament.id,
    matchId: match.id,
    secondMatchId: null,
    nextMatchId: null,
    playerIds: players.map((player) => player.id),
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournament.id) },
    supportHeaders: { "x-support-token": supportToken },
    viewerHeaders: { "x-viewer-token": signViewerToken(tournament.id) },
  };
}

async function createSwissFixture(): Promise<MatchFixture> {
  const suffix = randomUUID();
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `Swiss revert ${suffix}`,
      format: "swiss",
      status: "active",
      visibility: "public_online",
      currentRound: 1,
      totalRounds: 2,
      swissRounds: 2,
      defaultBestOf: 3,
    })
    .returning();
  const players = await database.db
    .insert(database.playersTable)
    .values([1, 2, 3, 4].map((seed) => ({
      tournamentId: tournament.id,
      name: `Swiss player ${seed} ${suffix}`,
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
    ])
    .returning();
  const supportToken = randomUUID();
  await database.db.insert(database.supportSessionsTable).values({
    tournamentId: tournament.id,
    nick: "Swiss support",
    sessionToken: supportToken,
    passwordVersion: 1,
  });

  return {
    tournamentId: tournament.id,
    matchId: matches[0].id,
    secondMatchId: matches[1].id,
    nextMatchId: null,
    playerIds: players.map((player) => player.id),
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournament.id) },
    supportHeaders: { "x-support-token": supportToken },
    viewerHeaders: { "x-viewer-token": signViewerToken(tournament.id) },
  };
}

async function postComplete(
  fixture: MatchFixture,
  matchId = fixture.matchId,
  payload: Record<string, unknown> = { score1: 1, score2: 0, isDraw: false },
  headers: Headers = fixture.organizerHeaders,
): Promise<Response> {
  return request(app)
    .post(`/api/matches/${matchId}/complete`)
    .set(headers)
    .send(payload);
}

async function postRevert(
  fixture: MatchFixture,
  headers: Headers = fixture.organizerHeaders,
): Promise<Response> {
  return request(app)
    .post(`/api/matches/${fixture.matchId}/revert`)
    .set(headers)
    .send();
}

async function postUndo(fixture: MatchFixture): Promise<Response> {
  return request(app)
    .post(`/api/tournaments/${fixture.tournamentId}/undo-last`)
    .set(fixture.organizerHeaders)
    .send();
}

async function snapshot(fixture: MatchFixture, matchId = fixture.matchId): Promise<RevertSnapshot> {
  const [match, players, tournament, history, logs] = await Promise.all([
    database.pool.query(
      `SELECT id, tournament_id, round, match_number, player1_id, player2_id, status,
              score1, score2, winner_id, is_draw, best_of, completed_at
         FROM matches WHERE id = $1`,
      [matchId],
    ),
    database.pool.query(
      `SELECT id, seed, wins, draws, losses, points, status
         FROM players WHERE tournament_id = $1 ORDER BY seed`,
      [fixture.tournamentId],
    ),
    database.pool.query(
      "SELECT status, winner_id, current_round FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    ),
    database.pool.query(
      `SELECT id, match_id, score1, score2, winner_id, is_draw, status
         FROM result_history WHERE match_id = $1 ORDER BY id`,
      [matchId],
    ),
    database.pool.query(
      `SELECT id, action_type, match_id, is_undone, undo_payload
         FROM action_log WHERE match_id = $1 ORDER BY id`,
      [matchId],
    ),
  ]);
  const downstream = fixture.nextMatchId == null
    ? { rows: [] as unknown[] }
    : await database.pool.query(
      `SELECT id, player1_id, player2_id, status, score1, score2, winner_id, is_draw, completed_at
         FROM matches WHERE id = $1`,
      [fixture.nextMatchId],
    );

  return {
    match: match.rows[0],
    players: players.rows,
    downstream: downstream.rows[0] ?? null,
    tournament: tournament.rows[0],
    history: history.rows,
    logs: logs.rows,
  };
}

function assertDomainError(response: Response, expectedStatus: number, expectedCode?: string): void {
  assert.equal(response.status, expectedStatus);
  assert.equal(typeof response.body?.error, "string");
  assert.equal(typeof response.body?.code, "string");
  if (expectedCode) assert.equal(response.body.code, expectedCode);
  assert.deepEqual(Object.keys(response.body).sort(), ["code", "error"]);
  assert.doesNotMatch(JSON.stringify(response.body), /Revert fixture|Revert player|RR player/i);
}

function findPlayer(state: RevertSnapshot, playerId: number): Record<string, unknown> {
  const player = state.players.find((candidate) => (candidate as { id: number }).id === playerId);
  assert.ok(player);
  return player as Record<string, unknown>;
}

function normalizedRevertedState(state: RevertSnapshot): unknown {
  return {
    match: {
      status: (state.match as Record<string, unknown>).status,
      score1: (state.match as Record<string, unknown>).score1,
      score2: (state.match as Record<string, unknown>).score2,
      winnerId: (state.match as Record<string, unknown>).winner_id,
      isDraw: (state.match as Record<string, unknown>).is_draw,
      completedAt: (state.match as Record<string, unknown>).completed_at,
    },
    players: state.players.map((player) => {
      const row = player as Record<string, unknown>;
      return {
        seed: row.seed,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        points: row.points,
        status: row.status,
      };
    }),
    historyCount: state.history.length,
    logs: state.logs.map((log) => {
      const row = log as Record<string, unknown>;
      return { actionType: row.action_type, isUndone: row.is_undone };
    }),
  };
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
  revertMatchUseCase = (await import("../src/application/matches/revert-match")).revertMatch;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (testSchemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  }
  await database.pool.end();
});

describe("atomic RevertMatch", () => {
  test("reverts one legacy BO3 win atomically while preserving history and match structure", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);

    const response = await postRevert(fixture);
    assert.equal(response.status, 200);
    assert.equal(response.body.status, "pending");
    assert.equal(response.body.bestOf, 3);
    assert.equal(response.body.player1Id, fixture.playerIds[0]);
    assert.equal(response.body.player2Id, fixture.playerIds[1]);

    const state = await snapshot(fixture);
    assert.deepEqual(state.match, {
      id: fixture.matchId,
      tournament_id: fixture.tournamentId,
      round: 1,
      match_number: 1,
      player1_id: fixture.playerIds[0],
      player2_id: fixture.playerIds[1],
      status: "pending",
      score1: null,
      score2: null,
      winner_id: null,
      is_draw: false,
      best_of: 3,
      completed_at: null,
    });
    for (const player of state.players as Array<Record<string, unknown>>) {
      assert.equal(player.wins, 0);
      assert.equal(player.draws, 0);
      assert.equal(player.losses, 0);
      assert.equal(player.points, 0);
      assert.equal(player.status, "active");
    }
    assert.equal(state.history.length, 1);
    assert.equal((state.downstream as Record<string, unknown>).player1_id, null);
    assert.deepEqual(
      state.logs.map((log) => {
        const row = log as Record<string, unknown>;
        return { actionType: row.action_type, isUndone: row.is_undone, undoPayload: row.undo_payload };
      }),
      [
        {
          actionType: "match_result_submitted",
          isUndone: true,
          undoPayload: JSON.stringify({ type: "revert_match", matchId: fixture.matchId }),
        },
        { actionType: "match_result_reverted", isUndone: false, undoPayload: null },
      ],
    );
  });

  test("exactly reverses legacy draw counters and points", async () => {
    const fixture = await createFixture({ allowDraws: true });
    assert.equal((await postComplete(fixture, fixture.matchId, {
      score1: 1,
      score2: 1,
      winnerId: null,
      isDraw: true,
    })).status, 200);
    assert.equal((await postRevert(fixture)).status, 200);

    const state = await snapshot(fixture);
    for (const playerId of fixture.playerIds.slice(0, 2)) {
      const player = findPlayer(state, playerId);
      assert.equal(player.draws, 0);
      assert.equal(player.points, 0);
      assert.equal(player.wins, 0);
      assert.equal(player.losses, 0);
    }
    assert.equal(state.history.length, 1);
  });

  test("reopens a completed single-elimination final and restores both finalists", async () => {
    const fixture = await createFixture();
    assert.ok(fixture.secondMatchId);
    assert.ok(fixture.nextMatchId);
    assert.equal((await postComplete(fixture)).status, 200);
    assert.equal((await postComplete(fixture, fixture.secondMatchId)).status, 200);
    assert.equal((await postComplete(fixture, fixture.nextMatchId)).status, 200);

    const finalFixture = { ...fixture, matchId: fixture.nextMatchId, nextMatchId: null };
    assert.equal((await postRevert(finalFixture)).status, 200);
    const state = await snapshot(finalFixture);
    assert.deepEqual(state.tournament, { status: "active", winner_id: null, current_round: 2 });
    const winner = findPlayer(state, fixture.playerIds[0]);
    const loser = findPlayer(state, fixture.playerIds[2]);
    assert.deepEqual(
      { wins: winner.wins, losses: winner.losses, points: winner.points, status: winner.status },
      { wins: 1, losses: 0, points: 3, status: "active" },
    );
    assert.deepEqual(
      { wins: loser.wins, losses: loser.losses, points: loser.points, status: loser.status },
      { wins: 1, losses: 0, points: 3, status: "active" },
    );

    assert.equal((await postComplete(finalFixture)).status, 200);
    const replayedFinal = await snapshot(finalFixture);
    assert.deepEqual(replayedFinal.tournament, {
      status: "completed",
      winner_id: fixture.playerIds[0],
      current_round: 2,
    });
  });

  test("keeps currentRound at the active bracket round while a reverted semifinal remains operable", async () => {
    const fixture = await createFixture();
    assert.ok(fixture.secondMatchId);
    assert.equal((await postComplete(fixture)).status, 200);
    assert.equal((await postComplete(fixture, fixture.secondMatchId)).status, 200);
    assert.deepEqual((await snapshot(fixture)).tournament, {
      status: "active",
      winner_id: null,
      current_round: 2,
    });

    assert.equal((await postRevert(fixture)).status, 200);
    const reverted = await snapshot(fixture);
    assert.deepEqual(reverted.tournament, {
      status: "active",
      winner_id: null,
      current_round: 2,
    });
    assert.equal((reverted.match as Record<string, unknown>).status, "pending");
    assert.equal((reverted.downstream as Record<string, unknown>).player1_id, null);
    assert.equal((reverted.downstream as Record<string, unknown>).player2_id, fixture.playerIds[2]);

    const assistant = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/assistant`)
      .set(fixture.organizerHeaders);
    assert.equal(assistant.status, 200);
    assert.match(assistant.body.nextAction, /oczekuje/i);

    assert.equal((await postComplete(fixture)).status, 200);
    const replayed = await snapshot(fixture);
    assert.equal((replayed.tournament as Record<string, unknown>).current_round, 2);
    assert.equal(
      (replayed.downstream as Record<string, unknown>).player1_id,
      fixture.playerIds[0],
    );
  });

  test("rejects every started or terminal non-completed downstream state with no side effects", async () => {
    for (const status of ["in_progress", "postponed", "walkover", "bye", "cancelled"] as const) {
      const fixture = await createFixture();
      assert.ok(fixture.nextMatchId);
      assert.equal((await postComplete(fixture)).status, 200);
      await database.db
        .update(database.matchesTable)
        .set({ status })
        .where(eq(database.matchesTable.id, fixture.nextMatchId));
      const beforeState = await snapshot(fixture);

      const response = await postRevert(fixture);
      assertDomainError(response, 409, "DOWNSTREAM_BLOCKED");
      assert.deepEqual(await snapshot(fixture), beforeState);
    }
  });

  test("rejects a completed downstream match with 409 and no side effects", async () => {
    const fixture = await createFixture();
    assert.ok(fixture.secondMatchId);
    assert.ok(fixture.nextMatchId);
    assert.equal((await postComplete(fixture)).status, 200);
    assert.equal((await postComplete(fixture, fixture.secondMatchId)).status, 200);
    assert.equal((await postComplete(fixture, fixture.nextMatchId)).status, 200);
    const beforeState = await snapshot(fixture);

    const response = await postRevert(fixture);
    assertDomainError(response, 409, "DOWNSTREAM_BLOCKED");
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("rejects an unexpected downstream slot without clearing either participant", async () => {
    const fixture = await createFixture();
    assert.ok(fixture.nextMatchId);
    assert.equal((await postComplete(fixture)).status, 200);
    await database.db
      .update(database.matchesTable)
      .set({ player1Id: fixture.playerIds[2] })
      .where(eq(database.matchesTable.id, fixture.nextMatchId));
    const beforeState = await snapshot(fixture);

    const response = await postRevert(fixture);
    assertDomainError(response, 409, "DOWNSTREAM_BLOCKED");
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("returns 409 for a duplicate revert and never reverses statistics twice", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    assert.equal((await postRevert(fixture)).status, 200);
    const onceReverted = await snapshot(fixture);

    const response = await postRevert(fixture);
    assertDomainError(response, 409, "MATCH_NOT_COMPLETED");
    assert.deepEqual(await snapshot(fixture), onceReverted);
  });

  test("returns 409 for in-progress and postponed upstream matches without side effects", async () => {
    for (const status of ["in_progress", "postponed"] as const) {
      const fixture = await createFixture();
      await database.db
        .update(database.matchesTable)
        .set({ status })
        .where(eq(database.matchesTable.id, fixture.matchId));
      const beforeState = await snapshot(fixture);

      const response = await postRevert(fixture);
      assertDomainError(response, 409, "MATCH_NOT_COMPLETED");
      assert.deepEqual(await snapshot(fixture), beforeState);
    }
  });

  test("serializes two parallel reverts so exactly one succeeds", { timeout: 10_000 }, async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);

    const [first, second] = await Promise.all([postRevert(fixture), postRevert(fixture)]);
    assert.deepEqual([first.status, second.status].sort((a, b) => a - b), [200, 409]);
    const state = await snapshot(fixture);
    assert.equal((state.match as Record<string, unknown>).status, "pending");
    assert.equal(findPlayer(state, fixture.playerIds[0]).wins, 0);
    assert.equal(findPlayer(state, fixture.playerIds[1]).losses, 0);
    assert.equal(state.logs.filter((log) =>
      (log as Record<string, unknown>).action_type === "match_result_reverted").length, 1);
  });

  test("serializes direct revert and undo-last so one succeeds and one conflicts", { timeout: 10_000 }, async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);

    const [direct, undo] = await Promise.all([postRevert(fixture), postUndo(fixture)]);
    assert.deepEqual([direct.status, undo.status].sort((a, b) => a - b), [200, 409]);
    const state = await snapshot(fixture);
    assert.equal((state.match as Record<string, unknown>).status, "pending");
    assert.equal(findPlayer(state, fixture.playerIds[0]).wins, 0);
    assert.equal(findPlayer(state, fixture.playerIds[1]).losses, 0);
    assert.equal(state.logs.filter((log) =>
      (log as Record<string, unknown>).action_type === "match_result_reverted").length, 1);
  });

  test("rolls back match, stats, downstream, tournament and logs after an injected fault", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    const beforeState = await snapshot(fixture);

    await assert.rejects(
      () => revertMatchUseCase(
        { matchId: fixture.matchId, expectedTournamentId: fixture.tournamentId },
        { afterMatchReset: () => { throw new Error("controlled revert fault"); } },
      ),
      /controlled revert fault/,
    );
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("returns 422 and rolls back when legacy counters cannot be exactly reversed", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    await database.db
      .update(database.playersTable)
      .set({ points: 2 })
      .where(eq(database.playersTable.id, fixture.playerIds[0]));
    const beforeState = await snapshot(fixture);

    const response = await postRevert(fixture);
    assertDomainError(response, 422, "STATISTICS_INCONSISTENT");
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("denies anonymous and viewer credentials without changing a completed match", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    const beforeState = await snapshot(fixture);

    assert.equal((await postRevert(fixture, {})).status, 403);
    assert.equal((await postRevert(fixture, fixture.viewerHeaders)).status, 403);
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("allows both organizer and support under the existing write policy", async () => {
    const organizerFixture = await createFixture();
    assert.equal((await postComplete(organizerFixture)).status, 200);
    assert.equal((await postRevert(organizerFixture, organizerFixture.organizerHeaders)).status, 200);

    const supportFixture = await createFixture();
    assert.equal((await postComplete(supportFixture)).status, 200);
    assert.equal((await postRevert(supportFixture, supportFixture.supportHeaders)).status, 200);
  });

  test("rejects an organizer credential from tournament A for a match in tournament B", async () => {
    const fixtureA = await createFixture();
    const fixtureB = await createFixture();
    assert.equal((await postComplete(fixtureB)).status, 200);
    const beforeState = await snapshot(fixtureB);

    const response = await postRevert(fixtureB, fixtureA.organizerHeaders);
    assert.equal(response.status, 403);
    assert.deepEqual(await snapshot(fixtureB), beforeState);
  });

  test("reopens a completed round-robin tournament without selecting a replacement winner", async () => {
    const fixture = await createRoundRobinFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    const completed = await snapshot(fixture);
    assert.deepEqual(completed.tournament, {
      status: "completed",
      winner_id: fixture.playerIds[0],
      current_round: 1,
    });

    assert.equal((await postRevert(fixture)).status, 200);
    const reverted = await snapshot(fixture);
    assert.deepEqual(reverted.tournament, { status: "active", winner_id: null, current_round: 1 });
    assert.equal(findPlayer(reverted, fixture.playerIds[0]).status, "active");
    assert.equal(findPlayer(reverted, fixture.playerIds[0]).wins, 0);
    assert.equal(findPlayer(reverted, fixture.playerIds[0]).points, 0);
    assert.equal(findPlayer(reverted, fixture.playerIds[1]).losses, 0);

    const assistant = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/assistant`)
      .set(fixture.organizerHeaders);
    assert.equal(assistant.status, 200);
    assert.match(assistant.body.nextAction, /oczekuje/i);
    assert.equal((await postComplete(fixture)).status, 200);
    assert.deepEqual((await snapshot(fixture)).tournament, {
      status: "completed",
      winner_id: fixture.playerIds[0],
      current_round: 1,
    });
  });

  test("selects the latest completion through complete-revert-complete-revert", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    assert.equal((await postRevert(fixture)).status, 200);
    assert.equal((await postComplete(fixture, fixture.matchId, {
      score1: 2,
      score2: 1,
      winnerId: fixture.playerIds[0],
      isDraw: false,
    })).status, 200);

    assert.equal((await postRevert(fixture)).status, 200);
    const state = await snapshot(fixture);
    assert.equal(state.history.length, 2);
    assert.deepEqual(
      state.history.map((history) => {
        const row = history as Record<string, unknown>;
        return { score1: row.score1, score2: row.score2, winnerId: row.winner_id };
      }),
      [
        { score1: 1, score2: 0, winnerId: fixture.playerIds[0] },
        { score1: 2, score2: 1, winnerId: fixture.playerIds[0] },
      ],
    );
    const completionLogs = state.logs.filter((log) =>
      (log as Record<string, unknown>).action_type === "match_result_submitted") as Array<Record<string, unknown>>;
    assert.deepEqual(completionLogs.map((log) => log.is_undone), [true, true]);
    const revertLogs = state.logs.filter((log) =>
      (log as Record<string, unknown>).action_type === "match_result_reverted") as Array<Record<string, unknown>>;
    assert.deepEqual(revertLogs.map((log) => log.is_undone), [false, false]);
    assert.equal((state.match as Record<string, unknown>).status, "pending");
  });

  test("blocks reverting an earlier Swiss result after the next pairing was generated", async () => {
    const fixture = await createSwissFixture();
    assert.ok(fixture.secondMatchId);
    assert.equal((await postComplete(fixture)).status, 200);
    assert.equal((await postComplete(fixture, fixture.secondMatchId)).status, 200);
    const generated = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/generate-round`)
      .set(fixture.organizerHeaders)
      .send();
    assert.equal(generated.status, 200);
    assert.equal(generated.body.currentRound, 2);
    const beforeState = await snapshot(fixture);
    const beforePairings = await database.pool.query(
      `SELECT id, round, match_number, player1_id, player2_id, status
         FROM matches WHERE tournament_id = $1 ORDER BY round, match_number, id`,
      [fixture.tournamentId],
    );

    const response = await postRevert(fixture);
    assertDomainError(response, 409, "DOWNSTREAM_BLOCKED");
    assert.deepEqual(await snapshot(fixture), beforeState);
    const afterPairings = await database.pool.query(
      `SELECT id, round, match_number, player1_id, player2_id, status
         FROM matches WHERE tournament_id = $1 ORDER BY round, match_number, id`,
      [fixture.tournamentId],
    );
    assert.deepEqual(afterPairings.rows, beforePairings.rows);
  });

  test("undo-last produces the same domain state as direct revert", async () => {
    const directFixture = await createFixture();
    const undoFixture = await createFixture();
    assert.equal((await postComplete(directFixture)).status, 200);
    assert.equal((await postComplete(undoFixture)).status, 200);

    assert.equal((await postRevert(directFixture)).status, 200);
    const undoResponse = await postUndo(undoFixture);
    assert.equal(undoResponse.status, 200);
    assert.equal(undoResponse.body.action.actionType, "match_result_submitted");
    assert.equal(undoResponse.body.action.isUndone, true);
    assert.equal(undoResponse.body.action.canUndo, false);
    assert.deepEqual(
      normalizedRevertedState(await snapshot(undoFixture)),
      normalizedRevertedState(await snapshot(directFixture)),
    );
  });

  test("preserves undo-last handling for a non-result restore_status action", async () => {
    const fixture = await createFixture();
    const patchResponse = await request(app)
      .patch(`/api/matches/${fixture.matchId}`)
      .set(fixture.organizerHeaders)
      .send({ status: "in_progress" });
    assert.equal(patchResponse.status, 200);

    const undoResponse = await postUndo(fixture);
    assert.equal(undoResponse.status, 200);
    const match = await database.pool.query("SELECT status FROM matches WHERE id = $1", [fixture.matchId]);
    assert.deepEqual(match.rows[0], { status: "pending" });
  });

  test("keeps every observable complete/revert race outcome coherent and deadlock-free", { timeout: 10_000 }, async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);

    const [completeResponse, revertResponse] = await Promise.all([
      postComplete(fixture),
      postRevert(fixture),
    ]);
    assert.equal(revertResponse.status, 200);
    assert.ok(completeResponse.status === 200 || completeResponse.status === 409);

    const state = await snapshot(fixture);
    const matchStatus = (state.match as Record<string, unknown>).status;
    const winner = findPlayer(state, fixture.playerIds[0]);
    const loser = findPlayer(state, fixture.playerIds[1]);
    const revertLogs = state.logs.filter((log) =>
      (log as Record<string, unknown>).action_type === "match_result_reverted");
    assert.equal(revertLogs.length, 1);
    if (matchStatus === "pending") {
      assert.equal(completeResponse.status, 409);
      assert.equal(winner.wins, 0);
      assert.equal(winner.points, 0);
      assert.equal(loser.losses, 0);
      assert.equal(state.history.length, 1);
      assert.equal((state.downstream as Record<string, unknown>).player1_id, null);
    } else {
      assert.equal(matchStatus, "completed");
      assert.equal(completeResponse.status, 200);
      assert.equal(winner.wins, 1);
      assert.equal(winner.points, 3);
      assert.equal(loser.losses, 1);
      assert.equal(state.history.length, 2);
      assert.equal((state.downstream as Record<string, unknown>).player1_id, fixture.playerIds[0]);
    }
  });

  test("returns 422 for an internally inconsistent stored winner without side effects", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    await database.db
      .update(database.matchesTable)
      .set({ winnerId: fixture.playerIds[1] })
      .where(eq(database.matchesTable.id, fixture.matchId));
    const beforeState = await snapshot(fixture);

    const response = await postRevert(fixture);
    assertDomainError(response, 422, "RESULT_INCONSISTENT");
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("requires one active supported completion log and never marks multiple logs", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    await database.db.insert(database.actionLogTable).values({
      tournamentId: fixture.tournamentId,
      actionType: "match_result_submitted",
      description: "Synthetic duplicate for integrity test",
      matchId: fixture.matchId,
      undoPayload: JSON.stringify({ type: "revert_match", matchId: fixture.matchId }),
      isUndone: false,
    });
    const beforeState = await snapshot(fixture);

    const response = await postRevert(fixture);
    assertDomainError(response, 422, "COMPLETION_LOG_AMBIGUOUS");
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("returns 404 and performs no writes when the required history revision is missing", async () => {
    const fixture = await createFixture();
    assert.equal((await postComplete(fixture)).status, 200);
    await database.pool.query("DELETE FROM result_history WHERE match_id = $1", [fixture.matchId]);
    const beforeState = await snapshot(fixture);

    const response = await postRevert(fixture);
    assertDomainError(response, 404, "RESULT_HISTORY_NOT_FOUND");
    assert.deepEqual(await snapshot(fixture), beforeState);
  });
});
