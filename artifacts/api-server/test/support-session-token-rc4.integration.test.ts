// RC-4 · support session tokens are stored only as SHA-256: the database never holds a usable token, sessions keep
// working (also those opened before the migration or by an older API), #331 permissions and every way a session
// ends stay as they were, and a token never appears in an API answer other than the login itself.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

type DbModule = typeof import("@workspace/db");
let app: Express;
let database: DbModule;
let config: TestDatabaseConfig;
let auth: typeof import("../src/auth");

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `support-rc4-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
  auth = await import("../src/auth");
});
after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

const SHARED = "support-rc4-shared";
const sha = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");
const q = (sql: string, params: unknown[] = []) => database.pool.query(sql.replaceAll("support_sessions", `"${config.schema}".support_sessions`), params);

async function tournament(players = 4, filled = players) {
  const created = await request(app).post("/api/tournaments").send({
    name: `RC-4 ${randomUUID()}`, format: "single_elimination", maxPlayers: players, defaultBestOf: 1,
    organizerPassword: "support-rc4-organizer", supportPassword: SHARED,
  }).expect(201);
  const org = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= filled; seed++) {
    await request(app).post(`/api/tournaments/${created.body.id}/players`).set(org).send({ name: `Gracz ${seed}`, seed }).expect(201);
  }
  return { id: created.body.id as number, org };
}
async function login(id: number, password: string, nick = "pomocnik") {
  const res = await request(app).post(`/api/tournaments/${id}/auth/support-login`).send({ password, nick });
  return res.status === 200 ? (res.body.sessionToken as string) : null;
}
const session = (id: number, token: string) => request(app).get(`/api/tournaments/${id}/auth/support-session`).set({ "x-support-token": token });

test("RC-4: tokens are 256-bit random values; only their SHA-256 reaches the database", async () => {
  assert.equal(auth.SESSION_TOKEN_BYTES, 32);
  const sample = Array.from({ length: 2000 }, () => auth.generateSessionToken());
  assert.ok(sample.every((token) => /^[0-9a-f]{64}$/.test(token)), "64 hex characters = 32 bytes");
  assert.equal(new Set(sample).size, sample.length, "no repeats");
  assert.equal(auth.hashSessionToken(sample[0]!), sha(sample[0]!), "the API hash is plain SHA-256 (the same as migration 0051)");

  const t = await tournament();
  const token = await login(t.id, SHARED);
  assert.ok(token && /^[0-9a-f]{64}$/.test(token));
  const rows = (await q("SELECT session_token, session_token_hash FROM support_sessions WHERE tournament_id = $1", [t.id])).rows;
  assert.deepEqual(rows, [{ session_token: null, session_token_hash: sha(token!) }]);
  const everywhere = (await database.pool.query(
    `SELECT count(*)::int AS n FROM (SELECT to_jsonb(s)::text AS x FROM "${config.schema}".support_sessions s
       UNION ALL SELECT to_jsonb(a)::text FROM "${config.schema}".auth_audit_log a) all_rows WHERE x LIKE $1`, [`%${token}%`],
  )).rows[0].n;
  assert.equal(everywhere, 0, "the token is in no session or audit row");
  await session(t.id, token!).expect(200);
});

test("RC-4: knowing the stored hash gives no access; a wrong or foreign token is refused", async () => {
  const a = await tournament();
  const b = await tournament();
  const token = (await login(a.id, SHARED))!;
  await session(a.id, sha(token)).expect(403);
  await session(a.id, token.slice(0, 63) + (token.endsWith("0") ? "1" : "0")).expect(403);
  await session(b.id, token).expect(403);
  const players = await request(app).post(`/api/tournaments/${b.id}/players`).set({ "x-support-token": token }).send({ name: "Intruz", seed: 9 });
  assert.equal(players.status, 403);
});

test("RC-4: a session opened before the migration (or by an older API) works, and is converted on its first use", async () => {
  const t = await tournament(4, 3);
  const legacy = auth.generateSessionToken();
  await q("INSERT INTO support_sessions(tournament_id, nick, session_token, password_version) VALUES ($1, 'Stary', $2, 1)", [t.id, legacy]);
  const first = await session(t.id, legacy).expect(200);
  assert.equal(first.body.nick, "Stary");
  assert.deepEqual((await q("SELECT session_token, session_token_hash FROM support_sessions WHERE nick = 'Stary'")).rows,
    [{ session_token: null, session_token_hash: sha(legacy) }], "converted: the clear token is gone");
  await session(t.id, legacy).expect(200);
  await request(app).post(`/api/tournaments/${t.id}/players`).set({ "x-support-token": legacy }).send({ name: "Po konwersji", seed: 4 }).expect(201);
});

test("RC-4: #331 permissions are unchanged with hashed sessions (deny, grant, revoke)", async () => {
  const t = await tournament();
  await request(app).post(`/api/tournaments/${t.id}/start`).set(t.org).send({}).expect(200);
  const member = await request(app).post(`/api/tournaments/${t.id}/support-members`).set(t.org).send({ name: "Sędzia Ola", permissions: ["results.write"] }).expect(201);
  const token = (await login(t.id, member.body.accessCode as string))!;
  assert.equal((await q("SELECT count(*)::int AS n FROM support_sessions WHERE session_token IS NOT NULL")).rows[0].n, 0);
  const me = await session(t.id, token).expect(200);
  assert.deepEqual(me.body.permissions, ["results.write"]);
  const matches = (await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.org).expect(200)).body as Array<{ id: number; revision: number; status: string; player1Id: number | null; player2Id: number | null }>;
  const [m1] = matches.filter((m) => m.status === "pending" && m.player1Id && m.player2Id);
  const done = await request(app).post(`/api/matches/${m1!.id}/complete`).set({ "x-support-token": token }).send({ resultType: "played", score1: 1, score2: 0, expectedRevision: m1!.revision }).expect(200);
  const denied = await request(app).post(`/api/matches/${m1!.id}/revert`).set({ "x-support-token": token }).send({ expectedRevision: done.body.revision });
  assert.equal(denied.status, 403);
  assert.ok((denied.body.permissions as string[]).includes("results.correct"));
  await request(app).patch(`/api/tournaments/${t.id}/support-members/${member.body.member.id}`).set(t.org).send({ permissions: ["results.correct"] }).expect(200);
  await request(app).post(`/api/matches/${m1!.id}/revert`).set({ "x-support-token": token }).send({ expectedRevision: done.body.revision }).expect(200);
  await request(app).post(`/api/tournaments/${t.id}/support-members/${member.body.member.id}/revoke`).set(t.org).expect(200);
  await session(t.id, token).expect(403);
  assert.equal((await q("SELECT count(*)::int AS n FROM support_sessions WHERE session_token_hash = $1", [sha(token)])).rows[0].n, 0, "revoking removes the session row");
});

test("RC-4: changing the shared support password ends shared sessions; personal sessions are not affected", async () => {
  const t = await tournament();
  const shared = (await login(t.id, SHARED))!;
  const member = await request(app).post(`/api/tournaments/${t.id}/support-members`).set(t.org).send({ name: "Osobisty", preset: "results" }).expect(201);
  const personal = (await login(t.id, member.body.accessCode as string))!;
  await session(t.id, shared).expect(200);
  await request(app).post(`/api/tournaments/${t.id}/auth/change-support-password`).set(t.org).send({ newPassword: "support-rc4-new" }).expect(200);
  await session(t.id, shared).expect(403);
  await session(t.id, personal).expect(200);
  const fresh = (await login(t.id, "support-rc4-new"))!;
  await session(t.id, fresh).expect(200);
});

test("RC-4: no API answer except the login carries a token or its hash", async () => {
  const t = await tournament();
  const token = (await login(t.id, SHARED))!;
  const answers: Array<[string, request.Response]> = [
    ["support-sessions", await request(app).get(`/api/tournaments/${t.id}/auth/support-sessions`).set(t.org)],
    ["audit-log", await request(app).get(`/api/tournaments/${t.id}/audit-log`).set(t.org)],
    ["support-session", await session(t.id, token)],
    ["support-members", await request(app).get(`/api/tournaments/${t.id}/support-members`).set(t.org)],
    ["tournament", await request(app).get(`/api/tournaments/${t.id}`).set(t.org)],
  ];
  for (const [name, answer] of answers) {
    assert.equal(answer.status, 200, name);
    const text = JSON.stringify(answer.body);
    assert.equal(text.includes(token), false, `${name} leaks the token`);
    assert.equal(text.includes(sha(token)), false, `${name} leaks the hash`);
    assert.equal(/session_?token/i.test(text), false, `${name} names a token field`);
  }
});
