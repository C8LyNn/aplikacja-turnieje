import JSZip from "jszip";
import { serializeScene } from "../scenes/scenes";
import { generateStreamElementsExport } from "../export/streamElements";

import {
  getEditorState,
} from "./state";

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
      const output = generateStreamElementsExport(state);
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

          const previous = button.textContent;
          try {
            await navigator.clipboard.writeText(textarea.value);
            button.textContent = "Skopiowano";
          } catch {
            // Secure clipboard is not always available in embedded browsers.
            textarea.focus();
            textarea.select();
            button.textContent = "Zaznaczono · Ctrl+C";
          }
          setTimeout(() => {
            button.textContent = previous;
          }, 1800);
        },
      );
    });
}

export function openExportPanel(
  dialog: HTMLDialogElement,
): void {
  const result =
    generateStreamElementsExport(
      getEditorState(),
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
      `koszt ${result.estimatedPerformanceCost}`;
  }

  if (!dialog.open) {
    dialog.showModal();
  }
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