/** Pack 14: step 1. Persist explicit approval, but NEVER mutate the match. */
import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db, actionLogTable, matchesTable, qualificationProposalsTable,
  resultHistoryTable, stageBasketRouteExecutionsTable, tournamentStagesTable,
} from "@workspace/db";
import { requireOrganizer } from "../access-policy";
import { tournamentCorrectionOperationsTable } from "@workspace/db";
import { parseCorrectionIntentInput, correctionIntentFingerprint, CORRECTION_INTENT_LIFETIME_MS, correctionIntentReceipt } from "../application/operations/tournament-correction-intent";
import { stageMatchVersionVector } from "../application/operations/tournament-preview-coherence";
import { deriveResultCorrectionPreflight, type CorrectionMatch, type CorrectionStage } from "../application/operations/tournament-result-correction-preflight";
import { deriveBoundedRevertEligibility } from "../application/operations/tournament-bounded-revert-eligibility";

const router: IRouter = Router();
const pos = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x > 0;

function completionActionMatches(action: typeof actionLogTable.$inferSelect | undefined, matchId: number) {
  if (!action?.undoPayload) return false;
  try { const p: unknown = JSON.parse(action.undoPayload);
    return !!p && typeof p === "object" && (p as { type?: string }).type === "revert_match" && (p as { matchId?: number }).matchId === matchId;
  } catch { return false; }
}
function historyMatches(history: typeof resultHistoryTable.$inferSelect | undefined, match: typeof matchesTable.$inferSelect) {
  if (!history?.completedAt || !match.completedAt) return false;
  return history.tournamentId === match.tournamentId && history.stageId === match.stageId
    && history.round === match.round && history.matchNumber === match.matchNumber
    && history.player1Id === match.player1Id && history.player2Id === match.player2Id
    && history.score1 === match.score1 && history.score2 === match.score2 && history.winnerId === match.winnerId
    && history.bestOf === match.bestOf && history.resultType === match.resultType
    && history.resultReason === match.resultReason && history.completedAt.getTime() === match.completedAt.getTime();
}
router.post("/tournaments/:id/operations/correction-intents", async (req, res): Promise<void> => {
  const tournamentId = Number(req.params.id);
  if (!pos(tournamentId)) {
    res.status(400).json({ code: "INVALID_TOURNAMENT_ID" }); return;
  }
  const body = parseCorrectionIntentInput(req.body);
  if (!body) {
    res.status(422).json({ code: "EXPLICIT_APPROVAL_REQUIRED", error: "Wymagane aktualne dane, UUID v4 i dwa potwierdzenia." }); return;
  }
  const access = await requireOrganizer(req,res,tournamentId);
  if (!access) return;
  res.setHeader("Cache-Control", "no-store");
  const fingerprint = correctionIntentFingerprint(tournamentId, body);
  const [earlier] = await db.select().from(tournamentCorrectionOperationsTable)
    .where(eq(tournamentCorrectionOperationsTable.id, body.operationId));
  if (earlier) {
    if (earlier.tournamentId !== tournamentId || earlier.requestFingerprint !== fingerprint) {
      res.status(409).json({ code: "CORRECTION_OPERATION_ID_REUSED" }); return;
    }
    res.json(correctionIntentReceipt({ id: earlier.id, matchId: earlier.matchId,
      status: earlier.status as "approved" | "reverted_requires_resubmission" | "corrected",
      approvedAt: earlier.approvedAt, expiresAt: earlier.expiresAt,
      completedAt: earlier.completedAt, revertActionId: earlier.revertActionId,
      revertedMatchRevision: earlier.revertedMatchRevision,
      completionActionId: earlier.completionActionId, correctedMatchRevision: earlier.correctedMatchRevision })); return;
  }
  const [match] = await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId,tournamentId),eq(matchesTable.id,body.matchId)));
  if (!match) { res.status(404).json({ code:"MATCH_NOT_FOUND", error:"Mecz nie istnieje." });return; }
  const [stages,stageMatches,approvals,routes,histories,actions] = await Promise.all([
    db.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId,tournamentId)),
    db.select().from(matchesTable).where(eq(matchesTable.stageId,match.stageId)),
    db.select({id:qualificationProposalsTable.id}).from(qualificationProposalsTable)
      .where(and(eq(qualificationProposalsTable.tournamentId,tournamentId),eq(qualificationProposalsTable.stageId,match.stageId),eq(qualificationProposalsTable.status,"approved"))).limit(1),
    db.select({id:stageBasketRouteExecutionsTable.id}).from(stageBasketRouteExecutionsTable)
      .where(and(eq(stageBasketRouteExecutionsTable.tournamentId,tournamentId),eq(stageBasketRouteExecutionsTable.sourceStageId,match.stageId))).limit(1),
    db.select().from(resultHistoryTable).where(eq(resultHistoryTable.matchId,match.id)).orderBy(desc(resultHistoryTable.revision)).limit(1),
    db.select().from(actionLogTable).where(and(eq(actionLogTable.tournamentId,tournamentId),eq(actionLogTable.matchId,match.id),eq(actionLogTable.actionType,"match_result_submitted"),eq(actionLogTable.isUndone,false)))
      .orderBy(desc(actionLogTable.id)).limit(3),
  ]);
  const stage=stages.find(s=>s.id===match.stageId);
  const candidateVersion=stageMatchVersionVector(stageMatches,match.stageId);
  if (match.revision !== body.expectedRevision || candidateVersion !== body.expectedStageVersionVector) {
    res.status(409).json({code:"CORRECTION_PREVIEW_STALE",error:"Zmieniono stan etapu lub meczu. Odśwież podgląd przed wykonaniem."});return;
  }
  const nextStage=stage?stages.find(s=>s.position===stage.position+1):undefined;
  const nextStageMatches=nextStage?await db.select({id:matchesTable.id}).from(matchesTable).where(eq(matchesTable.stageId,nextStage.id)):[];
  const actionValid=actions.length===1 && completionActionMatches(actions[0],match.id);
  const historyVerified=historyMatches(histories[0],match);
  const preflight=deriveResultCorrectionPreflight({
    tournament:{status:access.tournament.status,winnerId:access.tournament.winnerId},
    match:match as CorrectionMatch,stages:stages as CorrectionStage[],stageMatches:stageMatches as CorrectionMatch[],nextStageMatches,
    approvedQualification:approvals.length>0,materializedRoute:routes.length>0,latestHistoryMatches:historyVerified,
    activeCompletionActions:actionValid?1:0,expectedRevision:body.expectedRevision as number,
    proposedScore1:body.proposedScore1 as number,proposedScore2:body.proposedScore2 as number,
  });
  const eligibility=deriveBoundedRevertEligibility({
    format:stage?.format??null,stageStatus:stage?.status??null,tournamentStatus:access.tournament.status,
    previewState:preflight.state,playbookStatus:preflight.state==="blocked"?"blocked":"manual_review",
    guardStatus:"stable_on_recheck",existingScore1:match.score1,existingScore2:match.score2,
    proposedScore1:body.proposedScore1 as number,proposedScore2:body.proposedScore2 as number,
    historyVerified,activeCompletionActionId:actionValid?actions[0].id:null,issues:preflight.issues,
  });
  if (!eligibility.supported || eligibility.expectedCompletionActionId!==body.expectedCompletionActionId) {
    res.status(409).json({code:eligibility.reasonCode,error:"Nie można wykonać uproszczonego cofnięcia. Sprawdź blokady i ponów podgląd."});return;
  }
  const [created] = await db.insert(tournamentCorrectionOperationsTable).values({
    id: body.operationId, tournamentId, matchId: body.matchId,
    expectedRevision: body.expectedRevision, expectedCompletionActionId: body.expectedCompletionActionId,
    expectedStageVersionVector: body.expectedStageVersionVector,
    proposedScore1: body.proposedScore1, proposedScore2: body.proposedScore2,
    requestFingerprint: fingerprint, approvedBy: "organizer", status: "approved",
    expiresAt: new Date(Date.now() + CORRECTION_INTENT_LIFETIME_MS),
  }).onConflictDoNothing().returning();
  const approved = created ?? (await db.select().from(tournamentCorrectionOperationsTable)
    .where(eq(tournamentCorrectionOperationsTable.id, body.operationId)))[0];
  if (!approved || approved.tournamentId !== tournamentId || approved.requestFingerprint !== fingerprint) {
    res.status(409).json({ code: "CORRECTION_OPERATION_ID_REUSED" }); return;
  }
  res.status(created ? 201 : 200).json(correctionIntentReceipt({
    id: approved.id, matchId: approved.matchId,
    status: approved.status as "approved" | "reverted_requires_resubmission" | "corrected",
    approvedAt: approved.approvedAt, expiresAt: approved.expiresAt,
    completedAt: approved.completedAt, revertActionId: approved.revertActionId,
    revertedMatchRevision: approved.revertedMatchRevision,
    completionActionId: approved.completionActionId, correctedMatchRevision: approved.correctedMatchRevision,
  }));
});
export default router;
