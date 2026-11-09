import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema } from "./test-database";

let app: Express;
let db: typeof import("@workspace/db");
let schema: string;
let initialized = false;
let exported: Record<string, unknown>;
let baseline: Record<string, unknown>[];

async function snapshot(): Promise<Record<string, unknown>[]> {
  const tables = await db.pool.query(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = $1 ORDER BY tablename",
    [schema],
  );
  const result: Record<string, unknown>[] = [];
  for (const row of tables.rows) {
    const name = String(row.tablename);
    assert.match(name, /^[a-z_][a-z0-9_]*$/);
    const content = await db.pool.query(
      `SELECT count(*)::text AS count, md5(coalesce(string_agg(to_jsonb(t)::text, E'\\n' ORDER BY to_jsonb(t)::text), '')) AS digest FROM "${schema}"."${name}" AS t`,
    );
    result.push({ table: name, ...content.rows[0] });
  }
  return result;
}

before(async () => {
  const config = getSafeTestDatabaseConfig();
  schema = config.schema;
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `swarm006-local-${randomUUID()}`;
  process.env.BACKUP_V3_IMPORT_ENABLED = "true";
  db = await import("@workspace/db");
  await resetTestSchema(db.pool, schema);
  initialized = true;
  app = (await import("../src/app")).default;
  const created = await request(app)
    .post("/api/tournaments")
    .send({ name: `Isolated backup check ${randomUUID()}`, format: "single_elimination", organizerPassword: "local-only-password" })
    .expect(201);
  const token = created.body.organizerToken as string;
  assert.ok(token);
  await request(app)
    .post(`/api/tournaments/${created.body.id}/players`)
    .set("x-organizer-token", token)
    .send({ name: "Local test player", seed: 1 })
    .expect(201);
  const response = await request(app)
    .get(`/api/tournaments/${created.body.id}/export`)
    .set("x-organizer-token", token)
    .expect(200);
  exported = response.body as Record<string, unknown>;
  assert.ok(exported.schemaVersion === 3 || exported.version === 3);
  baseline = await snapshot();
});

after(async () => {
  if (initialized) await dropTestSchema(db.pool, schema);
  if (db) await db.pool.end();
});

for (const variant of ["wrapped", "bare", "string-version", "malformed"] as const) {
  test(`V3 ${variant} returns 422 without database changes`, async () => {
    const value = variant === "string-version"
      ? { ...exported, schemaVersion: "3" }
      : variant === "malformed" ? { schemaVersion: 3 } : exported;
    const payload = variant === "bare"
      ? value
      : { backup: value, organizerPassword: "local-only-password" };
    const response = await request(app).post("/api/tournaments/import").send(payload);
    assert.equal(response.status, 422);
    assert.equal(response.body.code, "BACKUP_V3_IMPORT_DISABLED");
    assert.deepEqual(await snapshot(), baseline);
  });
}

test("conflicting V2 and V3 version markers are rejected without database changes", async () => {
  const payload = { ...exported, schemaVersion: 2, version: 3 };
  const response = await request(app).post("/api/tournaments/import").send({
    backup: payload,
    organizerPassword: "local-only-password",
  });
  assert.equal(response.status, 422);
  assert.equal(response.body.code, "BACKUP_V3_IMPORT_DISABLED");
  assert.deepEqual(await snapshot(), baseline);
});

test("a V3 export relabelled as V2 is not restored and leaves database content unchanged", async () => {
  const payload = { ...exported, schemaVersion: 2 };
  if ("version" in payload) payload.version = 2;
  const response = await request(app).post("/api/tournaments/import").send({
    backup: payload,
    organizerPassword: "local-only-password",
  });
  assert.equal(response.status, 422, "A relabelled V3 document must be rejected");
  assert.equal(response.body.code, "BACKUP_V2_CONTAINS_V3_FIELDS");
  assert.deepEqual(await snapshot(), baseline);
});

function validV2Backup(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    exportedAt: new Date().toISOString(),
    tournament: {
      name: `V2 compatibility ${randomUUID()}`,
      description: null,
      format: "round_robin",
      status: "draft",
      maxPlayers: 4,
      currentRound: null,
      totalRounds: null,
      swissRounds: null,
      defaultBestOf: 3,
      visibility: "public_online",
      winnerBackupId: null,
      featuredMatchBackupId: null,
    },
    players: [], matches: [], resultHistory: [], actionLog: [],
  };
}

test("a V2-shaped document with V3 stages is rejected without database changes", async () => {
  const backup = { ...validV2Backup(), stages: [{ backupId: 1, name: "Synthetic stage" }] };
  const response = await request(app).post("/api/tournaments/import").send({
    backup,
    organizerPassword: "local-only-password",
  });
  assert.equal(response.status, 422);
  assert.equal(response.body.code, "BACKUP_V2_CONTAINS_V3_FIELDS");
  assert.deepEqual(await snapshot(), baseline);
});

for (const path of ["tournament", "matches", "resultHistory", "actionLog"] as const) {
  test(`a V2 document with a V3-only field at ${path} is rejected without database changes`, async () => {
    const backup = validV2Backup();
    if (path === "tournament") {
      backup.tournament = { ...(backup.tournament as Record<string, unknown>), gameConfig: null };
    } else {
      backup[path] = [{ stageBackupId: null }];
    }
    const response = await request(app).post("/api/tournaments/import").send({
      backup,
      organizerPassword: "local-only-password",
    });
    assert.equal(response.status, 422);
    assert.equal(response.body.code, "BACKUP_V2_CONTAINS_V3_FIELDS");
    assert.deepEqual(await snapshot(), baseline);
  });
}

test("V2 with unrelated metadata and arbitrary undo payload remains importable", async () => {
  const undoPayload = { stages: [{ stageBackupId: 42 }] };
  const backup = {
    ...validV2Backup(),
    metadata: { stages: ["an unrelated annotation"] },
    actionLog: [{
      actionType: "annotation", description: "Local compatibility check", matchBackupId: null,
      canUndo: false, undoPayload, isUndone: false, createdAt: new Date().toISOString(),
    }],
  };
  const response = await request(app).post("/api/tournaments/import").send({
    backup,
    organizerPassword: "local-only-password",
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.ok(response.body.tournament.id);
  const rows = await db.pool.query(`SELECT undo_payload FROM "${schema}".action_log WHERE tournament_id = $1`, [response.body.tournament.id]);
  assert.equal(rows.rowCount, 1);
  assert.deepEqual(JSON.parse(rows.rows[0].undo_payload), undoPayload);
});
