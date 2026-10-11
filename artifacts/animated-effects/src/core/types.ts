// src/core/types.ts

export type EffectId = string;
export type EffectInstanceId = string;

export type EffectCategory =
  | "calm" | "energy" | "sci-fi" | "fantasy" | "steampunk"
  | "botanical" | "urban" | "cosmic" | "tech" | "solar"
  | "retro" | "weather" | "cinematic" | "abstract" | "other";

export type PresetLevel = "Soft" | "Balanced" | "Strong" | "Showcase";
export type BackgroundMode = "solid" | "gradient" | "mesh" | "aurora" | "radial" | "horizon" | "spotlight" | "split" | "darkcenter";
export type FocusZone = "none" | "left" | "center" | "right" | "top" | "bottom";
export type SafeZone = "off" | "left" | "center" | "right" | "top" | "bottom" | "full";
export type BlendMode = "normal" | "screen" | "lighten" | "multiply" | "overlay";
export type EffectArea = "full" | "left" | "center" | "right" | "top" | "bottom";

export interface Resolution { width: number; height: number; }
export interface ColorPalette { accent1: string; accent2: string; accent3: string; background1: string; background2: string; }
export interface BackgroundSettings {
  mode: BackgroundMode; angle: number; lightX: number; lightY: number; hue: number;
  color?: string; colorize?: boolean; saturation: number; brightness: number;
  contrast: number; noise: number; vignette: number;
}

export interface EffectCustomControl {
  key: string; label: string; description?: string;
  min: number; max: number; step?: number; defaultValue: number; suffix?: string;
}

export interface EffectCapabilities {
  opacity: boolean; position: boolean; scale: boolean; rotation: boolean;
  blur: boolean; brightness: boolean; hue: boolean; density: boolean;
  blendMode: boolean; area: boolean; layer: boolean; speed?: boolean;
  color?: boolean; intensity?: boolean;
}

export interface EffectSettings {
  opacity: number; scale: number; x: number; y: number; rotation: number;
  blur: number; brightness: number; hue: number; color?: string; colorize?: boolean;
  density: number; blendMode: BlendMode; area: EffectArea; zIndex: number;
  speed: number; intensity: number;
  custom?: Record<string, number>;
}

export interface EffectDefinition {
  id: EffectId; name: string; description: string; category: EffectCategory;
  tags: string[]; defaultSettings: EffectSettings; capabilities: EffectCapabilities;
  performanceCost: 1 | 2 | 3 | 4 | 5; requiresJavaScript: boolean;
  customControls?: EffectCustomControl[];
}

export type LayerTimelineMode = "off" | "once" | "loop";
export interface LayerKeyframe {
  timeMs: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  /** 0-100 percent of the layer's base opacity. */
  opacity: number;
}
export interface LayerTimeline {
  mode: LayerTimelineMode;
  delayMs: number;
  durationMs: number;
  fadeInMs: number;
  fadeOutMs: number;
  easing?: "linear" | "ease-in-out";
  keyframes?: LayerKeyframe[];
}

export type EffectTriggerEvent =
  | "follower-latest" | "subscriber-latest" | "tip-latest"
  | "cheer-latest" | "raid-latest" | "message";
export interface AlertCaption {
  enabled: boolean;
  /** Template supports {name}, {amount}, {message}, {event}. */
  template: string;
  position: "top" | "center" | "bottom";
  fontSize: number;
  color: string;
}

export interface EffectTrigger {
  source: "event";
  event: EffectTriggerEvent;
  /** Anti-spam cooldown between activations of one effect instance. */
  cooldownMs: number;
  /** Minimum tip/cheer/raid amount, ignored for other types. */
  minAmount: number;
  caption?: AlertCaption;
  /** Legacy replace mode is preserved for imported scenes. */
  queueMode?: "replace" | "queue";
}

export interface EffectInstance {
  instanceId: EffectInstanceId; effectId: EffectId; seed: number; enabled: boolean;
  settings: EffectSettings; label?: string; locked?: boolean; groupId?: string | null; timeline?: LayerTimeline; trigger?: EffectTrigger;
}

export interface PresetEffect { effectId: EffectId; settings?: Partial<EffectSettings>; }
export interface Preset {
  id: string; name: string; family: EffectCategory; level: PresetLevel;
  description?: string; palette: ColorPalette; background: Partial<BackgroundSettings>;
  focusZone: FocusZone; effects: PresetEffect[];
}

export interface EditorState {
  resolution: Resolution; backgroundOnly: boolean; palette: ColorPalette;
  background: BackgroundSettings; focusZone: FocusZone; safeZone: SafeZone;
  effects: EffectInstance[]; selectedEffectInstanceId: EffectInstanceId | null;
  activePresetId: string | null;
}

export interface StreamElementsExportOptions {
  width: number; height: number; transparentBackground: boolean;
  targetFps: 30 | 60; optimization: "quality" | "balanced" | "performance";
}
export interface StreamElementsExport {
  html: string; css: string; javascript: string;
  estimatedDomNodes: number; estimatedPerformanceCost: number;
}
