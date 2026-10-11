import type { EffectInstance, EffectSettings, LayerKeyframe, LayerTimeline } from "../core/types";
import { normalizeLayerTimeline } from "./timeline";

export const MAX_KEYFRAMES = 16;
export const MOTION_FIELDS = ["x", "y", "scale", "rotation", "opacity"] as const;
export type MotionField = typeof MOTION_FIELDS[number];

const LIMITS: Record<MotionField, [number, number]> = {
  x: [-300, 300],
  y: [-300, 300],
  scale: [10, 400],
  rotation: [-1080, 1080],
  opacity: [0, 100],
};

function bounded(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function keyframeValues(raw: Record<string, unknown>, base: EffectSettings): Omit<LayerKeyframe, "timeMs"> {
  return {
    x: bounded(raw.x, base.x, ...LIMITS.x),
    y: bounded(raw.y, base.y, ...LIMITS.y),
    scale: bounded(raw.scale, base.scale, ...LIMITS.scale),
    rotation: bounded(raw.rotation, base.rotation, ...LIMITS.rotation),
    opacity: bounded(raw.opacity, 100, ...LIMITS.opacity),
  };
}

/** Keyframes are complete poses, relative to the start of the active portion of a cycle.
 * Opacity in the pose is a 0-100% multiplier of the layer's base opacity.
 */
export function normalizeLayerKeyframes(raw: unknown, durationMs: number, base: EffectSettings): LayerKeyframe[] {
  if (!Array.isArray(raw)) return [];
  const byTime = new Map<number, LayerKeyframe>();
  for (const entry of raw.slice(0, 256)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.timeMs !== "number" || !Number.isFinite(item.timeMs)) continue;
    const timeMs = Math.round(bounded(item.timeMs, 0, 0, durationMs));
    byTime.set(timeMs, { timeMs, ...keyframeValues(item, base) });
  }
  return [...byTime.values()].sort((a, b) => a.timeMs - b.timeMs).slice(0, MAX_KEYFRAMES);
}

export function normalizedMotionTimeline(value: unknown, base: EffectSettings): LayerTimeline {
  const time = normalizeLayerTimeline(value);
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return {
    ...time,
    easing: raw.easing === "ease-in-out" ? "ease-in-out" : "linear",
    keyframes: normalizeLayerKeyframes(raw.keyframes, time.durationMs, base),
  };
}

/** Add or replace a full pose at the chosen moment, preserving stable order. */
export function upsertKeyframe(timeline: LayerTimeline, timeMs: number, pose: Omit<LayerKeyframe, "timeMs">, base: EffectSettings): LayerKeyframe[] {
  const frames = normalizeLayerKeyframes(timeline.keyframes, timeline.durationMs, base);
  const next = { timeMs: Math.round(bounded(timeMs, 0, 0, timeline.durationMs)), ...keyframeValues(pose, base) };
  const existing = frames.findIndex((frame) => frame.timeMs === next.timeMs);
  if (existing >= 0) frames[existing] = next;
  else if (frames.length < MAX_KEYFRAMES) frames.push(next);
  return frames.sort((a, b) => a.timeMs - b.timeMs);
}

function cssTransform(pose: Omit<LayerKeyframe, "timeMs">): string {
  return `translate(${pose.x}%, ${pose.y}%) scale(${pose.scale / 100}) rotate(${pose.rotation}deg)`;
}

export interface MotionAnimation {
  css: string;
  animation: string;
}

/** The separate motion wrapper does not override child particle animations. */
export function getLayerMotionAnimation(instance: EffectInstance): MotionAnimation | null {
  const time = normalizedMotionTimeline(instance.timeline, instance.settings);
  const frames = time.keyframes ?? [];
  if (time.mode === "off" || frames.length === 0) return null;
  const total = time.delayMs + time.durationMs;
  const startPose = keyframeValues({}, instance.settings);
  const sorted = [...frames];
  if (sorted[0]?.timeMs !== 0) sorted.unshift({ timeMs: 0, ...startPose });
  if (sorted.at(-1)?.timeMs !== time.durationMs) {
    const last = sorted.at(-1) ?? { timeMs: 0, ...startPose };
    sorted.push({ ...last, timeMs: time.durationMs });
  }
  const points = new Map<number, Omit<LayerKeyframe, "timeMs">>();
  if (time.delayMs > 0) points.set(0, sorted[0]!);
  for (const keyframe of sorted) {
    points.set(time.delayMs + keyframe.timeMs, keyframe);
  }
  const selectors = [...points.entries()].sort(([a], [b]) => a - b)
    .map(([at, frame]) => {
      const percent = Number((at / total * 100).toFixed(6));
      return `${percent}% { transform: ${cssTransform(frame)}; opacity: ${frame.opacity / 100}; }`;
    }).join("\n  ");
  // Produce a stable CSS identifier without exposing raw imported IDs in CSS.
  let hash = 2166136261;
  for (const ch of instance.instanceId) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  const name = `ae-motion-${(hash >>> 0).toString(36)}`;
  return {
    css: `@keyframes ${name} {\n  ${selectors}\n}`,
    animation: `${name} ${total}ms ${time.easing} 0ms ${time.mode === "loop" ? "infinite" : "1"} normal both`,
  };
}
