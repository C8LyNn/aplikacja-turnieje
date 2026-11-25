// Animated Effects alerts: ready-made alerts, caption styles and the alert sound behave the same in the editor
// preview and in the exported StreamElements widget.
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import type { AlertCaption } from "../../../../../animated-effects/src/core/types";
import { appendAlertCaption, normalizeAlertCaption } from "../../../../../animated-effects/src/animation/alertText";
import { ALERT_WIDGET_RUNTIME } from "../../../../../animated-effects/src/animation/alertRuntime";
import { AVATAR_WIDGET_RUNTIME } from "../../../../../animated-effects/src/animation/avatarRuntime";
import { normalizeEffectTrigger, safeAlertSoundUrl } from "../../../../../animated-effects/src/animation/triggers";
import { getEffectDefinition } from "../../../../../animated-effects/src/effects/registry";
import { generateStreamElementsExport } from "../../../../../animated-effects/src/export/streamElements";
import { getEditorState, replaceEditorState, undo, updateEffectTrigger } from "../../../../../animated-effects/src/editor/state";
import {
  READY_ALERT_EVENTS,
  READY_ALERT_SET,
  READY_ALERT_STYLES,
  createReadyAlert,
  createReadyAlertSet,
  readyAlertTrigger,
} from "../../../../../animated-effects/src/editor/readyAlerts";

const SOUND_URL = "https://cdn.streamelements.com/uploads/alert.mp3";

function editorCaption(caption: AlertCaption, listener: string, event: unknown, playbackMs: number): string {
  const host = document.createElement("div");
  appendAlertCaption(host, caption, listener, event, playbackMs);
  return host.innerHTML;
}

function widgetCaption(caption: AlertCaption, listener: string, event: unknown, playbackMs: number): string {
  const dom = new JSDOM("<!doctype html><body><div id='host'></div></body>", { runScripts: "outside-only" });
  try {
    dom.window.eval(`${AVATAR_WIDGET_RUNTIME}\n${ALERT_WIDGET_RUNTIME}\nwindow.__attach = aeAttachCaption;`);
    const host = dom.window.document.getElementById("host")!;
    (dom.window as unknown as { __attach: (...args: unknown[]) => void }).__attach(host, caption, listener, event, playbackMs);
    return host.innerHTML;
  } finally {
    dom.window.close();
  }
}

const TIP = { name: "Ala", amount: 50, message: "Powodzenia!" };
const CHAT = { data: { displayName: "<img src=x onerror=alert(1)>", text: "Hej <b>wszystkim</b>" } };

test("captions render to identical HTML in the editor and in the StreamElements widget", () => {
  const cases: Array<[Partial<AlertCaption>, string, unknown]> = [
    [{ template: "{name} · {amount}" }, "tip-latest", TIP],
    [{ template: "{name} wspiera kwotą {amount}!", subtitle: "{message}", background: "pill", font: "impact", effect: "glow", intro: "bounce", outro: "blur" }, "tip-latest", TIP],
    [{ template: "{name} obserwuje kanał!", subtitle: "Dzięki za follow!", letters: "typewriter", background: "box", backgroundColor: "#0c4a6e", backgroundOpacity: 66, font: "mono" }, "follower-latest", TIP],
    [{ template: "Raid od {name}!", letters: "wave", effect: "outline", position: "top" }, "raid-latest", { name: "Bartek", amount: 12 }],
    [{ template: "{name}", subtitle: "{message}", letters: "pop", position: "custom", xPercent: 40, yPercent: 30, avatarEnabled: true, avatarSize: 64 }, "message", CHAT],
    [{ template: "x".repeat(150), letters: "pop" }, "follower-latest", TIP],
  ];
  for (const [patch, listener, event] of cases) {
    const caption = normalizeAlertCaption({ enabled: true, ...patch });
    const fromEditor = editorCaption(caption, listener, event, 7100);
    assert.match(fromEditor, /class="ae-alert-caption"/, "the comparison is not empty");
    assert.equal(widgetCaption(caption, listener, event, 7100), fromEditor, JSON.stringify(patch));
    assert.doesNotMatch(fromEditor, /<img src="x"|<b>/, "viewer text never becomes HTML");
  }
});

test("a caption without the new options keeps its original single-line structure", () => {
  const host = document.createElement("div");
  const label = appendAlertCaption(host, normalizeAlertCaption({ enabled: true, template: "{name} · {amount}" }), "tip-latest", TIP, 4000)!;
  assert.equal(label.children.length, 0);
  assert.equal(label.textContent, "Ala · 50");
  assert.equal(label.style.fontFamily, "");
});

test("letters animate one by one inside unbroken words; long titles stay plain text", () => {
  const host = document.createElement("div");
  const label = appendAlertCaption(host, normalizeAlertCaption({ enabled: true, template: "Raid od {name}!", letters: "typewriter" }), "raid-latest", { name: "Ola" }, 6000)!;
  const words = label.querySelectorAll(".ae-alert-word");
  assert.deepEqual(Array.from(words, (word) => word.textContent), ["Raid", "od", "Ola!"]);
  const letters = Array.from(label.querySelectorAll<HTMLElement>(".ae-alert-letter"));
  assert.equal(letters.length, 10);
  assert.match(letters[0]!.style.animation, /ae-letter-type 1ms linear 0ms/);
  assert.match(letters[9]!.style.animation, /ae-letter-type 1ms linear 540ms/, "60 ms between letters");
  const long = appendAlertCaption(host, normalizeAlertCaption({ enabled: true, template: "y".repeat(140), letters: "wave" }), "follower-latest", TIP, 6000)!;
  assert.equal(long.querySelectorAll(".ae-alert-letter").length, 0);
});

test("every ready-made alert is a valid queued trigger with its event's caption", () => {
  assert.equal(new Set(READY_ALERT_STYLES.map((style) => style.id)).size, READY_ALERT_STYLES.length);
  for (const style of READY_ALERT_STYLES) assert.ok(getEffectDefinition(style.effectId), style.effectId);
  for (const kind of READY_ALERT_EVENTS) {
    for (const style of READY_ALERT_STYLES) {
      const trigger = readyAlertTrigger(kind.event, style.id);
      assert.deepEqual(normalizeEffectTrigger(trigger), trigger, `${kind.event}/${style.id} is already normalized`);
      assert.equal(trigger.event, kind.event);
      assert.equal(trigger.queueMode, "queue");
      assert.equal(trigger.priority, kind.priority);
      assert.equal(trigger.caption?.enabled, true);
      assert.equal(trigger.caption?.template, kind.title);
      assert.equal(trigger.caption?.subtitle, kind.subtitle);
      assert.equal(trigger.sound, undefined);
    }
  }
});

test("one click adds a complete alert layer; a full set adds five; each is one undo step", () => {
  replaceEditorState({ ...getEditorState(), effects: [], selectedEffectInstanceId: null });
  const created = createReadyAlert("tip-latest", "fireworks");
  assert.ok(created);
  const [layer] = getEditorState().effects;
  assert.equal(layer!.effectId, "fireworks");
  assert.equal(layer!.label, "Alert: Donacja · Fajerwerki");
  assert.equal(layer!.timeline?.mode, "once");
  assert.equal(layer!.timeline?.durationMs, 7000);
  assert.equal(layer!.trigger?.event, "tip-latest");
  assert.equal(getEditorState().selectedEffectInstanceId, layer!.instanceId);
  undo();
  assert.equal(getEditorState().effects.length, 0);
  const set = createReadyAlertSet("neon");
  assert.deepEqual(set.map((effect) => effect.trigger?.event), [...READY_ALERT_SET]);
  assert.equal(getEditorState().effects.length, 5);
  undo();
  assert.equal(getEditorState().effects.length, 0);
});

test("alert sound: only https files without credentials, bounded volume, kept by the trigger", () => {
  assert.equal(safeAlertSoundUrl(SOUND_URL), SOUND_URL);
  for (const bad of ["http://cdn.example/a.mp3", "https://user:pw@cdn.example/a.mp3", "javascript:alert(1)", "data:audio/mp3;base64,AAAA", `https://a.example/${"x".repeat(600)}.mp3`, 42]) {
    assert.equal(safeAlertSoundUrl(bad), null, String(bad));
  }
  const base = { source: "event", event: "tip-latest" } as const;
  assert.equal(normalizeEffectTrigger({ ...base, sound: { url: "http://cdn.example/a.mp3", volume: 50 } })?.sound, undefined);
  assert.deepEqual(normalizeEffectTrigger({ ...base, sound: { url: SOUND_URL, volume: 500 } })?.sound, { url: SOUND_URL, volume: 100 });
  assert.equal("sound" in normalizeEffectTrigger(base)!, false, "triggers without sound keep their old shape");
});

test("exported widget: a queued donation alert shows both lines and plays its sound, then the follow alert", () => {
  replaceEditorState({ ...getEditorState(), effects: [], selectedEffectInstanceId: null });
  createReadyAlertSet("confetti");
  const tip = getEditorState().effects.find((effect) => effect.trigger?.event === "tip-latest")!;
  updateEffectTrigger(tip.instanceId, { ...tip.trigger!, sound: { url: SOUND_URL, volume: 55 } });
  const snippets = generateStreamElementsExport(getEditorState());
  assert.match(snippets.javascript, /aePlaySound/);
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, {
    runScripts: "outside-only",
    url: "https://widgets.streamelements.test/",
  });
  try {
    const played: Array<{ url: string; volume: number }> = [];
    Object.defineProperty(dom.window, "Audio", {
      configurable: true,
      value: class {
        volume = 1;
        constructor(readonly url: string) {}
        play() { played.push({ url: this.url, volume: this.volume }); return Promise.resolve(); }
      },
    });
    const pending: Array<() => void> = [];
    Object.defineProperty(dom.window, "setTimeout", { configurable: true, value: (callback: () => void) => pending.push(callback) });
    Object.defineProperty(dom.window, "clearTimeout", { configurable: true, value: () => undefined });
    dom.window.eval(snippets.javascript);
    dom.window.dispatchEvent(new dom.window.CustomEvent("onWidgetLoad"));
    const send = (listener: string, event: Record<string, unknown>) =>
      dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: { listener, event } }));
    const captions = () => Array.from(dom.window.document.querySelectorAll(".ae-alert-caption"), (node) => ({
      title: node.querySelector(".ae-alert-caption-title")?.textContent,
      subtitle: node.querySelector(".ae-alert-caption-subtitle")?.textContent,
    }));

    send("tip-latest", TIP);
    send("follower-latest", { name: "Ola" });
    assert.deepEqual(captions(), [{ title: "Ala wspiera kwotą 50!", subtitle: "Powodzenia!" }], "one alert at a time");
    assert.deepEqual(played, [{ url: SOUND_URL, volume: 0.55 }]);

    pending.splice(0).forEach((callback) => callback());
    assert.deepEqual(captions(), [{ title: "Ola obserwuje kanał!", subtitle: "Dzięki za follow!" }]);
    assert.equal(played.length, 1, "the follow alert has no sound");
  } finally {
    dom.window.close();
  }
});
