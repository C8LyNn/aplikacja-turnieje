/** Pack 08: protected, READ-ONLY preview. Never calls revertMatch/completeMatch. */
import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  actionLogTable, db, matchesTable, qualificationProposalsTable, resultHistoryTable,
  stageBasketRouteExecutionsTable, tournamentStagesTable,
} from "@workspace/db";
import { requireTournamentWrite } from "../access-policy";
import { getDoubleEliminationCorrectionImpact } from "../application/operations/tournament-de-routing-preview";
import { stageMatchVersionVector } from "../application/operations/tournament-preview-coherence";
import { deriveCorrectionRecoveryPlan } from "../application/operations/tournament-correction-recovery-plan";
import { deriveBoundedRevertEligibility } from "../application/operations/tournament-bounded-revert-eligibility";
import { getResultCorrectionStandingsComparison } from "../application/operations/tournament-correction-ranking-preview";
import { deriveEliminationBracketImpact } from "../application/operations/tournament-elimination-bracket-impact";
import {
  deriveResultCorrectionPreflight, type CorrectionMatch, type CorrectionStage,
} from "../application/operations/tournament-result-correction-preflight";

const router: IRouter = Router();
function positiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function matchesHistory(
  history: typeof resultHistoryTable.$inferSelect | undefined,
  match: typeof matchesTable.$inferSelect,
): boolean {
  if (!history || !history.completedAt || !match.completedAt) return false;
  return history.tournamentId === match.tournamentId
    && history.stageId === match.stageId
    && history.round === match.round
    && history.matchNumber === match.matchNumber
    && history.player1Id === match.player1Id
    && history.player2Id === match.player2Id
    && history.score1 === match.score1
    && history.score2 === match.score2
    && history.winnerId === match.winnerId
    && history.bestOf === match.bestOf
    && history.resultType === match.resultType
    && history.resultReason === match.resultReason
    && history.completedAt.getTime() === match.completedAt.getTime();
}
function isCompletionAction(action: typeof actionLogTable.$inferSelect, matchId: number): boolean {
  if (!action.undoPayload) return false;
  try {
    const payload = JSON.parse(action.undoPayload) as Record<string, unknown>;
    return payload.type === "revert_match" && payload.matchId === matchId;
  } catch { return false; }
}

router.post("/tournaments/:id/operations/result-correction-preview", async (req, res): Promise<void> => {
  const tournamentId = Number(req.params.id);
  const body: unknown = req.body;
  if (!positiveId(tournamentId) || !body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ error: "Nieprawidłowe parametry podglądu.", code: "INVALID_CORRECTION_PREVIEW" });
    return;
  }
  const data = body as Record<string, unknown>;
  if (!positiveId(data.matchId) || !Number.isSafeInteger(data.expectedRevision)
    || typeof data.proposedScore1 !== "number" || typeof data.proposedScore2 !== "number"
    || !Number.isSafeInteger(data.proposedScore1) || !Number.isSafeInteger(data.proposedScore2)) {
    res.status(400).json({ error: "Wymagane: matchId, expectedRevision, proposedScore1 i proposedScore2.", code: "INVALID_CORRECTION_PREVIEW" });
    return;
  }

  // This is a privileged operational read, not permission to mutate anything.
  const access = await requireTournamentWrite(req, res, tournamentId);
  if (!access) return;
  const [match] = await db.select().from(matchesTable).where(and(
    eq(matchesTable.id, data.matchId), eq(matchesTable.tournamentId, tournamentId),
  ));
  if (!match) {
    res.status(404).json({ error: "Mecz nie istnieje w tym turnieju.", code: "MATCH_NOT_FOUND" });
    return;
  }
  const [stages, stageMatches, approvals, routes, histories, actions] = await Promise.all([
    db.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId, tournamentId)),
    db.select().from(matchesTable).where(eq(matchesTable.stageId, match.stageId)),
    db.select({ id: qualificationProposalsTable.id }).from(qualificationProposalsTable)
      .where(and(eq(qualificationProposalsTable.tournamentId, tournamentId),
        eq(qualificationProposalsTable.stageId, match.stageId),
        eq(qualificationProposalsTable.status, "approved"))).limit(1),
    db.select({ id: stageBasketRouteExecutionsTable.id }).from(stageBasketRouteExecutionsTable)
      .where(and(eq(stageBasketRouteExecutionsTable.tournamentId, tournamentId),
        eq(stageBasketRouteExecutionsTable.sourceStageId, match.stageId))).limit(1),
    db.select().from(resultHistoryTable).where(eq(resultHistoryTable.matchId, match.id))
      .orderBy(desc(resultHistoryTable.revision)).limit(1),
    db.select().from(actionLogTable).where(and(eq(actionLogTable.tournamentId, tournamentId),
      eq(actionLogTable.matchId, match.id), eq(actionLogTable.actionType, "match_result_submitted"),
      eq(actionLogTable.isUndone, false))).orderBy(desc(actionLogTable.id)).limit(3),
  ]);
  const currentStage = stages.find(s => s.id === match.stageId);
  const nextStage = currentStage
    ? stages.find(s => s.position === currentStage.position + 1) : undefined;
  const nextStageMatches = nextStage
    ? await db.select({ id: matchesTable.id }).from(matchesTable)
      .where(eq(matchesTable.stageId, nextStage.id)) : [];

  // The saved snapshots can change immediately after this read. This endpoint
  // NEVER returns 'authorized' or 'safe_to_execute'. Revert's tx is authoritative.
  const result = deriveResultCorrectionPreflight({
    tournament: { status: access.tournament.status, winnerId: access.tournament.winnerId },
    match: match as CorrectionMatch,
    stages: stages as CorrectionStage[],
    stageMatches: stageMatches as CorrectionMatch[],
    nextStageMatches,
    approvedQualification: approvals.length > 0,
    materializedRoute: routes.length > 0,
    latestHistoryMatches: matchesHistory(histories[0], match),
    activeCompletionActions: actions.length === 1 && isCompletionAction(actions[0], match.id) ? 1 : 0,
    expectedRevision: data.expectedRevision as number,
    proposedScore1: data.proposedScore1 as number,
    proposedScore2: data.proposedScore2 as number,
  });
  // A separate, hypothetical in-memory ranking projection: never mutates matches.
  const standingsComparison = await getResultCorrectionStandingsComparison({
    tournamentId, stage: currentStage, match, stageMatches,
    nextStageExists: nextStage != null, preflight: result,
  });
  res.setHeader("Cache-Control", "no-store");
  // Structural-only projection. Does not execute or authorize correction.
  const bracketImpact = deriveEliminationBracketImpact({
    stage: currentStage, match, stageMatches, preflight: result,
  });
  const doubleEliminationImpact = currentStage?.format === "double_elimination"
    ? await getDoubleEliminationCorrectionImpact({
        tournamentId, stage: currentStage, match, stageMatches, preflight: result,
      })
    : undefined;
  // Verify all stage match versions and stage lifecycle state a second time.
  // This is a best-effort consistency fence, not a serializable transaction.
  const [latestStageMatches, latestStage] = await Promise.all([
    db.select().from(matchesTable).where(eq(matchesTable.stageId, match.stageId)),
    db.select({ version: tournamentStagesTable.version, status: tournamentStagesTable.status })
      .from(tournamentStagesTable).where(eq(tournamentStagesTable.id, match.stageId)).limit(1),
  ]);
  const stageVersionVector = stageMatchVersionVector(stageMatches, match.stageId);
  const coherent = stageVersionVector === stageMatchVersionVector(latestStageMatches, match.stageId)
    && latestStage[0]?.status === currentStage?.status
    && latestStage[0]?.version === currentStage?.version;
  const previewGuard = {
    status: coherent ? "stable_on_recheck" as const : "changed_during_read" as const,
    stageId: match.stageId, stageVersionVector,
  };
  if (!coherent) {
    res.json({ ...result, state: "blocked", issues: [...result.issues, {
      code: "CONCURRENT_STATE_CHANGE", severity: "block",
      message: "Stan etapu zmienił się w czasie przygotowania podglądu. Odśwież mecz.",
    }], previewGuard,
    recoveryPlan: deriveCorrectionRecoveryPlan({
      format: currentStage?.format ?? "round_robin", preview: result, guard: previewGuard,
      bracketImpact, doubleEliminationImpact,
    }),
    standingsComparison: { status: "unavailable", reasonCode: "CONCURRENT_STATE_CHANGE", message: "Odśwież stan turnieju." },
    bracketImpact: { status: "unavailable", reasonCode: "CONCURRENT_STATE_CHANGE", message: "Odśwież stan drabinki." },
    doubleEliminationImpact: { status: "unavailable", reasonCode: "CONCURRENT_STATE_CHANGE", message: "Odśwież stan routingu." },
  });
    return;
  }
  const recoveryPlan = deriveCorrectionRecoveryPlan({
    format: currentStage?.format ?? "round_robin", preview: result, guard: previewGuard,
    bracketImpact, doubleEliminationImpact,
  });
  const boundedRevertCandidate = deriveBoundedRevertEligibility({
    format: access.actor.type === "organizer" ? (currentStage?.format ?? null) : null, stageStatus: currentStage?.status ?? null,
    tournamentStatus: access.tournament.status,
    previewState: result.state, playbookStatus: recoveryPlan.status,
    guardStatus: previewGuard.status,
    existingScore1: match.score1, existingScore2: match.score2,
    proposedScore1: data.proposedScore1 as number, proposedScore2: data.proposedScore2 as number,
    historyVerified: matchesHistory(histories[0],match),
    activeCompletionActionId: actions.length===1 && isCompletionAction(actions[0], match.id) ? actions[0].id : null,
    issues: result.issues,
  });
  res.json({ ...result, standingsComparison, bracketImpact, doubleEliminationImpact, previewGuard, recoveryPlan, boundedRevertCandidate });
});

export default router;
