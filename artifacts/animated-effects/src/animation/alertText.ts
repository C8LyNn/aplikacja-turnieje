import type { AlertCaption, CaptionBackground, CaptionEffect, CaptionFont, CaptionLetters } from "../core/types";
import { appendEventAvatar } from "./alertAvatar";
import {
  CAPTION_INTROS,
  CAPTION_LETTER_LIMIT,
  CAPTION_OUTROS,
  captionAnimationShorthand,
  captionLetterAnimation,
  captionLetterStepMs,
} from "./captionMotion";

export const CAPTION_FONT_IDS: readonly CaptionFont[] = ["default", "system", "impact", "trebuchet", "verdana", "georgia", "mono", "comic"];
export const CAPTION_EFFECTS: readonly CaptionEffect[] = ["shadow", "outline", "glow", "none"];
export const CAPTION_BACKGROUNDS: readonly CaptionBackground[] = ["none", "box", "pill"];
export const CAPTION_LETTERS: readonly CaptionLetters[] = ["none", "wave", "typewriter", "pop"];

/** Fonts available on a typical streaming computer; nothing is downloaded. */
export const CAPTION_FONT_STACKS: Record<Exclude<CaptionFont, "default">, string> = {
  system: "system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif",
  impact: "Impact, Haettenschweiler, \"Arial Narrow Bold\", sans-serif",
  trebuchet: "\"Trebuchet MS\", Tahoma, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  georgia: "Georgia, \"Times New Roman\", serif",
  mono: "\"Cascadia Mono\", Consolas, \"Courier New\", monospace",
  comic: "\"Comic Sans MS\", \"Comic Neue\", cursive",
};

export const DEFAULT_ALERT_CAPTION: AlertCaption = {
  enabled: false,
  template: "{name} · {amount}",
  position: "bottom",
  xPercent: 50,
  yPercent: 75,
  fontSize: 48,
  color: "#ffffff",
  intro: "slide",
  outro: "fade",
  avatarEnabled: false,
  avatarSize: 72,
  subtitle: "",
  font: "default",
  effect: "shadow",
  background: "none",
  backgroundColor: "#0f172a",
  backgroundOpacity: 70,
  letters: "none",
  imageUrl: "",
  imageSize: 160,
};

/** Alert picture / GIF: an https address without a login in it; anything else shows no picture. */
export function safeAlertImageUrl(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 500) return "";
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "";
  }
  if (url.protocol !== "https:" || url.username || url.password) return "";
  return url.href;
}

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? value as T : fallback;

const cleanTemplate = (value: unknown, fallback: string): string => typeof value === "string"
  ? value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 160)
  : fallback;

const HEX_COLOR = /^#[\da-fA-F]{6}$/;

export function normalizeAlertCaption(value: unknown): AlertCaption {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const numeric = typeof input.fontSize === "number" ? input.fontSize : Number(input.fontSize);
  const backgroundOpacity = Number(input.backgroundOpacity);
  return {
    enabled: input.enabled === true,
    template: cleanTemplate(input.template, DEFAULT_ALERT_CAPTION.template),
    position: input.position === "top" || input.position === "center" || input.position === "custom" ? input.position : "bottom",
    xPercent: Number.isFinite(Number(input.xPercent)) ? Math.max(25, Math.min(75, Math.round(Number(input.xPercent)))) : 50,
    yPercent: Number.isFinite(Number(input.yPercent)) ? Math.max(10, Math.min(90, Math.round(Number(input.yPercent)))) : 75,
    fontSize: Number.isFinite(numeric) ? Math.round(Math.max(14, Math.min(120, numeric))) : DEFAULT_ALERT_CAPTION.fontSize,
    color: typeof input.color === "string" && HEX_COLOR.test(input.color) ? input.color : DEFAULT_ALERT_CAPTION.color,
    intro: pick(input.intro, CAPTION_INTROS, "slide"),
    outro: pick(input.outro, CAPTION_OUTROS, "fade"),
    avatarEnabled: input.avatarEnabled === true,
    avatarSize: Number.isFinite(Number(input.avatarSize)) ? Math.max(32, Math.min(144, Math.round(Number(input.avatarSize)))) : 72,
    subtitle: cleanTemplate(input.subtitle, ""),
    font: pick(input.font, CAPTION_FONT_IDS, "default"),
    effect: pick(input.effect, CAPTION_EFFECTS, "shadow"),
    background: pick(input.background, CAPTION_BACKGROUNDS, "none"),
    backgroundColor: typeof input.backgroundColor === "string" && HEX_COLOR.test(input.backgroundColor)
      ? input.backgroundColor : DEFAULT_ALERT_CAPTION.backgroundColor,
    backgroundOpacity: input.backgroundOpacity !== undefined && Number.isFinite(backgroundOpacity)
      ? Math.max(0, Math.min(100, Math.round(backgroundOpacity))) : DEFAULT_ALERT_CAPTION.backgroundOpacity,
    letters: pick(input.letters, CAPTION_LETTERS, "none"),
    imageUrl: safeAlertImageUrl(input.imageUrl),
    imageSize: Number.isFinite(Number(input.imageSize)) && input.imageSize !== null && input.imageSize !== ""
      ? Math.max(40, Math.min(400, Math.round(Number(input.imageSize)))) : 160,
  };
}

/** A self-contained helper, also embedded verbatim into exported Custom Widget JS.
 * Deliberately avoids HTML, platform-specific globals and unbounded payloads.
 */
export function getAlertFields(listener: string, event: unknown): Record<string, string> {
  const data = event && typeof event === "object" && !Array.isArray(event)
    ? event as Record<string, unknown> : {};
  const nested = data.data && typeof data.data === "object" && !Array.isArray(data.data)
    ? data.data as Record<string, unknown> : {};
  const bounded = (value: unknown, max: number): string =>
    (typeof value === "string" || typeof value === "number" && Number.isFinite(value))
      ? String(value).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max)
      : "";
  const name = listener === "message"
    ? bounded(nested.displayName ?? nested.nick ?? data.name, 60)
    : bounded(data.name ?? data.sender, 60);
  const message = listener === "message"
    ? bounded(nested.text ?? (nested.snippet && typeof nested.snippet === "object" ? (nested.snippet as Record<string, unknown>).displayMessage : undefined) ?? data.text, 180)
    : bounded(data.message, 180);
  return {
    name: name || "Widz",
    amount: bounded(data.amount, 32),
    message,
    event: listener,
  };
}

/** Replaces only documented placeholders. Unknown tokens stay literal.
 * The returned string must always be written via Node.textContent.
 */
export function formatAlertCaption(template: string, listener: string, event: unknown): string {
  const fields = getAlertFields(listener, event);
  const source = typeof template === "string" ? template.slice(0, 160) : "";
  return source.replace(/\{(name|amount|message|event)\}/g, (_, key: string) => fields[key] ?? "").slice(0, 280);
}

/** Text effect of the caption; "shadow" is the original look. */
export function captionTextShadow(effect: CaptionEffect, color: string): string {
  if (effect === "none") return "none";
  if (effect === "outline") return "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 8px rgba(0,0,0,.85)";
  if (effect === "glow") return "0 0 2px rgba(0,0,0,.9), 0 0 10px " + color + ", 0 0 28px " + color;
  return "0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)";
}

export function captionBackgroundColor(hex: string, opacityPercent: number): string {
  const value = parseInt(hex.slice(1), 16);
  return "rgba(" + ((value >> 16) & 255) + ", " + ((value >> 8) & 255) + ", " + (value & 255) + ", " + Math.round(opacityPercent) / 100 + ")";
}

/** Words stay unbroken; each letter of the title gets its own staggered animation. */
function appendCaptionTitle(target: HTMLElement, text: string, letters: CaptionLetters, playbackMs: number): void {
  const chars = Array.from(text);
  if (letters === "none" || chars.length > CAPTION_LETTER_LIMIT) {
    target.textContent = text;
    return;
  }
  const step = captionLetterStepMs(chars.filter((char) => char.trim() !== "").length, playbackMs);
  let index = 0;
  for (const piece of text.split(/(\s+)/)) {
    if (!piece) continue;
    if (!piece.trim()) {
      target.appendChild(document.createTextNode(piece));
      continue;
    }
    const word = document.createElement("span");
    word.className = "ae-alert-word";
    word.style.display = "inline-block";
    word.style.whiteSpace = "nowrap";
    for (const char of Array.from(piece)) {
      const letter = document.createElement("span");
      letter.className = "ae-alert-letter";
      letter.style.display = "inline-block";
      letter.style.animation = captionLetterAnimation(letters, index++, step);
      letter.textContent = char;
      word.appendChild(letter);
    }
    target.appendChild(word);
  }
}

/** Common renderer for both the editor and the exported Custom Widget. */
export function appendAlertCaption(
  parent: HTMLElement,
  options: AlertCaption | undefined,
  listener: string,
  event: unknown,
  playbackMs = 4000,
): HTMLElement | null {
  if (!options || !options.enabled) return null;
  const label = document.createElement("div");
  label.className = "ae-alert-caption";
  label.style.animation = captionAnimationShorthand(options.intro ?? "slide", options.outro ?? "fade", playbackMs);
  const title = formatAlertCaption(options.template, listener, event);
  const subtitle = options.subtitle ? formatAlertCaption(options.subtitle, listener, event).trim() : "";
  const letters = options.letters ?? "none";
  const background = options.background ?? "none";
  const imageUrl = typeof options.imageUrl === "string" && options.imageUrl.slice(0, 8).toLowerCase() === "https://" ? options.imageUrl : "";
  if (!subtitle && letters === "none" && background === "none" && !imageUrl) {
    // The original single-line caption.
    label.textContent = title;
  } else {
    const box = document.createElement("span");
    box.className = "ae-alert-caption-box";
    box.style.display = "inline-block";
    box.style.maxWidth = "100%";
    if (background !== "none") {
      box.style.background = captionBackgroundColor(options.backgroundColor ?? "#0f172a", options.backgroundOpacity ?? 70);
      box.style.padding = ".3em .75em";
      box.style.borderRadius = background === "pill" ? "999px" : ".3em";
    }
    if (imageUrl) {
      const picture = document.createElement("img");
      picture.className = "ae-alert-image";
      picture.src = imageUrl;
      picture.alt = "";
      picture.style.display = "block";
      picture.style.height = (options.imageSize ?? 160) + "px";
      picture.style.width = "auto";
      picture.style.maxWidth = "100%";
      picture.style.margin = "0 auto .2em";
      picture.style.objectFit = "contain";
      box.appendChild(picture);
    }
    const main = document.createElement("span");
    main.className = "ae-alert-caption-title";
    main.style.display = "block";
    appendCaptionTitle(main, title, letters, playbackMs);
    box.appendChild(main);
    if (subtitle) {
      const second = document.createElement("span");
      second.className = "ae-alert-caption-subtitle";
      second.style.display = "block";
      second.style.fontSize = ".55em";
      second.style.fontWeight = "600";
      second.style.marginTop = ".25em";
      second.textContent = subtitle;
      box.appendChild(second);
    }
    label.appendChild(box);
  }
  label.style.position = "absolute";
  label.style.left = "5%";
  label.style.width = "90%";
  label.style.maxWidth = "90%";
  label.style.textAlign = "center";
  label.style.whiteSpace = "pre-wrap";
  label.style.overflowWrap = "anywhere";
  label.style.pointerEvents = "none";
  label.style.color = options.color;
  label.style.fontSize = options.fontSize + "px";
  label.style.fontWeight = "700";
  label.style.lineHeight = "1.2";
  label.style.textShadow = captionTextShadow(options.effect ?? "shadow", options.color);
  if (options.font && options.font !== "default") label.style.fontFamily = CAPTION_FONT_STACKS[options.font];
  if (options.position === "custom") {
    label.style.left = (options.xPercent ?? 50) + "%";
    label.style.top = (options.yPercent ?? 75) + "%";
    label.style.width = "48%";
    label.style.transform = "translate(-50%, -50%)";
  } else if (options.position === "top") {
    label.style.top = "8%";
  } else if (options.position === "center") {
    label.style.top = "50%";
    label.style.transform = "translateY(-50%)";
  } else {
    label.style.bottom = "8%";
  }
  if (options.avatarEnabled) {
    appendEventAvatar(label, event, getAlertFields(listener, event).name, options.avatarSize ?? 72);
  }
  parent.appendChild(label);
  return label;
}
