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

const SESSION_SECRET = `ai-config-${randomUUID()}`;
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

async function playToCompletion(tournamentId: number, headers: Record<string, string>): Promise<void> {
  for (let step = 0; step < 600; step += 1) {
    const [tournament] = await rows<{ status: string; active_stage_id: number | null }>("SELECT status, active_stage_id FROM tournaments WHERE id = $1", [tournamentId]);
    if (tournament.status === "completed") return;
    const stageId = tournament.active_stage_id!;
    const ready = await rows<{ id: number; best_of: number; player1_id: number; player2_id: number }>(
      `SELECT id, best_of, player1_id, player2_id FROM matches WHERE tournament_id = $1 AND stage_id = $2 AND status = 'pending'
         AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number`, [tournamentId, stageId]);
    if (ready.length) {
      for (const match of ready) {
        const toWin = Math.floor(match.best_of / 2) + 1;
        const firstWins = match.player1_id < match.player2_id;
        await request(app).post(`/api/matches/${match.id}/complete`).set(headers)
          .send({ expectedRevision: await matchRevision(database, match.id), resultType: "played", score1: firstWins ? toWin : 0, score2: firstWins ? 0 : toWin })
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
    const [next] = await rows<{ id: number; status: string }>("SELECT id, status FROM tournament_stages WHERE tournament_id = $1 AND position = $2", [tournamentId, stage.position + 1]);
    const [afterState] = await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [tournamentId]);
    if (next && afterState.status !== "completed" && next.status === "planned") {
      await request(app).post(`/api/tournaments/${tournamentId}/stages/${next.id}/start`).set(headers).expect(200);
    }
  }
  assert.fail("tournament did not finish");
}

describe("V5-B: AI specification and import over HTTP", () => {
  test("specification downloads as markdown and JSON Schema", async () => {
    const md = await request(app).get("/api/tournaments/ai-spec.md").expect(200);
    assert.match(String(md.headers["content-type"]), /text\/markdown/);
    assert.match(String(md.headers["content-disposition"]), /attachment; filename="swarm006-specyfikacja-ai-v1\.md"/);
    assert.match(md.text, /# SWARM-006 — specyfikacja konfiguracji turnieju dla AI/);
    const schema = await request(app).get("/api/tournaments/ai-spec/schema.json").expect(200);
    assert.equal(JSON.parse(schema.text).$id, "https://swarm006.app/schemas/tournament-config.v1.json");
    const bundle = await request(app).get("/api/tournaments/ai-spec").expect(200);
    assert.equal(bundle.body.schemaVersion, 1);
    assert.ok(bundle.body.examples.length >= 4);
  });

  test("validate is read-only and strict about its envelope", async () => {
    const [before] = await rows<{ count: number }>("SELECT count(*)::int AS count FROM tournaments");
    const bundle = (await request(app).get("/api/tournaments/ai-spec").expect(200)).body;
    for (const example of bundle.examples) {
      const response = await request(app).post("/api/tournaments/ai-config/validate").send({ text: JSON.stringify(example.config) }).expect(200);
      assert.equal(response.body.valid, true, example.title);
    }
    const forbidden = await request(app).post("/api/tournaments/ai-config/validate")
      .send({ text: JSON.stringify({ ...bundle.examples[0].config, name: "Puchar", organizerPassword: "secret-from-ai" }) }).expect(422);
    assert.deepEqual(forbidden.body.problems.map((problem: { path: string }) => problem.path).sort(), ["name", "organizerPassword"]);
    await request(app).post("/api/tournaments/ai-config/validate").send({ text: "{}", name: "x" }).expect(400);
    await request(app).post("/api/tournaments/ai-config/validate").send({ config: {} }).expect(400);
    const [afterCount] = await rows<{ count: number }>("SELECT count(*)::int AS count FROM tournaments");
    assert.equal(afterCount.count, before.count, "validation never creates a tournament");
  });

  test("imported custom plan creates a real tournament that plays to a champion", async () => {
    const bundle = (await request(app).get("/api/tournaments/ai-spec").expect(200)).body;
    const custom = bundle.examples.find((example: { config: { structure: { type: string } } }) => example.config.structure.type === "stages");
    const validated = (await request(app).post("/api/tournaments/ai-config/validate").send({ text: JSON.stringify(custom.config) }).expect(200)).body;
    assert.equal(validated.continueIn, "advanced");
    // The user names the tournament and sets the password in the UI, then confirms.
    const created = await request(app).post("/api/tournaments")
      .send({ name: `AI ${randomUUID()}`, organizerPassword: "integration-organizer-password", visibility: validated.config.visibility, ...validated.preview.creation })
      .expect(201);
    const tournamentId = created.body.id as number;
    const headers = await headersFor(tournamentId);
    for (let index = 1; index <= validated.preview.participants.count; index += 1) {
      await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name: `AI-${index}-${randomUUID().slice(0, 6)}` }).expect(201);
    }
    const stages = await rows<{ name: string; format: string; participant_count: number }>(
      "SELECT name, format, participant_count FROM tournament_stages WHERE tournament_id = $1 ORDER BY position", [tournamentId]);
    assert.deepEqual(stages.map((stage) => [stage.name, stage.format, stage.participant_count]), [
      ["Rundy szwajcarskie", "swiss", 32], ["Grupy", "group_stage", 16], ["Finały", "single_elimination", 8],
    ]);
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    await playToCompletion(tournamentId, headers);
    const [final] = await rows<{ winner_id: number | null; played: number }>(
      `SELECT t.winner_id, (SELECT count(*)::int FROM matches m WHERE m.tournament_id = t.id AND m.result_type = 'played') AS played
       FROM tournaments t WHERE t.id = $1`, [tournamentId]);
    assert.ok(final.winner_id);
    assert.equal(final.played, validated.preview.totals.matches.min);
  });
});
