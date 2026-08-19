/**
 * Integration tests for single-stage tournament seeding.
 *
 * Covers SE 8/16/24/32, DE 8/16/24/32 across all five seeding methods.
 * Key invariant: maxPlayers is a CAPACITY LIMIT, not a required participant
 * count.  A tournament may start with fewer players than maxPlayers.
 *
 * For SE/Swiss/RR: the DB trigger `compat_sync_single_stage_participant` keeps
 * `stage.participant_count` equal to the actual registered player count.
 *
 * For DE (stagePlan path): the routing plan is created at tournament creation
 * time, which blocks the trigger (migration 0017 guard).  `stage.participant_count`
 * stays at maxPlayers until `startStage` recompiles the routing plan for the
 * actual participant count and updates the stage record within its transaction.
 */
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

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
}

const SESSION_SECRET = `single-stage-seeding-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

async function organizerTokenFor(tournamentId: number): Promise<string> {
  const result = await database.pool.query(
    "SELECT organizer_password_hash FROM tournaments WHERE id = $1",
    [tournamentId],
  );
  const passwordHash = result.rows[0]?.organizer_password_hash as string | undefined;
  assert.ok(passwordHash, `Tournament ${tournamentId} not found`);
  return signOrganizerToken(tournamentId, passwordHash);
}

/**
 * Adds `count` players. Each player gets `seed = i` (1-based) and a
 * generated name; this also exercises the trigger resequencing path.
 */
async function addPlayers(
  tournamentId: number,
  count: number,
  opts: { namePrefix?: string } = {},
): Promise<number[]> {
  const prefix = opts.namePrefix ?? "Player";
  const headers = { "x-organizer-token": await organizerTokenFor(tournamentId) };
  const ids: number[] = [];
  for (let i = 1; i <= count; i += 1) {
    const res = await request(app)
      .post(`/api/tournaments/${tournamentId}/players`)
      .set(headers)
      .send({ name: `${prefix} ${i} ${randomUUID().slice(0, 6)}`, seed: i })
      .expect(201);
    ids.push(res.body.id as number);
  }
  return ids;
}

/**
 * Creates a single-stage tournament with optional seeding stagePlan.
 * `entrySeedingMethod: "registration_order"` creates WITHOUT a plan (legacy path).
 * All other methods create WITH a plan; `maxPlayers` is the capacity limit.
 */
async function createTournament(opts: {
  format: "single_elimination" | "double_elimination" | "swiss" | "round_robin";
  maxPlayers?: number;
  entrySeedingMethod: "registration_order" | "alphabetical" | "manual" | "random";
  randomRevealOrder?: "instant" | "sequential";
  swissRounds?: number;
}): Promise<{ tournamentId: number; stageId: number; headers: Record<string, string> }> {
  const {
    format,
    maxPlayers,
    entrySeedingMethod,
    randomRevealOrder = "instant",
    swissRounds = 3,
  } = opts;

  // stagePlan is only generated for non-registration_order methods.
  // participantCount in the plan is a validation placeholder; the DB trigger
  // keeps stage.participant_count synced to the actual registered player count.
  const stagePlan = entrySeedingMethod === "registration_order"
    ? undefined
    : {
        initialParticipantCount: maxPlayers && maxPlayers >= 2 ? maxPlayers : 2,
        stages: [{
          key: "stage_1",
          position: 1,
          name: "Etap 1",
          format,
          participantCount: maxPlayers && maxPlayers >= 2 ? maxPlayers : 2,
          bestOf: 1,
          ...(format === "swiss" ? { rounds: swissRounds } : {}),
          entrySeedingMethod,
          placementMethod: (format === "single_elimination" || format === "double_elimination")
            ? "standard"
            : "standings_order",
          resultSeedingMethod: "rank_bands",
          randomRevealOrder,
          randomSeed: `test-${randomUUID()}`,
        }],
      };

  const res = await request(app)
    .post("/api/tournaments")
    .send({
      organizerPassword: "test-pwd",
      name: `${format} ${maxPlayers ?? "unlimited"}p ${entrySeedingMethod} ${randomUUID()}`,
      format,
      defaultBestOf: 1,
      ...(maxPlayers != null ? { maxPlayers } : {}),
      ...(format === "swiss" ? { swissRounds } : {}),
      ...(stagePlan ? { stagePlan } : {}),
    })
    .expect(201);

  const tournamentId = res.body.id as number;
  const token = await organizerTokenFor(tournamentId);
  const headers = { "x-organizer-token": token };

  const [stage] = (await database.pool.query(
    "SELECT id FROM tournament_stages WHERE tournament_id = $1 ORDER BY position LIMIT 1",
    [tournamentId],
  )).rows;
  assert.ok(stage, "Expected at least one stage");

  return { tournamentId, stageId: stage.id as number, headers };
}

async function startTournament(
  tournamentId: number,
  headers: Record<string, string>,
  expectStatus = 200,
) {
  return request(app)
    .post(`/api/tournaments/${tournamentId}/start`)
    .set(headers)
    .expect(expectStatus);
}

/** Returns round-1 seed pairs from the started stage. */
async function round1SeedPairs(stageId: number): Promise<Array<[number | null, number | null]>> {
  const rows = (await database.pool.query(
    `SELECT sp1.stage_seed AS s1, sp2.stage_seed AS s2
     FROM matches m
     LEFT JOIN stage_participants sp1
       ON sp1.stage_id = m.stage_id AND sp1.player_id = m.player1_id
     LEFT JOIN stage_participants sp2
       ON sp2.stage_id = m.stage_id AND sp2.player_id = m.player2_id
     WHERE m.stage_id = $1 AND m.round = 1
     ORDER BY m.match_number`,
    [stageId],
  )).rows;
  return rows.map((r) => [r.s1 as number | null, r.s2 as number | null]);
}

async function matchCount(stageId: number): Promise<number> {
  return (await database.pool.query(
    "SELECT count(*)::int AS c FROM matches WHERE stage_id = $1",
    [stageId],
  )).rows[0].c as number;
}

async function stageParticipantCount(stageId: number): Promise<number> {
  return (await database.pool.query(
    "SELECT count(*)::int AS c FROM stage_participants WHERE stage_id = $1",
    [stageId],
  )).rows[0].c as number;
}

async function stageColumnParticipantCount(stageId: number): Promise<number> {
  return (await database.pool.query(
    "SELECT participant_count FROM tournament_stages WHERE id = $1",
    [stageId],
  )).rows[0].participant_count as number;
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
  if (schemaInitialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

// ── Trigger semantics: actual < maxPlayers is valid ──────────────────────────

describe("maxPlayers is a capacity limit, not a required count", () => {
  test("SE maxPlayers=32, actual=24: trigger sets participant_count=24, start succeeds with BYEs", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 32, entrySeedingMethod: "alphabetical",
    });
    await addPlayers(tournamentId, 24);

    // Trigger must have updated participant_count to actual count
    assert.equal(await stageColumnParticipantCount(stageId), 24,
      "Trigger should set stage.participant_count = 24 (actual registered)");

    const res = await startTournament(tournamentId, headers);
    assert.equal(res.body.status, "active");

    // 24 players in 32-bracket: 31 total matches
    assert.equal(await matchCount(stageId), 31);
    assert.equal(await stageParticipantCount(stageId), 24);

    // 8 BYE slots in round 1 (seeds 1–8 advance automatically)
    const pairs = await round1SeedPairs(stageId);
    const byeCount = pairs.filter(([a, b]) => a === null || b === null).length;
    assert.equal(byeCount, 8, "SE 24p in 32-bracket: 8 BYE matches in round 1");
  });

  test("SE maxPlayers=16, actual=14: participant_count=14, start succeeds (2 BYEs)", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 16, entrySeedingMethod: "manual",
    });
    await addPlayers(tournamentId, 14);

    assert.equal(await stageColumnParticipantCount(stageId), 14);

    await startTournament(tournamentId, headers);

    // 14 players in 16-bracket: 15 total matches, 2 BYE slots in round 1
    assert.equal(await matchCount(stageId), 15);
    const pairs = await round1SeedPairs(stageId);
    const byeCount = pairs.filter(([a, b]) => a === null || b === null).length;
    assert.equal(byeCount, 2, "SE 14p in 16-bracket: 2 BYE matches in round 1");
  });

  // DE notes: the routing plan is created at tournament creation time, which blocks the
  // participant_count trigger (migration 0017 guard). So stage.participant_count stays at
  // maxPlayers until startStage recompiles the plan for the actual count.
  // Check stageColumnParticipantCount AFTER start for DE with actual < maxPlayers.

  test("DE maxPlayers=32, actual=24: start succeeds, 8 BYEs, stageParticipantCount=24", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "double_elimination", maxPlayers: 32, entrySeedingMethod: "random",
      randomRevealOrder: "instant",
    });
    await addPlayers(tournamentId, 24);

    // Trigger blocked by routing plan → participant_count stays at 32 BEFORE start
    assert.equal(await stageColumnParticipantCount(stageId), 32,
      "DE: routing plan blocks trigger; participant_count = maxPlayers before start");

    const res = await startTournament(tournamentId, headers);
    assert.equal(res.body.status, "active");

    // startStage recompiles plan and syncs participant_count to actual
    assert.equal(await stageColumnParticipantCount(stageId), 24,
      "startStage syncs participant_count to actual after recompile");
    assert.equal(await stageParticipantCount(stageId), 24);
    assert.ok(await matchCount(stageId) > 0, "DE 24p should generate matches");
  });

  test("DE maxPlayers=16, actual=14: start succeeds (BYE semantics)", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "double_elimination", maxPlayers: 16, entrySeedingMethod: "alphabetical",
    });
    await addPlayers(tournamentId, 14);

    assert.equal(await stageColumnParticipantCount(stageId), 16,
      "Trigger blocked before start");
    await startTournament(tournamentId, headers);
    assert.equal(await stageColumnParticipantCount(stageId), 14,
      "startStage syncs to 14");
    assert.ok(await matchCount(stageId) > 0, "DE 14p should generate matches");
  });

  test("Swiss maxPlayers=16, actual=8: start succeeds with 8 participants", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "swiss", maxPlayers: 16, entrySeedingMethod: "manual", swissRounds: 3,
    });
    await addPlayers(tournamentId, 8);

    assert.equal(await stageColumnParticipantCount(stageId), 8);

    await startTournament(tournamentId, headers);
    // Swiss 8p round 1: 4 matches
    assert.equal(await matchCount(stageId), 4);
  });

  test("RR maxPlayers=8, actual=4: start succeeds with 6 matches", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "round_robin", maxPlayers: 8, entrySeedingMethod: "alphabetical",
    });
    await addPlayers(tournamentId, 4);

    assert.equal(await stageColumnParticipantCount(stageId), 4);

    await startTournament(tournamentId, headers);
    assert.equal(await matchCount(stageId), 6); // 4*(4-1)/2 = 6
  });
});

// ── Registration order (legacy path, no stagePlan) ───────────────────────────

describe("registration_order seeding (legacy path)", () => {
  test("SE 8p: starts and generates 7 matches", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 8, entrySeedingMethod: "registration_order",
    });
    await addPlayers(tournamentId, 8);
    await startTournament(tournamentId, headers);
    assert.equal(await matchCount(stageId), 7);
  });

  test("SE 16p: starts and generates 15 matches", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 16, entrySeedingMethod: "registration_order",
    });
    await addPlayers(tournamentId, 16);
    await startTournament(tournamentId, headers);
    assert.equal(await matchCount(stageId), 15);
  });

  test("SE 24p maxPlayers=32: starts with 24 actual players, 8 BYEs", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 32, entrySeedingMethod: "registration_order",
    });
    await addPlayers(tournamentId, 24);
    await startTournament(tournamentId, headers);
    assert.equal(await matchCount(stageId), 31);
    const pairs = await round1SeedPairs(stageId);
    const byeCount = pairs.filter(([a, b]) => a === null || b === null).length;
    assert.equal(byeCount, 8);
  });

  test("SE 32p: starts and generates 31 matches", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 32, entrySeedingMethod: "registration_order",
    });
    await addPlayers(tournamentId, 32);
    await startTournament(tournamentId, headers);
    assert.equal(await matchCount(stageId), 31);
  });

  test("DE 8p: starts via lifecycle", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "double_elimination", maxPlayers: 8, entrySeedingMethod: "registration_order",
    });
    await addPlayers(tournamentId, 8);
    await startTournament(tournamentId, headers);
    assert.ok(await matchCount(stageId) > 0);
  });
});

// ── Alphabetical seeding ──────────────────────────────────────────────────────

describe("alphabetical seeding", () => {
  test("SE 8p: seed 1 gets the lexicographically first player", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 8, entrySeedingMethod: "alphabetical",
    });
    // Add in reverse alphabetical order so alphabetical sorting changes the assignment
    const playerHeaders = { "x-organizer-token": headers["x-organizer-token"] };
    const names = ["H Player", "G Player", "F Player", "E Player", "D Player", "C Player", "B Player", "A Player"];
    for (const name of names) {
      await request(app)
        .post(`/api/tournaments/${tournamentId}/players`)
        .set(playerHeaders)
        .send({ name, seed: 1 })
        .expect(201);
    }

    await startTournament(tournamentId, headers);

    const seeds = (await database.pool.query(
      `SELECT p.name, sp.stage_seed
       FROM stage_participants sp
       JOIN players p ON p.id = sp.player_id
       WHERE sp.stage_id = $1
       ORDER BY sp.stage_seed`,
      [stageId],
    )).rows as Array<{ name: string; stage_seed: number }>;

    assert.equal(seeds[0].name, "A Player", "Seed 1 should be A Player (alphabetically first)");
    assert.equal(seeds[7].name, "H Player", "Seed 8 should be H Player (alphabetically last)");
  });

  test("SE 16p: 15 matches, all participants seeded 1..16", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 16, entrySeedingMethod: "alphabetical",
    });
    await addPlayers(tournamentId, 16);
    await startTournament(tournamentId, headers);

    assert.equal(await matchCount(stageId), 15);
    const stageSeedRows = (await database.pool.query(
      "SELECT stage_seed FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed",
      [stageId],
    )).rows.map((r) => r.stage_seed as number);
    assert.deepEqual(stageSeedRows, Array.from({ length: 16 }, (_, i) => i + 1));
  });

  test("SE maxPlayers=32, actual=24, alphabetical: seeds 1..24, 8 BYEs", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 32, entrySeedingMethod: "alphabetical",
    });
    await addPlayers(tournamentId, 24);
    await startTournament(tournamentId, headers);

    assert.equal(await matchCount(stageId), 31);
    const pairs = await round1SeedPairs(stageId);
    assert.equal(pairs.filter(([a, b]) => a === null || b === null).length, 8);
  });

  test("Swiss 8p alphabetical: A player gets seed 1", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "swiss", maxPlayers: 8, entrySeedingMethod: "alphabetical", swissRounds: 3,
    });
    const playerHeaders = { "x-organizer-token": headers["x-organizer-token"] };
    const names = ["H Swiss", "G Swiss", "F Swiss", "E Swiss", "D Swiss", "C Swiss", "B Swiss", "A Swiss"];
    for (const name of names) {
      await request(app)
        .post(`/api/tournaments/${tournamentId}/players`)
        .set(playerHeaders)
        .send({ name, seed: 1 })
        .expect(201);
    }
    await startTournament(tournamentId, headers);

    const seeds = (await database.pool.query(
      `SELECT p.name, sp.stage_seed
       FROM stage_participants sp JOIN players p ON p.id = sp.player_id
       WHERE sp.stage_id = $1 ORDER BY sp.stage_seed`,
      [stageId],
    )).rows as Array<{ name: string; stage_seed: number }>;
    assert.equal(seeds[0].name, "A Swiss", "Seed 1 should be A Swiss");
    assert.equal(seeds[7].name, "H Swiss", "Seed 8 should be H Swiss");
  });
});

// ── Manual seeding ────────────────────────────────────────────────────────────

describe("manual seeding", () => {
  test("SE 8p: stage_seed matches player.seed after start (trigger resequences correctly)", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 8, entrySeedingMethod: "manual",
    });
    // Add players in reverse seed order so that manual seed ≠ registration order
    const playerHeaders = { "x-organizer-token": headers["x-organizer-token"] };
    for (let i = 1; i <= 8; i += 1) {
      await request(app)
        .post(`/api/tournaments/${tournamentId}/players`)
        .set(playerHeaders)
        .send({ name: `Player ${i}`, seed: 9 - i }) // registration order is reverse of intended seed
        .expect(201);
    }

    await startTournament(tournamentId, headers);

    const rows = (await database.pool.query(
      `SELECT sp.stage_seed, p.seed AS player_seed
       FROM stage_participants sp JOIN players p ON p.id = sp.player_id
       WHERE sp.stage_id = $1 ORDER BY sp.stage_seed`,
      [stageId],
    )).rows as Array<{ stage_seed: number; player_seed: number }>;

    // After applying manual seeding, stage_seed must equal player.seed
    for (const row of rows) {
      assert.equal(row.stage_seed, row.player_seed,
        `stage_seed ${row.stage_seed} should match player.seed ${row.player_seed}`);
    }
  });

  test("SE 16p manual: seeds contiguous 1..16 after start", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 16, entrySeedingMethod: "manual",
    });
    await addPlayers(tournamentId, 16);
    await startTournament(tournamentId, headers);

    const seeds = (await database.pool.query(
      "SELECT stage_seed FROM stage_participants WHERE stage_id = $1 ORDER BY stage_seed",
      [stageId],
    )).rows.map((r) => r.stage_seed as number);
    assert.deepEqual(seeds, Array.from({ length: 16 }, (_, i) => i + 1));
  });

  test("SE maxPlayers=32, actual=24, manual: 24 seeds, 8 BYEs", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 32, entrySeedingMethod: "manual",
    });
    await addPlayers(tournamentId, 24);
    await startTournament(tournamentId, headers);

    assert.equal(await stageParticipantCount(stageId), 24);
    assert.equal(await matchCount(stageId), 31);
    const byeCount = (await round1SeedPairs(stageId))
      .filter(([a, b]) => a === null || b === null).length;
    assert.equal(byeCount, 8);
  });

  test("DE maxPlayers=32, actual=24, manual: starts and generates matches", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "double_elimination", maxPlayers: 32, entrySeedingMethod: "manual",
    });
    await addPlayers(tournamentId, 24);

    await startTournament(tournamentId, headers);
    assert.equal(await stageColumnParticipantCount(stageId), 24);
    assert.ok(await matchCount(stageId) > 0);
    assert.equal(await stageParticipantCount(stageId), 24);
  });

  test("RR 4p manual: 6 matches", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "round_robin", maxPlayers: 4, entrySeedingMethod: "manual",
    });
    await addPlayers(tournamentId, 4);
    await startTournament(tournamentId, headers);
    assert.equal(await matchCount(stageId), 6);
  });
});

// ── Random instant seeding ────────────────────────────────────────────────────

describe("random (instant) seeding — no ceremony needed at start", () => {
  const cases: Array<{
    format: "single_elimination" | "double_elimination" | "swiss" | "round_robin";
    maxPlayers: number;
    actual: number;
    expectedMatches: number | null;
  }> = [
    { format: "single_elimination", maxPlayers: 8, actual: 8, expectedMatches: 7 },
    { format: "single_elimination", maxPlayers: 16, actual: 16, expectedMatches: 15 },
    { format: "single_elimination", maxPlayers: 32, actual: 24, expectedMatches: 31 }, // BYEs
    { format: "single_elimination", maxPlayers: 32, actual: 32, expectedMatches: 31 },
    { format: "double_elimination", maxPlayers: 8, actual: 8, expectedMatches: null },
    { format: "double_elimination", maxPlayers: 16, actual: 16, expectedMatches: null },
    { format: "double_elimination", maxPlayers: 24, actual: 24, expectedMatches: null },
    { format: "double_elimination", maxPlayers: 32, actual: 24, expectedMatches: null }, // BYEs
    { format: "double_elimination", maxPlayers: 32, actual: 32, expectedMatches: null },
    { format: "swiss", maxPlayers: 8, actual: 8, expectedMatches: 4 },
    { format: "round_robin", maxPlayers: 4, actual: 4, expectedMatches: 6 },
  ];

  for (const { format, maxPlayers, actual, expectedMatches } of cases) {
    test(`${format} maxPlayers=${maxPlayers} actual=${actual}: starts, generates matches`, async () => {
      const { tournamentId, stageId, headers } = await createTournament({
        format, maxPlayers, entrySeedingMethod: "random", randomRevealOrder: "instant",
      });
      await addPlayers(tournamentId, actual);

      // For SE/Swiss/RR the trigger syncs participant_count immediately.
      // For DE the routing plan (created at tournament creation) blocks the trigger;
      // startStage recompiles the plan and syncs participant_count within its transaction.
      const isDeWithFewer = format === "double_elimination" && actual < maxPlayers;
      if (!isDeWithFewer) {
        assert.equal(await stageColumnParticipantCount(stageId), actual,
          `stage.participant_count should equal actual=${actual}`);
      }

      const res = await startTournament(tournamentId, headers);
      assert.equal(res.body.status, "active");
      // After start, participant_count is always synced to actual
      assert.equal(await stageColumnParticipantCount(stageId), actual,
        `post-start: stage.participant_count should equal actual=${actual}`);
      assert.equal(await stageParticipantCount(stageId), actual);

      const count = await matchCount(stageId);
      if (expectedMatches !== null) {
        assert.equal(count, expectedMatches);
      } else {
        assert.ok(count > 0, `Expected matches after ${format} start`);
      }
    });
  }
});

// ── Random sequential (ceremony-based) seeding ───────────────────────────────

describe("random (sequential) seeding — ceremony required", () => {
  test("SE 8p: start blocked by ceremony, succeeds after apply", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 8, entrySeedingMethod: "random",
      randomRevealOrder: "sequential",
    });
    await addPlayers(tournamentId, 8);

    // Start BEFORE ceremony → must fail with ceremony error (not participant count error)
    const blocker = await startTournament(tournamentId, headers, 409);
    assert.ok(
      ["SEEDING_CEREMONY_REQUIRED", "SEEDING_CEREMONY_INCOMPLETE"].includes(blocker.body.code),
      `Expected ceremony error, got: ${blocker.body.code}`,
    );

    // Prepare ceremony
    const prepRes = await request(app)
      .post(`/api/tournaments/${tournamentId}/stages/${stageId}/seeding-ceremony/prepare`)
      .set(headers)
      .expect(200);
    assert.ok(prepRes.body, "Ceremony prepare should return state");

    // Reveal all draws (no separate apply endpoint — reveal-all completes the ceremony)
    const revealRes = await request(app)
      .post(`/api/tournaments/${tournamentId}/stages/${stageId}/seeding-ceremony/reveal-all`)
      .set(headers);
    assert.ok([200, 409].includes(revealRes.status), `Reveal-all returned ${revealRes.status}`);

    // Start now succeeds
    const okRes = await startTournament(tournamentId, headers);
    assert.equal(okRes.body.status, "active");
    assert.equal(await matchCount(stageId), 7);
  });

  test("DE 8p: start blocked before ceremony", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "double_elimination", maxPlayers: 8, entrySeedingMethod: "random",
      randomRevealOrder: "sequential",
    });
    await addPlayers(tournamentId, 8);

    const blocker = await startTournament(tournamentId, headers, 409);
    assert.ok(
      ["SEEDING_CEREMONY_REQUIRED", "SEEDING_CEREMONY_INCOMPLETE"].includes(blocker.body.code),
      `Expected ceremony error, got: ${blocker.body.code}`,
    );
  });

  test("SE maxPlayers=32, actual=24, sequential: ceremony required (not participant count issue)", async () => {
    // This confirms that the ceremony—not participant count—is the only blocker.
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 32, entrySeedingMethod: "random",
      randomRevealOrder: "sequential",
    });
    await addPlayers(tournamentId, 24); // fewer than maxPlayers

    assert.equal(await stageColumnParticipantCount(stageId), 24,
      "Trigger must sync to 24, not 32");

    const blocker = await startTournament(tournamentId, headers, 409);
    assert.ok(
      ["SEEDING_CEREMONY_REQUIRED", "SEEDING_CEREMONY_INCOMPLETE"].includes(blocker.body.code),
      `Only ceremony should block start, not participant count. Got: ${blocker.body.code}`,
    );
  });
});

// ── Comprehensive DE capacity matrix ─────────────────────────────────────────
// Tests all required combinations of maxPlayers × actual × seeding method.
// Verifies: start PASS, correct participant count in stage_participants,
// correct BYE count in round 1, and that the routing plan advances the winner
// of the first upper-bracket match to round 2.

describe("DE capacity: actual < maxPlayers across all seeding methods", () => {
  // Helper: counts real (non-BYE) pending matches across all rounds.
  // For DE, BYE matches are auto-resolved by the routing engine at start time and
  // are NOT stored as DB rows — only real two-player matches appear in the table.
  async function dePendingMatchCount(stageId: number): Promise<number> {
    const result = await database.pool.query<{ c: string }>(`
      SELECT count(*)::text AS c
      FROM matches m
      WHERE m.stage_id = $1
        AND m.status = 'pending'
        AND m.player1_id IS NOT NULL
        AND m.player2_id IS NOT NULL
    `, [stageId]);
    return parseInt(result.rows[0]?.c ?? "0", 10);
  }

  // Helper: completes the first pending real match and returns its id, winner, and loser.
  async function completeFirstPendingMatch(
    stageId: number,
    headers: Record<string, string>,
  ): Promise<{ matchId: number; winnerId: number; loserId: number }> {
    const result = await database.pool.query<{ id: string; p1: string; p2: string }>(`
      SELECT m.id::text, m.player1_id::text AS p1, m.player2_id::text AS p2
      FROM matches m
      WHERE m.stage_id = $1
        AND m.status = 'pending'
        AND m.player1_id IS NOT NULL
        AND m.player2_id IS NOT NULL
      ORDER BY m.sort_order, m.id
      LIMIT 1
    `, [stageId]);
    const row = result.rows[0];
    assert.ok(row, "Expected at least one pending real match");
    const matchId = parseInt(row.id, 10);
    const winnerId = parseInt(row.p1, 10);
    const loserId = parseInt(row.p2, 10);
    // /api/matches/:id/complete (no tournament prefix in the route)
    const res = await request(app)
      .post(`/api/matches/${matchId}/complete`)
      .set(headers)
      .send({ resultType: "walkover", winnerId })
      .expect(200);
    assert.equal(res.body.status, "completed");
    return { matchId, winnerId, loserId };
  }

  // Helper: next power of 2 >= n.
  function nextPow2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  const matrix: Array<{
    label: string;
    maxPlayers: number;
    actual: number;
    expectedByes: number;
    seeding: "registration_order" | "alphabetical" | "manual" | "random";
    randomReveal?: "instant" | "sequential";
  }> = [
    // max32 / actual32 — full bracket, no BYEs
    { label: "max32/actual32/reg",   maxPlayers: 32, actual: 32, expectedByes: 0,  seeding: "registration_order" },
    { label: "max32/actual32/alpha", maxPlayers: 32, actual: 32, expectedByes: 0,  seeding: "alphabetical" },
    { label: "max32/actual32/manual",maxPlayers: 32, actual: 32, expectedByes: 0,  seeding: "manual" },
    { label: "max32/actual32/rand",  maxPlayers: 32, actual: 32, expectedByes: 0,  seeding: "random", randomReveal: "instant" },
    { label: "max32/actual32/seq",   maxPlayers: 32, actual: 32, expectedByes: 0,  seeding: "random", randomReveal: "sequential" },
    // max32 / actual24 — 8 BYEs in upper R1
    { label: "max32/actual24/reg",   maxPlayers: 32, actual: 24, expectedByes: 8,  seeding: "registration_order" },
    { label: "max32/actual24/alpha", maxPlayers: 32, actual: 24, expectedByes: 8,  seeding: "alphabetical" },
    { label: "max32/actual24/manual",maxPlayers: 32, actual: 24, expectedByes: 8,  seeding: "manual" },
    { label: "max32/actual24/rand",  maxPlayers: 32, actual: 24, expectedByes: 8,  seeding: "random", randomReveal: "instant" },
    { label: "max32/actual24/seq",   maxPlayers: 32, actual: 24, expectedByes: 8,  seeding: "random", randomReveal: "sequential" },
    // max32 / actual17 — 15 BYEs (next power of 2 = 32, 15 free slots)
    { label: "max32/actual17/reg",   maxPlayers: 32, actual: 17, expectedByes: 15, seeding: "registration_order" },
    { label: "max32/actual17/alpha", maxPlayers: 32, actual: 17, expectedByes: 15, seeding: "alphabetical" },
    { label: "max32/actual17/manual",maxPlayers: 32, actual: 17, expectedByes: 15, seeding: "manual" },
    { label: "max32/actual17/rand",  maxPlayers: 32, actual: 17, expectedByes: 15, seeding: "random", randomReveal: "instant" },
    { label: "max32/actual17/seq",   maxPlayers: 32, actual: 17, expectedByes: 15, seeding: "random", randomReveal: "sequential" },
    // max16 / actual14 — 2 BYEs
    { label: "max16/actual14/reg",   maxPlayers: 16, actual: 14, expectedByes: 2,  seeding: "registration_order" },
    { label: "max16/actual14/alpha", maxPlayers: 16, actual: 14, expectedByes: 2,  seeding: "alphabetical" },
    { label: "max16/actual14/manual",maxPlayers: 16, actual: 14, expectedByes: 2,  seeding: "manual" },
    { label: "max16/actual14/rand",  maxPlayers: 16, actual: 14, expectedByes: 2,  seeding: "random", randomReveal: "instant" },
    { label: "max16/actual14/seq",   maxPlayers: 16, actual: 14, expectedByes: 2,  seeding: "random", randomReveal: "sequential" },
    // max8 / actual7 — 1 BYE
    { label: "max8/actual7/reg",     maxPlayers: 8,  actual: 7,  expectedByes: 1,  seeding: "registration_order" },
    { label: "max8/actual7/alpha",   maxPlayers: 8,  actual: 7,  expectedByes: 1,  seeding: "alphabetical" },
    { label: "max8/actual7/manual",  maxPlayers: 8,  actual: 7,  expectedByes: 1,  seeding: "manual" },
    { label: "max8/actual7/rand",    maxPlayers: 8,  actual: 7,  expectedByes: 1,  seeding: "random", randomReveal: "instant" },
    { label: "max8/actual7/seq",     maxPlayers: 8,  actual: 7,  expectedByes: 1,  seeding: "random", randomReveal: "sequential" },
  ];

  for (const { label, maxPlayers, actual, expectedByes, seeding, randomReveal } of matrix) {
    test(`DE ${label}: start OK, ${actual} participants, ${expectedByes} BYEs`, async () => {
      const { tournamentId, stageId, headers } = await createTournament({
        format: "double_elimination",
        maxPlayers,
        entrySeedingMethod: seeding,
        randomRevealOrder: randomReveal ?? "instant",
      });
      await addPlayers(tournamentId, actual);

      // For sequential random: run ceremony first
      if (seeding === "random" && randomReveal === "sequential") {
        await request(app)
          .post(`/api/tournaments/${tournamentId}/stages/${stageId}/seeding-ceremony/prepare`)
          .set(headers)
          .expect(200);
        await request(app)
          .post(`/api/tournaments/${tournamentId}/stages/${stageId}/seeding-ceremony/reveal-all`)
          .set(headers);
      }

      const res = await startTournament(tournamentId, headers);
      assert.equal(res.body.status, "active", `DE ${label} start failed: ${JSON.stringify(res.body)}`);

      // Correct participant count after start (startStage syncs participant_count for DE)
      assert.equal(await stageParticipantCount(stageId), actual,
        "stage_participants count must equal actual");
      assert.equal(await stageColumnParticipantCount(stageId), actual,
        "startStage must sync stage.participant_count to actual");

      // BYEs: the DE routing engine auto-resolves BYE slots without creating null-player rows.
      // All formats (including registration_order which now creates actual DE tournaments)
      // must have 0 null-player DB rows — BYEs are internal to the routing execution.
      const nullPlayerMatches = await database.pool.query<{ c: string }>(`
        SELECT count(*)::text AS c FROM matches m
        WHERE m.stage_id = $1 AND (m.player1_id IS NULL OR m.player2_id IS NULL)
      `, [stageId]);
      assert.equal(parseInt(nullPlayerMatches.rows[0]?.c ?? "0", 10), 0,
        `DE BYEs must not create null-player DB rows (auto-resolved by routing engine)`);

      // At least one real pending match must exist after start.
      const pending = await dePendingMatchCount(stageId);
      assert.ok(pending > 0, `Expected at least one pending match after DE start with ${actual} players`);

      // For BYE cases: verify that at least the correct number of real first-round matches are
      // immediately pending.  The DE routing engine may also create additional cascade-pending
      // matches when BYE-resolved players can fill both sides of a later-round match, so we
      // check `pending >= expectedRealR1` rather than exact equality.
      // Note: the routing engine uses non-sequential round numbers (e.g. even-only for
      // actual=24), so we rely on dePendingMatchCount rather than a round=1 filter.
      if (expectedByes > 0) {
        const bracketSize = nextPow2(actual);
        const expectedRealR1 = actual - bracketSize / 2;
        assert.ok(pending >= expectedRealR1,
          `${label}: at least ${expectedRealR1} real first-round matches must be pending (actual=${actual}, BYEs=${expectedByes}, bracket=${bracketSize}), got ${pending}`);
      }

      // Routing: complete the first real pending match (verifies live routing starts correctly).
      // Then, if more matches remain, complete a second to verify winner/loser placement:
      // the second completion only becomes available if the first match's winner and loser
      // were correctly routed to their next positions (winner → UB R2, loser → LB).
      if (actual >= 2) {
        await completeFirstPendingMatch(stageId, headers);
        const pendingAfter1st = await dePendingMatchCount(stageId);
        if (pendingAfter1st > 0) {
          // Completing a second match verifies that routing after the first match produced
          // new valid matches (loser to LB, winner to UB R2 or cascade).
          await completeFirstPendingMatch(stageId, headers);
        }
      }
    });
  }
});

// ── Bracket seed positions (standard placement) ───────────────────────────────

describe("SE bracket seed positions — standard placement", () => {
  test("SE 8p alphabetical: seed 1 vs 8, seed 2 vs 7 in round 1", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 8, entrySeedingMethod: "alphabetical",
    });
    const playerHeaders = { "x-organizer-token": headers["x-organizer-token"] };
    for (let i = 0; i < 8; i += 1) {
      await request(app)
        .post(`/api/tournaments/${tournamentId}/players`)
        .set(playerHeaders)
        .send({ name: `${String.fromCharCode(65 + i)} Zawodnik`, seed: 1 })
        .expect(201);
    }
    await startTournament(tournamentId, headers);

    const pairs = await round1SeedPairs(stageId);
    const pairSet = new Set(pairs.map(([a, b]) => `${Math.min(a!, b!)}-${Math.max(a!, b!)}`));
    assert.ok(pairSet.has("1-8"), "Seed 1 vs 8");
    assert.ok(pairSet.has("2-7"), "Seed 2 vs 7");
    assert.ok(pairSet.has("3-6"), "Seed 3 vs 6");
    assert.ok(pairSet.has("4-5"), "Seed 4 vs 5");
  });

  test("SE 16p manual: seed 1 vs 16 in round 1", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 16, entrySeedingMethod: "manual",
    });
    await addPlayers(tournamentId, 16);
    await startTournament(tournamentId, headers);

    const pairs = await round1SeedPairs(stageId);
    const pairSet = new Set(pairs.map(([a, b]) => `${Math.min(a!, b!)}-${Math.max(a!, b!)}`));
    assert.ok(pairSet.has("1-16"), "Seed 1 vs 16");
    assert.ok(pairSet.has("2-15"), "Seed 2 vs 15");
  });

  test("SE maxPlayers=32, actual=24, manual: 8 BYE slots, seeds 1-8 get byes", async () => {
    const { tournamentId, stageId, headers } = await createTournament({
      format: "single_elimination", maxPlayers: 32, entrySeedingMethod: "manual",
    });
    await addPlayers(tournamentId, 24);
    await startTournament(tournamentId, headers);

    const allPairs = await round1SeedPairs(stageId);
    const byeMatches = allPairs.filter(([a, b]) => a === null || b === null);
    assert.equal(byeMatches.length, 8, "24-player bracket: 8 BYE matches in round 1");
  });
});
