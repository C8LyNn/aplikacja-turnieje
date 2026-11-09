import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { generateStreamElementsExport } from "../../../../../animated-effects/src/export/streamElements";
import { setupExportPanel, openExportPanel } from "../../../../../animated-effects/src/editor/exportPanel";
import { getEditorState, replaceEditorState } from "../../../../../animated-effects/src/editor/state";
import {
  normalizeStreamElementsTriggerOptions,
  DEFAULT_STREAM_ELEMENTS_TRIGGER_OPTIONS,
  type StreamElementsTriggerMode,
  type StreamElementsRouteInput,
  normalizeStreamElementsRoutes,
} from "../../../../../animated-effects/src/export/triggerOptions";

const emptyScene = { effects: [] } as unknown as Parameters<typeof generateStreamElementsExport>[0];

function makeWidget(
  mode: StreamElementsTriggerMode,
  options: Record<string, unknown> = {},
  routes?: StreamElementsRouteInput[],
  scene = emptyScene,
) {
  const snippets = generateStreamElementsExport(scene, {
    mode,
    chatCommand: "!hype",
    activeDurationMs: 500,
    cooldownMs: 1000,
    ...options,
  }, routes);
  const dom = new JSDOM(
    "<!doctype html><html><body>" + snippets.html + "</body></html>",
    { runScripts: "outside-only", url: "https://widgets.streamelements.test/" },
  );
  const root = dom.window.document.getElementById("animated-effects-root")!;
  const replace = root.replaceChildren.bind(root);
  let resets = 0;
  root.replaceChildren = (...nodes: (Node | string)[]) => {
    resets++;
    return replace(...nodes);
  };
  let now = 10000;
  const pending = new Map<number, () => void>();
  let nextTimer = 0;
  Object.defineProperty(dom.window.Date, "now", { value: () => now });
  Object.defineProperty(dom.window, "setTimeout", {
    configurable: true,
    value: (callback: () => void) => {
      pending.set(++nextTimer, callback);
      return nextTimer;
    },
  });
  Object.defineProperty(dom.window, "clearTimeout", {
    configurable: true,
    value: (id: number) => pending.delete(id),
  });
  const scripted = routes ? snippets.javascript.replace(
    "const aeRenderers = {",
    'const aeRenderers = { "test-effect": function (effect, root) { const div = document.createElement("div"); div.dataset.instanceId = effect.instanceId; root.appendChild(div); },',
  ) : snippets.javascript;
  dom.window.eval(scripted);
  const send = (listener: string, event: Record<string, unknown> = {}) =>
    dom.window.dispatchEvent(
      new dom.window.CustomEvent("onEventReceived", { detail: { listener, event } }),
    );
  const load = () => dom.window.dispatchEvent(new dom.window.CustomEvent("onWidgetLoad"));
  return {
    snippets,
    dom,
    root,
    send,
    load,
    resets: () => resets,
    tick: (ms: number) => { now += ms; },
    finish: () => {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach(callback => callback());
    },
    pending: () => pending.size,
  };
}

test("trigger settings are bounded, case-normalized, safe and backwards compatible", () => {
  assert.deepEqual(normalizeStreamElementsTriggerOptions(), DEFAULT_STREAM_ELEMENTS_TRIGGER_OPTIONS);
  assert.deepEqual(normalizeStreamElementsTriggerOptions({
    mode: "chat-command",
    chatCommand: " !HELLO_world ",
    activeDurationMs: -900,
    cooldownMs: Infinity,
  }), {
    mode: "chat-command",
    chatCommand: "!hello_world",
    activeDurationMs: 500,
    cooldownMs: 10000,
  });
  assert.equal(normalizeStreamElementsTriggerOptions({
    chatCommand: "!<script>",
  }).chatCommand, "!hype");
  assert.equal(normalizeStreamElementsTriggerOptions({
    activeDurationMs: 999999, cooldownMs: -1,
  }).activeDurationMs, 60000);
  assert.equal(normalizeStreamElementsTriggerOptions({
    cooldownMs: -1,
  }).cooldownMs, 0);
});

test("always-on export starts on widget load and ignores live events", () => {
  const widget = makeWidget("always");
  try {
    assert.equal(widget.resets(), 0);
    widget.send("message", { data: { text: "!hype", msgId: "1" } });
    assert.equal(widget.resets(), 0);
    widget.load();
    assert.equal(widget.resets(), 1);
    assert.equal(widget.pending(), 0);
    widget.send("follower-latest", { name: "Someone" });
    assert.equal(widget.resets(), 1);
  } finally {
    widget.dom.window.close();
  }
});

test("chat command matches full token, handles nested payload, cooldown and duplicate msgId", () => {
  const widget = makeWidget("chat-command");
  try {
    widget.send("message", { data: { text: "!hype", msgId: "before-load" } });
    assert.equal(widget.resets(), 0);
    widget.load();
    assert.equal(widget.resets(), 1, "triggered widget starts empty");
    widget.send("message", { data: { text: "!hypeMORE", msgId: "wrong" } });
    widget.send("message", { data: { text: "other !hype", msgId: "wrong2" } });
    assert.equal(widget.resets(), 1);
    widget.send("message", { data: { text: "  !HYPE with arguments  ", msgId: "one" } });
    assert.equal(widget.resets(), 2, "first matching command triggers a scene");
    assert.equal(widget.pending(), 1, "active duration schedules cleanup");
    widget.tick(100);
    widget.send("message", { data: { text: "!hype", msgId: "two" } });
    assert.equal(widget.resets(), 2, "cooldown blocks rapid reactivation");
    widget.tick(1001);
    widget.send("message", { data: { text: "!hype", msgId: "one" } });
    assert.equal(widget.resets(), 2, "repeated message id cannot activate twice");
    widget.send("message", { data: { text: "!hype", msgId: "three" } });
    assert.equal(widget.resets(), 3, "new message after cooldown restarts effects");
    assert.equal(widget.pending(), 1, "previous hide timer is cancelled");
    widget.finish();
    assert.equal(widget.resets(), 4, "scene is removed when the duration expires");
    assert.equal(widget.pending(), 0);
  } finally {
    widget.dom.window.close();
  }
});

for (const [mode, listener] of [
  ["follower", "follower-latest"],
  ["subscriber", "subscriber-latest"],
  ["tip", "tip-latest"],
  ["cheer", "cheer-latest"],
  ["raid", "raid-latest"],
] as const) {
  test(mode + " only activates from its StreamElements event", () => {
    const widget = makeWidget(mode, { cooldownMs: 0 });
    try {
      widget.load();
      widget.send("message", { data: { text: "!hype" } });
      assert.equal(widget.resets(), 1);
      widget.send("follower-latest", { name: "ignored" });
      assert.equal(widget.resets(), mode === "follower" ? 2 : 1);
      widget.send(listener, { name: "viewer" });
      assert.equal(widget.resets(), mode === "follower" ? 3 : 2);
    } finally {
      widget.dom.window.close();
    }
  });
}

test("export dialog updates the generated widget when trigger controls change", () => {
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `
    <select data-trigger-mode><option value="always">Always</option><option value="chat-command">Chat</option></select>
    <label data-trigger-command-field hidden><input data-trigger-command value="!hype" /></label>
    <label data-trigger-timing hidden><input data-trigger-duration value="5" /></label>
    <label data-trigger-timing hidden><input data-trigger-cooldown value="10" /></label>
    <p data-trigger-info></p>
    <span data-export-metrics></span>
    <textarea data-export="html"></textarea>
    <textarea data-export="css"></textarea>
    <textarea data-export="javascript"></textarea>
  `;
  Object.defineProperty(dialog, "showModal", { value: () => { dialog.open = true; } });
  document.body.append(dialog);
  try {
    setupExportPanel(dialog);
    const mode = dialog.querySelector<HTMLSelectElement>("[data-trigger-mode]")!;
    const command = dialog.querySelector<HTMLInputElement>("[data-trigger-command]")!;
    const duration = dialog.querySelector<HTMLInputElement>("[data-trigger-duration]")!;
    const cooldown = dialog.querySelector<HTMLInputElement>("[data-trigger-cooldown]")!;
    assert.equal(dialog.querySelector<HTMLElement>("[data-trigger-command-field]")!.hidden, true);
    mode.value = "chat-command";
    mode.dispatchEvent(new window.Event("change", { bubbles: true }));
    assert.equal(dialog.querySelector<HTMLElement>("[data-trigger-command-field]")!.hidden, false);
    assert.equal(dialog.querySelectorAll<HTMLElement>("[data-trigger-timing][hidden]").length, 0);
    command.value = "!FIRE";
    duration.value = "2.5";
    cooldown.value = "3";
    openExportPanel(dialog);
    const javascript = dialog.querySelector<HTMLTextAreaElement>('[data-export="javascript"]')!.value;
    assert.match(javascript, /"mode":"chat-command"/);
    assert.match(javascript, /"chatCommand":"!fire"/);
    assert.match(javascript, /"activeDurationMs":2500/);
    assert.match(javascript, /"cooldownMs":3000/);
    assert.equal(command.value, "!fire");
    assert.ok(dialog.querySelector<HTMLElement>("[data-trigger-info]")!.textContent?.includes("!fire"));
  } finally {
    dialog.remove();
  }
});



test("multi-route export form maps each enabled effect to a selected rule", () => {
  const original = structuredClone(getEditorState());
  replaceEditorState({
    ...original,
    effects: [
      { instanceId: "flame", effectId: "test-effect", enabled: true, seed: 1, settings: {} },
      { instanceId: "explosion", effectId: "test-effect", enabled: true, seed: 2, settings: {} },
    ],
  } as typeof original);
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `
    <div data-single-trigger><select data-trigger-mode><option value="always">always</option></select></div>
    <label><input type="checkbox" data-multi-routes></label>
    <section data-route-workspace hidden>
      <div data-route-list></div>
      <button type="button" data-add-route>Dodaj</button>
      <p data-route-warning></p>
    </section>
    <span data-export-metrics></span>
    <textarea data-export="html"></textarea>
    <textarea data-export="css"></textarea>
    <textarea data-export="javascript"></textarea>
  `;
  Object.defineProperty(dialog, "showModal", { value: () => {} });
  document.body.append(dialog);
  try {
    setupExportPanel(dialog);
    const toggle = dialog.querySelector<HTMLInputElement>("[data-multi-routes]")!;
    toggle.checked = true;
    toggle.dispatchEvent(new window.Event("change", { bubbles: true }));
    const list = dialog.querySelector("[data-route-list]")!;
    assert.equal(list.children.length, 1);
    assert.equal(dialog.querySelector<HTMLElement>("[data-single-trigger]")!.hidden, true);
    assert.equal(dialog.querySelector<HTMLElement>("[data-route-workspace]")!.hidden, false);
    assert.equal(list.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked").length, 1);

    dialog.querySelector<HTMLButtonElement>("[data-add-route]")!.click();
    assert.equal(list.children.length, 2);
    const second = list.lastElementChild!;
    const mode = second.querySelector<HTMLSelectElement>("[data-route-mode]")!;
    mode.value = "raid";
    mode.dispatchEvent(new window.Event("change", { bubbles: true }));
    assert.equal(second.querySelector<HTMLElement>("[data-route-command-field]")!.hidden, true);

    const boxes = second.querySelectorAll<HTMLInputElement>("[data-route-effects] input");
    assert.equal(boxes.length, 2);
    boxes[0]!.checked = false;
    boxes[1]!.checked = true;
    boxes[1]!.dispatchEvent(new window.Event("change", { bubbles: true }));

    const js = dialog.querySelector<HTMLTextAreaElement>('[data-export="javascript"]')!.value;
    assert.match(js, /const aeMultiMode = true/);
    assert.match(js, /"chatCommand":"!hype"/);
    assert.match(js, /"mode":"raid"/);
    assert.match(js, /"effectInstanceIds":\["explosion"\]/);
    assert.match(js, /"effectInstanceIds":\["flame"\]/);

    second.querySelector<HTMLButtonElement>("[data-remove-route]")!.click();
    assert.equal(list.children.length, 1);
    toggle.checked = false;
    toggle.dispatchEvent(new window.Event("change", { bubbles: true }));
    assert.equal(dialog.querySelector<HTMLElement>("[data-single-trigger]")!.hidden, false);
    assert.match(dialog.querySelector<HTMLTextAreaElement>('[data-export="javascript"]')!.value, /const aeMultiMode = false/);
  } finally {
    dialog.remove();
    replaceEditorState(original);
  }
});

test("route normalization rejects malformed IDs, disabled layers, repeats and >8 routes", () => {
  const input: StreamElementsRouteInput[] = [
    { id: "one", mode: "chat-command", chatCommand: "!fire", effectInstanceIds: ["a", "a", "b", "inactive"] },
    { id: "one", mode: "raid", effectInstanceIds: ["a"] },
    { id: "always-rule", mode: "always", effectInstanceIds: ["b"] },
    { id: "<bad>", mode: "follower", effectInstanceIds: ["a"] },
    { id: "empty", mode: "raid", effectInstanceIds: ["inactive"] },
    ...Array.from({ length: 10 }, (_, i) => ({
      id: "extra-" + i, mode: "follower" as const, effectInstanceIds: ["a"],
    })),
  ];
  const routes = normalizeStreamElementsRoutes(input, ["a", "b"]);
  assert.equal(routes.length, 4);
  assert.deepEqual(routes[0]?.effectInstanceIds, ["a", "b"]);
  assert.equal(routes[0]?.chatCommand, "!fire");
  assert.equal(routes[1]?.id, "extra-0");
  assert.equal(routes[3]?.id, "extra-2");
});

test("one StreamElements widget routes independent commands and raids to distinct effect layers", () => {
  const scene = {
    effects: [
      { effectId: "test-effect", instanceId: "fire", enabled: true, settings: {}, seed: 1 },
      { effectId: "test-effect", instanceId: "raid", enabled: true, settings: {}, seed: 2 },
      { effectId: "test-effect", instanceId: "off", enabled: false, settings: {}, seed: 3 },
    ],
  } as unknown as Parameters<typeof generateStreamElementsExport>[0];
  const rules: StreamElementsRouteInput[] = [
    { id: "rule-fire", mode: "chat-command", chatCommand: "!fire", effectInstanceIds: ["fire", "off"], cooldownMs: 1000, activeDurationMs: 2000 },
    { id: "rule-raid", mode: "raid", effectInstanceIds: ["raid"], cooldownMs: 0, activeDurationMs: 500 },
    { id: "rule-ice", mode: "chat-command", chatCommand: "!ice", effectInstanceIds: ["fire"], cooldownMs: 0, activeDurationMs: 500 },
  ];
  const widget = makeWidget("always", {}, rules, scene);
  const active = () => Array.from(widget.root.querySelectorAll<HTMLElement>("[data-instance-id]"), (node) => node.dataset.instanceId);
  try {
    widget.load();
    assert.deepEqual(active(), [], "multi mode never auto-starts even with legacy always");
    widget.send("message", { data: { text: "!fire", msgId: "a" } });
    assert.deepEqual(active(), ["fire"], "disabled effect excluded");
    widget.send("raid-latest", { name: "someone" });
    assert.deepEqual(active(), ["raid"], "raid replaces fire");
    widget.tick(100);
    widget.send("message", { data: { text: "!fire", msgId: "b" } });
    assert.deepEqual(active(), ["raid"], "only fire cooldown is active");
    widget.send("message", { data: { text: "!ice", msgId: "c" } });
    assert.deepEqual(active(), ["fire"], "another command is independently eligible");
    widget.send("message", { data: { text: "!ice", msgId: "c" } });
    assert.deepEqual(active(), ["fire"], "duplicate message does not replay");
    assert.equal(widget.pending(), 1, "replacing a scene cancels the old expiry timer");
    widget.finish();
    assert.deepEqual(active(), []);
  } finally {
    widget.dom.window.close();
  }
});

test("duplicate multi-route triggers use deterministic priority, empty list stays idle", () => {
  const scene = { effects: [
    { effectId: "test-effect", instanceId: "first", enabled: true, settings: {}, seed: 1 },
    { effectId: "test-effect", instanceId: "second", enabled: true, settings: {}, seed: 2 },
  ] } as unknown as Parameters<typeof generateStreamElementsExport>[0];
  const rules: StreamElementsRouteInput[] = [
    { id: "one", mode: "chat-command", chatCommand: "!same", cooldownMs: 0, effectInstanceIds: ["first"] },
    { id: "two", mode: "chat-command", chatCommand: "!same", cooldownMs: 0, effectInstanceIds: ["second"] },
  ];
  const w = makeWidget("always", {}, rules, scene);
  try {
    w.load();
    w.send("message", { data: { text: "!same", msgId: "1" } });
    assert.equal(w.root.querySelector("[data-instance-id]")?.getAttribute("data-instance-id"), "first");
  } finally { w.dom.window.close(); }
  const empty = makeWidget("always", {}, [], scene);
  try {
    empty.load();
    empty.send("message", { data: { text: "!same", msgId: "2" } });
    assert.equal(empty.root.childElementCount, 0);
    assert.equal(empty.pending(), 0);
  } finally { empty.dom.window.close(); }
});

test("event exports do not require an iframe or call back into the editor website", () => {
  const output = generateStreamElementsExport(emptyScene, { mode: "chat-command", chatCommand: "!hype" });
  assert.match(output.javascript, /onEventReceived/);
  assert.match(output.javascript, /onWidgetLoad/);
  assert.match(output.javascript, /"chatCommand":"!hype"/);
  assert.doesNotMatch(
    output.html + output.css + output.javascript,
    /<iframe|postMessage|apiToken|localStorage|https?:\/\//i,
  );
});
