import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(file, requireFn = (name) => { throw new Error(name); }) {
  const code = readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, require: requireFn });
  return exports;
}

const trace = load("../src/animation/alertTrace.ts", (name) => {
  if (name === "./triggers") return {
    STREAM_EVENTS: ["follower-latest", "subscriber-latest", "tip-latest", "cheer-latest", "raid-latest", "message"].map((value) => ({ value })),
  };
  throw new Error(name);
});
const base = {
  version: 1, source: "burst", durationMs: 12000,
  events: [
    { atMs: 0, listener: "message", amount: 0 },
    { atMs: 250, listener: "follower-latest", amount: 0 },
    { atMs: 800, listener: "tip-latest", amount: 75 },
  ],
};

test("trace export/import preserves exact ordering and strips unknown viewer fields", () => {
  const raw = JSON.stringify({
    ...base,
    session: "private-session",
    events: base.events.map((e) => ({ ...e, name: "PRIVATE_VIEWER", text: "PRIVATE_MESSAGE", avatar: "SECRET" })),
  });
  const parsed = trace.parseAlertTraceJson(raw);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.events.length, 3);
  assert.equal(parsed.events[2].amount, 75);
  const exported = trace.serializeAlertTrace(parsed);
  assert.ok(!exported.includes("PRIVATE_VIEWER"));
  assert.ok(!exported.includes("PRIVATE_MESSAGE"));
  assert.ok(!exported.includes("private-session"));
  assert.deepEqual(JSON.parse(exported), base);
  assert.equal(trace.alertTraceKey(base), trace.alertTraceKey(parsed));
  assert.equal(trace.alertTraceKey({ ...base, source: "custom" }), trace.alertTraceKey(parsed));
});

test("rejects malformed, oversized or unsafe trace imports", () => {
  const bad = [
    { ...base, version: 99 },
    { ...base, source: "external-chat" },
    { ...base, durationMs: 0 },
    { ...base, durationMs: 100000 },
    { ...base, events: [{ atMs: -1, listener: "message", amount: 0 }] },
    { ...base, events: [{ atMs: 12000, listener: "message", amount: 0 }] },
    { ...base, events: [{ atMs: 5.2, listener: "message", amount: 0 }] },
    { ...base, events: [{ atMs: 5, listener: "__proto__", amount: 0 }] },
    { ...base, events: [{ atMs: 5, listener: "message", amount: Infinity }] },
    { ...base, events: [{ atMs: 5, listener: "message", amount: 1000001 }] },
    { ...base, events: [...base.events].reverse() },
    { ...base, events: Array.from({ length: 901 }, (_, i) => ({ atMs: i, listener: "message", amount: 0 })) },
  ];
  for (const item of bad) assert.throws(() => trace.parseAlertTrace(item));
  assert.throws(() => trace.parseAlertTraceJson(" ".repeat(100001)), /100 KB/);
  assert.throws(() => trace.parseAlertTraceJson("{ bad-json"), /JSON/);
  assert.throws(() => trace.parseAlertTraceJson("null"));
});

const result = (dispatched, dropped, peak, fps, p95) => ({
  total: 3, dispatched, durationMs: 12000, waitingPeak: peak,
  accepted: dispatched - dropped, dropped, evicted: 0,
  frame: { approximateFps: fps, p95FrameMs: p95, samples: 400,
    slowFramesPercent: 0, status: "ok" },
  warnings: [],
});

test("A/B with the same trace shows accurate signed deltas without invented verdict", () => {
  const key = trace.alertTraceKey(base);
  const cmp = trace.compareTraceResults(
    { traceKey: key, result: result(3, 2, 12, 58, 27) },
    { traceKey: key, result: result(3, 0, 6, 60, 18) },
  );
  assert.equal(cmp.comparable, true);
  const dropped = cmp.measures.find((x) => x.label === "Odrzucone");
  const queue = cmp.measures.find((x) => x.label === "Maks. kolejka");
  const fps = cmp.measures.find((x) => x.label === "Szacowane FPS (rAF)");
  assert.equal(dropped.delta, -2);
  assert.equal(queue.delta, -6);
  assert.equal(fps.delta, 2);
  assert.ok(cmp.reasons.some((x) => x.includes("rAF")));
});

test("different traces block comparisons and insufficient FPS does not invent deltas", () => {
  const left = trace.alertTraceKey(base);
  const right = trace.alertTraceKey({ ...base, events: base.events.slice(1) });
  const cmp = trace.compareTraceResults(
    { traceKey: left, result: result(3, 2, 10, 58, 30) },
    { traceKey: right, result: result(2, 0, 4, 61, 12) },
  );
  assert.equal(cmp.comparable, false);
  assert.ok(cmp.measures.every((metric) => metric.delta === null));
  const eq = trace.compareTraceResults(
    { traceKey: left, result: result(3, 2, 10, null, null) },
    { traceKey: left, result: result(3, 2, 10, 60, 17) },
  );
  assert.equal(eq.comparable, true);
  assert.equal(eq.measures.find((x) => x.label === "Szacowane FPS (rAF)").delta, null);
});
