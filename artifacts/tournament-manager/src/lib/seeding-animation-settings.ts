/** Browser-local visual preferences. These values never choose the draw result. */
export interface AnimSettings {
  durationMode: "fixed" | "random";
  durationMin: number;
  durationMax: number;
  durationLongEnabled: boolean;
  durationLongChance: number;
  durationLongMin: number;
  durationLongMax: number;
  speedMode: "fixed" | "random";
  speedMin: number;
  speedMax: number;
  speedAltEnabled: boolean;
  speedAltChance: number;
  speedAltMin: number;
  speedAltMax: number;
}

export const ANIM_DEFAULTS: Readonly<AnimSettings> = {
  durationMode: "random",
  durationMin: 4,
  durationMax: 6,
  durationLongEnabled: true,
  durationLongChance: 20,
  durationLongMin: 7,
  durationLongMax: 10,
  speedMode: "random",
  speedMin: 0.9,
  speedMax: 1.1,
  speedAltEnabled: true,
  speedAltChance: 20,
  speedAltMin: 1.1,
  speedAltMax: 1.4,
};

const ANIM_LS_KEY = "seeding-ceremony-anim-v1";

function bounded(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, number));
}

/** Keep the same ranges as the controls, including dependent lower bounds. */
export function normalizeAnimSettings(raw: unknown): AnimSettings {
  const value: Record<string, unknown> = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown> : {};
  const durationMin = bounded(value.durationMin, ANIM_DEFAULTS.durationMin, 1, 30);
  const durationMax = bounded(value.durationMax, ANIM_DEFAULTS.durationMax, durationMin, 30);
  const durationLongMin = bounded(value.durationLongMin, ANIM_DEFAULTS.durationLongMin, durationMax + 0.5, 60);
  const speedMin = bounded(value.speedMin, ANIM_DEFAULTS.speedMin, 0.5, 5);
  const speedAltMin = bounded(value.speedAltMin, ANIM_DEFAULTS.speedAltMin, 0.5, 5);

  return {
    durationMode: value.durationMode === "fixed" || value.durationMode === "random"
      ? value.durationMode : ANIM_DEFAULTS.durationMode,
    durationMin,
    durationMax,
    durationLongEnabled: typeof value.durationLongEnabled === "boolean"
      ? value.durationLongEnabled : ANIM_DEFAULTS.durationLongEnabled,
    durationLongChance: bounded(value.durationLongChance, ANIM_DEFAULTS.durationLongChance, 1, 99),
    durationLongMin,
    durationLongMax: bounded(value.durationLongMax, ANIM_DEFAULTS.durationLongMax, durationLongMin, 60),
    speedMode: value.speedMode === "fixed" || value.speedMode === "random"
      ? value.speedMode : ANIM_DEFAULTS.speedMode,
    speedMin,
    speedMax: bounded(value.speedMax, ANIM_DEFAULTS.speedMax, speedMin, 5),
    speedAltEnabled: typeof value.speedAltEnabled === "boolean"
      ? value.speedAltEnabled : ANIM_DEFAULTS.speedAltEnabled,
    speedAltChance: bounded(value.speedAltChance, ANIM_DEFAULTS.speedAltChance, 1, 99),
    speedAltMin,
    speedAltMax: bounded(value.speedAltMax, ANIM_DEFAULTS.speedAltMax, speedAltMin, 5),
  };
}

export function loadAnimSettings(): AnimSettings {
  try {
    const raw = localStorage.getItem(ANIM_LS_KEY);
    return normalizeAnimSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeAnimSettings(null);
  }
}

export function saveAnimSettings(settings: AnimSettings): void {
  try {
    localStorage.setItem(ANIM_LS_KEY, JSON.stringify(normalizeAnimSettings(settings)));
  } catch { /* Browser storage may be unavailable; the in-memory setting still works. */ }
}

/** Sample animation duration (seconds). Purely visual — does not affect draw result. */
export function sampleDuration(s: AnimSettings): number {
  const useLong = s.durationLongEnabled && Math.random() * 100 < s.durationLongChance;
  if (useLong) {
    const span = Math.max(0, s.durationLongMax - s.durationLongMin);
    return s.durationLongMin + Math.random() * span;
  }
  const lo = s.durationMin;
  const hi = s.durationMode === "fixed" ? lo : Math.max(lo, s.durationMax);
  return lo + Math.random() * Math.max(0, hi - lo);
}

/** Sample speed multiplier. Purely visual — does not affect draw result. */
export function sampleSpeed(s: AnimSettings): number {
  const useAlt = s.speedAltEnabled && Math.random() * 100 < s.speedAltChance;
  if (useAlt) {
    const span = Math.max(0, s.speedAltMax - s.speedAltMin);
    return s.speedAltMin + Math.random() * span;
  }
  const lo = s.speedMin;
  const hi = s.speedMode === "fixed" ? lo : Math.max(lo, s.speedMax);
  return lo + Math.random() * Math.max(0, hi - lo);
}
