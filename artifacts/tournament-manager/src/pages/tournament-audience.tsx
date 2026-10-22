import { ReadQueryState } from "@/components/read-query-state";
import { Link, useSearchParams } from "wouter";
import {
  useGetTournament,
  useListMatches,
  useListPlayers,
  useGetTournamentStandings,
  useGetTournamentBracket,
  useGetResultsHistory,
  getGetTournamentQueryKey,
  getListMatchesQueryKey,
  getListPlayersQueryKey,
  getGetTournamentStandingsQueryKey,
  getGetTournamentBracketQueryKey,
  getGetResultsHistoryQueryKey,
  getGetDoubleEliminationStageQueryKey,
  getListTournamentStagesQueryKey,
  useGetDoubleEliminationStage,
  useListTournamentStages,
  type Bracket,
  type Match,
  type Player,
  type Standing,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Trophy, Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ViewerLoginModal } from "@/components/viewer-login-modal";
import { useAuth } from "@/context/auth-context";
import { getMgmtFlag } from "@/lib/auth";
import { useVerifiedSupportSession } from "@/hooks/use-tournament-auth";
import { setActiveOrganizerToken, setActiveSupportToken, setActiveViewerToken } from "@workspace/api-client-react";
import { AppLogoLink, RoleHomeLink } from "@/components/app-navigation";
import { BracketView } from "@/components/bracket-view";
import { ForcedHeroBadge } from "@/components/deadlock-game-config";
import type { DeadlockHeroId } from "@workspace/game-catalog";
import { PlayerBansRow, PickIcon } from "@/components/deadlock-bans-display";
import { usePlayerBans, useMatchGamePicks } from "@/lib/deadlock-bans-picks";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { RoundRobinView } from "@/components/round-robin-view";
import { TournamentStagesPanel } from "@/components/tournament-stages-panel";
import { DoubleEliminationBracket } from "@/components/double-elimination-bracket";
import { MarvelEliminationStage } from "@/components/marvel-elimination-stage";
import { selectPublicStage, publicStageBracket, publicStageLabel } from "@/lib/public-stage";
import {
  usePresentationTheme,
  resolvePresentationSettings,
} from "@/lib/presentation-theme";
import { tournamentHref, useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "SZKIC",
  active: "AKTYWNY",
  completed: "ZAKOŃCZONY",
};

type AudienceSection = "live" | "stages" | "matches" | "standings" | "players" | "bracket";

const AUDIENCE_SECTIONS: Array<{ id: AudienceSection; label: string }> = [
  { id: "live", label: "Na żywo" },
  { id: "stages", label: "Etapy" },
  { id: "matches", label: "Mecze" },
  { id: "standings", label: "Tabela" },
  { id: "players", label: "Gracze" },
  { id: "bracket", label: "Drabinka" },
];

const MATCH_STATUS_LABELS: Record<string, string> = {
  pending: "Oczekuje",
  in_progress: "W trakcie",
  completed: "Zakończony",
  postponed: "Przełożony",
  cancelled: "Anulowany",
};

function WinDots({ wins, needed, side }: { wins: number; needed: number; side: "left" | "right" }) {
  const dots = Array.from({ length: needed });
  return (
    <div className={`flex gap-1.5 ${side === "right" ? "flex-row-reverse" : ""}`}>
      {dots.map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i < wins ? "bg-cyan-400 shadow-[0_0_6px_rgba(0,200,255,0.7)]" : "bg-white/15 border border-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function TournamentAudience() {
  const { id, isExperimental } = useTournamentRoute("audience");
  const [searchParams] = useSearchParams();
  // show-drops=0 in the URL hides UB→LB loser-drop connector lines (default: visible)
  const showDropLines = searchParams.get("show-drops") !== "0";
  const { getOrgToken, getSupSession, getViewerTok, storeViewerToken } = useAuth();
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [preparedAuthId, setPreparedAuthId] = useState<number | null>(null);
  const requestedSection = searchParams.get("section");
  const activeSection: AudienceSection = AUDIENCE_SECTIONS.some((section) => section.id === requestedSection)
    ? requestedSection as AudienceSection
    : "live";

  const organizerToken = getOrgToken(id);
  const storedSupportSession = getSupSession(id);
  const { supportSession, isChecking: isSupportChecking } =
    useVerifiedSupportSession(id, organizerToken ? null : storedSupportSession);

  useEffect(() => {
    const viewerToken = getViewerTok(id);
    if (organizerToken) { setActiveOrganizerToken(organizerToken); setActiveSupportToken(null); setActiveViewerToken(null); }
    else if (supportSession) { setActiveSupportToken(supportSession.token); setActiveOrganizerToken(null); setActiveViewerToken(null); }
    else if (viewerToken) { setActiveViewerToken(viewerToken); setActiveOrganizerToken(null); setActiveSupportToken(null); }
    else { setActiveOrganizerToken(null); setActiveSupportToken(null); setActiveViewerToken(null); }
    setPreparedAuthId(isSupportChecking ? null : id);
    return () => {
      setPreparedAuthId(null);
      setActiveOrganizerToken(null); setActiveSupportToken(null); setActiveViewerToken(null);
    };
  }, [id, isSupportChecking, organizerToken, supportSession?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const tournamentQuery = useGetTournament(id, {
    query: { enabled: !!id && preparedAuthId === id, queryKey: getGetTournamentQueryKey(id), refetchInterval: 5000, staleTime: 4500, refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false },
  });

  const { data: tournament, error: tournamentError, refetch: refetchTournament } = tournamentQuery;

  // Phase-offset enabling: stagger initial fetches after tournament loads to avoid
  // request bursts that can trigger 429s. Each phase introduces a 600 ms gap.
  // Phase 1 (0 ms): matches, stages — Phase 2 (+600 ms): bracket
  // Phase 3 (+1200 ms): standings — Phase 4 (+1800 ms): players
  const [fetchPhase, setFetchPhase] = useState(0);
  useEffect(() => {
    if (!tournament) { setFetchPhase(0); return; }
    setFetchPhase(1);
    const t2 = setTimeout(() => setFetchPhase(2), 600);
    const t3 = setTimeout(() => setFetchPhase(3), 1200);
    const t4 = setTimeout(() => setFetchPhase(4), 1800);
    return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!tournament]);

  // Staggered co-prime intervals: matches=6s, stages=7s, bracket=9s, standings=11s, players=13s
  const matchesQuery = useListMatches(id, {
    query: { enabled: !!id && fetchPhase >= 1, queryKey: getListMatchesQueryKey(id), refetchInterval: 6000, staleTime: 5500, refetchOnWindowFocus: false, refetchOnReconnect: false },
  });
  const { data: matches } = matchesQuery;
  const standingsQuery = useGetTournamentStandings(id, {
    query: { enabled: !!id && fetchPhase >= 3, queryKey: getGetTournamentStandingsQueryKey(id), refetchInterval: 11000, staleTime: 10500, refetchOnWindowFocus: false, refetchOnReconnect: false },
  });
  const { data: standings } = standingsQuery;
  const playersQuery = useListPlayers(id, {
    query: { enabled: !!id && fetchPhase >= 4, queryKey: getListPlayersQueryKey(id), refetchInterval: 13000, staleTime: 12500, refetchOnWindowFocus: false, refetchOnReconnect: false },
  });
  const { data: players } = playersQuery;
  const bracketQuery = useGetTournamentBracket(id, {
    query: {
      enabled: !!id && fetchPhase >= 2 && tournament?.status !== "draft",
      queryKey: getGetTournamentBracketQueryKey(id),
      refetchInterval: 9000,
      staleTime: 8500,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const { data: tournamentBracket } = bracketQuery;
  const stagesQuery = useListTournamentStages(id, {
    query: {
      enabled: !!id && fetchPhase >= 1,
      queryKey: getListTournamentStagesQueryKey(id),
      refetchInterval: 7000,
      staleTime: 6500,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const { data: stages } = stagesQuery;
  const hasMultipleStages = (stages?.length ?? 0) > 1;
  const stageScopeUnknown = stages === undefined;
  const standingsInformational = hasMultipleStages || stageScopeUnknown;
  const publicStage = selectPublicStage(stages, tournament?.activeStageId);
  const bracket = publicStageBracket(tournamentBracket, publicStage);
  const doubleEliminationStage = publicStage?.format === "double_elimination" ? publicStage : undefined;
  const marvelStage =
    tournament?.gameConfig?.gameId === "marvel"
      ? publicStage?.format === "group_stage" ? publicStage : undefined
      : undefined;
  const doubleEliminationQuery = useGetDoubleEliminationStage(
    id,
    doubleEliminationStage?.id ?? 0,
    {
      query: {
        enabled: !!id && !!doubleEliminationStage,
        retry: false,
        queryKey: getGetDoubleEliminationStageQueryKey(id, doubleEliminationStage?.id ?? 0),
        refetchInterval: 10000,
        staleTime: 9000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  );

  const accessError = tournamentError as { status?: number; data?: { code?: string } } | null;
  const rawAccessDeniedCode = accessError?.status === 401 || accessError?.status === 403 ? accessError.data?.code : undefined;

  // Latch the access-denied code so that background refetches (which temporarily
  // clear tournamentError while the HTTP request is in-flight) do not cause the
  // password gate to unmount and remount every 4 s.
  // The latch is set whenever the error is present and cleared only when the
  // query actually succeeds (tournament data is available).
  const lockedOutCodeRef = useRef<string | undefined>(undefined);
  if (rawAccessDeniedCode) {
    lockedOutCodeRef.current = rawAccessDeniedCode;
  } else if (tournament) {
    lockedOutCodeRef.current = undefined;
  }
  const accessDeniedCode = lockedOutCodeRef.current;

  // Must be before any early returns so React hooks order stays stable.
  const rawPs = (tournament as any)?.presentationSettings as Record<string, unknown> | null | undefined;
  const presentationSettings = resolvePresentationSettings(rawPs as any);
  usePresentationTheme(presentationSettings);

  // --- Derived data ---
  const winnerName = tournament?.winnerId == null ? undefined
    : players?.find(player => player.id === tournament.winnerId)?.name
      ?? standings?.find(standing => standing.playerId === tournament.winnerId)?.playerName;
  const featuredMatch = tournament?.featuredMatchId
    ? matches?.find((m) => m.id === tournament.featuredMatchId)
    : null;
  const heroMatch = featuredMatch ?? matches?.find((m) => m.status === "in_progress") ?? null;

  const isHeroLive = heroMatch?.status === "in_progress";
  const isHeroDone = heroMatch?.status === "completed";
  const isHeroFeatured = !!featuredMatch && !isHeroLive;

  const bo = heroMatch?.bestOf ?? 1;
  const winsNeeded = Math.ceil(bo / 2);
  const s1 = heroMatch?.score1 ?? 0;
  const s2 = heroMatch?.score2 ?? 0;
  const p1Won = isHeroDone && heroMatch?.winnerId === heroMatch?.player1Id;
  const p2Won = isHeroDone && heroMatch?.winnerId === heroMatch?.player2Id;
  const heroResultLabel = heroMatch?.resultType === "walkover"
    ? "WALKOWER"
    : heroMatch?.resultType === "bye"
      ? "WOLNY LOS"
      : heroMatch?.resultType === "no_contest"
        ? "NO CONTEST"
        : null;

  const isDeadlock = tournament?.gameConfig?.gameId === "deadlock";
  const { data: playerBansData } = usePlayerBans(id, { enabled: isDeadlock && !!id && !!tournament });
  const audienceBansMap = new Map((playerBansData ?? []).map((b) => [b.playerId, b.bannedHeroIds]));
  const { data: heroMatchPicks } = useMatchGamePicks(heroMatch?.id, { enabled: isDeadlock && !!heroMatch?.id });
  const latestPick = isDeadlock && heroMatchPicks && heroMatchPicks.length > 0
    ? [...heroMatchPicks].sort((a, b) => b.gameNumber - a.gameNumber)[0]
    : null;

  const { data: audienceHistory } = useGetResultsHistory(id, {
    query: {
      enabled: isDeadlock && !!id && tournament?.status !== "draft",
      queryKey: getGetResultsHistoryQueryKey(id),
      refetchInterval: 15000,
      staleTime: 14500,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const audienceMatchPicksMap = useMemo(() => {
    const map = new Map<number, { p1HeroId?: string | null; p2HeroId?: string | null }>();
    for (const r of audienceHistory ?? []) {
      if (!r.matchId) continue;
      const picks = (r as any).gamePicks as Array<{ gameNumber: number; player1HeroId: string | null; player2HeroId: string | null }> | undefined;
      if (!picks || picks.length === 0) continue;
      const last = [...picks].sort((a, b) => b.gameNumber - a.gameNumber)[0];
      map.set(r.matchId, { p1HeroId: last.player1HeroId, p2HeroId: last.player2HeroId });
    }
    return map;
  }, [audienceHistory]);

  if (!tournament && accessDeniedCode) {
    const viewerMayLogin = accessDeniedCode === "VIEWER_PASSWORD_REQUIRED";
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <RoleHomeLink
          fallbackHref="/fan"
          fallbackLabel="Wróć do turniejów"
          className="absolute left-4 top-4 text-white/60 hover:text-white focus-visible:ring-cyan-400"
        />
        <Lock className="w-10 h-10 text-white/50" />
        <h1 className="text-xl font-semibold">Turniej prywatny</h1>
        <p className="text-sm text-white/50 max-w-sm">
          {viewerMayLogin ? "Podaj hasło widza, aby otworzyć transmisję." : "Ten turniej nie jest dostępny dla widzów."}
        </p>
        {viewerMayLogin && <Button onClick={() => setShowViewerModal(true)}>Podaj hasło widza</Button>}
        <ViewerLoginModal
          open={showViewerModal}
          onClose={() => setShowViewerModal(false)}
          onCancel={() => setShowViewerModal(false)}
          tournamentId={id}
          tournamentName={`Turniej #${id}`}
          onSuccess={(token) => {
            storeViewerToken(id, token);
            setActiveViewerToken(token);
            setShowViewerModal(false);
            void refetchTournament();
          }}
        />
      </div>
    );
  }

  if (!tournament) return <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-4">
    <ReadQueryState query={tournamentQuery} loadingMessage="Ładowanie turnieju…" errorMessage={(tournamentError as { status?: number } | null)?.status === 404 ? "Nie znaleziono turnieju. Sprawdź adres." : "Nie udało się pobrać turnieju."} />
  </div>;

  const nextMatches = matches
    ?.filter(
      (m) =>
        m.status === "pending" &&
        m.player1Id &&
        m.player2Id &&
        m.id !== heroMatch?.id,
    )
    .slice(0, 5) ?? [];

  const recentResults = matches
    ?.filter((m) => m.status === "completed")
    .slice(-5)
    .reverse() ?? [];

  const topStandings = standings?.slice(0, 8) ?? [];

  const currentRoundMatches = matches?.filter((m) => m.round === tournament?.currentRound) ?? [];

  const hasStandings = topStandings.length > 0;
  const hasNextMatches = nextMatches.length > 0;
  const hasResults = recentResults.length > 0;
  const hasRound = currentRoundMatches.length > 0 && tournament?.status === "active";

  // --- Winner glow color ---
  const heroCardBorder = isHeroLive
    ? "border-cyan-500/50 shadow-[0_0_60px_rgba(0,200,255,0.12)]"
    : isHeroDone
      ? "border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.08)]"
      : "border-white/10";

  return (
    <div
      className={`min-h-screen bg-background text-white flex flex-col select-none overflow-x-hidden ${isExperimental ? "experimental-tournament-public" : ""}`}
      data-theme={presentationSettings.colorPreset || undefined}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(0,200,255,0.04) 0%, transparent 60%), radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 40px 40px",
      }}
    >
      {/* ── TOP BAR ── */}
      <header className="flex-none flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0 px-4 sm:px-6 py-3 border-b border-white/8 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex flex-1 basis-80 items-center gap-2.5 min-w-0">
          <AppLogoLink fallbackHref="/fan" className="text-cyan-400 text-xs uppercase tracking-widest shrink-0" />
          <span className="text-white/20 hidden sm:block">·</span>
          <h1 className={isExperimental ? "min-w-0 flex-1 break-words font-bold text-sm sm:text-base" : "min-w-0 flex-1 font-bold text-sm sm:text-base truncate"} title={tournament?.name}>{tournament?.name ?? "Ładowanie…"}</h1>
          <ForcedHeroBadge gameConfig={tournament?.gameConfig} compact />
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2">
          {tournament?.status && (
            <Badge
              className={`shrink-0 text-[10px] font-bold tracking-wider px-2 ${
                tournament.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : tournament.status === "completed"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-white/10 text-white/40 border-white/10"
              }`}
            >
              {STATUS_LABELS[tournament.status] ?? tournament.status}
            </Badge>
          )}
          {tournament?.currentRound && tournament?.totalRounds && (
            <span className="shrink-0 text-xs text-white/40 font-mono hidden sm:block">
              R{tournament.currentRound}/{tournament.totalRounds}
            </span>
          )}
          {(organizerToken || supportSession || (!!id && getMgmtFlag(id))) && (
            <Link
              href={tournamentHref(id, isExperimental)}
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-[#080d1a]"
              title="Wróć do panelu zarządzania tym turniejem"
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0" />
              <span>Panel organizatora</span>
            </Link>
          )}
          <RoleHomeLink
            fallbackHref="/fan"
            fallbackLabel="Wróć do turniejów"
            className="shrink-0 whitespace-nowrap text-white/60 hover:text-white focus-visible:ring-cyan-400 focus-visible:ring-offset-[#080d1a]"
          />
        </div>
      </header>

      <nav
        aria-label="Sekcje publicznego widoku turnieju"
        className="min-w-0 max-w-full flex-none border-b border-white/8 bg-card/80 px-4 sm:px-6"
      >
        <div className="mx-auto flex min-w-0 w-full max-w-5xl items-center gap-1 overflow-x-auto py-2">
          {AUDIENCE_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const href = section.id === "live"
              ? tournamentHref(id, isExperimental, "/audience")
              : tournamentHref(id, isExperimental, `/audience?section=${section.id}`);
            return (
              <Link
                key={section.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                {section.id === "standings" && standingsInformational ? "Bilans" : section.id === "standings" && tournament?.format === "single_elimination" ? "Bilans" : section.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-6 pb-8 gap-6">

        <ReadQueryState query={tournamentQuery} loadingMessage="Ładowanie turnieju…" errorMessage="Nie udało się pobrać turnieju." />
        {activeSection === "live" && <>
        <ReadQueryState query={matchesQuery} loadingMessage="Ładowanie meczów…" errorMessage="Nie udało się pobrać meczów.">
        <ReadQueryState query={standingsQuery} loadingMessage="Ładowanie klasyfikacji…" errorMessage="Nie udało się pobrać klasyfikacji." />
        <ReadQueryState query={playersQuery} loadingMessage="Ładowanie listy graczy…" errorMessage="Nie udało się pobrać listy graczy." />

        {/* ══ FEATURED / LIVE MATCH ══ */}
        {heroMatch ? (
          <section className="w-full max-w-5xl">
            {/* Status label */}
            <div className="flex items-center justify-center gap-3 mb-5">
              {isHeroLive && (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-black tracking-[0.2em] text-sm uppercase">Na żywo</span>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </>
              )}
              {isHeroFeatured && !isHeroDone && (
                <>
                  <span className="text-cyan-400/60 font-bold tracking-[0.15em] text-xs uppercase">★ Wyróżniony mecz</span>
                </>
              )}
              {isHeroDone && (
                <span className="text-green-400 font-black tracking-[0.15em] text-sm uppercase">Zakończony</span>
              )}
            </div>

            {/* Hero card */}
            <div data-exp-match-state={heroMatch.status} className={`experimental-audience-hero bg-card/80 border rounded-2xl overflow-hidden transition-all duration-500 ${heroCardBorder}`}>
              {/* Match meta */}
              <div className="flex items-center justify-center gap-3 py-3 border-b border-white/6">
                <span className="text-[11px] text-white/35 uppercase tracking-widest font-mono">
                  Runda {heroMatch.round} · Mecz {heroMatch.matchNumber}
                </span>
                {bo > 1 && (
                  <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[11px] font-bold tracking-wider px-2">
                    Best of {bo}
                  </Badge>
                )}
              </div>

              {/* Players + scores */}
              <div className="flex items-stretch px-6 sm:px-10 py-8 sm:py-12 gap-4 sm:gap-8">
                {/* Player 1 */}
                <div className={`flex-1 flex flex-col items-center justify-center gap-3 transition-all ${p1Won ? "opacity-100" : isHeroDone && heroMatch.winnerId ? "opacity-40" : "opacity-100"}`}>
                  <div className={`text-2xl sm:text-4xl lg:text-5xl font-black text-center leading-tight transition-all ${p1Won ? "text-cyan-300" : "text-white"}`}>
                    {heroMatch.player1Name || "TBD"}
                  </div>
                  {isDeadlock && heroMatch.player1Id && ((tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5) > 0 && (
                    <PlayerBansRow bannedHeroIds={audienceBansMap.get(heroMatch.player1Id) ?? []} size={30} maxBans={(tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5} />
                  )}
                  {isDeadlock && latestPick?.player1HeroId && (
                    <div className="flex items-center gap-1">
                      <PickIcon heroId={latestPick.player1HeroId} size={56} />
                    </div>
                  )}
                  <div className={`text-6xl sm:text-8xl lg:text-[7rem] font-black font-mono tabular-nums leading-none transition-all ${
                    p1Won ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(0,200,255,0.5)]" : "text-white"
                  }`}>
                    {heroMatch.resultType === "played" || !isHeroDone ? s1 : "—"}
                  </div>
                  {bo > 1 && (
                    <WinDots wins={s1} needed={winsNeeded} side="left" />
                  )}
                  {p1Won && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/40 text-xs font-bold tracking-widest mt-1">
                      ZWYCIĘZCA
                    </Badge>
                  )}
                </div>

                {/* VS separator */}
                <div className="flex flex-col items-center justify-center shrink-0 gap-2">
                  {heroResultLabel ? (
                    <span className="text-sm sm:text-xl font-black text-yellow-400/70 tracking-widest text-center">{heroResultLabel}</span>
                  ) : (
                    <span className="text-2xl sm:text-4xl font-black text-white/15 tracking-widest">:</span>
                  )}
                </div>

                {/* Player 2 */}
                <div className={`flex-1 flex flex-col items-center justify-center gap-3 transition-all ${p2Won ? "opacity-100" : isHeroDone && heroMatch.winnerId ? "opacity-40" : "opacity-100"}`}>
                  <div className={`text-2xl sm:text-4xl lg:text-5xl font-black text-center leading-tight transition-all ${p2Won ? "text-cyan-300" : "text-white"}`}>
                    {heroMatch.player2Name || "TBD"}
                  </div>
                  {isDeadlock && heroMatch.player2Id && ((tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5) > 0 && (
                    <PlayerBansRow bannedHeroIds={audienceBansMap.get(heroMatch.player2Id) ?? []} size={30} maxBans={(tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5} />
                  )}
                  {isDeadlock && latestPick?.player2HeroId && (
                    <div className="flex items-center gap-1">
                      <PickIcon heroId={latestPick.player2HeroId} size={56} />
                    </div>
                  )}
                  <div className={`text-6xl sm:text-8xl lg:text-[7rem] font-black font-mono tabular-nums leading-none transition-all ${
                    p2Won ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(0,200,255,0.5)]" : "text-white"
                  }`}>
                    {heroMatch.resultType === "played" || !isHeroDone ? s2 : "—"}
                  </div>
                  {bo > 1 && (
                    <WinDots wins={s2} needed={winsNeeded} side="right" />
                  )}
                  {p2Won && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/40 text-xs font-bold tracking-widest mt-1">
                      ZWYCIĘZCA
                    </Badge>
                  )}
                </div>
              </div>

              {heroResultLabel && (
                <div className="py-2 bg-yellow-500/10 border-t border-yellow-500/20 text-center text-sm text-yellow-400 font-bold tracking-widest">
                  {heroResultLabel}{heroMatch.resultReason ? ` · ${heroMatch.resultReason}` : ""}
                </div>
              )}
            </div>
          </section>
        ) : tournament?.status === "completed" ? (
          /* ── TOURNAMENT COMPLETE STATE ── */
          <section className="w-full max-w-2xl">
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,200,0,0.4)]" />
              <h2 className="text-4xl sm:text-5xl font-black text-yellow-400 tracking-tight">Turniej zakończony!</h2>
              {winnerName && (
                <div className="mt-2 text-xl text-white/60">
                  Zwycięzca:{" "}
                  <span className="text-white font-black text-2xl">{winnerName}</span>
                </div>
              )}
              <Badge className="mt-2 bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-sm px-4 py-1">
                {FORMAT_LABELS[tournament.format] ?? tournament.format}
              </Badge>
            </div>
          </section>
        ) : (
          /* ── BREAK STATE ── */
          <section className="w-full max-w-lg">
            <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <div className="w-20 h-20 rounded-full border-2 border-white/15 flex items-center justify-center bg-white/5">
                <span className="text-4xl">⏸</span>
              </div>
              <h2 className="text-3xl font-bold text-white/50 tracking-tight">Przerwa</h2>
              <p className="text-white/30">Mecze wznowią się wkrótce</p>
              {tournament?.currentRound && tournament?.totalRounds && (
                <Badge className="bg-white/5 text-white/40 border-white/10">
                  Runda {tournament.currentRound}/{tournament.totalRounds}
                </Badge>
              )}
            </div>
          </section>
        )}

        {/* ══ BOTTOM PANELS ══ */}
        {(hasNextMatches || hasResults || hasStandings || hasRound) && (
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* ── KOLEJNE MECZE ── */}
            {hasNextMatches && (
              <Panel title="Kolejne mecze" className={!hasResults && !hasStandings ? "lg:col-span-3" : !hasResults || !hasStandings ? "lg:col-span-2" : ""}>
                <div className="space-y-2.5">
                  {nextMatches.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25 font-mono w-10 shrink-0">R{m.round}M{m.matchNumber}</span>
                      <span className="text-sm font-semibold text-white/80 flex-1 truncate">{m.player1Name}</span>
                      <span className="text-[10px] text-white/30 shrink-0">vs</span>
                      <span className="text-sm font-semibold text-white/80 flex-1 truncate text-right">{m.player2Name}</span>
                      {m.bestOf && m.bestOf > 1 && (
                        <span className="text-[10px] text-cyan-500/50 shrink-0 font-mono">BO{m.bestOf}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* ── OSTATNIE WYNIKI ── */}
            {hasResults && (
              <Panel title="Ostatnie wyniki">
                <div className="space-y-2.5">
                  {recentResults.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25 font-mono w-10 shrink-0">R{m.round}M{m.matchNumber}</span>
                      <span className={`text-sm flex-1 truncate ${m.winnerId === m.player1Id ? "font-bold text-white" : "text-white/40"}`}>
                        {m.player1Name}
                      </span>
                      <span className="font-mono text-sm font-bold text-white/70 bg-white/6 px-2 py-0.5 rounded shrink-0 tabular-nums">
                        {m.resultType === "played" ? `${m.score1}:${m.score2}` : m.resultType === "walkover" ? "W.O." : m.resultType === "bye" ? "BYE" : "N/C"}
                      </span>
                      <span className={`text-sm flex-1 truncate text-right ${m.winnerId === m.player2Id ? "font-bold text-white" : "text-white/40"}`}>
                        {m.player2Name}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* ── KLASYFIKACJA ── */}
            {hasStandings && (
              <Panel title={hasMultipleStages ? "Bilans łączny meczów — wszystkie etapy" : stageScopeUnknown ? "Bilans informacyjny — zakres etapów niepotwierdzony" : "Klasyfikacja"} className={!hasNextMatches && !hasResults ? "lg:col-span-3" : ""}>
                {standingsInformational && (
                  <p className="mb-3 text-xs text-white/55">
                    {hasMultipleStages ? "To zbiorcze statystyki meczów, nie klasyfikacja etapu. Awans i zwycięzcę wyznaczają wyniki etapów — zobacz Etapy i Drabinka." : "Liczba etapów nie została potwierdzona. Ten bilans nie jest podstawą awansu ani wyłonienia zwycięzcy."}
                  </p>
                )}
                <div className="space-y-2">
                  {topStandings.map((s) => (
                    <div key={s.playerId} className="flex items-center gap-2.5">
                      {!standingsInformational && (
                        <>
                          <span className={`font-mono font-black text-sm w-5 text-right shrink-0 ${
                            s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-slate-400" : s.rank === 3 ? "text-amber-600" : "text-white/25"
                          }`}>
                            {s.rank}
                          </span>
                          {s.rank <= 3 && (
                            <span className="text-xs shrink-0">{s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : "🥉"}</span>
                          )}
                        </>
                      )}
                      <span className="text-sm font-semibold flex-1 truncate">{s.playerName}</span>
                      <div className="flex items-center gap-2 text-xs text-white/40 shrink-0">
                        <span className="font-mono">{s.matchWins}W {s.matchLosses}L</span>
                        <span className="font-bold text-cyan-400">{s.gameWins}:{s.gameLosses}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* ── RUNDA (round summary for active tournaments) ── */}
            {hasRound && !hasNextMatches && !hasResults && !hasStandings && (
              <Panel title={`Runda ${tournament?.currentRound} — przebieg`} className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentRoundMatches.map((m) => (
                    <div key={m.id} data-exp-match-state={m.status} className={`experimental-audience-match-row flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      m.status === "in_progress"
                        ? "border-cyan-500/30 bg-cyan-500/5"
                        : m.status === "completed"
                          ? "border-green-500/20 bg-green-500/5"
                          : m.status === "postponed"
                            ? "border-orange-500/20 bg-orange-500/5"
                            : "border-white/8 bg-white/3"
                    }`}>
                      <span className={`text-sm font-bold flex-1 truncate ${m.winnerId === m.player1Id ? "text-cyan-300" : "text-white/70"}`}>
                        {m.player1Name}
                      </span>
                      <span className="font-mono text-sm font-bold text-white/50 shrink-0 tabular-nums px-1">
                        {m.status === "completed" || m.status === "in_progress" ? `${m.score1}:${m.score2}` : "vs"}
                      </span>
                      <span className={`text-sm font-bold flex-1 truncate text-right ${m.winnerId === m.player2Id ? "text-cyan-300" : "text-white/70"}`}>
                        {m.player2Name}
                      </span>
                      <StatusDot status={m.status} />
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* Format label at the very bottom */}
        {tournament?.format && (
          <p className="text-[11px] text-white/15 uppercase tracking-widest font-mono mt-2">
            {FORMAT_LABELS[tournament.format] ?? tournament.format}
          </p>
        )}
        </ReadQueryState>
        </>}

        {activeSection === "stages" && tournament && (
          <TournamentStagesPanel
            tournamentId={id}
            tournamentStatus={tournament.status}
            activeStageId={tournament.activeStageId}
            matches={matches ?? []}
            gameConfig={tournament.gameConfig}
            audience
          />
        )}
        {activeSection === "matches" && <ReadQueryState query={matchesQuery} loadingMessage="Ładowanie meczów…" errorMessage="Nie udało się pobrać meczów."><PublicMatchesSection matches={matches ?? []} /></ReadQueryState>}
        {activeSection === "standings" && <ReadQueryState query={standingsQuery} loadingMessage="Ładowanie klasyfikacji…" errorMessage="Nie udało się pobrać klasyfikacji."><PublicStandingsSection standings={standings ?? []} format={tournament?.format ?? "single_elimination"} aggregate={hasMultipleStages} unknownScope={stageScopeUnknown} /></ReadQueryState>}
        {activeSection === "players" && (
          <ReadQueryState query={playersQuery} loadingMessage="Ładowanie listy graczy…" errorMessage="Nie udało się pobrać listy graczy.">
          <ReadQueryState query={standingsQuery} loadingMessage="Ładowanie statystyk graczy…" errorMessage="Nie udało się pobrać statystyk graczy." />
          <PublicPlayersSection
            players={players ?? []}
            standings={standings}
            playerBansMap={isDeadlock ? audienceBansMap : undefined}
            isDeadlock={isDeadlock}
            bansPerPlayer={(tournament?.gameConfig as any)?.config?.bansPerPlayer ?? 5}
          />
          </ReadQueryState>
        )}
        {activeSection === "bracket" && <ReadQueryState query={stagesQuery} loadingMessage="Ładowanie etapów…" errorMessage="Nie udało się pobrać etapów.">
          {!publicStage ? (
            <AudienceSectionShell title="Drabinka" description={stages ? "Brak rozpoczętego etapu." : "Ładowanie etapów…"}><EmptyAudienceSection>Drabinka nie jest jeszcze dostępna.</EmptyAudienceSection></AudienceSectionShell>
          ) : marvelStage ? (
            <AudienceSectionShell
              title="Drabinka"
              description={publicStageLabel(publicStage)}
            >
              <div className="rounded-xl border border-white/8 bg-card p-4 text-foreground">
                <MarvelEliminationStage
                  tournamentId={id}
                  stageId={marvelStage.id}
                />
              </div>
            </AudienceSectionShell>
          ) : doubleEliminationStage ? (
            <AudienceSectionShell
              title="Drabinka"
              description={publicStageLabel(publicStage)}
            >
              <ReadQueryState query={doubleEliminationQuery} loadingMessage="Ładowanie drabinki Double Elimination…" errorMessage="Nie udało się pobrać drabinki Double Elimination.">
                {doubleEliminationQuery.data && <div className="rounded-xl border border-white/8 bg-card p-4 text-foreground">
                  <DoubleEliminationBracket tournamentId={id} stageId={doubleEliminationStage.id} state={doubleEliminationQuery.data} showDropLines={showDropLines} />
                </div>}
              </ReadQueryState>
            </AudienceSectionShell>
          ) : (
            <ReadQueryState query={bracketQuery} loadingMessage="Ładowanie drabinki…" errorMessage="Nie udało się pobrać drabinki.">
            <PublicBracketSection
              bracket={bracket}
              stageLabel={publicStageLabel(publicStage)}
              format={publicStage.format}
              currentRound={publicStage.currentRound}
              totalRounds={publicStage.totalRounds}
              forcedHeroId={
                tournament?.gameConfig?.gameId === "deadlock"
                  ? tournament.gameConfig.config.forcedHeroId
                  : undefined
              }
              playerBansMap={isDeadlock ? audienceBansMap : undefined}
              matchPicksMap={isDeadlock ? audienceMatchPicksMap : undefined}
              standings={stages?.length === 1 ? standings : undefined}
            />
            </ReadQueryState>
          )}
        </ReadQueryState>}
      </main>
    </div>
  );
}

// ── Sub-components ──

function AudienceSectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="experimental-audience-section-shell w-full max-w-5xl" aria-label={title}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyAudienceSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="experimental-audience-empty-state rounded-xl border border-dashed border-white/15 bg-white/3 px-6 py-14 text-center text-sm text-white/40">
      {children}
    </div>
  );
}

function PublicMatchesSection({ matches }: { matches: Match[] }) {
  return (
    <AudienceSectionShell title="Mecze" description="Pełny harmonogram i wyniki wszystkich rund.">
      {matches.length === 0 ? (
        <EmptyAudienceSection>Brak meczów do wyświetlenia.</EmptyAudienceSection>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => {
            const showsScore = match.score1 != null || match.score2 != null;
            return (
              <article key={match.id} data-exp-match-state={match.status} className="experimental-public-match-card grid min-w-0 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-card px-3 py-2.5 md:px-4">
                <div className="min-w-0 text-xs">
                  <span className="font-mono text-white/35">Runda {match.round} · Mecz {match.matchNumber}</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 text-xs md:col-start-3 md:row-start-1">
                  {match.bestOf && match.bestOf > 1 && <span className="font-mono text-cyan-400/60">BO{match.bestOf}</span>}
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/55">
                    {MATCH_STATUS_LABELS[match.status] ?? match.status}
                  </span>
                </div>
                <div className="col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 md:col-span-1 md:col-start-2 md:row-start-1 md:gap-3">
                  <span title={match.player1Name || "TBD"} className={`truncate text-right font-semibold ${match.winnerId === match.player1Id ? "text-cyan-300" : "text-white/75"}`}>
                    {match.player1Name || "TBD"}
                  </span>
                  <span className="min-w-12 rounded-md bg-black/20 px-2 py-1 text-center font-mono font-bold tabular-nums text-white">
                    {showsScore ? `${match.score1 ?? 0}:${match.score2 ?? 0}` : "vs"}
                  </span>
                  <span title={match.player2Name || "TBD"} className={`truncate font-semibold ${match.winnerId === match.player2Id ? "text-cyan-300" : "text-white/75"}`}>
                    {match.player2Name || "TBD"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AudienceSectionShell>
  );
}

function PublicStandingsSection({ standings, format, aggregate, unknownScope }: { standings: Standing[]; format: string; aggregate: boolean; unknownScope: boolean }) {
  return (
    <AudienceSectionShell
      title={aggregate ? "Bilans łączny meczów — wszystkie etapy" : unknownScope ? "Bilans informacyjny — zakres etapów niepotwierdzony" : format === "single_elimination" ? "Bilans informacyjny" : "Klasyfikacja"}
      description={aggregate ? "Zbiorczy bilans meczów, nie klasyfikacja etapu. Awans i zwycięzcę wyznaczają wyniki etapów — zobacz Etapy i Drabinka." : unknownScope ? "Liczba etapów nie została potwierdzona. Ten bilans nie jest podstawą awansu ani wyłonienia zwycięzcy." : format === "single_elimination" ? "Awans wynika wyłącznie z drabinki; bilans służy informacyjnie." : "Klasyfikacja obliczana z rozstrzygniętych meczów."}
    >
      {standings.length === 0 ? (
        <EmptyAudienceSection>Tabela nie jest jeszcze dostępna.</EmptyAudienceSection>
      ) : format === "single_elimination" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {standings.map((standing) => (
            <div key={standing.playerId} className="experimental-public-standing-card rounded-xl border border-white/8 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{standing.playerName}</div>
                  <div className="text-xs text-white/40">{standing.teamName || "Uczestnik"}</div>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/45">{standing.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider text-white/35">
                <div><strong className="block text-lg text-white">{standing.matchWins}-{standing.matchLosses}</strong>Mecze</div>
                <div><strong className="block text-lg text-white">{standing.gameWins}:{standing.gameLosses}</strong>Gry</div>
                <div><strong className="block text-lg text-cyan-300">{standing.gameDiff > 0 ? "+" : ""}{standing.gameDiff}</strong>Różnica</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/8 bg-card">
          <table className="w-full min-w-[680px] text-sm" aria-label={aggregate ? "Bilans łączny meczów ze wszystkich etapów" : unknownScope ? "Bilans informacyjny przy niepotwierdzonej liczbie etapów" : "Pełna klasyfikacja turnieju"}>
            <thead className="border-b border-white/8 bg-white/3 text-left text-[11px] uppercase tracking-wider text-white/35">
              <tr>
                {!aggregate && !unknownScope && <th className="px-4 py-3 text-center">Miejsce</th>}
                <th className="px-4 py-3">Gracz</th>
                <th className="px-4 py-3">Drużyna</th>
                <th className="px-3 py-3 text-center">Mecze</th>
                <th className="px-3 py-3 text-center">W</th>
                <th className="px-3 py-3 text-center">P</th>
                <th className="px-4 py-3 text-right">Bilans gier</th>
                <th className="px-4 py-3 text-right">+/−</th>
                <th className="px-4 py-3 text-right">Buchholz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {standings.map((standing) => (
                <tr key={standing.playerId} className="text-white/70">
                  {!aggregate && !unknownScope && <td className="px-4 py-3 text-center font-mono font-bold text-cyan-300">{standing.rank}</td>}
                  <td className="px-4 py-3 font-semibold text-white">{standing.playerName}</td>
                  <td className="px-4 py-3 text-white/45">{standing.teamName || "—"}</td>
                  <td className="px-3 py-3 text-center font-mono">{standing.matchesPlayed}</td>
                  <td className="px-3 py-3 text-center font-mono">{standing.matchWins}</td>
                  <td className="px-3 py-3 text-center font-mono">{standing.matchLosses}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-cyan-300">{standing.gameWins}:{standing.gameLosses}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/45">{standing.gameDiff > 0 ? "+" : ""}{standing.gameDiff}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/45">{standing.buchholz ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AudienceSectionShell>
  );
}

function PublicPlayersSection({
  players,
  standings,
  playerBansMap,
  isDeadlock,
  bansPerPlayer = 5,
}: {
  players: Player[];
  standings: Standing[] | undefined;
  playerBansMap?: Map<number, string[]>;
  isDeadlock?: boolean;
  bansPerPlayer?: number;
}) {
  return (
    <AudienceSectionShell title="Gracze" description="Publiczna lista uczestników i ich aktualne statystyki.">
      {players.length === 0 ? (
        <EmptyAudienceSection>Nie dodano jeszcze uczestników.</EmptyAudienceSection>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {players.map((player) => {
            const standing = standings?.find((entry) => entry.playerId === player.id);
            const bans = playerBansMap?.get(player.id) ?? [];
            return (
              <article key={player.id} className="experimental-public-player-card rounded-xl border border-white/8 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{player.name}</h3>
                    {player.teamName && <p className="mt-0.5 truncate text-xs text-white/40">{player.teamName}</p>}
                  </div>
                  {player.seed != null && <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40">#{player.seed}</span>}
                </div>
                {standings !== undefined && <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-white/6 pt-3 text-center">
                  <PlayerStat label="Mecze" value={standing?.matchesPlayed ?? 0} />
                  <PlayerStat label="W" value={standing?.matchWins ?? 0} />
                  <PlayerStat label="P" value={standing?.matchLosses ?? 0} />
                  <PlayerStat label="Gry +/-" value={standing?.gameDiff ?? 0} emphasize />
                </dl>}
                {isDeadlock && bansPerPlayer > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/6">
                    {bans.length > 0 ? (
                      <PlayerBansRow bannedHeroIds={bans} size={30} maxBans={bansPerPlayer} />
                    ) : (
                      <p className="text-xs text-white/30 italic">Brak banów</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AudienceSectionShell>
  );
}

function PlayerStat({ label, value, emphasize = false }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-white/30">{label}</dt>
      <dd className={`mt-1 font-mono text-sm font-bold ${emphasize ? "text-cyan-300" : "text-white/70"}`}>{value}</dd>
    </div>
  );
}

function PublicBracketSection({
  bracket,
  stageLabel,
  format,
  currentRound,
  totalRounds,
  forcedHeroId,
  playerBansMap,
  matchPicksMap,
  standings,
}: {
  bracket?: Bracket;
  stageLabel: string;
  format: string;
  currentRound?: number | null;
  totalRounds?: number | null;
  forcedHeroId?: DeadlockHeroId;
  playerBansMap?: Map<number, string[]>;
  matchPicksMap?: Map<number, { p1HeroId?: string | null; p2HeroId?: string | null }>;
  standings?: Standing[];
}) {
  return (
    <AudienceSectionShell title="Drabinka" description={stageLabel}>
      {!bracket ? (
        <EmptyAudienceSection>Drabinka nie jest jeszcze dostępna.</EmptyAudienceSection>
      ) : (
        <div className="experimental-public-bracket-surface overflow-x-auto rounded-xl border border-white/8 bg-card p-4 text-foreground">
          {format === "swiss" ? (
            <SwissRoundsView bracket={bracket} currentRound={currentRound} totalRounds={totalRounds} standings={standings} />
          ) : format === "round_robin" ? (
            <RoundRobinView bracket={bracket} hideStandings />
          ) : (
            <BracketView
              bracket={bracket}
              format={format}
              forcedHeroId={forcedHeroId}
              playerBansMap={playerBansMap}
              matchPicksMap={matchPicksMap}
            />
          )}
        </div>
      )}
    </AudienceSectionShell>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-exp-panel-title={title} className={`experimental-audience-panel bg-card/80 border border-white/8 rounded-xl p-4 ${className}`}>
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "in_progress") {
    return <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />;
  }
  if (status === "completed") {
    return <div className="w-2 h-2 rounded-full bg-green-500/60 shrink-0" />;
  }
  if (status === "postponed") {
    return <div className="w-2 h-2 rounded-full bg-orange-500/60 shrink-0" />;
  }
  return <div className="w-2 h-2 rounded-full bg-white/15 shrink-0" />;
}
