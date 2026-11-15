import {
  Activity,
  CircleCheck,
  CircleDot,
  Clock3,
  Eye,
  ListChecks,
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
          <p className="experimental-host-overline">Bieżący etap</p>
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

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <ExperimentalMetricCard
          label="Na żywo"
          tone="live"
          value={dataLoading ? "…" : liveCount}
          meta="mecze w trakcie"
          icon={Activity}
        />
        <ExperimentalMetricCard
          label="Gotowe"
          tone="warning"
          value={dataLoading ? "…" : readyCount}
          meta="czekają na start"
          icon={CircleDot}
        />
        <ExperimentalMetricCard
          label="Zakończone"
          tone="success"
          value={dataLoading ? "…" : completedCount}
          meta={totalCount ? `z ${totalCount} w etapie` : "w bieżącym etapie"}
          icon={CircleCheck}
        />
        <ExperimentalMetricCard
          label="Pozostałe"
          tone="neutral"
          value={dataLoading ? "…" : otherCount}
          meta="pary bez kompletu graczy lub wstrzymane"
          icon={Clock3}
        />
      </div>

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
