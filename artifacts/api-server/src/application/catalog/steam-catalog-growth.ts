/**
 * Pure validation for safe, resumable Steam catalog growth.
 *
 * The Steam Store discovery feed provides games, but detailed store metadata
 * is still checked before an entry may enter the classification catalog.
 */
export const MAX_STEAM_IMPORT_BATCH = 10;
export const DISCOVERY_PAGE_SIZE = 50;
export const MAX_DISCOVERY_PAGE_SIZE = 100;
const MAX_APP_ID = 2_147_483_647;

function appIdFrom(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value);
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id <= MAX_APP_ID ? id : null;
}

export function parseSteamImportBatch(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_STEAM_IMPORT_BATCH) return null;
  const ids = raw.map(appIdFrom);
  if (ids.some((id) => id === null)) return null;
  return [...new Set(ids as number[])];
}

export function parseSteamDiscoveryRequest(raw: unknown): { cursor: number; pageSize: number } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const cursor = input.cursor === undefined || input.cursor === 0 || input.cursor === "0" ? 0 : appIdFrom(input.cursor);
  const pageSize = input.pageSize === undefined ? DISCOVERY_PAGE_SIZE : Number(input.pageSize);
  if (cursor === null || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_DISCOVERY_PAGE_SIZE) return null;
  return { cursor, pageSize };
}

export type SteamDiscoveryCandidate = { appId: number; name: string };

export function parseSteamDiscoveryPage(raw: unknown, cursor: number): {
  games: SteamDiscoveryCandidate[]; nextCursor: number; hasMore: boolean;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const response = (raw as Record<string, unknown>).response;
  if (!response || typeof response !== "object") return null;
  const source = response as Record<string, unknown>;
  if (!Array.isArray(source.apps)) return null;
  const games: SteamDiscoveryCandidate[] = [];
  let lastId = cursor;
  for (const item of source.apps) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const appId = appIdFrom(record.appid);
    if (!appId || appId <= lastId) return null;
    lastId = appId;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (name) games.push({ appId, name: name.slice(0, 300) });
  }
  if (source.last_appid !== undefined) {
    const supplied = appIdFrom(source.last_appid);
    if (supplied === null || supplied < lastId) return null;
    lastId = supplied;
  }
  if (lastId === cursor && source.have_more_results) return null;
  return { games, nextCursor: lastId, hasMore: source.have_more_results === true };
}

export function parseSteamDetailedGame(appId: number, raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (record.type !== "game") return null; // Never add DLC, demos, tools or soundtracks.
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) return null;
  const list = (value: unknown) =>
    Array.isArray(value) ? value.filter((x): x is string => typeof x === "string").join(", ") || null : null;
  const release = record.release_date;
  const releaseDate = release && typeof release === "object" &&
    typeof (release as Record<string, unknown>).date === "string"
    ? (release as Record<string, string>).date : null;
  const now = new Date();
  return {
    steamAppId: appId,
    name: name.slice(0, 300),
    steamUrl: `https://store.steampowered.com/app/${appId}`,
    headerImageUrl: typeof record.header_image === "string" ? record.header_image : null,
    developer: list(record.developers),
    publisher: list(record.publishers),
    releaseDate,
    shortDescription: typeof record.short_description === "string" ? record.short_description : null,
    steamRawData: record,
    sourceUpdatedAt: now,
    updatedAt: now,
  };
}
