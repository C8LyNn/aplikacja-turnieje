/**
 * Chat extras shared by the React preview, the OBS Browser Source page and the native StreamElements widget:
 * background particles, the header with a "live" dot and a pinned line, bubble shapes, the first-message tag and the
 * emote burst. Both renderers take their CSS and particle data from here and use the same class names, so the two
 * cannot drift apart. Everything typed by the streamer or a viewer is written as text.
 */
import {
  type CameraChatConfig,
  chatEmotePx,
  chatFontPx,
  chatRevealBaseMs,
  cleanChatText,
  rgbaCss,
} from "./camera-chat-settings";

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
    animation: string;
  };
};

const CONFETTI_COLORS = ["#f472b6", "#facc15", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"];

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
    );
  }
  if (config.headerStyle !== "none" || cleanChatText(config.pinnedText, 120)) {
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
export function chatHeaderContent(config: Pick<CameraChatConfig, "headerStyle" | "headerText" | "headerLive" | "pinnedText">) {
  const title = cleanChatText(config.headerText, 40);
  const pinned = cleanChatText(config.pinnedText, 120);
  const header = config.headerStyle !== "none" && (title !== "" || config.headerLive);
  return { header, title, live: header && config.headerLive, pinned, visible: header || pinned !== "" };
}

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Static HTML of the header box and of the particle layer for the StreamElements widget (texts escaped). */
export function chatDecorHtml(config: CameraChatConfig): { ambient: string; header: string } {
  const particles = chatAmbientParticles(config);
  const ambient = particles.length
    ? `<div class="chat-ambient" aria-hidden="true">${particles.map((particle) => `<span class="${particle.className}" style="${ambientStyleText(particle)}">${escapeHtml(particle.text)}</span>`).join("")}</div>`
    : "";
  const content = chatHeaderContent(config);
  const header = content.visible
    ? `<div class="chat-header-box">${content.header ? `<div class="chat-header chat-header-${config.headerStyle}">${content.live ? "<span class=\"chat-live-dot\"></span>" : ""}<span>${escapeHtml(content.title)}</span></div>` : ""}${content.pinned ? `<div class="chat-pinned">${escapeHtml(content.pinned)}</div>` : ""}</div>`
    : "";
  return { ambient, header };
}
