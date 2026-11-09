import type { EffectTriggerEvent } from "../core/types";
import { STREAM_EVENTS } from "./triggers";
import type { StressEvent, StressSummary, StressScenario } from "./alertStress";

export interface AlertTrace {
  version: 1;
  source: StressScenario | "custom";
  durationMs: number;
  events: StressEvent[];
}
export interface TraceResult {
  traceKey: string;
  result: StressSummary;
}
export interface TraceComparison {
  comparable: boolean;
  reasons: string[];
  measures: Array<{ label: string; first: number | null; second: number | null; delta: number | null; unit: string }>;
}

const EVENT_NAMES = new Set<string>(STREAM_EVENTS.map((event) => event.value));
const SOURCES = new Set(["steady", "burst", "chat-flood", "custom"]);
export const MAX_TRACE_EVENTS = 900;
export const MAX_TRACE_BYTES = 100000;
const MAX_DURATION_MS = 60000;

/** The trace records only synthetic traffic shape: no accounts, message text,
 * URLs or user identifiers. Never serialize raw StreamElements payloads. */
export function parseAlertTrace(input: unknown): AlertTrace {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Niepoprawny format pliku.");
  const source = input as Record<string, unknown>;
  if (source.version !== 1) throw new Error("Nieobsługiwana wersja śladu.");
  if (!SOURCES.has(String(source.source))) throw new Error("Nieznany typ scenariusza.");
  const durationMs = source.durationMs;
  if (typeof durationMs !== "number" || !Number.isInteger(durationMs) || durationMs < 1000 || durationMs > MAX_DURATION_MS) {
    throw new Error("Czas śladu musi wynosić od 1 do 60 sekund.");
  }
  if (!Array.isArray(source.events) || source.events.length > MAX_TRACE_EVENTS) {
    throw new Error("Nieprawidłowa liczba zdarzeń (maks. 900).");
  }
  const result: StressEvent[] = [];
  let lastTime = -1;
  for (const unknownItem of source.events) {
    if (!unknownItem || typeof unknownItem !== "object" || Array.isArray(unknownItem)) {
      throw new Error("Nieprawidłowe zdarzenie w śladzie.");
    }
    const item = unknownItem as Record<string, unknown>;
    if (!EVENT_NAMES.has(String(item.listener))) throw new Error("Ślad zawiera nieobsługiwany typ zdarzenia.");
    if (typeof item.atMs !== "number" || !Number.isInteger(item.atMs) || item.atMs < 0 || item.atMs >= durationMs || item.atMs < lastTime) {
      throw new Error("Czasy zdarzeń muszą być posortowane i mieścić się w czasie testu.");
    }
    if (typeof item.amount !== "number" || !Number.isFinite(item.amount) || item.amount < 0 || item.amount > 1000000) {
      throw new Error("Kwota testowa poza dozwolonym zakresem.");
    }
    lastTime = item.atMs;
    result.push({ atMs: item.atMs, listener: item.listener as EffectTriggerEvent, amount: item.amount });
  }
  return { version: 1, source: source.source as AlertTrace["source"], durationMs, events: result };
}

export function serializeAlertTrace(trace: AlertTrace): string {
  return JSON.stringify(parseAlertTrace(trace), null, 2);
}

export function parseAlertTraceJson(raw: string): AlertTrace {
  if (typeof raw !== "string" || raw.length > MAX_TRACE_BYTES) throw new Error("Plik śladu przekracza limit 100 KB.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; }
  catch { throw new Error("Plik nie jest poprawnym JSON."); }
  return parseAlertTrace(parsed);
}

/** Stable across imported/exported files and ignores irrelevant JSON fields. */
export function alertTraceKey(trace: AlertTrace): string {
  const safe = parseAlertTrace(trace);
  return JSON.stringify([safe.durationMs, safe.events.map((x) => [x.atMs, x.listener, x.amount])]);
}

/** A/B comparisons are permitted ONLY when both runs used the same synthetic
 * event schedule and completed. FPS and rAF remain environment-dependent. */
export function compareTraceResults(a: TraceResult, b: TraceResult): TraceComparison {
  const comparable = a.traceKey === b.traceKey;
  const reasons = comparable ? ["Ten sam harmonogram i dane syntetyczne. Różnice w rAF mogą wynikać też z obciążenia przeglądarki."] :
    ["Nie można bezpośrednio porównać różnych harmonogramów. Odtwórz identyczny ślad w obu próbach."];
  const pair = (label: string, first: number | null, second: number | null, unit = "") => ({
    label, first, second, delta: comparable && first !== null && second !== null
      ? Math.round((second - first) * 100) / 100 : null, unit,
  });
  return {
    comparable,
    reasons,
    measures: [
      pair("Przetworzone zdarzenia", a.result.dispatched, b.result.dispatched),
      pair("Odrzucone", a.result.dropped, b.result.dropped),
      pair("Wyparte", a.result.evicted, b.result.evicted),
      pair("Maks. kolejka", a.result.waitingPeak, b.result.waitingPeak),
      pair("Szacowane FPS (rAF)", a.result.frame.approximateFps, b.result.frame.approximateFps, "FPS"),
      pair("p95 odstępu rAF", a.result.frame.p95FrameMs, b.result.frame.p95FrameMs, "ms"),
      pair("Odstępy >33 ms", a.result.frame.slowFramesPercent, b.result.frame.slowFramesPercent, "%"),
    ],
  };
}
