/**
 * V5 · Stage A — beginner creation wizard model (pure, testable).
 * The preset catalog lives on the server (`/api/tournaments/presets/*`); this module
 * mirrors its response types and owns draft persistence and payload assembly.
 */
import type { LeagueRules, TournamentInput } from "@workspace/api-client-react";

export type WizardKind = "tournament" | "league";
export type ParticipantType = "players" | "teams";
export type Grouping = "yes" | "no" | "any";
export type Priority = "short" | "more_matches" | "accurate";
export type Visibility = "public_online" | "private_online" | "private_offline";

export type PresetId =
  | "single_elimination"
  | "double_elimination"
  | "swiss"
  | "round_robin"
  | "groups_playoff"
  | "swiss_playoff"
  | "league_playoff";

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
  | "entrySeeding"
  | "groupPlacement"
  | "qualifierSeeding";

export type PresetParams = Partial<Record<PresetParamKey, number>>;

export interface WizardAnswers {
  kind: WizardKind;
  participantType: ParticipantType;
  participantCount: number;
  grouping: Grouping;
  priority: Priority;
}

export interface PresetParamLimit {
  key: PresetParamKey;
  label: string;
  help: string;
  options: number[];
  value: number;
  /** V5.4: labels of enumerated params, aligned with `options`. */
  optionLabels?: string[];
}

export interface PresetStageSummary {
  position: number;
  key: string;
  name: string;
  format: string;
  formatLabel: string;
  participantCount: number;
  bestOf: number;
  groupSizes: number[] | null;
  advancingCount: number | null;
  advancementText: string;
  matches: { min: number; max: number };
  rounds: { min: number; max: number };
  byes: number;
}

export interface PresetPreview {
  version: 1;
  presetId: PresetId;
  label: string;
  family: "elimination" | "points" | "multi_stage";
  params: PresetParams & { participantCount: number; bestOf: number };
  paramLimits: PresetParamLimit[];
  participants: { mode: "up_to" | "exact"; count: number; minimum: number };
  creation: {
    format: "single_elimination" | "double_elimination" | "swiss" | "round_robin";
    maxPlayers: number;
    defaultBestOf: 1 | 3 | 5 | 7;
    swissRounds?: number;
    stagePlan?: NonNullable<TournamentInput["stagePlan"]>;
    /** V5.3: rules and schedule of a flexible single league (no stage plan). */
    leagueRules?: PresetLeagueRules;
    scheduleTimeZone?: string;
    schedulePlan?: WizardSchedulePlan;
  };
  stagePlan: NonNullable<TournamentInput["stagePlan"]>;
  /** V5.3: league rules of the table stage; null/absent for formats without a points table. */
  leagueRules?: PresetLeagueRules | null;
  /** V5.3: planned dates (from an AI file); the wizard computes its own from WizardDraft.schedule. */
  schedule?: { stageName: string; timeZone: string; startDate: string; intervalDays: number; defaultTime: string; rounds: number; firstDate: string; lastDate: string } | null;
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

/** V5.3: the API's league rules (draws, points, ordered tie-breakers). */
export type PresetLeagueRules = LeagueRules;

export interface WizardSchedulePlan {
  startDate: string;
  intervalDays: number;
  defaultTime: string;
}

/** V5.3: optional league schedule chosen in the wizard. */
export interface WizardSchedule extends WizardSchedulePlan {
  timeZone: string;
}

export interface PresetRecommendation {
  presetId: PresetId;
  label: string;
  short: string;
  description: string;
  family: PresetPreview["family"];
  available: boolean;
  recommended: boolean;
  score: number;
  reasons: string[];
  unavailableReason: string | null;
  preview: PresetPreview | null;
}

export interface RecommendationResult {
  version: 1;
  answers: WizardAnswers;
  recommendations: PresetRecommendation[];
  planned: Array<{ id: string; label: string; reason: string }>;
  /** Plain-language notes when an answer could not be honoured (older APIs omit it). */
  notes?: string[];
}

/** Match length without jargon: "Jedna gra" / "Do 2 wygranych" (BO3). */
export function bestOfLabel(bestOf: number): string {
  return bestOf <= 1 ? "Jedna gra" : `Do ${Math.ceil(bestOf / 2)} wygranych`;
}

export const WIZARD_STEPS = [
  { id: "needs", label: "Rozgrywki" },
  { id: "format", label: "Format" },
  { id: "tune", label: "Dopasuj" },
  { id: "details", label: "Nazwa i dostęp" },
] as const;
export type WizardStepIndex = 0 | 1 | 2 | 3;

export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 128;
export const COUNT_SHORTCUTS = [4, 8, 12, 16, 24, 32] as const;

export const DEFAULT_ANSWERS: WizardAnswers = {
  kind: "tournament",
  participantType: "players",
  participantCount: 8,
  grouping: "any",
  priority: "short",
};

export interface WizardDraft {
  step: WizardStepIndex;
  maxVisitedStep: WizardStepIndex;
  answers: WizardAnswers;
  presetId: PresetId | null;
  params: PresetParams;
  name: string;
  description: string;
  visibility: Visibility;
  /** Teams only: minimum starters and maximum roster (null = no limit). */
  rosterMin: number | null;
  rosterMax: number | null;
  /** V5.3: league schedule (null = a league without dates). */
  schedule: WizardSchedule | null;
  /** V5.4: a plan no preset can express (AI file); edited only in the advanced editor. */
  custom: CustomPlan | null;
}

export const DEFAULT_DRAFT: WizardDraft = {
  step: 0,
  maxVisitedStep: 0,
  answers: DEFAULT_ANSWERS,
  presetId: null,
  params: {},
  name: "",
  description: "",
  visibility: "public_online",
  rosterMin: null,
  rosterMax: null,
  schedule: null,
  custom: null,
};

export const WIZARD_DRAFT_KEY = "tm_exp_wizard_draft_v1";

const PRESET_IDS: readonly PresetId[] = [
  "single_elimination", "double_elimination", "swiss", "round_robin", "groups_playoff", "swiss_playoff", "league_playoff",
];
const PARAM_KEYS: readonly PresetParamKey[] = [
  "participantCount", "bestOf", "playoffBestOf", "swissRounds", "groupCount", "qualifiersPerGroup", "advancingCount", "legs",
  "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding", "groupPlacement", "qualifierSeeding",
];

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? value as T : fallback;
}

export function clampCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_ANSWERS.participantCount;
  return Math.min(MAX_PARTICIPANTS, Math.max(MIN_PARTICIPANTS, Math.round(parsed)));
}

/** Accepts anything (old or tampered storage) and returns a safe draft. Never contains passwords. */
export function sanitizeDraft(raw: unknown): WizardDraft {
  const record = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};
  const answers = typeof record.answers === "object" && record.answers !== null ? record.answers as Record<string, unknown> : {};
  const params: PresetParams = {};
  if (typeof record.params === "object" && record.params !== null) {
    for (const key of PARAM_KEYS) {
      const value = (record.params as Record<string, unknown>)[key];
      if (Number.isInteger(value)) params[key] = value as number;
    }
  }
  const step = [0, 1, 2, 3].includes(record.step as number) ? record.step as WizardStepIndex : 0;
  const maxVisited = [0, 1, 2, 3].includes(record.maxVisitedStep as number) ? record.maxVisitedStep as WizardStepIndex : step;
  const presetId = typeof record.presetId === "string" && PRESET_IDS.includes(record.presetId as PresetId)
    ? record.presetId as PresetId
    : null;
  return {
    step: presetId == null && step > 1 ? 1 : step,
    maxVisitedStep: Math.max(step, maxVisited) as WizardStepIndex,
    answers: {
      kind: oneOf(answers.kind, ["tournament", "league"], DEFAULT_ANSWERS.kind),
      participantType: oneOf(answers.participantType, ["players", "teams"], DEFAULT_ANSWERS.participantType),
      participantCount: clampCount(answers.participantCount),
      grouping: oneOf(answers.grouping, ["yes", "no", "any"], DEFAULT_ANSWERS.grouping),
      priority: oneOf(answers.priority, ["short", "more_matches", "accurate"], DEFAULT_ANSWERS.priority),
    },
    presetId,
    params,
    name: typeof record.name === "string" ? record.name.slice(0, 200) : "",
    description: typeof record.description === "string" ? record.description.slice(0, 2000) : "",
    visibility: oneOf(record.visibility, ["public_online", "private_online", "private_offline"], "public_online"),
    rosterMin: rosterLimit(record.rosterMin),
    rosterMax: rosterLimit(record.rosterMax),
    schedule: sanitizeSchedule(record.schedule),
    custom: sanitizeCustomPlan(record.custom),
  };
}

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function sanitizeSchedule(value: unknown): WizardSchedule | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.startDate !== "string" || !LOCAL_DATE.test(record.startDate)) return null;
  if (typeof record.defaultTime !== "string" || !LOCAL_TIME.test(record.defaultTime)) return null;
  if (!Number.isInteger(record.intervalDays) || (record.intervalDays as number) < 1 || (record.intervalDays as number) > 60) return null;
  if (typeof record.timeZone !== "string" || record.timeZone.length === 0 || record.timeZone.length > 64) return null;
  return { startDate: record.startDate, intervalDays: record.intervalDays as number, defaultTime: record.defaultTime, timeZone: record.timeZone };
}

/** The browser's IANA zone (falls back to Europe/Warsaw). */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Warsaw";
  } catch {
    return "Europe/Warsaw";
  }
}

export function defaultWizardSchedule(today = new Date()): WizardSchedule {
  const next = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 7));
  return { startDate: next.toISOString().slice(0, 10), intervalDays: 7, defaultTime: "18:00", timeZone: browserTimeZone() };
}

/** Calendar date + n days (independent of DST). */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! + days)).toISOString().slice(0, 10);
}

/** True when every stage is a league table (rounds are "kolejki"). */
export function isLeagueOnly(preview: Pick<PresetPreview, "stages">): boolean {
  return preview.stages.length > 0 && preview.stages.every((stage) => stage.format === "round_robin");
}

/** The first league/group stage of a plan — the one a schedule applies to. */
export function scheduleTargetStage(preview: Pick<PresetPreview, "stages">): PresetStageSummary | null {
  return preview.stages.find((stage) => stage.format === "round_robin" || stage.format === "group_stage") ?? null;
}

export interface ScheduleOutline {
  stageName: string;
  rounds: number;
  firstDate: string;
  lastDate: string;
  weeks: number;
}

/** First and last match day of the league part; the server repeats this check (DST included) on create. */
export function scheduleOutline(preview: PresetPreview, schedule: WizardSchedulePlan | null): ScheduleOutline | null {
  const stage = scheduleTargetStage(preview);
  if (!stage || !schedule) return null;
  const rounds = stage.rounds.max;
  const lastDate = addDays(schedule.startDate, (rounds - 1) * schedule.intervalDays);
  return {
    stageName: stage.name,
    rounds,
    firstDate: schedule.startDate,
    lastDate,
    weeks: Math.max(1, Math.ceil(((rounds - 1) * schedule.intervalDays + 1) / 7)),
  };
}

/** "5 grudnia 2026" — local calendar date (genitive month) without time-zone shifts. */
export function formatLocalDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const months = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  return `${day} ${months[(month ?? 1) - 1]} ${year}`;
}

/** One sentence describing the points system. */
export function leagueRulesSentence(rules: PresetLeagueRules | null | undefined): string | null {
  if (!rules) return null;
  const draw = rules.allowDraws ? `, remis ${rules.points.draw} pkt` : "";
  return `Zwycięstwo ${rules.points.win} pkt${draw}, porażka ${rules.points.loss} pkt. ${rules.allowDraws ? "Mecz może skończyć się remisem." : "Każdy mecz ma zwycięzcę."}`;
}

function rosterLimit(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 50 ? value as number : null;
}

export function readWizardDraft(storage: Pick<Storage, "getItem"> | null): WizardDraft {
  try {
    const raw = storage?.getItem(WIZARD_DRAFT_KEY);
    return raw ? sanitizeDraft(JSON.parse(raw)) : DEFAULT_DRAFT;
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function writeWizardDraft(storage: Pick<Storage, "setItem"> | null, draft: WizardDraft): void {
  try {
    storage?.setItem(WIZARD_DRAFT_KEY, JSON.stringify(sanitizeDraft(draft)));
  } catch {
    /* storage may be unavailable (private mode); the wizard keeps working in memory */
  }
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

export function participantNoun(type: ParticipantType, n: number): string {
  return type === "teams"
    ? plural(n, "drużyna", "drużyny", "drużyn")
    : plural(n, "uczestnik", "uczestników", "uczestników");
}

export function rangeText(range: { min: number; max: number }): string {
  return range.min === range.max ? String(range.min) : `${range.min}–${range.max}`;
}

/** Answers changed → a previously chosen preset may no longer fit; keep it only if still offered. */
export function reconcilePresetAfterAnswers(
  presetId: PresetId | null,
  recommendations: readonly PresetRecommendation[],
): PresetId | null {
  if (presetId && recommendations.some((item) => item.presetId === presetId && item.available)) return presetId;
  return recommendations.find((item) => item.recommended)?.presetId ?? null;
}

/** Only the params the user can tune for this preset, with participant count from the answers. */
export function requestParams(presetId: PresetId, answers: WizardAnswers, params: PresetParams): PresetParams {
  const result: PresetParams = { participantCount: answers.participantCount };
  for (const key of PRESET_PARAM_KEYS_BY_PRESET[presetId]) if (params[key] != null) result[key] = params[key];
  return result;
}

/** Mirrors the server's PRESET_TUNABLE_PARAMS (participantCount comes from the answers). */
export const PRESET_PARAM_KEYS_BY_PRESET: Record<PresetId, PresetParamKey[]> = {
  single_elimination: ["bestOf", "entrySeeding"],
  double_elimination: ["bestOf", "entrySeeding"],
  swiss: ["bestOf", "swissRounds", "entrySeeding"],
  round_robin: ["bestOf", "legs", "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding"],
  groups_playoff: ["bestOf", "playoffBestOf", "groupCount", "qualifiersPerGroup", "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding", "groupPlacement", "qualifierSeeding"],
  swiss_playoff: ["bestOf", "playoffBestOf", "swissRounds", "advancingCount", "entrySeeding"],
  league_playoff: ["bestOf", "playoffBestOf", "advancingCount", "legs", "allowDraws", "pointsWin", "pointsDraw", "pointsLoss", "entrySeeding"],
};

export const PRESET_LABELS: Record<PresetId, string> = {
  single_elimination: "Drabinka pucharowa",
  double_elimination: "Podwójna eliminacja",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  groups_playoff: "Grupy i play-off",
  swiss_playoff: "Szwajcarski i play-off",
  league_playoff: "Tabela i play-off",
};
export const ALL_PRESET_IDS: readonly PresetId[] = PRESET_IDS;

/** The preview's placeholder draw key (server PRESET_PREVIEW_RANDOM_SEED). */
export const PRESET_PREVIEW_RANDOM_SEED = "preset-draw";

/** A fresh, unpredictable draw key for one tournament (falls back to Math.random without Web Crypto). */
export function freshDrawKey(): string {
  try {
    const bytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(bytes);
    return `draw-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return `draw-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  }
}

function withFreshDrawKeys<T extends { stages: Array<{ randomSeed?: string }> }>(plan: T, drawKey: () => string): T {
  return { ...plan, stages: plan.stages.map((stage) => (stage.randomSeed === PRESET_PREVIEW_RANDOM_SEED ? { ...stage, randomSeed: drawKey() } : stage)) };
}

export interface CreateSecrets {
  organizerPassword: string;
  supportPassword: string;
  viewerPassword: string;
}

export function buildCreatePayload(
  preview: Pick<PresetPreview, "creation" | "stages">,
  details: { name: string; description: string; visibility: Visibility; participantType?: ParticipantType; rosterMin?: number | null; rosterMax?: number | null; schedule?: WizardSchedule | null },
  secrets: CreateSecrets,
  drawKey: () => string = freshDrawKey,
): TournamentInput {
  const teams = details.participantType === "teams";
  // V5.3: a wizard schedule goes on the first league/group stage (plan) or on the flexible league itself.
  const schedule = details.schedule && scheduleTargetStage(preview) ? details.schedule : null;
  const plan = { startDate: schedule?.startDate ?? "", intervalDays: schedule?.intervalDays ?? 7, defaultTime: schedule?.defaultTime ?? "" };
  let scheduled = false;
  const stagePlan = preview.creation.stagePlan && schedule
    ? {
        ...preview.creation.stagePlan,
        stages: preview.creation.stagePlan.stages.map((stage) => {
          if (scheduled || (stage.format !== "round_robin" && stage.format !== "group_stage")) return stage;
          scheduled = true;
          return { ...stage, scheduleTimeZone: schedule.timeZone, schedulePlan: plan };
        }),
      }
    : preview.creation.stagePlan;
  const flexibleSchedule = !preview.creation.stagePlan && schedule && preview.creation.format === "round_robin"
    ? { scheduleTimeZone: schedule.timeZone, schedulePlan: plan }
    : preview.creation.scheduleTimeZone && preview.creation.schedulePlan
      ? { scheduleTimeZone: preview.creation.scheduleTimeZone, schedulePlan: preview.creation.schedulePlan }
      : {};
  const rosterMin = teams ? details.rosterMin ?? null : null;
  const rosterMax = teams ? details.rosterMax ?? null : null;
  return {
    ...(teams ? { participantType: "teams" as const } : {}),
    ...(rosterMin != null ? { teamRosterMin: rosterMin } : {}),
    ...(rosterMax != null && (rosterMin == null || rosterMax >= rosterMin) ? { teamRosterMax: rosterMax } : {}),
    name: details.name.trim(),
    description: details.description.trim() || undefined,
    format: preview.creation.format,
    maxPlayers: preview.creation.maxPlayers,
    defaultBestOf: preview.creation.defaultBestOf,
    ...(preview.creation.swissRounds != null ? { swissRounds: preview.creation.swissRounds } : {}),
    ...(stagePlan ? { stagePlan: withFreshDrawKeys(stagePlan, drawKey) } : {}),
    ...(!preview.creation.stagePlan && preview.creation.leagueRules ? { leagueRules: preview.creation.leagueRules } : {}),
    ...flexibleSchedule,
    organizerPassword: secrets.organizerPassword,
    supportPassword: secrets.supportPassword.trim() || undefined,
    viewerPassword: details.visibility === "private_online" ? secrets.viewerPassword.trim() || undefined : undefined,
    visibility: details.visibility,
  };
}

/**
 * V5.4: the simple wizard and the advanced editor share ONE draft (WIZARD_DRAFT_KEY), so switching
 * modes never re-derives or drops settings. A plan that no preset can express (an imported AI file
 * with a custom stage plan) travels as `custom` and is edited only in the advanced editor.
 */
export interface CustomPlan {
  label: string;
  preview: Pick<PresetPreview, "label" | "creation" | "stages" | "totals" | "participants" | "warnings" | "requirements" | "winnerRule">;
}

export function customPlanFromPreview(preview: PresetPreview, label = "Własna konfiguracja z pliku AI"): CustomPlan {
  return {
    label,
    preview: {
      label,
      creation: preview.creation,
      stages: preview.stages,
      totals: preview.totals,
      participants: preview.participants,
      warnings: preview.warnings,
      requirements: preview.requirements,
      winnerRule: preview.winnerRule,
    },
  };
}

function sanitizeCustomPlan(value: unknown): CustomPlan | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const preview = record.preview as Record<string, unknown> | undefined;
  const creation = preview?.creation as Record<string, unknown> | undefined;
  if (typeof record.label !== "string" || !creation || typeof creation.format !== "string" || !Number.isInteger(creation.maxPlayers)) return null;
  if (!Array.isArray(preview?.stages) || typeof preview?.totals !== "object" || typeof preview?.participants !== "object") return null;
  return { label: record.label.slice(0, 120), preview: preview as unknown as CustomPlan["preview"] };
}

/** Which advanced-only settings the simple wizard cannot show (shown before leaving the advanced editor). */
export function simpleWizardLimitations(draft: WizardDraft): string[] {
  const notes: string[] = [];
  if (draft.custom) notes.push(`Własny plan „${draft.custom.label}” nie da się edytować w prostym kreatorze — zostanie zachowany i wrócisz do niego w trybie zaawansowanym.`);
  return notes;
}

/** The wizard step to resume on when coming back from the advanced editor. */
export function resumeStep(draft: WizardDraft): WizardStepIndex {
  if (draft.custom || draft.presetId == null) return draft.custom ? 1 : 0;
  return 2;
}

/** V5.4: one short line per stage, e.g. "Faza grupowa · 4 grupy po 4 · awans 8" → "Play-off · 8 · BO3". */
export function stageChain(preview: Pick<PresetPreview, "stages">): string[] {
  return preview.stages.map((stage) => {
    const parts = [stage.name];
    if (stage.groupSizes && stage.groupSizes.length > 0) {
      const sizes = [...new Set(stage.groupSizes)];
      parts.push(`${stage.groupSizes.length} ${plural(stage.groupSizes.length, "grupa", "grupy", "grup")} po ${sizes.join("–")}`);
    } else {
      parts.push(`${stage.participantCount} ${plural(stage.participantCount, "uczestnik", "uczestników", "uczestników")}`);
    }
    parts.push(bestOfLabel(stage.bestOf));
    if (stage.advancingCount != null) parts.push(`awans ${stage.advancingCount}`);
    return parts.join(" · ");
  });
}
