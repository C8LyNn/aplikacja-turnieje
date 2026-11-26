/**
 * V6.2 on PostgreSQL, through the API: the cases found by the V6.1 tournament audit (2026-11-25).
 *  1. "Grupy i play-off": qualifiers of one group are crossed in the play-off (A1–B2, B1–A2), in both seeding modes.
 *  2. "Tabela i play-off" with draws and explicit baskets: a boundary decided by points is not a tie.
 *  3. Groups with league rules seed the play-off by points (draws count).
 */
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

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `v62-${randomUUID()}`;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

interface Event { id: number; organizer: Record<string, string>; ids: Map<string, number>; names: Map<number, string>; stages: Json[] }

async function create(presetId: string, params: Record<string, number>, names: string[]): Promise<Event> {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `V6.2 ${randomUUID().slice(0, 6)}`, organizerPassword: "integration-organizer-password", ...preview.creation })
    .expect(201);
  assert.ok(created.body.organizerToken, "organizer token");
  const organizer = { "x-organizer-token": created.body.organizerToken as string };
  const ids = new Map<string, number>();
  for (const name of names) {
    ids.set(name, (await request(app).post(`/api/tournaments/${created.body.id}/players`).set(organizer).send({ name }).expect(201)).body.id);
  }
  const stages = (await request(app).get(`/api/tournaments/${created.body.id}/stages`).set(organizer).expect(200)).body as Json[];
  stages.sort((left, right) => left.position - right.position);
  return { id: created.body.id, organizer, ids, names: new Map([...ids].map(([name, id]) => [id, name])), stages };
}

async function stageMatches(event: Event, stageId: number): Promise<Json[]> {
  const all = (await request(app).get(`/api/tournaments/${event.id}/matches`).set(event.organizer).expect(200)).body as Json[];
  return all.filter((match) => match.stageId === stageId);
}

/** Plays every open match of a stage with the scores given by "Name1-Name2" (either order). */
async function play(event: Event, stageId: number, results: Record<string, [number, number]>): Promise<void> {
  for (const match of await stageMatches(event, stageId)) {
    if (match.status === "completed" || match.player1Id == null || match.player2Id == null) continue;
    const home = event.names.get(match.player1Id)!;
    const away = event.names.get(match.player2Id)!;
    const direct = results[`${home}-${away}`];
    const reverse = results[`${away}-${home}`];
    const [score1, score2] = direct ?? [reverse![1], reverse![0]];
    await request(app).post(`/api/matches/${match.id}/complete`).set(event.organizer)
      .send({ expectedRevision: match.revision, resultType: "played", score1, score2 }).expect(200);
  }
}

async function completeStage(event: Event, stageId: number): Promise<Json> {
  const preview = (await request(app).get(`/api/tournaments/${event.id}/stages/${stageId}/qualification-preview`).set(event.organizer).expect(200)).body;
  await request(app).post(`/api/tournaments/${event.id}/stages/${stageId}/complete`).set(event.organizer)
    .send({ expectedFingerprint: preview.fingerprint, expectedStageVersion: preview.stageVersion }).expect(200);
  return preview;
}

async function firstRoundPairs(event: Event, stageId: number): Promise<string[]> {
  await request(app).post(`/api/tournaments/${event.id}/stages/${stageId}/start`).set(event.organizer).expect(200);
  return (await stageMatches(event, stageId))
    .filter((match) => match.round === 1 && match.player1Id != null && match.player2Id != null)
    .map((match) => [event.names.get(match.player1Id)!, event.names.get(match.player2Id)!].sort().join("–"))
    .sort();
}

const seedsOf = (preview: Json, event: Event) => [...preview.qualifiers]
  .sort((left: Json, right: Json) => left.nextStageSeed - right.nextStageSeed)
  .map((qualifier: Json) => `${event.names.get(qualifier.playerId)}(${qualifier.groupKey}${qualifier.groupRank})`);

// Snake placement of P1..P6 by registration order: group A = P1, P4, P5; group B = P2, P3, P6.
const SIX = ["P1", "P2", "P3", "P4", "P5", "P6"];

describe("V6.2 · group → play-off", () => {
  test("groups with draws: seeds follow the points, and group mates are crossed in the semi-finals (both seeding modes)", async () => {
    // A: P1 4 pts (+3), P4 4 pts (+1), P5 0; B: P2 6 pts, P3 3 pts, P6 0.
    const results: Record<string, [number, number]> = {
      "P1-P4": [0, 0], "P1-P5": [3, 0], "P4-P5": [1, 0], "P2-P3": [1, 0], "P2-P6": [1, 0], "P3-P6": [1, 0],
    };
    for (const qualifierSeeding of [0, 1]) {
      const event = await create("groups_playoff", {
        participantCount: 6, groupCount: 2, qualifiersPerGroup: 2, allowDraws: 1, pointsWin: 3, pointsDraw: 1, pointsLoss: 0,
        bestOf: 1, playoffBestOf: 1, entrySeeding: 0, groupPlacement: 0, qualifierSeeding,
      }, SIX);
      const [groups, playoff] = event.stages;
      await request(app).post(`/api/tournaments/${event.id}/start`).set(event.organizer).expect(200);
      await play(event, groups.id, results);
      const preview = await completeStage(event, groups.id);
      // V6.1 seeded P1 (4 pts) first and paired P1–P4 / P2–P3 (or the reverse) — both group re-matches.
      assert.deepEqual(seedsOf(preview, event), ["P2(B1)", "P1(A1)", "P3(B2)", "P4(A2)"], `qualifierSeeding=${qualifierSeeding}`);
      assert.ok(preview.ranking.every((row: Json) => !("points" in row) && !("matchDraws" in row)), "the preview keeps its earlier shape");
      assert.ok(preview.qualifiers.every((row: Json) => !("points" in row) && !("matchDraws" in row)));
      assert.deepEqual(await firstRoundPairs(event, playoff.id), ["P1–P3", "P2–P4"], `qualifierSeeding=${qualifierSeeding}`);
    }
  });

  test("groups without draws: the semi-finals are A1–B2 and B1–A2 even when the runners-up order would pair group mates", async () => {
    // Best of 3. A: P1 2–0 2–0, P4 beats P5 2–1; B: P2 2–1 2–1, P3 beats P6 2–0 → V6.1 played P1–P4 and P2–P3.
    const event = await create("groups_playoff", {
      participantCount: 6, groupCount: 2, qualifiersPerGroup: 2, bestOf: 3, playoffBestOf: 1, entrySeeding: 0, groupPlacement: 0, qualifierSeeding: 0,
    }, SIX);
    const [groups, playoff] = event.stages;
    await request(app).post(`/api/tournaments/${event.id}/start`).set(event.organizer).expect(200);
    await play(event, groups.id, {
      "P1-P4": [2, 0], "P1-P5": [2, 0], "P4-P5": [2, 1], "P2-P3": [2, 1], "P2-P6": [2, 1], "P3-P6": [2, 0],
    });
    const preview = await completeStage(event, groups.id);
    assert.deepEqual(seedsOf(preview, event), ["P1(A1)", "P2(B1)", "P4(A2)", "P3(B2)"]);
    assert.deepEqual(await firstRoundPairs(event, playoff.id), ["P1–P3", "P2–P4"]);
  });
});

async function explicitBaskets(event: Event, leagueStageId: number, qualifierCount: number): Promise<void> {
  const current = (await request(app).get(`/api/tournaments/${event.id}/stage-baskets`).set(event.organizer).expect(200)).body;
  const baskets = current.baskets.map((basket: Json) => ({
    id: basket.id, stageId: basket.stageId, type: basket.type, ordinal: basket.ordinal, order: basket.order, colorId: basket.colorId,
    participantIds: basket.participantIds,
    qualifierCount: basket.type !== "output" ? basket.qualifierCount : basket.stageId === leagueStageId ? qualifierCount : 1,
  }));
  const saved = await request(app).put(`/api/tournaments/${event.id}/stage-baskets`).set(event.organizer)
    .send({ baskets, routes: current.routes }).expect(200);
  assert.equal(saved.body.legacyDefaulted, false);
}

describe("V6.2 · league with draws and explicit baskets", () => {
  const PLAN = { participantCount: 4, advancingCount: 2, allowDraws: 1, pointsWin: 3, pointsDraw: 1, pointsLoss: 0, bestOf: 1, playoffBestOf: 1 };
  const NAMES = ["Ala", "Bartek", "Celina", "Darek"];

  test("2nd and 3rd place separated by points (one draw) → the proposal is created and approved", async () => {
    const event = await create("league_playoff", PLAN, NAMES);
    const [league] = event.stages;
    await explicitBaskets(event, league.id, 2);
    await request(app).post(`/api/tournaments/${event.id}/start`).set(event.organizer).expect(200);
    // Ala 7, Bartek 4 (1W 1D 1L, 2:3), Celina 3 (1W 0D 2L, 2:3), Darek 3: Bartek and Celina have the same wins and goals.
    await play(event, league.id, {
      "Ala-Bartek": [1, 1], "Ala-Celina": [2, 0], "Ala-Darek": [1, 0], "Bartek-Celina": [1, 0], "Bartek-Darek": [0, 2], "Celina-Darek": [2, 0],
    });
    await completeStage(event, league.id);
    const proposal = await request(app).post(`/api/tournaments/${event.id}/stages/${league.id}/basket-qualification-proposal`)
      .set(event.organizer).send({});
    assert.equal(proposal.status, 200, proposal.text);
    assert.deepEqual(proposal.body.entries.map((entry: Json) => event.names.get(entry.playerId)), ["Ala", "Bartek"]);
    const approved = await request(app).post(`/api/tournaments/${event.id}/stages/${league.id}/basket-qualification-proposal/approve`)
      .set(event.organizer).send({});
    assert.equal(approved.status, 200, approved.text);
    assert.equal(approved.body.status, "approved");
  });

  test("a boundary that every criterion leaves level (seed decides) still asks for a tie-break", async () => {
    const event = await create("league_playoff", PLAN, NAMES);
    const [league] = event.stages;
    await explicitBaskets(event, league.id, 2);
    await request(app).post(`/api/tournaments/${event.id}/start`).set(event.organizer).expect(200);
    await play(event, league.id, {
      "Ala-Bartek": [0, 0], "Ala-Celina": [0, 0], "Ala-Darek": [0, 0], "Bartek-Celina": [0, 0], "Bartek-Darek": [0, 0], "Celina-Darek": [0, 0],
    });
    await completeStage(event, league.id);
    const proposal = await request(app).post(`/api/tournaments/${event.id}/stages/${league.id}/basket-qualification-proposal`)
      .set(event.organizer).send({});
    assert.equal(proposal.status, 422, proposal.text);
    assert.equal(proposal.body.code, "STAGE_BASKET_TIE_BREAK_REQUIRED");
  });
});
