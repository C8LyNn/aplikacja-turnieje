/**
 * V5.7 on PostgreSQL: matches decided by sets — created from a preset, validated by the API, stored with
 * their sets, shown in tables (match records, sets, small points, classification points kept apart),
 * corrected through the existing revert, carried by Backup V3, and the same in Stable and stage tables.
 */
import { matchRevision } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

interface DatabaseModule { pool: typeof import("@workspace/db").pool }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

async function rows<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  return (await database.pool.query(sql, values)).rows as T[];
}

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `v57s-${randomUUID()}`;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  signOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function setup(presetId: string, params: Record<string, number>) {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `Sety ${randomUUID().slice(0, 6)}`, organizerPassword: "integration-organizer-password", ...preview.creation })
    .expect(201);
  const tournamentId = created.body.id as number;
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  const organizer = { "x-organizer-token": signOrganizerToken(tournamentId, row!.organizer_password_hash) };
  const ids: number[] = [];
  for (let index = 1; index <= params.participantCount!; index += 1) {
    ids.push((await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: `S${index}` }).expect(201)).body.id);
  }
  const stages = await rows<{ id: number; format: string; best_of: number; version: number }>("SELECT id, format, best_of, version FROM tournament_stages WHERE tournament_id = $1 ORDER BY position", [tournamentId]);
  return { preview, tournamentId, organizer, ids, stages };
}

async function openMatches(stageId: number) {
  return rows<{ id: number; player1_id: number; player2_id: number }>(
    "SELECT id, player1_id, player2_id FROM matches WHERE stage_id = $1 AND status <> 'completed' AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number", [stageId]);
}

const twoOne = [{ score1: 11, score2: 7 }, { score1: 9, score2: 11 }, { score1: 11, score2: 5 }];
const straight = [{ score1: 11, score2: 3 }, { score1: 12, score2: 10 }];

async function saveSets(headers: Record<string, string>, matchId: number, sets: Array<{ score1: number; score2: number }>, expect = 200) {
  let won1 = 0; let won2 = 0;
  for (const set of sets) { if (set.score1 > set.score2) won1 += 1; else won2 += 1; }
  return request(app).post(`/api/matches/${matchId}/complete`).set(headers)
    .send({ expectedRevision: await matchRevision(database, matchId), resultType: "played", score1: won1, score2: won2, sets })
    .expect(expect);
}

describe("V5.7 matches decided by sets", () => {
  test("a preset creates the rules; a set result is validated, stored and shown separately from classification points", async () => {
    const { preview, tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4, setsToWin: 2, setPoints: 11, setWinBy: 2 });
    assert.equal(preview.matchRulesSummary, "Mecz do dwóch wygranych setów. Każdy set do 11 punktów, z przewagą dwóch.");
    assert.equal(stages[0]!.best_of, 3, "the match length follows from the sets");
    const stage = (await request(app).get(`/api/tournaments/${tournamentId}/stages`).expect(200)).body[0];
    assert.deepEqual(stage.matchRules, { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [first, second] = await openMatches(stages[0]!.id);

    const saved = (await saveSets(organizer, first!.id, twoOne)).body;
    assert.deepEqual([saved.score1, saved.score2, saved.winnerId], [2, 1, first!.player1_id]);
    assert.deepEqual(saved.sets, twoOne);
    await saveSets(organizer, second!.id, straight);

    const table = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stages[0]!.id}/standings`).expect(200)).body;
    assert.equal(table.matchRulesSummary, preview.matchRulesSummary);
    const winner = table.tables[0].rows.find((row: Json) => row.playerId === first!.player1_id);
    assert.deepEqual(
      { wins: winner.wins, losses: winner.losses, setsFor: winner.scoreFor, setsAgainst: winner.scoreAgainst, smallFor: winner.setPointsFor, smallAgainst: winner.setPointsAgainst, points: winner.points },
      { wins: 1, losses: 0, setsFor: 2, setsAgainst: 1, smallFor: 31, smallAgainst: 23, points: 3 },
      "match record, sets, small points and classification points are separate numbers",
    );
    // Stable (tournament standings) shows the same order, sets and small points.
    const stable = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[];
    assert.deepEqual(stable.map((row) => row.playerId), table.tables[0].rows.map((row: Json) => row.playerId));
    const stableWinner = stable.find((row) => row.playerId === first!.player1_id);
    assert.deepEqual([stableWinner.gameWins, stableWinner.gameLosses, stableWinner.setPointsFor, stableWinner.setPointsAgainst], [2, 1, 31, 23]);
    // The history records the sets of the saved result.
    const history = (await request(app).get(`/api/tournaments/${tournamentId}/results-history`).expect(200)).body as Json[];
    assert.deepEqual(history.find((entry) => entry.matchId === first!.id).sets, twoOne);
  });

  test("invalid and incomplete set results are refused with a specific reason; walkovers get no invented sets", async () => {
    const { tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4, setsToWin: 2, setPoints: 11, setWinBy: 2 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [match, other] = await openMatches(stages[0]!.id);
    const send = async (body: Json) => (await request(app).post(`/api/matches/${match!.id}/complete`).set(organizer)
      .send({ expectedRevision: await matchRevision(database, match!.id), resultType: "played", ...body }).expect(422)).body;
    assert.equal((await send({ score1: 2, score2: 0 })).code, "SETS_REQUIRED");
    const unfinished = await send({ score1: 2, score2: 0, sets: [{ score1: 11, score2: 3 }, { score1: 11, score2: 10 }] });
    assert.equal(unfinished.code, "SET_NOT_FINISHED");
    assert.match(unfinished.error, /Set 2 \(11:10\) nie jest zakończony/);
    const impossible = await send({ score1: 2, score2: 0, sets: [{ score1: 13, score2: 10 }, { score1: 11, score2: 3 }] });
    assert.equal(impossible.code, "SET_SCORE_IMPOSSIBLE");
    assert.equal((await send({ score1: 2, score2: 1, sets: [{ score1: 11, score2: 3 }, { score1: 11, score2: 4 }, { score1: 3, score2: 11 }] })).code, "SET_AFTER_MATCH_DECIDED");
    assert.equal((await send({ score1: 1, score2: 1, sets: [{ score1: 11, score2: 3 }, { score1: 4, score2: 11 }] })).code, "MATCH_NOT_DECIDED");
    const mismatch = await send({ score1: 2, score2: 1, sets: straight });
    assert.equal(mismatch.code, "SET_TOTAL_MISMATCH");
    assert.equal((await rows<{ status: string }>("SELECT status FROM matches WHERE id = $1", [match!.id]))[0]!.status, "pending", "nothing was saved");

    const walkover = (await request(app).post(`/api/matches/${other!.id}/complete`).set(organizer)
      .send({ expectedRevision: await matchRevision(database, other!.id), resultType: "walkover", winnerId: other!.player1_id }).expect(200)).body;
    assert.equal(walkover.sets, null);
    assert.equal(walkover.resultType, "walkover");

    const series = await setup("round_robin", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${series.tournamentId}/start`).set(series.organizer).expect(200);
    const [plain] = await openMatches(series.stages[0]!.id);
    const refused = (await request(app).post(`/api/matches/${plain!.id}/complete`).set(series.organizer)
      .send({ expectedRevision: await matchRevision(database, plain!.id), resultType: "played", score1: 1, score2: 0, sets: [{ score1: 11, score2: 3 }] }).expect(422)).body;
    assert.equal(refused.code, "SETS_NOT_SUPPORTED");
  });

  test("a corrected set result changes the match, the table and the advancement; the history keeps both", async () => {
    const { tournamentId, organizer, stages } = await setup("groups_playoff", { participantCount: 8, groupCount: 2, qualifiersPerGroup: 2, setsToWin: 2, setPoints: 11, setWinBy: 2 });
    const [groups, playoff] = stages;
    assert.equal(playoff!.best_of, 3, "the play-off uses the same set rules");
    const ceremony = `/api/tournaments/${tournamentId}/stages/${groups!.id}/seeding-ceremony`;
    const start = await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer);
    if (start.status !== 200) {
      await request(app).post(`${ceremony}/prepare`).set(organizer).send({}).expect(200);
      await request(app).post(`${ceremony}/reveal-all`).set(organizer).send({}).expect(200);
      await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    }
    const matches = await openMatches(groups!.id);
    for (const match of matches) await saveSets(organizer, match.id, straight);
    const target = matches[0]!;
    // Correct the first result through the existing controlled revert, then re-enter other sets.
    await request(app).post(`/api/matches/${target.id}/revert`).set(organizer).send({ expectedRevision: await matchRevision(database, target.id) }).expect(200);
    const [reverted] = await rows<{ set_scores: unknown; status: string }>("SELECT set_scores, status FROM matches WHERE id = $1", [target.id]);
    assert.deepEqual(reverted, { set_scores: null, status: "pending" }, "revert clears the sets with the result");
    const flipped = [{ score1: 3, score2: 11 }, { score1: 11, score2: 9 }, { score1: 8, score2: 11 }];
    const corrected = (await saveSets(organizer, target.id, flipped)).body;
    assert.equal(corrected.winnerId, target.player2_id, "the corrected sets decide the winner");
    const history = await rows<{ revision: number; set_scores: unknown }>("SELECT revision, set_scores FROM result_history WHERE match_id = $1 ORDER BY revision", [target.id]);
    assert.deepEqual(history.map((entry) => entry.set_scores), [[[11, 3], [12, 10]], [[3, 11], [11, 9], [8, 11]]], "both results stay in the history");

    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups!.id}/complete`).set(organizer).expect(200);
    const table = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups!.id}/standings`).expect(200)).body;
    const qualifiers = table.tables.flatMap((entry: Json) => entry.rows.filter((row: Json) => row.zone === "qualify").map((row: Json) => row.playerId)).sort();
    const advanced = (await rows<{ player_id: number }>("SELECT player_id FROM stage_participants WHERE stage_id = $1", [playoff!.id])).map((row) => row.player_id).sort();
    assert.deepEqual(advanced, qualifiers, "the play-off holds exactly the qualifiers of the set-based table");
    // Once the play-off started, the group result is protected and the block names the stage.
    const [state] = await rows<{ status: string }>("SELECT status FROM tournament_stages WHERE id = $1", [playoff!.id]);
    if (state!.status === "planned") await request(app).post(`/api/tournaments/${tournamentId}/stages/${playoff!.id}/start`).set(organizer).send({}).expect(200);
    const blocked = await request(app).post(`/api/matches/${target.id}/revert`).set(organizer).send({ expectedRevision: await matchRevision(database, target.id) }).expect(409);
    assert.equal(blocked.body.blocking.kind, "stage");
  });

  test("rules change only before the stage starts; the length is fixed by the sets; presets explain forbidden combinations", async () => {
    const { tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4 });
    const url = `/api/tournaments/${tournamentId}/stages/${stages[0]!.id}/match-rules`;
    const rules = { version: 1, kind: "sets", setsToWin: 3, pointsPerSet: 25, winBy: 2 };
    const put = await request(app).put(url).set(organizer).send({ matchRules: rules, expectedVersion: stages[0]!.version });
    assert.equal(put.status, 200, put.text);
    const changed = put.body;
    assert.equal(changed.bestOf, 5);
    assert.equal(changed.matchRulesSummary, "Mecz do trzech wygranych setów. Każdy set do 25 punktów, z przewagą dwóch.");
    const started = await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer);
    assert.equal(started.status, 200, started.text);
    const locked = await request(app).put(url).set(organizer).send({ matchRules: null, expectedVersion: changed.version }).expect(409);
    assert.equal(locked.body.code, "MATCH_RULES_LOCKED");
    const [match] = await openMatches(stages[0]!.id);
    const length = await request(app).patch(`/api/matches/${match!.id}`).set(organizer).send({ bestOf: 1, expectedRevision: await matchRevision(database, match!.id) }).expect(422);
    assert.equal(length.body.code, "BEST_OF_FIXED_FOR_SETS");

    const draws = await request(app).post("/api/tournaments/presets/preview").send({ presetId: "round_robin", params: { participantCount: 4, setsToWin: 2, allowDraws: 1 } }).expect(422);
    assert.match(draws.body.error, /zawsze ma zwycięzcę/);
    const length2 = await request(app).post("/api/tournaments/presets/preview").send({ presetId: "single_elimination", params: { participantCount: 8, setsToWin: 2, bestOf: 5 } }).expect(422);
    assert.match(length2.body.error, /wynika z zasad setów/);
  });

  test("Backup V3 keeps the rules, the sets and their history; the restored copy gives the same table", async () => {
    const { tournamentId, organizer, stages } = await setup("round_robin", { participantCount: 4, setsToWin: 2, setPoints: 21, setWinBy: 2 });
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [first, second] = await openMatches(stages[0]!.id);
    await saveSets(organizer, first!.id, [{ score1: 21, score2: 19 }, { score1: 23, score2: 25 }, { score1: 21, score2: 10 }]);
    await saveSets(organizer, second!.id, [{ score1: 21, score2: 5 }, { score1: 21, score2: 7 }]);
    const { exportBackupV3, importBackupV3, validateBackupV3 } = await import("../src/application/backups/backup-v3");
    const backup = (await exportBackupV3(tournamentId))!;
    assert.deepEqual(backup.stages[0]!.matchRules, { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 21, winBy: 2 });
    assert.equal(backup.matches.filter((match) => match.sets).length, 2);
    assert.equal(backup.resultHistory.filter((entry) => entry.sets).length, 2);
    const tampered = structuredClone(backup);
    tampered.matches.find((match) => match.sets)!.sets![0] = { score1: 30, score2: 2 };
    assert.throws(() => validateBackupV3(tampered), (error: Json) => error.details.some((detail: string) => /set scores are invalid/.test(detail)));

    const [hash] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
    const restored = await importBackupV3(backup, { organizerPasswordHash: hash!.organizer_password_hash } as never) as Json;
    const restoredId = (restored.id ?? restored.tournamentId ?? restored.tournament?.id) as number;
    const [copyStage] = await rows<{ id: number }>("SELECT id FROM tournament_stages WHERE tournament_id = $1 ORDER BY position LIMIT 1", [restoredId]);
    const original = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stages[0]!.id}/standings`).expect(200)).body.tables[0].rows as Json[];
    const copy = (await request(app).get(`/api/tournaments/${restoredId}/stages/${copyStage!.id}/standings`).expect(200)).body.tables[0].rows as Json[];
    const shape = (list: Json[]) => list.map((row) => [row.playerName, row.points, row.scoreFor, row.scoreAgainst, row.setPointsFor, row.setPointsAgainst]);
    assert.deepEqual(shape(copy), shape(original));
    const copiedSets = await rows<{ n: number }>("SELECT count(*)::int AS n FROM result_history WHERE tournament_id = $1 AND set_scores IS NOT NULL", [restoredId]);
    assert.equal(copiedSets[0]!.n, 2);
  });

  test("older results keep their meaning: a series stage has no sets and its summary says so", async () => {
    const { tournamentId, organizer, stages } = await setup("single_elimination", { participantCount: 4, bestOf: 3 });
    const stage = (await request(app).get(`/api/tournaments/${tournamentId}/stages`).expect(200)).body[0];
    assert.equal(stage.matchRules, null);
    assert.equal(stage.matchRulesSummary, "Mecz do dwóch wygranych gier (seria do 3).");
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const [match] = await openMatches(stages[0]!.id);
    const saved = (await request(app).post(`/api/matches/${match!.id}/complete`).set(organizer)
      .send({ expectedRevision: await matchRevision(database, match!.id), resultType: "played", score1: 2, score2: 1 }).expect(200)).body;
    assert.equal(saved.sets, null);
  });

  test("AI configuration: presets and custom stages accept set rules; the specification describes them", async () => {
    const bundle = (await request(app).get("/api/tournaments/ai-spec").expect(200)).body;
    const base = bundle.examples.find((example: Json) => example.config.structure.type === "preset").config;
    const presetConfig = { ...base, structure: { type: "preset", presetId: "single_elimination", params: { setsToWin: 3, setPoints: 11, setWinBy: 2 } }, participants: { ...base.participants, count: 8 } };
    const preset = await request(app).post("/api/tournaments/ai-config/validate").send({ text: JSON.stringify(presetConfig) });
    assert.equal(preset.status, 200, preset.text);
    assert.equal(preset.body.preview.matchRules.setsToWin, 3);
    assert.equal(preset.body.preview.creation.matchRules?.setsToWin ?? preset.body.preview.creation.stagePlan?.stages[0].matchRules.setsToWin, 3);
    const conflict = await request(app).post("/api/tournaments/ai-config/validate").send({ text: JSON.stringify({ ...presetConfig, structure: { ...presetConfig.structure, params: { setsToWin: 2, bestOf: 5 } } }) }).expect(422);
    assert.match(JSON.stringify(conflict.body.problems), /wynika z zasad setów/);
    const spec = await request(app).get("/api/tournaments/ai-spec.md").expect(200);
    assert.match(spec.text, /setsToWin/);
    assert.match(spec.text, /seta decydującego/);
  });
});
