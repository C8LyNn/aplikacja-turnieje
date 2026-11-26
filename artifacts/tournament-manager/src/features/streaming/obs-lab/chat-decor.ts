/**
 * Chat extras shared by the React preview, the OBS Browser Source page and the native StreamElements widget:
 * background particles, the header with a "live" dot and a pinned line, bubble shapes, the first-message tag and the
 * emote burst. Both renderers take their CSS and particle data from here and use the same class names, so the two
 * cannot drift apart. Everything typed by the streamer or a viewer is written as text.
 */
import {
  type CameraChatConfig,
  type CameraChatNameStyle,
  type CameraChatPanelPattern,
  chatEmotePx,
  chatFontPx,
  chatRevealBaseMs,
  cleanChatText,
  rgbaCss,
} from "./camera-chat-settings";
import { type ChatGoalProgress, CHAT_GOAL_COLORS } from "./chat-events";
import { chatOrnamentHtml, getChatOrnamentCss } from "./chat-ornaments";
import { getChatSkinCss } from "./chat-skins";
import { chatSceneHtml, getChatSceneCss } from "./chat-scenes";

// --- Background particles -----------------------------------------------------------------------------------------

export type AmbientParticle = {
  className: string;
  text: string;
  style: {
    left: string;
    top: string;
    width?: string;
    height?: string;
    fontSize?: string;
    background?: string;
    color?: string;
    boxShadow?: string;
    animation: string;
  };
};

const CONFETTI_COLORS = ["#f472b6", "#facc15", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"];
/** Digits and half-width katakana for the code rain (fonts on Windows and macOS have them). */
const CODE_GLYPHS = Array.from("0101ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ");
const MUSIC_GLYPHS = ["\u266a", "\u266b", "\u2669", "\u266c"];
const LEAF_COLORS = ["#f59e0b", "#ea580c", "#dc2626", "#ca8a04", "#b45309"];

/** Small deterministic generator (mulberry32): the same particles in every renderer and on every reload. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

export function chatAmbientParticles(config: Pick<CameraChatConfig, "ambient" | "ambientDensity" | "ambientColor">): AmbientParticle[] {
  const kind = config.ambient;
  if (kind === "none") return [];
  const random = seeded(7919 + kind.length * 104729 + config.ambientDensity);
  const between = (min: number, max: number) => min + (max - min) * random();
  return Array.from({ length: config.ambientDensity }, (_, index): AmbientParticle => {
    const left = `${round(between(0, 96))}%`;
    const duration = (min: number, max: number) => round(between(min, max));
    switch (kind) {
      case "snow": {
        const size = `${round(between(3, 7))}px`;
        const time = duration(7, 14);
        return { className: "chat-amb chat-amb-dot", text: "", style: { left, top: "-8%", width: size, height: size, background: config.ambientColor, animation: `chat-amb-fall ${time}s linear ${-round(between(0, time))}s infinite` } };
      }
      case "confetti": {
        const time = duration(5, 9);
        return { className: "chat-amb chat-amb-confetti", text: "", style: { left, top: "-8%", width: "5px", height: "9px", background: CONFETTI_COLORS[index % CONFETTI_COLORS.length], animation: `chat-amb-confetti ${time}s linear ${-round(between(0, time))}s infinite` } };
      }
      case "hearts":
      case "bubbles": {
        const time = duration(6, 11);
        const delay = -round(between(0, time));
        if (kind === "hearts") {
          return { className: "chat-amb", text: "♥", style: { left, top: "105%", fontSize: `${round(between(10, 18))}px`, color: config.ambientColor, animation: `chat-amb-rise ${time}s ease-in ${delay}s infinite` } };
        }
        const size = `${round(between(6, 14))}px`;
        return { className: "chat-amb chat-amb-bubble", text: "", style: { left, top: "105%", width: size, height: size, animation: `chat-amb-rise ${time}s ease-in ${delay}s infinite` } };
      }
      case "sparkles": {
        const time = duration(2, 4);
        return { className: "chat-amb", text: "✦", style: { left, top: `${round(between(0, 94))}%`, fontSize: `${round(between(8, 16))}px`, color: config.ambientColor, animation: `chat-amb-twinkle ${time}s ease-in-out ${-round(between(0, time))}s infinite` } };
      }
      case "stars": {
        const size = `${round(between(2, 3.5))}px`;
        const time = duration(3, 6);
        return { className: "chat-amb chat-amb-dot", text: "", style: { left, top: `${round(between(0, 96))}%`, width: size, height: size, background: config.ambientColor, animation: `chat-amb-twinkle ${time}s ease-in-out ${-round(between(0, time))}s infinite` } };
      }
      case "rain": {
        const time = duration(0.7, 1.3);
        return { className: "chat-amb", text: "", style: { left, top: "-12%", width: "1.5px", height: `${round(between(10, 18))}px`, background: `linear-gradient(transparent, ${config.ambientColor})`, animation: `chat-amb-rain ${time}s linear ${-round(between(0, time))}s infinite` } };
      }
      case "fireflies": {
        const size = `${round(between(3, 5))}px`;
        const time = duration(6, 12);
        return { className: "chat-amb chat-amb-dot", text: "", style: { left, top: `${round(between(8, 92))}%`, width: size, height: size, background: config.ambientColor, boxShadow: `0 0 6px 2px ${config.ambientColor}`, animation: `chat-amb-wander ${time}s ease-in-out ${-round(between(0, time))}s infinite` } };
      }
      case "petals":
      case "leaves": {
        const time = duration(7, 12);
        const leaf = kind === "leaves";
        return {
          className: leaf ? "chat-amb chat-amb-leaf" : "chat-amb chat-amb-petal",
          text: "",
          style: {
            left,
            top: "-8%",
            width: leaf ? "10px" : "9px",
            height: leaf ? "7px" : "6px",
            background: leaf ? LEAF_COLORS[index % LEAF_COLORS.length] : config.ambientColor,
            animation: `chat-amb-petal ${time}s linear ${-round(between(0, time))}s infinite`,
          },
        };
      }
      case "code": {
        const time = duration(3, 7);
        const length = Math.round(between(5, 10));
        const glyphs = Array.from({ length }, () => CODE_GLYPHS[Math.floor(random() * CODE_GLYPHS.length)]!).join("\n");
        return { className: "chat-amb chat-amb-code", text: glyphs, style: { left, top: "-40%", fontSize: `${round(between(10, 14))}px`, color: config.ambientColor, animation: `chat-amb-code ${time}s linear ${-round(between(0, time))}s infinite` } };
      }
      case "embers": {
        const size = `${round(between(2, 4))}px`;
        const time = duration(4, 8);
        return { className: "chat-amb chat-amb-dot", text: "", style: { left, top: "105%", width: size, height: size, background: config.ambientColor, boxShadow: `0 0 6px 1px ${config.ambientColor}`, animation: `chat-amb-ember ${time}s ease-out ${-round(between(0, time))}s infinite` } };
      }
      case "music": {
        const time = duration(6, 11);
        return { className: "chat-amb", text: MUSIC_GLYPHS[index % MUSIC_GLYPHS.length]!, style: { left, top: "105%", fontSize: `${round(between(12, 18))}px`, color: config.ambientColor, animation: `chat-amb-rise ${time}s ease-in ${-round(between(0, time))}s infinite` } };
      }
      case "fog": {
        const time = duration(14, 26);
        return { className: "chat-amb chat-amb-fog", text: "", style: { left: `${round(between(-20, 70))}%`, top: `${round(between(5, 85))}%`, width: `${Math.round(between(90, 160))}px`, height: `${Math.round(between(30, 60))}px`, background: `radial-gradient(closest-side, ${config.ambientColor}, transparent)`, animation: `chat-amb-fog ${time}s ease-in-out ${-round(between(0, time))}s infinite alternate` } };
      }
      case "pixels": {
        const size = `${Math.round(between(4, 7))}px`;
        const time = duration(6, 10);
        return { className: "chat-amb", text: "", style: { left, top: "105%", width: size, height: size, background: config.ambientColor, animation: `chat-amb-rise ${time}s steps(14) ${-round(between(0, time))}s infinite` } };
      }
    }
  });
}

/** A particle's inline style as CSS text (the widget writes it into its HTML; the preview sets the same values). */
export function ambientStyleText(particle: AmbientParticle): string {
  return Object.entries(particle.style)
    .map(([property, value]) => `${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value}`)
    .join("; ");
}

// --- Bubble shapes ------------------------------------------------------------------------------------------------

/** Outline and underline shapes draw a line in the name colour instead of a filled bubble. */
export function chatBubbleFilled(config: Pick<CameraChatConfig, "messageBackground" | "bubbleShape">): boolean {
  return config.messageBackground && config.bubbleShape !== "outline" && config.bubbleShape !== "underline";
}

/** Per-row border of the outline / underline shapes (same values in both renderers). */
export function chatShapeBorder(
  config: Pick<CameraChatConfig, "bubbleShape">,
  nameColor: string,
): { border?: string; borderBottom?: string } {
  if (config.bubbleShape === "outline") return { border: `1.5px solid ${rgbaCss(nameColor, 70)}` };
  if (config.bubbleShape === "underline") return { borderBottom: `2px solid ${nameColor}` };
  return {};
}

export const FIRST_MESSAGE_COLOR = "#22d3ee";

// --- CSS ----------------------------------------------------------------------------------------------------------

/**
 * Rules for particles, header, pinned line, bubble shapes, the first-message tag and the emote burst.
 * `panel` and `row` are the renderer's own selectors for the chat panel and a message row.
 */
export function getChatDecorCss(config: CameraChatConfig, panel: string, row: string): string {
  const rules: string[] = [];
  const fontPx = chatFontPx(config);
  if (config.ambient !== "none") {
    rules.push(
      `${panel} { position: relative; isolation: isolate; }`,
      ".chat-ambient { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; opacity: .85; }",
      ".chat-amb { position: absolute; display: block; line-height: 1; pointer-events: none; }",
      ".chat-amb-dot { border-radius: 50%; }",
      ".chat-amb-confetti { border-radius: 1px; }",
      `.chat-amb-bubble { border-radius: 50%; border: 1.5px solid ${rgbaCss(config.ambientColor, 75)}; }`,
      "@keyframes chat-amb-fall { 0% { top: -8%; transform: translateX(0); } 50% { transform: translateX(10px); } 100% { top: 108%; transform: translateX(-6px); } }",
      "@keyframes chat-amb-confetti { from { top: -8%; transform: rotate(0deg); } to { top: 108%; transform: rotate(540deg); } }",
      "@keyframes chat-amb-rise { 0% { top: 105%; opacity: 0; } 15% { opacity: .9; } 85% { opacity: .9; } 100% { top: -10%; opacity: 0; } }",
      "@keyframes chat-amb-twinkle { 0%, 100% { opacity: .15; transform: scale(.6); } 50% { opacity: 1; transform: scale(1.1); } }",
      ".chat-amb-petal { border-radius: 70% 0 70% 0; opacity: .9; }",
      ".chat-amb-leaf { border-radius: 0 80% 0 80%; }",
      ".chat-amb-code { white-space: pre; font-family: Consolas, \"Courier New\", monospace; font-weight: 700; line-height: 1.05; opacity: .75; text-shadow: 0 0 6px currentColor; }",
      "@keyframes chat-amb-code { from { top: -40%; } to { top: 110%; } }",
      ".chat-amb-fog { border-radius: 50%; filter: blur(6px); }",
      "@keyframes chat-amb-fog { from { transform: translateX(-30px); opacity: .15; } to { transform: translateX(40px); opacity: .4; } }",
      "@keyframes chat-amb-ember { 0% { top: 105%; opacity: 0; transform: translateX(0); } 15% { opacity: 1; } 60% { transform: translateX(10px); } 100% { top: -5%; opacity: 0; transform: translateX(-8px); } }",
      "@keyframes chat-amb-rain { from { top: -12%; transform: translateX(0) rotate(12deg); } to { top: 108%; transform: translateX(-14px) rotate(12deg); } }",
      "@keyframes chat-amb-wander { 0%, 100% { transform: translate(0, 0); opacity: .2; } 25% { transform: translate(14px, -10px); opacity: 1; } 50% { transform: translate(-6px, -20px); opacity: .4; } 75% { transform: translate(-14px, -6px); opacity: .9; } }",
      "@keyframes chat-amb-petal { 0% { top: -8%; transform: translateX(0) rotate(0deg); } 50% { transform: translateX(18px) rotate(200deg); } 100% { top: 108%; transform: translateX(-10px) rotate(400deg); } }",
    );
  }
  const scene = getChatSceneCss(config, panel, row);
  if (scene) rules.push(scene);
  if (config.panelPattern !== "none") {
    rules.push(
      `${panel} { position: relative; isolation: isolate; }`,
      `.chat-pattern { position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none; opacity: ${config.patternOpacity / 100}; background: ${chatPatternBackground(config.panelPattern, config.patternColor)}; }`,
    );
  }
  rules.push(...chatCardCss(config, row));
  rules.push(...chatNameTagCss(config));
  const ornament = getChatOrnamentCss(config, panel);
  if (ornament) {
    rules.push(ornament);
    // The divider stays on screen: a long chat is cut inside the message list, as under the header.
    rules.push(`${panel} > .chat-divider ~ :last-child { flex-shrink: 1 !important; min-height: 0; overflow: hidden; justify-content: ${config.chatAnchor === "top" ? "flex-start" : "flex-end"}; }`);
  }
  if (config.comboMessages) {
    rules.push(
      ".chat-combo { display: inline-block; margin-left: 6px; padding: 0 7px; border-radius: 999px; background: #facc15; color: #1c1917; font-size: .78em; font-weight: 900; line-height: 1.55; vertical-align: middle; animation: chat-combo-pop .4s cubic-bezier(.2,1.6,.4,1) both; }",
      ".chat-combo[data-hot=\"1\"] { background: linear-gradient(90deg, #f97316, #ef4444); color: #fff; box-shadow: 0 0 10px rgba(249,115,22,.7); }",
      "@keyframes chat-combo-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }",
      "@media (prefers-reduced-motion: reduce) { .chat-combo { animation: none !important; } }",
    );
  }
  if (config.nameStyle !== "plain") {
    const clip = "-webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none; filter: drop-shadow(0 1px 1px rgba(0,0,0,.55));";
    const nameRules: Record<Exclude<CameraChatNameStyle, "plain">, string[]> = {
      glow: [".chat-name { text-shadow: 0 0 6px var(--chat-name), 0 0 14px var(--chat-name); }"],
      gradient: [`.chat-name { background: linear-gradient(90deg, var(--chat-name), #ffffff 160%); ${clip} }`],
      rainbow: [
        `.chat-name { background: linear-gradient(90deg, #f43f5e, #f59e0b, #84cc16, #06b6d4, #8b5cf6, #f43f5e) 0 0 / 200% 100%; ${clip} animation: chat-name-flow 3s linear infinite; }`,
        "@keyframes chat-name-flow { to { background-position: 200% 0; } }",
      ],
      shimmer: [
        `.chat-name { background: linear-gradient(100deg, var(--chat-name) 42%, #ffffff 50%, var(--chat-name) 58%) 0 0 / 250% 100%; ${clip} animation: chat-name-shine 3s ease-in-out infinite; }`,
        "@keyframes chat-name-shine { from { background-position: 100% 0; } to { background-position: -150% 0; } }",
      ],
    };
    rules.push(...nameRules[config.nameStyle], "@media (prefers-reduced-motion: reduce) { .chat-name { animation: none !important; } }");
  }
  // The theme skin comes last, so its own look wins over the shared rules above.
  const skin = getChatSkinCss(config, panel, row);
  if (skin) rules.push(skin);
  if (chatHeaderContent(config).visible) {
    const accent = config.headerColor;
    rules.push(
      `.chat-header-box { flex: none; display: flex; flex-direction: column; gap: 6px; padding: ${config.innerPadding}px ${config.innerPadding}px 0; font-size: ${fontPx}px;${config.chatAnchor === "bottom" ? " margin-bottom: auto;" : ""} }`,
      // The header stays on screen: a long chat is cut inside the message list, never above the header.
      `.chat-header-box + * { flex-shrink: 1 !important; min-height: 0; overflow: hidden; justify-content: ${config.chatAnchor === "top" ? "flex-start" : "flex-end"}; }`,
      ".chat-header { display: flex; align-items: center; gap: 6px; font-weight: 800; line-height: 1.3; }",
      `.chat-header-bar { padding: 6px 10px; border-radius: 8px; color: #fff; background: linear-gradient(90deg, ${rgbaCss(accent, 88)}, ${rgbaCss(accent, 30)}); text-transform: uppercase; letter-spacing: .08em; font-size: .8em; }`,
      `.chat-header-pill { align-self: flex-start; padding: 4px 12px; border-radius: 999px; color: #fff; background: ${rgbaCss(accent, 88)}; font-size: .8em; }`,
      `.chat-header-minimal { padding-bottom: 4px; color: ${accent}; border-bottom: 1px solid ${rgbaCss(accent, 50)}; text-transform: uppercase; letter-spacing: .14em; font-size: .72em; }`,
      ".chat-live-dot { flex: none; width: .8em; height: .8em; border-radius: 50%; background: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,.7); animation: chat-live 1.4s ease-out infinite; }",
      "@keyframes chat-live { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,.7); } 70% { box-shadow: 0 0 0 .5em rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }",
      `.chat-pinned { padding: 6px 10px; border-radius: 8px; font-size: .9em; line-height: 1.35; color: ${rgbaCss(config.textColor, config.textOpacity)}; background: rgba(255,255,255,.07); border-left: 3px solid ${accent}; overflow-wrap: anywhere; }`,
    );
  }
  if (config.goalKind !== "none") {
    const goal = CHAT_GOAL_COLORS[config.goalKind];
    rules.push(
      `.chat-goal { display: flex; flex-direction: column; gap: 4px; padding: 6px 10px; border-radius: 8px; background: rgba(255,255,255,.07); font-size: .82em; line-height: 1.3; }`,
      `.chat-goal-top { display: flex; justify-content: space-between; gap: 8px; font-weight: 800; color: ${rgbaCss(config.textColor, config.textOpacity)}; }`,
      `.chat-goal-label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }`,
      `.chat-goal-count { flex: none; color: ${goal}; font-variant-numeric: tabular-nums; }`,
      ".chat-goal-track { height: .55em; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.14); }",
      `.chat-goal-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, ${rgbaCss(goal, 55)}, ${goal}); transition: width .6s ease; }`,
      `.chat-goal[data-done="1"] .chat-goal-fill { animation: chat-goal-done 1.6s ease-in-out infinite; }`,
      `@keyframes chat-goal-done { 50% { filter: brightness(1.45); box-shadow: 0 0 10px ${goal}; } }`,
    );
  }
  if (config.hypeMeter) {
    rules.push(
      `.chat-hype { display: flex; align-items: center; gap: 8px; padding: 2px 4px; font-size: .78em; font-weight: 900; letter-spacing: .12em; color: ${rgbaCss(config.textColor, config.textOpacity)}; }`,
      ".chat-hype-label { display: inline-block; transition: color .3s; }",
      ".chat-hype-track { flex: 1; height: .5em; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.14); }",
      ".chat-hype-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #22d3ee, #a855f7 55%, #f43f5e); transition: width .8s ease; }",
      `.chat-hype[data-hot="1"] .chat-hype-label { color: #fb923c; animation: chat-hype-pulse .8s ease-in-out infinite; }`,
      "@keyframes chat-hype-pulse { 50% { transform: scale(1.12); text-shadow: 0 0 8px #fb923c; } }",
    );
  }
  if (config.goalKind !== "none" || config.hypeMeter) {
    rules.push("@media (prefers-reduced-motion: reduce) { .chat-goal-fill, .chat-hype-fill, .chat-hype-label { animation: none !important; transition: none !important; } }");
  }
  if (config.bubbleShape === "tail" && config.messageBackground) {
    const side = config.textAlign === "right" ? "right" : "left";
    rules.push(
      `${row} { position: relative; margin-bottom: 6px; }`,
      `${row}::before { content: ""; position: absolute; bottom: -6px; ${side}: 14px; border-style: solid; border-width: ${side === "left" ? "7px 7px 0 0" : "7px 0 0 7px"}; border-color: var(--chat-bubble) transparent transparent transparent; pointer-events: none; }`,
    );
  } else if (config.bubbleShape === "skew") {
    rules.push(
      `${row} { position: relative; isolation: isolate; background: transparent !important; border-color: transparent !important; }`,
      `${row}::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: 4px; transform: skewX(-10deg); background: var(--chat-bubble); pointer-events: none; }`,
    );
  }
  if (config.firstTimeHighlight) {
    rules.push(`.chat-first-tag { display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 6px; background: ${FIRST_MESSAGE_COLOR}; color: #052f37; font-size: .7em; font-weight: 900; letter-spacing: .06em; line-height: 1.6; vertical-align: middle; }`);
  }
  if (config.emoteBurst && config.showEmotes) {
    rules.push(
      `${row} { position: relative; }`,
      `.chat-burst { position: absolute; bottom: 40%; width: auto; height: ${chatEmotePx(config)}px; pointer-events: none; z-index: 2; opacity: 0; animation: chat-burst 1500ms ease-out both; }`,
      "@keyframes chat-burst { 0% { opacity: 0; transform: translateY(0) scale(.6); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-64px) scale(1.15); } }",
    );
  }
  return rules.join("\n");
}

/** Where the four burst copies start and when (after half the entry animation). */
export function chatBurstPieces(config: Pick<CameraChatConfig, "animateMessages" | "animationDurationMs">): Array<{ left: string; delay: string }> {
  const base = chatRevealBaseMs(config);
  return ["12%", "34%", "58%", "80%"].map((left, index) => ({ left, delay: `${base + index * 140}ms` }));
}

/** Header markup values (shown only when there is something to show). */
export function chatHeaderContent(
  config: Pick<CameraChatConfig, "headerStyle" | "headerText" | "headerLive" | "pinnedText" | "goalKind" | "hypeMeter">,
) {
  const title = cleanChatText(config.headerText, 40);
  const pinned = cleanChatText(config.pinnedText, 120);
  const header = config.headerStyle !== "none" && (title !== "" || config.headerLive);
  const goal = config.goalKind !== "none";
  return { header, title, live: header && config.headerLive, pinned, goal, hype: config.hypeMeter, visible: header || pinned !== "" || goal || config.hypeMeter };
}

/** The label shown on the hype bar. */
export const CHAT_HYPE_LABEL = "HYPE";

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/**
 * Message cards drawn over the row's own background (hence !important): a comic speech bubble with a thick outline,
 * a sticky note with tape, frosted glass and an 8-bit pixel frame in the frame colour. Event rows keep their own look.
 */
function chatCardCss(config: CameraChatConfig, row: string): string[] {
  const card = `${row}:not(.chat-event)`;
  const outline = `${card}[data-highlight="1"] { outline: 2px dashed ${config.highlightColor}; outline-offset: 2px; }`;
  switch (config.bubbleShape) {
    case "comic":
      return [
        `${card} { position: relative; margin: 0 6px 6px 0; background: ${config.bubbleColor} !important; border: 2.5px solid #111111 !important; border-radius: 16px !important; box-shadow: 4px 4px 0 #111111 !important; }`,
        outline,
      ];
    case "sticky":
      return [
        `${card} { position: relative; margin-top: 6px; background: ${config.bubbleColor} !important; border: none !important; border-radius: 3px !important; box-shadow: 0 8px 12px -6px rgba(0,0,0,.6) !important; rotate: -1deg; }`,
        `${card}:nth-child(even) { rotate: 1.2deg; }`,
        `${card}::before { content: ""; position: absolute; top: -7px; left: 50%; width: 42px; height: 13px; transform: translateX(-50%) rotate(-3deg); background: rgba(255,255,255,.5); box-shadow: 0 1px 2px rgba(0,0,0,.2); pointer-events: none; }`,
        outline,
      ];
    case "glass":
      return [
        `${card} { background: linear-gradient(135deg, rgba(255,255,255,.17), rgba(255,255,255,.05)) !important; border: 1px solid rgba(255,255,255,.24) !important; border-radius: 14px !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.32), 0 4px 14px rgba(0,0,0,.28) !important; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }`,
        outline,
      ];
    case "pixel": {
      const edge = config.frameColor;
      return [
        `${card} { margin: 4px; border: none !important; border-radius: 0 !important; box-shadow: 0 -3px 0 0 ${edge}, 0 3px 0 0 ${edge}, -3px 0 0 0 ${edge}, 3px 0 0 0 ${edge} !important; }`,
        outline,
      ];
    }
    default:
      return [];
  }
}

/** Nick tags; the renderers set --chat-name (the nick colour) and --chat-name-bg (a readable version of it). */
function chatNameTagCss(config: Pick<CameraChatConfig, "nameTag">): string[] {
  const solid = "-webkit-background-clip: border-box; background-clip: border-box; filter: none;";
  switch (config.nameTag) {
    case "pill":
      return [`.chat-name { display: inline-block; padding: 0 .5em; border-radius: 999px; background: var(--chat-name-bg); color: #0b1020 !important; -webkit-text-fill-color: #0b1020; text-shadow: none; line-height: 1.45; ${solid} }`];
    case "box":
      return [`.chat-name { display: inline-block; padding: 0 .4em; border: 1.5px solid var(--chat-name); border-radius: 4px; background: rgba(0,0,0,.28); -webkit-text-fill-color: var(--chat-name); line-height: 1.35; ${solid} }`];
    case "bracket":
      return [".chat-name::before { content: \"[\"; opacity: .7; }", ".chat-name::after { content: \"]\"; opacity: .7; }"];
    case "prompt":
      return [".chat-name::before { content: \"> \"; opacity: .65; }"];
    case "underline":
      return [".chat-name { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }"];
    case "plain":
      return [];
  }
}

/** The panel pattern as a CSS background (only fixed shapes; the colour is a validated hex value). */
export function chatPatternBackground(pattern: CameraChatPanelPattern, color: string): string {
  switch (pattern) {
    case "dots": return `radial-gradient(${color} 1.2px, transparent 1.6px) 0 0 / 14px 14px`;
    case "grid": return `linear-gradient(${color} 1px, transparent 1px) 0 0 / 18px 18px, linear-gradient(90deg, ${color} 1px, transparent 1px) 0 0 / 18px 18px`;
    case "stripes": return `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 12px)`;
    case "carbon": return `repeating-linear-gradient(45deg, ${color} 0 3px, transparent 3px 6px), repeating-linear-gradient(-45deg, ${color} 0 3px, transparent 3px 6px)`;
    case "waves": return `radial-gradient(circle at 50% 100%, transparent 8px, ${color} 9px, ${color} 10px, transparent 11px) 0 0 / 24px 12px`;
    case "scanlines": return `repeating-linear-gradient(0deg, ${color} 0 1px, transparent 1px 4px)`;
    case "checker": return `conic-gradient(${color} 25%, transparent 0 50%, ${color} 0 75%, transparent 0) 0 0 / 16px 16px`;
    case "planks": return `repeating-linear-gradient(0deg, transparent 0 22px, ${color} 22px 24px), repeating-linear-gradient(90deg, transparent 0 118px, ${color} 118px 120px)`;
    case "vignette": return `radial-gradient(ellipse at center, transparent 40%, ${color} 100%)`;
    case "halftone": return `radial-gradient(${color} 2px, transparent 2.6px) 0 0 / 8px 8px`;
    case "none": return "none";
  }
}

/** Static HTML of the header box and of the particle layer for the StreamElements widget (texts escaped). */
export function chatDecorHtml(config: CameraChatConfig, goal: ChatGoalProgress | null = null): { ambient: string; header: string } {
  const particles = chatAmbientParticles(config);
  const pattern = config.panelPattern !== "none" ? `<div class="chat-pattern" aria-hidden="true"></div>` : "";
  const ornament = chatOrnamentHtml(config);
  const sceneMarkup = chatSceneHtml(config);
  const scene = sceneMarkup ? `<div class="chat-scene" aria-hidden="true">${sceneMarkup}</div>` : "";
  const ambient = scene + pattern + (particles.length
    ? `<div class="chat-ambient" aria-hidden="true">${particles.map((particle) => `<span class="${particle.className}" style="${ambientStyleText(particle)}">${escapeHtml(particle.text)}</span>`).join("")}</div>`
    : "") + ornament.emblem;
  const content = chatHeaderContent(config);
  const header = content.visible
    ? `<div class="chat-header-box">${content.header ? `<div class="chat-header chat-header-${config.headerStyle}">${content.live ? "<span class=\"chat-live-dot\"></span>" : ""}<span>${escapeHtml(content.title)}</span></div>` : ""}${content.goal && goal ? goalHtml(config, goal) : ""}${content.hype ? hypeHtml() : ""}${content.pinned ? `<div class="chat-pinned">${escapeHtml(content.pinned)}</div>` : ""}</div>`
    : "";
  return { ambient, header: ornament.divider + header };
}

function goalHtml(config: CameraChatConfig, goal: ChatGoalProgress): string {
  return `<div class="chat-goal" data-goal="${config.goalKind}"${goal.done ? " data-done=\"1\"" : ""}><div class="chat-goal-top"><span class="chat-goal-label">${escapeHtml(goal.label)}</span><span class="chat-goal-count">${escapeHtml(goal.text)}</span></div><div class="chat-goal-track"><div class="chat-goal-fill" style="width: ${goal.percent}%"></div></div></div>`;
}

function hypeHtml(): string {
  return `<div class="chat-hype"><span class="chat-hype-label">${CHAT_HYPE_LABEL}</span><div class="chat-hype-track"><div class="chat-hype-fill" style="width: 0%"></div></div></div>`;
}
