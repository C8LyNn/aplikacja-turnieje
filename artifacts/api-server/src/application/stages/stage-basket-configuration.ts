import { and, asc, eq, inArray } from "drizzle-orm";
import {
  db,
  playersTable,
  stageBasketParticipantsTable,
  stageBasketRoutesTable,
  stageBasketsTable,
  stageParticipantsTable,
  tournamentRoutingPlansTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  deriveStageBasketFlowCounts,
  defaultStageBasketId,
  defaultStageBasketRouteId,
  validateStageBasketConfiguration,
  type StageBasketConfigurationInput,
  type StageBasketDefinition,
  type StageBasketProblem,
  type StageBasketRouteDefinition,
} from "../../domain/tournament/stage-baskets";
import { validateTournamentStagePlan } from "../../domain/tournament/tournament-stage-plan";
import type { TournamentMutationActor } from "../../access-policy";
import { revalidateTournamentMutationActor } from "../../access-policy";
import { compileBasketAuthorityRoutingPlan } from "./basket-authority-routing-plan";
import { saveCompiledRoutingPlanV2InTransaction } from "../routing/routing-plan-persistence";

type StageBasketTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type StageBasketConfigurationErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_BASKET_CONFIGURATION_IMMUTABLE"
  | "STAGE_BASKET_CONFIGURATION_INVALID"
  | "STAGE_BASKET_ID_REASSIGNED";

export class StageBasketConfigurationError extends Error {
  constructor(
    public readonly code: StageBasketConfigurationErrorCode,
    public readonly problems: readonly StageBasketProblem[] = [],
  ) {
    super(
      code === "TOURNAMENT_NOT_FOUND"
        ? "Tournament not found."
        : code === "STAGE_BASKET_CONFIGURATION_IMMUTABLE"
          ? "Stage basket configuration cannot be changed after tournament start."
          : code === "STAGE_BASKET_ID_REASSIGNED"
            ? "A stable basket id cannot be moved to another stage."
            : "Stage basket configuration is invalid.",
    );
    this.name = "StageBasketConfigurationError";
  }
}

export interface StageBasketConfiguration {
  tournamentId: number;
  legacyDefaulted: boolean;
  flowAuthority: "legacy" | "basket_v1";
  baskets: StageBasketDefinition[];
  routes: StageBasketRouteDefinition[];
  validation: {
    valid: boolean;
    problems: StageBasketProblem[];
  };
}

export async function loadStageBasketConfigurationInTransaction(
  tx: StageBasketTransaction,
  tournamentId: number,
): Promise<StageBasketConfiguration> {
  const [tournament] = await tx
    .select({
      basketFlowAuthorityVersion:
        tournamentsTable.basketFlowAuthorityVersion,
    })
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  const stages = await tx
    .select()
    .from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.tournamentId, tournamentId))
    .orderBy(asc(tournamentStagesTable.position));
  const storedBaskets = await tx
    .select()
    .from(stageBasketsTable)
    .where(eq(stageBasketsTable.tournamentId, tournamentId))
    .orderBy(
      asc(stageBasketsTable.stageId),
      asc(stageBasketsTable.basketType),
      asc(stageBasketsTable.displayOrder),
    );
  const storedRoutes = await tx
    .select()
    .from(stageBasketRoutesTable)
    .where(eq(stageBasketRoutesTable.tournamentId, tournamentId))
    .orderBy(asc(stageBasketRoutesTable.id));
  const assignments = await tx
    .select()
    .from(stageBasketParticipantsTable)
    .where(eq(stageBasketParticipantsTable.tournamentId, tournamentId))
    .orderBy(
      asc(stageBasketParticipantsTable.stageId),
      asc(stageBasketParticipantsTable.basketId),
      asc(stageBasketParticipantsTable.playerId),
    );
  const memberships = await tx
    .select()
    .from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.tournamentId, tournamentId))
    .orderBy(
      asc(stageParticipantsTable.stageId),
      asc(stageParticipantsTable.stageSeed),
    );
  const players = await tx
    .select({ id: playersTable.id })
    .from(playersTable)
    .where(eq(playersTable.tournamentId, tournamentId))
    .orderBy(asc(playersTable.id));

  const baskets: StageBasketDefinition[] = [];
  const legacyDefaulted = storedBaskets.length === 0;
  const flowAuthority =
    tournament?.basketFlowAuthorityVersion === 1 ? "basket_v1" : "legacy";
  if (legacyDefaulted) {
    // For legacy implicit configs we derive qualifierCount from the stage's
    // linear `advancingCount` field:
    //   - Non-terminal stage with advancingCount set → qualifierCount = advancingCount
    //   - Terminal stage (last by position, qualificationMode = 'none')   → null
    //   - Non-terminal stage with advancingCount = null (e.g. group stage) → null
    //     (ambiguous: advancing count is derived from group parameters, not
    //      a single integer; stop and describe rather than guess).
    const sortedStageIds = stages
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => s.id);
    const terminalStageId = sortedStageIds[sortedStageIds.length - 1];
    for (const stage of stages) {
      const stageMemberships = memberships.filter(
        (membership) => membership.stageId === stage.id,
      );
      const legacyQualifierCount: number | null =
        stage.id === terminalStageId
          ? null
          : (stage.advancingCount ?? null);
      baskets.push(
        {
          id: defaultStageBasketId(stage.id, "input"),
          stageId: stage.id,
          type: "input",
          ordinal: 1,
          order: 1,
          colorId: null,
          participantIds: stageMemberships.map(
            (membership) => membership.playerId,
          ),
          qualifierCount: null,
        },
        {
          id: defaultStageBasketId(stage.id, "output"),
          stageId: stage.id,
          type: "output",
          ordinal: 1,
          order: 1,
          colorId: null,
          participantIds: [],
          qualifierCount: legacyQualifierCount,
        },
      );
    }
  } else {
    baskets.push(
      ...storedBaskets.map((basket) => ({
        id: basket.id,
        stageId: basket.stageId,
        type: basket.basketType as "input" | "output",
        ordinal: basket.ordinal,
        order: basket.displayOrder,
        colorId: basket.colorId,
        participantIds:
          basket.basketType === "input"
            ? assignments
                .filter((assignment) => assignment.basketId === basket.id)
                .map((assignment) => assignment.playerId)
            : [],
        qualifierCount: basket.qualifierCount ?? null,
      })),
    );
  }
  const routes = legacyDefaulted
    ? stages.slice(0, -1).map((stage, index) => {
        const target = stages[index + 1];
        return {
          id: defaultStageBasketRouteId(stage.id, target.id),
          sourceBasketId: defaultStageBasketId(stage.id, "output"),
          targetBasketId: defaultStageBasketId(target.id, "input"),
        };
      })
    : storedRoutes.map((route) => ({
        id: route.id,
        sourceBasketId: route.sourceBasketId,
        targetBasketId: route.targetBasketId,
      }));
  const validationInput: StageBasketConfigurationInput = {
    stages: stages.map((stage) => ({
      id: stage.id,
      position: stage.position,
      participantCount: stage.participantCount,
    })),
    playerIds: players.map((player) => player.id),
    baskets,
    routes,
  };
  return {
    tournamentId,
    legacyDefaulted,
    flowAuthority,
    baskets,
    routes,
    // Stored Phase 1-3 basket graphs remain on legacy flow authority until a
    // successful Phase 3.5 save explicitly persists the version marker.
    validation: validateStageBasketConfiguration(
      validationInput,
      flowAuthority === "basket_v1" ? "explicit" : "legacy",
    ),
  };
}

function basketAuthorityStagePlan(
  stages: readonly (typeof tournamentStagesTable.$inferSelect)[],
  derivedCounts: ReturnType<typeof deriveStageBasketFlowCounts>,
): unknown {
  return {
    initialParticipantCount:
      derivedCounts.get(stages[0]?.id ?? -1)?.derivedParticipantCount ?? 0,
    stages: stages.map((stage) => {
      const counts = derivedCounts.get(stage.id)!;
      const advancingCount =
        stage.qualificationMode === "top_n"
          ? counts.outputQualifierCount
          : null;
      return {
        key: stage.stageKey,
        position: stage.position,
        name: stage.name,
        format: stage.format,
        participantCount: counts.derivedParticipantCount,
        bestOf: stage.bestOf,
        ...(stage.format === "swiss"
          ? { rounds: stage.plannedRounds }
          : {}),
        ...((stage.format === "swiss" ||
          stage.format === "round_robin" ||
          stage.format === "single_elimination") &&
        advancingCount != null
          ? { advancingCount }
          : {}),
        ...(stage.format === "group_stage"
          ? {
              groupCount: stage.groupCount,
              participantsPerGroup:
                stage.groupCount == null
                  ? null
                  : Math.ceil(
                      counts.derivedParticipantCount / stage.groupCount,
                    ),
              qualifiersPerGroup: stage.qualifiersPerGroup,
              placementMethod:
                stage.seedingPolicy === "random_groups" ? "random" : "snake",
              resultSeedingMethod:
                stage.resultSeedingPolicy === "global_ranking"
                  ? "global_ranking"
                  : "rank_bands",
            }
          : {}),
        ...(stage.format === "single_elimination" ||
        stage.format === "double_elimination"
          ? {
              placementMethod:
                stage.seedingPolicy === "random_bracket"
                  ? "random"
                  : "standard",
            }
          : {}),
        entrySeedingMethod: stage.entrySeedingPolicy,
        randomSeed: stage.randomSeed ?? undefined,
        randomRevealOrder: stage.randomRevealOrder,
      };
    }),
  };
}

export async function getStageBasketConfiguration(
  tournamentId: number,
): Promise<StageBasketConfiguration> {
  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .select({ id: tournamentsTable.id })
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, tournamentId));
    if (!tournament)
      throw new StageBasketConfigurationError("TOURNAMENT_NOT_FOUND");
    return loadStageBasketConfigurationInTransaction(tx, tournamentId);
  });
}

export async function replaceStageBasketConfiguration(input: {
  tournamentId: number;
  baskets: readonly StageBasketDefinition[];
  routes: readonly StageBasketRouteDefinition[];
  actor?: TournamentMutationActor;
}): Promise<StageBasketConfiguration> {
  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId))
      .for("update");
    if (!tournament)
      throw new StageBasketConfigurationError("TOURNAMENT_NOT_FOUND");
    await revalidateTournamentMutationActor(tx, tournament, input.actor);
    const stages = await tx
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournament.id))
      .orderBy(asc(tournamentStagesTable.position))
      .for("update");
    if (
      tournament.status !== "draft" ||
      stages.some((stage) => stage.status !== "planned")
    ) {
      throw new StageBasketConfigurationError(
        "STAGE_BASKET_CONFIGURATION_IMMUTABLE",
      );
    }
    const players = await tx
      .select({ id: playersTable.id })
      .from(playersTable)
      .where(eq(playersTable.tournamentId, tournament.id))
      .for("update");
    // Use explicit mode: every output basket must carry a positive qualifierCount.
    // PUT always receives an explicit organizer-authored configuration; legacy
    // implicit baskets never reach this path.
    const validation = validateStageBasketConfiguration(
      {
        stages: stages.map((stage) => ({
          id: stage.id,
          position: stage.position,
          participantCount: stage.participantCount,
        })),
        playerIds: players.map((player) => player.id),
        baskets: input.baskets,
        routes: input.routes,
      },
      "explicit",
    );
    if (!validation.valid) {
      throw new StageBasketConfigurationError(
        "STAGE_BASKET_CONFIGURATION_INVALID",
        validation.problems,
      );
    }
    const authorityInput: StageBasketConfigurationInput = {
      stages: stages.map((stage) => ({
        id: stage.id,
        position: stage.position,
        participantCount: stage.participantCount,
      })),
      playerIds: players.map((player) => player.id),
      baskets: input.baskets,
      routes: input.routes,
    };
    const derivedCounts = deriveStageBasketFlowCounts(authorityInput);
    const stagePlanValidation = validateTournamentStagePlan(
      basketAuthorityStagePlan(stages, derivedCounts),
      { participantFlowAuthority: "basket_v1" },
    );
    if (!stagePlanValidation.valid) {
      throw new StageBasketConfigurationError(
        "STAGE_BASKET_CONFIGURATION_INVALID",
        [],
      );
    }

    const projectedStages = stages.map((stage) => {
      const counts = derivedCounts.get(stage.id)!;
      return {
        ...stage,
        participantCount: counts.derivedParticipantCount,
        advancingCount:
          stage.qualificationMode === "top_n"
            ? counts.outputQualifierCount
            : null,
        participantsPerGroup:
          stage.format === "group_stage" && stage.groupCount != null
            ? Math.ceil(counts.derivedParticipantCount / stage.groupCount)
            : stage.participantsPerGroup,
      };
    });
    const requiresCompiledPlan = projectedStages.some(
      (stage) => stage.format === "double_elimination",
    );
    const compiledPlan = requiresCompiledPlan
      ? compileBasketAuthorityRoutingPlan(
          projectedStages,
          input.baskets,
          input.routes,
        )
      : null;
    if (compiledPlan != null && !compiledPlan.valid) {
      throw new StageBasketConfigurationError(
        "STAGE_BASKET_CONFIGURATION_INVALID",
        [],
      );
    }

    const requestedIds = input.baskets.map((basket) => basket.id);
    const existingRequested =
      requestedIds.length === 0
        ? []
        : await tx
            .select()
            .from(stageBasketsTable)
            .where(
              and(
                eq(stageBasketsTable.tournamentId, tournament.id),
                inArray(stageBasketsTable.id, requestedIds),
              ),
            )
            .for("update");
    const requestedById = new Map(
      input.baskets.map((basket) => [basket.id, basket]),
    );
    if (
      existingRequested.some((basket) => {
        const requested = requestedById.get(basket.id);
        return !requested || basket.stageId !== requested.stageId;
      })
    ) {
      throw new StageBasketConfigurationError("STAGE_BASKET_ID_REASSIGNED");
    }

    await tx
      .delete(stageBasketRoutesTable)
      .where(eq(stageBasketRoutesTable.tournamentId, tournament.id));
    await tx
      .delete(stageBasketParticipantsTable)
      .where(eq(stageBasketParticipantsTable.tournamentId, tournament.id));
    await tx
      .delete(stageBasketsTable)
      .where(eq(stageBasketsTable.tournamentId, tournament.id));

    await tx.insert(stageBasketsTable).values(
      input.baskets.map((basket) => ({
        id: basket.id,
        tournamentId: tournament.id,
        stageId: basket.stageId,
        basketType: basket.type,
        ordinal: basket.ordinal,
        displayOrder: basket.order,
        colorId: basket.colorId,
        qualifierCount: basket.type === "output" ? basket.qualifierCount : null,
      })),
    );
    const participantAssignments = input.baskets
      .filter((candidate) => candidate.type === "input")
      .flatMap((basket) =>
        basket.participantIds.map((playerId) => ({
          tournamentId: tournament.id,
          stageId: basket.stageId,
          basketId: basket.id,
          playerId,
        })),
      );
    if (participantAssignments.length > 0) {
      await tx
        .insert(stageBasketParticipantsTable)
        .values(participantAssignments);
    }

    const basketById = new Map(
      input.baskets.map((basket) => [basket.id, basket]),
    );
    if (input.routes.length > 0) {
      await tx.insert(stageBasketRoutesTable).values(
        input.routes.map((route) => ({
          id: route.id,
          tournamentId: tournament.id,
          sourceStageId: basketById.get(route.sourceBasketId)!.stageId,
          sourceBasketId: route.sourceBasketId,
          targetStageId: basketById.get(route.targetBasketId)!.stageId,
          targetBasketId: route.targetBasketId,
        })),
      );
    }
    for (const stage of projectedStages) {
      await tx
        .update(tournamentStagesTable)
        .set({
          participantCount: stage.participantCount,
          advancingCount: stage.advancingCount,
          participantsPerGroup: stage.participantsPerGroup,
          version: stage.version + 1,
        })
        .where(eq(tournamentStagesTable.id, stage.id));
    }
    if (compiledPlan?.valid) {
      const existingPlans = await tx
        .select({ revision: tournamentRoutingPlansTable.revision })
        .from(tournamentRoutingPlansTable)
        .where(eq(tournamentRoutingPlansTable.tournamentId, tournament.id))
        .orderBy(asc(tournamentRoutingPlansTable.revision))
        .for("update");
      await saveCompiledRoutingPlanV2InTransaction(tx, {
        tournamentId: tournament.id,
        revision: (existingPlans.at(-1)?.revision ?? 0) + 1,
        plan: compiledPlan.value,
        stageIdsByKey: new Map(
          projectedStages.map((stage) => [stage.stageKey, stage.id]),
        ),
        sourceKind: "basket-authority-v1",
      });
    }
    await tx
      .update(tournamentsTable)
      .set({ basketFlowAuthorityVersion: 1 })
      .where(eq(tournamentsTable.id, tournament.id));
    return loadStageBasketConfigurationInTransaction(tx, tournament.id);
  });
}
