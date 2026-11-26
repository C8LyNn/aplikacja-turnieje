export type CameraChatLayout = "right" | "below" | "overlay" | "chat";
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

export const CHAT_MOTION_PRESETS: readonly CameraChatMotionPreset[] =
  ["rise", "slide", "pop", "fade", "bounce", "flip", "wipe"];

export const CHAT_LAYOUTS: readonly CameraChatLayout[] = ["right", "below", "overlay", "chat"];
export const CHAT_FONT_FAMILIES: readonly CameraChatFontFamily[] =
  ["inter", "system", "segoe", "arial", "verdana", "trebuchet", "georgia", "mono", "impact", "comic", "custom"];
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
  | "top-right"
  | "bottom-left"
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
  radius: number;
  gap: number;
  innerPadding: number;

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

  nameColorMode: CameraChatNameColorMode;
  nameColor: string;
  readableNames: boolean;
  showColon: boolean;

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
  radius: 22,
  gap: 0,
  innerPadding: 12,

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

  nameColorMode: "user",
  nameColor: "#a78bfa",
  readableNames: true,
  showColon: false,

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
};

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

export const CHAT_NAME_PALETTE: readonly string[] =
  ["#fb7185", "#34d399", "#a78bfa", "#38bdf8", "#fbbf24", "#22d3ee", "#f472b6", "#a3e635"];

/** A viewer keeps one palette colour for the whole stream (it does not shift when new messages arrive). */
export function chatPaletteColor(name: string): string {
  return CHAT_NAME_PALETTE[chatHash(name.toLowerCase()) % CHAT_NAME_PALETTE.length];
}

export function resolveChatNameColor(
  message: { name: string; color?: string },
  config: Pick<CameraChatConfig, "nameColorMode" | "nameColor" | "readableNames">,
): string {
  if (config.nameColorMode === "single") return config.nameColor;
  const own = config.nameColorMode === "user" ? normalizeHexColor(message.color, "") : "";
  if (!own) return chatPaletteColor(message.name);
  return config.readableNames ? readableNameColor(own) : own;
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

  if (config.layout === "right") {
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

  if (config.layout === "below") {
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
  params.set("radius", String(config.radius));
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
    radius: numberParam(params, "radius", defaults.radius, 0, 80),
    gap: numberParam(params, "gap", defaults.gap, 0, 100),
    innerPadding: numberParam(params, "padding", defaults.innerPadding, 0, 50),

    chatAnchor: enumParam(params, "anchor", ["top", "bottom"] as const, "bottom"),
    newestFirst: booleanParam(params, "newest", defaults.newestFirst),
    textAlign: enumParam(params, "align", ["left", "right"] as const, defaults.textAlign),
    messageLayout: enumParam(params, "msglayout", CHAT_MESSAGE_LAYOUTS, defaults.messageLayout),

    overlayPosition: enumParam(params, "position", ["top-left", "top-right", "bottom-left", "bottom-right"] as const, "bottom-right"),
    overlayInset: numberParam(params, "inset", defaults.overlayInset, 0, 100),

    fitChatHeight: booleanParam(params, "fit", defaults.fitChatHeight),

    textColor: color("textc", defaults.textColor),
    textOpacity: numberParam(params, "texto", defaults.textOpacity, 10, 100),
    textShadow: enumParam(params, "shadow", CHAT_TEXT_SHADOW_STYLES, defaults.textShadow),

    nameColorMode: enumParam(params, "namemode", CHAT_NAME_COLOR_MODES, defaults.nameColorMode),
    nameColor: color("namec", defaults.nameColor),
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
