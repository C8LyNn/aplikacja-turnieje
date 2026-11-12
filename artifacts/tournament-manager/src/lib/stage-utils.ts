import type { Match } from "@workspace/api-client-react";

export interface BracketShape {
  rounds: { round: number; matches: Match[] }[];
  winner?: { id: number; name: string };
}

/**
 * Build a bracket-shaped data structure from a flat array of matches.
 * Matches are grouped by `round` (ascending) and sorted within each round
 * by `matchNumber`. Only matches belonging to the same stage should be
 * passed in (use `filterMatchesForStage` first).
 */
export function buildBracketFromMatches(matches: Match[]): BracketShape {
  const byRound = new Map<number, Match[]>();
  for (const m of matches) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }
  const rounds = [...byRound.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, ms]) => ({
      round,
      matches: [...ms].sort((a, b) => a.matchNumber - b.matchNumber),
    }));
  return { rounds };
}

/**
 * Derive the current active round from a list of matches.
 * Returns the round number of the first in-progress match, or the
 * highest completed round, or null if no matches have been played.
 */
export function deriveCurrentRound(matches: Match[]): number | null {
  let latestInProgress: number | null = null;
  let latestCompleted: number | null = null;
  for (const match of matches) {
    if (match.status === "in_progress") {
      latestInProgress = latestInProgress === null ? match.round : Math.max(latestInProgress, match.round);
    } else if (match.status === "completed") {
      latestCompleted = latestCompleted === null ? match.round : Math.max(latestCompleted, match.round);
    }
  }
  // Never infer current round from incidental API order. No large-array spread.
  return latestInProgress ?? latestCompleted;
}
