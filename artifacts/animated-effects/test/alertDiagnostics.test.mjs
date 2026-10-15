import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(file, requireFn = (id) => { throw new Error(id); }) {
  const code = readFileSync(new URL(file, import.meta.url), "utf8");
  const js = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(js, { exports, require: requireFn });
  return exports;
}
const timeline = load("../src/animation/timeline.ts");
const motion = load("../src/animation/motion.ts", (id) => id === "./timeline" ? timeline : undefined);
const avatar = load("../src/animation/alertAvatar.ts");
const captionMotion = load("../src/animation/captionMotion.ts");
const caption = load("../src/animation/alertText.ts", (id) => {
  if (id === "./alertAvatar") return avatar;
  if (id === "./captionMotion") return captionMotion;
  throw new Error(id);
});
const triggers = load("../src/animation/triggers.ts", (id) => {
  if (id === "./motion") return motion;
  if (id === "./alertText") return caption;
  throw new Error(id);
});
const { AlertDiagnosticEngine } = load("../src/animation/alertDiagnosticEngine.ts", (id) => {
  if (id === "./triggers") return triggers;
  throw new Error(id);
});

function layer(id, event, priority = 5, cooldownMs = 0, minAmount = 0, queueMode = "queue") {
  return {
    instanceId: id, enabled: true, effectId: "stub",
    trigger: { source: "event", event, priority, cooldownMs, minAmount, queueMode },
  };
}

test("diagnostic workbench uses stable priority queue and does not interrupt active item", () => {
  const engine = new AlertDiagnosticEngine();
  const layers = [
    layer("follow", "follower-latest", 5),
    layer("chat", "message", 2),
    layer("tip", "tip-latest", 10),
  ];
  assert.equal(engine.dispatch(layers, "follower-latest", 0, 10000)[0].instanceId, "follow");
  assert.equal(engine.dispatch(layers, "message", 0, 10001).length, 0);
  assert.equal(engine.dispatch(layers, "tip-latest", 30, 10002).length, 0);
  let snapshot = engine.getSnapshot();
  assert.equal(snapshot.current.instanceId, "follow");
  assert.deepEqual(Array.from(snapshot.waiting, (item) => item.instanceId), ["tip", "chat"]);
  assert.equal(engine.finishCurrent().instanceId, "tip");
  assert.equal(engine.finishCurrent().instanceId, "chat");
  assert.equal(engine.finishCurrent(), null);
  snapshot = engine.getSnapshot();
  assert.equal(snapshot.counters.started, 3);
  assert.equal(snapshot.counters.completed, 3);
  assert.equal(snapshot.counters.dropped, 0);
});

test("cooldown and monetary threshold decisions are visible without event payloads", () => {
  const engine = new AlertDiagnosticEngine();
  const follow = layer("follow", "follower-latest", 5, 3000);
  const tip = layer("tip", "tip-latest", 10, 0, 20);
  engine.dispatch([follow, tip], "follower-latest", 0, 10000);
  engine.dispatch([follow, tip], "follower-latest", 0, 10100);
  engine.dispatch([follow, tip], "tip-latest", 10, 10100);
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.counters.dropped, 2);
  assert.deepEqual(Array.from(snapshot.lines.filter((x) => x.action === "dropped"), (x) => x.reason), [
    "below-threshold", "cooldown",
  ]);
  assert.ok(!JSON.stringify(snapshot).includes("Viewer_123"), "no raw viewer data is retained");
});

test("queue overflow admits a more important alert and drops least important one", () => {
  const engine = new AlertDiagnosticEngine();
  const chat = layer("chat", "message", 2);
  for (let i = 0; i < 17; i++) engine.dispatch([chat], "message", 0, 11000 + i);
  let snapshot = engine.getSnapshot();
  assert.equal(snapshot.waiting.length, 16);
  const tip = layer("tip", "tip-latest", 10);
  engine.dispatch([tip], "tip-latest", 200, 12000);
  snapshot = engine.getSnapshot();
  assert.equal(snapshot.waiting.length, 16);
  assert.equal(snapshot.waiting[0].instanceId, "tip");
  assert.equal(snapshot.counters.evicted, 1);
  const last = engine.dispatch([chat], "message", 0, 12001);
  assert.equal(last.length, 0);
  snapshot = engine.getSnapshot();
  assert.equal(snapshot.counters.dropped, 1);
  assert.equal(snapshot.lines[0].reason, "queue-full");
  assert.equal(snapshot.lines[0].waiting, 16);
});

test("diagnostic log is bounded to 60 entries and reset is safe", () => {
  const engine = new AlertDiagnosticEngine();
  const follow = layer("one", "follower-latest", 1, 99999);
  for (let i = 0; i < 100; i++) engine.dispatch([follow], "follower-latest", 0, 10000 + i);
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.lines.length, 60);
  assert.equal(snapshot.counters.dropped, 99);
  engine.reset();
  assert.equal(engine.getSnapshot().lines.length, 0);
  assert.equal(engine.getSnapshot().waiting.length, 0);
  assert.equal(engine.getSnapshot().current, null);
  assert.equal(engine.getSnapshot().counters.dropped, 0);
});
