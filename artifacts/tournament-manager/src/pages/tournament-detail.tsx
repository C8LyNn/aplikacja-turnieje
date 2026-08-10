import { useRoute, useSearch, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  useGetTournament, useGetTournamentStats, useListPlayers, useGetTournamentBracket,
  useListMatches, useAddPlayer, useDeletePlayer, useStartTournament, useImportPlayers,
  useUpdatePlayer,
  useGetTournamentStandings, useGetResultsHistory, useGetTournamentAssistant, useListTournamentStages,
  useGetTournamentStageReadiness,
  useImportTournament,
  exportTournament,
  getGetTournamentQueryKey, getGetTournamentStatsQueryKey, getListPlayersQueryKey,
  getGetTournamentBracketQueryKey, getListMatchesQueryKey, getGetTournamentStandingsQueryKey,
  getGetResultsHistoryQueryKey, getGetTournamentAssistantQueryKey, getListTournamentStagesQueryKey,
  getGetTournamentStageReadinessQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Users, Swords, ExternalLink, Trash2, Upload, Monitor, ChevronRight, Info, Pencil, Check, X, Download, HardDriveDownload, AlertTriangle, FileUp, CheckSquare, ZoomIn, ZoomOut, Shield, Lock, Key, Eye, Share2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useRef } from "react";
import { BracketView } from "@/components/bracket-view";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { RoundRobinView } from "@/components/round-robin-view";
import { TournamentChecklist } from "@/components/tournament-checklist";
import { StageProgressView } from "@/components/stage-progress-view";
import { SecurityPanel } from "@/components/security-panel";
import {
  ForcedHeroBadge,
  TournamentGameConfigPanel,
} from "@/components/deadlock-game-config";
import { PlayerBansRow, GamePicksRow, HeroPickerGrid } from "@/components/deadlock-bans-display";
import { usePlayerBans, useSetPlayerBans } from "@/lib/deadlock-bans-picks";
import { useAuth } from "@/context/auth-context";
import { setActiveOrganizerToken, setActiveSupportToken, setActiveViewerToken } from "@workspace/api-client-react";
import { OrganizerLoginModal } from "@/components/organizer-login-modal";
import { SupportLoginModal } from "@/components/support-login-modal";
import { ViewerLoginModal } from "@/components/viewer-login-modal";
import { SharingPanel } from "@/components/sharing-panel";
import { TournamentStagesPanel } from "@/components/tournament-stages-panel";
import { parseTournamentBackupFile } from "@/lib/backup-file";
import { organizerAreaForDetailTab, organizerDetailTab, TournamentOrganizerNavigation, useLegacyMatchesRedirect } from "@/components/tournament-organizer-navigation";
import { OrganizerNextStep } from "@/components/organizer-next-step";
import { availableStageStartReadiness, deriveOrganizerNextStep } from "@/lib/organizer-next-step";
import { deriveOrganizerCapabilities, managementRoleForCapabilities } from "@/lib/organizer-capabilities";
import { invalidateTournamentRosterQueries } from "@/lib/tournament-roster-cache";
import { invalidateTournamentDependentQueries } from "@/lib/tournament-query-invalidation";
import { useVerifiedSupportSession } from "@/hooks/use-tournament-auth";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
};

export default function TournamentDetail() {
  const [, params] = useRoute("/tournaments/:id");
  const search = useSearch();
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { role, getOrgToken, getSupSession, storeOrgToken, storeSupSession, removeOrgToken, removeSupSession, getViewerTok, storeViewerToken, removeViewerToken } = useAuth();
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [preparedAuthId, setPreparedAuthId] = useState<number | null>(null);

  // Keep module-level API client headers in sync with sessionStorage tokens.
  // Deps: only [id] — login modals call setActive* directly (synchronous).
  // This effect only handles restoration from sessionStorage on mount / tournament change.
  const orgToken = getOrgToken(id);
  const storedSupportSession = getSupSession(id);
  const { supportSession: supSession, isChecking: isSupportChecking } =
    useVerifiedSupportSession(id, orgToken ? null : storedSupportSession);
  const viewerToken = getViewerTok(id);
  const isAuthenticated = !!(orgToken || supSession);
  const hasReadAccess = (tournament: { visibility?: string } | null | undefined) =>
    !tournament || tournament.visibility !== "private_online" || isAuthenticated || !!viewerToken;

  useEffect(() => {
    const tok = getOrgToken(id);
    const vtok = getViewerTok(id);
    if (tok) { setActiveOrganizerToken(tok); setActiveSupportToken(null); setActiveViewerToken(null); }
    else if (supSession) { setActiveSupportToken(supSession.token); setActiveOrganizerToken(null); setActiveViewerToken(null); }
    else if (vtok) { setActiveViewerToken(vtok); setActiveOrganizerToken(null); setActiveSupportToken(null); }
    else { setActiveOrganizerToken(null); setActiveSupportToken(null); setActiveViewerToken(null); }
    setPreparedAuthId(isSupportChecking ? null : id);
    return () => {
      setPreparedAuthId(null);
      setActiveOrganizerToken(null); setActiveSupportToken(null); setActiveViewerToken(null);
    };
  }, [id, isSupportChecking, supSession?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle direct role links: ?login=organizer|support|viewer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get("login");
    if (loginParam === "organizer") setShowOrgModal(true);
    else if (loginParam === "support") setShowSupModal(true);
    else if (loginParam === "viewer") setShowViewerModal(true);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: tournament,
    error: tournamentError,
    isLoading: isLoadingTournament,
    refetch: refetchTournament,
  } = useGetTournament(id, {
    query: { enabled: !!id && preparedAuthId === id, queryKey: getGetTournamentQueryKey(id), retry: false },
  });
  // readOk: false when tournament is private_online/offline and no valid auth is present
  const visibility = (tournament as any)?.visibility ?? "public_online";
  const readOk = !tournament ||
    visibility === "public_online" ||
    isAuthenticated ||
    (visibility === "private_online" && !!viewerToken);

  const { data: stats } = useGetTournamentStats(id, {
    query: { enabled: !!id && readOk, queryKey: getGetTournamentStatsQueryKey(id) },
  });
  const { data: players } = useListPlayers(id, {
    query: { enabled: !!id && readOk, queryKey: getListPlayersQueryKey(id) },
  });
  const { data: matches } = useListMatches(id, {
    query: { enabled: !!id && tournament?.status !== "draft" && readOk, queryKey: getListMatchesQueryKey(id) },
  });
  const { data: bracket } = useGetTournamentBracket(id, {
    query: { enabled: !!id && tournament?.status !== "draft" && readOk, queryKey: getGetTournamentBracketQueryKey(id) },
  });
  const { data: standings } = useGetTournamentStandings(id, {
    query: { enabled: !!id && tournament?.status !== "draft" && readOk, queryKey: getGetTournamentStandingsQueryKey(id) },
  });
  const { data: history } = useGetResultsHistory(id, {
    query: { enabled: !!id && tournament?.status !== "draft" && readOk, queryKey: getGetResultsHistoryQueryKey(id) },
  });
  const { data: assistant } = useGetTournamentAssistant(id, {
    query: { enabled: !!id && readOk, queryKey: getGetTournamentAssistantQueryKey(id), refetchInterval: 15000 },
  });
  const { data: stages } = useListTournamentStages(id, {
    query: { enabled: !!id && readOk, queryKey: getListTournamentStagesQueryKey(id) },
  });
  const plannedStage = stages?.find((stage) => stage.status === "planned");
  const { data: plannedStageReadiness, isFetching: isFetchingPlannedStageReadiness } = useGetTournamentStageReadiness(
    id,
    plannedStage?.id ?? 0,
    {
      query: {
        enabled: !!id && readOk && !!plannedStage,
        retry: false,
        queryKey: getGetTournamentStageReadinessQueryKey(id, plannedStage?.id ?? 0),
      },
    },
  );

  const isDeadlock = tournament?.gameConfig?.gameId === "deadlock";
  const { data: playerBansData } = usePlayerBans(
    id,
    // Bans must load even in draft status — organizers set bans before starting.
    { enabled: isDeadlock && !!id && readOk },
  );
  const setPlayerBans = useSetPlayerBans(id);
  const playerBansMap = new Map((playerBansData ?? []).map((b) => [b.playerId, b.bannedHeroIds]));
  const [editingBansPlayerId, setEditingBansPlayerId] = useState<number | null>(null);
  const [pendingBans, setPendingBans] = useState<string[]>([]);

  const startTournament = useStartTournament();
  const addPlayer = useAddPlayer();
  const deletePlayer = useDeletePlayer();
  const importPlayers = useImportPlayers();
  const updatePlayer = useUpdatePlayer();
  const importTournament = useImportTournament();

  // Auto-prompt: if user is in Organizer/Support role and tournament requires auth, open the relevant modal
  useEffect(() => {
    if (!tournament?.hasOrganizerPassword || isAuthenticated) return;
    if (role === "organizer") setShowOrgModal(true);
    else if (role === "support" && tournament.hasSupportPassword) setShowSupModal(true);
  }, [tournament?.hasOrganizerPassword, tournament?.hasSupportPassword, isAuthenticated, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importPending, setImportPending] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoreOrganizerPassword, setRestoreOrganizerPassword] = useState("");
  const [restoreViewerPassword, setRestoreViewerPassword] = useState("");
  const [restoreSupportPassword, setRestoreSupportPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);
  const [newPlayerSeed, setNewPlayerSeed] = useState("");
  const [newPlayerRank, setNewPlayerRank] = useState("");
  const [newPlayerCountry, setNewPlayerCountry] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState("");
  // CSV import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvMode, setCsvMode] = useState<"append" | "replace">("append");
  const [csvConfirmReplace, setCsvConfirmReplace] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  // Edit player state
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRank, setEditRank] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editTeam, setEditTeam] = useState("");
  const [editSeed, setEditSeed] = useState("");

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
    [false, orgToken, role, supSession, tournament],
  );
  const managementRole = managementRoleForCapabilities(capabilities, !!orgToken, !!supSession, role);
  const activeDetailTab = organizerDetailTab(search, capabilities);
  const activeArea = organizerAreaForDetailTab(activeDetailTab);
  const nextStep = useMemo(
    () => tournament && managementRole && stages !== undefined
      ? deriveOrganizerNextStep({
          tournament,
          stages,
          matches: tournament.status === "draft" ? [] : matches,
          surface: "details",
          capabilities,
          plannedStageReadiness: availableStageStartReadiness(
            plannedStageReadiness,
            isFetchingPlannedStageReadiness,
          ),
        })
      : null,
    [capabilities, isFetchingPlannedStageReadiness, managementRole, matches, plannedStageReadiness, stages, tournament],
  );

  useLegacyMatchesRedirect(id, search, capabilities);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentStandingsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetResultsHistoryQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentAssistantQueryKey(id) });
    void invalidateTournamentRosterQueries(queryClient, id, stages?.map((stage) => stage.id) ?? []);
  };

  const invalidateRoster = () =>
    invalidateTournamentRosterQueries(queryClient, id, stages?.map((stage) => stage.id) ?? []);

  const handleMutationError = (e: any, fallback?: string) => {
    if (e?.status === 403) {
      toast({
        title: "Brak uprawnień",
        description: "Zaloguj się jako organizator lub wsparcie, aby wykonać tę akcję.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Błąd", description: fallback ?? e?.message, variant: "destructive" });
    }
  };

  const handleStart = () => {
    startTournament.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Turniej wystartował!" });
        invalidateAll();
      },
      onError: (e: any) => handleMutationError(e),
    });
  };

  // ── Backup handlers ──
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = await exportTournament(id);
      const fileName = `${tournament?.name?.replace(/[^a-z0-9]/gi, "_") ?? "turniej"}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup zapisany", description: fileName });
    } catch {
      toast({ title: "Błąd eksportu", description: "Nie udało się pobrać danych turnieju.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      setImportError("Nieprawidłowy format pliku. Wybierz plik .json z backupem TM_SYS.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseTournamentBackupFile(String(ev.target?.result ?? ""));
      if (!parsed.ok) {
        setImportError(parsed.error);
        return;
      }
      setImportPreview(parsed.backup);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    if (!importPreview) return;
    const privateOnline = importPreview.tournament?.visibility === "private_online";
    if (restoreOrganizerPassword.length < 8) {
      setImportError("Nowe hasło organizatora musi mieć co najmniej 8 znaków.");
      return;
    }
    if (privateOnline && restoreViewerPassword.length < 8) {
      setImportError("Dla private_online nowe hasło widza musi mieć co najmniej 8 znaków.");
      return;
    }
    if (restoreSupportPassword.length > 0 && restoreSupportPassword.length < 8) {
      setImportError("Nowe hasło wsparcia musi mieć co najmniej 8 znaków.");
      return;
    }
    setImportPending(true);
    importTournament.mutate({ data: {
      backup: importPreview,
      organizerPassword: restoreOrganizerPassword,
      viewerPassword: privateOnline ? restoreViewerPassword : undefined,
      supportPassword: restoreSupportPassword || undefined,
    } }, {
      onSuccess: (result) => {
        setImportPending(false);
        setImportPreview(null);
        setRestoreOrganizerPassword("");
        setRestoreViewerPassword("");
        setRestoreSupportPassword("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        storeOrgToken(result.tournament.id, result.organizerToken);
        setActiveOrganizerToken(result.organizerToken);
        toast({
          title: "Backup przywrócony",
          description: `Turniej „${result.tournament.name}" — ${result.playersImported} graczy, ${result.matchesImported} meczów.`,
        });
        // Navigate to the new tournament
        window.location.href = `/tournaments/${result.tournament.id}`;
      },
      onError: (e: any) => {
        setImportPending(false);
        setImportError(e?.message ?? "Błąd podczas importu. Spróbuj ponownie.");
      },
    });
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    setAddPlayerError(null);

    // Frontend duplicate check (fast, avoids round-trip)
    const existingNames = players?.map((p) => p.name.trim().toLowerCase()) ?? [];
    if (existingNames.includes(trimmedName.toLowerCase())) {
      setAddPlayerError(`Zawodnik o nicku „${trimmedName}" już istnieje w tym turnieju.`);
      return;
    }

    addPlayer.mutate({
      id,
      data: {
        name: trimmedName,
        seed: newPlayerSeed ? parseInt(newPlayerSeed, 10) : undefined,
        rank: newPlayerRank || undefined,
        country: newPlayerCountry || undefined,
        teamName: newPlayerTeam || undefined,
      },
    }, {
      onSuccess: () => {
        setNewPlayerName(""); setNewPlayerSeed(""); setNewPlayerRank(""); setNewPlayerCountry(""); setNewPlayerTeam("");
        setAddPlayerError(null);
        void invalidateRoster();
      },
      onError: (err: any) => {
        const msg: string = err?.data?.error ?? err?.message ?? "Błąd podczas dodawania gracza";
        if (err?.status === 409 || msg.toLowerCase().includes("już istnieje")) {
          setAddPlayerError(msg);
        } else {
          handleMutationError(err);
        }
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
        void invalidateRoster();
      },
      onError: (e: any) => { setConfirmDeletePlayerId(null); handleMutationError(e); },
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
        void invalidateRoster();
        toast({ title: "Gracz zaktualizowany" });
      },
      onError: (e: any) => handleMutationError(e),
    });
  };

  const handleCancelEdit = () => setEditingPlayerId(null);

  const handleCsvImport = () => {
    if (!csvText.trim()) return;
    if (csvMode === "replace" && (players?.length ?? 0) > 0 && !csvConfirmReplace) {
      setCsvConfirmReplace(true);
      return;
    }
    setCsvConfirmReplace(false);
    setCsvResult(null);
    importPlayers.mutate({ id, data: { csv: csvText, mode: csvMode } }, {
      onSuccess: (result) => {
        setCsvResult(result);
        void invalidateRoster();
      },
      onError: (e: any) => handleMutationError(e, "Błąd importu CSV"),
    });
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string ?? "");
      setCsvResult(null);
      setCsvConfirmReplace(false);
    };
    reader.readAsText(file);
    if (csvFileRef.current) csvFileRef.current.value = "";
  };

  const handleDownloadSampleCsv = () => {
    const sample = "name,team,seed\nProPlayer,TeamAlpha,1\nNoobSlayer,TeamBeta,2\nSteelNova,TeamAlpha,3\nBladeRush,,4";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "przykladowa_lista.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const resetCsvImport = () => {
    setShowCsvImport(false);
    setCsvText("");
    setCsvResult(null);
    setCsvConfirmReplace(false);
    setCsvMode("append");
  };

  if (preparedAuthId !== id || isLoadingTournament) return <Layout><div className="animate-pulse h-64 bg-card rounded-xl" /></Layout>;
  const accessDeniedCode = (tournamentError as any)?.data?.code as string | undefined;
  if (!tournament && accessDeniedCode) {
    const viewerMayLogin = accessDeniedCode === "VIEWER_PASSWORD_REQUIRED" && role === "fan";
    const organizerMayLogin = role === "organizer" || role === "developer";
    const supportMayLogin = role === "support";
    const tournamentLabel = `Turniej #${id}`;
    return (
      <Layout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <Lock className="w-10 h-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Turniej prywatny</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {accessDeniedCode === "PRIVATE_OFFLINE"
              ? "Dostęp wymaga zalogowania jako organizator lub wsparcie."
              : "Podaj hasło widza albo zaloguj się jako organizator lub wsparcie."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {viewerMayLogin && <Button onClick={() => setShowViewerModal(true)}>Podaj hasło widza</Button>}
            {organizerMayLogin && <Button onClick={() => setShowOrgModal(true)}>Zaloguj jako organizator</Button>}
            {supportMayLogin && <Button onClick={() => setShowSupModal(true)}>Zaloguj jako wsparcie</Button>}
          </div>
        </div>
        <OrganizerLoginModal
          open={showOrgModal}
          onClose={() => setShowOrgModal(false)}
          onCancel={() => setShowOrgModal(false)}
          tournamentId={id}
          tournamentName={tournamentLabel}
          onSuccess={(token) => {
            storeOrgToken(id, token);
            setActiveOrganizerToken(token);
            setActiveSupportToken(null);
            setShowOrgModal(false);
            void refetchTournament();
          }}
        />
        <SupportLoginModal
          open={showSupModal}
          onClose={() => setShowSupModal(false)}
          onCancel={() => setShowSupModal(false)}
          tournamentId={id}
          tournamentName={tournamentLabel}
          onSuccess={(token, nick) => {
            storeSupSession(id, token, nick);
            setActiveSupportToken(token);
            setActiveOrganizerToken(null);
            setShowSupModal(false);
            void refetchTournament();
          }}
        />
        <ViewerLoginModal
          open={showViewerModal}
          onClose={() => setShowViewerModal(false)}
          onCancel={() => setShowViewerModal(false)}
          tournamentId={id}
          tournamentName={tournamentLabel}
          onSuccess={(token) => {
            storeViewerToken(id, token);
            setActiveViewerToken(token);
            setShowViewerModal(false);
            void refetchTournament();
          }}
        />
      </Layout>
    );
  }
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
              {` · BO${tournament.defaultBestOf} · series_v1`}
            </p>
            <div className="mt-2">
              <ForcedHeroBadge gameConfig={tournament.gameConfig} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowChecklist((v) => !v)}
              title="Checklista przed turniejem"
            >
              <CheckSquare className="w-4 h-4 mr-2" /> Checklista
            </Button>
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

        <TournamentChecklist
          open={showChecklist && !!id}
          onClose={() => setShowChecklist(false)}
          tournamentId={id ?? 0}
          tournamentName={tournament?.name}
        />

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

        {managementRole && (
          <TournamentOrganizerNavigation tournamentId={id} active={activeArea} capabilities={capabilities} />
        )}
        {nextStep && (
          <OrganizerNextStep
            step={nextStep}
            onAction={nextStep.kind === "planned_stage" ? handleStart : undefined}
            pending={startTournament.isPending}
          />
        )}

        {/* Fan read-only banner */}
        {role === "fan" && (
          <div className="bg-muted/40 border border-muted rounded-lg p-3 flex items-center gap-3">
            <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">Tryb kibica — tylko do odczytu. Edycja turnieju jest niedostępna.</p>
          </div>
        )}

        {/* Auth gate for password-protected tournaments */}
        {tournament.hasOrganizerPassword && !isAuthenticated && role !== "fan" && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="font-semibold text-yellow-400 text-sm">Turniej chroniony hasłem</p>
                <p className="text-xs text-muted-foreground">Zaloguj się, aby dodawać graczy i zarządzać turniejem.</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => setShowOrgModal(true)}>
                <Key className="w-3.5 h-3.5 mr-1.5" /> Organizator
              </Button>
              {tournament.hasSupportPassword && (
                <Button size="sm" variant="outline" onClick={() => setShowSupModal(true)}>
                  Wsparcie
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Authenticated badge */}
        {tournament.hasOrganizerPassword && isAuthenticated && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-sm text-green-400 font-medium">
              {orgToken ? "Zalogowano jako organizator" : `Zalogowano jako wsparcie (${supSession?.nick})`}
            </p>
            <button
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (orgToken) removeOrgToken(id); else removeSupSession(id);
                setActiveOrganizerToken(null); setActiveSupportToken(null);
              }}
            >
              Wyloguj
            </button>
          </div>
        )}

        <OrganizerLoginModal
          open={showOrgModal}
          onClose={() => setShowOrgModal(false)}
          onCancel={() => setShowOrgModal(false)}
          tournamentId={id}
          tournamentName={tournament.name}
          onSuccess={(token) => {
            storeOrgToken(id, token);
            setActiveOrganizerToken(token);
            setActiveSupportToken(null);
            setShowOrgModal(false);
          }}
        />
        <SupportLoginModal
          open={showSupModal}
          onClose={() => setShowSupModal(false)}
          onCancel={() => setShowSupModal(false)}
          tournamentId={id}
          tournamentName={tournament.name}
          onSuccess={(token, nick) => {
            storeSupSession(id, token, nick);
            setActiveSupportToken(token);
            setActiveOrganizerToken(null);
            setShowSupModal(false);
          }}
        />

        <ViewerLoginModal
          open={showViewerModal}
          onClose={() => setShowViewerModal(false)}
          onCancel={() => setShowViewerModal(false)}
          tournamentId={id}
          tournamentName={tournament.name}
          onSuccess={(token) => {
            storeViewerToken(id, token);
            setActiveViewerToken(token);
            setShowViewerModal(false);
          }}
        />

        {/* Viewer gate: private_online without any auth */}
        {!readOk && visibility === "private_online" && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Turniej prywatny</h2>
            <p className="text-sm text-muted-foreground max-w-xs">Aby zobaczyć zawartość turnieju, podaj hasło widza lub zaloguj się jako organizator.</p>
            <button
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => setShowViewerModal(true)}
            >
              <Key className="w-4 h-4" /> Podaj hasło widza
            </button>
          </div>
        )}

        {/* Viewer gate: private_offline without org/sup auth */}
        {visibility === "private_offline" && !isAuthenticated && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Turniej offline — tylko dla organizatora</h2>
            <p className="text-sm text-muted-foreground max-w-xs">Ten turniej jest niedostępny publicznie. Zaloguj się jako organizator lub wsparcie.</p>
            <button
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => setShowOrgModal(true)}
            >
              <Key className="w-4 h-4" /> Zaloguj jako organizator
            </button>
          </div>
        )}

        {readOk && <Tabs value={activeDetailTab} className="w-full">

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
                          <span>{p.matchWins}W/{p.matchLosses}L</span>
                          <span className="font-bold text-primary">Gry {(p.gameDiff ?? 0) > 0 ? "+" : ""}{p.gameDiff ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stages" className="pt-6">
            <TournamentStagesPanel
              tournamentId={id}
              tournamentStatus={tournament.status}
              activeStageId={tournament.activeStageId}
              matches={matches ?? []}
              canManage={capabilities.canManageLifecycle}
              onChanged={invalidateAll}
            />
          </TabsContent>

          <TabsContent value="players" className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Zawodnicy ({players?.length ?? 0})</CardTitle>
                    {tournament.status === "draft" && capabilities.canManageParticipants && (
                      <Button variant="outline" size="sm" onClick={() => showCsvImport ? resetCsvImport() : setShowCsvImport(true)}>
                        <Upload className="w-4 h-4 mr-2" /> {showCsvImport ? "Zamknij" : "Import CSV"}
                      </Button>
                    )}
                  </CardHeader>

                  {showCsvImport && capabilities.canManageParticipants && (
                    <div className="border-b">
                      {/* Result panel */}
                      {csvResult ? (
                        <div className="px-6 pb-5 space-y-3">
                          {/* Success summary */}
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <p className="font-semibold text-green-400 flex items-center gap-2 mb-2">
                              <Check className="w-4 h-4" /> Import zakończony
                            </p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                              <span className="text-muted-foreground">Dodano zawodników:</span>
                              <span className="font-bold text-green-400">{csvResult.imported}</span>
                              {csvResult.replacedCount != null && csvResult.replacedCount > 0 && (
                                <>
                                  <span className="text-muted-foreground">Usuniętych (tryb zastąp):</span>
                                  <span className="font-bold text-yellow-400">{csvResult.replacedCount}</span>
                                </>
                              )}
                              {csvResult.skipped > 0 && (
                                <>
                                  <span className="text-muted-foreground">Pominięto wierszy:</span>
                                  <span className="font-bold text-red-400">{csvResult.skipped}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {/* Errors per line */}
                          {csvResult.errors?.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> Wiersze wymagające poprawy:
                              </p>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {csvResult.errors.map((err: any, idx: number) => (
                                  <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded px-3 py-1.5 text-xs">
                                    <span className="text-muted-foreground">Linia {err.line}:</span>{" "}
                                    <code className="text-foreground">{err.content}</code>
                                    <p className="text-red-400 mt-0.5">{err.reason}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {csvResult.limitExceeded && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex items-center gap-2 text-xs text-yellow-300">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              Osiągnięto limit graczy turnieju — część zawodników nie została dodana.
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" onClick={resetCsvImport}>Zamknij</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setCsvResult(null); setCsvText(""); }}>
                              Importuj kolejnych
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-6 pb-5 space-y-4 pt-2">
                          {/* Format instruction card */}
                          <div className="bg-card border rounded-lg p-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5" /> Format pliku CSV
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Pierwsza linia to <strong className="text-foreground">nagłówek</strong>. Obsługiwane kolumny:</p>
                              <div className="bg-muted/50 rounded p-2 font-mono text-[11px] space-y-0.5">
                                <p><span className="text-green-400">name</span> — nick zawodnika <span className="text-red-400">(wymagane)</span></p>
                                <p><span className="text-blue-400">team</span> — drużyna <span className="text-muted-foreground">(opcjonalne)</span></p>
                                <p><span className="text-blue-400">seed</span> — rozstawienie 1–999 <span className="text-muted-foreground">(opcjonalne)</span></p>
                              </div>
                              <div className="bg-muted/30 rounded p-2 font-mono text-[11px]">
                                <p className="text-muted-foreground">name,team,seed</p>
                                <p>ProPlayer,TeamAlpha,1</p>
                                <p>NoobSlayer,TeamBeta,2</p>
                                <p>SteelNova,,3</p>
                              </div>
                              <p className="text-[11px]">Separator: przecinek <code className="bg-muted px-1 rounded">,</code> lub średnik <code className="bg-muted px-1 rounded">;</code> — wykrywany automatycznie.</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground" onClick={handleDownloadSampleCsv}>
                              <Download className="w-3 h-3 mr-1.5" /> Pobierz przykładowy plik CSV
                            </Button>
                          </div>

                          {/* File + paste input */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input ref={csvFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFileChange} />
                              <Button variant="outline" size="sm" className="border-dashed text-xs" onClick={() => csvFileRef.current?.click()}>
                                <Upload className="w-3.5 h-3.5 mr-1.5" /> Wybierz plik .csv
                              </Button>
                              <span className="text-xs text-muted-foreground">lub wklej ręcznie poniżej</span>
                            </div>
                            <Textarea
                              value={csvText}
                              onChange={(e) => { setCsvText(e.target.value); setCsvConfirmReplace(false); }}
                              rows={6}
                              placeholder={"name,team,seed\nProPlayer,TeamAlpha,1\nNoobSlayer,TeamBeta,2"}
                              className="font-mono text-xs"
                            />
                            {csvText.trim() && (
                              <p className="text-xs text-muted-foreground">
                                Wiersze danych: <strong className="text-foreground">{Math.max(0, csvText.trim().split("\n").filter(l => l.trim()).length - 1)}</strong>
                              </p>
                            )}
                          </div>

                          {/* Mode selector (only if players already exist) */}
                          {(players?.length ?? 0) > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">Tryb importu</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => { setCsvMode("append"); setCsvConfirmReplace(false); }}
                                  className={`rounded-lg border p-3 text-left transition-colors ${csvMode === "append" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground"}`}
                                >
                                  <p className="text-sm font-semibold">Dopisz</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">Dodaj nowych graczy do istniejącej listy ({players?.length ?? 0} graczy)</p>
                                </button>
                                <button
                                  onClick={() => { setCsvMode("replace"); setCsvConfirmReplace(false); }}
                                  className={`rounded-lg border p-3 text-left transition-colors ${csvMode === "replace" ? "border-yellow-500 bg-yellow-500/10" : "border-border bg-card hover:border-muted-foreground"}`}
                                >
                                  <p className="text-sm font-semibold">Zastąp</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">Usuń wszystkich graczy i zaimportuj od nowa</p>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Replace confirmation */}
                          {csvConfirmReplace && (
                            <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-3 space-y-2">
                              <p className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Potwierdzenie zastąpienia
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Spowoduje to <strong className="text-foreground">usunięcie {players?.length} graczy</strong> z turnieju i zastąpienie ich nowymi z pliku CSV. Tej operacji nie można cofnąć.
                              </p>
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30" onClick={handleCsvImport} disabled={importPlayers.isPending}>
                                  {importPlayers.isPending ? "Importowanie…" : "Tak, zastąp graczy"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setCsvConfirmReplace(false)}>Anuluj</Button>
                              </div>
                            </div>
                          )}

                          {/* Submit */}
                          {!csvConfirmReplace && (
                            <Button
                              onClick={handleCsvImport}
                              disabled={importPlayers.isPending || !csvText.trim()}
                              className="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {importPlayers.isPending ? "Importowanie…" : csvMode === "replace" ? "Zastąp graczy z CSV" : "Importuj z CSV"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <CardContent className="pt-4">
                    {players?.length ? (
                      <div className="space-y-2">
                        {players.map((p) => (
                          capabilities.canManageParticipants && editingPlayerId === p.id ? (
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
                            <div key={p.id} className="flex flex-col border rounded bg-background">
                              {/* Main info + actions row */}
                              <div className="flex justify-between items-center p-3">
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
                                  {isDeadlock && (
                                    <div className="mt-1">
                                      <PlayerBansRow bannedHeroIds={playerBansMap.get(p.id) ?? []} size={16} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {tournament.status !== "draft" && (
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {(() => {
                                        const standing = standings?.find((entry) => entry.playerId === p.id);
                                        return `${standing?.matchWins ?? 0}W ${standing?.matchLosses ?? 0}L · gry ${standing?.gameWins ?? 0}:${standing?.gameLosses ?? 0}`;
                                      })()}
                                    </span>
                                  )}
                                  <Badge variant={p.status === "eliminated" ? "destructive" : p.status === "winner" ? "default" : "outline"}>
                                    {p.status === "active" ? "aktywny" : p.status === "eliminated" ? "wyelim." : "zwyciężca"}
                                  </Badge>
                                  {isDeadlock && capabilities.canWriteTournamentResults && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => {
                                        setEditingBansPlayerId(p.id === editingBansPlayerId ? null : p.id);
                                        setPendingBans(playerBansMap.get(p.id) ?? []);
                                      }}
                                    >
                                      {p.id === editingBansPlayerId ? "Zamknij" : "Bany"}
                                    </Button>
                                  )}
                                  {capabilities.canManageParticipants && (
                                    <Button variant="ghost" size="icon" onClick={() => handleStartEdit(p)} className="text-muted-foreground hover:text-foreground h-8 w-8">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {capabilities.canManageParticipants && tournament.status === "draft" && (
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
                              {/* Deadlock ban editor */}
                              {isDeadlock && editingBansPlayerId === p.id && (
                                <div className="border-t bg-muted/10 p-3">
                                  <p className="text-xs font-semibold text-destructive/80 mb-2">
                                    Bany gracza (max 5) — {pendingBans.length}/5
                                  </p>
                                  <HeroPickerGrid
                                    selectedIds={pendingBans}
                                    maxSelect={5}
                                    onToggle={(heroId) => {
                                      setPendingBans((prev) =>
                                        prev.includes(heroId)
                                          ? prev.filter((id) => id !== heroId)
                                          : [...prev, heroId],
                                      );
                                    }}
                                  />
                                  <div className="flex gap-2 mt-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingBansPlayerId(null)}
                                    >
                                      Anuluj
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={setPlayerBans.isPending}
                                      onClick={async () => {
                                        await setPlayerBans.mutateAsync({ playerId: p.id, bannedHeroIds: pendingBans });
                                        setEditingBansPlayerId(null);
                                      }}
                                    >
                                      Zapisz bany
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {capabilities.canManageParticipants
                          ? "Brak graczy. Dodaj ręcznie lub importuj CSV."
                          : "Brak graczy w tym turnieju."}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div>
                {tournament.status === "draft" && capabilities.canManageParticipants && (
                  <Card>
                    <CardHeader><CardTitle>Dodaj gracza</CardTitle></CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddPlayer} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Nick *</Label>
                          <Input
                            value={newPlayerName}
                            onChange={(e) => { setNewPlayerName(e.target.value); setAddPlayerError(null); }}
                            placeholder="Alias gracza"
                            required
                            className={addPlayerError ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {addPlayerError && (
                            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                              <X className="w-3 h-3 shrink-0" />
                              {addPlayerError}
                            </p>
                          )}
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
                          <div className={`text-right w-28 truncate text-sm ${m.winnerId === m.player1Id ? "font-bold text-primary" : ""}`}>
                            {m.player1Name || "TBD"}
                          </div>
                          <div className="flex items-center gap-2 font-mono bg-muted/50 px-2 py-1 rounded text-sm">
                             {m.resultType === "played" || m.status !== "completed" ? (
                               <><span>{m.score1 !== null ? m.score1 : "-"}</span><span className="text-muted-foreground">:</span><span>{m.score2 !== null ? m.score2 : "-"}</span></>
                             ) : (
                               <span>{m.resultType === "walkover" ? "W.O." : m.resultType === "bye" ? "BYE" : "N/C"}</span>
                             )}
                          </div>
                          <div className={`w-28 truncate text-sm ${m.winnerId === m.player2Id ? "font-bold text-primary" : ""}`}>
                            {m.player2Name || "TBD"}
                          </div>
                        </div>
                        <div className="mt-1 md:mt-0">
                          <Badge variant="secondary" className={
                            m.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                            m.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-transparent border"
                          }>
                            {m.status === "pending" ? "oczekuje" : m.status === "in_progress" ? "LIVE" :
                             m.status === "completed" ? m.resultType === "walkover" ? "walkower" : m.resultType === "bye" ? "wolny los" : m.resultType === "no_contest" ? "no contest" : "zakończony" : m.status}
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
              <CardHeader><CardTitle>{tournament.format === "single_elimination" ? "Bilans informacyjny" : "Klasyfikacja"}</CardTitle></CardHeader>
              <CardContent>
                {!standings || standings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Brak danych klasyfikacji.</div>
                ) : tournament.format === "single_elimination" ? (
                  <div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Awans i mistrz wynikają wyłącznie z drabinki. Bilans nie ustala kolejności eliminacji.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {standings.map((s) => (
                        <div key={s.playerId} className="rounded-lg border bg-muted/10 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{s.playerName}</div>
                              <div className="text-xs text-muted-foreground">{[s.teamName, s.country].filter(Boolean).join(" · ") || "Uczestnik"}</div>
                            </div>
                            <Badge variant="outline">{s.status}</Badge>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                            <div><strong className="block text-base text-foreground">{s.matchWins}-{s.matchLosses}</strong>Mecze</div>
                            <div><strong className="block text-base text-foreground">{s.gameWins}:{s.gameLosses}</strong>Gry</div>
                            <div><strong className="block text-base text-foreground">{s.gameDiff > 0 ? "+" : ""}{s.gameDiff}</strong>Różnica</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 px-2 w-8">#</th>
                          <th className="py-2 px-2">Gracz</th>
                          <th className="py-2 px-2 text-center">Mecze</th>
                          <th className="py-2 px-2 text-center">W</th>
                          <th className="py-2 px-2 text-center">P</th>
                          <th className="py-2 px-2 text-center">Gry</th>
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
                                {s.rankName && <span>{s.rankName}</span>}
                                {s.teamName && <span>{s.teamName}</span>}
                                {s.country && <span>{s.country}</span>}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">{s.matchesPlayed}</td>
                            <td className="py-2 px-2 text-center text-green-400">{s.matchWins}</td>
                            <td className="py-2 px-2 text-center text-red-400">{s.matchLosses}</td>
                            <td className="py-2 px-2 text-center font-mono">{s.gameWins}:{s.gameLosses}</td>
                            <td className="py-2 px-2 text-center text-muted-foreground">{s.buchholz ?? "—"}</td>
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              <span className={s.gameDiff > 0 ? "text-green-400" : s.gameDiff < 0 ? "text-red-400" : ""}>
                                {s.gameDiff > 0 ? "+" : ""}{s.gameDiff}
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

          <TabsContent value="bracket" className="pt-4">
            <StageProgressView
              tournamentId={id}
              activeStageId={tournament.activeStageId}
              matches={matches ?? []}
              playerBansMap={isDeadlock ? playerBansMap : undefined}
            />
          </TabsContent>

          <TabsContent value="history" className="pt-6">
            <Card>
              <CardHeader><CardTitle>Historia wyników</CardTitle></CardHeader>
              <CardContent>
                {!history || history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Brak ukończonych meczów.</div>
                ) : (
                  <div className="space-y-2">
                    {history.map((r) => {
                      const picks = (r as any).gamePicks as Array<{ gameNumber: number; player1HeroId: string | null; player2HeroId: string | null }> | undefined;
                      return (
                        <div key={r.id} className="flex flex-col p-3 border rounded bg-background gap-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">R{r.round} M{r.matchNumber}</Badge>
                              <div className="text-sm">
                                <span className={r.winnerName === r.player1Name ? "font-bold text-primary" : ""}>{r.player1Name}</span>
                                <span className="text-muted-foreground mx-2">{r.resultType === "played" ? `${r.score1}:${r.score2}` : r.resultType === "walkover" ? "W.O." : r.resultType === "bye" ? "BYE" : "N/C"}</span>
                                <span className={r.winnerName === r.player2Name ? "font-bold text-primary" : ""}>{r.player2Name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {r.winnerName ? (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3 text-primary" /> {r.winnerName}
                                </span>
                              ) : <Badge variant="secondary">no contest</Badge>}
                              <span className="text-xs text-muted-foreground">
                                {new Date(r.completedAt).toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                          {isDeadlock && (() => {
                            // For "played" results, show a slot for every game that was
                            // actually played (score1 + score2 = total games). This ensures
                            // G3 appears even when its pick wasn't recorded.
                            const totalGames =
                              r.resultType === "played"
                                ? (r.score1 ?? 0) + (r.score2 ?? 0)
                                : (picks?.length ?? 0);
                            if (totalGames === 0) return null;
                            return (
                              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                {Array.from({ length: totalGames }, (_, i) => i + 1).map((gn) => {
                                  const gp = picks?.find((p) => p.gameNumber === gn);
                                  return (
                                    <GamePicksRow
                                      key={gn}
                                      gameNumber={gn}
                                      player1HeroId={gp?.player1HeroId ?? null}
                                      player2HeroId={gp?.player2HeroId ?? null}
                                      player1Name={r.player1Name}
                                      player2Name={r.player2Name}
                                      size={14}
                                      showEmpty
                                    />
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* ═══ BACKUP — organizer token required ═══ */}
          {capabilities.canManageBackup && <TabsContent value="backup" className="pt-6">
            <div className="space-y-6 max-w-2xl">

              {/* Tip banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-primary mb-1">Kiedy robić backup?</p>
                  <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>Przed rozpoczęciem turnieju</li>
                    <li>Po każdej ukończonej rundzie</li>
                    <li>Przed większymi zmianami (edycja graczy, cofanie wyników)</li>
                  </ul>
                </div>
              </div>

              {/* Export section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="w-4 h-4 text-primary" /> Eksport backupu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Pobierz pełny stan turnieju do pliku <code className="bg-muted px-1 rounded text-xs">.json</code>. Plik zawiera: graczy, mecze, wyniki, historię zmian, ustawienia BO i status drabinki.
                  </p>
                  <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground space-y-1">
                    <p>📁 <strong>Turniej:</strong> {tournament?.name}</p>
                    <p>👥 <strong>Gracze:</strong> {stats?.totalPlayers ?? "—"}</p>
                    <p>⚔️ <strong>Mecze:</strong> {stats?.totalMatches ?? "—"} (ukończone: {stats?.completedMatches ?? 0})</p>
                    <p>📅 <strong>Status:</strong> {tournament?.status} · Runda {tournament?.currentRound ?? "—"}/{tournament?.totalRounds ?? "—"}</p>
                  </div>
                  <Button onClick={handleExport} disabled={isExporting} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? "Pobieranie…" : "Pobierz backup (.json)"}
                  </Button>
                </CardContent>
              </Card>

              {/* Import section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileUp className="w-4 h-4 text-yellow-400" /> Przywracanie z backupu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="text-muted-foreground">
                      Import tworzy <strong className="text-foreground">nową kopię</strong> turnieju — obecny turniej pozostaje niezmieniony. Możesz potem usunąć stary z dashboardu.
                    </div>
                  </div>

                  {importError && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded p-3 flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-destructive">{importError}</p>
                    </div>
                  )}

                  {!importPreview ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportFile}
                      />
                      <Button variant="outline" className="w-full border-dashed" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Wybierz plik backup (.json)
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                          <Check className="w-4 h-4" /> Plik odczytany poprawnie
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>🏆 <strong className="text-foreground">Turniej:</strong> {importPreview.tournament.name}</p>
                          <p>📋 <strong className="text-foreground">Format:</strong> {FORMAT_LABELS[importPreview.tournament.format] ?? importPreview.tournament.format}</p>
                          <p>👥 <strong className="text-foreground">Gracze:</strong> {importPreview.players?.length ?? 0}</p>
                          <p>⚔️ <strong className="text-foreground">Mecze:</strong> {importPreview.matches?.length ?? 0}</p>
                          <p>📊 <strong className="text-foreground">Status:</strong> {importPreview.tournament.status} · Runda {importPreview.tournament.currentRound ?? "—"}/{importPreview.tournament.totalRounds ?? "—"}</p>
                          <p>📅 <strong className="text-foreground">Data backupu:</strong> {new Date(importPreview.exportedAt).toLocaleString("pl")}</p>
                          <p>🔖 <strong className="text-foreground">Wersja formatu:</strong> {importPreview.schemaVersion}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Turniej zostanie przywrócony jako <strong>„{importPreview.tournament.name} (kopia)”</strong> i otwarty automatycznie.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hasła i tokeny nie są przechowywane w backupie. Ustaw nowe poświadczenia dla odtwarzanej kopii.
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor="restore-organizer-password-detail">Nowe hasło organizatora *</Label>
                        <Input
                          id="restore-organizer-password-detail"
                          type="password"
                          minLength={8}
                          value={restoreOrganizerPassword}
                          onChange={(event) => setRestoreOrganizerPassword(event.target.value)}
                        />
                      </div>
                      {importPreview.tournament.visibility === "private_online" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="restore-viewer-password-detail">Nowe hasło widza *</Label>
                          <Input
                            id="restore-viewer-password-detail"
                            type="password"
                            minLength={8}
                            value={restoreViewerPassword}
                            onChange={(event) => setRestoreViewerPassword(event.target.value)}
                          />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="restore-support-password-detail">Nowe hasło wsparcia (opcjonalne)</Label>
                        <Input
                          id="restore-support-password-detail"
                          type="password"
                          minLength={8}
                          value={restoreSupportPassword}
                          onChange={(event) => setRestoreSupportPassword(event.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30"
                          onClick={handleImportConfirm}
                          disabled={importPending}
                        >
                          <FileUp className="w-4 h-4 mr-2" />
                          {importPending ? "Przywracanie…" : "Przywróć turniej"}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setImportPreview(null);
                          setImportError(null);
                          setRestoreOrganizerPassword("");
                          setRestoreViewerPassword("");
                          setRestoreSupportPassword("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}>
                          Anuluj
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>}

          {capabilities.canManageOrganizerSettings && (
            <TabsContent value="security" className="pt-6">
              <div className="space-y-6">
                <TournamentGameConfigPanel tournament={tournament} />
                <SecurityPanel
                  tournamentId={id}
                  hasOrganizerPassword={!!tournament.hasOrganizerPassword}
                  onOrganizerPasswordSet={() => refetchTournament()}
                />
              </div>
            </TabsContent>
          )}

          {capabilities.canManageSharing && !!orgToken && (
            <TabsContent value="sharing" className="pt-6">
              <SharingPanel tournament={tournament as any} orgToken={orgToken} />
            </TabsContent>
          )}

        </Tabs>}
      </div>
    </Layout>
  );
}
