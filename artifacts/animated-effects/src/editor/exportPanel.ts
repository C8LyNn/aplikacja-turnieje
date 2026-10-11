import JSZip from "jszip";
import { serializeScene } from "../scenes/scenes";
import {
  generateStreamElementsExport,
} from "../export/streamElements";

import {
  getEditorState,
  replaceEditorState,
} from "./state";
import { applyExportRoutes, readExportRoutes, setupExportRoutes, syncExportRoutes } from "./exportRoutes";
import { setupExportProfilesUI } from "./exportProfilesUI";
import { setupStreamElementsSimulator } from "./streamElementsSimulator";
import { createStreamElementsProfile } from "../export/streamElementsProfiles";

import {
  DEFAULT_STREAM_ELEMENTS_TRIGGER_OPTIONS,
  normalizeStreamElementsTriggerOptions,
  type StreamElementsTriggerOptions,
} from "../export/triggerOptions";


const simulators = new WeakMap<HTMLDialogElement, ReturnType<typeof setupStreamElementsSimulator>>();

export function setupExportPanel(
  dialog: HTMLDialogElement,
): void {
  const closeButton =
    dialog.querySelector<HTMLButtonElement>(
      "[data-export-close]",
    );

  closeButton?.addEventListener(
    "click",
    () => dialog.close(),
  );

  const downloadButton = dialog.querySelector<HTMLButtonElement>("[data-export-download]");
  downloadButton?.addEventListener("click", async () => {
    if (downloadButton.disabled) return;
    downloadButton.disabled = true;
    const label = downloadButton.textContent;
    downloadButton.textContent = "Tworzenie ZIP…";
    try {
      const state = structuredClone(getEditorState());
      const output = generateStreamElementsExport(state, readTriggerOptions(dialog), readExportRoutes(dialog));
      const zip = new JSZip();
      zip.file("widget.html", output.html);
      zip.file("widget.css", output.css);
      zip.file("widget.js", output.javascript);
      zip.file("scene.aescene.json", serializeScene(state, "StreamElements Export"));
      zip.file("README.txt", [
        "Animated Effects — eksport do StreamElements",
        "",
        "1. Otwórz StreamElements > My Overlays i edytuj własny overlay.",
        "2. Dodaj Custom Widget i przejdź do zakładek HTML, CSS i JS.",
        "3. Wklej odpowiednio pliki widget.html, widget.css i widget.js.",
        "4. Zapisz widget i sprawdź jego działanie w podglądzie.",
        "",
        "Plik scene.aescene.json jest kopią projektu do ponownej edycji",
        "w Animated Effects (Wczytaj), a nie plikiem do StreamElements.",
        "Rozdzielczość ustaw w overlayu / źródle OBS, nie w tym ZIP.",
        "Dostępne są dwa warianty: globalny routing wielu reguł oraz",
        "wyzwalacze przypisane do warstw z kolejką, priorytetami i podpisami.",
        "Zestawy reguł globalnych mają pierwszeństwo, gdy są włączone.",
        "Po onWidgetLoad startują warstwy ciągłe (Od razu / zawsze).",
        "Warstwy z wyzwalaczem startują dopiero po pasującym onEventReceived.",
        "Obsługa zdarzeń: follow, sub, tip, cheer, raid, wiadomość.",
        "Wyzwalacze zależą od zdarzeń dostępnych na Twojej platformie.",
        "Przycisk 'Testuj w podglądzie' działa tylko w edytorze Animated Effects.",
        "Nie wymaga to tokenu SE_API ani zatrzymywania kolejki alertów.",
        "",
        "Dynamiczne podpisy alertów można włączyć w Inspektorze warstwy.",
        "Wzory: {name} - widz, {amount} - kwota/liczba,",
        "{message} - treść wiadomości, {event} - typ zdarzenia.",
        "Tekst jest kodowany bez HTML, aby wiadomości nie uruchamiały kodu.",
        "Kolejka alertów: ważniejsze oczekujące zdarzenia mogą zostać",
        "wyświetlone wcześniej, ale nie przerywają aktualnej animacji.",
        "Tryb, priorytet i wygląd podpisu ustawia się w Inspektorze warstwy.",
        "Pozycja Własna (X/Y) pozwala też przeciągnąć podpis w podglądzie.",
        "Podpis ma niezależne efekty wejścia i wyjścia: wjazd, fade, pop.",
        "Wszystkie konfiguracje pozostają w scene.aescene.json.",
        "Diagnostyka: w edytorze rozwiń panel pod podglądem sceny.",
        "Symulator kolejki nie łączy się z kontem ani z StreamElements.",
        "W wygenerowanym widgetcie można nasłuchiwać zdarzenia",
        "animated-effects:diagnostics w DevTools (CustomEvent.detail).",
        "Raport zawiera stan kolejki, typy zdarzeń i powody odrzuceń,",
        "ale nie zawiera nazw widzów, kwot, czatu ani adresów awatarów.",
        "W edytorze można wyeksportować i wczytać anonimowy ślad",
        "syntetycznych zdarzeń (JSON) i odtworzyć go po zmianie sceny.",
        "Porównanie A/B działa wyłącznie dla tego samego śladu",
        "i pełnych przebiegów testowych; nie mierzy wydajności GPU/OBS.",
        "Jeśli masz włączony alertbox StreamElements, osobno ustal",
        "jego położenie, żeby nie nakładał się na te animacje.",
        "",
        "Wskazówka: plików ZIP nie przesyła się bezpośrednio do Custom Widget.",
      ].join("\n"));
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "animated-effects-streamelements.zip";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      downloadButton.textContent = "Pobrano ZIP";
    } catch (error) {
      console.error("Animated Effects: export ZIP failed", error);
      downloadButton.textContent = "Błąd eksportu";
      window.alert("Nie udało się przygotować paczki. Spróbuj ponownie.");
    } finally {
      downloadButton.disabled = false;
      setTimeout(() => { downloadButton.textContent = label; }, 1500);
    }
  });


  
  dialog.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
    "[data-trigger-mode], [data-trigger-command], [data-trigger-duration], [data-trigger-cooldown]",
  ).forEach((control) => {
    control.addEventListener("change", () => {
      syncTriggerUi(dialog);
      if (dialog.open) openExportPanel(dialog);
    });
  });
  syncTriggerUi(dialog);
  setupExportRoutes(dialog, () => openExportPanel(dialog));
  setupExportProfilesUI(dialog, {
    capture: (name) => createStreamElementsProfile(
      name,
      getEditorState(),
      readTriggerOptions(dialog),
      readExportRoutes(dialog),
    ),
    apply: (profile) => {
      replaceEditorState(profile.scene, "Wczytaj zestaw StreamElements: " + profile.name);
      applyTriggerOptions(dialog, profile.trigger);
      applyExportRoutes(dialog, profile.routes);
      openExportPanel(dialog);
    },
  });

  simulators.set(dialog, setupStreamElementsSimulator(dialog, () => {
    const trigger = readTriggerOptions(dialog);
    const routes = readExportRoutes(dialog);
    return {
      trigger,
      routes,
      exported: generateStreamElementsExport(getEditorState(), trigger, routes),
    };
  }));

  dialog
    .querySelectorAll<HTMLButtonElement>(
      "[data-copy]",
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        async () => {
          const target =
            button.dataset.copy;

          if (!target) {
            return;
          }

          const textarea =
            dialog.querySelector<HTMLTextAreaElement>(
              `[data-export="${target}"]`,
            );

          if (!textarea) {
            return;
          }

          await navigator.clipboard.writeText(
            textarea.value,
          );

          const previous =
            button.textContent;

          button.textContent = "Skopiowano";

          setTimeout(() => {
            button.textContent = previous;
          }, 1000);
        },
      );
    });
}

export function openExportPanel(
  dialog: HTMLDialogElement,
): void {
  const trigger = readTriggerOptions(dialog);
  syncTriggerUi(dialog, trigger);
  syncExportRoutes(dialog);
  const routes = readExportRoutes(dialog);
  const result =
    generateStreamElementsExport(
      getEditorState(),
      trigger,
      routes,
    );

  setValue(
    dialog,
    "html",
    result.html,
  );

  setValue(
    dialog,
    "css",
    result.css,
  );

  setValue(
    dialog,
    "javascript",
    result.javascript,
  );

  const metrics =
    dialog.querySelector<HTMLElement>(
      "[data-export-metrics]",
    );

  if (metrics) {
    metrics.textContent =
      `${result.estimatedDomNodes} DOM · ` +
      `koszt ${result.estimatedPerformanceCost}` +
      (routes === undefined ? "" : ` · ${routes.length} reguł`);
  }

  if (!dialog.open) {
    dialog.showModal();
  }
  simulators.get(dialog)?.refresh();
}

function readTriggerOptions(dialog: HTMLDialogElement): StreamElementsTriggerOptions {
  const mode = dialog.querySelector<HTMLSelectElement>("[data-trigger-mode]")?.value;
  const command = dialog.querySelector<HTMLInputElement>("[data-trigger-command]")?.value;
  const duration = dialog.querySelector<HTMLInputElement>("[data-trigger-duration]")?.value;
  const cooldown = dialog.querySelector<HTMLInputElement>("[data-trigger-cooldown]")?.value;

  if (!mode) return DEFAULT_STREAM_ELEMENTS_TRIGGER_OPTIONS;
  return normalizeStreamElementsTriggerOptions({
    mode: mode as StreamElementsTriggerOptions["mode"] | undefined,
    chatCommand: command,
    activeDurationMs: duration === undefined ? undefined : Number(duration) * 1000,
    cooldownMs: cooldown === undefined ? undefined : Number(cooldown) * 1000,
  });
}

function applyTriggerOptions(dialog: HTMLDialogElement, options: StreamElementsTriggerOptions): void {
  const mode = dialog.querySelector<HTMLSelectElement>("[data-trigger-mode]");
  const command = dialog.querySelector<HTMLInputElement>("[data-trigger-command]");
  const duration = dialog.querySelector<HTMLInputElement>("[data-trigger-duration]");
  const cooldown = dialog.querySelector<HTMLInputElement>("[data-trigger-cooldown]");
  if (mode) mode.value = options.mode;
  if (command) command.value = options.chatCommand;
  if (duration) duration.value = String(options.activeDurationMs / 1000);
  if (cooldown) cooldown.value = String(options.cooldownMs / 1000);
  syncTriggerUi(dialog, options);
}

function syncTriggerUi(
  dialog: HTMLDialogElement,
  options: StreamElementsTriggerOptions = readTriggerOptions(dialog),
): void {
  const always = options.mode === "always";
  const command = options.mode === "chat-command";
  const commandField = dialog.querySelector<HTMLElement>("[data-trigger-command-field]");
  if (commandField) commandField.hidden = !command;
  dialog.querySelectorAll<HTMLElement>("[data-trigger-timing]")
    .forEach((field) => { field.hidden = always; });

  const text = dialog.querySelector<HTMLElement>("[data-trigger-info]");
  if (text) {
    text.textContent = always
      ? "Efekty startują po załadowaniu widgetu i pozostają aktywne."
      : command
        ? `Widz wpisuje ${options.chatCommand}; widget uruchamia scenę na ${options.activeDurationMs / 1000} s. Cooldown: ${options.cooldownMs / 1000} s.`
        : `Po zdarzeniu StreamElements scena działa ${options.activeDurationMs / 1000} s. Cooldown: ${options.cooldownMs / 1000} s.`;
  }

  // Display the same validated values that will be embedded in the exported script.
  const commandInput = dialog.querySelector<HTMLInputElement>("[data-trigger-command]");
  const durationInput = dialog.querySelector<HTMLInputElement>("[data-trigger-duration]");
  const cooldownInput = dialog.querySelector<HTMLInputElement>("[data-trigger-cooldown]");
  if (commandInput && commandInput.value !== options.chatCommand) {
    commandInput.value = options.chatCommand;
  }
  if (durationInput) durationInput.value = String(options.activeDurationMs / 1000);
  if (cooldownInput) cooldownInput.value = String(options.cooldownMs / 1000);
}

function setValue(
  dialog: HTMLDialogElement,
  name: string,
  value: string,
): void {
  const textarea =
    dialog.querySelector<HTMLTextAreaElement>(
      `[data-export="${name}"]`,
    );

  if (textarea) {
    textarea.value = value;
  }
}