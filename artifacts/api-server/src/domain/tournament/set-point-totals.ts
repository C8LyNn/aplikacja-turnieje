/**
 * V5.7 · points scored inside sets ("małe punkty") per participant. Shown next to the table; they never
 * change the order unless a stage's own tie-breakers say so (no tie-breaker uses them in this version).
 */
import { setsFromStorage } from "@workspace/match-rules";

export interface SetPointTotal { for: number; against: number }

export function setPointTotals(matches: ReadonlyArray<{ status: string; resultType?: string | null; player1Id?: number | null; player2Id?: number | null; setScores?: unknown }>): Map<number, SetPointTotal> {
  const totals = new Map<number, SetPointTotal>();
  const add = (playerId: number, scored: number, conceded: number) => {
    const entry = totals.get(playerId) ?? { for: 0, against: 0 };
    entry.for += scored;
    entry.against += conceded;
    totals.set(playerId, entry);
  };
  for (const match of matches) {
    if (match.status !== "completed" || match.resultType !== "played" || match.player1Id == null || match.player2Id == null) continue;
    const sets = setsFromStorage(match.setScores);
    if (!sets) continue;
    const scored1 = sets.reduce((sum, set) => sum + set.score1, 0);
    const scored2 = sets.reduce((sum, set) => sum + set.score2, 0);
    add(match.player1Id, scored1, scored2);
    add(match.player2Id, scored2, scored1);
  }
  return totals;
}
