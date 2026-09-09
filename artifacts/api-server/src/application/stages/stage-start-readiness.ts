import { calculateBalancedGroupSizes } from "../../domain/tournament/group-stage";
import {
  StageLifecycleError,
  type StageLifecycleErrorCode,
} from "./stage-lifecycle-error";
import type { StageBasketValidationResult } from "../../domain/tournament/stage-baskets";

export type StageStartFormat = "swiss" | "round_robin" | "group_stage" | "single_elimination" | "double_elimination";

export interface StageStartTournament {
  id: number;
  activeStageId: number | null;
}

export interface StageStartStage {
  id: number;
  tournamentId: number;
  position: number;
  status: "planned" | "active" | "completed";
  participantCount: number;
  format: StageStartFormat;
  groupCount: number | null;
  participantsPerGroup: number | null;
  qualifiersPerGroup: number | null;
  qualificationMode: string;
  seedingPolicy: string;
  entrySeedingPolicy: string;
}

export interface StageStartParticipant {
  id: number;
  playerId: number;
  stageSeed: number;
  status: string;
  nextStageSeed: number | null;
  qualificationSource: string;
  sourceStageParticipantId: number | null;
  groupId: number | null;
  groupRank: number | null;
}

export interface StageStartPlayer {
  id: number;
  tournamentId: number;
}

export interface StageStartGroup {
  id: number;
  groupKey: string;
}

/**
 * Routing-plan availability status for Double Elimination stages.
 *
 * - `exists: true`  — a compiled plan is already persisted, start can proceed.
 * - `exists: false, legacyAutoGeneratable: true`  — no plan yet, but the
 *   tournament is legacy (basket_flow_authority_version = 0, no baskets) so
 *   one will be generated automatically at start time → stage is still READY.
 * - `exists: false, legacyAutoGeneratable: false`  — no plan and automatic
 *   generation is not allowed (e.g. basket-authoritative tournament) →
 *   ROUTING_PLAN_MISSING error.
 */
export interface RoutingPlanStatus {
  exists: boolean;
  legacyAutoGeneratable: boolean;
}

export interface StageStartValidationSnapshot {
  tournament: StageStartTournament;
  stages: readonly StageStartStage[];
  stage: StageStartStage;
  existingMatchCount: number;
  existingGroupCount: number;
  memberships: readonly StageStartParticipant[];
  sourceMemberships: readonly StageStartParticipant[];
  sourceGroups: readonly StageStartGroup[];
  players: readonly StageStartPlayer[];
  basketValidation?: StageBasketValidationResult;
  marvelEliminationStage?: boolean;
  /** Present only for double_elimination stages; absent for all other formats. */
  routingPlanStatus?: RoutingPlanStatus;
}

export interface StageStartReadiness {
  ready: boolean;
  reasonCode: "READY" | StageLifecycleErrorCode;
  message: string;
  participantCount: number;
  requiredParticipantCount: number;
  missingSeeds: number[];
  blockingMatches: number;
  blockingGroups: number;
  format: StageStartFormat;
  basketValidation: StageBasketValidationResult;
}

export function shouldUseStageLifecycleForLegacyTournamentStart(
  stages: readonly Pick<StageStartStage, "format" | "entrySeedingPolicy">[],
  gameId: string | null,
): boolean {
  const first = stages[0];
  // Route single-stage tournaments with a configured non-default seeding policy
  // through the full stage lifecycle so that ceremony checks, seed assignment, and
  // seeding algorithms (alphabetical, manual, random) are properly applied.
  const usesConfiguredSeeding = first != null &&
    first.entrySeedingPolicy !== "preserve" &&
    first.entrySeedingPolicy !== "registration_order";
  return stages.length > 1 ||
    first?.format === "double_elimination" ||
    (first?.format === "group_stage" && gameId === "marvel") ||
    usesConfiguredSeeding;
}

function missingStageSeeds(
  memberships: readonly StageStartParticipant[],
  participantCount: number,
): number[] {
  const assigned = new Set(memberships.map((membership) => membership.stageSeed));
  return Array.from({ length: participantCount }, (_, index) => index + 1)
    .filter((seed) => !assigned.has(seed));
}

export function assertStageStartReady(snapshot: StageStartValidationSnapshot): void {
  const { tournament, stages, stage, memberships } = snapshot;
  if (snapshot.basketValidation?.valid === false) {
    throw new StageLifecycleError("STAGE_BASKET_CONFIGURATION_INVALID");
  }
  if (stage.status === "active") throw new StageLifecycleError("STAGE_ALREADY_STARTED");
  if (stage.status === "completed") throw new StageLifecycleError("STAGE_ALREADY_COMPLETED");
  if (tournament.activeStageId != null || stages.some((candidate) => candidate.status === "active")) {
    throw new StageLifecycleError("ACTIVE_STAGE_EXISTS");
  }
  const nextPlanned = stages.find((candidate) => candidate.status === "planned");
  if (!nextPlanned || nextPlanned.id !== stage.id) {
    throw new StageLifecycleError("STAGE_NOT_NEXT_PLANNED");
  }
  const previous = stages.find((candidate) => candidate.position === stage.position - 1);
  if (previous && previous.status !== "completed") {
    throw new StageLifecycleError("PREVIOUS_STAGE_NOT_COMPLETED");
  }
  if (snapshot.existingMatchCount > 0) throw new StageLifecycleError("MATCHES_ALREADY_EXIST");
  if (snapshot.existingGroupCount > 0) throw new StageLifecycleError("GROUPS_ALREADY_EXIST");
  // For first-stage DE: maxPlayers is a bracket capacity, not a required attendance count.
  // Actual participants may be fewer — empty slots become BYEs.  All other formats and
  // subsequent DE stages require an exact participant count.
  const isFirstStageDe = stage.format === "double_elimination" && !previous;
  const participantCountOk = isFirstStageDe
    ? memberships.length >= 2 && memberships.length <= stage.participantCount
    : memberships.length === stage.participantCount;
  if (!participantCountOk || memberships.length < 2) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  if (memberships.some((membership, index) => membership.stageSeed !== index + 1)) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }

  if (previous) {
    const sourceById = new Map(snapshot.sourceMemberships.map((membership) => [membership.id, membership]));
    if (memberships.some((membership) => {
      const source = membership.sourceStageParticipantId == null
        ? null
        : sourceById.get(membership.sourceStageParticipantId);
      return !source ||
        source.playerId !== membership.playerId ||
        source.status !== "qualified" ||
        source.nextStageSeed !== membership.stageSeed ||
        membership.qualificationSource === "registration";
    })) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    if (previous.format === "group_stage") {
      const sourceGroupIds = new Set(snapshot.sourceGroups.map((group) => group.id));
      if (memberships.some((membership) => {
        const source = membership.sourceStageParticipantId == null
          ? null
          : sourceById.get(membership.sourceStageParticipantId);
        return membership.qualificationSource !== "group_position" ||
          source?.groupId == null ||
          !sourceGroupIds.has(source.groupId) ||
          source.groupRank == null;
      })) {
        throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
      }
    }
  } else if (memberships.some(
    (membership) => membership.sourceStageParticipantId != null || membership.qualificationSource !== "registration",
  )) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }

  if (
    snapshot.players.length !== memberships.length ||
    snapshot.players.some((player) => player.tournamentId !== tournament.id)
  ) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }

  if (stage.format === "group_stage" && snapshot.marvelEliminationStage) {
    if (
      stage.groupCount == null ||
      stage.participantsPerGroup == null ||
      stage.qualifiersPerGroup == null ||
      stage.qualificationMode !== "none"
    ) {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
  } else if (stage.format === "group_stage") {
    const groupCount = stage.groupCount;
    const groupSize = stage.participantsPerGroup;
    const qualifiersPerGroup = stage.qualifiersPerGroup;
    let expectedGroupSizes: number[] = [];
    try {
      expectedGroupSizes = calculateBalancedGroupSizes(memberships.length, groupCount ?? 0);
    } catch {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
    if (
      groupCount == null ||
      groupSize !== Math.max(...expectedGroupSizes) ||
      qualifiersPerGroup == null ||
      qualifiersPerGroup < 1 ||
      qualifiersPerGroup > groupSize ||
      stage.qualificationMode !== "top_n_per_group" ||
      !["snake_groups", "random_groups"].includes(stage.seedingPolicy)
    ) {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
  } else if (stage.format === "double_elimination") {
    // When routingPlanStatus is provided (i.e. from getStageStartReadiness),
    // verify the plan situation.  Legacy auto-generatable DE is still READY
    // because ensureLegacyDeRoutingPlanExists will create the plan at start
    // time.  Only block when a plan is missing AND cannot be auto-generated.
    const rps = snapshot.routingPlanStatus;
    if (rps && !rps.exists && !rps.legacyAutoGeneratable) {
      throw new StageLifecycleError("ROUTING_PLAN_MISSING");
    }
  } else if (
    stage.format !== "swiss" &&
    stage.format !== "round_robin" &&
    stage.format !== "single_elimination"
  ) {
    throw new StageLifecycleError("STAGE_FORMAT_NOT_SUPPORTED");
  }
}

export function evaluateStageStartReadiness(
  snapshot: StageStartValidationSnapshot,
): StageStartReadiness {
  // For first-stage DE the bracket capacity (stage.participantCount = maxPlayers) is a
  // ceiling, not an attendance requirement.  Report required = actual so the UI reflects
  // "you have enough players" rather than "you need N more".
  const hasPrevious = snapshot.stages.some(
    (candidate) => candidate.position === snapshot.stage.position - 1,
  );
  const isFirstStageDe = snapshot.stage.format === "double_elimination" && !hasPrevious;
  const effectiveRequired = isFirstStageDe
    ? snapshot.memberships.length
    : snapshot.stage.participantCount;
  const base = {
    participantCount: snapshot.memberships.length,
    requiredParticipantCount: effectiveRequired,
    missingSeeds: missingStageSeeds(snapshot.memberships, effectiveRequired),
    blockingMatches: snapshot.existingMatchCount,
    blockingGroups: snapshot.existingGroupCount,
    format: snapshot.stage.format,
    basketValidation: snapshot.basketValidation ?? {
      valid: true,
      problems: [],
    },
  };
  try {
    assertStageStartReady(snapshot);
    return { ready: true, reasonCode: "READY", message: "Etap jest gotowy do uruchomienia.", ...base };
  } catch (error) {
    if (!(error instanceof StageLifecycleError)) throw error;
    return { ready: false, reasonCode: error.code, message: error.message, ...base };
  }
}

import { asc, eq, inArray } from "drizzle-orm";

export async function getStageStartReadiness(input: {
  tournamentId: number;
  stageId: number;
}): Promise<StageStartReadiness> {
  const {
    db, matchesTable, playersTable, stageBasketsTable, stageGroupsTable,
    stageParticipantsTable, tournamentGameConfigsTable, tournamentRoutingPlansTable,
    tournamentStagesTable, tournamentsTable,
  } = await import("@workspace/db");
  const { getStageBasketConfiguration } = await import("./stage-basket-configuration");
  const { isLegacyDeAutoGeneratable } = await import("./legacy-de-routing-plan");
  const [tournament] = await db.select().from(tournamentsTable)
    .where(eq(tournamentsTable.id, input.tournamentId));
  if (!tournament) throw new StageLifecycleError("TOURNAMENT_NOT_FOUND");
  const stages = await db.select().from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.tournamentId, tournament.id))
    .orderBy(asc(tournamentStagesTable.position));
  const stage = stages.find((candidate) => candidate.id === input.stageId);
  if (!stage) throw new StageLifecycleError("STAGE_NOT_FOUND");
  const previous = stages.find((candidate) => candidate.position === stage.position - 1);
  const existingMatches = await db.select({ id: matchesTable.id }).from(matchesTable)
    .where(eq(matchesTable.stageId, stage.id));
  const existingGroups = await db.select({ id: stageGroupsTable.id }).from(stageGroupsTable)
    .where(eq(stageGroupsTable.stageId, stage.id));
  const memberships = await db.select().from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.stageId, stage.id))
    .orderBy(asc(stageParticipantsTable.stageSeed));
  const sourceMemberships = previous
    ? await db.select().from(stageParticipantsTable)
      .where(eq(stageParticipantsTable.stageId, previous.id))
    : [];
  const sourceGroups = previous?.format === "group_stage"
    ? await db.select().from(stageGroupsTable).where(eq(stageGroupsTable.stageId, previous.id))
    : [];
  const players = memberships.length === 0
    ? []
    : await db.select().from(playersTable)
      .where(inArray(playersTable.id, memberships.map((membership) => membership.playerId)));
  const basketConfiguration = await getStageBasketConfiguration(tournament.id);
  const [gameConfig] = await db
    .select({ gameId: tournamentGameConfigsTable.gameId })
    .from(tournamentGameConfigsTable)
    .where(eq(tournamentGameConfigsTable.tournamentId, tournament.id));

  // For DE stages, determine routing-plan availability so the readiness check
  // can surface ROUTING_PLAN_MISSING instead of letting a 500 propagate later.
  let routingPlanStatus: RoutingPlanStatus | undefined;
  if (stage.format === "double_elimination") {
    const [existingPlan] = await db
      .select({ id: tournamentRoutingPlansTable.id })
      .from(tournamentRoutingPlansTable)
      .where(eq(tournamentRoutingPlansTable.tournamentId, tournament.id))
      .limit(1);
    if (existingPlan) {
      routingPlanStatus = { exists: true, legacyAutoGeneratable: false };
    } else {
      const [basket] = await db
        .select({ id: stageBasketsTable.id })
        .from(stageBasketsTable)
        .where(eq(stageBasketsTable.tournamentId, tournament.id))
        .limit(1);
      const legacyAutoGeneratable = isLegacyDeAutoGeneratable(
        tournament.basketFlowAuthorityVersion,
        basket != null,
      );
      routingPlanStatus = { exists: false, legacyAutoGeneratable };
    }
  }

  return evaluateStageStartReadiness({
    tournament,
    stages,
    stage,
    existingMatchCount: existingMatches.length,
    existingGroupCount: existingGroups.length,
    memberships,
    sourceMemberships,
    sourceGroups,
    players,
    basketValidation: basketConfiguration.validation,
    marvelEliminationStage:
      gameConfig?.gameId === "marvel" && stage.format === "group_stage",
    routingPlanStatus,
  });
}
