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

/**
 * V5 Stage A acceptance: a preset is only "supported" if a tournament created from
 * its preview can be filled, started, played to the end and produces one champion.
 */
interface DatabaseModule { pool: typeof import("@workspace/db").pool }

const SESSION_SECRET = `presets-full-run-${randomUUID()}`;
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
  const [row] = await rows<{ organizer_password_hash: string }>(
    "SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  return { "x-organizer-token": signOrganizerToken(tournamentId, row.organizer_password_hash) };
}

interface PendingMatch { id: number; best_of: number; player1_id: number; player2_id: number }

/** Plays every ready match (lower registration id wins), advances rounds and stages. */
async function playToCompletion(tournamentId: number, headers: Record<string, string>): Promise<void> {
  for (let step = 0; step < 400; step += 1) {
    const [tournament] = await rows<{ status: string; active_stage_id: number | null }>(
      "SELECT status, active_stage_id FROM tournaments WHERE id = $1", [tournamentId]);
    if (tournament.status === "completed") return;
    assert.equal(tournament.status, "active");
    const stageId = tournament.active_stage_id;
    assert.ok(stageId, "active tournament has an active stage");
    const ready = await rows<PendingMatch>(
      `SELECT id, best_of, player1_id, player2_id FROM matches
       WHERE tournament_id = $1 AND stage_id = $2 AND status = 'pending'
         AND player1_id IS NOT NULL AND player2_id IS NOT NULL
       ORDER BY round, match_number`, [tournamentId, stageId]);
    if (ready.length > 0) {
      for (const match of ready) {
        const toWin = Math.floor(match.best_of / 2) + 1;
        const firstWins = match.player1_id < match.player2_id;
        await request(app).post(`/api/matches/${match.id}/complete`).set(headers)
          .send({
            expectedRevision: await matchRevision(database, match.id),
            resultType: "played",
            score1: firstWins ? toWin : 0,
            score2: firstWins ? 0 : toWin,
          })
          .expect(200);
      }
      continue;
    }
    const [stage] = await rows<{ format: string; planned_rounds: number | null; current_round: number | null; position: number }>(
      "SELECT format, planned_rounds, current_round, position FROM tournament_stages WHERE id = $1", [stageId]);
    if (stage.format === "swiss" && (stage.current_round ?? 0) < (stage.planned_rounds ?? 0)) {
      await request(app).post(`/api/tournaments/${tournamentId}/generate-round`).set(headers).expect(200);
      continue;
    }
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${stageId}/complete`).set(headers).expect(200);
    const [next] = await rows<{ id: number; status: string }>(
      "SELECT id, status FROM tournament_stages WHERE tournament_id = $1 AND position = $2", [tournamentId, stage.position + 1]);
    const [after] = await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [tournamentId]);
    if (next && after.status !== "completed" && next.status === "planned") {
      await request(app).post(`/api/tournaments/${tournamentId}/stages/${next.id}/start`).set(headers).expect(200);
    }
  }
  assert.fail("tournament did not finish within the step budget");
}

const CASES: Array<{ presetId: string; participants: number; params?: Record<string, number> }> = [
  { presetId: "single_elimination", participants: 6 },
  { presetId: "single_elimination", participants: 8, params: { bestOf: 3 } },
  { presetId: "double_elimination", participants: 8 },
  { presetId: "double_elimination", participants: 6 },
  { presetId: "swiss", participants: 7, params: { swissRounds: 3 } },
  { presetId: "round_robin", participants: 5 },
  { presetId: "groups_playoff", participants: 16, params: { groupCount: 4, qualifiersPerGroup: 2 } },
  { presetId: "groups_playoff", participants: 14, params: { groupCount: 3, qualifiersPerGroup: 2, playoffBestOf: 3 } },
  { presetId: "swiss_playoff", participants: 12, params: { swissRounds: 3, advancingCount: 4 } },
  { presetId: "league_playoff", participants: 6, params: { advancingCount: 4 } },
];

describe("V5 presets: created from preview, played to a champion", () => {
  for (const item of CASES) {
    test(`${item.presetId} with ${item.participants} participants`, async () => {
      const previewResponse = await request(app).post("/api/tournaments/presets/preview")
        .send({ presetId: item.presetId, params: { participantCount: item.participants, ...item.params } })
        .expect(200);
      const preview = previewResponse.body;
      const created = await request(app).post("/api/tournaments")
        .send({ name: `Preset ${item.presetId} ${randomUUID()}`, organizerPassword: "integration-organizer-password", visibility: "public_online", ...preview.creation })
        .expect(201);
      const tournamentId = created.body.id as number;
      const headers = await headersFor(tournamentId);
      for (let index = 1; index <= item.participants; index += 1) {
        await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers)
          .send({ name: `P${index}-${randomUUID().slice(0, 6)}` }).expect(201);
      }
      const stageRows = await rows<{ format: string; participant_count: number }>(
        "SELECT format, participant_count FROM tournament_stages WHERE tournament_id = $1 ORDER BY position", [tournamentId]);
      assert.deepEqual(stageRows.map((stage) => stage.format), preview.stages.map((stage: { format: string }) => stage.format));
      await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
      await playToCompletion(tournamentId, headers);

      const [final] = await rows<{ winner_id: number | null; played: number; winners: number; stages_done: boolean }>(
        `SELECT t.winner_id,
                (SELECT count(*)::int FROM matches m WHERE m.tournament_id = t.id AND m.result_type = 'played') AS played,
                (SELECT count(*)::int FROM players p WHERE p.tournament_id = t.id AND p.status = 'winner') AS winners,
                (SELECT bool_and(s.status = 'completed') FROM tournament_stages s WHERE s.tournament_id = t.id) AS stages_done
         FROM tournaments t WHERE t.id = $1`, [tournamentId]);
      assert.ok(final.winner_id, "champion recorded");
      assert.equal(final.winners, 1);
      assert.equal(final.stages_done, true);
      assert.ok(final.played >= preview.totals.matches.min && final.played <= preview.totals.matches.max,
        `played ${final.played} within predicted ${preview.totals.matches.min}..${preview.totals.matches.max}`);
    });
  }

  test("multi-stage preset refuses to start with fewer participants than planned", async () => {
    const preview = (await request(app).post("/api/tournaments/presets/preview")
      .send({ presetId: "groups_playoff", params: { participantCount: 8 } }).expect(200)).body;
    assert.equal(preview.participants.mode, "exact");
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Short roster ${randomUUID()}`, organizerPassword: "integration-organizer-password", ...preview.creation })
      .expect(201);
    const headers = await headersFor(created.body.id);
    for (let index = 1; index <= 7; index += 1) {
      await request(app).post(`/api/tournaments/${created.body.id}/players`).set(headers).send({ name: `S${index}-${randomUUID().slice(0, 6)}` }).expect(201);
    }
    const start = await request(app).post(`/api/tournaments/${created.body.id}/start`).set(headers);
    assert.ok(start.status >= 400 && start.status < 500, `start rejected (${start.status})`);
    const [state] = await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [created.body.id]);
    assert.equal(state.status, "draft");
  });

  test("preset endpoints are read-only and reject invalid input", async () => {
    const before = await rows<{ count: number }>("SELECT count(*)::int AS count FROM tournaments");
    const catalog = await request(app).get("/api/tournaments/presets").expect(200);
    assert.equal(catalog.body.version, 1);
    assert.ok(catalog.body.planned.every((item: { available: boolean }) => item.available === false));
    const recommend = await request(app).post("/api/tournaments/presets/recommend")
      .send({ participantCount: 16, grouping: "yes", priority: "accurate", kind: "tournament", participantType: "teams" }).expect(200);
    assert.equal(recommend.body.recommendations[0].presetId, "groups_playoff");
    const invalid = await request(app).post("/api/tournaments/presets/preview")
      .send({ presetId: "groups_playoff", params: { participantCount: 12, groupCount: 9 } }).expect(422);
    assert.equal(invalid.body.param, "groupCount");
    await request(app).post("/api/tournaments/presets/preview")
      .send({ presetId: "swiss", params: { participantCount: 8 }, organizerPassword: "x" }).expect(422);
    const afterCount = await rows<{ count: number }>("SELECT count(*)::int AS count FROM tournaments");
    assert.equal(afterCount[0].count, before[0].count);
  });
});
