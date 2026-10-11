import type { EffectInstance, LayerTimeline } from "../core/types";

export const DEFAULT_LAYER_TIMELINE: LayerTimeline = {
  mode: "off",
  delayMs: 0,
  durationMs: 8000,
  fadeInMs: 500,
  fadeOutMs: 500,
};

const clamp = (value: unknown, fallback: number, min: number, max: number): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.round(Math.max(min, Math.min(max, numeric))) : fallback;
};

/** Accept only bounded numbers and supported modes, including from imported scenes. */
export function normalizeLayerTimeline(value: unknown): LayerTimeline {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const durationMs = clamp(source.durationMs, DEFAULT_LAYER_TIMELINE.durationMs, 250, 120000);
  const fadeInMs = clamp(source.fadeInMs, DEFAULT_LAYER_TIMELINE.fadeInMs, 0, durationMs);
  return {
    mode: source.mode === "once" || source.mode === "loop" ? source.mode : "off",
    delayMs: clamp(source.delayMs, DEFAULT_LAYER_TIMELINE.delayMs, 0, 60000),
    durationMs,
    fadeInMs,
    fadeOutMs: clamp(source.fadeOutMs, DEFAULT_LAYER_TIMELINE.fadeOutMs, 0, durationMs - fadeInMs),
  };
}

function animationName(instance: EffectInstance): string {
  // IDs may come from imported JSON; never embed arbitrary strings in a stylesheet.
  const id = instance.instanceId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return "ae-timeline-" + (id || "layer");
}

export interface LayerTimelineAnimation {
  css: string;
  animation: string;
}

export function getLayerTimelineAnimation(instance: EffectInstance): LayerTimelineAnimation | null {
  const time = normalizeLayerTimeline(instance.timeline);
  if (!instance.timeline || time.mode === "off") return null;

  const total = time.delayMs + time.durationMs;
  const start = time.delayMs;
  const end = total;
  const fadeInEnd = start + time.fadeInMs;
  const fadeOutStart = end - time.fadeOutMs;
  const frames: Array<{ ms: number; opacity: number }> = [];

  const frame = (ms: number, opacity: number): void => {
    frames.push({ ms, opacity });
  };

  if (start > 0) frame(0, 0);
  if (time.fadeInMs > 0) {
    frame(start, 0);
    frame(fadeInEnd, 1);
  } else {
    if (start > 0) frame(start - Math.min(start, 1), 0);
    frame(start, 1);
  }
  if (time.fadeOutMs > 0) {
    frame(fadeOutStart, 1);
    frame(end, 0);
  } else {
    frame(end - Math.min(time.durationMs, 1), 1);
    frame(end, 0);
  }

  const unique = new Map<number, number>();
  for (const item of frames) unique.set(item.ms, item.opacity);
  const keyframes = [...unique]
    .sort(([a], [b]) => a - b)
    .map(([ms, opacity]) => {
      const percent = Number((ms / total * 100).toFixed(6));
      return `${percent}% { opacity: ${opacity}; }`;
    })
    .join("\n  ");
  const name = animationName(instance);
  return {
    css: `@keyframes ${name} {\n  ${keyframes}\n}`,
    animation: `${name} ${total}ms linear 0ms ${time.mode === "loop" ? "infinite" : "1"} normal both`,
  };
}
