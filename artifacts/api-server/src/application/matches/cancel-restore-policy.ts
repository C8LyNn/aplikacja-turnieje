export class MatchLifecycleConflict extends Error {
  constructor(public readonly code: string, public readonly status: number = 422) {
    super(code);
    this.name = "MatchLifecycleConflict";
  }
}

/** Evaluate only the current rows read under the tournament/match/stage locks. */
export function assertCancelRestoreState(
  operation: "cancel" | "restore",
  match: { status: string; resultType: string | null; completedAt: Date | null; winnerId: number | null },
  tournamentStatus: string,
  stageStatus: string | undefined,
): void {
  if (tournamentStatus !== "active" || stageStatus !== "active") {
    throw new MatchLifecycleConflict("MATCH_STAGE_NOT_ACTIVE");
  }
  if (match.resultType != null || match.completedAt != null || match.winnerId != null) {
    throw new MatchLifecycleConflict("MATCH_RESULT_STATE_INCONSISTENT");
  }
  if (operation === "restore") {
    if (match.status !== "cancelled") throw new MatchLifecycleConflict("MATCH_NOT_CANCELLED");
  } else {
    if (match.status === "cancelled") throw new MatchLifecycleConflict("MATCH_ALREADY_CANCELLED", 409);
    if (!["pending", "in_progress", "postponed"].includes(match.status)) {
      throw new MatchLifecycleConflict("MATCH_CANNOT_CANCEL");
    }
  }
}
