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
): RosterHealth {
  const list = players ?? [];
  const count = list.length;
  const max = typeof maxPlayers === "number" && maxPlayers > 0 ? maxPlayers : null;
  const freeSlots = max === null ? null : Math.max(0, max - count);
  const issues: RosterIssue[] = [];

  if (count < 2) {
    issues.push({ key: "min", tone: "warning", label: count === 0 ? "Brak uczestników — potrzeba co najmniej 2" : "Potrzeba jeszcze 1 uczestnika" });
  }
  if (max !== null && count > max) {
    issues.push({ key: "over", tone: "danger", label: `Przekroczony limit: ${count}/${max}` });
  }

  const names = new Map<string, number>();
  for (const p of list) names.set(nameKey(p.name), (names.get(nameKey(p.name)) ?? 0) + 1);
  const dupNames = [...names.values()].filter((n) => n > 1).length;
  if (dupNames > 0) {
    issues.push({ key: "dup-name", tone: "danger", label: dupNames === 1 ? "1 powtórzony nick" : `${dupNames} powtórzone nicki` });
  }

  const seeds = new Map<number, number>();
  let missing = 0;
  for (const p of list) {
    if (typeof p.seed === "number") seeds.set(p.seed, (seeds.get(p.seed) ?? 0) + 1);
    else missing += 1;
  }
  const dupSeeds = [...seeds.entries()].filter(([, n]) => n > 1).map(([s]) => s).sort((a, b) => a - b);
  if (dupSeeds.length > 0) {
    issues.push({ key: "dup-seed", tone: "danger", label: `Powtórzone rozstawienie: ${dupSeeds.join(", ")}` });
  }
  if (count > 0 && missing > 0) {
    issues.push({ key: "seed-missing", tone: "info", label: missing === count ? "Rozstawienie zostanie nadane automatycznie" : `${missing} bez rozstawienia (nadane automatycznie)` });
  }

  const ready = count >= 2 && !issues.some((i) => i.tone === "danger");
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
    const roundLabel =
      s.status === "active" && typeof s.currentRound === "number"
        ? rounds ? `Runda ${s.currentRound}/${rounds}` : `Runda ${s.currentRound}`
        : null;
    return { id: s.id, name: s.name, format: s.format, status: s.status, done: c.done, total: c.total, roundLabel, isCurrent: s.id === currentId };
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

export type TournamentActionGroup = "play" | "advance" | "start" | "roster" | "done";
export interface TournamentAction {
  group: TournamentActionGroup;
  /** Visible label of the primary action, e.g. "Prowadź mecze". */
  label: string;
  /** Short reason shown next to the action. */
  hint: string;
  href: string;
}

export const ACTION_GROUPS: ReadonlyArray<{ group: TournamentActionGroup; title: string }> = [
  { group: "play", title: "Do prowadzenia teraz" },
  { group: "advance", title: "Czekają na kolejny krok" },
  { group: "start", title: "Gotowe do startu" },
  { group: "roster", title: "Brakuje uczestników" },
  { group: "done", title: "Zakończone" },
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
  if (t.status === "completed") return { group: "done", label: "Zobacz wyniki", hint: "Turniej zakończony", href: base };
  if (t.status === "active") {
    if (a.liveMatchCount + a.readyMatchCount > 0) {
      const parts = [
        a.liveMatchCount ? plural(a.liveMatchCount, "mecz trwa", "mecze trwają", "meczów trwa") : "",
        a.readyMatchCount ? plural(a.readyMatchCount, "mecz gotowy", "mecze gotowe", "meczów gotowych") : "",
      ].filter(Boolean);
      return { group: "play", label: "Prowadź mecze", hint: parts.join(" · "), href: `${base}/host` };
    }
    return { group: "advance", label: "Następny krok", hint: "Brak meczów do rozegrania — rozpocznij rundę lub etap", href: `${base}/host` };
  }
  if (t.status === "draft") {
    if (a.playerCount >= 2) return { group: "start", label: "Uruchom turniej", hint: plural(a.playerCount, "uczestnik", "uczestników", "uczestników"), href: base };
    return { group: "roster", label: "Dodaj uczestników", hint: a.playerCount === 1 ? "Jest 1 uczestnik, potrzeba 2" : "Brak uczestników", href: `${base}?tab=players` };
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

const NAME_KEYS = ["name", "nick", "nazwa", "gracz", "zawodnik"];
const TEAM_KEYS = ["team", "druzyna", "drużyna"];
const SEED_KEYS = ["seed", "rozstawienie"];
const HEADER_WORDS = new Set([...NAME_KEYS, ...TEAM_KEYS, ...SEED_KEYS, "rank", "ranga", "country", "kraj"]);
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
    if (!name) row.error = "Brak nicku";
    else if (name.length > BULK_NAME_MAX) row.error = `Nick za długi (${name.length}/${BULK_NAME_MAX} znaków)`;
    else if (/[;,\t]/.test(name) || /[;,\t]/.test(team)) row.error = "Nick i drużyna nie mogą zawierać przecinka ani średnika";
    else if (seen.has(key)) row.error = "Powtórzony w tej liście";
    else if (existing.has(key)) row.error = "Już jest na liście turnieju";
    if (!row.error && seedText) {
      const seed = Number(seedText);
      if (!Number.isInteger(seed) || seed < 1 || seed > 999) row.error = `Rozstawienie „${seedText}” poza zakresem 1–999`;
      else if (seeds.has(seed)) row.error = `Rozstawienie ${seed} powtórzone`;
      else if (takenSeeds.has(seed)) row.error = `Rozstawienie ${seed} jest już zajęte na liście turnieju`;
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
  | "participantCount" | "qualificationMode" | "advancingCount" | "groupCount" | "qualifiersPerGroup">;
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
      label: `Koszyk ${b.ordinal}`,
      direct: b.participantIds.length,
      incoming: (routesTo.get(b.id) ?? []).reduce((sum, r) => sum + (quotaOf(basketById.get(r.sourceBasketId)) ?? 0), 0),
    }));
    let outgoing: StageMapLink[] = own
      .filter((b) => b.type === "output")
      .flatMap((b) => (routesFrom.get(b.id) ?? []).map((r): StageMapLink | null => {
        const target = byId.get(basketById.get(r.targetBasketId)?.stageId ?? -1);
        const label = b.qualifierCount === null && outputsPerStage.get(s.id) === 1 ? "Awans" : `Koszyk wyjściowy ${b.ordinal}`;
        return target ? { label, count: quotaOf(b), targetStageId: target.id, targetName: target.name } : null;
      }))
      .filter((l): l is StageMapLink => l !== null);
    const next = rail[index + 1];
    const advancing = advancingOf(s);
    // Without explicit basket routes, a qualifying stage feeds the next stage by position.
    if (outgoing.length === 0 && next && s.qualificationMode !== "none") {
      outgoing = [{ label: "Awans", count: advancing, targetStageId: next.id, targetName: next.name }];
    }
    const qualification =
      s.qualificationMode === "top_n_per_group" && s.qualifiersPerGroup
        ? `Awans: ${s.qualifiersPerGroup} najlepszych z każdej grupy${s.groupCount ? ` (${s.groupCount} gr.)` : ""}`
        : s.qualificationMode === "top_n" && s.advancingCount
          ? `Awans: ${s.advancingCount} najlepszych`
          : outgoing.length ? "Awans według koszyków" : next ? "Bez awansu do kolejnego etapu" : "Etap końcowy — wyłania zwycięzcę";
    const routedOut = outgoing.reduce((sum, l) => sum + (l.count ?? 0), 0);
    const eliminated =
      s.participantCount > 0 && outgoing.length > 0 && outgoing.every((l) => l.count !== null)
        ? Math.max(0, s.participantCount - routedOut)
        : null;
    return { ...item, participants: s.participantCount, groups: s.groupCount ?? null, qualification, inputs, outgoing, eliminated };
  });
}
