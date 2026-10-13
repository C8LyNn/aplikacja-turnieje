/** Pack 19: a consistent, read-only transaction for SE correction eligibility.
 * This endpoint NEVER authorizes a write and NEVER updates the database.
 */
import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  actionLogTable, db, matchesTable, qualificationProposalsTable,
  resultHistoryTable, stageBasketRouteExecutionsTable, tournamentStagesTable, tournamentsTable,
} from "@workspace/db";
import { requireOrganizer } from "../access-policy";
import { stageMatchVersionVector } from "../application/operations/tournament-preview-coherence";
import { deriveSeCorrectionReadiness } from "../domain/tournament/se-correction-readiness";
import { deriveSeCorrectionActionPlan } from "../domain/tournament/se-correction-action-plan";
import { deriveSeCorrectionDiagnostic } from "../domain/tournament/se-correction-diagnostic";
import { deriveSeCorrectionImpactGraph } from "../domain/tournament/se-correction-impact-graph";
import { deriveSeCorrectionImpactRiskReport } from "../domain/tournament/se-correction-impact-risk-report";

const router: IRouter = Router();
const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const score = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 999999;

router.post("/tournaments/:id/matches/:matchId/se-correction-readiness", async (req,res):Promise<void> => {
  const tournamentId = Number(req.params.id), matchId = Number(req.params.matchId);
  const body: unknown = req.body;
  const b = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string,unknown> : {};
  if (!positive(tournamentId) || !positive(matchId) || !score(b.score1) || !score(b.score2) ||
      !positive(b.expectedMatchRevision) || !positive(b.expectedCompletionActionId) ||
      typeof b.expectedStageVersionVector !== "string" ||
      b.expectedStageVersionVector.length < 2 || b.expectedStageVersionVector.length > 80000) {
    res.status(400).json({code:"INVALID_SE_READINESS_INPUT"});return;
  }
  const access = await requireOrganizer(req,res,tournamentId);
  if (!access) return;
  res.setHeader("Cache-Control","no-store");
  // A consistent MVCC view without write locks. The later write transaction
  // MUST perform its own independent, locked revalidation.
  const outcome = await db.transaction(async tx => {
    const [tournament] = await tx.select().from(tournamentsTable).where(eq(tournamentsTable.id,tournamentId));
    const [match] = await tx.select().from(matchesTable).where(and(
      eq(matchesTable.id,matchId),eq(matchesTable.tournamentId,tournamentId)));
    if (!tournament || !match) return null;
    const [stages,matches,approvals,routes,histories,actions] = await Promise.all([
      tx.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId,tournamentId)),
      tx.select().from(matchesTable).where(eq(matchesTable.stageId,match.stageId)),
      tx.select({id:qualificationProposalsTable.id}).from(qualificationProposalsTable).where(and(
        eq(qualificationProposalsTable.tournamentId,tournamentId),eq(qualificationProposalsTable.stageId,match.stageId),
        eq(qualificationProposalsTable.status,"approved"))).limit(1),
      tx.select({id:stageBasketRouteExecutionsTable.id}).from(stageBasketRouteExecutionsTable).where(and(
        eq(stageBasketRouteExecutionsTable.tournamentId,tournamentId),eq(stageBasketRouteExecutionsTable.sourceStageId,match.stageId))).limit(1),
      tx.select().from(resultHistoryTable).where(eq(resultHistoryTable.matchId,match.id)).orderBy(desc(resultHistoryTable.revision)).limit(1),
      tx.select().from(actionLogTable).where(and(
        eq(actionLogTable.tournamentId,tournamentId),eq(actionLogTable.matchId,match.id),
        eq(actionLogTable.actionType,"match_result_submitted"),eq(actionLogTable.isUndone,false),
      )).orderBy(desc(actionLogTable.id)).limit(2),
    ]);
    const stage=stages.find(item=>item.id===match.stageId);
    if(!stage)return null;
    const h=histories[0];
    const historyVerified=!!h && !!match.completedAt && h.tournamentId===match.tournamentId &&
      h.stageId===match.stageId && h.round===match.round && h.matchNumber===match.matchNumber &&
      h.player1Id===match.player1Id && h.player2Id===match.player2Id &&
      h.bestOf===match.bestOf && h.resultType===match.resultType &&
      h.score1===match.score1 && h.score2===match.score2 && h.winnerId===match.winnerId &&
      h.resultReason===match.resultReason && h.completedAt.getTime()===match.completedAt.getTime();
    let completionActionUnambiguous=false;
    if(actions.length===1) {
      try { const decoded:unknown=JSON.parse(actions[0].undoPayload??"");
        completionActionUnambiguous=!!decoded && typeof decoded==="object" &&
          (decoded as {type?:unknown}).type==="revert_match" &&
          (decoded as {matchId?:unknown}).matchId===match.id;
      }catch { /* invalid undo payload => blocker */ }
    }
    const result=deriveSeCorrectionReadiness({
      assessment:{
        tournamentStatus:tournament.status,stage,stages,match,stageMatches:matches,
        score1:b.score1 as number,score2:b.score2 as number,
        qualificationCommitted:approvals.length>0,routingCommitted:routes.length>0,
        historyVerified,completionActionUnambiguous,
      },
      expectedMatchRevision:b.expectedMatchRevision as number,
      actualMatchRevision:match.revision,
      expectedStageVersionVector:b.expectedStageVersionVector as string,
      actualStageVersionVector:stageMatchVersionVector(matches,stage.id),
      expectedCompletionActionId:b.expectedCompletionActionId as number,
      activeCompletionActionId:completionActionUnambiguous?actions[0].id:null,
      allowExecution:false,
    });
    const actionPlan = deriveSeCorrectionActionPlan({
      readiness:result,
      score1:b.score1 as number,score2:b.score2 as number,
      originalScore1:match.score1,originalScore2:match.score2,
    });
    const diagnostic = deriveSeCorrectionDiagnostic({
      readiness:result,plan:actionPlan,
      expectedCompletionActionId:b.expectedCompletionActionId as number,
    });
    const impactGraph = deriveSeCorrectionImpactGraph({
      matchId:match.id,stage,stages,stageMatches:matches,actionPlan,
      qualificationCommitted:approvals.length>0,routingCommitted:routes.length>0,
    });
    const impactRiskReport = deriveSeCorrectionImpactRiskReport(impactGraph);
    return { ...result, actionPlan, diagnostic, impactGraph, impactRiskReport };
  }, {isolationLevel:"repeatable read",accessMode:"read only"});
  if (!outcome) {res.status(404).json({code:"SE_READINESS_NOT_FOUND"});return;}
  res.json(outcome);
});
export default router;
