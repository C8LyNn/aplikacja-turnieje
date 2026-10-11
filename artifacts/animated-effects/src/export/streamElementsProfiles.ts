import type { EditorState, EffectInstance, EffectSettings } from "../core/types";
import { getEffectDefinition } from "../effects/registry";
import {
  normalizeStreamElementsTriggerOptions,
  normalizeStreamElementsRoutes,
  type StreamElementsRouteInput,
  type StreamElementsTriggerOptions,
} from "./triggerOptions";

export const PROFILE_FORMAT = "animated-effects-stream-elements-profile";
export const PROFILE_VERSION = 1;
export const PROFILE_STORAGE_KEY = "animated-effects:se-profiles:v1";
export const MAX_SAVED_PROFILES = 16;
export const MAX_PROFILE_BYTES = 1024 * 1024;

export interface StreamElementsProfile {
  format: typeof PROFILE_FORMAT;
  version: typeof PROFILE_VERSION;
  name: string;
  createdAt: string;
  scene: EditorState;
  trigger: StreamElementsTriggerOptions;
  routes: StreamElementsRouteInput[] | null;
}

type RecordValue = Record<string, unknown>;
const isObject = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown, limit = 1000000): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const hexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

function parseScene(input: unknown): EditorState {
  if (!isObject(input) || !isObject(input.resolution) ||
      !isObject(input.palette) || !isObject(input.background) ||
      !Array.isArray(input.effects)) {
    throw new Error("Plik nie zawiera poprawnej sceny Animated Effects.");
  }
  const resolution = input.resolution;
  if (!finite(resolution.width) || !finite(resolution.height) ||
      resolution.width < 64 || resolution.width > 8192 ||
      resolution.height < 64 || resolution.height > 8192) {
    throw new Error("Nieprawidłowa rozdzielczość sceny.");
  }

  const palette = input.palette;
  for (const key of ["accent1", "accent2", "accent3", "background1", "background2"]) {
    if (!hexColor(palette[key])) throw new Error("Nieprawidłowa paleta sceny.");
  }

  const background = input.background;
  const backgrounds = ["solid", "gradient", "mesh", "aurora", "radial", "horizon", "spotlight", "split", "darkcenter"];
  if (!backgrounds.includes(String(background.mode))) throw new Error("Nieobsługiwane tło sceny.");
  for (const key of ["angle", "lightX", "lightY", "hue", "saturation", "brightness", "contrast", "noise", "vignette"]) {
    if (!finite(background[key])) throw new Error("Nieprawidłowe parametry tła.");
  }
  if (background.color !== undefined && !hexColor(background.color)) throw new Error("Nieprawidłowy kolor tła.");
  if (background.colorize !== undefined && typeof background.colorize !== "boolean") throw new Error("Nieprawidłowa konfiguracja tła.");
  if (typeof input.backgroundOnly !== "boolean" ||
      !["none", "left", "center", "right", "top", "bottom"].includes(String(input.focusZone)) ||
      !["off", "left", "center", "right", "top", "bottom", "full"].includes(String(input.safeZone))) {
    throw new Error("Nieprawidłowe ustawienia sceny.");
  }
  if (input.effects.length > 64) throw new Error("Zbyt wiele warstw w profilu.");
  const ids = new Set<string>();
  const effects: EffectInstance[] = input.effects.map((raw: unknown) => {
    if (!isObject(raw) || !validId(raw.instanceId) || ids.has(raw.instanceId) ||
        typeof raw.effectId !== "string" || typeof raw.enabled !== "boolean" ||
        !finite(raw.seed, 0xffffffff) || raw.seed < 0 || !Number.isInteger(raw.seed) ||
        !isObject(raw.settings)) {
      throw new Error("Profil zawiera nieprawidłową warstwę efektu.");
    }
    const definition = getEffectDefinition(raw.effectId);
    if (!definition) throw new Error("Nieznany efekt: " + raw.effectId.slice(0, 80));
    ids.add(raw.instanceId);
    const settings = raw.settings;
    const numberKeys = ["opacity", "scale", "x", "y", "rotation", "blur", "brightness", "hue", "density", "zIndex", "speed", "intensity"];
    for (const key of numberKeys) {
      if (!finite(settings[key])) throw new Error("Nieprawidłowe ustawienie efektu: " + key);
    }
    if (!["normal", "screen", "lighten", "multiply", "overlay"].includes(String(settings.blendMode)) ||
        !["full", "left", "center", "right", "top", "bottom"].includes(String(settings.area)) ||
        (settings.color !== undefined && !hexColor(settings.color)) ||
        (settings.colorize !== undefined && typeof settings.colorize !== "boolean") ||
        (settings.custom !== undefined && !isObject(settings.custom))) {
      throw new Error("Nieprawidłowe opcje warstwy efektu.");
    }
    if (isObject(settings.custom)) {
      const entries = Object.entries(settings.custom);
      if (entries.length > 80 || entries.some(([key, value]) => !/^[\w-]{1,64}$/.test(key) || !finite(value))) {
        throw new Error("Nieprawidłowe parametry własne efektu.");
      }
    }
    if (raw.label !== undefined && (typeof raw.label !== "string" || raw.label.length > 100)) {
      throw new Error("Nieprawidłowa etykieta warstwy.");
    }
    if (raw.locked !== undefined && typeof raw.locked !== "boolean") throw new Error("Nieprawidłowa blokada warstwy.");
    if (raw.groupId !== undefined && raw.groupId !== null && !validId(raw.groupId)) {
      throw new Error("Nieprawidłowa grupa warstwy.");
    }
    return {
      instanceId: raw.instanceId,
      effectId: definition.id,
      enabled: raw.enabled,
      seed: raw.seed,
      settings: {
        ...definition.defaultSettings,
        ...Object.fromEntries(numberKeys.map((key) => [key, settings[key]])),
        blendMode: settings.blendMode,
        area: settings.area,
        ...(settings.color === undefined ? {} : { color: settings.color }),
        ...(settings.colorize === undefined ? {} : { colorize: settings.colorize }),
        ...(settings.custom === undefined ? {} : { custom: { ...settings.custom } }),
      } as EffectSettings,
      ...(raw.label === undefined ? {} : { label: raw.label }),
      locked: raw.locked === true,
      groupId: raw.groupId === undefined ? null : raw.groupId,
    };
  });

  return {
    resolution: { width: resolution.width, height: resolution.height },
    backgroundOnly: input.backgroundOnly,
    palette: {
      accent1: palette.accent1 as string,
      accent2: palette.accent2 as string,
      accent3: palette.accent3 as string,
      background1: palette.background1 as string,
      background2: palette.background2 as string,
    },
    background: {
      mode: background.mode as EditorState["background"]["mode"],
      angle: background.angle as number,
      lightX: background.lightX as number,
      lightY: background.lightY as number,
      hue: background.hue as number,
      saturation: background.saturation as number,
      brightness: background.brightness as number,
      contrast: background.contrast as number,
      noise: background.noise as number,
      vignette: background.vignette as number,
      ...(background.color === undefined ? {} : { color: background.color as string }),
      ...(background.colorize === undefined ? {} : { colorize: background.colorize as boolean }),
    },
    focusZone: input.focusZone as EditorState["focusZone"],
    safeZone: input.safeZone as EditorState["safeZone"],
    effects,
    selectedEffectInstanceId: typeof input.selectedEffectInstanceId === "string" && ids.has(input.selectedEffectInstanceId)
      ? input.selectedEffectInstanceId : null,
    activePresetId: typeof input.activePresetId === "string" && input.activePresetId.length <= 100
      ? input.activePresetId : null,
  };
}

export function createStreamElementsProfile(
  name: string,
  scene: EditorState,
  trigger: Partial<StreamElementsTriggerOptions>,
  routes: readonly StreamElementsRouteInput[] | undefined,
): StreamElementsProfile {
  const trimmed = name.trim().slice(0, 64);
  if (!trimmed) throw new Error("Podaj nazwę zestawu animacji.");
  const checkedScene = parseScene(scene);
  const enabled = checkedScene.effects.filter((effect) => effect.enabled).map((effect) => effect.instanceId);
  return {
    format: PROFILE_FORMAT,
    version: PROFILE_VERSION,
    name: trimmed,
    createdAt: new Date().toISOString(),
    scene: checkedScene,
    trigger: normalizeStreamElementsTriggerOptions(trigger),
    routes: routes === undefined ? null : normalizeStreamElementsRoutes(routes, enabled),
  };
}

export function parseStreamElementsProfile(value: unknown): StreamElementsProfile {
  const input: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (!isObject(input) || input.format !== PROFILE_FORMAT || input.version !== PROFILE_VERSION ||
      typeof input.name !== "string" || !input.name.trim() || input.name.length > 64 ||
      typeof input.createdAt !== "string" || Number.isNaN(Date.parse(input.createdAt)) ||
      !isObject(input.trigger) || (input.routes !== null && !Array.isArray(input.routes))) {
    throw new Error("Nieobsługiwany lub uszkodzony profil StreamElements.");
  }
  if (typeof input.mode === "string" && input.mode === "never") throw new Error("Nieprawidłowy profil.");
  const scene = parseScene(input.scene);
  const trigger = normalizeStreamElementsTriggerOptions(input.trigger as Partial<StreamElementsTriggerOptions>);
  const enabled = scene.effects.filter((effect) => effect.enabled).map((effect) => effect.instanceId);
  const routes = input.routes === null
    ? null
    : normalizeStreamElementsRoutes(input.routes as StreamElementsRouteInput[], enabled);
  return {
    format: PROFILE_FORMAT,
    version: PROFILE_VERSION,
    name: input.name.trim(),
    createdAt: input.createdAt,
    scene,
    trigger,
    routes,
  };
}

export function loadStreamElementsProfiles(storage: Pick<Storage, "getItem">): StreamElementsProfile[] {
  let saved: string | null;
  try {
    saved = storage.getItem(PROFILE_STORAGE_KEY);
  } catch {
    throw new Error("Przeglądarka zablokowała dostęp do zapisanych zestawów.");
  }
  if (!saved) return [];
  if (saved.length > MAX_PROFILE_BYTES * MAX_SAVED_PROFILES) throw new Error("Biblioteka zestawów jest za duża.");
  let raw: unknown;
  try { raw = JSON.parse(saved); } catch { throw new Error("Biblioteka zestawów jest uszkodzona."); }
  if (!Array.isArray(raw)) throw new Error("Biblioteka zestawów jest uszkodzona.");
  return raw.slice(0, MAX_SAVED_PROFILES).map(parseStreamElementsProfile);
}

export function saveStreamElementsProfiles(
  storage: Pick<Storage, "setItem">,
  profiles: readonly StreamElementsProfile[],
): void {
  if (profiles.length > MAX_SAVED_PROFILES) throw new Error("Limit: 16 zapisanych zestawów.");
  const checked = profiles.map(parseStreamElementsProfile);
  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(checked));
  } catch {
    throw new Error("Nie udało się zapisać zestawu w pamięci przeglądarki.");
  }
}
