import { matchRevision } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema } from "./test-database";

let app: Express;
let database: typeof import("@workspace/db");
let schema: string;
before(async () => {
  const config = getSafeTestDatabaseConfig();
  schema = config.schema;
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `basket-flow-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool, schema);
  app = (await import("../src/app")).default;
});
after(async () => {
  if (!database) return;
  await dropTestSchema(database.pool, schema);
  await database.pool.end();
});

const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);

async function fixture(directCount: number, fanIn = false, ceremony = false) {
  const created = await request(app).post("/api/tournaments").send({
    name: `Basket flow ${randomUUID()}`, format: "swiss", organizerPassword: "basket-flow-test",
    stagePlan: { initialParticipantCount: 8 + directCount, stages: [
      { key: "source", name: "Source", position: 1, format: "swiss", participantCount: 8 + directCount, rounds: 1, bestOf: 1, advancingCount: 8 },
      { key: "target", name: "Target", position: 2, format: "single_elimination", participantCount: 8, bestOf: 1,
        ...(ceremony ? { entrySeedingMethod: "random", randomRevealOrder: "sequential", randomSeed: "basket-ceremony-regression" } : {}) },
    ] },
  }).expect(201);
  const id = created.body.id as number;
  const headers = { "x-organizer-token": created.body.organizerToken as string };
  const playerIds: number[] = [];
  for (let i = 0; i < 8 + directCount; i++) {
    const player = await request(app).post(`/api/tournaments/${id}/players`).set(headers)
      .send({ name: `Player ${i}`, seed: i + 1 }).expect(201);
    playerIds.push(player.body.id);
  }
  const { rows: stages } = await database.pool.query<{ id: number }>(
    "SELECT id FROM tournament_stages WHERE tournament_id=$1 ORDER BY position", [id],
  );
  const [source, target] = stages.map((s) => s.id);
  const basket = (key: string, stageId: number, type: "input" | "output", participantIds: number[], qualifierCount: number | null) =>
    ({ id: `${key}-${id}`, stageId, type, ordinal: 1, order: 1, colorId: null, participantIds, qualifierCount });
  const config = {
    baskets: [basket("in1", source, "input", playerIds.slice(0, 8), null),
      basket("out1", source, "output", [], 8),
      basket("in2", target, "input", playerIds.slice(8), null),
      basket("out2", target, "output", [], 1)],
    routes: [{ id: `route-${id}`, sourceBasketId: `out1-${id}`, targetBasketId: `in2-${id}` }],
  };
  if (fanIn) {
    config.baskets[1].qualifierCount = 4;
    config.baskets.push({ ...basket("out1b", source, "output", [], 4), ordinal: 2, order: 2 });
    config.routes.push({ id: `route-b-${id}`, sourceBasketId: `out1b-${id}`, targetBasketId: `in2-${id}` });
  }
  await request(app).put(`/api/tournaments/${id}/stage-baskets`).set(headers).send(config).expect(200);
  return { id, source, target, headers, playerIds, config };
}

async function qualifyAndRoute(f: Awaited<ReturnType<typeof fixture>>) {
  const endpoint = `/api/tournaments/${f.id}/stages/${f.source}`;
  await request(app).post(`${endpoint}/start`).set(f.headers).expect(200);
  const matches = await database.pool.query<{ id: number }>("SELECT id FROM matches WHERE stage_id=$1 ORDER BY id", [f.source]);
  assert.equal(matches.rows.length, 4, "Source must contain only its eight input players");
  for (const match of matches.rows) {
    await request(app).post(`/api/matches/${match.id}/complete`).set(f.headers)
      .send({ expectedRevision: await matchRevision(database, match.id), ...({ resultType: "played", score1: 1, score2: 0 }) }).expect(200);
  }
  await request(app).post(`${endpoint}/complete`).set(f.headers).expect(200);
  await request(app).post(`${endpoint}/basket-qualification-proposal`).set(f.headers).expect(200);
  await request(app).post(`${endpoint}/basket-qualification-proposal/approve`).set(f.headers).expect(200);
  const output = await request(app).get(`${endpoint}/basket-qualification-output`).set(f.headers).expect(200);
  assert.equal(output.body.entries.length, 8);
  const pending = await request(app).get(`/api/tournaments/${f.id}/stages/${f.target}/readiness`).set(f.headers).expect(200);
  assert.equal(pending.body.ready, false, "Approved output alone must not make an unexecuted route ready");
  for (const route of f.config.routes) {
    await request(app).post(`${endpoint}/baskets/${route.sourceBasketId}/route/execute`).set(f.headers).expect(200);
  }
  return output.body.entries.map((entry: { playerId: number }) => entry.playerId) as number[];
}

for (const directCount of [8, 0]) {
  test(`${directCount} direct + 8 routed: input, readiness, memberships and runtime agree`, async () => {
    const f = await fixture(directCount);
    const routed = await qualifyAndRoute(f);
    const endpoint = `/api/tournaments/${f.id}/stages/${f.target}`;
    const arrivals = await request(app).get(`${endpoint}/basket-input-arrivals`).set(f.headers).expect(200);
    assert.equal(arrivals.body.totalDirectCount, directCount);
    assert.equal(arrivals.body.totalRoutedCount, 8);
    assert.equal(arrivals.body.totalCount, 8 + directCount);
    assert.deepEqual(sorted(routed), sorted(f.playerIds.slice(0, 8)));
    const readiness = await request(app).get(`${endpoint}/readiness`).set(f.headers).expect(200);
    assert.equal(readiness.body.reasonCode, "READY", JSON.stringify(readiness.body));
    assert.equal(readiness.body.participantCount, 8 + directCount);
    const before = await database.pool.query("SELECT * FROM stage_participants WHERE stage_id=$1 ORDER BY id", [f.target]);
    assert.equal(before.rows.length, 0, "Basket completion must not prepopulate the target through legacy progression");
    if (directCount === 8) {
      const { startStage } = await import("../src/application/stages/stage-lifecycle");
      const { organizerCredentialFingerprint } = await import("../src/auth");
      const owner = await database.pool.query<{ organizer_password_hash: string }>(
        "SELECT organizer_password_hash FROM tournaments WHERE id = $1", [f.id],
      );
      const actor = {
        type: "organizer" as const,
        credentialFingerprint: organizerCredentialFingerprint(f.id, owner.rows[0].organizer_password_hash),
      };
      await assert.rejects(startStage({ tournamentId: f.id, stageId: f.target, actor }, {
        afterMatchesWritten: () => { throw new Error("injected start failure"); },
      }), /injected start failure/);
      const rolledBack = await database.pool.query("SELECT * FROM stage_participants WHERE stage_id=$1 ORDER BY id", [f.target]);
      assert.deepEqual(rolledBack.rows, before.rows);
      const matches = await database.pool.query("SELECT id FROM matches WHERE stage_id=$1", [f.target]);
      assert.equal(matches.rows.length, 0);
    }
    await request(app).post(`${endpoint}/start`).set(f.headers).expect(200);
    const members = await database.pool.query<{ player_id: number; stage_seed: number }>(
      "SELECT player_id, stage_seed FROM stage_participants WHERE stage_id=$1 ORDER BY stage_seed", [f.target],
    );
    assert.deepEqual(sorted(members.rows.map((r) => r.player_id)), sorted(f.playerIds));
    assert.deepEqual(members.rows.map((r) => r.stage_seed), f.playerIds.map((_, i) => i + 1));
    const runtime = await database.pool.query<{ player_id: number }>(
      "SELECT player1_id AS player_id FROM matches WHERE stage_id=$1 AND round=1 UNION SELECT player2_id FROM matches WHERE stage_id=$1 AND round=1", [f.target],
    );
    assert.deepEqual(sorted(runtime.rows.map((r) => r.player_id)), sorted(f.playerIds));
    const repeated = await request(app).post(`${endpoint}/start`).set(f.headers);
    assert.equal(repeated.status, 409);
    assert.equal(repeated.body.code, "STAGE_ALREADY_STARTED");
    const after = await database.pool.query("SELECT player_id, stage_seed FROM stage_participants WHERE stage_id=$1 ORDER BY stage_seed", [f.target]);
    assert.deepEqual(after.rows, members.rows);
  });
}

test("two routes feed the same target input without losing participants", async () => {
  const f = await fixture(0, true);
  await qualifyAndRoute(f);
  const endpoint = `/api/tournaments/${f.id}/stages/${f.target}`;
  const readiness = await request(app).get(`${endpoint}/readiness`).set(f.headers).expect(200);
  assert.equal(readiness.body.reasonCode, "READY");
  await request(app).post(`${endpoint}/start`).set(f.headers).expect(200);
  const members = await database.pool.query<{ player_id: number }>("SELECT player_id FROM stage_participants WHERE stage_id=$1", [f.target]);
  assert.deepEqual(sorted(members.rows.map((entry) => entry.player_id)), sorted(f.playerIds));
});

test("mixed basket ceremony preserves its roster and seeds through prepare, GET, reveal and start", async () => {
  const f = await fixture(8, false, true);
  await qualifyAndRoute(f);
  const endpoint = `/api/tournaments/${f.id}/stages/${f.target}`;
  const { loadBasketInputRoster } = await import("../src/application/stages/basket-input-roster");
  const { eq } = await import("drizzle-orm");
  const [stageRow] = await database.db.select().from(database.tournamentStagesTable).where(eq(database.tournamentStagesTable.id, f.target));
  const roster = await loadBasketInputRoster(database.db, stageRow);
  assert.deepEqual(sorted(roster.map((entry) => entry.playerId)), sorted(f.playerIds));
  const membershipsBefore = await database.pool.query("SELECT id FROM stage_participants WHERE stage_id=$1", [f.target]);
  assert.equal(membershipsBefore.rows.length, 0);
  const ready = await request(app).get(`${endpoint}/readiness`).set(f.headers).expect(200);
  assert.equal(ready.body.reasonCode, "READY");
  assert.equal(ready.body.participantCount, 16);
  await request(app).post(`${endpoint}/seeding-ceremony/prepare`).set(f.headers).expect(200);
  const prepared = (await request(app).get(`${endpoint}/seeding-ceremony`).set(f.headers).expect(200)).body.ceremony;
  assert.ok(prepared);
  assert.equal(prepared.draws.length, 16);
  assert.deepEqual(sorted(prepared.draws.map((draw: { playerId: number }) => draw.playerId)), sorted(f.playerIds));
  assert.equal(new Set(prepared.draws.map((draw: { playerId: number }) => draw.playerId)).size, 16);
  const repeated = (await request(app).post(`${endpoint}/seeding-ceremony/prepare`).set(f.headers).expect(200)).body.ceremony;
  assert.deepEqual(repeated, prepared);
  await request(app).delete(`${endpoint}/seeding-ceremony`).set(f.headers).expect(204);
  const reset = (await request(app).get(`${endpoint}/seeding-ceremony`).set(f.headers).expect(200)).body.ceremony;
  assert.equal(reset, null);
  const preparedAgain = (await request(app).post(`${endpoint}/seeding-ceremony/prepare`).set(f.headers).expect(200)).body.ceremony;
  assert.deepEqual(preparedAgain.draws, prepared.draws);
  await request(app).post(`${endpoint}/seeding-ceremony/reveal-next`).set(f.headers).expect(200);
  const partial = (await request(app).get(`${endpoint}/seeding-ceremony`).set(f.headers).expect(200)).body.ceremony;
  assert.equal(partial.revealedCount, 1);
  assert.deepEqual(partial.draws, prepared.draws);
  await request(app).post(`${endpoint}/seeding-ceremony/reveal-all`).set(f.headers).expect(200);
  const revealed = (await request(app).get(`${endpoint}/seeding-ceremony`).set(f.headers).expect(200)).body.ceremony;
  assert.equal(revealed.status, "completed");
  assert.equal(revealed.participantSignature, prepared.participantSignature);
  assert.equal(revealed.configurationSignature, prepared.configurationSignature);
  const stillNotMaterialized = await database.pool.query("SELECT id FROM stage_participants WHERE stage_id=$1", [f.target]);
  assert.equal(stillNotMaterialized.rows.length, 0, "Ceremony must only read the basket roster");
  await request(app).post(`${endpoint}/start`).set(f.headers).expect(200);
  const members = await database.pool.query<{ player_id: number; stage_seed: number }>(
    "SELECT player_id, stage_seed FROM stage_participants WHERE stage_id=$1 ORDER BY stage_seed", [f.target],
  );
  assert.deepEqual(members.rows, [...prepared.draws].sort((a, b) => a.seed - b.seed)
    .map((draw) => ({ player_id: draw.playerId, stage_seed: draw.seed })));
  const applied = (await request(app).get(`${endpoint}/seeding-ceremony`).set(f.headers).expect(200)).body.ceremony;
  assert.equal(applied.status, "applied");
  assert.deepEqual(applied.draws, prepared.draws);
});

test("incomplete basket input invalidates GET ceremony and blocks reveal without materializing players", async () => {
  const f = await fixture(8, false, true);
  await qualifyAndRoute(f);
  const endpoint = `/api/tournaments/${f.id}/stages/${f.target}/seeding-ceremony`;
  await request(app).post(`${endpoint}/prepare`).set(f.headers).expect(200);
  // Simulate incomplete persisted input after preparation: consumers must fail closed.
  await database.pool.query("DELETE FROM stage_basket_route_entries WHERE target_stage_id=$1 AND player_id=$2", [f.target, f.playerIds[0]]);
  const current = await request(app).get(endpoint).set(f.headers).expect(200);
  assert.equal(current.body.ceremony, null);
  for (const action of ["prepare", "reveal-next", "reveal-all"]) {
    const result = await request(app).post(`${endpoint}/${action}`).set(f.headers).expect(422);
    assert.equal(result.body.code, "STAGE_PARTICIPANTS_INCONSISTENT");
  }
  const members = await database.pool.query("SELECT id FROM stage_participants WHERE stage_id=$1", [f.target]);
  assert.equal(members.rows.length, 0);
});

test("conflicting direct and routed inputs block readiness and leave no partial memberships", async () => {
  const f = await fixture(8);
  await qualifyAndRoute(f);
  // Deliberately corrupt the input after routing to prove the lifecycle also validates it.
  // Keep the expected total at sixteen: this must fail on identity, not just count.
  await database.pool.query(
    "UPDATE stage_basket_participants SET player_id=$1 WHERE basket_id=$2 AND player_id=$3",
    [f.playerIds[0], `in2-${f.id}`, f.playerIds[8]],
  );
  const endpoint = `/api/tournaments/${f.id}/stages/${f.target}`;
  const readiness = await request(app).get(`${endpoint}/readiness`).set(f.headers).expect(200);
  assert.equal(readiness.body.ready, false);
  assert.equal(readiness.body.reasonCode, "STAGE_BASKET_CONFIGURATION_INVALID");
  const started = await request(app).post(`${endpoint}/start`).set(f.headers).expect(422);
  assert.equal(started.body.code, "STAGE_BASKET_CONFIGURATION_INVALID");
  const members = await database.pool.query("SELECT id FROM stage_participants WHERE stage_id=$1", [f.target]);
  assert.equal(members.rows.length, 0);
});

test("direct-only explicit baskets use the same roster through the tournament start endpoint", async () => {
  const created = await request(app).post("/api/tournaments").send({
    name: `Direct ${randomUUID()}`, format: "single_elimination", organizerPassword: "basket-flow-test", defaultBestOf: 1,
  }).expect(201);
  const id = created.body.id as number;
  const headers = { "x-organizer-token": created.body.organizerToken as string };
  const players: number[] = [];
  for (let i = 0; i < 8; i++) {
    const res = await request(app).post(`/api/tournaments/${id}/players`).set(headers).send({ name: `Direct ${i}`, seed: i + 1 }).expect(201);
    players.push(res.body.id);
  }
  const { rows: [stage] } = await database.pool.query<{ id: number }>("SELECT id FROM tournament_stages WHERE tournament_id=$1", [id]);
  await request(app).put(`/api/tournaments/${id}/stage-baskets`).set(headers).send({
    baskets: [
      { id: `direct-in-${id}`, stageId: stage.id, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: players, qualifierCount: null },
      { id: `direct-out-${id}`, stageId: stage.id, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: 1 },
    ], routes: [],
  }).expect(200);
  const readiness = await request(app).get(`/api/tournaments/${id}/stages/${stage.id}/readiness`).set(headers).expect(200);
  assert.equal(readiness.body.reasonCode, "READY");
  await request(app).post(`/api/tournaments/${id}/start`).set(headers).expect(200);
  const members = await database.pool.query<{ player_id: number }>("SELECT player_id FROM stage_participants WHERE stage_id=$1", [stage.id]);
  assert.deepEqual(sorted(members.rows.map((entry) => entry.player_id)), sorted(players));
});
