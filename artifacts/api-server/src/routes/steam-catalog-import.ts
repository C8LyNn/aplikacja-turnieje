import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { getSteamCatalogAdminCredential } from "../application/catalog/steam-catalog-access";

const MAX_APP_ID = 2_147_483_647;

export function parseSteamAppId(value: unknown): number | null {
  let id: number;
  if (typeof value === "number") {
    id = value;
  } else if (typeof value === "string") {
    const input = value.trim();
    if (/^[1-9]\d*$/.test(input)) {
      id = Number(input);
    } else {
      let url: URL;
      try {
        url = new URL(input);
      } catch {
        return null;
      }
      if (
        url.protocol !== "https:" ||
        url.hostname !== "store.steampowered.com" ||
        url.port || url.username || url.password
      ) return null;
      const match = /^\/app\/([1-9]\d*)(?:\/[^/]*)?\/?$/.exec(url.pathname);
      if (!match) return null;
      id = Number(match[1]);
    }
  } else {
    return null;
  }
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_APP_ID ? id : null;
}

export type SteamImportValues = {
  steamAppId: number;
  name: string;
  steamUrl: string;
  headerImageUrl: string | null;
  developer: string | null;
  publisher: string | null;
  releaseDate: string | null;
  shortDescription: string | null;
  steamRawData: Record<string, unknown>;
  sourceUpdatedAt: Date;
  updatedAt: Date;
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function steamGameValues(
  appId: number,
  payload: unknown,
): SteamImportValues | null {
  if (!record(payload)) return null;
  const entry = payload[String(appId)];
  if (!record(entry) || entry.success !== true || !record(entry.data)) return null;
  const data = entry.data;
  if (
    data.type !== "game" ||
    data.steam_appid !== appId ||
    typeof data.name !== "string" ||
    !data.name.trim()
  ) return null;
  const names = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string").join(", ") || null
      : null;
  return {
    steamAppId: appId,
    name: data.name,
    steamUrl: `https://store.steampowered.com/app/${appId}`,
    headerImageUrl: typeof data.header_image === "string" ? data.header_image : null,
    developer: names(data.developers),
    publisher: names(data.publishers),
    releaseDate: record(data.release_date) && typeof data.release_date.date === "string"
      ? data.release_date.date || null : null,
    shortDescription: typeof data.short_description === "string" ? data.short_description : null,
    steamRawData: data,
    sourceUpdatedAt: new Date(),
    updatedAt: new Date(),
  };
}

type ImportResult = { game: unknown; inserted: boolean };
type Options = {
  // A separate administrator credential; never reuse SESSION_SECRET.
  adminToken?: () => string | undefined;
  fetchSteam?: typeof fetch;
  insertOnly: (values: SteamImportValues) => Promise<ImportResult>;
};

export function createSteamCatalogImportRouter(options: Options) {
  const router = Router();
  router.post("/steam-catalog/import", async (req, res, next) => {
    // Fail closed before contacting Steam or the database.
    const expected = (options.adminToken ?? getSteamCatalogAdminCredential)();
    if (!expected || expected.length < 32) {
      res.status(503).json({
        error: "Import administratora nie jest skonfigurowany.",
        code: "STEAM_IMPORT_DISABLED",
      });
      return;
    }
    const match = /^Bearer ([^\s]+)$/.exec(req.get("authorization") ?? "");
    const provided = Buffer.from(match?.[1] ?? req.get("x-steam-catalog-admin-token") ?? "");
    const required = Buffer.from(expected);
    if (provided.length !== required.length || !timingSafeEqual(provided, required)) {
      res.status(401).json({ error: "Wymagany token administratora.", code: "ADMIN_AUTH_REQUIRED" });
      return;
    }
    const appId = parseSteamAppId(req.body?.appId ?? req.body?.url);
    if (appId === null) {
      res.status(400).json({ error: "Nieprawidłowy Steam AppID lub URL.", code: "INVALID_STEAM_APP_ID" });
      return;
    }
    try {
      const endpoint = new URL("https://store.steampowered.com/api/appdetails");
      endpoint.searchParams.set("appids", String(appId));
      endpoint.searchParams.set("l", "english");
      const response = await (options.fetchSteam ?? fetch)(endpoint, {
        headers: { "user-agent": "TournamentManagerGameCatalog/0.1" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        res.status(502).json({ error: "Błąd odpowiedzi Steam.", code: "STEAM_UPSTREAM_ERROR" });
        return;
      }
      const values = steamGameValues(appId, await response.json());
      if (!values) {
        res.status(422).json({
          error: "Steam musi potwierdzić grę i zgodny AppID.",
          code: "STEAM_GAME_REQUIRED",
        });
        return;
      }
      const result = await options.insertOnly(values);
      res.status(result.inserted ? 201 : 200).json({
        game: result.game,
        outcome: result.inserted ? "inserted" : "existing",
      });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
