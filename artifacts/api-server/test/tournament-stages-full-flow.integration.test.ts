import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

interface MatchToPlay {
  id: number;
  best_of: number;
  seed1: number;
  seed2: number;
}

const SESSION_SECRET = `stages-full-flow-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;

async function rows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

async function addSeededPlayers(
  tournamentId: number,
  headers: Record<string, string>,
): Promise<void> {
  for (let seed = 1; seed <= 16; seed += 1) {
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set(headers)
      .send({ name: `Player ${seed}-${randomUUID()}`, seed })
      .expect(201);
  }
}

async function playPendingMatches(
  tournamentId: number,
  stageId: number,
  headers: Record<string, string>,
  round?: number,
): Promise<number> {
  const matches = await rows<MatchToPlay>(
    `SELECT match_row.id, match_row.best_of,
            player1.stage_seed AS seed1, player2.stage_seed AS seed2
     FROM matches match_row
     JOIN stage_participants player1
       ON player1.stage_id = match_row.stage_id AND player1.player_id = match_row.player1_id
     JOIN stage_participants player2
       ON player2.stage_id = match_row.stage_id AND player2.player_id = match_row.player2_id
     WHERE match_row.tournament_id = $1
       AND match_row.stage_id = $2
       AND match_row.status = 'pending'
       AND ($3::integer IS NULL OR match_row.round = $3)
     ORDER BY match_row.round, match_row.match_number`,
    [tournamentId, stageId, round ?? null],
  );
  for (const match of matches) {
    const gamesToWin = Math.floor(match.best_of / 2) + 1;
    await request(app)
      .post(`/api/matches/${match.id}/complete`)
      .set(headers)
      .send({
        resultType: "played",
        score1: match.seed1 < match.seed2 ? gamesToWin : 0,
        score2: match.seed2 < match.seed1 ? gamesToWin : 0,
      })
      .expect(200);
  }
  return matches.length;
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  ({ signOrganizerToken } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

test("completes Swiss 16 -> Group Stage 8 -> Single Elimination 4 without mixing stage data", async () => {
  const created = await request(app)
    .post("/api/tournaments")
    .send({
      name: `Full stages flow ${randomUUID()}`,
      format: "swiss",
      defaultBestOf: 1,
      stagePlan: {
        initialParticipantCount: 16,
        stages: [
          {
            key: "swiss",
            position: 1,
            name: "Swiss",
            format: "swiss",
            participantCount: 16,
            bestOf: 1,
            rounds: 4,
            advancingCount: 8,
          },
          {
            key: "groups",
            position: 2,
            name: "Group Stage",
            format: "group_stage",
            participantCount: 8,
            bestOf: 3,
            groupCount: 2,
            participantsPerGroup: 4,
            qualifiersPerGroup: 2,
            seedingMethod: "snake",
          },
          {
            key: "playoff",
            position: 3,
            name: "Play-off",
            format: "single_elimination",
            participantCount: 4,
            bestOf: 5,
          },
        ],
      },
    })
    .expect(201);
  const tournamentId = created.body.id as number;
  const headers = { "x-organizer-token": signOrganizerToken(tournamentId) };
  await addSeededPlayers(tournamentId, headers);

  const stages = await rows<{ id: number; position: number }>(
    "SELECT id, position FROM tournament_stages WHERE tournament_id = $1 ORDER BY position",
    [tournamentId],
  );
  assert.equal(stages.length, 3);
  const [swissStage, groupStage, playoffStage] = stages;

  await request(app)
    .post(`/api/tournaments/${tournamentId}/start`)
    .set(headers)
    .expect(200);
  const [initialState] = await rows<{
    tournament_status: string;
    active_stage_id: number;
    stage_statuses: string[];
  }>(
    `SELECT tournament.status AS tournament_status,
            tournament.active_stage_id,
            array_agg(stage.status::text ORDER BY stage.position) AS stage_statuses
     FROM tournaments tournament
     JOIN tournament_stages stage ON stage.tournament_id = tournament.id
     WHERE tournament.id = $1
     GROUP BY tournament.status, tournament.active_stage_id`,
    [tournamentId],
  );
  assert.deepEqual(initialState, {
    tournament_status: "active",
    active_stage_id: swissStage.id,
    stage_statuses: ["active", "planned", "planned"],
  });
  assert.equal(
    (await rows<{ count: number }>(
      "SELECT count(*)::int AS count FROM matches WHERE stage_id = $1 AND round = 1",
      [swissStage.id],
    ))[0].count,
    8,
  );

  for (let round = 1; round <= 4; round += 1) {
    assert.equal(await playPendingMatches(tournamentId, swissStage.id, headers, round), 8);
    if (round < 4) {
      await request(app)
        .post(`/api/tournaments/${tournamentId}/generate-round`)
        .set(headers)
        .expect(200);
    }
  }
  const swissCompletion = await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${swissStage.id}/complete`)
    .set(headers)
    .expect(200);
  assert.equal(swissCompletion.body.ranking.length, 16);
  assert.equal(swissCompletion.body.qualifiers.length, 8);
  const frozenSwiss = await rows<{
    ranked: number;
    qualified: number;
  }>(
    `SELECT count(*) FILTER (WHERE final_rank IS NOT NULL)::int AS ranked,
            count(*) FILTER (WHERE status = 'qualified')::int AS qualified
     FROM stage_participants WHERE stage_id = $1`,
    [swissStage.id],
  );
  assert.deepEqual(frozenSwiss[0], { ranked: 16, qualified: 8 });
  assert.deepEqual(
    (await rows<{ stage_seed: number }>(
      "SELECT stage_seed FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed",
      [groupStage.id],
    )).map((participant) => participant.stage_seed),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );

  await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${groupStage.id}/start`)
    .set(headers)
    .expect(200);
  const groups = await rows<{ id: number; group_key: string; participant_count: number }>(
    "SELECT id, group_key, participant_count FROM stage_groups WHERE stage_id = $1 ORDER BY position",
    [groupStage.id],
  );
  assert.deepEqual(
    groups.map(({ group_key, participant_count }) => ({ group_key, participant_count })),
    [
      { group_key: "A", participant_count: 4 },
      { group_key: "B", participant_count: 4 },
    ],
  );
  const snakeAssignments = await rows<{ group_key: string }>(
    `SELECT group_row.group_key
     FROM stage_participants participant
     JOIN stage_groups group_row ON group_row.id = participant.group_id
     WHERE participant.stage_id = $1
     ORDER BY participant.stage_seed`,
    [groupStage.id],
  );
  assert.deepEqual(
    snakeAssignments.map((assignment) => assignment.group_key),
    ["A", "B", "B", "A", "A", "B", "B", "A"],
  );
  const groupMatchIntegrity = await rows<{
    stage_id: number;
    stage_group_id: number;
    group_stage_id: number;
    player1_group_id: number;
    player2_group_id: number;
  }>(
    `SELECT match_row.stage_id, match_row.stage_group_id,
            group_row.stage_id AS group_stage_id,
            player1.group_id AS player1_group_id,
            player2.group_id AS player2_group_id
     FROM matches match_row
     JOIN stage_groups group_row ON group_row.id = match_row.stage_group_id
     JOIN stage_participants player1
       ON player1.stage_id = match_row.stage_id AND player1.player_id = match_row.player1_id
     JOIN stage_participants player2
       ON player2.stage_id = match_row.stage_id AND player2.player_id = match_row.player2_id
     WHERE match_row.stage_id = $1`,
    [groupStage.id],
  );
  assert.equal(groupMatchIntegrity.length, 12);
  assert.ok(groupMatchIntegrity.every((match) =>
    match.stage_id === groupStage.id &&
    match.group_stage_id === groupStage.id &&
    match.stage_group_id === match.player1_group_id &&
    match.stage_group_id === match.player2_group_id));

  assert.equal(await playPendingMatches(tournamentId, groupStage.id, headers), 12);
  const groupCompletion = await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${groupStage.id}/complete`)
    .set(headers)
    .expect(200);
  assert.equal(groupCompletion.body.qualifiers.length, 4);
  for (const groupKey of ["A", "B"]) {
    assert.deepEqual(
      groupCompletion.body.ranking
        .filter((entry: { groupKey: string }) => entry.groupKey === groupKey)
        .map((entry: { groupRank: number }) => entry.groupRank),
      [1, 2, 3, 4],
    );
    assert.equal(
      groupCompletion.body.qualifiers.filter(
        (entry: { groupKey: string }) => entry.groupKey === groupKey,
      ).length,
      2,
    );
  }
  const playoffSources = await rows<{
    stage_seed: number;
    qualification_source: string;
    group_key: string;
    group_rank: number;
  }>(
    `SELECT target.stage_seed, target.qualification_source,
            source_group.group_key, source.group_rank
     FROM stage_participants target
     JOIN stage_participants source ON source.id = target.source_stage_participant_id
     JOIN stage_groups source_group ON source_group.id = source.group_id
     WHERE target.stage_id = $1
     ORDER BY target.stage_seed`,
    [playoffStage.id],
  );
  assert.equal(playoffSources.length, 4);
  assert.ok(playoffSources.every((source) =>
    source.qualification_source === "group_position" &&
    (source.group_key === "A" || source.group_key === "B") &&
    (source.group_rank === 1 || source.group_rank === 2)));

  await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${playoffStage.id}/start`)
    .set(headers)
    .expect(200);
  const semifinalSources = await rows<{
    match_number: number;
    player1_group: string;
    player1_rank: number;
    player2_group: string;
    player2_rank: number;
    player1_seed: number;
    player2_seed: number;
  }>(
    `SELECT match_row.match_number,
            group1.group_key AS player1_group, source1.group_rank AS player1_rank,
            group2.group_key AS player2_group, source2.group_rank AS player2_rank,
            target1.stage_seed AS player1_seed, target2.stage_seed AS player2_seed
     FROM matches match_row
     JOIN stage_participants target1
       ON target1.stage_id = match_row.stage_id AND target1.player_id = match_row.player1_id
     JOIN stage_participants source1 ON source1.id = target1.source_stage_participant_id
     JOIN stage_groups group1 ON group1.id = source1.group_id
     JOIN stage_participants target2
       ON target2.stage_id = match_row.stage_id AND target2.player_id = match_row.player2_id
     JOIN stage_participants source2 ON source2.id = target2.source_stage_participant_id
     JOIN stage_groups group2 ON group2.id = source2.group_id
     WHERE match_row.stage_id = $1 AND match_row.round = 1
     ORDER BY match_row.match_number`,
    [playoffStage.id],
  );
  assert.deepEqual(
    semifinalSources.map((match) => [match.player1_seed, match.player2_seed]),
    [[1, 4], [2, 3]],
  );
  assert.ok(semifinalSources.every(
    (match) => match.player1_rank + match.player2_rank === 3,
  ));

  assert.equal(await playPendingMatches(tournamentId, playoffStage.id, headers, 1), 2);
  assert.equal(await playPendingMatches(tournamentId, playoffStage.id, headers, 2), 1);
  const finalCompletion = await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${playoffStage.id}/complete`)
    .set(headers)
    .expect(200);
  assert.equal(finalCompletion.body.ranking.length, 4);

  const [finalState] = await rows<{
    status: string;
    active_stage_id: number | null;
    winner_id: number;
    stage_statuses: string[];
    winner_count: number;
  }>(
    `SELECT tournament.status, tournament.active_stage_id, tournament.winner_id,
            array_agg(stage.status::text ORDER BY stage.position) AS stage_statuses,
            (SELECT count(*)::int FROM players
             WHERE tournament_id = tournament.id AND status = 'winner') AS winner_count
     FROM tournaments tournament
     JOIN tournament_stages stage ON stage.tournament_id = tournament.id
     WHERE tournament.id = $1
     GROUP BY tournament.id`,
    [tournamentId],
  );
  assert.deepEqual(finalState, {
    status: "completed",
    active_stage_id: null,
    winner_id: finalCompletion.body.ranking[0].playerId,
    stage_statuses: ["completed", "completed", "completed"],
    winner_count: 1,
  });
  const [isolation] = await rows<{
    total_matches: number;
    unique_slots: number;
    mixed_rows: number;
    swiss_matches: number;
    group_matches: number;
    playoff_matches: number;
  }>(
    `SELECT count(*)::int AS total_matches,
            count(DISTINCT (match_row.stage_id, match_row.round, match_row.match_number))::int AS unique_slots,
            count(*) FILTER (WHERE stage.tournament_id <> match_row.tournament_id)::int AS mixed_rows,
            count(*) FILTER (WHERE match_row.stage_id = $2)::int AS swiss_matches,
            count(*) FILTER (WHERE match_row.stage_id = $3)::int AS group_matches,
            count(*) FILTER (WHERE match_row.stage_id = $4)::int AS playoff_matches
     FROM matches match_row
     JOIN tournament_stages stage ON stage.id = match_row.stage_id
     WHERE match_row.tournament_id = $1`,
    [tournamentId, swissStage.id, groupStage.id, playoffStage.id],
  );
  assert.deepEqual(isolation, {
    total_matches: 47,
    unique_slots: 47,
    mixed_rows: 0,
    swiss_matches: 32,
    group_matches: 12,
    playoff_matches: 3,
  });
  assert.equal(
    (await rows<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM matches match_row
       LEFT JOIN stage_groups group_row ON group_row.id = match_row.stage_group_id
       WHERE match_row.tournament_id = $1
         AND ((match_row.stage_id = $2 AND (match_row.stage_group_id IS NULL OR group_row.stage_id <> $2))
           OR (match_row.stage_id <> $2 AND match_row.stage_group_id IS NOT NULL))`,
      [tournamentId, groupStage.id],
    ))[0].count,
    0,
  );
});
