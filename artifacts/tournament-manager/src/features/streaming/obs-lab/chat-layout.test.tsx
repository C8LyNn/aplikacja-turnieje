// Layout of the chat lab: chat only is the default first option, bands along the camera edges draw the same in the
// preview and the native StreamElements widget, the preview stays docked (sticky) and scales to fit, Matrix rain.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ObsLab } from "./ObsLab";
import { CameraChatWidget } from "./CameraChatWidget";
import { FitPreview } from "./FitPreview";
import { generateStreamElementsWidget } from "./stream-elements-widget";
import {
  type CameraChatConfig,
  CHAT_LAYOUTS,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigToSearch,
  chatOverlaySize,
  getCameraChatSize,
} from "./camera-chat-settings";
import { chatAmbientParticles } from "./chat-decor";
import { CHAT_PRESET_CATEGORY_IDS, chatPresetConfig } from "./chat-presets";

afterEach(() => { cleanup(); localStorage.clear(); });

test("chat only is the default and the first layout; old addresses keep their layout", () => {
  assert.equal(DEFAULT_CAMERA_CHAT_CONFIG.layout, "chat");
  assert.equal(CHAT_LAYOUTS[0], "chat");
  assert.equal(cameraChatConfigFromSearch("layout=right&messages=5").layout, "right");
  const view = render(<ObsLab />);
  fireEvent.click(view.getByText("Camera + Chat Overlay"));
  const tiles = Array.from(view.container.querySelectorAll("[data-testid^='quick-layout-']")).map((tile) => tile.getAttribute("data-testid"));
  assert.equal(tiles[0], "quick-layout-chat", "the first tile is chat only");
  assert.equal(view.getByTestId("quick-layout-chat").getAttribute("aria-pressed"), "true", "and it is picked for a new setup");
});

test("bands along the camera edges: full-height columns and full-width strips in both renderers", () => {
  const camera = getCameraChatSize({ ...DEFAULT_CAMERA_CHAT_CONFIG, layout: "overlay" }).cameraHeight;
  assert.deepEqual(chatOverlaySize("dock-left", 30, 360, 10), { width: "30%", height: "340px" });
  assert.deepEqual(chatOverlaySize("dock-bottom", 30, 360, 10), { height: "108px" });
  assert.deepEqual(chatOverlaySize("dock-top", 99, 360, 10), { height: "340px" }, "a strip never leaves the camera");
  assert.deepEqual(chatOverlaySize("bottom-right", 30, 360, 10), { width: "30%", maxHeight: "340px" }, "a box keeps its old size");
  for (const position of ["dock-left", "dock-right", "dock-top", "dock-bottom"] as const) {
    const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, layout: "overlay", overlayPosition: position, chatWidth: 30, overlayInset: 10 };
    assert.equal(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)).overlayPosition, position);
    const expected = chatOverlaySize(position, 30, camera, 10);
    const { css } = generateStreamElementsWidget(config);
    const box = css.slice(css.indexOf(".se-chat-box {"), css.indexOf("}", css.indexOf(".se-chat-box {")));
    if (expected.width) assert.match(box, new RegExp(`width: ${expected.width};`), position);
    assert.match(box, new RegExp(`height: ${expected.height};`), position);
    assert.doesNotMatch(box, /max-height/, `${position}: a band has a fixed size`);
    assert.match(css, /\.se-panel \{[^}]*height: 100%;/, `${position}: the panel fills the band`);
    const { container } = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "A", text: "hi" }]} />);
    const element = container.querySelector("div.absolute.overflow-hidden") as HTMLElement;
    assert.equal(element.style.height, expected.height, position);
    if (expected.width) assert.equal(element.style.width, expected.width, position);
    assert.equal((container.querySelector(".obs-chat-panel") as HTMLElement).style.height, "100%");
    cleanup();
  }
});

test("the preview stays docked next to the options and scales the overlay down to fit", () => {
  const view = render(<ObsLab />);
  fireEvent.click(view.getByText("Camera + Chat Overlay"));
  const dock = view.getByTestId("chat-preview-dock");
  assert.match(dock.className, /\bsticky\b/);
  assert.ok(dock.querySelector(".obs-chat-panel"), "the preview is inside the docked panel");
  assert.ok(dock.querySelector("[data-testid='chat-test-strip'] [data-testid='chat-test-plain']"), "test buttons stay with it");
  act(() => { fireEvent.click(view.getByTestId("chat-live-preview")); });
  assert.equal(view.getByTestId("chat-live-preview").getAttribute("aria-pressed"), "true");
  view.unmount();

  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 600 });
  try {
    const fit = render(<FitPreview width={800} height={400} maxHeight={200}><div>overlay</div></FitPreview>);
    const root = fit.getByTestId("chat-preview-fit");
    assert.equal(root.dataset["scale"], "0.500", "the smaller of width and height decides");
    assert.equal((root.firstElementChild as HTMLElement).style.width, "400px");
    assert.match(((root.firstElementChild as HTMLElement).firstElementChild as HTMLElement).style.transform, /scale\(0\.5\)/);
    fit.unmount();
    const small = render(<FitPreview width={300} height={100} maxHeight={500}><div>overlay</div></FitPreview>);
    assert.equal(small.getByTestId("chat-preview-fit").dataset["scale"], "1.000", "never scaled up");
  } finally {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, "clientWidth", descriptor);
  }
});

test("Matrix rains code; seven theme groups", () => {
  const matrix = chatPresetConfig("matrix");
  assert.equal(matrix.ambient, "code");
  const drops = chatAmbientParticles(matrix);
  assert.equal(drops.length, matrix.ambientDensity);
  for (const drop of drops) {
    assert.match(drop.className, /chat-amb-code/);
    assert.ok(drop.text.split("\n").length >= 5, "each drop is a column of glyphs");
  }
  assert.deepEqual([...CHAT_PRESET_CATEGORY_IDS], ["classic", "neon", "fantasy", "cute", "abstract", "nature", "seasonal"]);
});
