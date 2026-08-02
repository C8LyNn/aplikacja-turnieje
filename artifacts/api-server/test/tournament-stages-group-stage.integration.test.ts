import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";
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
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
  stageGroupsTable: typeof import("@workspace/db").stageGroupsTable;
  stageParticipantsTable: typeof import("@workspace/db").stageParticipantsTable;
  playersTable: typeof import("@workspace/db").playersTable;
}

interface GroupPlanFixture {
  tournamentId: number;
  groupStageId: number;
  playoffStageId: number;
  groupCount: 2 | 4;
  qualifiersPerGroup: 1 | 2;
}

const SESSION_SECRET = `group-stage-${randomUUID()}`;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let completeMatch: typeof import("../src/application/matches/complete-match").completeMatch;
let completeStage: typeof import("../src/application/stages/stage-lifecycle").completeStage;
let getQualificationPreview: typeof import("../src/application/stages/stage-lifecycle").getQualificationPreview;
let startStage: typeof import("../src/application/stages/stage-lifecycle").startStage;

async function createGroupPlan(
  groupCount: 2 | 4,
  qualifiersPerGroup: 1 | 2,
): Promise<GroupPlanFixture> {
  const suffix = randomUUID();
  const groupSize = 3;
  const participantCount = groupCount * groupSize;
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: `Group stage ${groupCount}x${qualifiersPerGroup} ${suffix}`,
    format: "round_robin",
    status: "draft",
    visibility: "public_online",
    defaultBestOf: 1,
  }).returning();
  await database.db.insert(database.playersTable).values(
    Array.from({ length: participantCount }, (_, index) => ({
      tournamentId: tournament.id,
      name: `P${index + 1}-${suffix}`,
      seed: index + 1,
    })),
  );
  const [generatedStage] = await database.db.select().from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));
  const [groupStage] = await database.db.update(database.tournamentStagesTable).set({
    name: "Grupy",
    format: "group_stage",
    participantCount,
    bestOf: 1,
    plannedRounds: null,
    currentRound: null,
    totalRounds: null,
    rankingPolicy: "group_v1",
    qualificationMode: "top_n_per_group",
    advancingCount: null,
    groupCount,
    participantsPerGroup: groupSize,
    qualifiersPerGroup,
    seedingPolicy: "snake_groups",
  }).where(eq(database.tournamentStagesTable.id, generatedStage.id)).returning();
  const [playoffStage] = await database.db.insert(database.tournamentStagesTable).values({
    tournamentId: tournament.id,
    stageKey: "stage-2",
    position: 2,
    name: "Play-off",
    format: "single_elimination",
    status: "planned",
    participantCount: groupCount * qualifiersPerGroup,
    bestOf: 3,
    rankingPolicy: "elimination_bracket_v1",
    qualificationMode: "none",
    seedingPolicy: "cross_group",
  }).returning();
  return {
    tournamentId: tournament.id,
    groupStageId: groupStage.id,
    playoffStageId: playoffStage.id,
    groupCount,
    qualifiersPerGroup,
  };
}

async function completeAllGroupMatches(fixture: GroupPlanFixture): Promise<void> {
  const result = await database.pool.query(
    `SELECT m.id, m.player1_id, m.player2_id, p1.stage_seed AS seed1, p2.stage_seed AS seed2
     FROM matches m
     JOIN stage_participants p1 ON p1.stage_id = m.stage_id AND p1.player_id = m.player1_id
     JOIN stage_participants p2 ON p2.stage_id = m.stage_id AND p2.player_id = m.player2_id
     WHERE m.stage_id = $1
     ORDER BY m.round, m.match_number`,
    [fixture.groupStageId],
  );
  for (const match of result.rows as Array<{
    id: number;
    seed1: number;
    seed2: number;
  }>) {
    await completeMatch({
      matchId: match.id,
      resultType: "played",
      score1: match.seed1 < match.seed2 ? 1 : 0,
      score2: match.seed2 < match.seed1 ? 1 : 0,
    });
  }
}

async function groupAssignments(fixture: GroupPlanFixture): Promise<string[]> {
  const result = await database.pool.query(
    `SELECT group_row.group_key
     FROM stage_participants participant
     JOIN stage_groups group_row ON group_row.id = participant.group_id
     WHERE participant.stage_id = $1
     ORDER BY participant.stage_seed`,
    [fixture.groupStageId],
  );
  return result.rows.map((row: any) => row.group_key);
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  schemaInitialized = true;
  ({ completeMatch } = await import("../src/application/matches/complete-match"));
  ({ completeStage, getQualificationPreview, startStage } = await import("../src/application/stages/stage-lifecycle"));
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  await database.pool.end();
});

describe("group_stage runtime", () => {
  test("assigns two groups with snake seeding", async () => {
    const fixture = await createGroupPlan(2, 1);
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    assert.deepEqual(await groupAssignments(fixture), ["A", "B", "B", "A", "A", "B"]);
  });

  test("assigns four groups with snake seeding", async () => {
    const fixture = await createGroupPlan(4, 1);
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    assert.deepEqual(
      await groupAssignments(fixture),
      ["A", "B", "C", "D", "D", "C", "B", "A", "A", "B", "C", "D"],
    );
  });

  test("keeps Round Robin matches and rankings inside their group and stage", async () => {
    const fixture = await createGroupPlan(2, 2);
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    const integrity = await database.pool.query(
      `SELECT m.stage_id, m.stage_group_id, g.stage_id AS group_stage_id,
              p1.group_id AS player1_group_id, p2.group_id AS player2_group_id
       FROM matches m
       JOIN stage_groups g ON g.id = m.stage_group_id
       JOIN stage_participants p1 ON p1.stage_id = m.stage_id AND p1.player_id = m.player1_id
       JOIN stage_participants p2 ON p2.stage_id = m.stage_id AND p2.player_id = m.player2_id
       WHERE m.stage_id = $1`,
      [fixture.groupStageId],
    );
    assert.equal(integrity.rows.length, 6);
    assert.ok(integrity.rows.every((row: any) =>
      row.stage_id === fixture.groupStageId &&
      row.group_stage_id === fixture.groupStageId &&
      row.stage_group_id === row.player1_group_id &&
      row.stage_group_id === row.player2_group_id));
    await completeAllGroupMatches(fixture);
    const preview = await getQualificationPreview({
      tournamentId: fixture.tournamentId,
      stageId: fixture.groupStageId,
    });
    for (const groupKey of ["A", "B"]) {
      assert.deepEqual(
        preview.ranking.filter((entry) => entry.groupKey === groupKey).map((entry) => entry.groupRank),
        [1, 2, 3],
      );
    }
  });

  for (const variant of [
    { groupCount: 2 as const, qualifiersPerGroup: 1 as const },
    { groupCount: 2 as const, qualifiersPerGroup: 2 as const },
    { groupCount: 4 as const, qualifiersPerGroup: 1 as const },
    { groupCount: 4 as const, qualifiersPerGroup: 2 as const },
  ]) {
    test(`progresses ${variant.groupCount}x${variant.qualifiersPerGroup} to exact cross-seeded play-off slots`, async () => {
      const fixture = await createGroupPlan(variant.groupCount, variant.qualifiersPerGroup);
      await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
      await completeAllGroupMatches(fixture);
      const preview = await completeStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
      assert.equal(preview.qualifiers.length, variant.groupCount * variant.qualifiersPerGroup);
      assert.ok(preview.qualifiers.every((entry) => entry.qualificationSource === "group_position"));
      const targetParticipants = await database.pool.query(
        `SELECT target.stage_seed, target.qualification_source, source.group_rank, source_group.group_key
         FROM stage_participants target
         JOIN stage_participants source ON source.id = target.source_stage_participant_id
         JOIN stage_groups source_group ON source_group.id = source.group_id
         WHERE target.stage_id = $1
         ORDER BY target.stage_seed`,
        [fixture.playoffStageId],
      );
      assert.deepEqual(
        targetParticipants.rows.map((row: any) => row.stage_seed),
        Array.from({ length: variant.groupCount * variant.qualifiersPerGroup }, (_, index) => index + 1),
      );
      assert.ok(targetParticipants.rows.every((row: any) =>
        row.qualification_source === "group_position" && row.group_rank >= 1 && row.group_rank <= 2));

      await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.playoffStageId });
      const firstRound = await database.pool.query(
        `SELECT m.match_number,
                g1.group_key AS player1_group, s1.group_rank AS player1_rank,
                g2.group_key AS player2_group, s2.group_rank AS player2_rank
         FROM matches m
         JOIN stage_participants t1 ON t1.stage_id = m.stage_id AND t1.player_id = m.player1_id
         JOIN stage_participants s1 ON s1.id = t1.source_stage_participant_id
         JOIN stage_groups g1 ON g1.id = s1.group_id
         JOIN stage_participants t2 ON t2.stage_id = m.stage_id AND t2.player_id = m.player2_id
         JOIN stage_participants s2 ON s2.id = t2.source_stage_participant_id
         JOIN stage_groups g2 ON g2.id = s2.group_id
         WHERE m.stage_id = $1 AND m.round = 1
         ORDER BY m.match_number`,
        [fixture.playoffStageId],
      );
      const actual = firstRound.rows.map((row: any) => [
        `${row.player1_group}${row.player1_rank}`,
        `${row.player2_group}${row.player2_rank}`,
      ]);
      const expected: Record<string, string[][]> = {
        "2:1": [["A1", "B1"]],
        "2:2": [["A1", "B2"], ["B1", "A2"]],
        "4:1": [["A1", "B1"], ["C1", "D1"]],
        "4:2": [["A1", "B2"], ["C1", "D2"], ["B1", "A2"], ["D1", "C2"]],
      };
      assert.deepEqual(actual, expected[`${variant.groupCount}:${variant.qualifiersPerGroup}`]);
      assert.ok(firstRound.rows.every((row: any) => row.player1_group !== row.player2_group));
    });
  }

  test("rolls back groups, assignments and matches when group generation fails", async () => {
    const fixture = await createGroupPlan(2, 1);
    await assert.rejects(
      () => startStage(
        { tournamentId: fixture.tournamentId, stageId: fixture.groupStageId },
        { afterGroupsWritten: () => { throw new Error("group-generation-fault"); } },
      ),
      /group-generation-fault/,
    );
    const state = await database.pool.query(
      `SELECT t.active_stage_id, s.status,
              (SELECT count(*) FROM stage_groups WHERE stage_id = $1) AS groups,
              (SELECT count(*) FROM matches WHERE stage_id = $1) AS matches,
              (SELECT count(*) FROM stage_participants WHERE stage_id = $1 AND group_id IS NOT NULL) AS assigned
       FROM tournaments t JOIN tournament_stages s ON s.id = $1 WHERE t.id = $2`,
      [fixture.groupStageId, fixture.tournamentId],
    );
    assert.deepEqual(state.rows[0], {
      active_stage_id: null,
      status: "planned",
      groups: "0",
      matches: "0",
      assigned: "0",
    });
  });

  test("rolls back group rankings and play-off participants when progression fails", async () => {
    const fixture = await createGroupPlan(4, 2);
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    await completeAllGroupMatches(fixture);
    await assert.rejects(
      () => completeStage(
        { tournamentId: fixture.tournamentId, stageId: fixture.groupStageId },
        { afterStageParticipantsWritten: () => { throw new Error("group-progression-fault"); } },
      ),
      /group-progression-fault/,
    );
    const state = await database.pool.query(
      `SELECT t.active_stage_id, s.status,
              (SELECT count(*) FROM stage_participants WHERE stage_id = $2) AS target_participants,
              (SELECT count(*) FROM stage_participants WHERE stage_id = $1 AND group_rank IS NOT NULL) AS ranked
       FROM tournaments t JOIN tournament_stages s ON s.id = $1 WHERE t.id = $3`,
      [fixture.groupStageId, fixture.playoffStageId, fixture.tournamentId],
    );
    assert.deepEqual(state.rows[0], {
      active_stage_id: fixture.groupStageId,
      status: "active",
      target_participants: "0",
      ranked: "0",
    });
  });
});
