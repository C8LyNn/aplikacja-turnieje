import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  actionLogTable,
  db,
  marvelStageGroupEntriesTable,
  marvelStageGroupsTable,
  marvelStageRoundsTable,
  playersTable,
  stageParticipantsTable,
  tournamentGameConfigsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  parseTournamentGameConfig,
  type MarvelTournamentConfigV1,
} from "@workspace/game-catalog";
import type { TournamentMutationActor } from "../../access-policy";
import { revalidateTournamentMutationActor } from "../../access-policy";
import {
  buildMarvelInitialGroups,
  buildMarvelPairedMergeGroups,
  buildMarvelRandomGroups,
  calculateMarvelRoundParticipantCounts,
  rankMarvelGroupResult,
  validateMarvelManualGroups,
  type MarvelGroupAssignment,
} from "../../domain/tournament/marvel-elimination-groups";
import { groupKeyFromIndex } from "../../domain/tournament/group-stage";
import type { TournamentDatabaseTransaction } from "../games/tournament-game-config";

export type MarvelEliminationStageErrorCode =
  | "MARVEL_STAGE_NOT_FOUND"
  | "MARVEL_STAGE_NOT_ACTIVE"
  | "MARVEL_STAGE_CONFIGURATION_INVALID"
  | "MARVEL_GROUP_NOT_FOUND"
  | "MARVEL_GROUP_ALREADY_COMPLETED"
  | "MARVEL_GROUP_RESULT_INVALID"
  | "MARVEL_MANUAL_GROUPING_NOT_REQUIRED"
  | "MARVEL_MANUAL_GROUPING_INVALID";

export class MarvelEliminationStageError extends Error {
  constructor(public readonly code: MarvelEliminationStageErrorCode) {
    super(code);
    this.name = "MarvelEliminationStageError";
  }
}

export interface MarvelGroupResultInput {
  playerId: number;
  kills?: number | null;
}

function serializeDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

async function loadMarvelConfig(
  tx: TournamentDatabaseTransaction,
  tournamentId: number,
): Promise<MarvelTournamentConfigV1> {
  const [row] = await tx
    .select()
    .from(tournamentGameConfigsTable)
    .where(eq(tournamentGameConfigsTable.tournamentId, tournamentId));
  if (!row) {
    throw new MarvelEliminationStageError("MARVEL_STAGE_CONFIGURATION_INVALID");
  }
  const parsed = parseTournamentGameConfig({
    gameId: row.gameId,
    configVersion: row.configVersion,
    config: row.config,
  });
  if (parsed.gameId !== "marvel") {
    throw new MarvelEliminationStageError("MARVEL_STAGE_CONFIGURATION_INVALID");
  }
  return parsed.config;
}

async function insertRoundGroups(
  tx: TournamentDatabaseTransaction,
  input: {
    tournamentId: number;
    stageId: number;
    roundId: number;
    assignments: readonly MarvelGroupAssignment[];
    sourceGroupIdByPlayerId?: ReadonlyMap<number, number>;
  },
): Promise<Array<typeof marvelStageGroupsTable.$inferSelect>> {
  const groups = await tx
    .insert(marvelStageGroupsTable)
    .values(
      input.assignments.map((assignment) => ({
        tournamentId: input.tournamentId,
        stageId: input.stageId,
        roundId: input.roundId,
        groupKey: groupKeyFromIndex(assignment.position - 1),
        position: assignment.position,
        status: "pending",
      })),
    )
    .returning();
  const groupByPosition = new Map(
    groups.map((group) => [group.position, group]),
  );
  await tx.insert(marvelStageGroupEntriesTable).values(
    input.assignments.flatMap((assignment) => {
      const group = groupByPosition.get(assignment.position);
      if (!group) {
        throw new MarvelEliminationStageError(
          "MARVEL_STAGE_CONFIGURATION_INVALID",
        );
      }
      return assignment.playerIds.map((playerId, index) => ({
        tournamentId: input.tournamentId,
        stageId: input.stageId,
        roundId: input.roundId,
        groupId: group.id,
        playerId,
        sourceGroupId: input.sourceGroupIdByPlayerId?.get(playerId) ?? null,
        groupSlot: index + 1,
      }));
    }),
  );
  return groups.sort((left, right) => left.position - right.position);
}

export async function initializeMarvelEliminationStage(
  tx: TournamentDatabaseTransaction,
  input: {
    tournamentId: number;
    stage: typeof tournamentStagesTable.$inferSelect;
    memberships: readonly (typeof stageParticipantsTable.$inferSelect)[];
  },
): Promise<{ totalRounds: number }> {
  const config = await loadMarvelConfig(tx, input.tournamentId);
  if (input.stage.format !== "group_stage") {
    throw new MarvelEliminationStageError("MARVEL_STAGE_CONFIGURATION_INVALID");
  }
  let roundParticipantCounts: number[];
  try {
    roundParticipantCounts = calculateMarvelRoundParticipantCounts(
      input.memberships.length,
      config.groupSize,
      config.advancingCount,
    );
  } catch {
    throw new MarvelEliminationStageError("MARVEL_STAGE_CONFIGURATION_INVALID");
  }
  const [round] = await tx
    .insert(marvelStageRoundsTable)
    .values({
      tournamentId: input.tournamentId,
      stageId: input.stage.id,
      roundNumber: 1,
      participantCount: input.memberships.length,
      groupSize: config.groupSize,
      advancingCount: config.advancingCount,
      killLimit: config.killLimit,
      regroupingStrategy: config.regroupingStrategy,
      status: "active",
    })
    .returning();
  await insertRoundGroups(tx, {
    tournamentId: input.tournamentId,
    stageId: input.stage.id,
    roundId: round.id,
    assignments: buildMarvelInitialGroups(
      input.memberships.map((membership) => ({
        playerId: membership.playerId,
        seed: membership.stageSeed,
      })),
      config.groupSize,
    ),
  });
  return { totalRounds: roundParticipantCounts.length };
}

export async function isMarvelEliminationStage(
  tx: TournamentDatabaseTransaction,
  tournamentId: number,
  stage: typeof tournamentStagesTable.$inferSelect,
): Promise<boolean> {
  const [row] = await tx
    .select({
      gameId: tournamentGameConfigsTable.gameId,
      configVersion: tournamentGameConfigsTable.configVersion,
      config: tournamentGameConfigsTable.config,
    })
    .from(tournamentGameConfigsTable)
    .where(eq(tournamentGameConfigsTable.tournamentId, tournamentId));
  if (!row || row.gameId !== "marvel") return false;
  const parsed = parseTournamentGameConfig(row);
  return parsed.gameId === "marvel" && stage.format === "group_stage";
}

async function createNextRound(
  tx: TournamentDatabaseTransaction,
  input: {
    tournamentId: number;
    stageId: number;
    previousRound: typeof marvelStageRoundsTable.$inferSelect;
    previousGroups: readonly (typeof marvelStageGroupsTable.$inferSelect)[];
    qualifiedEntries: readonly (typeof marvelStageGroupEntriesTable.$inferSelect)[];
  },
): Promise<void> {
  const nextRoundNumber = input.previousRound.roundNumber + 1;
  const sourceGroupIdByPlayerId = new Map(
    input.qualifiedEntries.map((entry) => [entry.playerId, entry.groupId]),
  );
  const qualifiedPlayerIds = input.qualifiedEntries.map(
    (entry) => entry.playerId,
  );
  const randomSeed = randomUUID();
  const awaitingManual = input.previousRound.regroupingStrategy === "manual";
  const [round] = await tx
    .insert(marvelStageRoundsTable)
    .values({
      tournamentId: input.tournamentId,
      stageId: input.stageId,
      roundNumber: nextRoundNumber,
      participantCount: qualifiedPlayerIds.length,
      groupSize: input.previousRound.groupSize,
      advancingCount: input.previousRound.advancingCount,
      killLimit: input.previousRound.killLimit,
      regroupingStrategy: input.previousRound.regroupingStrategy,
      status: awaitingManual ? "awaiting_manual" : "active",
      randomSeed:
        input.previousRound.regroupingStrategy === "random" ? randomSeed : null,
    })
    .returning();

  if (awaitingManual) return;

  const assignments =
    input.previousRound.regroupingStrategy === "random"
      ? buildMarvelRandomGroups(
          qualifiedPlayerIds,
          input.previousRound.groupSize,
          randomSeed,
        )
      : buildMarvelPairedMergeGroups(
          input.previousGroups.map((group) =>
            input.qualifiedEntries
              .filter((entry) => entry.groupId === group.id)
              .sort(
                (left, right) => (left.placement ?? 0) - (right.placement ?? 0),
              )
              .map((entry) => entry.playerId),
          ),
          input.previousRound.groupSize,
        );
  await insertRoundGroups(tx, {
    tournamentId: input.tournamentId,
    stageId: input.stageId,
    roundId: round.id,
    assignments,
    sourceGroupIdByPlayerId,
  });
}

async function finalizeMarvelStage(
  tx: TournamentDatabaseTransaction,
  input: {
    tournament: typeof tournamentsTable.$inferSelect;
    stage: typeof tournamentStagesTable.$inferSelect;
  },
): Promise<void> {
  const rounds = await tx
    .select()
    .from(marvelStageRoundsTable)
    .where(eq(marvelStageRoundsTable.stageId, input.stage.id))
    .orderBy(asc(marvelStageRoundsTable.roundNumber));
  const groups = await tx
    .select()
    .from(marvelStageGroupsTable)
    .where(eq(marvelStageGroupsTable.stageId, input.stage.id));
  const entries = await tx
    .select()
    .from(marvelStageGroupEntriesTable)
    .where(eq(marvelStageGroupEntriesTable.stageId, input.stage.id));
  const roundNumberById = new Map(
    rounds.map((round) => [round.id, round.roundNumber]),
  );
  const groupPositionById = new Map(
    groups.map((group) => [group.id, group.position]),
  );
  const lastEntryByPlayerId = new Map<
    number,
    typeof marvelStageGroupEntriesTable.$inferSelect
  >();
  for (const entry of entries) {
    const existing = lastEntryByPlayerId.get(entry.playerId);
    if (
      !existing ||
      (roundNumberById.get(entry.roundId) ?? 0) >
        (roundNumberById.get(existing.roundId) ?? 0)
    ) {
      lastEntryByPlayerId.set(entry.playerId, entry);
    }
  }
  const ranking = [...lastEntryByPlayerId.values()].sort((left, right) => {
    const roundDifference =
      (roundNumberById.get(right.roundId) ?? 0) -
      (roundNumberById.get(left.roundId) ?? 0);
    if (roundDifference !== 0) return roundDifference;
    return (
      (left.placement ?? Number.MAX_SAFE_INTEGER) -
        (right.placement ?? Number.MAX_SAFE_INTEGER) ||
      (groupPositionById.get(left.groupId) ?? 0) -
        (groupPositionById.get(right.groupId) ?? 0) ||
      left.groupSlot - right.groupSlot
    );
  });
  const winnerId = ranking[0]?.playerId;
  if (winnerId == null || ranking.length !== input.stage.participantCount) {
    throw new MarvelEliminationStageError("MARVEL_STAGE_CONFIGURATION_INVALID");
  }
  for (const [index, entry] of ranking.entries()) {
    await tx
      .update(stageParticipantsTable)
      .set({
        finalRank: index + 1,
        groupRank: null,
        status: index === 0 ? "winner" : "eliminated",
        qualificationRank: null,
        nextStageSeed: null,
        qualifiedAt: null,
      })
      .where(
        and(
          eq(stageParticipantsTable.stageId, input.stage.id),
          eq(stageParticipantsTable.playerId, entry.playerId),
        ),
      );
  }
  const now = new Date();
  await tx
    .update(tournamentStagesTable)
    .set({
      status: "completed",
      winnerId,
      completedAt: now,
      version: input.stage.version + 1,
    })
    .where(eq(tournamentStagesTable.id, input.stage.id));
  await tx
    .update(playersTable)
    .set({ status: "eliminated" })
    .where(eq(playersTable.tournamentId, input.tournament.id));
  await tx
    .update(playersTable)
    .set({ status: "winner" })
    .where(eq(playersTable.id, winnerId));
  await tx
    .update(tournamentsTable)
    .set({
      status: "completed",
      activeStageId: null,
      winnerId,
      currentRound: rounds.length,
      totalRounds: rounds.length,
    })
    .where(eq(tournamentsTable.id, input.tournament.id));
}

export async function submitMarvelGroupResult(input: {
  tournamentId: number;
  stageId: number;
  groupId: number;
  placements: readonly MarvelGroupResultInput[];
  actor?: TournamentMutationActor;
}): Promise<MarvelEliminationStageState> {
  await db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId))
      .for("update");
    if (!tournament) {
      throw new MarvelEliminationStageError("MARVEL_STAGE_NOT_FOUND");
    }
    await revalidateTournamentMutationActor(tx, tournament, input.actor);
    const [stage] = await tx
      .select()
      .from(tournamentStagesTable)
      .where(
        and(
          eq(tournamentStagesTable.id, input.stageId),
          eq(tournamentStagesTable.tournamentId, input.tournamentId),
        ),
      )
      .for("update");
    if (!stage) {
      throw new MarvelEliminationStageError("MARVEL_STAGE_NOT_FOUND");
    }
    await loadMarvelConfig(tx, input.tournamentId);
    if (stage.status !== "active" || tournament.activeStageId !== stage.id) {
      throw new MarvelEliminationStageError("MARVEL_STAGE_NOT_ACTIVE");
    }
    const [group] = await tx
      .select()
      .from(marvelStageGroupsTable)
      .where(
        and(
          eq(marvelStageGroupsTable.id, input.groupId),
          eq(marvelStageGroupsTable.stageId, stage.id),
        ),
      )
      .for("update");
    if (!group) {
      throw new MarvelEliminationStageError("MARVEL_GROUP_NOT_FOUND");
    }
    if (group.status === "completed") {
      throw new MarvelEliminationStageError("MARVEL_GROUP_ALREADY_COMPLETED");
    }
    const [round] = await tx
      .select()
      .from(marvelStageRoundsTable)
      .where(eq(marvelStageRoundsTable.id, group.roundId))
      .for("update");
    const entries = await tx
      .select()
      .from(marvelStageGroupEntriesTable)
      .where(eq(marvelStageGroupEntriesTable.groupId, group.id))
      .orderBy(asc(marvelStageGroupEntriesTable.groupSlot))
      .for("update");
    const expectedIds = entries.map((entry) => entry.playerId);
    const groups = await tx
      .select()
      .from(marvelStageGroupsTable)
      .where(eq(marvelStageGroupsTable.roundId, round.id))
      .orderBy(asc(marvelStageGroupsTable.position))
      .for("update");
    const finalRound = groups.length === 1;
    let rankedResult;
    try {
      rankedResult = rankMarvelGroupResult(
        expectedIds,
        input.placements,
        round.advancingCount,
        finalRound,
      );
    } catch {
      throw new MarvelEliminationStageError("MARVEL_GROUP_RESULT_INVALID");
    }
    for (const submitted of rankedResult) {
      await tx
        .update(marvelStageGroupEntriesTable)
        .set({
          placement: submitted.placement,
          kills: submitted.kills,
          qualified: submitted.qualified,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(marvelStageGroupEntriesTable.groupId, group.id),
            eq(marvelStageGroupEntriesTable.playerId, submitted.playerId),
          ),
        );
      if (!finalRound) {
        const status = submitted.qualified ? "active" : "eliminated";
        await tx
          .update(stageParticipantsTable)
          .set({ status })
          .where(
            and(
              eq(stageParticipantsTable.stageId, stage.id),
              eq(stageParticipantsTable.playerId, submitted.playerId),
            ),
          );
        await tx
          .update(playersTable)
          .set({ status })
          .where(eq(playersTable.id, submitted.playerId));
      }
    }
    const now = new Date();
    await tx
      .update(marvelStageGroupsTable)
      .set({ status: "completed", completedAt: now })
      .where(eq(marvelStageGroupsTable.id, group.id));
    await tx.insert(actionLogTable).values({
      tournamentId: tournament.id,
      stageId: stage.id,
      actionType: "marvel_group_result_recorded",
      description: `Zapisano wynik Marvel R${round.roundNumber} ${group.groupKey}`,
      matchId: null,
      undoPayload: null,
      isUndone: false,
    });

    if (
      groups.some(
        (candidate) =>
          candidate.id !== group.id && candidate.status !== "completed",
      )
    ) {
      return;
    }
    await tx
      .update(marvelStageRoundsTable)
      .set({ status: "completed", completedAt: now })
      .where(eq(marvelStageRoundsTable.id, round.id));
    if (finalRound) {
      await finalizeMarvelStage(tx, { tournament, stage });
      return;
    }
    const qualifiedEntries = await tx
      .select()
      .from(marvelStageGroupEntriesTable)
      .where(
        and(
          eq(marvelStageGroupEntriesTable.roundId, round.id),
          eq(marvelStageGroupEntriesTable.qualified, true),
        ),
      )
      .orderBy(
        asc(marvelStageGroupEntriesTable.groupId),
        asc(marvelStageGroupEntriesTable.placement),
      );
    await createNextRound(tx, {
      tournamentId: tournament.id,
      stageId: stage.id,
      previousRound: round,
      previousGroups: groups,
      qualifiedEntries,
    });
    await tx
      .update(tournamentStagesTable)
      .set({ currentRound: round.roundNumber + 1, version: stage.version + 1 })
      .where(eq(tournamentStagesTable.id, stage.id));
    await tx
      .update(tournamentsTable)
      .set({ currentRound: round.roundNumber + 1 })
      .where(eq(tournamentsTable.id, tournament.id));
  });
  return getMarvelEliminationStageState(input);
}

export async function assignMarvelManualGroups(input: {
  tournamentId: number;
  stageId: number;
  groups: readonly MarvelGroupAssignment[];
  actor?: TournamentMutationActor;
}): Promise<MarvelEliminationStageState> {
  await db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId))
      .for("update");
    if (!tournament) {
      throw new MarvelEliminationStageError("MARVEL_STAGE_NOT_FOUND");
    }
    await revalidateTournamentMutationActor(tx, tournament, input.actor);
    const [stage] = await tx
      .select()
      .from(tournamentStagesTable)
      .where(
        and(
          eq(tournamentStagesTable.id, input.stageId),
          eq(tournamentStagesTable.tournamentId, input.tournamentId),
        ),
      )
      .for("update");
    if (!stage || stage.status !== "active") {
      throw new MarvelEliminationStageError("MARVEL_STAGE_NOT_ACTIVE");
    }
    await loadMarvelConfig(tx, input.tournamentId);
    const [round] = await tx
      .select()
      .from(marvelStageRoundsTable)
      .where(
        and(
          eq(marvelStageRoundsTable.stageId, stage.id),
          eq(marvelStageRoundsTable.status, "awaiting_manual"),
        ),
      )
      .for("update");
    if (!round) {
      throw new MarvelEliminationStageError(
        "MARVEL_MANUAL_GROUPING_NOT_REQUIRED",
      );
    }
    const [previousRound] = await tx
      .select()
      .from(marvelStageRoundsTable)
      .where(
        and(
          eq(marvelStageRoundsTable.stageId, stage.id),
          eq(marvelStageRoundsTable.roundNumber, round.roundNumber - 1),
        ),
      );
    const qualifiers = await tx
      .select()
      .from(marvelStageGroupEntriesTable)
      .where(
        and(
          eq(marvelStageGroupEntriesTable.roundId, previousRound.id),
          eq(marvelStageGroupEntriesTable.qualified, true),
        ),
      );
    let assignments: MarvelGroupAssignment[];
    try {
      assignments = validateMarvelManualGroups(
        qualifiers.map((entry) => entry.playerId),
        input.groups,
        round.groupSize,
      );
    } catch {
      throw new MarvelEliminationStageError("MARVEL_MANUAL_GROUPING_INVALID");
    }
    await insertRoundGroups(tx, {
      tournamentId: tournament.id,
      stageId: stage.id,
      roundId: round.id,
      assignments,
      sourceGroupIdByPlayerId: new Map(
        qualifiers.map((entry) => [entry.playerId, entry.groupId]),
      ),
    });
    await tx
      .update(marvelStageRoundsTable)
      .set({ status: "active" })
      .where(eq(marvelStageRoundsTable.id, round.id));
  });
  return getMarvelEliminationStageState(input);
}

export interface MarvelEliminationStageState {
  tournamentId: number;
  stageId: number;
  status: string;
  currentRound: number | null;
  totalRounds: number | null;
  winnerId: number | null;
  config: MarvelTournamentConfigV1;
  rounds: Array<{
    id: number;
    roundNumber: number;
    participantCount: number;
    status: string;
    randomSeed: string | null;
    completedAt: string | null;
    groups: Array<{
      id: number;
      groupKey: string;
      position: number;
      status: string;
      completedAt: string | null;
      entries: Array<{
        playerId: number;
        playerName: string;
        groupSlot: number;
        placement: number | null;
        kills: number | null;
        qualified: boolean | null;
        sourceGroupId: number | null;
        nextGroupId: number | null;
      }>;
    }>;
  }>;
}

export async function getMarvelEliminationStageState(input: {
  tournamentId: number;
  stageId: number;
}): Promise<MarvelEliminationStageState> {
  const [stage] = await db
    .select()
    .from(tournamentStagesTable)
    .where(
      and(
        eq(tournamentStagesTable.id, input.stageId),
        eq(tournamentStagesTable.tournamentId, input.tournamentId),
      ),
    );
  if (!stage) {
    throw new MarvelEliminationStageError("MARVEL_STAGE_NOT_FOUND");
  }
  const config = await db.transaction((tx) =>
    loadMarvelConfig(tx, input.tournamentId),
  );
  const rounds = await db
    .select()
    .from(marvelStageRoundsTable)
    .where(eq(marvelStageRoundsTable.stageId, stage.id))
    .orderBy(asc(marvelStageRoundsTable.roundNumber));
  const groups =
    rounds.length === 0
      ? []
      : await db
          .select()
          .from(marvelStageGroupsTable)
          .where(
            inArray(
              marvelStageGroupsTable.roundId,
              rounds.map((round) => round.id),
            ),
          )
          .orderBy(asc(marvelStageGroupsTable.position));
  const entries =
    groups.length === 0
      ? []
      : await db
          .select()
          .from(marvelStageGroupEntriesTable)
          .where(
            inArray(
              marvelStageGroupEntriesTable.groupId,
              groups.map((group) => group.id),
            ),
          )
          .orderBy(asc(marvelStageGroupEntriesTable.groupSlot));
  const players =
    entries.length === 0
      ? []
      : await db
          .select({ id: playersTable.id, name: playersTable.name })
          .from(playersTable)
          .where(
            inArray(playersTable.id, [
              ...new Set(entries.map((entry) => entry.playerId)),
            ]),
          );
  const playerNameById = new Map(
    players.map((player) => [player.id, player.name]),
  );
  const nextGroupIdByPlayerAndSource = new Map(
    entries
      .filter((entry) => entry.sourceGroupId != null)
      .map((entry) => [
        `${entry.playerId}:${entry.sourceGroupId}`,
        entry.groupId,
      ]),
  );
  return {
    tournamentId: input.tournamentId,
    stageId: stage.id,
    status: stage.status,
    currentRound: stage.currentRound,
    totalRounds: stage.totalRounds,
    winnerId: stage.winnerId,
    config,
    rounds: rounds.map((round) => ({
      id: round.id,
      roundNumber: round.roundNumber,
      participantCount: round.participantCount,
      status: round.status,
      randomSeed: round.randomSeed,
      completedAt: serializeDate(round.completedAt),
      groups: groups
        .filter((group) => group.roundId === round.id)
        .map((group) => ({
          id: group.id,
          groupKey: group.groupKey,
          position: group.position,
          status: group.status,
          completedAt: serializeDate(group.completedAt),
          entries: entries
            .filter((entry) => entry.groupId === group.id)
            .map((entry) => ({
              playerId: entry.playerId,
              playerName:
                playerNameById.get(entry.playerId) ?? String(entry.playerId),
              groupSlot: entry.groupSlot,
              placement: entry.placement,
              kills: entry.kills,
              qualified: entry.qualified,
              sourceGroupId: entry.sourceGroupId,
              nextGroupId:
                nextGroupIdByPlayerAndSource.get(
                  `${entry.playerId}:${group.id}`,
                ) ?? null,
            })),
        })),
    })),
  };
}
