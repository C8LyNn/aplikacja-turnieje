import {
  generateStreamElementsExport,
} from "../export/streamElements";

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