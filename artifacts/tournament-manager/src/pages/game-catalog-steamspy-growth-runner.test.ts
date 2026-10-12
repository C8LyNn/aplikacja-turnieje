import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeSteamSpyDiscoveryPage, parseSteamSpySourceProgress, runSteamSpyGrowthSession,
  type SteamSpyGrowthCheckpoint,
} from "./game-catalog-steamspy-growth-runner";
import {
  readSteamGrowthProgress, type SteamBatchResponse,
} from "./game-catalog-growth-runner";

function verifiedResponse(appIds: number[], failures: number[] = []): SteamBatchResponse {
  return {
    requested: appIds.length, processed: appIds.length,
    inserted: appIds.length - failures.length, existing: 0, ignored: 0,
    failed: failures.length, aborted: failures.length > 0, rateLimited: failures.length > 0,
    results: appIds.map((appId) => ({
      appId, status: failures.includes(appId) ? "upstream_error" : "inserted",
    })),
  };
}
const source = () => ({ page: 0, offset: 0, hasMore: true });
const queue = () => readSteamGrowthProgress(null);

test("SteamSpy source progress rejects malformed or overflowing values", () => {
  assert.deepEqual(parseSteamSpySourceProgress({page: 10, offset: 900, hasMore: true}), {
    page: 10, offset: 900, hasMore: true,
  });
  for (const invalid of [null, [], "broken", {page: -1, offset: 0, hasMore: true},
    {page: 1, offset: 1000, hasMore: true},
    {page: "1", offset: 0, hasMore: true},
    {page: 302, offset: 0, hasMore: false},
  ]) assert.deepEqual(parseSteamSpySourceProgress(invalid), source());
});

test("SteamSpy discovery keeps original Steam cursor and validates cursor movement", () => {
  const pending = { ...queue(), cursor: 1234,
    candidates: [{ appId: 10, name: "Existing queued" }] };
  const merged = mergeSteamSpyDiscoveryPage(pending, source(), {
    candidates: [{ appId: 10, name: "Duplicate" }, { appId: 20, name: "New" }],
    scanned: 3, alreadyInCatalog: 1, nextPage: 0, nextOffset: 3, hasMore: true,
  }, 100);
  assert.equal(merged.queue.cursor, 1234);
  assert.deepEqual(merged.queue.candidates.map(x=>x.appId), [10,20]);
  assert.deepEqual(merged.source, {page: 0, offset: 3, hasMore: true});
  for (const bad of [
    { nextPage: 0, nextOffset: 0 },
    { nextPage: 0, nextOffset: -1 },
    { nextPage: 3, nextOffset: 0 },
    { nextPage: 1, nextOffset: 1 },
    { scanned: 101 },
    { candidates: [{ appId: -1, name: "Bad" }] },
  ]) {
    assert.throws(() => mergeSteamSpyDiscoveryPage(pending, source(), {
      candidates: [{ appId: 30, name: "Game" }], scanned: 1, alreadyInCatalog: 0,
      nextPage: 0, nextOffset: 1, hasMore: true, ...bad,
    }, 100));
  }
});

test("single action fetches SteamSpy pages and imports at most 100 verified AppIDs", async () => {
  const sources: {page:number,offset:number,pageSize:number}[] = [];
  const batches: number[][] = [];
  const checkpoints: SteamSpyGrowthCheckpoint[] = [];
  const completed = await runSteamSpyGrowthSession({
    initial: queue(), source: source(), maxVerified: 100,
    discover: async (request) => {
      sources.push(request);
      return {
        candidates: Array.from({length: 50}, (_, i) => ({
          appId: sources.length * 1000 + i + 1, name: "Game " + i,
        })),
        scanned: 50, alreadyInCatalog: 0, hasMore: true,
        nextPage: 0, nextOffset: request.offset + 50,
      };
    },
    importBatch: async (ids) => {batches.push(ids); return verifiedResponse(ids);},
    checkpoint: state => checkpoints.push(structuredClone(state)),
  });
  assert.equal(completed.reason, "limit");
  assert.equal(completed.verified, 100);
  assert.equal(completed.pages, 2);
  assert.equal(completed.queue.stats.inserted, 100);
  assert.equal(completed.queue.stats.batches, 10);
  assert.equal(completed.queue.stats.scanned, 100);
  assert.deepEqual(completed.source, {page:0, offset:100, hasMore:true});
  assert.equal(batches.length, 10);
  assert.equal(checkpoints.length, 12);
  assert.equal(sources.length, 2);
});

test("preexisting queue imports first, retains keyed Steam cursor and can continue discovery", async () => {
  const initial = {...queue(), cursor: 570, hasMore: true,
    candidates: Array.from({length: 12}, (_, i) => ({appId: i+1, name: "Queued"})) };
  let discovered = 0;
  const ids: number[] = [];
  const result = await runSteamSpyGrowthSession({
    initial, source: source(), maxVerified: 20,
    discover: async () => {
      discovered++;
      return { candidates: Array.from({length: 8}, (_, i) => ({appId:i+13,name:"Found"})),
        scanned:8, alreadyInCatalog:0, nextPage:1, nextOffset:0, hasMore:false };
    },
    importBatch: async batch => {ids.push(...batch);return verifiedResponse(batch);},
    checkpoint: ()=>{},
  });
  assert.equal(result.reason, "limit");
  assert.equal(result.verified, 20);
  assert.equal(result.queue.cursor, 570);
  assert.equal(result.queue.hasMore, true);
  assert.deepEqual(ids, Array.from({length:20},(_,i)=>i+1));
  assert.equal(discovered, 1);
});

test("pause after first verified batch; resume without duplicate inserts", async () => {
  let paused = false;
  const checkpoints: SteamSpyGrowthCheckpoint[] = [];
  const common = {
    initial: queue(), source: source(),
    discover: async () => ({
      candidates:Array.from({length:25},(_,i)=>({appId:i+1,name:"SteamSpy Game"})),
      scanned:25, alreadyInCatalog:0, nextPage:1, nextOffset:0, hasMore:false,
    }),
  };
  const first = await runSteamSpyGrowthSession({
    ...common, maxVerified:100,
    importBatch: async ids => {paused = true;return verifiedResponse(ids);},
    shouldStop:()=>paused,
    checkpoint: state=>checkpoints.push(structuredClone(state)),
  });
  assert.equal(first.reason, "paused");
  assert.equal(first.verified, 10);
  assert.equal(first.queue.candidates.length, 15);
  const rest: number[] = [];
  const second = await runSteamSpyGrowthSession({
    ...common, initial:first.queue, source:first.source,
    discover:async()=>{throw Error("Should not discover terminal source");},
    importBatch:async ids=>{rest.push(...ids);return verifiedResponse(ids);},
    checkpoint:()=>{},
  });
  assert.equal(second.reason,"end_of_list");
  assert.deepEqual(rest,Array.from({length:15},(_,i)=>i+11));
  assert.equal(second.queue.stats.inserted,25);
  assert.equal(checkpoints.length,2);
});

test("rate limited batch checkpoints completed rows and retains failed IDs", async () => {
  const result = await runSteamSpyGrowthSession({
    initial:{...queue(), candidates:Array.from({length:12},(_,i)=>({appId:i+1,name:"Game"}))},
    source:source(),
    discover:async()=>{throw Error("No additional API discovery allowed");},
    importBatch:async ids=>({...verifiedResponse(ids.slice(0,3),[3]),requested:ids.length}),
    checkpoint:()=>{},
  });
  assert.equal(result.reason,"upstream_stopped");
  assert.equal(result.verified,3);
  assert.equal(result.queue.stats.inserted,2);
  assert.deepEqual(result.queue.candidates.map(x=>x.appId),
    Array.from({length:10},(_,i)=>i+3));
});

test("SteamSpy upstream error does not discard a checkpointed queue or cursor", async () => {
  let last:SteamSpyGrowthCheckpoint|null=null;
  let requests=0;
  await assert.rejects(runSteamSpyGrowthSession({
    initial:queue(), source:source(), maxVerified:100,
    discover:async ()=> {
      requests++;
      if(requests>1) throw new Error("429 STEAMSPY_COOLDOWN");
      return {candidates:[], scanned:100, alreadyInCatalog:100,
        nextPage:0, nextOffset:100, hasMore:true};
    },
    importBatch:async()=>{throw Error("No queue to import");},
    checkpoint:state=>{last=structuredClone(state);},
  }),/429/);
  assert.ok(last);
  assert.deepEqual((last as SteamSpyGrowthCheckpoint).source, {page:0,offset:100,hasMore:true});
  assert.equal((last as SteamSpyGrowthCheckpoint).queue.stats.scanned,100);
});

test("bounded empty pages cannot spin indefinitely",async()=>{
  let pages=0;
  const result=await runSteamSpyGrowthSession({
    initial:queue(),source:source(),maxVerified:100,maxPages:3,
    discover:async req=>{pages++;return {candidates:[],scanned:100,alreadyInCatalog:100,
      nextPage:0,nextOffset:req.offset+100,hasMore:true};},
    importBatch:async()=>{throw Error("No candidates");},
    checkpoint:()=>{},
  });
  assert.equal(result.reason,"limit");
  assert.equal(result.pages,3);
  assert.equal(pages,3);
});
