import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchesTable,
  playersTable,
  resultHistoryTable,
  tournamentsTable,
} from "@workspace/db";

export type RevertMatchErrorCode =
  | "MATCH_NOT_FOUND"
  | "TOURNAMENT_NOT_FOUND"
  | "PARTICIPANT_NOT_FOUND"
  | "RESULT_HISTORY_NOT_FOUND"
  | "MATCH_NOT_COMPLETED"
  | "COMPLETION_ALREADY_UNDONE"
  | "UNDO_ACTION_CHANGED"
  | "DOWNSTREAM_BLOCKED"
  | "CONCURRENT_MODIFICATION"
  | "TOURNAMENT_MISMATCH"
  | "PARTICIPANT_TOURNAMENT_MISMATCH"
  | "RESULT_INCONSISTENT"
  | "STATISTICS_INCONSISTENT"
  | "HISTORY_INCONSISTENT"
  | "COMPLETION_LOG_AMBIGUOUS"
  | "TOURNAMENT_FINALIZATION_INCONSISTENT";

const ERROR_MESSAGES: Record<RevertMatchErrorCode, string> = {
  MATCH_NOT_FOUND: "Mecz nie istnieje.",
  TOURNAMENT_NOT_FOUND: "Turniej meczu nie istnieje.",
  PARTICIPANT_NOT_FOUND: "Nie znaleziono wymaganego uczestnika meczu.",
  RESULT_HISTORY_NOT_FOUND: "Nie znaleziono historii zatwierdzonego wyniku.",
  MATCH_NOT_COMPLETED: "Mecz nie ma wyniku, który można cofnąć.",
  COMPLETION_ALREADY_UNDONE: "Zatwierdzenie tego wyniku zostało już cofnięte.",
  UNDO_ACTION_CHANGED: "Ostatnia akcja do cofnięcia uległa zmianie.",
  DOWNSTREAM_BLOCKED: "Kolejny mecz został zmieniony i blokuje cofnięcie wyniku.",
  CONCURRENT_MODIFICATION: "Stan meczu zmienił się podczas cofania wyniku.",
  TOURNAMENT_MISMATCH: "Mecz nie należy do wskazanego turnieju.",
  PARTICIPANT_TOURNAMENT_MISMATCH: "Uczestnicy nie należą do turnieju meczu.",
  RESULT_INCONSISTENT: "Zapisany wynik meczu jest niespójny.",
  STATISTICS_INCONSISTENT: "Statystyk uczestników nie można dokładnie odwrócić.",
  HISTORY_INCONSISTENT: "Historia nie odpowiada aktualnemu wynikowi meczu.",
  COMPLETION_LOG_AMBIGUOUS: "Nie można jednoznacznie wskazać logu zatwierdzenia wyniku.",
  TOURNAMENT_FINALIZATION_INCONSISTENT: "Finalizacja turnieju jest niespójna z wynikiem meczu.",
};

export class RevertMatchError extends Error {
  constructor(public readonly code: RevertMatchErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "RevertMatchError";
  }
}

export interface RevertMatchInput {
  matchId: number;
  expectedTournamentId?: number;
  expectedCompletionActionId?: number;
}

export interface RevertMatchTestHooks {
  /** Test-only fault seam. It is never wired to HTTP input, headers, or environment variables. */
  afterMatchReset?: () => void | Promise<void>;
}

export interface RevertMatchResult {
  match: typeof matchesTable.$inferSelect;
  completionAction: typeof actionLogTable.$inferSelect;
  revertAction: typeof actionLogTable.$inferSelect;
}

type LockedPlayer = typeof playersTable.$inferSelect;

function requireConsistentLegacyResult(match: typeof matchesTable.$inferSelect): {
  winnerId: number | null;
  loserId: number | null;
  isDraw: boolean;
} {
  if (
    match.score1 == null ||
    match.score2 == null ||
    !Number.isInteger(match.score1) ||
    !Number.isInteger(match.score2) ||
    match.score1 < 0 ||
    match.score2 < 0 ||
    match.completedAt == null
  ) {
    throw new RevertMatchError("RESULT_INCONSISTENT");
  }

  if (match.isDraw === true) {
    if (match.winnerId != null || match.score1 !== match.score2) {
      throw new RevertMatchError("RESULT_INCONSISTENT");
    }
    return { winnerId: null, loserId: null, isDraw: true };
  }

  if (
    match.isDraw !== false ||
    match.winnerId == null ||
    match.player1Id == null ||
    match.player2Id == null ||
    match.score1 === match.score2
  ) {
    throw new RevertMatchError("RESULT_INCONSISTENT");
  }

  const scoreWinnerId = match.score1 > match.score2 ? match.player1Id : match.player2Id;
  if (match.winnerId !== scoreWinnerId) {
    throw new RevertMatchError("RESULT_INCONSISTENT");
  }

  return {
    winnerId: match.winnerId,
    loserId: match.winnerId === match.player1Id ? match.player2Id : match.player1Id,
    isDraw: false,
  };
}

function requireRevertibleStatistics(params: {
  participants: LockedPlayer[];
  winnerId: number | null;
  loserId: number | null;
  isDraw: boolean;
  singleElimination: boolean;
}): void {
  const playersById = new Map(params.participants.map((player) => [player.id, player]));

  if (params.isDraw) {
    if (params.participants.some((player) => player.draws < 1 || player.points < 1)) {
      throw new RevertMatchError("STATISTICS_INCONSISTENT");
    }
    return;
  }

  const winner = params.winnerId == null ? null : playersById.get(params.winnerId);
  const loser = params.loserId == null ? null : playersById.get(params.loserId);
  if (!winner || !loser || winner.wins < 1 || winner.points < 3 || loser.losses < 1) {
    throw new RevertMatchError("STATISTICS_INCONSISTENT");
  }
  if (params.singleElimination && loser.status !== "eliminated") {
    throw new RevertMatchError("STATISTICS_INCONSISTENT");
  }
}

function historyMatchesCurrentResult(
  history: typeof resultHistoryTable.$inferSelect,
  match: typeof matchesTable.$inferSelect,
): boolean {
  return (
    history.tournamentId === match.tournamentId &&
    history.round === match.round &&
    history.matchNumber === match.matchNumber &&
    history.player1Id === match.player1Id &&
    history.player2Id === match.player2Id &&
    history.score1 === match.score1 &&
    history.score2 === match.score2 &&
    history.winnerId === match.winnerId &&
    history.isDraw === match.isDraw &&
    history.status === "completed"
  );
}

function completionLogMatches(
  action: typeof actionLogTable.$inferSelect,
  matchId: number,
): boolean {
  if (!action.undoPayload) return false;
  try {
    const payload = JSON.parse(action.undoPayload) as Record<string, unknown>;
    return payload.type === "revert_match" && payload.matchId === matchId;
  } catch {
    return false;
  }
}

/**
 * Reverts exactly one legacy CompleteMatch revision in a single transaction.
 * Lock order mirrors CompleteMatch: tournament, match, participants, downstream,
 * then the history and action-log records that prove the current revision.
 */
export async function revertMatch(
  input: RevertMatchInput,
  testHooks: RevertMatchTestHooks = {},
): Promise<RevertMatchResult> {
  return db.transaction(async (tx) => {
    const [matchReference] = await tx
      .select({ id: matchesTable.id, tournamentId: matchesTable.tournamentId })
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId));
    if (!matchReference) throw new RevertMatchError("MATCH_NOT_FOUND");
    if (
      input.expectedTournamentId != null &&
      matchReference.tournamentId !== input.expectedTournamentId
    ) {
      throw new RevertMatchError("TOURNAMENT_MISMATCH");
    }

    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, matchReference.tournamentId))
      .for("update");
    if (!tournament) throw new RevertMatchError("TOURNAMENT_NOT_FOUND");

    const [match] = await tx
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId))
      .for("update");
    if (!match) throw new RevertMatchError("MATCH_NOT_FOUND");
    if (match.status !== "completed") throw new RevertMatchError("MATCH_NOT_COMPLETED");
    if (match.player1Id == null || match.player2Id == null) {
      throw new RevertMatchError("RESULT_INCONSISTENT");
    }
    if (match.player1Id === match.player2Id) {
      throw new RevertMatchError("RESULT_INCONSISTENT");
    }

    const result = requireConsistentLegacyResult(match);
    const participants = await tx
      .select()
      .from(playersTable)
      .where(inArray(playersTable.id, [match.player1Id, match.player2Id]))
      .orderBy(playersTable.id)
      .for("update");
    if (participants.length !== 2) throw new RevertMatchError("PARTICIPANT_NOT_FOUND");
    if (participants.some((player) => player.tournamentId !== match.tournamentId)) {
      throw new RevertMatchError("PARTICIPANT_TOURNAMENT_MISMATCH");
    }

    const isElimination = tournament.format !== "round_robin" && tournament.format !== "swiss";
    requireRevertibleStatistics({
      participants,
      winnerId: result.winnerId,
      loserId: result.loserId,
      isDraw: result.isDraw,
      singleElimination: tournament.format === "single_elimination",
    });

    if (tournament.format === "swiss") {
      const laterPairings = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.tournamentId, match.tournamentId),
            gt(matchesTable.round, match.round),
          ),
        )
        .orderBy(matchesTable.round, matchesTable.matchNumber, matchesTable.id)
        .for("update");
      if (
        laterPairings.length > 0 ||
        (tournament.currentRound != null && tournament.currentRound > match.round)
      ) {
        throw new RevertMatchError("DOWNSTREAM_BLOCKED");
      }
    }

    let downstreamMatch: typeof matchesTable.$inferSelect | null = null;
    let downstreamSlot: "player1" | "player2" | null = null;
    if (isElimination && result.winnerId != null) {
      if (match.round < 1 || match.matchNumber < 1) {
        throw new RevertMatchError("RESULT_INCONSISTENT");
      }
      const nextRoundReferences = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.tournamentId, match.tournamentId),
            eq(matchesTable.round, match.round + 1),
          ),
        )
        .orderBy(matchesTable.matchNumber);
      const nextMatchIndex = Math.floor((match.matchNumber - 1) / 2);
      const nextReference = nextRoundReferences[nextMatchIndex];

      if (!nextReference && tournament.totalRounds != null && match.round < tournament.totalRounds) {
        throw new RevertMatchError("DOWNSTREAM_BLOCKED");
      }
      if (nextReference) {
        [downstreamMatch] = await tx
          .select()
          .from(matchesTable)
          .where(eq(matchesTable.id, nextReference.id))
          .for("update");
        if (!downstreamMatch) throw new RevertMatchError("MATCH_NOT_FOUND");

        const advancesToPlayer1 = (match.matchNumber - 1) % 2 === 0;
        const expectedSlotPlayer = advancesToPlayer1
          ? downstreamMatch.player1Id
          : downstreamMatch.player2Id;
        const otherSlotPlayer = advancesToPlayer1
          ? downstreamMatch.player2Id
          : downstreamMatch.player1Id;
        const downstreamIsPristine =
          downstreamMatch.status === "pending" &&
          downstreamMatch.score1 == null &&
          downstreamMatch.score2 == null &&
          downstreamMatch.winnerId == null &&
          downstreamMatch.isDraw !== true &&
          downstreamMatch.completedAt == null;

        if (
          !downstreamIsPristine ||
          expectedSlotPlayer !== result.winnerId ||
          otherSlotPlayer === result.winnerId
        ) {
          throw new RevertMatchError("DOWNSTREAM_BLOCKED");
        }
        downstreamSlot = advancesToPlayer1 ? "player1" : "player2";
      }
    }

    let finalizedWinner: LockedPlayer | null = null;
    const shouldReopenElimination =
      isElimination && downstreamMatch == null && tournament.status === "completed";
    const shouldReopenRoundRobin =
      tournament.format === "round_robin" && tournament.status === "completed";
    if (shouldReopenElimination) {
      if (result.winnerId == null || tournament.winnerId !== result.winnerId) {
        throw new RevertMatchError("TOURNAMENT_FINALIZATION_INCONSISTENT");
      }
      finalizedWinner = participants.find((player) => player.id === tournament.winnerId) ?? null;
    } else if (shouldReopenRoundRobin) {
      if (tournament.winnerId == null) {
        throw new RevertMatchError("TOURNAMENT_FINALIZATION_INCONSISTENT");
      }
      finalizedWinner = participants.find((player) => player.id === tournament.winnerId) ?? null;
      if (!finalizedWinner) {
        [finalizedWinner] = await tx
          .select()
          .from(playersTable)
          .where(eq(playersTable.id, tournament.winnerId))
          .for("update");
      }
    } else if (
      (isElimination || tournament.format === "round_robin") &&
      tournament.status !== "completed" &&
      tournament.winnerId != null
    ) {
      throw new RevertMatchError("TOURNAMENT_FINALIZATION_INCONSISTENT");
    } else if (isElimination && downstreamMatch != null && tournament.status === "completed") {
      throw new RevertMatchError("TOURNAMENT_FINALIZATION_INCONSISTENT");
    }

    if (
      finalizedWinner &&
      (finalizedWinner.tournamentId !== tournament.id || finalizedWinner.status !== "winner")
    ) {
      throw new RevertMatchError("TOURNAMENT_FINALIZATION_INCONSISTENT");
    }
    if ((shouldReopenElimination || shouldReopenRoundRobin) && !finalizedWinner) {
      throw new RevertMatchError("PARTICIPANT_NOT_FOUND");
    }

    const [latestHistory] = await tx
      .select()
      .from(resultHistoryTable)
      .where(eq(resultHistoryTable.matchId, match.id))
      .orderBy(desc(resultHistoryTable.id))
      .limit(1)
      .for("update");
    if (!latestHistory) throw new RevertMatchError("RESULT_HISTORY_NOT_FOUND");
    if (!historyMatchesCurrentResult(latestHistory, match)) {
      throw new RevertMatchError("HISTORY_INCONSISTENT");
    }

    const activeCompletionActions = await tx
      .select()
      .from(actionLogTable)
      .where(
        and(
          eq(actionLogTable.tournamentId, match.tournamentId),
          eq(actionLogTable.matchId, match.id),
          eq(actionLogTable.actionType, "match_result_submitted"),
          eq(actionLogTable.isUndone, false),
        ),
      )
      .orderBy(desc(actionLogTable.id))
      .limit(2)
      .for("update");
    if (activeCompletionActions.length === 0) {
      throw new RevertMatchError("COMPLETION_ALREADY_UNDONE");
    }
    if (activeCompletionActions.length !== 1) {
      throw new RevertMatchError("COMPLETION_LOG_AMBIGUOUS");
    }
    const completionAction = activeCompletionActions[0];
    if (!completionLogMatches(completionAction, match.id)) {
      throw new RevertMatchError("COMPLETION_LOG_AMBIGUOUS");
    }
    if (
      input.expectedCompletionActionId != null &&
      completionAction.id !== input.expectedCompletionActionId
    ) {
      throw new RevertMatchError("UNDO_ACTION_CHANGED");
    }

    if (result.isDraw) {
      const updatedParticipants = await tx
        .update(playersTable)
        .set({
          draws: sql`${playersTable.draws} - 1`,
          points: sql`${playersTable.points} - 1`,
        })
        .where(
          and(
            inArray(playersTable.id, [match.player1Id, match.player2Id]),
            eq(playersTable.tournamentId, match.tournamentId),
          ),
        )
        .returning({ id: playersTable.id });
      if (updatedParticipants.length !== 2) {
        throw new RevertMatchError("CONCURRENT_MODIFICATION");
      }
    } else {
      const [updatedWinner] = await tx
        .update(playersTable)
        .set({
          wins: sql`${playersTable.wins} - 1`,
          points: sql`${playersTable.points} - 3`,
        })
        .where(
          and(
            eq(playersTable.id, result.winnerId!),
            eq(playersTable.tournamentId, match.tournamentId),
          ),
        )
        .returning({ id: playersTable.id });
      const [updatedLoser] = await tx
        .update(playersTable)
        .set({
          losses: sql`${playersTable.losses} - 1`,
          ...(tournament.format === "single_elimination" ? { status: "active" as const } : {}),
        })
        .where(
          and(
            eq(playersTable.id, result.loserId!),
            eq(playersTable.tournamentId, match.tournamentId),
          ),
        )
        .returning({ id: playersTable.id });
      if (!updatedWinner || !updatedLoser) {
        throw new RevertMatchError("CONCURRENT_MODIFICATION");
      }
    }

    if (downstreamMatch && downstreamSlot) {
      const [clearedDownstream] = await tx
        .update(matchesTable)
        .set(downstreamSlot === "player1" ? { player1Id: null } : { player2Id: null })
        .where(eq(matchesTable.id, downstreamMatch.id))
        .returning({ id: matchesTable.id });
      if (!clearedDownstream) throw new RevertMatchError("CONCURRENT_MODIFICATION");
    }

    const [revertedMatch] = await tx
      .update(matchesTable)
      .set({
        status: "pending",
        score1: null,
        score2: null,
        winnerId: null,
        isDraw: false,
        completedAt: null,
      })
      .where(and(eq(matchesTable.id, match.id), eq(matchesTable.status, "completed")))
      .returning();
    if (!revertedMatch) throw new RevertMatchError("CONCURRENT_MODIFICATION");

    await testHooks.afterMatchReset?.();

    if (shouldReopenElimination || shouldReopenRoundRobin) {
      const [reopenedTournament] = await tx
        .update(tournamentsTable)
        .set({ status: "active", winnerId: null })
        .where(
          and(
            eq(tournamentsTable.id, tournament.id),
            eq(tournamentsTable.status, "completed"),
          ),
        )
        .returning({ id: tournamentsTable.id });
      const [reactivatedWinner] = await tx
        .update(playersTable)
        .set({ status: "active" })
        .where(
          and(
            eq(playersTable.id, finalizedWinner!.id),
            eq(playersTable.tournamentId, tournament.id),
            eq(playersTable.status, "winner"),
          ),
        )
        .returning({ id: playersTable.id });
      if (!reopenedTournament || !reactivatedWinner) {
        throw new RevertMatchError("CONCURRENT_MODIFICATION");
      }
    }

    const [undoneCompletionAction] = await tx
      .update(actionLogTable)
      .set({ isUndone: true })
      .where(
        and(
          eq(actionLogTable.id, completionAction.id),
          eq(actionLogTable.isUndone, false),
        ),
      )
      .returning();
    if (!undoneCompletionAction) {
      throw new RevertMatchError("CONCURRENT_MODIFICATION");
    }

    const [revertAction] = await tx
      .insert(actionLogTable)
      .values({
        tournamentId: match.tournamentId,
        actionType: "match_result_reverted",
        description: `Cofnięto ${completionAction.description}`,
        matchId: match.id,
        undoPayload: null,
        isUndone: false,
      })
      .returning();

    return {
      match: revertedMatch,
      completionAction: undoneCompletionAction,
      revertAction,
    };
  });
}
