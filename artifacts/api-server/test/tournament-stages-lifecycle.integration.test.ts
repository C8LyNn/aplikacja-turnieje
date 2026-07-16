import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
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

type SourceFormat = "swiss" | "round_robin";

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
  stageParticipantsTable: typeof import("@workspace/db").stageParticipantsTable;
  playersTable: typeof import("@workspace/db").playersTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
}

interface PlanFixture {
  tournamentId: number;
  sourceStageId: number;
  targetStageId: number;
  playerIds: number[];
  organizerHeaders: Record<string, string>;
}

const SESSION_SECRET = `stage-lifecycle-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;
let completeMatch: typeof import("../src/application/matches/complete-match").completeMatch;
let revertMatch: typeof import("../src/application/matches/revert-match").revertMatch;
let completeStage: typeof import("../src/application/stages/stage-lifecycle").completeStage;
let startStage: typeof import("../src/application/stages/stage-lifecycle").startStage;
let StageLifecycleError: typeof import("../src/application/stages/stage-lifecycle").StageLifecycleError;
let RevertMatchError: typeof import("../src/application/matches/revert-match").RevertMatchError;

async function createPlan(sourceFormat: SourceFormat): Promise<PlanFixture> {
  const suffix = randomUUID();
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: `Lifecycle ${sourceFormat} ${suffix}`,
    format: sourceFormat,
    status: "draft",
    visibility: "public_online",
    defaultBestOf: 1,
    swissRounds: sourceFormat === "swiss" ? 1 : null,
  }).returning();
  const players = await database.db.insert(database.playersTable).values(
    [1, 2, 3, 4].map((seed) => ({ tournamentId: tournament.id, name: `P${seed}-${suffix}`, seed })),
  ).returning();
  const [sourceStage] = await database.db.select().from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));
  const [configuredSource] = await database.db.update(database.tournamentStagesTable).set({
    qualificationMode: "top_n",
    advancingCount: 2,
    participantCount: 4,
    plannedRounds: sourceFormat === "swiss" ? 1 : null,
    rankingPolicy: sourceFormat === "swiss" ? "swiss_v1" : "round_robin_v1",
  }).where(eq(database.tournamentStagesTable.id, sourceStage.id)).returning();
  const [targetStage] = await database.db.insert(database.tournamentStagesTable).values({
    tournamentId: tournament.id,
    stageKey: "stage-2",
    position: 2,
    name: "Play-off",
    format: "single_elimination",
    status: "planned",
    participantCount: 2,
    bestOf: 3,
    rankingPolicy: "elimination_bracket_v1",
    qualificationMode: "none",
    seedingPolicy: "standings_order",
  }).returning();
  return {
    tournamentId: tournament.id,
    sourceStageId: configuredSource.id,
    targetStageId: targetStage.id,
    playerIds: players.map((player) => player.id),
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournament.id) },
  };
}

async function sourceMatches(fixture: PlanFixture) {
  return database.pool.query(
    "SELECT id, player1_id, player2_id FROM matches WHERE stage_id = $1 ORDER BY round, match_number",
    [fixture.sourceStageId],
  );
}

async function completeAllSourceMatches(fixture: PlanFixture): Promise<number[]> {
  const result = await sourceMatches(fixture);
  const matchIds: number[] = [];
  for (const row of result.rows as Array<{ id: number; player1_id: number; player2_id: number }>) {
    matchIds.push(row.id);
    await completeMatch({ matchId: row.id, resultType: "played", score1: 1, score2: 0 });
  }
  return matchIds;
}

async function prepareCompletedSource(sourceFormat: SourceFormat): Promise<{
  fixture: PlanFixture;
  matchIds: number[];
  previewPlayerIds: number[];
}> {
  const fixture = await createPlan(sourceFormat);
  await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.sourceStageId });
  const matchIds = await completeAllSourceMatches(fixture);
  const preview = await completeStage({ tournamentId: fixture.tournamentId, stageId: fixture.sourceStageId });
  return { fixture, matchIds, previewPlayerIds: preview.qualifiers.map((entry) => entry.playerId) };
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  schemaInitialized = true;
  signOrganizerToken = (await import("../src/auth")).signOrganizerToken;
  ({ completeMatch } = await import("../src/application/matches/complete-match"));
  ({ revertMatch, RevertMatchError } = await import("../src/application/matches/revert-match"));
  ({ completeStage, startStage, StageLifecycleError } = await import("../src/application/stages/stage-lifecycle"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  await database.pool.end();
});

describe("Tournament stages lifecycle", () => {
  test("advances Swiss qualifiers to Single Elimination with frozen continuous seeds", async () => {
    const fixture = await createPlan("swiss");
    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.sourceStageId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);
    await completeAllSourceMatches(fixture);

    const previewResponse = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.sourceStageId}/qualification-preview`)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(previewResponse.body.qualifiers.length, 2);
    assert.equal(previewResponse.body.fingerprint.length, 64);

    const completeResponse = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.sourceStageId}/complete`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const result = completeResponse.body as Awaited<ReturnType<typeof completeStage>>;
    const targetParticipants = await database.pool.query(
      "SELECT player_id, stage_seed, qualification_source, source_stage_participant_id FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed",
      [fixture.targetStageId],
    );
    assert.deepEqual(targetParticipants.rows.map((row: any) => row.player_id), result.qualifiers.map((entry) => entry.playerId));
    assert.deepEqual(targetParticipants.rows.map((row: any) => row.stage_seed), [1, 2]);
    assert.ok(targetParticipants.rows.every((row: any) => row.qualification_source === "standings" && row.source_stage_participant_id));

    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const state = await database.pool.query(
      "SELECT t.active_stage_id, s.status, count(m.id)::int AS matches FROM tournaments t JOIN tournament_stages s ON s.id = t.active_stage_id LEFT JOIN matches m ON m.stage_id = s.id WHERE t.id = $1 GROUP BY t.active_stage_id, s.status",
      [fixture.tournamentId],
    );
    assert.deepEqual(state.rows[0], { active_stage_id: fixture.targetStageId, status: "active", matches: 1 });
  });

  test("advances Round Robin qualifiers to Single Elimination", async () => {
    const { fixture, previewPlayerIds } = await prepareCompletedSource("round_robin");
    const target = await database.pool.query(
      "SELECT player_id, stage_seed FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed",
      [fixture.targetStageId],
    );
    assert.deepEqual(target.rows.map((row: any) => row.player_id), previewPlayerIds);
    assert.deepEqual(target.rows.map((row: any) => row.stage_seed), [1, 2]);
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.targetStageId });
    assert.equal((await database.pool.query("SELECT count(*)::int AS count FROM matches WHERE stage_id = $1", [fixture.targetStageId])).rows[0].count, 1);
  });

  test("rejects completion of an incomplete stage", async () => {
    const fixture = await createPlan("swiss");
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.sourceStageId });
    await assert.rejects(
      () => completeStage({ tournamentId: fixture.tournamentId, stageId: fixture.sourceStageId }),
      (error: unknown) => error instanceof StageLifecycleError && error.code === "STAGE_INCOMPLETE",
    );
  });

  test("rolls back CompleteStage after qualification writes", async () => {
    const fixture = await createPlan("swiss");
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.sourceStageId });
    await completeAllSourceMatches(fixture);
    await assert.rejects(
      () => completeStage(
        { tournamentId: fixture.tournamentId, stageId: fixture.sourceStageId },
        { afterStageParticipantsWritten: () => { throw new Error("complete-stage-fault"); } },
      ),
      /complete-stage-fault/,
    );
    const state = await database.pool.query(
      "SELECT t.active_stage_id, s.status, (SELECT count(*) FROM stage_participants WHERE stage_id = $2) AS target_count, (SELECT count(*) FROM stage_participants WHERE stage_id = $1 AND final_rank IS NOT NULL) AS ranked_count FROM tournaments t JOIN tournament_stages s ON s.id = $1 WHERE t.id = $3",
      [fixture.sourceStageId, fixture.targetStageId, fixture.tournamentId],
    );
    assert.deepEqual(state.rows[0], { active_stage_id: fixture.sourceStageId, status: "active", target_count: "0", ranked_count: "0" });
  });

  test("rolls back StartStage after match generation", async () => {
    const { fixture } = await prepareCompletedSource("swiss");
    await assert.rejects(
      () => startStage(
        { tournamentId: fixture.tournamentId, stageId: fixture.targetStageId },
        { afterMatchesWritten: () => { throw new Error("start-stage-fault"); } },
      ),
      /start-stage-fault/,
    );
    const state = await database.pool.query(
      "SELECT t.active_stage_id, s.status, s.started_at, count(m.id)::int AS matches FROM tournaments t JOIN tournament_stages s ON s.id = $1 LEFT JOIN matches m ON m.stage_id = s.id WHERE t.id = $2 GROUP BY t.active_stage_id, s.status, s.started_at",
      [fixture.targetStageId, fixture.tournamentId],
    );
    assert.deepEqual(state.rows[0], { active_stage_id: null, status: "planned", started_at: null, matches: 0 });
  });

  test("returns STAGE_ALREADY_ADVANCED when reverting a previous stage", async () => {
    const { fixture, matchIds } = await prepareCompletedSource("swiss");
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.targetStageId });
    await assert.rejects(
      () => revertMatch({ matchId: matchIds[0] }),
      (error: unknown) => error instanceof RevertMatchError && error.code === "STAGE_ALREADY_ADVANCED",
    );
  });

  test("completing the last stage completes the tournament", async () => {
    const { fixture } = await prepareCompletedSource("swiss");
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.targetStageId });
    const finalMatch = await database.pool.query(
      "SELECT id FROM matches WHERE stage_id = $1 ORDER BY round DESC, match_number LIMIT 1",
      [fixture.targetStageId],
    );
    await completeMatch({ matchId: finalMatch.rows[0].id, resultType: "played", score1: 2, score2: 0 });
    const preview = await completeStage({ tournamentId: fixture.tournamentId, stageId: fixture.targetStageId });
    const state = await database.pool.query(
      "SELECT t.status, t.active_stage_id, t.winner_id, s.status AS stage_status, s.completed_at FROM tournaments t JOIN tournament_stages s ON s.id = $1 WHERE t.id = $2",
      [fixture.targetStageId, fixture.tournamentId],
    );
    assert.equal(state.rows[0].status, "completed");
    assert.equal(state.rows[0].active_stage_id, null);
    assert.equal(state.rows[0].winner_id, preview.ranking[0].playerId);
    assert.equal(state.rows[0].stage_status, "completed");
    assert.ok(state.rows[0].completed_at instanceof Date);
  });
});
