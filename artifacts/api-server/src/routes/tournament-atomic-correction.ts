/** Pack 15: execute the already approved result correction as one transaction. */
import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, tournamentCorrectionOperationsTable } from "@workspace/db";
import { requireOrganizer, getTournamentMutationActor } from "../access-policy";
import { AtomicCorrectionError, executeAtomicRoundRobinCorrection } from "../application/operations/tournament-atomic-correction";
import { correctionIntentReadStatus, correctionIntentReceipt } from "../application/operations/tournament-correction-intent";
import { CompleteMatchError } from "../application/matches/complete-match";
import { RevertMatchError } from "../application/matches/revert-match";
const router: IRouter = Router();
const UUID_V4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const receipt=(op: typeof tournamentCorrectionOperationsTable.$inferSelect)=>correctionIntentReceipt({
  id:op.id,matchId:op.matchId,status:op.status as "approved"|"reverted_requires_resubmission"|"corrected",
  expiresAt:op.expiresAt,approvedAt:op.approvedAt,completedAt:op.completedAt,
  revertActionId:op.revertActionId,revertedMatchRevision:op.revertedMatchRevision,
  completionActionId:op.completionActionId,correctedMatchRevision:op.correctedMatchRevision,
});
router.post("/tournaments/:id/operations/correction-intents/:operationId/execute-atomic", async(req,res):Promise<void>=>{
  const tournamentId=Number(req.params.id),operationId=String(req.params.operationId??"").toLowerCase();
  if (!Number.isSafeInteger(tournamentId)||tournamentId<=0||!UUID_V4.test(operationId)) {
    res.status(400).json({code:"INVALID_CORRECTION_OPERATION_ID"});return;
  }
  const access=await requireOrganizer(req,res,tournamentId);
  if(!access)return;
  res.setHeader("Cache-Control","no-store");
  const find=async()=> (await db.select().from(tournamentCorrectionOperationsTable).where(and(
    eq(tournamentCorrectionOperationsTable.tournamentId,tournamentId),
    eq(tournamentCorrectionOperationsTable.id,operationId),
  )))[0];
  const operation=await find();
  if(!operation){res.status(404).json({code:"CORRECTION_OPERATION_NOT_FOUND"});return;}
  if(operation.status==="corrected") {res.json(receipt(operation));return;}
  if(operation.status!=="approved"){
    res.status(409).json({code:"CORRECTION_OPERATION_ALREADY_REVERTED",...receipt(operation)});return;
  }
  if(correctionIntentReadStatus("approved",operation.expiresAt)==="expired"){
    res.status(409).json({code:"CORRECTION_APPROVAL_EXPIRED",...receipt(operation)});return;
  }
  try {
    await executeAtomicRoundRobinCorrection({operation,tournamentId,actor:getTournamentMutationActor(access)});
    const finished=await find();
    if (!finished || finished.status!=="corrected") {
      res.status(503).json({code:"CORRECTION_RECEIPT_READ_FAILED",operationId,
        error:"Sprawdź status operacji przed ponowną próbą."});return;
    }
    res.json(receipt(finished));
  }catch(error){
    // Parallel retry: the other transaction may have committed while we waited.
    const finished=await find();
    if(finished?.status==="corrected") {res.json(receipt(finished));return;}
    if(error instanceof AtomicCorrectionError||error instanceof CompleteMatchError||error instanceof RevertMatchError){
      res.status(409).json({code:error.code,operationId,error:error.message});return;
    }
    throw error;
  }
});
export default router;
