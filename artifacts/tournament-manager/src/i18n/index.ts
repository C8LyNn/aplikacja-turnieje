/**
 * #323-E · one translation system for the whole app (PL default, EN complete).
 *
 * - `t(key, vars)` reads the current language from a small store; catalogs are typed, so the English catalog must have
 *   every Polish key (a missing key is a type error, and at runtime falls back to Polish, then to the key).
 * - `tp(key, count, vars)` picks the plural form with Intl.PluralRules (Polish one/few/many/other, English one/other).
 * - Dates, times and numbers use Intl with the current language.
 * - The choice is stored per browser (localStorage "tm_lang"); nothing on the server changes, other people keep theirs.
 * - User content (names, the organizer's own questions, notes) is never passed through `t`.
 */
import { pl, type CatalogKey } from "./catalog/pl";
import { en } from "./catalog/en";

export type Lang = "pl" | "en";
export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "pl", label: "PL", name: "Polski" },
  { id: "en", label: "EN", name: "English" },
];
const STORAGE_KEY = "tm_lang";

function initialLang(): Lang {
  try {
    const fromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lang") : null;
    if (fromUrl === "pl" || fromUrl === "en") return fromUrl;
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "pl" || stored === "en") return stored;
  } catch {
    // storage blocked: the default stays
  }
  return "pl";
}

let current: Lang = initialLang();
const listeners = new Set<() => void>();

export function getLang(): Lang { return current; }
export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* the choice lasts for this tab only */ }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  for (const listener of listeners) listener();
}
export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
/** Tests only: start from a known language. */
export function resetLangForTests(lang: Lang = "pl"): void { current = lang; }

export type PluralForms = { one: string; few?: string; many?: string; other: string };
type Entry = string | PluralForms;
const catalogs: Record<Lang, Record<string, Entry>> = { pl: pl as Record<string, Entry>, en: en as Record<string, Entry> };

function interpolate(text: string, vars?: Record<string, unknown>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name] ?? "") : match));
}

function lookup(key: string): Entry | undefined {
  return catalogs[current][key] ?? catalogs.pl[key];
}

/** The text for `key` in the current language, with {name} placeholders filled. Unknown key → the key itself. */
export function t(key: CatalogKey, vars?: Record<string, unknown>): string {
  const entry = lookup(key);
  if (entry == null) return key;
  if (typeof entry !== "string") return interpolate(entry.other, vars);
  return interpolate(entry, vars);
}

const pluralRules: Partial<Record<Lang, Intl.PluralRules>> = {};
/** Plural-aware text: the form for `count` (also available as {count}). */
export function tp(key: CatalogKey, count: number, vars?: Record<string, unknown>): string {
  const entry = lookup(key);
  if (entry == null) return key;
  const all = { count: formatNumber(count), ...vars };
  if (typeof entry === "string") return interpolate(entry, all);
  const rules = (pluralRules[current] ??= new Intl.PluralRules(current));
  const form = rules.select(count) as keyof PluralForms;
  return interpolate(entry[form] ?? entry.other, all);
}

/** True when the key exists (used to prefer a localized message for an API error code). */
export function hasKey(key: string): key is CatalogKey { return key in catalogs.pl; }

// ── formatting ──────────────────────────────────────────────────────────────

export const localeOf = (lang: Lang = current) => (lang === "pl" ? "pl-PL" : "en-GB");
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(localeOf(), options).format(value);
}
export function formatDate(value: Date | string | number, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(localeOf(), options).format(date);
}
export function formatTime(value: Date | string | number, options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }): string {
  return formatDate(value, options);
}
export function formatDateTime(value: Date | string | number): string {
  return formatDate(value, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * A readable message for an API refusal: the localized text for its `code` when there is one, otherwise the server's
 * own message (Polish), otherwise the fallback. The app's logic never depends on the text.
 */
export function apiErrorText(error: unknown, fallback: string): string {
  const data = (error as { data?: { code?: unknown; error?: unknown } } | null)?.data;
  const code = typeof data?.code === "string" ? data.code : null;
  if (code && hasKey(`errors.${code}`)) return t(`errors.${code}` as CatalogKey);
  if (current === "pl" && typeof data?.error === "string") return data.error;
  return typeof data?.error === "string" && current === "en" && !/[ąćęłńóśźż]/i.test(data.error) ? data.error : fallback;
}
