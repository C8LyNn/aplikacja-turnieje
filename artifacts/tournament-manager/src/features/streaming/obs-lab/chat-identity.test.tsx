// Theme identity: ornaments (nick mark, corner emblem, divider), message cards and nick tags reach the preview, the OBS
// page and the native StreamElements widget alike; the pirate look reads as an old treasure map.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { t } from "@/i18n";
import CameraChatOverlay from "./CameraChatOverlay";
import { generateStreamElementsWidget } from "./stream-elements-widget";
import { chatEventLabels } from "./chat-event-labels";
import {
  type CameraChatConfig,
  CHAT_BUBBLE_SHAPES,
  CHAT_NAME_TAGS,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigToSearch,
} from "./camera-chat-settings";
import { CHAT_ORNAMENTS, chatOrnamentGlyph } from "./chat-ornaments";
import { getChatDecorCss } from "./chat-decor";
import { chatPresetConfig, CHAT_PRESET_IDS } from "./chat-presets";
import { chatTextBackdrop, checkChatSetup } from "./chat-setup-check";
import { chatPanelTone } from "./chat-look-distance";

afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

type Incoming = { listener: string; data: Record<string, unknown> };
const say = (id: string, name: string, text: string, color = "#1E90FF"): Incoming => ({
  listener: "message",
  data: { displayName: name, nick: name.toLowerCase(), text, msgId: id, userId: `u-${id}`, displayColor: color },
});

function nativeWidget(config: CameraChatConfig) {
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"), chatEventLabels());
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  dom.window.eval(snippets.js);
  const send = ({ listener, data }: Incoming) => dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: { listener, event: { data } } }));
  return { dom, send, document: dom.window.document, snippets };
}

function obsPage(config: CameraChatConfig) {
  window.history.replaceState({}, "", `/stream/overlay/camera-chat?source=streamelements&${cameraChatConfigToSearch(config)}`);
  const view = render(<CameraChatOverlay />);
  const send = ({ data }: Incoming) => window.dispatchEvent(new window.MessageEvent("message", {
    source: window.parent, data: { source: "camera-chat-se", type: "message", payload: { data } },
  }));
  return { send, document: view.container };
}

function shape(root: ParentNode) {
  return {
    emblem: root.querySelector(".chat-emblem")?.textContent ?? "",
    divider: root.querySelector(".chat-divider")?.textContent ?? "",
    rows: Array.from(root.querySelectorAll<HTMLElement>(".chat-name")).map((name) => ({
      mark: name.previousElementSibling?.classList.contains("chat-mark") ? name.previousElementSibling.textContent : "",
      name: name.textContent,
      nameColor: name.style.getPropertyValue("--chat-name"),
      tagColor: name.style.getPropertyValue("--chat-name-bg"),
    })),
    highlighted: Array.from(root.querySelectorAll<HTMLElement>("[data-highlight='1']")).length,
  };
}

test("ornaments, cards and nick tags are written into the address and validated", () => {
  const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, ornament: "anchor", ornamentColor: "#123456", nameTag: "pill", bubbleShape: "comic" };
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config);
  const bad = cameraChatConfigFromSearch("ornament=%3Cimg%3E&ornac=red&nametag=blink&shape=hexagon");
  assert.deepEqual([bad.ornament, bad.ornamentColor, bad.nameTag, bad.bubbleShape], ["none", "#facc15", "plain", "rounded"]);
  assert.deepEqual([DEFAULT_CAMERA_CHAT_CONFIG.ornament, DEFAULT_CAMERA_CHAT_CONFIG.nameTag], ["none", "plain"], "old addresses get no ornament");
  for (const ornament of CHAT_ORNAMENTS.filter((item) => item !== "none")) {
    const glyph = chatOrnamentGlyph(ornament);
    assert.ok(glyph.length >= 1 && glyph.length <= 2, ornament);
    assert.doesNotMatch(glyph, /[<>&"']/, ornament);
  }
});

test("theme ornaments and nick tags draw the same in the OBS page and the native widget", () => {
  for (const nameTag of CHAT_NAME_TAGS) {
    const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, ornament: "skull", ornamentColor: "#3b2412", nameTag, highlightWords: "ahoy" };
    const native = nativeWidget(config);
    const page = obsPage(config);
    try {
      const stream = [say("p1", "Ola", "ahoy there", "#0000FF"), say("p2", "Kuba", "yo ho", "#2E8B57")];
      act(() => { for (const item of stream) page.send(item); });
      for (const item of stream) native.send(item);
      assert.deepEqual(shape(native.document), shape(page.document), nameTag);
      const result = shape(page.document);
      assert.equal(result.emblem, chatOrnamentGlyph("skull"));
      assert.equal(result.divider, chatOrnamentGlyph("skull"));
      assert.ok(result.rows.every((row) => row.mark === chatOrnamentGlyph("skull")), "a skull before every nick");
      assert.equal(result.highlighted, 1, "the highlighted message is marked in both renderers");
      assert.equal(result.rows[0]!.tagColor !== "", nameTag === "pill", `${nameTag}: a readable tag colour only for the tag`);
    } finally {
      native.dom.window.close();
    }
  }
});

test("message cards keep event rows out and survive the row's own colours", () => {
  for (const bubbleShape of ["comic", "sticky", "glass", "pixel"] as const) {
    const css = getChatDecorCss({ ...DEFAULT_CAMERA_CHAT_CONFIG, bubbleShape, frameColor: "#22c55e" }, ".panel", ".row");
    assert.match(css, /\.row:not\(\.chat-event\) \{[^}]*!important/, `${bubbleShape} overrides the inline row colours`);
    assert.match(css, /\.row:not\(\.chat-event\)\[data-highlight="1"\] \{ outline:/, `${bubbleShape} still shows a highlighted word`);
  }
  assert.match(getChatDecorCss({ ...DEFAULT_CAMERA_CHAT_CONFIG, bubbleShape: "pixel", frameColor: "#22c55e" }, ".p", ".r"), /0 -3px 0 0 #22c55e/);
  assert.deepEqual(chatTextBackdrop({ ...DEFAULT_CAMERA_CHAT_CONFIG, bubbleShape: "comic", bubbleColor: "#ffffff" }), ["#ffffff"]);
  const unreadable = checkChatSetup({ ...DEFAULT_CAMERA_CHAT_CONFIG, bubbleShape: "sticky", bubbleColor: "#fef08a", ignoredUsers: "x" }, "Live");
  assert.deepEqual(unreadable.map((issue) => issue.id), ["contrast"], "white text on a yellow note is caught");
  assert.ok(CHAT_BUBBLE_SHAPES.includes("comic") && CHAT_BUBBLE_SHAPES.includes("pixel"));
});

test("every look has a theme identity, and the pirate is an old treasure map", () => {
  const plain = ["minimal", "classic", "light", "clear", "rainbow", "glass", "compact", "terminal", "amberterm", "chrome"];
  for (const id of CHAT_PRESET_IDS) {
    const config = chatPresetConfig(id);
    const themed = config.ornament !== "none" || config.nameTag !== "plain" || ["comic", "sticky", "glass", "pixel"].includes(config.bubbleShape)
      || config.panelPattern !== "none" || config.ambient !== "none";
    assert.ok(themed || plain.includes(id), `${id} has something that says what it is`);
  }
  const pirate = chatPresetConfig("pirate");
  assert.equal(chatPanelTone(pirate.panelColor), "light", "parchment, not a dark sea");
  assert.deepEqual([pirate.ornament, pirate.fontFamily, pirate.panelPattern, pirate.frameStyle], ["skull", "segoeprint", "vignette", "dashes"]);
  assert.deepEqual(checkChatSetup({ ...pirate, ignoredUsers: "x" }, "Live"), [], "brown ink on parchment is readable");
});
