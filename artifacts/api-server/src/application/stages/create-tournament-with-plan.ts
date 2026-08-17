import { asc, eq } from "drizzle-orm";
import {
  db,
  playersTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import { calculateGroupAdvancingCount } from "../../domain/tournament/group-stage";
import {
  validateTournamentStagePlan,
  type TournamentStagePlan,
  type TournamentStagePlanProblem,
  type TournamentStagesPlan,
} from "../../domain/tournament/tournament-stage-plan";
import { replaceTournamentGameConfig } from "../games/tournament-game-config";
import type { SupportedTournamentGameConfig } from "@workspace/game-catalog";
import {
  parseTournamentGameConfig,
  TournamentGameConfigError,
} from "@workspace/game-catalog";
import { calculateMarvelRoundParticipantCounts } from "../../domain/tournament/marvel-elimination-groups";
import {
  compileV1StagePlanToRoutingV2,
  doubleEliminationFormatEngineV2,
} from "../../domain/tournament/v2";
import { saveCompiledRoutingPlanV2InTransaction } from "../routing/routing-plan-persistence";

export class TournamentStagePlanError extends Error {
  constructor(public readonly problems: TournamentStagePlanProblem[]) {
    super("Tournament stage plan is invalid.");
    this.name = "TournamentStagePlanError";
  }
}

function compatibilityFormat(
  format: TournamentStagePlan["format"],
): "swiss" | "round_robin" | "single_elimination" {
  if (format === "group_stage") return "round_robin";
  if (format === "double_elimination") return "single_elimination";
  return format;
}

function rankingPolicy(format: TournamentStagePlan["format"]) {
  switch (format) {
    case "swiss":
      return "swiss_v1" as const;
    case "round_robin":
      return "round_robin_v1" as const;
    case "group_stage":
      return "group_v1" as const;
    case "single_elimination":
    case "double_elimination":
      return "elimination_bracket_v1" as const;
  }
}

function persistedStage(
  tournamentId: number,
  stage: TournamentStagePlan,
  plan: TournamentStagesPlan,
): typeof tournamentStagesTable.$inferInsert {
  const final = stage.position === plan.stages.length;
  return {
    tournamentId,
    stageKey: stage.key,
    position: stage.position,
    name: stage.name,
    format: stage.format,
    status: "planned",
    participantCount: stage.participantCount,
    bestOf: stage.bestOf,
    plannedRounds: stage.format === "swiss" ? stage.rounds : null,
    currentRound: null,
    totalRounds: null,
    rankingPolicy: rankingPolicy(stage.format),
    qualificationMode: final
      ? "none"
      : stage.format === "group_stage"
        ? "top_n_per_group"
        : "top_n",
    advancingCount:
      !final && (stage.format === "swiss" || stage.format === "round_robin" || stage.format === "single_elimination")
        ? (stage.advancingCount ?? null)
        : null,
    groupCount: stage.format === "group_stage" ? stage.groupCount : null,
    participantsPerGroup:
      stage.format === "group_stage" ? stage.participantsPerGroup : null,
    qualifiersPerGroup:
      stage.format === "group_stage" ? stage.qualifiersPerGroup : null,
    seedingPolicy:
      stage.format === "group_stage"
        ? stage.placementMethod === "random" ? "random_groups" : "snake_groups"
        : stage.format === "single_elimination" || stage.format === "double_elimination"
          ? stage.placementMethod === "random" ? "random_bracket" : "standard_bracket"
          : "standings_order",
    entrySeedingPolicy: stage.entrySeedingMethod,
    resultSeedingPolicy:
      stage.format === "group_stage"
        ? stage.resultSeedingMethod === "global_ranking" ? "global_ranking" : "rank_bands"
        : "standings_order",
    randomSeed: stage.randomSeed ?? null,
    randomRevealOrder: stage.randomRevealOrder,
    seedingAudit: null,
  };
}

export async function createTournamentWithStagePlan(input: {
  tournament: typeof tournamentsTable.$inferInsert;
  stagePlan?: unknown;
  gameConfig?: unknown;
}): Promise<{
  tournament: typeof tournamentsTable.$inferSelect;
  gameConfig: SupportedTournamentGameConfig | null;
}> {
  const parsedGameConfig =
    input.gameConfig == null
      ? null
      : parseTournamentGameConfig(input.gameConfig);
  const marvelConfig =
    parsedGameConfig?.gameId === "marvel" ? parsedGameConfig.config : null;
  if (input.stagePlan == null) {
    if (marvelConfig) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        "Marvel elimination groups require a single group-stage plan.",
      );
    }
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(tournamentsTable)
        .values(input.tournament)
        .returning();
      const gameConfig = input.gameConfig == null
        ? null
        : await replaceTournamentGameConfig(tx, created.id, input.gameConfig);
      return { tournament: created, gameConfig };
    });
  }

  const validation = validateTournamentStagePlan(input.stagePlan, {
    allowFinalGroupStage: marvelConfig != null,
  });
  if (!validation.valid)
    throw new TournamentStagePlanError(validation.problems);
  const plan = validation.value;
  const first = plan.stages[0];
  if (marvelConfig) {
    const expectedGroupCount = Math.ceil(
      plan.initialParticipantCount / marvelConfig.groupSize,
    );
    if (
      plan.stages.length !== 1 ||
      first.format !== "group_stage" ||
      first.groupCount !== expectedGroupCount ||
      first.participantsPerGroup !==
        Math.min(plan.initialParticipantCount, marvelConfig.groupSize) ||
      first.qualifiersPerGroup !== marvelConfig.advancingCount
    ) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        "Marvel stage plan must contain one matching elimination-group stage.",
      );
    }
    try {
      calculateMarvelRoundParticipantCounts(
        plan.initialParticipantCount,
        marvelConfig.groupSize,
        marvelConfig.advancingCount,
      );
    } catch (error) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        error instanceof Error
          ? `Invalid Marvel participant flow: ${error.message}`
          : "Invalid Marvel participant flow.",
      );
    }
  }

  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .insert(tournamentsTable)
      .values({
        ...input.tournament,
        format: compatibilityFormat(first.format),
        defaultBestOf: first.bestOf,
        swissRounds: first.format === "swiss" ? first.rounds : null,
        maxPlayers: plan.initialParticipantCount,
      })
      .returning();

    const [generated] = await tx
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournament.id))
      .orderBy(asc(tournamentStagesTable.position));
    const firstValues = persistedStage(tournament.id, first, plan);
    await tx
      .update(tournamentStagesTable)
      .set({
        stageKey: firstValues.stageKey,
        name: firstValues.name,
        format: firstValues.format,
        participantCount: firstValues.participantCount,
        bestOf: firstValues.bestOf,
        plannedRounds: firstValues.plannedRounds,
        currentRound: null,
        totalRounds: null,
        rankingPolicy: firstValues.rankingPolicy,
        qualificationMode: firstValues.qualificationMode,
        advancingCount: firstValues.advancingCount,
        groupCount: firstValues.groupCount,
        participantsPerGroup: firstValues.participantsPerGroup,
        qualifiersPerGroup: firstValues.qualifiersPerGroup,
        seedingPolicy: firstValues.seedingPolicy,
        entrySeedingPolicy: firstValues.entrySeedingPolicy,
        resultSeedingPolicy: firstValues.resultSeedingPolicy,
        randomSeed: firstValues.randomSeed,
        randomRevealOrder: firstValues.randomRevealOrder,
        seedingAudit: firstValues.seedingAudit,
      })
      .where(eq(tournamentStagesTable.id, generated.id));

    const persistedStages = [{ id: generated.id, stageKey: first.key }];
    if (plan.stages.length > 1) {
      const insertedStages = await tx
        .insert(tournamentStagesTable)
        .values(
          plan.stages
            .slice(1)
            .map((stage) => persistedStage(tournament.id, stage, plan)),
        )
        .returning({ id: tournamentStagesTable.id, stageKey: tournamentStagesTable.stageKey });
      persistedStages.push(...insertedStages);
    }
    const gameConfig = input.gameConfig == null
      ? null
      : await replaceTournamentGameConfig(tx, tournament.id, input.gameConfig);
    if (plan.stages.some((stage) => stage.format === "double_elimination")) {
      const compiled = compileV1StagePlanToRoutingV2(
        plan,
        [doubleEliminationFormatEngineV2],
      );
      if (!compiled.valid) {
        throw new TournamentStagePlanError([
          {
            code: "INVALID_STAGE_FORMAT",
            path: "stages",
            message: "Double-elimination routing plan could not be compiled.",
          },
        ]);
      }
      await saveCompiledRoutingPlanV2InTransaction(tx, {
        tournamentId: tournament.id,
        plan: compiled.value,
        stageIdsByKey: Object.fromEntries(
          persistedStages.map((stage) => [stage.stageKey, stage.id]),
        ),
        sourceKind: "stage-plan-v2",
      });
    }
    return { tournament, gameConfig };
  });
}

export async function addPlayerWithStagePlanCompatibility(
  values: typeof playersTable.$inferInsert,
): Promise<typeof playersTable.$inferSelect> {
  return db.transaction((tx) =>
    addPlayerWithStagePlanCompatibilityInTransaction(tx, values),
  );
}

export async function addPlayerWithStagePlanCompatibilityInTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  values: typeof playersTable.$inferInsert,
): Promise<typeof playersTable.$inferSelect> {
  const [firstStage] = await tx
    .select()
    .from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.tournamentId, values.tournamentId))
    .orderBy(asc(tournamentStagesTable.position))
    .for("update");
  if (firstStage?.format !== "group_stage" || firstStage.status !== "planned") {
    const [created] = await tx.insert(playersTable).values(values).returning();
    return created;
  }

  // The migration's legacy player trigger maintains the live one-stage participant count.
  // A planned group stage has a fixed configured count, so expose a constraint-valid
  // compatibility projection only inside this transaction while that trigger runs.
  await tx
    .update(tournamentStagesTable)
    .set({
      format: "round_robin",
      rankingPolicy: "round_robin_v1",
      qualificationMode: "top_n",
      advancingCount:
        firstStage.groupCount != null && firstStage.qualifiersPerGroup != null
          ? calculateGroupAdvancingCount(
              firstStage.participantCount,
              firstStage.groupCount,
              firstStage.qualifiersPerGroup,
            )
          : 0,
      groupCount: null,
      participantsPerGroup: null,
      qualifiersPerGroup: null,
      seedingPolicy: "standings_order",
      resultSeedingPolicy: "standings_order",
    })
    .where(eq(tournamentStagesTable.id, firstStage.id));
  const [created] = await tx.insert(playersTable).values(values).returning();
  await tx
    .update(tournamentStagesTable)
    .set({
      format: firstStage.format,
      participantCount: firstStage.participantCount,
      rankingPolicy: firstStage.rankingPolicy,
      qualificationMode: firstStage.qualificationMode,
      advancingCount: firstStage.advancingCount,
      groupCount: firstStage.groupCount,
      participantsPerGroup: firstStage.participantsPerGroup,
      qualifiersPerGroup: firstStage.qualifiersPerGroup,
      seedingPolicy: firstStage.seedingPolicy,
      resultSeedingPolicy: firstStage.resultSeedingPolicy,
    })
    .where(eq(tournamentStagesTable.id, firstStage.id));
  return created;
}
