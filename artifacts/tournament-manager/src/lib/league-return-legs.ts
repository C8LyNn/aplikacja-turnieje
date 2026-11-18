/**
 * V5.10 (P2) · home and away leagues: which meeting of a pair a match is, and what the other one says — so the
 * schedule reads "rewanż · 1. mecz: Wilki 2:1 Orły" without opening anything. Purely presentational: the pair is
 * the match with the same participants in swapped places (the engine's return fixture).
 */
export interface ScheduleMatchLite {
  matchId: number;
  round: number;
  player1Id: number | null;
  player2Id: number | null;
  player1Name: string | null;
  player2Name: string | null;
  score1: number | null;
  score2: number | null;
  scheduleState: string;
}

export function returnLegNote(all: readonly ScheduleMatchLite[], match: ScheduleMatchLite): string | null {
  if (match.player1Id == null || match.player2Id == null) return null;
  const partner = all.find((candidate) => candidate.matchId !== match.matchId
    && candidate.player1Id === match.player2Id && candidate.player2Id === match.player1Id);
  if (!partner) return null;
  if (partner.round > match.round || (partner.round === match.round && partner.matchId > match.matchId)) {
    return `1. mecz · rewanż w kolejce ${partner.round}`;
  }
  if (partner.scheduleState === "completed" && partner.score1 != null && partner.score2 != null) {
    return `rewanż · 1. mecz: ${partner.player1Name ?? "?"} ${partner.score1}:${partner.score2} ${partner.player2Name ?? "?"}`;
  }
  return `rewanż · 1. mecz (kolejka ${partner.round}) jeszcze bez wyniku`;
}
