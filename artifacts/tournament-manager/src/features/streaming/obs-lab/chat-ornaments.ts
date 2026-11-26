/**
 * Theme ornaments: a small symbol before every nick, a large faint emblem in the panel corner and a divider line at the
 * top of the panel, all in the ornament colour. They make a look read as its theme (an anchor and a skull for the
 * pirate map, a gear for steampunk, a snowflake for winter...). Shared by the preview, the OBS page and the exported
 * StreamElements widget; the symbols are fixed text, never anything a viewer typed.
 */
import type { CameraChatConfig } from "./camera-chat-settings";

export type ChatOrnament =
  | "none" | "anchor" | "skull" | "gear" | "swords" | "crown" | "fleur" | "star" | "sparkle" | "snow" | "flower"
  | "blossom" | "leaf" | "clover" | "sun" | "moon" | "comet" | "note" | "bolt" | "heart" | "diamond" | "prompt"
  | "coffin" | "cloud" | "crosshair" | "flag" | "wave" | "triangle" | "target" | "pen" | "circle";

/** Code points of each symbol; U+FE0E asks for the plain text glyph (no colour emoji), so CSS colours it. */
const CODES: Record<Exclude<ChatOrnament, "none">, readonly number[]> = {
  anchor: [0x2693, 0xfe0e],
  skull: [0x2620, 0xfe0e],
  gear: [0x2699, 0xfe0e],
  swords: [0x2694, 0xfe0e],
  crown: [0x265b],
  fleur: [0x269c, 0xfe0e],
  star: [0x2605],
  sparkle: [0x2727],
  snow: [0x2744, 0xfe0e],
  flower: [0x273f],
  blossom: [0x2740],
  leaf: [0x2766],
  clover: [0x2663, 0xfe0e],
  sun: [0x2600, 0xfe0e],
  moon: [0x263e],
  comet: [0x2604, 0xfe0e],
  note: [0x266b],
  bolt: [0x21af],
  heart: [0x2665, 0xfe0e],
  diamond: [0x25c6],
  prompt: [0x276f],
  coffin: [0x26b0, 0xfe0e],
  cloud: [0x2601, 0xfe0e],
  crosshair: [0x2316],
  flag: [0x2691],
  wave: [0x224b],
  triangle: [0x25b2],
  target: [0x25ce],
  pen: [0x2712, 0xfe0e],
  circle: [0x25cf],
};

export const CHAT_ORNAMENTS: readonly ChatOrnament[] = ["none", ...(Object.keys(CODES) as Exclude<ChatOrnament, "none">[])];

export function chatOrnamentGlyph(ornament: ChatOrnament): string {
  return ornament === "none" ? "" : String.fromCodePoint(...CODES[ornament]);
}

/** Fonts that carry the symbols on Windows, macOS and Linux. */
export const CHAT_ORNAMENT_FONTS = `"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", "DejaVu Sans", sans-serif`;

/** Rules for the marker (`.chat-mark`), the corner emblem (`.chat-emblem`) and the top divider (`.chat-divider`). */
export function getChatOrnamentCss(config: Pick<CameraChatConfig, "ornament" | "ornamentColor">, panel: string): string {
  if (config.ornament === "none") return "";
  const color = config.ornamentColor;
  return [
    `${panel} { position: relative; isolation: isolate; }`,
    `.chat-mark { display: inline-block; margin-right: .35em; color: ${color}; font-family: ${CHAT_ORNAMENT_FONTS}; font-size: .9em; font-weight: 400; line-height: 1; vertical-align: baseline; text-shadow: 0 0 6px ${color}55; }`,
    `.chat-emblem { position: absolute; right: -.1em; bottom: -.2em; z-index: -1; color: ${color}; opacity: .12; font-family: ${CHAT_ORNAMENT_FONTS}; font-size: 7em; line-height: 1; transform: rotate(-12deg); pointer-events: none; }`,
    `.chat-divider { flex: none; display: flex; align-items: center; gap: .5em; padding: .5em .8em 0; color: ${color}; font-family: ${CHAT_ORNAMENT_FONTS}; font-size: .85em; line-height: 1; }`,
    `.chat-divider::before, .chat-divider::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, ${color}); }`,
    `.chat-divider::after { background: linear-gradient(90deg, ${color}, transparent); }`,
  ].join("\n");
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Static markup of the emblem and the divider for the exported widget (the preview renders the same elements). */
export function chatOrnamentHtml(config: Pick<CameraChatConfig, "ornament">): { emblem: string; divider: string } {
  const glyph = escapeHtml(chatOrnamentGlyph(config.ornament));
  if (!glyph) return { emblem: "", divider: "" };
  return {
    emblem: `<div class="chat-emblem" aria-hidden="true">${glyph}</div>`,
    divider: `<div class="chat-divider" aria-hidden="true">${glyph}</div>`,
  };
}
