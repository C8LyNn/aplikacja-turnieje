import type { EffectInstance, LayerKeyframe } from "../core/types";
import { addEffectKeyframe, editEffectKeyframe, getEditorState, removeEffectKeyframe, updateEffectTimeline } from "../editor/state";
import { MAX_KEYFRAMES, normalizedMotionTimeline } from "./motion";

const selectedFrames = new Map<string, number>();
const seconds = (ms: number): string => String(Number((ms / 1000).toFixed(3)));

function getSelectedFrame(effect: EffectInstance): LayerKeyframe | null {
  const frames = normalizedMotionTimeline(effect.timeline, effect.settings).keyframes ?? [];
  const selectedTime = selectedFrames.get(effect.instanceId);
  return frames.find((frame) => frame.timeMs === selectedTime) ?? frames.at(-1) ?? null;
}

export function keyframeInspectorTemplate(effect: EffectInstance): string {
  const timeline = normalizedMotionTimeline(effect.timeline, effect.settings);
  const frames = timeline.keyframes ?? [];
  const active = getSelectedFrame(effect);
  const newTime = frames.length === 0 ? 0 : frames.length === 1 ? timeline.durationMs : Math.round(timeline.durationMs / 2);
  const fields = [
    { key: "timeMs", label: "Moment (s)", value: active ? seconds(active.timeMs) : "0", min: 0, max: seconds(timeline.durationMs), step: "0.1" },
    { key: "x", label: "Pozycja X (%)", value: active?.x ?? effect.settings.x, min: -300, max: 300, step: "1" },
    { key: "y", label: "Pozycja Y (%)", value: active?.y ?? effect.settings.y, min: -300, max: 300, step: "1" },
    { key: "scale", label: "Skala (%)", value: active?.scale ?? effect.settings.scale, min: 10, max: 400, step: "1" },
    { key: "rotation", label: "Obrót (°)", value: active?.rotation ?? effect.settings.rotation, min: -1080, max: 1080, step: "1" },
    { key: "opacity", label: "Widoczność (%)", value: active?.opacity ?? 100, min: 0, max: 100, step: "1" },
  ];
  return `
    <section class="ae-keyframe-editor" aria-label="Klatki kluczowe warstwy">
      <div class="ae-keyframe-head">
        <strong>Klatki kluczowe</strong>
        <small>${frames.length} / ${MAX_KEYFRAMES} · ruch całej warstwy</small>
      </div>
      <p class="ae-timeline-hint">Klatki opisują pozycję, skalę, obrót i widoczność w danym momencie cyklu. Ruch nie wpływa na animacje cząsteczek wewnątrz efektu.</p>
      <label class="inspector-field">
        <span class="inspector-label"><span>Interpolacja</span></span>
        <select data-kf-easing aria-label="Interpolacja klatek kluczowych">
          <option value="linear" ${timeline.easing !== "ease-in-out" ? "selected" : ""}>Liniowa</option>
          <option value="ease-in-out" ${timeline.easing === "ease-in-out" ? "selected" : ""}>Płynna (ease-in-out)</option>
        </select>
      </label>
      <div class="ae-keyframe-presets">
        <button type="button" class="ae-button ae-button-secondary" data-kf-preset="slide">Przesunięcie →</button>
        <button type="button" class="ae-button ae-button-secondary" data-kf-preset="pulse">Pulsowanie</button>
      </div>
      <div class="ae-keyframe-ruler" aria-hidden="true">
        ${frames.map((frame) => `<span class="ae-keyframe-dot" style="left:${(frame.timeMs / timeline.durationMs * 100).toFixed(3)}%"></span>`).join("")}
      </div>
      <label class="inspector-field">
        <span class="inspector-label"><span>Edytowana klatka</span></span>
        <select data-kf-select aria-label="Wybierz klatkę kluczową" ${frames.length ? "" : "disabled"}>
          ${frames.map((frame, index) => `<option value="${frame.timeMs}" ${active?.timeMs === frame.timeMs ? "selected" : ""}>${index + 1}. ${seconds(frame.timeMs)} s</option>`).join("")}
        </select>
      </label>
      <div class="ae-keyframe-fields" ${active ? "" : "hidden"}>
        ${fields.map((field) => `
          <label class="ae-timeline-field">
            <span class="inspector-label"><span>${field.label}</span></span>
            <input type="number" data-kf-field="${field.key}" min="${field.min}" max="${field.max}" step="${field.step}" value="${field.value}">
          </label>
        `).join("")}
      </div>
      <div class="ae-keyframe-actions">
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Nowa klatka (s)</span></span>
          <input data-kf-new-time type="number" inputmode="decimal" value="${seconds(newTime)}" min="0" max="${seconds(timeline.durationMs)}" step="0.1">
        </label>
        <button type="button" class="ae-button ae-button-secondary" data-kf-add ${frames.length >= MAX_KEYFRAMES ? "disabled" : ""}>+ Dodaj</button>
        <button type="button" class="ae-button ae-button-secondary" data-kf-delete ${active ? "" : "disabled"}>Usuń klatkę</button>
      </div>
    </section>
  `;
}

export function bindKeyframeControls(container: HTMLElement, instanceId: string): void {
  const getEffect = (): EffectInstance | undefined =>
    getEditorState().effects.find((effect) => effect.instanceId === instanceId);

  const select = container.querySelector<HTMLSelectElement>("[data-kf-select]");
  const fields = container.querySelectorAll<HTMLInputElement>("[data-kf-field]");
  select?.addEventListener("change", () => {
    const effect = getEffect();
    if (!effect) return;
    const timeMs = Number(select.value);
    selectedFrames.set(instanceId, timeMs);
    const frame = normalizedMotionTimeline(effect.timeline, effect.settings).keyframes?.find((entry) => entry.timeMs === timeMs);
    if (!frame) return;
    fields.forEach((input) => {
      const field = input.dataset.kfField;
      if (field === "timeMs") input.value = seconds(frame.timeMs);
      else if (field === "x" || field === "y" || field === "scale" || field === "rotation" || field === "opacity") {
        input.value = String(frame[field]);
      }
    });
  });
  fields.forEach((input) => {
    input.addEventListener("change", () => {
      const effect = getEffect();
      const frame = effect ? getSelectedFrame(effect) : null;
      const field = input.dataset.kfField;
      const number = Number(input.value);
      if (!frame || !Number.isFinite(number) || !field) return;
      if (field === "timeMs") {
        const timeMs = Math.round(number * 1000);
        selectedFrames.set(instanceId, Math.max(0, Math.min(normalizedMotionTimeline(effect!.timeline, effect!.settings).durationMs, timeMs)));
        editEffectKeyframe(instanceId, frame.timeMs, { timeMs });
      } else if (field === "x" || field === "y" || field === "scale" || field === "rotation" || field === "opacity") {
        editEffectKeyframe(instanceId, frame.timeMs, { [field]: number });
      }
    });
  });

  container.querySelector<HTMLSelectElement>("[data-kf-easing]")?.addEventListener("change", (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    updateEffectTimeline(instanceId, { easing: value === "ease-in-out" ? "ease-in-out" : "linear" });
  });

  container.querySelector<HTMLButtonElement>("[data-kf-add]")?.addEventListener("click", () => {
    const input = container.querySelector<HTMLInputElement>("[data-kf-new-time]");
    const ms = Math.round(Number(input?.value ?? 0) * 1000);
    if (!Number.isFinite(ms)) return;
    const effect = getEffect();
    if (!effect) return;
    const duration = normalizedMotionTimeline(effect.timeline, effect.settings).durationMs;
    selectedFrames.set(instanceId, Math.max(0, Math.min(duration, ms)));
    addEffectKeyframe(instanceId, ms);
  });

  container.querySelector<HTMLButtonElement>("[data-kf-delete]")?.addEventListener("click", () => {
    const effect = getEffect();
    const frame = effect ? getSelectedFrame(effect) : null;
    if (!frame) return;
    selectedFrames.delete(instanceId);
    removeEffectKeyframe(instanceId, frame.timeMs);
  });

  container.querySelectorAll<HTMLButtonElement>("[data-kf-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const effect = getEffect();
      if (!effect) return;
      const time = normalizedMotionTimeline(effect.timeline, effect.settings);
      const origin = {
        x: effect.settings.x, y: effect.settings.y, scale: effect.settings.scale,
        rotation: effect.settings.rotation, opacity: 100,
      };
      const frames: LayerKeyframe[] = button.dataset.kfPreset === "pulse"
        ? [
            { timeMs: 0, ...origin },
            { timeMs: Math.round(time.durationMs / 2), ...origin, scale: Math.min(400, origin.scale * 1.3) },
            { timeMs: time.durationMs, ...origin },
          ]
        : [
            { timeMs: 0, ...origin },
            { timeMs: time.durationMs, ...origin, x: Math.min(300, origin.x + 35) },
          ];
      selectedFrames.set(instanceId, time.durationMs);
      updateEffectTimeline(instanceId, { mode: time.mode === "off" ? "once" : time.mode, keyframes: frames });
    });
  });
}
