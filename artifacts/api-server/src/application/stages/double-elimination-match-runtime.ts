import { and, eq, inArray, isNotNull } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchGamePicksTable,
  matchesTable,
  playersTable,
  stageParticipantsTable,
  tournamentRoutingExecutionsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  evaluateRoutingExecutionV2,
  recordRoutingMatchResultV2,
  resetRoutingExecutionV2,
  revertRoutingMatchResultV2,
  type RoutingExecutionEvaluationV2,
  type RoutingExecutionSnapshotV2,
} from "../../domain/tournament/v2";
import {
  loadCompiledRoutingPlanV2InTransaction,
  type LoadedCompiledRoutingPlan,
} from "../routing/routing-plan-persistence";

export type TournamentTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type StageRow = typeof tournamentStagesTable.$inferSelect;
type MatchRow = typeof matchesTable.$inferSelect;
type ExecutionRow = typeof tournamentRoutingExecutionsTable.$inferSelect;

export interface LockedDoubleEliminationRuntime {
  plan: LoadedCompiledRoutingPlan;
  execution: ExecutionRow;
  evaluation: RoutingExecutionEvaluationV2;
}

export async function lockDoubleEliminationRuntime(
  tx: TournamentTransaction,
  tournamentId: number,
  stage: StageRow,
): Promise<LockedDoubleEliminationRuntime> {
  const plan = await loadCompiledRoutingPlanV2InTransaction(tx, { tournamentId });
  const [execution] = await tx
    .select()
    .from(tournamentRoutingExecutionsTable)
    .where(and(
      eq(tournamentRoutingExecutionsTable.planId, plan.planId),
      eq(tournamentRoutingExecutionsTable.stageKey, stage.stageKey),
    ))
    .for("update");
  if (!execution) throw new Error("DOUBLE_ELIMINATION_EXECUTION_NOT_FOUND");
  return {
    plan,
    execution,
    evaluation: evaluateRoutingExecutionV2(
      plan.plan,
      execution.state as RoutingExecutionSnapshotV2,
    ),
  };
}

function coordinates(match: RoutingExecutionEvaluationV2["matches"][number]) {
  // The public bracket uses routing metadata. Canonical matches only require a
  // stable positive coordinate unique inside the stage.
  return { round: match.order + 1, matchNumber: 1 };
}

export async function reconcileDoubleEliminationMatches(
  tx: TournamentTransaction,
  input: {
    tournamentId: number;
    stage: StageRow;
    evaluation: RoutingExecutionEvaluationV2;
  },
): Promise<Map<string, MatchRow>> {
  const existingRows = await tx
    .select()
    .from(matchesTable)
    .where(and(
      eq(matchesTable.stageId, input.stage.id),
      isNotNull(matchesTable.routingMatchKey),
    ))
    .orderBy(matchesTable.sortOrder, matchesTable.id)
    .for("update");
  const byKey = new Map(
    existingRows.map((row) => [row.routingMatchKey!, row]),
  );

  for (const routedMatch of input.evaluation.matches) {
    const existing = byKey.get(routedMatch.matchKey);
    if (routedMatch.status === "ready") {
      const [player1Key, player2Key] = routedMatch.slots;
      const player1Id = player1Key == null ? null : Number(player1Key);
      const player2Id = player2Key == null ? null : Number(player2Key);
      if (
        player1Id == null || player2Id == null ||
        !Number.isInteger(player1Id) || !Number.isInteger(player2Id)
      ) {
        throw new Error("DOUBLE_ELIMINATION_READY_MATCH_INVALID");
      }
      const position = coordinates(routedMatch);
      if (existing) {
        if (existing.status === "completed") {
          throw new Error("DOUBLE_ELIMINATION_CANONICAL_MATCH_INCONSISTENT");
        }
        // Routing may reevaluate every ready pair after an unrelated result.
        // Preserve operator state (including swapped sides) while the pair is unchanged.
        const samePair = (existing.player1Id === player1Id && existing.player2Id === player2Id)
          || (existing.player1Id === player2Id && existing.player2Id === player1Id);
        if (samePair) continue;
        const [updated] = await tx
          .update(matchesTable)
          .set({
            player1Id,
            player2Id,
            bestOf: input.stage.bestOf,
            round: position.round,
            matchNumber: position.matchNumber,
            sortOrder: routedMatch.order,
            note: routedMatch.name ?? routedMatch.matchKey,
            status: "pending",
          })
          .where(eq(matchesTable.id, existing.id))
          .returning();
        byKey.set(routedMatch.matchKey, updated);
      } else {
        const [inserted] = await tx
          .insert(matchesTable)
          .values({
            tournamentId: input.tournamentId,
            stageId: input.stage.id,
            round: position.round,
            matchNumber: position.matchNumber,
            player1Id,
            player2Id,
            bestOf: input.stage.bestOf,
            note: routedMatch.name ?? routedMatch.matchKey,
            status: "pending",
            sortOrder: routedMatch.order,
            routingMatchKey: routedMatch.matchKey,
          })
          .returning();
        byKey.set(routedMatch.matchKey, inserted);
      }
      continue;
    }

    if (routedMatch.status === "completed") {
      if (
        !existing || existing.status !== "completed" ||
        String(existing.winnerId) !== routedMatch.winnerParticipantKey
      ) {
        throw new Error("DOUBLE_ELIMINATION_CANONICAL_MATCH_INCONSISTENT");
      }
      continue;
    }

    if (existing && existing.status !== "completed") {
      const [cleared] = await tx
        .update(matchesTable)
        .set({
          player1Id: null,
          player2Id: null,
          status: "pending",
          resultType: null,
          resultReason: null,
          score1: null,
          score2: null,
          winnerId: null,
          completedAt: null,
        })
        .where(eq(matchesTable.id, existing.id))
        .returning();
      byKey.set(routedMatch.matchKey, cleared);
    }
  }

  return byKey;
}

async function syncParticipantStatuses(
  tx: TournamentTransaction,
  stageId: number,
  evaluation: RoutingExecutionEvaluationV2,
) {
  for (const participant of evaluation.participants) {
    await tx
      .update(stageParticipantsTable)
      .set({ status: participant.status === "eliminated" ? "eliminated" : "active" })
      .where(and(
        eq(stageParticipantsTable.stageId, stageId),
        eq(stageParticipantsTable.playerId, Number(participant.participantKey)),
      ));
  }
}

export async function advanceDoubleEliminationFromCanonicalMatch(
  tx: TournamentTransaction,
  input: {
    tournamentId: number;
    stage: StageRow;
    match: MatchRow;
    winnerId: number;
    runtime: LockedDoubleEliminationRuntime;
  },
): Promise<RoutingExecutionEvaluationV2> {
  if (!input.match.routingMatchKey) {
    throw new Error("DOUBLE_ELIMINATION_CANONICAL_MATCH_KEY_MISSING");
  }
  const next = recordRoutingMatchResultV2(
    input.runtime.plan.plan,
    input.runtime.evaluation.snapshot,
    input.match.routingMatchKey,
    String(input.winnerId),
  );
  const [updated] = await tx
    .update(tournamentRoutingExecutionsTable)
    .set({
      revision: input.runtime.execution.revision + 1,
      state: next.snapshot,
      updatedAt: new Date(),
    })
    .where(and(
      eq(tournamentRoutingExecutionsTable.planId, input.runtime.execution.planId),
      eq(tournamentRoutingExecutionsTable.stageKey, input.runtime.execution.stageKey),
      eq(tournamentRoutingExecutionsTable.revision, input.runtime.execution.revision),
    ))
    .returning({ revision: tournamentRoutingExecutionsTable.revision });
  if (!updated) throw new Error("DOUBLE_ELIMINATION_EXECUTION_REVISION_CONFLICT");
  await reconcileDoubleEliminationMatches(tx, {
    tournamentId: input.tournamentId,
    stage: input.stage,
    evaluation: next,
  });
  await syncParticipantStatuses(tx, input.stage.id, next);
  return next;
}

export async function revertDoubleEliminationCanonicalMatch(
  tx: TournamentTransaction,
  input: {
    tournament: typeof tournamentsTable.$inferSelect;
    stage: StageRow;
    match: MatchRow;
    completionAction: typeof actionLogTable.$inferSelect;
    runtime: LockedDoubleEliminationRuntime;
    afterMatchReset?: () => void | Promise<void>;
  },
) {
  if (!input.match.routingMatchKey) {
    throw new Error("DOUBLE_ELIMINATION_CANONICAL_MATCH_KEY_MISSING");
  }
  const next = revertRoutingMatchResultV2(
    input.runtime.plan.plan,
    input.runtime.evaluation.snapshot,
    input.match.routingMatchKey,
  );
  const retained = new Set(next.snapshot.decisions.map((decision) => decision.matchKey));
  const invalidatedKeys = input.runtime.evaluation.snapshot.decisions
    .map((decision) => decision.matchKey)
    .filter((matchKey) => !retained.has(matchKey));
  const invalidatedMatches = invalidatedKeys.length === 0
    ? []
    : await tx
        .select()
        .from(matchesTable)
        .where(and(
          eq(matchesTable.stageId, input.stage.id),
          inArray(matchesTable.routingMatchKey, invalidatedKeys),
        ))
        .orderBy(matchesTable.sortOrder, matchesTable.id)
        .for("update");
  const invalidatedIds = invalidatedMatches.map((match) => match.id);
  if (!invalidatedIds.includes(input.match.id)) {
    throw new Error("DOUBLE_ELIMINATION_CANONICAL_MATCH_INCONSISTENT");
  }

  if (invalidatedIds.length > 0) {
    await tx.delete(matchGamePicksTable).where(inArray(matchGamePicksTable.matchId, invalidatedIds));
    await tx
      .update(actionLogTable)
      .set({ isUndone: true })
      .where(and(
        inArray(actionLogTable.matchId, invalidatedIds),
        eq(actionLogTable.actionType, "match_result_submitted"),
        eq(actionLogTable.isUndone, false),
      ));
    await tx
      .update(matchesTable)
      .set({
        status: "pending",
        player1Id: null,
        player2Id: null,
        resultType: null,
        resultReason: null,
        score1: null,
        score2: null,
        winnerId: null,
        completedAt: null,
      })
      .where(inArray(matchesTable.id, invalidatedIds));
  }
  await input.afterMatchReset?.();

  const [updatedExecution] = await tx
    .update(tournamentRoutingExecutionsTable)
    .set({
      revision: input.runtime.execution.revision + 1,
      state: next.snapshot,
      updatedAt: new Date(),
    })
    .where(and(
      eq(tournamentRoutingExecutionsTable.planId, input.runtime.execution.planId),
      eq(tournamentRoutingExecutionsTable.stageKey, input.runtime.execution.stageKey),
      eq(tournamentRoutingExecutionsTable.revision, input.runtime.execution.revision),
    ))
    .returning();
  if (!updatedExecution) throw new Error("DOUBLE_ELIMINATION_EXECUTION_REVISION_CONFLICT");
  const canonical = await reconcileDoubleEliminationMatches(tx, {
    tournamentId: input.tournament.id,
    stage: input.stage,
    evaluation: next,
  });
  await syncParticipantStatuses(tx, input.stage.id, next);

  if (input.stage.status === "completed") {
    await tx.update(stageParticipantsTable).set({
      finalRank: null,
      groupRank: null,
      qualificationRank: null,
      nextStageSeed: null,
      qualifiedAt: null,
    }).where(eq(stageParticipantsTable.stageId, input.stage.id));
    // Completion marks the terminal roster globally; reopening invalidates those final statuses.
    const playerIds = next.participants.map(participant => Number(participant.participantKey));
    if (playerIds.length > 0) {
      await tx.update(playersTable).set({ status: "active" }).where(and(
        eq(playersTable.tournamentId, input.tournament.id),
        inArray(playersTable.id, playerIds),
      ));
    }
    await tx.update(tournamentStagesTable).set({
      status: "active",
      winnerId: null,
      completedAt: null,
      version: input.stage.version + 1,
    }).where(eq(tournamentStagesTable.id, input.stage.id));
    await tx.update(tournamentsTable).set({
      status: "active",
      winnerId: null,
      activeStageId: input.stage.id,
    }).where(eq(tournamentsTable.id, input.tournament.id));
  }

  const [revertAction] = await tx.insert(actionLogTable).values({
    tournamentId: input.tournament.id,
    stageId: input.stage.id,
    matchId: input.match.id,
    actionType: "match_result_reverted",
    description: invalidatedIds.length > 1
      ? `Cofnięto wynik i unieważniono ${invalidatedIds.length - 1} zależnych wyników`
      : `Cofnięto ${input.completionAction.description}`,
    undoPayload: null,
    isUndone: false,
  }).returning();
  const revertedMatch = canonical.get(input.match.routingMatchKey);
  if (!revertedMatch) throw new Error("DOUBLE_ELIMINATION_CANONICAL_MATCH_INCONSISTENT");
  return {
    match: revertedMatch,
    completionAction: { ...input.completionAction, isUndone: true },
    revertAction,
    invalidatedResultCount: invalidatedIds.length,
  };
}

export async function resetDoubleEliminationRuntime(
  tx: TournamentTransaction,
  input: {
    tournamentId: number;
    stage: StageRow;
    expectedRevision: number;
    runtime: LockedDoubleEliminationRuntime;
  },
) {
  if (input.runtime.execution.revision !== input.expectedRevision) {
    throw new Error("DOUBLE_ELIMINATION_EXECUTION_REVISION_CONFLICT");
  }
  const matches = await tx.select().from(matchesTable).where(and(
    eq(matchesTable.stageId, input.stage.id),
    isNotNull(matchesTable.routingMatchKey),
  )).for("update");
  const ids = matches.map((match) => match.id);
  if (ids.length > 0) {
    await tx.delete(matchGamePicksTable).where(inArray(matchGamePicksTable.matchId, ids));
    await tx.update(actionLogTable).set({ isUndone: true }).where(and(
      inArray(actionLogTable.matchId, ids),
      eq(actionLogTable.actionType, "match_result_submitted"),
      eq(actionLogTable.isUndone, false),
    ));
    await tx.update(matchesTable).set({
      status: "pending",
      player1Id: null,
      player2Id: null,
      resultType: null,
      resultReason: null,
      score1: null,
      score2: null,
      winnerId: null,
      completedAt: null,
    }).where(inArray(matchesTable.id, ids));
  }
  const next = resetRoutingExecutionV2(
    input.runtime.plan.plan,
    input.runtime.evaluation.snapshot,
  );
  const [updated] = await tx.update(tournamentRoutingExecutionsTable).set({
    revision: input.runtime.execution.revision + 1,
    state: next.snapshot,
    updatedAt: new Date(),
  }).where(and(
    eq(tournamentRoutingExecutionsTable.planId, input.runtime.execution.planId),
    eq(tournamentRoutingExecutionsTable.stageKey, input.runtime.execution.stageKey),
    eq(tournamentRoutingExecutionsTable.revision, input.expectedRevision),
  )).returning({ revision: tournamentRoutingExecutionsTable.revision });
  if (!updated) throw new Error("DOUBLE_ELIMINATION_EXECUTION_REVISION_CONFLICT");
  await reconcileDoubleEliminationMatches(tx, {
    tournamentId: input.tournamentId,
    stage: input.stage,
    evaluation: next,
  });
  await syncParticipantStatuses(tx, input.stage.id, next);
  return { revision: updated.revision, invalidatedResultCount: input.runtime.evaluation.snapshot.decisions.length };
}
