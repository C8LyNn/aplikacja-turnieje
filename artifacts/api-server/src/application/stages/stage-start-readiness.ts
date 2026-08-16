import { calculateBalancedGroupSizes } from "../../domain/tournament/group-stage";
import {
  StageLifecycleError,
  type StageLifecycleErrorCode,
} from "./stage-lifecycle-error";
import type { StageBasketValidationResult } from "../../domain/tournament/stage-baskets";
import { getStageBasketConfiguration } from "./stage-basket-configuration";

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
  if (memberships.length !== stage.participantCount || memberships.length < 2) {
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

  if (stage.format === "group_stage") {
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
  } else if (
    stage.format !== "swiss" &&
    stage.format !== "round_robin" &&
    stage.format !== "single_elimination" &&
    stage.format !== "double_elimination"
  ) {
    throw new StageLifecycleError("STAGE_FORMAT_NOT_SUPPORTED");
  }
}

export function evaluateStageStartReadiness(
  snapshot: StageStartValidationSnapshot,
): StageStartReadiness {
  const base = {
    participantCount: snapshot.memberships.length,
    requiredParticipantCount: snapshot.stage.participantCount,
    missingSeeds: missingStageSeeds(snapshot.memberships, snapshot.stage.participantCount),
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
import {
  db,
  matchesTable,
  playersTable,
  stageGroupsTable,
  stageParticipantsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";

export async function getStageStartReadiness(input: {
  tournamentId: number;
  stageId: number;
}): Promise<StageStartReadiness> {
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
  });
}
