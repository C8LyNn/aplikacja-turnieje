import { and, desc, eq, gt, inArray } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchesTable,
  playersTable,
  resultHistoryTable,
  stageParticipantsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import { validatePlayedSeriesResult } from "../../domain/match/series-result";
import {
  revalidateTournamentMutationActor,
  type TournamentMutationActor,
} from "../../access-policy";
import {
  lockDoubleEliminationRuntime,
  revertDoubleEliminationCanonicalMatch,
} from "../stages/double-elimination-match-runtime";

export type RevertMatchErrorCode =
  | "MATCH_NOT_FOUND"
  | "TOURNAMENT_NOT_FOUND"
  | "PARTICIPANT_NOT_FOUND"
  | "RESULT_HISTORY_NOT_FOUND"
  | "MATCH_NOT_COMPLETED"
  | "COMPLETION_ALREADY_UNDONE"
  | "UNDO_ACTION_CHANGED"
  | "DOWNSTREAM_BLOCKED"
  | "STAGE_ALREADY_ADVANCED"
  | "SYSTEM_BYE_REVERT_BLOCKED"
  | "CONCURRENT_MODIFICATION"
  | "TOURNAMENT_MISMATCH"
  | "PARTICIPANT_TOURNAMENT_MISMATCH"
  | "RESULT_INCONSISTENT"
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
  DOWNSTREAM_BLOCKED: "Kolejny mecz lub runda blokuje cofnięcie wyniku.",
  STAGE_ALREADY_ADVANCED: "Nie można cofnąć wyniku po uruchomieniu następnego etapu.",
  SYSTEM_BYE_REVERT_BLOCKED: "Systemowego bye nie można cofnąć ręcznie.",
  CONCURRENT_MODIFICATION: "Stan meczu zmienił się podczas cofania wyniku.",
  TOURNAMENT_MISMATCH: "Mecz nie należy do wskazanego turnieju.",
  PARTICIPANT_TOURNAMENT_MISMATCH: "Uczestnicy nie należą do turnieju meczu.",
  RESULT_INCONSISTENT: "Zapisany wynik meczu jest niespójny z series_v1.",
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
  actor?: TournamentMutationActor;
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

interface ConsistentResult {
  resultType: "played" | "walkover" | "no_contest";
  winnerId: number | null;
  loserId: number | null;
}

function requireConsistentResult(match: typeof matchesTable.$inferSelect): ConsistentResult {
  if (match.completedAt == null || match.resultType == null) {
    throw new RevertMatchError("RESULT_INCONSISTENT");
  }
  if (match.resultType === "bye") {
    throw new RevertMatchError("SYSTEM_BYE_REVERT_BLOCKED");
  }
  if (match.player1Id == null || match.player2Id == null || match.player1Id === match.player2Id) {
    throw new RevertMatchError("RESULT_INCONSISTENT");
  }

  if (match.resultType === "played") {
    if (match.score1 == null || match.score2 == null || match.winnerId == null) {
      throw new RevertMatchError("RESULT_INCONSISTENT");
    }
    const validation = validatePlayedSeriesResult({
      resultType: "played",
      bestOf: match.bestOf,
      score1: match.score1,
      score2: match.score2,
    });
    if (!validation.ok) throw new RevertMatchError("RESULT_INCONSISTENT");
    const expectedWinner = validation.value.winnerSide === "player1"
      ? match.player1Id
      : match.player2Id;
    if (match.winnerId !== expectedWinner || match.resultReason != null) {
      throw new RevertMatchError("RESULT_INCONSISTENT");
    }
    return {
      resultType: "played",
      winnerId: match.winnerId,
      loserId: match.winnerId === match.player1Id ? match.player2Id : match.player1Id,
    };
  }

  if (match.resultType === "walkover") {
    if (
      match.score1 != null ||
      match.score2 != null ||
      (match.winnerId !== match.player1Id && match.winnerId !== match.player2Id)
    ) {
      throw new RevertMatchError("RESULT_INCONSISTENT");
    }
    return {
      resultType: "walkover",
      winnerId: match.winnerId,
      loserId: match.winnerId === match.player1Id ? match.player2Id : match.player1Id,
    };
  }

  if (match.score1 != null || match.score2 != null || match.winnerId != null) {
    throw new RevertMatchError("RESULT_INCONSISTENT");
  }
  return { resultType: "no_contest", winnerId: null, loserId: null };
}

function historyMatchesCurrentResult(
  history: typeof resultHistoryTable.$inferSelect,
  match: typeof matchesTable.$inferSelect,
): boolean {
  return (
    history.tournamentId === match.tournamentId &&
    history.stageId === match.stageId &&
    history.round === match.round &&
    history.matchNumber === match.matchNumber &&
    history.player1Id === match.player1Id &&
    history.player2Id === match.player2Id &&
    history.score1 === match.score1 &&
    history.score2 === match.score2 &&
    history.winnerId === match.winnerId &&
    history.bestOf === match.bestOf &&
    history.resultType === match.resultType &&
    history.resultReason === match.resultReason &&
    history.completedAt.getTime() === match.completedAt?.getTime()
  );
}

function completionLogMatches(action: typeof actionLogTable.$inferSelect, matchId: number): boolean {
  if (!action.undoPayload) return false;
  try {
    const payload = JSON.parse(action.undoPayload) as Record<string, unknown>;
    return payload.type === "revert_match" && payload.matchId === matchId;
  } catch {
    return false;
  }
}

/** Reverts one series_v1 result in a transaction shared by direct revert and undo-last. */
export async function revertMatch(
  input: RevertMatchInput,
  testHooks: RevertMatchTestHooks = {},
): Promise<RevertMatchResult> {
  return db.transaction(async (tx) => {
    const [matchReference] = await tx
      .select({
        tournamentId: matchesTable.tournamentId,
        stageId: matchesTable.stageId,
      })
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId));
    if (!matchReference) throw new RevertMatchError("MATCH_NOT_FOUND");
    if (
      input.expectedTournamentId != null &&
      input.expectedTournamentId !== matchReference.tournamentId
    ) {
      throw new RevertMatchError("TOURNAMENT_MISMATCH");
    }

    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, matchReference.tournamentId))
      .for("update");
    if (!tournament) throw new RevertMatchError("TOURNAMENT_NOT_FOUND");
    await revalidateTournamentMutationActor(tx, tournament, input.actor);

    const [stage] = await tx
      .select()
      .from(tournamentStagesTable)
      .where(
        and(
          eq(tournamentStagesTable.id, matchReference.stageId),
          eq(tournamentStagesTable.tournamentId, matchReference.tournamentId),
        ),
      )
      .for("update");
    if (!stage) throw new RevertMatchError("MATCH_NOT_FOUND");
    const tournamentStages = await tx
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, stage.tournamentId))
      .orderBy(tournamentStagesTable.position)
      .for("update");
    const isSingleStageTournament = tournamentStages.length === 1;
    const nextStage = tournamentStages.find(
      (candidate) => candidate.position === stage.position + 1,
    );
    const startedLaterStage = tournamentStages.some(
      (candidate) => candidate.position > stage.position && candidate.status !== "planned",
    );
    if (startedLaterStage) throw new RevertMatchError("STAGE_ALREADY_ADVANCED");
    const doubleEliminationRuntime = stage.format === "double_elimination"
      ? await lockDoubleEliminationRuntime(tx, tournament.id, stage)
      : null;

    const [match] = await tx
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId))
      .for("update");
    if (!match) throw new RevertMatchError("MATCH_NOT_FOUND");
    if (match.status !== "completed") throw new RevertMatchError("MATCH_NOT_COMPLETED");
    const result = requireConsistentResult(match);

    const participantIds = [match.player1Id, match.player2Id].filter(
      (playerId): playerId is number => playerId != null,
    );
    const participants = await tx
      .select()
      .from(playersTable)
      .where(inArray(playersTable.id, participantIds))
      .orderBy(playersTable.id)
      .for("update");
    if (participants.length !== participantIds.length) {
      throw new RevertMatchError("PARTICIPANT_NOT_FOUND");
    }
    if (participants.some((player) => player.tournamentId !== match.tournamentId)) {
      throw new RevertMatchError("PARTICIPANT_TOURNAMENT_MISMATCH");
    }
    const stageParticipants = await tx
      .select({ playerId: stageParticipantsTable.playerId })
      .from(stageParticipantsTable)
      .where(
        and(
          eq(stageParticipantsTable.stageId, match.stageId),
          inArray(stageParticipantsTable.playerId, participantIds),
        ),
      )
      .orderBy(stageParticipantsTable.playerId)
      .for("update");
    if (stageParticipants.length !== participantIds.length) {
      throw new RevertMatchError("PARTICIPANT_NOT_FOUND");
    }
    if (
      stage.format === "single_elimination" &&
      result.loserId != null &&
      participants.find((player) => player.id === result.loserId)?.status !== "eliminated"
    ) {
      throw new RevertMatchError("RESULT_INCONSISTENT");
    }

    if (stage.format === "swiss") {
      const laterPairings = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.stageId, match.stageId),
            gt(matchesTable.round, match.round),
          ),
        )
        .orderBy(matchesTable.round, matchesTable.matchNumber, matchesTable.id)
        .for("update");
      if (
        laterPairings.length > 0 ||
        (stage.currentRound != null && stage.currentRound > match.round)
      ) {
        throw new RevertMatchError("DOWNSTREAM_BLOCKED");
      }
    }

    let downstreamMatch: typeof matchesTable.$inferSelect | null = null;
    let downstreamSlot: "player1" | "player2" | null = null;
    if (stage.format === "single_elimination" && result.winnerId != null) {
      const nextRoundMatches = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.stageId, match.stageId),
            eq(matchesTable.round, match.round + 1),
          ),
        )
        .orderBy(matchesTable.matchNumber);
      const nextReference = nextRoundMatches[Math.floor((match.matchNumber - 1) / 2)];
      if (!nextReference && match.round < (stage.totalRounds ?? match.round)) {
        throw new RevertMatchError("DOWNSTREAM_BLOCKED");
      }
      if (nextReference) {
        [downstreamMatch] = await tx
          .select()
          .from(matchesTable)
          .where(eq(matchesTable.id, nextReference.id))
          .for("update");
        if (!downstreamMatch) throw new RevertMatchError("MATCH_NOT_FOUND");
        downstreamSlot = (match.matchNumber - 1) % 2 === 0 ? "player1" : "player2";
        const expectedSlot = downstreamSlot === "player1"
          ? downstreamMatch.player1Id
          : downstreamMatch.player2Id;
        const otherSlot = downstreamSlot === "player1"
          ? downstreamMatch.player2Id
          : downstreamMatch.player1Id;
        const pristine =
          downstreamMatch.status === "pending" &&
          downstreamMatch.resultType == null &&
          downstreamMatch.resultReason == null &&
          downstreamMatch.score1 == null &&
          downstreamMatch.score2 == null &&
          downstreamMatch.winnerId == null &&
          downstreamMatch.completedAt == null;
        if (!pristine || expectedSlot !== result.winnerId || otherSlot === result.winnerId) {
          throw new RevertMatchError("DOWNSTREAM_BLOCKED");
        }
      }
    }

    const shouldReopenElimination =
      stage.format === "single_elimination" &&
      downstreamMatch == null &&
      stage.status === "completed" &&
      tournament.status === "completed";
    const shouldReopenRoundRobin =
      stage.format === "round_robin" &&
      stage.status === "completed" &&
      tournament.status === "completed";
    let finalizedWinner: typeof playersTable.$inferSelect | null = null;
    if (shouldReopenElimination) {
      if (
        result.winnerId == null ||
        stage.winnerId !== result.winnerId ||
        tournament.winnerId !== result.winnerId
      ) {
        throw new RevertMatchError("TOURNAMENT_FINALIZATION_INCONSISTENT");
      }
      finalizedWinner = participants.find((player) => player.id === tournament.winnerId) ?? null;
    } else if (shouldReopenRoundRobin) {
      if (stage.winnerId == null || tournament.winnerId !== stage.winnerId) {
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
      (stage.format === "single_elimination" ||
        stage.format === "round_robin") &&
      tournament.status !== "completed" &&
      tournament.winnerId != null
    ) {
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
      .orderBy(desc(resultHistoryTable.revision))
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

    if (stage.format === "double_elimination") {
      if (doubleEliminationRuntime == null) {
        throw new RevertMatchError("RESULT_INCONSISTENT");
      }
      return revertDoubleEliminationCanonicalMatch(tx, {
        tournament,
        stage,
        match,
        completionAction,
        runtime: doubleEliminationRuntime,
        afterMatchReset: testHooks.afterMatchReset,
      });
    }

    const shouldReopenCompletedStage =
      !isSingleStageTournament &&
      stage.status === "completed" &&
      tournament.status === "active" &&
      nextStage?.status === "planned";
    if (shouldReopenCompletedStage) {
      const targetMatches = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(eq(matchesTable.stageId, nextStage.id))
        .limit(1)
        .for("update");
      if (targetMatches.length > 0) throw new RevertMatchError("STAGE_ALREADY_ADVANCED");
      await tx.delete(stageParticipantsTable).where(eq(stageParticipantsTable.stageId, nextStage.id));
      await tx
        .update(stageParticipantsTable)
        .set({
          status: "active",
          finalRank: null,
          groupRank: null,
          qualificationRank: null,
          nextStageSeed: null,
          qualifiedAt: null,
        })
        .where(eq(stageParticipantsTable.stageId, stage.id));
      const [reopenedStage] = await tx
        .update(tournamentStagesTable)
        .set({
          status: "active",
          winnerId: null,
          completedAt: null,
          version: stage.version + 1,
        })
        .where(
          and(
            eq(tournamentStagesTable.id, stage.id),
            eq(tournamentStagesTable.status, "completed"),
          ),
        )
        .returning({ id: tournamentStagesTable.id });
      if (!reopenedStage) throw new RevertMatchError("CONCURRENT_MODIFICATION");
    }
    if (!isSingleStageTournament && (shouldReopenElimination || shouldReopenRoundRobin)) {
      await tx
        .update(stageParticipantsTable)
        .set({
          finalRank: null,
          groupRank: null,
          qualificationRank: null,
          nextStageSeed: null,
          qualifiedAt: null,
        })
        .where(eq(stageParticipantsTable.stageId, stage.id));
    }

    if (downstreamMatch && downstreamSlot) {
      const [cleared] = await tx
        .update(matchesTable)
        .set(downstreamSlot === "player1" ? { player1Id: null } : { player2Id: null })
        .where(eq(matchesTable.id, downstreamMatch.id))
        .returning({ id: matchesTable.id });
      if (!cleared) throw new RevertMatchError("CONCURRENT_MODIFICATION");
    }

    const [revertedMatch] = await tx
      .update(matchesTable)
      .set({
        status: "pending",
        resultType: null,
        resultReason: null,
        score1: null,
        score2: null,
        winnerId: null,
        completedAt: null,
      })
      .where(and(eq(matchesTable.id, match.id), eq(matchesTable.status, "completed")))
      .returning();
    if (!revertedMatch) throw new RevertMatchError("CONCURRENT_MODIFICATION");

    await testHooks.afterMatchReset?.();

    if (stage.format === "single_elimination" && result.loserId != null) {
      if (isSingleStageTournament || shouldReopenElimination) {
        const [reactivatedLoser] = await tx
          .update(playersTable)
          .set({ status: "active" })
          .where(
            and(
              eq(playersTable.id, result.loserId),
              eq(playersTable.status, "eliminated"),
            ),
          )
          .returning({ id: playersTable.id });
        if (!reactivatedLoser) throw new RevertMatchError("CONCURRENT_MODIFICATION");
      }
      await tx
        .update(stageParticipantsTable)
        .set({ status: "active" })
        .where(
          and(
            eq(stageParticipantsTable.stageId, match.stageId),
            eq(stageParticipantsTable.playerId, result.loserId),
          ),
        );
    }

    if (shouldReopenElimination || shouldReopenRoundRobin) {
      const [reopenedStage] = await tx
        .update(tournamentStagesTable)
        .set({
          status: "active",
          winnerId: null,
          completedAt: null,
          version: stage.version + 1,
        })
        .where(
          and(
            eq(tournamentStagesTable.id, stage.id),
            eq(tournamentStagesTable.status, "completed"),
          ),
        )
        .returning({ id: tournamentStagesTable.id });
      const [reopenedTournament] = await tx
        .update(tournamentsTable)
        .set({ status: "active", winnerId: null })
        .where(and(eq(tournamentsTable.id, tournament.id), eq(tournamentsTable.status, "completed")))
        .returning({ id: tournamentsTable.id });
      let reactivatedWinner: { id: number } | undefined;
      if (!isSingleStageTournament && shouldReopenRoundRobin) {
        const reactivatedPlayers = await tx
          .update(playersTable)
          .set({ status: "active" })
          .where(eq(playersTable.tournamentId, tournament.id))
          .returning({ id: playersTable.id });
        reactivatedWinner = reactivatedPlayers.find(({ id }) => id === finalizedWinner!.id);
        await tx
          .update(stageParticipantsTable)
          .set({ status: "active" })
          .where(eq(stageParticipantsTable.stageId, match.stageId));
      } else {
        [reactivatedWinner] = await tx
          .update(playersTable)
          .set({ status: "active" })
          .where(
            and(
              eq(playersTable.id, finalizedWinner!.id),
              eq(playersTable.status, "winner"),
            ),
          )
          .returning({ id: playersTable.id });
        await tx
          .update(stageParticipantsTable)
          .set({ status: "active" })
          .where(
            and(
              eq(stageParticipantsTable.stageId, match.stageId),
              eq(stageParticipantsTable.playerId, finalizedWinner!.id),
            ),
          );
      }
      if (!reopenedStage || !reopenedTournament || !reactivatedWinner) {
        throw new RevertMatchError("CONCURRENT_MODIFICATION");
      }
    }

    const [undoneCompletionAction] = await tx
      .update(actionLogTable)
      .set({ isUndone: true })
      .where(and(eq(actionLogTable.id, completionAction.id), eq(actionLogTable.isUndone, false)))
      .returning();
    if (!undoneCompletionAction) throw new RevertMatchError("CONCURRENT_MODIFICATION");

    const [revertAction] = await tx
      .insert(actionLogTable)
      .values({
        tournamentId: match.tournamentId,
        stageId: match.stageId,
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
