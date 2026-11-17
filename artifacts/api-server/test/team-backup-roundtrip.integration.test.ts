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
type Backup = Record<string, any>;

const SESSION_SECRET = `team-backup-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let validateBackupV3: typeof import("../src/application/backups/backup-v3").validateBackupV3;
let workDir: string;

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
  workDir = await mkdtemp(path.join(tmpdir(), "tm-team-backup-"));
});

after(async () => {
  if (workDir) await rm(workDir, { recursive: true, force: true });
  if (schemaInitialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function headersFor(tournamentId: number): Promise<Record<string, string>> {
  const [row] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
  return { "x-organizer-token": signOrganizerToken(tournamentId, row.organizer_password_hash) };
}

/**
 * A separate database is preferred (TEST_RESTORE_DATABASE_URL, or `<test db>_restore`
 * created on the same local cluster). Without CREATEDB rights the restore falls back to a
 * fresh, separately migrated schema; either way it runs in its own process.
 */
async function restoreTarget(): Promise<{ url: string; schema: string; kind: string }> {
  const schema = `tm_test_restore_${randomUUID().replaceAll("-", "").slice(0, 10)}`;
  if (process.env.TEST_RESTORE_DATABASE_URL) return { url: process.env.TEST_RESTORE_DATABASE_URL, schema, kind: "separate database (env)" };
  const source = new URL(process.env.TEST_DATABASE_URL!);
  const restoreName = `${source.pathname.slice(1)}_restore`;
  assert.match(restoreName, /^[a-z0-9_]+$/);
  try {
    const exists = (await database.pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [restoreName])).rowCount === 1;
    if (!exists) await database.pool.query(`CREATE DATABASE "${restoreName}"`);
    const target = new URL(source.toString());
    target.pathname = `/${restoreName}`;
    target.search = "";
    return { url: target.toString(), schema, kind: "separate database" };
  } catch {
    const target = new URL(source.toString());
    target.search = "";
    return { url: target.toString(), schema, kind: "separate schema (no CREATEDB)" };
  }
}

function restoreInSeparateProcess(backup: Backup, target: { url: string; schema: string }): Promise<Backup> {
  return (async () => {
    const input = path.join(workDir, `${randomUUID()}.json`);
    const output = path.join(workDir, `${randomUUID()}.out.json`);
    await writeFile(input, JSON.stringify(backup));
    const child = fileURLToPath(new URL("./support/backup-restore-child.ts", import.meta.url));
    const env: NodeJS.ProcessEnv = { ...process.env, RESTORE_DATABASE_URL: target.url, RESTORE_SCHEMA: target.schema };
    delete env.NODE_TEST_CONTEXT;
    const run = spawnSync(process.execPath, ["--import", "tsx", child, input, output], { env, encoding: "utf8", timeout: 120_000 });
    assert.equal(run.status, 0, `restore process failed: ${run.stderr.slice(-2000)}`);
    return JSON.parse(await readFile(output, "utf8"));
  })();
}

/** Ids differ between databases; compare everything through names and positions. */
function project(backup: Backup) {
  const name = new Map<number, string>(backup.players.map((player: Backup) => [player.backupId, player.name]));
  const entry = (id: number | null | undefined) => (id == null ? null : name.get(id));
  const stageKey = new Map<number, string>(backup.stages.map((stage: Backup) => [stage.backupId, stage.stageKey]));
  const { name: _name, activeStageBackupId, winnerBackupId, featuredMatchBackupId, ...tournament } = backup.tournament;
  return {
    tournament: { ...tournament, active: activeStageBackupId == null ? null : stageKey.get(activeStageBackupId), winner: entry(winnerBackupId) },
    players: backup.players.map(({ backupId: _id, ...player }: Backup) => player),
    stages: backup.stages.map(({ backupId: _id, winnerBackupId: winner, createdAt: _c, ...stage }: Backup) => ({ ...stage, winner: entry(winner) })),
    matches: backup.matches.map((match: Backup) => ({
      stage: stageKey.get(match.stageBackupId), round: match.round, matchNumber: match.matchNumber,
      p1: entry(match.player1BackupId), p2: entry(match.player2BackupId), winner: entry(match.winnerBackupId),
      score1: match.score1, score2: match.score2, status: match.status, resultType: match.resultType, completedAt: match.completedAt,
    })),
    resultHistory: backup.resultHistory.map((row: Backup) => ({
      round: row.round, matchNumber: row.matchNumber, revision: row.revision, winner: entry(row.winnerBackupId), score1: row.score1, score2: row.score2,
    })),
    teamRosters: backup.teamRosters && {
      formatVersion: backup.teamRosters.formatVersion,
      teams: backup.teamRosters.teams.map((team: Backup) => ({
        entry: entry(team.playerBackupId), shortCode: team.shortCode, createdAt: team.createdAt,
        members: team.members.map(({ backupId: _id, ...member }: Backup) => member),
      })),
    },
  };
}

async function play(tournamentId: number, headers: Record<string, string>, decide: (p1: number, p2: number) => number, limit = Infinity): Promise<number> {
  let played = 0;
  for (let guard = 0; guard < 200 && played < limit; guard += 1) {
    const [tournament] = await rows<{ status: string; active_stage_id: number }>("SELECT status, active_stage_id FROM tournaments WHERE id = $1", [tournamentId]);
    if (tournament.status === "completed") break;
    const ready = await rows<{ id: number; player1_id: number; player2_id: number }>(
      `SELECT id, player1_id, player2_id FROM matches WHERE tournament_id = $1 AND stage_id = $2 AND status = 'pending'
         AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number LIMIT 1`, [tournamentId, tournament.active_stage_id]);
    if (!ready.length) {
      await request(app).post(`/api/tournaments/${tournamentId}/stages/${tournament.active_stage_id}/complete`).set(headers).expect(200);
      continue;
    }
    const [match] = ready;
    const winner = decide(match.player1_id, match.player2_id);
    await request(app).post(`/api/matches/${match.id}/complete`).set(headers)
      .send({ expectedRevision: await matchRevision(database, match.id), resultType: "played", score1: winner === match.player1_id ? 1 : 0, score2: winner === match.player2_id ? 1 : 0 })
      .expect(200);
    played += 1;
  }
  return played;
}

describe("V5.1 P0: team tournament backup round trip", () => {
  test("teams, captains, reserves, roster history, matches and a corrected result survive restore into a separate database", async () => {
    // 1. Team league (home and away) created from the wizard preset.
    const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId: "round_robin", params: { participantCount: 4, legs: 2 } }).expect(200)).body;
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Liga drużyn ${randomUUID()}`, organizerPassword: "integration-organizer-password", ...preview.creation, participantType: "teams", teamRosterMin: 2, teamRosterMax: 4 })
      .expect(201);
    const tournamentId = created.body.id as number;
    const headers = await headersFor(tournamentId);
    // 2. Several teams with captains, players and reserves.
    const names = ["Rysie", "Sowy", "Żubry", "Bobry"];
    const entries: number[] = [];
    for (const [index, teamName] of names.entries()) {
      const entryId = (await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name: teamName }).expect(201)).body.id as number;
      entries.push(entryId);
      const add = (body: Record<string, unknown>) => request(app).post(`/api/tournaments/${tournamentId}/teams/${entryId}/members`).set(headers).send(body).expect(201);
      await add({ name: `Kapitan ${teamName}`, role: "captain" });
      await add({ name: `Gracz ${teamName}` });
      if (index % 2 === 0) await add({ name: `Rezerwa ${teamName}`, role: "reserve" });
    }
    await request(app).patch(`/api/tournaments/${tournamentId}/teams/${entries[0]}`).set(headers).send({ shortCode: "rys" }).expect(200);
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);

    // 3. Play part of the season, then change rosters between matches.
    const lowerIdWins = (p1: number, p2: number) => Math.min(p1, p2);
    assert.equal(await play(tournamentId, headers, lowerIdWins, 2), 2);
    const team0 = (await request(app).get(`/api/tournaments/${tournamentId}/teams`).expect(200)).body.teams.find((team: Backup) => team.entryId === entries[0]);
    const reserve = team0.members.find((member: Backup) => member.role === "reserve");
    const player = team0.members.find((member: Backup) => member.role === "player");
    await request(app).patch(`/api/tournaments/${tournamentId}/teams/${entries[0]}/members/${reserve.id}`).set(headers).send({ role: "player" }).expect(200);
    await request(app).delete(`/api/tournaments/${tournamentId}/teams/${entries[0]}/members/${player.id}`).set(headers).expect(200);
    await request(app).post(`/api/tournaments/${tournamentId}/teams/${entries[1]}/members`).set(headers).send({ name: "Nowy kapitan Sów", role: "captain" }).expect(201);

    // 4. Correct a wrong result: revert the last completed match and record the opposite winner.
    const [wrong] = await rows<{ id: number; player1_id: number; player2_id: number; winner_id: number }>(
      "SELECT id, player1_id, player2_id, winner_id FROM matches WHERE tournament_id = $1 AND status = 'completed' ORDER BY completed_at DESC, id DESC LIMIT 1", [tournamentId]);
    await request(app).post(`/api/matches/${wrong.id}/revert`).set(headers).expect(200);
    const corrected = wrong.winner_id === wrong.player1_id ? wrong.player2_id : wrong.player1_id;
    await request(app).post(`/api/matches/${wrong.id}/complete`).set(headers)
      .send({ expectedRevision: await matchRevision(database, wrong.id), resultType: "played", score1: corrected === wrong.player1_id ? 1 : 0, score2: corrected === wrong.player2_id ? 1 : 0 })
      .expect(200);

    // 5. Finish the season.
    await play(tournamentId, headers, lowerIdWins);
    const [finished] = await rows<{ status: string; winner_id: number | null }>("SELECT status, winner_id FROM tournaments WHERE id = $1", [tournamentId]);
    assert.equal(finished.status, "completed");
    const matchCount = (await rows<{ n: number }>("SELECT count(*)::int AS n FROM matches WHERE tournament_id = $1 AND status = 'completed'", [tournamentId]))[0].n;
    assert.equal(matchCount, 12, "4 teams × home and away = 12 matches");

    // 6. Backup.
    const backup = (await request(app).get(`/api/tournaments/${tournamentId}/export`).set(headers).expect(200)).body as Backup;
    assert.equal(backup.tournament.participantType, "teams");
    assert.equal(backup.tournament.teamRosterMin, 2);
    assert.equal(backup.tournament.teamRosterMax, 4);
    assert.equal(backup.teamRosters.formatVersion, 1);
    assert.equal(backup.teamRosters.teams.length, 4);
    const history = backup.teamRosters.teams.flatMap((team: Backup) => team.members);
    assert.ok(history.some((member: Backup) => member.leftReason === "removed"), "removed member is kept in history");
    assert.ok(history.some((member: Backup) => member.leftReason === "role_change"), "role changes are kept in history");
    assert.ok(history.some((member: Backup) => member.role === "reserve"), "reserves are exported");
    assert.equal(JSON.stringify(backup).includes("password"), false, "no credentials in the backup");
    assert.doesNotThrow(() => validateBackupV3(backup as never));

    // The HTTP V3 import stays disabled.
    const refused = await request(app).post("/api/tournaments/import").send({ backup, organizerPassword: "another-organizer-password" }).expect(422);
    assert.equal(refused.body.code, "BACKUP_V3_IMPORT_DISABLED");

    // 7. Restore in a separate, freshly migrated database (own process).
    const target = await restoreTarget();
    const result = await restoreInSeparateProcess(backup, target);
    console.log(JSON.stringify({ restoreTarget: target.kind, database: result.database, restored: result.restored, rows: result.rows }));
    assert.deepEqual(result.rows, { tournaments: 1, teams: 4, members: history.length });
    assert.equal(result.restored.teamsImported, 4);
    assert.equal(result.restored.teamMembersImported, history.length);

    // 8. Compare before and after.
    const restored = result.reExported as Backup;
    assert.equal(restored.tournament.name, `${backup.tournament.name} (kopia)`);
    assert.deepEqual(project(restored), project(backup));
    // Active roster per team, including captains and reserves.
    const active = (b: Backup) => b.teamRosters.teams.map((team: Backup) => team.members.filter((member: Backup) => member.leftAt === null).map((member: Backup) => `${member.role}:${member.name}`));
    assert.deepEqual(active(restored), active(backup));
    assert.ok(active(backup)[1].includes("captain:Nowy kapitan Sów"));
  });

  test("individual tournaments export exactly as before (no team fields)", async () => {
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Solo ${randomUUID()}`, organizerPassword: "integration-organizer-password", format: "single_elimination" }).expect(201);
    const headers = await headersFor(created.body.id);
    await request(app).post(`/api/tournaments/${created.body.id}/players`).set(headers).send({ name: "A" }).expect(201);
    const backup = (await request(app).get(`/api/tournaments/${created.body.id}/export`).set(headers).expect(200)).body as Backup;
    assert.equal("participantType" in backup.tournament, false);
    assert.equal("teamRosters" in backup, false);
    assert.doesNotThrow(() => validateBackupV3(backup as never));
  });

  test("unsafe or incomplete team sections are rejected before anything is written", async () => {
    const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId: "single_elimination", params: { participantCount: 4 } }).expect(200)).body;
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Walidacja ${randomUUID()}`, organizerPassword: "integration-organizer-password", ...preview.creation, participantType: "teams" }).expect(201);
    const headers = await headersFor(created.body.id);
    const entry = (await request(app).post(`/api/tournaments/${created.body.id}/players`).set(headers).send({ name: "Kruki" }).expect(201)).body.id;
    await request(app).post(`/api/tournaments/${created.body.id}/teams/${entry}/members`).set(headers).send({ name: "Ewa", role: "captain" }).expect(201);
    const good = (await request(app).get(`/api/tournaments/${created.body.id}/export`).set(headers).expect(200)).body as Backup;
    assert.doesNotThrow(() => validateBackupV3(good as never));
    const mutate = (change: (copy: Backup) => void) => { const copy = structuredClone(good); change(copy); return copy; };
    const cases: Array<[string, Backup, RegExp]> = [
      ["missing rosters", mutate((copy) => { delete copy.teamRosters; }), /must contain teamRosters/],
      ["rosters on individual tournament", mutate((copy) => { delete copy.tournament.participantType; delete copy.tournament.teamRosterMin; delete copy.tournament.teamRosterMax; }), /allowed only when/],
      ["future format", mutate((copy) => { copy.teamRosters.formatVersion = 2; }), /not supported/],
      ["unknown entry", mutate((copy) => { copy.teamRosters.teams[0].playerBackupId = 999999; }), /unknown entry/],
      ["two captains", mutate((copy) => { copy.teamRosters.teams[0].members.push({ ...copy.teamRosters.teams[0].members[0], backupId: 999998, name: "Drugi" }); }), /more than one active captain/],
      ["left before joining", mutate((copy) => { Object.assign(copy.teamRosters.teams[0].members[0], { leftAt: "2000-01-01T00:00:00.000Z", leftReason: "removed" }); }), /left before joining/],
      ["bad roster limits", mutate((copy) => { copy.tournament.teamRosterMin = 5; copy.tournament.teamRosterMax = 2; }), /settings are invalid/],
    ];
    for (const [label, backup, pattern] of cases) {
      assert.throws(() => validateBackupV3(backup as never), (error: Error & { details?: string[] }) => {
        assert.match((error.details ?? []).join(" "), pattern, label);
        return true;
      }, label);
    }
  });
});
