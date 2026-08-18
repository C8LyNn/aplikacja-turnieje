import { useEffect, useMemo, useState } from "react";
import { Bracket, Match, Standing } from "@workspace/api-client-react";

interface SwissRoundsViewProps {
  bracket: Bracket;
  currentRound?: number | null;
  totalRounds?: number | null;
  standings?: Standing[];
}

export function SwissRoundsView({ bracket, currentRound, totalRounds, standings }: SwissRoundsViewProps) {
  const rounds = bracket?.rounds ?? [];
  const [selectedRound, setSelectedRound] = useState<number>(currentRound ?? rounds[0]?.round ?? 1);

  useEffect(() => {
    if (currentRound != null) setSelectedRound(currentRound);
  }, [currentRound]);

  // W-L record for each player BEFORE the selected round, from completed matches
  const recordBefore = useMemo(() => {
    const map = new Map<number, { w: number; l: number }>();
    for (const round of rounds) {
      if (round.round >= selectedRound) continue;
      for (const m of round.matches ?? []) {
        if (m.status !== "completed") continue;
        for (const pid of [m.player1Id, m.player2Id]) {
          if (pid == null) continue;
          const rec = map.get(pid) ?? { w: 0, l: 0 };
          if (m.winnerId === pid) rec.w += 1;
          else if (m.winnerId != null) rec.l += 1;
          else if (m.resultType === "bye" && pid != null) rec.w += 1;
          map.set(pid, rec);
        }
      }
    }
    return map;
  }, [rounds, selectedRound]);

  const activeRound = rounds.find((r) => r.round === selectedRound);

  // Group matches by pairing bracket (shared W-L record), stronger records first
  const groups = useMemo(() => {
    const byKey = new Map<string, { label: string; sortKey: number; matches: Match[] }>();
    for (const m of activeRound?.matches ?? []) {
      const rec1 = (m.player1Id != null ? recordBefore.get(m.player1Id) : undefined) ?? { w: 0, l: 0 };
      const rec2 = m.player2Id != null
        ? recordBefore.get(m.player2Id) ?? { w: 0, l: 0 }
        : rec1; // bye — only one player
      const same = rec1.w === rec2.w && rec1.l === rec2.l;
      // order stronger record first for the label
      const [hi, lo] = rec1.w - rec1.l >= rec2.w - rec2.l ? [rec1, rec2] : [rec2, rec1];
      const label = same ? `${hi.w}-${hi.l}` : `${hi.w}-${hi.l} vs ${lo.w}-${lo.l}`;
      const sortKey = (hi.w * 100 - hi.l) + (lo.w * 100 - lo.l) / 1000;
      const entry = byKey.get(label) ?? { label, sortKey, matches: [] };
      entry.matches.push(m);
      byKey.set(label, entry);
    }
    return [...byKey.values()].sort((a, b) => b.sortKey - a.sortKey);
  }, [activeRound, recordBefore]);

  const playersInRound = useMemo(() => {
    const set = new Set<number>();
    for (const m of activeRound?.matches ?? []) {
      if (m.player1Id != null) set.add(m.player1Id);
      if (m.player2Id != null) set.add(m.player2Id);
    }
    return set;
  }, [activeRound]);

  if (!rounds.length) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
        Brak rund. Wystartuj turniej, żeby zobaczyć rozgrywki.
      </div>
    );
  }

  const hasStandings = !!standings?.length;
  const showBuchholz = hasStandings && standings!.some((s) => (s.buchholz ?? 0) !== 0);

  return (
    <div className="pb-4 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary border border-primary/50 rounded px-2 py-0.5 bg-primary/5">
            SWISS
          </span>
          <span className="text-sm font-semibold text-foreground">System szwajcarski</span>
          {currentRound != null && totalRounds != null && (
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              Runda {currentRound} / {totalRounds}
            </span>
          )}
        </div>
        {/* Round selector pills */}
        <div className="flex items-center gap-1.5">
          {rounds.map((r) => {
            const isSel = r.round === selectedRound;
            const isCur = r.round === currentRound;
            return (
              <button
                key={r.round}
                onClick={() => setSelectedRound(r.round)}
                className={`relative px-3 py-1 rounded-full text-[11px] font-bold transition-colors border ${
                  isSel
                    ? "bg-primary/15 border-primary/60 text-primary"
                    : "bg-card/40 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
                data-testid={`swiss-round-tab-${r.round}`}
              >
                R{r.round}
                {isCur && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid gap-5 ${hasStandings ? "lg:grid-cols-[1fr_290px]" : ""}`}>
        {/* Matches column */}
        <div className="min-w-0">
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="font-mono text-[11px] font-black text-primary/80 tabular-nums">
                  {group.label}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  bilans przed rundą
                </span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {group.matches.map((match) => (
                  <SwissMatchCard key={match.id} match={match} recordBefore={recordBefore} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Standings column */}
        {hasStandings && (
          <div className="lg:sticky lg:top-4 self-start rounded-xl border border-border/50 bg-card/40 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Klasyfikacja
              </span>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-muted-foreground border-b border-border/30">
                  <th className="px-2 py-1.5 text-left w-7">#</th>
                  <th className="px-1 py-1.5 text-left">Gracz</th>
                  <th className="px-1 py-1.5 text-right w-11">W-L</th>
                  {showBuchholz && <th className="px-2 py-1.5 text-right w-12">Buch.</th>}
                </tr>
              </thead>
              <tbody>
                {standings!.map((s) => {
                  const inRound = s.playerId != null && playersInRound.has(s.playerId);
                  return (
                    <tr
                      key={s.playerId ?? s.rank}
                      className={`border-b border-border/20 last:border-0 ${
                        inRound ? "bg-primary/[0.04]" : ""
                      }`}
                    >
                      <td className="px-2 py-1.5 font-mono text-muted-foreground tabular-nums">
                        {s.rank}
                      </td>
                      <td className="px-1 py-1.5 truncate max-w-[130px] text-foreground">
                        {s.playerName}
                      </td>
                      <td className="px-1 py-1.5 text-right font-mono tabular-nums text-foreground">
                        {s.matchWins}-{s.matchLosses}
                      </td>
                      {showBuchholz && (
                        <td className="px-2 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                          {s.buchholz}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {showBuchholz && (
              <div className="px-3 py-1.5 border-t border-border/30 text-[9px] text-muted-foreground">
                Buchholz = suma pkt. przeciwników
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SwissMatchCard({
  match,
  recordBefore,
}: {
  match: Match;
  recordBefore: Map<number, { w: number; l: number }>;
}) {
  const isDone = match.status === "completed";
  const isLive = match.status === "in_progress";
  const isBye = match.resultType === "bye";

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-colors ${
        isLive
          ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_8px_rgba(234,179,8,0.1)]"
          : isDone
          ? "border-border/40 bg-background/60"
          : isBye
          ? "border-border/20 bg-background/20 opacity-40"
          : "border-border/60 bg-background/40"
      }`}
      data-testid={`swiss-match-${match.id}`}
    >
      <div className="flex items-center justify-between px-2 py-0.5 bg-muted/20 border-b border-border/20">
        <span className="font-mono text-[9px] text-muted-foreground">M{match.matchNumber}</span>
        {isLive && (
          <span className="text-[8px] font-bold text-yellow-400 animate-pulse tracking-wide">LIVE</span>
        )}
        {isDone && !isBye && (
          <span className="text-[8px] text-green-400">
            {match.resultType === "walkover" ? "walkower" : match.resultType === "no_contest" ? "no contest" : "✓"}
          </span>
        )}
        {isBye && <span className="text-[8px] text-muted-foreground uppercase tracking-wide">bye</span>}
      </div>

      <SwissPlayerRow
        name={match.player1Name}
        record={match.player1Id != null ? recordBefore.get(match.player1Id) : undefined}
        score={match.score1}
        isWinner={isDone && match.winnerId === match.player1Id}
        isPending={!match.player1Id && !isBye}
      />
      <div className="h-px bg-border/20" />
      <SwissPlayerRow
        name={match.player2Name}
        record={match.player2Id != null ? recordBefore.get(match.player2Id) : undefined}
        score={match.score2}
        isWinner={isDone && match.winnerId === match.player2Id}
        isPending={!match.player2Id && !isBye}
      />
    </div>
  );
}

function SwissPlayerRow({
  name,
  record,
  score,
  isWinner,
  isPending,
}: {
  name?: string | null;
  record?: { w: number; l: number };
  score?: number | null;
  isWinner: boolean;
  isPending: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-2 py-1.5 min-w-0 ${isWinner ? "bg-primary/10" : ""}`}>
      <span className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
        <span
          className={`text-[11px] leading-tight truncate ${
            isPending
              ? "text-muted-foreground italic"
              : isWinner
              ? "font-bold text-primary"
              : "text-foreground"
          }`}
        >
          {isPending ? "TBD" : name || "?"}
        </span>
        {record && (
          <span className="font-mono text-[9px] text-muted-foreground tabular-nums shrink-0">
            ({record.w}-{record.l})
          </span>
        )}
      </span>
      <span
        className={`font-mono font-bold text-[11px] w-5 text-right shrink-0 ${
          isWinner ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {score !== null && score !== undefined ? score : "–"}
      </span>
    </div>
  );
}
