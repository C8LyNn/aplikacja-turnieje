import type { StageSchedule, StageScheduleMatch } from "@workspace/api-client-react";

export type LeagueActionKind = "enter_overdue" | "reschedule_postponed" | "play_round" | "plan_schedule" | "finished";

export interface LeagueNextAction {
  kind: LeagueActionKind;
  title: string;
  detail: string;
  /** Match the action points at (selected in the host panel). */
  matchId: number | null;
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

/** The one thing the organizer should do next, in priority order. */
export function leagueNextAction(schedule: StageSchedule): LeagueNextAction {
  const { counts } = schedule;
  if (schedule.overdue.length > 0) {
    const first = schedule.overdue[0]!;
    return {
      kind: "enter_overdue",
      title: `Wpisz ${schedule.overdue.length} ${plural(schedule.overdue.length, "zaległy wynik", "zaległe wyniki", "zaległych wyników")}`,
      detail: `Termin minął, a wyniku nie ma — najstarszy: ${matchTitle(first)} (${formatSlot(first)}).`,
      matchId: first.matchId,
    };
  }
  if (counts.postponed > 0) {
    const postponed = schedule.rounds.flatMap((round) => round.matches).find((match) => match.scheduleState === "postponed");
    return {
      kind: "reschedule_postponed",
      title: `Ustal nowy termin: ${counts.postponed} ${plural(counts.postponed, "przełożony mecz", "przełożone mecze", "przełożonych meczów")}`,
      detail: "Przełożony mecz zachowuje pary i historię. Wybierz nowy termin, a potem przywróć go do kolejki.",
      matchId: postponed?.matchId ?? null,
    };
  }
  if (schedule.currentRound == null) {
    return { kind: "finished", title: "Wszystkie mecze rozegrane", detail: "Tabela jest końcowa.", matchId: null };
  }
  const round = schedule.rounds.find((entry) => entry.round === schedule.currentRound)!;
  if (counts.total > 0 && counts.unscheduled === counts.total) {
    return {
      kind: "plan_schedule",
      title: `Kolejka ${round.round}: rozegrano ${round.completed} z ${round.total}`,
      detail: "Liga nie ma terminarza. Możesz grać w dowolnej kolejności albo ułożyć terminy kolejek jednym kliknięciem.",
      matchId: round.matches.find((match) => match.scheduleState === "unscheduled")?.matchId ?? null,
    };
  }
  const next = round.matches.find((match) => match.scheduleState !== "completed" && match.scheduleState !== "cancelled");
  return {
    kind: "play_round",
    title: `Kolejka ${round.round}: rozegrano ${round.completed} z ${round.total}`,
    detail: next ? `Następny: ${matchTitle(next)}${next.localDate ? ` · ${formatSlot(next)}` : ""}.` : "Kolejka czeka na ostatnie wyniki.",
    matchId: next?.matchId ?? null,
  };
}

export function matchTitle(match: Pick<StageScheduleMatch, "player1Name" | "player2Name">): string {
  return `${match.player1Name ?? "?"} – ${match.player2Name ?? "?"}`;
}

const WEEKDAYS = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];
const MONTHS = ["sty", "lut", "mar", "kwi", "maja", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

/** "sb 5 gru, 18:00" — the league's local date and time exactly as stored (no browser re-conversion). */
export function formatSlot(match: Pick<StageScheduleMatch, "localDate" | "localTime">): string {
  if (!match.localDate) return "bez terminu";
  const [year, month, day] = match.localDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS[month! - 1]}${match.localTime ? `, ${match.localTime}` : ""}`;
}

export const SCHEDULE_STATE_LABELS: Record<StageScheduleMatch["scheduleState"], string> = {
  completed: "Rozegrany",
  postponed: "Przełożony",
  cancelled: "Anulowany",
  in_progress: "W trakcie",
  awaiting_result: "Czeka na wynik",
  scheduled: "Zaplanowany",
  unscheduled: "Bez terminu",
};
