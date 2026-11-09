import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import { and, desc, eq } from "drizzle-orm";
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
  matchesTable: typeof import("@workspace/db").matchesTable;
  playersTable: typeof import("@workspace/db").playersTable;
  stageBasketsTable: typeof import("@workspace/db").stageBasketsTable;
  stageParticipantsTable: typeof import("@workspace/db").stageParticipantsTable;
  tournamentRoutingPlansTable: typeof import("@workspace/db").tournamentRoutingPlansTable;
  tournamentRoutingStagesTable: typeof import("@workspace/db").tournamentRoutingStagesTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
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
        qualifierCount: null,
      },
      {
        id: "first-input-b",
        stageId: firstStageId,
        type: "input",
        ordinal: 2,
        order: 2,
        colorId: "red",
        participantIds: data.playerIds.slice(2),
        qualifierCount: null,
      },
      {
        id: "first-output",
        stageId: firstStageId,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
        qualifierCount: 2,
      },
      {
        id: "second-input",
        stageId: secondStageId,
        type: "input",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
        qualifierCount: null,
      },
      {
        id: "second-output",
        stageId: secondStageId,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
        qualifierCount: 1,
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

function derivedParticipantCounts(configuration: {
  baskets: Array<{
    id: string;
    stageId: number;
    type: "input" | "output";
    participantIds: number[];
    qualifierCount: number | null;
  }>;
  routes: Array<{ sourceBasketId: string; targetBasketId: string }>;
}): Map<number, number> {
  const directIds = new Map<number, Set<number>>();
  const incoming = new Map<number, number>();
  const basketById = new Map(
    configuration.baskets.map((basket) => [basket.id, basket]),
  );
  for (const basket of configuration.baskets) {
    if (!directIds.has(basket.stageId)) directIds.set(basket.stageId, new Set());
    if (!incoming.has(basket.stageId)) incoming.set(basket.stageId, 0);
    if (basket.type === "input") {
      for (const participantId of basket.participantIds) {
        directIds.get(basket.stageId)!.add(participantId);
      }
    }
  }
  for (const route of configuration.routes) {
    const source = basketById.get(route.sourceBasketId);
    const target = basketById.get(route.targetBasketId);
    if (source?.type === "output" && target?.type === "input") {
      incoming.set(
        target.stageId,
        (incoming.get(target.stageId) ?? 0) + (source.qualifierCount ?? 0),
      );
    }
  }
  return new Map(
    [...directIds].map(([stageId, playerIds]) => [
      stageId,
      playerIds.size + (incoming.get(stageId) ?? 0),
    ]),
  );
}

describe("stage basket persistence and API", () => {
  test("legacy stages expose deterministic implicit baskets and forward routes", async () => {
    const data = await fixture();
    const response = await request(app).get(
      `/api/tournaments/${data.tournamentId}/stage-baskets`,
    );
    assert.equal(response.status, 200, response.text);
    assert.equal(response.body.legacyDefaulted, true);
    assert.equal(response.body.flowAuthority, "legacy");
    assert.equal(response.body.baskets.length, 4);
    assert.equal(response.body.routes.length, 1);
    assert.equal(response.body.validation.valid, true);
    assert.deepEqual(
      response.body.baskets[0].participantIds.sort(
        (a: number, b: number) => a - b,
      ),
      [...data.playerIds].sort((a, b) => a - b),
    );
    // Verify legacy qualifierCount derivation:
    //   - First stage output: qualifierCount = advancingCount (2 from stagePlan).
    //   - Terminal (second) stage output: qualifierCount = null (no further stage).
    // GET must NOT persist baskets; legacyDefaulted must remain true on reload.
    const firstOutput = response.body.baskets.find(
      (b: { type: string; stageId: number }) =>
        b.type === "output" && b.stageId === data.stageIds[0],
    );
    const terminalOutput = response.body.baskets.find(
      (b: { type: string; stageId: number }) =>
        b.type === "output" && b.stageId === data.stageIds[1],
    );
    assert.equal(
      firstOutput?.qualifierCount,
      2,
      "non-terminal legacy output basket must derive qualifierCount from stage advancingCount",
    );
    assert.equal(
      terminalOutput?.qualifierCount,
      null,
      "terminal legacy output basket must have qualifierCount = null",
    );
    // Confirm GET is truly non-materialising: a second fetch must still be legacyDefaulted.
    const reload = await request(app).get(
      `/api/tournaments/${data.tournamentId}/stage-baskets`,
    );
    assert.equal(reload.body.legacyDefaulted, true, "GET must not persist baskets to DB");
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
    assert.equal(saved.body.flowAuthority, "basket_v1");
    assert.deepEqual(saved.body.baskets, input.baskets);
    assert.deepEqual(saved.body.routes, input.routes);
    const loaded = await request(app).get(
      `/api/tournaments/${data.tournamentId}/stage-baskets`,
    );
    assert.deepEqual(loaded.body, saved.body);
  });

  test("[before V3 import] explicit basket authority accepts 16 direct then 8 routed plus 8 direct without starting runtime", async (swarm006V3TestContext) => {
    const created = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Basket authority ${randomUUID()}`,
        format: "swiss",
        organizerPassword: "basket-authority-password",
        stagePlan: {
          initialParticipantCount: 24,
          stages: [
            {
              key: "opening",
              position: 1,
              name: "Opening",
              format: "swiss",
              participantCount: 24,
              bestOf: 1,
              rounds: 5,
              advancingCount: 12,
            },
            {
              key: "double-final",
              position: 2,
              name: "Double Final",
              format: "double_elimination",
              participantCount: 12,
              bestOf: 3,
              entrySeedingMethod: "preserve",
              placementMethod: "standard",
            },
          ],
        },
      });
    assert.equal(created.status, 201, created.text);
    const tournamentId = created.body.id as number;
    const organizer = {
      "x-organizer-token": created.body.organizerToken as string,
    };
    const players = await database.db
      .insert(database.playersTable)
      .values(
        Array.from({ length: 24 }, (_, index) => ({
          tournamentId,
          name: `Authority Player ${index + 1}-${randomUUID()}`,
          seed: index + 1,
        })),
      )
      .returning({ id: database.playersTable.id });
    const stages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eq(database.tournamentStagesTable.tournamentId, tournamentId));
    stages.sort((left, right) => left.position - right.position);
    const [opening, doubleFinal] = stages;
    assert.equal(opening.participantCount, 24);
    assert.equal(opening.advancingCount, 12);
    assert.equal(doubleFinal.participantCount, 12);
    const membershipsBefore = await database.db
      .select({ id: database.stageParticipantsTable.id })
      .from(database.stageParticipantsTable)
      .where(eq(database.stageParticipantsTable.tournamentId, tournamentId));
    const matchesBefore = await database.db
      .select({ id: database.matchesTable.id })
      .from(database.matchesTable)
      .where(eq(database.matchesTable.tournamentId, tournamentId));

    const saved = await request(app)
      .put(`/api/tournaments/${tournamentId}/stage-baskets`)
      .set(organizer)
      .send({
        baskets: [
          {
            id: "opening-input",
            stageId: opening.id,
            type: "input",
            ordinal: 1,
            order: 1,
            colorId: null,
            participantIds: players.slice(0, 16).map((player) => player.id),
            qualifierCount: null,
          },
          {
            id: "opening-output",
            stageId: opening.id,
            type: "output",
            ordinal: 1,
            order: 1,
            colorId: null,
            participantIds: [],
            qualifierCount: 8,
          },
          {
            id: "double-final-input",
            stageId: doubleFinal.id,
            type: "input",
            ordinal: 1,
            order: 1,
            colorId: null,
            participantIds: players.slice(16).map((player) => player.id),
            qualifierCount: null,
          },
          {
            id: "double-final-output",
            stageId: doubleFinal.id,
            type: "output",
            ordinal: 1,
            order: 1,
            colorId: null,
            participantIds: [],
            qualifierCount: 1,
          },
        ],
        routes: [
          {
            id: "opening-to-double-final",
            sourceBasketId: "opening-output",
            targetBasketId: "double-final-input",
          },
        ],
      });
    assert.equal(saved.status, 200, saved.text);
    assert.equal(saved.body.legacyDefaulted, false);
    assert.equal(saved.body.flowAuthority, "basket_v1");
    assert.equal(saved.body.validation.valid, true);

    const directByStage = new Map<number, number>();
    for (const basket of saved.body.baskets as Array<{
      stageId: number;
      type: string;
      participantIds: number[];
    }>) {
      if (basket.type === "input") {
        directByStage.set(
          basket.stageId,
          (directByStage.get(basket.stageId) ?? 0) + basket.participantIds.length,
        );
      }
    }
    assert.equal(directByStage.get(opening.id), 16);
    assert.equal(directByStage.get(doubleFinal.id), 8);
    assert.equal(
      directByStage.get(doubleFinal.id)! +
        (saved.body.baskets as Array<{ id: string; qualifierCount: number | null }>).find(
          (basket) => basket.id === "opening-output",
        )!.qualifierCount!,
      16,
      "target capacity must be eight incoming route slots plus eight direct assignments",
    );

    const membershipsAfter = await database.db
      .select({ id: database.stageParticipantsTable.id })
      .from(database.stageParticipantsTable)
      .where(eq(database.stageParticipantsTable.tournamentId, tournamentId));
    const matchesAfter = await database.db
      .select({ id: database.matchesTable.id })
      .from(database.matchesTable)
      .where(eq(database.matchesTable.tournamentId, tournamentId));
    const stagesAfter = await database.db
      .select({
        position: database.tournamentStagesTable.position,
        status: database.tournamentStagesTable.status,
        participantCount: database.tournamentStagesTable.participantCount,
        advancingCount: database.tournamentStagesTable.advancingCount,
      })
      .from(database.tournamentStagesTable)
      .where(eq(database.tournamentStagesTable.tournamentId, tournamentId));
    stagesAfter.sort((left, right) => left.position - right.position);
    assert.equal(stagesAfter[0].participantCount, 16);
    assert.equal(stagesAfter[0].advancingCount, 8);
    assert.equal(stagesAfter[1].participantCount, 16);
    assert.equal(stagesAfter[1].advancingCount, null);
    const [persistedTournament] = await database.db
      .select({
        basketFlowAuthorityVersion:
          database.tournamentsTable.basketFlowAuthorityVersion,
      })
      .from(database.tournamentsTable)
      .where(eq(database.tournamentsTable.id, tournamentId));
    assert.equal(persistedTournament.basketFlowAuthorityVersion, 1);
    const [latestPlan] = await database.db
      .select({ id: database.tournamentRoutingPlansTable.id })
      .from(database.tournamentRoutingPlansTable)
      .where(eq(database.tournamentRoutingPlansTable.tournamentId, tournamentId))
      .orderBy(desc(database.tournamentRoutingPlansTable.revision))
      .limit(1);
    const compiledStages = await database.db
      .select({
        stageId: database.tournamentRoutingStagesTable.stageId,
        capacity:
          database.tournamentRoutingStagesTable.exactParticipantCapacity,
      })
      .from(database.tournamentRoutingStagesTable)
      .where(eq(database.tournamentRoutingStagesTable.planId, latestPlan.id));
    assert.equal(
      compiledStages.find((stage) => stage.stageId === doubleFinal.id)?.capacity,
      16,
      "sealed Double Elimination capacity must follow the basket-derived count",
    );
    assert.equal(membershipsAfter.length, membershipsBefore.length);
    assert.equal(matchesAfter.length, matchesBefore.length);
    assert.equal(stagesAfter.length, 2);
    assert.ok(stagesAfter.every((stage) => stage.status === "planned"));

    const exported = await request(app)
      .get(`/api/tournaments/${tournamentId}/export`)
      .set(organizer);
    assert.equal(exported.status, 200, exported.text);
    assert.equal(exported.body.tournament.basketFlowAuthorityVersion, 1);
    await swarm006V3TestContext.test("V3 NOT_RUN: explicit basket authority accepts 16 direct then 8 routed plus 8 direct without starting runtime", { skip: "Backup V3 import disabled (#152)" }, async () => {
    const restored = await request(app).post("/api/tournaments/import").send({
      backup: exported.body,
      organizerPassword: "restored-authority-password",
    });
    assert.equal(restored.status, 201, restored.text);
    const restoredConfiguration = await request(app).get(
      `/api/tournaments/${restored.body.tournament.id}/stage-baskets`,
    );
    assert.equal(restoredConfiguration.status, 200, restoredConfiguration.text);
    assert.equal(restoredConfiguration.body.flowAuthority, "basket_v1");
    assert.deepEqual(
      [...derivedParticipantCounts(restoredConfiguration.body).values()],
      [16, 16],
      "Backup V3 must preserve basket-derived capacity without materializing runtime memberships",
    );

    });
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

  test("[before V3 import] Backup V3 round-trip preserves explicit basket identities and assignments", async (swarm006V3TestContext) => {
    const data = await fixture();
    const input = explicitConfiguration(data);
    const saved = await request(app)
      .put(`/api/tournaments/${data.tournamentId}/stage-baskets`)
      .set(data.organizer)
      .send(input);
    assert.equal(saved.status, 200, saved.text);
    const exported = await request(app)
      .get(`/api/tournaments/${data.tournamentId}/export`)
      .set(data.organizer);
    assert.equal(exported.status, 200, exported.text);
    assert.equal(exported.body.tournament.basketFlowAuthorityVersion, 1);
    assert.equal(exported.body.stageBaskets.length, input.baskets.length);
    await swarm006V3TestContext.test("V3 NOT_RUN: Backup V3 round-trip preserves explicit basket identities and assignments", { skip: "Backup V3 import disabled (#152)" }, async () => {
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
    assert.equal(loaded.body.flowAuthority, "basket_v1");
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
    assert.deepEqual(
      [...derivedParticipantCounts(saved.body).values()],
      [4, 2],
      "export source must derive four direct entrants then two routed entrants",
    );
    assert.deepEqual(
      [...derivedParticipantCounts(loaded.body).values()],
      [4, 2],
      "Backup V3 restore must derive the same participant counts from the restored graph",
    );

    });
  });
});
