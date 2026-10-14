/**
 * Integration tests — Phase 3: Basket Route Execution
 *
 * Covers:
 *   §21 Core execution scenarios
 *   1.  executeBasketRoute — happy path (idempotent first call)
 *   2.  executeBasketRoute — idempotent second call returns existing execution
 *   3.  executeBasketRoute — ROUTE_NOT_FOUND (no route configured)
 *   4.  executeBasketRoute — SOURCE_NOT_APPROVED (proposal is pending)
 *   5.  executeBasketRoute — SOURCE_NOT_APPROVED (no proposal at all)
 *   6.  executeBasketRoute — OUTPUT_INCOMPLETE (qualifierCount mismatch)
 *   7.  executeBasketRoute — TARGET_STAGE_ALREADY_STARTED (active)
 *   8.  executeBasketRoute — TARGET_STAGE_ALREADY_STARTED (completed)
 *   9.  executeBasketRoute — PARTICIPANT_CONFLICT (direct assignment)
 *   10. executeBasketRoute — PARTICIPANT_CONFLICT (prior route execution)
 *   11. executeBasketRoute — LEGACY_NOT_SUPPORTED (no baskets at all)
 *   12. getBasketRouteStatus — 200 with sourceOutputApproved=false before approval
 *   13. getBasketRouteStatus — 200 with materialized=true after execute
 *   14. getBasketInputArrivals — direct + routed players aggregated correctly
 *   15. Non-organizer cannot execute (returns 403)
 *
 *   §22 Backup round-trip
 *   16. Backup V3 round-trip: route execution survives export → import → reload
 *
 * Schema: tm_test_baskets_phase3
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import { and, eq } from "drizzle-orm";
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
  stageBasketRoutesTable: typeof import("@workspace/db").stageBasketRoutesTable;
  stageBasketParticipantsTable: typeof import("@workspace/db").stageBasketParticipantsTable;
  stageBasketsOutputPlayersTable: typeof import("@workspace/db").stageBasketsOutputPlayersTable;
  qualificationProposalsTable: typeof import("@workspace/db").qualificationProposalsTable;
  stageBasketRouteExecutionsTable: typeof import("@workspace/db").stageBasketRouteExecutionsTable;
  stageBasketRouteEntriesTable: typeof import("@workspace/db").stageBasketRouteEntriesTable;
}

// ─── Globals ─────────────────────────────────────────────────────────────────

const SESSION_SECRET = `qp-phase3-${randomUUID()}`;
const ORGANIZER_PASSWORD_HASH = "test-organizer-hash-phase3";
let app: Express;
let database: DbModule;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;
let signOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let revertMatch: typeof import("../src/application/matches/revert-match").revertMatch;
let RevertMatchError: typeof import("../src/application/matches/revert-match").RevertMatchError;

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
  ({ revertMatch, RevertMatchError } = await import("../src/application/matches/revert-match"));
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

/**
 * A two-stage tournament with an explicit basket route between them.
 * Stage 1 (Swiss, active): source stage with output basket → route → stage 2 input basket.
 * Stage 2 (SE, planned): target stage with input basket.
 */
interface RouteFixture {
  tournamentId: number;
  /** Source (Swiss) stage id */
  sourceStageId: number;
  /** Source output basket id */
  outputBasketId: string;
  /** Target (SE) stage id */
  targetStageId: number;
  /** Target input basket id */
  targetInputBasketId: string;
  /** Route id (stable string) */
  routeId: string;
  playerIds: [number, number, number, number];
  organizerHeaders: Record<string, string>;
}

async function buildRouteFixture(opts: {
  qualifierCount?: number;
  /** If true, skip adding a basket route (for ROUTE_NOT_FOUND tests) */
  skipRoute?: boolean;
  /** If true, skip all baskets (for LEGACY tests) */
  skipBaskets?: boolean;
  /** If true, add a direct participant to target basket before route execute */
  addConflictingDirectParticipant?: boolean;
}): Promise<RouteFixture> {
  const qualifierCount = opts.qualifierCount ?? 2;
  const suffix = randomUUID().slice(0, 8);

  // Stage 1: Swiss (source)
  const [tournament] = await database.db
    .insert(database.tournamentsTable)
    .values({
      name: `P3-${suffix}`,
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

  const [stage1Row] = await database.db
    .select()
    .from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournament.id));
  const sourceStageId = stage1Row.id;

  // Insert players (trigger auto-creates stage_participants)
  const players = await database.db
    .insert(database.playersTable)
    .values([
      { tournamentId: tournament.id, name: `P3-A-${suffix}`, seed: 1 },
      { tournamentId: tournament.id, name: `P3-B-${suffix}`, seed: 2 },
      { tournamentId: tournament.id, name: `P3-C-${suffix}`, seed: 3 },
      { tournamentId: tournament.id, name: `P3-D-${suffix}`, seed: 4 },
    ])
    .returning();
  const [p1, p2, p3, p4] = players.map((p) => p.id) as [number, number, number, number];

  // Set qualificationMode so proposal generation works (only on source stage)
  await database.db
    .update(database.tournamentStagesTable)
    .set({ qualificationMode: "top_n", advancingCount: qualifierCount })
    .where(eq(database.tournamentStagesTable.id, sourceStageId));

  // Complete matches: p1 beats p2 2-0, p3 beats p4 2-1
  await database.db.insert(database.matchesTable).values([
    {
      tournamentId: tournament.id,
      stageId: sourceStageId,
      round: 1, matchNumber: 1,
      player1Id: p1, player2Id: p2, bestOf: 3,
      status: "completed", resultType: "played", winnerId: p1,
      score1: 2, score2: 0, completedAt: new Date(),
    },
    {
      tournamentId: tournament.id,
      stageId: sourceStageId,
      round: 1, matchNumber: 2,
      player1Id: p3, player2Id: p4, bestOf: 3,
      status: "completed", resultType: "played", winnerId: p3,
      score1: 2, score2: 1, completedAt: new Date(),
    },
  ]);

  // Stage 2: SE (target), planned
  const [stage2Row] = await database.db
    .insert(database.tournamentStagesTable)
    .values({
      tournamentId: tournament.id,
      stageKey: `stage-2-${suffix}`,
      position: 2,
      name: `Final-${suffix}`,
      format: "single_elimination",
      status: "planned",
      participantCount: qualifierCount,
      bestOf: 3,
      rankingPolicy: "elimination_bracket_v1",
      qualificationMode: "none",
      seedingPolicy: "standard_bracket",
      version: 1,
    })
    .returning();
  const targetStageId = stage2Row.id;

  const outputBasketId = opts.skipBaskets ? `out-${suffix}` : `out-s1-${suffix}`;
  const targetInputBasketId = `in-s2-${suffix}`;
  const routeId = `route-${suffix}`;

  if (!opts.skipBaskets) {
    await database.db.insert(database.stageBasketsTable).values([
      // Source stage baskets
      {
        tournamentId: tournament.id,
        stageId: sourceStageId,
        id: `in-s1-${suffix}`,
        basketType: "input",
        ordinal: 1, displayOrder: 1,
        qualifierCount: null,
      },
      {
        tournamentId: tournament.id,
        stageId: sourceStageId,
        id: outputBasketId,
        basketType: "output",
        ordinal: 1, displayOrder: 1,
        qualifierCount,
      },
      // Target stage baskets
      {
        tournamentId: tournament.id,
        stageId: targetStageId,
        id: targetInputBasketId,
        basketType: "input",
        ordinal: 1, displayOrder: 1,
        qualifierCount: null,
      },
      // Target stage output basket: required by the backup validator (1-4 baskets of each type per stage).
      // qualifierCount must be a positive integer in explicit-mode validation.
      {
        tournamentId: tournament.id,
        stageId: targetStageId,
        id: `out-s2-${suffix}`,
        basketType: "output",
        ordinal: 1, displayOrder: 1,
        qualifierCount: 1,
      },
    ]);

    if (!opts.skipRoute) {
      await database.db.insert(database.stageBasketRoutesTable).values({
        id: routeId,
        tournamentId: tournament.id,
        sourceStageId,
        sourceBasketId: outputBasketId,
        targetStageId,
        targetBasketId: targetInputBasketId,
      });
    }

    if (opts.addConflictingDirectParticipant) {
      // Add p1 as a direct participant in the target stage basket
      await database.db.insert(database.stageBasketParticipantsTable).values({
        tournamentId: tournament.id,
        stageId: targetStageId,
        basketId: targetInputBasketId,
        playerId: p1,
      });
    }
  }

  return {
    tournamentId: tournament.id,
    sourceStageId,
    outputBasketId,
    targetStageId,
    targetInputBasketId,
    routeId,
    playerIds: [p1, p2, p3, p4],
    organizerHeaders: {
      "x-organizer-token": signOrganizerToken(
        tournament.id,
        ORGANIZER_PASSWORD_HASH,
      ),
    },
  };
}

/** Generate + approve a qualification proposal via the API. */
async function approveProposal(fix: RouteFixture): Promise<void> {
  const genRes = await request(app)
    .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/basket-qualification-proposal`)
    .set(fix.organizerHeaders);
  assert.equal(genRes.status, 200, `Generate: ${JSON.stringify(genRes.body)}`);

  const approveRes = await request(app)
    .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/basket-qualification-proposal/approve`)
    .set(fix.organizerHeaders);
  assert.equal(approveRes.status, 200, `Approve: ${JSON.stringify(approveRes.body)}`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Phase 3 — Basket Route Execution", () => {

  test("concurrent approval and concurrent routing persist one output and one arrival per qualifier", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    const proposalPath = `/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/basket-qualification-proposal`;
    await request(app).post(proposalPath).set(fix.organizerHeaders).expect(200);
    const approvals = await Promise.all([1, 2].map(() =>
      request(app).post(`${proposalPath}/approve`).set(fix.organizerHeaders).expect(200)));
    assert.equal(approvals[0].body.revision, approvals[1].body.revision);
    const path = `/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`;
    const routes = await Promise.all([1, 2].map(() => request(app).post(path).set(fix.organizerHeaders).expect(200)));
    assert.equal(routes[0].body.executionId, routes[1].body.executionId);
    const executions = await database.pool.query(
      "SELECT count(*)::int AS count FROM stage_basket_route_executions WHERE route_id=$1", [fix.routeId]);
    assert.equal(executions.rows[0].count, 1);
    const entries = await database.pool.query<{ player_id: number }>(
      "SELECT player_id FROM stage_basket_route_entries WHERE target_stage_id=$1 ORDER BY player_id", [fix.targetStageId]);
    assert.deepEqual(entries.rows.map(row => row.player_id), [fix.playerIds[0], fix.playerIds[2]].sort((a, b) => a - b));
    const output = await request(app).get(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/basket-qualification-output`)
      .set(fix.organizerHeaders).expect(200);
    assert.equal(output.body.entries.length, 2);
    const retry = await request(app).post(path).set(fix.organizerHeaders).expect(200);
    assert.equal(retry.body.executionId, routes[0].body.executionId);
  });

  // §21.1 Happy path
  test("executeBasketRoute — happy path returns execution with entries", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);

    assert.equal(res.status, 200, JSON.stringify(res.body));
    const body = res.body;
    assert.equal(body.routeId, fix.routeId);
    assert.equal(body.sourceStageId, fix.sourceStageId);
    assert.equal(body.sourceBasketId, fix.outputBasketId);
    assert.equal(body.targetStageId, fix.targetStageId);
    assert.equal(body.targetBasketId, fix.targetInputBasketId);
    assert.equal(body.routedPlayerCount, 2);
    assert.ok(body.executionId > 0);
    assert.ok(Array.isArray(body.entries) && body.entries.length === 2);
    // Entries have required fields
    for (const entry of body.entries) {
      assert.ok(entry.playerId > 0);
      assert.ok(entry.sourceFinalRank >= 1);
      assert.ok(entry.sourceOutputPlayerId > 0);
    }
    // The two routed players are the winners (p1 and p3)
    const routedIds = body.entries.map((e: { playerId: number }) => e.playerId).sort();
    const expectedIds = [fix.playerIds[0], fix.playerIds[2]].sort();
    assert.deepEqual(routedIds, expectedIds);
  });

  // §21.2 Idempotent second call
  test("executeBasketRoute — second call returns existing execution (idempotent)", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);

    const path = `/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`;
    const res1 = await request(app).post(path).set(fix.organizerHeaders);
    assert.equal(res1.status, 200);
    const res2 = await request(app).post(path).set(fix.organizerHeaders);
    assert.equal(res2.status, 200);

    // Same execution id
    assert.equal(res2.body.executionId, res1.body.executionId);
    assert.equal(res2.body.routedPlayerCount, res1.body.routedPlayerCount);
  });

  test("revertMatch — rejects a source result after basket routing and preserves downstream state", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);

    const route = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(route.status, 200, JSON.stringify(route.body));

    const [sourceMatch] = await database.db
      .select({ id: database.matchesTable.id })
      .from(database.matchesTable)
      .where(eq(database.matchesTable.stageId, fix.sourceStageId));
    assert.ok(sourceMatch);
    const beforeMatch = await database.pool.query(
      "SELECT status, result_type, winner_id, score1, score2 FROM matches WHERE id = $1",
      [sourceMatch.id],
    );
    const beforeRouteEntries = await database.pool.query(
      "SELECT count(*)::int AS count FROM stage_basket_route_entries WHERE target_stage_id = $1",
      [fix.targetStageId],
    );
    const beforeExecution = await database.pool.query(
      "SELECT count(*)::int AS count FROM stage_basket_route_executions WHERE route_id = $1",
      [fix.routeId],
    );

    await assert.rejects(
      () => revertMatch({ matchId: sourceMatch.id }),
      (error: unknown) => error instanceof RevertMatchError
        && error.code === "STAGE_QUALIFICATION_ALREADY_COMMITTED",
    );

    const afterMatch = await database.pool.query(
      "SELECT status, result_type, winner_id, score1, score2 FROM matches WHERE id = $1",
      [sourceMatch.id],
    );
    const afterRouteEntries = await database.pool.query(
      "SELECT count(*)::int AS count FROM stage_basket_route_entries WHERE target_stage_id = $1",
      [fix.targetStageId],
    );
    const afterExecution = await database.pool.query(
      "SELECT count(*)::int AS count FROM stage_basket_route_executions WHERE route_id = $1",
      [fix.routeId],
    );
    assert.deepEqual(afterMatch.rows, beforeMatch.rows);
    assert.deepEqual(afterRouteEntries.rows, beforeRouteEntries.rows);
    assert.deepEqual(afterExecution.rows, beforeExecution.rows);
  });

  // §21.3 ROUTE_NOT_FOUND
  test("executeBasketRoute — ROUTE_NOT_FOUND when no route configured for basket", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2, skipRoute: true });
    await approveProposal(fix);

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 404);
    assert.equal(res.body.code, "ROUTE_NOT_FOUND");
  });

  test("executeBasketRoute — rejects a route requested through the wrong source stage", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);

    // The basket id belongs to the source stage, but the URL names the target
    // stage. The configured route must not be executable through that
    // mismatched stage context.
    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.targetStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 404, JSON.stringify(res.body));
    assert.equal(res.body.code, "ROUTE_NOT_FOUND");
  });

  // §21.4 SOURCE_NOT_APPROVED (proposal pending)
  test("executeBasketRoute — SOURCE_NOT_APPROVED when proposal is pending", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    // Generate but don't approve
    const genRes = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/basket-qualification-proposal`)
      .set(fix.organizerHeaders);
    assert.equal(genRes.status, 200);

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_SOURCE_NOT_APPROVED");
  });

  // §21.5 SOURCE_NOT_APPROVED (no proposal at all)
  test("executeBasketRoute — SOURCE_NOT_APPROVED when no proposal exists", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_SOURCE_NOT_APPROVED");
  });

  test("executeBasketRoute — basket-authoritative source must be completed", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await database.db
      .update(database.tournamentsTable)
      .set({ basketFlowAuthorityVersion: 1 })
      .where(eq(database.tournamentsTable.id, fix.tournamentId));
    await database.db
      .update(database.tournamentStagesTable)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(database.tournamentStagesTable.id, fix.sourceStageId));
    await approveProposal(fix);

    // Simulate a stale/legacy approved output becoming routable while the
    // source stage is live again. The route must reject that state.
    await database.db
      .update(database.tournamentStagesTable)
      .set({ status: "active", completedAt: null })
      .where(eq(database.tournamentStagesTable.id, fix.sourceStageId));
    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409, JSON.stringify(res.body));
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_SOURCE_STAGE_NOT_COMPLETED");
  });

  // §21.6 OUTPUT_INCOMPLETE (qualifierCount mismatch)
  test("executeBasketRoute — OUTPUT_INCOMPLETE when output row count ≠ qualifierCount", async () => {
    // Build with qualifierCount=2 but corrupt the basket qualifierCount to 3 after approval
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);

    // Change qualifierCount so the check triggers
    await database.db
      .update(database.stageBasketsTable)
      .set({ qualifierCount: 3 })
      .where(eq(database.stageBasketsTable.id, fix.outputBasketId));

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_SOURCE_OUTPUT_INCOMPLETE");
  });

  // §21.7 TARGET_STAGE_ALREADY_STARTED (active)
  test("executeBasketRoute — TARGET_STAGE_ALREADY_STARTED when target is active", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 1 });
    await approveProposal(fix);

    // To make target active: first complete source (lifecycle requires completedAt),
    // then set target to active (one_active_per_tournament constraint).
    const { sql: sqlFn } = await import("drizzle-orm");
    await database.db.execute(
      sqlFn`UPDATE tournament_stages
            SET status = 'completed', completed_at = NOW()
            WHERE id = ${fix.sourceStageId}`,
    );
    await database.db
      .update(database.tournamentStagesTable)
      .set({ status: "active" })
      .where(eq(database.tournamentStagesTable.id, fix.targetStageId));

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_TARGET_STAGE_ALREADY_STARTED");
  });

  // §21.8 TARGET_STAGE_ALREADY_STARTED (completed)
  test("executeBasketRoute — TARGET_STAGE_ALREADY_STARTED when target is completed", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 1 });
    await approveProposal(fix);

    // status='completed' requires completedAt (lifecycle_timestamps constraint)
    const { sql: sqlFn } = await import("drizzle-orm");
    await database.db.execute(
      sqlFn`UPDATE tournament_stages
            SET status = 'completed', completed_at = NOW()
            WHERE id = ${fix.targetStageId}`,
    );

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_TARGET_STAGE_ALREADY_STARTED");
  });

  // §21.9 PARTICIPANT_CONFLICT (direct assignment)
  test("executeBasketRoute — PARTICIPANT_CONFLICT when routed player is already directly assigned", async () => {
    const fix = await buildRouteFixture({
      qualifierCount: 2,
      addConflictingDirectParticipant: true,
    });
    await approveProposal(fix);

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_PARTICIPANT_CONFLICT");
    // conflicting player ids are reported
    assert.ok(
      Array.isArray(res.body.details?.conflictingPlayerIds) &&
        res.body.details.conflictingPlayerIds.length > 0,
      "should report conflicting player ids",
    );
  });

  // §21.10 PARTICIPANT_CONFLICT (prior route)
  test("executeBasketRoute — PARTICIPANT_CONFLICT when player already arrived via another route", async () => {
    // Strategy — avoids multi-stage trigger complexity entirely:
    //   1. buildRouteFixture(qualifierCount=2) → S1 (Swiss) → S2 (terminal SE)
    //      out1 basket, route1: out1 → targetInput
    //   2. approveProposal → pa, pc land in stageBasketsOutputPlayers for out1
    //   3. Add a second output basket (out2) on S1 and route2: out2 → targetInput
    //      (out2 has NO output players — it's just there so route2 can exist)
    //   4. Execute route1 via API → pa, pc arrive in stageBasketRouteEntriesTable for target
    //   5. Directly insert a dummy execution for route2 + an entry placing pa in target
    //      — using pa's existing out1 outputPlayer row id as sourceOutputPlayerId (valid FK)
    //   6. Execute route1 again... no, instead: attempt to execute route2 via API.
    //
    // Wait — after step 4 the idempotency check for route1 would return 200. For route2 we need
    // the OUTPUT_INCOMPLETE guard to pass first (out2 qualifierCount=1, output rows=1).
    //
    // Simpler: skip the API call for route2 entirely. Instead, validate that the SERVICE
    // detects the conflict by testing through the ROUTE1 execute endpoint a second time
    // after manually inserting a "fake prior" entry for pa in the entries table via a ghost exec.
    //
    // Approach (final):
    //   a. Create fixture → approve → create ghost route (ghost-out, ghost-route).
    //   b. Insert ghost execution for ghost-route + one ghost entry: pa → target.
    //   c. Now execute route1 (the real route) → PARTICIPANT_CONFLICT (pa already in target).
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);

    // 1. Add a ghost output basket and ghost route on the source stage
    const ghostSuffix = randomUUID().slice(0, 8);
    const ghostOutId = `ghost-out-${ghostSuffix}`;
    const ghostRouteId = `ghost-route-${ghostSuffix}`;
    await database.db.insert(database.stageBasketsTable).values({
      tournamentId: fix.tournamentId,
      stageId: fix.sourceStageId,
      id: ghostOutId,
      basketType: "output",
      ordinal: 2,
      displayOrder: 2,
      qualifierCount: 1,
    });
    await database.db.insert(database.stageBasketRoutesTable).values({
      id: ghostRouteId,
      tournamentId: fix.tournamentId,
      sourceStageId: fix.sourceStageId,
      sourceBasketId: ghostOutId,
      targetStageId: fix.targetStageId,
      targetBasketId: fix.targetInputBasketId,
    });

    // 2. Find pa's output player row in out1 (created by approveProposal)
    //    We'll reuse its id as sourceOutputPlayerId in the ghost entry.
    const outputPlayers = await database.db
      .select()
      .from(database.stageBasketsOutputPlayersTable)
      .where(
        and(
          eq(database.stageBasketsOutputPlayersTable.tournamentId, fix.tournamentId),
          eq(database.stageBasketsOutputPlayersTable.stageId, fix.sourceStageId),
          eq(database.stageBasketsOutputPlayersTable.basketId, fix.outputBasketId),
        ),
      );
    const paOutputPlayer = outputPlayers.find((r) => r.playerId === fix.playerIds[0]);
    assert.ok(paOutputPlayer, "pa's output player row must exist after proposal approval");

    // 3. Fetch the approved proposal for revision
    const [approvedProposal] = await database.db
      .select()
      .from(database.qualificationProposalsTable)
      .where(
        and(
          eq(database.qualificationProposalsTable.tournamentId, fix.tournamentId),
          eq(database.qualificationProposalsTable.stageId, fix.sourceStageId),
        ),
      );

    // 4. Insert a ghost execution for ghost-route (simulates a prior route that already ran)
    const [ghostExec] = await database.db
      .insert(database.stageBasketRouteExecutionsTable)
      .values({
        tournamentId: fix.tournamentId,
        routeId: ghostRouteId,
        sourceStageId: fix.sourceStageId,
        sourceBasketId: ghostOutId,
        targetStageId: fix.targetStageId,
        targetBasketId: fix.targetInputBasketId,
        sourceProposalId: approvedProposal.id,
        sourceProposalRevision: approvedProposal.revision,
        actorType: "organizer",
        actorNick: "test-ghost",
      } as {
        tournamentId: number;
        routeId: string;
        sourceStageId: number;
        sourceBasketId: string;
        targetStageId: number;
        targetBasketId: string;
        sourceProposalId: number;
        sourceProposalRevision: number;
        actorType: string;
        actorNick: string;
      })
      .returning();

    // 5. Insert a ghost entry: pa has already arrived in the target via the ghost route
    await database.db
      .insert(database.stageBasketRouteEntriesTable)
      .values({
        executionId: ghostExec.id,
        tournamentId: fix.tournamentId,
        routeId: ghostRouteId,
        sourceStageId: fix.sourceStageId,
        sourceBasketId: ghostOutId,
        sourceOutputPlayerId: paOutputPlayer.id,  // valid FK — pa's real out1 row
        targetStageId: fix.targetStageId,
        targetBasketId: fix.targetInputBasketId,
        playerId: fix.playerIds[0],               // pa is now "already in" the target
        sourceFinalRank: 1,
      } as {
        executionId: number;
        tournamentId: number;
        routeId: string;
        sourceStageId: number;
        sourceBasketId: string;
        sourceOutputPlayerId: number;
        targetStageId: number;
        targetBasketId: string;
        playerId: number;
        sourceFinalRank: number;
      });

    // 6. Execute route1 (the real route) — pa is already in the target → PARTICIPANT_CONFLICT
    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(res.status, 409, JSON.stringify(res.body));
    assert.equal(res.body.code, "STAGE_BASKET_ROUTE_PARTICIPANT_CONFLICT");
    assert.ok(
      Array.isArray(res.body.details?.conflictingPlayerIds) &&
        res.body.details.conflictingPlayerIds.includes(fix.playerIds[0]),
      "should report pa as a conflicting player id",
    );
  });

  // §21.11 LEGACY_NOT_SUPPORTED
  test("executeBasketRoute — LEGACY_NOT_SUPPORTED when no baskets defined", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2, skipBaskets: true });

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    // The source basket doesn't exist → LEGACY_NOT_SUPPORTED (basket not found)
    assert.ok(
      res.status === 409 || res.status === 404,
      `Expected 404 or 409, got ${res.status}`,
    );
    const code: string = res.body.code;
    assert.ok(
      code === "STAGE_BASKET_ROUTE_LEGACY_NOT_SUPPORTED" || code === "ROUTE_NOT_FOUND" || code === "STAGE_NOT_FOUND",
      `Unexpected code: ${code}`,
    );
  });

  // §21.12 getBasketRouteStatus before approval
  test("getBasketRouteStatus — returns route info with sourceOutputApproved=false before approval", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });

    const res = await request(app)
      .get(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route`)
      .set(fix.organizerHeaders);

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.routeId, fix.routeId);
    assert.equal(res.body.sourceOutputApproved, false);
    assert.equal(res.body.materialized, false);
    assert.equal(res.body.routedPlayerCount, 0);
    assert.equal(res.body.execution, null);
  });

  // §21.13 getBasketRouteStatus after execute
  test("getBasketRouteStatus — returns materialized=true after route execute", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);
    await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);

    const res = await request(app)
      .get(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route`)
      .set(fix.organizerHeaders);

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.sourceOutputApproved, true);
    assert.equal(res.body.materialized, true);
    assert.equal(res.body.routedPlayerCount, 2);
    assert.ok(res.body.execution != null);
    assert.equal(res.body.execution.routedPlayerCount, 2);
  });

  // §21.14 getBasketInputArrivals
  test("getBasketInputArrivals — aggregates direct + routed players correctly", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);
    await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);

    const res = await request(app)
      .get(`/api/tournaments/${fix.tournamentId}/stages/${fix.targetStageId}/basket-input-arrivals`)
      .set(fix.organizerHeaders);

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.targetStageId, fix.targetStageId);
    assert.equal(res.body.totalDirectCount, 0);
    assert.equal(res.body.totalRoutedCount, 2);
    assert.equal(res.body.totalCount, 2);
    assert.equal(res.body.baskets.length, 1);
    const basket = res.body.baskets[0];
    assert.equal(basket.basketId, fix.targetInputBasketId);
    assert.equal(basket.routedCount, 2);
    assert.equal(basket.directCount, 0);
    assert.ok(Array.isArray(basket.routedArrivals) && basket.routedArrivals.length === 2);
    for (const arrival of basket.routedArrivals) {
      assert.ok(arrival.playerId > 0);
      assert.ok(arrival.sourceFinalRank >= 1);
      assert.ok(arrival.arrivedAt != null);
      assert.equal(arrival.sourceBasketId, fix.outputBasketId);
    }
  });

  // §21.15 Anonymous cannot execute
  test("executeBasketRoute — 403 without organizer token", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    await approveProposal(fix);

    const res = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`);
    assert.equal(res.status, 403);
  });

  // §22 Backup round-trip
  test("Backup V3 round-trip: executed route survives export → import → reload", async () => {
    const fix = await buildRouteFixture({ qualifierCount: 2 });

    // NOTE: Do NOT reset qualificationMode/advancingCount here — the trigger on tournament_stages
    // fires and blocks changes on Swiss active stages with participants.
    // The fixture already has TWO stages (source + target) which is a valid multi-stage
    // configuration for the backup validator. The source stage has qualificationMode='top_n'
    // which is acceptable for a non-terminal stage.

    await approveProposal(fix);

    const execRes = await request(app)
      .post(`/api/tournaments/${fix.tournamentId}/stages/${fix.sourceStageId}/baskets/${fix.outputBasketId}/route/execute`)
      .set(fix.organizerHeaders);
    assert.equal(execRes.status, 200, JSON.stringify(execRes.body));
    const origExecution = execRes.body as {
      executionId: number;
      routeId: string;
      routedPlayerCount: number;
    };

    // Export
    const exportRes = await request(app)
      .get(`/api/tournaments/${fix.tournamentId}/export`)
      .set(fix.organizerHeaders);
    assert.equal(exportRes.status, 200);
    const backup = exportRes.body as {
      tournament: { basketFlowAuthorityVersion?: 1 };
      routeExecutions?: {
        routeId: string;
        sourceBasketId: string;
        targetBasketId: string;
        sourceProposalRevision: number;
        entries: { playerBackupId: number; sourceFinalRank: number }[];
      }[];
    };
    assert.equal(
      backup.tournament.basketFlowAuthorityVersion,
      undefined,
      "stored Phase 3 basket graphs must export without basket authority",
    );
    assert.ok(
      Array.isArray(backup.routeExecutions) && backup.routeExecutions.length === 1,
      "backup must include routeExecutions",
    );
    const backupExec = backup.routeExecutions![0];
    assert.equal(backupExec.routeId, origExecution.routeId);
    assert.equal(backupExec.entries.length, 2);

    // Import to a new tournament
    const importRes = await request(app)
      .post("/api/tournaments/import")
      .send({ backup, organizerPassword: "RestoredP3Pw1!" });
    assert.ok(
      importRes.status >= 200 && importRes.status < 300,
      `import failed ${importRes.status}: ${JSON.stringify(importRes.body)}`,
    );
    const newTournamentId = importRes.body.tournament.id as number;
    const newOrganizerToken = importRes.body.organizerToken as string;
    const [restoredTournament] = await database.db
      .select({
        basketFlowAuthorityVersion:
          database.tournamentsTable.basketFlowAuthorityVersion,
      })
      .from(database.tournamentsTable)
      .where(eq(database.tournamentsTable.id, newTournamentId));
    assert.equal(
      restoredTournament.basketFlowAuthorityVersion,
      0,
      "old Backup V3 documents must restore in compatibility mode",
    );
    const restoredConfiguration = await request(app).get(
      `/api/tournaments/${newTournamentId}/stage-baskets`,
    );
    assert.equal(restoredConfiguration.status, 200);
    assert.equal(restoredConfiguration.body.legacyDefaulted, false);
    assert.equal(restoredConfiguration.body.flowAuthority, "legacy");

    // Find restored stage by position 1 (source)
    const stages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eq(database.tournamentStagesTable.tournamentId, newTournamentId));
    const restoredSourceStage = stages.find((s) => s.position === 1);
    const restoredTargetStage = stages.find((s) => s.position === 2);
    assert.ok(restoredSourceStage, "restored source stage must exist");
    assert.ok(restoredTargetStage, "restored target stage must exist");

    // Verify route status: should be materialized on restored tournament
    const restoredBaskets = await database.db
      .select()
      .from(database.stageBasketsTable)
      .where(
        and(
          eq(database.stageBasketsTable.tournamentId, newTournamentId),
          eq(database.stageBasketsTable.stageId, restoredSourceStage.id),
          eq(database.stageBasketsTable.basketType, "output"),
        ),
      );
    assert.ok(restoredBaskets.length === 1, "restored output basket must exist");
    const restoredOutputBasketId = restoredBaskets[0].id;

    const statusRes = await request(app)
      .get(`/api/tournaments/${newTournamentId}/stages/${restoredSourceStage.id}/baskets/${restoredOutputBasketId}/route`)
      .set({ "x-organizer-token": newOrganizerToken });
    assert.equal(statusRes.status, 200, JSON.stringify(statusRes.body));
    assert.equal(statusRes.body.materialized, true, "route must be materialized after restore");
    assert.equal(statusRes.body.routedPlayerCount, origExecution.routedPlayerCount);
    assert.equal(statusRes.body.execution.entries.length, 2);

    // Verify arrivals on target
    const arrivalsRes = await request(app)
      .get(`/api/tournaments/${newTournamentId}/stages/${restoredTargetStage.id}/basket-input-arrivals`)
      .set({ "x-organizer-token": newOrganizerToken });
    assert.equal(arrivalsRes.status, 200, JSON.stringify(arrivalsRes.body));
    assert.equal(arrivalsRes.body.totalRoutedCount, 2, "2 players must arrive via route after restore");
    assert.equal(arrivalsRes.body.totalDirectCount, 0);

    // Second execute on restored tournament must be idempotent
    const exec2 = await request(app)
      .post(`/api/tournaments/${newTournamentId}/stages/${restoredSourceStage.id}/baskets/${restoredOutputBasketId}/route/execute`)
      .set({ "x-organizer-token": newOrganizerToken });
    assert.equal(exec2.status, 200, `idempotent re-execute: ${JSON.stringify(exec2.body)}`);
    assert.equal(exec2.body.routedPlayerCount, 2);
  });

  // WEB-005 T060-B3A / test-first: the writer commits strictly between
  // exporter root read and the remaining table reads, on a second pg client.
  // The export must be fully pre-commit (not a hybrid).
  test("Backup V3 export uses one repeatable-read snapshot across root, stage and match", async () => {
    const { exportBackupV3 } = await import("../src/application/backups/backup-v3");
    const fix = await buildRouteFixture({ qualifierCount: 2 });
    const baseline = await exportBackupV3(fix.tournamentId);
    assert.ok(baseline);
    const sourceMatch = baseline.matches.find(m => m.stageBackupId === fix.sourceStageId);
    const targetStage = baseline.stages.find(s => s.backupId === fix.targetStageId);
    assert.ok(sourceMatch);
    assert.ok(targetStage);

    const suffix = randomUUID().slice(0, 8);
    const updatedTournamentName = "B3A-root-" + suffix;
    const updatedStageName = "B3A-stage-" + suffix;
    const updatedMatchNote = "B3A-match-" + suffix;
    let barrierCount = 0;

    const during = await exportBackupV3(fix.tournamentId, {
      afterTournamentRead: async () => {
        barrierCount++;
        // The exporter has already selected the root. This separately
        // committed transaction updates three tables before export proceeds.
        await database.db.transaction(async tx => {
          await tx.update(database.tournamentsTable)
            .set({ name: updatedTournamentName })
            .where(eq(database.tournamentsTable.id, fix.tournamentId));
          await tx.update(database.tournamentStagesTable)
            .set({ name: updatedStageName })
            .where(eq(database.tournamentStagesTable.id, fix.targetStageId));
          await tx.update(database.matchesTable)
            .set({ note: updatedMatchNote })
            .where(eq(database.matchesTable.id, sourceMatch.backupId));
        });
      },
    });
    assert.equal(barrierCount, 1, "writer committed exactly once during export");
    assert.ok(during);

    // The root was read before the writer committed; a valid REPEATABLE READ
    // export must also contain the stage and match from that same old state.
    assert.equal(during.tournament.name, baseline.tournament.name);
    assert.equal(
      during.stages.find(s => s.backupId === fix.targetStageId)?.name,
      targetStage.name,
      "stage name must not come from a later snapshot",
    );
    assert.equal(
      during.matches.find(m => m.backupId === sourceMatch.backupId)?.note,
      sourceMatch.note,
      "match note must not come from a later snapshot",
    );

    const after = await exportBackupV3(fix.tournamentId);
    assert.ok(after);
    assert.equal(after.tournament.name, updatedTournamentName);
    assert.equal(after.stages.find(s => s.backupId === fix.targetStageId)?.name, updatedStageName);
    assert.equal(after.matches.find(m => m.backupId === sourceMatch.backupId)?.note, updatedMatchNote);
  });

});
