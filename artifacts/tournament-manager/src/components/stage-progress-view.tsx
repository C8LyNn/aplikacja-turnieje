import { useEffect, useMemo, useState } from "react";
import {
  type Bracket,
  type Match,
  useGetTournamentStage,
  useListTournamentStages,
  getGetTournamentStageQueryKey,
  getListTournamentStagesQueryKey,
} from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { BracketView } from "@/components/bracket-view";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { RoundRobinView } from "@/components/round-robin-view";
import {
  StageGroupTables,
  ParticipantTable,
  PlannedStageParticipants,
  StageNavigation,
} from "@/components/tournament-stages-panel";
import {
  filterMatchesForStage,
  getApiErrorMessage,
  STAGE_FORMAT_LABELS,
} from "@/lib/tournament-stages-ui";
import { buildBracketFromMatches, deriveCurrentRound } from "@/lib/stage-utils";
import { MarvelEliminationStage } from "@/components/marvel-elimination-stage";

interface StageProgressViewProps {
  tournamentId: number;
  activeStageId?: number | null;
  matches: Match[];
  /** playerId → bannedHeroIds — pass only for Deadlock tournaments */
  playerBansMap?: Map<number, string[]>;
  /** matchId → { p1HeroId, p2HeroId } — last game's pick per match for bracket display */
  matchPicksMap?: Map<
    number,
    { p1HeroId?: string | null; p2HeroId?: string | null }
  >;
  marvelEnabled?: boolean;
}

export function StageProgressView({
  tournamentId,
  activeStageId,
  matches,
  playerBansMap,
  matchPicksMap,
  marvelEnabled = false,
}: StageProgressViewProps) {
  const [selectedStageId, setSelectedStageId] = useState<number | undefined>();

  const stagesQuery = useListTournamentStages(tournamentId, {
    query: {
      enabled: tournamentId > 0,
      retry: false,
      queryKey: getListTournamentStagesQueryKey(tournamentId),
    },
  });
  const stages = stagesQuery.data ?? [];

  useEffect(() => {
    if (stages.length === 0) return;
    if (selectedStageId !== undefined && stages.some((s) => s.id === selectedStageId)) return;
    const preferred =
      stages.find((s) => s.id === activeStageId) ??
      [...stages].reverse().find((s) => s.status !== "planned") ??
      stages[0];
    setSelectedStageId(preferred.id);
  }, [activeStageId, selectedStageId, stages]);

  const detailQuery = useGetTournamentStage(
    tournamentId,
    selectedStageId ?? 0,
    {
      query: {
        enabled: !!selectedStageId,
        retry: false,
        queryKey: getGetTournamentStageQueryKey(tournamentId, selectedStageId ?? 0),
      },
    },
  );

  const selected = stages.find((s) => s.id === selectedStageId);
  const detailError = detailQuery.error as { status?: number; response?: { status?: number } } | null;
  const denied = [401, 403].includes(detailError?.status ?? detailError?.response?.status ?? 0);
  const detail = denied ? undefined : detailQuery.data;

  const selectedMatches = useMemo(
    () =>
      selectedStageId != null
        ? filterMatchesForStage(matches, selectedStageId)
        : [],
    [matches, selectedStageId],
  );

  const stageBracket = useMemo(() => {
    const base = buildBracketFromMatches(selectedMatches);
    if (selected?.status === "completed" && detail) {
      const winner = detail.participants.find(
        (p) => p.status === "winner",
      );
      if (winner) {
        return { ...base, winner: { id: winner.playerId, name: winner.playerName } };
      }
    }
    return base;
  }, [selectedMatches, selected?.status, detail]) as unknown as Bracket;

  const swissCurrentRound = useMemo(
    () => deriveCurrentRound(selectedMatches),
    [selectedMatches],
  );

  if (stagesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Ładowanie etapów…
      </div>
    );
  }

  if (!stages.length) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Brak drabinki. Wystartuj turniej.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {stages.length > 1 && (
        <StageNavigation
          stages={stages}
          selectedStageId={selectedStageId}
          onSelect={setSelectedStageId}
        />
      )}

      {detailQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ładowanie danych etapu…
        </div>
      )}

      {detailQuery.error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
          Nie udało się pobrać danych etapu.{" "}
          {getApiErrorMessage(detailQuery.error)}
        </div>
      )}

      {selected && detail &&
        (() => {
          if (selected.status === "planned") {
            return (
              <div className="space-y-3">
                <p className="px-1 text-sm font-medium text-muted-foreground">
                  {STAGE_FORMAT_LABELS[selected.format]} — oczekuje na
                  uruchomienie
                </p>
                <PlannedStageParticipants
                  stagePosition={selected.position}
                  participants={detail.participants}
                />
              </div>
            );
          }

          if (marvelEnabled && selected.format === "group_stage") {
            return (
              <MarvelEliminationStage
                tournamentId={tournamentId}
                stageId={selected.id}
              />
            );
          }

          if (selected.format === "group_stage") {
            return (
              <StageGroupTables
                details={detail}
                matches={selectedMatches}
              />
            );
          }

          if (selected.format === "single_elimination") {
            if (!selectedMatches.length) {
              return (
                <div className="flex items-center justify-center rounded-lg border border-dashed py-20 text-sm text-muted-foreground">
                  Brak meczów w tym etapie.
                </div>
              );
            }
            return (
              <div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Przewijaj poziomo i pionowo, aby zobaczyć całą drabinkę.
                </p>
                <div
                  className="overflow-auto rounded-lg border border-border bg-background/50"
                  style={{ maxHeight: "75vh" }}
                >
                  <div style={{ display: "inline-block", minWidth: "100%" }}>
                    <BracketView
                      bracket={stageBracket}
                      format="single_elimination"
                      playerBansMap={playerBansMap}
                      matchPicksMap={matchPicksMap}
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (selected.format === "swiss") {
            return (
              <div className="space-y-6">
                <ParticipantTable
                  participants={detail.participants}
                  matches={selectedMatches}
                  title={
                    selected.status === "completed"
                      ? "Zamrożony ranking etapu"
                      : "Ranking bieżący etapu"
                  }
                />
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Rundy</h4>
                  <div
                    className="overflow-auto rounded-lg border border-border bg-background/50 p-4"
                    style={{ maxHeight: "70vh" }}
                  >
                    <SwissRoundsView
                      bracket={stageBracket}
                      currentRound={swissCurrentRound}
                      totalRounds={selected.plannedRounds ?? null}
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (selected.format === "round_robin") {
            return (
              <div className="space-y-6">
                <ParticipantTable
                  participants={detail.participants}
                  matches={selectedMatches}
                  title={
                    selected.status === "completed"
                      ? "Klasyfikacja końcowa etapu"
                      : "Klasyfikacja bieżąca etapu"
                  }
                />
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Terminarz</h4>
                  <div
                    className="overflow-auto rounded-lg border border-border bg-background/50 p-4"
                    style={{ maxHeight: "70vh" }}
                  >
                    <RoundRobinView bracket={stageBracket} hideStandings />
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}
    </div>
  );
}
