import type {
  EditorState,
  EffectId,
  EffectInstance,
  EffectInstanceId,
} from "../core/types";

import { getEffectDefinition } from "../effects/registry";

const state: EditorState = {
  resolution: {
    width: 1920,
    height: 1080,
  },

  backgroundOnly: true,

  palette: {
    accent1: "#7c5cff",
    accent2: "#00d9ff",
    accent3: "#ff4fb0",
    background1: "#080b12",
    background2: "#101827",
  },

  background: {
    mode: "gradient",

    angle: 145,

    lightX: 50,
    lightY: 40,

    hue: 0,
    saturation: 1,
    brightness: 1,
    contrast: 1,

    noise: 0,
    vignette: 0.2,
  },

  focusZone: "none",
  safeZone: "off",

  effects: [],

  selectedEffectInstanceId: null,

  activePresetId: null,
};

type StateListener = (state: EditorState) => void;

const listeners = new Set<StateListener>();

function notify(): void {
  listeners.forEach((listener) => listener(state));
}

export function getEditorState(): EditorState {
  return state;
}

export function subscribe(
  listener: StateListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function addEffect(
  effectId: EffectId,
): EffectInstance | null {
  const definition = getEffectDefinition(effectId);

  if (!definition) {
    console.warn(`Unknown effect: ${effectId}`);
    return null;
  }

const instance: EffectInstance = {
  instanceId: crypto.randomUUID(),

  effectId,

  seed: Math.floor(
    Math.random() * 0xffffffff,
  ),

  enabled: true,

  settings: {
    ...definition.defaultSettings,
  },
};

  state.effects.push(instance);

  state.selectedEffectInstanceId =
    instance.instanceId;

  state.activePresetId = null;

  notify();

  return instance;
}

export function removeEffect(
  instanceId: EffectInstanceId,
): void {
  const index = state.effects.findIndex(
    (effect) => effect.instanceId === instanceId,
  );

  if (index === -1) {
    return;
  }

  state.effects.splice(index, 1);

  if (
    state.selectedEffectInstanceId === instanceId
  ) {
    state.selectedEffectInstanceId =
      state.effects.at(-1)?.instanceId ?? null;
  }

  notify();
}

export function clearEffects(): void {
  state.effects = [];

  state.selectedEffectInstanceId = null;

  state.activePresetId = null;

  notify();
}

export function selectEffect(
  instanceId: EffectInstanceId,
): void {
  const exists = state.effects.some(
    (effect) => effect.instanceId === instanceId,
  );

  if (!exists) {
    return;
  }

  state.selectedEffectInstanceId = instanceId;

  notify();
}

export function toggleEffect(
  instanceId: EffectInstanceId,
): void {
  const effect = state.effects.find(
    (item) => item.instanceId === instanceId,
  );

  if (!effect) {
    return;
  }

  effect.enabled = !effect.enabled;

  notify();
}

export function moveEffectUp(
  instanceId: EffectInstanceId,
): void {
  const index = state.effects.findIndex(
    (effect) => effect.instanceId === instanceId,
  );

  if (
    index === -1 ||
    index === state.effects.length - 1
  ) {
    return;
  }

  const next = state.effects[index + 1];

  if (!next) {
    return;
  }

  state.effects[index + 1] =
    state.effects[index]!;

  state.effects[index] = next;

  notify();
}

export function moveEffectDown(
  instanceId: EffectInstanceId,
): void {
  const index = state.effects.findIndex(
    (effect) => effect.instanceId === instanceId,
  );

  if (index <= 0) {
    return;
  }

  const previous = state.effects[index - 1];

  if (!previous) {
    return;
  }

  state.effects[index - 1] =
    state.effects[index]!;

  state.effects[index] = previous;

  notify();
}
export function getSelectedEffect(): EffectInstance | null {
  const id = state.selectedEffectInstanceId;

  if (!id) {
    return null;
  }

  return (
    state.effects.find(
      (effect) => effect.instanceId === id,
    ) ?? null
  );
}

export function updateEffectSettings(
  instanceId: EffectInstanceId,
  settings: Partial<EffectInstance["settings"]>,
): void {
  const effect = state.effects.find(
    (item) => item.instanceId === instanceId,
  );

  if (!effect) {
    return;
  }

  effect.settings = {
    ...effect.settings,
    ...settings,
  };

  state.activePresetId = null;

  notify();
}