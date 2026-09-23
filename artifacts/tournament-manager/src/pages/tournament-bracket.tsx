import { useRoute } from "wouter";
import {
  useGetTournament,
  useGetTournamentBracket,
  useGetResultsHistory,
  useGetTournamentStandings,
  getGetTournamentQueryKey,
  getGetTournamentBracketQueryKey,
  getGetResultsHistoryQueryKey,
  getGetTournamentStandingsQueryKey,
  getGetDoubleEliminationStageQueryKey,
  getListTournamentStagesQueryKey,
  useGetDoubleEliminationStage,
  useListTournamentStages,
} from "@workspace/api-client-react";
import { BracketView, layoutBracket } from "@/components/bracket-view";
import { DoubleEliminationBracket } from "@/components/double-elimination-bracket";
import { MarvelEliminationStage } from "@/components/marvel-elimination-stage";
import { ForcedHeroBadge } from "@/components/deadlock-game-config";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { RoundRobinView } from "@/components/round-robin-view";
import { Trophy, Maximize2, ZoomIn, ZoomOut, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { usePresentationTheme, resolvePresentationSettings } from "@/lib/presentation-theme";
import { selectPublicStage, publicStageBracket, publicStageLabel } from "@/lib/public-stage";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
};

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;

export default function TournamentBracket() {
  const [, params] = useRoute("/tournaments/:id/bracket");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: tournament } = useGetTournament(id, {
    query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id), refetchInterval: 10000 },
  });

  // Phase-offset enabling: stagger initial fetches after tournament loads so
  // bracket, standings/history, and stages don't all fire in the same render.
  // Phase 1 (0 ms): bracket, stages — Phase 2 (+600 ms): standings, history
  const [fetchPhase, setFetchPhase] = useState(0);
  useEffect(() => {
    if (!tournament) { setFetchPhase(0); return; }
    setFetchPhase(1);
    const t2 = setTimeout(() => setFetchPhase(2), 600);
    return () => { clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!tournament]);

  const { data: tournamentBracket } = useGetTournamentBracket(id, {
    query: {
      enabled: !!id && fetchPhase >= 1 && tournament?.status !== "draft",
      queryKey: getGetTournamentBracketQueryKey(id),
      refetchInterval: 11000,
      staleTime: 10500,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const { data: stages } = useListTournamentStages(id, {
    query: {
      enabled: !!id && fetchPhase >= 1,
      queryKey: getListTournamentStagesQueryKey(id),
      refetchInterval: 13000,
      staleTime: 12500,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const publicStage = selectPublicStage(stages, tournament?.activeStageId);
  const bracket = useMemo(() => publicStageBracket(tournamentBracket, publicStage), [tournamentBracket, publicStage]);
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

  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.75);
  const [showDropLines, setShowDropLines] = useState(true);

  const clampZoom = (z: number) =>
    Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 100) / 100;

  const isSwiss = publicStage?.format === "swiss";
  const isRoundRobin = publicStage?.format === "round_robin";
  const isSingleElimination = publicStage?.format === "single_elimination";
  useEffect(() => {
    setZoom(isSingleElimination ? 1 : 0.75);
  }, [isSingleElimination, publicStage?.id]);

  const { data: swissStandings } = useGetTournamentStandings(id, {
    query: {
      enabled: !!id && isSwiss && stages?.length === 1 && tournament?.status !== "draft" && fetchPhase >= 2,
      queryKey: getGetTournamentStandingsQueryKey(id),
      refetchInterval: 13000,
      staleTime: 12500,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const isDeadlock = tournament?.gameConfig?.gameId === "deadlock";
  // Computed before any early returns so React hooks order is stable.
  const rawPs = (tournament as any)?.presentationSettings as Record<string, unknown> | null | undefined;
  const presentationSettings = resolvePresentationSettings(rawPs as any);
  usePresentationTheme(presentationSettings);

  const { data: history } = useGetResultsHistory(id, {
    query: {
      enabled: isDeadlock && !!id && tournament?.status !== "draft" && fetchPhase >= 2,
      queryKey: getGetResultsHistoryQueryKey(id),
      refetchInterval: 17000,
      staleTime: 16500,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  // Build matchPicksMap: last game's hero per match — shown as small pick icons in bracket
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

  const fitZoom = useCallback(() => {
    if (!canvasRef.current || !bracket?.rounds?.length || !isSingleElimination) return;
    const { width: natW, height: natH } = layoutBracket(bracket);
    const canvas = canvasRef.current;
    const availW = canvas.clientWidth - 32;
    const availH = canvas.clientHeight - 32;
    const z = clampZoom(Math.min(1, availW / natW, availH / natH));
    setZoom(z);
  }, [bracket, isSingleElimination]);
  // Keep readable 100% cards by default; fit is an explicit action, not a
  // polling effect that can magnify an auto-height canvas or shrink the text.

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => clampZoom(z - e.deltaY * 0.001));
    }
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-pulse">
        <Trophy className="w-16 h-16 text-muted-foreground opacity-20" />
      </div>
    );
  }

  return (
    <div className={`${isSingleElimination ? "h-dvh" : "min-h-screen"} min-w-0 max-w-full bg-background text-foreground flex flex-col overflow-hidden`} data-theme={presentationSettings.colorPreset || undefined}>
      {/* Floating navigation stays visible for keyboard and direct-URL users. */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 bg-gradient-to-b from-background/80 to-transparent pointer-events-none">
        <a
          href={`/tournaments/${id}`}
          className="bg-background border border-border px-3 py-1.5 shadow-sm pointer-events-auto rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          ← Wróć do turnieju
        </a>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* UB→LB drop toggle — visible only when DE bracket is active */}
          {!!doubleEliminationStage && (
            <button
              type="button"
              onClick={() => setShowDropLines(v => !v)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                showDropLines
                  ? "bg-background border-border text-muted-foreground hover:text-foreground"
                  : "bg-primary/10 border-primary/50 text-primary"
              }`}
              title="Pokaż / ukryj linie przejść Upper → Lower"
            >
              UB→LB {showDropLines ? "●" : "○"}
            </button>
          )}
          {/* Zoom controls — hidden for Swiss (responsive layout, no transform) */}
          {!isSwiss && <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1 shadow-md">
            <button
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              disabled={zoom <= ZOOM_MIN}
              title="Oddalenie (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="min-w-[44px] text-center text-xs font-mono font-bold text-foreground hover:text-primary transition-colors px-1"
              onClick={fitZoom}
              title="Dopasuj do ekranu"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              disabled={zoom >= ZOOM_MAX}
              title="Przybliżenie (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <button
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              onClick={fitZoom}
              title="Dopasuj do ekranu (Fit)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>}
          <Button
            variant="outline"
            size="icon"
            className="bg-background"
            onClick={() =>
              document.documentElement.requestFullscreen().catch(() => {})
            }
            title="Pełny ekran"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex-none py-5 px-8 flex flex-col items-center justify-center bg-card border-b border-border shadow-md z-10 relative">
        <Trophy className="w-12 h-12 text-primary mb-4 absolute top-8 opacity-10 blur-xl scale-150" />
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative z-10 leading-tight font-deadlock">
          {tournament.name}
        </h1>
        <p className="text-base text-muted-foreground mt-1 font-mono uppercase tracking-widest relative z-10">
          {publicStageLabel(publicStage)} · {marvelStage
            ? "Marvel — Eliminacyjne grupy"
            : (FORMAT_LABELS[publicStage?.format ?? ""] ?? publicStage?.format)}
          {publicStage?.currentRound && publicStage.totalRounds
            ? ` · Runda ${publicStage.currentRound}/${publicStage.totalRounds}`
            : ""}
        </p>
        <div className="relative z-10 mt-2">
          <ForcedHeroBadge gameConfig={tournament.gameConfig} />
        </div>
      </div>

      {/* Bracket / Swiss canvas */}
      <div
        ref={canvasRef}
        className="flex-1 min-h-0 min-w-0 w-full overflow-auto"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        onWheel={handleWheel}
      >
        {tournament.status === "draft" ? (
          <div className="flex items-center justify-center h-full text-2xl text-muted-foreground font-mono">
            Turniej jeszcze nie wystartował.
          </div>
        ) : !publicStage ? (
          <div className="p-8 text-muted-foreground">{stages ? "Brak rozpoczętego etapu." : "Ładowanie etapów…"}</div>
        ) : marvelStage ? (
          <div className="p-8">
            <MarvelEliminationStage
              tournamentId={id}
              stageId={marvelStage.id}
            />
          </div>
        ) : doubleEliminationStage && doubleEliminationQuery.data ? (
          <div className="p-8">
            <DoubleEliminationBracket
              tournamentId={id}
              stageId={doubleEliminationStage.id}
              state={doubleEliminationQuery.data}
              showDropLines={showDropLines}
            />
          </div>
        ) : doubleEliminationStage && doubleEliminationQuery.isPending ? (
          <div className="flex h-full items-center justify-center p-8 text-muted-foreground">Ładowanie drabinki Double Elimination…</div>
        ) : doubleEliminationStage && doubleEliminationQuery.error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-destructive">
            <p>Nie udało się pobrać drabinki Double Elimination.</p>
            <Button type="button" variant="outline" onClick={() => void doubleEliminationQuery.refetch()}>Spróbuj ponownie</Button>
          </div>
        ) : bracket ? (
          isSwiss ? (
            <div className="p-6 md:p-8 min-h-full">
              <SwissRoundsView
                bracket={bracket}
                currentRound={publicStage.currentRound}
                totalRounds={publicStage.totalRounds}
                standings={stages?.length === 1 ? swissStandings : undefined}
              />
            </div>
          ) : isRoundRobin ? (
            <div className="p-8" style={{ minWidth: "100%", minHeight: "100%" }}>
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  display: "inline-block",
                  minWidth: "max-content",
                }}
              >
                <RoundRobinView bracket={bracket} hideStandings />
              </div>
            </div>
          ) : (
            <div className="p-4 min-w-0">
                <BracketView
                  bracket={bracket}
                  scale={zoom}
                  format={publicStage.format}
                  forcedHeroId={
                    tournament.gameConfig?.gameId === "deadlock"
                      ? tournament.gameConfig.config.forcedHeroId
                      : undefined
                  }
                  matchPicksMap={isDeadlock ? matchPicksMap : undefined}
                />
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-2xl text-muted-foreground font-mono animate-pulse">
            Ładowanie drabinki…
          </div>
        )}
      </div>
    </div>
  );
}
