/**
 * V5.5 on PostgreSQL: point adjustments are organiser-only, audited, applied by every points table and
 * by stage completion (qualifiers), frozen once the stage ends, and carried by Backup V3.
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
  process.env.SESSION_SECRET = `v55-${randomUUID()}`;
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
    .send({ name: `V5.5 ${randomUUID().slice(0, 6)}`, organizerPassword: "integration-organizer-password", supportPassword: "integration-support-password", ...preview.creation })
    .expect(201);
  const tournamentId = created.body.id as number;
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  const organizer = { "x-organizer-token": signOrganizerToken(tournamentId, row!.organizer_password_hash) };
  const ids: number[] = [];
  for (let index = 1; index <= params.participantCount!; index += 1) {
    ids.push((await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: `P${index}` }).expect(201)).body.id);
  }
  const supportLogin = await request(app).post(`/api/tournaments/${tournamentId}/auth/support-login`).send({ password: "integration-support-password", nick: "Pomoc" }).expect(200);
  const stages = await rows<{ id: number; format: string }>("SELECT id, format FROM tournament_stages WHERE tournament_id = $1 ORDER BY position", [tournamentId]);
  return { tournamentId, organizer, support: { "x-support-token": supportLogin.body.sessionToken as string }, ids, stages };
}

async function openMatches(stageId: number) {
  return rows<{ id: number; player1_id: number; player2_id: number }>("SELECT id, player1_id, player2_id FROM matches WHERE stage_id = $1 AND status <> 'completed' AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number", [stageId]);
}

async function complete(headers: Record<string, string>, matchId: number, s1: number, s2: number) {
  await request(app).post(`/api/matches/${matchId}/complete`).set(headers)
    .send({ expectedRevision: await matchRevision(database, matchId), resultType: "played", score1: s1, score2: s2 }).expect(200);
}

describe("V5.5 point adjustments", () => {
  test("organiser-only, validated, audited; every table includes them; revoke keeps the record", async () => {
    const { tournamentId, organizer, support, ids, stages } = await setup("round_robin", { participantCount: 4, allowDraws: 1 });
    const stage = stages[0];
    const url = `/api/tournaments/${tournamentId}/stages/${stage.id}/point-adjustments`;
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    // Play 4 of 6 matches: a single-stage league completes itself after its last match (and then freezes).
    for (const match of (await openMatches(stage.id)).slice(0, 4)) await complete(organizer, match.id, 1, 0);

    await request(app).post(url).send({ playerId: ids[0], points: -3, reason: "Spóźnienie" }).expect(403);
    await request(app).post(url).set(support).send({ playerId: ids[0], points: -3, reason: "Spóźnienie" }).expect(403);
    const invalid = await request(app).post(url).set(organizer).send({ playerId: 999999, points: 0, reason: "" }).expect(422);
    assert.deepEqual(invalid.body.problems.map((problem: Json) => problem.field).sort(), ["playerId", "points", "reason"]);

    const before = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stage.id}/standings`).expect(200)).body.tables[0].rows as Json[];
    const leader = before[0];
    const added = (await request(app).post(url).set(organizer).send({ playerId: leader.playerId, points: -10, reason: "Walkower bez zgłoszenia" }).expect(201)).body;
    assert.equal(added.entries.length, 1);
    assert.deepEqual(added.totals, [{ playerId: leader.playerId, points: -10 }]);
    const live = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stage.id}/standings`).expect(200)).body.tables[0].rows as Json[];
    const penalised = live.find((row) => row.playerId === leader.playerId);
    assert.equal(penalised.points, leader.points - 10);
    assert.equal(penalised.pointAdjustment, -10);
    assert.notEqual(live[0].playerId, leader.playerId, "the penalty moves the leader down");
    const standings = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[];
    assert.equal(standings.find((row) => row.playerId === leader.playerId).points, leader.points - 10, "tournament standings agree");
    const publicView = (await request(app).get(url).expect(200)).body;
    assert.equal(publicView.supported, true);
    assert.equal(publicView.entries[0].reason, "Walkower bez zgłoszenia");

    const revoked = (await request(app).post(`${url}/${added.entry.id}/revoke`).set(organizer).expect(200)).body;
    assert.deepEqual(revoked.totals, []);
    assert.ok(revoked.entries[0].revokedAt, "revoked entries stay for the record");
    await request(app).post(`${url}/${added.entry.id}/revoke`).set(organizer).expect(409);
    const log = await rows<{ action_type: string }>("SELECT action_type FROM action_logs WHERE tournament_id = $1 AND action_type LIKE 'stage_point_adjustment_%' ORDER BY id", [tournamentId])
      .catch(() => rows<{ action_type: string }>("SELECT action_type FROM action_log WHERE tournament_id = $1 AND action_type LIKE 'stage_point_adjustment_%' ORDER BY id", [tournamentId]));
    assert.deepEqual(log.map((row) => row.action_type), ["stage_point_adjustment_added", "stage_point_adjustment_revoked"]);
  });

  test("group completion qualifies by adjusted points; a completed stage is frozen", async () => {
    const { tournamentId, organizer, ids, stages } = await setup("groups_playoff", { participantCount: 8, groupCount: 2, qualifiersPerGroup: 2 });
    const [groups, playoff] = stages;
    const url = `/api/tournaments/${tournamentId}/stages/${groups.id}/point-adjustments`;
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    for (const match of await openMatches(groups.id)) await complete(organizer, match.id, 1, 0);
    const live = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body;
    const groupA = live.tables[0];
    const qualifier = groupA.rows.find((row: Json) => row.zone === "qualify");
    await request(app).post(url).set(organizer).send({ playerId: qualifier.playerId, points: -20, reason: "Dyskwalifikacja z meczu" }).expect(201);
    const after = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body;
    assert.equal(after.tables[0].rows.find((row: Json) => row.playerId === qualifier.playerId).zone, "out");
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups.id}/complete`).set(organizer).expect(200);
    const qualified = (await rows<{ player_id: number }>("SELECT player_id FROM stage_participants WHERE stage_id = $1", [playoff.id])).map((row) => row.player_id);
    assert.equal(qualified.includes(qualifier.playerId), false, "the engine took the adjusted table");
    assert.equal(qualified.length, 4);
    const frozen = await request(app).post(url).set(organizer).send({ playerId: ids[0], points: 1, reason: "Po fakcie" }).expect(409);
    assert.equal(frozen.body.code, "STAGE_COMPLETED");
    const playoffUrl = `/api/tournaments/${tournamentId}/stages/${playoff.id}/point-adjustments`;
    const unsupported = await request(app).post(playoffUrl).set(organizer).send({ playerId: qualified[0], points: 1, reason: "x" }).expect(422);
    assert.equal(unsupported.body.code, "POINT_ADJUSTMENTS_NOT_SUPPORTED");
  });

  test("Backup V3 exports, validates and restores adjustments with remapped players", async () => {
    const { tournamentId, organizer, ids, stages } = await setup("round_robin", { participantCount: 4 });
    const url = `/api/tournaments/${tournamentId}/stages/${stages[0].id}/point-adjustments`;
    await request(app).post(url).set(organizer).send({ playerId: ids[1], points: 2, reason: "Bonus za fair play" }).expect(201);
    const { exportBackupV3, importBackupV3, validateBackupV3 } = await import("../src/application/backups/backup-v3");
    const backup = (await exportBackupV3(tournamentId))!;
    assert.equal(backup.stages[0].pointAdjustments?.length, 1);
    validateBackupV3(backup);
    const broken = structuredClone(backup);
    broken.stages[0].pointAdjustments![0].playerId = 987654;
    assert.throws(() => validateBackupV3(broken), (error: unknown) => ((error as { details?: string[] }).details ?? []).some((text) => /unknown player/.test(text)));
    const [hash] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
    const restored = await importBackupV3(backup, { organizerPasswordHash: hash!.organizer_password_hash } as never) as Json;
    const restoredId = (restored.id ?? restored.tournamentId ?? restored.tournament?.id) as number;
    const [stage] = await rows<{ id: number; point_adjustments: Json }>("SELECT id, point_adjustments FROM tournament_stages WHERE tournament_id = $1 ORDER BY position LIMIT 1", [restoredId]);
    const [player] = await rows<{ id: number }>("SELECT id FROM players WHERE tournament_id = $1 AND name = 'P2'", [restoredId]);
    assert.equal(stage!.point_adjustments[0].playerId, player!.id, "player ids remapped to the copy");
    assert.equal(stage!.point_adjustments[0].reason, "Bonus za fair play");
  });
});

describe("V5.5 point adjustments — evidence", () => {
  const tables = async (tournamentId: number, stageId: number) =>
    (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stageId}/standings`).expect(200)).body as Json;

  test("a bonus lifts a participant into the qualifying places and the engine qualifies them", async () => {
    const { tournamentId, organizer, stages } = await setup("groups_playoff", { participantCount: 8, groupCount: 2, qualifiersPerGroup: 2 });
    const [groups, playoff] = stages;
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    for (const match of await openMatches(groups.id)) await complete(organizer, match.id, 1, 0);
    const before = (await tables(tournamentId, groups.id)).tables[0];
    const outsider = before.rows.find((row: Json) => row.zone === "out");
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups.id}/point-adjustments`).set(organizer)
      .send({ playerId: outsider.playerId, points: 20, reason: "Bonus regulaminowy" }).expect(201);
    const after = (await tables(tournamentId, groups.id)).tables[0];
    assert.equal(after.rows.find((row: Json) => row.playerId === outsider.playerId).zone, "qualify");
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups.id}/complete`).set(organizer).expect(200);
    const qualified = (await rows<{ player_id: number }>("SELECT player_id FROM stage_participants WHERE stage_id = $1", [playoff.id])).map((row) => row.player_id);
    assert.ok(qualified.includes(outsider.playerId), "the bonus decided qualification");
  });

  test("retry with the same key adds nothing; revoke restores the table; results and head-to-head data untouched; author recorded", async () => {
    const { tournamentId, organizer, ids, stages } = await setup("round_robin", { participantCount: 4, allowDraws: 1 });
    const stage = stages[0];
    const url = `/api/tournaments/${tournamentId}/stages/${stage.id}/point-adjustments`;
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    for (const match of (await openMatches(stage.id)).slice(0, 4)) await complete(organizer, match.id, 2, 1);
    const matchesBefore = await rows("SELECT id, status, score1, score2, winner_id, result_type, revision FROM matches WHERE stage_id = $1 ORDER BY id", [stage.id]);
    const original = await tables(tournamentId, stage.id);

    const body = { playerId: ids[2], points: -2, reason: "Kara dyscyplinarna", requestId: "retry-key-0001" };
    const first = await request(app).post(url).set(organizer).send(body).expect(201);
    const second = await request(app).post(url).set(organizer).send(body).expect(200);
    assert.equal(second.body.replayed, true);
    assert.equal(second.body.entry.id, first.body.entry.id);
    const [both] = await Promise.all([
      request(app).post(url).set(organizer).send({ ...body, requestId: "double-click-01" }),
      request(app).post(url).set(organizer).send({ ...body, requestId: "double-click-01" }),
    ]);
    assert.ok([200, 201].includes(both.status));
    const view = (await request(app).get(url).expect(200)).body;
    assert.equal(view.entries.length, 2, "one entry per key, even for parallel double clicks");
    assert.deepEqual(view.totals, [{ playerId: ids[2], points: -4 }]);
    assert.match(view.entries[0].createdBy, /^organizer:/, "author recorded");
    assert.deepEqual(await rows("SELECT id, status, score1, score2, winner_id, result_type, revision FROM matches WHERE stage_id = $1 ORDER BY id", [stage.id]), matchesBefore, "match results (the head-to-head source) are unchanged");

    for (const entry of view.entries) await request(app).post(`${url}/${entry.id}/revoke`).set(organizer).expect(200);
    const restored = await tables(tournamentId, stage.id);
    const strip = (data: Json) => data.tables[0].rows.map((row: Json) => ({ ...row, pointAdjustment: 0 }));
    assert.deepEqual(strip(restored), strip(original), "after revoking, the table is exactly the original");
    const history = (await request(app).get(url).expect(200)).body;
    assert.equal(history.entries.length, 2);
    assert.ok(history.entries.every((entry: Json) => entry.revokedAt && /^organizer:/.test(entry.revokedBy)), "history keeps who revoked and when");
  });

  test("Stable (tournament standings) and Experimental (stage table) show the same points; backup keeps active and revoked entries and the same table", async () => {
    const { tournamentId, organizer, ids, stages } = await setup("round_robin", { participantCount: 4 });
    const stage = stages[0];
    const url = `/api/tournaments/${tournamentId}/stages/${stage.id}/point-adjustments`;
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    for (const match of (await openMatches(stage.id)).slice(0, 3)) await complete(organizer, match.id, 1, 0);
    await request(app).post(url).set(organizer).send({ playerId: ids[0], points: -3, reason: "Walkower" }).expect(201);
    const toRevoke = (await request(app).post(url).set(organizer).send({ playerId: ids[1], points: 2, reason: "Pomyłka" }).expect(201)).body.entry;
    await request(app).post(`${url}/${toRevoke.id}/revoke`).set(organizer).expect(200);

    const experimental = (await tables(tournamentId, stage.id)).tables[0].rows as Json[];
    const stable = (await request(app).get(`/api/tournaments/${tournamentId}/standings`).expect(200)).body as Json[];
    assert.deepEqual(stable.map((row) => [row.playerId, row.points]), experimental.map((row) => [row.playerId, row.points]), "same order and points in both interfaces");

    const { exportBackupV3, importBackupV3 } = await import("../src/application/backups/backup-v3");
    const backup = (await exportBackupV3(tournamentId))!;
    assert.equal(backup.stages[0].pointAdjustments?.length, 2);
    assert.equal(backup.stages[0].pointAdjustments?.filter((entry) => entry.revokedAt).length, 1);
    const [hash] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
    const restored = await importBackupV3(backup, { organizerPasswordHash: hash!.organizer_password_hash } as never) as Json;
    const restoredId = (restored.id ?? restored.tournamentId ?? restored.tournament?.id) as number;
    const [copyStage] = await rows<{ id: number }>("SELECT id FROM tournament_stages WHERE tournament_id = $1 ORDER BY position LIMIT 1", [restoredId]);
    const copyRows = (await tables(restoredId, copyStage!.id)).tables[0].rows as Json[];
    const byName = (list: Json[]) => list.map((row) => [row.playerName, row.points, row.rank, row.pointAdjustment]);
    assert.deepEqual(byName(copyRows), byName(experimental), "the restored copy gives the same table");
    const copyHistory = (await request(app).get(`/api/tournaments/${restoredId}/stages/${copyStage!.id}/point-adjustments`).expect(200)).body;
    assert.equal(copyHistory.entries.filter((entry: Json) => entry.revokedAt).length, 1, "revoked entry restored as revoked");
  });
});
