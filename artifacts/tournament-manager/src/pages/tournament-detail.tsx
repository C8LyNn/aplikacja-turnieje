import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetTournament, useGetTournamentStats, useListPlayers, useGetTournamentBracket,
  useListMatches, useAddPlayer, useDeletePlayer, useStartTournament, useImportPlayers,
  useUpdatePlayer,
  useGetTournamentStandings, useGetResultsHistory, useGetTournamentAssistant,
  getGetTournamentQueryKey, getGetTournamentStatsQueryKey, getListPlayersQueryKey,
  getGetTournamentBracketQueryKey, getListMatchesQueryKey, getGetTournamentStandingsQueryKey,
  getGetResultsHistoryQueryKey, getGetTournamentAssistantQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Users, Swords, Play, ExternalLink, Trash2, Upload, Monitor, ChevronRight, Info, Pencil, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { BracketView } from "@/components/bracket-view";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  double_elimination: "Podwójna eliminacja",
};

export default function TournamentDetail() {
  const [, params] = useRoute("/tournaments/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tournament, isLoading: isLoadingTournament } = useGetTournament(id, {
    query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id) },
  });
  const { data: stats } = useGetTournamentStats(id, {
    query: { enabled: !!id, queryKey: getGetTournamentStatsQueryKey(id) },
  });
  const { data: players } = useListPlayers(id, {
    query: { enabled: !!id, queryKey: getListPlayersQueryKey(id) },
  });
  const { data: matches } = useListMatches(id, {
    query: { enabled: !!id && tournament?.status !== "draft", queryKey: getListMatchesQueryKey(id) },
  });
  const { data: bracket } = useGetTournamentBracket(id, {
    query: { enabled: !!id && tournament?.status !== "draft", queryKey: getGetTournamentBracketQueryKey(id) },
  });
  const { data: standings } = useGetTournamentStandings(id, {
    query: { enabled: !!id && tournament?.status !== "draft", queryKey: getGetTournamentStandingsQueryKey(id) },
  });
  const { data: history } = useGetResultsHistory(id, {
    query: { enabled: !!id && tournament?.status !== "draft", queryKey: getGetResultsHistoryQueryKey(id) },
  });
  const { data: assistant } = useGetTournamentAssistant(id, {
    query: { enabled: !!id, queryKey: getGetTournamentAssistantQueryKey(id), refetchInterval: 15000 },
  });

  const startTournament = useStartTournament();
  const addPlayer = useAddPlayer();
  const deletePlayer = useDeletePlayer();
  const importPlayers = useImportPlayers();
  const updatePlayer = useUpdatePlayer();

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSeed, setNewPlayerSeed] = useState("");
  const [newPlayerRank, setNewPlayerRank] = useState("");
  const [newPlayerCountry, setNewPlayerCountry] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState("");
  const [csvText, setCsvText] = useState("");
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Edit player state
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRank, setEditRank] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editTeam, setEditTeam] = useState("");
  const [editSeed, setEditSeed] = useState("");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStandingsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetResultsHistoryQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentAssistantQueryKey(id) });
  };

  const handleStart = () => {
    startTournament.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Turniej wystartował!" });
        invalidateAll();
      },
      onError: (e: any) => toast({ title: "Błąd", description: e?.message, variant: "destructive" }),
    });
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    addPlayer.mutate({
      id,
      data: {
        name: newPlayerName,
        seed: newPlayerSeed ? parseInt(newPlayerSeed, 10) : undefined,
        rank: newPlayerRank || undefined,
        country: newPlayerCountry || undefined,
        teamName: newPlayerTeam || undefined,
      },
    }, {
      onSuccess: () => {
        setNewPlayerName(""); setNewPlayerSeed(""); setNewPlayerRank(""); setNewPlayerCountry(""); setNewPlayerTeam("");
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
      },
    });
  };

  const [confirmDeletePlayerId, setConfirmDeletePlayerId] = useState<number | null>(null);

  const handleDeletePlayer = (playerId: number) => {
    setConfirmDeletePlayerId(playerId);
  };

  const handleConfirmDeletePlayer = () => {
    if (!confirmDeletePlayerId) return;
    deletePlayer.mutate({ id: confirmDeletePlayerId }, {
      onSuccess: () => {
        setConfirmDeletePlayerId(null);
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
      },
    });
  };

  const handleStartEdit = (p: { id: number; name: string; rank?: string | null; country?: string | null; teamName?: string | null; seed?: number | null }) => {
    setEditingPlayerId(p.id);
    setEditName(p.name);
    setEditRank(p.rank ?? "");
    setEditCountry(p.country ?? "");
    setEditTeam(p.teamName ?? "");
    setEditSeed(p.seed?.toString() ?? "");
  };

  const handleSaveEdit = () => {
    if (!editingPlayerId || !editName.trim()) return;
    updatePlayer.mutate({
      id: editingPlayerId,
      data: {
        name: editName.trim(),
        rank: editRank || undefined,
        country: editCountry || undefined,
        teamName: editTeam || undefined,
        seed: editSeed ? parseInt(editSeed, 10) : undefined,
      },
    }, {
      onSuccess: () => {
        setEditingPlayerId(null);
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
        toast({ title: "Gracz zaktualizowany" });
      },
      onError: (e: any) => toast({ title: "Błąd", description: e?.message, variant: "destructive" }),
    });
  };

  const handleCancelEdit = () => setEditingPlayerId(null);

  const handleCsvImport = () => {
    if (!csvText.trim()) return;
    importPlayers.mutate({ id, data: { csv: csvText } }, {
      onSuccess: (result) => {
        toast({ title: `Zaimportowano ${result.imported} graczy`, description: result.skipped > 0 ? `Pominięto: ${result.skipped}` : undefined });
        setCsvText(""); setShowCsvImport(false);
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
      },
      onError: (e: any) => toast({ title: "Błąd importu", description: e?.message, variant: "destructive" }),
    });
  };

  if (isLoadingTournament) return <Layout><div className="animate-pulse h-64 bg-card rounded-xl" /></Layout>;
  if (!tournament) return <Layout><div>Nie znaleziono</div></Layout>;

  const statusLabel: Record<string, string> = { draft: "SZKIC", active: "AKTYWNY", completed: "ZAKOŃCZONY" };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-primary">{tournament.name}</h1>
              <Badge variant={tournament.status === "active" ? "default" : tournament.status === "completed" ? "secondary" : "outline"}
                className={tournament.status === "active" ? "bg-secondary text-secondary-foreground hover:bg-secondary" :
                  tournament.status === "completed" ? "bg-accent text-accent-foreground hover:bg-accent" : ""}>
                {statusLabel[tournament.status] ?? tournament.status.toUpperCase()}
              </Badge>
            </div>
            {tournament.description && <p className="text-muted-foreground">{tournament.description}</p>}
            <p className="text-sm text-muted-foreground mt-1">
              {FORMAT_LABELS[tournament.format] ?? tournament.format}
              {tournament.format === "swiss" && tournament.swissRounds && ` · ${tournament.swissRounds} rund`}
              {tournament.currentRound && ` · Runda ${tournament.currentRound}${tournament.totalRounds ? `/${tournament.totalRounds}` : ""}`}
              {tournament.allowDraws && " · Remisy OK"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tournament.status === "draft" && (
              <Button onClick={handleStart} disabled={startTournament.isPending || !players || players.length < 2}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Play className="w-4 h-4 mr-2" /> Rozpocznij
              </Button>
            )}
            {tournament.status !== "draft" && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/tournaments/${id}/host`}><Swords className="w-4 h-4 mr-2" /> Panel prowadzącego</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/tournaments/${id}/audience`}><Monitor className="w-4 h-4 mr-2" /> Widok widzów</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/tournaments/${id}/bracket`}><ExternalLink className="w-4 h-4 mr-2" /> Projektor</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {assistant && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-primary text-sm">{assistant.stepTitle}</p>
              <p className="text-sm text-muted-foreground">{assistant.nextAction}</p>
              {assistant.warnings && assistant.warnings.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {assistant.warnings.map((w, i) => <li key={i} className="text-xs text-yellow-400">⚠ {w}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-card w-full justify-start border-b rounded-none px-0 h-auto flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Przegląd</TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Gracze</TabsTrigger>
            {tournament.status !== "draft" && (
              <>
                <TabsTrigger value="matches" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Mecze</TabsTrigger>
                <TabsTrigger value="standings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Tabela</TabsTrigger>
                <TabsTrigger value="bracket" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Drabinka</TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3">Historia</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gracze</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPlayers}</div>
                    {tournament.maxPlayers && <p className="text-xs text-muted-foreground">z {tournament.maxPlayers}</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Postęp</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedMatches} / {stats.totalMatches}</div>
                    <p className="text-xs text-muted-foreground">meczów ukończonych</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Format</CardTitle>
                    <Swords className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{FORMAT_LABELS[tournament.format] ?? tournament.format}</div>
                  </CardContent>
                </Card>
                {stats.totalRounds && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Runda</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.currentRound ?? "—"} / {stats.totalRounds}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {stats?.topPlayers && stats.topPlayers.length > 0 && (
              <Card className="mt-4">
                <CardHeader><CardTitle>Liderzy</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topPlayers.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between p-2 border rounded bg-background">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>#{i + 1}</span>
                          <span className="font-semibold">{p.name}</span>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{p.wins}W/{p.losses}L</span>
                          <span className="font-bold text-primary">{p.points} pkt</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="players" className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Zawodnicy ({players?.length ?? 0})</CardTitle>
                    {tournament.status === "draft" && (
                      <Button variant="outline" size="sm" onClick={() => setShowCsvImport(!showCsvImport)}>
                        <Upload className="w-4 h-4 mr-2" /> Import CSV
                      </Button>
                    )}
                  </CardHeader>
                  {showCsvImport && (
                    <div className="px-6 pb-4 border-b">
                      <p className="text-xs text-muted-foreground mb-2">Format CSV: <code className="bg-muted px-1 rounded">nick;ranga;seed;druzyna;kraj</code></p>
                      <Textarea
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        rows={6}
                        placeholder={"nick;ranga;seed;druzyna;kraj\nProPlayer;GM;1;TeamAlpha;PL\nNoobSlayer;Diamond;2;TeamBeta;DE"}
                        className="font-mono text-xs mb-2"
                      />
                      <Button size="sm" onClick={handleCsvImport} disabled={importPlayers.isPending || !csvText.trim()}>
                        {importPlayers.isPending ? "Importowanie..." : "Importuj"}
                      </Button>
                    </div>
                  )}
                  <CardContent className="pt-4">
                    {players?.length ? (
                      <div className="space-y-2">
                        {players.map((p) => (
                          editingPlayerId === p.id ? (
                            // Inline edit form
                            <div key={p.id} className="border border-primary/40 rounded bg-background p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Nick *</Label>
                                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Ranga</Label>
                                  <Input value={editRank} onChange={(e) => setEditRank(e.target.value)} className="h-8 text-sm" placeholder="np. GM" />
                                </div>
                                <div>
                                  <Label className="text-xs">Drużyna</Label>
                                  <Input value={editTeam} onChange={(e) => setEditTeam(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">Kraj</Label>
                                  <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="h-8 text-sm" placeholder="PL" />
                                </div>
                                <div>
                                  <Label className="text-xs">Rozstawienie</Label>
                                  <Input type="number" value={editSeed} onChange={(e) => setEditSeed(e.target.value)} className="h-8 text-sm" />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  <X className="w-3 h-3 mr-1" /> Anuluj
                                </Button>
                                <Button size="sm" onClick={handleSaveEdit} disabled={updatePlayer.isPending || !editName.trim()}>
                                  <Check className="w-3 h-3 mr-1" /> Zapisz
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Normal player row
                            <div key={p.id} className="flex justify-between items-center p-3 border rounded bg-background">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{p.name}</span>
                                  {p.seed != null && <Badge variant="outline" className="text-xs">#{p.seed}</Badge>}
                                </div>
                                <div className="flex gap-3 mt-0.5">
                                  {p.rank && <span className="text-xs text-muted-foreground">{p.rank}</span>}
                                  {p.teamName && <span className="text-xs text-muted-foreground">{p.teamName}</span>}
                                  {p.country && <span className="text-xs text-muted-foreground">{p.country}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {tournament.status !== "draft" && (
                                  <span className="text-xs text-muted-foreground font-mono">{p.wins}W {p.draws}R {p.losses}L · {p.points} pkt</span>
                                )}
                                <Badge variant={p.status === "eliminated" ? "destructive" : p.status === "winner" ? "default" : "outline"}>
                                  {p.status === "active" ? "aktywny" : p.status === "eliminated" ? "wyelim." : "zwyciężca"}
                                </Badge>
                                <Button variant="ghost" size="icon" onClick={() => handleStartEdit(p)} className="text-muted-foreground hover:text-foreground h-8 w-8">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                {tournament.status === "draft" && (
                                  confirmDeletePlayerId === p.id ? (
                                    <div className="flex items-center gap-1">
                                      <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={handleConfirmDeletePlayer} disabled={deletePlayer.isPending}>
                                        Usuń
                                      </Button>
                                      <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setConfirmDeletePlayerId(null)}>
                                        Anuluj
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeletePlayer(p.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Brak graczy. Dodaj ręcznie lub importuj CSV.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div>
                {tournament.status === "draft" && (
                  <Card>
                    <CardHeader><CardTitle>Dodaj gracza</CardTitle></CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddPlayer} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Nick *</Label>
                          <Input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Alias gracza" required />
                        </div>
                        <div className="space-y-1">
                          <Label>Ranga</Label>
                          <Input value={newPlayerRank} onChange={(e) => setNewPlayerRank(e.target.value)} placeholder="np. GM, Diamond" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>Drużyna</Label>
                            <Input value={newPlayerTeam} onChange={(e) => setNewPlayerTeam(e.target.value)} placeholder="Nazwa" />
                          </div>
                          <div className="space-y-1">
                            <Label>Kraj</Label>
                            <Input value={newPlayerCountry} onChange={(e) => setNewPlayerCountry(e.target.value)} placeholder="PL, DE..." />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Rozstawienie</Label>
                          <Input type="number" value={newPlayerSeed} onChange={(e) => setNewPlayerSeed(e.target.value)} placeholder="1" />
                        </div>
                        <Button type="submit" className="w-full" disabled={addPlayer.isPending}>Dodaj gracza</Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="pt-6">
            <Card>
              <CardHeader><CardTitle>Mecze</CardTitle></CardHeader>
              <CardContent>
                {!matches || matches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Brak meczów.</div>
                ) : (
                  <div className="space-y-2">
                    {matches.map((m) => (
                      <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded bg-background">
                        <div className="flex items-center gap-3 mb-2 md:mb-0">
                          <Badge variant="outline">R{m.round}</Badge>
                          <span className="text-xs text-muted-foreground">M{m.matchNumber}</span>
                          {m.bestOf && m.bestOf > 1 && <Badge variant="outline" className="text-xs">BO{m.bestOf}</Badge>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-right w-28 truncate text-sm ${m.winnerId === m.player1Id && !m.isDraw ? "font-bold text-primary" : ""}`}>
                            {m.player1Name || "TBD"}
                          </div>
                          <div className="flex items-center gap-2 font-mono bg-muted/50 px-2 py-1 rounded text-sm">
                            <span>{m.score1 !== null ? m.score1 : "-"}</span>
                            <span className="text-muted-foreground">:</span>
                            <span>{m.score2 !== null ? m.score2 : "-"}</span>
                          </div>
                          <div className={`w-28 truncate text-sm ${m.winnerId === m.player2Id && !m.isDraw ? "font-bold text-primary" : ""}`}>
                            {m.player2Name || "TBD"}
                          </div>
                        </div>
                        <div className="mt-1 md:mt-0">
                          <Badge variant="secondary" className={
                            m.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                            m.status === "completed" ? "bg-green-500/20 text-green-400" :
                            m.status === "bye" ? "bg-muted text-muted-foreground" : "bg-transparent border"
                          }>
                            {m.status === "pending" ? "oczekuje" : m.status === "in_progress" ? "LIVE" :
                             m.status === "completed" ? m.isDraw ? "remis" : "zakończony" : m.status === "bye" ? "bye" : m.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings" className="pt-6">
            <Card>
              <CardHeader><CardTitle>Klasyfikacja</CardTitle></CardHeader>
              <CardContent>
                {!standings || standings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Brak danych klasyfikacji.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 px-2 w-8">#</th>
                          <th className="py-2 px-2">Gracz</th>
                          <th className="py-2 px-2 text-center">Pkt</th>
                          <th className="py-2 px-2 text-center">W</th>
                          <th className="py-2 px-2 text-center">R</th>
                          <th className="py-2 px-2 text-center">P</th>
                          <th className="py-2 px-2 text-center">Buchh.</th>
                          <th className="py-2 px-2 text-center">+/-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s) => (
                          <tr key={s.playerId} className="border-b last:border-0 hover:bg-muted/20">
                            <td className={`py-2 px-2 font-mono font-bold ${s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-gray-400" : s.rank === 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {s.rank}
                            </td>
                            <td className="py-2 px-2">
                              <div className="font-semibold">{s.playerName}</div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                {s.rank_name && <span>{s.rank_name}</span>}
                                {s.teamName && <span>{s.teamName}</span>}
                                {s.country && <span>{s.country}</span>}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-primary">{s.points}</td>
                            <td className="py-2 px-2 text-center text-green-400">{s.wins}</td>
                            <td className="py-2 px-2 text-center text-yellow-400">{s.draws}</td>
                            <td className="py-2 px-2 text-center text-red-400">{s.losses}</td>
                            <td className="py-2 px-2 text-center text-muted-foreground">{s.buchholz}</td>
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              <span className={s.pointDiff > 0 ? "text-green-400" : s.pointDiff < 0 ? "text-red-400" : ""}>
                                {s.pointDiff > 0 ? "+" : ""}{s.pointDiff}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bracket" className="pt-6 overflow-hidden">
            {bracket ? <BracketView bracket={bracket} /> : (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded bg-card">
                Brak drabinki. Wystartuj turniej.
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="pt-6">
            <Card>
              <CardHeader><CardTitle>Historia wyników</CardTitle></CardHeader>
              <CardContent>
                {!history || history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Brak ukończonych meczów.</div>
                ) : (
                  <div className="space-y-2">
                    {history.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 border rounded bg-background">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">R{r.round} M{r.matchNumber}</Badge>
                          <div className="text-sm">
                            <span className={r.winnerName === r.player1Name && !r.isDraw ? "font-bold text-primary" : ""}>{r.player1Name}</span>
                            <span className="text-muted-foreground mx-2">{r.score1}:{r.score2}</span>
                            <span className={r.winnerName === r.player2Name && !r.isDraw ? "font-bold text-primary" : ""}>{r.player2Name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.isDraw ? (
                            <Badge variant="secondary">remis</Badge>
                          ) : r.winnerName ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 text-primary" /> {r.winnerName}
                            </span>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.completedAt).toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
