import type { AlertCaption } from "../core/types";
import { appendEventAvatar } from "./alertAvatar";

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
};

export function normalizeAlertCaption(value: unknown): AlertCaption {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const template = typeof input.template === "string"
    ? input.template.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 160)
    : DEFAULT_ALERT_CAPTION.template;
  const numeric = typeof input.fontSize === "number" ? input.fontSize : Number(input.fontSize);
  return {
    enabled: input.enabled === true,
    template,
    position: input.position === "top" || input.position === "center" || input.position === "custom" ? input.position : "bottom",
    xPercent: Number.isFinite(Number(input.xPercent)) ? Math.max(25, Math.min(75, Math.round(Number(input.xPercent)))) : 50,
    yPercent: Number.isFinite(Number(input.yPercent)) ? Math.max(10, Math.min(90, Math.round(Number(input.yPercent)))) : 75,
    fontSize: Number.isFinite(numeric) ? Math.round(Math.max(14, Math.min(120, numeric))) : DEFAULT_ALERT_CAPTION.fontSize,
    color: typeof input.color === "string" && /^#[\da-fA-F]{6}$/.test(input.color) ? input.color : DEFAULT_ALERT_CAPTION.color,
    intro: input.intro === "fade" || input.intro === "pop" ? input.intro : "slide",
    outro: input.outro === "slide" || input.outro === "pop" ? input.outro : "fade",
    avatarEnabled: input.avatarEnabled === true,
    avatarSize: Number.isFinite(Number(input.avatarSize)) ? Math.max(32, Math.min(144, Math.round(Number(input.avatarSize)))) : 72,
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

/** Common renderer for both the editor and the exported Custom Widget. */
export function appendAlertCaption(
  parent: HTMLElement,
  options: AlertCaption | undefined,
  listener: string,
  event: unknown,
): HTMLElement | null {
  if (!options || !options.enabled) return null;
  const label = document.createElement("div");
  label.className = "ae-alert-caption";
  label.textContent = formatAlertCaption(options.template, listener, event);
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
  label.style.textShadow = "0 3px 14px rgba(0,0,0,.9),0 0 36px rgba(0,0,0,.65)";
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
