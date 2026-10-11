import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(path, resolve = () => { throw new Error("Unexpected dependency"); }) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, require: resolve });
  return exports;
}
const timeline = load("../src/animation/timeline.ts");
const motion = load("../src/animation/motion.ts", (name) => {
  if (name === "./timeline") return timeline;
  throw new Error(name);
});
const avatar = load("../src/animation/alertAvatar.ts");
const motionStyles = load("../src/animation/captionMotion.ts");
const alertText = load("../src/animation/alertText.ts", (id) => {
  if (id === "./alertAvatar") return avatar;
  if (id === "./captionMotion") return motionStyles;
  throw new Error(id);
});
const triggers = load("../src/animation/triggers.ts", (name) => {
  if (name === "./motion") return motion;
  if (name === "./alertText") return alertText;
  throw new Error(name);
});
const { normalizeEffectTrigger, eventPlaybackInstance, matchesEffectTrigger, triggerPlaybackDurationMs } = triggers;

test("old scenes remain continuous and unsupported event names fall back safely", () => {
  assert.equal(normalizeEffectTrigger(undefined), undefined);
  assert.equal(normalizeEffectTrigger({ source: "always" }), undefined);
  assert.equal(normalizeEffectTrigger({ source: "event", event: "__proto__", cooldownMs: -999 }).event, "follower-latest");
});

test("event trigger configuration clamps amounts and anti-spam intervals", () => {
  const cfg = normalizeEffectTrigger({
    source: "event", event: "cheer-latest", cooldownMs: 99999999, minAmount: 7000000,
  });
  assert.equal(cfg.event, "cheer-latest");
  assert.equal(cfg.cooldownMs, 60000);
  assert.equal(cfg.minAmount, 1000000);
});

test("match follow, donation/cheer amount and cooldown but ignore unknown listeners", () => {
  const follow = { source: "event", event: "follower-latest", cooldownMs: 3000, minAmount: 0 };
  assert.equal(matchesEffectTrigger(follow, "follower-latest", {}, 3100), true);
  assert.equal(matchesEffectTrigger(follow, "follower-latest", {}, 300), false);
  assert.equal(matchesEffectTrigger(follow, "subscriber-latest", {}, 6000), false);
  const tip = { source: "event", event: "tip-latest", cooldownMs: 0, minAmount: 25 };
  assert.equal(matchesEffectTrigger(tip, "tip-latest", { amount: 25 }, Infinity), true);
  assert.equal(matchesEffectTrigger(tip, "tip-latest", { amount: 24.99 }, Infinity), false);
  assert.equal(matchesEffectTrigger(tip, "tip-latest", { amount: "oops" }, Infinity), false);
  assert.equal(matchesEffectTrigger(tip, "tip-latest", null, Infinity), false);
});

test("event playback forces one cycle without mutating the saved looping scene", () => {
  const instance = {
    instanceId: "effect-1",
    settings: { x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 },
    timeline: { mode: "loop", delayMs: 1000, durationMs: 4000, fadeInMs: 500, fadeOutMs: 500 },
    trigger: { source: "event", event: "message", cooldownMs: 5000, minAmount: 0 },
  };
  const playback = eventPlaybackInstance(instance);
  assert.equal(playback.timeline.mode, "once");
  assert.equal(instance.timeline.mode, "loop");
  assert.equal(triggerPlaybackDurationMs(instance), 5100);
  const continuous = { ...instance, trigger: undefined };
  assert.equal(eventPlaybackInstance(continuous), continuous);
});


test("priority is optional in old scenes, clamped to 0..10 for new and imported scenes", () => {
  const make = (priority) => normalizeEffectTrigger({ source: "event", event: "tip-latest", priority });
  assert.equal(make(undefined).priority, 5);
  assert.equal(make(-100).priority, 0);
  assert.equal(make(99999).priority, 10);
  assert.equal(make(7.6).priority, 8);
  assert.equal(make("bad").priority, 5);
});
