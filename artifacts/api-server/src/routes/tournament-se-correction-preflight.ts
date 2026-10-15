/** Pack 18: organizer-only, no-write SE correction safety endpoint. */
import { createHash } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  actionLogTable, db, matchesTable, qualificationProposalsTable, resultHistoryTable,
  stageBasketRouteExecutionsTable, tournamentStagesTable, tournamentsTable,
} from "@workspace/db";
import { requireOrganizer } from "../access-policy";
import { evaluateSeCorrectionSafety } from "../domain/tournament/se-correction-safety";
import { stageMatchVersionVector } from "../application/operations/tournament-preview-coherence";

const router: IRouter = Router();
const positive = (raw: unknown): number | null => {
  if (typeof raw !== "string" || !/^[1-9][0-9]{0,9}$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
};
const nonnegative = (raw: unknown): number | null => {
  if (typeof raw !== "string" || !/^(0|[1-9][0-9]{0,5})$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
};
const signature = (stageMatches: readonly (typeof matchesTable.$inferSelect)[]): string =>
  createHash("sha256").update(JSON.stringify(stageMatches.map(match => [
    match.id, match.revision, match.stageId, match.round, match.matchNumber,
    match.status, match.resultType, match.player1Id, match.player2Id,
    match.bestOf, match.score1, match.score2, match.winnerId, match.resultReason, match.completedAt?.toISOString() ?? null,
  ]).sort((a,b) => Number(a[0])-Number(b[0])))).digest("hex");

router.get("/tournaments/:id/matches/:matchId/se-correction-preflight", async(req,res):Promise<void>=>{
  const tournamentId=positive(req.params.id), matchId=positive(req.params.matchId);
  const score1=nonnegative(req.query.score1),score2=nonnegative(req.query.score2);
  if(tournamentId==null||matchId==null||score1==null||score2==null){
    res.status(400).json({code:"INVALID_SE_PREFLIGHT_INPUT"});return;
  }
  const access=await requireOrganizer(req,res,tournamentId);
  if(!access)return;
  res.setHeader("Cache-Control","no-store");
  const [match]=await db.select().from(matchesTable).where(and(
    eq(matchesTable.id,matchId),eq(matchesTable.tournamentId,tournamentId)));
  if(!match){res.status(404).json({code:"MATCH_NOT_FOUND"});return;}
  const [stages,matches,approvals,routes,histories,actions] = await Promise.all([
    db.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId,tournamentId)),
    db.select().from(matchesTable).where(eq(matchesTable.stageId,match.stageId)),
    db.select({id:qualificationProposalsTable.id}).from(qualificationProposalsTable).where(and(
      eq(qualificationProposalsTable.tournamentId,tournamentId),eq(qualificationProposalsTable.stageId,match.stageId),
      eq(qualificationProposalsTable.status,"approved"))).limit(1),
    db.select({id:stageBasketRouteExecutionsTable.id}).from(stageBasketRouteExecutionsTable).where(and(
      eq(stageBasketRouteExecutionsTable.tournamentId,tournamentId),eq(stageBasketRouteExecutionsTable.sourceStageId,match.stageId))).limit(1),
    db.select().from(resultHistoryTable).where(eq(resultHistoryTable.matchId,match.id)).orderBy(desc(resultHistoryTable.revision)).limit(1),
    db.select().from(actionLogTable).where(and(
      eq(actionLogTable.matchId,match.id),eq(actionLogTable.tournamentId,tournamentId),
      eq(actionLogTable.actionType,"match_result_submitted"),eq(actionLogTable.isUndone,false),
    )).orderBy(desc(actionLogTable.id)).limit(2),
  ]);
  const stage=stages.find(item=>item.id===match.stageId);
  if(!stage){res.status(409).json({code:"STAGE_NOT_FOUND"});return;}
  const hist=histories[0];
  const historyVerified= !!hist && !!match.completedAt && hist.tournamentId===match.tournamentId &&
    hist.stageId===match.stageId && hist.round===match.round && hist.matchNumber===match.matchNumber &&
    hist.player1Id===match.player1Id && hist.player2Id===match.player2Id &&
    hist.bestOf===match.bestOf && hist.resultType===match.resultType &&
    hist.score1===match.score1 && hist.score2===match.score2 && hist.winnerId===match.winnerId &&
    hist.resultReason===match.resultReason && hist.completedAt.getTime()===match.completedAt.getTime();
  let completionActionUnambiguous=false;
  if(actions.length===1){
    try {
      const payload:unknown=JSON.parse(actions[0].undoPayload??"");
      completionActionUnambiguous=!!payload&&typeof payload==="object"&&
        (payload as {type?:unknown}).type==="revert_match" &&
        (payload as {matchId?:unknown}).matchId===match.id;
    }catch { /* invalid history is a blocker, not an HTTP exception */ }
  }
  const analysis=evaluateSeCorrectionSafety({
    tournamentStatus:access.tournament.status,stage,stages,match,stageMatches:matches,
    score1,score2,qualificationCommitted:approvals.length>0,routingCommitted:routes.length>0,
    historyVerified,completionActionUnambiguous,
  });
  // Recheck the data after analysis. This remains an advisory read, never authorization.
  const [freshMatches,freshStages,freshTournaments] = await Promise.all([
    db.select().from(matchesTable).where(eq(matchesTable.stageId,stage.id)),
    db.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId,tournamentId)),
    db.select().from(tournamentsTable).where(eq(tournamentsTable.id,tournamentId)),
  ]);
  if(freshTournaments.length!==1 || freshTournaments[0].status!==access.tournament.status ||
    freshTournaments[0].activeStageId!==access.tournament.activeStageId ||
    signature(freshMatches)!==signature(matches)||
    JSON.stringify(freshStages.map(s=>[s.id,s.version,s.status,s.currentRound]).sort((a,b)=>Number(a[0])-Number(b[0])))!==
    JSON.stringify(stages.map(s=>[s.id,s.version,s.status,s.currentRound]).sort((a,b)=>Number(a[0])-Number(b[0])))){
    res.status(409).json({code:"SE_PREFLIGHT_STALE",error:"Stan drabinki zmienił się podczas analizy."});return;
  }
  res.json({ ...analysis, executionEnabled:false,readVersion:signature(matches),
    matchRevision:match.revision,stageVersionVector:stageMatchVersionVector(matches,stage.id),
    activeCompletionActionId:completionActionUnambiguous?actions[0].id:null,
    message:analysis.status==="structurally_safe"
      ? "Drabinka ma spójne zależności, lecz automatyczne wykonanie korekty SE pozostaje wyłączone."
      : "Korekta wymaga rozwiązania wskazanych blokad; automatyczne wykonanie pozostaje wyłączone." });
});
export default router;
