/**
 * Extract a bounded, deduplicated game candidate list from the public Steam
 * Store featured categories. This is discovery ONLY: appdetails must still
 * validate type === "game" before database insertion.
 */
export type SteamFeaturedGame = { appId: number; name: string };

const FEATURED_SECTIONS = ["new_releases", "top_sellers", "coming_soon", "specials"] as const;
const MAX_FEATURED_CANDIDATES = 200;

export function parseSteamFeaturedCategories(raw: unknown): SteamFeaturedGame[] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const data = raw as Record<string, unknown>;
  const found = new Map<number, SteamFeaturedGame>();
  let validSection = false;

  for (const key of FEATURED_SECTIONS) {
    const category = data[key];
    if (!category || typeof category !== "object" || Array.isArray(category)) continue;
    const items = (category as Record<string, unknown>).items;
    if (!Array.isArray(items)) continue;
    validSection = true;

    for (const item of items) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const entry = item as Record<string, unknown>;
      const appId = entry.id;
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      if (typeof appId !== "number" || !Number.isSafeInteger(appId) ||
          appId <= 0 || appId > 2_147_483_647 || !name) continue;
      if (!found.has(appId)) found.set(appId, { appId, name: name.slice(0, 300) });
      if (found.size >= MAX_FEATURED_CANDIDATES) break;
    }
    if (found.size >= MAX_FEATURED_CANDIDATES) break;
  }

  return validSection ? [...found.values()] : null;
}
