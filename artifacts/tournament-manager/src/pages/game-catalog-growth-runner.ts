/**
 * One explicitly user-started, bounded Steam catalog import session.
 *
 * No background job or browser timers: the caller must keep the page open.
 * Every completed step is checkpointed so the next session resumes safely.
 * Server-side AppID uniqueness prevents duplicate inserts on uncertain writes.
 */
export type SteamGrowthGame = { appId: number; name: string };
export type SteamGrowthStats = {
  inserted: number;
  existing: number;
  ignored: number;
  failed: number;
  scanned: number;
  batches: number;
};
export type SteamGrowthProgress = {
  cursor: number;
  candidates: SteamGrowthGame[];
  hasMore: boolean;
  stats: SteamGrowthStats;
};
export type SteamDiscoveryPage = {
  candidates: SteamGrowthGame[];
  nextCursor: number;
  hasMore: boolean;
  scanned: number;
  alreadyInCatalog: number;
};
export type SteamBatchResult = {
  appId: number;
  status: "inserted" | "existing" | "not_game" | "missing" | "upstream_error";
};
export type SteamBatchResponse = {
  requested: number;
  processed: number;
  inserted: number;
  existing: number;
  ignored: number;
  failed: number;
  aborted: boolean;
  rateLimited: boolean;
  results: SteamBatchResult[];
};

export const EMPTY_STEAM_GROWTH: SteamGrowthProgress = {
  cursor: 0, candidates: [], hasMore: true,
  stats: { inserted: 0, existing: 0, ignored: 0, failed: 0, scanned: 0, batches: 0 },
};
const MAX_PENDING = 200;

function finiteCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function readSteamGrowthProgress(raw: string | null): SteamGrowthProgress {
  try {
    const stored: unknown = raw ? JSON.parse(raw) : null;
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return structuredClone(EMPTY_STEAM_GROWTH);
    const obj = stored as Record<string, unknown>;
    if (!Number.isSafeInteger(obj.cursor) || (obj.cursor as number) < 0 ||
        (obj.cursor as number) > 2_147_483_647 || !Array.isArray(obj.candidates) ||
        typeof obj.hasMore !== "boolean") return structuredClone(EMPTY_STEAM_GROWTH);
    const candidates = new Map<number, SteamGrowthGame>();
    for (const value of obj.candidates) {
      if (!value || typeof value !== "object") continue;
      const game = value as Record<string, unknown>;
      if (typeof game.name !== "string" || !Number.isSafeInteger(game.appId) ||
          (game.appId as number) <= 0 || (game.appId as number) > 2_147_483_647) continue;
      candidates.set(game.appId as number, { appId: game.appId as number, name: game.name.slice(0, 300) });
      if (candidates.size >= MAX_PENDING) break;
    }
    const stats = obj.stats && typeof obj.stats === "object" ? obj.stats as Record<string, unknown> : {};
    return {
      cursor: obj.cursor as number, hasMore: obj.hasMore, candidates: [...candidates.values()],
      stats: {
        inserted: finiteCount(stats.inserted), existing: finiteCount(stats.existing),
        ignored: finiteCount(stats.ignored), failed: finiteCount(stats.failed),
        scanned: finiteCount(stats.scanned), batches: finiteCount(stats.batches),
      },
    };
  } catch {
    return structuredClone(EMPTY_STEAM_GROWTH);
  }
}

export type GrowthRunResult = {
  progress: SteamGrowthProgress;
  verified: number;
  pages: number;
  reason: "limit" | "end_of_list" | "paused" | "upstream_stopped";
};

export async function runSteamGrowthSession(options: {
  initial: SteamGrowthProgress;
  maxVerified: number;
  maxPages?: number;
  discover: (cursor: number) => Promise<SteamDiscoveryPage>;
  importBatch: (appIds: number[]) => Promise<SteamBatchResponse>;
  checkpoint: (progress: SteamGrowthProgress) => void;
  shouldStop?: () => boolean;
}): Promise<GrowthRunResult> {
  const maxVerified = Math.min(200, Math.max(1, Math.floor(options.maxVerified)));
  const maxPages = Math.min(30, Math.max(1, Math.floor(options.maxPages ?? 20)));
  let progress = readSteamGrowthProgress(JSON.stringify(options.initial));
  let verified = 0;
  let pages = 0;
  const result = (reason: GrowthRunResult["reason"]): GrowthRunResult =>
    ({ progress, verified, pages, reason });
  const save = (next: SteamGrowthProgress) => {
    options.checkpoint(next);
    progress = next;
  };

  while (verified < maxVerified) {
    if (options.shouldStop?.()) return result("paused");
    if (!progress.candidates.length) {
      if (!progress.hasMore) return result("end_of_list");
      if (pages >= maxPages) return result("limit");
      const page = await options.discover(progress.cursor);
      if (!Number.isSafeInteger(page.nextCursor) ||
          (page.nextCursor <= progress.cursor && (page.hasMore || page.candidates.length > 0)) ||
          page.nextCursor < progress.cursor ||
          page.nextCursor > 2_147_483_647 || !Array.isArray(page.candidates)) {
        throw new Error("Steam zwrócił nieprawidłowy kursor odkrywania gier.");
      }
      const known = new Map(progress.candidates.map((game) => [game.appId, game]));
      for (const game of page.candidates) {
        if (known.size >= MAX_PENDING) break;
        if (Number.isSafeInteger(game.appId) && game.appId > 0 && !known.has(game.appId)) {
          known.set(game.appId, { appId: game.appId, name: String(game.name).slice(0, 300) });
        }
      }
      save({
        ...progress, cursor: page.nextCursor, hasMore: page.hasMore,
        candidates: [...known.values()],
        stats: { ...progress.stats, scanned: progress.stats.scanned + finiteCount(page.scanned) },
      });
      pages++;
      continue;
    }

    const batchIds = progress.candidates.slice(0, Math.min(10, maxVerified - verified))
      .map((item) => item.appId);
    const response = await options.importBatch(batchIds);
    const allowed = new Set(batchIds);
    const responses = new Map<number, SteamBatchResult>();
    for (const item of response.results ?? []) {
      if (!allowed.has(item.appId) || responses.has(item.appId) ||
          !["inserted", "existing", "not_game", "missing", "upstream_error"].includes(item.status)) {
        throw new Error("Nieprawidłowy raport importu Steam. Nie zmieniono kolejki.");
      }
      responses.set(item.appId, item);
    }
    if (responses.size !== response.processed || response.processed > batchIds.length ||
        response.inserted !== [...responses.values()].filter((x) => x.status === "inserted").length ||
        response.existing !== [...responses.values()].filter((x) => x.status === "existing").length ||
        response.ignored !== [...responses.values()].filter((x) => x.status === "missing" || x.status === "not_game").length ||
        response.failed !== [...responses.values()].filter((x) => x.status === "upstream_error").length) {
      throw new Error("Niespójne wyniki importu Steam. Zachowano kolejkę.");
    }
    const completed = new Set([...responses.values()].filter((x) => x.status !== "upstream_error").map((x) => x.appId));
    save({
      ...progress,
      candidates: progress.candidates.filter((item) => !completed.has(item.appId)),
      stats: {
        inserted: progress.stats.inserted + response.inserted,
        existing: progress.stats.existing + response.existing,
        ignored: progress.stats.ignored + response.ignored,
        failed: progress.stats.failed + response.failed,
        scanned: progress.stats.scanned,
        batches: progress.stats.batches + 1,
      },
    });
    verified += responses.size;
    // Stop on a rate limit or any partial failure. Never spin on the same
    // failing AppID or retry a request that may have partially committed.
    if (response.aborted || response.rateLimited || response.failed || !completed.size) {
      return result("upstream_stopped");
    }
  }
  return result("limit");
}
