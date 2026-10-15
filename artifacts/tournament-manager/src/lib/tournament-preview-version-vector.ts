/** Must match API stageMatchVersionVector. No session or tokens are stored here. */
interface PreviewMatchPoint {
  id: number; stageId: number; revision: number; status: string;
  player1Id?: number | null; player2Id?: number | null;
  winnerId?: number | null; score1?: number | null; score2?: number | null;
  resultType?: string | null; routingMatchKey?: string | null;
}
export function previewStageMatchVersionVector(matches: readonly PreviewMatchPoint[], stageId: number): string {
  return JSON.stringify(matches.filter(m => m.stageId === stageId)
    .slice().sort((a, b) => a.id - b.id)
    .map(m => [m.id, m.revision, m.status, m.player1Id ?? null, m.player2Id ?? null,
      m.winnerId ?? null, m.score1 ?? null, m.score2 ?? null, m.resultType ?? null,
      m.routingMatchKey ?? null]));
}
