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
  calculateBalancedGroupSizes,
  calculateGroupQualifierCounts,
  groupKeyFromIndex,
  seedQualifiedGroupEntries,
  seedQualifiedGroupEntriesGlobally,
} from "../../domain/tournament/group-stage";
import { generateRoundRobinSchedule } from "../../domain/tournament/round-robin";
import {
  buildRandomBracket,
  buildRandomGroupPlacements,
  buildSnakeGroupPlacements,
  buildStandardSeededBracket,
  calculateSingleEliminationProgression,
} from "../../domain/tournament/stage-placement";
import { assignSeeds, type SeedingPolicy } from "../../domain/tournament/seeding";
import {
  buildSeedingCeremonyState,
  isCeremonyCurrent,
  markCeremonyApplied,
  parseSeedingCeremonyState,
  stageUsesRandomCeremony,
} from "./seeding-ceremony";
import {
  rankRoundRobinOrGroup,
  rankSwissStage,
  type StageHeadToHeadResult,
} from "../../domain/tournament/stage-ranking";
import { calculateMatchRecordStandings } from "../../domain/tournament/standings";
import { generateSwissPairings } from "../../domain/tournament/swiss";
import {
  revalidateTournamentMutationActor,
  type TournamentMutationActor,
} from "../../access-policy";

export type StageLifecycleErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_NOT_FOUND"
  | "STAGE_NOT_ACTIVE"
  | "STAGE_NOT_NEXT_PLANNED"
  | "ACTIVE_STAGE_EXISTS"
  | "PREVIOUS_STAGE_NOT_COMPLETED"
  | "STAGE_INCOMPLETE"
  | "STAGE_PARTICIPANTS_INCONSISTENT"
  | "QUALIFICATION_CONFIGURATION_INVALID"
  | "STAGE_FORMAT_NOT_SUPPORTED"
  | "STAGE_ALREADY_COMPLETED"
  | "STAGE_ALREADY_STARTED"
  | "MATCHES_ALREADY_EXIST"
  | "GROUPS_ALREADY_EXIST"
  | "RANKING_INCONSISTENT"
  | "STAGE_SEEDING_CONFIGURATION_INVALID"
  | "SEEDING_CEREMONY_REQUIRED"
  | "SEEDING_CEREMONY_INCOMPLETE"
  | "SEEDING_CEREMONY_STALE";

const ERROR_MESSAGES: Record<StageLifecycleErrorCode, string> = {
  TOURNAMENT_NOT_FOUND: "Turniej nie istnieje.",
  STAGE_NOT_FOUND: "Etap nie istnieje.",
  STAGE_NOT_ACTIVE: "Zakończyć można wyłącznie aktywny etap.",
  STAGE_NOT_NEXT_PLANNED: "Uruchomić można wyłącznie najbliższy zaplanowany etap.",
  ACTIVE_STAGE_EXISTS: "Inny etap turnieju jest już aktywny.",
  PREVIOUS_STAGE_NOT_COMPLETED: "Poprzedni etap nie został zakończony.",
  STAGE_INCOMPLETE: "Nie wszystkie wymagane mecze i rundy etapu są zakończone.",
  STAGE_PARTICIPANTS_INCONSISTENT: "Uczestnicy etapu są niespójni.",
  QUALIFICATION_CONFIGURATION_INVALID: "Konfiguracja kwalifikacji między etapami jest niespójna.",
  STAGE_FORMAT_NOT_SUPPORTED: "Ten format etapu nie jest jeszcze obsługiwany przez lifecycle.",
  STAGE_ALREADY_COMPLETED: "Etap został już zakończony.",
  STAGE_ALREADY_STARTED: "Etap został już uruchomiony.",
  MATCHES_ALREADY_EXIST: "Planowany etap zawiera już mecze.",
  GROUPS_ALREADY_EXIST: "Planowany etap zawiera już grupy.",
  RANKING_INCONSISTENT: "Nie można wyliczyć jednoznacznego rankingu etapu.",
  STAGE_SEEDING_CONFIGURATION_INVALID: "Konfiguracja seedowania lub rozmieszczenia etapu jest niespójna.",
  SEEDING_CEREMONY_REQUIRED: "Przed uruchomieniem etapu trzeba przygotować i przeprowadzić zaplanowane losowanie.",
  SEEDING_CEREMONY_INCOMPLETE: "Losowanie nie zostało jeszcze w całości ujawnione.",
  SEEDING_CEREMONY_STALE: "Przygotowane losowanie nie odpowiada aktualnym uczestnikom lub ustawieniom etapu.",
};

export class StageLifecycleError extends Error {
  constructor(public readonly code: StageLifecycleErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "StageLifecycleError";
  }
}

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
  groupKey?: string;
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

function assertStageComplete(
  stage: typeof tournamentStagesTable.$inferSelect,
  matches: Array<typeof matchesTable.$inferSelect>,
  participantCount: number,
  groups: Array<typeof stageGroupsTable.$inferSelect> = [],
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
    if (
      stage.groupCount == null ||
      groups.length !== stage.groupCount ||
      groups.reduce((sum, group) => sum + group.participantCount, 0) !== participantCount
    ) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    const expectedMatchesByGroup = new Map(
      groups.map((group) => [
        group.id,
        (group.participantCount * (group.participantCount - 1)) / 2,
      ]),
    );
    const matchesByGroup = new Map<number, number>();
    for (const match of matches) {
      if (match.stageGroupId == null || !expectedMatchesByGroup.has(match.stageGroupId)) {
        throw new StageLifecycleError("STAGE_INCOMPLETE");
      }
      matchesByGroup.set(
        match.stageGroupId,
        (matchesByGroup.get(match.stageGroupId) ?? 0) + 1,
      );
    }
    const expectedTotal = [...expectedMatchesByGroup.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    if (
      matches.length !== expectedTotal ||
      [...expectedMatchesByGroup].some(
        ([groupId, count]) => (matchesByGroup.get(groupId) ?? 0) !== count,
      )
    ) {
      throw new StageLifecycleError("STAGE_INCOMPLETE");
    }
    return;
  }

  if (stage.format === "single_elimination") {
    let progression;
    try {
      progression = calculateSingleEliminationProgression(
        participantCount,
        stage.qualificationMode === "top_n" ? stage.advancingCount ?? 0 : 1,
      );
    } catch {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
    if (
      matches.length !== progression.bracketMatchCount ||
      matches.some((match) => match.round < 1 || match.round > progression.rounds)
    ) {
      throw new StageLifecycleError("STAGE_INCOMPLETE");
    }
    const finalRound = Math.max(...matches.map((match) => match.round));
    const finalMatches = matches.filter((match) => match.round === finalRound);
    if (
      finalRound !== progression.rounds ||
      finalMatches.length !== progression.advancingCount ||
      finalMatches.some((match) => match.winnerId == null)
    ) {
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
    for (const match of matches) {
      if (match.winnerId == null) continue;
      if (match.player1Id != null && match.player1Id !== match.winnerId) lossRoundByPlayerId.set(match.player1Id, match.round);
      if (match.player2Id != null && match.player2Id !== match.winnerId) lossRoundByPlayerId.set(match.player2Id, match.round);
    }
    const ordered = [...memberships].sort((left, right) => {
      const leftLost = lossRoundByPlayerId.has(left.playerId);
      const rightLost = lossRoundByPlayerId.has(right.playerId);
      if (leftLost !== rightLost) return leftLost ? 1 : -1;
      return (lossRoundByPlayerId.get(right.playerId) ?? 0) - (lossRoundByPlayerId.get(left.playerId) ?? 0)
        || left.stageSeed - right.stageSeed;
    });
    const expectedSurvivors = stage.qualificationMode === "top_n" ? stage.advancingCount ?? 0 : 1;
    if (ordered.filter((membership) => !lossRoundByPlayerId.has(membership.playerId)).length !== expectedSurvivors) {
      throw new StageLifecycleError("RANKING_INCONSISTENT");
    }
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
        groupKey: group.groupKey,
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
  groups: Array<typeof stageGroupsTable.$inferSelect>;
  ranking: RankedParticipant[];
}): QualificationPreview {
  if (
    params.stage.groupCount == null ||
    params.groups.length !== params.stage.groupCount
  ) {
    throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
  }

  const qualifierLimitByGroupKey = new Map(
    params.groups.map((group) => [group.groupKey, group.qualifiersCount]),
  );
  const selected = params.ranking.filter((entry) => {
    const qualifierLimit = entry.groupKey == null
      ? null
      : qualifierLimitByGroupKey.get(entry.groupKey);
    return qualifierLimit != null && entry.groupRank != null && entry.groupRank <= qualifierLimit;
  });
  const selectedEntries = selected.map((entry) => ({
    ...entry,
    groupKey: entry.groupKey!,
    groupRank: entry.groupRank!,
  }));
  const seeded = params.stage.resultSeedingPolicy === "global_ranking"
    ? seedQualifiedGroupEntriesGlobally(selectedEntries)
    : seedQualifiedGroupEntries(selectedEntries);
  const qualifiers = seeded.map((entry) => ({
    ...entry,
    qualificationSource: "group_position" as const,
  }));

  const expectedQualifierCount = params.groups.reduce(
    (sum, group) => sum + group.qualifiersCount,
    0,
  );
  if (qualifiers.length !== expectedQualifierCount) {
    throw new StageLifecycleError("RANKING_INCONSISTENT");
  }

  const fingerprint = createHash("sha256").update(JSON.stringify({
    tournamentId: params.tournamentId,
    stageId: params.stage.id,
    stageVersion: params.stage.version,
    ranking: params.ranking.map(({
      playerId,
      groupKey,
      groupRank,
      stageSeed,
      matchWins,
      matchLosses,
      gameWins,
      gameLosses,
      gameDiff,
    }) => ({
      playerId,
      groupKey,
      groupRank,
      stageSeed,
      matchWins,
      matchLosses,
      gameWins,
      gameLosses,
      gameDiff,
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
  const groups = stage.format === "group_stage"
    ? await db.select().from(stageGroupsTable)
      .where(eq(stageGroupsTable.stageId, stage.id)).orderBy(asc(stageGroupsTable.position))
    : [];
  assertStageComplete(stage, matches, memberships.length, groups);
  const nextStage = stages.find((candidate) => candidate.position === stage.position + 1);
  if (stage.format === "group_stage") {
    const qualifierCount = groups.reduce((sum, group) => sum + group.qualifiersCount, 0);
    if (
      groups.length !== stage.groupCount ||
      stage.qualificationMode !== "top_n_per_group" ||
      !nextStage ||
      nextStage.participantCount !== qualifierCount
    ) {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
    return buildGroupPreview({
      tournamentId: tournament.id,
      stage,
      groups,
      ranking: calculateGroupRanking(stage, groups, memberships, players, matches),
    });
  }
  const advancingCount = nextStage == null ? 0 : stage.advancingCount ?? 0;
  if (nextStage && (
    stage.qualificationMode !== "top_n" ||
    advancingCount !== nextStage.participantCount ||
    advancingCount < 2 ||
    advancingCount > memberships.length
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
    let memberships = await tx.select().from(stageParticipantsTable)
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
    const groups = stage.format === "group_stage"
      ? await tx.select().from(stageGroupsTable)
        .where(eq(stageGroupsTable.stageId, stage.id))
        .orderBy(asc(stageGroupsTable.position)).for("update")
      : [];
    assertStageComplete(stage, matches, memberships.length, groups);

    const nextStage = stages.find((candidate) => candidate.position === stage.position + 1);
    let preview: QualificationPreview;
    if (stage.format === "group_stage") {
      const qualifierCount = groups.reduce((sum, group) => sum + group.qualifiersCount, 0);
      if (
        groups.length !== stage.groupCount ||
        stage.qualificationMode !== "top_n_per_group" ||
        !nextStage ||
        nextStage.participantCount !== qualifierCount
      ) {
        throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
      }
      preview = buildGroupPreview({
        tournamentId: tournament.id,
        stage,
        groups,
        ranking: calculateGroupRanking(stage, groups, memberships, players, matches),
      });
    } else {
      const advancingCount = nextStage == null ? 0 : stage.advancingCount ?? 0;
      if (nextStage && (
        stage.qualificationMode !== "top_n" ||
        advancingCount !== nextStage.participantCount ||
        advancingCount < 2 ||
        advancingCount > memberships.length
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

    const winnerId = stage.format === "group_stage" || (stage.format === "single_elimination" && nextStage)
      ? null
      : preview.ranking[0]?.playerId ?? null;
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
    const playerByKey = new Map(players.map((player) => [String(player.id), player]));
    const bracketParticipants = players.map((player) => ({
      participantKey: String(player.id),
      seed: player.seed ?? 0,
    }));
    const bracket = stage.seedingPolicy === "random_bracket"
      ? buildRandomBracket(bracketParticipants, `${stage.randomSeed ?? ""}:placement`)
      : buildStandardSeededBracket(bracketParticipants);
    let progression;
    try {
      progression = calculateSingleEliminationProgression(
        players.length,
        stage.qualificationMode === "top_n" ? stage.advancingCount ?? 0 : 1,
      );
    } catch {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
    const totalRounds = progression.rounds;
    const values: Array<typeof matchesTable.$inferInsert> = [];
    const now = new Date();
    for (const pairing of bracket.firstRound) {
      const player1 = pairing.player1.participant == null
        ? null
        : playerByKey.get(pairing.player1.participant.participantKey) ?? null;
      const player2 = pairing.player2.participant == null
        ? null
        : playerByKey.get(pairing.player2.participant.participantKey) ?? null;
      const byeWinner = pairing.byeWinner == null
        ? null
        : playerByKey.get(pairing.byeWinner.participantKey) ?? null;
      values.push({
        tournamentId, stageId, round: 1, matchNumber: pairing.matchNumber,
        player1Id: player1?.id ?? null, player2Id: player2?.id ?? null,
        bestOf: stage.bestOf, status: byeWinner == null ? "pending" : "completed",
        resultType: byeWinner == null ? null : "bye",
        resultReason: byeWinner == null ? null : "system_bye",
        winnerId: byeWinner?.id ?? null,
        completedAt: byeWinner == null ? null : now,
      });
    }
    for (let round = 2; round <= totalRounds; round += 1) {
      const matchesInRound = progression.advancingCount * 2 ** (totalRounds - round);
      for (let matchNumber = 1; matchNumber <= matchesInRound; matchNumber += 1) {
        values.push({ tournamentId, stageId, round, matchNumber, bestOf: stage.bestOf, status: "pending" });
      }
    }
    return { values, totalRounds };
  }
  throw new StageLifecycleError("STAGE_FORMAT_NOT_SUPPORTED");
}

export async function startStage(
  input: {
    tournamentId: number;
    stageId: number;
    actor?: TournamentMutationActor;
  },
  testHooks: StageLifecycleTestHooks = {},
): Promise<typeof tournamentStagesTable.$inferSelect> {
  return db.transaction(async (tx) => {
    const [tournament] = await tx.select().from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId)).for("update");
    if (!tournament) throw new StageLifecycleError("TOURNAMENT_NOT_FOUND");
    await revalidateTournamentMutationActor(tx, tournament, input.actor);
    const stages = await tx.select().from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournament.id))
      .orderBy(asc(tournamentStagesTable.position)).for("update");
    const stage = stages.find((candidate) => candidate.id === input.stageId);
    if (!stage) throw new StageLifecycleError("STAGE_NOT_FOUND");
    if (stage.status === "active") throw new StageLifecycleError("STAGE_ALREADY_STARTED");
    if (stage.status === "completed") throw new StageLifecycleError("STAGE_ALREADY_COMPLETED");
    if (tournament.activeStageId != null || stages.some((candidate) => candidate.status === "active")) {
      throw new StageLifecycleError("ACTIVE_STAGE_EXISTS");
    }
    const nextPlanned = stages.find((candidate) => candidate.status === "planned");
    if (!nextPlanned || nextPlanned.id !== stage.id) throw new StageLifecycleError("STAGE_NOT_NEXT_PLANNED");
    const previous = stages.find((candidate) => candidate.position === stage.position - 1);
    if (previous && previous.status !== "completed") throw new StageLifecycleError("PREVIOUS_STAGE_NOT_COMPLETED");

    const existingMatches = await tx.select({ id: matchesTable.id }).from(matchesTable)
      .where(eq(matchesTable.stageId, stage.id)).for("update");
    if (existingMatches.length > 0) throw new StageLifecycleError("MATCHES_ALREADY_EXIST");
    const existingGroups = await tx.select({ id: stageGroupsTable.id }).from(stageGroupsTable)
      .where(eq(stageGroupsTable.stageId, stage.id)).for("update");
    if (existingGroups.length > 0) throw new StageLifecycleError("GROUPS_ALREADY_EXIST");
    let memberships = await tx.select().from(stageParticipantsTable)
      .where(eq(stageParticipantsTable.stageId, stage.id))
      .orderBy(asc(stageParticipantsTable.stageSeed)).for("update");
    if (memberships.length !== stage.participantCount || memberships.length < 2) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    if (memberships.some((membership, index) => membership.stageSeed !== index + 1)) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    if (previous) {
      const sourceMemberships = await tx.select().from(stageParticipantsTable)
        .where(eq(stageParticipantsTable.stageId, previous.id)).for("update");
      const sourceById = new Map(sourceMemberships.map((membership) => [membership.id, membership]));
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
      const expectedQualificationSource = previous.format === "group_stage"
        ? "group_position"
        : "standings";
      if (memberships.some(
        (membership) => membership.qualificationSource !== expectedQualificationSource,
      )) {
        throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
      }
    } else if (memberships.some(
      (membership) => membership.sourceStageParticipantId != null || membership.qualificationSource !== "registration",
    )) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    const players = await tx.select().from(playersTable)
      .where(inArray(playersTable.id, memberships.map((membership) => membership.playerId))).for("update");
    const playerById = new Map(players.map((player) => [player.id, player]));
    if (players.length !== memberships.length || players.some((player) => player.tournamentId !== tournament.id)) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }

    const entryPolicy: SeedingPolicy = (() => {
      switch (stage.entrySeedingPolicy) {
        case "registration_order": return { type: "registration_order" };
        case "alphabetical": return { type: "alphabetical", locale: "pl" };
        case "random": return {
          type: "random",
          randomSeed: stage.randomSeed ?? "",
          revealOrder: "participant_order",
        };
        case "manual": return { type: "manual" };
        case "preserve": return { type: "preserve" };
      }
    })();
    const seedingResult = assignSeeds(
      memberships.map((membership) => {
        const player = playerById.get(membership.playerId)!;
        return {
          participantKey: String(membership.playerId),
          displayName: player.name,
          registrationOrder: player.id,
          previousSeed: membership.stageSeed,
          manualSeed: player.seed,
          membership,
        };
      }),
      entryPolicy,
    );
    if (!seedingResult.ok) {
      throw new StageLifecycleError("STAGE_SEEDING_CONFIGURATION_INVALID");
    }
    const ceremonyEnabled = stageUsesRandomCeremony(stage);
    const preparedCeremony = parseSeedingCeremonyState(stage.seedingAudit);
    let nextMemberships: Array<typeof stageParticipantsTable.$inferSelect>;
    let appliedCeremony: ReturnType<typeof markCeremonyApplied> | null = null;
    if (ceremonyEnabled && preparedCeremony) {
      if (!isCeremonyCurrent({ ceremony: preparedCeremony, stage, memberships, players })) {
        throw new StageLifecycleError("SEEDING_CEREMONY_STALE");
      }
      if (stage.randomRevealOrder === "sequential" &&
          preparedCeremony.status !== "completed" && preparedCeremony.status !== "applied") {
        throw new StageLifecycleError("SEEDING_CEREMONY_INCOMPLETE");
      }
      const seedByPlayerId = new Map(preparedCeremony.draws.map((draw) => [draw.playerId, draw.seed]));
      if (seedByPlayerId.size !== memberships.length) {
        throw new StageLifecycleError("SEEDING_CEREMONY_STALE");
      }
      nextMemberships = memberships.map((membership) => {
        const seed = seedByPlayerId.get(membership.playerId);
        if (seed == null) throw new StageLifecycleError("SEEDING_CEREMONY_STALE");
        return { ...membership, stageSeed: seed };
      });
      appliedCeremony = markCeremonyApplied(preparedCeremony);
    } else {
      if (ceremonyEnabled && stage.randomRevealOrder === "sequential") {
        throw new StageLifecycleError("SEEDING_CEREMONY_REQUIRED");
      }
      nextMemberships = seedingResult.seeded.map(({ entry, seed }) => ({
        ...entry.membership,
        stageSeed: seed,
      }));
      if (ceremonyEnabled) {
        appliedCeremony = markCeremonyApplied(buildSeedingCeremonyState({
          stage,
          memberships,
          players,
        }));
      }
    }
    for (const membership of nextMemberships) {
      await tx.update(stageParticipantsTable)
        .set({ stageSeed: membership.stageSeed })
        .where(eq(stageParticipantsTable.id, membership.id));
    }
    memberships = nextMemberships.sort((left, right) => left.stageSeed - right.stageSeed);
    const seedingAudit = appliedCeremony ?? {
      ...seedingResult.audit,
      entrySeedingPolicy: stage.entrySeedingPolicy,
      placementPolicy: stage.seedingPolicy,
      resultSeedingPolicy: stage.resultSeedingPolicy,
      revealOrder: stage.randomRevealOrder,
      placementRandomSeed: ["random_groups", "random_bracket"].includes(stage.seedingPolicy)
        ? `${stage.randomSeed ?? ""}:placement`
        : null,
      appliedAt: new Date().toISOString(),
    };
    const ceremonyDrawByPlayerId = appliedCeremony == null
      ? null
      : new Map(appliedCeremony.draws.map((draw) => [draw.playerId, draw]));
    if (ceremonyDrawByPlayerId) {
      if (ceremonyDrawByPlayerId.size !== memberships.length || memberships.some((membership) => {
        const draw = ceremonyDrawByPlayerId.get(membership.playerId);
        return !draw || draw.seed !== membership.stageSeed;
      })) {
        throw new StageLifecycleError("SEEDING_CEREMONY_STALE");
      }
    }

    const stagePlayers = memberships.map((membership) => ({
      ...playerById.get(membership.playerId)!,
      seed: membership.stageSeed,
      status: "active" as const,
    }));
    let inserted: Array<typeof matchesTable.$inferSelect>;
    let totalRounds: number;
    if (stage.format === "group_stage") {
      const groupCount = stage.groupCount;
      const largestGroupSize = stage.participantsPerGroup;
      const qualifiersPerGroup = stage.qualifiersPerGroup;
      let groupSizes: number[];
      let qualifierCounts: number[];
      try {
        if (
          groupCount == null ||
          largestGroupSize == null ||
          qualifiersPerGroup == null ||
          stage.qualificationMode !== "top_n_per_group" ||
          !["snake_groups", "random_groups"].includes(stage.seedingPolicy)
        ) {
          throw new Error("invalid group stage settings");
        }
        groupSizes = calculateBalancedGroupSizes(memberships.length, groupCount);
        if (Math.max(...groupSizes) !== largestGroupSize) {
          throw new Error("derived group size mismatch");
        }
        qualifierCounts = calculateGroupQualifierCounts(
          groupSizes,
          qualifiersPerGroup,
        );
      } catch {
        throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
      }

      const groups = (await tx.insert(stageGroupsTable).values(
        groupSizes.map((participantCount, index) => ({
          stageId: stage.id,
          groupKey: groupKeyFromIndex(index),
          position: index + 1,
          participantCount,
          qualifiersCount: qualifierCounts[index],
        })),
      ).returning()).sort((left, right) => left.position - right.position);
      const placementParticipants = memberships.map((membership) => ({
        participantKey: String(membership.playerId),
        seed: membership.stageSeed,
        membership,
      }));
      const placements = stage.seedingPolicy === "random_groups"
        ? buildRandomGroupPlacements(placementParticipants, groupSizes, `${stage.randomSeed ?? ""}:placement`)
        : buildSnakeGroupPlacements(placementParticipants, groupSizes);
      if (ceremonyDrawByPlayerId && placements.some((placement) => {
        const draw = ceremonyDrawByPlayerId.get(Number(placement.participant.participantKey));
        return !draw || draw.placement.kind !== "group" ||
          draw.placement.groupIndex !== placement.groupIndex ||
          draw.placement.groupKey !== groupKeyFromIndex(placement.groupIndex) ||
          draw.placement.groupPosition !== placement.groupPosition;
      })) {
        throw new StageLifecycleError("SEEDING_CEREMONY_STALE");
      }
      const placementByPlayerId = new Map(
        placements.map((placement) => [Number(placement.participant.participantKey), placement]),
      );
      const membershipsByGroup = new Map<number, Array<typeof stageParticipantsTable.$inferSelect>>();
      for (const membership of memberships) {
        const placement = placementByPlayerId.get(membership.playerId);
        if (!placement) throw new StageLifecycleError("STAGE_SEEDING_CONFIGURATION_INVALID");
        const group = groups[placement.groupIndex];
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
      if (ceremonyDrawByPlayerId) {
        if (stage.format === "single_elimination") {
          const firstRoundByMatchNumber = new Map(
            generated.values
              .filter((match) => match.round === 1)
              .map((match) => [match.matchNumber, match]),
          );
          if (memberships.some((membership) => {
            const draw = ceremonyDrawByPlayerId.get(membership.playerId);
            if (!draw || draw.placement.kind !== "bracket") return true;
            const match = firstRoundByMatchNumber.get(draw.placement.matchNumber);
            if (!match) return true;
            const playerId = draw.placement.side === "player1" ? match.player1Id : match.player2Id;
            const expectedSlot = ((draw.placement.matchNumber - 1) * 2) +
              (draw.placement.side === "player1" ? 1 : 2);
            const isBye = match.resultType === "bye" && match.winnerId === membership.playerId;
            return playerId !== membership.playerId ||
              draw.placement.bracketSlot !== expectedSlot ||
              draw.placement.bye !== isBye;
          })) {
            throw new StageLifecycleError("SEEDING_CEREMONY_STALE");
          }
        } else if (memberships.some((membership) => {
          const draw = ceremonyDrawByPlayerId.get(membership.playerId);
          return !draw || draw.placement.kind !== "standings" ||
            draw.placement.position !== membership.stageSeed;
        })) {
          throw new StageLifecycleError("SEEDING_CEREMONY_STALE");
        }
      }
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
      startedAt: now, completedAt: null, winnerId: null,
      seedingAudit,
      version: stage.version + 1,
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
      description: `Uruchomiono etap ${stage.name}; seedowanie=${stage.entrySeedingPolicy}; rozmieszczenie=${stage.seedingPolicy}`,
      matchId: null, undoPayload: null, isUndone: false,
    });
    return updatedStage;
  });
}
export { getStageStartReadiness, assertStageStartReady, evaluateStageStartReadiness, type StageStartReadiness, type StageStartValidationSnapshot } from "./stage-start-readiness";
