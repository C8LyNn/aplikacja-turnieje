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
before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `swiss-scope-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  app = (await import("../src/app")).default;
});
after(async () => {
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function fixture() {
  const created = await request(app).post("/api/tournaments").send({
    name: `Swiss scope ${randomUUID()}`, format: "swiss", swissRounds: 3,
    defaultBestOf: 1, organizerPassword: "test-password-only",
  }).expect(201);
  const id = created.body.id as number;
  const headers = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 5; seed++) {
    await request(app).post(`/api/tournaments/${id}/players`).set(headers).send({ name: `Player ${seed}`, seed }).expect(201);
  }
  await request(app).post(`/api/tournaments/${id}/start`).set(headers).send({}).expect(200);
  const matches = await database.pool.query("SELECT id, revision FROM matches WHERE tournament_id=$1 AND status='pending' ORDER BY match_number", [id]);
  assert.equal(matches.rowCount, 2);
  for (const match of matches.rows) {
    await request(app).post(`/api/matches/${match.id}/complete`).set(headers)
      .send({ expectedRevision: match.revision, resultType: "played", score1: 1, score2: 0 }).expect(200);
  }
  const stage = (await database.pool.query("SELECT id FROM tournament_stages WHERE tournament_id=$1 AND status='active'", [id])).rows[0].id as number;
  return { id, headers, stage };
}

async function generateByeSeed(f: Awaited<ReturnType<typeof fixture>>) {
  await request(app).post(`/api/tournaments/${f.id}/generate-round`).set(f.headers).send({}).expect(200);
  const result = await database.pool.query(
    "SELECT p.seed FROM matches m JOIN players p ON p.id=m.player1_id WHERE m.stage_id=$1 AND m.round=2 AND m.result_type='bye'",
    [f.stage],
  );
  assert.equal(result.rowCount, 1);
  return result.rows[0].seed as number;
}

test("Swiss next round ignores BYEs from another stage of the same tournament", async () => {
  const control = await fixture();
  const expectedSeed = await generateByeSeed(control);
  const candidate = await fixture();
  await database.pool.query("UPDATE tournament_stages SET qualification_mode='top_n', advancing_count=5 WHERE id=$1", [candidate.stage]);
  const stage = await database.pool.query(`INSERT INTO tournament_stages
    (tournament_id, stage_key, position, name, format, status, participant_count, best_of, planned_rounds, ranking_policy)
    VALUES ($1, 'history-test', 2, 'Other stage', 'swiss', 'planned', 5, 1, 3, 'swiss_v1') RETURNING id`, [candidate.id]);
  const otherStage = stage.rows[0].id as number;
  const player = (await database.pool.query("SELECT id FROM players WHERE tournament_id=$1 AND seed=$2", [candidate.id, expectedSeed])).rows[0].id as number;
  await database.pool.query("INSERT INTO stage_participants (stage_id, player_id, stage_seed, tournament_id) VALUES ($1,$2,$3,$4)", [otherStage, player, expectedSeed, candidate.id]);
  await database.pool.query(`INSERT INTO matches (tournament_id, stage_id, round, match_number, player1_id, winner_id, status, result_type, completed_at)
    VALUES ($1,$2,1,1,$3,$3,'completed','bye',now())`, [candidate.id, otherStage, player]);
  assert.equal(await generateByeSeed(candidate), expectedSeed);
});
