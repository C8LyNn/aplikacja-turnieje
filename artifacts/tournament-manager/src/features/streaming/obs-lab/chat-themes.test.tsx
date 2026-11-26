// Themes and look gadgets: 72 looks in seven groups, all readable; new colour sets, particles, entry motions, nick
// styles and panel patterns reach both renderers; message combos count the same in the OBS page and the native
// StreamElements widget; the pickers filter looks by group.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { t } from "@/i18n";
import CameraChatOverlay from "./CameraChatOverlay";
import { ObsLab } from "./ObsLab";
import { generateStreamElementsWidget } from "./stream-elements-widget";
import { chatEventLabels } from "./chat-event-labels";
import {
  type CameraChatConfig,
  CHAT_AMBIENTS,
  CHAT_MOTION_PRESETS,
  CHAT_MOTION_STYLES,
  CHAT_NAME_STYLES,
  CHAT_PANEL_PATTERNS,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigToSearch,
  getCameraChatAnimationCss,
} from "./camera-chat-settings";
import { chatAmbientParticles, chatPatternBackground, getChatDecorCss } from "./chat-decor";
import {
  CHAT_COLOR_THEME_IDS,
  CHAT_PRESET_CATEGORIES,
  CHAT_PRESET_CATEGORY_IDS,
  CHAT_PRESET_IDS,
  applyChatColorTheme,
  chatPresetConfig,
  chatPresetsIn,
} from "./chat-presets";
import { checkChatSetup } from "./chat-setup-check";
import { chatLookDistance, chatLookTraits, chatPanelTone } from "./chat-look-distance";
import { buildChatRows, chatComboKey } from "./chat-message-format";

afterEach(() => { cleanup(); localStorage.clear(); window.history.replaceState({}, "", "/"); });

type Incoming = { listener: string; data: Record<string, unknown> };

const say = (id: string, text: string, user = id): Incoming => ({
  listener: "message",
  data: { displayName: `viewer_${user}`, nick: `viewer_${user}`, text, msgId: id, userId: `u_${user}` },
});

function nativeWidget(config: CameraChatConfig) {
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"), chatEventLabels());
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  dom.window.eval(snippets.js);
  const send = ({ listener, data }: Incoming) => dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", {
    detail: { listener, event: listener === "message" || listener.startsWith("delete-") ? { data } : data },
  }));
  return { dom, send, document: dom.window.document, snippets };
}

function obsPage(config: CameraChatConfig) {
  window.history.replaceState({}, "", `/stream/overlay/camera-chat?source=streamelements&${cameraChatConfigToSearch(config)}`);
  const view = render(<CameraChatOverlay />);
  const send = ({ listener, data }: Incoming) => window.dispatchEvent(new window.MessageEvent("message", {
    source: window.parent,
    data: listener === "message" || listener.startsWith("delete-")
      ? { source: "camera-chat-se", type: listener, payload: { data } }
      : { source: "camera-chat-se", type: "event", payload: { listener, event: data } },
  }));
  return { view, send, document: view.container };
}

function rowsOf(root: ParentNode, rowClass: string, textClass: string) {
  return Array.from(root.querySelectorAll<HTMLElement>(rowClass)).map((row) => ({
    text: row.dataset["event"] ? `event:${row.dataset["event"]}` : row.querySelector(textClass)?.textContent ?? "",
    combo: row.querySelector(".chat-combo")?.textContent ?? "",
    hot: row.querySelector<HTMLElement>(".chat-combo")?.dataset["hot"] ?? "",
  }));
}

test("72 looks in seven groups, each a valid address and readable by the settings check", () => {
  assert.equal(CHAT_PRESET_IDS.length, 72);
  const grouped = CHAT_PRESET_CATEGORY_IDS.flatMap((category) => [...CHAT_PRESET_CATEGORIES[category]]);
  assert.deepEqual([...grouped].sort(), [...CHAT_PRESET_IDS].sort(), "every look is in exactly one group");
  assert.equal(chatPresetsIn("all").length, 72);
  const unreadable: string[] = [];
  for (const preset of CHAT_PRESET_IDS) {
    const config = { ...chatPresetConfig(preset), ignoredUsers: "bot" };
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config, preset);
    for (const issue of checkChatSetup(config, "Live")) if (issue.level === "warn") unreadable.push(`${preset}: ${issue.id}`);
  }
  assert.deepEqual(unreadable, [], "every look passes the settings check");
  assert.equal(CHAT_COLOR_THEME_IDS.length, 16);
  const placed = { ...DEFAULT_CAMERA_CHAT_CONFIG, layout: "chat" as const, fontFamily: "georgia" as const };
  for (const theme of CHAT_COLOR_THEME_IDS) {
    const coloured = applyChatColorTheme(placed, theme);
    assert.deepEqual([coloured.layout, coloured.fontFamily], ["chat", "georgia"], theme);
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(coloured)), coloured, theme);
  }
});

test("new options reach the address and old addresses keep their look", () => {
  const config: CameraChatConfig = {
    ...DEFAULT_CAMERA_CHAT_CONFIG, nameStyle: "rainbow", panelPattern: "waves", patternColor: "#22d3ee", patternOpacity: 24,
    comboMessages: true, ambient: "fireflies", animationStyle: "glitch",
  };
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config);
  const old = cameraChatConfigFromSearch("layout=chat&animstyle=wipe");
  assert.deepEqual([old.nameStyle, old.panelPattern, old.comboMessages, old.animationStyle], ["plain", "none", false, "wipe"]);
  const bad = cameraChatConfigFromSearch("namestyle=blink&pattern=url(x)&patternc=red&patterno=99&animstyle=explode");
  assert.deepEqual([bad.nameStyle, bad.panelPattern, bad.patternColor, bad.patternOpacity, bad.animationStyle], ["plain", "none", "#ffffff", 50, "rise"]);
});

test("every particle animation and entry motion has its keyframes; random keeps its old pool", () => {
  for (const ambient of CHAT_AMBIENTS.filter((kind) => kind !== "none")) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, ambient };
    const css = getChatDecorCss(config, ".panel", ".row");
    const names = new Set(chatAmbientParticles(config).map((particle) => particle.style.animation.split(" ")[0]!));
    for (const name of names) assert.match(css, new RegExp(`@keyframes ${name} \\{`), `${ambient}: ${name}`);
  }
  assert.deepEqual([...CHAT_MOTION_PRESETS], ["rise", "slide", "pop", "fade", "bounce", "flip", "wipe"]);
  for (const motion of CHAT_MOTION_STYLES) {
    assert.match(getCameraChatAnimationCss(motion, "in"), /^@keyframes in \{ .*opacity: 1/, motion);
    assert.equal(cameraChatConfigFromSearch(`animstyle=${motion}`).animationStyle, motion);
  }
  const random = getCameraChatAnimationCss("random", "in");
  assert.doesNotMatch(random, /in-glitch|in-drop/, "random overlays keep the motions they had");
});

test("nick styles and panel patterns draw the same in the OBS page and the native widget", () => {
  for (const nameStyle of CHAT_NAME_STYLES) {
    const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, nameStyle, panelPattern: "dots", patternColor: "#ff00aa" };
    const native = nativeWidget(config);
    const page = obsPage(config);
    try {
      const incoming = { ...say("n1", "hello"), data: { ...say("n1", "hello").data, displayColor: "#1E90FF" } };
      act(() => { page.send(incoming); });
      native.send(incoming);
      const nameOf = (root: ParentNode) => {
        const name = root.querySelector<HTMLElement>(".chat-name");
        return [name?.textContent, name?.style.getPropertyValue("--chat-name") ?? ""];
      };
      assert.deepEqual(nameOf(native.document), nameOf(page.document), nameStyle);
      assert.equal(nameOf(page.document)[1] !== "", nameStyle !== "plain", `${nameStyle}: colour variable only for a style`);
      assert.equal(native.document.querySelectorAll(".chat-pattern").length, 1);
      assert.equal(page.document.querySelectorAll(".chat-pattern").length, 1);
      if (nameStyle !== "plain") assert.match(native.snippets.css, /\.chat-name \{/);
      if (nameStyle === "rainbow" || nameStyle === "shimmer") assert.match(native.snippets.css, /prefers-reduced-motion: reduce\) \{ \.chat-name \{ animation: none/);
    } finally {
      native.dom.window.close();
    }
  }
  for (const pattern of CHAT_PANEL_PATTERNS.filter((item) => item !== "none")) {
    const background = chatPatternBackground(pattern, "#123456");
    assert.match(background, /#123456/, pattern);
    assert.doesNotMatch(background, /url\(|expression|;/i, pattern);
  }
});

test("message combos: the same short message in a row is one row with a counter, in both renderers", () => {
  assert.equal(chatComboKey({ text: "  GG  " }), "gg");
  assert.equal(chatComboKey({ text: "x".repeat(41) }), "");
  assert.equal(chatComboKey({ text: "gg", event: { kind: "follow", name: "a", amount: 0 } }), "");
  const stream: Incoming[] = [
    say("a1", "GG"), say("a2", "gg", "b"), say("a3", "GG ", "c"),
    say("b1", "nice play"), say("b2", "Nice  play", "d"),
    { listener: "follower-latest", data: { name: "Marta" } },
    say("c1", "nice play", "e"),
    say("d1", "y".repeat(45)), say("d2", "y".repeat(45), "f"),
    say("e1", "Pog"), say("e2", "pog", "g"), say("e3", "POG", "h"), say("e4", "pog", "i"), say("e5", "pog", "j"),
  ];
  const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 20, comboMessages: true, streamEvents: true };
  const native = nativeWidget(config);
  const page = obsPage(config);
  try {
    act(() => { for (const item of stream) page.send(item); });
    for (const item of stream) native.send(item);
    const react = rowsOf(page.document, ".obs-chat-message", ".obs-chat-text");
    assert.deepEqual(rowsOf(native.document, ".se-message", ".se-text"), react);
    assert.deepEqual(react.map((row) => [row.text, row.combo, row.hot]), [
      ["GG", "×3", ""],
      ["nice play", "×2", ""],
      ["event:follow", "", ""],
      ["nice play", "", ""],
      ["y".repeat(45), "", ""],
      ["y".repeat(45), "", ""],
      ["Pog", "×5", "1"],
    ]);
    act(() => { page.send({ listener: "delete-message", data: { msgId: "a2" } }); });
    native.send({ listener: "delete-message", data: { msgId: "a2" } });
    act(() => { page.send({ listener: "delete-messages", data: { userId: "u_j" } }); });
    native.send({ listener: "delete-messages", data: { userId: "u_j" } });
    const afterModeration = rowsOf(page.document, ".obs-chat-message", ".obs-chat-text");
    assert.deepEqual(rowsOf(native.document, ".se-message", ".se-text"), afterModeration);
    assert.deepEqual([afterModeration[0]!.combo, afterModeration.at(-1)!.combo, afterModeration.at(-1)!.hot], ["×2", "×4", ""]);
  } finally {
    native.dom.window.close();
  }
  const off = buildChatRows(stream.slice(0, 3).map((item) => ({ name: String(item.data["displayName"]), text: String(item.data["text"]), msgId: String(item.data["msgId"]) })),
    { ...config, comboMessages: false }, Date.now());
  assert.equal(off.length, 3, "without the option every message is its own row");
});

test("the pickers filter looks by group; a seasonal look and the combo extra apply", () => {
  const view = render(<ObsLab />);
  fireEvent.click(view.getByText("Camera + Chat Overlay"));
  const stored = () => cameraChatConfigFromSearch(localStorage.getItem("tm_obs_camera_chat_config") ?? "");
  const quickPresets = () => view.container.querySelectorAll("[data-testid^='quick-preset-']").length;
  assert.equal(quickPresets(), 72);
  act(() => { fireEvent.click(view.getByTestId("preset-category-seasonal")); });
  assert.equal(quickPresets(), CHAT_PRESET_CATEGORIES.seasonal.length);
  act(() => { fireEvent.click(view.getByTestId("quick-preset-autumn")); });
  assert.deepEqual([stored().ambient, stored().animationStyle], ["leaves", "drop"]);
  assert.ok(view.container.querySelectorAll(".chat-ambient .chat-amb-leaf").length > 0, "leaves fall in the preview");
  act(() => { fireEvent.click(view.getByTestId("quick-extra-combo")); });
  assert.equal(stored().comboMessages, true);
  act(() => { fireEvent.click(view.getByTestId("chat-test-plain")); });
  act(() => { fireEvent.click(view.getByTestId("chat-test-plain")); });
  assert.equal(view.container.querySelector(".chat-combo")?.textContent, "×2", "two identical test messages make a combo");

  act(() => { fireEvent.click(view.getByText(view.getByTestId("chat-setup-mode").querySelectorAll("button")[1]!.textContent!)); });
  act(() => { fireEvent.click(view.getByTestId("preset-category-neon")); });
  assert.equal(view.container.querySelectorAll("[data-testid^='chat-preset-']").length, CHAT_PRESET_CATEGORIES.neon.length);
  act(() => { fireEvent.click(view.getByTestId("chat-preset-cyberpunk")); });
  assert.deepEqual([stored().nameStyle, stored().panelPattern, stored().animationStyle], ["glow", "grid", "glitch"]);
  assert.ok(view.container.querySelector(".chat-pattern"));
});

test("every two looks differ in at least five of twelve visible traits, not only in colour", () => {
  const close: string[] = [];
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < CHAT_PRESET_IDS.length; i++) {
    for (let j = i + 1; j < CHAT_PRESET_IDS.length; j++) {
      const distance = chatLookDistance(chatPresetConfig(CHAT_PRESET_IDS[i]!), chatPresetConfig(CHAT_PRESET_IDS[j]!));
      total += distance;
      pairs += 1;
      if (distance < 5) close.push(`${CHAT_PRESET_IDS[i]} ~ ${CHAT_PRESET_IDS[j]}: ${distance}`);
    }
  }
  assert.deepEqual(close, []);
  assert.ok(total / pairs >= 8, `on average looks differ in ${(total / pairs).toFixed(1)} traits`);
  assert.equal(Object.keys(chatLookTraits(DEFAULT_CAMERA_CHAT_CONFIG)).length, 12);
  assert.deepEqual([chatPanelTone("#fdf6e3"), chatPanelTone("#0a0a0a"), chatPanelTone("#7f1d1d")], ["light", "neutral", "hue-0"]);
});
