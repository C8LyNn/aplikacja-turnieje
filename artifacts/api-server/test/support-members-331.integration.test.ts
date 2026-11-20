// #331 · support people: personal codes, per-action permissions enforced on the server, immediate changes,
// no cross-tournament use, no self-escalation, revocation; the shared support password keeps its former rights.
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
  process.env.SESSION_SECRET = `support-331-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});
after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

const SHARED = "support-331-shared";
async function tournament(players = 4) {
  const created = await request(app).post("/api/tournaments").send({
    name: `Wsparcie ${randomUUID()}`, format: "single_elimination", maxPlayers: players, defaultBestOf: 1,
    organizerPassword: "support-331-organizer", supportPassword: SHARED,
  }).expect(201);
  const org = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= players; seed++) {
    await request(app).post(`/api/tournaments/${created.body.id}/players`).set(org).send({ name: `Gracz ${seed}`, seed }).expect(201);
  }
  return { id: created.body.id as number, org };
}
async function addMember(t: { id: number; org: Record<string, string> }, name: string, body: Record<string, unknown>) {
  const res = await request(app).post(`/api/tournaments/${t.id}/support-members`).set(t.org).send({ name, ...body }).expect(201);
  assert.match(res.body.accessCode, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal(JSON.stringify(res.body.member).includes(res.body.accessCode), false, "only the code itself is returned, once");
  return { id: res.body.member.id as number, code: res.body.accessCode as string };
}
async function login(id: number, password: string, nick = "pomocnik") {
  const res = await request(app).post(`/api/tournaments/${id}/auth/support-login`).send({ password, nick });
  return res.status === 200 ? { "x-support-token": res.body.sessionToken as string, nick: res.body.nick as string } : null;
}
const sup = (s: { "x-support-token": string } | null) => ({ "x-support-token": s!["x-support-token"] });
async function firstMatch(t: { id: number; org: Record<string, string> }) {
  const matches = await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.org).expect(200);
  return (matches.body as Array<{ id: number; revision: number; status: string; player1Id: number | null; player2Id: number | null }>)
    .filter((m) => m.status === "pending" && m.player1Id && m.player2Id);
}
const refused = (res: request.Response, permission?: string) => {
  assert.equal(res.status, 403, `expected 403, got ${res.status} ${JSON.stringify(res.body).slice(0, 120)}`);
  if (permission) assert.ok((res.body.permissions as string[]).includes(permission), `refusal names ${permission}`);
};

test("#331 scenario 1: results only — enter results, nothing else (no removing players, no corrections, no publishing)", async () => {
  const t = await tournament();
  await request(app).post(`/api/tournaments/${t.id}/start`).set(t.org).send({}).expect(200);
  const judge = await addMember(t, "Sędzia Ola", { preset: "results" });
  const s = await login(t.id, judge.code);
  assert.ok(s, "a personal code opens a support session");
  assert.equal(s!.nick, "Sędzia Ola", "the session is the person, not a typed nick");
  const session = await request(app).get(`/api/tournaments/${t.id}/auth/support-session`).set(sup(s)).expect(200);
  assert.deepEqual(session.body.permissions, ["matches.run", "results.write"]);

  const [m] = await firstMatch(t);
  const started = await request(app).patch(`/api/matches/${m.id}`).set(sup(s)).send({ status: "in_progress", expectedRevision: m.revision }).expect(200);
  const done = await request(app).post(`/api/matches/${m.id}/complete`).set(sup(s)).send({ resultType: "played", score1: 1, score2: 0, expectedRevision: started.body.revision }).expect(200);
  refused(await request(app).post(`/api/matches/${m.id}/revert`).set(sup(s)).send({ expectedRevision: done.body.revision }), "results.correct");
  const players = await request(app).get(`/api/tournaments/${t.id}/players`).set(t.org).expect(200);
  refused(await request(app).delete(`/api/players/${players.body[0].id}`).set(sup(s)), "participants.manage");
  refused(await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(sup(s)).send({ visibility: "private_offline" }), "visibility.publish");
  refused(await request(app).patch(`/api/tournaments/${t.id}`).set(sup(s)).send({ featuredMatchId: m.id }), "presentation.featured");
  // no self-escalation: support people cannot see or change support access
  refused(await request(app).get(`/api/tournaments/${t.id}/support-members`).set(sup(s)));
  refused(await request(app).post(`/api/tournaments/${t.id}/support-members`).set(sup(s)).send({ name: "Ja", preset: "full" }));
  refused(await request(app).patch(`/api/tournaments/${t.id}/support-members/${judge.id}`).set(sup(s)).send({ preset: "full" }));
});

test("#331 scenario 3: stream producer changes the match on screen and the look, not results", async () => {
  const t = await tournament();
  await request(app).post(`/api/tournaments/${t.id}/start`).set(t.org).send({}).expect(200);
  const producer = await addMember(t, "Realizator", { preset: "stream" });
  const s = await login(t.id, producer.code);
  const [m] = await firstMatch(t);
  await request(app).patch(`/api/tournaments/${t.id}`).set(sup(s)).send({ featuredMatchId: m.id }).expect(200);
  await request(app).patch(`/api/tournaments/${t.id}`).set(sup(s)).send({ presentationSettings: { colorPreset: "neon" } }).expect(200);
  refused(await request(app).patch(`/api/tournaments/${t.id}`).set(sup(s)).send({ name: "Przejęty" }));
  refused(await request(app).post(`/api/matches/${m.id}/complete`).set(sup(s)).send({ resultType: "played", score1: 1, score2: 0, expectedRevision: m.revision }), "results.write");
});

test("#331 scenario 4: granting or taking one permission applies to the very next operation of an open session", async () => {
  const t = await tournament();
  await request(app).post(`/api/tournaments/${t.id}/start`).set(t.org).send({}).expect(200);
  const helper = await addMember(t, "Pomocnik", { permissions: ["results.write"] });
  const s = await login(t.id, helper.code);
  const [m1, m2] = await firstMatch(t);
  const done = await request(app).post(`/api/matches/${m1.id}/complete`).set(sup(s)).send({ resultType: "played", score1: 1, score2: 0, expectedRevision: m1.revision }).expect(200);
  refused(await request(app).post(`/api/matches/${m1.id}/revert`).set(sup(s)).send({ expectedRevision: done.body.revision }), "results.correct");
  await request(app).patch(`/api/tournaments/${t.id}/support-members/${helper.id}`).set(t.org).send({ permissions: ["results.correct"] }).expect(200);
  await request(app).post(`/api/matches/${m1.id}/revert`).set(sup(s)).send({ expectedRevision: done.body.revision }).expect(200);
  refused(await request(app).post(`/api/matches/${m2.id}/complete`).set(sup(s)).send({ resultType: "played", score1: 1, score2: 0, expectedRevision: m2.revision }), "results.write");
  const log = await request(app).get(`/api/tournaments/${t.id}/audit-log`).set(t.org).expect(200);
  const text = JSON.stringify(log.body);
  assert.match(text, /Zmienił uprawnienia „Pomocnik” · nadał: results\.correct · odebrał: results\.write/);
  assert.match(text, /Pomocnik/);
});

test("#331 scenario 5: no use in another tournament, revocation ends the session, a revoked code no longer opens one", async () => {
  const a = await tournament();
  const b = await tournament();
  const full = await addMember(a, "Pełny", { preset: "full" });
  const s = await login(a.id, full.code);
  refused(await request(app).post(`/api/tournaments/${b.id}/players`).set(sup(s)).send({ name: "Intruz", seed: 9 }));
  assert.equal(await login(b.id, full.code), null, "the code is bound to its tournament");
  await request(app).post(`/api/tournaments/${a.id}/support-members/${full.id}/revoke`).set(a.org).expect(200);
  refused(await request(app).get(`/api/tournaments/${a.id}/auth/support-session`).set(sup(s)));
  refused(await request(app).post(`/api/tournaments/${a.id}/players`).set(sup(s)).send({ name: "Po odwołaniu", seed: 10 }));
  assert.equal(await login(a.id, full.code), null);
  const list = await request(app).get(`/api/tournaments/${a.id}/support-members`).set(a.org).expect(200);
  assert.ok(list.body.members[0].revokedAt);
  assert.equal(list.body.members[0].activeSessions, 0);
  assert.equal(JSON.stringify(list.body).includes("accessCodeHash"), false, "hashes never leave the server");
});

test("#331 scenario 6: full support covers every delegable task, never ownership or secrets", async () => {
  const t = await tournament();
  const full = await addMember(t, "Pełne wsparcie", { preset: "full" });
  const s = await login(t.id, full.code);
  await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(sup(s)).send({ visibility: "private_offline" }).expect(200);
  await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(sup(s)).send({ visibility: "public_online" }).expect(200);
  refused(await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(sup(s)).send({ visibility: "private_online", viewerPassword: "haslo-widza-1" }));
  refused(await request(app).get(`/api/tournaments/${t.id}/export`).set(sup(s)));
  refused(await request(app).post(`/api/tournaments/${t.id}/auth/change-support-password`).set(sup(s)).send({ newPassword: "przejete-haslo" }));
  refused(await request(app).post(`/api/tournaments/${t.id}/support-members`).set(sup(s)).send({ name: "Klon", preset: "full" }));
  await request(app).post(`/api/tournaments/${t.id}/start`).set(sup(s)).send({}).expect(200);
  const stages = await request(app).get(`/api/tournaments/${t.id}/stages`).set(t.org).expect(200);
  refused(await request(app).post(`/api/tournaments/${t.id}/stages/${stages.body[0].id}/complete`).set(sup(s)).send({}));
});

test("#331: the shared support password keeps exactly its former rights", async () => {
  const t = await tournament();
  const s = await login(t.id, SHARED, "Stary pomocnik");
  assert.equal(s!.nick, "Stary pomocnik");
  const session = await request(app).get(`/api/tournaments/${t.id}/auth/support-session`).set(sup(s)).expect(200);
  assert.equal(session.body.memberId, null);
  assert.deepEqual(session.body.permissions, ["matches.run", "results.write", "results.correct", "participants.manage", "stages.rounds", "presentation.featured"]);
  await request(app).post(`/api/tournaments/${t.id}/players`).set(sup(s)).send({ name: "Dopisany", seed: 5 }).expect((r) => assert.ok([201, 422].includes(r.status)));
  await request(app).post(`/api/tournaments/${t.id}/start`).set(sup(s)).send({}).expect(200);
  const [m] = await firstMatch(t);
  await request(app).patch(`/api/tournaments/${t.id}`).set(sup(s)).send({ featuredMatchId: m.id }).expect(200);
  await request(app).post(`/api/matches/${m.id}/complete`).set(sup(s)).send({ resultType: "played", score1: 1, score2: 0, expectedRevision: m.revision }).expect(200);
  refused(await request(app).patch(`/api/tournaments/${t.id}`).set(sup(s)).send({ presentationSettings: { colorPreset: "neon" } }), "presentation.settings");
  refused(await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(sup(s)).send({ visibility: "private_offline" }), "visibility.publish");
});

test("#331: invalid input is refused clearly", async () => {
  const t = await tournament();
  const bad = await request(app).post(`/api/tournaments/${t.id}/support-members`).set(t.org).send({ name: "X", permissions: ["results.write", "owner.everything"] }).expect(422);
  assert.equal(bad.body.code, "INVALID_SUPPORT_PERMISSIONS");
  await request(app).post(`/api/tournaments/${t.id}/support-members`).set(t.org).send({ name: "   ", preset: "view" }).expect(422);
  await request(app).post(`/api/tournaments/${t.id}/support-members`).set(t.org).send({ name: "Y", preset: "nieistniejacy" }).expect(422);
  const viewer = await addMember(t, "Tylko podgląd", { preset: "view" });
  const s = await login(t.id, viewer.code);
  await request(app).get(`/api/tournaments/${t.id}/players`).set(sup(s)).expect(200);
  refused(await request(app).post(`/api/tournaments/${t.id}/players`).set(sup(s)).send({ name: "Z", seed: 9 }), "participants.manage");
});
