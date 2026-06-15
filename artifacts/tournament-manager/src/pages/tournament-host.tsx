import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetTournament, useListMatches, useUpdateMatch, useCompleteMatch, useRevertMatch,
  useGetTournamentStandings, useGetResultsHistory, useGetTournamentAssistant, useGenerateNextRound,
  useGetTournamentBracket,
  getGetTournamentQueryKey, getListMatchesQueryKey, getGetTournamentBracketQueryKey,
  getGetTournamentStatsQueryKey, getGetTournamentStandingsQueryKey, getGetResultsHistoryQueryKey,
  getGetTournamentAssistantQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Swords, Play, CheckCircle2, RotateCcw, Monitor, ChevronRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BracketView } from "@/components/bracket-view";

export default function TournamentHost() {
  const [, params] = useRoute("/tournaments/:id/host");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tournament } = useGetTournament(id, { query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id), refetchInterval: 10000 } });
  const { data: matches } = useListMatches(id, { query: { enabled: !!id && tournament?.status !== "draft", queryKey: getListMatchesQueryKey(id), refetchInterval: 10000 } });
  const { data: bracket } = useGetTournamentBracket(id, { query: { enabled: !!id && tournament?.status !== "draft", queryKey: getGetTournamentBracketQueryKey(id) } });
  const { data: standings } = useGetTournamentStandings(id, { query: { enabled: !!id && tournament?.status !== "draft", queryKey: getGetTournamentStandingsQueryKey(id) } });
  const { data: history } = useGetResultsHistory(id, { query: { enabled: !!id && tournament?.status !== "draft", queryKey: getGetResultsHistoryQueryKey(id) } });
  const { data: assistant } = useGetTournamentAssistant(id, { query: { enabled: !!id, queryKey: getGetTournamentAssistantQueryKey(id), refetchInterval: 10000 } });

  const updateMatch = useUpdateMatch();
  const completeMatch = useCompleteMatch();
  const revertMatch = useRevertMatch();
  const generateNextRound = useGenerateNextRound();

  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});
  const [revertConfirm, setRevertConfirm] = useState<number | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStandingsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetResultsHistoryQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentAssistantQueryKey(id) });
  };

  const handleScoreChange = (matchId: number, player: 1 | 2, val: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        s1: player === 1 ? val : (prev[matchId]?.s1 || ""),
        s2: player === 2 ? val : (prev[matchId]?.s2 || ""),
      },
    }));
  };

  const handleSetInProgress = (matchId: number) => {
    updateMatch.mutate({ id: matchId, data: { status: "in_progress" } }, { onSuccess: invalidateAll });
  };

  const handleCompleteMatch = (matchId: number, match: any, isDraw = false) => {
    const s = scores[matchId];
    const score1 = s?.s1 !== undefined && s.s1 !== "" ? parseInt(s.s1, 10) : (match.score1 ?? 0);
    const score2 = s?.s2 !== undefined && s.s2 !== "" ? parseInt(s.s2, 10) : (match.score2 ?? 0);

    if (!isDraw && score1 === score2 && !tournament?.allowDraws) {
      toast({ title: "Remis niejednoznaczny", description: "Wynik jest remisem, ale remisy nie są dozwolone.", variant: "destructive" });
      return;
    }

    completeMatch.mutate({ id: matchId, data: { score1, score2, isDraw } }, {
      onSuccess: () => {
        setScores((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
        invalidateAll();
        toast({ title: "Wynik zapisany!" });
      },
      onError: (e: any) => toast({ title: "Błąd", description: e?.message, variant: "destructive" }),
    });
  };

  const handleRevert = (matchId: number) => {
    revertMatch.mutate({ id: matchId }, {
      onSuccess: () => {
        setRevertConfirm(null);
        invalidateAll();
        toast({ title: "Wynik cofnięty" });
      },
      onError: (e: any) => toast({ title: "Błąd", description: e?.message, variant: "destructive" }),
    });
  };

  const handleGenerateRound = () => {
    generateNextRound.mutate({ id }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Nowa runda wygenerowana!" });
      },
      onError: (e: any) => toast({ title: "Błąd", description: e?.message, variant: "destructive" }),
    });
  };

  if (!tournament) return <Layout><div className="animate-pulse h-64 bg-card rounded-xl" /></Layout>;

  if (tournament.status === "draft") {
    return (
      <Layout>
        <div className="text-center py-20 bg-card border rounded-lg">
          <h2 className="text-xl font-bold mb-2">Turniej nie wystartował</h2>
          <p className="text-muted-foreground mb-4">Wróć do szczegółów i uruchom turniej.</p>
          <Button asChild><Link href={`/tournaments/${id}`}>Wróć</Link></Button>
        </div>
      </Layout>
    );
  }

  const activeMatches = matches?.filter((m) => m.status === "in_progress") || [];
  const pendingMatches = matches?.filter((m) => (m.status === "pending" || m.status === "ready") && m.player1Id && m.player2Id) || [];
  const waitingMatches = matches?.filter((m) => m.status === "pending" && (!m.player1Id || !m.player2Id)) || [];
  const completedMatches = matches?.filter((m) => m.status === "completed" || m.status === "bye") || [];
  const allCurrentRoundDone = matches?.filter((m) => m.round === tournament.currentRound).every(
    (m) => m.status === "completed" || m.status === "bye" || m.status === "walkover"
  ) ?? false;
  const canGenerateRound = tournament.format === "swiss" && allCurrentRoundDone &&
    (tournament.currentRound ?? 0) < (tournament.totalRounds ?? 0);

  const renderMatchCard = (match: any, allowComplete = true) => {
    const s = scores[match.id];
    const s1 = s?.s1 !== undefined ? s.s1 : (match.score1?.toString() ?? "");
    const s2 = s?.s2 !== undefined ? s.s2 : (match.score2?.toString() ?? "");

    return (
      <Card key={match.id} className={match.status === "in_progress" ? "border-secondary/60 shadow-[0_0_20px_rgba(0,200,255,0.08)]" : ""}>
        <CardHeader className="py-2 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Runda {match.round}</Badge>
            <span className="text-xs text-muted-foreground">M{match.matchNumber}</span>
            {match.bestOf && match.bestOf > 1 && <Badge variant="outline" className="text-xs">BO{match.bestOf}</Badge>}
          </div>
          {match.status === "in_progress" && <Badge className="bg-secondary text-secondary-foreground animate-pulse text-xs">LIVE</Badge>}
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-background border rounded p-2">
              <Input
                type="number"
                className="w-14 text-center font-mono font-bold text-lg bg-card border-0"
                value={s1}
                onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                min="0"
              />
              <div className="flex-1 truncate font-bold text-right pr-1">{match.player1Name}</div>
            </div>
            <span className="text-muted-foreground font-bold text-sm">VS</span>
            <div className="flex-1 flex items-center gap-2 bg-background border rounded p-2">
              <div className="flex-1 truncate font-bold pl-1">{match.player2Name}</div>
              <Input
                type="number"
                className="w-14 text-center font-mono font-bold text-lg bg-card border-0"
                value={s2}
                onChange={(e) => handleScoreChange(match.id, 2, e.target.value)}
                min="0"
              />
            </div>
          </div>
          {allowComplete && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t justify-end">
              {match.status === "pending" && (
                <Button variant="outline" size="sm" onClick={() => handleSetInProgress(match.id)}>
                  <Play className="w-3 h-3 mr-1" /> Start
                </Button>
              )}
              {tournament.allowDraws && (
                <Button variant="outline" size="sm" onClick={() => handleCompleteMatch(match.id, match, true)}>
                  Remis
                </Button>
              )}
              <Button size="sm" className="bg-primary" onClick={() => handleCompleteMatch(match.id, match, false)}
                disabled={completeMatch.isPending}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Zatwierdź
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 border-b pb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tournaments/${id}`}><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Swords className="text-primary w-5 h-5" /> Panel prowadzącego: {tournament.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {tournament.format} · Runda {tournament.currentRound ?? "—"}/{tournament.totalRounds ?? "—"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tournaments/${id}/audience`}><Monitor className="w-4 h-4 mr-1" /> Widok widzów</Link>
          </Button>
        </div>

        {assistant && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div className="flex-1">
              <span className="font-semibold text-sm text-primary">{assistant.stepTitle}</span>
              <span className="text-muted-foreground text-sm ml-2">— {assistant.nextAction}</span>
            </div>
          </div>
        )}

        {canGenerateRound && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-secondary">Runda {tournament.currentRound} zakończona!</p>
              <p className="text-sm text-muted-foreground">Wygeneruj rundę {(tournament.currentRound ?? 0) + 1} Swiss</p>
            </div>
            <Button className="bg-secondary text-secondary-foreground" onClick={handleGenerateRound} disabled={generateNextRound.isPending}>
              Generuj rundę {(tournament.currentRound ?? 0) + 1}
            </Button>
          </div>
        )}

        <Tabs defaultValue="prowadzenie" className="w-full">
          <TabsList className="bg-card border-b rounded-none px-0 h-auto w-full justify-start flex-wrap">
            {[
              { value: "prowadzenie", label: "Prowadzenie" },
              { value: "wyniki", label: "Wyniki" },
              { value: "tabela", label: "Tabela" },
              { value: "drabinka", label: "Drabinka" },
              { value: "korekta", label: "Korekta błędów" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* PROWADZENIE */}
          <TabsContent value="prowadzenie" className="pt-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {activeMatches.length > 0 && (
                  <>
                    <h2 className="text-base font-bold text-secondary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Na żywo
                    </h2>
                    {activeMatches.map((m) => renderMatchCard(m))}
                  </>
                )}

                {pendingMatches.length > 0 && (
                  <>
                    <h2 className="text-base font-bold text-muted-foreground mt-4">Gotowe do gry</h2>
                    {pendingMatches.map((m) => renderMatchCard(m))}
                  </>
                )}

                {activeMatches.length === 0 && pendingMatches.length === 0 && (
                  <div className="bg-card border rounded-lg p-12 text-center text-muted-foreground">
                    {canGenerateRound ? "Runda zakończona. Wygeneruj kolejną rundę Swiss powyżej." :
                     tournament.status === "completed" ? "Turniej zakończony!" :
                     "Brak aktywnych meczów."}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-muted-foreground mb-2">Oczekujące ({waitingMatches.length})</h2>
                  <div className="bg-card border rounded-lg p-3 space-y-2">
                    {waitingMatches.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">Brak</p>
                    ) : waitingMatches.slice(0, 6).map((m) => (
                      <div key={m.id} className="text-xs flex justify-between border-b pb-1 last:border-0">
                        <span className="text-muted-foreground">R{m.round} M{m.matchNumber}</span>
                        <span className="truncate w-40 text-right">
                          {m.player1Name || "TBD"} vs {m.player2Name || "TBD"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-muted-foreground mb-2">Ostatnie wyniki</h2>
                  <div className="bg-card border rounded-lg p-3 space-y-2">
                    {completedMatches.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">Brak</p>
                    ) : completedMatches.slice(-5).reverse().map((m) => (
                      <div key={m.id} className="text-xs border-b pb-1 last:border-0">
                        {m.status === "bye" ? (
                          <span className="text-muted-foreground">{m.player1Name} — bye</span>
                        ) : (
                          <div className="flex justify-between">
                            <span className={m.winnerId === m.player1Id ? "font-bold text-primary" : ""}>{m.player1Name}</span>
                            <span className="text-muted-foreground">{m.score1}:{m.score2}</span>
                            <span className={m.winnerId === m.player2Id ? "font-bold text-primary" : ""}>{m.player2Name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* WYNIKI/HARMONOGRAM */}
          <TabsContent value="wyniki" className="pt-4">
            <div className="space-y-6">
              {Array.from(new Set(matches?.map((m) => m.round) || [])).sort((a, b) => a - b).map((round) => {
                const roundMatches = matches?.filter((m) => m.round === round) || [];
                return (
                  <div key={round}>
                    <h3 className="font-bold text-sm text-muted-foreground mb-2">Runda {round}</h3>
                    <div className="space-y-2">
                      {roundMatches.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 border rounded bg-card">
                          <span className="text-xs text-muted-foreground w-6">M{m.matchNumber}</span>
                          <div className={`flex-1 text-right text-sm ${m.winnerId === m.player1Id && !m.isDraw ? "font-bold text-primary" : ""}`}>
                            {m.player1Name || "TBD"}
                          </div>
                          <div className="font-mono bg-muted px-3 py-1 rounded text-sm min-w-[56px] text-center">
                            {m.status === "completed" || m.status === "bye" ? `${m.score1 ?? "—"}:${m.score2 ?? "—"}` :
                             m.status === "in_progress" ? "LIVE" : "—:—"}
                          </div>
                          <div className={`flex-1 text-sm ${m.winnerId === m.player2Id && !m.isDraw ? "font-bold text-primary" : ""}`}>
                            {m.player2Name || "TBD"}
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${
                            m.status === "in_progress" ? "border-secondary text-secondary" :
                            m.status === "completed" ? "border-green-500 text-green-400" :
                            m.status === "bye" ? "text-muted-foreground" : ""}`}>
                            {m.status === "pending" ? "—" : m.status === "in_progress" ? "LIVE" :
                             m.status === "completed" ? m.isDraw ? "R" : "OK" : m.status === "bye" ? "BYE" : m.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TABELA */}
          <TabsContent value="tabela" className="pt-4">
            {!standings || standings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Brak danych klasyfikacji.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Gracz</th>
                      <th className="py-2 px-3 text-center">Pkt</th>
                      <th className="py-2 px-3 text-center">W</th>
                      <th className="py-2 px-3 text-center">R</th>
                      <th className="py-2 px-3 text-center">P</th>
                      <th className="py-2 px-3 text-center">Buchh.</th>
                      <th className="py-2 px-3 text-center">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s) => (
                      <tr key={s.playerId} className="border-b last:border-0 hover:bg-muted/20">
                        <td className={`py-2 px-3 font-mono font-bold ${s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-gray-400" : s.rank === 3 ? "text-amber-600" : "text-muted-foreground"}`}>{s.rank}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold">{s.playerName}</div>
                          {(s.rank_name || s.teamName) && (
                            <div className="text-xs text-muted-foreground">{[s.rank_name, s.teamName, s.country].filter(Boolean).join(" · ")}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-primary">{s.points}</td>
                        <td className="py-2 px-3 text-center text-green-400">{s.wins}</td>
                        <td className="py-2 px-3 text-center text-yellow-400">{s.draws}</td>
                        <td className="py-2 px-3 text-center text-red-400">{s.losses}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{s.buchholz}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={s.pointDiff > 0 ? "text-green-400" : s.pointDiff < 0 ? "text-red-400" : "text-muted-foreground"}>
                            {s.pointDiff > 0 ? "+" : ""}{s.pointDiff}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* DRABINKA */}
          <TabsContent value="drabinka" className="pt-4">
            {bracket ? <BracketView bracket={bracket} /> : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded bg-card">
                Brak drabinki.
              </div>
            )}
          </TabsContent>

          {/* KOREKTA BŁĘDÓW */}
          <TabsContent value="korekta" className="pt-4">
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-400 text-sm">Panel korekty błędów</p>
                  <p className="text-xs text-muted-foreground">Cofnięcie wyniku może wpłynąć na kolejne rundy. Działa tylko dla ostatnio zakończonych meczów.</p>
                </div>
              </div>

              {revertConfirm && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <p className="font-semibold text-destructive mb-2">Potwierdzenie cofnięcia</p>
                  {(() => {
                    const m = matches?.find((x) => x.id === revertConfirm);
                    if (!m) return null;
                    return (
                      <div>
                        <p className="text-sm mb-3">Cofnąć wynik meczu R{m.round} M{m.matchNumber}: <strong>{m.player1Name}</strong> {m.score1}:{m.score2} <strong>{m.player2Name}</strong>?</p>
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" onClick={() => handleRevert(revertConfirm)} disabled={revertMatch.isPending}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Cofnij wynik
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setRevertConfirm(null)}>Anuluj</Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <h3 className="font-bold mb-3">Ostatnie wyniki</h3>
                {!history || history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded">Brak zakończonych meczów.</div>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 20).map((r) => {
                      const matchStillExists = matches?.find((m) => m.id === r.matchId);
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 border rounded bg-card">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">R{r.round} M{r.matchNumber}</Badge>
                            <div className="text-sm">
                              <span className={r.winnerName === r.player1Name && !r.isDraw ? "font-bold text-primary" : ""}>{r.player1Name}</span>
                              <span className="text-muted-foreground mx-2 font-mono">{r.score1}:{r.score2}</span>
                              <span className={r.winnerName === r.player2Name && !r.isDraw ? "font-bold text-primary" : ""}>{r.player2Name}</span>
                            </div>
                            {r.isDraw && <Badge variant="secondary" className="text-xs">remis</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            {r.winnerName && !r.isDraw && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ChevronRight className="w-3 h-3 text-primary" /> {r.winnerName}
                              </span>
                            )}
                            {matchStillExists && (
                              <Button variant="outline" size="sm" className="text-xs border-destructive text-destructive hover:bg-destructive/10"
                                onClick={() => setRevertConfirm(r.matchId)}>
                                <RotateCcw className="w-3 h-3 mr-1" /> Cofnij
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
