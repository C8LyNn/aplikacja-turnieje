/**
 * V5.4 on PostgreSQL: live stage tables agree with the engine's qualifiers; seeding rules from presets
 * reach the stored plan; private tournaments keep their tables private.
 */
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
  process.env.SESSION_SECRET = `v54-${randomUUID()}`;
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
  return { "x-organizer-token": signOrganizerToken(tournamentId, row!.organizer_password_hash) };
}

async function createFromPreset(presetId: string, params: Record<string, number>, extra: Record<string, unknown> = {}) {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `V5.4 ${randomUUID().slice(0, 8)}`, organizerPassword: "integration-organizer-password", ...preview.creation, ...extra })
    .expect(201);
  const tournamentId = created.body.id as number;
  const headers = await headersFor(tournamentId);
  for (let index = 1; index <= params.participantCount!; index += 1) {
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name: `P${String(index).padStart(2, "0")}` }).expect(201);
  }
  const stages = await rows<{ id: number; position: number; format: string }>("SELECT id, position, format FROM tournament_stages WHERE tournament_id = $1 ORDER BY position", [tournamentId]);
  return { preview, tournamentId, headers, stages };
}

type MatchRow = { id: number; player1_id: number; player2_id: number; status: string; result_type: string | null; stage_group_id: number | null };

async function openMatches(stageId: number): Promise<MatchRow[]> {
  return rows<MatchRow>("SELECT id, player1_id, player2_id, status, result_type, stage_group_id FROM matches WHERE stage_id = $1 AND status <> 'completed' AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number", [stageId]);
}

async function complete(headers: Record<string, string>, matchId: number, score1: number, score2: number) {
  await request(app).post(`/api/matches/${matchId}/complete`).set(headers)
    .send({ expectedRevision: await matchRevision(database, matchId), resultType: "played", score1, score2 })
    .expect(200);
}

describe("V5.4 live stage tables", () => {
  test("group tables rank by points with draws, mark the advancing zone and match the engine's qualifiers", async () => {
    const { tournamentId, headers, stages } = await createFromPreset("groups_playoff", { participantCount: 12, groupCount: 3, qualifiersPerGroup: 2, allowDraws: 1 });
    const [groups, playoff] = stages;
    const planned = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
    assert.equal(planned.status, "planned");
    assert.deepEqual(planned.tables, [], "a planned stage has no table yet");
    assert.equal(planned.advancingPlaces, 2);

    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    // Draw every third match; otherwise player1 wins 2:0 (goals in a points league).
    let index = 0;
    for (const match of await openMatches(groups.id)) {
      if (index % 3 === 0) await complete(headers, match.id, 1, 1);
      else await complete(headers, match.id, 2, 0);
      index += 1;
      if (index === 7) {
        const live = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
        assert.equal(live.final, false);
        assert.equal(live.tables.length, 3);
        assert.equal(live.tables.reduce((sum: number, table: Json) => sum + table.matchesPlayed, 0), 7);
        for (const table of live.tables) {
          assert.equal(table.rows.length, 4);
          const points = table.rows.map((row: Json) => row.points);
          assert.deepEqual(points, [...points].sort((a: number, b: number) => b - a), `${table.label} ordered by points`);
          for (const row of table.rows) {
            assert.equal(row.points, row.wins * 3 + row.draws, "3/1/0");
            assert.equal(row.zone, row.rank <= 2 ? "qualify" : "out");
          }
        }
      }
    }
    const done = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
    assert.ok(done.tables.some((table: Json) => table.rows.some((row: Json) => row.draws > 0)), "draws are counted");
    const zoneBeforeCompletion = done.tables.flatMap((table: Json) => table.rows.filter((row: Json) => row.zone === "qualify").map((row: Json) => row.playerId)).sort();

    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups.id}/complete`).set(headers).expect(200);
    const qualifiers = (await rows<{ player_id: number }>("SELECT player_id FROM stage_participants WHERE stage_id = $1", [playoff.id])).map((row) => row.player_id).sort();
    assert.deepEqual(qualifiers, zoneBeforeCompletion, "the advancing zone shown live is exactly who the engine qualifies");

    const final = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
    assert.equal(final.final, true, "completed stages show stored places");
    const stored = await rows<{ player_id: number; group_rank: number }>("SELECT player_id, group_rank FROM stage_participants WHERE stage_id = $1", [groups.id]);
    for (const table of final.tables) {
      for (const row of table.rows) assert.equal(row.rank, stored.find((item) => item.player_id === row.playerId)!.group_rank);
    }
  });

  test("a league table counts draws; Swiss returns a ranking with Buchholz; brackets have no table", async () => {
    const league = await createFromPreset("round_robin", { participantCount: 4, allowDraws: 1 });
    await request(app).post(`/api/tournaments/${league.tournamentId}/start`).set(league.headers).expect(200);
    const [first] = await openMatches(league.stages[0].id);
    await complete(league.headers, first.id, 2, 2);
    const table = (await request(app).get(`/api/tournaments/${league.tournamentId}/stages/${league.stages[0].id}/standings`).expect(200)).body as Json;
    assert.equal(table.tables.length, 1);
    assert.equal(table.tables[0].rows.filter((row: Json) => row.draws === 1 && row.points === 1).length, 2);
    assert.equal(table.advancingPlaces, null, "a single league advances nobody");

    const swiss = await createFromPreset("swiss", { participantCount: 6, swissRounds: 3 });
    await request(app).post(`/api/tournaments/${swiss.tournamentId}/start`).set(swiss.headers).expect(200);
    for (const match of await openMatches(swiss.stages[0].id)) await complete(swiss.headers, match.id, 1, 0);
    const ranking = (await request(app).get(`/api/tournaments/${swiss.tournamentId}/stages/${swiss.stages[0].id}/standings`).expect(200)).body as Json;
    assert.equal(ranking.format, "swiss");
    assert.equal(ranking.tables[0].rows.length, 6);
    assert.equal(ranking.leagueRules, null);
    assert.ok(ranking.tables[0].rows.every((row: Json) => row.points === null));

    const bracket = await createFromPreset("single_elimination", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${bracket.tournamentId}/start`).set(bracket.headers).expect(200);
    const none = (await request(app).get(`/api/tournaments/${bracket.tournamentId}/stages/${bracket.stages[0].id}/standings`).expect(200)).body as Json;
    assert.deepEqual(none.tables, []);
  });

  test("private tournaments keep stage tables private; foreign stages are 404", async () => {
    const hidden = await createFromPreset("round_robin", { participantCount: 4 }, { visibility: "private_offline" });
    await request(app).get(`/api/tournaments/${hidden.tournamentId}/stages/${hidden.stages[0].id}/standings`).expect(403);
    await request(app).get(`/api/tournaments/${hidden.tournamentId}/stages/${hidden.stages[0].id}/standings`).set(hidden.headers).expect(200);
    const other = await createFromPreset("round_robin", { participantCount: 4 });
    await request(app).get(`/api/tournaments/${other.tournamentId}/stages/${hidden.stages[0].id}/standings`).expect(404);
  });
});

describe("V5.4 seeding rules from presets", () => {
  test("random group draw and overall-ranking play-off seeding are stored and used", async () => {
    const { tournamentId, headers, stages } = await createFromPreset("groups_playoff", {
      participantCount: 8, groupCount: 2, qualifiersPerGroup: 2, groupPlacement: 1, qualifierSeeding: 1,
    }, {});
    const [groups, playoff] = stages;
    const [stored] = await rows<{ seeding_policy: string; result_seeding_policy: string; random_seed: string | null }>(
      "SELECT seeding_policy, result_seeding_policy, random_seed FROM tournament_stages WHERE id = $1", [groups.id],
    );
    assert.equal(stored!.seeding_policy, "random_groups");
    assert.equal(stored!.result_seeding_policy, "global_ranking");
    assert.equal(stored!.random_seed, "preset-draw", "a direct API client keeps the preview placeholder (the UI sends a fresh key)");
    // A random group draw is a ceremony the organiser runs before the start (unchanged engine rule).
    const endpoint = `/api/tournaments/${tournamentId}/stages/${groups.id}`;
    await request(app).post(`${endpoint}/seeding-ceremony/prepare`).set(headers).expect(200);
    await request(app).post(`${endpoint}/seeding-ceremony/reveal-all`).set(headers).expect(200);
    const started = await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers);
    assert.equal(started.status, 200, JSON.stringify(started.body));
    const assigned = await rows<{ group_id: number | null }>("SELECT group_id FROM stage_participants WHERE stage_id = $1", [groups.id]);
    assert.equal(assigned.length, 8);
    assert.ok(assigned.every((row) => row.group_id != null));
    for (const match of await openMatches(groups.id)) await complete(headers, match.id, 1, 0);
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups.id}/complete`).set(headers).expect(200);
    assert.equal((await rows("SELECT 1 FROM stage_participants WHERE stage_id = $1", [playoff.id])).length, 4);
  });
});
