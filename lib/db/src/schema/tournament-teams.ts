import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, pgTable, serial, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { playersTable, tournamentsTable } from "./tournaments";

/**
 * V5 · Stage D — a team linked 1:1 to its engine entry (the players row is the
 * team's participation in this tournament). Matches, standings and brackets keep
 * working on the entry; the roster and its history live here.
 */
export const tournamentTeamsTable = pgTable(
  "tournament_teams",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournamentsTable.id, { onDelete: "cascade" }),
    playerId: integer("player_id").notNull(),
    shortCode: text("short_code"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("tournament_teams_player_unique").on(table.playerId),
    foreignKey({
      name: "tournament_teams_entry_same_tournament_fk",
      columns: [table.tournamentId, table.playerId],
      foreignColumns: [playersTable.tournamentId, playersTable.id],
    }).onDelete("cascade"),
    check("tournament_teams_short_code_format", sql`${table.shortCode} IS NULL OR ${table.shortCode} ~ '^[A-Za-z0-9]{2,6}$'`),
  ],
);

export const TEAM_MEMBER_ROLES = ["captain", "player", "reserve"] as const;
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

/** One row per membership period; changes close the old row instead of overwriting it. */
export const teamMembersTable = pgTable(
  "team_members",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => tournamentTeamsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role").$type<TeamMemberRole>().notNull().default("player"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    leftAt: timestamp("left_at"),
    leftReason: text("left_reason").$type<"removed" | "role_change">(),
  },
  (table) => [
    check("team_members_name_length", sql`char_length(btrim(${table.name})) BETWEEN 1 AND 100`),
    check("team_members_role_supported", sql`${table.role} IN ('captain', 'player', 'reserve')`),
    check("team_members_left_after_join", sql`${table.leftAt} IS NULL OR ${table.leftAt} >= ${table.joinedAt}`),
    check("team_members_left_reason_shape", sql`(${table.leftAt} IS NULL AND ${table.leftReason} IS NULL) OR (${table.leftAt} IS NOT NULL AND ${table.leftReason} IN ('removed', 'role_change'))`),
    uniqueIndex("team_members_one_active_captain").on(table.teamId).where(sql`${table.role} = 'captain' AND ${table.leftAt} IS NULL`),
    uniqueIndex("team_members_active_name_unique").on(table.teamId, sql`lower(btrim(${table.name}))`).where(sql`${table.leftAt} IS NULL`),
    index("team_members_team_idx").on(table.teamId),
  ],
);
