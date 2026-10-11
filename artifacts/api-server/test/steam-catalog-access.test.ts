import assert from "node:assert/strict";
import test from "node:test";
import { checkSteamCatalogAdminToken } from "../src/application/catalog/steam-catalog-access";

const ADMIN_TOKEN = "catalog-admin-key-abcdefghijklmnopqrstuvwxyz-2026";

test("catalog editing is disabled if a sufficiently strong server key is not configured", () => {
  assert.equal(checkSteamCatalogAdminToken(undefined, ADMIN_TOKEN), "unconfigured");
  assert.equal(checkSteamCatalogAdminToken("", ADMIN_TOKEN), "unconfigured");
  assert.equal(checkSteamCatalogAdminToken("too-short", "too-short"), "unconfigured");
});

test("catalog admin key verification denies missing, modified and malformed keys", () => {
  assert.equal(checkSteamCatalogAdminToken(ADMIN_TOKEN, undefined), "denied");
  assert.equal(checkSteamCatalogAdminToken(ADMIN_TOKEN, ""), "denied");
  assert.equal(checkSteamCatalogAdminToken(ADMIN_TOKEN, { password: ADMIN_TOKEN }), "denied");
  assert.equal(checkSteamCatalogAdminToken(ADMIN_TOKEN, ADMIN_TOKEN + "x"), "denied");
  assert.equal(checkSteamCatalogAdminToken(ADMIN_TOKEN, ADMIN_TOKEN.toUpperCase()), "denied");
});

test("correct secret authorizes mutation checks", () => {
  assert.equal(checkSteamCatalogAdminToken(ADMIN_TOKEN, ADMIN_TOKEN), "ok");
});
