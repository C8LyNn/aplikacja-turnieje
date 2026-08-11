import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import {
  compileTournamentBlueprintV2,
  createRoutingExecutionV2,
  doubleEliminationFormatEngineV2,
} from "../src/domain/tournament/v2";
import { minimalBlueprint, requireCompiled } from "./tournament-routing-test-helpers";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

type DbModule = typeof import("@workspace/db");
type PlanPersistenceModule = typeof import(
  "../src/application/routing/routing-plan-persistence"
);
type ExecutionPersistenceModule = typeof import(
  "../src/application/routing/routing-execution-persistence"
);

let testConfig: TestDatabaseConfig;
let dbModule: DbModule;
let planPersistence: PlanPersistenceModule;
let executionPersistence: ExecutionPersistenceModule;

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  dbModule = await import("@workspace/db");
  await resetTestSchema(
    dbModule.pool as unknown as TestPool,
    testConfig.schema,
  );
  planPersistence = await import(
    "../src/application/routing/routing-plan-persistence"
  );
  executionPersistence = await import(
    "../src/application/routing/routing-execution-persistence"
  );
});

after(async () => {
  await dropTestSchema(
    dbModule.pool as unknown as TestPool,
    testConfig.schema,
  );
  await dbModule.pool.end();
});

test("persists, reloads, corrects and resets a double-elimination execution", async () => {
  const [tournament] = await dbModule.db
    .insert(dbModule.tournamentsTable)
    .values({
      name: "Double Elimination Persistence",
      format: "single_elimination",
      status: "draft",
      maxPlayers: 4,
      defaultBestOf: 3,
      visibility: "public_online",
    })
    .returning({ id: dbModule.tournamentsTable.id });
  const [stage] = await dbModule.db
    .select({ id: dbModule.tournamentStagesTable.id })
    .from(dbModule.tournamentStagesTable)
    .where(eq(dbModule.tournamentStagesTable.tournamentId, tournament.id));
  await dbModule.db
    .update(dbModule.tournamentStagesTable)
    .set({ participantCount: 4 })
    .where(eq(dbModule.tournamentStagesTable.id, stage.id));
  const plan = requireCompiled(
    compileTournamentBlueprintV2(
      minimalBlueprint("double_elimination", 4),
      [doubleEliminationFormatEngineV2],
    ),
  );
  const savedPlan = await planPersistence.saveCompiledRoutingPlanV2({
    tournamentId: tournament.id,
    plan,
    stageIdsByKey: { playoff: stage.id },
  });
  const initial = createRoutingExecutionV2(plan, "playoff", ["p1", "p2", "p3", "p4"]);
  const created = await executionPersistence.createPersistedRoutingExecutionV2({
    planId: savedPlan.planId,
    snapshot: initial.snapshot,
  });
  assert.equal(created.revision, 1);

  const firstReady = created.evaluation.matches.find((match) => match.status === "ready");
  assert.ok(firstReady?.slots[0]);
  const persisted = await executionPersistence.recordPersistedRoutingMatchResultV2({
    planId: savedPlan.planId,
    expectedRevision: created.revision,
    stageKey: "playoff",
    matchKey: firstReady.matchKey,
    winnerParticipantKey: firstReady.slots[0],
  });
  assert.equal(persisted.revision, 2);
  const reloaded = await executionPersistence.loadPersistedRoutingExecutionV2({
    planId: savedPlan.planId,
    stageKey: "playoff",
  });
  assert.deepEqual(reloaded.evaluation, persisted.evaluation);

  const correctedPersisted = await executionPersistence.correctPersistedRoutingMatchResultV2({
    planId: savedPlan.planId,
    expectedRevision: reloaded.revision,
    stageKey: "playoff",
    matchKey: firstReady.matchKey,
    winnerParticipantKey: firstReady.slots[1]!,
  });
  assert.equal(correctedPersisted.revision, 3);

  await assert.rejects(
    executionPersistence.resetPersistedRoutingExecutionV2({
      planId: savedPlan.planId,
      expectedRevision: reloaded.revision,
      stageKey: "playoff",
    }),
    (error: unknown) =>
      error instanceof executionPersistence.RoutingExecutionPersistenceError &&
      error.code === "EXECUTION_REVISION_CONFLICT",
  );

  const resetPersisted = await executionPersistence.resetPersistedRoutingExecutionV2({
    planId: savedPlan.planId,
    expectedRevision: correctedPersisted.revision,
    stageKey: "playoff",
  });
  assert.equal(resetPersisted.revision, 4);
  assert.deepEqual(resetPersisted.evaluation.snapshot.decisions, []);

  let simulated = resetPersisted;
  for (let step = 0; step < 20 && !simulated.evaluation.completed; step += 1) {
    const ready = simulated.evaluation.matches.find((match) => match.status === "ready");
    assert.ok(ready?.slots[0], "full persisted simulation must expose a ready match");
    simulated = await executionPersistence.recordPersistedRoutingMatchResultV2({
      planId: savedPlan.planId,
      expectedRevision: simulated.revision,
      stageKey: "playoff",
      matchKey: ready.matchKey,
      winnerParticipantKey: ready.slots[0],
    });
  }
  assert.equal(simulated.evaluation.completed, true);
  assert.ok(simulated.evaluation.championParticipantKey);
  assert.equal(
    new Set(simulated.evaluation.snapshot.decisions.map((decision) => decision.matchKey)).size,
    simulated.evaluation.snapshot.decisions.length,
  );
  assert.deepEqual(
    (await executionPersistence.loadPersistedRoutingExecutionV2({
      planId: savedPlan.planId,
      stageKey: "playoff",
    })).evaluation,
    simulated.evaluation,
  );
});
