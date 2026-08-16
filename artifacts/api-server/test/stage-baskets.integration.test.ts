import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import { and, eq } from "drizzle-orm";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  playersTable: typeof import("@workspace/db").playersTable;
  stageBasketsTable: typeof import("@workspace/db").stageBasketsTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
}

const SESSION_SECRET = `stage-baskets-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database) return;
  if (schemaInitialized)
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

const stagePlan = {
  initialParticipantCount: 4,
  stages: [
    {
      key: "swiss",
      position: 1,
      name: "Swiss",
      format: "swiss",
      participantCount: 4,
      bestOf: 1,
      rounds: 3,
      advancingCount: 2,
    },
    {
      key: "final",
      position: 2,
      name: "Final",
      format: "single_elimination",
      participantCount: 2,
      bestOf: 3,
    },
  ],
} as const;

async function fixture() {
  const created = await request(app)
    .post("/api/tournaments")
    .send({
      name: `Baskets ${randomUUID()}`,
      format: "swiss",
      organizerPassword: "stage-basket-password",
      supportPassword: "stage-support-password",
      stagePlan,
    });
  assert.equal(created.status, 201, created.text);
  const tournamentId = created.body.id as number;
  const players = await database.db
    .insert(database.playersTable)
    .values(
      Array.from({ length: 4 }, (_, index) => ({
        tournamentId,
        name: `Player ${index + 1}-${randomUUID()}`,
        seed: index + 1,
      })),
    )
    .returning();
  const stages = await database.db
    .select()
    .from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournamentId));
  stages.sort((left, right) => left.position - right.position);
  const support = await request(app)
    .post(`/api/tournaments/${tournamentId}/auth/support-login`)
    .send({ password: "stage-support-password", nick: "Support" });
  assert.equal(support.status, 200, support.text);
  return {
    tournamentId,
    playerIds: players.map((player) => player.id),
    stageIds: stages.map((stage) => stage.id),
    organizer: { "x-organizer-token": created.body.organizerToken as string },
    support: { "x-support-token": support.body.sessionToken as string },
  };
}

function explicitConfiguration(data: Awaited<ReturnType<typeof fixture>>) {
  const [firstStageId, secondStageId] = data.stageIds;
  return {
    baskets: [
      {
        id: "first-input-a",
        stageId: firstStageId,
        type: "input",
        ordinal: 1,
        order: 1,
        colorId: "blue",
        participantIds: data.playerIds.slice(0, 2),
      },
      {
        id: "first-input-b",
        stageId: firstStageId,
        type: "input",
        ordinal: 2,
        order: 2,
        colorId: "red",
        participantIds: data.playerIds.slice(2),
      },
      {
        id: "first-output",
        stageId: firstStageId,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
      },
      {
        id: "second-input",
        stageId: secondStageId,
        type: "input",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
      },
      {
        id: "second-output",
        stageId: secondStageId,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
      },
    ],
    routes: [
      {
        id: "first-to-second",
        sourceBasketId: "first-output",
        targetBasketId: "second-input",
      },
    ],
  };
}

describe("stage basket persistence and API", () => {
  test("legacy stages expose deterministic implicit baskets and forward routes", async () => {
    const data = await fixture();
    const response = await request(app).get(
      `/api/tournaments/${data.tournamentId}/stage-baskets`,
    );
    assert.equal(response.status, 200, response.text);
    assert.equal(response.body.legacyDefaulted, true);
    assert.equal(response.body.baskets.length, 4);
    assert.equal(response.body.routes.length, 1);
    assert.equal(response.body.validation.valid, true);
    assert.deepEqual(
      response.body.baskets[0].participantIds.sort(
        (a: number, b: number) => a - b,
      ),
      [...data.playerIds].sort((a, b) => a - b),
    );
  });

  test("organizer atomically persists and reloads explicit baskets", async () => {
    const data = await fixture();
    const input = explicitConfiguration(data);
    const saved = await request(app)
      .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
      .set(data.organizer)
      .send(input);
    assert.equal(saved.status, 200, saved.text);
    assert.equal(saved.body.legacyDefaulted, false);
    assert.deepEqual(saved.body.baskets, input.baskets);
    assert.deepEqual(saved.body.routes, input.routes);
    const loaded = await request(app).get(
      `/api/tournaments/${data.tournamentId}/stage-baskets`,
    );
    assert.deepEqual(loaded.body, saved.body);
  });

  test("anonymous and support actors cannot update baskets", async () => {
    const data = await fixture();
    const input = explicitConfiguration(data);
    assert.ok(
      [401, 403].includes(
        (
          await request(app)
            .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
            .send(input)
        ).status,
      ),
    );
    assert.equal(
      (
        await request(app)
          .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
          .set(data.support)
          .send(input)
      ).status,
      403,
    );
  });

  test("configuration becomes immutable after tournament start", async () => {
    const data = await fixture();
    const input = explicitConfiguration(data);
    await request(app)
      .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
      .set(data.organizer)
      .send(input)
      .expect(200);
    await request(app)
      .post(`/api/tournaments/${data.tournamentId}/start`)
      .set(data.organizer)
      .expect(200);
    const response = await request(app)
      .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
      .set(data.organizer)
      .send(input);
    assert.equal(response.status, 409, response.text);
    assert.equal(response.body.code, "STAGE_BASKET_CONFIGURATION_IMMUTABLE");
  });

  test("readiness and start are blocked by an invalid persisted graph", async () => {
    const data = await fixture();
    const input = explicitConfiguration(data);
    await request(app)
      .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
      .set(data.organizer)
      .send(input)
      .expect(200);
    await database.db
      .delete(database.stageBasketsTable)
      .where(
        and(
          eq(database.stageBasketsTable.tournamentId, data.tournamentId),
          eq(database.stageBasketsTable.id, "first-output"),
        ),
      );
    const readiness = await request(app).get(
      `/api/tournaments/${data.tournamentId}/stages/${data.stageIds[0]}/readiness`,
    );
    assert.equal(readiness.status, 200, readiness.text);
    assert.equal(readiness.body.ready, false);
    assert.equal(
      readiness.body.reasonCode,
      "STAGE_BASKET_CONFIGURATION_INVALID",
    );
    assert.equal(readiness.body.basketValidation.valid, false);
    const start = await request(app)
      .post(`/api/tournaments/${data.tournamentId}/start`)
      .set(data.organizer);
    assert.equal(start.status, 422, start.text);
    assert.equal(start.body.code, "STAGE_BASKET_CONFIGURATION_INVALID");
  });

  test("Backup V3 round-trip preserves explicit basket identities and assignments", async () => {
    const data = await fixture();
    const input = explicitConfiguration(data);
    await request(app)
      .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
      .set(data.organizer)
      .send(input)
      .expect(200);
    const exported = await request(app)
      .get(`/api/tournaments/${data.tournamentId}/export`)
      .set(data.organizer);
    assert.equal(exported.status, 200, exported.text);
    assert.equal(exported.body.stageBaskets.length, input.baskets.length);
    const restored = await request(app).post("/api/tournaments/import").send({
      backup: exported.body,
      organizerPassword: "restored-basket-password",
    });
    assert.equal(restored.status, 201, restored.text);
    const restoredId = restored.body.tournament.id as number;
    const loaded = await request(app).get(
      `/api/tournaments/${restoredId}/stage-baskets`,
    );
    assert.equal(loaded.status, 200, loaded.text);
    assert.equal(loaded.body.legacyDefaulted, false);
    assert.deepEqual(
      loaded.body.baskets.map((basket: { id: string }) => basket.id),
      input.baskets.map((basket) => basket.id),
    );
    assert.deepEqual(loaded.body.routes, input.routes);
    assert.deepEqual(
      loaded.body.baskets.map(
        (basket: { type: string; participantIds: number[] }) => [
          basket.type,
          basket.participantIds.length,
        ],
      ),
      input.baskets.map((basket) => [basket.type, basket.participantIds.length]),
    );
  });
});
