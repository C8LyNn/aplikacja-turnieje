/** Explicitly read the version a test's simulated operator is about to use.
 * Stale/concurrency tests must retain their earlier version instead of rereading it.
 */
export async function matchRevision(database: Pick<typeof import("@workspace/db"), "pool">, matchId: number): Promise<number> {
  const result = await database.pool.query<{ revision: number }>("SELECT revision FROM matches WHERE id=$1", [matchId]);
  if (!result.rows[0]) throw new Error(`Test match ${matchId} does not exist`);
  return result.rows[0].revision;
}

/** V5.7 · the match date a simulated operator saw (ISO or null), for guarded schedule changes. */
export async function matchScheduledAt(database: Pick<typeof import("@workspace/db"), "pool">, matchId: number): Promise<string | null> {
  // scheduled_at is a UTC instant stored without a zone; read it as UTC (the pg driver would assume local time).
  const result = await database.pool.query<{ at: string | null }>(
    `SELECT to_char(scheduled_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS at FROM matches WHERE id=$1`, [matchId]);
  if (!result.rows[0]) throw new Error(`Test match ${matchId} does not exist`);
  return result.rows[0].at;
}

/** V5.7 · the action a simulated operator sees as the last undoable one (undo-last requires it). */
export async function lastUndoableActionId(database: Pick<typeof import("@workspace/db"), "pool">, tournamentId: number): Promise<number> {
  const result = await database.pool.query<{ id: number }>(
    "SELECT id FROM action_log WHERE tournament_id=$1 AND is_undone=false AND undo_payload IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 1",
    [tournamentId],
  );
  return result.rows[0]?.id ?? 0;
}
