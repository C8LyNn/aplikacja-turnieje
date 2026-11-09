import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { matchesTable, tournamentsTable } from "./tournaments";

/** Pack 14: approvals are immutable; the execution receipt changes atomically with revertMatch(). */
export const tournamentCorrectionOperationsTable = pgTable("tournament_correction_operations", {
  id: text("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id, { onDelete: "cascade" }),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  expectedRevision: integer("expected_revision").notNull(),
  expectedCompletionActionId: integer("expected_completion_action_id").notNull(),
  expectedStageVersionVector: text("expected_stage_version_vector").notNull(),
  proposedScore1: integer("proposed_score1").notNull(),
  proposedScore2: integer("proposed_score2").notNull(),
  requestFingerprint: text("request_fingerprint").notNull(),
  approvedBy: text("approved_by").notNull().default("organizer"),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("approved"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  revertActionId: integer("revert_action_id"),
  revertedMatchRevision: integer("reverted_match_revision"),
  completionActionId: integer("completion_action_id"),
  correctedMatchRevision: integer("corrected_match_revision"),
}, (table) => [
  index("tournament_correction_operations_tournament_idx").on(table.tournamentId, table.matchId),
  check("tournament_correction_operations_id_format_check", sql`${table.id} ~* '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'`),
  check("tournament_correction_operations_approval_actor_check", sql`${table.approvedBy} = 'organizer'`),
  check("tournament_correction_operations_status_check", sql`${table.status} IN ('approved', 'reverted_requires_resubmission', 'corrected')`),
  check("tournament_correction_operations_receipt_consistency_check", sql`(
    ${table.status} = 'approved' AND ${table.completedAt} IS NULL AND ${table.revertActionId} IS NULL AND ${table.revertedMatchRevision} IS NULL
    AND ${table.completionActionId} IS NULL AND ${table.correctedMatchRevision} IS NULL
  ) OR (
    ${table.status} = 'reverted_requires_resubmission' AND ${table.completedAt} IS NOT NULL
    AND ${table.revertActionId} IS NOT NULL AND ${table.revertedMatchRevision} IS NOT NULL
    AND ${table.completionActionId} IS NULL AND ${table.correctedMatchRevision} IS NULL
  ) OR (
    ${table.status} = 'corrected' AND ${table.completedAt} IS NOT NULL
    AND ${table.revertActionId} IS NOT NULL AND ${table.revertedMatchRevision} IS NOT NULL
    AND ${table.completionActionId} IS NOT NULL AND ${table.correctedMatchRevision} IS NOT NULL
  )`),
  check("tournament_correction_operations_scores_check", sql`${table.proposedScore1} >= 0 AND ${table.proposedScore2} >= 0`),
  check("tournament_correction_operations_revision_check", sql`${table.expectedRevision} > 0 AND ${table.expectedCompletionActionId} > 0`),
]);
