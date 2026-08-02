import { createHash } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchesTable,
  playersTable,
  resultHistoryTable,
  stageGroupsTable,
  stageParticipantsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  buildGroupPlayoffSlots,
  type GroupKey,
} from "../../domain/tournament/group-playoff";
import { generateRoundRobinSchedule } from "../../domain/tournament/round-robin";
import {
  rankRoundRobinOrGroup,
  rankSwissStage,
  type StageHeadToHeadResult,
} from "../../domain/tournament/stage-ranking";
import { calculateMatchRecordStandings } from "../../domain/tournament/standings";
import { generateSwissPairings } from "../../domain/tournament/swiss";
import {
  assertStageStartReady,
  evaluateStageStartReadiness,
  StageLifecycleError,
  type StageLifecycleErrorCode,
  type StageStartReadiness,
} from "./stage-start-readiness";

export {
  assertStageStartReady,
  evaluateStageStartReadiness,
  StageLifecycleError,
  type StageLifecycleErrorCode,
  type StageStartReadiness,
  type StageStartValidationSnapshot,
} from "./stage-start-readiness";

export interface StageLifecycleTestHooks {
  /** Test-only fault seam. It is never wired to an HTTP field, header, or environment variable. */
  afterGroupsWritten?: () => void | Promise<void>;
  /** Test-only fault seam. It is never wired to an HTTP field, header, or environment variable. */
  afterStageParticipantsWritten?: () => void | Promise<void>;
  /** Test-only fault seam. It is never wired to an HTTP field, header, or environment variable. */
  afterMatchesWritten?: () => void | Promise<void>;
}

interface RankedParticipant {
  stageParticipantId: number;
  playerId: number;
  playerName: string;
  stageSeed: number;
  rank: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  buchholz: number | null;
  groupId?: number;
  groupKey?: GroupKey;
  groupRank?: number;
}

export interface QualificationPreview {
  tournamentId: number;
  stageId: number;
  stageVersion: number;
  fingerprint: string;
  ranking: RankedParticipant[];
  qualifiers: Array<RankedParticipant & {
    qualificationSource: "standings" | "group_position";
    nextStageSeed: number;
  }>;
}

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
  });
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(2, value)));
}

function bracketPositions(size: number): number[] {
  if (size === 2) return [1, 2];
  const previous = bracketPositions(size / 2);
  return previous.flatMap((seed) => [seed, size + 1 - seed]);
}

function assertStageComplete(
  stage: typeof tournamentStagesTable.$inferSelect,
  matches: Array<typeof matchesTable.$inferSelect>,
  participantCount: number,
): void {
  if (matches.length === 0 || matches.some((match) => match.status !== "completed")) {
    throw new StageLifecycleError("STAGE_INCOMPLETE");
  }

  if (stage.format === "swiss") {
    const plannedRounds = stage.plannedRounds;
    const rounds = new Set(matches.map((match) => match.round));
    if (
      plannedRounds == null ||
      rounds.size !== plannedRounds ||
      [...rounds].some((round) => round < 1 || round > plannedRounds)
    ) {
      throw new StageLifecycleError("STAGE_INCOMPLETE");
    }
    return;
  }

  if (stage.format === "round_robin") {
    if (matches.length !== (participantCount * (participantCount - 1)) / 2) {
      throw new StageLifecycleError("STAGE_INCOMPLETE");
    }
    return;
  }

  if (stage.format === "group_stage") {
    const groupCount = stage.groupCount;
    const groupSize = stage.participantsPerGroup;
    if (groupCount == null || groupSize == null || groupCount * groupSize !== participantCount) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    const expectedPerGroup = (groupSize * (groupSize - 1)) / 2;
    const matchesByGroup = new Map<number, number>();
    for (const match of matches) {
      if (match.stageGroupId == null) throw new StageLifecycleError("STAGE_INCOMPLETE");
      matchesByGroup.set(match.stageGroupId, (matchesByGroup.get(match.stageGroupId) ?? 0) + 1);
    }
    if (
      matches.length !== groupCount * expectedPerGroup ||
      matchesByGroup.size !== groupCount ||
      [...matchesByGroup.values()].some((count) => count !== expectedPerGroup)
    ) {
      throw new StageLifecycleError("STAGE_INCOMPLETE");
    }
    return;
  }

  if (stage.format === "single_elimination") {
    if (matches.length !== nextPowerOfTwo(participantCount) - 1) {
      throw new StageLifecycleError("STAGE_INCOMPLETE");
    }
    const finalRound = Math.max(...matches.map((match) => match.round));
    const finalMatches = matches.filter((match) => match.round === finalRound);
    if (finalMatches.length !== 1 || finalMatches[0].winnerId == null) {
      throw new StageLifecycleError("STAGE_INCOMPLETE");
    }
    return;
  }

  throw new StageLifecycleError("STAGE_FORMAT_NOT_SUPPORTED");
}

function calculateRanking(
  stage: typeof tournamentStagesTable.$inferSelect,
  memberships: Array<typeof stageParticipantsTable.$inferSelect>,
  players: Array<typeof playersTable.$inferSelect>,
  matches: Array<typeof matchesTable.$inferSelect>,
): RankedParticipant[] {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const membershipByPlayerId = new Map(memberships.map((membership) => [membership.playerId, membership]));
  const stagePlayers = memberships.map((membership) => {
    const player = playerById.get(membership.playerId);
    if (!player) throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    return { ...player, seed: membership.stageSeed, status: "active" as const };
  });
  const format = stage.format === "swiss" ? "swiss" : stage.format === "round_robin" ? "round_robin" : null;
  const projections = format == null
    ? calculateMatchRecordStandings(stagePlayers, matches, "single_elimination")
    : calculateMatchRecordStandings(stagePlayers, matches, format);
  const projectionByPlayerId = new Map(projections.map((entry) => [entry.playerId, entry]));

  if (stage.format === "swiss") {
    const result = rankSwissStage(projections.map((entry) => ({
      participantKey: String(entry.playerId),
      matchWins: entry.matchWins,
      buchholz: entry.buchholz ?? 0,
      gameDiff: entry.gameDiff,
      gameWins: entry.gameWins,
      stageSeed: membershipByPlayerId.get(entry.playerId)?.stageSeed,
    })));
    if (!result.valid) throw new StageLifecycleError("RANKING_INCONSISTENT");
    return result.standings.map((entry) => {
      const playerId = Number(entry.participantKey);
      const projection = projectionByPlayerId.get(playerId)!;
      const membership = membershipByPlayerId.get(playerId)!;
      return {
        stageParticipantId: membership.id,
        playerId,
        playerName: projection.playerName,
        stageSeed: entry.stageSeed,
        rank: entry.rank,
        matchWins: projection.matchWins,
        matchLosses: projection.matchLosses,
        gameWins: projection.gameWins,
        gameLosses: projection.gameLosses,
        gameDiff: projection.gameDiff,
        buchholz: projection.buchholz,
      };
    });
  }

  if (stage.format === "round_robin") {
    const headToHead: StageHeadToHeadResult[] = matches.map((match) => ({
      participant1Key: String(match.player1Id),
      participant2Key: String(match.player2Id),
      status: match.status,
      resultType: match.resultType === "bye" ? null : match.resultType,
      winnerKey: match.winnerId == null ? null : String(match.winnerId),
    }));
    const result = rankRoundRobinOrGroup(projections.map((entry) => ({
      participantKey: String(entry.playerId),
      matchWins: entry.matchWins,
      gameDiff: entry.gameDiff,
      gameWins: entry.gameWins,
      stageSeed: membershipByPlayerId.get(entry.playerId)?.stageSeed,
    })), headToHead);
    if (!result.valid) throw new StageLifecycleError("RANKING_INCONSISTENT");
    return result.standings.map((entry) => {
      const playerId = Number(entry.participantKey);
      const projection = projectionByPlayerId.get(playerId)!;
      const membership = membershipByPlayerId.get(playerId)!;
      return {
        stageParticipantId: membership.id,
        playerId,
        playerName: projection.playerName,
        stageSeed: entry.stageSeed,
        rank: entry.rank,
        matchWins: projection.matchWins,
        matchLosses: projection.matchLosses,
        gameWins: projection.gameWins,
        gameLosses: projection.gameLosses,
        gameDiff: projection.gameDiff,
        buchholz: null,
      };
    });
  }

  if (stage.format === "single_elimination") {
    const lossRoundByPlayerId = new Map<number, number>();
    let winnerId: number | null = null;
    for (const match of matches) {
      if (match.winnerId == null) continue;
      if (match.player1Id != null && match.player1Id !== match.winnerId) lossRoundByPlayerId.set(match.player1Id, match.round);
      if (match.player2Id != null && match.player2Id !== match.winnerId) lossRoundByPlayerId.set(match.player2Id, match.round);
      winnerId = match.round >= Math.max(...matches.map((candidate) => candidate.round)) ? match.winnerId : winnerId;
    }
    const ordered = [...memberships].sort((left, right) => {
      if (left.playerId === winnerId) return -1;
      if (right.playerId === winnerId) return 1;
      return (lossRoundByPlayerId.get(right.playerId) ?? 0) - (lossRoundByPlayerId.get(left.playerId) ?? 0)
        || left.stageSeed - right.stageSeed;
    });
    return ordered.map((membership, index) => {
      const projection = projectionByPlayerId.get(membership.playerId)!;
      return {
        stageParticipantId: membership.id,
        playerId: membership.playerId,
        playerName: projection.playerName,
        stageSeed: membership.stageSeed,
        rank: index + 1,
        matchWins: projection.matchWins,
        matchLosses: projection.matchLosses,
        gameWins: projection.gameWins,
        gameLosses: projection.gameLosses,
        gameDiff: projection.gameDiff,
        buchholz: null,
      };
    });
  }

  throw new StageLifecycleError("STAGE_FORMAT_NOT_SUPPORTED");
}

function calculateGroupRanking(
  stage: typeof tournamentStagesTable.$inferSelect,
  groups: Array<typeof stageGroupsTable.$inferSelect>,
  memberships: Array<typeof stageParticipantsTable.$inferSelect>,
  players: Array<typeof playersTable.$inferSelect>,
  matches: Array<typeof matchesTable.$inferSelect>,
): RankedParticipant[] {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const ranking: RankedParticipant[] = [];
  for (const group of [...groups].sort((left, right) => left.position - right.position)) {
    const groupMemberships = memberships
      .filter((membership) => membership.groupId === group.id)
      .sort((left, right) => left.stageSeed - right.stageSeed);
    if (groupMemberships.length !== group.participantCount) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    const groupPlayers = groupMemberships.map((membership) => {
      const player = playerById.get(membership.playerId);
      if (!player) throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
      return { ...player, seed: membership.stageSeed, status: "active" as const };
    });
    const groupMatches = matches.filter((match) => match.stageGroupId === group.id);
    const projections = calculateMatchRecordStandings(groupPlayers, groupMatches, "round_robin");
    const projectionByPlayerId = new Map(projections.map((entry) => [entry.playerId, entry]));
    const result = rankRoundRobinOrGroup(
      projections.map((entry) => ({
        participantKey: String(entry.playerId),
        matchWins: entry.matchWins,
        gameDiff: entry.gameDiff,
        gameWins: entry.gameWins,
        stageSeed: groupMemberships.find((membership) => membership.playerId === entry.playerId)?.stageSeed,
      })),
      groupMatches.map((match) => ({
        participant1Key: String(match.player1Id),
        participant2Key: String(match.player2Id),
        status: match.status,
        resultType: match.resultType === "bye" ? null : match.resultType,
        winnerKey: match.winnerId == null ? null : String(match.winnerId),
      })),
    );
    if (!result.valid) throw new StageLifecycleError("RANKING_INCONSISTENT");
    for (const entry of result.standings) {
      const playerId = Number(entry.participantKey);
      const projection = projectionByPlayerId.get(playerId)!;
      const membership = groupMemberships.find((candidate) => candidate.playerId === playerId)!;
      ranking.push({
        stageParticipantId: membership.id,
        playerId,
        playerName: projection.playerName,
        stageSeed: membership.stageSeed,
        rank: entry.rank,
        matchWins: projection.matchWins,
        matchLosses: projection.matchLosses,
        gameWins: projection.gameWins,
        gameLosses: projection.gameLosses,
        gameDiff: projection.gameDiff,
        buchholz: null,
        groupId: group.id,
        groupKey: group.groupKey as GroupKey,
        groupRank: entry.rank,
      });
    }
  }
  if (ranking.length !== stage.participantCount) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  return ranking;
}

function buildGroupPreview(params: {
  tournamentId: number;
  stage: typeof tournamentStagesTable.$inferSelect;
  ranking: RankedParticipant[];
}): QualificationPreview {
  const groupCount = params.stage.groupCount;
  const qualifiersPerGroup = params.stage.qualifiersPerGroup;
  if (groupCount == null || qualifiersPerGroup == null) {
    throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
  }
  const playoff = buildGroupPlayoffSlots({ groupCount, qualifiersPerGroup });
  if (!playoff.ok) throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
  const bracketSeeds = bracketPositions(groupCount * qualifiersPerGroup);
  const qualifiers = playoff.slots.map((slot, slotIndex) => {
    const qualifier = params.ranking.find(
      (entry) => entry.groupKey === slot.source.groupKey && entry.groupRank === slot.source.groupRank,
    );
    if (!qualifier) throw new StageLifecycleError("RANKING_INCONSISTENT");
    return {
      ...qualifier,
      qualificationSource: "group_position" as const,
      nextStageSeed: bracketSeeds[slotIndex],
    };
  });
  const fingerprint = createHash("sha256").update(JSON.stringify({
    tournamentId: params.tournamentId,
    stageId: params.stage.id,
    stageVersion: params.stage.version,
    ranking: params.ranking.map(({ playerId, groupKey, groupRank, stageSeed, matchWins, gameDiff, gameWins }) => ({
      playerId, groupKey, groupRank, stageSeed, matchWins, gameDiff, gameWins,
    })),
    qualifiers: qualifiers.map(({ playerId, groupKey, groupRank, nextStageSeed }) => ({
      playerId, groupKey, groupRank, nextStageSeed,
    })),
  })).digest("hex");
  return {
    tournamentId: params.tournamentId,
    stageId: params.stage.id,
    stageVersion: params.stage.version,
    fingerprint,
    ranking: params.ranking,
    qualifiers,
  };
}

function snakeGroupIndex(participantIndex: number, groupCount: number): number {
  const position = participantIndex % (groupCount * 2);
  return position < groupCount ? position : groupCount * 2 - 1 - position;
}

const GROUP_KEYS: readonly GroupKey[] = ["A", "B", "C", "D"];

function buildPreview(params: {
  tournamentId: number;
  stage: typeof tournamentStagesTable.$inferSelect;
  ranking: RankedParticipant[];
  advancingCount: number;
}): QualificationPreview {
  const qualifiers = params.ranking.slice(0, params.advancingCount).map((entry, index) => ({
    ...entry,
    qualificationSource: "standings" as const,
    nextStageSeed: index + 1,
  }));
  const fingerprint = createHash("sha256").update(JSON.stringify({
    tournamentId: params.tournamentId,
    stageId: params.stage.id,
    stageVersion: params.stage.version,
    ranking: params.ranking.map(({ playerId, rank, stageSeed, matchWins, gameDiff, gameWins, buchholz }) => ({
      playerId, rank, stageSeed, matchWins, gameDiff, gameWins, buchholz,
    })),
  })).digest("hex");
  return {
    tournamentId: params.tournamentId,
    stageId: params.stage.id,
    stageVersion: params.stage.version,
    fingerprint,
    ranking: params.ranking,
    qualifiers,
  };
}

export async function getQualificationPreview(input: {
  tournamentId: number;
  stageId: number;
}): Promise<QualificationPreview> {
  const [tournament] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, input.tournamentId));
  if (!tournament) throw new StageLifecycleError("TOURNAMENT_NOT_FOUND");
  const stages = await db.select().from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.tournamentId, input.tournamentId))
    .orderBy(asc(tournamentStagesTable.position));
  const stage = stages.find((candidate) => candidate.id === input.stageId);
  if (!stage) throw new StageLifecycleError("STAGE_NOT_FOUND");
  if (stage.status !== "active" || tournament.activeStageId !== stage.id) {
    throw new StageLifecycleError("STAGE_NOT_ACTIVE");
  }
  const memberships = await db.select().from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.stageId, stage.id)).orderBy(asc(stageParticipantsTable.stageSeed));
  const players = memberships.length === 0 ? [] : await db.select().from(playersTable)
    .where(inArray(playersTable.id, memberships.map((membership) => membership.playerId)));
  const matches = await db.select().from(matchesTable)
    .where(eq(matchesTable.stageId, stage.id)).orderBy(asc(matchesTable.round), asc(matchesTable.matchNumber));
  if (memberships.length !== stage.participantCount || players.length !== memberships.length) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  assertStageComplete(stage, matches, memberships.length);
  const nextStage = stages.find((candidate) => candidate.position === stage.position + 1);
  if (stage.format === "group_stage") {
    const groups = await db.select().from(stageGroupsTable)
      .where(eq(stageGroupsTable.stageId, stage.id)).orderBy(asc(stageGroupsTable.position));
    const qualifierCount = (stage.groupCount ?? 0) * (stage.qualifiersPerGroup ?? 0);
    if (
      groups.length !== stage.groupCount ||
      stage.qualificationMode !== "top_n_per_group" ||
      !nextStage ||
      nextStage.format !== "single_elimination" ||
      nextStage.participantCount !== qualifierCount
    ) {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
    return buildGroupPreview({
      tournamentId: tournament.id,
      stage,
      ranking: calculateGroupRanking(stage, groups, memberships, players, matches),
    });
  }
  const advancingCount = nextStage == null ? 0 : stage.advancingCount ?? 0;
  if (nextStage && (
    stage.qualificationMode !== "top_n" ||
    advancingCount !== nextStage.participantCount ||
    advancingCount < 2 ||
    advancingCount >= memberships.length
  )) {
    throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
  }
  return buildPreview({
    tournamentId: tournament.id,
    stage,
    ranking: calculateRanking(stage, memberships, players, matches),
    advancingCount,
  });
}

export async function completeStage(
  input: { tournamentId: number; stageId: number },
  testHooks: StageLifecycleTestHooks = {},
): Promise<QualificationPreview> {
  return db.transaction(async (tx) => {
    const [tournament] = await tx.select().from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId)).for("update");
    if (!tournament) throw new StageLifecycleError("TOURNAMENT_NOT_FOUND");
    const stages = await tx.select().from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournament.id))
      .orderBy(asc(tournamentStagesTable.position)).for("update");
    const stage = stages.find((candidate) => candidate.id === input.stageId);
    if (!stage) throw new StageLifecycleError("STAGE_NOT_FOUND");
    if (stage.status === "completed") throw new StageLifecycleError("STAGE_ALREADY_COMPLETED");
    if (stage.status !== "active" || tournament.activeStageId !== stage.id) {
      throw new StageLifecycleError("STAGE_NOT_ACTIVE");
    }
    const memberships = await tx.select().from(stageParticipantsTable)
      .where(eq(stageParticipantsTable.stageId, stage.id))
      .orderBy(asc(stageParticipantsTable.stageSeed)).for("update");
    const players = memberships.length === 0 ? [] : await tx.select().from(playersTable)
      .where(inArray(playersTable.id, memberships.map((membership) => membership.playerId))).for("update");
    const matches = await tx.select().from(matchesTable)
      .where(eq(matchesTable.stageId, stage.id))
      .orderBy(asc(matchesTable.round), asc(matchesTable.matchNumber)).for("update");
    if (memberships.length !== stage.participantCount || players.length !== memberships.length) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    assertStageComplete(stage, matches, memberships.length);

    const nextStage = stages.find((candidate) => candidate.position === stage.position + 1);
    let preview: QualificationPreview;
    if (stage.format === "group_stage") {
      const groups = await tx.select().from(stageGroupsTable)
        .where(eq(stageGroupsTable.stageId, stage.id))
        .orderBy(asc(stageGroupsTable.position)).for("update");
      const qualifierCount = (stage.groupCount ?? 0) * (stage.qualifiersPerGroup ?? 0);
      if (
        groups.length !== stage.groupCount ||
        stage.qualificationMode !== "top_n_per_group" ||
        !nextStage ||
        nextStage.format !== "single_elimination" ||
        nextStage.participantCount !== qualifierCount
      ) {
        throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
      }
      preview = buildGroupPreview({
        tournamentId: tournament.id,
        stage,
        ranking: calculateGroupRanking(stage, groups, memberships, players, matches),
      });
    } else {
      const advancingCount = nextStage == null ? 0 : stage.advancingCount ?? 0;
      if (nextStage && (
        stage.qualificationMode !== "top_n" ||
        advancingCount !== nextStage.participantCount ||
        advancingCount < 2 ||
        advancingCount >= memberships.length
      )) {
        throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
      }
      if (!nextStage && stage.qualificationMode !== "none") {
        throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
      }
      preview = buildPreview({
        tournamentId: tournament.id,
        stage,
        ranking: calculateRanking(stage, memberships, players, matches),
        advancingCount,
      });
    }
    const qualifierByPlayerId = new Map(preview.qualifiers.map((qualifier) => [qualifier.playerId, qualifier]));
    const now = new Date();
    for (const entry of preview.ranking) {
      const qualifier = qualifierByPlayerId.get(entry.playerId);
      await tx.update(stageParticipantsTable).set({
        finalRank: stage.format === "group_stage" ? null : entry.rank,
        groupRank: stage.format === "group_stage" ? entry.groupRank : null,
        status: nextStage == null
          ? entry.rank === 1 ? "winner" : "eliminated"
          : qualifier ? "qualified" : "eliminated",
        qualificationRank: qualifier?.groupRank ?? qualifier?.rank ?? null,
        nextStageSeed: qualifier?.nextStageSeed ?? null,
        qualifiedAt: qualifier ? now : null,
      }).where(eq(stageParticipantsTable.id, entry.stageParticipantId));
    }

    if (nextStage) {
      const existing = await tx.select({ id: stageParticipantsTable.id })
        .from(stageParticipantsTable).where(eq(stageParticipantsTable.stageId, nextStage.id)).for("update");
      if (existing.length > 0) throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
      await tx.insert(stageParticipantsTable).values(preview.qualifiers.map((qualifier) => ({
        tournamentId: tournament.id,
        stageId: nextStage.id,
        playerId: qualifier.playerId,
        stageSeed: qualifier.nextStageSeed,
        status: "active" as const,
        qualificationSource: qualifier.qualificationSource,
        sourceStageParticipantId: qualifier.stageParticipantId,
      })));
    }
    await testHooks.afterStageParticipantsWritten?.();

    const winnerId = stage.format === "group_stage" ? null : preview.ranking[0]?.playerId ?? null;
    await tx.update(tournamentStagesTable).set({
      status: "completed",
      winnerId,
      completedAt: now,
      version: stage.version + 1,
    }).where(and(eq(tournamentStagesTable.id, stage.id), eq(tournamentStagesTable.status, "active")));

    if (nextStage) {
      await tx.update(tournamentsTable).set({ activeStageId: null, winnerId: null })
        .where(eq(tournamentsTable.id, tournament.id));
    } else {
      await tx.update(tournamentsTable).set({
        status: "completed",
        activeStageId: null,
        winnerId,
      }).where(eq(tournamentsTable.id, tournament.id));
      if (winnerId != null) {
        await tx.update(playersTable).set({ status: "eliminated" })
          .where(eq(playersTable.tournamentId, tournament.id));
        await tx.update(playersTable).set({ status: "winner" }).where(eq(playersTable.id, winnerId));
      }
    }
    await tx.insert(actionLogTable).values({
      tournamentId: tournament.id,
      stageId: stage.id,
      actionType: "stage_completed",
      description: `Zakończono etap ${stage.name}`,
      matchId: null,
      undoPayload: null,
      isUndone: false,
    });
    return preview;
  });
}

function generateStageMatches(params: {
  tournamentId: number;
  stageId: number;
  stage: typeof tournamentStagesTable.$inferSelect;
  players: Array<typeof playersTable.$inferSelect>;
}): { values: Array<typeof matchesTable.$inferInsert>; totalRounds: number } {
  const { tournamentId, stageId, stage, players } = params;
  if (stage.format === "round_robin") {
    const pairings = generateRoundRobinSchedule(players);
    return {
      values: pairings.map((pairing) => ({
        tournamentId, stageId, round: pairing.round, matchNumber: pairing.matchNumber,
        player1Id: pairing.player1Id, player2Id: pairing.player2Id,
        bestOf: stage.bestOf, status: "pending" as const,
      })),
      totalRounds: Math.max(...pairings.map((pairing) => pairing.round), 1),
    };
  }
  if (stage.format === "swiss") {
    const standings = calculateMatchRecordStandings(players, [], "swiss");
    const now = new Date();
    const pairings = generateSwissPairings({ players, standings, previousMatches: [], round: 1 });
    return {
      values: pairings.map((pairing) => ({
        tournamentId, stageId, round: 1, matchNumber: pairing.matchNumber,
        player1Id: pairing.player1Id, player2Id: pairing.player2Id,
        bestOf: stage.bestOf,
        status: pairing.resultType === "bye" ? "completed" as const : "pending" as const,
        resultType: pairing.resultType,
        resultReason: pairing.resultType === "bye" ? "system_bye" : null,
        winnerId: pairing.resultType === "bye" ? pairing.player1Id : null,
        completedAt: pairing.resultType === "bye" ? now : null,
      })),
      totalRounds: stage.plannedRounds!,
    };
  }
  if (stage.format === "single_elimination") {
    const ordered = [...players].sort((left, right) => (left.seed ?? Number.MAX_SAFE_INTEGER) - (right.seed ?? Number.MAX_SAFE_INTEGER));
    const size = nextPowerOfTwo(ordered.length);
    const totalRounds = Math.ceil(Math.log2(size));
    const positions = bracketPositions(size);
    const values: Array<typeof matchesTable.$inferInsert> = [];
    const now = new Date();
    for (let index = 0; index < size / 2; index += 1) {
      const player1 = ordered[positions[index * 2] - 1] ?? null;
      const player2 = ordered[positions[index * 2 + 1] - 1] ?? null;
      const bye = player1 != null && player2 == null;
      values.push({
        tournamentId, stageId, round: 1, matchNumber: index + 1,
        player1Id: player1?.id ?? null, player2Id: player2?.id ?? null,
        bestOf: stage.bestOf, status: bye ? "completed" : "pending",
        resultType: bye ? "bye" : null, resultReason: bye ? "system_bye" : null,
        winnerId: bye ? player1.id : null, completedAt: bye ? now : null,
      });
    }
    for (let round = 2; round <= totalRounds; round += 1) {
      for (let matchNumber = 1; matchNumber <= 2 ** (totalRounds - round); matchNumber += 1) {
        values.push({ tournamentId, stageId, round, matchNumber, bestOf: stage.bestOf, status: "pending" });
      }
    }
    return { values, totalRounds };
  }
  throw new StageLifecycleError("STAGE_FORMAT_NOT_SUPPORTED");
}

export async function startStage(
  input: { tournamentId: number; stageId: number },
  testHooks: StageLifecycleTestHooks = {},
): Promise<typeof tournamentStagesTable.$inferSelect> {
  return db.transaction(async (tx) => {
    const [tournament] = await tx.select().from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId)).for("update");
    if (!tournament) throw new StageLifecycleError("TOURNAMENT_NOT_FOUND");
    const stages = await tx.select().from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournament.id))
      .orderBy(asc(tournamentStagesTable.position)).for("update");
    const stage = stages.find((candidate) => candidate.id === input.stageId);
    if (!stage) throw new StageLifecycleError("STAGE_NOT_FOUND");
    const previous = stages.find((candidate) => candidate.position === stage.position - 1);

    const existingMatches = await tx.select({ id: matchesTable.id }).from(matchesTable)
      .where(eq(matchesTable.stageId, stage.id)).for("update");
    const existingGroups = await tx.select({ id: stageGroupsTable.id }).from(stageGroupsTable)
      .where(eq(stageGroupsTable.stageId, stage.id)).for("update");
    const memberships = await tx.select().from(stageParticipantsTable)
      .where(eq(stageParticipantsTable.stageId, stage.id))
      .orderBy(asc(stageParticipantsTable.stageSeed)).for("update");
    const sourceMemberships = previous
      ? await tx.select().from(stageParticipantsTable)
        .where(eq(stageParticipantsTable.stageId, previous.id)).for("update")
      : [];
    const sourceGroups = previous?.format === "group_stage"
      ? await tx.select().from(stageGroupsTable)
        .where(eq(stageGroupsTable.stageId, previous.id)).for("update")
      : [];
    const players = memberships.length === 0
      ? []
      : await tx.select().from(playersTable)
        .where(inArray(playersTable.id, memberships.map((membership) => membership.playerId))).for("update");
    assertStageStartReady({
      tournament,
      stages,
      stage,
      existingMatchCount: existingMatches.length,
      existingGroupCount: existingGroups.length,
      memberships,
      sourceMemberships,
      sourceGroups,
      players,
    });
    const playerById = new Map(players.map((player) => [player.id, player]));
    const stagePlayers = memberships.map((membership) => ({
      ...playerById.get(membership.playerId)!,
      seed: membership.stageSeed,
      status: "active" as const,
    }));
    let inserted: Array<typeof matchesTable.$inferSelect>;
    let totalRounds: number;
    if (stage.format === "group_stage") {
      const groupCount = stage.groupCount!;
      const groupSize = stage.participantsPerGroup!;
      const qualifiersPerGroup = stage.qualifiersPerGroup!;
      const groups = (await tx.insert(stageGroupsTable).values(
        GROUP_KEYS.slice(0, groupCount).map((groupKey, index) => ({
          stageId: stage.id,
          groupKey,
          position: index + 1,
          participantCount: groupSize,
          qualifiersCount: qualifiersPerGroup,
        })),
      ).returning()).sort((left, right) => left.position - right.position);
      const membershipsByGroup = new Map<number, Array<typeof stageParticipantsTable.$inferSelect>>();
      for (let index = 0; index < memberships.length; index += 1) {
        const group = groups[snakeGroupIndex(index, groupCount)];
        const membership = memberships[index];
        await tx.update(stageParticipantsTable).set({ groupId: group.id })
          .where(eq(stageParticipantsTable.id, membership.id));
        const assigned = membershipsByGroup.get(group.id) ?? [];
        assigned.push({ ...membership, groupId: group.id });
        membershipsByGroup.set(group.id, assigned);
      }
      await testHooks.afterGroupsWritten?.();

      const nextMatchNumberByRound = new Map<number, number>();
      const values: Array<typeof matchesTable.$inferInsert> = [];
      totalRounds = 1;
      for (const group of groups) {
        const groupPlayers = (membershipsByGroup.get(group.id) ?? []).map((membership) => ({
          ...playerById.get(membership.playerId)!,
          seed: membership.stageSeed,
        }));
        const pairings = generateRoundRobinSchedule(groupPlayers);
        for (const pairing of pairings) {
          const matchNumber = nextMatchNumberByRound.get(pairing.round) ?? 1;
          values.push({
            tournamentId: tournament.id,
            stageId: stage.id,
            stageGroupId: group.id,
            round: pairing.round,
            matchNumber,
            player1Id: pairing.player1Id,
            player2Id: pairing.player2Id,
            bestOf: stage.bestOf,
            status: "pending",
          });
          nextMatchNumberByRound.set(pairing.round, matchNumber + 1);
          totalRounds = Math.max(totalRounds, pairing.round);
        }
      }
      inserted = await tx.insert(matchesTable).values(values).returning();
    } else {
      const generated = generateStageMatches({
        tournamentId: tournament.id,
        stageId: stage.id,
        stage,
        players: stagePlayers,
      });
      totalRounds = generated.totalRounds;
      inserted = await tx.insert(matchesTable).values(generated.values).returning();
    }

    const byeMatches = inserted.filter((match) => match.resultType === "bye" && match.winnerId != null);
    if (stage.format === "single_elimination") {
      const secondRound = inserted.filter((match) => match.round === 2).sort((left, right) => left.matchNumber - right.matchNumber);
      for (const bye of byeMatches) {
        const target = secondRound[Math.floor((bye.matchNumber - 1) / 2)];
        if (!target) continue;
        const player1Slot = (bye.matchNumber - 1) % 2 === 0;
        await tx.update(matchesTable).set(player1Slot ? { player1Id: bye.winnerId } : { player2Id: bye.winnerId })
          .where(eq(matchesTable.id, target.id));
      }
    }
    for (const bye of byeMatches) {
      await tx.insert(resultHistoryTable).values({
        matchId: bye.id, tournamentId: tournament.id, stageId: stage.id,
        revision: 1, round: bye.round, matchNumber: bye.matchNumber,
        player1Id: bye.player1Id, player2Id: null, score1: null, score2: null,
        winnerId: bye.winnerId, bestOf: bye.bestOf, resultType: "bye",
        resultReason: "system_bye", completedAt: bye.completedAt!,
      });
      await tx.insert(actionLogTable).values({
        tournamentId: tournament.id, stageId: stage.id, actionType: "system_bye_assigned",
        description: `Systemowy bye R${bye.round}M${bye.matchNumber}`,
        matchId: bye.id, undoPayload: null, isUndone: false,
      });
    }
    await testHooks.afterMatchesWritten?.();

    const now = new Date();
    const [updatedStage] = await tx.update(tournamentStagesTable).set({
      status: "active", currentRound: 1, totalRounds,
      startedAt: now, completedAt: null, winnerId: null, version: stage.version + 1,
    }).where(and(eq(tournamentStagesTable.id, stage.id), eq(tournamentStagesTable.status, "planned"))).returning();
    if (!updatedStage) throw new StageLifecycleError("STAGE_ALREADY_STARTED");
    await tx.update(tournamentsTable).set({
      status: "active",
      activeStageId: stage.id,
      ...(stage.format === "group_stage" ? {} : { format: stage.format }),
      defaultBestOf: stage.bestOf,
      currentRound: 1,
      totalRounds,
      swissRounds: stage.format === "swiss" ? totalRounds : null,
      winnerId: null,
    }).where(eq(tournamentsTable.id, tournament.id));
    await tx.insert(actionLogTable).values({
      tournamentId: tournament.id, stageId: stage.id, actionType: "stage_started",
      description: `Uruchomiono etap ${stage.name}`,
      matchId: null, undoPayload: null, isUndone: false,
    });
    return updatedStage;
  });
}
