/**
 * Stream events in the chat (follows, subs, gifted subs, cheers, raids, tips), reply lines, channel-points highlighted
 * messages and the calm-chat pacing. Shared by the React preview and the OBS page; the exported StreamElements widget
 * carries a copy of the same rules in its script, and chat-events.test.tsx runs both on the same events.
 *
 * Names and messages in events are viewer data: they are always inserted as text. Templates come from the site's
 * own translations and are split on placeholders, never parsed as HTML.
 */
import type { CameraChatConfig } from "./camera-chat-settings";

export type ChatEventKind = "follow" | "sub" | "gift" | "cheer" | "raid" | "tip";
export type CameraChatEventStyle = "banner" | "glow" | "compact";

export const CHAT_EVENT_KINDS: readonly ChatEventKind[] = ["follow", "sub", "gift", "cheer", "raid", "tip"];
export const CHAT_EVENT_STYLES: readonly CameraChatEventStyle[] = ["banner", "glow", "compact"];

export const CHAT_EVENT_COLORS: Record<ChatEventKind, string> = {
  follow: "#38bdf8",
  sub: "#a855f7",
  gift: "#f472b6",
  cheer: "#f59e0b",
  raid: "#ef4444",
  tip: "#22c55e",
};

/** Plain text symbols, present in every system font OBS uses. */
export const CHAT_EVENT_ICONS: Record<ChatEventKind, string> = {
  follow: "♥",
  sub: "★",
  gift: "✦",
  cheer: "◆",
  raid: "➤",
  tip: "✪",
};

/** Twitch "Highlight my message" (channel points), msg-id=highlighted-message. */
export const POINTS_MESSAGE_COLOR = "#a970ff";

/** StreamElements listeners of the events shown in the chat. */
export const CHAT_EVENT_LISTENERS: Record<string, ChatEventKind> = {
  "follower-latest": "follow",
  "subscriber-latest": "sub",
  "cheer-latest": "cheer",
  "raid-latest": "raid",
  "tip-latest": "tip",
};

export type ChatStreamEvent = {
  kind: ChatEventKind;
  /** Who did it; for a single gift the viewer who got the sub, for a gift bomb the gifter. */
  name: string;
  /** Months (sub), gifted subs (gift bomb), bits, raiders or the tip amount. */
  amount: number;
  /** Who gave a single gifted sub. */
  sender?: string;
  /** Several subs gifted at once. */
  bulk?: boolean;
  /** Sub tier: "1000", "2000", "3000" or "prime". */
  tier?: string;
};

/** Templates with {name}, {sender} and {amount}; tipCurrency is used when the platform sends none. */
export type ChatEventLabels = {
  follow: string;
  sub: string;
  resub: string;
  gift: string;
  giftBulk: string;
  cheer: string;
  raid: string;
  tip: string;
  tipCurrency: string;
  /** Default titles of the goal bar. */
  goalFollow: string;
  goalSub: string;
  goalBits: string;
  goalTip: string;
};

export const CHAT_EVENT_LABELS_EN: ChatEventLabels = {
  follow: "{name} just followed!",
  sub: "{name} subscribed!",
  resub: "{name} subscribed for {amount} months!",
  gift: "{sender} gifted a sub to {name}!",
  giftBulk: "{sender} gifted {amount} subs!",
  cheer: "{name} cheered {amount} bits!",
  raid: "{name} is raiding with {amount} viewers!",
  tip: "{name} tipped {amount}!",
  tipCurrency: "$",
  goalFollow: "Follower goal",
  goalSub: "Sub goal",
  goalBits: "Bits goal",
  goalTip: "Tip goal",
};

export const CHAT_PACE_QUEUE_MAX = 30;
export const CHAT_REPLY_MAX = 60;

/** Default Twitch cheermote prefixes; "Cheer100" and the like are removed from the shown cheer message. */
export const CHEERMOTE_PREFIXES: readonly string[] = [
  "cheer", "doodlecheer", "biblethump", "cheerwhal", "corgo", "scoops", "uni", "showlove", "party", "seemsgood",
  "pride", "kappa", "frankerz", "heyguys", "dansgame", "elegiggle", "trihard", "kreygasm", "4head", "swiftrage",
  "notlikethis", "failfish", "vohiyo", "pjsalt", "mrdestructoid", "bday", "ripcheer", "shamrock", "bitboss",
  "streamlabs", "muxy", "holidaycheer", "goal", "anon", "charity",
];

export const CHEERMOTE_PATTERN = new RegExp(`(^|\\s)(?:${CHEERMOTE_PREFIXES.join("|")})\\d+(?=\\s|$)`, "gi");

/** Currency symbols written before the amount ($10); every other symbol goes after it (10 zł). */
export const PREFIX_CURRENCIES: readonly string[] = ["$", "€", "£", "¥", "₹", "R$", "A$", "C$", "US$"];

// Control characters and bidi overrides would let a name or message rearrange the text around it (built from
// character codes, so the source holds no invisible characters).
const codeRange = (from: number, to: number) => `${String.fromCharCode(from)}-${String.fromCharCode(to)}`;
export const CHAT_CONTROL_RANGES: ReadonlyArray<readonly [number, number]> = [[0, 0x1f], [0x7f, 0x9f], [0x202a, 0x202e], [0x2066, 0x2069]];
export const CHAT_CONTROL_PATTERN = new RegExp(`[${CHAT_CONTROL_RANGES.map(([from, to]) => codeRange(from, to)).join("")}]`, "g");

const asString = (value: unknown) => (value === null || value === undefined ? "" : String(value));

export function cleanEventText(value: unknown, maxLength: number): string {
  return Array.from(asString(value).replace(CHAT_CONTROL_PATTERN, " ").replace(/\s+/g, " ").trim())
    .slice(0, maxLength).join("");
}

export function eventAmount(value: unknown): number {
  const number = typeof value === "number" ? value : Number.parseFloat(asString(value));
  return Number.isFinite(number) && number > 0 ? Math.min(number, 10_000_000) : 0;
}

export function stripCheermotes(text: string): string {
  return text.replace(CHEERMOTE_PATTERN, "$1").replace(/\s+/g, " ").trim();
}

export function formatChatTip(amount: number, symbol: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const value = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  if (!symbol) return value;
  return PREFIX_CURRENCIES.includes(symbol) ? `${symbol}${value}` : `${value} ${symbol}`;
}

export type ChatEventPart = { text: string; strong?: boolean };

function eventTemplate(event: ChatStreamEvent, labels: ChatEventLabels): string {
  switch (event.kind) {
    case "follow": return labels.follow;
    case "sub": return event.amount > 1 ? labels.resub : labels.sub;
    case "gift": return event.bulk ? labels.giftBulk : labels.gift;
    case "cheer": return labels.cheer;
    case "raid": return labels.raid;
    case "tip": return labels.tip;
  }
}

export const CHAT_PLACEHOLDER_PATTERN = /(\{name\}|\{sender\}|\{amount\})/;

/** The event's title: the template split on placeholders; names and the amount are strong parts. */
export function chatEventTitleParts(event: ChatStreamEvent, labels: ChatEventLabels, currency: string): ChatEventPart[] {
  const amount = event.kind === "tip" ? formatChatTip(event.amount, currency) : String(Math.round(event.amount));
  const values: Record<string, string> = { "{name}": event.name, "{sender}": event.sender ?? "", "{amount}": amount };
  return String(eventTemplate(event, labels) ?? "").split(CHAT_PLACEHOLDER_PATTERN)
    .filter(Boolean)
    .map((piece) => (Object.prototype.hasOwnProperty.call(values, piece) ? { text: values[piece]!, strong: true } : { text: piece }));
}

/** "Prime", "T2" or "T3" next to a sub; nothing for tier 1. */
export function chatEventTag(event: ChatStreamEvent): string {
  if (event.kind !== "sub" && event.kind !== "gift") return "";
  if (event.tier === "prime") return "Prime";
  if (event.tier === "2000") return "T2";
  if (event.tier === "3000") return "T3";
  return "";
}

export type ChatEventIntake = { event: ChatStreamEvent; text: string; id: string };

/**
 * An event from a StreamElements listener, or null when it is not a chat event. Each sub of a gift bomb arrives on
 * its own after the bomb itself ("isCommunityGift"); those are skipped, so a bomb of 50 is one row, not 51.
 */
export function chatEventFromStreamElements(listener: string, raw: unknown): ChatEventIntake | null {
  const kind = CHAT_EVENT_LISTENERS[listener];
  if (!kind || !raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const name = cleanEventText(data["displayName"] ?? data["name"], 40);
  if (!name) return null;
  const id = cleanEventText(data["_id"] ?? data["activityId"], 80);
  const text = cleanEventText(data["message"], 300);
  const amount = eventAmount(data["amount"]);
  if (kind === "sub") {
    if (data["isCommunityGift"] === true && data["bulkGifted"] !== true) return null;
    const tier = cleanEventText(data["tier"], 10).toLowerCase();
    const sender = cleanEventText(data["sender"], 40);
    if (data["bulkGifted"] === true) {
      return { event: { kind: "gift", name: sender || name, sender: sender || name, amount: Math.max(1, amount), bulk: true, tier }, text: "", id };
    }
    if (data["gifted"] === true) {
      return { event: { kind: "gift", name, sender: sender || "?", amount: 1, tier }, text: "", id };
    }
    return { event: { kind: "sub", name, amount: Math.max(1, amount), tier }, text, id };
  }
  return { event: { kind, name, amount }, text: kind === "cheer" ? stripCheermotes(text) : text, id };
}

/** An event row is shown when events are on, its kind is picked and a cheer reaches the minimum bits. */
export function chatEventShown(
  event: ChatStreamEvent,
  config: Pick<CameraChatConfig, "streamEvents" | "eventKinds" | "eventMinBits">,
): boolean {
  if (!config.streamEvents || !config.eventKinds.includes(event.kind)) return false;
  return event.kind !== "cheer" || event.amount >= config.eventMinBits;
}

export type ChatReply = { name: string; text: string };

export const IRC_ESCAPE_PATTERN = /\\(s|:|\\|r|n)/g;

/** IRC tag values escape spaces and semicolons; StreamElements may pass them on as they are. */
export function unescapeIrcTag(value: string): string {
  return value.replace(IRC_ESCAPE_PATTERN, (_, code: string) => (code === "s" ? " " : code === ":" ? ";" : code === "r" || code === "n" ? " " : code));
}

/** The message a viewer replied to (Twitch reply-parent tags), shortened to one line. */
export function chatReplyFromTags(tags: unknown): ChatReply | null {
  if (!tags || typeof tags !== "object") return null;
  const record = tags as Record<string, unknown>;
  const name = cleanEventText(unescapeIrcTag(asString(record["reply-parent-display-name"] ?? record["reply-parent-user-login"])), 40);
  if (!name) return null;
  const body = cleanEventText(unescapeIrcTag(asString(record["reply-parent-msg-body"])), 400);
  const chars = Array.from(body);
  return { name, text: chars.length > CHAT_REPLY_MAX ? `${chars.slice(0, CHAT_REPLY_MAX).join("").trimEnd()}…` : body };
}

/** Twitch puts "@name " in front of a reply; the reply line already says who it answers. */
export function stripReplyMention(text: string, reply: ChatReply | null | undefined): string {
  if (!reply) return text;
  const prefix = `@${reply.name.toLowerCase()} `;
  return text.toLowerCase().startsWith(prefix) ? text.slice(prefix.length) : text;
}

export function chatPointsFromTags(tags: unknown): boolean {
  return Boolean(tags && typeof tags === "object" && (tags as Record<string, unknown>)["msg-id"] === "highlighted-message");
}

export function chatPaceIntervalMs(limit: number): number {
  return limit > 0 ? Math.round(1000 / limit) : 0;
}

type PacerClock = {
  now: () => number;
  set: (run: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
};

const browserClock: PacerClock = {
  now: () => Date.now(),
  set: (run, ms) => window.setTimeout(run, ms),
  clear: (handle) => window.clearTimeout(handle as number),
};

/**
 * Calm chat: at most one message per interval reaches the screen; the rest wait in a short queue. When the queue is
 * full the oldest waiting message is dropped (it would be stale by the time it showed).
 */
export class ChatPacer<T> {
  private queue: T[] = [];
  private lastAt = -Infinity;
  private timer: unknown = null;

  constructor(
    private readonly intervalMs: number,
    private readonly release: (item: T) => void,
    private readonly clock: PacerClock = browserClock,
  ) {}

  push(item: T) {
    if (this.intervalMs <= 0) {
      this.release(item);
      return;
    }
    const now = this.clock.now();
    if (!this.queue.length && now - this.lastAt >= this.intervalMs) {
      this.lastAt = now;
      this.release(item);
      return;
    }
    this.queue.push(item);
    if (this.queue.length > CHAT_PACE_QUEUE_MAX) this.queue.shift();
    this.schedule();
  }

  /** Moderation also reaches messages that are still waiting. */
  remove(predicate: (item: T) => boolean) {
    this.queue = this.queue.filter((item) => !predicate(item));
  }

  get waiting(): number {
    return this.queue.length;
  }

  dispose() {
    if (this.timer !== null) this.clock.clear(this.timer);
    this.timer = null;
    this.queue = [];
  }

  private schedule() {
    if (this.timer !== null) return;
    const wait = Math.max(0, this.lastAt + this.intervalMs - this.clock.now());
    this.timer = this.clock.set(() => {
      this.timer = null;
      const next = this.queue.shift();
      if (next === undefined) return;
      this.lastAt = this.clock.now();
      this.release(next);
      if (this.queue.length) this.schedule();
    }, wait);
  }
}

// --- Goal bar -------------------------------------------------------------------------------------------------------

export type ChatGoalKind = "none" | "follow" | "sub" | "bits" | "tip";
export const CHAT_GOAL_KINDS: readonly ChatGoalKind[] = ["none", "follow", "sub", "bits", "tip"];

export const CHAT_GOAL_COLORS: Record<Exclude<ChatGoalKind, "none">, string> = {
  follow: CHAT_EVENT_COLORS.follow,
  sub: CHAT_EVENT_COLORS.sub,
  bits: CHAT_EVENT_COLORS.cheer,
  tip: CHAT_EVENT_COLORS.tip,
};

/** StreamElements session counters (onWidgetLoad "session.data"): this stream's follows, subs, bits and tips. */
export const CHAT_GOAL_SESSION_KEYS: Record<Exclude<ChatGoalKind, "none">, readonly [string, string]> = {
  follow: ["follower-session", "count"],
  sub: ["subscriber-session", "count"],
  bits: ["cheer-session", "amount"],
  tip: ["tip-session", "amount"],
};

/** How much an event moves a goal: a gift bomb counts every gifted sub, a cheer its bits, a tip its amount. */
export function chatGoalAmount(event: ChatStreamEvent, goal: ChatGoalKind): number {
  switch (goal) {
    case "follow": return event.kind === "follow" ? 1 : 0;
    case "sub": return event.kind === "sub" ? 1 : event.kind === "gift" ? (event.bulk ? event.amount : 1) : 0;
    case "bits": return event.kind === "cheer" ? event.amount : 0;
    case "tip": return event.kind === "tip" ? event.amount : 0;
    case "none": return 0;
  }
}

export function chatGoalDefaultLabel(goal: Exclude<ChatGoalKind, "none">, labels: ChatEventLabels): string {
  switch (goal) {
    case "follow": return labels.goalFollow;
    case "sub": return labels.goalSub;
    case "bits": return labels.goalBits;
    case "tip": return labels.goalTip;
  }
}

export type ChatGoalProgress = { label: string; text: string; percent: number; done: boolean };

/** Title, "3 / 10" and the filled share of the goal bar (tips with the channel currency). */
export function chatGoalProgress(
  config: Pick<CameraChatConfig, "goalKind" | "goalTarget" | "goalText">,
  count: number,
  labels: ChatEventLabels,
  currency: string,
): ChatGoalProgress | null {
  if (config.goalKind === "none") return null;
  const target = Math.max(1, config.goalTarget);
  const format = (value: number) => (config.goalKind === "tip" ? formatChatTip(value, currency) : String(Math.floor(value)));
  return {
    label: config.goalText || chatGoalDefaultLabel(config.goalKind, labels),
    text: `${format(count)} / ${format(target)}`,
    percent: Math.min(100, Math.floor((count / target) * 100)),
    done: count >= target,
  };
}

// --- Hype meter -----------------------------------------------------------------------------------------------------

/** The meter counts the last 20 seconds; a message is one point, a shown event five. */
export const CHAT_HYPE_WINDOW_MS = 20_000;
export const CHAT_HYPE_EVENT_WEIGHT = 5;

export type ChatHypeHit = { at: number; weight: number };

export function chatHypePercent(hits: readonly ChatHypeHit[], now: number, target: number): number {
  let sum = 0;
  for (const hit of hits) if (hit.at <= now && now - hit.at < CHAT_HYPE_WINDOW_MS) sum += hit.weight;
  return Math.min(100, Math.floor((sum / Math.max(1, target)) * 100));
}

// --- Event confetti -------------------------------------------------------------------------------------------------

export const CHAT_CONFETTI_COLORS: readonly string[] = ["#f472b6", "#facc15", "#38bdf8", "#a855f7", "#22c55e", "#fb923c"];

export type ChatConfettiPiece = { x: string; y: string; r: string; d: string; color: string };

/** Fourteen pieces that fly from the event icon across the row; fixed, so both renderers draw the same burst. */
export function chatConfettiPieces(): ChatConfettiPiece[] {
  return Array.from({ length: 14 }, (_, index) => ({
    x: `${22 + ((index * 37) % 74)}%`,
    y: `${index % 2 ? 6 + ((index * 13) % 30) : 62 + ((index * 17) % 30)}%`,
    r: `${180 + ((index * 47) % 360)}deg`,
    d: `${(index * 45) % 420}ms`,
    color: CHAT_CONFETTI_COLORS[index % CHAT_CONFETTI_COLORS.length]!,
  }));
}

// --- CSS ------------------------------------------------------------------------------------------------------------

function rgba(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/**
 * Event rows, reply lines and the points highlight for both renderers (`row` is the message row selector). Each kind
 * sets its colour variables, so no colour-mix() is needed (older OBS versions lack it).
 */
export function getChatEventCss(
  config: Pick<CameraChatConfig, "streamEvents" | "eventStyle" | "bubbleRadius" | "showReplies" | "textAlign" | "textColor" | "textOpacity" | "eventConfetti">,
  row: string,
): string {
  const rules: string[] = [];
  if (config.showReplies) {
    rules.push(`.chat-reply { display: block; overflow: hidden; margin-bottom: 1px; font-size: .78em; line-height: 1.35; opacity: .72; white-space: nowrap; text-overflow: ellipsis; }`);
    rules.push(`.chat-reply-name { font-weight: 800; }`);
  }
  if (!config.streamEvents) return rules.join("\n");
  const side = config.textAlign === "right" ? -3 : 3;
  for (const kind of CHAT_EVENT_KINDS) {
    const color = CHAT_EVENT_COLORS[kind];
    rules.push(`${row}.chat-event-${kind} { --chat-event: ${color}; --chat-event-soft: ${rgba(color, 0.34)}; --chat-event-faint: ${rgba(color, 0.08)}; }`);
  }
  rules.push(`${row}.chat-event { position: relative; overflow: hidden; align-self: stretch; max-width: none; align-items: center; gap: 10px; border-radius: ${config.bubbleRadius}px; }`);
  rules.push(`${row}.chat-event::before { display: none; }`);
  rules.push(`.chat-event-icon { display: grid; flex: none; place-items: center; width: 1.9em; height: 1.9em; border-radius: 50%; background: var(--chat-event); color: #0b1020; font-weight: 900; line-height: 1; }`);
  rules.push(`.chat-event-body { min-width: 0; color: ${rgba(config.textColor, config.textOpacity / 100)}; }`);
  rules.push(`.chat-event-title { display: block; overflow-wrap: anywhere; font-weight: 600; }`);
  rules.push(`.chat-event-name { color: var(--chat-event); font-weight: 900; }`);
  rules.push(`.chat-event-tag { display: inline-block; margin: 0 6px; padding: 0 5px; border-radius: 4px; background: var(--chat-event); color: #0b1020; font-size: .72em; font-weight: 900; line-height: 1.5; vertical-align: middle; }`);
  rules.push(`.chat-event-text { display: block; overflow-wrap: anywhere; opacity: .86; }`);
  if (config.eventStyle === "banner") {
    rules.push(`${row}.chat-event-banner { background: linear-gradient(90deg, var(--chat-event-soft), var(--chat-event-faint)); box-shadow: inset ${side}px 0 0 var(--chat-event); }`);
    rules.push(`${row}.chat-event-banner::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.28) 50%, transparent 70%); transform: translateX(-120%); animation: chat-event-shine 1.1s ease-out .25s 1 forwards; pointer-events: none; }`);
    rules.push(`@keyframes chat-event-shine { from { transform: translateX(-120%); } to { transform: translateX(120%); } }`);
  } else if (config.eventStyle === "glow") {
    rules.push(`${row}.chat-event-glow { background: rgba(8, 10, 24, .55); border: 1.5px solid var(--chat-event); box-shadow: 0 0 12px var(--chat-event-soft), inset 0 0 12px var(--chat-event-faint); }`);
    rules.push(`${row}.chat-event-glow::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 18px var(--chat-event); opacity: 0; animation: chat-event-pulse 1.3s ease-in-out .2s 2; pointer-events: none; }`);
    rules.push(`@keyframes chat-event-pulse { 50% { opacity: 1; } }`);
  } else {
    rules.push(`${row}.chat-event-compact { background: transparent; box-shadow: none; font-size: .92em; }`);
    rules.push(`${row}.chat-event-compact .chat-event-icon { width: auto; height: auto; background: none; color: var(--chat-event); }`);
  }
  if (config.eventConfetti) {
    rules.push(`.chat-confetti { position: absolute; left: 1.2em; top: 50%; width: 6px; height: 9px; border-radius: 1px; opacity: 0; pointer-events: none; animation: chat-confetti-fly 1.3s cubic-bezier(.15,.7,.3,1) var(--d) 1 both; }`);
    rules.push(`@keyframes chat-confetti-fly { 0% { left: 1.2em; top: 50%; opacity: 0; transform: rotate(0deg) scale(1); } 6% { opacity: 1; } 100% { left: var(--x); top: var(--y); opacity: 0; transform: rotate(var(--r)) scale(.7); } }`);
  }
  rules.push(`@media (prefers-reduced-motion: reduce) { ${row}.chat-event::after { animation: none !important; opacity: 0; } .chat-confetti { display: none; } }`);
  return rules.join("\n");
}
