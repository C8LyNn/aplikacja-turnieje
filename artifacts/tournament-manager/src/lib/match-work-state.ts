import { getLang, t } from "@/i18n";
/**
 * V5.6 · the work state of one match for the organiser: what it is waiting for, why, and the one concrete action.
 *
 * The rule mirrors the API (`scheduleStateOf`, league schedule): a planned start that passed today means the
 * match should be under way ("start minął") — not that the result is missing. A result is expected once the
 * match was started, or once its planned day is over on the league's calendar (stage time zone).
 */
export const DEFAULT_LEAGUE_TIME_ZONE = "Europe/Warsaw";

export type MatchWorkState =
  | "needs_result"
  | "in_progress"
  | "due"
  | "ready"
  | "postponed"
  | "waiting"
  | "completed"
  | "cancelled";

export type MatchWorkActionKind = "start" | "enter_result" | "restore" | "correct" | "none";

export interface MatchWorkInfo {
  state: MatchWorkState;
  label: string;
  /** One short sentence: why the match is in this state. */
  reason: string;
  /** The concrete next action (the button the organiser presses). */
  action: { kind: MatchWorkActionKind; label: string };
  /** Planned start in the league's calendar, when the match has one. */
  slot: { date: string; time: string } | null;
  /** V5.11: true when the reason only says "no date, play any time" — lists may leave it out. */
  routine?: boolean;
}

export interface MatchWorkInput {
  status: string;
  player1Id?: number | null;
  player2Id?: number | null;
  scheduledAt?: string | null;
  resultType?: string | null;
  /** V5.10: both legs of a two-legged tie (each with its own date) and the aggregate state. */
  legs?: Array<{ leg: number; status: string; scheduledAt?: string | null }> | null;
  tie?: { state: string; total1: number; total2: number } | null;
}

export const WORK_STATE_LABELS: Record<MatchWorkState, string> = {
  get needs_result() { return t("matchWorkState.czeka_na_wynik"); },
  get in_progress() { return t("matchWorkState.w_trakcie"); },
  get due() { return t("matchWorkState.start_minal"); },
  get ready() { return t("matchWorkState.gotowy"); },
  get postponed() { return t("matchWorkState.przelozony"); },
  get waiting() { return t("matchWorkState.czeka_na_pare"); },
  get completed() { return t("matchWorkState.zakonczony"); },
  get cancelled() { return t("matchWorkState.anulowany"); },
};

/** Order of the work queue: what blocks the table first. */
export const WORK_STATE_ORDER: readonly MatchWorkState[] = [
  "needs_result", "in_progress", "due", "ready", "postponed", "waiting", "completed", "cancelled",
];

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function partsIn(instant: Date, timeZone: string): { date: string; time: string } {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      formatter = new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_LEAGUE_TIME_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
    formatterCache.set(timeZone, formatter);
  }
  const values = Object.fromEntries(formatter.formatToParts(instant).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
}

// Polish keeps its compact "sb 5 gru"; other languages use Intl ("Sat 5 Dec"). i18n-ignore below: Polish-only data.
const WEEKDAYS = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"]; // i18n-ignore
const MONTHS = ["sty", "lut", "mar", "kwi", "maja", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]; // i18n-ignore
const EN_SLOT = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "sb 5 gru, 18:00" — a local league date and time exactly as given (no browser re-conversion). */
export function formatLocalSlot(localDate: string | null | undefined, localTime?: string | null): string {
  if (!localDate) return t("matchWorkState.bez_terminu");
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  const time = localTime ? `, ${localTime}` : "";
  if (getLang() !== "pl") return `${EN_SLOT.format(date).replace(/,/g, "")}${time}`;
  return `${WEEKDAYS[date.getUTCDay()]} ${day} ${MONTHS[month! - 1]}${time}`;
}

export function matchWorkState(
  match: MatchWorkInput,
  options: { now?: Date; timeZone?: string | null; canStart?: boolean } = {},
): MatchWorkInfo {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone || DEFAULT_LEAGUE_TIME_ZONE;
  const planned = match.scheduledAt ? new Date(match.scheduledAt) : null;
  const slot = planned && !Number.isNaN(planned.getTime()) ? partsIn(planned, timeZone) : null;
  const today = partsIn(now, timeZone).date;
  const dayOver = !!slot && slot.date < today;
  const enter = { kind: "enter_result" as const, label: t("matchWorkState.wpisz_wynik") };
  const info = (state: MatchWorkState, reason: string, action: MatchWorkInfo["action"]): MatchWorkInfo =>
    ({ state, label: WORK_STATE_LABELS[state], reason, action, slot });

  if (match.status === "completed") {
    return info("completed", match.resultType === "bye" ? t("matchWorkState.wolny_los_awans_bez_meczu") : t("matchWorkState.wynik_jest_zapisany"),
      match.resultType === "bye" ? { kind: "none", label: "" } : { kind: "correct", label: t("matchWorkState.popraw_wynik") });
  }
  if (match.status === "cancelled") return info("cancelled", t("matchWorkState.mecz_anulowany_nie_liczy_sie"), { kind: "restore", label: t("matchWorkState.przywroc_do_kolejki") });
  if (match.legs && match.legs.length === 2 && match.tie) {
    // V5.10: a two-legged tie is worked leg by leg: no "start", each leg has its own date.
    if (!match.player1Id || !match.player2Id) return info("waiting", t("matchWorkState.para_dwumeczu_ustali_sie_po"), { kind: "none", label: "" });
    const enterLeg = { kind: "enter_result" as const, label: t("matchWorkState.wpisz_wynik_spotkania") };
    if (match.tie.state === "awaiting_decision") {
      return info("needs_result", match.tie.total1 === match.tie.total2
        ? t("matchWorkState.oba_spotkania_rozegrane_suma_total1", { total1: match.tie.total1, total2: match.tie.total2 })
        : t("matchWorkState.oba_spotkania_rozegrane_zatwierdz_awans", { total1: match.tie.total1, total2: match.tie.total2 }), { kind: "enter_result", label: t("matchWorkState.rozstrzygnij_awans") });
    }
    const next = match.legs.slice().sort((left, right) => left.leg - right.leg).find((leg) => leg.status !== "completed");
    const nextPlanned = next?.scheduledAt ? new Date(next.scheduledAt) : null;
    const nextSlot = nextPlanned && !Number.isNaN(nextPlanned.getTime()) ? partsIn(nextPlanned, timeZone) : null;
    const legInfo = (state: MatchWorkState, reason: string): MatchWorkInfo => ({ state, label: WORK_STATE_LABELS[state], reason, action: enterLeg, slot: nextSlot });
    const sum = match.tie.state === "first_leg_played" ? t("matchWorkState.po_1_spotkaniu_suma_total1", { total1: match.tie.total1, total2: match.tie.total2 }) : "";
    if (!next) return legInfo("in_progress", t("matchWorkState.oba_spotkania_rozegrane"));
    if (nextSlot && nextSlot.date < today) return legInfo("needs_result", t("matchWorkState.sum_dzien_leg_spotkania_v2", { sum: sum, leg: next.leg, v2: formatLocalSlot(nextSlot.date, nextSlot.time) }));
    return legInfo(match.tie.state === "first_leg_played" ? "in_progress" : "ready", t("matchWorkState.sum_nastepne_leg_spotkanie_v2", { sum: sum, leg: next.leg, v2: nextSlot ? formatLocalSlot(nextSlot.date, nextSlot.time) : t("matchWorkState.bez_terminu") }));
  }
  if (match.status === "postponed") {
    return info("postponed", slot ? t("matchWorkState.przelozony_z_v0_ustal_nowy", { v0: formatLocalSlot(slot.date, slot.time) }) : t("matchWorkState.ustal_nowy_termin_i_przywroc"),
      { kind: "restore", label: t("matchWorkState.przywroc_do_kolejki") });
  }
  if (!match.player1Id || !match.player2Id) {
    return info("waiting", t("matchWorkState.para_ustali_sie_po_wczesniejszych"), { kind: "none", label: "" });
  }
  if (match.status === "in_progress") {
    return dayOver
      ? info("needs_result", t("matchWorkState.mecz_rozpoczeto_a_dzien_meczu", { v0: formatLocalSlot(slot!.date) }), enter)
      : info("in_progress", t("matchWorkState.mecz_trwa_wynik_wpisz_po"), enter);
  }
  if (dayOver) {
    return info("needs_result", t("matchWorkState.dzien_meczu_v0_minal_a", { v0: formatLocalSlot(slot!.date, slot!.time) }), enter);
  }
  const start = options.canStart === false ? enter : { kind: "start" as const, label: t("matchWorkState.rozpocznij_mecz") };
  if (slot && planned!.getTime() <= now.getTime()) {
    return info("due", t("matchWorkState.planowany_start_time_minal_a", { time: slot.time }), start);
  }
  if (!slot) return { ...info("ready", t("matchWorkState.bez_terminu_mozna_rozegrac_w"), start), routine: true };
  return info("ready", `Start: ${formatLocalSlot(slot.date, slot.time)}.`, start);
}

export function countWorkStates(infos: readonly MatchWorkInfo[]): Record<MatchWorkState, number> {
  const counts = Object.fromEntries(WORK_STATE_ORDER.map((state) => [state, 0])) as Record<MatchWorkState, number>;
  for (const info of infos) counts[info.state] += 1;
  return counts;
}
