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
  ExperimentalSectionHeader,
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
        : liveCount > 0 || readyCount > 0
          ? "active"
          : "neutral";

  return (
    <section
      aria-label="Centrum prowadzenia turnieju"
      className="experimental-host-command-center rounded-2xl border border-border/80 bg-card/55 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <ExperimentalSectionHeader
          eyebrow="Command center"
          title={stageName}
          description={
            isCompleted
              ? championName
                ? `Zwycięzca: ${championName}.`
                : "Turniej został zakończony."
              : formatLabel
                ? `${formatLabel} · ${roundLabel}`
                : roundLabel
          }
        />
        <ExperimentalStatusPill tone={stateTone}>{stateLabel}</ExperimentalStatusPill>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <ExperimentalMetricCard
          label="Na żywo"
          value={dataLoading ? "…" : liveCount}
          meta="mecze w trakcie"
          icon={Activity}
        />
        <ExperimentalMetricCard
          label="Gotowe"
          value={dataLoading ? "…" : readyCount}
          meta="oczekują na rozegranie"
          icon={CircleDot}
        />
        <ExperimentalMetricCard
          label="Zakończone"
          value={dataLoading ? "…" : completedCount}
          meta={totalCount ? `z ${totalCount} w etapie` : "w bieżącym etapie"}
          icon={CircleCheck}
        />
        <ExperimentalMetricCard
          label="Pozostałe"
          value={dataLoading ? "…" : otherCount}
          meta="pary oczekujące / inne stany"
          icon={Clock3}
        />
        <ExperimentalMetricCard
          label="Następny krok"
          value={nextStepTitle ? "1" : "—"}
          meta={nextStepTitle || (isCompleted ? "brak — turniej zakończony" : "brak dodatkowej akcji")}
          icon={ListChecks}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
        <Link
          href={tournamentHref(tournamentId, true, "/host?tab=wyniki")}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background/45 px-3 py-2 text-sm font-semibold transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Wszystkie wyniki
        </Link>
        <Link
          href={tournamentHref(tournamentId, true, "?tab=stages")}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background/45 px-3 py-2 text-sm font-semibold transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Etapy
        </Link>
        {!isCompleted && (
          <Link
            href={tournamentHref(tournamentId, true, "/audience")}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background/45 px-3 py-2 text-sm font-semibold transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Widok widzów
          </Link>
        )}
      </div>
    </section>
  );
}
