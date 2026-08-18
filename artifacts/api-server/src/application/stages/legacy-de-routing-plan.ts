/**
 * Auto-generation of canonical routing plans for legacy Double Elimination
 * tournaments that were created before the routing-plan requirement was
 * introduced (basket_flow_authority_version = 0, no basket configuration).
 *
 * Idempotent: calling ensureLegacyDeRoutingPlanExists multiple times is safe —
 * it exits immediately if a plan already exists.
 */
import { eq } from "drizzle-orm";
import {
  db,
  stageBasketsTable,
  tournamentRoutingPlansTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  compileTournamentBlueprintV2,
  doubleEliminationFormatEngineV2,
  TOURNAMENT_ENGINE_MODEL_VERSION,
  type CompiledTournamentRoutingPlanV2,
  type SeedAssignmentPolicyV2,
  type StagePlacementPolicyV2,
  type TournamentBlueprintV2,
} from "../../domain/tournament/v2";
import { saveCompiledRoutingPlanV2InTransaction } from "../routing/routing-plan-persistence";

type DbStage = typeof tournamentStagesTable.$inferSelect;

function buildStagePlacementPolicy(stage: DbStage): StagePlacementPolicyV2 {
  return stage.seedingPolicy === "random_bracket"
    ? { type: "random", randomSeed: stage.randomSeed ?? undefined }
    : { type: "standard_seeded_bracket", reseedEachRound: false };
}

function buildEntrySeedingPolicy(stage: DbStage): SeedAssignmentPolicyV2 {
  const policy = stage.entrySeedingPolicy;
  if (policy === "random") {
    return {
      type: "random",
      reveal: stage.randomRevealOrder,
      randomSeed: stage.randomSeed ?? undefined,
    };
  }
  if (policy === "manual") return { type: "manual" };
  if (policy === "preserve") return { type: "preserve" };
  return { type: "policy_ref", policyId: policy, settings: {} };
}

/**
 * Compiles the canonical routing plan for a standalone legacy double_elimination
 * stage (no basket configuration, single-bucket registration flow).
 *
 * Returns null if the blueprint fails to compile (should not happen for a
 * DB-valid stage, but guards against corrupt data).
 */
export function compileLegacyDeCanonicalPlan(
  stage: DbStage,
): CompiledTournamentRoutingPlanV2 | null {
  const settings: Record<string, unknown> = {
    initialPlacement:
      stage.seedingPolicy === "random_bracket" ? "random" : "standard",
    entrySeeding: stage.entrySeedingPolicy,
    randomRevealOrder: stage.randomRevealOrder,
  };
  if (stage.randomSeed != null) settings.randomSeed = stage.randomSeed;

  const blueprint: TournamentBlueprintV2 = {
    modelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    initialParticipantCount: stage.participantCount,
    buckets: [
      {
        key: "default",
        name: "Wszyscy uczestnicy",
        exactCapacity: stage.participantCount,
        priority: 0,
      },
    ],
    stages: [
      {
        key: stage.stageKey,
        name: stage.name,
        displayOrder: stage.position,
        capacity: { type: "exact", count: stage.participantCount },
        selectionCapabilities: { type: "none" },
        format: { id: "double_elimination", rulesVersion: 1, settings },
        matchRules: { bestOf: stage.bestOf },
        classification: {
          type: "format_default",
          policyId: "elimination_bracket_v1",
        },
      },
    ],
    transitions: [
      {
        key: "registration-to-first-stage",
        source: { type: "registration", bucketKey: "default" },
        target: { stageKey: stage.stageKey },
        selection: { type: "all" },
        seedAssignment: buildEntrySeedingPolicy(stage),
        placement: buildStagePlacementPolicy(stage),
        reservedSlots: stage.participantCount,
        priority: 0,
      },
    ],
  };

  const result = compileTournamentBlueprintV2(blueprint, [
    doubleEliminationFormatEngineV2,
  ]);
  return result.valid ? result.value : null;
}

/**
 * Returns true when the tournament qualifies for automatic routing-plan
 * generation: non-basket-authority (version 0) AND no basket rows in the DB.
 */
export function isLegacyDeAutoGeneratable(
  basketFlowAuthorityVersion: number,
  hasBaskets: boolean,
): boolean {
  return basketFlowAuthorityVersion === 0 && !hasBaskets;
}

/**
 * Idempotently ensures a routing plan exists for a legacy double_elimination
 * tournament.  Exits immediately when:
 *   - a plan already exists, OR
 *   - the tournament is basket-authoritative (version ≠ 0), OR
 *   - the tournament has explicit basket configuration.
 *
 * Acquires row-level locks so concurrent calls for the same tournament
 * serialize safely.
 */
export async function ensureLegacyDeRoutingPlanExists(
  tournamentId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    // Idempotence: exit immediately if any plan already exists.
    const [existingPlan] = await tx
      .select({ id: tournamentRoutingPlansTable.id })
      .from(tournamentRoutingPlansTable)
      .where(eq(tournamentRoutingPlansTable.tournamentId, tournamentId))
      .for("update")
      .limit(1);
    if (existingPlan) return;

    // Load tournament and check auto-generation eligibility.
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, tournamentId))
      .for("update");
    if (!tournament) return;
    // Basket-authoritative tournaments must have their plan created explicitly.
    if (tournament.basketFlowAuthorityVersion !== 0) return;

    // Find the DE stage (must exist and be planned).
    const stages = await tx
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournamentId))
      .for("update");
    const deStage = stages.find((s) => s.format === "double_elimination");
    if (!deStage) return;
    if (stages.some((s) => s.status !== "planned")) return;

    // Belt-and-suspenders: no basket rows allowed for canonical auto-generation.
    const [basket] = await tx
      .select({ id: stageBasketsTable.id })
      .from(stageBasketsTable)
      .where(eq(stageBasketsTable.tournamentId, tournamentId))
      .limit(1);
    if (basket) return;

    // Compile and persist the canonical routing plan.
    const compiled = compileLegacyDeCanonicalPlan(deStage);
    if (!compiled) return; // Corrupt data guard — should not happen in practice.

    await saveCompiledRoutingPlanV2InTransaction(tx, {
      tournamentId,
      plan: compiled,
      stageIdsByKey: { [deStage.stageKey]: deStage.id },
      sourceKind: "legacy-de-auto",
    });
  });
}
