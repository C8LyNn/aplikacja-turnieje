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
    seedingPolicy: "standard_bracket",
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

  test("persists, resumes and applies a sequential random seeding ceremony through the API", async () => {
    const { fixture } = await prepareCompletedSource("swiss");
    await database.db.update(database.tournamentStagesTable).set({
      entrySeedingPolicy: "random",
      randomSeed: "integration-ceremony",
      randomRevealOrder: "sequential",
    }).where(eq(database.tournamentStagesTable.id, fixture.targetStageId));
    const ceremonyUrl = `/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/seeding-ceremony`;

    const startWithoutCeremony = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/start`)
      .set(fixture.organizerHeaders)
      .expect(409);
    assert.equal(startWithoutCeremony.body.code, "SEEDING_CEREMONY_REQUIRED");

    await request(app).post(`${ceremonyUrl}/prepare`).expect(403);
    const preparedResponse = await request(app)
      .post(`${ceremonyUrl}/prepare`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const prepared = preparedResponse.body.ceremony as {
      status: string;
      revealedCount: number;
      draws: Array<{ playerId: number; seed: number }>;
    };
    assert.equal(prepared.status, "prepared");
    assert.equal(prepared.revealedCount, 0);
    assert.equal(prepared.draws.length, 2);

    const repeatedPrepare = await request(app)
      .post(`${ceremonyUrl}/prepare`)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(repeatedPrepare.body.ceremony.preparedAt, preparedResponse.body.ceremony.preparedAt);
    assert.deepEqual(repeatedPrepare.body.ceremony.draws, prepared.draws);
    await request(app).post(`${ceremonyUrl}/reveal-next`).expect(403);
    await request(app).post(`${ceremonyUrl}/reveal-all`).expect(403);
    await request(app).delete(ceremonyUrl).expect(403);

    const persistedPrepared = await request(app)
      .get(ceremonyUrl)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(persistedPrepared.body.ceremony.status, "prepared");

    await request(app)
      .post(`${ceremonyUrl}/reveal-next`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const resumedPartial = await request(app)
      .get(ceremonyUrl)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(resumedPartial.body.ceremony.status, "in_progress");
    assert.equal(resumedPartial.body.ceremony.revealedCount, 1);

    await request(app)
      .delete(ceremonyUrl)
      .set(fixture.organizerHeaders)
      .expect(204);
    const afterReset = await request(app)
      .get(ceremonyUrl)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(afterReset.body.ceremony, null);

    await request(app)
      .post(`${ceremonyUrl}/prepare`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const afterOneResponse = await request(app)
      .post(`${ceremonyUrl}/reveal-next`)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(afterOneResponse.body.ceremony.status, "in_progress");
    assert.equal(afterOneResponse.body.ceremony.revealedCount, 1);

    const incompleteStart = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/start`)
      .set(fixture.organizerHeaders)
      .expect(409);
    assert.equal(incompleteStart.body.code, "SEEDING_CEREMONY_INCOMPLETE");

    const completedResponse = await request(app)
      .post(`${ceremonyUrl}/reveal-all`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const completed = completedResponse.body.ceremony as {
      status: string;
      revealedCount: number;
      draws: Array<{ playerId: number; seed: number }>;
    };
    assert.equal(completed.status, "completed");
    assert.equal(completed.revealedCount, 2);

    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);

    const rows = await database.pool.query(
      "SELECT player_id, stage_seed FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed",
      [fixture.targetStageId],
    );
    const expectedBySeed = [...completed.draws].sort((left, right) => left.seed - right.seed);
    assert.deepEqual(rows.rows.map((row: any) => Number(row.player_id)), expectedBySeed.map((draw) => draw.playerId));
    const stageState = await database.pool.query(
      "SELECT status, seeding_audit->>'status' AS ceremony_status, seeding_audit->>'appliedAt' AS applied_at FROM tournament_stages WHERE id = $1",
      [fixture.targetStageId],
    );
    assert.equal(stageState.rows[0].status, "active");
    assert.equal(stageState.rows[0].ceremony_status, "applied");
    assert.ok(stageState.rows[0].applied_at);

    const readOnlyApplied = await request(app)
      .get(ceremonyUrl)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(readOnlyApplied.body.ceremony.status, "applied");
    await request(app).post(`${ceremonyUrl}/prepare`).set(fixture.organizerHeaders).expect(409);
    await request(app).post(`${ceremonyUrl}/reveal-next`).set(fixture.organizerHeaders).expect(409);
    await request(app).post(`${ceremonyUrl}/reveal-all`).set(fixture.organizerHeaders).expect(409);
    await request(app).delete(ceremonyUrl).set(fixture.organizerHeaders).expect(409);
  });

  test("serializes concurrent reveal-next requests without duplicate draws or lost updates", async () => {
    const { fixture } = await prepareCompletedSource("swiss");
    await database.db.update(database.tournamentStagesTable).set({
      entrySeedingPolicy: "random",
      randomSeed: "concurrent-ceremony",
      randomRevealOrder: "sequential",
    }).where(eq(database.tournamentStagesTable.id, fixture.targetStageId));
    const ceremonyUrl = `/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/seeding-ceremony`;
    await request(app).post(`${ceremonyUrl}/prepare`).set(fixture.organizerHeaders).expect(200);

    const responses = await Promise.all([
      request(app).post(`${ceremonyUrl}/reveal-next`).set(fixture.organizerHeaders).expect(200),
      request(app).post(`${ceremonyUrl}/reveal-next`).set(fixture.organizerHeaders).expect(200),
    ]);
    assert.deepEqual(
      responses.map((response) => response.body.ceremony.revealedCount).sort((left, right) => left - right),
      [1, 2],
    );
    const finalState = await request(app).get(ceremonyUrl).set(fixture.organizerHeaders).expect(200);
    assert.equal(finalState.body.ceremony.status, "completed");
    assert.equal(finalState.body.ceremony.revealedCount, 2);
  });

  test("rejects a stale ceremony and safely prepares it again", async () => {
    const { fixture } = await prepareCompletedSource("swiss");
    await database.db.update(database.tournamentStagesTable).set({
      entrySeedingPolicy: "random",
      randomSeed: "stale-ceremony",
      randomRevealOrder: "sequential",
    }).where(eq(database.tournamentStagesTable.id, fixture.targetStageId));
    const ceremonyUrl = `/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/seeding-ceremony`;
    const prepared = await request(app).post(`${ceremonyUrl}/prepare`).set(fixture.organizerHeaders).expect(200);
    const membership = await database.pool.query(
      "SELECT player_id FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed LIMIT 1",
      [fixture.targetStageId],
    );
    await database.db.update(database.playersTable).set({ name: `Changed-${randomUUID()}` })
      .where(eq(database.playersTable.id, Number(membership.rows[0].player_id)));

    const staleReveal = await request(app)
      .post(`${ceremonyUrl}/reveal-next`)
      .set(fixture.organizerHeaders)
      .expect(409);
    assert.equal(staleReveal.body.code, "SEEDING_CEREMONY_STALE");
    const preparedAgain = await request(app)
      .post(`${ceremonyUrl}/prepare`)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.notEqual(preparedAgain.body.ceremony.participantSignature, prepared.body.ceremony.participantSignature);
    assert.equal(preparedAgain.body.ceremony.status, "prepared");
  });

  test("starts an instant random stage without a manual ceremony and persists applied audit", async () => {
    const { fixture } = await prepareCompletedSource("swiss");
    await database.db.update(database.tournamentStagesTable).set({
      entrySeedingPolicy: "random",
      randomSeed: "instant-ceremony",
      randomRevealOrder: "instant",
    }).where(eq(database.tournamentStagesTable.id, fixture.targetStageId));

    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const stage = await database.pool.query(
      "SELECT status, seeding_audit->>'status' AS ceremony_status, seeding_audit->>'revealedCount' AS revealed_count FROM tournament_stages WHERE id = $1",
      [fixture.targetStageId],
    );
    assert.deepEqual(stage.rows[0], {
      status: "active",
      ceremony_status: "applied",
      revealed_count: "2",
    });
  });

  test("rejects a persisted placement that no longer matches the deterministic generator", async () => {
    const { fixture } = await prepareCompletedSource("swiss");
    await database.db.update(database.tournamentStagesTable).set({
      entrySeedingPolicy: "random",
      randomSeed: "placement-integrity",
      randomRevealOrder: "sequential",
    }).where(eq(database.tournamentStagesTable.id, fixture.targetStageId));
    const ceremonyUrl = `/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/seeding-ceremony`;
    const completed = await request(app)
      .post(`${ceremonyUrl}/prepare`)
      .set(fixture.organizerHeaders)
      .expect(200)
      .then(() => request(app).post(`${ceremonyUrl}/reveal-all`).set(fixture.organizerHeaders).expect(200));
    const tampered = structuredClone(completed.body.ceremony);
    const firstPlacement = tampered.draws[0].placement;
    tampered.draws[0].placement = tampered.draws[1].placement;
    tampered.draws[1].placement = firstPlacement;
    await database.db.update(database.tournamentStagesTable).set({ seedingAudit: tampered })
      .where(eq(database.tournamentStagesTable.id, fixture.targetStageId));

    const response = await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/stages/${fixture.targetStageId}/start`)
      .set(fixture.organizerHeaders)
      .expect(409);
    assert.equal(response.body.code, "SEEDING_CEREMONY_STALE");
  });

  test("does not allow a stage id from a different tournament", async () => {
    const first = (await prepareCompletedSource("swiss")).fixture;
    const second = (await prepareCompletedSource("swiss")).fixture;
    const mismatchedUrl = `/api/tournaments/${first.tournamentId}/stages/${second.targetStageId}/seeding-ceremony`;

    await request(app).get(mismatchedUrl).set(first.organizerHeaders).expect(404);
    await request(app).post(`${mismatchedUrl}/prepare`).set(first.organizerHeaders).expect(404);
    const untouched = await database.pool.query(
      "SELECT seeding_audit FROM tournament_stages WHERE id = $1",
      [second.targetStageId],
    );
    assert.equal(untouched.rows[0].seeding_audit, null);
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
