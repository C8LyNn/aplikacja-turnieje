import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, ListChecks, PauseCircle } from "lucide-react";
import {
  getGetStageScheduleQueryKey,
  useGenerateStageSchedule,
  useGetStageSchedule,
  useUpdateMatch,
  useUpdateMatchSchedule,
  type StageScheduleGenerateResult,
  type StageScheduleMatch,
  type TournamentStage,
} from "@workspace/api-client-react";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";
import { matchResultLabel } from "@/lib/league-results";
import { browserTimeZone, defaultWizardSchedule, formatLocalDate, plural } from "./experimental-create-wizard-model";
import { SCHEDULE_STATE_LABELS, formatSlot, leagueNextAction, matchTitle } from "./experimental-league-model";
import { returnLegNote } from "@/lib/league-return-legs";

const INTERVALS = [1, 2, 3, 7, 14];

function SlotEditor({ match, timeZone, onDone }: { match: StageScheduleMatch; timeZone: string; onDone: () => void }) {
  const [date, setDate] = useState(match.localDate ?? "");
  const [time, setTime] = useState(match.localTime ?? "18:00");
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateMatchSchedule();
  const restore = useUpdateMatch();
  const save = (clear = false) => {
    setError(null);
    // V5.7: the date and the status change carry what this row showed, so nothing newer is overwritten.
    const expectedScheduledAt = match.scheduledAt ?? null;
    update.mutate({ id: match.matchId, data: clear ? { date: null, expectedScheduledAt } : { date, time, expectedScheduledAt } }, {
      onSuccess: () => {
        if (match.status === "postponed" && !clear) {
          restore.mutate({ id: match.matchId, data: { status: "pending", expectedRevision: match.revision } }, { onSuccess: onDone, onError: (e) => setError(getApiErrorMessage(e) || "Nie udało się przywrócić meczu.") });
        } else onDone();
      },
      onError: (e) => setError(getApiErrorMessage(e) || "Nie udało się zapisać terminu."),
    });
  };
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2" data-testid={`slot-editor-${match.matchId}`}>
      <label className="text-xs">Data<input type="date" className="experimental-v4-input ml-1" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="text-xs">Godzina<input type="time" className="experimental-v4-input ml-1" value={time} onChange={(event) => setTime(event.target.value)} /></label>
      <button type="button" className="experimental-v4-btn" disabled={!date || !time || update.isPending} onClick={() => save()}>
        {match.status === "postponed" ? "Ustal termin i przywróć" : "Zapisz termin"}
      </button>
      {match.localDate && <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => save(true)}>Usuń termin</button>}
      <span className="experimental-v4-muted text-xs">Czas: {timeZone}</span>
      {error && <p role="alert" className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ScheduleGenerator({ tournamentId, stage, onApplied }: { tournamentId: number; stage: TournamentStage; onApplied: () => void }) {
  const defaults = defaultWizardSchedule();
  const [startDate, setStartDate] = useState(stage.schedulePlan?.startDate ?? defaults.startDate);
  const [intervalDays, setIntervalDays] = useState(stage.schedulePlan?.intervalDays ?? 7);
  const [defaultTime, setDefaultTime] = useState(stage.schedulePlan?.defaultTime ?? "18:00");
  const [onlyUnscheduled, setOnlyUnscheduled] = useState(true);
  const [result, setResult] = useState<StageScheduleGenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generate = useGenerateStageSchedule();
  const timeZone = stage.scheduleTimeZone ?? browserTimeZone();
  const run = (apply: boolean) => {
    setError(null);
    generate.mutate({
      id: tournamentId,
      stageId: stage.id,
      data: { startDate, intervalDays, defaultTime, timeZone, apply, onlyUnscheduled, expectedVersion: stage.version },
    }, {
      onSuccess: (data) => { setResult(data); if (apply) onApplied(); },
      onError: (e) => setError(getApiErrorMessage(e) || "Nie udało się ułożyć terminarza."),
    });
  };
  return (
    <div className="space-y-2" data-testid="schedule-generator">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">Pierwsza kolejka<input type="date" className="experimental-v4-input ml-1" value={startDate} onChange={(event) => { setStartDate(event.target.value); setResult(null); }} /></label>
        <label className="text-xs">Co
          <select className="experimental-v4-input ml-1" value={intervalDays} onChange={(event) => { setIntervalDays(Number(event.target.value)); setResult(null); }}>
            {INTERVALS.map((days) => <option key={days} value={days}>{days === 7 ? "tydzień" : days === 14 ? "2 tygodnie" : days === 1 ? "dzień" : `${days} dni`}</option>)}
          </select>
        </label>
        <label className="text-xs">Godzina<input type="time" className="experimental-v4-input ml-1" value={defaultTime} onChange={(event) => { setDefaultTime(event.target.value); setResult(null); }} /></label>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={onlyUnscheduled} onChange={(event) => setOnlyUnscheduled(event.target.checked)} /> zachowaj terminy ustawione ręcznie</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="experimental-v4-btn" data-variant="ghost" disabled={generate.isPending || !startDate || !defaultTime} onClick={() => run(false)}>Pokaż podgląd</button>
        <button type="button" className="experimental-v4-btn" disabled={generate.isPending || !result || result.applied} onClick={() => run(true)}>Zastosuj terminarz</button>
      </div>
      {result && (
        <p role="status" className="text-xs">
          {result.applied ? "Zapisano: " : "Podgląd: "}{result.rounds.length} {plural(result.rounds.length, "kolejka", "kolejki", "kolejek")} od {formatLocalDate(result.firstDate ?? startDate)} do {formatLocalDate(result.lastDate ?? startDate)}, godz. {defaultTime} ({result.timeZone})
          {result.applied ? ` · ustawiono ${result.updatedMatches} meczów${result.skippedMatches ? `, pominięto ${result.skippedMatches} (rozegrane lub z własnym terminem)` : ""}.` : ". Nic nie zostało jeszcze zapisane."}
        </p>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/**
 * V5.3 league view for the host panel (Experimental): current round, the one next action, overdue and upcoming
 * matches, postponed matches with a new date, the round-by-round schedule and the generator — on one screen.
 */
export function ExperimentalLeaguePanel({
  tournamentId,
  stage,
  refreshKey,
  canPlan,
  canEditDates,
  onSelectMatch,
  variant = "full",
}: {
  tournamentId: number;
  stage: TournamentStage;
  refreshKey: string;
  canPlan: boolean;
  canEditDates: boolean;
  onSelectMatch: (matchId: number) => void;
  /**
   * V5.8: "host" sits under the work queue, which already shows the next match and the upcoming ones; it keeps
   * only what needs a date (overdue, start passed, postponed) and the schedule itself.
   */
  variant?: "full" | "host";
}) {
  const queryClient = useQueryClient();
  const scheduleQuery = useGetStageSchedule(tournamentId, stage.id);
  const [editing, setEditing] = useState<number | null>(null);
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: getGetStageScheduleQueryKey(tournamentId, stage.id) });
  }, [queryClient, refreshKey, stage.id, tournamentId]);
  const refresh = () => {
    setEditing(null);
    void queryClient.invalidateQueries();
  };
  const schedule = scheduleQuery.data;
  const action = useMemo(() => (schedule ? leagueNextAction(schedule) : null), [schedule]);
  if (!schedule || !action) return null;
  const postponed = schedule.rounds.flatMap((round) => round.matches).filter((match) => match.scheduleState === "postponed");
  // V5.10 (P2): home and away — each match says whether it is the first meeting or the return (with the first result).
  const allScheduleMatches = schedule.rounds.flatMap((round) => round.matches.map((match) => ({ ...match, round: round.round })));
  const due = schedule.rounds.flatMap((round) => round.matches).filter((match) => match.scheduleState === "due");
  const current = schedule.rounds.find((round) => round.round === schedule.currentRound) ?? null;
  const row = (match: StageScheduleMatch, cta: string) => (
    <li key={match.matchId} className="experimental-v4-flow-match experimental-league-row" data-state={match.scheduleState}>
      <span className="experimental-v4-flow-names">{matchTitle(match)}</span>
      <span className="experimental-league-row-meta">{formatSlot(match)}</span>
      <span className="experimental-league-row-actions">
        <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => onSelectMatch(match.matchId)}>{cta}</button>
        {canEditDates && match.scheduleState !== "completed" && (
          <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => setEditing(editing === match.matchId ? null : match.matchId)}>Zmień termin</button>
        )}
      </span>
      {editing === match.matchId && <SlotEditor match={match} timeZone={schedule.timeZone} onDone={refresh} />}
    </li>
  );
  return (
    <section className="experimental-league-panel" aria-label="Liga: kolejki i terminy" data-testid="league-panel" data-variant={variant}>
      {variant === "full" && <div className="experimental-v4-resume">
        <span className="experimental-v4-resume-icon" aria-hidden="true"><ListChecks className="h-5 w-5" /></span>
        <div className="experimental-v4-resume-body">
          <p className="experimental-v4-kicker">Liga · {current ? `kolejka ${current.round} z ${schedule.rounds.length}` : `${schedule.rounds.length} ${plural(schedule.rounds.length, "kolejka", "kolejki", "kolejek")}`}</p>
          <p className="experimental-v4-resume-title">{action.title}</p>
          <p className="experimental-v4-muted text-sm">{action.detail}</p>
          {current && current.resting.length > 0 && (
            <p className="experimental-v4-muted text-xs">Pauzuje w tej kolejce: {current.resting.map((entry) => entry.name).join(", ")}.</p>
          )}
        </div>
        {action.matchId != null && (
          <button type="button" className="experimental-v4-cta" onClick={() => onSelectMatch(action.matchId!)}>
            {action.kind === "enter_overdue" ? "Wpisz wynik" : action.kind === "start_due" ? "Otwórz mecz" : action.kind === "reschedule_postponed" ? "Pokaż mecz" : "Przejdź do meczu"}
          </button>
        )}
      </div>}

      <div className="experimental-league-columns">
        {schedule.overdue.length > 0 && (
          <div>
            <p className="experimental-v4-kicker"><Clock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Czekają na wynik — dzień meczu minął ({schedule.overdue.length})</p>
            <ul className="experimental-league-list">{schedule.overdue.slice(0, 6).map((match) => row(match, "Wpisz wynik"))}</ul>
          </div>
        )}
        {due.length > 0 && (
          <div>
            <p className="experimental-v4-kicker"><Clock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Start minął — mecz nierozpoczęty ({due.length})</p>
            <ul className="experimental-league-list">{due.slice(0, 6).map((match) => row(match, "Otwórz mecz"))}</ul>
          </div>
        )}
        {postponed.length > 0 && (
          <div>
            <p className="experimental-v4-kicker"><PauseCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Przełożone ({postponed.length})</p>
            <ul className="experimental-league-list">{postponed.map((match) => row(match, "Pokaż mecz"))}</ul>
          </div>
        )}
        {variant === "full" && schedule.upcoming.length > 0 && (
          <div>
            <p className="experimental-v4-kicker"><CalendarDays className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Najbliższe mecze</p>
            <ul className="experimental-league-list">{schedule.upcoming.slice(0, 4).map((match) => row(match, "Pokaż mecz"))}</ul>
          </div>
        )}
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-semibold">
          Terminarz: {schedule.rounds.length} {plural(schedule.rounds.length, "kolejka", "kolejki", "kolejek")} · rozegrane {schedule.counts.completed} z {schedule.counts.total}
          {schedule.counts.unscheduled > 0 ? ` · bez terminu ${schedule.counts.unscheduled}` : ""}
          {variant === "host" && current && current.resting.length > 0 ? ` · w kolejce ${current.round} pauzuje: ${current.resting.map((entry) => entry.name).join(", ")}` : ""}
        </summary>
        <ol className="mt-2 space-y-2">
          {schedule.rounds.map((round) => (
            <li key={round.round} data-current={round.round === schedule.currentRound ? "true" : undefined}>
              <p className="text-xs font-semibold">
                Kolejka {round.round}{round.firstDate ? ` · ${formatLocalDate(round.firstDate)}` : ""} · {round.completed}/{round.total}
                {round.resting.length > 0 ? ` · pauzuje: ${round.resting.map((entry) => entry.name).join(", ")}` : ""}
              </p>
              <ul className="experimental-league-list">
                {round.matches.map((match) => (
                  <li key={match.matchId} className="experimental-v4-flow-match experimental-league-row" data-state={match.scheduleState}>
                    <button type="button" className="experimental-v4-flow-names experimental-league-open" onClick={() => onSelectMatch(match.matchId)} aria-label={`Otwórz mecz: ${matchTitle(match)}`}>{matchTitle(match)}</button>
                    <span className="experimental-league-row-meta">
                      {match.scheduleState === "completed"
                        ? matchResultLabel({ resultType: "played", score1: match.score1, score2: match.score2, winnerId: match.winnerId ?? (match.isDraw ? null : -1) })
                        : SCHEDULE_STATE_LABELS[match.scheduleState]}
                      {/* V5.11: no "· bez terminu" after "Bez terminu" or after a result played without a date. */}
                      {(match.localDate || (match.scheduleState !== "unscheduled" && match.scheduleState !== "completed")) && <>{" · "}{formatSlot(match)}</>}
                      {(() => { const note = returnLegNote(allScheduleMatches, match); return note ? <span className="block text-xs opacity-80" data-testid="league-return-leg">{note}</span> : null; })()}
                    </span>
                    {canEditDates && match.scheduleState !== "completed" && match.scheduleState !== "cancelled" && (
                      <span className="experimental-league-row-actions">
                        <button type="button" className="experimental-v4-btn" data-variant="ghost" onClick={() => setEditing(editing === match.matchId ? null : match.matchId)}>Zmień termin</button>
                      </span>
                    )}
                    {editing === match.matchId && <SlotEditor match={match} timeZone={schedule.timeZone} onDone={refresh} />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {canPlan && (
          <div className="mt-3">
            <p className="experimental-v4-kicker">Ułóż terminy kolejek</p>
            <ScheduleGenerator tournamentId={tournamentId} stage={stage} onApplied={refresh} />
          </div>
        )}
      </details>
    </section>
  );
}
