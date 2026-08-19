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

import { useRoute, useSearch } from "wouter";
import {
  useGetTournament,
  useGetDoubleEliminationStage,
  useListTournamentStages,
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
  const [, params] = useRoute("/tournaments/:id/projector");
  const search = useSearch();
  const id = params?.id ? parseInt(params.id, 10) : 0;

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

  const { data: tournament } = useGetTournament(id, {
    query: {
      enabled: !!id,
      queryKey: getGetTournamentQueryKey(id),
      refetchInterval: 10000,
      retry: false,
    },
  });

  const { data: stages } = useListTournamentStages(id, {
    query: {
      enabled: !!id && !!tournament,
      queryKey: getListTournamentStagesQueryKey(id),
      refetchInterval: 10000,
    },
  });

  const deStage = stages?.find(
    s => s.format === "double_elimination" && s.status !== "planned",
  );

  const { data: deState } = useGetDoubleEliminationStage(
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

  if (!tournament || (!deStage && tournament.status !== "draft")) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={transparent ? {} : { background: presetStyle.background as string }}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <Trophy className="w-12 h-12 opacity-20" />
          <p className="text-sm font-mono">Ładowanie…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} data-theme={effectiveSettings.colorPreset ?? undefined}>
      {/* Optional tournament header */}
      {!hideHeader && (
        <div
          className="flex flex-col items-center justify-center gap-1 border-b border-white/10"
          style={{ padding: `${Math.round(padding * 0.6)}px ${padding}px` }}
        >
          <h1
            className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent font-deadlock"
            style={{ fontSize: compact ? "1.5rem" : "2rem", lineHeight: 1.1 }}
          >
            {tournament.name}
          </h1>
          {tournament.currentRound && tournament.totalRounds && (
            <p
              className="font-mono uppercase tracking-widest text-muted-foreground"
              style={{ fontSize: compact ? "0.6rem" : "0.7rem" }}
            >
              Double Elimination · Runda {tournament.currentRound}/{tournament.totalRounds}
            </p>
          )}
        </div>
      )}

      {/* Bracket canvas */}
      <div
        style={{
          padding,
          ...(forceAspect ? {} : { transform: `scale(${zoom})`, transformOrigin: "top left" }),
        }}
      >
        {deState ? (
          <DEBracketCanvas
            matches={deState.matches}
            participants={participants}
            finalsPosition={finalsPosition}
            compact={compact}
            connectorColor={connectorColor}
            connectorWidth={connectorWidth}
            showDropLines={showDropLines}
          />
        ) : (
          <div className="flex items-center justify-center py-20 text-muted-foreground/40 font-mono text-sm">
            {tournament.status === "draft"
              ? "Turniej jeszcze nie wystartował."
              : "Brak etapu Double Elimination."}
          </div>
        )}
      </div>
    </div>
  );
}
