import { asc, desc, eq, inArray } from "drizzle-orm";
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
import type { TournamentBackupV3 } from "@workspace/api-zod";
import type { BackupRestoreCredentials } from "./backup-credentials";
import { validatePlayedSeriesResult } from "../../domain/match/series-result";
import {
  calculateBalancedGroupSizes,
  calculateGroupAdvancingCount,
  calculateGroupQualifierCounts,
} from "../../domain/tournament/group-stage";
import { validateTournamentStagePlan } from "../../domain/tournament/tournament-stage-plan";

export class BackupV3ValidationError extends Error {
  constructor(public readonly details: string[]) {
    super("Backup v3 did not pass semantic validation.");
    this.name = "BackupV3ValidationError";
  }
}

const positive = (value: number): boolean =>
  Number.isInteger(value) && value > 0;
const date = (value: string): boolean => !Number.isNaN(Date.parse(value));
const UNDOABLE_ACTIONS = new Set([
  "match_started",
  "match_postponed",
  "match_restored",
  "match_bo_changed",
  "match_featured",
  "match_unfeatured",
  "match_result_submitted",
  "player_added",
  "player_edited",
  "match_cancelled",
  "match_players_swapped",
]);

function parseUndoPayload(
  value: string | null,
): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed != null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function remapUndoPayload(
  payload: Record<string, unknown> | null,
  playerIds: Map<number, number>,
  matchIds: Map<number, number>,
): Record<string, unknown> | null {
  if (!payload) return null;
  const playerKeys = new Set([
    "playerId",
    "player1Id",
    "player2Id",
    "winnerId",
  ]);
  const matchKeys = new Set(["matchId", "prevFeaturedMatchId"]);
  const remap = (value: unknown, key?: string): unknown => {
    if (typeof value === "number" && key && playerKeys.has(key))
      return playerIds.get(value) ?? value;
    if (typeof value === "number" && key && matchKeys.has(key))
      return matchIds.get(value) ?? value;
    if (Array.isArray(value)) return value.map((item) => remap(item));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(
          ([childKey, child]) => [childKey, remap(child, childKey)],
        ),
      );
    }
    return value;
  };
  return remap(payload) as Record<string, unknown>;
}

export async function exportBackupV3(
  tournamentId: number,
): Promise<TournamentBackupV3 | null> {
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  if (!tournament) return null;
  const [players, stages, groups, memberships, matches, history, actions] =
    await Promise.all([
      db
        .select()
        .from(playersTable)
        .where(eq(playersTable.tournamentId, tournamentId))
        .orderBy(asc(playersTable.id)),
      db
        .select()
        .from(tournamentStagesTable)
        .where(eq(tournamentStagesTable.tournamentId, tournamentId))
        .orderBy(asc(tournamentStagesTable.position)),
      db
        .select()
        .from(stageGroupsTable)
        .where(
          inArray(
            stageGroupsTable.stageId,
            db
              .select({ id: tournamentStagesTable.id })
              .from(tournamentStagesTable)
              .where(eq(tournamentStagesTable.tournamentId, tournamentId)),
          ),
        )
        .orderBy(asc(stageGroupsTable.stageId), asc(stageGroupsTable.position)),
      db
        .select()
        .from(stageParticipantsTable)
        .where(eq(stageParticipantsTable.tournamentId, tournamentId))
        .orderBy(
          asc(stageParticipantsTable.stageId),
          asc(stageParticipantsTable.stageSeed),
        ),
      db
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.tournamentId, tournamentId))
        .orderBy(
          asc(matchesTable.stageId),
          asc(matchesTable.round),
          asc(matchesTable.matchNumber),
        ),
      db
        .select()
        .from(resultHistoryTable)
        .where(eq(resultHistoryTable.tournamentId, tournamentId))
        .orderBy(
          asc(resultHistoryTable.matchId),
          asc(resultHistoryTable.revision),
        ),
      db
        .select()
        .from(actionLogTable)
        .where(eq(actionLogTable.tournamentId, tournamentId))
        .orderBy(desc(actionLogTable.createdAt)),
    ]);
  return {
    schemaVersion: 3,
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    exportedAt: new Date().toISOString(),
    tournament: {
      name: tournament.name,
      description: tournament.description ?? null,
      status: tournament.status,
      maxPlayers: tournament.maxPlayers ?? null,
      activeStageBackupId: tournament.activeStageId ?? null,
      winnerBackupId: tournament.winnerId ?? null,
      featuredMatchBackupId: tournament.featuredMatchId ?? null,
      visibility:
        tournament.visibility as TournamentBackupV3["tournament"]["visibility"],
    },
    players: players.map((player) => ({
      backupId: player.id,
      name: player.name,
      rank: player.rank ?? null,
      country: player.country ?? null,
      teamName: player.teamName ?? null,
      seed: player.seed ?? null,
      status: player.status,
    })),
    stages: stages.map((stage) => ({
      backupId: stage.id,
      stageKey: stage.stageKey,
      position: stage.position,
      name: stage.name,
      format: stage.format,
      status: stage.status,
      participantCount: stage.participantCount,
      bestOf: stage.bestOf,
      plannedRounds: stage.plannedRounds ?? null,
      currentRound: stage.currentRound ?? null,
      totalRounds: stage.totalRounds ?? null,
      rankingPolicy: stage.rankingPolicy,
      qualificationMode: stage.qualificationMode,
      advancingCount: stage.advancingCount ?? null,
      groupCount: stage.groupCount ?? null,
      participantsPerGroup: stage.participantsPerGroup ?? null,
      qualifiersPerGroup: stage.qualifiersPerGroup ?? null,
      seedingPolicy: stage.seedingPolicy,
      entrySeedingPolicy: stage.entrySeedingPolicy ?? "preserve",
      resultSeedingPolicy: stage.resultSeedingPolicy ?? (stage.format === "group_stage" ? "rank_bands" : "standings_order"),
      randomSeed: stage.randomSeed ?? null,
      randomRevealOrder: stage.randomRevealOrder ?? "instant",
      seedingAudit: (stage.seedingAudit as Record<string, unknown> | null) ?? null,
      winnerBackupId: stage.winnerId ?? null,
      version: stage.version,
      createdAt: stage.createdAt.toISOString(),
      startedAt: stage.startedAt?.toISOString() ?? null,
      completedAt: stage.completedAt?.toISOString() ?? null,
    })),
    groups: groups.map((group) => ({
      backupId: group.id,
      stageBackupId: group.stageId,
      groupKey: group.groupKey,
      position: group.position,
      participantCount: group.participantCount,
      qualifiersCount: group.qualifiersCount,
      createdAt: group.createdAt.toISOString(),
    })),
    stageParticipants: memberships.map((membership) => ({
      backupId: membership.id,
      stageBackupId: membership.stageId,
      playerBackupId: membership.playerId,
      stageSeed: membership.stageSeed,
      groupBackupId: membership.groupId ?? null,
      status: membership.status,
      qualificationSource: membership.qualificationSource,
      finalRank: membership.finalRank ?? null,
      groupRank: membership.groupRank ?? null,
      qualificationRank: membership.qualificationRank ?? null,
      nextStageSeed: membership.nextStageSeed ?? null,
      sourceStageParticipantBackupId:
        membership.sourceStageParticipantId ?? null,
      qualifiedAt: membership.qualifiedAt?.toISOString() ?? null,
      createdAt: membership.createdAt.toISOString(),
    })),
    matches: matches.map((match) => ({
      backupId: match.id,
      stageBackupId: match.stageId,
      stageGroupBackupId: match.stageGroupId ?? null,
      round: match.round,
      matchNumber: match.matchNumber,
      player1BackupId: match.player1Id ?? null,
      player2BackupId: match.player2Id ?? null,
      winnerBackupId: match.winnerId ?? null,
      score1: match.score1 ?? null,
      score2: match.score2 ?? null,
      resultType: match.resultType ?? null,
      resultReason: match.resultReason ?? null,
      bestOf: match.bestOf,
      status: match.status,
      note: match.note ?? null,
      nextMatchBackupId: match.nextMatchId ?? null,
      sortOrder: match.sortOrder ?? null,
      scheduledAt: match.scheduledAt?.toISOString() ?? null,
      completedAt: match.completedAt?.toISOString() ?? null,
    })),
    resultHistory: history.map((entry) => ({
      matchBackupId: entry.matchId,
      stageBackupId: entry.stageId,
      revision: entry.revision,
      round: entry.round,
      matchNumber: entry.matchNumber,
      player1BackupId: entry.player1Id ?? null,
      player2BackupId: entry.player2Id ?? null,
      winnerBackupId: entry.winnerId ?? null,
      score1: entry.score1 ?? null,
      score2: entry.score2 ?? null,
      bestOf: entry.bestOf,
      resultType: entry.resultType,
      resultReason: entry.resultReason ?? null,
      completedAt: entry.completedAt.toISOString(),
      recordedAt: entry.recordedAt.toISOString(),
    })),
    actionLog: actions.map((action) => ({
      actionType: action.actionType,
      description: action.description,
      stageBackupId: action.stageId ?? null,
      matchBackupId: action.matchId ?? null,
      canUndo:
        UNDOABLE_ACTIONS.has(action.actionType) &&
        !action.isUndone &&
        action.undoPayload != null,
      undoPayload: parseUndoPayload(action.undoPayload),
      isUndone: action.isUndone,
      createdAt: action.createdAt.toISOString(),
    })),
  };
}

export function validateBackupV3(backup: TournamentBackupV3): void {
  const errors: string[] = [];
  if (backup.schemaVersion !== 3) errors.push("schemaVersion must equal 3.");
  if (
    backup.resultModelVersion !== "series_v1" ||
    backup.rankingPolicy !== "match_record_v1"
  ) {
    errors.push("Backup must use series_v1/match_record_v1.");
  }
  if (!date(backup.exportedAt) || !backup.tournament.name.trim())
    errors.push("Backup metadata is invalid.");
  const unique = <T extends { backupId: number }>(
    items: T[],
    label: string,
  ): Set<number> => {
    const ids = new Set<number>();
    for (const item of items) {
      if (!positive(item.backupId) || ids.has(item.backupId))
        errors.push(
          `${label} has invalid or duplicate backupId ${item.backupId}.`,
        );
      ids.add(item.backupId);
    }
    return ids;
  };
  const playerIds = unique(backup.players, "Player");
  const stageIds = unique(backup.stages, "Stage");
  const groupIds = unique(backup.groups, "Group");
  const membershipIds = unique(backup.stageParticipants, "Stage participant");
  const matchIds = unique(backup.matches, "Match");
  const stageById = new Map(
    backup.stages.map((stage) => [stage.backupId, stage]),
  );
  const groupById = new Map(
    backup.groups.map((group) => [group.backupId, group]),
  );
  const membershipById = new Map(
    backup.stageParticipants.map((item) => [item.backupId, item]),
  );
  const membershipsByStagePlayer = new Map(
    backup.stageParticipants.map((item) => [
      `${item.stageBackupId}:${item.playerBackupId}`,
      item,
    ]),
  );
  const matchById = new Map(
    backup.matches.map((match) => [match.backupId, match]),
  );

  const orderedStages = [...backup.stages].sort(
    (left, right) => left.position - right.position,
  );
  if (
    orderedStages.length < 1 ||
    orderedStages.length > 3 ||
    orderedStages.some((stage, index) => stage.position !== index + 1)
  ) {
    errors.push("Stages must contain 1-3 contiguous positions.");
  }
  const isEmptyLegacyCompatibleDraft =
    backup.tournament.status === "draft" &&
    orderedStages.length === 1 &&
    (orderedStages[0]?.participantCount ?? 0) < 2;
  if (!isEmptyLegacyCompatibleDraft) {
    const planValidation = validateTournamentStagePlan({
      initialParticipantCount: orderedStages[0]?.participantCount,
      stages: orderedStages.map((stage) => ({
        key: stage.stageKey,
        position: stage.position,
        name: stage.name,
        format: stage.format,
        participantCount: stage.participantCount,
        bestOf: stage.bestOf,
        ...(stage.format === "swiss" ? { rounds: stage.plannedRounds } : {}),
        ...((stage.format === "swiss" || stage.format === "round_robin") &&
        stage.advancingCount != null
          ? { advancingCount: stage.advancingCount }
          : {}),
        ...(stage.format === "group_stage"
          ? {
              groupCount: stage.groupCount,
              participantsPerGroup: stage.participantsPerGroup,
              qualifiersPerGroup: stage.qualifiersPerGroup,
              seedingMethod:
                stage.seedingPolicy === "random_groups" ? "random" : "snake",
              placementMethod:
                stage.seedingPolicy === "random_groups" ? "random" : "snake",
              resultSeedingMethod:
                (stage.resultSeedingPolicy ?? "rank_bands") === "global_ranking"
                  ? "global_ranking"
                  : "rank_bands",
            }
          : {}),
        ...(stage.format === "single_elimination"
          ? {
              placementMethod:
                stage.seedingPolicy === "random_bracket"
                  ? "random"
                  : "standard",
            }
          : {}),
        entrySeedingMethod: stage.entrySeedingPolicy ?? "preserve",
        randomSeed: stage.randomSeed ?? undefined,
        randomRevealOrder: stage.randomRevealOrder ?? "instant",
      })),
    });
    if (!planValidation.valid)
      errors.push(
        ...planValidation.problems.map(
          (problem) => `Stage plan: ${problem.code}.`,
        ),
      );
  }
  for (const stage of backup.stages) {
    if (
      !positive(stage.version) ||
      !date(stage.createdAt) ||
      (stage.startedAt != null && !date(stage.startedAt)) ||
      (stage.completedAt != null && !date(stage.completedAt))
    ) {
      errors.push(`Stage ${stage.backupId} has invalid version or dates.`);
    }
    if (
      (stage.status === "planned" &&
        (stage.startedAt != null || stage.completedAt != null)) ||
      (stage.status === "active" && stage.completedAt != null) ||
      (stage.status === "completed" && stage.completedAt == null)
    ) {
      errors.push(
        `Stage ${stage.backupId} has inconsistent lifecycle timestamps.`,
      );
    }
    if (stage.winnerBackupId != null && !playerIds.has(stage.winnerBackupId))
      errors.push(`Stage ${stage.backupId} has a missing winner.`);
  }
  const activeStages = backup.stages.filter(
    (stage) => stage.status === "active",
  );
  if (
    backup.tournament.status === "draft" &&
    (activeStages.length !== 0 || backup.tournament.activeStageBackupId != null)
  )
    errors.push("Draft tournament cannot have an active stage.");
  if (
    backup.tournament.status === "active" &&
    (activeStages.length !== 1 ||
      backup.tournament.activeStageBackupId !== activeStages[0]?.backupId)
  )
    errors.push("Active tournament must identify exactly one active stage.");
  if (
    backup.tournament.status === "completed" &&
    (activeStages.length !== 0 ||
      backup.tournament.activeStageBackupId != null ||
      backup.stages.some((stage) => stage.status !== "completed"))
  )
    errors.push(
      "Completed tournament must have only completed stages and no active pointer.",
    );
  if (
    backup.tournament.status === "draft" &&
    backup.stages.some((stage) => stage.status !== "planned")
  )
    errors.push("Draft tournament must contain only planned stages.");
  if (backup.tournament.status === "active") {
    const activePosition = activeStages[0]?.position ?? 0;
    if (
      orderedStages.some(
        (stage) =>
          (stage.position < activePosition && stage.status !== "completed") ||
          (stage.position > activePosition && stage.status !== "planned"),
      )
    ) {
      errors.push(
        "Active tournament stages do not form completed-active-planned order.",
      );
    }
  }
  if (
    backup.tournament.activeStageBackupId != null &&
    !stageIds.has(backup.tournament.activeStageBackupId)
  )
    errors.push("Active stage reference is invalid.");
  if (
    backup.tournament.winnerBackupId != null &&
    !playerIds.has(backup.tournament.winnerBackupId)
  )
    errors.push("Tournament winner reference is invalid.");
  if (
    backup.tournament.featuredMatchBackupId != null &&
    !matchIds.has(backup.tournament.featuredMatchBackupId)
  )
    errors.push("Featured match reference is invalid.");

  for (const player of backup.players) {
    if (!player.name.trim() || (player.seed != null && !positive(player.seed)))
      errors.push(`Player ${player.backupId} is invalid.`);
  }
  const groupKeys = new Set<string>();
  const groupPositions = new Set<string>();
  for (const group of backup.groups) {
    const stage = stageById.get(group.stageBackupId);
    if (!stage || stage.format !== "group_stage") {
      errors.push(`Group ${group.backupId} does not belong to a group stage.`);
    } else {
      try {
        const sizes = calculateBalancedGroupSizes(
          stage.participantCount,
          stage.groupCount ?? 0,
        );
        const qualifierCounts = calculateGroupQualifierCounts(
          sizes,
          stage.qualifiersPerGroup ?? 0,
        );
        const expectedIndex = group.position - 1;
        if (
          expectedIndex < 0 ||
          expectedIndex >= sizes.length ||
          group.participantCount !== sizes[expectedIndex] ||
          group.qualifiersCount !== qualifierCounts[expectedIndex]
        ) {
          errors.push(
            `Group ${group.backupId} configuration differs from its stage.`,
          );
        }
      } catch {
        errors.push(`Group ${group.backupId} has invalid stage configuration.`);
      }
    }
    const key = `${group.stageBackupId}:${group.groupKey}`;
    const position = `${group.stageBackupId}:${group.position}`;
    if (
      groupKeys.has(key) ||
      groupPositions.has(position) ||
      !date(group.createdAt)
    )
      errors.push(
        `Group ${group.backupId} is duplicate or has an invalid date.`,
      );
    groupKeys.add(key);
    groupPositions.add(position);
  }
  for (const stage of backup.stages.filter(
    (candidate) => candidate.format === "group_stage",
  )) {
    const count = backup.groups.filter(
      (group) => group.stageBackupId === stage.backupId,
    ).length;
    if (
      (stage.status === "planned" && count !== 0) ||
      (stage.status !== "planned" && count !== stage.groupCount)
    ) {
      errors.push(`Group stage ${stage.backupId} has an invalid group count.`);
    }
  }

  const stagePlayerKeys = new Set<string>();
  const stageSeedKeys = new Set<string>();
  for (const participant of backup.stageParticipants) {
    const stage = stageById.get(participant.stageBackupId);
    if (
      !stage ||
      !playerIds.has(participant.playerBackupId) ||
      !positive(participant.stageSeed) ||
      !date(participant.createdAt)
    )
      errors.push(
        `Stage participant ${participant.backupId} has invalid core references.`,
      );
    const playerKey = `${participant.stageBackupId}:${participant.playerBackupId}`;
    const seedKey = `${participant.stageBackupId}:${participant.stageSeed}`;
    if (stagePlayerKeys.has(playerKey) || stageSeedKeys.has(seedKey))
      errors.push(
        `Stage participant ${participant.backupId} duplicates a player or seed.`,
      );
    stagePlayerKeys.add(playerKey);
    stageSeedKeys.add(seedKey);
    const group =
      participant.groupBackupId == null
        ? null
        : groupById.get(participant.groupBackupId);
    if (
      participant.groupBackupId != null &&
      (!group || group.stageBackupId !== participant.stageBackupId)
    )
      errors.push(
        `Stage participant ${participant.backupId} has an invalid group.`,
      );
    if (stage?.format === "group_stage" && stage.status !== "planned" && !group)
      errors.push(
        `Started group participant ${participant.backupId} has no group.`,
      );
    if (stage?.format !== "group_stage" && group)
      errors.push(`Non-group participant ${participant.backupId} has a group.`);
    const source =
      participant.sourceStageParticipantBackupId == null
        ? null
        : membershipById.get(participant.sourceStageParticipantBackupId);
    if (
      stage?.position === 1 &&
      (source || participant.qualificationSource !== "registration")
    )
      errors.push(
        `First-stage participant ${participant.backupId} has an invalid source.`,
      );
    const sourceStage = source ? stageById.get(source.stageBackupId) : null;
    if (
      stage &&
      stage.position > 1 &&
      (!source ||
        source.playerBackupId !== participant.playerBackupId ||
        sourceStage?.position !== stage.position - 1 ||
        source.status !== "qualified" ||
        ((stage.entrySeedingPolicy ?? "preserve") === "preserve" && source.nextStageSeed !== participant.stageSeed) ||
        participant.qualificationSource === "registration" ||
        (sourceStage?.format === "group_stage" &&
          participant.qualificationSource !== "group_position") ||
        (sourceStage?.format !== "group_stage" &&
          participant.qualificationSource !== "standings"))
    )
      errors.push(
        `Later-stage participant ${participant.backupId} has an invalid source.`,
      );
    if (participant.qualifiedAt != null && !date(participant.qualifiedAt))
      errors.push(
        `Stage participant ${participant.backupId} has an invalid qualifiedAt.`,
      );
  }
  for (const stage of backup.stages) {
    const members = backup.stageParticipants.filter(
      (item) => item.stageBackupId === stage.backupId,
    );
    const registrationOpen =
      stage.position === 1 &&
      stage.status === "planned" &&
      members.length <= stage.participantCount;
    const mayAwaitQualification =
      stage.position > 1 && stage.status === "planned" && members.length === 0;
    if (
      !registrationOpen &&
      !mayAwaitQualification &&
      members.length !== stage.participantCount
    )
      errors.push(`Stage ${stage.backupId} participant count does not match.`);
    const seeds = members
      .map((member) => member.stageSeed)
      .sort((left, right) => left - right);
    if (seeds.some((seed, index) => seed !== index + 1))
      errors.push(`Stage ${stage.backupId} seeds are not contiguous.`);
  }
  const firstStageId = orderedStages[0]?.backupId;
  if (
    backup.players.some(
      (player) =>
        !membershipsByStagePlayer.has(`${firstStageId}:${player.backupId}`),
    )
  )
    errors.push("Every player must belong to stage 1.");
  for (const group of backup.groups) {
    if (
      backup.stageParticipants.filter(
        (item) => item.groupBackupId === group.backupId,
      ).length !== group.participantCount
    )
      errors.push(`Group ${group.backupId} participant count does not match.`);
  }

  const roundKeys = new Set<string>();
  const validatePlayerRef = (
    value: number | null | undefined,
    label: string,
  ): void => {
    if (value != null && !playerIds.has(value))
      errors.push(`${label} references a missing player.`);
  };
  for (const match of backup.matches) {
    const stage = stageById.get(match.stageBackupId);
    const group =
      match.stageGroupBackupId == null
        ? null
        : groupById.get(match.stageGroupBackupId);
    if (
      !stage ||
      !positive(match.round) ||
      !positive(match.matchNumber) ||
      !positive(match.bestOf) ||
      match.bestOf % 2 === 0
    )
      errors.push(
        `Match ${match.backupId} has invalid stage, round or bestOf.`,
      );
    const roundKey = `${match.stageBackupId}:${match.round}:${match.matchNumber}`;
    if (roundKeys.has(roundKey))
      errors.push(`Match ${match.backupId} duplicates a stage round number.`);
    roundKeys.add(roundKey);
    if (
      (stage?.format === "group_stage" &&
        (!group || group.stageBackupId !== match.stageBackupId)) ||
      (stage?.format !== "group_stage" && group)
    )
      errors.push(`Match ${match.backupId} has an invalid group relation.`);
    for (const [value, label] of [
      [match.player1BackupId, "player1"],
      [match.player2BackupId, "player2"],
      [match.winnerBackupId, "winner"],
    ] as const) {
      validatePlayerRef(value, `Match ${match.backupId} ${label}`);
      if (
        value != null &&
        !membershipsByStagePlayer.has(`${match.stageBackupId}:${value}`)
      )
        errors.push(
          `Match ${match.backupId} ${label} is not a stage participant.`,
        );
      const membership =
        value == null
          ? null
          : membershipsByStagePlayer.get(`${match.stageBackupId}:${value}`);
      if (
        membership &&
        stage?.format === "group_stage" &&
        membership.groupBackupId !== match.stageGroupBackupId
      )
        errors.push(
          `Match ${match.backupId} ${label} belongs to another group.`,
        );
    }
    if (
      match.player1BackupId != null &&
      match.player1BackupId === match.player2BackupId
    )
      errors.push(`Match ${match.backupId} repeats a player.`);
    if (
      (match.scheduledAt != null && !date(match.scheduledAt)) ||
      (match.completedAt != null && !date(match.completedAt))
    )
      errors.push(`Match ${match.backupId} has invalid dates.`);
    const completed = match.status === "completed";
    if (completed !== (match.resultType != null && match.completedAt != null))
      errors.push(`Match ${match.backupId} has inconsistent lifecycle fields.`);
    if (
      !completed &&
      (match.winnerBackupId != null ||
        match.score1 != null ||
        match.score2 != null ||
        match.resultReason != null)
    )
      errors.push(
        `Pending match ${match.backupId} contains final result data.`,
      );
    if (
      match.resultType === "played" &&
      match.player1BackupId != null &&
      match.player2BackupId != null &&
      match.score1 != null &&
      match.score2 != null
    ) {
      const result = validatePlayedSeriesResult({
        resultType: "played",
        bestOf: match.bestOf,
        score1: match.score1,
        score2: match.score2,
      });
      const winner = result.ok
        ? result.value.winnerSide === "player1"
          ? match.player1BackupId
          : match.player2BackupId
        : null;
      if (
        !result.ok ||
        match.winnerBackupId !== winner ||
        match.resultReason != null
      )
        errors.push(`Played match ${match.backupId} is invalid.`);
    } else if (match.resultType === "played")
      errors.push(`Played match ${match.backupId} is incomplete.`);
    if (
      match.resultType === "walkover" &&
      (match.player1BackupId == null ||
        match.player2BackupId == null ||
        ![match.player1BackupId, match.player2BackupId].includes(
          match.winnerBackupId ?? -1,
        ) ||
        match.score1 != null ||
        match.score2 != null)
    )
      errors.push(`Walkover match ${match.backupId} is invalid.`);
    if (
      match.resultType === "bye" &&
      (match.player1BackupId == null ||
        match.player2BackupId != null ||
        match.winnerBackupId !== match.player1BackupId ||
        match.resultReason !== "system_bye" ||
        match.score1 != null ||
        match.score2 != null)
    )
      errors.push(`Bye match ${match.backupId} is invalid.`);
    if (
      match.resultType === "no_contest" &&
      (stage?.format === "single_elimination" ||
        match.player1BackupId == null ||
        match.player2BackupId == null ||
        match.winnerBackupId != null ||
        match.score1 != null ||
        match.score2 != null)
    )
      errors.push(`No-contest match ${match.backupId} is invalid.`);
  }
  for (const match of backup.matches) {
    const next =
      match.nextMatchBackupId == null
        ? null
        : matchById.get(match.nextMatchBackupId);
    if (
      match.nextMatchBackupId != null &&
      (!next || next.stageBackupId !== match.stageBackupId)
    )
      errors.push(`Match ${match.backupId} has an invalid next match.`);
  }
  const historyKeys = new Set<string>();
  for (const history of backup.resultHistory) {
    const match = matchById.get(history.matchBackupId);
    const key = `${history.matchBackupId}:${history.revision}`;
    if (
      !match ||
      match.stageBackupId !== history.stageBackupId ||
      !stageIds.has(history.stageBackupId) ||
      !positive(history.revision) ||
      historyKeys.has(key) ||
      !date(history.completedAt) ||
      !date(history.recordedAt)
    )
      errors.push(`Result history ${key} has invalid relations or dates.`);
    for (const [value, label] of [
      [history.player1BackupId, "player1"],
      [history.player2BackupId, "player2"],
      [history.winnerBackupId, "winner"],
    ] as const) {
      validatePlayerRef(value, `History ${key} ${label}`);
      if (
        value != null &&
        !membershipsByStagePlayer.has(`${history.stageBackupId}:${value}`)
      )
        errors.push(`History ${key} ${label} is not a stage participant.`);
    }
    if (!positive(history.bestOf) || history.bestOf % 2 === 0)
      errors.push(`History ${key} has an invalid bestOf.`);
    if (
      history.resultType === "played" &&
      history.player1BackupId != null &&
      history.player2BackupId != null &&
      history.score1 != null &&
      history.score2 != null
    ) {
      const result = validatePlayedSeriesResult({
        resultType: "played",
        bestOf: history.bestOf,
        score1: history.score1,
        score2: history.score2,
      });
      const winner = result.ok
        ? result.value.winnerSide === "player1"
          ? history.player1BackupId
          : history.player2BackupId
        : null;
      if (
        !result.ok ||
        history.winnerBackupId !== winner ||
        history.resultReason != null
      )
        errors.push(`Played history ${key} is invalid.`);
    } else if (history.resultType === "played")
      errors.push(`Played history ${key} is incomplete.`);
    if (
      history.resultType === "walkover" &&
      (history.player1BackupId == null ||
        history.player2BackupId == null ||
        ![history.player1BackupId, history.player2BackupId].includes(
          history.winnerBackupId ?? -1,
        ) ||
        history.score1 != null ||
        history.score2 != null)
    )
      errors.push(`Walkover history ${key} is invalid.`);
    if (
      history.resultType === "bye" &&
      (history.player1BackupId == null ||
        history.player2BackupId != null ||
        history.winnerBackupId !== history.player1BackupId ||
        history.resultReason !== "system_bye" ||
        history.score1 != null ||
        history.score2 != null)
    )
      errors.push(`Bye history ${key} is invalid.`);
    if (
      history.resultType === "no_contest" &&
      (stageById.get(history.stageBackupId)?.format === "single_elimination" ||
        history.player1BackupId == null ||
        history.player2BackupId == null ||
        history.winnerBackupId != null ||
        history.score1 != null ||
        history.score2 != null)
    )
      errors.push(`No-contest history ${key} is invalid.`);
    historyKeys.add(key);
  }
  for (const action of backup.actionLog) {
    const match =
      action.matchBackupId == null ? null : matchById.get(action.matchBackupId);
    if (
      !date(action.createdAt) ||
      (action.stageBackupId != null && !stageIds.has(action.stageBackupId)) ||
      (match && action.stageBackupId !== match.stageBackupId) ||
      (action.matchBackupId != null && !match)
    )
      errors.push("Action log has invalid stage or match relations.");
  }
  if (errors.length > 0)
    throw new BackupV3ValidationError([...new Set(errors)]);
}

function compatibilityFormat(
  format: TournamentBackupV3["stages"][number]["format"],
) {
  return format === "group_stage" ? ("round_robin" as const) : format;
}

function compatibleSeedingPolicy(
  stage: TournamentBackupV3["stages"][number],
):
  | "standings_order"
  | "snake_groups"
  | "random_groups"
  | "standard_bracket"
  | "random_bracket" {
  if (stage.format === "group_stage") {
    return stage.seedingPolicy === "random_groups" ? "random_groups" : "snake_groups";
  }
  if (stage.format === "single_elimination") {
    return stage.seedingPolicy === "random_bracket" ? "random_bracket" : "standard_bracket";
  }
  return "standings_order";
}

export async function importBackupV3(
  backup: TournamentBackupV3,
  credentials: BackupRestoreCredentials,
) {
  validateBackupV3(backup);
  return db.transaction(async (tx) => {
    const orderedStages = [...backup.stages].sort(
      (left, right) => left.position - right.position,
    );
    const first = orderedStages[0];
    const [tournament] = await tx
      .insert(tournamentsTable)
      .values({
        name: `${backup.tournament.name} (kopia)`,
        description: backup.tournament.description ?? null,
        resultModelVersion: "series_v1",
        rankingPolicy: "match_record_v1",
        format: compatibilityFormat(first.format),
        status: "draft",
        maxPlayers: backup.tournament.maxPlayers ?? null,
        swissRounds: first.format === "swiss" ? first.plannedRounds : null,
        defaultBestOf: first.bestOf,
        visibility: backup.tournament.visibility,
        ...credentials,
      })
      .returning();
    const [generated] = await tx
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournament.id));
    const stageIds = new Map<number, number>([[first.backupId, generated.id]]);
    const stageValues = (stage: TournamentBackupV3["stages"][number]) => ({
      tournamentId: tournament.id,
      stageKey: stage.stageKey,
      position: stage.position,
      name: stage.name,
      format: stage.format,
      status: "planned" as const,
      participantCount: stage.participantCount,
      bestOf: stage.bestOf,
      plannedRounds: stage.plannedRounds ?? null,
      currentRound: stage.currentRound ?? null,
      totalRounds: stage.totalRounds ?? null,
      rankingPolicy: stage.rankingPolicy,
      qualificationMode: stage.qualificationMode,
      advancingCount: stage.advancingCount ?? null,
      groupCount: stage.groupCount ?? null,
      participantsPerGroup: stage.participantsPerGroup ?? null,
      qualifiersPerGroup: stage.qualifiersPerGroup ?? null,
      seedingPolicy: compatibleSeedingPolicy(stage),
      entrySeedingPolicy: stage.entrySeedingPolicy ?? "preserve",
      resultSeedingPolicy: stage.resultSeedingPolicy ?? (stage.format === "group_stage" ? "rank_bands" : "standings_order"),
      randomSeed: stage.randomSeed ?? null,
      randomRevealOrder: stage.randomRevealOrder ?? "instant",
      seedingAudit: stage.seedingAudit ?? null,
      winnerId: null,
      version: stage.version,
      createdAt: new Date(stage.createdAt),
    });
    await tx
      .update(tournamentStagesTable)
      .set(stageValues(first))
      .where(eq(tournamentStagesTable.id, generated.id));
    for (const stage of orderedStages.slice(1)) {
      const [created] = await tx
        .insert(tournamentStagesTable)
        .values(stageValues(stage))
        .returning();
      stageIds.set(stage.backupId, created.id);
    }
    const groupIds = new Map<number, number>();
    for (const group of backup.groups) {
      const [created] = await tx
        .insert(stageGroupsTable)
        .values({
          stageId: stageIds.get(group.stageBackupId)!,
          groupKey: group.groupKey,
          position: group.position,
          participantCount: group.participantCount,
          qualifiersCount: group.qualifiersCount,
          createdAt: new Date(group.createdAt),
        })
        .returning();
      groupIds.set(group.backupId, created.id);
    }
    const playerIds = new Map<number, number>();
    const partialFirstGroupRegistration =
      first.format === "group_stage" &&
      backup.players.length > 0 &&
      backup.players.length < first.participantCount;
    if (partialFirstGroupRegistration) {
      await tx
        .update(tournamentStagesTable)
        .set({
          format: "round_robin",
          rankingPolicy: "round_robin_v1",
          qualificationMode: "top_n",
          advancingCount:
            first.groupCount != null && first.qualifiersPerGroup != null
              ? calculateGroupAdvancingCount(
                  first.participantCount,
                  first.groupCount,
                  first.qualifiersPerGroup,
                )
              : 0,
          groupCount: null,
          participantsPerGroup: null,
          qualifiersPerGroup: null,
          seedingPolicy: "standings_order",
          resultSeedingPolicy: "standings_order",
        })
        .where(eq(tournamentStagesTable.id, generated.id));
    }
    const createdPlayers =
      backup.players.length === 0
        ? []
        : await tx
            .insert(playersTable)
            .values(
              backup.players.map((player) => ({
                tournamentId: tournament.id,
                name: player.name,
                rank: player.rank ?? null,
                country: player.country ?? null,
                teamName: player.teamName ?? null,
                seed: player.seed ?? null,
                status: player.status,
              })),
            )
            .returning();
    for (let index = 0; index < backup.players.length; index += 1) {
      playerIds.set(backup.players[index].backupId, createdPlayers[index].id);
    }
    if (partialFirstGroupRegistration) {
      await tx
        .update(tournamentStagesTable)
        .set(stageValues(first))
        .where(eq(tournamentStagesTable.id, generated.id));
    }
    const membershipIds = new Map<number, number>();
    const firstMemberships = await tx
      .select()
      .from(stageParticipantsTable)
      .where(eq(stageParticipantsTable.stageId, generated.id));
    const generatedByPlayer = new Map(
      firstMemberships.map((item) => [item.playerId, item]),
    );
    for (const membership of backup.stageParticipants.filter(
      (item) => item.stageBackupId === first.backupId,
    )) {
      const existing = generatedByPlayer.get(
        playerIds.get(membership.playerBackupId)!,
      );
      const [updated] = await tx
        .update(stageParticipantsTable)
        .set({
          stageSeed: membership.stageSeed,
          groupId:
            membership.groupBackupId == null
              ? null
              : groupIds.get(membership.groupBackupId)!,
          status: membership.status,
          qualificationSource: membership.qualificationSource,
          finalRank: membership.finalRank ?? null,
          groupRank: membership.groupRank ?? null,
          qualificationRank: membership.qualificationRank ?? null,
          nextStageSeed: membership.nextStageSeed ?? null,
          sourceStageParticipantId: null,
          qualifiedAt:
            membership.qualifiedAt == null
              ? null
              : new Date(membership.qualifiedAt),
          createdAt: new Date(membership.createdAt),
        })
        .where(eq(stageParticipantsTable.id, existing!.id))
        .returning();
      membershipIds.set(membership.backupId, updated.id);
    }
    for (const stage of orderedStages.slice(1)) {
      for (const membership of backup.stageParticipants.filter(
        (item) => item.stageBackupId === stage.backupId,
      )) {
        const [created] = await tx
          .insert(stageParticipantsTable)
          .values({
            tournamentId: tournament.id,
            stageId: stageIds.get(stage.backupId)!,
            playerId: playerIds.get(membership.playerBackupId)!,
            stageSeed: membership.stageSeed,
            groupId:
              membership.groupBackupId == null
                ? null
                : groupIds.get(membership.groupBackupId)!,
            status: membership.status,
            qualificationSource: membership.qualificationSource,
            finalRank: membership.finalRank ?? null,
            groupRank: membership.groupRank ?? null,
            qualificationRank: membership.qualificationRank ?? null,
            nextStageSeed: membership.nextStageSeed ?? null,
            sourceStageParticipantId:
              membership.sourceStageParticipantBackupId == null
                ? null
                : membershipIds.get(membership.sourceStageParticipantBackupId)!,
            qualifiedAt:
              membership.qualifiedAt == null
                ? null
                : new Date(membership.qualifiedAt),
            createdAt: new Date(membership.createdAt),
          })
          .returning();
        membershipIds.set(membership.backupId, created.id);
      }
    }
    const matchIds = new Map<number, number>();
    for (const match of backup.matches) {
      const [created] = await tx
        .insert(matchesTable)
        .values({
          tournamentId: tournament.id,
          stageId: stageIds.get(match.stageBackupId)!,
          stageGroupId:
            match.stageGroupBackupId == null
              ? null
              : groupIds.get(match.stageGroupBackupId)!,
          round: match.round,
          matchNumber: match.matchNumber,
          player1Id:
            match.player1BackupId == null
              ? null
              : playerIds.get(match.player1BackupId)!,
          player2Id:
            match.player2BackupId == null
              ? null
              : playerIds.get(match.player2BackupId)!,
          winnerId:
            match.winnerBackupId == null
              ? null
              : playerIds.get(match.winnerBackupId)!,
          score1: match.score1 ?? null,
          score2: match.score2 ?? null,
          resultType: match.resultType,
          resultReason: match.resultReason,
          bestOf: match.bestOf,
          status: match.status,
          note: match.note ?? null,
          sortOrder: match.sortOrder ?? null,
          scheduledAt:
            match.scheduledAt == null ? null : new Date(match.scheduledAt),
          completedAt:
            match.completedAt == null ? null : new Date(match.completedAt),
        })
        .returning();
      matchIds.set(match.backupId, created.id);
    }
    for (const match of backup.matches) {
      if (match.nextMatchBackupId != null)
        await tx
          .update(matchesTable)
          .set({ nextMatchId: matchIds.get(match.nextMatchBackupId)! })
          .where(eq(matchesTable.id, matchIds.get(match.backupId)!));
    }
    for (const history of backup.resultHistory) {
      await tx.insert(resultHistoryTable).values({
        matchId: matchIds.get(history.matchBackupId)!,
        tournamentId: tournament.id,
        stageId: stageIds.get(history.stageBackupId)!,
        revision: history.revision,
        round: history.round,
        matchNumber: history.matchNumber,
        player1Id:
          history.player1BackupId == null
            ? null
            : playerIds.get(history.player1BackupId)!,
        player2Id:
          history.player2BackupId == null
            ? null
            : playerIds.get(history.player2BackupId)!,
        winnerId:
          history.winnerBackupId == null
            ? null
            : playerIds.get(history.winnerBackupId)!,
        score1: history.score1 ?? null,
        score2: history.score2 ?? null,
        bestOf: history.bestOf,
        resultType: history.resultType,
        resultReason: history.resultReason,
        completedAt: new Date(history.completedAt),
        recordedAt: new Date(history.recordedAt),
      });
    }
    for (const action of backup.actionLog) {
      await tx.insert(actionLogTable).values({
        tournamentId: tournament.id,
        stageId:
          action.stageBackupId == null
            ? null
            : stageIds.get(action.stageBackupId)!,
        actionType: action.actionType,
        description: action.description,
        matchId:
          action.matchBackupId == null
            ? null
            : matchIds.get(action.matchBackupId)!,
        undoPayload:
          action.undoPayload == null
            ? null
            : JSON.stringify(
                remapUndoPayload(action.undoPayload, playerIds, matchIds),
              ),
        isUndone: action.isUndone,
        createdAt: new Date(action.createdAt),
      });
    }
    for (const stage of orderedStages) {
      await tx
        .update(tournamentStagesTable)
        .set({
          status: stage.status,
          winnerId:
            stage.winnerBackupId == null
              ? null
              : playerIds.get(stage.winnerBackupId)!,
          version: stage.version,
          startedAt: stage.startedAt == null ? null : new Date(stage.startedAt),
          completedAt:
            stage.completedAt == null ? null : new Date(stage.completedAt),
        })
        .where(eq(tournamentStagesTable.id, stageIds.get(stage.backupId)!));
    }
    await tx
      .update(tournamentsTable)
      .set({
        status: backup.tournament.status,
        activeStageId:
          backup.tournament.activeStageBackupId == null
            ? null
            : stageIds.get(backup.tournament.activeStageBackupId)!,
        winnerId:
          backup.tournament.winnerBackupId == null
            ? null
            : playerIds.get(backup.tournament.winnerBackupId)!,
        featuredMatchId:
          backup.tournament.featuredMatchBackupId == null
            ? null
            : matchIds.get(backup.tournament.featuredMatchBackupId)!,
      })
      .where(eq(tournamentsTable.id, tournament.id));
    const [restored] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, tournament.id));
    return {
      tournament: restored,
      playersImported: playerIds.size,
      matchesImported: matchIds.size,
    };
  });
}
