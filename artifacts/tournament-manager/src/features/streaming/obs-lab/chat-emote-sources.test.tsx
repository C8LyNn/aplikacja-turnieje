// 7TV, BTTV and FFZ emote lists: parsing the public APIs, zero-width 7TV emotes stacking on the previous emote the same
// way in the preview, the OBS page and the native StreamElements widget, and the channel emotes of the configurator.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { t } from "@/i18n";
import CameraChatOverlay from "./CameraChatOverlay";
import { CameraChatWidget } from "./CameraChatWidget";
import { DEFAULT_CAMERA_CHAT_CONFIG, type CameraChatConfig } from "./camera-chat-settings";
import { CHAT_EMOTE_LAYERS, chatMessageParts, chatRevealPieces, type ChatEmote } from "./chat-message-format";
import {
  SEVENTV_FIRST_WAIT_MS,
  SEVENTV_GLOBAL_URL,
  SEVENTV_GQL_URL,
  SEVENTV_REFRESH_MS,
  bttvEmotes,
  bttvUserUrl,
  createSevenTvCache,
  ffzEmotes,
  ffzRoomUrl,
  loadChannelEmotes,
  mergeEmotes,
  sevenTvEmotes,
  sevenTvUserUrl,
  withSevenTvEmotes,
} from "./chat-emote-sources";
import { generateStreamElementsWidget } from "./stream-elements-widget";

afterEach(cleanup);

const KAPPA_URL = "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0";
const sevenTvUrl = (id: string) => `https://cdn.7tv.app/emote/${id}/2x.webp`;
const sevenTvEntry = (name: string, id: string, zeroWidth = false) => ({
  id,
  name,
  flags: zeroWidth ? 1 : 0,
  data: { id, name, flags: zeroWidth ? 256 : 0, listed: true, host: { url: `//cdn.7tv.app/emote/${id}`, files: [{ name: "1x.webp" }, { name: "2x.webp" }] } },
});
const GLOBAL_SET = { id: "global", emotes: [sevenTvEntry("RainTime", "01RAIN", true), sevenTvEntry("Clap", "01CLAP")] };
const USER_SET = { id: "123", emote_set: { id: "set", emotes: [sevenTvEntry("catJAM", "01CAT"), sevenTvEntry("Hidden7", "01HID")] } };
const KAPPA: ChatEmote = { name: "Kappa", url: KAPPA_URL };
const RAIN: ChatEmote = { name: "RainTime", url: sevenTvUrl("01RAIN"), zeroWidth: true };

type Route = unknown | number | "throw";

/** A fetch that answers from a table: an object is a 200 JSON answer, a number a status, "throw" a network error. */
function fakeFetch(routes: Record<string, Route>) {
  const calls: string[] = [];
  const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push(init?.method === "POST" ? `POST ${url}` : url);
    const answer = routes[url];
    if (answer === "throw") throw new TypeError("Failed to fetch");
    if (answer === undefined) return { ok: false, status: 404, json: async () => ({}) } as Response;
    if (typeof answer === "number") return { ok: answer < 400, status: answer, json: async () => ({}) } as Response;
    return { ok: true, status: 200, json: async () => answer } as Response;
  };
  return { fetcher, calls };
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("7TV, FFZ and BTTV lists: names, CDN images, zero-width flags; hidden, modifiers and foreign hosts stay out", () => {
  assert.deepEqual(sevenTvEmotes(GLOBAL_SET), [RAIN, { name: "Clap", url: sevenTvUrl("01CLAP") }]);
  assert.deepEqual(sevenTvEmotes(USER_SET).map((emote) => emote.name), ["catJAM", "Hidden7"]);
  // Only one of the two flags set still counts; a foreign host or a broken entry is dropped.
  const odd = { emotes: [
    { ...sevenTvEntry("OnlyData", "01A"), flags: 0, data: { ...sevenTvEntry("OnlyData", "01A").data, flags: 256 } },
    { ...sevenTvEntry("Evil", "01E"), data: { host: { url: "//evil.example/emote/1", files: [] } } },
    { name: "NoHost" },
    "nonsense",
  ] };
  assert.deepEqual(sevenTvEmotes(odd), [{ name: "OnlyData", url: sevenTvUrl("01A"), zeroWidth: true }]);
  assert.deepEqual(sevenTvEmotes(null), []);

  const room = { room: { twitch_id: 123 }, sets: { 9: { emoticons: [
    { name: "ffzOne", urls: { 1: "https://cdn.frankerfacez.com/emote/1/1", 2: "https://cdn.frankerfacez.com/emote/1/2" } },
    { name: "ffzOld", urls: { 1: "//cdn.frankerfacez.com/emote/2/1" } },
    { name: "ffzHidden", hidden: true, urls: { 1: "https://cdn.frankerfacez.com/emote/3/1" } },
    { name: "ffzW", modifier: true, urls: { 1: "https://cdn.frankerfacez.com/emote/4/1" } },
    { name: "ffzEvil", urls: { 1: "https://evil.example/e.png" } },
  ] } } };
  assert.deepEqual(ffzEmotes(room), [
    { name: "ffzOne", url: "https://cdn.frankerfacez.com/emote/1/2" },
    { name: "ffzOld", url: "https://cdn.frankerfacez.com/emote/2/1" },
  ]);

  const channel = { channelEmotes: [{ id: "5f1b0186cf6d2144653d2970", code: "bttvOne" }], sharedEmotes: [{ id: "54fa8f1401e468494b85b537", code: "catJAM" }, { id: "../../x", code: "Bad" }] };
  assert.deepEqual(bttvEmotes(channel), [
    { name: "bttvOne", url: "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/2x" },
    { name: "catJAM", url: "https://cdn.betterttv.net/emote/54fa8f1401e468494b85b537/2x" },
  ]);
  assert.deepEqual(bttvEmotes([{ id: "54fa8f1401e468494b85b537", code: ":tf:" }]).map((emote) => emote.name), [":tf:"]);

  // The first list wins a name: the channel's 7TV catJAM, not BTTV's.
  assert.deepEqual(mergeEmotes(sevenTvEmotes(USER_SET), bttvEmotes(channel)).map((emote) => emote.url), [
    sevenTvUrl("01CAT"), sevenTvUrl("01HID"), "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/2x",
  ]);
});

test("a zero-width emote right after an emote sits on top of it; elsewhere it stands on its own", () => {
  const emotes = [KAPPA, RAIN];
  assert.deepEqual(chatMessageParts("Hej Kappa RainTime ok", emotes, true), [
    { kind: "text", text: "Hej " },
    { kind: "emote", name: "Kappa", url: KAPPA_URL, overlays: [{ name: "RainTime", url: RAIN.url }] },
    { kind: "text", text: " ok" },
  ]);
  assert.deepEqual(chatMessageParts("RainTime first", emotes, true), [
    { kind: "emote", name: "RainTime", url: RAIN.url },
    { kind: "text", text: " first" },
  ]);
  assert.deepEqual(chatMessageParts("Kappa x RainTime", emotes, true).map((part) => part.kind), ["emote", "text", "emote"]);
  const many = chatMessageParts(`Kappa${" RainTime".repeat(CHAT_EMOTE_LAYERS + 1)}`, emotes, true);
  assert.equal(many[0]!.kind === "emote" && many[0]!.overlays?.length, CHAT_EMOTE_LAYERS);
  assert.deepEqual(many.slice(1), [{ kind: "text", text: " " }, { kind: "emote", name: "RainTime", url: RAIN.url }]);
  assert.deepEqual(chatMessageParts("Kappa RainTime", emotes, false), [{ kind: "text", text: "Kappa RainTime" }]);
  const reveal = chatRevealPieces(chatMessageParts("a Kappa RainTime", emotes, true), "typewriter", 100);
  assert.deepEqual(reveal?.find((piece) => piece.kind === "emote"), {
    kind: "emote", name: "Kappa", url: KAPPA_URL, overlays: [{ name: "RainTime", url: RAIN.url }], animation: reveal?.find((piece) => piece.kind === "emote")?.animation,
  });
});

test("7TV knowledge: sent emotes keep their image, zero-width ones are marked, unlisted 7TV words are added", () => {
  const sevenTv = new Map(mergeEmotes(sevenTvEmotes(USER_SET), sevenTvEmotes(GLOBAL_SET)).map((emote) => [emote.name, emote]));
  const sent = [KAPPA, { name: "RainTime", url: "https://static-cdn.jtvnw.net/other.png" }];
  assert.deepEqual(withSevenTvEmotes(sent, "Kappa RainTime catJAM hello", sevenTv), [
    KAPPA,
    { name: "RainTime", url: "https://static-cdn.jtvnw.net/other.png", zeroWidth: true },
    { name: "catJAM", url: sevenTvUrl("01CAT") },
  ]);
  assert.deepEqual(withSevenTvEmotes(sent, "Kappa RainTime catJAM", null), sent);
});

test("the OBS page asks 7TV once per channel and again after a while", async () => {
  let now = 1_000;
  const { fetcher, calls } = fakeFetch({ [sevenTvUserUrl("123")]: USER_SET, [SEVENTV_GLOBAL_URL]: GLOBAL_SET });
  const cache = createSevenTvCache(fetcher, () => now);
  assert.equal(cache.get("not-a-number"), null);
  assert.equal(cache.get(""), null);
  assert.deepEqual(calls, []);
  assert.equal(cache.get("123"), null, "nothing until 7TV answers");
  await flush();
  const emotes = cache.get("123");
  assert.deepEqual([...emotes!.keys()], ["catJAM", "Hidden7", "RainTime", "Clap"]);
  assert.equal(emotes!.get("RainTime")!.zeroWidth, true);
  assert.deepEqual(calls, [sevenTvUserUrl("123"), SEVENTV_GLOBAL_URL]);
  now += SEVENTV_REFRESH_MS - 1;
  cache.get("123");
  assert.equal(calls.length, 2);
  now += 2;
  assert.ok(cache.get("123"), "the old list stays while the new one loads");
  assert.equal(calls.length, 4);
});

test("channel emotes for the preview: FFZ finds the channel, 7TV finds the rest, clear answers otherwise", async () => {
  const room = { room: { twitch_id: 123 }, sets: { 9: { emoticons: [{ name: "ffzOne", urls: { 2: "https://cdn.frankerfacez.com/emote/1/2" } }] } } };
  const bttv = { channelEmotes: [{ id: "5f1b0186cf6d2144653d2970", code: "bttvOne" }], sharedEmotes: [{ id: "54fa8f1401e468494b85b537", code: "catJAM" }] };
  const found = fakeFetch({ [ffzRoomUrl("streamer")]: room, [sevenTvUserUrl("123")]: USER_SET, [bttvUserUrl("123")]: bttv, [SEVENTV_GLOBAL_URL]: GLOBAL_SET });
  const result = await loadChannelEmotes(" @Streamer ", found.fetcher);
  assert.ok(typeof result === "object");
  assert.equal(result.login, "streamer");
  assert.equal(result.twitchId, "123");
  assert.deepEqual(result.counts, { sevenTv: 2, bttv: 2, ffz: 1 });
  assert.deepEqual(result.emotes.map((emote) => emote.name), ["catJAM", "Hidden7", "bttvOne", "ffzOne", "RainTime", "Clap"]);
  assert.ok(!found.calls.some((call) => call.startsWith("POST")), "no 7TV search when FFZ knows the channel");

  const search = { data: { users: { search: { items: [
    { mainConnection: { platform: "KICK", platformId: "9", platformUsername: "streamer" } },
    { mainConnection: { platform: "TWITCH", platformId: "456", platformUsername: "Streamer" } },
  ] } } } };
  const viaSevenTv = fakeFetch({ [SEVENTV_GQL_URL]: search, [sevenTvUserUrl("456")]: USER_SET, [SEVENTV_GLOBAL_URL]: GLOBAL_SET });
  const second = await loadChannelEmotes("streamer", viaSevenTv.fetcher);
  assert.ok(typeof second === "object");
  assert.equal(second.twitchId, "456");
  assert.deepEqual(second.counts, { sevenTv: 2, bttv: 0, ffz: 0 });

  assert.equal(await loadChannelEmotes("nobody", fakeFetch({}).fetcher), "not-found");
  assert.equal(await loadChannelEmotes("streamer", fakeFetch({ [ffzRoomUrl("streamer")]: "throw", [SEVENTV_GQL_URL]: "throw" }).fetcher), "error");
  const invalid = fakeFetch({});
  assert.equal(await loadChannelEmotes("bad name!", invalid.fetcher), "not-found");
  assert.deepEqual(invalid.calls, [], "an impossible name asks nobody");
});

// --- the three renderers -------------------------------------------------------------------------------------------

const TEXT = "Hej Kappa RainTime catJAM";
const seMessage = (msgId: string) => ({
  displayName: "Viewer", nick: "viewer", displayColor: "#1E90FF", text: TEXT, msgId, userId: "u1",
  tags: { "room-id": "123" },
  // catJAM is an unlisted 7TV emote StreamElements does not send; the 7TV list adds it.
  emotes: [{ name: "Kappa", urls: { 1: KAPPA_URL } }, { name: "RainTime", urls: { 2: RAIN.url } }],
});

type StackShape = { emotes: string[]; stacks: string[]; overlays: number };

function previewStacks(row: Element): StackShape {
  return {
    emotes: Array.from(row.querySelectorAll<HTMLImageElement>(".obs-chat-emote"), (img) => `${img.alt}@${img.src}`),
    stacks: Array.from(row.querySelectorAll(".obs-chat-emote-stack"), (stack) => Array.from(stack.querySelectorAll("img"), (img) => img.alt).join("+")),
    overlays: row.querySelectorAll(".obs-chat-emote-over").length,
  };
}

function nativeStacks(row: Element): StackShape {
  return {
    emotes: Array.from(row.querySelectorAll<HTMLImageElement>(".se-emote"), (img) => `${img.alt}@${img.src}`),
    stacks: Array.from(row.querySelectorAll(".se-emote-stack"), (stack) => Array.from(stack.querySelectorAll("img"), (img) => img.alt).join("+")),
    overlays: row.querySelectorAll(".se-emote-over").length,
  };
}

function nativeWidget(config: CameraChatConfig, fetcher: (url: string) => Promise<Response>) {
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"));
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  (dom.window as unknown as { fetch: typeof fetcher }).fetch = fetcher;
  // Timers run only when the test says so (the 1.5 s wait for 7TV).
  const timers = new Map<number, { at: number; run: () => void }>();
  let clock = 0;
  let nextTimer = 1;
  dom.window.setTimeout = ((run: () => void, ms = 0) => { const id = nextTimer++; timers.set(id, { at: clock + ms, run }); return id; }) as unknown as typeof dom.window.setTimeout;
  dom.window.clearTimeout = ((id: number) => { timers.delete(id); }) as unknown as typeof dom.window.clearTimeout;
  const advance = (ms: number) => {
    const target = clock + ms;
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      timers.delete(next[0]);
      clock = next[1].at;
      next[1].run();
    }
    clock = target;
  };
  dom.window.eval(snippets.js);
  const event = (listener: string, data: Record<string, unknown>) => dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", { detail: { listener, event: { data } } }));
  const send = (data: Record<string, unknown>) => event("message", data);
  const load = (detail: Record<string, unknown>) => dom.window.dispatchEvent(new dom.window.CustomEvent("onWidgetLoad", { detail }));
  const rows = () => Array.from(dom.window.document.querySelectorAll(".se-message"), nativeStacks);
  return { dom, send, event, load, advance, rows };
}

test("zero-width 7TV emotes stack the same way in the preview and in the StreamElements widget", async () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 10 };
  const { fetcher, calls } = fakeFetch({ [sevenTvUserUrl("123")]: USER_SET, [SEVENTV_GLOBAL_URL]: GLOBAL_SET });
  const native = nativeWidget(config, fetcher);
  try {
    native.send(seMessage("a"));
    assert.equal(native.rows().length, 0, "the first message waits for the channel's first 7TV answer");
    await flush();
    native.send(seMessage("b"));
    const rows = native.rows();
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], rows[1], "the first message stacks like the next ones");
    assert.deepEqual(calls, [sevenTvUserUrl("123"), SEVENTV_GLOBAL_URL]);

    const sevenTv = new Map(mergeEmotes(sevenTvEmotes(USER_SET), sevenTvEmotes(GLOBAL_SET)).map((emote) => [emote.name, emote]));
    const preview = render(<CameraChatWidget config={config} messages={[{
      id: "b", msgId: "b", name: "Viewer", nick: "viewer", color: "#1E90FF", text: TEXT, userId: "u1",
      emotes: withSevenTvEmotes([KAPPA, { name: "RainTime", url: RAIN.url }], TEXT, sevenTv),
    }]} />);
    const expected = Array.from(preview.container.querySelectorAll(".obs-chat-message"), previewStacks);
    assert.deepEqual(expected, [{
      emotes: [`Kappa@${KAPPA_URL}`, `RainTime@${RAIN.url}`, `catJAM@${sevenTvUrl("01CAT")}`],
      stacks: ["Kappa+RainTime"],
      overlays: 1,
    }]);
    assert.deepEqual(rows[1], expected[0]);
  } finally {
    native.dom.window.close();
  }
});

test("without emotes the StreamElements widget asks 7TV nothing; its only addresses are the two 7TV ones", async () => {
  const { fetcher, calls } = fakeFetch({});
  const native = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, showEmotes: false }, fetcher);
  try {
    native.send(seMessage("a"));
    await flush();
    assert.deepEqual(calls, []);
    assert.equal(native.dom.window.document.querySelectorAll(".se-emote").length, 0);
  } finally {
    native.dom.window.close();
  }
  const { html, css, js } = generateStreamElementsWidget(DEFAULT_CAMERA_CHAT_CONFIG);
  const addresses = [...new Set((html + css + js).match(/https?:\/\/[^\s"'`)]+/g) ?? [])].sort();
  assert.deepEqual(addresses, ["https://7tv.io/v3/emote-sets/global", "https://7tv.io/v3/users/twitch/"]);
});

test("StreamElements widget: 7TV is asked at load when SE gives the channel id; a hung 7TV delays messages 1.5 s at most; moderation reaches waiting messages", async () => {
  const config = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 10 };
  const atLoad = fakeFetch({ [sevenTvUserUrl("123")]: USER_SET, [SEVENTV_GLOBAL_URL]: GLOBAL_SET });
  const early = nativeWidget(config, atLoad.fetcher);
  try {
    early.load({ channel: { username: "streamer", providerId: "123" } });
    assert.deepEqual(atLoad.calls, [sevenTvUserUrl("123"), SEVENTV_GLOBAL_URL], "asked before any message");
    await flush();
    early.send(seMessage("a"));
    assert.deepEqual(early.rows().map((row) => row.stacks), [["Kappa+RainTime"]], "the first message shows at once, stacked");
    early.load({ channel: { username: "streamer", providerId: "not-a-number" } });
    assert.equal(atLoad.calls.length, 2, "a strange id asks nobody");
  } finally {
    early.dom.window.close();
  }

  let answer: (value: Response) => void = () => {};
  const hung = (url: string) => (url === SEVENTV_GLOBAL_URL ? new Promise<Response>((resolve) => { answer = resolve; }) : Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response));
  const slow = nativeWidget(config, hung);
  try {
    slow.send(seMessage("a"));
    slow.send(seMessage("a"));
    slow.send({ ...seMessage("gone"), userId: "u9" });
    slow.event("delete-messages", { userId: "u9" });
    slow.advance(1499);
    assert.equal(slow.rows().length, 0, "still waiting for 7TV");
    slow.advance(1);
    assert.deepEqual(slow.rows().map((row) => row.stacks), [[]], "after 1.5 s the message shows without 7TV, once; the removed one never shows");
    answer({ ok: true, status: 200, json: async () => GLOBAL_SET } as Response);
    await flush();
    slow.send(seMessage("b"));
    assert.deepEqual(slow.rows().map((row) => row.stacks), [[], ["Kappa+RainTime"]], "the late answer still helps the next messages");
  } finally {
    slow.dom.window.close();
  }
});

test("the 7TV cache tells when the channel's first answer is in, or gives up after the wait", async () => {
  let release: () => void = () => {};
  const waitForTest = () => new Promise<void>((resolve) => { release = resolve; });
  const quick = createSevenTvCache(fakeFetch({ [sevenTvUserUrl("123")]: USER_SET, [SEVENTV_GLOBAL_URL]: GLOBAL_SET }).fetcher, () => 0, waitForTest);
  let done = false;
  void quick.ready("123", 1500).then(() => { done = true; });
  await flush();
  assert.equal(done, true, "resolved by the answer");
  await quick.ready("123", 1500);
  await quick.ready("abc", 1500);
  let hungDone = false;
  const hung = createSevenTvCache(() => new Promise<Response>(() => {}), () => 0, waitForTest);
  void hung.ready("123", 1500).then(() => { hungDone = true; });
  await flush();
  assert.equal(hungDone, false);
  release();
  await flush();
  assert.equal(hungDone, true, "resolved by the wait");
  assert.equal(SEVENTV_FIRST_WAIT_MS, 1500);
});

test("the OBS page stacks zero-width emotes once 7TV has answered", async () => {
  const original = window.fetch;
  const { fetcher } = fakeFetch({ [sevenTvUserUrl("123")]: USER_SET, [SEVENTV_GLOBAL_URL]: GLOBAL_SET });
  window.fetch = fetcher as typeof window.fetch;
  try {
    window.history.replaceState({}, "", "/stream/overlay/camera-chat?source=streamelements&messages=5");
    const view = render(<CameraChatOverlay />);
    const post = (msgId: string) => act(() => {
      window.dispatchEvent(new window.MessageEvent("message", {
        source: window.parent,
        data: { source: "camera-chat-se", type: "message", payload: { data: seMessage(msgId) } },
      }));
    });
    post("a");
    assert.equal(view.container.querySelectorAll(".obs-chat-message").length, 0, "the first message waits for 7TV");
    await act(async () => { await flush(); });
    post("b");
    const rows = Array.from(view.container.querySelectorAll(".obs-chat-message"), previewStacks);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((row) => row.stacks), [["Kappa+RainTime"], ["Kappa+RainTime"]], "the first message stacks too");
    assert.ok(rows[1]!.emotes.includes(`catJAM@${sevenTvUrl("01CAT")}`), "the unlisted 7TV emote is an image");
  } finally {
    window.fetch = original;
  }
});
