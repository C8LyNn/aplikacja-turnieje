// #330 · hidden (private offline) → public, back to hidden only before the start, never a leak of a hidden tournament.
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
  process.env.SESSION_SECRET = `visibility-330-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});
after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

const PUBLIC_READS = (id: number) => [
  `/api/tournaments/${id}`, `/api/tournaments/${id}/players`, `/api/tournaments/${id}/matches`, `/api/tournaments/${id}/stages`,
  `/api/tournaments/${id}/bracket`, `/api/tournaments/${id}/standings`, `/api/tournaments/${id}/stats`, `/api/tournaments/${id}/results-history`,
  `/api/tournaments/${id}/participant-fields`, `/api/tournaments/${id}/action-log`, `/api/tournaments/${id}/teams`,
];

async function create(visibility: string) {
  const created = await request(app).post("/api/tournaments").send({
    name: `Ukryty ${randomUUID()}`, format: "single_elimination", maxPlayers: 4, defaultBestOf: 1,
    organizerPassword: "visibility-330-organizer", supportPassword: "visibility-330-support", visibility,
  }).expect(201);
  const organizer = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 4; seed++) {
    await request(app).post(`/api/tournaments/${created.body.id}/players`).set(organizer).send({ name: `Ukryty gracz ${seed}`, seed }).expect(201);
  }
  return { id: created.body.id as number, name: created.body.name as string, organizer };
}

async function assertHidden(id: number, name: string) {
  for (const path of PUBLIC_READS(id)) {
    const response = await request(app).get(path);
    assert.ok([401, 403].includes(response.status), `${path} must refuse an anonymous reader (got ${response.status})`);
    assert.ok(!JSON.stringify(response.body).includes("Ukryty gracz"), `${path} leaks participants`);
  }
  const list = await request(app).get("/api/tournaments").expect(200);
  assert.ok(!(list.body as Array<{ name: string }>).some((t) => t.name === name), "a hidden tournament is not listed");
  await request(app).get(`/api/tournaments/${id}/export`).expect((r) => assert.ok([401, 403].includes(r.status), "no public export"));
}

test("#330: hidden → organizer and support work normally → publish → viewers see it → hide again before the start, data intact", async () => {
  const t = await create("private_offline");
  await assertHidden(t.id, t.name);

  // organizer and support keep full access to the hidden tournament
  const players = await request(app).get(`/api/tournaments/${t.id}/players`).set(t.organizer).expect(200);
  assert.equal(players.body.length, 4);
  const support = await request(app).post(`/api/tournaments/${t.id}/auth/support-login`).send({ password: "visibility-330-support", nick: "Pomocnik" }).expect(200);
  await request(app).get(`/api/tournaments/${t.id}`).set({ "x-support-token": support.body.sessionToken }).expect(200);

  // support may not publish or hide — the owner decides
  const supportPublish = await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set({ "x-support-token": support.body.sessionToken }).send({ visibility: "public_online" });
  assert.ok([401, 403].includes(supportPublish.status), `support cannot change visibility (got ${supportPublish.status})`);

  // publish: same id and link, viewers see everything
  await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(t.organizer).send({ visibility: "public_online" }).expect(200);
  const visible = await request(app).get(`/api/tournaments/${t.id}/players`).expect(200);
  assert.equal(visible.body.length, 4);
  assert.ok((await request(app).get("/api/tournaments").expect(200)).body.some((x: { id: number }) => x.id === t.id));

  // hide again before the start: hidden, and nothing lost
  await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(t.organizer).send({ visibility: "private_offline" }).expect(200);
  await assertHidden(t.id, t.name);
  const kept = await request(app).get(`/api/tournaments/${t.id}/players`).set(t.organizer).expect(200);
  assert.deepEqual(kept.body.map((p: { name: string }) => p.name).sort(), ["Ukryty gracz 1", "Ukryty gracz 2", "Ukryty gracz 3", "Ukryty gracz 4"]);

  // the audit log says who did what, and when
  const log = await request(app).get(`/api/tournaments/${t.id}/audit-log`).set(t.organizer).expect(200);
  const text = JSON.stringify(log.body);
  assert.match(text, /Opublikował turniej/);
  assert.match(text, /Ukrył turniej/);
});

test("#330: after the start a tournament cannot be hidden (409), publishing stays possible", async () => {
  const t = await create("public_online");
  await request(app).post(`/api/tournaments/${t.id}/start`).set(t.organizer).send({}).expect(200);
  const refused = await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(t.organizer).send({ visibility: "private_offline" }).expect(409);
  assert.equal(refused.body.code, "HIDE_AFTER_START_NOT_ALLOWED");
  assert.match(refused.body.error, /tylko przed startem/);
  const still = await request(app).get(`/api/tournaments/${t.id}`).expect(200);
  assert.equal(still.body.visibility, "public_online", "the refusal changes nothing");

  // a tournament that was already hidden before the start can still be published after it
  const hidden = await create("private_offline");
  await request(app).post(`/api/tournaments/${hidden.id}/start`).set(hidden.organizer).send({}).expect(200);
  await assertHidden(hidden.id, hidden.name);
  await request(app).post(`/api/tournaments/${hidden.id}/auth/change-visibility`).set(hidden.organizer).send({ visibility: "public_online" }).expect(200);
  await request(app).get(`/api/tournaments/${hidden.id}/matches`).expect(200);
  // saving the same hidden state again is not a "hide" and stays allowed
  const again = await create("private_offline");
  await request(app).post(`/api/tournaments/${again.id}/start`).set(again.organizer).send({}).expect(200);
  await request(app).post(`/api/tournaments/${again.id}/auth/change-visibility`).set(again.organizer).send({ visibility: "private_offline" }).expect(200);
});
