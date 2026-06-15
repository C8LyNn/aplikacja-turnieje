import { Bracket, Match, MatchStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

interface BracketViewProps {
  bracket: Bracket;
}

export function BracketView({ bracket }: BracketViewProps) {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
        No bracket generated yet. Start the tournament to see the bracket.
      </div>
    );
  }

  return (
    <div className="flex gap-16 overflow-x-auto pb-8 pt-4 px-4 select-none">
      {bracket.rounds.map((round, roundIndex) => (
        <div key={round.round} className="flex flex-col gap-8 justify-center min-w-[280px]">
          <h3 className="text-center font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">
            Round {round.round}
          </h3>
          {round.matches.map((match, matchIndex) => (
            <div key={match.id} className="relative">
              <MatchBox match={match} />
              {/* Connection lines */}
              {roundIndex < bracket.rounds.length - 1 && (
                <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-border transform -translate-y-1/2">
                  {matchIndex % 2 === 0 ? (
                    <div className="absolute top-0 right-0 w-[2px] h-[calc(100%+2rem)] bg-border" />
                  ) : (
                    <div className="absolute bottom-0 right-0 w-[2px] h-[calc(100%+2rem)] bg-border" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      
      {/* Winner Box */}
      {bracket.winner && (
        <div className="flex flex-col justify-center min-w-[280px]">
          <h3 className="text-center font-bold text-sm text-primary uppercase tracking-wider mb-2">
            Winner
          </h3>
          <div className="border-2 border-primary rounded-md p-4 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)] flex items-center justify-center">
             <span className="font-bold text-lg text-primary">{bracket.winner.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchBox({ match }: { match: Match }) {
  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case "in_progress": return "border-yellow-500/50 bg-yellow-500/5";
      case "completed": return "opacity-75";
      case "bye": return "opacity-50 border-dashed";
      default: return "border-border bg-card";
    }
  };

  return (
    <div className={`border rounded-md shadow-sm overflow-hidden flex flex-col w-full transition-all ${getStatusColor(match.status)}`}>
      <div className="flex justify-between items-center bg-muted/30 px-3 py-1.5 border-b border-border text-xs">
        <span className="text-muted-foreground">Match {match.matchNumber}</span>
        {match.status === "in_progress" && <Badge variant="outline" className="text-[10px] h-4 py-0 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">LIVE</Badge>}
        {match.status === "completed" && <Badge variant="outline" className="text-[10px] h-4 py-0">DONE</Badge>}
        {match.status === "bye" && <Badge variant="outline" className="text-[10px] h-4 py-0">BYE</Badge>}
      </div>
      
      <div className="flex flex-col">
        <PlayerRow 
          name={match.player1Name} 
          score={match.score1} 
          isWinner={match.status === 'completed' && match.winnerId === match.player1Id} 
          isPending={!match.player1Id && match.status === 'pending'}
        />
        <div className="h-px w-full bg-border" />
        <PlayerRow 
          name={match.player2Name} 
          score={match.score2} 
          isWinner={match.status === 'completed' && match.winnerId === match.player2Id}
          isPending={!match.player2Id && match.status === 'pending'}
        />
      </div>
    </div>
  );
}

function PlayerRow({ name, score, isWinner, isPending }: { name?: string | null, score?: number | null, isWinner: boolean, isPending: boolean }) {
  return (
    <div className={`flex justify-between items-center px-3 py-2 ${isWinner ? 'bg-primary/10' : ''}`}>
      <span className={`font-mono text-sm truncate pr-2 ${isPending ? 'text-muted-foreground italic' : 'text-foreground'} ${isWinner ? 'font-bold text-primary' : ''}`}>
        {isPending ? 'TBD' : (name || 'Unknown')}
      </span>
      <span className={`font-mono text-sm font-bold w-6 text-right ${isWinner ? 'text-primary' : 'text-muted-foreground'}`}>
        {score !== null && score !== undefined ? score : '-'}
      </span>
    </div>
  );
}
