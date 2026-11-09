/**
 * Custom React Query hooks for Deadlock hero bans (per-player) and
 * per-game picks (per-game inside a BO match).
 *
 * These endpoints are not Orval-generated; they use the same customFetch
 * infrastructure from @workspace/api-client-react.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { getVerifiedMatchTournamentOwner } from "./tournament-query-invalidation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerBanRecord {
  playerId: number;
  tournamentId: number;
  bannedHeroIds: string[];
}

export interface GamePickRecord {
  matchId: number;
  gameNumber: number;
  player1HeroId: string | null;
  player2HeroId: string | null;
  player1Side: "archmother" | "hidden_king" | null;
  player2Side: "archmother" | "hidden_king" | null;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const getPlayerBansQueryKey = (tournamentId: number) =>
  ["tournaments", tournamentId, "player-bans"] as const;

export const getMatchGamePicksQueryKey = (matchId: number) =>
  ["matches", matchId, "game-picks"] as const;

// ---------------------------------------------------------------------------
// Bans: GET /tournaments/:id/player-bans
// ---------------------------------------------------------------------------

export function usePlayerBans(
  tournamentId: number | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery<PlayerBanRecord[]>({
    queryKey: getPlayerBansQueryKey(tournamentId ?? 0),
    queryFn: () =>
      customFetch<PlayerBanRecord[]>(`/api/tournaments/${tournamentId}/player-bans`),
    enabled: (options?.enabled ?? true) && !!tournamentId,
    staleTime: 30_000,
  });
}

// Convenience: derive a Map<playerId, string[]> from the list
export function usePlayerBansMap(
  tournamentId: number | null | undefined,
): Map<number, string[]> {
  const { data } = usePlayerBans(tournamentId);
  if (!data) return new Map();
  return new Map(data.map((r) => [r.playerId, r.bannedHeroIds]));
}

// ---------------------------------------------------------------------------
// Bans: PUT /players/:id/bans
// ---------------------------------------------------------------------------

export function useSetPlayerBans(tournamentId: number | null | undefined) {
  const qc = useQueryClient();
  return useMutation<PlayerBanRecord, Error, { playerId: number; bannedHeroIds: string[] }>({
    mutationFn: ({ playerId, bannedHeroIds }) =>
      customFetch<PlayerBanRecord>(`/api/players/${playerId}/bans`, {
        method: "PUT",
        body: JSON.stringify({ bannedHeroIds }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      if (tournamentId) {
        void qc.invalidateQueries({ queryKey: getPlayerBansQueryKey(tournamentId) });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Picks: GET /matches/:id/game-picks
// ---------------------------------------------------------------------------

export function useMatchGamePicks(
  matchId: number | null | undefined,
  options?: { enabled?: boolean },
) {
  const client = useQueryClient();
  const owner = matchId ? getVerifiedMatchTournamentOwner(client, matchId) : null;
  const legacyKey = getMatchGamePicksQueryKey(matchId ?? 0);
  const legacy = owner !== null ? client.getQueryCache().find({ queryKey: legacyKey, exact: true }) : undefined;
  // Do not immediately serve an unowned legacy cache entry after reauthorization.
  const key = owner === null ? getMatchGamePicksQueryKey(0)
    : legacy && legacy.meta?.web005VerifiedTournamentId !== owner
      ? [...legacyKey, "verified-owner", owner] as const : legacyKey;
  return useQuery<GamePickRecord[]>({
    queryKey: key,
    queryFn: () =>
      customFetch<GamePickRecord[]>(`/api/matches/${matchId}/game-picks`),
    meta: owner === null ? undefined : { web005VerifiedTournamentId: owner },
    enabled: (options?.enabled ?? true) && !!matchId && owner !== null,
    staleTime: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Picks: PUT /matches/:id/game-picks/:gameNumber
// ---------------------------------------------------------------------------

export function useSetMatchGamePick(matchId: number | null | undefined) {
  const qc = useQueryClient();
  return useMutation<
    GamePickRecord,
    Error,
    { gameNumber: number; player1HeroId: string | null; player2HeroId: string | null; player1Side?: "archmother" | "hidden_king" | null }
  >({
    mutationFn: ({ gameNumber, player1HeroId, player2HeroId, player1Side }) =>
      customFetch<GamePickRecord>(
        `/api/matches/${matchId}/game-picks/${gameNumber}`,
        {
          method: "PUT",
          body: JSON.stringify({
            player1HeroId,
            player2HeroId,
            ...(player1Side !== undefined ? { player1Side } : {}),
          }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    onSuccess: () => {
      if (matchId) {
        void qc.invalidateQueries({ queryKey: getMatchGamePicksQueryKey(matchId) });
      }
    },
  });
}
