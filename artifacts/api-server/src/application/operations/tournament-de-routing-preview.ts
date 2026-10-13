/** Read-only application adapter for the already deployed DE routing-v2 engine. */
import { and, eq } from "drizzle-orm";
import { db, matchesTable, tournamentRoutingExecutionsTable, tournamentStagesTable } from "@workspace/db";
import { loadCompiledRoutingPlanV2 } from "../routing/routing-plan-persistence";
import { RoutingPlanPersistenceError } from "../routing/routing-plan-errors";
import {
  correctRoutingMatchResultV2, evaluateRoutingExecutionV2, RoutingExecutionErrorV2,
  type RoutingExecutionSnapshotV2,
} from "../../domain/tournament/v2";
import { deriveDoubleEliminationRoutingImpact, type DoubleEliminationCorrectionImpact } from "./tournament-de-routing-impact";
import { stageMatchVersionVector } from "./tournament-preview-coherence";
import type { CorrectionPreview } from "./tournament-result-correction-preflight";

const unavailable = (reasonCode: string, message: string): DoubleEliminationCorrectionImpact =>
  ({ status: "unavailable", reasonCode, message });

export async function getDoubleEliminationCorrectionImpact(input: {
  tournamentId: number;
  stage: typeof tournamentStagesTable.$inferSelect;
  match: typeof matchesTable.$inferSelect;
  stageMatches: readonly (typeof matchesTable.$inferSelect)[];
  preflight: CorrectionPreview;
}): Promise<DoubleEliminationCorrectionImpact> {
  const { stage, match, preflight } = input;
  if (stage.format !== "double_elimination")
    return unavailable("NOT_DOUBLE_ELIMINATION", "Nie jest to etap Double Elimination.");
  if (!match.routingMatchKey || preflight.proposedResult.winnerId == null || match.winnerId == null)
    return unavailable("MATCH_NOT_ROUTED", "Mecz nie ma kompletnego przypisania do routingu DE.");
  if (stageMatchVersionVector(input.stageMatches, stage.id) !==
      stageMatchVersionVector(input.stageMatches.filter(m => m.id !== match.id).concat([match]), stage.id))
    return unavailable("SOURCE_SNAPSHOT_CHANGED", "Odczyty meczów różnią się. Odśwież podgląd.");

  let loaded: Awaited<ReturnType<typeof loadCompiledRoutingPlanV2>>;
  try { loaded = await loadCompiledRoutingPlanV2({ tournamentId: input.tournamentId }); }
  catch (error) {
    if (error instanceof RoutingPlanPersistenceError)
      return unavailable("ROUTING_PLAN_UNAVAILABLE", "Nie można potwierdzić bieżącego zapisanego planu DE.");
    throw error;
  }
  const [execution] = await db.select().from(tournamentRoutingExecutionsTable)
    .where(and(eq(tournamentRoutingExecutionsTable.planId, loaded.planId),
      eq(tournamentRoutingExecutionsTable.stageKey, stage.stageKey))).limit(1);
  if (!execution) return unavailable("DE_EXECUTION_MISSING", "Brak zapisanego stanu wykonania drabinki DE.");
  let result: DoubleEliminationCorrectionImpact;
  try {
    const snapshot = execution.state as RoutingExecutionSnapshotV2;
    const current = evaluateRoutingExecutionV2(loaded.plan, snapshot);
    const hypothetical = correctRoutingMatchResultV2(loaded.plan, current.snapshot,
      match.routingMatchKey, String(preflight.proposedResult.winnerId));
    result = deriveDoubleEliminationRoutingImpact({
      stageId: stage.id, stageKey: stage.stageKey,
      matchKey: match.routingMatchKey, matchId: match.id, matchRevision: match.revision,
      actualWinnerId: match.winnerId, preflight, plan: loaded.plan,
      planRevision: loaded.revision, executionRevision: execution.revision,
      canonicalMatches: input.stageMatches, current, hypothetical,
    });
  } catch (error) {
    if (error instanceof RoutingExecutionErrorV2)
      return unavailable("ROUTING_SIMULATION_REJECTED", "Silnik DE odrzucił hipotetyczną korektę. Konieczna kontrola stanu drabinki.");
    throw error;
  }
  // Independent second read: detects ordinary concurrent writes, but does NOT
  // promise serializable consistency or authorize a later mutation.
  const [latestExecution, latestStageMatches] = await Promise.all([
    db.select({ revision: tournamentRoutingExecutionsTable.revision })
      .from(tournamentRoutingExecutionsTable)
      .where(and(eq(tournamentRoutingExecutionsTable.planId, execution.planId),
        eq(tournamentRoutingExecutionsTable.stageKey, execution.stageKey))).limit(1),
    db.select().from(matchesTable).where(eq(matchesTable.stageId, stage.id)),
  ]);
  if (latestExecution[0]?.revision !== execution.revision ||
      stageMatchVersionVector(latestStageMatches, stage.id) !== stageMatchVersionVector(input.stageMatches, stage.id)) {
    return unavailable("CONCURRENT_STATE_CHANGE", "W trakcie analizy zmienił się mecz lub stan routingu. Odśwież podgląd.");
  }
  return result;
}
