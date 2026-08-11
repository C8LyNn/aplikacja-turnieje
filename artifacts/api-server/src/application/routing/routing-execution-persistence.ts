import { and, eq } from "drizzle-orm";
import { db, tournamentRoutingExecutionsTable } from "@workspace/db";
import {
  correctRoutingMatchResultV2,
  evaluateRoutingExecutionV2,
  recordRoutingMatchResultV2,
  resetRoutingExecutionV2,
  type RoutingExecutionEvaluationV2,
  type RoutingExecutionSnapshotV2,
} from "../../domain/tournament/v2/routing-execution";
import { loadCompiledRoutingPlanV2 } from "./routing-plan-persistence";

export class RoutingExecutionPersistenceError extends Error {
  constructor(
    public readonly code:
      | "EXECUTION_NOT_FOUND"
      | "EXECUTION_ALREADY_EXISTS"
      | "EXECUTION_REVISION_CONFLICT",
  ) {
    super(code);
    this.name = "RoutingExecutionPersistenceError";
  }
}

export interface PersistedRoutingExecutionV2 {
  planId: number;
  stageKey: string;
  revision: number;
  evaluation: RoutingExecutionEvaluationV2;
}

function snapshotJson(snapshot: RoutingExecutionSnapshotV2): RoutingExecutionSnapshotV2 {
  return structuredClone(snapshot);
}

export async function createPersistedRoutingExecutionV2(input: {
  planId: number;
  snapshot: RoutingExecutionSnapshotV2;
}): Promise<PersistedRoutingExecutionV2> {
  const loadedPlan = await loadCompiledRoutingPlanV2({ planId: input.planId });
  const evaluation = evaluateRoutingExecutionV2(loadedPlan.plan, input.snapshot);
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ planId: tournamentRoutingExecutionsTable.planId })
      .from(tournamentRoutingExecutionsTable)
      .where(and(
        eq(tournamentRoutingExecutionsTable.planId, input.planId),
        eq(tournamentRoutingExecutionsTable.stageKey, evaluation.snapshot.stageKey),
      ))
      .for("update");
    if (existing.length > 0) {
      throw new RoutingExecutionPersistenceError("EXECUTION_ALREADY_EXISTS");
    }
    const [row] = await tx
      .insert(tournamentRoutingExecutionsTable)
      .values({
        planId: input.planId,
        stageKey: evaluation.snapshot.stageKey,
        state: snapshotJson(evaluation.snapshot),
      })
      .returning({ revision: tournamentRoutingExecutionsTable.revision });
    return { planId: input.planId, stageKey: evaluation.snapshot.stageKey, revision: row.revision, evaluation };
  });
}

export async function loadPersistedRoutingExecutionV2(input: {
  planId: number;
  stageKey: string;
}): Promise<PersistedRoutingExecutionV2> {
  const loadedPlan = await loadCompiledRoutingPlanV2({ planId: input.planId });
  const [row] = await db
    .select()
    .from(tournamentRoutingExecutionsTable)
    .where(and(
      eq(tournamentRoutingExecutionsTable.planId, input.planId),
      eq(tournamentRoutingExecutionsTable.stageKey, input.stageKey),
    ));
  if (!row) throw new RoutingExecutionPersistenceError("EXECUTION_NOT_FOUND");
  const snapshot = row.state as RoutingExecutionSnapshotV2;
  return {
    planId: input.planId,
    stageKey: input.stageKey,
    revision: row.revision,
    evaluation: evaluateRoutingExecutionV2(loadedPlan.plan, snapshot),
  };
}

export async function updatePersistedRoutingExecutionV2(input: {
  planId: number;
  expectedRevision: number;
  snapshot: RoutingExecutionSnapshotV2;
}): Promise<PersistedRoutingExecutionV2> {
  const loadedPlan = await loadCompiledRoutingPlanV2({ planId: input.planId });
  const evaluation = evaluateRoutingExecutionV2(loadedPlan.plan, input.snapshot);
  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ revision: tournamentRoutingExecutionsTable.revision })
      .from(tournamentRoutingExecutionsTable)
      .where(and(
        eq(tournamentRoutingExecutionsTable.planId, input.planId),
        eq(tournamentRoutingExecutionsTable.stageKey, evaluation.snapshot.stageKey),
      ))
      .for("update");
    if (!locked) throw new RoutingExecutionPersistenceError("EXECUTION_NOT_FOUND");
    if (locked.revision !== input.expectedRevision) {
      throw new RoutingExecutionPersistenceError("EXECUTION_REVISION_CONFLICT");
    }
    const [row] = await tx
      .update(tournamentRoutingExecutionsTable)
      .set({
        revision: locked.revision + 1,
        state: snapshotJson(evaluation.snapshot),
        updatedAt: new Date(),
      })
      .where(and(
        eq(tournamentRoutingExecutionsTable.planId, input.planId),
        eq(tournamentRoutingExecutionsTable.stageKey, evaluation.snapshot.stageKey),
        eq(tournamentRoutingExecutionsTable.revision, input.expectedRevision),
      ))
      .returning({ revision: tournamentRoutingExecutionsTable.revision });
    if (!row) throw new RoutingExecutionPersistenceError("EXECUTION_REVISION_CONFLICT");
    return {
      planId: input.planId,
      stageKey: evaluation.snapshot.stageKey,
      revision: row.revision,
      evaluation,
    };
  });
}

interface PersistedExecutionMutationInput {
  planId: number;
  stageKey: string;
  expectedRevision: number;
}

async function loadForMutation(input: PersistedExecutionMutationInput) {
  const persisted = await loadPersistedRoutingExecutionV2(input);
  if (persisted.revision !== input.expectedRevision) {
    throw new RoutingExecutionPersistenceError("EXECUTION_REVISION_CONFLICT");
  }
  const loadedPlan = await loadCompiledRoutingPlanV2({ planId: input.planId });
  return { persisted, plan: loadedPlan.plan };
}

export async function recordPersistedRoutingMatchResultV2(
  input: PersistedExecutionMutationInput & {
    matchKey: string;
    winnerParticipantKey: string;
  },
): Promise<PersistedRoutingExecutionV2> {
  const { persisted, plan } = await loadForMutation(input);
  const next = recordRoutingMatchResultV2(
    plan,
    persisted.evaluation.snapshot,
    input.matchKey,
    input.winnerParticipantKey,
  );
  return updatePersistedRoutingExecutionV2({
    planId: input.planId,
    expectedRevision: input.expectedRevision,
    snapshot: next.snapshot,
  });
}

export async function correctPersistedRoutingMatchResultV2(
  input: PersistedExecutionMutationInput & {
    matchKey: string;
    winnerParticipantKey: string;
  },
): Promise<PersistedRoutingExecutionV2> {
  const { persisted, plan } = await loadForMutation(input);
  const next = correctRoutingMatchResultV2(
    plan,
    persisted.evaluation.snapshot,
    input.matchKey,
    input.winnerParticipantKey,
  );
  return updatePersistedRoutingExecutionV2({
    planId: input.planId,
    expectedRevision: input.expectedRevision,
    snapshot: next.snapshot,
  });
}

export async function resetPersistedRoutingExecutionV2(
  input: PersistedExecutionMutationInput,
): Promise<PersistedRoutingExecutionV2> {
  const { persisted, plan } = await loadForMutation(input);
  const next = resetRoutingExecutionV2(plan, persisted.evaluation.snapshot);
  return updatePersistedRoutingExecutionV2({
    planId: input.planId,
    expectedRevision: input.expectedRevision,
    snapshot: next.snapshot,
  });
}
