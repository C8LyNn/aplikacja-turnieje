/** Pack 19: strict no-write qualification for a hypothetical SE result replacement.
 * This is NOT an execution authorization or promise that state will remain valid.
 * A future writer must repeat every condition inside its own write transaction.
 */
import { evaluateSeCorrectionSafety, type SeCorrectionSafetyInput, type SeCorrectionIssue } from "./se-correction-safety";

export type SeReadinessIssue = SeCorrectionIssue
  | "EXPECTED_MATCH_REVISION_STALE"
  | "EXPECTED_STAGE_VERSION_STALE"
  | "CONFIRMATION_ACTION_MISMATCH"
  | "MISSING_DOWNSTREAM_MATCH"
  | "EXTERNAL_EXECUTION_DISABLED";

export interface SeReadinessInput {
  assessment: SeCorrectionSafetyInput;
  expectedMatchRevision: number;
  actualMatchRevision: number;
  expectedStageVersionVector: string;
  actualStageVersionVector: string;
  expectedCompletionActionId: number;
  activeCompletionActionId: number | null;
  allowExecution: false;
}

export interface SeReadinessResult {
  version: 1;
  status: "candidate" | "blocked";
  advisoryOnly: true;
  executionEnabled: false;
  writePerformed: false;
  matchId: number;
  expectedMatchRevision: number;
  stageVersionVector: string;
  originalWinnerId: number | null;
  hypotheticalWinnerId: number | null;
  dependentMatch: { id: number; round: number; matchNumber: number; slot: "player1" | "player2" } | null;
  requiredChecks: readonly string[];
  issues: readonly SeReadinessIssue[];
  reason: string;
}

export function deriveSeCorrectionReadiness(input: SeReadinessInput): SeReadinessResult {
  const safety = evaluateSeCorrectionSafety(input.assessment);
  const issues: SeReadinessIssue[] = [...safety.issues];
  const block = (issue: SeReadinessIssue) => { if (!issues.includes(issue)) issues.push(issue); };
  if (!Number.isSafeInteger(input.expectedMatchRevision) || input.expectedMatchRevision <= 0 ||
      input.actualMatchRevision !== input.expectedMatchRevision) block("EXPECTED_MATCH_REVISION_STALE");
  if (!input.expectedStageVersionVector || input.actualStageVersionVector !== input.expectedStageVersionVector)
    block("EXPECTED_STAGE_VERSION_STALE");
  if (!Number.isSafeInteger(input.expectedCompletionActionId) || input.expectedCompletionActionId <= 0 ||
      input.activeCompletionActionId !== input.expectedCompletionActionId)
    block("CONFIRMATION_ACTION_MISMATCH");
  if (!safety.dependentMatch) block("MISSING_DOWNSTREAM_MATCH");
  // This pack does NOT feature-gate a writer open, even for a perfect candidate.
  const candidate = issues.length === 0 && safety.status === "structurally_safe";
  return {
    version: 1,
    status: candidate ? "candidate" : "blocked",
    advisoryOnly: true, executionEnabled: false, writePerformed: false,
    matchId: safety.matchId, expectedMatchRevision: input.expectedMatchRevision,
    stageVersionVector: input.actualStageVersionVector,
    originalWinnerId: safety.priorWinnerId,
    hypotheticalWinnerId: safety.proposedWinnerId,
    dependentMatch: safety.dependentMatch,
    requiredChecks: [
      "Organizator musi posiadać aktualne uprawnienia",
      "Zatwierdzenie i plan muszą odpowiadać aktualnym rewizjom",
      "Nie mogą istnieć rozegrane ani uruchomione mecze zależne",
      "Historia wyniku i jednoznaczny wpis audytu muszą się zgadzać",
      "Nie mogą istnieć zatwierdzone awanse ani wykonany routing",
      "Przyszły zapis wymaga osobnej transakcji z ponowną walidacją",
    ],
    issues,
    reason: candidate
      ? "Kandydat spełnia kontrolowane warunki. W Pack 19 nie można wykonać korekty SE."
      : "Kandydat nie spełnia warunków; odśwież dane i rozwiąż blokady.",
  };
}
