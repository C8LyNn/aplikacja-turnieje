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
const avatar = moduleFromFile("../src/animation/alertAvatar.ts");
const alertText = moduleFromFile("../src/animation/alertText.ts", (id) => {
  if (id === "./alertAvatar") return avatar;
  throw new Error(id);
});
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
const avatarRuntime = moduleFromFile("../src/animation/avatarRuntime.ts");
const alertRuntime = moduleFromFile("../src/animation/alertRuntime.ts");
const exporter = moduleFromFile("../src/export/streamElements.ts", (id) => {
  if (id === "../effects/registry") return { getEffectModule: (name) => name === "stub" ? module : undefined };
  if (id === "../animation/timeline") return timeline;
  if (id === "../animation/motion") return motion;
  if (id === "../animation/triggers") return triggers;
  if (id === "../animation/alertRuntime") return alertRuntime;
  if (id === "../animation/avatarRuntime") return avatarRuntime;
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
const scene = (trigger, additional = []) => ({
  effects: [{
    instanceId: "event1", effectId: "stub", seed: 1, enabled: true,
    settings,
    timeline: { mode: "loop", delayMs: 0, durationMs: 1000, fadeInMs: 100, fadeOutMs: 100 },
    trigger,
  }, ...additional, {
    instanceId: "always", effectId: "stub", seed: 2, enabled: true, settings,
  }],
});

function runWidget(trigger, additional = []) {
  const code = exporter.generateStreamElementsExport(scene(trigger, additional));
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
    URL,
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


test("exported widget renders bounded follower captions as text, never HTML", () => {
  const runtime = runWidget({
    source: "event", event: "follower-latest", cooldownMs: 0, minAmount: 0,
    caption: { enabled: true, template: "Witaj {name}!", position: "top", fontSize: 54, color: "#ff8800" },
  });
  runtime.listeners.onWidgetLoad({});
  runtime.listeners.onEventReceived({
    detail: { listener: "follower-latest", event: { name: "<img src=x onerror=alert(1)>" } },
  });
  const host = runtime.root.children[1];
  assert.ok(host);
  const text = host.children.find((node) => node.className === "ae-alert-caption");
  assert.ok(text, "caption created alongside the particle layer");
  assert.equal(text.textContent, "Witaj <img src=x onerror=alert(1)>!");
  assert.equal(text.innerHTML, undefined, "user input was never parsed as HTML");
  assert.equal(text.style.top, "8%");
  assert.equal(text.style.color, "#ff8800");
  assert.equal(text.style.fontSize, "54px");
});

test("chat event.data carries displayName and message for safe placeholder substitution", () => {
  const runtime = runWidget({
    source: "event", event: "message", cooldownMs: 0, minAmount: 0,
    caption: { enabled: true, template: "{name}: {message}", position: "bottom", fontSize: 30, color: "#ffffff" },
  });
  runtime.listeners.onWidgetLoad({});
  runtime.listeners.onEventReceived({
    detail: { listener: "message", event: { data: { displayName: "Viewer_13", text: "<b>hej</b>" } } },
  });
  const caption = runtime.root.children[1].children.find((node) => node.className === "ae-alert-caption");
  assert.equal(caption.textContent, "Viewer_13: <b>hej</b>");
  assert.equal(caption.style.bottom, "8%");
});

test("disabled captions and unknown placeholders are non-executable", () => {
  const runtime = runWidget({
    source: "event", event: "tip-latest", cooldownMs: 0, minAmount: 0,
    caption: { enabled: false, template: "{name} {missing}", position: "center", fontSize: 50, color: "#ffffff" },
  });
  runtime.listeners.onWidgetLoad({});
  runtime.listeners.onEventReceived({ detail: { listener: "tip-latest", event: { name: "A", amount: 12 } } });
  assert.equal(runtime.root.children[1].children.some((node) => node.className === "ae-alert-caption"), false);
});


test("embedded JS escapes malicious template delimiters without changing visible caption", () => {
  const hostile = "</script><img src=x onerror=alert(1)> {name}";
  const runtime = runWidget({
    source: "event", event: "follower-latest", cooldownMs: 0, minAmount: 0,
    caption: { enabled: true, template: hostile, position: "bottom", fontSize: 40, color: "#ffffff" },
  });
  assert.doesNotMatch(runtime.code.javascript, /<\/script>/i, "no raw script-closing tag in exported JS");
  assert.match(runtime.code.javascript, /\\u003c/, "dangerous tag delimiter escaped in config literal");
  runtime.listeners.onWidgetLoad({});
  runtime.listeners.onEventReceived({ detail: { listener: "follower-latest", event: { name: "Guest" } } });
  const caption = runtime.root.children[1].children.find((child) => child.className === "ae-alert-caption");
  assert.equal(caption.textContent, "</script><img src=x onerror=alert(1)> Guest");
});

test("queued alerts are serialized even across independent effect layers", () => {
  const config = { source: "event", event: "follower-latest", cooldownMs: 0, minAmount: 0, queueMode: "queue",
    caption: { enabled: true, template: "{name}", position: "bottom", fontSize: 30, color: "#ffffff" } };
  const other = {
    instanceId: "event2", effectId: "stub", seed: 3, enabled: true, settings,
    timeline: { mode: "once", delayMs: 0, durationMs: 500, fadeInMs: 0, fadeOutMs: 0 },
    trigger: { ...config, event: "tip-latest" },
  };
  const widget = runWidget(config, [other]);
  widget.listeners.onWidgetLoad({});
  const send = (listener, name) => widget.listeners.onEventReceived({ detail: { listener, event: { name, amount: 30 } } });
  send("follower-latest", "First");
  send("tip-latest", "Second");
  send("follower-latest", "Third");
  assert.equal(widget.root.children.length, 2, "only one queue item visible");
  let caption = widget.root.children[1].children.find((n) => n.className === "ae-alert-caption");
  assert.equal(caption.textContent, "First");
  const next = () => {
    const [id, timer] = widget.scheduled.entries().next().value;
    widget.scheduled.delete(id);
    timer.fn();
  };
  next();
  assert.equal(widget.root.children.length, 2, "second queued alert replaces first after completion");
  caption = widget.root.children[1].children.find((n) => n.className === "ae-alert-caption");
  assert.equal(caption.textContent, "Second");
  next();
  caption = widget.root.children[1].children.find((n) => n.className === "ae-alert-caption");
  assert.equal(caption.textContent, "Third");
  next();
  assert.equal(widget.root.children.length, 1, "continuous background still visible");
});

test("flood of queued events is bounded to sixteen waiting alerts", () => {
  const widget = runWidget({
    source: "event", event: "message", cooldownMs: 0, minAmount: 0, queueMode: "queue",
    caption: { enabled: true, template: "{message}", position: "bottom", fontSize: 30, color: "#ffffff" },
  });
  widget.listeners.onWidgetLoad({});
  for (let i = 0; i < 50; i++) {
    widget.listeners.onEventReceived({ detail: { listener: "message", event: { data: { displayName: "Viewer", text: "line-" + i } } } });
  }
  assert.equal(widget.root.children.length, 2);
  let shown = 0;
  while (widget.scheduled.size > 0 && shown < 30) {
    const [id, timer] = widget.scheduled.entries().next().value;
    widget.scheduled.delete(id);
    timer.fn();
    shown++;
  }
  assert.equal(shown, 17, "1 active plus 16 waiting, remaining events dropped");
  assert.equal(widget.root.children.length, 1);
});

test("caption avatar uses initials fallback or allowlisted HTTPS images", () => {
  const caption = {
    enabled: true, template: "Witaj {name}!", position: "bottom", fontSize: 38, color: "#ffffff",
    avatarEnabled: true, avatarSize: 80,
  };
  const widget = runWidget({ source: "event", event: "follower-latest", cooldownMs: 0, minAmount: 0, caption });
  widget.listeners.onWidgetLoad({});
  widget.listeners.onEventReceived({ detail: { listener: "follower-latest", event: { name: "Ala", avatar: "http://evil.test/img.png" } } });
  let label = widget.root.children[1].children.find((n) => n.className === "ae-alert-caption");
  let avatar = label.children.find((n) => n.className === "ae-alert-avatar");
  assert.ok(avatar);
  assert.equal(avatar.textContent, "A");
  assert.equal(avatar.children.length, 0, "HTTP / arbitrary host is rejected");
  assert.equal(label.style.paddingLeft, "94px");
  widget.listeners.onEventReceived({ detail: { listener: "follower-latest", event: { name: "Ben", avatar: "https://static-cdn.jtvnw.net/jtv_user_pictures/id-profile_image-70x70.png" } } });
  label = widget.root.children[1].children.find((n) => n.className === "ae-alert-caption");
  avatar = label.children.find((n) => n.className === "ae-alert-avatar");
  assert.equal(avatar.children[0].tagName, "img");
  assert.equal(avatar.children[0].referrerPolicy, "no-referrer");
  assert.equal(avatar.children[0].alt, "");
});
