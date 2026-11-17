import { asc, eq, inArray } from "drizzle-orm";
import { teamMembersTable, tournamentTeamsTable, tournamentsTable } from "@workspace/db/schema";
import type { TournamentBackupV3 } from "@workspace/api-zod";
import { TEAM_MEMBER_NAME_MAX, validateRosterSettings } from "../../domain/tournament/team-rosters";

/**
 * V5.1 — team rosters in Backup V3 (section `teamRosters`, format 1).
 *
 * Teams are stored as their own rows linked 1:1 to the engine entry (players row),
 * so a backup that only carries entries would silently turn a team tournament into
 * an individual one and lose every roster, captain, reserve and roster change. The
 * section is written only for team tournaments, which keeps backups of individual
 * tournaments byte-for-byte compatible with V5. The OpenAPI schema is strict, so an
 * importer that predates this section rejects the backup instead of dropping data.
 */
export const TEAM_ROSTERS_FORMAT_VERSION = 1 as const;

type Backup = TournamentBackupV3;
type TeamRostersSection = NonNullable<Backup["teamRosters"]>;
type Tournament = typeof tournamentsTable.$inferSelect;
type Executor = Pick<typeof import("@workspace/db")["db"], "select">;
type Tx = Parameters<Parameters<typeof import("@workspace/db")["db"]["transaction"]>[0]>[0];

const SHORT_CODE = /^[A-Za-z0-9]{2,6}$/;
const iso = (value: Date | null): string | null => (value == null ? null : value.toISOString());
const validDate = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(Date.parse(value));
const positive = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

export function tournamentTeamFields(tournament: Tournament): Partial<Backup["tournament"]> {
  if (tournament.participantType !== "teams") return {};
  return {
    participantType: "teams",
    teamRosterMin: tournament.teamRosterMin ?? null,
    teamRosterMax: tournament.teamRosterMax ?? null,
  };
}

export async function exportTeamRosters(executor: Executor, tournament: Tournament): Promise<Pick<Backup, "teamRosters">> {
  if (tournament.participantType !== "teams") return {};
  const teams = await executor
    .select()
    .from(tournamentTeamsTable)
    .where(eq(tournamentTeamsTable.tournamentId, tournament.id))
    .orderBy(asc(tournamentTeamsTable.id));
  const members = teams.length === 0
    ? []
    : await executor
        .select()
        .from(teamMembersTable)
        .where(inArray(teamMembersTable.teamId, teams.map((team) => team.id)))
        .orderBy(asc(teamMembersTable.id));
  return {
    teamRosters: {
      formatVersion: TEAM_ROSTERS_FORMAT_VERSION,
      teams: teams.map((team) => ({
        backupId: team.id,
        playerBackupId: team.playerId,
        shortCode: team.shortCode ?? null,
        createdAt: team.createdAt.toISOString(),
        members: members
          .filter((member) => member.teamId === team.id)
          .map((member) => ({
            backupId: member.id,
            name: member.name,
            role: member.role,
            joinedAt: member.joinedAt.toISOString(),
            leftAt: iso(member.leftAt),
            leftReason: member.leftReason ?? null,
          })),
      })),
    },
  };
}

/** Semantic checks; every database constraint of 0042 is mirrored so restore never fails half-way. */
export function validateTeamRosters(backup: Backup, playerIds: ReadonlySet<number>, errors: string[]): void {
  const type = backup.tournament.participantType ?? "players";
  const section = backup.teamRosters as TeamRostersSection | undefined;
  const settings = validateRosterSettings(type, backup.tournament.teamRosterMin ?? null, backup.tournament.teamRosterMax ?? null);
  if (!settings.ok) errors.push(`Team roster settings are invalid: ${settings.message}`);
  if (type !== "teams") {
    if (section !== undefined) errors.push("teamRosters is allowed only when tournament.participantType is \"teams\".");
    return;
  }
  if (section === undefined) {
    errors.push("A team tournament backup must contain teamRosters; restoring it without rosters would lose data.");
    return;
  }
  if (section.formatVersion !== TEAM_ROSTERS_FORMAT_VERSION) {
    errors.push(`teamRosters.formatVersion ${String(section.formatVersion)} is not supported (expected ${TEAM_ROSTERS_FORMAT_VERSION}).`);
    return;
  }
  const teamIds = new Set<number>();
  const entryIds = new Set<number>();
  const memberIds = new Set<number>();
  for (const [teamIndex, team] of section.teams.entries()) {
    const at = `teamRosters.teams[${teamIndex}]`;
    if (!positive(team.backupId) || teamIds.has(team.backupId)) errors.push(`${at} has invalid or duplicate backupId.`);
    teamIds.add(team.backupId);
    if (!playerIds.has(team.playerBackupId)) errors.push(`${at} references an unknown entry ${team.playerBackupId}.`);
    if (entryIds.has(team.playerBackupId)) errors.push(`${at} reuses entry ${team.playerBackupId}; one team per entry.`);
    entryIds.add(team.playerBackupId);
    if (team.shortCode != null && !SHORT_CODE.test(team.shortCode)) errors.push(`${at}.shortCode must be 2–6 letters or digits.`);
    if (!validDate(team.createdAt)) errors.push(`${at}.createdAt is not a date.`);
    let activeCaptains = 0;
    const activeNames = new Set<string>();
    for (const [memberIndex, member] of team.members.entries()) {
      const where = `${at}.members[${memberIndex}]`;
      if (!positive(member.backupId) || memberIds.has(member.backupId)) errors.push(`${where} has invalid or duplicate backupId.`);
      memberIds.add(member.backupId);
      const name = typeof member.name === "string" ? member.name.trim() : "";
      if (name.length < 1 || name.length > TEAM_MEMBER_NAME_MAX) errors.push(`${where}.name must have 1–${TEAM_MEMBER_NAME_MAX} characters.`);
      if (!["captain", "player", "reserve"].includes(member.role)) errors.push(`${where}.role is not supported.`);
      if (!validDate(member.joinedAt)) errors.push(`${where}.joinedAt is not a date.`);
      if (member.leftAt == null) {
        if (member.leftReason != null) errors.push(`${where}.leftReason requires leftAt.`);
        if (member.role === "captain") activeCaptains += 1;
        const key = name.toLowerCase();
        if (activeNames.has(key)) errors.push(`${where} duplicates an active member name.`);
        activeNames.add(key);
      } else {
        if (!validDate(member.leftAt)) errors.push(`${where}.leftAt is not a date.`);
        else if (validDate(member.joinedAt) && Date.parse(member.leftAt) < Date.parse(member.joinedAt)) errors.push(`${where} left before joining.`);
        if (member.leftReason !== "removed" && member.leftReason !== "role_change") errors.push(`${where}.leftReason must be removed or role_change.`);
      }
    }
    if (activeCaptains > 1) errors.push(`${at} has more than one active captain.`);
  }
}

/** Runs inside the import transaction, after entries were restored. */
export async function restoreTeamRosters(
  tx: Tx,
  backup: Backup,
  tournamentId: number,
  playerIds: ReadonlyMap<number, number>,
): Promise<{ teams: number; members: number }> {
  const section = backup.teamRosters as TeamRostersSection | undefined;
  if (backup.tournament.participantType !== "teams" || !section) return { teams: 0, members: 0 };
  let memberCount = 0;
  // Insert in backup order so restored ids keep the original chronological order.
  for (const team of [...section.teams].sort((left, right) => left.backupId - right.backupId)) {
    const playerId = playerIds.get(team.playerBackupId);
    if (playerId === undefined) throw new Error("TEAM_ROSTER_ENTRY_NOT_RESTORED");
    const [created] = await tx
      .insert(tournamentTeamsTable)
      .values({ tournamentId, playerId, shortCode: team.shortCode ?? null, createdAt: new Date(team.createdAt) })
      .returning({ id: tournamentTeamsTable.id });
    const members = [...team.members].sort((left, right) => left.backupId - right.backupId);
    if (members.length > 0) {
      await tx.insert(teamMembersTable).values(members.map((member) => ({
        teamId: created.id,
        name: member.name.trim(),
        role: member.role,
        joinedAt: new Date(member.joinedAt),
        leftAt: member.leftAt == null ? null : new Date(member.leftAt),
        leftReason: member.leftReason ?? null,
      })));
      memberCount += members.length;
    }
  }
  return { teams: section.teams.length, members: memberCount };
}
