import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/animation/timeline.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: "timeline.ts",
}).outputText;
const exports = {};
runInNewContext(javascript, { exports });
const { normalizeLayerTimeline, getLayerTimelineAnimation } = exports;

function layer(timeline, instanceId = "123e4567-e89b-12d3-a456-426614174000") {
  return { instanceId, effectId: "rainfall", timeline };
}

test("untimed scenes preserve legacy continuous behavior", () => {
  assert.equal(getLayerTimelineAnimation(layer(undefined)), null);
  assert.equal(getLayerTimelineAnimation(layer({ mode: "off" })), null);
});

test("one-shot opacity envelope includes delay, fade and final invisibility", () => {
  const timing = { mode: "once", delayMs: 2000, durationMs: 4000, fadeInMs: 1000, fadeOutMs: 1000 };
  const result = getLayerTimelineAnimation(layer(timing));
  assert.match(result.animation, /6000ms linear 0ms 1 normal both/);
  assert.match(result.css, /0% \{ opacity: 0; \}/);
  assert.match(result.css, /33\.333333% \{ opacity: 0; \}/);
  assert.match(result.css, /50% \{ opacity: 1; \}/);
  assert.match(result.css, /83\.333333% \{ opacity: 1; \}/);
  assert.match(result.css, /100% \{ opacity: 0; \}/);
});

test("loop mode retains delay inside every repeat", () => {
  const result = getLayerTimelineAnimation(layer({
    mode: "loop", delayMs: 1000, durationMs: 3000, fadeInMs: 0, fadeOutMs: 0,
  }));
  assert.match(result.animation, /4000ms linear 0ms infinite normal both/);
  assert.match(result.css, /0% \{ opacity: 0; \}/);
  assert.match(result.css, /25% \{ opacity: 1; \}/);
});

test("normalizes malformed imported timing without producing unsafe CSS", () => {
  const result = normalizeLayerTimeline({
    mode: "invalid", delayMs: Infinity, durationMs: -5000, fadeInMs: 90000, fadeOutMs: -5,
  });
  assert.equal(result.mode, "off");
  assert.equal(result.delayMs, 0);
  assert.equal(result.durationMs, 250);
  assert.equal(result.fadeInMs, 250);
  assert.equal(result.fadeOutMs, 0);
  const animation = getLayerTimelineAnimation(layer({ ...result, mode: "once" }, "unsafe; } color:red"));
  assert.doesNotMatch(animation.css, /color:red/);
  assert.match(animation.css, /@keyframes ae-timeline-unsafecolorred/);
});

test("independent layers get independent scoped keyframe names", () => {
  const timeline = { mode: "loop", delayMs: 0, durationMs: 8000, fadeInMs: 500, fadeOutMs: 500 };
  const a = getLayerTimelineAnimation(layer(timeline, "one"));
  const b = getLayerTimelineAnimation(layer(timeline, "two"));
  assert.notEqual(a.animation.split(" ")[0], b.animation.split(" ")[0]);
});
