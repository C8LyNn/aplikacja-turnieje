/**
 * V5.3 — client-side result rules shared by Stable and Experimental. They mirror the server exactly:
 *  - a stage without draws keeps series results (one side reaches ceil(bestOf / 2) wins);
 *  - a stage whose league rules allow draws takes a free score (0–999, goals/points of one game), equal = draw.
 * The server re-validates every result; this only keeps the UI honest and explains what to enter.
 */

export const LEAGUE_SCORE_MAX = 999;

export interface StageLeagueRulesLike {
  leagueRules?: { allowDraws?: boolean; points?: { win: number; draw: number; loss: number } } | null;
  format?: string;
}

export function stageAllowsDraws(stage: StageLeagueRulesLike | null | undefined): boolean {
  return stage?.leagueRules?.allowDraws === true;
}

/** Highest value the +/− buttons may reach for one side. */
export function scoreCap(bestOf: number | null | undefined, allowDraws: boolean): number {
  return allowDraws ? LEAGUE_SCORE_MAX : Math.ceil((bestOf ?? 1) / 2);
}

export type ScoreCheck =
  | { ok: true; outcome: "player1" | "player2" | "draw" }
  | { ok: false; title: string; description: string };

export function checkScore(score1: number, score2: number, bestOf: number | null | undefined, allowDraws: boolean): ScoreCheck {
  if (!Number.isInteger(score1) || !Number.isInteger(score2) || score1 < 0 || score2 < 0) {
    return { ok: false, title: "Nieprawidłowy wynik", description: "Wynik to dwie liczby całkowite, nie mniejsze niż 0." };
  }
  if (allowDraws) {
    if (score1 > LEAGUE_SCORE_MAX || score2 > LEAGUE_SCORE_MAX) {
      return { ok: false, title: "Za wysoki wynik", description: `Maksymalnie ${LEAGUE_SCORE_MAX}.` };
    }
    return { ok: true, outcome: score1 === score2 ? "draw" : score1 > score2 ? "player1" : "player2" };
  }
  const bo = bestOf ?? 1;
  const winsRequired = Math.floor(bo / 2) + 1;
  const complete = (score1 === winsRequired && score2 < winsRequired) || (score2 === winsRequired && score1 < winsRequired);
  if (!complete) {
    return {
      ok: false,
      title: "Seria nie jest zakończona",
      description: `W BO${bo} jedna strona musi osiągnąć ${winsRequired} wygranych gier/map.`,
    };
  }
  return { ok: true, outcome: score1 === winsRequired ? "player1" : "player2" };
}

export interface ResultLike {
  resultType?: string | null;
  score1?: number | null;
  score2?: number | null;
  winnerId?: number | null;
  status?: string;
}

export function isDrawResult(match: ResultLike): boolean {
  return match.resultType === "played" && match.winnerId == null && match.score1 != null && match.score1 === match.score2;
}

/** Short label of a stored result: "2:1", "2:2 · remis", "W.O.", "BYE", "N/C". */
export function matchResultLabel(match: ResultLike): string {
  if (match.resultType === "walkover") return "W.O.";
  if (match.resultType === "bye") return "BYE";
  if (match.resultType === "no_contest") return "N/C";
  const score = `${match.score1 ?? 0}:${match.score2 ?? 0}`;
  return isDrawResult(match) ? `${score} · remis` : score;
}

/** Plain hint for the result form. */
export function scoreEntryHint(bestOf: number | null | undefined, allowDraws: boolean): string {
  if (allowDraws) return "Wpisz wynik meczu (np. gole lub punkty) w polach albo przyciskami + i −. Równy wynik to remis.";
  const wins = scoreCap(bestOf, false);
  return `Do wygrania meczu potrzeba ${wins} ${wins === 1 ? "wygranej" : "wygranych"}. Wpisz wynik w polach albo ustaw go przyciskami + i −.`;
}

export interface StandingLike {
  playerId: number;
  playerName: string;
  points?: number | null;
  matchDraws?: number;
  decidedBy?: string | null;
  tiedAfterAllRules?: boolean;
  /** V5.7: set stages report set points (null otherwise). */
  setPointsFor?: number | null;
}

/** True when the table is ranked by league points (V5.3 league rules). */
export function standingsHavePoints(rows: readonly StandingLike[] | null | undefined): boolean {
  return !!rows && rows.some((row) => row.points != null);
}

export const DECIDED_BY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  head_to_head: "mecze bezpośrednie",
  score_difference: "różnica wyników",
  scored: "więcej zdobytych",
  wins: "więcej zwycięstw",
  seed: "rozstawienie (remis po wszystkich kryteriach)",
});

/** V5.7: in a set stage the match score counts sets. */
export const DECIDED_BY_SET_LABELS: Readonly<Record<string, string>> = Object.freeze({
  ...DECIDED_BY_LABELS,
  score_difference: "różnica setów",
  scored: "więcej wygranych setów",
});

/** True when the rows come from a set stage. */
export function standingsHaveSets(rows: readonly StandingLike[] | null | undefined): boolean {
  return !!rows && rows.some((row) => row.setPointsFor != null);
}

/** Plain sentences explaining every place decided by something other than points. */
export function standingsTieNotes(rows: readonly StandingLike[] | null | undefined): string[] {
  if (!rows || !standingsHavePoints(rows)) return [];
  const notes: string[] = [];
  const labels = standingsHaveSets(rows) ? DECIDED_BY_SET_LABELS : DECIDED_BY_LABELS;
  rows.forEach((row, index) => {
    if (index === 0 || !row.decidedBy || row.decidedBy === "points") return;
    const above = rows[index - 1]!;
    notes.push(`${above.playerName} przed ${row.playerName} (po ${row.points ?? 0} pkt): ${labels[row.decidedBy] ?? row.decidedBy}.`);
  });
  return notes;
}
