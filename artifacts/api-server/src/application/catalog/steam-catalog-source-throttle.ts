import { pool } from "@workspace/db";

/**
 * One database-wide upstream SteamSpy "all" request slot per 65 seconds.
 * INSERT..ON CONFLICT with a guarded UPDATE is atomic between API replicas;
 * no PostgreSQL row lock is kept during the remote HTTP request.
 *
 * An attempted request consumes the slot even if the upstream fails or the
 * worker crashes. This is intentional: a retry must not exceed the limit.
 */
export async function reserveGlobalSteamSpyPollSlot(intervalMs: number): Promise<number> {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 60_000) {
    throw new Error("Invalid SteamSpy poll interval");
  }
  const claimed = await pool.query(
    `INSERT INTO steam_catalog_source_poll_limiter
       (source, next_allowed_at, updated_at)
     VALUES ('steamspy_all', now() + ($1::integer * interval '1 millisecond'), now())
     ON CONFLICT (source) DO UPDATE SET
       next_allowed_at = EXCLUDED.next_allowed_at,
       updated_at = EXCLUDED.updated_at
     WHERE steam_catalog_source_poll_limiter.next_allowed_at <= now()
     RETURNING source`,
    [intervalMs],
  );
  if (claimed.rowCount) return 0;
  const retry = await pool.query<{ seconds: number }>(
    `SELECT GREATEST(1,CEIL(EXTRACT(EPOCH FROM (next_allowed_at - now())))::integer)
       AS seconds
     FROM steam_catalog_source_poll_limiter WHERE source='steamspy_all'`,
  );
  // Fail closed if an unexpected concurrent schema/data change removed row.
  return Math.max(1, retry.rows[0]?.seconds ?? Math.ceil(intervalMs / 1_000));
}
