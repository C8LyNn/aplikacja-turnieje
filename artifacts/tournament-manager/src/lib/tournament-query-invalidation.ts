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
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) return false;
  // Deadlock custom query keys are tuples, not generated URL keys.
  if (queryKey.length === 3 && queryKey[0] === "tournaments" &&
      queryKey[1] === tournamentId && queryKey[2] === "player-bans") return true;
  const first = queryKey[0];
  if (typeof first !== "string") return false;
  const prefix = "/api/tournaments/" + tournamentId;
  return first.startsWith(prefix) &&
    (first.length === prefix.length || first[prefix.length] === "/" || first[prefix.length] === "?");
}

export function tournamentIdFromAuthQuery(queryKey: readonly unknown[]): number | null {
  if (queryKey.length === 3 && queryKey[0] === "tournaments" &&
      Number.isSafeInteger(queryKey[1]) && Number(queryKey[1]) > 0 &&
      queryKey[2] === "player-bans") return Number(queryKey[1]);
  const first = queryKey[0];
  if (typeof first !== "string") return null;
  const match = /^\/api\/tournaments\/([1-9]\d*)(?:[/?]|$)/.exec(first);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}

/**
 * Trusted ownership comes only from a successful cached GET for this exact
 * tournament's match list. Each match must explicitly identify its own
 * tournamentId; an equal numeric match ID is not ownership evidence.
 * Without this readback, no match-only cache entry is attributed or purged.
 */
function ownedCachedMatchIds(queryClient: QueryClient, tournamentId: number): Set<number> {
  const matchList = queryClient.getQueryData<unknown>(getListMatchesQueryKey(tournamentId));
  const owned = new Set<number>();
  if (!Array.isArray(matchList)) return owned;
  for (const match of matchList) {
    if (!match || typeof match !== "object") continue;
    const record = match as { id?: unknown; tournamentId?: unknown };
    if (Number.isSafeInteger(record.id) && Number(record.id) > 0 &&
        record.tournamentId === tournamentId) owned.add(Number(record.id));
  }
  return owned;
}

function isOwnedMatchPicksKey(queryKey: readonly unknown[], matchIds: ReadonlySet<number>): boolean {
  return queryKey.length === 3 &&
    queryKey[0] === "matches" &&
    typeof queryKey[1] === "number" &&
    matchIds.has(queryKey[1]) &&
    queryKey[2] === "game-picks";
}

/**
 * On a match-only 401/403, resolve its tournament by scanning already
 * authenticated tournament-scoped match-list query data. Ambiguous or absent
 * ownership fails closed to NO attribution, never a global match purge.
 */
function tournamentIdForOwnedMatchError(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): number | null {
  if (queryKey.length !== 3 || queryKey[0] !== "matches" ||
      typeof queryKey[1] !== "number" || queryKey[2] !== "game-picks") return null;
  const matchId = queryKey[1];
  let owner: number | null = null;
  for (const query of queryClient.getQueryCache().getAll()) {
    const key = query.queryKey;
    if (key.length !== 1 || typeof key[0] !== "string") continue;
    const match = /^\/api\/tournaments\/([1-9]\d*)\/matches$/.exec(key[0]);
    if (!match) continue;
    const tournamentId = Number(match[1]);
    if (!Number.isSafeInteger(tournamentId) ||
        !ownedCachedMatchIds(queryClient, tournamentId).has(matchId)) continue;
    if (owner !== null && owner !== tournamentId) return null;
    owner = tournamentId;
  }
  return owner;
}

/**
 * Cancel first, detach old query entries next. Late responses from canceled
 * queries cannot put an old authorized payload back in the live cache.
 */
export function removeTournamentAuthQueries(
  queryClient: QueryClient,
  tournamentId: number,
): void {
  // Snapshot match ownership BEFORE removing the list that proves it.
  const ownedMatchIds = ownedCachedMatchIds(queryClient, tournamentId);
  const predicate = (query: { queryKey: readonly unknown[] }) =>
    isTournamentAuthQuery(query.queryKey, tournamentId) ||
    isOwnedMatchPicksKey(query.queryKey, ownedMatchIds);
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
    const tournamentId = tournamentIdFromAuthQuery(event.query.queryKey) ??
      tournamentIdForOwnedMatchError(queryClient, event.query.queryKey);
    if (tournamentId === null) return;
    removeTournamentAuthQueries(queryClient, tournamentId);
  });
}
