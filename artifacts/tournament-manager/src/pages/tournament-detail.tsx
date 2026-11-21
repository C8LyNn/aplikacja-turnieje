import { t } from "@/i18n";
import {
  ParticipantFieldChips,
  ParticipantFieldInputs,
  ParticipantFieldValuesEditor,
  ParticipantFieldsManager,
  useParticipantFields,
} from "@/features/experimental-tournaments/experimental-participant-fields";
import { formValuesToPayload, missingRequired } from "@/features/experimental-tournaments/participant-fields-model";
import { LeagueTableNotes } from "@/components/league-table-notes";
import { standingsHavePoints, standingsHaveSets } from "@/lib/league-results";
import { ReadQueryState } from "@/components/read-query-state";
import { useSearch, Link } from "wouter";
import { SettingsCopyCard } from "@/components/settings-copy-dialog";
import { DiscordPanel } from "@/components/discord-panel";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  useGetTournament, useGetTournamentStats, useListPlayers, useGetTournamentBracket,
  useListMatches, useAddPlayer, useDeletePlayer, useStartTournament, useImportPlayers,
  useUpdatePlayer,
  useGetTournamentStandings, useGetResultsHistory, useListTournamentStages,
  useImportTournament,
  exportTournament,
  getGetTournamentQueryKey, getGetTournamentStatsQueryKey, getListPlayersQueryKey,
  getGetTournamentBracketQueryKey, getListMatchesQueryKey, getGetTournamentStandingsQueryKey,
  getGetResultsHistoryQueryKey, getGetTournamentAssistantQueryKey, getListTournamentStagesQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Users, Swords, ExternalLink, Trash2, Upload, Monitor, ChevronRight, Info, Pencil, Check, X, Download, HardDriveDownload, AlertTriangle, FileUp, CheckSquare, ZoomIn, ZoomOut, Shield, Lock, Key, Eye, Share2, RefreshCw, ClipboardPaste } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useRef } from "react";
import { BracketView } from "@/components/bracket-view";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { RoundRobinView } from "@/components/round-robin-view";
import { TournamentChecklist } from "@/components/tournament-checklist";
import { StageProgressView } from "@/components/stage-progress-view";
import { useRoundRobinReadback } from "@/hooks/use-round-robin-readback";
import { SecurityPanel } from "@/components/security-panel";
import { OrganizerRecoveryNotice } from "@/components/organizer-recovery-notice";
import {
  ForcedHeroBadge,
  TournamentGameConfigPanel,
  TournamentPresentationPanel,
} from "@/components/deadlock-game-config";
import { PlayerBansRow, GamePicksRow, HeroPickerGrid } from "@/components/deadlock-bans-display";
import { usePlayerBans, useSetPlayerBans } from "@/lib/deadlock-bans-picks";
import { useAuth } from "@/context/auth-context";
import { setActiveOrganizerToken, setActiveSupportToken, setActiveViewerToken } from "@workspace/api-client-react";
import { OrganizerLoginModal } from "@/components/organizer-login-modal";
import { SupportLoginModal } from "@/components/support-login-modal";
import { SupportPermissionsNote } from "@/components/support-permissions-note";
import { SupportMembersPanel } from "@/components/support-members-panel";
import { RegistrationPanel } from "@/components/registration-panel";
import { ViewerLoginModal } from "@/components/viewer-login-modal";
import { SharingPanel } from "@/components/sharing-panel";
import { TournamentStagesPanel } from "@/components/tournament-stages-panel";
import { StageBasketsPanel } from "@/components/stage-baskets-panel";
import { parseTournamentBackupFile } from "@/lib/backup-file";
import { organizerAreaForDetailTab, organizerDetailTab, TournamentOrganizerNavigation, useLegacyMatchesRedirect } from "@/components/tournament-organizer-navigation";
import { OrganizerNextStep } from "@/components/organizer-next-step";
import { experimentalDraftNextStep } from "@/features/experimental-tournaments/experimental-next-step";
import { ExperimentalRosterHealth, ExperimentalStageMap } from "@/features/experimental-tournaments/experimental-v4-panels";
import { ExperimentalBroadcastPanel } from "@/features/experimental-tournaments/experimental-broadcast-panel";
import { ExperimentalBulkPaste, type BulkImportOutcome } from "@/features/experimental-tournaments/experimental-v4-bulk-paste";
import { ExperimentalTeamRosters } from "@/features/experimental-tournaments/experimental-team-rosters";
import { useGetTournamentTeams } from "@workspace/api-client-react";
import { TournamentOperationsOverview } from "@/components/tournament-operations-overview";
import { StageLiveTables, useStageLiveStandings } from "@/components/stage-live-tables";
import { useOrganizerOperation } from "@/hooks/use-organizer-operation";
import { deriveOrganizerCapabilities, managementRoleForCapabilities } from "@/lib/organizer-capabilities";
import { invalidateTournamentRosterQueries } from "@/lib/tournament-roster-cache";
import { invalidateTournamentDependentQueries } from "@/lib/tournament-query-invalidation";
import { stageLifecycleError } from "@/lib/stage-lifecycle-feedback";
import { useOrganizerTokenCheck, useVerifiedSupportSession } from "@/hooks/use-tournament-auth";
import { usePresentationTheme, resolvePresentationSettings } from "@/lib/presentation-theme";
import { MATCH_STATUS_LABELS } from "@/lib/match-operation-feedback";
import { PLAYER_STATUS_LABELS, TOURNAMENT_STATUS_LABELS } from "@/lib/tournament-stages-ui";
import { tournamentHref, useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { historyEmptyText, matchesEmptyState, standingsEmptyText } from "@/lib/organizer-empty-states";
import { bestOfLabel, matchLengthText } from "@/features/experimental-tournaments/experimental-create-wizard-model";
import { setsText } from "@/components/set-score-editor";
import { ExperimentalTournamentContextBar } from "@/features/experimental-tournaments/experimental-tournament-context-bar";
import { ExperimentalTournamentChecklist } from "@/features/experimental-tournaments/experimental-tournament-checklist";
import { ExperimentalPlayerToolbar, type ExperimentalPlayerSort, type ExperimentalPlayerStatusFilter } from "@/features/experimental-tournaments/experimental-player-toolbar";
import { ExperimentalTournamentOverview } from "@/features/experimental-tournaments/experimental-tournament-overview";
import { isTwoLegTie, tieScoreText } from "@/lib/two-leg-tie-view";
import { TwoLegTieSummary } from "@/components/two-leg-tie";
import { TournamentVisibilityControl } from "@/components/tournament-visibility-control";

const FORMAT_LABELS: Record<string, string> = {
  get single_elimination() { return t("tournamentDetail.drabinka_eliminacyjna"); },
  get swiss() { return t("tournamentDetail.system_szwajcarski"); },
  get round_robin() { return t("tournamentDetail.kazdy_z_kazdym"); },
  get group_stage() { return t("tournamentDetail.faza_grupowa"); },
  get double_elimination() { return t("tournamentDetail.podwojna_eliminacja"); },
};

export default function TournamentDetail() {
  const { id, isExperimental } = useTournamentRoute("detail");
  const search = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { role, getOrgToken, getSupSession, storeOrgToken, storeSupSession, removeOrgToken, removeSupSession, getViewerTok, storeViewerToken, removeViewerToken } = useAuth();
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerStatusFilter, setPlayerStatusFilter] = useState<ExperimentalPlayerStatusFilter>("all");
  const [playerSort, setPlayerSort] = useState<ExperimentalPlayerSort>("seed");
  const [preparedAuthId, setPreparedAuthId] = useState<number | null>(null);

  // Keep module-level API client headers in sync with sessionStorage tokens.
  // Deps: only [id] — login modals call setActive* directly (synchronous).
  // This effect only handles restoration from sessionStorage on mount / tournament change.
  const orgToken = getOrgToken(id);
  const storedSupportSession = getSupSession(id);
  const { supportSession: supSession, isChecking: isSupportChecking, supportPermissions } =
    useVerifiedSupportSession(id, orgToken ? null : storedSupportSession);
  useOrganizerTokenCheck(id, orgToken);
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
    isFetching: isFetchingTournament,
    refetch: refetchTournament,
  } = useGetTournament(id, {
    query: { enabled: !!id && preparedAuthId === id, queryKey: getGetTournamentQueryKey(id), retry: false, refetchInterval: 5000 },
  });
  // readOk: false when tournament is private_online/offline and no valid auth is present
  const visibility = (tournament as any)?.visibility ?? "public_online";
  const readOk = !tournament ||
    visibility === "public_online" ||
    isAuthenticated ||
    (visibility === "private_online" && !!viewerToken);

  const statsQuery = useGetTournamentStats(id, {
    query: { enabled: !!id && readOk, queryKey: getGetTournamentStatsQueryKey(id) },
  });
  const { data: stats } = statsQuery;
  const playersQuery = useListPlayers(id, {
    query: { enabled: !!id && readOk, queryKey: getListPlayersQueryKey(id) },
  });
  const { data: players } = playersQuery;
  const displayedPlayers = useMemo(() => {
    const list = [...(players ?? [])];
    if (!isExperimental) return list;
    const needle = playerSearch.trim().toLocaleLowerCase("pl-PL");
    const filtered = list.filter((player) => {
      const matchesStatus = playerStatusFilter === "all" || player.status === playerStatusFilter;
      const haystack = [player.name, player.teamName, player.rank, player.country].filter(Boolean).join(" ").toLocaleLowerCase("pl-PL");
      return matchesStatus && (!needle || haystack.includes(needle));
    });
    filtered.sort((a, b) => {
      if (playerSort === "name") return a.name.localeCompare(b.name, "pl");
      if (playerSort === "status") return String(a.status ?? "").localeCompare(String(b.status ?? ""), "pl") || a.name.localeCompare(b.name, "pl");
      return (a.seed ?? Number.MAX_SAFE_INTEGER) - (b.seed ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "pl");
    });
    return filtered;
  }, [isExperimental, playerSearch, playerSort, playerStatusFilter, players]);
  const { data: matches } = useListMatches(id, {
    query: { enabled: !!id && tournament?.status !== "draft" && readOk, queryKey: getListMatchesQueryKey(id), refetchInterval: 5000 },
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
  const stagesQuery = useListTournamentStages(id, {
    query: { enabled: !!id && readOk, queryKey: getListTournamentStagesQueryKey(id), refetchInterval: 5000 },
  });
  const { data: stages } = stagesQuery;
  const teamOverview = useGetTournamentTeams(id, {
    query: { enabled: !!id && readOk && isExperimental && tournament?.participantType === "teams", retry: false } as never,
  });
  const teamEntries = isExperimental && tournament?.participantType === "teams";
  const teamsNotReady = teamOverview.data && teamOverview.data.participantType === "teams"
    ? teamOverview.data.teams.filter((team) => team.entryStatus === "active" && !team.ready).length
    : undefined;
  // A failed refresh invalidates scope even when the cache still contains stages.
  const stageScopeUnknown = stages === undefined || stagesQuery.isError;
  const hasMultipleStages = !stageScopeUnknown && (stages?.length ?? 0) > 1;
  const standingsInformational = hasMultipleStages || stageScopeUnknown;
  // V5.11: the stage whose table the "Tabela" tab shows first — the active one, else the last played table stage.
  const tableStage = [...(stages ?? [])].sort((a, b) => a.position - b.position)
    .filter((stage) => ["group_stage", "round_robin", "swiss"].includes(stage.format) && stage.status !== "planned")
    .sort((a, b) => (a.status === "active" ? -1 : 0) - (b.status === "active" ? -1 : 0) || b.position - a.position)[0];
  const liveStageStandings = useStageLiveStandings(id, tableStage?.id, { enabled: isExperimental && hasMultipleStages && !!tableStage });
  useRoundRobinReadback(id, stages, matches, readOk && !stagesQuery.isError);
  const isDeadlock = tournament?.gameConfig?.gameId === "deadlock";
  // Computed before any early returns so React hooks order is stable.
  const rawPs = (tournament as any)?.presentationSettings as Record<string, unknown> | null | undefined;
  const presentationSettings = resolvePresentationSettings(rawPs as any);
  usePresentationTheme(presentationSettings);

  const { data: playerBansData } = usePlayerBans(
    id,
    // Bans must load even in draft status — organizers set bans before starting.
    { enabled: isDeadlock && !!id && readOk },
  );
  const setPlayerBans = useSetPlayerBans(id);
  const playerBansMap = new Map((playerBansData ?? []).map((b) => [b.playerId, b.bannedHeroIds]));

  // matchId → last game's pick (used for bracket pick-icon display)
  const matchPicksMap = useMemo(() => {
    const map = new Map<number, { p1HeroId?: string | null; p2HeroId?: string | null }>();
    for (const r of history ?? []) {
      if (!r.matchId) continue;
      const picks = (r as any).gamePicks as Array<{ gameNumber: number; player1HeroId: string | null; player2HeroId: string | null }> | undefined;
      if (!picks || picks.length === 0) continue;
      const last = [...picks].sort((a, b) => b.gameNumber - a.gameNumber)[0];
      map.set(r.matchId, { p1HeroId: last.player1HeroId, p2HeroId: last.player2HeroId });
    }
    return map;
  }, [history]);

  const [editingBansPlayerId, setEditingBansPlayerId] = useState<number | null>(null);
  const [pendingBans, setPendingBans] = useState<string[]>([]);

  const initialStartLock = useRef(false);
  const [startError, setStartError] = useState<string>();
  const startTournament = useStartTournament({ mutation: {
    onMutate: () => setStartError(undefined),
    onSuccess: () => invalidateTournamentDependentQueries(queryClient, id),
    onError: async (error) => { setStartError(stageLifecycleError(error)); await invalidateTournamentDependentQueries(queryClient, id); },
    onSettled: () => { initialStartLock.current = false; },
  } });
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
  // V5.4-005: values of the tournament's participant fields in the add form (Experimental only).
  const [newPlayerFields, setNewPlayerFields] = useState<Record<string, unknown>>({});
  const [editingFieldsPlayerId, setEditingFieldsPlayerId] = useState<number | null>(null);
  // CSV import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  // QW-02: Classic gets the same paste-a-list panel as Modern, next to the unchanged CSV import.
  const [showBulkPaste, setShowBulkPaste] = useState(false);
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
          supportPermissions,
        })
      : deriveOrganizerCapabilities({
          role,
          tournament: { hasHostCode: false, hasOrganizerPassword: true },
          hasOrganizerToken: false,
          hasSupportSession: false,
        }),
    [false, orgToken, role, supSession, supportPermissions, tournament],
  );
  const managementRole = managementRoleForCapabilities(capabilities, !!orgToken, !!supSession, role);
  const activeDetailTab = organizerDetailTab(search, capabilities, { experimental: isExperimental });
  const activeArea = organizerAreaForDetailTab(activeDetailTab);
  // Experimental: work tabs (players, baskets, matches…) open straight on their content; the
  // tournament-wide next step and operations overview stay on the stage panel and the overview.
  const participantFields = useParticipantFields(id, isExperimental && !!tournament && readOk);
  const requiredParticipantFields = participantFields.filter((field) => field.required);
  const optionalParticipantFields = participantFields.filter((field) => !field.required);
  const experimentalWorkTab = isExperimental && activeDetailTab !== "stages" && activeDetailTab !== "overview";
  const operation = useOrganizerOperation({ tournament, stages, matches: tournament?.status === "draft" ? [] : matches,
    capabilities, surface: "details", enabled: !!managementRole && readOk });
  // Experimental: a fresh draft without enough participants gets one plain next step
  // ("add participants") instead of the stage-consistency diagnostics.
  // V5.8: the same rule as the host page (shared in experimental-next-step).
  const experimentalParticipantCount = players?.length ?? 0;
  const nextStep = isExperimental
    ? experimentalDraftNextStep(operation.nextStep, { tournamentStatus: tournament?.status, participantCount: experimentalParticipantCount, tournamentId: id })
    : operation.nextStep;
  const plannedStageReadiness = operation.readiness.data;
  const isFetchingPlannedStageReadiness = operation.readiness.isFetching;

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
        title: t("tournamentDetail.brak_uprawnien"),
        description: t("tournamentDetail.zaloguj_sie_jako_organizator_lub"),
        variant: "destructive",
      });
    } else {
      toast({ title: t("tournamentDetail.blad"), description: fallback ?? e?.message, variant: "destructive" });
    }
  };

  const handleStart = () => {
    if (initialStartLock.current || !plannedStageReadiness?.ready || isFetchingPlannedStageReadiness) return;
    initialStartLock.current = true;
    startTournament.mutate({ id }, {
      onSuccess: () => {
        toast({ title: t("tournamentDetail.turniej_wystartowal") });
      },
    });
  };

  // ── Backup handlers ──
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = await exportTournament(id);
      const fileName = `${tournament?.name?.replace(/[^a-z0-9]/gi, "_") ?? t("tournamentDetail.turniej_2")}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("tournamentDetail.backup_zapisany"), description: fileName });
    } catch {
      toast({ title: t("tournamentDetail.blad_eksportu"), description: t("tournamentDetail.nie_udalo_sie_pobrac_danych"), variant: "destructive" });
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
      setImportError(t("tournamentDetail.nieprawidlowy_format_pliku_wybierz_plik"));
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
      setImportError(t("tournamentDetail.nowe_haslo_organizatora_musi_miec"));
      return;
    }
    if (privateOnline && restoreViewerPassword.length < 8) {
      setImportError(t("tournamentDetail.dla_private_online_nowe_haslo"));
      return;
    }
    if (restoreSupportPassword.length > 0 && restoreSupportPassword.length < 8) {
      setImportError(t("tournamentDetail.nowe_haslo_wsparcia_musi_miec"));
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
          title: t("tournamentDetail.backup_przywrocony"),
          description: t("tournamentDetail.turniej_name_playersimported_graczy_matc", { name: result.tournament.name, playersImported: result.playersImported, matchesImported: result.matchesImported }),
        });
        // Navigate to the new tournament
        window.location.href = tournamentHref(result.tournament.id, isExperimental);
      },
      onError: (e: any) => {
        setImportPending(false);
        setImportError(e?.message ?? t("tournamentDetail.blad_podczas_importu_sprobuj_ponownie"));
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
      setAddPlayerError(t("tournamentDetail.zawodnik_o_nicku_trimmedname_juz", { trimmedName: trimmedName }));
      return;
    }

    const fieldsMissing = isExperimental ? missingRequired(participantFields, newPlayerFields) : [];
    if (fieldsMissing.length) {
      setAddPlayerError(t("tournamentDetail.uzupelnij_v0", { v0: fieldsMissing.map((field) => field.label).join(", ") }));
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
        ...(isExperimental && participantFields.length ? { customFields: formValuesToPayload(participantFields, newPlayerFields) } : {}),
      },
    }, {
      onSuccess: () => {
        setNewPlayerName(""); setNewPlayerSeed(""); setNewPlayerRank(""); setNewPlayerCountry(""); setNewPlayerTeam("");
        setNewPlayerFields({});
        setAddPlayerError(null);
        void invalidateRoster();
      },
      onError: (err: any) => {
        const msg: string = err?.data?.error ?? err?.message ?? t("tournamentDetail.blad_podczas_dodawania_gracza");
        const problems: Array<{ message: string }> | undefined = err?.data?.problems;
        if (problems?.length) {
          setAddPlayerError(problems.map((problem) => problem.message).join(" "));
        } else if (err?.status === 409 || msg.toLowerCase().includes("już istnieje")) {
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
        toast({ title: t("tournamentDetail.gracz_zaktualizowany") });
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
      onError: (e: any) => handleMutationError(e, t("tournamentDetail.blad_importu_csv")),
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

  // Experimental bulk paste: same import endpoint as CSV, validated and previewed client-side first.
  const handleExperimentalBulkImport = (csv: string, mode: "append" | "replace") =>
    new Promise<BulkImportOutcome>((resolve, reject) => {
      importPlayers.mutate({ id, data: { csv, mode } }, {
        onSuccess: (result) => { void invalidateRoster(); resolve(result as BulkImportOutcome); },
        onError: (e: any) => { handleMutationError(e, t("tournamentDetail.blad_dodawania_listy")); reject(e); },
      });
    });

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
    const supportMayLogin = role === "support";
    const tournamentLabel = t("tournamentDetail.turniej_id", { id: id });
    return (
      <Layout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <Lock className="w-10 h-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("tournamentDetail.turniej_prywatny")}</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {accessDeniedCode === "PRIVATE_OFFLINE"
              ? t("tournamentDetail.dostep_wymaga_zalogowania_jako_organizat")
              : t("tournamentDetail.podaj_haslo_widza_albo_zaloguj")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {viewerMayLogin && <Button onClick={() => setShowViewerModal(true)}>{t("tournamentDetail.podaj_haslo_widza")}</Button>}
            <Button onClick={() => setShowOrgModal(true)}>{t("tournamentDetail.wejdz_jako_organizator")}</Button>
            {supportMayLogin && <Button onClick={() => setShowSupModal(true)}>{t("tournamentDetail.zaloguj_jako_wsparcie")}</Button>}
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
  if (!tournament && tournamentError) {
    const status = (tournamentError as { status?: number }).status;
    return <Layout><div role="alert" className="mx-auto max-w-lg space-y-3 rounded-lg border bg-card p-6">
      <h1 className="text-xl font-semibold">{status === 404 ? t("tournamentDetail.nie_znaleziono_turnieju") : t("tournamentDetail.nie_udalo_sie_pobrac_turnieju")}</h1>
      <p className="text-sm text-muted-foreground">{status === 404
        ? t("tournamentDetail.sprawdz_adres_turnieju_i_sprobuj")
        : t("tournamentDetail.nie_mozna_potwierdzic_aktualnego_stanu")}</p>
      <Button variant="outline" disabled={isFetchingTournament} onClick={() => void refetchTournament()}>
        <RefreshCw className="mr-2 h-4 w-4" /> {t("tournamentDetail.sprobuj_ponownie")}</Button>
    </div></Layout>;
  }
  if (!tournament) return <Layout><div role="status">{t("tournamentDetail.ladowanie_turnieju")}</div></Layout>;

  return (
    <Layout colorPreset={presentationSettings.colorPreset || undefined}>
      <div className="organizer-workspace flex flex-col gap-6">
        <div className="organizer-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {isExperimental && <ExperimentalTournamentContextBar tournamentId={id} tournamentName={tournament.name} currentLabel={t("tournamentDetail.panel_turnieju")} compact />}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-primary">{tournament.name}</h1>
              <Badge variant={tournament.status === "active" ? "default" : tournament.status === "completed" ? "secondary" : "outline"}
                className={tournament.status === "active" ? "bg-secondary text-secondary-foreground hover:bg-secondary" :
                  tournament.status === "completed" ? "bg-accent text-accent-foreground hover:bg-accent" : ""}>
                {TOURNAMENT_STATUS_LABELS[tournament.status] ?? t("tournamentDetail.nieznany")}
              </Badge>
            </div>
            {/* #330: visibility (hidden / public) is not the play status; the organizer publishes or hides here. */}
            {isAuthenticated && (
              <div className="mb-2">
                <TournamentVisibilityControl tournamentId={id} status={tournament.status} visibility={tournament.visibility} orgToken={orgToken}
                  supportToken={!orgToken && capabilities.canPublishVisibility ? supSession?.token : null} />
              </div>
            )}
            {!orgToken && supSession && <SupportPermissionsNote className="mb-2" nick={supSession.nick} permissions={supportPermissions} />}
            {tournament.description && <p className="text-muted-foreground">{tournament.description}</p>}
            <p className="text-sm text-muted-foreground mt-1">
              {/* V5.8: the format is named once, also when the stage carries the format's name. */}
              {[operation.stage?.name, (() => { const label = FORMAT_LABELS[operation.stage?.format ?? tournament.format] ?? operation.stage?.format; return label && label !== operation.stage?.name ? label : null; })()].filter(Boolean).join(" · ")}
              {` · ${operation.summary.roundLabel} · ${operation.stage?.matchRules ? matchLengthText(operation.stage, isExperimental) : isExperimental ? bestOfLabel(operation.stage?.bestOf ?? tournament.defaultBestOf ?? 1).toLowerCase() : `BO${operation.stage?.bestOf ?? tournament.defaultBestOf}`}`}
            </p>
            <div className="mt-2">
              <ForcedHeroBadge gameConfig={tournament.gameConfig} />
            </div>
          </div>
          <div className="organizer-header-actions flex flex-wrap gap-2">
            {isExperimental && tournament.hasOrganizerPassword && isAuthenticated && (
              <span className="experimental-session-chip experimental-session-chip--header inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                {orgToken ? t("tournamentDetail.organizator") : t("tournamentDetail.wsparcie_nick", { nick: supSession?.nick })}
                <button
                  type="button"
                  className="font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (orgToken) removeOrgToken(id); else removeSupSession(id);
                    setActiveOrganizerToken(null); setActiveSupportToken(null);
                  }}
                >
                  {t("tournamentDetail.wyloguj")}</button>
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => setShowChecklist((v) => !v)}
              title={t("tournamentDetail.checklista_przed_turniejem")}
            >
              <CheckSquare className="w-4 h-4 mr-2" /> <span className="experimental-action-label">{t("tournamentDetail.checklista")}</span>
            </Button>
            {tournament.status !== "draft" && (
              <>
                {/* V5.8: Experimental reaches the host through the "Prowadzenie" tab right below. */}
                {!isExperimental && <Button variant="outline" asChild>
                  <Link href={tournamentHref(id, isExperimental, "/host")}><Swords className="w-4 h-4 mr-2" /> {t("tournamentDetail.panel_prowadzacego")}</Link>
                </Button>}
                <Button variant="outline" asChild>
                  <Link href={tournamentHref(id, isExperimental, "/audience")}><Monitor className="w-4 h-4 mr-2" /> <span className="experimental-action-label">{t("tournamentDetail.widok_widzow")}</span></Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={tournamentHref(id, isExperimental, "/bracket")}><ExternalLink className="w-4 h-4 mr-2" /> <span className="experimental-action-label">{t("tournamentDetail.projektor")}</span></Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {isExperimental ? (
          <ExperimentalTournamentChecklist
            open={showChecklist && !!id}
            onClose={() => setShowChecklist(false)}
            tournamentId={id ?? 0}
            tournamentName={tournament?.name}
          />
        ) : (
          <TournamentChecklist
            open={showChecklist && !!id}
          onClose={() => setShowChecklist(false)}
          tournamentId={id ?? 0}
          tournamentName={tournament?.name}
          />
        )}

        {managementRole && (
          <TournamentOrganizerNavigation tournamentId={id} active={activeArea} capabilities={capabilities} stages={stages} />
        )}
        {nextStep && !experimentalWorkTab && (
          <OrganizerNextStep
            step={nextStep}
            onAction={nextStep.kind === "planned_stage" && !capabilities.canManageLifecycle ? handleStart : undefined}
            pending={startTournament.isPending}
          />
        )}
        {managementRole && !experimentalWorkTab && (
          <TournamentOperationsOverview
            tournamentId={id}
            enabled={readOk && preparedAuthId === id}
            collapsible={isExperimental}
            blockersExplained={(nextStep as { reason?: string } | null | undefined)?.reason === "needs_entrants"}
          />
        )}
        {startError && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{startError}</p>}
        {startTournament.isPending && <p role="status">{t("tournamentDetail.uruchamianie_etapu_i_odswiezanie_danych")}</p>}

        {/* Fan read-only banner */}
        {role === "fan" && !isAuthenticated && (
          <div className="bg-muted/40 border border-muted rounded-lg p-3 flex items-center gap-3">
            <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{t("tournamentDetail.tryb_kibica_tylko_do_odczytu")}</p>
          </div>
        )}

        {/* Login is available even after the browser has lost its stored role. */}
        {!isAuthenticated && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="font-semibold text-yellow-400 text-sm">{t("tournamentDetail.masz_dostep_tylko_do_podgladu")}</p>
                <p className="text-xs text-muted-foreground">{t("tournamentDetail.uzyj_zachowanego_hasla_organizatora_aby")}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => setShowOrgModal(true)}>
                <Key className="w-3.5 h-3.5 mr-1.5" /> {t("tournamentDetail.wejdz_jako_organizator")}</Button>
              {tournament.hasSupportPassword && (
                <Button size="sm" variant="outline" onClick={() => setShowSupModal(true)}>
                  {t("tournamentDetail.wsparcie")}</Button>
              )}
            </div>
          </div>
        )}

        {/* Authenticated badge */}
        {orgToken && !tournament.hasOrganizerPassword && <OrganizerRecoveryNotice tournamentId={id} />}
        {!isExperimental && tournament.hasOrganizerPassword && isAuthenticated && (
          <div className={`bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 flex items-center gap-2${isExperimental ? " experimental-session-chip" : ""}`}>
            <Shield className="w-4 h-4 text-green-400 shrink-0" aria-hidden="true" />
            <p className="text-sm text-green-400 font-medium">
              {orgToken ? t("tournamentDetail.zalogowano_jako_organizator") : t("tournamentDetail.zalogowano_jako_wsparcie_nick", { nick: supSession?.nick })}
            </p>
            <button
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (orgToken) removeOrgToken(id); else removeSupSession(id);
                setActiveOrganizerToken(null); setActiveSupportToken(null);
              }}
            >
              {t("tournamentDetail.wyloguj")}</button>
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
            <h2 className="text-lg font-semibold">{t("tournamentDetail.turniej_prywatny")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">{t("tournamentDetail.aby_zobaczyc_zawartosc_turnieju_podaj")}</p>
            <button
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => setShowViewerModal(true)}
            >
              <Key className="w-4 h-4" /> {t("tournamentDetail.podaj_haslo_widza")}</button>
          </div>
        )}

        {/* Viewer gate: private_offline without org/sup auth */}
        {visibility === "private_offline" && !isAuthenticated && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("tournamentDetail.turniej_offline_tylko_dla_organizatora")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">{t("tournamentDetail.ten_turniej_jest_niedostepny_publicznie")}</p>
            <button
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => setShowOrgModal(true)}
            >
              <Key className="w-4 h-4" /> {t("tournamentDetail.zaloguj_jako_organizator")}</button>
          </div>
        )}

        {readOk && <Tabs value={activeDetailTab} className="w-full">

          <TabsContent value="overview" className="pt-6">
            {isExperimental ? (
              <ExperimentalTournamentOverview
                tournamentId={id}
                status={tournament.status}
                formatLabel={FORMAT_LABELS[tournament.format] ?? tournament.format}
                maxPlayers={tournament.maxPlayers}
                stageName={operation.stage?.name}
                roundLabel={operation.summary.roundLabel}
                bestOf={operation.stage?.bestOf ?? tournament.defaultBestOf}
                matchRules={operation.stage?.matchRules ?? null}
                stats={stats}
                statsLoading={statsQuery.isLoading}
                statsError={statsQuery.isError}
                onRetryStats={() => void statsQuery.refetch()}
                nextStep={nextStep}
              />
            ) : (
              <>
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("tournamentDetail.gracze")}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPlayers}</div>
                    {tournament.maxPlayers && <p className="text-xs text-muted-foreground">z {tournament.maxPlayers}</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("tournamentDetail.postep")}</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedMatches} / {stats.totalMatches}</div>
                    <p className="text-xs text-muted-foreground">{t("tournamentDetail.meczow_ukonczonych")}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("tournamentDetail.format")}</CardTitle>
                    <Swords className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{FORMAT_LABELS[tournament.format] ?? tournament.format}</div>
                  </CardContent>
                </Card>
                {stats.totalRounds && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t("tournamentDetail.runda")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{operation.summary.roundLabel}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {stats?.topPlayers && stats.topPlayers.length > 0 && (
              <Card className="mt-4">
                <CardHeader><CardTitle>{t("tournamentDetail.liderzy")}</CardTitle></CardHeader>
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
                          <span className="font-bold text-primary">{t("tournamentDetail.gry")}{" "}{(p.gameDiff ?? 0) > 0 ? "+" : ""}{p.gameDiff ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
              </>
            )}
          </TabsContent>

          <TabsContent value="stages" className={isExperimental ? "pt-2 experimental-stages-surface" : "pt-2"}>
            <TournamentStagesPanel
              tournamentId={id}
              tournamentStatus={tournament.status}
              activeStageId={tournament.activeStageId}
              matches={matches ?? []}
              canManage={capabilities.canManageLifecycle}
              canWriteResults={capabilities.canWriteTournamentResults}
              gameConfig={tournament.gameConfig}
              renderStageNavigation={isExperimental && (stages?.length ?? 0) >= 2
                ? ({ selectedStageId, onSelect }) => <ExperimentalStageMap tournamentId={id} stages={stages} matches={matches} activeStageId={tournament.activeStageId} selectedStageId={selectedStageId} onSelectStage={onSelect} />
                : undefined}
            />
          </TabsContent>

          <TabsContent value="baskets" className={isExperimental ? "pt-2 experimental-baskets-surface" : "pt-2"}>
            <StageBasketsPanel
              tournamentId={id}
              tournamentStatus={tournament.status}
              orgToken={orgToken ?? null}
            />
          </TabsContent>

          <TabsContent value="players" className={isExperimental ? "pt-6 experimental-players-surface" : "pt-6"}>
            {!isExperimental && tournament.participantType === "teams" && (
              <div role="note" data-testid="stable-team-mode-note" className="mb-4 flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p>
                  <strong>{t("tournamentDetail.turniej_druzynowy")}</strong> {t("tournamentDetail.kazda_pozycja_na_tej_liscie")}{" "}{t("tournamentDetail.sklady_kapitan_zawodnicy_rezerwowi_i")}{" "}
                  <Link href={`/experimental/tournaments/${id}?tab=players`} className="font-medium underline underline-offset-2">{t("tournamentDetail.widoku_experimental")}</Link>.
                  {tournament.status === "draft" && t("tournamentDetail.start_jest_mozliwy_dopiero_gdy")}
                </p>
              </div>
            )}
            {isExperimental && capabilities.canManageOrganizerSettings && <ParticipantFieldsManager tournamentId={tournament.id} participantNoun={teamEntries ? t("tournamentDetail.druzyn_2") : t("tournamentDetail.graczy_2")} />}
            {/* #329: optional public sign-ups — same panel in Classic and Experimental */}
            {(capabilities.canManageOrganizerSettings || capabilities.canManageParticipants) && (
              <RegistrationPanel tournamentId={tournament.id} experimental={isExperimental}
                canConfigure={capabilities.canManageOrganizerSettings} canReview={capabilities.canManageParticipants}
                participantNoun={teamEntries ? t("tournamentDetail.druzyn_2") : t("tournamentDetail.uczestnikow")} tournamentName={tournament.name} />
            )}
            {isExperimental && <ExperimentalRosterHealth players={players} maxPlayers={tournament.maxPlayers} teamsNotReady={teamsNotReady} nextHref={tournament.status === "draft" && capabilities.canManageLifecycle ? tournamentHref(tournament.id, true, "/host?tab=prowadzenie") : undefined} requiredCount={tournament.status === "draft" && (stages?.length ?? 0) > 1 ? stages?.find((stage) => stage.position === 1)?.participantCount : undefined} />}
            {isExperimental && <ExperimentalPlayerToolbar query={playerSearch} onQueryChange={setPlayerSearch} status={playerStatusFilter} onStatusChange={setPlayerStatusFilter} sort={playerSort} onSortChange={setPlayerSort} total={players?.length ?? 0} visible={displayedPlayers.length} teams={!!teamEntries} />}
            {teamEntries && tournament.status === "draft" && (
              <p className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm" data-testid="team-entries-hint">
                <strong>{t("tournamentDetail.turniej_druzynowy")}</strong> {t("tournamentDetail.najpierw_dodaj")}{" "}<strong>{t("tournamentDetail.druzyny")}</strong> {t("tournamentDetail.to_one_graja_mecze_i")}{" "}<strong>{t("tournamentDetail.sklady_druzyn")}</strong> {t("tournamentDetail.ponizej")}</p>
            )}
            <div className={`grid md:grid-cols-3 gap-6 ${isExperimental ? "mt-4" : ""}`}>
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader className={isExperimental ? "flex flex-row items-center justify-between" : "flex flex-row flex-wrap items-center justify-between gap-2"}>
                    <CardTitle>{teamEntries ? t("tournamentDetail.druzyny_2") : t("tournamentDetail.zawodnicy")} ({players?.length ?? "—"})</CardTitle>
                    {!isExperimental && tournament.status === "draft" && capabilities.canManageParticipants && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" aria-expanded={showBulkPaste} onClick={() => { resetCsvImport(); setShowBulkPaste(!showBulkPaste); }}>
                          <ClipboardPaste className="w-4 h-4 mr-2" /> {showBulkPaste ? t("tournamentDetail.zamknij") : t("tournamentDetail.wklej_liste")}
                        </Button>
                        <Button variant="outline" size="sm" aria-expanded={showCsvImport} onClick={() => { setShowBulkPaste(false); if (showCsvImport) resetCsvImport(); else setShowCsvImport(true); }}>
                          <Upload className="w-4 h-4 mr-2" /> {showCsvImport ? t("tournamentDetail.zamknij") : t("tournamentDetail.import_csv")}
                        </Button>
                      </div>
                    )}
                    {isExperimental && tournament.status === "draft" && capabilities.canManageParticipants && (
                      <Button variant="outline" size="sm" onClick={() => showCsvImport ? resetCsvImport() : setShowCsvImport(true)}>
                        <Upload className="w-4 h-4 mr-2" /> {showCsvImport ? t("tournamentDetail.zamknij") : isExperimental ? t("tournamentDetail.wklej_liste") : t("tournamentDetail.import_csv")}{!showCsvImport && teamEntries ? t("tournamentDetail.druzyn") : ""}
                      </Button>
                    )}
                  </CardHeader>

                  {isExperimental && showCsvImport && capabilities.canManageParticipants && (
                    <div className="border-b px-6 pb-5">
                      <ExperimentalBulkPaste
                        teams={!!teamEntries}
                        existingNames={(players ?? []).map((player) => player.name)}
                        existingSeeds={(players ?? []).flatMap((player) => (typeof player.seed === "number" ? [player.seed] : []))}
                        maxPlayers={tournament.maxPlayers}
                        pending={importPlayers.isPending}
                        onImport={handleExperimentalBulkImport}
                        onClose={resetCsvImport}
                      />
                    </div>
                  )}
                  {!isExperimental && showBulkPaste && tournament.status === "draft" && capabilities.canManageParticipants && (
                    <div className="stable-bulk-paste border-b px-6 pb-5">
                      <ExperimentalBulkPaste
                        existingNames={(players ?? []).map((player) => player.name)}
                        existingSeeds={(players ?? []).flatMap((player) => (typeof player.seed === "number" ? [player.seed] : []))}
                        maxPlayers={tournament.maxPlayers}
                        pending={importPlayers.isPending}
                        onImport={handleExperimentalBulkImport}
                        onClose={() => setShowBulkPaste(false)}
                      />
                    </div>
                  )}
                  {!isExperimental && showCsvImport && capabilities.canManageParticipants && (
                    <div className="border-b">
                      {/* Result panel */}
                      {csvResult ? (
                        <div className="px-6 pb-5 space-y-3">
                          {/* Success summary */}
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <p className="font-semibold text-green-400 flex items-center gap-2 mb-2">
                              <Check className="w-4 h-4" /> {t("tournamentDetail.import_zakonczony")}</p>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                              <span className="text-muted-foreground">{t("tournamentDetail.dodano_zawodnikow")}</span>
                              <span className="font-bold text-green-400">{csvResult.imported}</span>
                              {csvResult.replacedCount != null && csvResult.replacedCount > 0 && (
                                <>
                                  <span className="text-muted-foreground">{t("tournamentDetail.usunietych_tryb_zastap")}</span>
                                  <span className="font-bold text-yellow-400">{csvResult.replacedCount}</span>
                                </>
                              )}
                              {csvResult.skipped > 0 && (
                                <>
                                  <span className="text-muted-foreground">{t("tournamentDetail.pominieto_wierszy")}</span>
                                  <span className="font-bold text-red-400">{csvResult.skipped}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {/* Errors per line */}
                          {csvResult.errors?.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> {t("tournamentDetail.wiersze_wymagajace_poprawy")}</p>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {csvResult.errors.map((err: any, idx: number) => (
                                  <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded px-3 py-1.5 text-xs">
                                    <span className="text-muted-foreground">{t("tournamentDetail.linia")}{" "}{err.line}:</span>{" "}
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
                              {t("tournamentDetail.osiagnieto_limit_graczy_turnieju_czesc")}</div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" onClick={resetCsvImport}>{t("tournamentDetail.zamknij")}</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setCsvResult(null); setCsvText(""); }}>
                              {t("tournamentDetail.importuj_kolejnych")}</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-6 pb-5 space-y-4 pt-2">
                          {/* Format instruction card */}
                          <div className="bg-card border rounded-lg p-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5" /> {t("tournamentDetail.format_pliku_csv")}</p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>{t("tournamentDetail.pierwsza_linia_to")}{" "}<strong className="text-foreground">{t("tournamentDetail.naglowek")}</strong>{t("tournamentDetail.obslugiwane_kolumny")}</p>
                              <div className="bg-muted/50 rounded p-2 font-mono text-[11px] space-y-0.5">
                                <p><span className="text-green-400">{t("tournamentDetail.name")}</span> {t("tournamentDetail.nick_zawodnika")}{" "}<span className="text-red-400">{t("tournamentDetail.wymagane")}</span></p>
                                <p><span className="text-blue-400">{t("tournamentDetail.team")}</span> {t("tournamentDetail.druzyna")}{" "}<span className="text-muted-foreground">{t("tournamentDetail.opcjonalne")}</span></p>
                                <p><span className="text-blue-400">{t("tournamentDetail.seed")}</span> {t("tournamentDetail.rozstawienie_1_999")}{" "}<span className="text-muted-foreground">{t("tournamentDetail.opcjonalne")}</span></p>
                              </div>
                              <div className="bg-muted/30 rounded p-2 font-mono text-[11px]">
                                <p className="text-muted-foreground">{t("tournamentDetail.name_team_seed")}</p>
                                <p>{t("tournamentDetail.proplayer_teamalpha_1")}</p>
                                <p>{t("tournamentDetail.noobslayer_teambeta_2")}</p>
                                <p>{t("tournamentDetail.steelnova_3")}</p>
                              </div>
                              <p className="text-[11px]">{t("tournamentDetail.separator_przecinek")}{" "}<code className="bg-muted px-1 rounded">,</code> {t("tournamentDetail.lub_srednik")}{" "}<code className="bg-muted px-1 rounded">;</code> {t("tournamentDetail.wykrywany_automatycznie")}</p>
                              {isExperimental && participantFields.length > 0 && (
                                <p className="text-[11px]">{t("tournamentDetail.kolumny_nazwane_jak_dodatkowe_pola")}{" "}<code className="bg-muted px-1 rounded">{participantFields[0].label}</code>{t("tournamentDetail.wypelnia_te_pola_bledna_wartosc")}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground" onClick={handleDownloadSampleCsv}>
                              <Download className="w-3 h-3 mr-1.5" /> {t("tournamentDetail.pobierz_przykladowy_plik_csv")}</Button>
                          </div>

                          {/* File + paste input */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input ref={csvFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFileChange} />
                              <Button variant="outline" size="sm" className="border-dashed text-xs" onClick={() => csvFileRef.current?.click()}>
                                <Upload className="w-3.5 h-3.5 mr-1.5" /> {t("tournamentDetail.wybierz_plik_csv")}</Button>
                              <span className="text-xs text-muted-foreground">{t("tournamentDetail.lub_wklej_recznie_ponizej")}</span>
                            </div>
                            <Textarea
                              value={csvText}
                              onChange={(e) => { setCsvText(e.target.value); setCsvConfirmReplace(false); }}
                              rows={6}
                              placeholder={t("tournamentDetail.name_team_seed_proplayer_teamalpha")}
                              className="font-mono text-xs"
                            />
                            {csvText.trim() && (
                              <p className="text-xs text-muted-foreground">
                                {t("tournamentDetail.wiersze_danych")}{" "}<strong className="text-foreground">{Math.max(0, csvText.trim().split("\n").filter(l => l.trim()).length - 1)}</strong>
                              </p>
                            )}
                          </div>

                          {/* Mode selector (only if players already exist) */}
                          {(players?.length ?? 0) > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">{t("tournamentDetail.tryb_importu")}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => { setCsvMode("append"); setCsvConfirmReplace(false); }}
                                  className={`rounded-lg border p-3 text-left transition-colors ${csvMode === "append" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground"}`}
                                >
                                  <p className="text-sm font-semibold">{t("tournamentDetail.dopisz")}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{t("tournamentDetail.dodaj_nowych_graczy_do_istniejacej")}{players?.length ?? 0} {t("tournamentDetail.graczy")}</p>
                                </button>
                                <button
                                  onClick={() => { setCsvMode("replace"); setCsvConfirmReplace(false); }}
                                  className={`rounded-lg border p-3 text-left transition-colors ${csvMode === "replace" ? "border-yellow-500 bg-yellow-500/10" : "border-border bg-card hover:border-muted-foreground"}`}
                                >
                                  <p className="text-sm font-semibold">{t("tournamentDetail.zastap")}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{t("tournamentDetail.usun_wszystkich_graczy_i_zaimportuj")}</p>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Replace confirmation */}
                          {csvConfirmReplace && (
                            <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-3 space-y-2">
                              <p className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {t("tournamentDetail.potwierdzenie_zastapienia")}</p>
                              <p className="text-xs text-muted-foreground">
                                {t("tournamentDetail.spowoduje_to")}{" "}<strong className="text-foreground">{t("tournamentDetail.usuniecie")}{" "}{players?.length} {t("tournamentDetail.graczy_2")}</strong> {t("tournamentDetail.z_turnieju_i_zastapienie_ich")}</p>
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30" onClick={handleCsvImport} disabled={importPlayers.isPending}>
                                  {importPlayers.isPending ? t("tournamentDetail.importowanie") : t("tournamentDetail.tak_zastap_graczy")}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setCsvConfirmReplace(false)}>{t("tournamentDetail.anuluj")}</Button>
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
                              {importPlayers.isPending ? t("tournamentDetail.importowanie") : csvMode === "replace" ? t("tournamentDetail.zastap_graczy_z_csv") : t("tournamentDetail.importuj_z_csv")}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <CardContent className="pt-4">
                    <ReadQueryState query={playersQuery} loadingMessage={t("tournamentDetail.ladowanie_listy_graczy")} errorMessage={t("tournamentDetail.nie_udalo_sie_pobrac_listy")}>
                    {players?.length ? (
                      <div className={isExperimental ? "experimental-player-list space-y-2" : "space-y-2"}>
                        {isExperimental && displayedPlayers.length === 0 && <div className="organizer-empty-state border border-dashed p-6 text-center text-sm text-muted-foreground">{t("tournamentDetail.brak_graczy_pasujacych_do_wyszukiwania")}</div>}
                        {(isExperimental ? displayedPlayers : players).map((p) => (
                          capabilities.canManageParticipants && editingPlayerId === p.id ? (
                            // Inline edit form
                            <div key={p.id} className="border border-primary/40 rounded bg-background p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">{t("tournamentDetail.nick")}</Label>
                                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">{t("tournamentDetail.ranga")}</Label>
                                  <Input value={editRank} onChange={(e) => setEditRank(e.target.value)} className="h-8 text-sm" placeholder={t("tournamentDetail.np_gm")} />
                                </div>
                                <div>
                                  <Label className="text-xs">{t("tournamentDetail.druzyna_2")}</Label>
                                  <Input value={editTeam} onChange={(e) => setEditTeam(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div>
                                  <Label className="text-xs">{t("tournamentDetail.kraj")}</Label>
                                  <Input value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="h-8 text-sm" placeholder={t("tournamentDetail.pl")} />
                                </div>
                                <div>
                                  <Label className="text-xs">{t("tournamentDetail.rozstawienie")}</Label>
                                  <Input type="number" value={editSeed} onChange={(e) => setEditSeed(e.target.value)} className="h-8 text-sm" />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  <X className="w-3 h-3 mr-1" /> {t("tournamentDetail.anuluj")}</Button>
                                <Button size="sm" onClick={handleSaveEdit} disabled={updatePlayer.isPending || !editName.trim()}>
                                  <Check className="w-3 h-3 mr-1" /> {t("tournamentDetail.zapisz")}</Button>
                              </div>
                            </div>
                          ) : (
                            // Normal player row
                            <div key={p.id} data-exp-player-status={isExperimental ? p.status ?? "unknown" : undefined} className={`flex flex-col border rounded bg-background ${isExperimental ? "experimental-player-row" : ""}`}>
                              {/* Main info + actions row */}
                              <div className="flex justify-between items-center p-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{p.name}</span>
                                    {p.seed != null && <Badge variant="outline" className="text-xs" aria-label={isExperimental ? t("tournamentDetail.rozstawienie_seed", { seed: p.seed }) : undefined}>#{p.seed}</Badge>}
                                  </div>
                                  <div className="flex gap-3 mt-0.5">
                                    {p.rank && <span className="text-xs text-muted-foreground">{p.rank}</span>}
                                    {p.teamName && <span className="text-xs text-muted-foreground">{p.teamName}</span>}
                                    {p.country && <span className="text-xs text-muted-foreground">{p.country}</span>}
                                  </div>
                                  {isExperimental && <ParticipantFieldChips fields={participantFields} values={p.customFields as Record<string, unknown> | null | undefined} />}
                                  {isDeadlock && ((tournament.gameConfig as any)?.config?.bansPerPlayer ?? 5) > 0 && (
                                    <div className="mt-1">
                                      <PlayerBansRow bannedHeroIds={playerBansMap.get(p.id) ?? []} size={22} maxBans={(tournament.gameConfig as any)?.config?.bansPerPlayer ?? 5} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {tournament.status !== "draft" && (
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {(() => {
                                        const standing = standings?.find((entry) => entry.playerId === p.id);
                                        return t("tournamentDetail.v0_w_v1_l_gry", { v0: standing?.matchWins ?? 0, v1: standing?.matchLosses ?? 0, v2: standing?.gameWins ?? 0, v3: standing?.gameLosses ?? 0 });
                                      })()}
                                    </span>
                                  )}
                                  <Badge variant={p.status === "eliminated" ? "destructive" : p.status === "winner" ? "default" : "outline"}>
                                    {PLAYER_STATUS_LABELS[p.status ?? ""] ?? t("tournamentDetail.nieznany")}
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
                                      {p.id === editingBansPlayerId ? t("tournamentDetail.zamknij") : t("tournamentDetail.bany")}
                                    </Button>
                                  )}
                                  {isExperimental && capabilities.canManageParticipants && participantFields.length > 0 && (
                                    <Button variant="ghost" size="sm" className="h-8 text-xs" aria-expanded={editingFieldsPlayerId === p.id} onClick={() => setEditingFieldsPlayerId(editingFieldsPlayerId === p.id ? null : p.id)} title={t("tournamentDetail.dodatkowe_dane_mozna_je_zmieniac")}>
                                      {t("tournamentDetail.dane")}</Button>
                                  )}
                                  {capabilities.canManageParticipants && (tournament.status === "draft" || !isExperimental) && (
                                    <Button variant="ghost" size="icon" onClick={() => handleStartEdit(p)} className="text-muted-foreground hover:text-foreground h-8 w-8" aria-label={isExperimental ? t("tournamentDetail.edytuj_gracza_name", { name: p.name }) : undefined} title={isExperimental ? t("tournamentDetail.edytuj_gracza") : undefined}>
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {capabilities.canManageParticipants && tournament.status === "draft" && (
                                    confirmDeletePlayerId === p.id ? (
                                      <div className="flex items-center gap-1">
                                        <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={handleConfirmDeletePlayer} disabled={deletePlayer.isPending}>
                                          {t("tournamentDetail.usun")}</Button>
                                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setConfirmDeletePlayerId(null)}>
                                          {t("tournamentDetail.anuluj")}</Button>
                                      </div>
                                    ) : (
                                      <Button variant="ghost" size="icon" onClick={() => handleDeletePlayer(p.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8" aria-label={isExperimental ? t("tournamentDetail.usun_gracza_name", { name: p.name }) : undefined} title={isExperimental ? t("tournamentDetail.usun_gracza") : undefined}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )
                                  )}
                                </div>
                              </div>
                              {isExperimental && editingFieldsPlayerId === p.id && (
                                <div className="border-t bg-muted/10 p-3">
                                  <ParticipantFieldValuesEditor tournamentId={tournament.id} playerId={p.id} fields={participantFields} values={p.customFields as Record<string, unknown> | null | undefined} onDone={() => setEditingFieldsPlayerId(null)} />
                                </div>
                              )}
                              {/* Deadlock ban editor */}
                              {isDeadlock && editingBansPlayerId === p.id && (
                                <div className="border-t bg-muted/10 p-3">
                                  <p className="text-xs font-semibold text-destructive/80 mb-2">
                                    {(() => {
                                      const max = (tournament.gameConfig as any)?.config?.bansPerPlayer ?? 5;
                                      return t("tournamentDetail.bany_gracza_max_max_length", { max: max, length: pendingBans.length, max2: max });
                                    })()}
                                  </p>
                                  <HeroPickerGrid
                                    selectedIds={pendingBans}
                                    maxSelect={(tournament.gameConfig as any)?.config?.bansPerPlayer ?? 5}
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
                                      {t("tournamentDetail.anuluj")}</Button>
                                    <Button
                                      size="sm"
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={setPlayerBans.isPending}
                                      onClick={async () => {
                                        await setPlayerBans.mutateAsync({ playerId: p.id, bannedHeroIds: pendingBans });
                                        setEditingBansPlayerId(null);
                                      }}
                                    >
                                      {t("tournamentDetail.zapisz_bany")}</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className={isExperimental ? "organizer-empty-state border border-dashed text-center py-8 text-muted-foreground" : "text-center py-8 text-muted-foreground"}>
                        {teamEntries && capabilities.canManageParticipants
                          ? t("tournamentDetail.brak_druzyn_dodaj_nazwy_druzyn")
                          : capabilities.canManageParticipants
                          ? t("tournamentDetail.brak_graczy_dodaj_recznie_lub")
                          : t("tournamentDetail.brak_graczy_w_tym_turnieju")}
                      </div>
                    )}
                  </ReadQueryState>
                  </CardContent>
                </Card>
              </div>
              <div>
                {tournament.status === "draft" && capabilities.canManageParticipants && (
                  <Card>
                    <CardHeader><CardTitle>{teamEntries ? t("tournamentDetail.dodaj_druzyne") : t("tournamentDetail.dodaj_gracza")}</CardTitle></CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddPlayer} className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor={isExperimental ? "experimental-add-player-nick" : undefined}>{teamEntries ? t("tournamentDetail.nazwa_druzyny") : t("tournamentDetail.nick")}</Label>
                          <Input
                            id={isExperimental ? "experimental-add-player-nick" : undefined}
                            value={newPlayerName}
                            onChange={(e) => { setNewPlayerName(e.target.value); setAddPlayerError(null); }}
                            placeholder={teamEntries ? t("tournamentDetail.np_orly") : t("tournamentDetail.alias_gracza")}
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
                        {isExperimental && requiredParticipantFields.length > 0 && (
                          <ParticipantFieldInputs fields={requiredParticipantFields} values={newPlayerFields} idPrefix="experimental-add-player-field" onChange={(key, value) => { setNewPlayerFields((current) => ({ ...current, [key]: value })); setAddPlayerError(null); }} />
                        )}
                        {isExperimental ? (
                          <details className="experimental-add-player-more">
                            <summary>{optionalParticipantFields.length ? t("tournamentDetail.wiecej_danych_v0", { v0: optionalParticipantFields.length + 4 }) : t("tournamentDetail.wiecej_danych_ranga_druzyna_kraj")}</summary>
                            <div className="space-y-3 pt-3">
                        {optionalParticipantFields.length > 0 && (
                          <ParticipantFieldInputs fields={optionalParticipantFields} values={newPlayerFields} idPrefix="experimental-add-player-field" onChange={(key, value) => setNewPlayerFields((current) => ({ ...current, [key]: value }))} />
                        )}
                        <div className="space-y-1">
                          <Label>{t("tournamentDetail.ranga")}</Label>
                          <Input value={newPlayerRank} onChange={(e) => setNewPlayerRank(e.target.value)} placeholder={t("tournamentDetail.np_gm_diamond")} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>{t("tournamentDetail.druzyna_2")}</Label>
                            <Input value={newPlayerTeam} onChange={(e) => setNewPlayerTeam(e.target.value)} placeholder={t("tournamentDetail.nazwa")} />
                          </div>
                          <div className="space-y-1">
                            <Label>{t("tournamentDetail.kraj")}</Label>
                            <Input value={newPlayerCountry} onChange={(e) => setNewPlayerCountry(e.target.value)} placeholder={t("tournamentDetail.pl_de")} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={isExperimental ? "experimental-add-player-seed" : undefined}>{t("tournamentDetail.rozstawienie")}</Label>
                          <Input id={isExperimental ? "experimental-add-player-seed" : undefined} type="number" value={newPlayerSeed} onChange={(e) => setNewPlayerSeed(e.target.value)} placeholder={isExperimental ? t("tournamentDetail.automatycznie_v0", { v0: (players?.length ?? 0) + 1 }) : "1"} />
                        </div>
                            </div>
                          </details>
                        ) : (
                          <>
                        <div className="space-y-1">
                          <Label>{t("tournamentDetail.ranga")}</Label>
                          <Input value={newPlayerRank} onChange={(e) => setNewPlayerRank(e.target.value)} placeholder={t("tournamentDetail.np_gm_diamond")} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>{t("tournamentDetail.druzyna_2")}</Label>
                            <Input value={newPlayerTeam} onChange={(e) => setNewPlayerTeam(e.target.value)} placeholder={t("tournamentDetail.nazwa")} />
                          </div>
                          <div className="space-y-1">
                            <Label>{t("tournamentDetail.kraj")}</Label>
                            <Input value={newPlayerCountry} onChange={(e) => setNewPlayerCountry(e.target.value)} placeholder={t("tournamentDetail.pl_de")} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={isExperimental ? "experimental-add-player-seed" : undefined}>{t("tournamentDetail.rozstawienie")}</Label>
                          <Input id={isExperimental ? "experimental-add-player-seed" : undefined} type="number" value={newPlayerSeed} onChange={(e) => setNewPlayerSeed(e.target.value)} placeholder={isExperimental ? t("tournamentDetail.automatycznie_v0", { v0: (players?.length ?? 0) + 1 }) : "1"} />
                        </div>
                          </>
                        )}
                        <Button type="submit" className="w-full" disabled={addPlayer.isPending}>{isExperimental && addPlayer.isPending ? t("tournamentDetail.dodawanie") : teamEntries ? t("tournamentDetail.dodaj_druzyne") : t("tournamentDetail.dodaj_gracza")}</Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            {isExperimental && tournament.participantType === "teams" && (
              <div className="mt-6"><ExperimentalTeamRosters tournamentId={tournament.id} canEdit={capabilities.canManageParticipants} entriesSignature={(players ?? []).map((player) => `${player.id}:${player.name}`).join("|")} /></div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="pt-6">
            <Card>
              <CardHeader><CardTitle>{t("tournamentDetail.mecze")}</CardTitle></CardHeader>
              <CardContent>
                {!matches || matches.length === 0 ? (() => {
                  // QW-10: say why the list is empty and where the next step is.
                  const empty = matchesEmptyState({ status: tournament.status, playerCount: players?.length ?? 0, canManage: capabilities.canManageParticipants });
                  return (
                    <div className="text-center py-8 text-muted-foreground space-y-3" data-testid="matches-empty">
                      <p>{empty.text}</p>
                      {empty.tab && <Button asChild variant="outline" size="sm"><Link href={tournamentHref(id, isExperimental, `?tab=${empty.tab.value}`)}>{empty.tab.label}</Link></Button>}
                    </div>
                  );
                })() : (
                  <div className="space-y-2">
                    {matches.map((m) => (
                      <div key={m.id}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded bg-background">
                        <div className="flex items-center gap-3 mb-2 md:mb-0">
                          <Badge variant="outline">R{m.round}</Badge>
                          <span className="text-xs text-muted-foreground">M{m.matchNumber}</span>
                          {isTwoLegTie(m) && <Badge variant="outline" className="text-xs">{t("tournamentDetail.dwumecz")}</Badge>}
                          {m.bestOf && m.bestOf > 1 && <Badge variant="outline" className="text-xs">{(() => { const rules = stages?.find((stage) => stage.id === m.stageId)?.matchRules; return rules?.kind === "sets" ? t("tournamentDetail.sety_do_setstowin", { setsToWin: rules.setsToWin }) : rules?.kind === "two_legs" ? t("tournamentDetail.dwumecz") : `BO${m.bestOf}`; })()}</Badge>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-right w-28 truncate text-sm ${m.winnerId === m.player1Id ? "font-bold text-primary" : ""}`}>
                            {m.player1Name || t("tournamentDetail.tbd")}
                          </div>
                          <div className="flex items-center gap-2 font-mono bg-muted/50 px-2 py-1 rounded text-sm">
                             {tieScoreText(m) && m.status !== "completed" ? (
                               <span title={t("tournamentDetail.suma_po_rozegranych_spotkaniach")}>{tieScoreText(m)}</span>
                             ) : m.resultType === "played" || m.status !== "completed" ? (
                               <><span>{m.score1 !== null ? m.score1 : "-"}</span><span className="text-muted-foreground">:</span><span>{m.score2 !== null ? m.score2 : "-"}</span></>
                             ) : (
                               <span>{m.resultType === "walkover" ? t("tournamentDetail.w_o") : m.resultType === "bye" ? t("tournamentDetail.bye") : t("tournamentDetail.n_c")}</span>
                             )}
                          </div>
                          {m.sets?.length ? <span className="text-xs text-muted-foreground tabular-nums" title={t("tournamentDetail.wyniki_setow")}>({setsText(m.sets)})</span> : null}
                          <div className={`w-28 truncate text-sm ${m.winnerId === m.player2Id ? "font-bold text-primary" : ""}`}>
                            {m.player2Name || t("tournamentDetail.tbd")}
                          </div>
                        </div>
                        <div className="mt-1 md:mt-0">
                          <Badge variant="secondary" className={
                            m.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                            m.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-transparent border"
                          }>
                            {m.status === "completed" ? m.resultType === "walkover" ? t("tournamentDetail.walkower") : m.resultType === "bye" ? t("tournamentDetail.wolny_los") : m.resultType === "no_contest" ? t("tournamentDetail.no_contest") : t("tournamentDetail.zakonczony") : MATCH_STATUS_LABELS[m.status] ?? t("tournamentDetail.nieznany")}
                          </Badge>
                        </div>
                      </div>
                      {isTwoLegTie(m) && m.player1Id != null && m.player2Id != null && (
                        <div className="rounded-b border border-t-0 bg-muted/20 px-3 py-2">
                          <TwoLegTieSummary match={m} />
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings" className="pt-6">
            {isExperimental && hasMultipleStages && tableStage && liveStageStandings.data?.tables.length ? (
              <Card className="mb-6" data-testid="current-stage-table">
                <CardHeader><CardTitle>{t("tournamentDetail.tabela_etapu")}{tableStage.name}”</CardTitle></CardHeader>
                <CardContent><StageLiveTables data={liveStageStandings.data} /></CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader><CardTitle>{hasMultipleStages ? t("tournamentDetail.bilans_laczny_meczow_wszystkie_etapy") : stageScopeUnknown ? t("tournamentDetail.bilans_informacyjny_zakres_etapow_niepot") : tournament.format === "single_elimination" ? t("tournamentDetail.bilans_informacyjny") : t("tournamentDetail.klasyfikacja")}</CardTitle></CardHeader>
              <CardContent>
                {standingsInformational && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {hasMultipleStages ? t("tournamentDetail.bilans_informacyjny_wszystkich_etapow_ni") : t("tournamentDetail.liczba_etapow_nie_zostala_potwierdzona")}
                  </p>
                )}
                {!standings || standings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="standings-empty">{standingsEmptyText(tournament.status)}</div>
                ) : tournament.format === "single_elimination" ? (
                  <div>
                    {!standingsInformational && (
                      <p className="mb-4 text-sm text-muted-foreground">
                        {t("tournamentDetail.awans_i_mistrz_wynikaja_wylacznie")}</p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {standings.map((s) => (
                        <div key={s.playerId} className="rounded-lg border bg-muted/10 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{s.playerName}</div>
                              <div className="text-xs text-muted-foreground">{[s.teamName, s.country].filter(Boolean).join(" · ") || t("tournamentDetail.uczestnik")}</div>
                            </div>
                            <Badge variant="outline">{PLAYER_STATUS_LABELS[s.status] ?? t("tournamentDetail.nieznany")}</Badge>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                            <div><strong className="block text-base text-foreground">{s.points != null ? t("tournamentDetail.points_pkt", { points: s.points }) : `${s.matchWins}-${s.matchLosses}`}</strong>{s.points != null ? `${s.matchWins}-${s.matchDraws ?? 0}-${s.matchLosses}` : t("tournamentDetail.mecze")}</div>
                            <div><strong className="block text-base text-foreground">{s.gameWins}:{s.gameLosses}</strong>{standingsHaveSets(standings) ? t("tournamentDetail.sety") : t("tournamentDetail.gry")}</div>
                            <div><strong className="block text-base text-foreground">{s.gameDiff > 0 ? "+" : ""}{s.gameDiff}</strong>{t("tournamentDetail.roznica")}</div>
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
                          {!standingsInformational && <th className="py-2 px-2 w-8">#</th>}
                          <th className="py-2 px-2">{t("tournamentDetail.gracz")}</th>
                          {standingsHavePoints(standings) && <th className="py-2 px-2 text-center" title={t("tournamentDetail.punkty_ligowe")}>{t("tournamentDetail.pkt")}</th>}
                          <th className="py-2 px-2 text-center">{t("tournamentDetail.mecze")}</th>
                          <th className="py-2 px-2 text-center">W</th>
                          {standingsHavePoints(standings) && <th className="py-2 px-2 text-center" title={t("tournamentDetail.remisy")}>R</th>}
                          <th className="py-2 px-2 text-center">P</th>
                          <th className="py-2 px-2 text-center" title={standingsHaveSets(standings) ? t("tournamentDetail.wygrane_i_przegrane_sety") : undefined}>{standingsHaveSets(standings) ? t("tournamentDetail.sety") : standingsHavePoints(standings) ? t("tournamentDetail.bilans") : t("tournamentDetail.gry")}</th>
                          {standingsHaveSets(standings) && <th className="py-2 px-2 text-center" title={t("tournamentDetail.male_punkty_suma_punktow_zdobytych")}>{t("tournamentDetail.male_pkt")}</th>}
                          {(!isExperimental || standings.some((row) => row.buchholz != null)) && <th className="py-2 px-2 text-center" title={t("tournamentDetail.buchholz_suma_punktow_rywali_system")}>{t("tournamentDetail.buchh")}</th>}
                          <th className="py-2 px-2 text-center" title={standingsHaveSets(standings) ? t("tournamentDetail.roznica_setow") : undefined}>+/-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((s) => (
                          <tr key={s.playerId} className="border-b last:border-0 hover:bg-muted/20">
                            {!standingsInformational && (
                              <td className={`py-2 px-2 font-mono font-bold ${s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-gray-400" : s.rank === 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                                {s.rank}
                              </td>
                            )}
                            <td className="py-2 px-2">
                              <div className="font-semibold">{s.playerName}</div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                {s.rankName && <span>{s.rankName}</span>}
                                {s.teamName && <span>{s.teamName}</span>}
                                {s.country && <span>{s.country}</span>}
                              </div>
                            </td>
                            {standingsHavePoints(standings) && <td className="py-2 px-2 text-center font-bold tabular-nums">{s.points ?? 0}</td>}
                            <td className="py-2 px-2 text-center">{s.matchesPlayed}</td>
                            <td className="py-2 px-2 text-center text-green-400">{s.matchWins}</td>
                            {standingsHavePoints(standings) && <td className="py-2 px-2 text-center text-muted-foreground">{s.matchDraws ?? 0}</td>}
                            <td className="py-2 px-2 text-center text-red-400">{s.matchLosses}</td>
                            <td className="py-2 px-2 text-center font-mono">{s.gameWins}:{s.gameLosses}</td>
                            {standingsHaveSets(standings) && <td className="py-2 px-2 text-center font-mono text-muted-foreground">{s.setPointsFor ?? 0}:{s.setPointsAgainst ?? 0}</td>}
                            {(!isExperimental || standings.some((row) => row.buchholz != null)) && <td className="py-2 px-2 text-center text-muted-foreground">{s.buchholz ?? "—"}</td>}
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              <span className={s.gameDiff > 0 ? "text-green-400" : s.gameDiff < 0 ? "text-red-400" : ""}>
                                {s.gameDiff > 0 ? "+" : ""}{s.gameDiff}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <LeagueTableNotes
                      standings={standings}
                      rulesSummary={standingsHavePoints(standings) ? (stages?.find((stage) => stage.status === "active") ?? stages?.at(-1))?.leagueRulesSummary ?? null : null}
                    />
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
                matchPicksMap={isDeadlock ? matchPicksMap : undefined}
                marvelEnabled={tournament.gameConfig?.gameId === "marvel"}
              />
          </TabsContent>

          <TabsContent value="history" className="pt-6">
            <Card>
              <CardHeader><CardTitle>{t("tournamentDetail.historia_wynikow")}</CardTitle></CardHeader>
              <CardContent>
                {!history || history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="history-empty">{historyEmptyText(capabilities.canWriteTournamentResults)}</div>
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
                                <span className="text-muted-foreground mx-2">{r.resultType === "played" ? `${r.score1}:${r.score2}` : r.resultType === "walkover" ? t("tournamentDetail.w_o") : r.resultType === "bye" ? t("tournamentDetail.bye") : t("tournamentDetail.n_c")}</span>
                                <span className={r.winnerName === r.player2Name ? "font-bold text-primary" : ""}>{r.player2Name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {r.winnerName ? (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3 text-primary" /> {r.winnerName}
                                </span>
                              ) : <Badge variant="secondary">{t("tournamentDetail.no_contest")}</Badge>}
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
                                      size={24}
                                      showEmpty={false}
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
              {/* QW-09: the next event with the same settings (no participants, results or history). */}
              <SettingsCopyCard tournamentId={id} experimental={isExperimental} autoOpen={new URLSearchParams(search).get("kopiuj") === "1"} />

              {/* Tip banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-primary mb-1">{t("tournamentDetail.kiedy_robic_backup")}</p>
                  <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>{t("tournamentDetail.przed_rozpoczeciem_turnieju")}</li>
                    <li>{t("tournamentDetail.po_kazdej_ukonczonej_rundzie")}</li>
                    <li>{t("tournamentDetail.przed_wiekszymi_zmianami_edycja_graczy")}</li>
                  </ul>
                </div>
              </div>

              {/* Export section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="w-4 h-4 text-primary" /> {t("tournamentDetail.eksport_backupu")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("tournamentDetail.pobierz_pelny_stan_turnieju_do")}{" "}<code className="bg-muted px-1 rounded text-xs">{t("tournamentDetail.json")}</code>{t("tournamentDetail.plik_zawiera_graczy_mecze_wyniki")}</p>
                  <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground space-y-1">
                    <p>📁 <strong>{t("tournamentDetail.turniej")}</strong> {tournament?.name}</p>
                    <p>👥 <strong>{t("tournamentDetail.gracze_2")}</strong> {stats?.totalPlayers ?? "—"}</p>
                    <p>⚔️ <strong>{t("tournamentDetail.mecze_2")}</strong> {stats?.totalMatches ?? "—"} {t("tournamentDetail.ukonczone")}{" "}{stats?.completedMatches ?? 0})</p>
                    <p>📅 <strong>{t("tournamentDetail.status")}</strong> {TOURNAMENT_STATUS_LABELS[tournament?.status ?? ""] ?? t("tournamentDetail.nieznany")} {t("tournamentDetail.runda_2")}{" "}{tournament?.currentRound ?? "—"}/{tournament?.totalRounds ?? "—"}</p>
                  </div>
                  <Button onClick={handleExport} disabled={isExporting} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? t("tournamentDetail.pobieranie") : t("tournamentDetail.pobierz_backup_json")}
                  </Button>
                </CardContent>
              </Card>

              {/* Import section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileUp className="w-4 h-4 text-yellow-400" /> {t("tournamentDetail.przywracanie_z_backupu")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="text-muted-foreground">
                      {t("tournamentDetail.import_tworzy")}{" "}<strong className="text-foreground">{t("tournamentDetail.nowa_kopie")}</strong> {t("tournamentDetail.turnieju_obecny_turniej_pozostaje_niezmi")}</div>
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
                        <Upload className="w-4 h-4 mr-2" /> {t("tournamentDetail.wybierz_plik_backup_json")}</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                          <Check className="w-4 h-4" /> {t("tournamentDetail.plik_odczytany_poprawnie")}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>🏆 <strong className="text-foreground">{t("tournamentDetail.turniej")}</strong> {importPreview.tournament.name}</p>
                          <p>📋 <strong className="text-foreground">{t("tournamentDetail.format_2")}</strong> {FORMAT_LABELS[importPreview.tournament.format] ?? importPreview.tournament.format}</p>
                          <p>👥 <strong className="text-foreground">{t("tournamentDetail.gracze_2")}</strong> {importPreview.players?.length ?? 0}</p>
                          <p>⚔️ <strong className="text-foreground">{t("tournamentDetail.mecze_2")}</strong> {importPreview.matches?.length ?? 0}</p>
                          <p>📊 <strong className="text-foreground">{t("tournamentDetail.status")}</strong> {TOURNAMENT_STATUS_LABELS[importPreview.tournament.status] ?? t("tournamentDetail.nieznany")} {t("tournamentDetail.runda_2")}{" "}{importPreview.tournament.currentRound ?? "—"}/{importPreview.tournament.totalRounds ?? "—"}</p>
                          <p>📅 <strong className="text-foreground">{t("tournamentDetail.data_backupu")}</strong> {new Date(importPreview.exportedAt).toLocaleString("pl")}</p>
                          <p>🔖 <strong className="text-foreground">{t("tournamentDetail.wersja_formatu")}</strong> {importPreview.schemaVersion}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("tournamentDetail.turniej_zostanie_przywrocony_jako")}{" "}<strong>„{importPreview.tournament.name} {t("tournamentDetail.kopia")}</strong> {t("tournamentDetail.i_otwarty_automatycznie")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("tournamentDetail.hasla_i_tokeny_nie_sa")}</p>
                      <div className="space-y-1.5">
                        <Label htmlFor="restore-organizer-password-detail">{t("tournamentDetail.nowe_haslo_organizatora")}</Label>
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
                          <Label htmlFor="restore-viewer-password-detail">{t("tournamentDetail.nowe_haslo_widza")}</Label>
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
                        <Label htmlFor="restore-support-password-detail">{t("tournamentDetail.nowe_haslo_wsparcia_opcjonalne")}</Label>
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
                          {importPending ? t("tournamentDetail.przywracanie") : t("tournamentDetail.przywroc_turniej")}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setImportPreview(null);
                          setImportError(null);
                          setRestoreOrganizerPassword("");
                          setRestoreViewerPassword("");
                          setRestoreSupportPassword("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}>
                          {t("tournamentDetail.anuluj")}</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>}

          {capabilities.canManageOrganizerSettings && (
            <TabsContent value="game-rules" className="pt-6">
              <TournamentGameConfigPanel tournament={tournament} />
            </TabsContent>
          )}

          {(capabilities.canManageOrganizerSettings || capabilities.canEditPresentation) && (
            <TabsContent value="visuals" className="pt-6">
              <TournamentPresentationPanel tournament={tournament} />
            </TabsContent>
          )}

          {capabilities.canManageOrganizerSettings && (
            <TabsContent value="security" className="pt-6">
              <SecurityPanel
                tournamentId={id}
                hasOrganizerPassword={!!tournament.hasOrganizerPassword}
                onOrganizerPasswordSet={() => refetchTournament()}
              />
              {orgToken && <SupportMembersPanel tournamentId={id} orgToken={orgToken} />}
            </TabsContent>
          )}

          {capabilities.canManageSharing && !!orgToken && (
            <TabsContent value="sharing" className="pt-6">
              <SharingPanel tournament={tournament as any} orgToken={orgToken} />
              {/* #324-L05: optional Discord notifications (organizer only, off by default) */}
              <div className="mt-6"><DiscordPanel tournamentId={tournament.id} /></div>
            </TabsContent>
          )}

          {capabilities.canAccessConducting && (
            <TabsContent value="broadcast" className="pt-6">
              <ExperimentalBroadcastPanel tournament={tournament} matches={matches ?? []} stages={stages ?? []} canFeature={capabilities.canFeatureMatch && (!!orgToken || !!supSession)} experimental={isExperimental} />
            </TabsContent>
          )}

        </Tabs>}
      </div>
    </Layout>
  );
}
