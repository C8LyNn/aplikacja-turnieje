// Stream events in the chat, replies, the channel-points highlight and calm chat: StreamElements data is read the
// same way by the OBS page and the native widget, both draw the same rows, names stay text, and floods are paced.
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
  DEFAULT_CAMERA_CHAT_CONFIG,
  cameraChatConfigFromSearch,
  cameraChatConfigToSearch,
} from "./camera-chat-settings";
import {
  CHAT_EVENT_KINDS,
  CHAT_EVENT_LABELS_EN,
  CHAT_EVENT_STYLES,
  CHAT_PACE_QUEUE_MAX,
  ChatPacer,
  chatEventFromStreamElements,
  chatEventTitleParts,
  chatReplyFromTags,
  formatChatTip,
  stripCheermotes,
} from "./chat-events";

afterEach(() => { cleanup(); localStorage.clear(); window.history.replaceState({}, "", "/"); });

const FORBIDDEN_IN_SNIPPETS = /iframe|https?:\/\/|replit|postMessage|token=|secret=/i;

type Incoming = { listener: string; data: Record<string, unknown> };

/** One stream as StreamElements sends it: chat messages and events (the subs of a gift bomb arrive one by one). */
const STREAM: Incoming[] = [
  { listener: "message", data: { displayName: "NightOwl", nick: "nightowl", text: "hello there", msgId: "m1", userId: "u1", displayColor: "#1E90FF" } },
  { listener: "follower-latest", data: { name: "MartaGra" } },
  { listener: "subscriber-latest", data: { name: "LunaPlays", amount: 6, tier: "2000", message: "six months!" } },
  { listener: "subscriber-latest", data: { name: "AdaQ", sender: "AdaQ", amount: 5, bulkGifted: true, tier: "1000" } },
  { listener: "subscriber-latest", data: { name: "gift1", sender: "AdaQ", gifted: true, isCommunityGift: true, tier: "1000" } },
  { listener: "subscriber-latest", data: { name: "gift2", sender: "AdaQ", gifted: true, isCommunityGift: true, tier: "1000" } },
  { listener: "subscriber-latest", data: { name: "Kuba", sender: "Ola", gifted: true, tier: "3000" } },
  { listener: "cheer-latest", data: { name: "frostbyte", amount: 500, message: "Cheer100 GG Cheer400" } },
  { listener: "cheer-latest", data: { name: "tiny", amount: 5, message: "Cheer5" } },
  { listener: "raid-latest", data: { name: "KubaGG", amount: 42 } },
  { listener: "tip-latest", data: { name: "Bartek_TV", amount: 25.5, message: "for the cam", _id: "tip-1" } },
  { listener: "tip-latest", data: { name: "Bartek_TV", amount: 25.5, message: "for the cam", _id: "tip-1" } },
  {
    listener: "message",
    data: {
      displayName: "LunaPlays", nick: "lunaplays", text: "@NightOwl me too", msgId: "m2", userId: "u2",
      tags: { "reply-parent-display-name": "NightOwl", "reply-parent-msg-body": "hello\\sthere" },
    },
  },
  { listener: "message", data: { displayName: "PixelMaja", nick: "pixelmaja", text: "look at me", msgId: "m3", userId: "u3", tags: { "msg-id": "highlighted-message" } } },
  { listener: "follower-latest", data: { name: "<img src=x onerror=alert(1)>" } },
  { listener: "host-latest", data: { name: "old event" } },
];

const EVENTS_CONFIG: CameraChatConfig = {
  ...DEFAULT_CAMERA_CHAT_CONFIG,
  maxMessages: 20,
  streamEvents: true,
  eventMinBits: 10,
  pointsHighlight: true,
  showReplies: true,
};

function nativeWidget(config: CameraChatConfig) {
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"), chatEventLabels());
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  const timers: Array<{ at: number; run: () => void }> = [];
  let clock = 0;
  dom.window.setTimeout = ((run: () => void, ms: number) => { timers.push({ at: clock + ms, run }); return timers.length; }) as unknown as typeof dom.window.setTimeout;
  dom.window.eval(snippets.js);
  // Chat messages carry their fields under "data"; other events are the event object itself.
  const send = ({ listener, data }: Incoming) => dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", {
    detail: { listener, event: listener === "message" || listener.startsWith("delete-") ? { data } : data },
  }));
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
  const rows = () => Array.from(dom.window.document.querySelectorAll<HTMLElement>(".se-message"));
  return { dom, send, advance, rows, snippets };
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
  const rows = () => Array.from(view.container.querySelectorAll<HTMLElement>(".obs-chat-message"));
  return { view, send, rows };
}

function describe(rows: HTMLElement[]) {
  return rows.map((row) => {
    const event = row.dataset["event"] ?? "";
    return {
      event,
      classes: Array.from(row.classList).filter((name) => name.startsWith("chat-event")).sort().join(" "),
      icon: row.querySelector(".chat-event-icon")?.textContent ?? "",
      title: row.querySelector(".chat-event-title")?.textContent ?? "",
      strong: Array.from(row.querySelectorAll(".chat-event-name")).map((name) => name.textContent).join("|"),
      tag: row.querySelector(".chat-event-tag")?.textContent ?? "",
      said: row.querySelector(".chat-event-text")?.textContent ?? "",
      reply: row.querySelector(".chat-reply")?.textContent ?? "",
      text: event ? "" : row.querySelector(".obs-chat-text, .se-text")?.textContent ?? "",
      points: row.dataset["points"] ?? "",
      tint: row.dataset["points"] ? row.style.background : "",
      images: row.querySelectorAll("img").length,
    };
  });
}

test("StreamElements events are read once each: gift bombs, cheermotes, tiers and bad data", () => {
  const read = (index: number) => chatEventFromStreamElements(STREAM[index]!.listener, STREAM[index]!.data);
  assert.deepEqual(read(1)?.event, { kind: "follow", name: "MartaGra", amount: 0 });
  assert.deepEqual(read(2), { event: { kind: "sub", name: "LunaPlays", amount: 6, tier: "2000" }, text: "six months!", id: "" });
  assert.deepEqual(read(3)?.event, { kind: "gift", name: "AdaQ", sender: "AdaQ", amount: 5, bulk: true, tier: "1000" });
  assert.equal(read(4), null, "each sub of a gift bomb is not a row of its own");
  assert.deepEqual(read(6)?.event, { kind: "gift", name: "Kuba", sender: "Ola", amount: 1, tier: "3000" });
  assert.equal(read(7)?.text, "GG", "cheermotes are removed from the cheer message");
  assert.equal(read(10)?.id, "tip-1");
  assert.equal(chatEventFromStreamElements("host-latest", { name: "x" }), null);
  assert.equal(chatEventFromStreamElements("follower-latest", { name: "   " }), null);
  assert.equal(chatEventFromStreamElements("follower-latest", null), null);
  const odd = chatEventFromStreamElements("tip-latest", { name: `a${String.fromCharCode(0x202e)}b${String.fromCharCode(0)}c`, amount: "-3", message: "x".repeat(900) });
  assert.equal(odd?.event.name, "a b c", "control and bidi characters become spaces");
  assert.equal(odd?.event.amount, 0);
  assert.equal(odd?.text.length, 300);
  assert.equal(stripCheermotes("Cheer100 nice Kappa50 cheers2you"), "nice cheers2you");
});

test("event titles fill the template; tips are formatted with the channel currency", () => {
  assert.equal(formatChatTip(25, "zł"), "25 zł");
  assert.equal(formatChatTip(25.5, "€"), "€25.50");
  assert.equal(formatChatTip(10, ""), "10");
  const parts = chatEventTitleParts({ kind: "gift", name: "Kuba", sender: "Ola", amount: 1 }, CHAT_EVENT_LABELS_EN, "$");
  assert.deepEqual(parts, [{ text: "Ola", strong: true }, { text: " gifted a sub to " }, { text: "Kuba", strong: true }, { text: "!" }]);
  const resub = chatEventTitleParts({ kind: "sub", name: "Luna", amount: 6 }, CHAT_EVENT_LABELS_EN, "$");
  assert.equal(resub.map((part) => part.text).join(""), "Luna subscribed for 6 months!");
  const odd = chatEventTitleParts({ kind: "follow", name: "x", amount: 0 }, { ...CHAT_EVENT_LABELS_EN, follow: "constructor {name} toString" }, "$");
  assert.deepEqual(odd, [{ text: "constructor " }, { text: "x", strong: true }, { text: " toString" }]);
  assert.deepEqual(chatReplyFromTags({ "reply-parent-user-login": "luna", "reply-parent-msg-body": "a\\sb\\:c" }), { name: "luna", text: "a b;c" });
  assert.equal(chatReplyFromTags({ "reply-parent-display-name": "x", "reply-parent-msg-body": "y".repeat(100) })?.text.length, 61);
  assert.equal(chatReplyFromTags({}), null);
});

test("the new options reach the address, are bounded, and old addresses keep events off", () => {
  const config: CameraChatConfig = { ...EVENTS_CONFIG, eventKinds: ["sub", "raid"], eventStyle: "glow", floodLimit: 4 };
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config);
  const old = cameraChatConfigFromSearch("layout=chat&messages=6");
  assert.deepEqual([old.streamEvents, old.eventKinds, old.pointsHighlight, old.showReplies, old.floodLimit], [false, [...CHAT_EVENT_KINDS], false, false, 0]);
  const bad = cameraChatConfigFromSearch("events=1&eventkinds=raid,%3Cscript%3E,follow,raid&eventstyle=neon&eventbits=-5&flood=999");
  assert.deepEqual(bad.eventKinds, ["follow", "raid"], "known kinds only, in their fixed order");
  assert.deepEqual([bad.eventStyle, bad.eventMinBits, bad.floodLimit], ["banner", 1, 20]);
  assert.deepEqual(cameraChatConfigFromSearch("events=1&eventkinds=").eventKinds, [], "an empty list means no events");
});

for (const eventStyle of CHAT_EVENT_STYLES) {
  test(`the OBS page and the native widget draw the same rows (${eventStyle} events)`, () => {
    const config = { ...EVENTS_CONFIG, eventStyle };
    const native = nativeWidget(config);
    const page = obsPage(config);
    try {
      act(() => { for (const item of STREAM) page.send(item); });
      for (const item of STREAM) native.send(item);
      const react = describe(page.rows());
      assert.deepEqual(describe(native.rows()), react);
      assert.deepEqual(react.map((row) => row.event), ["", "follow", "sub", "gift", "gift", "cheer", "raid", "tip", "", "", "follow"]);
      const tip = react[7]!;
      assert.equal(tip.title, t("obsLab.zdarzenie_napiwek").replace("{name}", "Bartek_TV").replace("{amount}", "25.50 zł"));
      assert.deepEqual([tip.icon, tip.said, tip.classes], ["✪", "for the cam", `chat-event chat-event-${eventStyle} chat-event-tip`]);
      assert.deepEqual([react[2]!.tag, react[3]!.tag, react[4]!.tag], ["T2", "", "T3"]);
      assert.equal(react[5]!.said, "GG");
      assert.deepEqual([react[8]!.reply, react[8]!.text], ["↪ @NightOwl: hello there", "me too"]);
      assert.deepEqual([react[9]!.points, react[9]!.tint], ["1", "rgba(169, 112, 255, 0.14)"]);
      assert.equal(react[10]!.strong, "<img src=x onerror=alert(1)>", "a name is text");
      assert.equal(react.reduce((sum, row) => sum + row.images, 0), 0);
    } finally {
      native.dom.window.close();
    }
  });
}

test("picked kinds and the bits minimum filter events the same way in both renderers", () => {
  const config: CameraChatConfig = { ...EVENTS_CONFIG, eventKinds: ["cheer", "raid"], eventMinBits: 1, pointsHighlight: false, showReplies: false };
  const native = nativeWidget(config);
  const page = obsPage(config);
  try {
    act(() => { for (const item of STREAM) page.send(item); });
    for (const item of STREAM) native.send(item);
    const react = describe(page.rows());
    assert.deepEqual(describe(native.rows()), react);
    assert.deepEqual(react.filter((row) => row.event).map((row) => row.event), ["cheer", "cheer", "raid"]);
    assert.deepEqual([react.at(-2)!.reply, react.at(-2)!.text, react.at(-1)!.points], ["", "@NightOwl me too", ""], "replies and points off");
  } finally {
    native.dom.window.close();
  }
});

test("the native widget takes the tip currency from the channel and keeps events off by default", () => {
  const native = nativeWidget(EVENTS_CONFIG);
  const plain = nativeWidget(DEFAULT_CAMERA_CHAT_CONFIG);
  try {
    native.dom.window.dispatchEvent(new native.dom.window.CustomEvent("onWidgetLoad", { detail: { currency: { code: "EUR", symbol: "€" } } }));
    native.send(STREAM[10]!);
    assert.match(native.rows()[0]!.querySelector(".chat-event-title")!.textContent!, /€25\.50/);
    for (const item of STREAM) plain.send(item);
    assert.equal(plain.rows().filter((row) => row.dataset["event"]).length, 0);
    assert.equal(plain.rows().length, 3);
  } finally {
    native.dom.window.close();
    plain.dom.window.close();
  }
});

test("calm chat paces a flood, drops the oldest waiting message when full, and lets events through", () => {
  let now = 0;
  const timers: Array<{ at: number; run: () => void }> = [];
  const clock = {
    now: () => now,
    set: (run: () => void, ms: number) => { const timer = { at: now + ms, run }; timers.push(timer); return timer; },
    clear: (timer: unknown) => { timers.splice(timers.indexOf(timer as never), 1); },
  };
  const advance = (ms: number) => {
    const target = now + ms;
    for (;;) {
      const next = timers.filter((timer) => timer.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      timers.splice(timers.indexOf(next), 1);
      now = next.at;
      next.run();
    }
    now = target;
  };
  const shown: number[] = [];
  const pacer = new ChatPacer<number>(250, (item) => shown.push(item), clock);
  for (let item = 1; item <= CHAT_PACE_QUEUE_MAX + 2; item++) pacer.push(item);
  assert.deepEqual(shown, [1], "the first message shows at once");
  assert.equal(pacer.waiting, CHAT_PACE_QUEUE_MAX, "the oldest waiting message is dropped when the queue is full");
  pacer.remove((item) => item === 4);
  advance(750);
  assert.deepEqual(shown, [1, 3, 5, 6], "a moderated message never shows");
  advance(10_000);
  assert.equal(shown.at(-1), CHAT_PACE_QUEUE_MAX + 2);
  advance(1000);
  pacer.push(99);
  assert.equal(shown.at(-1), 99, "after a quiet moment a message shows at once");
  const off = new ChatPacer<number>(0, (item) => shown.push(item), clock);
  off.push(7);
  assert.equal(shown.at(-1), 7);

  const native = nativeWidget({ ...EVENTS_CONFIG, floodLimit: 2 });
  try {
    for (let index = 1; index <= 5; index++) {
      native.send({ listener: "message", data: { displayName: `viewer${index}`, text: `flood ${index}`, msgId: `f${index}`, userId: `fu${index}` } });
    }
    assert.equal(native.rows().length, 1);
    native.send(STREAM[9]!);
    assert.equal(native.rows().length, 2, "a raid does not wait behind the flood");
    native.send({ listener: "delete-message", data: { msgId: "f3" } });
    native.advance(500);
    native.advance(500);
    native.advance(500);
    native.advance(500);
    assert.deepEqual(native.rows().map((row) => row.dataset["event"] || row.querySelector(".se-text")?.textContent),
      ["flood 1", "raid", "flood 2", "flood 4", "flood 5"]);
  } finally {
    native.dom.window.close();
  }
});

test("an export with events, replies and calm chat is still standalone and safe", () => {
  const labels = { ...chatEventLabels(), follow: "</script><script>alert(1)</script>{name}" };
  const snippets = generateStreamElementsWidget({ ...EVENTS_CONFIG, floodLimit: 5 }, "NEW", labels);
  assert.doesNotMatch(snippets.css + snippets.js, /<\/script>|<script>|<\/style>/i);
  assert.doesNotMatch(snippets.html + snippets.css + snippets.js, FORBIDDEN_IN_SNIPPETS);
  assert.match(snippets.js, /"follower-latest":"follow"/);
  assert.match(snippets.css, /@media \(prefers-reduced-motion: reduce\) \{ \.se-message\.chat-event::after/);
  assert.match(snippets.css, /\.se-message\.chat-event \{[^}]*flex-shrink: 0;/, "an event row never shrinks when the list is squeezed under a header");
  const dom = new JSDOM(`<!doctype html><body>${snippets.html}</body>`, { runScripts: "outside-only" });
  try {
    dom.window.eval(snippets.js);
    dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: { listener: "follower-latest", event: { name: "Ola" } } }));
    const title = dom.window.document.querySelector(".chat-event-title");
    assert.equal(title?.textContent, "</script><script>alert(1)</script>Ola");
    assert.equal(dom.window.document.querySelectorAll("script").length, 0);
  } finally {
    dom.window.close();
  }
});

test("the configurator sends test events, switching events on, and the flood test fills the preview", () => {
  const view = render(<ObsLab />);
  fireEvent.click(view.getByText("Camera + Chat Overlay"));
  act(() => { fireEvent.click(view.getByTestId("chat-test-event-raid")); });
  const stored = () => cameraChatConfigFromSearch(localStorage.getItem("tm_obs_camera_chat_config") ?? "");
  assert.equal(stored().streamEvents, true, "a test event switches events on");
  assert.ok(view.container.querySelector(".obs-chat-message.chat-event-raid"), "the raid row is in the preview");
  act(() => { fireEvent.click(view.getByTestId("quick-extra-events")); });
  assert.equal(stored().streamEvents, false);
  assert.equal(view.container.querySelector(".chat-event-raid"), null, "switching events off hides event rows");
  act(() => { fireEvent.click(view.getByTestId("chat-test-flood")); });
  const texts = Array.from(view.container.querySelectorAll(".obs-chat-text")).map((node) => node.textContent ?? "");
  assert.ok(texts.some((text) => text.startsWith(t("obsLab.zalew_wiadomosc", { n: 20 }))), "without calm chat the whole flood shows at once");
  act(() => { fireEvent.click(view.getByTestId("quick-extra-calm")); });
  assert.equal(stored().floodLimit, 3);
  act(() => { fireEvent.click(view.getByTestId("chat-test-plain")); });
  act(() => { fireEvent.click(view.getByTestId("chat-test-mod")); });
  const last = Array.from(view.container.querySelectorAll(".obs-chat-text")).at(-1)?.textContent ?? "";
  assert.equal(last, t("obsLab.czesc_jak_leci"), "with calm chat the second quick message waits");
});
