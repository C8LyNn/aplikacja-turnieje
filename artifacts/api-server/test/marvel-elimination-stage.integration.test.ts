import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import type { MarvelRegroupingStrategy } from "@workspace/game-catalog";
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
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
}

const SESSION_SECRET = `marvel-elimination-${randomUUID()}`;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let createTournamentWithStagePlan: typeof import("../src/application/stages/create-tournament-with-plan").createTournamentWithStagePlan;
let addTournamentPlayer: typeof import("../src/application/players/tournament-roster").addTournamentPlayer;
let startStage: typeof import("../src/application/stages/stage-lifecycle").startStage;
let getMarvelEliminationStageState: typeof import("../src/application/stages/marvel-elimination-stage").getMarvelEliminationStageState;
let submitMarvelGroupResult: typeof import("../src/application/stages/marvel-elimination-stage").submitMarvelGroupResult;
let assignMarvelManualGroups: typeof import("../src/application/stages/marvel-elimination-stage").assignMarvelManualGroups;

async function createMarvelFixture(
  participantCount: 32 | 64,
  regroupingStrategy: MarvelRegroupingStrategy = "paired_merge",
) {
  const created = await createTournamentWithStagePlan({
    tournament: {
      name: `Marvel ${participantCount} ${randomUUID()}`,
      format: "round_robin",
      status: "draft",
      visibility: "public_online",
      maxPlayers: participantCount,
      defaultBestOf: 1,
    },
    gameConfig: {
      gameId: "marvel",
      configVersion: 1,
      config: {
        groupSize: 8,
        advancingCount: 4,
        killLimit: 20,
        regroupingStrategy,
      },
    },
    stagePlan: {
      initialParticipantCount: participantCount,
      stages: [
        {
          key: "stage_1",
          position: 1,
          name: "Marvel — Eliminacyjne grupy",
          format: "group_stage",
          participantCount,
          bestOf: 1,
          groupCount: participantCount / 8,
          participantsPerGroup: 8,
          qualifiersPerGroup: 4,
          entrySeedingMethod: "preserve",
          placementMethod: "snake",
          resultSeedingMethod: "rank_bands",
          randomRevealOrder: "instant",
        },
      ],
    },
  });
  for (let index = 0; index < participantCount; index += 1) {
    await addTournamentPlayer({
      tournamentId: created.tournament.id,
      player: { name: `Marvel P${index + 1}`, seed: index + 1 },
    });
  }
  const [stage] = await database.db
    .select()
    .from(database.tournamentStagesTable)
    .where(
      eq(database.tournamentStagesTable.tournamentId, created.tournament.id),
    );
  await startStage({ tournamentId: created.tournament.id, stageId: stage.id });
  return { tournamentId: created.tournament.id, stageId: stage.id };
}

async function completeRound(fixture: {
  tournamentId: number;
  stageId: number;
}): Promise<void> {
  const state = await getMarvelEliminationStageState(fixture);
  const round = state.rounds.find(
    (candidate) => candidate.roundNumber === state.currentRound,
  );
  assert.ok(round);
  for (const group of round.groups) {
    await submitMarvelGroupResult({
      ...fixture,
      groupId: group.id,
      placements: group.entries.map((entry, index) => ({
        playerId: entry.playerId,
        kills: index === 0 ? 20 : Math.max(0, 18 - index),
      })),
    });
  }
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(
    database.pool as unknown as TestPool,
    testConfig.schema,
  );
  schemaInitialized = true;
  ({ createTournamentWithStagePlan } =
    await import("../src/application/stages/create-tournament-with-plan"));
  ({ addTournamentPlayer } =
    await import("../src/application/players/tournament-roster"));
  ({ startStage } = await import("../src/application/stages/stage-lifecycle"));
  ({
    assignMarvelManualGroups,
    getMarvelEliminationStageState,
    submitMarvelGroupResult,
  } = await import("../src/application/stages/marvel-elimination-stage"));
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) {
    await dropTestSchema(
      database.pool as unknown as TestPool,
      testConfig.schema,
    );
  }
  await database.pool.end();
});

describe("Marvel elimination-group stage runtime", () => {
  test("32 players progress 4x8 -> 2x8 -> one final without creating matches", async () => {
    const fixture = await createMarvelFixture(32);
    let state = await getMarvelEliminationStageState(fixture);
    assert.deepEqual(
      state.rounds[0].groups.map((group) => group.entries.length),
      [8, 8, 8, 8],
    );

    await completeRound(fixture);
    state = await getMarvelEliminationStageState(fixture);
    assert.deepEqual(
      state.rounds[1].groups.map((group) => group.entries.length),
      [8, 8],
    );
    assert.deepEqual(
      state.rounds[1].groups[0].entries.map((entry) => entry.sourceGroupId),
      [
        ...Array(4).fill(state.rounds[0].groups[0].id),
        ...Array(4).fill(state.rounds[0].groups[1].id),
      ],
    );

    await completeRound(fixture);
    state = await getMarvelEliminationStageState(fixture);
    assert.equal(state.rounds[2].groups.length, 1);
    assert.equal(state.rounds[2].groups[0].entries.length, 8);

    await completeRound(fixture);
    state = await getMarvelEliminationStageState(fixture);
    assert.equal(state.status, "completed");
    assert.equal(state.winnerId, state.rounds[2].groups[0].entries[0].playerId);
    const matches = await database.db
      .select()
      .from(database.matchesTable)
      .where(eq(database.matchesTable.stageId, fixture.stageId));
    assert.equal(matches.length, 0);
  });

  test("random regrouping is persisted and unchanged by a fresh read", async () => {
    const fixture = await createMarvelFixture(32, "random");
    await completeRound(fixture);
    const first = await getMarvelEliminationStageState(fixture);
    const refreshed = await getMarvelEliminationStageState(fixture);
    assert.ok(first.rounds[1].randomSeed);
    assert.deepEqual(refreshed.rounds[1], first.rounds[1]);
  });

  test("manual regrouping waits for and persists an organizer assignment", async () => {
    const fixture = await createMarvelFixture(32, "manual");
    await completeRound(fixture);
    let state = await getMarvelEliminationStageState(fixture);
    assert.equal(state.rounds[1].status, "awaiting_manual");
    assert.equal(state.rounds[1].groups.length, 0);
    const qualifiers = state.rounds[0].groups.flatMap((group) =>
      group.entries
        .filter((entry) => entry.qualified)
        .map((entry) => entry.playerId),
    );
    await assignMarvelManualGroups({
      ...fixture,
      groups: [
        {
          position: 1,
          playerIds: qualifiers.filter((_, index) => index % 2 === 0),
        },
        {
          position: 2,
          playerIds: qualifiers.filter((_, index) => index % 2 === 1),
        },
      ],
    });
    state = await getMarvelEliminationStageState(fixture);
    assert.equal(state.rounds[1].status, "active");
    assert.deepEqual(
      state.rounds[1].groups.map((group) => group.entries.length),
      [8, 8],
    );
  });
});
