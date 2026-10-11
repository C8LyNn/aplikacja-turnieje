import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(relative, requireFn = () => { throw new Error("Unexpected dependency"); }) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: relative,
  }).outputText;
  const exports = {};
  runInNewContext(javascript, { exports, require: requireFn });
  return exports;
}
const timeline = load("../src/animation/timeline.ts");
const motion = load("../src/animation/motion.ts", (id) => {
  if (id === "./timeline") return timeline;
  throw new Error("Unexpected dependency: " + id);
});

const settings = {
  x: 10, y: -15, scale: 100, rotation: 0, opacity: 75,
};
const layer = (time) => ({
  instanceId: "effect:one",
  effectId: "rainfall",
  settings,
  timeline: time,
});

test("legacy and disabled timelines do not create motion", () => {
  assert.equal(motion.getLayerMotionAnimation(layer(undefined)), null);
  assert.equal(motion.getLayerMotionAnimation(layer({ mode: "off", keyframes: [{ timeMs: 0 }] })), null);
});

test("two keyframes generate bounded transform and opacity properties", () => {
  const result = motion.getLayerMotionAnimation(layer({
    mode: "once", delayMs: 1000, durationMs: 4000, fadeInMs: 0, fadeOutMs: 0,
    easing: "linear",
    keyframes: [
      { timeMs: 0, x: 10, y: -15, scale: 100, rotation: 0, opacity: 100 },
      { timeMs: 4000, x: 65, y: 25, scale: 160, rotation: 90, opacity: 30 },
    ],
  }));
  assert.match(result.animation, /5000ms linear 0ms 1 normal both/);
  assert.match(result.css, /0% \{ transform: translate\(10%, -15%\) scale\(1\) rotate\(0deg\); opacity: 1; \}/);
  assert.match(result.css, /20% \{ transform: translate\(10%, -15%\)/);
  assert.match(result.css, /100% \{ transform: translate\(65%, 25%\) scale\(1\.6\) rotate\(90deg\); opacity: 0\.3; \}/);
});

test("partial imported frames inherit defaults and invalid poses are clamped", () => {
  const frames = motion.normalizeLayerKeyframes([
    { timeMs: 0, x: Infinity, y: 800, scale: -999, opacity: 110, rotation: "nonsense" },
    { timeMs: 2000, x: 40 },
    { timeMs: 2000, x: 70 },
    { timeMs: -1000, x: -900 },
    { timeMs: "2000", x: 44 },
    null,
  ], 4000, settings);
  assert.equal(frames.length, 3);
  assert.equal(frames[0].timeMs, 0);
  assert.equal(frames[0].x, -300);
  assert.equal(frames[1].x, 70);
  assert.equal(frames[1].y, -15);
  assert.equal(frames[1].opacity, 100);
});

test("deduplicates timestamp and limits motion tracks to sixteen frames", () => {
  const entries = Array.from({ length: 40 }, (_, i) => ({ timeMs: i * 100, x: i }));
  assert.equal(motion.normalizeLayerKeyframes(entries, 8000, settings).length, 16);
  const after = motion.upsertKeyframe(
    { durationMs: 8000, keyframes: [{ timeMs: 1000, x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 }] },
    1000, { x: 34, y: 0, scale: 100, rotation: 0, opacity: 100 }, settings,
  );
  assert.equal(after.length, 1);
  assert.equal(after[0].x, 34);
});

test("keyframe names cannot inject styles and loop easing is included", () => {
  const result = motion.getLayerMotionAnimation({
    ...layer({ mode: "loop", delayMs: 0, durationMs: 2000, easing: "ease-in-out",
      keyframes: [{ timeMs: 0 }, { timeMs: 2000, opacity: 0 }] }),
    instanceId: 'evil"}body{background:red}',
  });
  assert.match(result.animation, /2000ms ease-in-out 0ms infinite normal both/);
  assert.doesNotMatch(result.css, /background:red/);
  assert.match(result.css, /@keyframes ae-motion-[a-z0-9]+/);
});
