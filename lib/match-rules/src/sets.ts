/**
 * V5.7 — set scores: one source of truth for the API (validation, decision) and the screen (preview of the
 * same calculation). A set goes to `pointsPerSet` points with a lead of `winBy`; play continues past the
 * target until the lead is reached, and ends exactly then — so 11:9, 12:10 or 15:13 are finished sets
 * (to 11, lead 2), while 13:10 or 15:3 are impossible and 11:10 is not finished yet.
 */
import type { SetMatchRules } from "./rules";

export interface SetScore {
  score1: number;
  score2: number;
}

export type SetScoreErrorCode =
  | "SETS_REQUIRED"
  | "SET_SCORE_NOT_INTEGER"
  | "SET_SCORE_NEGATIVE"
  | "SET_SCORE_TOO_HIGH"
  | "SET_NOT_FINISHED"
  | "SET_SCORE_IMPOSSIBLE"
  | "SET_AFTER_MATCH_DECIDED"
  | "MATCH_NOT_DECIDED"
  | "SET_TOTAL_MISMATCH"
  | "SETS_NOT_SUPPORTED";

export const MAX_SET_POINTS = 999;

export interface SetProblem {
  code: SetScoreErrorCode;
  message: string;
  /** 0-based index of the set the problem is about (when it is about one set). */
  setIndex?: number;
}

export type SetState =
  | { kind: "finished"; winner: 1 | 2 }
  | { kind: "in_progress" }
  | { kind: "invalid"; problem: SetProblem };

/** State of one set under the rules. */
export function setState(set: SetScore, rules: SetMatchRules, index = 0): SetState {
  const label = `Set ${index + 1}`;
  const { score1: a, score2: b } = set;
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    return { kind: "invalid", problem: { code: "SET_SCORE_NOT_INTEGER", message: `${label}: punkty muszą być liczbami całkowitymi.`, setIndex: index } };
  }
  if (a < 0 || b < 0) return { kind: "invalid", problem: { code: "SET_SCORE_NEGATIVE", message: `${label}: punkty nie mogą być ujemne.`, setIndex: index } };
  if (a > MAX_SET_POINTS || b > MAX_SET_POINTS) {
    return { kind: "invalid", problem: { code: "SET_SCORE_TOO_HIGH", message: `${label}: wynik jest zbyt wysoki.`, setIndex: index } };
  }
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const target = rules.pointsPerSet;
  const impossible = (why: string): SetState => ({ kind: "invalid", problem: { code: "SET_SCORE_IMPOSSIBLE", message: `${label}: wynik ${a}:${b} jest niemożliwy — ${why}.`, setIndex: index } });
  if (high < target) return { kind: "in_progress" };
  if (rules.winBy <= 1) {
    // Without a required lead the set ends the moment someone reaches the target.
    if (high === target && low < target) return { kind: "finished", winner: a > b ? 1 : 2 };
    return impossible(`set kończy się, gdy ktoś zdobędzie ${target} pkt`);
  }
  if (high - low < rules.winBy) return { kind: "in_progress" }; // at or past the target, lead still too small
  if (high > target && high - low !== rules.winBy) {
    return impossible(`po przekroczeniu ${target} pkt set kończy się, gdy przewaga osiągnie ${rules.winBy}`);
  }
  return { kind: "finished", winner: a > b ? 1 : 2 };
}

export interface SetMatchProgress {
  setsWon1: number;
  setsWon2: number;
  points1: number;
  points2: number;
  /** Set number (1-based) the next entry would be. */
  nextSetNumber: number;
  decided: boolean;
  winnerSide: 1 | 2 | null;
  /** True when the last set is finished and the match is not decided yet. */
  canAddSet: boolean;
  /** What is still missing, in words (empty when decided). */
  missing: string;
}

const pluralSets = (n: number) => (n === 1 ? "set" : n >= 2 && n <= 4 ? "sety" : "setów");

/**
 * Progress of a set list in which the last set may still be under way (for the editor preview).
 * Earlier sets must be finished. Returns the first problem when the list cannot be right.
 */
export function setMatchProgress(
  sets: readonly SetScore[],
  rules: SetMatchRules,
  /** Shown in the "what is missing" sentence; without them the sides are called A and B. */
  names?: { player1: string; player2: string },
): { ok: true; value: SetMatchProgress } | { ok: false; problem: SetProblem } {
  let won1 = 0;
  let won2 = 0;
  let points1 = 0;
  let points2 = 0;
  let lastInProgress = false;
  for (let index = 0; index < sets.length; index += 1) {
    const set = sets[index]!;
    if (won1 >= rules.setsToWin || won2 >= rules.setsToWin) {
      return { ok: false, problem: { code: "SET_AFTER_MATCH_DECIDED", message: `Set ${index + 1}: mecz był już rozstrzygnięty po secie ${index} — kolejnych setów się nie dopisuje.`, setIndex: index } };
    }
    const state = setState(set, rules, index);
    if (state.kind === "invalid") return { ok: false, problem: state.problem };
    points1 += set.score1;
    points2 += set.score2;
    if (state.kind === "in_progress") {
      if (index < sets.length - 1) {
        return { ok: false, problem: { code: "SET_NOT_FINISHED", message: `Set ${index + 1} (${set.score1}:${set.score2}) nie jest zakończony, a po nim wpisano kolejny.`, setIndex: index } };
      }
      lastInProgress = true;
      continue;
    }
    if (state.winner === 1) won1 += 1; else won2 += 1;
  }
  const decided = won1 >= rules.setsToWin || won2 >= rules.setsToWin;
  const winnerSide = decided ? (won1 > won2 ? 1 : 2) : null;
  const need1 = rules.setsToWin - won1;
  const need2 = rules.setsToWin - won2;
  const missing = decided ? ""
    : lastInProgress
      ? `Set ${sets.length} trwa (${sets[sets.length - 1]!.score1}:${sets[sets.length - 1]!.score2}) — kończy się przy ${rules.pointsPerSet} pkt${rules.winBy > 1 ? ` z przewagą ${rules.winBy}` : ""}.`
      : names
        ? `Do zwycięstwa brakuje: ${names.player1} — ${need1} ${pluralSets(need1)}, ${names.player2} — ${need2} ${pluralSets(need2)}.`
        : `Do zwycięstwa brakuje: zawodnikowi A — ${need1} ${pluralSets(need1)}, zawodnikowi B — ${need2} ${pluralSets(need2)}.`;
  return {
    ok: true,
    value: {
      setsWon1: won1, setsWon2: won2, points1, points2,
      nextSetNumber: lastInProgress ? sets.length : sets.length + 1,
      decided, winnerSide,
      canAddSet: !decided && !lastInProgress,
      missing,
    },
  };
}

export interface DecidedSetMatch {
  sets: SetScore[];
  setsWon1: number;
  setsWon2: number;
  points1: number;
  points2: number;
  winnerSide: 1 | 2;
}

/** A complete set result for saving: every set finished and valid, the match decided by the last set. */
export function evaluateSetMatch(sets: readonly SetScore[], rules: SetMatchRules): { ok: true; value: DecidedSetMatch } | { ok: false; problem: SetProblem } {
  if (!Array.isArray(sets) || sets.length === 0) {
    return { ok: false, problem: { code: "SETS_REQUIRED", message: "Wpisz wyniki setów — w tym etapie o meczu decydują sety." } };
  }
  const progress = setMatchProgress(sets, rules);
  if (!progress.ok) return progress;
  const value = progress.value;
  if (!value.decided) {
    const lastIndex = sets.length - 1;
    const last = setState(sets[lastIndex]!, rules, lastIndex);
    if (last.kind === "in_progress") {
      return { ok: false, problem: { code: "SET_NOT_FINISHED", message: `Set ${lastIndex + 1} (${sets[lastIndex]!.score1}:${sets[lastIndex]!.score2}) nie jest zakończony: set kończy się przy ${rules.pointsPerSet} pkt${rules.winBy > 1 ? ` z przewagą ${rules.winBy}` : ""}.`, setIndex: lastIndex } };
    }
    return { ok: false, problem: { code: "MATCH_NOT_DECIDED", message: `Mecz nie jest rozstrzygnięty (${value.setsWon1}:${value.setsWon2} w setach) — zwycięzca musi wygrać ${rules.setsToWin} ${pluralSets(rules.setsToWin)}.` } };
  }
  return {
    ok: true,
    value: {
      sets: sets.map((set) => ({ score1: set.score1, score2: set.score2 })),
      setsWon1: value.setsWon1, setsWon2: value.setsWon2,
      points1: value.points1, points2: value.points2,
      winnerSide: value.winnerSide!,
    },
  };
}

/** Stored form: [[score1, score2], …]. */
export function setsToStorage(sets: readonly SetScore[]): number[][] {
  return sets.map((set) => [set.score1, set.score2]);
}

/** Tolerant reader of stored sets; anything unexpected reads as "no sets". */
export function setsFromStorage(raw: unknown): SetScore[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const sets: SetScore[] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length !== 2 || !Number.isInteger(entry[0]) || !Number.isInteger(entry[1])) return null;
    sets.push({ score1: entry[0] as number, score2: entry[1] as number });
  }
  return sets;
}

/** Points scored inside sets, for tables ("małe punkty"). */
export function setPoints(sets: readonly SetScore[] | null | undefined): { points1: number; points2: number } | null {
  if (!sets || sets.length === 0) return null;
  return sets.reduce((sum, set) => ({ points1: sum.points1 + set.score1, points2: sum.points2 + set.score2 }), { points1: 0, points2: 0 });
}
