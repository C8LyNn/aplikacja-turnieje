import {
  getSelectedEffect,
  updateEffectSettings,
} from "../editor/state";

import {
  getEffectDefinition,
} from "../effects/registry";

let installed = false;
let observer: MutationObserver | null = null;
let rendering = false;
let renderQueued = false;

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function queueRender(): void {
  if (renderQueued) {
    return;
  }

  renderQueued = true;

  queueMicrotask(
    () => {
      renderQueued = false;
      renderPanel();
    },
  );
}

function renderPanel(): void {
  if (rendering) {
    return;
  }

  const inspector =
    document.querySelector<HTMLElement>(
      "#inspector",
    );

  if (!inspector) {
    return;
  }

  rendering = true;
  observer?.disconnect();

  try {
    inspector
      .querySelector(
        "[data-pack09-character]",
      )
      ?.remove();

    const selected =
      getSelectedEffect();

    if (!selected) {
      return;
    }

    const definition =
      getEffectDefinition(
        selected.effectId,
      );

    const controls =
      definition?.customControls ??
      [];

    if (
      controls.length ===
      0
    ) {
      return;
    }

    const panel =
      document.createElement(
        "section",
      );

    panel.className =
      "ae-pack09-character-panel";

    panel.dataset
      .pack09Character =
      "1";

    panel.innerHTML = `
      <div class="ae-pack09-character-heading">
        <div>
          <strong>Charakter efektu</strong>
          <span>
            Parametry specyficzne dla
            ${escapeHtml(
              definition?.name ??
              selected.effectId,
            )}
          </span>
        </div>

        <span class="ae-pack09-custom-badge">
          ${controls.length}×
        </span>
      </div>

      <div class="ae-pack09-character-presets">
        <button type="button" data-pack09-preset="soft">
          Subtelnie
        </button>
        <button type="button" data-pack09-preset="natural">
          Naturalnie
        </button>
        <button type="button" data-pack09-preset="strong">
          Mocno
        </button>
        <button type="button" data-pack09-preset="random">
          Losuj charakter
        </button>
      </div>

      <div class="ae-pack09-character-fields">
        ${controls
          .map(
            (control) => {
              const raw =
                selected.settings.custom?.[
                  control.key
                ];

              const value =
                Number.isFinite(
                  raw,
                )
                  ? Number(
                      raw,
                    )
                  : control.defaultValue;

              return `
                <label class="ae-pack09-character-field">
                  <span class="ae-pack09-character-label">
                    <span>
                      <strong>${escapeHtml(control.label)}</strong>
                      <small>${escapeHtml(control.description ?? "")}</small>
                    </span>

                    <output data-pack09-output="${escapeHtml(control.key)}">
                      ${value}${control.suffix ?? ""}
                    </output>
                  </span>

                  <input
                    type="range"
                    min="${control.min}"
                    max="${control.max}"
                    step="${control.step ?? 1}"
                    value="${value}"
                    data-pack09-custom="${escapeHtml(control.key)}"
                    data-pack09-suffix="${escapeHtml(control.suffix ?? "")}"
                  >
                </label>
              `;
            },
          )
          .join("")}
      </div>

      <p class="ae-pack09-character-help">
        Te suwaki zmieniają konstrukcję efektu,
        a nie tylko kolor lub liczbę elementów.
        Wartości są zapisywane w scenie i eksporcie.
      </p>
    `;

    const colorPanel =
      inspector.querySelector(
        ".inspector-color-panel",
      );

    const firstGroup =
      inspector.querySelector(
        ".inspector-group",
      );

    if (
      colorPanel?.nextSibling
    ) {
      inspector.insertBefore(
        panel,
        colorPanel.nextSibling,
      );
    } else if (
      firstGroup
    ) {
      inspector.insertBefore(
        panel,
        firstGroup,
      );
    } else {
      inspector.appendChild(
        panel,
      );
    }

    panel
      .querySelectorAll<HTMLInputElement>(
        "[data-pack09-custom]",
      )
      .forEach(
        (input) => {
          input.addEventListener(
            "input",
            () => {
              const key =
                input.dataset
                  .pack09Custom;

              if (!key) {
                return;
              }

              const current =
                getSelectedEffect();

              if (!current) {
                return;
              }

              const output =
                panel.querySelector<HTMLOutputElement>(
                  `[data-pack09-output="${CSS.escape(
                    key,
                  )}"]`,
                );

              if (output) {
                output.value =
                  `${input.value}${
                    input.dataset.pack09Suffix ??
                    ""
                  }`;
              }

              updateEffectSettings(
                current.instanceId,
                {
                  custom: {
                    ...(current.settings.custom ?? {}),
                    [key]:
                      Number(
                        input.value,
                      ),
                  },
                },
              );
            },
          );
        },
      );

    panel
      .querySelectorAll<HTMLButtonElement>(
        "[data-pack09-preset]",
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              const mode =
                button.dataset
                  .pack09Preset;

              const current =
                getSelectedEffect();

              if (
                !current ||
                !definition
              ) {
                return;
              }

              const custom = {
                ...(current.settings.custom ?? {}),
              };

              for (
                const control of
                  controls
              ) {
                let value =
                  control.defaultValue;

                if (
                  mode ===
                  "soft"
                ) {
                  value *= .72;
                } else if (
                  mode ===
                  "strong"
                ) {
                  value *= 1.45;
                } else if (
                  mode ===
                  "random"
                ) {
                  value +=
                    (
                      Math.random() *
                        2 -
                      1
                    ) *
                    (
                      control.max -
                      control.min
                    ) *
                    .28;
                }

                const step =
                  control.step ??
                  1;

                custom[
                  control.key
                ] =
                  Math.max(
                    control.min,
                    Math.min(
                      control.max,
                      Math.round(
                        value /
                        step,
                      ) *
                        step,
                    ),
                  );
              }

              updateEffectSettings(
                current.instanceId,
                {
                  custom,
                },
              );
            },
          );
        },
      );
  } finally {
    observer?.observe(
      inspector,
      {
        childList: true,
        subtree: false,
      },
    );

    rendering = false;
  }
}

export function installPack09Customization():
  void {
  if (installed) {
    return;
  }

  installed = true;

  const inspector =
    document.querySelector(
      "#inspector",
    );

  if (!inspector) {
    return;
  }

  observer =
    new MutationObserver(
      (mutations) => {
        if (rendering) {
          return;
        }

        const meaningful =
          mutations.some(
            (mutation) => {
              const changed = [
                ...mutation.addedNodes,
                ...mutation.removedNodes,
              ];

              return changed.some(
                (node) =>
                  !(
                    node instanceof
                      HTMLElement &&
                    node.matches(
                      "[data-pack09-character]",
                    )
                  ),
              );
            },
          );

        if (meaningful) {
          queueRender();
        }
      },
    );

  observer.observe(
    inspector,
    {
      childList: true,
      subtree: false,
    },
  );

  renderPanel();
}
