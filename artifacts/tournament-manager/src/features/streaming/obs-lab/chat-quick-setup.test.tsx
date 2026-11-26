// Quick setup of the chat configurator: a style keeps the placement, one-click extras switch cleanly on and off,
// undo / redo walk the history, and the configurator opens in the quick mode with a working preview.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ObsLab } from "./ObsLab";
import {
  type CameraChatConfig,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigToSearch,
} from "./camera-chat-settings";
import { CHAT_PRESET_IDS, chatPresetConfig } from "./chat-presets";
import {
  CHAT_PLACEMENT_FIELDS,
  HISTORY_LIMIT,
  HISTORY_MERGE_MS,
  QUICK_EXTRAS,
  QUICK_FADE_SECONDS,
  applyChatPresetKeepingPlacement,
  commitChatHistory,
  quickExtraOn,
  randomChatLook,
  redoChatHistory,
  startChatHistory,
  toggleQuickExtra,
  undoChatHistory,
} from "./chat-quick-setup";

afterEach(() => { cleanup(); localStorage.clear(); });

const PLACED: CameraChatConfig = {
  ...DEFAULT_CAMERA_CHAT_CONFIG,
  layout: "overlay",
  overlayPosition: "top-left",
  overlayInset: 20,
  chatWidth: 44,
  cameraWidth: 800,
  aspectRatio: "4:3",
};

test("a style changes the look and keeps the placement chosen in step 1", () => {
  for (const preset of CHAT_PRESET_IDS) {
    const result = applyChatPresetKeepingPlacement(PLACED, preset);
    for (const field of CHAT_PLACEMENT_FIELDS) assert.equal(result[field], PLACED[field], `${preset}: ${field}`);
    const look = chatPresetConfig(preset);
    assert.equal(result.panelColor, look.panelColor, preset);
    assert.equal(result.frameStyle, look.frameStyle, preset);
    assert.equal(result.fontFamily, look.fontFamily, preset);
  }
});

test("a random look is a valid address and never moves the chat", () => {
  const sequence = [0.1, 0.9, 0.3, 0.2, 0.75, 0.6, 0.99, 0];
  for (let start = 0; start < sequence.length; start++) {
    let index = start;
    const result = randomChatLook(PLACED, () => sequence[index++ % sequence.length]!);
    for (const field of CHAT_PLACEMENT_FIELDS) assert.equal(result[field], PLACED[field], field);
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(result)), result);
  }
});

test("each one-click extra switches on and back off", () => {
  for (const extra of QUICK_EXTRAS) {
    const on = toggleQuickExtra(extra, DEFAULT_CAMERA_CHAT_CONFIG, "Live");
    assert.equal(quickExtraOn(extra, DEFAULT_CAMERA_CHAT_CONFIG), false, `${extra} starts off`);
    assert.equal(quickExtraOn(extra, on), true, `${extra} on`);
    assert.equal(quickExtraOn(extra, toggleQuickExtra(extra, on, "Live")), false, `${extra} off again`);
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(on)), on, `${extra} survives the URL`);
  }
  const snow = toggleQuickExtra("snow", DEFAULT_CAMERA_CHAT_CONFIG, "Live");
  assert.equal(toggleQuickExtra("hearts", snow, "Live").ambient, "hearts", "background effects replace each other");
  const header = toggleQuickExtra("header", DEFAULT_CAMERA_CHAT_CONFIG, "Live");
  assert.deepEqual([header.headerStyle, header.headerText, header.headerLive], ["bar", "Live", true]);
  const own = toggleQuickExtra("header", { ...DEFAULT_CAMERA_CHAT_CONFIG, headerText: "Mój czat" }, "Live");
  assert.equal(own.headerText, "Mój czat", "a title the streamer typed stays");
  assert.equal(toggleQuickExtra("header", header, "Live").headerText, "Live", "switching off keeps the title for later");
  const burst = toggleQuickExtra("burst", { ...DEFAULT_CAMERA_CHAT_CONFIG, showEmotes: false }, "Live");
  assert.deepEqual([burst.emoteBurst, burst.showEmotes], [true, true], "the burst needs emotes, so it turns them on");
  assert.equal(toggleQuickExtra("fade", DEFAULT_CAMERA_CHAT_CONFIG, "Live").messageLifetime, QUICK_FADE_SECONDS);
});

test("undo and redo walk the history; quick changes merge; nothing changes, nothing is recorded", () => {
  const a = DEFAULT_CAMERA_CHAT_CONFIG;
  const b = { ...a, panelOpacity: 40 };
  const c = { ...a, panelOpacity: 41 };
  const d = { ...a, frameStyle: "glow" as const };
  let history = startChatHistory(a);
  assert.equal(commitChatHistory(history, { ...a }, 0), history, "an equal configuration is not a step");
  history = commitChatHistory(history, b, 1_000);
  history = commitChatHistory(history, c, 1_000 + HISTORY_MERGE_MS - 1);
  assert.deepEqual(history.past, [a], "dragging a slider is one step");
  history = commitChatHistory(history, d, 5_000);
  assert.deepEqual(history.past, [a, c]);
  history = undoChatHistory(history);
  assert.equal(history.present, c);
  history = undoChatHistory(history);
  assert.equal(history.present, a);
  assert.equal(undoChatHistory(history), history, "nothing left to undo");
  history = redoChatHistory(history);
  assert.equal(history.present, c);
  history = commitChatHistory(history, b, 5_001);
  assert.deepEqual(history.future, [], "a new change after undo drops the redo list");
  assert.deepEqual(history.past, [a, c], "a change right after undo is its own step");
  let long = startChatHistory(a);
  for (let index = 1; index <= HISTORY_LIMIT + 10; index++) long = commitChatHistory(long, { ...a, maxMessages: index % 20 + 1, gap: index }, index * 10_000);
  assert.equal(long.past.length, HISTORY_LIMIT);
});

test("the configurator opens in the quick setup; its steps change the preview and undo restores it", () => {
  const view = render(<ObsLab />);
  fireEvent.click(view.getByText("Camera + Chat Overlay"));
  const quick = view.getByTestId("chat-quick-setup");
  assert.ok(quick);
  assert.equal(view.container.querySelectorAll("details").length < 6, true, "the long option list is hidden in the quick mode");
  const undo = view.getByTestId("chat-undo") as HTMLButtonElement;
  assert.equal(undo.disabled, true);

  act(() => { fireEvent.click(view.getByTestId("quick-layout-overlay")); });
  act(() => { fireEvent.click(view.getByTestId("quick-position-top-left")); });
  act(() => { fireEvent.click(view.getByTestId("quick-preset-neon")); });
  const stored = cameraChatConfigFromSearch(localStorage.getItem("tm_obs_camera_chat_config") ?? "");
  assert.deepEqual([stored.layout, stored.overlayPosition, stored.frameStyle], ["overlay", "top-left", "rotate"]);

  act(() => { fireEvent.click(view.getByTestId("quick-extra-snow")); });
  assert.ok(view.container.querySelectorAll(".chat-ambient > span").length > 0, "snow in the preview");
  assert.equal(view.getByTestId("quick-extra-snow").getAttribute("aria-pressed"), "true");
  act(() => { fireEvent.click(view.getByTestId("quick-extra-header")); });
  assert.ok(view.container.querySelector(".chat-header .chat-live-dot"), "the live header shows at once");

  assert.equal(undo.disabled, false);
  act(() => { fireEvent.click(undo); });
  assert.equal(view.container.querySelector(".chat-header"), null, "undo removes the header");
  act(() => { fireEvent.click(view.getByTestId("chat-redo")); });
  assert.ok(view.container.querySelector(".chat-header"), "redo brings it back");

  act(() => { fireEvent.click(view.getByText(view.getByTestId("chat-setup-mode").querySelectorAll("button")[1]!.textContent!)); });
  assert.equal(view.queryByTestId("chat-quick-setup"), null);
  assert.ok(view.container.querySelectorAll("details").length >= 8, "all options are back");
  assert.equal(localStorage.getItem("tm_obs_camera_chat_mode"), "all", "the mode is remembered");
});
