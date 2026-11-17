/**
 * V5 · Stage B — versioned tournament configuration for AI assistants.
 *
 * Everything here is derived from the live engine catalog (presets, stage formats,
 * validators), so the downloadable specification cannot promise features the engine
 * does not have. Import is validate-only: nothing is persisted, and the file can never
 * set a name, passwords, tokens, owners, ids, results or history.
 */
import { calculateBalancedGroupSizes } from "./group-stage";
import { calculateSingleEliminationProgression, nextPowerOfTwo } from "./stage-placement";
import {
  BRACKET_PLACEMENT_METHODS,
  GROUP_PLACEMENT_METHODS,
  GROUP_RESULT_SEEDING_METHODS,
  STAGE_BEST_OF_VALUES,
  TOURNAMENT_STAGE_FORMATS,
  validateTournamentStagePlan,
  type StageBestOf,
  type TournamentStagePlan,
  type TournamentStagesPlan,
} from "./tournament-stage-plan";
import { compileV1StagePlanToRoutingV2, doubleEliminationFormatEngineV2 } from "./v2";
import {
  LEAGUE_TIE_BREAKERS,
  MAX_LEAGUE_POINTS,
  describeLeagueRules,
  parseLeagueRules,
  validateLeagueRulesForStage,
  type LeagueRules,
} from "./league-rules";
import {
  DEFAULT_SCHEDULE_TIME_ZONE,
  MAX_SCHEDULE_INTERVAL_DAYS,
  generateRoundDates,
  isValidTimeZone,
  parseSchedulePlan,
  roundRobinFacts,
} from "./league-schedule";
import {
  PLANNED_PRESETS,
  PRESET_DEFINITIONS,
  PRESET_IDS,
  PRESET_PARAM_TEXT,
  PRESET_TUNABLE_PARAMS,
  PresetError,
  previewPreset,
  type PresetId,
  type PresetParams,
  type PresetParamKey,
  type PresetPreview,
} from "./tournament-presets";

export const AI_CONFIG_SCHEMA_VERSION = 1 as const;
export const AI_CONFIG_SCHEMA_ID = "https://swarm006.app/schemas/tournament-config.v1.json";
export const AI_CONFIG_MAX_BYTES = 64 * 1024;
export const AI_CONFIG_MAX_DEPTH = 8;
export const AI_CONFIG_MIN_PARTICIPANTS = 2;
export const AI_CONFIG_MAX_PARTICIPANTS = 128;
export const AI_CONFIG_MAX_STAGES = 10;
export const AI_CONFIG_NOTES_MAX = 1000;

/** First-stage entry orders that need no secret random seed. */
export const AI_ENTRY_SEEDING_METHODS = ["registration_order", "alphabetical", "manual"] as const;

/**
 * Keys that must never come from an imported file — reported with a dedicated message
 * wherever they appear (even nested), before the generic unknown-field check.
 */
export const AI_FORBIDDEN_KEYS = [
  "name", "title", "tournamentName", "description",
  "password", "organizerPassword", "supportPassword", "viewerPassword", "hostCode",
  "token", "organizerToken", "accessToken", "apiKey", "secret",
  "owner", "ownerId", "createdBy", "permissions", "role", "roles",
  "id", "tournamentId", "stageId", "matchId",
  "players", "participantList", "matches", "results", "history", "standings",
  "status", "winnerId", "createdAt", "updatedAt", "randomSeed",
] as const;
const FORBIDDEN = new Set<string>(AI_FORBIDDEN_KEYS.map((key) => key.toLowerCase()));

export interface AiConfigProblem {
  path: string;
  code:
    | "INVALID_JSON"
    | "TOO_LARGE"
    | "TOO_DEEP"
    | "NOT_AN_OBJECT"
    | "UNSUPPORTED_SCHEMA_VERSION"
    | "FORBIDDEN_FIELD"
    | "UNKNOWN_FIELD"
    | "MISSING_FIELD"
    | "INVALID_VALUE"
    | "ENGINE_REJECTED";
  message: string;
}

export interface AiTournamentConfigV1 {
  schemaVersion: 1;
  kind: "tournament" | "league";
  participants: { type: "players" | "teams"; count: number };
  visibility: "public_online" | "private_online" | "private_offline";
  structure:
    | { type: "preset"; presetId: PresetId; params: PresetParams }
    | { type: "stages"; stages: AiStageV1[] };
  /** V5.3: dates for the first league/group stage (one date per round). */
  schedule?: AiScheduleV1;
  notes?: string;
}

export interface AiScheduleV1 {
  timeZone: string;
  startDate: string;
  intervalDays: number;
  defaultTime: string;
}

export interface AiStageV1 {
  /** Stage label shown in the app ("name" is reserved and forbidden everywhere in the file). */
  label: string;
  format: TournamentStagePlan["format"];
  bestOf: StageBestOf;
  participantCount?: number;
  rounds?: number;
  advancingCount?: number;
  groupCount?: number;
  qualifiersPerGroup?: number;
  placementMethod?: string;
  resultSeedingMethod?: string;
  entrySeedingMethod?: (typeof AI_ENTRY_SEEDING_METHODS)[number];
  /** round_robin only: 2 = home and away. */
  legs?: 1 | 2;
  /** V5.3: round_robin and group_stage: draws, points and tie-breakers. */
  leagueRules?: LeagueRules;
}

export type AiConfigValidation =
  | {
      valid: true;
      config: AiTournamentConfigV1;
      preview: PresetPreview;
      /** Where the UI continues: the wizard (preset) or the advanced editor (custom stages). */
      continueIn: "wizard" | "advanced";
      notes: string | null;
    }
  | { valid: false; problems: AiConfigProblem[] };

// ── parsing ─────────────────────────────────────────────────────────────────

type Rec = Record<string, unknown>;
const isRecord = (value: unknown): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);

function depthOf(value: unknown, level = 0): number {
  if (level > AI_CONFIG_MAX_DEPTH) return level;
  if (Array.isArray(value)) return Math.max(level, ...value.map((item) => depthOf(item, level + 1)));
  if (isRecord(value)) return Math.max(level, ...Object.values(value).map((item) => depthOf(item, level + 1)));
  return level;
}

function collectForbidden(value: unknown, path: string, problems: AiConfigProblem[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbidden(item, `${path}[${index}]`, problems));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, inner] of Object.entries(value)) {
    const here = path ? `${path}.${key}` : key;
    if (FORBIDDEN.has(key.toLowerCase())) {
      problems.push({
        path: here,
        code: "FORBIDDEN_FIELD",
        message: `Pole „${key}” jest niedozwolone w imporcie. Nazwę turnieju i hasła wpisujesz w aplikacji; identyfikatory, wyniki i uprawnienia nadaje serwer.`,
      });
      continue;
    }
    collectForbidden(inner, here, problems);
  }
}

/** Plain-language reason for fields that are misplaced or describe features the engine does not have yet. */
function unsupportedFieldHint(key: string): string | null {
  const k = key.toLowerCase();
  if (/draw|remis|scor|point|punkt/.test(k)) return "remisy i punktację podaj w presecie jako params (allowDraws, pointsWin, pointsDraw, pointsLoss) albo w etapie jako leagueRules.";
  if (/schedul|date|time|calendar|termin|kolejk/.test(k)) return "terminarz podaj w polu schedule na najwyższym poziomie pliku (timeZone, startDate, intervalDays, defaultTime).";
  if (/division|promot|relegat|dywizj|spad/.test(k)) return "dywizje, awanse i spadki między ligami nie są jeszcze obsługiwane.";
  if (/roster|lineup|player|member|sklad|skład|team/.test(k)) return "zawodników, drużyny i składy dodajesz w aplikacji po utworzeniu turnieju.";
  return null;
}

function checkKeys(record: Rec, allowed: readonly string[], path: string, problems: AiConfigProblem[]): void {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN.has(key.toLowerCase())) continue; // already reported
    if (!allowed.includes(key)) {
      const hint = unsupportedFieldHint(key);
      problems.push({ path: path ? `${path}.${key}` : key, code: "UNKNOWN_FIELD", message: hint
        ? `Pole „${key}”: ${hint} Usuń je z pliku.`
        : `Nieznane pole „${key}”. Dozwolone: ${allowed.join(", ")}.` });
    }
  }
}

function requireEnum<T extends string>(record: Rec, key: string, values: readonly T[], path: string, problems: AiConfigProblem[], fallback?: T): T | null {
  const value = record[key];
  if (value === undefined && fallback !== undefined) return fallback;
  if (value === undefined) {
    problems.push({ path: `${path}${key}`, code: "MISSING_FIELD", message: `Brak wymaganego pola „${key}”.` });
    return null;
  }
  if (typeof value !== "string" || !values.includes(value as T)) {
    problems.push({ path: `${path}${key}`, code: "INVALID_VALUE", message: `„${key}” musi mieć jedną z wartości: ${values.join(", ")}.` });
    return null;
  }
  return value as T;
}

function optionalInteger(record: Rec, key: string, path: string, problems: AiConfigProblem[], min: number, max: number): number | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    problems.push({ path: `${path}${key}`, code: "INVALID_VALUE", message: `„${key}” musi być liczbą całkowitą od ${min} do ${max}.` });
    return undefined;
  }
  return value as number;
}

const STAGE_KEYS = [
  "label", "format", "bestOf", "participantCount", "rounds", "advancingCount", "groupCount",
  "qualifiersPerGroup", "placementMethod", "resultSeedingMethod", "entrySeedingMethod", "legs", "leagueRules",
] as const;

const SCHEDULE_KEYS = ["timeZone", "startDate", "intervalDays", "defaultTime"] as const;

function parseSchedule(raw: unknown, problems: AiConfigProblem[]): AiScheduleV1 | undefined {
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) {
    problems.push({ path: "schedule", code: "NOT_AN_OBJECT", message: "schedule musi być obiektem (timeZone, startDate, intervalDays, defaultTime)." });
    return undefined;
  }
  checkKeys(raw, SCHEDULE_KEYS, "schedule", problems);
  const timeZone = raw.timeZone ?? DEFAULT_SCHEDULE_TIME_ZONE;
  if (!isValidTimeZone(timeZone)) {
    problems.push({ path: "schedule.timeZone", code: "INVALID_VALUE", message: "schedule.timeZone musi być strefą IANA, np. Europe/Warsaw." });
    return undefined;
  }
  const { timeZone: _ignored, ...template } = raw;
  const parsed = parseSchedulePlan(template, timeZone, null, "schedule");
  if (!parsed.ok) {
    for (const problem of parsed.problems) problems.push({ path: problem.path, code: "INVALID_VALUE", message: problem.message });
    return undefined;
  }
  return { timeZone: timeZone as string, ...parsed.value! };
}

function parseStage(raw: unknown, index: number, problems: AiConfigProblem[]): AiStageV1 | null {
  const path = `structure.stages[${index}].`;
  if (!isRecord(raw)) {
    problems.push({ path: path.slice(0, -1), code: "NOT_AN_OBJECT", message: "Etap musi być obiektem." });
    return null;
  }
  checkKeys(raw, STAGE_KEYS, path.slice(0, -1), problems);
  const label = raw.label;
  if (typeof label !== "string" || label.trim().length === 0 || label.length > 60) {
    problems.push({ path: `${path}label`, code: "INVALID_VALUE", message: "label (nazwa etapu): 1–60 znaków. To nie jest nazwa turnieju." });
  }
  const format = requireEnum(raw, "format", TOURNAMENT_STAGE_FORMATS, path, problems);
  const bestOf = raw.bestOf ?? 1;
  if (!STAGE_BEST_OF_VALUES.includes(bestOf as StageBestOf)) {
    problems.push({ path: `${path}bestOf`, code: "INVALID_VALUE", message: "bestOf musi wynosić 1, 3, 5 lub 7." });
  }
  const entry = raw.entrySeedingMethod === undefined
    ? undefined
    : requireEnum(raw, "entrySeedingMethod", AI_ENTRY_SEEDING_METHODS, path, problems) ?? undefined;
  if (entry !== undefined && index > 0) {
    problems.push({ path: `${path}entrySeedingMethod`, code: "INVALID_VALUE", message: "Kolejność wejścia ustawia się tylko dla pierwszego etapu; kolejne etapy dziedziczą rozstawienie z wyników." });
  }
  const placementValues = format === "group_stage" ? GROUP_PLACEMENT_METHODS.filter((value) => value !== "random")
    : BRACKET_PLACEMENT_METHODS.filter((value) => value !== "random");
  const placementMethod = raw.placementMethod === undefined ? undefined
    : requireEnum(raw, "placementMethod", placementValues, path, problems) ?? undefined;
  const resultSeedingMethod = raw.resultSeedingMethod === undefined ? undefined
    : requireEnum(raw, "resultSeedingMethod", GROUP_RESULT_SEEDING_METHODS, path, problems) ?? undefined;
  if (format && format !== "group_stage" && raw.resultSeedingMethod !== undefined) {
    problems.push({ path: `${path}resultSeedingMethod`, code: "INVALID_VALUE", message: "resultSeedingMethod dotyczy tylko fazy grupowej." });
  }
  if (format && !["single_elimination", "double_elimination", "group_stage"].includes(format) && raw.placementMethod !== undefined) {
    problems.push({ path: `${path}placementMethod`, code: "INVALID_VALUE", message: "placementMethod dotyczy tylko drabinek i fazy grupowej." });
  }
  const stage: AiStageV1 = {
    label: typeof label === "string" ? label.trim() : "",
    format: (format ?? "single_elimination") as AiStageV1["format"],
    bestOf: bestOf as StageBestOf,
    participantCount: optionalInteger(raw, "participantCount", path, problems, 2, AI_CONFIG_MAX_PARTICIPANTS),
    rounds: optionalInteger(raw, "rounds", path, problems, 1, 20),
    advancingCount: optionalInteger(raw, "advancingCount", path, problems, 1, AI_CONFIG_MAX_PARTICIPANTS),
    groupCount: optionalInteger(raw, "groupCount", path, problems, 1, 64),
    qualifiersPerGroup: optionalInteger(raw, "qualifiersPerGroup", path, problems, 1, 64),
    ...(placementMethod ? { placementMethod } : {}),
    ...(resultSeedingMethod ? { resultSeedingMethod } : {}),
    ...(entry ? { entrySeedingMethod: entry } : {}),
  };
  if (raw.leagueRules !== undefined) {
    if (format !== "round_robin" && format !== "group_stage") {
      problems.push({ path: `${path}leagueRules`, code: "INVALID_VALUE", message: "leagueRules (punktacja, remisy) dotyczy tylko round_robin i group_stage." });
    } else {
      const parsedRules = parseLeagueRules(raw.leagueRules, `${path}leagueRules`);
      if (!parsedRules.ok) {
        for (const problem of parsedRules.problems) problems.push({ path: problem.path, code: "INVALID_VALUE", message: problem.message });
      } else if (parsedRules.value) {
        for (const problem of validateLeagueRulesForStage(parsedRules.value, { format: format ?? "", bestOf: Number(bestOf) }, `${path}leagueRules`)) {
          problems.push({ path: problem.path, code: "INVALID_VALUE", message: problem.message });
        }
        stage.leagueRules = parsedRules.value;
      }
    }
  }
  if (raw.legs !== undefined) {
    if (format !== "round_robin") problems.push({ path: `${path}legs`, code: "INVALID_VALUE", message: "legs (mecz i rewanż) dotyczy tylko round_robin." });
    else if (raw.legs !== 1 && raw.legs !== 2) problems.push({ path: `${path}legs`, code: "INVALID_VALUE", message: "legs musi wynosić 1 albo 2." });
    else stage.legs = raw.legs;
  }
  if (format === "swiss" && stage.rounds === undefined) {
    problems.push({ path: `${path}rounds`, code: "MISSING_FIELD", message: "System szwajcarski wymaga liczby rund (rounds)." });
  }
  if (format === "group_stage") {
    if (stage.groupCount === undefined) problems.push({ path: `${path}groupCount`, code: "MISSING_FIELD", message: "Faza grupowa wymaga groupCount." });
    if (stage.qualifiersPerGroup === undefined) problems.push({ path: `${path}qualifiersPerGroup`, code: "MISSING_FIELD", message: "Faza grupowa wymaga qualifiersPerGroup." });
  }
  for (const key of ["rounds"] as const) {
    if (format !== "swiss" && raw[key] !== undefined) problems.push({ path: `${path}${key}`, code: "INVALID_VALUE", message: "rounds dotyczy tylko systemu szwajcarskiego." });
  }
  for (const key of ["groupCount", "qualifiersPerGroup"] as const) {
    if (format !== "group_stage" && raw[key] !== undefined) problems.push({ path: `${path}${key}`, code: "INVALID_VALUE", message: `${key} dotyczy tylko fazy grupowej.` });
  }
  if (format === "group_stage" && raw.advancingCount !== undefined) {
    problems.push({ path: `${path}advancingCount`, code: "INVALID_VALUE", message: "W fazie grupowej awans ustala qualifiersPerGroup." });
  }
  return stage;
}

function parseParams(raw: unknown, presetId: PresetId, problems: AiConfigProblem[]): PresetParams {
  const params: PresetParams = {};
  if (raw === undefined) return params;
  if (!isRecord(raw)) {
    problems.push({ path: "structure.params", code: "NOT_AN_OBJECT", message: "params musi być obiektem." });
    return params;
  }
  const allowed = PRESET_TUNABLE_PARAMS[presetId];
  checkKeys(raw, allowed, "structure.params", problems);
  for (const key of allowed) {
    const value = raw[key];
    if (value === undefined) continue;
    if (!Number.isInteger(value)) {
      problems.push({ path: `structure.params.${key}`, code: "INVALID_VALUE", message: `${key} musi być liczbą całkowitą.` });
      continue;
    }
    params[key] = value as number;
  }
  return params;
}

/** Strict structural parse of an already-decoded object (no engine checks yet). */
export function parseAiTournamentConfig(input: unknown): { config: AiTournamentConfigV1 | null; problems: AiConfigProblem[] } {
  const problems: AiConfigProblem[] = [];
  if (!isRecord(input)) {
    return { config: null, problems: [{ path: "", code: "NOT_AN_OBJECT", message: "Plik musi zawierać jeden obiekt JSON." }] };
  }
  if (depthOf(input) > AI_CONFIG_MAX_DEPTH) {
    return { config: null, problems: [{ path: "", code: "TOO_DEEP", message: `Zbyt głęboko zagnieżdżony plik (maks. ${AI_CONFIG_MAX_DEPTH} poziomów).` }] };
  }
  if (input.schemaVersion !== AI_CONFIG_SCHEMA_VERSION) {
    return {
      config: null,
      problems: [{
        path: "schemaVersion",
        code: "UNSUPPORTED_SCHEMA_VERSION",
        message: input.schemaVersion === undefined
          ? "Brak schemaVersion. Ta wersja aplikacji obsługuje schemaVersion: 1."
          : `Nieobsługiwana wersja schematu: ${JSON.stringify(input.schemaVersion)}. Ta wersja aplikacji obsługuje tylko schemaVersion: 1 — pobierz aktualną specyfikację.`,
      }],
    };
  }
  collectForbidden(input, "", problems);
  checkKeys(input, ["$schema", "schemaVersion", "kind", "participants", "visibility", "structure", "schedule", "notes"], "", problems);
  const schedule = parseSchedule(input.schedule, problems);
  if (input.$schema !== undefined && input.$schema !== AI_CONFIG_SCHEMA_ID) {
    problems.push({ path: "$schema", code: "INVALID_VALUE", message: `$schema (opcjonalne) musi wynosić ${AI_CONFIG_SCHEMA_ID}.` });
  }
  const kind = requireEnum(input, "kind", ["tournament", "league"] as const, "", problems, "tournament");
  const visibility = requireEnum(input, "visibility", ["public_online", "private_online", "private_offline"] as const, "", problems, "public_online");
  let participants: AiTournamentConfigV1["participants"] | null = null;
  if (!isRecord(input.participants)) {
    problems.push({ path: "participants", code: "MISSING_FIELD", message: "Brak obiektu participants z polami type i count." });
  } else {
    checkKeys(input.participants, ["type", "count"], "participants", problems);
    const type = requireEnum(input.participants, "type", ["players", "teams"] as const, "participants.", problems, "players");
    const count = input.participants.count;
    if (!Number.isInteger(count) || (count as number) < AI_CONFIG_MIN_PARTICIPANTS || (count as number) > AI_CONFIG_MAX_PARTICIPANTS) {
      problems.push({ path: "participants.count", code: "INVALID_VALUE", message: `participants.count musi być liczbą całkowitą od ${AI_CONFIG_MIN_PARTICIPANTS} do ${AI_CONFIG_MAX_PARTICIPANTS}.` });
    } else if (type) {
      participants = { type, count: count as number };
    }
  }
  let notes: string | undefined;
  if (input.notes !== undefined) {
    if (typeof input.notes !== "string" || input.notes.length > AI_CONFIG_NOTES_MAX) {
      problems.push({ path: "notes", code: "INVALID_VALUE", message: `notes: zwykły tekst do ${AI_CONFIG_NOTES_MAX} znaków.` });
    } else {
      notes = input.notes;
    }
  }
  let structure: AiTournamentConfigV1["structure"] | null = null;
  const rawStructure = input.structure;
  if (!isRecord(rawStructure)) {
    problems.push({ path: "structure", code: "MISSING_FIELD", message: "Brak obiektu structure (type: \"preset\" albo \"stages\")." });
  } else if (rawStructure.type === "preset") {
    checkKeys(rawStructure, ["type", "presetId", "params"], "structure", problems);
    const presetId = requireEnum(rawStructure, "presetId", PRESET_IDS, "structure.", problems);
    if (presetId) structure = { type: "preset", presetId, params: parseParams(rawStructure.params, presetId, problems) };
  } else if (rawStructure.type === "stages") {
    checkKeys(rawStructure, ["type", "stages"], "structure", problems);
    const rawStages = rawStructure.stages;
    if (!Array.isArray(rawStages) || rawStages.length < 1 || rawStages.length > AI_CONFIG_MAX_STAGES) {
      problems.push({ path: "structure.stages", code: "INVALID_VALUE", message: `structure.stages musi być listą 1–${AI_CONFIG_MAX_STAGES} etapów.` });
    } else {
      const stages = rawStages.map((stage, index) => parseStage(stage, index, problems));
      if (stages.every((stage): stage is AiStageV1 => stage !== null)) structure = { type: "stages", stages };
    }
  } else {
    problems.push({ path: "structure.type", code: "INVALID_VALUE", message: "structure.type musi wynosić \"preset\" albo \"stages\"." });
  }
  if (problems.length > 0 || !kind || !visibility || !participants || !structure) return { config: null, problems };
  return {
    config: {
      schemaVersion: 1, kind, participants, visibility, structure,
      ...(schedule !== undefined ? { schedule } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
    problems,
  };
}

// ── engine conversion ───────────────────────────────────────────────────────

function stageMatches(stage: TournamentStagePlan, advancing: number | null): { min: number; max: number; rounds: { min: number; max: number }; byes: number; groupSizes: number[] | null } {
  const n = stage.participantCount;
  switch (stage.format) {
    case "swiss": {
      const matches = Math.floor(n / 2) * stage.rounds;
      return { min: matches, max: matches, rounds: { min: stage.rounds, max: stage.rounds }, byes: n % 2 === 1 ? stage.rounds : 0, groupSizes: null };
    }
    case "round_robin": {
      const legs = stage.legs === 2 ? 2 : 1;
      const matches = legs * (n * (n - 1)) / 2;
      const rounds = legs * (n % 2 === 0 ? n - 1 : n);
      return { min: matches, max: matches, rounds: { min: rounds, max: rounds }, byes: 0, groupSizes: null };
    }
    case "group_stage": {
      const sizes = calculateBalancedGroupSizes(n, stage.groupCount);
      const matches = sizes.reduce((sum, size) => sum + (size * (size - 1)) / 2, 0);
      const rounds = Math.max(...sizes.map((size) => (size % 2 === 0 ? size - 1 : size)));
      return { min: matches, max: matches, rounds: { min: rounds, max: rounds }, byes: 0, groupSizes: sizes };
    }
    case "single_elimination": {
      const size = nextPowerOfTwo(n);
      if (advancing != null) {
        const progression = calculateSingleEliminationProgression(n, advancing);
        return { min: progression.playedMatchCount, max: progression.playedMatchCount, rounds: { min: progression.rounds, max: progression.rounds }, byes: size - n, groupSizes: null };
      }
      const rounds = Math.log2(size);
      return { min: n - 1, max: n - 1, rounds: { min: rounds, max: rounds }, byes: size - n, groupSizes: null };
    }
    case "double_elimination": {
      const k = Math.log2(nextPowerOfTwo(n));
      return { min: 2 * n - 2, max: 2 * n - 1, rounds: { min: 2 * k, max: 2 * k + 1 }, byes: nextPowerOfTwo(n) - n, groupSizes: null };
    }
  }
}

const FORMAT_LABELS: Record<TournamentStagePlan["format"], string> = {
  single_elimination: "Drabinka pucharowa",
  double_elimination: "Podwójna eliminacja",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  group_stage: "Faza grupowa",
};

/** Builds a V1 plan from custom stages: participant counts flow automatically from advancing counts. */
export function buildCustomStagePlan(count: number, stages: readonly AiStageV1[]): { plan: TournamentStagesPlan | null; problems: AiConfigProblem[] } {
  const problems: AiConfigProblem[] = [];
  let incoming = count;
  const records = stages.map((stage, index) => {
    const participantCount = stage.participantCount ?? incoming;
    if (stage.participantCount !== undefined && stage.participantCount !== incoming) {
      problems.push({
        path: `structure.stages[${index}].participantCount`,
        code: "ENGINE_REJECTED",
        message: `Etap ${index + 1} dostaje ${incoming} uczestników z poprzedniego etapu, a nie ${stage.participantCount}. Usuń participantCount — zostanie wyliczony.`,
      });
    }
    const isFinal = index === stages.length - 1;
    const record: Rec = {
      key: `stage-${index + 1}`,
      position: index + 1,
      name: stage.label,
      format: stage.format,
      participantCount,
      bestOf: stage.bestOf,
      entrySeedingMethod: index === 0 ? stage.entrySeedingMethod ?? "registration_order" : "preserve",
      randomRevealOrder: "instant",
    };
    if (stage.format === "swiss") record.rounds = stage.rounds;
    if (stage.format === "round_robin" && stage.legs === 2) record.legs = 2;
    if ((stage.format === "round_robin" || stage.format === "group_stage") && stage.leagueRules) record.leagueRules = stage.leagueRules;
    if (stage.format === "group_stage") {
      record.groupCount = stage.groupCount;
      record.qualifiersPerGroup = stage.qualifiersPerGroup;
      record.placementMethod = stage.placementMethod ?? "snake";
      record.resultSeedingMethod = stage.resultSeedingMethod ?? "rank_bands";
    }
    if (stage.format === "single_elimination" || stage.format === "double_elimination") record.placementMethod = stage.placementMethod ?? "standard";
    if (!isFinal && stage.advancingCount !== undefined) record.advancingCount = stage.advancingCount;
    if (isFinal && stage.advancingCount !== undefined) {
      problems.push({ path: `structure.stages[${index}].advancingCount`, code: "ENGINE_REJECTED", message: "Ostatni etap nie może mieć awansu (advancingCount)." });
    }
    if (stage.format === "group_stage" && Number.isInteger(stage.groupCount) && Number.isInteger(stage.qualifiersPerGroup)) {
      try {
        const sizes = calculateBalancedGroupSizes(participantCount, stage.groupCount!);
        incoming = sizes.reduce((sum, size) => sum + Math.min(size, stage.qualifiersPerGroup!), 0);
      } catch {
        incoming = 0;
      }
    } else if (stage.advancingCount !== undefined) {
      incoming = stage.advancingCount;
    }
    return record;
  });
  const validation = validateTournamentStagePlan({ initialParticipantCount: count, stages: records });
  if (!validation.valid) {
    for (const problem of validation.problems) {
      problems.push({ path: problem.path.replace(/^stages/, "structure.stages"), code: "ENGINE_REJECTED", message: problem.message });
    }
    return { plan: null, problems };
  }
  if (validation.value.stages.some((stage) => stage.format === "double_elimination") && validation.value.stages.length > 1) {
    const compiled = compileV1StagePlanToRoutingV2(validation.value, [doubleEliminationFormatEngineV2]);
    if (!compiled.valid) problems.push({ path: "structure.stages", code: "ENGINE_REJECTED", message: "Silnik drabinki podwójnej eliminacji nie przyjął tego planu (wymaga potęgi dwójki 4–64)." });
  }
  return problems.length > 0 ? { plan: null, problems } : { plan: validation.value, problems };
}

export function summarizeCustomPlan(plan: TournamentStagesPlan): PresetPreview {
  const stages = plan.stages.map((stage, index) => {
    const next = plan.stages[index + 1];
    const advancing = next ? next.participantCount : null;
    const stats = stageMatches(stage, stage.format === "single_elimination" && next ? advancing : null);
    return {
      position: stage.position, key: stage.key, name: stage.name, format: stage.format,
      formatLabel: FORMAT_LABELS[stage.format], participantCount: stage.participantCount, bestOf: stage.bestOf,
      groupSizes: stats.groupSizes, advancingCount: advancing,
      advancementText: advancing == null ? "Zwycięzca tego etapu wygrywa turniej." : `${advancing} najlepszych przechodzi do etapu „${next!.name}”.`,
      matches: { min: stats.min, max: stats.max }, rounds: stats.rounds, byes: stats.byes,
    };
  });
  const sum = (pick: (stage: (typeof stages)[number]) => number) => stages.reduce((total, stage) => total + pick(stage), 0);
  const first = plan.stages[0];
  const single = plan.stages.length === 1;
  return {
    version: 1,
    presetId: "custom" as PresetId,
    label: "Własna konfiguracja",
    family: single ? (first.format === "swiss" || first.format === "round_robin" ? "points" : "elimination") : "multi_stage",
    params: { participantCount: plan.initialParticipantCount, bestOf: first.bestOf },
    paramLimits: [],
    participants: { mode: "exact", count: plan.initialParticipantCount, minimum: plan.initialParticipantCount },
    creation: {
      format: first.format === "group_stage" ? "round_robin" : first.format,
      maxPlayers: plan.initialParticipantCount,
      defaultBestOf: first.bestOf,
      stagePlan: plan,
    },
    stagePlan: plan,
    stages,
    totals: {
      matches: { min: sum((stage) => stage.matches.min), max: sum((stage) => stage.matches.max) },
      rounds: { min: sum((stage) => stage.rounds.min), max: sum((stage) => stage.rounds.max) },
      matchesPerParticipant: { min: 1, max: sum((stage) => stage.rounds.max) },
    },
    winnerRule: "Mistrzem zostaje zwycięzca ostatniego etapu.",
    tieRules: plan.stages.map((stage) => {
      const rules = (stage.format === "round_robin" || stage.format === "group_stage") ? stage.leagueRules : undefined;
      return rules
        ? `${stage.name}: ${describeLeagueRules(rules)}`
        : `${stage.name}: remisów nie ma — każdy mecz musi mieć zwycięzcę.`;
    }),
    leagueRules: plan.stages.map((stage) => (stage.format === "round_robin" || stage.format === "group_stage") ? stage.leagueRules ?? null : null).find((rules) => rules != null) ?? null,
    schedule: null,
    requirements: [`Przed startem lista musi liczyć dokładnie ${plan.initialParticipantCount} uczestników.`],
    warnings: stages.filter((stage) => stage.byes > 0).map((stage) => `Etap „${stage.name}”: ${stage.byes} wolnych losów.`),
  };
}

/** Full validation of raw text: size, JSON, version, strict structure, engine rules. Read-only. */
export function validateAiTournamentConfigText(text: unknown): AiConfigValidation {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { valid: false, problems: [{ path: "", code: "INVALID_JSON", message: "Wklej treść pliku JSON albo wybierz plik." }] };
  }
  if (Buffer.byteLength(text, "utf8") > AI_CONFIG_MAX_BYTES) {
    return { valid: false, problems: [{ path: "", code: "TOO_LARGE", message: `Plik jest za duży (maks. ${AI_CONFIG_MAX_BYTES / 1024} KB).` }] };
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(text.replace(/^﻿/, ""));
  } catch (error) {
    return { valid: false, problems: [{ path: "", code: "INVALID_JSON", message: `To nie jest poprawny JSON: ${error instanceof Error ? error.message : "błąd składni"}. Poproś AI o sam plik JSON, bez komentarzy i tekstu dookoła.` }] };
  }
  return validateAiTournamentConfig(decoded);
}

/**
 * V5.3: puts the schedule on the first league/group stage of a validated preview and checks every round date
 * (a DST-skipped local time is reported here, before anything is created).
 */
export function attachScheduleToPreview(preview: PresetPreview, schedule: AiScheduleV1): { preview: PresetPreview; problem: AiConfigProblem | null } {
  const targetIndex = preview.stagePlan.stages.findIndex((stage) => stage.format === "round_robin" || stage.format === "group_stage");
  if (targetIndex < 0) {
    return { preview, problem: { path: "schedule", code: "ENGINE_REJECTED", message: "Terminarz kolejek działa w lidze (każdy z każdym) i w fazie grupowej — ta struktura ich nie ma." } };
  }
  const target = preview.stagePlan.stages[targetIndex]!;
  const groupSize = target.format === "group_stage" ? Math.max(...calculateBalancedGroupSizes(target.participantCount, target.groupCount)) : target.participantCount;
  const rounds = roundRobinFacts(groupSize, target.format === "round_robin" && target.legs === 2 ? 2 : 1).rounds;
  const generated = generateRoundDates(schedule, rounds);
  if (!generated.ok) return { preview, problem: { path: "schedule", code: "ENGINE_REJECTED", message: generated.message } };
  const plan = { startDate: schedule.startDate, intervalDays: schedule.intervalDays, defaultTime: schedule.defaultTime };
  const stagePlan = {
    ...preview.stagePlan,
    stages: preview.stagePlan.stages.map((stage, index) => index === targetIndex
      ? { ...stage, scheduleTimeZone: schedule.timeZone, schedulePlan: plan }
      : stage),
  } as TournamentStagesPlan;
  const creation = preview.creation.stagePlan
    ? { ...preview.creation, stagePlan }
    : { ...preview.creation, scheduleTimeZone: schedule.timeZone, schedulePlan: plan };
  return {
    preview: {
      ...preview,
      creation,
      stagePlan,
      schedule: {
        stageName: target.name,
        timeZone: schedule.timeZone,
        startDate: schedule.startDate,
        intervalDays: schedule.intervalDays,
        defaultTime: schedule.defaultTime,
        rounds,
        firstDate: generated.rounds[0]!.date,
        lastDate: generated.rounds.at(-1)!.date,
      },
    },
    problem: null,
  };
}

export function validateAiTournamentConfig(decoded: unknown): AiConfigValidation {
  const { config, problems } = parseAiTournamentConfig(decoded);
  if (!config) return { valid: false, problems };
  const withSchedule = (preview: PresetPreview, continueIn: "wizard" | "advanced"): AiConfigValidation => {
    if (!config.schedule) return { valid: true, config, preview, continueIn, notes: config.notes ?? null };
    const attached = attachScheduleToPreview(preview, config.schedule);
    if (attached.problem) return { valid: false, problems: [attached.problem] };
    return { valid: true, config, preview: attached.preview, continueIn, notes: config.notes ?? null };
  };
  if (config.structure.type === "preset") {
    try {
      const preview = previewPreset({
        presetId: config.structure.presetId,
        params: { ...config.structure.params, participantCount: config.participants.count },
      });
      return withSchedule(preview, "wizard");
    } catch (error) {
      if (!(error instanceof PresetError)) throw error;
      return {
        valid: false,
        problems: [{ path: error.param ? (error.param === "participantCount" ? "participants.count" : `structure.params.${error.param}`) : "structure", code: "ENGINE_REJECTED", message: error.message }],
      };
    }
  }
  const built = buildCustomStagePlan(config.participants.count, config.structure.stages);
  if (!built.plan) return { valid: false, problems: built.problems };
  return withSchedule(summarizeCustomPlan(built.plan), "advanced");
}

// ── specification generator ─────────────────────────────────────────────────

const PARAM_RANGES: Record<PresetParamKey, { minimum: number; maximum: number }> = {
  participantCount: { minimum: 2, maximum: 128 },
  bestOf: { minimum: 1, maximum: 7 },
  playoffBestOf: { minimum: 1, maximum: 7 },
  swissRounds: { minimum: 1, maximum: 15 },
  groupCount: { minimum: 2, maximum: 42 },
  qualifiersPerGroup: { minimum: 1, maximum: 41 },
  advancingCount: { minimum: 2, maximum: 64 },
  legs: { minimum: 1, maximum: 2 },
  allowDraws: { minimum: 0, maximum: 1 },
  pointsWin: { minimum: 0, maximum: 10 },
  pointsDraw: { minimum: 0, maximum: 10 },
  pointsLoss: { minimum: 0, maximum: 10 },
};

function paramSchema(key: PresetParamKey): Rec {
  const text = PRESET_PARAM_TEXT[key];
  if (key === "bestOf" || key === "playoffBestOf") return { description: `${text.label}. ${text.help}`, enum: [...STAGE_BEST_OF_VALUES] };
  if (key === "legs") return { description: `${text.label}. ${text.help}`, enum: [1, 2] };
  if (key === "allowDraws") return { description: `${text.label}. ${text.help}`, enum: [0, 1], default: 0 };
  if (key === "advancingCount") return { description: `${text.label}. ${text.help} Potęga dwójki mniejsza od liczby uczestników.`, enum: [2, 4, 8, 16, 32, 64] };
  return { description: `${text.label}. ${text.help}`, type: "integer", ...PARAM_RANGES[key] };
}

/** JSON Schema (draft 2020-12) generated from the engine catalog. */
export function buildAiConfigJsonSchema(): Rec {
  const presetBranches = PRESET_IDS.map((presetId) => ({
    type: "object",
    additionalProperties: false,
    required: ["type", "presetId"],
    properties: {
      type: { const: "preset" },
      presetId: { const: presetId, description: `${PRESET_DEFINITIONS[presetId].label} — ${PRESET_DEFINITIONS[presetId].short} Uczestników: ${PRESET_DEFINITIONS[presetId].participantRange.join("–")}.` },
      params: {
        type: "object",
        additionalProperties: false,
        properties: Object.fromEntries(PRESET_TUNABLE_PARAMS[presetId].map((key) => [key, paramSchema(key)])),
      },
    },
  }));
  const stageSchema = {
    type: "object",
    additionalProperties: false,
    required: ["label", "format"],
    properties: {
      label: { type: "string", minLength: 1, maxLength: 60, description: "Nazwa etapu widoczna w aplikacji (np. Faza grupowa). Pole name jest zabronione." },
      format: { enum: [...TOURNAMENT_STAGE_FORMATS] },
      bestOf: { enum: [...STAGE_BEST_OF_VALUES], default: 1 },
      participantCount: { type: "integer", minimum: 2, maximum: AI_CONFIG_MAX_PARTICIPANTS, description: "Opcjonalne — wyliczane z poprzedniego etapu. Jeśli podane, musi się zgadzać." },
      rounds: { type: "integer", minimum: 1, maximum: 20, description: "Tylko swiss (wymagane)." },
      advancingCount: { type: "integer", minimum: 1, maximum: AI_CONFIG_MAX_PARTICIPANTS, description: "Awans do następnego etapu (swiss, round_robin, single_elimination). Niedozwolone w ostatnim etapie i w group_stage." },
      groupCount: { type: "integer", minimum: 1, maximum: 64, description: "Tylko group_stage (wymagane): od 1 do floor(uczestnicy/2)." },
      qualifiersPerGroup: { type: "integer", minimum: 1, maximum: 64, description: "Tylko group_stage (wymagane)." },
      placementMethod: { enum: ["snake", "standard"], description: "group_stage: snake; drabinki: standard." },
      resultSeedingMethod: { enum: [...GROUP_RESULT_SEEDING_METHODS], description: "Tylko group_stage." },
      entrySeedingMethod: { enum: [...AI_ENTRY_SEEDING_METHODS], description: "Tylko pierwszy etap." },
      legs: { enum: [1, 2], description: "Tylko round_robin: 2 = mecz i rewanż (każda para gra dwa razy)." },
      leagueRules: {
        type: "object",
        additionalProperties: false,
        required: ["points"],
        description: "Tylko round_robin i group_stage. Punktacja, remisy i kolejność kryteriów przy równej liczbie punktów. Pominięte = tabela według liczby zwycięstw.",
        properties: {
          allowDraws: { type: "boolean", default: false, description: "true wymaga bestOf: 1 — wynik meczu to wtedy np. gole lub punkty jednej gry." },
          points: {
            type: "object",
            additionalProperties: false,
            required: ["win", "draw", "loss"],
            properties: {
              win: { type: "integer", minimum: 0, maximum: MAX_LEAGUE_POINTS },
              draw: { type: "integer", minimum: 0, maximum: MAX_LEAGUE_POINTS },
              loss: { type: "integer", minimum: 0, maximum: MAX_LEAGUE_POINTS },
            },
            description: "win > loss; loss ≤ draw ≤ win. Klasycznie 3/1/0.",
          },
          tieBreakers: { type: "array", uniqueItems: true, items: { enum: [...LEAGUE_TIE_BREAKERS] }, description: "Kolejność kryteriów. Domyślnie: head_to_head, score_difference, scored, wins. Na końcu zawsze rozstawienie." },
        },
      },
    },
  };
  const scheduleSchema = {
    type: "object",
    additionalProperties: false,
    required: ["startDate", "intervalDays", "defaultTime"],
    description: "Terminarz pierwszego etapu ligowego lub grupowego: kolejka 1 w startDate, każda następna co intervalDays dni, o defaultTime czasu lokalnego. Daty pojawiają się po starcie etapu; organizator może je potem zmieniać.",
    properties: {
      timeZone: { type: "string", default: DEFAULT_SCHEDULE_TIME_ZONE, description: "Strefa IANA, np. Europe/Warsaw." },
      startDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "RRRR-MM-DD" },
      intervalDays: { type: "integer", minimum: 1, maximum: MAX_SCHEDULE_INTERVAL_DAYS, description: "7 = co tydzień." },
      defaultTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", description: "GG:MM, czas lokalny. Godzina pominięta lub powtórzona przez zmianę czasu zostanie odrzucona." },
    },
  };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: AI_CONFIG_SCHEMA_ID,
    title: "SWARM-006 tournament configuration",
    description: "Konfiguracja NOWYCH rozgrywek. Nazwa turnieju, hasła, identyfikatory, wyniki i uprawnienia są niedozwolone — ustawia je aplikacja.",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "participants", "structure"],
    properties: {
      $schema: { const: AI_CONFIG_SCHEMA_ID },
      schemaVersion: { const: AI_CONFIG_SCHEMA_VERSION },
      kind: { enum: ["tournament", "league"], default: "tournament", description: "league = rozgrywki tabelowe (każdy z każdym), opcjonalnie z terminarzem (schedule)." },
      participants: {
        type: "object",
        additionalProperties: false,
        required: ["count"],
        properties: {
          type: { enum: ["players", "teams"], default: "players", description: "teams: turniej drużynowy. Składy (kapitan, zawodnicy, rezerwowi) organizator uzupełnia w aplikacji — nie w pliku." },
          count: { type: "integer", minimum: AI_CONFIG_MIN_PARTICIPANTS, maximum: AI_CONFIG_MAX_PARTICIPANTS },
        },
      },
      visibility: { enum: ["public_online", "private_online", "private_offline"], default: "public_online", description: "private_online wymaga hasła widzów — użytkownik poda je w aplikacji." },
      structure: { oneOf: [...presetBranches, { type: "object", additionalProperties: false, required: ["type", "stages"], properties: { type: { const: "stages" }, stages: { type: "array", minItems: 1, maxItems: AI_CONFIG_MAX_STAGES, items: stageSchema } } }] },
      schedule: scheduleSchema,
      notes: { type: "string", maxLength: AI_CONFIG_NOTES_MAX, description: "Krótkie wyjaśnienie dla organizatora. Wyświetlane jako zwykły tekst, nigdy nie zapisywane ani wykonywane." },
    },
  };
}

export const AI_CONFIG_EXAMPLES: Array<{ title: string; request: string; config: Rec }> = [
  {
    title: "Grupy i play-off dla 16 graczy",
    request: "16 graczy, 4 grupy, dwóch najlepszych z grupy do drabinki, play-off do dwóch wygranych.",
    config: {
      $schema: AI_CONFIG_SCHEMA_ID, schemaVersion: 1, kind: "tournament",
      participants: { type: "players", count: 16 },
      structure: { type: "preset", presetId: "groups_playoff", params: { groupCount: 4, qualifiersPerGroup: 2, bestOf: 1, playoffBestOf: 3 } },
      notes: "4 grupy po 4 osoby, top 2 do 8-osobowej drabinki BO3.",
    },
  },
  {
    title: "Liga 10 drużyn z play-off",
    request: "Liga dla 10 drużyn, każdy z każdym, potem półfinały i finał.",
    config: {
      schemaVersion: 1, kind: "league",
      participants: { type: "teams", count: 10 },
      structure: { type: "preset", presetId: "league_playoff", params: { advancingCount: 4, bestOf: 1, playoffBestOf: 3 } },
    },
  },
  {
    title: "Szybki turniej 12 osób",
    request: "Jedno popołudnie, 12 osób, przegrany odpada.",
    config: {
      schemaVersion: 1,
      participants: { count: 12 },
      structure: { type: "preset", presetId: "single_elimination", params: { bestOf: 1 } },
    },
  },
  {
    title: "Własne etapy: szwajcarski → grupy → finał",
    request: "32 graczy: 5 rund szwajcarskich, top 16 do 4 grup, po 2 z grupy do drabinki.",
    config: {
      schemaVersion: 1,
      participants: { type: "players", count: 32 },
      structure: {
        type: "stages",
        stages: [
          { label: "Rundy szwajcarskie", format: "swiss", rounds: 5, advancingCount: 16, bestOf: 1 },
          { label: "Grupy", format: "group_stage", groupCount: 4, qualifiersPerGroup: 2, bestOf: 3 },
          { label: "Finały", format: "single_elimination", bestOf: 3 },
        ],
      },
    },
  },
  {
    title: "Liga 12 drużyn: mecz i rewanż, remisy 3/1/0, co tydzień",
    request: "Liga piłkarska dla 12 drużyn, mecz i rewanż, remisy możliwe, 3 punkty za wygraną, 1 za remis. Gramy w soboty o 18:00 od 5 grudnia.",
    config: {
      schemaVersion: 1, kind: "league",
      participants: { type: "teams", count: 12 },
      structure: { type: "preset", presetId: "round_robin", params: { legs: 2, bestOf: 1, allowDraws: 1, pointsWin: 3, pointsDraw: 1, pointsLoss: 0 } },
      schedule: { timeZone: "Europe/Warsaw", startDate: "2026-12-05", intervalDays: 7, defaultTime: "18:00" },
      notes: "132 mecze w 22 kolejkach, ostatnia kolejka 1 maja 2027.",
    },
  },
  {
    title: "Własna punktacja i kolejność kryteriów",
    request: "8 graczy, każdy z każdym, 2 punkty za wygraną, bez remisów; przy równych punktach najpierw bilans, potem mecz bezpośredni.",
    config: {
      schemaVersion: 1, kind: "league",
      participants: { type: "players", count: 8 },
      structure: {
        type: "stages",
        stages: [
          { label: "Liga", format: "round_robin", bestOf: 1, leagueRules: { allowDraws: false, points: { win: 2, draw: 1, loss: 0 }, tieBreakers: ["score_difference", "head_to_head", "wins"] } },
        ],
      },
    },
  },
];

export interface AiSpecification {
  specVersion: string;
  schemaVersion: typeof AI_CONFIG_SCHEMA_VERSION;
  schema: Rec;
  presets: Array<{ id: PresetId; label: string; summary: string; participants: [number, number]; params: Array<{ key: PresetParamKey; label: string; help: string }> }>;
  stageFormats: Array<{ format: TournamentStagePlan["format"]; label: string }>;
  planned: Array<{ id: string; label: string; reason: string }>;
  forbiddenFields: string[];
  /** V5.1: features the engine does not have, so an AI never promises them. */
  unsupported: string[];
  examples: typeof AI_CONFIG_EXAMPLES;
}

export const AI_UNSUPPORTED_FEATURES: readonly string[] = [
  "Remisy w drabinkach, systemie szwajcarskim i play-off — remis jest możliwy tylko w lidze i fazie grupowej z leagueRules.allowDraws.",
  "Różne godziny meczów w jednej kolejce z pliku — schedule daje jedną godzinę na kolejkę; pojedyncze terminy organizator zmienia w aplikacji.",
  "Dywizje, awanse i spadki między ligami.",
  "Skład drużyny wystawiany na konkretny mecz (składy są na cały turniej i zmienia je organizator).",
  "Mecz i rewanż w fazie grupowej — `legs` działa tylko dla „każdy z każdym”.",
  "Losowe rozstawienie z importu, listy zawodników i składy w pliku — organizator dodaje je w aplikacji.",
];

export function buildAiSpecification(): AiSpecification {
  return {
    specVersion: `${AI_CONFIG_SCHEMA_VERSION}.0`,
    schemaVersion: AI_CONFIG_SCHEMA_VERSION,
    schema: buildAiConfigJsonSchema(),
    presets: PRESET_IDS.map((id) => ({
      id,
      label: PRESET_DEFINITIONS[id].label,
      summary: PRESET_DEFINITIONS[id].description,
      participants: PRESET_DEFINITIONS[id].participantRange,
      params: PRESET_TUNABLE_PARAMS[id].map((key) => ({ key, ...PRESET_PARAM_TEXT[key] })),
    })),
    stageFormats: TOURNAMENT_STAGE_FORMATS.map((format) => ({ format, label: FORMAT_LABELS[format] })),
    planned: PLANNED_PRESETS.map((item) => ({ ...item })),
    forbiddenFields: [...AI_FORBIDDEN_KEYS],
    unsupported: [...AI_UNSUPPORTED_FEATURES],
    examples: AI_CONFIG_EXAMPLES,
  };
}

/** Single self-contained file a user can hand to any AI model. */
export function buildAiSpecificationMarkdown(): string {
  const spec = buildAiSpecification();
  const lines: string[] = [];
  lines.push(`# SWARM-006 — specyfikacja konfiguracji turnieju dla AI (v${spec.specVersion})`, "");
  lines.push("Ten plik opisuje WYŁĄCZNIE funkcje, które aplikacja SWARM-006 obsługuje dziś. Jest generowany automatycznie z silnika turniejowego.", "");
  lines.push("## Zadanie dla modelu AI", "");
  lines.push("1. Przeczytaj, jakie rozgrywki opisuje użytkownik.");
  lines.push("2. Odpowiedz JEDNYM obiektem JSON zgodnym ze schematem poniżej — bez komentarzy, bez tekstu przed i po (możesz opisać wybór w polu `notes`).");
  lines.push("3. Preferuj `structure.type: \"preset\"`. Używaj `\"stages\"` tylko, gdy żaden preset nie pasuje.");
  lines.push("4. Nie wymyślaj pól ani formatów spoza tej specyfikacji — import je odrzuci.", "");
  lines.push("## Czego NIE wolno umieszczać w pliku", "");
  lines.push("Nazwy turnieju, opisu, haseł, tokenów, właściciela, uprawnień, identyfikatorów, list zawodników, wyników ani historii. Użytkownik wpisze nazwę i hasła w aplikacji. Zabronione pola (w dowolnym miejscu pliku):", "");
  lines.push(spec.forbiddenFields.map((field) => `\`${field}\``).join(", "), "");
  lines.push("## Presety (zalecane)", "");
  for (const preset of spec.presets) {
    lines.push(`### \`${preset.id}\` — ${preset.label}`, "");
    lines.push(`${preset.summary} Uczestników: ${preset.participants[0]}–${preset.participants[1]}.`, "");
    for (const param of preset.params) lines.push(`- \`${param.key}\` — ${param.label}. ${param.help}`);
    lines.push("");
  }
  lines.push("`legs` (presety round_robin i league_playoff): 1 = jeden mecz każdej pary, 2 = mecz i rewanż. ");
  lines.push("Punktacja w presetach z tabelą (round_robin, league_playoff, groups_playoff): `pointsWin`, `pointsDraw`, `pointsLoss` (0–10, domyślnie 3/1/0) i `allowDraws` (0 albo 1, domyślnie 0). Remisy wymagają `bestOf: 1`. Przy równej liczbie punktów kolejno decydują: mecze bezpośrednie, różnica wyników, zdobyte, liczba zwycięstw, rozstawienie.");
  lines.push("Zasady parametrów: `bestOf`/`playoffBestOf` ∈ {1, 3, 5, 7}; `groupCount` od 2 do floor(uczestnicy/3); `qualifiersPerGroup` mniejsze od najmniejszej grupy; `advancingCount` to potęga dwójki mniejsza od liczby uczestników; `swissRounds` od 1 (2 w presecie z play-off) do min(uczestnicy−1, 15). Pominięty parametr = rozsądna wartość domyślna.", "");
  lines.push("## Własne etapy (`structure.type: \"stages\"`)", "");
  lines.push(`Do ${AI_CONFIG_MAX_STAGES} etapów rozgrywanych po kolei. Formaty: ${spec.stageFormats.map((item) => `\`${item.format}\` (${item.label})`).join(", ")}.`, "");
  lines.push("- Każdy etap ma `label` (nazwa etapu w aplikacji) i `format`. Pola `name` nie używaj nigdzie.");
  lines.push("- Liczba uczestników etapu jest wyliczana automatycznie: pierwszy etap = `participants.count`, każdy kolejny = awans z poprzedniego.");
  lines.push("- `swiss` wymaga `rounds`; awans przez `advancingCount` (2 … uczestnicy).");
  lines.push("- `round_robin` (każdy z każdym): awans przez `advancingCount`; `legs: 2` = mecz i rewanż.");
  lines.push("- `group_stage` wymaga `groupCount` (1 … floor(n/2)) i `qualifiersPerGroup` (≤ największa grupa); grupy są wyrównywane automatycznie; nie może być ostatnim etapem.");
  lines.push("- `single_elimination` jako etap pośredni: `advancingCount` musi być granicą pełnej rundy (potęga dwójki < rozmiar drabinki).");
  lines.push("- `double_elimination` musi być ostatnim etapem; w planie wieloetapowym wymaga potęgi dwójki 4–64 uczestników.");
  lines.push("- `round_robin` i `group_stage` mogą mieć `leagueRules`: `{ \"allowDraws\": true, \"points\": { \"win\": 3, \"draw\": 1, \"loss\": 0 }, \"tieBreakers\": [\"head_to_head\", \"score_difference\", \"scored\", \"wins\"] }`. Bez `leagueRules` tabela liczy zwycięstwa, a remisów nie ma.");
  lines.push("- Ostatni etap nie ma `advancingCount`. Poza ligą i grupami z remisami każdy mecz ma zwycięzcę.", "");
  lines.push("## Terminarz (`schedule`)", "");
  lines.push("Opcjonalne pole na najwyższym poziomie pliku. Dotyczy pierwszego etapu ligowego lub grupowego: kolejka 1 odbywa się `startDate`, każda następna `intervalDays` dni później, o godzinie `defaultTime` czasu lokalnego w strefie `timeZone` (domyślnie Europe/Warsaw). Godzina, która przez zmianę czasu nie istnieje albo występuje dwa razy, zostanie odrzucona. Daty pojawią się po starcie etapu, a organizator może je zmieniać i przekładać mecze.", "");
  lines.push("## Jeszcze nieobsługiwane (nie używaj)", "");
  for (const item of spec.planned) lines.push(`- ${item.label}: ${item.reason}`);
  for (const item of spec.unsupported) lines.push(`- ${item}`);
  lines.push("");
  lines.push("## JSON Schema", "", "```json", JSON.stringify(spec.schema, null, 2), "```", "");
  lines.push("## Przykłady", "");
  for (const example of spec.examples) {
    lines.push(`### ${example.title}`, "", `Prośba: „${example.request}”`, "", "```json", JSON.stringify(example.config, null, 2), "```", "");
  }
  return lines.join("\n");
}
