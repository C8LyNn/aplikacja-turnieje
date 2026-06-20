import { Bracket, Match } from "@workspace/api-client-react";

interface SwissRoundsViewProps {
  bracket: Bracket;
  currentRound?: number | null;
  totalRounds?: number | null;
}

export function SwissRoundsView({ bracket, currentRound, totalRounds }: SwissRoundsViewProps) {
  if (!bracket?.rounds?.length) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
        Brak rund. Wystartuj turniej, żeby zobaczyć rozgrywki.
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Title bar */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary border border-primary/50 rounded px-2 py-0.5 bg-primary/5">
            SWISS
          </span>
          <span className="text-sm font-semibold text-foreground">
            System szwajcarski
          </span>
        </div>
        {currentRound != null && totalRounds != null && (
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            Runda {currentRound} / {totalRounds}
          </span>
        )}
      </div>

      {/* Rounds — horizontal flex, scroll handled by parent */}
      <div
        className="flex pb-2 md:flex-row flex-col gap-3 md:gap-4"
        style={{ alignItems: "flex-start" }}
      >
        {bracket.rounds.map((round) => {
          const isCurrentRound = currentRound === round.round;
          return (
            <div
              key={round.round}
              className={`flex flex-col shrink-0 md:w-52 w-full rounded-xl border ${
                isCurrentRound
                  ? "border-primary/40 bg-primary/5 shadow-[0_0_16px_rgba(0,200,255,0.06)]"
                  : "border-border/50 bg-card/40"
              }`}
            >
              {/* Round header */}
              <div
                className={`flex items-center justify-between px-3 py-2 border-b ${
                  isCurrentRound ? "border-primary/30" : "border-border/40"
                }`}
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    isCurrentRound ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Runda {round.round}
                </span>
                {isCurrentRound && (
                  <span className="text-[8px] font-bold uppercase tracking-widest text-primary/70 bg-primary/10 rounded px-1.5 py-0.5">
                    aktywna
                  </span>
                )}
              </div>

              {/* Matches */}
              <div className="flex flex-col gap-1.5 p-2">
                {round.matches.map((match) => (
                  <SwissMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SwissMatchCard({ match }: { match: Match }) {
  const isDone = match.status === "completed";
  const isLive = match.status === "in_progress";
  const isBye = match.status === "bye";
  const isDraw = match.isDraw;

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
    >
      {/* Match header */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-muted/20 border-b border-border/20">
        <span className="font-mono text-[9px] text-muted-foreground">M{match.matchNumber}</span>
        {isLive && (
          <span className="text-[8px] font-bold text-yellow-400 animate-pulse tracking-wide">
            LIVE
          </span>
        )}
        {isDone && !isDraw && (
          <span className="text-[8px] text-green-400">✓</span>
        )}
        {isDone && isDraw && (
          <span className="text-[8px] text-muted-foreground">remis</span>
        )}
        {isBye && (
          <span className="text-[8px] text-muted-foreground uppercase tracking-wide">bye</span>
        )}
      </div>

      {/* Player 1 */}
      <SwissPlayerRow
        name={match.player1Name}
        score={match.score1}
        isWinner={isDone && match.winnerId === match.player1Id && !isDraw}
        isDraw={isDone && !!isDraw}
        isPending={!match.player1Id && !isBye}
      />

      <div className="h-px bg-border/20" />

      {/* Player 2 */}
      <SwissPlayerRow
        name={match.player2Name}
        score={match.score2}
        isWinner={isDone && match.winnerId === match.player2Id && !isDraw}
        isDraw={isDone && !!isDraw}
        isPending={!match.player2Id && !isBye}
      />
    </div>
  );
}

function SwissPlayerRow({
  name,
  score,
  isWinner,
  isDraw,
  isPending,
}: {
  name?: string | null;
  score?: number | null;
  isWinner: boolean;
  isDraw: boolean;
  isPending: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-1.5 min-w-0 ${
        isWinner ? "bg-primary/10" : ""
      }`}
    >
      <span
        className={`text-[11px] leading-tight truncate flex-1 pr-1 ${
          isPending
            ? "text-muted-foreground italic"
            : isWinner
            ? "font-bold text-primary"
            : isDraw
            ? "text-foreground/80"
            : "text-foreground"
        }`}
      >
        {isPending ? "TBD" : name || "?"}
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
