import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetTournament, useListMatches, useUpdateMatch, useCompleteMatch, getGetTournamentQueryKey, getListMatchesQueryKey, getGetTournamentBracketQueryKey, getGetTournamentStatsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Swords, Play } from "lucide-react";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function TournamentHost() {
  const [, params] = useRoute("/tournaments/:id/host");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();

  const { data: tournament } = useGetTournament(id, { query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id) } });
  const { data: matches } = useListMatches(id, { query: { enabled: !!id && tournament?.status !== 'draft', queryKey: getListMatchesQueryKey(id) } });

  const updateMatch = useUpdateMatch();
  const completeMatch = useCompleteMatch();

  // Local state for score inputs before submitting
  const [scores, setScores] = useState<Record<number, { s1: string, s2: string }>>({});

  const handleScoreChange = (matchId: number, player: 1 | 2, val: string) => {
    setScores(prev => ({
      ...prev,
      [matchId]: {
        s1: player === 1 ? val : (prev[matchId]?.s1 || ""),
        s2: player === 2 ? val : (prev[matchId]?.s2 || "")
      }
    }));
  };

  const handleSetInProgress = (matchId: number) => {
    updateMatch.mutate({ id: matchId, data: { status: 'in_progress' } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
      }
    });
  };

  const handleSubmitScore = (matchId: number) => {
    const s = scores[matchId];
    if (!s) return;
    const score1 = parseInt(s.s1, 10);
    const score2 = parseInt(s.s2, 10);
    if (isNaN(score1) || isNaN(score2)) return;

    updateMatch.mutate({ id: matchId, data: { score1, score2, status: 'in_progress' } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(id) });
      }
    });
  };

  const handleCompleteMatch = (matchId: number, match: any, forceWinnerId?: number) => {
    const s = scores[matchId];
    
    // Determine scores to submit
    let finalScore1 = match.score1 || 0;
    let finalScore2 = match.score2 || 0;
    
    if (s && s.s1 && !isNaN(parseInt(s.s1, 10))) finalScore1 = parseInt(s.s1, 10);
    if (s && s.s2 && !isNaN(parseInt(s.s2, 10))) finalScore2 = parseInt(s.s2, 10);

    // Determine winner
    let winnerId = forceWinnerId;
    if (!winnerId) {
      if (finalScore1 > finalScore2) winnerId = match.player1Id;
      else if (finalScore2 > finalScore1) winnerId = match.player2Id;
    }

    if (!winnerId) {
      // Need a winner
      alert("Cannot complete match without a clear winner. Scores are tied or missing.");
      return;
    }

    completeMatch.mutate({ id: matchId, data: { winnerId, score1: finalScore1, score2: finalScore2 } }, {
      onSuccess: () => {
        setScores(prev => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
      }
    });
  };

  if (!tournament) return <Layout><div className="animate-pulse h-64 bg-card rounded-xl"></div></Layout>;
  
  if (tournament.status === 'draft') {
    return (
      <Layout>
        <div className="text-center py-20 bg-card border rounded-lg">
          <h2 className="text-xl font-bold mb-2">Tournament not started</h2>
          <p className="text-muted-foreground mb-4">You cannot manage matches until the tournament is started.</p>
          <Button asChild><Link href={`/tournaments/${id}`}>Go Back</Link></Button>
        </div>
      </Layout>
    );
  }

  // Group matches
  const activeMatches = matches?.filter(m => m.status === 'in_progress' || (m.status === 'pending' && m.player1Id && m.player2Id)) || [];
  const upcomingMatches = matches?.filter(m => m.status === 'pending' && (!m.player1Id || !m.player2Id)) || [];
  const completedMatches = matches?.filter(m => m.status === 'completed' || m.status === 'bye') || [];

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 border-b pb-4">
          <Button variant="ghost" size="icon" asChild><Link href={`/tournaments/${id}`}><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Swords className="text-primary w-6 h-6" /> Host Panel: {tournament.name}
            </h1>
            <p className="text-sm text-muted-foreground">Manage active matches and enter scores.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-primary border-b border-primary/20 pb-2">Active Matches</h2>
            
            {activeMatches.length === 0 ? (
              <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
                No active matches right now.
              </div>
            ) : (
              <div className="space-y-4">
                {activeMatches.map(match => (
                  <Card key={match.id} className={match.status === 'in_progress' ? 'border-secondary/50 shadow-[0_0_15px_rgba(var(--secondary),0.1)]' : ''}>
                    <CardHeader className="py-3 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Round {match.round}</Badge>
                        <span className="text-sm font-mono text-muted-foreground">Match {match.matchNumber}</span>
                      </div>
                      {match.status === 'in_progress' && <Badge className="bg-secondary text-secondary-foreground">LIVE</Badge>}
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        
                        <div className="flex items-center justify-between w-full md:w-auto flex-1 bg-background border rounded-md p-2">
                          <div className="w-32 truncate font-bold text-right pr-4">{match.player1Name}</div>
                          <Input 
                            type="number" 
                            className="w-16 text-center font-mono font-bold text-lg bg-card" 
                            placeholder={match.score1?.toString() || "0"} 
                            value={scores[match.id]?.s1 !== undefined ? scores[match.id].s1 : (match.score1?.toString() || "")}
                            onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                          />
                        </div>
                        
                        <div className="text-muted-foreground font-bold">VS</div>
                        
                        <div className="flex items-center justify-between w-full md:w-auto flex-1 bg-background border rounded-md p-2">
                          <Input 
                            type="number" 
                            className="w-16 text-center font-mono font-bold text-lg bg-card" 
                            placeholder={match.score2?.toString() || "0"} 
                            value={scores[match.id]?.s2 !== undefined ? scores[match.id].s2 : (match.score2?.toString() || "")}
                            onChange={(e) => handleScoreChange(match.id, 2, e.target.value)}
                          />
                          <div className="w-32 truncate font-bold pl-4">{match.player2Name}</div>
                        </div>

                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/50">
                        {match.status === 'pending' && (
                          <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10" onClick={() => handleSetInProgress(match.id)}>
                            <Play className="w-4 h-4 mr-2" /> Start Match
                          </Button>
                        )}
                        {match.status === 'in_progress' && (
                          <Button variant="outline" onClick={() => handleSubmitScore(match.id)}>
                            Update Score
                          </Button>
                        )}
                        <div className="flex gap-2 ml-4 pl-4 border-l border-border/50">
                          <Button 
                            className="bg-primary text-primary-foreground hover:bg-primary/90" 
                            onClick={() => handleCompleteMatch(match.id, match)}
                          >
                            Complete & Submit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-muted-foreground border-b pb-2">Upcoming</h2>
            <div className="bg-card border rounded-lg p-4 space-y-3">
              {upcomingMatches.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No upcoming matches.</div>
              ) : (
                upcomingMatches.slice(0, 5).map(match => (
                  <div key={match.id} className="text-sm flex justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">R{match.round} M{match.matchNumber}</span>
                    <span className="truncate w-32 text-right">
                      {match.player1Id ? match.player1Name : 'TBD'} vs {match.player2Id ? match.player2Name : 'TBD'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <h2 className="text-xl font-bold text-muted-foreground border-b pb-2 mt-8">Recent Results</h2>
            <div className="bg-card border rounded-lg p-4 space-y-3">
              {completedMatches.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No completed matches yet.</div>
              ) : (
                completedMatches.slice(0, 5).map(match => (
                   <div key={match.id} className="text-sm border-b pb-2 last:border-0 last:pb-0 flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>R{match.round} M{match.matchNumber}</span>
                      {match.status === 'bye' && <Badge variant="outline" className="text-[10px] h-4 py-0">BYE</Badge>}
                    </div>
                    {match.status === 'bye' ? (
                       <div className="font-medium">{match.player1Name || match.player2Name} advanced</div>
                    ) : (
                       <div className="flex justify-between items-center">
                        <span className={match.winnerId === match.player1Id ? 'font-bold text-primary' : ''}>
                          {match.player1Name} ({match.score1})
                        </span>
                        <span className="text-muted-foreground text-[10px]">vs</span>
                        <span className={match.winnerId === match.player2Id ? 'font-bold text-primary' : ''}>
                          {match.player2Name} ({match.score2})
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
