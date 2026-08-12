import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { PgTableExtraConfigValue } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentFormatEnum = pgEnum("tournament_format", [
  "single_elimination",
  "round_robin",
  "swiss",
  "group_stage",
  "double_elimination",
]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "active",
  "completed",
]);

export const resultModelVersionEnum = pgEnum("result_model_version", ["series_v1"]);
export const rankingPolicyEnum = pgEnum("ranking_policy", ["match_record_v1"]);

export const tournamentStageFormatEnum = pgEnum("tournament_stage_format", [
  "swiss",
  "round_robin",
  "group_stage",
  "single_elimination",
  "double_elimination",
]);
export const tournamentStageStatusEnum = pgEnum("tournament_stage_status", [
  "planned",
  "active",
  "completed",
]);
export const stageRankingPolicyEnum = pgEnum("stage_ranking_policy", [
  "swiss_v1",
  "round_robin_v1",
  "group_v1",
  "elimination_bracket_v1",
]);
export const stageQualificationModeEnum = pgEnum("stage_qualification_mode", [
  "none",
  "top_n",
  "top_n_per_group",
]);
export const stageSeedingPolicyEnum = pgEnum("stage_seeding_policy", [
  "standings_order",
  "snake_groups",
  "cross_group",
  "random_groups",
  "standard_bracket",
  "random_bracket",
]);
export const stageEntrySeedingPolicyEnum = pgEnum("stage_entry_seeding_policy", [
  "preserve",
  "registration_order",
  "alphabetical",
  "random",
  "manual",
]);
export const stageResultSeedingPolicyEnum = pgEnum("stage_result_seeding_policy", [
  "standings_order",
  "rank_bands",
  "global_ranking",
]);
export const stageRandomRevealOrderEnum = pgEnum("stage_random_reveal_order", [
  "instant",
  "sequential",
]);
export const stageParticipantStatusEnum = pgEnum("stage_participant_status", [
  "active",
  "eliminated",
  "qualified",
  "winner",
]);
export const stageQualificationSourceEnum = pgEnum("stage_qualification_source", [
  "registration",
  "standings",
  "group_position",
]);

export const playerStatusEnum = pgEnum("player_status", [
  "active",
  "eliminated",
  "winner",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "in_progress",
  "postponed",
  "completed",
  "cancelled",
]);

export const matchResultTypeEnum = pgEnum("match_result_type", [
  "played",
  "walkover",
  "bye",
  "no_contest",
]);

// Infrastructure table shared by forward-only migration runners and deployment
// preflights. It is part of the authoritative schema even though application
// requests do not write to it directly.
export const appSchemaMigrationsTable = pgTable("app_schema_migrations", {
  migrationKey: text("migration_key").primaryKey(),
  appliedAt: timestamp("applied_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  appCommit: text("app_commit").notNull(),
  targetSchema: text("target_schema").notNull(),
  deploymentEnvironment: text("deployment_environment").notNull(),
});

export const tournamentsTable = pgTable(
  "tournaments",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    resultModelVersion: resultModelVersionEnum("result_model_version")
      .notNull()
      .default("series_v1"),
    rankingPolicy: rankingPolicyEnum("ranking_policy")
      .notNull()
      .default("match_record_v1"),
    // Compatibility projection for the legacy single-stage API. TournamentStage
    // is authoritative after migration 0002; these columns are removed only after
    // stage-aware OpenAPI, Backup v3 and all runtime reads have been migrated.
    format: tournamentFormatEnum("format").notNull(),
    status: tournamentStatusEnum("status").notNull().default("draft"),
    maxPlayers: integer("max_players"),
    swissRounds: integer("swiss_rounds"),
    defaultBestOf: integer("default_best_of").notNull().default(1),
    currentRound: integer("current_round"),
    totalRounds: integer("total_rounds"),
    // Internal stage lifecycle pointer. It is intentionally not exposed by the legacy API.
    // The SQL migration adds the composite FK to tournament_stages after both tables exist.
    activeStageId: integer("active_stage_id"),
    winnerId: integer("winner_id"),
    featuredMatchId: integer("featured_match_id"),
    presentationSettings: jsonb("presentation_settings"),
    hostCode: text("host_code"),
    organizerPasswordHash: text("organizer_password_hash"),
    supportPasswordHash: text("support_password_hash"),
    supportPasswordVersion: integer("support_password_version").notNull().default(1),
    viewerPasswordHash: text("viewer_password_hash"),
    viewerPasswordVersion: integer("viewer_password_version").notNull().default(1),
    visibility: text("visibility").notNull().default("public_online"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "tournaments_default_best_of_positive_odd",
      sql`${table.defaultBestOf} > 0 AND ${table.defaultBestOf} % 2 = 1`,
    ),
    check(
      "tournaments_round_values_positive",
      sql`(${table.currentRound} IS NULL OR ${table.currentRound} > 0)
        AND (${table.totalRounds} IS NULL OR ${table.totalRounds} > 0)
        AND (${table.swissRounds} IS NULL OR ${table.swissRounds} > 0)`,
    ),
  ],
);

// Optional, versioned game-specific configuration. The tournament core and
// stage engine only persist the generic envelope; each game validates its own
// configuration in the game catalog before this row is written.
export const tournamentGameConfigsTable = pgTable(
  "tournament_game_configs",
  {
    tournamentId: integer("tournament_id").notNull(),
    gameId: text("game_id").notNull(),
    configVersion: integer("config_version").notNull(),
    config: jsonb("config")
      .$type<object>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.tournamentId],
      name: "tournament_game_configs_pkey",
    }),
    foreignKey({
      columns: [table.tournamentId],
      foreignColumns: [tournamentsTable.id],
      name: "tournament_game_configs_tournament_fk",
    }).onDelete("cascade"),
    check(
      "tournament_game_configs_game_id_present",
      sql`length(btrim(${table.gameId})) > 0`,
    ),
    check(
      "tournament_game_configs_version_positive",
      sql`${table.configVersion} > 0`,
    ),
    check(
      "tournament_game_configs_config_object",
      sql`jsonb_typeof(${table.config}) = 'object'`,
    ),
  ],
);

export const playersTable = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rank: text("rank"),
    country: text("country"),
    teamName: text("team_name"),
    seed: integer("seed"),
    status: playerStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("players_tournament_id_id_unique").on(table.tournamentId, table.id),
    index("players_tournament_seed_idx").on(table.tournamentId, table.seed),
    check("players_seed_positive", sql`${table.seed} IS NULL OR ${table.seed} > 0`),
  ],
);

export const tournamentStagesTable = pgTable(
  "tournament_stages",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    stageKey: text("stage_key").notNull(),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    format: tournamentStageFormatEnum("format").notNull(),
    status: tournamentStageStatusEnum("status").notNull().default("planned"),
    participantCount: integer("participant_count").notNull().default(0),
    bestOf: integer("best_of").notNull().default(1),
    plannedRounds: integer("planned_rounds"),
    currentRound: integer("current_round"),
    totalRounds: integer("total_rounds"),
    rankingPolicy: stageRankingPolicyEnum("ranking_policy").notNull(),
    qualificationMode: stageQualificationModeEnum("qualification_mode").notNull().default("none"),
    advancingCount: integer("advancing_count"),
    groupCount: integer("group_count"),
    participantsPerGroup: integer("participants_per_group"),
    qualifiersPerGroup: integer("qualifiers_per_group"),
    seedingPolicy: stageSeedingPolicyEnum("seeding_policy").notNull().default("standings_order"),
    entrySeedingPolicy: stageEntrySeedingPolicyEnum("entry_seeding_policy").notNull().default("preserve"),
    resultSeedingPolicy: stageResultSeedingPolicyEnum("result_seeding_policy").notNull().default("standings_order"),
    randomSeed: text("random_seed"),
    randomRevealOrder: stageRandomRevealOrderEnum("random_reveal_order").notNull().default("instant"),
    seedingAudit: jsonb("seeding_audit"),
    winnerId: integer("winner_id"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table): PgTableExtraConfigValue[] => [
    uniqueIndex("tournament_stages_tournament_position_unique").on(table.tournamentId, table.position),
    uniqueIndex("tournament_stages_tournament_key_unique").on(table.tournamentId, table.stageKey),
    unique("tournament_stages_tournament_id_id_unique").on(table.tournamentId, table.id),
    uniqueIndex("tournament_stages_one_active_per_tournament")
      .on(table.tournamentId)
      .where(sql`${table.status} = 'active'`),
    foreignKey({
      columns: [table.tournamentId, table.winnerId],
      foreignColumns: [playersTable.tournamentId, playersTable.id],
      name: "tournament_stages_winner_same_tournament_fk",
    }),
    // PostgreSQL owns the DEFERRABLE INITIALLY DEFERRED attributes installed by
    // migrations 0002/0009. Drizzle Kit 0.31 does not serialize deferrability,
    // but declaring the FK here prevents it from treating the constraint as
    // extraneous while the integration suite verifies the exact attributes.
    foreignKey({
      columns: [table.id, table.winnerId],
      foreignColumns: [stageParticipantsTable.stageId, stageParticipantsTable.playerId],
      name: "tournament_stages_winner_same_stage_fk",
    }),
    check("tournament_stages_position_range", sql`${table.position} BETWEEN 1 AND 10`),
    check("tournament_stages_participant_count_nonnegative", sql`${table.participantCount} >= 0`),
    check("tournament_stages_best_of_supported", sql`${table.bestOf} > 0 AND ${table.bestOf} % 2 = 1`),
    check("tournament_stages_round_values_positive", sql`
      (${table.plannedRounds} IS NULL OR ${table.plannedRounds} > 0)
      AND (${table.currentRound} IS NULL OR ${table.currentRound} > 0)
      AND (${table.totalRounds} IS NULL OR ${table.totalRounds} > 0)`),
    check("tournament_stages_advancing_count_positive", sql`${table.advancingCount} IS NULL OR ${table.advancingCount} > 0`),
    check("tournament_stages_qualification_configuration", sql`
      (${table.qualificationMode} = 'none' AND ${table.advancingCount} IS NULL)
      OR (${table.qualificationMode} = 'top_n' AND ${table.format} IN ('swiss', 'round_robin')
        AND ${table.advancingCount} IS NOT NULL
        AND ${table.advancingCount} <= ${table.participantCount})
      OR (${table.qualificationMode} = 'top_n' AND ${table.format} = 'single_elimination'
        AND ${table.advancingCount} IS NOT NULL)
      OR (${table.qualificationMode} = 'top_n_per_group' AND ${table.format} = 'group_stage'
        AND ${table.advancingCount} IS NULL)`),
    check("tournament_stages_elimination_advancing_boundary", sql`
      ${table.format} <> 'single_elimination'
      OR ${table.qualificationMode} = 'none'
      OR (${table.qualificationMode} = 'top_n'
        AND ${table.advancingCount} < ${table.participantCount}
        AND (${table.advancingCount} & (${table.advancingCount} - 1)) = 0)`),
    check("tournament_stages_seeding_configuration", sql`
      (${table.format} IN ('swiss', 'round_robin') AND ${table.seedingPolicy} = 'standings_order')
      OR (${table.format} = 'group_stage' AND ${table.seedingPolicy} IN ('snake_groups', 'random_groups'))
      OR (${table.format} IN ('single_elimination', 'double_elimination') AND ${table.seedingPolicy} IN ('standard_bracket', 'random_bracket'))`),
    check("tournament_stages_result_seeding_configuration", sql`
      (${table.format} = 'group_stage' AND ${table.resultSeedingPolicy} IN ('rank_bands', 'global_ranking'))
      OR (${table.format} <> 'group_stage' AND ${table.resultSeedingPolicy} = 'standings_order')`),
    check("tournament_stages_random_seed_configuration", sql`
      (${table.randomSeed} IS NULL OR length(trim(${table.randomSeed})) BETWEEN 1 AND 200)
      AND ((${table.entrySeedingPolicy} <> 'random'
        AND ${table.seedingPolicy} NOT IN ('random_groups', 'random_bracket'))
        OR ${table.randomSeed} IS NOT NULL)`),
    check("tournament_stages_seeding_audit_shape", sql`
      ${table.seedingAudit} IS NULL OR jsonb_typeof(${table.seedingAudit}) = 'object'`),
    check("tournament_stages_version_positive", sql`${table.version} > 0`),
    check("tournament_stages_lifecycle_timestamps", sql`
      (${table.status} = 'planned' AND ${table.startedAt} IS NULL AND ${table.completedAt} IS NULL)
      OR (${table.status} = 'active' AND ${table.completedAt} IS NULL)
      OR (${table.status} = 'completed' AND ${table.completedAt} IS NOT NULL)`),
    check("tournament_stages_format_configuration", sql`
      (${table.format} = 'swiss' AND ${table.rankingPolicy} = 'swiss_v1' AND ${table.plannedRounds} IS NOT NULL
        AND ${table.groupCount} IS NULL AND ${table.participantsPerGroup} IS NULL AND ${table.qualifiersPerGroup} IS NULL)
      OR (${table.format} = 'round_robin' AND ${table.rankingPolicy} = 'round_robin_v1' AND ${table.plannedRounds} IS NULL
        AND ${table.groupCount} IS NULL AND ${table.participantsPerGroup} IS NULL AND ${table.qualifiersPerGroup} IS NULL)
      OR (${table.format} = 'single_elimination' AND ${table.rankingPolicy} = 'elimination_bracket_v1' AND ${table.plannedRounds} IS NULL
        AND ${table.groupCount} IS NULL AND ${table.participantsPerGroup} IS NULL AND ${table.qualifiersPerGroup} IS NULL)
      OR (${table.format} = 'double_elimination' AND ${table.rankingPolicy} = 'elimination_bracket_v1' AND ${table.plannedRounds} IS NULL
        AND ${table.groupCount} IS NULL AND ${table.participantsPerGroup} IS NULL AND ${table.qualifiersPerGroup} IS NULL)
      OR (${table.format} = 'group_stage' AND ${table.rankingPolicy} = 'group_v1' AND ${table.plannedRounds} IS NULL
        AND ${table.groupCount} >= 1 AND ${table.groupCount} * 2 <= ${table.participantCount}
        AND ${table.participantsPerGroup} >= 2
        AND ${table.participantCount} <= ${table.groupCount} * ${table.participantsPerGroup}
        AND ${table.participantCount} > ${table.groupCount} * (${table.participantsPerGroup} - 1)
        AND ${table.qualifiersPerGroup} BETWEEN 1 AND ${table.participantsPerGroup})`),
  ],
);

export const stageGroupsTable = pgTable(
  "stage_groups",
  {
    id: serial("id").primaryKey(),
    stageId: integer("stage_id")
      .notNull()
      .references(() => tournamentStagesTable.id, { onDelete: "cascade" }),
    groupKey: text("group_key").notNull(),
    position: integer("position").notNull(),
    participantCount: integer("participant_count").notNull(),
    qualifiersCount: integer("qualifiers_count").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("stage_groups_stage_key_unique").on(table.stageId, table.groupKey),
    uniqueIndex("stage_groups_stage_position_unique").on(table.stageId, table.position),
    unique("stage_groups_stage_id_id_unique").on(table.stageId, table.id),
    check("stage_groups_key_nonempty", sql`length(${table.groupKey}) > 0`),
    check("stage_groups_position_positive", sql`${table.position} > 0`),
    check("stage_groups_participant_count_minimum", sql`${table.participantCount} >= 2`),
    check("stage_groups_qualifiers_count_range", sql`${table.qualifiersCount} BETWEEN 1 AND ${table.participantCount}`),
  ],
);

export const stageParticipantsTable = pgTable(
  "stage_participants",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id").notNull(),
    stageId: integer("stage_id").notNull(),
    playerId: integer("player_id").notNull(),
    stageSeed: integer("stage_seed").notNull(),
    groupId: integer("group_id"),
    status: stageParticipantStatusEnum("status").notNull().default("active"),
    qualificationSource: stageQualificationSourceEnum("qualification_source").notNull().default("registration"),
    finalRank: integer("final_rank"),
    groupRank: integer("group_rank"),
    qualificationRank: integer("qualification_rank"),
    nextStageSeed: integer("next_stage_seed"),
    sourceStageParticipantId: integer("source_stage_participant_id"),
    qualifiedAt: timestamp("qualified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table): PgTableExtraConfigValue[] => [
    uniqueIndex("stage_participants_stage_player_unique").on(table.stageId, table.playerId),
    // Migration 0002 deploys this invariant as a DEFERRABLE unique constraint,
    // allowing one transaction to normalize every seed atomically to 1..N.
    unique("stage_participants_stage_seed_unique").on(table.stageId, table.stageSeed),
    unique("stage_participants_tournament_id_id_unique").on(table.tournamentId, table.id),
    foreignKey({
      columns: [table.tournamentId, table.stageId],
      foreignColumns: [tournamentStagesTable.tournamentId, tournamentStagesTable.id],
      name: "stage_participants_stage_same_tournament_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tournamentId, table.playerId],
      foreignColumns: [playersTable.tournamentId, playersTable.id],
      name: "stage_participants_player_same_tournament_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.stageId, table.groupId],
      foreignColumns: [stageGroupsTable.stageId, stageGroupsTable.id],
      name: "stage_participants_group_same_stage_fk",
    }),
    foreignKey({
      columns: [table.tournamentId, table.sourceStageParticipantId],
      foreignColumns: [table.tournamentId, table.id],
      name: "stage_participants_source_same_tournament_fk",
    }).onDelete("restrict"),
    check("stage_participants_seed_positive", sql`${table.stageSeed} > 0`),
    check("stage_participants_rank_values_positive", sql`
      (${table.finalRank} IS NULL OR ${table.finalRank} > 0)
      AND (${table.groupRank} IS NULL OR ${table.groupRank} > 0)
      AND (${table.qualificationRank} IS NULL OR ${table.qualificationRank} > 0)
      AND (${table.nextStageSeed} IS NULL OR ${table.nextStageSeed} > 0)`),
  ],
);

export const matchesTable = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    // Compatibility inserts omit stageId; the migration's BEFORE trigger resolves Etap 1 atomically.
    stageId: integer("stage_id").notNull().$defaultFn(() => 0),
    stageGroupId: integer("stage_group_id"),
    round: integer("round").notNull(),
    matchNumber: integer("match_number").notNull(),
    player1Id: integer("player1_id"),
    player2Id: integer("player2_id"),
    score1: integer("score1"),
    score2: integer("score2"),
    winnerId: integer("winner_id"),
    bestOf: integer("best_of").notNull().default(1),
    resultType: matchResultTypeEnum("result_type"),
    resultReason: text("result_reason"),
    note: text("note"),
    status: matchStatusEnum("status").notNull().default("pending"),
    nextMatchId: integer("next_match_id"),
    sortOrder: integer("sort_order"),
    scheduledAt: timestamp("scheduled_at"),
    completedAt: timestamp("completed_at"),
    /** Stable Tournament Engine V2 logical match key for canonical routed matches. */
    routingMatchKey: text("routing_match_key"),
  },
  (table) => [
    unique("matches_stage_round_number_unique").on(
      table.stageId,
      table.round,
      table.matchNumber,
    ),
    unique("matches_id_stage_id_unique").on(table.id, table.stageId),
    unique("matches_tournament_stage_id_id_unique").on(
      table.tournamentId,
      table.stageId,
      table.id,
    ),
    unique("matches_stage_routing_match_key_unique").on(
      table.stageId,
      table.routingMatchKey,
    ),
    index("matches_tournament_status_idx").on(table.tournamentId, table.status),
    foreignKey({
      columns: [table.tournamentId, table.stageId],
      foreignColumns: [tournamentStagesTable.tournamentId, tournamentStagesTable.id],
      name: "matches_stage_same_tournament_fk",
    }),
    foreignKey({
      columns: [table.stageId, table.stageGroupId],
      foreignColumns: [stageGroupsTable.stageId, stageGroupsTable.id],
      name: "matches_group_same_stage_fk",
    }),
    foreignKey({
      columns: [table.stageId, table.player1Id],
      foreignColumns: [stageParticipantsTable.stageId, stageParticipantsTable.playerId],
      name: "matches_player1_same_stage_fk",
    }),
    foreignKey({
      columns: [table.stageId, table.player2Id],
      foreignColumns: [stageParticipantsTable.stageId, stageParticipantsTable.playerId],
      name: "matches_player2_same_stage_fk",
    }),
    foreignKey({
      columns: [table.stageId, table.winnerId],
      foreignColumns: [stageParticipantsTable.stageId, stageParticipantsTable.playerId],
      name: "matches_winner_same_stage_fk",
    }),
    foreignKey({
      columns: [table.tournamentId, table.player1Id],
      foreignColumns: [playersTable.tournamentId, playersTable.id],
      name: "matches_player1_same_tournament_fk",
    }),
    foreignKey({
      columns: [table.tournamentId, table.player2Id],
      foreignColumns: [playersTable.tournamentId, playersTable.id],
      name: "matches_player2_same_tournament_fk",
    }),
    foreignKey({
      columns: [table.tournamentId, table.winnerId],
      foreignColumns: [playersTable.tournamentId, playersTable.id],
      name: "matches_winner_same_tournament_fk",
    }),
    foreignKey({
      columns: [table.nextMatchId, table.stageId],
      foreignColumns: [table.id, table.stageId],
      name: "matches_next_match_same_stage_fk",
    }).onDelete("no action"),
    check("matches_round_positive", sql`${table.round} > 0`),
    check("matches_number_positive", sql`${table.matchNumber} > 0`),
    check("matches_best_of_positive_odd", sql`${table.bestOf} > 0 AND ${table.bestOf} % 2 = 1`),
    check("matches_score1_nonnegative", sql`${table.score1} IS NULL OR ${table.score1} >= 0`),
    check("matches_score2_nonnegative", sql`${table.score2} IS NULL OR ${table.score2} >= 0`),
    check(
      "matches_winner_is_participant",
      sql`${table.winnerId} IS NULL OR ${table.winnerId} = ${table.player1Id} OR ${table.winnerId} = ${table.player2Id}`,
    ),
    check(
      "matches_lifecycle_result_consistency",
      sql`(
          ${table.status} = 'completed'
          AND ${table.resultType} IS NOT NULL
          AND ${table.completedAt} IS NOT NULL
        ) OR (
          ${table.status} <> 'completed'
          AND ${table.resultType} IS NULL
          AND ${table.resultReason} IS NULL
          AND ${table.winnerId} IS NULL
          AND ${table.score1} IS NULL
          AND ${table.score2} IS NULL
          AND ${table.completedAt} IS NULL
        )`,
    ),
    check(
      "matches_result_shape",
      sql`${table.resultType} IS NULL OR
        (${table.resultType} = 'played'
          AND ${table.player1Id} IS NOT NULL AND ${table.player2Id} IS NOT NULL
          AND ${table.player1Id} <> ${table.player2Id}
          AND ${table.score1} IS NOT NULL AND ${table.score2} IS NOT NULL
          AND ${table.winnerId} IS NOT NULL
          AND ${table.resultReason} IS NULL)
        OR (${table.resultType} = 'walkover'
          AND ${table.player1Id} IS NOT NULL AND ${table.player2Id} IS NOT NULL
          AND ${table.player1Id} <> ${table.player2Id}
          AND ${table.score1} IS NULL AND ${table.score2} IS NULL
          AND ${table.winnerId} IS NOT NULL)
        OR (${table.resultType} = 'bye'
          AND ${table.player1Id} IS NOT NULL AND ${table.player2Id} IS NULL
          AND ${table.score1} IS NULL AND ${table.score2} IS NULL
          AND ${table.winnerId} = ${table.player1Id}
          AND ${table.resultReason} = 'system_bye')
        OR (${table.resultType} = 'no_contest'
          AND ${table.player1Id} IS NOT NULL AND ${table.player2Id} IS NOT NULL
          AND ${table.player1Id} <> ${table.player2Id}
          AND ${table.score1} IS NULL AND ${table.score2} IS NULL
          AND ${table.winnerId} IS NULL)`,
    ),
  ],
);

export const resultHistoryTable = pgTable(
  "result_history",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matchesTable.id, { onDelete: "cascade" }),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    stageId: integer("stage_id").notNull().$defaultFn(() => 0),
    revision: integer("revision").notNull(),
    round: integer("round").notNull(),
    matchNumber: integer("match_number").notNull(),
    player1Id: integer("player1_id"),
    player2Id: integer("player2_id"),
    score1: integer("score1"),
    score2: integer("score2"),
    winnerId: integer("winner_id"),
    bestOf: integer("best_of").notNull(),
    resultType: matchResultTypeEnum("result_type").notNull(),
    resultReason: text("result_reason"),
    completedAt: timestamp("completed_at").notNull(),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("result_history_match_revision_unique").on(table.matchId, table.revision),
    index("result_history_tournament_recorded_idx").on(table.tournamentId, table.recordedAt),
    foreignKey({
      columns: [table.matchId, table.stageId],
      foreignColumns: [matchesTable.id, matchesTable.stageId],
      name: "result_history_match_same_stage_fk",
    }),
    foreignKey({
      columns: [table.tournamentId, table.stageId, table.matchId],
      foreignColumns: [matchesTable.tournamentId, matchesTable.stageId, matchesTable.id],
      name: "result_history_match_same_tournament_stage_fk",
    }).onDelete("cascade"),
    check("result_history_revision_positive", sql`${table.revision} > 0`),
    check("result_history_best_of_positive_odd", sql`${table.bestOf} > 0 AND ${table.bestOf} % 2 = 1`),
    check("result_history_score1_nonnegative", sql`${table.score1} IS NULL OR ${table.score1} >= 0`),
    check("result_history_score2_nonnegative", sql`${table.score2} IS NULL OR ${table.score2} >= 0`),
  ],
);

export const actionLogTable = pgTable(
  "action_log",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    description: text("description").notNull(),
    matchId: integer("match_id").references(() => matchesTable.id, { onDelete: "set null" }),
    stageId: integer("stage_id").references(() => tournamentStagesTable.id, { onDelete: "set null" }),
    undoPayload: text("undo_payload"),
    isUndone: boolean("is_undone").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // PostgreSQL supports a column list for SET NULL. Drizzle's public action
    // union does not type that PostgreSQL extension yet, while Drizzle Kit
    // serializes the complete action string. Keep the narrow cast here so the
    // authoritative export matches migration 0009 exactly; integration tests
    // assert that tournament_id is never nulled.
    foreignKey({
      columns: [table.tournamentId, table.stageId],
      foreignColumns: [tournamentStagesTable.tournamentId, tournamentStagesTable.id],
      name: "action_log_stage_same_tournament_fk",
    }).onDelete("set null (stage_id)" as "set null"),
    foreignKey({
      columns: [table.tournamentId, table.stageId, table.matchId],
      foreignColumns: [matchesTable.tournamentId, matchesTable.stageId, matchesTable.id],
      name: "action_log_match_same_tournament_stage_fk",
    }).onDelete("set null (stage_id, match_id)" as "set null"),
    check(
      "action_log_match_requires_stage",
      sql`${table.matchId} IS NULL OR ${table.stageId} IS NOT NULL`,
    ),
  ],
);

export const supportSessionsTable = pgTable("support_sessions", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournamentsTable.id, { onDelete: "cascade" }),
  nick: text("nick").notNull(),
  sessionToken: text("session_token").notNull(),
  passwordVersion: integer("password_version").notNull().default(1),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const authAuditLogTable = pgTable("auth_audit_log", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournamentsTable.id, { onDelete: "cascade" }),
  actorType: text("actor_type").notNull(),
  actorNick: text("actor_nick").notNull(),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const authCredentialRateLimitsTable = pgTable(
  "auth_credential_rate_limits",
  {
    scopeType: text("scope_type").notNull(),
    tournamentId: integer("tournament_id").notNull(),
    credentialType: text("credential_type").notNull(),
    sourceFingerprint: text("source_fingerprint").notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    failureCount: integer("failure_count").notNull().default(0),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "auth_credential_rate_limits_scope_pk",
      columns: [
        table.scopeType,
        table.tournamentId,
        table.credentialType,
        table.sourceFingerprint,
      ],
    }),
    check(
      "auth_credential_rate_limits_scope_type_check",
      sql`${table.scopeType} IN ('tournament', 'source')`,
    ),
    check(
      "auth_credential_rate_limits_credential_type_check",
      sql`${table.credentialType} IN ('organizer', 'viewer', 'support', 'legacy_upgrade')`,
    ),
    check(
      "auth_credential_rate_limits_tournament_id_check",
      sql`${table.tournamentId} > 0`,
    ),
    check(
      "auth_credential_rate_limits_failure_count_check",
      sql`${table.failureCount} >= 0`,
    ),
    check(
      "auth_credential_rate_limits_source_fingerprint_check",
      sql`length(${table.sourceFingerprint}) BETWEEN 1 AND 128`,
    ),
    index("auth_credential_rate_limits_cleanup_idx").on(table.lastUpdatedAt),
    index("auth_credential_rate_limits_blocked_idx").on(table.blockedUntil),
  ],
);

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({ id: true, createdAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

export const insertTournamentStageSchema = createInsertSchema(tournamentStagesTable).omit({ id: true, createdAt: true });
export type InsertTournamentStage = z.infer<typeof insertTournamentStageSchema>;
export type TournamentStage = typeof tournamentStagesTable.$inferSelect;

export const insertStageParticipantSchema = createInsertSchema(stageParticipantsTable).omit({ id: true, createdAt: true });
export type InsertStageParticipant = z.infer<typeof insertStageParticipantSchema>;
export type StageParticipant = typeof stageParticipantsTable.$inferSelect;

export const insertStageGroupSchema = createInsertSchema(stageGroupsTable).omit({ id: true, createdAt: true });
export type InsertStageGroup = z.infer<typeof insertStageGroupSchema>;
export type StageGroup = typeof stageGroupsTable.$inferSelect;

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

export const insertResultHistorySchema = createInsertSchema(resultHistoryTable).omit({ id: true, recordedAt: true });
export type InsertResultHistory = z.infer<typeof insertResultHistorySchema>;
export type ResultHistory = typeof resultHistoryTable.$inferSelect;

export type ActionLog = typeof actionLogTable.$inferSelect;
export type SupportSession = typeof supportSessionsTable.$inferSelect;
export type AuthAuditLog = typeof authAuditLogTable.$inferSelect;
export type AuthCredentialRateLimit =
  typeof authCredentialRateLimitsTable.$inferSelect;
export type AppSchemaMigration =
  typeof appSchemaMigrationsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Deadlock: player bans & per-game picks
// ---------------------------------------------------------------------------

/** Up to 5 banned Deadlock heroes per player for the duration of the tournament. */
export const playerDeadlockBansTable = pgTable(
  "player_deadlock_bans",
  {
    playerId: integer("player_id")
      .primaryKey()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    bannedHeroIds: text("banned_hero_ids").array().notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("player_deadlock_bans_tournament_idx").on(table.tournamentId),
  ],
);

/** Hero picks per game inside a BO match series (game 1, 2 … 5). */
export const matchGamePicksTable = pgTable(
  "match_game_picks",
  {
    matchId: integer("match_id")
      .notNull()
      .references(() => matchesTable.id, { onDelete: "cascade" }),
    gameNumber: integer("game_number").notNull(),
    player1HeroId: text("player1_hero_id"),
    player2HeroId: text("player2_hero_id"),
    player1Side: text("player1_side"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.gameNumber] }),
    check(
      "match_game_picks_game_number_check",
      sql`${table.gameNumber} >= 1 AND ${table.gameNumber} <= 5`,
    ),
    check(
      "match_game_picks_player1_side_check",
      sql`${table.player1Side} IS NULL OR ${table.player1Side} IN ('archmother', 'hidden_king')`,
    ),
  ],
);

export type PlayerDeadlockBans = typeof playerDeadlockBansTable.$inferSelect;
export type MatchGamePicks = typeof matchGamePicksTable.$inferSelect;
