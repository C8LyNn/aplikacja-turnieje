/** Pack 13: conservative eligibility for ONE atomic revert, never an automatic resubmission. */
export interface BoundedRevertEligibilityInput {
  format: string | null;
  stageStatus: string | null;
  tournamentStatus: string;
  previewState: "blocked" | "requires_review";
  playbookStatus: "stale" | "blocked" | "no_change" | "manual_review";
  guardStatus: "stable_on_recheck" | "changed_during_read" | null;
  existingScore1: number | null;
  existingScore2: number | null;
  proposedScore1: number;
  proposedScore2: number;
  historyVerified: boolean;
  activeCompletionActionId: number | null;
  issues: readonly { severity: "block" | "review"; code: string }[];
}
export interface BoundedRevertEligibility {
  supported: boolean;
  reasonCode: string;
  /** Advisory only; final guard is always the authorized revertMatch() transaction. */
  expectedCompletionActionId: number | null;
}
export function deriveBoundedRevertEligibility(input: BoundedRevertEligibilityInput): BoundedRevertEligibility {
  const deny = (reasonCode: string): BoundedRevertEligibility => ({ supported: false, reasonCode, expectedCompletionActionId: null });
  if (input.format !== "round_robin") return deny("FORMAT_NOT_EXECUTABLE");
  if (input.stageStatus !== "active" || input.tournamentStatus !== "active") return deny("LIFECYCLE_NOT_ACTIVE");
  if (input.guardStatus !== "stable_on_recheck" || input.playbookStatus === "stale") return deny("PREVIEW_STALE");
  if (input.previewState !== "requires_review" || input.playbookStatus !== "manual_review") return deny("PREVIEW_NOT_ELIGIBLE");
  if (input.issues.length > 0) return deny("PREVIEW_ISSUES_REQUIRE_MANUAL_REVIEW");
  if (!input.historyVerified) return deny("HISTORY_NOT_VERIFIED");
  if (!Number.isSafeInteger(input.activeCompletionActionId) || (input.activeCompletionActionId ?? 0) <= 0)
    return deny("COMPLETION_ACTION_NOT_UNAMBIGUOUS");
  if (input.existingScore1 === input.proposedScore1 && input.existingScore2 === input.proposedScore2)
    return deny("NO_CHANGE");
  return { supported: true, reasonCode: "REVERT_ONLY_REQUIRES_EXPLICIT_APPROVAL", expectedCompletionActionId: input.activeCompletionActionId };
}
