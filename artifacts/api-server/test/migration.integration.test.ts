import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  renderSeriesV1MigrationForTestSchema,
  type TestDatabaseConfig,
} from "./test-database";
// @ts-expect-error The production migration runner intentionally stays plain ESM for direct Node execution.
import { applyTournamentStagesMigration } from "../../../lib/db/scripts/migrate-tournament-stages-v1.mjs";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

const SERIES_V1_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0001_series_v1_clean_cutover.sql",
  import.meta.url,
);

let database: DatabaseModule;
let testConfig: TestDatabaseConfig;
let schemaCreated = false;
let tournamentIds: number[] = [];
let originalPlayerIds: number[] = [];
let originalMatchIds: number[] = [];
let originalCounts: Record<string, number> = {};

async function rows<T = Record<string, unknown>>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

async function count(table: string): Promise<number> {
  const [result] = await rows<{ count: number }>(`SELECT count(*)::integer AS count FROM ${table}`);
  return result.count;
}

async function insertTournament(
  name: string,
  format: "swiss" | "round_robin" | "single_elimination",
  status: "draft" | "active" | "completed",
  options: { bestOf?: number; swissRounds?: number; currentRound?: number; totalRounds?: number } = {},
): Promise<number> {
  const [result] = await rows<{ id: number }>(
    `INSERT INTO tournaments (
      name, format, status, default_best_of, swiss_rounds, current_round, total_rounds
    ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      name,
      format,
      status,
      options.bestOf ?? 1,
      options.swissRounds ?? null,
      options.currentRound ?? null,
      options.totalRounds ?? null,
    ],
  );
  tournamentIds.push(result.id);
  return result.id;
}

async function insertPlayers(tournamentId: number, namesAndSeeds: Array<[string, number | null]>): Promise<number[]> {
  const ids: number[] = [];
  for (const [name, seed] of namesAndSeeds) {
    const [player] = await rows<{ id: number }>(
      "INSERT INTO players (tournament_id, name, seed) VALUES ($1, $2, $3) RETURNING id",
      [tournamentId, name, seed],
    );
    ids.push(player.id);
    originalPlayerIds.push(player.id);
  }
  return ids;
}

async function insertCompletedMatch(
  tournamentId: number,
  player1Id: number,
  player2Id: number,
  winnerId: number,
  options: { bestOf?: number; matchNumber?: number; round?: number } = {},
): Promise<number> {
  const [match] = await rows<{ id: number }>(
    `INSERT INTO matches (
      tournament_id, round, match_number, player1_id, player2_id,
      score1, score2, winner_id, best_of, result_type, status, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 0, $4, $7, 'played', 'completed', NOW())
    RETURNING id`,
    [
      tournamentId,
      options.round ?? 1,
      options.matchNumber ?? 1,
      winnerId,
      winnerId === player1Id ? player2Id : player1Id,
      Math.floor((options.bestOf ?? 1) / 2) + 1,
      options.bestOf ?? 1,
    ],
  );
  originalMatchIds.push(match.id);
  return match.id;
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  database = await import("@workspace/db") as DatabaseModule;

  await database.pool.query(`DROP SCHEMA IF EXISTS "${testConfig.schema}" CASCADE`);
  await database.pool.query(`CREATE SCHEMA "${testConfig.schema}"`);
  await database.pool.query(`SET search_path TO "${testConfig.schema}"`);
  schemaCreated = true;
  const baseSql = renderSeriesV1MigrationForTestSchema(
    await readFile(SERIES_V1_MIGRATION_URL, "utf8"),
    testConfig.schema,
  );
  await database.pool.query(baseSql);

  await insertTournament("Draft empty", "single_elimination", "draft", { bestOf: 3 });
  const draftPlayersTournament = await insertTournament("Draft players", "round_robin", "draft", { bestOf: 3 });
  await insertPlayers(draftPlayersTournament, [["Seed ten", 10], ["No seed", null], ["Seed duplicate", 10]]);

  const swiss = await insertTournament("Active Swiss", "swiss", "active", {
    bestOf: 3,
    swissRounds: 3,
    currentRound: 1,
    totalRounds: 3,
  });
  const swissPlayers = await insertPlayers(swiss, [["Swiss 1", 1], ["Swiss 2", 2]]);
  const swissMatch = await insertCompletedMatch(swiss, swissPlayers[0], swissPlayers[1], swissPlayers[0], { bestOf: 3 });
  await database.pool.query(
    `INSERT INTO result_history (
      match_id, tournament_id, revision, round, match_number, player1_id, player2_id,
      score1, score2, winner_id, best_of, result_type, completed_at
    ) SELECT id, tournament_id, 1, round, match_number, player1_id, player2_id,
      score1, score2, winner_id, best_of, result_type, completed_at
      FROM matches WHERE id = $1`,
    [swissMatch],
  );
  await database.pool.query(
    "INSERT INTO action_log (tournament_id, action_type, description, match_id) VALUES ($1, 'fixture', 'preserve action', $2)",
    [swiss, swissMatch],
  );

  const roundRobin = await insertTournament("Round Robin played", "round_robin", "active", {
    bestOf: 3,
    currentRound: 1,
    totalRounds: 1,
  });
  const rrPlayers = await insertPlayers(roundRobin, [["RR 1", 1], ["RR 2", 2]]);
  await insertCompletedMatch(roundRobin, rrPlayers[0], rrPlayers[1], rrPlayers[0], { bestOf: 3 });

  const elimination = await insertTournament("Active elimination", "single_elimination", "active", {
    bestOf: 5,
    currentRound: 1,
    totalRounds: 2,
  });
  const eliminationPlayers = await insertPlayers(elimination, [["SE 1", 1], ["SE 2", 2]]);
  const [pending] = await rows<{ id: number }>(
    "INSERT INTO matches (tournament_id, round, match_number, player1_id, player2_id, best_of) VALUES ($1, 1, 1, $2, $3, 5) RETURNING id",
    [elimination, eliminationPlayers[0], eliminationPlayers[1]],
  );
  originalMatchIds.push(pending.id);

  const completed = await insertTournament("Completed tournament", "single_elimination", "completed", {
    bestOf: 3,
    currentRound: 1,
    totalRounds: 1,
  });
  const completedPlayers = await insertPlayers(completed, [["Champion", 1], ["Runner-up", 2]]);
  const completedMatch = await insertCompletedMatch(
    completed,
    completedPlayers[0],
    completedPlayers[1],
    completedPlayers[0],
    { bestOf: 3 },
  );
  await database.pool.query("UPDATE players SET status = 'winner' WHERE id = $1", [completedPlayers[0]]);
  await database.pool.query("UPDATE players SET status = 'eliminated' WHERE id = $1", [completedPlayers[1]]);
  await database.pool.query("UPDATE tournaments SET winner_id = $1 WHERE id = $2", [completedPlayers[0], completed]);
  await database.pool.query(
    "INSERT INTO action_log (tournament_id, action_type, description, match_id) VALUES ($1, 'completed', 'completed fixture', $2)",
    [completed, completedMatch],
  );

  originalCounts = {
    tournaments: await count("tournaments"),
    players: await count("players"),
    matches: await count("matches"),
    result_history: await count("result_history"),
    action_log: await count("action_log"),
  };

  const firstRun = await applyTournamentStagesMigration({
    connectionString: testConfig.connectionString,
    schema: testConfig.schema,
  });
  assert.equal(firstRun.applied, true);
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaCreated) await dropTestSchema(database.pool, testConfig.schema);
  await database.pool.end();
});

describe("non-destructive Tournament Stages v1 migration", () => {
  test("requires an explicit target schema", async () => {
    await assert.rejects(
      applyTournamentStagesMigration({ connectionString: testConfig.connectionString }),
      /DATABASE_SCHEMA is required/,
    );
  });

  test("preserves every legacy row and identifier", async () => {
    for (const [table, expected] of Object.entries(originalCounts)) {
      assert.equal(await count(table), expected, table);
    }
    const playerIds = (await rows<{ id: number }>("SELECT id FROM players ORDER BY id")).map((row) => row.id);
    const matchIds = (await rows<{ id: number }>("SELECT id FROM matches ORDER BY id")).map((row) => row.id);
    assert.deepEqual(playerIds, [...originalPlayerIds].sort((a, b) => a - b));
    assert.deepEqual(matchIds, [...originalMatchIds].sort((a, b) => a - b));
  });

  test("creates exactly one normal stage for every old tournament", async () => {
    const stages = await rows<{
      tournament_id: number;
      stage_key: string;
      position: number;
      name: string;
      status: string;
    }>("SELECT tournament_id, stage_key, position, name, status FROM tournament_stages ORDER BY tournament_id");
    assert.equal(stages.length, tournamentIds.length);
    assert.deepEqual(stages.map((stage) => stage.tournament_id), [...tournamentIds].sort((a, b) => a - b));
    assert.ok(stages.every((stage) => stage.stage_key === "stage-1" && stage.position === 1 && stage.name === "Etap 1"));

    const statuses = await rows<{
      tournament_status: string;
      stage_status: string;
      active_stage_id: number | null;
      stage_id: number;
      started_at: Date | null;
      completed_at: Date | null;
    }>(
      `SELECT tournament.status AS tournament_status, stage.status AS stage_status,
              tournament.active_stage_id, stage.id AS stage_id,
              stage.started_at, stage.completed_at
       FROM tournaments tournament JOIN tournament_stages stage ON stage.tournament_id = tournament.id
       ORDER BY tournament.id`,
    );
    assert.deepEqual(
      statuses.map(({ tournament_status, stage_status }) => [tournament_status, stage_status]),
      [["draft", "planned"], ["draft", "planned"], ["active", "active"], ["active", "active"], ["active", "active"], ["completed", "completed"]],
    );
    assert.ok(statuses.every((status) =>
      status.tournament_status === "active"
        ? status.active_stage_id === status.stage_id
        : status.active_stage_id == null
    ));
    assert.ok(statuses.every(({ started_at }) => started_at == null));
    assert.ok(statuses.slice(0, -1).every(({ completed_at }) => completed_at == null));
    const completedStatus = statuses.at(-1)!;
    assert.ok(completedStatus.completed_at);
    const [lastCompletedMatch] = await rows<{ completed_at: Date }>(
      "SELECT max(completed_at) AS completed_at FROM matches WHERE tournament_id = $1 AND status = 'completed'",
      [tournamentIds.at(-1)],
    );
    assert.equal(
      completedStatus.completed_at!.getTime(),
      lastCompletedMatch.completed_at.getTime(),
    );
  });

  test("backfills every player with a unique contiguous deterministic stage seed", async () => {
    assert.equal(await count("stage_participants"), originalCounts.players);
    const tournaments = await rows<{ tournament_id: number }>(
      "SELECT DISTINCT tournament_id FROM stage_participants ORDER BY tournament_id",
    );
    for (const { tournament_id } of tournaments) {
      const seeds = (await rows<{ stage_seed: number }>(
        "SELECT stage_seed FROM stage_participants WHERE tournament_id = $1 ORDER BY stage_seed",
        [tournament_id],
      )).map((row) => row.stage_seed);
      assert.deepEqual(seeds, Array.from({ length: seeds.length }, (_, index) => index + 1));
    }
  });

  test("assigns every match and history row to its synthetic stage", async () => {
    const [{ missing_match_stage }] = await rows<{ missing_match_stage: number }>(
      "SELECT count(*) FILTER (WHERE stage_id IS NULL)::integer AS missing_match_stage FROM matches",
    );
    assert.equal(missing_match_stage, 0);
    const history = await rows<{ history_stage: number; match_stage: number }>(
      "SELECT history.stage_id AS history_stage, match.stage_id AS match_stage FROM result_history history JOIN matches match ON match.id = history.match_id",
    );
    assert.ok(history.every((row) => row.history_stage === row.match_stage));
    const actionStages = await rows<{ stage_id: number | null }>("SELECT stage_id FROM action_log WHERE match_id IS NOT NULL");
    assert.ok(actionStages.every((row) => row.stage_id != null));
  });

  test("copies the legacy format, BO, rounds and participant count", async () => {
    const [swiss] = await rows<{
      format: string;
      best_of: number;
      planned_rounds: number;
      ranking_policy: string;
      participant_count: number;
    }>(
      "SELECT format, best_of, planned_rounds, ranking_policy, participant_count FROM tournament_stages WHERE tournament_id = $1",
      [tournamentIds[2]],
    );
    assert.deepEqual(swiss, {
      format: "swiss",
      best_of: 3,
      planned_rounds: 3,
      ranking_policy: "swiss_v1",
      participant_count: 2,
    });
    const [emptyDraft] = await rows<{ participant_count: number }>(
      "SELECT participant_count FROM tournament_stages WHERE tournament_id = $1",
      [tournamentIds[0]],
    );
    assert.equal(emptyDraft.participant_count, 0);
  });

  test("standard migration runner is idempotent and does not backfill twice", async () => {
    const beforeStages = await count("tournament_stages");
    const beforeParticipants = await count("stage_participants");
    const secondRun = await applyTournamentStagesMigration({
      connectionString: testConfig.connectionString,
      schema: testConfig.schema,
    });
    assert.equal(secondRun.applied, false);
    assert.equal(await count("tournament_stages"), beforeStages);
    assert.equal(await count("stage_participants"), beforeParticipants);
    const [marker] = await rows<{ count: number }>(
      "SELECT count(*)::integer AS count FROM app_schema_migrations WHERE migration_key = 'tournament_stages_v1'",
    );
    assert.equal(marker.count, 1);
  });

  test("standard migration runner rolls back the complete operation on failure", async () => {
    const rollbackSchema = `${testConfig.schema}_rollback`;
    const quotedSchema = `"${rollbackSchema}"`;
    await database.pool.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
    await database.pool.query(`CREATE SCHEMA ${quotedSchema}`);
    try {
      const baseSql = renderSeriesV1MigrationForTestSchema(
        await readFile(SERIES_V1_MIGRATION_URL, "utf8"),
        rollbackSchema,
      );
      await database.pool.query(baseSql);
      await database.pool.query(`CREATE TABLE ${quotedSchema}.tournament_stages (id integer)`);

      await assert.rejects(
        applyTournamentStagesMigration({
          connectionString: testConfig.connectionString,
          schema: rollbackSchema,
        }),
        (error: unknown) =>
          error instanceof Error &&
          "code" in error &&
          error.code === "42P07" &&
          error.message.includes("tournament_stages"),
      );
      const [marker] = await rows<{ count: number }>(
        `SELECT count(*)::int AS count FROM ${quotedSchema}.app_schema_migrations
         WHERE migration_key = 'tournament_stages_v1'`,
      );
      const [stageEnums] = await rows<{ count: number }>(
        `SELECT count(*)::int AS count
         FROM pg_type type
         JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
         WHERE namespace.nspname = $1 AND type.typname = 'tournament_stage_format'`,
        [rollbackSchema],
      );
      assert.equal(marker.count, 0);
      assert.equal(stageEnums.count, 0);
    } finally {
      await database.pool.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
    }
  });

  test("standard migration runner rejects a marker that diverges from schema state", async () => {
    const driftSchema = `${testConfig.schema}_marker_drift`;
    const quotedSchema = `"${driftSchema}"`;
    await database.pool.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
    await database.pool.query(`CREATE SCHEMA ${quotedSchema}`);
    try {
      const baseSql = renderSeriesV1MigrationForTestSchema(
        await readFile(SERIES_V1_MIGRATION_URL, "utf8"),
        driftSchema,
      );
      await database.pool.query(baseSql);
      await database.pool.query(
        `INSERT INTO ${quotedSchema}.app_schema_migrations (
           migration_key, app_commit, target_schema, deployment_environment
         ) VALUES ('tournament_stages_v1', 'invalid-fixture', $1, 'test')`,
        [driftSchema],
      );

      await assert.rejects(
        applyTournamentStagesMigration({
          connectionString: testConfig.connectionString,
          schema: driftSchema,
        }),
        /does not match the schema state/,
      );
    } finally {
      await database.pool.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
    }
  });
});
