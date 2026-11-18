import {
  Activity,
  CircleDot,
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

export function ExperimentalHostCommandCenter({
  tournamentId,
  stageName,
  formatLabel,
  roundLabel,
  liveCount,
  readyCount,
  completedCount,
  otherCount,
  totalCount,
  needsResultCount = 0,
  dueCount = 0,
  nextStepTitle,
  championName,
  isCompleted,
  dataLoading,
  dataError,
}: {
  tournamentId: number;
  stageName: string;
  formatLabel?: string;
  roundLabel: string;
  liveCount: number;
  readyCount: number;
  completedCount: number;
  otherCount: number;
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

  return (
    <section
      aria-label="Centrum prowadzenia turnieju"
      className="experimental-host-command-center rounded-xl border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="experimental-host-overline">{isCompleted ? "Podsumowanie" : "Bieżący etap"}</p>
          <h2 className="mt-0.5 text-lg font-semibold leading-tight">{stageName}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isCompleted
              ? championName
                ? `Zwycięzca: ${championName}.`
                : "Turniej został zakończony."
              : formatLabel
                ? `${formatLabel} · ${roundLabel}`
                : roundLabel}
          </p>
        </div>
        <ExperimentalStatusPill tone={stateTone}>{stateLabel}</ExperimentalStatusPill>
      </div>

      {totalCount > 0 && (
        <div className="mt-4">
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
          <p className="mt-1 text-muted-foreground">Sprawdź końcową tabelę, pokaż wyniki widzom i zapisz kopię zapasową.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={tournamentHref(tournamentId, true, "?tab=standings")} className={linkClass}><Trophy className="h-4 w-4" aria-hidden="true" />Końcowa tabela</Link>
            <Link href={tournamentHref(tournamentId, true, "/audience")} className={linkClass}><Eye className="h-4 w-4" aria-hidden="true" />Widok widzów</Link>
            <Link href={tournamentHref(tournamentId, true, "?tab=backup")} className={linkClass}><ListChecks className="h-4 w-4" aria-hidden="true" />Kopia zapasowa</Link>
          </div>
        </div>
      )}
      {!isCompleted && <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <ExperimentalMetricCard
          label="Na żywo"
          tone="live"
          value={dataLoading ? "…" : liveCount}
          meta="mecze w trakcie"
          icon={Activity}
        />
        {/* V5.6: the same states and words as the work queue; finished matches are in the progress line above. */}
        <ExperimentalMetricCard
          label="Czeka na wynik"
          tone={needsResultCount > 0 ? "danger" : "neutral"}
          value={dataLoading ? "…" : needsResultCount}
          meta="dzień meczu minął, brak wyniku"
          icon={PenLine}
        />
        <ExperimentalMetricCard
          label="Gotowe"
          tone="warning"
          value={dataLoading ? "…" : readyCount}
          meta={dueCount > 0 ? `czekają na start · ${dueCount} po planowanym starcie` : "czekają na start"}
          icon={CircleDot}
        />
        <ExperimentalMetricCard
          label="Pozostałe"
          tone="neutral"
          value={dataLoading ? "…" : otherCount}
          meta="przełożone lub bez kompletu par"
          icon={Clock3}
        />
      </div>}

      <nav aria-label="Skróty prowadzenia" className="mt-3 flex flex-wrap gap-1 border-t pt-3">
        <Link href={tournamentHref(tournamentId, true, "/host?tab=wyniki")} className={linkClass}>
          <Trophy className="h-4 w-4" aria-hidden="true" />
          Wszystkie wyniki
        </Link>
        <Link href={tournamentHref(tournamentId, true, "?tab=stages")} className={linkClass}>
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Etapy
        </Link>
        {!isCompleted && (
          <Link href={tournamentHref(tournamentId, true, "/audience")} className={linkClass}>
            <Eye className="h-4 w-4" aria-hidden="true" />
            Widok widzów
          </Link>
        )}
      </nav>
    </section>
  );
}
