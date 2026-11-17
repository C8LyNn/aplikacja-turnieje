/**
 * V5.4 on PostgreSQL: live stage tables agree with the engine's qualifiers; seeding rules from presets
 * reach the stored plan; private tournaments keep their tables private.
 */
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
  process.env.SESSION_SECRET = `v54-${randomUUID()}`;
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
  return { "x-organizer-token": signOrganizerToken(tournamentId, row!.organizer_password_hash) };
}

async function createFromPreset(presetId: string, params: Record<string, number>, extra: Record<string, unknown> = {}) {
  const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId, params }).expect(200)).body;
  const created = await request(app).post("/api/tournaments")
    .send({ name: `V5.4 ${randomUUID().slice(0, 8)}`, organizerPassword: "integration-organizer-password", ...preview.creation, ...extra })
    .expect(201);
  const tournamentId = created.body.id as number;
  const headers = await headersFor(tournamentId);
  for (let index = 1; index <= params.participantCount!; index += 1) {
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(headers).send({ name: `P${String(index).padStart(2, "0")}` }).expect(201);
  }
  const stages = await rows<{ id: number; position: number; format: string }>("SELECT id, position, format FROM tournament_stages WHERE tournament_id = $1 ORDER BY position", [tournamentId]);
  return { preview, tournamentId, headers, stages };
}

type MatchRow = { id: number; player1_id: number; player2_id: number; status: string; result_type: string | null; stage_group_id: number | null };

async function openMatches(stageId: number): Promise<MatchRow[]> {
  return rows<MatchRow>("SELECT id, player1_id, player2_id, status, result_type, stage_group_id FROM matches WHERE stage_id = $1 AND status <> 'completed' AND player1_id IS NOT NULL AND player2_id IS NOT NULL ORDER BY round, match_number", [stageId]);
}

async function complete(headers: Record<string, string>, matchId: number, score1: number, score2: number) {
  await request(app).post(`/api/matches/${matchId}/complete`).set(headers)
    .send({ expectedRevision: await matchRevision(database, matchId), resultType: "played", score1, score2 })
    .expect(200);
}

describe("V5.4 live stage tables", () => {
  test("group tables rank by points with draws, mark the advancing zone and match the engine's qualifiers", async () => {
    const { tournamentId, headers, stages } = await createFromPreset("groups_playoff", { participantCount: 12, groupCount: 3, qualifiersPerGroup: 2, allowDraws: 1 });
    const [groups, playoff] = stages;
    const planned = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
    assert.equal(planned.status, "planned");
    assert.deepEqual(planned.tables, [], "a planned stage has no table yet");
    assert.equal(planned.advancingPlaces, 2);

    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers).expect(200);
    // Draw every third match; otherwise player1 wins 2:0 (goals in a points league).
    let index = 0;
    for (const match of await openMatches(groups.id)) {
      if (index % 3 === 0) await complete(headers, match.id, 1, 1);
      else await complete(headers, match.id, 2, 0);
      index += 1;
      if (index === 7) {
        const live = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
        assert.equal(live.final, false);
        assert.equal(live.tables.length, 3);
        assert.equal(live.tables.reduce((sum: number, table: Json) => sum + table.matchesPlayed, 0), 7);
        for (const table of live.tables) {
          assert.equal(table.rows.length, 4);
          const points = table.rows.map((row: Json) => row.points);
          assert.deepEqual(points, [...points].sort((a: number, b: number) => b - a), `${table.label} ordered by points`);
          for (const row of table.rows) {
            assert.equal(row.points, row.wins * 3 + row.draws, "3/1/0");
            assert.equal(row.zone, row.rank <= 2 ? "qualify" : "out");
          }
        }
      }
    }
    const done = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
    assert.ok(done.tables.some((table: Json) => table.rows.some((row: Json) => row.draws > 0)), "draws are counted");
    const zoneBeforeCompletion = done.tables.flatMap((table: Json) => table.rows.filter((row: Json) => row.zone === "qualify").map((row: Json) => row.playerId)).sort();

    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups.id}/complete`).set(headers).expect(200);
    const qualifiers = (await rows<{ player_id: number }>("SELECT player_id FROM stage_participants WHERE stage_id = $1", [playoff.id])).map((row) => row.player_id).sort();
    assert.deepEqual(qualifiers, zoneBeforeCompletion, "the advancing zone shown live is exactly who the engine qualifies");

    const final = (await request(app).get(`/api/tournaments/${tournamentId}/stages/${groups.id}/standings`).expect(200)).body as Json;
    assert.equal(final.final, true, "completed stages show stored places");
    const stored = await rows<{ player_id: number; group_rank: number }>("SELECT player_id, group_rank FROM stage_participants WHERE stage_id = $1", [groups.id]);
    for (const table of final.tables) {
      for (const row of table.rows) assert.equal(row.rank, stored.find((item) => item.player_id === row.playerId)!.group_rank);
    }
  });

  test("a league table counts draws; Swiss returns a ranking with Buchholz; brackets have no table", async () => {
    const league = await createFromPreset("round_robin", { participantCount: 4, allowDraws: 1 });
    await request(app).post(`/api/tournaments/${league.tournamentId}/start`).set(league.headers).expect(200);
    const [first] = await openMatches(league.stages[0].id);
    await complete(league.headers, first.id, 2, 2);
    const table = (await request(app).get(`/api/tournaments/${league.tournamentId}/stages/${league.stages[0].id}/standings`).expect(200)).body as Json;
    assert.equal(table.tables.length, 1);
    assert.equal(table.tables[0].rows.filter((row: Json) => row.draws === 1 && row.points === 1).length, 2);
    assert.equal(table.advancingPlaces, null, "a single league advances nobody");

    const swiss = await createFromPreset("swiss", { participantCount: 6, swissRounds: 3 });
    await request(app).post(`/api/tournaments/${swiss.tournamentId}/start`).set(swiss.headers).expect(200);
    for (const match of await openMatches(swiss.stages[0].id)) await complete(swiss.headers, match.id, 1, 0);
    const ranking = (await request(app).get(`/api/tournaments/${swiss.tournamentId}/stages/${swiss.stages[0].id}/standings`).expect(200)).body as Json;
    assert.equal(ranking.format, "swiss");
    assert.equal(ranking.tables[0].rows.length, 6);
    assert.equal(ranking.leagueRules, null);
    assert.ok(ranking.tables[0].rows.every((row: Json) => row.points === null));

    const bracket = await createFromPreset("single_elimination", { participantCount: 4 });
    await request(app).post(`/api/tournaments/${bracket.tournamentId}/start`).set(bracket.headers).expect(200);
    const none = (await request(app).get(`/api/tournaments/${bracket.tournamentId}/stages/${bracket.stages[0].id}/standings`).expect(200)).body as Json;
    assert.deepEqual(none.tables, []);
  });

  test("private tournaments keep stage tables private; foreign stages are 404", async () => {
    const hidden = await createFromPreset("round_robin", { participantCount: 4 }, { visibility: "private_offline" });
    await request(app).get(`/api/tournaments/${hidden.tournamentId}/stages/${hidden.stages[0].id}/standings`).expect(403);
    await request(app).get(`/api/tournaments/${hidden.tournamentId}/stages/${hidden.stages[0].id}/standings`).set(hidden.headers).expect(200);
    const other = await createFromPreset("round_robin", { participantCount: 4 });
    await request(app).get(`/api/tournaments/${other.tournamentId}/stages/${hidden.stages[0].id}/standings`).expect(404);
  });
});

describe("V5.4 seeding rules from presets", () => {
  test("random group draw and overall-ranking play-off seeding are stored and used", async () => {
    const { tournamentId, headers, stages } = await createFromPreset("groups_playoff", {
      participantCount: 8, groupCount: 2, qualifiersPerGroup: 2, groupPlacement: 1, qualifierSeeding: 1,
    }, {});
    const [groups, playoff] = stages;
    const [stored] = await rows<{ seeding_policy: string; result_seeding_policy: string; random_seed: string | null }>(
      "SELECT seeding_policy, result_seeding_policy, random_seed FROM tournament_stages WHERE id = $1", [groups.id],
    );
    assert.equal(stored!.seeding_policy, "random_groups");
    assert.equal(stored!.result_seeding_policy, "global_ranking");
    assert.equal(stored!.random_seed, "preset-draw", "a direct API client keeps the preview placeholder (the UI sends a fresh key)");
    // A random group draw is a ceremony the organiser runs before the start (unchanged engine rule).
    const endpoint = `/api/tournaments/${tournamentId}/stages/${groups.id}`;
    await request(app).post(`${endpoint}/seeding-ceremony/prepare`).set(headers).expect(200);
    await request(app).post(`${endpoint}/seeding-ceremony/reveal-all`).set(headers).expect(200);
    const started = await request(app).post(`/api/tournaments/${tournamentId}/start`).set(headers);
    assert.equal(started.status, 200, JSON.stringify(started.body));
    const assigned = await rows<{ group_id: number | null }>("SELECT group_id FROM stage_participants WHERE stage_id = $1", [groups.id]);
    assert.equal(assigned.length, 8);
    assert.ok(assigned.every((row) => row.group_id != null));
    for (const match of await openMatches(groups.id)) await complete(headers, match.id, 1, 0);
    await request(app).post(`/api/tournaments/${tournamentId}/stages/${groups.id}/complete`).set(headers).expect(200);
    assert.equal((await rows("SELECT 1 FROM stage_participants WHERE stage_id = $1", [playoff.id])).length, 4);
  });
});

describe("V5.4 participant fields", () => {
  const FIELDS = [
    { key: "nick_gry", label: "Nick w grze", type: "short_text", visibility: "public", required: true },
    { key: "discord", label: "Discord", type: "short_text", visibility: "staff", libraryId: "discord" },
    { key: "telefon", label: "Telefon", type: "short_text", visibility: "organizer" },
    { key: "mmr", label: "MMR", type: "number", min: 0, max: 5000, visibility: "public" },
    { key: "status_zgloszenia", label: "Status zgłoszenia", type: "select", options: ["Zgłoszony", "Potwierdzony"], defaultValue: "Zgłoszony", visibility: "staff", kind: "entry" },
  ];

  async function tournamentWithSupport() {
    const preview = (await request(app).post("/api/tournaments/presets/preview").send({ presetId: "single_elimination", params: { participantCount: 4 } }).expect(200)).body;
    const created = await request(app).post("/api/tournaments")
      .send({ name: `Pola ${randomUUID().slice(0, 6)}`, organizerPassword: "integration-organizer-password", supportPassword: "integration-support-password", ...preview.creation })
      .expect(201);
    const tournamentId = created.body.id as number;
    const organizer = await headersFor(tournamentId);
    const supportLogin = await request(app).post(`/api/tournaments/${tournamentId}/auth/support-login`).send({ password: "integration-support-password", nick: "Pomoc" }).expect(200);
    return { tournamentId, organizer, support: { "x-support-token": supportLogin.body.sessionToken as string } };
  }

  test("only the organiser defines fields; values are validated, defaulted and filtered by role", async () => {
    const { tournamentId, organizer, support } = await tournamentWithSupport();
    await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(support).send({ fields: FIELDS }).expect(403);
    await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).send({ fields: FIELDS }).expect(403);
    const bad = await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: [{ key: "token", label: "X", type: "short_text" }] }).expect(422);
    assert.equal(bad.body.code, "INVALID_PARTICIPANT_FIELDS");
    const saved = await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: FIELDS }).expect(200);
    assert.equal(saved.body.fields.fields.length, 5);

    const missing = await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: "Bez nicku" }).expect(422);
    assert.equal(missing.body.code, "INVALID_FIELD_VALUES");
    const added = await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer)
      .send({ name: "Ala", customFields: { nick_gry: "AlaPro", discord: "ala#1", telefon: "600100200", mmr: "2100" } }).expect(201);
    assert.deepEqual(added.body.customFields, { nick_gry: "AlaPro", discord: "ala#1", telefon: "600100200", mmr: 2100, status_zgloszenia: "Zgłoszony" });
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: "Zły", customFields: { nick_gry: "x", mmr: 99999 } }).expect(422);
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(support).send({ name: "Przez pomoc", customFields: { nick_gry: "P", telefon: "1" } }).expect(422);

    const asPublic = (await request(app).get(`/api/tournaments/${tournamentId}/players`).expect(200)).body as Json[];
    assert.deepEqual(asPublic[0].customFields, { nick_gry: "AlaPro", mmr: 2100 }, "viewers see public fields only");
    const asSupport = (await request(app).get(`/api/tournaments/${tournamentId}/players`).set(support).expect(200)).body as Json[];
    assert.deepEqual(Object.keys(asSupport[0].customFields).sort(), ["discord", "mmr", "nick_gry", "status_zgloszenia"]);
    const asOrganizer = (await request(app).get(`/api/tournaments/${tournamentId}/players`).set(organizer).expect(200)).body as Json[];
    assert.equal(asOrganizer[0].customFields.telefon, "600100200");
    const publicDefs = (await request(app).get(`/api/tournaments/${tournamentId}/participant-fields`).expect(200)).body;
    assert.deepEqual(publicDefs.fields.fields.map((field: Json) => field.key), ["nick_gry", "mmr"]);
    const tournamentBody = (await request(app).get(`/api/tournaments/${tournamentId}`).expect(200)).body;
    assert.equal("participantFields" in tournamentBody, false, "definitions are not leaked through the tournament object");
    const [raw] = await rows<{ custom_fields: Json }>("SELECT custom_fields FROM players WHERE tournament_id = $1", [tournamentId]);
    assert.equal(raw!.custom_fields.telefon, "600100200");
  });

  test("values stay editable after the start and never change results; helpers edit only non-private fields", async () => {
    const { tournamentId, organizer, support } = await tournamentWithSupport();
    await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: FIELDS }).expect(200);
    const ids: number[] = [];
    for (const name of ["A", "B", "C", "D"]) {
      ids.push((await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name, customFields: { nick_gry: name } }).expect(201)).body.id);
    }
    await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
    const matchesBefore = await rows("SELECT id, player1_id, player2_id, status, winner_id FROM matches WHERE tournament_id = $1 ORDER BY id", [tournamentId]);
    const updated = await request(app).put(`/api/players/${ids[0]}/custom-fields`).set(support).send({ values: { status_zgloszenia: "Potwierdzony" } }).expect(200);
    assert.equal(updated.body.customFields.status_zgloszenia, "Potwierdzony");
    assert.equal("telefon" in updated.body.customFields, false);
    const denied = await request(app).put(`/api/players/${ids[0]}/custom-fields`).set(support).send({ values: { telefon: "1" } }).expect(422);
    assert.equal(denied.body.code, "INVALID_FIELD_VALUES");
    await request(app).put(`/api/players/${ids[0]}/custom-fields`).send({ values: { mmr: 1 } }).expect(403);
    await request(app).put(`/api/players/${ids[0]}/custom-fields`).set(organizer).send({ values: { telefon: "500" } }).expect(200);
    assert.deepEqual(await rows("SELECT id, player1_id, player2_id, status, winner_id FROM matches WHERE tournament_id = $1 ORDER BY id", [tournamentId]), matchesBefore, "results untouched");
    const log = await rows<{ description: string }>("SELECT description FROM action_logs WHERE tournament_id = $1 AND action_type = 'participant_field_values_updated'", [tournamentId]).catch(async () =>
      rows<{ description: string }>("SELECT description FROM action_log WHERE tournament_id = $1 AND action_type = 'participant_field_values_updated'", [tournamentId]));
    assert.ok(log.length >= 2);
    assert.ok(log.every((row) => !row.description.includes("500")), "the log never contains values");
  });

  test("removing or retyping a field with values needs confirmation; then values are pruned", async () => {
    const { tournamentId, organizer } = await tournamentWithSupport();
    await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: FIELDS }).expect(200);
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: "A", customFields: { nick_gry: "A", mmr: 100, telefon: "1" } }).expect(201);
    const next = FIELDS.filter((field) => field.key !== "telefon").map((field) => (field.key === "mmr" ? { ...field, type: "short_text", min: undefined, max: undefined } : field));
    const refused = await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: next }).expect(409);
    assert.equal(refused.body.code, "PARTICIPANT_FIELD_VALUES_AFFECTED");
    assert.deepEqual(refused.body.impact.removedWithValues.map((item: Json) => item.key), ["telefon"]);
    assert.deepEqual(refused.body.impact.retypedWithValues.map((item: Json) => item.key), ["mmr"]);
    const [unchanged] = await rows<{ custom_fields: Json }>("SELECT custom_fields FROM players WHERE tournament_id = $1", [tournamentId]);
    assert.equal(unchanged!.custom_fields.telefon, "1", "nothing changed before confirmation");
    const confirmed = await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: next, confirmDropValues: true }).expect(200);
    assert.equal(confirmed.body.prunedParticipants, 1);
    const [after] = await rows<{ custom_fields: Json }>("SELECT custom_fields FROM players WHERE tournament_id = $1", [tournamentId]);
    assert.deepEqual(after!.custom_fields, { nick_gry: "A", status_zgloszenia: "Zgłoszony" }, "the number 100 is not silently turned into text");
  });

  test("CSV import fills fields by label; bad values skip the row with a reason", async () => {
    const { tournamentId, organizer } = await tournamentWithSupport();
    await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: FIELDS }).expect(200);
    const csv = "name;Nick w grze;MMR;Discord\nAla;AlaPro;2100;ala#1\nOla;OlaX;nie-liczba;ola#2\nEla;;;\n";
    const result = (await request(app).post(`/api/tournaments/${tournamentId}/players/import`).set(organizer).send({ csv, mode: "append" }).expect(200)).body;
    assert.equal(result.imported, 2);
    assert.ok(result.errors.some((error: Json) => /MMR/.test(error.reason)));
    const players = (await request(app).get(`/api/tournaments/${tournamentId}/players`).set(organizer).expect(200)).body as Json[];
    const ala = players.find((player) => player.name === "Ala");
    assert.deepEqual(ala.customFields, { nick_gry: "AlaPro", discord: "ala#1", mmr: 2100, status_zgloszenia: "Zgłoszony" });
  });

  test("Backup V3 exports, validates and restores definitions and values", async () => {
    const { tournamentId, organizer } = await tournamentWithSupport();
    await request(app).put(`/api/tournaments/${tournamentId}/participant-fields`).set(organizer).send({ fields: FIELDS }).expect(200);
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: "Ala", customFields: { nick_gry: "AlaPro", telefon: "600" } }).expect(201);
    const { exportBackupV3, importBackupV3, validateBackupV3 } = await import("../src/application/backups/backup-v3");
    const backup = (await exportBackupV3(tournamentId))!;
    assert.equal(backup.tournament.participantFields?.fields.length, 5);
    assert.deepEqual(backup.players[0].customFields, { nick_gry: "AlaPro", telefon: "600", status_zgloszenia: "Zgłoszony" });
    validateBackupV3(backup);
    const tampered = structuredClone(backup);
    tampered.players[0].customFields = { mmr: "dużo" } as never;
    const hasError = (pattern: RegExp) => (error: unknown) => Array.isArray((error as { details?: string[] }).details) && (error as { details: string[] }).details.some((text) => pattern.test(text));
    assert.throws(() => validateBackupV3(tampered), hasError(/field values are invalid/));
    const orphan = structuredClone(backup);
    delete (orphan.tournament as { participantFields?: unknown }).participantFields;
    assert.throws(() => validateBackupV3(orphan), hasError(/defines no participant fields/));
    const [hash] = await rows<{ organizer_password_hash: string }>("SELECT organizer_password_hash FROM tournaments WHERE id = $1", [tournamentId]);
    const restored = await importBackupV3(backup, { organizerPasswordHash: hash!.organizer_password_hash } as never) as Json;
    const restoredId = (restored.id ?? restored.tournamentId ?? restored.tournament?.id) as number;
    const [copy] = await rows<{ participant_fields: Json }>("SELECT participant_fields FROM tournaments WHERE id = $1", [restoredId]);
    assert.equal(copy!.participant_fields.fields.length, 5);
    const [copiedPlayer] = await rows<{ custom_fields: Json }>("SELECT custom_fields FROM players WHERE tournament_id = $1", [restoredId]);
    assert.deepEqual(copiedPlayer!.custom_fields, { nick_gry: "AlaPro", telefon: "600", status_zgloszenia: "Zgłoszony" });
  });
});
