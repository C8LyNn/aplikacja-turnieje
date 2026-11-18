/**
 * V5.7 on PostgreSQL: start, postpone, date, revert, cancel, swap and undo-last refuse a stale view of the
 * match (or of the last action), a retried request does not act twice, and a revert names the match or
 * stage that blocks it.
 */
import { lastUndoableActionId, matchRevision, matchScheduledAt } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

interface DatabaseModule { pool: typeof import("@workspace/db").pool }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

async function rows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `v57-${randomUUID()}`;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  signOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function setup(presetId: string, params: Record<string, number>) {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `V5.7 ${randomUUID().slice(0, 6)}`, organizerPassword: "integration-organizer-password", ...preview.creation })
    .expect(201);
  const tournamentId = created.body.id as number;
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  const organizer = { "x-organizer-token": signOrganizerToken(tournamentId, row!.organizer_password_hash) };
  for (let index = 1; index <= params.participantCount!; index += 1) {
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: `P${index}` }).expect(201);
  }
  const stages = await rows<{ id: number; format: string; name: string }>("SELECT id, format, name FROM tournament_stages WHERE tournament_id = $1 ORDER BY position", [tournamentId]);
  return { tournamentId, organizer, stages };
}

async function stageMatches(stageId: number) {
  return rows<{ id: number; round: number; match_number: number; status: string; player1_id: number | null; player2_id: number | null; best_of: number }>(
    "SELECT id, round, match_number, status, player1_id, player2_id, best_of FROM matches WHERE stage_id = $1 ORDER BY round, match_number", [stageId]);
}

async function complete(headers: Record<string, string>, matchId: number, bestOf = 1) {
  const wins = Math.floor(bestOf / 2) + 1;
  await request(app).post(`/api/matches/${matchId}/complete`).set(headers)
    .send({ expectedRevision: await matchRevision(database, matchId), resultType: "played", score1: wins, score2: 0 }).expect(200);
}

const actionCount = async (matchId: number, type: string) =>
  (await rows<{ n: number }>("SELECT count(*)::int AS n FROM action_log WHERE match_id = $1 AND action_type = $2", [matchId, type]))[0]!.n;

describe("V5.7 guarded match operations", () => {
  test("a stale start is refused, a retried start acts once, and every state change needs a revision", async () => {
    const { tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [match] = await stageMatches(stages[0]!.id);
    const seenByA = await matchRevision(database, match!.id);
    // Operator B postpones first.
    await request(app).patch(`/api/matches/${match!.id}`).set(organizer).send({ status: "postponed", expectedRevision: seenByA }).expect(200);
    const stale = await request(app).patch(`/api/matches/${match!.id}`).set(organizer).send({ status: "in_progress", expectedRevision: seenByA }).expect(409);
    assert.equal(stale.body.code, "CONCURRENT_MODIFICATION");
    assert.equal(stale.body.current.status, "postponed");
    assert.equal((await stageMatches(stages[0]!.id))[0]!.status, "postponed", "B's postponement is kept");

    // Restore, then start twice with the same revision (a retry after a lost response).
    await request(app).patch(`/api/matches/${match!.id}`).set(organizer).send({ status: "pending", expectedRevision: await matchRevision(database, match!.id) }).expect(200);
    const beforeStart = await matchRevision(database, match!.id);
    await request(app).patch(`/api/matches/${match!.id}`).set(organizer).send({ status: "in_progress", expectedRevision: beforeStart }).expect(200);
    await request(app).patch(`/api/matches/${match!.id}`).set(organizer).send({ status: "in_progress", expectedRevision: beforeStart }).expect(200);
    assert.equal(await actionCount(match!.id, "match_started"), 1, "the retry did not log a second start");

    for (const [method, url, body] of [
      ["patch", `/api/matches/${match!.id}`, { status: "postponed" }],
      ["post", `/api/matches/${match!.id}/cancel`, {}],
      ["post", `/api/matches/${match!.id}/swap-players`, {}],
      ["post", `/api/matches/${match!.id}/revert`, {}],
    ] as const) {
      const response = await (request(app) as Json)[method](url).set(organizer).send(body).expect(422);
      assert.equal(response.body.code, "EXPECTED_REVISION_REQUIRED", url);
    }
    const swapStale = await request(app).post(`/api/matches/${match!.id}/swap-players`).set(organizer).send({ expectedRevision: beforeStart }).expect(409);
    assert.equal(swapStale.body.code, "CONCURRENT_MODIFICATION");
  });

  test("a date set by someone else is not replaced; the same date again is a no-op; a date change never blocks a result", async () => {
    const { tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [match] = await stageMatches(stages[0]!.id);
    const seenDate = await matchScheduledAt(database, match!.id);
    const revisionBefore = await matchRevision(database, match!.id);
    await request(app).put(`/api/matches/${match!.id}/schedule`).set(organizer).send({ date: "2027-01-08", time: "20:00", expectedScheduledAt: seenDate }).expect(200);
    const stale = await request(app).put(`/api/matches/${match!.id}/schedule`).set(organizer).send({ date: "2027-01-09", time: "18:00", expectedScheduledAt: seenDate }).expect(409);
    assert.equal(stale.body.code, "SCHEDULE_CHANGED");
    assert.match(stale.body.error, /teraz: 2027-01-08 20:00/);
    await request(app).put(`/api/matches/${match!.id}/schedule`).set(organizer).send({ date: "2027-01-08", time: "20:00", expectedScheduledAt: seenDate }).expect(200);
    assert.equal(await actionCount(match!.id, "match_rescheduled"), 1, "retrying the same date logs nothing new");
    // The result form opened before the date change still saves: the date is versioned on its own.
    await request(app).post(`/api/matches/${match!.id}/complete`).set(organizer)
      .send({ expectedRevision: revisionBefore, resultType: "played", score1: 1, score2: 0 }).expect(200);
  });

  test("revert needs the revision the user saw; a retried revert is not applied twice", async () => {
    const { tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [match] = await stageMatches(stages[0]!.id);
    const beforeResult = await matchRevision(database, match!.id);
    await complete(organizer, match!.id);
    const stale = await request(app).post(`/api/matches/${match!.id}/revert`).set(organizer).send({ expectedRevision: beforeResult }).expect(409);
    assert.equal(stale.body.code, "CONCURRENT_MODIFICATION");
    const seen = await matchRevision(database, match!.id);
    await request(app).post(`/api/matches/${match!.id}/revert`).set(organizer).send({ expectedRevision: seen }).expect(200);
    const retry = await request(app).post(`/api/matches/${match!.id}/revert`).set(organizer).send({ expectedRevision: seen }).expect(409);
    assert.ok(["MATCH_NOT_COMPLETED", "CONCURRENT_MODIFICATION"].includes(retry.body.code));
    assert.equal(await actionCount(match!.id, "match_result_reverted"), 1);
  });

  test("undo-last undoes only the action the user saw; a retry reports it as already undone", async () => {
    const { tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [first, second] = await stageMatches(stages[0]!.id);
    await complete(organizer, first!.id);
    const seenLast = await lastUndoableActionId(database, tournamentId);
    await complete(organizer, second!.id); // someone else saves another result meanwhile
    const stale = await request(app).post(`/api/tournaments/${tournamentId}/undo-last`).set(organizer).send({ expectedActionId: seenLast }).expect(409);
    assert.equal(stale.body.code, "UNDO_ACTION_CHANGED");
    assert.equal((await stageMatches(stages[0]!.id)).filter((match) => match.status === "completed").length, 2, "nothing was undone");
    const current = await lastUndoableActionId(database, tournamentId);
    await request(app).post(`/api/tournaments/${tournamentId}/undo-last`).set(organizer).send({ expectedActionId: current }).expect(200);
    const retry = await request(app).post(`/api/tournaments/${tournamentId}/undo-last`).set(organizer).send({ expectedActionId: current }).expect(200);
    assert.match(retry.body.message, /była już cofnięta/);
    assert.equal((await stageMatches(stages[0]!.id)).filter((match) => match.status === "completed").length, 1, "undone exactly once");
  });
});

describe("V5.7 revert and advancement dependencies", () => {
  test("knockout: revert works before the next match starts and names the next match once it has", async () => {
    const { tournamentId, organizer, stages } = await setup("single_elimination", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [semi1, semi2, final] = await stageMatches(stages[0]!.id);
    await complete(organizer, semi1!.id, semi1!.best_of);
    // Before the dependent match starts: the controlled revert takes the winner back out of the final.
    await request(app).post(`/api/matches/${semi1!.id}/revert`).set(organizer).send({ expectedRevision: await matchRevision(database, semi1!.id) }).expect(200);
    const [, , finalAfterRevert] = await stageMatches(stages[0]!.id);
    assert.equal(finalAfterRevert!.player1_id, null, "advancement withdrawn");
    await complete(organizer, semi1!.id, semi1!.best_of);
    await complete(organizer, semi2!.id, semi2!.best_of);
    await request(app).patch(`/api/matches/${final!.id}`).set(organizer).send({ status: "in_progress", expectedRevision: await matchRevision(database, final!.id) }).expect(200);
    const blocked = await request(app).post(`/api/matches/${semi1!.id}/revert`).set(organizer).send({ expectedRevision: await matchRevision(database, semi1!.id) }).expect(409);
    assert.equal(blocked.body.code, "DOWNSTREAM_BLOCKED");
    assert.equal(blocked.body.blocking.matchId, final!.id);
    assert.match(blocked.body.error, /kolejny mecz \(runda 2, mecz 1\) już się rozpoczął/);
    // After the whole tournament ends, reverting the final reopens stage and tournament consistently.
    await request(app).patch(`/api/matches/${final!.id}`).set(organizer).send({ status: "pending", expectedRevision: await matchRevision(database, final!.id) }).expect(200);
    await complete(organizer, final!.id, final!.best_of);
    const [finished] = await rows<{ status: string; winner_id: number | null }>("SELECT status, winner_id FROM tournaments WHERE id = $1", [tournamentId]);
    assert.equal(finished!.status, "completed");
    await request(app).post(`/api/matches/${final!.id}/revert`).set(organizer).send({ expectedRevision: await matchRevision(database, final!.id) }).expect(200);
    const [reopened] = await rows<{ status: string; winner_id: number | null }>("SELECT status, winner_id FROM tournaments WHERE id = $1", [tournamentId]);
    assert.deepEqual(reopened, { status: "active", winner_id: null });
  });

  test("groups → play-off: once the play-off has started, a group result names the stage that blocks it", async () => {
    const { tournamentId, organizer, stages } = await setup("groups_playoff", { participantCount: 8, groupCount: 2, qualifiersPerGroup: 2 });
    const [groups, playoff] = stages;
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    for (const match of (await stageMatches(groups!.id)).filter((entry) => entry.player1_id && entry.player2_id)) await complete(organizer, match.id, match.best_of);
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups!.id}/complete`).set(organizer).expect(200);
    const [state] = await rows<{ status: string }>("SELECT status FROM tournament_stages WHERE id = $1", [playoff!.id]);
    if (state!.status === "planned") await request(app).post(`/api/tournaments/${tournamentId}/stages/${playoff!.id}/start`).set(organizer).send({}).expect(200);
    const [groupMatch] = await stageMatches(groups!.id);
    const blocked = await request(app).post(`/api/matches/${groupMatch!.id}/revert`).set(organizer).send({ expectedRevision: await matchRevision(database, groupMatch!.id) }).expect(409);
    assert.ok(["STAGE_ALREADY_ADVANCED", "STAGE_QUALIFICATION_ALREADY_COMMITTED"].includes(blocked.body.code), blocked.body.code);
    assert.equal(blocked.body.blocking.kind, "stage");
    assert.match(blocked.body.error, /etap/);
  });
});
