import { Bracket, Match, MatchStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface BracketViewProps {
  bracket: Bracket;
}

export function BracketView({ bracket }: BracketViewProps) {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
        Brak drabinki. Wystartuj turniej, żeby zobaczyć drabinkę.
      </div>
    );
  }

  const roundLabels = (round: number, total: number): string => {
    const remaining = total - round + 1;
    if (remaining === 1) return "Finał";
    if (remaining === 2) return "Półfinał";
    if (remaining === 3) return "Ćwierćfinał";
    return `Runda ${round}`;
  };

  const totalRounds = bracket.rounds.length;

  return (
    <div className="flex gap-12 overflow-x-auto pb-8 pt-4 px-4 select-none">
      {bracket.rounds.map((round, roundIndex) => (
        <div
          key={round.round}
          className="flex flex-col justify-around min-w-[240px]"
          style={{ gap: `${Math.pow(2, roundIndex) * 8}px` }}
        >
          <h3 className="text-center font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2 shrink-0">
            {roundLabels(round.round, totalRounds)}
          </h3>
          {round.matches.map((match, matchIndex) => (
            <div key={match.id} className="relative flex items-center">
              <MatchBox match={match} />
              {/* Connector line to next round */}
              {roundIndex < totalRounds - 1 && (
                <svg
                  className="absolute pointer-events-none"
                  style={{
                    left: "100%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 48,
                    height: matchIndex % 2 === 0 ? 60 : 60,
                    overflow: "visible",
                  }}
                >
                  <line
                    x1={0}
                    y1={0}
                    x2={48}
                    y2={0}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                  />
                  <line
                    x1={48}
                    y1={matchIndex % 2 === 0 ? 0 : 0}
                    x2={48}
                    y2={matchIndex % 2 === 0 ? 34 : -34}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      ))}

      {bracket.winner && (
        <div className="flex flex-col justify-center min-w-[200px]">
          <h3 className="text-center font-bold text-xs text-primary uppercase tracking-wider mb-4">
            Zwycięzca
          </h3>
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/10 shadow-[0_0_20px_rgba(0,200,255,0.15)] flex flex-col items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-primary text-center">{bracket.winner.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchBox({ match }: { match: Match }) {
  const getStatusStyle = (status: MatchStatus): string => {
    switch (status) {
      case "in_progress":
        return "border-yellow-500/60 bg-yellow-500/5 shadow-[0_0_12px_rgba(234,179,8,0.1)]";
      case "completed":
        return "border-border opacity-80";
      case "bye":
        return "border-border/40 opacity-40 border-dashed";
      default:
        return "border-border bg-card";
    }
  };

  return (
    <div
      className={`border rounded-lg shadow-sm overflow-hidden flex flex-col w-full transition-all ${getStatusStyle(match.status)}`}
    >
      <div className="flex justify-between items-center bg-muted/20 px-2 py-1 border-b border-border/50 text-[10px]">
        <span className="text-muted-foreground">M{match.matchNumber}</span>
        {match.status === "in_progress" && (
          <Badge variant="outline" className="text-[9px] h-4 py-0 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 animate-pulse">
            LIVE
          </Badge>
        )}
        {match.status === "completed" && (
          <Badge variant="outline" className="text-[9px] h-4 py-0 border-green-500/30 text-green-400">OK</Badge>
        )}
        {match.status === "bye" && (
          <Badge variant="outline" className="text-[9px] h-4 py-0 text-muted-foreground">BYE</Badge>
        )}
      </div>

      <div className="flex flex-col">
        <PlayerRow
          name={match.player1Name}
          score={match.score1}
          isWinner={match.status === "completed" && match.winnerId === match.player1Id && !match.isDraw}
          isPending={!match.player1Id && match.status === "pending"}
        />
        <div className="h-px w-full bg-border/50" />
        <PlayerRow
          name={match.player2Name}
          score={match.score2}
          isWinner={match.status === "completed" && match.winnerId === match.player2Id && !match.isDraw}
          isPending={!match.player2Id && match.status === "pending"}
        />
      </div>
    </div>
  );
}

function PlayerRow({
  name,
  score,
  isWinner,
  isPending,
}: {
  name?: string | null;
  score?: number | null;
  isWinner: boolean;
  isPending: boolean;
}) {
  return (
    <div className={`flex justify-between items-center px-3 py-2 ${isWinner ? "bg-primary/10" : ""}`}>
      <span
        className={`text-sm truncate pr-2 max-w-[160px] ${
          isPending ? "text-muted-foreground italic text-xs" : "text-foreground"
        } ${isWinner ? "font-bold text-primary" : ""}`}
      >
        {isPending ? "TBD" : name || "?"}
      </span>
      <span
        className={`font-mono text-sm font-bold w-6 text-right shrink-0 ${
          isWinner ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {score !== null && score !== undefined ? score : "-"}
      </span>
    </div>
  );
}
