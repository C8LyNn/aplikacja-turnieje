import type { EditorState, EffectId, EffectInstance, EffectInstanceId, EffectSettings, LayerKeyframe } from "../core/types";
import { getEffectDefinition } from "../effects/registry";
import { normalizedMotionTimeline, normalizeLayerKeyframes, upsertKeyframe } from "../animation/motion";

const state: EditorState = {
  resolution: { width: 1920, height: 1080 },
  backgroundOnly: true,
  palette: {
    accent1: "#7c5cff", accent2: "#00d9ff", accent3: "#ff4fb0",
    background1: "#080b12", background2: "#101827",
  },
  background: {
    mode: "gradient", angle: 145, lightX: 50, lightY: 40, hue: 0,
    saturation: 1, brightness: 1, contrast: 1, noise: 0, vignette: 0.2,
  },
  focusZone: "none", safeZone: "off", effects: [],
  selectedEffectInstanceId: null, activePresetId: null,
};

type StateListener = (state: EditorState) => void;
const listeners = new Set<StateListener>();

type HistoryEntry = { label: string; snapshot: EditorState };
const undoStack: HistoryEntry[] = [];
const redoStack: HistoryEntry[] = [];
const HISTORY_LIMIT = 100;
let transaction: { label: string; before: EditorState } | null = null;

const clone = (value: EditorState): EditorState => structuredClone(value);
const same = (a: EditorState, b: EditorState): boolean => JSON.stringify(a) === JSON.stringify(b);
const notify = (): void => listeners.forEach((listener) => listener(state));

function pushUndo(label: string, snapshot: EditorState): void {
  undoStack.push({ label, snapshot });
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
}

function mutate(label: string, action: () => void): void {
  const before = transaction ? null : clone(state);
  action();
  if (before && !same(before, state)) pushUndo(label, before);
  notify();
}

export function getEditorState(): EditorState { return state; }
export function subscribe(listener: StateListener): () => void {
  listeners.add(listener); return () => listeners.delete(listener);
}

export function beginHistoryTransaction(label: string): void {
  if (!transaction) transaction = { label, before: clone(state) };
}
export function endHistoryTransaction(): void {
  if (!transaction) return;
  const current = transaction; transaction = null;
  if (!same(current.before, state)) { pushUndo(current.label, current.before); notify(); }
}
export function clearHistory(): void { undoStack.length = 0; redoStack.length = 0; transaction = null; }
export function canUndo(): boolean { return undoStack.length > 0; }
export function canRedo(): boolean { return redoStack.length > 0; }
export function getUndoLabel(): string | null { return undoStack.at(-1)?.label ?? null; }
export function getRedoLabel(): string | null { return redoStack.at(-1)?.label ?? null; }
export function undo(): void {
  const entry = undoStack.pop(); if (!entry) return;
  redoStack.push({ label: entry.label, snapshot: clone(state) });
  Object.assign(state, clone(entry.snapshot)); notify();
}
export function redo(): void {
  const entry = redoStack.pop(); if (!entry) return;
  undoStack.push({ label: entry.label, snapshot: clone(state) });
  Object.assign(state, clone(entry.snapshot)); notify();
}

export function addEffect(effectId: EffectId): EffectInstance | null {
  const definition = getEffectDefinition(effectId);
  if (!definition) { console.warn(`Unknown effect: ${effectId}`); return null; }
  let created: EffectInstance | null = null;
  mutate(`Dodaj ${definition.name}`, () => {
    const instance: EffectInstance = {
      instanceId: crypto.randomUUID(), effectId,
      seed: Math.floor(Math.random() * 0xffffffff), enabled: true,
      settings: { ...definition.defaultSettings }, locked: false, groupId: null,
    };
    state.effects.push(instance); state.selectedEffectInstanceId = instance.instanceId;
    state.activePresetId = null; created = instance;
  });
  return created;
}

export function duplicateEffect(instanceId: EffectInstanceId, keepSeed = false): EffectInstance | null {
  const source = state.effects.find((effect) => effect.instanceId === instanceId);
  if (!source) return null;
  let created: EffectInstance | null = null;
  mutate(`Duplikuj ${source.label ?? source.effectId}`, () => {
    const sourceIndex = state.effects.indexOf(source);
    const copy: EffectInstance = {
      ...structuredClone(source), instanceId: crypto.randomUUID(),
      seed: keepSeed ? source.seed : Math.floor(Math.random() * 0xffffffff), locked: false,
    };
    state.effects.splice(sourceIndex + 1, 0, copy); state.selectedEffectInstanceId = copy.instanceId; created = copy;
  });
  return created;
}

export function removeEffect(instanceId: EffectInstanceId, force = false): boolean {
  const index = state.effects.findIndex((effect) => effect.instanceId === instanceId);
  if (index < 0) return false;
  const effect = state.effects[index]; if (effect?.locked && !force) return false;
  mutate(`Usuń ${effect?.label ?? effect?.effectId ?? "warstwę"}`, () => {
    state.effects.splice(index, 1);
    if (state.selectedEffectInstanceId === instanceId) state.selectedEffectInstanceId = state.effects.at(-1)?.instanceId ?? null;
  });
  return true;
}

export function clearEffects(includeLocked = false): void {
  mutate("Wyczyść scenę", () => {
    state.effects = includeLocked ? [] : state.effects.filter((effect) => effect.locked);
    const ids = new Set(state.effects.map((effect) => effect.instanceId));
    if (state.selectedEffectInstanceId && !ids.has(state.selectedEffectInstanceId)) state.selectedEffectInstanceId = state.effects.at(-1)?.instanceId ?? null;
    state.activePresetId = null;
  });
}

export function selectEffect(instanceId: EffectInstanceId): void {
  if (!state.effects.some((effect) => effect.instanceId === instanceId)) return;
  state.selectedEffectInstanceId = instanceId; notify();
}
export function toggleEffect(instanceId: EffectInstanceId): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId); if (!effect) return;
  mutate(`${effect.enabled ? "Wyłącz" : "Włącz"} ${effect.label ?? effect.effectId}`, () => { effect.enabled = !effect.enabled; });
}
export function toggleEffectLocked(instanceId: EffectInstanceId): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId); if (!effect) return;
  mutate(`${effect.locked ? "Odblokuj" : "Zablokuj"} ${effect.label ?? effect.effectId}`, () => { effect.locked = !effect.locked; });
}
export function renameEffect(instanceId: EffectInstanceId, label: string): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId); if (!effect) return;
  const normalized = label.trim().slice(0, 80);
  mutate("Zmień nazwę warstwy", () => { effect.label = normalized || undefined; });
}

export function moveEffectUp(instanceId: EffectInstanceId): void {
  const index = state.effects.findIndex((effect) => effect.instanceId === instanceId);
  const current = state.effects[index]; if (index < 0 || index === state.effects.length - 1 || current?.locked) return;
  const next = state.effects[index + 1]; if (!next || next.locked) return;
  mutate("Przenieś warstwę wyżej", () => { state.effects[index + 1] = state.effects[index]!; state.effects[index] = next; });
}
export function moveEffectDown(instanceId: EffectInstanceId): void {
  const index = state.effects.findIndex((effect) => effect.instanceId === instanceId);
  const current = state.effects[index]; if (index <= 0 || current?.locked) return;
  const previous = state.effects[index - 1]; if (!previous || previous.locked) return;
  mutate("Przenieś warstwę niżej", () => { state.effects[index - 1] = state.effects[index]!; state.effects[index] = previous; });
}

// Visible list is reverse(state.effects), so visual "before" = underlying "after target".
export function moveEffectBefore(sourceId: EffectInstanceId, targetId: EffectInstanceId): void {
  if (sourceId === targetId) return;
  const source = state.effects.find((effect) => effect.instanceId === sourceId);
  const target = state.effects.find((effect) => effect.instanceId === targetId);
  if (!source || !target || source.locked || target.locked) return;
  mutate("Zmień kolejność warstw", () => {
    state.effects.splice(state.effects.indexOf(source), 1);
    const targetIndex = state.effects.indexOf(target);
    state.effects.splice(targetIndex + 1, 0, source);
  });
}

export function getSelectedEffect(): EffectInstance | null {
  const id = state.selectedEffectInstanceId; if (!id) return null;
  return state.effects.find((effect) => effect.instanceId === id) ?? null;
}
export function updateEffectSettings(instanceId: EffectInstanceId, settings: Partial<EffectInstance["settings"]>): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId); if (!effect) return;
  mutate(`Zmień ${effect.label ?? effect.effectId}`, () => {
    effect.settings = { ...effect.settings, ...settings }; state.activePresetId = null;
  });
}
/** Timed appearance is optional, so old scenes retain their continuous behavior. */
export function updateEffectTimeline(
  instanceId: EffectInstanceId,
  patch: Partial<NonNullable<EffectInstance["timeline"]>>,
): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId);
  if (!effect) return;
  const timeline = normalizedMotionTimeline({ ...effect.timeline, ...patch }, effect.settings);
  mutate("Zmień czas animacji", () => {
    effect.timeline = timeline;
    state.activePresetId = null;
  });
}

/** Insert or overwrite a pose at a relative millisecond position. */
export function addEffectKeyframe(instanceId: EffectInstanceId, timeMs: number): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId);
  if (!effect) return;
  const timeline = normalizedMotionTimeline(effect.timeline, effect.settings);
  const frames = timeline.keyframes ?? [];
  const previous = [...frames].reverse().find((frame) => frame.timeMs <= timeMs);
  const pose = previous ?? { ...effect.settings, opacity: 100 };
  const next = upsertKeyframe(timeline, timeMs, pose, effect.settings);
  mutate("Dodaj klatkę kluczową", () => {
    effect.timeline = { ...timeline, mode: timeline.mode === "off" ? "once" : timeline.mode, keyframes: next };
    state.activePresetId = null;
  });
}

/** Edits preserve full poses and the 16-keyframe bound. */
export function editEffectKeyframe(
  instanceId: EffectInstanceId,
  originalTimeMs: number,
  patch: Partial<LayerKeyframe>,
): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId);
  if (!effect) return;
  const timeline = normalizedMotionTimeline(effect.timeline, effect.settings);
  const current = (timeline.keyframes ?? []).find((frame) => frame.timeMs === originalTimeMs);
  if (!current) return;
  const targetTime = Math.max(0, Math.min(timeline.durationMs, Math.round(patch.timeMs ?? originalTimeMs)));
  // Two distinct poses must not silently overwrite each other.
  if ((timeline.keyframes ?? []).some((frame) => frame.timeMs === targetTime && frame.timeMs !== originalTimeMs)) return;
  const next = normalizeLayerKeyframes(
    [...(timeline.keyframes ?? []).filter((frame) => frame.timeMs !== originalTimeMs), { ...current, ...patch }],
    timeline.durationMs,
    effect.settings,
  );
  mutate("Edytuj klatkę kluczową", () => {
    effect.timeline = { ...timeline, keyframes: next };
    state.activePresetId = null;
  });
}

export function removeEffectKeyframe(instanceId: EffectInstanceId, timeMs: number): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId);
  if (!effect) return;
  const timeline = normalizedMotionTimeline(effect.timeline, effect.settings);
  if (!(timeline.keyframes ?? []).some((frame) => frame.timeMs === timeMs)) return;
  mutate("Usuń klatkę kluczową", () => {
    effect.timeline = {
      ...timeline,
      keyframes: (timeline.keyframes ?? []).filter((frame) => frame.timeMs !== timeMs),
    };
    state.activePresetId = null;
  });
}

export function updateEffectSeed(instanceId: EffectInstanceId, seed: number): void {
  const effect = state.effects.find((item) => item.instanceId === instanceId); if (!effect) return;
  const normalized = Math.max(0, Math.min(0xffffffff, Math.floor(seed)));
  mutate("Zmień seed", () => { effect.seed = normalized; });
}
export function rerollEffect(instanceId: EffectInstanceId): void { updateEffectSeed(instanceId, Math.floor(Math.random() * 0xffffffff)); }
export function rerollAllEffects(): void {
  mutate("Losuj wszystkie seedy", () => state.effects.forEach((effect) => { effect.seed = Math.floor(Math.random() * 0xffffffff); }));
}
export function replaceEditorState(nextState: EditorState, label = "Wczytaj scenę"): void {
  const copy = clone(nextState); mutate(label, () => Object.assign(state, copy));
}
export function applyEffectPreset(entries: Array<{ effectId: EffectId; settings?: Partial<EffectSettings> }>, label = "Zastosuj preset sceny"): void {
  mutate(label, () => {
    const nextEffects: EffectInstance[] = [];
    for (const entry of entries) {
      const definition = getEffectDefinition(entry.effectId); if (!definition) continue;
      nextEffects.push({
        instanceId: crypto.randomUUID(), effectId: definition.id,
        seed: Math.floor(Math.random() * 0xffffffff), enabled: true,
        settings: { ...definition.defaultSettings, ...entry.settings }, locked: false, groupId: null,
      });
    }
    state.effects = nextEffects; state.selectedEffectInstanceId = nextEffects.at(-1)?.instanceId ?? null; state.activePresetId = null;
  });
}
