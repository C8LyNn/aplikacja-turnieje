import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

// Catalog maintenance is a global privilege. Tournament-scoped organizer,
// support and viewer tokens must never grant access to this route family.
export const STEAM_CATALOG_ADMIN_TOKEN_HEADER = "x-steam-catalog-admin-token";
const MIN_TOKEN_LENGTH = 32;

export function isAuthorizedSteamCatalogWrite(
  suppliedToken: unknown,
  configuredToken: unknown,
): boolean {
  if (
    typeof suppliedToken !== "string" ||
    typeof configuredToken !== "string" ||
    configuredToken.length < MIN_TOKEN_LENGTH ||
    suppliedToken.length === 0
  ) {
    return false;
  }

  // Equal-size hashes allow a timing-safe comparison even for differing token
  // lengths. Nothing derived from the credential is logged or returned.
  const suppliedDigest = createHash("sha256").update(suppliedToken).digest();
  const configuredDigest = createHash("sha256").update(configuredToken).digest();
  return timingSafeEqual(suppliedDigest, configuredDigest);
}

export function createSteamCatalogWriteAuth(
  env: NodeJS.ProcessEnv = process.env,
): RequestHandler {
  return (req, res, next) => {
    if (
      !isAuthorizedSteamCatalogWrite(
        req.header(STEAM_CATALOG_ADMIN_TOKEN_HEADER),
        env.STEAM_CATALOG_ADMIN_TOKEN,
      )
    ) {
      res.status(403).json({
        error: "Brak uprawnienia do edycji katalogu.",
        code: "STEAM_CATALOG_WRITE_FORBIDDEN",
      });
      return;
    }
    next();
  };
}

export const requireSteamCatalogWrite = createSteamCatalogWriteAuth();
