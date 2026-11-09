import type { SteamCatalogListQuery } from "@workspace/game-catalog";

/**
 * Versioned, read-only keyset cursor. It is deliberately not an authorization
 * token; the server validates every field and binds it to the active filters.
 */
export type SteamCatalogCursor = {
  v: 1;
  name: string;
  id: number;
  page: number;
  pageSize: number;
  query: string;
  status: SteamCatalogListQuery["status"];
};

export function encodeSteamCatalogCursor(
  row: { name: string; id: number },
  context: SteamCatalogListQuery,
): string {
  const cursor: SteamCatalogCursor = {
    v: 1,
    name: row.name,
    id: row.id,
    page: context.page + 1,
    pageSize: context.pageSize,
    query: context.query,
    status: context.status,
  };
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeSteamCatalogCursor(
  value: unknown,
  context: SteamCatalogListQuery,
): SteamCatalogCursor | null {
  if (typeof value !== "string" || value.length < 8 || value.length > 6144 ||
      !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) return null;
    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const item = parsed as Record<string, unknown>;
    if (item.v !== 1 || typeof item.name !== "string" || item.name.length > 2048 ||
        typeof item.id !== "number" || !Number.isSafeInteger(item.id) ||
        item.id < 1 || item.id > 2_147_483_647 || item.page !== context.page ||
        item.pageSize !== context.pageSize || item.query !== context.query ||
        item.status !== context.status || context.page < 2) return null;
    return item as SteamCatalogCursor;
  } catch {
    return null;
  }
}
