// Chat customisation: every option reaches the URL (OBS), the React preview and the native StreamElements widget,
// the two renderers agree, viewer content stays text, and addresses made by the previous version keep their look.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import CameraChatOverlay from "./CameraChatOverlay";
import { CameraChatWidget, type MockChatMessage } from "./CameraChatWidget";
import { CHAT_PRESET_IDS, chatPresetConfig } from "./chat-presets";
import { generateStreamElementsWidget } from "./stream-elements-widget";
import {
  type CameraChatConfig,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigFromUrl,
  cameraChatConfigToSearch,
  chatFontFamily,
  getCameraChatSize,
  readableNameColor,
  resolveChatNameColor,
} from "./camera-chat-settings";
import {
  buildChatRows,
  chatMessagePhase,
  chatMessageParts,
  hideChatLinks,
  isChatMessageHidden,
  nextChatPhaseChange,
  safeChatImageUrl,
  truncateChatText,
} from "./chat-message-format";

afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });

const EMOTE_URL = "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0";
const BADGE_URL = "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1";
const FORBIDDEN_IN_SNIPPETS = /iframe|https?:\/\/|replit|postMessage|token=|secret=/i;

const CUSTOM: CameraChatConfig = {
  ...DEFAULT_CAMERA_CHAT_CONFIG,
  layout: "chat",
  chatOnlyWidth: 480,
  chatOnlyHeight: 640,
  maxMessages: 9,
  fontSize: "custom",
  fontSizePx: 24,
  fontFamily: "custom",
  customFont: "Bebas Neue",
  panelColor: "#101820",
  panelOpacity: 40,
  newestFirst: true,
  chatAnchor: "top",
  textAlign: "right",
  messageLayout: "bubble",
  textColor: "#fef3c7",
  textOpacity: 95,
  textShadow: "outline",
  nameColorMode: "single",
  nameColor: "#22d3ee",
  readableNames: true,
  showColon: true,
  showAvatars: true,
  bubbleColor: "#334155",
  bubbleOpacity: 62.5,
  bubbleRadius: 20,
  accentBar: true,
  showBadges: false,
  showEmotes: false,
  emoteScale: 220,
  emoteOnlyLarge: false,
  messageLifetime: 45,
  maxMessageLength: 120,
  hideCommands: true,
  hideLinks: true,
  ignoredUsers: "nightbot, StreamElements",
  highlightWords: "giveaway, @kuba",
  highlightColor: "#f43f5e",
  animationStyle: "random",
  animationDurationMs: 500,
  exitStyle: "slide",
};

test("every new option survives the Browser Source URL", () => {
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(CUSTOM)), CUSTOM);
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(DEFAULT_CAMERA_CHAT_CONFIG)), DEFAULT_CAMERA_CHAT_CONFIG);
});

test("an address made by the previous version keeps its settings and look", () => {
  const legacy = "layout=right&ratio=16%3A9&cw=640&chatw=32&belowh=150&messages=5&font=large&density=normal&opacity=72&radius=22&gap=0&padding=12&anchor=bottom&position=bottom-right&inset=14&fit=1&avatars=0&borders=1&msgbg=1&fade=1&anim=1&animstyle=pop&animdur=300";
  const config = cameraChatConfigFromSearch(legacy);
  assert.deepEqual(config, { ...DEFAULT_CAMERA_CHAT_CONFIG, fontSize: "large", animationStyle: "pop", animationDurationMs: 300 });
  const { css } = generateStreamElementsWidget(config);
  assert.match(css, /font-size: 16px/);
  assert.match(css, /line-height: 20px/);
  assert.match(css, /background: rgba\(2, 6, 23, 0.72\)/);
  assert.match(css, /background: rgba\(255, 255, 255, 0.055\)/);
  assert.match(css, /color: rgba\(255, 255, 255, 0.85\)/);
  assert.match(css, /font-family: Inter, ui-sans-serif, system-ui, sans-serif/);
  assert.doesNotMatch(css, /text-shadow/);
});

test("manually edited parameters are validated: colours, fonts, enums, numbers", () => {
  const parsed = cameraChatConfigFromSearch(
    "?layout=sideways&family=wingdings&customfont=%22%3B%7Dbody%7Bdisplay%3Anone&textc=red&panelc=%23ABCDEF&namemode=rainbow"
    + "&fontpx=999&texto=0&bubbleo=-4&emotescale=5000&lifetime=-1&maxlen=99999&shadow=neon&msglayout=grid&align=center&exit=boom",
  );
  assert.equal(parsed.layout, "right");
  assert.equal(parsed.fontFamily, "inter");
  assert.equal(parsed.customFont, "bodydisplaynone", "quotes, braces and semicolons never reach the CSS");
  assert.equal(parsed.textColor, "#ffffff");
  assert.equal(parsed.panelColor, "#abcdef");
  assert.equal(parsed.nameColorMode, "user");
  assert.equal(parsed.fontSizePx, 48);
  assert.equal(parsed.textOpacity, 10);
  assert.equal(parsed.bubbleOpacity, 0);
  assert.equal(parsed.emoteScale, 300);
  assert.equal(parsed.messageLifetime, 0);
  assert.equal(parsed.maxMessageLength, 500);
  assert.equal(parsed.textShadow, "none");
  assert.equal(parsed.messageLayout, "inline");
  assert.equal(parsed.textAlign, "left");
  assert.equal(parsed.exitStyle, "fade");
  assert.equal(chatFontFamily({ fontFamily: "custom", customFont: "\"; } * { color: red" }), "\"color red\", Inter, ui-sans-serif, system-ui, sans-serif");
});

test("a pasted OBS address loads its settings; other addresses are refused", () => {
  const url = `https://example.test/stream/overlay/camera-chat?${cameraChatConfigToSearch(CUSTOM)}`;
  assert.deepEqual(cameraChatConfigFromUrl(url, "https://example.test"), CUSTOM);
  assert.deepEqual(cameraChatConfigFromUrl(`/developer/overlay/camera-chat?font=small`, "https://example.test")?.fontSize, "small");
  assert.equal(cameraChatConfigFromUrl("https://example.test/tournaments/1?font=small", "https://example.test"), null);
  assert.equal(cameraChatConfigFromUrl("not a url at all", "https://example.test"), null);
  assert.equal(cameraChatConfigFromUrl("https://example.test/stream/overlay/camera-chat", "https://example.test"), null);
});

test("images come only from https chat CDNs", () => {
  assert.equal(safeChatImageUrl(EMOTE_URL), EMOTE_URL);
  assert.equal(safeChatImageUrl("https://cdn.7tv.app/emote/1/2x.webp"), "https://cdn.7tv.app/emote/1/2x.webp");
  assert.equal(safeChatImageUrl("https://cdn.betterttv.net/emote/5/2x"), "https://cdn.betterttv.net/emote/5/2x");
  for (const bad of [
    "http://static-cdn.jtvnw.net/emote.png",
    "https://static-cdn.jtvnw.net.evil.example/emote.png",
    "https://evil.example/emote.png",
    "https://user:pw@static-cdn.jtvnw.net/emote.png",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    42,
  ]) assert.equal(safeChatImageUrl(bad), "", String(bad));
});

test("text rules: commands, hidden users, links, length, emotes", () => {
  const rules = { ...DEFAULT_CAMERA_CHAT_CONFIG, hideCommands: true, ignoredUsers: "@Nightbot,  streamelements" };
  assert.equal(isChatMessageHidden({ name: "Viewer", text: "  !discord" }, rules), true);
  assert.equal(isChatMessageHidden({ name: "NightBot", text: "hi" }, rules), true);
  assert.equal(isChatMessageHidden({ name: "StreamElements Bot", nick: "streamelements", text: "hi" }, rules), true);
  assert.equal(isChatMessageHidden({ name: "Viewer", text: "hi !discord" }, rules), false);
  assert.equal(hideChatLinks("see https://clips.example.com/abc and www.site.pl or shop.example.gg/x, ok?"), "see [link] and [link] or [link] ok?");
  assert.equal(hideChatLinks("e.g. 3.14 is fine"), "e.g. 3.14 is fine");
  assert.equal(truncateChatText("żółć gęślą", 4), "żółć…");
  assert.equal(truncateChatText("short", 0), "short");
  assert.deepEqual(chatMessageParts("Kappa hey Kappa", [{ name: "Kappa", url: EMOTE_URL }], true), [
    { kind: "emote", name: "Kappa", url: EMOTE_URL },
    { kind: "text", text: " hey " },
    { kind: "emote", name: "Kappa", url: EMOTE_URL },
  ]);
  assert.deepEqual(chatMessageParts("Kappa", [{ name: "Kappa", url: "https://evil.example/k.png" }], true), [{ kind: "text", text: "Kappa" }]);
  assert.deepEqual(chatMessageParts("Kappa", [{ name: "Kappa", url: EMOTE_URL }], false), [{ kind: "text", text: "Kappa" }]);
});

test("name colours: viewer colour, readable lift, stable palette, single colour", () => {
  assert.equal(readableNameColor("#0000ff"), "#7676ff");
  assert.equal(readableNameColor("#ffcc00"), "#ffcc00");
  const user = { ...DEFAULT_CAMERA_CHAT_CONFIG, readableNames: false };
  assert.equal(resolveChatNameColor({ name: "A", color: "#0000FF" }, user), "#0000ff");
  assert.equal(resolveChatNameColor({ name: "A", color: "#0000FF" }, DEFAULT_CAMERA_CHAT_CONFIG), "#7676ff", "readable by default");
  assert.equal(resolveChatNameColor({ name: "Viewer" }, user), resolveChatNameColor({ name: "viewer", color: "not-a-colour" }, user), "palette colour follows the name, not the position");
  assert.equal(resolveChatNameColor({ name: "A", color: "#123456" }, { ...user, nameColorMode: "single", nameColor: "#22d3ee" }), "#22d3ee");
  assert.notEqual(resolveChatNameColor({ name: "A", color: "#123456" }, { ...user, nameColorMode: "palette" }), "#123456");
});

test("lifetime: shown, then leaving for the exit animation, then gone; one timer for the next change", () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, messageLifetime: 10, animationDurationMs: 400 };
  assert.equal(chatMessagePhase(1_000, config, 10_999), "shown");
  assert.equal(chatMessagePhase(1_000, config, 11_000), "leaving");
  assert.equal(chatMessagePhase(1_000, config, 11_399), "leaving");
  assert.equal(chatMessagePhase(1_000, config, 11_400), "gone");
  assert.equal(chatMessagePhase(undefined, config, 99_999), "shown", "sample messages without an arrival time stay");
  assert.equal(chatMessagePhase(1_000, { ...config, messageLifetime: 0 }, 99_999), "shown");
  assert.equal(chatMessagePhase(1_000, { ...config, exitStyle: "none" }, 11_000), "gone");
  assert.equal(nextChatPhaseChange([{ receivedAt: 1_000 }, { receivedAt: 5_000 }, {}], config, 2_000), 11_000);
  assert.equal(nextChatPhaseChange([{ receivedAt: 1_000 }], config, 11_100), 11_400);
  assert.equal(nextChatPhaseChange([{ receivedAt: 1_000 }], config, 12_000), null);
});

// --- React preview vs native StreamElements -----------------------------------------------------------------------

type Shape = { name: string; color: string; text: string; emotes: string[]; badges: string[]; flags: string[]; opacity: string };

function previewShape(container: HTMLElement): Shape[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".obs-chat-message"), (row) => ({
    name: row.querySelector(".obs-chat-name")?.textContent ?? "",
    color: (row.querySelector(".obs-chat-name") as HTMLElement | null)?.style.color ?? "",
    text: row.querySelector(".obs-chat-text")?.textContent ?? "",
    emotes: Array.from(row.querySelectorAll<HTMLImageElement>(".obs-chat-emote"), (img) => `${img.alt}@${img.src}`),
    badges: Array.from(row.querySelectorAll<HTMLImageElement>(".obs-chat-badge"), (img) => img.src),
    flags: [
      row.classList.contains("obs-chat-highlight") && "highlight",
      row.classList.contains("obs-chat-emote-only") && "emote-only",
      (row.querySelector(".obs-chat-text") as HTMLElement | null)?.style.fontStyle === "italic" && "action",
    ].filter((flag): flag is string => typeof flag === "string"),
    opacity: row.style.opacity,
  }));
}

function nativeShape(document: Document): Shape[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".se-message"), (row) => ({
    name: row.querySelector(".se-name")?.textContent ?? "",
    color: (row.querySelector(".se-name") as HTMLElement | null)?.style.color ?? "",
    text: row.querySelector(".se-text")?.textContent ?? "",
    emotes: Array.from(row.querySelectorAll<HTMLImageElement>(".se-emote"), (img) => `${img.alt}@${img.src}`),
    badges: Array.from(row.querySelectorAll<HTMLImageElement>(".se-badge"), (img) => img.src),
    flags: [
      row.classList.contains("se-highlight") && "highlight",
      row.classList.contains("se-emote-only") && "emote-only",
      row.querySelector(".se-text")?.classList.contains("se-action") && "action",
    ].filter((flag): flag is string => typeof flag === "string"),
    opacity: row.style.opacity,
  }));
}

type Incoming = {
  displayName: string;
  nick?: string;
  displayColor?: string;
  text: string;
  msgId: string;
  userId: string;
  isAction?: boolean;
  badges?: Array<{ type: string; url: string; description: string }>;
  emotes?: Array<{ name: string; urls: Record<string, string> }>;
};

const CHAT: Incoming[] = [
  { displayName: "NightOwl", nick: "nightowl", displayColor: "#0000FF", text: "Hej Kappa see www.example.com/clip", msgId: "m1", userId: "u1", badges: [{ type: "subscriber", url: BADGE_URL, description: "Subscriber" }], emotes: [{ name: "Kappa", urls: { "1": EMOTE_URL } }] },
  { displayName: "Nightbot", nick: "nightbot", text: "I am a bot", msgId: "m2", userId: "bot" },
  { displayName: "Viewer", nick: "viewer", text: "!discord", msgId: "m3", userId: "u2" },
  { displayName: "PixelMaja", nick: "pixelmaja", displayColor: "#FF69B4", text: "Kappa Kappa", msgId: "m4", userId: "u3", emotes: [{ name: "Kappa", urls: { "2": EMOTE_URL } }] },
  { displayName: "Evil", nick: "evil", text: "BadEmote <img src=x onerror=alert(1)>", msgId: "m5", userId: "u4", badges: [{ type: "x", url: "javascript:alert(1)", description: "x" }], emotes: [{ name: "BadEmote", urls: { "1": "https://evil.example/e.png" } }] },
  { displayName: "AdaQ", nick: "adaq", text: "dances for the GIVEAWAY", msgId: "m6", userId: "u5", isAction: true },
  { displayName: "Bartek_TV", nick: "bartek_tv", displayColor: "#B22222", text: "a very long message that goes on and on and on and on", msgId: "m7", userId: "u6" },
];

function asPreview(message: Incoming): MockChatMessage {
  return {
    id: message.msgId,
    name: message.displayName,
    nick: message.nick,
    color: message.displayColor,
    text: message.text,
    msgId: message.msgId,
    userId: message.userId,
    isAction: message.isAction,
    badges: message.badges,
    emotes: message.emotes?.map((emote) => ({ name: emote.name, url: emote.urls["2"] ?? emote.urls["1"] ?? "" })),
  };
}

function nativeWidget(config: CameraChatConfig) {
  const snippets = generateStreamElementsWidget(config);
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  const timers: Array<{ at: number; run: () => void }> = [];
  let clock = 0;
  dom.window.setTimeout = ((run: () => void, ms: number) => { timers.push({ at: clock + ms, run }); return timers.length; }) as unknown as typeof dom.window.setTimeout;
  dom.window.eval(snippets.js);
  const send = (listener: string, data: Record<string, unknown>) => dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: { listener, event: { data } } }));
  /** Runs due timers in time order, each at its own moment (a timer may schedule the next one). */
  const advance = (ms: number) => {
    const target = clock + ms;
    for (;;) {
      const next = timers.filter((timer) => timer.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      timers.splice(timers.indexOf(next), 1);
      clock = next.at;
      next.run();
    }
    clock = target;
  };
  return { dom, send, advance, snippets };
}

const PARITY_CONFIGS: Array<[string, CameraChatConfig]> = [
  ["defaults", { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 10 }],
  ["filters, links, length, highlight, readable names", {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    maxMessages: 10,
    hideCommands: true,
    hideLinks: true,
    ignoredUsers: "nightbot",
    maxMessageLength: 30,
    highlightWords: "giveaway",
    readableNames: true,
    showColon: true,
  }],
  ["newest first, single colour, no badges or emotes", {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    maxMessages: 4,
    newestFirst: true,
    nameColorMode: "single",
    nameColor: "#22d3ee",
    showBadges: false,
    showEmotes: false,
    fadeOldMessages: true,
  }],
  ["stacked bubbles on the right, palette colours", {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    maxMessages: 10,
    messageLayout: "bubble",
    textAlign: "right",
    nameColorMode: "palette",
    emoteOnlyLarge: false,
    accentBar: true,
  }],
];

for (const [label, config] of PARITY_CONFIGS) {
  test(`preview and StreamElements draw the same chat: ${label}`, () => {
    const preview = render(<CameraChatWidget config={config} messages={CHAT.map(asPreview)} />);
    const expected = previewShape(preview.container);
    assert.ok(expected.length >= 4 && expected.every((row) => row.name && row.color), "the comparison is not empty");
    const native = nativeWidget(config);
    try {
      for (const message of CHAT) native.send("message", message as unknown as Record<string, unknown>);
      assert.deepEqual(nativeShape(native.dom.window.document), expected);
      assert.equal(native.dom.window.document.querySelectorAll("img:not(.se-emote):not(.se-badge)").length, 0);
      assert.ok(expected.every((row) => row.badges.every((src) => src === BADGE_URL)));
      assert.ok(!expected.some((row) => row.emotes.some((emote) => emote.includes("evil"))), "an emote from an unknown host stays text");
    } finally {
      native.dom.window.close();
    }
  });
}

test("the preview applies the rules: hidden, truncated, highlighted, emote-only, action", () => {
  const config = PARITY_CONFIGS[1]![1];
  const shape = previewShape(render(<CameraChatWidget config={config} messages={CHAT.map(asPreview)} />).container);
  assert.deepEqual(shape.map((row) => row.name), ["NightOwl:", "PixelMaja:", "Evil:", "AdaQ:", "Bartek_TV:"]);
  assert.equal(shape[0]!.text, "Hej  see [link]", "the emote is an image between the two text parts");
  assert.deepEqual(shape[0]!.emotes, [`Kappa@${EMOTE_URL}`]);
  assert.equal(shape[0]!.color, "rgb(118, 118, 255)", "dark Twitch blue is lifted");
  assert.deepEqual(shape[1]!.flags, ["emote-only"]);
  assert.equal(shape[2]!.text, "BadEmote <img src=x onerror=al…");
  assert.deepEqual(shape[3]!.flags, ["highlight", "action"]);
  assert.equal(shape[4]!.text, "a very long message that goes…");
});

test("StreamElements: newest first inserts at the top without moving rows already on screen", () => {
  const native = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 3, newestFirst: true });
  try {
    const list = native.dom.window.document.getElementById("se-chat-messages")!;
    native.send("message", { displayName: "A", text: "one", msgId: "1", userId: "a" });
    native.send("message", { displayName: "B", text: "two", msgId: "2", userId: "b" });
    const first = list.lastElementChild;
    native.send("message", { displayName: "C", text: "three", msgId: "3", userId: "c" });
    assert.deepEqual(Array.from(list.children, (row) => row.querySelector(".se-text")?.textContent), ["three", "two", "one"]);
    assert.equal(list.lastElementChild, first);
  } finally {
    native.dom.window.close();
  }
});

test("StreamElements: a message brought back by moderation returns to its own place", () => {
  const native = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 2 });
  try {
    const list = native.dom.window.document.getElementById("se-chat-messages")!;
    native.send("message", { displayName: "A", text: "one", msgId: "1", userId: "a" });
    native.send("message", { displayName: "B", text: "two", msgId: "2", userId: "b" });
    native.send("message", { displayName: "C", text: "three", msgId: "3", userId: "c" });
    native.send("delete-message", { msgId: "3" });
    assert.deepEqual(Array.from(list.children, (row) => row.querySelector(".se-text")?.textContent), ["one", "two"]);
  } finally {
    native.dom.window.close();
  }
});

test("StreamElements: messages leave after their lifetime with the exit animation", () => {
  const native = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, messageLifetime: 5, animationDurationMs: 300, exitStyle: "slide" });
  try {
    const document = native.dom.window.document;
    assert.match(native.snippets.css, /@keyframes se-chat-out \{ to \{ opacity: 0; transform: translateX\(-28px\); \} \}/);
    native.send("message", { displayName: "A", text: "one", msgId: "1", userId: "a" });
    native.advance(2_000);
    native.send("message", { displayName: "B", text: "two", msgId: "2", userId: "b" });
    native.advance(2_999);
    assert.equal(document.querySelectorAll(".se-leaving").length, 0);
    native.advance(1);
    assert.equal(document.querySelectorAll(".se-leaving").length, 1);
    native.advance(300);
    assert.deepEqual(Array.from(document.querySelectorAll(".se-text"), (node) => node.textContent), ["two"]);
    native.advance(2_000);
    assert.equal(document.querySelectorAll(".se-message").length, 0);
  } finally {
    native.dom.window.close();
  }
});

test("React preview: leaving and gone messages follow the same lifetime", () => {
  const now = Date.now();
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, messageLifetime: 5, animationDurationMs: 800 };
  const messages: MockChatMessage[] = [
    { id: "gone", name: "A", text: "gone", receivedAt: now - 60_000 },
    { id: "leaving", name: "B", text: "leaving", receivedAt: now - 5_050 },
    { id: "fresh", name: "C", text: "fresh", receivedAt: now },
    { id: "sample", name: "D", text: "sample" },
  ];
  const rows = buildChatRows(messages, config, now);
  assert.deepEqual(rows.map((row) => [row.key, row.phase]), [["leaving", "leaving"], ["fresh", "shown"], ["sample", "shown"]]);
  const { container } = render(<CameraChatWidget config={config} messages={messages} />);
  assert.deepEqual(Array.from(container.querySelectorAll(".obs-chat-text"), (node) => node.textContent), ["leaving", "fresh", "sample"]);
  assert.match((container.querySelector(".obs-chat-leaving") as HTMLElement).style.animation, /obs-chat-out 800ms/);
});

test("chat-only layout: no camera frame, its own size, in preview and StreamElements", () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, layout: "chat" as const, chatOnlyWidth: 360, chatOnlyHeight: 700 };
  assert.deepEqual(getCameraChatSize(config), { width: 360, height: 700, cameraHeight: 0, chatWidthPx: 360 });
  const { container } = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "A", text: "hi" }]} previewCamera />);
  const root = container.querySelector("div.relative.shrink-0") as HTMLElement;
  assert.equal(root.style.width, "360px");
  assert.equal(root.style.height, "700px");
  assert.equal(container.textContent?.includes("CAM"), false);
  const { css } = generateStreamElementsWidget(config);
  assert.match(css, /width: 360px;\n  height: 700px;/);
  assert.match(css, /\.se-camera \{[^}]*display: none;/);
});

test("OBS page bridge carries badges, emotes and /me from StreamElements data", () => {
  window.history.replaceState({}, "", "/stream/overlay/camera-chat?source=streamelements&messages=5");
  const view = render(<CameraChatOverlay />);
  act(() => {
    window.dispatchEvent(new window.MessageEvent("message", {
      source: window.parent,
      data: {
        source: "camera-chat-se",
        type: "message",
        payload: { data: { ...CHAT[0], isAction: true } },
      },
    }));
  });
  const shape = previewShape(view.container);
  assert.equal(shape.length, 1);
  assert.deepEqual(shape[0]!.badges, [BADGE_URL]);
  assert.deepEqual(shape[0]!.emotes, [`Kappa@${EMOTE_URL}`]);
  assert.deepEqual(shape[0]!.flags, ["action"]);
  act(() => {
    window.dispatchEvent(new window.MessageEvent("message", { source: window.parent, data: { source: "camera-chat-se", type: "message", payload: { data: CHAT[0] } } }));
  });
  assert.equal(previewShape(view.container).length, 1, "the same msgId is shown once");
});

test("every preset is a valid URL and a standalone StreamElements widget", () => {
  assert.equal(CHAT_PRESET_IDS.length, 10);
  for (const preset of CHAT_PRESET_IDS) {
    const config = chatPresetConfig(preset);
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config, preset);
    const snippets = generateStreamElementsWidget(config);
    assert.doesNotMatch(snippets.html + snippets.css + snippets.js, FORBIDDEN_IN_SNIPPETS, preset);
    const native = nativeWidget(config);
    try {
      native.send("message", CHAT[0] as unknown as Record<string, unknown>);
      assert.equal(native.dom.window.document.querySelectorAll(".se-message").length, 1, preset);
    } finally {
      native.dom.window.close();
    }
  }
});

test("typed words and names cannot break out of the exported script", () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, ignoredUsers: "</script><script>alert(1)</script>", highlightWords: "\"});alert(1);//, </style>" };
  const { js } = generateStreamElementsWidget(config);
  assert.doesNotMatch(js, /<\/script>|<script>|<\/style>/i);
  assert.doesNotMatch(js, FORBIDDEN_IN_SNIPPETS);
  const native = nativeWidget(config);
  try {
    native.send("message", { displayName: "x", text: "hello \"});alert(1);// there", msgId: "1", userId: "x" });
    assert.equal(native.dom.window.document.querySelectorAll(".se-highlight").length, 1);
  } finally {
    native.dom.window.close();
  }
});
