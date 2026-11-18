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
  needs_result: "Czeka na wynik",
  in_progress: "W trakcie",
  due: "Start minął",
  ready: "Gotowy",
  postponed: "Przełożony",
  waiting: "Czeka na parę",
  completed: "Zakończony",
  cancelled: "Anulowany",
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

const WEEKDAYS = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];
const MONTHS = ["sty", "lut", "mar", "kwi", "maja", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

/** "sb 5 gru, 18:00" — a local league date and time exactly as given (no browser re-conversion). */
export function formatLocalSlot(localDate: string | null | undefined, localTime?: string | null): string {
  if (!localDate) return "bez terminu";
  const [year, month, day] = localDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS[month! - 1]}${localTime ? `, ${localTime}` : ""}`;
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
  const enter = { kind: "enter_result" as const, label: "Wpisz wynik" };
  const info = (state: MatchWorkState, reason: string, action: MatchWorkInfo["action"]): MatchWorkInfo =>
    ({ state, label: WORK_STATE_LABELS[state], reason, action, slot });

  if (match.status === "completed") {
    return info("completed", match.resultType === "bye" ? "Wolny los — awans bez meczu." : "Wynik jest zapisany.",
      match.resultType === "bye" ? { kind: "none", label: "" } : { kind: "correct", label: "Popraw wynik" });
  }
  if (match.status === "cancelled") return info("cancelled", "Mecz anulowany — nie liczy się do tabeli.", { kind: "restore", label: "Przywróć do kolejki" });
  if (match.legs && match.legs.length === 2 && match.tie) {
    // V5.10: a two-legged tie is worked leg by leg: no "start", each leg has its own date.
    if (!match.player1Id || !match.player2Id) return info("waiting", "Para dwumeczu ustali się po wcześniejszych meczach.", { kind: "none", label: "" });
    const enterLeg = { kind: "enter_result" as const, label: "Wpisz wynik spotkania" };
    if (match.tie.state === "awaiting_decision") {
      return info("needs_result", match.tie.total1 === match.tie.total2
        ? `Oba spotkania rozegrane, suma ${match.tie.total1}:${match.tie.total2} — wskaż, kto awansuje, i podaj powód.`
        : `Oba spotkania rozegrane — zatwierdź awans według sumy ${match.tie.total1}:${match.tie.total2}.`, { kind: "enter_result", label: "Rozstrzygnij awans" });
    }
    const next = match.legs.slice().sort((left, right) => left.leg - right.leg).find((leg) => leg.status !== "completed");
    const nextPlanned = next?.scheduledAt ? new Date(next.scheduledAt) : null;
    const nextSlot = nextPlanned && !Number.isNaN(nextPlanned.getTime()) ? partsIn(nextPlanned, timeZone) : null;
    const legInfo = (state: MatchWorkState, reason: string): MatchWorkInfo => ({ state, label: WORK_STATE_LABELS[state], reason, action: enterLeg, slot: nextSlot });
    const sum = match.tie.state === "first_leg_played" ? `Po 1. spotkaniu suma ${match.tie.total1}:${match.tie.total2}. ` : "";
    if (!next) return legInfo("in_progress", "Oba spotkania rozegrane.");
    if (nextSlot && nextSlot.date < today) return legInfo("needs_result", `${sum}Dzień ${next.leg}. spotkania (${formatLocalSlot(nextSlot.date, nextSlot.time)}) minął, a wyniku nie ma.`);
    return legInfo(match.tie.state === "first_leg_played" ? "in_progress" : "ready", `${sum}Następne: ${next.leg}. spotkanie — ${nextSlot ? formatLocalSlot(nextSlot.date, nextSlot.time) : "bez terminu"}.`);
  }
  if (match.status === "postponed") {
    return info("postponed", slot ? `Przełożony z ${formatLocalSlot(slot.date, slot.time)}. Ustal nowy termin i przywróć go do kolejki.` : "Ustal nowy termin i przywróć mecz do kolejki.",
      { kind: "restore", label: "Przywróć do kolejki" });
  }
  if (!match.player1Id || !match.player2Id) {
    return info("waiting", "Para ustali się po wcześniejszych meczach.", { kind: "none", label: "" });
  }
  if (match.status === "in_progress") {
    return dayOver
      ? info("needs_result", `Mecz rozpoczęto, a dzień meczu (${formatLocalSlot(slot!.date)}) już minął.`, enter)
      : info("in_progress", "Mecz trwa. Wynik wpisz po jego zakończeniu.", enter);
  }
  if (dayOver) {
    return info("needs_result", `Dzień meczu (${formatLocalSlot(slot!.date, slot!.time)}) minął, a wyniku nie ma. Jeśli mecz się nie odbył — przełóż go.`, enter);
  }
  const start = options.canStart === false ? enter : { kind: "start" as const, label: "Rozpocznij mecz" };
  if (slot && planned!.getTime() <= now.getTime()) {
    return info("due", `Planowany start ${slot.time} minął, a mecz nie jest oznaczony jako rozpoczęty.`, start);
  }
  return info("ready", slot ? `Start: ${formatLocalSlot(slot.date, slot.time)}.` : "Bez terminu — można rozegrać w dowolnej chwili.", start);
}

export function countWorkStates(infos: readonly MatchWorkInfo[]): Record<MatchWorkState, number> {
  const counts = Object.fromEntries(WORK_STATE_ORDER.map((state) => [state, 0])) as Record<MatchWorkState, number>;
  for (const info of infos) counts[info.state] += 1;
  return counts;
}
