import assert from "node:assert/strict";
import test from "node:test";
import {
  createSteamSpyPageCache, parseSteamSpyAllPage, parseSteamSpyPageRequest,
  sliceSteamSpyPage, SteamSpyCooldownError, SteamSpySourceError,
} from "../src/application/catalog/steam-catalog-steamspy";

test("SteamSpy page request requires bounded integer page, offset and size", () => {
  assert.deepEqual(parseSteamSpyPageRequest({}), { page: 0, offset: 0, pageSize: 100 });
  assert.deepEqual(parseSteamSpyPageRequest({ page: 14, offset: 900, pageSize: 1 }),
    { page: 14, offset: 900, pageSize: 1 });
  for (const raw of [
    null, [], { page: -1 }, { page: 301 }, { page: "1" }, { page: 1.3 },
    { offset: -1 }, { offset: 1000 }, { offset: 0.1 },
    { pageSize: 0 }, { pageSize: 101 }, { pageSize: "100" },
  ]) assert.equal(parseSteamSpyPageRequest(raw), null);
});

test("SteamSpy candidate parser only accepts real positive numeric AppIDs and names", () => {
  const parsed = parseSteamSpyAllPage({
    570: { appid: 570, name: " Dota 2 " },
    730: { appid: 730, name: "Counter-Strike 2" },
    620: { appid: 620, name: "Portal 2" },
    0: { appid: 0, name: "Bad" },
    999: { appid: 120, name: "Mismatch" },
    bogus: { name: "Unknown" },
    333: { appid: 333, name: "" },
  });
  assert.deepEqual(parsed, [
    { appId: 570, name: "Dota 2" },
    { appId: 620, name: "Portal 2" },
    { appId: 730, name: "Counter-Strike 2" },
  ]);
  assert.equal(parseSteamSpyAllPage(null), null);
  assert.equal(parseSteamSpyAllPage([]), null);
  assert.deepEqual(parseSteamSpyAllPage({}), []);
});

test("SteamSpy paging is a lossless sequence through a 1000-entry response", () => {
  const raw = Object.fromEntries(Array.from({ length: 1000 }, (_, index) => [
    String(index + 1), { appid: index + 1, name: "Game " + index },
  ]));
  const games = parseSteamSpyAllPage(raw)!;
  assert.equal(games.length, 1000);
  const checked: number[] = [];
  let page = 0;
  let offset = 0;
  for (let index = 0; index < 10; index++) {
    const response = sliceSteamSpyPage(games, { page, offset, pageSize: 100 });
    checked.push(...response.candidates.map((x) => x.appId));
    assert.equal(response.scanned, 100);
    assert.equal(response.hasMore, true);
    page = response.nextPage;
    offset = response.nextOffset;
  }
  assert.deepEqual(checked, Array.from({ length: 1000 }, (_, i) => i + 1));
  assert.equal(page, 1);
  assert.equal(offset, 0);
  const last = sliceSteamSpyPage(games.slice(0, 78), { page: 1, offset: 0, pageSize: 100 });
  assert.equal(last.hasMore, false);
  assert.equal(last.nextPage, 2);
  assert.equal(last.candidates.length, 78);
});

test("SteamSpy page cache coalesces identical reads, enforces cooldown and reuses 24h snapshots", async () => {
  let now = 100_000;
  let calls = 0;
  let resolveFetch!: (value: unknown) => void;
  const source = createSteamSpyPageCache(() => {
    calls++;
    return new Promise((resolve) => { resolveFetch = resolve; });
  }, () => now);
  const first = source(0);
  const second = source(0);
  assert.equal(calls, 1);
  await assert.rejects(source(1), (error) => error instanceof SteamSpyCooldownError &&
    error.retryAfterSeconds === 65);
  resolveFetch({ 570: { name: "Dota 2" } });
  assert.deepEqual(await first, await second);
  now += 60_000;
  assert.deepEqual(await source(0), [{ appId: 570, name: "Dota 2" }]);
  await assert.rejects(source(1), SteamSpyCooldownError);
  now += 5_000;
  const third = source(1);
  assert.equal(calls, 2);
  resolveFetch({ 730: { name: "CS2" } });
  assert.deepEqual(await third, [{ appId: 730, name: "CS2" }]);
});

test("invalid SteamSpy payload does not pollute cache", async () => {
  let now = 10_000;
  let calls = 0;
  const source = createSteamSpyPageCache(async () => {
    calls++;
    return calls === 1 ? [] : { 570: { name: "Dota 2" } };
  }, () => now);
  await assert.rejects(source(0), SteamSpySourceError);
  await assert.rejects(source(0), SteamSpyCooldownError);
  now += 65_000;
  assert.deepEqual(await source(0), [{ appId: 570, name: "Dota 2" }]);
  assert.equal(calls, 2);
});
