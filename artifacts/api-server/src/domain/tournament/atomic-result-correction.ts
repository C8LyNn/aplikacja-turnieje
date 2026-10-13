/** Pack 15: pure validation and receipt classification; never authorizes a database write. */
import { validatePlayedSeriesResult } from "../match/series-result";

export type AtomicCorrectionDecision =
  | { allowed: true; winnerId: number; score1: number; score2: number }
  | { allowed: false; code: "INVALID_SERIES" | "NO_CHANGE" | "INVALID_PARTICIPANTS" };

export function deriveAtomicCorrectionDecision(input: {
  bestOf: number; oldScore1: number | null; oldScore2: number | null;
  score1: number; score2: number; player1Id: number | null; player2Id: number | null;
}): AtomicCorrectionDecision {
  if (input.player1Id == null || input.player2Id == null || input.player1Id === input.player2Id)
    return { allowed: false, code: "INVALID_PARTICIPANTS" };
  if (input.oldScore1 === input.score1 && input.oldScore2 === input.score2)
    return { allowed: false, code: "NO_CHANGE" };
  const checked = validatePlayedSeriesResult({resultType: "played", bestOf: input.bestOf, score1: input.score1, score2: input.score2});
  if (!checked.ok) return { allowed: false, code: "INVALID_SERIES" };
  return {allowed: true,
    winnerId: checked.value.winnerSide === "player1" ? input.player1Id : input.player2Id,
    score1: checked.value.score1, score2: checked.value.score2};
}

/** Monotonic persisted states. A result of 'corrected' can be safely replayed as a receipt. */
export type AtomicCorrectionState = "approved" | "reverted_requires_resubmission" | "corrected";
export function isTerminalCorrectionState(status: string): status is Exclude<AtomicCorrectionState,"approved"> {
  return status === "reverted_requires_resubmission" || status === "corrected";
}
