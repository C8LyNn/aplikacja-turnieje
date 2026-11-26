/**
 * Logic behind the quick setup of the chat configurator: a style that keeps the chosen placement, one-click extras,
 * a random look and the undo / redo history. Pure functions, so the configurator and the tests share them.
 */
import { type CameraChatConfig } from "./camera-chat-settings";
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

export function keepChatPlacement(next: CameraChatConfig, current: CameraChatConfig): CameraChatConfig {
  const result = { ...next };
  for (const field of CHAT_PLACEMENT_FIELDS) (result as Record<string, unknown>)[field] = current[field];
  return result;
}

/** A ready-made look applied on top of the placement the streamer already picked. */
export function applyChatPresetKeepingPlacement(current: CameraChatConfig, preset: ChatPresetId): CameraChatConfig {
  return keepChatPlacement(chatPresetConfig(preset), current);
}

/** A random style and colour theme; the placement stays. */
export function randomChatLook(current: CameraChatConfig, random: () => number = Math.random): CameraChatConfig {
  const pick = <T,>(items: readonly T[]): T => items[Math.min(items.length - 1, Math.floor(random() * items.length))]!;
  const look = applyChatPresetKeepingPlacement(current, pick(CHAT_PRESET_IDS));
  return random() < 0.5 ? look : applyChatColorTheme(look, pick(CHAT_COLOR_THEME_IDS));
}

// --- One-click extras ---------------------------------------------------------------------------------------------

export type QuickExtraId = "snow" | "hearts" | "sparkles" | "header" | "firstTime" | "burst" | "frame" | "fade";

export const QUICK_EXTRAS: readonly QuickExtraId[] = ["snow", "hearts", "sparkles", "header", "firstTime", "burst", "frame", "fade"];

/** Message lifetime the "fade out" extra switches on. */
export const QUICK_FADE_SECONDS = 30;

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
