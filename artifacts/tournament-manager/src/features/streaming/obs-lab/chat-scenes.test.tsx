// Theme scenes: an animated picture behind the messages, the same in the preview, the OBS page and the native
// StreamElements widget; fixed, safe markup; valid shapes; every animation defined; readable text on top.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { t } from "@/i18n";
import CameraChatOverlay from "./CameraChatOverlay";
import { CameraChatWidget } from "./CameraChatWidget";
import { generateStreamElementsWidget } from "./stream-elements-widget";
import { chatEventLabels } from "./chat-event-labels";
import { CHAT_SCENE_BACKDROP, CHAT_SCENE_IDS, CHAT_SCENE_LEVEL_OPACITY, chatSceneFor, chatSceneHtml, chatSceneLevel, getChatSceneCss } from "./chat-scenes";
import { type CameraChatConfig, DEFAULT_CAMERA_CHAT_CONFIG, cameraChatConfigFromSearch, cameraChatConfigToSearch } from "./camera-chat-settings";
import { chatPresetConfig, CHAT_PRESET_IDS } from "./chat-presets";
import { chatTextBackdrop, checkChatSetup } from "./chat-setup-check";
import { getChatDecorCss } from "./chat-decor";

afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

const SCENES = CHAT_SCENE_IDS.filter((id) => id !== "none");

/** SVG path data: every command gets the right count of numbers. */
const PATH_ARGS: Record<string, number> = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
function pathProblem(d: string): string | null {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  if (tokens.join("").length < d.replace(/[\s,]/g, "").length) return "unknown characters";
  let command = "";
  let count = 0;
  const close = () => {
    if (!command) return null;
    const need = PATH_ARGS[command.toUpperCase()]!;
    return (need === 0 ? count !== 0 : count === 0 || count % need !== 0) ? `${command} with ${count} numbers` : null;
  };
  for (const token of tokens) {
    if (/[A-Za-z]/.test(token)) {
      const problem = close();
      if (problem) return problem;
      command = token;
      count = 0;
    } else if (!command) {
      return "number before a command";
    } else {
      count += 1;
    }
  }
  return close();
}

test("most themes have a scene; old addresses and unknown values get none", () => {
  assert.ok(SCENES.length >= 60, `${SCENES.length} scenes`);
  for (const id of SCENES) assert.ok((CHAT_PRESET_IDS as readonly string[]).includes(id), `${id} is a theme`);
  for (const id of CHAT_PRESET_IDS) assert.equal(chatPresetConfig(id).scene, chatSceneFor(id), id);
  for (const id of ["ocean", "forest", "space", "sunset", "autumn", "newyear", "easter", "summer", "fantasy", "steampunk", "dragon", "aurora", "candy", "mint", "coffee", "cyberpunk", "racing", "newspaper"]) {
    assert.equal(chatPresetConfig(id as never).scene, id, `${id} got the scene the owner asked for`);
  }
  assert.equal(DEFAULT_CAMERA_CHAT_CONFIG.scene, "none");
  assert.equal(cameraChatConfigFromSearch("layout=right&messages=5").scene, "none", "an old address keeps its look");
  assert.equal(cameraChatConfigFromSearch("scene=%3Cscript%3E").scene, "none");
  const ocean = chatPresetConfig("ocean");
  assert.equal(cameraChatConfigFromSearch(cameraChatConfigToSearch(ocean)).scene, "ocean");
  assert.equal(chatSceneHtml(DEFAULT_CAMERA_CHAT_CONFIG), "");
  assert.equal(getChatSceneCss(DEFAULT_CAMERA_CHAT_CONFIG, ".p", ".r"), "");
});

test("every scene is fixed, safe markup with valid shapes and every animation defined", () => {
  for (const id of SCENES) {
    const html = chatSceneHtml({ scene: id });
    const css = getChatSceneCss({ scene: id }, ".panel", ".row");
    assert.ok(html.length > 100, `${id} draws something`);
    assert.doesNotMatch(html + css, /url\(|javascript:|@import|<script|<iframe|<img|\shref=|\son[a-z]+=/i, id);
    assert.equal(css.split("{").length, css.split("}").length, `${id}: balanced braces`);
    for (const match of html.matchAll(/\sd="([^"]*)"/g)) assert.equal(pathProblem(match[1]!), null, `${id}: ${match[1]!.slice(0, 60)}`);
    const used = new Set([...(html + css).matchAll(/animation(?:-name)?:\s*([a-z][\w-]*)/g)].map((match) => match[1]!));
    for (const name of used) if (name !== "none") assert.ok(css.includes(`@keyframes ${name} `), `${id}: @keyframes ${name}`);
    assert.match(css, /prefers-reduced-motion: reduce/, `${id}: still for viewers who turn motion off`);
    assert.ok(css.includes(`.row { -webkit-backdrop-filter: ${CHAT_SCENE_BACKDROP.light}; backdrop-filter: ${CHAT_SCENE_BACKDROP.light}; }`), `${id}: messages blur and dim what is behind light text`);
    assert.equal(chatSceneHtml({ scene: id }), html, `${id}: the same scene on every call`);
    const dom = new JSDOM(`<div>${html}</div>`);
    assert.ok(dom.window.document.querySelectorAll(".cs").length > 0, `${id} parses as HTML`);
    dom.window.close();
  }
});

function nativeScene(config: CameraChatConfig) {
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"), chatEventLabels());
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  dom.window.eval(snippets.js);
  const scene = dom.window.document.querySelector(".chat-scene")?.innerHTML ?? null;
  dom.window.close();
  return { scene, css: snippets.css };
}

test("the scene is the same in the preview, the OBS page and the native widget", () => {
  for (const id of ["ocean", "dragon", "cyberpunk", "christmas"] as const) {
    const config = chatPresetConfig(id);
    const native = nativeScene(config);
    window.history.replaceState({}, "", `/stream/overlay/camera-chat?source=streamelements&${cameraChatConfigToSearch(config)}`);
    const page = render(<CameraChatOverlay />);
    const onPage = page.container.querySelector(".chat-scene")?.innerHTML ?? null;
    page.unmount();
    const preview = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "A", text: "hej" }]} />);
    const inPreview = preview.container.querySelector(".chat-scene")?.innerHTML ?? null;
    const previewCss = preview.container.querySelector("style")!.textContent!;
    preview.unmount();
    assert.ok(native.scene && native.scene.length > 100, `${id}: the widget draws the scene`);
    assert.equal(onPage, native.scene, `${id}: OBS page = widget`);
    assert.equal(inPreview, native.scene, `${id}: preview = widget`);
    const sceneCss = getChatSceneCss(config, ".x", ".y").split("\n").filter((rule) => rule.startsWith("@keyframes cs-")).slice(0, 3);
    for (const rule of sceneCss) {
      assert.ok(native.css.includes(rule), `${id}: widget CSS has ${rule.slice(0, 40)}`);
      assert.ok(previewCss.includes(rule), `${id}: preview CSS has ${rule.slice(0, 40)}`);
    }
  }
  const plain = nativeScene({ ...DEFAULT_CAMERA_CHAT_CONFIG });
  assert.equal(plain.scene, null, "no scene, no layer");
});

test("an empty chat shows the scene in full; as messages arrive it steps back, the same in all three renderers", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map((count) => chatSceneLevel(count, 5)), [0, 1, 1, 2, 3, 3, 3]);
  assert.deepEqual([0, 1, 3, 4, 7, 8].map((count) => chatSceneLevel(count, 10)), [0, 1, 1, 2, 2, 3]);
  assert.equal(chatSceneLevel(1, 1), 1);
  const css = getChatDecorCss(chatPresetConfig("ocean"), ".p", ".r");
  for (const level of [1, 2, 3] as const) {
    assert.ok(css.includes(`.p[data-chat-level="${level}"] .chat-scene { opacity: ${CHAT_SCENE_LEVEL_OPACITY.scene[level]};`), `scene level ${level}`);
    assert.ok(css.includes(`.p[data-chat-level="${level}"] .chat-ambient { opacity: ${CHAT_SCENE_LEVEL_OPACITY.particles[level]}; }`), `particles level ${level}`);
  }
  assert.ok(CHAT_SCENE_LEVEL_OPACITY.scene.every((value, index, all) => index === 0 || value < all[index - 1]!), "fuller chat, quieter scene");
  assert.match(css, /\.chat-scene, \.chat-ambient \{ transition: opacity 1\.4s ease/);
  assert.match(getChatDecorCss(chatPresetConfig("matrix"), ".p", ".r"), /data-chat-level="3"\] \.chat-ambient/, "particles without a scene step back too");
  assert.doesNotMatch(getChatDecorCss({ ...DEFAULT_CAMERA_CHAT_CONFIG }, ".p", ".r"), /data-chat-level/, "nothing to step back, no rules");

  const config: CameraChatConfig = { ...chatPresetConfig("ocean"), maxMessages: 5 };
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"), chatEventLabels());
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  dom.window.eval(snippets.js);
  const panel = dom.window.document.querySelector(".se-panel")!;
  const levels = [panel.getAttribute("data-chat-level")];
  for (let index = 1; index <= 5; index += 1) {
    dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: { listener: "message", event: { data: { displayName: `U${index}`, nick: `u${index}`, text: `hej ${index}`, msgId: `m${index}`, userId: `u${index}`, displayColor: "#1E90FF" } } } }));
    levels.push(panel.getAttribute("data-chat-level"));
  }
  dom.window.close();
  assert.deepEqual(levels, ["0", "1", "1", "2", "3", "3"], "the widget steps the scene back message by message");
  for (const count of [0, 1, 3, 5]) {
    const messages = Array.from({ length: count }, (_, index) => ({ id: String(index), name: `U${index}`, text: "hej" }));
    const view = render(<CameraChatWidget config={config} messages={messages} />);
    assert.equal(view.container.querySelector(".obs-chat-panel")!.getAttribute("data-chat-level"), String(chatSceneLevel(count, 5)), `preview with ${count} messages`);
    view.unmount();
  }
});

test("text stays readable over the scenes, and Matrix keeps its code rain behind dark plates", () => {
  for (const id of SCENES) {
    assert.deepEqual(checkChatSetup({ ...chatPresetConfig(id), ignoredUsers: "x" }, "Live").filter((issue) => issue.id === "contrast"), [], `${id} is readable`);
  }
  const matrix = chatPresetConfig("matrix");
  assert.deepEqual(chatTextBackdrop(matrix), ["#000000"], "every Matrix message sits on a dark plate");
  assert.equal(matrix.nameStyle, "plain");
  assert.doesNotMatch(getChatDecorCss(matrix, ".p", ".r"), /#15803d !important/, "older messages are no longer dimmed into the rain");
  const space = chatPresetConfig("space");
  assert.deepEqual([space.panelAnimation, space.ambient], ["none", "none"], "space no longer pulses");
  assert.match(chatSceneHtml(space), /cs-space-comet/);
  assert.match(getChatSceneCss(space, ".p", ".r"), /@keyframes cs-space-ship /, "a ship passes now and then");
});
