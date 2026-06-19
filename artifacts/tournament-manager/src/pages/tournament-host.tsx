import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetTournament, useListMatches, useUpdateMatch, useCompleteMatch, useRevertMatch,
  useUpdateTournament,
  useGetTournamentStandings, useGetResultsHistory, useGetTournamentAssistant, useGenerateNextRound,
  useGetTournamentBracket,
  getGetTournamentQueryKey, getListMatchesQueryKey, getGetTournamentBracketQueryKey,
  getGetTournamentStatsQueryKey, getGetTournamentStandingsQueryKey, getGetResultsHistoryQueryKey,
  getGetTournamentAssistantQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Swords, Play, CheckCircle2, RotateCcw, Monitor, ChevronRight, AlertTriangle,
  Star, Minus, Plus, SkipForward, Clock,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BracketView } from "@/components/bracket-view";

type ScoreEntry = { s1: number; s2: number };
type ConfirmEntry = { matchId: number; score1: number; score2: number; isDraw: boolean };

export default function TournamentHost() {
  const [, params] = useRoute("/tournaments/:id/host");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tournament } = useGetTournament(id, {
    query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id), refetchInterval: 5000 },
  });
  const { data: matches } = useListMatches(id, {
    query: { enabled: !!id && tournament?.status !== "draft", queryKey: getListMatchesQueryKey(id), refetchInterval: 5000 },
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
    query: { enabled: !!id, queryKey: getGetTournamentAssistantQueryKey(id), refetchInterval: 10000 },
  });

  const updateMatch = useUpdateMatch();
  const completeMatch = useCompleteMatch();
  const revertMatch = useRevertMatch();
  const generateNextRound = useGenerateNextRound();
  const updateTournament = useUpdateTournament();

  const [scores, setScores] = useState<Record<number, ScoreEntry>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [confirmComplete, setConfirmComplete] = useState<ConfirmEntry | null>(null);
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

  // --- Score helpers ---
  const getS = (matchId: number, player: 1 | 2, fallback: number | null | undefined) => {
    const e = scores[matchId];
    if (player === 1) return e?.s1 ?? fallback ?? 0;
    return e?.s2 ?? fallback ?? 0;
  };

  const adjustScore = (matchId: number, player: 1 | 2, delta: number, bo: number) => {
    const max = Math.ceil(bo / 2);
    const cur = getS(matchId, player, 0);
    const next = Math.max(0, Math.min(max, cur + delta));
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        s1: player === 1 ? next : (prev[matchId]?.s1 ?? 0),
        s2: player === 2 ? next : (prev[matchId]?.s2 ?? 0),
      },
    }));
  };

  // --- Match actions ---
  const handleSetInProgress = (matchId: number) => {
    updateMatch.mutate({ id: matchId, data: { status: "in_progress" } }, { onSuccess: invalidateAll });
  };

  const handlePostpone = (matchId: number) => {
    updateMatch.mutate(
      { id: matchId, data: { status: "postponed" } },
      {
        onSuccess: () => {
          invalidateAll();
          setConfirmComplete(null);
          toast({ title: "Mecz przełożony", description: "Możesz go przywrócić z sekcji Przełożone." });
          const next = actionableMatches.find((m) => m.id !== matchId);
          setSelectedMatchId(next?.id ?? null);
        },
      },
    );
  };

  const handleRestore = (matchId: number) => {
    updateMatch.mutate(
      { id: matchId, data: { status: "pending" } },
      {
        onSuccess: () => {
          invalidateAll();
          toast({ title: "Mecz przywrócony do kolejki" });
          setSelectedMatchId(matchId);
        },
      },
    );
  };

  const handleChangeBestOf = (matchId: number, bo: number) => {
    updateMatch.mutate({ id: matchId, data: { bestOf: bo } }, {
      onSuccess: () => {
        invalidateAll();
        setScores((prev) => {
          const e = prev[matchId];
          if (!e) return prev;
          const max = Math.ceil(bo / 2);
          return { ...prev, [matchId]: { s1: Math.min(e.s1, max), s2: Math.min(e.s2, max) } };
        });
      },
    });
  };

  const handleSetFeatured = (matchId: number) => {
    const isCurrent = tournament?.featuredMatchId === matchId;
    updateTournament.mutate(
      { id, data: { featuredMatchId: isCurrent ? null : matchId } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(id) });
          toast({ title: isCurrent ? "Usunięto z ekranu widzów" : "Pokazano widzom" });
        },
      },
    );
  };

  const handleTryComplete = (matchId: number, match: any, isDraw = false) => {
    const s1 = getS(matchId, 1, match.score1);
    const s2 = getS(matchId, 2, match.score2);

    if (!isDraw && s1 === s2 && !tournament?.allowDraws) {
      toast({ title: "Wynik jest remisem", description: "Remisy nie są dozwolone w tym turnieju.", variant: "destructive" });
      return;
    }
    // Require confirmation for 0:0 or overwriting an existing result
    const needsConfirm =
      (s1 === 0 && s2 === 0 && !isDraw) ||
      (match.status === "completed" && (match.score1 !== s1 || match.score2 !== s2));
    if (needsConfirm) {
      setConfirmComplete({ matchId, score1: s1, score2: s2, isDraw });
      return;
    }
    doComplete(matchId, s1, s2, isDraw);
  };

  const doComplete = (matchId: number, score1: number, score2: number, isDraw: boolean) => {
    completeMatch.mutate({ id: matchId, data: { score1, score2, isDraw } }, {
      onSuccess: () => {
        setScores((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
        setConfirmComplete(null);
        invalidateAll();
        toast({ title: "Wynik zapisany!" });
        const next = actionableMatches.find((m) => m.id !== matchId);
        setSelectedMatchId(next?.id ?? null);
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
      onSuccess: () => { invalidateAll(); toast({ title: "Nowa runda wygenerowana!" }); },
      onError: (e: any) => toast({ title: "Błąd", description: e?.message, variant: "destructive" }),
    });
  };

  // --- Loading ---
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

  // --- Derived match lists ---
  const actionableMatches = matches?.filter(
    (m) => (m.status === "in_progress" || m.status === "pending" || m.status === "ready") && m.player1Id && m.player2Id,
  ) || [];
  const postponedMatches = matches?.filter((m) => m.status === "postponed") || [];
  const pendingReady = matches?.filter(
    (m) => (m.status === "pending" || m.status === "ready") && m.player1Id && m.player2Id,
  ) || [];
  const completedMatches = matches?.filter((m) => m.status === "completed" || m.status === "bye") || [];
  const allCurrentRoundDone = matches
    ?.filter((m) => m.round === tournament.currentRound)
    .every((m) => m.status === "completed" || m.status === "bye" || m.status === "walkover" || m.status === "postponed") ?? false;
  const canGenerateRound =
    tournament.format === "swiss" && allCurrentRoundDone && (tournament.currentRound ?? 0) < (tournament.totalRounds ?? 0);

  // --- Focused match ---
  const featuredMatch = tournament?.featuredMatchId ? matches?.find((m) => m.id === tournament.featuredMatchId) : null;
  const inProgressMatch = matches?.find((m) => m.status === "in_progress");
  const autoFocus = featuredMatch ?? inProgressMatch ?? actionableMatches[0] ?? null;
  const focusedMatchId = selectedMatchId ?? autoFocus?.id ?? null;
  const focusedMatch = focusedMatchId ? matches?.find((m) => m.id === focusedMatchId) : null;

  const handleNextMatch = () => {
    const idx = actionableMatches.findIndex((m) => m.id === focusedMatchId);
    const next = actionableMatches[(idx + 1) % actionableMatches.length];
    if (next) setSelectedMatchId(next.id);
  };

  // --- Active match panel ---
  const renderActiveMatchPanel = () => {
    if (!focusedMatch || focusedMatch.status === "bye") {
      return (
        <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground text-lg">
          {canGenerateRound
            ? "Runda zakończona — wygeneruj kolejną rundę Swiss powyżej."
            : tournament.status === "completed"
              ? "🏆 Turniej zakończony!"
              : "Brak aktywnych meczów."}
        </div>
      );
    }

    const bo = focusedMatch.bestOf ?? 1;
    const maxScore = Math.ceil(bo / 2);
    const s1 = getS(focusedMatch.id, 1, focusedMatch.score1);
    const s2 = getS(focusedMatch.id, 2, focusedMatch.score2);
    const isFeatured = tournament?.featuredMatchId === focusedMatch.id;
    const isLive = focusedMatch.status === "in_progress";
    const isDone = focusedMatch.status === "completed";
    const isPostponed = focusedMatch.status === "postponed";
    const isShowingConfirm = confirmComplete?.matchId === focusedMatch.id;
    const isShowingRevert = revertConfirm === focusedMatch.id;

    return (
      <div className={`rounded-xl border-2 overflow-hidden transition-colors ${
        isLive
          ? "border-secondary/60 shadow-[0_0_40px_rgba(0,200,255,0.07)]"
          : isFeatured
            ? "border-yellow-500/50"
            : "border-border"
      }`}>
        {/* Header row */}
        <div className="bg-muted/20 border-b px-4 py-2.5 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-xs shrink-0">Runda {focusedMatch.round}</Badge>
            <span className="text-xs text-muted-foreground font-mono shrink-0">M{focusedMatch.matchNumber}</span>
            {isLive && (
              <Badge className="bg-secondary/20 text-secondary border-secondary/40 animate-pulse text-xs shrink-0">● LIVE</Badge>
            )}
            {isDone && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shrink-0">✓ Zakończony</Badge>
            )}
            {isPostponed && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs shrink-0">⏸ Przełożony</Badge>
            )}
            {isFeatured && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs shrink-0">★ Na ekranie</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* BO selector */}
            <div className="flex items-center gap-0.5 bg-background border rounded p-0.5">
              {([1, 3, 5] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => handleChangeBestOf(focusedMatch.id, n)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors font-medium ${
                    bo === n
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  BO{n}
                </button>
              ))}
            </div>
            {/* Featured toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${isFeatured ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}
              onClick={() => handleSetFeatured(focusedMatch.id)}
              title={isFeatured ? "Usuń z ekranu widzów" : "Pokaż na ekranie widzów"}
            >
              <Star className={`w-4 h-4 ${isFeatured ? "fill-yellow-400" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Score area */}
        <div className="p-5 md:p-8">
          <div className="flex items-center justify-center gap-4 md:gap-10">
            {/* Player 1 */}
            <div className="flex-1 flex flex-col items-center gap-4 min-w-0">
              <div className="text-center w-full px-2">
                <div
                  className="text-xl md:text-3xl font-extrabold truncate leading-tight"
                  title={focusedMatch.player1Name ?? undefined}
                >
                  {focusedMatch.player1Name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Zawodnik A</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full text-xl shrink-0"
                  onClick={() => adjustScore(focusedMatch.id, 1, -1, bo)}
                  disabled={s1 <= 0 || isDone}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <div
                  className={`text-6xl md:text-7xl font-black font-mono w-20 text-center select-none transition-colors ${
                    s1 > s2 ? "text-primary" : s1 < s2 ? "text-muted-foreground/40" : "text-foreground"
                  }`}
                >
                  {s1}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full text-xl shrink-0"
                  onClick={() => adjustScore(focusedMatch.id, 1, 1, bo)}
                  disabled={s1 >= maxScore || isDone}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Center divider */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-2xl font-bold text-muted-foreground/30">:</span>
              {bo > 1 && (
                <span className="text-[10px] text-muted-foreground/50 text-center">
                  do {maxScore} wyg.
                </span>
              )}
            </div>

            {/* Player 2 */}
            <div className="flex-1 flex flex-col items-center gap-4 min-w-0">
              <div className="text-center w-full px-2">
                <div
                  className="text-xl md:text-3xl font-extrabold truncate leading-tight"
                  title={focusedMatch.player2Name ?? undefined}
                >
                  {focusedMatch.player2Name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Zawodnik B</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full text-xl shrink-0"
                  onClick={() => adjustScore(focusedMatch.id, 2, -1, bo)}
                  disabled={s2 <= 0 || isDone}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <div
                  className={`text-6xl md:text-7xl font-black font-mono w-20 text-center select-none transition-colors ${
                    s2 > s1 ? "text-primary" : s2 < s1 ? "text-muted-foreground/40" : "text-foreground"
                  }`}
                >
                  {s2}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full text-xl shrink-0"
                  onClick={() => adjustScore(focusedMatch.id, 2, 1, bo)}
                  disabled={s2 >= maxScore || isDone}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Confirmation overlay */}
          {isShowingConfirm && confirmComplete && (
            <div className="mt-5 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-lg">
              <p className="font-semibold text-yellow-400 text-sm mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Potwierdzenie zapisu
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Zapisać wynik{" "}
                <strong className="text-foreground">
                  {focusedMatch.player1Name} {confirmComplete.score1}:{confirmComplete.score2} {focusedMatch.player2Name}
                </strong>
                {confirmComplete.score1 === 0 && confirmComplete.score2 === 0
                  ? " — wynik 0:0, czy na pewno?"
                  : isDone
                    ? " — nadpisuje istniejący wynik!"
                    : "?"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmComplete(null)}>
                  Anuluj
                </Button>
                <Button
                  size="sm"
                  className="bg-primary"
                  onClick={() => doComplete(confirmComplete.matchId, confirmComplete.score1, confirmComplete.score2, confirmComplete.isDraw)}
                  disabled={completeMatch.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Zapisz wynik
                </Button>
              </div>
            </div>
          )}

          {/* Revert confirm */}
          {isShowingRevert && (
            <div className="mt-5 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="font-semibold text-destructive text-sm mb-2">Cofnąć wynik?</p>
              <p className="text-sm text-muted-foreground mb-3">
                R{focusedMatch.round} M{focusedMatch.matchNumber}:{" "}
                <strong>{focusedMatch.player1Name}</strong> {focusedMatch.score1}:{focusedMatch.score2}{" "}
                <strong>{focusedMatch.player2Name}</strong>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setRevertConfirm(null)}>Anuluj</Button>
                <Button variant="destructive" size="sm" onClick={() => handleRevert(focusedMatch.id)} disabled={revertMatch.isPending}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Cofnij
                </Button>
              </div>
            </div>
          )}

          {/* Action bar */}
          {!isShowingConfirm && !isShowingRevert && (
            <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2 flex-wrap">
                {/* Start — for pending/ready/postponed */}
                {!isLive && !isDone && (
                  <Button
                    variant="outline"
                    onClick={() => handleSetInProgress(focusedMatch.id)}
                    disabled={updateMatch.isPending}
                  >
                    <Play className="w-4 h-4 mr-2" /> Rozpocznij
                  </Button>
                )}
                {/* Postpone — for pending/ready/in_progress (not done, not already postponed) */}
                {!isDone && !isPostponed && (
                  <Button
                    variant="outline"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handlePostpone(focusedMatch.id)}
                    disabled={updateMatch.isPending}
                  >
                    <Clock className="w-4 h-4 mr-2" /> Przełóż mecz
                  </Button>
                )}
                {/* Restore — for postponed matches */}
                {isPostponed && (
                  <Button
                    variant="outline"
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => handleRestore(focusedMatch.id)}
                    disabled={updateMatch.isPending}
                  >
                    <SkipForward className="w-4 h-4 mr-2" /> Przywróć do kolejki
                  </Button>
                )}
                {tournament.allowDraws && !isDone && !isPostponed && (
                  <Button
                    variant="outline"
                    onClick={() => handleTryComplete(focusedMatch.id, focusedMatch, true)}
                  >
                    Remis
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {isDone && (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setRevertConfirm(focusedMatch.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Cofnij wynik
                  </Button>
                )}
                {!isDone && !isPostponed && (
                  <Button
                    size="default"
                    className="bg-primary hover:bg-primary/90 font-semibold px-6"
                    onClick={() => handleTryComplete(focusedMatch.id, focusedMatch, false)}
                    disabled={completeMatch.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Zatwierdź wynik
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b pb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tournaments/${id}`}><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              <Swords className="text-primary w-5 h-5 shrink-0" />
              <span className="truncate">Panel prowadzącego: {tournament.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {tournament.format} · Runda {tournament.currentRound ?? "—"}/{tournament.totalRounds ?? "—"}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href={`/tournaments/${id}/audience`}>
              <Monitor className="w-4 h-4 mr-1" /> Widok widzów
            </Link>
          </Button>
        </div>

        {/* Assistant bar */}
        {assistant && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-primary">{assistant.stepTitle}</span>
              <span className="text-muted-foreground text-sm ml-2">— {assistant.nextAction}</span>
            </div>
          </div>
        )}

        {/* Generate round banner */}
        {canGenerateRound && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-secondary">Runda {tournament.currentRound} zakończona!</p>
              <p className="text-sm text-muted-foreground">
                Wygeneruj rundę {(tournament.currentRound ?? 0) + 1} Swiss
              </p>
            </div>
            <Button
              className="bg-secondary text-secondary-foreground"
              onClick={handleGenerateRound}
              disabled={generateNextRound.isPending}
            >
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
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══ PROWADZENIE ═══ */}
          <TabsContent value="prowadzenie" className="pt-4 space-y-4">
            {/* Big active match panel */}
            {renderActiveMatchPanel()}

            {/* Queue + recent results */}
            {(pendingReady.length > 0 || completedMatches.length > 0 || postponedMatches.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolejne mecze */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Kolejne mecze ({pendingReady.length})
                    </h3>
                    {actionableMatches.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleNextMatch}>
                        <SkipForward className="w-3.5 h-3.5" /> Następny
                      </Button>
                    )}
                  </div>
                  <div className="bg-card border rounded-lg overflow-hidden divide-y divide-border">
                    {pendingReady.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Brak oczekujących meczów</p>
                    ) : (
                      pendingReady.slice(0, 6).map((m) => (
                        <button
                          key={m.id}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors ${
                            m.id === focusedMatchId
                              ? "bg-primary/10 border-l-[3px] border-primary"
                              : "border-l-[3px] border-transparent"
                          }`}
                          onClick={() => setSelectedMatchId(m.id)}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                R{m.round}
                              </Badge>
                              <span className="text-xs text-muted-foreground">M{m.matchNumber}</span>
                              {m.bestOf && m.bestOf > 1 && (
                                <span className="text-[10px] text-muted-foreground/60">BO{m.bestOf}</span>
                              )}
                            </div>
                            <div className="text-sm font-medium truncate">
                              {m.player1Name}{" "}
                              <span className="text-muted-foreground font-normal">vs</span>{" "}
                              {m.player2Name}
                            </div>
                          </div>
                          {m.status === "in_progress" && (
                            <Badge className="shrink-0 bg-secondary/20 text-secondary border-secondary/40 text-[10px]">
                              LIVE
                            </Badge>
                          )}
                          {m.id === focusedMatchId && m.status !== "in_progress" && (
                            <span className="text-[10px] text-primary shrink-0">▶ aktywny</span>
                          )}
                        </button>
                      ))
                    )}
                    {pendingReady.length > 6 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        + {pendingReady.length - 6} więcej
                      </div>
                    )}
                  </div>
                </div>

                {/* Ostatnie wyniki */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Ostatnie wyniki</h3>
                  <div className="bg-card border rounded-lg overflow-hidden divide-y divide-border">
                    {completedMatches.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Brak zakończonych meczów</p>
                    ) : (
                      completedMatches.slice(-6).reverse().map((m) => (
                        <div key={m.id} className="px-3 py-2.5">
                          {m.status === "bye" ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">R{m.round}</Badge>
                              <span className="text-sm text-muted-foreground">{m.player1Name} — bye</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">R{m.round}</Badge>
                              <span
                                className={`text-sm truncate flex-1 text-right ${
                                  m.winnerId === m.player1Id && !m.isDraw
                                    ? "font-bold text-primary"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {m.player1Name}
                              </span>
                              <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded shrink-0 tabular-nums">
                                {m.score1}:{m.score2}
                              </span>
                              <span
                                className={`text-sm truncate flex-1 ${
                                  m.winnerId === m.player2Id && !m.isDraw
                                    ? "font-bold text-primary"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {m.player2Name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Postponed matches section */}
            {postponedMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-orange-400/80 mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Przełożone mecze ({postponedMatches.length})
                </h3>
                <div className="bg-card border border-orange-500/20 rounded-lg overflow-hidden divide-y divide-border">
                  {postponedMatches.map((m) => (
                    <div key={m.id} className="px-3 py-2.5 flex items-center gap-3">
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/30 text-orange-400/70 shrink-0">R{m.round}</Badge>
                          <span className="text-xs text-muted-foreground">M{m.matchNumber}</span>
                          {m.bestOf && m.bestOf > 1 && <span className="text-[10px] text-muted-foreground/60">BO{m.bestOf}</span>}
                        </div>
                        <div className="text-sm truncate">
                          {m.player1Name || "TBD"} <span className="text-muted-foreground">vs</span> {m.player2Name || "TBD"}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-orange-400 hover:text-orange-300"
                          onClick={() => setSelectedMatchId(m.id)}
                        >
                          Pokaż
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleRestore(m.id)}
                          disabled={updateMatch.isPending}
                        >
                          <SkipForward className="w-3 h-3 mr-1" /> Przywróć
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══ WYNIKI ═══ */}
          <TabsContent value="wyniki" className="pt-4">
            <div className="space-y-6">
              {Array.from(new Set(matches?.map((m) => m.round) || []))
                .sort((a, b) => a - b)
                .map((round) => {
                  const roundMatches = matches?.filter((m) => m.round === round) || [];
                  return (
                    <div key={round}>
                      <h3 className="font-bold text-sm text-muted-foreground mb-2">Runda {round}</h3>
                      <div className="space-y-2">
                        {roundMatches.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-3 border rounded bg-card">
                            <span className="text-xs text-muted-foreground w-6 shrink-0">M{m.matchNumber}</span>
                            <div
                              className={`flex-1 text-right text-sm ${
                                m.winnerId === m.player1Id && !m.isDraw ? "font-bold text-primary" : ""
                              }`}
                            >
                              {m.player1Name || "TBD"}
                            </div>
                            <div className="font-mono bg-muted px-3 py-1 rounded text-sm min-w-[56px] text-center shrink-0">
                              {m.status === "completed" || m.status === "bye"
                                ? `${m.score1 ?? "—"}:${m.score2 ?? "—"}`
                                : m.status === "in_progress"
                                  ? "LIVE"
                                  : "—:—"}
                            </div>
                            <div
                              className={`flex-1 text-sm ${
                                m.winnerId === m.player2Id && !m.isDraw ? "font-bold text-primary" : ""
                              }`}
                            >
                              {m.player2Name || "TBD"}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${
                                m.status === "in_progress"
                                  ? "border-secondary text-secondary"
                                  : m.status === "completed"
                                    ? "border-green-500 text-green-400"
                                    : m.status === "bye"
                                      ? "text-muted-foreground"
                                      : m.status === "postponed"
                                        ? "border-orange-500/50 text-orange-400"
                                        : ""
                              }`}
                            >
                              {m.status === "pending"
                                ? "—"
                                : m.status === "in_progress"
                                  ? "LIVE"
                                  : m.status === "completed"
                                    ? m.isDraw
                                      ? "R"
                                      : "OK"
                                    : m.status === "bye"
                                      ? "BYE"
                                      : m.status === "postponed"
                                        ? "⏸"
                                        : m.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>

          {/* ═══ TABELA ═══ */}
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
                      <th className="py-2 px-3 text-center">+/−</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s) => (
                      <tr key={s.playerId} className="border-b last:border-0 hover:bg-muted/20">
                        <td
                          className={`py-2 px-3 font-mono font-bold ${
                            s.rank === 1
                              ? "text-yellow-400"
                              : s.rank === 2
                                ? "text-gray-400"
                                : s.rank === 3
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                          }`}
                        >
                          {s.rank}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold">{s.playerName}</div>
                          {(s.rank_name || s.teamName) && (
                            <div className="text-xs text-muted-foreground">
                              {[s.rank_name, s.teamName, s.country].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-primary">{s.points}</td>
                        <td className="py-2 px-3 text-center text-green-400">{s.wins}</td>
                        <td className="py-2 px-3 text-center text-yellow-400">{s.draws}</td>
                        <td className="py-2 px-3 text-center text-red-400">{s.losses}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{s.buchholz}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={
                              s.pointDiff > 0
                                ? "text-green-400"
                                : s.pointDiff < 0
                                  ? "text-red-400"
                                  : "text-muted-foreground"
                            }
                          >
                            {s.pointDiff > 0 ? "+" : ""}
                            {s.pointDiff}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ═══ DRABINKA ═══ */}
          <TabsContent value="drabinka" className="pt-4">
            {bracket ? (
              <BracketView bracket={bracket} />
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded bg-card">
                Brak drabinki.
              </div>
            )}
          </TabsContent>

          {/* ═══ KOREKTA BŁĘDÓW ═══ */}
          <TabsContent value="korekta" className="pt-4">
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-400 text-sm">Panel korekty błędów</p>
                  <p className="text-xs text-muted-foreground">
                    Cofnięcie wyniku może wpłynąć na kolejne rundy. Działa tylko dla zakończonych meczów.
                  </p>
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
                        <p className="text-sm mb-3">
                          Cofnąć wynik meczu R{m.round} M{m.matchNumber}:{" "}
                          <strong>{m.player1Name}</strong> {m.score1}:{m.score2}{" "}
                          <strong>{m.player2Name}</strong>?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevert(revertConfirm)}
                            disabled={revertMatch.isPending}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Cofnij wynik
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setRevertConfirm(null)}>
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <h3 className="font-bold mb-3">Historia wyników</h3>
                {!history || history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded">
                    Brak zakończonych meczów.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 20).map((r) => {
                      const matchStillExists = matches?.find((m) => m.id === r.matchId);
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3 border rounded bg-card"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge variant="outline" className="text-xs shrink-0">
                              R{r.round} M{r.matchNumber}
                            </Badge>
                            <div className="text-sm min-w-0">
                              <span
                                className={
                                  r.winnerName === r.player1Name && !r.isDraw
                                    ? "font-bold text-primary"
                                    : ""
                                }
                              >
                                {r.player1Name}
                              </span>
                              <span className="text-muted-foreground mx-2 font-mono">
                                {r.score1}:{r.score2}
                              </span>
                              <span
                                className={
                                  r.winnerName === r.player2Name && !r.isDraw
                                    ? "font-bold text-primary"
                                    : ""
                                }
                              >
                                {r.player2Name}
                              </span>
                            </div>
                            {r.isDraw && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                remis
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {r.winnerName && !r.isDraw && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ChevronRight className="w-3 h-3 text-primary" /> {r.winnerName}
                              </span>
                            )}
                            {matchStillExists && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-destructive text-destructive hover:bg-destructive/10"
                                onClick={() => setRevertConfirm(r.matchId)}
                              >
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
