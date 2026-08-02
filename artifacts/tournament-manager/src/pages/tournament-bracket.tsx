import { useRoute } from "wouter";
import {
  useGetTournament,
  useGetTournamentBracket,
  getGetTournamentQueryKey,
  getGetTournamentBracketQueryKey,
} from "@workspace/api-client-react";
import { BracketView, bracketNaturalSize } from "@/components/bracket-view";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { RoundRobinView } from "@/components/round-robin-view";
import { Trophy, Maximize2, ZoomIn, ZoomOut, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useCallback, useEffect } from "react";
import { RoleHomeLink } from "@/components/app-navigation";

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
    query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id) },
  });
  const { data: bracket } = useGetTournamentBracket(id, {
    query: {
      enabled: !!id && tournament?.status !== "draft",
      queryKey: getGetTournamentBracketQueryKey(id),
      refetchInterval: 10000,
    },
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.75);

  const clampZoom = (z: number) =>
    Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) * 100) / 100;

  const isSwiss = tournament?.format === "swiss";
  const isRoundRobin = tournament?.format === "round_robin";

  const fitZoom = useCallback(() => {
    if (!canvasRef.current || !bracket?.rounds?.length || isSwiss || isRoundRobin) return;
    const r1Matches = bracket.rounds[0]?.matches?.length ?? 1;
    const { width: natW, height: natH } = bracketNaturalSize(
      bracket.rounds.length,
      r1Matches
    );
    const canvas = canvasRef.current;
    const availW = canvas.clientWidth - 64;
    const availH = canvas.clientHeight - 64;
    const z = clampZoom(Math.min(availW / natW, availH / natH));
    setZoom(z);
  }, [bracket, isSwiss]);

  useEffect(() => {
    if (bracket) fitZoom();
  }, [bracket, fitZoom]);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Floating navigation stays visible for keyboard and direct-URL users. */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 bg-gradient-to-b from-background/80 to-transparent pointer-events-none">
        <RoleHomeLink
          fallbackHref="/fan"
          fallbackLabel="Wróć do turniejów"
          className="bg-background border border-border px-3 py-1.5 shadow-sm pointer-events-auto"
        />

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1 shadow-md">
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
          </div>
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
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative z-10 leading-tight">
          {tournament.name}
        </h1>
        <p className="text-base text-muted-foreground mt-1 font-mono uppercase tracking-widest relative z-10">
          {FORMAT_LABELS[tournament.format] ?? tournament.format}
          {tournament.currentRound && tournament.totalRounds
            ? ` · Runda ${tournament.currentRound}/${tournament.totalRounds}`
            : ""}
        </p>
      </div>

      {/* Bracket / Swiss canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto"
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
        ) : bracket ? (
          isSwiss ? (
            <div className="p-8" style={{ minWidth: "100%", minHeight: "100%" }}>
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  display: "inline-block",
                  minWidth: "max-content",
                }}
              >
                <SwissRoundsView
                  bracket={bracket}
                  currentRound={tournament.currentRound}
                  totalRounds={tournament.totalRounds}
                />
              </div>
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
            <div className="p-8 inline-block" style={{ minWidth: "100%", minHeight: "100%" }}>
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  display: "inline-block",
                }}
              >
                <BracketView bracket={bracket} format={tournament.format} />
              </div>
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
