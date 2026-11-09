/** Bounded, typed query parameters for the Steam catalog listing endpoint. */
export type SteamCatalogListQuery = {
  page: number;
  pageSize: number;
  query: string;
  status: "all" | "unclassified" | "review" | "ready";
};

const STATUS_SET = new Set<SteamCatalogListQuery["status"]>(["all", "unclassified", "review", "ready"]);

function positiveInt(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function parseSteamCatalogListQuery(input: Record<string, unknown>): SteamCatalogListQuery | null {
  const page = positiveInt(input.page, 1);
  const pageSize = positiveInt(input.pageSize, 25);
  if (!page || page > 1_000_000 || !pageSize || pageSize > 100) return null;

  if (input.query !== undefined && typeof input.query !== "string") return null;
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (query.length > 120) return null;

  const status = input.status === undefined ? "all" : input.status;
  if (typeof status !== "string" || !STATUS_SET.has(status as SteamCatalogListQuery["status"])) return null;
  return { page, pageSize, query, status: status as SteamCatalogListQuery["status"] };
}

/** Escape user wildcard characters for a SQL LIKE/ILIKE pattern. */
export function escapeSteamCatalogLikeQuery(query: string): string {
  return query.replace(/[\\%_]/g, "\\$&");
}
