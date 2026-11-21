import { t as tr, stageLabel } from "@/i18n";
/**
 * SWARM-006 UX v4 — pure view models for the Experimental screens.
 * No API calls and no writes: everything is derived from data the pages already load,
 * so Stable and the server contract are untouched.
 */
import type { Match, Player, Tournament, TournamentStage } from "@workspace/api-client-react";

/* ── Dashboard: "Wróć do pracy" ─────────────────────────────────────────── */

export type ResumeReason = "active" | "draft";
export interface ResumeTarget {
  tournament: Pick<Tournament, "id" | "name" | "status" | "currentRound" | "totalRounds" | "createdAt">;
  reason: ResumeReason;
  /** 0–100 when round data is known for an active tournament. */
  progress: number | null;
}

function newestFirst<T extends { createdAt: string; id: number }>(a: T, b: T): number {
  const byDate = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  return Number.isFinite(byDate) && byDate !== 0 ? byDate : b.id - a.id;
}

type ResumeCandidate = Pick<Tournament, "id" | "name" | "status" | "currentRound" | "totalRounds" | "createdAt"> & { activity?: Tournament["activity"] };
const hasMatchWork = (t: ResumeCandidate) => (t.activity?.liveMatchCount ?? 0) + (t.activity?.readyMatchCount ?? 0) > 0;

export function pickResumeTournament(
  list: ReadonlyArray<ResumeCandidate> | null | undefined,
): ResumeTarget | null {
  if (!list?.length) return null;
  // With activity data, a tournament that has matches to play beats a newer one that is waiting.
  const active = list
    .filter((t) => t.status === "active")
    .sort((a, b) => Number(hasMatchWork(b)) - Number(hasMatchWork(a)) || newestFirst(a, b))[0];
  if (active) {
    const { currentRound, totalRounds } = active;
    const progress =
      typeof currentRound === "number" && typeof totalRounds === "number" && totalRounds > 0
        ? Math.round((Math.min(Math.max(currentRound - 1, 0), totalRounds) / totalRounds) * 100)
        : null;
    return { tournament: active, reason: "active", progress };
  }
  const draft = list.filter((t) => t.status === "draft").sort(newestFirst)[0];
  return draft ? { tournament: draft, reason: "draft", progress: null } : null;
}

/* ── Players: roster health ─────────────────────────────────────────────── */

export type HealthTone = "success" | "warning" | "danger" | "info";
export interface RosterIssue { key: string; tone: HealthTone; label: string }
export interface RosterHealth {
  count: number;
  max: number | null;
  freeSlots: number | null;
  ready: boolean;
  issues: RosterIssue[];
}

const nameKey = (name: string) => name.trim().toLocaleLowerCase("pl-PL");

export function rosterHealth(
  players: ReadonlyArray<Pick<Player, "name" | "seed">> | null | undefined,
  maxPlayers: number | null | undefined,
  /** Fixed multi-stage plans (V5 presets) start only with exactly this many participants. */
  requiredCount?: number | null,
  /** V5: team tournaments — teams whose roster blocks the start. */
  teamsNotReady?: number | null,
): RosterHealth {
  const list = players ?? [];
  const count = list.length;
  const max = typeof maxPlayers === "number" && maxPlayers > 0 ? maxPlayers : null;
  const freeSlots = max === null ? null : Math.max(0, max - count);
  const issues: RosterIssue[] = [];

  const exact = typeof requiredCount === "number" && requiredCount >= 2 ? requiredCount : null;
  if (exact !== null && count < exact) {
    const missingCount = exact - count;
    issues.push({ key: "min", tone: "warning", label: tr("experimentalV4Model.plan_wymaga_dokladnie_exact_brakuje", { exact: exact, missingCount: missingCount }) });
  } else if (exact !== null && count > exact) {
    issues.push({ key: "over", tone: "danger", label: tr("experimentalV4Model.za_duzo_uczestnikow_count_exact", { count: count, exact: exact }) });
  } else if (exact === null && count < 2) {
    issues.push({ key: "min", tone: "warning", label: count === 0 ? tr("experimentalV4Model.brak_uczestnikow_potrzeba_co_najmniej") : tr("experimentalV4Model.potrzeba_jeszcze_1_uczestnika") });
  }
  if (exact === null && max !== null && count > max) {
    issues.push({ key: "over", tone: "danger", label: tr("experimentalV4Model.przekroczony_limit_count_max", { count: count, max: max }) });
  }

  const names = new Map<string, number>();
  for (const p of list) names.set(nameKey(p.name), (names.get(nameKey(p.name)) ?? 0) + 1);
  const dupNames = [...names.values()].filter((n) => n > 1).length;
  if (dupNames > 0) {
    issues.push({ key: "dup-name", tone: "danger", label: dupNames === 1 ? tr("experimentalV4Model.1_powtorzony_nick") : tr("experimentalV4Model.dupnames_powtorzone_nicki", { dupNames: dupNames }) });
  }

  const seeds = new Map<number, number>();
  let missing = 0;
  for (const p of list) {
    if (typeof p.seed === "number") seeds.set(p.seed, (seeds.get(p.seed) ?? 0) + 1);
    else missing += 1;
  }
  const dupSeeds = [...seeds.entries()].filter(([, n]) => n > 1).map(([s]) => s).sort((a, b) => a - b);
  if (dupSeeds.length > 0) {
    issues.push({ key: "dup-seed", tone: "danger", label: tr("experimentalV4Model.powtorzone_rozstawienie_v0", { v0: dupSeeds.join(", ") }) });
  }
  if (count > 0 && missing > 0) {
    issues.push({ key: "seed-missing", tone: "info", label: missing === count ? tr("experimentalV4Model.rozstawienie_zostanie_nadane_automatyczn") : tr("experimentalV4Model.missing_bez_rozstawienia_nadane_automaty", { missing: missing }) });
  }

  if (typeof teamsNotReady === "number" && teamsNotReady > 0) {
    issues.push({ key: "team-roster", tone: "danger", label: teamsNotReady === 1 ? tr("experimentalV4Model.1_druzyna_bez_pelnego_skladu") : tr("experimentalV4Model.teamsnotready_druzyn_bez_pelnego_skladu", { teamsNotReady: teamsNotReady }) });
  }
  const ready = (exact !== null ? count === exact : count >= 2) && !issues.some((i) => i.tone === "danger");
  return { count, max, freeSlots, ready, issues };
}

/* ── Stages: rail ───────────────────────────────────────────────────────── */

export interface StageRailItem {
  id: number;
  name: string;
  format: TournamentStage["format"];
  status: TournamentStage["status"];
  done: number;
  total: number;
  roundLabel: string | null;
  isCurrent: boolean;
}

export function stageRail(
  stages: ReadonlyArray<Pick<TournamentStage, "id" | "name" | "format" | "status" | "position" | "currentRound" | "totalRounds" | "plannedRounds">> | null | undefined,
  matches: ReadonlyArray<Pick<Match, "stageId" | "status">> | null | undefined,
  activeStageId?: number | null,
): StageRailItem[] {
  const sorted = [...(stages ?? [])].sort((a, b) => a.position - b.position || a.id - b.id);
  const counts = new Map<number, { done: number; total: number }>();
  for (const m of matches ?? []) {
    if (m.status === "cancelled") continue;
    const c = counts.get(m.stageId) ?? { done: 0, total: 0 };
    c.total += 1;
    if (m.status === "completed") c.done += 1;
    counts.set(m.stageId, c);
  }
  const currentId =
    activeStageId ?? sorted.find((s) => s.status === "active")?.id ?? sorted.find((s) => s.status === "planned")?.id ?? null;
  return sorted.map((s) => {
    const c = counts.get(s.id) ?? { done: 0, total: 0 };
    const rounds = s.totalRounds ?? s.plannedRounds ?? null;
    // V5.8: groups play their rounds side by side — progress is the match count, not "Runda 1/3".
    const roundLabel =
      s.status === "active" && typeof s.currentRound === "number" && s.format !== "group_stage"
        ? rounds ? tr("experimentalV4Model.runda_currentround_rounds", { currentRound: s.currentRound, rounds: rounds }) : tr("experimentalV4Model.runda_currentround", { currentRound: s.currentRound })
        : null;
    return { id: s.id, name: stageLabel(s.name), format: s.format, status: s.status, done: c.done, total: c.total, roundLabel, isCurrent: s.id === currentId };
  });
}

/* ── Matches: flow (round progress + up next) ───────────────────────────── */

type FlowMatch = Pick<Match, "id" | "round" | "matchNumber" | "sortOrder" | "status" | "player1Id" | "player2Id" | "player1Name" | "player2Name">;
export interface MatchFlow<M extends FlowMatch = FlowMatch> {
  round: number | null;
  roundDone: number;
  roundTotal: number;
  upNext: M[];
}

const order = (a: FlowMatch, b: FlowMatch) =>
  a.round - b.round || (a.sortOrder ?? a.matchNumber) - (b.sortOrder ?? b.matchNumber) || a.id - b.id;
const playable = (m: FlowMatch) => m.status === "pending" && m.player1Id != null && m.player2Id != null;

export function matchFlow<M extends FlowMatch>(matches: ReadonlyArray<M> | null | undefined, focusedMatchId: number | null | undefined, limit = 3): MatchFlow<M> {
  const list = [...(matches ?? [])].filter((m) => m.status !== "cancelled").sort(order);
  const focused = list.find((m) => m.id === focusedMatchId);
  const firstOpen = list.find((m) => m.status !== "completed");
  const round = focused?.round ?? firstOpen?.round ?? list[list.length - 1]?.round ?? null;
  const inRound = round === null ? [] : list.filter((m) => m.round === round);
  return {
    round,
    roundDone: inRound.filter((m) => m.status === "completed").length,
    roundTotal: inRound.length,
    upNext: list.filter((m) => m.id !== focusedMatchId && playable(m)).slice(0, Math.max(0, limit)),
  };
}

/* ── Dashboard: group tournaments by the action they need ───────────────── */

export type TournamentActionGroup = "play" | "advance" | "start" | "roster" | "prepare" | "done";
export interface TournamentAction {
  group: TournamentActionGroup;
  /** Visible label of the primary action, e.g. "Prowadź mecze". */
  label: string;
  /** Short reason shown next to the action. */
  hint: string;
  href: string;
}

export const ACTION_GROUPS: ReadonlyArray<{ group: TournamentActionGroup; title: string }> = [
  { group: "play", get title() { return tr("experimentalV4Model.do_prowadzenia_teraz"); } },
  { group: "advance", get title() { return tr("experimentalV4Model.czekaja_na_kolejny_krok"); } },
  { group: "start", get title() { return tr("experimentalV4Model.gotowe_do_startu"); } },
  { group: "roster", get title() { return tr("experimentalV4Model.brakuje_uczestnikow"); } },
  { group: "prepare", get title() { return tr("experimentalV4Model.wymagaja_przygotowania"); } },
  { group: "done", get title() { return tr("experimentalV4Model.zakonczone"); } },
];

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = n === 1 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return `${n} ${word}`;
}

/**
 * Returns null when the list item carries no activity summary (older API): callers then
 * keep the V3 lifecycle grouping instead of guessing.
 */
export function tournamentAction(t: { id: number; status: string; activity?: Tournament["activity"] | null }): TournamentAction | null {
  const base = `/experimental/tournaments/${t.id}`;
  const a = t.activity;
  if (!a) return null;
  if (t.status === "completed") return { group: "done", label: tr("experimentalV4Model.zobacz_wyniki"), hint: tr("experimentalV4Model.turniej_zakonczony"), href: base };
  if (t.status === "active") {
    if (a.liveMatchCount + a.readyMatchCount > 0) {
      const parts = [
        a.liveMatchCount ? plural(a.liveMatchCount, tr("experimentalV4Model.mecz_trwa"), tr("experimentalV4Model.mecze_trwaja"), tr("experimentalV4Model.meczow_trwa")) : "",
        a.readyMatchCount ? plural(a.readyMatchCount, tr("experimentalV4Model.mecz_gotowy"), tr("experimentalV4Model.mecze_gotowe"), tr("experimentalV4Model.meczow_gotowych")) : "",
      ].filter(Boolean);
      return { group: "play", label: tr("experimentalV4Model.prowadz_mecze"), hint: parts.join(" · "), href: `${base}/host` };
    }
    // V5.11: the engine's stage summary names the move instead of a generic "next step".
    const stage = a.currentStage;
    if (stage?.status === "active" && stage.matchesTotal > 0 && stage.matchesCompleted >= stage.matchesTotal) {
      if (stage.format === "swiss" && stage.currentRound && stage.plannedRounds && stage.currentRound < stage.plannedRounds) {
        return { group: "advance", label: tr("experimentalV4Model.generuj_runde_v0", { v0: stage.currentRound + 1 }), hint: tr("experimentalV4Model.runda_currentround_z_plannedrounds_zakon", { currentRound: stage.currentRound, plannedRounds: stage.plannedRounds }), href: `${base}/host` };
      }
      if (stage.format !== "swiss" || stage.plannedRounds) {
        return { group: "advance", label: tr("experimentalV4Model.zakoncz_etap"), hint: tr("experimentalV4Model.wszystkie_mecze_etapu_name_maja", { name: stageLabel(stage.name) }), href: `${base}?tab=stages&stage=${stage.id}&action=complete` };
      }
    }
    if (stage?.status === "planned") {
      return { group: "advance", label: tr("experimentalV4Model.rozpocznij_etap"), hint: tr("experimentalV4Model.etap_name_czeka_na_start", { name: stageLabel(stage.name) }), href: `${base}?tab=stages&stage=${stage.id}&action=start` };
    }
    return { group: "advance", label: tr("experimentalV4Model.nastepny_krok"), hint: tr("experimentalV4Model.brak_meczow_do_rozegrania_rozpocznij"), href: `${base}/host` };
  }
  if (t.status === "draft") {
    // V5.11: drafts follow the engine's start readiness of the first stage (exact sizes, baskets, seeds);
    // fewer than 2 participants always asks for participants first (V5.8 rule).
    const readiness = a.playerCount >= 2 ? a.startReadiness : null;
    if (readiness) {
      if (readiness.ready) return { group: "start", label: tr("experimentalV4Model.uruchom_turniej"), hint: tr("experimentalV4Model.v0_wszystko_gotowe", { v0: plural(a.playerCount, tr("experimentalV4Model.uczestnik"), tr("experimentalV4Model.uczestnikow"), tr("experimentalV4Model.uczestnikow")) }), href: base };
      if (readiness.reasonCode === "STAGE_PARTICIPANTS_INCONSISTENT" && readiness.participantCount < readiness.requiredParticipantCount) {
        const missing = readiness.requiredParticipantCount - readiness.participantCount;
        return { group: "roster", label: tr("experimentalV4Model.dodaj_uczestnikow"), hint: tr("experimentalV4Model.dodaj_jeszcze_missing_na_liscie", { missing: missing, participantCount: readiness.participantCount, requiredParticipantCount: readiness.requiredParticipantCount }), href: `${base}?tab=players` };
      }
      return { group: "prepare", label: tr("experimentalV4Model.sprawdz_przygotowanie"), hint: tr("experimentalV4Model.pierwszy_etap_wymaga_przygotowania_przed"), href: `${base}?tab=stages` };
    }
    if (a.playerCount >= 2) return { group: "start", label: tr("experimentalV4Model.uruchom_turniej"), hint: plural(a.playerCount, tr("experimentalV4Model.uczestnik"), tr("experimentalV4Model.uczestnikow"), tr("experimentalV4Model.uczestnikow")), href: base };
    return { group: "roster", label: tr("experimentalV4Model.dodaj_uczestnikow"), hint: a.playerCount === 1 ? tr("experimentalV4Model.jest_1_uczestnik_potrzeba_2") : tr("experimentalV4Model.brak_uczestnikow"), href: `${base}?tab=players` };
  }
  return null;
}

/* ── Players: bulk paste with validation ────────────────────────────────── */

export interface BulkRow {
  line: number;
  raw: string;
  name: string;
  team: string;
  seed: number | null;
  /** True when the seed was numbered by the preview (blank in the pasted text). */
  autoSeed?: boolean;
  error: string | null;
}
export interface BulkParse {
  rows: BulkRow[];
  valid: BulkRow[];
  invalid: BulkRow[];
  /** Valid rows that do not fit in the remaining capacity. */
  overCapacity: number;
  /** Payload for the existing CSV import endpoint, valid rows only. */
  csv: string;
  headerDetected: boolean;
}

// CSV header aliases (data, both languages are accepted) — i18n-ignore
const NAME_KEYS = ["name", "nick", "nazwa", "gracz", "zawodnik"]; // i18n-ignore
const TEAM_KEYS = ["team", "druzyna", "drużyna"]; // i18n-ignore
const SEED_KEYS = ["seed", "rozstawienie"]; // i18n-ignore
const HEADER_WORDS = new Set([...NAME_KEYS, ...TEAM_KEYS, ...SEED_KEYS, "rank", "ranga", "country", "kraj"]); // i18n-ignore
/** Server limits (tournament-roster.ts): name ≤ 100, seed 1–999, default capacity 256. */
export const BULK_NAME_MAX = 100;
const DEFAULT_CAPACITY = 256;

function splitCells(line: string, separator: string | null): string[] {
  return (separator ? line.split(separator) : [line]).map((cell) => cell.trim().replace(/^"(.*)"$/, "$1").trim());
}

export function parseBulkRoster(
  text: string,
  options: {
    existingNames?: ReadonlyArray<string>;
    /** Seeds already used by the current roster (append mode). */
    existingSeeds?: ReadonlyArray<number>;
    maxPlayers?: number | null;
    mode?: "append" | "replace";
  } = {},
): BulkParse {
  const mode = options.mode ?? "append";
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const nonEmpty = lines.map((raw, i) => ({ raw, line: i + 1 })).filter((l) => l.raw.trim());
  const sample = nonEmpty.slice(0, 5).map((l) => l.raw).join("\n");
  const separator = sample.includes("\t") ? "\t" : sample.includes(";") ? ";" : sample.includes(",") ? "," : null;

  let nameCol = 0;
  let teamCol = separator ? 1 : -1;
  let seedCol = separator ? 2 : -1;
  let headerDetected = false;
  if (nonEmpty.length) {
    const cells = splitCells(nonEmpty[0]!.raw, separator).map((c) => c.toLocaleLowerCase("pl-PL"));
    if (cells.some((c) => NAME_KEYS.includes(c)) && cells.every((c) => !c || HEADER_WORDS.has(c))) {
      headerDetected = true;
      nameCol = cells.findIndex((c) => NAME_KEYS.includes(c));
      teamCol = cells.findIndex((c) => TEAM_KEYS.includes(c));
      seedCol = cells.findIndex((c) => SEED_KEYS.includes(c));
      nonEmpty.shift();
    }
  }
  // "1. Nick" / "2) Nick" lists: strip numbering only when every line is numbered.
  const numbered = !separator && nonEmpty.length > 1 && nonEmpty.every((l) => /^\s*\d+[.)]\s+\S/.test(l.raw));

  const existing = new Set(mode === "append" ? (options.existingNames ?? []).map((n) => n.trim().toLocaleLowerCase("pl")) : []);
  const takenSeeds = new Set(mode === "append" ? options.existingSeeds ?? [] : []);
  const seen = new Set<string>();
  const seeds = new Set<number>();
  const rows: BulkRow[] = nonEmpty.map(({ raw, line }) => {
    const cells = splitCells(numbered ? raw.replace(/^\s*\d+[.)]\s+/, "") : raw, separator);
    const name = (cells[nameCol] ?? "").replace(/\s+/g, " ").trim();
    const team = teamCol >= 0 ? (cells[teamCol] ?? "").trim() : "";
    const seedText = seedCol >= 0 ? (cells[seedCol] ?? "").trim() : "";
    const row: BulkRow = { line, raw, name, team, seed: null, error: null };
    const key = name.toLocaleLowerCase("pl");
    if (!name) row.error = tr("experimentalV4Model.brak_nicku");
    else if (name.length > BULK_NAME_MAX) row.error = tr("experimentalV4Model.nick_za_dlugi_length_bulk", { length: name.length, BULK_NAME_MAX: BULK_NAME_MAX });
    else if (/[;,\t]/.test(name) || /[;,\t]/.test(team)) row.error = tr("experimentalV4Model.nick_i_druzyna_nie_moga");
    else if (seen.has(key)) row.error = tr("experimentalV4Model.powtorzony_w_tej_liscie");
    else if (existing.has(key)) row.error = tr("experimentalV4Model.juz_jest_na_liscie_turnieju");
    if (!row.error && seedText) {
      const seed = Number(seedText);
      if (!Number.isInteger(seed) || seed < 1 || seed > 999) row.error = tr("experimentalV4Model.rozstawienie_seedtext_poza_zakresem_1", { seedText: seedText });
      else if (seeds.has(seed)) row.error = tr("experimentalV4Model.rozstawienie_seed_powtorzone", { seed: seed });
      else if (takenSeeds.has(seed)) row.error = tr("experimentalV4Model.rozstawienie_seed_jest_juz_zajete", { seed: seed });
      else row.seed = seed;
    }
    if (!row.error) {
      seen.add(key);
      if (row.seed !== null) seeds.add(row.seed);
    }
    return row;
  });

  const valid = rows.filter((r) => !r.error);
  // The database gives a seedless row "max + 1" at insert time and then renumbers, so in a
  // paste that mixes explicit and blank seeds a blank row could take an explicit slot.
  // Number blanks after every known seed so explicit seeds keep their relative order.
  if (valid.some((r) => r.seed !== null)) {
    let next = Math.max(0, ...valid.map((r) => r.seed ?? 0), ...(mode === "append" ? options.existingSeeds ?? [] : []));
    for (const r of valid) if (r.seed === null) { r.seed = ++next; r.autoSeed = true; }
  }
  const invalid = rows.filter((r) => r.error);
  const limit = options.maxPlayers && options.maxPlayers > 0 ? options.maxPlayers : DEFAULT_CAPACITY;
  const capacity = Math.max(0, limit - (mode === "append" ? options.existingNames?.length ?? 0 : 0));
  const overCapacity = Math.max(0, valid.length - capacity);
  const csv = ["name;team;seed", ...valid.map((r) => `${r.name};${r.team};${r.seed ?? ""}`)].join("\n");
  return { rows, valid, invalid, overCapacity, csv, headerDetected };
}

/* ── Matches: search by player, round and ID ────────────────────────────── */

export interface MatchQuery {
  ids: number[];
  round: number | null;
  text: string;
}

const fold = (value: string) =>
  value.replace(/ł/g, "l").replace(/Ł/g, "L").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pl-PL");

/** "r2 kowal", "runda 3", "#41", "id 41", "41" → structured query. */
export function parseMatchQuery(input: string): MatchQuery {
  let rest = ` ${input.trim()} `;
  let round: number | null = null;
  const ids: number[] = [];
  rest = rest.replace(/\s(?:r|runda|rnd|round)\s?(\d{1,3})(?=\s)/gi, (_m, n: string) => { round = Number(n); return " "; });
  rest = rest.replace(/\s(?:#|id[:\s]?\s?|mecz\s)(\d{1,9})(?=\s)/gi, (_m, n: string) => { ids.push(Number(n)); return " "; });
  rest = rest.replace(/\s(\d{1,9})(?=\s)/g, (_m, n: string) => { ids.push(Number(n)); return " "; });
  return { ids, round, text: fold(rest.replace(/\s+/g, " ").trim()) };
}

export function searchMatches<M extends Pick<Match, "id" | "round" | "matchNumber" | "sortOrder" | "status" | "player1Name" | "player2Name">>(
  matches: ReadonlyArray<M> | null | undefined,
  input: string,
): M[] {
  const q = parseMatchQuery(input);
  if (!q.text && q.round === null && q.ids.length === 0) return [];
  const isOpen = (m: M) => m.status !== "completed" && m.status !== "cancelled";
  return [...(matches ?? [])]
    .filter((m) => {
      if (q.round !== null && m.round !== q.round) return false;
      if (q.ids.length && !q.ids.some((id) => id === m.id || id === m.matchNumber)) return false;
      if (q.text) {
        const names = fold(`${m.player1Name ?? ""} ${m.player2Name ?? ""}`);
        if (!q.text.split(" ").every((part) => names.includes(part))) return false;
      }
      return true;
    })
    .sort((a, b) =>
      Number(q.ids.includes(b.id)) - Number(q.ids.includes(a.id)) ||
      Number(isOpen(b)) - Number(isOpen(a)) ||
      a.round - b.round ||
      (a.sortOrder ?? a.matchNumber) - (b.sortOrder ?? b.matchNumber) ||
      a.id - b.id,
    );
}

/* ── Stages: map of stages, baskets, qualification and advancement ─────── */

type MapStage = Pick<TournamentStage, "id" | "name" | "format" | "status" | "position" | "currentRound" | "totalRounds" | "plannedRounds"
  | "participantCount" | "qualificationMode" | "advancingCount" | "groupCount" | "qualifiersPerGroup"> & { roundRobinLegs?: number | null };
export type MapBasket = { id: string; stageId: number; type: "input" | "output"; ordinal: number; participantIds: readonly number[]; qualifierCount: number | null };
export type MapRoute = { sourceBasketId: string; targetBasketId: string };

export interface StageMapLink {
  label: string;
  count: number | null;
  targetStageId: number;
  targetName: string;
}
export interface StageMapNode extends StageRailItem {
  participants: number;
  groups: number | null;
  qualification: string;
  inputs: Array<{ label: string; direct: number; incoming: number }>;
  outgoing: StageMapLink[];
  /** Participants that end their run in this stage, when every outgoing link has a known count. */
  eliminated: number | null;
  /** V5: round robin played home and away. */
  homeAndAway: boolean;
}

export function stageMap(
  stages: ReadonlyArray<MapStage> | null | undefined,
  matches: ReadonlyArray<Pick<Match, "stageId" | "status">> | null | undefined,
  baskets: { baskets: ReadonlyArray<MapBasket>; routes: ReadonlyArray<MapRoute> } | null | undefined,
  activeStageId?: number | null,
): StageMapNode[] {
  const rail = stageRail(stages, matches, activeStageId);
  const byId = new Map((stages ?? []).map((s) => [s.id, s]));
  const allBaskets = baskets?.baskets ?? [];
  const basketById = new Map(allBaskets.map((b) => [b.id, b]));
  const routesFrom = new Map<string, MapRoute[]>();
  const routesTo = new Map<string, MapRoute[]>();
  for (const r of baskets?.routes ?? []) {
    routesFrom.set(r.sourceBasketId, [...(routesFrom.get(r.sourceBasketId) ?? []), r]);
    routesTo.set(r.targetBasketId, [...(routesTo.get(r.targetBasketId) ?? []), r]);
  }
  const advancingOf = (s: MapStage | undefined): number | null =>
    !s ? null
      : s.qualificationMode === "top_n_per_group" && s.qualifiersPerGroup && s.groupCount
        ? s.qualifiersPerGroup * s.groupCount
        : s.qualificationMode === "top_n" ? s.advancingCount ?? null : null;
  const outputsPerStage = new Map<number, number>();
  for (const b of allBaskets) if (b.type === "output") outputsPerStage.set(b.stageId, (outputsPerStage.get(b.stageId) ?? 0) + 1);
  // Explicit quota, or — for an implicit (legacy) single output basket — the stage's qualification rule.
  const quotaOf = (b: MapBasket | undefined): number | null =>
    !b ? null
      : b.qualifierCount ?? (outputsPerStage.get(b.stageId) === 1 ? advancingOf(byId.get(b.stageId)) : null);
  return rail.map((item, index) => {
    const s = byId.get(item.id)!;
    const own = allBaskets.filter((b) => b.stageId === s.id).sort((a, b) => a.ordinal - b.ordinal);
    const inputs = own.filter((b) => b.type === "input").map((b) => ({
      label: tr("experimentalV4Model.koszyk_ordinal", { ordinal: b.ordinal }),
      direct: b.participantIds.length,
      // V5.6: once the source stage is completed its qualifiers already sit in this basket (counted in `direct`).
      incoming: (routesTo.get(b.id) ?? []).reduce((sum, r) => {
        const source = basketById.get(r.sourceBasketId);
        return source && byId.get(source.stageId)?.status === "completed" ? sum : sum + (quotaOf(source) ?? 0);
      }, 0),
    }));
    let outgoing: StageMapLink[] = own
      .filter((b) => b.type === "output")
      .flatMap((b) => (routesFrom.get(b.id) ?? []).map((r): StageMapLink | null => {
        const target = byId.get(basketById.get(r.targetBasketId)?.stageId ?? -1);
        const label = b.qualifierCount === null && outputsPerStage.get(s.id) === 1 ? tr("experimentalV4Model.awans") : tr("experimentalV4Model.koszyk_wyjsciowy_ordinal", { ordinal: b.ordinal });
        return target ? { label, count: quotaOf(b), targetStageId: target.id, targetName: stageLabel(target.name) } : null;
      }))
      .filter((l): l is StageMapLink => l !== null);
    const next = rail[index + 1];
    const advancing = advancingOf(s);
    // Without explicit basket routes, a qualifying stage feeds the next stage by position.
    if (outgoing.length === 0 && next && s.qualificationMode !== "none") {
      outgoing = [{ label: tr("experimentalV4Model.awans"), count: advancing, targetStageId: next.id, targetName: stageLabel(next.name) }];
    }
    const qualification =
      s.qualificationMode === "top_n_per_group" && s.qualifiersPerGroup
        ? tr("experimentalV4Model.awans_qualifierspergroup_najlepszych_z_k", { qualifiersPerGroup: s.qualifiersPerGroup, v1: s.groupCount ? ` (${s.groupCount} gr.)` : "" })
        : s.qualificationMode === "top_n" && s.advancingCount
          ? tr("experimentalV4Model.awans_advancingcount_najlepszych", { advancingCount: s.advancingCount })
          : outgoing.length ? tr("experimentalV4Model.awans_wedlug_koszykow") : next ? tr("experimentalV4Model.bez_awansu_do_kolejnego_etapu") : tr("experimentalV4Model.etap_koncowy_wylania_zwyciezce");
    const routedOut = outgoing.reduce((sum, l) => sum + (l.count ?? 0), 0);
    const eliminated =
      s.participantCount > 0 && outgoing.length > 0 && outgoing.every((l) => l.count !== null)
        ? Math.max(0, s.participantCount - routedOut)
        : null;
    return { ...item, participants: s.participantCount, groups: s.groupCount ?? null, qualification, inputs, outgoing, eliminated, homeAndAway: s.format === "round_robin" && s.roundRobinLegs === 2 };
  });
}
