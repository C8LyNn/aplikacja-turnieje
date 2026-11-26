/**
 * The settings check of the chat configurator: common problems (unreadable text, a header that cannot show, events
 * with nothing picked...) each with a one-click fix. Pure functions, shared by the configurator and the tests.
 */
import { type CameraChatConfig, COMMON_CHAT_BOTS, chatFontPx, hexToRgb } from "./camera-chat-settings";
import { chatBubbleFilled } from "./chat-decor";
import { CHAT_EVENT_KINDS } from "./chat-events";

export type ChatSetupIssueId =
  | "contrast"
  | "transparent"
  | "tinyText"
  | "emptyHeader"
  | "noEventKinds"
  | "confettiNoEvents"
  | "shortLifetime"
  | "coverCamera"
  | "soundSilent"
  | "goalDone"
  | "bots";

export type ChatSetupIssue = {
  id: ChatSetupIssueId;
  /** "warn": probably looks or works wrong; "tip": worth a look. */
  level: "warn" | "tip";
  /** Numbers for the message (contrast ratio, seconds...). */
  values?: Record<string, string | number>;
  fix: (config: CameraChatConfig) => CameraChatConfig;
};

/** Below this contrast between text and background the chat is hard to read on stream (WCAG AA). */
export const CHAT_MIN_CONTRAST = 4.5;

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const share = channel / 255;
    return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** The colours behind the text, or null when the chat is see-through (the game shows through). */
export function chatTextBackdrop(config: CameraChatConfig): string[] | null {
  if (chatBubbleFilled(config) && config.bubbleOpacity >= 50) return [config.bubbleColor];
  if (config.panelOpacity >= 50) return config.panelGradient ? [config.panelColor, config.panelColor2] : [config.panelColor];
  return null;
}

/** White or near-black, whichever reads better on the backdrop. */
function readableTextColor(backdrop: readonly string[]): string {
  const white = Math.min(...backdrop.map((color) => contrastRatio("#ffffff", color)));
  const black = Math.min(...backdrop.map((color) => contrastRatio("#111827", color)));
  return white >= black ? "#ffffff" : "#111827";
}

export function checkChatSetup(config: CameraChatConfig, liveTitle: string): ChatSetupIssue[] {
  const issues: ChatSetupIssue[] = [];
  const backdrop = chatTextBackdrop(config);
  if (backdrop) {
    const ratio = Math.min(...backdrop.map((color) => contrastRatio(config.textColor, color)));
    if (ratio < CHAT_MIN_CONTRAST || config.textOpacity < 60) {
      issues.push({
        id: "contrast",
        level: "warn",
        values: { ratio: ratio.toFixed(1) },
        fix: (current) => {
          const behind = chatTextBackdrop(current) ?? backdrop;
          return { ...current, textColor: readableTextColor(behind), textOpacity: Math.max(current.textOpacity, 90) };
        },
      });
    }
  } else if (config.textShadow === "none") {
    issues.push({ id: "transparent", level: "warn", fix: (current) => ({ ...current, textShadow: "outline" }) });
  }
  const fontPx = chatFontPx(config);
  if (fontPx < 12) {
    issues.push({ id: "tinyText", level: "warn", values: { px: fontPx }, fix: (current) => ({ ...current, fontSize: "custom", fontSizePx: 16 }) });
  }
  if (config.headerStyle !== "none" && !config.headerText.trim() && !config.headerLive) {
    issues.push({ id: "emptyHeader", level: "warn", fix: (current) => ({ ...current, headerText: liveTitle, headerLive: true }) });
  }
  if (config.streamEvents && !config.eventKinds.length) {
    issues.push({ id: "noEventKinds", level: "warn", fix: (current) => ({ ...current, eventKinds: [...CHAT_EVENT_KINDS] }) });
  }
  if (config.eventConfetti && !config.streamEvents) {
    issues.push({
      id: "confettiNoEvents",
      level: "warn",
      fix: (current) => ({ ...current, streamEvents: true, eventKinds: current.eventKinds.length ? current.eventKinds : [...CHAT_EVENT_KINDS] }),
    });
  }
  if (config.messageLifetime > 0 && config.messageLifetime < 6) {
    issues.push({ id: "shortLifetime", level: "warn", values: { n: config.messageLifetime }, fix: (current) => ({ ...current, messageLifetime: 15 }) });
  }
  if (config.sound !== "none" && config.soundVolume === 0) {
    issues.push({ id: "soundSilent", level: "warn", fix: (current) => ({ ...current, soundVolume: 50 }) });
  }
  if (config.goalKind !== "none" && config.goalStart >= config.goalTarget) {
    issues.push({
      id: "goalDone",
      level: "warn",
      values: { start: config.goalStart, target: config.goalTarget },
      fix: (current) => ({ ...current, goalTarget: Math.min(1_000_000, Math.max(current.goalStart + 1, current.goalStart * 2)) }),
    });
  }
  if (config.layout === "overlay" && config.chatWidth >= 50 && config.messageLifetime === 0) {
    issues.push({ id: "coverCamera", level: "tip", fix: (current) => ({ ...current, messageLifetime: 30 }) });
  }
  if (!config.ignoredUsers.trim()) {
    issues.push({ id: "bots", level: "tip", fix: (current) => ({ ...current, ignoredUsers: COMMON_CHAT_BOTS.join(", ") }) });
  }
  return issues;
}

/** Every fix, one after another. */
export function fixAllChatIssues(config: CameraChatConfig, issues: readonly ChatSetupIssue[]): CameraChatConfig {
  return issues.reduce((current, issue) => issue.fix(current), config);
}
