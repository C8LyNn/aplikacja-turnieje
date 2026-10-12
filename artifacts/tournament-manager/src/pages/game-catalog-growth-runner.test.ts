import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_STEAM_GROWTH, readSteamGrowthProgress, runSteamGrowthSession,
  type SteamBatchResponse, type SteamGrowthProgress,
} from "./game-catalog-growth-runner";

function response(ids: number[], failed: number[] = []): SteamBatchResponse {
  return {
    requested: ids.length, processed: ids.length,
    inserted: ids.length - failed.length, existing: 0, ignored: 0,
    failed: failed.length, aborted: failed.length > 0, rateLimited: failed.length > 0,
    results: ids.map((appId) => ({ appId, status: failed.includes(appId) ? "upstream_error" : "inserted" })),
  };
}

test("converts old stored queues to progress with zeroed statistics", () => {
  const old = { cursor: 50, hasMore: true, candidates: [{ appId: 70, name: "Game 70" }] };
  const parsed = readSteamGrowthProgress(JSON.stringify(old));
  assert.deepEqual(parsed.stats, EMPTY_STEAM_GROWTH.stats);
  assert.deepEqual(parsed.candidates, old.candidates);
  assert.equal(readSteamGrowthProgress("bad json").cursor, 0);
  assert.equal(readSteamGrowthProgress(JSON.stringify({ ...old, cursor: -10 })).cursor, 0);
});

test("a single command checkpoints every batch, discovers next pages, and stops at 100", async () => {
  const imported: number[][] = [];
  const saved: SteamGrowthProgress[] = [];
  const result = await runSteamGrowthSession({
    initial: readSteamGrowthProgress(null), maxVerified: 100, maxPages: 5,
    discover: async (cursor) => ({
      nextCursor: cursor + 100,
      hasMore: true,
      scanned: 100,
      alreadyInCatalog: 0,
      candidates: Array.from({ length: 100 }, (_, i) => ({
        appId: cursor + i + 1, name: "Game " + (cursor + i + 1),
      })),
    }),
    importBatch: async (ids) => { imported.push(ids); return response(ids); },
    checkpoint: (state) => saved.push(readSteamGrowthProgress(JSON.stringify(state))),
  });
  assert.equal(result.reason, "limit");
  assert.equal(result.verified, 100);
  assert.equal(result.pages, 1);
  assert.equal(imported.length, 10);
  assert.ok(imported.every((ids) => ids.length === 10));
  assert.equal(result.progress.stats.inserted, 100);
  assert.equal(result.progress.stats.scanned, 100);
  assert.equal(result.progress.stats.batches, 10);
  assert.deepEqual(result.progress.candidates, []);
  assert.equal(saved.length, 11);
  assert.equal(saved.at(-1)?.stats.inserted, 100);
});

test("pause finishes the in-flight batch and resumes with no duplicate AppIDs", async () => {
  let pause = false;
  const first = await runSteamGrowthSession({
    initial: { ...readSteamGrowthProgress(null), hasMore: false,
      candidates: Array.from({ length: 23 }, (_, i) => ({ appId: i + 1, name: "Game " + i })) },
    maxVerified: 100,
    discover: async () => { throw Error("Should not discover while queue is nonempty"); },
    importBatch: async (ids) => { pause = true; return response(ids); },
    checkpoint: () => {},
    shouldStop: () => pause,
  });
  assert.equal(first.reason, "paused");
  assert.equal(first.progress.stats.inserted, 10);
  assert.deepEqual(first.progress.candidates.map((x) => x.appId), Array.from({ length: 13 }, (_, i) => i + 11));
  const resumed: number[][] = [];
  const second = await runSteamGrowthSession({
    initial: first.progress, maxVerified: 100,
    discover: async () => { throw Error("Discovery not needed"); },
    importBatch: async (ids) => { resumed.push(ids); return response(ids); },
    checkpoint: () => {},
  });
  assert.equal(second.reason, "end_of_list");
  assert.deepEqual(resumed, [
    Array.from({ length: 10 }, (_, i) => i + 11),
    [21, 22, 23],
  ]);
  assert.equal(second.progress.stats.inserted, 23);
  assert.equal(second.progress.stats.batches, 3);
});

test("rate-limited partial batch retains failed and unprocessed AppIDs for retry", async () => {
  const queued = Array.from({ length: 12 }, (_, i) => ({ appId: i + 1, name: "Game " + i }));
  const saved: SteamGrowthProgress[] = [];
  const result = await runSteamGrowthSession({
    initial: { ...readSteamGrowthProgress(null), candidates: queued },
    maxVerified: 100,
    discover: async () => { throw Error("no discovery should occur"); },
    importBatch: async (ids) => ({
      ...response(ids.slice(0, 4), [4]), requested: ids.length, processed: 4,
    }),
    checkpoint: (state) => saved.push(state),
  });
  assert.equal(result.reason, "upstream_stopped");
  assert.equal(result.verified, 4);
  assert.equal(result.progress.stats.inserted, 3);
  assert.equal(result.progress.stats.failed, 1);
  assert.deepEqual(result.progress.candidates.map((x) => x.appId), Array.from({ length: 9 }, (_, i) => i + 4));
  assert.equal(saved.length, 1);
});

test("malformed server outcomes do not delete pending work", async () => {
  let checkpoints = 0;
  await assert.rejects(runSteamGrowthSession({
    initial: { ...readSteamGrowthProgress(null), candidates: [{ appId: 10, name: "Pending" }] },
    maxVerified: 10,
    discover: async () => { throw Error("Unexpected discovery"); },
    importBatch: async () => ({ ...response([11]), requested: 1 }),
    checkpoint: () => { checkpoints++; },
  }), /Nieprawidłowy raport/);
  assert.equal(checkpoints, 0);
});

test("empty terminal discovery ends the run without busy retrying", async () => {
  let calls = 0;
  const result = await runSteamGrowthSession({
    initial: readSteamGrowthProgress(null), maxVerified: 100,
    discover: async () => {
      calls++;
      return { candidates: [], nextCursor: 0, hasMore: false, scanned: 0, alreadyInCatalog: 0 };
    },
    importBatch: async () => { throw Error("No candidates"); },
    checkpoint: () => {},
  });
  assert.equal(result.reason, "end_of_list");
  assert.equal(calls, 1);
});
