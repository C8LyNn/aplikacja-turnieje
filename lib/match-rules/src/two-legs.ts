/**
 * V5.10 — a two-legged knockout tie (dwumecz): one source of truth for the API (decision, advancement) and the
 * screens (summary of both legs and the aggregate).
 *
 * Orientation: every leg score is stored from the tie's point of view — `score1` belongs to the tie's
 * participant 1 (home in leg 1), `score2` to participant 2 (home in leg 2). Screens show each leg home side first.
 *
 * Decision: when both legs are completed, the higher aggregate advances. A level aggregate is never decided by
 * the system (no away-goals rule, no invented extra time or penalties): the organizer records the winner and a
 * reason, and until then the tie blocks advancement.
 */
export const MAX_LEG_SCORE = 999;
export const MAX_DECISION_REASON_LENGTH = 300;

export interface LegScore {
  leg: 1 | 2;
  status: "pending" | "completed";
  /** Participant 1 of the tie (home in leg 1). */
  score1: number | null;
  /** Participant 2 of the tie (home in leg 2). */
  score2: number | null;
}

export type TieState =
  /** No leg completed yet. */
  | "not_started"
  /** One leg completed. */
  | "first_leg_played"
  /** Both legs completed, aggregate level, no decision yet: advancement is blocked. */
  | "awaiting_decision"
  /** Both legs completed and the aggregate (or the organizer, on a level aggregate) gave a winner. */
  | "decided";

export interface TieAggregate {
  completedLegs: number;
  total1: number;
  total2: number;
  /** Who leads on the aggregate after the completed legs (null when level). */
  leader: 1 | 2 | null;
  /** Both legs completed. */
  complete: boolean;
  /** Winner side by the aggregate (only when complete and not level). */
  aggregateWinner: 1 | 2 | null;
  level: boolean;
}

export type LegScoreProblemCode = "LEG_SCORE_NOT_INTEGER" | "LEG_SCORE_NEGATIVE" | "LEG_SCORE_TOO_HIGH";

export function validateLegScore(score1: unknown, score2: unknown): { ok: true } | { ok: false; code: LegScoreProblemCode; message: string } {
  if (!Number.isInteger(score1) || !Number.isInteger(score2)) return { ok: false, code: "LEG_SCORE_NOT_INTEGER", message: "Wynik spotkania to liczby całkowite (bramki lub punkty)." };
  if ((score1 as number) < 0 || (score2 as number) < 0) return { ok: false, code: "LEG_SCORE_NEGATIVE", message: "Wynik spotkania nie może być ujemny." };
  if ((score1 as number) > MAX_LEG_SCORE || (score2 as number) > MAX_LEG_SCORE) return { ok: false, code: "LEG_SCORE_TOO_HIGH", message: `Wynik spotkania jest zbyt wysoki (najwyżej ${MAX_LEG_SCORE}).` };
  return { ok: true };
}

export function tieAggregate(legs: readonly LegScore[]): TieAggregate {
  const done = legs.filter((leg) => leg.status === "completed" && leg.score1 != null && leg.score2 != null);
  const total1 = done.reduce((sum, leg) => sum + (leg.score1 as number), 0);
  const total2 = done.reduce((sum, leg) => sum + (leg.score2 as number), 0);
  const complete = done.length === 2 && new Set(done.map((leg) => leg.leg)).size === 2;
  const leader = total1 === total2 ? null : total1 > total2 ? 1 : 2;
  return { completedLegs: done.length, total1, total2, leader, complete, aggregateWinner: complete ? leader : null, level: total1 === total2 };
}

export function tieState(legs: readonly LegScore[], decided: boolean): TieState {
  const aggregate = tieAggregate(legs);
  if (aggregate.completedLegs === 0) return "not_started";
  if (!aggregate.complete) return "first_leg_played";
  if (aggregate.aggregateWinner != null || decided) return "decided";
  return "awaiting_decision";
}

/** Home side of a leg: participant 1 hosts leg 1, participant 2 hosts leg 2. */
export function legHomeSide(leg: 1 | 2): 1 | 2 {
  return leg;
}

/** A leg score as it is read out: home side first ("Wilki 3:1 Orły" for leg 2 hosted by participant 2). */
export function legScoreHomeFirst(leg: LegScore): { home: number | null; away: number | null } {
  return leg.leg === 1 ? { home: leg.score1, away: leg.score2 } : { home: leg.score2, away: leg.score1 };
}

/** Converts a home-first score typed for a leg into the tie orientation used for storage. */
export function legScoreFromHomeFirst(leg: 1 | 2, home: number, away: number): { score1: number; score2: number } {
  return leg === 1 ? { score1: home, score2: away } : { score1: away, score2: home };
}

export function validateDecisionReason(reason: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof reason !== "string" || reason.trim().length === 0) {
    return { ok: false, message: "Podaj powód rozstrzygnięcia (np. „rzuty karne 4:3” albo „dogrywka 1:0”) — widzowie go zobaczą." };
  }
  const value = reason.trim();
  if (value.length > MAX_DECISION_REASON_LENGTH) return { ok: false, message: `Powód może mieć najwyżej ${MAX_DECISION_REASON_LENGTH} znaków.` };
  return { ok: true, value };
}

/**
 * One plain sentence for screens, e.g. "Łącznie 3:4 — awansuje Orły." or "Łącznie 2:2 — remis w sumie; czeka na
 * rozstrzygnięcie organizatora, awans wstrzymany."
 */
export function describeTie(
  legs: readonly LegScore[],
  names: { name1: string; name2: string },
  decision: { winnerSide: 1 | 2; reason: string } | null,
): string {
  const aggregate = tieAggregate(legs);
  if (aggregate.completedLegs === 0) return "Dwumecz: dwa spotkania, awansuje zwycięzca sumy.";
  const total = `Łącznie ${aggregate.total1}:${aggregate.total2}`;
  if (!aggregate.complete) {
    const lead = aggregate.leader == null ? "remis po pierwszym spotkaniu" : `prowadzi ${aggregate.leader === 1 ? names.name1 : names.name2}`;
    return `${total} po pierwszym spotkaniu — ${lead}.`;
  }
  if (aggregate.aggregateWinner != null) return `${total} — awansuje ${aggregate.aggregateWinner === 1 ? names.name1 : names.name2}.`;
  if (decision) return `${total} — remis w sumie; awansuje ${decision.winnerSide === 1 ? names.name1 : names.name2} (decyzja organizatora: ${decision.reason}).`;
  return `${total} — remis w sumie; czeka na rozstrzygnięcie organizatora, awans wstrzymany.`;
}
