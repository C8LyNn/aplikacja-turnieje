import { matchRevision } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

let app: Express;
let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `reliability-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});
after(async () => {
  if (database) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
    await database.pool.end();
  }
});

async function tournament(format: string, count: number, multi = false) {
  const created = await request(app).post("/api/tournaments").send({
    name: `Reliability ${format} ${randomUUID()}`, organizerPassword: "reliability-test-password",
    format: format === "double_elimination" ? "single_elimination" : format, defaultBestOf: 1,
    stagePlan: { initialParticipantCount: count, stages: [
      { key: "first", name: "First", position: 1, format, participantCount: count, bestOf: 1,
        entrySeedingMethod: format === "round_robin" ? "alphabetical" : "preserve",
        placementMethod: "standard", ...(multi ? { advancingCount: 2 } : {}) },
      ...(multi ? [{ key: "final", name: "Final", position: 2, format: "single_elimination", participantCount: 2, bestOf: 1,
        entrySeedingMethod: "preserve", placementMethod: "standard" }] : []),
    ] },
  }).expect(201);
  const id: number = created.body.id;
  const auth = { "x-organizer-token": created.body.organizerToken as string };
  const playerIds: number[] = [];
  for (let index = 0; index < count; index++) {
    const player = await request(app).post(`/api/tournaments/${id}/players`).set(auth)
      .send({ name: ["Zulu", "Alfa", "Mike"][index] ?? `Player ${index}`, seed: index + 1 }).expect(201);
    playerIds.push(player.body.id);
  }
  const stages = (await request(app).get(`/api/tournaments/${id}/stages`).expect(200)).body;
  await request(app).post(`/api/tournaments/${id}/start`).set(auth).expect(200);
  const matches = async () => (await request(app).get(`/api/tournaments/${id}/matches`).expect(200)).body as Array<{
    id: number; revision: number; stageId: number; player1Id: number; player2Id: number; status: string; bestOf: number;
    score1: number | null; score2: number | null; winnerId: number | null;
  }>;
  return { id, auth, playerIds, stageId: stages[0].id as number, matches };
}

for (const resultType of ["played", "no_contest"] as const) {
  test(`single RR automatic winner uses stage seeds for a tied ${resultType} table, including retry and reread`, async () => {
    const fixture = await tournament("round_robin", 3);
    const members = await database.pool.query<{ player_id: number; stage_seed: number }>(
      "SELECT player_id, stage_seed FROM stage_participants WHERE stage_id=$1 ORDER BY stage_seed", [fixture.stageId]);
    assert.equal(members.rows[0].player_id, fixture.playerIds[1], "alphabetical seed differs from registration seed");
    const matches = await fixture.matches();
    assert.equal(matches.length, 3);
    for (const match of matches) {
      const p1 = fixture.playerIds.indexOf(match.player1Id);
      const p2 = fixture.playerIds.indexOf(match.player2Id);
      const firstWins = (p1 + 1) % 3 === p2; // a three-way 1:0 cycle
      await request(app).post(`/api/matches/${match.id}/complete`).set(fixture.auth).send({ expectedRevision: await matchRevision(database, match.id), ...(resultType === "played"
        ? { resultType, score1: firstWins ? 1 : 0, score2: firstWins ? 0 : 1 } : { resultType }) }).expect(200);
    }
    const read = async () => (await request(app).get(`/api/tournaments/${fixture.id}`).expect(200)).body;
    const final = await read();
    assert.equal(final.status, "completed");
    assert.equal(final.winnerId, members.rows[0].player_id);
    const persisted = await database.pool.query("SELECT winner_id FROM tournament_stages WHERE id=$1", [fixture.stageId]);
    assert.equal(persisted.rows[0].winner_id, final.winnerId);
    const standings = (await request(app).get(`/api/tournaments/${fixture.id}/standings`).expect(200)).body;
    assert.equal(standings[0].playerId, final.winnerId);
    const retainedSeeds = await database.pool.query<{ player_id: number; stage_seed: number }>(
      "SELECT player_id, stage_seed FROM stage_participants WHERE stage_id=$1 ORDER BY stage_seed", [fixture.stageId]);
    assert.deepEqual(retainedSeeds.rows, members.rows, "result/status writes must not reseed a started stage");
    const stats = (await request(app).get(`/api/tournaments/${fixture.id}/stats`).expect(200)).body;
    assert.equal(stats.topPlayers[0].id, final.winnerId);
    // Automatic completion closes the stage, so the stage-state guard wins on retry.
    const retry = await request(app).post(`/api/matches/${matches[2].id}/complete`).set(fixture.auth)
      .send({ expectedRevision: await matchRevision(database, matches[2].id), ...({ resultType: "played", score1: 1, score2: 0 }) }).expect(422);
    assert.equal(retry.body.code, "MATCH_STATE_NOT_COMPLETABLE");
    assert.equal((await read()).winnerId, final.winnerId);
  });
}

test("DE advancing an independent match preserves another match's LIVE state, BO and swapped sides", async () => {
  const fixture = await tournament("double_elimination", 4);
  const [a, b] = await fixture.matches();
  await request(app).patch(`/api/matches/${a.id}`).set(fixture.auth).send({ bestOf: 3 }).expect(200);
  await request(app).post(`/api/matches/${a.id}/swap-players`).set(fixture.auth).expect(200);
  await request(app).patch(`/api/matches/${a.id}`).set(fixture.auth).send({ status: "in_progress" }).expect(200);
  const before = (await fixture.matches()).find(match => match.id === a.id)!;
  await request(app).post(`/api/matches/${b.id}/complete`).set(fixture.auth)
    .send({ expectedRevision: await matchRevision(database, b.id), ...({ resultType: "played", score1: 1, score2: 0 }) }).expect(200);
  const after = (await fixture.matches()).find(match => match.id === a.id)!;
  assert.equal(after.status, "in_progress");
  assert.equal(after.bestOf, 3);
  assert.equal(after.player1Id, before.player1Id);
  assert.equal(after.player2Id, before.player2Id);
  await request(app).post(`/api/matches/${a.id}/complete`).set(fixture.auth)
    .send({ expectedRevision: await matchRevision(database, a.id), ...({ resultType: "played", score1: 2, score2: 0 }) }).expect(200);
  const state = (await request(app).get(`/api/tournaments/${fixture.id}/stages/${fixture.stageId}/double-elimination`).expect(200)).body;
  const publicMatch = state.matches.find((match: { matchId: number }) => match.matchId === a.id);
  assert.equal(publicMatch.slots[0], String(before.player1Id));
  assert.equal(publicMatch.winnerParticipantKey, publicMatch.slots[0]);
  assert.equal(publicMatch.score1, 2);
  const stored = await database.pool.query("SELECT best_of, player1_id, winner_id FROM matches WHERE id=$1", [a.id]);
  assert.deepEqual(stored.rows[0], { best_of: 3, player1_id: before.player1Id, winner_id: before.player1Id });
});

test("DE public score stays attached to the correct participant after a side swap", async () => {
  const fixture = await tournament("double_elimination", 4);
  const [a] = await fixture.matches();
  await request(app).post(`/api/matches/${a.id}/swap-players`).set(fixture.auth).expect(200);
  await request(app).post(`/api/matches/${a.id}/complete`).set(fixture.auth)
    .send({ expectedRevision: await matchRevision(database, a.id), ...({ resultType: "played", score1: 1, score2: 0 }) }).expect(200);
  const state = (await request(app).get(`/api/tournaments/${fixture.id}/stages/${fixture.stageId}/double-elimination`).expect(200)).body;
  const publicMatch = state.matches.find((match: { matchId: number }) => match.matchId === a.id);
  assert.equal(publicMatch.slots[0], String(a.player2Id));
  assert.equal(publicMatch.winnerParticipantKey, publicMatch.slots[0]);
  assert.equal(publicMatch.score1, 1);
});

test("multi-stage SE can revert a legal first-stage result without eliminating a player globally", async () => {
  const fixture = await tournament("single_elimination", 4, true);
  const [a] = await fixture.matches();
  await request(app).post(`/api/matches/${a.id}/complete`).set(fixture.auth)
    .send({ expectedRevision: await matchRevision(database, a.id), ...({ resultType: "played", score1: 1, score2: 0 }) }).expect(200);
  const loser = await database.pool.query("SELECT status FROM players WHERE id=$1", [a.player2Id]);
  assert.equal(loser.rows[0].status, "active");
  await request(app).post(`/api/matches/${a.id}/revert`).set(fixture.auth).expect(200);
  const reopened = (await fixture.matches()).find(match => match.id === a.id)!;
  assert.equal(reopened.status, "pending");
  assert.equal(reopened.winnerId, null);
  await request(app).post(`/api/matches/${a.id}/revert`).set(fixture.auth).expect(409);
  const member = await database.pool.query("SELECT status FROM stage_participants WHERE stage_id=$1 AND player_id=$2", [fixture.stageId, a.player2Id]);
  assert.equal(member.rows[0].status, "active");
  await request(app).post(`/api/matches/${a.id}/complete`).set(fixture.auth)
    .send({ expectedRevision: await matchRevision(database, a.id), ...({ resultType: "played", score1: 0, score2: 1 }) }).expect(200);
  assert.equal((await fixture.matches()).find(match => match.id === a.id)!.winnerId, a.player2Id);
});

test("reopening a completed DE stage removes frozen final ranks and the global winner status", async () => {
  const fixture = await tournament("double_elimination", 2);
  const url = `/api/tournaments/${fixture.id}/stages/${fixture.stageId}`;
  let lastMatchId = 0;
  for (let step = 0; step < 4; step++) {
    const state = (await request(app).get(`${url}/double-elimination`).expect(200)).body;
    const ready = state.matches.find((match: { status: string }) => match.status === "ready");
    if (!ready) break;
    lastMatchId = ready.matchId;
    await request(app).post(`/api/matches/${lastMatchId}/complete`).set(fixture.auth)
      .send({ expectedRevision: await matchRevision(database, lastMatchId), ...({ resultType: "played", score1: 1, score2: 0 }) }).expect(200);
  }
  await request(app).post(`${url}/complete`).set(fixture.auth).send({}).expect(200);
  const closed = (await request(app).get(`/api/tournaments/${fixture.id}`).expect(200)).body;
  assert.equal(closed.status, "completed");
  const frozen = await database.pool.query("SELECT final_rank FROM stage_participants WHERE stage_id=$1", [fixture.stageId]);
  assert.ok(frozen.rows.every(row => row.final_rank != null));
  await request(app).post(`/api/matches/${lastMatchId}/revert`).set(fixture.auth).expect(200);
  const reopened = (await request(app).get(`/api/tournaments/${fixture.id}`).expect(200)).body;
  assert.equal(reopened.status, "active");
  assert.equal(reopened.winnerId, null);
  const members = await database.pool.query("SELECT final_rank FROM stage_participants WHERE stage_id=$1", [fixture.stageId]);
  assert.ok(members.rows.every(row => row.final_rank == null));
  const players = await database.pool.query("SELECT status FROM players WHERE tournament_id=$1", [fixture.id]);
  assert.ok(players.rows.every(row => row.status === "active"));
});

test("stale operator score is rejected after another operator swaps the match sides", async () => {
  const fixture = await tournament("double_elimination", 4);
  const [observedByA] = await fixture.matches();
  const payloadA = { resultType: "played", score1: 1, score2: 0, expectedRevision: observedByA.revision };
  const swapped = await request(app).post(`/api/matches/${observedByA.id}/swap-players`).set(fixture.auth).expect(200);
  const snapshot = async () => {
    const tables = ["matches", "stage_participants", "result_history", "action_log", "tournament_stages"];
    return Promise.all([
      ...tables.map(async table => (await database.pool.query(
        `SELECT * FROM ${table} WHERE tournament_id=$1 ORDER BY id`, [fixture.id])).rows),
      database.pool.query("SELECT * FROM tournament_routing_executions WHERE plan_id IN (SELECT id FROM tournament_routing_plans WHERE tournament_id=$1) ORDER BY plan_id, stage_key", [fixture.id]).then(result => result.rows),
      database.pool.query("SELECT * FROM tournaments WHERE id=$1", [fixture.id]).then(result => result.rows),
    ]);
  };
  const before = await snapshot();
  const staleSave = await request(app).post(`/api/matches/${observedByA.id}/complete`).set(fixture.auth)
    .send(payloadA);
  assert.equal(staleSave.status, 409);
  assert.equal(staleSave.body.code, "CONCURRENT_MODIFICATION");
  assert.equal(swapped.body.revision, observedByA.revision + 1);
  assert.deepEqual(await snapshot(), before);
});

test("DE reset invalidates an old form even when it restores the original ready pair", async () => {
  const fixture = await tournament("double_elimination", 4);
  const [a] = await fixture.matches();
  await request(app).post(`/api/matches/${a.id}/complete`).set(fixture.auth)
    .send({ resultType: "played", score1: 1, score2: 0, expectedRevision: a.revision }).expect(200);
  const stagePath = `/api/tournaments/${fixture.id}/stages/${fixture.stageId}/double-elimination`;
  const state = (await request(app).get(stagePath).expect(200)).body;
  await request(app).post(`${stagePath}/reset`).set(fixture.auth).send({ expectedRevision: state.revision }).expect(200);
  const reopened = (await fixture.matches()).find(match => match.id === a.id)!;
  assert.equal(reopened.player1Id, a.player1Id);
  assert.equal(reopened.player2Id, a.player2Id);
  assert.ok(reopened.revision > a.revision);
  const stale = await request(app).post(`/api/matches/${a.id}/complete`).set(fixture.auth)
    .send({ resultType: "played", score1: 1, score2: 0, expectedRevision: a.revision }).expect(409);
  assert.equal(stale.body.code, "CONCURRENT_MODIFICATION");
  assert.deepEqual((await fixture.matches()).find(match => match.id === a.id), reopened);
});
