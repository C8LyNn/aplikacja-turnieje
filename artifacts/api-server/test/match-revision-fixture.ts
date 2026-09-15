/** Explicitly read the version a test's simulated operator is about to use.
 * Stale/concurrency tests must retain their earlier version instead of rereading it.
 */
export async function matchRevision(database: Pick<typeof import("@workspace/db"), "pool">, matchId: number): Promise<number> {
  const result = await database.pool.query<{ revision: number }>("SELECT revision FROM matches WHERE id=$1", [matchId]);
  if (!result.rows[0]) throw new Error(`Test match ${matchId} does not exist`);
  return result.rows[0].revision;
}
