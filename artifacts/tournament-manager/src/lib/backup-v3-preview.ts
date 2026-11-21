import { t } from "@/i18n";
/**
 * V5.2: read-only preview and consistency check of a Backup V3 file in the browser.
 * Nothing is sent to the server and nothing is restored — the V3 import stays disabled
 * (BACKUP_V3_IMPORT). The organizer learns whether the file is complete and what it holds.
 */
export interface BackupV3Preview {
  name: string;
  exportedAt: string | null;
  participantType: "players" | "teams";
  participants: number;
  stages: number;
  matches: { total: number; completed: number };
  resultHistory: number;
  teams: { count: number; activeMembers: number; historyEntries: number } | null;
  problems: string[];
}

type Rec = Record<string, unknown>;
const isRecord = (value: unknown): value is Rec => value !== null && typeof value === "object" && !Array.isArray(value);
const list = (value: unknown): Rec[] => (Array.isArray(value) ? value.filter(isRecord) : []);
const SECRET_KEY = /password|passwd|token|secret|hash|session/i;

function findSecretKey(value: unknown, depth = 0): string | null {
  if (depth > 8) return null;
  if (Array.isArray(value)) {
    for (const item of value) { const hit = findSecretKey(item, depth + 1); if (hit) return hit; }
    return null;
  }
  if (!isRecord(value)) return null;
  for (const [key, inner] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) return key;
    const hit = findSecretKey(inner, depth + 1);
    if (hit) return hit;
  }
  return null;
}

/** Returns null when the text is not a Backup V3 at all (callers keep their own error then). */
export function inspectBackupV3(contents: string): BackupV3Preview | null {
  let value: unknown;
  try { value = JSON.parse(contents); } catch { return null; }
  if (!isRecord(value) || Number(value.schemaVersion) !== 3) return null;

  const problems: string[] = [];
  const tournament = isRecord(value.tournament) ? value.tournament : null;
  if (!tournament) problems.push(t("backupV3Preview.brak_sekcji_tournament"));
  for (const section of ["players", "stages", "matches", "resultHistory"] as const) {
    if (!Array.isArray(value[section])) problems.push(t("backupV3Preview.brak_sekcji_section", { section: section }));
  }
  const players = list(value.players);
  const stages = list(value.stages);
  const matches = list(value.matches);
  const playerIds = new Set(players.map((player) => player.backupId));
  const stageIds = new Set(stages.map((stage) => stage.backupId));
  if (playerIds.size !== players.length) problems.push(t("backupV3Preview.lista_uczestnikow_ma_powtorzone_identyfi"));

  let brokenMatches = 0;
  for (const match of matches) {
    const refs = [match.player1BackupId, match.player2BackupId, match.winnerBackupId].filter((id) => id !== null && id !== undefined);
    if (refs.some((id) => !playerIds.has(id)) || (match.stageBackupId != null && !stageIds.has(match.stageBackupId))) brokenMatches += 1;
  }
  if (brokenMatches) problems.push(t("backupV3Preview.mecze_wskazujace_na_nieistniejacych_ucze", { brokenMatches: brokenMatches }));

  const participantType = tournament?.participantType === "teams" ? "teams" : "players";
  let teams: BackupV3Preview["teams"] = null;
  if (value.teamRosters !== undefined) {
    const rosters = isRecord(value.teamRosters) ? value.teamRosters : null;
    const teamList = list(rosters?.teams);
    if (!rosters || rosters.formatVersion !== 1) problems.push(t("backupV3Preview.sekcja_skladow_druzyn_ma_nieznany"));
    if (participantType !== "teams") problems.push(t("backupV3Preview.sklady_druzyn_w_turnieju_ktory"));
    const linked = teamList.filter((team) => playerIds.has(team.playerBackupId)).length;
    if (linked !== teamList.length) problems.push(t("backupV3Preview.czesc_druzyn_nie_ma_swojego"));
    const members = teamList.flatMap((team) => list(team.members));
    teams = { count: teamList.length, activeMembers: members.filter((member) => member.leftAt == null).length, historyEntries: members.length };
  } else if (participantType === "teams") {
    problems.push(t("backupV3Preview.turniej_druzynowy_bez_sekcji_skladow"));
  }

  const secret = findSecretKey(value);
  if (secret) problems.push(t("backupV3Preview.plik_zawiera_pole_secret_ktorego", { secret: secret }));

  return {
    name: typeof tournament?.name === "string" && tournament.name.trim() ? tournament.name : t("backupV3Preview.turniej_bez_nazwy"),
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : null,
    participantType,
    participants: players.length,
    stages: stages.length,
    matches: { total: matches.length, completed: matches.filter((match) => match.status === "completed").length },
    resultHistory: list(value.resultHistory).length,
    teams,
    problems,
  };
}
