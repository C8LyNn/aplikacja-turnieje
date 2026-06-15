import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetTournament, useGetTournamentStats, useListPlayers, useGetTournamentBracket, useListMatches, useAddPlayer, useDeletePlayer, useStartTournament, getGetTournamentQueryKey, getGetTournamentStatsQueryKey, getListPlayersQueryKey, getGetTournamentBracketQueryKey, getListMatchesQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Swords, Play, ExternalLink, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BracketView } from "@/components/bracket-view";

export default function TournamentDetail() {
  const [, params] = useRoute("/tournaments/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tournament, isLoading: isLoadingTournament } = useGetTournament(id, { query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id) } });
  const { data: stats } = useGetTournamentStats(id, { query: { enabled: !!id, queryKey: getGetTournamentStatsQueryKey(id) } });
  const { data: players } = useListPlayers(id, { query: { enabled: !!id, queryKey: getListPlayersQueryKey(id) } });
  const { data: matches } = useListMatches(id, { query: { enabled: !!id && tournament?.status !== 'draft', queryKey: getListMatchesQueryKey(id) } });
  const { data: bracket } = useGetTournamentBracket(id, { query: { enabled: !!id && tournament?.status !== 'draft', queryKey: getGetTournamentBracketQueryKey(id) } });

  const startTournament = useStartTournament();
  const addPlayer = useAddPlayer();
  const deletePlayer = useDeletePlayer();

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSeed, setNewPlayerSeed] = useState("");

  const handleStart = () => {
    startTournament.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Tournament started" });
        queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
      }
    });
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    addPlayer.mutate({ 
      id, 
      data: { 
        name: newPlayerName, 
        seed: newPlayerSeed ? parseInt(newPlayerSeed, 10) : undefined 
      } 
    }, {
      onSuccess: () => {
        setNewPlayerName("");
        setNewPlayerSeed("");
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
      }
    });
  };

  const handleDeletePlayer = (playerId: number) => {
    deletePlayer.mutate({ id: playerId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
      }
    });
  };

  if (isLoadingTournament) {
    return <Layout><div className="animate-pulse h-64 bg-card rounded-xl"></div></Layout>;
  }

  if (!tournament) return <Layout><div>Not found</div></Layout>;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-primary">{tournament.name}</h1>
              <Badge variant={tournament.status === 'active' ? 'default' : tournament.status === 'completed' ? 'secondary' : 'outline'}
                     className={
                       tournament.status === 'active' ? 'bg-secondary text-secondary-foreground hover:bg-secondary' : 
                       tournament.status === 'completed' ? 'bg-accent text-accent-foreground hover:bg-accent' : ''
                     }>
                {tournament.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">{tournament.description}</p>
          </div>
          <div className="flex gap-2">
            {tournament.status === 'draft' && (
              <Button onClick={handleStart} disabled={startTournament.isPending || !players || players.length < 2} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Play className="w-4 h-4 mr-2" /> Start Tournament
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/tournaments/${id}/host`}><Swords className="w-4 h-4 mr-2" /> Host Panel</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/tournaments/${id}/bracket`}><ExternalLink className="w-4 h-4 mr-2" /> Projection</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-card w-full justify-start border-b rounded-none px-0 h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Overview</TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Players</TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Matches</TabsTrigger>
            <TabsTrigger value="bracket" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Bracket</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-6">
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPlayers}</div>
                    {tournament.maxPlayers && <p className="text-xs text-muted-foreground">out of {tournament.maxPlayers}</p>}
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedMatches} / {stats.totalMatches}</div>
                    <p className="text-xs text-muted-foreground">matches completed</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Format</CardTitle>
                    <Swords className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">{tournament.format.replace('_', ' ')}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="players" className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Players</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {players?.length ? (
                      <div className="space-y-2">
                        {players.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-3 border rounded bg-background">
                            <div>
                              <span className="font-semibold">{p.name}</span>
                              {p.seed && <Badge variant="outline" className="ml-2">Seed {p.seed}</Badge>}
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant={p.status === 'eliminated' ? 'destructive' : 'default'}>{p.status}</Badge>
                              {tournament.status === 'draft' && (
                                <Button variant="ghost" size="icon" onClick={() => handleDeletePlayer(p.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No players registered yet.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div>
                {tournament.status === 'draft' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Player</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddPlayer} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Name</label>
                          <Input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Player alias" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Seed (Optional)</label>
                          <Input type="number" value={newPlayerSeed} onChange={e => setNewPlayerSeed(e.target.value)} placeholder="1" />
                        </div>
                        <Button type="submit" className="w-full" disabled={addPlayer.isPending}>Add Player</Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="pt-6">
             <Card>
                <CardHeader>
                  <CardTitle>Matches</CardTitle>
                </CardHeader>
                <CardContent>
                   {!matches || matches.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">No matches generated yet. Start the tournament first.</div>
                   ) : (
                     <div className="space-y-4">
                       {matches.map(m => (
                         <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded bg-background">
                           <div className="flex items-center gap-4 mb-2 md:mb-0">
                             <Badge variant="outline" className="w-20 justify-center">Round {m.round}</Badge>
                             <div className="text-sm font-medium">Match {m.matchNumber}</div>
                           </div>
                           <div className="flex items-center gap-6">
                             <div className={`text-right w-32 truncate ${m.winnerId === m.player1Id ? 'font-bold text-primary' : ''}`}>
                               {m.player1Name || 'TBD'}
                             </div>
                             <div className="flex items-center gap-3 font-mono bg-muted/50 px-3 py-1 rounded">
                               <span className="w-4 text-center">{m.score1 !== null ? m.score1 : '-'}</span>
                               <span className="text-muted-foreground">-</span>
                               <span className="w-4 text-center">{m.score2 !== null ? m.score2 : '-'}</span>
                             </div>
                             <div className={`w-32 truncate ${m.winnerId === m.player2Id ? 'font-bold text-primary' : ''}`}>
                               {m.player2Name || 'TBD'}
                             </div>
                           </div>
                           <div className="mt-2 md:mt-0 md:w-28 text-right">
                             <Badge variant="secondary" className={
                               m.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                               m.status === 'completed' ? '' : 'bg-transparent border'
                             }>{m.status}</Badge>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="bracket" className="pt-6 overflow-hidden">
             {bracket ? <BracketView bracket={bracket} /> : <div className="text-center py-8 text-muted-foreground border border-dashed rounded bg-card">No bracket available. Start the tournament.</div>}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}