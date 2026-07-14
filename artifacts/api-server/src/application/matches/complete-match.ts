import { and, eq, inArray, sql } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchesTable,
  playersTable,
  resultHistoryTable,
  tournamentsTable,
} from "@workspace/db";

export type CompleteMatchErrorCode =
  | "MATCH_NOT_FOUND"
  | "TOURNAMENT_NOT_FOUND"
  | "PARTICIPANT_NOT_FOUND"
  | "MATCH_ALREADY_FINALIZED"
  | "MATCH_STATE_NOT_COMPLETABLE"
  | "PARTICIPANTS_REQUIRED"
  | "PARTICIPANTS_NOT_DISTINCT"
  | "PARTICIPANT_TOURNAMENT_MISMATCH"
  | "WINNER_NOT_PARTICIPANT"
  | "SCORE_NOT_INTEGER"
  | "SCORE_NEGATIVE"
  | "DRAW_NOT_ALLOWED"
  | "DRAW_WITH_WINNER"
  | "DRAW_SCORE_MISMATCH"
  | "NON_DRAW_SCORE_TIED"
  | "WINNER_SCORE_MISMATCH";

const ERROR_MESSAGES: Record<CompleteMatchErrorCode, string> = {
  MATCH_NOT_FOUND: "Mecz nie istnieje.",
  TOURNAMENT_NOT_FOUND: "Turniej meczu nie istnieje.",
  PARTICIPANT_NOT_FOUND: "Nie znaleziono wymaganego uczestnika meczu.",
  MATCH_ALREADY_FINALIZED: "Mecz został już rozstrzygnięty.",
  MATCH_STATE_NOT_COMPLETABLE: "Meczu w tym stanie nie można zakończyć zwykłym wynikiem.",
  PARTICIPANTS_REQUIRED: "Do zakończenia meczu wymaganych jest dwóch uczestników.",
  PARTICIPANTS_NOT_DISTINCT: "Uczestnicy meczu muszą być różnymi graczami.",
  PARTICIPANT_TOURNAMENT_MISMATCH: "Uczestnicy nie należą do turnieju meczu.",
  WINNER_NOT_PARTICIPANT: "Zwycięzca musi być uczestnikiem meczu.",
  SCORE_NOT_INTEGER: "Wynik musi składać się z liczb całkowitych.",
  SCORE_NEGATIVE: "Wynik nie może być ujemny.",
  DRAW_NOT_ALLOWED: "Remisy nie są dozwolone w tym turnieju.",
  DRAW_WITH_WINNER: "Remis nie może wskazywać zwycięzcy.",
  DRAW_SCORE_MISMATCH: "Remis wymaga równego wyniku.",
  NON_DRAW_SCORE_TIED: "Nieremisowy wynik nie może być równy.",
  WINNER_SCORE_MISMATCH: "Zwycięzca nie odpowiada wyższemu wynikowi.",
};

export class CompleteMatchError extends Error {
  constructor(public readonly code: CompleteMatchErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "CompleteMatchError";
  }
}

export interface CompleteMatchInput {
  matchId: number;
  score1: number;
  score2: number;
  winnerId?: number | null;
  isDraw?: boolean;
  note?: string | null;
}

export interface CompleteMatchTestHooks {
  /** Test-only fault seam. It is never wired to an HTTP field, header, or environment variable. */
  afterMatchUpdated?: () => void | Promise<void>;
}

interface NormalizedLegacyResult {
  score1: number;
  score2: number;
  winnerId: number | null;
  loserId: number | null;
  isDraw: boolean;
}

function validateLegacyResult(params: {
  score1: number;
  score2: number;
  winnerId?: number | null;
  isDraw: boolean;
  allowDraws: boolean;
  player1Id: number;
  player2Id: number;
}): NormalizedLegacyResult {
  if (!Number.isInteger(params.score1) || !Number.isInteger(params.score2)) {
    throw new CompleteMatchError("SCORE_NOT_INTEGER");
  }
  if (params.score1 < 0 || params.score2 < 0) {
    throw new CompleteMatchError("SCORE_NEGATIVE");
  }

  if (params.isDraw) {
    if (!params.allowDraws) throw new CompleteMatchError("DRAW_NOT_ALLOWED");
    if (params.winnerId != null) throw new CompleteMatchError("DRAW_WITH_WINNER");
    if (params.score1 !== params.score2) throw new CompleteMatchError("DRAW_SCORE_MISMATCH");
    return {
      score1: params.score1,
      score2: params.score2,
      winnerId: null,
      loserId: null,
      isDraw: true,
    };
  }

  if (params.score1 === params.score2) {
    throw new CompleteMatchError("NON_DRAW_SCORE_TIED");
  }

  const scoreWinnerId = params.score1 > params.score2 ? params.player1Id : params.player2Id;
  const winnerId = params.winnerId ?? scoreWinnerId;
  if (winnerId !== params.player1Id && winnerId !== params.player2Id) {
    throw new CompleteMatchError("WINNER_NOT_PARTICIPANT");
  }
  if (winnerId !== scoreWinnerId) {
    throw new CompleteMatchError("WINNER_SCORE_MISMATCH");
  }

  return {
    score1: params.score1,
    score2: params.score2,
    winnerId,
    loserId: winnerId === params.player1Id ? params.player2Id : params.player1Id,
    isDraw: false,
  };
}

/**
 * Completes one legacy match and all of its existing 3/1/0 side effects in a
 * single PostgreSQL transaction. The tournament row is locked before the match
 * row so every CompleteMatch in a tournament follows one deterministic order.
 */
export async function completeMatch(
  input: CompleteMatchInput,
  testHooks: CompleteMatchTestHooks = {},
): Promise<typeof matchesTable.$inferSelect> {
  return db.transaction(async (tx) => {
    const [matchReference] = await tx
      .select({ id: matchesTable.id, tournamentId: matchesTable.tournamentId })
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId));
    if (!matchReference) throw new CompleteMatchError("MATCH_NOT_FOUND");

    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, matchReference.tournamentId))
      .for("update");
    if (!tournament) throw new CompleteMatchError("TOURNAMENT_NOT_FOUND");

    const [match] = await tx
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.id, input.matchId))
      .for("update");
    if (!match) throw new CompleteMatchError("MATCH_NOT_FOUND");

    if (match.status === "completed" || match.status === "walkover") {
      throw new CompleteMatchError("MATCH_ALREADY_FINALIZED");
    }
    if (match.status === "cancelled" || match.status === "bye") {
      throw new CompleteMatchError("MATCH_STATE_NOT_COMPLETABLE");
    }
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
    if (participants.length !== 2) {
      throw new CompleteMatchError("PARTICIPANT_NOT_FOUND");
    }
    if (participants.some((player) => player.tournamentId !== match.tournamentId)) {
      throw new CompleteMatchError("PARTICIPANT_TOURNAMENT_MISMATCH");
    }
    if (
      input.winnerId != null &&
      input.winnerId !== match.player1Id &&
      input.winnerId !== match.player2Id
    ) {
      throw new CompleteMatchError("WINNER_NOT_PARTICIPANT");
    }

    const result = validateLegacyResult({
      score1: input.score1,
      score2: input.score2,
      winnerId: input.winnerId,
      isDraw: input.isDraw ?? false,
      allowDraws: tournament.allowDraws ?? false,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
    });
    const now = new Date();

    const [updatedMatch] = await tx
      .update(matchesTable)
      .set({
        winnerId: result.winnerId,
        score1: result.score1,
        score2: result.score2,
        isDraw: result.isDraw,
        status: "completed",
        note: input.note ?? null,
        completedAt: now,
      })
      .where(eq(matchesTable.id, match.id))
      .returning();
    if (!updatedMatch) throw new CompleteMatchError("MATCH_NOT_FOUND");

    await testHooks.afterMatchUpdated?.();

    if (result.isDraw) {
      await tx
        .update(playersTable)
        .set({
          draws: sql`${playersTable.draws} + 1`,
          points: sql`${playersTable.points} + 1`,
        })
        .where(
          and(
            inArray(playersTable.id, [match.player1Id, match.player2Id]),
            eq(playersTable.tournamentId, match.tournamentId),
          ),
        );
    } else if (result.winnerId != null && result.loserId != null) {
      await tx
        .update(playersTable)
        .set({
          wins: sql`${playersTable.wins} + 1`,
          points: sql`${playersTable.points} + 3`,
        })
        .where(
          and(
            eq(playersTable.id, result.winnerId),
            eq(playersTable.tournamentId, match.tournamentId),
          ),
        );

      await tx
        .update(playersTable)
        .set({
          losses: sql`${playersTable.losses} + 1`,
          ...(tournament.format === "single_elimination" ? { status: "eliminated" as const } : {}),
        })
        .where(
          and(
            eq(playersTable.id, result.loserId),
            eq(playersTable.tournamentId, match.tournamentId),
          ),
        );
    }

    await tx.insert(resultHistoryTable).values({
      matchId: match.id,
      tournamentId: match.tournamentId,
      round: match.round,
      matchNumber: match.matchNumber,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      score1: result.score1,
      score2: result.score2,
      winnerId: result.winnerId,
      isDraw: result.isDraw,
      status: "completed",
    });

    const participantNames = new Map(participants.map((player) => [player.id, player.name]));
    const player1Name = participantNames.get(match.player1Id) ?? "TBD";
    const player2Name = participantNames.get(match.player2Id) ?? "TBD";
    const resultText = result.isDraw
      ? `Remis ${result.score1}:${result.score2}`
      : `Wynik: ${player1Name} ${result.score1}:${result.score2} ${player2Name}`;
    const winnerName = result.winnerId == null ? null : participantNames.get(result.winnerId);
    const description = winnerName ? `${resultText} — wygrał ${winnerName}` : resultText;

    await tx.insert(actionLogTable).values({
      tournamentId: match.tournamentId,
      actionType: "match_result_submitted",
      description: `R${match.round}M${match.matchNumber}: ${description}`,
      matchId: match.id,
      undoPayload: JSON.stringify({ type: "revert_match", matchId: match.id }),
      isUndone: false,
    });

    if (tournament.format !== "round_robin" && tournament.format !== "swiss") {
      const nextRound = match.round + 1;
      const nextRoundMatches = await tx
        .select()
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.tournamentId, match.tournamentId),
            eq(matchesTable.round, nextRound),
          ),
        )
        .orderBy(matchesTable.matchNumber);
      const nextMatchIndex = Math.floor((match.matchNumber - 1) / 2);
      const nextMatch = nextRoundMatches[nextMatchIndex];

      if (nextMatch && result.winnerId != null) {
        const advancesToPlayer1 = (match.matchNumber - 1) % 2 === 0;
        await tx
          .update(matchesTable)
          .set(advancesToPlayer1 ? { player1Id: result.winnerId } : { player2Id: result.winnerId })
          .where(eq(matchesTable.id, nextMatch.id));
      } else if (!nextMatch && result.winnerId != null) {
        const remaining = await tx
          .select({ id: matchesTable.id })
          .from(matchesTable)
          .where(
            and(
              eq(matchesTable.tournamentId, match.tournamentId),
              sql`${matchesTable.status} NOT IN ('completed', 'bye', 'walkover')`,
            ),
          );
        if (remaining.length === 0) {
          await tx
            .update(tournamentsTable)
            .set({ status: "completed", winnerId: result.winnerId })
            .where(eq(tournamentsTable.id, match.tournamentId));
          await tx
            .update(playersTable)
            .set({ status: "winner" })
            .where(eq(playersTable.id, result.winnerId));
        }
      }

      const currentRoundMatches = await tx
        .select({ status: matchesTable.status })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.tournamentId, match.tournamentId),
            eq(matchesTable.round, match.round),
          ),
        );
      const allCurrentRoundMatchesDone = currentRoundMatches.every(
        (currentMatch) =>
          currentMatch.status === "completed" ||
          currentMatch.status === "bye" ||
          currentMatch.status === "walkover",
      );
      if (allCurrentRoundMatchesDone && nextRoundMatches.length > 0) {
        await tx
          .update(tournamentsTable)
          .set({ currentRound: nextRound })
          .where(eq(tournamentsTable.id, match.tournamentId));
      }
    } else if (tournament.format === "round_robin") {
      const allMatches = await tx
        .select({ status: matchesTable.status })
        .from(matchesTable)
        .where(eq(matchesTable.tournamentId, match.tournamentId));
      const allMatchesDone = allMatches.every(
        (roundRobinMatch) =>
          roundRobinMatch.status === "completed" ||
          roundRobinMatch.status === "bye" ||
          roundRobinMatch.status === "walkover",
      );
      if (allMatchesDone) {
        const tournamentPlayers = await tx
          .select()
          .from(playersTable)
          .where(eq(playersTable.tournamentId, match.tournamentId));
        const topPlayer = tournamentPlayers.reduce((currentTop, candidate) =>
          currentTop.points > candidate.points ? currentTop : candidate,
        );
        await tx
          .update(tournamentsTable)
          .set({ status: "completed", winnerId: topPlayer.id })
          .where(eq(tournamentsTable.id, match.tournamentId));
        await tx
          .update(playersTable)
          .set({ status: "winner" })
          .where(eq(playersTable.id, topPlayer.id));
      }
    }

    return updatedMatch;
  });
}
