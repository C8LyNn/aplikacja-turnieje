/** Pack 14: immutable, two-step correction approval and recoverable receipt. */
import { createHash } from "node:crypto";

export const CORRECTION_INTENT_LIFETIME_MS = 15 * 60 * 1000;
export type CorrectionIntentStatus = "approved" | "reverted_requires_resubmission" | "corrected";

export interface CorrectionIntentInput {
  operationId: string;
  matchId: number;
  expectedRevision: number;
  expectedCompletionActionId: number;
  expectedStageVersionVector: string;
  proposedScore1: number;
  proposedScore2: number;
  approvedByOrganizer: true;
  understandsRequiresResubmission: true;
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const pos = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const score = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function parseCorrectionIntentInput(raw: unknown): CorrectionIntentInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  if (typeof input.operationId !== "string" || !UUID_V4.test(input.operationId) ||
    !pos(input.matchId) || !pos(input.expectedRevision) || !pos(input.expectedCompletionActionId) ||
    typeof input.expectedStageVersionVector !== "string" ||
    input.expectedStageVersionVector.length < 2 || input.expectedStageVersionVector.length > 80000 ||
    !score(input.proposedScore1) || !score(input.proposedScore2) ||
    input.approvedByOrganizer !== true || input.understandsRequiresResubmission !== true) return null;
  return {
    operationId: input.operationId.toLowerCase(),
    matchId: input.matchId, expectedRevision: input.expectedRevision,
    expectedCompletionActionId: input.expectedCompletionActionId,
    expectedStageVersionVector: input.expectedStageVersionVector,
    proposedScore1: input.proposedScore1, proposedScore2: input.proposedScore2,
    approvedByOrganizer: true, understandsRequiresResubmission: true,
  };
}

/** Includes the tournament scope to prevent reusing an id in another tournament. */
export function correctionIntentFingerprint(tournamentId: number, input: CorrectionIntentInput): string {
  return createHash("sha256").update(JSON.stringify([
    tournamentId, input.operationId, input.matchId, input.expectedRevision,
    input.expectedCompletionActionId, input.expectedStageVersionVector,
    input.proposedScore1, input.proposedScore2,
    input.approvedByOrganizer, input.understandsRequiresResubmission,
  ])).digest("hex");
}

export function correctionIntentReadStatus(
  storedStatus: CorrectionIntentStatus,
  expiresAt: Date,
  now: Date = new Date(),
): CorrectionIntentStatus | "expired" {
  return storedStatus === "approved" && expiresAt.getTime() <= now.getTime() ? "expired" : storedStatus;
}

export function correctionIntentReceipt(operation: {
  id: string; matchId: number; status: CorrectionIntentStatus;
  expiresAt: Date; approvedAt: Date; completedAt: Date | null;
  revertActionId: number | null; revertedMatchRevision: number | null;
  completionActionId?: number | null; correctedMatchRevision?: number | null;
}, now: Date = new Date()) {
  const status = correctionIntentReadStatus(operation.status, operation.expiresAt, now);
  return {
    version: 1 as const, operationId: operation.id, matchId: operation.matchId,
    status, approvedAt: operation.approvedAt.toISOString(), expiresAt: operation.expiresAt.toISOString(),
    completedAt: operation.completedAt?.toISOString() ?? null,
    mutationPerformed: status === "reverted_requires_resubmission" || status === "corrected",
    completionActionId: operation.completionActionId ?? null, correctedMatchRevision: operation.correctedMatchRevision ?? null,
    revertActionId: operation.revertActionId,
    matchRevision: operation.revertedMatchRevision,
    message: status === "corrected"
      ? "Wynik poprawiony atomowo: cofnięcie i nowy zapis zatwierdzono w jednej transakcji."
      : status === "reverted_requires_resubmission"
      ? "Wynik cofnięty. Nowy wynik należy zapisać osobno po odświeżeniu danych."
      : status === "expired"
        ? "Zatwierdzenie wygasło. Wykonaj nowy podgląd i przygotuj nowe zatwierdzenie."
        : "Zatwierdzenie zapisano. Można wykonać cofnięcie po transakcyjnej weryfikacji stanu.",
  };
}
