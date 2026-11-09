import assert from "node:assert/strict";
import test from "node:test";
import { escapeSteamCatalogLikeQuery, parseSteamCatalogListQuery } from "@workspace/game-catalog";

test("paginated search applies safe defaults and explicit filters", () => {
  assert.deepEqual(parseSteamCatalogListQuery({}), { page: 1, pageSize: 25, query: "", status: "all" });
  assert.deepEqual(parseSteamCatalogListQuery({ page: "3", pageSize: "100", query: "  RPG  ", status: "review" }), {
    page: 3, pageSize: 100, query: "RPG", status: "review",
  });
});

test("pagination rejects unsafe or malformed parameters", () => {
  for (const input of [
    { page: "0" }, { page: "-1" }, { page: "1.5" }, { page: "1000001" },
    { page: ["1", "2"] }, { pageSize: "0" }, { pageSize: "101" },
    { pageSize: "1e2" }, { status: "deleted" }, { status: ["ready"] },
    { query: ["roguelike"] }, { query: "a".repeat(121) },
  ]) assert.equal(parseSteamCatalogListQuery(input), null, JSON.stringify(input));
});

test("LIKE escaping prevents user wildcard characters from broadening matches", () => {
  assert.equal(escapeSteamCatalogLikeQuery("100%"), "100\\%");
  assert.equal(escapeSteamCatalogLikeQuery("a_b"), "a\\_b");
  assert.equal(escapeSteamCatalogLikeQuery("a\\b"), "a\\\\b");
  assert.equal(escapeSteamCatalogLikeQuery("abc"), "abc");
});
