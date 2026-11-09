import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import CameraChatOverlay from "./CameraChatOverlay";
import { CameraChatWidget } from "./CameraChatWidget";
import { StreamElementsSetup } from "./StreamElementsSetup";
import { generateStreamElementsWidget } from "./stream-elements-widget";
import { CHAT_MOTION_PRESETS, pickChatMotion, DEFAULT_CAMERA_CHAT_CONFIG, cameraChatConfigFromSearch, cameraChatConfigToSearch, getCameraChatSize } from "./camera-chat-settings";

afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

for (const layout of ["right", "below", "overlay"] as const) test(`${layout}: URL roundtrip preserves preview settings and bounds invalid input`, () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, layout, maxMessages: 12 };
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config);
  const parsed = cameraChatConfigFromSearch(`?layout=${layout}&cw=Infinity&chatw=999&messages=-9&padding=999`);
  assert.equal(parsed.cameraWidth, 640);
  assert.equal(parsed.chatWidth, 70);
  assert.equal(parsed.maxMessages, 1);
  assert.equal(parsed.innerPadding, 50);
  const size = getCameraChatSize(config);
  const { container } = render(<CameraChatWidget config={config} messages={Array.from({ length: 30 }, (_, i) => ({ name: `Viewer ${i}`, text: `Message ${i}` }))} />);
  assert.equal(container.querySelectorAll("span.break-all").length, 12);
  assert.equal((container.querySelector("div.relative.shrink-0") as HTMLElement).style.width, `${size.width}px`);
});

test("overlay extreme inset keeps a positive chat area inside the camera", () => {
  const config = cameraChatConfigFromSearch("?layout=overlay&cw=240&inset=100&chatw=70");
  const { container } = render(<CameraChatWidget config={config} messages={[{ name: "Viewer", text: "Message" }]} />);
  const chat = container.querySelector("div.absolute.overflow-hidden") as HTMLElement;
  assert.ok(parseFloat(chat.style.maxHeight) > 0);
  assert.ok(parseFloat(chat.style.right) * 2 + 240 * .7 <= 240);
  const messages = chat.firstElementChild as HTMLElement;
  assert.equal(messages.style.maxHeight, chat.style.maxHeight, "message alignment must use the same bounded area as the overlay");
  assert.ok(messages.classList.contains("justify-end"));
  assert.ok(messages.firstElementChild?.classList.contains("shrink-0"), "overflow must clip older messages rather than shrink the aligned message stack");
});

test("public overlay is transparent, handles parent bridge safely and restores document styles", () => {
  window.history.replaceState({}, "", "/developer/overlay/camera-chat?source=streamelements&messages=2");
  document.body.style.background = "red";
  const view = render(<CameraChatOverlay />);
  assert.equal(document.body.style.background, "transparent");
  const send = (type: string, payload: unknown, source: Window | null = window.parent) => act(() => {
    window.dispatchEvent(new window.MessageEvent("message", { source, origin: "null", data: { source: "camera-chat-se", type, payload } }));
  });
  send("message", { text: "Rejected", displayName: "Other frame" }, null);
  assert.ok(!screen.queryByText("Rejected"));
  send("message", { text: "<img src=x onerror=alert(1)>", displayName: "Viewer", msgId: "1", userId: "u" });
  assert.ok(screen.getByText("<img src=x onerror=alert(1)>"));
  assert.equal(view.container.querySelectorAll("img").length, 0);
  send("delete-message", { msgId: "1" });
  assert.ok(!screen.queryByText("<img src=x onerror=alert(1)>"));
  send("message", { text: "Second", displayName: "Viewer", userId: "u" });
  send("delete-messages", { userId: "u" });
  assert.ok(!screen.queryByText("Second"));
  view.unmount();
  assert.equal(document.body.style.background, "red");
  document.body.style.background = "";
});

test("StreamElements snippets are standalone and do not load the app or embed a frame", () => {
  const { container } = render(<StreamElementsSetup config={DEFAULT_CAMERA_CHAT_CONFIG} width={845} height={360} />);
  const snippets = Array.from(container.querySelectorAll("code"), node => node.textContent ?? "");
  assert.equal(snippets.length, 3);
  assert.match(snippets[0], /id="se-chat-messages"/);
  assert.match(snippets[1], /width: 845px/);
  assert.match(snippets[2], /onEventReceived/);
  assert.doesNotMatch(snippets.join(""), /iframe|https?:\/\/|replit|postMessage|token=|secret=/i);
});

test("native StreamElements widget preserves layout and styling settings", () => {
  for (const layout of ["right", "below", "overlay"] as const) {
    const config = {
      ...DEFAULT_CAMERA_CHAT_CONFIG,
      layout,
      aspectRatio: "4:3" as const,
      cameraWidth: 800,
      chatWidth: 45,
      belowHeight: 240,
      maxMessages: 3,
      fontSize: "large" as const,
      density: "relaxed" as const,
      panelOpacity: 40,
      radius: 30,
      gap: 18,
      innerPadding: 20,
      chatAnchor: "top" as const,
      overlayPosition: "top-left" as const,
      overlayInset: 24,
      fitChatHeight: false,
      showAvatars: true,
      showBorders: true,
      messageBackground: true,
      fadeOldMessages: true,
      animateMessages: true,
    };
    const { css, js } = generateStreamElementsWidget(config);
    const size = getCameraChatSize(config);
    assert.match(css, new RegExp(`width: ${size.width}px`));
    assert.match(css, new RegExp(`height: ${size.height}px`));
    assert.match(css, /height: 600px/);
    assert.match(css, layout === "overlay" ? /gap: 0px/ : /gap: 18px/);
    assert.match(css, /padding: 20px/);
    assert.match(css, /font-size: 16px/);
    assert.match(css, /background: rgba\(2, 6, 23, 0.4\)/);
    assert.match(css, /border-radius: 30px/);
    assert.match(css, /border: 1px solid/);
    assert.match(css, /background: rgba\(255,255,255,.055\)/);
    assert.match(css, /animation: se-chat-in/);
    assert.match(js, /"maxMessages":3/);
    assert.match(js, /"showAvatars":true/);
    assert.match(js, /"fadeOldMessages":true/);
    if (layout === "right") {
      assert.match(css, /width: 360px/);
      assert.match(css, /align-items: flex-start/);
    } else if (layout === "below") {
      assert.match(css, /height: 240px/);
      assert.match(css, /flex-direction: column/);
    } else {
      assert.match(css, /width: 45%/);
      assert.match(css, /top: 24px/);
      assert.match(css, /left: 24px/);
      assert.match(css, /max-height: 552px/);
    }
  }
});

test("native StreamElements events render safe text and remove moderated messages", () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 2, showAvatars: true };
  const snippets = generateStreamElementsWidget(config);
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, {
    runScripts: "outside-only",
  });
  try {
    dom.window.eval(snippets.js);
    const send = (listener: string, data: Record<string, unknown>) => {
      dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", {
        detail: { listener, event: { data } },
      }));
    };
    send("message", { text: "<img src=x onerror=alert(1)>", displayName: "One", msgId: "1", userId: "u" });
    assert.match(dom.window.document.body.textContent ?? "", /<img src=x onerror=alert\(1\)>/);
    assert.equal(dom.window.document.querySelector("img"), null);
    assert.equal(dom.window.document.querySelectorAll(".se-avatar").length, 1);
    send("message", { text: "Two", nick: "Two", msgId: "2", userId: "v" });
    send("message", { text: "Three", nick: "Three", msgId: "3", userId: "u" });
    assert.equal(dom.window.document.querySelectorAll(".se-message").length, 2);
    assert.ok(!dom.window.document.body.textContent?.includes("onerror"));
    send("delete-message", { msgId: "2" });
    assert.ok(!dom.window.document.body.textContent?.includes("Two"));
    send("delete-messages", { userId: "u" });
    assert.equal(dom.window.document.querySelectorAll(".se-message").length, 0);
  } finally {
    dom.window.close();
  }
});

test("chat motion presets stay in sync between browser source, preview and StreamElements", () => {
  for (const animationStyle of ["rise", "slide", "pop", "fade"] as const) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, animationStyle, animationDurationMs: 460 };
    const roundtrip = cameraChatConfigFromSearch(cameraChatConfigToSearch(config));
    assert.deepEqual(roundtrip, config);
    const preview = render(<CameraChatWidget config={config} messages={[{ name: "Viewer", text: "Animated", msgId: "one" }]} />);
    const row = preview.container.querySelector(".obs-chat-message") as HTMLElement;
    assert.match(row.style.animation, /obs-chat-in 460ms/);
    const previewStyle = preview.container.querySelector("style")?.textContent ?? "";
    const exported = generateStreamElementsWidget(config);
    assert.match(exported.css, /animation: se-chat-in 460ms/);
    assert.match(previewStyle, /prefers-reduced-motion: reduce/);
    assert.match(exported.css, /prefers-reduced-motion: reduce/);
    const transform = {
      rise: "translateY(14px)",
      slide: "translateX(-22px)",
      pop: "scale(.78)",
      fade: "transform: none",
    }[animationStyle];
    assert.ok(previewStyle.includes(transform), animationStyle);
    assert.ok(exported.css.includes(transform), animationStyle);
    preview.unmount();
  }

  const invalid = cameraChatConfigFromSearch("?animstyle=evil&animdur=-20");
  assert.equal(invalid.animationStyle, "rise");
  assert.equal(invalid.animationDurationMs, 100);
  assert.equal(cameraChatConfigFromSearch("?animdur=999999").animationDurationMs, 1200);
  assert.equal(cameraChatConfigFromSearch("").animationDurationMs, 220);
  const disabled = generateStreamElementsWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, animateMessages: false });
  assert.doesNotMatch(disabled.css, /animation: se-chat-in /);
});

test("chat motion includes bounce, flip and wipe in both preview and StreamElements output", () => {
  const signatures = {
    bounce: "translateY(24px)",
    flip: "rotateX(-78deg)",
    wipe: "clip-path: inset(0 100% 0 0)",
  };
  for (const style of ["bounce", "flip", "wipe"] as const) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, animationStyle: style, animationDurationMs: 380 };
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config);
    const preview = render(<CameraChatWidget config={config} messages={[{ name: "Streamer", text: "Hej!", msgId: "m-1" }]} />);
    const row = preview.container.querySelector(".obs-chat-message") as HTMLElement;
    assert.match(row.style.animation, /obs-chat-in 380ms/);
    assert.ok(preview.container.querySelector("style")?.textContent?.includes(signatures[style]));
    const exported = generateStreamElementsWidget(config);
    assert.ok(exported.css.includes(signatures[style]));
    assert.match(exported.css, /animation: se-chat-in 380ms/);
    preview.unmount();
  }
});

test("random motion is stable per message and agrees between React and native StreamElements", () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, animationStyle: "random" as const, animationDurationMs: 300 };
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config);
  const cases = Array.from({ length: 14 }, (_, i) => ({ name: "Viewer", text: "message-" + i, msgId: "test-" + i }));
  const expected = cases.map((message) => "se-chat-in-" + pickChatMotion(message.msgId));
  assert.ok(new Set(expected).size >= 4, "different IDs should have varied motion presets");
  assert.equal(CHAT_MOTION_PRESETS.length, 7);
  const preview = render(<CameraChatWidget config={{ ...config, maxMessages: 20 }} messages={cases} />);
  const names = Array.from(preview.container.querySelectorAll(".obs-chat-message"), (row) => (row as HTMLElement).style.animation);
  assert.deepEqual(names.map((name) => name.split(" ")[0]), expected.map((name) => name.replace("se-chat", "obs-chat")));
  preview.unmount();

  const snippets = generateStreamElementsWidget({ ...config, maxMessages: 20 });
  assert.ok(snippets.css.includes("@keyframes se-chat-in-bounce"));
  assert.ok(snippets.css.includes("@keyframes se-chat-in-flip"));
  assert.ok(snippets.css.includes("@keyframes se-chat-in-wipe"));
  const dom = new JSDOM(`<!doctype html><body>${snippets.html}</body>`, { runScripts: "outside-only" });
  try {
    dom.window.eval(snippets.js);
    cases.forEach((message) => {
      dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: {
        listener: "message", event: { data: { msgId: message.msgId, displayName: message.name, text: message.text } },
      } }));
    });
    assert.deepEqual(Array.from(dom.window.document.querySelectorAll(".se-message"), (row) => (row as HTMLElement).style.animationName), expected);
    const previous = dom.window.document.querySelectorAll(".se-message")[2]!;
    dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: {
      listener: "message", event: { data: { msgId: "test-2", displayName: "Viewer", text: "duplicate" } },
    } }));
    assert.equal(dom.window.document.querySelectorAll(".se-message")[2], previous);
  } finally {
    dom.window.close();
  }
  const fallback = cameraChatConfigFromSearch("?animstyle=unknown");
  assert.equal(fallback.animationStyle, "rise");
});

test("StreamElements animates only new rows; deduplicates messages and moderates without replay", () => {
  const snippets = generateStreamElementsWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 3 });
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  try {
    dom.window.eval(snippets.js);
    const send = (listener: string, data: Record<string, unknown>) => {
      dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", {
        detail: { listener, event: { data } },
      }));
    };
    send("message", { msgId: "a", userId: "a-user", text: "First" });
    send("message", { msgId: "b", userId: "b-user", text: "Second" });
    const list = dom.window.document.getElementById("se-chat-messages")!;
    const secondRow = list.lastElementChild;
    send("message", { msgId: "b", userId: "b-user", text: "Duplicate" });
    assert.equal(list.children.length, 2);
    send("message", { msgId: "c", userId: "c-user", text: "Third" });
    assert.equal(list.children[1], secondRow, "existing message DOM should not be recreated");
    send("delete-message", { msgId: "a" });
    assert.equal(list.firstElementChild, secondRow, "moderation should preserve surviving rows");
    assert.equal(list.children.length, 2);
    send("delete-messages", { userId: "b-user" });
    assert.equal(list.children.length, 1);
    assert.match(list.textContent ?? "", /Third/);
  } finally {
    dom.window.close();
  }
});

test("Draw Lab renders participant names as text, not executable HTML", async () => {
  const base = new URL("../../randomizers/draw-lab/engines/cards/", import.meta.url);
  const dom = new JSDOM(readFileSync(new URL("cards-host.html", base), "utf8"), { url: "https://tournament.example/developer", runScripts: "outside-only", pretendToBeVisual: true });
  try {
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
    dom.window.eval(readFileSync(new URL("cards-engine.js", base), "utf8"));
    const input = dom.window.document.getElementById("participants") as HTMLTextAreaElement;
    const payload = '<img src=x onerror="alert(1)">';
    input.value = `${payload}\nSecond`;
    dom.window.document.getElementById("applyBtn")!.click();
    const rows = dom.window.document.getElementById("manualRows")!;
    assert.equal(rows.querySelectorAll("img").length, 0);
    assert.ok(rows.textContent?.includes(payload));
    await new Promise<void>(resolve => dom.window.requestAnimationFrame(() => resolve()));
  } finally { dom.window.close(); }
});

test("Draw Lab observers settle instead of perpetually updating each other", async () => {
  const base = new URL("../../randomizers/draw-lab/engines/cards/", import.meta.url);
  const dom = new JSDOM(readFileSync(new URL("cards-host.html", base), "utf8"), { url: "https://tournament.example/developer", runScripts: "outside-only" });
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  dom.window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  dom.window.cancelAnimationFrame = id => { frames.delete(id); };
  const settle = async () => {
    for (let tick = 0; tick < 12; tick++) {
      await Promise.resolve();
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback(tick * 16));
    }
    await Promise.resolve();
    assert.equal(frames.size, 0, "unchanged draw state must stop scheduling DOM updates");
  };
  try {
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
    dom.window.eval(readFileSync(new URL("cards-engine.js", base), "utf8"));
    await settle();
    const draw = dom.window.document.getElementById("drawBtn") as HTMLButtonElement;
    draw.disabled = true;
    await settle();
    assert.equal((dom.window.document.querySelector(".draw-focus-button-v158") as HTMLButtonElement).disabled, true);
  } finally { dom.window.close(); }
});
