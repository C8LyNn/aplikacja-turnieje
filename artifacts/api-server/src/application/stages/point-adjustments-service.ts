/**
 * V5.5 · adding and revoking point adjustments. Organiser only, only on stages with a points table,
 * never on a completed stage (its places are part of the record). Each change bumps the stage version,
 * so qualification previews taken before it are recognised as stale.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { actionLogTable, db, playersTable, stageParticipantsTable, tournamentStagesTable, tournamentsTable } from "@workspace/db";
import { revalidateTournamentMutationActor, type TournamentMutationActor } from "../../access-policy";
import { leagueRulesFromStorage } from "../../domain/tournament/league-rules";
import {
  activePointTotals,
  isValidRequestId,
  pointAdjustmentsFromStorage,
  validateNewAdjustment,
  type PointAdjustment,
  type PointAdjustmentProblem,
} from "../../domain/tournament/point-adjustments";

export type PointAdjustmentErrorCode =
  | "STAGE_NOT_FOUND"
  | "POINT_ADJUSTMENTS_NOT_SUPPORTED"
  | "STAGE_COMPLETED"
  | "INVALID_POINT_ADJUSTMENT"
  | "POINT_ADJUSTMENT_NOT_FOUND"
  | "POINT_ADJUSTMENT_ALREADY_REVOKED";

const MESSAGES: Record<PointAdjustmentErrorCode, string> = {
  STAGE_NOT_FOUND: "Etap nie istnieje.",
  POINT_ADJUSTMENTS_NOT_SUPPORTED: "Korekty punktów są możliwe tylko w etapie z tabelą punktową (liga lub grupy z punktacją).",
  STAGE_COMPLETED: "Etap jest zakończony — jego tabela jest już częścią wyników i nie zmienia się.",
  INVALID_POINT_ADJUSTMENT: "Korekta jest niepoprawna.",
  POINT_ADJUSTMENT_NOT_FOUND: "Nie ma takiej korekty.",
  POINT_ADJUSTMENT_ALREADY_REVOKED: "Ta korekta została już cofnięta.",
};

export class PointAdjustmentError extends Error {
  constructor(public readonly code: PointAdjustmentErrorCode, public readonly problems: PointAdjustmentProblem[] = []) {
    super(MESSAGES[code]);
    this.name = "PointAdjustmentError";
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function lockStage(tx: Tx, tournamentId: number, stageId: number, actor?: TournamentMutationActor) {
  const [tournament] = await tx.select().from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId)).for("update");
  if (!tournament) throw new PointAdjustmentError("STAGE_NOT_FOUND");
  await revalidateTournamentMutationActor(tx, tournament, actor);
  const [stage] = await tx.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.id, stageId)).for("update");
  if (!stage || stage.tournamentId !== tournamentId) throw new PointAdjustmentError("STAGE_NOT_FOUND");
  if (!leagueRulesFromStorage(stage.leagueRules)) throw new PointAdjustmentError("POINT_ADJUSTMENTS_NOT_SUPPORTED");
  if (stage.status === "completed") throw new PointAdjustmentError("STAGE_COMPLETED");
  return stage;
}

export function pointAdjustmentView(stored: unknown) {
  const entries = pointAdjustmentsFromStorage(stored);
  return { entries, totals: [...activePointTotals(entries)].map(([playerId, points]) => ({ playerId, points })) };
}

/** Audit label of an actor: role plus a short credential fingerprint (the API has no personal identities). */
export function actorLabel(actor?: TournamentMutationActor): string {
  if (!actor) return "organizer:system";
  if (actor.type === "support") return `support:${String(actor.sessionId)}`;
  return `organizer:${actor.credentialFingerprint.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12) || "organizer"}`;
}

export async function addPointAdjustment(input: {
  tournamentId: number;
  stageId: number;
  body: { playerId?: unknown; points?: unknown; reason?: unknown; requestId?: unknown };
  actor?: TournamentMutationActor;
  now?: Date;
}) {
  return db.transaction(async (tx) => {
    const stage = await lockStage(tx, input.tournamentId, input.stageId, input.actor);
    const existing = pointAdjustmentsFromStorage(stage.pointAdjustments);
    if (input.body.requestId !== undefined && !isValidRequestId(input.body.requestId)) {
      throw new PointAdjustmentError("INVALID_POINT_ADJUSTMENT", [{ field: "entries", message: "Nieprawidłowy identyfikator żądania." }]);
    }
    // A retried or double-sent request (same key) returns the entry it already created — nothing is added twice.
    const replay = isValidRequestId(input.body.requestId) ? existing.find((entry) => entry.requestId === input.body.requestId) : undefined;
    if (replay) return { entry: replay, view: pointAdjustmentView(stage.pointAdjustments), stageVersion: stage.version, replayed: true };
    const members = await tx.select({ playerId: stageParticipantsTable.playerId }).from(stageParticipantsTable)
      .where(eq(stageParticipantsTable.stageId, stage.id));
    // Before the stage starts its participants are not frozen yet: any registered participant may be adjusted.
    const participantIds = new Set(
      members.length
        ? members.map((member) => member.playerId)
        : (await tx.select({ id: playersTable.id }).from(playersTable).where(eq(playersTable.tournamentId, input.tournamentId))).map((row) => row.id),
    );
    const checked = validateNewAdjustment(input.body, { participantIds, existing });
    if (!checked.ok) throw new PointAdjustmentError("INVALID_POINT_ADJUSTMENT", checked.problems);
    const entry: PointAdjustment = {
      id: randomUUID(),
      playerId: checked.value.playerId,
      points: checked.value.points,
      reason: checked.value.reason,
      createdAt: (input.now ?? new Date()).toISOString(),
      revokedAt: null,
      createdBy: actorLabel(input.actor),
      ...(isValidRequestId(input.body.requestId) ? { requestId: input.body.requestId } : {}),
    };
    const next = [...existing, entry];
    const [updated] = await tx.update(tournamentStagesTable)
      .set({ pointAdjustments: next, version: stage.version + 1 })
      .where(eq(tournamentStagesTable.id, stage.id)).returning();
    const [player] = await tx.select({ name: playersTable.name }).from(playersTable)
      .where(and(eq(playersTable.id, entry.playerId), eq(playersTable.tournamentId, input.tournamentId)));
    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "stage_point_adjustment_added",
      description: `${stage.name}: ${entry.points > 0 ? "+" : ""}${entry.points} pkt dla ${player?.name ?? `#${entry.playerId}`} — ${entry.reason}`,
      isUndone: false,
    });
    return { entry, view: pointAdjustmentView(updated!.pointAdjustments), stageVersion: updated!.version, replayed: false };
  });
}

export async function revokePointAdjustment(input: {
  tournamentId: number;
  stageId: number;
  adjustmentId: string;
  actor?: TournamentMutationActor;
  now?: Date;
}) {
  return db.transaction(async (tx) => {
    const stage = await lockStage(tx, input.tournamentId, input.stageId, input.actor);
    const existing = pointAdjustmentsFromStorage(stage.pointAdjustments);
    const target = existing.find((entry) => entry.id === input.adjustmentId);
    if (!target) throw new PointAdjustmentError("POINT_ADJUSTMENT_NOT_FOUND");
    if (target.revokedAt) throw new PointAdjustmentError("POINT_ADJUSTMENT_ALREADY_REVOKED");
    const revokedAt = (input.now ?? new Date()).toISOString();
    const next = existing.map((entry) => (entry.id === target.id ? { ...entry, revokedAt, revokedBy: actorLabel(input.actor) } : entry));
    const [updated] = await tx.update(tournamentStagesTable)
      .set({ pointAdjustments: next, version: stage.version + 1 })
      .where(eq(tournamentStagesTable.id, stage.id)).returning();
    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "stage_point_adjustment_revoked",
      description: `${stage.name}: cofnięto korektę ${target.points > 0 ? "+" : ""}${target.points} pkt (${target.reason})`,
      isUndone: false,
    });
    return { view: pointAdjustmentView(updated!.pointAdjustments), stageVersion: updated!.version };
  });
}
