/** Pack 14: retrieve durable approval / receipt and execute once with all Pack 13 guards. */
import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, tournamentCorrectionOperationsTable } from "@workspace/db";
import { getTournamentMutationActor, requireOrganizer } from "../access-policy";
import { revertMatch, RevertMatchError } from "../application/matches/revert-match";
import { correctionIntentReadStatus, correctionIntentReceipt } from "../application/operations/tournament-correction-intent";

const router: IRouter = Router();
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const positiveId = (value: number) => Number.isSafeInteger(value) && value > 0;

type JournalRow = typeof tournamentCorrectionOperationsTable.$inferSelect;
function receipt(row: JournalRow) {
  return correctionIntentReceipt({
    id: row.id, matchId: row.matchId,
    status: row.status as "approved" | "reverted_requires_resubmission" | "corrected",
    approvedAt: row.approvedAt, expiresAt: row.expiresAt,
    completedAt: row.completedAt, revertActionId: row.revertActionId,
    revertedMatchRevision: row.revertedMatchRevision,
    completionActionId: row.completionActionId, correctedMatchRevision: row.correctedMatchRevision,
  });
}
async function loadOperation(tournamentId: number, operationId: string): Promise<JournalRow | undefined> {
  const [row] = await db.select().from(tournamentCorrectionOperationsTable).where(and(
    eq(tournamentCorrectionOperationsTable.tournamentId, tournamentId),
    eq(tournamentCorrectionOperationsTable.id, operationId),
  ));
  return row;
}

async function authorizedOperation(req: Request, res: Response): Promise<{ tournamentId: number; operationId: string; operation: JournalRow; actor: ReturnType<typeof getTournamentMutationActor> } | null> {
  const tournamentId = Number(req.params.id);
  const operationId = String(req.params.operationId ?? "").toLowerCase();
  if (!positiveId(tournamentId) || !UUID_V4.test(operationId)) {
    res.status(400).json({ code: "INVALID_CORRECTION_OPERATION_ID" }); return null;
  }
  const access = await requireOrganizer(req, res, tournamentId);
  if (!access) return null;
  res.setHeader("Cache-Control", "no-store");
  const operation = await loadOperation(tournamentId, operationId);
  if (!operation) {
    res.status(404).json({ code: "CORRECTION_OPERATION_NOT_FOUND" }); return null;
  }
  return { tournamentId, operationId, operation, actor: getTournamentMutationActor(access) };
}

router.get("/tournaments/:id/operations/correction-intents/:operationId", async (req, res): Promise<void> => {
  const resolved = await authorizedOperation(req, res);
  if (!resolved) return;
  res.json(receipt(resolved.operation));
});

router.post("/tournaments/:id/operations/correction-intents/:operationId/execute", async (req, res): Promise<void> => {
  const resolved = await authorizedOperation(req, res);
  if (!resolved) return;
  const { operation } = resolved;
  if (operation.status === "reverted_requires_resubmission" || operation.status === "corrected") {
    res.json(receipt(operation)); return; // Recovery after a lost HTTP response: NEVER repeat the mutation.
  }
  if (correctionIntentReadStatus("approved", operation.expiresAt) === "expired") {
    res.status(409).json({ code: "CORRECTION_APPROVAL_EXPIRED", ...receipt(operation) }); return;
  }
  try {
    // revertMatch owns the tournament lock, optimistic guards and audit transaction.
    // Pack 14 updates the journal receipt in that SAME transaction.
    await revertMatch({
      matchId: operation.matchId, expectedTournamentId: resolved.tournamentId,
      expectedCompletionActionId: operation.expectedCompletionActionId,
      expectedMatchRevision: operation.expectedRevision,
      expectedStageVersionVector: operation.expectedStageVersionVector,
      requireActiveRoundRobin: true,
      correctionOperationId: operation.id,
      actor: resolved.actor,
    });
    const completed = await loadOperation(resolved.tournamentId, operation.id);
    if (!completed || completed.status !== "reverted_requires_resubmission") {
      res.status(503).json({ code: "CORRECTION_RECEIPT_READ_FAILED", operationId: operation.id,
        error: "Sprawdź status operacji przed ponowną próbą." }); return;
    }
    res.json(receipt(completed));
  } catch (error) {
    if (error instanceof RevertMatchError) {
      // A concurrent request may have finished while we were waiting for the tournament lock.
      const completed = await loadOperation(resolved.tournamentId, operation.id);
      if (completed?.status === "reverted_requires_resubmission") {
        res.json(receipt(completed)); return;
      }
      res.status(error.code === "CONCURRENT_MODIFICATION" || error.code === "UNDO_ACTION_CHANGED" ? 409 : 422)
        .json({ code: error.code, operationId: operation.id, error: error.message }); return;
    }
    throw error;
  }
});
export default router;
