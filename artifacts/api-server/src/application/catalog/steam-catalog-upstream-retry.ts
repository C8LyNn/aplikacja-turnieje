/**
 * Bounded retries for temporary upstream failures. Never log or surface the
 * full request URL: Steam Web API discovery URLs contain a server secret.
 */
export const MAX_CATALOG_UPSTREAM_RETRIES = 5;
const MAX_SERVER_RETRY_AFTER_SECONDS = 24 * 60 * 60;
const MAX_EXPONENTIAL_BACKOFF_SECONDS = 30 * 60;

export class CatalogUpstreamTemporaryError extends Error {
  constructor(
    public readonly source: "Steam discovery" | "Steam Store" | "SteamSpy",
    public readonly retryAfterSeconds: number = 0,
  ) {
    super(source + " temporarily unavailable.");
    this.name = "CatalogUpstreamTemporaryError";
  }
}

export function isTemporaryUpstreamStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

/** Retry-After: integer delta seconds or HTTP date, capped at 24 hours. */
export function parseCatalogRetryAfter(
  value: string | null,
  nowMs: number = Date.now(),
): number {
  if (!value) return 0;
  const trimmed = value.trim();
  const seconds = /^\d+$/.test(trimmed)
    ? Number(trimmed)
    : (Date.parse(trimmed) - nowMs) / 1_000;
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.min(MAX_SERVER_RETRY_AFTER_SECONDS, Math.ceil(seconds));
}

export function catalogRetryDelaySeconds(
  attempt: number,
  serverRetryAfterSeconds = 0,
): number {
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > MAX_CATALOG_UPSTREAM_RETRIES) {
    throw new Error("Invalid Steam catalog retry attempt");
  }
  const exponential = Math.min(MAX_EXPONENTIAL_BACKOFF_SECONDS, 30 * (2 ** (attempt - 1)));
  const hint = Number.isFinite(serverRetryAfterSeconds)
    ? Math.max(0, Math.min(MAX_SERVER_RETRY_AFTER_SECONDS, Math.ceil(serverRetryAfterSeconds)))
    : 0;
  return Math.max(exponential, hint);
}

/**
 * Fetch only from caller-constructed fixed Steam endpoints. HTTP 429/5xx
 * and network timeouts are retryable. All other failures pause the job.
 */
export async function fetchCatalogUpstream(
  url: URL,
  source: "Steam discovery" | "Steam Store",
  timeoutMs: number = 12_000,
): Promise<Response> {
  let result: Response;
  try {
    result = await fetch(url, {
      headers: { "user-agent": "TournamentManagerGameCatalog/0.1" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof TypeError || (error instanceof DOMException &&
      ["AbortError", "TimeoutError"].includes(error.name))) {
      throw new CatalogUpstreamTemporaryError(source);
    }
    throw error;
  }
  if (isTemporaryUpstreamStatus(result.status)) {
    throw new CatalogUpstreamTemporaryError(
      source, parseCatalogRetryAfter(result.headers.get("retry-after")),
    );
  }
  if (!result.ok) throw new Error(source + " rejected the request.");
  return result;
}
