// #324-L01-A · one authoritative draw: fixed and stored before any reveal, never re-drawn by a retry, a reload or two
// clicks at once, hidden from viewers until it is revealed, applied by the stage start exactly as stored, audited.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

type DbModule = typeof import("@workspace/db");
let app: Express;
let database: DbModule;
let config: TestDatabaseConfig;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `ceremony-l01a-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});
after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

type Draw = { drawNumber: number; playerId: number; playerName: string; participantKey: string; seed: number; placement: { label: string; kind: string; matchNumber?: number; side?: string } };
type Ceremony = { status: string; revealedCount: number; draws: Draw[]; randomSeed: string; participantOrder: string[] };

async function setup(drawKey = "l01a-klucz-tajny") {
  const created = await request(app).post("/api/tournaments").send({
    name: `Losowanie ${randomUUID().slice(0, 6)}`, format: "single_elimination", organizerPassword: "l01a-organizer-pass", supportPassword: "l01a-support-pass",
    stagePlan: { initialParticipantCount: 8, stages: [{ key: "puchar", position: 1, name: "Puchar", format: "single_elimination", participantCount: 8, bestOf: 1,
      placementMethod: "random", entrySeedingMethod: "registration_order", randomSeed: drawKey, randomRevealOrder: "sequential" }] },
  }).expect(201);
  const org = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 8; seed++) await request(app).post(`/api/tournaments/${created.body.id}/players`).set(org).send({ name: `Zawodnik ${seed}`, seed }).expect(201);
  const [stage] = (await request(app).get(`/api/tournaments/${created.body.id}/stages`).set(org).expect(200)).body as Array<{ id: number }>;
  return { id: created.body.id as number, org, stageId: stage.id, base: `/api/tournaments/${created.body.id}/stages/${stage.id}` };
}
const ceremonyOf = async (path: string, headers: Record<string, string> = {}) => (await request(app).get(`${path}/seeding-ceremony`).set(headers).expect(200)).body.ceremony as Ceremony;
const labels = (draws: Draw[]) => draws.map((d) => d.placement.label).sort();

test("L01-A: the draw is fixed once — concurrent prepares, reloads and retried reveals never draw again", async () => {
  const t = await setup();
  const [a, b] = await Promise.all([
    request(app).post(`${t.base}/seeding-ceremony/prepare`).set(t.org),
    request(app).post(`${t.base}/seeding-ceremony/prepare`).set(t.org),
  ]);
  assert.equal(a.status, 200); assert.equal(b.status, 200);
  assert.deepEqual(a.body.ceremony.draws, b.body.ceremony.draws, "two prepares at once give the same single draw");
  const prepared = a.body.ceremony as Ceremony;
  assert.equal(prepared.draws.length, 8);
  assert.equal(prepared.revealedCount, 0);
  // a third prepare (a retry, a reload of the organizer page) returns the stored draw
  assert.deepEqual((await request(app).post(`${t.base}/seeding-ceremony/prepare`).set(t.org).expect(200)).body.ceremony.draws, prepared.draws);
  assert.deepEqual((await ceremonyOf(t.base, t.org)).draws, prepared.draws, "a reload reads the same stored draw");

  // two reveal clicks with the count they saw: one draw is revealed, not two
  const [r1, r2] = await Promise.all([
    request(app).post(`${t.base}/seeding-ceremony/reveal-next`).set(t.org).send({ expectedRevealedCount: 0 }),
    request(app).post(`${t.base}/seeding-ceremony/reveal-next`).set(t.org).send({ expectedRevealedCount: 0 }),
  ]);
  assert.equal(r1.status, 200); assert.equal(r2.status, 200);
  assert.equal((await ceremonyOf(t.base, t.org)).revealedCount, 1);
  // a retried request after a timeout gets the state it already produced
  assert.equal((await request(app).post(`${t.base}/seeding-ceremony/reveal-next`).set(t.org).send({ expectedRevealedCount: 0 }).expect(200)).body.ceremony.revealedCount, 1);
  // older clients without the count keep the old behaviour (one more draw)
  assert.equal((await request(app).post(`${t.base}/seeding-ceremony/reveal-next`).set(t.org).expect(200)).body.ceremony.revealedCount, 2);
  const all = await request(app).post(`${t.base}/seeding-ceremony/reveal-all`).set(t.org).send({ expectedRevealedCount: 2 }).expect(200);
  assert.equal(all.body.ceremony.status, "completed");
  assert.equal((await request(app).post(`${t.base}/seeding-ceremony/reveal-all`).set(t.org).send({ expectedRevealedCount: 2 }).expect(200)).body.ceremony.status, "completed", "a retried reveal-all is not an error");
  assert.deepEqual(all.body.ceremony.draws, prepared.draws, "revealing never changes the stored result");

  // the stage start applies exactly the stored draw
  await request(app).post(`${t.base}/start`).set(t.org).send({}).expect(200);
  const matches = ((await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.org).expect(200)).body as Array<{ round: number; matchNumber: number; player1Id: number | null; player2Id: number | null }>)
    .filter((m) => m.round === 1);
  for (const draw of prepared.draws) {
    if (draw.placement.kind !== "bracket") continue;
    const m = matches.find((x) => x.matchNumber === draw.placement.matchNumber)!;
    assert.equal(draw.placement.side === "player1" ? m.player1Id : m.player2Id, draw.playerId, `${draw.playerName} sits where the draw put them`);
  }
  const applied = await ceremonyOf(t.base);
  assert.equal(applied.status, "applied");
  assert.deepEqual(applied.draws.map((d) => d.playerId), prepared.draws.map((d) => d.playerId), "after the start viewers see the full, same draw");
});

test("L01-A: viewers see only what has been revealed — no names of unrevealed draws, no seed, no entry order", async () => {
  const t = await setup("l01a-klucz-widz");
  const viewerStagesBefore = (await request(app).get(`/api/tournaments/${t.id}/stages`).expect(200)).body as Array<{ randomSeed: string | null }>;
  assert.equal(viewerStagesBefore[0].randomSeed, null, "the draw key of a planned stage is not public");
  const organizerStages = (await request(app).get(`/api/tournaments/${t.id}/stages`).set(t.org).expect(200)).body as Array<{ randomSeed: string | null }>;
  assert.equal(organizerStages[0].randomSeed, "l01a-klucz-widz", "the organizer still sees and can change it");

  const prepared = (await request(app).post(`${t.base}/seeding-ceremony/prepare`).set(t.org).expect(200)).body.ceremony as Ceremony;
  const hidden = await ceremonyOf(t.base);
  assert.equal(hidden.randomSeed, "");
  assert.deepEqual(hidden.participantOrder, []);
  assert.ok(hidden.draws.every((d) => d.playerName === "" && d.playerId === 0 && d.participantKey === ""), "no unrevealed pairing");
  assert.deepEqual(labels(hidden.draws), labels(prepared.draws), "the pool of results is shown (for the wheel), not who gets what");
  assert.doesNotMatch(JSON.stringify(hidden), /Zawodnik/);
  // the stage as viewers get it (the participant list itself is the public roster in registration order, not the draw)
  const listed = (await request(app).get(`/api/tournaments/${t.id}/stages`).expect(200)).body[0];
  const detailed = (await request(app).get(`/api/tournaments/${t.id}/stages/${t.stageId}`).expect(200)).body.stage;
  for (const stage of [listed, detailed]) assert.doesNotMatch(JSON.stringify(stage), /l01a-klucz-widz|"playerName":"Zawodnik/);

  await request(app).post(`${t.base}/seeding-ceremony/reveal-next`).set(t.org).send({ expectedRevealedCount: 0 }).expect(200);
  const one = await ceremonyOf(t.base);
  assert.deepEqual(one.draws[0], prepared.draws[0], "a revealed draw is shown in full and identical");
  assert.ok(one.draws.slice(1).every((d) => d.playerName === ""));
  // support staff see the whole prepared draw like the organizer
  const support = await request(app).post(`/api/tournaments/${t.id}/auth/support-login`).send({ password: "l01a-support-pass", nick: "Sędzia" }).expect(200);
  assert.deepEqual((await ceremonyOf(t.base, { "x-support-token": support.body.sessionToken })).draws, prepared.draws);
});

test("L01-A: only the organizer decides; resets are audited with what they discarded", async () => {
  const t = await setup("l01a-klucz-prawa");
  const support = await request(app).post(`/api/tournaments/${t.id}/auth/support-login`).send({ password: "l01a-support-pass", nick: "Pomoc" }).expect(200);
  for (const headers of [{}, { "x-support-token": support.body.sessionToken as string }, { "x-organizer-token": "nieprawidlowy" }] as Record<string, string>[]) {
    for (const action of ["prepare", "reveal-next", "reveal-all"]) {
      const res = await request(app).post(`${t.base}/seeding-ceremony/${action}`).set(headers).send({});
      assert.ok([401, 403].includes(res.status), `${action} refused (got ${res.status})`);
    }
    assert.ok([401, 403].includes((await request(app).delete(`${t.base}/seeding-ceremony`).set(headers)).status));
  }
  await request(app).post(`${t.base}/seeding-ceremony/prepare`).set(t.org).expect(200);
  await request(app).post(`${t.base}/seeding-ceremony/reveal-next`).set(t.org).send({ expectedRevealedCount: 0 }).expect(200);
  await request(app).delete(`${t.base}/seeding-ceremony`).set(t.org).expect((r) => assert.ok(r.status < 300));
  const log = ((await request(app).get(`/api/tournaments/${t.id}/action-log`).set(t.org).expect(200)).body as Array<{ actionType: string; description: string }>);
  const prepared = log.find((e) => e.actionType === "seeding_ceremony_prepared")!;
  const reset = log.find((e) => e.actionType === "seeding_ceremony_reset")!;
  assert.match(prepared.description, /uczestnicy=8; tryb=placement; ujawnianie=sequential; uruchomił: organizator/);
  assert.match(reset.description, /unieważniono po ujawnieniu 1 z 8\); zresetował: organizator/);
  assert.doesNotMatch(JSON.stringify(log), /l01a-klucz-prawa/, "the draw key never goes into the public log");
});
