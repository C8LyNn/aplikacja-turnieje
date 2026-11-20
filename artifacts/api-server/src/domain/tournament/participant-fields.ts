/**
 * V5.4-005 · participant fields.
 *
 * A tournament may define extra fields for its participants: picked from a library (nick, MMR,
 * Discord, …) or created by the organiser. Definitions live on the tournament, values on each
 * participant. Everything here is untrusted input: keys are slugs from a closed alphabet, labels
 * and values are plain text with hard limits, no user-supplied regular expressions or code are ever
 * evaluated, and reserved keys (identity, permissions, engine columns) cannot be shadowed.
 *
 * Fields never influence ranking, results or seeding: the engine does not read them.
 */

export const PARTICIPANT_FIELD_TYPES = [
  "short_text",
  "long_text",
  "number",
  "select",
  "multi_select",
  "boolean",
  "date",
  "color",
  "url",
] as const;
export type ParticipantFieldType = (typeof PARTICIPANT_FIELD_TYPES)[number];

export const PARTICIPANT_FIELD_CATEGORIES = [
  "identity",
  "gaming",
  "ranking",
  "team",
  "location",
  "contact",
  "organization",
  "interests",
  "other",
] as const;
export type ParticipantFieldCategory = (typeof PARTICIPANT_FIELD_CATEGORIES)[number];

/** Who may see a value: only the organiser, organiser + helpers, or everyone who can see the tournament. */
export const PARTICIPANT_FIELD_VISIBILITY = ["organizer", "staff", "public"] as const;
export type ParticipantFieldVisibility = (typeof PARTICIPANT_FIELD_VISIBILITY)[number];

/** "profile" describes the person or team; "entry" describes this tournament's registration. */
export const PARTICIPANT_FIELD_KINDS = ["profile", "entry"] as const;
export type ParticipantFieldKind = (typeof PARTICIPANT_FIELD_KINDS)[number];

export type ParticipantFieldValue = string | number | boolean | string[];

export interface ParticipantFieldDefinition {
  key: string;
  label: string;
  type: ParticipantFieldType;
  category: ParticipantFieldCategory;
  kind: ParticipantFieldKind;
  description?: string;
  required: boolean;
  visibility: ParticipantFieldVisibility;
  /** select / multi_select only. */
  options?: string[];
  /** number: inclusive bounds; text: max length (≤ type limit). */
  min?: number;
  max?: number;
  maxLength?: number;
  defaultValue?: ParticipantFieldValue;
  /** Library entry this field was created from (informational). */
  libraryId?: string;
  /** #329: asked on the public sign-up form (only when sign-ups are on). Never makes a value public by itself. */
  askOnSignup?: boolean;
}

export interface ParticipantFieldSet {
  version: 1;
  fields: ParticipantFieldDefinition[];
}

export interface ParticipantFieldProblem {
  path: string;
  code: string;
  message: string;
}

export const PARTICIPANT_FIELD_LIMITS = Object.freeze({
  fields: 40,
  keyLength: 40,
  labelLength: 60,
  descriptionLength: 200,
  options: 50,
  optionLength: 60,
  shortText: 200,
  longText: 2000,
  url: 500,
  number: 1_000_000_000,
});

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/;
/** Keys that would shadow identity, permissions, engine columns or object internals. */
const RESERVED_KEYS = new Set([
  "id", "name", "seed", "status", "rank", "country", "team_name", "teamname", "tournament_id", "tournamentid",
  "token", "password", "secret", "session", "role", "admin", "organizer", "organizer_token", "permissions",
  "created_at", "createdat", "custom_fields", "customfields", "__proto__", "prototype", "constructor",
]);
// Control characters (except tab/newline in long text) are rejected outright.
const CONTROL = new RegExp("[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029\u202A-\u202E\u2066-\u2069]");

type Rec = Record<string, unknown>;
const isRecord = (value: unknown): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);

function cleanText(value: unknown, limit: number, multiline = false): string | null {
  if (typeof value !== "string") return null;
  const text = multiline ? value.replace(/\r\n?/g, "\n").trim() : value.trim();
  if (!multiline && /[\n\t]/.test(text)) return null;
  if (CONTROL.test(text) || text.length > limit) return null;
  return text;
}

/** Library: ready-made fields grouped by category. Private-looking data (contact, real name) defaults to organiser-only. */
export interface ParticipantFieldLibraryEntry extends Omit<ParticipantFieldDefinition, "required"> {
  libraryId: string;
}

const lib = (
  libraryId: string,
  label: string,
  type: ParticipantFieldType,
  category: ParticipantFieldCategory,
  visibility: ParticipantFieldVisibility,
  extra: Partial<ParticipantFieldLibraryEntry> = {},
): ParticipantFieldLibraryEntry => ({
  libraryId,
  key: libraryId,
  label,
  type,
  category,
  kind: extra.kind ?? "profile",
  visibility,
  ...extra,
});

export const PARTICIPANT_FIELD_LIBRARY: readonly ParticipantFieldLibraryEntry[] = Object.freeze([
  lib("nick", "Nick", "short_text", "identity", "public"),
  lib("first_name", "Imię", "short_text", "identity", "organizer"),
  lib("last_name", "Nazwisko", "short_text", "identity", "organizer"),
  lib("birth_date", "Data urodzenia", "date", "identity", "organizer"),
  lib("platform", "Platforma", "select", "gaming", "public", { options: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"] }),
  lib("main_character", "Ulubiona postać", "short_text", "gaming", "public"),
  lib("game_role", "Rola", "select", "gaming", "public", { options: ["Atak", "Obrona", "Wsparcie", "Tank", "Flex"] }),
  lib("game_rank", "Ranga w grze", "short_text", "ranking", "public"),
  lib("mmr", "MMR", "number", "ranking", "public", { min: 0, max: 20000 }),
  lib("elo", "ELO", "number", "ranking", "public", { min: 0, max: 4000 }),
  lib("win_rate", "Procent zwycięstw", "number", "ranking", "public", { min: 0, max: 100 }),
  lib("captain", "Kapitan", "short_text", "team", "public"),
  lib("jersey_number", "Numer zawodnika", "number", "team", "public", { min: 0, max: 999, kind: "entry" }),
  lib("club", "Klub / organizacja", "short_text", "team", "public"),
  lib("city", "Miasto", "short_text", "location", "public"),
  lib("time_zone", "Strefa czasowa", "short_text", "location", "staff"),
  lib("email", "E-mail kontaktowy", "short_text", "contact", "organizer"),
  lib("phone", "Telefon", "short_text", "contact", "organizer"),
  lib("discord", "Discord", "short_text", "contact", "staff"),
  lib("steam", "Profil Steam", "url", "contact", "staff"),
  lib("twitch", "Kanał Twitch", "url", "contact", "public"),
  lib("registration_status", "Status zgłoszenia", "select", "organization", "staff", { kind: "entry", options: ["Zgłoszony", "Potwierdzony", "Opłacony", "Rezerwa", "Wycofany"] }),
  lib("checked_in", "Obecność potwierdzona", "boolean", "organization", "staff", { kind: "entry" }),
  lib("fee_paid", "Wpisowe opłacone", "boolean", "organization", "organizer", { kind: "entry" }),
  lib("notes", "Notatki organizatora", "long_text", "organization", "organizer", { kind: "entry" }),
  lib("favorite_color", "Ulubiony kolor", "color", "interests", "public"),
  lib("favorite_number", "Ulubiona liczba", "number", "interests", "public", { min: -1_000_000, max: 1_000_000 }),
  lib("favorite_animal", "Ulubione zwierzę", "short_text", "interests", "public"),
  lib("motto", "Motto", "short_text", "other", "public"),
]);

export const PARTICIPANT_FIELD_CATEGORY_LABELS: Record<ParticipantFieldCategory, string> = {
  identity: "Tożsamość",
  gaming: "Gra",
  ranking: "Rankingi i statystyki",
  team: "Drużyna",
  location: "Lokalizacja",
  contact: "Kontakt i profile",
  organization: "Organizacja",
  interests: "Zainteresowania",
  other: "Inne",
};

export const PARTICIPANT_FIELD_TYPE_LABELS: Record<ParticipantFieldType, string> = {
  short_text: "Krótki tekst",
  long_text: "Długi tekst",
  number: "Liczba",
  select: "Lista wyboru",
  multi_select: "Wielokrotny wybór",
  boolean: "Tak/Nie",
  date: "Data",
  color: "Kolor",
  url: "Adres URL",
};

function isValidDate(text: string): boolean {
  if (!DATE_PATTERN.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function isSafeUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Validates one value against its definition; returns the normalised value or a problem message. */
export function normaliseFieldValue(field: ParticipantFieldDefinition, raw: unknown): { ok: true; value: ParticipantFieldValue | null } | { ok: false; message: string } {
  if (raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) return { ok: true, value: null };
  switch (field.type) {
    case "short_text":
    case "long_text": {
      const limit = Math.min(field.maxLength ?? Infinity, field.type === "short_text" ? PARTICIPANT_FIELD_LIMITS.shortText : PARTICIPANT_FIELD_LIMITS.longText);
      const text = cleanText(raw, limit, field.type === "long_text");
      if (text == null) return { ok: false, message: `${field.label}: tekst do ${limit} znaków${field.type === "short_text" ? " w jednej linii" : ""}.` };
      return { ok: true, value: text || null };
    }
    case "number": {
      const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw.replace(",", ".")) : raw;
      if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > PARTICIPANT_FIELD_LIMITS.number) return { ok: false, message: `${field.label}: podaj liczbę.` };
      if (field.min != null && value < field.min) return { ok: false, message: `${field.label}: najmniej ${field.min}.` };
      if (field.max != null && value > field.max) return { ok: false, message: `${field.label}: najwięcej ${field.max}.` };
      return { ok: true, value };
    }
    case "select": {
      if (typeof raw !== "string" || !(field.options ?? []).includes(raw)) return { ok: false, message: `${field.label}: wybierz jedną z opcji.` };
      return { ok: true, value: raw };
    }
    case "multi_select": {
      const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[;|]/).map((item) => item.trim()).filter(Boolean) : null;
      if (!list || list.some((item) => typeof item !== "string" || !(field.options ?? []).includes(item))) return { ok: false, message: `${field.label}: wybierz opcje z listy.` };
      return { ok: true, value: [...new Set(list as string[])] };
    }
    case "boolean": {
      if (typeof raw === "boolean") return { ok: true, value: raw };
      if (typeof raw === "string") {
        const text = raw.trim().toLowerCase();
        if (["tak", "true", "1", "yes", "t"].includes(text)) return { ok: true, value: true };
        if (["nie", "false", "0", "no", "n"].includes(text)) return { ok: true, value: false };
      }
      return { ok: false, message: `${field.label}: Tak albo Nie.` };
    }
    case "date": {
      if (typeof raw !== "string" || !isValidDate(raw.trim())) return { ok: false, message: `${field.label}: data w formacie RRRR-MM-DD.` };
      return { ok: true, value: raw.trim() };
    }
    case "color": {
      const text = typeof raw === "string" ? raw.trim().toLowerCase() : "";
      if (!COLOR_PATTERN.test(text)) return { ok: false, message: `${field.label}: kolor w formacie #rrggbb.` };
      return { ok: true, value: text };
    }
    case "url": {
      const text = cleanText(raw, PARTICIPANT_FIELD_LIMITS.url);
      if (!text || !isSafeUrl(text)) return { ok: false, message: `${field.label}: adres zaczynający się od https:// lub http://.` };
      return { ok: true, value: text };
    }
  }
}

/** Parses and validates a whole definition set (from the API, a backup or an imported set). */
export function parseParticipantFieldSet(input: unknown): { ok: true; value: ParticipantFieldSet } | { ok: false; problems: ParticipantFieldProblem[] } {
  const problems: ParticipantFieldProblem[] = [];
  const push = (path: string, code: string, message: string) => problems.push({ path, code, message });
  const record = isRecord(input) ? input : null;
  const list = record ? record.fields : Array.isArray(input) ? input : null;
  if (record && record.version !== undefined && record.version !== 1) push("version", "UNSUPPORTED_VERSION", "Obsługiwana jest wersja 1.");
  if (!Array.isArray(list)) return { ok: false, problems: [{ path: "fields", code: "INVALID", message: "Pola muszą być listą." }] };
  if (list.length > PARTICIPANT_FIELD_LIMITS.fields) push("fields", "TOO_MANY", `Najwyżej ${PARTICIPANT_FIELD_LIMITS.fields} pól.`);
  const seen = new Set<string>();
  const fields: ParticipantFieldDefinition[] = [];
  list.slice(0, PARTICIPANT_FIELD_LIMITS.fields).forEach((raw, index) => {
    const path = `fields[${index}]`;
    if (!isRecord(raw)) { push(path, "INVALID", "Każde pole musi być obiektem."); return; }
    const allowed = new Set(["key", "label", "type", "category", "kind", "description", "required", "visibility", "options", "min", "max", "maxLength", "defaultValue", "libraryId", "askOnSignup"]);
    for (const extra of Object.keys(raw)) if (!allowed.has(extra)) push(`${path}.${extra}`, "UNKNOWN_PROPERTY", `Nieznana właściwość: ${extra.slice(0, 40)}.`);
    const key = typeof raw.key === "string" ? raw.key : "";
    if (!KEY_PATTERN.test(key) || key.length > PARTICIPANT_FIELD_LIMITS.keyLength) push(`${path}.key`, "INVALID_KEY", "Klucz: małe litery, cyfry i _, zaczyna się od litery, do 40 znaków.");
    else if (RESERVED_KEYS.has(key)) push(`${path}.key`, "RESERVED_KEY", `Klucz „${key}” jest zarezerwowany.`);
    else if (seen.has(key)) push(`${path}.key`, "DUPLICATE_KEY", `Klucz „${key}” występuje dwa razy.`);
    seen.add(key);
    const label = cleanText(raw.label, PARTICIPANT_FIELD_LIMITS.labelLength);
    if (!label) push(`${path}.label`, "INVALID_LABEL", `Nazwa pola: 1–${PARTICIPANT_FIELD_LIMITS.labelLength} znaków w jednej linii.`);
    const type = PARTICIPANT_FIELD_TYPES.includes(raw.type as ParticipantFieldType) ? raw.type as ParticipantFieldType : null;
    if (!type) push(`${path}.type`, "INVALID_TYPE", "Nieobsługiwany typ pola.");
    const category = raw.category === undefined ? "other" : PARTICIPANT_FIELD_CATEGORIES.includes(raw.category as ParticipantFieldCategory) ? raw.category as ParticipantFieldCategory : null;
    if (!category) push(`${path}.category`, "INVALID_CATEGORY", "Nieznana kategoria.");
    const kind = raw.kind === undefined ? "profile" : PARTICIPANT_FIELD_KINDS.includes(raw.kind as ParticipantFieldKind) ? raw.kind as ParticipantFieldKind : null;
    if (!kind) push(`${path}.kind`, "INVALID_KIND", "Rodzaj: profile albo entry.");
    // Private by default: a field is only public when the organiser says so.
    const visibility = raw.visibility === undefined ? "organizer" : PARTICIPANT_FIELD_VISIBILITY.includes(raw.visibility as ParticipantFieldVisibility) ? raw.visibility as ParticipantFieldVisibility : null;
    if (!visibility) push(`${path}.visibility`, "INVALID_VISIBILITY", "Widoczność: organizer, staff albo public.");
    if (raw.required !== undefined && typeof raw.required !== "boolean") push(`${path}.required`, "INVALID", "required: true albo false.");
    if (raw.askOnSignup !== undefined && typeof raw.askOnSignup !== "boolean") push(`${path}.askOnSignup`, "INVALID", "askOnSignup: true albo false.");
    let description: string | undefined;
    if (raw.description !== undefined && raw.description !== "") {
      const text = cleanText(raw.description, PARTICIPANT_FIELD_LIMITS.descriptionLength);
      if (text == null) push(`${path}.description`, "INVALID", `Opis do ${PARTICIPANT_FIELD_LIMITS.descriptionLength} znaków.`);
      else description = text;
    }
    let options: string[] | undefined;
    if (type === "select" || type === "multi_select") {
      if (!Array.isArray(raw.options) || raw.options.length === 0 || raw.options.length > PARTICIPANT_FIELD_LIMITS.options) {
        push(`${path}.options`, "INVALID_OPTIONS", `Lista wyboru potrzebuje 1–${PARTICIPANT_FIELD_LIMITS.options} opcji.`);
      } else {
        const cleaned = raw.options.map((option) => cleanText(option, PARTICIPANT_FIELD_LIMITS.optionLength));
        if (cleaned.some((option) => !option || /[;|]/.test(option))) push(`${path}.options`, "INVALID_OPTIONS", `Opcja: 1–${PARTICIPANT_FIELD_LIMITS.optionLength} znaków, bez ; i |.`);
        else if (new Set(cleaned).size !== cleaned.length) push(`${path}.options`, "DUPLICATE_OPTION", "Opcje nie mogą się powtarzać.");
        else options = cleaned as string[];
      }
    } else if (raw.options !== undefined) push(`${path}.options`, "UNEXPECTED", "Opcje mają tylko listy wyboru.");
    const numberOrUndefined = (name: "min" | "max" | "maxLength") => {
      const value = raw[name];
      if (value === undefined || value === null) return undefined;
      if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > PARTICIPANT_FIELD_LIMITS.number) { push(`${path}.${name}`, "INVALID", `${name}: liczba.`); return undefined; }
      return value;
    };
    const min = numberOrUndefined("min");
    const max = numberOrUndefined("max");
    const maxLength = numberOrUndefined("maxLength");
    if ((min !== undefined || max !== undefined) && type !== "number") push(`${path}.min`, "UNEXPECTED", "Zakres liczb mają tylko pola liczbowe.");
    if (min !== undefined && max !== undefined && min > max) push(`${path}.max`, "INVALID_RANGE", "Najmniejsza wartość jest większa od największej.");
    if (maxLength !== undefined && (type !== "short_text" && type !== "long_text" || !Number.isInteger(maxLength) || maxLength < 1)) push(`${path}.maxLength`, "INVALID", "Limit znaków mają tylko pola tekstowe (liczba całkowita ≥ 1).");
    let libraryId: string | undefined;
    if (raw.libraryId !== undefined) {
      if (typeof raw.libraryId !== "string" || !PARTICIPANT_FIELD_LIBRARY.some((entry) => entry.libraryId === raw.libraryId)) push(`${path}.libraryId`, "UNKNOWN_LIBRARY_FIELD", "Nieznane pole biblioteki.");
      else libraryId = raw.libraryId;
    }
    if (!type || !label || !category || !kind || !visibility) return;
    const definition: ParticipantFieldDefinition = {
      key, label, type, category, kind, required: raw.required === true, visibility,
      ...(description ? { description } : {}),
      ...(options ? { options } : {}),
      ...(min !== undefined ? { min } : {}),
      ...(max !== undefined ? { max } : {}),
      ...(maxLength !== undefined ? { maxLength } : {}),
      ...(libraryId ? { libraryId } : {}),
      ...(raw.askOnSignup === true ? { askOnSignup: true } : {}),
    };
    if (raw.defaultValue !== undefined && raw.defaultValue !== null) {
      const checked = normaliseFieldValue(definition, raw.defaultValue);
      if (!checked.ok) push(`${path}.defaultValue`, "INVALID_DEFAULT", `Wartość domyślna: ${checked.message}`);
      else if (checked.value !== null) definition.defaultValue = checked.value;
    }
    fields.push(definition);
  });
  if (problems.length) return { ok: false, problems };
  return { ok: true, value: { version: 1, fields } };
}

/** Reads stored definitions (null/invalid storage = no fields; never throws on old rows). */
export function participantFieldsFromStorage(stored: unknown): ParticipantFieldSet | null {
  if (stored == null) return null;
  const parsed = parseParticipantFieldSet(stored);
  return parsed.ok && parsed.value.fields.length > 0 ? parsed.value : null;
}

export type ParticipantFieldAudience = "organizer" | "staff" | "public";

export function fieldVisibleTo(field: ParticipantFieldDefinition, audience: ParticipantFieldAudience): boolean {
  if (audience === "organizer") return true;
  if (audience === "staff") return field.visibility !== "organizer";
  return field.visibility === "public";
}

/** Definitions an audience may see. */
export function visibleFieldSet(set: ParticipantFieldSet | null, audience: ParticipantFieldAudience): ParticipantFieldSet | null {
  if (!set) return null;
  const fields = set.fields.filter((field) => fieldVisibleTo(field, audience));
  return fields.length ? { version: 1, fields } : null;
}

/** Values an audience may see; unknown keys (from removed fields) are never returned. */
export function visibleFieldValues(set: ParticipantFieldSet | null, stored: unknown, audience: ParticipantFieldAudience): Record<string, ParticipantFieldValue> | null {
  if (!set || !isRecord(stored)) return null;
  const result: Record<string, ParticipantFieldValue> = {};
  for (const field of set.fields) {
    if (!fieldVisibleTo(field, audience) || !Object.prototype.hasOwnProperty.call(stored, field.key)) continue;
    const value = stored[field.key];
    if (value !== null && value !== undefined) result[field.key] = value as ParticipantFieldValue;
  }
  return Object.keys(result).length ? result : null;
}

/**
 * Validates submitted values. `partial` keeps stored values for keys not submitted; required fields
 * are enforced only where `enforceRequired` is set (new participants). Values for fields hidden from
 * the writer are kept as stored and cannot be changed by that writer.
 */
export function validateFieldValues(
  set: ParticipantFieldSet | null,
  submitted: unknown,
  options: { stored?: unknown; audience: ParticipantFieldAudience; enforceRequired: boolean; applyDefaults?: boolean },
): { ok: true; values: Record<string, ParticipantFieldValue> | null } | { ok: false; problems: ParticipantFieldProblem[] } {
  const problems: ParticipantFieldProblem[] = [];
  const input = submitted === undefined || submitted === null ? {} : submitted;
  if (!isRecord(input)) return { ok: false, problems: [{ path: "customFields", code: "INVALID", message: "Wartości pól muszą być obiektem." }] };
  const stored = isRecord(options.stored) ? options.stored : {};
  const fields = set?.fields ?? [];
  const known = new Map(fields.map((field) => [field.key, field]));
  for (const key of Object.keys(input)) {
    const field = known.get(key);
    if (!field) problems.push({ path: `customFields.${key.slice(0, 40)}`, code: "UNKNOWN_FIELD", message: `Turniej nie ma pola „${key.slice(0, 40)}”.` });
    else if (!fieldVisibleTo(field, options.audience)) problems.push({ path: `customFields.${key}`, code: "FIELD_NOT_WRITABLE", message: `Pole „${field.label}” może zmienić tylko organizator.` });
  }
  const values: Record<string, ParticipantFieldValue> = {};
  for (const field of fields) {
    const has = Object.prototype.hasOwnProperty.call(input, field.key) && fieldVisibleTo(field, options.audience);
    let value: ParticipantFieldValue | null = null;
    if (has) {
      const checked = normaliseFieldValue(field, input[field.key]);
      if (!checked.ok) { problems.push({ path: `customFields.${field.key}`, code: "INVALID_VALUE", message: checked.message }); continue; }
      value = checked.value;
    } else if (Object.prototype.hasOwnProperty.call(stored, field.key)) {
      value = stored[field.key] as ParticipantFieldValue;
    } else if (options.applyDefaults && field.defaultValue !== undefined) {
      value = field.defaultValue;
    }
    if (value === null || value === undefined) {
      if (options.enforceRequired && field.required) problems.push({ path: `customFields.${field.key}`, code: "REQUIRED", message: `Pole „${field.label}” jest wymagane.` });
      continue;
    }
    values[field.key] = value;
  }
  if (problems.length) return { ok: false, problems };
  return { ok: true, values: Object.keys(values).length ? values : null };
}

/**
 * Changes to definitions that would silently lose or reinterpret stored values are refused:
 * removing a field with values or changing its type needs `confirmDropValues`, and the response says
 * how many participants are affected.
 */
export function definitionChangeImpact(
  previous: ParticipantFieldSet | null,
  next: ParticipantFieldSet,
  storedValues: unknown[],
): { removedWithValues: Array<{ key: string; label: string; count: number }>; retypedWithValues: Array<{ key: string; label: string; count: number }>; invalidAfterChange: Array<{ key: string; label: string; count: number }> } {
  const nextByKey = new Map(next.fields.map((field) => [field.key, field]));
  const removedWithValues: Array<{ key: string; label: string; count: number }> = [];
  const retypedWithValues: Array<{ key: string; label: string; count: number }> = [];
  const invalidAfterChange: Array<{ key: string; label: string; count: number }> = [];
  const countWith = (key: string) => storedValues.filter((values) => isRecord(values) && values[key] !== undefined && values[key] !== null).length;
  for (const field of previous?.fields ?? []) {
    const count = countWith(field.key);
    if (!count) continue;
    const successor = nextByKey.get(field.key);
    if (!successor) { removedWithValues.push({ key: field.key, label: field.label, count }); continue; }
    if (successor.type !== field.type) { retypedWithValues.push({ key: field.key, label: field.label, count }); continue; }
    const invalid = storedValues.filter((values) => isRecord(values) && values[field.key] != null && !normaliseFieldValue(successor, values[field.key]).ok).length;
    if (invalid) invalidAfterChange.push({ key: field.key, label: successor.label, count: invalid });
  }
  return { removedWithValues, retypedWithValues, invalidAfterChange };
}

/** Removes values of keys that are not (or no longer validly) defined — used only after explicit confirmation. */
export function pruneValues(set: ParticipantFieldSet | null, stored: unknown): Record<string, ParticipantFieldValue> | null {
  if (!set || !isRecord(stored)) return null;
  const values: Record<string, ParticipantFieldValue> = {};
  for (const field of set.fields) {
    const raw = stored[field.key];
    if (raw === undefined || raw === null) continue;
    const checked = normaliseFieldValue(field, raw);
    if (checked.ok && checked.value !== null) values[field.key] = checked.value;
  }
  return Object.keys(values).length ? values : null;
}

/** CSV: maps a header cell to a field by key or label (case/diacritics-insensitive). */
export function fieldForCsvHeader(set: ParticipantFieldSet | null, header: string): ParticipantFieldDefinition | null {
  if (!set) return null;
  const normalise = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const wanted = normalise(header);
  if (!wanted) return null;
  return set.fields.find((field) => field.key === wanted || normalise(field.label) === wanted) ?? null;
}
