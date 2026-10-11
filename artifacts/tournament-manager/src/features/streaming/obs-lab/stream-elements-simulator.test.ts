import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { generateStreamElementsExport } from "../../../../../animated-effects/src/export/streamElements";
import { getEffectDefinition } from "../../../../../animated-effects/src/effects/registry";
import {
  createStreamElementsSimulationHtml,
  getStreamElementsSimulationCases,
  getSimulationEvent,
  setupStreamElementsSimulator,
} from "../../../../../animated-effects/src/editor/streamElementsSimulator";
import { getEditorState, replaceEditorState } from "../../../../../animated-effects/src/editor/state";
import type { EditorState } from "../../../../../animated-effects/src/core/types";

const makeScene = (): EditorState => {
  const scene = structuredClone(getEditorState());
  const effect = getEffectDefinition("rainfall");
  assert.ok(effect);
  scene.effects = [
    {
      instanceId: "rainfx",
      effectId: "rainfall",
      settings: structuredClone(effect.defaultSettings),
      enabled: true,
      seed: 42,
    },
  ];
  scene.selectedEffectInstanceId = "rainfx";
  return scene;
};

test("simulator cases mirror single and multi-route trigger options", () => {
  const single = getStreamElementsSimulationCases({
    mode: "chat-command", chatCommand: "!FIRE",
    activeDurationMs: 500, cooldownMs: 2500,
  });
  assert.equal(single.length, 1);
  assert.equal(single[0]?.listener, "message");
  assert.equal(single[0]?.label, "Czat: !fire");
  assert.deepEqual(getSimulationEvent(single[0]!, "unique-12"), {
    listener: "message",
    event: { data: { text: "!fire", msgId: "unique-12" } },
  });
  assert.equal(getStreamElementsSimulationCases({ mode: "always" })[0]?.listener, "onWidgetLoad");

  const multiple = getStreamElementsSimulationCases(
    { mode: "always" },
    [
      { id: "fx1", mode: "chat-command", chatCommand: "!rain", effectInstanceIds: ["rainfx"] },
      { id: "fx2", mode: "raid", effectInstanceIds: ["rainfx"] },
      { id: "fx3", mode: "subscriber", effectInstanceIds: ["disabled"] },
    ],
    ["rainfx"],
  );
  assert.deepEqual(multiple.map(({ id, listener }) => [id, listener]), [
    ["fx1", "message"], ["fx2", "raid-latest"],
  ]);
  assert.equal(getSimulationEvent(multiple[1]!, "ignored-id").listener, "raid-latest");
  assert.equal(getStreamElementsSimulationCases({ mode: "always" }, [], ["rainfx"]).length, 0);
});

test("simulation document embeds actual exported code without remote scripts or tokens", () => {
  const snippets = generateStreamElementsExport(makeScene(), {
    mode: "chat-command", chatCommand: "!hype", activeDurationMs: 500, cooldownMs: 500,
  });
  const document = createStreamElementsSimulationHtml(snippets);
  assert.ok(document.startsWith("<!doctype html>"));
  assert.ok(document.includes(snippets.javascript));
  assert.ok(document.includes(snippets.css));
  assert.match(document, /onWidgetLoad/);
  assert.match(document, /onEventReceived/);
  assert.match(document, /ae-se-simulator/);
  assert.doesNotMatch(document, /<iframe|<script\s+src=|apiToken|localStorage/i);
  assert.equal((document.match(/<script>/g) ?? []).length, 2);
});

test("simulator forwards commands into the exact exported widget and shows selected effect layer", () => {
  const snippets = generateStreamElementsExport(makeScene(), { mode: "chat-command",
    chatCommand: "!hype", activeDurationMs: 500, cooldownMs: 1000 });
  const html = createStreamElementsSimulationHtml(snippets);
  const match = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(match.length, 2);

  const dom = new JSDOM("<!doctype html><html><body>" + snippets.html + "</body></html>", {
    url: "https://widget-preview.example/", runScripts: "outside-only",
  });
  try {
    const posts: Array<Record<string, unknown>> = [];
    // In JSDOM a top-level window is its own parent. Stub the outbound
    // postMessage function rather than attempting to redefine window.parent.
    Object.defineProperty(dom.window, "postMessage", {
      configurable: true,
      value: (value: Record<string, unknown>) => posts.push(value),
    });
    const pending = new Map<number, () => void>();
    let nextId = 0;
    Object.defineProperty(dom.window, "setTimeout", {
      configurable: true,
      value: (callback: () => void) => { pending.set(++nextId, callback); return nextId; },
    });
    Object.defineProperty(dom.window, "clearTimeout", {
      configurable: true,
      value: (id: number) => pending.delete(id),
    });
    dom.window.eval(match[0]![1]!);
    dom.window.eval(match[1]![1]!);
    assert.ok(posts.some((value) => value.type === "ae-se-simulator-ready"));
    const root = dom.window.document.getElementById("animated-effects-root")!;
    assert.equal(root.children.length, 0, "event-driven widget starts transparent");

    dom.window.dispatchEvent(new dom.window.MessageEvent("message", { data: {
      channel: "ae-se-simulator", action: "event", detail: {
        listener: "message", event: { data: { text: "!hype", msgId: "test-1" } },
      },
    } }));
    assert.equal(root.querySelectorAll(".ae-layer").length, 1, "actual rain effect renderer starts");
    const previous = root.firstElementChild;
    dom.window.dispatchEvent(new dom.window.MessageEvent("message", { data: {
      channel: "ae-se-simulator", action: "event", detail: {
        listener: "message", event: { data: { text: "!hype", msgId: "test-2" } },
      },
    } }));
    assert.equal(root.firstElementChild, previous, "cooldown blocks replay");
    assert.equal(pending.size, 1);

    dom.window.dispatchEvent(new dom.window.MessageEvent("message", { data: {
      channel: "ae-se-simulator", action: "reset",
    } }));
    assert.equal(root.children.length, 0);
    dom.window.dispatchEvent(new dom.window.MessageEvent("message", { data: {
      channel: "ae-se-simulator", action: "event", detail: {
        listener: "message", event: { data: { text: "!hype", msgId: "test-3" } },
      },
    } }));
    assert.equal(root.querySelectorAll(".ae-layer").length, 1, "reset clears cooldown");
  } finally {
    dom.window.close();
  }
});

test("editor mounts simulator inside sandbox without allowing same-origin access", () => {
  const oldScene = structuredClone(getEditorState());
  replaceEditorState(makeScene(), "Simulation test");
  const dialog = document.createElement("dialog");
  dialog.innerHTML = [
    '<div data-simulator-frame></div>',
    '<select data-simulator-event></select>',
    '<button type="button" data-simulator-fire></button>',
    '<button type="button" data-simulator-reset></button>',
    '<p data-simulator-status></p>',
  ].join("");
  document.body.append(dialog);
  try {
    const exported = generateStreamElementsExport(getEditorState(), { mode: "chat-command",
      chatCommand: "!hype", activeDurationMs: 500, cooldownMs: 0 });
    const simulator = setupStreamElementsSimulator(dialog, () => ({
      exported,
      trigger: { mode: "chat-command", chatCommand: "!hype", activeDurationMs: 500, cooldownMs: 0 },
    }));
    simulator.refresh();
    const iframe = dialog.querySelector<HTMLIFrameElement>("iframe")!;
    assert.ok(iframe);
    assert.equal(iframe.getAttribute("sandbox"), "allow-scripts");
    assert.equal(iframe.getAttribute("referrerpolicy"), "no-referrer");
    assert.match(iframe.srcdoc, /ae-se-simulator-ready/);
    assert.equal(dialog.querySelectorAll("option").length, 1);
    simulator.destroy();
    assert.equal(dialog.querySelectorAll("iframe").length, 0);
  } finally {
    dialog.remove();
    replaceEditorState(oldScene, "Simulation test cleanup");
  }
});
