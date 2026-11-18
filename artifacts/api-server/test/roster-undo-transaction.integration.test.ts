import { lastUndoableActionId, matchRevision, matchScheduledAt } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

let app: Express;
let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
let initialized = false;
let undoAction: typeof import("../src/application/players/tournament-roster").undoTournamentRosterAction;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `roster-undo-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  undoAction = (await import("../src/application/players/tournament-roster")).undoTournamentRosterAction;
  app = (await import("../src/app")).default;
});
after(async () => {
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function fixture() {
  const created = await request(app).post("/api/tournaments").send({
    name: `Undo fixture ${randomUUID()}`, format: "single_elimination", organizerPassword: "test-password-only",
  }).expect(201);
  const id = created.body.id as number;
  const headers = { "x-organizer-token": created.body.organizerToken as string };
  async function add(name: string, seed: number) {
    return (await request(app).post(`/api/tournaments/${id}/players`).set(headers).send({ name, seed }).expect(201)).body.id as number;
  }
  async function state() {
    const players = await database.pool.query("SELECT * FROM players WHERE tournament_id=$1 ORDER BY id", [id]);
    const actions = await database.pool.query("SELECT * FROM action_log WHERE tournament_id=$1 ORDER BY id", [id]);
    const stages = await database.pool.query("SELECT * FROM tournament_stages WHERE tournament_id=$1 ORDER BY id", [id]);
    const participants = await database.pool.query("SELECT * FROM stage_participants WHERE tournament_id=$1 ORDER BY stage_id, player_id", [id]);
    return { players: players.rows, actions: actions.rows, stages: stages.rows, participants: participants.rows };
  }
  async function latest() {
    const result = await database.pool.query("SELECT id FROM action_log WHERE tournament_id=$1 AND undo_payload IS NOT NULL AND NOT is_undone ORDER BY created_at DESC, id DESC LIMIT 1", [id]);
    return result.rows[0].id as number;
  }
  return { id, headers, add, state, latest };
}

test("malformed persisted roster payloads cause no writes", async () => {
  const f = await fixture();
  const playerId = await f.add("Original", 1);
  const actionId = await f.latest();
  for (const payload of [
    { type: "delete_player", playerId, tournamentId: 999 },
    { type: "delete_player", playerId: 0 },
    { type: "restore_player", playerId, prevData: { name: "Injected" } },
    { type: "restore_player", playerId, prevData: { tournamentId: 999 } },
  ]) {
    await database.pool.query("UPDATE action_log SET undo_payload=$1 WHERE id=$2", [JSON.stringify(payload), actionId]);
    const beforeState = await f.state();
    const response = await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.headers).send({ expectedActionId: await lastUndoableActionId(database, f.id) });
    assert.equal(response.status, 422);
    assert.equal(response.body.code, "ROSTER_UNDO_UNAVAILABLE");
    assert.deepEqual(await f.state(), beforeState);
  }
});

test("edited-player Undo validates snapshot fields and restores a valid snapshot", async () => {
  const f = await fixture();
  const playerId = await f.add("Before edit", 1);
  await request(app).patch(`/api/players/${playerId}`).set(f.headers).send({ name: "After edit" }).expect(200);
  const actionId = await f.latest();
  const action = await database.pool.query("SELECT action_type, undo_payload FROM action_log WHERE id=$1", [actionId]);
  assert.equal(action.rows[0].action_type, "player_edited");
  const validPayload = action.rows[0].undo_payload as string;
  for (const payload of [
    { type: "restore_player", playerId, prevData: { tournamentId: 999 } },
    { type: "restore_player", playerId, prevData: { name: "Injected", status: "active" } },
    { type: "restore_player", playerId, prevData: { name: " " } },
    { type: "restore_player", playerId: 0, prevData: { name: "Before edit" } },
    { type: "delete_player", playerId },
  ]) {
    await database.pool.query("UPDATE action_log SET undo_payload=$1 WHERE id=$2", [JSON.stringify(payload), actionId]);
    const beforeState = await f.state();
    const response = await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.headers).send({ expectedActionId: await lastUndoableActionId(database, f.id) });
    assert.equal(response.status, 422);
    assert.equal(response.body.code, "ROSTER_UNDO_UNAVAILABLE");
    assert.deepEqual(await f.state(), beforeState);
  }
  await database.pool.query("UPDATE action_log SET undo_payload=$1 WHERE id=$2", [validPayload, actionId]);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.headers).send({ expectedActionId: await lastUndoableActionId(database, f.id) }).expect(200);
  assert.equal((await f.state()).players[0].name, "Before edit");
});

test("latest roster action wins; stale and repeated undo do not change state", async () => {
  const f = await fixture();
  const firstPlayer = await f.add("First", 1);
  const firstAction = await f.latest();
  await f.add("Second", 2);
  const secondAction = await f.latest();
  const beforeStale = await f.state();
  await assert.rejects(undoAction({ tournamentId: f.id, actionId: firstAction }), /zmian|changed/i);
  assert.deepEqual(await f.state(), beforeStale);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.headers).send({ expectedActionId: await lastUndoableActionId(database, f.id) }).expect(200);
  assert.deepEqual((await f.state()).players.map((p: { id: number }) => p.id), [firstPlayer]);
  const afterUndo = await f.state();
  await assert.rejects(undoAction({ tournamentId: f.id, actionId: secondAction }));
  assert.deepEqual(await f.state(), afterUndo);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.headers).send({ expectedActionId: await lastUndoableActionId(database, f.id) }).expect(200);
  assert.equal((await f.state()).players.length, 0);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.headers).send({ expectedActionId: await lastUndoableActionId(database, f.id) }).expect(404);
});

test("transaction rolls back player deletion when later action-log write fails", async () => {
  const f = await fixture();
  await f.add("Rollback player", 1);
  const beforeState = await f.state();
  await database.pool.query(`CREATE FUNCTION swarm006_reject_action_log() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action_type = 'player_removed' THEN RAISE EXCEPTION 'test injected failure'; END IF; RETURN NEW; END $$`);
  await database.pool.query("CREATE TRIGGER swarm006_reject_action_log BEFORE INSERT ON action_log FOR EACH ROW EXECUTE FUNCTION swarm006_reject_action_log()");
  try {
    await assert.rejects(undoAction({ tournamentId: f.id, actionId: await f.latest() }), (error: unknown) => {
      let cause = error;
      while (cause instanceof Error) {
        if (cause.message.includes("test injected failure")) return true;
        cause = cause.cause;
      }
      return false;
    });
    assert.deepEqual(await f.state(), beforeState);
  } finally {
    await database.pool.query("DROP TRIGGER swarm006_reject_action_log ON action_log");
    await database.pool.query("DROP FUNCTION swarm006_reject_action_log()");
  }
});
