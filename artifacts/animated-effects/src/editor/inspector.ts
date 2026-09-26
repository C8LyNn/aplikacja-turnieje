import type {
  EffectSettings,
} from "../core/types";

import {
  getSelectedEffect,
  updateEffectSettings,
} from "./state";

import {
  getEffectDefinition,
} from "../effects/registry";

import {
  findMatchingEffectVariant,
  getEffectVariants,
} from "../effects/variants";

type NumericSettingKey =
  | "opacity"
  | "density"
  | "speed"
  | "scale"
  | "x"
  | "y"
  | "rotation"
  | "blur"
  | "brightness"
  | "hue"
  | "intensity";

interface RangeField {
  key: NumericSettingKey;
  label: string;
  min: number;
  max: number;
  step?: number;
  suffix: string;
}

interface InspectorGroup {
  id: string;
  title: string;
  description: string;
  fields: RangeField[];
}

const collapsedGroups =
  new Set<string>();

const opacityField: RangeField = {
  key: "opacity",
  label: "Krycie",
  min: 0,
  max: 100,
  suffix: "%",
};

const densityField: RangeField = {
  key: "density",
  label: "G\u0119sto\u015B\u0107",
  min: 10,
  max: 100,
  suffix: "%",
};

const speedField: RangeField = {
  key: "speed",
  label: "Pr\u0119dko\u015B\u0107",
  min: 20,
  max: 300,
  suffix: "%",
};

const accelerationField: RangeField = {
  key: "intensity",
  label: "Przyspieszenie",
  min: 0,
  max: 100,
  suffix: "%",
};

const scaleField: RangeField = {
  key: "scale",
  label: "Skala",
  min: 25,
  max: 250,
  suffix: "%",
};

const xField: RangeField = {
  key: "x",
  label: "Pozycja X",
  min: -100,
  max: 100,
  suffix: "%",
};

const yField: RangeField = {
  key: "y",
  label: "Pozycja Y",
  min: -100,
  max: 100,
  suffix: "%",
};

const rotationField: RangeField = {
  key: "rotation",
  label: "Obr\u00F3t",
  min: -180,
  max: 180,
  suffix: "\u00B0",
};

const blurField: RangeField = {
  key: "blur",
  label: "Rozmycie",
  min: 0,
  max: 30,
  suffix: "px",
};

const brightnessField: RangeField = {
  key: "brightness",
  label: "Jasno\u015B\u0107",
  min: 25,
  max: 250,
  suffix: "%",
};

const hueField: RangeField = {
  key: "hue",
  label: "Odcie\u0144",
  min: -180,
  max: 180,
  suffix: "\u00B0",
};

const colorPresets = [
  "#57c7ff",
  "#6d91ff",
  "#a88cff",
  "#d67cff",
  "#f07a7a",
  "#f39a62",
  "#f0b85a",
  "#72d98b",
  "#55d6c2",
  "#ffffff",
] as const;

function safeColor(
  value: string | undefined,
): string {
  if (
    value &&
    /^#[0-9a-f]{6}$/i.test(
      value,
    )
  ) {
    return value;
  }

  return "#a88cff";
}

function rangeTemplate(
  field: RangeField,
  settings: EffectSettings,
  defaults: EffectSettings,
): string {
  const value =
    settings[field.key];

  const defaultValue =
    defaults[field.key];

  const isDefault =
    value === defaultValue;

  return `
    <label class="inspector-field">
      <span class="inspector-label">
        <span>${field.label}</span>

        <span class="inspector-field-tools">
          <output
            data-output="${field.key}"
            aria-live="off"
          >
            ${value}${field.suffix}
          </output>

          <button
            class="inspector-field-reset"
            type="button"
            data-reset-setting="${field.key}"
            title="Resetuj ${field.label}"
            aria-label="Resetuj ${field.label}"
            ${isDefault ? "disabled" : ""}
          >
            Reset
          </button>
        </span>
      </span>

      <input
        type="range"
        min="${field.min}"
        max="${field.max}"
        step="${field.step ?? 1}"
        value="${value}"
        data-setting="${field.key}"
        data-suffix="${field.suffix}"
        aria-label="${field.label}"
      >
    </label>
  `;
}

function groupTemplate(
  group: InspectorGroup,
  settings: EffectSettings,
  defaults: EffectSettings,
): string {
  const collapsed =
    collapsedGroups.has(
      group.id,
    );

  return `
    <section
      class="inspector-group ${
        collapsed
          ? "is-collapsed"
          : ""
      }"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="${group.id}"
        aria-expanded="${String(!collapsed)}"
      >
        <span class="inspector-group-heading">
          <strong>${group.title}</strong>
          <span>${group.description}</span>
        </span>

        <span
          class="inspector-group-chevron"
          aria-hidden="true"
        ></span>
      </button>

      <div
        class="inspector-group-fields"
        ${collapsed ? "hidden" : ""}
      >
        ${group.fields
          .map(
            (field) =>
              rangeTemplate(
                field,
                settings,
                defaults,
              ),
          )
          .join("")}
      </div>
    </section>
  `;
}

export function renderInspector(
  container: HTMLElement,
): void {
  const selected =
    getSelectedEffect();

  if (!selected) {
    container.innerHTML = `
      <div class="inspector-empty">
        <strong>Brak zaznaczonej warstwy</strong>
        <span>
          Wybierz warstw\u0119 po lewej stronie albo dodaj nowy efekt.
        </span>
      </div>
    `;

    return;
  }

  const definition =
    getEffectDefinition(
      selected.effectId,
    );

  if (!definition) {
    container.innerHTML = `
      <div class="inspector-empty">
        Nie znaleziono definicji efektu.
      </div>
    `;

    return;
  }

  const variants =
    getEffectVariants(
      selected.effectId,
    );

  const matchingVariant =
    findMatchingEffectVariant(
      selected.effectId,
      selected.settings,
    );

  const primaryFields = [
    opacityField,
    densityField,
    speedField,
  ];

  if (
    selected.effectId === "pong"
  ) {
    primaryFields.push(
      accelerationField,
    );
  }

  const groups: InspectorGroup[] = [
    {
      id: "primary",
      title: "Podstawowe",
      description:
        "Widoczno\u015B\u0107, liczba element\u00F3w i tempo animacji",
      fields: primaryFields,
    },
    {
      id: "transform",
      title: "Transformacja",
      description:
        "Rozmiar, pozycja i obr\u00F3t ca\u0142ej warstwy",
      fields: [
        scaleField,
        xField,
        yField,
        rotationField,
      ],
    },
    {
      id: "appearance",
      title: "Wygl\u0105d",
      description:
        "Rozmycie, jasno\u015B\u0107 i przesuni\u0119cie barwy",
      fields: [
        blurField,
        brightnessField,
        hueField,
      ],
    },
  ];

  container.innerHTML = `
    <div class="inspector-title">
      <div class="inspector-title-copy">
        <strong>
          ${definition.name}
        </strong>

        <span>
          ${selected.effectId}
        </span>
      </div>

      <button
        class="inspector-reset-button"
        type="button"
        data-inspector-reset
      >
        Resetuj
      </button>
    </div>

    ${
      variants.length > 0
        ? `
          <section class="inspector-variant-panel">
            <div class="inspector-variant-heading">
              <div>
                <strong>Wariant</strong>
                <span>
                  Gotowy styl bazowy efektu
                </span>
              </div>

              <div class="inspector-variant-actions">
                <span class="inspector-variant-count">
                  ${variants.length}
                </span>

                <button
                  class="inspector-field-reset"
                  type="button"
                  data-reset-variant
                  title="Resetuj wariant i ustawienia"
                  aria-label="Resetuj wariant i ustawienia"
                >
                  Reset
                </button>
              </div>
            </div>

            <select
              class="inspector-variant-select"
              data-effect-variant
              aria-label="Wariant efektu"
            >
              <option value="">
                W\u0142asny / r\u0119czny
              </option>

              ${variants
                .map(
                  (variant) => `
                    <option
                      value="${variant.id}"
                      ${
                        matchingVariant?.id === variant.id
                          ? "selected"
                          : ""
                      }
                    >
                      ${variant.name}
                    </option>
                  `,
                )
                .join("")}
            </select>

            <p class="inspector-variant-description">
              ${
                matchingVariant?.description ??
                "Wybierz wariant, aby zastosowa\u0107 gotowy zestaw parametr\u00F3w. Potem mo\u017Cesz dalej zmienia\u0107 suwaki."
              }
            </p>
          </section>
        `
        : ""
    }

    <section class="inspector-color-panel">
      <div class="inspector-color-heading">
        <div>
          <strong>Kolor efektu</strong>
          <span>
            Wybierz dowolny kolor ca\u0142ej warstwy
          </span>
        </div>

        <button
          class="inspector-field-reset"
          type="button"
          data-color-natural
          ${
            selected.settings.colorize
              ? ""
              : "disabled"
          }
        >
          Naturalny
        </button>
      </div>

      <div class="inspector-color-main">
        <label class="inspector-color-picker">
          <input
            type="color"
            value="${safeColor(selected.settings.color)}"
            data-effect-color
            aria-label="Kolor efektu"
          >

          <span
            class="inspector-color-value"
            data-color-value
          >
            ${safeColor(selected.settings.color).toUpperCase()}
          </span>
        </label>

        <span
          class="inspector-color-state ${
            selected.settings.colorize
              ? "is-active"
              : ""
          }"
        >
          ${
            selected.settings.colorize
              ? "W\u0142asny kolor"
              : "Kolor naturalny"
          }
        </span>
      </div>

      <div
        class="inspector-color-swatches"
        aria-label="Szybkie kolory"
      >
        ${colorPresets
          .map(
            (color) => `
              <button
                class="inspector-color-swatch ${
                  selected.settings.colorize &&
                  safeColor(
                    selected.settings.color,
                  ).toLowerCase() ===
                    color.toLowerCase()
                    ? "is-selected"
                    : ""
                }"
                type="button"
                data-color-preset="${color}"
                title="${color}"
                aria-label="Ustaw kolor ${color}"
                style="--swatch:${color}"
              ></button>
            `,
          )
          .join("")}
      </div>

      <p class="inspector-color-help">
        Kolorowanie obejmuje ca\u0142y efekt i dzia\u0142a tak\u017ce dla jasnych / bia\u0142ych element\u00F3w.
        Suwak Odcie\u0144 nadal mo\u017Ce dodatkowo przesuwa\u0107 barw\u0119.
      </p>
    </section>

    ${groups
      .map(
        (group) =>
          groupTemplate(
            group,
            selected.settings,
            definition.defaultSettings,
          ),
      )
      .join("")}

    <section
      class="inspector-group ${
        collapsedGroups.has("composition")
          ? "is-collapsed"
          : ""
      }"
    >
      <button
        class="inspector-group-toggle"
        type="button"
        data-inspector-group-toggle="composition"
        aria-expanded="${String(
          !collapsedGroups.has("composition"),
        )}"
      >
        <span class="inspector-group-heading">
          <strong>Kompozycja</strong>
          <span>
            Spos\u00F3b \u0142\u0105czenia warstwy z pozosta\u0142ymi
          </span>
        </span>

        <span
          class="inspector-group-chevron"
          aria-hidden="true"
        ></span>
      </button>

      <div
        class="inspector-group-fields"
        ${
          collapsedGroups.has("composition")
            ? "hidden"
            : ""
        }
      >
        <label class="inspector-field">
          <span class="inspector-label">
            <span>Tryb mieszania</span>

            <button
              class="inspector-field-reset"
              type="button"
              data-reset-setting="blendMode"
              title="Resetuj tryb mieszania"
              aria-label="Resetuj tryb mieszania"
              ${
                selected.settings.blendMode ===
                definition.defaultSettings.blendMode
                  ? "disabled"
                  : ""
              }
            >
              Reset
            </button>
          </span>

          <select data-setting="blendMode">
            <option value="normal">Normalny</option>
            <option value="screen">Ekran</option>
            <option value="lighten">Rozja\u015Bnianie</option>
            <option value="multiply">Mno\u017Cenie</option>
            <option value="overlay">Nak\u0142adka</option>
          </select>
        </label>

        <label class="inspector-field">
          <span class="inspector-label">
            <span>Obszar</span>

            <button
              class="inspector-field-reset"
              type="button"
              data-reset-setting="area"
              title="Resetuj obszar"
              aria-label="Resetuj obszar"
              ${
                selected.settings.area ===
                definition.defaultSettings.area
                  ? "disabled"
                  : ""
              }
            >
              Reset
            </button>
          </span>

          <select data-setting="area">
            <option value="full">Ca\u0142o\u015B\u0107</option>
            <option value="left">Lewa strona</option>
            <option value="center">\u015Arodek</option>
            <option value="right">Prawa strona</option>
            <option value="top">G\u00F3ra</option>
            <option value="bottom">D\u00F3\u0142</option>
          </select>
        </label>
      </div>
    </section>
  `;

  const blendModeSelect =
    container.querySelector<HTMLSelectElement>(
      '[data-setting="blendMode"]',
    );

  if (blendModeSelect) {
    blendModeSelect.value =
      selected.settings.blendMode;
  }

  const areaSelect =
    container.querySelector<HTMLSelectElement>(
      '[data-setting="area"]',
    );

  if (areaSelect) {
    areaSelect.value =
      selected.settings.area;
  }

  container
    .querySelectorAll<HTMLButtonElement>(
      "[data-inspector-group-toggle]",
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const groupId =
              button.dataset
                .inspectorGroupToggle;

            if (!groupId) {
              return;
            }

            if (
              collapsedGroups.has(
                groupId,
              )
            ) {
              collapsedGroups.delete(
                groupId,
              );
            } else {
              collapsedGroups.add(
                groupId,
              );
            }

            renderInspector(
              container,
            );
          },
        );
      },
    );

  const variantSelect =
    container.querySelector<HTMLSelectElement>(
      "[data-effect-variant]",
    );

  variantSelect?.addEventListener(
    "change",
    () => {
      const variant =
        variants.find(
          (item) =>
            item.id ===
            variantSelect.value,
        );

      if (!variant) {
        return;
      }

      updateEffectSettings(
        selected.instanceId,
        {
          ...variant.settings,
        },
      );
    },
  );

  const colorInput =
    container.querySelector<HTMLInputElement>(
      "[data-effect-color]",
    );

  colorInput?.addEventListener(
    "change",
    () => {
      updateEffectSettings(
        selected.instanceId,
        {
          color:
            safeColor(
              colorInput.value,
            ),
          colorize: true,
        },
      );
    },
  );

  container
    .querySelectorAll<HTMLButtonElement>(
      "[data-color-preset]",
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const color =
              safeColor(
                button.dataset
                  .colorPreset,
              );

            updateEffectSettings(
              selected.instanceId,
              {
                color,
                colorize: true,
              },
            );
          },
        );
      },
    );

  container
    .querySelector<HTMLButtonElement>(
      "[data-color-natural]",
    )
    ?.addEventListener(
      "click",
      () => {
        updateEffectSettings(
          selected.instanceId,
          {
            color:
              definition
                .defaultSettings
                .color,
            colorize: false,
          },
        );
      },
    );

  container
    .querySelectorAll<HTMLButtonElement>(
      "[data-reset-setting]",
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            const key =
              button.dataset
                .resetSetting as
                keyof EffectSettings | undefined;

            if (!key) {
              return;
            }

            updateEffectSettings(
              selected.instanceId,
              {
                [key]:
                  definition.defaultSettings[
                    key
                  ],
              } as Partial<EffectSettings>,
            );
          },
        );
      },
    );

  container
    .querySelector<HTMLButtonElement>(
      "[data-reset-variant]",
    )
    ?.addEventListener(
      "click",
      () => {
        updateEffectSettings(
          selected.instanceId,
          {
            ...definition.defaultSettings,
          },
        );
      },
    );

  container
    .querySelectorAll<HTMLInputElement>(
      'input[type="range"][data-setting]',
    )
    .forEach((input) => {
      input.addEventListener(
        "input",
        () => {
          const key =
            input.dataset.setting as
              NumericSettingKey;

          const value =
            Number(input.value);

          const output =
            container.querySelector<HTMLOutputElement>(
              `[data-output="${key}"]`,
            );

          if (output) {
            output.value =
              `${value}${input.dataset.suffix ?? ""}`;
          }

          updateEffectSettings(
            selected.instanceId,
            {
              [key]: value,
            } as Partial<EffectSettings>,
          );
        },
      );
    });

  blendModeSelect?.addEventListener(
    "change",
    () => {
      updateEffectSettings(
        selected.instanceId,
        {
          blendMode:
            blendModeSelect.value as
              EffectSettings["blendMode"],
        },
      );
    },
  );

  areaSelect?.addEventListener(
    "change",
    () => {
      updateEffectSettings(
        selected.instanceId,
        {
          area:
            areaSelect.value as
              EffectSettings["area"],
        },
      );
    },
  );

  container
    .querySelector<HTMLButtonElement>(
      "[data-inspector-reset]",
    )
    ?.addEventListener(
      "click",
      () => {
        updateEffectSettings(
          selected.instanceId,
          {
            ...definition.defaultSettings,
          },
        );
      },
    );
}
