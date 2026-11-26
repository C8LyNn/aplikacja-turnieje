/**
 * Chat message rules shared by the React preview, the OBS Browser Source page and (as a copy written into the exported
 * script) the native StreamElements widget. overlay-integration.test.tsx runs both copies on the same messages.
 *
 * Everything a viewer sends is data: it is rendered as text, and images (emotes, badges) are only taken from https
 * addresses of the known chat CDNs listed here — never from arbitrary hosts and never as HTML.
 */
import {
  type CameraChatConfig,
  type CameraChatMotionPreset,
  type CameraChatTextReveal,
  chatExitMs,
  chatRevealBaseMs,
  resolveChatMotion,
  resolveChatNameColor,
} from "./camera-chat-settings";
import { type ChatReply, type ChatStreamEvent, chatEventShown, stripReplyMention } from "./chat-events";

export type ChatEmote = { name: string; url: string };
export type ChatBadge = { type?: string; url: string; description?: string };

export type ChatMessage = {
  name: string;
  text: string;

  /** Stable local identity for rendering (messages without a platform id). */
  id?: string;
  msgId?: string;
  userId?: string;
  /** Login name (StreamElements "nick"), used by the hidden-users filter next to the display name. */
  nick?: string;

  color?: string;
  badges?: ChatBadge[];
  emotes?: ChatEmote[];
  /** Twitch "/me" message. */
  isAction?: boolean;
  /** Badge types (for example "moderator"), kept even when badge images are hidden or have no address. */
  roles?: string[];
  /** The viewer's first message in the channel (Twitch tag "first-msg"). */
  firstMessage?: boolean;
  /** Arrival time (ms); only messages with it can hide after their lifetime. */
  receivedAt?: number;
  /** A stream event (follow, sub, cheer...) drawn as its own row; text is the message that came with it. */
  event?: ChatStreamEvent;
  /** The message this one answers (Twitch reply). */
  reply?: ChatReply;
  /** Highlighted with channel points ("Highlight my message"). */
  pointsMessage?: boolean;
};

/** Hosts of Twitch, BTTV, FFZ, 7TV, YouTube and StreamElements images (subdomains included). */
export const CHAT_IMAGE_HOSTS: readonly string[] = [
  "jtvnw.net",
  "twitchcdn.net",
  "betterttv.net",
  "frankerfacez.com",
  "7tv.app",
  "7tv.io",
  "ggpht.com",
  "googleusercontent.com",
  "streamelements.com",
];

/** Locally drawn images (the preview's sample emotes and badges). */
export const CHAT_DATA_IMAGE_PATTERN = /^data:image\/(png|gif|webp|svg\+xml)[;,]/i;

export function safeChatImageUrl(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 2048) return "";
  if (CHAT_DATA_IMAGE_PATTERN.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "";
  }
  if (url.protocol !== "https:" || url.username || url.password) return "";
  const host = url.hostname.toLowerCase();
  return CHAT_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? url.href : "";
}

/** Names from a comma / space separated list, without "@", lower case. */
export function parseChatNameList(raw: string): string[] {
  return raw.split(/[\s,;]+/).map((item) => item.trim().replace(/^@/, "").toLowerCase()).filter(Boolean).slice(0, 50);
}

/** Words or phrases from a comma separated list, lower case. */
export function parseChatWordList(raw: string): string[] {
  return raw.split(/[,;\n]+/).map((item) => item.trim().toLowerCase()).filter(Boolean).slice(0, 30);
}

export function isChatMessageHidden(
  message: Pick<ChatMessage, "name" | "nick" | "text">,
  config: Pick<CameraChatConfig, "hideCommands" | "ignoredUsers">,
): boolean {
  if (config.hideCommands && message.text.trimStart().startsWith("!")) return true;
  const ignored = parseChatNameList(config.ignoredUsers);
  if (!ignored.length) return false;
  return [message.name, message.nick ?? ""].some((name) => name !== "" && ignored.includes(name.toLowerCase()));
}

export const CHAT_LINK_PATTERN =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|pl|eu|de|uk|tv|gg|io|me|co|xyz|ru|info|app|dev|ly|link|live|shop|store|site|online)\b(?:\/\S*)?/gi;

export function hideChatLinks(text: string): string {
  return text.replace(CHAT_LINK_PATTERN, "[link]");
}

export function truncateChatText(text: string, maxLength: number): string {
  if (maxLength <= 0) return text;
  const chars = Array.from(text);
  return chars.length > maxLength ? `${chars.slice(0, maxLength).join("").trimEnd()}…` : text;
}

export function isChatHighlighted(text: string, config: Pick<CameraChatConfig, "highlightWords">): boolean {
  const words = parseChatWordList(config.highlightWords);
  if (!words.length) return false;
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

export type ChatPart = { kind: "text"; text: string } | { kind: "emote"; name: string; url: string };

/** Splits the text into text and emote parts; an emote is a whole word equal to an emote name. */
export function chatMessageParts(text: string, emotes: readonly ChatEmote[] | undefined, showEmotes: boolean): ChatPart[] {
  const known = new Map<string, string>();
  if (showEmotes && emotes) {
    for (const emote of emotes) {
      const url = safeChatImageUrl(emote.url);
      if (emote.name && url && !known.has(emote.name)) known.set(emote.name, url);
    }
  }
  if (!known.size) return [{ kind: "text", text }];
  const parts: ChatPart[] = [];
  let buffer = "";
  for (const piece of text.split(/(\s+)/)) {
    const url = known.get(piece);
    if (url) {
      if (buffer) parts.push({ kind: "text", text: buffer });
      buffer = "";
      parts.push({ kind: "emote", name: piece, url });
    } else {
      buffer += piece;
    }
  }
  if (buffer) parts.push({ kind: "text", text: buffer });
  return parts;
}

export function isEmoteOnly(parts: readonly ChatPart[]): boolean {
  return parts.some((part) => part.kind === "emote") && parts.every((part) => part.kind === "emote" || !part.text.trim());
}

export type ChatRole = "broadcaster" | "moderator" | "vip";

export const CHAT_ROLE_COLORS: Record<ChatRole, string> = {
  broadcaster: "#ef4444",
  moderator: "#22c55e",
  vip: "#ec4899",
};

/** The most important role among badge types: broadcaster, then moderator, then VIP. */
export function chatMessageRole(types: readonly string[]): ChatRole | null {
  const lower = types.map((type) => type.toLowerCase());
  if (lower.includes("broadcaster")) return "broadcaster";
  if (lower.includes("moderator")) return "moderator";
  if (lower.includes("vip")) return "vip";
  return null;
}

/** Longer messages appear at once (bounded number of animated elements). */
export const CHAT_REVEAL_LIMIT = 200;

export function chatRevealStepMs(count: number): number {
  return count <= 1 ? 0 : Math.max(12, Math.min(45, Math.floor(1400 / count)));
}

export function chatRevealAnimation(reveal: Exclude<CameraChatTextReveal, "none">, index: number, stepMs: number, baseMs: number): string {
  const delay = baseMs + index * stepMs;
  return reveal === "words"
    ? `chat-reveal-word 280ms ease-out ${delay}ms both`
    : `chat-reveal-type 1ms linear ${delay}ms both`;
}

export type RevealPiece =
  | { kind: "text"; text: string; animation?: string; word?: boolean }
  | { kind: "emote"; name: string; url: string; animation?: string };

/**
 * The message split for a reveal: letters (typewriter) or words appear one after another; emotes count as one step;
 * spaces are plain text. Null when there is nothing to reveal or the message is too long.
 */
export function chatRevealPieces(parts: readonly ChatPart[], reveal: CameraChatTextReveal, baseMs: number): RevealPiece[] | null {
  if (reveal === "none") return null;
  const total = parts.reduce((sum, part) => sum + (part.kind === "text" ? Array.from(part.text).length : 1), 0);
  if (total > CHAT_REVEAL_LIMIT) return null;
  const pieces: RevealPiece[] = [];
  const animated: RevealPiece[] = [];
  for (const part of parts) {
    if (part.kind === "emote") {
      const emote: RevealPiece = { kind: "emote", name: part.name, url: part.url };
      pieces.push(emote);
      animated.push(emote);
      continue;
    }
    for (const chunk of part.text.split(/(\s+)/)) {
      if (!chunk) continue;
      if (!chunk.trim()) {
        pieces.push({ kind: "text", text: chunk });
      } else if (reveal === "words") {
        const word: RevealPiece = { kind: "text", text: chunk, word: true };
        pieces.push(word);
        animated.push(word);
      } else {
        for (const char of Array.from(chunk)) {
          const letter: RevealPiece = { kind: "text", text: char };
          pieces.push(letter);
          animated.push(letter);
        }
      }
    }
  }
  const step = chatRevealStepMs(animated.length);
  animated.forEach((piece, index) => { piece.animation = chatRevealAnimation(reveal, index, step, baseMs); });
  return pieces;
}

export type ChatPhase = "shown" | "leaving" | "gone";

/** A message is shown for its lifetime, then plays the exit animation, then disappears. */
export function chatMessagePhase(
  receivedAt: number | undefined,
  config: Pick<CameraChatConfig, "messageLifetime" | "exitStyle" | "animationDurationMs">,
  now: number,
): ChatPhase {
  if (config.messageLifetime <= 0 || receivedAt === undefined) return "shown";
  const leaveAt = receivedAt + config.messageLifetime * 1000;
  if (now < leaveAt) return "shown";
  return now < leaveAt + chatExitMs(config) ? "leaving" : "gone";
}

/** The next moment a visible message changes phase (for one timer instead of a constant tick). */
export function nextChatPhaseChange(
  messages: readonly Pick<ChatMessage, "receivedAt">[],
  config: Pick<CameraChatConfig, "messageLifetime" | "exitStyle" | "animationDurationMs">,
  now: number,
): number | null {
  if (config.messageLifetime <= 0) return null;
  const lifetimeMs = config.messageLifetime * 1000;
  const exitMs = chatExitMs(config);
  let next = Infinity;
  for (const message of messages) {
    if (message.receivedAt === undefined) continue;
    const leaveAt = message.receivedAt + lifetimeMs;
    if (leaveAt > now) next = Math.min(next, leaveAt);
    else if (leaveAt + exitMs > now) next = Math.min(next, leaveAt + exitMs);
  }
  return next === Infinity ? null : next;
}

export type ChatRow = {
  key: string;
  message: ChatMessage;
  phase: Exclude<ChatPhase, "gone">;
  /** Older messages fade when "fade old messages" is on. */
  opacity: number;
  nameColor: string;
  parts: ChatPart[];
  emoteOnly: boolean;
  highlighted: boolean;
  badges: ChatBadge[];
  /** Entry motion of this message (stable per message in random mode). */
  motion: CameraChatMotionPreset;
  /** Set only when role highlighting is on and the viewer has a highlighted role. */
  role: ChatRole | null;
  /** First message in the channel, shown with a "NEW" tag when that option is on. */
  firstTime: boolean;
  /** Letters or words of the text with their reveal animation; null shows the text at once. */
  reveal: RevealPiece[] | null;
  /** Set for an event row (follow, sub, cheer...). */
  event: ChatStreamEvent | null;
  /** Set when reply lines are on and the message answers another one. */
  reply: ChatReply | null;
  /** Channel-points highlighted message, when that option is on. */
  points: boolean;
};

/** The rows to draw, in display order: filtered, bounded to the message count, newest first when asked. */
export function buildChatRows(messages: readonly ChatMessage[], config: CameraChatConfig, now: number): ChatRow[] {
  // Event rows skip the message filters (a cheer text starting with "!" is still a cheer).
  const kept = messages.filter((message) =>
    (message.event ? chatEventShown(message.event, config) : !isChatMessageHidden(message, config))
    && chatMessagePhase(message.receivedAt, config, now) !== "gone");
  const visible = kept.slice(-config.maxMessages);
  const rows = visible.map((message, index): ChatRow => {
    const event = message.event ?? null;
    const reply = config.showReplies && !event ? message.reply ?? null : null;
    const ownText = stripReplyMention(message.text, reply);
    const shownText = truncateChatText(config.hideLinks ? hideChatLinks(ownText) : ownText, config.maxMessageLength);
    const parts = chatMessageParts(shownText, message.emotes, config.showEmotes);
    return {
      key: message.id ?? message.msgId ?? `${message.name}|${message.text}|${index}`,
      message,
      phase: chatMessagePhase(message.receivedAt, config, now) === "leaving" ? "leaving" : "shown",
      opacity: config.fadeOldMessages ? 0.5 + ((index + 1) / visible.length) * 0.5 : 1,
      nameColor: resolveChatNameColor(message, config),
      parts,
      emoteOnly: !event && config.emoteOnlyLarge && isEmoteOnly(parts),
      highlighted: !event && isChatHighlighted(message.text, config),
      badges: config.showBadges
        ? (message.badges ?? []).filter((badge) => safeChatImageUrl(badge.url)).slice(0, 6)
        : [],
      motion: resolveChatMotion(config.animationStyle, message.msgId || message.name + "|" + message.text),
      role: config.roleHighlight && !event
        ? chatMessageRole(message.roles ?? (message.badges ?? []).map((badge) => badge.type ?? ""))
        : null,
      reveal: event ? null : chatRevealPieces(parts, config.textReveal, chatRevealBaseMs(config)),
      firstTime: !event && config.firstTimeHighlight && message.firstMessage === true,
      event,
      reply,
      points: !event && config.pointsHighlight && message.pointsMessage === true,
    };
  });
  return config.newestFirst ? rows.reverse() : rows;
}

const asString = (value: unknown) => (value === null || value === undefined ? "" : String(value));

/** Badges from a StreamElements message ({ type, version, url, description }). */
export function chatBadgesFromEvent(raw: unknown): ChatBadge[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).flatMap((item): ChatBadge[] => {
    if (!item || typeof item !== "object") return [];
    const badge = item as Record<string, unknown>;
    const url = safeChatImageUrl(badge["url"]);
    return url ? [{ type: asString(badge["type"]).slice(0, 40), url, description: asString(badge["description"]).slice(0, 60) }] : [];
  });
}

/** Badge types from a StreamElements message, with or without an image address. */
export function chatRolesFromEvent(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 10).flatMap((item) => item && typeof item === "object"
    ? [asString((item as Record<string, unknown>)["type"]).toLowerCase().slice(0, 40)]
    : []);
}

/** Twitch marks a viewer's first message in the channel with the IRC tag first-msg=1. */
export function chatFirstMessageFromEvent(tags: unknown): boolean {
  return Boolean(tags && typeof tags === "object" && (tags as Record<string, unknown>)["first-msg"] === "1");
}

/** Emotes from a StreamElements message ({ name, urls: { 1, 2, 4 } }), Twitch and third-party alike. */
export function chatEmotesFromEvent(raw: unknown): ChatEmote[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 100).flatMap((item): ChatEmote[] => {
    if (!item || typeof item !== "object") return [];
    const emote = item as Record<string, unknown>;
    const urls = emote["urls"] && typeof emote["urls"] === "object" ? emote["urls"] as Record<string, unknown> : {};
    const url = safeChatImageUrl(urls["2"] ?? urls["1"] ?? urls["4"]);
    const name = asString(emote["name"]).slice(0, 100);
    return name && url ? [{ name, url }] : [];
  });
}
