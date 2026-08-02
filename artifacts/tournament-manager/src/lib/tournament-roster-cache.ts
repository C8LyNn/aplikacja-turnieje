import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  getGetTournamentStageQueryKey,
  getGetTournamentStageReadinessQueryKey,
  getGetTournamentStatsQueryKey,
  getListPlayersQueryKey,
  getListTournamentStagesQueryKey,
} from "@workspace/api-client-react";

export function tournamentRosterQueryKeys(
  tournamentId: number,
  stageIds: readonly number[],
): QueryKey[] {
  return [
    getListPlayersQueryKey(tournamentId),
    getGetTournamentStatsQueryKey(tournamentId),
    getListTournamentStagesQueryKey(tournamentId),
    ...stageIds.flatMap((stageId) => [
      getGetTournamentStageQueryKey(tournamentId, stageId),
      getGetTournamentStageReadinessQueryKey(tournamentId, stageId),
    ]),
  ];
}

export async function invalidateTournamentRosterQueries(
  queryClient: Pick<QueryClient, "invalidateQueries">,
  tournamentId: number,
  stageIds: readonly number[],
): Promise<void> {
  await Promise.all(tournamentRosterQueryKeys(tournamentId, stageIds).map((queryKey) =>
    queryClient.invalidateQueries({ queryKey }),
  ));
}
