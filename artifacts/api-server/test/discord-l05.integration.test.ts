// #324-L05 · Discord webhooks end to end against a local stand-in for discord.com: settings for the owner only, the
// address only encrypted, events from real changes, no duplicates across passes and "restarts", retries, 429, a deleted
// webhook, hidden tournaments, no pings, invite idempotency, disconnect.
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

type DbModule = typeof import("@workspace/db");
type Notifier = typeof import("../src/application/integrations/discord-notifier");
let app: Express;
let database: DbModule;
let config: TestDatabaseConfig;
let notifier: Notifier;
let mock: Server;
const received: { path: string; body: Record<string, any> }[] = [];
const replies: Array<{ status: number; body?: unknown }> = [];

const TOKEN = "T0k3n-".padEnd(68, "x");
const WEBHOOK = `https://discord.com/api/webhooks/123456789012345678/${TOKEN}`;
const ORIGIN = "https://turnieje.example";

before(async () => {
  mock = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const reply = replies.shift() ?? { status: 200, body: { id: `msg-${received.length + 1}` } };
      if (reply.status < 300) received.push({ path: req.url ?? "", body: JSON.parse(raw || "{}") });
      res.writeHead(reply.status, { "content-type": "application/json" });
      res.end(JSON.stringify(reply.body ?? {}));
    });
  });
  await new Promise<void>((resolve) => mock.listen(0, "127.0.0.1", resolve));
  process.env.DISCORD_API_BASE_FOR_TESTS = `http://127.0.0.1:${(mock.address() as AddressInfo).port}`;
  process.env.DISCORD_WEBHOOK_KEY = Buffer.alloc(32, 3).toString("base64");
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `discord-l05-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
  notifier = await import("../src/application/integrations/discord-notifier");
});
after(async () => {
  await new Promise<void>((resolve) => mock.close(() => resolve()));
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});
beforeEach(() => { received.length = 0; replies.length = 0; });

type T = { id: number; org: Record<string, string> };
async function cup(name: string, visibility = "public_online"): Promise<T> {
  const created = await request(app).post("/api/tournaments").send({ name, format: "single_elimination", maxPlayers: 4, defaultBestOf: 1, organizerPassword: "l05-organizer-pass", supportPassword: "l05-support-pass", visibility }).expect(201);
  const t = { id: created.body.id as number, org: { "x-organizer-token": created.body.organizerToken as string } };
  for (const [seed, nick] of [[1, "Ada"], [2, "@everyone"], [3, "Cela"], [4, "Daro"]] as const) {
    await request(app).post(`/api/tournaments/${t.id}/players`).set(t.org).send({ name: nick, seed }).expect(201);
  }
  return t;
}
const connect = (t: T, extra: Record<string, unknown> = {}) => request(app).put(`/api/tournaments/${t.id}/discord`).set(t.org).set("Origin", ORIGIN).send({ webhookUrl: WEBHOOK, enabled: true, ...extra });
const tick = () => notifier.discordTick();
async function startStage(t: T) {
  const [stage] = (await request(app).get(`/api/tournaments/${t.id}/stages`).set(t.org).expect(200)).body;
  await request(app).post(`/api/tournaments/${t.id}/stages/${stage.id}/start`).set(t.org).send({}).expect(200);
}
const matches = async (t: T) => (await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.org).expect(200)).body as Array<{ id: number; round: number; matchNumber: number; revision: number; player1Id: number; player2Id: number; status: string }>;
const complete = async (t: T, id: number, s1: number, s2: number) => {
  const m = (await matches(t)).find((x) => x.id === id)!;
  await request(app).post(`/api/matches/${id}/complete`).set(t.org).send({ expectedRevision: m.revision, resultType: "played", score1: s1, score2: s2 }).expect(200);
};
const revert = async (t: T, id: number) => {
  const m = (await matches(t)).find((x) => x.id === id)!;
  await request(app).post(`/api/matches/${id}/revert`).set(t.org).send({ expectedRevision: m.revision }).expect(200);
};
/** Messages about one tournament (a pass delivers every tournament's queue, so tests look only at their own). */
const mine = (t: T) => received.filter((r) => String(r.body.embeds?.[0]?.url ?? "").endsWith(`/tournaments/${t.id}`));
const titles = (t: T) => mine(t).map((r) => r.body.embeds?.[0]?.title as string);
const outbox = async (t: T) => (await database.pool.query("SELECT event_key, status, attempts, next_attempt_at, last_error FROM tournament_discord_outbox WHERE tournament_id = $1 ORDER BY id", [t.id])).rows;
const dueNow = (t: T) => database.pool.query("UPDATE tournament_discord_outbox SET next_attempt_at = now() - interval '1 second' WHERE tournament_id = $1 AND status = 'pending'", [t.id]);

test("L05: owner-only settings; the address only encrypted and never returned; invalid addresses refused", async () => {
  const t = await cup("Ustawienia");
  for (const bad of ["http://discord.com/api/webhooks/1/x", "https://evil.example/api/webhooks/123456789012345678/" + TOKEN, "https://discord.com/api/webhooks/123/short", "http://127.0.0.1:1/x"]) {
    const res = await request(app).put(`/api/tournaments/${t.id}/discord`).set(t.org).send({ webhookUrl: bad });
    assert.equal(res.status, 422, bad);
  }
  const saved = await connect(t, { events: ["results", "finish"] }).expect(200);
  assert.equal(saved.body.enabled, true);
  assert.deepEqual(saved.body.events, ["results", "finish"]);
  assert.equal(saved.body.hint, "discord.com/api/webhooks/1234…5678/••••");
  assert.doesNotMatch(JSON.stringify(saved.body), new RegExp(TOKEN));
  const [row] = (await database.pool.query("SELECT webhook_ciphertext, link_base FROM tournament_discord_integrations WHERE tournament_id = $1", [t.id])).rows;
  assert.match(row.webhook_ciphertext, /^v1:/);
  assert.ok(!row.webhook_ciphertext.includes(TOKEN.slice(0, 10)) && !row.webhook_ciphertext.includes("discord.com"));
  assert.equal(row.link_base, ORIGIN);
  // nobody else: anonymous, a fake token, support
  const support = await request(app).post(`/api/tournaments/${t.id}/auth/support-login`).send({ password: "l05-support-pass", nick: "Pomoc" }).expect(200);
  for (const headers of [{}, { "x-organizer-token": "zly" }, { "x-support-token": support.body.sessionToken as string }] as Record<string, string>[]) {
    for (const [method, path] of [["get", ""], ["put", ""], ["delete", ""], ["post", "/test"], ["post", "/invite"], ["get", "/preview"]] as const) {
      const res = await (request(app) as any)[method](`/api/tournaments/${t.id}/discord${path}`).set(headers).send({ webhookUrl: WEBHOOK });
      assert.ok([401, 403].includes(res.status), `${method} ${path} refused (got ${res.status})`);
    }
  }
  // public reads, the action log and the backup never carry it
  for (const path of [`/api/tournaments/${t.id}`, `/api/tournaments/${t.id}/stages`, `/api/tournaments/${t.id}/action-log`, `/api/tournaments/${t.id}/export`]) {
    const res = await request(app).get(path).set(t.org);
    assert.doesNotMatch(JSON.stringify(res.body), /webhook|T0k3n|v1:/i, path);
  }
  const preview = await request(app).get(`/api/tournaments/${t.id}/discord/preview`).set(t.org).set("Origin", ORIGIN).expect(200);
  assert.deepEqual(preview.body.examples.map((e: { kind: string }) => e.kind), ["invite", "start", "pairings", "results", "results", "results", "advance", "finish"]);
  assert.ok(preview.body.examples.every((e: { message: { allowed_mentions: unknown } }) => JSON.stringify(e.message.allowed_mentions) === '{"parse":[]}'));
});

test("L05: real events only, once — start, pairs, result, advance, undo, new result, champion; nothing twice across passes", async () => {
  const t = await cup("Puchar Discord");
  await connect(t).expect(200);
  assert.deepEqual(await tick(), { queued: 0, sent: 0, failed: 0, retried: 0 }, "connecting only sets the baseline");
  await startStage(t);
  await tick();
  assert.deepEqual(titles(t), ["Turniej wystartował", "Nowe pary — Runda 1"]);
  assert.match(mine(t)[1].body.embeds[0].description, /Ada vs Daro|Ada vs @/);
  assert.doesNotMatch(JSON.stringify(mine(t)), /@everyone/, "a nick cannot ping the channel");
  assert.ok(mine(t).every((r) => JSON.stringify(r.body.allowed_mentions) === '{"parse":[]}' && r.path.endsWith("?wait=true")));
  assert.equal(mine(t)[0].body.embeds[0].url, `${ORIGIN}/tournaments/${t.id}`);
  received.length = 0;

  const [sf1, sf2, final] = (await matches(t)).sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber);
  await complete(t, sf1.id, 1, 0);
  await tick(); await tick(); await tick();
  assert.deepEqual(titles(t), ["Wygrywa Ada", "Awans"], "result and advance, each once (3 passes)");
  received.length = 0;
  await revert(t, sf1.id);
  await tick();
  assert.deepEqual(titles(t), ["Wynik cofnięty"], "an undo is told, so the earlier result is not left standing");
  received.length = 0;
  await complete(t, sf1.id, 0, 1);
  await complete(t, sf2.id, 1, 0);
  await tick(); await tick();
  assert.equal(titles(t).filter((x) => x?.startsWith("Wygrywa")).length, 2);
  assert.equal(titles(t).filter((x) => x === "Awans").length, 2);
  received.length = 0;
  await complete(t, final.id, 1, 0);
  await tick(); await tick();
  assert.ok(titles(t).includes("Koniec turnieju"), titles(t).join(","));
  const keys = (await outbox(t)).map((r) => r.event_key);
  assert.equal(new Set(keys).size, keys.length, "every event key once");
  // an API restart: the snapshot and the queue live in the database, so a new pass finds nothing new
  received.length = 0;
  await tick();
  assert.deepEqual(mine(t), []);
});

test("L05: network error and 5xx retry later; 429 honours retry_after; a deleted webhook stops sending until reconnected", async () => {
  const t = await cup("Ponowienia");
  await connect(t, { events: ["start", "pairings"] }).expect(200);
  await tick();
  replies.push({ status: 500 }, { status: 429, body: { retry_after: 0.05 } });
  await startStage(t);
  const first = await tick();
  assert.equal(first.sent, 0);
  assert.equal(first.retried, 2);
  const rows = await outbox(t);
  assert.deepEqual(rows.map((r) => [r.status, r.attempts]), [["pending", 1], ["pending", 1]]);
  const waiting = (await database.pool.query("SELECT count(*)::int AS n FROM tournament_discord_outbox WHERE tournament_id = $1 AND next_attempt_at > now() + interval '2 seconds'", [t.id])).rows[0].n;
  assert.equal(waiting, 1, "5xx: a backoff before the next try (the 429 one waits only retry_after)");
  await new Promise((r) => setTimeout(r, 1200));
  await tick();
  assert.deepEqual(titles(t), ["Nowe pary — Runda 1"], "the 429 message went after retry_after; the 5xx one waits for its backoff");
  await dueNow(t);
  await tick();
  assert.deepEqual(titles(t), ["Nowe pary — Runda 1", "Turniej wystartował"]);
  assert.ok((await outbox(t)).every((r) => r.status === "sent"));

  // the webhook was deleted in Discord: status "broken", nothing more is sent, the panel says so
  const t2 = await cup("Usunięty webhook");
  await connect(t2, { events: ["start"] }).expect(200);
  await tick();
  replies.push({ status: 404, body: { message: "Unknown Webhook" } });
  await startStage(t2);
  received.length = 0;
  await tick();
  const status = (await request(app).get(`/api/tournaments/${t2.id}/discord`).set(t2.org).expect(200)).body;
  assert.equal(status.status, "broken");
  assert.match(status.lastError, /HTTP 404/);
  await tick();
  assert.deepEqual(mine(t2), [], "nothing while broken");
  await connect(t2).expect(200);
  await dueNow(t2);
  await tick();
  assert.deepEqual(titles(t2), ["Turniej wystartował"], "after reconnecting the waiting message goes out");
});

test("L05: a hidden or private tournament sends nothing, and the hidden period is never told later", async () => {
  const t = await cup("Ukryty Discord", "private_offline");
  await connect(t).expect(200);
  await tick();
  await startStage(t);
  const [sf1] = (await matches(t)).sort((a, b) => a.matchNumber - b.matchNumber);
  await complete(t, sf1.id, 1, 0);
  await tick();
  assert.deepEqual(mine(t), [], "hidden: nothing");
  assert.equal((await outbox(t)).length, 0);
  await request(app).post(`/api/tournaments/${t.id}/auth/change-visibility`).set(t.org).send({ visibility: "public_online" }).expect(200);
  await tick();
  assert.deepEqual(mine(t), [], "publishing does not replay what happened while hidden");
  const invite = await request(app).post(`/api/tournaments/${t.id}/discord/invite`).set(t.org).send({ requestId: "zaproszenie-0001" }).expect(200);
  assert.equal(invite.body.queued, true);
  assert.equal((await request(app).post(`/api/tournaments/${t.id}/discord/invite`).set(t.org).send({ requestId: "zaproszenie-0001" }).expect(200)).body.queued, false, "a repeated click is not a second invite");
  await tick();
  assert.deepEqual(titles(t), ["Turniej: Ukryty Discord"]);
});

test("L05: participant answers never leave; test message rate-limited; disconnect forgets everything; key rotation is reported", async () => {
  const t = await cup("Pola i test");
  await request(app).put(`/api/tournaments/${t.id}/participant-fields`).set(t.org).send({ fields: [{ key: "telefon", label: "Telefon", type: "short_text", required: false, visibility: "organizer" }] }).expect(200);
  const players = (await request(app).get(`/api/tournaments/${t.id}/players`).set(t.org).expect(200)).body as Array<{ id: number }>;
  await request(app).put(`/api/players/${players[0].id}/custom-fields`).set(t.org).send({ values: { telefon: "600-100-200" } }).expect(200);
  await connect(t).expect(200);
  await tick();
  await startStage(t);
  const [sf1] = (await matches(t)).sort((a, b) => a.matchNumber - b.matchNumber);
  await complete(t, sf1.id, 1, 0);
  await tick(); await tick();
  assert.ok(mine(t).length >= 3, JSON.stringify({ got: titles(t), all: received.map((r) => r.body.embeds?.[0]?.url), rows: await outbox(t) }));
  assert.doesNotMatch(JSON.stringify(mine(t)), /600-100-200|telefon/i, "no #329 / participant field answers on Discord");

  received.length = 0;
  const testRes = await request(app).post(`/api/tournaments/${t.id}/discord/test`).set(t.org).expect(200);
  assert.equal(testRes.body.ok, true);
  assert.deepEqual(titles(t), ["Test połączenia"]);
  assert.equal((await request(app).post(`/api/tournaments/${t.id}/discord/test`).set(t.org)).status, 429);

  await request(app).delete(`/api/tournaments/${t.id}/discord`).set(t.org).expect(204);
  assert.equal((await outbox(t)).length, 0);
  assert.equal((await database.pool.query("SELECT count(*)::int AS n FROM tournament_discord_integrations WHERE tournament_id = $1", [t.id])).rows[0].n, 0);
  assert.equal((await request(app).get(`/api/tournaments/${t.id}/discord`).set(t.org).expect(200)).body.configured, false);

  const t2 = await cup("Klucz");
  await connect(t2).expect(200);
  await tick();
  process.env.DISCORD_WEBHOOK_KEY = Buffer.alloc(32, 9).toString("base64");
  await startStage(t2);
  await tick();
  const status = (await request(app).get(`/api/tournaments/${t2.id}/discord`).set(t2.org).expect(200)).body;
  assert.equal(status.status, "key_unavailable", "a changed server key is reported instead of failing silently");
  process.env.DISCORD_WEBHOOK_KEY = Buffer.alloc(32, 3).toString("base64");
});
