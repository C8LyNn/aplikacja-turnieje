import { t } from "@/i18n";
/**
 * QW-03b · Classic "Szybki wybór": the Classic creator offers the same presets as the Modern wizard.
 * One source of truth — the server's preset catalog (`/api/tournaments/presets/recommend` for the
 * estimates on the cards, `/api/tournaments/presets/preview` for the chosen preset) and the Modern
 * wizard's `buildCreatePayload`, so the same choice creates the same tournament in both views.
 */
import type { TournamentInput } from "@workspace/api-client-react";
import {
  buildCreatePayload,
  DEFAULT_ANSWERS,
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  plural,
  rangeText,
  type CreateSecrets,
  type PresetId,
  type PresetPreview,
  type PresetRecommendation,
  type Visibility,
} from "@/features/experimental-tournaments/experimental-create-wizard-model";

export interface QuickPreset {
  presetId: PresetId;
  label: string;
  hint: string;
}

export const QUICK_PRESETS: readonly QuickPreset[] = [
  { presetId: "single_elimination", get label() { return t("classicQuickPresets.szybki_puchar"); }, get hint() { return t("classicQuickPresets.przegrany_odpada_najmniej_meczow"); } },
  { presetId: "double_elimination", get label() { return t("classicQuickPresets.dwie_szanse"); }, get hint() { return t("classicQuickPresets.odpada_sie_dopiero_po_drugiej"); } },
  { presetId: "round_robin", get label() { return t("classicQuickPresets.kazdy_z_kazdym"); }, get hint() { return t("classicQuickPresets.wszyscy_graja_ze_wszystkimi_wygrywa"); } },
  { presetId: "swiss", get label() { return t("classicQuickPresets.szwajcarski"); }, get hint() { return t("classicQuickPresets.stala_liczba_rund_nikt_nie"); } },
  { presetId: "groups_playoff", get label() { return t("classicQuickPresets.grupy_i_play_off"); }, get hint() { return t("classicQuickPresets.najpierw_grupy_potem_drabinka_najlepszyc"); } },
];

export const QUICK_PRESET_DEFAULT_COUNT = 8;
export const QUICK_BEST_OF_OPTIONS = [1, 3, 5, 7] as const;
export type QuickBestOf = (typeof QUICK_BEST_OF_OPTIONS)[number];

/** A whole number 2–128, or null (empty / out of range / not a number). */
export function parseQuickCount(value: string): number | null {
  if (!/^\d{1,3}$/.test(value.trim())) return null;
  const count = Number.parseInt(value.trim(), 10);
  return count >= MIN_PARTICIPANTS && count <= MAX_PARTICIPANTS ? count : null;
}

/** Same answers as the Modern wizard's defaults, only the participant count differs. */
export function quickRecommendBody(participantCount: number) {
  return { ...DEFAULT_ANSWERS, participantCount };
}

/** Same request the Modern wizard sends for a preset with no tuned parameters (bestOf only when changed). */
export function quickPreviewBody(presetId: PresetId, participantCount: number, bestOf: QuickBestOf) {
  return {
    presetId,
    params: bestOf === 1 ? { participantCount } : { participantCount, bestOf },
    priority: DEFAULT_ANSWERS.priority,
  };
}

/** "≈ 7 meczów · 3 rundy" (ranges where the result decides, e.g. "≈ 14–15 meczów"). */
export function estimateText(preview: Pick<PresetPreview, "totals">): string {
  const { matches, rounds } = preview.totals;
  return `≈ ${rangeText(matches)} ${plural(matches.max, t("classicQuickPresets.mecz"), t("classicQuickPresets.mecze"), t("classicQuickPresets.meczow"))} · ${rangeText(rounds)} ${plural(rounds.max, t("classicQuickPresets.runda"), t("classicQuickPresets.rundy"), t("classicQuickPresets.rund"))}`;
}

function isRange(value: unknown): value is { min: number; max: number } {
  const record = value as { min?: unknown; max?: unknown } | null;
  return !!record && Number.isInteger(record.min) && Number.isInteger(record.max);
}

/** Accepts only a preview that can be shown and created from (the server is still the judge on create). */
export function isUsablePreview(value: unknown): value is PresetPreview {
  const record = value as Partial<PresetPreview> | null;
  return !!record
    && typeof record.presetId === "string"
    && typeof record.label === "string"
    && !!record.creation && typeof record.creation.format === "string" && Number.isInteger(record.creation.maxPlayers)
    && !!record.totals && isRange(record.totals.matches) && isRange(record.totals.rounds)
    && Array.isArray(record.stages);
}

export function recommendationsFrom(value: unknown): PresetRecommendation[] | null {
  const list = (value as { recommendations?: unknown } | null)?.recommendations;
  if (!Array.isArray(list)) return null;
  return list.filter((item): item is PresetRecommendation => !!item && typeof (item as PresetRecommendation).presetId === "string");
}

export async function postPresetJson(url: string, body: unknown, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" && data.error ? data.error : t("classicQuickPresets.serwer_odpowiedzial_bledem_http_status", { status: response.status }));
  }
  return data;
}

/** The create payload of a quick preset: exactly the Modern wizard's payload, plus Classic's game choice. */
export function quickPresetPayload(
  preview: PresetPreview,
  details: { name: string; description: string; visibility: Visibility },
  secrets: CreateSecrets,
  gameConfig: TournamentInput["gameConfig"] | null,
): TournamentInput {
  const payload = buildCreatePayload(preview, details, secrets);
  return gameConfig ? { ...payload, gameConfig } : payload;
}
