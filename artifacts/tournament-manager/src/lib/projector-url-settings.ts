/** Bounded, finite values for public OBS projector URLs; no side effects or state changes. */
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

/** Invalid, empty or non-finite input returns the safe default. Finite outliers are clamped. */
export function parseProjectorNumber(value: string | null, fallback: number, min: number, max: number): number {
  if (value === null || !DECIMAL.test(value.trim())) return fallback;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

/** Pixel padding must never become negative, infinite, or a fractional CSS value. */
export function parseProjectorInteger(value: string | null, fallback: number, min: number, max: number): number {
  return Math.floor(parseProjectorNumber(value, fallback, min, max));
}
