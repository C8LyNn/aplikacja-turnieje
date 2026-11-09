import { matchRevision } from "./match-revision-fixture";
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

type DbModule = typeof import("@workspace/db");

let app: Express;
let database: DbModule;
let config: TestDatabaseConfig;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `double-elimination-api-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});

after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

test("accepts ten-stage authoring plans and rejects an eleventh stage through the public API", async () => {
  const tenStages = Array.from({ length: 10 }, (_, index) => ({
    key: `stage-${index + 1}`,
    position: index + 1,
    name: `Stage ${index + 1}`,
    format: index === 9 ? "double_elimination" : "round_robin",
    participantCount: 2,
    bestOf: 1,
    entrySeedingMethod: "preserve",
    ...(index === 9
      ? { placementMethod: "standard" }
      : { advancingCount: 2 }),
  }));
  const input = {
    organizerPassword: "de-regression-password",
    name: `Ten-stage plan ${randomUUID()}`,
    format: "round_robin",
    defaultBestOf: 1,
    stagePlan: { initialParticipantCount: 2, stages: tenStages },
  };

  const accepted = await request(app).post("/api/tournaments").send(input).expect(201);
  const stages = await request(app).get(`/api/tournaments/${accepted.body.id}/stages`).expect(200);
  assert.equal(stages.body.length, 10);

  const rejected = await request(app)
    .post("/api/tournaments")
    .send({
      ...input,
      name: `Eleven-stage plan ${randomUUID()}`,
      stagePlan: {
        initialParticipantCount: 2,
        stages: [
          ...tenStages.slice(0, 9),
          { ...tenStages[8], key: "stage-10", position: 10, name: "Stage 10" },
          { ...tenStages[9], key: "stage-11", position: 11, name: "Stage 11" },
        ],
      },
    })
    .expect(400);
  assert.equal(typeof rejected.body.error, "string");
});

test("[before V3 import] runs, corrects, resets and restores a public Double Elimination tournament", async (swarm006V3TestContext) => {
  const created = await request(app)
    .post("/api/tournaments")
    .send({
      organizerPassword: "de-regression-password",
      name: `Double Elimination API ${randomUUID()}`,
      format: "single_elimination",
      defaultBestOf: 3,
      supportPassword: "double-elimination-support",
      stagePlan: {
        initialParticipantCount: 4,
        stages: [{
          key: "double-final",
          position: 1,
          name: "Double Elimination",
          format: "double_elimination",
          participantCount: 4,
          bestOf: 3,
          entrySeedingMethod: "preserve",
          placementMethod: "standard",
        }],
      },
    })
    .expect(201);
  const tournamentId = created.body.id as number;
  const organizer = { "x-organizer-token": created.body.organizerToken as string };
  assert.ok(organizer["x-organizer-token"]);

  for (let seed = 1; seed <= 4; seed += 1) {
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set(organizer)
      .send({ name: `DE Player ${seed}`, seed })
      .expect(201);
    if (seed === 1) {
      const plannedCount = await database.pool.query<{ participant_count: number }>(
        "SELECT participant_count FROM tournament_stages WHERE tournament_id = $1 AND position = 1",
        [tournamentId],
      );
      assert.equal(plannedCount.rows[0].participant_count, 4);
    }
  }
  const stages = await request(app)
    .get(`/api/tournaments/${tournamentId}/stages`)
    .expect(200);
  const stageId = stages.body[0].id as number;
  assert.equal(stages.body[0].format, "double_elimination");

  await request(app)
    .post(`/api/tournaments/${tournamentId}/start`)
    .set(organizer)
    .expect(200);
  const executionRows = await database.pool.query<{
    plan_id: number;
    stage_key: string;
    revision: number;
  }>("SELECT plan_id, stage_key, revision FROM tournament_routing_executions");
  assert.equal(executionRows.rowCount, 1);
  const initialStateResponse = await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`);
  assert.equal(initialStateResponse.status, 200, initialStateResponse.text);
  let state = initialStateResponse.body;
  assert.equal(state.revision, 1);
  assert.equal(state.participants.length, 4);
  assert.ok(state.matches.some((match: { bracket: string; status: string }) =>
    match.bracket === "upper" && match.status === "ready"));

  const first = state.matches.find((match: { status: string }) => match.status === "ready");
  assert.ok(first?.matchId, "a ready routing match must have a canonical match id");
  await request(app)
    .post(`/api/matches/${first.matchId}/complete`)
    .send({ expectedRevision: await matchRevision(database, first.matchId), ...({ resultType: "played", score1: 2, score2: 0 }) })
    .expect(403);

  const incompleteSeries = await request(app)
    .post(`/api/matches/${first.matchId}/complete`)
    .set(organizer)
    .send({ expectedRevision: await matchRevision(database, first.matchId), ...({ resultType: "played", score1: 1, score2: 0 }) });
  assert.equal(incompleteSeries.status, 422, incompleteSeries.text);

  const concurrentCompletions = await Promise.all([
    request(app)
      .post(`/api/matches/${first.matchId}/complete`)
      .set(organizer)
      .send({ expectedRevision: await matchRevision(database, first.matchId), ...({ resultType: "played", score1: 2, score2: 1 }) }),
    request(app)
      .post(`/api/matches/${first.matchId}/complete`)
      .set(organizer)
      .send({ expectedRevision: await matchRevision(database, first.matchId), ...({ resultType: "played", score1: 2, score2: 1 }) }),
  ]);
  assert.deepEqual(
    concurrentCompletions.map((response) => response.status).sort((left, right) => left - right),
    [200, 409],
  );
  const completed = concurrentCompletions.find((response) => response.status === 200)!;
  assert.equal(completed.body.bestOf, 3);
  assert.equal(completed.body.routingMatchKey, first.matchKey);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;
  assert.equal(state.revision, 2);
  assert.equal(
    state.matches.find((match: { matchKey: string }) => match.matchKey === first.matchKey).winnerParticipantKey,
    first.slots[0],
  );
  const audit = await database.pool.query<{ history_count: number; action_count: number }>(
    `SELECT
       (SELECT count(*)::int FROM result_history WHERE match_id = $1) AS history_count,
       (SELECT count(*)::int FROM action_log WHERE match_id = $1 AND action_type = 'match_result_submitted') AS action_count`,
    [first.matchId],
  );
  assert.deepEqual(audit.rows[0], { history_count: 1, action_count: 1 });

  await request(app)
    .post(`/api/matches/${first.matchId}/revert`)
    .set(organizer)
    .expect(200);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;
  assert.equal(state.revision, 3);
  assert.equal(state.matches.find((match: { matchKey: string }) => match.matchKey === first.matchKey).status, "ready");

  const concurrentResets = await Promise.all([
    request(app)
      .post(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination/reset`)
      .set(organizer)
      .send({ expectedRevision: state.revision }),
    request(app)
      .post(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination/reset`)
      .set(organizer)
      .send({ expectedRevision: state.revision }),
  ]);
  assert.deepEqual(
    concurrentResets.map((response) => response.status).sort((left, right) => left - right),
    [200, 409],
  );
  const resetReceipt = concurrentResets.find((response) => response.status === 200)!.body;
  assert.equal(resetReceipt.revision, 4);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;
  assert.equal(state.matches.filter((match: { status: string }) => match.status === "completed").length, 0);

  const supportLogin = await request(app)
    .post(`/api/tournaments/${tournamentId}/auth/support-login`)
    .send({ password: "double-elimination-support", nick: "DE moderator" })
    .expect(200);
  const support = { "x-support-token": supportLogin.body.sessionToken as string };
  const supportReady = state.matches.find((match: { status: string }) => match.status === "ready");
  assert.ok(supportReady?.matchId);
  await request(app)
    .post(`/api/matches/${supportReady.matchId}/complete`)
    .set(support)
    .send({ expectedRevision: await matchRevision(database, supportReady.matchId), ...({ resultType: "played", score1: 2, score2: 0 }) })
    .expect(200);
  await request(app)
    .post(`/api/matches/${supportReady.matchId}/revert`)
    .set(support)
    .expect(200);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;
  await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination/reset`)
    .set(support)
    .send({ expectedRevision: state.revision })
    .expect(403);
  await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination/reset`)
    .set(organizer)
    .send({ expectedRevision: state.revision })
    .expect(200);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;

  const upperRoundOne = state.matches.filter((match: { name: string; status: string }) =>
    match.name.startsWith("Upper R1") && match.status === "ready");
  assert.equal(upperRoundOne.length, 2);
  for (const upperMatch of upperRoundOne) {
    await request(app)
      .post(`/api/matches/${upperMatch.matchId}/complete`)
      .set(organizer)
      .send({ expectedRevision: await matchRevision(database, upperMatch.matchId), ...({ resultType: "played", score1: 2, score2: 0 }) })
      .expect(200);
  }
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;
  const lowerRoundOne = state.matches.find((match: { name: string; status: string }) =>
    match.name === "Lower R1 M1" && match.status === "ready");
  assert.ok(lowerRoundOne?.matchId);
  await request(app)
    .put(`/api/matches/${lowerRoundOne.matchId}/game-picks/1`)
    .set(organizer)
    .send({ player1HeroId: "wraith", player2HeroId: "shiv" })
    .expect(200);
  await request(app)
    .post(`/api/matches/${lowerRoundOne.matchId}/complete`)
    .set(organizer)
    .send({ expectedRevision: await matchRevision(database, lowerRoundOne.matchId), ...({ resultType: "played", score1: 2, score2: 0 }) })
    .expect(200);
  await request(app)
    .post(`/api/matches/${upperRoundOne[0].matchId}/revert`)
    .set(organizer)
    .expect(200);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;
  assert.notEqual(
    state.matches.find((match: { matchKey: string }) => match.matchKey === lowerRoundOne.matchKey).status,
    "completed",
  );
  const invalidatedPicks = await database.pool.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM match_game_picks WHERE match_id = $1",
    [lowerRoundOne.matchId],
  );
  assert.equal(invalidatedPicks.rows[0].count, 0);
  const readyParticipantKeys = state.matches
    .filter((match: { status: string }) => match.status === "ready")
    .flatMap((match: { slots: Array<string | null> }) => match.slots.filter(Boolean));
  assert.equal(new Set(readyParticipantKeys).size, readyParticipantKeys.length);
  await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination/reset`)
    .set(organizer)
    .send({ expectedRevision: state.revision })
    .expect(200);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;

  for (let guard = 0; guard < 20 && !state.completed; guard += 1) {
    const ready = state.matches.find((match: { status: string }) => match.status === "ready");
    assert.ok(ready, "an incomplete DE bracket must expose a ready match");
    assert.ok(ready.matchId, "every ready routing match must be materialized canonically");
    await request(app)
      .post(`/api/matches/${ready.matchId}/complete`)
      .set(organizer)
      .send({ expectedRevision: await matchRevision(database, ready.matchId), ...({
        resultType: "played",
        score1: ready.bracket === "grand_final" ? 0 : 2,
        score2: ready.bracket === "grand_final" ? 2 : 0,
      }) })
      .expect(200);
    state = (await request(app)
      .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
      .expect(200)).body;
  }
  assert.equal(state.completed, true);
  assert.ok(state.matches.some((match: { bracket: string; status: string }) =>
    match.bracket === "grand_final_reset" && match.status === "completed"));
  assert.equal(state.participants.filter((participant: { status: string }) => participant.status === "winner").length, 1);

  await request(app)
    .post(`/api/tournaments/${tournamentId}/stages/${stageId}/complete`)
    .set(organizer)
    .expect(200);
  assert.equal((await request(app).get(`/api/tournaments/${tournamentId}`).expect(200)).body.status, "completed");

  const exported = await request(app)
    .get(`/api/tournaments/${tournamentId}/export`)
    .set(organizer)
    .expect(200);
  assert.ok(exported.body.routingPlan);
  assert.equal(exported.body.routingExecutions.length, 1);

  const tournamentCountBeforeInvalidRestore = await database.pool.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM tournaments",
  );
  const corruptBackup = structuredClone(exported.body);
  corruptBackup.routingExecutions[0].state.decisions[0].matchKey = "missing/logical-match";
    await swarm006V3TestContext.test("V3 NOT_RUN: runs, corrects, resets and restores a public Double Elimination tournament", { skip: "Backup V3 import disabled (#152)" }, async () => {
  await request(app)
    .post("/api/tournaments/import")
    .send({ backup: corruptBackup, organizerPassword: "invalid-double-elimination" })
    .expect(400);
  const tournamentCountAfterInvalidRestore = await database.pool.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM tournaments",
  );
  assert.deepEqual(tournamentCountAfterInvalidRestore.rows[0], tournamentCountBeforeInvalidRestore.rows[0]);

  const restored = await request(app)
    .post("/api/tournaments/import")
    .send({ backup: exported.body, organizerPassword: "restored-double-elimination" })
    .expect(201);
  const restoredId = restored.body.tournament.id as number;
  const restoredStages = await request(app)
    .get(`/api/tournaments/${restoredId}/stages`)
    .expect(200);
  const restoredState = await request(app)
    .get(`/api/tournaments/${restoredId}/stages/${restoredStages.body[0].id}/double-elimination`)
    .expect(200);
  assert.equal(restoredState.body.completed, true);
  assert.equal(restoredState.body.championParticipantKey != null, true);
  assert.equal(restoredState.body.matches.length, state.matches.length);

    });
  });

test("uses canonical BO5 matches and enforces Deadlock stage bans per game", async () => {
  const created = await request(app)
    .post("/api/tournaments")
    .send({
      organizerPassword: "de-regression-password",
      name: `Double Elimination Deadlock ${randomUUID()}`,
      format: "single_elimination",
      defaultBestOf: 5,
      stagePlan: {
        initialParticipantCount: 2,
        stages: [{
          key: "deadlock-final",
          position: 1,
          name: "Deadlock Double Elimination",
          format: "double_elimination",
          participantCount: 2,
          bestOf: 5,
          entrySeedingMethod: "preserve",
          placementMethod: "standard",
        }],
      },
      gameConfig: {
        gameId: "deadlock",
        configVersion: 1,
        config: {
          banMode: "shared_pool",
          stageBans: [{ stageKey: "deadlock-final", bannedHeroIds: ["haze"] }],
        },
      },
    })
    .expect(201);
  const tournamentId = created.body.id as number;
  const organizer = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 2; seed += 1) {
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set(organizer)
      .send({ name: `Deadlock DE ${seed}`, seed })
      .expect(201);
  }
  const stages = await request(app).get(`/api/tournaments/${tournamentId}/stages`).expect(200);
  const stageId = stages.body[0].id as number;
  await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
  const state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
    .expect(200)).body;
  const ready = state.matches.find((match: { status: string }) => match.status === "ready");
  assert.ok(ready?.matchId);
  assert.equal(ready.bestOf, 5);

  await request(app)
    .put(`/api/matches/${ready.matchId}/game-picks/1`)
    .set(organizer)
    .send({ player1HeroId: "haze", player2HeroId: "wraith" })
    .expect(422);
  await request(app)
    .put(`/api/matches/${ready.matchId}/game-picks/1`)
    .set(organizer)
    .send({ player1HeroId: "wraith", player2HeroId: "shiv" })
    .expect(200);
  const picks = await request(app).get(`/api/matches/${ready.matchId}/game-picks`).expect(200);
  assert.deepEqual(
    picks.body.map((pick: { player1HeroId: string; player2HeroId: string }) =>
      [pick.player1HeroId, pick.player2HeroId]),
    [["wraith", "shiv"]],
  );

  await request(app)
    .post(`/api/matches/${ready.matchId}/complete`)
    .set(organizer)
    .send({ expectedRevision: await matchRevision(database, ready.matchId), ...({ resultType: "played", score1: 2, score2: 0 }) })
    .expect(422);
  await request(app)
    .post(`/api/matches/${ready.matchId}/complete`)
    .set(organizer)
    .send({ expectedRevision: await matchRevision(database, ready.matchId), ...({ resultType: "played", score1: 3, score2: 2 }) })
    .expect(200);
  const history = await database.pool.query<{ best_of: number; score1: number; score2: number }>(
    "SELECT best_of, score1, score2 FROM result_history WHERE match_id = $1",
    [ready.matchId],
  );
  assert.deepEqual(history.rows, [{ best_of: 5, score1: 3, score2: 2 }]);
});

test("[before V3 import] round-trips an active nine-player DE bracket with BO results and game picks", async (swarm006V3TestContext) => {
  const created = await request(app)
    .post("/api/tournaments")
    .send({
      organizerPassword: "de-regression-password",
      name: `Active DE Backup ${randomUUID()}`,
      format: "single_elimination",
      defaultBestOf: 3,
      stagePlan: {
        initialParticipantCount: 9,
        stages: [{
          key: "active-de",
          position: 1,
          name: "Active Double Elimination",
          format: "double_elimination",
          participantCount: 9,
          bestOf: 3,
          entrySeedingMethod: "preserve",
          placementMethod: "standard",
        }],
      },
      gameConfig: {
        gameId: "deadlock",
        configVersion: 1,
        config: { banMode: "shared_pool" },
      },
    })
    .expect(201);
  const tournamentId = created.body.id as number;
  const organizer = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 9; seed += 1) {
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set(organizer)
      .send({ name: `Backup Player ${seed}`, seed })
      .expect(201);
  }
  const [stage] = (await request(app).get(`/api/tournaments/${tournamentId}/stages`).expect(200)).body;
  await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);

  let state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination`)
    .expect(200)).body;
  for (let completedCount = 0; completedCount < 3; completedCount += 1) {
    const ready = state.matches.find((match: { status: string }) => match.status === "ready");
    assert.ok(ready?.matchId);
    await request(app)
      .put(`/api/matches/${ready.matchId}/game-picks/1`)
      .set(organizer)
      .send({ player1HeroId: "wraith", player2HeroId: "shiv" })
      .expect(200);
    await request(app)
      .post(`/api/matches/${ready.matchId}/complete`)
      .set(organizer)
      .send({ expectedRevision: await matchRevision(database, ready.matchId), ...({ resultType: "played", score1: 2, score2: 1 }) })
      .expect(200);
    state = (await request(app)
      .get(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination`)
      .expect(200)).body;
  }
  const pendingReady = state.matches.find((match: { status: string }) => match.status === "ready");
  assert.ok(pendingReady?.matchId);
  await request(app)
    .put(`/api/matches/${pendingReady.matchId}/game-picks/1`)
    .set(organizer)
    .send({ player1HeroId: "ivy", player2HeroId: "seven" })
    .expect(200);

  const exported = await request(app)
    .get(`/api/tournaments/${tournamentId}/export`)
    .set(organizer)
    .expect(200);
  assert.equal(exported.body.tournament.status, "active");
  assert.ok(exported.body.matches.filter((match: { routingMatchKey?: string }) => match.routingMatchKey).length > 3);
  assert.equal(exported.body.gamePicks.length, 4);
    await swarm006V3TestContext.test("V3 NOT_RUN: round-trips an active nine-player DE bracket with BO results and game picks", { skip: "Backup V3 import disabled (#152)" }, async () => {

  const restored = await request(app)
    .post("/api/tournaments/import")
    .send({ backup: exported.body, organizerPassword: "restored-active-de" })
    .expect(201);
  const restoredId = restored.body.tournament.id as number;
  const [restoredStage] = (await request(app).get(`/api/tournaments/${restoredId}/stages`).expect(200)).body;
  const restoredState = (await request(app)
    .get(`/api/tournaments/${restoredId}/stages/${restoredStage.id}/double-elimination`)
    .expect(200)).body;
  const normalizeState = (value: typeof state) => {
    const seedByParticipantKey = new Map<string, number>(value.participants.map((participant: {
      participantKey: string;
      seed: number;
    }) => [participant.participantKey, participant.seed]));
    const seed = (participantKey: string | null) => participantKey == null
      ? null
      : seedByParticipantKey.get(participantKey);
    return value.matches.map((match: {
      matchKey: string;
      status: string;
      slots: Array<string | null>;
      winnerParticipantKey: string | null;
    }) => ({
      matchKey: match.matchKey,
      status: match.status,
      slots: match.slots.map(seed),
      winnerSeed: seed(match.winnerParticipantKey),
    }));
  };
  assert.deepEqual(normalizeState(restoredState), normalizeState(state));

  const sourcePicks = await database.pool.query<{
    routing_match_key: string;
    game_number: number;
    player1_hero_id: string;
    player2_hero_id: string;
  }>(
    `SELECT m.routing_match_key, p.game_number, p.player1_hero_id, p.player2_hero_id
       FROM match_game_picks p
       JOIN matches m ON m.id = p.match_id
      WHERE m.tournament_id = $1
      ORDER BY m.routing_match_key, p.game_number`,
    [tournamentId],
  );
  const restoredPicks = await database.pool.query<{
    routing_match_key: string;
    game_number: number;
    player1_hero_id: string;
    player2_hero_id: string;
  }>(
    `SELECT m.routing_match_key, p.game_number, p.player1_hero_id, p.player2_hero_id
       FROM match_game_picks p
       JOIN matches m ON m.id = p.match_id
      WHERE m.tournament_id = $1
      ORDER BY m.routing_match_key, p.game_number`,
    [restoredId],
  );
  assert.deepEqual(restoredPicks.rows, sourcePicks.rows);

    });
  });

test("serializes CompleteMatch against correction and correction against reset", async () => {
  const created = await request(app)
    .post("/api/tournaments")
    .send({
      organizerPassword: "de-regression-password",
      name: `Concurrent DE ${randomUUID()}`,
      format: "single_elimination",
      defaultBestOf: 1,
      stagePlan: {
        initialParticipantCount: 2,
        stages: [{
          key: "concurrent-de",
          position: 1,
          name: "Concurrent Double Elimination",
          format: "double_elimination",
          participantCount: 2,
          bestOf: 1,
          entrySeedingMethod: "preserve",
          placementMethod: "standard",
        }],
      },
    })
    .expect(201);
  const tournamentId = created.body.id as number;
  const organizer = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 2; seed += 1) {
    await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set(organizer)
      .send({ name: `Concurrent Player ${seed}`, seed })
      .expect(201);
  }
  const [stage] = (await request(app).get(`/api/tournaments/${tournamentId}/stages`).expect(200)).body;
  await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
  let state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination`)
    .expect(200)).body;
  let ready = state.matches.find((match: { status: string }) => match.status === "ready");
  assert.ok(ready?.matchId);
  await request(app)
    .post(`/api/matches/${ready.matchId}/complete`)
    .set(organizer)
    .send({ expectedRevision: await matchRevision(database, ready.matchId), ...({ resultType: "played", score1: 1, score2: 0 }) })
    .expect(200);

  const completeVsCorrection = await Promise.all([
    request(app)
      .post(`/api/matches/${ready.matchId}/complete`)
      .set(organizer)
      .send({ expectedRevision: await matchRevision(database, ready.matchId), ...({ resultType: "played", score1: 1, score2: 0 }) }),
    request(app).post(`/api/matches/${ready.matchId}/revert`).set(organizer),
  ]);
  assert.deepEqual(
    completeVsCorrection.map((response) => response.status).sort((left, right) => left - right),
    [200, 409],
  );

  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination`)
    .expect(200)).body;
  ready = state.matches.find((match: { status: string }) => match.status === "ready");
  assert.ok(ready?.matchId);
  await request(app)
    .post(`/api/matches/${ready.matchId}/complete`)
    .set(organizer)
    .send({ expectedRevision: await matchRevision(database, ready.matchId), ...({ resultType: "played", score1: 1, score2: 0 }) })
    .expect(200);
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination`)
    .expect(200)).body;

  const correctionVsReset = await Promise.all([
    request(app).post(`/api/matches/${ready.matchId}/revert`).set(organizer),
    request(app)
      .post(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination/reset`)
      .set(organizer)
      .send({ expectedRevision: state.revision }),
  ]);
  assert.deepEqual(
    correctionVsReset.map((response) => response.status).sort((left, right) => left - right),
    [200, 409],
  );
  state = (await request(app)
    .get(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination`)
    .expect(200)).body;
  const activeParticipantKeys = state.matches
    .filter((match: { status: string }) => match.status === "ready")
    .flatMap((match: { slots: Array<string | null> }) => match.slots.filter(Boolean));
  assert.equal(new Set(activeParticipantKeys).size, activeParticipantKeys.length);
});
