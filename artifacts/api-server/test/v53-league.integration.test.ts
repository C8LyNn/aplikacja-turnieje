import { matchRevision } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

interface DatabaseModule { pool: typeof import("@workspace/db").pool }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

const SESSION_SECRET = `v53-league-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let workDir = "";
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let validateBackupV3: typeof import("../src/application/backups/backup-v3").validateBackupV3;

async function rows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  signOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  validateBackupV3 = (await import("../src/application/backups/backup-v3")).validateBackupV3;
  app = (await import("../src/app")).default;
  workDir = await mkdtemp(path.join(tmpdir(), "tm-v53-league-"));
});

after(async () => {
  if (workDir) await rm(workDir, { recursive: true, force: true });
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function headersFor(tournamentId: number): Promise<Record<string, string>> {
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  return { "x-organizer-token": signOrganizerToken(tournamentId, row!.organizer_password_hash) };
}

async function createLeague(params: Record<string, number>, extra: Record<string, unknown> = {}, presetId = "round_robin") {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `Liga ${randomUUID()}`, organizerPassword: "integration-organizer-password", ...preview.creation, ...extra })
    .expect(201);
  const tournamentId = created.body.id as number;
  const headers = await headersFor(tournamentId);
  const ids: number[] = [];
  for (let index = 1; index <= params.participantCount!; index += 1) {
    ids.push((await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name: `P${index}-${randomUUID().slice(0, 5)}` }).expect(201)).body.id);
  }
  const [stage] = await rows<{ id: number; version: number }>("SELECT id, version FROM tournament_stages WHERE tournament_id = $1 ORDER BY position LIMIT 1", [tournamentId]);
  return { preview, tournamentId, headers, ids, stageId: stage!.id };
}

async function complete(headers: Record<string, string>, matchId: number, score1: number, score2: number, expect = 200) {
  return request(app).post(`/api/matches/${matchId}/complete`).set(headers)
    .send({ expectedRevision: await matchRevision(database, matchId), resultType: "played", score1, score2 })
    .expect(expect);
}

type MatchRow = { id: number; round: number; match_number: number; player1_id: number; player2_id: number; status: string; score1: number | null; score2: number | null; winner_id: number | null; result_type: string | null };

async function stageMatches(stageId: number): Promise<MatchRow[]> {
  return rows<MatchRow>("SELECT id, round, match_number, player1_id, player2_id, status, score1, score2, winner_id, result_type FROM matches WHERE stage_id = $1 ORDER BY round, match_number", [stageId]);
}

/** Independent re-computation of a 3/1/0-style table straight from the stored matches. */
function expectedTable(matches: MatchRow[], points: { win: number; draw: number; loss: number }) {
  const table = new Map<number, { points: number; wins: number; draws: number; losses: number; diff: number; played: number }>();
  const row = (id: number) => {
    if (!table.has(id)) table.set(id, { points: 0, wins: 0, draws: 0, losses: 0, diff: 0, played: 0 });
    return table.get(id)!;
  };
  for (const match of matches.filter((candidate) => candidate.status === "completed" && candidate.result_type === "played")) {
    const left = row(match.player1_id);
    const right = row(match.player2_id);
    left.played += 1; right.played += 1;
    left.diff += match.score1! - match.score2!; right.diff += match.score2! - match.score1!;
    if (match.winner_id == null) {
      left.draws += 1; right.draws += 1; left.points += points.draw; right.points += points.draw;
    } else if (match.winner_id === match.player1_id) {
      left.wins += 1; right.losses += 1; left.points += points.win; right.points += points.loss;
    } else {
      right.wins += 1; left.losses += 1; right.points += points.win; left.points += points.loss;
    }
  }
  return table;
}

function assertTableConsistent(standings: Json[], matches: MatchRow[], points: { win: number; draw: number; loss: number }) {
  const expected = expectedTable(matches, points);
  for (const entry of standings) {
    const own = expected.get(entry.playerId) ?? { points: 0, wins: 0, draws: 0, losses: 0, diff: 0, played: 0 };
    assert.deepEqual(
      { points: entry.points, wins: entry.matchWins, draws: entry.matchDraws, losses: entry.matchLosses, diff: entry.gameDiff, played: entry.matchesPlayed },
      own,
      `table row of player ${entry.playerId}`,
    );
  }
  for (let index = 1; index < standings.length; index += 1) {
    assert.ok(standings[index - 1].points >= standings[index].points, "table is ordered by points");
    if (standings[index - 1].points > standings[index].points) assert.equal(standings[index].decidedBy, "points");
  }
  assert.deepEqual(standings.map((entry: Json) => entry.rank), standings.map((_: Json, index: number) => index + 1));
}

describe("V5.3 leagues: draws, points, schedule (PostgreSQL)", () => {
  test("scenario 1+5: 8-player single round league with draws ends with a consistent 3/1/0 table and the right champion", async () => {
    const { tournamentId, headers, stageId, preview } = await createLeague({ participantCount: 8, allowDraws: 1 });
    assert.equal(preview.participants.mode, "up_to", "single-leg league keeps a flexible participant count");
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const matches = await stageMatches(stageId);
    assert.equal(matches.length, 28);
    assert.equal(Math.max(...matches.map((match) => match.round)), 7);
    for (const [index, match] of matches.entries()) {
      if (index % 4 === 0) await complete(headers, match.id, 1, 1);
      else await complete(headers, match.id, (match.player1_id + index) % 3, ((match.player2_id + index) % 3 + 1) % 3 === (match.player1_id + index) % 3 ? 3 : ((match.player2_id + index) % 3 + 1) % 3);
    }
    const finalMatches = await stageMatches(stageId);
    assert.ok(finalMatches.every((match) => match.status === "completed"));
    const draws = finalMatches.filter((match) => match.winner_id == null);
    assert.ok(draws.length >= 7, "draws are stored as played results without a winner");
    assert.ok(draws.every((match) => match.result_type === "played" && match.score1 === match.score2));
    const standings = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[];
    assertTableConsistent(standings, finalMatches, { win: 3, draw: 1, loss: 0 });
    const totalPoints = standings.reduce((sum: number, entry: Json) => sum + entry.points, 0);
    assert.equal(totalPoints, 3 * (28 - draws.length) + 2 * draws.length);
    const [tournament] = await rows<{ status: string; winner_id: number }>("SELECT status, winner_id FROM tournaments WHERE id = $1", [tournamentId]);
    assert.equal(tournament!.status, "completed");
    assert.equal(tournament!.winner_id, standings[0].playerId, "champion = leader of the points table");
    const [stage] = await rows<{ status: string; winner_id: number }>("SELECT status, winner_id FROM tournament_stages WHERE id = $1", [stageId]);
    assert.equal(stage!.winner_id, standings[0].playerId);
    const stageView = (await request(app).get(`/api/tournaments/${tournamentId}/stages`).expect(200)).body[0];
    assert.match(stageView.leagueRulesSummary ?? "", /zwycięstwo 3 pkt, remis 1 pkt/);
  });

  test("scenario 2: 8 players home and away — 56 matches in 14 rounds, second leg swaps sides, table counts both", async () => {
    const { tournamentId, headers, stageId } = await createLeague({ participantCount: 8, legs: 2 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const matches = await stageMatches(stageId);
    assert.equal(matches.length, 56);
    assert.equal(Math.max(...matches.map((match) => match.round)), 14);
    const firstLeg = matches.filter((match) => match.round <= 7);
    for (const match of firstLeg) {
      assert.ok(matches.some((other) => other.round === match.round + 7 && other.player1_id === match.player2_id && other.player2_id === match.player1_id));
    }
    for (const match of matches) await complete(headers, match.id, match.player1_id < match.player2_id ? 1 : 0, match.player1_id < match.player2_id ? 0 : 1);
    const finalMatches = await stageMatches(stageId);
    const standings = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[];
    assertTableConsistent(standings, finalMatches, { win: 3, draw: 1, loss: 0 });
    assert.ok(standings.every((entry: Json) => entry.matchesPlayed === 14 && entry.matchDraws === 0));
    assert.equal(standings.reduce((sum: number, entry: Json) => sum + entry.points, 0), 56 * 3);
  });

  test("scenario 3: 7 players — 21 matches over 7 rounds, one resting player per round, everyone rests once", async () => {
    const { tournamentId, headers, stageId, ids } = await createLeague({ participantCount: 7 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const schedule = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stageId}/schedule`).expect(200)).body;
    assert.equal(schedule.rounds.length, 7);
    assert.equal(schedule.counts.total, 21);
    assert.ok(schedule.rounds.every((round: Json) => round.resting.length === 1 && round.total === 3));
    assert.deepEqual(schedule.rounds.map((round: Json) => round.resting[0].playerId).sort((a: number, b: number) => a - b), [...ids].sort((a, b) => a - b));
    assert.equal(schedule.currentRound, 1);
    assert.equal(schedule.counts.unscheduled, 21);
    assert.equal(schedule.timeZoneSource, "default");
  });

  test("scenario 4: team league with draws — rosters gate the start, draws and points work for teams", async () => {
    const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId: "round_robin", params: { participantCount: 4, allowDraws: 1 } }).expect(200)).body;
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Liga drużyn ${randomUUID()}`, organizerPassword: "integration-organizer-password", ...preview.creation, participantType: "teams", teamRosterMin: 2, teamRosterMax: 3 })
      .expect(201);
    const tournamentId = created.body.id as number;
    const headers = await headersFor(tournamentId);
    const entries: number[] = [];
    for (const teamName of ["Orły", "Wilki", "Rysie", "Sowy"]) {
      const entryId = (await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name: teamName }).expect(201)).body.id as number;
      entries.push(entryId);
      await request(app).post(`/api/tournaments/${tournamentId}/teams/${entryId}/members`).set(headers).send({ name: `Kapitan ${teamName}`, role: "captain" }).expect(201);
    }
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(422);
    for (const [index, entryId] of entries.entries()) {
      await request(app).post(`/api/tournaments/${tournamentId}/teams/${entryId}/members`).set(headers).send({ name: `Gracz ${index}` }).expect(201);
    }
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const [stage] = await rows<{ id: number }>("SELECT id FROM tournament_stages WHERE tournament_id = $1", [tournamentId]);
    const matches = await stageMatches(stage!.id);
    assert.equal(matches.length, 6);
    for (const [index, match] of matches.entries()) await complete(headers, match.id, index % 2 === 0 ? 2 : 1, index % 2 === 0 ? 2 : 0);
    const standings = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[];
    assertTableConsistent(standings, await stageMatches(stage!.id), { win: 3, draw: 1, loss: 0 });
    assert.equal(standings.reduce((sum: number, entry: Json) => sum + entry.matchDraws, 0), 6, "3 draws × 2 teams");
  });

  test("scenario 6: a draw corrected to a win — revert + new result, table and history follow", async () => {
    const { tournamentId, headers, stageId } = await createLeague({ participantCount: 4, allowDraws: 1 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const [first] = await stageMatches(stageId);
    await complete(headers, first!.id, 2, 2);
    const pointsOf = async (playerId: number) =>
      ((await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[]).find((entry) => entry.playerId === playerId).points;
    assert.equal(await pointsOf(first!.player1_id), 1);
    assert.equal(await pointsOf(first!.player2_id), 1);
    await request(app).post(`/api/matches/${first!.id}/revert`).set(headers).expect(200);
    assert.equal(await pointsOf(first!.player1_id), 0);
    await complete(headers, first!.id, 3, 2);
    assert.equal(await pointsOf(first!.player1_id), 3);
    assert.equal(await pointsOf(first!.player2_id), 0);
    const history = await rows<{ revision: number; score1: number; score2: number; winner_id: number | null }>(
      "SELECT revision, score1, score2, winner_id FROM result_history WHERE match_id = $1 ORDER BY revision", [first!.id]);
    assert.deepEqual(history.map((entry) => [entry.score1, entry.score2, entry.winner_id]), [[2, 2, null], [3, 2, first!.player1_id]]);
    const log = await rows<{ description: string }>("SELECT description FROM action_log WHERE match_id = $1 AND action_type = 'match_result_submitted' ORDER BY id", [first!.id]);
    assert.match(log[0]!.description, /2:2 .*\(remis\)/);
    const apiHistory = (await request(app).get(`/api/tournaments/${tournamentId}/results-history`).expect(200)).body as Json[];
    assert.ok(apiHistory.some((entry) => entry.matchId === first!.id && entry.winnerId == null && entry.score1 === 2));
  });

  test("draws are refused where the rules do not allow them; old-style leagues keep series results", async () => {
    const noDraws = await createLeague({ participantCount: 4 });
    await request(app).post(`/api/tournaments/${noDraws.tournamentId}/start`).set(noDraws.headers).expect(200);
    const [match] = await stageMatches(noDraws.stageId);
    const refused = await complete(noDraws.headers, match!.id, 1, 1, 422);
    assert.equal(refused.body.code, "BOTH_SIDES_REACHED_WIN_THRESHOLD");
    const draws = await createLeague({ participantCount: 4, allowDraws: 1 });
    await request(app).post(`/api/tournaments/${draws.tournamentId}/start`).set(draws.headers).expect(200);
    const [drawMatch] = await stageMatches(draws.stageId);
    assert.equal((await complete(draws.headers, drawMatch!.id, 1000, 0, 422)).body.code, "SCORE_TOO_HIGH");
    assert.equal((await complete(draws.headers, drawMatch!.id, -1, 0, 422)).body.code, "SCORE_NEGATIVE");
    const longer = await request(app).patch(`/api/matches/${drawMatch!.id}`).set(draws.headers).send({ bestOf: 3 }).expect(422);
    assert.equal(longer.body.code, "BEST_OF_FIXED_FOR_DRAWS", "a draw league keeps one game per match");
  });

  test("scenario 7: points system changed before the league starts, locked after; stale and invalid edits refused", async () => {
    const { tournamentId, headers, stageId } = await createLeague({ participantCount: 4 });
    const read = async () => (await rows<{ version: number; league_rules: Json }>("SELECT version, league_rules FROM tournament_stages WHERE id = $1", [stageId]))[0]!;
    const before = await read();
    assert.deepEqual(before.league_rules.points, { win: 3, draw: 1, loss: 0 });
    const url = `/api/tournaments/${tournamentId}/stages/${stageId}/league-rules`;
    const updated = await request(app).put(url).set(headers)
      .send({ leagueRules: { allowDraws: true, points: { win: 2, draw: 1, loss: 0 }, tieBreakers: ["score_difference", "head_to_head"] }, expectedVersion: before.version })
      .expect(200);
    assert.match(updated.body.leagueRulesSummary, /zwycięstwo 2 pkt, remis 1 pkt/);
    assert.equal((await request(app).put(url).set(headers).send({ leagueRules: null, expectedVersion: before.version }).expect(409)).body.code, "STAGE_VERSION_CONFLICT");
    const current = await read();
    assert.equal((await request(app).put(url).set(headers).send({ leagueRules: { points: { win: 3, draw: 1, loss: 0 }, bonus: 1 }, expectedVersion: current.version }).expect(422)).body.code, "INVALID_LEAGUE_RULES");
    await request(app).put(url).send({ leagueRules: null, expectedVersion: current.version }).expect(403);
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const started = await read();
    assert.equal((await request(app).put(url).set(headers).send({ leagueRules: null, expectedVersion: started.version }).expect(409)).body.code, "STAGE_ALREADY_STARTED");
    const [match] = await stageMatches(stageId);
    await complete(headers, match!.id, 0, 0);
    const standings = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[];
    assert.equal(standings.find((entry) => entry.playerId === match!.player1_id).points, 1, "the new 2/1/0 rules with draws apply");
    const log = await rows<{ description: string }>("SELECT description FROM action_log WHERE stage_id = $1 AND action_type = 'league_rules_changed'", [stageId]);
    assert.equal(log.length, 1);
  });

  test("scenario 8 + schedule: dates in league time across DST, postponement keeps results and history", async () => {
    const { tournamentId, headers, stageId } = await createLeague(
      { participantCount: 4 },
      { scheduleTimeZone: "Europe/Warsaw", schedulePlan: { startDate: "2026-10-18", intervalDays: 7, defaultTime: "18:00" } },
    );
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const scheduled = await rows<{ round: number; at: string }>(
      "SELECT round, to_char(scheduled_at, 'YYYY-MM-DD\"T\"HH24:MI') AS at FROM matches WHERE stage_id = $1 ORDER BY round, match_number", [stageId]);
    assert.deepEqual([...new Set(scheduled.map((row) => `${row.round}@${row.at}`))], ["1@2026-10-18T16:00", "2@2026-10-25T17:00", "3@2026-11-01T17:00"],
      "stored as UTC instants; Warsaw 18:00 is 16:00Z before and 17:00Z after the October switch");
    const view = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stageId}/schedule`).expect(200)).body;
    assert.equal(view.timeZone, "Europe/Warsaw");
    assert.ok(view.rounds.flatMap((round: Json) => round.matches).every((match: Json) => match.localTime === "18:00"));
    assert.deepEqual(view.rounds.map((round: Json) => round.firstDate), ["2026-10-18", "2026-10-25", "2026-11-01"]);

    // Result first, so we can show the postponement does not touch other results.
    const matches = await stageMatches(stageId);
    await complete(headers, matches[0]!.id, 1, 0);
    const target = matches[1]!;
    await request(app).patch(`/api/matches/${target.id}`).set(headers).send({ status: "postponed" }).expect(200);
    await request(app).put(`/api/matches/${target.id}/schedule`).set(headers).send({ date: "2026-11-04", time: "19:30" }).expect(200);
    await request(app).patch(`/api/matches/${target.id}`).set(headers).send({ status: "pending" }).expect(200);
    const [moved] = await rows<{ at: string; status: string }>("SELECT to_char(scheduled_at, 'YYYY-MM-DD\"T\"HH24:MI') AS at, status FROM matches WHERE id = $1", [target.id]);
    assert.deepEqual(moved, { at: "2026-11-04T18:30", status: "pending" });
    const [kept] = await stageMatches(stageId);
    assert.deepEqual([kept!.status, kept!.score1, kept!.score2], ["completed", 1, 0]);
    await complete(headers, target.id, 0, 1);
    const types = (await rows<{ action_type: string }>("SELECT action_type FROM action_log WHERE match_id = $1 ORDER BY id", [target.id])).map((row) => row.action_type);
    assert.deepEqual(types, ["match_postponed", "match_rescheduled", "match_restored", "match_result_submitted"]);
    const played = (await request(app).put(`/api/matches/${target.id}/schedule`).set(headers).send({ date: "2026-11-05", time: "19:30" }).expect(422)).body;
    assert.equal(played.code, "MATCH_SCHEDULE_LOCKED");
    const gap = (await request(app).put(`/api/matches/${matches[2]!.id}/schedule`).set(headers).send({ date: "2027-03-28", time: "02:30" }).expect(422)).body;
    assert.equal(gap.code, "LOCAL_TIME_DOES_NOT_EXIST");
    const wrongZone = (await request(app).put(`/api/matches/${matches[2]!.id}/schedule`).set(headers).send({ date: "2026-11-05", time: "19:30", timeZone: "UTC" }).expect(422)).body;
    assert.equal(wrongZone.code, "TIME_ZONE_MISMATCH");
  });

  test("V5.6: a start that passed today is 'due' (start it), a day that is over awaits a result; counts follow", async () => {
    const { tournamentId, headers, stageId } = await createLeague({ participantCount: 4 }, { scheduleTimeZone: "UTC" });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const matches = await stageMatches(stageId);
    const day = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
    await request(app).put(`/api/matches/${matches[0]!.id}/schedule`).set(headers).send({ date: day(0), time: "00:00" }).expect(200);
    await request(app).put(`/api/matches/${matches[1]!.id}/schedule`).set(headers).send({ date: day(-3), time: "18:00" }).expect(200);
    await request(app).put(`/api/matches/${matches[2]!.id}/schedule`).set(headers).send({ date: day(-3), time: "18:00" }).expect(200);
    await request(app).patch(`/api/matches/${matches[2]!.id}`).set(headers).send({ status: "in_progress" }).expect(200);
    await request(app).patch(`/api/matches/${matches[3]!.id}`).set(headers).send({ status: "in_progress" }).expect(200);
    await request(app).put(`/api/matches/${matches[4]!.id}/schedule`).set(headers).send({ date: day(3), time: "18:00" }).expect(200);
    const view = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stageId}/schedule`).expect(200)).body;
    const state = new Map(view.rounds.flatMap((round: Json) => round.matches).map((match: Json) => [match.matchId, match.scheduleState]));
    assert.equal(state.get(matches[0]!.id), "due", "start passed today, not started: start it — no result is asked for yet");
    assert.equal(state.get(matches[1]!.id), "awaiting_result", "the match day is over");
    assert.equal(state.get(matches[2]!.id), "awaiting_result", "started, and its day is over");
    assert.equal(state.get(matches[3]!.id), "in_progress", "started without a date");
    assert.equal(state.get(matches[4]!.id), "scheduled");
    assert.equal(state.get(matches[5]!.id), "unscheduled");
    assert.deepEqual(view.overdue.map((match: Json) => match.matchId).sort(), [matches[1]!.id, matches[2]!.id].sort());
    assert.deepEqual(
      { due: view.counts.due, inProgress: view.counts.inProgress, awaitingResult: view.counts.awaitingResult, scheduled: view.counts.scheduled, unscheduled: view.counts.unscheduled, total: view.counts.total },
      { due: 1, inProgress: 1, awaitingResult: 2, scheduled: 1, unscheduled: 1, total: 6 },
    );
  });

  test("schedule generator: preview changes nothing, apply fills only unscheduled matches, DST gaps are refused", async () => {
    const { tournamentId, headers, stageId } = await createLeague({ participantCount: 6, legs: 2 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const version = async () => (await rows<{ version: number }>("SELECT version FROM tournament_stages WHERE id = $1", [stageId]))[0]!.version;
    const url = `/api/tournaments/${tournamentId}/stages/${stageId}/schedule/generate`;
    const body = (extra: Record<string, unknown>) => ({ startDate: "2027-01-09", intervalDays: 7, defaultTime: "17:00", timeZone: "Europe/Warsaw", apply: false, ...extra });
    const preview = (await request(app).post(url).set(headers).send(body({ expectedVersion: await version() })).expect(200)).body;
    assert.equal(preview.applied, false);
    assert.equal(preview.rounds.length, 10);
    assert.equal(preview.lastDate, "2027-03-13");
    assert.equal((await rows<{ n: number }>("SELECT count(*)::int AS n FROM matches WHERE stage_id = $1 AND scheduled_at IS NOT NULL", [stageId]))[0]!.n, 0);
    const [first] = await stageMatches(stageId);
    await request(app).put(`/api/matches/${first!.id}/schedule`).set(headers).send({ date: "2027-01-08", time: "20:00" }).expect(200);
    const applied = (await request(app).post(url).set(headers).send(body({ apply: true, onlyUnscheduled: true, expectedVersion: await version() })).expect(200)).body;
    assert.equal(applied.updatedMatches, 29);
    assert.equal(applied.skippedMatches, 1);
    const [keptManual] = await rows<{ at: string }>("SELECT to_char(scheduled_at, 'YYYY-MM-DD\"T\"HH24:MI') AS at FROM matches WHERE id = $1", [first!.id]);
    assert.equal(keptManual!.at, "2027-01-08T19:00", "a date set by hand is kept");
    assert.equal((await request(app).post(url).set(headers).send(body({ apply: true, expectedVersion: 1 })).expect(409)).body.code, "STAGE_VERSION_CONFLICT");
    const gap = (await request(app).post(url).set(headers).send(body({ startDate: "2027-03-14", defaultTime: "02:30", apply: true, expectedVersion: await version() })).expect(422)).body;
    assert.equal(gap.code, "LOCAL_TIME_DOES_NOT_EXIST");
    assert.match(gap.error, /Kolejka 3/);
    await request(app).post(url).send(body({ expectedVersion: await version() })).expect(403);
  });

  test("scenario 9: league with draws, a corrected result, rules and a schedule survives backup and restore into a separate database", async () => {
    const { tournamentId, headers, stageId } = await createLeague(
      { participantCount: 5, allowDraws: 1, pointsWin: 3, pointsDraw: 1, pointsLoss: 0 },
      { scheduleTimeZone: "Europe/Warsaw", schedulePlan: { startDate: "2026-12-05", intervalDays: 7, defaultTime: "18:00" } },
    );
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    const matches = await stageMatches(stageId);
    await complete(headers, matches[0]!.id, 1, 1);
    await complete(headers, matches[1]!.id, 2, 0);
    await request(app).post(`/api/matches/${matches[1]!.id}/revert`).set(headers).expect(200);
    await complete(headers, matches[1]!.id, 2, 2);
    await request(app).patch(`/api/matches/${matches[2]!.id}`).set(headers).send({ status: "postponed" }).expect(200);
    await request(app).put(`/api/matches/${matches[2]!.id}/schedule`).set(headers).send({ date: "2026-12-09", time: "20:00" }).expect(200);

    const backup = (await request(app).get(`/api/tournaments/${tournamentId}/export`).set(headers).expect(200)).body as Json;
    assert.doesNotThrow(() => validateBackupV3(backup));
    const stage = backup.stages[0];
    assert.equal(stage.leagueRules.allowDraws, true);
    assert.equal(stage.scheduleTimeZone, "Europe/Warsaw");
    assert.deepEqual(stage.schedulePlan, { startDate: "2026-12-05", intervalDays: 7, defaultTime: "18:00" });
    // A tampered draw in a stage without draws is refused by the validator.
    const tampered = structuredClone(backup);
    delete tampered.stages[0].leagueRules;
    assert.throws(() => validateBackupV3(tampered), (error: Json) =>
      Array.isArray(error.details) && error.details.some((detail: string) => /Played match .* is invalid/.test(detail)));

    const target = await restoreTarget();
    const restored = await restoreInSeparateProcess(backup, target);
    const project = (file: Json) => {
      const name = new Map<number, string>(file.players.map((player: Json) => [player.backupId, player.name]));
      return {
        stage: (({ backupId: _id, createdAt: _c, winnerBackupId: _w, ...rest }) => rest)(file.stages[0]),
        matches: file.matches.map((match: Json) => ({
          round: match.round, number: match.matchNumber, p1: name.get(match.player1BackupId), p2: name.get(match.player2BackupId),
          score: [match.score1, match.score2], winner: match.winnerBackupId == null ? null : name.get(match.winnerBackupId),
          status: match.status, scheduledAt: match.scheduledAt,
        })),
        history: file.resultHistory.map((row: Json) => [row.round, row.matchNumber, row.revision, row.score1, row.score2, row.winnerBackupId == null]),
      };
    };
    assert.deepEqual(project(restored.reExported), project(backup));
  });

  test("scenario 11 + 12: a pre-V5.3 league keeps its rules; Stable-only operations on league stages are refused safely", async () => {
    const legacy = await request(app).post("/api/tournaments")
      .send({ name: `Stara liga ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "round_robin", maxPlayers: 4 })
      .expect(201);
    const headers = await headersFor(legacy.body.id);
    for (let index = 0; index < 4; index += 1) await request(app).post(`/api/tournaments/${legacy.body.id}/players`).set(headers).send({ name: `L${index}` }).expect(201);
    const [stage] = await rows<{ id: number; league_rules: unknown }>("SELECT id, league_rules FROM tournament_stages WHERE tournament_id = $1", [legacy.body.id]);
    assert.equal(stage!.league_rules, null, "creation without rules (Stable path) keeps ranking by wins");
    await request(app).post(`/api/tournaments/${legacy.body.id}/start`).set(headers).expect(200);
    const [match] = await stageMatches(stage!.id);
    assert.equal((await complete(headers, match!.id, 1, 1, 422)).body.code, "BOTH_SIDES_REACHED_WIN_THRESHOLD");
    await complete(headers, match!.id, 1, 0);
    const standings = (await request(app).get(`/api/tournaments/${legacy.body.id}/standings`).expect(200)).body as Json[];
    assert.ok(standings.every((entry) => !("points" in entry) && !("matchDraws" in entry)), "old league keeps the pre-V5.3 response");
    // Stable cannot write a result through the generic PATCH, and cannot set rules on a bracket.
    assert.equal((await request(app).patch(`/api/matches/${match!.id}`).set(headers).send({ score1: 1, score2: 1 }).expect(422)).body.code, "MATCH_RESULT_REQUIRES_COMPLETE");
    const bracket = await request(app).post("/api/tournaments")
      .send({ name: `Puchar ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "single_elimination", maxPlayers: 4 })
      .expect(201);
    const bracketHeaders = await headersFor(bracket.body.id);
    const [bracketStage] = await rows<{ id: number; version: number }>("SELECT id, version FROM tournament_stages WHERE tournament_id = $1", [bracket.body.id]);
    const refused = await request(app).put(`/api/tournaments/${bracket.body.id}/stages/${bracketStage!.id}/league-rules`).set(bracketHeaders)
      .send({ leagueRules: { points: { win: 3, draw: 1, loss: 0 } }, expectedVersion: bracketStage!.version }).expect(422);
    assert.equal(refused.body.code, "LEAGUE_RULES_FORMAT_UNSUPPORTED");
    const creation = await request(app).post("/api/tournaments")
      .send({ name: `Puchar 2 ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "single_elimination", maxPlayers: 4, leagueRules: { points: { win: 3, draw: 1, loss: 0 } } })
      .expect(422);
    assert.equal(creation.body.code, "INVALID_LEAGUE_RULES");
    await request(app).get(`/api/tournaments/${bracket.body.id}/stages/${bracketStage!.id}/schedule`).expect(200);
  });

  test("scenario 10: a league prepared by AI is imported (validate-only) and created exactly as previewed", async () => {
    const config = {
      schemaVersion: 1, kind: "league",
      participants: { type: "players", count: 6 },
      structure: { type: "preset", presetId: "round_robin", params: { legs: 2, bestOf: 1, allowDraws: 1, pointsWin: 3, pointsDraw: 1, pointsLoss: 0 } },
      schedule: { timeZone: "Europe/Warsaw", startDate: "2027-01-09", intervalDays: 7, defaultTime: "17:00" },
    };
    const validated = (await request(app).post("/api/tournaments/ai-config/validate").send({ text: JSON.stringify(config) }).expect(200)).body;
    assert.equal(validated.valid, true, JSON.stringify(validated.problems));
    assert.equal(validated.preview.totals.matches.min, 30);
    assert.equal(validated.preview.schedule.lastDate, "2027-03-13");
    assert.equal((await rows<{ n: number }>("SELECT count(*)::int AS n FROM tournaments WHERE description = 'ai-v53'"))[0]!.n, 0, "validation writes nothing");
    const created = await request(app).post("/api/tournaments")
      .send({ name: `AI liga ${randomUUID()}`, description: "ai-v53", organizerPassword: "integration-organizer-password", ...validated.preview.creation })
      .expect(201);
    const [stage] = await rows<{ league_rules: Json; schedule_time_zone: string; schedule_plan: Json; round_robin_legs: number }>(
      "SELECT league_rules, schedule_time_zone, schedule_plan, round_robin_legs FROM tournament_stages WHERE tournament_id = $1", [created.body.id]);
    assert.equal(stage!.round_robin_legs, 2);
    assert.equal(stage!.league_rules.allowDraws, true);
    assert.equal(stage!.schedule_time_zone, "Europe/Warsaw");
    assert.deepEqual(stage!.schedule_plan, { startDate: "2027-01-09", intervalDays: 7, defaultTime: "17:00" });
    const injected = (await request(app).post("/api/tournaments/ai-config/validate")
      .send({ text: JSON.stringify({ ...config, structure: { type: "stages", stages: [{ label: "L", format: "round_robin", leagueRules: { points: { win: 3, draw: 1, loss: 0 }, organizerPassword: "x" } }] } }) })
      .expect(422)).body;
    assert.equal(injected.valid, false);
    assert.ok(injected.problems.some((problem: Json) => problem.code === "FORBIDDEN_FIELD"));
  });
});

async function restoreTarget(): Promise<{ url: string; schema: string }> {
  const schema = `tm_test_restore_${randomUUID().replaceAll("-", "").slice(0, 10)}`;
  const source = new URL(process.env.TEST_DATABASE_URL!);
  const restoreName = `${source.pathname.slice(1)}_restore`;
  assert.match(restoreName, /^[a-z0-9_]+$/);
  const exists = (await database.pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [restoreName])).rowCount === 1;
  if (!exists) await database.pool.query(`CREATE DATABASE "${restoreName}"`);
  const target = new URL(source.toString());
  target.pathname = `/${restoreName}`;
  target.search = "";
  return { url: target.toString(), schema };
}

async function restoreInSeparateProcess(backup: Json, target: { url: string; schema: string }): Promise<Json> {
  const input = path.join(workDir, `${randomUUID()}.json`);
  const output = path.join(workDir, `${randomUUID()}.out.json`);
  await writeFile(input, JSON.stringify(backup));
  const child = fileURLToPath(new URL("./support/backup-restore-child.ts", import.meta.url));
  const env: NodeJS.ProcessEnv = { ...process.env, RESTORE_DATABASE_URL: target.url, RESTORE_SCHEMA: target.schema };
  delete env.NODE_TEST_CONTEXT;
  const run = spawnSync(process.execPath, ["--import", "tsx", child, input, output], { env, encoding: "utf8", timeout: 120_000 });
  assert.equal(run.status, 0, `restore process failed: ${run.stderr.slice(-2000)}`);
  return JSON.parse(await readFile(output, "utf8"));
}
