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

// ── API refusals ──────────────────────────────────────────────────────────────
// The server answers in Polish ({ error, code }). The catalog holds every static and templated message it can send
// (errors.<CODE>[.n], scripts/i18n-api-errors.mjs); a message is matched exactly or by its template, so values such as
// a field name or a stage name are carried over unchanged. Logic never depends on the text.
type ErrorPattern = { key: CatalogKey; re: RegExp; names: string[] };
let errorPatterns: ErrorPattern[] | null = null;
function patterns(): ErrorPattern[] {
  if (errorPatterns) return errorPatterns;
  errorPatterns = Object.entries(catalogs.pl)
    .filter(([key, value]) => (key.startsWith("errors.") || key.startsWith("server.")) && typeof value === "string")
    // a template made only of placeholders ("{v0} {v1}") would match anything
    .filter(([, value]) => (value as string).replace(/\{\w+\}/g, "").replace(/[^\p{L}]/gu, "").length >= 3)
    .map(([key, value]) => {
      const names: string[] = [];
      const source = (value as string).split(/(\{\w+\})/).map((part) => {
        const m = /^\{(\w+)\}$/.exec(part);
        if (m) { names.push(m[1]!); return "([\\s\\S]+?)"; }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }).join("");
      return { key: key as CatalogKey, re: new RegExp(`^${source}$`), names };
    })
    // the most specific (longest literal) template first
    .sort((a, b) => b.re.source.length - a.re.source.length);
  return errorPatterns;
}
const POLISH_TEXT = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(nie|jest|oraz|lub|turniej|etap|mecz|wynik|brak)\b/i;
const wordsOf = (text: string) => text.toLowerCase().match(/[a-ząćęłńóśźż]{3,}/g) ?? [];
let polishOnlyWords: Set<string> | null = null;
/** Polish letters, or a word that the Polish catalog uses and the English one never does ("nieznany", "serwera"). */
function looksPolish(text: string): boolean {
  if (POLISH_TEXT.test(text)) return true;
  if (!polishOnlyWords) {
    const entryText = (entry: Entry | undefined) => (typeof entry === "string" ? entry : entry ? Object.values(entry).join(" ") : "");
    const english = new Set(Object.values(catalogs.en).flatMap((entry) => wordsOf(entryText(entry))));
    polishOnlyWords = new Set(Object.values(catalogs.pl).flatMap((entry) => wordsOf(entryText(entry))).filter((word) => !english.has(word)));
  }
  return wordsOf(text).some((word) => polishOnlyWords!.has(word));
}

/**
 * A server message in the current language: Polish as sent; English from the catalog (exact text, template, or the
 * code's only message). An unknown Polish message gives `undefined`, so the caller's own localized fallback is shown.
 */
export function localizeServerMessage(message: unknown, code?: unknown): string | undefined {
  if (typeof message !== "string" || !message.trim()) return undefined;
  if (current === "pl") return message;
  const text = message.trim();
  for (const { key, re, names } of patterns()) {
    const m = re.exec(text);
    if (m) return t(key, Object.fromEntries(names.map((name, i) => [name, m[i + 1] ?? ""])));
  }
  if (typeof code === "string" && hasKey(`errors.${code}`)) return t(`errors.${code}` as CatalogKey);
  return looksPolish(text) ? undefined : text;
}

/** The localized message of a refusal body ({ error | message, code }) — for code that reads `fetch` responses itself. */
export function serverError(body: unknown): string | undefined {
  const data = body as { error?: unknown; message?: unknown; code?: unknown } | null | undefined;
  return localizeServerMessage(data?.error ?? data?.message, data?.code);
}

/** The same for a generated-client body, used once for every ApiError (see main.tsx). */
export function localizeErrorData(data: unknown): unknown {
  if (!data || typeof data !== "object" || current === "pl") return data;
  const body = data as Record<string, unknown>;
  const localized = serverError(body);
  // field problems ({ message, code }) the same way; an unknown one keeps its code rather than Polish text
  const problems = Array.isArray(body.problems)
    ? body.problems.map((problem) => {
      if (!problem || typeof problem !== "object") return problem;
      const item = problem as Record<string, unknown>;
      const text = localizeServerMessage(item.message, item.code);
      return { ...item, message: text ?? (typeof item.code === "string" ? item.code : item.message) };
    })
    : body.problems;
  return { ...body, error: localized, message: typeof body.message === "string" ? localized : body.message, problems };
}

/**
 * Texts the server builds for the creator (preset names, descriptions, requirements, recommendation reasons, default
 * stage names, AI-import notes) in the current language: every string in `value` that is a known server text or
 * template is replaced; anything else (ids, numbers, user content) is kept. Polish returns `value` unchanged. Applied
 * to preset responses, so a preview's `creation` carries English stage names when the organizer works in English.
 */
export function localizeServerTexts<T>(value: T): T {
  if (current === "pl") return value;
  const visit = (node: unknown): unknown => {
    if (typeof node === "string") return localizeKnownText(node);
    if (Array.isArray(node)) return node.map(visit);
    if (node && typeof node === "object") return Object.fromEntries(Object.entries(node as Record<string, unknown>).map(([k, v]) => [k, visit(v)]));
    return node;
  };
  return visit(value) as T;
}
/** One text from the server or a shared library (match-rule presets, set problems) in the current language. */
export function serverText(text: string): string {
  return current === "pl" ? text : localizeKnownText(text);
}
function localizeKnownText(text: string, depth = 0): string {
  const trimmed = text.trim();
  if (!trimmed || depth > 3 || !/\p{L}/u.test(trimmed)) return text;
  for (const { key, re, names } of patterns()) {
    const m = re.exec(trimmed);
    // captured parts may be server texts too ("{v0} · 4 uczestników" around "Drabinka pucharowa") or a default stage
    // name ("Etap 1"); anything else captured (a typed name) stays as it is
    if (m) return t(key, Object.fromEntries(names.map((name, i) => [name, stageLabel(localizeKnownText(m[i + 1] ?? "", depth + 1))])));
  }
  return stageLabel(text);
}

/**
 * A stage name for display. The server names a tournament's first stage "Etap 1" (and the editor uses "Etap N"
 * defaults); only that exact generated default is shown in the viewer's language — a name someone typed is shown as is.
 */
export function stageLabel(name: string): string;
export function stageLabel(name: string | null | undefined): string | null | undefined;
export function stageLabel(name: string | null | undefined): string | null | undefined {
  if (typeof name !== "string") return name;
  const m = /^Etap (\d+)$/.exec(name.trim());
  return m ? t("i18n.stage.default", { n: m[1]! }) : name;
}

/** A readable message for an API refusal: the localized server message, otherwise the fallback. */
export function apiErrorText(error: unknown, fallback: string): string {
  const data = (error as { data?: unknown } | null)?.data;
  return serverError(data) ?? fallback;
}
