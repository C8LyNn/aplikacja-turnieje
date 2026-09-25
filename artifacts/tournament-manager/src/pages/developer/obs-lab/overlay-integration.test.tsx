import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import CameraChatOverlay from "./CameraChatOverlay";
import { CameraChatWidget } from "./CameraChatWidget";
import { StreamElementsSetup } from "./StreamElementsSetup";
import { DEFAULT_CAMERA_CHAT_CONFIG, cameraChatConfigFromSearch, cameraChatConfigToSearch, getCameraChatSize } from "./camera-chat-settings";

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

test("StreamElements snippet targets only the public HTTPS overlay origin", () => {
  const { container } = render(<StreamElementsSetup overlayUrl="https://tournament.example/developer/overlay/camera-chat?layout=right" width={845} height={360} />);
  const snippets = Array.from(container.querySelectorAll("code"), node => node.textContent ?? "");
  assert.match(snippets[0], /https:\/\/tournament\.example\/developer\/overlay\/camera-chat/);
  assert.match(snippets[0], /source=streamelements/);
  assert.doesNotMatch(snippets.join(""), /localhost|token=|secret=/);
  assert.doesNotMatch(snippets[2], /"\*"/);
});

test("Draw Lab renders participant names as text, not executable HTML", async () => {
  const base = new URL("../draw-lab/engines/cards/", import.meta.url);
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
  const base = new URL("../draw-lab/engines/cards/", import.meta.url);
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
