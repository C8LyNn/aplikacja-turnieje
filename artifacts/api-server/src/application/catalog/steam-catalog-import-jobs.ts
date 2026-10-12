import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { getSteamSpyPage, STEAMSPY_PAGE_CAP, SteamSpyCooldownError, SteamSpySourceError } from "./steam-catalog-steamspy";
import {
  CatalogUpstreamTemporaryError, MAX_CATALOG_UPSTREAM_RETRIES,
  catalogRetryDelaySeconds, fetchCatalogUpstream, isTemporaryUpstreamStatus,
} from "./steam-catalog-upstream-retry";
import {
  parseSteamDetailedGame, parseSteamDiscoveryPage,
  type SteamDiscoveryCandidate,
} from "./steam-catalog-growth";

export type ImportJobSource = "steam" | "steamspy";
type ImportJobStatus = "running" | "paused" | "completed";
type JobRow = {
  id: string; status: ImportJobStatus; source: ImportJobSource;
  source_page: number; steam_cursor: number;
  pending: SteamDiscoveryCandidate[]; has_more: boolean; max_games: number;
  processed: number; inserted: number; existing: number; ignored: number;
  failed: number; scanned: number; pause_requested: boolean;
  retry_count: number; next_run_at: Date;
  lease_token: string | null; last_error: string | null;
  created_at: Date; updated_at: Date; finished_at: Date | null;
};
type ImportOutcome = "inserted" | "existing" | "ignored";
type Step = {
  cursor: number; sourcePage: number; hasMore: boolean; pending: SteamDiscoveryCandidate[];
  scanned: number; processed: number; inserted: number;
  existing: number; ignored: number; failed: number;
  newGame?: NonNullable<ReturnType<typeof parseSteamDetailedGame>>;
};

function view(job: JobRow) {
  return {
    id: job.id, status: job.status, source: job.source,
    sourcePage: job.source_page, cursor: job.steam_cursor,
    pending: job.pending.length, hasMore: job.has_more, maxGames: job.max_games,
    processed: job.processed, inserted: job.inserted,
    existing: job.existing, ignored: job.ignored, failed: job.failed,
    scanned: job.scanned, pauseRequested: job.pause_requested,
    retryCount: job.retry_count, nextRunAt: job.next_run_at,
    lastError: job.last_error,
    createdAt: job.created_at, updatedAt: job.updated_at,
    finishedAt: job.finished_at,
  };
}

export async function createCatalogImportJob(
  maxGames: number, source: ImportJobSource = "steam",
) {
  if (!Number.isInteger(maxGames) || maxGames < 1 || maxGames > 20_000) {
    throw new Error("INVALID_JOB_LIMIT");
  }
  try {
    // Continue where the previous completed batch ended. The last discovery
    // page may still contain unprocessed candidates; preserve both its cursor
    // AND pending IDs so chaining 20k-ID jobs never skips or rescans them.
    const previous = await pool.query<JobRow>(
      "SELECT * FROM steam_catalog_import_jobs WHERE source = $1 ORDER BY id DESC LIMIT 1",
      [source],
    );
    const last = previous.rows[0];
    const canContinue = last?.status === "completed" &&
      (last.has_more || last.pending.length > 0);
    const cursor = canContinue ? last.steam_cursor : 0;
    const sourcePage = canContinue ? last.source_page : 0;
    const pending = canContinue ? last.pending : [];
    const hasMore = canContinue ? last.has_more : true;
    const result = await pool.query<JobRow>(`
      INSERT INTO steam_catalog_import_jobs
        (max_games, source, steam_cursor, source_page, pending, has_more)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *
    `, [maxGames, source, cursor, sourcePage, JSON.stringify(pending), hasMore]);
    return view(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new Error("ACTIVE_JOB_EXISTS");
    throw error;
  }
}

export async function latestCatalogImportJob() {
  const result = await pool.query<JobRow>(
    "SELECT * FROM steam_catalog_import_jobs ORDER BY id DESC LIMIT 1",
  );
  return result.rows[0] ? view(result.rows[0]) : null;
}

export async function pauseCatalogImportJob(id: number) {
  const result = await pool.query<JobRow>(`
    UPDATE steam_catalog_import_jobs SET
      pause_requested = true,
      status = CASE WHEN lease_token IS NULL THEN 'paused' ELSE status END,
      updated_at = now()
    WHERE id = $1 AND status = 'running' RETURNING *
  `, [id]);
  return result.rows[0] ? view(result.rows[0]) : null;
}

export async function resumeCatalogImportJob(id: number) {
  try {
    const result = await pool.query<JobRow>(`
      UPDATE steam_catalog_import_jobs SET status = 'running',
        pause_requested = false, last_error = NULL, retry_count = 0,
        next_run_at = now(), lease_token = NULL,
        lease_expires_at = NULL, updated_at = now()
      WHERE id = $1 AND status = 'paused' RETURNING *
    `, [id]);
    return result.rows[0] ? view(result.rows[0]) : null;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new Error("ACTIVE_JOB_EXISTS");
    throw error;
  }
}

async function discover(job: JobRow): Promise<Step> {
  const key = process.env.STEAM_WEB_API_KEY?.trim();
  if (!key || !/^[a-f0-9]{32}$/i.test(key)) {
    throw new Error("Missing server STEAM_WEB_API_KEY");
  }
  const url = new URL("https://api.steampowered.com/IStoreService/GetAppList/v1/");
  url.searchParams.set("key", key);
  url.searchParams.set("last_appid", String(job.steam_cursor));
  url.searchParams.set("max_results", "100");
  for (const [param, value] of Object.entries({
    include_games: "true", include_dlc: "false", include_software: "false",
    include_videos: "false", include_hardware: "false",
  })) url.searchParams.set(param, value);

  const result = await fetchCatalogUpstream(url, "Steam discovery");
  const parsed = parseSteamDiscoveryPage(await result.json(), job.steam_cursor);
  if (!parsed) throw new Error("Invalid Steam discovery page");
  return {
    cursor: parsed.nextCursor, sourcePage: job.source_page, pending: parsed.games,
    hasMore: parsed.hasMore, scanned: parsed.games.length,
    processed: 0, inserted: 0, existing: 0, ignored: 0, failed: 0,
  };
}

/**
 * Unofficial SteamSpy supplies candidate IDs only. The existing importOne
 * always validates each candidate against Steam Store before DB insertion.
 * A completed 1,000-ID page advances the durable source_page atomically.
 */
async function discoverSteamSpy(job: JobRow): Promise<Step> {
  if (job.source_page > STEAMSPY_PAGE_CAP) {
    return {
      cursor: job.steam_cursor, sourcePage: job.source_page,
      pending: [], hasMore: false, scanned: 0,
      processed: 0, inserted: 0, existing: 0, ignored: 0, failed: 0,
    };
  }
  const page = await getSteamSpyPage(job.source_page);
  return {
    cursor: job.steam_cursor,
    sourcePage: job.source_page + 1,
    pending: page,
    hasMore: page.length === 1_000 && job.source_page < STEAMSPY_PAGE_CAP,
    scanned: page.length,
    processed: 0, inserted: 0, existing: 0, ignored: 0, failed: 0,
  };
}

async function importOne(job: JobRow): Promise<Step> {
  const candidate = job.pending[0];
  if (!candidate) throw new Error("Empty Steam candidate queue");
  const step: Step = {
    cursor: job.steam_cursor, sourcePage: job.source_page,
    pending: job.pending.slice(1),
    hasMore: job.has_more, scanned: 0, processed: 1,
    inserted: 0, existing: 0, ignored: 0, failed: 0,
  };
  const already = await pool.query(
    "SELECT 1 FROM steam_catalog_games WHERE steam_app_id = $1 LIMIT 1", [candidate.appId],
  );
  if (already.rowCount) {
    step.existing = 1;
    return step;
  }
  const url = new URL("https://store.steampowered.com/api/appdetails");
  url.searchParams.set("appids", String(candidate.appId));
  url.searchParams.set("l", "english");
  const result = await fetchCatalogUpstream(url, "Steam Store");
  const raw = await result.json() as Record<string, { success?: boolean; data?: unknown }>;
  const record = raw?.[String(candidate.appId)];
  if (!record?.success || !record.data) {
    step.ignored = 1;
    return step;
  }
  const parsed = parseSteamDetailedGame(candidate.appId, record.data);
  if (!parsed) {
    step.ignored = 1;
    return step;
  }
  step.newGame = parsed;
  return step;
}

/** Claim one step with a cross-process PostgreSQL lease. Only the worker
 * holding the lease token may checkpoint its result. */
export async function runCatalogImportStep(): Promise<boolean> {
  const token = randomUUID();
  const claim = await pool.query<JobRow>(`
    WITH candidate AS (
      SELECT id FROM steam_catalog_import_jobs
      WHERE status = 'running' AND next_run_at <= now()
        AND (lease_token IS NULL OR lease_expires_at < now())
      ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    UPDATE steam_catalog_import_jobs AS job SET
      lease_token = $1::uuid,
      lease_expires_at = now() + interval '40 seconds', updated_at = now()
    FROM candidate WHERE job.id = candidate.id RETURNING job.*
  `, [token]);
  const job = claim.rows[0];
  if (!job) return false;

  try {
    const step: Step = job.pause_requested || job.processed >= job.max_games ||
      (!job.pending.length && !job.has_more)
      ? {
          cursor: job.steam_cursor, sourcePage: job.source_page,
          pending: job.pending, hasMore: job.has_more,
          scanned: 0, processed: 0, inserted: 0, existing: 0, ignored: 0, failed: 0,
        }
      : job.pending.length ? await importOne(job)
        : job.source === "steamspy" ? await discoverSteamSpy(job) : await discover(job);

    // Commit a game insert and the job cursor/counters in ONE DB transaction.
    // If a process dies, there is no half-acknowledged insertion.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const lease = await client.query<JobRow>(
        "SELECT * FROM steam_catalog_import_jobs WHERE id = $1 AND lease_token = $2::uuid FOR UPDATE",
        [job.id, token],
      );
      if (!lease.rows[0]) {
        await client.query("ROLLBACK");
        return true; // lease expired/reclaimed, another worker owns the step
      }
      let inserted = step.inserted;
      let existing = step.existing;
      if (step.newGame) {
        const g = step.newGame;
        const result = await client.query(`
          INSERT INTO steam_catalog_games
            (steam_app_id, name, steam_url, header_image_url, developer, publisher,
             release_date, short_description, steam_raw_data, source_updated_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
          ON CONFLICT (steam_app_id) DO NOTHING RETURNING id
        `, [g.steamAppId, g.name, g.steamUrl, g.headerImageUrl,
            g.developer, g.publisher, g.releaseDate, g.shortDescription,
            JSON.stringify(g.steamRawData), g.sourceUpdatedAt, g.updatedAt]);
        if (result.rowCount) inserted++;
        else existing++;
      }
      const progress = lease.rows[0];
      const processed = progress.processed + step.processed;
      const finished = processed >= progress.max_games ||
        (step.pending.length === 0 && !step.hasMore);
      const newStatus: ImportJobStatus = progress.pause_requested ? "paused" :
        finished ? "completed" : "running";
      await client.query(`
        UPDATE steam_catalog_import_jobs SET
          steam_cursor = $3, pending = $4::jsonb, has_more = $5,
          source_page = $13,
          scanned = scanned + $6, processed = processed + $7,
          inserted = inserted + $8, existing = existing + $9,
          ignored = ignored + $10, failed = failed + $11,
          status = $12, pause_requested = false, last_error = NULL,
          retry_count = 0,
          lease_token = NULL, lease_expires_at = NULL,
          next_run_at = now() + interval '1 second',
          finished_at = CASE WHEN $12 = 'completed' THEN now() ELSE finished_at END,
          updated_at = now()
        WHERE id = $1 AND lease_token = $2::uuid
      `, [job.id, token, step.cursor, JSON.stringify(step.pending), step.hasMore,
        step.scanned, step.processed, inserted, existing, step.ignored,
        step.failed, newStatus, step.sourcePage]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    // A same-process SteamSpy poll from the UI may have consumed the shared
    // rate-limit slot. Delay this job without marking it failed or advancing
    // any checkpoint. The next worker tick will resume after cooldown.
    if (error instanceof SteamSpyCooldownError) {
      await pool.query(`
        UPDATE steam_catalog_import_jobs
        SET next_run_at = now() + ($3::integer * interval '1 second'),
            status = CASE WHEN pause_requested THEN 'paused' ELSE status END,
            pause_requested = false,
            lease_token = NULL, lease_expires_at = NULL, updated_at = now()
        WHERE id = $1 AND lease_token = $2::uuid
      `, [job.id, token, Math.max(1, error.retryAfterSeconds)]);
      return true;
    }
    const temporary = error instanceof CatalogUpstreamTemporaryError
      ? error
      : error instanceof SteamSpySourceError && isTemporaryUpstreamStatus(error.status)
        ? new CatalogUpstreamTemporaryError("SteamSpy", error.retryAfterSeconds)
        : null;
    if (temporary) {
      // The lease guards retries as well as successful checkpoints.
      // Never advance pending AppIDs or discovery cursors on an upstream failure.
      const attempts = job.retry_count + 1;
      const exhausted = attempts >= MAX_CATALOG_UPSTREAM_RETRIES;
      const delaySeconds = exhausted ? 0 : catalogRetryDelaySeconds(
        attempts, temporary.retryAfterSeconds,
      );
      const safeReason = exhausted
        ? temporary.message + " Retry limit reached; resume manually."
        : temporary.message + " Automatic retry scheduled.";
      await pool.query(`
        UPDATE steam_catalog_import_jobs
        SET retry_count = $3,
            next_run_at = now() + ($4::integer * interval '1 second'),
            status = CASE WHEN pause_requested OR $5::boolean THEN 'paused' ELSE 'running' END,
            pause_requested = false, last_error = $6,
            lease_token = NULL, lease_expires_at = NULL, updated_at = now()
        WHERE id = $1 AND lease_token = $2::uuid
      `, [job.id, token, attempts, delaySeconds, exhausted, safeReason]);
      return true;
    }
    // No unbounded retry loop. A paused job can be resumed explicitly after
    // Steam recovers; avoid writing key-bearing upstream URLs to the database.
    // Unknown driver/parser errors could contain URL query parameters or
    // credentials. Do not persist raw error strings in operator-facing APIs.
    const reason = error instanceof Error &&
      (error.message === "Missing server STEAM_WEB_API_KEY" ||
        error.message === "Invalid Steam discovery page")
      ? error.message : "Steam import failed; inspect private server logs.";
    await pool.query(`
      UPDATE steam_catalog_import_jobs SET status = 'paused',
        pause_requested = false, last_error = $3,
        lease_token = NULL, lease_expires_at = NULL, updated_at = now()
      WHERE id = $1 AND lease_token = $2::uuid
    `, [job.id, token, reason.slice(0, 200)]);
  }
  return true;
}

/** Start only in real API process, never in tests or request constructors. */
export function startCatalogImportWorker() {
  if (process.env.NODE_ENV === "test") return () => {};
  let busy = false;
  const interval = setInterval(() => {
    if (busy) return;
    busy = true;
    void runCatalogImportStep()
      .catch((error: unknown) => {
        // A DB outage does not crash unrelated tournament endpoints. The next
        // tick retries the lease claim, and PostgreSQL will reclaim stale work.
        process.stderr.write("Steam catalog worker: " +
          (error instanceof Error ? error.message : "unknown error") + "\n");
      })
      .finally(() => { busy = false; });
  }, 1_000);
  interval.unref();
  return () => clearInterval(interval);
}
