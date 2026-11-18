import { describeMatchRules, type MatchRules } from "@workspace/match-rules";
/**
 * V5 · Stage A — parameterised tournament presets.
 *
 * One declarative catalog drives the beginner wizard, the advanced editor hand-off
 * and (later) the AI specification. A preset never invents engine behaviour: every
 * preview is built into a V1 stage plan and checked by the authoritative
 * `validateTournamentStagePlan` (plus the DE routing compiler where relevant).
 * Pure and deterministic — nothing here touches the database.
 */
import { compileV1StagePlanToRoutingV2, doubleEliminationFormatEngineV2 } from "./v2";
import { describeLeagueRules, parseLeagueRules, withSetTieWording, type LeagueRules } from "./league-rules";
import type { SchedulePlan } from "./league-schedule";
import { calculateBalancedGroupSizes, calculateGroupAdvancingCount } from "./group-stage";
import { nextPowerOfTwo } from "./stage-placement";
import {
  STAGE_BEST_OF_VALUES,
  validateTournamentStagePlan,
  type StageBestOf,
  type TournamentStagePlan,
  type TournamentStagesPlan,
} from "./tournament-stage-plan";

export const PRESET_CATALOG_VERSION = 1 as const;

export const PRESET_IDS = [
  "single_elimination",
  "double_elimination",
  "swiss",
  "round_robin",
  "groups_playoff",
  "swiss_playoff",
  "league_playoff",
] as const;
export type PresetId = (typeof PRESET_IDS)[number];

/** Shown in the catalog so users see what is coming, but never selectable. */
export const PLANNED_PRESETS = [
  {
    id: "league_divisions",
    label: "Liga z dywizjami, awansami i spadkami",
    reason: "Kilka dywizji w jednym sezonie oraz awanse i spadki między nimi nie są jeszcze obsługiwane. Terminarz z datami kolejek działa już w każdej lidze.",
  },
] as const;

export type PresetParamKey =
  | "participantCount"
  | "bestOf"
  | "playoffBestOf"
  | "swissRounds"
  | "groupCount"
  | "qualifiersPerGroup"
  | "advancingCount"
  | "legs"
  | "allowDraws"
  | "pointsWin"
  | "pointsDraw"
  | "pointsLoss"
  /** V5.4: how the first stage orders entrants (0 registration order, 1 random draw, 2 manual seeds). */
  | "entrySeeding"
  /** V5.4: how seeds are spread into groups (0 snake by seed, 1 random). */
  | "groupPlacement"
  /** V5.4: how group qualifiers are seeded into the play-off (0 by group place, 1 by overall ranking). */
  | "qualifierSeeding"
  /** V5.7: 0 = no sets (series or one game as before); 1–4 = sets needed to win a match. */
  | "setsToWin"
  /** V5.7: points needed to win a set. */
  | "setPoints"
  /** V5.7: lead needed to win a set (1 or 2). */
  | "setWinBy";

/** V5.4: labels for enumerated params (index = value). */
export const PRESET_PARAM_OPTION_LABELS: Partial<Record<PresetParamKey, string[]>> = {
  entrySeeding: ["Kolejność zgłoszeń", "Losowanie", "Ręczne rozstawienie"],
  groupPlacement: ["Wężykiem według rozstawienia", "Losowo"],
  qualifierSeeding: ["Najpierw zwycięzcy grup, potem drugie miejsca", "Według łącznego rankingu"],
  setsToWin: ["Bez setów", "Jeden set", "Do 2 wygranych setów", "Do 3 wygranych setów", "Do 4 wygranych setów"],
  setWinBy: ["", "Bez przewagi", "Przewaga 2 punktów"],
};

export type PresetParams = Partial<Record<PresetParamKey, number>>;

export type PresetFamily = "elimination" | "points" | "multi_stage";

export interface PresetParamLimit {
  key: PresetParamKey;
  label: string;
  help: string;
  /** Allowed values for the current participant count, ascending. */
  options: number[];
  value: number;
  /** V5.4: human labels for enumerated params, aligned with `options`. */
  optionLabels?: string[];
}

export interface PresetStageSummary {
  position: number;
  key: string;
  name: string;
  format: TournamentStagePlan["format"];
  formatLabel: string;
  participantCount: number;
  bestOf: StageBestOf;
  groupSizes: number[] | null;
  advancingCount: number | null;
  advancementText: string;
  matches: { min: number; max: number };
  rounds: { min: number; max: number };
  byes: number;
}

export interface PresetPreview {
  version: typeof PRESET_CATALOG_VERSION;
  presetId: PresetId;
  label: string;
  family: PresetFamily;
  params: Required<Pick<PresetParams, "participantCount" | "bestOf">> & PresetParams;
  paramLimits: PresetParamLimit[];
  /** "up_to": start with 2..count; "exact": start needs exactly count (fixed multi-stage plan). */
  participants: { mode: "up_to" | "exact"; count: number; minimum: number };
  /** Spread into POST /tournaments together with name and passwords. */
  creation: {
    format: "single_elimination" | "double_elimination" | "swiss" | "round_robin";
    maxPlayers: number;
    defaultBestOf: StageBestOf;
    swissRounds?: number;
    stagePlan?: TournamentStagesPlan;
    /** V5.3: league rules for a single flexible league (no stage plan). */
    leagueRules?: LeagueRules;
    /** V5.7: match rules for a single flexible stage (no stage plan). */
    matchRules?: MatchRules;
    /** V5.3: schedule for a single flexible league (no stage plan). */
    scheduleTimeZone?: string;
    schedulePlan?: SchedulePlan;
  };
  /** V5.3: league rules of the table stage (null for formats without a league table). */
  leagueRules: LeagueRules | null;
  /** V5.7: what decides a match in every stage (null = series / one game as before). */
  matchRules: MatchRules | null;
  /** V5.7: plain description of how a match is decided. */
  matchRulesSummary: string;
  /** V5.3: planned dates of the first league/group stage (null without a schedule). */
  schedule: PresetSchedulePreview | null;
  stagePlan: TournamentStagesPlan;
  stages: PresetStageSummary[];
  totals: {
    matches: { min: number; max: number };
    rounds: { min: number; max: number };
    matchesPerParticipant: { min: number; max: number };
  };
  winnerRule: string;
  tieRules: string[];
  requirements: string[];
  warnings: string[];
}

export interface PresetSchedulePreview {
  stageName: string;
  timeZone: string;
  startDate: string;
  intervalDays: number;
  defaultTime: string;
  rounds: number;
  firstDate: string;
  lastDate: string;
}

export class PresetError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly param?: PresetParamKey,
  ) {
    super(message);
    this.name = "PresetError";
  }
}

const FORMAT_LABELS: Record<TournamentStagePlan["format"], string> = {
  single_elimination: "Drabinka pucharowa",
  double_elimination: "Podwójna eliminacja",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  group_stage: "Faza grupowa",
};

const TIE_TEXT = {
  noDraws: "Remisów nie ma: każdy mecz musi mieć zwycięzcę.",
  roundRobin:
    "Przy równej liczbie wygranych decyduje: bezpośredni mecz (gdy remisują dwie osoby), bilans gier, liczba wygranych gier, rozstawienie.",
  swiss:
    "Przy równej liczbie wygranych decyduje: Buchholz (siła rywali), bilans gier, liczba wygranych gier, rozstawienie.",
  group:
    "W grupie przy równej liczbie wygranych decyduje: bezpośredni mecz (gdy remisują dwie osoby), bilans gier, liczba wygranych gier, rozstawienie.",
};

export interface PresetDefinition {
  id: PresetId;
  label: string;
  family: PresetFamily;
  short: string;
  description: string;
  /** Inclusive participant range for which the preset is offered. */
  participantRange: [number, number];
}

export const PRESET_DEFINITIONS: Record<PresetId, PresetDefinition> = {
  single_elimination: {
    id: "single_elimination", label: "Drabinka pucharowa", family: "elimination",
    short: "Przegrany odpada. Najszybszy sposób na zwycięzcę.",
    description: "Każdy mecz eliminuje przegranego. Gdy liczba uczestników nie jest potęgą dwójki, część osób dostaje wolny los w pierwszej rundzie.",
    participantRange: [2, 128],
  },
  double_elimination: {
    id: "double_elimination", label: "Podwójna eliminacja", family: "elimination",
    short: "Odpadasz dopiero po drugiej porażce.",
    description: "Po pierwszej porażce uczestnik trafia do drabinki przegranych i nadal walczy o tytuł. Finał może wymagać meczu rewanżowego.",
    participantRange: [4, 64],
  },
  swiss: {
    id: "swiss", label: "System szwajcarski", family: "points",
    short: "Kilka rund, rywale o podobnym wyniku.",
    description: "W każdej rundzie grają ze sobą osoby z podobnym bilansem. Nikt nie odpada, a liczba rund jest stała.",
    participantRange: [3, 128],
  },
  round_robin: {
    id: "round_robin", label: "Każdy z każdym", family: "points",
    short: "Każdy gra z każdym jeden raz. Tabela wyłania zwycięzcę.",
    description: "Najsprawiedliwszy format dla małych grup. Liczba meczów szybko rośnie wraz z liczbą uczestników.",
    participantRange: [2, 32],
  },
  groups_playoff: {
    id: "groups_playoff", label: "Grupy i play-off", family: "multi_stage",
    short: "Mecze w grupach, najlepsi grają w drabince.",
    description: "Uczestnicy grają każdy z każdym w swoich grupach. Najlepsi z każdej grupy przechodzą do drabinki pucharowej.",
    participantRange: [6, 128],
  },
  swiss_playoff: {
    id: "swiss_playoff", label: "Szwajcarski i play-off", family: "multi_stage",
    short: "Rundy szwajcarskie, potem drabinka najlepszych.",
    description: "Kilka rund systemu szwajcarskiego wyłania czołówkę, która rozgrywa drabinkę pucharową.",
    participantRange: [8, 128],
  },
  league_playoff: {
    id: "league_playoff", label: "Tabela i play-off", family: "multi_stage",
    short: "Każdy z każdym, potem drabinka czołówki.",
    description: "Faza tabeli (każdy z każdym, jeden mecz każdej pary), po której czołówka rozgrywa drabinkę pucharową.",
    participantRange: [4, 32],
  },
};

/** Polish plural for match counts: 1 mecz, 2–4 mecze, 5+ meczów (12–14 meczów). */
function matchCount(n: number): string {
  const units = n % 10, tens = n % 100;
  if (n === 1) return "1 mecz";
  return units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? `${n} mecze` : `${n} meczów`;
}

export const PRESET_PARAM_TEXT: Record<PresetParamKey, { label: string; help: string }> = {
  participantCount: { label: "Liczba uczestników", help: "Ilu graczy lub drużyn weźmie udział." },
  bestOf: { label: "Długość meczu", help: "Ile gier składa się na jeden mecz. „Do 2 wygranych” = kto pierwszy wygra 2 gry (seria BO3)." },
  playoffBestOf: { label: "Długość meczu w play-off", help: "Możesz wydłużyć mecze w decydującej fazie." },
  swissRounds: { label: "Liczba rund", help: "Każdy uczestnik rozegra tyle meczów (nieparzysta liczba osób oznacza wolny los)." },
  groupCount: { label: "Liczba grup", help: "Uczestnicy zostaną rozdzieleni możliwie równo." },
  qualifiersPerGroup: { label: "Awans z każdej grupy", help: "Tylu najlepszych z każdej grupy zagra w play-off." },
  advancingCount: { label: "Awans do play-off", help: "Tylu najlepszych z tabeli zagra w drabince." },
  legs: { label: "Mecz i rewanż", help: "Każda para gra dwa razy — raz jako gospodarz, raz jako gość. Tabela jest pewniejsza, meczów jest dwa razy więcej." },
  allowDraws: { label: "Remisy", help: "1 = mecz może zakończyć się remisem (wynik to np. gole lub punkty jednej gry). 0 = każdy mecz ma zwycięzcę. Remisy wymagają meczu na jedną grę." },
  pointsWin: { label: "Punkty za zwycięstwo", help: "Klasycznie 3." },
  pointsDraw: { label: "Punkty za remis", help: "Klasycznie 1. Nie mniej niż za porażkę i nie więcej niż za zwycięstwo." },
  pointsLoss: { label: "Punkty za porażkę", help: "Klasycznie 0." },
  entrySeeding: { label: "Kolejność na starcie", help: "Kolejność zgłoszeń, losowanie przed startem albo numery rozstawienia nadane ręcznie." },
  groupPlacement: { label: "Podział do grup", help: "Wężykiem: najwyżej rozstawieni trafiają do różnych grup. Losowo: grupy z losowania." },
  qualifierSeeding: { label: "Rozstawienie w play-off", help: "Zwycięzcy grup przed drugimi miejscami albo jeden ranking wszystkich awansujących." },
  setsToWin: { label: "Mecz na sety", help: "Ile setów trzeba wygrać, aby wygrać mecz. Długość meczu wynika wtedy z setów; „Bez setów” wraca do zwykłego meczu (jedna gra albo seria gier)." },
  setPoints: { label: "Set do … punktów", help: "Ile punktów trzeba zdobyć, aby wygrać set." },
  setWinBy: { label: "Przewaga w secie", help: "2 = przy remisie blisko końca seta gra się dalej, aż ktoś zdobędzie 2 punkty przewagi." },
};

/** Parameters a user (or an imported AI file) may set per preset; participantCount comes from the answers. */
export const PRESET_TUNABLE_PARAMS: Record<PresetId, PresetParamKey[]> = {
  single_elimination: ["bestOf", "entrySeeding", "setsToWin", "setPoints", "setWinBy"],
  double_elimination: ["bestOf", "entrySeeding", "setsToWin", "setPoints", "setWinBy"],
  swiss: ["bestOf", "swissRounds", "entrySeeding", "setsToWin", "setPoints", "setWinBy"],
  round_robin: ["bestOf", "legs", "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding", "setsToWin", "setPoints", "setWinBy"],
  groups_playoff: ["bestOf", "playoffBestOf", "groupCount", "qualifiersPerGroup", "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding", "groupPlacement", "qualifierSeeding", "setsToWin", "setPoints", "setWinBy"],
  swiss_playoff: ["bestOf", "playoffBestOf", "swissRounds", "advancingCount", "entrySeeding", "setsToWin", "setPoints", "setWinBy"],
  league_playoff: ["bestOf", "playoffBestOf", "advancingCount", "legs", "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding", "setsToWin", "setPoints", "setWinBy"],
};

/** V5.7: points-per-set choices offered by presets (the API accepts 3–99 through stage rules). */
const SET_POINT_OPTIONS = [11, 15, 21, 25];

const range = (from: number, to: number): number[] =>
  to < from ? [] : Array.from({ length: to - from + 1 }, (_, index) => from + index);
const powersOfTwoBetween = (from: number, to: number): number[] => {
  const values: number[] = [];
  for (let value = 2; value <= to; value *= 2) if (value >= from) values.push(value);
  return values;
};
const ceilLog2 = (n: number): number => Math.ceil(Math.log2(Math.max(2, n)));
const rrRounds = (n: number): number => (n % 2 === 0 ? n - 1 : n);
const rrMatches = (n: number): number => (n * (n - 1)) / 2;
const isPowerOfTwo = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

function isBestOf(value: unknown): value is StageBestOf {
  return STAGE_BEST_OF_VALUES.includes(value as StageBestOf);
}

export function recommendedSwissRounds(n: number, accurate = false): number {
  return Math.max(1, Math.min(n - 1, 15, ceilLog2(n) + (accurate ? 1 : 0)));
}

/** Groups of roughly four, never fewer than two groups or smaller than three people. */
export function recommendedGroupCount(n: number): number {
  return Math.max(2, Math.min(Math.floor(n / 3), Math.round(n / 4)));
}

function groupCountOptions(n: number): number[] {
  return range(2, Math.floor(n / 3));
}
/** Play-off sizes: powers of two that still eliminate at least one participant. */
function playoffOptions(n: number): number[] {
  return powersOfTwoBetween(2, n - 1);
}

function pick(value: number | undefined, options: number[], fallback: number, key: PresetParamKey): number {
  const chosen = value ?? fallback;
  if (!options.includes(chosen)) {
    throw new PresetError(
      "PRESET_PARAM_OUT_OF_RANGE",
      `${PRESET_PARAM_TEXT[key].label}: dozwolone wartości to ${describeOptions(options)}.`,
      key,
    );
  }
  return chosen;
}

function describeOptions(options: number[]): string {
  if (options.length === 0) return "brak (zmień liczbę uczestników)";
  const contiguous = options.every((value, index) => index === 0 || value === options[index - 1] + 1);
  return contiguous && options.length > 3 ? `${options[0]}–${options.at(-1)}` : options.join(", ");
}

function limit(key: PresetParamKey, options: number[], value: number): PresetParamLimit {
  const labels = PRESET_PARAM_OPTION_LABELS[key];
  return { key, ...PRESET_PARAM_TEXT[key], options, value, ...(labels ? { optionLabels: options.map((option) => labels[option] ?? String(option)) } : {}) };
}

/** V5.4: placeholder draw key in previews; the creating client replaces it with a fresh random key. */
export const PRESET_PREVIEW_RANDOM_SEED = "preset-draw";
const ENTRY_SEEDING_METHODS = ["registration_order", "random", "manual"] as const;

const BEST_OF_OPTIONS = [...STAGE_BEST_OF_VALUES];

function baseStage(key: string, position: number, name: string, participantCount: number, bestOf: StageBestOf) {
  return {
    key, position, name, participantCount, bestOf,
    entrySeedingMethod: (position === 1 ? "registration_order" : "preserve") as "registration_order" | "preserve",
    randomRevealOrder: "instant" as const,
  };
}

function seSummary(position: number, key: string, name: string, n: number, bestOf: StageBestOf): PresetStageSummary {
  const size = nextPowerOfTwo(n);
  const rounds = Math.log2(size);
  return {
    position, key, name, format: "single_elimination", formatLabel: FORMAT_LABELS.single_elimination,
    participantCount: n, bestOf, groupSizes: null, advancingCount: null,
    advancementText: "Zwycięzca finału wygrywa turniej.",
    matches: { min: n - 1, max: n - 1 }, rounds: { min: rounds, max: rounds }, byes: size - n,
  };
}

const POINT_OPTIONS = range(0, 10);

/**
 * V5.3: league rules from preset params. Defaults: 3/1/0, draws off (draws need a single-game match).
 * Every league-table preset gets explicit rules, so new leagues rank by points with documented tie-breakers.
 */
function leagueRulesFromParams(input: PresetParams, bestOf: StageBestOf, limits: PresetParamLimit[]): LeagueRules {
  const allowDraws = pick(input.allowDraws, [0, 1], 0, "allowDraws");
  limits.push(limit("allowDraws", [0, 1], allowDraws));
  if (allowDraws === 1 && bestOf !== 1) {
    throw new PresetError(
      "PRESET_PARAM_OUT_OF_RANGE",
      "Remisy są możliwe tylko przy meczu na jedną grę — ustaw długość meczu na 1 albo wyłącz remisy.",
      "allowDraws",
    );
  }
  const win = pick(input.pointsWin, POINT_OPTIONS, 3, "pointsWin");
  const draw = pick(input.pointsDraw, POINT_OPTIONS, 1, "pointsDraw");
  const loss = pick(input.pointsLoss, POINT_OPTIONS, 0, "pointsLoss");
  limits.push(limit("pointsWin", POINT_OPTIONS, win), limit("pointsDraw", POINT_OPTIONS, draw), limit("pointsLoss", POINT_OPTIONS, loss));
  const parsed = parseLeagueRules({ allowDraws: allowDraws === 1, points: { win, draw, loss } });
  if (!parsed.ok || !parsed.value) {
    throw new PresetError(
      "PRESET_PARAM_OUT_OF_RANGE",
      parsed.ok ? "Nieprawidłowa punktacja." : parsed.problems.map((problem) => problem.message).join(" "),
      "pointsDraw",
    );
  }
  return parsed.value;
}

interface Built {
  leagueRules?: LeagueRules;
  /** V5.7: set rules applied to every stage (null = series / one game as before). */
  matchRules?: MatchRules | null;
  params: PresetParams & { participantCount: number; bestOf: StageBestOf };
  paramLimits: PresetParamLimit[];
  stages: TournamentStagePlan[];
  summaries: PresetStageSummary[];
  singleStage: boolean;
  /** A single stage that still needs a fixed stage plan (e.g. home and away). */
  requiresStagePlan?: boolean;
  perParticipant: { min: number; max: number };
  winnerRule: string;
  tieRules: string[];
  requirements: string[];
  warnings: string[];
}

function normaliseCount(presetId: PresetId, raw: unknown): number {
  const [min, max] = PRESET_DEFINITIONS[presetId].participantRange;
  if (!Number.isInteger(raw) || (raw as number) < min || (raw as number) > max) {
    throw new PresetError(
      "PRESET_PARTICIPANT_COUNT_OUT_OF_RANGE",
      `${PRESET_DEFINITIONS[presetId].label}: liczba uczestników musi wynosić od ${min} do ${max}.`,
      "participantCount",
    );
  }
  return raw as number;
}

/**
 * V5.4: seeding rules on top of the structure. They change only who meets whom, never the
 * number of matches or qualifiers, so they are applied after the structure is built.
 */
function build(presetId: PresetId, rawInput: PresetParams, accurate: boolean): Built {
  // V5.7: match rules — sets decide every match of the tournament; the match length follows from them.
  const setsToWin = pick(rawInput.setsToWin, [0, 1, 2, 3, 4], 0, "setsToWin");
  const setPoints = pick(rawInput.setPoints, SET_POINT_OPTIONS, 11, "setPoints");
  const setWinBy = pick(rawInput.setWinBy, [1, 2], 2, "setWinBy");
  let input = rawInput;
  let matchRules: MatchRules | null = null;
  if (setsToWin > 0) {
    const derived = (2 * setsToWin - 1) as StageBestOf;
    for (const key of ["bestOf", "playoffBestOf"] as const) {
      if (rawInput[key] != null && rawInput[key] !== derived) {
        throw new PresetError("PRESET_PARAM_CONFLICT", `${PRESET_PARAM_TEXT[key].label} wynika z zasad setów: do ${setsToWin} wygranych setów to najwyżej ${derived} ${derived === 1 ? "set" : derived <= 4 ? "sety" : "setów"}. Usuń to ustawienie albo wybierz mecz bez setów.`, key);
      }
    }
    if (rawInput.allowDraws === 1) {
      throw new PresetError("PRESET_PARAM_CONFLICT", "Mecz rozstrzygany setami zawsze ma zwycięzcę — wyłącz remisy albo wybierz mecz bez setów.", "allowDraws");
    }
    input = { ...rawInput, bestOf: derived, ...(PRESET_TUNABLE_PARAMS[presetId].includes("playoffBestOf") ? { playoffBestOf: derived } : {}) };
    matchRules = { version: 1, kind: "sets", setsToWin, pointsPerSet: setPoints, winBy: setWinBy };
  }
  const built = buildStructure(presetId, input, accurate);
  built.paramLimits.push(limit("setsToWin", [0, 1, 2, 3, 4], setsToWin), limit("setPoints", SET_POINT_OPTIONS, setPoints), limit("setWinBy", [1, 2], setWinBy));
  if (matchRules) {
    // Listed only when sets are chosen, so every existing preview keeps exactly its shape.
    built.params.setsToWin = setsToWin;
    built.params.setPoints = setPoints;
    built.params.setWinBy = setWinBy;
    built.matchRules = matchRules;
    built.stages = built.stages.map((stage) => ({ ...stage, matchRules: matchRules! }));
    built.tieRules = built.tieRules.map(withSetTieWording);
  }
  const entry = pick(input.entrySeeding, [0, 1, 2], 0, "entrySeeding");
  built.paramLimits.push(limit("entrySeeding", [0, 1, 2], entry));
  built.params.entrySeeding = entry;
  const usesRandom = (stage: TournamentStagePlan): boolean =>
    stage.entrySeedingMethod === "random" || ("placementMethod" in stage && stage.placementMethod === "random");
  built.stages = built.stages.map((stage) => (stage.position === 1 ? { ...stage, entrySeedingMethod: ENTRY_SEEDING_METHODS[entry] } : stage));
  if (presetId === "groups_playoff") {
    const placement = pick(input.groupPlacement, [0, 1], 0, "groupPlacement");
    const qualifiers = pick(input.qualifierSeeding, [0, 1], 0, "qualifierSeeding");
    built.paramLimits.push(limit("groupPlacement", [0, 1], placement), limit("qualifierSeeding", [0, 1], qualifiers));
    built.params.groupPlacement = placement;
    built.params.qualifierSeeding = qualifiers;
    built.stages = built.stages.map((stage) => stage.format === "group_stage"
      ? { ...stage, placementMethod: placement === 1 ? "random" : "snake", resultSeedingMethod: qualifiers === 1 ? "global_ranking" : "rank_bands" }
      : stage);
    const groups = built.summaries[0];
    groups.advancementText = groups.advancementText.replace(
      "Rozstawienie w drabince: zwycięzcy grup przed drugimi miejscami.",
      qualifiers === 1 ? "Rozstawienie w drabince: według łącznego rankingu awansujących." : "Rozstawienie w drabince: zwycięzcy grup przed drugimi miejscami.",
    );
    if (placement === 1) built.requirements.push("Przed startem przeprowadzisz losowanie grup (zakładka Etapy → „Przejdź do losowania”).");
  }
  built.stages = built.stages.map((stage) => (usesRandom(stage) ? { ...stage, randomSeed: PRESET_PREVIEW_RANDOM_SEED, randomRevealOrder: "sequential" as const } : stage));
  // A flexible single stage has no plan to carry the seeding rule, so any non-default rule needs a fixed plan.
  if (entry !== 0 && built.singleStage && !built.requiresStagePlan) {
    built.requiresStagePlan = true;
    built.requirements.push(`Losowanie lub ręczne rozstawienie używa stałego planu: przed startem lista musi liczyć dokładnie ${built.params.participantCount} uczestników.`);
  }
  if (entry === 1) built.requirements.push("Przed startem przeprowadzisz losowanie kolejności (zakładka Etapy → „Przejdź do losowania”).");
  if (entry === 2) built.requirements.push("Przed startem nadaj uczestnikom numery rozstawienia.");
  return built;
}

function buildStructure(presetId: PresetId, input: PresetParams, accurate: boolean): Built {
  const n = normaliseCount(presetId, input.participantCount);
  const bestOfRaw = input.bestOf ?? 1;
  if (!isBestOf(bestOfRaw)) {
    throw new PresetError("PRESET_PARAM_OUT_OF_RANGE", "Długość meczu: dozwolone BO1, BO3, BO5 lub BO7.", "bestOf");
  }
  const bestOf = bestOfRaw;
  const limits: PresetParamLimit[] = [
    limit("participantCount", range(...PRESET_DEFINITIONS[presetId].participantRange), n),
    limit("bestOf", BEST_OF_OPTIONS, bestOf),
  ];
  const warnings: string[] = [];
  const requirements: string[] = [];
  const playoffBestOf = (): StageBestOf => {
    const value = input.playoffBestOf ?? bestOf;
    if (!isBestOf(value)) {
      throw new PresetError("PRESET_PARAM_OUT_OF_RANGE", "Długość meczu w play-off: dozwolone BO1, BO3, BO5 lub BO7.", "playoffBestOf");
    }
    limits.push(limit("playoffBestOf", BEST_OF_OPTIONS, value));
    return value;
  };

  switch (presetId) {
    case "single_elimination": {
      const summary = seSummary(1, "playoff", "Drabinka pucharowa", n, bestOf);
      if (summary.byes > 0) warnings.push(`${summary.byes} ${summary.byes === 1 ? "osoba dostanie" : "osób dostanie"} wolny los w 1. rundzie (gdy zgłosi się ${n} uczestników).`);
      return {
        params: { participantCount: n, bestOf }, paramLimits: limits,
        stages: [{ ...baseStage("playoff", 1, "Drabinka pucharowa", n, bestOf), format: "single_elimination", placementMethod: "standard" }],
        summaries: [summary], singleStage: true,
        perParticipant: { min: 1, max: summary.rounds.max },
        winnerRule: "Mistrzem zostaje zwycięzca finału.",
        tieRules: [TIE_TEXT.noDraws], requirements, warnings,
      };
    }
    case "double_elimination": {
      const size = nextPowerOfTwo(n);
      const k = Math.log2(size);
      const summary: PresetStageSummary = {
        position: 1, key: "double", name: "Podwójna eliminacja", format: "double_elimination",
        formatLabel: FORMAT_LABELS.double_elimination, participantCount: n, bestOf,
        groupSizes: null, advancingCount: null,
        advancementText: "Zwycięzca wielkiego finału wygrywa turniej.",
        matches: { min: 2 * n - 2, max: 2 * n - 1 },
        rounds: { min: 2 * k, max: 2 * k + 1 }, byes: size - n,
      };
      warnings.push("Wielki finał może wymagać dodatkowego meczu, jeśli wygra go uczestnik z drabinki przegranych.");
      if (!isPowerOfTwo(n)) warnings.push(`Przy ${n} uczestnikach część osób dostanie wolny los w 1. rundzie.`);
      return {
        params: { participantCount: n, bestOf }, paramLimits: limits,
        stages: [{ ...baseStage("double", 1, "Podwójna eliminacja", n, bestOf), format: "double_elimination", placementMethod: "standard" }],
        summaries: [summary], singleStage: true,
        perParticipant: { min: 2, max: 2 * k + 1 },
        winnerRule: "Mistrzem zostaje zwycięzca wielkiego finału.",
        tieRules: [TIE_TEXT.noDraws], requirements, warnings,
      };
    }
    case "swiss": {
      const rounds = pick(input.swissRounds, range(1, Math.min(n - 1, 15)), recommendedSwissRounds(n, accurate), "swissRounds");
      limits.push(limit("swissRounds", range(1, Math.min(n - 1, 15)), rounds));
      const matches = Math.floor(n / 2) * rounds;
      if (n % 2 === 1) warnings.push("Przy nieparzystej liczbie uczestników w każdej rundzie jedna osoba pauzuje (wolny los).");
      if (rounds < ceilLog2(n)) warnings.push(`Przy ${rounds} ${rounds === 1 ? "rundzie" : "rundach"} kilka osób może skończyć z kompletem zwycięstw — o kolejności zdecydują dodatkowe kryteria.`);
      return {
        params: { participantCount: n, bestOf, swissRounds: rounds }, paramLimits: limits,
        stages: [{ ...baseStage("swiss", 1, "System szwajcarski", n, bestOf), format: "swiss", rounds }],
        summaries: [{
          position: 1, key: "swiss", name: "System szwajcarski", format: "swiss", formatLabel: FORMAT_LABELS.swiss,
          participantCount: n, bestOf, groupSizes: null, advancingCount: null,
          advancementText: "Zwycięzcą jest lider tabeli po ostatniej rundzie.",
          matches: { min: matches, max: matches }, rounds: { min: rounds, max: rounds }, byes: n % 2 === 1 ? rounds : 0,
        }],
        singleStage: true,
        perParticipant: { min: n % 2 === 1 ? rounds - 1 : rounds, max: rounds },
        winnerRule: "Wygrywa lider tabeli po ostatniej rundzie.",
        tieRules: [TIE_TEXT.noDraws, TIE_TEXT.swiss], requirements, warnings,
      };
    }
    case "round_robin": {
      const legs = pick(input.legs, [1, 2], 1, "legs") as 1 | 2;
      limits.push(limit("legs", [1, 2], legs));
      const matches = rrMatches(n) * legs;
      const name = legs === 2 ? "Każdy z każdym — mecz i rewanż" : "Każdy z każdym";
      if (matches > 120) warnings.push(`To aż ${matches} meczów — rozważ grupy i play-off.`);
      if (n % 2 === 1) warnings.push("Przy nieparzystej liczbie uczestników w każdej kolejce jedna osoba pauzuje.");
      if (legs === 2) {
        warnings.push("Rewanże zaczynają się po pełnej pierwszej rundzie; w rewanżu gospodarz i gość zamieniają się miejscami.");
        requirements.push(`Mecz i rewanż używa stałego planu: przed startem lista musi liczyć dokładnie ${n} uczestników.`);
      }
      const rules = leagueRulesFromParams(input, bestOf, limits);
      return {
        leagueRules: rules,
        params: { participantCount: n, bestOf, legs, allowDraws: rules.allowDraws ? 1 : 0, pointsWin: rules.points.win, pointsDraw: rules.points.draw, pointsLoss: rules.points.loss }, paramLimits: limits,
        stages: [{ ...baseStage("league", 1, name, n, bestOf), format: "round_robin", ...(legs === 2 ? { legs: 2 as const } : {}), leagueRules: rules }],
        summaries: [{
          position: 1, key: "league", name, format: "round_robin", formatLabel: legs === 2 ? "Każdy z każdym ×2" : FORMAT_LABELS.round_robin,
          participantCount: n, bestOf, groupSizes: null, advancingCount: null,
          advancementText: "Zwycięzcą jest lider tabeli.",
          matches: { min: matches, max: matches }, rounds: { min: rrRounds(n) * legs, max: rrRounds(n) * legs }, byes: 0,
        }],
        singleStage: true,
        requiresStagePlan: legs === 2,
        perParticipant: { min: (n - 1) * legs, max: (n - 1) * legs },
        winnerRule: "Wygrywa lider tabeli po wszystkich meczach.",
        tieRules: [describeLeagueRules(rules)], requirements, warnings,
      };
    }
    case "groups_playoff": {
      const groupCount = pick(input.groupCount, groupCountOptions(n), recommendedGroupCount(n), "groupCount");
      limits.push(limit("groupCount", groupCountOptions(n), groupCount));
      const sizes = calculateBalancedGroupSizes(n, groupCount);
      const smallest = Math.min(...sizes);
      const qualifierOptions = range(1, smallest - 1).filter((q) => calculateGroupAdvancingCount(n, groupCount, q) >= 2);
      const qualifiersPerGroup = pick(input.qualifiersPerGroup, qualifierOptions, Math.min(2, smallest - 1), "qualifiersPerGroup");
      limits.push(limit("qualifiersPerGroup", qualifierOptions, qualifiersPerGroup));
      const advancing = calculateGroupAdvancingCount(n, groupCount, qualifiersPerGroup);
      const poBestOf = playoffBestOf();
      const groupMatches = sizes.reduce((sum, size) => sum + rrMatches(size), 0);
      const groupRounds = Math.max(...sizes.map(rrRounds));
      const playoff = seSummary(2, "playoff", "Play-off", advancing, poBestOf);
      if (playoff.byes > 0) warnings.push(`Do play-off awansuje ${advancing} osób, więc ${playoff.byes} najlepiej rozstawionych dostanie wolny los w 1. rundzie drabinki.`);
      if (new Set(sizes).size > 1) warnings.push(`Grupy nie są równe (${sizes.join(", ")} osób) — w mniejszych grupach rozegra się mniej meczów.`);
      requirements.push(`Przed startem lista musi liczyć dokładnie ${n} uczestników.`);
      const groupRules = leagueRulesFromParams(input, bestOf, limits);
      return {
        leagueRules: groupRules,
        params: { participantCount: n, bestOf, playoffBestOf: poBestOf, groupCount, qualifiersPerGroup, allowDraws: groupRules.allowDraws ? 1 : 0, pointsWin: groupRules.points.win, pointsDraw: groupRules.points.draw, pointsLoss: groupRules.points.loss }, paramLimits: limits,
        stages: [
          { ...baseStage("groups", 1, "Faza grupowa", n, bestOf), format: "group_stage", groupCount,
            participantsPerGroup: Math.max(...sizes), qualifiersPerGroup, placementMethod: "snake", resultSeedingMethod: "rank_bands", leagueRules: groupRules },
          { ...baseStage("playoff", 2, "Play-off", advancing, poBestOf), format: "single_elimination", placementMethod: "standard" },
        ],
        summaries: [
          {
            position: 1, key: "groups", name: "Faza grupowa", format: "group_stage", formatLabel: FORMAT_LABELS.group_stage,
            participantCount: n, bestOf, groupSizes: sizes, advancingCount: advancing,
            advancementText: `Z każdej grupy ${qualifiersPerGroup === 1 ? "awansuje 1 najlepsza osoba" : `awansują ${qualifiersPerGroup} najlepsze osoby`} (razem ${advancing}). Rozstawienie w drabince: zwycięzcy grup przed drugimi miejscami.`,
            matches: { min: groupMatches, max: groupMatches }, rounds: { min: groupRounds, max: groupRounds }, byes: 0,
          },
          playoff,
        ],
        singleStage: false,
        perParticipant: { min: smallest - 1, max: Math.max(...sizes) - 1 + playoff.rounds.max },
        winnerRule: "Mistrzem zostaje zwycięzca finału play-off.",
        tieRules: [`W grupach — ${describeLeagueRules(groupRules)}`, "W play-off remisów nie ma: każdy mecz musi mieć zwycięzcę."], requirements, warnings,
      };
    }
    case "swiss_playoff": {
      const roundOptions = range(2, Math.min(n - 1, 15));
      const rounds = pick(input.swissRounds, roundOptions, recommendedSwissRounds(n, accurate), "swissRounds");
      limits.push(limit("swissRounds", roundOptions, rounds));
      const options = playoffOptions(n);
      const advancing = pick(input.advancingCount, options, Math.max(...options.filter((value) => value <= n / 2)), "advancingCount");
      limits.push(limit("advancingCount", options, advancing));
      const poBestOf = playoffBestOf();
      const matches = Math.floor(n / 2) * rounds;
      if (n % 2 === 1) warnings.push("Przy nieparzystej liczbie uczestników w każdej rundzie szwajcarskiej jedna osoba pauzuje.");
      requirements.push(`Przed startem lista musi liczyć dokładnie ${n} uczestników.`);
      const playoff = seSummary(2, "playoff", "Play-off", advancing, poBestOf);
      return {
        params: { participantCount: n, bestOf, playoffBestOf: poBestOf, swissRounds: rounds, advancingCount: advancing }, paramLimits: limits,
        stages: [
          { ...baseStage("swiss", 1, "Rundy szwajcarskie", n, bestOf), format: "swiss", rounds, advancingCount: advancing },
          { ...baseStage("playoff", 2, "Play-off", advancing, poBestOf), format: "single_elimination", placementMethod: "standard" },
        ],
        summaries: [
          {
            position: 1, key: "swiss", name: "Rundy szwajcarskie", format: "swiss", formatLabel: FORMAT_LABELS.swiss,
            participantCount: n, bestOf, groupSizes: null, advancingCount: advancing,
            advancementText: `${advancing} najlepszych z tabeli awansuje do play-off.`,
            matches: { min: matches, max: matches }, rounds: { min: rounds, max: rounds }, byes: n % 2 === 1 ? rounds : 0,
          },
          playoff,
        ],
        singleStage: false,
        perParticipant: { min: n % 2 === 1 ? rounds - 1 : rounds, max: rounds + playoff.rounds.max },
        winnerRule: "Mistrzem zostaje zwycięzca finału play-off.",
        tieRules: [TIE_TEXT.noDraws, TIE_TEXT.swiss], requirements, warnings,
      };
    }
    case "league_playoff": {
      const legs = pick(input.legs, [1, 2], 1, "legs") as 1 | 2;
      const options = playoffOptions(n);
      const advancing = pick(input.advancingCount, options, n >= 6 ? 4 : 2, "advancingCount");
      limits.push(limit("advancingCount", options, advancing));
      const poBestOf = playoffBestOf();
      limits.push(limit("legs", [1, 2], legs));
      const matches = rrMatches(n) * legs;
      if (matches > 120) warnings.push(`Faza tabeli to ${matches} meczów — rozważ grupy i play-off.`);
      requirements.push(`Przed startem lista musi liczyć dokładnie ${n} uczestników.`);
      const playoff = seSummary(2, "playoff", "Play-off", advancing, poBestOf);
      const tableRules = leagueRulesFromParams(input, bestOf, limits);
      return {
        leagueRules: tableRules,
        params: { participantCount: n, bestOf, playoffBestOf: poBestOf, advancingCount: advancing, legs, allowDraws: tableRules.allowDraws ? 1 : 0, pointsWin: tableRules.points.win, pointsDraw: tableRules.points.draw, pointsLoss: tableRules.points.loss }, paramLimits: limits,
        stages: [
          { ...baseStage("table", 1, legs === 2 ? "Faza tabeli — mecz i rewanż" : "Faza tabeli", n, bestOf), format: "round_robin", advancingCount: advancing, ...(legs === 2 ? { legs: 2 as const } : {}), leagueRules: tableRules },
          { ...baseStage("playoff", 2, "Play-off", advancing, poBestOf), format: "single_elimination", placementMethod: "standard" },
        ],
        summaries: [
          {
            position: 1, key: "table", name: legs === 2 ? "Faza tabeli — mecz i rewanż" : "Faza tabeli", format: "round_robin", formatLabel: legs === 2 ? "Każdy z każdym ×2" : FORMAT_LABELS.round_robin,
            participantCount: n, bestOf, groupSizes: null, advancingCount: advancing,
            advancementText: `${advancing} najlepszych z tabeli awansuje do play-off.`,
            matches: { min: matches, max: matches }, rounds: { min: rrRounds(n) * legs, max: rrRounds(n) * legs }, byes: 0,
          },
          playoff,
        ],
        singleStage: false,
        perParticipant: { min: (n - 1) * legs, max: (n - 1) * legs + playoff.rounds.max },
        winnerRule: "Mistrzem zostaje zwycięzca finału play-off.",
        tieRules: [`W tabeli — ${describeLeagueRules(tableRules)}`, "W play-off remisów nie ma: każdy mecz musi mieć zwycięzcę."], requirements, warnings,
      };
    }
  }
}

const ALLOWED_PARAM_KEYS = new Set<PresetParamKey>([
  "participantCount", "bestOf", "playoffBestOf", "swissRounds", "groupCount", "qualifiersPerGroup", "advancingCount", "legs",
  "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding", "groupPlacement", "qualifierSeeding",
  "setsToWin", "setPoints", "setWinBy",
]);

export interface PresetPreviewRequest {
  presetId: PresetId;
  params: PresetParams;
  /** Influences defaults only (e.g. one extra Swiss round). */
  priority?: Priority;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function parsePresetPreviewRequest(input: unknown): PresetPreviewRequest {
  const record = asRecord(input);
  if (!record) throw new PresetError("INVALID_PRESET_REQUEST", "Oczekiwano obiektu z presetId i params.");
  for (const key of Object.keys(record)) {
    if (!["presetId", "params", "priority"].includes(key)) {
      throw new PresetError("INVALID_PRESET_REQUEST", `Nieznane pole: ${key}.`);
    }
  }
  if (!PRESET_IDS.includes(record.presetId as PresetId)) {
    throw new PresetError("UNKNOWN_PRESET", "Nieznany lub niedostępny preset.");
  }
  const params = asRecord(record.params ?? {});
  if (!params) throw new PresetError("INVALID_PRESET_REQUEST", "params musi być obiektem.");
  const parsed: PresetParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_PARAM_KEYS.has(key as PresetParamKey)) {
      throw new PresetError("INVALID_PRESET_REQUEST", `Nieznany parametr: ${key}.`);
    }
    if (value === null || value === undefined) continue;
    if (!Number.isInteger(value)) {
      throw new PresetError("PRESET_PARAM_OUT_OF_RANGE", `${PRESET_PARAM_TEXT[key as PresetParamKey].label} musi być liczbą całkowitą.`, key as PresetParamKey);
    }
    parsed[key as PresetParamKey] = value as number;
  }
  if (record.priority !== undefined && !PRIORITIES.includes(record.priority as Priority)) {
    throw new PresetError("INVALID_PRESET_REQUEST", "Nieznany priorytet.");
  }
  return { presetId: record.presetId as PresetId, params: parsed, priority: record.priority as Priority | undefined };
}

/** Builds the exact plan and checks it with the authoritative engine validators. */
export function previewPreset(request: PresetPreviewRequest): PresetPreview {
  const definition = PRESET_DEFINITIONS[request.presetId];
  const built = build(request.presetId, request.params, request.priority === "accurate");
  const n = built.params.participantCount;
  const stagePlan = { initialParticipantCount: n, stages: built.stages };
  const validation = validateTournamentStagePlan(stagePlan);
  if (!validation.valid) {
    throw new PresetError(
      "PRESET_REJECTED_BY_ENGINE",
      `Silnik odrzucił tę konfigurację: ${validation.problems.map((problem) => problem.message).join("; ")}`,
    );
  }
  if (validation.value.stages.some((stage) => stage.format === "double_elimination") && !built.singleStage) {
    const compiled = compileV1StagePlanToRoutingV2(validation.value, [doubleEliminationFormatEngineV2]);
    if (!compiled.valid) throw new PresetError("PRESET_REJECTED_BY_ENGINE", "Silnik drabinki podwójnej eliminacji nie przyjął tej konfiguracji.");
  }
  const first = validation.value.stages[0];
  const flexible = built.singleStage && !built.requiresStagePlan;
  const creation: PresetPreview["creation"] = flexible
    ? {
        format: first.format as PresetPreview["creation"]["format"],
        maxPlayers: n,
        defaultBestOf: built.params.bestOf,
        ...(first.format === "swiss" ? { swissRounds: first.rounds } : {}),
        ...(built.leagueRules ? { leagueRules: built.leagueRules } : {}),
        ...(built.matchRules ? { matchRules: built.matchRules } : {}),
      }
    : {
        // Compatibility column only; the stage plan is authoritative for multi-stage tournaments.
        format: first.format === "group_stage" ? "round_robin" : first.format as PresetPreview["creation"]["format"],
        maxPlayers: n,
        defaultBestOf: built.params.bestOf,
        stagePlan: validation.value,
      };
  const sum = (pickValue: (stage: PresetStageSummary) => number) =>
    built.summaries.reduce((total, stage) => total + pickValue(stage), 0);
  return {
    version: PRESET_CATALOG_VERSION,
    presetId: request.presetId,
    label: definition.label,
    family: definition.family,
    params: built.params,
    paramLimits: built.paramLimits,
    participants: flexible
      ? { mode: "up_to", count: n, minimum: 2 }
      : { mode: "exact", count: n, minimum: n },
    creation,
    stagePlan: validation.value,
    stages: built.summaries,
    totals: {
      matches: { min: sum((stage) => stage.matches.min), max: sum((stage) => stage.matches.max) },
      rounds: { min: sum((stage) => stage.rounds.min), max: sum((stage) => stage.rounds.max) },
      matchesPerParticipant: built.perParticipant,
    },
    winnerRule: built.winnerRule,
    tieRules: built.tieRules,
    requirements: built.requirements,
    warnings: built.warnings,
    leagueRules: built.leagueRules ?? null,
    matchRules: built.matchRules ?? null,
    matchRulesSummary: describeMatchRules(built.matchRules ?? null, { bestOf: built.params.bestOf, allowDraws: !!built.leagueRules?.allowDraws }),
    schedule: null,
  };
}

// ── Recommendations ──────────────────────────────────────────────────────────

export const PRIORITIES = ["short", "more_matches", "accurate"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface WizardAnswers {
  kind: "tournament" | "league";
  participantType: "players" | "teams";
  participantCount: number;
  grouping: "yes" | "no" | "any";
  priority: Priority;
}

export interface PresetRecommendation {
  presetId: PresetId;
  label: string;
  short: string;
  description: string;
  family: PresetFamily;
  available: boolean;
  recommended: boolean;
  score: number;
  reasons: string[];
  unavailableReason: string | null;
  preview: PresetPreview | null;
}

export interface RecommendationResult {
  version: typeof PRESET_CATALOG_VERSION;
  answers: WizardAnswers;
  recommendations: PresetRecommendation[];
  planned: Array<{ id: string; label: string; reason: string }>;
  /** V5.1: plain-language notes when an answer could not be honoured as asked. */
  notes: string[];
}

export function parseWizardAnswers(input: unknown): WizardAnswers {
  const record = asRecord(input);
  if (!record) throw new PresetError("INVALID_ANSWERS", "Oczekiwano odpowiedzi kreatora.");
  for (const key of Object.keys(record)) {
    if (!["kind", "participantType", "participantCount", "grouping", "priority"].includes(key)) {
      throw new PresetError("INVALID_ANSWERS", `Nieznane pole: ${key}.`);
    }
  }
  const kind = record.kind ?? "tournament";
  const participantType = record.participantType ?? "players";
  const grouping = record.grouping ?? "any";
  const priority = record.priority ?? "accurate";
  if (kind !== "tournament" && kind !== "league") throw new PresetError("INVALID_ANSWERS", "kind: tournament lub league.");
  if (participantType !== "players" && participantType !== "teams") throw new PresetError("INVALID_ANSWERS", "participantType: players lub teams.");
  if (!["yes", "no", "any"].includes(grouping as string)) throw new PresetError("INVALID_ANSWERS", "grouping: yes, no lub any.");
  if (!PRIORITIES.includes(priority as Priority)) throw new PresetError("INVALID_ANSWERS", "priority: short, more_matches lub accurate.");
  const count = record.participantCount;
  if (!Number.isInteger(count) || (count as number) < 2 || (count as number) > 128) {
    throw new PresetError("INVALID_ANSWERS", "Liczba uczestników musi wynosić od 2 do 128.", "participantCount");
  }
  return {
    kind, participantType, grouping, priority, participantCount: count,
  } as WizardAnswers;
}

const PRIORITY_SCORES: Record<Priority, Record<PresetId, number>> = {
  short: { single_elimination: 10, double_elimination: 6, swiss: 7, round_robin: 3, groups_playoff: 4, swiss_playoff: 5, league_playoff: 2 },
  more_matches: { single_elimination: 1, double_elimination: 6, swiss: 7, round_robin: 10, groups_playoff: 8, swiss_playoff: 6, league_playoff: 8 },
  accurate: { single_elimination: 3, double_elimination: 9, swiss: 7, round_robin: 9, groups_playoff: 8, swiss_playoff: 9, league_playoff: 8 },
};

const PRIORITY_REASONS: Record<Priority, Partial<Record<PresetId, string>>> = {
  short: {
    single_elimination: "Najmniej meczów — idealne na jedno popołudnie.",
    swiss: "Z góry wiesz, ile będzie rund.",
    double_elimination: "Krótko, a jedna wpadka nie przekreśla szans.",
  },
  more_matches: {
    round_robin: "Każdy rozegra mecz z każdym rywalem.",
    groups_playoff: "Kilka meczów w grupie dla każdego, potem emocje drabinki.",
    league_playoff: "Pełna tabela i finałowa drabinka.",
    swiss: "Każdy gra w każdej rundzie, nikt nie odpada.",
  },
  accurate: {
    double_elimination: "Jedna porażka nie eliminuje — mniej przypadkowe wyniki.",
    swiss_playoff: "Rundy szwajcarskie wyłaniają czołówkę, drabinka mistrza.",
    round_robin: "Najsprawiedliwiej: każdy gra z każdym.",
    groups_playoff: "Najpierw grupy, potem drabinka najlepszych.",
    league_playoff: "Tabela i play-off: forma i wytrzymałość.",
  },
};

function recommendationNotes(answers: WizardAnswers, results: readonly PresetRecommendation[]): string[] {
  const notes: string[] = [];
  const n = answers.participantCount;
  const byId = new Map(results.map((item) => [item.presetId, item]));
  const groups = byId.get("groups_playoff");
  if (answers.grouping === "yes" && groups && !groups.available) {
    const [min] = PRESET_DEFINITIONS.groups_playoff.participantRange;
    notes.push(n < min
      ? `Podział na grupy jest możliwy od ${min} uczestników. Przy ${n} pokazujemy formaty bez grup.`
      : `Podziału na grupy nie da się ułożyć dla ${n} uczestników. Pokazujemy formaty bez grup.`);
  }
  const roundRobin = byId.get("round_robin");
  const swiss = byId.get("swiss");
  if (answers.kind === "league" && answers.priority === "short" && roundRobin?.preview && swiss?.preview) {
    const leagueMatches = roundRobin.preview.totals.matches.max;
    const swissMatches = swiss.preview.totals.matches.max;
    if (swissMatches < leagueMatches) {
      notes.push(`W lidze każdy gra z każdym (${matchCount(leagueMatches)}). Jeśli ma być krótko, wybierz „System szwajcarski”: ${matchCount(swissMatches)}, też z tabelą na koniec.`);
    }
  }
  return notes;
}

export function recommendPresets(answers: WizardAnswers): RecommendationResult {
  const n = answers.participantCount;
  const results: PresetRecommendation[] = PRESET_IDS.map((presetId) => {
    const definition = PRESET_DEFINITIONS[presetId];
    const reasons: string[] = [];
    let score = PRIORITY_SCORES[answers.priority][presetId];
    const priorityReason = PRIORITY_REASONS[answers.priority][presetId];
    if (priorityReason) reasons.push(priorityReason);
    const multi = definition.family === "multi_stage";
    const grouped = presetId === "groups_playoff";
    if (answers.grouping === "yes") {
      score += grouped ? 7 : multi ? 1 : -3;
      if (grouped) reasons.unshift("Dzieli uczestników na grupy, tak jak chcesz.");
    } else if (answers.grouping === "no" && grouped) {
      score -= 8;
    }
    if (answers.kind === "league") {
      if (presetId === "round_robin") { score += 8; reasons.unshift("Klasyczna liga: każdy z każdym i tabela."); }
      if (presetId === "league_playoff") { score += 6; reasons.unshift("Liga zakończona play-offami."); }
      if (presetId === "round_robin" || presetId === "league_playoff") reasons.push("Możesz włączyć mecz i rewanż.");
      if (definition.family === "elimination") score -= 6;
    }
    if (presetId === "round_robin" || presetId === "league_playoff") {
      if (n > 24) score -= 8; else if (n > 12) score -= 4;
    }
    if (presetId === "double_elimination" && n > 32) score -= 2;
    if (presetId === "swiss" && n < 6) score -= 3;

    const [min, max] = definition.participantRange;
    let unavailableReason: string | null = null;
    let preview: PresetPreview | null = null;
    if (n < min || n > max) {
      unavailableReason = `Dostępne dla ${min}–${max} uczestników.`;
    } else {
      try {
        preview = previewPreset({ presetId, params: { participantCount: n, bestOf: 1 }, priority: answers.priority });
      } catch (error) {
        if (!(error instanceof PresetError)) throw error;
        unavailableReason = error.message;
      }
    }
    return {
      presetId, label: definition.label, short: definition.short, description: definition.description,
      family: definition.family, available: preview != null, recommended: false,
      score: preview ? score : -100, reasons, unavailableReason, preview,
    };
  });
  results.sort((left, right) => right.score - left.score || PRESET_IDS.indexOf(left.presetId) - PRESET_IDS.indexOf(right.presetId));
  const top = results.find((item) => item.available);
  if (top) top.recommended = true;
  return {
    version: PRESET_CATALOG_VERSION,
    answers,
    recommendations: results,
    planned: PLANNED_PRESETS.map((item) => ({ ...item })),
    notes: recommendationNotes(answers, results),
  };
}
