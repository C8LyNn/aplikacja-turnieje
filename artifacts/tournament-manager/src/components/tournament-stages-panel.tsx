import { t, stageLabel } from "@/i18n";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTournamentStageQueryKey,
  getGetTournamentStandingsQueryKey,
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
  useGetTournamentStandings,
} from "@workspace/api-client-react";
import { DoubleEliminationBracket } from "@/components/double-elimination-bracket";
import { StageQualificationRouting } from "@/components/stage-qualification-routing";
import { MarvelEliminationStage } from "@/components/marvel-elimination-stage";
import { DeadlockStageBansSummary } from "@/components/deadlock-stage-bans-editor";
import { availableStageStartReadiness } from "@/lib/organizer-next-step";
import { organizerStageSummary } from "@/lib/organizer-stage-summary";
import { invalidateTournamentDependentQueries } from "@/lib/tournament-query-invalidation";
import { firstStageNeedsEntrants, stageReadinessFeedback, stageReadinessMessages, stageLifecycleError } from "@/lib/stage-lifecycle-feedback";
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
import { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { matchLengthText } from "@/features/experimental-tournaments/experimental-create-wizard-model";
import { setRulesOf } from "@/lib/two-leg-tie-view";
import type { MatchRules } from "@workspace/match-rules";
import type { SeedingCeremonyState } from "@/lib/seeding-ceremony-api";
import { LiveTablesLegend, StageLiveTables, useStageLiveStandings } from "@/components/stage-live-tables";
import { stageHasTable } from "@/lib/audience-views";
import type { LiveStageStandings } from "@workspace/api-client-react";
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
  /** V5.8: Experimental passes its stage map as the one list of stages (selection stays in this panel). */
  renderStageNavigation?: (props: { selectedStageId?: number; onSelect: (stageId: number) => void }) => React.ReactNode;
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
  const [navigationLocation] = useLocation();
  const matchLength = (stage: TournamentStage) => matchLengthText(stage, isExperimentalTournamentPath(navigationLocation));
  return (
    <div
      className="organizer-stage-navigation grid gap-3"
      aria-label={t("tournamentStagesPanel.etapy_turnieju")}
    >
      {stages.map((stage) => {
        const selected = stage.id === selectedStageId;
        return (
          <button
            type="button"
            key={stage.id}
            onClick={() => onSelect(stage.id)}
            aria-pressed={selected}
            data-exp-stage-status={stage.status}
            className={`organizer-stage-card rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t("tournamentStagesPanel.etap")}{" "}{stage.position}
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
              <span>{stageLabel(stage.name)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {STAGE_FORMAT_LABELS[stage.format]} · {matchLength(stage)} ·{" "}
              {(stage.status === "planned" ? participantCounts?.get(stage.id) : undefined) ?? stage.participantCount} {t("tournamentStagesPanel.graczy")}{stage.status === "planned" ? " (plan)" : ""}
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
  officialRanks,
}: {
  participants: StageParticipant[];
  matches: Match[];
  title?: string;
  groupMode?: boolean;
  /** Places from the tournament classification, used when a finished stage stored none (V5.2). */
  officialRanks?: ReadonlyMap<number, number>;
}) {
  const placeOf = (participant: StageParticipant) =>
    (groupMode ? participant.groupRank : participant.finalRank) ?? officialRanks?.get(participant.playerId) ?? null;
  const ordered = [...participants].sort((a, b) => {
    const rankA = placeOf(a);
    const rankB = placeOf(b);
    return (
      (rankA ?? Number.MAX_SAFE_INTEGER) - (rankB ?? Number.MAX_SAFE_INTEGER) ||
      a.stageSeed - b.stageSeed
    );
  });
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border bg-card">
      {title && <h4 className="break-words border-b px-4 py-3 font-semibold">{title}</h4>}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[32rem] table-fixed text-sm" aria-label={title ?? t("tournamentStagesPanel.ranking_etapu")}>
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
              <th className="px-2 py-2 text-center 2xl:px-3">{t("tournamentStagesPanel.miejsce")}</th>
              <th className="px-2 py-2 text-left 2xl:px-3">{t("tournamentStagesPanel.gracz")}</th>
              <th className="px-2 py-2 text-center 2xl:px-3">{t("tournamentStagesPanel.mecze_w_p")}</th>
              <th className="px-2 py-2 text-center 2xl:px-3">{t("tournamentStagesPanel.gry")}</th>
              <th className="px-2 py-2 text-center 2xl:px-3">+/-</th>
              <th className="px-2 py-2 text-center 2xl:px-3">{t("tournamentStagesPanel.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ordered.map((participant) => {
              const rank = placeOf(participant);
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
                        {participant.status === "winner" ? t("tournamentStagesPanel.zwyciezca") : t("tournamentStagesPanel.awans")}
                      </Badge>
                    ) : (
                      <span className="break-words text-xs text-muted-foreground">
                        {participant.status === "active" && officialRanks ? t("tournamentStagesPanel.zakonczyl") : { active: t("tournamentStagesPanel.aktywny"), eliminated: "Wyeliminowany", pending: t("tournamentStagesPanel.oczekuje"), qualified: t("tournamentStagesPanel.awans"), winner: t("tournamentStagesPanel.zwyciezca") }[participant.status]}
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

function MatchList({ matches, matchRules, stageBestOf }: { matches: Match[]; matchRules?: MatchRules | null; stageBestOf?: number | null }) {
  // V5.6: Experimental says "jedna gra / do 2 wygranych" everywhere, Stable keeps BO; V5.7: set stages say sets.
  const [navigationLocation] = useLocation();
  const experimental = isExperimentalTournamentPath(navigationLocation);
  const matchLength = (bestOf: number) => matchLengthText({ bestOf, matchRules }, experimental);
  // V5.8 (Experimental): the stage states the match length once; a match shows it only when it differs (an exception).
  const lengthNote = (bestOf: number) => !experimental || stageBestOf == null ? matchLength(bestOf)
    : bestOf === stageBestOf ? null : t("tournamentStagesPanel.wyjatek_v0", { v0: matchLength(bestOf) });
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t("tournamentStagesPanel.brak_meczow_w_tym_etapie")}</div>
    );
  }
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {matches.map((match) => (
        <div key={match.id} className="rounded-lg border bg-card p-3 text-sm">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>
              {t("tournamentStagesPanel.runda")}{" "}{match.round} {t("tournamentStagesPanel.mecz")}{" "}{match.matchNumber}
            </span>
            {lengthNote(match.bestOf) && <span data-length-exception={experimental && stageBestOf != null ? "true" : undefined}>{lengthNote(match.bestOf)}</span>}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span
              className={`truncate text-right ${match.winnerId === match.player1Id ? "font-bold text-primary" : ""}`}
            >
              {match.player1Name ?? t("tournamentStagesPanel.tbd")}
            </span>
            <span className="rounded bg-muted px-2 py-1 font-mono font-bold">
              {match.score1 ?? "—"}:{match.score2 ?? "—"}
            </span>
            <span
              className={`truncate ${match.winnerId === match.player2Id ? "font-bold text-primary" : ""}`}
            >
              {match.player2Name ?? t("tournamentStagesPanel.tbd")}
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
  live,
}: {
  details: TournamentStageDetails;
  matches: Match[];
  /** V5.4: engine-ranked tables (points, draws, advancing places); falls back to match records. */
  live?: LiveStageStandings;
}) {
  return (
    <div
      className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,36rem),1fr))] gap-5"
      aria-label={t("tournamentStagesPanel.length_grup_etapu", { length: details.groups.length })}
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
            aria-label={t("tournamentStagesPanel.grupa_groupkey", { groupKey: group.groupKey })}
          >
            {live?.tables.some((table) => table.groupId === group.id) ? (
              <StageLiveTables data={live} groupId={group.id} />
            ) : (
              <ParticipantTable
                participants={participants}
                matches={groupMatches}
                title={t("tournamentStagesPanel.grupa_groupkey", { groupKey: group.groupKey })}
                groupMode
              />
            )}
            <div>
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("tournamentStagesPanel.mecze_grupy")}</h5>
              <MatchList matches={groupMatches} matchRules={live?.matchRules} stageBestOf={details.stage.bestOf} />
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
          ? t("tournamentStagesPanel.sklad_gotowy_wedlug_serwera_readypartici", { readyParticipantCount: readyParticipantCount })
          : stagePosition === 1
          ? t("tournamentStagesPanel.uczestnicy_pierwszego_etapu_pochodza_z")
          : t("tournamentStagesPanel.uczestnicy_pojawia_sie_po_kwalifikacji")}
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
        {t("tournamentStagesPanel.zakoncz_etap")}</Button>
    );
  }
  if (stage.status === "planned") {
    return (
      <div className="text-right">
        <Button onClick={onStart} disabled={pending || !mayStart || !!startBlockedReason} title={startBlockedReason}>
          <Play className="mr-2 h-4 w-4" />
          {t("tournamentStagesPanel.rozpocznij_etap")}</Button>
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
          {t("tournamentStagesPanel.zakwalifikowani_do_kolejnego_etapu")}</CardTitle>
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
                    {t("tournamentStagesPanel.grupa")}{" "}{participant.groupKey}
                  </span>
                )}
              </div>
              <Badge variant="secondary">
                {t("tournamentStagesPanel.seed")}{" "}
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
        {t("tournamentStagesPanel.podglad_nie_wskazuje_kwalifikantow_do")}</p>
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
            {qualifier.groupKey ? t("tournamentStagesPanel.grupa_groupkey_2", { groupKey: qualifier.groupKey }) : ""}
          </span>
          <Badge>{t("tournamentStagesPanel.seed")}{" "}{qualifier.nextStageSeed}</Badge>
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
  renderStageNavigation,
}: TournamentStagesPanelProps) {
  const queryClient = useQueryClient();
  const search = useSearch();
  const [location, navigate] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);
  const searchParams = new URLSearchParams(search);
  const requestedStageId = Number(searchParams.get("stage")) || undefined;
  const requestedAction = searchParams.get("action");
  // Set when the action was opened from the live host panel; that panel is where the organizer continues.
  const returnToHost = useRef(false);
  const backToHostAfterSuccess = () => {
    if (!returnToHost.current) return;
    returnToHost.current = false;
    navigate(tournamentHref(tournamentId, isExperimental, "/host?tab=prowadzenie"));
  };
  const [selectedStageId, setSelectedStageId] = useState<number>();
  useEffect(() => { if (requestedStageId && !requestedAction) setSelectedStageId(requestedStageId); }, [requestedStageId, requestedAction]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [actionStageId, setActionStageId] = useState<number>();
  const [actionSnapshot, setActionSnapshot] = useState<{
    tournamentId: number; tournamentStatus: TournamentStagesPanelProps["tournamentStatus"];
    stageId: number; version: number; status: TournamentStage["status"];
    action: "start" | "complete";
  } | null>(null);
  const [lifecycleChecking, setLifecycleChecking] = useState(false);
  const currentLifecycleContext = useRef({ tournamentId, tournamentStatus, canManage });
  currentLifecycleContext.current = { tournamentId, tournamentStatus, canManage };
  const lifecycleMounted = useRef(true);
  useEffect(() => {
    lifecycleMounted.current = true;
    return () => { lifecycleMounted.current = false; };
  }, []);
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
  // V5.4-006: engine-ranked tables for group / league / Swiss stages (same order as stage completion).
  const liveStandingsQuery = useStageLiveStandings(tournamentId, selected?.id, {
    enabled: !!selected && selected.status !== "planned" && stageHasTable(selected.format),
    refetchInterval: audience ? 8000 : 5000,
  });
  const actionStage = stages.find((stage) => stage.id === actionStageId);
  const lifecycleModalStale = !!actionSnapshot && (
    actionSnapshot.tournamentId !== tournamentId ||
    actionSnapshot.tournamentStatus !== tournamentStatus ||
    actionSnapshot.stageId !== actionStage?.id ||
    actionSnapshot.version !== actionStage?.version ||
    actionSnapshot.status !== actionStage?.status
  );
  const lifecycleStaleMessage = t("tournamentStagesPanel.stan_etapu_zmienil_sie_od");
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
  // Single-stage tournaments finished by their last result keep no per-stage places; the
  // classification computed by the engine is the source of truth for the final order.
  const singleStageFinished = stages.length === 1 && stages[0]?.status === "completed";
  const officialStandings = useGetTournamentStandings(tournamentId, { query: { enabled: singleStageFinished, queryKey: getGetTournamentStandingsQueryKey(tournamentId) } });
  const officialRanks = useMemo(() => {
    const rows = singleStageFinished && Array.isArray(officialStandings.data) ? officialStandings.data : [];
    return rows.length ? new Map(rows.map((row) => [row.playerId, row.rank])) : undefined;
  }, [singleStageFinished, officialStandings.data]);
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
    setActionSnapshot({
      tournamentId, tournamentStatus, stageId: target.id,
      version: target.version, status: target.status, action,
    });
    setActionError(undefined);
    setStartConfirmOpen(action === "start");
    setConfirmOpen(action === "complete");
  }, [canManage, pending, tournamentId, tournamentStatus]);
  useEffect(() => {
    if ((requestedAction !== "start" && requestedAction !== "complete") || !requestedStageId || !stagesQuery.data) return;
    const target = stages.find(stage => stage.id === requestedStageId);
    if (target) openLifecycleAction(requestedAction, target);
    // Consume the action, so the same CTA can be used again after cancellation.
    // Selection remains navigation state, never the trigger or target of an action.
    const params = new URLSearchParams(search);
    returnToHost.current = params.get("return") === "host";
    params.delete("action");
    params.delete("stage");
    params.delete("return");
    navigate(`${location}?${params}`, { replace: true });
  }, [search, requestedAction, requestedStageId, stagesQuery.data, stages, openLifecycleAction, location, navigate]);
  const ceremonyReady = !selected || isSequentialCeremonyReady(selected, ceremonyState);
  const readinessFeedback = selected && readinessQuery.data
    ? stageReadinessFeedback(readinessQuery.data, stageLabel(selected.name), { firstStage: selected.position === 1 }) : undefined;
  const needsEntrants = !!selected && !!readinessQuery.data && firstStageNeedsEntrants(readinessQuery.data, selected.position === 1);
  const startBlockedReason = readinessQuery.isError ? t("tournamentStagesPanel.nie_udalo_sie_sprawdzic_gotowosci_2")
    : readinessQuery.isFetching || !readinessQuery.data ? t("tournamentStagesPanel.sprawdzanie_gotowosci_etapu")
    : needsEntrants ? t("tournamentStagesPanel.najpierw_dodaj_uczestnikow_participantco", { participantCount: readinessQuery.data.participantCount, requiredParticipantCount: readinessQuery.data.requiredParticipantCount })
    : !readinessQuery.data.ready ? stageReadinessFeedback(readinessQuery.data, stageLabel(selected?.name) ?? t("tournamentStagesPanel.etap"), { firstStage: selected?.position === 1 }).summary
    : !ceremonyReady ? t("tournamentStagesPanel.dokoncz_ceremonie_losowania_przed_rozpoc") : undefined;
  const actionStartBlockedReason = actionReadiness.isError || actionCeremony.isError
    ? t("tournamentStagesPanel.nie_udalo_sie_sprawdzic_gotowosci_2")
    : actionReadiness.isFetching || !actionReadiness.data || actionCeremony.isFetching
    ? t("tournamentStagesPanel.sprawdzanie_gotowosci_etapu")
    : !actionReadiness.data.ready ? stageReadinessMessages(actionReadiness.data, { stages, stageId: actionStage?.id }).join(" ")
    : actionStage && !isSequentialCeremonyReady(actionStage, actionCeremony.data?.ceremony ?? null)
    ? t("tournamentStagesPanel.dokoncz_ceremonie_losowania_przed_rozpoc") : undefined;
  const mayStartAction = canManage && !lifecycleModalStale && actionStage?.status === "planned" && actionReadiness.data?.ready === true;

  const refresh = async () => {
    await invalidateTournamentDependentQueries(queryClient, tournamentId);
    await onChanged?.();
  };

  // Fresh readback reduces stale-modal writes; this is NOT server-side CAS.
  const verifyLifecycleStage = async (action: "start" | "complete") => {
    const snapshot = actionSnapshot;
    if (!snapshot || snapshot.action !== action || lifecycleModalStale) return false;
    try {
      const latest = await stagesQuery.refetch();
      const fresh = latest.data?.find(stage => stage.id === snapshot.stageId);
      const context = currentLifecycleContext.current;
      if (!lifecycleMounted.current || latest.isError || !fresh || !context.canManage ||
        context.tournamentId !== snapshot.tournamentId ||
        context.tournamentStatus !== snapshot.tournamentStatus ||
        fresh.tournamentId !== snapshot.tournamentId ||
        fresh.version !== snapshot.version || fresh.status !== snapshot.status) {
        setActionError(lifecycleStaleMessage);
        return false;
      }
      return true;
    } catch {
      setActionError(t("tournamentStagesPanel.nie_udalo_sie_ponownie_sprawdzic"));
      return false;
    }
  };
  const complete = async () => {
    if (!canManage || !actionStage || lifecycleModalStale || lifecycleChecking || actionStage.status !== "active" || pending || mutationLock.current ||
      (actionStage.format === "double_elimination" ? actionDoubleElimination.isFetching || actionDoubleElimination.isError || !actionDoubleElimination.data?.completed
        : previewQuery.isFetching || previewQuery.isError || !previewQuery.data)) return;
    mutationLock.current = true;
    setLifecycleChecking(true);
    const verified = await verifyLifecycleStage("complete");
    setLifecycleChecking(false);
    if (!verified) { mutationLock.current = false; return; }
    completeMutation.mutate(
      { id: tournamentId, stageId: actionStage.id },
      {
        onSuccess: () => {
          setActionSuccess(t("tournamentStagesPanel.etap_name_zakonczony_v1", { name: stageLabel(actionStage.name), v1: stages.some(stage => stage.position > actionStage.position) ? t("tournamentStagesPanel.sprawdz_kwalifikacje_i_gotowosc_kolejneg") : t("tournamentStagesPanel.plan_nie_zawiera_kolejnego_etapu") }));
          backToHostAfterSuccess();
        },
      },
    );
  };
  const start = async () => {
    if (!canManage || !actionStage || lifecycleChecking || !mayStartAction || actionStartBlockedReason || pending || mutationLock.current) return;
    mutationLock.current = true;
    setLifecycleChecking(true);
    const verified = await verifyLifecycleStage("start");
    setLifecycleChecking(false);
    if (!verified) { mutationLock.current = false; return; }
    const onSuccess = () => { setStartConfirmOpen(false); setActionSuccess(t("tournamentStagesPanel.etap_name_rozpoczety", { name: stageLabel(actionStage.name) })); backToHostAfterSuccess(); };
    if (tournamentStatus === "draft" && actionStage.position === 1) firstStartMutation.mutate({ id: tournamentId }, { onSuccess });
    else startMutation.mutate({ id: tournamentId, stageId: actionStage.id }, { onSuccess });
  };

  if (stagesQuery.isLoading)
    return (
      <div className="read-query-state read-query-state--loading flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("tournamentStagesPanel.ladowanie_etapow")}</div>
    );
  if (stagesQuery.error)
    return (
      <div role="alert" className="read-query-state read-query-state--error rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
        {t("tournamentStagesPanel.nie_udalo_sie_pobrac_etapow")}{" "}<Button variant="outline" onClick={() => void stagesQuery.refetch()}>{t("tournamentStagesPanel.sprobuj_ponownie")}</Button>
      </div>
    );
  if (stages.length === 0)
    return (
      <div className="organizer-empty-state rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {t("tournamentStagesPanel.ten_turniej_nie_ma_jeszcze")}</div>
    );

  return (
    <section
      className={`space-y-5 ${audience ? "w-full max-w-5xl" : ""}`}
      aria-label={t("tournamentStagesPanel.przebieg_etapow_turnieju")}
    >
      <div className="organizer-section-heading">
        <h2 className="text-xl font-bold">{t("tournamentStagesPanel.etapy_turnieju")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("tournamentStagesPanel.wybierz_etap_aby_zobaczyc_jego")}</p>
        {(allStagesCompleted || !renderStageNavigation) && <p className="mt-2 font-medium text-primary">{allStagesCompleted ? t("tournamentStagesPanel.wszystkie_etapy_sa_zakonczone_przegladas") : stages.some(stage => stage.status === "active")
          ? t("tournamentStagesPanel.aktywny_etap_name", { name: stageLabel(stages.find(stage => stage.status === "active")?.name) }) : t("tournamentStagesPanel.brak_aktywnego_etapu")}</p>}
      </div>
      {explicitBasketAuthority && (
        <div
          className="rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2"
          data-testid="stages-explicit-basket-authority"
        >
          <Info className="h-4 w-4 shrink-0" />
          {t("tournamentStagesPanel.liczby_uczestnikow_i_awansow_sa")}</div>
      )}
      {(() => {
        const selectStage = (stageId: number) => {
          if (pending) return;
          setSelectedStageId(stageId);
          setActionError(undefined);
          setCeremonyState(null);
        };
        // V5.8: Experimental passes its stage map, which then is the one list of stages on this screen.
        return renderStageNavigation ? renderStageNavigation({ selectedStageId, onSelect: selectStage }) : (
          <StageNavigation
            stages={stages}
            selectedStageId={selectedStageId}
            participantCounts={explicitParticipantCounts}
            onSelect={selectStage}
          />
        );
      })()}
      {actionError && (
        <div role="alert" className="organizer-notice organizer-notice--error rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}
      {actionSuccess && <p role="status" className="organizer-notice organizer-notice--success rounded-lg border border-primary/30 p-3 text-sm text-primary">{actionSuccess}</p>}
      {pending && <p role="status" className="organizer-notice organizer-notice--pending text-sm">{qualificationPending ? t("tournamentStagesPanel.zapisywanie_i_odswiezanie_stanu") : completeMutation.isPending ? t("tournamentStagesPanel.konczenie_etapu_i_odswiezanie_danych") : t("tournamentStagesPanel.uruchamianie_etapu_i_odswiezanie_danych")}</p>}
      {detailQuery.isLoading && (
        <div className="read-query-state read-query-state--loading flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("tournamentStagesPanel.ladowanie_danych_etapu")}</div>
      )}
      {detailQuery.error && (
        <div className="read-query-state read-query-state--error rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
          {t("tournamentStagesPanel.nie_udalo_sie_pobrac_danych")}{" "}
          <Button variant="outline" onClick={() => void detailQuery.refetch()}>{t("tournamentStagesPanel.ponow_pobranie_etapu")}</Button>
        </div>
      )}
      {selected && detailQuery.data && !detailQuery.isError && (
        <>
          <Card data-exp-stage-status={selected.status} className="organizer-stage-detail">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{stageLabel(selected.name)}</h3>
                  <Badge data-stage-status={isExperimental ? selected.status : undefined}>{STAGE_STATUS_LABELS[selected.status]}</Badge>
                  {selected.status === "active" && !isExperimental && (
                    <Badge className="bg-green-500/15 text-green-600">
                      {t("tournamentStagesPanel.aktualny_etap")}</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isExperimental && STAGE_FORMAT_LABELS[selected.format] === selected.name ? null : <>{STAGE_FORMAT_LABELS[selected.format]} · </>}{matchLengthText(selected, isExperimental)} ·{" "}
                  {selected.status === "planned" ? readinessQuery.data?.participantCount ?? "—" : detailQuery.data.participants.length} {t("tournamentStagesPanel.uczestnikow")}{` · ${organizerStageSummary(selected, matches).roundLabel}`}
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

          {selected.status === "planned" && <div aria-label={t("tournamentStagesPanel.gotowosc_etapu")} data-exp-ready={readinessQuery.data?.ready ? "true" : "false"} className="organizer-readiness rounded-lg border bg-card p-4 space-y-2">
            <h4 className="font-semibold">{needsEntrants && readinessQuery.data
              ? t("tournamentStagesPanel.brakuje_v0_uczestnikow", { v0: readinessQuery.data.requiredParticipantCount - readinessQuery.data.participantCount })
              : startBlockedReason ? t("tournamentStagesPanel.etap_wymaga_przygotowania") : t("tournamentStagesPanel.gotowy_do_rozpoczecia")}</h4>
            {readinessQuery.isError ? <><p>{t("tournamentStagesPanel.nie_udalo_sie_sprawdzic_gotowosci")}</p><Button variant="outline" onClick={() => void readinessQuery.refetch()}>{t("tournamentStagesPanel.ponow_sprawdzenie")}</Button></>
              : !readinessQuery.data ? <p role="status">{t("tournamentStagesPanel.sprawdzanie_gotowosci_etapu")}</p>
              : <>
                {!readinessQuery.data.ready && !needsEntrants && <p className="text-sm">{readinessFeedback?.summary}</p>}
                <p className="text-sm font-medium tabular-nums">{readinessFeedback?.counts}</p>
                {!readinessQuery.data.ready && !needsEntrants && <p className="text-sm">{readinessFeedback?.action}</p>}
                {!ceremonyReady && <p className="text-sm">{t("tournamentStagesPanel.dokoncz_ceremonie_losowania_przed_rozpoc")}</p>}
                {needsEntrants && <Button asChild><Link href={tournamentHref(tournamentId, isExperimental, "?tab=players")}>{t("tournamentStagesPanel.dodaj_uczestnikow")}</Link></Button>}
                {!needsEntrants && (readinessQuery.data.missingSeeds.length > 0 || !ceremonyReady || readinessQuery.data.reasonCode.startsWith("SEEDING_")) &&
                  <Button variant="outline" asChild><a href={stageHasRandomCeremony(selected) ? `#stage-ceremony-${selected.id}` : tournamentHref(tournamentId, isExperimental, "?tab=players")}>{stageHasRandomCeremony(selected) ? t("tournamentStagesPanel.przejdz_do_losowania") : t("tournamentStagesPanel.sprawdz_seedy_graczy")}</a></Button>}
                {(!readinessQuery.data.basketValidation.valid || (!needsEntrants && readinessQuery.data.reasonCode === "STAGE_PARTICIPANTS_INCONSISTENT") || readinessQuery.data.reasonCode === "QUALIFICATION_CONFIGURATION_INVALID") &&
                  <Button variant="outline" asChild><Link href={tournamentHref(tournamentId, isExperimental, "?tab=baskets")}>{t("tournamentStagesPanel.sprawdz_koszyki_i_doplyw_uczestnikow")}</Link></Button>}
                {readinessQuery.data.reasonCode === "PREVIOUS_STAGE_NOT_COMPLETED" && <p className="text-sm">{t("tournamentStagesPanel.wybierz_poprzedni_etap_na_liscie")}</p>}
                {!readinessQuery.data.ready && !needsEntrants && <section aria-label={t("tournamentStagesPanel.szczegoly_diagnostyczne")} className="pt-3 space-y-2">
                  <h5 className="text-sm font-semibold">{t("tournamentStagesPanel.szczegoly_diagnostyczne")}</h5>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">{stageReadinessMessages(readinessQuery.data, { stages, stageId: selected.id, baskets: basketConfigurationQuery.data?.baskets, routes: basketConfigurationQuery.data?.routes }).map(message => <li key={message}>{message}</li>)}</ul>
                  <p className="text-xs text-muted-foreground">{t("tournamentStagesPanel.kod_diagnostyczny")}{" "}{readinessQuery.data.reasonCode}</p>
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
                  {t("tournamentStagesPanel.oczekujacy_uczestnicy")}</CardTitle>
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
              <div className="read-query-state read-query-state--loading flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("tournamentStagesPanel.ladowanie_drabinki_podwojnej_eliminacji")}</div>
            ) : doubleEliminationQuery.error ? (
              <div className="read-query-state read-query-state--error rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
                {t("tournamentStagesPanel.nie_udalo_sie_pobrac_drabinki")}{" "}{getApiErrorMessage(doubleEliminationQuery.error)}
              </div>
            ) : doubleEliminationQuery.data ? (
              <DoubleEliminationBracket
                tournamentId={tournamentId}
                stageId={selected.id}
                state={doubleEliminationQuery.data}
                canManage={canWriteResults}
                canReset={canManage}
                onChanged={refresh}
                matchRules={setRulesOf(selected.matchRules ?? null)}
                // V5.7: set results are entered only in the match editor (Stable included), never in a short form.
                openMatchHref={isExperimental || selected.matchRules ? (matchId) => tournamentHref(tournamentId, isExperimental, `/host?match=${matchId}`) : undefined}
              />
            ) : null
          ) : selected.format === "group_stage" ? (
            <div className="space-y-3">
              <StageGroupTables
                details={detailQuery.data}
                matches={selectedMatches}
                live={liveStandingsQuery.data}
              />
              {liveStandingsQuery.data && <LiveTablesLegend data={liveStandingsQuery.data} />}
            </div>
          ) : (
            <div className="space-y-5">
              {liveStandingsQuery.data && liveStandingsQuery.data.tables.length > 0 ? (
                <StageLiveTables data={liveStandingsQuery.data} />
              ) : (
                <ParticipantTable
                  participants={detailQuery.data.participants}
                  matches={selectedMatches}
                  officialRanks={selected.status === "completed" ? officialRanks : undefined}
                  title={
                    selected.status === "completed"
                      ? t("tournamentStagesPanel.koncowe_miejsca_etapu")
                      : t("tournamentStagesPanel.ranking_etapu")
                  }
                />
              )}
              <div>
                <h4 className="mb-3 font-semibold">{t("tournamentStagesPanel.mecze_etapu")}</h4>
                <MatchList matches={selectedMatches} matchRules={selected.matchRules} stageBestOf={selected.bestOf} />
              </div>
            </div>
          )}
          {selected.status === "active" && selected.id === activeStageId && !liveStandingsQuery.data && (
            <p className="text-xs text-muted-foreground">
              {t("tournamentStagesPanel.bilans_obejmuje_wylacznie_mecze_tego")}</p>
          )}
          {selected.status === "completed" && (
            <div className="rounded-lg border bg-card p-4 space-y-2" aria-label={t("tournamentStagesPanel.dalsze_kroki_po_etapie")}>
              {allStagesCompleted ? <p className="text-sm">{t("tournamentStagesPanel.ranking_i_mecze_etapu_pozostaja")}</p> : explicitBasketAuthority && canManage && basketConfigurationQuery.data ? <StageQualificationRouting
                tournamentId={tournamentId} stage={selected} stages={stages} configuration={basketConfigurationQuery.data}
                participants={detailQuery.data.participants} onPendingChange={setQualificationPending}
                onSelectStage={id => { if (!pending) { setSelectedStageId(id); setActionError(undefined); setActionSuccess(undefined); setCeremonyState(null); } }}
              /> : !stages.some(stage => stage.position > selected.position)
                ? <p className="text-sm">{t("tournamentStagesPanel.etap_zakonczony_plan_nie_zawiera")}</p>
                : <p className="text-sm">{t("tournamentStagesPanel.ranking_zostal_zamrozony_wybierz_kolejny")}</p>}
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
          if (pending || lifecycleChecking) return;
          setConfirmOpen(open);
          if (!open) setActionSnapshot(null);
          setActionError(undefined);
        }}
      >
        <DialogContent className="organizer-dialog">
          <DialogHeader>
            <DialogTitle>{t("tournamentStagesPanel.zakonczyc_etap")}{stageLabel(actionStage?.name)}”?</DialogTitle>
            <DialogDescription>
              {t("tournamentStagesPanel.ranking_zostanie_obliczony_i_zamrozony")}{" "}{explicitBasketAuthority ? t("tournamentStagesPanel.kwalifikacje_do_koszykow_trzeba_nastepni") : t("tournamentStagesPanel.system_zapisze_kwalifikantow_zgodnie_z")} {t("tournamentStagesPanel.nastepny_etap_rozpoczyna_sie_osobno")}</DialogDescription>
          </DialogHeader>
          {!pending && lifecycleModalStale && <p role="alert" className="text-sm text-destructive">{lifecycleStaleMessage}</p>}
          {!lifecycleModalStale && actionError && <p className="text-sm text-destructive">{actionError}</p>}
          {previewQuery.isLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("tournamentStagesPanel.sprawdzanie_wynikow_i_kwalifikantow")}</div>
          )}
          {previewQuery.error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {stageLifecycleError(previewQuery.error)}
              <Button variant="outline" disabled={previewQuery.isFetching || pending} onClick={() => void previewQuery.refetch()}>{t("tournamentStagesPanel.ponow_sprawdzenie_wynikow")}</Button>
            </div>
          )}
          {previewQuery.data && <PreviewList preview={previewQuery.data} />}
          {actionStage?.format === "double_elimination" && actionDoubleElimination.data && (
            <p className="text-sm text-muted-foreground">
              {actionDoubleElimination.data.completed
                ? t("tournamentStagesPanel.zwyciezca_zostal_wyloniony_zakonczenie_e")
                : t("tournamentStagesPanel.najpierw_rozegraj_grand_final_oraz")}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={pending || lifecycleChecking} onClick={() => { setConfirmOpen(false); setActionSnapshot(null); }}>
              {t("tournamentStagesPanel.anuluj")}</Button>
            <Button
              onClick={complete}
              disabled={
                pending ||
                lifecycleChecking || lifecycleModalStale || !actionSnapshot ||
                actionStage?.status !== "active" ||
                (actionStage?.format === "double_elimination"
                  ? actionDoubleElimination.isFetching || actionDoubleElimination.isError || actionDoubleElimination.data?.completed !== true
                  : previewQuery.isFetching || previewQuery.isError || !previewQuery.data)
              }
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {completeMutation.isPending ? t("tournamentStagesPanel.konczenie_etapu") : t("tournamentStagesPanel.potwierdz_zakonczenie_etapu")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={startConfirmOpen} onOpenChange={open => { if (!pending && !lifecycleChecking) { setStartConfirmOpen(open); if (!open) setActionSnapshot(null); } }}>
        <DialogContent className="organizer-dialog">
          <DialogHeader><DialogTitle>{t("tournamentStagesPanel.rozpoczac_etap")}{stageLabel(actionStage?.name)}”?</DialogTitle>
            <DialogDescription>{t("tournamentStagesPanel.system_utrwali_sklad_uczestnikow_i")}</DialogDescription>
          </DialogHeader>
          {!pending && lifecycleModalStale && <p role="alert" className="text-sm text-destructive">{lifecycleStaleMessage}</p>}
          {pending ? <p role="status" className="text-sm text-muted-foreground">{t("tournamentStagesPanel.uruchamianie_etapu_i_przygotowanie_meczo")}</p> : actionStartBlockedReason && <p className="text-sm">{actionStartBlockedReason}</p>}
          {(actionReadiness.isError || actionCeremony.isError) && (
            <Button variant="outline" disabled={pending || actionReadiness.isFetching || actionCeremony.isFetching} onClick={() => {
              void actionReadiness.refetch();
              if (actionStage && stageRequiresSequentialCeremony(actionStage)) void actionCeremony.refetch();
            }}>{t("tournamentStagesPanel.ponow_sprawdzenie_gotowosci")}</Button>
          )}
          {!lifecycleModalStale && actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={pending || lifecycleChecking} onClick={() => { setStartConfirmOpen(false); setActionSnapshot(null); }}>{t("tournamentStagesPanel.anuluj")}</Button>
            <Button disabled={pending || lifecycleChecking || !actionSnapshot || !mayStartAction || !!actionStartBlockedReason} onClick={start}>{pending ? t("tournamentStagesPanel.uruchamianie") : t("tournamentStagesPanel.potwierdz_rozpoczecie_etapu")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
