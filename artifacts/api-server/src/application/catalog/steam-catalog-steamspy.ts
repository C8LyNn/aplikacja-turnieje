import { CatalogUpstreamTemporaryError, parseCatalogRetryAfter } from "./steam-catalog-upstream-retry";

/**
 * Unofficial SteamSpy "all" pages provide candidate Steam AppIDs only.
 * Every candidate MUST still pass the official Steam Store appdetails
 * type:game validation in the existing batch importer before DB insertion.
 *
 * SteamSpy documents a 60-second global poll interval for request=all.
 * The in-process limiter prevents overlapping calls from this API instance;
 * distributed deployments should additionally coordinate polling centrally.
 */
export type SteamSpyCandidate = { appId: number; name: string };
export type SteamSpyPageQuery = { page: number; offset: number; pageSize: number };

export const STEAMSPY_PAGE_CAP = 300;
export const STEAMSPY_SLICE_CAP = 100;
export const STEAMSPY_PAGE_ITEMS_CAP = 1_000;
export const STEAMSPY_POLL_INTERVAL_MS = 65_000;
export const STEAMSPY_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

export function parseSteamSpyPageRequest(raw: unknown): SteamSpyPageQuery | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const page = obj.page === undefined ? 0 : obj.page;
  const offset = obj.offset === undefined ? 0 : obj.offset;
  const pageSize = obj.pageSize === undefined ? STEAMSPY_SLICE_CAP : obj.pageSize;
  if (typeof page !== "number" || !Number.isSafeInteger(page) || page < 0 || page > STEAMSPY_PAGE_CAP ||
      typeof offset !== "number" || !Number.isSafeInteger(offset) || offset < 0 || offset >= STEAMSPY_PAGE_ITEMS_CAP ||
      typeof pageSize !== "number" || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > STEAMSPY_SLICE_CAP) {
    return null;
  }
  return { page, offset, pageSize };
}

export function parseSteamSpyAllPage(raw: unknown): SteamSpyCandidate[] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const found = new Map<number, SteamSpyCandidate>();
  for (const [key, rawEntry] of Object.entries(raw)) {
    if (!/^[1-9]\d*$/.test(key) || !rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) continue;
    const entry = rawEntry as Record<string, unknown>;
    const appId = Number(key);
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!Number.isSafeInteger(appId) || appId > 2_147_483_647 || !name) continue;
    if (entry.appid !== undefined && Number(entry.appid) !== appId) continue;
    found.set(appId, { appId, name: name.slice(0, 300) });
    if (found.size >= STEAMSPY_PAGE_ITEMS_CAP) break;
  }
  // An empty object is SteamSpy's end-of-list response. A nonempty
  // error/status object is not a valid terminal page: never silently
  // advance the browser cursor if the third party changes its format.
  if (!found.size && Object.keys(raw).length > 0) return null;
  return [...found.values()];
}

export class SteamSpyCooldownError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("SteamSpy: odczekaj przed pobraniem kolejnej strony.");
  }
}

export class SteamSpySourceError extends Error {
  constructor(
    public readonly status: number,
    public readonly retryAfterSeconds = 0,
  ) {
    super("Nie można pobrać aktualnej listy SteamSpy.");
  }
}

/**
 * Cache raw page candidates, not the database-specific exclusion result.
 * Re-check catalog membership on every HTTP call, even on cache hits.
 */
export function createSteamSpyPageCache(
  load: (page: number) => Promise<unknown>,
  now: () => number = Date.now,
) {
  const pages = new Map<number, { at: number; candidates: SteamSpyCandidate[] }>();
  const inFlight = new Map<number, Promise<SteamSpyCandidate[]>>();
  let lastAttempt = Number.NEGATIVE_INFINITY;

  return async (page: number): Promise<SteamSpyCandidate[]> => {
    const clock = now();
    const stored = pages.get(page);
    if (stored && clock - stored.at < STEAMSPY_CACHE_TTL_MS) return stored.candidates;
    const running = inFlight.get(page);
    if (running) return running;

    const remaining = STEAMSPY_POLL_INTERVAL_MS - (clock - lastAttempt);
    if (remaining > 0) throw new SteamSpyCooldownError(Math.ceil(remaining / 1_000));
    lastAttempt = clock; // Reserve the rate-limit slot before awaiting I/O.

    const pending = (async () => {
      const result = parseSteamSpyAllPage(await load(page));
      if (!result) throw new SteamSpySourceError(502);
      pages.delete(page);
      pages.set(page, { at: now(), candidates: result });
      if (pages.size > 3) pages.delete(pages.keys().next().value!);
      return result;
    })();
    inFlight.set(page, pending);
    try {
      return await pending;
    } finally {
      inFlight.delete(page);
    }
  };
}

export function sliceSteamSpyPage(
  games: SteamSpyCandidate[], query: SteamSpyPageQuery,
) {
  const candidates = games.slice(query.offset, query.offset + query.pageSize);
  const nextOffset = query.offset + candidates.length;
  const exhausted = nextOffset >= games.length;
  return {
    candidates,
    nextPage: exhausted ? query.page + 1 : query.page,
    nextOffset: exhausted ? 0 : nextOffset,
    hasMore: games.length > 0 && (nextOffset < games.length || games.length >= STEAMSPY_PAGE_ITEMS_CAP),
    scanned: candidates.length,
  };
}

/**
 * Shared by the HTTP discovery endpoint and the background import worker.
 * One Node process uses a single 65-second source throttle and page cache.
 * Multi-instance deployments still require distributed cross-replica pacing.
 */
const loadSteamSpyPage = async (page: number) => {
  const endpoint = new URL("https://steamspy.com/api.php");
  endpoint.searchParams.set("request", "all");
  endpoint.searchParams.set("page", String(page));
  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      headers: { "user-agent": "TournamentManagerGameCatalog/0.1" },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    if (error instanceof TypeError ||
        (error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name))) {
      throw new CatalogUpstreamTemporaryError("SteamSpy");
    }
    throw error;
  }
  if (!upstream.ok) throw new SteamSpySourceError(
    upstream.status, parseCatalogRetryAfter(upstream.headers.get("retry-after")),
  );
  return upstream.json();
};

let sharedSteamSpyPage = createSteamSpyPageCache(loadSteamSpyPage);
export const getSteamSpyPage = (page: number) => sharedSteamSpyPage(page);

/** Isolate in-memory source throttle/cache across independent DB integration cases. */
export function resetSteamSpyPageCacheForTests() {
  if (process.env.NODE_ENV !== "test") throw new Error("Test-only SteamSpy cache reset");
  sharedSteamSpyPage = createSteamSpyPageCache(loadSteamSpyPage);
}
