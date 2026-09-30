import { ChevronRight, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

export function ExperimentalTournamentContextBar({
  tournamentId,
  tournamentName,
  currentLabel,
}: {
  tournamentId: number;
  tournamentName: string;
  currentLabel?: string;
}) {
  return (
    <nav
      aria-label="Ścieżka w eksperymentalnym panelu turnieju"
      className="experimental-context-bar flex min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-border/75 bg-card/45 px-3 py-2 text-xs"
    >
      <Link
        href="/experimental/tournaments/dashboard"
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
        Turnieje
      </Link>

      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/55" aria-hidden="true" />

      <Link
        href={tournamentHref(tournamentId, true)}
        className="max-w-[22rem] break-words rounded-md px-1.5 py-1 font-semibold text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {tournamentName}
      </Link>

      {currentLabel && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/55" aria-hidden="true" />
          <span aria-current="page" className="rounded-md px-1.5 py-1 font-semibold text-primary">
            {currentLabel}
          </span>
        </>
      )}
    </nav>
  );
}
