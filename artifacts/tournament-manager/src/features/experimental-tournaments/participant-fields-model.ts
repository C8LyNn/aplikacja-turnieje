import { t } from "@/i18n";
/**
 * V5.4-005 · participant fields on the client: types mirrored from the API, key generation,
 * value formatting and locally saved field sets. The server validates everything again.
 */
import type { ParticipantFieldDefinition } from "@workspace/api-client-react";

/** #329: `askOnSignup` — the question appears on the public sign-up form (server-validated like the rest). */
export type FieldDef = ParticipantFieldDefinition & { askOnSignup?: boolean };
export type FieldValue = string | number | boolean | string[];
export type FieldValues = Record<string, FieldValue>;

export const VISIBILITY_LABELS: Record<FieldDef["visibility"], string> = {
  get organizer() { return t("participantFieldsModel.tylko_organizator"); },
  get staff() { return t("participantFieldsModel.organizator_i_pomocnicy"); },
  get public() { return t("participantFieldsModel.wszyscy_takze_widzowie"); },
};

export const VISIBILITY_SHORT: Record<FieldDef["visibility"], string> = {
  get organizer() { return t("participantFieldsModel.prywatne"); },
  get staff() { return t("participantFieldsModel.obsluga"); },
  get public() { return t("participantFieldsModel.publiczne"); },
};

export const KIND_LABELS: Record<FieldDef["kind"], string> = {
  profile: "o uczestniku",
  get entry() { return t("participantFieldsModel.o_zgloszeniu"); },
};

const RESERVED = new Set([
  "id", "name", "seed", "status", "rank", "country", "team_name", "teamname", "tournament_id", "tournamentid",
  "token", "password", "secret", "session", "role", "admin", "organizer", "organizer_token", "permissions",
  "created_at", "createdat", "custom_fields", "customfields", "prototype", "constructor",
]);

/** A stable slug for a new custom field ("Ulubione zwierzę" → "ulubione_zwierze"), unique in the set. */
export function keyForLabel(label: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  let base = label
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
  if (!/^[a-z]/.test(base)) base = `pole_${base}` /* i18n-ignore */.replace(/_+$/, "");
  if (base === "pole" || !base) base = "pole"; // i18n-ignore: a field key, not text
  let key = base;
  let index = 2;
  while (used.has(key) || RESERVED.has(key)) key = `${base}_${index++}`.slice(0, 40);
  return key;
}

export function formatFieldValue(field: FieldDef, value: FieldValue | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "boolean") return value === true ? t("participantFieldsModel.tak") : t("participantFieldsModel.nie");
  if (Array.isArray(value)) return value.join(", ");
  if (field.type === "date" && typeof value === "string") {
    const [y, m, d] = value.split("-").map(Number);
    if (y && m && d) return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("pl-PL", { timeZone: "UTC" });
  }
  return String(value);
}

/** Values entered in a form (strings from inputs) to what the API expects; empty strings clear. */
export function formValuesToPayload(fields: readonly FieldDef[], form: Record<string, unknown>): FieldValues {
  const payload: FieldValues = {};
  for (const field of fields) {
    if (!(field.key in form)) continue;
    const raw = form[field.key];
    if (raw === undefined) continue;
    if (field.type === "number" && typeof raw === "string") {
      if (raw.trim() === "") payload[field.key] = "";
      else payload[field.key] = Number(raw.replace(",", "."));
      continue;
    }
    payload[field.key] = raw as FieldValue;
  }
  return payload;
}

/** Client-side check before sending (server re-validates): required fields and basic types. */
export function missingRequired(fields: readonly FieldDef[], form: Record<string, unknown>): FieldDef[] {
  return fields.filter((field) => {
    if (!field.required) return false;
    const value = form[field.key] ?? field.defaultValue;
    return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  });
}

// ── locally saved field sets (per browser; organisers have no account) ──────────────────────────

export interface SavedFieldSet {
  name: string;
  savedAt: string;
  fields: FieldDef[];
}

const SETS_KEY = "tm_participant_field_sets_v1";

export function readSavedSets(storage: Pick<Storage, "getItem"> | null): SavedFieldSet[] {
  try {
    const raw = storage?.getItem(SETS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.name === "string" && Array.isArray(item.fields)).slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

export function writeSavedSet(storage: Pick<Storage, "getItem" | "setItem"> | null, set: SavedFieldSet): SavedFieldSet[] {
  const next = [set, ...readSavedSets(storage).filter((item) => item.name !== set.name)].slice(0, 20);
  try {
    storage?.setItem(SETS_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: the set simply is not remembered */
  }
  return next;
}

export function deleteSavedSet(storage: Pick<Storage, "getItem" | "setItem"> | null, name: string): SavedFieldSet[] {
  const next = readSavedSets(storage).filter((item) => item.name !== name);
  try {
    storage?.setItem(SETS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

/** Accepts an exported set file ({ version: 1, fields } or a plain list); the server validates on save. */
export function parseFieldSetFile(text: string): FieldDef[] | null {
  try {
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.fields) ? parsed.fields : null;
    if (!list || list.length > 40) return null;
    return list.filter((item: unknown) => typeof item === "object" && item !== null && typeof (item as FieldDef).key === "string" && typeof (item as FieldDef).label === "string") as FieldDef[];
  } catch {
    return null;
  }
}
