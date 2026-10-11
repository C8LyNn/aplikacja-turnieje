import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/animation/transportMath.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const timelineSource = readFileSync(new URL("../src/animation/timeline.ts", import.meta.url), "utf8");
const timelineCompiled = ts.transpileModule(timelineSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const timelineExports = {};
runInNewContext(timelineCompiled, { exports: timelineExports });

const exports = {};
runInNewContext(compiled, {
  exports,
  require(id) {
    if (id === "./timeline") return timelineExports;
    throw new Error("Unexpected transport dependency: " + id);
  },
});
const { sceneDurationMs, clampTimeMs, timeFromPosition } = exports;

test("keeps at least ten seconds of preview for untimed scenes", () => {
  assert.equal(sceneDurationMs([]), 10000);
  assert.equal(sceneDurationMs([{ enabled: true }]), 10000);
});

test("computes the longest enabled timeline without counting hidden layers", () => {
  assert.equal(sceneDurationMs([
    { enabled: true, timeline: { mode: "once", delayMs: 1500, durationMs: 12000 } },
    { enabled: false, timeline: { mode: "loop", delayMs: 60000, durationMs: 120000 } },
    { enabled: true, timeline: { mode: "off", delayMs: 60000, durationMs: 120000 } },
  ]), 13500);
});

test("pointer mapping is snapped to 100 ms, clamped, and handles invalid geometry", () => {
  assert.equal(timeFromPosition(75, 25, 100, 8000), 4000);
  assert.equal(timeFromPosition(20, 25, 100, 8000), 0);
  assert.equal(timeFromPosition(200, 25, 100, 8000), 8000);
  assert.equal(timeFromPosition(61, 25, 100, 8000), 2900);
  assert.equal(timeFromPosition(100, 25, 0, 8000), 0);
  assert.equal(timeFromPosition(NaN, 25, 100, 8000), 0);
});

test("seek clamps non-finite and out-of-bounds values", () => {
  assert.equal(clampTimeMs(NaN, 12000), 0);
  assert.equal(clampTimeMs(-120, 12000), 0);
  assert.equal(clampTimeMs(13500, 12000), 12000);
});
