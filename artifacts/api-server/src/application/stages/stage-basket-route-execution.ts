/**
 * Phase 3 – Basket Route Execution application layer.
 *
 * Orchestrates DB access to implement:
 *   executeBasketRoute         — materialise a configured basket route
 *   getBasketRouteStatus       — read execution status for a route
 *   getTargetStageInputArrivals — read aggregated routed arrivals for a target stage
 *
 * Semantics:
 *   - Source of truth is stage_basket_output_players (approved proposal snapshot).
 *   - Route execution is atomic; partial materialisation is never written.
 *   - Idempotent: re-executing an already-materialised route returns the existing result.
 *   - Target stage must not be active or completed.
 *   - Conflict: a player may arrive in a target stage at most once (across all routes
 *     and direct assignments).
 *   - Legacy tournaments without explicit basket configuration are naturally excluded:
 *     no route exists → ROUTE_NOT_FOUND.
 */

import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  qualificationProposalsTable,
  stageBasketParticipantsTable,
  stageBasketRouteEntriesTable,
  stageBasketRouteExecutionsTable,
  stageBasketRoutesTable,
  stageBasketsOutputPlayersTable,
  stageBasketsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import type { TournamentMutationActor } from "../../access-policy";
import { revalidateTournamentMutationActor } from "../../access-policy";

// ─── Error types ─────────────────────────────────────────────────────────────

export type BasketRouteExecutionErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_NOT_FOUND"
  | "ROUTE_NOT_FOUND"
  | "STAGE_BASKET_ROUTE_SOURCE_NOT_APPROVED"
  | "STAGE_BASKET_ROUTE_SOURCE_OUTPUT_INCOMPLETE"
  | "STAGE_BASKET_ROUTE_TARGET_STAGE_ALREADY_STARTED"
  | "STAGE_BASKET_ROUTE_PARTICIPANT_CONFLICT"
  | "STAGE_BASKET_ROUTE_LEGACY_NOT_SUPPORTED";

export class BasketRouteExecutionError extends Error {
  constructor(
    public readonly code: BasketRouteExecutionErrorCode,
    public readonly details?: {
      conflictingPlayerIds?: number[];
      routeId?: string;
    },
  ) {
    super(code);
    this.name = "BasketRouteExecutionError";
  }
}

// ─── Return types ─────────────────────────────────────────────────────────────

export interface RouteExecutionResult {
  executionId: number;
  tournamentId: number;
  routeId: string;
  sourceStageId: number;
  sourceBasketId: string;
  targetStageId: number;
  targetBasketId: string;
  sourceProposalId: number;
  sourceProposalRevision: number;
  executedAt: Date;
  actorType: string;
  actorNick: string;
  routedPlayerCount: number;
  entries: Array<{
    playerId: number;
    sourceFinalRank: number;
    sourceBasketPosition: number | null;
    sourceOutputPlayerId: number;
  }>;
}

export interface RouteStatusResult {
  routeId: string;
  tournamentId: number;
  sourceStageId: number;
  sourceBasketId: string;
  targetStageId: number;
  targetBasketId: string;
  /** Whether the source output has been approved. */
  sourceOutputApproved: boolean;
  /** Whether this route has been materialised. */
  materialized: boolean;
  routedPlayerCount: number;
  execution: RouteExecutionResult | null;
}

export interface InputBasketArrival {
  basketId: string;
  /** Players directly assigned to this input basket (stage_basket_participants). */
  directPlayers: Array<{ playerId: number }>;
  /** Players that arrived via basket routes. */
  routedArrivals: Array<{
    playerId: number;
    sourceFinalRank: number;
    sourceBasketPosition: number | null;
    sourceStageId: number;
    sourceBasketId: string;
    routeId: string;
    sourceProposalId: number;
    executionId: number;
    arrivedAt: Date;
  }>;
  directCount: number;
  routedCount: number;
  totalCount: number;
}

export interface TargetStageInputArrivalsResult {
  targetStageId: number;
  baskets: InputBasketArrival[];
  totalDirectCount: number;
  totalRoutedCount: number;
  totalCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function actorNick(actor: TournamentMutationActor): string {
  return actor.type === "support" ? actor.nick : "organizer";
}

async function buildExecutionResult(
  execution: typeof stageBasketRouteExecutionsTable.$inferSelect,
  reader: Pick<typeof db, "select">,
): Promise<RouteExecutionResult> {
  const entries = await reader
    .select()
    .from(stageBasketRouteEntriesTable)
    .where(eq(stageBasketRouteEntriesTable.executionId, execution.id));
  return {
    executionId: execution.id,
    tournamentId: execution.tournamentId,
    routeId: execution.routeId,
    sourceStageId: execution.sourceStageId,
    sourceBasketId: execution.sourceBasketId,
    targetStageId: execution.targetStageId,
    targetBasketId: execution.targetBasketId,
    sourceProposalId: execution.sourceProposalId,
    sourceProposalRevision: execution.sourceProposalRevision,
    executedAt: execution.executedAt,
    actorType: execution.actorType,
    actorNick: execution.actorNick,
    routedPlayerCount: entries.length,
    entries: entries.map((e) => ({
      playerId: e.playerId,
      sourceFinalRank: e.sourceFinalRank,
      sourceBasketPosition: e.sourceBasketPosition,
      sourceOutputPlayerId: e.sourceOutputPlayerId,
    })),
  };
}

// ─── executeBasketRoute ───────────────────────────────────────────────────────

/**
 * Materialises a configured basket route: copies approved output players
 * from the source basket into route arrival records for the target basket.
 *
 * The operation is:
 *   - Atomic: all entries written in one transaction or none.
 *   - Idempotent: re-executing an already-materialised route returns
 *     the existing execution without creating duplicates.
 *   - Conflict-safe: a player already present in the target stage
 *     (via direct assignment or a prior route) blocks the entire operation.
 *
 * Preconditions (throws BasketRouteExecutionError on failure):
 *   - Tournament and source stage must exist.
 *   - A route must be configured for the given source basket.
 *   - The source stage must have an approved qualification proposal.
 *   - Materialised output rows must match the proposal's qualifierCount.
 *   - Target stage must not be active or completed.
 *   - No player arriving via this route may already be present in the target stage.
 */
export async function executeBasketRoute(
  tournamentId: number,
  sourceStageId: number,
  sourceBasketId: string,
  actor: TournamentMutationActor,
): Promise<RouteExecutionResult> {
  // ── 1. Pre-flight reads (outside transaction) ──────────────────────────────
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  if (!tournament) throw new BasketRouteExecutionError("TOURNAMENT_NOT_FOUND");

  const [sourceStage] = await db
    .select()
    .from(tournamentStagesTable)
    .where(
      and(
        eq(tournamentStagesTable.tournamentId, tournamentId),
        eq(tournamentStagesTable.id, sourceStageId),
      ),
    );
  if (!sourceStage) throw new BasketRouteExecutionError("STAGE_NOT_FOUND");

  // Load source basket — if none, this is a legacy tournament.
  const [sourceBasket] = await db
    .select()
    .from(stageBasketsTable)
    .where(
      and(
        eq(stageBasketsTable.tournamentId, tournamentId),
        eq(stageBasketsTable.id, sourceBasketId),
      ),
    );
  if (!sourceBasket)
    throw new BasketRouteExecutionError("STAGE_BASKET_ROUTE_LEGACY_NOT_SUPPORTED");

  // Load the configured route from this source basket.
  const [route] = await db
    .select()
    .from(stageBasketRoutesTable)
    .where(
      and(
        eq(stageBasketRoutesTable.tournamentId, tournamentId),
        eq(stageBasketRoutesTable.sourceBasketId, sourceBasketId),
      ),
    );
  if (!route) throw new BasketRouteExecutionError("ROUTE_NOT_FOUND");

  // ── 2. Transactional execution ─────────────────────────────────────────────
  return db.transaction(async (tx) => {
    // Re-validate actor under transaction.
    await revalidateTournamentMutationActor(tx, tournament, actor);

    // Lock the route row to prevent concurrent double execution.
    const [lockedRoute] = await tx
      .select()
      .from(stageBasketRoutesTable)
      .where(
        and(
          eq(stageBasketRoutesTable.tournamentId, tournamentId),
          eq(stageBasketRoutesTable.id, route.id),
        ),
      )
      .for("update");
    if (!lockedRoute) throw new BasketRouteExecutionError("ROUTE_NOT_FOUND");

    // Idempotency: if an execution already exists for this route, return it.
    const [existingExecution] = await tx
      .select()
      .from(stageBasketRouteExecutionsTable)
      .where(
        and(
          eq(stageBasketRouteExecutionsTable.tournamentId, tournamentId),
          eq(stageBasketRouteExecutionsTable.routeId, route.id),
        ),
      );
    if (existingExecution) {
      return buildExecutionResult(existingExecution, tx);
    }

    // ── 3. Source approval check ─────────────────────────────────────────────
    const [proposal] = await tx
      .select()
      .from(qualificationProposalsTable)
      .where(
        and(
          eq(qualificationProposalsTable.tournamentId, tournamentId),
          eq(qualificationProposalsTable.stageId, sourceStageId),
        ),
      );
    if (!proposal || proposal.status !== "approved") {
      throw new BasketRouteExecutionError(
        "STAGE_BASKET_ROUTE_SOURCE_NOT_APPROVED",
      );
    }

    // ── 4. Load source output rows for this basket ───────────────────────────
    const outputRows = await tx
      .select()
      .from(stageBasketsOutputPlayersTable)
      .where(
        and(
          eq(stageBasketsOutputPlayersTable.tournamentId, tournamentId),
          eq(stageBasketsOutputPlayersTable.stageId, sourceStageId),
          eq(stageBasketsOutputPlayersTable.basketId, sourceBasketId),
          eq(stageBasketsOutputPlayersTable.proposalId, proposal.id),
        ),
      );

    // Load source basket to get qualifierCount.
    const [sourceBsk] = await tx
      .select()
      .from(stageBasketsTable)
      .where(
        and(
          eq(stageBasketsTable.tournamentId, tournamentId),
          eq(stageBasketsTable.id, sourceBasketId),
        ),
      );

    const expectedCount = sourceBsk?.qualifierCount ?? 0;
    if (outputRows.length === 0 || outputRows.length !== expectedCount) {
      throw new BasketRouteExecutionError(
        "STAGE_BASKET_ROUTE_SOURCE_OUTPUT_INCOMPLETE",
      );
    }

    // ── 5. Target stage freeze check ─────────────────────────────────────────
    const [targetStage] = await tx
      .select()
      .from(tournamentStagesTable)
      .where(
        and(
          eq(tournamentStagesTable.tournamentId, tournamentId),
          eq(tournamentStagesTable.id, route.targetStageId),
        ),
      );
    if (targetStage && (targetStage.status === "active" || targetStage.status === "completed")) {
      throw new BasketRouteExecutionError(
        "STAGE_BASKET_ROUTE_TARGET_STAGE_ALREADY_STARTED",
      );
    }

    // ── 6. Conflict check ────────────────────────────────────────────────────
    const incomingPlayerIds = outputRows.map((r) => r.playerId);

    // Conflict with direct assignments (stage_basket_participants).
    const directConflicts = await tx
      .select({ playerId: stageBasketParticipantsTable.playerId })
      .from(stageBasketParticipantsTable)
      .where(
        and(
          eq(stageBasketParticipantsTable.tournamentId, tournamentId),
          eq(stageBasketParticipantsTable.stageId, route.targetStageId),
          inArray(stageBasketParticipantsTable.playerId, incomingPlayerIds),
        ),
      );

    // Conflict with existing routed arrivals (stage_basket_route_entries).
    const routedConflicts = await tx
      .select({ playerId: stageBasketRouteEntriesTable.playerId })
      .from(stageBasketRouteEntriesTable)
      .where(
        and(
          eq(stageBasketRouteEntriesTable.tournamentId, tournamentId),
          eq(stageBasketRouteEntriesTable.targetStageId, route.targetStageId),
          inArray(stageBasketRouteEntriesTable.playerId, incomingPlayerIds),
        ),
      );

    const conflictingPlayerIds = [
      ...directConflicts.map((r) => r.playerId),
      ...routedConflicts.map((r) => r.playerId),
    ];
    if (conflictingPlayerIds.length > 0) {
      throw new BasketRouteExecutionError(
        "STAGE_BASKET_ROUTE_PARTICIPANT_CONFLICT",
        { conflictingPlayerIds },
      );
    }

    // ── 7. Write execution ───────────────────────────────────────────────────
    const now = new Date();
    const [execution] = await tx
      .insert(stageBasketRouteExecutionsTable)
      .values({
        tournamentId,
        routeId: route.id,
        sourceStageId,
        sourceBasketId,
        targetStageId: route.targetStageId,
        targetBasketId: route.targetBasketId,
        sourceProposalId: proposal.id,
        sourceProposalRevision: proposal.revision,
        executedAt: now,
        actorType: actor.type,
        actorNick: actorNick(actor),
      })
      .returning();

    // ── 8. Write entries ─────────────────────────────────────────────────────
    if (outputRows.length > 0) {
      await tx.insert(stageBasketRouteEntriesTable).values(
        outputRows.map((row) => ({
          executionId: execution.id,
          tournamentId,
          routeId: route.id,
          sourceStageId,
          sourceBasketId,
          sourceOutputPlayerId: row.id,
          targetStageId: route.targetStageId,
          targetBasketId: route.targetBasketId,
          playerId: row.playerId,
          sourceFinalRank: row.finalRank,
          sourceBasketPosition: null as number | null,
          arrivedAt: now,
        })),
      );
    }

    return buildExecutionResult(execution, tx);
  });
}

// ─── getBasketRouteStatus ─────────────────────────────────────────────────────

/**
 * Returns the configured route and its execution state for a given source basket.
 * Includes whether the source output is approved and whether the route is materialised.
 */
export async function getBasketRouteStatus(
  tournamentId: number,
  sourceStageId: number,
  sourceBasketId: string,
): Promise<RouteStatusResult> {
  // Verify tournament exists.
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  if (!tournament) throw new BasketRouteExecutionError("TOURNAMENT_NOT_FOUND");

  // Verify stage exists.
  const [stage] = await db
    .select()
    .from(tournamentStagesTable)
    .where(
      and(
        eq(tournamentStagesTable.tournamentId, tournamentId),
        eq(tournamentStagesTable.id, sourceStageId),
      ),
    );
  if (!stage) throw new BasketRouteExecutionError("STAGE_NOT_FOUND");

  // Load route.
  const [route] = await db
    .select()
    .from(stageBasketRoutesTable)
    .where(
      and(
        eq(stageBasketRoutesTable.tournamentId, tournamentId),
        eq(stageBasketRoutesTable.sourceBasketId, sourceBasketId),
      ),
    );
  if (!route) throw new BasketRouteExecutionError("ROUTE_NOT_FOUND");

  // Check source approval.
  const [proposal] = await db
    .select()
    .from(qualificationProposalsTable)
    .where(
      and(
        eq(qualificationProposalsTable.tournamentId, tournamentId),
        eq(qualificationProposalsTable.stageId, sourceStageId),
      ),
    );
  const sourceOutputApproved = proposal?.status === "approved";

  // Load existing execution if any.
  const [execution] = await db
    .select()
    .from(stageBasketRouteExecutionsTable)
    .where(
      and(
        eq(stageBasketRouteExecutionsTable.tournamentId, tournamentId),
        eq(stageBasketRouteExecutionsTable.routeId, route.id),
      ),
    );

  let executionResult: RouteExecutionResult | null = null;
  if (execution) {
    executionResult = await buildExecutionResult(execution, db);
  }

  return {
    routeId: route.id,
    tournamentId,
    sourceStageId,
    sourceBasketId,
    targetStageId: route.targetStageId,
    targetBasketId: route.targetBasketId,
    sourceOutputApproved,
    materialized: execution != null,
    routedPlayerCount: executionResult?.routedPlayerCount ?? 0,
    execution: executionResult,
  };
}

// ─── getTargetStageInputArrivals ──────────────────────────────────────────────

/**
 * Returns aggregated input basket contents for a target stage:
 *   - Direct players (stage_basket_participants)
 *   - Routed arrivals (stage_basket_route_entries) with full provenance
 */
export async function getTargetStageInputArrivals(
  tournamentId: number,
  targetStageId: number,
): Promise<TargetStageInputArrivalsResult> {
  // Verify tournament and stage.
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  if (!tournament) throw new BasketRouteExecutionError("TOURNAMENT_NOT_FOUND");

  const [stage] = await db
    .select()
    .from(tournamentStagesTable)
    .where(
      and(
        eq(tournamentStagesTable.tournamentId, tournamentId),
        eq(tournamentStagesTable.id, targetStageId),
      ),
    );
  if (!stage) throw new BasketRouteExecutionError("STAGE_NOT_FOUND");

  // Load all input baskets for this stage.
  const inputBaskets = await db
    .select()
    .from(stageBasketsTable)
    .where(
      and(
        eq(stageBasketsTable.tournamentId, tournamentId),
        eq(stageBasketsTable.stageId, targetStageId),
        eq(stageBasketsTable.basketType, "input"),
      ),
    );

  if (inputBaskets.length === 0) {
    return {
      targetStageId,
      baskets: [],
      totalDirectCount: 0,
      totalRoutedCount: 0,
      totalCount: 0,
    };
  }

  const basketIds = inputBaskets.map((b) => b.id);

  // Load direct assignments.
  const directRows = await db
    .select()
    .from(stageBasketParticipantsTable)
    .where(
      and(
        eq(stageBasketParticipantsTable.tournamentId, tournamentId),
        eq(stageBasketParticipantsTable.stageId, targetStageId),
        inArray(stageBasketParticipantsTable.basketId, basketIds),
      ),
    );

  // Load routed arrivals for this target stage.
  const routedRows = await db
    .select()
    .from(stageBasketRouteEntriesTable)
    .where(
      and(
        eq(stageBasketRouteEntriesTable.tournamentId, tournamentId),
        eq(stageBasketRouteEntriesTable.targetStageId, targetStageId),
      ),
    );

  // Aggregate per basket.
  const baskets: InputBasketArrival[] = inputBaskets.map((basket) => {
    const direct = directRows
      .filter((r) => r.basketId === basket.id)
      .map((r) => ({ playerId: r.playerId }));
    const routed = routedRows
      .filter((r) => r.targetBasketId === basket.id)
      .map((r) => ({
        playerId: r.playerId,
        sourceFinalRank: r.sourceFinalRank,
        sourceBasketPosition: r.sourceBasketPosition,
        sourceStageId: r.sourceStageId,
        sourceBasketId: r.sourceBasketId,
        routeId: r.routeId,
        sourceProposalId: 0, // filled below
        executionId: r.executionId,
        arrivedAt: r.arrivedAt,
      }));
    return {
      basketId: basket.id,
      directPlayers: direct,
      routedArrivals: routed,
      directCount: direct.length,
      routedCount: routed.length,
      totalCount: direct.length + routed.length,
    };
  });

  // Enrich routed arrivals with sourceProposalId from the execution.
  const executionIds = [...new Set(routedRows.map((r) => r.executionId))];
  if (executionIds.length > 0) {
    const executions = await db
      .select()
      .from(stageBasketRouteExecutionsTable)
      .where(inArray(stageBasketRouteExecutionsTable.id, executionIds));
    const execById = new Map(executions.map((e) => [e.id, e]));
    for (const basket of baskets) {
      for (const arrival of basket.routedArrivals) {
        const exec = execById.get(arrival.executionId);
        if (exec) arrival.sourceProposalId = exec.sourceProposalId;
      }
    }
  }

  const totalDirectCount = baskets.reduce((s, b) => s + b.directCount, 0);
  const totalRoutedCount = baskets.reduce((s, b) => s + b.routedCount, 0);

  return {
    targetStageId,
    baskets,
    totalDirectCount,
    totalRoutedCount,
    totalCount: totalDirectCount + totalRoutedCount,
  };
}
