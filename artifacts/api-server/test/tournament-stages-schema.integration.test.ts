import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

type Format = "single_elimination" | "round_robin" | "swiss";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

interface TournamentFixture {
  tournamentId: number;
  stageId: number;
  playerIds: number[];
  organizerHeaders: Record<string, string>;
}

const SESSION_SECRET = `tournament-stages-schema-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;

async function rows<T = Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

async function createDraftTournament(
  format: Format,
  playerCount: number,
  options: { bestOf?: number; swissRounds?: number } = {},
): Promise<TournamentFixture> {
  const suffix = randomUUID();
  const [tournament] = await rows<{ id: number }>(
    `INSERT INTO tournaments (name, format, status, visibility, default_best_of, swiss_rounds)
     VALUES ($1, $2::tournament_format, 'draft', 'public_online', $3, $4)
     RETURNING id`,
    [
      `Stages ${format} ${suffix}`,
      format,
      options.bestOf ?? 3,
      format === "swiss" ? (options.swissRounds ?? 2) : null,
    ],
  );
  const playerIds: number[] = [];
  for (let index = 0; index < playerCount; index += 1) {
    const [player] = await rows<{ id: number }>(
      `INSERT INTO players (tournament_id, name, seed)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [tournament.id, `Player ${index + 1} ${suffix}`, index + 1],
    );
    playerIds.push(player.id);
  }
  const [stage] = await rows<{ id: number }>(
    "SELECT id FROM tournament_stages WHERE tournament_id = $1 AND position = 1",
    [tournament.id],
  );
  return {
    tournamentId: tournament.id,
    stageId: stage.id,
    playerIds,
    organizerHeaders: { "x-organizer-token": signOrganizerToken(tournament.id) },
  };
}

async function expectDatabaseRejection(
  operation: () => Promise<unknown>,
  expected: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    if (!(error instanceof Error)) return false;
    const constraint = "constraint" in error ? String(error.constraint) : "";
    return constraint === expected || error.message.includes(expected);
  });
}

async function transitionSingleStageLifecycle(
  fixture: Pick<TournamentFixture, "tournamentId" | "stageId">,
  status: "active" | "completed",
): Promise<void> {
  const client = await database.pool.connect();
  try {
    await client.query("BEGIN");
    if (status === "active") {
      await client.query(
        `UPDATE tournament_stages
         SET status = 'active', started_at = now(), completed_at = NULL
         WHERE id = $1`,
        [fixture.stageId],
      );
      await client.query(
        "UPDATE tournaments SET status = 'active' WHERE id = $1",
        [fixture.tournamentId],
      );
    } else {
      await client.query(
        `UPDATE tournament_stages
         SET status = 'completed', completed_at = now()
         WHERE id = $1`,
        [fixture.stageId],
      );
      await client.query(
        "UPDATE tournaments SET status = 'completed' WHERE id = $1",
        [fixture.tournamentId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, testConfig.schema);
  }
  await database.pool.end();
});

describe("single-stage compatibility lifecycle", () => {
  test("creates one normal stage and keeps participant membership in sync", async () => {
    const fixture = await createDraftTournament("round_robin", 3);
    const [stage] = await rows<{
      stage_key: string;
      position: number;
      name: string;
      format: string;
      status: string;
      participant_count: number;
      best_of: number;
    }>(
      `SELECT stage_key, position, name, format, status, participant_count, best_of
       FROM tournament_stages WHERE id = $1`,
      [fixture.stageId],
    );
    assert.deepEqual(stage, {
      stage_key: "stage-1",
      position: 1,
      name: "Etap 1",
      format: "round_robin",
      status: "planned",
      participant_count: 3,
      best_of: 3,
    });

    let participants = await rows<{ player_id: number; stage_seed: number }>(
      `SELECT player_id, stage_seed FROM stage_participants
       WHERE stage_id = $1 ORDER BY stage_seed`,
      [fixture.stageId],
    );
    assert.deepEqual(participants, fixture.playerIds.map((playerId, index) => ({
      player_id: playerId,
      stage_seed: index + 1,
    })));

    await database.pool.query("UPDATE players SET seed = 7 WHERE id = $1", [fixture.playerIds[0]]);
    const reseeded = await rows<{
      player_id: number;
      stage_seed: number;
      player_seed: number;
    }>(
      `SELECT participant.player_id, participant.stage_seed, player.seed AS player_seed
       FROM stage_participants participant
       JOIN players player ON player.id = participant.player_id
       WHERE participant.stage_id = $1
       ORDER BY participant.stage_seed`,
      [fixture.stageId],
    );
    assert.deepEqual(reseeded.map(({ stage_seed }) => stage_seed), [1, 2, 3]);
    assert.ok(reseeded.every(({ stage_seed, player_seed }) => stage_seed === player_seed));
    assert.equal(
      reseeded.find(({ player_id }) => player_id === fixture.playerIds[0])?.stage_seed,
      3,
    );

    await database.pool.query("DELETE FROM players WHERE id = $1", [fixture.playerIds[2]]);
    const [count] = await rows<{
      participant_count: number;
      actual_count: number;
      seeds: number[];
    }>(
      `SELECT stage.participant_count,
              (SELECT count(*)::int FROM stage_participants participant WHERE participant.stage_id = stage.id) AS actual_count,
              (SELECT array_agg(participant.stage_seed ORDER BY participant.stage_seed)
               FROM stage_participants participant WHERE participant.stage_id = stage.id) AS seeds
       FROM tournament_stages stage WHERE stage.id = $1`,
      [fixture.stageId],
    );
    assert.deepEqual(count, { participant_count: 2, actual_count: 2, seeds: [1, 2] });
  });

  test("rolls back Tournament creation when Etap 1 creation fails", async () => {
    const name = `Atomic stage failure ${randomUUID()}`;
    await database.pool.query(`
      CREATE FUNCTION test_fail_stage_creation() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'intentional stage creation failure';
      END;
      $$;
      CREATE TRIGGER test_fail_stage_creation
      BEFORE INSERT ON tournament_stages
      FOR EACH ROW EXECUTE FUNCTION test_fail_stage_creation();
    `);
    try {
      await assert.rejects(
        database.pool.query(
          `INSERT INTO tournaments (name, format, status, visibility, default_best_of)
           VALUES ($1, 'round_robin', 'draft', 'public_online', 3)`,
          [name],
        ),
        /intentional stage creation failure/,
      );
      const [remaining] = await rows<{ count: number }>(
        "SELECT count(*)::int AS count FROM tournaments WHERE name = $1",
        [name],
      );
      assert.equal(remaining.count, 0);
    } finally {
      await database.pool.query("DROP TRIGGER test_fail_stage_creation ON tournament_stages");
      await database.pool.query("DROP FUNCTION test_fail_stage_creation()");
    }
  });

  for (const scenario of [
    { format: "single_elimination" as const, players: 4 },
    { format: "round_robin" as const, players: 4 },
    { format: "swiss" as const, players: 4 },
  ]) {
    test(`starts ${scenario.format} with every runtime row assigned to its stage`, async () => {
      const fixture = await createDraftTournament(scenario.format, scenario.players);
      await request(app)
        .post(`/api/tournaments/${fixture.tournamentId}/start`)
        .set(fixture.organizerHeaders)
        .expect(200);

      const [stage] = await rows<{
        status: string;
        current_round: number;
        total_rounds: number;
        started_at: Date;
        active_stage_id: number;
      }>(
        `SELECT stage.status, stage.current_round, stage.total_rounds, stage.started_at,
                tournament.active_stage_id
         FROM tournament_stages stage
         JOIN tournaments tournament ON tournament.id = stage.tournament_id
         WHERE stage.id = $1`,
        [fixture.stageId],
      );
      assert.equal(stage.status, "active");
      assert.equal(stage.current_round, 1);
      assert.ok(stage.total_rounds > 0);
      assert.ok(stage.started_at);
      assert.equal(stage.active_stage_id, fixture.stageId);

      const [assignments] = await rows<{ total: number; assigned: number; foreign_stage: number }>(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE stage_id = $2)::int AS assigned,
                count(*) FILTER (WHERE stage_id <> $2)::int AS foreign_stage
         FROM matches WHERE tournament_id = $1`,
        [fixture.tournamentId, fixture.stageId],
      );
      assert.ok(assignments.total > 0);
      assert.equal(assignments.assigned, assignments.total);
      assert.equal(assignments.foreign_stage, 0);

      const actions = await rows<{ stage_id: number }>(
        "SELECT stage_id FROM action_log WHERE tournament_id = $1 AND action_type = 'tournament_started'",
        [fixture.tournamentId],
      );
      assert.deepEqual(actions, [{ stage_id: fixture.stageId }]);
    });
  }

  test("rolls back start when a stage participant invariant is broken", async () => {
    const fixture = await createDraftTournament("single_elimination", 2);
    await database.pool.query(
      "DELETE FROM stage_participants WHERE stage_id = $1 AND player_id = $2",
      [fixture.stageId, fixture.playerIds[1]],
    );

    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/start`)
      .set(fixture.organizerHeaders)
      .expect(400);

    const [state] = await rows<{
      tournament_status: string;
      stage_status: string;
      match_count: number;
      start_log_count: number;
    }>(
      `SELECT tournament.status AS tournament_status,
              stage.status AS stage_status,
              (SELECT count(*)::int FROM matches WHERE tournament_id = tournament.id) AS match_count,
              (SELECT count(*)::int FROM action_log WHERE tournament_id = tournament.id AND action_type = 'tournament_started') AS start_log_count
       FROM tournaments tournament
       JOIN tournament_stages stage ON stage.tournament_id = tournament.id
       WHERE tournament.id = $1`,
      [fixture.tournamentId],
    );
    assert.deepEqual(state, {
      tournament_status: "draft",
      stage_status: "planned",
      match_count: 0,
      start_log_count: 0,
    });
  });

  test("does not remove a stage participant when a started-stage player deletion is rejected", async () => {
    const fixture = await createDraftTournament("round_robin", 2);
    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);

    await assert.rejects(
      database.pool.query("DELETE FROM players WHERE id = $1", [fixture.playerIds[0]]),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "23503",
    );
    const [membership] = await rows<{ count: number }>(
      "SELECT count(*)::int AS count FROM stage_participants WHERE stage_id = $1 AND player_id = $2",
      [fixture.stageId, fixture.playerIds[0]],
    );
    assert.equal(membership.count, 1);
  });

  test("CompleteMatch and RevertMatch keep stage history and participant state atomic", async () => {
    const fixture = await createDraftTournament("single_elimination", 2, { bestOf: 3 });
    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);
    const [match] = await rows<{ id: number }>(
      "SELECT id FROM matches WHERE stage_id = $1 AND status = 'pending'",
      [fixture.stageId],
    );

    await request(app)
      .post(`/api/matches/${match.id}/complete`)
      .set(fixture.organizerHeaders)
      .send({ resultType: "played", score1: 2, score2: 0 })
      .expect(200);

    let [state] = await rows<{
      stage_status: string;
      winner_status: string;
      loser_status: string;
      history_stage_id: number;
      action_stage_id: number;
    }>(
      `SELECT stage.status AS stage_status,
              winner.status AS winner_status,
              loser.status AS loser_status,
              history.stage_id AS history_stage_id,
              action.stage_id AS action_stage_id
       FROM tournament_stages stage
       JOIN stage_participants winner ON winner.stage_id = stage.id AND winner.player_id = $2
       JOIN stage_participants loser ON loser.stage_id = stage.id AND loser.player_id = $3
       JOIN result_history history ON history.match_id = $4
       JOIN action_log action ON action.match_id = $4 AND action.action_type = 'match_result_submitted'
       WHERE stage.id = $1`,
      [fixture.stageId, fixture.playerIds[0], fixture.playerIds[1], match.id],
    );
    assert.deepEqual(state, {
      stage_status: "completed",
      winner_status: "winner",
      loser_status: "eliminated",
      history_stage_id: fixture.stageId,
      action_stage_id: fixture.stageId,
    });
    const [completedPointer] = await rows<{ active_stage_id: number | null }>(
      "SELECT active_stage_id FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    );
    assert.equal(completedPointer.active_stage_id, null);

    await request(app)
      .post(`/api/matches/${match.id}/revert`)
      .set(fixture.organizerHeaders)
      .expect(200);
    [state] = await rows<typeof state>(
      `SELECT stage.status AS stage_status,
              winner.status AS winner_status,
              loser.status AS loser_status,
              history.stage_id AS history_stage_id,
              action.stage_id AS action_stage_id
       FROM tournament_stages stage
       JOIN stage_participants winner ON winner.stage_id = stage.id AND winner.player_id = $2
       JOIN stage_participants loser ON loser.stage_id = stage.id AND loser.player_id = $3
       JOIN result_history history ON history.match_id = $4
       JOIN action_log action ON action.match_id = $4 AND action.action_type = 'match_result_reverted'
       WHERE stage.id = $1`,
      [fixture.stageId, fixture.playerIds[0], fixture.playerIds[1], match.id],
    );
    assert.equal(state.stage_status, "active");
    assert.equal(state.winner_status, "active");
    assert.equal(state.loser_status, "active");
    assert.equal(state.history_stage_id, fixture.stageId);
    assert.equal(state.action_stage_id, fixture.stageId);
    const [reopenedPointer] = await rows<{ active_stage_id: number | null }>(
      "SELECT active_stage_id FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    );
    assert.equal(reopenedPointer.active_stage_id, fixture.stageId);
  });

  test("round-trips Backup v3 through a normal single stage", async () => {
    const fixture = await createDraftTournament("round_robin", 3, { bestOf: 3 });
    await request(app)
      .post(`/api/tournaments/${fixture.tournamentId}/start`)
      .set(fixture.organizerHeaders)
      .expect(200);

    const pendingMatches = await rows<{ id: number }>(
      `SELECT id FROM matches
       WHERE tournament_id = $1 AND status = 'pending'
       ORDER BY round, match_number`,
      [fixture.tournamentId],
    );
    assert.ok(pendingMatches.length > 0);
    for (const match of pendingMatches) {
      await request(app)
        .post(`/api/matches/${match.id}/complete`)
        .set(fixture.organizerHeaders)
        .send({ resultType: "played", score1: 2, score2: 0 })
        .expect(200);
    }

    const originalStandings = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/standings`)
      .expect(200);
    const exported = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/export`)
      .set(fixture.organizerHeaders)
      .expect(200);
    assert.equal(exported.body.schemaVersion, 3);
    assert.ok(exported.body.resultHistory.length > 0);

    const imported = await request(app)
      .post("/api/tournaments/import")
      .send(exported.body)
      .expect(201);
    const importedId = imported.body.tournament.id as number;
    const [importedStage] = await rows<{
      id: number;
      stage_key: string;
      position: number;
      name: string;
      format: string;
      status: string;
      participant_count: number;
      best_of: number;
      started_at: Date | null;
      completed_at: Date;
    }>(
      `SELECT id, stage_key, position, name, format, status, participant_count, best_of,
              started_at, completed_at
       FROM tournament_stages WHERE tournament_id = $1`,
      [importedId],
    );
    const [completionEvidence] = await rows<{ completed_at: Date }>(
      `SELECT max(completed_at) AS completed_at
       FROM matches
       WHERE tournament_id = $1 AND status = 'completed' AND completed_at IS NOT NULL`,
      [importedId],
    );
    assert.deepEqual(
      {
        ...importedStage,
        id: undefined,
        started_at: undefined,
        completed_at: undefined,
      },
      {
        id: undefined,
        stage_key: "stage-1",
        position: 1,
        name: "Etap 1",
        format: "round_robin",
        status: "completed",
        participant_count: exported.body.players.length,
        best_of: 3,
        started_at: undefined,
        completed_at: undefined,
      },
    );
    assert.ok(importedStage.started_at);
    assert.equal(
      importedStage.completed_at.toISOString(),
      completionEvidence.completed_at.toISOString(),
    );

    const restoredParticipants = await rows<{ stage_seed: number }>(
      "SELECT stage_seed FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed",
      [importedStage.id],
    );
    assert.deepEqual(
      restoredParticipants.map(({ stage_seed }) => stage_seed),
      Array.from({ length: exported.body.players.length }, (_, index) => index + 1),
    );

    const restoredMatches = await rows<{
      stage_id: number;
      round: number;
      match_number: number;
      score1: number | null;
      score2: number | null;
      result_type: string | null;
      best_of: number;
      status: string;
    }>(
      `SELECT stage_id, round, match_number, score1, score2, result_type, best_of, status
       FROM matches WHERE tournament_id = $1 ORDER BY round, match_number`,
      [importedId],
    );
    assert.ok(restoredMatches.every(({ stage_id }) => stage_id === importedStage.id));
    assert.deepEqual(
      restoredMatches.map(({ stage_id: _stageId, ...match }) => match),
      exported.body.matches.map((match: Record<string, unknown>) => ({
        round: match.round,
        match_number: match.matchNumber,
        score1: match.score1,
        score2: match.score2,
        result_type: match.resultType,
        best_of: match.bestOf,
        status: match.status,
      })),
    );

    const [restoredStageLinks] = await rows<{
      history_count: number;
      history_in_stage: number;
      linked_actions: number;
      linked_actions_in_stage: number;
    }>(
      `SELECT
         (SELECT count(*)::int FROM result_history WHERE tournament_id = $1) AS history_count,
         (SELECT count(*)::int FROM result_history WHERE tournament_id = $1 AND stage_id = $2) AS history_in_stage,
         (SELECT count(*)::int FROM action_log WHERE tournament_id = $1 AND match_id IS NOT NULL) AS linked_actions,
         (SELECT count(*)::int FROM action_log WHERE tournament_id = $1 AND match_id IS NOT NULL AND stage_id = $2) AS linked_actions_in_stage`,
      [importedId, importedStage.id],
    );
    assert.equal(restoredStageLinks.history_count, exported.body.resultHistory.length);
    assert.equal(restoredStageLinks.history_in_stage, restoredStageLinks.history_count);
    assert.ok(restoredStageLinks.linked_actions > 0);
    assert.equal(restoredStageLinks.linked_actions_in_stage, restoredStageLinks.linked_actions);

    const restoredStandings = await request(app)
      .get(`/api/tournaments/${importedId}/standings`)
      .expect(200);
    const semanticStandings = (entries: Array<Record<string, unknown>>) => entries.map((entry) => ({
      playerName: entry.playerName,
      rank: entry.rank,
      matchesPlayed: entry.matchesPlayed,
      matchWins: entry.matchWins,
      matchLosses: entry.matchLosses,
      gameWins: entry.gameWins,
      gameLosses: entry.gameLosses,
      gameDiff: entry.gameDiff,
      status: entry.status,
      seed: entry.seed,
    }));
    assert.deepEqual(
      semanticStandings(restoredStandings.body),
      semanticStandings(originalStandings.body),
    );
  });
});

describe("Tournament Stages database integrity", () => {
  test("allows at most one active stage per tournament", async () => {
    const fixture = await createDraftTournament("round_robin", 2);
    await transitionSingleStageLifecycle(fixture, "active");
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournament_stages (
           tournament_id, stage_key, position, name, format, status,
           participant_count, best_of, ranking_policy, qualification_mode,
           seeding_policy, started_at
         ) VALUES (
           $1, 'stage-2', 2, 'Etap 2', 'single_elimination', 'active',
           0, 3, 'elimination_bracket_v1', 'none', 'standard_bracket', now()
         )`,
        [fixture.tournamentId],
      ),
      "tournament_stages_one_active_per_tournament",
    );
    const [pointer] = await rows<{ active_stage_id: number }>(
      "SELECT active_stage_id FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    );
    assert.equal(pointer.active_stage_id, fixture.stageId);
    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE tournaments SET active_stage_id = NULL WHERE id = $1",
        [fixture.tournamentId],
      ),
      "active_stage_id is required",
    );
  });

  test("keeps active_stage_id in the same tournament and clears it on completion", async () => {
    const first = await createDraftTournament("round_robin", 2);
    const second = await createDraftTournament("round_robin", 2);
    await transitionSingleStageLifecycle(first, "active");
    await transitionSingleStageLifecycle(second, "active");

    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE tournaments SET active_stage_id = $1 WHERE id = $2",
        [second.stageId, first.tournamentId],
      ),
      "must identify the active stage",
    );
    await database.pool.query(
      `INSERT INTO tournament_stages (
         tournament_id, stage_key, position, name, format, participant_count,
         best_of, ranking_policy, qualification_mode, seeding_policy
       ) VALUES ($1, 'stage-2', 2, 'Later stage', 'single_elimination', 0, 3,
                 'elimination_bracket_v1', 'none', 'standard_bracket')`,
      [first.tournamentId],
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        "DELETE FROM tournament_stages WHERE id = $1",
        [first.stageId],
      ),
      "tournaments_active_stage_same_tournament_fk",
    );
    await database.pool.query(
      "DELETE FROM tournament_stages WHERE tournament_id = $1 AND position = 2",
      [first.tournamentId],
    );
    await transitionSingleStageLifecycle(first, "completed");
    const [state] = await rows<{
      active_stage_id: number | null;
      tournament_status: string;
      stage_status: string;
      completed_at: Date;
    }>(
      `SELECT tournament.active_stage_id, tournament.status AS tournament_status,
              stage.status AS stage_status, stage.completed_at
       FROM tournaments tournament
       JOIN tournament_stages stage ON stage.tournament_id = tournament.id
       WHERE tournament.id = $1 AND stage.id = $2`,
      [first.tournamentId, first.stageId],
    );
    assert.equal(state.active_stage_id, null);
    assert.equal(state.tournament_status, "completed");
    assert.equal(state.stage_status, "completed");
    assert.ok(state.completed_at);
  });

  test("rejects invalid stage lifecycle timestamp combinations", async () => {
    const fixture = await createDraftTournament("round_robin", 1);
    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE tournament_stages SET status = 'active', started_at = now() WHERE id = $1",
        [fixture.stageId],
      ),
      "single-stage lifecycle must match tournament",
    );
    const [draftState] = await rows<{
      tournament_status: string;
      active_stage_id: number | null;
      stage_status: string;
    }>(
      `SELECT tournament.status AS tournament_status, tournament.active_stage_id,
              stage.status AS stage_status
       FROM tournaments tournament
       JOIN tournament_stages stage ON stage.tournament_id = tournament.id
       WHERE tournament.id = $1`,
      [fixture.tournamentId],
    );
    assert.deepEqual(draftState, {
      tournament_status: "draft",
      active_stage_id: null,
      stage_status: "planned",
    });
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournament_stages (
           tournament_id, stage_key, position, name, format, status,
           participant_count, best_of, ranking_policy, qualification_mode, seeding_policy
         ) VALUES ($1, 'stage-2', 2, 'Completed without time', 'single_elimination', 'completed',
                   0, 3, 'elimination_bracket_v1', 'none', 'standard_bracket')`,
        [fixture.tournamentId],
      ),
      "tournament_stages_lifecycle_timestamps",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournament_stages (
           tournament_id, stage_key, position, name, format, status,
           participant_count, best_of, ranking_policy, qualification_mode,
           seeding_policy, completed_at
         ) VALUES ($1, 'stage-3', 3, 'Planned with completion', 'single_elimination', 'planned',
                   0, 3, 'elimination_bracket_v1', 'none', 'standard_bracket', now())`,
        [fixture.tournamentId],
      ),
      "tournament_stages_lifecycle_timestamps",
    );
    const name = `Completed without evidence ${randomUUID()}`;
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournaments (name, format, status, visibility, default_best_of)
         VALUES ($1, 'round_robin', 'completed', 'public_online', 3)`,
        [name],
      ),
      "single-stage lifecycle must match tournament",
    );
    const [rolledBack] = await rows<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments WHERE name = $1",
      [name],
    );
    assert.equal(rolledBack.count, 0);
  });

  test("enforces unique stage keys, positions and participant seeds", async () => {
    const fixture = await createDraftTournament("round_robin", 2);
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournament_stages (
           tournament_id, stage_key, position, name, format, participant_count,
           best_of, ranking_policy, qualification_mode, seeding_policy
         ) VALUES ($1, 'stage-1', 2, 'Duplicate key', 'round_robin', 0, 3,
                   'round_robin_v1', 'none', 'standings_order')`,
        [fixture.tournamentId],
      ),
      "tournament_stages_tournament_key_unique",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournament_stages (
           tournament_id, stage_key, position, name, format, participant_count,
           best_of, ranking_policy, qualification_mode, seeding_policy
         ) VALUES ($1, 'another-key', 1, 'Duplicate position', 'round_robin', 0, 3,
                   'round_robin_v1', 'none', 'standings_order')`,
        [fixture.tournamentId],
      ),
      "tournament_stages_tournament_position_unique",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `UPDATE stage_participants SET stage_seed = 1
         WHERE stage_id = $1 AND player_id = $2`,
        [fixture.stageId, fixture.playerIds[1]],
      ),
      "stage_participants_stage_seed_unique",
    );
  });

  test("rejects cross-tournament stage participants and matches", async () => {
    const first = await createDraftTournament("round_robin", 1);
    const second = await createDraftTournament("round_robin", 1);
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO stage_participants (
           tournament_id, stage_id, player_id, stage_seed, status, qualification_source
         ) VALUES ($1, $2, $3, 99, 'active', 'registration')`,
        [first.tournamentId, first.stageId, second.playerIds[0]],
      ),
      "stage_participants_player_same_tournament_fk",
    );
    const [secondParticipant] = await rows<{ id: number }>(
      "SELECT id FROM stage_participants WHERE stage_id = $1 AND player_id = $2",
      [second.stageId, second.playerIds[0]],
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `UPDATE stage_participants SET source_stage_participant_id = $1
         WHERE stage_id = $2 AND player_id = $3`,
        [secondParticipant.id, first.stageId, first.playerIds[0]],
      ),
      "stage_participants_source_same_tournament_fk",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO matches (tournament_id, stage_id, round, match_number, best_of, status)
         VALUES ($1, $2, 1, 99, 1, 'pending')`,
        [second.tournamentId, first.stageId],
      ),
      "matches_stage_same_tournament_fk",
    );

    const [match] = await rows<{ id: number }>(
      `INSERT INTO matches (tournament_id, stage_id, round, match_number, best_of, status)
       VALUES ($1, $2, 1, 1, 1, 'pending') RETURNING id`,
      [first.tournamentId, first.stageId],
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO result_history (
           match_id, tournament_id, stage_id, revision, round, match_number,
           best_of, result_type, completed_at
         ) VALUES ($1, $2, $3, 1, 1, 1, 1, 'no_contest', now())`,
        [match.id, second.tournamentId, first.stageId],
      ),
      "result_history_match_same_tournament_stage_fk",
    );

    const [secondStage] = await rows<{ id: number }>(
      `INSERT INTO tournament_stages (
         tournament_id, stage_key, position, name, format, participant_count,
         best_of, ranking_policy, qualification_mode, seeding_policy
       ) VALUES ($1, 'stage-2', 2, 'Final', 'single_elimination', 0, 1,
                 'elimination_bracket_v1', 'none', 'standard_bracket') RETURNING id`,
      [first.tournamentId],
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO action_log (
           tournament_id, stage_id, match_id, action_type, description
         ) VALUES ($1, $2, $3, 'invalid_cross_stage', 'invalid')`,
        [first.tournamentId, secondStage.id, match.id],
      ),
      "action_log_match_same_tournament_stage_fk",
    );
  });

  test("rejects a missing stage in multi-stage data and a group from another stage", async () => {
    const fixture = await createDraftTournament("round_robin", 1);
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO stage_groups (stage_id, group_key, position, participant_count, qualifiers_count)
         VALUES ($1, 'A', 1, 3, 1)`,
        [fixture.stageId],
      ),
      "stage_groups may belong only to group_stage",
    );
    const [groupStage] = await rows<{ id: number }>(
      `INSERT INTO tournament_stages (
         tournament_id, stage_key, position, name, format, participant_count,
         best_of, ranking_policy, qualification_mode, group_count,
         participants_per_group, qualifiers_per_group, seeding_policy,
         result_seeding_policy
       ) VALUES (
         $1, 'stage-2', 2, 'Groups', 'group_stage', 6,
         3, 'group_v1', 'top_n_per_group', 2, 3, 1, 'snake_groups', 'rank_bands'
       ) RETURNING id`,
      [fixture.tournamentId],
    );
    const [group] = await rows<{ id: number }>(
      `INSERT INTO stage_groups (stage_id, group_key, position, participant_count, qualifiers_count)
       VALUES ($1, 'A', 1, 3, 1) RETURNING id`,
      [groupStage.id],
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO stage_groups (stage_id, group_key, position, participant_count, qualifiers_count)
         VALUES ($1, 'A', 2, 3, 1)`,
        [groupStage.id],
      ),
      "stage_groups_stage_key_unique",
    );

    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO matches (tournament_id, round, match_number, best_of, status)
         VALUES ($1, 1, 1, 1, 'pending')`,
        [fixture.tournamentId],
      ),
      "stage_id is required",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `UPDATE stage_participants SET group_id = $1
         WHERE stage_id = $2 AND player_id = $3`,
        [group.id, fixture.stageId, fixture.playerIds[0]],
      ),
      "stage_participants_group_same_stage_fk",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO matches (
           tournament_id, stage_id, stage_group_id, round, match_number, best_of, status
         ) VALUES ($1, $2, $3, 1, 2, 1, 'pending')`,
        [fixture.tournamentId, fixture.stageId, group.id],
      ),
      "matches_group_same_stage_fk",
    );
  });

  test("accepts arbitrary balanced group counts and enforces each derived group size", async () => {
    const fixture = await createDraftTournament("round_robin", 1);
    const [groupStage] = await rows<{ id: number }>(
      `INSERT INTO tournament_stages (
         tournament_id, stage_key, position, name, format, participant_count,
         best_of, ranking_policy, qualification_mode, group_count,
         participants_per_group, qualifiers_per_group, seeding_policy,
         result_seeding_policy
       ) VALUES (
         $1, 'stage-2', 2, 'Flexible groups', 'group_stage', 11,
         1, 'group_v1', 'top_n_per_group', 5, 3, 3, 'snake_groups', 'rank_bands'
       ) RETURNING id`,
      [fixture.tournamentId],
    );

    for (const [position, key, participantCount, qualifiersCount] of [
      [1, "A", 3, 3],
      [2, "B", 2, 2],
      [3, "C", 2, 2],
      [4, "D", 2, 2],
      [5, "E", 2, 2],
    ] as const) {
      await database.pool.query(
        `INSERT INTO stage_groups (stage_id, group_key, position, participant_count, qualifiers_count)
         VALUES ($1, $2, $3, $4, $5)`,
        [groupStage.id, key, position, participantCount, qualifiersCount],
      );
    }

    const groups = await rows<{
      group_key: string;
      participant_count: number;
      qualifiers_count: number;
    }>(
      `SELECT group_key, participant_count, qualifiers_count
       FROM stage_groups WHERE stage_id = $1 ORDER BY position`,
      [groupStage.id],
    );
    assert.deepEqual(groups, [
      { group_key: "A", participant_count: 3, qualifiers_count: 3 },
      { group_key: "B", participant_count: 2, qualifiers_count: 2 },
      { group_key: "C", participant_count: 2, qualifiers_count: 2 },
      { group_key: "D", participant_count: 2, qualifiers_count: 2 },
      { group_key: "E", participant_count: 2, qualifiers_count: 2 },
    ]);

    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO stage_groups (stage_id, group_key, position, participant_count, qualifiers_count)
         VALUES ($1, 'F', 6, 2, 2)`,
        [groupStage.id],
      ),
      "stage group position must fit its tournament stage",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `UPDATE stage_groups SET participant_count = 3 WHERE stage_id = $1 AND position = 2`,
        [groupStage.id],
      ),
      "stage group configuration must match its balanced tournament stage",
    );
  });

  test("prevents deleting the last stage without blocking tournament cascade deletion", async () => {
    const fixture = await createDraftTournament("round_robin", 1);
    await expectDatabaseRejection(
      () => database.pool.query("DELETE FROM tournament_stages WHERE id = $1", [fixture.stageId]),
      "must retain at least one stage",
    );
    await database.pool.query("DELETE FROM tournaments WHERE id = $1", [fixture.tournamentId]);
    const [remaining] = await rows<{ tournaments: number; stages: number }>(
      `SELECT
         (SELECT count(*)::int FROM tournaments WHERE id = $1) AS tournaments,
         (SELECT count(*)::int FROM tournament_stages WHERE tournament_id = $1) AS stages`,
      [fixture.tournamentId],
    );
    assert.deepEqual(remaining, { tournaments: 0, stages: 0 });
  });

  test("rejects invalid positions, BO values and stage seeds", async () => {
    const fixture = await createDraftTournament("round_robin", 1);
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournament_stages (
           tournament_id, stage_key, position, name, format, participant_count,
           best_of, ranking_policy, qualification_mode, seeding_policy
         ) VALUES ($1, 'stage-negative', -1, 'Invalid position', 'round_robin', 0, 3,
                   'round_robin_v1', 'none', 'standings_order')`,
        [fixture.tournamentId],
      ),
      "tournament_stages_position_range",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO tournament_stages (
           tournament_id, stage_key, position, name, format, participant_count,
           best_of, ranking_policy, qualification_mode, seeding_policy
         ) VALUES ($1, 'stage-2', 2, 'Invalid BO', 'round_robin', 0, 2,
                   'round_robin_v1', 'none', 'standings_order')`,
        [fixture.tournamentId],
      ),
      "tournament_stages_best_of_supported",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        `INSERT INTO matches (tournament_id, stage_id, round, match_number, best_of, status)
         VALUES ($1, $2, 1, 1, 2, 'pending')`,
        [fixture.tournamentId, fixture.stageId],
      ),
      "matches_best_of_positive_odd",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE stage_participants SET stage_seed = 0 WHERE stage_id = $1",
        [fixture.stageId],
      ),
      "stage_participants_seed_positive",
    );
  });

  test("requires a stage winner to be a participant of that stage", async () => {
    const fixture = await createDraftTournament("round_robin", 1);
    const [secondStage] = await rows<{ id: number }>(
      `INSERT INTO tournament_stages (
         tournament_id, stage_key, position, name, format, participant_count,
         best_of, ranking_policy, qualification_mode, seeding_policy
       ) VALUES ($1, 'stage-2', 2, 'Final', 'single_elimination', 1, 3,
                 'elimination_bracket_v1', 'none', 'standard_bracket')
       RETURNING id`,
      [fixture.tournamentId],
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE tournament_stages SET winner_id = $1 WHERE id = $2",
        [fixture.playerIds[0], secondStage.id],
      ),
      "tournament_stages_winner_same_stage_fk",
    );
  });

  test("enforces configurable seeding, deterministic random keys and audit shape", async () => {
    const fixture = await createDraftTournament("round_robin", 2);
    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE tournament_stages SET entry_seeding_policy = 'random' WHERE id = $1",
        [fixture.stageId],
      ),
      "tournament_stages_random_seed_configuration",
    );
    await database.pool.query(
      `UPDATE tournament_stages
       SET entry_seeding_policy = 'random', random_seed = 'draw-2026',
           random_reveal_order = 'sequential'
       WHERE id = $1`,
      [fixture.stageId],
    );
    const [configured] = await rows<{
      entry_seeding_policy: string;
      random_seed: string;
      random_reveal_order: string;
    }>(
      `SELECT entry_seeding_policy, random_seed, random_reveal_order
       FROM tournament_stages WHERE id = $1`,
      [fixture.stageId],
    );
    assert.deepEqual(configured, {
      entry_seeding_policy: "random",
      random_seed: "draw-2026",
      random_reveal_order: "sequential",
    });
    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE tournament_stages SET seeding_audit = '[]'::jsonb WHERE id = $1",
        [fixture.stageId],
      ),
      "tournament_stages_seeding_audit_shape",
    );
    await expectDatabaseRejection(
      () => database.pool.query(
        "UPDATE tournament_stages SET result_seeding_policy = 'global_ranking' WHERE id = $1",
        [fixture.stageId],
      ),
      "tournament_stages_result_seeding_configuration",
    );
  });

});
