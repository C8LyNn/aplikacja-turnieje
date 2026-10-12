import {
  readSteamGrowthProgress, runSteamGrowthSession,
  type SteamBatchResponse, type SteamGrowthGame, type SteamGrowthProgress,
} from "./game-catalog-growth-runner";

/**
 * One bounded, explicitly started browser session across the existing
 * pending queue and SteamSpy's independent page/offset cursor.
 * Uses the verified Steam importer for every candidate, never SteamSpy data.
 */
export type SteamSpySourceProgress = { page: number; offset: number; hasMore: boolean };
export type SteamSpyDiscoveryPage = {
  candidates: SteamGrowthGame[];
  scanned: number;
  alreadyInCatalog: number;
  nextPage: number;
  nextOffset: number;
  hasMore: boolean;
};
export type SteamSpyDiscoveryQuery = { page: number; offset: number; pageSize: number };

export type SteamSpyGrowthCheckpoint = {
  queue: SteamGrowthProgress;
  source: SteamSpySourceProgress;
};
export type SteamSpyGrowthResult = SteamSpyGrowthCheckpoint & {
  verified: number;
  pages: number;
  reason: "limit" | "end_of_list" | "paused" | "upstream_stopped";
};

export function parseSteamSpySourceProgress(value: unknown): SteamSpySourceProgress {
  const empty: SteamSpySourceProgress = { page: 0, offset: 0, hasMore: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return empty;
  const obj = value as Record<string, unknown>;
  return Number.isSafeInteger(obj.page) && (obj.page as number) >= 0 && (obj.page as number) <= 300 &&
    Number.isSafeInteger(obj.offset) && (obj.offset as number) >= 0 && (obj.offset as number) < 1000 &&
    typeof obj.hasMore === "boolean"
    ? { page: obj.page as number, offset: obj.offset as number, hasMore: obj.hasMore }
    : empty;
}

export function mergeSteamSpyDiscoveryPage(
  queue: SteamGrowthProgress,
  source: SteamSpySourceProgress,
  reply: SteamSpyDiscoveryPage,
  requestedSize: number,
): SteamSpyGrowthCheckpoint {
  if (!reply || !Array.isArray(reply.candidates) ||
      !Number.isSafeInteger(reply.scanned) || reply.scanned < 0 || reply.scanned > requestedSize ||
      reply.candidates.length > reply.scanned ||
      !Number.isSafeInteger(reply.alreadyInCatalog) ||
      reply.alreadyInCatalog < 0 || reply.alreadyInCatalog > reply.scanned ||
      !Number.isSafeInteger(reply.nextPage) || reply.nextPage < source.page ||
      reply.nextPage > source.page + 1 || reply.nextPage > 301 ||
      !Number.isSafeInteger(reply.nextOffset) || reply.nextOffset < 0 || reply.nextOffset >= 1000 ||
      typeof reply.hasMore !== "boolean" ||
      (reply.nextPage === source.page && reply.nextOffset <= source.offset) ||
      (reply.nextPage > source.page && reply.nextOffset !== 0)) {
    throw new Error("SteamSpy zwrócił nieprawidłową stronę. Zachowano postęp.");
  }
  const combined = new Map(queue.candidates.map((item) => [item.appId, item]));
  for (const item of reply.candidates) {
    if (!item || !Number.isSafeInteger(item.appId) || item.appId <= 0 ||
        item.appId > 2_147_483_647 || typeof item.name !== "string" || !item.name.trim()) {
      throw new Error("SteamSpy zwrócił nieprawidłowe AppID. Zachowano postęp.");
    }
    if (!combined.has(item.appId)) combined.set(item.appId, {
      appId: item.appId, name: item.name.slice(0, 300),
    });
    if (combined.size > 200) {
      throw new Error("Kolejka Steam przekroczyłaby limit 200 gier. Zachowano postęp.");
    }
  }
  return {
    queue: {
      ...queue, candidates: [...combined.values()],
      stats: { ...queue.stats, scanned: queue.stats.scanned + reply.scanned },
    },
    source: { page: reply.nextPage, offset: reply.nextOffset, hasMore: reply.hasMore },
  };
}

export async function runSteamSpyGrowthSession(options: {
  initial: SteamGrowthProgress;
  source: SteamSpySourceProgress;
  maxVerified?: number;
  maxPages?: number;
  discover: (query: SteamSpyDiscoveryQuery) => Promise<SteamSpyDiscoveryPage>;
  importBatch: (appIds: number[]) => Promise<SteamBatchResponse>;
  checkpoint: (state: SteamSpyGrowthCheckpoint) => void;
  shouldStop?: () => boolean;
}): Promise<SteamSpyGrowthResult> {
  const maxVerified = Math.min(100, Math.max(1, Math.floor(options.maxVerified ?? 100)));
  const maxPages = Math.min(20, Math.max(1, Math.floor(options.maxPages ?? 20)));
  let queue = readSteamGrowthProgress(JSON.stringify(options.initial));
  let source = parseSteamSpySourceProgress(options.source);
  let verified = 0;
  let pages = 0;
  const result = (reason: SteamSpyGrowthResult["reason"]): SteamSpyGrowthResult =>
    ({ queue, source, verified, pages, reason });
  const checkpoint = (next: SteamSpyGrowthCheckpoint) => {
    options.checkpoint(next);
    queue = next.queue;
    source = next.source;
  };

  while (verified < maxVerified) {
    if (options.shouldStop?.()) return result("paused");

    // Import every pending ID before making another source request.
    // Force the existing runner into queue-only mode without changing the
    // independent official-Steam discovery cursor or its hasMore flag.
    if (queue.candidates.length) {
      const originalHasMore = queue.hasMore;
      const run = await runSteamGrowthSession({
        initial: { ...queue, hasMore: false },
        maxVerified: maxVerified - verified,
        shouldStop: options.shouldStop,
        discover: async () => { throw new Error("Nie wolno uruchamiać wyszukiwania Steam API."); },
        importBatch: options.importBatch,
        checkpoint: (item) => checkpoint({
          queue: { ...item, hasMore: originalHasMore }, source,
        }),
      });
      verified += run.verified;
      if (run.reason === "paused" || run.reason === "upstream_stopped") return result(run.reason);
      continue;
    }

    if (!source.hasMore) return result("end_of_list");
    if (pages >= maxPages) return result("limit");

    const pageSize = Math.min(100, 200 - queue.candidates.length);
    const discovered = await options.discover({ page: source.page, offset: source.offset, pageSize });
    checkpoint(mergeSteamSpyDiscoveryPage(queue, source, discovered, pageSize));
    pages += 1;
  }
  return result("limit");
}
