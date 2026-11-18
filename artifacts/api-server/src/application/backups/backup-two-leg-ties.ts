import { asc, eq } from "drizzle-orm";
import { matchLegsTable, matchTieDecisionsTable, matchTieHistoryTable } from "@workspace/db/schema";
import type { TournamentBackupV3 } from "@workspace/api-zod";
import { tieAggregate, validateDecisionReason, validateLegScore, type MatchRules } from "@workspace/match-rules";

/**
 * V5.10 — two-legged ties in Backup V3 (sections `tieLegs`, `tieDecisions`, `tieHistory`).
 *
 * Written only when the tournament has two-legged ties, so every other backup stays byte-for-byte as before.
 * The OpenAPI schema is strict: an importer that predates these sections rejects the backup instead of silently
 * dropping the legs (which would leave ties whose aggregate cannot be checked).
 */
type Backup = TournamentBackupV3;
type BackupMatch = Backup["matches"][number];
type Executor = Pick<typeof import("@workspace/db")["db"], "select">;
type Tx = Parameters<Parameters<typeof import("@workspace/db")["db"]["transaction"]>[0]>[0];

const iso = (value: Date | null): string | null => (value == null ? null : value.toISOString());
const validDate = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(Date.parse(value));

export async function exportTwoLegTies(executor: Executor, tournamentId: number): Promise<Pick<Backup, "tieLegs" | "tieDecisions" | "tieHistory">> {
  const [legs, decisions, history] = await Promise.all([
    executor.select().from(matchLegsTable).where(eq(matchLegsTable.tournamentId, tournamentId)).orderBy(asc(matchLegsTable.matchId), asc(matchLegsTable.leg)),
    executor.select().from(matchTieDecisionsTable).where(eq(matchTieDecisionsTable.tournamentId, tournamentId)).orderBy(asc(matchTieDecisionsTable.matchId)),
    executor.select().from(matchTieHistoryTable).where(eq(matchTieHistoryTable.tournamentId, tournamentId)).orderBy(asc(matchTieHistoryTable.id)),
  ]);
  if (legs.length === 0 && decisions.length === 0 && history.length === 0) return {};
  return {
    tieLegs: legs.map((leg) => ({
      matchBackupId: leg.matchId, leg: leg.leg as 1 | 2, status: leg.status, score1: leg.score1 ?? null, score2: leg.score2 ?? null,
      scheduledAt: iso(leg.scheduledAt), completedAt: iso(leg.completedAt), revision: leg.revision,
    })),
    ...(decisions.length ? {
      tieDecisions: decisions.map((decision) => ({
        matchBackupId: decision.matchId, winnerBackupId: decision.winnerId, reason: decision.reason, decidedAt: decision.decidedAt.toISOString(),
      })),
    } : {}),
    ...(history.length ? {
      tieHistory: history.map((entry) => ({
        matchBackupId: entry.matchId, event: entry.event, leg: (entry.leg as 1 | 2 | null) ?? null, score1: entry.score1 ?? null, score2: entry.score2 ?? null,
        winnerBackupId: entry.winnerId ?? null, reason: entry.reason ?? null, recordedAt: entry.recordedAt.toISOString(),
      })),
    } : {}),
  };
}

/**
 * Checks the sections against the matches and the stage rules: every non-bye tie of a two-legged stage has exactly
 * two legs; a completed tie's score is the aggregate of its legs and its winner follows from it (or, on a level
 * aggregate, from the organizer's decision, which must exist exactly then); nothing refers to other matches.
 */
export function validateTwoLegTies(backup: Backup, matchRulesByStage: ReadonlyMap<number, MatchRules | null>, playerIds: ReadonlySet<number>, errors: string[]): void {
  const matchesById = new Map<number, BackupMatch>(backup.matches.map((match) => [match.backupId, match]));
  const twoLegStages = new Set([...matchRulesByStage].filter(([, rules]) => rules?.kind === "two_legs").map(([stageId]) => stageId));
  const legsByMatch = new Map<number, NonNullable<Backup["tieLegs"]>>();
  for (const leg of backup.tieLegs ?? []) {
    const match = matchesById.get(leg.matchBackupId);
    if (!match || !twoLegStages.has(match.stageBackupId)) { errors.push(`Tie leg ${leg.matchBackupId}/${leg.leg} does not belong to a match of a two-legged stage.`); continue; }
    if (leg.leg !== 1 && leg.leg !== 2) errors.push(`Tie leg ${leg.matchBackupId}/${leg.leg} has an invalid leg number.`);
    if (!Number.isInteger(leg.revision) || leg.revision < 1) errors.push(`Tie leg ${leg.matchBackupId}/${leg.leg} has an invalid revision.`);
    if (leg.status === "completed") {
      if (!validateLegScore(leg.score1, leg.score2).ok || !validDate(leg.completedAt)) errors.push(`Tie leg ${leg.matchBackupId}/${leg.leg} is completed without a valid score and date.`);
    } else if (leg.score1 != null || leg.score2 != null || leg.completedAt != null) {
      errors.push(`Tie leg ${leg.matchBackupId}/${leg.leg} is pending but has a score.`);
    }
    if (leg.scheduledAt != null && !validDate(leg.scheduledAt)) errors.push(`Tie leg ${leg.matchBackupId}/${leg.leg} has an invalid date.`);
    const list = legsByMatch.get(leg.matchBackupId) ?? [];
    list.push(leg);
    legsByMatch.set(leg.matchBackupId, list);
  }
  const decisionByMatch = new Map((backup.tieDecisions ?? []).map((decision) => [decision.matchBackupId, decision]));
  for (const decision of backup.tieDecisions ?? []) {
    if (!legsByMatch.has(decision.matchBackupId)) errors.push(`Tie decision ${decision.matchBackupId} does not belong to a two-legged tie.`);
    if (!validateDecisionReason(decision.reason).ok || !validDate(decision.decidedAt)) errors.push(`Tie decision ${decision.matchBackupId} has an invalid reason or date.`);
    if (!playerIds.has(decision.winnerBackupId)) errors.push(`Tie decision ${decision.matchBackupId} refers to an unknown participant.`);
  }
  if ((backup.tieDecisions ?? []).length !== decisionByMatch.size) errors.push("Tie decisions contain duplicates.");
  for (const match of backup.matches) {
    if (!twoLegStages.has(match.stageBackupId) || match.resultType === "bye") continue;
    const legs = legsByMatch.get(match.backupId) ?? [];
    if (legs.length !== 2 || new Set(legs.map((leg) => leg.leg)).size !== 2) { errors.push(`Two-legged tie ${match.backupId} must have exactly legs 1 and 2.`); continue; }
    const aggregate = tieAggregate(legs.map((leg) => ({ leg: leg.leg as 1 | 2, status: leg.status, score1: leg.score1 ?? null, score2: leg.score2 ?? null })));
    const decision = decisionByMatch.get(match.backupId) ?? null;
    if (match.status === "completed") {
      if (match.resultType !== "played" || !aggregate.complete || match.score1 !== aggregate.total1 || match.score2 !== aggregate.total2) {
        errors.push(`Two-legged tie ${match.backupId}: its result must be the aggregate of both legs.`);
        continue;
      }
      const expected = aggregate.aggregateWinner != null
        ? (aggregate.aggregateWinner === 1 ? match.player1BackupId : match.player2BackupId)
        : decision?.winnerBackupId ?? null;
      if (expected == null || match.winnerBackupId !== expected) errors.push(`Two-legged tie ${match.backupId}: the winner does not follow from the aggregate or the organizer's decision.`);
      if (aggregate.aggregateWinner != null && decision) errors.push(`Two-legged tie ${match.backupId} has a decision although the aggregate decides it.`);
      if (decision && decision.winnerBackupId !== match.player1BackupId && decision.winnerBackupId !== match.player2BackupId) errors.push(`Two-legged tie ${match.backupId}: the decision names a non-participant.`);
    } else {
      if (decision) errors.push(`Two-legged tie ${match.backupId} is not decided but has a decision.`);
      const expectedStatus = aggregate.completedLegs > 0 ? "in_progress" : "pending";
      if (match.status !== expectedStatus && match.status !== "postponed") errors.push(`Two-legged tie ${match.backupId} should be ${expectedStatus} for its legs.`);
      if (aggregate.completedLegs > 0 && (match.player1BackupId == null || match.player2BackupId == null)) errors.push(`Two-legged tie ${match.backupId} has a played leg without both participants.`);
    }
  }
  for (const entry of backup.tieHistory ?? []) {
    if (!legsByMatch.has(entry.matchBackupId)) { errors.push(`Tie history ${entry.matchBackupId} does not belong to a two-legged tie.`); continue; }
    const legEvent = entry.event === "leg_recorded" || entry.event === "leg_reverted";
    const valid = legEvent
      ? (entry.leg === 1 || entry.leg === 2) && validateLegScore(entry.score1, entry.score2).ok && entry.winnerBackupId == null
      : entry.leg == null && entry.winnerBackupId != null && playerIds.has(entry.winnerBackupId) && validateDecisionReason(entry.reason).ok;
    if (!valid || !validDate(entry.recordedAt)) errors.push(`Tie history ${entry.matchBackupId} (${entry.event}) is malformed.`);
  }
}

/** Runs inside the import transaction, after matches were restored. */
export async function restoreTwoLegTies(
  tx: Tx,
  backup: Backup,
  tournamentId: number,
  matchIds: ReadonlyMap<number, number>,
  stageIdOfMatch: ReadonlyMap<number, number>,
  playerIds: ReadonlyMap<number, number>,
): Promise<{ legs: number; decisions: number }> {
  const legs = backup.tieLegs ?? [];
  const where = (matchBackupId: number) => ({ matchId: matchIds.get(matchBackupId)!, stageId: stageIdOfMatch.get(matchBackupId)!, tournamentId });
  if (legs.length) {
    await tx.insert(matchLegsTable).values(legs.map((leg) => ({
      ...where(leg.matchBackupId), leg: leg.leg, status: leg.status, score1: leg.score1 ?? null, score2: leg.score2 ?? null,
      scheduledAt: leg.scheduledAt == null ? null : new Date(leg.scheduledAt), completedAt: leg.completedAt == null ? null : new Date(leg.completedAt),
      revision: leg.revision,
    })));
  }
  const decisions = backup.tieDecisions ?? [];
  if (decisions.length) {
    await tx.insert(matchTieDecisionsTable).values(decisions.map((decision) => ({
      ...where(decision.matchBackupId), winnerId: playerIds.get(decision.winnerBackupId)!, reason: decision.reason.trim(), decidedAt: new Date(decision.decidedAt),
    })));
  }
  const history = backup.tieHistory ?? [];
  if (history.length) {
    await tx.insert(matchTieHistoryTable).values(history.map((entry) => ({
      ...where(entry.matchBackupId), event: entry.event, leg: entry.leg ?? null, score1: entry.score1 ?? null, score2: entry.score2 ?? null,
      winnerId: entry.winnerBackupId == null ? null : playerIds.get(entry.winnerBackupId)!, reason: entry.reason ?? null, recordedAt: new Date(entry.recordedAt),
    })));
  }
  return { legs: legs.length, decisions: decisions.length };
}
