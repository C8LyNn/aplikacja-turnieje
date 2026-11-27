// Chat gadgets and easier setup: the goal bar, hype meter, event confetti and sounds behave the same in the OBS page
// and the native StreamElements widget; seasonal looks and ready-made setups are valid addresses; the settings check
// finds and fixes common problems; the option search narrows the long option list.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { t } from "@/i18n";
import CameraChatOverlay from "./CameraChatOverlay";
import { CameraChatWidget, type MockChatMessage } from "./CameraChatWidget";
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
  CHAT_EVENT_LABELS_EN,
  CHAT_HYPE_WINDOW_MS,
  chatConfettiPieces,
  chatGoalAmount,
  chatGoalProgress,
  chatHypePercent,
} from "./chat-events";
import { CHAT_SOUND_RECIPES, chatSoundGain, resetChatAudio } from "./chat-sound";
import { CHAT_PRESET_IDS } from "./chat-presets";
import {
  CHAT_BEHAVIOUR_FIELDS,
  CHAT_PLACEMENT_FIELDS,
  CHAT_SCENARIO_IDS,
  applyChatPresetKeepingPlacement,
  chatScenarioConfig,
} from "./chat-quick-setup";
import { checkChatSetup, contrastRatio, fixAllChatIssues } from "./chat-setup-check";

afterEach(() => { cleanup(); localStorage.clear(); window.history.replaceState({}, "", "/"); resetChatAudio(); });

const FORBIDDEN_IN_SNIPPETS = /iframe|https?:\/\/(?!7tv\.io\/v3\/)|replit|postMessage|token=|secret=/i;

type Incoming = { listener: string; data: Record<string, unknown> };

const message = (index: number): Incoming => ({
  listener: "message",
  data: { displayName: `viewer${index}`, nick: `viewer${index}`, text: `hello ${index}`, msgId: `g${index}`, userId: `gu${index}` },
});

const SUB_EVENTS: Incoming[] = [
  { listener: "subscriber-latest", data: { name: "LunaPlays", amount: 3, tier: "1000" } },
  { listener: "subscriber-latest", data: { name: "AdaQ", sender: "AdaQ", amount: 5, bulkGifted: true, tier: "1000" } },
  { listener: "subscriber-latest", data: { name: "gift1", sender: "AdaQ", gifted: true, isCommunityGift: true } },
  { listener: "subscriber-latest", data: { name: "Kuba", sender: "Ola", gifted: true, tier: "1000", _id: "s-1" } },
  { listener: "subscriber-latest", data: { name: "Kuba", sender: "Ola", gifted: true, tier: "1000", _id: "s-1" } },
  { listener: "follower-latest", data: { name: "MartaGra" } },
  { listener: "tip-latest", data: { name: "Bartek_TV", amount: 12.5 } },
];

/** Counts the notes played through a fake Web Audio context. */
class FakeAudio {
  static notes = 0;
  currentTime = 0;
  destination = {};
  state = "running";
  createOscillator() {
    FakeAudio.notes += 1;
    const param = { setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined };
    return { type: "", frequency: param, connect: () => undefined, start: () => undefined, stop: () => undefined };
  }
  createGain() {
    return { gain: { setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined }, connect: () => undefined };
  }
}

function nativeWidget(config: CameraChatConfig) {
  const snippets = generateStreamElementsWidget(config, t("obsLab.nowy"), chatEventLabels());
  const dom = new JSDOM(`<!doctype html><html><head><style>${snippets.css}</style></head><body>${snippets.html}</body></html>`, { runScripts: "outside-only" });
  (dom.window as unknown as { AudioContext: typeof FakeAudio }).AudioContext = FakeAudio;
  dom.window.eval(snippets.js);
  const send = ({ listener, data }: Incoming) => dom.window.dispatchEvent(new dom.window.CustomEvent("onEventReceived", {
    detail: { listener, event: listener === "message" ? { data } : data },
  }));
  const load = (detail: Record<string, unknown>) => dom.window.dispatchEvent(new dom.window.CustomEvent("onWidgetLoad", { detail }));
  const document = dom.window.document;
  return { dom, send, load, document, snippets };
}

function obsPage(config: CameraChatConfig) {
  window.history.replaceState({}, "", `/stream/overlay/camera-chat?source=streamelements&${cameraChatConfigToSearch(config)}`);
  const view = render(<CameraChatOverlay />);
  const send = ({ listener, data }: Incoming) => window.dispatchEvent(new window.MessageEvent("message", {
    source: window.parent,
    data: listener === "message"
      ? { source: "camera-chat-se", type: "message", payload: { data } }
      : { source: "camera-chat-se", type: "event", payload: { listener, event: data } },
  }));
  return { view, send, document: view.container };
}

function goalState(root: ParentNode) {
  const box = root.querySelector<HTMLElement>(".chat-goal");
  return box && {
    label: box.querySelector(".chat-goal-label")?.textContent,
    count: box.querySelector(".chat-goal-count")?.textContent,
    width: box.querySelector<HTMLElement>(".chat-goal-fill")?.style.width,
    done: box.getAttribute("data-done") ?? "",
  };
}

function hypeState(root: ParentNode) {
  const box = root.querySelector<HTMLElement>(".chat-hype");
  return box && { width: box.querySelector<HTMLElement>(".chat-hype-fill")?.style.width, hot: box.getAttribute("data-hot") ?? "" };
}

test("goal amounts, progress text and the new address options", () => {
  assert.equal(chatGoalAmount({ kind: "gift", name: "a", sender: "a", amount: 5, bulk: true }, "sub"), 5);
  assert.equal(chatGoalAmount({ kind: "gift", name: "a", sender: "b", amount: 1 }, "sub"), 1);
  assert.equal(chatGoalAmount({ kind: "cheer", name: "a", amount: 300 }, "bits"), 300);
  assert.equal(chatGoalAmount({ kind: "follow", name: "a", amount: 0 }, "sub"), 0);
  const tip = chatGoalProgress({ goalKind: "tip", goalTarget: 100, goalText: "" }, 37.5, CHAT_EVENT_LABELS_EN, "€");
  assert.deepEqual(tip, { label: "Tip goal", text: "€37.50 / €100", percent: 37, done: false });
  assert.deepEqual(chatGoalProgress({ goalKind: "sub", goalTarget: 10, goalText: "Nowa kamerka" }, 12, CHAT_EVENT_LABELS_EN, "$"),
    { label: "Nowa kamerka", text: "12 / 10", percent: 100, done: true });
  assert.equal(chatGoalProgress({ goalKind: "none", goalTarget: 10, goalText: "" }, 1, CHAT_EVENT_LABELS_EN, "$"), null);

  const config: CameraChatConfig = {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    goalKind: "bits", goalTarget: 5000, goalStart: 120, goalText: "Bitsy na pizzę", hypeMeter: true, hypeTarget: 40,
    eventConfetti: true, sound: "all", soundStyle: "chime", soundVolume: 35,
  };
  assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config);
  const old = cameraChatConfigFromSearch("layout=chat");
  assert.deepEqual([old.goalKind, old.hypeMeter, old.eventConfetti, old.sound], ["none", false, false, "none"], "old addresses stay quiet");
  const bad = cameraChatConfigFromSearch("goal=coins&goaltarget=0&goalstart=-4&hypemax=9999&sound=loud&soundstyle=x&soundvol=300");
  assert.deepEqual([bad.goalKind, bad.goalTarget, bad.goalStart, bad.hypeTarget, bad.sound, bad.soundStyle, bad.soundVolume],
    ["none", 1, 0, 200, "none", "ding", 100]);
});

test("the goal bar counts the same in the OBS page and the native widget, even with event rows off", () => {
  const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, maxMessages: 10, goalKind: "sub", goalTarget: 10, goalStart: 2 };
  const native = nativeWidget(config);
  const page = obsPage(config);
  try {
    assert.deepEqual(goalState(native.document), goalState(page.document));
    assert.deepEqual(goalState(page.document), { label: t("obsLab.cel_subow"), count: "2 / 10", width: "20%", done: "" });
    act(() => { for (const item of SUB_EVENTS) page.send(item); });
    for (const item of SUB_EVENTS) native.send(item);
    assert.deepEqual(goalState(native.document), goalState(page.document));
    assert.deepEqual(goalState(page.document), { label: t("obsLab.cel_subow"), count: "9 / 10", width: "90%", done: "" },
      "a sub, a bomb of five and one gift; the repeated gift and the single subs of the bomb do not count twice");
    assert.equal(native.document.querySelectorAll(".chat-event").length, 0, "no event rows");
    act(() => { page.send(SUB_EVENTS[0]!); });
    native.send(SUB_EVENTS[0]!);
    assert.deepEqual(goalState(native.document), goalState(page.document));
    assert.equal(goalState(page.document)?.done, "1");
  } finally {
    native.dom.window.close();
  }
});

test("the native widget starts the goal from the StreamElements session counter and formats tip goals", () => {
  const subs = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, goalKind: "sub", goalTarget: 20, goalStart: 1 });
  const tips = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, goalKind: "tip", goalTarget: 200, goalText: "<b>Kamerka</b>" });
  try {
    subs.load({ session: { data: { "subscriber-session": { count: 6 }, "tip-session": { amount: 99 } } } });
    assert.equal(goalState(subs.document)?.count, "7 / 20");
    subs.load({ session: { data: { "subscriber-session": { count: "lots" } } } });
    assert.equal(goalState(subs.document)?.count, "7 / 20", "a bad counter is ignored");
    tips.load({ currency: { symbol: "€" }, session: { data: { "tip-session": { amount: 50 } } } });
    tips.send(SUB_EVENTS[6]!);
    assert.deepEqual(goalState(tips.document), { label: "<b>Kamerka</b>", count: "€62.50 / €200", width: "31%", done: "" });
    assert.equal(tips.document.querySelectorAll(".chat-goal b").length, 0, "the title is text");
  } finally {
    subs.dom.window.close();
    tips.dom.window.close();
  }
});

test("the hype meter fills from shown messages and events in both renderers", () => {
  assert.equal(chatHypePercent([{ at: 0, weight: 1 }, { at: 1000, weight: 5 }], 2000, 12), 50);
  assert.equal(chatHypePercent([{ at: 0, weight: 1 }], CHAT_HYPE_WINDOW_MS, 1), 0, "older than the window");
  assert.equal(chatHypePercent(Array.from({ length: 50 }, (_, index) => ({ at: index, weight: 1 })), 100, 20), 100);

  const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, hypeMeter: true, hypeTarget: 20, streamEvents: true, hideCommands: true };
  const native = nativeWidget(config);
  const page = obsPage(config);
  try {
    assert.deepEqual(hypeState(page.document), { width: "0%", hot: "" });
    const burst = [...Array.from({ length: 10 }, (_, index) => message(index)), { listener: "message", data: { displayName: "x", text: "!cmd", msgId: "cmd" } }];
    act(() => { for (const item of burst) page.send(item); });
    for (const item of burst) native.send(item);
    assert.deepEqual(hypeState(native.document), hypeState(page.document));
    assert.deepEqual(hypeState(page.document), { width: "50%", hot: "" }, "a hidden command does not count");
    act(() => { page.send(SUB_EVENTS[5]!); page.send(SUB_EVENTS[6]!); });
    native.send(SUB_EVENTS[5]!);
    native.send(SUB_EVENTS[6]!);
    assert.deepEqual(hypeState(native.document), hypeState(page.document));
    assert.deepEqual(hypeState(page.document), { width: "100%", hot: "1" });
  } finally {
    native.dom.window.close();
  }
});

test("event confetti is the same burst in both renderers and stays out of reduced motion", () => {
  const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, streamEvents: true, eventConfetti: true };
  const native = nativeWidget(config);
  const page = obsPage(config);
  try {
    act(() => { page.send(SUB_EVENTS[5]!); });
    native.send(SUB_EVENTS[5]!);
    const pieces = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>(".chat-event .chat-confetti"))
      .map((piece) => [piece.style.getPropertyValue("--x"), piece.style.getPropertyValue("--y"), piece.style.getPropertyValue("--d"), piece.style.background]);
    assert.equal(pieces(page.document).length, chatConfettiPieces().length);
    assert.deepEqual(pieces(native.document), pieces(page.document));
    assert.match(native.snippets.css, /prefers-reduced-motion: reduce\) \{[^}]*\} \.chat-confetti \{ display: none; \}/);
  } finally {
    native.dom.window.close();
  }
  const off = nativeWidget({ ...config, eventConfetti: false });
  try {
    off.send(SUB_EVENTS[5]!);
    assert.equal(off.document.querySelectorAll(".chat-confetti").length, 0);
  } finally {
    off.dom.window.close();
  }
});

test("sounds play for new events (and messages when asked), never for history, never at volume 0", () => {
  assert.equal(chatSoundGain(0), 0);
  assert.ok(chatSoundGain(100) <= 0.35);
  FakeAudio.notes = 0;
  const events = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, streamEvents: true, sound: "events", soundStyle: "arcade" });
  const all = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, sound: "all" });
  const silent = nativeWidget({ ...DEFAULT_CAMERA_CHAT_CONFIG, streamEvents: true, sound: "events", soundVolume: 0 });
  try {
    events.send(message(1));
    assert.equal(FakeAudio.notes, 0, "messages are quiet in events mode");
    events.send(SUB_EVENTS[5]!);
    assert.equal(FakeAudio.notes, CHAT_SOUND_RECIPES.arcade.length);
    FakeAudio.notes = 0;
    all.send(message(2));
    all.send(message(3));
    assert.equal(FakeAudio.notes, CHAT_SOUND_RECIPES.tick.length, "a flood ticks once per moment");
    FakeAudio.notes = 0;
    silent.send(SUB_EVENTS[5]!);
    assert.equal(FakeAudio.notes, 0);
  } finally {
    events.dom.window.close();
    all.dom.window.close();
    silent.dom.window.close();
  }

  FakeAudio.notes = 0;
  (window as unknown as { AudioContext?: typeof FakeAudio }).AudioContext = FakeAudio;
  const config: CameraChatConfig = { ...DEFAULT_CAMERA_CHAT_CONFIG, streamEvents: true, sound: "events" };
  const history: MockChatMessage[] = [{ id: "old", name: "Old", text: "from before", event: { kind: "follow", name: "Old", amount: 0 }, receivedAt: Date.now() }];
  const view = render(<CameraChatWidget config={config} messages={history} />);
  assert.equal(FakeAudio.notes, 0, "rows on screen at the start make no sound");
  view.rerender(<CameraChatWidget config={config} messages={[...history, { id: "new", name: "New", text: "", event: { kind: "raid", name: "New", amount: 9 }, receivedAt: Date.now() }]} />);
  assert.equal(FakeAudio.notes, CHAT_SOUND_RECIPES.ding.length);
  delete (window as unknown as { AudioContext?: typeof FakeAudio }).AudioContext;
});

test("seasonal looks and ready-made setups are valid; a style keeps placement and behaviour", () => {
  for (const preset of ["winter", "christmas", "halloween", "valentine"] as const) assert.ok(CHAT_PRESET_IDS.includes(preset));
  const own: CameraChatConfig = {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    layout: "chat", ignoredUsers: "mybot", highlightWords: "giveaway", streamEvents: true, goalKind: "tip", sound: "events", floodLimit: 3,
  };
  const styled = applyChatPresetKeepingPlacement(own, "christmas");
  for (const field of [...CHAT_PLACEMENT_FIELDS, ...CHAT_BEHAVIOUR_FIELDS]) assert.deepEqual(styled[field], own[field], field);
  assert.equal(styled.ambient, "snow");

  for (const scenario of CHAT_SCENARIO_IDS) {
    const config = chatScenarioConfig(scenario, own, "Live");
    assert.deepEqual(cameraChatConfigFromSearch(cameraChatConfigToSearch(config)), config, scenario);
    assert.deepEqual([config.ignoredUsers, config.highlightWords], ["mybot", "giveaway"], `${scenario} keeps own lists`);
    const snippets = generateStreamElementsWidget(config);
    assert.doesNotMatch(snippets.html + snippets.css + snippets.js, FORBIDDEN_IN_SNIPPETS, scenario);
  }
  assert.match(chatScenarioConfig("gaming", DEFAULT_CAMERA_CHAT_CONFIG, "Live").ignoredUsers, /nightbot/, "an empty bot list gets the usual bots");
  assert.equal(chatScenarioConfig("talk", DEFAULT_CAMERA_CHAT_CONFIG, "Live").headerText, "Live");
});

test("the settings check finds common problems and every fix clears them", () => {
  assert.ok(contrastRatio("#ffffff", "#000000") > 20);
  const broken: CameraChatConfig = {
    ...DEFAULT_CAMERA_CHAT_CONFIG,
    panelColor: "#202020", panelOpacity: 90, panelGradient: false, messageBackground: false, textColor: "#333333",
    fontSize: "custom", fontSizePx: 10, headerStyle: "bar", headerText: "  ", headerLive: false,
    streamEvents: false, eventConfetti: true, messageLifetime: 3, sound: "events", soundVolume: 0,
    goalKind: "sub", goalStart: 12, goalTarget: 10, layout: "overlay", chatWidth: 60, ignoredUsers: "",
  };
  const issues = checkChatSetup(broken, "Live");
  assert.deepEqual(issues.map((issue) => issue.id), ["contrast", "tinyText", "emptyHeader", "confettiNoEvents", "shortLifetime", "soundSilent", "goalDone", "bots"]);
  const fixed = fixAllChatIssues(broken, issues);
  assert.deepEqual(checkChatSetup(fixed, "Live"), []);
  assert.deepEqual([fixed.textColor, fixed.headerText, fixed.streamEvents, fixed.goalTarget], ["#ffffff", "Live", true, 24]);
  const seeThrough = { ...DEFAULT_CAMERA_CHAT_CONFIG, panelOpacity: 10, messageBackground: false, textShadow: "none" as const, ignoredUsers: "x" };
  assert.deepEqual(checkChatSetup(seeThrough, "Live").map((issue) => issue.id), ["transparent"]);
  const cover = { ...DEFAULT_CAMERA_CHAT_CONFIG, layout: "overlay" as const, chatWidth: 55, ignoredUsers: "x" };
  assert.deepEqual(checkChatSetup(cover, "Live").map((issue) => [issue.id, issue.level]), [["coverCamera", "tip"]]);
  const none = checkChatSetup({ ...DEFAULT_CAMERA_CHAT_CONFIG, streamEvents: true, eventKinds: [], ignoredUsers: "x" }, "Live");
  assert.deepEqual(none.map((issue) => issue.id), ["noEventKinds"]);
});

test("the configurator: a ready setup in one click, a fix from the check, the goal moves, the search narrows options", () => {
  const view = render(<ObsLab />);
  fireEvent.click(view.getByText("Camera + Chat Overlay"));
  const stored = () => cameraChatConfigFromSearch(localStorage.getItem("tm_obs_camera_chat_config") ?? "");
  assert.ok(view.getByTestId("chat-check-fix-bots"), "the check suggests hiding bots");
  act(() => { fireEvent.click(view.getByTestId("chat-check-fix-bots")); });
  assert.match(stored().ignoredUsers, /nightbot/);
  assert.equal(view.queryByTestId("chat-check-fix-bots"), null);

  act(() => { fireEvent.click(view.getByTestId("quick-scenario-talk")); });
  assert.deepEqual([stored().layout, stored().hypeMeter, stored().eventConfetti, stored().headerText], ["right", true, true, t("obsLab.czat_na_zywo")]);
  assert.ok(view.container.querySelector(".chat-hype"));

  act(() => { fireEvent.click(view.getByTestId("quick-extra-goal")); });
  assert.equal(view.container.querySelector(".chat-goal-count")?.textContent, "0 / 10");
  act(() => { fireEvent.click(view.getByTestId("chat-test-event-gift")); });
  assert.equal(view.container.querySelector(".chat-goal-count")?.textContent, "5 / 10", "a test gift bomb of five moves the goal");
  assert.equal(view.container.querySelectorAll(".chat-event-gift .chat-confetti").length, chatConfettiPieces().length);

  act(() => { fireEvent.click(view.getByText(view.getByTestId("chat-setup-mode").querySelectorAll("button")[1]!.textContent!)); });
  const search = view.getByTestId("chat-option-search") as HTMLInputElement;
  const sections = () => Array.from(view.getByTestId("chat-all-options").querySelectorAll("details"));
  act(() => { fireEvent.change(search, { target: { value: "dźwięk" } }); });
  const shown = sections().filter((details) => !details.hidden);
  assert.ok(shown.length >= 1 && shown.length < sections().length, "only matching sections stay");
  assert.ok(shown.some((details) => details.textContent?.includes(t("obsLab.cel_hype_i_dzwieki")) && details.open), "the match opens");
  act(() => { fireEvent.change(search, { target: { value: "qqqzzz" } }); });
  assert.ok(view.getByText(t("obsLab.brak_takiej_opcji")));
  act(() => { fireEvent.change(search, { target: { value: "" } }); });
  assert.equal(sections().filter((details) => details.hidden).length, 0, "clearing shows everything again");
  assert.equal(sections().filter((details) => details.open).length, 2, "and closes what the search opened");
});
