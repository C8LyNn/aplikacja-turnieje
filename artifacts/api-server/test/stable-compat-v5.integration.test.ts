import { matchRevision } from "./match-revision-fixture";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

// V5.1 P0: everything Stable (the emergency UI) can do keeps working on classic,
// home-and-away and team tournaments, and incompatible operations fail clearly
// (4xx with a readable message) without touching data.
interface DatabaseModule { pool: typeof import("@workspace/db").pool }
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let initialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

const rows = async <T,>(sql: string, values: unknown[] = []) => (await database.pool.query(sql, values)).rows as T[];

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `stable-v5-${randomUUID()}`;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  signOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function organizer(tournamentId: number) {
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  return { "x-organizer-token": signOrganizerToken(tournamentId, row.organizer_password_hash) };
}

async function support(tournamentId: number) {
  const response = await request(app).post(`/api/tournaments/${tournamentId}/auth/support-login`).send({ password: "stable-support-password", nick: "Wsparcie" }).expect(200);
  return { "x-support-token": response.body.sessionToken as string };
}

async function pending(tournamentId: number) {
  return rows<{ id: number; player1_id: number; player2_id: number }>(
    `SELECT m.id, m.player1_id, m.player2_id FROM matches m JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.tournament_id = $1 AND m.stage_id = t.active_stage_id AND m.status = 'pending' AND m.player1_id IS NOT NULL AND m.player2_id IS NOT NULL
      ORDER BY m.round, m.match_number`, [tournamentId]);
}

async function complete(headers: Record<string, string>, match: { id: number; player1_id: number }, winner: number) {
  return request(app).post(`/api/matches/${match.id}/complete`).set(headers)
    .send({ expectedRevision: await matchRevision(database, match.id), resultType: "played", score1: winner === match.player1_id ? 1 : 0, score2: winner === match.player1_id ? 0 : 1 });
}

async function snapshot(tournamentId: number) {
  return rows("SELECT (SELECT to_jsonb(t) - 'updated_at' FROM tournaments t WHERE id = $1) AS tournament, (SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM tournament_stages s WHERE tournament_id = $1) AS stages, (SELECT count(*)::int FROM matches WHERE tournament_id = $1) AS matches", [tournamentId]);
}

describe("V5.1: Stable stays a working fallback", () => {
  test("classic tournament: create, participants, results, correction, undo, roles, finish, backup", async () => {
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Stable ${randomUUID()}`, organizerPassword: "stable-organizer-password", supportPassword: "stable-support-password", format: "single_elimination" })
      .expect(201);
    const id = created.body.id as number;
    assert.equal(created.body.participantType, "players");
    const headers = await organizer(id);
    await request(app).post(`/api/tournaments/${id}/players/import`).set(headers).send({ mode: "replace", csv: "name,seed\nAda,1\nBen,2\nCeli,3\nDan,4" }).expect(200);
    const extra = (await request(app).post(`/api/tournaments/${id}/players`).set(headers).send({ name: "Do usunięcia" }).expect(201)).body as { id: number };
    await request(app).delete(`/api/players/${extra.id}`).set(headers).expect(204);
    await request(app).post(`/api/tournaments/${id}/start`).set(headers).expect(200);

    const [viewerTarget] = await pending(id);
    const viewer = await request(app).post(`/api/matches/${viewerTarget.id}/complete`).send({ expectedRevision: await matchRevision(database, viewerTarget.id), resultType: "played", score1: 1, score2: 0 });
    assert.equal(viewer.status, 403, "viewers cannot record results");
    const supportHeaders = await support(id);
    const [first, second] = await pending(id);
    await (await complete(supportHeaders, first, first.player1_id)).ok;
    assert.equal((await complete(supportHeaders, first, first.player1_id)).status >= 400, true, "stale revision is refused");
    // Wrong result: revert and record the other winner.
    await request(app).post(`/api/matches/${first.id}/revert`).set(supportHeaders).expect(200);
    assert.equal((await complete(headers, first, first.player2_id)).status, 200);
    assert.equal((await complete(headers, second, second.player1_id)).status, 200);
    await request(app).post(`/api/tournaments/${id}/undo-last`).set(headers).send({}).expect(200);
    assert.equal((await rows<{ status: string }>("SELECT status FROM matches WHERE id = $1", [second.id]))[0].status, "pending");
    for (let guard = 0; guard < 5; guard += 1) {
      const ready = await pending(id);
      if (!ready.length) break;
      for (const match of ready) assert.equal((await complete(headers, match, match.player1_id)).status, 200);
    }
    const [done] = await rows<{ status: string; winner_id: number }>("SELECT status, winner_id FROM tournaments WHERE id = $1", [id]);
    assert.equal(done.status, "completed");
    const exported = (await request(app).get(`/api/tournaments/${id}/export`).set(headers).expect(200)).body;
    assert.equal(exported.schemaVersion, 3);
    assert.equal("teamRosters" in exported, false);
    await request(app).get(`/api/tournaments/${id}/export`).set(supportHeaders).expect(403);
    for (const path of ["", "/players", "/matches", "/stages", "/teams"]) await request(app).get(`/api/tournaments/${id}${path}`).expect(200);
  });

  test("home-and-away league opened from Stable: reads and results work, a format change is refused cleanly", async () => {
    const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId: "round_robin", params: { participantCount: 3, legs: 2 } }).expect(200)).body;
    const created = await request(app).post("/api/tournaments").send({ name: `Liga ${randomUUID()}`, organizerPassword: "stable-organizer-password", ...preview.creation }).expect(201);
    const id = created.body.id as number;
    const headers = await organizer(id);
    for (const name of ["Orły", "Sokoły", "Jastrzębie"]) await request(app).post(`/api/tournaments/${id}/players`).set(headers).send({ name }).expect(201);

    const before = await snapshot(id);
    for (const format of ["swiss", "single_elimination"]) {
      const refused = await request(app).patch(`/api/tournaments/${id}`).set(headers).send({ format }).expect(409);
      assert.equal(refused.body.code, "ROUND_ROBIN_LEGS_FORMAT_LOCKED");
      assert.match(refused.body.error, /mecz i rewanż/);
    }
    assert.deepEqual(await snapshot(id), before, "refused change leaves no trace");
    await request(app).patch(`/api/tournaments/${id}`).set(headers).send({ name: "Liga po zmianie nazwy" }).expect(200);

    await request(app).post(`/api/tournaments/${id}/start`).set(headers).expect(200);
    const stages = (await request(app).get(`/api/tournaments/${id}/stages`).expect(200)).body;
    assert.equal(stages[0].roundRobinLegs, 2);
    const matches = (await request(app).get(`/api/tournaments/${id}/matches`).expect(200)).body;
    assert.equal(matches.length, 6, "3 teams × home and away");
    const ready = await pending(id);
    assert.equal((await complete(headers, ready[0], ready[0].player1_id)).status, 200);
    await request(app).post(`/api/tournaments/${id}/undo-last`).set(headers).send({}).expect(200);
    for (let guard = 0; guard < 10; guard += 1) {
      const next = await pending(id);
      if (!next.length) break;
      for (const match of next) assert.equal((await complete(headers, match, Math.min(match.player1_id, match.player2_id))).status, 200);
    }
    const [{ active_stage_id: stageId }] = await rows<{ active_stage_id: number | null }>("SELECT active_stage_id FROM tournaments WHERE id = $1", [id]);
    if (stageId !== null) await request(app).post(`/api/tournaments/${id}/stages/${stageId}/complete`).set(headers).expect(200);
    assert.equal((await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [id]))[0].status, "completed");
    const table = (await request(app).get(`/api/tournaments/${id}/standings`).expect(200)).body;
    const list = (Array.isArray(table) ? table : table.standings) as Array<{ matchesPlayed: number }>;
    assert.deepEqual(list.map((row) => row.matchesPlayed), [4, 4, 4], "table counts both legs");
    await request(app).get(`/api/tournaments/${id}/players`).expect(200);
  });

  test("team tournament opened from Stable: entries are teams, start explains missing rosters, nothing is corrupted", async () => {
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Drużyny ${randomUUID()}`, organizerPassword: "stable-organizer-password", format: "single_elimination", participantType: "teams", teamRosterMin: 2 })
      .expect(201);
    const id = created.body.id as number;
    const headers = await organizer(id);
    await request(app).post(`/api/tournaments/${id}/players/import`).set(headers).send({ mode: "replace", csv: "name\nRysie\nSowy" }).expect(200);
    const entries = await rows<{ id: number; name: string }>("SELECT id, name FROM players WHERE tournament_id = $1 ORDER BY id", [id]);
    const blocked = await request(app).post(`/api/tournaments/${id}/start`).set(headers).expect(422);
    assert.equal(blocked.body.code, "TEAM_ROSTER_INCOMPLETE");
    assert.match(blocked.body.error, /Składy wymagają uzupełnienia: Rysie, Sowy/);
    assert.equal((await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [id]))[0].status, "draft");
    // The direct first-stage start path enforces the same gate (V5.1 fix: it used to bypass it).
    const [firstStage] = await rows<{ id: number }>("SELECT id FROM tournament_stages WHERE tournament_id = $1 AND position = 1", [id]);
    const readiness = (await request(app).get(`/api/tournaments/${id}/stages/${firstStage.id}/readiness`).expect(200)).body;
    assert.equal(readiness.ready, false, "readiness must not say ready while rosters are incomplete");
    assert.equal(readiness.reasonCode, "TEAM_ROSTER_INCOMPLETE");
    assert.match(readiness.message, /Rysie, Sowy/);
    const viaStage = await request(app).post(`/api/tournaments/${id}/stages/${firstStage.id}/start`).set(headers).expect(422);
    assert.equal(viaStage.body.code, "TEAM_ROSTER_INCOMPLETE");
    assert.equal((await rows<{ status: string; matches: number }>("SELECT status, (SELECT count(*)::int FROM matches WHERE tournament_id = $1) AS matches FROM tournaments WHERE id = $1", [id]))[0].status, "draft");

    for (const entry of entries) {
      await request(app).post(`/api/tournaments/${id}/teams/${entry.id}/members`).set(headers).send({ name: `Kapitan ${entry.name}`, role: "captain" }).expect(201);
      await request(app).post(`/api/tournaments/${id}/teams/${entry.id}/members`).set(headers).send({ name: `Gracz ${entry.name}` }).expect(201);
    }
    // Stable rename of an entry renames the team, roster stays attached.
    await request(app).patch(`/api/players/${entries[0].id}`).set(headers).send({ name: "Rysie Kraków" }).expect(200);
    const overview = (await request(app).get(`/api/tournaments/${id}/teams`).expect(200)).body;
    assert.equal(overview.teams.find((team: { entryId: number }) => team.entryId === entries[0].id).name, "Rysie Kraków");
    assert.equal(overview.readyCount, 2);
    assert.equal((await request(app).get(`/api/tournaments/${id}/stages/${firstStage.id}/readiness`).expect(200)).body.ready, true);
    await request(app).post(`/api/tournaments/${id}/start`).set(headers).expect(200);
    // Replacing all entries with a CSV import is refused once the roster is locked (no orphaned teams).
    const locked = await request(app).post(`/api/tournaments/${id}/players/import`).set(headers).send({ mode: "replace", csv: "name\nX" });
    assert.equal(locked.status, 409);
    const [match] = await pending(id);
    assert.equal((await complete(headers, match, match.player1_id)).status, 200);
    const [final] = await rows<{ status: string; winner_id: number }>("SELECT status, winner_id FROM tournaments WHERE id = $1", [id]);
    assert.equal(final.status, "completed");
    assert.equal(final.winner_id, match.player1_id);
    const counts = (await rows<{ teams: number; members: number }>(
      "SELECT (SELECT count(*)::int FROM tournament_teams WHERE tournament_id = $1) AS teams, (SELECT count(*)::int FROM team_members m JOIN tournament_teams t ON t.id = m.team_id WHERE t.tournament_id = $1) AS members", [id]))[0];
    assert.deepEqual(counts, { teams: 2, members: 4 });
    const backup = (await request(app).get(`/api/tournaments/${id}/export`).set(headers).expect(200)).body;
    assert.equal(backup.teamRosters.teams.length, 2);
  });
});
