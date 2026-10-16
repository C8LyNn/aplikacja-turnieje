import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import { eq } from "drizzle-orm";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

/**
 * WEB-005 T055 R22 L3: intentionally FAIL-FIRST API acceptance tests.
 *
 * Approved policy: basketConfigRevision (persisted monotonic), strong ETag on
 * a coherent GET graph, required PUT If-Match, stale 412, missing 428,
 * roster/stage drift fail-closed and a preserved client draft on 412.
 *
 * This new test file does NOT implement the endpoint, schema, migration or UI.
 * The RELEASE baseline has no CAS and therefore MUST NOT be called GREEN.
 *
 * DESTRUCTIVE TEST SAFETY: uses the existing getSafeTestDatabaseConfig guard.
 * Run only with explicit A00/A20/owner approval on an isolated disposable
 * PostgreSQL16 TEST_DATABASE_URL, tm_test_* schema and bounded reset consent.
 * NEVER run against shared or production data. No DATABASE_URL fallback.
 */
type DbModule = typeof import("@workspace/db");
type Configuration = {
  baskets: Array<{
    id: string;
    stageId: number;
    type: "input" | "output";
    ordinal: number;
    order: number;
    colorId: string | null;
    participantIds: number[];
    qualifierCount: number | null;
  }>;
  routes: Array<{ id: string; sourceBasketId: string; targetBasketId: string }>;
};
type Fixture = {
  id: number;
  stageIds: number[];
  playerIds: number[];
  headers: Record<string, string>;
};
type Readback = {
  etag: string;
  body: { baskets: Configuration["baskets"]; routes: Configuration["routes"]; [key: string]: unknown };
};

let app: Express;
let database: DbModule;
let config: TestDatabaseConfig;
let initialized = false;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = "t055-r22-" + randomUUID();
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database) return;
  if (initialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

async function fixture(): Promise<Fixture> {
  const created = await request(app).post("/api/tournaments").send({
    name: "T055 CAS " + randomUUID(),
    format: "swiss",
    organizerPassword: "t055-test-only-organizer",
    stagePlan: {
      initialParticipantCount: 4,
      stages: [
        {
          key: "swiss", position: 1, name: "Swiss", format: "swiss",
          participantCount: 4, bestOf: 1, rounds: 3, advancingCount: 2,
        },
        {
          key: "final", position: 2, name: "Final", format: "single_elimination",
          participantCount: 2, bestOf: 3,
        },
      ],
    },
  });
  assert.equal(created.status, 201, created.text);
  const id = created.body.id as number;
  const players = await database.db.insert(database.playersTable).values(
    [1, 2, 3, 4].map((seed) => ({
      tournamentId: id,
      name: "P" + seed + "-" + randomUUID(),
      seed,
    })),
  ).returning();
  const stages = await database.db.select().from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, id));
  stages.sort((a, b) => a.position - b.position);
  assert.equal(stages.length, 2);
  return {
    id,
    playerIds: players.map((p) => p.id),
    stageIds: stages.map((s) => s.id),
    headers: { "x-organizer-token": created.body.organizerToken as string },
  };
}

function graph(f: Fixture, reverseColors = false): Configuration {
  const [source, target] = f.stageIds;
  return {
    baskets: [
      {
        id: "in-a", stageId: source, type: "input", ordinal: 1, order: 1,
        colorId: reverseColors ? "red" : "blue",
        participantIds: f.playerIds.slice(0, 2), qualifierCount: null,
      },
      {
        id: "in-b", stageId: source, type: "input", ordinal: 2, order: 2,
        colorId: reverseColors ? "blue" : "red",
        participantIds: f.playerIds.slice(2), qualifierCount: null,
      },
      {
        id: "out-source", stageId: source, type: "output", ordinal: 1, order: 1,
        colorId: null, participantIds: [], qualifierCount: 2,
      },
      {
        id: "in-final", stageId: target, type: "input", ordinal: 1, order: 1,
        colorId: null, participantIds: [], qualifierCount: null,
      },
      {
        id: "out-final", stageId: target, type: "output", ordinal: 1, order: 1,
        colorId: null, participantIds: [], qualifierCount: 1,
      },
    ],
    routes: [{ id: "swiss-to-final", sourceBasketId: "out-source", targetBasketId: "in-final" }],
  };
}

function endpoint(f: Fixture) {
  return "/api/tournaments/" + f.id + "/stage-baskets";
}

async function read(f: Fixture): Promise<Readback> {
  const response = await request(app).get(endpoint(f)).set(f.headers);
  assert.equal(response.status, 200, response.text);
  const etag = response.headers.etag as string | undefined;
  assert.ok(etag, "CAS GET must return an ETag for the same basket snapshot");
  // Strong, opaque, quoted validator: weak Express auto-ETag is insufficient
  // for mandatory optimistic concurrency on an opaque server revision.
  assert.match(etag, /^"[^"]+"$/, "GET must issue a strong basket CAS ETag");
  return { etag, body: response.body as Readback["body"] };
}

async function rawSnapshot(f: Fixture): Promise<Record<string, unknown>> {
  const id = f.id;
  const queries = {
    tournament: "SELECT id, basket_flow_authority_version FROM tournaments WHERE id=$1",
    stages: "SELECT id, stage_key, position, version, participant_count, advancing_count FROM tournament_stages WHERE tournament_id=$1 ORDER BY id",
    baskets: "SELECT * FROM stage_baskets WHERE tournament_id=$1 ORDER BY id",
    participants: "SELECT * FROM stage_basket_participants WHERE tournament_id=$1 ORDER BY basket_id, player_id",
    routes: "SELECT * FROM stage_basket_routes WHERE tournament_id=$1 ORDER BY id",
  };
  const snapshot: Record<string, unknown> = {};
  for (const [key, statement] of Object.entries(queries)) {
    snapshot[key] = (await database.pool.query(statement, [id])).rows;
  }
  return snapshot;
}

async function put(f: Fixture, token: string, body: Configuration) {
  return request(app).put(endpoint(f)).set(f.headers).set("If-Match", token).send(body);
}

test("CAS-01 GET returns stable strong ETag for unchanged graph; tenant tokens differ", async () => {
  const a = await fixture();
  const b = await fixture();
  const first = await read(a);
  const second = await read(a);
  const other = await read(b);
  assert.equal(first.etag, second.etag, "unchanged same-graph read must keep base revision");
  assert.notEqual(first.etag, other.etag, "token must be bound to tournament identity");
  assert.deepEqual(first.body.baskets, second.body.baskets);
  assert.deepEqual(first.body.routes, second.body.routes);
});

test("CAS-02 legacy PUT without If-Match -> 428; no graph or stage mutation", async () => {
  const f = await fixture();
  const before = await rawSnapshot(f);
  const response = await request(app).put(endpoint(f)).set(f.headers).send(graph(f));
  const after = await rawSnapshot(f);
  assert.deepEqual(after, before, "missing precondition MUST NOT modify even a single DB row");
  assert.equal(response.status, 428, response.text);
});

test("CAS-03 malformed If-Match -> fail-closed 4xx; no mutation", async () => {
  const f = await fixture();
  const before = await rawSnapshot(f);
  const response = await put(f, "not-a-quoted-validator", graph(f));
  const after = await rawSnapshot(f);
  assert.deepEqual(after, before, "malformed validator must not mutate basket graph or stage versions");
  assert.ok([400, 422].includes(response.status), "malformed header must return agreed fail-closed 400/422");
});

test("CAS-04 fresh If-Match commits once and issues a new revision ETag", async () => {
  const f = await fixture();
  const prior = await read(f);
  const saved = await put(f, prior.etag, graph(f));
  assert.equal(saved.status, 200, saved.text);
  const current = await read(f);
  assert.notEqual(current.etag, prior.etag, "committed basket revision must advance monotonically");
  assert.deepEqual(current.body.baskets, saved.body.baskets);
  assert.deepEqual(current.body.routes, saved.body.routes);
});

test("CAS-05 stale sequential V0 editor -> 412 domain error, winner DB unchanged", async () => {
  const f = await fixture();
  const stale = await read(f);
  const winner = await put(f, stale.etag, graph(f));
  assert.equal(winner.status, 200, winner.text);
  const committed = await rawSnapshot(f);
  const rejected = await put(f, stale.etag, graph(f, true));
  const finalRows = await rawSnapshot(f);
  assert.deepEqual(finalRows, committed, "loser must not overwrite any winner data");
  assert.equal(rejected.status, 412, rejected.text);
  assert.equal(rejected.body.code, "STAGE_BASKET_CONFIGURATION_STALE");
});

test("CAS-06 concurrent independent V0 writers: exactly one 200, one 412; no loser writes", async () => {
  const f = await fixture();
  const snapshot = await read(f);
  const results = await Promise.all([
    put(f, snapshot.etag, graph(f)),
    put(f, snapshot.etag, graph(f, true)),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 412]);
  const loser = results.find((r) => r.status === 412);
  const winner = results.find((r) => r.status === 200);
  assert.equal(loser?.body.code, "STAGE_BASKET_CONFIGURATION_STALE");
  assert.ok(winner);
  const current = await read(f);
  assert.deepEqual(current.body.baskets, winner.body.baskets, "winning graph must survive");
  assert.deepEqual(current.body.routes, winner.body.routes);
  assert.notEqual(current.etag, snapshot.etag, "successful write must advance token");
});

test("CAS-07 other tournament's ETag cannot authorize this tournament's PUT", async () => {
  const a = await fixture();
  const b = await fixture();
  const foreign = await read(a);
  const before = await rawSnapshot(b);
  const response = await put(b, foreign.etag, graph(b));
  const after = await rawSnapshot(b);
  assert.deepEqual(after, before, "cross-tournament validators must never authorize writes");
  assert.ok([400, 412].includes(response.status), "foreign token must fail closed");
});

test("CAS-08 stage version drift after GET -> stale 412/no additional mutation", async () => {
  const f = await fixture();
  const readBefore = await read(f);
  await database.pool.query(
    "UPDATE tournament_stages SET version=version+1 WHERE id=$1 AND tournament_id=$2",
    [f.stageIds[0], f.id],
  );
  const afterExternalStageChange = await rawSnapshot(f);
  const response = await put(f, readBefore.etag, graph(f));
  assert.deepEqual(await rawSnapshot(f), afterExternalStageChange,
    "stale edit must not alter a graph after relevant stage version changed");
  assert.equal(response.status, 412, response.text);
});

test("CAS-09 participant roster drift after GET -> stale 412/no additional mutation", async () => {
  const f = await fixture();
  const readBefore = await read(f);
  await database.pool.query(
    "INSERT INTO players(tournament_id, name, seed) VALUES($1,$2,$3)",
    [f.id, "Late-" + randomUUID(), 5],
  );
  const afterExternalRosterChange = await rawSnapshot(f);
  const response = await put(f, readBefore.etag, graph(f));
  assert.deepEqual(await rawSnapshot(f), afterExternalRosterChange,
    "stale edit must not alter a basket graph after participant roster changed");
  assert.equal(response.status, 412, response.text);
});

test("CAS-10 unauthorized organizer access remains denied with valid ETag and zero mutation", async () => {
  const f = await fixture();
  const current = await read(f);
  const before = await rawSnapshot(f);
  const response = await request(app).put(endpoint(f))
    .set("If-Match", current.etag).send(graph(f));
  assert.ok([401, 403].includes(response.status), "no organizer rights must fail closed");
  assert.deepEqual(await rawSnapshot(f), before);
});

/**
 * Follow-up acceptance not represented as fake PASS:
 * - A20: persisted monotonic basket revision schema/migration/restore/ABA
 *   requires reviewed DB column+rollback design before adding direct SQL assertions.
 * - A90: Backup V3 legal V2/V3 restore and basket CAS epoch preservation.
 * - A110 L2 (separate GO): React StageBasketsPanel preserves losing local draft,
 *   scopes by tournament/role, no automatic 412 retry, explicit opt-in reconcile.
 * - Stage/roster writer inventory must be confirmed by A20 under real locks.
 * - Existing pre-CAS unconditional PUT tests will need contract-aligned updates
 *   by their owners after a future explicit coordinated GO, NOT in this PR.
 */