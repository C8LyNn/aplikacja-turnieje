import type { EffectInstance } from "../core/types";
import { normalizeLayerTimeline } from "./timeline";
import { updateEffectTimeline } from "../editor/state";

export function layerTimelineTemplate(effect: EffectInstance): string {
  const timing = normalizeLayerTimeline(effect.timeline);
  const seconds = (ms: number): string => String(Number((ms / 1000).toFixed(3)));
  const total = timing.delayMs + timing.durationMs;
  const segments = [
    { cls: "wait", amount: timing.delayMs, title: "Oczekiwanie" },
    { cls: "fade-in", amount: timing.fadeInMs, title: "Wejście" },
    { cls: "hold", amount: timing.durationMs - timing.fadeInMs - timing.fadeOutMs, title: "Widoczność" },
    { cls: "fade-out", amount: timing.fadeOutMs, title: "Wyjście" },
  ];
  return `
    <section class="inspector-group ae-timeline-panel">
      <div class="ae-timeline-heading">
        <strong>Oś czasu warstwy</strong>
        <span>Planowanie wejścia, wyjścia i powtórzeń</span>
      </div>
      <label class="inspector-field">
        <span class="inspector-label"><span>Odtwarzanie</span></span>
        <select data-timeline-mode aria-label="Odtwarzanie warstwy">
          <option value="off" ${timing.mode === "off" ? "selected" : ""}>Ciągły (bez harmonogramu)</option>
          <option value="once" ${timing.mode === "once" ? "selected" : ""}>Jeden cykl</option>
          <option value="loop" ${timing.mode === "loop" ? "selected" : ""}>Pętla</option>
        </select>
      </label>
      <div class="ae-timeline-controls" ${timing.mode === "off" ? "hidden" : ""}>
        ${([
          ["delayMs", "Start po", 0, 60],
          ["durationMs", "Czas aktywności", 0.25, 120],
          ["fadeInMs", "Pojawianie", 0, 120],
          ["fadeOutMs", "Zanikanie", 0, 120],
        ] as const).map(([key, label, min, max]) => `
          <label class="inspector-field ae-timeline-field">
            <span class="inspector-label"><span>${label} (s)</span></span>
            <input type="number" inputmode="decimal" min="${min}" max="${max}" step="0.1"
              data-timeline-field="${key}" value="${seconds(timing[key])}" aria-label="${label} w sekundach">
          </label>
        `).join("")}
        <div class="ae-timeline-ruler" role="img"
          aria-label="Cykl ${seconds(total)} sekund; początek ${seconds(timing.delayMs)} sekund; aktywność ${seconds(timing.durationMs)} sekund">
          ${segments.filter((segment) => segment.amount > 0).map((segment) =>
            `<span class="ae-timeline-segment is-${segment.cls}" title="${segment.title}" style="flex:${segment.amount}"></span>`
          ).join("")}
        </div>
        <div class="ae-timeline-actions">
          <small>Cykl: ${seconds(total)} s ${timing.mode === "loop" ? "· powtarzany" : "· jeden raz"}</small>
          <button type="button" class="ae-button ae-button-secondary" data-timeline-replay>
            <span aria-hidden="true">↺</span> Odtwórz od początku
          </button>
        </div>
      </div>
      ${timing.mode === "off" ? '<p class="ae-timeline-hint">Efekt działa bez przerwy, jak w starszych scenach.</p>' : ""}
    </section>
  `;
}

export function bindLayerTimelineControls(container: HTMLElement, instanceId: string): void {
  const mode = container.querySelector<HTMLSelectElement>("[data-timeline-mode]");
  mode?.addEventListener("change", () => {
    const value = mode.value;
    if (value === "off" || value === "once" || value === "loop") {
      updateEffectTimeline(instanceId, { mode: value });
    }
  });
  container.querySelectorAll<HTMLInputElement>("[data-timeline-field]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.timelineField;
      if (key !== "delayMs" && key !== "durationMs" && key !== "fadeInMs" && key !== "fadeOutMs") return;
      const seconds = Number(input.value);
      if (!Number.isFinite(seconds)) return;
      updateEffectTimeline(instanceId, { [key]: Math.round(seconds * 1000) });
    });
  });
  container.querySelector<HTMLButtonElement>("[data-timeline-replay]")?.addEventListener("click", () => {
    document.dispatchEvent(new Event("animated-effects:replay-preview"));
  });
}
