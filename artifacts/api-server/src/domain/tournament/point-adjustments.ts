/**
 * V5.5 · point adjustments (bonuses and penalties) on stages with a points table.
 *
 * An adjustment changes a participant's league points by a whole number with a written reason. It never
 * changes match results, the head-to-head criterion or the score columns — only the points total, so the
 * configured tie-breakers still decide ties. Entries are an audit trail: they are revoked, never deleted.
 */

export interface PointAdjustment {
  id: string;
  playerId: number;
  /** Whole points, non-zero, within the limits below. Positive = bonus, negative = penalty. */
  points: number;
  reason: string;
  createdAt: string;
  revokedAt: string | null;
  /** Who added it: the role and a short fingerprint of the credential version ("organizer:ab12cd34"). */
  createdBy?: string;
  revokedBy?: string | null;
  /** Client idempotency key: a retried or double-clicked request with the same key adds nothing. */
  requestId?: string;
}

const ACTOR_LABEL = /^(organizer|support):[A-Za-z0-9_-]{1,32}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

export const POINT_ADJUSTMENT_LIMITS = Object.freeze({ entries: 200, reasonLength: 200, min: -100, max: 100 });

export interface PointAdjustmentProblem {
  field: "playerId" | "points" | "reason" | "entries";
  message: string;
}

const CONTROL = new RegExp("[\\u0000-\\u001F\\u007F\\u2028\\u2029\\u202A-\\u202E\\u2066-\\u2069]");
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function isEntry(value: unknown): value is PointAdjustment {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && entry.id.length > 0 && entry.id.length <= 64
    && Number.isInteger(entry.playerId) && (entry.playerId as number) > 0
    && Number.isInteger(entry.points) && entry.points !== 0
    && (entry.points as number) >= POINT_ADJUSTMENT_LIMITS.min && (entry.points as number) <= POINT_ADJUSTMENT_LIMITS.max
    && typeof entry.reason === "string" && entry.reason.trim().length > 0 && entry.reason.length <= POINT_ADJUSTMENT_LIMITS.reasonLength
    && typeof entry.createdAt === "string" && ISO.test(entry.createdAt)
    && (entry.revokedAt === null || (typeof entry.revokedAt === "string" && ISO.test(entry.revokedAt)))
    && (entry.createdBy === undefined || (typeof entry.createdBy === "string" && ACTOR_LABEL.test(entry.createdBy)))
    && (entry.revokedBy === undefined || entry.revokedBy === null || (typeof entry.revokedBy === "string" && ACTOR_LABEL.test(entry.revokedBy)))
    && (entry.requestId === undefined || (typeof entry.requestId === "string" && REQUEST_ID.test(entry.requestId)));
}

export function isValidRequestId(value: unknown): value is string {
  return typeof value === "string" && REQUEST_ID.test(value);
}

/** Strict parse (backup validation): every entry must be well-formed. */
export function parsePointAdjustments(input: unknown): { ok: true; value: PointAdjustment[] } | { ok: false; message: string } {
  if (input === null || input === undefined) return { ok: true, value: [] };
  if (!Array.isArray(input)) return { ok: false, message: "Korekty punktów muszą być listą." };
  if (input.length > POINT_ADJUSTMENT_LIMITS.entries) return { ok: false, message: `Najwyżej ${POINT_ADJUSTMENT_LIMITS.entries} korekt na etap.` };
  const ids = new Set<string>();
  for (const [index, item] of input.entries()) {
    if (!isEntry(item)) return { ok: false, message: `Korekta nr ${index + 1} jest niepoprawna.` };
    if (ids.has(item.id)) return { ok: false, message: `Korekta ${item.id} występuje dwa razy.` };
    ids.add(item.id);
  }
  return { ok: true, value: input.map((item) => ({ ...(item as PointAdjustment) })) };
}

/** Tolerant read of stored entries (malformed rows are ignored, never thrown on). */
export function pointAdjustmentsFromStorage(stored: unknown): PointAdjustment[] {
  return Array.isArray(stored) ? stored.filter(isEntry).map((item) => ({ ...item })) : [];
}

/** Sum of active (not revoked) adjustments per player; empty map when none. */
export function activePointTotals(entries: readonly PointAdjustment[]): Map<number, number> {
  const totals = new Map<number, number>();
  for (const entry of entries) {
    if (entry.revokedAt) continue;
    totals.set(entry.playerId, (totals.get(entry.playerId) ?? 0) + entry.points);
  }
  for (const [playerId, total] of totals) if (total === 0) totals.delete(playerId);
  return totals;
}

export function validateNewAdjustment(
  input: { playerId?: unknown; points?: unknown; reason?: unknown },
  context: { participantIds: ReadonlySet<number>; existing: readonly PointAdjustment[] },
): { ok: true; value: { playerId: number; points: number; reason: string } } | { ok: false; problems: PointAdjustmentProblem[] } {
  const problems: PointAdjustmentProblem[] = [];
  const playerId = input.playerId;
  if (!Number.isInteger(playerId) || !context.participantIds.has(playerId as number)) {
    problems.push({ field: "playerId", message: "Wybierz uczestnika tego etapu." });
  }
  const points = input.points;
  if (!Number.isInteger(points) || points === 0 || (points as number) < POINT_ADJUSTMENT_LIMITS.min || (points as number) > POINT_ADJUSTMENT_LIMITS.max) {
    problems.push({ field: "points", message: `Korekta: liczba całkowita od ${POINT_ADJUSTMENT_LIMITS.min} do ${POINT_ADJUSTMENT_LIMITS.max}, różna od zera.` });
  }
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!reason || reason.length > POINT_ADJUSTMENT_LIMITS.reasonLength || CONTROL.test(reason)) {
    problems.push({ field: "reason", message: `Podaj powód (1–${POINT_ADJUSTMENT_LIMITS.reasonLength} znaków w jednej linii).` });
  }
  if (context.existing.length >= POINT_ADJUSTMENT_LIMITS.entries) {
    problems.push({ field: "entries", message: `Etap ma już ${POINT_ADJUSTMENT_LIMITS.entries} korekt.` });
  }
  if (problems.length) return { ok: false, problems };
  return { ok: true, value: { playerId: playerId as number, points: points as number, reason } };
}

/** Active totals of a stage row (tolerant of old rows without the column). */
export function stagePointTotals(stage: { pointAdjustments?: unknown } | null | undefined): Map<number, number> {
  return activePointTotals(pointAdjustmentsFromStorage(stage?.pointAdjustments));
}
