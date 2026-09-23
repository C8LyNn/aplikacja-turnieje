import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTournamentStageQueryKey,
  getGetTournamentStageBasketsQueryKey,
  getGetTournamentStageReadinessQueryKey,
  getGetDoubleEliminationStageQueryKey,
  getGetStageSeedingCeremonyQueryKey,
  getListTournamentStagesQueryKey,
  getPreviewStageQualificationQueryKey,
  type Match,
  type StageGroup,
  type StageParticipant,
  type StageQualificationPreview,
  type TournamentStage,
  type TournamentStageDetails,
  type Tournament,
  useCompleteTournamentStage,
  useGetDoubleEliminationStage,
  useGetTournamentStageBaskets,
  useGetTournamentStage,
  useGetTournamentStageReadiness,
  useListTournamentStages,
  usePreviewStageQualification,
  useStartTournamentStage,
  useStartTournament,
  useGetStageSeedingCeremony,
} from "@workspace/api-client-react";
import { DoubleEliminationBracket } from "@/components/double-elimination-bracket";
import { StageQualificationRouting } from "@/components/stage-qualification-routing";
import { MarvelEliminationStage } from "@/components/marvel-elimination-stage";
import { DeadlockStageBansSummary } from "@/components/deadlock-stage-bans-editor";
import { availableStageStartReadiness } from "@/lib/organizer-next-step";
import { organizerStageSummary } from "@/lib/organizer-stage-summary";
import { invalidateTournamentDependentQueries } from "@/lib/tournament-query-invalidation";
import { stageReadinessFeedback, stageReadinessMessages, stageLifecycleError } from "@/lib/stage-lifecycle-feedback";
import {
  CheckCircle2,
  Circle,
  Info,
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
import { deriveStageBasketFlowCounts } from "@workspace/stage-basket-flow";
import type { SeedingCeremonyState } from "@/lib/seeding-ceremony-api";
import {
  isSequentialCeremonyReady,
  stageHasRandomCeremony,
  stageRequiresSequentialCeremony,
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
  gameConfig?: Tournament["gameConfig"];
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
  participantCounts,
}: {
  stages: TournamentStage[];
  selectedStageId?: number;
  onSelect: (stageId: number) => void;
  participantCounts?: ReadonlyMap<number, number>;
}) {
  return (
    <div
      className="organizer-stage-navigation grid gap-3"
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
            className={`organizer-stage-card rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
                data-stage-status={stage.status}
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
              {(stage.status === "planned" ? participantCounts?.get(stage.id) : undefined) ?? stage.participantCount} graczy{stage.status === "planned" ? " (plan)" : ""}
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
      <td className="px-2 py-2 text-center font-mono tabular-nums 2xl:px-3">
        {record.wins}-{record.losses}
      </td>
      <td className="px-2 py-2 text-center font-mono tabular-nums 2xl:px-3">
        {record.gameWins}:{record.gameLosses}
      </td>
      <td className="px-2 py-2 text-center font-mono tabular-nums 2xl:px-3">
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
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border bg-card">
      {title && <h4 className="break-words border-b px-4 py-3 font-semibold">{title}</h4>}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[32rem] table-fixed text-sm" aria-label={title ?? "Ranking etapu"}>
          <colgroup>
            <col className="w-16" />
            <col />
            <col className="w-20" />
            <col className="w-16" />
            <col className="w-14" />
            <col className="w-32" />
          </colgroup>
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-center 2xl:px-3">Miejsce</th>
              <th className="px-2 py-2 text-left 2xl:px-3">Gracz</th>
              <th className="px-2 py-2 text-center 2xl:px-3">Mecze W-P</th>
              <th className="px-2 py-2 text-center 2xl:px-3">Gry</th>
              <th className="px-2 py-2 text-center 2xl:px-3">+/-</th>
              <th className="px-2 py-2 text-center 2xl:px-3">Status</th>
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
                  <td className="px-2 py-2 text-center font-mono font-semibold tabular-nums 2xl:px-3">
                    {rank ?? "—"}
                  </td>
                  <td className="px-2 py-2 font-medium 2xl:px-3">
                    <span className="block truncate" title={participant.playerName}>
                      {participant.playerName}
                    </span>
                  </td>
                  <RecordCells
                    record={getPlayerRecord(matches, participant.playerId)}
                  />
                  <td className="px-2 py-2 text-center 2xl:px-3">
                    {qualified ? (
                      <Badge className="max-w-full whitespace-normal break-words px-1.5 bg-green-500/15 text-green-600">
                        {participant.status === "winner" ? "Zwycięzca" : "Awans"}
                      </Badge>
                    ) : (
                      <span className="break-words text-xs text-muted-foreground">
                        {{ active: "Aktywny", eliminated: "Wyeliminowany", pending: "Oczekuje", qualified: "Awans", winner: "Zwycięzca" }[participant.status]}
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
      className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,36rem),1fr))] gap-5"
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
            className="min-w-0 space-y-3"
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

// manualSeed is added to the stage detail response by the API but not yet
// reflected in the generated TypeScript type — access via local type extension.
type ParticipantWithManualSeed = StageParticipant & { manualSeed?: number | null };

export function PlannedStageParticipants({
  stagePosition,
  participants,
  entrySeedingPolicy,
  readyParticipantCount,
}: {
  stagePosition: number;
  participants: StageParticipant[];
  entrySeedingPolicy?: string | null;
  readyParticipantCount?: number;
}) {
  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {readyParticipantCount !== undefined
          ? `Skład gotowy według serwera: ${readyParticipantCount} uczestników. Lista uczestników etapu zostanie zapisana przy rozpoczęciu.`
          : stagePosition === 1
          ? "Uczestnicy pierwszego etapu pochodzą z listy graczy turnieju. Dodaj graczy, aby pojawili się tutaj."
          : "Uczestnicy pojawią się po kwalifikacji z poprzedniego etapu."}
      </p>
    );
  }
  const isManual = entrySeedingPolicy === "manual";
  const withManualSeed = participants as ParticipantWithManualSeed[];
  const sorted = isManual
    ? [...withManualSeed].sort((a, b) => {
        const sa = a.manualSeed ?? Number.MAX_SAFE_INTEGER;
        const sb = b.manualSeed ?? Number.MAX_SAFE_INTEGER;
        return sa !== sb ? sa - sb : a.stageSeed - b.stageSeed;
      })
    : withManualSeed;
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((participant) => {
        const seedLabel = isManual
          ? participant.manualSeed != null
            ? `#${participant.manualSeed}`
            : "—"
          : `#${participant.stageSeed}`;
        return (
          <div
            key={participant.id}
            className="flex items-center gap-2 rounded-lg border p-3"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{participant.playerName}</span>
            <Badge variant="secondary" className="ml-auto">
              {seedLabel}
            </Badge>
          </div>
        );
      })}
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
        Zakończ etap
      </Button>
    );
  }
  if (stage.status === "planned") {
    return (
      <div className="text-right">
        <Button onClick={onStart} disabled={pending || !mayStart || !!startBlockedReason} title={startBlockedReason}>
          <Play className="mr-2 h-4 w-4" />
          Rozpocznij etap
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
        Podgląd nie wskazuje kwalifikantów do przekazania. Sprawdź konfigurację wyjścia etapu przed zakończeniem.
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
  const search = useSearch();
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(search);
  const requestedStageId = Number(searchParams.get("stage")) || undefined;
  const requestedAction = searchParams.get("action");
  const [selectedStageId, setSelectedStageId] = useState<number>();
  useEffect(() => { if (requestedStageId && !requestedAction) setSelectedStageId(requestedStageId); }, [requestedStageId, requestedAction]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [actionStageId, setActionStageId] = useState<number>();
  const [actionSuccess, setActionSuccess] = useState<string>();
  const mutationLock = useRef(false);
  const [actionError, setActionError] = useState<string>();
  const [ceremonyState, setCeremonyState] = useState<SeedingCeremonyState | null>(null);
  const stagesQuery = useListTournamentStages(tournamentId, {
    query: {
      enabled: tournamentId > 0,
      retry: false,
      queryKey: getListTournamentStagesQueryKey(tournamentId),
      refetchInterval: audience ? 8000 : 5000,
    },
  });
  const stages = [...(stagesQuery.data ?? [])].sort((a, b) => a.position - b.position);
  const basketConfigurationQuery = useGetTournamentStageBaskets(tournamentId, {
    query: {
      enabled: tournamentId > 0,
      retry: false,
      queryKey: getGetTournamentStageBasketsQueryKey(tournamentId),
    },
  });
  const explicitBasketAuthority =
    basketConfigurationQuery.data?.flowAuthority === "basket_v1";
  const explicitFlowCounts = useMemo(
    () =>
      deriveStageBasketFlowCounts(
        stages,
        basketConfigurationQuery.data?.baskets ?? [],
        basketConfigurationQuery.data?.routes ?? [],
      ),
    [basketConfigurationQuery.data, stages],
  );
  const explicitParticipantCounts = useMemo(
    () =>
      explicitBasketAuthority
        ? new Map(
            [...explicitFlowCounts].map(([stageId, counts]) => [
              stageId,
              counts.derivedParticipantCount,
            ]),
          )
        : undefined,
    [explicitBasketAuthority, explicitFlowCounts],
  );

  useEffect(() => {
    setCeremonyState(null);
  }, [selectedStageId]);

  useEffect(() => {
    if (stages.length === 0) return;
    if (selectedStageId && stages.some((stage) => stage.id === selectedStageId))
      return;
    const preferred =
      stages.find((stage) => !requestedAction && stage.id === requestedStageId) ??
      stages.find((stage) => stage.status === "active") ??
      stages.find((stage) => stage.id === activeStageId) ??
      [...stages].reverse().find((stage) => stage.status === "completed") ??
      stages[0];
    setSelectedStageId(preferred.id);
  }, [activeStageId, requestedAction, requestedStageId, selectedStageId, stages]);

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
        refetchInterval: audience ? 8000 : 5000,
      },
    },
  );
  const selected = stages.find((stage) => stage.id === selectedStageId);
  const actionStage = stages.find((stage) => stage.id === actionStageId);
  const actionReadiness = useGetTournamentStageReadiness(tournamentId, actionStageId ?? 0, {
    query: { queryKey: getGetTournamentStageReadinessQueryKey(tournamentId, actionStageId ?? 0), enabled: startConfirmOpen && actionStage?.status === "planned", retry: false, refetchInterval: 5000 },
  });
  const actionCeremony = useGetStageSeedingCeremony(tournamentId, actionStageId ?? 0, {
    query: { queryKey: getGetStageSeedingCeremonyQueryKey(tournamentId, actionStageId ?? 0), enabled: startConfirmOpen && !!actionStage && stageRequiresSequentialCeremony(actionStage), retry: false },
  });
  const actionDoubleElimination = useGetDoubleEliminationStage(tournamentId, actionStageId ?? 0, {
    query: { queryKey: getGetDoubleEliminationStageQueryKey(tournamentId, actionStageId ?? 0), enabled: confirmOpen && actionStage?.format === "double_elimination", retry: false },
  });
  const readinessQuery = useGetTournamentStageReadiness(
    tournamentId,
    selectedStageId ?? 0,
    {
      query: {
        enabled: !!selectedStageId && selected?.status === "planned",
        refetchInterval: 5000,
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
    actionStageId ?? 0,
    {
      query: {
        enabled:
          !!actionStageId &&
          confirmOpen &&
          actionStage?.status === "active" &&
          actionStage.format !== "double_elimination",
        retry: false,
        queryKey: getPreviewStageQualificationQueryKey(
          tournamentId,
          actionStageId ?? 0,
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
        refetchInterval: audience ? 8000 : 5000,
      },
    },
  );
  const lifecycleFeedback = {
    onMutate: () => { setActionError(undefined); setActionSuccess(undefined); },
    onSuccess: () => refresh(),
    onError: async (error: unknown) => {
      setActionError(stageLifecycleError(error));
      await refresh();
    },
    onSettled: () => { mutationLock.current = false; },
  };
  const completeMutation = useCompleteTournamentStage({ mutation: {
    ...lifecycleFeedback,
    onSuccess: async (_result, { stageId }) => {
      setConfirmOpen(false);
      const preview = { queryKey: getPreviewStageQualificationQueryKey(tournamentId, stageId), exact: true };
      // A completed stage no longer has an active-stage preview. Remove it before
      // invalidation, even if React has not committed the dialog closing yet.
      await queryClient.cancelQueries(preview);
      queryClient.removeQueries(preview);
      await refresh();
    },
  } });
  const startMutation = useStartTournamentStage({ mutation: lifecycleFeedback });
  const firstStartMutation = useStartTournament({ mutation: lifecycleFeedback });
  const [qualificationPending, setQualificationPending] = useState(false);

  const selectedMatches = useMemo(
    () =>
      selectedStageId
        ? filterMatchesForStage(matches, selectedStageId)
        : [],
    [matches, selectedStageId],
  );
  const mayStart =
    canManage &&
    !!selected &&
    selected.status === "planned" &&
    availableStageStartReadiness(
      readinessQuery.data,
      readinessQuery.isFetching,
    )?.ready === true;
  const pending = completeMutation.isPending || startMutation.isPending || firstStartMutation.isPending || qualificationPending;
  const allStagesCompleted = tournamentStatus === "completed" || (stages.length > 0 && stages.every(stage => stage.status === "completed"));
  const openLifecycleAction = useCallback((action: "start" | "complete", target: TournamentStage) => {
    if (!canManage || pending || mutationLock.current) return;
    if (target.status !== (action === "start" ? "planned" : "active")) return;
    setActionStageId(target.id);
    setActionError(undefined);
    setStartConfirmOpen(action === "start");
    setConfirmOpen(action === "complete");
  }, [canManage, pending]);
  useEffect(() => {
    if ((requestedAction !== "start" && requestedAction !== "complete") || !requestedStageId || !stagesQuery.data) return;
    const target = stages.find(stage => stage.id === requestedStageId);
    if (target) openLifecycleAction(requestedAction, target);
    // Consume the action, so the same CTA can be used again after cancellation.
    // Selection remains navigation state, never the trigger or target of an action.
    const params = new URLSearchParams(search);
    params.delete("action");
    params.delete("stage");
    navigate(`${location}?${params}`, { replace: true });
  }, [search, requestedAction, requestedStageId, stagesQuery.data, stages, openLifecycleAction, location, navigate]);
  const ceremonyReady = !selected || isSequentialCeremonyReady(selected, ceremonyState);
  const readinessFeedback = selected && readinessQuery.data
    ? stageReadinessFeedback(readinessQuery.data, selected.name) : undefined;
  const startBlockedReason = readinessQuery.isError ? "Nie udało się sprawdzić gotowości. Ponów sprawdzenie."
    : readinessQuery.isFetching || !readinessQuery.data ? "Sprawdzanie gotowości etapu…"
    : !readinessQuery.data.ready ? stageReadinessFeedback(readinessQuery.data, selected?.name ?? "Etap").summary
    : !ceremonyReady ? "Dokończ ceremonię losowania przed rozpoczęciem etapu." : undefined;
  const actionStartBlockedReason = actionReadiness.isError || actionCeremony.isError
    ? "Nie udało się sprawdzić gotowości. Ponów sprawdzenie."
    : actionReadiness.isFetching || !actionReadiness.data || actionCeremony.isFetching
    ? "Sprawdzanie gotowości etapu…"
    : !actionReadiness.data.ready ? stageReadinessMessages(actionReadiness.data, { stages, stageId: actionStage?.id }).join(" ")
    : actionStage && !isSequentialCeremonyReady(actionStage, actionCeremony.data?.ceremony ?? null)
    ? "Dokończ ceremonię losowania przed rozpoczęciem etapu." : undefined;
  const mayStartAction = canManage && actionStage?.status === "planned" && actionReadiness.data?.ready === true;

  const refresh = async () => {
    await invalidateTournamentDependentQueries(queryClient, tournamentId);
    await onChanged?.();
  };

  const complete = () => {
    if (!canManage || !actionStage || actionStage.status !== "active" || pending || mutationLock.current ||
      (actionStage.format === "double_elimination" ? actionDoubleElimination.isFetching || actionDoubleElimination.isError || !actionDoubleElimination.data?.completed
        : previewQuery.isFetching || previewQuery.isError || !previewQuery.data)) return;
    mutationLock.current = true;
    completeMutation.mutate(
      { id: tournamentId, stageId: actionStage.id },
      {
        onSuccess: () => {
          setActionSuccess(`Etap „${actionStage.name}” zakończony.${stages.some(stage => stage.position > actionStage.position) ? " Sprawdź kwalifikację i gotowość kolejnego etapu." : " Plan nie zawiera kolejnego etapu."}`);
        },
      },
    );
  };
  const start = () => {
    if (!canManage || !actionStage || !mayStartAction || actionStartBlockedReason || pending || mutationLock.current) return;
    mutationLock.current = true;
    const onSuccess = () => { setStartConfirmOpen(false); setActionSuccess(`Etap „${actionStage.name}” rozpoczęty.`); };
    if (tournamentStatus === "draft" && actionStage.position === 1) firstStartMutation.mutate({ id: tournamentId }, { onSuccess });
    else startMutation.mutate({ id: tournamentId, stageId: actionStage.id }, { onSuccess });
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
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
        Nie udało się pobrać etapów. <Button variant="outline" onClick={() => void stagesQuery.refetch()}>Spróbuj ponownie</Button>
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
      <div className="organizer-section-heading">
        <h2 className="text-xl font-bold">Etapy turnieju</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wybierz etap, aby zobaczyć jego uczestników, ranking, grupy i mecze.
        </p>
        <p className="mt-2 font-medium text-primary">{allStagesCompleted ? "Wszystkie etapy są zakończone. Przeglądasz historię turnieju." : stages.some(stage => stage.status === "active")
          ? `Aktywny etap: ${stages.find(stage => stage.status === "active")?.name}` : "Brak aktywnego etapu"}</p>
      </div>
      {explicitBasketAuthority && (
        <div
          className="rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2"
          data-testid="stages-explicit-basket-authority"
        >
          <Info className="h-4 w-4 shrink-0" />
          Liczby uczestników i awansów są tylko do odczytu — wynikają z konfiguracji w zakładce Koszyki.
        </div>
      )}
      <StageNavigation
        stages={stages}
        selectedStageId={selectedStageId}
        participantCounts={explicitParticipantCounts}
        onSelect={(stageId) => {
          if (pending) return;
          setSelectedStageId(stageId);
          setActionError(undefined);
          setCeremonyState(null);
        }}
      />
      {actionError && (
        <div role="alert" className="organizer-notice organizer-notice--error rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}
      {actionSuccess && <p role="status" className="organizer-notice organizer-notice--success rounded-lg border border-primary/30 p-3 text-sm text-primary">{actionSuccess}</p>}
      {pending && <p role="status" className="organizer-notice organizer-notice--pending text-sm">{qualificationPending ? "Zapisywanie i odświeżanie stanu…" : completeMutation.isPending ? "Kończenie etapu i odświeżanie danych…" : "Uruchamianie etapu i odświeżanie danych…"}</p>}
      {detailQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ładowanie danych etapu…
        </div>
      )}
      {detailQuery.error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
          Nie udało się pobrać danych etapu.{" "}
          <Button variant="outline" onClick={() => void detailQuery.refetch()}>Ponów pobranie etapu</Button>
        </div>
      )}
      {selected && detailQuery.data && !detailQuery.isError && (
        <>
          <Card className="organizer-stage-detail">
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
                  {selected.status === "planned" ? readinessQuery.data?.participantCount ?? "—" : detailQuery.data.participants.length} uczestników
                  {` · ${organizerStageSummary(selected, matches).roundLabel}`}
                </p>
              </div>
              <StageActionBar
                canManage={canManage}
                stage={selected}
                mayStart={mayStart}
                onComplete={() => openLifecycleAction("complete", selected)}
                onStart={() => openLifecycleAction("start", selected)}
                pending={pending}
                startBlockedReason={startBlockedReason}
              />
            </CardContent>
          </Card>

          {selected.status === "planned" && <div aria-label="Gotowość etapu" className="organizer-readiness rounded-lg border bg-card p-4 space-y-2">
            <h4 className="font-semibold">{startBlockedReason ? "Etap wymaga przygotowania" : "Gotowy do rozpoczęcia"}</h4>
            {readinessQuery.isError ? <><p>Nie udało się sprawdzić gotowości etapu.</p><Button variant="outline" onClick={() => void readinessQuery.refetch()}>Ponów sprawdzenie</Button></>
              : !readinessQuery.data ? <p role="status">Sprawdzanie gotowości etapu…</p>
              : <>
                {!readinessQuery.data.ready && <p className="text-sm">{readinessFeedback?.summary}</p>}
                <p className="text-sm font-medium tabular-nums">{readinessFeedback?.counts}</p>
                {!readinessQuery.data.ready && <p className="text-sm">{readinessFeedback?.action}</p>}
                {!ceremonyReady && <p className="text-sm">Dokończ ceremonię losowania przed rozpoczęciem etapu.</p>}
                {(readinessQuery.data.missingSeeds.length > 0 || !ceremonyReady || readinessQuery.data.reasonCode.startsWith("SEEDING_")) &&
                  <Button variant="outline" asChild><a href={stageHasRandomCeremony(selected) ? `#stage-ceremony-${selected.id}` : `/tournaments/${tournamentId}?tab=players`}>{stageHasRandomCeremony(selected) ? "Przejdź do losowania" : "Sprawdź seedy graczy"}</a></Button>}
                {(!readinessQuery.data.basketValidation.valid || readinessQuery.data.reasonCode === "STAGE_PARTICIPANTS_INCONSISTENT" || readinessQuery.data.reasonCode === "QUALIFICATION_CONFIGURATION_INVALID") &&
                  <Button variant="outline" asChild><Link href={`/tournaments/${tournamentId}?tab=baskets`}>Sprawdź koszyki i dopływ uczestników</Link></Button>}
                {readinessQuery.data.reasonCode === "PREVIOUS_STAGE_NOT_COMPLETED" && <p className="text-sm">Wybierz poprzedni etap na liście i sprawdź jego zakończenie.</p>}
                {!readinessQuery.data.ready && <section aria-label="Szczegóły diagnostyczne" className="pt-3 space-y-2">
                  <h5 className="text-sm font-semibold">Szczegóły diagnostyczne</h5>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">{stageReadinessMessages(readinessQuery.data, { stages, stageId: selected.id, baskets: basketConfigurationQuery.data?.baskets, routes: basketConfigurationQuery.data?.routes }).map(message => <li key={message}>{message}</li>)}</ul>
                  <p className="text-xs text-muted-foreground">Kod diagnostyczny: {readinessQuery.data.reasonCode}</p>
                </section>}
              </>}
          </div>}

          {stageHasRandomCeremony(selected) && (
            <div id={`stage-ceremony-${selected.id}`}>
            <SeedingCeremony
              tournamentId={tournamentId}
              stage={selected}
              canManage={canManage}
              audience={audience}
              onStateChange={setCeremonyState}
            />
            </div>
          )}

          {gameConfig?.gameId === "deadlock" && (
            <DeadlockStageBansSummary
              gameConfig={gameConfig}
              orderedStageKeys={stages.map((stage) => stage.stageKey)}
              stageKey={selected.stageKey}
            />
          )}

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
                  entrySeedingPolicy={selected.entrySeedingPolicy}
                  readyParticipantCount={readinessQuery.data?.ready ? readinessQuery.data.participantCount : undefined}
                />
              </CardContent>
            </Card>
          ) : gameConfig?.gameId === "marvel" &&
            selected.format === "group_stage" ? (
            <MarvelEliminationStage
              tournamentId={tournamentId}
              stageId={selected.id}
              canManage={canWriteResults}
              pollInterval={audience ? 8_000 : 5_000}
            />
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
            <div className="rounded-lg border bg-card p-4 space-y-2" aria-label="Dalsze kroki po etapie">
              {allStagesCompleted ? <p className="text-sm">Ranking i mecze etapu pozostają dostępne do przeglądania.</p> : explicitBasketAuthority && canManage && basketConfigurationQuery.data ? <StageQualificationRouting
                tournamentId={tournamentId} stage={selected} stages={stages} configuration={basketConfigurationQuery.data}
                participants={detailQuery.data.participants} onPendingChange={setQualificationPending}
                onSelectStage={id => { if (!pending) { setSelectedStageId(id); setActionError(undefined); setActionSuccess(undefined); setCeremonyState(null); } }}
              /> : !stages.some(stage => stage.position > selected.position)
                ? <p className="text-sm">Etap zakończony. Plan nie zawiera kolejnego etapu.</p>
                : <p className="text-sm">Ranking został zamrożony. Wybierz kolejny planowany etap, aby sprawdzić jego gotowość. Zakończenie nie uruchamia kolejnego etapu.</p>}
            </div>
          )}
          {selected.status === "completed" && (
            <Qualifiers qualifiers={detailQuery.data.qualifiers} />
          )}
        </>
      )}

      <Dialog
        open={canManage && confirmOpen}
        onOpenChange={(open) => {
          if (pending) return;
          setConfirmOpen(open);
          setActionError(undefined);
        }}
      >
        <DialogContent className="organizer-dialog">
          <DialogHeader>
            <DialogTitle>Zakończyć etap „{actionStage?.name}”?</DialogTitle>
            <DialogDescription>
              Ranking zostanie obliczony i zamrożony. {explicitBasketAuthority ? "Kwalifikację do koszyków trzeba następnie zatwierdzić i przekazać uczestników." : "System zapisze kwalifikantów zgodnie z konfiguracją."} Następny etap rozpoczyna się osobno, po sprawdzeniu gotowości. Cofnięcie wyniku może być zablokowane po rozpoczęciu kolejnego etapu.
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          {previewQuery.isLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sprawdzanie wyników i kwalifikantów…
            </div>
          )}
          {previewQuery.error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {stageLifecycleError(previewQuery.error)}
              <Button variant="outline" disabled={previewQuery.isFetching || pending} onClick={() => void previewQuery.refetch()}>Ponów sprawdzenie wyników</Button>
            </div>
          )}
          {previewQuery.data && <PreviewList preview={previewQuery.data} />}
          {actionStage?.format === "double_elimination" && actionDoubleElimination.data && (
            <p className="text-sm text-muted-foreground">
              {actionDoubleElimination.data.completed
                ? `Zwycięzca został wyłoniony. Serwer sprawdzi i zamknie ten etap.`
                : "Najpierw rozegraj Grand Final (oraz reset, jeśli będzie wymagany)."}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setConfirmOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={complete}
              disabled={
                pending ||
                actionStage?.status !== "active" ||
                (actionStage?.format === "double_elimination"
                  ? actionDoubleElimination.isFetching || actionDoubleElimination.isError || actionDoubleElimination.data?.completed !== true
                  : previewQuery.isFetching || previewQuery.isError || !previewQuery.data)
              }
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {completeMutation.isPending ? "Kończenie etapu…" : "Potwierdź zakończenie etapu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={startConfirmOpen} onOpenChange={open => { if (!pending) setStartConfirmOpen(open); }}>
        <DialogContent className="organizer-dialog">
          <DialogHeader><DialogTitle>Rozpocząć etap „{actionStage?.name}”?</DialogTitle>
            <DialogDescription>System utrwali skład uczestników i przygotuje mecze tego etapu. Po rozpoczęciu zmiana składu i rozstawienia będzie ograniczona.</DialogDescription>
          </DialogHeader>
          {actionStartBlockedReason && <p className="text-sm">{actionStartBlockedReason}</p>}
          {(actionReadiness.isError || actionCeremony.isError) && (
            <Button variant="outline" disabled={pending || actionReadiness.isFetching || actionCeremony.isFetching} onClick={() => {
              void actionReadiness.refetch();
              if (actionStage && stageRequiresSequentialCeremony(actionStage)) void actionCeremony.refetch();
            }}>Ponów sprawdzenie gotowości</Button>
          )}
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setStartConfirmOpen(false)}>Anuluj</Button>
            <Button disabled={pending || !mayStartAction || !!actionStartBlockedReason} onClick={start}>{pending ? "Uruchamianie…" : "Potwierdź rozpoczęcie etapu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
