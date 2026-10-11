import type { EffectInstance, EffectTriggerEvent } from "../core/types";
import { updateEffectTrigger } from "../editor/state";
import { normalizeEffectTrigger, STREAM_EVENTS } from "./triggers";

export function triggerInspectorTemplate(effect: EffectInstance): string {
  const config = normalizeEffectTrigger(effect.trigger);
  const selectedEvent = config?.event ?? "follower-latest";
  const amountSupported = selectedEvent === "tip-latest" || selectedEvent === "cheer-latest" || selectedEvent === "raid-latest";
  return `
    <section class="ae-trigger-panel" aria-label="Wyzwalacze StreamElements">
      <div class="ae-trigger-heading">
        <strong>Wyzwalacz StreamElements</strong>
        <span>Uruchamiaj tę warstwę po zdarzeniu ze streamu</span>
      </div>
      <label class="inspector-field">
        <span class="inspector-label"><span>Uruchamianie warstwy</span></span>
        <select data-ae-trigger-event aria-label="Zdarzenie uruchamiające animację">
          <option value="always" ${config ? "" : "selected"}>Od razu (zawsze)</option>
          ${STREAM_EVENTS.map((item) => `
            <option value="${item.value}" ${config?.event === item.value ? "selected" : ""}>${item.label}</option>
          `).join("")}
        </select>
      </label>
      <div class="ae-trigger-advanced" ${config ? "" : "hidden"}>
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Odstęp między uruchomieniami (s)</span></span>
          <input data-ae-trigger-cooldown type="number" min="0" max="60" step="0.5"
            value="${(config?.cooldownMs ?? 3000) / 1000}">
        </label>
        <label class="ae-timeline-field" data-ae-trigger-amount-row ${amountSupported ? "" : "hidden"}>
          <span class="inspector-label"><span>Minimalna kwota / liczba</span></span>
          <input data-ae-trigger-amount type="number" min="0" max="1000000" step="1"
            value="${config?.minAmount ?? 0}">
        </label>
        <p class="ae-timeline-hint">Każde zdarzenie odtwarza jeden cykl animacji (również jeśli oś czasu ustawiono na pętlę). Przy kolejnych zdarzeniach warstwa jest uruchamiana od początku.</p>
        <button type="button" class="ae-button ae-button-secondary" data-ae-trigger-test>
          <span aria-hidden="true">▶</span> Testuj w podglądzie
        </button>
      </div>
      ${config ? "" : '<p class="ae-timeline-hint">Warstwa jest widoczna od razu. Efekt nie czeka na wydarzenie.</p>'}
    </section>
  `;
}

export function bindTriggerControls(container: HTMLElement, effect: EffectInstance): void {
  const eventField = container.querySelector<HTMLSelectElement>("[data-ae-trigger-event]");
  const write = (patch: { event?: EffectTriggerEvent; cooldownMs?: number; minAmount?: number }): void => {
    const source = normalizeEffectTrigger(effect.trigger);
    const event = eventField?.value;
    if (!event || event === "always") {
      updateEffectTrigger(effect.instanceId, undefined);
      return;
    }
    if (!STREAM_EVENTS.some((item) => item.value === event)) return;
    updateEffectTrigger(effect.instanceId, {
      source: "event",
      event: (patch.event ?? event) as EffectTriggerEvent,
      cooldownMs: patch.cooldownMs ?? source?.cooldownMs ?? 3000,
      minAmount: patch.minAmount ?? source?.minAmount ?? 0,
    });
  };
  eventField?.addEventListener("change", () => write({}));
  container.querySelector<HTMLInputElement>("[data-ae-trigger-cooldown]")?.addEventListener("change", (event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(value)) write({ cooldownMs: Math.round(value * 1000) });
  });
  container.querySelector<HTMLInputElement>("[data-ae-trigger-amount]")?.addEventListener("change", (event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(value)) write({ minAmount: Math.round(value) });
  });
  container.querySelector<HTMLButtonElement>("[data-ae-trigger-test]")?.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("animated-effects:test-trigger", {
      detail: { instanceId: effect.instanceId },
    }));
  });
}
