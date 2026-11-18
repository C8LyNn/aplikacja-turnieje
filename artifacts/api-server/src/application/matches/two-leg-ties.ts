/**
 * V5.10 — two-legged knockout ties (dwumecz).
 *
 * The tie is the existing single-elimination bracket match: its result is the aggregate and its winner advances
 * through the usual bracket logic (CompleteMatch / RevertMatch, including every dependency check). The two legs
 * are stored in `match_legs` with their own date, score and revision; a level aggregate is decided only by the
 * organizer (`match_tie_decisions`, with a public reason). `match_tie_history` keeps every change.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchLegsTable,
  matchTieDecisionsTable,
  matchTieHistoryTable,
  matchesTable,
  playersTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import {
  legScoreHomeFirst,
  matchRulesFromStorage,
  tieAggregate,
  tieState,
  validateLegScore,
  type LegScore,
  type TieState,
} from "@workspace/match-rules";
import { revalidateTournamentMutationActor, type TournamentMutationActor } from "../../access-policy";
import { completeMatch, CompleteMatchError } from "./complete-match";
import { revertMatch, RevertMatchError } from "./revert-match";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Transaction;
type MatchRow = typeof matchesTable.$inferSelect;
type LegRow = typeof matchLegsTable.$inferSelect;
type DecisionRow = typeof matchTieDecisionsTable.$inferSelect;

export type TwoLegTieErrorCode =
  | "MATCH_NOT_FOUND"
  | "TOURNAMENT_NOT_FOUND"
  | "LEG_NOT_FOUND"
  | "NOT_A_TWO_LEGGED_TIE"
  | "STAGE_NOT_ACTIVE"
  | "PARTICIPANTS_REQUIRED"
  | "TIE_ALREADY_DECIDED"
  | "TIE_CANCELLED"
  | "INVALID_LEG_REVISION"
  | "CONCURRENT_MODIFICATION"
  | "LEG_ALREADY_RECORDED"
  | "LEG_NOT_RECORDED"
  | "LEG_ALREADY_PLAYED"
  | "SCHEDULE_CHANGED"
  | "SCHEDULE_INVALID"
  | "LEG_SCORE_NOT_INTEGER"
  | "LEG_SCORE_NEGATIVE"
  | "LEG_SCORE_TOO_HIGH"
  | "TWO_LEGS_INCOMPLETE"
  | "UNDO_ACTION_CHANGED";

const MESSAGES: Record<TwoLegTieErrorCode, string> = {
  MATCH_NOT_FOUND: "Mecz nie istnieje.",
  TOURNAMENT_NOT_FOUND: "Turniej meczu nie istnieje.",
  LEG_NOT_FOUND: "Ten dwumecz nie ma takiego spotkania.",
  NOT_A_TWO_LEGGED_TIE: "To nie jest dwumecz — wynik wpisuje się dla całego meczu.",
  STAGE_NOT_ACTIVE: "Etap nie trwa — wyników spotkań nie można teraz zmieniać.",
  PARTICIPANTS_REQUIRED: "Para dwumeczu nie jest jeszcze znana (czeka na zwycięzców poprzedniej rundy).",
  TIE_ALREADY_DECIDED: "Dwumecz jest już rozstrzygnięty. Aby coś zmienić, cofnij wynik jednego ze spotkań (system sprawdzi, czy następny mecz jeszcze się nie zaczął).",
  TIE_CANCELLED: "Ten mecz jest anulowany.",
  INVALID_LEG_REVISION: "Zapis wymaga wersji spotkania, którą widziałeś (expectedRevision).",
  CONCURRENT_MODIFICATION: "Ktoś inny zmienił to spotkanie. Odśwież dane — Twój wpis nie został zapisany.",
  LEG_ALREADY_RECORDED: "To spotkanie ma już inny zapisany wynik. Aby go zmienić, najpierw cofnij wynik spotkania.",
  LEG_NOT_RECORDED: "To spotkanie nie ma zapisanego wyniku.",
  LEG_ALREADY_PLAYED: "To spotkanie ma już wynik — jego terminu nie zmienia się.",
  SCHEDULE_CHANGED: "Termin spotkania zmienił się w międzyczasie. Odśwież dane.",
  SCHEDULE_INVALID: "Nieprawidłowy termin spotkania.",
  LEG_SCORE_NOT_INTEGER: "Wynik spotkania to liczby całkowite (bramki lub punkty).",
  LEG_SCORE_NEGATIVE: "Wynik spotkania nie może być ujemny.",
  LEG_SCORE_TOO_HIGH: "Wynik spotkania jest zbyt wysoki (najwyżej 999).",
  TWO_LEGS_INCOMPLETE: "W dwumeczu najpierw wpisz wyniki obu spotkań — o awansie decyduje ich suma.",
  UNDO_ACTION_CHANGED: "Ostatnia akcja do cofnięcia uległa zmianie.",
};

export class TwoLegTieError extends Error {
  constructor(public readonly code: TwoLegTieErrorCode, detail?: string) {
    super(detail ?? MESSAGES[code]);
    this.name = "TwoLegTieError";
  }
  get status(): number {
    if (this.code === "MATCH_NOT_FOUND" || this.code === "TOURNAMENT_NOT_FOUND" || this.code === "LEG_NOT_FOUND") return 404;
    if (["CONCURRENT_MODIFICATION", "LEG_ALREADY_RECORDED", "SCHEDULE_CHANGED", "TIE_ALREADY_DECIDED", "UNDO_ACTION_CHANGED"].includes(this.code)) return 409;
    return 422;
  }
}

// ───────────────────────────── reading (views, backup) ─────────────────────────────

export interface MatchLegView {
  leg: 1 | 2;
  homeSide: 1 | 2;
  status: "pending" | "completed";
  score1: number | null;
  score2: number | null;
  scheduledAt: string | null;
  completedAt: string | null;
  revision: number;
}

export interface TieSummaryView {
  state: TieState;
  total1: number;
  total2: number;
  completedLegs: number;
  decidedBy: "aggregate" | "organizer" | null;
  decisionReason: string | null;
  decisionWinnerId: number | null;
}

export interface StoredTieData {
  legs: LegRow[];
  decision: DecisionRow | null;
}

const asLegScore = (leg: LegRow): LegScore => ({ leg: leg.leg as 1 | 2, status: leg.status, score1: leg.score1, score2: leg.score2 });
const iso = (value: Date | null) => (value ? value.toISOString() : null);

/** Legs and decisions of the given matches (only two-legged ties have any). */
export async function loadTieData(executor: Executor, matchIds: number[]): Promise<Map<number, StoredTieData>> {
  const result = new Map<number, StoredTieData>();
  if (matchIds.length === 0) return result;
  const legs = await executor.select().from(matchLegsTable).where(inArray(matchLegsTable.matchId, matchIds)).orderBy(matchLegsTable.matchId, matchLegsTable.leg);
  if (legs.length === 0) return result;
  const decisions = await executor.select().from(matchTieDecisionsTable).where(inArray(matchTieDecisionsTable.matchId, [...new Set(legs.map((leg) => leg.matchId))]));
  const decisionByMatch = new Map(decisions.map((decision) => [decision.matchId, decision]));
  for (const leg of legs) {
    const entry = result.get(leg.matchId) ?? { legs: [], decision: decisionByMatch.get(leg.matchId) ?? null };
    entry.legs.push(leg);
    result.set(leg.matchId, entry);
  }
  return result;
}

export function tieViewOf(match: Pick<MatchRow, "status" | "winnerId" | "player1Id" | "player2Id">, data: StoredTieData): { legs: MatchLegView[]; tie: TieSummaryView } {
  const legs = data.legs.map((leg): MatchLegView => ({
    leg: leg.leg as 1 | 2, homeSide: leg.leg as 1 | 2, status: leg.status, score1: leg.score1, score2: leg.score2,
    scheduledAt: iso(leg.scheduledAt), completedAt: iso(leg.completedAt), revision: leg.revision,
  }));
  const scores = data.legs.map(asLegScore);
  const aggregate = tieAggregate(scores);
  const decided = match.status === "completed" && match.winnerId != null;
  const decidedByOrganizer = decided && data.decision != null && aggregate.level;
  return {
    legs,
    tie: {
      state: decided ? "decided" : aggregate.complete ? "awaiting_decision" : tieState(scores, false),
      total1: aggregate.total1,
      total2: aggregate.total2,
      completedLegs: aggregate.completedLegs,
      decidedBy: !decided ? null : decidedByOrganizer ? "organizer" : "aggregate",
      decisionReason: decidedByOrganizer ? data.decision!.reason : null,
      decisionWinnerId: decidedByOrganizer ? data.decision!.winnerId : null,
    },
  };
}

// ───────────────────────────── stage start ─────────────────────────────

/** Creates both (pending) legs for every non-bye tie of a two-legged single-elimination stage. */
export async function createTieLegs(tx: Transaction, stage: { id: number; format: string; matchRules: unknown }, matches: MatchRow[]): Promise<number> {
  if (stage.format !== "single_elimination" || matchRulesFromStorage(stage.matchRules)?.kind !== "two_legs") return 0;
  const ties = matches.filter((match) => match.stageId === stage.id && match.resultType !== "bye");
  if (ties.length === 0) return 0;
  await tx.insert(matchLegsTable).values(ties.flatMap((match) => [1, 2].map((leg) => ({
    tournamentId: match.tournamentId, stageId: match.stageId, matchId: match.id, leg,
  }))));
  return ties.length;
}

// ───────────────────────────── writes ─────────────────────────────

interface LockedTie {
  tournament: typeof tournamentsTable.$inferSelect;
  stage: typeof tournamentStagesTable.$inferSelect;
  match: MatchRow;
  legs: LegRow[];
}

async function lockTie(tx: Transaction, matchId: number, actor: TournamentMutationActor | undefined): Promise<LockedTie> {
  const [reference] = await tx.select({ tournamentId: matchesTable.tournamentId, stageId: matchesTable.stageId }).from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!reference) throw new TwoLegTieError("MATCH_NOT_FOUND");
  const [tournament] = await tx.select().from(tournamentsTable).where(eq(tournamentsTable.id, reference.tournamentId)).for("update");
  if (!tournament) throw new TwoLegTieError("TOURNAMENT_NOT_FOUND");
  await revalidateTournamentMutationActor(tx, tournament, actor);
  const [stage] = await tx.select().from(tournamentStagesTable)
    .where(and(eq(tournamentStagesTable.id, reference.stageId), eq(tournamentStagesTable.tournamentId, reference.tournamentId))).for("update");
  if (!stage) throw new TwoLegTieError("MATCH_NOT_FOUND");
  if (stage.format !== "single_elimination" || matchRulesFromStorage(stage.matchRules)?.kind !== "two_legs") throw new TwoLegTieError("NOT_A_TWO_LEGGED_TIE");
  const [match] = await tx.select().from(matchesTable).where(eq(matchesTable.id, matchId)).for("update");
  if (!match) throw new TwoLegTieError("MATCH_NOT_FOUND");
  const legs = await tx.select().from(matchLegsTable).where(eq(matchLegsTable.matchId, matchId)).orderBy(matchLegsTable.leg).for("update");
  if (legs.length !== 2) throw new TwoLegTieError("NOT_A_TWO_LEGGED_TIE");
  return { tournament, stage, match, legs };
}

function pickLeg(locked: LockedTie, leg: number): LegRow {
  const row = locked.legs.find((candidate) => candidate.leg === leg);
  if (!row) throw new TwoLegTieError("LEG_NOT_FOUND");
  return row;
}

async function names(tx: Transaction, match: MatchRow): Promise<{ name1: string; name2: string }> {
  const ids = [match.player1Id, match.player2Id].filter((id): id is number => id != null);
  const rows = ids.length ? await tx.select({ id: playersTable.id, name: playersTable.name }).from(playersTable).where(inArray(playersTable.id, ids)) : [];
  const byId = new Map(rows.map((row) => [row.id, row.name]));
  return { name1: byId.get(match.player1Id ?? -1) ?? "Uczestnik 1", name2: byId.get(match.player2Id ?? -1) ?? "Uczestnik 2" };
}

function legLabel(match: MatchRow, leg: number, people: { name1: string; name2: string }, score?: { score1: number; score2: number }): string {
  const home = leg === 1 ? people.name1 : people.name2;
  const away = leg === 1 ? people.name2 : people.name1;
  const text = score ? (() => { const s = legScoreHomeFirst({ leg: leg as 1 | 2, status: "completed", score1: score.score1, score2: score.score2 }); return `${home} ${s.home}:${s.away} ${away}`; })() : `${home} – ${away}`;
  return `R${match.round}M${match.matchNumber}, ${leg}. spotkanie: ${text}`;
}

async function setTieProgressStatus(tx: Transaction, match: MatchRow, completedLegs: number): Promise<void> {
  if (match.status === "completed" || match.status === "cancelled") return;
  const status = completedLegs > 0 ? "in_progress" : "pending";
  if (match.status !== status) await tx.update(matchesTable).set({ status }).where(eq(matchesTable.id, match.id));
}

async function reloadMatch(tx: Transaction, matchId: number): Promise<MatchRow> {
  const [row] = await tx.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  return row;
}

/**
 * Records the score of one leg (tie orientation: score1 = participant 1). When both legs stand and the aggregate
 * has a winner, the tie is completed in the same transaction (the winner advances as in any bracket match); a level
 * aggregate stays open and blocks advancement until the organizer decides.
 */
export async function recordLegResult(input: {
  matchId: number; leg: number; score1: unknown; score2: unknown; expectedRevision: unknown; actor?: TournamentMutationActor;
}): Promise<{ match: MatchRow; alreadyRecorded: boolean }> {
  if (!Number.isSafeInteger(input.expectedRevision) || (input.expectedRevision as number) < 1) throw new TwoLegTieError("INVALID_LEG_REVISION");
  const score = validateLegScore(input.score1, input.score2);
  if (!score.ok) throw new TwoLegTieError(score.code);
  const score1 = input.score1 as number;
  const score2 = input.score2 as number;
  return db.transaction(async (tx) => {
    const locked = await lockTie(tx, input.matchId, input.actor);
    const leg = pickLeg(locked, input.leg);
    // A retry after a lost response: the same score is already stored — nothing is written twice.
    if (leg.status === "completed" && leg.score1 === score1 && leg.score2 === score2) return { match: locked.match, alreadyRecorded: true };
    if (leg.revision !== input.expectedRevision) throw new TwoLegTieError("CONCURRENT_MODIFICATION");
    if (leg.status === "completed") throw new TwoLegTieError("LEG_ALREADY_RECORDED");
    if (locked.stage.status !== "active") throw new TwoLegTieError("STAGE_NOT_ACTIVE");
    if (locked.match.status === "cancelled") throw new TwoLegTieError("TIE_CANCELLED");
    if (locked.match.status === "completed") throw new TwoLegTieError("TIE_ALREADY_DECIDED");
    if (locked.match.player1Id == null || locked.match.player2Id == null) throw new TwoLegTieError("PARTICIPANTS_REQUIRED");

    const now = new Date();
    const [saved] = await tx.update(matchLegsTable)
      .set({ status: "completed", score1, score2, completedAt: now, revision: sql`${matchLegsTable.revision} + 1` })
      .where(and(eq(matchLegsTable.id, leg.id), eq(matchLegsTable.revision, leg.revision), eq(matchLegsTable.status, "pending")))
      .returning();
    if (!saved) throw new TwoLegTieError("CONCURRENT_MODIFICATION");
    await tx.insert(matchTieHistoryTable).values({
      tournamentId: locked.match.tournamentId, stageId: locked.match.stageId, matchId: locked.match.id,
      event: "leg_recorded", leg: saved.leg, score1, score2, recordedAt: now,
    });
    const legs = locked.legs.map((candidate) => (candidate.id === saved.id ? saved : candidate));
    const aggregate = tieAggregate(legs.map(asLegScore));
    await setTieProgressStatus(tx, locked.match, aggregate.completedLegs);

    // Both legs and a winner on the aggregate: the tie is decided like any bracket match (same advancement path).
    if (aggregate.complete && aggregate.aggregateWinner != null) {
      const current = await reloadMatch(tx, locked.match.id);
      await completeMatch({
        matchId: locked.match.id, expectedRevision: current.revision, resultType: "played",
        score1: aggregate.total1, score2: aggregate.total2, actor: input.actor,
      }, {}, tx);
    }
    const people = await names(tx, locked.match);
    const status = !aggregate.complete ? "" : aggregate.aggregateWinner != null
      ? ` — dwumecz rozstrzygnięty, łącznie ${aggregate.total1}:${aggregate.total2}`
      : ` — łącznie ${aggregate.total1}:${aggregate.total2}, remis w sumie: awans czeka na decyzję organizatora`;
    // Logged after the tie completion so that "Cofnij ostatnią akcję" undoes this leg (and the tie it decided).
    await tx.insert(actionLogTable).values({
      tournamentId: locked.match.tournamentId, stageId: locked.match.stageId, actionType: "match_leg_result_submitted",
      description: `${legLabel(locked.match, saved.leg, people, { score1, score2 })}${status}`,
      matchId: locked.match.id, undoPayload: JSON.stringify({ type: "revert_leg", matchId: locked.match.id, leg: saved.leg }), isUndone: false,
    });
    return { match: await reloadMatch(tx, locked.match.id), alreadyRecorded: false };
  });
}

/**
 * Removes the score of one leg. A decided tie is reverted first with the usual bracket checks (the next match must
 * not have started; no later stage may depend on it) — nothing played later is ever removed silently.
 */
export async function revertLegResult(input: {
  matchId: number; leg: number; expectedRevision: unknown; actor?: TournamentMutationActor; expectedActionId?: number;
}, transaction?: Transaction): Promise<{ match: MatchRow; alreadyReverted: boolean }> {
  if (!Number.isSafeInteger(input.expectedRevision) || (input.expectedRevision as number) < 1) throw new TwoLegTieError("INVALID_LEG_REVISION");
  const perform = async (tx: Transaction) => {
    const locked = await lockTie(tx, input.matchId, input.actor);
    const leg = pickLeg(locked, input.leg);
    if (leg.status !== "completed") {
      // A retry after a lost response: the leg is already pending at a newer revision.
      if (leg.revision > (input.expectedRevision as number)) return { match: locked.match, alreadyReverted: true };
      throw new TwoLegTieError("LEG_NOT_RECORDED");
    }
    if (leg.revision !== input.expectedRevision) throw new TwoLegTieError("CONCURRENT_MODIFICATION");

    const recordedActions = await tx.select().from(actionLogTable).where(and(
      eq(actionLogTable.tournamentId, locked.match.tournamentId), eq(actionLogTable.matchId, locked.match.id),
      eq(actionLogTable.actionType, "match_leg_result_submitted"), eq(actionLogTable.isUndone, false),
    )).orderBy(desc(actionLogTable.id)).for("update");
    const legAction = recordedActions.find((action) => {
      try { const payload = JSON.parse(action.undoPayload ?? "{}") as Record<string, unknown>; return payload.type === "revert_leg" && payload.leg === leg.leg; } catch { return false; }
    });
    if (input.expectedActionId != null && legAction?.id !== input.expectedActionId) throw new TwoLegTieError("UNDO_ACTION_CHANGED");

    if (locked.match.status === "completed") {
      // The tie was decided (by the aggregate or by the organizer): undo that first, with every bracket check.
      await revertMatch({ matchId: locked.match.id, expectedTournamentId: locked.match.tournamentId, actor: input.actor, allowTieAggregateRevert: true }, {}, tx);
    }
    const [reverted] = await tx.update(matchLegsTable)
      .set({ status: "pending", score1: null, score2: null, completedAt: null, revision: sql`${matchLegsTable.revision} + 1` })
      .where(and(eq(matchLegsTable.id, leg.id), eq(matchLegsTable.revision, leg.revision), eq(matchLegsTable.status, "completed")))
      .returning();
    if (!reverted) throw new TwoLegTieError("CONCURRENT_MODIFICATION");
    await tx.insert(matchTieHistoryTable).values({
      tournamentId: locked.match.tournamentId, stageId: locked.match.stageId, matchId: locked.match.id,
      event: "leg_reverted", leg: leg.leg, score1: leg.score1, score2: leg.score2,
    });
    const remaining = locked.legs.filter((candidate) => candidate.id !== leg.id && candidate.status === "completed").length;
    const current = await reloadMatch(tx, locked.match.id);
    await setTieProgressStatus(tx, current, remaining);
    if (legAction) await tx.update(actionLogTable).set({ isUndone: true }).where(eq(actionLogTable.id, legAction.id));
    const people = await names(tx, locked.match);
    await tx.insert(actionLogTable).values({
      tournamentId: locked.match.tournamentId, stageId: locked.match.stageId, actionType: "match_leg_result_reverted",
      description: `Cofnięto wynik: ${legLabel(locked.match, leg.leg, people, { score1: leg.score1!, score2: leg.score2! })}`,
      matchId: locked.match.id, undoPayload: null, isUndone: false,
    });
    return { match: await reloadMatch(tx, locked.match.id), alreadyReverted: false };
  };
  return transaction ? perform(transaction) : db.transaction(perform);
}

/**
 * Decides a tie whose both legs stand. Level aggregate: the organizer's winner and reason are required (public,
 * kept in the history). Otherwise the aggregate decides and this only confirms it (e.g. after "undo" reopened it).
 */
export async function decideTie(input: {
  matchId: number; winnerId?: unknown; reason?: unknown; expectedRevision: unknown; actor?: TournamentMutationActor;
}): Promise<MatchRow> {
  if (!Number.isSafeInteger(input.expectedRevision) || (input.expectedRevision as number) < 1) throw new TwoLegTieError("INVALID_LEG_REVISION", "Zapis wymaga wersji dwumeczu, którą widziałeś (expectedRevision).");
  return db.transaction(async (tx) => {
    const locked = await lockTie(tx, input.matchId, input.actor);
    if (locked.match.status === "completed") throw new TwoLegTieError("TIE_ALREADY_DECIDED");
    const aggregate = tieAggregate(locked.legs.map(asLegScore));
    if (!aggregate.complete) throw new TwoLegTieError("TWO_LEGS_INCOMPLETE");
    const decision = input.winnerId === undefined && input.reason === undefined
      ? null
      : { winnerId: input.winnerId as number, reason: typeof input.reason === "string" ? input.reason : "" };
    await completeMatch({
      matchId: locked.match.id, expectedRevision: input.expectedRevision as number, resultType: "played",
      score1: aggregate.total1, score2: aggregate.total2, actor: input.actor, tieDecision: decision,
    }, {}, tx);
    return reloadMatch(tx, locked.match.id);
  });
}

/** Sets or clears the date of one leg (separate from scores: a date change never invalidates a typed score). */
export async function scheduleLeg(input: {
  matchId: number; leg: number; scheduledAt: unknown; expectedScheduledAt: unknown; actor?: TournamentMutationActor;
}): Promise<MatchRow> {
  const parse = (value: unknown): Date | null | "invalid" => {
    if (value === null) return null;
    if (typeof value !== "string") return "invalid";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "invalid" : date;
  };
  const next = parse(input.scheduledAt);
  const expected = parse(input.expectedScheduledAt);
  if (next === "invalid" || expected === "invalid") throw new TwoLegTieError("SCHEDULE_INVALID");
  return db.transaction(async (tx) => {
    const locked = await lockTie(tx, input.matchId, input.actor);
    const leg = pickLeg(locked, input.leg);
    const same = (left: Date | null, right: Date | null) => (left?.getTime() ?? null) === (right?.getTime() ?? null);
    if (same(leg.scheduledAt, next)) return locked.match;
    if (!same(leg.scheduledAt, expected)) throw new TwoLegTieError("SCHEDULE_CHANGED");
    if (leg.status === "completed") throw new TwoLegTieError("LEG_ALREADY_PLAYED");
    await tx.update(matchLegsTable).set({ scheduledAt: next }).where(eq(matchLegsTable.id, leg.id));
    const people = await names(tx, locked.match);
    await tx.insert(actionLogTable).values({
      tournamentId: locked.match.tournamentId, stageId: locked.match.stageId, actionType: "match_leg_scheduled",
      description: `${legLabel(locked.match, leg.leg, people)} — termin ${next ? next.toISOString() : "usunięty"}`,
      matchId: locked.match.id, undoPayload: null, isUndone: false,
    });
    return reloadMatch(tx, locked.match.id);
  });
}

/** Whether the match belongs to a two-legged stage (used to refuse whole-match operations that do not fit a tie). */
export async function isTwoLeggedTie(executor: Executor, matchId: number): Promise<boolean> {
  const [row] = await executor.select({ format: tournamentStagesTable.format, matchRules: tournamentStagesTable.matchRules })
    .from(matchesTable).innerJoin(tournamentStagesTable, eq(tournamentStagesTable.id, matchesTable.stageId))
    .where(eq(matchesTable.id, matchId));
  return !!row && row.format === "single_elimination" && matchRulesFromStorage(row.matchRules)?.kind === "two_legs";
}

export { CompleteMatchError, RevertMatchError };
