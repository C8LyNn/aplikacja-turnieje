import { pgTable, serial, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentFormatEnum = pgEnum("tournament_format", [
  "single_elimination",
  "double_elimination",
  "round_robin",
  "swiss",
]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "active",
  "completed",
]);

export const playerStatusEnum = pgEnum("player_status", [
  "active",
  "eliminated",
  "winner",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "ready",
  "in_progress",
  "completed",
  "bye",
  "walkover",
  "postponed",
  "cancelled",
]);

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  format: tournamentFormatEnum("format").notNull(),
  status: tournamentStatusEnum("status").notNull().default("draft"),
  maxPlayers: integer("max_players"),
  swissRounds: integer("swiss_rounds"),
  allowDraws: boolean("allow_draws").default(false),
  defaultBestOf: integer("default_best_of").default(1),
  currentRound: integer("current_round"),
  totalRounds: integer("total_rounds"),
  winnerId: integer("winner_id"),
  featuredMatchId: integer("featured_match_id"),
  hostCode: text("host_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rank: text("rank"),
  country: text("country"),
  teamName: text("team_name"),
  seed: integer("seed"),
  status: playerStatusEnum("status").notNull().default("active"),
  wins: integer("wins").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  player1Id: integer("player1_id").references(() => playersTable.id),
  player2Id: integer("player2_id").references(() => playersTable.id),
  score1: integer("score1"),
  score2: integer("score2"),
  winnerId: integer("winner_id").references(() => playersTable.id),
  isDraw: boolean("is_draw").default(false),
  bestOf: integer("best_of").default(1),
  note: text("note"),
  status: matchStatusEnum("status").notNull().default("pending"),
  nextMatchId: integer("next_match_id"),
  sortOrder: integer("sort_order"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
});

export const resultHistoryTable = pgTable("result_history", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  player1Id: integer("player1_id"),
  player2Id: integer("player2_id"),
  score1: integer("score1"),
  score2: integer("score2"),
  winnerId: integer("winner_id"),
  isDraw: boolean("is_draw").default(false),
  status: text("status").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
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

export const insertResultHistorySchema = createInsertSchema(resultHistoryTable).omit({ id: true, completedAt: true });
export type InsertResultHistory = z.infer<typeof insertResultHistorySchema>;
export type ResultHistory = typeof resultHistoryTable.$inferSelect;

export const actionLogTable = pgTable("action_log", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  description: text("description").notNull(),
  matchId: integer("match_id"),
  undoPayload: text("undo_payload"),
  isUndone: boolean("is_undone").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ActionLog = typeof actionLogTable.$inferSelect;
