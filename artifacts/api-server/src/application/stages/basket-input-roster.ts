import { and, asc, eq, inArray } from "drizzle-orm";
import {
  stageBasketParticipantsTable, stageBasketRouteEntriesTable, stageBasketRouteExecutionsTable,
  stageBasketRoutesTable, stageBasketsTable, stageParticipantsTable, tournamentStagesTable,
} from "@workspace/db/schema";
import type { db } from "@workspace/db";
import { StageLifecycleError } from "./stage-lifecycle-error";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Reader = Pick<Transaction, "select">;
type Stage = typeof tournamentStagesTable.$inferSelect;
type Entry = Pick<typeof stageParticipantsTable.$inferInsert,
  "playerId" | "stageSeed" | "qualificationSource" | "sourceStageParticipantId">;

/** Read-only authoritative input, shared by readiness and transactional start. */
export async function loadBasketInputRoster(reader: Reader, stage: Stage): Promise<Entry[]> {
  const baskets = await reader.select().from(stageBasketsTable).where(and(
    eq(stageBasketsTable.tournamentId, stage.tournamentId),
    eq(stageBasketsTable.stageId, stage.id), eq(stageBasketsTable.basketType, "input"),
  )).orderBy(asc(stageBasketsTable.displayOrder), asc(stageBasketsTable.id));
  if (!baskets.length) throw new StageLifecycleError("STAGE_BASKET_CONFIGURATION_INVALID");
  const basketIds = baskets.map((basket) => basket.id);
  const direct = await reader.select().from(stageBasketParticipantsTable).where(and(
    eq(stageBasketParticipantsTable.tournamentId, stage.tournamentId),
    eq(stageBasketParticipantsTable.stageId, stage.id), inArray(stageBasketParticipantsTable.basketId, basketIds),
  )).orderBy(asc(stageBasketParticipantsTable.playerId));
  const routes = await reader.select().from(stageBasketRoutesTable).where(and(
    eq(stageBasketRoutesTable.tournamentId, stage.tournamentId),
    eq(stageBasketRoutesTable.targetStageId, stage.id),
  )).orderBy(asc(stageBasketRoutesTable.id));
  const arrivals = await reader.select().from(stageBasketRouteEntriesTable).where(and(
    eq(stageBasketRouteEntriesTable.tournamentId, stage.tournamentId),
    eq(stageBasketRouteEntriesTable.targetStageId, stage.id),
  )).orderBy(asc(stageBasketRouteEntriesTable.sourceFinalRank), asc(stageBasketRouteEntriesTable.playerId));
  const executions = routes.length ? await reader.select().from(stageBasketRouteExecutionsTable).where(and(
    eq(stageBasketRouteExecutionsTable.tournamentId, stage.tournamentId),
    inArray(stageBasketRouteExecutionsTable.routeId, routes.map((route) => route.id)),
  )) : [];
  for (const route of routes) {
    const execution = executions.find((entry) => entry.routeId === route.id);
    const [source] = await reader.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.id, route.sourceStageId));
    const [output] = await reader.select().from(stageBasketsTable).where(eq(stageBasketsTable.id, route.sourceBasketId));
    const routed = arrivals.filter((entry) => entry.routeId === route.id);
    if (!execution || source?.status !== "completed" || !output?.qualifierCount ||
        routed.length !== output.qualifierCount || routed.some((entry) => entry.executionId !== execution.id)) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
  }
  if (arrivals.some((entry) => !routes.some((route) => route.id === entry.routeId && route.targetBasketId === entry.targetBasketId))) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  const sourceMembers = arrivals.length ? await reader.select().from(stageParticipantsTable).where(and(
    eq(stageParticipantsTable.tournamentId, stage.tournamentId),
    inArray(stageParticipantsTable.stageId, [...new Set(arrivals.map((entry) => entry.sourceStageId))]),
  )) : [];
  const entries: Entry[] = [];
  for (const basket of baskets) {
    for (const entry of direct.filter((entry) => entry.basketId === basket.id)) {
      entries.push({ playerId: entry.playerId, stageSeed: entries.length + 1, qualificationSource: "registration", sourceStageParticipantId: null });
    }
    for (const route of routes.filter((route) => route.targetBasketId === basket.id)) {
      for (const arrival of arrivals.filter((entry) => entry.routeId === route.id)) {
        const source = sourceMembers.find((entry) => entry.stageId === arrival.sourceStageId && entry.playerId === arrival.playerId);
        if (!source) throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
        entries.push({ playerId: arrival.playerId, stageSeed: entries.length + 1,
          qualificationSource: source.groupId == null ? "standings" : "group_position", sourceStageParticipantId: source.id });
      }
    }
  }
  if (entries.length !== stage.participantCount || entries.length < 2 ||
      new Set(entries.map((entry) => entry.playerId)).size !== entries.length) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  return entries;
}

/** Called only by startStage, after its tournament/stage locks and freeze checks. */
export async function materializeBasketInputRoster(tx: Transaction, stage: Stage, entries: Entry[]) {
  if (stage.status !== "planned") throw new StageLifecycleError("STAGE_ALREADY_STARTED");
  const existing = await tx.select().from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.stageId, stage.id)).for("update");
  const rosterIds = new Set(entries.map((entry) => entry.playerId));
  const obsolete = existing.filter((entry) => !rosterIds.has(entry.playerId));
  if (obsolete.length) await tx.delete(stageParticipantsTable).where(inArray(stageParticipantsTable.id, obsolete.map((entry) => entry.id)));
  for (const entry of entries) {
    const previous = existing.find((member) => member.playerId === entry.playerId);
    if (previous) {
      await tx.update(stageParticipantsTable).set(entry).where(eq(stageParticipantsTable.id, previous.id));
    } else {
      await tx.insert(stageParticipantsTable).values({ ...entry, tournamentId: stage.tournamentId, stageId: stage.id });
    }
  }
  return tx.select().from(stageParticipantsTable).where(eq(stageParticipantsTable.stageId, stage.id))
    .orderBy(asc(stageParticipantsTable.stageSeed));
}
