import assert from "node:assert/strict";
import test from "node:test";
import { decodeSteamCatalogCursor, encodeSteamCatalogCursor } from "../src/application/catalog/steam-catalog-cursor";
import type { SteamCatalogListQuery } from "@workspace/game-catalog";

const base: SteamCatalogListQuery = { page: 2, pageSize: 25, query: "Wyścigi", status: "review" };
const source: SteamCatalogListQuery = { ...base, page: 1 };

test("cursor round-trips unicode names and binds page, page size and filters", () => {
  const encoded = encodeSteamCatalogCursor({ name: "Żółw – gra", id: 33 }, source);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeSteamCatalogCursor(encoded, base), {
    v: 1, name: "Żółw – gra", id: 33, page: 2, pageSize: 25, query: "Wyścigi", status: "review",
  });
  assert.equal(decodeSteamCatalogCursor(encoded, { ...base, page: 3 }), null);
  assert.equal(decodeSteamCatalogCursor(encoded, { ...base, pageSize: 100 }), null);
  assert.equal(decodeSteamCatalogCursor(encoded, { ...base, query: "RPG" }), null);
  assert.equal(decodeSteamCatalogCursor(encoded, { ...base, status: "ready" }), null);
});

test("cursor rejects malformed, oversized, malformed base64url and untrusted object fields", () => {
  const invalid: unknown[] = [[], ["abc"], "invalid!", "A".repeat(6145), "e30=",
    Buffer.from("{}").toString("base64url"),
    Buffer.from(JSON.stringify({ v: 1, name: "Game", id: -1, page: 2, pageSize: 25, query: "Wyścigi", status: "review" })).toString("base64url"),
    Buffer.from(JSON.stringify({ v: 1, name: "Game", id: 1, page: 1, pageSize: 25, query: "Wyścigi", status: "review" })).toString("base64url"),
  ];
  for (const value of invalid) assert.equal(decodeSteamCatalogCursor(value, base), null);
});
