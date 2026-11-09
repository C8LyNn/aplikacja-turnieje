/** Stable, deterministic revision vector for local cache invalidation / double-read checks. */
export interface MatchVersionPoint {
  id: number;
  stageId: number;
  revision: number;
  status: string;
  winnerId: number | null;
  player1Id: number | null;
  player2Id: number | null;
  score1?: number | null;
  score2?: number | null;
  resultType?: string | null;
  routingMatchKey?: string | null;
}
export function stageMatchVersionVector(matches: readonly MatchVersionPoint[], stageId: number): string {
  return JSON.stringify(matches.filter(m => m.stageId === stageId)
    .slice().sort((a, b) => a.id - b.id)
    .map(m => [m.id, m.revision, m.status, m.player1Id ?? null, m.player2Id ?? null,
      m.winnerId ?? null, m.score1 ?? null, m.score2 ?? null, m.resultType ?? null,
      m.routingMatchKey ?? null]));
}
