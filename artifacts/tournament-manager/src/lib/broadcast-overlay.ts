import { getLang, t as tr, stageLabel } from "@/i18n";
/**
 * V5.9 · broadcast overlays (OBS Browser Source). Pure model shared by the overlay page and the "Transmisja" panel.
 *
 * Overlays read only what the public API gives an anonymous viewer of a public tournament. The view models below
 * copy an explicit list of fields (names, scores, sets, status, round, schedule, table rows) — never notes, result
 * reasons, participant fields or anything about access. Results are the stored, official ones; nothing typed in an
 * organizer's browser reaches an overlay before it is saved.
 */
import type { MatchRules } from "@workspace/match-rules";

// ─── address (URL) ─────────────────────────────────────────────────────────

export type OverlayKind = "wynik" | "struktura" | "zapowiedz" | "zwyciezca";
export type OverlayPresetId = "arena" | "broadcast" | "minimal" | "sport" | "futuristic";

export interface OverlayConfig {
  tournamentId: number | null;
  kind: OverlayKind;
  /**
   * "ekran" follows the match the organizer puts "Na ekranie"; a number pins one match.
   * QW-07 · "auto" needs no choice at all: the match "Na ekranie" if there is one, otherwise the match being
   * played, otherwise the next ready one, otherwise the last result.
   */
  /** #324-L03b · "nastepny" = the next ready match (not the one being played); "ostatni" = the latest result. */
  match: "ekran" | "auto" | "nastepny" | "ostatni" | number;
  /** Structure view: stage id (null = the current stage). */
  stage: number | null;
  /** Structure view: one bracket round (null = the whole bracket / all groups). */
  round: number | null;
  /** Structure view: one group table by its label (null = all groups). */
  group: string | null;
  preset: OverlayPresetId;
  layout: "kompakt" | "pelny";
  scoreSize: "s" | "m" | "l";
  showTitle: boolean;
  background: "przezroczyste" | "pelne";
  motion: 0 | 1 | 2;
  textScale: 1 | 1.25 | 1.5;
  position: "dol" | "gora";
  /** Upcoming card: also list the next matches of the stage. */
  showQueue: boolean;
  /**
   * #324-L03b · on-air alerts (match end, advance, new stage, winner, corrected result). Off unless the address says
   * alerty=1 — the overlay's own setting, independent of the app and of the animation level.
   */
  alerts: boolean;
}

export const OVERLAY_DEFAULTS: Omit<OverlayConfig, "tournamentId"> = {
  kind: "wynik", match: "ekran" /* i18n-ignore */, stage: null, round: null, group: null, preset: "arena", layout: "pelny", scoreSize: "m",
  showTitle: true, background: "przezroczyste" /* i18n-ignore */, motion: 1, textScale: 1, position: "dol", showQueue: false, alerts: false,
};

export const OVERLAY_KINDS: { id: OverlayKind; label: string; description: string }[] = [
  { id: "wynik", get label() { return tr("broadcastOverlay.wynik"); }, get description() { return tr("broadcastOverlay.pasek_z_nazwami_i_wynikiem"); } },
  { id: "struktura", get label() { return tr("broadcastOverlay.tabela_i_drabinka"); }, get description() { return tr("broadcastOverlay.tabela_grupy_albo_drabinka_etapu"); } },
  { id: "zapowiedz", get label() { return tr("broadcastOverlay.zapowiedz"); }, get description() { return tr("broadcastOverlay.plansza_przed_meczem_kto_gra"); } },
  { id: "zwyciezca", get label() { return tr("broadcastOverlay.zwyciezca"); }, get description() { return tr("broadcastOverlay.zwyciezca_turnieju_po_jego_koncu"); } },
];

export const OVERLAY_PRESETS: { id: OverlayPresetId; label: string; description: string }[] = [
  { id: "arena", label: "Arena", get description() { return tr("broadcastOverlay.kolorowa_swiecaca_sciete_rogi_jak"); } },
  { id: "broadcast", label: "Broadcast", get description() { return tr("broadcastOverlay.pasek_telewizyjny_jasne_nazwy_ciemny"); } },
  { id: "minimal", label: "Minimal", get description() { return tr("broadcastOverlay.spokojne_szklo_cienka_typografia_bez"); } },
  { id: "sport", label: "Sport", get description() { return tr("broadcastOverlay.tablica_wynikow_mocne_kolory_druzyn"); } },
  { id: "futuristic", label: "Futuristic", get description() { return tr("broadcastOverlay.neonowe_linie_technologiczna_czcionka_si"); } },
];

export const OVERLAY_RESOLUTIONS = [
  { id: "1080p", width: 1920, height: 1080, label: "1920 × 1080 (Full HD)" },
  { id: "1440p", width: 2560, height: 1440, label: "2560 × 1440 (QHD)" },
] as const;

const PRESET_IDS = new Set(OVERLAY_PRESETS.map((preset) => preset.id));
const positiveInt = (value: string | null): number | null => {
  if (value == null || !/^\d{1,9}$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
};

/** Reads an overlay address. Unknown or broken values fall back to defaults; nothing in the URL is trusted further. */
export function parseOverlayParams(search: string | URLSearchParams): OverlayConfig {
  const p = typeof search === "string" ? new URLSearchParams(search) : search;
  const kind = p.get("widok");
  const preset = p.get("styl") as OverlayPresetId | null;
  const scale = Number(p.get("tekst"));
  // QW-07 fix: an address without "ruch" means the default (gentle) animation. Number(null) is 0, so before
  // this every default address was read as "no animation" and the panel wrote ruch=0 back after a reload.
  const motionText = p.get("ruch");
  const motion = motionText === "0" ? 0 : motionText === "2" ? 2 : 1;
  const group = p.get("grupa");
  return {
    tournamentId: positiveInt(p.get("t")),
    kind: kind === "struktura" || kind === "zapowiedz" || kind === "zwyciezca" ? kind : "wynik" /* i18n-ignore */,
    match: MATCH_WORDS.has(p.get("mecz") ?? "") ? (p.get("mecz") as "auto" | "nastepny" | "ostatni") : positiveInt(p.get("mecz")) ?? "ekran" /* i18n-ignore */,
    stage: positiveInt(p.get("etap")),
    round: positiveInt(p.get("runda")),
    group: group && group.length <= 40 ? group : null,
    preset: preset && PRESET_IDS.has(preset) ? preset : OVERLAY_DEFAULTS.preset,
    layout: p.get("uklad") === "kompakt" /* i18n-ignore */ ? "kompakt" : "pelny",
    scoreSize: p.get("rozmiar") === "s" || p.get("rozmiar") === "l" ? (p.get("rozmiar") as "s" | "l") : "m",
    showTitle: p.get("tytul") !== "0",
    background: p.get("tlo") === "pelne" ? "pelne" : "przezroczyste" /* i18n-ignore */,
    motion,
    textScale: scale === 1.25 || scale === 1.5 ? scale : 1,
    position: p.get("pozycja") === "gora" ? "gora" : "dol",
    showQueue: p.get("kolejka") === "1",
    alerts: p.get("alerty") === "1",
  };
}

const MATCH_WORDS = new Set(["auto", "nastepny", "ostatni" /* i18n-ignore */]);

/** The overlay address for a configuration — only non-default values are written, so links stay short. */
export function overlayUrl(origin: string, basePath: string, config: OverlayConfig): string {
  const p = new URLSearchParams();
  if (config.tournamentId != null) p.set("t", String(config.tournamentId));
  if (config.kind !== OVERLAY_DEFAULTS.kind) p.set("widok" /* i18n-ignore */, config.kind);
  if (config.kind !== "struktura" && config.kind !== "zwyciezca" && config.match !== "ekran") p.set("mecz" /* i18n-ignore */, String(config.match));
  if (config.kind === "struktura") {
    if (config.stage != null) p.set("etap" /* i18n-ignore */, String(config.stage));
    if (config.round != null) p.set("runda" /* i18n-ignore */, String(config.round));
    if (config.group) p.set("grupa" /* i18n-ignore */, config.group);
  }
  if (config.preset !== OVERLAY_DEFAULTS.preset) p.set("styl" /* i18n-ignore */, config.preset);
  if (config.layout !== OVERLAY_DEFAULTS.layout) p.set("uklad", config.layout);
  if (config.scoreSize !== OVERLAY_DEFAULTS.scoreSize) p.set("rozmiar" /* i18n-ignore */, config.scoreSize);
  if (!config.showTitle) p.set("tytul", "0");
  if (config.background !== OVERLAY_DEFAULTS.background) p.set("tlo", config.background);
  if (config.motion !== OVERLAY_DEFAULTS.motion) p.set("ruch" /* i18n-ignore */, String(config.motion));
  if (config.textScale !== OVERLAY_DEFAULTS.textScale) p.set("tekst" /* i18n-ignore */, String(config.textScale));
  if (config.position !== OVERLAY_DEFAULTS.position) p.set("pozycja" /* i18n-ignore */, config.position);
  if (config.kind === "zapowiedz" && config.showQueue) p.set("kolejka" /* i18n-ignore */, "1");
  if (config.alerts && config.kind !== "struktura") p.set("alerty" /* i18n-ignore */, "1");
  // #323-E: OBS has its own storage, so the overlay follows the language the organizer works in (Polish needs nothing)
  if (getLang() !== "pl") p.set("lang", getLang());
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${origin}${base}overlay.html?${p.toString()}`;
}

// ─── public data (only the fields an overlay uses) ─────────────────────────

export interface PublicTournament {
  id: number;
  name: string;
  status: string;
  featuredMatchId: number | null;
  activeStageId: number | null;
  participantType: "players" | "teams";
  winnerId: number | null;
}

export interface PublicStage {
  id: number;
  name: string;
  position: number;
  format: string;
  status: string;
  bestOf: number;
  matchRules: MatchRules | null;
  allowDraws: boolean;
  scheduleTimeZone: string | null;
}

export interface PublicMatch {
  id: number;
  stageId: number;
  stageGroupId: number | null;
  round: number;
  matchNumber: number;
  sortOrder: number | null;
  player1Name: string | null;
  player2Name: string | null;
  player1Id: number | null;
  player2Id: number | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  resultType: string | null;
  bestOf: number;
  status: string;
  sets: { score1: number; score2: number }[] | null;
  scheduledAt: string | null;
  /** QW-07 · when the result was saved; only used to find the latest result. */
  completedAt?: string | null;
}

type Raw = Record<string, unknown>;
const str = (value: unknown): string | null => (typeof value === "string" ? value : null);
const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

export function toPublicTournament(raw: Raw): PublicTournament {
  return {
    id: num(raw.id) ?? 0,
    name: str(raw.name) ?? "",
    status: str(raw.status) ?? "",
    featuredMatchId: num(raw.featuredMatchId),
    activeStageId: num(raw.activeStageId),
    participantType: raw.participantType === "teams" ? "teams" : "players",
    winnerId: num(raw.winnerId),
  };
}

export function toPublicStage(raw: Raw): PublicStage {
  const league = raw.leagueRules as { allowDraws?: unknown } | null | undefined;
  const rules = raw.matchRules as MatchRules | null | undefined;
  return {
    id: num(raw.id) ?? 0,
    name: str(raw.name) ?? "",
    position: num(raw.position) ?? 0,
    format: str(raw.format) ?? "",
    status: str(raw.status) ?? "",
    bestOf: num(raw.bestOf) ?? 1,
    matchRules: rules && typeof rules === "object" && (rules as { kind?: unknown }).kind === "sets" ? rules : null,
    allowDraws: league?.allowDraws === true,
    scheduleTimeZone: str(raw.scheduleTimeZone),
  };
}

export function toPublicMatch(raw: Raw): PublicMatch {
  const sets = Array.isArray(raw.sets)
    ? (raw.sets as unknown[]).flatMap((set) => {
        const s = set as Raw;
        const a = num(s?.score1);
        const b = num(s?.score2);
        return a != null && b != null ? [{ score1: a, score2: b }] : [];
      })
    : null;
  return {
    id: num(raw.id) ?? 0,
    stageId: num(raw.stageId) ?? 0,
    stageGroupId: num(raw.stageGroupId),
    round: num(raw.round) ?? 0,
    matchNumber: num(raw.matchNumber) ?? 0,
    sortOrder: num(raw.sortOrder),
    player1Name: str(raw.player1Name),
    player2Name: str(raw.player2Name),
    player1Id: num(raw.player1Id),
    player2Id: num(raw.player2Id),
    score1: num(raw.score1),
    score2: num(raw.score2),
    winnerId: num(raw.winnerId),
    resultType: str(raw.resultType),
    bestOf: num(raw.bestOf) ?? 1,
    status: str(raw.status) ?? "",
    sets: sets && sets.length ? sets : null,
    scheduledAt: str(raw.scheduledAt),
    completedAt: str(raw.completedAt),
  };
}

// ─── wording ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  get in_progress() { return tr("broadcastOverlay.na_zywo"); },
  get completed() { return tr("broadcastOverlay.zakonczony"); },
  get pending() { return tr("broadcastOverlay.przed_meczem"); },
  get postponed() { return tr("broadcastOverlay.przelozony"); },
  get cancelled() { return tr("broadcastOverlay.odwolany"); },
};

export const FORMAT_LABELS: Record<string, string> = {
  get single_elimination() { return tr("broadcastOverlay.drabinka_pucharowa"); },
  get double_elimination() { return tr("broadcastOverlay.podwojna_eliminacja"); },
  get swiss() { return tr("broadcastOverlay.system_szwajcarski"); },
  get round_robin() { return tr("broadcastOverlay.liga"); },
  get group_stage() { return tr("broadcastOverlay.faza_grupowa"); },
};

/** How long the match is, in the same words as the rest of the app (the engine's own summary for sets). */
export function matchFormatText(match: Pick<PublicMatch, "bestOf">, stage: Pick<PublicStage, "matchRules" | "allowDraws"> | null): string {
  const rules = stage?.matchRules;
  if (rules?.kind === "sets") return `${rules.setsToWin === 1 ? tr("broadcastOverlay.jeden_set") : tr("broadcastOverlay.do_setstowin_wygranych_setow", { setsToWin: rules.setsToWin })} · set do ${rules.pointsPerSet}`;
  if (stage?.allowDraws) return tr("broadcastOverlay.mecz_ligowy_remis_mozliwy");
  return match.bestOf <= 1 ? tr("broadcastOverlay.jedna_gra") : tr("broadcastOverlay.do_v0_wygranych", { v0: Math.ceil(match.bestOf / 2) });
}

/** Name of a bracket round counted from the final: Finał, Półfinał, Ćwierćfinał, 1/8 finału… */
export function eliminationRoundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return tr("broadcastOverlay.final");
  if (fromEnd === 1) return tr("broadcastOverlay.polfinal");
  if (fromEnd === 2) return tr("broadcastOverlay.cwiercfinal");
  if (fromEnd > 2) return tr("broadcastOverlay.1_v0_finalu", { v0: 2 ** fromEnd });
  return tr("broadcastOverlay.runda_round", { round: round });
}

/** "Faza grupowa · Runda 2", "Play-off · Półfinał" — the stage name is not repeated when it is the format name. */
export function stageRoundText(match: PublicMatch, stage: PublicStage | null, stageMatches: readonly PublicMatch[]): string {
  if (!stage) return tr("broadcastOverlay.runda_round", { round: match.round });
  const rounds = Math.max(1, ...stageMatches.map((m) => m.round));
  const roundText = stage.format === "single_elimination" ? eliminationRoundName(match.round, rounds) : tr("broadcastOverlay.runda_round", { round: match.round });
  return `${stageLabel(stage.name)} · ${roundText}`;
}

// ─── match card (score overlay) ────────────────────────────────────────────

export interface MatchCard {
  matchId: number;
  side1: string;
  side2: string;
  score1: string;
  score2: string;
  /** "sety" for set matches (the big number counts sets, never maps or games). */
  scoreUnit: "sety" | null;
  sets: { score1: number; score2: number; winner: 1 | 2 | 0 }[];
  status: string;
  live: boolean;
  winner: 1 | 2 | 0;
  /** W.O., BYE, N/C or "remis" when that is the result. */
  resultNote: string | null;
  format: string;
  context: string;
  scheduledAt: string | null;
  /** V5.9.1 · a stored score exists (before that the score box says "VS", never an empty "– : –"). */
  hasScore: boolean;
  /** V5.9.1 · plain match state for headings and styling. */
  state: "pending" | "live" | "completed" | "postponed" | "cancelled";
  /** V5.9.1 · how much room a name needs: long names get a smaller size and may take two lines (never cut to "…"). */
  fit1: NameFit;
  fit2: NameFit;
}

export type NameFit = "normal" | "long" | "xlong";
/** Long names are shown smaller and on up to two lines; the thresholds follow the bar's name width at 1080p. */
export function nameFit(name: string): NameFit {
  const length = [...name.trim()].length;
  return length > 30 ? "xlong" : length > 18 ? "long" : "normal";
}

/** Heading of the upcoming card for the match's real state (a postponed match is never "the next match"). */
export function upcomingHeading(card: Pick<MatchCard, "state">): string {
  return card.state === "live" ? tr("broadcastOverlay.teraz_gramy") : card.state === "completed" ? tr("broadcastOverlay.wynik_meczu") : card.state === "postponed" ? tr("broadcastOverlay.mecz_przelozony")
    : card.state === "cancelled" ? tr("broadcastOverlay.mecz_odwolany") : tr("broadcastOverlay.nastepny_mecz");
}

export function matchCard(match: PublicMatch, stage: PublicStage | null, stageMatches: readonly PublicMatch[], teams: boolean): MatchCard {
  const tbd = teams ? tr("broadcastOverlay.druzyna_do_ustalenia") : tr("broadcastOverlay.do_ustalenia");
  const played = match.status === "completed" || match.status === "in_progress";
  const hasScore = match.score1 != null && match.score2 != null && (match.status === "completed" || (match.score1 ?? 0) + (match.score2 ?? 0) > 0);
  const winner: 1 | 2 | 0 = match.winnerId != null && match.winnerId === match.player1Id ? 1 : match.winnerId != null && match.winnerId === match.player2Id ? 2 : 0;
  const resultNote = match.resultType === "walkover" ? tr("broadcastOverlay.walkower") : match.resultType === "bye" ? tr("broadcastOverlay.wolny_los") : match.resultType === "no_contest" ? tr("broadcastOverlay.bez_wyniku")
    : match.status === "completed" && match.resultType === "played" && winner === 0 && match.score1 != null && match.score1 === match.score2 ? tr("broadcastOverlay.remis") : null;
  const side1 = match.player1Name ?? tbd;
  const side2 = match.player2Name ?? tbd;
  const state = match.status === "in_progress" ? "live" : match.status === "completed" ? "completed" : match.status === "postponed" ? "postponed"
    : match.status === "cancelled" ? "cancelled" : "pending";
  return {
    matchId: match.id,
    side1,
    side2,
    state,
    hasScore: played && hasScore,
    fit1: nameFit(side1),
    fit2: nameFit(side2),
    score1: played && hasScore ? String(match.score1) : "–",
    score2: played && hasScore ? String(match.score2) : "–",
    scoreUnit: stage?.matchRules ? "sety" /* i18n-ignore */ : null,
    sets: (match.sets ?? []).map((set) => ({ ...set, winner: set.score1 > set.score2 ? 1 : set.score2 > set.score1 ? 2 : 0 })),
    status: STATUS_LABELS[match.status] ?? match.status,
    live: match.status === "in_progress",
    winner,
    resultNote,
    format: matchFormatText(match, stage),
    context: stageRoundText(match, stage, stageMatches),
    scheduledAt: match.scheduledAt,
  };
}

const overlayTime = (value: string | null | undefined) => (value ? Date.parse(value) : Number.NaN);
const overlayEngineOrder = (a: PublicMatch, b: PublicMatch) =>
  a.round - b.round || (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.matchNumber - b.matchNumber || a.id - b.id;

/**
 * QW-07 · the current match without any setup, from public statuses only (the same rules as the viewer's
 * NOW / NEXT / RECENT, see audience-now.ts): the organizer's "Na ekranie" choice always wins; then a match marked
 * in progress; then the next ready match of the current stage (scheduled ones first, by their real time); then the
 * latest saved result. Byes are never shown. Nothing is guessed: with no such match the overlay says why.
 */
export function pickCurrentMatch(tournament: PublicTournament, matches: readonly PublicMatch[]):
  { match: PublicMatch } | { match: null; reason: string } {
  const real = matches.filter((m) => m.resultType !== "bye");
  const featured = tournament.featuredMatchId != null ? matches.find((m) => m.id === tournament.featuredMatchId) : undefined;
  if (featured) return { match: featured };
  const live = real.filter((m) => m.status === "in_progress").sort(overlayEngineOrder)[0];
  if (live) return { match: live };
  const next = nextReadyMatch(tournament, matches);
  if (next) return { match: next };
  const last = lastCompletedMatch(matches);
  if (last) return { match: last };
  return { match: null, reason: tournament.status === "draft" ? tr("broadcastOverlay.turniej_jeszcze_sie_nie_rozpoczal") : tr("broadcastOverlay.na_razie_zaden_mecz_nie") };
}

/** The next ready match of the current stage (scheduled ones first, by their real time); never one being played. */
export function nextReadyMatch(tournament: PublicTournament, matches: readonly PublicMatch[]): PublicMatch | null {
  if (tournament.status === "draft" || tournament.status === "completed") return null;
  const ready = matches.filter((m) => m.resultType !== "bye" && m.status === "pending" && m.player1Id != null && m.player2Id != null);
  const inStage = ready.filter((m) => tournament.activeStageId == null || m.stageId === tournament.activeStageId);
  return (inStage.length ? inStage : ready).sort((a, b) => {
    const ta = overlayTime(a.scheduledAt), tb = overlayTime(b.scheduledAt);
    if (!Number.isNaN(ta) || !Number.isNaN(tb)) {
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      if (ta !== tb) return ta - tb;
    }
    return overlayEngineOrder(a, b);
  })[0] ?? null;
}

/** The latest saved result (byes never count). */
export function lastCompletedMatch(matches: readonly PublicMatch[]): PublicMatch | null {
  return matches.filter((m) => m.resultType !== "bye" && m.status === "completed").sort((a, b) => {
    const ta = overlayTime(a.completedAt), tb = overlayTime(b.completedAt);
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
    if (Number.isNaN(ta) !== Number.isNaN(tb)) return Number.isNaN(ta) ? 1 : -1;
    return overlayEngineOrder(b, a);
  })[0] ?? null;
}

/** The match an overlay shows: the pinned one, the one the organizer puts "Na ekranie", or (QW-07) the current one. */
export function pickOverlayMatch(config: Pick<OverlayConfig, "match">, tournament: PublicTournament, matches: readonly PublicMatch[]):
  { match: PublicMatch } | { match: null; reason: string } {
  if (config.match === "auto") return pickCurrentMatch(tournament, matches);
  if (config.match === "nastepny") {
    const next = nextReadyMatch(tournament, matches);
    return next ? { match: next } : { match: null, reason: tournament.status === "completed" ? tr("broadcastOverlay.turniej_jest_zakonczony") : tr("broadcastOverlay.na_razie_zaden_kolejny_mecz") };
  }
  if (config.match === "ostatni") {
    const last = lastCompletedMatch(matches);
    return last ? { match: last } : { match: null, reason: tr("broadcastOverlay.nie_ma_jeszcze_zapisanych_wynikow") };
  }
  const id = config.match === "ekran" ? tournament.featuredMatchId : config.match;
  if (id == null) return { match: null, reason: tr("broadcastOverlay.zaden_mecz_nie_jest_teraz") };
  const match = matches.find((candidate) => candidate.id === id);
  return match ? { match } : { match: null, reason: tr("broadcastOverlay.wybranego_meczu_nie_ma_w") };
}

/**
 * Next matches of the same stage that are still to be played, in the organizer's order (as in the host queue).
 * V5.9.1: postponed and cancelled matches are left out — on air "Kolejne mecze" must not list a match without a date.
 */
export function upcomingQueue(current: PublicMatch | null, matches: readonly PublicMatch[], limit = 3): PublicMatch[] {
  const stageId = current?.stageId;
  return matches
    .filter((m) => (stageId == null || m.stageId === stageId) && m.id !== current?.id && m.status === "pending" && m.player1Name && m.player2Name)
    .sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.round - b.round || a.matchNumber - b.matchNumber || a.id - b.id)
    .slice(0, limit);
}

/** "czw 26 lis, 18:00" in the stage's time zone (or the viewer's when the stage has none). */
export function scheduleText(iso: string | null, timeZone: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", ...(timeZone ? { timeZone } : {}) }).format(date);
  } catch {
    return new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  }
}

// ─── structure (bracket / tables) ──────────────────────────────────────────

export interface StructureTableRow { rank: number; name: string; played: number; wins: number; draws: number; losses: number; points: number | null; diff: number; zone: string }
export interface StructureTable { label: string; rows: StructureTableRow[] }
export interface BracketRound { round: number; name: string; matches: MatchCard[]; /** 2 when a round has more than 8 matches. */ columns: 1 | 2 }
export interface DoubleMatch { name: string; side1: string; side2: string; score1: string; score2: string; winner: 1 | 2 | 0; live: boolean }
/** V5.9.1 · each part of a double-elimination bracket is drawn as columns of rounds, like the bracket itself. */
export interface DoubleSection { id: "upper" | "lower" | "final"; label: string; rounds: { round: number; matches: DoubleMatch[] }[] }

export type StructureView =
  | { kind: "bracket"; title: string; rounds: BracketRound[]; fragment: string | null }
  | { kind: "double"; title: string; sections: DoubleSection[] }
  | { kind: "tables"; title: string; tables: StructureTable[]; showDraws: boolean; showPoints: boolean; fragment: string | null }
  | { kind: "empty"; title: string; message: string };

/** The stage an overlay shows: the chosen one, else the active one, else the last started, else the first. */
export function pickStage(stages: readonly PublicStage[], chosen: number | null, activeStageId: number | null): PublicStage | null {
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  return ordered.find((s) => s.id === chosen) ?? ordered.find((s) => s.id === activeStageId)
    ?? [...ordered].reverse().find((s) => s.status !== "planned") ?? ordered[0] ?? null;
}

/** More matches than this and the overlay shows the current part of the bracket instead of all of it. */
export const BRACKET_FULL_LIMIT = 15;

/**
 * Bracket of a single-elimination stage. With a round chosen: only that round. Without one, a small bracket is shown
 * whole; a large one (more than 15 matches, e.g. 32 players) from the current round on, at most three rounds, so it
 * stays readable in a 1080p source instead of being squeezed. A round with more than 8 matches takes two columns.
 */
export function bracketView(stage: PublicStage, stageMatches: readonly PublicMatch[], round: number | null, teams: boolean): StructureView {
  if (!stageMatches.length) return { kind: "empty", title: stageLabel(stage.name), message: tr("broadcastOverlay.drabinka_pojawi_sie_po_rozpoczeciu") };
  const total = Math.max(...stageMatches.map((m) => m.round));
  const all = [...new Set(stageMatches.map((m) => m.round))].sort((a, b) => a - b);
  let visible = round != null ? all.filter((r) => r === round) : all;
  let fragment: string | null = round != null ? eliminationRoundName(round, total) : null;
  if (round == null && stageMatches.length > BRACKET_FULL_LIMIT) {
    const open = stageMatches.filter((m) => m.status !== "completed" && m.status !== "cancelled").map((m) => m.round);
    const current = open.length ? Math.min(...open) : total;
    visible = all.filter((r) => r >= current).slice(0, 3);
    if (visible[0] !== all[0]) fragment = `od: ${eliminationRoundName(visible[0], total)}`;
  }
  const rounds: BracketRound[] = visible.map((r) => {
    const matches = stageMatches.filter((m) => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber).map((m) => matchCard(m, stage, stageMatches, teams));
    return { round: r, name: eliminationRoundName(r, total), matches, columns: matches.length > 8 ? 2 : 1 };
  });
  if (!rounds.length) return { kind: "empty", title: stageLabel(stage.name), message: tr("broadcastOverlay.etap_nie_ma_rundy_round", { round: round }) };
  return { kind: "bracket", title: stageLabel(stage.name), rounds, fragment };
}

/** Group / league / Swiss tables exactly as the engine ranks them (live standings endpoint). */
export function tablesView(stage: PublicStage, standings: { tables?: unknown[] } | null, group: string | null): StructureView {
  const tables = (standings?.tables ?? []).map((raw) => {
    const t = raw as Raw;
    return {
      label: str(t.label) ?? "",
      rows: ((t.rows as Raw[] | undefined) ?? []).map((r) => ({
        rank: num(r.rank) ?? 0, name: str(r.playerName) ?? "", played: num(r.played) ?? 0, wins: num(r.wins) ?? 0,
        draws: num(r.draws) ?? 0, losses: num(r.losses) ?? 0, points: num(r.points), diff: num(r.diff) ?? 0, zone: str(r.zone) ?? "none",
      })),
    };
  });
  const chosen = group ? tables.filter((t) => t.label === group) : tables;
  if (!chosen.length) return { kind: "empty", title: stageLabel(stage.name), message: group ? tr("broadcastOverlay.nie_ma_grupy_group", { group: group }) : tr("broadcastOverlay.tabela_pojawi_sie_po_rozpoczeciu") };
  return {
    kind: "tables", title: stageLabel(stage.name), tables: chosen,
    showDraws: stage.allowDraws || chosen.some((t) => t.rows.some((r) => r.draws > 0)),
    showPoints: chosen.some((t) => t.rows.some((r) => r.points != null)),
    fragment: group,
  };
}

const DE_LABELS: Record<string, string> = { get upper() { return tr("broadcastOverlay.drabinka_wygranych"); }, get lower() { return tr("broadcastOverlay.drabinka_przegranych"); }, get grand_final() { return tr("broadcastOverlay.wielki_final"); }, get grand_final_reset() { return tr("broadcastOverlay.wielki_final"); } };
/** Same display names as the Experimental double-elimination view (the engine's names stay as stored). */
export function deMatchName(name: string): string {
  if (name === "Grand Final Reset") return tr("broadcastOverlay.rewanz_w_wielkim_finale");
  if (name === "Grand Final") return tr("broadcastOverlay.wielki_final");
  return name.replace(/^Upper R(\d+)/, "Wygrani R$1").replace(/^Lower R(\d+)/, "Przegrani R$1");
}

/** Double elimination: upper, lower and final sections from the stage's double-elimination state. */
export function doubleView(stage: PublicStage, state: { participants?: unknown[]; matches?: unknown[] } | null, round: number | null): StructureView {
  if (!state?.matches?.length) return { kind: "empty", title: stageLabel(stage.name), message: tr("broadcastOverlay.drabinka_pojawi_sie_po_rozpoczeciu") };
  const names = new Map(((state.participants ?? []) as Raw[]).map((p) => [str(p.participantKey) ?? "", str(p.name) ?? ""]));
  const sections: DoubleSection[] = (["upper", "lower", "final"] as const).map((id) => {
    const list = ((state.matches ?? []) as Raw[])
      .filter((m) => (id === "final" ? String(m.bracket).startsWith("grand_final") : m.bracket === id) && (round == null || id === "final" || m.round === round))
      .filter((m) => !(m.bracket === "grand_final_reset" && m.status === "blocked"))
      .sort((a, b) => (num(a.order) ?? 0) - (num(b.order) ?? 0));
    const byRound = new Map<number, DoubleMatch[]>();
    for (const m of list) {
      const slots = (m.slots as (string | null)[] | undefined) ?? [];
      const done = m.status === "completed";
      const key = id === "final" ? 1 : num(m.round) ?? 1;
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key)!.push({
        name: deMatchName(str(m.name) ?? ""),
        side1: slots[0] ? names.get(slots[0]) ?? "?" : tr("broadcastOverlay.do_ustalenia"),
        side2: slots[1] ? names.get(slots[1]) ?? "?" : tr("broadcastOverlay.do_ustalenia"),
        score1: done || m.status === "in_progress" ? String(num(m.score1) ?? "–") : "–",
        score2: done || m.status === "in_progress" ? String(num(m.score2) ?? "–") : "–",
        winner: (m.winnerParticipantKey && m.winnerParticipantKey === slots[0] ? 1 : m.winnerParticipantKey && m.winnerParticipantKey === slots[1] ? 2 : 0) as 1 | 2 | 0,
        live: m.status === "in_progress",
      });
    }
    return { id, label: id === "final" ? tr("broadcastOverlay.wielki_final") : DE_LABELS[id], rounds: [...byRound.entries()].sort((a, b) => a[0] - b[0]).map(([r, matches]) => ({ round: r, matches })) };
  }).filter((section) => section.rounds.length);
  return { kind: "double", title: stageLabel(stage.name), sections };
}

// ─── V5.9.1 · what the score / upcoming overlay shows (compared as a whole: unrelated changes do not re-render) ─────

export interface MatchOverlayModel {
  title: string;
  card: MatchCard | null;
  /** Why nothing is shown (no match "Na ekranie", unknown match). */
  reason: string | null;
  timeZone: string | null;
  queue: { id: number; side1: string; side2: string }[];
}

export function matchOverlayModel(
  config: Pick<OverlayConfig, "match" | "kind" | "showQueue">,
  tournament: PublicTournament,
  matches: readonly PublicMatch[],
  stages: readonly PublicStage[],
): MatchOverlayModel {
  const picked = pickOverlayMatch(config, tournament, matches);
  if (!picked.match) return { title: tournament.name, card: null, reason: picked.reason, timeZone: null, queue: [] };
  const match = picked.match;
  const stage = stages.find((s) => s.id === match.stageId) ?? null;
  const stageMatches = matches.filter((m) => m.stageId === match.stageId);
  return {
    title: tournament.name,
    card: matchCard(match, stage, stageMatches, tournament.participantType === "teams"),
    reason: null,
    timeZone: stage?.scheduleTimeZone ?? null,
    queue: config.kind === "zapowiedz" && config.showQueue
      ? upcomingQueue(match, matches).map((m) => ({ id: m.id, side1: m.player1Name ?? "", side2: m.player2Name ?? "" }))
      : [],
  };
}

// ─── #324-L03b · winner card ────────────────────────────────────────────────

export interface WinnerModel {
  title: string;
  /** "Zwycięzca turnieju" once the tournament is completed with a winner, otherwise "Zwycięzca meczu". */
  heading: string;
  name: string | null;
  detail: string | null;
  champion: boolean;
  reason: string | null;
}

/** The tournament winner when the engine has one; before that, the winner of the latest result. Never guessed. */
export function winnerModel(tournament: PublicTournament, matches: readonly PublicMatch[], stages: readonly PublicStage[]): WinnerModel {
  const nameById = (id: number | null) => (id == null ? null
    : matches.map((m) => (m.player1Id === id ? m.player1Name : m.player2Id === id ? m.player2Name : null)).find(Boolean) ?? null);
  if (tournament.status === "completed" && tournament.winnerId != null) {
    const name = nameById(tournament.winnerId);
    if (name) return { title: tournament.name, heading: tr("broadcastOverlay.zwyciezca_turnieju"), name, detail: tournament.name, champion: true, reason: null };
  }
  const last = lastCompletedMatch(matches.filter((m) => m.winnerId != null));
  if (!last) return { title: tournament.name, heading: tr("broadcastOverlay.zwyciezca_meczu"), name: null, detail: null, champion: false, reason: tr("broadcastOverlay.zwyciezca_pojawi_sie_po_pierwszym") };
  const winner = last.winnerId === last.player1Id ? last.player1Name : last.player2Name;
  const loser = last.winnerId === last.player1Id ? last.player2Name : last.player1Name;
  const stage = stages.find((s) => s.id === last.stageId) ?? null;
  const score = last.resultType === "walkover" ? tr("broadcastOverlay.walkower_2") : `${last.winnerId === last.player1Id ? last.score1 : last.score2}:${last.winnerId === last.player1Id ? last.score2 : last.score1}`;
  const context = stageRoundText(last, stage, matches.filter((m) => m.stageId === last.stageId));
  return { title: tournament.name, heading: tr("broadcastOverlay.zwyciezca_meczu"), name: winner, detail: `${score}${loser ? ` z ${loser}` : ""} · ${context}`, champion: false, reason: null };
}
