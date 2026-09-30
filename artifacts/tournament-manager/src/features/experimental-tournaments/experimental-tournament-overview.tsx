import {
  Activity,
  Brackets,
  CheckCircle2,
  Circle,
  Eye,
  ListChecks,
  Swords,
  Trophy,
  Users,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ExperimentalMetricCard,
  ExperimentalQuickLink,
  ExperimentalSectionHeader,
  ExperimentalStatePanel,
  ExperimentalStatusPill,
} from "@/features/experimental-tournaments/experimental-ui";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

type OverviewPlayer = {
  id?: number;
  name?: string;
  matchWins?: number;
  matchLosses?: number;
  gameDiff?: number | null;
};

type OverviewStats = {
  totalPlayers: number;
  completedMatches: number;
  totalMatches: number;
  totalRounds?: number | null;
  topPlayers?: OverviewPlayer[] | null;
};

type OverviewNextStep = {
  title: string;
  description: string;
  readinessFeedback?: {
    counts?: string;
    action?: string;
  } | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Szkic",
  active: "Aktywny",
  completed: "Zakończony",
};

function progressLabel(stats?: OverviewStats) {
  if (!stats) return "—";
  if (stats.totalMatches <= 0) return "0%";
  return `${Math.round((stats.completedMatches / stats.totalMatches) * 100)}%`;
}


function setupSteps(status: string, stats?: OverviewStats) {
  const participants = (stats?.totalPlayers ?? 0) > 0;
  const matchesExist = (stats?.totalMatches ?? 0) > 0;
  return [
    {
      label: "Konfiguracja turnieju",
      description: "Turniej istnieje i ma zapisaną konfigurację podstawową.",
      done: true,
    },
    {
      label: "Uczestnicy",
      description: participants
        ? `Dodano ${stats?.totalPlayers ?? 0} uczestników.`
        : "Lista uczestników jest jeszcze pusta.",
      done: participants,
    },
    {
      label: "Rozgrywki",
      description:
        status === "completed"
          ? "Turniej został zakończony."
          : status === "active" || matchesExist
            ? "Rozgrywki zostały rozpoczęte lub wygenerowano mecze."
            : "Rozgrywki nie zostały jeszcze rozpoczęte.",
      done: status === "active" || status === "completed" || matchesExist,
    },
  ];
}

export function ExperimentalTournamentOverview({
  tournamentId,
  status,
  formatLabel,
  maxPlayers,
  stageName,
  roundLabel,
  bestOf,
  stats,
  statsLoading,
  statsError,
  onRetryStats,
  nextStep,
}: {
  tournamentId: number;
  status: string;
  formatLabel: string;
  maxPlayers?: number | null;
  stageName?: string | null;
  roundLabel: string;
  bestOf?: number | null;
  stats?: OverviewStats;
  statsLoading: boolean;
  statsError: boolean;
  onRetryStats: () => void;
  nextStep?: OverviewNextStep | null;
}) {
  const statusTone =
    status === "active"
      ? "active"
      : status === "completed"
        ? "success"
        : "neutral";

  const lifecycleSteps = setupSteps(status, stats);
  const lifecycleDone = lifecycleSteps.filter((step) => step.done).length;

  const quickLinks = [
    {
      href: tournamentHref(tournamentId, true, "?tab=players"),
      label: "Gracze",
      description: "Roster, seedy i dane uczestników.",
      icon: Users,
    },
    {
      href: tournamentHref(tournamentId, true, "?tab=stages"),
      label: "Etapy",
      description: "Readiness, lifecycle i przebieg etapów.",
      icon: Waypoints,
    },
    {
      href: tournamentHref(tournamentId, true, "?tab=baskets"),
      label: "Koszyki",
      description: "Przepływ uczestników między etapami.",
      icon: ListChecks,
    },
    ...(status !== "draft"
      ? [
          {
            href: tournamentHref(tournamentId, true, "/host"),
            label: "Prowadzenie",
            description: "Mecze, kolejka i zapis wyników.",
            icon: Swords,
          },
          {
            href: tournamentHref(tournamentId, true, "/audience"),
            label: "Widok widzów",
            description: "Publiczna prezentacja przebiegu turnieju.",
            icon: Eye,
          },
          {
            href: tournamentHref(tournamentId, true, "/bracket"),
            label: "Drabinka",
            description: "Pełny widok sportowej struktury etapu.",
            icon: Brackets,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <section className="experimental-overview-hero rounded-2xl border border-border/80 bg-card/55 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <ExperimentalSectionHeader
            eyebrow="Centrum turnieju"
            title="Stan rozgrywek w jednym miejscu"
            description="Najważniejsze informacje operacyjne i skróty bez kopiowania reguł turnieju z backendu."
          />
          <ExperimentalStatusPill tone={statusTone}>
            {STATUS_LABELS[status] ?? status}
          </ExperimentalStatusPill>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ExperimentalMetricCard
            label="Uczestnicy"
            value={statsLoading ? "…" : stats?.totalPlayers ?? "—"}
            meta={maxPlayers ? `limit ${maxPlayers}` : "bez ustawionego limitu"}
            icon={Users}
          />
          <ExperimentalMetricCard
            label="Mecze"
            value={
              statsLoading
                ? "…"
                : stats
                  ? `${stats.completedMatches}/${stats.totalMatches}`
                  : "—"
            }
            meta="ukończone / wszystkie"
            icon={Trophy}
          />
          <ExperimentalMetricCard
            label="Postęp"
            value={statsLoading ? "…" : progressLabel(stats)}
            meta={roundLabel}
            icon={Activity}
          />
          <ExperimentalMetricCard
            label="Format"
            value={formatLabel}
            meta={`${stageName || "Etap"} · BO${bestOf ?? 1}`}
            icon={Brackets}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
        <ExperimentalSectionHeader
          eyebrow="Przygotowanie"
          title="Przebieg konfiguracji"
          description="To prosty opis zaobserwowanego stanu, nie drugi system readiness. Decyzje o legalności startu nadal należą do istniejącej logiki turniejowej."
          action={
            <ExperimentalStatusPill tone={lifecycleDone === lifecycleSteps.length ? "success" : "neutral"}>
              {lifecycleDone}/{lifecycleSteps.length}
            </ExperimentalStatusPill>
          }
        />
        <ol className="mt-4 grid gap-2 md:grid-cols-3">
          {lifecycleSteps.map((step, index) => (
            <li
              key={step.label}
              className={`rounded-xl border p-3 ${
                step.done
                  ? "border-primary/25 bg-primary/5"
                  : "border-border/75 bg-background/25"
              }`}
            >
              <div className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Krok {index + 1}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{step.label}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {statsError && (
        <ExperimentalStatePanel
          tone="danger"
          title="Nie udało się pobrać statystyk"
          description="Pozostałe dane turnieju są nadal dostępne. Ponów tylko odczyt statystyk — nie powtarzamy żadnej mutacji."
          action={
            <Button variant="outline" size="sm" onClick={onRetryStats}>
              Spróbuj ponownie
            </Button>
          }
        />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
        <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
          <ExperimentalSectionHeader
            eyebrow="Kontekst"
            title="Na teraz"
            description="To opis aktualnie odczytanego stanu. Legalność działań nadal określa istniejąca logika turniejowa."
          />

          <dl className="mt-5 grid gap-3">
            <div className="rounded-xl border border-border/70 bg-background/30 p-3">
              <dt className="text-xs font-semibold text-muted-foreground">Etap</dt>
              <dd className="mt-1 font-semibold">{stageName || "Brak aktywnego etapu"}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/30 p-3">
              <dt className="text-xs font-semibold text-muted-foreground">Runda / kontekst</dt>
              <dd className="mt-1 font-semibold">{roundLabel}</dd>
            </div>

            {nextStep ? (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  Następny krok
                </dt>
                <dd className="mt-1 font-semibold">{nextStep.title}</dd>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {nextStep.description}
                </p>
                {nextStep.readinessFeedback?.counts && (
                  <p className="mt-2 text-xs font-medium tabular-nums">
                    {nextStep.readinessFeedback.counts}
                  </p>
                )}
              </div>
            ) : (
              <ExperimentalStatePanel
                title="Brak dodatkowego kroku"
                description="Bieżący stan nie wymaga od tego widoku dodatkowej akcji."
              />
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
          <ExperimentalSectionHeader
            eyebrow="Nawigacja robocza"
            title="Skróty"
            description="Przechodzą bezpośrednio do najczęściej używanych obszarów i pozostają w Experimental."
          />
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <ExperimentalQuickLink key={item.href} {...item} />
            ))}
          </div>
        </section>
      </div>

      {!statsLoading && !statsError && stats?.topPlayers && stats.topPlayers.length > 0 && (
        <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
          <ExperimentalSectionHeader
            eyebrow="Klasyfikacja"
            title="Liderzy"
            description="Najwyżej widoczne pozycje z istniejących statystyk turnieju."
          />
          <div className="mt-4 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
            {stats.topPlayers.map((player, index) => (
              <div
                key={player.id ?? `${player.name ?? "player"}-${index}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-background/25 px-3 py-2.5"
              >
                <span className="w-8 text-right text-xs font-bold tabular-nums text-muted-foreground">
                  #{index + 1}
                </span>
                <span className="min-w-0 break-words text-sm font-semibold">
                  {player.name ?? "Nieznany gracz"}
                </span>
                <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                  {player.matchWins ?? 0}W / {player.matchLosses ?? 0}L
                  {typeof player.gameDiff === "number"
                    ? ` · ${player.gameDiff >= 0 ? "+" : ""}${player.gameDiff}`
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
