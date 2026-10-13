import { useGetTournamentAssistant, getGetTournamentAssistantQueryKey } from "@workspace/api-client-react";
import { TournamentQualificationRoutingPanel } from "./tournament-qualification-routing-panel";
import { TournamentResultCorrectionPanel } from "./tournament-result-correction-panel";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleHelp, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { tournamentModeHref, isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";

/** Non-blocking, advisory backend snapshot; the existing organizer workflow remains available. */
type OperationsView = {
  version: 1;
  transitionPreview?: {
    version: 1;
    advisory: true;
    kind: "start_stage" | "complete_stage" | "swiss_next_round" | "review" | "none";
    availability: "ready_for_review" | "blocked" | "not_applicable";
    title: string;
    description: string;
    stageName: string | null;
    blockers: number;
    requiresConfirmation: boolean;
    checks: { code: string; status: "pass" | "block" | "review"; message: string }[];
    effects: { code: string; confidence: "derived" | "conditional"; message: string }[];
  };
  advisory: true;
  progress: { completed: number; total: number; percent: number | null; inProgress: number; pending: number; postponed: number; cancelled: number };
  recommendedAction: {
    title: string; description: string; href: string;
    availability: "ready" | "review" | "blocked";
    requiresConfirmation: boolean;
  };
  blockers: { code: string; message: string; severity: "blocking" | "warning" }[];
};

export function TournamentOperationsOverview({ tournamentId, enabled }: {tournamentId: number; enabled: boolean}) {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const query = useGetTournamentAssistant(tournamentId, {
    query: {
      enabled: enabled && tournamentId > 0,
      queryKey: getGetTournamentAssistantQueryKey(tournamentId),
      retry: false,
      refetchInterval: 15000,
    },
  });
  // Safe for older servers: the existing assistant fields remain unchanged and
  // the panel simply stays hidden if the new optional payload is unavailable.
  const operations = (query.data as unknown as {operations?: OperationsView} | undefined)?.operations;
  if (!operations || operations.version !== 1 || operations.advisory !== true) return null;
  const {recommendedAction: action, progress, blockers} = operations;
  const preview = operations.transitionPreview;
  const target = tournamentModeHref(action.href, experimental);
  const blockerCount = blockers.filter(b => b.severity === "blocking").length;

  return (
    <section aria-label="Stan operacyjny turnieju" className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Stan operacyjny turnieju
        </div>
        <span className="text-xs text-muted-foreground" role="status">
          {blockerCount > 0 ? `${blockerCount} blokad` : "Analiza backendu"}
        </span>
      </div>
      {progress.total > 0 && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mecze bieżącego etapu</span>
            <span className="tabular-nums">{progress.completed}/{progress.total} zakończonych</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label="Ukończone mecze etapu"
            aria-valuenow={progress.completed} aria-valuemin={0} aria-valuemax={progress.total}>
            <div className="h-full rounded-full bg-primary transition-all" style={{width: `${progress.percent ?? 0}%`}} />
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.inProgress > 0 ? `${progress.inProgress} w toku · ` : ""}
            {progress.postponed > 0 ? `${progress.postponed} przełożonych · ` : ""}
            {progress.cancelled > 0 ? `${progress.cancelled} anulowanych` : ""}
          </div>
        </div>
      )}
      <div className="mt-3 flex items-start gap-2">
        {action.availability === "blocked" ? <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          : action.availability === "review" ? <CircleHelp aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          : <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{action.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
          {action.requiresConfirmation && <p className="text-xs text-muted-foreground mt-1">Operacja wymaga osobnego zatwierdzenia.</p>}
        </div>
      </div>
      {blockers.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border/70 pt-3">
          {blockers.slice(0,3).map(b => <li key={`${b.code}-${b.message}`} className="text-xs text-muted-foreground">
            <span className="font-medium">{b.severity === "blocking" ? "Blokada:" : "Uwaga:"}</span> {b.message}
          </li>)}
        </ul>
      )}
      <div className="mt-3 flex justify-end">
        <Link href={target} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline">
          Przejdź do właściwego widoku <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      {preview?.advisory === true && preview.version === 1 && preview.kind !== "none" && (
        <details className="mt-3 rounded-lg border border-border/70 bg-background/30 p-3">
          <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Podgląd kolejnej operacji: {preview.title}
            {preview.availability === "blocked" ? ` · ${preview.blockers} blokad` : " · do weryfikacji"}
          </summary>
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">{preview.description}</p>
            {preview.stageName && <p className="text-xs font-medium">Etap: {preview.stageName}</p>}
            <div>
              <p className="text-xs font-semibold">Sprawdzone warunki</p>
              <ul className="mt-1 space-y-1">
                {preview.checks.map(item => (
                  <li key={item.code} className="flex items-start gap-2 text-xs">
                    <span aria-hidden="true" className={item.status === "block" ? "text-destructive" : "text-muted-foreground"}>
                      {item.status === "pass" ? "✓" : item.status === "block" ? "!" : "?"}
                    </span>
                    <span>{item.message}</span>
                  </li>
                ))}
              </ul>
            </div>
            {preview.effects.length > 0 && <div>
              <p className="text-xs font-semibold">Możliwe skutki po osobnym zatwierdzeniu</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {preview.effects.map(item => <li key={item.code} className="text-xs text-muted-foreground">
                  {item.message}{item.confidence === "conditional" ? " (warunkowo)" : ""}
                </li>)}
              </ul>
            </div>}
            <p className="text-xs text-muted-foreground">
              To wyłącznie podgląd — nie wykonuje operacji ani nie zatwierdza awansów.
              Przy zapisie serwer ponownie sprawdza warunki i uprawnienia.
            </p>
          </div>
        </details>
      )}
      <TournamentQualificationRoutingPanel tournamentId={tournamentId} enabled={enabled} />
      <TournamentResultCorrectionPanel tournamentId={tournamentId} enabled={enabled} />
      <p className="mt-2 text-[11px] text-muted-foreground">
        Wskazówki są orientacyjne. Serwer ponownie sprawdzi stan i uprawnienia przy każdej zmianie.
      </p>
    </section>
  );
}
