import { useRoute, useSearch, useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  useGetTournament, useListMatches, useUpdateMatch, useCompleteMatch, useRevertMatch,
  useUpdateTournament,
  useGetTournamentStandings, useGetResultsHistory, useGetTournamentAssistant, useGenerateNextRound,
  useGetTournamentBracket,
  useGetActionLog, useUndoLastAction,
  useListTournamentStages, useGetTournamentStageReadiness,
  useGetDoubleEliminationStage,
  useCancelMatch, useRestoreCancelledMatch, useSwapMatchPlayers, useReorderMatches,
  getGetTournamentQueryKey, getListMatchesQueryKey, getGetTournamentBracketQueryKey,
  getGetTournamentStatsQueryKey, getGetTournamentStandingsQueryKey, getGetResultsHistoryQueryKey,
  getGetTournamentAssistantQueryKey, getGetActionLogQueryKey,
  getListTournamentStagesQueryKey, getGetTournamentStageReadinessQueryKey,
  getGetDoubleEliminationStageQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Swords, Play, CheckCircle2, RotateCcw, Monitor, AlertTriangle,
  Star, Minus, Plus, SkipForward, Clock, Undo2, Shield, History,
  Ban, ArrowUp, ArrowDown, ArrowLeftRight,
  Share2, Lock, Key, Copy, Check, Eye, EyeOff, Loader2, RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BracketView } from "@/components/bracket-view";
import { DoubleEliminationBracket } from "@/components/double-elimination-bracket";
import { MarvelEliminationStage } from "@/components/marvel-elimination-stage";
import { ForcedHeroBadge } from "@/components/deadlock-game-config";
import { PlayerBansRow, HeroSelectorButton, PickIcon } from "@/components/deadlock-bans-display";
import { usePlayerBans, useMatchGamePicks, useSetMatchGamePick } from "@/lib/deadlock-bans-picks";
import { SideIndicator } from "@/components/deadlock-side-indicator";
import type { DeadlockSide } from "@/components/deadlock-side-indicator";
import { useAuth } from "@/context/auth-context";
import { setActiveOrganizerToken, setActiveSupportToken } from "@workspace/api-client-react";
import { useSyncTournamentAuth } from "@/hooks/use-tournament-auth";
import { OrganizerLoginModal } from "@/components/organizer-login-modal";
import { OrganizerRecoveryNotice } from "@/components/organizer-recovery-notice";
import { SupportLoginModal } from "@/components/support-login-modal";
import { organizerAreaForHostTab, organizerHostTab, TournamentOrganizerNavigation } from "@/components/tournament-organizer-navigation";
import { OrganizerNextStep } from "@/components/organizer-next-step";
import { deriveOrganizerNextStep } from "@/lib/organizer-next-step";
import { deriveOrganizerCapabilities, managementRoleForCapabilities } from "@/lib/organizer-capabilities";
import { invalidateTournamentDependentQueries } from "@/lib/tournament-query-invalidation";
import { apiUpgradeLegacyOrganizer } from "@/lib/auth";
import { usePresentationTheme, resolvePresentationSettings } from "@/lib/presentation-theme";
import { getDeadlockEffectiveStageBans } from "@workspace/game-catalog";
import { STAGE_FORMAT_LABELS } from "@/lib/tournament-stages-ui";
import { matchOperationError, MATCH_STATUS_LABELS } from "@/lib/match-operation-feedback";

type ScoreEntry = { s1: number; s2: number; baseline?: string };
const scoreBaseline = (match: { player1Id?: number | null; player2Id?: number | null; score1?: number | null; score2?: number | null; bestOf?: number | null; status: string }) =>
  JSON.stringify([match.player1Id, match.player2Id, match.score1, match.score2, match.bestOf, match.status === "completed" || match.status === "cancelled" ? match.status : "open"]);

export default function TournamentHost() {
  const [, params] = useRoute("/tournaments/:id/host");
  const search = useSearch();
  const [, navigate] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    orgToken,
    supSession,
    isAuthenticated: isNewAuthTokenPresent,
    isReady: isAuthReady,
  } = useSyncTournamentAuth(id);

  const {
    data: tournament,
    error: tournamentError,
    isLoading: isLoadingTournament,
    refetch: refetchTournament,
    isFetching: isFetchingTournament,
  } = useGetTournament(id, {
    query: {
      enabled: !!id && isAuthReady,
      queryKey: getGetTournamentQueryKey(id),
      refetchInterval: 5000,
      retry: false,
    },
  });
  const matchesQuery = useListMatches(id, {
    query: { enabled: !!id && isAuthReady && tournament?.status !== "draft", queryKey: getListMatchesQueryKey(id), refetchInterval: 5000 },
  });
  const { data: matches } = matchesQuery;
  const { data: bracket } = useGetTournamentBracket(id, {
    query: { enabled: !!id && isAuthReady && tournament?.status !== "draft", queryKey: getGetTournamentBracketQueryKey(id) },
  });
  const { data: standings } = useGetTournamentStandings(id, {
    query: { enabled: !!id && isAuthReady && tournament?.status !== "draft", queryKey: getGetTournamentStandingsQueryKey(id) },
  });
  const { data: history } = useGetResultsHistory(id, {
    query: { enabled: !!id && isAuthReady && tournament?.status !== "draft", queryKey: getGetResultsHistoryQueryKey(id) },
  });
  const { data: assistant } = useGetTournamentAssistant(id, {
    query: { enabled: !!id && isAuthReady, queryKey: getGetTournamentAssistantQueryKey(id), refetchInterval: 10000 },
  });

  const { data: actionLog } = useGetActionLog(id, {
    query: { enabled: !!id && isAuthReady && tournament?.status !== "draft", queryKey: getGetActionLogQueryKey(id), refetchInterval: 5000 },
  });
  const stagesQuery = useListTournamentStages(id, {
    query: { enabled: !!id && isAuthReady, queryKey: getListTournamentStagesQueryKey(id), refetchInterval: 5000 },
  });
  const { data: stages } = stagesQuery;
  const activeStage = stages?.find((stage) => stage.status === "active");
  const operationalMatches = activeStage
    ? matches?.filter((match) => match.stageId === activeStage.id)
    : stages?.length === 0 ? matches : [];
  const doubleEliminationStage = stages?.find(
    (stage) => stage.format === "double_elimination" && stage.status !== "planned",
  );
  const marvelStage =
    tournament?.gameConfig?.gameId === "marvel"
      ? stages?.find(
          (stage) =>
            stage.format === "group_stage" && stage.status !== "planned",
        )
      : undefined;
  const doubleEliminationQuery = useGetDoubleEliminationStage(
    id,
    doubleEliminationStage?.id ?? 0,
    {
      query: {
        enabled: !!id && !!doubleEliminationStage,
        retry: false,
        queryKey: getGetDoubleEliminationStageQueryKey(id, doubleEliminationStage?.id ?? 0),
        refetchInterval: 5000,
        staleTime: 4500,
        refetchOnWindowFocus: false,
      },
    },
  );
  const plannedStage = stages?.find((stage) => stage.status === "planned");
  const { data: plannedStageReadiness } = useGetTournamentStageReadiness(
    id,
    plannedStage?.id ?? 0,
    {
      query: {
        enabled: !!id && isAuthReady && !!plannedStage,
        retry: false,
        refetchInterval: 5000,
        queryKey: getGetTournamentStageReadinessQueryKey(id, plannedStage?.id ?? 0),
      },
    },
  );

  const isDeadlock = tournament?.gameConfig?.gameId === "deadlock";
  // Computed before any early returns so React hooks order is stable.
  const rawPs = (tournament as any)?.presentationSettings as Record<string, unknown> | null | undefined;
  const presentationSettings = resolvePresentationSettings(rawPs as any);
  usePresentationTheme(presentationSettings);

  const { data: playerBansData } = usePlayerBans(id, { enabled: isDeadlock && !!id });
  const playerBansMap = new Map((playerBansData ?? []).map((b) => [b.playerId, b.bannedHeroIds]));

  const [actionError, setActionError] = useState<{ message: string; code?: string } | null>(null);
  const mutationFeedback = {
    onMutate: () => setActionError(null),
    onSuccess: () => invalidateAll(),
    onError: async (error: unknown) => {
      const { message, code, conflict } = matchOperationError(error);
      setActionError({ message, code });
      toast({ title: "Operacja nie powiodła się", description: message, variant: "destructive" });
      if (conflict) await invalidateAll();
    },
  };
  const updateMatch = useUpdateMatch({ mutation: mutationFeedback });
  const updateTournament = useUpdateTournament({ mutation: mutationFeedback });
  const completeMatch = useCompleteMatch({ mutation: mutationFeedback });
  const revertMatch = useRevertMatch({ mutation: mutationFeedback });
  const generateNextRound = useGenerateNextRound({ mutation: mutationFeedback });
  const undoLastAction = useUndoLastAction({ mutation: mutationFeedback });
  const cancelMatch = useCancelMatch({ mutation: mutationFeedback });
  const restoreCancelledMatch = useRestoreCancelledMatch({ mutation: mutationFeedback });
  const swapMatchPlayers = useSwapMatchPlayers({ mutation: mutationFeedback });
  const reorderMatches = useReorderMatches({ mutation: mutationFeedback });
  const hostPending = [updateMatch, updateTournament, completeMatch, revertMatch, generateNextRound,
    undoLastAction, cancelMatch, restoreCancelledMatch, swapMatchPlayers, reorderMatches].some((mutation) => mutation.isPending);
  const dataLoading = stagesQuery.isPending || (tournament?.status !== "draft" && matchesQuery.isPending);
  const dataError = !!tournamentError || stagesQuery.isError || (tournament?.status !== "draft" && matchesQuery.isError);

  const { role, getOrgToken, getSupSession, storeOrgToken, storeSupSession } = useAuth();
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);

  // For new-style auth (hasOrganizerPassword), check existing session tokens
  const hasNewAuth = !!(tournament?.hasOrganizerPassword);
  const isNewAuthAuthenticated = isNewAuthTokenPresent;
  const capabilities = useMemo(
    () => tournament
      ? deriveOrganizerCapabilities({
          role,
          tournament,
          hasOrganizerToken: !!orgToken,
          hasSupportSession: !!supSession,
          hasVerifiedLegacyHost: false,
        })
      : deriveOrganizerCapabilities({
          role,
          tournament: { hasHostCode: false, hasOrganizerPassword: true },
          hasOrganizerToken: false,
          hasSupportSession: false,
        }),
    [orgToken, role, supSession, tournament],
  );
  const lastUndoableAction = capabilities.canUndo
    ? actionLog?.find((action) => action.canUndo)
    : undefined;
  const managementRole = managementRoleForCapabilities(capabilities, !!orgToken, !!supSession, role);
  const activeHostTab = organizerHostTab(search, capabilities);
  const nextStep = tournament && managementRole && stages !== undefined
    ? deriveOrganizerNextStep({
        tournament,
        stages,
        matches: tournament.status === "draft" ? [] : matches,
        surface: "conducting",
        capabilities,
        plannedStageReadiness,
      })
    : null;

  const [scores, setScores] = useState<Record<number, ScoreEntry>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [revertConfirm, setRevertConfirm] = useState<number | null>(null);
  const correctionMatch = matches?.find(match => match.id === revertConfirm);
  const correctionStage = stages?.find(stage => stage.id === correctionMatch?.stageId);
  const correctionDE = useGetDoubleEliminationStage(id, correctionStage?.id ?? 0, {
    query: { enabled: isAuthReady && correctionStage?.format === "double_elimination", retry: false,
      queryKey: getGetDoubleEliminationStageQueryKey(id, correctionStage?.id ?? 0) },
  });
  const [undoConfirm, setUndoConfirm] = useState(false);
  const [boConfirm, setBoConfirm] = useState<{ matchId: number; bo: number } | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null);
  const [swapConfirm, setSwapConfirm] = useState<number | null>(null);
  const [walkoverConfirm, setWalkoverConfirm] = useState<number | null>(null);
  const [noContestConfirm, setNoContestConfirm] = useState<number | null>(null);
  const [resultReason, setResultReason] = useState("");
  const hasDraftScores = Object.keys(scores).length > 0;
  useEffect(() => {
    if (!hasDraftScores) return;
    const protectDraft = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const protectNavigation = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      if (link.pathname === window.location.pathname) return;
      if (!window.confirm("Masz niezapisany wynik. Opuścić stronę i utracić wpisane wyniki?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", protectDraft);
    document.addEventListener("click", protectNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", protectDraft);
      document.removeEventListener("click", protectNavigation, true);
    };
  }, [hasDraftScores]);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [legacyOrganizerPassword, setLegacyOrganizerPassword] = useState("");
  const [legacyUpgradePending, setLegacyUpgradePending] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- Focused match (hoisted before any early return for Rules of Hooks compliance) ---
  const _featuredMatch = tournament?.featuredMatchId
    ? operationalMatches?.find((m) => m.id === tournament.featuredMatchId && m.status !== "completed" && m.status !== "cancelled")
    : null;
  const _inProgressMatch = operationalMatches?.find((m) => m.status === "in_progress");
  const _autoFocusMatch =
    _featuredMatch ??
    _inProgressMatch ??
    operationalMatches?.find(
      (m) =>
        (m.status === "in_progress" || m.status === "pending") &&
        !!m.player1Id &&
        !!m.player2Id,
    ) ??
    null;
  const selectedMatch = matches?.find((match) => match.id === selectedMatchId);
  const focusedMatchId = selectedMatch?.id ?? _autoFocusMatch?.id ?? null;
  const focusedMatch = focusedMatchId
    ? matches?.find((m) => m.id === focusedMatchId)
    : null;
  const focusedStage = stages?.find((stage) => stage.id === focusedMatch?.stageId);
  const effectiveStageHeroBans = tournament?.gameConfig?.gameId === "deadlock" && focusedStage
    ? getDeadlockEffectiveStageBans(
        tournament.gameConfig.config,
        (stages ?? []).map((stage) => stage.stageKey),
        focusedStage.stageKey,
      )
    : [];

  // Deadlock per-game picks for the focused match (must be before any early return — Rules of Hooks)
  const { data: focusedMatchPicks } = useMatchGamePicks(focusedMatchId, {
    enabled: isDeadlock && !!focusedMatchId,
  });
  const setMatchGamePick = useSetMatchGamePick(focusedMatchId);

  // Build matchPicksMap for bracket display
  const matchPicksMap = useMemo(() => {
    const map = new Map<number, { p1HeroId?: string | null; p2HeroId?: string | null }>();
    if (isDeadlock && focusedMatchId && focusedMatchPicks && focusedMatchPicks.length > 0) {
      const last = [...focusedMatchPicks].sort((a, b) => b.gameNumber - a.gameNumber)[0];
      map.set(focusedMatchId, { p1HeroId: last.player1HeroId, p2HeroId: last.player2HeroId });
    }
    return map;
  }, [isDeadlock, focusedMatchId, focusedMatchPicks]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleLegacyUpgrade = async () => {
    setCodeError(null);
    setLegacyUpgradePending(true);
    try {
      const token = await apiUpgradeLegacyOrganizer(
        id,
        codeInput,
        legacyOrganizerPassword,
      );
      storeOrgToken(id, token);
      setActiveOrganizerToken(token);
      setCodeInput("");
      setLegacyOrganizerPassword("");
      await queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(id) });
      toast({
        title: "Zabezpieczenia zaktualizowane",
        description: "Kod legacy został wyłączony. Od teraz loguj się hasłem organizatora.",
      });
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : "Nie udało się zaktualizować zabezpieczeń.");
    } finally {
      setLegacyUpgradePending(false);
    }
  };

  const invalidateAll = () => Promise.all([
    invalidateTournamentDependentQueries(queryClient, id),
    queryClient.invalidateQueries({ queryKey: getGetActionLogQueryKey(id) }),
  ]).then(() => undefined);

  // --- Score helpers ---
  const getS = (matchId: number, player: 1 | 2, fallback: number | null | undefined) => {
    const e = scores[matchId];
    if (player === 1) return e?.s1 ?? fallback ?? 0;
    return e?.s2 ?? fallback ?? 0;
  };

  const adjustScore = (matchId: number, player: 1 | 2, delta: number, bo: number) => {
    if (!capabilities.canWriteTournamentResults) return;
    const max = Math.ceil(bo / 2);
    const match = matches?.find((entry) => entry.id === matchId);
    const cur = getS(matchId, player, player === 1 ? match?.score1 : match?.score2);
    const next = Math.max(0, Math.min(max, cur + delta));
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        baseline: prev[matchId]?.baseline ?? (match ? scoreBaseline(match) : undefined),
        s1: player === 1 ? next : (prev[matchId]?.s1 ?? match?.score1 ?? 0),
        s2: player === 2 ? next : (prev[matchId]?.s2 ?? match?.score2 ?? 0),
      },
    }));
  };

  // --- Match actions ---
  const handleSetInProgress = (matchId: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    updateMatch.mutate({ id: matchId, data: { status: "in_progress" } }, {
      onSuccess: () => toast({ title: "Mecz rozpoczęty" }),
    });
  };

  const handlePostpone = (matchId: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    updateMatch.mutate(
      { id: matchId, data: { status: "postponed" } },
      {
        onSuccess: () => {
          toast({ title: "Mecz przełożony", description: "Możesz go przywrócić z sekcji Przełożone." });
          const next = actionableMatches.find((m) => m.id !== matchId);
          setSelectedMatchId(next?.id ?? null);
        },
      },
    );
  };

  const handleRestore = (matchId: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    updateMatch.mutate(
      { id: matchId, data: { status: "pending" } },
      {
        onSuccess: () => {
          toast({ title: "Mecz przywrócony do kolejki" });
          setSelectedMatchId(matchId);
        },
      },
    );
  };

  const handleChangeBestOf = (matchId: number, bo: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    const match = matches?.find((m) => m.id === matchId);
    const hasScores = (match?.score1 ?? 0) > 0 || (match?.score2 ?? 0) > 0;
    if (hasScores && match?.status === "in_progress") {
      setBoConfirm({ matchId, bo });
      return;
    }
    applyChangeBestOf(matchId, bo);
  };

  const applyChangeBestOf = (matchId: number, bo: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    updateMatch.mutate({ id: matchId, data: { bestOf: bo } }, {
      onSuccess: () => {
        toast({ title: "Format meczu zapisany", description: `Mecz będzie rozgrywany jako BO${bo}.` });
        setScores((prev) => {
          const e = prev[matchId];
          if (!e) return prev;
          const max = Math.ceil(bo / 2);
          const refreshed = queryClient.getQueryData<typeof matches>(getListMatchesQueryKey(id))?.find(match => match.id === matchId);
          return { ...prev, [matchId]: { s1: Math.min(e.s1, max), s2: Math.min(e.s2, max), baseline: refreshed ? scoreBaseline(refreshed) : e.baseline } };
        });
      },
    });
  };

  const handleUndo = () => {
    if (!capabilities.canUndo || !lastUndoableAction) return;
    undoLastAction.mutate({ id }, {
      onSuccess: (result) => {
        setUndoConfirm(false);
        toast({ title: "Akcja cofnięta", description: result.message });
      },
    });
  };

  const handleCancel = (matchId: number) => {
    if (capabilities.canUseLegacyMatchTools) setCancelConfirm(matchId);
  };
  const doCancel = (matchId: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    cancelMatch.mutate({ id: matchId }, {
      onSuccess: () => {
        setCancelConfirm(null);
        toast({ title: "Mecz anulowany", description: "Możesz go przywrócić z sekcji Anulowane." });
        if (selectedMatchId === matchId) setSelectedMatchId(null);
      },
    });
  };

  const handleRestoreCancelled = (matchId: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    restoreCancelledMatch.mutate({ id: matchId }, {
      onSuccess: () => {
        toast({ title: "Mecz przywrócony do kolejki" });
        setSelectedMatchId(matchId);
      },
    });
  };

  const handleWalkover = (matchId: number) => {
    if (!capabilities.canWriteTournamentResults) return;
    setWalkoverConfirm(matchId);
    setRevertConfirm(null);
    setCancelConfirm(null);
    setSwapConfirm(null);
    setNoContestConfirm(null);
    setResultReason("");
  };

  const doWalkover = (matchId: number, winner: 1 | 2) => {
    if (!capabilities.canWriteTournamentResults) return;
    const match = matches?.find((candidate) => candidate.id === matchId);
    const winnerId = winner === 1 ? match?.player1Id : match?.player2Id;
    if (!winnerId) return;
    completeMatch.mutate({ id: matchId, data: { resultType: "walkover", winnerId, reason: resultReason.trim() || null } }, {
      onSuccess: () => {
        setWalkoverConfirm(null);
        setResultReason("");
        setScores((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
        toast({ title: "Walkower zapisany (W.O.)", description: `${winner === 1 ? focusedMatch?.player1Name : focusedMatch?.player2Name} wygrywa mecz.` });
        const next = actionableMatches.find((m) => m.id !== matchId);
        setSelectedMatchId(next?.id ?? null);
      },
    });
  };

  const handleNoContest = (matchId: number) => {
    if (!capabilities.canWriteTournamentResults) return;
    setNoContestConfirm(matchId);
    setWalkoverConfirm(null);
    setResultReason("");
  };

  const doNoContest = (matchId: number) => {
    if (!capabilities.canWriteTournamentResults) return;
    completeMatch.mutate({ id: matchId, data: { resultType: "no_contest", reason: resultReason.trim() || null } }, {
      onSuccess: () => {
        setNoContestConfirm(null);
        setResultReason("");
        toast({ title: "Mecz zakończony jako no contest" });
      },
    });
  };

  const handleSwapPlayers = (matchId: number) => {
    if (capabilities.canUseLegacyMatchTools) setSwapConfirm(matchId);
  };
  const doSwapPlayers = (matchId: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
    swapMatchPlayers.mutate({ id: matchId }, {
      onSuccess: () => {
        setSwapConfirm(null);
        toast({ title: "Zawodnicy zamienieni stronami" });
      },
    });
  };

  const handleMoveInQueue = (matchId: number, direction: "up" | "down") => {
    if (!capabilities.canUseLegacyMatchTools || !matches) return;
    const queue = [...pendingQueue];
    const idx = queue.findIndex((m) => m.id === matchId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= queue.length) return;
    const newOrder = [...queue];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    reorderMatches.mutate({ id, data: { matchIds: newOrder.map((m) => m.id) } }, {
      onSuccess: () => toast({ title: "Kolejność meczów zapisana" }),
    });
  };

  const handleSetFeatured = (matchId: number) => {
    if (!capabilities.canUseLegacyMatchTools) return;
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

  const handleTryComplete = (matchId: number, match: any) => {
    if (!capabilities.canWriteTournamentResults) return;
    if (scores[matchId]?.baseline && scores[matchId].baseline !== scoreBaseline(match)) return;
    const s1 = getS(matchId, 1, match.score1);
    const s2 = getS(matchId, 2, match.score2);
    const winsRequired = Math.floor((match.bestOf ?? 1) / 2) + 1;
    const isCompleteSeries =
      (s1 === winsRequired && s2 < winsRequired) ||
      (s2 === winsRequired && s1 < winsRequired);
    if (!isCompleteSeries) {
      toast({
        title: "Seria nie jest zakończona",
        description: `W BO${match.bestOf ?? 1} jedna strona musi osiągnąć ${winsRequired} wygranych gier/map.`,
        variant: "destructive",
      });
      return;
    }
    doComplete(matchId, s1, s2);
  };

  const doComplete = (matchId: number, score1: number, score2: number) => {
    if (!capabilities.canWriteTournamentResults || completeMatch.isPending) return;
    completeMatch.mutate({ id: matchId, data: { resultType: "played", score1, score2 } }, {
      onSuccess: () => {
        setScores((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
        toast({ title: "Wynik zapisany!" });
        const next = actionableMatches.find((m) => m.id !== matchId);
        setSelectedMatchId(next?.id ?? null);
      },
    });
  };

  const handleRevert = (matchId: number) => {
    if (!capabilities.canWriteTournamentResults) return;
    revertMatch.mutate({ id: matchId }, {
      onSuccess: () => {
        setRevertConfirm(null);
        setScores((prev) => { const next = { ...prev }; delete next[matchId]; return next; });
        setSelectedMatchId(matchId);
        navigate(`/tournaments/${id}/host`);
        toast({ title: "Wynik cofnięty", description: "Wpisz poprawny wynik wybranego meczu i zapisz go." });
      },
    });
  };

  const handleGenerateRound = () => {
    if (!capabilities.canGenerateRound) return;
    generateNextRound.mutate({ id }, {
      onSuccess: () => toast({ title: "Nowa runda wygenerowana!" }),
    });
  };

  // --- Loading ---
  if (!tournament && isLoadingTournament) {
    return <Layout><div className="animate-pulse h-64 bg-card rounded-xl" /></Layout>;
  }
  if (!tournament && tournamentError) {
    const status = (tournamentError as { status?: number }).status;
    if (status !== 401 && status !== 403) {
      return <Layout><div role="alert" className="mx-auto max-w-lg space-y-3 rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">Nie udało się pobrać turnieju</h1>
        <p className="text-sm text-muted-foreground">{status === 404
          ? "Nie znaleziono turnieju pod tym adresem. Sprawdź otrzymany link."
          : "Sprawdź połączenie i spróbuj ponownie. Nie można jeszcze potwierdzić aktualnego stanu turnieju."}</p>
        <Button variant="outline" disabled={isFetchingTournament} onClick={() => void refetchTournament()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Spróbuj ponownie
        </Button>
      </div></Layout>;
    }
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-sm space-y-5 text-center">
            <Shield className="w-10 h-10 text-primary mx-auto" />
            <div>
              <h1 className="text-xl font-bold">Panel prowadzącego</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Zaloguj się jako organizator, aby uzyskać dostęp do prywatnego
                turnieju.
              </p>
            </div>
            <Button className="w-full" onClick={() => setShowOrgModal(true)}>
              <Key className="w-4 h-4 mr-2" /> Zaloguj jako organizator
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
              <Link href={`/tournaments/${id}`}><ArrowLeft className="w-4 h-4 mr-1" /> Wróć do turnieju</Link>
            </Button>
          </div>
        </div>
        <OrganizerLoginModal
          open={showOrgModal}
          onClose={() => setShowOrgModal(false)}
          tournamentId={id}
          tournamentName={`Turniej #${id}`}
          onSuccess={() => {
            setShowOrgModal(false);
            void queryClient.invalidateQueries({
              queryKey: getGetTournamentQueryKey(id),
            });
          }}
        />
      </Layout>
    );
  }
  if (!tournament) {
    return <Layout><div className="animate-pulse h-64 bg-card rounded-xl" /></Layout>;
  }

  // --- New-style auth gate (organizer password system) ---
  if (tournament && hasNewAuth && !isNewAuthAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Panel prowadzącego</h1>
              <p className="text-sm text-muted-foreground">{tournament.name}</p>
              <p className="text-xs text-muted-foreground">Zaloguj się jako organizator lub wsparcie.</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => setShowOrgModal(true)}>
                <Key className="w-4 h-4 mr-2" /> Zaloguj jako organizator
              </Button>
              {tournament.hasSupportPassword && (
                <Button variant="outline" className="w-full" onClick={() => setShowSupModal(true)}>
                  <Shield className="w-4 h-4 mr-2" /> Zaloguj jako wsparcie
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                <Link href={`/tournaments/${id}`}><ArrowLeft className="w-4 h-4 mr-1" /> Wróć do turnieju</Link>
              </Button>
            </div>
          </div>
        </div>
        <OrganizerLoginModal
          open={showOrgModal}
          onClose={() => setShowOrgModal(false)}
          tournamentId={id}
          tournamentName={tournament.name}
          onSuccess={(token) => {
            storeOrgToken(id, token);
            setActiveOrganizerToken(token);
            setShowOrgModal(false);
          }}
        />
        <SupportLoginModal
          open={showSupModal}
          onClose={() => setShowSupModal(false)}
          tournamentId={id}
          tournamentName={tournament.name}
          onSuccess={(token, nick) => {
            storeSupSession(id, token, nick);
            setActiveSupportToken(token);
            setShowSupModal(false);
          }}
        />
      </Layout>
    );
  }

  if (!hasNewAuth && !tournament.hasHostCode && !isNewAuthTokenPresent) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center space-y-3">
            <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="text-xl font-bold">Panel prowadzącego jest zablokowany</h1>
            <p className="text-sm text-muted-foreground">
              Ten historyczny turniej nie ma skonfigurowanego hasła organizatora ani kodu prowadzącego. Brak poświadczeń nie daje dostępu do mutacji.
            </p>
            <Button variant="outline" asChild>
              <Link href={`/tournaments/${id}`}><ArrowLeft className="w-4 h-4 mr-1" /> Wróć do turnieju</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Historical host codes are accepted only once to establish a real organizer password.
  if (!hasNewAuth && tournament.hasHostCode && !isNewAuthTokenPresent) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Panel prowadzącego</h1>
              <p className="text-sm text-muted-foreground">{tournament.name}</p>
              <p className="text-xs text-muted-foreground">
                Ten historyczny turniej używa starego kodu. Ustaw hasło organizatora, aby bezpiecznie przejść na aktualny model logowania.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="gate-code">Kod prowadzącego</Label>
                <div className="relative">
                  <Input
                    id="gate-code"
                    type={showCodeInput ? "text" : "password"}
                    placeholder="Wpisz kod..."
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setCodeError(null); }}
                    className={codeError ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCodeInput((v) => !v)}
                  >
                    {showCodeInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {codeError && <p className="text-xs text-destructive">{codeError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legacy-organizer-password">Nowe hasło organizatora</Label>
                <Input
                  id="legacy-organizer-password"
                  type="password"
                  minLength={8}
                  placeholder="Minimum 8 znaków"
                  value={legacyOrganizerPassword}
                  onChange={(event) => setLegacyOrganizerPassword(event.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!codeInput || legacyOrganizerPassword.length < 8 || legacyUpgradePending}
                onClick={handleLegacyUpgrade}
              >
                {legacyUpgradePending ? "Aktualizowanie…" : "Ustaw hasło i przejdź do panelu"}
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                <Link href={`/tournaments/${id}`}><ArrowLeft className="w-4 h-4 mr-1" /> Wróć do turnieju</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!capabilities.canViewOrganizerNavigation) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center space-y-3">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="text-xl font-bold">Brak uprawnień do prowadzenia</h1>
            <p className="text-sm text-muted-foreground">
              Zaloguj się jako organizator albo użyj aktywnej sesji wsparcia.
            </p>
            <Button variant="outline" asChild>
              <Link href={`/tournaments/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Wróć do turnieju
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Derived match lists ---
  const actionableMatches = operationalMatches?.filter(
    (m) => (m.status === "in_progress" || m.status === "pending") && m.player1Id && m.player2Id,
  ) || [];
  const postponedMatches = operationalMatches?.filter((m) => m.status === "postponed") || [];
  const cancelledMatches = operationalMatches?.filter((m) => m.status === "cancelled") || [];
  const queueMatches = [...actionableMatches].sort((a, b) => (a.sortOrder ?? a.matchNumber * 10) - (b.sortOrder ?? b.matchNumber * 10));
  const pendingQueue = queueMatches.filter((match) => match.status === "pending");
  const completedMatches = operationalMatches?.filter((m) => m.status === "completed") || [];
  const matchStageGroups = Array.from(new Set(matches?.map(match => match.stageId ?? null))).map(stageId => {
    const stage = stages?.find(entry => entry.id === stageId);
    return { id: stageId, name: stage?.name ?? (stageId === null ? "Mecze bez przypisanego etapu" : `Etap ${stageId}`), position: stage?.position ?? Number.MAX_SAFE_INTEGER };
  }).sort((a, b) => a.position - b.position);
  const canGenerateRound = nextStep?.kind === "swiss_round";

  const handleNextMatch = () => {
    const idx = actionableMatches.findIndex((m) => m.id === focusedMatchId);
    const next = actionableMatches[(idx + 1) % actionableMatches.length];
    if (next) setSelectedMatchId(next.id);
  };

  // --- Active match panel ---
  const renderActiveMatchPanel = () => {
    if (!focusedMatch || focusedMatch.resultType === "bye") {
      return (
        <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
          {canGenerateRound
            ? "Runda zakończona — wygeneruj kolejną rundę Swiss powyżej."
            : tournament.status === "completed"
              ? "🏆 Turniej zakończony!"
              : activeStage ? "Brak meczów gotowych do rozegrania. Sprawdź stan etapu i oczekujące pary."
                : "Przygotuj najbliższy etap w zakładce Etapy. Po jego rozpoczęciu pojawi się tutaj kolejka meczów."}
        </div>
      );
    }

    const bo = focusedMatch.bestOf ?? 1;
    const maxScore = Math.ceil(bo / 2);
    const s1 = focusedMatch.status === "completed" ? focusedMatch.score1 ?? 0 : getS(focusedMatch.id, 1, focusedMatch.score1);
    const s2 = focusedMatch.status === "completed" ? focusedMatch.score2 ?? 0 : getS(focusedMatch.id, 2, focusedMatch.score2);
    const isFeatured = tournament?.featuredMatchId === focusedMatch.id;
    const isLive = focusedMatch.status === "in_progress";
    const isDone = focusedMatch.status === "completed";
    const staleDraft = !!scores[focusedMatch.id]?.baseline && scores[focusedMatch.id].baseline !== scoreBaseline(focusedMatch);
    const isPostponed = focusedMatch.status === "postponed";
    const isCancelled = focusedMatch.status === "cancelled";
    const isShowingCancel = cancelConfirm === focusedMatch.id;
    const isShowingSwap = swapConfirm === focusedMatch.id;
    const isShowingWalkover = walkoverConfirm === focusedMatch.id;
    const isShowingNoContest = noContestConfirm === focusedMatch.id;
    const isCompleteSeries =
      (s1 === maxScore && s2 < maxScore) ||
      (s2 === maxScore && s1 < maxScore);
    const completedResultLabel = focusedMatch.resultType === "played"
      ? `${focusedMatch.score1}:${focusedMatch.score2}`
      : focusedMatch.resultType === "walkover"
        ? "W.O."
        : "N/C";

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
            <span className="text-sm font-semibold">Wybrany mecz</span>
            <span className="text-xs text-muted-foreground">{stages?.find(stage => stage.id === focusedMatch.stageId)?.name}</span>
            <Badge variant="outline" className="text-xs shrink-0">Runda {focusedMatch.round}</Badge>
            <span className="text-xs text-muted-foreground font-mono shrink-0">M{focusedMatch.matchNumber}</span>
            {isLive && (
              <Badge className="bg-secondary/20 text-secondary border-secondary/40 animate-pulse text-xs shrink-0">● LIVE</Badge>
            )}
            {isDone && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shrink-0">✓ Zakończony</Badge>
            )}
            {!isLive && !isDone && !isPostponed && !isCancelled && <Badge variant="outline">Oczekuje</Badge>}
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
            {capabilities.canUseLegacyMatchTools && <>
            {/* BO selector */}
            <div className="flex items-center gap-0.5 bg-background border rounded p-0.5">
              {([1, 3, 5, 7] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => handleChangeBestOf(focusedMatch.id, n)}
                  disabled={focusedMatch.status !== "pending"}
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
            </>}
          </div>
        </div>

        {/* Score area */}
        <div className="p-4 md:p-5">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wygrane gry / mapy</p>
          <div className="flex items-center justify-center gap-3 md:gap-6">
            {/* Player 1 */}
            <div className="flex-1 flex flex-col items-center gap-4 min-w-0">
              {isDeadlock && (() => {
                const latestPick = focusedMatchPicks && focusedMatchPicks.length > 0
                  ? [...focusedMatchPicks].sort((a, b) => b.gameNumber - a.gameNumber)[0]
                  : null;
                return <PickIcon heroId={latestPick?.player1HeroId ?? null} size={76} />;
              })()}
              <div className="text-center w-full px-2">
                <div
                  className="text-xl md:text-2xl font-extrabold truncate leading-tight"
                  title={focusedMatch.player1Name ?? undefined}
                >
                  {focusedMatch.player1Name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Zawodnik A</div>
              </div>
              {isDeadlock && focusedMatch.player1Id && ((tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5) > 0 && (
                <PlayerBansRow bannedHeroIds={playerBansMap.get(focusedMatch.player1Id) ?? []} size={30} maxBans={(tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5} />
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full text-xl shrink-0"
                  onClick={() => adjustScore(focusedMatch.id, 1, -1, bo)}
                  aria-label={`Zmniejsz wynik: ${focusedMatch.player1Name}`}
                  disabled={!capabilities.canWriteTournamentResults || s1 <= 0 || isDone || staleDraft}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <div
                  className={`text-5xl md:text-6xl font-black font-mono w-20 text-center select-none transition-colors ${
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
                  aria-label={`Zwiększ wynik: ${focusedMatch.player1Name}`}
                  disabled={!capabilities.canWriteTournamentResults || s1 >= maxScore || isDone || staleDraft}
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
              {isDeadlock && (() => {
                const latestPick = focusedMatchPicks && focusedMatchPicks.length > 0
                  ? [...focusedMatchPicks].sort((a, b) => b.gameNumber - a.gameNumber)[0]
                  : null;
                return <PickIcon heroId={latestPick?.player2HeroId ?? null} size={76} />;
              })()}
              <div className="text-center w-full px-2">
                <div
                  className="text-xl md:text-2xl font-extrabold truncate leading-tight"
                  title={focusedMatch.player2Name ?? undefined}
                >
                  {focusedMatch.player2Name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Zawodnik B</div>
              </div>
              {isDeadlock && focusedMatch.player2Id && ((tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5) > 0 && (
                <PlayerBansRow bannedHeroIds={playerBansMap.get(focusedMatch.player2Id) ?? []} size={30} maxBans={(tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5} />
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full text-xl shrink-0"
                  onClick={() => adjustScore(focusedMatch.id, 2, -1, bo)}
                  aria-label={`Zmniejsz wynik: ${focusedMatch.player2Name}`}
                  disabled={!capabilities.canWriteTournamentResults || s2 <= 0 || isDone || staleDraft}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <div
                  className={`text-5xl md:text-6xl font-black font-mono w-20 text-center select-none transition-colors ${
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
                  aria-label={`Zwiększ wynik: ${focusedMatch.player2Name}`}
                  disabled={!capabilities.canWriteTournamentResults || s2 >= maxScore || isDone || staleDraft}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Deadlock per-game picks editor */}
          {isDeadlock && capabilities.canWriteTournamentResults && !isDone && !isCancelled && (
            <div className="px-5 pb-4 border-t border-border/40 pt-4">
              {effectiveStageHeroBans.length > 0 && (
                <PlayerBansRow
                  bannedHeroIds={effectiveStageHeroBans}
                  size={32}
                  maxBans={effectiveStageHeroBans.length}
                  className="mb-3"
                />
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <span className="text-cyan-500/80">◈</span> Postacie graczy (gry)
              </p>
              <div className="space-y-2">
                {Array.from({ length: bo }, (_, i) => {
                  const gn = i + 1;
                  const pick = (focusedMatchPicks ?? []).find((p) => p.gameNumber === gn);
                  const p1Side = (pick?.player1Side ?? null) as DeadlockSide | null;
                  const p2Side = (pick?.player2Side ?? null) as DeadlockSide | null;
                  return (
                    <div key={gn} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground/60 w-7 shrink-0">G{gn}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <HeroSelectorButton
                          heroId={pick?.player1HeroId}
                          onSelect={(heroId) => setMatchGamePick.mutate({ gameNumber: gn, player1HeroId: heroId, player2HeroId: pick?.player2HeroId ?? null })}
                          placeholder={focusedMatch.player1Name ?? "Zaw. A"}
                          size={34}
                          bannedByOpponent={(() => {
                            const p1Bans = focusedMatch.player1Id ? (playerBansMap.get(focusedMatch.player1Id) ?? []) : [];
                            const p2Bans = focusedMatch.player2Id ? (playerBansMap.get(focusedMatch.player2Id) ?? []) : [];
                            const banMode = (tournament?.gameConfig as any)?.config?.banMode ?? "shared_pool";
                            return banMode === "shared_pool"
                              ? Array.from(new Set([...p1Bans, ...p2Bans, ...effectiveStageHeroBans]))
                              : Array.from(new Set([...p2Bans, ...effectiveStageHeroBans]));
                          })()}
                          opponentName={focusedMatch.player2Name}
                        />
                        {p1Side && <SideIndicator side={p1Side} size="sm" showLabel={false} />}
                      </div>
                      <button
                        type="button"
                        title="Zamień stronę — ta gra"
                        className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground shrink-0 px-1"
                        onClick={() => {
                          const nextSide: DeadlockSide = p1Side === "archmother" ? "hidden_king" : "archmother";
                          setMatchGamePick.mutate({ gameNumber: gn, player1HeroId: pick?.player1HeroId ?? null, player2HeroId: pick?.player2HeroId ?? null, player1Side: nextSide });
                        }}
                        disabled={setMatchGamePick.isPending}
                      >
                        ↔
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {p2Side && <SideIndicator side={p2Side} size="sm" showLabel={false} />}
                        <HeroSelectorButton
                          heroId={pick?.player2HeroId}
                          onSelect={(heroId) => setMatchGamePick.mutate({ gameNumber: gn, player1HeroId: pick?.player1HeroId ?? null, player2HeroId: heroId })}
                          placeholder={focusedMatch.player2Name ?? "Zaw. B"}
                          size={34}
                          bannedByOpponent={(() => {
                            const p1Bans = focusedMatch.player1Id ? (playerBansMap.get(focusedMatch.player1Id) ?? []) : [];
                            const p2Bans = focusedMatch.player2Id ? (playerBansMap.get(focusedMatch.player2Id) ?? []) : [];
                            const banMode = (tournament?.gameConfig as any)?.config?.banMode ?? "shared_pool";
                            return banMode === "shared_pool"
                              ? Array.from(new Set([...p1Bans, ...p2Bans, ...effectiveStageHeroBans]))
                              : Array.from(new Set([...p1Bans, ...effectiveStageHeroBans]));
                          })()}
                          opponentName={focusedMatch.player1Name}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancel confirm */}
          {capabilities.canUseLegacyMatchTools && isShowingCancel && (
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
          {capabilities.canUseLegacyMatchTools && isShowingSwap && (
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

          {/* Walkover confirm */}
          {capabilities.canWriteTournamentResults && isShowingWalkover && (
            <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="font-semibold text-blue-400 text-sm mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Walkover — kto wygrał?
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Wybierz zawodnika, który <strong>wygrał</strong> (drugi nie pojawił się).
                Walkower zmienia wyłącznie bilans meczów i nie tworzy wyniku serii.
              </p>
              <Input
                className="mb-3"
                value={resultReason}
                onChange={(event) => setResultReason(event.target.value)}
                placeholder="Powód (opcjonalnie)"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setWalkoverConfirm(null)}>Anuluj</Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => doWalkover(focusedMatch.id, 1)}
                  disabled={completeMatch.isPending}
                >
                  ✓ {focusedMatch.player1Name ?? "Zawodnik A"} wygrał
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => doWalkover(focusedMatch.id, 2)}
                  disabled={completeMatch.isPending}
                >
                  ✓ {focusedMatch.player2Name ?? "Zawodnik B"} wygrał
                </Button>
              </div>
            </div>
          )}

          {capabilities.canWriteTournamentResults && isShowingNoContest && (
            <div className="mt-5 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="font-semibold text-orange-400 text-sm mb-1">No contest — bez zwycięzcy</p>
              <p className="text-sm text-muted-foreground mb-3">
                Mecz zostanie zakończony bez wpływu na bilans meczów i gier. Ta decyzja nie jest dostępna w eliminacjach.
              </p>
              <Input
                className="mb-3"
                value={resultReason}
                onChange={(event) => setResultReason(event.target.value)}
                placeholder="Powód (opcjonalnie)"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setNoContestConfirm(null)}>Anuluj</Button>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => doNoContest(focusedMatch.id)} disabled={completeMatch.isPending}>
                  Zapisz no contest
                </Button>
              </div>
            </div>
          )}

          {/* Restore cancelled action */}
          {capabilities.canUseLegacyMatchTools && isCancelled && (
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
          {!isShowingCancel && !isShowingSwap && !isShowingWalkover && !isShowingNoContest && !isCancelled && (
            <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2 flex-wrap">
                {/* Start — for pending/postponed */}
                {capabilities.canUseLegacyMatchTools && !isLive && !isDone && (
                  <Button
                    variant="outline"
                    onClick={() => handleSetInProgress(focusedMatch.id)}
                    disabled={updateMatch.isPending}
                  >
                    <Play className="w-4 h-4 mr-2" /> Rozpocznij mecz
                  </Button>
                )}
                {/* Swap players — for non-completed, both players assigned */}
                {capabilities.canUseLegacyMatchTools && !isDone && focusedMatch.player1Id && focusedMatch.player2Id && (
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
                {/* Postpone — for pending/in_progress (not done, not already postponed) */}
                {capabilities.canUseLegacyMatchTools && !isDone && !isPostponed && (
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
                {capabilities.canUseLegacyMatchTools && isPostponed && (
                  <Button
                    variant="outline"
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => handleRestore(focusedMatch.id)}
                    disabled={updateMatch.isPending}
                  >
                    <SkipForward className="w-4 h-4 mr-2" /> Przywróć
                  </Button>
                )}
                {/* Walkover — for non-completed, non-cancelled, both players present */}
                {capabilities.canWriteTournamentResults && !isDone && !isPostponed && focusedMatch.player1Id && focusedMatch.player2Id && (
                  <Button
                    variant="outline"
                    className="text-blue-400/70 hover:text-blue-400 hover:border-blue-400/50"
                    onClick={() => handleWalkover(focusedMatch.id)}
                    disabled={completeMatch.isPending}
                    title="Walkover — jeden zawodnik nie pojawił się"
                  >
                    W.O.
                  </Button>
                )}
                {capabilities.canWriteTournamentResults && !isDone && !isPostponed && tournament.format !== "single_elimination" && focusedMatch.player1Id && focusedMatch.player2Id && (
                  <Button
                    variant="outline"
                    className="text-orange-400/70 hover:text-orange-400 hover:border-orange-400/50"
                    onClick={() => handleNoContest(focusedMatch.id)}
                    disabled={completeMatch.isPending}
                  >
                    No contest
                  </Button>
                )}
                {/* Cancel — for non-completed, non-cancelled */}
                {capabilities.canUseLegacyMatchTools && !isDone && (
                  <Button
                    variant="outline"
                    className="text-destructive/60 hover:text-destructive hover:border-destructive/50"
                    onClick={() => handleCancel(focusedMatch.id)}
                    disabled={cancelMatch.isPending}
                    title="Anuluj ten mecz"
                  >
                    <Ban className="w-4 h-4 mr-2" /> Anuluj mecz
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {capabilities.canWriteTournamentResults && isDone && (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setRevertConfirm(focusedMatch.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Popraw wynik
                  </Button>
                )}
                {capabilities.canWriteTournamentResults && !isDone && !isPostponed && (
                  <Button
                    size="default"
                    className="bg-primary hover:bg-primary/90 font-semibold px-6"
                    onClick={() => handleTryComplete(focusedMatch.id, focusedMatch)}
                    disabled={completeMatch.isPending || !isCompleteSeries || staleDraft}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Zapisz wynik
                  </Button>
                )}
              </div>
            </div>
          )}
          {!isDone && !isCancelled && (
            <p className="mt-3 text-sm text-muted-foreground">
              {scores[focusedMatch.id]
                ? "Wynik roboczy — nie jest jeszcze zapisany. Zapisz go po zakończeniu meczu."
                : `Do wygrania meczu potrzeba ${maxScore} ${maxScore === 1 ? "wygranej" : "wygranych"}. Ustaw wynik przyciskami + i −.`}
            </p>
          )}
          {isDone && <p className="mt-3 text-sm text-muted-foreground">Wynik zapisany: {completedResultLabel}. Aby go zmienić, wybierz „Popraw wynik”.</p>}
          {staleDraft && <p className="mt-3 text-sm text-orange-400">Stan meczu zmienił się od rozpoczęcia edycji. Twój wynik roboczy: {scores[focusedMatch.id].s1}:{scores[focusedMatch.id].s2}. Aktualny wynik: {focusedMatch.score1 ?? 0}:{focusedMatch.score2 ?? 0}. Odrzuć wynik roboczy i sprawdź mecz przed kolejnym zapisem.</p>}
          {scores[focusedMatch.id] && <Button variant="ghost" size="sm" className="mt-2" onClick={() => {
            setScores((prev) => { const next = { ...prev }; delete next[focusedMatch.id]; return next; });
          }}>Odrzuć wynik roboczy</Button>}
        </div>
      </div>
    );
  };

  return (
    <Layout colorPreset={presentationSettings.colorPreset || undefined}>
      <div className="flex flex-col gap-4 max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 border-b pb-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tournaments/${id}`} aria-label="Wróć do szczegółów turnieju"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Swords className="text-primary w-5 h-5 shrink-0" />
              <span className="break-words">{tournament.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Prowadzenie turnieju
            </p>
            <div className="mt-1">
              <ForcedHeroBadge gameConfig={tournament.gameConfig} compact />
            </div>
          </div>
          {capabilities.canManageSharing && <Button variant="outline" size="sm" className="shrink-0" onClick={() => setShowShareDialog(true)}>
            <Share2 className="w-4 h-4 mr-1" /> Udostępnij
          </Button>}
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href={`/tournaments/${id}/audience`}>
              <Monitor className="w-4 h-4 mr-1" /> Widok widzów
            </Link>
          </Button>
        </div>

        {managementRole && (
          <TournamentOrganizerNavigation
            tournamentId={id}
            active={organizerAreaForHostTab(activeHostTab)}
            capabilities={capabilities}
          />
        )}
        {orgToken && !tournament.hasOrganizerPassword && <OrganizerRecoveryNotice tournamentId={id} />}
        <section aria-label="Stan prowadzenia" className="rounded-xl border border-primary/30 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {dataLoading ? "Sprawdzanie stanu" : activeStage ? `Aktywny etap · ${activeStage.position} z ${stages?.length}`
                  : tournament.status === "completed" ? "Turniej zakończony" : "Przygotowanie etapu"}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{activeStage?.name ?? plannedStage?.name ?? tournament.name}</h2>
              {activeStage && <p className="mt-1 text-sm text-muted-foreground">
                {STAGE_FORMAT_LABELS[activeStage.format]} · Runda {activeStage.currentRound ?? tournament.currentRound ?? "—"}/{activeStage.totalRounds ?? activeStage.plannedRounds ?? tournament.totalRounds ?? "—"}
              </p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild><Link href={`/tournaments/${id}/host?tab=wyniki`}>Wszystkie mecze i wyniki</Link></Button>
              <Button variant="outline" size="sm" asChild><Link href={`/tournaments/${id}?tab=stages`}>Sprawdź etapy</Link></Button>
            </div>
          </div>
          {!dataLoading && !dataError && activeStage && <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4">
            {[
              ["W trakcie", operationalMatches?.filter((match) => match.status === "in_progress").length ?? 0],
              ["Gotowe do gry", queueMatches.filter((match) => match.status === "pending").length],
              ["Zakończone", completedMatches.length],
              ["Pozostałe", (operationalMatches?.length ?? 0) - queueMatches.length - completedMatches.length],
            ].map(([label, count]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{count}</dd></div>)}
          </dl>}
          {!dataLoading && !dataError && activeStage && (operationalMatches?.length ?? 0) > queueMatches.length + completedMatches.length &&
            <p className="mt-3 text-xs text-muted-foreground">Pozostałe mecze oczekują na pełną parę, zostały przełożone lub anulowane.</p>}
        </section>
        {dataLoading && !dataError && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Pobieranie stanu etapu i meczów…</p>}
        {dataError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="font-semibold">Nie udało się odświeżyć stanu prowadzenia.</p>
          <p className="mt-1 text-sm text-muted-foreground">Dane mogą być nieaktualne. Operacje są wstrzymane do ponownego pobrania etapu i meczów.</p>
          <Button variant="outline" size="sm" className="mt-3" disabled={isFetchingTournament || stagesQuery.isFetching || matchesQuery.isFetching} onClick={() => void Promise.all([refetchTournament(), stagesQuery.refetch(), matchesQuery.refetch()])}><RefreshCw className="mr-2 h-4 w-4" /> Spróbuj ponownie</Button>
        </div>}
        {actionError && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="font-semibold">Operacja nie powiodła się</p><p className="mt-1 text-sm">{actionError.message}</p>
          {actionError.code && <p className="mt-2 text-xs text-muted-foreground">Kod diagnostyczny: {actionError.code}</p>}
        </div>}
        {hostPending && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie i odświeżanie stanu…</p>}
        <fieldset disabled={hostPending || dataLoading || dataError} className="contents">
        {nextStep && !dataLoading && !dataError && nextStep.kind !== "active_matches" && (
          <OrganizerNextStep
            step={nextStep.kind === "complete_stage" ? { ...nextStep, description: "Przejdź do Etapów, sprawdź ranking i potwierdź zakończenie. Następnie zweryfikuj kwalifikację do kolejnego etapu." } : nextStep}
            onAction={nextStep.kind === "swiss_round" ? handleGenerateRound : undefined}
            pending={generateNextRound.isPending}
          />
        )}
        {capabilities.canUndo && lastUndoableAction && !undoConfirm && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Ostatnia akcja: {lastUndoableAction.description}</span>
            <Button variant="ghost" size="sm" className="h-7 text-yellow-500" onClick={() => setUndoConfirm(true)}>
              <Undo2 className="mr-1 h-3.5 w-3.5" /> Cofnij
            </Button>
          </div>
        )}

        {/* Undo confirmation banner */}
        {capabilities.canUndo && undoConfirm && lastUndoableAction && (
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
        {capabilities.canUseLegacyMatchTools && boConfirm && (() => {
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
        <Tabs value={activeHostTab} className="w-full">

          {/* ═══ PROWADZENIE ═══ */}
          <TabsContent value="prowadzenie" className="pt-4 space-y-4">
            {/* Big active match panel */}
            {!dataLoading && !dataError && renderActiveMatchPanel()}

            {/* Queue + recent results */}
            {(queueMatches.length > 0 || completedMatches.length > 0 || postponedMatches.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolejne mecze */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">
                      Mecze bieżącego etapu ({queueMatches.length})
                    </h3>
                    {actionableMatches.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleNextMatch}>
                        <SkipForward className="w-3.5 h-3.5" /> Następny
                      </Button>
                    )}
                  </div>
                  <div className="bg-card border rounded-lg overflow-hidden divide-y divide-border">
                    {queueMatches.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Brak oczekujących meczów</p>
                    ) : (
                      queueMatches.map((m) => (
                        <div
                          key={m.id}
                          className={`flex items-center gap-1 pr-1 ${
                            m.id === focusedMatchId
                              ? "bg-primary/10 border-l-[3px] border-primary"
                              : "border-l-[3px] border-transparent"
                          }`}
                        >
                          {/* Reorder arrows */}
                          {capabilities.canUseLegacyMatchTools && m.status === "pending" && <div className="flex flex-col py-1 pl-1 shrink-0">
                            <button
                              className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              onClick={() => handleMoveInQueue(m.id, "up")}
                              disabled={m.id === pendingQueue[0]?.id || reorderMatches.isPending}
                              title="Przesuń wyżej"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                              onClick={() => handleMoveInQueue(m.id, "down")}
                              disabled={m.id === pendingQueue[pendingQueue.length - 1]?.id || reorderMatches.isPending}
                              title="Przesuń niżej"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>}
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
                            {m.status === "in_progress" && <span className="text-sm font-mono tabular-nums">{m.score1 ?? 0}:{m.score2 ?? 0}</span>}
                            {m.status === "pending" && <span className="text-xs text-muted-foreground">Oczekuje</span>}
                            {m.status === "in_progress" && (
                              <Badge className="shrink-0 bg-secondary/20 text-secondary border-secondary/40 text-[10px]">
                                LIVE
                              </Badge>
                            )}
                            {m.id === focusedMatchId && m.status !== "in_progress" && (
                              <span className="text-xs text-primary shrink-0">Wybrany</span>
                            )}
                          </button>
                          {/* Set as current button for non-focused matches */}
                          {capabilities.canUseLegacyMatchTools && m.id !== focusedMatchId && m.status !== "in_progress" && (
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
                  </div>
                </div>

                {/* Ostatnie wyniki */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Ostatnie wyniki</h3>
                  <div className="bg-card border rounded-lg overflow-hidden divide-y divide-border">
                    {completedMatches.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Brak zakończonych meczów</p>
                    ) : (
                      completedMatches.slice(-6).reverse().map((m) => (
                        <div key={m.id} className="px-3 py-2.5">
                          {m.resultType === "bye" ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">R{m.round}</Badge>
                              <span className="text-sm text-muted-foreground">{m.player1Name} — bye</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">R{m.round}</Badge>
                              <span
                                className={`text-sm truncate flex-1 text-right ${
                                  m.winnerId === m.player1Id
                                    ? "font-bold text-primary"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {m.player1Name}
                              </span>
                              <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded shrink-0 tabular-nums">
                                {m.resultType === "played" ? `${m.score1}:${m.score2}` : m.resultType === "walkover" ? "W.O." : "N/C"}
                              </span>
                              <span
                                className={`text-sm truncate flex-1 ${
                                  m.winnerId === m.player2Id
                                    ? "font-bold text-primary"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {m.player2Name}
                              </span>
                            </div>
                          )}
                          {capabilities.canWriteTournamentResults && m.resultType !== "bye" && <Button variant="ghost" size="sm" className="mt-1" aria-label={`Popraw wynik: ${m.player1Name} – ${m.player2Name}`} onClick={() => setRevertConfirm(m.id)}>Popraw wynik</Button>}
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
                        {capabilities.canUseLegacyMatchTools && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleRestore(m.id)} disabled={updateMatch.isPending}>
                          <SkipForward className="w-3 h-3 mr-1" /> Przywróć
                        </Button>}
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
                        {capabilities.canUseLegacyMatchTools && <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-destructive/40 text-destructive/70 hover:bg-destructive/10"
                          onClick={() => handleRestoreCancelled(m.id)}
                          disabled={restoreCancelledMatch.isPending}
                        >
                          <SkipForward className="w-3 h-3 mr-1" /> Przywróć
                        </Button>}
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
              {matchStageGroups.map((stage) => {
                const stageMatches = matches?.filter((match) => match.stageId === stage.id || (stage.id === null && !match.stageId)) ?? [];
                if (!stageMatches.length) return null;
                return <section key={stage.id ?? "legacy"} aria-label={`Mecze: ${stage.name}`}>
                  <h3 className="mb-3 font-semibold">{stage.name}</h3>
                  <div className="space-y-2">
                    {[...stageMatches].sort((a, b) => Number(b.status === "in_progress") - Number(a.status === "in_progress") || a.round - b.round || a.matchNumber - b.matchNumber).map((match) => (
                      <div key={match.id} className={`flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 ${match.status === "in_progress" ? "border-secondary/60" : ""}`}>
                        <span className="text-xs text-muted-foreground">R{match.round} · M{match.matchNumber}</span>
                        <span className="min-w-0 flex-1 text-sm font-medium">
                          <span className={match.winnerId && match.winnerId === match.player1Id ? "font-bold text-primary" : ""}>{match.player1Name ?? "Oczekuje na gracza"}</span>
                          {" – "}<span className={match.winnerId && match.winnerId === match.player2Id ? "font-bold text-primary" : ""}>{match.player2Name ?? "Oczekuje na gracza"}</span>
                        </span>
                        <span className="font-mono tabular-nums">{match.resultType === "walkover" ? "W.O." : match.resultType === "bye" ? "BYE" : match.resultType === "no_contest" ? "N/C" : `${match.score1 ?? 0}:${match.score2 ?? 0}`}</span>
                        <Badge variant="outline" className={match.status === "in_progress" ? "text-secondary border-secondary" : ""}>{MATCH_STATUS_LABELS[match.status] ?? match.status}</Badge>
                        {capabilities.canWriteTournamentResults && match.status === "completed" && match.resultType !== "bye" ?
                          <Button variant="outline" size="sm" aria-label={`Popraw wynik: ${match.player1Name} – ${match.player2Name}`} onClick={() => setRevertConfirm(match.id)}>Popraw wynik</Button>
                          : <Button variant="ghost" size="sm" onClick={() => { setSelectedMatchId(match.id); navigate(`/tournaments/${id}/host`); }}>Pokaż mecz</Button>}
                      </div>
                    ))}
                  </div>
                </section>;
              })}
            </div>
          </TabsContent>

          {/* ═══ TABELA ═══ */}
          <TabsContent value="tabela" className="pt-4">
            {!standings || standings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Brak danych klasyfikacji.</div>
            ) : tournament.format === "single_elimination" ? (
              <div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Awans i mistrz wynikają wyłącznie z drabinki. Poniższy bilans jest informacyjny.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {standings.map((s) => (
                    <div key={s.playerId} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{s.playerName}</div>
                          <div className="text-xs text-muted-foreground">{[s.teamName, s.country].filter(Boolean).join(" · ") || "Uczestnik"}</div>
                        </div>
                        <Badge variant="outline">{s.status}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                        <div><strong className="block text-lg text-foreground">{s.matchWins}-{s.matchLosses}</strong>Mecze</div>
                        <div><strong className="block text-lg text-foreground">{s.gameWins}:{s.gameLosses}</strong>Gry</div>
                        <div><strong className="block text-lg text-foreground">{s.gameDiff > 0 ? "+" : ""}{s.gameDiff}</strong>Różnica</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Gracz</th>
                      <th className="py-2 px-3 text-center">Mecze</th>
                      <th className="py-2 px-3 text-center">W</th>
                      <th className="py-2 px-3 text-center">P</th>
                      <th className="py-2 px-3 text-center">Gry</th>
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
                          {(s.rankName || s.teamName) && (
                            <div className="text-xs text-muted-foreground">
                              {[s.rankName, s.teamName, s.country].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">{s.matchesPlayed}</td>
                        <td className="py-2 px-3 text-center text-green-400">{s.matchWins}</td>
                        <td className="py-2 px-3 text-center text-red-400">{s.matchLosses}</td>
                        <td className="py-2 px-3 text-center font-mono">{s.gameWins}:{s.gameLosses}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{s.buchholz ?? "—"}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={
                              s.gameDiff > 0
                                ? "text-green-400"
                                : s.gameDiff < 0
                                  ? "text-red-400"
                                  : "text-muted-foreground"
                            }
                          >
                            {s.gameDiff > 0 ? "+" : ""}
                            {s.gameDiff}
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
            {marvelStage ? (
              <MarvelEliminationStage
                tournamentId={id}
                stageId={marvelStage.id}
                canManage={capabilities.canWriteTournamentResults}
                pollInterval={5_000}
              />
            ) : doubleEliminationStage && doubleEliminationQuery.data ? (
              <DoubleEliminationBracket
                tournamentId={id}
                stageId={doubleEliminationStage.id}
                state={doubleEliminationQuery.data}
                canManage={capabilities.canWriteTournamentResults}
                canReset={capabilities.canManageLifecycle}
              />
            ) : doubleEliminationStage && doubleEliminationQuery.isPending ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">Ładowanie drabinki Double Elimination…</div>
            ) : doubleEliminationStage && doubleEliminationQuery.error ? (
              <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
                <p>Nie udało się pobrać drabinki Double Elimination.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void doubleEliminationQuery.refetch()}>Spróbuj ponownie</Button>
              </div>
            ) : bracket ? (
              <BracketView
                bracket={bracket}
                forcedHeroId={
                  tournament.gameConfig?.gameId === "deadlock"
                    ? tournament.gameConfig.config.forcedHeroId
                    : undefined
                }
                matchPicksMap={isDeadlock ? matchPicksMap : undefined}
              />
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
                    {actionLog.map((entry) => {
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
                            <span className={`text-sm ${colorClass}`} title={entry.actionType}>{entry.description}</span>
                            {entry.isUndone && <Badge variant="outline" className="text-xs shrink-0">cofnięta</Badge>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            {capabilities.canWriteTournamentResults && entry.actionType === "match_result_submitted" && !entry.isUndone && matches?.find((m) => m.id === entry.matchId && m.status === "completed" && m.resultType !== "bye") && (
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
        {assistant && <details className="rounded-lg border p-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium">Wskazówki prowadzenia</summary>
          <p className="mt-2">{assistant.stepTitle} — {assistant.nextAction}</p>
        </details>}
        </fieldset>
      </div>

      <Dialog open={revertConfirm !== null} onOpenChange={(open) => { if (!open && !hostPending) setRevertConfirm(null); }}>
        <DialogContent>
          {(() => {
            const match = matches?.find((entry) => entry.id === revertConfirm);
            const downstream = correctionDE.data?.matches.find((entry) => entry.matchId === revertConfirm)?.downstreamResultCount;
            const needsDEState = correctionStage?.format === "double_elimination";
            return <>
              <DialogHeader>
                <DialogTitle>Cofnąć wynik meczu {match?.player1Name} – {match?.player2Name}?</DialogTitle>
                <DialogDescription>
                  Zapisany wynik: {match?.resultType === "played" ? `${match.score1}:${match.score2}` : match?.resultType === "walkover" ? "W.O." : "N/C"}.
                  {" "}Po cofnięciu wpiszesz i zapiszesz poprawny wynik. Ranking i awans zostaną przeliczone.
                  {downstream !== undefined && downstream > 0
                    ? ` Cofnięcie unieważni także ${downstream} późniejszych wyników i powiązane wybory postaci.`
                    : " Kolejne mecze lub rozpoczęty następny etap mogą zablokować cofnięcie. System sprawdzi te zależności."}
                </DialogDescription>
              </DialogHeader>
              {actionError && <p className="text-sm text-destructive">{actionError.message}</p>}
              {needsDEState && correctionDE.isPending && <p role="status">Sprawdzanie zależnych wyników…</p>}
              {needsDEState && correctionDE.isError && <p className="text-sm text-destructive">Nie udało się sprawdzić zależnych wyników. <Button variant="link" onClick={() => void correctionDE.refetch()}>Ponów sprawdzenie</Button></p>}
              {match?.status !== "completed" && <p className="text-sm">Ten mecz nie ma już zapisanego wyniku do cofnięcia.</p>}
              <DialogFooter>
                <Button variant="outline" disabled={hostPending} onClick={() => setRevertConfirm(null)}>Zachowaj wynik</Button>
                <Button variant="destructive" disabled={hostPending || dataError || !match || match.status !== "completed" || (needsDEState && (correctionDE.isFetching || correctionDE.isError || downstream === undefined))} onClick={() => match && handleRevert(match.id)}>
                  {revertMatch.isPending ? "Cofanie i odświeżanie…" : "Cofnij wynik i przejdź do wpisywania"}
                </Button>
              </DialogFooter>
            </>;
          })()}
        </DialogContent>
      </Dialog>

      {/* Share Links Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" /> Udostępnij turniej
            </DialogTitle>
            <DialogDescription>
              Linki do widoku dla widzów i panelu prowadzącego.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Widok widzów (publiczny)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/tournaments/${id}`}
                  className="text-xs font-mono bg-muted/40"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(`${window.location.origin}/tournaments/${id}`, "viewer")}
                >
                  {copiedKey === "viewer" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Każdy z tym linkiem może śledzić turniej (tylko odczyt).</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Panel prowadzącego</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/tournaments/${id}/host`}
                  className="text-xs font-mono bg-muted/40"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(`${window.location.origin}/tournaments/${id}/host`, "host")}
                >
                  {copiedKey === "host" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dostęp do mutacji wymaga tokenu organizatora albo aktywnej sesji wsparcia. Sam link nie nadaje uprawnień.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
