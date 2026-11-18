/**
 * V5.7 — match result rules: what decides one match. Separate from the format (who plays whom, stages,
 * advancement) and from classification points (league rules: points for a result, bonuses, penalties).
 *
 *  - null (no rules stored): the existing meaning — a series to N won games/maps (best of), or, in a league
 *    that allows draws, one game whose score is goals/points. Nothing about existing stages changes.
 *  - { kind: "sets" }: the match is played in sets; each set goes to `pointsPerSet` points with a lead of
 *    `winBy`; the first side to win `setsToWin` sets wins the match. The match score is sets won (so every
 *    table, bracket and series check keeps working), and the set scores are stored with the result.
 *
 * Every set uses the same rules in this version; a different deciding set, caps on extended play and
 * sport-specific exceptions are listed as further capabilities, not modelled here.
 */
export const MATCH_RULES_VERSION = 1 as const;
export const MAX_SETS_TO_WIN = 4;
export const MIN_POINTS_PER_SET = 3;
export const MAX_POINTS_PER_SET = 99;

export interface SetMatchRules {
  version: typeof MATCH_RULES_VERSION;
  kind: "sets";
  setsToWin: number;
  pointsPerSet: number;
  winBy: number;
}

export type MatchRules = SetMatchRules;

export type MatchRulesErrorCode =
  | "MATCH_RULES_NOT_OBJECT"
  | "MATCH_RULES_UNKNOWN_FIELD"
  | "MATCH_RULES_VERSION_UNSUPPORTED"
  | "MATCH_RULES_KIND_UNSUPPORTED"
  | "SETS_TO_WIN_INVALID"
  | "POINTS_PER_SET_INVALID"
  | "WIN_BY_INVALID"
  | "MATCH_RULES_DRAWS_CONFLICT"
  | "MATCH_RULES_BEST_OF_CONFLICT"
  | "MATCH_RULES_FORMAT_UNSUPPORTED";

export interface MatchRulesProblem {
  code: MatchRulesErrorCode;
  path: string;
  message: string;
}

export type MatchRulesParseResult = { ok: true; value: MatchRules | null } | { ok: false; problems: MatchRulesProblem[] };

const FIELDS = new Set(["version", "kind", "setsToWin", "pointsPerSet", "winBy"]);

/** Strict parser for API input and Backup V3. `null`/`undefined` = no rules (existing meaning). */
export function parseMatchRules(raw: unknown, path = "matchRules"): MatchRulesParseResult {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, problems: [{ code: "MATCH_RULES_NOT_OBJECT", path, message: "Zasady meczu muszą być obiektem." }] };
  }
  const input = raw as Record<string, unknown>;
  const problems: MatchRulesProblem[] = [];
  for (const key of Object.keys(input)) {
    if (!FIELDS.has(key)) problems.push({ code: "MATCH_RULES_UNKNOWN_FIELD", path: `${path}.${key}`, message: `Nieznane pole zasad meczu: ${key}.` });
  }
  if (input.version !== undefined && input.version !== MATCH_RULES_VERSION) {
    problems.push({ code: "MATCH_RULES_VERSION_UNSUPPORTED", path: `${path}.version`, message: "Nieobsługiwana wersja zasad meczu." });
  }
  if (input.kind !== "sets") {
    problems.push({ code: "MATCH_RULES_KIND_UNSUPPORTED", path: `${path}.kind`, message: "Obsługiwany rodzaj zasad meczu: \"sets\" (mecz rozstrzygany setami)." });
  }
  const integer = (value: unknown, min: number, max: number) => Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
  if (!integer(input.setsToWin, 1, MAX_SETS_TO_WIN)) {
    problems.push({ code: "SETS_TO_WIN_INVALID", path: `${path}.setsToWin`, message: `Liczba wygranych setów potrzebna do zwycięstwa: od 1 do ${MAX_SETS_TO_WIN}.` });
  }
  if (!integer(input.pointsPerSet, MIN_POINTS_PER_SET, MAX_POINTS_PER_SET)) {
    problems.push({ code: "POINTS_PER_SET_INVALID", path: `${path}.pointsPerSet`, message: `Punkty potrzebne do wygrania seta: od ${MIN_POINTS_PER_SET} do ${MAX_POINTS_PER_SET}.` });
  }
  if (!integer(input.winBy, 1, 2)) {
    problems.push({ code: "WIN_BY_INVALID", path: `${path}.winBy`, message: "Wymagana przewaga w secie: 1 albo 2 punkty." });
  }
  if (problems.length) return { ok: false, problems };
  return {
    ok: true,
    value: { version: MATCH_RULES_VERSION, kind: "sets", setsToWin: input.setsToWin as number, pointsPerSet: input.pointsPerSet as number, winBy: input.winBy as number },
  };
}

/** Tolerant reader of stored rules: anything unexpected is treated as "no rules" (existing meaning). */
export function matchRulesFromStorage(raw: unknown): MatchRules | null {
  const parsed = parseMatchRules(raw);
  return parsed.ok ? parsed.value : null;
}

/** A set match is a series to `setsToWin` won sets, so its best of is 2 × setsToWin − 1. */
export function bestOfForMatchRules(rules: MatchRules): number {
  return 2 * rules.setsToWin - 1;
}

/** Checks the rules against the rest of the stage (draws, length, format). */
export function validateMatchRulesForStage(
  rules: MatchRules | null,
  stage: { format: string; bestOf: number; allowDraws: boolean },
  path = "matchRules",
): MatchRulesProblem[] {
  if (!rules) return [];
  const problems: MatchRulesProblem[] = [];
  if (stage.allowDraws) {
    problems.push({ code: "MATCH_RULES_DRAWS_CONFLICT", path, message: "Mecz rozstrzygany setami zawsze ma zwycięzcę — wyłącz remisy w punktacji tabeli albo wybierz inne zasady meczu." });
  }
  if (stage.bestOf !== bestOfForMatchRules(rules)) {
    problems.push({ code: "MATCH_RULES_BEST_OF_CONFLICT", path, message: `Długość meczu wynika z zasad setów: do ${rules.setsToWin} wygranych setów to najwyżej ${bestOfForMatchRules(rules)} setów.` });
  }
  if (!["single_elimination", "double_elimination", "round_robin", "swiss", "group_stage"].includes(stage.format)) {
    problems.push({ code: "MATCH_RULES_FORMAT_UNSUPPORTED", path, message: "Ten format nie obsługuje zasad setowych." });
  }
  return problems;
}

const COUNT_WORDS = ["", "jednego", "dwóch", "trzech", "czterech"];
const LEAD_WORDS = ["", "jednego", "dwóch"];

/** Plain summary, e.g. "Mecz do dwóch wygranych setów. Każdy set do 11 punktów, z przewagą dwóch." */
export function describeMatchRules(rules: MatchRules | null, fallback: { bestOf: number; allowDraws: boolean }): string {
  if (!rules) {
    if (fallback.allowDraws) return "Mecz to jedna gra; wynik to gole lub punkty, remis jest możliwy.";
    if (fallback.bestOf <= 1) return "Mecz to jedna gra ze zwycięzcą.";
    const wins = Math.floor(fallback.bestOf / 2) + 1;
    return `Mecz do ${COUNT_WORDS[wins] ?? wins} wygranych gier (seria do ${fallback.bestOf}).`;
  }
  const sets = rules.setsToWin === 1 ? "Mecz to jeden set." : `Mecz do ${COUNT_WORDS[rules.setsToWin] ?? rules.setsToWin} wygranych setów.`;
  const lead = rules.winBy === 1 ? "" : `, z przewagą ${LEAD_WORDS[rules.winBy] ?? rules.winBy}`;
  return `${sets} Każdy set do ${rules.pointsPerSet} punktów${lead}.`;
}

/** Ready-made match rules. Names describe the rules only — no claim of compliance with any sport. */
export const MATCH_RULE_PRESETS: ReadonlyArray<{ id: string; label: string; rules: MatchRules | null; bestOf: number; allowDraws: boolean }> = Object.freeze([
  { id: "single_game", label: "Jedna gra ze zwycięzcą", rules: null, bestOf: 1, allowDraws: false },
  { id: "series_bo3", label: "Do 2 wygranych gier", rules: null, bestOf: 3, allowDraws: false },
  { id: "series_bo5", label: "Do 3 wygranych gier", rules: null, bestOf: 5, allowDraws: false },
  { id: "score_draws", label: "Jedna gra na gole lub punkty, remis możliwy", rules: null, bestOf: 1, allowDraws: true },
  { id: "sets_2_11", label: "Do 2 wygranych setów, set do 11, przewaga 2", rules: { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 }, bestOf: 3, allowDraws: false },
  { id: "sets_3_11", label: "Do 3 wygranych setów, set do 11, przewaga 2", rules: { version: 1, kind: "sets", setsToWin: 3, pointsPerSet: 11, winBy: 2 }, bestOf: 5, allowDraws: false },
  { id: "sets_2_21", label: "Do 2 wygranych setów, set do 21, przewaga 2", rules: { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 21, winBy: 2 }, bestOf: 3, allowDraws: false },
  { id: "sets_3_25", label: "Do 3 wygranych setów, set do 25, przewaga 2", rules: { version: 1, kind: "sets", setsToWin: 3, pointsPerSet: 25, winBy: 2 }, bestOf: 5, allowDraws: false },
]);
