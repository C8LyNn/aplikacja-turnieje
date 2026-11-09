import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { isTournamentDevelopmentDatabase } from "@workspace/db/development-connection";

export function getSteamCatalogAdminCredential(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return isTournamentDevelopmentDatabase(env)
    ? env.TOURNAMENT_DEV_CATALOG_ADMIN_TOKEN
    : env.STEAM_CATALOG_ADMIN_TOKEN;
}

export type SteamCatalogAccessResult = "ok" | "unconfigured" | "denied";

/** Catalog editing has no global account identity in tournament-scoped auth. */
export function checkSteamCatalogAdminToken(
  configured: string | undefined,
  supplied: unknown,
): SteamCatalogAccessResult {
  if (!configured || configured.length < 32) return "unconfigured";
  if (typeof supplied !== "string" || !supplied) return "denied";
  const expectedHash = createHash("sha256").update(configured, "utf8").digest();
  const receivedHash = createHash("sha256").update(supplied, "utf8").digest();
  return timingSafeEqual(expectedHash, receivedHash) ? "ok" : "denied";
}

/** Protect all catalog mutations; reads remain public. Fail closed without a configured key. */
export const requireSteamCatalogAdmin: RequestHandler = (req, res, next) => {
  const result = checkSteamCatalogAdminToken(
    getSteamCatalogAdminCredential(),
    req.get("x-steam-catalog-admin-token") ?? /^Bearer ([^\s]+)$/.exec(req.get("authorization") ?? "")?.[1],
  );
  if (result === "unconfigured") {
    res.status(503).json({
      error: "Edycja katalogu jest wyłączona do czasu skonfigurowania klucza administratora.",
      code: "STEAM_CATALOG_ADMIN_NOT_CONFIGURED",
    });
    return;
  }
  if (result === "denied") {
    res.status(403).json({
      error: "Nieprawidłowy klucz administratora katalogu.",
      code: "STEAM_CATALOG_ADMIN_REQUIRED",
    });
    return;
  }
  next();
};
