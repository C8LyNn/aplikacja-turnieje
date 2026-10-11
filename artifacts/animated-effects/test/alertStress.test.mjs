import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(file, requireFn = (id) => { throw new Error(id); }, environment = {}) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, require: requireFn, ...environment });
  return exports;
}

const stress = load("../src/animation/alertStress.ts");
const { makeStressEvents, assessFrames, summarizeStress } = stress;

test("traffic profiles are stable, timestamp sorted, duration-bounded and contain no viewer data", () => {
  for (const mode of ["steady", "burst", "chat-flood"]) {
    const first = makeStressEvents(mode, 12000);
    const second = makeStressEvents(mode, 12000);
    assert.equal(JSON.stringify(first), JSON.stringify(second));
    assert.ok(first.length > 2);
    assert.ok(first.every((x) => x.atMs >= 0 && x.atMs < 12000));
    assert.ok(first.every((x, i) => i === 0 || first[i - 1].atMs <= x.atMs));
    assert.ok(first.every((x) => Object.keys(x).sort().join(",") === "amount,atMs,listener"));
    assert.ok(!JSON.stringify(first).includes("displayName"));
  }
  assert.ok(makeStressEvents("chat-flood", 12000).length > makeStressEvents("steady", 12000).length * 5);
  assert.ok(makeStressEvents("chat-flood", 60000).length <= 900);
});

test("rAF analysis refuses to guess FPS with insufficient samples", () => {
  assert.equal(assessFrames([]).status, "insufficient");
  assert.equal(assessFrames([16, 16, 16]).approximateFps, null);
  const good = assessFrames(Array(60).fill(16.67));
  assert.equal(good.status, "ok");
  assert.equal(good.approximateFps, 60);
  assert.ok(good.p95FrameMs < 17);
  assert.equal(good.slowFramesPercent, 0);
});

test("slow rAF cadence and long-tail spikes generate grounded warnings", () => {
  const values = Array(100).fill(16.67);
  for (let i = 0; i < 20; i++) values[i] = 70;
  const frames = assessFrames(values);
  assert.equal(frames.status, "warning");
  assert.equal(frames.slowFramesPercent, 20);
  assert.ok(frames.p95FrameMs > 50);
  const result = summarizeStress({
    total: 40, dispatched: 30, durationMs: 12000,
    waitingPeak: 16, dropped: 7, evicted: 3, accepted: 24, frame: frames,
  });
  assert.ok(result.warnings.some((x) => x.includes("Kolejka")));
  assert.ok(result.warnings.some((x) => x.includes("Odrzucono")));
  assert.ok(result.warnings.some((x) => x.includes("requestAnimationFrame")));
  assert.ok(result.warnings.some((x) => x.includes("wszystkich")));
});

function loadHarness() {
  const timeline = load("../src/animation/timeline.ts");
  const motion = load("../src/animation/motion.ts", (name) => {
    if (name === "./timeline") return timeline;
    throw new Error(name);
  });
  const avatar = load("../src/animation/alertAvatar.ts");
  const captionMotion = load("../src/animation/captionMotion.ts");
  const text = load("../src/animation/alertText.ts", (name) => {
    if (name === "./alertAvatar") return avatar;
    if (name === "./captionMotion") return captionMotion;
    throw new Error(name);
  });
  const trigger = load("../src/animation/triggers.ts", (name) => {
    if (name === "./motion") return motion;
    if (name === "./alertText") return text;
    throw new Error(name);
  });
  const diagnosis = load("../src/animation/alertDiagnosticEngine.ts", (name) => {
    if (name === "./triggers") return trigger;
    throw new Error(name);
  });
  let now = 0;
  let visibilityState = "visible";
  const intervals = new Map();
  const frames = new Map();
  let serial = 0;
  const environment = {
    performance: { now: () => now },
    document: { get visibilityState() { return visibilityState; } },
    window: {
      setInterval(fn) { const id = ++serial; intervals.set(id, fn); return id; },
      clearInterval(id) { intervals.delete(id); },
    },
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  const mod = load("../src/animation/alertStressRunner.ts", (name) => {
    if (name === "./triggers") return trigger;
    if (name === "./alertStress") return stress;
    throw new Error(name);
  }, environment);
  function step(ms) {
    const target = now + ms;
    while (now < target) {
      now = Math.min(target, now + 16);
      const fns = [...frames.values()];
      frames.clear();
      for (const fn of fns) fn(now);
      if (Math.round(now) % 64 < 16) for (const fn of [...intervals.values()]) fn();
    }
  }
  const layer = {
    instanceId: "one", effectId: "stub", enabled: true,
    settings: { opacity: 100, x: 0, y: 0, scale: 100, rotation: 0 },
    timeline: { mode: "once", delayMs: 0, durationMs: 700, fadeInMs: 0, fadeOutMs: 0 },
    trigger: { source: "event", event: "message", queueMode: "queue", cooldownMs: 0, minAmount: 0, priority: 3 },
  };
  return { Runner: mod.AlertStressRunner, engine: new diagnosis.AlertDiagnosticEngine(), layer, step,
    setHidden() { visibilityState = "hidden"; },
    getTimers() { return intervals.size; },
    getFrames() { return frames.size; } };
}

test("automatic runner advances local queue in real time and closes timers at completion", () => {
  const testbed = loadHarness();
  const runner = new testbed.Runner(testbed.engine);
  const started = [];
  const finished = [];
  runner.start("chat-flood", 3000, [testbed.layer], {
    onPlay(item) { started.push(item.instanceId); },
    onProgress() {},
    onFinish(report, status) { finished.push({ report, status }); },
  });
  testbed.step(3300);
  assert.equal(runner.isRunning(), false);
  assert.equal(finished.length, 1);
  assert.equal(finished[0].status, "completed");
  assert.ok(finished[0].report.dispatched > 4);
  assert.ok(started.length > 0);
  assert.ok(finished[0].report.frame.samples >= 20);
  assert.equal(testbed.getTimers(), 0);
  assert.equal(testbed.getFrames(), 0);
});

test("a backgrounded browser tab aborts measurements rather than reporting success", () => {
  const testbed = loadHarness();
  const runner = new testbed.Runner(testbed.engine);
  const statuses = [];
  runner.start("burst", 12000, [testbed.layer], {
    onPlay() {}, onProgress() {},
    onFinish(_summary, status) { statuses.push(status); },
  });
  testbed.step(400);
  testbed.setHidden();
  testbed.step(100);
  assert.equal(runner.isRunning(), false);
  assert.deepEqual(statuses, ["hidden"]);
  assert.equal(testbed.getTimers(), 0);
  assert.equal(testbed.getFrames(), 0);
});
