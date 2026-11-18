/**
 * Match rules — one source of truth for the API (validation, decisions) and the screens (descriptions, previews).
 *
 * Three separate levels (V5.10):
 *  A. Score of one game — what one game/leg/set records: goals or points (`score1:score2`), or a set score
 *     (`sets.ts`). Checked where the game is entered.
 *  B. Decision of the whole match — how the games decide the match (this file, `MatchRules` per stage):
 *       null (no rules stored): the existing meaning — one game, a series to N won games (best of), or, in a
 *            league that allows draws, one game whose score is goals/points;
 *       { kind: "sets" }: sets to `pointsPerSet` with a lead of `winBy`; first to `setsToWin` sets wins (V5.7);
 *       { kind: "two_legs" }: a two-legged knockout tie — two games between the same pair, the aggregate decides
 *            (`two-legs.ts`, V5.10). A level aggregate never picks a winner by itself: the organizer records the
 *            decision (e.g. extra time or penalties played on the field) with a reason. No away-goals rule.
 *  C. Classification points — points for a result, bonuses, penalties, tie-breaks (league rules, point
 *     adjustments). Independent from A and B.
 *
 * Old stages keep `match_rules = NULL` and their meaning; nothing is invented for historical results.
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

/** The only supported policy for a level aggregate: the organizer decides, with a stated reason. */
export type LevelAggregatePolicy = "organizer_decision";

export interface TwoLegMatchRules {
  version: typeof MATCH_RULES_VERSION;
  kind: "two_legs";
  levelAggregate: LevelAggregatePolicy;
}

export type MatchRules = SetMatchRules | TwoLegMatchRules;

export function isSetRules(rules: MatchRules | null | undefined): rules is SetMatchRules {
  return rules?.kind === "sets";
}

export function isTwoLegRules(rules: MatchRules | null | undefined): rules is TwoLegMatchRules {
  return rules?.kind === "two_legs";
}

export type MatchRulesErrorCode =
  | "MATCH_RULES_NOT_OBJECT"
  | "MATCH_RULES_UNKNOWN_FIELD"
  | "MATCH_RULES_VERSION_UNSUPPORTED"
  | "MATCH_RULES_KIND_UNSUPPORTED"
  | "SETS_TO_WIN_INVALID"
  | "POINTS_PER_SET_INVALID"
  | "WIN_BY_INVALID"
  | "LEVEL_AGGREGATE_POLICY_INVALID"
  | "MATCH_RULES_DRAWS_CONFLICT"
  | "MATCH_RULES_BEST_OF_CONFLICT"
  | "MATCH_RULES_FORMAT_UNSUPPORTED";

export interface MatchRulesProblem {
  code: MatchRulesErrorCode;
  path: string;
  message: string;
}

export type MatchRulesParseResult = { ok: true; value: MatchRules | null } | { ok: false; problems: MatchRulesProblem[] };

const SET_FIELDS = new Set(["version", "kind", "setsToWin", "pointsPerSet", "winBy"]);
const TWO_LEG_FIELDS = new Set(["version", "kind", "levelAggregate"]);

/** Strict parser for API input, the AI file and Backup V3. `null`/`undefined` = no rules (existing meaning). */
export function parseMatchRules(raw: unknown, path = "matchRules"): MatchRulesParseResult {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, problems: [{ code: "MATCH_RULES_NOT_OBJECT", path, message: "Zasady meczu muszą być obiektem." }] };
  }
  const input = raw as Record<string, unknown>;
  const problems: MatchRulesProblem[] = [];
  if (input.version !== undefined && input.version !== MATCH_RULES_VERSION) {
    problems.push({ code: "MATCH_RULES_VERSION_UNSUPPORTED", path: `${path}.version`, message: "Nieobsługiwana wersja zasad meczu." });
  }
  if (input.kind !== "sets" && input.kind !== "two_legs") {
    problems.push({ code: "MATCH_RULES_KIND_UNSUPPORTED", path: `${path}.kind`, message: "Obsługiwane rodzaje zasad meczu: \"sets\" (mecz rozstrzygany setami) i \"two_legs\" (dwumecz — suma dwóch spotkań)." });
    return { ok: false, problems };
  }
  const allowed = input.kind === "sets" ? SET_FIELDS : TWO_LEG_FIELDS;
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) problems.push({ code: "MATCH_RULES_UNKNOWN_FIELD", path: `${path}.${key}`, message: `Nieznane pole zasad meczu: ${key}.` });
  }
  if (input.kind === "two_legs") {
    if (input.levelAggregate !== undefined && input.levelAggregate !== "organizer_decision") {
      problems.push({ code: "LEVEL_AGGREGATE_POLICY_INVALID", path: `${path}.levelAggregate`, message: "Przy równej sumie rozstrzyga organizator (\"organizer_decision\"); zasada bramek wyjazdowych nie jest obsługiwana." });
    }
    if (problems.length) return { ok: false, problems };
    return { ok: true, value: { version: MATCH_RULES_VERSION, kind: "two_legs", levelAggregate: "organizer_decision" } };
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

/**
 * Length of one game in the stage. A set match is a series to `setsToWin` won sets (2 × setsToWin − 1);
 * each leg of a two-legged tie is one game (best of 1).
 */
export function bestOfForMatchRules(rules: MatchRules): number {
  return rules.kind === "sets" ? 2 * rules.setsToWin - 1 : 1;
}

/** Formats in which the rules can run. */
export function formatsForMatchRules(rules: MatchRules | null): readonly string[] {
  if (rules?.kind === "two_legs") return ["single_elimination"];
  return ["single_elimination", "double_elimination", "round_robin", "swiss", "group_stage"];
}

/** Checks the rules against the rest of the stage (draws, length, format). */
export function validateMatchRulesForStage(
  rules: MatchRules | null,
  stage: { format: string; bestOf: number; allowDraws: boolean },
  path = "matchRules",
): MatchRulesProblem[] {
  if (!rules) return [];
  const problems: MatchRulesProblem[] = [];
  if (rules.kind === "two_legs") {
    if (stage.format !== "single_elimination") {
      problems.push({ code: "MATCH_RULES_FORMAT_UNSUPPORTED", path, message: "Dwumecz działa w drabince pojedynczej eliminacji (każda para gra dwa spotkania, awansuje zwycięzca sumy)." });
    }
    if (stage.allowDraws) {
      problems.push({ code: "MATCH_RULES_DRAWS_CONFLICT", path, message: "Dwumecz zawsze ma zwycięzcę — remis w tabeli nie ma tu zastosowania (remis w pojedynczym spotkaniu jest dozwolony)." });
    }
    if (stage.bestOf !== 1) {
      problems.push({ code: "MATCH_RULES_BEST_OF_CONFLICT", path, message: "Każde spotkanie dwumeczu to jedna gra (bez serii)." });
    }
    return problems;
  }
  if (stage.allowDraws) {
    problems.push({ code: "MATCH_RULES_DRAWS_CONFLICT", path, message: "Mecz rozstrzygany setami zawsze ma zwycięzcę — wyłącz remisy w punktacji tabeli albo wybierz inne zasady meczu." });
  }
  if (stage.bestOf !== bestOfForMatchRules(rules)) {
    problems.push({ code: "MATCH_RULES_BEST_OF_CONFLICT", path, message: `Długość meczu wynika z zasad setów: do ${rules.setsToWin} wygranych setów to najwyżej ${bestOfForMatchRules(rules)} setów.` });
  }
  if (!formatsForMatchRules(rules).includes(stage.format)) {
    problems.push({ code: "MATCH_RULES_FORMAT_UNSUPPORTED", path, message: "Ten format nie obsługuje zasad setowych." });
  }
  return problems;
}

const COUNT_WORDS = ["", "jednego", "dwóch", "trzech", "czterech"];
const LEAD_WORDS = ["", "jednego", "dwóch"];

export const TWO_LEGS_DESCRIPTION = "Dwumecz: para gra dwa spotkania (każdy uczestnik raz jest gospodarzem). Awansuje uczestnik z większą sumą zdobytych bramek lub punktów. Przy równej sumie rozstrzyga organizator — na przykład po dogrywce lub rzutach karnych rozegranych na boisku — i podaje powód.";

/** Plain summary, e.g. "Mecz do dwóch wygranych setów. Każdy set do 11 punktów, z przewagą dwóch." */
export function describeMatchRules(rules: MatchRules | null, fallback: { bestOf: number; allowDraws: boolean }): string {
  if (!rules) {
    if (fallback.allowDraws) return "Mecz to jedna gra; wynik to gole lub punkty, remis jest możliwy.";
    if (fallback.bestOf <= 1) return "Mecz to jedna gra ze zwycięzcą.";
    const wins = Math.floor(fallback.bestOf / 2) + 1;
    return `Mecz do ${COUNT_WORDS[wins] ?? wins} wygranych gier (seria do ${fallback.bestOf}).`;
  }
  if (rules.kind === "two_legs") return TWO_LEGS_DESCRIPTION;
  const sets = rules.setsToWin === 1 ? "Mecz to jeden set." : `Mecz do ${COUNT_WORDS[rules.setsToWin] ?? rules.setsToWin} wygranych setów.`;
  const lead = rules.winBy === 1 ? "" : `, z przewagą ${LEAD_WORDS[rules.winBy] ?? rules.winBy}`;
  return `${sets} Każdy set do ${rules.pointsPerSet} punktów${lead}.`;
}

/** Level B kind of a stage, for screens, the plan preview and the AI capability catalog. */
export type MatchDecisionKind = "single_game" | "series" | "score_draws" | "sets" | "two_legs";

export function matchDecisionKind(rules: MatchRules | null, stage: { bestOf: number; allowDraws: boolean }): MatchDecisionKind {
  if (rules?.kind === "two_legs") return "two_legs";
  if (rules?.kind === "sets") return "sets";
  if (stage.allowDraws) return "score_draws";
  return stage.bestOf > 1 ? "series" : "single_game";
}

export interface MatchRulePreset {
  id: string;
  label: string;
  /** One short sentence for organizers (shown under the choice). */
  description: string;
  rules: MatchRules | null;
  bestOf: number;
  allowDraws: boolean;
  /** Tournament formats where the preset is offered (a preset is shown only where its logic fully works). */
  formats: readonly string[];
}

const ALL_FORMATS = Object.freeze(["single_elimination", "double_elimination", "round_robin", "swiss", "group_stage"]);
const LEAGUE_FORMATS = Object.freeze(["round_robin", "group_stage"]);

/** Ready-made match rules. Names describe the rules only — no claim of compliance with any sport. */
export const MATCH_RULE_PRESETS: ReadonlyArray<MatchRulePreset> = Object.freeze([
  { id: "single_game", label: "Jedna gra ze zwycięzcą", description: "Jeden mecz, jedna gra — zawsze jest zwycięzca.", rules: null, bestOf: 1, allowDraws: false, formats: ALL_FORMATS },
  { id: "series_bo3", label: "Do 2 wygranych gier", description: "Seria do dwóch wygranych gier (najwyżej trzy gry, BO3).", rules: null, bestOf: 3, allowDraws: false, formats: ALL_FORMATS },
  { id: "series_bo5", label: "Do 3 wygranych gier", description: "Seria do trzech wygranych gier (najwyżej pięć gier, BO5).", rules: null, bestOf: 5, allowDraws: false, formats: ALL_FORMATS },
  { id: "score_draws", label: "Jedna gra na gole lub punkty, remis możliwy", description: "Wpisujesz gole lub punkty; równy wynik to remis (tylko ligi i grupy).", rules: null, bestOf: 1, allowDraws: true, formats: LEAGUE_FORMATS },
  { id: "sets_2_11", label: "Do 2 wygranych setów, set do 11, przewaga 2", description: "Mecz na sety: dwa wygrane sety; set do 11 punktów z przewagą dwóch.", rules: { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 }, bestOf: 3, allowDraws: false, formats: ALL_FORMATS },
  { id: "sets_3_11", label: "Do 3 wygranych setów, set do 11, przewaga 2", description: "Mecz na sety: trzy wygrane sety; set do 11 punktów z przewagą dwóch.", rules: { version: 1, kind: "sets", setsToWin: 3, pointsPerSet: 11, winBy: 2 }, bestOf: 5, allowDraws: false, formats: ALL_FORMATS },
  { id: "sets_2_21", label: "Do 2 wygranych setów, set do 21, przewaga 2", description: "Mecz na sety: dwa wygrane sety; set do 21 punktów z przewagą dwóch.", rules: { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 21, winBy: 2 }, bestOf: 3, allowDraws: false, formats: ALL_FORMATS },
  { id: "sets_3_25", label: "Do 3 wygranych setów, set do 25, przewaga 2", description: "Mecz na sety: trzy wygrane sety; set do 25 punktów z przewagą dwóch.", rules: { version: 1, kind: "sets", setsToWin: 3, pointsPerSet: 25, winBy: 2 }, bestOf: 5, allowDraws: false, formats: ALL_FORMATS },
  { id: "two_legs", label: "Dwumecz — suma dwóch spotkań", description: "Dwa spotkania tej samej pary. Awansuje uczestnik z większą sumą zdobytych bramek lub punktów; przy równej sumie rozstrzyga organizator.", rules: { version: 1, kind: "two_legs", levelAggregate: "organizer_decision" }, bestOf: 1, allowDraws: false, formats: Object.freeze(["single_elimination"]) },
]);

/** Presets offered for a format (e.g. the two-legged tie only in a single-elimination bracket). */
export function matchRulePresetsFor(format: string): MatchRulePreset[] {
  return MATCH_RULE_PRESETS.filter((preset) => preset.formats.includes(format));
}
