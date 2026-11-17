import { matchRevision } from "./match-revision-fixture";
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

interface DatabaseModule { pool: typeof import("@workspace/db").pool }

const SESSION_SECRET = `teams-${randomUUID()}`;
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
  process.env.SESSION_SECRET = SESSION_SECRET;
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

async function headersFor(tournamentId: number): Promise<Record<string, string>> {
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  return { "x-organizer-token": signOrganizerToken(tournamentId, row.organizer_password_hash) };
}

async function createTeamTournament(extra: Record<string, unknown> = {}) {
  const created = await request(app).post("/api/tournaments")
    .send({ name: `Drużyny ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "single_elimination", maxPlayers: 4, participantType: "teams", teamRosterMin: 2, teamRosterMax: 3, ...extra })
    .expect(201);
  const tournamentId = created.body.id as number;
  return { tournamentId, headers: await headersFor(tournamentId), body: created.body };
}

async function addEntries(tournamentId: number, headers: Record<string, string>, names: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const name of names) ids.push((await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name }).expect(201)).body.id);
  return ids;
}

describe("V5-D: teams as participants", () => {
  test("creation stores team mode and limits; player tournaments reject roster limits and roster calls", async () => {
    const { body, tournamentId } = await createTeamTournament();
    assert.equal(body.participantType, "teams");
    assert.equal(body.teamRosterMin, 2);
    assert.equal(body.teamRosterMax, 3);
    const overview = (await request(app).get(`/api/tournaments/${tournamentId}/teams`).expect(200)).body;
    assert.equal(overview.participantType, "teams");

    const bad = await request(app).post("/api/tournaments")
      .send({ name: `Gracze ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "single_elimination", teamRosterMin: 2 })
      .expect(422);
    assert.equal(bad.body.code, "INVALID_TEAM_SETTINGS");
    const players = await request(app).post("/api/tournaments")
      .send({ name: `Gracze ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "single_elimination" })
      .expect(201);
    assert.equal(players.body.participantType, "players");
    const headers = await headersFor(players.body.id);
    const [entry] = await addEntries(players.body.id, headers, ["Solo"]);
    const refused = await request(app).post(`/api/tournaments/${players.body.id}/teams/${entry}/members`).set(headers).send({ name: "X" }).expect(409);
    assert.equal(refused.body.code, "TEAM_MODE_REQUIRED");
    assert.deepEqual((await request(app).get(`/api/tournaments/${players.body.id}/teams`).expect(200)).body.teams, []);
  });

  test("roster changes keep history; one captain; duplicates and overflow are refused", async () => {
    const { tournamentId, headers } = await createTeamTournament();
    const [wolves] = await addEntries(tournamentId, headers, ["Wilki"]);
    const add = (name: string, role?: string) => request(app).post(`/api/tournaments/${tournamentId}/teams/${wolves}/members`).set(headers).send(role ? { name, role } : { name });
    let team = (await add("Ala", "captain").expect(201)).body;
    team = (await add("Bartek").expect(201)).body;
    assert.equal(team.ready, true);
    assert.deepEqual(team.members.map((member: { name: string; role: string }) => [member.name, member.role]), [["Ala", "captain"], ["Bartek", "player"]]);
    assert.equal((await add(" bartek ").expect(409)).body.code, "MEMBER_DUPLICATE");
    team = (await add("Celina", "captain").expect(201)).body;
    assert.deepEqual(team.members.map((member: { name: string; role: string }) => [member.name, member.role]), [["Celina", "captain"], ["Ala", "player"], ["Bartek", "player"]]);
    assert.equal((await add("Darek", "reserve").expect(409)).body.code, "ROSTER_FULL");

    const bartek = team.members.find((member: { name: string }) => member.name === "Bartek");
    team = (await request(app).patch(`/api/tournaments/${tournamentId}/teams/${wolves}/members/${bartek.id}`).set(headers).send({ role: "reserve" }).expect(200)).body;
    assert.equal(team.starters, 2);
    const ala = team.members.find((member: { name: string }) => member.name === "Ala");
    team = (await request(app).delete(`/api/tournaments/${tournamentId}/teams/${wolves}/members/${ala.id}`).set(headers).expect(200)).body;
    assert.equal(team.starters, 1);
    assert.equal(team.ready, false);
    assert.equal(team.formerMemberCount, 1);
    assert.equal(team.issues[0].code, "ROSTER_TOO_SMALL");

    const history = (await request(app).get(`/api/tournaments/${tournamentId}/teams/${wolves}/history`).expect(200)).body.history;
    assert.deepEqual(history.map((row: { name: string; role: string; leftReason: string | null }) => [row.name, row.role, row.leftReason]), [
      ["Ala", "captain", "role_change"], ["Bartek", "player", "role_change"], ["Ala", "player", "removed"], ["Celina", "captain", null], ["Bartek", "reserve", null],
    ]);
    // Database guarantees one active captain even against direct writes.
    const [teamRow] = await rows<{ id: number }>("SELECT id FROM tournament_teams WHERE player_id = $1", [wolves]);
    await assert.rejects(database.pool.query("INSERT INTO team_members (team_id, name, role) VALUES ($1, 'Inny', 'captain')", [teamRow.id]), /team_members_one_active_captain/);
  });

  test("anonymous users cannot change rosters; private details stay readable only with access", async () => {
    const { tournamentId, headers } = await createTeamTournament();
    const [entry] = await addEntries(tournamentId, headers, ["Orły"]);
    await request(app).post(`/api/tournaments/${tournamentId}/teams/${entry}/members`).send({ name: "Hacker" }).expect(403);
    await request(app).put(`/api/tournaments/${tournamentId}/team-settings`).send({ rosterMin: 1 }).expect(403);
    await request(app).post(`/api/tournaments/${tournamentId}/teams/${entry}/members`).set(headers).send({ name: "Ola", role: "boss" }).expect(422);
    await request(app).post(`/api/tournaments/${tournamentId}/teams/${entry}/members`).set(headers).send({ name: "Ola", extra: 1 }).expect(400);
    await request(app).post(`/api/tournaments/${tournamentId}/teams/999999/members`).set(headers).send({ name: "Ola" }).expect(404);
  });

  test("incomplete rosters block the start; complete teams play a full tournament to a champion", async () => {
    const { tournamentId, headers } = await createTeamTournament();
    const entries = await addEntries(tournamentId, headers, ["Rysie", "Sowy", "Żubry", "Bobry"]);
    for (const [index, entry] of entries.entries()) {
      await request(app).post(`/api/tournaments/${tournamentId}/teams/${entry}/members`).set(headers).send({ name: `Kapitan ${index}`, role: "captain" }).expect(201);
      if (index < 3) await request(app).post(`/api/tournaments/${tournamentId}/teams/${entry}/members`).set(headers).send({ name: `Gracz ${index}` }).expect(201);
    }
    const blocked = await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(422);
    assert.equal(blocked.body.code, "TEAM_ROSTER_INCOMPLETE");
    assert.deepEqual(blocked.body.details.map((team: { name: string }) => team.name), ["Bobry"]);
    const [{ status }] = await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [tournamentId]);
    assert.equal(status, "draft");

    await request(app).post(`/api/tournaments/${tournamentId}/teams/${entries[3]}/members`).set(headers).send({ name: "Gracz 3", role: "player" }).expect(201);
    const overview = (await request(app).get(`/api/tournaments/${tournamentId}/teams`).expect(200)).body;
    assert.equal(overview.readyCount, 4);
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    await request(app).put(`/api/tournaments/${tournamentId}/team-settings`).set(headers).send({ rosterMin: 1 }).expect(409);

    for (let guard = 0; guard < 10; guard += 1) {
      const ready = await rows<{ id: number; best_of: number; player1_id: number; player2_id: number }>(
        "SELECT id, best_of, player1_id, player2_id FROM matches WHERE tournament_id = $1 AND status = 'pending' AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number", [tournamentId]);
      if (!ready.length) break;
      for (const match of ready) {
        await request(app).post(`/api/matches/${match.id}/complete`).set(headers)
          .send({ expectedRevision: await matchRevision(database, match.id), resultType: "played", score1: 1, score2: 0 }).expect(200);
      }
      // Line-up change between matches is allowed and recorded.
      if (guard === 0) {
        await request(app).post(`/api/tournaments/${tournamentId}/teams/${entries[0]}/members`).set(headers).send({ name: "Zmiennik", role: "reserve" }).expect(201);
      }
    }
    const [{ status: after }] = await rows<{ status: string }>("SELECT status FROM tournaments WHERE id = $1", [tournamentId]);
    if (after !== "completed") {
      const [stage] = await rows<{ id: number }>("SELECT id FROM tournament_stages WHERE tournament_id = $1", [tournamentId]);
      await request(app).post(`/api/tournaments/${tournamentId}/stages/${stage.id}/complete`).set(headers).expect(200);
    }
    const [final] = await rows<{ status: string; winner_id: number }>("SELECT status, winner_id FROM tournaments WHERE id = $1", [tournamentId]);
    assert.equal(final.status, "completed");
    assert.equal(final.winner_id, entries[0], "team entry wins as an ordinary engine participant");
    // Stable endpoints keep working with team entries.
    const standings = (await request(app).get(`/api/tournaments/${tournamentId}/players`).expect(200)).body;
    assert.equal(standings.length, 4);
    const history = (await request(app).get(`/api/tournaments/${tournamentId}/teams/${entries[0]}/history`).expect(200)).body.history;
    assert.ok(history.some((row: { name: string }) => row.name === "Zmiennik"));
  });

  test("deleting an entry removes its team and roster (draft)", async () => {
    const { tournamentId, headers } = await createTeamTournament();
    const [entry] = await addEntries(tournamentId, headers, ["Kruki"]);
    await request(app).post(`/api/tournaments/${tournamentId}/teams/${entry}/members`).set(headers).send({ name: "Ewa" }).expect(201);
    await request(app).delete(`/api/players/${entry}`).set(headers).expect(204);
    const [{ teams, members }] = await rows<{ teams: number; members: number }>(
      "SELECT (SELECT count(*)::int FROM tournament_teams WHERE player_id = $1) AS teams, (SELECT count(*)::int FROM team_members m JOIN tournament_teams t ON t.id = m.team_id WHERE t.player_id = $1) AS members", [entry]);
    assert.deepEqual({ teams, members }, { teams: 0, members: 0 });
  });
});
