import assert from "node:assert/strict";
import test from "node:test";
import { parseSteamFeaturedCategories } from "../src/application/catalog/steam-catalog-featured";

test("featured catalog discovery merges distinct categories without duplicate AppIDs", () => {
  const input = {
    new_releases: { items: [{ id: 200, name: " New game " }, { id: 100, name: "Earlier release" }] },
    top_sellers: { items: [{ id: 200, name: "Duplicate entry" }, { id: 300, name: "Popular" }] },
    specials: { items: [{ id: 400, name: "Discounted" }] },
  };
  assert.deepEqual(parseSteamFeaturedCategories(input), [
    { appId: 200, name: "New game" }, { appId: 100, name: "Earlier release" },
    { appId: 300, name: "Popular" }, { appId: 400, name: "Discounted" },
  ]);
});

test("featured discovery validates payloads and skips malformed item IDs", () => {
  for (const payload of [null, [], {}, { new_releases: {} }, { new_releases: { items: null } }]) {
    assert.equal(parseSteamFeaturedCategories(payload), null);
  }
  const parsed = parseSteamFeaturedCategories({ top_sellers: {
    items: [{ id: 0, name: "Zero" }, { id: -1, name: "Negative" },
      { id: 2.5, name: "Decimal" }, { id: "570", name: "String ID" },
      { id: 2147483648, name: "Over max" }, { id: 570, name: "" },
      null, { id: 730, name: "Counter-Strike 2" }],
  } });
  assert.deepEqual(parsed, [{ appId: 730, name: "Counter-Strike 2" }]);
  assert.deepEqual(parseSteamFeaturedCategories({ specials: { items: [] } }), []);
});

test("featured discovery caps candidates and trims oversized names", () => {
  const longName = "A".repeat(500);
  const parsed = parseSteamFeaturedCategories({
    new_releases: { items: Array.from({ length: 250 }, (_, i) => ({ id: 1000 + i, name: longName })) },
  });
  assert.ok(parsed);
  assert.equal(parsed.length, 200);
  assert.equal(parsed[0].name.length, 300);
  assert.equal(parsed.at(-1)?.appId, 1199);
});
