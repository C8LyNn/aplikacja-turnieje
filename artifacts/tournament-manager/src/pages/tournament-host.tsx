import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetTournament, useListMatches, useUpdateMatch, useCompleteMatch, useRevertMatch,
  useUpdateTournament,
  useGetTournamentStandings, useGetResultsHistory, useGetTournamentAssistant, useGenerateNextRound,
  useGetTournamentBracket,
  useGetActionLog, useUndoLastAction,
  useCancelMatch, useRestoreCancelledMatch, useSwapMatchPlayers, useReorderMatches,
  getGetTournamentQueryKey, getListMatchesQueryKey, getGetTournamentBracketQueryKey,
  getGetTournamentStatsQueryKey, getGetTournamentStandingsQueryKey, getGetResultsHistoryQueryKey,
  getGetTournamentAssistantQueryKey, getGetActionLogQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Swords, Play, CheckCircle2, RotateCcw, Monitor, AlertTriangle,
  Star, Minus, Plus, SkipForward, Clock, Undo2, Shield, History,
  Ban, ArrowUp, ArrowDown, ArrowLeftRight,
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

  const { data: actionLog } = useGetActionLog(id, {
    query: { enabled: !!id && tournament?.status !== "draft", queryKey: getGetActionLogQueryKey(id), refetchInterval: 5000 },
  });

  const updateMatch = useUpdateMatch();
  const completeMatch = useCompleteMatch();
  const revertMatch = useRevertMatch();
  const generateNextRound = useGenerateNextRound();
  const updateTournament = useUpdateTournament();
  const undoLastAction = useUndoLastAction();
  const cancelMatch = useCancelMatch();
  const restoreCancelledMatch = useRestoreCancelledMatch();
  const swapMatchPlayers = useSwapMatchPlayers();
  const reorderMatches = useReorderMatches();

  const lastUndoableAction = actionLog?.find((a) => a.canUndo);

  const [scores, setScores] = useState<Record<number, ScoreEntry>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [confirmComplete, setConfirmComplete] = useState<ConfirmEntry | null>(null);
  const [revertConfirm, setRevertConfirm] = useState<number | null>(null);
  const [undoConfirm, setUndoConfirm] = useState(false);
  const [boConfirm, setBoConfirm] = useState<{ matchId: number; bo: number } | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null);
  const [swapConfirm, setSwapConfirm] = useState<number | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStandingsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetResultsHistoryQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentAssistantQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetActionLogQueryKey(id) });
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
    const match = matches?.find((m) => m.id === matchId);
    const hasScores = (match?.score1 ?? 0) > 0 || (match?.score2 ?? 0) > 0;
    if (hasScores && match?.status === "in_progress") {
      setBoConfirm({ matchId, bo });
      return;
    }
    applyChangeBestOf(matchId, bo);
  };

  const applyChangeBestOf = (matchId: number, bo: number) => {
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

  const handleUndo = () => {
    if (!lastUndoableAction) return;
    undoLastAction.mutate({ id }, {
      onSuccess: (result) => {
        invalidateAll();
        setUndoConfirm(false);
        toast({ title: "Akcja cofnięta", description: result.message });
      },
      onError: () => {
        setUndoConfirm(false);
        toast({ title: "Błąd cofania", variant: "destructive" });
      },
    });
  };

  const handleCancel = (matchId: number) => setCancelConfirm(matchId);
  const doCancel = (matchId: number) => {
    cancelMatch.mutate({ id: matchId }, {
      onSuccess: () => {
        setCancelConfirm(null);
        invalidateAll();
        toast({ title: "Mecz anulowany", description: "Możesz go przywrócić z sekcji Anulowane." });
        if (selectedMatchId === matchId) setSelectedMatchId(null);
      },
      onError: (e: any) => toast({ title: "Błąd anulowania", description: e?.message, variant: "destructive" }),
    });
  };

  const handleRestoreCancelled = (matchId: number) => {
    restoreCancelledMatch.mutate({ id: matchId }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Mecz przywrócony do kolejki" });
        setSelectedMatchId(matchId);
      },
      onError: (e: any) => toast({ title: "Błąd", description: e?.message, variant: "destructive" }),
    });
  };

  const handleSwapPlayers = (matchId: number) => setSwapConfirm(matchId);
  const doSwapPlayers = (matchId: number) => {
    swapMatchPlayers.mutate({ id: matchId }, {
      onSuccess: () => {
        setSwapConfirm(null);
        invalidateAll();
        toast({ title: "Zawodnicy zamienieni stronami" });
      },
      onError: (e: any) => toast({ title: "Błąd zamiany", description: e?.message, variant: "destructive" }),
    });
  };

  const handleMoveInQueue = (matchId: number, direction: "up" | "down") => {
    if (!matches) return;
    const queue = [...pendingReady].sort((a, b) => (a.sortOrder ?? a.matchNumber * 10) - (b.sortOrder ?? b.matchNumber * 10));
    const idx = queue.findIndex((m) => m.id === matchId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= queue.length) return;
    const newOrder = [...queue];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    reorderMatches.mutate({ id, data: { matchIds: newOrder.map((m) => m.id) } }, {
      onSuccess: () => invalidateAll(),
      onError: (e: any) => toast({ title: "Błąd kolejkowania", description: e?.message, variant: "destructive" }),
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
  const cancelledMatches = matches?.filter((m) => m.status === "cancelled") || [];
  const pendingReady = (matches?.filter(
    (m) => (m.status === "pending" || m.status === "ready") && m.player1Id && m.player2Id,
  ) || []).sort((a, b) => (a.sortOrder ?? a.matchNumber * 10) - (b.sortOrder ?? b.matchNumber * 10));
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
    const isCancelled = focusedMatch.status === "cancelled";
    const isShowingConfirm = confirmComplete?.matchId === focusedMatch.id;
    const isShowingRevert = revertConfirm === focusedMatch.id;
    const isShowingCancel = cancelConfirm === focusedMatch.id;
    const isShowingSwap = swapConfirm === focusedMatch.id;

    return (
      <div className={`rounded-xl border-2 overflow-hidden transition-colors ${
        isCancelled
          ? "border-destructive/30 opacity-80"
          : isLive
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
            {isCancelled && (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs shrink-0">✕ Anulowany</Badge>
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

          {/* Cancel confirm */}
          {isShowingCancel && (
            <div className="mt-5 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="font-semibold text-destructive text-sm mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Anulować mecz?
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                R{focusedMatch.round} M{focusedMatch.matchNumber}:{" "}
                <strong>{focusedMatch.player1Name ?? "TBD"}</strong> vs{" "}
                <strong>{focusedMatch.player2Name ?? "TBD"}</strong>
                <br />
                <span className="text-xs">Mecz zostanie oznaczony jako anulowany. Można go przywrócić później.</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCancelConfirm(null)}>Nie anuluj</Button>
                <Button variant="destructive" size="sm" onClick={() => doCancel(focusedMatch.id)} disabled={cancelMatch.isPending}>
                  <Ban className="w-3.5 h-3.5 mr-1" /> Anuluj mecz
                </Button>
              </div>
            </div>
          )}

          {/* Swap players confirm */}
          {isShowingSwap && (
            <div className="mt-5 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="font-semibold text-orange-400 text-sm mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Zamienić zawodników stronami?
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                <strong>{focusedMatch.player1Name ?? "TBD"}</strong>
                {" ↔ "}
                <strong>{focusedMatch.player2Name ?? "TBD"}</strong>
                <br />
                <span className="text-xs">Zawodnik A stanie się B i odwrotnie. Wyniki zostaną zamienione.</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSwapConfirm(null)}>Anuluj</Button>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => doSwapPlayers(focusedMatch.id)} disabled={swapMatchPlayers.isPending}>
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Zamień strony
                </Button>
              </div>
            </div>
          )}

          {/* Restore cancelled action */}
          {isCancelled && (
            <div className="mt-5 pt-4 border-t flex items-center justify-between gap-2">
              <p className="text-sm text-destructive/80">Ten mecz jest anulowany.</p>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => handleRestoreCancelled(focusedMatch.id)}
                disabled={restoreCancelledMatch.isPending}
              >
                <SkipForward className="w-4 h-4 mr-2" /> Przywróć do kolejki
              </Button>
            </div>
          )}

          {/* Action bar */}
          {!isShowingConfirm && !isShowingRevert && !isShowingCancel && !isShowingSwap && !isCancelled && (
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
                {/* Swap players — for non-completed, both players assigned */}
                {!isDone && focusedMatch.player1Id && focusedMatch.player2Id && (
                  <Button
                    variant="outline"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleSwapPlayers(focusedMatch.id)}
                    disabled={swapMatchPlayers.isPending}
                    title="Zamień zawodnika A i B stronami"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" /> Zamień strony
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
                    <Clock className="w-4 h-4 mr-2" /> Przełóż
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
                    <SkipForward className="w-4 h-4 mr-2" /> Przywróć
                  </Button>
                )}
                {/* Cancel — for non-completed, non-cancelled */}
                {!isDone && (
                  <Button
                    variant="outline"
                    className="text-destructive/60 hover:text-destructive hover:border-destructive/50"
                    onClick={() => handleCancel(focusedMatch.id)}
                    disabled={cancelMatch.isPending}
                    title="Anuluj ten mecz"
                  >
                    <Ban className="w-4 h-4 mr-2" /> Anuluj
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
          {lastUndoableAction && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              onClick={() => setUndoConfirm(true)}
            >
              <Undo2 className="w-4 h-4 mr-1" /> Cofnij
            </Button>
          )}
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href={`/tournaments/${id}/audience`}>
              <Monitor className="w-4 h-4 mr-1" /> Widok widzów
            </Link>
          </Button>
        </div>

        {/* Undo confirmation banner */}
        {undoConfirm && lastUndoableAction && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-3 flex items-center gap-3">
            <Undo2 className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-yellow-400">Cofnąć akcję?</p>
              <p className="text-xs text-muted-foreground truncate">{lastUndoableAction.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="destructive" onClick={handleUndo} disabled={undoLastAction.isPending}>
                Cofnij
              </Button>
              <Button size="sm" variant="outline" onClick={() => setUndoConfirm(false)}>
                Anuluj
              </Button>
            </div>
          </div>
        )}

        {/* BO change confirmation */}
        {boConfirm && (() => {
          const bm = matches?.find((m) => m.id === boConfirm.matchId);
          return (
            <div className="bg-orange-500/10 border border-orange-500/40 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-orange-400">Zmiana BO w trakcie meczu</p>
                <p className="text-xs text-muted-foreground">
                  Mecz R{bm?.round}M{bm?.matchNumber} ma wynik {bm?.score1}:{bm?.score2}. Zmiana na BO{boConfirm.bo} może wyzerować maks. set. Kontynuować?
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="destructive" onClick={() => { applyChangeBestOf(boConfirm.matchId, boConfirm.bo); setBoConfirm(null); }}>
                  Zmień BO
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBoConfirm(null)}>
                  Anuluj
                </Button>
              </div>
            </div>
          );
        })()}

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
                      pendingReady.slice(0, 8).map((m, idx) => (
                        <div
                          key={m.id}
                          className={`flex items-center gap-1 pr-1 ${
                            m.id === focusedMatchId
                              ? "bg-primary/10 border-l-[3px] border-primary"
                              : "border-l-[3px] border-transparent"
                          }`}
                        >
                          {/* Reorder arrows */}
                          <div className="flex flex-col py-1 pl-1 shrink-0">
                            <button
                              className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              onClick={() => handleMoveInQueue(m.id, "up")}
                              disabled={idx === 0 || reorderMatches.isPending}
                              title="Przesuń wyżej"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              onClick={() => handleMoveInQueue(m.id, "down")}
                              disabled={idx === pendingReady.slice(0, 8).length - 1 || reorderMatches.isPending}
                              title="Przesuń niżej"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            className="flex-1 text-left px-2 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors min-w-0"
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
                          {/* Set as current button for non-focused matches */}
                          {m.id !== focusedMatchId && m.status !== "in_progress" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] px-2 shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() => { setSelectedMatchId(m.id); handleSetInProgress(m.id); }}
                              title="Ustaw jako aktualny i rozpocznij"
                            >
                              <Play className="w-2.5 h-2.5" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                    {pendingReady.length > 8 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        + {pendingReady.length - 8} więcej
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
                  <Clock className="w-3.5 h-3.5" /> Przełożone ({postponedMatches.length})
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
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-400 hover:text-orange-300" onClick={() => setSelectedMatchId(m.id)}>
                          Pokaż
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleRestore(m.id)} disabled={updateMatch.isPending}>
                          <SkipForward className="w-3 h-3 mr-1" /> Przywróć
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled matches section */}
            {cancelledMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-destructive/70 mb-2 flex items-center gap-2">
                  <Ban className="w-3.5 h-3.5" /> Anulowane ({cancelledMatches.length})
                </h3>
                <div className="bg-card border border-destructive/20 rounded-lg overflow-hidden divide-y divide-border">
                  {cancelledMatches.map((m) => (
                    <div key={m.id} className="px-3 py-2.5 flex items-center gap-3 opacity-70">
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive/60 shrink-0">R{m.round}</Badge>
                          <span className="text-xs text-muted-foreground">M{m.matchNumber}</span>
                          {m.bestOf && m.bestOf > 1 && <span className="text-[10px] text-muted-foreground/60">BO{m.bestOf}</span>}
                        </div>
                        <div className="text-sm truncate">
                          {m.player1Name || "TBD"} <span className="text-muted-foreground">vs</span> {m.player2Name || "TBD"}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedMatchId(m.id)}>
                          Pokaż
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-destructive/40 text-destructive/70 hover:bg-destructive/10"
                          onClick={() => handleRestoreCancelled(m.id)}
                          disabled={restoreCancelledMatch.isPending}
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
                                        : m.status === "cancelled"
                                          ? "border-destructive/50 text-destructive/70"
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
                                        : m.status === "cancelled"
                                          ? "✕"
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
                <Shield className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-400 text-sm">Panel korekty i historia akcji</p>
                  <p className="text-xs text-muted-foreground">
                    Przycisk „Cofnij" przy ostatniej akcji umożliwia jej bezpieczne wycofanie. Cofnięcie wyniku może wpłynąć na kolejne rundy.
                  </p>
                </div>
              </div>

              {revertConfirm && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <p className="font-semibold text-destructive mb-2">Potwierdzenie cofnięcia wyniku</p>
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
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" /> Historia akcji
                </h3>
                {!actionLog || actionLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded bg-card">
                    Brak zarejestrowanych akcji.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {actionLog.map((entry, idx) => {
                      const isFirst = idx === 0;
                      const typeColors: Record<string, string> = {
                        match_result_submitted: "text-green-400",
                        match_result_reverted: "text-orange-400",
                        match_started: "text-blue-400",
                        match_postponed: "text-yellow-400",
                        match_restored: "text-blue-300",
                        match_bo_changed: "text-purple-400",
                        match_featured: "text-primary",
                        match_unfeatured: "text-muted-foreground",
                        match_cancelled: "text-destructive",
                        match_players_swapped: "text-orange-300",
                        player_added: "text-green-300",
                        player_edited: "text-cyan-400",
                        player_removed: "text-destructive",
                        tournament_started: "text-primary font-semibold",
                      };
                      const colorClass = typeColors[entry.actionType] ?? "text-foreground";
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-2.5 border rounded bg-card gap-3 ${entry.isUndone ? "opacity-40" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`text-xs shrink-0 font-mono ${colorClass}`}>
                              {entry.actionType.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">{entry.description}</span>
                            {entry.isUndone && <Badge variant="outline" className="text-xs shrink-0">cofnięta</Badge>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            {isFirst && entry.canUndo && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                                onClick={() => setUndoConfirm(true)}
                              >
                                <Undo2 className="w-3 h-3 mr-1" /> Cofnij
                              </Button>
                            )}
                            {entry.actionType === "match_result_submitted" && !entry.isUndone && matches?.find((m) => m.id === entry.matchId) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-destructive text-destructive hover:bg-destructive/10"
                                onClick={() => entry.matchId && setRevertConfirm(entry.matchId)}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" /> Cofnij wynik
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
