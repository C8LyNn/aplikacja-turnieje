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
  assert.equal(response.status, 400, "A relabelled V3 document must be rejected");
  assert.deepEqual(await snapshot(), baseline);
});
