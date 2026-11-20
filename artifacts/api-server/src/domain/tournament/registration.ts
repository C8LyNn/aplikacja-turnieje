/**
 * #329 · optional public sign-ups. Off by default; the organizer can always run a tournament fully by hand.
 *
 * Settings live on the tournament (`registration_settings`), sign-ups in `tournament_registrations`. A sign-up never
 * touches the engine by itself: only an approval (or the explicit "auto" mode) adds the person through the same roster
 * path as a manual add. The organizer's own questions are the tournament's participant fields marked `askOnSignup`.
 * Everything here is untrusted input with hard limits; nothing is evaluated or rendered as HTML.
 */
import type { ParticipantFieldDefinition, ParticipantFieldSet } from "./participant-fields";

export const REGISTRATION_APPROVAL_MODES = ["manual", "auto"] as const;
export type RegistrationApprovalMode = (typeof REGISTRATION_APPROVAL_MODES)[number];

export interface RegistrationSettings {
  version: 1;
  /** The sign-up page exists (link can be shared). */
  enabled: boolean;
  /** New sign-ups are accepted right now (only meaningful while enabled). */
  open: boolean;
  /** manual: every sign-up waits for approval; auto: accepted straight into the participant list. */
  approval: RegistrationApprovalMode;
  /** Optional cap below the tournament's own participant limit. */
  capacity: number | null;
  /** Short note for people signing up (rules, date, contact info the organizer chooses to publish). */
  note: string | null;
}

export const REGISTRATION_LIMITS = Object.freeze({ nameLength: 60, noteLength: 500, capacityMax: 1024, clientTokenMin: 16, clientTokenMax: 80 });

export const DEFAULT_REGISTRATION_SETTINGS: RegistrationSettings = Object.freeze({
  version: 1, enabled: false, open: false, approval: "manual", capacity: null, note: null,
}) as RegistrationSettings;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
// Control characters and bidi overrides never belong in a nick or a note.
const FORBIDDEN_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/;

export class RegistrationInputError extends Error {
  constructor(message: string, readonly code = "INVALID_REGISTRATION_SETTINGS") { super(message); }
}

/** Validates a complete settings object from the organizer. */
export function parseRegistrationSettings(input: unknown): RegistrationSettings {
  if (!isRecord(input)) throw new RegistrationInputError("Ustawienia zapisów muszą być obiektem.");
  const allowed = new Set(["version", "enabled", "open", "approval", "capacity", "note"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new RegistrationInputError(`Nieznane ustawienia: ${unknown.map((key) => key.slice(0, 30)).join(", ")}.`);
  const enabled = input.enabled === true;
  if (input.enabled !== undefined && typeof input.enabled !== "boolean") throw new RegistrationInputError("enabled: true albo false.");
  if (input.open !== undefined && typeof input.open !== "boolean") throw new RegistrationInputError("open: true albo false.");
  const approval = input.approval === undefined ? "manual" : input.approval;
  if (!REGISTRATION_APPROVAL_MODES.includes(approval as RegistrationApprovalMode)) throw new RegistrationInputError("Tryb akceptacji: ręczny albo automatyczny.");
  let capacity: number | null = null;
  if (input.capacity !== undefined && input.capacity !== null) {
    if (typeof input.capacity !== "number" || !Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > REGISTRATION_LIMITS.capacityMax) {
      throw new RegistrationInputError(`Limit miejsc: liczba całkowita 1–${REGISTRATION_LIMITS.capacityMax} albo brak limitu.`);
    }
    capacity = input.capacity;
  }
  let note: string | null = null;
  if (input.note !== undefined && input.note !== null && input.note !== "") {
    if (typeof input.note !== "string" || FORBIDDEN_CHARS.test(input.note)) throw new RegistrationInputError("Notatka: zwykły tekst.");
    const text = input.note.trim();
    if (text.length > REGISTRATION_LIMITS.noteLength) throw new RegistrationInputError(`Notatka: najwyżej ${REGISTRATION_LIMITS.noteLength} znaków.`);
    note = text || null;
  }
  // Closed when off: switching the page off always stops new sign-ups.
  return { version: 1, enabled, open: enabled && input.open === true, approval: approval as RegistrationApprovalMode, capacity, note };
}

/** Reads stored settings; anything unreadable counts as "off" (never throws on old rows). */
export function registrationSettingsFromStorage(stored: unknown): RegistrationSettings {
  if (stored == null) return DEFAULT_REGISTRATION_SETTINGS;
  try { return parseRegistrationSettings(stored); } catch { return DEFAULT_REGISTRATION_SETTINGS; }
}

/** The nick that becomes the participant name: one line, 1–60 characters, no control characters. */
export function cleanRegistrationName(value: unknown): string | null {
  if (typeof value !== "string" || FORBIDDEN_CHARS.test(value)) return null;
  const name = value.replace(/\s+/g, " ").trim();
  return name.length >= 1 && name.length <= REGISTRATION_LIMITS.nameLength ? name : null;
}

export function isValidClientToken(value: unknown): value is string {
  return typeof value === "string"
    && value.length >= REGISTRATION_LIMITS.clientTokenMin
    && value.length <= REGISTRATION_LIMITS.clientTokenMax
    && /^[A-Za-z0-9_-]+$/.test(value);
}

/**
 * The questions on the public form: fields marked `askOnSignup`. The person signing up may answer them even when the
 * answer stays organizer-only (contact, age range); answering never makes a value public.
 */
export function signupFieldSet(set: ParticipantFieldSet | null): ParticipantFieldSet | null {
  const fields = (set?.fields ?? []).filter((field) => field.askOnSignup === true);
  return fields.length ? { version: 1, fields } : null;
}

/** What the public form needs to render a question — no stored values, no defaults of other people. */
export function publicSignupField(field: ParticipantFieldDefinition) {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    visibility: field.visibility,
    ...(field.description ? { description: field.description } : {}),
    ...(field.options ? { options: field.options } : {}),
    ...(field.min !== undefined ? { min: field.min } : {}),
    ...(field.max !== undefined ? { max: field.max } : {}),
    ...(field.maxLength !== undefined ? { maxLength: field.maxLength } : {}),
  };
}

/** Free places for new sign-ups: pending sign-ups hold a place so the list cannot be oversubscribed. */
export function registrationPlaces(settings: RegistrationSettings, maxPlayers: number | null | undefined, taken: { players: number; pending: number }) {
  const limit = Math.min(settings.capacity ?? Number.POSITIVE_INFINITY, maxPlayers ?? 256);
  const used = taken.players + taken.pending;
  return { limit, used, remaining: Math.max(0, limit - used) };
}
