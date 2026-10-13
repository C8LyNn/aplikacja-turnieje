import { and, desc, eq, inArray, ne } from "drizzle-orm";
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
import {
  validatePlayedSeriesResult,
  type SeriesResultErrorCode,
} from "../../domain/match/series-result";
import { calculateMatchRecordStandings } from "../../domain/tournament/standings";
import {
  revalidateTournamentMutationActor,
  type TournamentMutationActor,
} from "../../access-policy";
import {
  advanceDoubleEliminationFromCanonicalMatch,
  lockDoubleEliminationRuntime,
} from "../stages/double-elimination-match-runtime";

export type CompleteMatchErrorCode =
  | "MATCH_NOT_FOUND"
  | "TOURNAMENT_NOT_FOUND"
  | "PARTICIPANT_NOT_FOUND"
  | "MATCH_ALREADY_FINALIZED"
  | "CONCURRENT_MODIFICATION"
  | "INVALID_MATCH_REVISION"
  | "MATCH_STATE_NOT_COMPLETABLE"
  | "PARTICIPANTS_REQUIRED"
  | "PARTICIPANTS_NOT_DISTINCT"
  | "PARTICIPANT_TOURNAMENT_MISMATCH"
  | "WINNER_NOT_PARTICIPANT"
  | "NO_CONTEST_REQUIRES_RESOLUTION"
  | "RESULT_TYPE_NOT_PUBLIC"
  | SeriesResultErrorCode;

const ERROR_MESSAGES: Record<CompleteMatchErrorCode, string> = {
  MATCH_NOT_FOUND: "Mecz nie istnieje.",
  TOURNAMENT_NOT_FOUND: "Turniej meczu nie istnieje.",
  PARTICIPANT_NOT_FOUND: "Nie znaleziono wymaganego uczestnika meczu.",
  MATCH_ALREADY_FINALIZED: "Mecz został już rozstrzygnięty.",
  CONCURRENT_MODIFICATION: "Stan meczu zmienił się. Pobierz aktualny mecz przed ponownym zapisem.",
  INVALID_MATCH_REVISION: "Zapis wymaga poprawnej wersji odczytanego meczu.",
  MATCH_STATE_NOT_COMPLETABLE: "Meczu w tym stanie nie można zakończyć.",
  PARTICIPANTS_REQUIRED: "Do tej operacji wymaganych jest dwóch uczestników.",
  PARTICIPANTS_NOT_DISTINCT: "Uczestnicy meczu muszą być różnymi graczami.",
  PARTICIPANT_TOURNAMENT_MISMATCH: "Uczestnicy nie należą do turnieju meczu.",
  WINNER_NOT_PARTICIPANT: "Zwycięzca walkowera musi być uczestnikiem meczu.",
  NO_CONTEST_REQUIRES_RESOLUTION:
    "No contest w eliminacjach nie może automatycznie wybrać awansującego.",
  RESULT_TYPE_NOT_PUBLIC: "Tego rodzaju wyniku nie można zapisać publiczną operacją CompleteMatch.",
  BEST_OF_NOT_INTEGER: "bestOf musi być liczbą całkowitą.",
  BEST_OF_NOT_POSITIVE: "bestOf musi być większe od zera.",
  BEST_OF_NOT_ODD: "bestOf musi być nieparzyste.",
  SCORE_NOT_INTEGER: "Wynik serii musi składać się z liczb całkowitych.",
  SCORE_NEGATIVE: "Wynik serii nie może być ujemny.",
  SCORE_EXCEEDS_WIN_THRESHOLD: "Wynik przekracza próg zwycięstw dla tej serii.",
  WIN_THRESHOLD_NOT_REACHED: "Jedna ze stron musi osiągnąć próg zwycięstw dla tej serii.",
  BOTH_SIDES_REACHED_WIN_THRESHOLD: "Tylko jedna strona może osiągnąć próg zwycięstw.",
};

export class CompleteMatchError extends Error {
  constructor(public readonly code: CompleteMatchErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "CompleteMatchError";
  }
}

interface CompleteMatchBaseInput {
  matchId: number;
  expectedRevision: number;
  actor?: TournamentMutationActor;
}

export interface CompletePlayedMatchInput extends CompleteMatchBaseInput {
  resultType: "played";
  score1: number;
  score2: number;
}

export interface CompleteWalkoverMatchInput extends CompleteMatchBaseInput {
  resultType: "walkover";
  winnerId: number;
  reason?: string | null;
}

export interface CompleteNoContestMatchInput extends CompleteMatchBaseInput {
  resultType: "no_contest";
  reason?: string | null;
}

export type CompleteMatchInput =
  | CompletePlayedMatchInput
  | CompleteWalkoverMatchInput
  | CompleteNoContestMatchInput;

export interface CompleteMatchTestHooks {
  /** Test-only fault seam. It is never wired to an HTTP field, header, or environment variable. */
  afterMatchUpdated?: () => void | Promise<void>;
}

interface NormalizedResult {
  resultType: "played" | "walkover" | "no_contest";
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  loserId: number | null;
  reason: string | null;
}

function normalizeResult(params: {
  input: CompleteMatchInput;
  bestOf: number;
  player1Id: number;
  player2Id: number;
  format: "single_elimination" | "double_elimination" | "round_robin" | "swiss" | "group_stage";
}): NormalizedResult {
  if (params.input.resultType === "played") {
    const validation = validatePlayedSeriesResult({
      resultType: "played",
      bestOf: params.bestOf,
      score1: params.input.score1,
      score2: params.input.score2,
    });
    if (!validation.ok) throw new CompleteMatchError(validation.error.code);
    const winnerId = validation.value.winnerSide === "player1"
      ? params.player1Id
      : params.player2Id;
    return {
      resultType: "played",
      score1: validation.value.score1,
      score2: validation.value.score2,
      winnerId,
      loserId: winnerId === params.player1Id ? params.player2Id : params.player1Id,
      reason: null,
    };
  }

  if (params.input.resultType === "walkover") {
    if (
      params.input.winnerId !== params.player1Id &&
      params.input.winnerId !== params.player2Id
    ) {
      throw new CompleteMatchError("WINNER_NOT_PARTICIPANT");
    }
    return {
      resultType: "walkover",
      score1: null,
      score2: null,
      winnerId: params.input.winnerId,
      loserId: params.input.winnerId === params.player1Id
        ? params.player2Id
        : params.player1Id,
      reason: params.input.reason?.trim() || null,
    };
  }

  if (params.format === "single_elimination" || params.format === "double_elimination") {
    throw new CompleteMatchError("NO_CONTEST_REQUIRES_RESOLUTION");
  }
  return {
    resultType: "no_contest",
    score1: null,
    score2: null,
    winnerId: null,
    loserId: null,
    reason: params.input.reason?.trim() || null,
  };
}

type MatchTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Completes one series_v1 result and every side effect in one transaction. */
export async function completeMatch(
  input: CompleteMatchInput,
  testHooks: CompleteMatchTestHooks = {},
  transaction?: MatchTransaction,
): Promise<typeof matchesTable.$inferSelect> {
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) {
    throw new CompleteMatchError("INVALID_MATCH_REVISION");
  }
  const perform = async (tx: MatchTransaction) => {
    const [matchReference] = await tx
      .select({
        tournamentId: matchesTable.tournamentId,
        stageId: matchesTable.stageId,
      })
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId));
    if (!matchReference) throw new CompleteMatchError("MATCH_NOT_FOUND");

    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, matchReference.tournamentId))
      .for("update");
    if (!tournament) throw new CompleteMatchError("TOURNAMENT_NOT_FOUND");
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
    if (!stage) {
      throw new CompleteMatchError("MATCH_STATE_NOT_COMPLETABLE");
    }
    const tournamentStages = await tx
      .select({ id: tournamentStagesTable.id })
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournament.id))
      .orderBy(tournamentStagesTable.position)
      .for("update");
    const isSingleStageTournament = tournamentStages.length === 1;
    const doubleEliminationRuntime = stage.format === "double_elimination"
      ? await lockDoubleEliminationRuntime(tx, tournament.id, stage)
      : null;

    const [match] = await tx
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId))
      .for("update");
    if (!match) throw new CompleteMatchError("MATCH_NOT_FOUND");
    // Check before interpreting sides/scores and before any transactional write.
    if (match.revision !== input.expectedRevision) {
      throw new CompleteMatchError("CONCURRENT_MODIFICATION");
    }
    if (stage.status !== "active") throw new CompleteMatchError("MATCH_STATE_NOT_COMPLETABLE");
    if (match.status === "completed") throw new CompleteMatchError("MATCH_ALREADY_FINALIZED");
    if (match.status === "cancelled") throw new CompleteMatchError("MATCH_STATE_NOT_COMPLETABLE");
    if (match.player1Id == null || match.player2Id == null) {
      throw new CompleteMatchError("PARTICIPANTS_REQUIRED");
    }
    if (match.player1Id === match.player2Id) {
      throw new CompleteMatchError("PARTICIPANTS_NOT_DISTINCT");
    }

    const participants = await tx
      .select()
      .from(playersTable)
      .where(inArray(playersTable.id, [match.player1Id, match.player2Id]))
      .orderBy(playersTable.id)
      .for("update");
    if (participants.length !== 2) throw new CompleteMatchError("PARTICIPANT_NOT_FOUND");
    if (participants.some((player) => player.tournamentId !== match.tournamentId)) {
      throw new CompleteMatchError("PARTICIPANT_TOURNAMENT_MISMATCH");
    }
    const stageParticipants = await tx
      .select({ playerId: stageParticipantsTable.playerId })
      .from(stageParticipantsTable)
      .where(
        and(
          eq(stageParticipantsTable.stageId, match.stageId),
          inArray(stageParticipantsTable.playerId, [match.player1Id, match.player2Id]),
        ),
      )
      .orderBy(stageParticipantsTable.playerId)
      .for("update");
    if (stageParticipants.length !== 2) {
      throw new CompleteMatchError("PARTICIPANT_NOT_FOUND");
    }

    const result = normalizeResult({
      input,
      bestOf: match.bestOf,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      format: stage.format,
    });

    let downstreamMatch: typeof matchesTable.$inferSelect | null = null;
    let downstreamSlot: "player1" | "player2" | null = null;
    if (stage.format === "single_elimination" && result.winnerId != null) {
      const nextRoundMatches = await tx
        .select()
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.stageId, match.stageId),
            eq(matchesTable.round, match.round + 1),
          ),
        )
        .orderBy(matchesTable.matchNumber);
      const nextReference = nextRoundMatches[Math.floor((match.matchNumber - 1) / 2)];
      if (nextReference) {
        [downstreamMatch] = await tx
          .select()
          .from(matchesTable)
          .where(eq(matchesTable.id, nextReference.id))
          .for("update");
        downstreamSlot = (match.matchNumber - 1) % 2 === 0 ? "player1" : "player2";
        const occupied = downstreamSlot === "player1"
          ? downstreamMatch?.player1Id
          : downstreamMatch?.player2Id;
        if (!downstreamMatch || downstreamMatch.status !== "pending" || occupied != null) {
          throw new CompleteMatchError("MATCH_STATE_NOT_COMPLETABLE");
        }
      }
    }

    const now = new Date();
    const [updatedMatch] = await tx
      .update(matchesTable)
      .set({
        status: "completed",
        resultType: result.resultType,
        resultReason: result.reason,
        score1: result.score1,
        score2: result.score2,
        winnerId: result.winnerId,
        completedAt: now,
      })
      .where(and(eq(matchesTable.id, match.id), ne(matchesTable.status, "completed")))
      .returning();
    if (!updatedMatch) throw new CompleteMatchError("MATCH_ALREADY_FINALIZED");

    await testHooks.afterMatchUpdated?.();

    if (
      stage.format === "single_elimination" &&
      result.loserId != null
    ) {
      if (isSingleStageTournament) {
        await tx
          .update(playersTable)
          .set({ status: "eliminated" })
          .where(
            and(
              eq(playersTable.id, result.loserId),
              eq(playersTable.tournamentId, match.tournamentId),
            ),
          );
      }
      await tx
        .update(stageParticipantsTable)
        .set({ status: "eliminated" })
        .where(
          and(
            eq(stageParticipantsTable.stageId, match.stageId),
            eq(stageParticipantsTable.playerId, result.loserId),
          ),
        );
    }

    const [latestHistory] = await tx
      .select({ revision: resultHistoryTable.revision })
      .from(resultHistoryTable)
      .where(eq(resultHistoryTable.matchId, match.id))
      .orderBy(desc(resultHistoryTable.revision))
      .limit(1)
      .for("update");
    await tx.insert(resultHistoryTable).values({
      matchId: match.id,
      tournamentId: match.tournamentId,
      stageId: match.stageId,
      revision: (latestHistory?.revision ?? 0) + 1,
      round: match.round,
      matchNumber: match.matchNumber,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      score1: result.score1,
      score2: result.score2,
      winnerId: result.winnerId,
      bestOf: match.bestOf,
      resultType: result.resultType,
      resultReason: result.reason,
      completedAt: now,
    });

    const names = new Map(participants.map((player) => [player.id, player.name]));
    const description = result.resultType === "played"
      ? `R${match.round}M${match.matchNumber}: ${names.get(match.player1Id)} ${result.score1}:${result.score2} ${names.get(match.player2Id)}`
      : result.resultType === "walkover"
        ? `R${match.round}M${match.matchNumber}: walkower dla ${names.get(result.winnerId!)}`
        : `R${match.round}M${match.matchNumber}: no contest`;
    await tx.insert(actionLogTable).values({
      tournamentId: match.tournamentId,
      stageId: match.stageId,
      actionType: "match_result_submitted",
      description,
      matchId: match.id,
      undoPayload: JSON.stringify({ type: "revert_match", matchId: match.id }),
      isUndone: false,
    });

    if (stage.format === "double_elimination") {
      if (result.winnerId == null || doubleEliminationRuntime == null) {
        throw new CompleteMatchError("MATCH_STATE_NOT_COMPLETABLE");
      }
      await advanceDoubleEliminationFromCanonicalMatch(tx, {
        tournamentId: tournament.id,
        stage,
        match: updatedMatch,
        winnerId: result.winnerId,
        runtime: doubleEliminationRuntime,
      });
    }

    if (downstreamMatch && downstreamSlot && result.winnerId != null) {
      await tx
        .update(matchesTable)
        .set(downstreamSlot === "player1"
          ? { player1Id: result.winnerId }
          : { player2Id: result.winnerId })
        .where(eq(matchesTable.id, downstreamMatch.id));
    }

    if (stage.format === "single_elimination") {
      if (isSingleStageTournament && !downstreamMatch && result.winnerId != null) {
        const remaining = await tx
          .select({ id: matchesTable.id })
          .from(matchesTable)
          .where(
            and(
              eq(matchesTable.stageId, match.stageId),
              ne(matchesTable.status, "completed"),
            ),
          );
        if (remaining.length === 0) {
          await tx
            .update(tournamentStagesTable)
            .set({
              status: "completed",
              winnerId: result.winnerId,
              completedAt: now,
              version: stage.version + 1,
            })
            .where(eq(tournamentStagesTable.id, stage.id));
          await tx
            .update(tournamentsTable)
            .set({ status: "completed", winnerId: result.winnerId })
            .where(eq(tournamentsTable.id, tournament.id));
          await tx
            .update(playersTable)
            .set({ status: "winner" })
            .where(eq(playersTable.id, result.winnerId));
          await tx
            .update(stageParticipantsTable)
            .set({ status: "winner" })
            .where(
              and(
                eq(stageParticipantsTable.stageId, match.stageId),
                eq(stageParticipantsTable.playerId, result.winnerId),
              ),
            );
        }
      }

      const currentRoundMatches = await tx
        .select({ status: matchesTable.status })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.stageId, match.stageId),
            eq(matchesTable.round, match.round),
          ),
        );
      if (
        currentRoundMatches.every((candidate) => candidate.status === "completed") &&
        downstreamMatch
      ) {
        await tx
          .update(tournamentStagesTable)
          .set({ currentRound: match.round + 1, version: stage.version + 1 })
          .where(eq(tournamentStagesTable.id, stage.id));
        await tx
          .update(tournamentsTable)
          .set({ currentRound: match.round + 1 })
          .where(eq(tournamentsTable.id, tournament.id));
      }
    } else if (stage.format === "round_robin" && isSingleStageTournament) {
      const allMatches = await tx
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.stageId, match.stageId));
      if (allMatches.length > 0 && allMatches.every((candidate) => candidate.status === "completed")) {
        const stagePlayerIds = await tx
          .select({ playerId: stageParticipantsTable.playerId, stageSeed: stageParticipantsTable.stageSeed })
          .from(stageParticipantsTable)
          .where(eq(stageParticipantsTable.stageId, match.stageId));
        const tournamentPlayers = await tx
          .select()
          .from(playersTable)
          .where(inArray(playersTable.id, stagePlayerIds.map(({ playerId }) => playerId)));
        const seedByPlayerId = new Map(stagePlayerIds.map(member => [member.playerId, member.stageSeed]));
        const [winner] = calculateMatchRecordStandings(
          tournamentPlayers.map(player => ({ ...player, seed: seedByPlayerId.get(player.id)! })),
          allMatches,
          "round_robin",
        );
        if (winner) {
          await tx
            .update(tournamentStagesTable)
            .set({
              status: "completed",
              winnerId: winner.playerId,
              completedAt: now,
              version: stage.version + 1,
            })
            .where(eq(tournamentStagesTable.id, stage.id));
          await tx
            .update(tournamentsTable)
            .set({ status: "completed", winnerId: winner.playerId })
            .where(eq(tournamentsTable.id, tournament.id));
          await tx
            .update(playersTable)
            .set({ status: "winner" })
            .where(eq(playersTable.id, winner.playerId));
          await tx
            .update(stageParticipantsTable)
            .set({ status: "winner" })
            .where(
              and(
                eq(stageParticipantsTable.stageId, match.stageId),
                eq(stageParticipantsTable.playerId, winner.playerId),
              ),
            );
        }
      }
    }

    return updatedMatch;
  };
  return transaction ? perform(transaction) : db.transaction(perform);
}
