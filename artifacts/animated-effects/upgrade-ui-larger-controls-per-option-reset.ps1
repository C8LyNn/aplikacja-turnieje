param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$inspectorPath = Join-Path $ProjectRoot "src\editor\inspector.ts"
$stylePath = Join-Path $ProjectRoot "src\style.css"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $inspectorPath) -or
  !(Test-Path $stylePath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentInspector = [System.IO.File]::ReadAllText($inspectorPath)

if (
  !$currentInspector.Contains(
    'getEffectVariants'
  ) -or
  !$currentInspector.Contains(
    'inspector-group-toggle'
  )
) {
  throw "Nie wykryto aktualnego Inspectora z wariantami. Nie nadpisuje plikow."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"
$inspectorBackup = Join-Path $backupRoot "src\editor\inspector.ts"
$styleBackup = Join-Path $backupRoot "src\style.css"

$inspectorBackupDir = Split-Path $inspectorBackup -Parent
$styleBackupDir = Split-Path $styleBackup -Parent

New-Item -ItemType Directory -Force -Path $inspectorBackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $styleBackupDir | Out-Null

Copy-Item $inspectorPath $inspectorBackup -Force
Copy-Item $stylePath $styleBackup -Force

Write-Host ""
Write-Host "Animated Effects - Larger UI + Per-setting Reset" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

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

$uiPatch = @'
/* === AE_UI_LARGER_CONTROLS_RESET_START === */

/*
  UI readability pass:
  - larger panels and type
  - larger controls / click targets
  - per-setting Reset button
  - selected values remain visible without making the inspector cramped
*/

.ae-editor-grid {
  grid-template-columns:
    310px
    minmax(0, 1fr)
    380px;
}

.ae-app-shell {
  font-size: 13px;
}

.ae-app-header {
  min-height: 64px;
}

.ae-brand h1 {
  font-size: 15px;
}

.ae-dev-context {
  font-size: 9.5px;
}

.ae-status-pill {
  font-size: 10.5px;
}

.ae-button {
  min-height: 38px;
  height: 38px;

  padding-left: 14px;
  padding-right: 14px;

  font-size: 11px;
}

.ae-sidebar-tabs {
  min-height: 50px;
}

.ae-sidebar-tab {
  min-height: 36px;
  height: 36px;

  font-size: 11px;
}

.ae-tab-count {
  min-width: 20px;
  height: 20px;

  font-size: 9px;
}

.ae-sidebar-heading {
  padding:
    15px
    12px
    11px;
}

.ae-sidebar-heading strong,
.ae-panel-heading strong,
.ae-stage-toolbar strong {
  font-size: 12px;
}

.ae-sidebar-heading span,
.ae-panel-heading span,
.ae-stage-toolbar span {
  font-size: 9.5px;
}

.ae-effect-filters {
  grid-template-columns:
    minmax(0, 1fr)
    124px;

  gap: 8px;

  padding-left: 10px;
  padding-right: 10px;
}

.ae-search-wrap,
.ae-category-select {
  height: 40px;

  font-size: 10.5px;
}

.ae-search-wrap input {
  font-size: 10.5px;
}

.ae-effect-card {
  min-height: 60px;

  grid-template-columns:
    minmax(0, 1fr)
    32px;

  padding:
    9px
    9px
    9px
    11px;
}

.ae-effect-card-main strong {
  font-size: 11.5px;
}

.ae-effect-card-subline small {
  font-size: 9px;
}

.ae-add-icon {
  width: 32px;
  min-width: 32px;
  height: 32px;

  font-size: 18px;
}

.ae-layer-row {
  min-height: 58px;
}

.ae-layer-copy strong {
  font-size: 11px;
}

.ae-layer-copy small {
  font-size: 9px;
}

.ae-icon-button {
  width: 32px;
  height: 32px;

  font-size: 11px;
}

.ae-stage-panel {
  grid-template-rows:
    48px
    minmax(0, 1fr);
}

.ae-stage-toolbar {
  min-height: 48px;
}

.ae-stage-hint {
  height: 30px;

  padding-left: 9px;
  padding-right: 9px;

  font-size: 9.5px;
}

.ae-panel-heading {
  min-height: 50px;

  padding:
    10px
    12px;
}

.ae-inspector-content {
  padding:
    11px
    11px
    18px;
}

.ae-inspector-content .inspector-title {
  min-height: 64px;

  padding: 11px;

  border-radius: 10px;
}

.inspector-title-copy strong {
  font-size: 13px;
}

.inspector-title-copy span {
  font-size: 9.5px;
}

.inspector-reset-button {
  min-height: 32px;

  padding:
    0
    10px;

  font-size: 9.5px;
}

.inspector-variant-panel {
  gap: 10px;

  margin-bottom: 9px;
  padding: 12px;

  border-radius: 10px;
}

.inspector-variant-heading strong {
  font-size: 11.5px;
}

.inspector-variant-heading span {
  font-size: 9px;
}

.inspector-variant-actions {
  flex: 0 0 auto;

  display: flex;
  align-items: center;

  gap: 6px;
}

.inspector-variant-count {
  min-width: 24px;
  height: 24px;

  font-size: 9px !important;
}

.inspector-variant-select {
  height: 40px;

  padding-left: 12px;

  font-size: 11px;
}

.inspector-variant-description {
  min-height: 30px;

  font-size: 9.5px;
  line-height: 1.5;
}

.inspector-group {
  margin-bottom: 9px;

  border-radius: 10px;
}

.inspector-group-toggle {
  min-height: 50px;

  padding:
    9px
    10px
    8px;
}

.inspector-group-heading strong {
  font-size: 11px;
}

.inspector-group-heading span {
  font-size: 9px;
}

.inspector-group-fields {
  padding:
    2px
    10px
    7px;
}

.ae-inspector-content .inspector-field {
  gap: 7px;

  margin-bottom: 13px;
}

.ae-inspector-content .inspector-label {
  min-height: 28px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 8px;

  font-size: 11px;
  font-weight: 700;
}

.inspector-field-tools {
  flex: 0 0 auto;

  display: flex;
  align-items: center;

  gap: 6px;
}

.ae-inspector-content .inspector-label output {
  min-width: 52px;

  padding:
    4px
    7px;

  font-size: 9.5px;
}

.inspector-field-reset {
  flex: 0 0 auto;

  min-width: 45px;
  height: 28px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding:
    0
    8px;

  border:
    1px solid
    rgba(255, 255, 255, 0.09);

  border-radius: 7px;

  background: #151b27;
  color: #9eacc0;

  font: inherit;
  font-size: 9px;
  font-weight: 720;

  cursor: pointer;

  transition:
    border-color 120ms ease,
    background 120ms ease,
    color 120ms ease,
    opacity 120ms ease;
}

.inspector-field-reset:hover:not(:disabled) {
  border-color:
    rgba(124, 92, 255, 0.42);

  background:
    rgba(124, 92, 255, 0.11);

  color: #ddd7ff;
}

.inspector-field-reset:disabled {
  opacity: 0.34;

  cursor: default;
}

.ae-inspector-content
  .inspector-field
  input[type="range"] {
  height: 22px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-webkit-slider-runnable-track {
  height: 6px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-moz-range-track {
  height: 6px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-webkit-slider-thumb {
  width: 18px;
  height: 18px;

  margin-top: -7px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
}

.ae-inspector-content
  .inspector-field
  select {
  height: 40px;

  padding-left: 12px;

  font-size: 11px;
}

.inspector-empty {
  padding: 26px 18px;
}

.inspector-empty strong {
  font-size: 12px;
}

.inspector-empty span {
  font-size: 10px;
}

/* Maintain usability on narrower desktop windows. */
@media (max-width: 1450px) {
  .ae-editor-grid {
    grid-template-columns:
      290px
      minmax(0, 1fr)
      360px;
  }
}

@media (max-width: 1180px) {
  .ae-editor-grid {
    grid-template-columns:
      260px
      minmax(0, 1fr)
      330px;
  }

  .ae-effect-filters {
    grid-template-columns: 1fr;
  }
}

/* === AE_UI_LARGER_CONTROLS_RESET_END === */
'@

$currentStyle = [System.IO.File]::ReadAllText($stylePath)

$startMarker = "/* === AE_UI_LARGER_CONTROLS_RESET_START === */"
$endMarker = "/* === AE_UI_LARGER_CONTROLS_RESET_END === */"

$start = $currentStyle.IndexOf($startMarker)
$end = $currentStyle.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length

  $before = ($currentStyle.Substring(0, $start)).TrimEnd()
  $after = ($currentStyle.Substring($end)).TrimStart()

  $newStyle = $before + "`r`n`r`n" + $uiPatch.Trim() + "`r`n"

  if ($after.Length -gt 0) {
    $newStyle += "`r`n" + $after
  }
}
else {
  $newStyle = $currentStyle.TrimEnd() + "`r`n`r`n" + $uiPatch.Trim() + "`r`n"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
  $inspectorPath,
  $newInspector,
  $utf8NoBom
)

[System.IO.File]::WriteAllText(
  $stylePath,
  $newStyle,
  $utf8NoBom
)

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
  Write-Host "Larger UI + Per-setting Reset zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - wieksza typografia w calym edytorze"
  Write-Host "  - wieksze przyciski, selecty, suwaki i karty"
  Write-Host "  - szerszy Inspector"
  Write-Host "  - Reset przy kazdym suwaku"
  Write-Host "  - Reset przy Trybie mieszania i Obszarze"
  Write-Host "  - Reset w sekcji Wariant"
  Write-Host "  - Reset calego efektu nadal zostaje"
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item $inspectorBackup $inspectorPath -Force
  Copy-Item $styleBackup $stylePath -Force

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
