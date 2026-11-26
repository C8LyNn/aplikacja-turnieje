/**
 * How different two chat looks are: each look is described by twelve visible traits (font, message layout, bubble
 * shape, frame, background particles, pattern, nick style, entry motion, panel colour family, corners, accent and
 * message effect). The theme test requires every pair of looks to differ in several of them, so new looks cannot be
 * mere recolours of old ones.
 */
import { type CameraChatConfig, hexToRgb } from "./camera-chat-settings";

/** Colour family of the panel: light, neutral (greys and black) or one of nine hue sectors. */
export function chatPanelTone(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if ((max + min) / 2 > 0.6) return "light";
  const chroma = max - min;
  if (chroma < 0.06) return "neutral";
  let hue: number;
  if (max === r) hue = ((g - b) / chroma) % 6;
  else if (max === g) hue = (b - r) / chroma + 2;
  else hue = (r - g) / chroma + 4;
  const degrees = (hue * 60 + 360) % 360;
  return `hue-${Math.floor(degrees / 40)}`;
}

export function chatLookTraits(config: CameraChatConfig): Record<string, string> {
  const lineShape = config.bubbleShape === "outline" || config.bubbleShape === "underline";
  return {
    font: config.fontFamily,
    layout: config.messageLayout,
    shape: lineShape ? config.bubbleShape : config.messageBackground ? config.bubbleShape : "none",
    frame: config.frameStyle,
    ambient: config.ambient,
    pattern: config.panelPattern,
    names: `${config.nameStyle}${config.nameUppercase ? "-upper" : ""}`,
    motion: config.animationStyle,
    tone: chatPanelTone(config.panelColor),
    corners: config.radius <= 6 ? "square" : config.radius <= 16 ? "soft" : "round",
    accent: config.accentBar ? "bar" : config.showAvatars ? "avatar" : "none",
    effect: `${config.newMessageEffect}/${config.textReveal}`,
  };
}

/** Number of traits in which two looks differ (0-12). */
export function chatLookDistance(a: CameraChatConfig, b: CameraChatConfig): number {
  const first = chatLookTraits(a);
  const second = chatLookTraits(b);
  return Object.keys(first).filter((trait) => first[trait] !== second[trait]).length;
}
