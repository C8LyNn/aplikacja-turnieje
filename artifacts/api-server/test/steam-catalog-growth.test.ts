import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSteamDetailedGame, parseSteamDiscoveryPage,
  parseSteamDiscoveryRequest, parseSteamImportBatch,
} from "../src/application/catalog/steam-catalog-growth";

test("bulk IDs are deduplicated, bounded and strictly parsed", () => {
  assert.deepEqual(parseSteamImportBatch([570, "730", 570]), [570, 730]);
  for (const bad of [[], Array.from({ length: 11 }, (_, i) => i + 1), [0], [-3], ["7x"], ["0"], [2.4], [2147483648], null, "570,730"]) {
    assert.equal(parseSteamImportBatch(bad), null);
  }
});

test("discovery validates a resumable cursor and request size", () => {
  assert.deepEqual(parseSteamDiscoveryRequest({}), { cursor: 0, pageSize: 50 });
  assert.deepEqual(parseSteamDiscoveryRequest({ cursor: 0, pageSize: 100 }), { cursor: 0, pageSize: 100 });
  assert.deepEqual(parseSteamDiscoveryRequest({ cursor: "2457", pageSize: 10 }), { cursor: 2457, pageSize: 10 });
  for (const bad of [{ cursor: -1 }, { cursor: 1.2 }, { pageSize: 101 }, { pageSize: 0 }, { pageSize: 1.2 }, [], null]) {
    assert.equal(parseSteamDiscoveryRequest(bad), null);
  }
});

test("Store app page advances monotonically, rejecting malformed or stalled results", () => {
  const page = parseSteamDiscoveryPage({ response: {
    apps: [{ appid: 10, name: "Older" }, { appid: 12, name: "Newer" }],
    have_more_results: true, last_appid: 12,
  } }, 0);
  assert.deepEqual(page, {
    games: [{ appId: 10, name: "Older" }, { appId: 12, name: "Newer" }],
    nextCursor: 12, hasMore: true,
  });
  assert.equal(parseSteamDiscoveryPage({ response: { apps: [], have_more_results: true } }, 12), null);
  assert.equal(parseSteamDiscoveryPage({ response: { apps: [{ appid: 11, name: "Stale" }] } }, 12), null);
  assert.equal(parseSteamDiscoveryPage({ response: { apps: [{ appid: 15, name: "First" }, { appid: 14, name: "Reordered" }] } }, 12), null);
  assert.equal(parseSteamDiscoveryPage({ response: { apps: null } }, 12), null);
});

test("only verified game records produce metadata for the catalogue", () => {
  assert.equal(parseSteamDetailedGame(570, { type: "dlc", name: "Expansion" }), null);
  assert.equal(parseSteamDetailedGame(570, { type: "demo", name: "Demo" }), null);
  assert.equal(parseSteamDetailedGame(570, { type: "game", name: "  " }), null);
  const item = parseSteamDetailedGame(570, {
    type: "game", name: "Dota 2",
    developers: ["Valve"], publishers: ["Valve"],
    short_description: "Multiplayer game",
    release_date: { date: "Jul 9, 2013" },
  });
  assert.ok(item);
  assert.equal(item.steamAppId, 570);
  assert.equal(item.name, "Dota 2");
  assert.equal(item.developer, "Valve");
  assert.equal(item.steamUrl, "https://store.steampowered.com/app/570");
  assert.equal(item.releaseDate, "Jul 9, 2013");
});
