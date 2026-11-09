import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  CatalogUpstreamTemporaryError, catalogRetryDelaySeconds,
  fetchCatalogUpstream, MAX_CATALOG_UPSTREAM_RETRIES,
  parseCatalogRetryAfter,
} from "../src/application/catalog/steam-catalog-upstream-retry";

const previousFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = previousFetch; });

test("Retry-After accepts delta seconds and HTTP date, rejects malformed input", () => {
  const epoch = Date.UTC(2026, 9, 12, 12);
  assert.equal(parseCatalogRetryAfter("123", epoch), 123);
  assert.equal(parseCatalogRetryAfter(new Date(epoch + 75_000).toUTCString(), epoch), 75);
  assert.equal(parseCatalogRetryAfter("-1", epoch), 0);
  assert.equal(parseCatalogRetryAfter("invalid", epoch), 0);
  assert.equal(parseCatalogRetryAfter("99999999", epoch), 86400);
});

test("exponential retry schedule honors Retry-After without spinning", () => {
  assert.equal(MAX_CATALOG_UPSTREAM_RETRIES, 5);
  assert.deepEqual(Array.from({ length: 5 }, (_, i) =>
    catalogRetryDelaySeconds(i + 1)), [30, 60, 120, 240, 480]);
  assert.equal(catalogRetryDelaySeconds(2, 800), 800);
  assert.equal(catalogRetryDelaySeconds(5, 100_000), 86400);
  assert.throws(() => catalogRetryDelaySeconds(0), /Invalid/);
  assert.throws(() => catalogRetryDelaySeconds(6), /Invalid/);
});

test("fetch wrapper classifies 429/503 and transport failure safely", async () => {
  const url = new URL("https://api.steampowered.com/IStoreService/GetAppList/v1/?key=SECRET_SENTINEL");
  globalThis.fetch = (async () => new Response("Too many requests", {
    status: 429, headers: { "retry-after": "90" },
  })) as typeof fetch;
  await assert.rejects(fetchCatalogUpstream(url, "Steam discovery"), (error: unknown) => {
    assert.ok(error instanceof CatalogUpstreamTemporaryError);
    assert.equal(error.retryAfterSeconds, 90);
    assert.doesNotMatch(error.message, /SECRET_SENTINEL/);
    return true;
  });

  globalThis.fetch = (async () => { throw new TypeError("https://api.steampowered.com/?key=SECRET_SENTINEL"); }) as typeof fetch;
  await assert.rejects(fetchCatalogUpstream(url, "Steam discovery"), (error: unknown) => {
    assert.ok(error instanceof CatalogUpstreamTemporaryError);
    assert.equal(error.retryAfterSeconds, 0);
    assert.doesNotMatch(error.message, /SECRET_SENTINEL/);
    return true;
  });

  globalThis.fetch = (async () => new Response("Bad request", { status: 400 })) as typeof fetch;
  await assert.rejects(fetchCatalogUpstream(url, "Steam discovery"),
    /Steam discovery rejected the request/);
});

test("fetch wrapper keeps valid official Store responses intact", async () => {
  globalThis.fetch = (async () => Response.json({ "42": { success: true } })) as typeof fetch;
  const url = new URL("https://store.steampowered.com/api/appdetails?appids=42");
  const response = await fetchCatalogUpstream(url, "Steam Store");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { "42": { success: true } });
});
