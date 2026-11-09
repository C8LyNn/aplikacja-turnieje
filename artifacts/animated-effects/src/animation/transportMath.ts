import type { EffectInstance } from "../core/types";
import { normalizeLayerTimeline } from "./timeline";

/** At least ten seconds of preview, with enough room for all active timed layers. */
export function sceneDurationMs(effects: readonly EffectInstance[]): number {
  const longest = effects
    .filter((effect) => effect.enabled)
    .reduce((value, effect) => {
      const time = normalizeLayerTimeline(effect.timeline);
      return time.mode === "off" ? value : Math.max(value, time.delayMs + time.durationMs);
    }, 0);
  return Math.max(10000, Math.min(180000, longest));
}

export function clampTimeMs(value: number, durationMs: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(durationMs) || durationMs <= 0) return 0;
  return Math.max(0, Math.min(Math.round(durationMs), Math.round(value)));
}

/** Convert a pointer's client X into snapped milliseconds without accessing browser globals. */
export function timeFromPosition(
  clientX: number,
  left: number,
  width: number,
  durationMs: number,
  stepMs = 100,
): number {
  if (![clientX, left, width, durationMs].every(Number.isFinite) || width <= 0 || durationMs <= 0) return 0;
  const time = (Math.max(0, Math.min(1, (clientX - left) / width))) * durationMs;
  const step = Math.max(1, Math.round(stepMs));
  return clampTimeMs(Math.round(time / step) * step, durationMs);
}
