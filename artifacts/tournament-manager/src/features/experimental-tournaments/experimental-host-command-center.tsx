import {
  Activity,
  Clock3,
  Eye,
  ListChecks,
  PenLine,
  Trophy,
} from "lucide-react";
import { Link } from "wouter";
import {
  ExperimentalMetricCard,
  ExperimentalStatusPill,
} from "@/features/experimental-tournaments/experimental-ui";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

/**
 * V5.8 · the host's one status block: what happens now (stage, round, progress) and — only when something needs
 * the organizer — the matches that need action, each linking to the same filter of the work queue below.
 * Counts that need nothing (ready, other) live once, in the queue filters.
 */
export function ExperimentalHostCommandCenter({
  tournamentId,
  stageName,
  formatLabel,
  roundLabel,
  liveCount,
  readyCount,
  completedCount,
  totalCount,
  needsResultCount = 0,
  dueCount = 0,
  championName,
  isCompleted,
  dataLoading,
  dataError,
  finalPlacesHref,
}: {
  tournamentId: number;
  stageName: string;
  formatLabel?: string;
  roundLabel: string;
  liveCount: number;
  readyCount: number;
  completedCount: number;
  /** Kept for callers; the queue filters show it. */
  otherCount?: number;
  totalCount: number;
  /** V5.6: the same work states as the queue — matches whose day is over without a result. */
  needsResultCount?: number;
  /** V5.6: ready matches whose planned start has passed (start them or postpone them). */
  dueCount?: number;
  nextStepTitle?: string | null;
  championName?: string | null;
  isCompleted: boolean;
  dataLoading: boolean;
  dataError: boolean;
  /** V5.8: where the final places live (a table for leagues and groups, the stage view for brackets). */
  finalPlacesHref?: string;
}) {
  const stateLabel = dataError
    ? "Dane wymagają odświeżenia"
    : dataLoading
      ? "Pobieranie stanu"
      : isCompleted
        ? "Turniej zakończony"
        : liveCount > 0
          ? "Mecz na żywo"
          : readyCount > 0
            ? "Mecze gotowe"
            : "Oczekiwanie";
  const stateTone =
    dataError
      ? "danger"
      : isCompleted
        ? "success"
        : liveCount > 0
          ? "live"
          : readyCount > 0
            ? "warning"
            : "neutral";
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const linkClass =
    "inline-flex min-h-9 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground";
  const queueHref = (filter: string) => tournamentHref(tournamentId, true, `/host?kolejka=${filter}`);
  const subtitle = isCompleted
    ? championName
      ? `Zwycięzca: ${championName}.`
      : "Turniej został zakończony."
    : [formatLabel && formatLabel !== stageName ? formatLabel : null, roundLabel].filter(Boolean).join(" · ");
  const alerts = isCompleted || dataLoading || dataError ? [] : [
    liveCount > 0 && { key: "in_progress", label: "Na żywo", tone: "live" as const, value: liveCount, meta: "mecze w trakcie", icon: Activity },
    needsResultCount > 0 && { key: "needs_result", label: "Czeka na wynik", tone: "danger" as const, value: needsResultCount, meta: "dzień meczu minął, brak wyniku", icon: PenLine },
    dueCount > 0 && { key: "due", label: "Start minął", tone: "warning" as const, value: dueCount, meta: "rozpocznij albo przełóż", icon: Clock3 },
  ].filter((alert): alert is Exclude<typeof alert, false> => Boolean(alert));
  return (
    <section
      aria-label="Centrum prowadzenia turnieju"
      className="experimental-host-command-center rounded-xl border p-4 sm:p-5"
      data-compact="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="experimental-host-overline">{isCompleted ? "Podsumowanie" : "Bieżący etap"}</p>
          <h2 className="mt-0.5 text-lg font-semibold leading-tight">{stageName}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExperimentalStatusPill tone={stateTone}>{stateLabel}</ExperimentalStatusPill>
          {!isCompleted && totalCount > 0 && (
            <Link href={tournamentHref(tournamentId, true, "/host?tab=wyniki")} className={linkClass}>
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Wszystkie wyniki
            </Link>
          )}
        </div>
      </div>
      {totalCount > 0 && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>Postęp etapu</span>
            <span className="tabular-nums">{completedCount}/{totalCount} meczów · {progress}%</span>
          </div>
          <div
            className="experimental-host-progress mt-1.5"
            role="progressbar"
            aria-label="Postęp bieżącego etapu"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={completedCount}
            aria-valuetext={`${completedCount} z ${totalCount} meczów zakończonych`}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {isCompleted && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm" data-testid="host-completed-summary">
          {/* V5.6: the winner is named once, in the heading above. */}
          <p className="font-semibold">Co dalej</p>
          <p className="mt-1 text-muted-foreground">Sprawdź końcowe miejsca, pokaż wyniki widzom i zapisz kopię zapasową.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={finalPlacesHref ?? tournamentHref(tournamentId, true, "?tab=standings")} className={linkClass}><Trophy className="h-4 w-4" aria-hidden="true" />Końcowe miejsca</Link>
            <Link href={tournamentHref(tournamentId, true, "/audience")} className={linkClass}><Eye className="h-4 w-4" aria-hidden="true" />Widok widzów</Link>
            <Link href={tournamentHref(tournamentId, true, "?tab=backup")} className={linkClass}><ListChecks className="h-4 w-4" aria-hidden="true" />Kopia zapasowa</Link>
          </div>
        </div>
      )}
      {alerts.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Wymaga działania">
          {alerts.map((alert) => (
            <Link key={alert.key} href={queueHref(alert.key)} className="experimental-host-alert rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${alert.label}: ${alert.value} — pokaż w kolejce`}>
              <ExperimentalMetricCard label={alert.label} tone={alert.tone} value={alert.value} meta={alert.meta} icon={alert.icon} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
