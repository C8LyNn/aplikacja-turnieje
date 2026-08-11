import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTournamentStageQueryKey,
  getGetTournamentStageReadinessQueryKey,
  getGetDoubleEliminationStageQueryKey,
  getListTournamentStagesQueryKey,
  getPreviewStageQualificationQueryKey,
  type Match,
  type StageGroup,
  type StageParticipant,
  type StageQualificationPreview,
  type TournamentStage,
  type TournamentStageDetails,
  type DeadlockTournamentGameConfig,
  useCompleteTournamentStage,
  useGetDoubleEliminationStage,
  useGetTournamentStage,
  useGetTournamentStageReadiness,
  useListTournamentStages,
  usePreviewStageQualification,
  useStartTournamentStage,
} from "@workspace/api-client-react";
import { DoubleEliminationBracket } from "@/components/double-elimination-bracket";
import { DeadlockStageBansSummary } from "@/components/deadlock-stage-bans-editor";
import { availableStageStartReadiness } from "@/lib/organizer-next-step";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Play,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  filterMatchesForStage,
  getApiErrorMessage,
  STAGE_FORMAT_LABELS,
  STAGE_STATUS_LABELS,
} from "@/lib/tournament-stages-ui";
import { SeedingCeremony } from "@/components/seeding-ceremony";
import type { SeedingCeremonyState } from "@/lib/seeding-ceremony-api";
import {
  isSequentialCeremonyReady,
  stageHasRandomCeremony,
} from "@/lib/seeding-ceremony-view";

interface TournamentStagesPanelProps {
  tournamentId: number;
  tournamentStatus: "draft" | "active" | "completed";
  activeStageId?: number | null;
  matches: Match[];
  canManage?: boolean;
  canWriteResults?: boolean;
  audience?: boolean;
  onChanged?: () => void;
  gameConfig?: DeadlockTournamentGameConfig | null;
}

interface PlayerRecord {
  played: number;
  wins: number;
  losses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
}

function getPlayerRecord(
  matches: Match[],
  playerId: number,
): PlayerRecord {
  return matches.reduce<PlayerRecord>(
    (record, match) => {
      if (match.player1Id !== playerId && match.player2Id !== playerId)
        return record;
      if (match.status !== "completed" || match.resultType === "no_contest")
        return record;
      const isPlayer1 = match.player1Id === playerId;
      const ownGames = (isPlayer1 ? match.score1 : match.score2) ?? 0;
      const opponentGames = (isPlayer1 ? match.score2 : match.score1) ?? 0;
      record.played += 1;
      record.gameWins += ownGames;
      record.gameLosses += opponentGames;
      record.gameDiff += ownGames - opponentGames;
      if (match.winnerId === playerId) record.wins += 1;
      else if (match.winnerId != null) record.losses += 1;
      return record;
    },
    { played: 0, wins: 0, losses: 0, gameWins: 0, gameLosses: 0, gameDiff: 0 },
  );
}

export function StageNavigation({
  stages,
  selectedStageId,
  onSelect,
}: {
  stages: TournamentStage[];
  selectedStageId?: number;
  onSelect: (stageId: number) => void;
}) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Etapy turnieju"
    >
      {stages.map((stage) => {
        const selected = stage.id === selectedStageId;
        return (
          <button
            type="button"
            key={stage.id}
            onClick={() => onSelect(stage.id)}
            aria-pressed={selected}
            className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Etap {stage.position}
              </span>
              <Badge
                variant={stage.status === "active" ? "default" : "secondary"}
              >
                {STAGE_STATUS_LABELS[stage.status]}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 font-semibold">
              {stage.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : stage.status === "active" ? (
                <Play className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{stage.name}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {STAGE_FORMAT_LABELS[stage.format]} · BO{stage.bestOf} ·{" "}
              {stage.participantCount} graczy
            </p>
          </button>
        );
      })}
    </div>
  );
}

function RecordCells({ record }: { record: PlayerRecord }) {
  return (
    <>
      <td className="px-3 py-2 text-center font-mono">
        {record.wins}-{record.losses}
      </td>
      <td className="px-3 py-2 text-center font-mono">
        {record.gameWins}:{record.gameLosses}
      </td>
      <td className="px-3 py-2 text-center font-mono">
        {record.gameDiff > 0 ? "+" : ""}
        {record.gameDiff}
      </td>
    </>
  );
}

export function ParticipantTable({
  participants,
  matches,
  title,
  groupMode = false,
}: {
  participants: StageParticipant[];
  matches: Match[];
  title?: string;
  groupMode?: boolean;
}) {
  const ordered = [...participants].sort((a, b) => {
    const rankA = groupMode ? a.groupRank : a.finalRank;
    const rankB = groupMode ? b.groupRank : b.finalRank;
    return (
      (rankA ?? Number.MAX_SAFE_INTEGER) - (rankB ?? Number.MAX_SAFE_INTEGER) ||
      a.stageSeed - b.stageSeed
    );
  });
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {title && <h4 className="border-b px-4 py-3 font-semibold">{title}</h4>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-center">Miejsce</th>
              <th className="px-3 py-2 text-left">Gracz</th>
              <th className="px-3 py-2 text-center">Mecze W-P</th>
              <th className="px-3 py-2 text-center">Gry</th>
              <th className="px-3 py-2 text-center">+/-</th>
              <th className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ordered.map((participant) => {
              const rank = groupMode
                ? participant.groupRank
                : participant.finalRank;
              const qualified =
                participant.status === "qualified" ||
                participant.status === "winner";
              return (
                <tr key={participant.id}>
                  <td className="px-3 py-2 text-center font-mono font-semibold">
                    {rank ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {participant.playerName}
                  </td>
                  <RecordCells
                    record={getPlayerRecord(matches, participant.playerId)}
                  />
                  <td className="px-3 py-2 text-center">
                    {qualified ? (
                      <Badge className="bg-green-500/15 text-green-600">
                        Awans
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {participant.status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Brak meczów w tym etapie.
      </div>
    );
  }
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {matches.map((match) => (
        <div key={match.id} className="rounded-lg border bg-card p-3 text-sm">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>
              Runda {match.round} · Mecz {match.matchNumber}
            </span>
            <span>BO{match.bestOf}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span
              className={`truncate text-right ${match.winnerId === match.player1Id ? "font-bold text-primary" : ""}`}
            >
              {match.player1Name ?? "TBD"}
            </span>
            <span className="rounded bg-muted px-2 py-1 font-mono font-bold">
              {match.score1 ?? "—"}:{match.score2 ?? "—"}
            </span>
            <span
              className={`truncate ${match.winnerId === match.player2Id ? "font-bold text-primary" : ""}`}
            >
              {match.player2Name ?? "TBD"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StageGroupTables({
  details,
  matches,
}: {
  details: TournamentStageDetails;
  matches: Match[];
}) {
  return (
    <div
      className="grid gap-5 xl:grid-cols-2"
      aria-label={`${details.groups.length} grup etapu`}
    >
      {details.groups.map((group) => {
        const participants = details.participants.filter(
          (participant) => participant.groupId === group.id,
        );
        const groupMatches = matches.filter(
          (match) => match.stageGroupId === group.id,
        );
        return (
          <section
            key={group.id}
            className="space-y-3"
            aria-label={`Grupa ${group.groupKey}`}
          >
            <ParticipantTable
              participants={participants}
              matches={groupMatches}
              title={`Grupa ${group.groupKey}`}
              groupMode
            />
            <div>
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mecze grupy
              </h5>
              <MatchList matches={groupMatches} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function PlannedStageParticipants({
  stagePosition,
  participants,
}: {
  stagePosition: number;
  participants: StageParticipant[];
}) {
  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {stagePosition === 1
          ? "Uczestnicy pierwszego etapu pochodzą z listy graczy turnieju. Dodaj graczy, aby pojawili się tutaj."
          : "Uczestnicy pojawią się po kwalifikacji z poprzedniego etapu."}
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="flex items-center gap-2 rounded-lg border p-3"
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{participant.playerName}</span>
          <Badge variant="secondary" className="ml-auto">
            #{participant.stageSeed}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export function StageActionBar({
  canManage,
  stage,
  mayStart,
  onComplete,
  onStart,
  pending,
  startBlockedReason,
}: {
  canManage: boolean;
  stage: TournamentStage;
  mayStart: boolean;
  onComplete: () => void;
  onStart: () => void;
  pending: boolean;
  startBlockedReason?: string;
}) {
  if (!canManage) return null;
  if (stage.status === "active") {
    return (
      <Button onClick={onComplete} disabled={pending}>
        <Trophy className="mr-2 h-4 w-4" />
        Zakończ aktywny etap
      </Button>
    );
  }
  if (stage.status === "planned" && mayStart) {
    return (
      <div className="text-right">
        <Button onClick={onStart} disabled={pending || !!startBlockedReason} title={startBlockedReason}>
          <Play className="mr-2 h-4 w-4" />
          Uruchom ten etap
        </Button>
        {startBlockedReason && (
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">{startBlockedReason}</p>
        )}
      </div>
    );
  }
  return null;
}

function Qualifiers({ qualifiers }: { qualifiers: StageParticipant[] }) {
  if (qualifiers.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Zakwalifikowani do kolejnego etapu
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {[...qualifiers]
          .sort(
            (a, b) =>
              (a.qualificationRank ?? a.stageSeed) -
              (b.qualificationRank ?? b.stageSeed),
          )
          .map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <span className="font-medium">{participant.playerName}</span>
                {participant.groupKey && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Grupa {participant.groupKey}
                  </span>
                )}
              </div>
              <Badge variant="secondary">
                Seed{" "}
                {participant.nextStageSeed ??
                  participant.qualificationRank ??
                  "—"}
              </Badge>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

function PreviewList({ preview }: { preview: StageQualificationPreview }) {
  if (preview.qualifiers.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        To ostatni etap. Zakończenie wyłoni zwycięzcę turnieju.
      </p>
    );
  return (
    <div className="max-h-72 space-y-2 overflow-y-auto">
      {preview.qualifiers.map((qualifier) => (
        <div
          key={qualifier.stageParticipantId}
          className="flex items-center justify-between rounded-md border p-3 text-sm"
        >
          <span>
            <strong>#{qualifier.rank}</strong> {qualifier.playerName}
            {qualifier.groupKey ? ` · Grupa ${qualifier.groupKey}` : ""}
          </span>
          <Badge>Seed {qualifier.nextStageSeed}</Badge>
        </div>
      ))}
    </div>
  );
}

export function TournamentStagesPanel({
  tournamentId,
  tournamentStatus,
  activeStageId,
  matches,
  canManage = false,
  canWriteResults = canManage,
  audience = false,
  onChanged,
  gameConfig,
}: TournamentStagesPanelProps) {
  const queryClient = useQueryClient();
  const [selectedStageId, setSelectedStageId] = useState<number>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [ceremonyState, setCeremonyState] = useState<SeedingCeremonyState | null>(null);
  const stagesQuery = useListTournamentStages(tournamentId, {
    query: {
      enabled: tournamentId > 0,
      retry: false,
      queryKey: getListTournamentStagesQueryKey(tournamentId),
      refetchInterval: audience ? 8000 : false,
    },
  });
  const stages = stagesQuery.data ?? [];

  useEffect(() => {
    setCeremonyState(null);
  }, [selectedStageId]);

  useEffect(() => {
    if (stages.length === 0) return;
    if (selectedStageId && stages.some((stage) => stage.id === selectedStageId))
      return;
    const preferred =
      stages.find((stage) => stage.id === activeStageId) ??
      [...stages].reverse().find((stage) => stage.status === "completed") ??
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
        queryKey: getGetTournamentStageQueryKey(
          tournamentId,
          selectedStageId ?? 0,
        ),
        refetchInterval: audience ? 8000 : false,
      },
    },
  );
  const selected = stages.find((stage) => stage.id === selectedStageId);
  const readinessQuery = useGetTournamentStageReadiness(
    tournamentId,
    selectedStageId ?? 0,
    {
      query: {
        enabled: !!selectedStageId && selected?.status === "planned",
        retry: false,
        queryKey: getGetTournamentStageReadinessQueryKey(
          tournamentId,
          selectedStageId ?? 0,
        ),
      },
    },
  );
  const previewQuery = usePreviewStageQualification(
    tournamentId,
    selectedStageId ?? 0,
    {
      query: {
        enabled:
          !!selectedStageId &&
          confirmOpen &&
          selected?.status === "active" &&
          selected.format !== "double_elimination",
        retry: false,
        queryKey: getPreviewStageQualificationQueryKey(
          tournamentId,
          selectedStageId ?? 0,
        ),
      },
    },
  );
  const doubleEliminationQuery = useGetDoubleEliminationStage(
    tournamentId,
    selectedStageId ?? 0,
    {
      query: {
        enabled:
          !!selectedStageId &&
          selected?.format === "double_elimination" &&
          selected.status !== "planned",
        retry: false,
        queryKey: getGetDoubleEliminationStageQueryKey(tournamentId, selectedStageId ?? 0),
        refetchInterval: audience ? 8000 : false,
      },
    },
  );
  const completeMutation = useCompleteTournamentStage();
  const startMutation = useStartTournamentStage();

  const selectedMatches = useMemo(
    () =>
      selectedStageId
        ? filterMatchesForStage(matches, selectedStageId)
        : [],
    [matches, selectedStageId],
  );
  const previous = selected
    ? stages.find((stage) => stage.position === selected.position - 1)
    : undefined;
  const mayStart =
    canManage &&
    !!selected &&
    selected.status === "planned" &&
    selected.position > 1 &&
    previous?.status === "completed" &&
    !activeStageId &&
    tournamentStatus === "active" &&
    availableStageStartReadiness(
      readinessQuery.data,
      readinessQuery.isFetching,
    )?.ready === true;
  const pending = completeMutation.isPending || startMutation.isPending;
  const ceremonyReady = !selected || isSequentialCeremonyReady(selected, ceremonyState);
  const startBlockedReason = ceremonyReady
    ? undefined
    : "Dokończ ceremonię losowania przed uruchomieniem etapu.";

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getListTournamentStagesQueryKey(tournamentId),
      }),
      selectedStageId
        ? queryClient.invalidateQueries({
            queryKey: getGetTournamentStageQueryKey(
              tournamentId,
              selectedStageId,
            ),
          })
        : Promise.resolve(),
      selectedStageId && selected?.format === "double_elimination"
        ? queryClient.invalidateQueries({
            queryKey: getGetDoubleEliminationStageQueryKey(tournamentId, selectedStageId),
          })
        : Promise.resolve(),
      selectedStageId
        ? queryClient.invalidateQueries({
            queryKey: getPreviewStageQualificationQueryKey(
              tournamentId,
              selectedStageId,
            ),
          })
        : Promise.resolve(),
      selectedStageId
        ? queryClient.invalidateQueries({
            queryKey: getGetTournamentStageReadinessQueryKey(
              tournamentId,
              selectedStageId,
            ),
          })
        : Promise.resolve(),
    ]);
    onChanged?.();
  };

  const complete = () => {
    if (!canManage || !selected) return;
    setActionError(undefined);
    completeMutation.mutate(
      { id: tournamentId, stageId: selected.id },
      {
        onSuccess: async () => {
          setConfirmOpen(false);
          await refresh();
        },
        onError: (error) => setActionError(getApiErrorMessage(error)),
      },
    );
  };
  const start = () => {
    if (!canManage || !selected || !mayStart) return;
    setActionError(undefined);
    startMutation.mutate(
      { id: tournamentId, stageId: selected.id },
      {
        onSuccess: refresh,
        onError: (error) => setActionError(getApiErrorMessage(error)),
      },
    );
  };

  if (stagesQuery.isLoading)
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Ładowanie etapów…
      </div>
    );
  if (stagesQuery.error)
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
        Nie udało się pobrać etapów. {getApiErrorMessage(stagesQuery.error)}
      </div>
    );
  if (stages.length === 0)
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Ten turniej nie ma jeszcze skonfigurowanych etapów.
      </div>
    );

  return (
    <section
      className={`space-y-5 ${audience ? "w-full max-w-5xl" : ""}`}
      aria-label="Przebieg etapów turnieju"
    >
      <div>
        <h2 className="text-xl font-bold">Etapy turnieju</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wybierz etap, aby zobaczyć jego uczestników, ranking, grupy i mecze.
        </p>
      </div>
      <StageNavigation
        stages={stages}
        selectedStageId={selectedStageId}
        onSelect={(stageId) => {
          setSelectedStageId(stageId);
          setActionError(undefined);
          setCeremonyState(null);
        }}
      />
      {actionError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {actionError}
        </div>
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
      {selected && detailQuery.data && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{selected.name}</h3>
                  <Badge>{STAGE_STATUS_LABELS[selected.status]}</Badge>
                  {selected.status === "active" && (
                    <Badge className="bg-green-500/15 text-green-600">
                      Aktualny etap
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {STAGE_FORMAT_LABELS[selected.format]} · BO{selected.bestOf} ·{" "}
                  {selected.participantCount} uczestników
                  {selected.plannedRounds
                    ? ` · ${selected.plannedRounds} rund`
                    : ""}
                </p>
              </div>
              <StageActionBar
                canManage={canManage}
                stage={selected}
                mayStart={mayStart}
                onComplete={() => setConfirmOpen(true)}
                onStart={start}
                pending={pending}
                startBlockedReason={startBlockedReason}
              />
            </CardContent>
          </Card>

          {stageHasRandomCeremony(selected) && (
            <SeedingCeremony
              tournamentId={tournamentId}
              stage={selected}
              canManage={canManage}
              audience={audience}
              onStateChange={setCeremonyState}
            />
          )}

          <DeadlockStageBansSummary
            gameConfig={gameConfig}
            orderedStageKeys={stages.map((stage) => stage.stageKey)}
            stageKey={selected.stageKey}
          />

          {selected.status === "planned" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Oczekujący uczestnicy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlannedStageParticipants
                  stagePosition={selected.position}
                  participants={detailQuery.data.participants}
                />
              </CardContent>
            </Card>
          ) : selected.format === "double_elimination" ? (
            doubleEliminationQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ładowanie drabinki podwójnej eliminacji…
              </div>
            ) : doubleEliminationQuery.error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
                Nie udało się pobrać drabinki. {getApiErrorMessage(doubleEliminationQuery.error)}
              </div>
            ) : doubleEliminationQuery.data ? (
              <DoubleEliminationBracket
                tournamentId={tournamentId}
                stageId={selected.id}
                state={doubleEliminationQuery.data}
                canManage={canWriteResults}
                canReset={canManage}
                onChanged={refresh}
              />
            ) : null
          ) : selected.format === "group_stage" ? (
            <StageGroupTables
              details={detailQuery.data}
              matches={selectedMatches}
            />
          ) : (
            <div className="space-y-5">
              <ParticipantTable
                participants={detailQuery.data.participants}
                matches={selectedMatches}
                title={
                  selected.status === "completed"
                    ? "Zamrożony ranking"
                    : "Ranking etapu"
                }
              />
              <div>
                <h4 className="mb-3 font-semibold">Mecze etapu</h4>
                <MatchList matches={selectedMatches} />
              </div>
            </div>
          )}
          {selected.status === "active" && selected.id === activeStageId && (
            <p className="text-xs text-muted-foreground">
              Bilans obejmuje wyłącznie mecze tego etapu; ostateczna pozycja
              zostanie zamrożona przez serwer przy jego zakończeniu.
            </p>
          )}
          {selected.status === "completed" && (
            <Qualifiers qualifiers={detailQuery.data.qualifiers} />
          )}
        </>
      )}

      <Dialog
        open={canManage && confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          setActionError(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zakończyć etap „{selected?.name}”?</DialogTitle>
            <DialogDescription>
              Ranking i kwalifikacja zostaną ponownie obliczone i atomowo
              zamrożone. Następny etap uruchamia się osobno.
            </DialogDescription>
          </DialogHeader>
          {previewQuery.isLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sprawdzanie wyników i kwalifikantów…
            </div>
          )}
          {previewQuery.error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {getApiErrorMessage(previewQuery.error)}
            </div>
          )}
          {previewQuery.data && <PreviewList preview={previewQuery.data} />}
          {selected?.format === "double_elimination" && doubleEliminationQuery.data && (
            <p className="text-sm text-muted-foreground">
              {doubleEliminationQuery.data.completed
                ? `Zwycięzca został wyłoniony. Zakończenie etapu zamknie turniej.`
                : "Najpierw rozegraj Grand Final (oraz reset, jeśli będzie wymagany)."}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={complete}
              disabled={
                pending ||
                (selected?.format === "double_elimination"
                  ? doubleEliminationQuery.data?.completed !== true
                  : !previewQuery.data)
              }
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zakończ etap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
