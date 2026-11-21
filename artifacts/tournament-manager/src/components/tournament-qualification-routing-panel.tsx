import { t } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { AlertTriangle, ArrowRight, GitBranch, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { tournamentModeHref, isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";

type RouteStatus = "materialized" | "ready_for_review" | "waiting" | "blocked";
type TransitionResponse = {
  version: 1;
  advisory: true;
  flowAuthority: "legacy" | "basket_v1";
  state: string;
  title: string;
  description: string;
  proposalFingerprintRevalidated: false;
  summary: { sourceStages: number; proposalsPending: number; proposalsApproved: number; routesTotal: number; routesMaterialized: number };
  issues: Array<{ code: string; message: string; severity: "block" | "attention" }>;
  qualificationStages: Array<{
    stageId: number;
    stageName: string;
    stageStatus: string;
    proposalStatus: "missing" | "pending" | "approved" | "unknown";
    proposalRevision: number | null;
    qualifierQuota: number;
    proposalEntries: number;
    nextAction: string;
    routeCount: number;
    routeDone: number;
    routes: Array<{
      routeId: string;
      targetStageName: string | null;
      qualifierQuota: number | null;
      allocatedInProposal: number;
      state: RouteStatus;
      reason: string;
      routedPlayerCount: number;
    }>;
  }>;
};

const STAGE_ACTIONS: Record<string, string> = {
  get wait() { return t("tournamentQualificationRoutingPanel.poczekaj_na_zakonczenie_etapu"); },
  get prepare_proposal() { return t("tournamentQualificationRoutingPanel.przygotuj_propozycje_kwalifikacji"); },
  get review_proposal() { return t("tournamentQualificationRoutingPanel.sprawdz_i_zatwierdz_kwalifikacje"); },
  get review_routes() { return t("tournamentQualificationRoutingPanel.sprawdz_routing_awansujacych"); },
  get review_next_stage() { return t("tournamentQualificationRoutingPanel.sprawdz_gotowosc_nastepnego_etapu"); },
};
const ROUTE_STATES: Record<RouteStatus, string> = {
  get materialized() { return t("tournamentQualificationRoutingPanel.przekazano"); },
  get ready_for_review() { return t("tournamentQualificationRoutingPanel.do_zatwierdzenia"); },
  get waiting() { return t("tournamentQualificationRoutingPanel.oczekuje"); },
  blocked: "Zablokowano",
};

/** Uses the existing auth-aware API fetcher; never submits mutations. */
export function TournamentQualificationRoutingPanel({ tournamentId, enabled }: { tournamentId: number; enabled: boolean }) {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const query = useQuery({
    queryKey: ["tournament", tournamentId, "qualification-routing-preview"],
    enabled: enabled && tournamentId > 0,
    retry: false,
    refetchInterval: 15000,
    queryFn: ({ signal }) => customFetch<TransitionResponse>(
      `/api/tournaments/${tournamentId}/operations/qualification-routing-preview`,
      { method: "GET", signal },
    ),
  });
  const data = query.data;
  if (!enabled) return null;
  if (query.isError && !data) {
    return <div role="alert" className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      <p>{t("tournamentQualificationRoutingPanel.nie_udalo_sie_pobrac_podgladu")}</p>
      <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching}
        className="mt-2 min-h-11 rounded-md border border-destructive/40 px-4 font-medium hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {query.isFetching ? t("tournamentQualificationRoutingPanel.ponawianie") : t("tournamentQualificationRoutingPanel.ponow_odczyt_kwalifikacji")}
      </button>
    </div>;
  }
  if (query.isPending && !data) return <p role="status" className="mt-3 text-xs text-muted-foreground">{t("tournamentQualificationRoutingPanel.ladowanie_kwalifikacji_i_routingu")}</p>;
  if (!data || data.version !== 1 || data.advisory !== true || data.flowAuthority !== "basket_v1") return null;
  const href = tournamentModeHref(`/tournaments/${tournamentId}?tab=baskets`, experimental);
  return (
    <section aria-label={t("tournamentQualificationRoutingPanel.kwalifikacje_i_routing")} className="mt-4 rounded-xl border border-border/80 bg-background/30 p-3 sm:p-4">
      {query.isError && (
        <div role="status" className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          {t("tournamentQualificationRoutingPanel.nie_udalo_sie_odswiezyc_podgladu")}<button type="button" onClick={() => void query.refetch()} disabled={query.isFetching}
            className="ml-2 min-h-11 rounded-md px-3 font-medium underline underline-offset-4 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary">
            {query.isFetching ? t("tournamentQualificationRoutingPanel.ponawianie") : t("tournamentQualificationRoutingPanel.ponow_odczyt_kwalifikacji")}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="h-4 w-4 text-primary" aria-hidden="true" />
          {t("tournamentQualificationRoutingPanel.kwalifikacje_i_routing")}</div>
        <span className="text-xs text-muted-foreground">{data.summary.routesMaterialized}/{data.summary.routesTotal} {t("tournamentQualificationRoutingPanel.tras_wykonanych")}</span>
      </div>
      <p className="mt-2 text-sm font-medium">{data.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
      {data.issues.length > 0 && (
        <ul className="mt-3 space-y-1" aria-label={t("tournamentQualificationRoutingPanel.problemy_z_kwalifikacjami")}>
          {data.issues.slice(0, 5).map((item, index) => (
            <li key={`${item.code}-${index}`} className="flex gap-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {item.message}
            </li>
          ))}
          {data.issues.length > 5 && <li className="text-xs text-muted-foreground">{t("tournamentQualificationRoutingPanel.pozostale_problemy")}{" "}{data.issues.length - 5}</li>}
        </ul>
      )}
      {data.qualificationStages.map(stage => (
        <details key={stage.stageId} className="mt-3 rounded-lg border border-border/70 bg-card/50 p-3">
          <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {stage.stageName} · {stage.routeDone}/{stage.routeCount} {t("tournamentQualificationRoutingPanel.tras")}</summary>
          <p className="mt-2 text-xs text-muted-foreground">{STAGE_ACTIONS[stage.nextAction] ?? t("tournamentQualificationRoutingPanel.sprawdz_stan_etapu")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("tournamentQualificationRoutingPanel.propozycja")}{" "}{stage.proposalStatus === "approved" ? t("tournamentQualificationRoutingPanel.zatwierdzona") : stage.proposalStatus === "pending" ? t("tournamentQualificationRoutingPanel.oczekuje_na_zatwierdzenie") : stage.proposalStatus === "missing" ? t("tournamentQualificationRoutingPanel.nieprzygotowana") : t("tournamentQualificationRoutingPanel.wymaga_kontroli")}
            {stage.proposalRevision !== null ? t("tournamentQualificationRoutingPanel.rewizja_proposalrevision", { proposalRevision: stage.proposalRevision }) : ""} · {stage.proposalEntries}/{stage.qualifierQuota} {t("tournamentQualificationRoutingPanel.pozycji")}</p>
          {stage.routes.map(route => (
            <div key={route.routeId} className="mt-2 rounded-md border border-border/70 p-2 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <span>→ {route.targetStageName ?? t("tournamentQualificationRoutingPanel.nieznany_etap")}</span>
                <span className={route.state === "blocked" ? "text-destructive" : "text-muted-foreground"}>{ROUTE_STATES[route.state]}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{route.reason}</p>
              <p className="mt-1 text-muted-foreground">{t("tournamentQualificationRoutingPanel.uczestnicy")}{" "}{route.routedPlayerCount} {t("tournamentQualificationRoutingPanel.przekazanych")}{" "}{route.allocatedInProposal}/{route.qualifierQuota ?? "?"} {t("tournamentQualificationRoutingPanel.w_propozycji")}</p>
            </div>
          ))}
        </details>
      ))}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> {t("tournamentQualificationRoutingPanel.podglad_tylko_do_odczytu")}</span>
        <Link className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" href={href}>
          {t("tournamentQualificationRoutingPanel.otworz_koszyki")}{" "}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("tournamentQualificationRoutingPanel.rewizja_propozycji_nie_stanowi_gwarancji")}</p>
    </section>
  );
}
