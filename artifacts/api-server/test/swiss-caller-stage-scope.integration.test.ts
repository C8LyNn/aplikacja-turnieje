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
import { matchRevision } from "./match-revision-fixture";
import { calculateMatchRecordStandings, type StandingsMatch, type StandingsPlayer } from "../src/domain/tournament/standings";
import { generateSwissPairings } from "../src/domain/tournament/swiss";

type PoolModule = { pool: typeof import("@workspace/db").pool };
type DbMatch = {
  id: number;
  stage_id: number;
  round: number;
  match_number: number;
  player1_id: number;
  player2_id: number | null;
  winner_id: number | null;
  status: StandingsMatch["status"];
  result_type: StandingsMatch["resultType"];
  score1: number | null;
  score2: number | null;
};
type DbPlayer = {
  id: number;
  name: string;
  seed: number;
  stage_seed: number;
};

const SESSION_SECRET = "swiss-caller-r23c-" + randomUUID();
let app: Express;
let database: PoolModule;
let config: TestDatabaseConfig;
let initialized = false;
let organizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

async function rows<T>(query: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(query, values)).rows as T[];
}

async function stageMatches(stageId: number, round?: number): Promise<DbMatch[]> {
  return rows<DbMatch>(
    "SELECT id, stage_id, round, match_number, player1_id, player2_id, winner_id, " +
    "status, result_type, score1, score2 FROM matches WHERE stage_id = $1 " +
    "AND ($2::integer IS NULL OR round = $2) ORDER BY round, match_number",
    [stageId, round ?? null],
  );
}

function toStandingMatch(match: DbMatch): StandingsMatch {
  return {
    status: match.status,
    resultType: match.result_type,
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    winnerId: match.winner_id,
    score1: match.score1,
    score2: match.score2,
  };
}

function normalized(matches: DbMatch[]): Array<[number, number | null, string | null]> {
  return matches.map((match) => [
    match.player1_id,
    match.player2_id,
    match.result_type ?? null,
  ]);
}

async function stagePlayers(stageId: number): Promise<StandingsPlayer[]> {
  const data = await rows<DbPlayer>(
    "SELECT p.id, p.name, p.seed, member.stage_seed " +
    "FROM stage_participants member JOIN players p ON p.id = member.player_id " +
    "WHERE member.stage_id = $1 ORDER BY member.stage_seed",
    [stageId],
  );
  return data.map((player) => ({
    id: player.id, name: player.name, seed: player.stage_seed, status: "active",
  }));
}

async function organizerHeadersFor(tournamentId: number): Promise<Record<string, string>> {
  const [entry] = await rows<{ organizer_password_hash: string }>(
    "SELECT organizer_password_hash FROM tournaments WHERE id = $1",
    [tournamentId],
  );
  assert.ok(entry?.organizer_password_hash);
  return {
    "x-organizer-token": organizerToken(tournamentId, entry.organizer_password_hash),
  };
}

async function completePendingRound(stageId: number, headers: Record<string, string>): Promise<void> {
  const matches = (await stageMatches(stageId)).filter((match) => match.status === "pending");
  for (const match of matches) {
    assert.ok(match.player1_id && match.player2_id);
    await request(app)
      .post("/api/matches/" + match.id + "/complete")
      .set(headers)
      .send({
        expectedRevision: await matchRevision(database, match.id),
        resultType: "played",
        score1: 1,
        score2: 0,
      })
      .expect(200);
  }
}

before(async () => {
  // This guard fails closed unless the owner/A20 explicitly supplies an
  // isolated disposable PostgreSQL test database and authorizes schema reset.
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as PoolModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  organizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database) return;
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

test("S4 stage scope: Swiss stage B excludes A BYE, walkover and no_contest history for the SAME players", async () => {
  const created = await request(app)
    .post("/api/tournaments")
    .send({
      organizerPassword: "r23c-test-organizer-password",
      name: "Swiss stage history " + randomUUID(),
      format: "swiss",
      defaultBestOf: 1,
      stagePlan: {
        initialParticipantCount: 5,
        stages: [
          {
            key: "swiss-a", position: 1, name: "Swiss A",
            format: "swiss", participantCount: 5,
            bestOf: 1, rounds: 1, advancingCount: 5,
          },
          {
            key: "swiss-b", position: 2, name: "Swiss B",
            format: "swiss", participantCount: 5,
            bestOf: 1, rounds: 2,
          },
        ],
      },
    })
    .expect(201);
  const tournamentId = created.body.id as number;
  const headers = await organizerHeadersFor(tournamentId);

  for (let seed = 1; seed <= 5; seed += 1) {
    await request(app)
      .post("/api/tournaments/" + tournamentId + "/players")
      .set(headers)
      .send({ name: "Seed " + seed + "-" + randomUUID(), seed })
      .expect(201);
  }
  const stages = await rows<{ id: number; status: string }>(
    "SELECT id, status FROM tournament_stages WHERE tournament_id = $1 ORDER BY position",
    [tournamentId],
  );
  assert.equal(stages.length, 2);
  const [stageA, stageB] = stages;

  await request(app)
    .post("/api/tournaments/" + tournamentId + "/start")
    .set(headers)
    .expect(200);
  const aRound1 = await stageMatches(stageA.id, 1);
  assert.equal(aRound1.length, 3);
  assert.equal(aRound1.filter((match) => match.result_type === "bye").length, 1);
  const foreignByePlayerId = aRound1.find((match) => match.result_type === "bye")!.player1_id;

  await completePendingRound(stageA.id, headers);
  await request(app)
    .post("/api/tournaments/" + tournamentId + "/stages/" + stageA.id + "/complete")
    .set(headers)
    .expect(200);

  await request(app)
    .post("/api/tournaments/" + tournamentId + "/stages/" + stageB.id + "/start")
    .set(headers)
    .expect(200);

  const memberOverlap = await rows<{ player_id: number }>(
    "SELECT a.player_id FROM stage_participants a " +
    "JOIN stage_participants b ON a.player_id = b.player_id " +
    "WHERE a.stage_id = $1 AND b.stage_id = $2 ORDER BY a.player_id",
    [stageA.id, stageB.id],
  );
  assert.equal(memberOverlap.length, 5, "the same five players must exist in A and B");

  const bRound1 = await stageMatches(stageB.id, 1);
  assert.equal(bRound1.length, 3);
  assert.equal(bRound1.filter((match) => match.result_type === "bye").length, 1);
  await completePendingRound(stageB.id, headers);

  const bPlayers = await stagePlayers(stageB.id);
  const bHistory = await stageMatches(stageB.id, 1);
  const aHistory = await stageMatches(stageA.id);
  assert.ok(aHistory.some((match) => match.player1_id === foreignByePlayerId &&
    match.result_type === "bye"));

  const standings = calculateMatchRecordStandings(
    bPlayers,
    bHistory.map(toStandingMatch),
    "swiss",
  );
  const expected = generateSwissPairings({
    players: bPlayers,
    standings,
    previousMatches: bHistory.map(toStandingMatch),
    round: 2,
  });

  // Test-only adversarial history in *completed* stage A. This exists solely
  // to expose a future accidental tournament-wide query. It must not affect
  // the legal stage B pairing: only stage_id=B rows are permitted inputs.
  const expectedBye = expected.find((pairing) => pairing.resultType === "bye");
  assert.ok(expectedBye);
  const adversarialPlayer = expectedBye.player1Id;
  await database.pool.query(
    "INSERT INTO matches (tournament_id, stage_id, round, match_number, best_of, " +
    "status, result_type, result_reason, player1_id, player2_id, winner_id, completed_at) " +
    "VALUES ($1, $2, 99, 99, 1, 'completed', 'bye', 'system_bye', $3, NULL, $3, NOW())",
    [tournamentId, stageA.id, adversarialPlayer],
  );

  const foreign = (await stageMatches(stageA.id)).map(toStandingMatch);
  const counterfactual = generateSwissPairings({
    players: bPlayers, standings,
    previousMatches: [...bHistory.map(toStandingMatch), ...foreign],
    round: 2,
  });
  assert.notEqual(
    counterfactual.find((pairing) => pairing.resultType === "bye")?.player1Id,
    adversarialPlayer,
    "the adversarial foreign-stage BYE must distinguish a leaking caller",
  );

  await request(app)
    .post("/api/tournaments/" + tournamentId + "/generate-round")
    .set(headers)
    .expect(200);

  const bRound2 = await stageMatches(stageB.id, 2);
  assert.equal(bRound2.length, 3);
  assert.deepEqual(normalized(bRound2),
    expected.map((pairing) => [pairing.player1Id, pairing.player2Id, pairing.resultType]));
  assert.equal(bRound2.filter((match) => match.result_type === "bye").length, 1);
  assert.ok(bRound2.every((match) => match.stage_id === stageB.id));

  const [state] = await rows<{ tournament_status: string; active_stage_id: number; current_round: number }>(
    "SELECT status AS tournament_status, active_stage_id, current_round FROM tournaments WHERE id = $1",
    [tournamentId],
  );
  assert.deepEqual(state, {
    tournament_status: "active",
    active_stage_id: stageB.id,
    current_round: 2,
  });
  const [aState] = await rows<{ status: string }>(
    "SELECT status FROM tournament_stages WHERE id = $1",
    [stageA.id],
  );
  assert.equal(aState.status, "completed");
});

test("S4-H completed walkover/no_contest are opponents, cancelled excluded, with deterministic bounded 32/65", () => {
  const makePlayers = (n: number): StandingsPlayer[] =>
    Array.from({ length: n }, (_, i) => ({
      id: i + 1, name: "P" + (i + 1), seed: i + 1, status: "active",
    }));
  const makeStandings = (players: StandingsPlayer[]) => players.map((player, i) => ({
    playerId: player.id,
    playerName: player.name,
    rankName: null, teamName: null, country: null,
    seed: player.seed ?? null, status: player.status, rank: i + 1,
    matchesPlayed: 0, matchWins: 10 - Math.floor(i / 4),
    matchLosses: 0, gameWins: 0, gameLosses: 0,
    gameDiff: 0, buchholz: 0,
  }));
  const four = makePlayers(4);
  const fourStandings = makeStandings(four);
  for (const resultType of ["walkover", "no_contest"] as const) {
    const pairings = generateSwissPairings({
      players: four, standings: fourStandings,
      previousMatches: [{ status: "completed", resultType, player1Id: 1, player2Id: 2 }],
      round: 3,
    });
    assert.notDeepEqual([pairings[0].player1Id, pairings[0].player2Id], [1, 2]);
  }
  assert.deepEqual(
    generateSwissPairings({
      players: four, standings: fourStandings,
      previousMatches: [{ status: "cancelled", resultType: "played", player1Id: 1, player2Id: 2 }],
      round: 3,
    }).map((item) => [item.player1Id, item.player2Id]),
    [[1, 2], [3, 4]],
  );
  for (const size of [32, 65]) {
    const players = makePlayers(size);
    const standings = makeStandings(players);
    const history: StandingsMatch[] = [];
    for (let i = 1; i < size; i += 2) {
      history.push({ status: "completed", resultType: "walkover", player1Id: i, player2Id: i + 1 });
    }
    const a = generateSwissPairings({ players, standings, previousMatches: history, round: 4 });
    const b = generateSwissPairings({
      players: [...players].reverse(),
      standings: [...standings].reverse(),
      previousMatches: [...history].reverse(),
      round: 4,
    });
    assert.deepEqual(a, b, "same history must always generate identical pairings");
    const seen = a.flatMap((pairing) => pairing.player2Id === null
      ? [pairing.player1Id] : [pairing.player1Id, pairing.player2Id]);
    assert.equal(seen.length, size);
    assert.equal(new Set(seen).size, size);
    assert.equal(a.filter((item) => item.resultType === "bye").length, size % 2);
  }
});
