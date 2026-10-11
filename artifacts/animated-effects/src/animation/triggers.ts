import type { EffectInstance, EffectTrigger, EffectTriggerEvent } from "../core/types";
import { normalizedMotionTimeline } from "./motion";

export const STREAM_EVENTS: ReadonlyArray<{ value: EffectTriggerEvent; label: string }> = [
  { value: "follower-latest", label: "Nowy obserwujący" },
  { value: "subscriber-latest", label: "Nowa subskrypcja" },
  { value: "tip-latest", label: "Donacja (tip)" },
  { value: "cheer-latest", label: "Cheer / bits" },
  { value: "raid-latest", label: "Raid" },
  { value: "message", label: "Wiadomość na czacie" },
];

const EVENT_NAMES = new Set<string>(STREAM_EVENTS.map((item) => item.value));
const limit = (value: unknown, defaultValue: number, max: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed)
    ? Math.max(0, Math.min(max, Math.round(parsed)))
    : defaultValue;
};

/** Preserve old scenes: no trigger means a permanently visible layer. */
export function normalizeEffectTrigger(value: unknown): EffectTrigger | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (raw.source !== "event") return undefined;
  return {
    source: "event",
    event: EVENT_NAMES.has(String(raw.event)) ? raw.event as EffectTriggerEvent : "follower-latest",
    cooldownMs: limit(raw.cooldownMs, 3000, 60000),
    minAmount: limit(raw.minAmount, 0, 1000000),
  };
}

export function isTriggeredEffect(effect: EffectInstance): boolean {
  return normalizeEffectTrigger(effect.trigger)?.source === "event";
}

/** Every incoming event starts exactly one pass, independent of saved loop mode. */
export function eventPlaybackInstance(effect: EffectInstance): EffectInstance {
  if (!isTriggeredEffect(effect)) return effect;
  return {
    ...effect,
    timeline: {
      ...normalizedMotionTimeline(effect.timeline, effect.settings),
      mode: "once",
    },
  };
}

export function triggerPlaybackDurationMs(effect: EffectInstance): number {
  const timeline = normalizedMotionTimeline(effect.timeline, effect.settings);
  return Math.min(180000, timeline.delayMs + timeline.durationMs + 100);
}

/** Shared reference predicate for tests/editor simulations.
 * Event payloads are matched against a fixed allowlist only.
 */
export function matchesEffectTrigger(
  trigger: EffectTrigger | undefined,
  listener: string,
  eventData: unknown,
  elapsedSinceLastMs: number,
): boolean {
  const rule = normalizeEffectTrigger(trigger);
  if (!rule || listener !== rule.event) return false;
  if (elapsedSinceLastMs < rule.cooldownMs) return false;
  if (rule.minAmount > 0 && (listener === "tip-latest" || listener === "cheer-latest" || listener === "raid-latest")) {
    if (!eventData || typeof eventData !== "object") return false;
    const amount = Number((eventData as Record<string, unknown>).amount);
    if (!Number.isFinite(amount) || amount < rule.minAmount) return false;
  }
  return true;
}
