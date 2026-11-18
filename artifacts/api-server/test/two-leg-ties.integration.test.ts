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
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

/**
 * V5.10 — two-legged knockout ties end to end (HTTP + PostgreSQL): legs, aggregate, level aggregate with the
 * organizer's decision, advancement, corrections (allowed / blocked), undo, teams, a multi-stage play-off, the AI
 * file, backup and restore into a separate database, concurrent writes, and what viewers get.
 */
type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

let app: Express;
let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
let initialized = false;
let workDir = "";
let validateBackupV3: typeof import("../src/application/backups/backup-v3").validateBackupV3;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = randomUUID();
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  workDir = await mkdtemp(path.join(tmpdir(), "v510-two-legs-"));
  validateBackupV3 = (await import("../src/application/backups/backup-v3")).validateBackupV3;
  app = (await import("../src/app")).default;
});
after(async () => {
  if (workDir) await rm(workDir, { recursive: true, force: true });
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  if (database) await database.pool.end();
});

const rows = async <T = Json>(sql: string, values: unknown[] = []): Promise<T[]> => (await database.pool.query(sql, values)).rows as T[];

async function createFromPreset(presetId: string, params: Record<string, number>, extra: Record<string, unknown> = {}) {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `Dwumecz ${randomUUID()}`, organizerPassword: "two-legs-organizer-password", ...preview.creation, ...extra }).expect(201);
  return { id: created.body.id as number, auth: { "x-organizer-token": created.body.organizerToken as string }, preview };
}

async function addPlayers(id: number, auth: Record<string, string>, names: string[]) {
  for (const [index, name] of names.entries()) {
    const entry = (await request(app).post(`/api/tournaments/${id}/players`).set(auth).send({ name, seed: index + 1 }).expect(201)).body;
    // Team tournaments start only with full rosters: one captain per team is enough here.
    const [tournament] = await rows("SELECT participant_type FROM tournaments WHERE id = $1", [id]);
    if (tournament.participant_type === "teams") {
      await request(app).post(`/api/tournaments/${id}/teams/${entry.id}/members`).set(auth).send({ name: `Kapitan ${name}`, role: "captain" }).expect(201);
    }
  }
}

const getMatch = async (id: number, auth?: Record<string, string>) => {
  const call = request(app).get(`/api/matches/${id}`);
  return (await (auth ? call.set(auth) : call).expect(200)).body as Json;
};
const listMatches = async (tournamentId: number, auth?: Record<string, string>) => {
  const call = request(app).get(`/api/tournaments/${tournamentId}/matches`);
  return (await (auth ? call.set(auth) : call).expect(200)).body as Json[];
};
const leg = (match: Json, number: 1 | 2) => match.legs.find((entry: Json) => entry.leg === number);
async function recordLeg(matchId: number, number: 1 | 2, score1: number, score2: number, auth: Record<string, string>, expectStatus = 200) {
  const match = await getMatch(matchId, auth);
  return (await request(app).post(`/api/matches/${matchId}/legs/${number}/result`).set(auth)
    .send({ score1, score2, expectedRevision: leg(match, number).revision }).expect(expectStatus)).body as Json;
}
async function revertLeg(matchId: number, number: 1 | 2, auth: Record<string, string>, expectStatus = 200) {
  const match = await getMatch(matchId, auth);
  return (await request(app).post(`/api/matches/${matchId}/legs/${number}/revert`).set(auth)
    .send({ expectedRevision: leg(match, number).revision }).expect(expectStatus)).body as Json;
}
const nameOf = async (tournamentId: number) => new Map((await rows<{ id: number; name: string }>("SELECT id, name FROM players WHERE tournament_id = $1", [tournamentId])).map((row) => [row.id, row.name]));

describe("V5.10 two-legged ties", () => {
  test("1+5: a clear aggregate decides the tie and the winner advances into both legs of the next tie", async () => {
    const t = await createFromPreset("single_elimination", { participantCount: 4, twoLegs: 1 });
    assert.equal(t.preview.creation.matchRules.kind, "two_legs");
    await addPlayers(t.id, t.auth, ["Drużyna A", "Drużyna D", "Drużyna B", "Drużyna C"]);
    await request(app).post(`/api/tournaments/${t.id}/start`).set(t.auth).expect(200);
    const matches = await listMatches(t.id, t.auth);
    const semis = matches.filter((match) => match.round === 1);
    const final = matches.find((match) => match.round === 2);
    assert.equal(semis.length, 2);
    for (const match of matches) {
      assert.equal(match.legs.length, 2, "every tie has two legs");
      assert.deepEqual(match.legs.map((entry: Json) => entry.homeSide), [1, 2]);
      assert.equal(match.tie.state, "not_started");
    }
    const names = await nameOf(t.id);
    const semi = semis[0];
    const [a, b] = [names.get(semi.player1Id), names.get(semi.player2Id)];
    // Leg 1: A 2:1 B (A at home). Leg 2: B 3:1 A (B at home) → stored in tie orientation as 1:3.
    let tie = await recordLeg(semi.id, 1, 2, 1, t.auth);
    assert.equal(tie.status, "in_progress");
    assert.equal(tie.tie.state, "first_leg_played");
    assert.deepEqual([tie.tie.total1, tie.tie.total2], [2, 1]);
    tie = await recordLeg(semi.id, 2, 1, 3, t.auth);
    assert.equal(tie.status, "completed");
    assert.deepEqual([tie.score1, tie.score2], [3, 4], "aggregate A 3:4 B");
    assert.equal(tie.winnerId, semi.player2Id, `${b} advances over ${a}`);
    assert.equal(tie.tie.decidedBy, "aggregate");
    const nextTie = await getMatch(final.id, t.auth);
    assert.equal(nextTie.player1Id, semi.player2Id, "the winner is placed in the next tie (both legs follow the tie)");
    assert.equal(nextTie.status, "pending");
    const history = await rows("SELECT event, leg, score1, score2 FROM match_tie_history WHERE match_id = $1 ORDER BY id", [semi.id]);
    assert.deepEqual(history.map((row: Json) => row.event), ["leg_recorded", "leg_recorded"]);
    const resultHistory = await rows("SELECT score1, score2, winner_id FROM result_history WHERE match_id = $1", [semi.id]);
    assert.deepEqual(resultHistory.map((row: Json) => [row.score1, row.score2]), [[3, 4]]);
  });

  test("2: a level aggregate blocks advancement until the organizer decides with a reason; nothing is invented", async () => {
    const t = await createFromPreset("single_elimination", { participantCount: 4, twoLegs: 1 });
    await addPlayers(t.id, t.auth, ["Lwy", "Orły", "Żubry", "Wilki"]);
    await request(app).post(`/api/tournaments/${t.id}/start`).set(t.auth).expect(200);
    const [semi] = (await listMatches(t.id, t.auth)).filter((match) => match.round === 1);
    const final = (await listMatches(t.id, t.auth)).find((match) => match.round === 2);
    await recordLeg(semi.id, 1, 1, 1, t.auth);
    let tie = await recordLeg(semi.id, 2, 2, 2, t.auth);
    assert.equal(tie.status, "in_progress");
    assert.equal(tie.tie.state, "awaiting_decision");
    assert.equal(tie.winnerId, null);
    assert.equal((await getMatch(final.id)).player1Id, null, "no advancement while the aggregate is level");
    // The system never decides by itself; a decision needs a participant and a reason.
    const noReason = await request(app).post(`/api/matches/${semi.id}/tie-decision`).set(t.auth).send({ winnerId: semi.player1Id, expectedRevision: tie.revision }).expect(422);
    assert.equal(noReason.body.code, "TIE_DECISION_REASON_INVALID");
    const stranger = await request(app).post(`/api/matches/${semi.id}/tie-decision`).set(t.auth).send({ winnerId: 999999, reason: "x", expectedRevision: tie.revision }).expect(422);
    assert.equal(stranger.body.code, "TIE_DECISION_WINNER_INVALID");
    const missing = await request(app).post(`/api/matches/${semi.id}/tie-decision`).set(t.auth).send({ expectedRevision: tie.revision }).expect(422);
    assert.equal(missing.body.code, "TIE_LEVEL_DECISION_REQUIRED");
    // The generic "complete" cannot bypass the decision either.
    const bypass = await request(app).post(`/api/matches/${semi.id}/complete`).set(t.auth).send({ resultType: "played", score1: 3, score2: 3, expectedRevision: tie.revision }).expect(422);
    assert.equal(bypass.body.code, "TIE_LEVEL_DECISION_REQUIRED");
    tie = (await request(app).post(`/api/matches/${semi.id}/tie-decision`).set(t.auth)
      .send({ winnerId: semi.player2Id, reason: "Rzuty karne 4:3", expectedRevision: tie.revision }).expect(200)).body;
    assert.equal(tie.status, "completed");
    assert.deepEqual([tie.score1, tie.score2], [3, 3], "the aggregate stays level — no invented goals");
    assert.equal(tie.winnerId, semi.player2Id);
    assert.equal(tie.tie.decidedBy, "organizer");
    assert.equal(tie.tie.decisionReason, "Rzuty karne 4:3");
    assert.equal((await getMatch(final.id)).player1Id, semi.player2Id, "the decided winner advances");
    // Viewers see the decision and its reason (public), never the organizer's note.
    const publicView = await getMatch(semi.id);
    assert.equal(publicView.tie.decisionReason, "Rzuty karne 4:3");
    assert.equal("note" in publicView, false);
    const log = await rows("SELECT description FROM action_log WHERE match_id = $1 ORDER BY id", [semi.id]);
    assert.ok(log.some((row: Json) => /decyzja organizatora/.test(row.description) && /Rzuty karne 4:3/.test(row.description)), "decision traced in the action log");
    assert.deepEqual((await rows("SELECT event FROM match_tie_history WHERE match_id = $1 ORDER BY id", [semi.id])).map((row: Json) => row.event), ["leg_recorded", "leg_recorded", "decision_recorded"]);
  });

  test("3+4+5: correcting the second leg after advancement — allowed while the next tie has not started, blocked once it has", async () => {
    const t = await createFromPreset("single_elimination", { participantCount: 4, twoLegs: 1 });
    await addPlayers(t.id, t.auth, ["A", "B", "C", "D"]);
    await request(app).post(`/api/tournaments/${t.id}/start`).set(t.auth).expect(200);
    const all = await listMatches(t.id, t.auth);
    const [semi1, semi2] = all.filter((match) => match.round === 1).sort((x: Json, y: Json) => x.matchNumber - y.matchNumber);
    const final = all.find((match) => match.round === 2);
    // semi 1: participant 1 wins 2:1 and 1:1 → aggregate 3:2
    await recordLeg(semi1.id, 1, 2, 1, t.auth);
    await recordLeg(semi1.id, 2, 1, 1, t.auth);
    assert.equal((await getMatch(final.id)).player1Id, semi1.player1Id);
    // 3. Correct leg 2 (it was really 1:3 for participant 2): undo the leg → the tie reopens, the winner leaves the final.
    let tie = await revertLeg(semi1.id, 2, t.auth);
    assert.equal(tie.status, "in_progress");
    assert.equal(tie.winnerId, null);
    assert.equal(leg(tie, 2).status, "pending");
    assert.equal((await getMatch(final.id)).player1Id, null, "no stale advancement remains");
    tie = await recordLeg(semi1.id, 2, 1, 3, t.auth);
    assert.equal(tie.winnerId, semi1.player2Id, "the other participant advances after the correction");
    assert.equal((await getMatch(final.id)).player1Id, semi1.player2Id);
    // 4. Undo a single leg with "Cofnij ostatnią akcję" (the leg entry is the latest undoable action).
    const actions = (await request(app).get(`/api/tournaments/${t.id}/action-log`).expect(200)).body as Json[];
    const latestUndoable = actions.find((action) => action.canUndo);
    assert.match(latestUndoable.description, /2\. spotkanie/);
    await request(app).post(`/api/tournaments/${t.id}/undo-last`).set(t.auth).send({ expectedActionId: latestUndoable.id }).expect(200);
    tie = await getMatch(semi1.id, t.auth);
    assert.equal(tie.status, "in_progress");
    assert.equal(leg(tie, 2).status, "pending");
    assert.equal((await getMatch(final.id)).player1Id, null);
    await recordLeg(semi1.id, 2, 1, 3, t.auth);
    // semi 2 decided, then the final's first leg is played → the semis are locked.
    await recordLeg(semi2.id, 1, 0, 2, t.auth);
    await recordLeg(semi2.id, 2, 1, 0, t.auth);
    await recordLeg(final.id, 1, 1, 0, t.auth);
    const blocked = await revertLeg(semi1.id, 2, t.auth, 409);
    assert.equal(blocked.code, "DOWNSTREAM_BLOCKED");
    assert.equal(blocked.blocking.kind, "match");
    tie = await getMatch(semi1.id, t.auth);
    assert.equal(tie.status, "completed", "nothing changed after the refusal");
    assert.equal(leg(tie, 2).status, "completed");
    assert.equal((await getMatch(final.id)).player1Id, semi1.player2Id);
    // A leg already played cannot be overwritten; a tie cannot be cancelled or have its length changed as a whole.
    const overwrite = await request(app).post(`/api/matches/${final.id}/legs/1/result`).set(t.auth).send({ score1: 5, score2: 0, expectedRevision: leg(await getMatch(final.id, t.auth), 1).revision }).expect(409);
    assert.equal(overwrite.body.code, "LEG_ALREADY_RECORDED");
    const cancel = await request(app).post(`/api/matches/${final.id}/cancel`).set(t.auth).send({ expectedRevision: (await getMatch(final.id, t.auth)).revision }).expect(422);
    assert.equal(cancel.body.code, "TWO_LEGS_TIE_OPERATION_UNSUPPORTED");
    // Finish: the final decides the tournament.
    const done = await recordLeg(final.id, 2, 2, 2, t.auth);
    assert.equal(done.status, "completed");
    const [tournament] = await rows("SELECT status, winner_id FROM tournaments WHERE id = $1", [t.id]);
    assert.equal(tournament.status, "completed");
    assert.equal(tournament.winner_id, done.winnerId);
  });

  test("14: two organizers write the same leg at once — exactly one wins, the other gets a conflict and nothing is mixed", async () => {
    const t = await createFromPreset("single_elimination", { participantCount: 2, twoLegs: 1 });
    await addPlayers(t.id, t.auth, ["Pierwsi", "Drudzy"]);
    await request(app).post(`/api/tournaments/${t.id}/start`).set(t.auth).expect(200);
    const [final] = await listMatches(t.id, t.auth);
    const revision = leg(final, 1).revision;
    const second = { "x-organizer-token": t.auth["x-organizer-token"] };
    const [one, two] = await Promise.all([
      request(app).post(`/api/matches/${final.id}/legs/1/result`).set(t.auth).send({ score1: 2, score2: 0, expectedRevision: revision }),
      request(app).post(`/api/matches/${final.id}/legs/1/result`).set(second).send({ score1: 0, score2: 1, expectedRevision: revision }),
    ]);
    const statuses = [one.status, two.status].sort();
    assert.deepEqual(statuses, [200, 409]);
    const loser = one.status === 409 ? one : two;
    assert.ok(["CONCURRENT_MODIFICATION", "LEG_ALREADY_RECORDED"].includes(loser.body.code));
    const stored = leg(await getMatch(final.id, t.auth), 1);
    const winnerBody = one.status === 200 ? { score1: 2, score2: 0 } : { score1: 0, score2: 1 };
    assert.deepEqual([stored.score1, stored.score2], [winnerBody.score1, winnerBody.score2]);
    // The same request repeated after a lost response is accepted without a second write.
    const retry = await request(app).post(`/api/matches/${final.id}/legs/1/result`).set(t.auth).send({ ...winnerBody, expectedRevision: revision }).expect(200);
    assert.equal(retry.body.message, "Ten wynik był już zapisany.");
    assert.equal((await rows("SELECT count(*)::int AS n FROM match_tie_history WHERE match_id = $1", [final.id]))[0].n, 1);
  });

  test("6+9: a team cup in two-legged ties survives export and restore into a separate database", async () => {
    const t = await createFromPreset("single_elimination", { participantCount: 4, twoLegs: 1 }, { participantType: "teams", teamRosterMin: 1, teamRosterMax: 5 });
    await addPlayers(t.id, t.auth, ["KS Błyskawica", "Ośmiornice", "Rekiny", "Sokoły"]);
    await request(app).post(`/api/tournaments/${t.id}/start`).set(t.auth).expect(200);
    const [semi1, semi2] = (await listMatches(t.id, t.auth)).filter((match) => match.round === 1);
    await recordLeg(semi1.id, 1, 2, 2, t.auth);
    await recordLeg(semi1.id, 2, 0, 0, t.auth);
    const level = await getMatch(semi1.id, t.auth);
    await request(app).post(`/api/matches/${semi1.id}/tie-decision`).set(t.auth).send({ winnerId: level.player1Id, reason: "Dogrywka 1:0", expectedRevision: level.revision }).expect(200);
    await recordLeg(semi2.id, 1, 3, 0, t.auth);
    await request(app).put(`/api/matches/${semi2.id}/legs/2/schedule`).set(t.auth).send({ scheduledAt: "2026-12-12T17:00:00.000Z", expectedScheduledAt: null }).expect(200);
    const backup = (await request(app).get(`/api/tournaments/${t.id}/export`).set(t.auth).expect(200)).body as Json;
    assert.equal(backup.tieLegs.length, 6, "two legs of each of the three ties");
    assert.equal(backup.tieDecisions.length, 1);
    assert.equal(backup.tieHistory.length, 4, "4 recorded legs and 1 decision → leg, leg, decision, leg");
    assert.doesNotThrow(() => validateBackupV3(backup));
    // A tampered backup (aggregate that does not match the legs) is refused before anything is written.
    const tampered = structuredClone(backup);
    const decided = tampered.matches.find((match: Json) => match.backupId === semi1.id);
    decided.score1 = 9;
    assert.throws(() => validateBackupV3(tampered), (error: Json) => (error.details as string[]).some((detail) => /aggregate of both legs/.test(detail)));
    const target = await restoreTarget();
    const restored = await restoreInSeparateProcess(backup, target);
    const project = (b: Json) => ({
      legs: b.tieLegs.map(({ matchBackupId: _m, ...rest }: Json) => rest),
      decisions: (b.tieDecisions ?? []).map(({ matchBackupId: _m, winnerBackupId: _w, ...rest }: Json) => rest),
      history: (b.tieHistory ?? []).map(({ matchBackupId: _m, winnerBackupId: _w, ...rest }: Json) => rest),
      matches: b.matches.map((match: Json) => [match.round, match.matchNumber, match.status, match.score1, match.score2]),
    });
    assert.deepEqual(project(restored.reExported), project(backup));
  });

  test("7+12: groups, then a two-legged play-off — from the AI file through the engine", async () => {
    const aiFile = {
      schemaVersion: 1, kind: "tournament", participants: { type: "teams", count: 8 },
      structure: { type: "stages", stages: [
        { label: "Grupy", format: "group_stage", groupCount: 2, qualifiersPerGroup: 2, bestOf: 1, leagueRules: { allowDraws: true, points: { win: 3, draw: 1, loss: 0 } } },
        { label: "Play-off", format: "single_elimination", bestOf: 1, matchRules: { kind: "two_legs" } },
      ] },
    };
    const validation = (await request(app).post("/api/tournaments/ai-config/validate").send({ text: JSON.stringify(aiFile) })).body as Json;
    assert.equal(validation.valid, true, JSON.stringify(validation.problems ?? validation));
    const plan = validation.preview?.creation?.stagePlan ?? validation.creation?.stagePlan;
    assert.ok(plan, "the AI preview gives a stage plan");
    assert.equal(plan.stages[1].matchRules.kind, "two_legs");
    // Something the engine cannot run is refused with a reason.
    const wrong = structuredClone(aiFile);
    wrong.structure.stages[0] = { ...wrong.structure.stages[0], matchRules: { kind: "two_legs" } } as Json;
    const refused = (await request(app).post("/api/tournaments/ai-config/validate").send({ text: JSON.stringify(wrong) })).body as Json;
    assert.equal(refused.valid, false);
    assert.ok(JSON.stringify(refused.problems).includes("drabince pojedynczej eliminacji"));

    const created = await request(app).post("/api/tournaments")
      .send({ name: `Play-off ${randomUUID()}`, organizerPassword: "two-legs-organizer-password", format: "round_robin", maxPlayers: 8, defaultBestOf: 1, stagePlan: plan, participantType: "teams", teamRosterMin: 1, teamRosterMax: 5 }).expect(201);
    const auth = { "x-organizer-token": created.body.organizerToken as string };
    const id = created.body.id as number;
    await addPlayers(id, auth, ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]);
    const stages = (await request(app).get(`/api/tournaments/${id}/stages`).set(auth).expect(200)).body as Json[];
    const [groups, playoff] = stages.sort((x: Json, y: Json) => x.position - y.position);
    assert.equal(playoff.matchRules.kind, "two_legs");
    await request(app).post(`/api/tournaments/${id}/stages/${groups.id}/start`).set(auth).expect(200);
    for (const match of (await listMatches(id, auth)).filter((entry) => entry.stageId === groups.id)) {
      await request(app).post(`/api/matches/${match.id}/complete`).set(auth)
        .send({ resultType: "played", score1: match.player1Id < match.player2Id ? 2 : 0, score2: match.player1Id < match.player2Id ? 0 : 2, expectedRevision: match.revision }).expect(200);
    }
    await request(app).post(`/api/tournaments/${id}/stages/${groups.id}/complete`).set(auth).expect(200);
    await request(app).post(`/api/tournaments/${id}/stages/${playoff.id}/start`).set(auth).expect(200);
    const playoffMatches = (await listMatches(id, auth)).filter((entry) => entry.stageId === playoff.id);
    assert.equal(playoffMatches.length, 3);
    assert.ok(playoffMatches.every((match) => match.legs?.length === 2), "every play-off tie has two legs");
    for (const round of [1, 2]) {
      for (const match of (await listMatches(id, auth)).filter((entry) => entry.stageId === playoff.id && entry.round === round)) {
        await recordLeg(match.id, 1, 1, 0, auth);
        await recordLeg(match.id, 2, 0, 0, auth);
      }
    }
    // The last stage of a multi-stage tournament is closed by the organizer, as for any play-off.
    const final = (await listMatches(id, auth)).find((entry) => entry.stageId === playoff.id && entry.round === 2);
    assert.equal(final.status, "completed");
    await request(app).post(`/api/tournaments/${id}/stages/${playoff.id}/complete`).set(auth).expect(200);
    const [tournament] = await rows("SELECT status, winner_id FROM tournaments WHERE id = $1", [id]);
    assert.equal(tournament.status, "completed");
    assert.equal(tournament.winner_id, final.winnerId, "the winner of the final tie wins the tournament");
  });

  test("11: viewers get both legs, the aggregate and the state — never internal fields; old elimination brackets have no legs", async () => {
    const t = await createFromPreset("single_elimination", { participantCount: 2, twoLegs: 1 });
    await addPlayers(t.id, t.auth, ["Gospodarze", "Goście"]);
    await request(app).post(`/api/tournaments/${t.id}/start`).set(t.auth).expect(200);
    const [final] = await listMatches(t.id, t.auth);
    await request(app).patch(`/api/matches/${final.id}`).set(t.auth).send({ note: "Prywatne: zapasowe boisko", expectedRevision: final.revision }).expect(200);
    await recordLeg(final.id, 1, 3, 1, t.auth);
    const viewer = (await listMatches(t.id))[0];
    assert.equal(viewer.legs.length, 2);
    assert.deepEqual([viewer.tie.state, viewer.tie.total1, viewer.tie.total2], ["first_leg_played", 3, 1]);
    assert.equal("note" in viewer, false);
    const classic = await createFromPreset("single_elimination", { participantCount: 2 });
    await addPlayers(classic.id, classic.auth, ["X", "Y"]);
    await request(app).post(`/api/tournaments/${classic.id}/start`).set(classic.auth).expect(200);
    const [plain] = await listMatches(classic.id);
    assert.equal(plain.legs, null);
    assert.equal(plain.tie, null);
    const notTie = await request(app).post(`/api/matches/${plain.id}/legs/1/result`).set(classic.auth).send({ score1: 1, score2: 0, expectedRevision: 1 }).expect(422);
    assert.equal(notTie.body.code, "NOT_A_TWO_LEGGED_TIE");
  });

  test("presets: the two-legged option exists only where it fully works and explains itself", async () => {
    const league = await request(app).post("/api/tournaments/presets/preview").send({ presetId: "round_robin", params: { participantCount: 6, twoLegs: 1 } });
    assert.ok(league.status >= 400);
    const sets = await request(app).post("/api/tournaments/presets/preview").send({ presetId: "single_elimination", params: { participantCount: 8, twoLegs: 1, setsToWin: 2 } }).expect(422);
    assert.equal(sets.body.param ?? sets.body.problem?.param ?? "twoLegs", "twoLegs");
    const series = await request(app).post("/api/tournaments/presets/preview").send({ presetId: "single_elimination", params: { participantCount: 8, twoLegs: 1, bestOf: 3 } }).expect(422);
    assert.ok(JSON.stringify(series.body).includes("dwumecz"));
    const playoff = (await request(app).post("/api/tournaments/presets/preview").send({ presetId: "groups_playoff", params: { participantCount: 16, twoLegs: 1 } }).expect(200)).body;
    const bracket = playoff.stagePlan.stages.find((stage: Json) => stage.format === "single_elimination");
    assert.equal(bracket.matchRules.kind, "two_legs");
    assert.equal(playoff.stagePlan.stages.find((stage: Json) => stage.format === "group_stage").matchRules, undefined);
    assert.match(playoff.matchRulesSummary, /W play-off: Dwumecz/);
  });
});

// ── restore into a separate database (same harness as the team backup round trip) ──
async function restoreTarget(): Promise<{ url: string; schema: string }> {
  const schema = `tm_test_restore_${randomUUID().replaceAll("-", "").slice(0, 10)}`;
  if (process.env.TEST_RESTORE_DATABASE_URL) return { url: process.env.TEST_RESTORE_DATABASE_URL, schema };
  const source = new URL(process.env.TEST_DATABASE_URL!);
  const restoreName = `${source.pathname.slice(1)}_restore`;
  try {
    const exists = (await database.pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [restoreName])).rowCount === 1;
    if (!exists) await database.pool.query(`CREATE DATABASE "${restoreName}"`);
    const target = new URL(source.toString());
    target.pathname = `/${restoreName}`;
    target.search = "";
    return { url: target.toString(), schema };
  } catch {
    const target = new URL(source.toString());
    target.search = "";
    return { url: target.toString(), schema };
  }
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
