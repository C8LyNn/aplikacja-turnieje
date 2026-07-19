import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import {
  calculateBalancedGroupSizes,
  calculateGroupAdvancingCount,
} from "../src/domain/tournament/group-stage";
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
  targetStageId: number;
  participantCount: number;
  groupCount: number;
  qualifiersPerGroup: number;
  targetParticipantCount: number;
  targetFormat: "single_elimination" | "round_robin";
}

interface GroupPlanOptions {
  groupCount: number;
  qualifiersPerGroup: number;
  participantCount?: number;
  targetFormat?: GroupPlanFixture["targetFormat"];
}

const SESSION_SECRET = `group-stage-${randomUUID()}`;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let completeMatch: typeof import("../src/application/matches/complete-match").completeMatch;
let completeStage: typeof import("../src/application/stages/stage-lifecycle").completeStage;
let getQualificationPreview: typeof import("../src/application/stages/stage-lifecycle").getQualificationPreview;
let startStage: typeof import("../src/application/stages/stage-lifecycle").startStage;

async function createGroupPlan({
  groupCount,
  qualifiersPerGroup,
  participantCount = groupCount * 3,
  targetFormat = "single_elimination",
}: GroupPlanOptions): Promise<GroupPlanFixture> {
  const suffix = randomUUID();
  const groupSizes = calculateBalancedGroupSizes(participantCount, groupCount);
  const targetParticipantCount = calculateGroupAdvancingCount(
    participantCount,
    groupCount,
    qualifiersPerGroup,
  );
  const [tournament] = await database.db.insert(database.tournamentsTable).values({
    name: `Group stage ${participantCount}/${groupCount}/${qualifiersPerGroup} ${suffix}`,
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
    participantsPerGroup: Math.max(...groupSizes),
    qualifiersPerGroup,
    seedingPolicy: "snake_groups",
  }).where(eq(database.tournamentStagesTable.id, generatedStage.id)).returning();
  const [targetStage] = await database.db.insert(database.tournamentStagesTable).values({
    tournamentId: tournament.id,
    stageKey: "stage-2",
    position: 2,
    name: targetFormat === "single_elimination" ? "Play-off" : "Liga finałowa",
    format: targetFormat,
    status: "planned",
    participantCount: targetParticipantCount,
    bestOf: targetFormat === "single_elimination" ? 3 : 1,
    rankingPolicy:
      targetFormat === "single_elimination"
        ? "elimination_bracket_v1"
        : "round_robin_v1",
    qualificationMode: "none",
    seedingPolicy: "standings_order",
  }).returning();
  return {
    tournamentId: tournament.id,
    groupStageId: groupStage.id,
    targetStageId: targetStage.id,
    participantCount,
    groupCount,
    qualifiersPerGroup,
    targetParticipantCount,
    targetFormat,
  };
}

async function completeAllGroupMatches(fixture: GroupPlanFixture): Promise<void> {
  const result = await database.pool.query(
    `SELECT m.id, p1.stage_seed AS seed1, p2.stage_seed AS seed2
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
    const fixture = await createGroupPlan({ groupCount: 2, qualifiersPerGroup: 1 });
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    assert.deepEqual(await groupAssignments(fixture), ["A", "B", "B", "A", "A", "B"]);
  });

  test("creates arbitrary uneven groups and fills the larger groups first", async () => {
    const fixture = await createGroupPlan({
      participantCount: 17,
      groupCount: 4,
      qualifiersPerGroup: 5,
    });
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });

    assert.deepEqual(
      await groupAssignments(fixture),
      ["A", "B", "C", "D", "D", "C", "B", "A", "A", "B", "C", "D", "D", "C", "B", "A", "A"],
    );
    const groups = await database.pool.query(
      `SELECT group_key, participant_count, qualifiers_count
       FROM stage_groups WHERE stage_id = $1 ORDER BY position`,
      [fixture.groupStageId],
    );
    assert.deepEqual(groups.rows, [
      { group_key: "A", participant_count: 5, qualifiers_count: 5 },
      { group_key: "B", participant_count: 4, qualifiers_count: 4 },
      { group_key: "C", participant_count: 4, qualifiers_count: 4 },
      { group_key: "D", participant_count: 4, qualifiers_count: 4 },
    ]);
  });

  test("generates the exact Round Robin schedule for every uneven group", async () => {
    const fixture = await createGroupPlan({
      participantCount: 17,
      groupCount: 4,
      qualifiersPerGroup: 4,
    });
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    const integrity = await database.pool.query(
      `SELECT g.group_key, g.participant_count, count(m.id)::int AS match_count,
              bool_and(m.stage_group_id = p1.group_id AND m.stage_group_id = p2.group_id) AS same_group
       FROM stage_groups g
       LEFT JOIN matches m ON m.stage_group_id = g.id
       LEFT JOIN stage_participants p1 ON p1.stage_id = m.stage_id AND p1.player_id = m.player1_id
       LEFT JOIN stage_participants p2 ON p2.stage_id = m.stage_id AND p2.player_id = m.player2_id
       WHERE g.stage_id = $1
       GROUP BY g.id, g.group_key, g.participant_count
       ORDER BY g.position`,
      [fixture.groupStageId],
    );
    assert.deepEqual(
      integrity.rows.map((row: any) => ({
        key: row.group_key,
        players: row.participant_count,
        matches: row.match_count,
        sameGroup: row.same_group,
      })),
      [
        { key: "A", players: 5, matches: 10, sameGroup: true },
        { key: "B", players: 4, matches: 6, sameGroup: true },
        { key: "C", players: 4, matches: 6, sameGroup: true },
        { key: "D", players: 4, matches: 6, sameGroup: true },
      ],
    );
  });

  test("keeps rankings inside their own group", async () => {
    const fixture = await createGroupPlan({ groupCount: 2, qualifiersPerGroup: 2 });
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
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
    { groupCount: 2, qualifiersPerGroup: 1 },
    { groupCount: 2, qualifiersPerGroup: 2 },
    { groupCount: 4, qualifiersPerGroup: 1 },
    { groupCount: 4, qualifiersPerGroup: 2 },
  ]) {
    test(`reseeds ${variant.groupCount}x${variant.qualifiersPerGroup} in rank bands and places strongest against weakest`, async () => {
      const fixture = await createGroupPlan(variant);
      await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
      await completeAllGroupMatches(fixture);
      const preview = await completeStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
      assert.equal(preview.qualifiers.length, fixture.targetParticipantCount);
      assert.ok(preview.qualifiers.every((entry) => entry.qualificationSource === "group_position"));

      const targetParticipants = await database.pool.query(
        `SELECT target.stage_seed, target.qualification_source, source.group_rank, source_group.group_key
         FROM stage_participants target
         JOIN stage_participants source ON source.id = target.source_stage_participant_id
         JOIN stage_groups source_group ON source_group.id = source.group_id
         WHERE target.stage_id = $1
         ORDER BY target.stage_seed`,
        [fixture.targetStageId],
      );
      assert.deepEqual(
        targetParticipants.rows.map((row: any) => row.stage_seed),
        Array.from({ length: fixture.targetParticipantCount }, (_, index) => index + 1),
      );
      assert.deepEqual(
        [...targetParticipants.rows.map((row: any) => row.group_rank)],
        [...targetParticipants.rows.map((row: any) => row.group_rank)].sort((a, b) => a - b),
      );
      assert.ok(targetParticipants.rows.every((row: any) =>
        row.qualification_source === "group_position" &&
        row.group_rank >= 1 &&
        row.group_rank <= variant.qualifiersPerGroup));

      await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.targetStageId });
      const firstRound = await database.pool.query(
        `SELECT p1.stage_seed AS seed1, p2.stage_seed AS seed2
         FROM matches m
         JOIN stage_participants p1 ON p1.stage_id = m.stage_id AND p1.player_id = m.player1_id
         JOIN stage_participants p2 ON p2.stage_id = m.stage_id AND p2.player_id = m.player2_id
         WHERE m.stage_id = $1 AND m.round = 1 AND m.player2_id IS NOT NULL
         ORDER BY m.match_number`,
        [fixture.targetStageId],
      );
      assert.ok(firstRound.rows.every((row: any) =>
        row.seed1 + row.seed2 === fixture.targetParticipantCount + 1));
    });
  }

  test("allows all players to advance and uses the group stage only for reseeding", async () => {
    const fixture = await createGroupPlan({
      participantCount: 17,
      groupCount: 4,
      qualifiersPerGroup: 5,
    });
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    await completeAllGroupMatches(fixture);
    const preview = await completeStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    assert.equal(preview.qualifiers.length, 17);
    const groupRanks = preview.qualifiers.map((entry) => entry.groupRank);
    assert.ok(groupRanks.every((rank) => typeof rank === "number"));
    const numericGroupRanks = groupRanks.filter(
      (rank): rank is number => typeof rank === "number",
    );
    assert.deepEqual(
      numericGroupRanks,
      [...numericGroupRanks].sort((a, b) => a - b),
    );

    const source = await database.pool.query(
      `SELECT status, next_stage_seed FROM stage_participants
       WHERE stage_id = $1 ORDER BY next_stage_seed`,
      [fixture.groupStageId],
    );
    assert.equal(source.rows.length, 17);
    assert.ok(source.rows.every((row: any) => row.status === "qualified"));
    assert.deepEqual(
      source.rows.map((row: any) => row.next_stage_seed),
      Array.from({ length: 17 }, (_, index) => index + 1),
    );

    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.targetStageId });
    const bracket = await database.pool.query(
      `SELECT status, result_type FROM matches
       WHERE stage_id = $1 AND round = 1`,
      [fixture.targetStageId],
    );
    assert.equal(bracket.rows.length, 16);
    assert.equal(bracket.rows.filter((row: any) => row.result_type === "bye").length, 15);
    assert.equal(bracket.rows.filter((row: any) => row.status === "pending").length, 1);
  });

  test("can pass rank-band seeds into a non-elimination next stage", async () => {
    const fixture = await createGroupPlan({
      participantCount: 8,
      groupCount: 3,
      qualifiersPerGroup: 2,
      targetFormat: "round_robin",
    });
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    await completeAllGroupMatches(fixture);
    await completeStage({ tournamentId: fixture.tournamentId, stageId: fixture.groupStageId });
    await startStage({ tournamentId: fixture.tournamentId, stageId: fixture.targetStageId });

    const matches = await database.pool.query(
      `SELECT count(*)::int AS count FROM matches WHERE stage_id = $1`,
      [fixture.targetStageId],
    );
    assert.equal(matches.rows[0].count, 15);
  });

  test("rolls back groups, assignments and matches when group generation fails", async () => {
    const fixture = await createGroupPlan({ groupCount: 2, qualifiersPerGroup: 1 });
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

  test("rolls back group rankings and target participants when progression fails", async () => {
    const fixture = await createGroupPlan({ groupCount: 4, qualifiersPerGroup: 2 });
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
      [fixture.groupStageId, fixture.targetStageId, fixture.tournamentId],
    );
    assert.deepEqual(state.rows[0], {
      active_stage_id: fixture.groupStageId,
      status: "active",
      target_participants: "0",
      ranked: "0",
    });
  });
});
