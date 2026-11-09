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
  wait: "Poczekaj na zakończenie etapu",
  prepare_proposal: "Przygotuj propozycję kwalifikacji",
  review_proposal: "Sprawdź i zatwierdź kwalifikację",
  review_routes: "Sprawdź routing awansujących",
  review_next_stage: "Sprawdź gotowość następnego etapu",
};
const ROUTE_STATES: Record<RouteStatus, string> = {
  materialized: "Przekazano",
  ready_for_review: "Do zatwierdzenia",
  waiting: "Oczekuje",
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
  if (query.isError) {
    return <p role="status" className="mt-3 text-xs text-muted-foreground">
      Nie udało się odczytać stanu kwalifikacji i routingu. Odśwież panel po sprawdzeniu uprawnień i połączenia.
    </p>;
  }
  if (!data || data.version !== 1 || data.advisory !== true || data.flowAuthority !== "basket_v1") return null;
  const href = tournamentModeHref(`/tournaments/${tournamentId}?tab=baskets`, experimental);
  return (
    <section aria-label="Kwalifikacje i routing" className="mt-4 rounded-xl border border-border/80 bg-background/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="h-4 w-4 text-primary" aria-hidden="true" />
          Kwalifikacje i routing
        </div>
        <span className="text-xs text-muted-foreground">{data.summary.routesMaterialized}/{data.summary.routesTotal} tras wykonanych</span>
      </div>
      <p className="mt-2 text-sm font-medium">{data.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
      {data.issues.length > 0 && (
        <ul className="mt-3 space-y-1" aria-label="Problemy z kwalifikacjami">
          {data.issues.slice(0, 5).map((item, index) => (
            <li key={`${item.code}-${index}`} className="flex gap-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {item.message}
            </li>
          ))}
          {data.issues.length > 5 && <li className="text-xs text-muted-foreground">Pozostałe problemy: {data.issues.length - 5}</li>}
        </ul>
      )}
      {data.qualificationStages.map(stage => (
        <details key={stage.stageId} className="mt-3 rounded-lg border border-border/70 bg-card/50 p-3">
          <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {stage.stageName} · {stage.routeDone}/{stage.routeCount} tras
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">{STAGE_ACTIONS[stage.nextAction] ?? "Sprawdź stan etapu"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Propozycja: {stage.proposalStatus === "approved" ? "zatwierdzona" : stage.proposalStatus === "pending" ? "oczekuje na zatwierdzenie" : stage.proposalStatus === "missing" ? "nieprzygotowana" : "wymaga kontroli"}
            {stage.proposalRevision !== null ? ` · rewizja ${stage.proposalRevision}` : ""} · {stage.proposalEntries}/{stage.qualifierQuota} pozycji
          </p>
          {stage.routes.map(route => (
            <div key={route.routeId} className="mt-2 rounded-md border border-border/70 p-2 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <span>→ {route.targetStageName ?? "Nieznany etap"}</span>
                <span className={route.state === "blocked" ? "text-destructive" : "text-muted-foreground"}>{ROUTE_STATES[route.state]}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{route.reason}</p>
              <p className="mt-1 text-muted-foreground">Uczestnicy: {route.routedPlayerCount} przekazanych · {route.allocatedInProposal}/{route.qualifierQuota ?? "?"} w propozycji</p>
            </div>
          ))}
        </details>
      ))}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Podgląd tylko do odczytu</span>
        <Link className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" href={href}>
          Otwórz koszyki <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Rewizja propozycji nie stanowi gwarancji aktualności. Przy każdym zatwierdzeniu backend ponownie kontroluje uprawnienia i dane.</p>
    </section>
  );
}
