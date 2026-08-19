import { asc, eq, inArray } from "drizzle-orm";
import {
  db,
  playersTable,
  stageGroupsTable,
  stageParticipantsTable,
  tournamentStagesTable,
} from "@workspace/db";
import { StageLifecycleError } from "./stage-lifecycle";

function iso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function serializeTournamentStage(
  stage: typeof tournamentStagesTable.$inferSelect,
) {
  return {
    ...stage,
    plannedRounds: stage.plannedRounds ?? null,
    currentRound: stage.currentRound ?? null,
    totalRounds: stage.totalRounds ?? null,
    advancingCount: stage.advancingCount ?? null,
    groupCount: stage.groupCount ?? null,
    participantsPerGroup: stage.participantsPerGroup ?? null,
    qualifiersPerGroup: stage.qualifiersPerGroup ?? null,
    randomSeed: stage.randomSeed ?? null,
    seedingAudit: stage.seedingAudit ?? null,
    winnerId: stage.winnerId ?? null,
    createdAt: stage.createdAt.toISOString(),
    startedAt: iso(stage.startedAt),
    completedAt: iso(stage.completedAt),
  };
}

export async function listTournamentStages(tournamentId: number) {
  return (
    await db
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournamentId))
      .orderBy(asc(tournamentStagesTable.position))
  ).map(serializeTournamentStage);
}

export async function getTournamentStageDetails(input: {
  tournamentId: number;
  stageId: number;
}) {
  const [stage] = await db
    .select()
    .from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.id, input.stageId));
  if (!stage || stage.tournamentId !== input.tournamentId) {
    throw new StageLifecycleError("STAGE_NOT_FOUND");
  }
  const groups = await db
    .select()
    .from(stageGroupsTable)
    .where(eq(stageGroupsTable.stageId, stage.id))
    .orderBy(asc(stageGroupsTable.position));
  const memberships = await db
    .select()
    .from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.stageId, stage.id))
    .orderBy(asc(stageParticipantsTable.stageSeed));
  const players =
    memberships.length === 0
      ? []
      : await db
          .select({ id: playersTable.id, name: playersTable.name, seed: playersTable.seed })
          .from(playersTable)
          .where(
            inArray(
              playersTable.id,
              memberships.map((item) => item.playerId),
            ),
          );
  const playerName = new Map(players.map((player) => [player.id, player.name]));
  const playerSeed = new Map(players.map((player) => [player.id, player.seed ?? null]));
  const groupKey = new Map(groups.map((group) => [group.id, group.groupKey]));
  const participants = memberships.map((participant) => ({
    ...participant,
    playerName: playerName.get(participant.playerId) ?? "",
    manualSeed: playerSeed.get(participant.playerId) ?? null,
    groupId: participant.groupId ?? null,
    groupKey:
      participant.groupId == null
        ? null
        : (groupKey.get(participant.groupId) ?? null),
    finalRank: participant.finalRank ?? null,
    groupRank: participant.groupRank ?? null,
    qualificationRank: participant.qualificationRank ?? null,
    nextStageSeed: participant.nextStageSeed ?? null,
    sourceStageParticipantId: participant.sourceStageParticipantId ?? null,
    qualifiedAt: iso(participant.qualifiedAt),
    createdAt: participant.createdAt.toISOString(),
  }));
  const ranking = participants
    .filter(
      (participant) =>
        participant.finalRank != null || participant.groupRank != null,
    )
    .sort(
      (left, right) =>
        (left.groupId ?? 0) - (right.groupId ?? 0) ||
        (left.groupRank ?? left.finalRank ?? Number.MAX_SAFE_INTEGER) -
          (right.groupRank ?? right.finalRank ?? Number.MAX_SAFE_INTEGER),
    );
  return {
    stage: serializeTournamentStage(stage),
    groups: groups.map((group) => ({
      ...group,
      createdAt: group.createdAt.toISOString(),
    })),
    participants,
    ranking,
    qualifiers: participants
      .filter((participant) => participant.status === "qualified")
      .sort(
        (left, right) =>
          (left.nextStageSeed ?? Number.MAX_SAFE_INTEGER) -
          (right.nextStageSeed ?? Number.MAX_SAFE_INTEGER),
      ),
  };
}
