/** Pack 15: atomic Round Robin result replacement using the existing domain transactions.
 * All operations run on ONE transaction. If completeMatch throws, revert, journal and audit roll back.
 * No permission or safety guard in revertMatch/completeMatch has been bypassed.
 */
import { and, desc, eq } from "drizzle-orm";
import { actionLogTable, db, matchesTable, tournamentCorrectionOperationsTable, tournamentStagesTable } from "@workspace/db";
import type { TournamentMutationActor } from "../../access-policy";
import { completeMatch } from "../matches/complete-match";
import { revertMatch } from "../matches/revert-match";
import { deriveAtomicCorrectionDecision } from "../../domain/tournament/atomic-result-correction";

type Operation = typeof tournamentCorrectionOperationsTable.$inferSelect;
export type AtomicCorrectionOutcome = { operationId:string; matchId:number; revertedActionId:number;
  completedActionId:number; matchRevision:number; };
export class AtomicCorrectionError extends Error {
  constructor(public readonly code: "CORRECTION_NOT_APPROVED"|"CORRECTION_NO_LONGER_VALID"|"CORRECTION_NOT_SUPPORTED"|"CORRECTION_RESULT_INVALID"|"CORRECTION_AUDIT_MISSING") {
    super(code); this.name="AtomicCorrectionError";
  }
}

export async function executeAtomicRoundRobinCorrection(input: {
  operation: Operation; tournamentId:number; actor: TournamentMutationActor;
}, hooks: { afterRevert?: () => void|Promise<void>; afterComplete?: () => void|Promise<void> } = {}): Promise<AtomicCorrectionOutcome> {
  return db.transaction(async tx => {
    // Lock the tournament first, the same lock order used by revertMatch and completeMatch.
    // Both calls then revalidate authorization and optimistic versions inside this transaction.
    const [stageMatch] = await tx.select().from(matchesTable).where(and(
      eq(matchesTable.id,input.operation.matchId),eq(matchesTable.tournamentId,input.tournamentId)));
    if (!stageMatch) throw new AtomicCorrectionError("CORRECTION_NO_LONGER_VALID");
    const [stage] = await tx.select().from(tournamentStagesTable).where(and(
      eq(tournamentStagesTable.id,stageMatch.stageId),eq(tournamentStagesTable.tournamentId,input.tournamentId)));
    if (!stage || stage.format!=="round_robin" || stage.status!=="active" || stageMatch.resultType!=="played")
      throw new AtomicCorrectionError("CORRECTION_NOT_SUPPORTED");
    const decision = deriveAtomicCorrectionDecision({
      bestOf: stageMatch.bestOf,oldScore1:stageMatch.score1,oldScore2:stageMatch.score2,
      score1:input.operation.proposedScore1,score2:input.operation.proposedScore2,
      player1Id:stageMatch.player1Id,player2Id:stageMatch.player2Id,
    });
    if (!decision.allowed) throw new AtomicCorrectionError("CORRECTION_RESULT_INVALID");
    // No explicit lock of journal before revert: revertMatch locks tournament first and
    // conditionally consumes the approval, eliminating parallel execution races.
    const reverted = await revertMatch({
      matchId:input.operation.matchId,expectedTournamentId:input.tournamentId,
      expectedCompletionActionId:input.operation.expectedCompletionActionId,
      expectedMatchRevision:input.operation.expectedRevision,
      expectedStageVersionVector:input.operation.expectedStageVersionVector,
      requireActiveRoundRobin:true,correctionOperationId:input.operation.id,actor:input.actor,
    },{},tx);
    await hooks.afterRevert?.();
    const completed = await completeMatch({
      matchId:reverted.match.id,expectedRevision:reverted.match.revision,
      resultType:"played",score1:decision.score1,score2:decision.score2,actor:input.actor,
    },{},tx);
    await hooks.afterComplete?.();
    // We must capture the NEW active submission, not a superseded historic one.
    const completions = await tx.select({id:actionLogTable.id,undoPayload:actionLogTable.undoPayload}).from(actionLogTable).where(and(
      eq(actionLogTable.tournamentId,input.tournamentId),
      eq(actionLogTable.matchId,completed.id),
      eq(actionLogTable.actionType,"match_result_submitted"),
      eq(actionLogTable.isUndone,false),
    )).orderBy(desc(actionLogTable.id)).limit(2);
    // Ambiguous or forged audit entries must not be stored as a successful receipt.
    if (completions.length !== 1) throw new AtomicCorrectionError("CORRECTION_AUDIT_MISSING");
    const [completion] = completions;
    let undo: unknown;
    try { undo = JSON.parse(completion.undoPayload ?? ""); }
    catch { throw new AtomicCorrectionError("CORRECTION_AUDIT_MISSING"); }
    if (!undo || typeof undo !== "object" ||
      (undo as {type?:unknown}).type !== "revert_match" ||
      (undo as {matchId?:unknown}).matchId !== completed.id) {
      throw new AtomicCorrectionError("CORRECTION_AUDIT_MISSING");
    }
    const [updated] = await tx.update(tournamentCorrectionOperationsTable).set({
      status:"corrected",completedAt:new Date(),
      completionActionId:completion.id,correctedMatchRevision:completed.revision,
    }).where(and(
      eq(tournamentCorrectionOperationsTable.id,input.operation.id),
      eq(tournamentCorrectionOperationsTable.tournamentId,input.tournamentId),
      eq(tournamentCorrectionOperationsTable.matchId,completed.id),
      eq(tournamentCorrectionOperationsTable.status,"reverted_requires_resubmission"),
      eq(tournamentCorrectionOperationsTable.revertActionId,reverted.revertAction.id),
    )).returning({id:tournamentCorrectionOperationsTable.id});
    if (!updated) throw new AtomicCorrectionError("CORRECTION_NOT_APPROVED");
    return {operationId:updated.id,matchId:completed.id,revertedActionId:reverted.revertAction.id,
      completedActionId:completion.id,matchRevision:completed.revision};
  });
}
