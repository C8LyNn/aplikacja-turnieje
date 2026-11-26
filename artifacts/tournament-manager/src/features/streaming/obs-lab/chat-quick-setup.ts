/**
 * Logic behind the quick setup of the chat configurator: a style that keeps the chosen placement, one-click extras,
 * a random look and the undo / redo history. Pure functions, so the configurator and the tests share them.
 */
import { type CameraChatConfig, COMMON_CHAT_BOTS } from "./camera-chat-settings";
import { CHAT_EVENT_KINDS } from "./chat-events";
import { CHAT_COLOR_THEME_IDS, CHAT_PRESET_IDS, type ChatPresetId, applyChatColorTheme, chatPresetConfig } from "./chat-presets";

/** Where the chat sits and how big the scene is: chosen in step 1, never changed by a style. */
export const CHAT_PLACEMENT_FIELDS = [
  "layout",
  "aspectRatio",
  "cameraWidth",
  "chatWidth",
  "belowHeight",
  "chatOnlyWidth",
  "chatOnlyHeight",
  "overlayPosition",
  "overlayInset",
  "gap",
  "fitChatHeight",
] as const satisfies ReadonlyArray<keyof CameraChatConfig>;

/** What the chat does rather than how it looks (filters, texts, events, goal, sounds): a style never resets it. */
export const CHAT_BEHAVIOUR_FIELDS = [
  "hideCommands",
  "hideLinks",
  "ignoredUsers",
  "highlightWords",
  "maxMessageLength",
  "messageLifetime",
  "headerText",
  "pinnedText",
  "firstTimeHighlight",
  "streamEvents",
  "eventKinds",
  "eventMinBits",
  "pointsHighlight",
  "showReplies",
  "floodLimit",
  "goalKind",
  "goalTarget",
  "goalStart",
  "goalText",
  "hypeMeter",
  "hypeTarget",
  "eventConfetti",
  "sound",
  "soundStyle",
  "soundVolume",
] as const satisfies ReadonlyArray<keyof CameraChatConfig>;

export function keepChatPlacement(next: CameraChatConfig, current: CameraChatConfig): CameraChatConfig {
  const result = { ...next };
  for (const field of CHAT_PLACEMENT_FIELDS) (result as Record<string, unknown>)[field] = current[field];
  return result;
}

/** A ready-made look applied on top of the placement and the behaviour the streamer already picked. */
export function applyChatPresetKeepingPlacement(current: CameraChatConfig, preset: ChatPresetId): CameraChatConfig {
  const result = keepChatPlacement(chatPresetConfig(preset), current);
  for (const field of CHAT_BEHAVIOUR_FIELDS) (result as Record<string, unknown>)[field] = current[field];
  return result;
}

// --- Ready-made scenarios -----------------------------------------------------------------------------------------

export type ChatScenarioId = "gaming" | "talk" | "tournament" | "podcast" | "vertical" | "cozy";

export const CHAT_SCENARIO_IDS: readonly ChatScenarioId[] = ["gaming", "talk", "tournament", "podcast", "vertical", "cozy"];

/**
 * A complete start for a common kind of stream: placement, look and extras at once. The streamer's own lists and
 * texts stay; an empty bot list gets the usual chat bots.
 */
export function chatScenarioConfig(id: ChatScenarioId, current: CameraChatConfig, liveTitle: string): CameraChatConfig {
  const own: Partial<CameraChatConfig> = {
    ignoredUsers: current.ignoredUsers.trim() ? current.ignoredUsers : COMMON_CHAT_BOTS.join(", "),
    highlightWords: current.highlightWords,
    customFont: current.customFont,
    pinnedText: current.pinnedText,
    goalText: current.goalText,
  };
  const title = current.headerText.trim() || liveTitle;
  switch (id) {
    case "gaming":
      return {
        ...chatPresetConfig("glass"), ...own,
        layout: "chat", chatOnlyWidth: 380, chatOnlyHeight: 520, maxMessages: 8,
        messageLifetime: 30, hideCommands: true, streamEvents: true, floodLimit: 4,
      };
    case "talk":
      return {
        ...chatPresetConfig("neon"), ...own,
        layout: "right", maxMessages: 8, headerStyle: "bar", headerText: title, headerLive: true,
        streamEvents: true, eventConfetti: true, hypeMeter: true, sound: "events",
      };
    case "tournament":
      return {
        ...chatPresetConfig("esport"), ...own,
        layout: "below", belowHeight: 220, hideCommands: true, streamEvents: true,
        eventKinds: ["sub", "gift", "cheer", "raid"], pointsHighlight: true, firstTimeHighlight: true,
      };
    case "podcast":
      return {
        ...chatPresetConfig("classic"), ...own,
        layout: "chat", chatOnlyWidth: 520, chatOnlyHeight: 600, fontSize: "large", maxMessages: 5,
        showReplies: true, floodLimit: 2, textReveal: "words",
      };
    case "vertical":
      return {
        ...chatPresetConfig("bubbles"), ...own,
        layout: "below", aspectRatio: "1:1", cameraWidth: 720, belowHeight: 460, fontSize: "large", maxMessages: 6,
        messageLifetime: 45, streamEvents: true, eventConfetti: true,
      };
    case "cozy":
      return {
        ...chatPresetConfig("glass"), ...own,
        layout: "overlay", overlayPosition: "bottom-left", chatWidth: 40, maxMessages: 4,
        ambient: "stars", ambientColor: "#fde68a", panelAnimation: "breathe", textReveal: "words", floodLimit: 3,
      };
  }
}

/** A random style and colour theme; the placement stays. */
export function randomChatLook(current: CameraChatConfig, random: () => number = Math.random): CameraChatConfig {
  const pick = <T,>(items: readonly T[]): T => items[Math.min(items.length - 1, Math.floor(random() * items.length))]!;
  const look = applyChatPresetKeepingPlacement(current, pick(CHAT_PRESET_IDS));
  return random() < 0.5 ? look : applyChatColorTheme(look, pick(CHAT_COLOR_THEME_IDS));
}

// --- One-click extras ---------------------------------------------------------------------------------------------

export type QuickExtraId = "snow" | "hearts" | "sparkles" | "header" | "firstTime" | "burst" | "frame" | "fade" | "events" | "calm" | "confetti" | "hype" | "goal" | "sound";

export const QUICK_EXTRAS: readonly QuickExtraId[] = ["snow", "hearts", "sparkles", "header", "firstTime", "burst", "frame", "fade", "events", "calm", "confetti", "hype", "goal", "sound"];

/** Message lifetime the "fade out" extra switches on. */
export const QUICK_FADE_SECONDS = 30;

/** Messages a second the "calm chat" extra lets through. */
export const QUICK_CALM_LIMIT = 3;

export function quickExtraOn(id: QuickExtraId, config: CameraChatConfig): boolean {
  switch (id) {
    case "snow":
    case "hearts":
    case "sparkles":
      return config.ambient === id;
    case "header": return config.headerStyle !== "none";
    case "firstTime": return config.firstTimeHighlight;
    case "burst": return config.emoteBurst && config.showEmotes;
    case "frame": return config.frameStyle !== "none";
    case "fade": return config.messageLifetime > 0;
    case "events": return config.streamEvents && config.eventKinds.length > 0;
    case "calm": return config.floodLimit > 0;
    case "confetti": return config.eventConfetti && config.streamEvents;
    case "hype": return config.hypeMeter;
    case "goal": return config.goalKind !== "none";
    case "sound": return config.sound !== "none";
  }
}

/** Switches one extra on or off; `liveTitle` is the header title used when the header has none yet. */
export function toggleQuickExtra(id: QuickExtraId, config: CameraChatConfig, liveTitle: string): CameraChatConfig {
  const on = !quickExtraOn(id, config);
  switch (id) {
    case "snow":
    case "hearts":
    case "sparkles":
      return { ...config, ambient: on ? id : "none" };
    case "header":
      return on
        ? { ...config, headerStyle: "bar", headerText: config.headerText.trim() ? config.headerText : liveTitle, headerLive: true }
        : { ...config, headerStyle: "none" };
    case "firstTime": return { ...config, firstTimeHighlight: on };
    case "burst": return on ? { ...config, emoteBurst: true, showEmotes: true } : { ...config, emoteBurst: false };
    case "frame": return { ...config, frameStyle: on ? "rotate" : "none" };
    case "fade": return { ...config, messageLifetime: on ? QUICK_FADE_SECONDS : 0 };
    case "events": return on
      ? { ...config, streamEvents: true, eventKinds: config.eventKinds.length ? config.eventKinds : [...CHAT_EVENT_KINDS] }
      : { ...config, streamEvents: false };
    case "calm": return { ...config, floodLimit: on ? QUICK_CALM_LIMIT : 0 };
    // Confetti flies across event rows, so it switches events on too.
    case "confetti": return on
      ? { ...toggleQuickExtra("events", { ...config, streamEvents: false }, liveTitle), eventConfetti: true }
      : { ...config, eventConfetti: false };
    case "hype": return { ...config, hypeMeter: on };
    case "goal": return { ...config, goalKind: on ? "sub" : "none" };
    case "sound": return { ...config, sound: on ? "events" : "none" };
  }
}

// --- Undo / redo --------------------------------------------------------------------------------------------------

export type ChatConfigHistory = {
  past: CameraChatConfig[];
  present: CameraChatConfig;
  future: CameraChatConfig[];
  /** When the present was last changed (ms); quick changes such as dragging a slider become one step. */
  changedAt: number;
};

export const HISTORY_LIMIT = 50;
export const HISTORY_MERGE_MS = 700;

export function sameChatConfig(a: CameraChatConfig, b: CameraChatConfig): boolean {
  return (Object.keys(a) as Array<keyof CameraChatConfig>).every((key) => a[key] === b[key]);
}

export function startChatHistory(config: CameraChatConfig): ChatConfigHistory {
  return { past: [], present: config, future: [], changedAt: Number.NEGATIVE_INFINITY };
}

export function commitChatHistory(history: ChatConfigHistory, next: CameraChatConfig, now: number): ChatConfigHistory {
  if (sameChatConfig(history.present, next)) return history;
  if (history.past.length > 0 && now - history.changedAt < HISTORY_MERGE_MS) {
    return { past: history.past, present: next, future: [], changedAt: now };
  }
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: [], changedAt: now };
}

export function undoChatHistory(history: ChatConfigHistory): ChatConfigHistory {
  const previous = history.past[history.past.length - 1];
  if (!previous) return history;
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future], changedAt: Number.NEGATIVE_INFINITY };
}

export function redoChatHistory(history: ChatConfigHistory): ChatConfigHistory {
  const [next, ...rest] = history.future;
  if (!next) return history;
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: rest, changedAt: Number.NEGATIVE_INFINITY };
}
