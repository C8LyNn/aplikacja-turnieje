import type { EffectInstance, LayerKeyframe } from "../core/types";
import { addEffectKeyframe, editEffectKeyframe, getEditorState, removeEffectKeyframe, updateEffectTimeline } from "../editor/state";
import { MAX_KEYFRAMES, normalizedMotionTimeline } from "./motion";
import { timeFromPosition } from "./transportMath";

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
      <div class="ae-keyframe-ruler" data-kf-ruler aria-label="Przeciągnij klatkę na osi czasu">
        ${frames.map((frame, index) => `<button type="button" class="ae-keyframe-dot${active?.timeMs === frame.timeMs ? " is-selected" : ""}"
          data-kf-marker="${frame.timeMs}" style="left:${(frame.timeMs / timeline.durationMs * 100).toFixed(3)}%"
          title="Klatka ${index + 1}: ${seconds(frame.timeMs)} s"
          aria-label="Klatka ${index + 1}, ${seconds(frame.timeMs)} sekundy. Przeciągnij albo użyj strzałek."></button>`).join("")}
      </div>
      <output class="ae-keyframe-drag-time" data-kf-drag-time aria-live="off">Przesuń punkt, aby zmienić moment klatki · krok 0,1 s</output>
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

  // Pointer gestures update only the marker until release. This ensures that
  // the inspector isn't destroyed by state subscriptions mid-drag, and every
  // completed drag produces a single undo entry.
  const ruler = container.querySelector<HTMLElement>("[data-kf-ruler]");
  const dragOutput = container.querySelector<HTMLOutputElement>("[data-kf-drag-time]");
  ruler?.querySelectorAll<HTMLButtonElement>("[data-kf-marker]").forEach((marker) => {
    const originalTimeMs = Number(marker.dataset.kfMarker);
    const effect = getEffect();
    if (!effect || !Number.isFinite(originalTimeMs)) return;
    const durationMs = normalizedMotionTimeline(effect.timeline, effect.settings).durationMs;
    const selectMarker = (): void => {
      selectedFrames.set(instanceId, originalTimeMs);
      if (select) {
        select.value = String(originalTimeMs);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      ruler.querySelectorAll(".ae-keyframe-dot").forEach((dot) =>
        dot.classList.toggle("is-selected", dot === marker));
    };
    let dragging = false;
    let pointerId: number | null = null;
    let targetTimeMs = originalTimeMs;
    const fromPointer = (clientX: number): number => {
      const bounds = ruler.getBoundingClientRect();
      return timeFromPosition(clientX, bounds.left, bounds.width, durationMs);
    };
    const showTime = (ms: number): void => {
      marker.style.left = `${(ms / durationMs * 100).toFixed(3)}%`;
      if (dragOutput) dragOutput.value = `Moment klatki: ${seconds(ms)} s`;
    };
    const finish = (commit: boolean): void => {
      if (!dragging) return;
      dragging = false;
      if (pointerId !== null && marker.hasPointerCapture(pointerId)) marker.releasePointerCapture(pointerId);
      pointerId = null;
      const current = getEffect();
      const collision = current && normalizedMotionTimeline(current.timeline, current.settings).keyframes
        ?.some((frame) => frame.timeMs === targetTimeMs && frame.timeMs !== originalTimeMs);
      if (commit && targetTimeMs !== originalTimeMs && !collision) {
        selectedFrames.set(instanceId, targetTimeMs);
        editEffectKeyframe(instanceId, originalTimeMs, { timeMs: targetTimeMs });
      } else {
        showTime(originalTimeMs);
        if (collision && dragOutput) dragOutput.value = "W tym miejscu jest już inna klatka.";
      }
    };
    marker.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      selectMarker();
      dragging = true;
      targetTimeMs = originalTimeMs;
      pointerId = event.pointerId;
      marker.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    marker.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      targetTimeMs = fromPointer(event.clientX);
      showTime(targetTimeMs);
    });
    marker.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointerId) return;
      targetTimeMs = fromPointer(event.clientX);
      finish(true);
    });
    marker.addEventListener("pointercancel", () => finish(false));
    marker.addEventListener("keydown", (event) => {
      const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      const next = Math.max(0, Math.min(durationMs, originalTimeMs + direction * (event.shiftKey ? 1000 : 100)));
      if (next === originalTimeMs) return;
      const current = getEffect();
      if (current && normalizedMotionTimeline(current.timeline, current.settings).keyframes
        ?.some((frame) => frame.timeMs === next && frame.timeMs !== originalTimeMs)) return;
      selectedFrames.set(instanceId, next);
      editEffectKeyframe(instanceId, originalTimeMs, { timeMs: next });
    });
    marker.addEventListener("click", (event) => {
      // Pointerdown already selected it; avoid stale click after the DOM is
      // replaced by a committed drag. detail=0 indicates keyboard activation.
      if (event.detail === 0) selectMarker();
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
