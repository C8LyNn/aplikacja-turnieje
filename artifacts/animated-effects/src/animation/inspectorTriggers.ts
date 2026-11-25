import type { AlertCaption, AlertSound, EffectInstance, EffectTriggerEvent } from "../core/types";
import { CAPTION_BACKGROUNDS, CAPTION_EFFECTS, CAPTION_FONT_IDS, CAPTION_LETTERS, DEFAULT_ALERT_CAPTION, normalizeAlertCaption } from "./alertText";
import { CAPTION_INTROS, CAPTION_OUTROS } from "./captionMotion";

const INTRO_LABELS: Record<string, string> = {
  slide: "Wjazd", fade: "Pojawienie", pop: "Powiększenie", zoom: "Zbliżenie z daleka",
  bounce: "Odbicie", drop: "Spadnięcie z góry", blur: "Wyostrzenie",
};
const OUTRO_LABELS: Record<string, string> = {
  fade: "Zanikanie", slide: "Wyjazd", pop: "Zmniejszenie", zoom: "Oddalenie", drop: "Opadnięcie", blur: "Rozmycie",
};
const FONT_LABELS: Record<string, string> = {
  default: "Domyślna strony", system: "Systemowa", impact: "Impact", trebuchet: "Trebuchet MS",
  verdana: "Verdana", georgia: "Georgia", mono: "Stała szerokość", comic: "Comic Sans",
};
const EFFECT_LABELS: Record<string, string> = { shadow: "Cień", outline: "Obrys", glow: "Poświata", none: "Brak" };
const BACKGROUND_LABELS: Record<string, string> = { none: "Brak", box: "Prostokąt", pill: "Plakietka" };
const LETTER_LABELS: Record<string, string> = { none: "Brak", wave: "Fala", typewriter: "Maszyna do pisania", pop: "Wyskakiwanie" };

const options = (values: readonly string[], labels: Record<string, string>, selected: string | undefined): string =>
  values.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${labels[value] ?? value}</option>`).join("");
const RECOMMENDED_PRIORITIES: Record<EffectTriggerEvent, number> = {
  "follower-latest": 5,
  "subscriber-latest": 7,
  "tip-latest": 9,
  "cheer-latest": 8,
  "raid-latest": 8,
  message: 2,
};
const DEFAULT_EVENT_TEMPLATES: Record<EffectTriggerEvent, string> = {
  "follower-latest": "Dzięki za follow, {name}!",
  "subscriber-latest": "{name} — dzięki za subskrypcję!",
  "tip-latest": "{name} przekazał {amount}!",
  "cheer-latest": "{name} wysłał {amount} bits!",
  "raid-latest": "{name} robi raid ({amount})!",
  message: "{name}: {message}",
};

import { updateEffectTrigger } from "../editor/state";
import { normalizeEffectTrigger, playAlertSound, safeAlertSoundUrl, STREAM_EVENTS } from "./triggers";

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
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Gdy kilka zdarzeń nastąpi szybko</span></span>
          <select data-ae-trigger-queue-mode aria-label="Tryb odtwarzania zdarzeń">
            <option value="replace" ${config?.queueMode !== "queue" ? "selected" : ""}>Restartuj ten efekt (zgodność wsteczna)</option>
            <option value="queue" ${config?.queueMode === "queue" ? "selected" : ""}>Kolejkuj z pozostałymi alertami</option>
          </select>
        </label>
        <label class="ae-timeline-field">
          <span class="inspector-label"><span>Priorytet w kolejce (0–10)</span></span>
          <input data-ae-trigger-priority type="number" min="0" max="10" step="1"
            value="${config?.priority ?? RECOMMENDED_PRIORITIES[selectedEvent]}">
        </label>
        <p class="ae-timeline-hint">Wyższy priorytet wyprzedza oczekujące alerty, ale nie przerywa odtwarzanego. Przy remisie zachowywana jest kolejność nadejścia.</p>
        <p class="ae-timeline-hint">Kolejka jest wspólna dla warstw z wybraną opcją. Odtwarza jeden alert naraz (maks. 16 oczekujących), bez nakładania efektów zdarzeniowych w trybie kolejki.</p>
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
            <label class="ae-timeline-field">
              <span class="inspector-label"><span>Druga linia (mniejsza)</span></span>
              <input type="text" data-ae-caption-subtitle maxlength="160" value="${esc(caption.subtitle ?? "")}"
                placeholder="{message}" aria-label="Druga linia napisu">
            </label>
            <p class="ae-timeline-hint">Dostępne zmienne: <code>{name}</code>, <code>{amount}</code>, <code>{message}</code>, <code>{event}</code>. Nazwy widzów i wiadomości są wyświetlane jako zwykły tekst. Pusta druga linia nie jest pokazywana.</p>
            <div class="ae-caption-row ae-caption-row-2">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Czcionka</span></span>
                <select data-ae-caption-font>${options(CAPTION_FONT_IDS, FONT_LABELS, caption.font)}</select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Efekt tekstu</span></span>
                <select data-ae-caption-effect>${options(CAPTION_EFFECTS, EFFECT_LABELS, caption.effect)}</select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja liter</span></span>
                <select data-ae-caption-letters>${options(CAPTION_LETTERS, LETTER_LABELS, caption.letters)}</select>
              </label>
            </div>
            <div class="ae-caption-row ae-caption-row-2">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Tło napisu</span></span>
                <select data-ae-caption-background>${options(CAPTION_BACKGROUNDS, BACKGROUND_LABELS, caption.background)}</select>
              </label>
              <label class="ae-timeline-field" ${caption.background === "none" ? "hidden" : ""}>
                <span class="inspector-label"><span>Kolor tła</span></span>
                <input data-ae-caption-bg-color type="color" value="${caption.backgroundColor ?? "#0f172a"}" aria-label="Kolor tła napisu">
              </label>
              <label class="ae-timeline-field" ${caption.background === "none" ? "hidden" : ""}>
                <span class="inspector-label"><span>Krycie tła (%)</span></span>
                <input data-ae-caption-bg-opacity type="number" min="0" max="100" step="5" value="${caption.backgroundOpacity ?? 70}">
              </label>
            </div>
            <div class="ae-caption-row">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Położenie</span></span>
                <select data-ae-caption-position>
                  <option value="top" ${caption.position === "top" ? "selected" : ""}>Góra</option>
                  <option value="center" ${caption.position === "center" ? "selected" : ""}>Środek</option>
                  <option value="bottom" ${caption.position === "bottom" ? "selected" : ""}>Dół</option>
                  <option value="custom" ${caption.position === "custom" ? "selected" : ""}>Własna pozycja (X/Y)</option>
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
            <div class="ae-caption-row" data-ae-custom-position-row ${caption.position === "custom" ? "" : "hidden"}>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>X — środek (%)</span></span>
                <input type="number" data-ae-caption-x min="25" max="75" step="1" value="${caption.xPercent ?? 50}">
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Y — środek (%)</span></span>
                <input type="number" data-ae-caption-y min="10" max="90" step="1" value="${caption.yPercent ?? 75}">
              </label>
            </div>
            <div class="ae-caption-row ae-caption-row-2">
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja wejścia</span></span>
                <select data-ae-caption-intro>${options(CAPTION_INTROS, INTRO_LABELS, caption.intro)}</select>
              </label>
              <label class="ae-timeline-field">
                <span class="inspector-label"><span>Animacja wyjścia</span></span>
                <select data-ae-caption-outro>${options(CAPTION_OUTROS, OUTRO_LABELS, caption.outro)}</select>
              </label>
            </div>
            <p class="ae-timeline-hint">W trybie własnej pozycji można też przeciągnąć podpis na podglądzie przyciskiem „Testuj w podglądzie”.</p>
            <label class="ae-caption-switch">
              <input type="checkbox" data-ae-caption-avatar ${caption.avatarEnabled ? "checked" : ""}>
              <span>Pokaż awatar (lub inicjał widza)</span>
            </label>
            <label class="ae-timeline-field" data-ae-avatar-size-row ${caption.avatarEnabled ? "" : "hidden"}>
              <span class="inspector-label"><span>Rozmiar awatara (px)</span></span>
              <input type="number" data-ae-caption-avatar-size min="32" max="144" step="4" value="${caption.avatarSize ?? 72}">
            </label>
            <p class="ae-timeline-hint">Zdjęcie pojawi się tylko, jeśli StreamElements przekaże adres z zaufanego serwera obrazów. W pozostałych przypadkach użyty zostanie inicjał nazwy widza.</p>
          </div>
        </div>
        <div class="ae-caption-fields ae-sound-fields">
          <label class="ae-timeline-field">
            <span class="inspector-label"><span>Dźwięk alertu (adres https pliku .mp3 / .ogg / .wav)</span></span>
            <input type="url" data-ae-trigger-sound-url maxlength="500" value="${esc(config?.sound?.url ?? "")}"
              placeholder="https://…/alert.mp3" aria-label="Adres dźwięku alertu" spellcheck="false" autocomplete="off">
          </label>
          <div class="ae-caption-row">
            <label class="ae-timeline-field">
              <span class="inspector-label"><span>Głośność (%)</span></span>
              <input data-ae-trigger-sound-volume type="number" min="0" max="100" step="5" value="${config?.sound?.volume ?? 70}">
            </label>
            <button type="button" class="ae-button ae-button-secondary" data-ae-trigger-sound-test ${config?.sound ? "" : "disabled"}>
              <span aria-hidden="true">♪</span> Odsłuchaj
            </button>
          </div>
          <p class="ae-timeline-hint">Opcjonalnie. Najprościej wgrać plik do StreamElements (biblioteka mediów) i wkleić jego adres. Puste pole = alert bez dźwięku.</p>
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
  const write = (patch: { event?: EffectTriggerEvent; cooldownMs?: number; minAmount?: number; caption?: AlertCaption; queueMode?: "replace" | "queue"; priority?: number; sound?: AlertSound | null }): void => {
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
      queueMode: patch.queueMode ?? source?.queueMode ?? "queue",
      priority: patch.priority ?? source?.priority ?? RECOMMENDED_PRIORITIES[event as EffectTriggerEvent],
      sound: patch.sound === null ? undefined : patch.sound ?? source?.sound,
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
  container.querySelector<HTMLSelectElement>("[data-ae-trigger-queue-mode]")?.addEventListener("change", (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (value === "replace" || value === "queue") write({ queueMode: value });
  });

  container.querySelector<HTMLInputElement>("[data-ae-trigger-priority]")?.addEventListener("change", (event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(value)) write({ priority: value });
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
    if (value === "top" || value === "center" || value === "bottom" || value === "custom") changeCaption({ position: value });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-size]")?.addEventListener("change", (event) => {
    changeCaption({ fontSize: Number((event.currentTarget as HTMLInputElement).value) });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-x]")?.addEventListener("change", (event) => {
    const xPercent = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(xPercent)) changeCaption({ xPercent });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-y]")?.addEventListener("change", (event) => {
    const yPercent = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(yPercent)) changeCaption({ yPercent });
  });
  container.querySelector<HTMLSelectElement>("[data-ae-caption-intro]")?.addEventListener("change", (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const intro = CAPTION_INTROS.find((item) => item === value);
    if (intro) changeCaption({ intro });
  });
  container.querySelector<HTMLSelectElement>("[data-ae-caption-outro]")?.addEventListener("change", (event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const outro = CAPTION_OUTROS.find((item) => item === value);
    if (outro) changeCaption({ outro });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-avatar]")?.addEventListener("change", (event) => {
    changeCaption({ avatarEnabled: (event.currentTarget as HTMLInputElement).checked });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-avatar-size]")?.addEventListener("change", (event) => {
    const size = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(size)) changeCaption({ avatarSize: size });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-color]")?.addEventListener("change", (event) => {
    changeCaption({ color: (event.currentTarget as HTMLInputElement).value });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-subtitle]")?.addEventListener("change", (event) => {
    changeCaption({ subtitle: (event.currentTarget as HTMLInputElement).value });
  });
  // Values of these selects are validated again by normalizeAlertCaption.
  const captionSelect = (selector: string, key: "font" | "effect" | "background" | "letters"): void => {
    container.querySelector<HTMLSelectElement>(selector)?.addEventListener("change", (event) => {
      changeCaption({ [key]: (event.currentTarget as HTMLSelectElement).value } as Partial<AlertCaption>);
    });
  };
  captionSelect("[data-ae-caption-font]", "font");
  captionSelect("[data-ae-caption-effect]", "effect");
  captionSelect("[data-ae-caption-background]", "background");
  captionSelect("[data-ae-caption-letters]", "letters");
  container.querySelector<HTMLInputElement>("[data-ae-caption-bg-color]")?.addEventListener("change", (event) => {
    changeCaption({ backgroundColor: (event.currentTarget as HTMLInputElement).value });
  });
  container.querySelector<HTMLInputElement>("[data-ae-caption-bg-opacity]")?.addEventListener("change", (event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(value)) changeCaption({ backgroundOpacity: value });
  });

  const soundUrl = container.querySelector<HTMLInputElement>("[data-ae-trigger-sound-url]");
  const soundVolume = container.querySelector<HTMLInputElement>("[data-ae-trigger-sound-volume]");
  const writeSound = (): void => {
    const url = safeAlertSoundUrl(soundUrl?.value ?? "");
    const volume = Number(soundVolume?.value);
    write({ sound: url ? { url, volume: Number.isFinite(volume) ? volume : 70 } : null });
  };
  soundUrl?.addEventListener("change", writeSound);
  soundVolume?.addEventListener("change", writeSound);
  container.querySelector<HTMLButtonElement>("[data-ae-trigger-sound-test]")?.addEventListener("click", () => {
    playAlertSound(normalizeEffectTrigger(effect.trigger)?.sound);
  });

  container.querySelector<HTMLButtonElement>("[data-ae-trigger-test]")?.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("animated-effects:test-trigger", {
      detail: { instanceId: effect.instanceId },
    }));
  });
}
