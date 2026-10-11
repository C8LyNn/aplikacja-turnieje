import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function moduleFromFile(path, requireFn = () => { throw new Error("Unexpected module"); }) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, require: requireFn });
  return exports;
}
const timeline = moduleFromFile("../src/animation/timeline.ts");
const motion = moduleFromFile("../src/animation/motion.ts", (id) => {
  if (id === "./timeline") return timeline;
  throw new Error(id);
});
const alertText = moduleFromFile("../src/animation/alertText.ts");
const triggers = moduleFromFile("../src/animation/triggers.ts", (id) => {
  if (id === "./motion") return motion;
  if (id === "./alertText") return alertText;
  throw new Error(id);
});
const definition = {
  id: "stub",
  defaultSettings: {},
  performanceCost: 1,
};
const module = {
  css: "",
  definition,
  streamElementsRendererName: "aeRenderStub",
  streamElementsRendererSource: "function aeRenderStub(effect, root) { aeCreateLayer(effect, root); }",
  estimateDomNodes: () => 1,
};
const alertRuntime = moduleFromFile("../src/animation/alertRuntime.ts");
const exporter = moduleFromFile("../src/export/streamElements.ts", (id) => {
  if (id === "../effects/registry") return { getEffectModule: (name) => name === "stub" ? module : undefined };
  if (id === "../animation/timeline") return timeline;
  if (id === "../animation/motion") return motion;
  if (id === "../animation/triggers") return triggers;
  if (id === "../animation/alertRuntime") return alertRuntime;
  throw new Error(id);
});

function element(tag = "div") {
  const node = {
    tagName: tag,
    style: {},
    dataset: {},
    children: [],
    className: "",
    parent: null,
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    replaceChildren() {
      this.children.forEach((item) => { item.parent = null; });
      this.children = [];
    },
    remove() {
      if (this.parent) {
        const index = this.parent.children.indexOf(this);
        if (index >= 0) this.parent.children.splice(index, 1);
      }
      this.parent = null;
    },
    get classList() {
      return { contains: (name) => this.className.split(" ").includes(name) };
    },
  };
  return node;
}
const settings = {
  opacity: 80, x: 0, y: 0, scale: 100, rotation: 0, blur: 0,
  brightness: 100, hue: 0, blendMode: "normal", area: "full", zIndex: 10,
  density: 100, speed: 100, intensity: 100, colorize: false,
};
const scene = (trigger) => ({
  effects: [{
    instanceId: "event1", effectId: "stub", seed: 1, enabled: true,
    settings,
    timeline: { mode: "loop", delayMs: 0, durationMs: 1000, fadeInMs: 100, fadeOutMs: 100 },
    trigger,
  }, {
    instanceId: "always", effectId: "stub", seed: 2, enabled: true, settings,
  }],
});

function runWidget(trigger) {
  const code = exporter.generateStreamElementsExport(scene(trigger));
  const listeners = {};
  const root = element("root");
  const scheduled = new Map();
  let nextId = 1;
  let now = 10000;
  const context = {
    window: { addEventListener: (name, listener) => { listeners[name] = listener; } },
    document: {
      getElementById: (name) => name === "animated-effects-root" ? root : null,
      createElement: (tag) => element(tag),
    },
    console: { log() {}, warn() {}, error() {} },
    Date: { now: () => now },
    setTimeout(fn, delay) {
      const id = nextId++;
      scheduled.set(id, { fn, delay });
      return id;
    },
    clearTimeout: (id) => scheduled.delete(id),
  };
  runInNewContext(code.javascript, context);
  return {
    code,
    root,
    listeners,
    scheduled,
    advance: (ms) => { now += ms; },
  };
}

test("generated widget subscribes to official event entry point and hides event layers until trigger", () => {
  const runtime = runWidget({ source: "event", event: "follower-latest", cooldownMs: 2000, minAmount: 0 });
  assert.equal(typeof runtime.listeners.onEventReceived, "function");
  assert.equal(typeof runtime.listeners.onWidgetLoad, "function");
  runtime.listeners.onWidgetLoad({ detail: {} });
  assert.equal(runtime.root.children.length, 1, "only continuous layer at load");
  runtime.listeners.onEventReceived({ detail: { listener: "subscriber-latest", event: { name: "no" } } });
  assert.equal(runtime.root.children.length, 1);
  runtime.listeners.onEventReceived({ detail: { listener: "follower-latest", event: { name: "viewer" } } });
  assert.equal(runtime.root.children.length, 2);
  assert.equal(runtime.scheduled.size, 1);
  runtime.listeners.onEventReceived({ detail: { listener: "follower-latest", event: { name: "viewer2" } } });
  assert.equal(runtime.root.children.length, 2, "cooldown ignored repeated follow");
  runtime.advance(2000);
  runtime.listeners.onEventReceived({ detail: { listener: "follower-latest", event: { name: "viewer3" } } });
  assert.equal(runtime.root.children.length, 2, "old instance replaced rather than stacked");
  assert.equal(runtime.scheduled.size, 1, "one pending expiry per layer");
  for (const { fn } of runtime.scheduled.values()) fn();
  assert.equal(runtime.root.children.length, 1, "event layer cleaned up");
});

test("generated widget rejects small tips without requiring HTML insertion", () => {
  const runtime = runWidget({ source: "event", event: "tip-latest", cooldownMs: 0, minAmount: 25 });
  runtime.listeners.onWidgetLoad({});
  runtime.listeners.onEventReceived({ detail: { listener: "tip-latest", event: { amount: 12, name: "<script>" } } });
  assert.equal(runtime.root.children.length, 1);
  runtime.listeners.onEventReceived({ detail: { listener: "tip-latest", event: { amount: "bad" } } });
  assert.equal(runtime.root.children.length, 1);
  runtime.listeners.onEventReceived({ detail: { listener: "tip-latest", event: { amount: 25 } } });
  assert.equal(runtime.root.children.length, 2);
});
