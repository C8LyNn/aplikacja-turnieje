import { t } from "@/i18n";
/**
 * #329 · optional public sign-ups — client side. Requests go through the API client's `customFetch`, so the active
 * organizer / support / viewer token is attached exactly like for generated operations.
 */
import { customFetch } from "@workspace/api-client-react";
import type { FieldDef } from "@/features/experimental-tournaments/participant-fields-model";

export type RegistrationState = "disabled" | "hidden" | "started" | "closed" | "open" | "full";

export interface RegistrationSettings {
  version: 1;
  enabled: boolean;
  open: boolean;
  approval: "manual" | "auto";
  capacity: number | null;
  note: string | null;
}

export interface PublicRegistration {
  tournament: { id: number; name: string; format: string; status: string };
  registration: { state: RegistrationState; approval: "manual" | "auto"; note: string | null; limit: number | null; remaining: number | null };
  fields: FieldDef[];
}

export interface RegistrationRow {
  id: number;
  name: string;
  status: "pending" | "approved" | "rejected";
  answers: Record<string, unknown> | null;
  missing: Array<{ key: string; label: string }>;
  playerId: number | null;
  onList: boolean;
  decidedAt: string | null;
  decidedBy: string | null;
  createdAt: string;
}

export interface RegistrationList {
  settings: RegistrationSettings;
  state: Exclude<RegistrationState, "full">;
  places: { limit: number | null; used: number; remaining: number | null };
  counts: { pending: number; approved: number; rejected: number; players: number };
  questions: Array<{ key: string; label: string; required: boolean }>;
  registrations: RegistrationRow[];
}

export interface SubmitResult {
  registration: { id: number; name: string; status: "pending" | "approved" };
  repeated: boolean;
  message: string;
}

const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const registrationPath = (tournamentId: number, experimental: boolean) =>
  `${experimental ? "/experimental/tournaments" : "/tournaments"}/${tournamentId}/zapisy` /* i18n-ignore */;

export function fetchPublicRegistration(tournamentId: number) {
  return customFetch<PublicRegistration>(`/api/tournaments/${tournamentId}/registration`, { cache: "no-store" });
}

export function submitRegistration(tournamentId: number, body: { name: string; customFields: Record<string, unknown>; clientToken: string }) {
  return customFetch<SubmitResult>(`/api/tournaments/${tournamentId}/registrations`, json(body));
}

export function fetchRegistrations(tournamentId: number) {
  return customFetch<RegistrationList>(`/api/tournaments/${tournamentId}/registrations`, { cache: "no-store" });
}

export function saveRegistrationSettings(tournamentId: number, settings: Omit<RegistrationSettings, "version">) {
  return customFetch<{ settings: RegistrationSettings }>(`/api/tournaments/${tournamentId}/registration-settings`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings),
  });
}

export function approveRegistration(tournamentId: number, registrationId: number, customFields?: Record<string, unknown>) {
  return customFetch<{ registration: { id: number; status: string; playerId: number }; player: { id: number; name: string } }>(
    `/api/tournaments/${tournamentId}/registrations/${registrationId}/approve`, json(customFields ? { customFields } : {}));
}

export function rejectRegistration(tournamentId: number, registrationId: number) {
  return customFetch<{ registration: { id: number; status: string } }>(`/api/tournaments/${tournamentId}/registrations/${registrationId}/reject`, json({}));
}

/** A readable message from an API refusal (field problems listed when present). */
export function registrationErrorMessage(error: unknown, fallback = t("registrations.nie_udalo_sie_wyslac_sprawdz")): string {
  const data = (error as { data?: { error?: string; problems?: Array<{ message: string }> } } | null)?.data;
  if (data?.problems?.length) return data.problems.map((problem) => problem.message).join(" ");
  return data?.error ?? fallback;
}

export function registrationErrorCode(error: unknown): string | undefined {
  return (error as { data?: { code?: string } } | null)?.data?.code;
}

/** One token per filled-in form: a resend after a network error reuses it, so it never counts twice. */
export function newClientToken(): string {
  const bytes = new Uint8Array(18);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const REGISTRATION_STATE_TEXT: Record<RegistrationState, string> = {
  get disabled() { return t("registrations.zapisy_do_tego_turnieju_sa"); },
  get hidden() { return t("registrations.turniej_jest_ukryty_zapisy_nie"); },
  get started() { return t("registrations.turniej_juz_wystartowal_zapisy_sa"); },
  get closed() { return t("registrations.zapisy_sa_zamkniete"); },
  get open() { return t("registrations.zapisy_sa_otwarte"); },
  get full() { return t("registrations.lista_jest_pelna_brak_wolnych"); },
};
