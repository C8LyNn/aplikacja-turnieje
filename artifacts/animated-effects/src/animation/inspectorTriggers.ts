import type { AlertCaption, EffectInstance, EffectTriggerEvent } from "../core/types";
import { DEFAULT_ALERT_CAPTION, normalizeAlertCaption } from "./alertText";
const DEFAULT_EVENT_TEMPLATES: Record<EffectTriggerEvent, string> = {
  "follower-latest": "Dzięki za follow, {name}!",
  "subscriber-latest": "{name} — dzięki za subskrypcję!",
  "tip-latest": "{name} przekazał {amount}!",
  "cheer-latest": "{name} wysłał {amount} bits!",
  "raid-latest": "{name} robi raid ({amount})!",
  message: "{name}: {message}",
};

import { updateEffectTrigger } from "../editor/state";
import { normalizeEffectTrigger, STREAM_EVENTS } from "./triggers";

export function triggerInspectorTemplate(effect: EffectInstance): string {
  const config = normalizeEffectTrigger(effect.trigger);
  const selectedEvent = config?.event ?? "follower-latest";
  const amountSupported = selectedEvent === "tip-latest" || selectedEvent === "cheer-latest" || selectedEvent === "raid-latest";
  const caption = normalizeAlertCaption({ ...config?.caption, template: config?.caption?.template ?? DEFAULT_EVENT_TEMPLATES[selectedEvent] });
  const esc = (value: string): string => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
        <div class="ae-caption-fields">
          <label class="ae-caption-switch">
            <input type="checkbox" data-ae-caption-enabled ${caption.enabled ? "checked" : ""}>
            <span>Pokazuj napis na animacji</span>
          </label>
          <div class="ae-caption-settings" ${caption.enabled ? "" : "hidden"}>
            <label class="ae-timeline-field">
              <span class="inspector-label"><span>Wzór napisu</span></span>
              <input type="text" data-ae-caption-template maxlength="160" value="${esc(caption.template)}"
                placeholder="Dziękujemy {name}!" aria-label="Wzór napisu na animacji">
            </label>
            <p class="ae-timeline-hint">Dostępne zmienne: <code>{name}</code>, <code>{amount}</code>, <code>{message}</code>, <code>{event}</code>. Nazwy widzów i wiadomości są wyświetlane jako zwykły tekst.</p>
            <div class="ae-caption-row">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Położenie</span></span>
                <select data-ae-caption-position>
                  <option value="top" ${caption.position === "top" ? "selected" : ""}>Góra</option>
                  <option value="center" ${caption.position === "center" ? "selected" : ""}>Środek</option>
                  <option value="bottom" ${caption.position === "bottom" ? "selected" : ""}>Dół</option>
                </select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Rozmiar (px)</span></span>
                <input data-ae-caption-size type="number" min="14" max="120" step="1" value="${caption.fontSize}">
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Kolor</span></span>
                <input data-ae-caption-color type="color" value="${caption.color}" aria-label="Kolor podpisu">
              </label>
            </div>
          </div>
        </div>
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
  const write = (patch: { event?: EffectTriggerEvent; cooldownMs?: number; minAmount?: number; caption?: AlertCaption }): void => {
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
      caption: patch.caption ?? source?.caption,
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
  const changeCaption = (patch: Partial<AlertCaption>): void => {
    const existing = normalizeEffectTrigger(effect.trigger);
    const event = eventField?.value as EffectTriggerEvent | undefined;
    const initial = existing?.caption ?? { ...DEFAULT_ALERT_CAPTION, template: (event && DEFAULT_EVENT_TEMPLATES[event]) || DEFAULT_ALERT_CAPTION.template };
    const caption = normalizeAlertCaption({ ...initial, ...patch });
    write({ caption });
  };
  container.querySelector<HTMLInputElement>("[data-ae-caption-enabled]")?.addEventListener("change", (event) => {
    changeCaption({ enabled: (event.currentTarget as HTMLInputElement).checked });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-template]")?.addEventListener("change", (event) => {
    changeCaption({ template: (event.currentTarget as HTMLInputElement).value });
  });
  container.querySelector<HTMLSelectElement>("[data-ae-caption-position]")?.addEventListener("change", (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (value === "top" || value === "center" || value === "bottom") changeCaption({ position: value });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-size]")?.addEventListener("change", (event) => {
    changeCaption({ fontSize: Number((event.currentTarget as HTMLInputElement).value) });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-color]")?.addEventListener("change", (event) => {
    changeCaption({ color: (event.currentTarget as HTMLInputElement).value });
  });

  container.querySelector<HTMLButtonElement>("[data-ae-trigger-test]")?.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("animated-effects:test-trigger", {
      detail: { instanceId: effect.instanceId },
    }));
  });
}
