import { matchRevision } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema,
  type TestDatabaseConfig, type TestPool,
} from "./test-database";

type DatabaseModule = typeof import("@workspace/db");
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = "rr-stage-revert-" + randomUUID();
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  signOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});
after(async () => {
  if (!schemaInitialized) return;
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function rows<T>(query: string, params: unknown[]): Promise<T[]> {
  const result = await database.pool.query(query, params);
  return result.rows as T[];
}

test("SE8 -> terminal RR4 revert does not reactivate earlier nonqualifiers", async () => {
  const created = await request(app).post("/api/tournaments").send({
    name: "RR stage eligibility " + randomUUID(),
    organizerPassword: "rr-stage-test-password",
    format: "single_elimination", defaultBestOf: 1,
    stagePlan: { initialParticipantCount: 8, stages: [
      { key: "se8", position: 1, name: "SE8", format: "single_elimination", participantCount: 8, bestOf: 1, advancingCount: 4 },
      { key: "rr4", position: 2, name: "RR4", format: "round_robin", participantCount: 4, bestOf: 1 },
    ] },
  });
  assert.equal(created.status, 201, created.text);
  const id = created.body.id as number;
  const [credentials] = await rows<{ organizer_password_hash: string }>(
    "SELECT organizer_password_hash FROM tournaments WHERE id=$1", [id],
  );
  const headers = { "x-organizer-token": signOrganizerToken(id, credentials.organizer_password_hash) };
  const base = "/api/tournaments/" + id;
  for (let seed = 1; seed <= 8; seed++) {
    await request(app).post(base + "/players").set(headers)
      .send({ name: "P" + seed + "-" + randomUUID(), seed }).expect(201);
  }
  const stages = await rows<{ id: number }>(
    "SELECT id FROM tournament_stages WHERE tournament_id=$1 ORDER BY position", [id],
  );
  assert.equal(stages.length, 2);
  const [seId, rrId] = stages.map((stage) => stage.id);
  const completeMatches = async (stageId: number) => {
    const matches = await rows<{ id: number }>(
      "SELECT id FROM matches WHERE stage_id=$1 ORDER BY round,match_number", [stageId],
    );
    for (const match of matches) {
      await request(app).post("/api/matches/" + match.id + "/complete").set(headers)
        .send({ expectedRevision: await matchRevision(database, match.id), resultType: "played", score1: 1, score2: 0 }).expect(200);
    }
    return matches.map((match) => match.id);
  };
  await request(app).post(base + "/start").set(headers).expect(200);
  assert.equal((await completeMatches(seId)).length, 4);
  await request(app).post(base + "/stages/" + seId + "/complete").set(headers).expect(200);
  await request(app).post(base + "/stages/" + rrId + "/start").set(headers).expect(200);
  const rrMatches = await completeMatches(rrId);
  assert.equal(rrMatches.length, 6);
  await request(app).post(base + "/stages/" + rrId + "/complete").set(headers).expect(200);

  type Player = { id: number; status: string };
  type Member = { player_id: number; status: string; stage_seed: number; final_rank: number | null };
  const readPlayers = () => rows<Player>("SELECT id,status FROM players WHERE tournament_id=$1 ORDER BY id", [id]);
  const readMembers = (stageId: number) => rows<Member>(
    "SELECT player_id,status,stage_seed,final_rank FROM stage_participants WHERE stage_id=$1 ORDER BY player_id", [stageId],
  );
  const beforePlayers = await readPlayers();
  const beforeFirstStage = await readMembers(seId);
  const beforeRR = await readMembers(rrId);
  const rrRoster = new Set(beforeRR.map((row) => row.player_id));
  const excludedIds = new Set(beforePlayers.filter((row) => !rrRoster.has(row.id)).map((row) => row.id));
  assert.equal(rrRoster.size, 4);
  assert.equal(excludedIds.size, 4);
  assert.ok(beforePlayers.filter((row) => excludedIds.has(row.id)).every((row) => row.status === "eliminated"));
  const lastId = rrMatches.at(-1)!;
  const historyBefore = await rows(
    "SELECT revision,result_type,winner_id FROM result_history WHERE match_id=$1 ORDER BY revision", [lastId],
  );
  assert.equal(historyBefore.length, 1);

  const reverted = await request(app).post("/api/matches/" + lastId + "/revert").set(headers).send({});
  assert.equal(reverted.status, 200, reverted.text);
  const afterPlayers = await readPlayers();
  const afterFirstStage = await readMembers(seId);
  const afterRR = await readMembers(rrId);
  assert.deepEqual(
    afterPlayers.filter((row) => excludedIds.has(row.id)),
    beforePlayers.filter((row) => excludedIds.has(row.id)),
    "players eliminated before RR4 must remain eliminated",
  );
  assert.deepEqual(
    afterFirstStage.filter((row) => excludedIds.has(row.player_id)),
    beforeFirstStage.filter((row) => excludedIds.has(row.player_id)),
    "prior eliminations and seeds must remain unchanged",
  );
  assert.ok(afterPlayers.filter((row) => rrRoster.has(row.id)).every((row) => row.status === "active"));
  assert.ok(afterRR.every((row) => row.status === "active" && row.final_rank === null));
  assert.deepEqual(afterRR.map((row) => [row.player_id, row.stage_seed]), beforeRR.map((row) => [row.player_id, row.stage_seed]));
  const [tournament] = await rows<{ status: string; winner_id: number | null; active_stage_id: number | null }>(
    "SELECT status,winner_id,active_stage_id FROM tournaments WHERE id=$1", [id],
  );
  const [rrStage] = await rows<{ status: string; winner_id: number | null; completed_at: Date | null }>(
    "SELECT status,winner_id,completed_at FROM tournament_stages WHERE id=$1", [rrId],
  );
  const [match] = await rows<{ status: string; winner_id: number | null }>(
    "SELECT status,winner_id FROM matches WHERE id=$1", [lastId],
  );
  assert.deepEqual([tournament.status, tournament.winner_id, tournament.active_stage_id], ["active", null, rrId]);
  assert.deepEqual([rrStage.status, rrStage.winner_id, rrStage.completed_at], ["active", null, null]);
  assert.deepEqual([match.status, match.winner_id], ["pending", null]);
  assert.deepEqual(await rows(
    "SELECT revision,result_type,winner_id FROM result_history WHERE match_id=$1 ORDER BY revision", [lastId],
  ), historyBefore, "result history must be immutable");
  const actions = await rows<{ action_type: string; is_undone: boolean }>(
    "SELECT action_type,is_undone FROM action_log WHERE match_id=$1 ORDER BY id", [lastId],
  );
  assert.equal(actions.filter((row) => row.action_type === "match_result_submitted" && row.is_undone).length, 1);
  assert.equal(actions.filter((row) => row.action_type === "match_result_reverted").length, 1);

  await request(app).post("/api/matches/" + lastId + "/complete").set(headers)
    .send({ expectedRevision: await matchRevision(database, lastId), resultType: "played", score1: 1, score2: 0 }).expect(200);
  await request(app).post(base + "/stages/" + rrId + "/complete").set(headers).expect(200);
  const [refinalized] = await rows<{ status: string; winner_id: number | null }>(
    "SELECT status,winner_id FROM tournaments WHERE id=$1", [id],
  );
  assert.equal(refinalized.status, "completed");
  assert.ok(rrRoster.has(refinalized.winner_id!));
  assert.equal((await readPlayers()).filter((row) => row.status === "winner").length, 1);
  assert.ok((await readPlayers()).filter((row) => excludedIds.has(row.id)).every((row) => row.status === "eliminated"));
  assert.equal((await rows("SELECT revision FROM result_history WHERE match_id=$1", [lastId])).length, 2);
});
