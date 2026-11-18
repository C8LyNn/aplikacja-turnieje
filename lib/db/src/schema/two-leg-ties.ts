import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, pgTable, serial, smallint, text, timestamp, unique } from "drizzle-orm/pg-core";
import { matchesTable } from "./tournaments";

/**
 * V5.10 (migration 0047): two-legged knockout ties. The tie is the bracket match row (its result is the aggregate);
 * these tables hold the two legs, the organizer's decision for a level aggregate, and the history of both.
 * Leg scores are from the tie's point of view: score1 = participant 1 (home in leg 1), score2 = participant 2.
 */
export const matchLegsTable = pgTable(
  "match_legs",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id").notNull(),
    stageId: integer("stage_id").notNull(),
    matchId: integer("match_id").notNull(),
    leg: smallint("leg").notNull(),
    status: text("status").$type<"pending" | "completed">().notNull().default("pending"),
    score1: integer("score1"),
    score2: integer("score2"),
    scheduledAt: timestamp("scheduled_at"),
    completedAt: timestamp("completed_at"),
    revision: integer("revision").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.tournamentId, table.stageId, table.matchId],
      foreignColumns: [matchesTable.tournamentId, matchesTable.stageId, matchesTable.id],
      name: "match_legs_match_fk",
    }).onDelete("cascade"),
    unique("match_legs_match_leg_unique").on(table.matchId, table.leg),
    check("match_legs_leg_supported", sql`${table.leg} IN (1, 2)`),
    check("match_legs_status_supported", sql`${table.status} IN ('pending', 'completed')`),
    check("match_legs_revision_positive", sql`${table.revision} > 0`),
    index("match_legs_stage_idx").on(table.stageId),
  ],
);

export const matchTieDecisionsTable = pgTable(
  "match_tie_decisions",
  {
    matchId: integer("match_id").primaryKey(),
    tournamentId: integer("tournament_id").notNull(),
    stageId: integer("stage_id").notNull(),
    winnerId: integer("winner_id").notNull(),
    reason: text("reason").notNull(),
    decidedAt: timestamp("decided_at").notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.tournamentId, table.stageId, table.matchId],
      foreignColumns: [matchesTable.tournamentId, matchesTable.stageId, matchesTable.id],
      name: "match_tie_decisions_match_fk",
    }).onDelete("cascade"),
  ],
);

export type MatchTieHistoryEvent = "leg_recorded" | "leg_reverted" | "decision_recorded" | "decision_reverted";

export const matchTieHistoryTable = pgTable(
  "match_tie_history",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id").notNull(),
    stageId: integer("stage_id").notNull(),
    matchId: integer("match_id").notNull(),
    event: text("event").$type<MatchTieHistoryEvent>().notNull(),
    leg: smallint("leg"),
    score1: integer("score1"),
    score2: integer("score2"),
    winnerId: integer("winner_id"),
    reason: text("reason"),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.tournamentId, table.stageId, table.matchId],
      foreignColumns: [matchesTable.tournamentId, matchesTable.stageId, matchesTable.id],
      name: "match_tie_history_match_fk",
    }).onDelete("cascade"),
    index("match_tie_history_match_idx").on(table.matchId, table.id),
  ],
);
