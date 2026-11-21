import { t } from "@/i18n";
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
import { matchLengthText } from "@/features/experimental-tournaments/experimental-create-wizard-model";
import type { MatchRules } from "@workspace/match-rules";

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
  get draft() { return t("experimentalTournamentOverview.szkic"); },
  get active() { return t("experimentalTournamentOverview.aktywny"); },
  get completed() { return t("experimentalTournamentOverview.zakonczony"); },
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
      label: t("experimentalTournamentOverview.konfiguracja_turnieju"),
      description: t("experimentalTournamentOverview.turniej_istnieje_i_ma_zapisana"),
      done: true,
    },
    {
      label: t("experimentalTournamentOverview.uczestnicy"),
      description: participants
        ? t("experimentalTournamentOverview.dodano_v0_uczestnikow", { v0: stats?.totalPlayers ?? 0 })
        : t("experimentalTournamentOverview.lista_uczestnikow_jest_jeszcze_pusta"),
      done: participants,
    },
    {
      label: t("experimentalTournamentOverview.rozgrywki"),
      description:
        status === "completed"
          ? t("experimentalTournamentOverview.turniej_zostal_zakonczony")
          : status === "active" || matchesExist
            ? t("experimentalTournamentOverview.rozgrywki_zostaly_rozpoczete_lub_wygener")
            : t("experimentalTournamentOverview.rozgrywki_nie_zostaly_jeszcze_rozpoczete"),
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
  matchRules,
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
  /** V5.7: set stages show their set length. */
  matchRules?: MatchRules | null;
  stats?: OverviewStats;
  statsLoading: boolean;
  statsError: boolean;
  onRetryStats: () => void;
  nextStep?: OverviewNextStep | null;
}) {
  const statusTone =
    status === "active"
      ? "live"
      : status === "completed"
        ? "success"
        : "neutral";

  const lifecycleSteps = setupSteps(status, stats);
  const lifecycleDone = lifecycleSteps.filter((step) => step.done).length;

  const quickLinks = [
    {
      href: tournamentHref(tournamentId, true, "?tab=players"),
      label: t("experimentalTournamentOverview.gracze"),
      description: t("experimentalTournamentOverview.roster_seedy_i_dane_uczestnikow"),
      icon: Users,
    },
    {
      href: tournamentHref(tournamentId, true, "?tab=stages"),
      label: t("experimentalTournamentOverview.etapy"),
      description: t("experimentalTournamentOverview.readiness_lifecycle_i_przebieg_etapow"),
      icon: Waypoints,
    },
    {
      href: tournamentHref(tournamentId, true, "?tab=baskets"),
      label: t("experimentalTournamentOverview.koszyki"),
      description: t("experimentalTournamentOverview.przeplyw_uczestnikow_miedzy_etapami"),
      icon: ListChecks,
    },
    ...(status !== "draft"
      ? [
          {
            href: tournamentHref(tournamentId, true, "/host"),
            label: t("experimentalTournamentOverview.prowadzenie"),
            description: t("experimentalTournamentOverview.mecze_kolejka_i_zapis_wynikow"),
            icon: Swords,
          },
          {
            href: tournamentHref(tournamentId, true, "/audience"),
            label: t("experimentalTournamentOverview.widok_widzow"),
            description: t("experimentalTournamentOverview.publiczna_prezentacja_przebiegu_turnieju"),
            icon: Eye,
          },
          {
            href: tournamentHref(tournamentId, true, "/bracket"),
            label: t("experimentalTournamentOverview.drabinka"),
            description: t("experimentalTournamentOverview.pelny_widok_sportowej_struktury_etapu"),
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
            eyebrow={t("experimentalTournamentOverview.centrum_turnieju")}
            title={t("experimentalTournamentOverview.stan_rozgrywek_w_jednym_miejscu")}
            description={t("experimentalTournamentOverview.najwazniejsze_informacje_i_skroty_do")}
          />
          <ExperimentalStatusPill tone={statusTone}>
            {STATUS_LABELS[status] ?? status}
          </ExperimentalStatusPill>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ExperimentalMetricCard
            label={t("experimentalTournamentOverview.uczestnicy")}
            tone="info"
            value={statsLoading ? "…" : stats?.totalPlayers ?? "—"}
            meta={maxPlayers ? `limit ${maxPlayers}` : t("experimentalTournamentOverview.bez_ustawionego_limitu")}
            icon={Users}
          />
          <ExperimentalMetricCard
            label={t("experimentalTournamentOverview.mecze")}
            tone="primary"
            value={
              statsLoading
                ? "…"
                : stats
                  ? `${stats.completedMatches}/${stats.totalMatches}`
                  : "—"
            }
            meta={t("experimentalTournamentOverview.ukonczone_wszystkie")}
            icon={Trophy}
          />
          <ExperimentalMetricCard
            label={t("experimentalTournamentOverview.postep")}
            tone={status === "completed" ? "success" : "primary"}
            value={statsLoading ? "…" : progressLabel(stats)}
            meta={roundLabel}
            icon={Activity}
          />
          <ExperimentalMetricCard
            label={t("experimentalTournamentOverview.format")}
            tone="info"
            value={formatLabel}
            meta={`${stageName || t("experimentalTournamentOverview.etap")} · ${matchLengthText({ bestOf, matchRules }, true)}`}
            icon={Brackets}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
        <ExperimentalSectionHeader
          eyebrow={t("experimentalTournamentOverview.przygotowanie")}
          title={t("experimentalTournamentOverview.przebieg_konfiguracji")}
          description={t("experimentalTournamentOverview.to_prosty_opis_zaobserwowanego_stanu")}
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
              className={`experimental-lifecycle-step rounded-xl border p-3 ${
                step.done
                  ? "experimental-lifecycle-step--done"
                  : "experimental-lifecycle-step--pending"
              }`}
            >
              <div className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  {t("experimentalTournamentOverview.krok")}{" "}{index + 1}
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
          title={t("experimentalTournamentOverview.nie_udalo_sie_pobrac_statystyk")}
          description={t("experimentalTournamentOverview.pozostale_dane_turnieju_sa_nadal")}
          action={
            <Button variant="outline" size="sm" onClick={onRetryStats}>
              {t("experimentalTournamentOverview.sprobuj_ponownie")}</Button>
          }
        />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
        <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
          <ExperimentalSectionHeader
            eyebrow={t("experimentalTournamentOverview.kontekst")}
            title={t("experimentalTournamentOverview.na_teraz")}
            description={t("experimentalTournamentOverview.to_opis_aktualnie_odczytanego_stanu")}
          />

          <dl className="mt-5 grid gap-3">
            <div className="rounded-xl border border-border/70 bg-background/30 p-3">
              <dt className="text-xs font-semibold text-muted-foreground">{t("experimentalTournamentOverview.etap")}</dt>
              <dd className="mt-1 font-semibold">{stageName || t("experimentalTournamentOverview.brak_aktywnego_etapu")}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/30 p-3">
              <dt className="text-xs font-semibold text-muted-foreground">{t("experimentalTournamentOverview.runda_kontekst")}</dt>
              <dd className="mt-1 font-semibold">{roundLabel}</dd>
            </div>

            {nextStep ? (
              <div className="experimental-next-step-panel rounded-xl border p-3">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  {t("experimentalTournamentOverview.nastepny_krok")}</dt>
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
                title={t("experimentalTournamentOverview.brak_dodatkowego_kroku")}
                description={t("experimentalTournamentOverview.biezacy_stan_nie_wymaga_od")}
              />
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card/50 p-5">
          <ExperimentalSectionHeader
            eyebrow={t("experimentalTournamentOverview.nawigacja_robocza")}
            title={t("experimentalTournamentOverview.skroty")}
            description={t("experimentalTournamentOverview.przechodza_bezposrednio_do_najczesciej_u")}
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
            eyebrow={t("experimentalTournamentOverview.klasyfikacja")}
            title={t("experimentalTournamentOverview.liderzy")}
            description={t("experimentalTournamentOverview.najwyzej_widoczne_pozycje_z_istniejacych")}
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
                  {player.name ?? t("experimentalTournamentOverview.nieznany_gracz")}
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
