import { useEffect, useMemo, useState } from "react";
import {
  type Bracket,
  type Match,
  useGetTournamentStage,
  useListTournamentStages,
  useGetDoubleEliminationStage,
  getGetTournamentStageQueryKey,
  getListTournamentStagesQueryKey,
  getGetDoubleEliminationStageQueryKey,
} from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { BracketView } from "@/components/bracket-view";
import { DoubleEliminationBracket } from "@/components/double-elimination-bracket";
import { SwissRoundsView } from "@/components/swiss-rounds-view";
import { RoundRobinView } from "@/components/round-robin-view";
import { StageLiveTables, useStageLiveStandings } from "@/components/stage-live-tables";
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
import { setRulesOf } from "@/lib/two-leg-tie-view";
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

  // V5.11: the same engine-ranked tables as the viewer (points, draws, advancing places); the record-based
  // table stays as the fallback for stages without live standings.
  const selectedForLive = stages.find((stage) => stage.id === selectedStageId);
  const liveQuery = useStageLiveStandings(tournamentId, selectedStageId, {
    enabled: !!selectedForLive && selectedForLive.status !== "planned" && ["group_stage", "round_robin", "swiss"].includes(selectedForLive.format),
  });
  const live = liveQuery.data?.tables.length ? liveQuery.data : undefined;

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
  // V5.9 · the "Drabinka" tab had no double-elimination branch (it rendered nothing); it now reads the same
  // double-elimination state the Etapy tab uses. Read-only here — results stay in the match editor / Etapy tab.
  const doubleEliminationQuery = useGetDoubleEliminationStage(tournamentId, selectedStageId ?? 0, {
    query: {
      enabled: !!selectedStageId && selected?.format === "double_elimination" && selected.status !== "planned",
      retry: false,
      queryKey: getGetDoubleEliminationStageQueryKey(tournamentId, selectedStageId ?? 0),
      refetchInterval: 5000,
    },
  });

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

  if (stagesQuery.isError && stages.length === 0) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        <p>Nie udało się pobrać listy etapów. Nie oznacza to, że turniej nie ma drabinki.</p>
        <button type="button" onClick={() => void stagesQuery.refetch()} disabled={stagesQuery.isFetching}
          className="mt-3 min-h-11 rounded-md border border-destructive/40 px-4 font-medium hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {stagesQuery.isFetching ? "Ponawianie…" : "Ponów odczyt etapów"}
        </button>
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
      {stagesQuery.isError && (
        <div role="status" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Nie udało się odświeżyć listy etapów. Widoczne dane mogą być nieaktualne.
          <button type="button" onClick={() => void stagesQuery.refetch()} disabled={stagesQuery.isFetching}
            className="ml-2 min-h-11 rounded-md px-3 font-medium underline underline-offset-4 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary">
            {stagesQuery.isFetching ? "Ponawianie…" : "Ponów odczyt etapów"}
          </button>
        </div>
      )}
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
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
          {detail ? "Nie udało się odświeżyć danych etapu. Pokazujemy ostatnio pobrane dane." : "Nie udało się pobrać danych etapu."}{" "}
          {getApiErrorMessage(detailQuery.error)}
          {!denied && (
            <button type="button" onClick={() => void detailQuery.refetch()} disabled={detailQuery.isFetching}
              className="mt-3 block min-h-11 rounded-md border border-destructive/40 px-4 font-medium hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              {detailQuery.isFetching ? "Ponawianie…" : "Ponów odczyt etapu"}
            </button>
          )}
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
                live={live}
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

          if (selected.format === "double_elimination") {
            if (doubleEliminationQuery.isLoading) {
              return (
                <div className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ładowanie drabinki podwójnej eliminacji…
                </div>
              );
            }
            if (!doubleEliminationQuery.data) {
              return (
                <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
                  Nie udało się pobrać drabinki. {doubleEliminationQuery.error ? getApiErrorMessage(doubleEliminationQuery.error) : ""}
                  <button type="button" onClick={() => void doubleEliminationQuery.refetch()} disabled={doubleEliminationQuery.isFetching}
                    className="mt-3 block min-h-11 rounded-md border border-destructive/40 px-4 font-medium hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    {doubleEliminationQuery.isFetching ? "Ponawianie…" : "Ponów odczyt drabinki"}
                  </button>
                </div>
              );
            }
            return (
              <DoubleEliminationBracket
                tournamentId={tournamentId}
                stageId={selected.id}
                state={doubleEliminationQuery.data}
                matchRules={setRulesOf(selected.matchRules ?? null)}
              />
            );
          }

          if (selected.format === "swiss") {
            return (
              <div className="space-y-6">
                {live ? <StageLiveTables data={live} /> : <ParticipantTable
                  participants={detail.participants}
                  matches={selectedMatches}
                  title={
                    selected.status === "completed"
                      ? "Końcowe miejsca etapu"
                      : "Ranking bieżący etapu"
                  }
                />}
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
                {live ? <StageLiveTables data={live} /> : <ParticipantTable
                  participants={detail.participants}
                  matches={selectedMatches}
                  title={
                    selected.status === "completed"
                      ? "Klasyfikacja końcowa etapu"
                      : "Klasyfikacja bieżąca etapu"
                  }
                />}
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
