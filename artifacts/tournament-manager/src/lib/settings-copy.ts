/**
 * QW-09 · "Nowy turniej z tymi ustawieniami" — client side. The server builds the copy from the stored tournament and
 * creates it through the normal create path; this file only asks for the summary and sends the organizer's choices.
 * Requests use the API client's `customFetch`, so the active organizer token is attached as for generated operations.
 */
import { customFetch } from "@workspace/api-client-react";
import { STAGE_FORMAT_LABELS } from "@/lib/tournament-stages-ui";
import { ORGANIZER_PASSWORD_MIN_LENGTH } from "@/lib/create-tournament-validation";

export type CopyVisibility = "public_online" | "private_online" | "private_offline";

export interface SettingsCopySummary {
  sourceId: number;
  sourceName: string;
  mode: "flexible" | "plan";
  participantCount: number | null;
  resizable: boolean;
  stages: { name: string; format: string }[];
  participantType: "players" | "teams";
  visibility: CopyVisibility;
  participantFieldCount: number;
  signups: "off" | "closed";
  gameId: string | null;
  notCopied: string[];
}

export interface SettingsCopyForm {
  name: string;
  organizerPassword: string;
  viewerPassword: string;
  supportPassword: string;
  visibility: CopyVisibility;
  /** Text from the input; only sent for single-stage tournaments and when it differs from the source. */
  participantCount: string;
}

export const COPY_PARTICIPANTS = Object.freeze({ min: 2, max: 1024 });

export const COPY_VISIBILITY_OPTIONS: { value: CopyVisibility; label: string }[] = [
  { value: "public_online", label: "Publiczny" },
  { value: "private_online", label: "Prywatny (z hasłem widza)" },
  { value: "private_offline", label: "Ukryty" },
];

export function fetchSettingsCopy(tournamentId: number) {
  return customFetch<SettingsCopySummary>(`/api/tournaments/${tournamentId}/copy`, { cache: "no-store" });
}

export function createSettingsCopy(tournamentId: number, body: Record<string, unknown>) {
  return customFetch<{ id: number; name: string; organizerToken: string }>(`/api/tournaments/${tournamentId}/copy`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

export function initialCopyForm(summary: SettingsCopySummary): SettingsCopyForm {
  return {
    name: "",
    organizerPassword: "",
    viewerPassword: "",
    supportPassword: "",
    visibility: summary.visibility,
    participantCount: summary.participantCount == null ? "" : String(summary.participantCount),
  };
}

/** First problem with the form, in the order the fields appear; null when it can be sent. */
export function copyFormError(form: SettingsCopyForm, summary: SettingsCopySummary): { field: keyof SettingsCopyForm; message: string } | null {
  if (!form.name.trim()) return { field: "name", message: "Podaj nazwę nowego turnieju." };
  if (summary.resizable && summary.mode === "plan") {
    const value = Number(form.participantCount);
    if (!/^\d+$/.test(form.participantCount.trim()) || value < COPY_PARTICIPANTS.min || value > COPY_PARTICIPANTS.max) {
      return { field: "participantCount", message: `Liczba uczestników: ${COPY_PARTICIPANTS.min}–${COPY_PARTICIPANTS.max}.` };
    }
  }
  if (form.organizerPassword.length < ORGANIZER_PASSWORD_MIN_LENGTH) {
    return { field: "organizerPassword", message: `Hasło organizatora musi mieć co najmniej ${ORGANIZER_PASSWORD_MIN_LENGTH} znaków.` };
  }
  if (form.visibility === "private_online" && !form.viewerPassword) {
    return { field: "viewerPassword", message: "Turniej prywatny wymaga hasła widza." };
  }
  return null;
}

/** The request body: only what the organizer chose; everything else comes from the stored tournament. */
export function copyRequestBody(form: SettingsCopyForm, summary: SettingsCopySummary): Record<string, unknown> {
  const count = Number(form.participantCount);
  return {
    name: form.name.trim(),
    organizerPassword: form.organizerPassword,
    ...(form.visibility !== summary.visibility ? { visibility: form.visibility } : {}),
    ...(form.visibility === "private_online" && form.viewerPassword ? { viewerPassword: form.viewerPassword } : {}),
    ...(form.supportPassword ? { supportPassword: form.supportPassword } : {}),
    ...(summary.resizable && summary.mode === "plan" && count !== summary.participantCount ? { participantCount: count } : {}),
  };
}

/** What carries over, as short lines for the dialog. */
export function copiedLines(summary: SettingsCopySummary): string[] {
  const formats = summary.stages.map((stage) => (STAGE_FORMAT_LABELS as Record<string, string>)[stage.format] ?? stage.format);
  return [
    summary.stages.length > 1
      ? `Plan ${summary.stages.length} etapów: ${formats.join(" → ")}`
      : `Format: ${formats[0] ?? "—"}`,
    "Zasady meczów, punktacja i rozstrzyganie remisów",
    ...(summary.participantType === "teams" ? ["Drużyny i limity składu"] : []),
    ...(summary.gameId ? ["Ustawienia gry"] : []),
    ...(summary.participantFieldCount > 0 ? [`Pola uczestników (${summary.participantFieldCount})`] : []),
    ...(summary.signups === "closed" ? ["Formularz zapisów — zamknięty, otworzysz go, gdy będziesz gotów"] : []),
    "Wygląd i ustawienia prezentacji",
  ];
}
