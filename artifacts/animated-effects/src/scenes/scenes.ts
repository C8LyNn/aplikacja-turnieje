import type { BlendMode, EditorState, EffectArea, EffectCustomControl, EffectInstance, EffectSettings, FocusZone, SafeZone } from "../core/types";
import { getEffectDefinition } from "../effects/registry";

export const SCENE_FORMAT = "animated-effects-scene";
export const SCENE_VERSION = 1;
const DRAFT_KEY = "animated-effects:pack06:recovery";

export interface SceneDocumentV1 {
  format: typeof SCENE_FORMAT;
  version: typeof SCENE_VERSION;
  name: string;
  createdAt: string;
  resolution: EditorState["resolution"];
  backgroundOnly: boolean;
  palette: EditorState["palette"];
  background: EditorState["background"];
  focusZone: EditorState["focusZone"];
  safeZone: EditorState["safeZone"];
  effects: EffectInstance[];
}

function finite(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}

function safeSettings(raw: unknown, defaults: EffectSettings, controls: EffectCustomControl[] = []): EffectSettings {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const blendModes: BlendMode[] = ["normal","screen","lighten","multiply","overlay"];
  const areas: EffectArea[] = ["full","left","center","right","top","bottom"];
  const blendMode = blendModes.includes(source.blendMode as BlendMode) ? source.blendMode as BlendMode : defaults.blendMode;
  const area = areas.includes(source.area as EffectArea) ? source.area as EffectArea : defaults.area;
  const color = typeof source.color === "string" && /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : defaults.color;
  // Only restore keys declared by this effect; reject arbitrary scene JSON properties.
  const rawCustom = source.custom && typeof source.custom === "object" && !Array.isArray(source.custom)
    ? source.custom as Record<string, unknown> : {};
  const controlMap = new Map(controls.map((control) => [control.key, control]));
  const customKeys = new Set([...Object.keys(defaults.custom ?? {}), ...controls.map((control) => control.key)]);
  const custom: Record<string, number> = {};
  for (const key of customKeys) {
    const control = controlMap.get(key);
    const fallback = defaults.custom?.[key] ?? control?.defaultValue ?? 0;
    custom[key] = finite(rawCustom[key], fallback, control?.min ?? -1000000, control?.max ?? 1000000);
  }
  return {
    opacity: finite(source.opacity, defaults.opacity, 0, 100),
    scale: finite(source.scale, defaults.scale, 10, 400),
    x: finite(source.x, defaults.x, -300, 300), y: finite(source.y, defaults.y, -300, 300),
    rotation: finite(source.rotation, defaults.rotation, -1080, 1080),
    blur: finite(source.blur, defaults.blur, 0, 100), brightness: finite(source.brightness, defaults.brightness, 0, 500),
    hue: finite(source.hue, defaults.hue, -1080, 1080), color,
    colorize: typeof source.colorize === "boolean" ? source.colorize : defaults.colorize,
    density: finite(source.density, defaults.density, 0, 400), blendMode, area,
    zIndex: finite(source.zIndex, defaults.zIndex, -1000, 1000),
    speed: finite(source.speed, defaults.speed, 1, 500), intensity: finite(source.intensity, defaults.intensity, 0, 200),
    custom: customKeys.size ? custom : undefined,
  };
}

export function makeSceneDocument(state: EditorState, name = "Animated Effects Scene"): SceneDocumentV1 {
  return {
    format: SCENE_FORMAT, version: SCENE_VERSION, name, createdAt: new Date().toISOString(),
    resolution: structuredClone(state.resolution), backgroundOnly: state.backgroundOnly,
    palette: structuredClone(state.palette), background: structuredClone(state.background),
    focusZone: state.focusZone, safeZone: state.safeZone, effects: structuredClone(state.effects),
  };
}
export function serializeScene(state: EditorState, name?: string): string {
  return JSON.stringify(makeSceneDocument(state, name), null, 2);
}

export function parseScene(text: string, current: EditorState): { state: EditorState; warnings: string[]; name: string } {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Nieprawidłowy format sceny.");
  const raw = parsed as Record<string, unknown>;
  if (raw.format !== SCENE_FORMAT) throw new Error("To nie jest plik Animated Effects Scene.");
  if (raw.version !== SCENE_VERSION) throw new Error(`Nieobsługiwana wersja sceny: ${String(raw.version)}.`);
  const warnings: string[] = [];
  const seen = new Set<string>();
  const effects: EffectInstance[] = [];
  const rawEffects = Array.isArray(raw.effects) ? raw.effects : [];
  for (const item of rawEffects) {
    if (!item || typeof item !== "object") { warnings.push("Pominięto nieprawidłową warstwę."); continue; }
    const value = item as Record<string, unknown>;
    const effectId = typeof value.effectId === "string" ? value.effectId : "";
    const definition = getEffectDefinition(effectId);
    if (!definition) { warnings.push(`Pominięto nieznany efekt: ${effectId || "(brak id)"}.`); continue; }
    let instanceId = typeof value.instanceId === "string" && value.instanceId ? value.instanceId : crypto.randomUUID();
    if (seen.has(instanceId)) { warnings.push(`Naprawiono powtórzone instanceId: ${effectId}.`); instanceId = crypto.randomUUID(); }
    seen.add(instanceId);
    effects.push({
      instanceId, effectId,
      seed: finite(value.seed, Math.floor(Math.random() * 0xffffffff), 0, 0xffffffff),
      enabled: typeof value.enabled === "boolean" ? value.enabled : true,
      settings: safeSettings(value.settings, definition.defaultSettings, definition.customControls),
      label: typeof value.label === "string" ? value.label.trim().slice(0,80) || undefined : undefined,
      locked: value.locked === true,
      groupId: typeof value.groupId === "string" ? value.groupId : null,
    });
  }
  const resolution = raw.resolution && typeof raw.resolution === "object" ? raw.resolution as Record<string, unknown> : {};
  const next: EditorState = {
    ...structuredClone(current),
    resolution: {
      width: finite(resolution.width, current.resolution.width, 240, 7680),
      height: finite(resolution.height, current.resolution.height, 240, 4320),
    },
    effects, selectedEffectInstanceId: effects.at(-1)?.instanceId ?? null, activePresetId: null,
  };
  if (raw.palette && typeof raw.palette === "object") next.palette = { ...next.palette, ...raw.palette as EditorState["palette"] };
  if (raw.background && typeof raw.background === "object") next.background = { ...next.background, ...raw.background as EditorState["background"] };
  if (typeof raw.backgroundOnly === "boolean") next.backgroundOnly = raw.backgroundOnly;
  const focusZones: FocusZone[] = ["none", "left", "center", "right", "top", "bottom"];
  const safeZones: SafeZone[] = ["off", "left", "center", "right", "top", "bottom", "full"];
  if (focusZones.includes(raw.focusZone as FocusZone)) next.focusZone = raw.focusZone as FocusZone;
  if (safeZones.includes(raw.safeZone as SafeZone)) next.safeZone = raw.safeZone as SafeZone;
  return { state: next, warnings, name: typeof raw.name === "string" ? raw.name.slice(0, 120) : "Imported Scene" };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export function downloadScene(state: EditorState): void {
  downloadBlob(new Blob([serializeScene(state)], { type:"application/json;charset=utf-8" }), `animated-effects-${Date.now()}.aescene.json`);
}
export function saveRecoveryDraft(state: EditorState): void {
  try { localStorage.setItem(DRAFT_KEY, serializeScene(state, "Recovery Draft")); } catch { /* disabled */ }
}
export function hasRecoveryDraft(): boolean {
  try { return Boolean(localStorage.getItem(DRAFT_KEY)); } catch { return false; }
}
export function loadRecoveryDraft(current: EditorState): EditorState | null {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? parseScene(raw, current).state : null; } catch { return null; }
}
