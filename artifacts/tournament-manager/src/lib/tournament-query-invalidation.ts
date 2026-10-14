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

/**
 * Credential changes must evict cached authorized data: invalidateQueries
 * leaves previously fetched private data available while the refetch fails.
 */
export function isTournamentAuthQuery(
  queryKey: readonly unknown[],
  tournamentId: number,
): boolean {
  const first = queryKey[0];
  if (typeof first !== "string" || !Number.isSafeInteger(tournamentId) || tournamentId <= 0) {
    return false;
  }
  const prefix = "/api/tournaments/" + tournamentId;
  return first.startsWith(prefix) &&
    (first.length === prefix.length || first[prefix.length] === "/" || first[prefix.length] === "?");
}

export function tournamentIdFromAuthQuery(queryKey: readonly unknown[]): number | null {
  const first = queryKey[0];
  if (typeof first !== "string") return null;
  const match = /^\/api\/tournaments\/([1-9]\d*)(?:[/?]|$)/.exec(first);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}

/**
 * Cancel first, detach old query entries next. Late responses from canceled
 * queries cannot put an old authorized payload back in the live cache.
 */
export function removeTournamentAuthQueries(
  queryClient: QueryClient,
  tournamentId: number,
): void {
  const predicate = (query: { queryKey: readonly unknown[] }) =>
    isTournamentAuthQuery(query.queryKey, tournamentId);
  void queryClient.cancelQueries({ predicate }, { silent: true });
  queryClient.removeQueries({ predicate });
}

/**
 * A denied background refetch must not retain its prior authorized data.
 * The observer is installed once by AuthProvider and affects only the
 * tournament explicitly named in the denied query key.
 */
export function subscribeToTournamentAuthDenials(queryClient: QueryClient): () => void {
  return queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "error") return;
    const error = event.query.state.error as {
      status?: unknown;
      response?: { status?: unknown };
    } | null;
    const status = error?.status ?? error?.response?.status;
    if (status !== 401 && status !== 403) return;
    const tournamentId = tournamentIdFromAuthQuery(event.query.queryKey);
    if (tournamentId === null) return;
    removeTournamentAuthQueries(queryClient, tournamentId);
  });
}
