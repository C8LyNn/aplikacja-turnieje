/**
 * V5 · Stage D — pure roster rules for team tournaments (no database access).
 * Starters = captain + players; reserves never count towards the minimum.
 */
export const TEAM_ROLES = ["captain", "player", "reserve"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  captain: "Kapitan",
  player: "Zawodnik",
  reserve: "Rezerwowy",
};

export const TEAM_ROSTER_LIMIT = 50;
export const TEAM_MEMBER_NAME_MAX = 100;

export interface RosterSettings {
  participantType: "players" | "teams";
  rosterMin: number | null;
  rosterMax: number | null;
}

export interface RosterMemberLike {
  name: string;
  role: TeamRole;
}

export type RosterIssueCode = "ROSTER_TOO_SMALL" | "ROSTER_TOO_LARGE" | "NO_CAPTAIN";

export interface RosterIssue {
  code: RosterIssueCode;
  tone: "danger" | "info";
  message: string;
}

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && (TEAM_ROLES as readonly string[]).includes(value);
}

export function normaliseMemberName(raw: unknown): { ok: true; name: string } | { ok: false; message: string } {
  if (typeof raw !== "string") return { ok: false, message: "Podaj imię lub nick zawodnika." };
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, message: "Podaj imię lub nick zawodnika." };
  if (name.length > TEAM_MEMBER_NAME_MAX) return { ok: false, message: `Nick może mieć najwyżej ${TEAM_MEMBER_NAME_MAX} znaków.` };
  return { ok: true, name };
}

export function validateRosterSettings(
  participantType: unknown,
  rosterMin: unknown,
  rosterMax: unknown,
): { ok: true; value: RosterSettings } | { ok: false; message: string } {
  const type = participantType ?? "players";
  if (type !== "players" && type !== "teams") return { ok: false, message: "participantType musi wynosić players albo teams." };
  const read = (value: unknown, label: string): number | null | string => {
    if (value === undefined || value === null) return null;
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > TEAM_ROSTER_LIMIT) {
      return `${label} musi być liczbą od 1 do ${TEAM_ROSTER_LIMIT}.`;
    }
    return value as number;
  };
  const min = read(rosterMin, "Minimalny skład");
  if (typeof min === "string") return { ok: false, message: min };
  const max = read(rosterMax, "Maksymalny skład");
  if (typeof max === "string") return { ok: false, message: max };
  if (type === "players" && (min !== null || max !== null)) {
    return { ok: false, message: "Limity składu dotyczą tylko turniejów drużynowych." };
  }
  if (min !== null && max !== null && min > max) return { ok: false, message: "Minimalny skład nie może być większy od maksymalnego." };
  return { ok: true, value: { participantType: type, rosterMin: min, rosterMax: max } };
}

export function starterCount(members: readonly RosterMemberLike[]): number {
  return members.filter((member) => member.role !== "reserve").length;
}

export function rosterIssues(members: readonly RosterMemberLike[], settings: RosterSettings): RosterIssue[] {
  if (settings.participantType !== "teams") return [];
  const issues: RosterIssue[] = [];
  const starters = starterCount(members);
  if (settings.rosterMin !== null && starters < settings.rosterMin) {
    issues.push({ code: "ROSTER_TOO_SMALL", tone: "danger", message: `Skład podstawowy: ${starters}/${settings.rosterMin} (rezerwowi się nie liczą).` });
  }
  if (settings.rosterMax !== null && members.length > settings.rosterMax) {
    issues.push({ code: "ROSTER_TOO_LARGE", tone: "danger", message: `Za dużo osób w składzie: ${members.length}/${settings.rosterMax}.` });
  }
  if (members.length > 0 && !members.some((member) => member.role === "captain")) {
    issues.push({ code: "NO_CAPTAIN", tone: "info", message: "Brak kapitana (opcjonalne)." });
  }
  return issues;
}

export function rosterReady(members: readonly RosterMemberLike[], settings: RosterSettings): boolean {
  return !rosterIssues(members, settings).some((issue) => issue.tone === "danger");
}

/** Whether one more member fits under the maximum (reserves included). */
export function canAddMember(currentSize: number, settings: RosterSettings): boolean {
  return settings.rosterMax === null || currentSize + 1 <= settings.rosterMax;
}
