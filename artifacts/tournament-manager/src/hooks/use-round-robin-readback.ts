import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTournamentStageQueryKey, getGetTournamentStandingsQueryKey } from "@workspace/api-client-react";

interface StageSnapshot {
  id: number; format: string; status: string; version?: number;
  winnerId?: number | null; currentRound?: number | null; totalRounds?: number | null;
}
interface MatchSnapshot {
  id: number; stageId: number; revision?: number; status: string;
  score1?: number | null; score2?: number | null;
  winnerId?: number | null; resultType?: string | null;
}

/** Parent polling does not refresh the independently cached stage detail. */
export function useRoundRobinReadback(
  tournamentId: number,
  stages: readonly StageSnapshot[] | undefined,
  matches: readonly MatchSnapshot[] | undefined,
  enabled: boolean,
): void {
  const client = useQueryClient();
  const previous = useRef<{ tournamentId: number; entries: Map<number, string> } | null>(null);
  const snapshots = useMemo(() => !stages || !matches ? null : new Map(stages
    .filter(stage => stage.format === "round_robin")
    .map(stage => [stage.id, JSON.stringify([
      stage.status, stage.version, stage.winnerId, stage.currentRound, stage.totalRounds,
      matches.filter(match => match.stageId === stage.id)
        .map(match => [match.id, match.revision, match.status, match.score1, match.score2, match.winnerId, match.resultType])
        .sort((a, b) => Number(a[0]) - Number(b[0])),
    ])])), [stages, matches]);
  useEffect(() => {
    if (!enabled || !snapshots) {
      // A temporary parent read failure must not erase the last trusted epoch:
      // recovery may be the first observation of an external mutation.
      if (previous.current?.tournamentId !== tournamentId) previous.current = null;
      return;
    }
    const old = previous.current;
    previous.current = { tournamentId, entries: snapshots };
    if (!old || old.tournamentId !== tournamentId) return;
    let changed = false;
    for (const [stageId, fingerprint] of snapshots) {
      if (!old.entries.has(stageId) || old.entries.get(stageId) === fingerprint) continue;
      changed = true;
      const queryKey = getGetTournamentStageQueryKey(tournamentId, stageId);
      // Cancel first so a late read cannot overwrite the next canonical response.
      void client.cancelQueries({ queryKey, exact: true }).then(() =>
        client.invalidateQueries({ queryKey, exact: true }));
    }
    if (changed) void client.invalidateQueries({
      queryKey: getGetTournamentStandingsQueryKey(tournamentId), exact: true,
    });
  }, [client, enabled, snapshots, tournamentId]);
}
