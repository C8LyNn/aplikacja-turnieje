import assert from "node:assert/strict";
import test from "node:test";
import { coalesceCatalogRead } from "../src/application/catalog/steam-catalog-inflight";

test("identical overlapping reads share a promise, not a durable cache", async () => {
  let resolve!: (value: number) => void;
  const gate = new Promise<number>((finish) => { resolve = finish; });
  let calls = 0;
  const reader = () => { calls++; return gate; };
  const first = coalesceCatalogRead("catalog-test:identical", reader);
  const second = coalesceCatalogRead("catalog-test:identical", reader);
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve(73);
  assert.deepEqual(await Promise.all([first, second]), [73, 73]);
  await Promise.resolve();
  assert.equal(await coalesceCatalogRead("catalog-test:identical", async () => {
    calls++;
    return 74;
  }), 74);
  assert.equal(calls, 2);
});

test("different filter/page keys stay independent", async () => {
  const executed: string[] = [];
  const results = await Promise.all([
    coalesceCatalogRead("catalog-test:all", async () => { executed.push("all"); return 1; }),
    coalesceCatalogRead("catalog-test:review", async () => { executed.push("review"); return 2; }),
  ]);
  assert.deepEqual(results, [1, 2]);
  assert.deepEqual(executed.sort(), ["all", "review"]);
});

test("rejected reads are removed and a subsequent retry executes again", async () => {
  let calls = 0;
  const err = new Error("Temporary PostgreSQL error");
  const first = coalesceCatalogRead("catalog-test:failure", async () => {
    calls++;
    throw err;
  });
  const second = coalesceCatalogRead("catalog-test:failure", async () => {
    calls++;
    return 900;
  });
  await assert.rejects(first, (error: unknown) => error === err);
  await assert.rejects(second, (error: unknown) => error === err);
  assert.equal(calls, 1);
  assert.equal(await coalesceCatalogRead("catalog-test:failure", async () => {
    calls++;
    return 900;
  }), 900);
  assert.equal(calls, 2);
});

test("oversized search keys bypass the coalescing map", async () => {
  const key = "k".repeat(8_193);
  let calls = 0;
  const promises = Array.from({ length: 2 }, () =>
    coalesceCatalogRead(key, async () => ++calls));
  assert.deepEqual(await Promise.all(promises), [1, 2]);
});
