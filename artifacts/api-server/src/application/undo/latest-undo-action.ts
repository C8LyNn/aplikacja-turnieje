import { and, desc, eq, sql } from "drizzle-orm";
import { actionLogTable } from "@workspace/db/schema";
import type { db } from "@workspace/db";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class UndoActionChangedError extends Error {
  readonly code = "UNDO_ACTION_CHANGED";
  readonly status = 409;

  constructor() {
    super("Ostatnia akcja do cofnięcia uległa zmianie.");
    this.name = "UndoActionChangedError";
  }
}

/**
 * Caller must already hold the tournament mutation lock in this transaction.
 * Use exactly the same eligibility and ordering as the initial Undo selection.
 * Never release the lock or open another transaction before applying the Undo.
 */
export async function lockLatestUndoableAction(
  tx: Transaction,
  tournamentId: number,
  expectedActionId: number,
): Promise<typeof actionLogTable.$inferSelect & { undoPayload: string }> {
  const [latest] = await tx
    .select()
    .from(actionLogTable)
    .where(and(
      eq(actionLogTable.tournamentId, tournamentId),
      eq(actionLogTable.isUndone, false),
      sql`${actionLogTable.undoPayload} IS NOT NULL`,
    ))
    .orderBy(desc(actionLogTable.createdAt), desc(actionLogTable.id))
    .limit(1)
    .for("update");
  if (!latest || !latest.undoPayload || latest.id !== expectedActionId) {
    throw new UndoActionChangedError();
  }
  return { ...latest, undoPayload: latest.undoPayload };
}
