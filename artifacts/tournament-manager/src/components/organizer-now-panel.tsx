import { Link, useLocation } from "wouter";
import type { Match } from "@workspace/api-client-react";
import { ArrowRight, Loader2, PenLine, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import type { OrganizerNow, ViewerShare } from "@/lib/organizer-now";
import { pairText } from "@/lib/organizer-now";
import { isExperimentalTournamentPath, tournamentModeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

type PanelMatch = Pick<Match, "id" | "status" | "player1Id" | "player2Id" | "player1Name" | "player2Name" | "round" | "matchNumber">;

/**
 * QW-04 · "Co teraz?" on the host: the most important action first (one tap), then one-tap access to the matches
 * in progress and the next ready ones, and the viewers' link. Keeps the next-step section's landmarks and classes,
 * so both organizer views style it as before.
 */
export function OrganizerNowPanel({
  now,
  focusedMatchId,
  onOpenMatch,
  onStepAction,
  pending = false,
  share,
}: {
  now: OrganizerNow<PanelMatch>;
  focusedMatchId?: number | null;
  onOpenMatch: (matchId: number) => void;
  onStepAction?: () => void;
  pending?: boolean;
  /** Only for the organizer (sharing is an organizer capability). */
  share?: { link: string; rule: ViewerShare } | null;
}) {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const primary = now.primary;
  const chip = (m: PanelMatch, live: boolean) => (
    <li key={m.id} className="min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => onOpenMatch(m.id)}
        aria-current={m.id === focusedMatchId ? "true" : undefined}
        className={`organizer-now-match inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${live ? "border-secondary/50 bg-secondary/10" : "border-border"} ${m.id === focusedMatchId ? "ring-1 ring-primary" : ""}`}
        aria-label={`${live ? "W toku" : "Gotowy"}: ${pairText(m)}, runda ${m.round}, mecz ${m.matchNumber} — otwórz w edytorze`}
      >
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">R{m.round}M{m.matchNumber}</span>
        <span className="min-w-0 truncate font-medium">{pairText(m)}</span>
      </button>
    </li>
  );
  return (
    <section aria-labelledby="organizer-next-step-title" className="organizer-next-step organizer-now rounded-lg border border-primary/30 bg-primary/5 p-4">
      {/* QW-04: every row may shrink — long names truncate instead of widening a phone screen. */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Co teraz?</p>
          <h2 id="organizer-next-step-title" className="mt-1 font-semibold">{now.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{now.description}</p>
        </div>
        {primary?.type === "result" && (
          <Button onClick={() => onOpenMatch(primary.match.id)} className="organizer-next-action min-w-0 max-w-full shrink-0 overflow-hidden">
            <PenLine aria-hidden="true" className="mr-2 h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{primary.label}</span>
          </Button>
        )}
        {primary?.type === "step" && primary.href && (
          <Button asChild className="organizer-next-action shrink-0">
            <Link href={tournamentModeHref(primary.href, experimental)}>{primary.label}<ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link>
          </Button>
        )}
        {primary?.type === "step" && primary.onAction && onStepAction && (
          <Button onClick={onStepAction} disabled={pending} aria-busy={pending} className="organizer-next-action shrink-0">
            {pending ? "Wykonywanie…" : primary.label}
            {pending ? <Loader2 aria-hidden="true" className="ml-2 h-4 w-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
      {now.live.length > 0 && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Radio aria-hidden="true" className="h-3.5 w-3.5 text-secondary" /> W toku ({now.live.length})</p>
          <ul className="mt-1.5 flex flex-wrap gap-2" aria-label="Mecze w toku">{now.live.map((m) => chip(m, true))}</ul>
        </div>
      )}
      {now.ready.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Następne gotowe</p>
          <ul className="mt-1.5 flex flex-wrap gap-2" aria-label="Następne gotowe mecze">{now.ready.map((m) => chip(m, false))}</ul>
        </div>
      )}
      {share && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-primary/15 pt-3 text-sm">
          <span className="font-medium">Udostępnij kibicom</span>
          {share.rule.kind !== "closed" && <CopyLinkButton text={share.link} label="Kopiuj link dla kibiców" />}
          <span className="basis-full text-xs text-muted-foreground">{share.rule.note}</span>
        </div>
      )}
      {pending && <span role="status" aria-live="polite" className="sr-only">Trwa wykonywanie następnego kroku.</span>}
    </section>
  );
}
