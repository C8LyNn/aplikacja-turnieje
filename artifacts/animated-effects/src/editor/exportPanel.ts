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
  if (commandInput && commandInput.value.trim().toLowerCase() !== options.chatCommand) {
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