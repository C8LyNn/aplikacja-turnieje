import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  renderSeriesV1MigrationForTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

const SESSION_SECRET = `deadlock-game-config-${randomUUID()}`;
const ORGANIZER_PASSWORD = "deadlock-organizer-password";
const SUPPORT_PASSWORD = "deadlock-support-password";
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let initialized = false;
const MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0013_tournament_game_config.sql",
  import.meta.url,
);

const deadlockConfig = (forcedHeroId?: "rem" | "wraith") => ({
  gameId: "deadlock" as const,
  configVersion: 1 as const,
  config: forcedHeroId ? { forcedHeroId } : {},
});

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (initialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

async function createTournament(gameConfig?: unknown) {
  const response = await request(app)
    .post("/api/tournaments")
    .send({
      name: `Deadlock fixture ${randomUUID()}`,
      format: "single_elimination",
      maxPlayers: 8,
      defaultBestOf: 3,
      organizerPassword: ORGANIZER_PASSWORD,
      supportPassword: SUPPORT_PASSWORD,
      ...(gameConfig === undefined ? {} : { gameConfig }),
    });
  return response;
}

describe("Deadlock tournament game configuration", () => {
  test("creates tournaments with no game, Deadlock, and an optional forced hero", async () => {
    const generic = await createTournament();
    assert.equal(generic.status, 201, generic.text);
    assert.equal(generic.body.gameConfig, null);

    const withoutHero = await createTournament(deadlockConfig());
    assert.equal(withoutHero.status, 201, withoutHero.text);
    assert.deepEqual(withoutHero.body.gameConfig, deadlockConfig());

    const forced = await createTournament(deadlockConfig("rem"));
    assert.equal(forced.status, 201, forced.text);
    assert.deepEqual(forced.body.gameConfig, deadlockConfig("rem"));
    const loaded = await request(app).get(`/api/tournaments/${forced.body.id}`);
    assert.equal(loaded.status, 200, loaded.text);
    assert.deepEqual(loaded.body.gameConfig, deadlockConfig("rem"));
  });

  test("rejects unknown games, versions and heroes without inserting a tournament", async () => {
    const beforeCount = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    const invalidConfigs = [
      { gameId: "unknown", configVersion: 1, config: {} },
      { gameId: "deadlock", configVersion: 2, config: {} },
      { gameId: "deadlock", configVersion: 1, config: { forcedHeroId: "unknown" } },
      { gameId: "deadlock", configVersion: 1, config: { unexpected: "value" } },
    ];
    for (const gameConfig of invalidConfigs) {
      const response = await createTournament(gameConfig);
      assert.equal(response.status, 400, response.text);
    }
    const afterCount = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    assert.equal(afterCount.rows[0].count, beforeCount.rows[0].count);
  });

  test("allows organizer draft changes, keeps viewers/support read-only and locks after start", async () => {
    const created = await createTournament(deadlockConfig("rem"));
    assert.equal(created.status, 201, created.text);
    const tournamentId = created.body.id as number;
    const organizer = { "x-organizer-token": created.body.organizerToken as string };

    const anonymous = await request(app)
      .patch(`/api/tournaments/${tournamentId}`)
      .send({ gameConfig: deadlockConfig("wraith") });
    assert.equal(anonymous.status, 403, anonymous.text);

    const supportLogin = await request(app)
      .post(`/api/tournaments/${tournamentId}/auth/support-login`)
      .send({ password: SUPPORT_PASSWORD, nick: "Read only" });
    assert.equal(supportLogin.status, 200, supportLogin.text);
    const support = await request(app)
      .patch(`/api/tournaments/${tournamentId}`)
      .set("x-support-token", supportLogin.body.sessionToken as string)
      .send({ gameConfig: deadlockConfig("wraith") });
    assert.equal(support.status, 403, support.text);

    const updated = await request(app)
      .patch(`/api/tournaments/${tournamentId}`)
      .set(organizer)
      .send({ gameConfig: deadlockConfig("wraith") });
    assert.equal(updated.status, 200, updated.text);
    assert.deepEqual(updated.body.gameConfig, deadlockConfig("wraith"));

    const unknownField = await request(app)
      .patch(`/api/tournaments/${tournamentId}`)
      .set(organizer)
      .send({
        gameConfig: {
          ...deadlockConfig("wraith"),
          config: { forcedHeroId: "wraith", unexpected: "value" },
        },
      });
    assert.equal(unknownField.status, 400, unknownField.text);

    for (const [name, seed] of [["Alpha", 1], ["Bravo", 2]] as const) {
      const player = await request(app)
        .post(`/api/tournaments/${tournamentId}/players`)
        .set(organizer)
        .send({ name, seed });
      assert.equal(player.status, 201, player.text);
    }
    const started = await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set(organizer);
    assert.equal(started.status, 200, started.text);
    const locked = await request(app)
      .patch(`/api/tournaments/${tournamentId}`)
      .set(organizer)
      .send({ gameConfig: null });
    assert.equal(locked.status, 409, locked.text);
    assert.equal(locked.body.code, "GAME_CONFIG_IMMUTABLE");
  });

  test("Backup v3 round-trip preserves config while older v3 without it stays compatible", async () => {
    const created = await createTournament(deadlockConfig("rem"));
    assert.equal(created.status, 201, created.text);
    const exported = await request(app)
      .get(`/api/tournaments/${created.body.id}/export`)
      .set("x-organizer-token", created.body.organizerToken as string);
    assert.equal(exported.status, 200, exported.text);
    assert.deepEqual(exported.body.tournament.gameConfig, deadlockConfig("rem"));

    const restored = await request(app)
      .post("/api/tournaments/import")
      .send({ backup: exported.body, organizerPassword: ORGANIZER_PASSWORD });
    assert.equal(restored.status, 201, restored.text);
    assert.deepEqual(restored.body.tournament.gameConfig, deadlockConfig("rem"));

    const olderV3 = structuredClone(exported.body) as Record<string, unknown> & {
      tournament: Record<string, unknown>;
    };
    delete olderV3.tournament.gameConfig;
    const restoredOlder = await request(app)
      .post("/api/tournaments/import")
      .send({ backup: olderV3, organizerPassword: ORGANIZER_PASSWORD });
    assert.equal(restoredOlder.status, 201, restoredOlder.text);
    assert.equal(restoredOlder.body.tournament.gameConfig, null);
  });

  test("rejects an invalid Backup v3 game config without partially restoring it", async () => {
    const created = await createTournament(deadlockConfig("rem"));
    assert.equal(created.status, 201, created.text);
    const exported = await request(app)
      .get(`/api/tournaments/${created.body.id}/export`)
      .set("x-organizer-token", created.body.organizerToken as string);
    assert.equal(exported.status, 200, exported.text);
    const invalidBackup = structuredClone(exported.body) as {
      tournament: {
        gameConfig: {
          config: { forcedHeroId?: string };
        };
      };
    };
    Object.assign(invalidBackup.tournament.gameConfig.config, {
      forcedHeroId: "haze",
      unexpected: "value",
    });
    const beforeCount = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );

    const restored = await request(app)
      .post("/api/tournaments/import")
      .send({ backup: invalidBackup, organizerPassword: ORGANIZER_PASSWORD });
    assert.equal(restored.status, 400, restored.text);

    const afterCount = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    assert.equal(afterCount.rows[0].count, beforeCount.rows[0].count);
  });

  test("database row is deleted with its tournament", async () => {
    const created = await createTournament(deadlockConfig("rem"));
    assert.equal(created.status, 201, created.text);
    const tournamentId = created.body.id as number;
    const deleted = await request(app)
      .delete(`/api/tournaments/${tournamentId}`)
      .set("x-organizer-token", created.body.organizerToken as string);
    assert.equal(deleted.status, 204, deleted.text);
    const rows = await database.pool.query(
      "SELECT tournament_id FROM tournament_game_configs WHERE tournament_id = $1",
      [tournamentId],
    );
    assert.equal(rows.rowCount, 0);
  });

  test("migration is idempotent and preserves tournaments that have no game config", async () => {
    const generic = await createTournament();
    assert.equal(generic.status, 201, generic.text);
    const before = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    const migration = renderSeriesV1MigrationForTestSchema(
      await readFile(MIGRATION_URL, "utf8"),
      config.schema,
    );
    await database.pool.query(migration);
    await database.pool.query(migration);
    const afterCount = await database.pool.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM tournaments",
    );
    const configRows = await database.pool.query(
      "SELECT tournament_id FROM tournament_game_configs WHERE tournament_id = $1",
      [generic.body.id],
    );
    assert.equal(afterCount.rows[0].count, before.rows[0].count);
    assert.equal(configRows.rowCount, 0);
  });
});
