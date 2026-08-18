/**
 * Integration tests for the legacy Double Elimination routing-plan
 * auto-generation path (ensureLegacyDeRoutingPlanExists).
 *
 * These tests simulate tournaments that were created before the routing-plan
 * requirement was introduced: they bypass the stagePlan wizard and insert
 * tournament + stage rows directly into the DB so no routing plan is created
 * up-front.
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

// --------------------------------------------------------------------------
// Module references (resolved lazily after env vars are set)
// --------------------------------------------------------------------------
type DbModule = typeof import("@workspace/db");

let app: Express;
let db: DbModule;
let config: TestDatabaseConfig;
let signVersionedOrganizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let ensureLegacyDeRoutingPlanExists: typeof import("../src/application/stages/legacy-de-routing-plan").ensureLegacyDeRoutingPlanExists;
let compileLegacyDeCanonicalPlan: typeof import("../src/application/stages/legacy-de-routing-plan").compileLegacyDeCanonicalPlan;
let getStageStartReadiness: typeof import("../src/application/stages/stage-start-readiness").getStageStartReadiness;

const ORGANIZER_PASSWORD_HASH = "legacy-de-integration-test-hash";
const SESSION_SECRET = `legacy-de-routing-${randomUUID()}`;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  db = await import("@workspace/db");
  await resetTestSchema(db.pool as unknown as TestPool, config.schema);
  signVersionedOrganizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
  ({ ensureLegacyDeRoutingPlanExists, compileLegacyDeCanonicalPlan } = await import(
    "../src/application/stages/legacy-de-routing-plan"
  ));
  ({ getStageStartReadiness } = await import(
    "../src/application/stages/stage-start-readiness"
  ));
});

after(async () => {
  await dropTestSchema(db.pool as unknown as TestPool, config.schema);
  await db.pool.end();
});

// --------------------------------------------------------------------------
// Helper: create a legacy DE tournament (no routing plan in DB)
// --------------------------------------------------------------------------
interface LegacyDeTournament {
  tournamentId: number;
  stageId: number;
  stageKey: string;
  organizerToken: string;
}

async function createLegacyDeTournament(
  participantCount: number,
  opts: { seedingPolicy?: "standard_bracket" | "random_bracket" } = {},
): Promise<LegacyDeTournament> {
  const suffix = randomUUID();
  const seedingPolicy = opts.seedingPolicy ?? "standard_bracket";

  // Insert tournament directly — no stagePlan, so no routing plan row
  const [tournament] = await db.db
    .insert(db.tournamentsTable)
    .values({
      name: `Legacy DE ${participantCount}p ${suffix}`,
      format: "single_elimination",
      status: "draft",
      visibility: "public_online",
      organizerPasswordHash: ORGANIZER_PASSWORD_HASH,
      defaultBestOf: 1,
      basketFlowAuthorityVersion: 0,
    })
    .returning();

  // Find the auto-created first stage (position 1)
  const [firstStage] = await db.db
    .select()
    .from(db.tournamentStagesTable)
    .where(eq(db.tournamentStagesTable.tournamentId, tournament.id));

  // Convert it to a DE stage
  const stageKey = `de-stage-${suffix}`;
  const [deStage] = await db.db
    .update(db.tournamentStagesTable)
    .set({
      format: "double_elimination",
      stageKey,
      name: `Double Elimination ${participantCount}p`,
      participantCount,
      rankingPolicy: "elimination_bracket_v1",
      qualificationMode: "none",
      seedingPolicy,
      entrySeedingPolicy: "preserve",
      randomRevealOrder: "instant",
    })
    .where(eq(db.tournamentStagesTable.id, firstStage.id))
    .returning();

  // Add players directly
  await db.db.insert(db.playersTable).values(
    Array.from({ length: participantCount }, (_, i) => ({
      tournamentId: tournament.id,
      name: `Player ${i + 1} ${suffix}`,
      seed: i + 1,
    })),
  );

  const organizerToken = signVersionedOrganizerToken(
    tournament.id,
    ORGANIZER_PASSWORD_HASH,
  );

  return {
    tournamentId: tournament.id,
    stageId: deStage.id,
    stageKey: deStage.stageKey,
    organizerToken,
  };
}

async function routingPlanCount(tournamentId: number): Promise<number> {
  const rows = await db.pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM tournament_routing_plans WHERE tournament_id = $1",
    [tournamentId],
  );
  return Number(rows.rows[0]?.count ?? 0);
}

// --------------------------------------------------------------------------
// 1. Legacy DE 32p — start PASS, plan auto-created
// --------------------------------------------------------------------------
describe("legacy DE 32-player without routing plan", () => {
  test("start succeeds and creates exactly one routing plan", async () => {
    const { tournamentId, stageId, stageKey, organizerToken } =
      await createLegacyDeTournament(32);

    // Before start: no routing plan
    assert.equal(await routingPlanCount(tournamentId), 0);

    const response = await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set({ "x-organizer-token": organizerToken })
      .expect(200);

    assert.ok(response.body.id, "tournament id returned");

    // After start: exactly one plan created
    assert.equal(await routingPlanCount(tournamentId), 1);

    // Routing execution row created for the stage
    const execRows = await db.pool.query<{ stage_key: string }>(
      "SELECT stage_key FROM tournament_routing_executions WHERE stage_key = $1",
      [stageKey],
    );
    assert.equal(execRows.rowCount, 1);

    // DE state accessible
    const deState = await request(app)
      .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
      .expect(200);

    assert.equal(deState.body.participants.length, 32);
    assert.ok(
      deState.body.matches.some(
        (m: { bracket: string; status: string }) =>
          m.bracket === "upper" && m.status === "ready",
      ),
      "at least one upper-bracket match should be ready",
    );
  });
});

// --------------------------------------------------------------------------
// 2. Legacy DE 24p + BYE — start PASS
// --------------------------------------------------------------------------
describe("legacy DE 24-player (with BYEs) without routing plan", () => {
  test("start succeeds and bracket has correct participant count", async () => {
    const { tournamentId, stageId, organizerToken } =
      await createLegacyDeTournament(24);

    assert.equal(await routingPlanCount(tournamentId), 0);

    await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set({ "x-organizer-token": organizerToken })
      .expect(200);

    assert.equal(await routingPlanCount(tournamentId), 1);

    const deState = await request(app)
      .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
      .expect(200);

    assert.equal(deState.body.participants.length, 24);
    // Some matches should be ready (non-BYE first-round matches)
    assert.ok(
      deState.body.matches.some(
        (m: { status: string }) => m.status === "ready",
      ),
    );
  });
});

// --------------------------------------------------------------------------
// 3. Idempotency — repeated calls do not create duplicates
// --------------------------------------------------------------------------
describe("ensureLegacyDeRoutingPlanExists idempotency", () => {
  test("calling twice does not create duplicate plan rows", async () => {
    const { tournamentId } = await createLegacyDeTournament(8);

    assert.equal(await routingPlanCount(tournamentId), 0);

    // Call twice concurrently
    await Promise.all([
      ensureLegacyDeRoutingPlanExists(tournamentId),
      ensureLegacyDeRoutingPlanExists(tournamentId),
    ]);

    // Exactly one plan — no duplicates
    assert.equal(await routingPlanCount(tournamentId), 1);

    // Third call also safe
    await ensureLegacyDeRoutingPlanExists(tournamentId);
    assert.equal(await routingPlanCount(tournamentId), 1);
  });

  test("start after previous start attempt does not create a second plan", async () => {
    const { tournamentId, organizerToken } = await createLegacyDeTournament(4);

    // First start
    await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set({ "x-organizer-token": organizerToken })
      .expect(200);

    assert.equal(await routingPlanCount(tournamentId), 1);

    // Second start on the same tournament should fail (already active)
    // but must not create a second routing plan.
    // The actual status code may be 409 or 422 depending on the route handler.
    const secondStart = await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set({ "x-organizer-token": organizerToken });
    assert.ok(
      secondStart.status >= 400 && secondStart.status < 500,
      `expected a 4xx error, got ${secondStart.status}`,
    );

    assert.equal(await routingPlanCount(tournamentId), 1);
  });
});

// --------------------------------------------------------------------------
// 4. DE with existing plan — plan content unchanged after start
// --------------------------------------------------------------------------
describe("DE tournament created via new wizard (plan already present)", () => {
  test("start does not replace existing routing plan", async () => {
    // Create via API — creates a plan automatically
    const created = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Wizard DE ${randomUUID()}`,
        format: "single_elimination",
        defaultBestOf: 1,
        organizerPassword: "wizard-test-password",
        stagePlan: {
          initialParticipantCount: 4,
          stages: [
            {
              key: "de-final",
              position: 1,
              name: "Double Elimination",
              format: "double_elimination",
              participantCount: 4,
              bestOf: 1,
              entrySeedingMethod: "preserve",
              placementMethod: "standard",
            },
          ],
        },
      })
      .expect(201);

    const tournamentId = created.body.id as number;
    const organizerToken = created.body.organizerToken as string;

    // Add players
    for (let seed = 1; seed <= 4; seed += 1) {
      await request(app)
        .post(`/api/tournaments/${tournamentId}/players`)
        .set({ "x-organizer-token": organizerToken })
        .send({ name: `Player ${seed}`, seed })
        .expect(201);
    }

    // Read plan details before start
    const beforeRows = await db.pool.query<{
      id: number;
      revision: number;
      checksum: string;
    }>(
      "SELECT id, revision, checksum FROM tournament_routing_plans WHERE tournament_id = $1",
      [tournamentId],
    );
    assert.equal(beforeRows.rowCount, 1);
    const planBefore = beforeRows.rows[0];

    // Start
    await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set({ "x-organizer-token": organizerToken })
      .expect(200);

    // Plan must be identical
    const afterRows = await db.pool.query<{
      id: number;
      revision: number;
      checksum: string;
    }>(
      "SELECT id, revision, checksum FROM tournament_routing_plans WHERE tournament_id = $1",
      [tournamentId],
    );
    assert.equal(afterRows.rowCount, 1, "still exactly one plan after start");
    assert.equal(afterRows.rows[0].id, planBefore.id, "plan id unchanged");
    assert.equal(
      afterRows.rows[0].checksum,
      planBefore.checksum,
      "checksum unchanged",
    );
  });
});

// --------------------------------------------------------------------------
// 5. compileLegacyDeCanonicalPlan — unit checks on the compiled output
// --------------------------------------------------------------------------
describe("compileLegacyDeCanonicalPlan", () => {
  test("produces a valid plan for a standard 32-player stage", async () => {
    // We need a real DB stage row; fetch the one we created earlier via helper.
    const { tournamentId, stageId } = await createLegacyDeTournament(32);
    const [stage] = await db.db
      .select()
      .from(db.tournamentStagesTable)
      .where(eq(db.tournamentStagesTable.id, stageId));

    const plan = compileLegacyDeCanonicalPlan(stage);
    assert.ok(plan, "plan should compile successfully");
    // compiledPlanVersion is the numeric version tag inside the plan format (currently 1).
    assert.ok(typeof plan.compiledPlanVersion === "number", "compiledPlanVersion is a number");
    assert.ok(
      plan.stages.some((s) => s.formatId === "double_elimination"),
      "compiled plan must contain the DE stage",
    );
    assert.equal(plan.registrationBuckets.length, 1);
    assert.equal(plan.registrationBuckets[0].exactCapacity, 32);

    // Routing plan must not be saved by compileLegacyDeCanonicalPlan alone
    assert.equal(await routingPlanCount(tournamentId), 0);
  });

  test("produces a valid plan for a 24-player stage", async () => {
    const { stageId } = await createLegacyDeTournament(24);
    const [stage] = await db.db
      .select()
      .from(db.tournamentStagesTable)
      .where(eq(db.tournamentStagesTable.id, stageId));

    const plan = compileLegacyDeCanonicalPlan(stage);
    assert.ok(plan, "plan should compile for 24 players");
    assert.equal(plan.registrationBuckets[0].exactCapacity, 24);
  });
});

// --------------------------------------------------------------------------
// 6. Readiness check — no false READY leading to HTTP 500
// --------------------------------------------------------------------------
describe("getStageStartReadiness for DE", () => {
  test("legacy DE without plan reports READY (auto-generatable)", async () => {
    const { tournamentId, stageId } = await createLegacyDeTournament(8);

    // Seed participants so readiness can pass participant checks
    const stages = await db.db
      .select()
      .from(db.tournamentStagesTable)
      .where(eq(db.tournamentStagesTable.tournamentId, tournamentId));
    const stage = stages[0];
    assert.ok(stage);

    const readiness = await getStageStartReadiness({
      tournamentId,
      stageId,
    });

    assert.equal(readiness.ready, true, "legacy DE without plan must be READY");
    assert.equal(readiness.reasonCode, "READY");
    // The routing plan status should reflect no plan but auto-generatable
    assert.ok(readiness.basketValidation, "basket validation present");
  });

  test("readiness stays READY after plan is auto-created", async () => {
    const { tournamentId, stageId } = await createLegacyDeTournament(4);

    // Ensure plan is created
    await ensureLegacyDeRoutingPlanExists(tournamentId);
    assert.equal(await routingPlanCount(tournamentId), 1);

    const readiness = await getStageStartReadiness({ tournamentId, stageId });
    assert.equal(readiness.ready, true);
    assert.equal(readiness.reasonCode, "READY");
  });

  test("start produces a valid bracket after readiness check passes", async () => {
    const { tournamentId, stageId, organizerToken } =
      await createLegacyDeTournament(8);

    const readiness = await getStageStartReadiness({ tournamentId, stageId });
    assert.equal(readiness.ready, true);

    await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set({ "x-organizer-token": organizerToken })
      .expect(200);

    const deState = await request(app)
      .get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`)
      .expect(200);

    assert.equal(deState.body.participants.length, 8);
  });
});
