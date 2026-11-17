import { standingsTieNotes, type StandingLike } from "@/lib/league-results";

/** V5.3: explains, in plain words, places in a points table decided by a tie-breaker. Hidden without points. */
export function LeagueTableNotes({ standings, rulesSummary }: { standings: readonly StandingLike[] | null | undefined; rulesSummary?: string | null }) {
  const notes = standingsTieNotes(standings);
  if (!rulesSummary && notes.length === 0) return null;
  return (
    <div className="mt-3 space-y-1 text-xs text-muted-foreground" data-testid="league-table-notes">
      {rulesSummary && <p>{rulesSummary}</p>}
      {notes.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-4">
          {notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      )}
    </div>
  );
}
