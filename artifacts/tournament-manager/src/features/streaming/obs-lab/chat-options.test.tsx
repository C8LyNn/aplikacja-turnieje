// Chat customisation: every option reaches the URL (OBS), the React preview and the native StreamElements widget,
// the two renderers agree, viewer content stays text, and addresses made by the previous version keep their look.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { t } from "@/i18n";
import CameraChatOverlay from "./CameraChatOverlay";
import { CameraChatWidget, type MockChatMessage } from "./CameraChatWidget";
import { CHAT_COLOR_THEME_IDS, CHAT_PRESET_IDS, applyChatColorTheme, chatPresetConfig } from "./chat-presets";
import { generateStreamElementsWidget } from "./stream-elements-widget";
import { chatAmbientParticles, chatDecorHtml } from "./chat-decor";
import {
  type CameraChatConfig,
  CHAT_AMBIENTS,
  CHAT_BUBBLE_SHAPES,
  CHAT_FRAME_STYLES,
  CHAT_NAME_PALETTES,
  CHAT_OVERLAY_POSITIONS,
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigFromUrl,
  cameraChatConfigToSearch,
  chatFontFamily,
  chatOverlayPlacement,
  chatPaletteColor,
  chatPanelBackground,
  getCameraChatSize,
  readableNameColor,
  resolveChatNameColor,
  rgbaCss,
} from "./camera-chat-settings";
import {
  buildChatRows,
  chatMessagePhase,
  chatMessageParts,
  chatRevealPieces,
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
  roleHighlight: true,
  animationStyle: "random",
  animationDurationMs: 500,
  exitStyle: "slide",
  newMessageEffect: "glow",
  textReveal: "words",
  panelGradient: true,
  panelColor2: "#4c1d95",
  panelGradientAngle: 45,
  frameStyle: "rotate",
  frameWidth: 4,
  frameColor: "#d946ef",
  frameColor2: "#22d3ee",
  frameSpeed: 6.5,
  panelAnimation: "float",
  textBold: true,
  namePalette: "neon",
  nameUppercase: true,
  ambient: "snow",
  ambientDensity: 22,
  ambientColor: "#e0f2fe",
  headerStyle: "bar",
  headerText: "Czat na żywo",
  headerLive: true,
  headerColor: "#f43f5e",
  pinnedText: "Regulamin: bez spamu",
  bubbleShape: "tail",
  firstTimeHighlight: true,
  emoteBurst: true,
};

test("every new option survives the Browser Source URL", () => {
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(CUSTOM)), CUSTOM);
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(DEFAULT_CAMERA_CHAT_CONFIG)), DEFAULT_CAMERA_CHAT_CONFIG);
});

test("an address made by the previous version keeps its settings and look", () => {
  const legacy = "layout=right&ratio=16%3A9&cw=640&chatw=32&belowh=150&messages=5&font=large&density=normal&opacity=72&radius=22&gap=0&padding=12&anchor=bottom&position=bottom-right&inset=14&fit=1&avatars=0&borders=1&msgbg=1&fade=1&anim=1&animstyle=pop&animdur=300";
  const config = cameraChatConfigFromSearch(legacy);
  assert.deepEqual(config, { ...DEFAULT_CAMERA_CHAT_CONFIG, layout: "right", fontSize: "large", animationStyle: "pop", animationDurationMs: 300 });
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

type Shape = {
  name: string; color: string; text: string; emotes: string[]; badges: string[]; flags: string[]; opacity: string;
  role: string; fx: string; background: string; reveal: string[];
};

function previewShape(container: HTMLElement): Shape[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".obs-chat-message"), (row) => ({
    name: row.querySelector(".obs-chat-name")?.textContent ?? "",
    color: (row.querySelector(".obs-chat-name") as HTMLElement | null)?.style.color ?? "",
    text: row.querySelector(".obs-chat-text")?.textContent ?? "",
    role: row.dataset.role ?? "",
    fx: row.classList.contains("obs-chat-fx") ? row.style.getPropertyValue("--chat-fx") : "",
    background: row.dataset.role ? row.style.background : "",
    reveal: Array.from(row.querySelectorAll<HTMLElement>(".obs-chat-reveal, .obs-chat-emote"), (node) => `${node.textContent || (node as HTMLImageElement).alt}:${node.style.animation}`),
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
    role: row.dataset.role ?? "",
    fx: row.classList.contains("se-fx") ? row.style.getPropertyValue("--chat-fx") : "",
    background: row.dataset.role ? row.style.background : "",
    reveal: Array.from(row.querySelectorAll<HTMLElement>(".se-reveal, .se-emote"), (node) => `${node.textContent || (node as HTMLImageElement).alt}:${node.style.animation}`),
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
  tags?: Record<string, string>;
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
    firstMessage: message.tags?.["first-msg"] === "1",
  };
}

function nativeWidget(config: CameraChatConfig) {
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"));
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
  ["typewriter reveal with emotes, shine effect", {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    maxMessages: 10,
    textReveal: "typewriter",
    newMessageEffect: "shine",
    animationDurationMs: 400,
  }],
  ["word reveal without entry animation, glow effect", {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    maxMessages: 10,
    textReveal: "words",
    newMessageEffect: "glow",
    animateMessages: false,
  }],
  ["pastel palette, bold text, names in capitals, frame and floating messages", {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    maxMessages: 10,
    nameColorMode: "palette",
    namePalette: "pastel",
    textBold: true,
    nameUppercase: true,
    frameStyle: "glow",
    panelAnimation: "float",
    panelGradient: true,
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
    if (config.textReveal !== "none") assert.ok(expected.every((row) => row.reveal.some((piece) => piece.includes("chat-reveal-"))), "every row reveals its text");
    if (config.newMessageEffect !== "none") assert.ok(expected.every((row) => row.fx.startsWith("#")), "every row carries the effect colour");
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

const ROLE_CHAT: Incoming[] = [
  { displayName: "Host", nick: "host", text: "Witajcie!", msgId: "r1", userId: "h", badges: [{ type: "broadcaster", url: "javascript:alert(1)", description: "" }, { type: "subscriber", url: BADGE_URL, description: "Sub" }] },
  { displayName: "Mod", nick: "mod", text: "Regulamin w opisie", msgId: "r2", userId: "m", badges: [{ type: "moderator", url: BADGE_URL, description: "Moderator" }] },
  { displayName: "Vip", nick: "vip", text: "giveaway?", msgId: "r3", userId: "v", badges: [{ type: "vip", url: BADGE_URL, description: "VIP" }] },
  { displayName: "Viewer", nick: "viewer", text: "hej", msgId: "r4", userId: "x", badges: [{ type: "subscriber", url: BADGE_URL, description: "Sub" }] },
];

test("broadcaster, moderators and VIPs are coloured by their badge in both renderers, even with badges hidden", () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 10, roleHighlight: true, showBadges: false, highlightWords: "giveaway" };
  const expected = previewShape(render(<CameraChatWidget config={config} messages={ROLE_CHAT.map(asPreview)} />).container);
  assert.deepEqual(expected.map((row) => row.role), ["broadcaster", "moderator", "", ""], "a highlighted word wins over the VIP colour");
  assert.equal(expected[1]!.background, "rgba(34, 197, 94, 0.14)");
  assert.deepEqual(expected[2]!.flags, ["highlight"]);
  const native = nativeWidget(config);
  try {
    for (const message of ROLE_CHAT) native.send("message", message as unknown as Record<string, unknown>);
    assert.deepEqual(nativeShape(native.dom.window.document), expected);
  } finally {
    native.dom.window.close();
  }
  const off = previewShape(render(<CameraChatWidget config={{ ...config, roleHighlight: false }} messages={ROLE_CHAT.map(asPreview)} />).container);
  assert.ok(off.every((row) => row.role === ""));
});

test("reveal timing: letters or words in order after half the entry animation; emotes count as one step; long text at once", () => {
  const parts = chatMessageParts("Hej Kappa ok", [{ name: "Kappa", url: EMOTE_URL }], true);
  const letters = chatRevealPieces(parts, "typewriter", 110)!;
  const animated = letters.filter((piece) => piece.animation);
  assert.deepEqual(animated.map((piece) => (piece.kind === "emote" ? piece.name : piece.text)), ["H", "e", "j", "Kappa", "o", "k"]);
  assert.deepEqual(animated.map((piece) => piece.animation), [0, 1, 2, 3, 4, 5].map((index) => `chat-reveal-type 1ms linear ${110 + index * 45}ms both`));
  const words = chatRevealPieces(parts, "words", 0)!.filter((piece) => piece.animation);
  assert.deepEqual(words.map((piece) => piece.animation), [0, 1, 2].map((index) => `chat-reveal-word 280ms ease-out ${index * 45}ms both`));
  assert.equal(chatRevealPieces(parts, "none", 0), null);
  assert.equal(chatRevealPieces([{ kind: "text", text: "z".repeat(201) }], "typewriter", 0), null);
});

test("the new-message effect is a ::after layer in the name colour, in preview and StreamElements CSS", () => {
  for (const effect of ["glow", "shine", "pulse", "flash"] as const) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, newMessageEffect: effect, animationDurationMs: 300 };
    const { css } = generateStreamElementsWidget(config);
    assert.match(css, new RegExp(`\\.se-fx::after \\{[^}]*animation: chat-fx-${effect} 1100ms ease-out 150ms 1 both;`));
    assert.match(css, new RegExp(`@keyframes chat-fx-${effect} `));
    const preview = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "Ala", text: "hej", color: "#22c55e" }]} />);
    assert.match(preview.container.querySelector("style")?.textContent ?? "", new RegExp(`\\.obs-chat-fx::after \\{[^}]*chat-fx-${effect}`));
    assert.equal((preview.container.querySelector(".obs-chat-fx") as HTMLElement).style.getPropertyValue("--chat-fx"), "#22c55e");
    preview.unmount();
  }
  const none = generateStreamElementsWidget(DEFAULT_CAMERA_CHAT_CONFIG).css;
  assert.doesNotMatch(none, /chat-fx|chat-reveal/);
  assert.match(none, /prefers-reduced-motion[\s\S]*\.se-message::after, \.se-reveal/);
});

// --- Placement, panel, frame and chat motion ----------------------------------------------------------------------

test("chat on the left and above the camera: same size as right/below, mirrored in preview and StreamElements", () => {
  for (const [layout, twin, direction] of [["left", "right", "row-reverse"], ["above", "below", "column-reverse"]] as const) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, layout, gap: 10 };
    assert.deepEqual(getCameraChatSize(config), getCameraChatSize({ ...config, layout: twin }));
    assert.match(generateStreamElementsWidget(config).css, new RegExp(`flex-direction: ${direction};`));
    const { container } = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "A", text: "hi" }]} previewCamera />);
    const flexbox = container.querySelector("div.relative.shrink-0 > div.flex") as HTMLElement;
    assert.equal(flexbox.style.flexDirection, direction);
    assert.equal(container.querySelectorAll(".obs-chat-text").length, 1);
    cleanup();
  }
  assert.deepEqual(cameraChatConfigFromSearch("?layout=left").layout, "left");
  assert.deepEqual(cameraChatConfigFromSearch("?layout=above").layout, "above");
});

test("every place on the camera is written the same way in preview and StreamElements", () => {
  for (const position of CHAT_OVERLAY_POSITIONS) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, layout: "overlay" as const, overlayPosition: position, overlayInset: 20 };
    assert.equal(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)).overlayPosition, position);
    const placement = chatOverlayPlacement(position, 20);
    const { css } = generateStreamElementsWidget(config);
    for (const [property, value] of Object.entries(placement)) assert.match(css, new RegExp(`\\n  ${property}: ${value.replace(/[()]/g, "\\$&")};`), `${position} ${property}`);
    const { container } = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "A", text: "hi" }]} />);
    const box = container.querySelector("div.absolute.overflow-hidden") as HTMLElement;
    for (const [property, value] of Object.entries(placement)) assert.equal(box.style.getPropertyValue(property), value, `${position} ${property}`);
    cleanup();
  }
  assert.deepEqual(chatOverlayPlacement("bottom-center", 14), { bottom: "14px", left: "50%", transform: "translateX(-50%)" });
  assert.deepEqual(chatOverlayPlacement("middle-left", 14), { top: "50%", transform: "translateY(-50%)", left: "14px" });
});

test("frames: a masked ::before ring (or HUD corners) in the chosen colours, the same CSS in preview and StreamElements", () => {
  for (const frameStyle of CHAT_FRAME_STYLES) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, frameStyle, frameWidth: 5, frameColor: "#d946ef", frameColor2: "#22d3ee", frameSpeed: 3 };
    const css = generateStreamElementsWidget(config).css;
    const preview = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "A", text: "hi" }]} />);
    const previewCss = preview.container.querySelector("style")?.textContent ?? "";
    assert.ok(preview.container.querySelector(".obs-chat-panel"), "the panel carries the frame class");
    cleanup();
    if (frameStyle === "none") {
      assert.doesNotMatch(css, /\.se-panel::before \{|chat-frame-/);
      continue;
    }
    assert.equal(
      previewCss.slice(previewCss.indexOf(".obs-chat-panel { position")).split("@media")[0]!.replace(/obs-chat-panel/g, "P").replace(/obs-chat-list/g, "L"),
      css.slice(css.indexOf(".se-panel { position")).split("@media")[0]!.replace(/se-panel/g, "P").replace(/se-messages/g, "L"),
      `${frameStyle}: identical frame rules`,
    );
    assert.match(css, /\.se-panel \{ position: relative; border-radius: 22px; \}/);
    assert.match(css, /\.se-panel::before \{[^}]*position: absolute; inset: 0;/);
    if (frameStyle === "corners") {
      assert.match(css, /linear-gradient\(#d946ef, #d946ef\) top left \/ 22px 5px/);
      assert.doesNotMatch(css, /mask-composite/);
    } else {
      assert.match(css, /padding: 5px; -webkit-mask: [^;]+; -webkit-mask-composite: xor; mask: [^;]+ exclude/);
    }
    if (frameStyle === "rotate") assert.match(css, /@property --chat-frame-angle/);
    if (frameStyle === "glow") assert.match(css, /\.se-panel \{ animation: chat-frame-glow 3s ease-in-out infinite; \}/);
    if (["gradient", "flow", "rotate"].includes(frameStyle)) assert.match(css, /#22d3ee/);
  }
});

test("chat motion: floating list, breathing or shimmering panel, intro; reduced motion stops everything", () => {
  const css = (panelAnimation: CameraChatConfig["panelAnimation"]) => generateStreamElementsWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, panelAnimation }).css;
  assert.match(css("float"), /\.se-messages \{ animation: chat-panel-float 6s ease-in-out infinite; \}/);
  assert.match(css("breathe"), /\.se-panel::after \{[^}]*chat-panel-breathe/);
  assert.match(css("shimmer"), /\.se-panel::after \{[^}]*chat-panel-shimmer/);
  assert.match(css("intro"), /\.se-panel \{ animation: chat-panel-intro 700ms/);
  assert.doesNotMatch(css("intro"), /border-radius: 22px; \}/, "no frame, so the panel keeps its classic square corners");
  assert.doesNotMatch(css("none"), /chat-panel-|chat-frame-/);
  assert.match(css("none"), /\.se-panel, \.se-panel::before, \.se-panel::after, \.se-messages \{ animation: none !important; \}/);
  const both = generateStreamElementsWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, frameStyle: "glow", panelAnimation: "intro", frameSpeed: 2 }).css;
  assert.match(both, /\.se-panel \{ animation: chat-frame-glow 2s ease-in-out infinite, chat-panel-intro 700ms/);
});

test("panel gradient, bold text, capital names and name palettes reach both renderers", () => {
  const config = {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    panelGradient: true, panelColor: "#082f49", panelColor2: "#0e7490", panelGradientAngle: 45, panelOpacity: 80,
    textBold: true, nameUppercase: true, nameColorMode: "palette" as const, namePalette: "neon" as const,
  };
  assert.equal(chatPanelBackground(config), "linear-gradient(45deg, rgba(8, 47, 73, 0.8), rgba(14, 116, 144, 0.8))");
  const snippets = generateStreamElementsWidget(config);
  assert.match(snippets.css, /background: linear-gradient\(45deg, rgba\(8, 47, 73, 0\.8\), rgba\(14, 116, 144, 0\.8\)\);/);
  assert.match(snippets.css, /\.se-text \{[^}]*font-weight: 600;/);
  assert.match(snippets.css, /\.se-name \{[^}]*text-transform: uppercase;/);
  assert.ok(snippets.js.includes(JSON.stringify(CHAT_NAME_PALETTES.neon)));
  const { container } = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "Ala", text: "hej" }]} />);
  const name = container.querySelector(".obs-chat-name") as HTMLElement;
  assert.equal(name.style.textTransform, "uppercase");
  assert.equal((container.querySelector(".obs-chat-text") as HTMLElement).style.fontWeight, "600");
  assert.equal(resolveChatNameColor({ name: "Ala" }, config), chatPaletteColor("Ala", "neon"));
  assert.ok(CHAT_NAME_PALETTES.neon.includes(resolveChatNameColor({ name: "Ala" }, config)));
  assert.equal(chatPaletteColor("Ala"), chatPaletteColor("Ala", "classic"), "classic stays the default palette");
});

test("frame and motion parameters are bounded; colour themes change only colours", () => {
  const parsed = cameraChatConfigFromSearch("?frame=evil&framew=99&framespd=0&framec=red&panelanim=spin&namepal=gold&gradangle=999&position=center-center&layout=diagonal");
  assert.equal(parsed.frameStyle, "none");
  assert.equal(parsed.frameWidth, 12);
  assert.equal(parsed.frameSpeed, 1);
  assert.equal(parsed.frameColor, "#a78bfa");
  assert.equal(parsed.panelAnimation, "none");
  assert.equal(parsed.namePalette, "classic");
  assert.equal(parsed.panelGradientAngle, 360);
  assert.equal(parsed.overlayPosition, "bottom-right");
  assert.equal(parsed.layout, "right");
  for (const theme of CHAT_COLOR_THEME_IDS) {
    const themed = applyChatColorTheme(CUSTOM, theme);
    const changed = Object.keys(themed).filter((key) => themed[key as keyof CameraChatConfig] !== CUSTOM[key as keyof CameraChatConfig]);
    assert.ok(changed.every((key) => /color/i.test(key)), `${theme}: ${changed.join(", ")}`);
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(themed)), themed);
  }
});

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
  assert.equal(CHAT_PRESET_IDS.length, 49, "49 looks in seven groups");
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

// --- Chat extras: particles, header, pinned line, shapes, first-time chatters, emote burst -------------------------

test("chat extras are bounded and cleaned when the address is edited by hand", () => {
  const parsed = cameraChatConfigFromSearch(
    `?ambient=lava&ambientn=999&ambientc=blue&header=huge&headerc=red&shape=star&firsttime=yes&burst=2`
    + `&headertext=${encodeURIComponent("A\u0000B\nC   " + "x".repeat(80))}&pinned=${encodeURIComponent("p".repeat(400))}`,
  );
  assert.equal(parsed.ambient, "none");
  assert.equal(parsed.ambientDensity, 40);
  assert.equal(parsed.ambientColor, "#ffffff");
  assert.equal(parsed.headerStyle, "none");
  assert.equal(parsed.headerColor, "#8b5cf6");
  assert.equal(parsed.bubbleShape, "rounded");
  assert.equal(parsed.firstTimeHighlight, false);
  assert.equal(parsed.emoteBurst, false);
  assert.ok(parsed.headerText.startsWith("A B C x"), "control characters and runs of spaces become one space");
  assert.equal(Array.from(parsed.headerText).length, 40);
  assert.equal(parsed.pinnedText.length, 120);
  assert.equal(cameraChatConfigFromSearch("?ambientn=1").ambientDensity, 4);
  const plain = generateStreamElementsWidget(DEFAULT_CAMERA_CHAT_CONFIG);
  assert.doesNotMatch(plain.html, /chat-ambient|chat-header/, "the old look has none of the extras");
  assert.doesNotMatch(plain.css, /\.chat-ambient \{|\.chat-header|\.chat-first-tag|@keyframes chat-(amb|live|burst)|--chat-bubble/);
});

test("background particles: the same deterministic layer in preview and StreamElements, for every kind", () => {
  for (const ambient of CHAT_AMBIENTS.filter((kind) => kind !== "none")) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, ambient, ambientDensity: 12, ambientColor: "#fde68a" };
    const particles = chatAmbientParticles(config);
    assert.equal(particles.length, 12, ambient);
    assert.deepEqual(chatAmbientParticles(config), particles, "the same particles on every reload");
    const shape = (spans: Iterable<HTMLElement>) => Array.from(spans, (span) => [span.className, span.textContent, span.style.left, span.style.top, span.style.animation, span.style.background, span.style.color].join("|"));
    const preview = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "Ala", text: "hej" }]} />);
    const expected = shape(preview.container.querySelectorAll<HTMLElement>(".chat-ambient > span"));
    assert.equal(expected.length, 12);
    const previewCss = preview.container.querySelector("style")?.textContent ?? "";
    preview.unmount();
    const native = nativeWidget(config);
    try {
      const document = native.dom.window.document;
      assert.deepEqual(shape(document.querySelectorAll<HTMLElement>(".se-panel > .chat-ambient > span")), expected, ambient);
      const css = native.snippets.css;
      for (const keyframes of css.match(/@keyframes chat-amb-[a-z]+/g) ?? []) assert.ok(previewCss.includes(keyframes), keyframes);
      assert.match(css, /\.chat-ambient \{ position: absolute; inset: 0; z-index: -1;/);
      assert.match(css, /prefers-reduced-motion[\s\S]*\.chat-amb, \.chat-live-dot, \.chat-burst \{ animation: none !important; \}/);
    } finally {
      native.dom.window.close();
    }
  }
});

test("header with a live dot and a pinned line: same markup in both renderers, typed text stays text", () => {
  const hostile = "<img src=x onerror=alert(1)> & \"quotes\"";
  for (const headerStyle of ["bar", "pill", "minimal"] as const) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, headerStyle, headerText: hostile, headerLive: true, pinnedText: `${hostile} pinned` };
    const preview = render(<CameraChatWidget config={config} messages={[{ id: "1", name: "Ala", text: "hej" }]} />);
    const box = preview.container.querySelector(".chat-header-box") as HTMLElement;
    const expected = box.outerHTML;
    assert.equal(box.querySelector(`.chat-header-${headerStyle} > span:last-child`)?.textContent, hostile.slice(0, 40));
    assert.ok(box.querySelector(".chat-live-dot"));
    assert.equal(box.querySelector("img"), null);
    assert.equal(box.nextElementSibling?.className.includes("obs-chat-list"), true, "the header sits before the messages");
    preview.unmount();
    const native = nativeWidget(config);
    try {
      const nativeBox = native.dom.window.document.querySelector(".se-panel > .chat-header-box") as HTMLElement;
      assert.equal(nativeBox.outerHTML, expected, headerStyle);
      assert.equal(nativeBox.nextElementSibling?.id, "se-chat-messages");
      assert.doesNotMatch(native.snippets.html, /<img/);
      assert.match(native.snippets.css, /\.chat-header-box \+ \* \{ flex-shrink: 1 !important; min-height: 0; overflow: hidden; justify-content: flex-end; \}/);
    } finally {
      native.dom.window.close();
    }
  }
  const pinnedOnly = { ...DEFAULT_CAMERA_CHAT_CONFIG, pinnedText: "Regulamin" };
  const { container } = render(<CameraChatWidget config={pinnedOnly} messages={[]} />);
  assert.equal(container.querySelector(".chat-header"), null, "no header without a style");
  assert.equal(container.querySelector(".chat-pinned")?.textContent, "Regulamin");
  assert.match(generateStreamElementsWidget(pinnedOnly).html, /<div class="chat-header-box"><div class="chat-pinned">Regulamin<\/div><\/div>/);
  assert.equal(chatDecorHtml({ ...DEFAULT_CAMERA_CHAT_CONFIG, headerStyle: "bar" }).header, "", "an empty bar is not drawn");
});

const FIRST_CHAT: Incoming[] = [
  { displayName: "Nowa", nick: "nowa", displayColor: "#7CFC00", text: "Pierwszy raz Kappa", msgId: "f1", userId: "n", tags: { "first-msg": "1" }, emotes: [{ name: "Kappa", urls: { "1": EMOTE_URL } }] },
  { displayName: "NowyMod", nick: "nowymod", text: "hej", msgId: "f2", userId: "nm", tags: { "first-msg": "1" }, badges: [{ type: "moderator", url: BADGE_URL, description: "Moderator" }] },
  { displayName: "Mod", nick: "mod", text: "witam", msgId: "f3", userId: "m", tags: { "first-msg": "0" }, badges: [{ type: "moderator", url: BADGE_URL, description: "Moderator" }] },
  { displayName: "Fan", nick: "fan", displayColor: "#1E90FF", text: "giveaway Kappa", msgId: "f4", userId: "f", tags: { "first-msg": "1" }, emotes: [{ name: "Kappa", urls: { "1": EMOTE_URL } }] },
  { displayName: "Stary", nick: "stary", displayColor: "#FF69B4", text: "zwykla wiadomosc", msgId: "f5", userId: "s" },
];

type DecorRow = { first: string; role: string; tag: string; tint: string; bubble: string; border: string; underline: string; burst: string[] };

/** The thin border every row has with "borders" on (a class rule in the widget) is not a shape line. */
const shapeLine = (value: string) => (value.includes("255, 255, 255, 0.07") ? "" : value);

function decorShape(rows: Iterable<HTMLElement>): DecorRow[] {
  return Array.from(rows, (row) => {
    const tinted = Boolean(row.dataset.first || row.dataset.role) && !row.className.includes("highlight");
    return {
      first: row.dataset.first ?? "",
      role: row.dataset.role ?? "",
      tag: row.querySelector(".chat-first-tag")?.textContent ?? "",
      tint: tinted ? `${row.style.background} ${row.style.boxShadow}` : "",
      bubble: tinted ? row.style.getPropertyValue("--chat-bubble") : "",
      border: shapeLine(row.style.border),
      underline: shapeLine(row.style.borderBottom),
      burst: Array.from(row.querySelectorAll<HTMLImageElement>(".chat-burst"), (img) => `${img.src}@${img.style.left}+${img.style.animationDelay}`),
    };
  });
}

test("first-time chatters: NEW tag and colour in both renderers; a highlighted word still wins the colour", () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 10, firstTimeHighlight: true, roleHighlight: true, highlightWords: "giveaway", bubbleShape: "skew" as const };
  const expected = decorShape(render(<CameraChatWidget config={config} messages={FIRST_CHAT.map(asPreview)} />).container.querySelectorAll<HTMLElement>(".obs-chat-message"));
  const label = t("obsLab.nowy");
  assert.deepEqual(expected.map((row) => [row.first, row.role, row.tag]), [["1", "", label], ["1", "", label], ["", "moderator", ""], ["1", "", label], ["", "", ""]]);
  assert.equal(expected[0]!.tint, "rgba(34, 211, 238, 0.14) inset 3px 0 0 #22d3ee");
  assert.equal(expected[0]!.bubble, "rgba(34, 211, 238, 0.14)");
  assert.equal(expected[3]!.tint, "", "the highlighted word keeps its own colour");
  const native = nativeWidget(config);
  try {
    for (const message of FIRST_CHAT) native.send("message", message as unknown as Record<string, unknown>);
    assert.deepEqual(decorShape(native.dom.window.document.querySelectorAll<HTMLElement>(".se-message")), expected);
    assert.match(native.snippets.css, /\.chat-first-tag \{/);
    assert.match(native.snippets.css, /\.se-message::before \{[^}]*skewX\(-10deg\)[^}]*var\(--chat-bubble\)/);
  } finally {
    native.dom.window.close();
  }
  const off = decorShape(render(<CameraChatWidget config={{ ...config, firstTimeHighlight: false }} messages={FIRST_CHAT.map(asPreview)} />).container.querySelectorAll<HTMLElement>(".obs-chat-message"));
  assert.ok(off.every((row) => row.first === "" && row.tag === ""));
  assert.equal(off[1]!.role, "moderator", "without the option a first-time moderator is a moderator again");
});

test("bubble shapes and the emote burst: the same per-row styles in preview and StreamElements", () => {
  for (const bubbleShape of CHAT_BUBBLE_SHAPES) {
    const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 10, bubbleShape, emoteBurst: true, firstTimeHighlight: true, roleHighlight: true, animationDurationMs: 300 };
    const preview = render(<CameraChatWidget config={config} messages={FIRST_CHAT.map(asPreview)} />);
    const expected = decorShape(preview.container.querySelectorAll<HTMLElement>(".obs-chat-message"));
    const plainRow = preview.container.querySelectorAll<HTMLElement>(".obs-chat-message")[4]!;
    preview.unmount();
    assert.deepEqual(expected[0]!.burst, ["12%", "34%", "58%", "80%"].map((left, index) => `${EMOTE_URL}@${left}+${150 + index * 140}ms`));
    assert.deepEqual(expected[1]!.burst, [], "no emote, no burst");
    const native = nativeWidget(config);
    try {
      for (const message of FIRST_CHAT) native.send("message", message as unknown as Record<string, unknown>);
      assert.deepEqual(decorShape(native.dom.window.document.querySelectorAll<HTMLElement>(".se-message")), expected, bubbleShape);
      const css = native.snippets.css;
      const bubble = rgbaCss(config.bubbleColor, config.bubbleOpacity);
      if (bubbleShape === "tail" || bubbleShape === "skew") {
        assert.equal(plainRow.style.getPropertyValue("--chat-bubble"), bubble);
        assert.match(css, new RegExp(`\\.se-message \\{[^}]*--chat-bubble: ${bubble.replace(/[().]/g, "\\$&")};`));
      }
      if (bubbleShape === "outline") {
        assert.equal(plainRow.style.border, "1.5px solid rgba(255, 105, 180, 0.7)");
        assert.equal(plainRow.style.background, "", "outline has no fill");
        assert.match(css, /\.se-message \{[^}]*border-radius: 12px;/);
        assert.doesNotMatch(css, /\.se-message \{[^}]*background: rgba/);
      }
      if (bubbleShape === "underline") assert.equal(plainRow.style.borderBottom, "2px solid rgb(255, 105, 180)");
      if (bubbleShape === "tail") assert.match(css, /\.se-message::before \{[^}]*border-color: var\(--chat-bubble\) transparent/);
      assert.match(css, /@keyframes chat-burst /);
    } finally {
      native.dom.window.close();
    }
  }
  const noEmotes = generateStreamElementsWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, emoteBurst: true, showEmotes: false });
  assert.doesNotMatch(noEmotes.css, /\.chat-burst \{ position|@keyframes chat-burst/);
  assert.match(noEmotes.js, /"emoteBurst":false/);
});

test("the OBS page reads the first-message tag from StreamElements data", () => {
  window.history.replaceState({}, "", "/stream/overlay/camera-chat?source=streamelements&messages=5&firsttime=1");
  const view = render(<CameraChatOverlay />);
  act(() => {
    window.dispatchEvent(new window.MessageEvent("message", { source: window.parent, data: { source: "camera-chat-se", type: "message", payload: { data: FIRST_CHAT[0] } } }));
    window.dispatchEvent(new window.MessageEvent("message", { source: window.parent, data: { source: "camera-chat-se", type: "message", payload: { data: { ...FIRST_CHAT[4], tags: { "first-msg": 1 } } } } }));
  });
  assert.deepEqual(decorShape(view.container.querySelectorAll<HTMLElement>(".obs-chat-message")).map((row) => row.first), ["1", ""], "only the string tag 1 counts");
});

test("a widget with every extra switched on is still standalone and safe", () => {
  const config = { ...CUSTOM, showEmotes: true, headerText: "</script><script>alert(1)</script>", pinnedText: "</style><img src=x>" };
  const snippets = generateStreamElementsWidget(config, "</script>");
  assert.doesNotMatch(snippets.css + snippets.js, /<\/script>|<script>|<\/style>/i);
  assert.doesNotMatch(snippets.html, /<script|<img|<\/style>/i);
  assert.doesNotMatch(snippets.html + snippets.css + snippets.js, FORBIDDEN_IN_SNIPPETS);
  const native = nativeWidget(config);
  try {
    native.send("message", { ...FIRST_CHAT[0], emotes: [] });
    assert.equal(native.dom.window.document.querySelectorAll(".se-message").length, 1);
    assert.equal(native.dom.window.document.querySelector(".chat-header-bar span:last-child")?.textContent, "</script><script>alert(1)</script>".slice(0, 40));
  } finally {
    native.dom.window.close();
  }
});
