import assert from "node:assert/strict";
import test from "node:test";
import type { TournamentBackupV3 } from "@workspace/api-zod";
import {
  BackupV3ValidationError,
  validateBackupV3,
} from "../src/application/backups/backup-v3";

const timestamp = "2026-08-17T12:00:00.000Z";

function activeMarvelBackup(): TournamentBackupV3 {
  return {
    schemaVersion: 3,
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    exportedAt: timestamp,
    tournament: {
      name: "Marvel backup",
      status: "active",
      maxPlayers: 8,
      activeStageBackupId: 10,
      winnerBackupId: null,
      featuredMatchBackupId: null,
      visibility: "public_online",
      gameConfig: {
        gameId: "marvel",
        configVersion: 1,
        config: {
          groupSize: 8,
          advancingCount: 4,
          killLimit: 20,
          regroupingStrategy: "paired_merge",
        },
      },
    },
    players: Array.from({ length: 8 }, (_, index) => ({
      backupId: index + 1,
      name: `Player ${index + 1}`,
      seed: index + 1,
      status: "active" as const,
    })),
    stages: [{
      backupId: 10,
      stageKey: "stage_1",
      position: 1,
      name: "Marvel — Eliminacyjne grupy",
      format: "group_stage",
      status: "active",
      participantCount: 8,
      bestOf: 1,
      plannedRounds: null,
      currentRound: 1,
      totalRounds: 1,
      rankingPolicy: "group_v1",
      qualificationMode: "none",
      advancingCount: null,
      groupCount: 1,
      participantsPerGroup: 8,
      qualifiersPerGroup: 4,
      seedingPolicy: "snake_groups",
      entrySeedingPolicy: "preserve",
      resultSeedingPolicy: "rank_bands",
      randomSeed: null,
      randomRevealOrder: "instant",
      seedingAudit: null,
      winnerBackupId: null,
      version: 1,
      createdAt: timestamp,
      startedAt: timestamp,
      completedAt: null,
    }],
    groups: [],
    stageParticipants: Array.from({ length: 8 }, (_, index) => ({
      backupId: 100 + index,
      stageBackupId: 10,
      playerBackupId: index + 1,
      stageSeed: index + 1,
      groupBackupId: null,
      status: "active" as const,
      qualificationSource: "registration" as const,
      createdAt: timestamp,
    })),
    marvelRounds: [{
      backupId: 20,
      stageBackupId: 10,
      roundNumber: 1,
      participantCount: 8,
      groupSize: 8,
      advancingCount: 4,
      killLimit: 20,
      regroupingStrategy: "paired_merge",
      status: "active",
      randomSeed: null,
      createdAt: timestamp,
      completedAt: null,
    }],
    marvelGroups: [{
      backupId: 30,
      stageBackupId: 10,
      roundBackupId: 20,
      groupKey: "A",
      position: 1,
      status: "pending",
      completedAt: null,
      createdAt: timestamp,
    }],
    marvelGroupEntries: Array.from({ length: 8 }, (_, index) => ({
      backupId: 200 + index,
      stageBackupId: 10,
      roundBackupId: 20,
      groupBackupId: 30,
      playerBackupId: index + 1,
      sourceGroupBackupId: null,
      groupSlot: index + 1,
      placement: null,
      kills: null,
      qualified: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    matches: [],
    resultHistory: [],
    actionLog: [],
  };
}

test("Backup V3 accepts a complete active Marvel runtime", () => {
  try {
    validateBackupV3(activeMarvelBackup());
  } catch (error) {
    assert.fail(
      error instanceof BackupV3ValidationError
        ? error.details.join("\n")
        : String(error),
    );
  }
});

test("Backup V3 rejects an active Marvel stage without its runtime", () => {
  const backup = activeMarvelBackup();
  delete backup.marvelRounds;
  delete backup.marvelGroups;
  delete backup.marvelGroupEntries;
  assert.throws(
    () => validateBackupV3(backup),
    (error: unknown) =>
      error instanceof BackupV3ValidationError &&
      error.details.some((detail) => detail.includes("requires runtime")),
  );
});
