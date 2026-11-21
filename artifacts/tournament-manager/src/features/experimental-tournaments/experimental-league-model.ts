import { t } from "@/i18n";
import type { StageSchedule, StageScheduleMatch } from "@workspace/api-client-react";
import { formatLocalSlot, WORK_STATE_LABELS } from "@/lib/match-work-state";

export type LeagueActionKind = "enter_overdue" | "start_due" | "reschedule_postponed" | "play_round" | "plan_schedule" | "finished";

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
    const n = schedule.overdue.length;
    return {
      kind: "enter_overdue",
      title: t("experimentalLeagueModel.n_v1_na_wynik", { n: n, v1: plural(n, t("experimentalLeagueModel.mecz_czeka"), t("experimentalLeagueModel.mecze_czekaja"), t("experimentalLeagueModel.meczow_czeka")) }),
      detail: t("experimentalLeagueModel.dzien_meczu_minal_a_wyniku", { v0: matchTitle(first), v1: formatSlot(first) }),
      matchId: first.matchId,
    };
  }
  // V5.6: a passed start today asks to start the match (or postpone it) — not to enter a result yet.
  const due = schedule.rounds.flatMap((round) => round.matches).filter((match) => match.scheduleState === "due")
    .sort((left, right) => (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? ""));
  if (due.length > 0) {
    const first = due[0]!;
    return {
      kind: "start_due",
      title: t("experimentalLeagueModel.pora_zaczac_length_v1", { length: due.length, v1: plural(due.length, t("experimentalLeagueModel.mecz"), t("experimentalLeagueModel.mecze"), t("experimentalLeagueModel.meczow")) }),
      detail: t("experimentalLeagueModel.planowany_start_minal_v0_v1", { v0: formatSlot(first), v1: matchTitle(first) }),
      matchId: first.matchId,
    };
  }
  if (counts.postponed > 0) {
    const postponed = schedule.rounds.flatMap((round) => round.matches).find((match) => match.scheduleState === "postponed");
    return {
      kind: "reschedule_postponed",
      title: t("experimentalLeagueModel.ustal_nowy_termin_postponed_v1", { postponed: counts.postponed, v1: plural(counts.postponed, t("experimentalLeagueModel.przelozony_mecz"), t("experimentalLeagueModel.przelozone_mecze"), t("experimentalLeagueModel.przelozonych_meczow")) }),
      detail: t("experimentalLeagueModel.przelozony_mecz_zachowuje_pary_i"),
      matchId: postponed?.matchId ?? null,
    };
  }
  if (schedule.currentRound == null) {
    return { kind: "finished", title: t("experimentalLeagueModel.wszystkie_mecze_rozegrane"), detail: t("experimentalLeagueModel.tabela_jest_koncowa"), matchId: null };
  }
  const round = schedule.rounds.find((entry) => entry.round === schedule.currentRound)!;
  if (counts.total > 0 && counts.unscheduled === counts.total) {
    return {
      kind: "plan_schedule",
      title: t("experimentalLeagueModel.kolejka_round_rozegrano_completed_z", { round: round.round, completed: round.completed, total: round.total }),
      detail: t("experimentalLeagueModel.liga_nie_ma_terminarza_mozesz"),
      matchId: round.matches.find((match) => match.scheduleState === "unscheduled")?.matchId ?? null,
    };
  }
  const next = round.matches.find((match) => match.scheduleState !== "completed" && match.scheduleState !== "cancelled");
  return {
    kind: "play_round",
    title: t("experimentalLeagueModel.kolejka_round_rozegrano_completed_z", { round: round.round, completed: round.completed, total: round.total }),
    detail: next ? t("experimentalLeagueModel.nastepny_v0_v1", { v0: matchTitle(next), v1: next.localDate ? ` · ${formatSlot(next)}` : "" }) : t("experimentalLeagueModel.kolejka_czeka_na_ostatnie_wyniki"),
    matchId: next?.matchId ?? null,
  };
}

export function matchTitle(match: Pick<StageScheduleMatch, "player1Name" | "player2Name">): string {
  return `${match.player1Name ?? "?"} – ${match.player2Name ?? "?"}`;
}

/** "sb 5 gru, 18:00" — the league's local date and time exactly as stored (no browser re-conversion). */
export function formatSlot(match: Pick<StageScheduleMatch, "localDate" | "localTime">): string {
  return formatLocalSlot(match.localDate, match.localTime);
}

/** Same words as the host work queue (lib/match-work-state). */
export const SCHEDULE_STATE_LABELS: Record<StageScheduleMatch["scheduleState"], string> = {
  get completed() { return t("experimentalLeagueModel.rozegrany"); },
  postponed: WORK_STATE_LABELS.postponed,
  cancelled: WORK_STATE_LABELS.cancelled,
  in_progress: WORK_STATE_LABELS.in_progress,
  due: WORK_STATE_LABELS.due,
  awaiting_result: WORK_STATE_LABELS.needs_result,
  get scheduled() { return t("experimentalLeagueModel.zaplanowany"); },
  get unscheduled() { return t("experimentalLeagueModel.bez_terminu"); },
};
