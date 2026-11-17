import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, playersTable, teamMembersTable, tournamentTeamsTable, tournamentsTable } from "@workspace/db";
import {
  TEAM_ROLE_LABELS,
  canAddMember,
  isTeamRole,
  normaliseMemberName,
  rosterIssues,
  rosterReady,
  starterCount,
  validateRosterSettings,
  type RosterIssue,
  type RosterSettings,
  type TeamRole,
} from "../../domain/tournament/team-rosters";

export class TeamRosterError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "TeamRosterError";
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

export interface TeamMemberView {
  id: number;
  name: string;
  role: TeamRole;
  roleLabel: string;
  joinedAt: string;
}

export interface TeamSummary {
  entryId: number;
  teamId: number | null;
  name: string;
  seed: number | null;
  entryStatus: string;
  shortCode: string | null;
  members: TeamMemberView[];
  starters: number;
  formerMemberCount: number;
  ready: boolean;
  issues: RosterIssue[];
}

export interface TeamsOverview {
  tournamentId: number;
  participantType: "players" | "teams";
  rosterMin: number | null;
  rosterMax: number | null;
  teams: TeamSummary[];
  readyCount: number;
}

function settingsOf(tournament: typeof tournamentsTable.$inferSelect): RosterSettings {
  return {
    participantType: tournament.participantType === "teams" ? "teams" : "players",
    rosterMin: tournament.teamRosterMin ?? null,
    rosterMax: tournament.teamRosterMax ?? null,
  };
}

async function loadTournament(executor: Executor, tournamentId: number, lock = false) {
  const query = executor.select().from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId));
  const [tournament] = lock ? await query.for("update") : await query;
  if (!tournament) throw new TeamRosterError("TOURNAMENT_NOT_FOUND", 404, "Nie znaleziono turnieju.");
  return tournament;
}

function requireTeamMode(tournament: typeof tournamentsTable.$inferSelect): void {
  if (tournament.participantType !== "teams") {
    throw new TeamRosterError("TEAM_MODE_REQUIRED", 409, "Składy drużyn są dostępne tylko w turniejach drużynowych.");
  }
}

function memberView(row: typeof teamMembersTable.$inferSelect): TeamMemberView {
  return { id: row.id, name: row.name, role: row.role, roleLabel: TEAM_ROLE_LABELS[row.role], joinedAt: row.joinedAt.toISOString() };
}

const ROLE_ORDER: Record<TeamRole, number> = { captain: 0, player: 1, reserve: 2 };

async function summaries(executor: Executor, tournament: typeof tournamentsTable.$inferSelect, entryIds?: number[]): Promise<TeamSummary[]> {
  const settings = settingsOf(tournament);
  const entries = await executor.select().from(playersTable)
    .where(entryIds ? and(eq(playersTable.tournamentId, tournament.id), inArray(playersTable.id, entryIds)) : eq(playersTable.tournamentId, tournament.id))
    .orderBy(sql`${playersTable.seed} NULLS LAST`, asc(playersTable.id));
  if (entries.length === 0) return [];
  const teams = await executor.select().from(tournamentTeamsTable)
    .where(and(eq(tournamentTeamsTable.tournamentId, tournament.id), inArray(tournamentTeamsTable.playerId, entries.map((entry) => entry.id))));
  const teamByEntry = new Map(teams.map((team) => [team.playerId, team]));
  const members = teams.length === 0 ? [] : await executor.select().from(teamMembersTable)
    .where(inArray(teamMembersTable.teamId, teams.map((team) => team.id)))
    .orderBy(asc(teamMembersTable.joinedAt), asc(teamMembersTable.id));
  return entries.map((entry) => {
    const team = teamByEntry.get(entry.id) ?? null;
    const own = team ? members.filter((member) => member.teamId === team.id) : [];
    const active = own.filter((member) => member.leftAt === null)
      .sort((left, right) => ROLE_ORDER[left.role] - ROLE_ORDER[right.role] || left.name.localeCompare(right.name, "pl") || left.id - right.id);
    const activeNames = new Set(active.map((member) => member.name.toLowerCase()));
    const former = new Set(own.filter((member) => member.leftAt !== null && !activeNames.has(member.name.toLowerCase())).map((member) => member.name.toLowerCase()));
    return {
      entryId: entry.id,
      teamId: team?.id ?? null,
      name: entry.name,
      seed: entry.seed ?? null,
      entryStatus: entry.status,
      shortCode: team?.shortCode ?? null,
      members: active.map(memberView),
      starters: starterCount(active),
      formerMemberCount: former.size,
      ready: rosterReady(active, settings),
      issues: rosterIssues(active, settings),
    };
  });
}

export async function getTeamsOverview(tournamentId: number): Promise<TeamsOverview> {
  const tournament = await loadTournament(db, tournamentId);
  const settings = settingsOf(tournament);
  const teams = settings.participantType === "teams" ? await summaries(db, tournament) : [];
  return { tournamentId, ...settings, teams, readyCount: teams.filter((team) => team.ready).length };
}

async function ensureTeam(tx: Tx, tournament: typeof tournamentsTable.$inferSelect, entryId: number) {
  const [entry] = await tx.select().from(playersTable)
    .where(and(eq(playersTable.id, entryId), eq(playersTable.tournamentId, tournament.id)));
  if (!entry) throw new TeamRosterError("TEAM_NOT_FOUND", 404, "Nie znaleziono drużyny w tym turnieju.");
  await tx.insert(tournamentTeamsTable).values({ tournamentId: tournament.id, playerId: entryId }).onConflictDoNothing();
  const [team] = await tx.select().from(tournamentTeamsTable).where(eq(tournamentTeamsTable.playerId, entryId)).for("update");
  return team;
}

async function activeMembers(tx: Tx, teamId: number) {
  return tx.select().from(teamMembersTable)
    .where(and(eq(teamMembersTable.teamId, teamId), isNull(teamMembersTable.leftAt)))
    .orderBy(asc(teamMembersTable.id));
}

/** Closes a membership period and opens a new one with another role (history is kept). */
async function reassignRole(tx: Tx, member: typeof teamMembersTable.$inferSelect, role: TeamRole) {
  await tx.update(teamMembersTable).set({ leftAt: sql`now()`, leftReason: "role_change" }).where(eq(teamMembersTable.id, member.id));
  const [created] = await tx.insert(teamMembersTable).values({ teamId: member.teamId, name: member.name, role }).returning();
  return created;
}

async function demoteCaptain(tx: Tx, teamId: number, exceptId?: number) {
  const current = (await activeMembers(tx, teamId)).find((member) => member.role === "captain" && member.id !== exceptId);
  if (current) await reassignRole(tx, current, "player");
}

async function summaryOf(tx: Tx, tournament: typeof tournamentsTable.$inferSelect, entryId: number): Promise<TeamSummary> {
  const [summary] = await summaries(tx, tournament, [entryId]);
  return summary;
}

export async function addTeamMember(tournamentId: number, entryId: number, input: unknown): Promise<TeamSummary> {
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "name" && key !== "role")) {
    throw new TeamRosterError("INVALID_MEMBER", 400, "Oczekiwano { name, role }.");
  }
  const name = normaliseMemberName(body.name);
  if (!name.ok) throw new TeamRosterError("INVALID_MEMBER", 422, name.message);
  const role = body.role ?? "player";
  if (!isTeamRole(role)) throw new TeamRosterError("INVALID_MEMBER", 422, "Rola: captain, player albo reserve.");
  return db.transaction(async (tx) => {
    const tournament = await loadTournament(tx, tournamentId, true);
    requireTeamMode(tournament);
    const team = await ensureTeam(tx, tournament, entryId);
    const active = await activeMembers(tx, team.id);
    if (active.some((member) => member.name.toLowerCase() === name.name.toLowerCase())) {
      throw new TeamRosterError("MEMBER_DUPLICATE", 409, `${name.name} już jest w składzie.`);
    }
    if (!canAddMember(active.length, settingsOf(tournament))) {
      throw new TeamRosterError("ROSTER_FULL", 409, `Skład jest pełny (maks. ${tournament.teamRosterMax}).`);
    }
    if (role === "captain") await demoteCaptain(tx, team.id);
    await tx.insert(teamMembersTable).values({ teamId: team.id, name: name.name, role });
    return summaryOf(tx, tournament, entryId);
  });
}

async function loadMember(tx: Tx, tournament: typeof tournamentsTable.$inferSelect, entryId: number, memberId: number) {
  const team = await ensureTeam(tx, tournament, entryId);
  const [member] = await tx.select().from(teamMembersTable)
    .where(and(eq(teamMembersTable.id, memberId), eq(teamMembersTable.teamId, team.id), isNull(teamMembersTable.leftAt)))
    .for("update");
  if (!member) throw new TeamRosterError("MEMBER_NOT_FOUND", 404, "Ten zawodnik nie jest już w składzie.");
  return member;
}

export async function changeTeamMemberRole(tournamentId: number, entryId: number, memberId: number, input: unknown): Promise<TeamSummary> {
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "role")) {
    throw new TeamRosterError("INVALID_MEMBER", 400, "Oczekiwano { role }.");
  }
  if (!isTeamRole(body.role)) throw new TeamRosterError("INVALID_MEMBER", 422, "Rola: captain, player albo reserve.");
  const role = body.role;
  return db.transaction(async (tx) => {
    const tournament = await loadTournament(tx, tournamentId, true);
    requireTeamMode(tournament);
    const member = await loadMember(tx, tournament, entryId, memberId);
    if (member.role !== role) {
      if (role === "captain") await demoteCaptain(tx, member.teamId, member.id);
      await reassignRole(tx, member, role);
    }
    return summaryOf(tx, tournament, entryId);
  });
}

export async function removeTeamMember(tournamentId: number, entryId: number, memberId: number): Promise<TeamSummary> {
  return db.transaction(async (tx) => {
    const tournament = await loadTournament(tx, tournamentId, true);
    requireTeamMode(tournament);
    const member = await loadMember(tx, tournament, entryId, memberId);
    await tx.update(teamMembersTable).set({ leftAt: sql`now()`, leftReason: "removed" }).where(eq(teamMembersTable.id, member.id));
    return summaryOf(tx, tournament, entryId);
  });
}

export async function updateTeamDetails(tournamentId: number, entryId: number, input: unknown): Promise<TeamSummary> {
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "shortCode")) {
    throw new TeamRosterError("INVALID_TEAM", 400, "Oczekiwano { shortCode }.");
  }
  const shortCode = body.shortCode === null || body.shortCode === "" ? null : body.shortCode;
  if (shortCode !== null && (typeof shortCode !== "string" || !/^[A-Za-z0-9]{2,6}$/.test(shortCode))) {
    throw new TeamRosterError("INVALID_TEAM", 422, "Skrót drużyny: 2–6 liter lub cyfr.");
  }
  return db.transaction(async (tx) => {
    const tournament = await loadTournament(tx, tournamentId, true);
    requireTeamMode(tournament);
    const team = await ensureTeam(tx, tournament, entryId);
    await tx.update(tournamentTeamsTable).set({ shortCode: shortCode === null ? null : String(shortCode).toUpperCase() }).where(eq(tournamentTeamsTable.id, team.id));
    return summaryOf(tx, tournament, entryId);
  });
}

export async function getTeamHistory(tournamentId: number, entryId: number) {
  const tournament = await loadTournament(db, tournamentId);
  requireTeamMode(tournament);
  const [entry] = await db.select().from(playersTable).where(and(eq(playersTable.id, entryId), eq(playersTable.tournamentId, tournamentId)));
  if (!entry) throw new TeamRosterError("TEAM_NOT_FOUND", 404, "Nie znaleziono drużyny w tym turnieju.");
  const [team] = await db.select().from(tournamentTeamsTable).where(eq(tournamentTeamsTable.playerId, entryId));
  const rows = team ? await db.select().from(teamMembersTable).where(eq(teamMembersTable.teamId, team.id))
    .orderBy(asc(teamMembersTable.joinedAt), asc(teamMembersTable.id)) : [];
  return {
    entryId,
    name: entry.name,
    history: rows.map((row) => ({
      id: row.id, name: row.name, role: row.role, roleLabel: TEAM_ROLE_LABELS[row.role],
      joinedAt: row.joinedAt.toISOString(), leftAt: row.leftAt?.toISOString() ?? null, leftReason: row.leftReason ?? null,
    })),
  };
}

export async function updateTeamSettings(tournamentId: number, input: unknown): Promise<TeamsOverview> {
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "rosterMin" && key !== "rosterMax")) {
    throw new TeamRosterError("INVALID_SETTINGS", 400, "Oczekiwano { rosterMin, rosterMax }.");
  }
  await db.transaction(async (tx) => {
    const tournament = await loadTournament(tx, tournamentId, true);
    requireTeamMode(tournament);
    if (tournament.status !== "draft") throw new TeamRosterError("TOURNAMENT_ALREADY_STARTED", 409, "Limity składu zmienisz tylko przed startem turnieju.");
    const validation = validateRosterSettings("teams", body.rosterMin, body.rosterMax);
    if (!validation.ok) throw new TeamRosterError("INVALID_SETTINGS", 422, validation.message);
    await tx.update(tournamentsTable).set({ teamRosterMin: validation.value.rosterMin, teamRosterMax: validation.value.rosterMax })
      .where(eq(tournamentsTable.id, tournamentId));
  });
  return getTeamsOverview(tournamentId);
}

/** Start gate for team tournaments: every active team must satisfy the roster limits. */
export async function findTeamRosterStartProblems(tournamentId: number): Promise<{ teams: Array<{ entryId: number; name: string; issues: RosterIssue[] }> } | null> {
  const tournament = await loadTournament(db, tournamentId);
  if (tournament.participantType !== "teams") return null;
  const blocked = (await summaries(db, tournament))
    .filter((team) => team.entryStatus === "active" && !team.ready)
    .map((team) => ({ entryId: team.entryId, name: team.name, issues: team.issues.filter((issue) => issue.tone === "danger") }));
  return blocked.length > 0 ? { teams: blocked } : null;
}
