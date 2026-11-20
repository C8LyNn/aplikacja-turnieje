// #329 · optional public sign-ups: off by default, organizer's own questions, pending → approved into the real
// participant list (same roster path), capacity under concurrency, idempotent resend, closed/started/hidden states,
// form changes after sign-ups, field privacy for support, rate limit, and no public write to the roster.
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
let resetRateLimit: () => void;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `registrations-329-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
  resetRateLimit = (await import("../src/routes/tournament-registrations")).resetRegistrationRateLimit;
});
after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

const token = () => randomUUID().replace(/-/g, "");
async function tournament(opts: { players?: number; maxPlayers?: number } = {}) {
  const created = await request(app).post("/api/tournaments").send({
    name: `Zapisy ${randomUUID()}`, format: "single_elimination", maxPlayers: opts.maxPlayers ?? 8, defaultBestOf: 1,
    organizerPassword: "registrations-329-organizer", supportPassword: "registrations-329-shared",
  }).expect(201);
  const org = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= (opts.players ?? 0); seed++) {
    await request(app).post(`/api/tournaments/${created.body.id}/players`).set(org).send({ name: `Gracz ${seed}`, seed }).expect(201);
  }
  return { id: created.body.id as number, org };
}
type T = Awaited<ReturnType<typeof tournament>>;
const settings = (t: T, body: Record<string, unknown>) => request(app).put(`/api/tournaments/${t.id}/registration-settings`).set(t.org).send(body);
// The burst limit is tested on its own; elsewhere each form is a fresh attempt.
const signUp = (t: T, body: Record<string, unknown>, headers: Record<string, string> = {}, keepLimit = false) => {
  if (!keepLimit) resetRateLimit();
  return request(app).post(`/api/tournaments/${t.id}/registrations`).set(headers).send({ clientToken: token(), ...body });
};
const list = (t: T, headers: Record<string, string> = t.org) => request(app).get(`/api/tournaments/${t.id}/registrations`).set(headers);
async function questions(t: T, extra: Array<Record<string, unknown>> = []) {
  await request(app).put(`/api/tournaments/${t.id}/participant-fields`).set(t.org).send({ fields: [
    { key: "postac", label: "Postać", type: "select", options: ["Mag", "Wojownik", "Łotr"], required: true, visibility: "public", askOnSignup: true },
    { key: "wiek", label: "Przedział wieku", type: "select", options: ["<16", "16–17", "18+"], required: false, visibility: "organizer", askOnSignup: true },
    { key: "numer", label: "Numer gracza", type: "number", min: 1, max: 99, required: false, visibility: "staff", askOnSignup: true },
    { key: "notatka_org", label: "Notatka organizatora", type: "short_text", required: false, visibility: "organizer" },
    ...extra,
  ] }).expect(200);
}
async function supportWith(t: T, name: string, permissions: string[]) {
  const member = await request(app).post(`/api/tournaments/${t.id}/support-members`).set(t.org).send({ name, permissions }).expect(201);
  const login = await request(app).post(`/api/tournaments/${t.id}/auth/support-login`).send({ password: member.body.accessCode, nick: "x" }).expect(200);
  return { "x-support-token": login.body.sessionToken as string };
}

test("#329: sign-ups are off by default; nothing public can be submitted and manual adding works as before", async () => {
  const t = await tournament({ players: 2 });
  const page = await request(app).get(`/api/tournaments/${t.id}/registration`).expect(200);
  assert.equal(page.body.registration.state, "disabled");
  assert.deepEqual(page.body.fields, []);
  const refused = await signUp(t, { name: "Ktoś" });
  assert.equal(refused.status, 404);
  assert.equal(refused.body.code, "REGISTRATION_DISABLED");
  await request(app).post(`/api/tournaments/${t.id}/players`).set(t.org).send({ name: "Ręcznie dodany" }).expect(201);
  assert.equal((await request(app).get(`/api/tournaments/${t.id}/players`).set(t.org)).body.length, 3);
});

test("#329: public form → pending → approved into the same participant list the engine uses", async () => {
  const t = await tournament({ players: 1, maxPlayers: 4 });
  await questions(t);
  const saved = await settings(t, { enabled: true, open: true, approval: "manual", note: "Start w sobotę o 18:00." }).expect(200);
  assert.deepEqual(saved.body.settings, { version: 1, enabled: true, open: true, approval: "manual", capacity: null, note: "Start w sobotę o 18:00." });

  const page = await request(app).get(`/api/tournaments/${t.id}/registration`).expect(200);
  assert.equal(page.body.registration.state, "open");
  assert.equal(page.body.registration.remaining, 3);
  assert.deepEqual(page.body.fields.map((field: { key: string }) => field.key), ["postac", "wiek", "numer"], "only questions marked for the form");
  assert.equal(JSON.stringify(page.body).includes("organizerPassword"), false);

  // validation: required answer, unknown field, bad value, control characters, duplicate of an existing player
  assert.equal((await signUp(t, { name: "Ola" })).body.code, "INVALID_FIELD_VALUES");
  assert.equal((await signUp(t, { name: "Ola", customFields: { postac: "Mag", notatka_org: "x" } })).status, 422);
  assert.equal((await signUp(t, { name: "Ola", customFields: { postac: "Smok" } })).status, 422);
  assert.equal((await signUp(t, { name: "Ola\u0007", customFields: { postac: "Mag" } })).body.code, "REGISTRATION_NAME_INVALID");
  assert.equal((await signUp(t, { name: "  gracz 1 ", customFields: { postac: "Mag" } })).body.code, "REGISTRATION_DUPLICATE_NAME");
  assert.equal((await signUp(t, { name: "Ola", clientToken: "short" , customFields: { postac: "Mag" } })).body.code, "REGISTRATION_TOKEN_INVALID");

  const clientToken = token();
  const first = await signUp(t, { name: "  Ola   <b>Mag</b> ", customFields: { postac: "Mag", wiek: "18+", numer: 7 }, clientToken }).expect(201);
  assert.equal(first.body.registration.status, "pending");
  assert.match(first.body.message, /czeka na akceptację/);
  assert.equal(first.body.registration.name, "Ola <b>Mag</b>", "stored as plain text, whitespace collapsed");
  const resent = await signUp(t, { name: "Ola <b>Mag</b>", customFields: { postac: "Mag" }, clientToken }).expect(200);
  assert.equal(resent.body.registration.id, first.body.registration.id, "a resent form does not create a second sign-up");
  assert.equal(resent.body.repeated, true);
  assert.equal((await signUp(t, { name: "ola <B>mag</B>", customFields: { postac: "Łotr" } })).body.code, "REGISTRATION_DUPLICATE_NAME", "pending nicks are taken too");
  assert.equal((await request(app).get(`/api/tournaments/${t.id}/players`).set(t.org)).body.length, 1, "nothing reaches the roster before approval");

  // who can see what
  assert.equal((await list(t, {})).status, 403, "anonymous cannot list sign-ups");
  const results = await supportWith(t, "Wyniki", ["results.write"]);
  assert.equal((await list(t, results)).status, 403, "support without participants.manage cannot list");
  const people = await supportWith(t, "Zapisy", ["participants.manage"]);
  const staffView = (await list(t, people).expect(200)).body.registrations[0];
  assert.deepEqual(staffView.answers, { postac: "Mag", numer: 7 }, "organizer-only answers stay with the organizer");
  const orgView = (await list(t).expect(200)).body;
  assert.deepEqual(orgView.registrations[0].answers, { postac: "Mag", wiek: "18+", numer: 7 });
  assert.deepEqual(orgView.counts, { pending: 1, approved: 0, rejected: 0, players: 1 });
  assert.equal((await request(app).get(`/api/tournaments/${t.id}/registration`)).body.registration.remaining, 2, "a pending sign-up holds a place");

  // the public cannot approve; permitted support can
  assert.equal((await request(app).post(`/api/tournaments/${t.id}/registrations/${first.body.registration.id}/approve`).send({})).status, 403);
  const approved = await request(app).post(`/api/tournaments/${t.id}/registrations/${first.body.registration.id}/approve`).set(people).send({}).expect(200);
  const players = (await request(app).get(`/api/tournaments/${t.id}/players`).set(t.org).expect(200)).body as Array<{ id: number; name: string; customFields?: Record<string, unknown> }>;
  const player = players.find((row) => row.id === approved.body.player.id)!;
  assert.equal(player.name, "Ola <b>Mag</b>");
  assert.deepEqual(player.customFields, { postac: "Mag", wiek: "18+", numer: 7 }, "answers are attached to the participant");
  assert.equal((await request(app).post(`/api/tournaments/${t.id}/registrations/${first.body.registration.id}/approve`).set(t.org).send({})).body.code, "REGISTRATION_ALREADY_DECIDED");
  const history = (await request(app).get(`/api/tournaments/${t.id}/action-log`).set(t.org)).body as Array<{ description: string }>;
  assert.ok(history.some((entry) => entry.description === "Dodano gracza z zapisów: Ola <b>Mag</b>"));

  // reject one, approve another, then the engine uses exactly the approved people
  const second = await signUp(t, { name: "Bartek", customFields: { postac: "Wojownik" } }).expect(201);
  const third = await signUp(t, { name: "Celina", customFields: { postac: "Łotr" } }).expect(201);
  await request(app).post(`/api/tournaments/${t.id}/registrations/${second.body.registration.id}/reject`).set(t.org).send({}).expect(200);
  assert.equal((await request(app).post(`/api/tournaments/${t.id}/registrations/${second.body.registration.id}/approve`).set(t.org).send({})).body.code, "REGISTRATION_ALREADY_DECIDED");
  await request(app).post(`/api/tournaments/${t.id}/registrations/${third.body.registration.id}/approve`).set(t.org).send({}).expect(200);
  const roster = ((await request(app).get(`/api/tournaments/${t.id}/players`).set(t.org)).body as Array<{ name: string }>).map((row) => row.name).sort();
  assert.deepEqual(roster, ["Celina", "Gracz 1", "Ola <b>Mag</b>"]);
  await request(app).post(`/api/tournaments/${t.id}/start`).set(t.org).send({}).expect(200);
  const matches = (await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.org).expect(200)).body as Array<{ player1Name: string | null; player2Name: string | null }>;
  const inBracket = new Set(matches.flatMap((match) => [match.player1Name, match.player2Name]).filter(Boolean));
  assert.ok(inBracket.has("Ola <b>Mag</b>") && inBracket.has("Celina") && !inBracket.has("Bartek"), "the bracket is built from the approved list");

  // after the start: no new sign-ups; a pending one cannot be pushed into the generated bracket
  const page2 = await request(app).get(`/api/tournaments/${t.id}/registration`).expect(200);
  assert.equal(page2.body.registration.state, "started");
  assert.equal((await signUp(t, { name: "Spóźniony", customFields: { postac: "Mag" } })).body.code, "REGISTRATION_STARTED");
});

test("#329: approval after the start is refused; the generated bracket never changes", async () => {
  const t = await tournament({ players: 3, maxPlayers: 8 });
  await settings(t, { enabled: true, open: true }).expect(200);
  const pending = await signUp(t, { name: "Dawid" }).expect(201);
  await request(app).post(`/api/tournaments/${t.id}/start`).set(t.org).send({}).expect(200);
  const before = (await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.org)).body;
  const refused = await request(app).post(`/api/tournaments/${t.id}/registrations/${pending.body.registration.id}/approve`).set(t.org).send({});
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, "ROSTER_LOCKED");
  assert.deepEqual((await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.org)).body, before);
  await request(app).post(`/api/tournaments/${t.id}/registrations/${pending.body.registration.id}/reject`).set(t.org).send({}).expect(200);
});

test("#329: the last place cannot be taken twice; full and closed lists say so", async () => {
  const t = await tournament({ players: 0, maxPlayers: 8 });
  await settings(t, { enabled: true, open: true, capacity: 2 }).expect(200);
  const results = await Promise.all(["A", "B", "C", "D"].map((name) => signUp(t, { name: `Równoległy ${name}` })));
  assert.deepEqual(results.map((res) => res.status).sort(), [201, 201, 409, 409]);
  assert.ok(results.filter((res) => res.status === 409).every((res) => res.body.code === "REGISTRATION_FULL"));
  assert.equal((await request(app).get(`/api/tournaments/${t.id}/registration`)).body.registration.state, "full");
  await settings(t, { enabled: true, open: false, capacity: 2 }).expect(200);
  assert.equal((await signUp(t, { name: "Za późno" })).body.code, "REGISTRATION_CLOSED");
  await settings(t, { enabled: false, open: true }).expect(200);
  assert.equal((await request(app).get(`/api/tournaments/${t.id}/registrations`).set(t.org)).body.settings.open, false, "switching off also closes");
});

test("#329: a hidden tournament takes no sign-ups even when configured", async () => {
  const t = await tournament({ players: 0 });
  await settings(t, { enabled: true, open: true }).expect(200);
  await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(t.org).send({ visibility: "private_offline" }).expect(200);
  assert.equal((await request(app).get(`/api/tournaments/${t.id}/registration`)).status, 403);
  assert.equal((await signUp(t, { name: "Anonim" })).status, 403);
  const preview = await request(app).get(`/api/tournaments/${t.id}/registration`).set(t.org).expect(200);
  assert.equal(preview.body.registration.state, "hidden", "the organizer's preview says why");
  assert.equal((await signUp(t, { name: "Organizator" }, t.org)).body.code, "REGISTRATION_HIDDEN");
  await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(t.org).send({ visibility: "public_online" }).expect(200);
  await signUp(t, { name: "Po publikacji" }).expect(201);
});

test("#329: automatic acceptance adds straight to the list, unless the organizer needs an answer the form does not ask", async () => {
  const t = await tournament({ players: 0 });
  await settings(t, { enabled: true, open: true, approval: "auto" }).expect(200);
  const auto = await signUp(t, { name: "Szybki" }).expect(201);
  assert.equal(auto.body.registration.status, "approved");
  assert.match(auto.body.message, /jesteś na liście/);
  assert.deepEqual(((await request(app).get(`/api/tournaments/${t.id}/players`).set(t.org)).body as Array<{ name: string }>).map((row) => row.name), ["Szybki"]);

  await request(app).put(`/api/tournaments/${t.id}/participant-fields`).set(t.org).send({ fields: [
    { key: "druzyna_org", label: "Drużyna (organizator)", type: "short_text", required: true, visibility: "organizer" },
  ] }).expect(200);
  const waits = await signUp(t, { name: "Czeka" }).expect(201);
  assert.equal(waits.body.registration.status, "pending");
  const listed = (await list(t).expect(200)).body.registrations.find((row: { id: number }) => row.id === waits.body.registration.id);
  assert.deepEqual(listed.missing, [{ key: "druzyna_org", label: "Drużyna (organizator)" }]);
  assert.equal((await request(app).post(`/api/tournaments/${t.id}/registrations/${waits.body.registration.id}/approve`).set(t.org).send({})).body.code, "INVALID_FIELD_VALUES");
  await request(app).post(`/api/tournaments/${t.id}/registrations/${waits.body.registration.id}/approve`).set(t.org).send({ customFields: { druzyna_org: "Sokoły" } }).expect(200);
});

test("#329: a question added after sign-ups keeps earlier answers and marks what is missing", async () => {
  const t = await tournament({ players: 0 });
  await questions(t);
  await settings(t, { enabled: true, open: true }).expect(200);
  const early = await signUp(t, { name: "Wczesny", customFields: { postac: "Mag", wiek: "16–17" } }).expect(201);
  await questions(t, [{ key: "platforma", label: "Platforma", type: "select", options: ["PC", "PS5"], required: true, visibility: "public", askOnSignup: true }]);
  const row = (await list(t).expect(200)).body.registrations[0];
  assert.deepEqual(row.answers, { postac: "Mag", wiek: "16–17" }, "earlier answers unchanged");
  assert.deepEqual(row.missing, [{ key: "platforma", label: "Platforma" }]);
  assert.equal((await signUp(t, { name: "Późny", customFields: { postac: "Mag" } })).status, 422, "new sign-ups must answer the new question");
  await request(app).post(`/api/tournaments/${t.id}/registrations/${early.body.registration.id}/approve`).set(t.org).send({ customFields: { platforma: "PC" } }).expect(200);
});

test("#329: settings are the organizer's; input is validated; bursts are rate-limited", async () => {
  const t = await tournament({ players: 0, maxPlayers: 64 });
  const people = await supportWith(t, "Zapisy", ["participants.manage"]);
  assert.equal((await settings({ ...t, org: people as unknown as typeof t.org }, { enabled: true, open: true })).status, 403, "support cannot open sign-ups");
  assert.equal((await settings(t, { enabled: true, foo: 1 })).status, 422);
  assert.equal((await settings(t, { enabled: true, capacity: 0 })).status, 422);
  assert.equal((await settings(t, { enabled: true, approval: "maybe" })).status, 422);
  assert.equal((await settings(t, { enabled: true, note: "x".repeat(501) })).status, 422);
  await settings(t, { enabled: true, open: true }).expect(200);
  const audit = (await request(app).get(`/api/tournaments/${t.id}/audit-log`).set(t.org)).body as Array<{ action: string }>;
  assert.ok(audit.some((entry) => entry.action === "Włączył zapisy") && audit.some((entry) => entry.action === "Otworzył zapisy"));
  resetRateLimit();
  const statuses: number[] = [];
  for (let i = 0; i < 21; i++) statuses.push((await signUp(t, { name: `Spam ${i}` }, {}, true)).status);
  assert.deepEqual(statuses.slice(0, 20), Array(20).fill(201), "a LAN venue sharing one address can sign up 20 people");
  assert.equal(statuses[20], 429);
  resetRateLimit();
});

test("#329 fix: behind an untrusted proxy visitors are not throttled together; the tournament limit still holds", async () => {
  const t = await tournament({ players: 0, maxPlayers: 256 });
  await settings(t, { enabled: true, open: true }).expect(200);
  resetRateLimit();
  // Every request arrives from the proxy (same req.ip) with a forwarded header the API does not trust.
  const viaProxy = (i: number) => signUp(t, { name: `Przez proxy ${i}` }, { "x-forwarded-for": `198.51.100.${i}` }, true);
  const statuses: number[] = [];
  for (let i = 0; i < 25; i++) statuses.push((await viaProxy(i)).status);
  assert.ok(statuses.every((status) => status === 201), `no shared per-source block: ${statuses.join(",")}`);
  const { REGISTRATION_RATE_LIMIT } = await import("../src/routes/tournament-registrations");
  for (let i = 25; i < REGISTRATION_RATE_LIMIT.perTournament; i++) await viaProxy(i);
  assert.equal((await viaProxy(999)).status, 429, "the per-tournament cap applies to everyone");
  resetRateLimit();
});
