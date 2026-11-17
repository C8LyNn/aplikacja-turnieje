import { and, eq, isNull } from "drizzle-orm";
import { actionLogTable, matchesTable, tournamentStagesTable } from "@workspace/db";
import { generateRoundDates, schedulePlanFromStorage } from "../../domain/tournament/league-schedule";
import type { db } from "@workspace/db";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * V5.3: when a league/group stage with a schedule template starts, give every new pending match the date of
 * its round. Runs inside the start transaction. A template that cannot be applied (e.g. a DST-skipped local
 * time for a round count that changed since creation) never blocks the start: it is logged and skipped.
 */
export async function applySchedulePlanAtStart(
  tx: Transaction,
  stage: Pick<typeof tournamentStagesTable.$inferSelect, "id" | "tournamentId" | "name" | "schedulePlan" | "scheduleTimeZone">,
): Promise<{ applied: number; skippedReason: string | null } | null> {
  const plan = schedulePlanFromStorage(stage.schedulePlan, stage.scheduleTimeZone);
  if (!plan || !stage.scheduleTimeZone) return null;
  const matches = await tx.select({ id: matchesTable.id, round: matchesTable.round })
    .from(matchesTable)
    .where(and(eq(matchesTable.stageId, stage.id), eq(matchesTable.status, "pending"), isNull(matchesTable.scheduledAt)));
  if (matches.length === 0) return { applied: 0, skippedReason: null };
  const roundCount = Math.max(...matches.map((match) => match.round));
  const generated = generateRoundDates({ ...plan, timeZone: stage.scheduleTimeZone }, roundCount);
  if (!generated.ok) {
    await tx.insert(actionLogTable).values({
      tournamentId: stage.tournamentId,
      stageId: stage.id,
      actionType: "schedule_plan_skipped",
      description: `Terminarz etapu „${stage.name}” nie został ustawiony automatycznie: ${generated.message}`,
      undoPayload: null,
      isUndone: false,
    });
    return { applied: 0, skippedReason: generated.message };
  }
  const slot = new Map(generated.rounds.map((round) => [round.round, round.scheduledAt]));
  for (const match of matches) {
    await tx.update(matchesTable).set({ scheduledAt: slot.get(match.round)! }).where(eq(matchesTable.id, match.id));
  }
  await tx.insert(actionLogTable).values({
    tournamentId: stage.tournamentId,
    stageId: stage.id,
    actionType: "schedule_generated",
    description: `Terminarz etapu „${stage.name}”: ${roundCount} kolejek od ${plan.startDate}, co ${plan.intervalDays} dni, godz. ${plan.defaultTime} (${stage.scheduleTimeZone}); ustawiono ${matches.length} meczów.`,
    undoPayload: null,
    isUndone: false,
  });
  return { applied: matches.length, skippedReason: null };
}
