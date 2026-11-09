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

export function isTournamentAuthQuery(key: readonly unknown[], tournamentId: number): boolean {
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) return false;
  if (key.length === 3 && key[0] === "tournaments" && key[1] === tournamentId && key[2] === "player-bans") return true;
  const first = key[0], prefix = `/api/tournaments/${tournamentId}`;
  return typeof first === "string" && first.startsWith(prefix) &&
    (first.length === prefix.length || first[prefix.length] === "/" || first[prefix.length] === "?");
}

function tournamentIdFromKey(key: readonly unknown[]): number | null {
  if (key.length === 3 && key[0] === "tournaments" && key[2] === "player-bans") {
    return typeof key[1] === "number" && Number.isSafeInteger(key[1]) && key[1] > 0 ? key[1] : null;
  }
  const match = typeof key[0] === "string" ? /^\/api\/tournaments\/([1-9]\d*)(?:[/?]|$)/.exec(key[0]) : null;
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) ? id : null;
}

function isPicksKey(key: readonly unknown[]): boolean {
  return key[0] === "matches" && typeof key[1] === "number" &&
    Number.isSafeInteger(key[1]) && key[1] > 0 && key[2] === "game-picks" &&
    (key.length === 3 || (key.length === 5 && key[3] === "verified-owner" &&
      typeof key[4] === "number" && Number.isSafeInteger(key[4]) && key[4] > 0));
}

function metaOwner(meta?: Record<string, unknown>): number | null {
  const id = meta?.web005VerifiedTournamentId;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Match IDs alone do not prove tenant ownership; demand a successful DTO. */
export function getVerifiedMatchTournamentOwner(client: QueryClient, matchId: number): number | null {
  if (!Number.isSafeInteger(matchId) || matchId <= 0) return null;
  let owner: number | null = null;
  for (const query of client.getQueryCache().getAll()) {
    if (query.state.status !== "success" || query.queryKey.length !== 1 ||
      typeof query.queryKey[0] !== "string" || !Array.isArray(query.state.data)) continue;
    const match = /^\/api\/tournaments\/([1-9]\d*)\/matches$/.exec(query.queryKey[0]);
    if (!match) continue;
    const id = Number(match[1]);
    if (!Number.isSafeInteger(id)) continue;
    if (!query.state.data.some((entry: unknown) => entry && typeof entry === "object" &&
      (entry as { id?: unknown }).id === matchId &&
      (entry as { tournamentId?: unknown }).tournamentId === id)) continue;
    if (owner !== null && owner !== id) return null;
    owner = id;
  }
  return owner;
}

/** Cancel in-flight reads before evicting private data, including custom keys. */
export function removeTournamentAuthQueries(client: QueryClient, tournamentId: number, deniedQueryHash?: string): void {
  const ownedMatches = new Set<number>();
  const matches = client.getQueryData<unknown>(getListMatchesQueryKey(tournamentId));
  if (Array.isArray(matches)) {
    for (const entry of matches) {
      if (!entry || typeof entry !== "object") continue;
      const match = entry as { id?: unknown; tournamentId?: unknown };
      if (typeof match.id === "number" && Number.isSafeInteger(match.id) &&
        match.id > 0 && match.tournamentId === tournamentId) ownedMatches.add(match.id);
    }
  }
  const predicate = (query: { queryKey: readonly unknown[]; meta?: Record<string, unknown> }) => {
    if (isTournamentAuthQuery(query.queryKey, tournamentId)) return true;
    if (!isPicksKey(query.queryKey)) return false;
    const owner = metaOwner(query.meta);
    return owner !== null ? owner === tournamentId : ownedMatches.has(query.queryKey[1] as number);
  };
  void client.cancelQueries({ predicate }, { silent: true });
  // Keep the triggering observer's ERROR identity, but never its private data.
  // Removing that active error query immediately recreates it on render and
  // can turn a permanent 401/403 into an endless request/render loop.
  if (deniedQueryHash) {
    const denied = client.getQueryCache().getAll().find(query => query.queryHash === deniedQueryHash);
    denied?.setState({ data: undefined, dataUpdatedAt: 0 });
  }
  client.removeQueries({ predicate: query => predicate(query) && query.queryHash !== deniedQueryHash });
}

/** Failed background authorization must not leave successful private data visible. */
export function subscribeToTournamentAuthDenials(client: QueryClient): () => void {
  return client.getQueryCache().subscribe(event => {
    if (event.type !== "updated" || event.action.type !== "error") return;
    const error = event.query.state.error as { status?: unknown; response?: { status?: unknown } } | null;
    const status = error?.status ?? error?.response?.status;
    if (status !== 401 && status !== 403) return;
    const key = event.query.queryKey;
    const owner = tournamentIdFromKey(key) ?? (isPicksKey(key)
      ? metaOwner(event.query.meta) ?? getVerifiedMatchTournamentOwner(client, key[1] as number)
      : null);
    if (owner !== null) removeTournamentAuthQueries(client, owner, event.query.queryHash);
  });
}
