import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

let app: Express;
let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
let initialized = false;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = randomUUID();
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  app = (await import("../src/app")).default;
});
after(async () => {
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  if (database) await database.pool.end();
});

async function tournament(start = true) {
  const created = await request(app).post("/api/tournaments").send({
    name: `Undo history safety ${randomUUID()}`,
    organizerPassword: "undo-safety-test-password",
    format: "round_robin",
    defaultBestOf: 1,
  }).expect(201);
  const id: number = created.body.id;
  const auth = { "x-organizer-token": created.body.organizerToken as string };
  if (!start) return { id, auth, matchId: null as number | null };
  for (let i = 0; i < 3; i++) {
    await request(app).post(`/api/tournaments/${id}/players`)
      .set(auth).send({ name: `Player ${i}` }).expect(201);
  }
  await request(app).post(`/api/tournaments/${id}/start`).set(auth).expect(200);
  const [match] = (await request(app)
    .get(`/api/tournaments/${id}/matches`).expect(200)).body;
  return { id, auth, matchId: match.id as number };
}

async function matchAndLogState(id: number, matchId: number) {
  const [matches, actions] = await Promise.all([
    database.pool.query("SELECT * FROM matches WHERE id=$1", [matchId]),
    database.pool.query("SELECT * FROM action_log WHERE tournament_id=$1 ORDER BY id", [id]),
  ]);
  return { matches: matches.rows, actions: actions.rows };
}

test("malformed latest undo payload returns 409 without a write", async () => {
  for (const raw of ["{", "null", "[]", '{"type":"restore_players_swap"}']) {
    const f = await tournament();
    await request(app).patch(`/api/matches/${f.matchId}`).set(f.auth)
      .send({ bestOf: 3 }).expect(200);
    await database.pool.query(
      "UPDATE action_log SET undo_payload=$1 WHERE tournament_id=$2 AND action_type='match_bo_changed'",
      [raw, f.id],
    );
    const audit = (await request(app)
      .get(`/api/tournaments/${f.id}/action-log`).expect(200)).body;
    const brokenEntry = audit.find((entry: { actionType: string }) =>
      entry.actionType === "match_bo_changed");
    assert.ok(brokenEntry);
    assert.equal(brokenEntry.canUndo, false);
    const beforeState = await matchAndLogState(f.id, f.matchId!);
    const denied = await request(app)
      .post(`/api/tournaments/${f.id}/undo-last`).set(f.auth).expect(409);
    assert.equal(denied.body.code, "UNDO_ACTION_CHANGED");
    assert.deepEqual(await matchAndLogState(f.id, f.matchId!), beforeState);
  }
});

test("undo payload cannot redirect a match mutation to another match", async () => {
  const f = await tournament();
  const matches = (await request(app)
    .get(`/api/tournaments/${f.id}/matches`).expect(200)).body;
  const another = matches.find((match: { id: number }) => match.id !== f.matchId);
  assert.ok(another);
  await request(app).patch(`/api/matches/${f.matchId}`).set(f.auth)
    .send({ bestOf: 3 }).expect(200);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=jsonb_set(undo_payload::jsonb, '{matchId}', to_jsonb($1::int))::text WHERE tournament_id=$2 AND action_type='match_bo_changed'",
    [another.id, f.id],
  );
  const beforeState = await matchAndLogState(f.id, f.matchId!);
  const denied = await request(app)
    .post(`/api/tournaments/${f.id}/undo-last`).set(f.auth).expect(409);
  assert.equal(denied.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await matchAndLogState(f.id, f.matchId!), beforeState);
});

test("roster undo rejects an older action without touching players", async () => {
  const f = await tournament(false);
  await request(app).post(`/api/tournaments/${f.id}/players`)
    .set(f.auth).send({ name: "First" }).expect(201);
  await request(app).post(`/api/tournaments/${f.id}/players`)
    .set(f.auth).send({ name: "Second" }).expect(201);
  const actions = (await database.pool.query(
    "SELECT id FROM action_log WHERE tournament_id=$1 AND action_type='player_added' ORDER BY id",
    [f.id],
  )).rows;
  assert.equal(actions.length, 2);
  const snapshot = async () => {
    const [players, log] = await Promise.all([
      database.pool.query("SELECT id, name FROM players WHERE tournament_id=$1 ORDER BY id", [f.id]),
      database.pool.query("SELECT id, is_undone FROM action_log WHERE tournament_id=$1 ORDER BY id", [f.id]),
    ]);
    return { players: players.rows, log: log.rows };
  };
  const beforeState = await snapshot();
  const { undoTournamentRosterAction } = await import("../src/application/players/tournament-roster");
  await assert.rejects(
    () => undoTournamentRosterAction({ tournamentId: f.id, actionId: actions[0].id }),
    (error: unknown) =>
      error instanceof Error && "code" in error && error.code === "ROSTER_UNDO_UNAVAILABLE",
  );
  assert.deepEqual(await snapshot(), beforeState);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(200);
  const players = await database.pool.query(
    "SELECT name FROM players WHERE tournament_id=$1 ORDER BY id",
    [f.id],
  );
  assert.deepEqual(players.rows, [{ name: "First" }]);
});

test("roster undo rejects malformed player identity without changing the database", async () => {
  const f = await tournament(false);
  await request(app).post(`/api/tournaments/${f.id}/players`)
    .set(f.auth).send({ name: "Participant" }).expect(201);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=$1 WHERE tournament_id=$2 AND action_type='player_added'",
    ['{"type":"delete_player","playerId":"not-a-number"}', f.id],
  );
  const beforeState = await database.pool.query(
    "SELECT id, name FROM players WHERE tournament_id=$1 ORDER BY id", [f.id],
  );
  const denied = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(denied.body.code, "ROSTER_UNDO_UNAVAILABLE");
  const afterState = await database.pool.query(
    "SELECT id, name FROM players WHERE tournament_id=$1 ORDER BY id", [f.id],
  );
  assert.deepEqual(afterState.rows, beforeState.rows);
});

test("undo-last rejects a corrupted prior match status without writes", async () => {
  const f = await tournament();
  await request(app).patch(`/api/matches/${f.matchId}`).set(f.auth)
    .send({ status: "in_progress" }).expect(200);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=jsonb_set(undo_payload::jsonb, '{prevStatus}', $1::jsonb)::text WHERE tournament_id=$2 AND action_type='match_started'",
    [JSON.stringify("completed"), f.id],
  );
  const beforeState = await matchAndLogState(f.id, f.matchId!);
  const denied = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(denied.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await matchAndLogState(f.id, f.matchId!), beforeState);
});

test("undo-last rejects a corrupted cancellation note instead of writing invalid data", async () => {
  const f = await tournament();
  await request(app).post(`/api/matches/${f.matchId}/cancel`).set(f.auth)
    .send({ note: "Original cancellation" }).expect(200);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=jsonb_set(undo_payload::jsonb, '{prevNote}', $1::jsonb)::text WHERE tournament_id=$2 AND action_type='match_cancelled'",
    [JSON.stringify({ nested: true }), f.id],
  );
  const beforeState = await matchAndLogState(f.id, f.matchId!);
  const denied = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(denied.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await matchAndLogState(f.id, f.matchId!), beforeState);
});

test("roster undo restores a valid player edit using only allowed fields", async () => {
  const f = await tournament(false);
  const created = await request(app).post(`/api/tournaments/${f.id}/players`)
    .set(f.auth).send({ name: "Before" }).expect(201);
  await request(app).patch(`/api/players/${created.body.id}`)
    .set(f.auth).send({ name: "After" }).expect(200);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(200);
  const [player] = (await database.pool.query(
    "SELECT id, name FROM players WHERE id=$1", [created.body.id],
  )).rows;
  assert.equal(player.name, "Before");
});

test("roster undo rejects unexpected immutable player fields in the snapshot", async () => {
  const f = await tournament(false);
  const created = await request(app).post(`/api/tournaments/${f.id}/players`)
    .set(f.auth).send({ name: "Original" }).expect(201);
  await request(app).patch(`/api/players/${created.body.id}`)
    .set(f.auth).send({ name: "Edited" }).expect(200);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=jsonb_set(undo_payload::jsonb, '{prevData,tournamentId}', to_jsonb($1::int))::text WHERE tournament_id=$2 AND action_type='player_edited'",
    [999999, f.id],
  );
  const readState = async () => Promise.all([
    database.pool.query("SELECT * FROM players WHERE tournament_id=$1 ORDER BY id", [f.id]),
    database.pool.query("SELECT * FROM action_log WHERE tournament_id=$1 ORDER BY id", [f.id]),
  ]).then(([players, actions]) => ({ players: players.rows, actions: actions.rows }));
  const baseline = await readState();
  const denied = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(denied.body.code, "ROSTER_UNDO_UNAVAILABLE");
  assert.deepEqual(await readState(), baseline);
});
