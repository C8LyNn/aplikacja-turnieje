import { eq } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchesTable,
  playersTable,
  resultHistoryTable,
  tournamentsTable,
} from "@workspace/db";
import type { TournamentBackup } from "@workspace/api-zod";
import { validatePlayedSeriesResult } from "../../domain/match/series-result";

export class BackupV2ValidationError extends Error {
  constructor(public readonly details: string[]) {
    super("Backup v2 did not pass semantic validation.");
    this.name = "BackupV2ValidationError";
  }
}

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;
const isValidDate = (value: string): boolean => !Number.isNaN(Date.parse(value));

export function validateBackupV2(backup: TournamentBackup): void {
  const errors: string[] = [];
  const playerIds = new Set<number>();
  const matchIds = new Set<number>();
  const roundNumbers = new Set<string>();

  if (backup.schemaVersion !== 2) errors.push("schemaVersion must equal 2.");
  if (backup.resultModelVersion !== "series_v1") errors.push("resultModelVersion must equal series_v1.");
  if (backup.rankingPolicy !== "match_record_v1") errors.push("rankingPolicy must equal match_record_v1.");
  if (!isValidDate(backup.exportedAt)) errors.push("exportedAt is not a valid date.");
  if (!backup.tournament.name.trim()) errors.push("Tournament name is empty.");
  if (!isPositiveInteger(backup.tournament.defaultBestOf) || backup.tournament.defaultBestOf % 2 === 0) {
    errors.push("Tournament defaultBestOf must be a positive odd integer.");
  }
  for (const value of [
    backup.tournament.currentRound,
    backup.tournament.totalRounds,
    backup.tournament.swissRounds,
  ]) {
    if (value != null && !isPositiveInteger(value)) errors.push("Tournament round values must be positive integers.");
  }

  for (const player of backup.players) {
    if (!isPositiveInteger(player.backupId) || playerIds.has(player.backupId)) {
      errors.push(`Invalid or duplicate player backupId: ${player.backupId}.`);
    }
    playerIds.add(player.backupId);
    if (!player.name.trim()) errors.push(`Player ${player.backupId} has an empty name.`);
    if (player.seed != null && !isPositiveInteger(player.seed)) errors.push(`Player ${player.backupId} has an invalid seed.`);
  }

  const validatePlayerReference = (value: number | null | undefined, label: string): void => {
    if (value != null && !playerIds.has(value)) errors.push(`${label} references missing player ${value}.`);
  };

  for (const match of backup.matches) {
    if (!isPositiveInteger(match.backupId) || matchIds.has(match.backupId)) {
      errors.push(`Invalid or duplicate match backupId: ${match.backupId}.`);
    }
    matchIds.add(match.backupId);
    if (!isPositiveInteger(match.round) || !isPositiveInteger(match.matchNumber)) {
      errors.push(`Match ${match.backupId} has an invalid round or match number.`);
    }
    const roundKey = `${match.round}:${match.matchNumber}`;
    if (roundNumbers.has(roundKey)) errors.push(`Duplicate round/match number ${roundKey}.`);
    roundNumbers.add(roundKey);
    if (!isPositiveInteger(match.bestOf) || match.bestOf % 2 === 0) errors.push(`Match ${match.backupId} has invalid bestOf.`);
    validatePlayerReference(match.player1BackupId, `Match ${match.backupId} player1`);
    validatePlayerReference(match.player2BackupId, `Match ${match.backupId} player2`);
    validatePlayerReference(match.winnerBackupId, `Match ${match.backupId} winner`);
    if (match.player1BackupId != null && match.player1BackupId === match.player2BackupId) {
      errors.push(`Match ${match.backupId} has duplicate participants.`);
    }
    if (match.scheduledAt != null && !isValidDate(match.scheduledAt)) errors.push(`Match ${match.backupId} has invalid scheduledAt.`);
    if (match.completedAt != null && !isValidDate(match.completedAt)) errors.push(`Match ${match.backupId} has invalid completedAt.`);

    const completed = match.status === "completed";
    if (completed !== (match.resultType != null && match.completedAt != null)) {
      errors.push(`Match ${match.backupId} has inconsistent lifecycle/result fields.`);
      continue;
    }
    if (!completed) {
      if (match.winnerBackupId != null || match.score1 != null || match.score2 != null || match.resultReason != null) {
        errors.push(`Non-completed match ${match.backupId} contains final result data.`);
      }
      continue;
    }

    if (match.resultType === "played") {
      if (match.resultReason != null) errors.push(`Played match ${match.backupId} cannot contain a result reason.`);
      if (match.player1BackupId == null || match.player2BackupId == null || match.score1 == null || match.score2 == null) {
        errors.push(`Played match ${match.backupId} is incomplete.`);
      } else {
        const result = validatePlayedSeriesResult({
          resultType: "played",
          bestOf: match.bestOf,
          score1: match.score1,
          score2: match.score2,
        });
        if (!result.ok) errors.push(`Played match ${match.backupId}: ${result.error.code}.`);
        else {
          const derivedWinner = result.value.winnerSide === "player1"
            ? match.player1BackupId
            : match.player2BackupId;
          if (match.winnerBackupId !== derivedWinner) errors.push(`Played match ${match.backupId} has a mismatched winner.`);
        }
      }
    } else if (match.resultType === "walkover") {
      if (
        match.player1BackupId == null ||
        match.player2BackupId == null ||
        (match.winnerBackupId !== match.player1BackupId && match.winnerBackupId !== match.player2BackupId) ||
        match.score1 != null ||
        match.score2 != null
      ) {
        errors.push(`Walkover match ${match.backupId} has an invalid shape.`);
      }
    } else if (match.resultType === "bye") {
      if (
        match.player1BackupId == null ||
        match.player2BackupId != null ||
        match.winnerBackupId !== match.player1BackupId ||
        match.score1 != null ||
        match.score2 != null ||
        match.resultReason !== "system_bye"
      ) {
        errors.push(`Bye match ${match.backupId} has an invalid shape.`);
      }
    } else if (match.resultType === "no_contest") {
      if (
        backup.tournament.format === "single_elimination" ||
        match.player1BackupId == null ||
        match.player2BackupId == null ||
        match.winnerBackupId != null ||
        match.score1 != null ||
        match.score2 != null
      ) {
        errors.push(`No-contest match ${match.backupId} has an invalid shape for this tournament.`);
      }
    }
  }

  for (const match of backup.matches) {
    if (match.nextMatchBackupId != null && !matchIds.has(match.nextMatchBackupId)) {
      errors.push(`Match ${match.backupId} references missing next match ${match.nextMatchBackupId}.`);
    }
  }
  validatePlayerReference(backup.tournament.winnerBackupId, "Tournament winner");
  if (backup.tournament.featuredMatchBackupId != null && !matchIds.has(backup.tournament.featuredMatchBackupId)) {
    errors.push("Tournament featured match reference is invalid.");
  }

  const historyRevisions = new Set<string>();
  for (const history of backup.resultHistory) {
    if (!matchIds.has(history.matchBackupId)) errors.push(`History references missing match ${history.matchBackupId}.`);
    if (!isPositiveInteger(history.revision)) errors.push(`History for match ${history.matchBackupId} has invalid revision.`);
    const key = `${history.matchBackupId}:${history.revision}`;
    if (historyRevisions.has(key)) errors.push(`Duplicate history revision ${key}.`);
    historyRevisions.add(key);
    if (!isPositiveInteger(history.bestOf) || history.bestOf % 2 === 0) errors.push(`History ${key} has invalid bestOf.`);
    if (!isValidDate(history.completedAt) || !isValidDate(history.recordedAt)) errors.push(`History ${key} has invalid dates.`);
    validatePlayerReference(history.player1BackupId, `History ${key} player1`);
    validatePlayerReference(history.player2BackupId, `History ${key} player2`);
    validatePlayerReference(history.winnerBackupId, `History ${key} winner`);
    if (history.resultType === "played") {
      if (history.resultReason != null) errors.push(`Played history ${key} cannot contain a result reason.`);
      if (history.player1BackupId == null || history.player2BackupId == null || history.score1 == null || history.score2 == null) {
        errors.push(`Played history ${key} is incomplete.`);
      } else {
        const result = validatePlayedSeriesResult({
          resultType: "played",
          bestOf: history.bestOf,
          score1: history.score1,
          score2: history.score2,
        });
        if (!result.ok) errors.push(`Played history ${key}: ${result.error.code}.`);
        else {
          const winner = result.value.winnerSide === "player1" ? history.player1BackupId : history.player2BackupId;
          if (history.winnerBackupId !== winner) errors.push(`Played history ${key} has a mismatched winner.`);
        }
      }
    } else if (history.resultType === "walkover") {
      if (
        history.player1BackupId == null ||
        history.player2BackupId == null ||
        (history.winnerBackupId !== history.player1BackupId && history.winnerBackupId !== history.player2BackupId) ||
        history.score1 != null ||
        history.score2 != null
      ) {
        errors.push(`Walkover history ${key} has an invalid shape.`);
      }
    } else if (history.resultType === "bye") {
      if (
        history.player1BackupId == null ||
        history.player2BackupId != null ||
        history.winnerBackupId !== history.player1BackupId ||
        history.score1 != null ||
        history.score2 != null ||
        history.resultReason !== "system_bye"
      ) {
        errors.push(`Bye history ${key} has an invalid shape.`);
      }
    } else if (
      backup.tournament.format === "single_elimination" ||
      history.player1BackupId == null ||
      history.player2BackupId == null ||
      history.winnerBackupId != null ||
      history.score1 != null ||
      history.score2 != null
    ) {
      errors.push(`No-contest history ${key} has an invalid shape.`);
    }
  }

  for (const action of backup.actionLog) {
    if (action.matchBackupId != null && !matchIds.has(action.matchBackupId)) errors.push("Action log references a missing match.");
    if (!isValidDate(action.createdAt)) errors.push("Action log contains an invalid date.");
  }

  if (errors.length > 0) throw new BackupV2ValidationError(errors);
}

function remapUndoPayload(
  payload: Record<string, unknown> | null,
  playerIdMap: Map<number, number>,
  matchIdMap: Map<number, number>,
): Record<string, unknown> | null {
  if (!payload) return null;
  const playerKeys = new Set(["playerId", "player1Id", "player2Id", "winnerId"]);
  const matchKeys = new Set(["matchId", "prevFeaturedMatchId"]);
  const remap = (value: unknown, key?: string): unknown => {
    if (typeof value === "number" && key && playerKeys.has(key)) return playerIdMap.get(value) ?? value;
    if (typeof value === "number" && key && matchKeys.has(key)) return matchIdMap.get(value) ?? value;
    if (Array.isArray(value)) return value.map((item) => remap(item));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [childKey, remap(child, childKey)]),
      );
    }
    return value;
  };
  return remap(payload) as Record<string, unknown>;
}

export async function importBackupV2(backup: TournamentBackup) {
  validateBackupV2(backup);
  return db.transaction(async (tx) => {
    const [tournament] = await tx.insert(tournamentsTable).values({
      name: `${backup.tournament.name} (kopia)`,
      description: backup.tournament.description ?? null,
      resultModelVersion: "series_v1",
      rankingPolicy: "match_record_v1",
      format: backup.tournament.format,
      status: backup.tournament.status,
      maxPlayers: backup.tournament.maxPlayers ?? null,
      currentRound: backup.tournament.currentRound ?? null,
      totalRounds: backup.tournament.totalRounds ?? null,
      swissRounds: backup.tournament.swissRounds ?? null,
      defaultBestOf: backup.tournament.defaultBestOf,
      visibility: backup.tournament.visibility,
    }).returning();

    const playerIdMap = new Map<number, number>();
    for (const player of backup.players) {
      const [created] = await tx.insert(playersTable).values({
        tournamentId: tournament.id,
        name: player.name,
        rank: player.rank ?? null,
        country: player.country ?? null,
        teamName: player.teamName ?? null,
        seed: player.seed ?? null,
        status: player.status,
      }).returning();
      playerIdMap.set(player.backupId, created.id);
    }

    const matchIdMap = new Map<number, number>();
    for (const match of backup.matches) {
      const [created] = await tx.insert(matchesTable).values({
        tournamentId: tournament.id,
        round: match.round,
        matchNumber: match.matchNumber,
        player1Id: match.player1BackupId == null ? null : playerIdMap.get(match.player1BackupId)!,
        player2Id: match.player2BackupId == null ? null : playerIdMap.get(match.player2BackupId)!,
        winnerId: match.winnerBackupId == null ? null : playerIdMap.get(match.winnerBackupId)!,
        score1: match.score1 ?? null,
        score2: match.score2 ?? null,
        resultType: match.resultType,
        resultReason: match.resultReason,
        bestOf: match.bestOf,
        status: match.status,
        note: match.note ?? null,
        sortOrder: match.sortOrder ?? null,
        scheduledAt: match.scheduledAt == null ? null : new Date(match.scheduledAt),
        completedAt: match.completedAt == null ? null : new Date(match.completedAt),
      }).returning();
      matchIdMap.set(match.backupId, created.id);
    }

    for (const match of backup.matches) {
      if (match.nextMatchBackupId == null) continue;
      await tx.update(matchesTable)
        .set({ nextMatchId: matchIdMap.get(match.nextMatchBackupId)! })
        .where(eq(matchesTable.id, matchIdMap.get(match.backupId)!));
    }
    await tx.update(tournamentsTable).set({
      winnerId: backup.tournament.winnerBackupId == null ? null : playerIdMap.get(backup.tournament.winnerBackupId)!,
      featuredMatchId: backup.tournament.featuredMatchBackupId == null
        ? null
        : matchIdMap.get(backup.tournament.featuredMatchBackupId)!,
    }).where(eq(tournamentsTable.id, tournament.id));

    for (const history of backup.resultHistory) {
      await tx.insert(resultHistoryTable).values({
        matchId: matchIdMap.get(history.matchBackupId)!,
        tournamentId: tournament.id,
        revision: history.revision,
        round: history.round,
        matchNumber: history.matchNumber,
        player1Id: history.player1BackupId == null ? null : playerIdMap.get(history.player1BackupId)!,
        player2Id: history.player2BackupId == null ? null : playerIdMap.get(history.player2BackupId)!,
        winnerId: history.winnerBackupId == null ? null : playerIdMap.get(history.winnerBackupId)!,
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
      const undoPayload = remapUndoPayload(action.undoPayload, playerIdMap, matchIdMap);
      await tx.insert(actionLogTable).values({
        tournamentId: tournament.id,
        actionType: action.actionType,
        description: action.description,
        matchId: action.matchBackupId == null ? null : matchIdMap.get(action.matchBackupId)!,
        undoPayload: undoPayload == null ? null : JSON.stringify(undoPayload),
        isUndone: action.isUndone,
        createdAt: new Date(action.createdAt),
      });
    }

    const [restoredTournament] = await tx.select().from(tournamentsTable).where(eq(tournamentsTable.id, tournament.id));
    return {
      tournament: restoredTournament,
      playersImported: playerIdMap.size,
      matchesImported: matchIdMap.size,
    };
  });
}
