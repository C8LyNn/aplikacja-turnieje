/**
 * Integration tests — Phase 2: Qualification Proposals
 *
 * Covers:
 *   • GET proposal 404 when none exists
 *   • GET output empty before approval
 *   • Generate proposal for Swiss stage (happy path)
 *   • Generate proposal for Single Elimination stage (happy path)
 *   • Unsupported format (double_elimination) → FORMAT_NOT_SUPPORTED
 *   • Legacy basket config (no baskets) → CONFIGURATION_NOT_EXPLICIT
 *   • Tie-break detection at basket boundary → TIE_BREAK_REQUIRED
 *   • Refresh (re-generate) increments revision
 *   • Approve → status=approved, output materialised
 *   • Approve idempotent (second call returns same data)
 *   • Approve stale when match result changes after generate
 *   • Generate blocked when proposal already approved
 *   • Approve without proposal → PROPOSAL_NOT_FOUND
 *   • GET output shows correct basket assignment after approval
 *   • GET proposal reflects approved status after approval
 *   • Anonymous/viewer cannot approve (returns 403)
 *
 * Schema: tm_test_baskets_phase2
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import { eq } from "drizzle-orm";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

// ─── Database module types ────────────────────────────────────────────────────

interface DbModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
  playersTable: typeof import("@workspace/db").playersTable;
  stageParticipantsTable: typeof import("@workspace/db").stageParticipantsTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
  stageBasketsTable: typeof import("@workspace/db").stageBasketsTable;
}

// ─── Globals ─────────────────────────────────────────────────────────────────

const SESSION_SECRET = `qp-phase2-${randomUUID()}`;
const ORGANIZER_PASSWORD_HASH = "test-organizer-hash";
let app: Express;
let database: DbModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as unknown as DbModule;
  await resetTestSchema(
    database.pool as unknown as TestPool,
    testConfig.schema,
  );
  schemaInitialized = true;
  const auth = await import("../src/auth");
  signOrganizerToken = auth.signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!schemaInitialized) return;
  await dropTestSchema(
    database.pool as unknown as TestPool,
    testConfig.schema,
  );
  await database.pool.end();
});

// ─── Fixture helpers ─────────────────────────────────────────────────────────

interface Fixture {
  tournamentId: number;
  stageId: number;
  playerIds: number[];
  matchIds: number[];
  outputBasketId: string;
  organizerHeaders: Record<string, string>;
}

/**
 * Creates a Swiss 4-player stage with:
 *   round 1: p1 beats p2 (2-0), p3 beats p4 (2-1)
 *   one output basket with the given qualifierCount
 *
 * Setting `includeBaskets: false` omits baskets, simulating a legacy config.
 */
async function buildSwissFixture(opts: {
  qualifierCount?: number;
  includeBaskets?: boolean;
  matchScore1?: number;
  matchScore2?: number;
}): Promise<Fixture> {
  const qualifierCount = opts.qualifierCount ?? 2;
  const includeBaskets = opts.includeBaskets ?? true;
  const matchScore1 = opts.matchScore1 ?? 2;
  const matchScore2 = opts.matchScore2 ?? 0;
  const suffix = randomUUID().slice(0, 8);

  // Step 1: insert tournament — trigger auto-creates a stage at position=1
  // with the correct format, rankingPolicy (swiss_v1), plannedRounds, and
  // status="active" (because tournament status != "draft").
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `QP-Swiss-${suffix}`,
      format: "swiss",
      status: "active",
      visibility: "public_online",
      organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
      defaultBestOf: 3,
      currentRound: 1,
      totalRounds: 2,
      swissRounds: 2, // trigger → stage.planned_rounds = 2
    })
    .returning();

  // Step 2: read the auto-created stage so we have its id for matches/baskets.
  // At this point qualification_mode is still "none" and participant_count is 0.
  const [stageRef] = await database.db
    .select()
    .from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));
  const stageId = stageRef.id;

  // Step 3: insert players.
  // The `players_sync_single_stage_participant` trigger fires on every INSERT
  // and automatically creates a stage_participants row.  After all 4 inserts,
  // participant_count on the stage is 4.  Do NOT manually insert participants.
  const players = await database.db
    .insert(database.playersTable)
    .values([
      { tournamentId: tournament.id, name: `Alice-${suffix}`, seed: 1 },
      { tournamentId: tournament.id, name: `Bob-${suffix}`, seed: 2 },
      { tournamentId: tournament.id, name: `Carol-${suffix}`, seed: 3 },
      { tournamentId: tournament.id, name: `Dave-${suffix}`, seed: 4 },
    ])
    .returning();
  const [p1, p2, p3, p4] = players.map((p) => p.id);

  // Step 4: now that participant_count=4, we can safely set qualificationMode
  // and advancingCount — the CHECK (advancingCount <= participantCount) passes.
  await database.db
    .update(database.tournamentStagesTable)
    .set({ qualificationMode: "top_n", advancingCount: qualifierCount })
    .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));

  // Step 5: insert completed matches.
  const matches = await database.db
    .insert(database.matchesTable)
    .values([
      {
        tournamentId: tournament.id,
        stageId,
        round: 1,
        matchNumber: 1,
        player1Id: p1,
        player2Id: p2,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: p1,
        score1: matchScore1,
        score2: matchScore2,
        completedAt: new Date(),
      },
      {
        tournamentId: tournament.id,
        stageId,
        round: 1,
        matchNumber: 2,
        player1Id: p3,
        player2Id: p4,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: p3,
        // Use the same scores as match 1 so callers that need identical
        // results (e.g. tie-break tests) get a symmetric fixture.
        score1: matchScore1,
        score2: matchScore2,
        completedAt: new Date(),
      },
    ])
    .returning();

  const outputBasketId = `out-${stageId}-${suffix}`;
  if (includeBaskets) {
    await database.db.insert(database.stageBasketsTable).values([
      {
        tournamentId: tournament.id,
        stageId,
        id: `in-${stageId}-${suffix}`,
        basketType: "input",
        ordinal: 1,
        displayOrder: 1,
        qualifierCount: null,
      },
      {
        tournamentId: tournament.id,
        stageId,
        id: outputBasketId,
        basketType: "output",
        ordinal: 1,
        displayOrder: 1,
        qualifierCount,
      },
    ]);
  }

  return {
    tournamentId: tournament.id,
    stageId,
    playerIds: [p1, p2, p3, p4],
    matchIds: matches.map((m) => m.id),
    outputBasketId,
    organizerHeaders: {
      "x-organizer-token": signOrganizerToken(
        tournament.id,
        ORGANIZER_PASSWORD_HASH,
      ),
    },
  };
}

/**
 * Creates a completed 4-player SE bracket:
 *   round 1: p1 beats p2, p3 beats p4
 *   round 2: p1 beats p3  (final)
 * One output basket with the given qualifierCount.
 */
async function buildSEFixture(qualifierCount = 1): Promise<Fixture> {
  const suffix = randomUUID().slice(0, 8);

  // Step 1: insert tournament — trigger auto-creates stage at position=1 with
  // elimination_bracket_v1 rankingPolicy and standard_bracket seedingPolicy,
  // status="active" (tournament status != "draft").
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `QP-SE-${suffix}`,
      format: "single_elimination",
      status: "active",
      visibility: "public_online",
      organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
      defaultBestOf: 3,
      currentRound: 2,
      totalRounds: 2,
    })
    .returning();

  // Step 2: read the auto-created stage to capture its id.
  const [stageRef] = await database.db
    .select()
    .from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));
  const stageId = stageRef.id;

  // Step 3: insert players — trigger auto-creates stage_participants for each
  // player (ON CONFLICT DO UPDATE) and sets participant_count=4 on the stage.
  const players = await database.db
    .insert(database.playersTable)
    .values([
      { tournamentId: tournament.id, name: `P1-${suffix}`, seed: 1 },
      { tournamentId: tournament.id, name: `P2-${suffix}`, seed: 2 },
      { tournamentId: tournament.id, name: `P3-${suffix}`, seed: 3 },
      { tournamentId: tournament.id, name: `P4-${suffix}`, seed: 4 },
    ])
    .returning();
  const [p1, p2, p3, p4] = players.map((p) => p.id);

  // Step 4: now participant_count=4 on the stage — safe to update qualification
  // fields (CHECK advancingCount <= participantCount passes: qualifierCount <= 4).
  await database.db
    .update(database.tournamentStagesTable)
    .set({ qualificationMode: "top_n", advancingCount: qualifierCount })
    .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));

  // Step 5: insert completed SE bracket matches.
  const matches = await database.db
    .insert(database.matchesTable)
    .values([
      {
        tournamentId: tournament.id,
        stageId,
        round: 1,
        matchNumber: 1,
        player1Id: p1,
        player2Id: p2,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: p1,
        score1: 2,
        score2: 0,
        completedAt: new Date(),
      },
      {
        tournamentId: tournament.id,
        stageId,
        round: 1,
        matchNumber: 2,
        player1Id: p3,
        player2Id: p4,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: p3,
        score1: 2,
        score2: 1,
        completedAt: new Date(),
      },
      {
        tournamentId: tournament.id,
        stageId,
        round: 2,
        matchNumber: 1,
        player1Id: p1,
        player2Id: p3,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: p1,
        score1: 2,
        score2: 0,
        completedAt: new Date(),
      },
    ])
    .returning();

  const outputBasketId = `out-${stageId}-${suffix}`;
  await database.db.insert(database.stageBasketsTable).values([
    {
      tournamentId: tournament.id,
      stageId,
      id: `in-${stageId}-${suffix}`,
      basketType: "input",
      ordinal: 1,
      displayOrder: 1,
      qualifierCount: null,
    },
    {
      tournamentId: tournament.id,
      stageId,
      id: outputBasketId,
      basketType: "output",
      ordinal: 1,
      displayOrder: 1,
      qualifierCount,
    },
  ]);

  return {
    tournamentId: tournament.id,
    stageId,
    playerIds: [p1, p2, p3, p4],
    matchIds: matches.map((m) => m.id),
    outputBasketId,
    organizerHeaders: {
      "x-organizer-token": signOrganizerToken(
        tournament.id,
        ORGANIZER_PASSWORD_HASH,
      ),
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Phase 2 — Qualification Proposals", () => {
  // ── Before any proposal ───────────────────────────────────────────────────

  test("GET proposal returns 404 when no proposal exists", async () => {
    const fix = await buildSwissFixture({});
    const res = await request(app)
      .get(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 404);
    assert.equal(
      res.body.code,
      "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND",
    );
  });

  test("GET output returns empty array when no proposal approved", async () => {
    const fix = await buildSwissFixture({});
    const res = await request(app)
      .get(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-output`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.entries, []);
  });

  // ── Swiss generate — happy path ───────────────────────────────────────────

  test("Generate proposal for Swiss stage — creates pending proposal with correct entries", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    const res = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const body = res.body;
    assert.equal(body.status, "pending");
    assert.equal(body.revision, 1);
    assert.ok(
      typeof body.rankingFingerprint === "string" &&
        body.rankingFingerprint.length === 64,
      "fingerprint should be a 64-char hex string",
    );
    assert.equal(body.entries.length, 2, "qualifierCount=2 → 2 entries");
    const ranks = body.entries
      .map((e: { placementRank: number }) => e.placementRank)
      .sort((a: number, b: number) => a - b);
    assert.deepEqual(ranks, [1, 2]);
    // All entries target the output basket
    for (const entry of body.entries) {
      assert.equal(entry.basketId, fix.outputBasketId);
    }
  });

  test("GET proposal returns pending proposal after generate", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    const res = await request(app)
      .get(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "pending");
    assert.equal(res.body.revision, 1);
    assert.equal(res.body.entries.length, 2);
  });

  // ── SE generate — happy path ──────────────────────────────────────────────

  test("Generate proposal for SE stage — places tournament winner at rank 1", async () => {
    const fix = await buildSEFixture(1);
    const res = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.status, "pending");
    assert.equal(res.body.entries.length, 1);
    // p1 is the winner — should be rank 1
    assert.equal(res.body.entries[0].placementRank, 1);
    assert.equal(res.body.entries[0].playerId, fix.playerIds[0]);
  });

  // ── Unsupported format ────────────────────────────────────────────────────

  test("Generate fails for double_elimination format", async () => {
    const suffix = randomUUID().slice(0, 8);
    const [tournament] = await database.db
      .insert(database.tournamentsTable)
      .values({
        name: `QP-DE-${suffix}`,
        format: "double_elimination",
        status: "active",
        visibility: "public_online",
        organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
        defaultBestOf: 3,
        currentRound: 1,
        totalRounds: 3,
      })
      .returning();
    // Trigger auto-creates a stage at position=1 with elimination_bracket_v1,
    // status="active" (tournament status != "draft"), qualificationMode="none".
    // No players needed — FORMAT_NOT_SUPPORTED is checked before ranking.
    const [stageRow] = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));
    await database.db.insert(database.stageBasketsTable).values([
      {
        tournamentId: tournament.id,
        stageId: stageRow.id,
        id: `out-${stageRow.id}-${suffix}`,
        basketType: "output",
        ordinal: 1,
        displayOrder: 1,
        qualifierCount: 1,
      },
    ]);
    const headers = {
      "x-organizer-token": signOrganizerToken(
        tournament.id,
        ORGANIZER_PASSWORD_HASH,
      ),
    };
    const res = await request(app)
      .post(
        `/api/tournaments/${tournament.id}/stages/${stageRow.id}/basket-qualification-proposal`,
      )
      .set(headers);
    assert.equal(res.status, 409);
    assert.equal(
      res.body.code,
      "STAGE_BASKET_QUALIFICATION_FORMAT_NOT_SUPPORTED",
    );
  });

  // ── Legacy basket config ──────────────────────────────────────────────────

  test("Generate fails when basket configuration is implicit (no baskets stored)", async () => {
    const fix = await buildSwissFixture({ includeBaskets: false });
    const res = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "STAGE_BASKET_CONFIGURATION_NOT_EXPLICIT");
  });

  // ── Tie detection ─────────────────────────────────────────────────────────

  test("Generate fails with TIE_BREAK_REQUIRED when boundary players share all sporting criteria", async () => {
    // Both winners beat their opponents 2-0:
    //   matchWins=1, buchholz=0 (opponents each have 0 wins), gameDiff=+2, gameWins=2
    // They are tied at the boundary of qualifierCount=1 — only stageSeed separates them.
    const fix = await buildSwissFixture({
      qualifierCount: 1,
      matchScore1: 2,
      matchScore2: 0,
    });
    const res = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 422, JSON.stringify(res.body));
    assert.equal(res.body.code, "STAGE_BASKET_TIE_BREAK_REQUIRED");
    assert.ok(
      res.body.details?.basketId != null,
      "details.basketId should be present",
    );
  });

  // ── No tie when qualifierCount covers both tied players ───────────────────

  test("Generate succeeds with qualifierCount=2 when both tied players enter the same basket", async () => {
    // Both winners are tied (same stats), but qualifierCount=2 takes both of them.
    // No boundary tie — the next players are the losers (different stats).
    const fix = await buildSwissFixture({
      qualifierCount: 2,
      matchScore1: 2,
      matchScore2: 0,
    });
    const res = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    // qualifierCount=2 takes p1 AND p3 — the boundary is between p3 (1W) and p2/p4 (0W), not tied.
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.entries.length, 2);
  });

  // ── Refresh (re-generate) ─────────────────────────────────────────────────

  test("Re-generate pending proposal increments revision and replaces entries", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    const gen1 = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(gen1.status, 200);
    assert.equal(gen1.body.revision, 1);

    const gen2 = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(gen2.status, 200);
    assert.equal(gen2.body.revision, 2);
    assert.equal(gen2.body.status, "pending");
    // Fingerprint is the same since no data changed
    assert.equal(gen1.body.rankingFingerprint, gen2.body.rankingFingerprint);
  });

  // ── Approve ───────────────────────────────────────────────────────────────

  test("Approve pending proposal → status=approved and output materialised", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);

    const approveRes = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);
    assert.equal(approveRes.status, 200, JSON.stringify(approveRes.body));
    assert.equal(approveRes.body.status, "approved");
    assert.ok(approveRes.body.approvedAt != null);
    assert.equal(approveRes.body.approvedByActorType, "organizer");

    // GET output should now return 2 entries
    const outRes = await request(app)
      .get(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-output`,
      )
      .set(fix.organizerHeaders);
    assert.equal(outRes.status, 200);
    assert.equal(outRes.body.entries.length, 2);
    const ranks = outRes.body.entries
      .map((e: { finalRank: number }) => e.finalRank)
      .sort((a: number, b: number) => a - b);
    assert.deepEqual(ranks, [1, 2]);
  });

  test("Approve is idempotent — second approve returns same approved data", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);

    const approve1 = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);
    assert.equal(approve1.status, 200);

    const approve2 = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);
    assert.equal(approve2.status, 200);
    assert.equal(approve2.body.status, "approved");
    assert.equal(approve2.body.revision, approve1.body.revision);
    assert.equal(approve2.body.entries.length, approve1.body.entries.length);
  });

  // ── Stale check ───────────────────────────────────────────────────────────

  test("Approve fails with PROPOSAL_STALE when match result changes after generate", async () => {
    const { eq } = await import("drizzle-orm");
    const fix = await buildSwissFixture({ qualifierCount: 2 });

    // Generate proposal
    const gen = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(gen.status, 200);

    // Mutate a match result (flip the winner of match 1)
    await database.db
      .update(database.matchesTable)
      .set({ winnerId: fix.playerIds[1], score1: 0, score2: 2 })
      .where(eq(database.matchesTable.id, fix.matchIds[0]));

    // Approve should fail — fingerprint now differs
    const approve = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);
    assert.equal(approve.status, 409, JSON.stringify(approve.body));
    assert.equal(
      approve.body.code,
      "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE",
    );
  });

  test("Approve blocks a live stage in basket-authoritative flow", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    const generate = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`)
      .set(fix.organizerHeaders);
    assert.equal(generate.status, 200, JSON.stringify(generate.body));

    await database.db
      .update(database.tournamentsTable)
      .set({ basketFlowAuthorityVersion: 1 })
      .where(eq(database.tournamentsTable.id, fix.tournamentId));

    const approve = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`)
      .set(fix.organizerHeaders);
    assert.equal(approve.status, 409, JSON.stringify(approve.body));
    assert.equal(approve.body.code, "STAGE_BASKET_QUALIFICATION_STAGE_INCOMPLETE");
  });

  // ── Generate blocked after approval ───────────────────────────────────────

  test("Generate fails with ALREADY_APPROVED when a proposal is already approved", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);

    const gen2 = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(gen2.status, 409);
    assert.equal(gen2.body.code, "STAGE_BASKET_QUALIFICATION_ALREADY_APPROVED");
  });

  // ── Approve without proposal ──────────────────────────────────────────────

  test("Approve fails with PROPOSAL_NOT_FOUND when no proposal exists", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    const res = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 404);
    assert.equal(
      res.body.code,
      "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND",
    );
  });

  // ── GET output basket assignment ──────────────────────────────────────────

  test("GET output shows correct basket assignment after approval", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);

    const res = await request(app)
      .get(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-output`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 200);
    const entries = res.body.entries;
    assert.equal(entries.length, 2);
    for (const entry of entries) {
      assert.equal(entry.basketId, fix.outputBasketId);
    }
    const playerIds = entries.map((e: { playerId: number }) => e.playerId);
    // Winners p1 (rank 1) and p3 (rank 2) should be in the output
    assert.ok(
      playerIds.includes(fix.playerIds[0]),
      "p1 (winner of match 1) should be in output",
    );
    assert.ok(
      playerIds.includes(fix.playerIds[2]),
      "p3 (winner of match 2) should be in output",
    );
  });

  test("SE output places the tournament winner at rank 1", async () => {
    const fix = await buildSEFixture(1);
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);

    const res = await request(app)
      .get(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-output`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 200);
    assert.equal(res.body.entries.length, 1);
    assert.equal(res.body.entries[0].playerId, fix.playerIds[0]); // p1 won the final
    assert.equal(res.body.entries[0].finalRank, 1);
  });

  // ── GET proposal reflects approved state ──────────────────────────────────

  test("GET proposal reflects approved status after approval", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);

    const res = await request(app)
      .get(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "approved");
    assert.ok(res.body.approvedAt != null);
    assert.equal(res.body.approvedByActorType, "organizer");
  });

  // ── Auth boundaries ───────────────────────────────────────────────────────

  test("Generate without auth token returns 403", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    const res = await request(app).post(
      `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
    );
    assert.equal(res.status, 403);
  });

  test("Approve without auth token returns 403", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });
    const res = await request(app).post(
      `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
    );
    assert.equal(res.status, 403);
  });

  // ── Stale check: basket config changes ───────────────────────────────────

  test("Approve fails with PROPOSAL_STALE when output basket qualifierCount changes after generate", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });

    // Generate proposal
    const gen = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(gen.status, 200);

    // Change qualifierCount on the output basket (2 → 1)
    const { eq: eqLocal } = await import("drizzle-orm");
    await database.db
      .update(database.stageBasketsTable)
      .set({ qualifierCount: 1 })
      .where(eqLocal(database.stageBasketsTable.id, fix.outputBasketId));

    // Approve must fail — fingerprint now differs (basket config changed)
    const approve = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);
    assert.equal(approve.status, 409, JSON.stringify(approve.body));
    assert.equal(
      approve.body.code,
      "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE",
    );
  });

  test("Approve fails with PROPOSAL_STALE when output basket display order changes after generate", async () => {
    const { eq: eqLocal } = await import("drizzle-orm");
    const suffix = randomUUID().slice(0, 8);

    // Create a Swiss tournament with 2 output baskets (order 1 and 2, 1 slot each)
    const [tournament] = await database.db
      .insert(database.tournamentsTable)
      .values({
        name: `QP-OrderStale-${suffix}`,
        format: "swiss",
        status: "active",
        visibility: "public_online",
        organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
        defaultBestOf: 3,
        currentRound: 1,
        totalRounds: 2,
        swissRounds: 2,
      })
      .returning();
    const [stageRef] = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eqLocal(database.tournamentStagesTable.tournamentId, tournament.id));
    const stageId = stageRef.id;
    const players = await database.db
      .insert(database.playersTable)
      .values([
        { tournamentId: tournament.id, name: `A-${suffix}`, seed: 1 },
        { tournamentId: tournament.id, name: `B-${suffix}`, seed: 2 },
        { tournamentId: tournament.id, name: `C-${suffix}`, seed: 3 },
        { tournamentId: tournament.id, name: `D-${suffix}`, seed: 4 },
      ])
      .returning();
    await database.db
      .update(database.tournamentStagesTable)
      .set({ qualificationMode: "top_n", advancingCount: 2 })
      .where(eqLocal(database.tournamentStagesTable.tournamentId, tournament.id));
    await database.db.insert(database.matchesTable).values([
      {
        tournamentId: tournament.id,
        stageId,
        round: 1,
        matchNumber: 1,
        player1Id: players[0].id,
        player2Id: players[1].id,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: players[0].id,
        score1: 2,
        score2: 1,
        completedAt: new Date(),
      },
      {
        tournamentId: tournament.id,
        stageId,
        round: 1,
        matchNumber: 2,
        player1Id: players[2].id,
        player2Id: players[3].id,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: players[2].id,
        score1: 2,
        score2: 0,
        completedAt: new Date(),
      },
    ]);
    const basket1Id = `out1-${stageId}-${suffix}`;
    const basket2Id = `out2-${stageId}-${suffix}`;
    await database.db.insert(database.stageBasketsTable).values([
      {
        tournamentId: tournament.id,
        stageId,
        id: `in-${stageId}-${suffix}`,
        basketType: "input",
        ordinal: 1,
        displayOrder: 1,
        qualifierCount: null,
      },
      {
        tournamentId: tournament.id,
        stageId,
        id: basket1Id,
        basketType: "output",
        ordinal: 1,
        displayOrder: 1,
        qualifierCount: 1,
      },
      {
        tournamentId: tournament.id,
        stageId,
        id: basket2Id,
        basketType: "output",
        ordinal: 2,
        displayOrder: 2,
        qualifierCount: 1,
      },
    ]);
    const headers = {
      "x-organizer-token": signOrganizerToken(
        tournament.id,
        ORGANIZER_PASSWORD_HASH,
      ),
    };

    // Generate proposal
    const gen = await request(app)
      .post(
        `/api/tournaments/${tournament.id}/stages/${stageId}/basket-qualification-proposal`,
      )
      .set(headers);
    assert.equal(gen.status, 200, JSON.stringify(gen.body));

    // Swap display orders (1↔2) via a temporary value of 3 to avoid the
    // unique constraint on (stage_id, basket_type, display_order) and the
    // CHECK (display_order BETWEEN 1 AND 4).
    // Step: basket1→3, basket2→1, basket1→2
    await database.db
      .update(database.stageBasketsTable)
      .set({ displayOrder: 3 })
      .where(eqLocal(database.stageBasketsTable.id, basket1Id));
    await database.db
      .update(database.stageBasketsTable)
      .set({ displayOrder: 1 })
      .where(eqLocal(database.stageBasketsTable.id, basket2Id));
    await database.db
      .update(database.stageBasketsTable)
      .set({ displayOrder: 2 })
      .where(eqLocal(database.stageBasketsTable.id, basket1Id));

    // Approve must fail — fingerprint differs (basket order changed)
    const approve = await request(app)
      .post(
        `/api/tournaments/${tournament.id}/stages/${stageId}/basket-qualification-proposal/approve`,
      )
      .set(headers);
    assert.equal(approve.status, 409, JSON.stringify(approve.body));
    assert.equal(
      approve.body.code,
      "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE",
    );
  });

  // ── Round Robin 3-way tie safety ─────────────────────────────────────────

  test("Round Robin 3-way tie at basket boundary is blocked (STAGE_BASKET_TIE_BREAK_REQUIRED)", async () => {
    // Cyclic wins: A beats B (2-0), B beats C (2-0), C beats A (2-0).
    // Each player: 1 matchWin, gameDiff = +2-2 = 0, gameWins = 2.
    // qualifierCount=1 → boundary lies between three equally-ranked players.
    // No H2H resolution (>2-way tie) → hasTieAtBoundary returns true → blocked.
    const { eq: eqLocal } = await import("drizzle-orm");
    const suffix = randomUUID().slice(0, 8);
    const [tournament] = await database.db
      .insert(database.tournamentsTable)
      .values({
        name: `QP-RR3Way-${suffix}`,
        format: "round_robin",
        status: "active",
        visibility: "public_online",
        organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
        defaultBestOf: 3,
        currentRound: 3,
        totalRounds: 3,
      })
      .returning();
    const [stageRef] = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eqLocal(database.tournamentStagesTable.tournamentId, tournament.id));
    const stageId = stageRef.id;
    const players = await database.db
      .insert(database.playersTable)
      .values([
        { tournamentId: tournament.id, name: `A-${suffix}`, seed: 1 },
        { tournamentId: tournament.id, name: `B-${suffix}`, seed: 2 },
        { tournamentId: tournament.id, name: `C-${suffix}`, seed: 3 },
      ])
      .returning();
    const [pA, pB, pC] = players.map((p) => p.id);
    await database.db
      .update(database.tournamentStagesTable)
      .set({ qualificationMode: "top_n", advancingCount: 1 })
      .where(eqLocal(database.tournamentStagesTable.tournamentId, tournament.id));
    // A beats B (2-0), B beats C (2-0), C beats A (2-0)
    await database.db.insert(database.matchesTable).values([
      {
        tournamentId: tournament.id,
        stageId,
        round: 1,
        matchNumber: 1,
        player1Id: pA,
        player2Id: pB,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: pA,
        score1: 2,
        score2: 0,
        completedAt: new Date(),
      },
      {
        tournamentId: tournament.id,
        stageId,
        round: 2,
        matchNumber: 1,
        player1Id: pB,
        player2Id: pC,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: pB,
        score1: 2,
        score2: 0,
        completedAt: new Date(),
      },
      {
        tournamentId: tournament.id,
        stageId,
        round: 3,
        matchNumber: 1,
        player1Id: pC,
        player2Id: pA,
        bestOf: 3,
        status: "completed",
        resultType: "played",
        winnerId: pC,
        score1: 2,
        score2: 0,
        completedAt: new Date(),
      },
    ]);
    await database.db.insert(database.stageBasketsTable).values([
      {
        tournamentId: tournament.id,
        stageId,
        id: `in-${stageId}-${suffix}`,
        basketType: "input",
        ordinal: 1,
        displayOrder: 1,
        qualifierCount: null,
      },
      {
        tournamentId: tournament.id,
        stageId,
        id: `out-${stageId}-${suffix}`,
        basketType: "output",
        ordinal: 1,
        displayOrder: 1,
        qualifierCount: 1,
      },
    ]);
    const headers = {
      "x-organizer-token": signOrganizerToken(
        tournament.id,
        ORGANIZER_PASSWORD_HASH,
      ),
    };
    const res = await request(app)
      .post(
        `/api/tournaments/${tournament.id}/stages/${stageId}/basket-qualification-proposal`,
      )
      .set(headers);
    assert.equal(res.status, 422, JSON.stringify(res.body));
    assert.equal(res.body.code, "STAGE_BASKET_TIE_BREAK_REQUIRED");
  });

  // ── Backup V3 round-trip: pending ─────────────────────────────────────────

  /**
   * Helper that builds a Swiss fixture suitable for backup round-trip tests.
   * advancingCount is reset to null so the backup v3 stage plan validator
   * treats the single stage as terminal (non-advancing).
   */
  async function buildBackupSwissFixture(qualifierCount = 2): Promise<Fixture> {
    const fix = await buildSwissFixture({ qualifierCount });
    const { eq: eqLocal } = await import("drizzle-orm");
    await database.db
      .update(database.tournamentStagesTable)
      .set({ advancingCount: null, qualificationMode: "none" })
      .where(eqLocal(database.tournamentStagesTable.id, fix.stageId));
    return fix;
  }

  /** Shared restore logic for pending round-trip tests. */
  async function generateExportAndRestore(qualifierCount = 2): Promise<{
    newTournamentId: number;
    newStageId: number;
    newOrganizerToken: string;
    newMatchIds: number[];
    newPlayerIds: number[];
    newOutputBasketId: string;
  }> {
    const fix = await buildBackupSwissFixture(qualifierCount);

    // Generate pending proposal
    const gen = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    assert.equal(gen.status, 200, `generate failed: ${JSON.stringify(gen.body)}`);

    // Export
    const exportRes = await request(app)
      .get(`/api/tournaments/${fix.tournamentId}/export`)
      .set(fix.organizerHeaders);
    assert.equal(exportRes.status, 200, "export should succeed");

    // Restore
    const importRes = await request(app)
      .post("/api/tournaments/import")
      .send({ backup: exportRes.body, organizerPassword: "RestoredPw1!" });
    assert.ok(
      importRes.status >= 200 && importRes.status < 300,
      `import failed ${importRes.status}: ${JSON.stringify(importRes.body)}`,
    );
    const newTournamentId = importRes.body.tournament.id as number;
    const newOrganizerToken = importRes.body.organizerToken as string;

    // Resolve restored DB rows
    const { eq: eqLocal } = await import("drizzle-orm");
    const [restoredStage] = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eqLocal(database.tournamentStagesTable.tournamentId, newTournamentId));
    const restoredPlayers = await database.db
      .select()
      .from(database.playersTable)
      .where(eqLocal(database.playersTable.tournamentId, newTournamentId));
    const restoredMatches = await database.db
      .select()
      .from(database.matchesTable)
      .where(eqLocal(database.matchesTable.tournamentId, newTournamentId));
    const restoredBaskets = await database.db
      .select()
      .from(database.stageBasketsTable)
      .where(eqLocal(database.stageBasketsTable.tournamentId, newTournamentId));
    const outputBasket = restoredBaskets.find((b) => b.basketType === "output")!;

    return {
      newTournamentId,
      newStageId: restoredStage.id,
      newOrganizerToken,
      newMatchIds: restoredMatches.map((m) => m.id),
      newPlayerIds: restoredPlayers
        .map((p) => {
          if (p.seed === null) {
            throw new Error(`Restored player ${p.id} is missing stage seed`);
          }

          return { id: p.id, seed: p.seed };
        })
        .sort((a, b) => a.seed - b.seed)
        .map((p) => p.id),
      newOutputBasketId: outputBasket.id,
    };
  }

  test("Backup V3 pending round-trip: restore → immediate approve succeeds with output materialised", async () => {
    const {
      newTournamentId,
      newStageId,
      newOrganizerToken,
    } = await generateExportAndRestore(2);
    const headers = { "x-organizer-token": newOrganizerToken };

    // Verify the proposal is pending
    const proposalRes = await request(app)
      .get(`/api/tournaments/${newTournamentId}/stages/${newStageId}/basket-qualification-proposal`)
      .set(headers);
    assert.equal(proposalRes.status, 200, JSON.stringify(proposalRes.body));
    const rp = proposalRes.body as {
      status: string;
      revision: number;
      rankingFingerprint: string;
      entries: { placementRank: number }[];
    };
    assert.equal(rp.status, "pending");
    assert.equal(rp.revision, 1);
    assert.equal(rp.entries.length, 2);
    // The fingerprint is RECOMPUTED during import using the restored integer IDs.
    // It will differ from the original fingerprint (which used different IDs).
    assert.ok(
      typeof rp.rankingFingerprint === "string" && rp.rankingFingerprint.length === 64,
      "restored fingerprint must be a valid 64-char SHA-256 hex",
    );

    // Output must be empty (still pending)
    const outputBefore = await request(app)
      .get(`/api/tournaments/${newTournamentId}/stages/${newStageId}/basket-qualification-output`)
      .set(headers);
    assert.equal(outputBefore.status, 200);
    assert.equal(outputBefore.body.entries.length, 0);

    // Approve without any mutation → must succeed (fingerprint matches restored state)
    const approveRes = await request(app)
      .post(`/api/tournaments/${newTournamentId}/stages/${newStageId}/basket-qualification-proposal/approve`)
      .set(headers);
    assert.equal(
      approveRes.status,
      200,
      `approve after restore must succeed: ${JSON.stringify(approveRes.body)}`,
    );
    assert.equal(approveRes.body.status, "approved");
    assert.ok(approveRes.body.approvedAt != null);

    // Output must be materialised with 2 entries
    const outputAfter = await request(app)
      .get(`/api/tournaments/${newTournamentId}/stages/${newStageId}/basket-qualification-output`)
      .set(headers);
    assert.equal(outputAfter.status, 200);
    assert.equal(outputAfter.body.entries.length, 2, "2 output rows must be materialised");
    const finalRanks = (outputAfter.body.entries as { finalRank: number }[])
      .map((e) => e.finalRank)
      .sort((a, b) => a - b);
    assert.deepEqual(finalRanks, [1, 2]);
  });

  test("Backup V3 pending round-trip: restore → match mutation → approve = STALE", async () => {
    const {
      newTournamentId,
      newStageId,
      newOrganizerToken,
      newMatchIds,
      newPlayerIds,
    } = await generateExportAndRestore(2);
    const headers = { "x-organizer-token": newOrganizerToken };

    // Mutate a match result on the restored tournament (flip winner of match 0)
    const { eq: eqLocal } = await import("drizzle-orm");
    await database.db
      .update(database.matchesTable)
      .set({ winnerId: newPlayerIds[1], score1: 0, score2: 2 })
      .where(eqLocal(database.matchesTable.id, newMatchIds[0]));

    // Approve must fail — match result changed after restore, fingerprint differs
    const approveRes = await request(app)
      .post(`/api/tournaments/${newTournamentId}/stages/${newStageId}/basket-qualification-proposal/approve`)
      .set(headers);
    assert.equal(approveRes.status, 409, JSON.stringify(approveRes.body));
    assert.equal(approveRes.body.code, "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE");
  });

  test("Backup V3 pending round-trip: restore → qualifierCount mutation → approve = STALE", async () => {
    const {
      newTournamentId,
      newStageId,
      newOrganizerToken,
      newOutputBasketId,
    } = await generateExportAndRestore(2);
    const headers = { "x-organizer-token": newOrganizerToken };

    // Mutate the output basket qualifierCount on the restored tournament
    const { eq: eqLocal } = await import("drizzle-orm");
    await database.db
      .update(database.stageBasketsTable)
      .set({ qualifierCount: 1 })
      .where(eqLocal(database.stageBasketsTable.id, newOutputBasketId));

    // Approve must fail — basket config changed after restore, fingerprint differs
    const approveRes = await request(app)
      .post(`/api/tournaments/${newTournamentId}/stages/${newStageId}/basket-qualification-proposal/approve`)
      .set(headers);
    assert.equal(approveRes.status, 409, JSON.stringify(approveRes.body));
    assert.equal(approveRes.body.code, "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE");
  });

  // ── Backup V3 round-trip: approved ────────────────────────────────────────

  test("Backup V3 approved round-trip: approved proposal with output rows survives export → restore → reload", async () => {
    const fix = await buildSwissFixture({ qualifierCount: 2 });

    // Reset advancingCount to null so the backup v3 stage plan validator
    // treats this as a terminal stage. The basket qualifierCount still drives
    // the proposal; advancingCount is unrelated to proposal generation.
    const { eq: eqLocal } = await import("drizzle-orm");
    await database.db
      .update(database.tournamentStagesTable)
      .set({ advancingCount: null, qualificationMode: "none" })
      .where(eqLocal(database.tournamentStagesTable.id, fix.stageId));

    // Generate and approve
    await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal`,
      )
      .set(fix.organizerHeaders);
    const approveRes = await request(app)
      .post(
        `/api/tournaments/${fix.tournamentId}/stages/${fix.stageId}/basket-qualification-proposal/approve`,
      )
      .set(fix.organizerHeaders);
    assert.equal(approveRes.status, 200);
    const origProposal = approveRes.body as {
      revision: number;
      rankingFingerprint: string;
      approvedByActorType: string;
      entries: { placementRank: number }[];
    };

    // Export backup
    const exportRes = await request(app)
      .get(`/api/tournaments/${fix.tournamentId}/export`)
      .set(fix.organizerHeaders);
    assert.equal(exportRes.status, 200);
    const backup = exportRes.body as {
      qualificationProposals: {
        status: string;
        approvedByActorType: string;
        output?: { finalRank: number }[];
      }[];
    };
    assert.ok(
      Array.isArray(backup.qualificationProposals) &&
        backup.qualificationProposals.length === 1,
    );
    assert.equal(backup.qualificationProposals[0].status, "approved");
    assert.equal(
      backup.qualificationProposals[0].approvedByActorType,
      "organizer",
    );
    assert.ok(
      Array.isArray(backup.qualificationProposals[0].output) &&
        (backup.qualificationProposals[0].output as { finalRank: number }[])
          .length === 2,
      "approved backup must include 2 output rows",
    );

    // Restore to a new tournament (import returns 201 Created)
    const importRes = await request(app)
      .post("/api/tournaments/import")
      .send({ backup, organizerPassword: "RestoredPw1!" });
    assert.ok(
      importRes.status >= 200 && importRes.status < 300,
      `import failed ${importRes.status}: ${JSON.stringify(importRes.body)}`,
    );
    const newTournamentId = importRes.body.tournament.id as number;
    const newOrganizerToken = importRes.body.organizerToken as string;
    const [restoredStage] = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eq(database.tournamentStagesTable.tournamentId, newTournamentId));

    // Verify proposal: approved, metadata preserved
    const proposalRes = await request(app)
      .get(
        `/api/tournaments/${newTournamentId}/stages/${restoredStage.id}/basket-qualification-proposal`,
      )
      .set({ "x-organizer-token": newOrganizerToken });
    assert.equal(proposalRes.status, 200, JSON.stringify(proposalRes.body));
    const rp = proposalRes.body as {
      status: string;
      revision: number;
      rankingFingerprint: string;
      approvedByActorType: string;
      approvedAt: string;
      entries: { placementRank: number }[];
    };
    assert.equal(rp.status, "approved");
    assert.equal(rp.revision, origProposal.revision);
    assert.equal(rp.rankingFingerprint, origProposal.rankingFingerprint);
    assert.equal(rp.approvedByActorType, origProposal.approvedByActorType);
    assert.ok(rp.approvedAt != null, "approvedAt must be preserved");
    assert.equal(rp.entries.length, origProposal.entries.length);
    const restoredRanks = rp.entries
      .map((e) => e.placementRank)
      .sort((a, b) => a - b);
    assert.deepEqual(restoredRanks, [1, 2]);

    // Verify output rows are materialised with correct ranks
    const outputRes = await request(app)
      .get(
        `/api/tournaments/${newTournamentId}/stages/${restoredStage.id}/basket-qualification-output`,
      )
      .set({ "x-organizer-token": newOrganizerToken });
    assert.equal(outputRes.status, 200);
    const entries = outputRes.body.entries as {
      playerId: number;
      finalRank: number;
    }[];
    assert.equal(entries.length, 2, "2 output rows must be restored");
    // Each player appears at most once
    const playerIds = entries.map((e) => e.playerId);
    assert.equal(
      new Set(playerIds).size,
      playerIds.length,
      "no duplicate players in output",
    );
    const finalRanks = entries.map((e) => e.finalRank).sort((a, b) => a - b);
    assert.deepEqual(finalRanks, [1, 2]);

    // Approved proposal is immutable: generate must fail
    const genRes = await request(app)
      .post(
        `/api/tournaments/${newTournamentId}/stages/${restoredStage.id}/basket-qualification-proposal`,
      )
      .set({ "x-organizer-token": newOrganizerToken });
    assert.equal(genRes.status, 409);
    assert.equal(
      genRes.body.code,
      "STAGE_BASKET_QUALIFICATION_ALREADY_APPROVED",
    );

    // Second approve is idempotent
    const approve2 = await request(app)
      .post(
        `/api/tournaments/${newTournamentId}/stages/${restoredStage.id}/basket-qualification-proposal/approve`,
      )
      .set({ "x-organizer-token": newOrganizerToken });
    assert.equal(approve2.status, 200);
    assert.equal(approve2.body.status, "approved");
    assert.equal(approve2.body.entries.length, 2);
  });
});
