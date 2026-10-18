import { matchRevision } from "./match-revision-fixture";
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
  return request(app).post(`/api/matches/${matchId}/complete`).set(fixture.organizerHeaders).send({ expectedRevision: await matchRevision(database, matchId), ...(payload) });
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


/**
 * MP2A / OPS-01: a queued undo must not act on an action selected before a
 * concurrent tournament mutation committed a newer undoable action.
 * pg_blocking_pids proves X already reached the tournament row lock,
 * avoiding timing-based sleeps or test-only HTTP hooks.
 */
async function waitUntilTournamentLockIsQueued(blockerPid: number): Promise<void> {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const observed = await database.pool.query(
      "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid <> $1 AND $1 = ANY(pg_blocking_pids(pid))) AS queued",
      [blockerPid],
    );
    if (observed.rows[0]?.queued === true) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
  }
  throw new Error("MP2A_TEST_BARRIER_TIMEOUT: expected queued tournament lock waiter");
}

for (const target of ["revert_match", "restore_status"] as const) {
  test("MP2A global LIFO: stale queued " + target + " returns 409 and never writes", async () => {
    const f = await createFixture({ format: "single_elimination", bracket: true });
    assert.ok(f.secondMatchId !== null);
    if (target === "revert_match") {
      assert.equal((await complete(f)).status, 200);
    } else {
      const started = await request(app).patch("/api/matches/" + f.matchId)
        .set(f.organizerHeaders).send({ status: "in_progress" });
      assert.equal(started.status, 200);
    }

    const before = await snapshot(f);
    const initialAction = await database.pool.query(
      "SELECT id,action_type,is_undone FROM action_log WHERE tournament_id=$1 AND undo_payload IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 1",
      [f.tournamentId],
    );
    assert.equal(initialAction.rows[0]?.action_type,
      target === "revert_match" ? "match_result_submitted" : "match_started");

    const blocker = await database.pool.connect();
    let committed = false;
    let xPromise: Promise<Response> | undefined;
    try {
      await blocker.query("BEGIN");
      const pid = await blocker.query("SELECT pg_backend_pid()::int AS pid");
      await blocker.query("SELECT id FROM tournaments WHERE id=$1 FOR UPDATE", [f.tournamentId]);

      // X sees the older candidate and queues behind B's tournament lock.
      xPromise = undo(f);
      await waitUntilTournamentLockIsQueued(pid.rows[0].pid);

      // Y commits before X obtains its lock and must remain the latest.
      await blocker.query("UPDATE matches SET status='in_progress' WHERE id=$1", [f.secondMatchId]);
      const later = await blocker.query(
        "INSERT INTO action_log (tournament_id,action_type,description,match_id,undo_payload) VALUES ($1,'match_started','MP2A newer action',$2,$3) RETURNING id",
        [f.tournamentId, f.secondMatchId,
          JSON.stringify({ type: "restore_status", matchId: f.secondMatchId, prevStatus: "pending" })],
      );
      const laterId: number = later.rows[0].id;
      await blocker.query("COMMIT");
      committed = true;

      const rejected = await xPromise;
      assertError(rejected, 409, "UNDO_ACTION_CHANGED");
      const after = await snapshot(f);
      assert.deepEqual(after.match, before.match);
      assert.deepEqual(after.players, before.players);
      assert.deepEqual(after.history, before.history);
      assert.deepEqual(after.downstream, before.downstream);
      assert.deepEqual(after.tournament, before.tournament);
      assert.deepEqual(after.actions, before.actions);
      const actionRows = await database.pool.query(
        "SELECT id,action_type,is_undone FROM action_log WHERE tournament_id=$1 ORDER BY id",
        [f.tournamentId],
      );
      assert.equal(actionRows.rows.length, 2, "one original and one newer action; X added none");
      assert.deepEqual(actionRows.rows.map((r) => r.is_undone), [false, false]);
      assert.equal(actionRows.rows[0].id, initialAction.rows[0].id);
      assert.equal(actionRows.rows[1].id, laterId);
      const second = await database.pool.query("SELECT status FROM matches WHERE id=$1", [f.secondMatchId]);
      assert.equal(second.rows[0].status, "in_progress", "newer mutation remains committed");
    } finally {
      if (!committed) await blocker.query("ROLLBACK");
      blocker.release();
      if (xPromise) await xPromise.catch(() => undefined);
    }
  });
}


/**
 * T040 R17 / P09: roster Undo must obey the same global latest undoable action
 * as result/status Undo. These are real PG-lock tests, not timing-only mocks.
 * All records below are synthetic and live only in the isolated test schema.
 */
type RosterUndoKind = "delete_player" | "restore_player";

async function createDraftRosterUndoFixture(kind: RosterUndoKind) {
  const suffix = randomUUID();
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: "Roster LIFO " + suffix,
    format: "single_elimination",
    status: "draft",
    visibility: "public_online",
    organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
    defaultBestOf: 3,
    currentRound: 1,
    totalRounds: 2,
  }).returning();
  const [player] = await database.db.insert(database.playersTable).values({
    tournamentId: tournament.id,
    name: (kind === "restore_player" ? "Edited-" : "Added-") + suffix,
    seed: 1,
  }).returning();
  const previousName = "Original-" + suffix;
  const payload = kind === "delete_player"
    ? { type: kind, playerId: player.id }
    : { type: kind, playerId: player.id, prevData: {
      name: previousName, seed: 1, rank: null, country: null, teamName: null,
    } };
  const action = await database.pool.query(
    "INSERT INTO action_log (tournament_id,action_type,description,undo_payload,is_undone) " +
    "VALUES ($1,$2,$3,$4,false) RETURNING id",
    [tournament.id, kind === "delete_player" ? "player_added" : "player_edited",
      "R17 original roster action", JSON.stringify(payload)],
  );
  return {
    tournamentId: tournament.id,
    playerId: player.id,
    originalActionId: action.rows[0].id as number,
    previousName,
    organizerHeaders: {
      "x-organizer-token": signOrganizerToken(tournament.id, ORGANIZER_PASSWORD_HASH),
    },
  };
}

async function undoRoster(fixture: { tournamentId: number; organizerHeaders: Headers }): Promise<Response> {
  return request(app).post("/api/tournaments/" + fixture.tournamentId + "/undo-last")
    .set(fixture.organizerHeaders).send({});
}

async function rosterUndoState(
  tournamentId: number,
  query: (statement: string, values: unknown[]) => Promise<{ rows: unknown[] }>,
) {
  const statements = [
    "SELECT * FROM tournaments WHERE id=$1 ORDER BY id",
    "SELECT * FROM players WHERE tournament_id=$1 ORDER BY id",
    "SELECT * FROM action_log WHERE tournament_id=$1 ORDER BY id",
    "SELECT * FROM matches WHERE tournament_id=$1 ORDER BY id",
    "SELECT * FROM result_history WHERE tournament_id=$1 ORDER BY id",
    "SELECT * FROM tournament_stages WHERE tournament_id=$1 ORDER BY id",
    "SELECT * FROM stage_participants WHERE tournament_id=$1 ORDER BY id",
    "SELECT * FROM match_game_picks WHERE match_id IN " +
      "(SELECT id FROM matches WHERE tournament_id=$1) ORDER BY match_id,game_number",
  ];
  const snapshots: unknown[] = [];
  for (const statement of statements) {
    const result = await query(statement, [tournamentId]);
    snapshots.push(JSON.parse(JSON.stringify(result.rows)));
  }
  return snapshots;
}

for (const kind of ["delete_player", "restore_player"] as const) {
  test("MP2A roster LIFO: queued stale " + kind +
    " rejects with 409 and preserves committed newer action", async () => {
    const fixture = await createDraftRosterUndoFixture(kind);
    const blocker = await database.pool.connect();
    let committed = false;
    let xPromise: Promise<Response> | undefined;
    try {
      await blocker.query("BEGIN");
      const pid = await blocker.query("SELECT pg_backend_pid()::int AS pid");
      await blocker.query("SELECT id FROM tournaments WHERE id=$1 FOR UPDATE",
        [fixture.tournamentId]);

      // X observes old roster action before it can lock the draft tournament.
      xPromise = undoRoster(fixture);
      await waitUntilTournamentLockIsQueued(pid.rows[0].pid);

      // Y is a second legitimate roster addition, committed while X waits.
      const laterPlayer = await blocker.query(
        "INSERT INTO players (tournament_id,name,seed) VALUES ($1,$2,$3) RETURNING id",
        [fixture.tournamentId, "Newer-" + randomUUID(), 2],
      );
      const later = await blocker.query(
        "INSERT INTO action_log (tournament_id,action_type,description,undo_payload,is_undone) " +
        "VALUES ($1,'player_added','R17 newer roster action',$2,false) RETURNING id",
        [fixture.tournamentId,
          JSON.stringify({ type: "delete_player", playerId: laterPlayer.rows[0].id })],
      );

      // Snapshot Y while B still owns the lock: this cannot race with X.
      const expected = await rosterUndoState(fixture.tournamentId,
        (sql, args) => blocker.query(sql, args));
      await blocker.query("COMMIT");
      committed = true;

      const staleResponse = await xPromise;
      assertError(staleResponse, 409, "UNDO_ACTION_CHANGED");
      const actual = await rosterUndoState(fixture.tournamentId,
        (sql, args) => database.pool.query(sql, args));
      assert.deepEqual(actual, expected, "stale X did not write or undo Y");
      const actions = await database.pool.query(
        "SELECT id,is_undone FROM action_log WHERE tournament_id=$1 ORDER BY id",
        [fixture.tournamentId],
      );
      assert.deepEqual(actions.rows.map((row: any) => [row.id, row.is_undone]), [
        [fixture.originalActionId, false], [later.rows[0].id, false],
      ]);

      // Newly latest Y remains undoable, proving no global Undo deadlock.
      const current = await undoRoster(fixture);
      assert.equal(current.status, 200, current.text);
      const laterAfter = await database.pool.query("SELECT id FROM players WHERE id=$1",
        [laterPlayer.rows[0].id]);
      assert.equal(laterAfter.rows.length, 0);
    } finally {
      if (!committed) await blocker.query("ROLLBACK");
      blocker.release();
      if (xPromise) await xPromise.catch(() => undefined);
    }
  });

  test("MP2A roster LIFO: latest valid " + kind + " still undoes exactly once", async () => {
    const fixture = await createDraftRosterUndoFixture(kind);
    const response = await undoRoster(fixture);
    assert.equal(response.status, 200, response.text);
    const action = await database.pool.query(
      "SELECT is_undone FROM action_log WHERE id=$1", [fixture.originalActionId]);
    assert.equal(action.rows[0].is_undone, true);
    const player = await database.pool.query(
      "SELECT name FROM players WHERE id=$1", [fixture.playerId]);
    if (kind === "delete_player") {
      assert.equal(player.rows.length, 0);
    } else {
      assert.equal(player.rows[0]?.name, fixture.previousName);
    }
    const repeated = await undoRoster(fixture);
    assert.notEqual(repeated.status, 200, "same roster action cannot be undone twice");
  });
}
