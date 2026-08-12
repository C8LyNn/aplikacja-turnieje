import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchesTable,
  playersTable,
  stageParticipantsTable,
  tournamentRoutingExecutionsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  evaluateRoutingExecutionV2,
  revertRoutingMatchResultV2,
  type RoutingExecutionEvaluationV2,
  type RoutingExecutionSnapshotV2,
} from "../../domain/tournament/v2";
import {
  revalidateTournamentMutationActor,
  type TournamentMutationActor,
} from "../../access-policy";
import {
  loadCompiledRoutingPlanV2,
  type LoadedCompiledRoutingPlan,
} from "../routing/routing-plan-persistence";
import {
  lockDoubleEliminationRuntime,
  resetDoubleEliminationRuntime,
} from "./double-elimination-match-runtime";

export type DoubleEliminationStageErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_NOT_FOUND"
  | "DOUBLE_ELIMINATION_NOT_ACTIVE"
  | "DOUBLE_ELIMINATION_EXECUTION_NOT_FOUND"
  | "EXECUTION_REVISION_CONFLICT";

export class DoubleEliminationStageError extends Error {
  constructor(public readonly code: DoubleEliminationStageErrorCode) {
    super(code);
    this.name = "DoubleEliminationStageError";
  }
}

function bracketOf(name: string | undefined): "upper" | "lower" | "grand_final" | "grand_final_reset" {
  if (name === "Grand Final Reset") return "grand_final_reset";
  if (name === "Grand Final") return "grand_final";
  if (name?.startsWith("Lower ")) return "lower";
  return "upper";
}

function roundOf(name: string | undefined): number {
  const match = name?.match(/\bR(\d+)\b/);
  return match ? Number(match[1]) : 1;
}

function matchNumberOf(name: string | undefined): number {
  const match = name?.match(/\bM(\d+)\b/);
  return match ? Number(match[1]) : 1;
}

async function stageContext(tournamentId: number, stageId: number) {
  const [stage] = await db.select().from(tournamentStagesTable).where(and(
    eq(tournamentStagesTable.id, stageId),
    eq(tournamentStagesTable.tournamentId, tournamentId),
  ));
  if (!stage || stage.format !== "double_elimination") {
    throw new DoubleEliminationStageError("STAGE_NOT_FOUND");
  }
  const plan = await loadCompiledRoutingPlanV2({ tournamentId });
  return { stage, plan };
}

async function serialize(
  tournamentId: number,
  stageId: number,
  revision: number,
  evaluation: RoutingExecutionEvaluationV2,
  plan: LoadedCompiledRoutingPlan["plan"],
) {
  const memberships = await db.select().from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.stageId, stageId))
    .orderBy(asc(stageParticipantsTable.stageSeed));
  const players = memberships.length === 0 ? [] : await db.select().from(playersTable)
    .where(inArray(playersTable.id, memberships.map((entry) => entry.playerId)));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const participantByKey = new Map(memberships.map((entry) => [String(entry.playerId), {
    participantKey: String(entry.playerId),
    playerId: entry.playerId,
    name: playerById.get(entry.playerId)?.name ?? `#${entry.playerId}`,
    seed: entry.stageSeed,
  }]));
  const canonicalMatches = await db.select().from(matchesTable).where(and(
    eq(matchesTable.stageId, stageId),
    isNotNull(matchesTable.routingMatchKey),
  ));
  const canonicalByKey = new Map(canonicalMatches.map((match) => [match.routingMatchKey!, match]));
  return {
    tournamentId,
    stageId,
    revision,
    completed: evaluation.completed,
    championParticipantKey: evaluation.championParticipantKey,
    participants: evaluation.participants.map((participant) => ({
      ...participantByKey.get(participant.participantKey)!,
      losses: participant.losses,
      status: participant.status,
    })),
    matches: evaluation.matches.map((match) => {
      const canonical = canonicalByKey.get(match.matchKey);
      let downstreamResultCount = 0;
      if (match.status === "completed") {
        const reverted = revertRoutingMatchResultV2(
          plan,
          evaluation.snapshot,
          match.matchKey,
        );
        downstreamResultCount = Math.max(
          0,
          evaluation.snapshot.decisions.length - reverted.snapshot.decisions.length - 1,
        );
      }
      return {
        matchKey: match.matchKey,
        matchId: canonical?.id ?? null,
        name: match.name ?? match.matchKey,
        bracket: bracketOf(match.name),
        round: roundOf(match.name),
        matchNumber: matchNumberOf(match.name),
        order: match.order,
        slots: match.slots,
        status: match.status,
        bestOf: canonical?.bestOf ?? null,
        score1: canonical?.score1 ?? null,
        score2: canonical?.score2 ?? null,
        downstreamResultCount,
        winnerParticipantKey: match.winnerParticipantKey,
        loserParticipantKey: match.loserParticipantKey,
      };
    }),
  };
}

export async function getDoubleEliminationStageState(input: {
  tournamentId: number;
  stageId: number;
}) {
  const { stage, plan } = await stageContext(input.tournamentId, input.stageId);
  const [row] = await db.select().from(tournamentRoutingExecutionsTable).where(and(
    eq(tournamentRoutingExecutionsTable.planId, plan.planId),
    eq(tournamentRoutingExecutionsTable.stageKey, stage.stageKey),
  ));
  if (!row) throw new DoubleEliminationStageError("DOUBLE_ELIMINATION_EXECUTION_NOT_FOUND");
  return serialize(
    input.tournamentId,
    input.stageId,
    row.revision,
    evaluateRoutingExecutionV2(plan.plan, row.state as RoutingExecutionSnapshotV2),
    plan.plan,
  );
}

export async function resetDoubleEliminationStage(input: {
  tournamentId: number;
  stageId: number;
  expectedRevision: number;
  actor?: TournamentMutationActor;
}) {
  const { stage } = await stageContext(input.tournamentId, input.stageId);
  return db.transaction(async (tx) => {
    const [tournament] = await tx.select().from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId)).for("update");
    if (!tournament) throw new DoubleEliminationStageError("TOURNAMENT_NOT_FOUND");
    await revalidateTournamentMutationActor(tx, tournament, input.actor);
    const [lockedStage] = await tx.select().from(tournamentStagesTable).where(and(
      eq(tournamentStagesTable.id, stage.id),
      eq(tournamentStagesTable.tournamentId, tournament.id),
    )).for("update");
    if (!lockedStage || lockedStage.format !== "double_elimination") {
      throw new DoubleEliminationStageError("STAGE_NOT_FOUND");
    }
    if (lockedStage.status !== "active" || tournament.activeStageId !== lockedStage.id) {
      throw new DoubleEliminationStageError("DOUBLE_ELIMINATION_NOT_ACTIVE");
    }
    let runtime;
    try {
      runtime = await lockDoubleEliminationRuntime(tx, tournament.id, lockedStage);
    } catch (error) {
      if (error instanceof Error && error.message === "DOUBLE_ELIMINATION_EXECUTION_NOT_FOUND") {
        throw new DoubleEliminationStageError("DOUBLE_ELIMINATION_EXECUTION_NOT_FOUND");
      }
      throw error;
    }
    let receipt;
    try {
      receipt = await resetDoubleEliminationRuntime(tx, {
        tournamentId: tournament.id,
        stage: lockedStage,
        expectedRevision: input.expectedRevision,
        runtime,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "DOUBLE_ELIMINATION_EXECUTION_REVISION_CONFLICT") {
        throw new DoubleEliminationStageError("EXECUTION_REVISION_CONFLICT");
      }
      throw error;
    }
    await tx.insert(actionLogTable).values({
      tournamentId: tournament.id,
      stageId: lockedStage.id,
      matchId: null,
      actionType: "double_elimination_reset",
      description: "Zresetowano drabinkę Double Elimination",
      undoPayload: null,
      isUndone: false,
    });
    return receipt;
  });
}
