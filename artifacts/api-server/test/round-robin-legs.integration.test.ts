import { matchRevision } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule { pool: typeof import("@workspace/db").pool }

const SESSION_SECRET = `rr-legs-${randomUUID()}`;
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
  process.env.SESSION_SECRET = SESSION_SECRET;
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

async function headersFor(tournamentId: number): Promise<Record<string, string>> {
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  return { "x-organizer-token": signOrganizerToken(tournamentId, row.organizer_password_hash) };
}

/** firstWins decides who wins every match (by registration id) — lets tests shape head-to-head. */
async function playToCompletion(tournamentId: number, headers: Record<string, string>, decide: (match: { player1_id: number; player2_id: number; round: number }) => number): Promise<void> {
  for (let step = 0; step < 600; step += 1) {
    const [tournament] = await rows<{ status: string; active_stage_id: number | null }>("SELECT status, active_stage_id FROM tournaments WHERE id = $1", [tournamentId]);
    if (tournament.status === "completed") return;
    const stageId = tournament.active_stage_id!;
    const ready = await rows<{ id: number; best_of: number; player1_id: number; player2_id: number; round: number }>(
      `SELECT id, best_of, player1_id, player2_id, round FROM matches WHERE tournament_id = $1 AND stage_id = $2 AND status = 'pending'
         AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number`, [tournamentId, stageId]);
    if (ready.length) {
      for (const match of ready) {
        const toWin = Math.floor(match.best_of / 2) + 1;
        const winner = decide(match);
        await request(app).post(`/api/matches/${match.id}/complete`).set(headers)
          .send({ expectedRevision: await matchRevision(database, match.id), resultType: "played", score1: winner === match.player1_id ? toWin : 0, score2: winner === match.player2_id ? toWin : 0 })
          .expect(200);
      }
      continue;
    }
    const [stage] = await rows<{ position: number }>("SELECT position FROM tournament_stages WHERE id = $1", [stageId]);
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${stageId}/complete`).set(headers).expect(200);
    const [next] = await rows<{ id: number; status: string }>("SELECT id, status FROM tournament_stages WHERE tournament_id = $1 AND position = $2", [tournamentId, stage.position + 1]);
    const [afterState] = await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [tournamentId]);
    if (next && afterState.status !== "completed" && next.status === "planned") {
      await request(app).post(`/api/tournaments/${tournamentId}/stages/${next.id}/start`).set(headers).expect(200);
    }
  }
  assert.fail("tournament did not finish");
}

async function createFromPreset(presetId: string, params: Record<string, number>) {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `Legs ${randomUUID()}`, organizerPassword: "integration-organizer-password", ...preview.creation })
    .expect(201);
  const tournamentId = created.body.id as number;
  const headers = await headersFor(tournamentId);
  const ids: number[] = [];
  for (let index = 1; index <= params.participantCount; index += 1) {
    const player = await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name: `L${index}-${randomUUID().slice(0, 6)}` }).expect(201);
    ids.push(player.body.id);
  }
  return { preview, tournamentId, headers, ids };
}

describe("V5-C: home-and-away league end to end", () => {
  test("migration: existing stages default to one leg; two legs only for round robin", async () => {
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Legacy ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "swiss", swissRounds: 3, maxPlayers: 8 })
      .expect(201);
    const headers = await headersFor(created.body.id);
    await request(app).post(`/api/tournaments/${created.body.id}/players`).set(headers).send({ name: `S-${randomUUID().slice(0, 6)}` }).expect(201);
    const [stage] = await rows<{ id: number; round_robin_legs: number }>("SELECT id, round_robin_legs FROM tournament_stages WHERE tournament_id = $1", [created.body.id]);
    assert.equal(stage.round_robin_legs, 1);
    await assert.rejects(
      database.pool.query("UPDATE tournament_stages SET round_robin_legs = 2 WHERE id = $1", [stage.id]),
      /tournament_stages_round_robin_legs_supported/,
    );
    await assert.rejects(
      database.pool.query("UPDATE tournament_stages SET round_robin_legs = 3 WHERE id = $1", [stage.id]),
      /tournament_stages_round_robin_legs_supported/,
    );
  });

  test("single-stage league: 5 teams play 20 matches over 10 rounds; table counts both legs", async () => {
    const { preview, tournamentId, headers, ids } = await createFromPreset("round_robin", { participantCount: 5, legs: 2 });
    const [stage] = await rows<{ id: number; round_robin_legs: number }>("SELECT id, round_robin_legs FROM tournament_stages WHERE tournament_id = $1", [tournamentId]);
    assert.equal(stage.round_robin_legs, 2);
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const [{ count, rounds }] = await rows<{ count: number; rounds: number }>("SELECT count(*)::int AS count, max(round)::int AS rounds FROM matches WHERE stage_id = $1", [stage.id]);
    assert.equal(count, 20);
    assert.equal(rounds, 10);
    // ids[0] wins everything at home and away except it loses both duels with ids[1].
    await playToCompletion(tournamentId, headers, (match) => {
      const pair = [match.player1_id, match.player2_id];
      if (pair.includes(ids[0]) && pair.includes(ids[1])) return ids[1];
      if (pair.includes(ids[0])) return ids[0];
      if (pair.includes(ids[1])) return match.round <= 5 ? ids[1] : (pair[0] === ids[1] ? pair[1] : pair[0]);
      return Math.min(...pair);
    });
    const standings = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body;
    const list = Array.isArray(standings) ? standings : standings.standings;
    assert.equal(list.length, 5);
    for (const row of list) assert.equal(row.matchesPlayed, 8, "each team plays every other team twice");
    const [final] = await rows<{ winner_id: number; played: number }>(
      "SELECT t.winner_id, (SELECT count(*)::int FROM matches m WHERE m.tournament_id = t.id AND m.result_type = 'played') AS played FROM tournaments t WHERE t.id = $1", [tournamentId]);
    assert.equal(final.played, preview.totals.matches.min);
    assert.ok(final.winner_id);
  });

  test("league + play-off with home and away: 6 teams → top 4 → champion", async () => {
    const { preview, tournamentId, headers } = await createFromPreset("league_playoff", { participantCount: 6, legs: 2, advancingCount: 4, playoffBestOf: 3 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    await playToCompletion(tournamentId, headers, (match) => Math.min(match.player1_id, match.player2_id));
    const [final] = await rows<{ winner_id: number; played: number; table: number }>(
      `SELECT t.winner_id,
              (SELECT count(*)::int FROM matches m WHERE m.tournament_id = t.id AND m.result_type = 'played') AS played,
              (SELECT count(*)::int FROM matches m JOIN tournament_stages s ON s.id = m.stage_id WHERE s.tournament_id = t.id AND s.position = 1) AS table
       FROM tournaments t WHERE t.id = $1`, [tournamentId]);
    assert.equal(final.table, 30);
    assert.equal(final.played, preview.totals.matches.min);
    assert.ok(final.winner_id);
  });

  test("backup export keeps the leg count only where it matters", async () => {
    const { tournamentId, headers } = await createFromPreset("league_playoff", { participantCount: 6, legs: 2, advancingCount: 4 });
    const exported = (await request(app).get(`/api/tournaments/${tournamentId}/export`).set(headers).expect(200)).body;
    const stages = exported.stages ?? exported.backup?.stages;
    assert.ok(Array.isArray(stages), JSON.stringify(Object.keys(exported)));
    assert.equal(stages[0].roundRobinLegs, 2);
    assert.equal("roundRobinLegs" in stages[1], false);
  });
});
