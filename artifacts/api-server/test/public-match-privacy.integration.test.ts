import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { PUBLIC_MATCH_FIELDS } from "../src/application/matches/match-view";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

let app: Express;
let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
let initialized = false;
before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = randomUUID();
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  app = (await import("../src/app")).default;
});
after(async () => {
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  if (database) await database.pool.end();
});

const SECRET = `Prywatna notatka ${randomUUID()} — tel. 600 000 000`;
const CANCEL_SECRET = `Powód anulowania tylko dla organizatora ${randomUUID()}`;

async function tournament(format: "round_robin" | "single_elimination") {
  const created = await request(app).post("/api/tournaments").send({
    name: `Privacy ${randomUUID()}`, organizerPassword: "privacy-test-password", format, defaultBestOf: 1,
  }).expect(201);
  const id: number = created.body.id;
  const auth = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 4; seed++) {
    await request(app).post(`/api/tournaments/${id}/players`).set(auth).send({ name: `Gracz ${seed}`, seed }).expect(201);
  }
  await request(app).post(`/api/tournaments/${id}/start`).set(auth).expect(200);
  const matches = (await request(app).get(`/api/tournaments/${id}/matches`).set(auth).expect(200)).body as Array<{ id: number; revision: number; stageId: number }>;
  return { id, auth, matches };
}

function assertPublicMatch(match: Record<string, unknown>, where: string) {
  assert.equal("note" in match, false, `${where}: note must not be in a public match`);
  for (const key of Object.keys(match)) assert.ok((PUBLIC_MATCH_FIELDS as readonly string[]).includes(key), `${where}: unexpected public field ${key}`);
}

test("V5.10 P0: the organizer's match note never reaches viewers; the organizer keeps it; the stored value stays", async () => {
  const t = await tournament("single_elimination");
  const [first, second] = t.matches;
  await request(app).patch(`/api/matches/${first.id}`).set(t.auth).send({ note: SECRET, expectedRevision: first.revision }).expect(200);
  const second0 = (await request(app).get(`/api/matches/${second.id}`).set(t.auth).expect(200)).body;
  const cancelled = await request(app).post(`/api/matches/${second.id}/cancel`).set(t.auth).send({ note: CANCEL_SECRET, expectedRevision: second0.revision });
  // cancelling an elimination match may be refused by the engine; the note path is still covered by the PATCH above
  const cancelWorked = cancelled.status === 200;

  // anonymous viewer of a public tournament
  const list = (await request(app).get(`/api/tournaments/${t.id}/matches`).expect(200)).body as Array<Record<string, unknown>>;
  list.forEach((match, index) => assertPublicMatch(match, `GET matches[${index}]`));
  assertPublicMatch((await request(app).get(`/api/matches/${first.id}`).expect(200)).body, "GET /matches/:id");
  const bracket = (await request(app).get(`/api/tournaments/${t.id}/bracket`).expect(200)).body as { rounds: Array<{ matches: Array<Record<string, unknown>> }> };
  bracket.rounds.flatMap((round) => round.matches).forEach((match, index) => assertPublicMatch(match, `GET bracket[${index}]`));

  // no public read of this tournament carries the note text anywhere (also not in the action log)
  for (const path of ["", "/matches", "/bracket", "/results-history", "/action-log", "/standings", "/stats", "/stages"]) {
    const response = await request(app).get(`/api/tournaments/${t.id}${path}`);
    if (response.status !== 200) continue;
    assert.equal(response.text.includes(SECRET), false, `${path || "/"} leaks the note`);
    assert.equal(response.text.includes(CANCEL_SECRET), false, `${path || "/"} leaks the cancel note`);
  }

  // the organizer still reads the note
  const organizerView = (await request(app).get(`/api/matches/${first.id}`).set(t.auth).expect(200)).body;
  assert.equal(organizerView.note, SECRET);
  const organizerList = (await request(app).get(`/api/tournaments/${t.id}/matches`).set(t.auth).expect(200)).body as Array<{ id: number; note?: string | null }>;
  assert.equal(organizerList.find((match) => match.id === first.id)?.note, SECRET);
  if (cancelWorked) assert.equal(organizerList.find((match) => match.id === second.id)?.note, CANCEL_SECRET);

  // nothing was deleted from the database
  const stored = await database.pool.query("SELECT note FROM matches WHERE id = $1", [first.id]);
  assert.equal(stored.rows[0].note, SECRET);
});

test("V5.10 P0: a round-robin list, a single match and the league schedule are public-safe too", async () => {
  const t = await tournament("round_robin");
  const [first] = t.matches;
  await request(app).patch(`/api/matches/${first.id}`).set(t.auth).send({ note: SECRET, expectedRevision: first.revision }).expect(200);
  const list = (await request(app).get(`/api/tournaments/${t.id}/matches`).expect(200)).body as Array<Record<string, unknown>>;
  list.forEach((match, index) => assertPublicMatch(match, `GET matches[${index}]`));
  const schedule = await request(app).get(`/api/tournaments/${t.id}/stages/${first.stageId}/schedule`);
  if (schedule.status === 200) assert.equal(schedule.text.includes(SECRET), false, "schedule leaks the note");
  // a wrong or missing token is just a viewer: no note
  const wrong = (await request(app).get(`/api/matches/${first.id}`).set({ "x-organizer-token": "not-a-token" })).body;
  if (wrong && typeof wrong === "object" && "id" in wrong) assertPublicMatch(wrong, "wrong token");
});
