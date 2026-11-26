import type { AlertCaption, EffectInstance, EffectTrigger, EffectTriggerEvent, LayerTimeline } from "../core/types";
import { DEFAULT_ALERT_CAPTION, normalizeAlertCaption } from "../animation/alertText";
import { normalizeEffectTrigger } from "../animation/triggers";
import {
  addEffect,
  beginHistoryTransaction,
  endHistoryTransaction,
  renameEffect,
  updateEffectTimeline,
  updateEffectTrigger,
} from "./state";

/**
 * Ready-made StreamElements alerts: one click creates a complete layer (effect, one-shot timeline, event trigger,
 * queue priority and a styled caption). Everything stays editable in the inspector afterwards.
 */

export type ReadyAlertEvent = {
  event: EffectTriggerEvent;
  label: string;
  title: string;
  subtitle: string;
  priority: number;
  cooldownMs: number;
  durationMs: number;
};

export const READY_ALERT_EVENTS: readonly ReadyAlertEvent[] = [
  { event: "follower-latest", label: "Nowy obserwujący", title: "{name} obserwuje kanał!", subtitle: "Dzięki za follow!", priority: 5, cooldownMs: 0, durationMs: 6000 },
  { event: "subscriber-latest", label: "Subskrypcja", title: "{name} subskrybuje kanał!", subtitle: "{message}", priority: 7, cooldownMs: 0, durationMs: 6500 },
  { event: "tip-latest", label: "Donacja", title: "{name} wspiera kwotą {amount}!", subtitle: "{message}", priority: 9, cooldownMs: 0, durationMs: 7000 },
  { event: "cheer-latest", label: "Cheer / bits", title: "{name}: {amount} bitsów!", subtitle: "{message}", priority: 8, cooldownMs: 0, durationMs: 6500 },
  { event: "raid-latest", label: "Raid", title: "Raid od {name}!", subtitle: "{amount} osób wpada na stream", priority: 8, cooldownMs: 0, durationMs: 7000 },
  { event: "message", label: "Wiadomość na czacie", title: "{name}", subtitle: "{message}", priority: 2, cooldownMs: 5000, durationMs: 4500 },
];

/** The events of a full alert set (chat messages stay a separate, deliberate choice). */
export const READY_ALERT_SET: readonly EffectTriggerEvent[] =
  ["follower-latest", "subscriber-latest", "tip-latest", "cheer-latest", "raid-latest"];

export type ReadyAlertStyle = {
  id: string;
  label: string;
  hint: string;
  effectId: string;
  /** Swatch colours for the picker. */
  colors: [string, string];
  caption: Partial<AlertCaption>;
};

export const READY_ALERT_STYLES: readonly ReadyAlertStyle[] = [
  {
    id: "confetti", label: "Konfetti", hint: "Radosny wybuch kolorów, napis na plakietce",
    effectId: "confetti", colors: ["#f472b6", "#facc15"],
    caption: { intro: "pop", outro: "zoom", font: "system", effect: "none", background: "pill", backgroundColor: "#1e1b4b", backgroundOpacity: 82 },
  },
  {
    id: "fireworks", label: "Fajerwerki", hint: "Świąteczne race i świecący napis",
    effectId: "fireworks", colors: ["#fb923c", "#fde68a"],
    caption: { intro: "zoom", outro: "fade", font: "impact", effect: "glow", color: "#fde68a", letters: "pop" },
  },
  {
    id: "hearts", label: "Serduszka", hint: "Ciepłe podziękowanie, falujące litery",
    effectId: "hearts", colors: ["#f43f5e", "#fda4af"],
    caption: { intro: "bounce", outro: "fade", font: "trebuchet", effect: "none", background: "pill", backgroundColor: "#9d174d", backgroundOpacity: 78, letters: "wave" },
  },
  {
    id: "sparks", label: "Iskry", hint: "Energiczne iskry, mocny obrys",
    effectId: "sparks", colors: ["#f97316", "#fef08a"],
    caption: { intro: "slide", outro: "blur", font: "impact", effect: "outline" },
  },
  {
    id: "shockwave", label: "Fala uderzeniowa", hint: "Pierścienie energii z poświatą",
    effectId: "shockwave-rings", colors: ["#22d3ee", "#a5f3fc"],
    caption: { intro: "zoom", outro: "zoom", font: "system", effect: "glow", color: "#cffafe" },
  },
  {
    id: "portal", label: "Portal", hint: "Wirujący portal, tekst jak z maszyny do pisania",
    effectId: "portal-rings", colors: ["#8b5cf6", "#c4b5fd"],
    caption: { intro: "blur", outro: "blur", font: "system", effect: "glow", color: "#ede9fe", background: "box", backgroundColor: "#020617", backgroundOpacity: 62, letters: "typewriter" },
  },
  {
    id: "neon", label: "Neon", hint: "Neonowe linie i świecący monospace",
    effectId: "neon-lines", colors: ["#d946ef", "#22d3ee"],
    caption: { intro: "drop", outro: "fade", font: "mono", effect: "glow", color: "#f5d0fe", letters: "typewriter" },
  },
  {
    id: "meteors", label: "Deszcz meteorów", hint: "Spadające gwiazdy, klasyczny cień",
    effectId: "meteor-shower", colors: ["#60a5fa", "#e0f2fe"],
    caption: { intro: "slide", outro: "drop", font: "verdana", effect: "shadow" },
  },
  {
    id: "lightning", label: "Błyskawica", hint: "Uderzenie pioruna, wyskakujące litery",
    effectId: "lightning", colors: ["#facc15", "#e0e7ff"],
    caption: { intro: "pop", outro: "blur", font: "impact", effect: "outline", color: "#fef08a", letters: "pop" },
  },
  {
    id: "snow", label: "Śnieżna zamieć", hint: "Spokojny śnieg, elegancki napis",
    effectId: "snow-burst", colors: ["#bae6fd", "#ffffff"],
    caption: { intro: "fade", outro: "fade", font: "georgia", effect: "shadow", background: "box", backgroundColor: "#0c4a6e", backgroundOpacity: 66, letters: "wave" },
  },
];

export function findReadyAlertEvent(event: EffectTriggerEvent): ReadyAlertEvent {
  return READY_ALERT_EVENTS.find((item) => item.event === event) ?? READY_ALERT_EVENTS[0]!;
}

export function findReadyAlertStyle(styleId: string): ReadyAlertStyle {
  return READY_ALERT_STYLES.find((item) => item.id === styleId) ?? READY_ALERT_STYLES[0]!;
}

/** The complete, normalized trigger of a ready-made alert. */
export function readyAlertTrigger(event: EffectTriggerEvent, styleId: string): EffectTrigger {
  const kind = findReadyAlertEvent(event);
  const style = findReadyAlertStyle(styleId);
  const caption = normalizeAlertCaption({
    ...DEFAULT_ALERT_CAPTION,
    enabled: true,
    template: kind.title,
    subtitle: kind.subtitle,
    position: "center",
    fontSize: kind.event === "message" ? 46 : 64,
    ...style.caption,
  });
  return normalizeEffectTrigger({
    source: "event",
    event: kind.event,
    cooldownMs: kind.cooldownMs,
    minAmount: 0,
    caption,
    queueMode: "queue",
    priority: kind.priority,
  })!;
}

export function readyAlertTimeline(event: EffectTriggerEvent): Partial<LayerTimeline> {
  return { mode: "once", delayMs: 0, durationMs: findReadyAlertEvent(event).durationMs, fadeInMs: 300, fadeOutMs: 900 };
}

export function readyAlertLabel(event: EffectTriggerEvent, styleId: string): string {
  return `Alert: ${findReadyAlertEvent(event).label} · ${findReadyAlertStyle(styleId).label}`;
}

function addOne(event: EffectTriggerEvent, styleId: string): EffectInstance | null {
  const created = addEffect(findReadyAlertStyle(styleId).effectId);
  if (!created) return null;
  updateEffectTimeline(created.instanceId, readyAlertTimeline(event));
  updateEffectTrigger(created.instanceId, readyAlertTrigger(event, styleId));
  renameEffect(created.instanceId, readyAlertLabel(event, styleId));
  return created;
}

/** Adds one alert as a single undo step. */
export function createReadyAlert(event: EffectTriggerEvent, styleId: string): EffectInstance | null {
  beginHistoryTransaction("Dodaj gotowy alert");
  try {
    return addOne(event, styleId);
  } finally {
    endHistoryTransaction();
  }
}

/** Adds follow, sub, donation, bits and raid alerts in one style, as a single undo step. */
export function createReadyAlertSet(styleId: string): EffectInstance[] {
  beginHistoryTransaction("Dodaj komplet alertów");
  try {
    return READY_ALERT_SET.map((event) => addOne(event, styleId)).filter((item): item is EffectInstance => item !== null);
  } finally {
    endHistoryTransaction();
  }
}
