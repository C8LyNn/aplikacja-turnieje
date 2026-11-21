import { t } from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMarvelEliminationStageQueryKey,
  getGetTournamentQueryKey,
  getListTournamentStagesQueryKey,
  type MarvelEliminationGroup,
  type MarvelEliminationStageState,
  useAssignMarvelEliminationManualGroups,
  useGetMarvelEliminationStage,
  useSubmitMarvelEliminationGroupResult,
} from "@workspace/api-client-react";
import { ArrowDown, ArrowRight, Loader2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";
import { cn } from "@/lib/utils";

interface MarvelEliminationStageProps {
  tournamentId: number;
  stageId: number;
  canManage?: boolean;
  pollInterval?: number;
}

function regroupingLabel(strategy: string): string {
  if (strategy === "random") return t("marvelEliminationStage.losowanie");
  if (strategy === "manual") return t("marvelEliminationStage.reczny_podzial");
  return t("marvelEliminationStage.polacz_sasiednie_grupy");
}

function invalidateMarvelState(
  queryClient: ReturnType<typeof useQueryClient>,
  tournamentId: number,
  stageId: number,
): void {
  void queryClient.invalidateQueries({
    queryKey: getGetMarvelEliminationStageQueryKey(tournamentId, stageId),
  });
  void queryClient.invalidateQueries({
    queryKey: getGetTournamentQueryKey(tournamentId),
  });
  void queryClient.invalidateQueries({
    queryKey: getListTournamentStagesQueryKey(tournamentId),
  });
}

function GroupResultEditor({
  tournamentId,
  stageId,
  group,
}: {
  tournamentId: number;
  stageId: number;
  group: MarvelEliminationGroup;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useSubmitMarvelEliminationGroupResult();
  const [playerIds, setPlayerIds] = useState<number[]>([]);
  const [kills, setKills] = useState<Record<number, string>>({});

  useEffect(() => {
    const ordered = [...group.entries]
      .sort((left, right) => left.groupSlot - right.groupSlot)
      .map((entry) => entry.playerId);
    setPlayerIds(ordered);
    setKills(
      Object.fromEntries(
        group.entries.map((entry) => [
          entry.playerId,
          entry.kills == null ? "" : String(entry.kills),
        ]),
      ),
    );
  }, [group]);

  const entryByPlayerId = useMemo(
    () => new Map(group.entries.map((entry) => [entry.playerId, entry])),
    [group.entries],
  );
  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= playerIds.length) return;
    setPlayerIds((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      <p className="text-xs font-medium">{t("marvelEliminationStage.koncowa_kolejnosc")}</p>
      {playerIds.map((playerId, index) => {
        const entry = entryByPlayerId.get(playerId);
        if (!entry) return null;
        return (
          <div
            key={playerId}
            className="grid grid-cols-[2rem_1fr_5rem_auto] items-center gap-2"
          >
            <span className="text-center font-mono text-sm font-bold">
              {index + 1}.
            </span>
            <span className="min-w-0 truncate text-sm">{entry.playerName}</span>
            <Input
              aria-label={t("marvelEliminationStage.kille_playername", { playerName: entry.playerName })}
              type="number"
              min={0}
              value={kills[playerId] ?? ""}
              onChange={(event) =>
                setKills((current) => ({
                  ...current,
                  [playerId]: event.target.value,
                }))
              }
              placeholder={t("marvelEliminationStage.kille")}
            />
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={t("marvelEliminationStage.przesun_playername_wyzej", { playerName: entry.playerName })}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={index === playerIds.length - 1}
                onClick={() => move(index, 1)}
                aria-label={t("marvelEliminationStage.przesun_playername_nizej", { playerName: entry.playerName })}
              >
                ↓
              </Button>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {t("marvelEliminationStage.kolejnosc_jest_autorytatywna_kille_sa")}</p>
      <Button
        type="button"
        className="w-full"
        disabled={
          mutation.isPending || playerIds.length !== group.entries.length
        }
        onClick={() =>
          mutation.mutate(
            {
              id: tournamentId,
              stageId,
              groupId: group.id,
              data: {
                placements: playerIds.map((playerId) => ({
                  playerId,
                  ...(kills[playerId]?.trim()
                    ? { kills: Number.parseInt(kills[playerId], 10) }
                    : {}),
                })),
              },
            },
            {
              onSuccess: () => {
                invalidateMarvelState(queryClient, tournamentId, stageId);
                toast({ title: t("marvelEliminationStage.zapisano_wynik_grupy") });
              },
              onError: (error) =>
                toast({
                  title: t("marvelEliminationStage.nie_udalo_sie_zapisac_wyniku"),
                  description: getApiErrorMessage(error),
                  variant: "destructive",
                }),
            },
          )
        }
      >
        {mutation.isPending ? t("marvelEliminationStage.zapisywanie") : t("marvelEliminationStage.zatwierdz_wynik_grupy")}
      </Button>
    </div>
  );
}

function ManualGroupingEditor({
  tournamentId,
  stageId,
  state,
}: {
  tournamentId: number;
  stageId: number;
  state: MarvelEliminationStageState;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useAssignMarvelEliminationManualGroups();
  const pendingRound = state.rounds.find(
    (round) => round.status === "awaiting_manual",
  );
  const previousRound = pendingRound
    ? state.rounds.find(
        (round) => round.roundNumber === pendingRound.roundNumber - 1,
      )
    : undefined;
  const qualifiers = useMemo(
    () =>
      previousRound?.groups.flatMap((group) =>
        group.entries
          .filter((entry) => entry.qualified)
          .sort(
            (left, right) => (left.placement ?? 0) - (right.placement ?? 0),
          ),
      ) ?? [],
    [previousRound],
  );
  const groupCount = Math.max(
    1,
    Math.ceil(qualifiers.length / state.config.groupSize),
  );
  const [groupByPlayerId, setGroupByPlayerId] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    setGroupByPlayerId(
      Object.fromEntries(
        qualifiers.map((entry, index) => [
          entry.playerId,
          Math.floor(index / state.config.groupSize) + 1,
        ]),
      ),
    );
  }, [qualifiers, state.config.groupSize]);

  if (!pendingRound) return null;

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <p className="font-semibold">
          {t("marvelEliminationStage.runda")}{" "}{pendingRound.roundNumber}{t("marvelEliminationStage.ustaw_grupy_recznie")}</p>
        <p className="text-xs text-muted-foreground">
          {t("marvelEliminationStage.kazdy_kwalifikant_musi_znalezc_sie")}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {qualifiers.map((entry) => (
          <div
            key={entry.playerId}
            className="flex items-center justify-between gap-3 rounded border bg-background p-2"
          >
            <span className="min-w-0 truncate text-sm">{entry.playerName}</span>
            <Select
              value={String(groupByPlayerId[entry.playerId] ?? 1)}
              onValueChange={(value) =>
                setGroupByPlayerId((current) => ({
                  ...current,
                  [entry.playerId]: Number(value),
                }))
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: groupCount }, (_, index) => (
                  <SelectItem key={index + 1} value={String(index + 1)}>
                    {t("marvelEliminationStage.grupa")}{" "}{String.fromCharCode(65 + index)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button
        type="button"
        disabled={mutation.isPending}
        onClick={() => {
          const groups = Array.from({ length: groupCount }, (_, index) => ({
            position: index + 1,
            playerIds: qualifiers
              .filter((entry) => groupByPlayerId[entry.playerId] === index + 1)
              .map((entry) => entry.playerId),
          }));
          mutation.mutate(
            { id: tournamentId, stageId, data: { groups } },
            {
              onSuccess: () => {
                invalidateMarvelState(queryClient, tournamentId, stageId);
                toast({ title: t("marvelEliminationStage.zapisano_reczny_podzial_grup") });
              },
              onError: (error) =>
                toast({
                  title: t("marvelEliminationStage.nie_udalo_sie_zapisac_grup"),
                  description: getApiErrorMessage(error),
                  variant: "destructive",
                }),
            },
          );
        }}
      >
        {mutation.isPending ? t("marvelEliminationStage.zapisywanie") : t("marvelEliminationStage.zatwierdz_podzial")}
      </Button>
    </div>
  );
}

export function MarvelEliminationStage({
  tournamentId,
  stageId,
  canManage = false,
  pollInterval = 10_000,
}: MarvelEliminationStageProps) {
  const query = useGetMarvelEliminationStage(tournamentId, stageId, {
    query: {
      enabled: tournamentId > 0 && stageId > 0,
      retry: false,
      queryKey: getGetMarvelEliminationStageQueryKey(tournamentId, stageId),
      refetchInterval: pollInterval,
    },
  });

  if (query.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("marvelEliminationStage.ladowanie_eliminacyjnych_grup_marvel")}</div>
    );
  }
  if (query.error || !query.data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
        {t("marvelEliminationStage.nie_udalo_sie_pobrac_drabinki")}{" "}
        {query.error ? getApiErrorMessage(query.error) : ""}
      </div>
    );
  }

  const state = query.data;
  const groupLabelById = new Map(
    state.rounds.flatMap((round) =>
      round.groups.map(
        (group) =>
          [
            group.id,
            t("marvelEliminationStage.r_roundnumber_grupa_groupkey", { roundNumber: round.roundNumber, groupKey: group.groupKey }),
          ] as const,
      ),
    ),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-4 text-sm">
        <Badge variant="secondary">{t("marvelEliminationStage.marvel_ffa")}</Badge>
        <span>{t("marvelEliminationStage.grupa_2")}{" "}{state.config.groupSize}</span>
        <span>{t("marvelEliminationStage.top")}{" "}{state.config.advancingCount}</span>
        <span>{t("marvelEliminationStage.limit")}{" "}{state.config.killLimit} {t("marvelEliminationStage.killi")}</span>
        <span>· {regroupingLabel(state.config.regroupingStrategy)}</span>
      </div>

      {canManage &&
        state.rounds.some((round) => round.status === "awaiting_manual") && (
          <ManualGroupingEditor
            tournamentId={tournamentId}
            stageId={stageId}
            state={state}
          />
        )}

      <div className="flex items-start gap-5 overflow-x-auto pb-4">
        {state.rounds.map((round, roundIndex) => (
          <div key={round.id} className="flex shrink-0 items-start gap-5">
            <section className="w-[22rem] space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold">
                  {round.groups.length === 1 &&
                  roundIndex === state.rounds.length - 1
                    ? t("marvelEliminationStage.final")
                    : t("marvelEliminationStage.runda_roundnumber", { roundNumber: round.roundNumber })}
                </h3>
                <Badge
                  variant={
                    round.status === "completed" ? "secondary" : "outline"
                  }
                >
                  {round.status === "completed"
                    ? t("marvelEliminationStage.zakonczona")
                    : round.status === "awaiting_manual"
                      ? t("marvelEliminationStage.czeka_na_podzial")
                      : t("marvelEliminationStage.w_toku")}
                </Badge>
              </div>
              {round.groups.map((group) => {
                const entries = [...group.entries].sort(
                  (left, right) =>
                    (left.placement ?? left.groupSlot) -
                    (right.placement ?? right.groupSlot),
                );
                const currentPending =
                  state.status === "active" &&
                  state.currentRound === round.roundNumber &&
                  group.status === "pending";
                return (
                  <div
                    key={group.id}
                    className="rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold">{t("marvelEliminationStage.grupa")}{" "}{group.groupKey}</p>
                      {group.status === "completed" && (
                        <Badge variant="outline">{t("marvelEliminationStage.wynik")}</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {entries.map((entry, index) => {
                        const qualified = entry.qualified === true;
                        const finalWinner =
                          round.groups.length === 1 && entry.placement === 1;
                        return (
                          <div key={entry.playerId}>
                            {group.status === "completed" &&
                              index === state.config.advancingCount &&
                              round.groups.length > 1 && (
                                <div className="my-1 border-t border-dashed border-primary/50" />
                              )}
                            <div
                              className={cn(
                                "grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded px-2 py-1.5 text-sm",
                                qualified && "bg-emerald-500/10",
                                finalWinner && "bg-amber-500/15 font-semibold",
                                entry.qualified === false &&
                                  !finalWinner &&
                                  group.status === "completed" &&
                                  "text-muted-foreground",
                              )}
                            >
                              <span className="font-mono font-bold">
                                {entry.placement != null
                                  ? `${entry.placement}.`
                                  : "–"}
                              </span>
                              <span className="min-w-0 truncate">
                                {entry.playerName}
                                {entry.sourceGroupId != null && (
                                  <span className="ml-1 text-[10px] text-muted-foreground">
                                    z {groupLabelById.get(entry.sourceGroupId)}
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center gap-1 text-xs">
                                {entry.kills != null && (
                                  <span>{entry.kills} K</span>
                                )}
                                {finalWinner && (
                                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                )}
                                {entry.nextGroupId != null && (
                                  <span
                                    title={t("marvelEliminationStage.dalej_v0", { v0: groupLabelById.get(entry.nextGroupId) })}
                                  >
                                    <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {group.status === "pending" && round.groups.length > 1 && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowDown className="h-3 w-3" /> {t("marvelEliminationStage.top_2")}{" "}
                        {state.config.advancingCount} {t("marvelEliminationStage.awansuje")}</p>
                    )}
                    {canManage && currentPending && (
                      <GroupResultEditor
                        tournamentId={tournamentId}
                        stageId={stageId}
                        group={group}
                      />
                    )}
                  </div>
                );
              })}
            </section>
            {roundIndex < state.rounds.length - 1 && (
              <ArrowRight className="mt-24 h-6 w-6 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
