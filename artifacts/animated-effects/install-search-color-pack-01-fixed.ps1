param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$typesPath = Join-Path $ProjectRoot "src\core\types.ts"
$effectPath = Join-Path $ProjectRoot "src\effects\effectModules.ts"
$mainPath = Join-Path $ProjectRoot "src\main.ts"
$inspectorPath = Join-Path $ProjectRoot "src\editor\inspector.ts"
$previewPath = Join-Path $ProjectRoot "src\editor\preview.ts"
$exportPath = Join-Path $ProjectRoot "src\export\streamElements.ts"
$stylePath = Join-Path $ProjectRoot "src\style.css"

$required = @(
  $packageJson,
  $typesPath,
  $effectPath,
  $mainPath,
  $inspectorPath,
  $previewPath,
  $exportPath,
  $stylePath
)

foreach ($path in $required) {
  if (!(Test-Path $path)) {
    throw "Brak wymaganego pliku: $path"
  }
}

$currentMain = [System.IO.File]::ReadAllText($mainPath)
$currentInspector = [System.IO.File]::ReadAllText($inspectorPath)

if (
  !$currentMain.Contains("ae-library-usage-hint") -or
  !$currentMain.Contains("temporaryPreviewEffect") -or
  !$currentInspector.Contains("getEffectVariants")
) {
  throw "Nie rozpoznaje aktualnego UI z podgladem tymczasowym i wariantami."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"

$filesToBackup = @(
  "src\core\types.ts",
  "src\effects\effectModules.ts",
  "src\main.ts",
  "src\editor\inspector.ts",
  "src\editor\preview.ts",
  "src\export\streamElements.ts",
  "src\style.css"
)

foreach ($relative in $filesToBackup) {
  $source = Join-Path $ProjectRoot $relative
  $target = Join-Path $backupRoot $relative
  $targetDir = Split-Path $target -Parent

  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  Copy-Item $source $target -Force
}

Write-Host ""
Write-Host "Animated Effects - Search + Color Pack 01" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

# ------------------------------------------------------------
# 1. Extend EffectSettings with persistent color information.
# ------------------------------------------------------------

$currentTypes = [System.IO.File]::ReadAllText($typesPath)

if (
  !$currentTypes.Contains("colorize?: boolean") -and
  !$currentTypes.Contains("colorize: boolean")
) {
  $typePattern = '(\bhue\s*:\s*number;\s*)'
  $typeReplacement = '$1  color?: string;' + "`r`n" + '  colorize?: boolean;' + "`r`n"

  $newTypes = [regex]::Replace(
    $currentTypes,
    $typePattern,
    $typeReplacement,
    1
  )

  if ($newTypes -eq $currentTypes) {
    throw "Nie udalo sie rozszerzyc EffectSettings o kolor."
  }
}
else {
  $newTypes = $currentTypes
}

# ------------------------------------------------------------
# 2. Add defaults shared by every effect.
# ------------------------------------------------------------

$currentEffects = [System.IO.File]::ReadAllText($effectPath)

if (!$currentEffects.Contains("colorize: false")) {
  $settingsPattern = '(\bhue\s*:\s*0,\s*)'
  $settingsReplacement = '$1  color: "#a88cff",' + "`r`n" + '  colorize: false,' + "`r`n"

  $newEffects = [regex]::Replace(
    $currentEffects,
    $settingsPattern,
    $settingsReplacement,
    1
  )

  if ($newEffects -eq $currentEffects) {
    throw "Nie udalo sie dodac domyslnych ustawien koloru."
  }
}
else {
  $newEffects = $currentEffects
}

# ------------------------------------------------------------
# 3. Make library search predictable: visible name + id only.
# ------------------------------------------------------------

$oldSearchBlock = @'
        const searchable = [
          definition.name,
          definition.id,
          definition.description,
          ...definition.tags,
          categoryLabel(
            definition.category,
          ),
        ]
          .join(" ")
          .toLocaleLowerCase("pl");
'@

$newSearchBlock = @'
        const searchable = [
          definition.name,
          definition.id,
        ]
          .join(" ")
          .toLocaleLowerCase("pl");
'@

if ($currentMain.Contains($oldSearchBlock.Trim())) {
  $newMain = $currentMain.Replace(
    $oldSearchBlock.Trim(),
    $newSearchBlock.Trim()
  )
}
else {
  $newMain = $currentMain
}

# ------------------------------------------------------------
# 4. Replace inspector / preview / SE exporter with color-aware
#    versions based on the current modular architecture.
# ------------------------------------------------------------

$newInspector = @'
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

'@

$newPreview = @'
import type {
  EffectInstance,
  EffectSettings,
} from "../core/types";

import {
  getAllEffectModules,
  getEffectModule,
} from "../effects/registry";

const MODULE_STYLE_ID =
  "animated-effects-module-styles";

export function createPreview(
  container: HTMLElement,
): HTMLElement {
  ensureModuleStyles();

  const preview =
    document.createElement("div");

  preview.id = "effect-preview";
  preview.className = "effect-preview";

  container.appendChild(preview);

  return preview;
}

export function renderEffect(
  preview: HTMLElement,
  instance: EffectInstance,
): void {
  const module =
    getEffectModule(
      instance.effectId,
    );

  if (!module) {
    console.warn(
      `Unknown effect: ${instance.effectId}`,
    );

    return;
  }

  const layer =
    document.createElement("div");

  layer.className =
    "effect-layer ae-layer";

  layer.dataset.effectId =
    instance.effectId;

  layer.dataset.instanceId =
    instance.instanceId;

  applyLayerSettings(
    layer,
    instance.settings,
  );

  const random =
    createSeededRandom(
      instance.seed,
    );

  module.renderPreview(
    layer,
    instance.settings,
    random,
  );

  preview.appendChild(
    layer,
  );
}

function ensureModuleStyles(): void {
  if (
    document.getElementById(
      MODULE_STYLE_ID,
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style",
    );

  style.id =
    MODULE_STYLE_ID;

  style.textContent =
    getAllEffectModules()
      .map(
        (module) =>
          module.css,
      )
      .join("\n\n");

  document.head.appendChild(
    style,
  );
}

function hexToHsl(
  hex: string,
): {
  h: number;
  s: number;
  l: number;
} {
  const normalized =
    /^#[0-9a-f]{6}$/i.test(hex)
      ? hex.slice(1)
      : "a88cff";

  const r =
    parseInt(
      normalized.slice(0, 2),
      16,
    ) / 255;

  const g =
    parseInt(
      normalized.slice(2, 4),
      16,
    ) / 255;

  const b =
    parseInt(
      normalized.slice(4, 6),
      16,
    ) / 255;

  const max =
    Math.max(r, g, b);

  const min =
    Math.min(r, g, b);

  const delta =
    max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h =
        60 *
        (
          (
            (g - b) /
            delta
          ) %
          6
        );
    } else if (max === g) {
      h =
        60 *
        (
          (b - r) /
          delta +
          2
        );
    } else {
      h =
        60 *
        (
          (r - g) /
          delta +
          4
        );
    }
  }

  if (h < 0) {
    h += 360;
  }

  const l =
    (max + min) / 2;

  const s =
    delta === 0
      ? 0
      : delta /
        (
          1 -
          Math.abs(
            2 * l -
            1,
          )
        );

  return {
    h,
    s: s * 100,
    l: l * 100,
  };
}

function getColorizeFilter(
  settings: EffectSettings,
): string {
  if (!settings.colorize) {
    return "";
  }

  const { h, s, l } =
    hexToHsl(
      settings.color,
    );

  if (s < 4) {
    const whiteBrightness =
      Math.max(
        .55,
        Math.min(
          1.8,
          .45 +
          l / 70,
        ),
      );

    return `
      grayscale(1)
      saturate(0)
      brightness(
        ${whiteBrightness}
      )
    `;
  }

  const saturation =
    Math.round(
      380 +
      s * 10,
    );

  const rotate =
    h - 40;

  const colorBrightness =
    Math.max(
      .62,
      Math.min(
        1.55,
        .58 +
        l / 105,
      ),
    );

  return `
    grayscale(1)
    sepia(1)
    saturate(
      ${saturation}%
    )
    hue-rotate(
      ${rotate}deg
    )
    brightness(
      ${colorBrightness}
    )
  `;
}

function applyLayerSettings(
  layer: HTMLElement,
  settings: EffectSettings,
): void {
  layer.style.opacity =
    String(
      settings.opacity / 100,
    );

  layer.style.transform = `
    translate(
      ${settings.x}%,
      ${settings.y}%
    )
    scale(
      ${settings.scale / 100}
    )
    rotate(
      ${settings.rotation}deg
    )
  `;

  layer.style.filter = `
    ${getColorizeFilter(
      settings,
    )}
    blur(
      ${settings.blur}px
    )
    brightness(
      ${settings.brightness / 100}
    )
    hue-rotate(
      ${settings.hue}deg
    )
  `;

  layer.style.mixBlendMode =
    settings.blendMode;

  layer.style.zIndex =
    String(
      settings.zIndex,
    );

  layer.style.clipPath =
    getAreaClip(
      settings.area,
    );
}

function getAreaClip(
  area:
    EffectSettings["area"],
): string {
  switch (area) {
    case "left":
      return (
        "inset(0 50% 0 0)"
      );

    case "center":
      return (
        "inset(0 25% 0 25%)"
      );

    case "right":
      return (
        "inset(0 0 0 50%)"
      );

    case "top":
      return (
        "inset(0 0 50% 0)"
      );

    case "bottom":
      return (
        "inset(50% 0 0 0)"
      );

    case "full":
    default:
      return "none";
  }
}

function createSeededRandom(
  seed: number,
): () => number {
  let value =
    seed >>> 0;

  return () => {
    value +=
      0x6d2b79f5;

    let result =
      value;

    result =
      Math.imul(
        result ^
          (
            result >>>
            15
          ),
        result | 1,
      );

    result ^=
      result +
      Math.imul(
        result ^
          (
            result >>>
            7
          ),
        result | 61,
      );

    return (
      (
        result ^
        (
          result >>>
          14
        )
      ) >>> 0
    ) / 4294967296;
  };
}
'@

$newExport = @'
import type {
  EditorState,
  EffectInstance,
  StreamElementsExport,
} from "../core/types";

import {
  getEffectModule,
} from "../effects/registry";

export function generateStreamElementsExport(
  state: EditorState,
): StreamElementsExport {
  const enabledEffects =
    state.effects.filter(
      (effect) => effect.enabled,
    );

  const config =
    enabledEffects.map(
      (effect) => ({
        instanceId:
          effect.instanceId,

        effectId:
          effect.effectId,

        seed:
          effect.seed,

        settings:
          effect.settings,
      }),
    );

  return {
    html:
      generateHtml(),

    css:
      generateCss(
        enabledEffects,
      ),

    javascript:
      generateJavaScript(
        config,
      ),

    estimatedDomNodes:
      estimateDomNodes(
        enabledEffects,
      ),

    estimatedPerformanceCost:
      estimatePerformanceCost(
        enabledEffects,
      ),
  };
}

function generateHtml(): string {
  return `
<div id="animated-effects-root"></div>
`.trim();
}

function generateCss(
  effects:
    EffectInstance[],
): string {
  const usedCss =
    uniqueEffectIds(
      effects,
    )
      .map(
        (effectId) =>
          getEffectModule(
            effectId,
          )?.css,
      )
      .filter(
        (
          css,
        ): css is string =>
          Boolean(css),
      )
      .join("\n\n");

  return `
html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

#animated-effects-root {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.ae-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transform-origin: center;
  pointer-events: none;
}

${usedCss}
`.trim();
}

function generateJavaScript(
  config: Array<{
    instanceId: string;
    effectId: string;
    seed: number;
    settings:
      EffectInstance["settings"];
  }>,
): string {
  const effectIds =
    [
      ...new Set(
        config.map(
          (effect) =>
            effect.effectId,
        ),
      ),
    ];

  const renderers =
    effectIds
      .map(
        (effectId) => {
          const module =
            getEffectModule(
              effectId,
            );

          if (!module) {
            return null;
          }

          return {
            effectId,
            rendererName:
              module
                .streamElementsRendererName,
            source:
              module
                .streamElementsRendererSource,
          };
        },
      )
      .filter(
        (
          renderer,
        ): renderer is {
          effectId: string;
          rendererName: string;
          source: string;
        } =>
          renderer !== null,
      );

  const rendererSources =
    renderers
      .map(
        (renderer) =>
          renderer.source,
      )
      .join("\n\n");

  const rendererMap =
    renderers
      .map(
        (renderer) =>
          `${JSON.stringify(
            renderer.effectId,
          )}: ${renderer.rendererName}`,
      )
      .join(",\n  ");

  return `
const effects = ${JSON.stringify(
    config,
    null,
    2,
  )};

function aeCreateSeededRandom(seed) {
  let value = seed >>> 0;

  return function () {
    value += 0x6d2b79f5;

    let result = value;

    result = Math.imul(
      result ^ (result >>> 15),
      result | 1
    );

    result ^=
      result +
      Math.imul(
        result ^ (result >>> 7),
        result | 61
      );

    return (
      (
        result ^
        (result >>> 14)
      ) >>> 0
    ) / 4294967296;
  };
}

function aeAreaClip(area) {
  switch (area) {
    case "left":
      return "inset(0 50% 0 0)";

    case "center":
      return "inset(0 25% 0 25%)";

    case "right":
      return "inset(0 0 0 50%)";

    case "top":
      return "inset(0 0 50% 0)";

    case "bottom":
      return "inset(50% 0 0 0)";

    case "full":
    default:
      return "none";
  }
}

function aeHexToHsl(hex) {
  const normalized =
    /^#[0-9a-f]{6}$/i.test(hex)
      ? hex.slice(1)
      : "a88cff";

  const r =
    parseInt(
      normalized.slice(0, 2),
      16
    ) / 255;

  const g =
    parseInt(
      normalized.slice(2, 4),
      16
    ) / 255;

  const b =
    parseInt(
      normalized.slice(4, 6),
      16
    ) / 255;

  const max =
    Math.max(r, g, b);

  const min =
    Math.min(r, g, b);

  const delta =
    max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h =
        60 *
        (
          (
            (g - b) /
            delta
          ) %
          6
        );
    } else if (max === g) {
      h =
        60 *
        (
          (b - r) /
          delta +
          2
        );
    } else {
      h =
        60 *
        (
          (r - g) /
          delta +
          4
        );
    }
  }

  if (h < 0) {
    h += 360;
  }

  const l =
    (max + min) / 2;

  const s =
    delta === 0
      ? 0
      : delta /
        (
          1 -
          Math.abs(
            2 * l -
            1
          )
        );

  return {
    h: h,
    s: s * 100,
    l: l * 100
  };
}

function aeColorizeFilter(s) {
  if (!s.colorize) {
    return "";
  }

  const hsl =
    aeHexToHsl(
      s.color || "#a88cff"
    );

  if (hsl.s < 4) {
    const whiteBrightness =
      Math.max(
        .55,
        Math.min(
          1.8,
          .45 +
          hsl.l / 70
        )
      );

    return (
      "grayscale(1) " +
      "saturate(0) " +
      "brightness(" +
      whiteBrightness +
      ") "
    );
  }

  const saturation =
    Math.round(
      380 +
      hsl.s * 10
    );

  const rotate =
    hsl.h - 40;

  const colorBrightness =
    Math.max(
      .62,
      Math.min(
        1.55,
        .58 +
        hsl.l / 105
      )
    );

  return (
    "grayscale(1) " +
    "sepia(1) " +
    "saturate(" +
    saturation +
    "%) " +
    "hue-rotate(" +
    rotate +
    "deg) " +
    "brightness(" +
    colorBrightness +
    ") "
  );
}

function aeCreateLayer(
  effect,
  root
) {
  const layer =
    document.createElement("div");

  layer.className =
    "ae-layer";

  layer.dataset.effectId =
    effect.effectId;

  layer.dataset.instanceId =
    effect.instanceId;

  const s =
    effect.settings;

  layer.style.opacity =
    String(
      s.opacity / 100
    );

  layer.style.transform =
    "translate(" +
    s.x +
    "%, " +
    s.y +
    "%) " +
    "scale(" +
    s.scale / 100 +
    ") " +
    "rotate(" +
    s.rotation +
    "deg)";

  layer.style.filter =
    aeColorizeFilter(s) +
    "blur(" +
    s.blur +
    "px) " +
    "brightness(" +
    s.brightness / 100 +
    ") " +
    "hue-rotate(" +
    s.hue +
    "deg)";

  layer.style.mixBlendMode =
    s.blendMode;

  layer.style.zIndex =
    String(
      s.zIndex
    );

  layer.style.clipPath =
    aeAreaClip(
      s.area
    );

  root.appendChild(
    layer
  );

  return layer;
}

${rendererSources}

const aeRenderers = {
  ${rendererMap}
};

function startAnimatedEffects() {
  const root =
    document.getElementById(
      "animated-effects-root"
    );

  if (!root) {
    console.error(
      "Animated Effects: " +
      "#animated-effects-root " +
      "not found."
    );

    return;
  }

  root.replaceChildren();

  effects.forEach(
    function (effect) {
      const renderer =
        aeRenderers[
          effect.effectId
        ];

      if (!renderer) {
        console.warn(
          "Animated Effects: " +
          "unknown effect",
          effect.effectId
        );

        return;
      }

      renderer(
        effect,
        root
      );
    }
  );

  console.log(
    "Animated Effects started:",
    effects.length,
    "effect(s)"
  );
}

window.addEventListener(
  "onWidgetLoad",
  startAnimatedEffects
);
`.trim();
}


function uniqueEffectIds(
  effects:
    EffectInstance[],
): string[] {
  return [
    ...new Set(
      effects.map(
        (effect) =>
          effect.effectId,
      ),
    ),
  ];
}

function estimateDomNodes(
  effects:
    EffectInstance[],
): number {
  let total = 1;

  for (
    const effect of effects
  ) {
    total += 1;

    const module =
      getEffectModule(
        effect.effectId,
      );

    if (!module) {
      continue;
    }

    total +=
      module
        .estimateDomNodes(
          effect.settings,
        );
  }

  return total;
}

function estimatePerformanceCost(
  effects:
    EffectInstance[],
): number {
  return effects.reduce(
    (
      total,
      effect,
    ) => {
      const module =
        getEffectModule(
          effect.effectId,
        );

      return (
        total +
        (
          module
            ?.definition
            .performanceCost ??
          1
        )
      );
    },
    0,
  );
}
'@

# ------------------------------------------------------------
# 5. CSS: fix the stretched hint and add color controls.
# ------------------------------------------------------------

$currentStyle = [System.IO.File]::ReadAllText($stylePath)

$uiPatch = @'
/* === AE_SEARCH_COLOR_PACK_01_START === */

/*
  Search + color UX
  - fixes the temporary-preview hint stretching when search results are short
  - makes search use visible effect names / ids instead of hidden tags
  - adds accessible color controls for every effect
*/

#effects-sidebar {
  grid-template-rows:
    auto
    auto
    auto
    minmax(0, 1fr) !important;
}

.ae-library-usage-hint {
  align-self: start;
  min-height: 0;
  height: auto;
  flex: 0 0 auto;
}

.ae-effect-library {
  min-height: 0;
  align-self: stretch;
}

/* Color panel ------------------------------------------------ */

.inspector-color-panel {
  display: grid;
  gap: 12px;

  margin-bottom: 10px;
  padding: 14px;

  border:
    1px solid
    rgba(85, 214, 194, 0.38);

  border-radius: 11px;

  background:
    linear-gradient(
      120deg,
      rgba(85, 214, 194, 0.09),
      rgba(17, 24, 36, 0.98) 48%
    );
}

.inspector-color-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;
}

.inspector-color-heading > div {
  min-width: 0;

  display: grid;
  gap: 3px;
}

.inspector-color-heading strong {
  color: #7ce3d3;

  font-size: 12.5px;
  line-height: 1.3;
}

.inspector-color-heading span {
  color: #aab7c9;

  font-size: 10.5px;
  line-height: 1.4;
}

.inspector-color-main {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 10px;
}

.inspector-color-picker {
  min-width: 0;
  min-height: 48px;

  display: flex;
  align-items: center;

  gap: 10px;

  padding:
    6px
    9px;

  border:
    1px solid
    rgba(255, 255, 255, 0.14);

  border-radius: 9px;

  background: #151d2a;
}

.inspector-color-picker input[type="color"] {
  width: 52px;
  min-width: 52px;
  height: 36px;

  padding: 2px;

  border:
    1px solid
    rgba(255, 255, 255, 0.16);

  border-radius: 7px;

  background: #0e1520;

  cursor: pointer;
}

.inspector-color-picker input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.inspector-color-picker input[type="color"]::-webkit-color-swatch {
  border: 0;
  border-radius: 5px;
}

.inspector-color-picker input[type="color"]::-moz-color-swatch {
  border: 0;
  border-radius: 5px;
}

.inspector-color-value {
  min-width: 0;

  overflow: hidden;

  color: #eef5fb;

  font-family:
    ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;

  font-size: 11px;
  font-weight: 760;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspector-color-state {
  min-height: 34px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding:
    0
    10px;

  border:
    1px solid
    rgba(255, 255, 255, 0.10);

  border-radius: 8px;

  background: #141b27;

  color: #97a6ba;

  font-size: 10px;
  font-weight: 720;

  white-space: nowrap;
}

.inspector-color-state.is-active {
  border-color:
    rgba(85, 214, 194, 0.42);

  background:
    rgba(85, 214, 194, 0.10);

  color: #8ce8da;
}

.inspector-color-swatches {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(34px, 1fr));

  gap: 7px;
}

.inspector-color-swatch {
  min-width: 34px;
  height: 36px;

  padding: 0;

  border:
    2px solid
    rgba(255, 255, 255, 0.15);

  border-radius: 8px;

  background:
    var(--swatch);

  box-shadow:
    inset 0 0 0 2px
    rgba(0, 0, 0, 0.14);

  cursor: pointer;

  transition:
    transform 100ms ease,
    border-color 100ms ease,
    box-shadow 100ms ease;
}

.inspector-color-swatch:hover {
  transform: translateY(-1px);

  border-color: #ffffff;
}

.inspector-color-swatch.is-selected {
  border-color: #ffffff;

  box-shadow:
    0 0 0 3px
    rgba(85, 214, 194, 0.28),
    inset 0 0 0 2px
    rgba(0, 0, 0, 0.10);
}

.inspector-color-help {
  margin: 0;

  color: #aab7c9;

  font-size: 10px;
  line-height: 1.5;
}

/* Keyboard focus -------------------------------------------- */

.inspector-color-picker input[type="color"]:focus-visible,
.inspector-color-swatch:focus-visible {
  outline:
    3px solid
    #57c7ff;

  outline-offset: 3px;
}

/* Wider desktop inspector for color controls ---------------- */

@media (min-width: 1501px) {
  .ae-editor-grid {
    grid-template-columns:
      340px
      minmax(0, 1fr)
      450px;
  }
}

@media (max-width: 1260px) {
  .inspector-color-main {
    grid-template-columns: 1fr;
  }

  .inspector-color-state {
    justify-self: start;
  }

  .inspector-color-swatches {
    grid-template-columns:
      repeat(5, 1fr);
  }
}

/* === AE_SEARCH_COLOR_PACK_01_END === */
'@

$startMarker = "/* === AE_SEARCH_COLOR_PACK_01_START === */"
$endMarker = "/* === AE_SEARCH_COLOR_PACK_01_END === */"

$start = $currentStyle.IndexOf($startMarker)
$end = $currentStyle.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length
  $before = ($currentStyle.Substring(0, $start)).TrimEnd()
  $after = ($currentStyle.Substring($end)).TrimStart()

  $newStyle =
    $before +
    "`r`n`r`n" +
    $uiPatch.Trim() +
    "`r`n"

  if ($after.Length -gt 0) {
    $newStyle += "`r`n" + $after
  }
}
else {
  $newStyle =
    $currentStyle.TrimEnd() +
    "`r`n`r`n" +
    $uiPatch.Trim() +
    "`r`n"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText($typesPath, $newTypes, $utf8NoBom)
[System.IO.File]::WriteAllText($effectPath, $newEffects, $utf8NoBom)
[System.IO.File]::WriteAllText($mainPath, $newMain, $utf8NoBom)
[System.IO.File]::WriteAllText($inspectorPath, $newInspector, $utf8NoBom)
[System.IO.File]::WriteAllText($previewPath, $newPreview, $utf8NoBom)
[System.IO.File]::WriteAllText($exportPath, $newExport, $utf8NoBom)
[System.IO.File]::WriteAllText($stylePath, $newStyle, $utf8NoBom)

Push-Location $ProjectRoot

try {
  Write-Host "Uruchamiam TypeScript check..." -ForegroundColor Cyan
  & npx.cmd tsc --noEmit

  if ($LASTEXITCODE -ne 0) {
    throw "TypeScript check failed"
  }

  Write-Host "TypeScript: PASS" -ForegroundColor Green
  Write-Host "Uruchamiam build..." -ForegroundColor Cyan

  & npm.cmd run build

  if ($LASTEXITCODE -ne 0) {
    throw "Build failed"
  }

  Write-Host ""
  Write-Host "BUILD: PASS" -ForegroundColor Green
  Write-Host ""
  Write-Host "Search + Color Pack 01 FIXED zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - naprawiony wysoki pusty box przy filtrowaniu biblioteki"
  Write-Host "  - wyszukiwarka filtruje po nazwie / id, nie ukrytych tagach"
  Write-Host "  - kazdy efekt ma picker dowolnego koloru"
  Write-Host "  - 10 szybkich probek kolorow"
  Write-Host "  - przycisk Naturalny przywraca oryginalna palete"
  Write-Host "  - kolorowanie dziala takze na bialych / szarych efektach"
  Write-Host "  - kolor jest uwzgledniany w StreamElements export"
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  foreach ($relative in $filesToBackup) {
    $source = Join-Path $backupRoot $relative
    $target = Join-Path $ProjectRoot $relative
    Copy-Item $source $target -Force
  }

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
