import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentFormatEnum = pgEnum("tournament_format", [
  "single_elimination",
  "round_robin",
  "swiss",
]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "active",
  "completed",
]);

export const resultModelVersionEnum = pgEnum("result_model_version", ["series_v1"]);
export const rankingPolicyEnum = pgEnum("ranking_policy", ["match_record_v1"]);

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
    format: tournamentFormatEnum("format").notNull(),
    status: tournamentStatusEnum("status").notNull().default("draft"),
    maxPlayers: integer("max_players"),
    swissRounds: integer("swiss_rounds"),
    defaultBestOf: integer("default_best_of").notNull().default(1),
    currentRound: integer("current_round"),
    totalRounds: integer("total_rounds"),
    winnerId: integer("winner_id"),
    featuredMatchId: integer("featured_match_id"),
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

export const matchesTable = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
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
  },
  (table) => [
    uniqueIndex("matches_tournament_round_number_unique").on(
      table.tournamentId,
      table.round,
      table.matchNumber,
    ),
    index("matches_tournament_status_idx").on(table.tournamentId, table.status),
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
    check("result_history_revision_positive", sql`${table.revision} > 0`),
    check("result_history_best_of_positive_odd", sql`${table.bestOf} > 0 AND ${table.bestOf} % 2 = 1`),
    check("result_history_score1_nonnegative", sql`${table.score1} IS NULL OR ${table.score1} >= 0`),
    check("result_history_score2_nonnegative", sql`${table.score2} IS NULL OR ${table.score2} >= 0`),
  ],
);

export const actionLogTable = pgTable("action_log", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournamentsTable.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  description: text("description").notNull(),
  matchId: integer("match_id").references(() => matchesTable.id, { onDelete: "set null" }),
  undoPayload: text("undo_payload"),
  isUndone: boolean("is_undone").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({ id: true, createdAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

export const insertResultHistorySchema = createInsertSchema(resultHistoryTable).omit({ id: true, recordedAt: true });
export type InsertResultHistory = z.infer<typeof insertResultHistorySchema>;
export type ResultHistory = typeof resultHistoryTable.$inferSelect;

export type ActionLog = typeof actionLogTable.$inferSelect;
export type SupportSession = typeof supportSessionsTable.$inferSelect;
export type AuthAuditLog = typeof authAuditLogTable.$inferSelect;
