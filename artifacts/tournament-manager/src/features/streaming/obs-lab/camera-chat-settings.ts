import {
  type CameraChatEventStyle,
  type ChatEventKind,
  type ChatGoalKind,
  CHAT_EVENT_KINDS,
  CHAT_EVENT_STYLES,
  CHAT_GOAL_KINDS,
} from "./chat-events";
import { type ChatSoundMode, type ChatSoundStyle, CHAT_SOUND_MODES, CHAT_SOUND_STYLES } from "./chat-sound";

export type CameraChatLayout = "right" | "left" | "below" | "above" | "overlay" | "chat";
export type CameraChatAspectRatio = "16:9" | "4:3" | "1:1";
export type CameraChatFontSize = "small" | "medium" | "large" | "custom";
export type CameraChatDensity = "compact" | "normal" | "relaxed";
export type CameraChatAnchor = "top" | "bottom";
export type CameraChatMotionPreset = "rise" | "slide" | "pop" | "fade" | "bounce" | "flip" | "wipe";
export type CameraChatAnimationStyle = CameraChatMotionPreset | "random";
export type CameraChatFontFamily =
  | "inter"
  | "system"
  | "segoe"
  | "arial"
  | "verdana"
  | "trebuchet"
  | "georgia"
  | "mono"
  | "impact"
  | "comic"
  | "bahnschrift"
  | "arialblack"
  | "tahoma"
  | "calibri"
  | "cambria"
  | "franklin"
  | "times"
  | "courier"
  | "lucida"
  | "palatino"
  | "segoeprint"
  | "custom";
export type CameraChatTextShadow = "none" | "soft" | "strong" | "outline";
export type CameraChatMessageLayout = "inline" | "stacked" | "bubble";
export type CameraChatAlign = "left" | "right";
export type CameraChatNameColorMode = "user" | "palette" | "single";
export type CameraChatExitStyle = "fade" | "slide" | "shrink" | "none";
/** A one-time accent on a message when it arrives, in the viewer's name colour. */
export type CameraChatMessageEffect = "none" | "glow" | "shine" | "pulse" | "flash";
/** How the message text appears after the bubble enters. */
export type CameraChatTextReveal = "none" | "typewriter" | "words";
/** The look and motion of the frame drawn around the chat panel. */
export type CameraChatFrameStyle =
  | "none" | "solid" | "gradient" | "pulse" | "glow" | "flow" | "rotate" | "rainbow" | "dashes" | "corners";
/** Motion of the chat itself (the frame stays where it is). */
export type CameraChatPanelAnimation = "none" | "float" | "breathe" | "shimmer" | "intro";
/** Palette for viewers without their own colour (and for palette mode). */
export type CameraChatNamePalette = "classic" | "pastel" | "neon" | "warm" | "cool";
/** Particles floating behind the messages. */
export type CameraChatAmbient = "none" | "snow" | "sparkles" | "hearts" | "bubbles" | "stars" | "confetti";
export type CameraChatHeaderStyle = "none" | "bar" | "pill" | "minimal";
export type CameraChatBubbleShape = "rounded" | "tail" | "skew" | "outline" | "underline";

export const CHAT_MOTION_PRESETS: readonly CameraChatMotionPreset[] =
  ["rise", "slide", "pop", "fade", "bounce", "flip", "wipe"];

export const CHAT_LAYOUTS: readonly CameraChatLayout[] = ["right", "left", "below", "above", "overlay", "chat"];
export const CHAT_FONT_FAMILIES: readonly CameraChatFontFamily[] = [
  "inter", "system", "segoe", "arial", "verdana", "trebuchet", "georgia", "mono", "impact", "comic",
  "bahnschrift", "arialblack", "tahoma", "calibri", "cambria", "franklin", "times", "courier", "lucida", "palatino",
  "segoeprint", "custom",
];
export const CHAT_OVERLAY_POSITIONS: readonly CameraChatOverlayPosition[] = [
  "top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right",
];
export const CHAT_FRAME_STYLES: readonly CameraChatFrameStyle[] =
  ["none", "solid", "gradient", "pulse", "glow", "flow", "rotate", "rainbow", "dashes", "corners"];
export const CHAT_PANEL_ANIMATIONS: readonly CameraChatPanelAnimation[] = ["none", "float", "breathe", "shimmer", "intro"];
export const CHAT_NAME_PALETTE_IDS: readonly CameraChatNamePalette[] = ["classic", "pastel", "neon", "warm", "cool"];
export const CHAT_AMBIENTS: readonly CameraChatAmbient[] = ["none", "snow", "sparkles", "hearts", "bubbles", "stars", "confetti"];
export const CHAT_HEADER_STYLES: readonly CameraChatHeaderStyle[] = ["none", "bar", "pill", "minimal"];
export const CHAT_BUBBLE_SHAPES: readonly CameraChatBubbleShape[] = ["rounded", "tail", "skew", "outline", "underline"];
export const CHAT_TEXT_SHADOW_STYLES: readonly CameraChatTextShadow[] = ["none", "soft", "strong", "outline"];
export const CHAT_MESSAGE_LAYOUTS: readonly CameraChatMessageLayout[] = ["inline", "stacked", "bubble"];
export const CHAT_NAME_COLOR_MODES: readonly CameraChatNameColorMode[] = ["user", "palette", "single"];
export const CHAT_EXIT_STYLES: readonly CameraChatExitStyle[] = ["fade", "slide", "shrink", "none"];
export const CHAT_MESSAGE_EFFECTS: readonly CameraChatMessageEffect[] = ["none", "glow", "shine", "pulse", "flash"];
export const CHAT_TEXT_REVEALS: readonly CameraChatTextReveal[] = ["none", "typewriter", "words"];

/** Same hash in the React preview, the OBS page and the exported StreamElements script. */
export function chatHash(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(hash, 31) + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Pick a stable visual motion for each message, not a new one on every render. */
export function pickChatMotion(key: string): CameraChatMotionPreset {
  return CHAT_MOTION_PRESETS[chatHash(key) % CHAT_MOTION_PRESETS.length];
}

export function resolveChatMotion(style: CameraChatAnimationStyle, key: string): CameraChatMotionPreset {
  return style === "random" ? pickChatMotion(key) : style;
}
export type CameraChatOverlayPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type CameraChatConfig = {
  layout: CameraChatLayout;
  aspectRatio: CameraChatAspectRatio;

  cameraWidth: number;
  chatWidth: number;
  belowHeight: number;
  /** "chat" layout: the chat box alone, without a camera frame. */
  chatOnlyWidth: number;
  chatOnlyHeight: number;

  maxMessages: number;

  fontSize: CameraChatFontSize;
  /** Used when fontSize is "custom". */
  fontSizePx: number;
  fontFamily: CameraChatFontFamily;
  /** A font installed on the streaming computer, used when fontFamily is "custom". */
  customFont: string;
  density: CameraChatDensity;

  panelColor: string;
  panelOpacity: number;
  /** A two-colour panel background (panelColor → panelColor2). */
  panelGradient: boolean;
  panelColor2: string;
  panelGradientAngle: number;
  radius: number;
  gap: number;
  innerPadding: number;

  /** Frame drawn around the chat panel, with its own colours, width and cycle time. */
  frameStyle: CameraChatFrameStyle;
  frameWidth: number;
  frameColor: string;
  frameColor2: string;
  /** Seconds of one animation cycle of the frame. */
  frameSpeed: number;
  panelAnimation: CameraChatPanelAnimation;
  ambient: CameraChatAmbient;
  ambientDensity: number;
  ambientColor: string;
  /** Header above the messages: a title typed by the streamer, an optional pulsing "live" dot. */
  headerStyle: CameraChatHeaderStyle;
  headerText: string;
  headerLive: boolean;
  headerColor: string;
  /** A fixed line under the header (rules, a command); empty = none. */
  pinnedText: string;
  bubbleShape: CameraChatBubbleShape;

  chatAnchor: CameraChatAnchor;
  newestFirst: boolean;
  textAlign: CameraChatAlign;
  messageLayout: CameraChatMessageLayout;

  overlayPosition: CameraChatOverlayPosition;
  overlayInset: number;

  fitChatHeight: boolean;

  textColor: string;
  textOpacity: number;
  textShadow: CameraChatTextShadow;
  textBold: boolean;

  nameColorMode: CameraChatNameColorMode;
  nameColor: string;
  namePalette: CameraChatNamePalette;
  readableNames: boolean;
  showColon: boolean;
  nameUppercase: boolean;

  showAvatars: boolean;
  showBorders: boolean;
  messageBackground: boolean;
  bubbleColor: string;
  bubbleOpacity: number;
  bubbleRadius: number;
  accentBar: boolean;
  fadeOldMessages: boolean;

  showBadges: boolean;
  showEmotes: boolean;
  emoteScale: number;
  emoteOnlyLarge: boolean;

  /** Seconds a message stays on screen; 0 keeps it until newer ones push it out. */
  messageLifetime: number;
  /** Characters; 0 = no limit. */
  maxMessageLength: number;
  hideCommands: boolean;
  hideLinks: boolean;
  /** Comma separated names (bots) whose messages are never shown. */
  ignoredUsers: string;
  /** Comma separated words or phrases that highlight a message. */
  highlightWords: string;
  highlightColor: string;
  /** Broadcaster, moderators and VIPs get a tint and bar in their badge colour. */
  roleHighlight: boolean;
  /** A "NEW" tag and tint on someone's first message in the channel (Twitch "first-msg"). */
  firstTimeHighlight: boolean;
  /** Emotes of a new message float up above it. */
  emoteBurst: boolean;
  /** Follows, subs, gifts, cheers, raids and tips as rows in the chat (StreamElements events). */
  streamEvents: boolean;
  eventKinds: ChatEventKind[];
  eventStyle: CameraChatEventStyle;
  /** Cheers below this many bits get no row. */
  eventMinBits: number;
  /** Twitch "Highlight my message" (channel points) gets a purple tint. */
  pointsHighlight: boolean;
  /** A short line with the message a viewer replied to. */
  showReplies: boolean;
  /** Calm chat: at most this many messages a second reach the screen (0 = off); events are never held back. */
  floodLimit: number;
  /** A bar under the header that fills with follows, subs, bits or tips. */
  goalKind: ChatGoalKind;
  goalTarget: number;
  /** Where the bar starts (for example the count from the last stream). */
  goalStart: number;
  /** Own title of the bar; empty = the default title for the goal. */
  goalText: string;
  /** A bar that fills when the chat gets busy. */
  hypeMeter: boolean;
  /** Messages in 20 seconds that fill the hype bar. */
  hypeTarget: number;
  /** Confetti flies across a new event row. */
  eventConfetti: boolean;
  sound: ChatSoundMode;
  soundStyle: ChatSoundStyle;
  soundVolume: number;

  animateMessages: boolean;
  animationStyle: CameraChatAnimationStyle;
  animationDurationMs: number;
  exitStyle: CameraChatExitStyle;
  newMessageEffect: CameraChatMessageEffect;
  textReveal: CameraChatTextReveal;
};

export const DEFAULT_CAMERA_CHAT_CONFIG: CameraChatConfig = {
  layout: "right",
  aspectRatio: "16:9",

  cameraWidth: 640,
  chatWidth: 32,
  belowHeight: 150,
  chatOnlyWidth: 420,
  chatOnlyHeight: 520,

  maxMessages: 5,

  fontSize: "medium",
  fontSizePx: 18,
  fontFamily: "inter",
  customFont: "",
  density: "normal",

  panelColor: "#020617",
  panelOpacity: 72,
  panelGradient: false,
  panelColor2: "#1e1b4b",
  panelGradientAngle: 160,
  radius: 22,
  gap: 0,
  innerPadding: 12,

  frameStyle: "none",
  frameWidth: 3,
  frameColor: "#a78bfa",
  frameColor2: "#22d3ee",
  frameSpeed: 4,
  panelAnimation: "none",
  ambient: "none",
  ambientDensity: 16,
  ambientColor: "#ffffff",
  headerStyle: "none",
  headerText: "",
  headerLive: false,
  headerColor: "#8b5cf6",
  pinnedText: "",
  bubbleShape: "rounded",

  chatAnchor: "bottom",
  newestFirst: false,
  textAlign: "left",
  messageLayout: "inline",

  overlayPosition: "bottom-right",
  overlayInset: 14,

  fitChatHeight: true,

  textColor: "#ffffff",
  textOpacity: 85,
  textShadow: "none",
  textBold: false,

  nameColorMode: "user",
  nameColor: "#a78bfa",
  namePalette: "classic",
  readableNames: true,
  showColon: false,
  nameUppercase: false,

  showAvatars: false,
  showBorders: true,
  messageBackground: true,
  bubbleColor: "#ffffff",
  bubbleOpacity: 5.5,
  bubbleRadius: 12,
  accentBar: false,
  fadeOldMessages: true,

  showBadges: true,
  showEmotes: true,
  emoteScale: 140,
  emoteOnlyLarge: true,

  messageLifetime: 0,
  maxMessageLength: 0,
  hideCommands: false,
  hideLinks: false,
  ignoredUsers: "",
  highlightWords: "",
  highlightColor: "#facc15",
  roleHighlight: false,
  firstTimeHighlight: false,
  emoteBurst: false,
  streamEvents: false,
  eventKinds: [...CHAT_EVENT_KINDS],
  eventStyle: "banner",
  eventMinBits: 1,
  pointsHighlight: false,
  showReplies: false,
  floodLimit: 0,
  goalKind: "none",
  goalTarget: 10,
  goalStart: 0,
  goalText: "",
  hypeMeter: false,
  hypeTarget: 20,
  eventConfetti: false,
  sound: "none",
  soundStyle: "ding",
  soundVolume: 50,

  animateMessages: true,
  animationStyle: "rise",
  animationDurationMs: 220,
  exitStyle: "fade",
  newMessageEffect: "none",
  textReveal: "none",
};

/** Bots that most channels hide from an on-stream chat. */
export const COMMON_CHAT_BOTS: readonly string[] =
  ["streamelements", "nightbot", "moobot", "streamlabs", "fossabot", "wizebot", "botrixoficial", "sery_bot"];

// --- Text ---------------------------------------------------------------------------------------------------------

const FONT_STACKS: Record<Exclude<CameraChatFontFamily, "custom">, string> = {
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  system: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
  segoe: "\"Segoe UI\", Tahoma, Geneva, sans-serif",
  arial: "Arial, Helvetica, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  trebuchet: "\"Trebuchet MS\", Tahoma, sans-serif",
  georgia: "Georgia, \"Times New Roman\", serif",
  mono: "\"Cascadia Mono\", Consolas, \"Courier New\", monospace",
  impact: "Impact, Haettenschweiler, \"Arial Narrow Bold\", sans-serif",
  comic: "\"Comic Sans MS\", \"Comic Neue\", cursive",
  bahnschrift: "Bahnschrift, \"DIN Alternate\", \"Segoe UI\", sans-serif",
  arialblack: "\"Arial Black\", \"Arial Bold\", Gadget, sans-serif",
  tahoma: "Tahoma, Verdana, Segoe, sans-serif",
  calibri: "Calibri, Candara, Segoe, \"Segoe UI\", sans-serif",
  cambria: "Cambria, Georgia, serif",
  franklin: "\"Franklin Gothic Medium\", \"Arial Narrow\", Arial, sans-serif",
  times: "\"Times New Roman\", Times, serif",
  courier: "\"Courier New\", Courier, monospace",
  lucida: "\"Lucida Console\", Monaco, monospace",
  palatino: "\"Palatino Linotype\", Palatino, \"Book Antiqua\", serif",
  segoeprint: "\"Segoe Print\", \"Bradley Hand\", cursive",
};

/** Text typed by the streamer (header, pinned line): one line, no control characters, bounded. Shown as text only. */
export function cleanChatText(raw: string, maxLength: number): string {
  return Array.from(raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()).slice(0, maxLength).join("");
}

/** Letters, digits, spaces, "-" and "_" only, so a typed font name can never break out of the CSS it is put into. */
export function sanitizeFontName(raw: string): string {
  return raw.replace(/[^\p{L}\p{N} _-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function chatFontFamily(config: Pick<CameraChatConfig, "fontFamily" | "customFont">): string {
  if (config.fontFamily === "custom") {
    const name = sanitizeFontName(config.customFont);
    return name ? `"${name}", ${FONT_STACKS.inter}` : FONT_STACKS.inter;
  }
  return FONT_STACKS[config.fontFamily] ?? FONT_STACKS.inter;
}

export function chatFontPx(config: Pick<CameraChatConfig, "fontSize" | "fontSizePx">): number {
  if (config.fontSize === "small") return 12;
  if (config.fontSize === "large") return 16;
  if (config.fontSize === "custom") return config.fontSizePx;
  return 14;
}

/** 20px for the three classic sizes (as before), growing with bigger custom text. */
export function chatLineHeightPx(config: Pick<CameraChatConfig, "fontSize" | "fontSizePx">): number {
  return Math.max(20, Math.round(chatFontPx(config) * 1.25));
}

export function chatAvatarPx(config: Pick<CameraChatConfig, "fontSize" | "fontSizePx">): number {
  return Math.max(28, Math.round(chatLineHeightPx(config) * 1.4));
}

export function chatBadgePx(config: Pick<CameraChatConfig, "fontSize" | "fontSizePx">): number {
  return Math.round(chatLineHeightPx(config) * 0.9);
}

export function chatEmotePx(config: Pick<CameraChatConfig, "fontSize" | "fontSizePx" | "emoteScale">): number {
  return Math.round(chatLineHeightPx(config) * config.emoteScale / 100);
}

export const CHAT_TEXT_SHADOWS: Record<CameraChatTextShadow, string> = {
  none: "none",
  soft: "0 1px 3px rgba(0,0,0,.65)",
  strong: "0 2px 4px rgba(0,0,0,.95), 0 0 2px rgba(0,0,0,.95)",
  outline: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px #000",
};

export function chatDensityPadding(density: CameraChatDensity): string {
  return density === "compact" ? "6px 10px" : density === "relaxed" ? "12px 16px" : "8px 12px";
}

export function chatDensityGap(density: CameraChatDensity): number {
  return density === "compact" ? 4 : density === "relaxed" ? 16 : 8;
}

// --- Colours ------------------------------------------------------------------------------------------------------

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** "#rrggbb" (lower case) or the fallback; accepts the value with or without "#". */
export function normalizeHexColor(raw: string | null | undefined, fallback: string): string {
  const value = (raw ?? "").trim();
  if (!value) return fallback;
  const hex = value.startsWith("#") ? value : `#${value}`;
  return HEX_COLOR.test(hex) ? hex.toLowerCase() : fallback;
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgbaCss(hex: string, opacityPercent: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.round(opacityPercent * 10) / 1000})`;
}

/** Lifts a too-dark viewer colour (for example Twitch "#0000FF") towards white until it reads on a dark panel. */
export function readableNameColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luma >= 0.5) return hex;
  const mix = (0.5 - luma) / (1 - luma);
  const lift = (channel: number) => Math.round(channel + (255 - channel) * mix).toString(16).padStart(2, "0");
  return `#${lift(r)}${lift(g)}${lift(b)}`;
}

export const CHAT_NAME_PALETTES: Record<CameraChatNamePalette, readonly string[]> = {
  classic: ["#fb7185", "#34d399", "#a78bfa", "#38bdf8", "#fbbf24", "#22d3ee", "#f472b6", "#a3e635"],
  pastel: ["#fecdd3", "#bbf7d0", "#ddd6fe", "#bae6fd", "#fde68a", "#a5f3fc", "#fbcfe8", "#d9f99d"],
  neon: ["#ff2d95", "#39ff14", "#bc13fe", "#00e5ff", "#fff01f", "#ff6b00", "#00ffa3", "#ff3131"],
  warm: ["#f97316", "#facc15", "#fb7185", "#f59e0b", "#ef4444", "#fdba74", "#e11d48", "#fcd34d"],
  cool: ["#38bdf8", "#818cf8", "#22d3ee", "#a78bfa", "#2dd4bf", "#60a5fa", "#c084fc", "#5eead4"],
};

/** The classic palette (the colours used before palettes were selectable). */
export const CHAT_NAME_PALETTE: readonly string[] = CHAT_NAME_PALETTES.classic;

/** A viewer keeps one palette colour for the whole stream (it does not shift when new messages arrive). */
export function chatPaletteColor(name: string, palette: CameraChatNamePalette = "classic"): string {
  const colors = CHAT_NAME_PALETTES[palette] ?? CHAT_NAME_PALETTE;
  return colors[chatHash(name.toLowerCase()) % colors.length];
}

export function resolveChatNameColor(
  message: { name: string; color?: string },
  config: Pick<CameraChatConfig, "nameColorMode" | "nameColor" | "readableNames"> & { namePalette?: CameraChatNamePalette },
): string {
  if (config.nameColorMode === "single") return config.nameColor;
  const own = config.nameColorMode === "user" ? normalizeHexColor(message.color, "") : "";
  if (!own) return chatPaletteColor(message.name, config.namePalette);
  return config.readableNames ? readableNameColor(own) : own;
}

// --- Panel, placement and frame -----------------------------------------------------------------------------------

/** Panel background: one colour, or a two-colour gradient, with the panel opacity. */
export function chatPanelBackground(
  config: Pick<CameraChatConfig, "panelColor" | "panelOpacity" | "panelGradient" | "panelColor2" | "panelGradientAngle">,
): string {
  if (!config.panelGradient) return rgbaCss(config.panelColor, config.panelOpacity);
  return `linear-gradient(${config.panelGradientAngle}deg, ${rgbaCss(config.panelColor, config.panelOpacity)}, ${rgbaCss(config.panelColor2, config.panelOpacity)})`;
}

/** The chat panel gets its own rounded corners only when it has a frame (the classic look is unchanged). */
export function chatPanelRadius(config: Pick<CameraChatConfig, "frameStyle" | "layout" | "radius">): number | null {
  if (config.frameStyle === "none") return null;
  return config.layout === "overlay" ? Math.max(6, config.radius * 0.7) : config.radius;
}

export type ChatPlacement = { top?: string; bottom?: string; left?: string; right?: string; transform?: string };

/** Where the chat box sits on the camera: corners, the middle of an edge, with the same inset in both renderers. */
export function chatOverlayPlacement(position: CameraChatOverlayPosition, inset: number): ChatPlacement {
  const [vertical, horizontal] = position.split("-") as ["top" | "middle" | "bottom", "left" | "center" | "right"];
  const placement: ChatPlacement = {};
  if (vertical === "top") placement.top = `${inset}px`;
  else if (vertical === "bottom") placement.bottom = `${inset}px`;
  else {
    placement.top = "50%";
    placement.transform = "translateY(-50%)";
  }
  if (horizontal === "left") placement.left = `${inset}px`;
  else if (horizontal === "right") placement.right = `${inset}px`;
  else {
    placement.left = "50%";
    placement.transform = "translateX(-50%)";
  }
  return placement;
}

const RAINBOW = "#ff3d6e 0, #ffb13d 40px, #f9ff3d 70px, #3dff8a 100px, #3dc8ff 135px, #9b3dff 170px, #ff3d6e 200px";
const RING_MASK = "-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);";

/**
 * CSS of the frame around the chat panel and of the chat's own motion, shared by the React preview and the
 * StreamElements widget. The frame is a ::before ring (masked to the border, so a transparent panel stays
 * transparent); the "glow" frame also breathes an inset glow; float moves the message list, breathe and shimmer
 * use the panel's ::after. Only valid, bounded configuration values are written in.
 */
export function getChatFrameCss(
  config: Pick<CameraChatConfig, "frameStyle" | "frameWidth" | "frameColor" | "frameColor2" | "frameSpeed" | "panelAnimation" | "layout" | "radius">,
  panelSelector: string,
  listSelector: string,
): string {
  const rules: string[] = [];
  const style = config.frameStyle;
  const speed = `${config.frameSpeed}s`;
  const c1 = config.frameColor;
  const c2 = config.frameColor2;
  const panelAnimations: string[] = [];
  const radius = chatPanelRadius(config);
  if (style !== "none" || config.panelAnimation !== "none") {
    rules.push(`${panelSelector} { position: relative;${radius === null ? "" : ` border-radius: ${radius}px;`} }`);
  }
  if (style !== "none") {
    const ring: Record<Exclude<CameraChatFrameStyle, "none" | "corners">, string> = {
      solid: `background: ${c1};`,
      gradient: `background: linear-gradient(135deg, ${c1}, ${c2});`,
      pulse: `background: ${c1}; animation: chat-frame-pulse ${speed} ease-in-out infinite;`,
      glow: `background: ${c1};`,
      flow: `background: repeating-linear-gradient(90deg, ${c1} 0, ${c2} 100px, ${c1} 200px); animation: chat-frame-flow ${speed} linear infinite;`,
      rotate: `background: conic-gradient(from var(--chat-frame-angle), ${c1}, ${c2}, ${c1}); animation: chat-frame-rotate ${speed} linear infinite;`,
      rainbow: `background: repeating-linear-gradient(90deg, ${RAINBOW}); animation: chat-frame-flow ${speed} linear infinite;`,
      dashes: `background: repeating-linear-gradient(45deg, ${c1} 0 10px, transparent 10px 20px); animation: chat-frame-dashes ${speed} linear infinite;`,
    };
    const base = `content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 1;`;
    if (style === "corners") {
      const arm = `linear-gradient(${c1}, ${c1})`;
      const width = `${config.frameWidth}px`;
      rules.push(
        `${panelSelector}::before { ${base} background: ${arm} top left / 22px ${width}, ${arm} top left / ${width} 22px, ${arm} top right / 22px ${width}, ${arm} top right / ${width} 22px, ${arm} bottom left / 22px ${width}, ${arm} bottom left / ${width} 22px, ${arm} bottom right / 22px ${width}, ${arm} bottom right / ${width} 22px; background-repeat: no-repeat; animation: chat-frame-corners ${speed} ease-in-out infinite; }`,
        "@keyframes chat-frame-corners { 0%, 100% { inset: 0; opacity: 1; } 50% { inset: 4px; opacity: .55; } }",
      );
    } else {
      rules.push(`${panelSelector}::before { ${base} padding: ${config.frameWidth}px; ${RING_MASK} ${ring[style]} }`);
    }
    if (style === "pulse") rules.push("@keyframes chat-frame-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }");
    if (style === "flow" || style === "rainbow") rules.push("@keyframes chat-frame-flow { from { background-position: 0 0; } to { background-position: 200px 0; } }");
    if (style === "dashes") rules.push("@keyframes chat-frame-dashes { from { background-position: 0 0; } to { background-position: 28.28px 0; } }");
    if (style === "rotate") {
      rules.push(
        "@property --chat-frame-angle { syntax: \"<angle>\"; inherits: false; initial-value: 0deg; }",
        "@keyframes chat-frame-rotate { to { --chat-frame-angle: 360deg; } }",
      );
    }
    if (style === "glow") {
      panelAnimations.push(`chat-frame-glow ${speed} ease-in-out infinite`);
      rules.push(`@keyframes chat-frame-glow { 0%, 100% { box-shadow: inset 0 0 6px ${c1}; } 50% { box-shadow: inset 0 0 26px ${c1}; } }`);
    }
  }
  const motion = config.panelAnimation;
  if (motion === "float") {
    rules.push(
      `${listSelector} { animation: chat-panel-float 6s ease-in-out infinite; }`,
      "@keyframes chat-panel-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }",
    );
  } else if (motion === "breathe") {
    rules.push(
      `${panelSelector}::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: rgba(255,255,255,.06); animation: chat-panel-breathe 5s ease-in-out infinite; }`,
      "@keyframes chat-panel-breathe { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }",
    );
  } else if (motion === "shimmer") {
    rules.push(
      `${panelSelector}::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.13) 50%, transparent 60%); background-size: 300% 100%; animation: chat-panel-shimmer 7s ease-in-out infinite; }`,
      "@keyframes chat-panel-shimmer { 0% { background-position: 150% 0; } 30%, 100% { background-position: -50% 0; } }",
    );
  } else if (motion === "intro") {
    panelAnimations.push("chat-panel-intro 700ms cubic-bezier(.2,.7,.2,1) both");
    rules.push("@keyframes chat-panel-intro { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: none; } }");
  }
  if (panelAnimations.length) rules.push(`${panelSelector} { animation: ${panelAnimations.join(", ")}; }`);
  return rules.join("\n");
}

// --- Animation ----------------------------------------------------------------------------------------------------

// The same keyframes power the React chat preview and the standalone SE widget.
export function getCameraChatAnimationCss(
  style: CameraChatAnimationStyle,
  name: string,
): string {
  if (style === "random") {
    return CHAT_MOTION_PRESETS.map((preset) =>
      getCameraChatAnimationCss(preset, `${name}-${preset}`),
    ).join("\n");
  }
  const from: Record<CameraChatMotionPreset, string> = {
    rise: "opacity: 0; transform: translateY(14px) scale(.98);",
    slide: "opacity: 0; transform: translateX(-22px);",
    pop: "opacity: 0; transform: scale(.78);",
    fade: "opacity: 0; transform: none;",
    bounce: "opacity: 0; transform: translateY(24px) scale(.92);",
    flip: "opacity: 0; transform: perspective(360px) rotateX(-78deg); transform-origin: top center;",
    wipe: "opacity: 0; clip-path: inset(0 100% 0 0);",
  };
  if (style === "bounce") {
    return `@keyframes ${name} { 0% { ${from[style]} } 65% { opacity: 1; transform: translateY(-5px) scale(1.03); } 100% { opacity: 1; transform: none; } }`;
  }
  return `@keyframes ${name} { from { ${from[style]} } to { opacity: 1; transform: none; clip-path: inset(0 0 0 0); } }`;
}

/** Keyframes for a message that leaves after its lifetime. */
export function getCameraChatExitCss(style: CameraChatExitStyle, align: CameraChatAlign, name: string): string {
  const to: Record<CameraChatExitStyle, string> = {
    fade: "opacity: 0;",
    slide: `opacity: 0; transform: translateX(${align === "right" ? 28 : -28}px);`,
    shrink: "opacity: 0; transform: scale(.82);",
    none: "opacity: 0;",
  };
  return `@keyframes ${name} { to { ${to[style]} } }`;
}

export function chatExitMs(config: Pick<CameraChatConfig, "exitStyle" | "animationDurationMs">): number {
  return config.exitStyle === "none" ? 0 : Math.min(800, Math.max(150, config.animationDurationMs));
}

/** The new-message accent and the text reveal start halfway through the entry animation. */
export function chatRevealBaseMs(config: Pick<CameraChatConfig, "animateMessages" | "animationDurationMs">): number {
  return config.animateMessages ? Math.round(config.animationDurationMs * 0.5) : 0;
}

const MESSAGE_EFFECT_KEYFRAMES: Record<Exclude<CameraChatMessageEffect, "none">, string> = {
  glow: "@keyframes chat-fx-glow { 0% { opacity: 0; box-shadow: 0 0 0 0 var(--chat-fx); } 35% { opacity: 1; box-shadow: 0 0 18px 3px var(--chat-fx); } 100% { opacity: 0; box-shadow: 0 0 0 0 var(--chat-fx); } }",
  shine: "@keyframes chat-fx-shine { 0% { opacity: 1; background-position: 160% 0; } 90% { opacity: 1; background-position: -60% 0; } 100% { opacity: 0; background-position: -60% 0; } }",
  pulse: "@keyframes chat-fx-pulse { 0% { opacity: 1; box-shadow: 0 0 0 0 var(--chat-fx); } 100% { opacity: 0; box-shadow: 0 0 0 12px var(--chat-fx); } }",
  flash: "@keyframes chat-fx-flash { 0% { opacity: 0; } 25% { opacity: .38; } 100% { opacity: 0; } }",
};

/**
 * CSS of the new-message accent and of the text reveal, shared by the React preview and the StreamElements widget.
 * The accent is drawn by a ::after layer of the row, so it never replaces the row's own entry animation; its colour
 * comes from the row's --chat-fx variable (the viewer's name colour).
 */
export function getChatEffectCss(
  config: Pick<CameraChatConfig, "newMessageEffect" | "textReveal" | "animateMessages" | "animationDurationMs">,
  rowSelector: string,
): string {
  const rules: string[] = [];
  const effect = config.newMessageEffect;
  if (effect !== "none") {
    const layer = effect === "shine"
      ? " background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.5) 50%, transparent 65%); background-size: 250% 100%;"
      : effect === "flash" ? " background: var(--chat-fx);" : "";
    rules.push(
      `${rowSelector} { position: relative; }`,
      `${rowSelector}::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0;${layer} animation: chat-fx-${effect} 1100ms ease-out ${chatRevealBaseMs(config)}ms 1 both; }`,
      MESSAGE_EFFECT_KEYFRAMES[effect],
    );
  }
  if (config.textReveal !== "none") {
    rules.push(
      "@keyframes chat-reveal-type { from { opacity: 0; } to { opacity: 1; } }",
      "@keyframes chat-reveal-word { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }",
    );
  }
  return rules.join("\n");
}

// --- Size ---------------------------------------------------------------------------------------------------------

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

function numberParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = params.get(key);

  if (raw === null) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return clamp(value, min, max);
}

function integerParam(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  return Math.round(numberParam(params, key, fallback, min, max));
}

function booleanParam(
  params: URLSearchParams,
  key: string,
  fallback: boolean,
) {
  const raw = params.get(key);

  if (raw === null) {
    return fallback;
  }

  return raw === "1" || raw === "true";
}

function enumParam<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[], fallback: T): T {
  const raw = params.get(key);
  return raw !== null && (allowed as readonly string[]).includes(raw) ? raw as T : fallback;
}

/** Event kinds in their fixed order; a missing parameter means all kinds, an empty one none. */
function eventKindsParam(raw: string | null): ChatEventKind[] {
  if (raw === null) return [...CHAT_EVENT_KINDS];
  const picked = new Set(raw.split(",").map((item) => item.trim()));
  return CHAT_EVENT_KINDS.filter((kind) => picked.has(kind));
}

function textParam(params: URLSearchParams, key: string, fallback: string, maxLength: number) {
  const raw = params.get(key);
  return raw === null ? fallback : raw.slice(0, maxLength);
}

export function getCameraHeight(
  width: number,
  ratio: CameraChatAspectRatio,
) {
  if (ratio === "4:3") {
    return Math.round(width * 0.75);
  }

  if (ratio === "1:1") {
    return width;
  }

  return Math.round(width * 9 / 16);
}

export function getCameraChatSize(
  config: CameraChatConfig,
) {
  if (config.layout === "chat") {
    return {
      width: config.chatOnlyWidth,
      height: config.chatOnlyHeight,
      cameraHeight: 0,
      chatWidthPx: config.chatOnlyWidth,
    };
  }

  const cameraHeight =
    getCameraHeight(
      config.cameraWidth,
      config.aspectRatio,
    );

  const chatWidthPx =
    Math.round(
      config.cameraWidth *
        config.chatWidth /
        100,
    );

  if (config.layout === "right" || config.layout === "left") {
    return {
      width:
        config.cameraWidth +
        config.gap +
        chatWidthPx,
      height: cameraHeight,
      cameraHeight,
      chatWidthPx,
    };
  }

  if (config.layout === "below" || config.layout === "above") {
    return {
      width: config.cameraWidth,
      height:
        cameraHeight +
        config.gap +
        config.belowHeight,
      cameraHeight,
      chatWidthPx,
    };
  }

  return {
    width: config.cameraWidth,
    height: cameraHeight,
    cameraHeight,
    chatWidthPx,
  };
}

// --- URL ----------------------------------------------------------------------------------------------------------

export function cameraChatConfigToSearch(
  config: CameraChatConfig,
) {
  const params = new URLSearchParams();
  const flag = (key: string, value: boolean) => params.set(key, value ? "1" : "0");

  params.set("layout", config.layout);
  params.set("ratio", config.aspectRatio);
  params.set("cw", String(config.cameraWidth));
  params.set("chatw", String(config.chatWidth));
  params.set("belowh", String(config.belowHeight));
  params.set("solow", String(config.chatOnlyWidth));
  params.set("soloh", String(config.chatOnlyHeight));
  params.set("messages", String(config.maxMessages));
  params.set("font", config.fontSize);
  params.set("fontpx", String(config.fontSizePx));
  params.set("family", config.fontFamily);
  params.set("customfont", config.customFont);
  params.set("density", config.density);
  params.set("panelc", config.panelColor);
  params.set("opacity", String(config.panelOpacity));
  flag("panelgrad", config.panelGradient);
  params.set("panelc2", config.panelColor2);
  params.set("gradangle", String(config.panelGradientAngle));
  params.set("radius", String(config.radius));
  params.set("frame", config.frameStyle);
  params.set("framew", String(config.frameWidth));
  params.set("framec", config.frameColor);
  params.set("framec2", config.frameColor2);
  params.set("framespd", String(config.frameSpeed));
  params.set("panelanim", config.panelAnimation);
  params.set("ambient", config.ambient);
  params.set("ambientn", String(config.ambientDensity));
  params.set("ambientc", config.ambientColor);
  params.set("header", config.headerStyle);
  params.set("headertext", config.headerText);
  flag("headerlive", config.headerLive);
  params.set("headerc", config.headerColor);
  params.set("pinned", config.pinnedText);
  params.set("shape", config.bubbleShape);
  params.set("gap", String(config.gap));
  params.set("padding", String(config.innerPadding));
  params.set("anchor", config.chatAnchor);
  flag("newest", config.newestFirst);
  params.set("align", config.textAlign);
  params.set("msglayout", config.messageLayout);
  params.set("position", config.overlayPosition);
  params.set("inset", String(config.overlayInset));
  flag("fit", config.fitChatHeight);
  params.set("textc", config.textColor);
  params.set("texto", String(config.textOpacity));
  params.set("shadow", config.textShadow);
  flag("bold", config.textBold);
  params.set("namepal", config.namePalette);
  flag("nameupper", config.nameUppercase);
  params.set("namemode", config.nameColorMode);
  params.set("namec", config.nameColor);
  flag("readable", config.readableNames);
  flag("colon", config.showColon);
  flag("avatars", config.showAvatars);
  flag("borders", config.showBorders);
  flag("msgbg", config.messageBackground);
  params.set("bubblec", config.bubbleColor);
  params.set("bubbleo", String(config.bubbleOpacity));
  params.set("bubbler", String(config.bubbleRadius));
  flag("accent", config.accentBar);
  flag("fade", config.fadeOldMessages);
  flag("badges", config.showBadges);
  flag("emotes", config.showEmotes);
  params.set("emotescale", String(config.emoteScale));
  flag("emotebig", config.emoteOnlyLarge);
  params.set("lifetime", String(config.messageLifetime));
  params.set("maxlen", String(config.maxMessageLength));
  flag("nocmd", config.hideCommands);
  flag("nolinks", config.hideLinks);
  params.set("ignore", config.ignoredUsers);
  params.set("hl", config.highlightWords);
  params.set("hlc", config.highlightColor);
  flag("roles", config.roleHighlight);
  flag("firsttime", config.firstTimeHighlight);
  flag("burst", config.emoteBurst);
  flag("events", config.streamEvents);
  params.set("eventkinds", config.eventKinds.join(","));
  params.set("eventstyle", config.eventStyle);
  params.set("eventbits", String(config.eventMinBits));
  flag("points", config.pointsHighlight);
  flag("replies", config.showReplies);
  params.set("flood", String(config.floodLimit));
  params.set("goal", config.goalKind);
  params.set("goaltarget", String(config.goalTarget));
  params.set("goalstart", String(config.goalStart));
  params.set("goaltext", config.goalText);
  flag("hype", config.hypeMeter);
  params.set("hypemax", String(config.hypeTarget));
  flag("confetti", config.eventConfetti);
  params.set("sound", config.sound);
  params.set("soundstyle", config.soundStyle);
  params.set("soundvol", String(config.soundVolume));
  flag("anim", config.animateMessages);
  params.set("animstyle", config.animationStyle);
  params.set("animdur", String(config.animationDurationMs));
  params.set("exit", config.exitStyle);
  params.set("fx", config.newMessageEffect);
  params.set("reveal", config.textReveal);

  return params.toString();
}

/**
 * Reads a Browser Source query. Every value is validated and bounded; a parameter that is missing (an address made by
 * an older version) keeps the previous look, so overlays already added to OBS do not change.
 */
export function cameraChatConfigFromSearch(
  search: string,
): CameraChatConfig {
  const params = new URLSearchParams(
    search.startsWith("?")
      ? search.slice(1)
      : search,
  );

  const defaults =
    DEFAULT_CAMERA_CHAT_CONFIG;

  const animationRaw = params.get("animstyle");
  const animationStyle: CameraChatAnimationStyle =
    animationRaw !== null && (CHAT_MOTION_PRESETS as readonly string[]).includes(animationRaw)
      ? animationRaw as CameraChatMotionPreset
      : animationRaw === "random" ? "random" : "rise";

  const color = (key: string, fallback: string) => normalizeHexColor(params.get(key), fallback);

  return {
    layout: enumParam(params, "layout", CHAT_LAYOUTS, "right"),
    aspectRatio: enumParam(params, "ratio", ["16:9", "4:3", "1:1"] as const, "16:9"),

    cameraWidth: numberParam(params, "cw", defaults.cameraWidth, 240, 1920),
    chatWidth: numberParam(params, "chatw", defaults.chatWidth, 15, 70),
    belowHeight: numberParam(params, "belowh", defaults.belowHeight, 60, 500),
    chatOnlyWidth: integerParam(params, "solow", defaults.chatOnlyWidth, 160, 1920),
    chatOnlyHeight: integerParam(params, "soloh", defaults.chatOnlyHeight, 100, 1080),

    maxMessages: numberParam(params, "messages", defaults.maxMessages, 1, 20),

    fontSize: enumParam(params, "font", ["small", "medium", "large", "custom"] as const, "medium"),
    fontSizePx: integerParam(params, "fontpx", defaults.fontSizePx, 10, 48),
    fontFamily: enumParam(params, "family", CHAT_FONT_FAMILIES, defaults.fontFamily),
    customFont: sanitizeFontName(textParam(params, "customfont", defaults.customFont, 80)),
    density: enumParam(params, "density", ["compact", "normal", "relaxed"] as const, "normal"),

    panelColor: color("panelc", defaults.panelColor),
    panelOpacity: numberParam(params, "opacity", defaults.panelOpacity, 0, 100),
    panelGradient: booleanParam(params, "panelgrad", defaults.panelGradient),
    panelColor2: color("panelc2", defaults.panelColor2),
    panelGradientAngle: integerParam(params, "gradangle", defaults.panelGradientAngle, 0, 360),
    radius: numberParam(params, "radius", defaults.radius, 0, 80),
    frameStyle: enumParam(params, "frame", CHAT_FRAME_STYLES, defaults.frameStyle),
    frameWidth: integerParam(params, "framew", defaults.frameWidth, 1, 12),
    frameColor: color("framec", defaults.frameColor),
    frameColor2: color("framec2", defaults.frameColor2),
    frameSpeed: numberParam(params, "framespd", defaults.frameSpeed, 1, 20),
    panelAnimation: enumParam(params, "panelanim", CHAT_PANEL_ANIMATIONS, defaults.panelAnimation),
    ambient: enumParam(params, "ambient", CHAT_AMBIENTS, defaults.ambient),
    ambientDensity: integerParam(params, "ambientn", defaults.ambientDensity, 4, 40),
    ambientColor: color("ambientc", defaults.ambientColor),
    headerStyle: enumParam(params, "header", CHAT_HEADER_STYLES, defaults.headerStyle),
    headerText: cleanChatText(textParam(params, "headertext", defaults.headerText, 120), 40),
    headerLive: booleanParam(params, "headerlive", defaults.headerLive),
    headerColor: color("headerc", defaults.headerColor),
    pinnedText: cleanChatText(textParam(params, "pinned", defaults.pinnedText, 300), 120),
    bubbleShape: enumParam(params, "shape", CHAT_BUBBLE_SHAPES, defaults.bubbleShape),
    gap: numberParam(params, "gap", defaults.gap, 0, 100),
    innerPadding: numberParam(params, "padding", defaults.innerPadding, 0, 50),

    chatAnchor: enumParam(params, "anchor", ["top", "bottom"] as const, "bottom"),
    newestFirst: booleanParam(params, "newest", defaults.newestFirst),
    textAlign: enumParam(params, "align", ["left", "right"] as const, defaults.textAlign),
    messageLayout: enumParam(params, "msglayout", CHAT_MESSAGE_LAYOUTS, defaults.messageLayout),

    overlayPosition: enumParam(params, "position", CHAT_OVERLAY_POSITIONS, "bottom-right"),
    overlayInset: numberParam(params, "inset", defaults.overlayInset, 0, 100),

    fitChatHeight: booleanParam(params, "fit", defaults.fitChatHeight),

    textColor: color("textc", defaults.textColor),
    textOpacity: numberParam(params, "texto", defaults.textOpacity, 10, 100),
    textShadow: enumParam(params, "shadow", CHAT_TEXT_SHADOW_STYLES, defaults.textShadow),
    textBold: booleanParam(params, "bold", defaults.textBold),

    nameColorMode: enumParam(params, "namemode", CHAT_NAME_COLOR_MODES, defaults.nameColorMode),
    nameColor: color("namec", defaults.nameColor),
    namePalette: enumParam(params, "namepal", CHAT_NAME_PALETTE_IDS, defaults.namePalette),
    nameUppercase: booleanParam(params, "nameupper", defaults.nameUppercase),
    readableNames: booleanParam(params, "readable", defaults.readableNames),
    showColon: booleanParam(params, "colon", defaults.showColon),

    showAvatars: booleanParam(params, "avatars", defaults.showAvatars),
    showBorders: booleanParam(params, "borders", defaults.showBorders),
    messageBackground: booleanParam(params, "msgbg", defaults.messageBackground),
    bubbleColor: color("bubblec", defaults.bubbleColor),
    bubbleOpacity: numberParam(params, "bubbleo", defaults.bubbleOpacity, 0, 100),
    bubbleRadius: integerParam(params, "bubbler", defaults.bubbleRadius, 0, 40),
    accentBar: booleanParam(params, "accent", defaults.accentBar),
    fadeOldMessages: booleanParam(params, "fade", defaults.fadeOldMessages),

    showBadges: booleanParam(params, "badges", defaults.showBadges),
    showEmotes: booleanParam(params, "emotes", defaults.showEmotes),
    emoteScale: integerParam(params, "emotescale", defaults.emoteScale, 60, 300),
    emoteOnlyLarge: booleanParam(params, "emotebig", defaults.emoteOnlyLarge),

    messageLifetime: integerParam(params, "lifetime", defaults.messageLifetime, 0, 600),
    maxMessageLength: integerParam(params, "maxlen", defaults.maxMessageLength, 0, 500),
    hideCommands: booleanParam(params, "nocmd", defaults.hideCommands),
    hideLinks: booleanParam(params, "nolinks", defaults.hideLinks),
    ignoredUsers: textParam(params, "ignore", defaults.ignoredUsers, 600),
    highlightWords: textParam(params, "hl", defaults.highlightWords, 300),
    highlightColor: color("hlc", defaults.highlightColor),
    roleHighlight: booleanParam(params, "roles", defaults.roleHighlight),
    firstTimeHighlight: booleanParam(params, "firsttime", defaults.firstTimeHighlight),
    emoteBurst: booleanParam(params, "burst", defaults.emoteBurst),
    streamEvents: booleanParam(params, "events", defaults.streamEvents),
    eventKinds: eventKindsParam(params.get("eventkinds")),
    eventStyle: enumParam(params, "eventstyle", CHAT_EVENT_STYLES, defaults.eventStyle),
    eventMinBits: integerParam(params, "eventbits", defaults.eventMinBits, 1, 100_000),
    pointsHighlight: booleanParam(params, "points", defaults.pointsHighlight),
    showReplies: booleanParam(params, "replies", defaults.showReplies),
    floodLimit: integerParam(params, "flood", defaults.floodLimit, 0, 20),
    goalKind: enumParam(params, "goal", CHAT_GOAL_KINDS, defaults.goalKind),
    goalTarget: integerParam(params, "goaltarget", defaults.goalTarget, 1, 1_000_000),
    goalStart: integerParam(params, "goalstart", defaults.goalStart, 0, 1_000_000),
    goalText: cleanChatText(textParam(params, "goaltext", defaults.goalText, 120), 40),
    hypeMeter: booleanParam(params, "hype", defaults.hypeMeter),
    hypeTarget: integerParam(params, "hypemax", defaults.hypeTarget, 5, 200),
    eventConfetti: booleanParam(params, "confetti", defaults.eventConfetti),
    sound: enumParam(params, "sound", CHAT_SOUND_MODES, defaults.sound),
    soundStyle: enumParam(params, "soundstyle", CHAT_SOUND_STYLES, defaults.soundStyle),
    soundVolume: integerParam(params, "soundvol", defaults.soundVolume, 0, 100),

    animateMessages: booleanParam(params, "anim", defaults.animateMessages),
    animationStyle,
    animationDurationMs: Math.round(numberParam(params, "animdur", defaults.animationDurationMs, 100, 1200)),
    exitStyle: enumParam(params, "exit", CHAT_EXIT_STYLES, defaults.exitStyle),
    newMessageEffect: enumParam(params, "fx", CHAT_MESSAGE_EFFECTS, defaults.newMessageEffect),
    textReveal: enumParam(params, "reveal", CHAT_TEXT_REVEALS, defaults.textReveal),
  };
}

/** Settings from a pasted Browser Source address, or null when it is not a camera-chat overlay address. */
export function cameraChatConfigFromUrl(value: string, base: string): CameraChatConfig | null {
  let url: URL;
  try {
    url = new URL(value.trim(), base);
  } catch {
    return null;
  }
  if (!/\/overlay\/camera-chat\/?$/.test(url.pathname) || !url.search) return null;
  return cameraChatConfigFromSearch(url.search);
}
