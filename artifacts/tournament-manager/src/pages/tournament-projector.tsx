import { ReadQueryState } from "@/components/read-query-state";
/**
 * /tournaments/:id/projector
 *
 * Clean OBS Browser Source page — no nav, no management UI.
 * Read-only, works without an organizer session (public tournament access).
 *
 * URL params:
 *   preset        = classic | dark-minimal | deadlock | neon
 *   transparent   = 1   → transparent background (for OBS chroma/alpha)
 *   compact       = 1   → tighter card spacing
 *   finals        = upper | between   (Grand Final position)
 *   zoom          = 0.8              (CSS scale applied to bracket)
 *   padding       = 20              (px around bracket)
 *   hide-header   = 1   → hide tournament name header
 *   hide-empty    = 1   → future: hide TBD matches
 *   connector-color = hsl(0 0% 50%)  (CSS colour for connector lines)
 *   connector-width = 1.5
 *   aspect        = 169 → force 16:9 container (1920×1080 viewport)
 */

import { useSearch } from "wouter";
import {
  useGetTournament,
  useGetDoubleEliminationStage,
  useListTournamentStages,
  useGetTournamentBracket,
  getGetTournamentBracketQueryKey,
  getGetTournamentQueryKey,
  getGetDoubleEliminationStageQueryKey,
  getListTournamentStagesQueryKey,
  setActiveOrganizerToken,
  setActiveSupportToken,
  setActiveViewerToken,
} from "@workspace/api-client-react";
import { useEffect, useMemo } from "react";
import { Trophy } from "lucide-react";
import { usePresentationTheme, resolvePresentationSettings } from "@/lib/presentation-theme";
import { DEBracketCanvas } from "@/components/de-bracket-canvas";
import { BracketView } from "@/components/bracket-view";
import { RoundRobinView } from "@/components/round-robin-view";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { MarvelEliminationStage } from "@/components/marvel-elimination-stage";
import { selectPublicStage, publicStageBracket, publicStageLabel } from "@/lib/public-stage";
import { useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";

// ─── Preset definitions ───────────────────────────────────────────────────────

const PRESETS: Record<string, React.CSSProperties & { "--connector-color"?: string; "--connector-width"?: string }> = {
  classic: {
    background: "hsl(222 20% 8%)",
    color: "hsl(0 0% 90%)",
  },
  "dark-minimal": {
    background: "hsl(0 0% 4%)",
    color: "hsl(0 0% 85%)",
  },
  deadlock: {
    background: "hsl(222 35% 6%)",
    color: "hsl(190 80% 90%)",
  },
  neon: {
    background: "hsl(260 30% 5%)",
    color: "hsl(160 100% 80%)",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TournamentProjector() {
  const { id, isExperimental } = useTournamentRoute("projector");
  const search = useSearch();

  // Parse URL params
  const sp = useMemo(() => new URLSearchParams(search), [search]);
  const preset = sp.get("preset") ?? "classic";
  const transparent = sp.get("transparent") === "1";
  const compact = sp.get("compact") === "1";
  const finalsParam = sp.get("finals");
  const finalsPosition: "upper" | "between" =
    finalsParam === "between" ? "between" : "upper";
  const zoom = parseFloat(sp.get("zoom") ?? "1") || 1;
  const padding = parseInt(sp.get("padding") ?? "24", 10);
  const hideHeader = sp.get("hide-header") === "1";
  const connectorColor = sp.get("connector-color") ?? undefined;
  const connectorWidth = parseFloat(sp.get("connector-width") ?? "1") || 1;
  const forceAspect = sp.get("aspect") === "169";
  // show-drops=0 hides UB→LB loser-drop connector lines; default on
  const showDropLines = sp.get("show-drops") !== "0";

  // No auth tokens — projector is read-only public access
  useEffect(() => {
    setActiveOrganizerToken(null);
    setActiveSupportToken(null);
    setActiveViewerToken(null);
  }, []);

  const tournamentQuery = useGetTournament(id, {
    query: {
      enabled: !!id,
      queryKey: getGetTournamentQueryKey(id),
      refetchInterval: 10000,
      retry: false,
    },
  });
  const { data: tournament } = tournamentQuery;

  const stagesQuery = useListTournamentStages(id, {
    query: {
      enabled: !!id && !!tournament,
      queryKey: getListTournamentStagesQueryKey(id),
      refetchInterval: 10000,
    },
  });
  const { data: stages } = stagesQuery;

  const publicStage = selectPublicStage(stages, tournament?.activeStageId);
  const deStage = publicStage?.format === "double_elimination" ? publicStage : undefined;
  const marvelStage = tournament?.gameConfig?.gameId === "marvel" && publicStage?.format === "group_stage" ? publicStage : undefined;
  const bracketQuery = useGetTournamentBracket(id, {
    query: {
      enabled: !!id && !!publicStage && !deStage && !marvelStage,
      queryKey: getGetTournamentBracketQueryKey(id),
      refetchInterval: 10000,
      refetchOnWindowFocus: false,
    },
  });
  const bracket = publicStageBracket(bracketQuery.data, publicStage);

  const deQuery = useGetDoubleEliminationStage(
    id,
    deStage?.id ?? 0,
    {
      query: {
        enabled: !!id && !!deStage,
        retry: false,
        queryKey: getGetDoubleEliminationStageQueryKey(id, deStage?.id ?? 0),
        refetchInterval: 10000,
        staleTime: 9000,
        refetchOnWindowFocus: false,
      },
    },
  );
  const deState = deQuery.data;

  // Apply presentation settings (color preset / font preset / frame)
  const rawPs = (tournament as any)?.presentationSettings as Record<string, unknown> | null | undefined;
  const presentationSettings = resolvePresentationSettings(rawPs as any);
  // Override colorPreset with URL param if provided
  const effectiveSettings = { ...presentationSettings, colorPreset: preset !== "classic" ? preset : (presentationSettings.colorPreset ?? null) };
  usePresentationTheme(effectiveSettings);

  const participants = useMemo(
    () =>
      new Map(
        (deState?.participants ?? []).map(p => [p.participantKey, p]),
      ),
    [deState],
  );

  // Preset style
  const presetStyle = PRESETS[preset] ?? PRESETS["classic"];

  // Container style
  const containerStyle: React.CSSProperties = {
    ...(transparent
      ? { background: "transparent" }
      : presetStyle),
    color: presetStyle.color,
    minHeight: "100dvh",
    position: "relative",
    overflow: "hidden",
  };

  if (forceAspect) {
    containerStyle.width = "1920px";
    containerStyle.height = "1080px";
    containerStyle.minHeight = "unset";
    containerStyle.transform = `scale(${zoom})`;
    containerStyle.transformOrigin = "top left";
  }

  if (!tournament) {
    return <div className="min-h-dvh text-foreground flex items-center justify-center p-4" style={transparent ? {} : { background: presetStyle.background as string }}>
      <ReadQueryState query={tournamentQuery} loadingMessage="Ładowanie turnieju…" errorMessage={(tournamentQuery.error as { status?: number } | null)?.status === 404 ? "Nie znaleziono turnieju. Sprawdź adres." : "Nie udało się pobrać turnieju."} />
    </div>;
  }

  return (
    <div className={isExperimental ? "experimental-projector-view" : undefined} data-exp-format={isExperimental ? publicStage?.format ?? "unknown" : undefined} data-exp-tournament-status={isExperimental ? tournament.status : undefined} data-exp-preset={isExperimental ? preset : undefined} style={containerStyle} data-theme={effectiveSettings.colorPreset ?? undefined}>
      <ReadQueryState query={tournamentQuery} loadingMessage="Ładowanie turnieju…" errorMessage="Nie udało się pobrać turnieju." />
      {/* Optional tournament header */}
      {!hideHeader && (
        <div
          className="experimental-projector-header flex flex-col items-center justify-center gap-1 border-b border-white/10"
          style={{ padding: `${Math.round(padding * 0.6)}px ${padding}px` }}
        >
          <h1
            className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent font-deadlock"
            style={{ fontSize: compact ? "1.5rem" : "2rem", lineHeight: 1.1 }}
          >
            {tournament.name}
          </h1>
          {publicStage && (
            <p
              className="font-mono uppercase tracking-widest text-muted-foreground"
              style={{ fontSize: compact ? "0.6rem" : "0.7rem" }}
            >
              {publicStageLabel(publicStage)}
              {publicStage.currentRound && publicStage.totalRounds ? ` · Runda ${publicStage.currentRound}/${publicStage.totalRounds}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Bracket canvas */}
      <div
        className="experimental-projector-canvas"
        style={{
          padding,
          ...(forceAspect ? {} : { transform: `scale(${zoom})`, transformOrigin: "top left" }),
        }}
      >
        <ReadQueryState query={stagesQuery} loadingMessage="Ładowanie etapów…" errorMessage="Nie udało się pobrać etapów.">
        {!publicStage ? (
          <p className="py-20 text-center text-muted-foreground">Brak rozpoczętego etapu.</p>
        ) : marvelStage ? (
          <MarvelEliminationStage tournamentId={id} stageId={marvelStage.id} />
        ) : deStage ? (
          <ReadQueryState query={deQuery} loadingMessage="Ładowanie drabinki Double Elimination…" errorMessage="Nie udało się pobrać drabinki Double Elimination.">
            {deState && <DEBracketCanvas
              matches={deState.matches}
              participants={participants}
              finalsPosition={finalsPosition}
              compact={compact}
              connectorColor={connectorColor}
              connectorWidth={connectorWidth}
              showDropLines={showDropLines}
            />}
          </ReadQueryState>
        ) : (
          <ReadQueryState query={bracketQuery} loadingMessage="Ładowanie drabinki…" errorMessage="Nie udało się pobrać drabinki.">
            {bracket && (publicStage.format === "round_robin" ? <RoundRobinView bracket={bracket} hideStandings />
              : publicStage.format === "swiss" ? <SwissRoundsView bracket={bracket} currentRound={publicStage.currentRound} totalRounds={publicStage.totalRounds} />
              : <BracketView bracket={bracket} format={publicStage.format} />)}
          </ReadQueryState>
        )}
        </ReadQueryState>
      </div>
    </div>
  );
}
