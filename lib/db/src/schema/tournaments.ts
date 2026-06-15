import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentFormatEnum = pgEnum("tournament_format", [
  "single_elimination",
  "double_elimination",
  "round_robin",
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
  "in_progress",
  "completed",
  "bye",
]);

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  format: tournamentFormatEnum("format").notNull(),
  status: tournamentStatusEnum("status").notNull().default("draft"),
  maxPlayers: integer("max_players"),
  currentRound: integer("current_round"),
  totalRounds: integer("total_rounds"),
  winnerId: integer("winner_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  seed: integer("seed"),
  status: playerStatusEnum("status").notNull().default("active"),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
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
  status: matchStatusEnum("status").notNull().default("pending"),
  nextMatchId: integer("next_match_id"),
  scheduledAt: timestamp("scheduled_at"),
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
