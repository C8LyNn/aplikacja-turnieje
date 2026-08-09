import type { QueryClient } from "@tanstack/react-query";
import {
  getGetResultsHistoryQueryKey,
  getGetTournamentAssistantQueryKey,
  getGetTournamentBracketQueryKey,
  getGetTournamentQueryKey,
  getGetTournamentStandingsQueryKey,
  getGetTournamentStatsQueryKey,
  getListMatchesQueryKey,
  getListPlayersQueryKey,
} from "@workspace/api-client-react";

export function isTournamentStageQuery(
  queryKey: readonly unknown[],
  tournamentId: number,
): boolean {
  const first = queryKey[0];
  return typeof first === "string" &&
    first.startsWith(`/api/tournaments/${tournamentId}/stages`);
}

export async function invalidateTournamentDependentQueries(
  queryClient: QueryClient,
  tournamentId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(tournamentId) }),
    queryClient.invalidateQueries({ queryKey: getGetTournamentStatsQueryKey(tournamentId) }),
    queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey(tournamentId) }),
    queryClient.invalidateQueries({ queryKey: getGetTournamentBracketQueryKey(tournamentId) }),
    queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey(tournamentId) }),
    queryClient.invalidateQueries({ queryKey: getGetTournamentStandingsQueryKey(tournamentId) }),
    queryClient.invalidateQueries({ queryKey: getGetResultsHistoryQueryKey(tournamentId) }),
    queryClient.invalidateQueries({ queryKey: getGetTournamentAssistantQueryKey(tournamentId) }),
    queryClient.invalidateQueries({
      predicate: (query) => isTournamentStageQuery(query.queryKey, tournamentId),
    }),
  ]);
}
