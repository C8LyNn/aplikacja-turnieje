/**
 * V5.4-006 · tables of a group / league / Swiss stage from GET /stages/:id/standings.
 * One component for the organiser's stage panel and the viewer page, so both always show the same
 * order, points, draws and advancing places as the engine.
 */
import {
  getGetStageLiveStandingsQueryKey,
  useGetStageLiveStandings,
  type LiveStageStandings,
  type LiveStageTable,
} from "@workspace/api-client-react";
import { DECIDED_BY_LABELS } from "@/lib/league-results";

export function useStageLiveStandings(tournamentId: number, stageId: number | undefined, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useGetStageLiveStandings(tournamentId, stageId ?? 0, {
    query: {
      enabled: (options.enabled ?? true) && !!tournamentId && !!stageId,
      queryKey: getGetStageLiveStandingsQueryKey(tournamentId, stageId ?? 0),
      refetchInterval: options.refetchInterval ?? 8000,
      staleTime: Math.max(0, (options.refetchInterval ?? 8000) - 500),
      refetchOnWindowFocus: false,
      retry: false,
      // An older API (or an unexpected body) must not break the stage view: only a well-formed table is used.
      select: (data: LiveStageStandings) => (data && Array.isArray((data as { tables?: unknown }).tables) ? data : (undefined as unknown as LiveStageStandings)),
    },
  });
}

function zoneLegend(data: LiveStageStandings): string | null {
  if (data.advancingPlaces == null) return null;
  const places = data.advancingPlaces;
  const scope = data.format === "group_stage" ? `z każdej grupy ${places === 1 ? "pierwsze miejsce" : `${places} pierwsze miejsca`}` : `${places} pierwszych miejsc`;
  return data.final ? `Awans: ${scope}.` : `Awans wywalczy ${scope} — zaznaczone miejsca to stan na teraz.`;
}

export function LiveTable({
  table,
  data,
  compact = false,
  rowLimit,
}: {
  table: LiveStageTable;
  data: LiveStageStandings;
  compact?: boolean;
  rowLimit?: number;
}) {
  const points = data.leagueRules != null;
  const draws = data.leagueRules?.allowDraws === true || table.rows.some((row) => row.draws > 0);
  const swiss = data.format === "swiss";
  const rows = rowLimit ? table.rows.slice(0, rowLimit) : table.rows;
  const adjustmentNotes = points
    ? table.rows.filter((row) => row.pointAdjustment).map((row) => `${row.playerName}: w punktach korekta ${row.pointAdjustment! > 0 ? "+" : ""}${row.pointAdjustment} (bonus lub kara organizatora).`)
    : [];
  const notes = points
    ? table.rows.flatMap((row, index) => {
        if (index === 0 || !row.decidedBy || row.decidedBy === "points") return [];
        const above = table.rows[index - 1];
        return [`${above.playerName} przed ${row.playerName}: ${DECIDED_BY_LABELS[row.decidedBy] ?? row.decidedBy}.`];
      })
    : [];
  return (
    <section className="stage-live-table min-w-0 overflow-hidden rounded-lg border bg-card" aria-label={table.label} data-compact={compact ? "true" : undefined}>
      <header className="flex items-baseline justify-between gap-3 border-b px-4 py-2.5">
        <h4 className="font-semibold">{/^etap \d+$/i.test(table.label) ? (swiss ? "Ranking" : "Tabela") : table.label}</h4>
        <span className="text-xs text-muted-foreground tabular-nums">
          {table.matchesPlayed}/{table.matchesTotal} meczów
        </span>
      </header>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-sm" aria-label={`Tabela: ${table.label}`}>
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="w-9 px-1 py-2 text-center sm:w-10 sm:px-2">#</th>
              <th scope="col" className="px-2 py-2 text-left">Uczestnik</th>
              {!compact && <th scope="col" className="hidden w-10 px-1 py-2 text-center sm:table-cell" title="Mecze rozegrane">M</th>}
              <th scope="col" className="w-8 px-1 py-2 text-center sm:w-10" title="Zwycięstwa">W</th>
              {draws && <th scope="col" className="w-8 px-1 py-2 text-center sm:w-10" title="Remisy">R</th>}
              <th scope="col" className="w-8 px-1 py-2 text-center sm:w-10" title="Porażki">P</th>
              {!compact && <th scope="col" className="hidden w-16 px-1 py-2 text-center sm:table-cell" title="Wynik zdobyty i stracony">Bilans</th>}
              {swiss && !compact && <th scope="col" className="hidden w-14 px-1 py-2 text-center sm:table-cell" title="Buchholz — siła rywali">Bh</th>}
              {points && <th scope="col" className="w-12 px-2 py-2 text-center font-semibold" title="Punkty">Pkt</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.playerId} data-zone={row.zone ?? undefined} className="stage-live-row">
                <td className="px-2 py-2 text-center font-mono font-semibold tabular-nums">{row.rank}</td>
                <td className="max-w-0 px-2 py-2 font-medium">
                  <span className="block truncate" title={row.playerName}>{row.playerName}</span>
                </td>
                {!compact && <td className="hidden px-1 py-2 text-center tabular-nums sm:table-cell">{row.played}</td>}
                <td className="px-1 py-2 text-center tabular-nums">{row.wins}</td>
                {draws && <td className="px-1 py-2 text-center tabular-nums">{row.draws}</td>}
                <td className="px-1 py-2 text-center tabular-nums">{row.losses}</td>
                {!compact && <td className="hidden px-1 py-2 text-center font-mono tabular-nums sm:table-cell">{row.scoreFor}:{row.scoreAgainst}</td>}
                {swiss && !compact && <td className="hidden px-1 py-2 text-center tabular-nums sm:table-cell">{row.buchholz ?? "—"}</td>}
                {points && (
                  <td className="px-2 py-2 text-center font-bold tabular-nums">
                    {row.points ?? 0}
                    {row.pointAdjustment ? <sup className="stage-live-adjustment" data-sign={row.pointAdjustment > 0 ? "plus" : "minus"} title={`W tym korekta ${row.pointAdjustment > 0 ? "+" : ""}${row.pointAdjustment} pkt`}>{row.pointAdjustment > 0 ? "+" : ""}{row.pointAdjustment}</sup> : null}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && notes.length + adjustmentNotes.length > 0 && (
        <ul className="space-y-0.5 border-t px-4 py-2 text-xs text-muted-foreground">
          {[...adjustmentNotes, ...notes].map((note) => <li key={note}>{note}</li>)}
        </ul>
      )}
    </section>
  );
}

/** Advancing-zone legend and the rules sentence, shown once under all tables of a stage. */
export function LiveTablesLegend({ data, compact = false }: { data: LiveStageStandings; compact?: boolean }) {
  const legend = zoneLegend(data);
  if (!legend && !data.rulesSummary) return null;
  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      {legend && <p><span className="stage-live-zone-swatch" aria-hidden="true" /> {legend}</p>}
      {data.rulesSummary && !compact && <p>{data.rulesSummary}</p>}
    </div>
  );
}

export function StageLiveTables({
  data,
  compact = false,
  rowLimit,
  groupId,
}: {
  data: LiveStageStandings;
  compact?: boolean;
  rowLimit?: number;
  /** Show only this group (organiser panel renders matches under each group). */
  groupId?: number;
}) {
  const tables = groupId == null ? data.tables : data.tables.filter((table) => table.groupId === groupId);
  if (tables.length === 0) return null;
  return (
    <div className="stage-live-tables space-y-3">
      <div className={tables.length > 1 ? "grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]" : "min-w-0"}>
        {tables.map((table) => (
          <LiveTable key={table.groupId ?? table.label} table={table} data={data} compact={compact} rowLimit={rowLimit} />
        ))}
      </div>
      {groupId == null && <LiveTablesLegend data={data} compact={compact} />}
    </div>
  );
}
