/**
 * V5.3 — league rules for round-robin based stages: optional draws, configurable points and an explicit,
 * ordered list of tie-breakers. A stage without rules (null) keeps the pre-V5.3 behaviour exactly
 * (ranking by match wins; no draws). Rules are stored per stage in tournament_stages.league_rules.
 */

export const LEAGUE_RULES_VERSION = 1 as const;

/** Formats whose matches are ranked as a league table. */
export const LEAGUE_RULES_FORMATS = ["round_robin", "group_stage"] as const;
export type LeagueRulesFormat = (typeof LEAGUE_RULES_FORMATS)[number];

/**
 * Tie-breakers, applied in the configured order to participants that are still level.
 *  - head_to_head:      points from the matches played only between the participants still level;
 *  - score_difference:  total score for minus score against (walkovers carry no score);
 *  - scored:            total score for;
 *  - wins:              number of match wins.
 * When every configured criterion leaves participants level, stage seed (then id) decides and the
 * row is flagged `tiedAfterAllRules` so the UI can say so plainly.
 */
export const LEAGUE_TIE_BREAKERS = ["head_to_head", "score_difference", "scored", "wins"] as const;
export type LeagueTieBreaker = (typeof LEAGUE_TIE_BREAKERS)[number];

export interface LeaguePoints {
  win: number;
  draw: number;
  loss: number;
}

export interface LeagueRules {
  version: typeof LEAGUE_RULES_VERSION;
  allowDraws: boolean;
  points: LeaguePoints;
  tieBreakers: LeagueTieBreaker[];
}

export const DEFAULT_LEAGUE_TIE_BREAKERS: readonly LeagueTieBreaker[] = Object.freeze([
  "head_to_head",
  "score_difference",
  "scored",
  "wins",
]);

/** Classic league preset: 3 points for a win, 1 for a draw, 0 for a loss; draws allowed. */
export function classicLeagueRules(): LeagueRules {
  return {
    version: LEAGUE_RULES_VERSION,
    allowDraws: true,
    points: { win: 3, draw: 1, loss: 0 },
    tieBreakers: [...DEFAULT_LEAGUE_TIE_BREAKERS],
  };
}

export const MAX_LEAGUE_POINTS = 99;
/** Upper bound for a single side's score in a draw-enabled (score) league. */
export const MAX_LEAGUE_SCORE = 999;

export type LeagueRulesErrorCode =
  | "LEAGUE_RULES_NOT_OBJECT"
  | "LEAGUE_RULES_UNKNOWN_FIELD"
  | "LEAGUE_RULES_VERSION_UNSUPPORTED"
  | "LEAGUE_RULES_ALLOW_DRAWS_INVALID"
  | "LEAGUE_POINTS_INVALID"
  | "LEAGUE_POINTS_ORDER_INVALID"
  | "LEAGUE_TIE_BREAKERS_INVALID"
  | "LEAGUE_TIE_BREAKER_UNKNOWN"
  | "LEAGUE_TIE_BREAKER_DUPLICATE"
  | "LEAGUE_RULES_FORMAT_UNSUPPORTED"
  | "LEAGUE_DRAWS_REQUIRE_SINGLE_GAME";

export interface LeagueRulesProblem {
  code: LeagueRulesErrorCode;
  path: string;
  message: string;
}

export type LeagueRulesParseResult =
  | { ok: true; value: LeagueRules | null }
  | { ok: false; problems: LeagueRulesProblem[] };

const RULE_FIELDS = new Set(["version", "allowDraws", "points", "tieBreakers"]);
const POINT_FIELDS = ["win", "draw", "loss"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parses and normalises rules from API input, AI configs, backups or the database. `undefined`/`null`
 * mean "no league rules" (legacy behaviour). Missing optional fields get documented defaults:
 * version 1, allowDraws false, tieBreakers DEFAULT_LEAGUE_TIE_BREAKERS. Points are required.
 */
export function parseLeagueRules(value: unknown, path = "leagueRules"): LeagueRulesParseResult {
  if (value === undefined || value === null) return { ok: true, value: null };
  const problems: LeagueRulesProblem[] = [];
  const add = (code: LeagueRulesErrorCode, at: string, message: string) => problems.push({ code, path: at, message });
  if (!isRecord(value)) {
    add("LEAGUE_RULES_NOT_OBJECT", path, "Zasady ligi muszą być obiektem.");
    return { ok: false, problems };
  }
  for (const key of Object.keys(value)) {
    if (!RULE_FIELDS.has(key)) add("LEAGUE_RULES_UNKNOWN_FIELD", `${path}.${key}`, `Nieznane pole zasad ligi: „${key}”.`);
  }
  if (value.version !== undefined && value.version !== LEAGUE_RULES_VERSION) {
    add("LEAGUE_RULES_VERSION_UNSUPPORTED", `${path}.version`, "Obsługiwana jest wersja 1 zasad ligi.");
  }
  if (value.allowDraws !== undefined && typeof value.allowDraws !== "boolean") {
    add("LEAGUE_RULES_ALLOW_DRAWS_INVALID", `${path}.allowDraws`, "allowDraws musi mieć wartość true albo false.");
  }

  let points: LeaguePoints | null = null;
  if (!isRecord(value.points)) {
    add("LEAGUE_POINTS_INVALID", `${path}.points`, "Podaj punkty za zwycięstwo, remis i porażkę.");
  } else {
    const raw = value.points;
    for (const key of Object.keys(raw)) {
      if (!(POINT_FIELDS as readonly string[]).includes(key)) {
        add("LEAGUE_RULES_UNKNOWN_FIELD", `${path}.points.${key}`, `Nieznane pole punktacji: „${key}”.`);
      }
    }
    const valid = POINT_FIELDS.every((key) => {
      const entry = raw[key];
      const ok = typeof entry === "number" && Number.isInteger(entry) && entry >= 0 && entry <= MAX_LEAGUE_POINTS;
      if (!ok) add("LEAGUE_POINTS_INVALID", `${path}.points.${key}`, `Punkty muszą być liczbą całkowitą od 0 do ${MAX_LEAGUE_POINTS}.`);
      return ok;
    });
    if (valid) {
      points = { win: raw.win as number, draw: raw.draw as number, loss: raw.loss as number };
      if (!(points.win > points.loss) || points.draw < points.loss || points.draw > points.win) {
        add(
          "LEAGUE_POINTS_ORDER_INVALID",
          `${path}.points`,
          "Zwycięstwo musi dawać więcej punktów niż porażka, a remis — nie mniej niż porażka i nie więcej niż zwycięstwo.",
        );
      }
    }
  }

  let tieBreakers: LeagueTieBreaker[] = [...DEFAULT_LEAGUE_TIE_BREAKERS];
  if (value.tieBreakers !== undefined) {
    if (!Array.isArray(value.tieBreakers)) {
      add("LEAGUE_TIE_BREAKERS_INVALID", `${path}.tieBreakers`, "tieBreakers musi być listą kryteriów.");
    } else {
      const seen = new Set<string>();
      tieBreakers = [];
      value.tieBreakers.forEach((entry, index) => {
        if (typeof entry !== "string" || !(LEAGUE_TIE_BREAKERS as readonly string[]).includes(entry)) {
          add(
            "LEAGUE_TIE_BREAKER_UNKNOWN",
            `${path}.tieBreakers[${index}]`,
            `Nieznane kryterium. Dozwolone: ${LEAGUE_TIE_BREAKERS.join(", ")}.`,
          );
          return;
        }
        if (seen.has(entry)) {
          add("LEAGUE_TIE_BREAKER_DUPLICATE", `${path}.tieBreakers[${index}]`, `Kryterium „${entry}” powtarza się.`);
          return;
        }
        seen.add(entry);
        tieBreakers.push(entry as LeagueTieBreaker);
      });
    }
  }

  if (problems.length > 0 || points == null) return { ok: false, problems };
  return {
    ok: true,
    value: {
      version: LEAGUE_RULES_VERSION,
      allowDraws: value.allowDraws === true,
      points,
      tieBreakers,
    },
  };
}

/** Checks that rules fit the stage they are attached to. */
export function validateLeagueRulesForStage(
  rules: LeagueRules | null,
  stage: { format: string; bestOf: number },
  path = "leagueRules",
): LeagueRulesProblem[] {
  if (rules == null) return [];
  const problems: LeagueRulesProblem[] = [];
  if (!(LEAGUE_RULES_FORMATS as readonly string[]).includes(stage.format)) {
    problems.push({
      code: "LEAGUE_RULES_FORMAT_UNSUPPORTED",
      path,
      message: "Punktacja ligowa działa tylko w lidze (każdy z każdym) i w fazie grupowej.",
    });
  }
  if (rules.allowDraws && stage.bestOf !== 1) {
    problems.push({
      code: "LEAGUE_DRAWS_REQUIRE_SINGLE_GAME",
      path: `${path}.allowDraws`,
      message: "Remisy są możliwe tylko wtedy, gdy mecz to jedna gra (wynik to np. gole lub punkty).",
    });
  }
  return problems;
}

/** Reads rules stored in the database; corrupt rows fail loudly instead of silently changing a table. */
export function leagueRulesFromStorage(value: unknown): LeagueRules | null {
  const parsed = parseLeagueRules(value);
  if (!parsed.ok) {
    throw new Error(`Stored league rules are invalid: ${parsed.problems.map((problem) => problem.code).join(", ")}`);
  }
  return parsed.value;
}

export const LEAGUE_TIE_BREAKER_LABELS: Readonly<Record<LeagueTieBreaker, string>> = Object.freeze({
  head_to_head: "mecze bezpośrednie",
  score_difference: "różnica wyników",
  scored: "zdobyte (gole/punkty)",
  wins: "liczba zwycięstw",
});

/** V5.7: in a set stage the match score counts sets, so the same tie-breakers read as sets (no new rule). */
export const SET_TIE_BREAKER_LABELS: Readonly<Record<LeagueTieBreaker, string>> = Object.freeze({
  head_to_head: "mecze bezpośrednie",
  score_difference: "różnica setów",
  scored: "wygrane sety",
  wins: "liczba zwycięstw",
});

/** Rewrites a describeLeagueRules sentence for a set stage (used where the sentence is built before the rules). */
export function withSetTieWording(text: string): string {
  let out = text;
  for (const key of Object.keys(LEAGUE_TIE_BREAKER_LABELS) as LeagueTieBreaker[]) out = out.replace(LEAGUE_TIE_BREAKER_LABELS[key], SET_TIE_BREAKER_LABELS[key]);
  return out;
}

/** One-line, plain-language description used by the API (`explanation`) and the UI. */
export function describeLeagueRules(rules: LeagueRules, options: { sets?: boolean } = {}): string {
  const labels = options.sets ? SET_TIE_BREAKER_LABELS : LEAGUE_TIE_BREAKER_LABELS;
  const points = `zwycięstwo ${rules.points.win} pkt${rules.allowDraws ? `, remis ${rules.points.draw} pkt` : ""}, porażka ${rules.points.loss} pkt`;
  const draws = rules.allowDraws ? "Remisy dozwolone." : "Bez remisów — każdy mecz ma zwycięzcę.";
  const order = rules.tieBreakers.length > 0
    ? `Przy równej liczbie punktów decydują kolejno: ${rules.tieBreakers.map((entry) => labels[entry]).join(", ")}; na końcu rozstawienie.`
    : "Przy równej liczbie punktów decyduje rozstawienie.";
  return `Punktacja: ${points}. ${draws} ${order}`;
}

export type LeagueScoreErrorCode = "SCORE_NOT_INTEGER" | "SCORE_NEGATIVE" | "SCORE_TOO_HIGH" | "DRAW_NOT_ALLOWED";

export type LeagueScoreValidation =
  | { ok: true; outcome: "player1" | "player2" | "draw" }
  | { ok: false; code: LeagueScoreErrorCode };

/**
 * Result validation for a draw-enabled league stage (one game per match): any two non-negative integer
 * scores; equal scores are a draw. Stages without draws keep series_v1 validation (validatePlayedSeriesResult).
 */
export function validateLeagueScore(score1: unknown, score2: unknown): LeagueScoreValidation {
  if (!Number.isInteger(score1) || !Number.isInteger(score2)) return { ok: false, code: "SCORE_NOT_INTEGER" };
  const left = score1 as number;
  const right = score2 as number;
  if (left < 0 || right < 0) return { ok: false, code: "SCORE_NEGATIVE" };
  if (left > MAX_LEAGUE_SCORE || right > MAX_LEAGUE_SCORE) return { ok: false, code: "SCORE_TOO_HIGH" };
  if (left === right) return { ok: true, outcome: "draw" };
  return { ok: true, outcome: left > right ? "player1" : "player2" };
}

/** True when the stored match is a league draw (played, equal scores, no winner). */
export function isLeagueDraw(match: {
  resultType?: string | null;
  winnerId?: number | null;
  score1?: number | null;
  score2?: number | null;
}): boolean {
  return match.resultType === "played" && match.winnerId == null && match.score1 != null
    && match.score1 === match.score2;
}
