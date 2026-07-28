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

interface Fixture {
  tournamentId: number;
  matchId: number;
  secondMatchId: number | null;
  nextMatchId: number | null;
  playerIds: [number, number, number, number];
  organizerHeaders: Headers;
  supportHeaders: Headers;
  viewerHeaders: Headers;
  format: Format;
}

const SESSION_SECRET = `revert-series-v1-${randomUUID()}`;
const ORGANIZER_PASSWORD_HASH = "test-organizer-hash";
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let signViewerToken: typeof import("../src/auth").signViewerToken;
let revertUseCase: typeof import("../src/application/matches/revert-match").revertMatch;

async function createFixture(options: { format?: Format; bracket?: boolean; bestOf?: number } = {}): Promise<Fixture> {
  const suffix = randomUUID();
  const format = options.format ?? "single_elimination";
  const bracket = options.bracket ?? format === "single_elimination";
  const bestOf = options.bestOf ?? 3;
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: `Revert ${suffix}`,
    format,
    status: "active",
    visibility: "public_online",
    organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
    defaultBestOf: bestOf,
    currentRound: 1,
    totalRounds: bracket ? 2 : 1,
    swissRounds: format === "swiss" ? 3 : null,
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
    status: "pending",
  }];
  if (bracket) {
    values.push(
      { tournamentId: tournament.id, round: 1, matchNumber: 2, player1Id: players[2].id, player2Id: players[3].id, bestOf, status: "pending" },
      { tournamentId: tournament.id, round: 2, matchNumber: 1, bestOf, status: "pending" },
    );
  }
  const matches = await database.db.insert(database.matchesTable).values(values).returning();
  const supportToken = randomUUID();
  await database.db.insert(database.supportSessionsTable).values({ tournamentId: tournament.id, nick: "Support", sessionToken: supportToken });
  return {
    tournamentId: tournament.id,
    matchId: matches[0].id,
    secondMatchId: bracket ? matches[1].id : null,
    nextMatchId: bracket ? matches[2].id : null,
    playerIds: [players[0].id, players[1].id, players[2].id, players[3].id],
    organizerHeaders: {
      "x-organizer-token": signOrganizerToken(
        tournament.id,
        ORGANIZER_PASSWORD_HASH,
      ),
    },
    supportHeaders: { "x-support-token": supportToken },
    viewerHeaders: { "x-viewer-token": signViewerToken(tournament.id) },
    format,
  };
}

async function complete(
  fixture: Fixture,
  payload: Record<string, unknown> = { resultType: "played", score1: 2, score2: 1 },
  matchId = fixture.matchId,
): Promise<Response> {
  return request(app).post(`/api/matches/${matchId}/complete`).set(fixture.organizerHeaders).send(payload);
}

async function revert(fixture: Fixture, headers: Headers = fixture.organizerHeaders): Promise<Response> {
  return request(app).post(`/api/matches/${fixture.matchId}/revert`).set(headers).send({});
}

async function undo(fixture: Fixture, headers: Headers = fixture.organizerHeaders): Promise<Response> {
  return request(app).post(`/api/tournaments/${fixture.tournamentId}/undo-last`).set(headers).send({});
}

async function snapshot(fixture: Fixture) {
  const [match, players, history, actions, downstream, tournament] = await Promise.all([
    database.pool.query("SELECT status, result_type, result_reason, score1, score2, winner_id, completed_at FROM matches WHERE id = $1", [fixture.matchId]),
    database.pool.query("SELECT id, status FROM players WHERE tournament_id = $1 ORDER BY id", [fixture.tournamentId]),
    database.pool.query("SELECT revision, result_type, result_reason, score1, score2, winner_id FROM result_history WHERE match_id = $1 ORDER BY revision", [fixture.matchId]),
    database.pool.query("SELECT action_type, is_undone, undo_payload FROM action_log WHERE match_id = $1 ORDER BY id", [fixture.matchId]),
    fixture.nextMatchId == null ? Promise.resolve({ rows: [] }) : database.pool.query("SELECT player1_id, player2_id, status, result_type FROM matches WHERE id = $1", [fixture.nextMatchId]),
    database.pool.query("SELECT status, winner_id, current_round FROM tournaments WHERE id = $1", [fixture.tournamentId]),
  ]);
  return {
    match: match.rows[0],
    players: players.rows,
    history: history.rows,
    actions: actions.rows,
    downstream: downstream.rows[0],
    tournament: tournament.rows[0],
  };
}

function assertError(response: Response, status: number, code?: string): void {
  assert.equal(response.status, status);
  assert.equal(typeof response.body?.error, "string");
  if (code) assert.equal(response.body?.code, code);
}

async function assertBasicRevert(
  payload: Record<string, unknown>,
  format: Format = "single_elimination",
): Promise<void> {
  const fixture = await createFixture({ format, bracket: format === "single_elimination" });
  assert.equal((await complete(fixture, payload)).status, 200);
  const before = await snapshot(fixture);
  assert.equal((before.match as any).status, "completed");
  const response = await revert(fixture);
  assert.equal(response.status, 200);
  const state = await snapshot(fixture);
  assert.deepEqual(state.match, {
    status: "pending", result_type: null, result_reason: null, score1: null,
    score2: null, winner_id: null, completed_at: null,
  });
  assert.equal(state.history.length, 1);
  assert.equal(state.actions.filter((action: any) => action.action_type === "match_result_submitted" && action.is_undone).length, 1);
  assert.equal(state.actions.filter((action: any) => action.action_type === "match_result_reverted").length, 1);
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
  signOrganizerToken = auth.signVersionedOrganizerToken;
  signViewerToken = auth.signViewerToken;
  revertUseCase = (await import("../src/application/matches/revert-match")).revertMatch;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  await database.pool.end();
});

describe("RevertMatch series_v1 result types", () => {
  test("reverts played and preserves its history", () => assertBasicRevert({ resultType: "played", score1: 2, score2: 1 }));
  test("reverts walkover and clears reason without inventing score", async () => {
    const fixture = await createFixture();
    assert.equal((await complete(fixture, { resultType: "walkover", winnerId: fixture.playerIds[0], reason: "nieobecność" })).status, 200);
    assert.equal((await revert(fixture)).status, 200);
    assert.deepEqual((await snapshot(fixture)).match, {
      status: "pending", result_type: null, result_reason: null, score1: null,
      score2: null, winner_id: null, completed_at: null,
    });
  });

  test("reverts walkover with the actual participant and restores standings", async () => {
    const fixture = await createFixture({ format: "round_robin", bracket: false });
    assert.equal((await complete(fixture, { resultType: "walkover", winnerId: fixture.playerIds[0], reason: "nieobecność" })).status, 200);
    const before = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`);
    assert.equal(before.body.find((entry: any) => entry.playerId === fixture.playerIds[0]).matchWins, 1);
    assert.equal((await revert(fixture)).status, 200);
    const afterState = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`);
    assert.ok(afterState.body.every((entry: any) => entry.matchWins === 0 && entry.matchLosses === 0 && entry.gameDiff === 0));
  });

  test("reverts no contest without changing any match or game record", async () => {
    const fixture = await createFixture({ format: "round_robin", bracket: false });
    assert.equal((await complete(fixture, { resultType: "no_contest", reason: "awaria" })).status, 200);
    assert.equal((await revert(fixture)).status, 200);
    const standings = await request(app).get(`/api/tournaments/${fixture.tournamentId}/standings`);
    assert.ok(standings.body.every((entry: any) => entry.matchesPlayed === 0 && entry.gameWins === 0));
  });

  test("blocks manual revert of a system bye", async () => {
    const fixture = await createFixture({ format: "swiss", bracket: false });
    const now = new Date();
    await database.pool.query(
      "UPDATE matches SET player2_id = NULL, status = 'completed', result_type = 'bye', result_reason = 'system_bye', winner_id = $1, completed_at = $2 WHERE id = $3",
      [fixture.playerIds[0], now, fixture.matchId],
    );
    await database.pool.query(
      "INSERT INTO result_history (match_id,tournament_id,revision,round,match_number,player1_id,player2_id,winner_id,best_of,result_type,result_reason,completed_at) VALUES ($1,$2,1,1,1,$3,NULL,$3,3,'bye','system_bye',$4)",
      [fixture.matchId, fixture.tournamentId, fixture.playerIds[0], now],
    );
    await database.pool.query(
      "INSERT INTO action_log (tournament_id,action_type,description,match_id,undo_payload) VALUES ($1,'match_result_submitted','system bye',$2,$3)",
      [fixture.tournamentId, fixture.matchId, JSON.stringify({ type: "revert_match", matchId: fixture.matchId })],
    );
    assertError(await revert(fixture), 409, "SYSTEM_BYE_REVERT_BLOCKED");
  });
});

describe("RevertMatch authorization and input guards", () => {
  test("support may revert", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    assert.equal((await revert(fixture, fixture.supportHeaders)).status, 200);
  });

  test("viewer may not revert", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    assert.equal((await revert(fixture, fixture.viewerHeaders)).status, 403);
  });

  test("anonymous caller may not revert", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    assert.equal((await revert(fixture, {})).status, 403);
  });

  for (const lifecycle of ["pending", "in_progress", "postponed", "cancelled"] as const) {
    test(`rejects non-completed lifecycle ${lifecycle}`, async () => {
      const fixture = await createFixture({ format: "round_robin", bracket: false });
      await database.pool.query("UPDATE matches SET status = $1 WHERE id = $2", [lifecycle, fixture.matchId]);
      assertError(await revert(fixture), 409, "MATCH_NOT_COMPLETED");
    });
  }

  test("rejects a missing match", async () => {
    const fixture = await createFixture();
    const response = await request(app).post("/api/matches/2147483647/revert").set(fixture.organizerHeaders).send({});
    assert.equal(response.status, 404);
  });

  test("use case rejects an expected tournament mismatch", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await assert.rejects(revertUseCase({ matchId: fixture.matchId, expectedTournamentId: fixture.tournamentId + 1 }), (error: any) => error.code === "TOURNAMENT_MISMATCH");
  });
});

describe("RevertMatch downstream safety", () => {
  test("clears the exact pristine downstream slot", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    assert.equal((await snapshot(fixture)).downstream.player1_id, fixture.playerIds[0]);
    assert.equal((await revert(fixture)).status, 200);
    assert.equal((await snapshot(fixture)).downstream.player1_id, null);
  });

  for (const lifecycle of ["in_progress", "postponed", "cancelled"] as const) {
    test(`blocks when downstream lifecycle is ${lifecycle}`, async () => {
      const fixture = await createFixture();
      await complete(fixture);
      await database.pool.query("UPDATE matches SET status = $1 WHERE id = $2", [lifecycle, fixture.nextMatchId]);
      const beforeState = await snapshot(fixture);
      assertError(await revert(fixture), 409, "DOWNSTREAM_BLOCKED");
      assert.deepEqual(await snapshot(fixture), beforeState);
    });
  }

  test("blocks a completed downstream match", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query(
      "UPDATE matches SET player2_id = $1, status='completed', result_type='played', score1=2, score2=0, winner_id=player1_id, completed_at=NOW() WHERE id=$2",
      [fixture.playerIds[2], fixture.nextMatchId],
    );
    assertError(await revert(fixture), 409, "DOWNSTREAM_BLOCKED");
  });

  test("blocks when the downstream slot no longer contains the winner", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query("UPDATE matches SET player1_id=$1 WHERE id=$2", [fixture.playerIds[3], fixture.nextMatchId]);
    assertError(await revert(fixture), 409, "DOWNSTREAM_BLOCKED");
  });

  test("blocks an earlier Swiss result after a later round exists", async () => {
    const fixture = await createFixture({ format: "swiss", bracket: false });
    await complete(fixture);
    await database.db.insert(database.matchesTable).values({ tournamentId: fixture.tournamentId, round: 2, matchNumber: 1, bestOf: 3, status: "pending" });
    assertError(await revert(fixture), 409, "DOWNSTREAM_BLOCKED");
  });

  test("blocks an earlier Swiss result when currentRound already advanced", async () => {
    const fixture = await createFixture({ format: "swiss", bracket: false });
    await complete(fixture);
    await database.pool.query("UPDATE tournaments SET current_round=2 WHERE id=$1", [fixture.tournamentId]);
    assertError(await revert(fixture), 409, "DOWNSTREAM_BLOCKED");
  });
});

describe("RevertMatch integrity checks", () => {
  test("rejects a stored played score that violates its BO threshold", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query("UPDATE matches SET score1=1, score2=0 WHERE id=$1", [fixture.matchId]);
    await database.pool.query("UPDATE result_history SET score1=1, score2=0 WHERE match_id=$1", [fixture.matchId]);
    assertError(await revert(fixture), 422, "RESULT_INCONSISTENT");
  });

  test("rejects missing result history", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query("DELETE FROM result_history WHERE match_id=$1", [fixture.matchId]);
    assertError(await revert(fixture), 422, "RESULT_HISTORY_NOT_FOUND");
  });

  test("rejects history that differs from current result", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query("UPDATE result_history SET result_reason='tampered' WHERE match_id=$1", [fixture.matchId]);
    assertError(await revert(fixture), 422, "HISTORY_INCONSISTENT");
  });

  test("rejects an already-undone completion action", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query("UPDATE action_log SET is_undone=true WHERE match_id=$1 AND action_type='match_result_submitted'", [fixture.matchId]);
    assertError(await revert(fixture), 409, "COMPLETION_ALREADY_UNDONE");
  });

  test("rejects ambiguous active completion logs", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query(
      "INSERT INTO action_log(tournament_id,action_type,description,match_id,undo_payload) VALUES($1,'match_result_submitted','duplicate',$2,$3)",
      [fixture.tournamentId, fixture.matchId, JSON.stringify({ type: "revert_match", matchId: fixture.matchId })],
    );
    assertError(await revert(fixture), 422, "COMPLETION_LOG_AMBIGUOUS");
  });

  test("rejects a malformed completion undo payload", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    await database.pool.query("UPDATE action_log SET undo_payload='{}' WHERE match_id=$1 AND action_type='match_result_submitted'", [fixture.matchId]);
    assertError(await revert(fixture), 422, "COMPLETION_LOG_AMBIGUOUS");
  });
});

describe("RevertMatch atomicity and shared undo", () => {
  test("duplicate direct revert changes state exactly once", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    assert.equal((await revert(fixture)).status, 200);
    assertError(await revert(fixture), 409, "MATCH_NOT_COMPLETED");
    assert.equal((await snapshot(fixture)).history.length, 1);
  });

  test("concurrent revert/revert has one success", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    const responses = await Promise.all(Array.from({ length: 6 }, () => revert(fixture)));
    assert.equal(responses.filter((response) => response.status === 200).length, 1);
    assert.equal(responses.filter((response) => response.status === 409).length, 5);
    assert.equal((await snapshot(fixture)).actions.filter((action: any) => action.action_type === "match_result_reverted").length, 1);
  });

  test("concurrent direct revert and undo-last share one transaction path", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    const responses = await Promise.all([revert(fixture), undo(fixture)]);
    assert.equal(responses.filter((response) => response.status === 200).length, 1);
    assert.equal((await snapshot(fixture)).actions.filter((action: any) => action.action_type === "match_result_reverted").length, 1);
  });

  test("complete/revert race leaves a valid complete or pending state", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    const [revertResponse, completeResponse] = await Promise.all([
      revert(fixture),
      complete(fixture, { resultType: "played", score1: 2, score2: 0 }),
    ]);
    assert.equal(revertResponse.status, 200);
    assert.ok([200, 409].includes(completeResponse.status));
    const state = await snapshot(fixture);
    assert.ok(["pending", "completed"].includes((state.match as any).status));
    assert.equal(state.history.length, completeResponse.status === 200 ? 2 : 1);
  });

  test("fault after match reset rolls back every write", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    const beforeState = await snapshot(fixture);
    await assert.rejects(
      revertUseCase(
        { matchId: fixture.matchId, expectedTournamentId: fixture.tournamentId },
        { afterMatchReset: () => { throw new Error("injected rollback"); } },
      ),
      /injected rollback/,
    );
    assert.deepEqual(await snapshot(fixture), beforeState);
  });

  test("undo-last reverts a completed match and preserves history", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    assert.equal((await undo(fixture)).status, 200);
    const state = await snapshot(fixture);
    assert.equal((state.match as any).status, "pending");
    assert.equal(state.history.length, 1);
  });

  test("duplicate undo-last does not revert twice", async () => {
    const fixture = await createFixture();
    await complete(fixture);
    assert.equal((await undo(fixture)).status, 200);
    assert.notEqual((await undo(fixture)).status, 200);
  });

  test("complete → revert → complete → revert creates ordered immutable revisions", async () => {
    const fixture = await createFixture();
    assert.equal((await complete(fixture, { resultType: "played", score1: 2, score2: 0 })).status, 200);
    assert.equal((await revert(fixture)).status, 200);
    assert.equal((await complete(fixture, { resultType: "walkover", winnerId: fixture.playerIds[1], reason: "round two" })).status, 200);
    assert.equal((await revert(fixture)).status, 200);
    const state = await snapshot(fixture);
    assert.deepEqual(state.history.map((entry: any) => [entry.revision, entry.result_type]), [[1, "played"], [2, "walkover"]]);
  });
});

describe("RevertMatch tournament finalization", () => {
  test("reopens a completed single-elimination final", async () => {
    const fixture = await createFixture();
    assert.equal((await complete(fixture)).status, 200);
    assert.equal((await complete(fixture, { resultType: "played", score1: 0, score2: 2 }, fixture.secondMatchId!)).status, 200);
    assert.equal((await complete(fixture, { resultType: "played", score1: 2, score2: 0 }, fixture.nextMatchId!)).status, 200);
    const finalFixture = { ...fixture, matchId: fixture.nextMatchId!, nextMatchId: null };
    assert.equal((await snapshot(finalFixture)).tournament.status, "completed");
    assert.equal((await revert(finalFixture)).status, 200);
    const state = await snapshot(finalFixture);
    assert.equal(state.tournament.status, "active");
    assert.equal(state.tournament.winner_id, null);
  });

  test("reopens a completed round-robin tournament", async () => {
    const fixture = await createFixture({ format: "round_robin", bracket: false });
    await complete(fixture);
    assert.equal((await snapshot(fixture)).tournament.status, "completed");
    assert.equal((await revert(fixture)).status, 200);
    assert.equal((await snapshot(fixture)).tournament.status, "active");
  });

  test("players table contains no materialized standings counters", async () => {
    const columns = await database.pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='players' ORDER BY column_name",
    );
    const names = columns.rows.map((row: any) => row.column_name);
    for (const removed of ["wins", "draws", "losses", "points"]) assert.equal(names.includes(removed), false);
  });
});
