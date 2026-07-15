import { Bracket, Match, Standing } from "@workspace/api-client-react";

interface RoundRobinViewProps {
  bracket: Bracket;
  standings?: Standing[];
  hideStandings?: boolean;
}

export function RoundRobinView({ bracket, standings, hideStandings }: RoundRobinViewProps) {
  if (!bracket?.rounds?.length) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
        Brak meczów. Wystartuj turniej, żeby zobaczyć terminarz.
      </div>
    );
  }

  const allMatches = bracket.rounds.flatMap((r) => r.matches);
  const completed = allMatches.filter((m) => m.status === "completed").length;
  const total = allMatches.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary border border-primary/50 rounded px-2 py-0.5 bg-primary/5">
            LIGA
          </span>
          <span className="text-sm font-semibold text-foreground">
            Każdy z każdym
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {completed} / {total} ukończonych
        </span>
      </div>

      {/* Main layout: matches + standings side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        {/* Matches grid */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Terminarz
          </div>
          <div className="space-y-4">
            {bracket.rounds.map((round) => (
              <section key={round.round}>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Runda {round.round}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {round.matches.map((match) => <RRMatchCard key={match.id} match={match} />)}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Standings table */}
        {!hideStandings && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              Klasyfikacja
            </div>
            <div className="border border-border/60 rounded-xl overflow-hidden bg-card/40">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground">
                    <th className="py-2 px-2 text-left w-6">#</th>
                    <th className="py-2 px-2 text-left">Gracz</th>
                    <th className="py-2 px-2 text-center">M</th>
                    <th className="py-2 px-2 text-center">W</th>
                    <th className="py-2 px-2 text-center">P</th>
                    <th className="py-2 px-2 text-center">Gry</th>
                    <th className="py-2 px-2 text-center">+/−</th>
                  </tr>
                </thead>
                <tbody>
                  {standings && standings.length > 0 ? (
                    standings.map((s) => (
                      <tr key={s.playerId} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className={`py-2 px-2 font-mono font-bold text-[10px] ${
                          s.rank === 1 ? "text-yellow-400" :
                          s.rank === 2 ? "text-slate-400" :
                          s.rank === 3 ? "text-amber-600" :
                          "text-muted-foreground"
                        }`}>
                          {s.rank}
                        </td>
                        <td className="py-2 px-2">
                          <div className="font-semibold truncate max-w-[100px]">{s.playerName}</div>
                          {(s.teamName || s.country) && (
                            <div className="text-[9px] text-muted-foreground">{s.teamName}{s.teamName && s.country ? " · " : ""}{s.country}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">{s.matchesPlayed}</td>
                        <td className="py-2 px-2 text-center text-green-400">{s.matchWins}</td>
                        <td className="py-2 px-2 text-center text-red-400">{s.matchLosses}</td>
                        <td className="py-2 px-2 text-center font-mono text-[10px]">{s.gameWins}:{s.gameLosses}</td>
                        <td className={`py-2 px-2 text-center font-mono text-[10px] ${
                          s.gameDiff > 0 ? "text-green-400" :
                          s.gameDiff < 0 ? "text-red-400" :
                          "text-muted-foreground"
                        }`}>
                          {s.gameDiff > 0 ? "+" : ""}{s.gameDiff}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        Brak danych
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RRMatchCard({ match }: { match: Match }) {
  const isDone = match.status === "completed";
  const isLive = match.status === "in_progress";

  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${
      isLive
        ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_8px_rgba(234,179,8,0.1)]"
        : isDone
        ? "border-border/40 bg-background/60"
        : "border-border/50 bg-background/40"
    }`}>
      {/* Match header */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-muted/20 border-b border-border/20">
        <span className="font-mono text-[9px] text-muted-foreground">M{match.matchNumber}</span>
        {isLive && (
          <span className="text-[8px] font-bold text-yellow-400 animate-pulse tracking-wide">LIVE</span>
        )}
        {isDone && (
          <span className="text-[8px] text-green-400">
            {match.resultType === "walkover" ? "walkower" : match.resultType === "no_contest" ? "no contest" : "✓"}
          </span>
        )}
        {!isDone && !isLive && (
          <span className="text-[8px] text-muted-foreground">oczekuje</span>
        )}
      </div>

      {/* Player 1 */}
      <RRPlayerRow
        name={match.player1Name}
        score={match.score1}
        isWinner={isDone && match.winnerId === match.player1Id}
      />
      <div className="h-px bg-border/20" />
      {/* Player 2 */}
      <RRPlayerRow
        name={match.player2Name}
        score={match.score2}
        isWinner={isDone && match.winnerId === match.player2Id}
      />
    </div>
  );
}

function RRPlayerRow({
  name,
  score,
  isWinner,
}: {
  name?: string | null;
  score?: number | null;
  isWinner: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-2 py-1.5 min-w-0 ${isWinner ? "bg-primary/10" : ""}`}>
      <span className={`text-[11px] leading-tight truncate flex-1 pr-1 ${
        isWinner ? "font-bold text-primary" : "text-foreground"
      }`}>
        {name || "?"}
      </span>
      <span className={`font-mono font-bold text-[11px] w-5 text-right shrink-0 ${
        isWinner ? "text-primary" : "text-muted-foreground"
      }`}>
        {score !== null && score !== undefined ? score : "–"}
      </span>
    </div>
  );
}
