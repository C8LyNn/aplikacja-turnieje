/**
 * V5 · Stage A — beginner creation wizard model (pure, testable).
 * The preset catalog lives on the server (`/api/tournaments/presets/*`); this module
 * mirrors its response types and owns draft persistence and payload assembly.
 */
import type { TournamentInput } from "@workspace/api-client-react";

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
  | "legs";

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
  };
  stagePlan: NonNullable<TournamentInput["stagePlan"]>;
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
};

export const WIZARD_DRAFT_KEY = "tm_exp_wizard_draft_v1";
/** One-shot hand-off consumed by the advanced form. */
export const ADVANCED_HANDOFF_KEY = "tm_exp_create_handoff_v1";

const PRESET_IDS: readonly PresetId[] = [
  "single_elimination", "double_elimination", "swiss", "round_robin", "groups_playoff", "swiss_playoff", "league_playoff",
];
const PARAM_KEYS: readonly PresetParamKey[] = [
  "participantCount", "bestOf", "playoffBestOf", "swissRounds", "groupCount", "qualifiersPerGroup", "advancingCount", "legs",
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
  };
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
  const allowed: Record<PresetId, PresetParamKey[]> = {
    single_elimination: ["bestOf"],
    double_elimination: ["bestOf"],
    swiss: ["bestOf", "swissRounds"],
    round_robin: ["bestOf", "legs"],
    groups_playoff: ["bestOf", "playoffBestOf", "groupCount", "qualifiersPerGroup"],
    swiss_playoff: ["bestOf", "playoffBestOf", "swissRounds", "advancingCount"],
    league_playoff: ["bestOf", "playoffBestOf", "advancingCount", "legs"],
  };
  const result: PresetParams = { participantCount: answers.participantCount };
  for (const key of allowed[presetId]) if (params[key] != null) result[key] = params[key];
  return result;
}

export interface CreateSecrets {
  organizerPassword: string;
  supportPassword: string;
  viewerPassword: string;
}

export function buildCreatePayload(
  preview: PresetPreview,
  details: { name: string; description: string; visibility: Visibility },
  secrets: CreateSecrets,
): TournamentInput {
  return {
    name: details.name.trim(),
    description: details.description.trim() || undefined,
    format: preview.creation.format,
    maxPlayers: preview.creation.maxPlayers,
    defaultBestOf: preview.creation.defaultBestOf,
    ...(preview.creation.swissRounds != null ? { swissRounds: preview.creation.swissRounds } : {}),
    ...(preview.creation.stagePlan ? { stagePlan: preview.creation.stagePlan } : {}),
    organizerPassword: secrets.organizerPassword,
    supportPassword: secrets.supportPassword.trim() || undefined,
    viewerPassword: details.visibility === "private_online" ? secrets.viewerPassword.trim() || undefined : undefined,
    visibility: details.visibility,
  };
}

export interface AdvancedHandoff {
  version: 1;
  name: string;
  description: string;
  visibility: Visibility;
  /** A wizard preset, or "custom" for an imported multi-stage plan. */
  presetId: PresetId | "custom";
  label: string;
  creation: PresetPreview["creation"];
}

export function buildAdvancedHandoff(
  preview: PresetPreview,
  details: { name: string; description: string; visibility: Visibility },
): AdvancedHandoff {
  return {
    version: 1,
    name: details.name,
    description: details.description,
    visibility: details.visibility,
    presetId: preview.presetId,
    label: preview.label,
    creation: preview.creation,
  };
}

/** Reads the hand-off (pure, safe for StrictMode double initialisers). Clear it with `clearAdvancedHandoff`. */
export function readAdvancedHandoff(storage: Pick<Storage, "getItem"> | null): AdvancedHandoff | null {
  try {
    const raw = storage?.getItem(ADVANCED_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdvancedHandoff;
    if (parsed?.version !== 1 || typeof parsed.creation?.format !== "string" || !Number.isInteger(parsed.creation?.maxPlayers)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAdvancedHandoff(storage: Pick<Storage, "removeItem"> | null): void {
  try {
    storage?.removeItem(ADVANCED_HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}

export function writeAdvancedHandoff(storage: Pick<Storage, "setItem"> | null, handoff: AdvancedHandoff): void {
  try {
    storage?.setItem(ADVANCED_HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    /* ignore */
  }
}
