param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$mainPath = Join-Path $ProjectRoot "src\main.ts"
$inspectorPath = Join-Path $ProjectRoot "src\editor\inspector.ts"
$stylePath = Join-Path $ProjectRoot "src\style.css"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $mainPath) -or
  !(Test-Path $inspectorPath) -or
  !(Test-Path $stylePath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentMain = [System.IO.File]::ReadAllText($mainPath)
$currentInspector = [System.IO.File]::ReadAllText($inspectorPath)

if (
  !$currentMain.Contains('class="ae-effect-card"') -or
  !$currentInspector.Contains('inspector-group-toggle')
) {
  throw "Nie rozpoznaje aktualnego UI. Nie nadpisuje plikow."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".animated-effects-backup\$stamp"
$mainBackup = Join-Path $backupRoot "src\main.ts"
$inspectorBackup = Join-Path $backupRoot "src\editor\inspector.ts"
$styleBackup = Join-Path $backupRoot "src\style.css"

$mainBackupDir = Split-Path $mainBackup -Parent
$inspectorBackupDir = Split-Path $inspectorBackup -Parent
$styleBackupDir = Split-Path $styleBackup -Parent

New-Item -ItemType Directory -Force -Path $mainBackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $inspectorBackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $styleBackupDir | Out-Null

Copy-Item $mainPath $mainBackup -Force
Copy-Item $inspectorPath $inspectorBackup -Force
Copy-Item $stylePath $styleBackup -Force

Write-Host ""
Write-Host "Animated Effects - Color Hierarchy Pack 01" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot"
Write-Host ""

$newMain = @'
import "./style.css";

import type {
  EffectInstance,
} from "./core/types";

import {
  createPreview,
  renderEffect,
} from "./editor/preview";

import {
  renderInspector,
} from "./editor/inspector";

import {
  openExportPanel,
  setupExportPanel,
} from "./editor/exportPanel";

import {
  addEffect,
  clearEffects,
  getEditorState,
  moveEffectDown,
  moveEffectUp,
  removeEffect,
  selectEffect,
  subscribe,
  toggleEffect,
} from "./editor/state";

import {
  getAllEffectDefinitions,
  getEffectDefinition,
} from "./effects/registry";

import {
  getEffectVariants,
} from "./effects/variants";

const app =
  document.querySelector<HTMLDivElement>(
    "#app",
  );

if (!app) {
  throw new Error(
    "Nie znaleziono elementu #app.",
  );
}

app.innerHTML = `
  <main class="ae-app-shell">
    <header class="ae-app-header">
      <div class="ae-brand">
        <div class="ae-brand-mark">DEV</div>

        <div class="ae-brand-copy">
          <span class="ae-dev-context">DEV / NARZ\u0118DZIA</span>
          <h1>Animated Effects</h1>
        </div>
      </div>

      <div class="ae-header-status">
        <span
          id="library-summary"
          class="ae-status-pill"
        ></span>

        <span
          id="active-summary"
          class="ae-status-pill"
        ></span>
      </div>

      <div class="ae-header-actions">
        <button
          id="clear-preview"
          class="ae-button ae-button-secondary"
          type="button"
        >
          Wyczy\u015B\u0107 scen\u0119
        </button>

        <button
          id="export-stream-elements"
          class="ae-button ae-button-primary"
          type="button"
        >
          Eksportuj
        </button>
      </div>
    </header>

    <div class="ae-editor-grid">
      <aside class="ae-left-panel">
        <div class="ae-sidebar-tabs" role="tablist">
          <button
            class="ae-sidebar-tab is-active"
            type="button"
            data-sidebar-tab="effects"
            aria-selected="true"
          >
            Efekty
          </button>

          <button
            class="ae-sidebar-tab"
            type="button"
            data-sidebar-tab="layers"
            aria-selected="false"
          >
            Warstwy
            <span id="layer-count" class="ae-tab-count">0</span>
          </button>
        </div>

        <section
          id="effects-sidebar"
          class="ae-sidebar-view is-active"
          data-sidebar-view="effects"
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Biblioteka efekt\u00F3w</strong>
              <span id="effect-result-count"></span>
            </div>
          </div>

          <div class="ae-effect-filters">
            <label class="ae-search-wrap">
              <span aria-hidden="true">\u2315</span>
              <input
                id="effect-search"
                type="search"
                placeholder="Szukaj efektu..."
                autocomplete="off"
              >
            </label>

            <select
              id="effect-category"
              class="ae-category-select"
              aria-label="Kategoria efektu"
            ></select>
          </div>

          <div
            id="effect-library"
            class="ae-effect-library"
          ></div>
        </section>

        <section
          id="layers-sidebar"
          class="ae-sidebar-view"
          data-sidebar-view="layers"
          hidden
        >
          <div class="ae-sidebar-heading">
            <div>
              <strong>Warstwy sceny</strong>
              <span>Najwy\u017Csza warstwa jest na g\u00F3rze listy</span>
            </div>
          </div>

          <div
            id="layers-list"
            class="ae-layer-list"
          ></div>
        </section>
      </aside>

      <section class="ae-stage-panel">
        <div class="ae-stage-toolbar">
          <div>
            <strong>Podgl\u0105d</strong>
            <span id="preview-meta"></span>
          </div>

          <div class="ae-stage-hint" title="Proporcje podgl\u0105du">
            16:9
          </div>
        </div>

        <div class="ae-preview-shell">
          <div id="preview-host"></div>
        </div>
      </section>

      <aside class="ae-inspector-panel">
        <div class="ae-panel-heading">
          <div>
            <strong>Ustawienia</strong>
            <span>Parametry zaznaczonej warstwy</span>
          </div>
        </div>

        <div
          id="inspector"
          class="ae-inspector-content"
        ></div>
      </aside>
    </div>
  </main>

  <dialog
    id="stream-elements-export"
    class="export-dialog"
  >
    <div class="export-header">
      <div>
        <strong>StreamElements</strong>
        <span data-export-metrics></span>
      </div>

      <button
        type="button"
        data-export-close
      >
        \u00D7
      </button>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>HTML</strong>
        <button type="button" data-copy="html">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="html"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>CSS</strong>
        <button type="button" data-copy="css">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="css"
        readonly
      ></textarea>
    </div>

    <div class="export-section">
      <div class="export-section-header">
        <strong>JavaScript</strong>
        <button type="button" data-copy="javascript">
          Kopiuj
        </button>
      </div>

      <textarea
        data-export="javascript"
        readonly
      ></textarea>
    </div>
  </dialog>
`;

function getRequiredElement<
  T extends HTMLElement
>(
  selector: string,
): T {
  const element =
    document.querySelector<T>(
      selector,
    );

  if (!element) {
    throw new Error(
      `Nie znaleziono elementu: ${selector}`,
    );
  }

  return element;
}

const previewHost =
  getRequiredElement<HTMLElement>(
    "#preview-host",
  );

const layersList =
  getRequiredElement<HTMLElement>(
    "#layers-list",
  );

const layerCount =
  getRequiredElement<HTMLElement>(
    "#layer-count",
  );

const inspector =
  getRequiredElement<HTMLElement>(
    "#inspector",
  );

const effectLibrary =
  getRequiredElement<HTMLElement>(
    "#effect-library",
  );

const effectSearch =
  getRequiredElement<HTMLInputElement>(
    "#effect-search",
  );

const effectCategory =
  getRequiredElement<HTMLSelectElement>(
    "#effect-category",
  );

const effectResultCount =
  getRequiredElement<HTMLElement>(
    "#effect-result-count",
  );

const librarySummary =
  getRequiredElement<HTMLElement>(
    "#library-summary",
  );

const activeSummary =
  getRequiredElement<HTMLElement>(
    "#active-summary",
  );

const previewMeta =
  getRequiredElement<HTMLElement>(
    "#preview-meta",
  );

const exportDialog =
  getRequiredElement<HTMLDialogElement>(
    "#stream-elements-export",
  );

setupExportPanel(
  exportDialog,
);

const preview =
  createPreview(
    previewHost,
  );

const effectDefinitions =
  getAllEffectDefinitions();

let searchQuery = "";
let selectedCategory = "all";

/*
  Range inputs emit "input" many times while dragging.
  State updates re-render the whole editor, so without this guard
  the inspector DOM would be replaced after the first movement and
  the thumb could no longer be dragged continuously.
*/
let isInspectorRangeDragging = false;

const categoryLabels: Record<
  string,
  string
> = {
  calm: "Spokojne",
  energy: "Energia",
  "sci-fi": "Sci-Fi",
  fantasy: "Fantasy",
  steampunk: "Steampunk",
  botanical: "Natura",
  urban: "Urban",
  cosmic: "Kosmos",
  tech: "Tech",
  solar: "Solar",
  retro: "Retro",
  weather: "Pogoda",
  cinematic: "Filmowe",
  abstract: "Abstrakcyjne",
  other: "Inne",
};

function categoryLabel(
  category: string,
): string {
  return (
    categoryLabels[category] ??
    category
  );
}

function effectNumber(
  current: EffectInstance,
): number {
  const sameType =
    getEditorState().effects.filter(
      (effect) =>
        effect.effectId ===
        current.effectId,
    );

  return (
    sameType.findIndex(
      (effect) =>
        effect.instanceId ===
        current.instanceId,
    ) + 1
  );
}

function renderCategoryOptions(): void {
  const categories = [
    ...new Set(
      effectDefinitions.map(
        (definition) =>
          definition.category,
      ),
    ),
  ].sort(
    (a, b) =>
      categoryLabel(a)
        .localeCompare(
          categoryLabel(b),
          "pl",
        ),
  );

  effectCategory.innerHTML = `
    <option value="all">
      Wszystkie kategorie
    </option>

    ${categories
      .map(
        (category) => `
          <option value="${category}">
            ${categoryLabel(category)}
          </option>
        `,
      )
      .join("")}
  `;

  effectCategory.value =
    selectedCategory;
}

function renderEffectLibrary(): void {
  const normalizedQuery =
    searchQuery
      .trim()
      .toLocaleLowerCase("pl");

  const filtered =
    effectDefinitions.filter(
      (definition) => {
        const matchesCategory =
          selectedCategory === "all" ||
          definition.category ===
            selectedCategory;

        if (!matchesCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

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

        return searchable.includes(
          normalizedQuery,
        );
      },
    );

  effectResultCount.textContent =
    `${filtered.length} z ${effectDefinitions.length}`;

  effectLibrary.replaceChildren();

  if (filtered.length === 0) {
    effectLibrary.innerHTML = `
      <div class="ae-empty-state">
        Nie znaleziono efekt\u00F3w dla tych filtr\u00F3w.
      </div>
    `;

    return;
  }

  filtered.forEach(
    (definition) => {
      const button =
        document.createElement(
          "button",
        );

      button.type = "button";
      button.className =
        "ae-effect-card";

      button.dataset.category =
        definition.category;

      button.title =
        definition.description;

      const performanceLabel =
        `Koszt wydajno\u015Bci: ${definition.performanceCost}/5`;

      const variantCount =
        getEffectVariants(
          definition.id,
        ).length;

      const performanceDots =
        Array.from(
          { length: 5 },
          (_, index) => `
            <i class="${
              index < definition.performanceCost
                ? "is-filled"
                : ""
            }"></i>
          `,
        ).join("");

      button.innerHTML = `
        <span class="ae-effect-card-main">
          <strong>${definition.name}</strong>

          <span class="ae-effect-card-subline">
            <small>
              ${categoryLabel(
                definition.category,
              )}
            </small>

            <span
              class="ae-performance-dots"
              title="${performanceLabel}"
              aria-label="${performanceLabel}"
            >
              ${performanceDots}
            </span>

            ${
              variantCount > 0
                ? `
                  <span
                    class="ae-variant-badge"
                    title="${variantCount} warianty efektu"
                  >
                    ${variantCount}V
                  </span>
                `
                : ""
            }
          </span>
        </span>

        <span
          class="ae-add-icon"
          aria-hidden="true"
        >
          +
        </span>
      `;

      button.addEventListener(
        "click",
        () => {
          addEffect(
            definition.id,
          );
        },
      );

      effectLibrary.appendChild(
        button,
      );
    },
  );
}

function renderPreview(): void {
  preview.replaceChildren();

  const state =
    getEditorState();

  state.effects.forEach(
    (effect) => {
      if (!effect.enabled) {
        return;
      }

      renderEffect(
        preview,
        effect,
      );
    },
  );
}

function renderLayers(): void {
  const state =
    getEditorState();

  layersList.replaceChildren();

  layerCount.textContent =
    String(
      state.effects.length,
    );

  if (
    state.effects.length === 0
  ) {
    layersList.innerHTML = `
      <div class="ae-empty-state">
        Brak warstw.
        <br>
        Przejd\u017A do zak\u0142adki Efekty i dodaj pierwszy efekt.
      </div>
    `;

    return;
  }

  [...state.effects]
    .reverse()
    .forEach(
      (instance) => {
        const definition =
          getEffectDefinition(
            instance.effectId,
          );

        if (!definition) {
          return;
        }

        const row =
          document.createElement(
            "div",
          );

        row.className =
          "ae-layer-row";

        if (!instance.enabled) {
          row.classList.add(
            "is-disabled",
          );
        }

        if (
          state
            .selectedEffectInstanceId ===
          instance.instanceId
        ) {
          row.classList.add(
            "is-selected",
          );
        }

        const number =
          effectNumber(
            instance,
          );

        row.innerHTML = `
          <button
            class="ae-layer-select"
            type="button"
          >
            <span class="ae-layer-color-dot"></span>

            <span class="ae-layer-copy">
              <strong>
                ${definition.name} #${number}
              </strong>

              <small>
                ${categoryLabel(
                  definition.category,
                )}
              </small>
            </span>
          </button>

          <div class="ae-layer-actions">
            <button
              class="ae-icon-button ae-toggle-button layer-toggle"
              type="button"
              title="W\u0142\u0105cz / wy\u0142\u0105cz"
              aria-label="W\u0142\u0105cz lub wy\u0142\u0105cz warstw\u0119"
            >
              ${instance.enabled ? "ON" : "OFF"}
            </button>

            <button
              class="ae-icon-button layer-up"
              type="button"
              title="Przenie\u015B wy\u017Cej"
              aria-label="Przenie\u015B warstw\u0119 wy\u017Cej"
            >
              &#8593;
            </button>

            <button
              class="ae-icon-button layer-down"
              type="button"
              title="Przenie\u015B ni\u017Cej"
              aria-label="Przenie\u015B warstw\u0119 ni\u017Cej"
            >
              &#8595;
            </button>

            <button
              class="ae-icon-button ae-icon-danger layer-remove"
              type="button"
              title="Usu\u0144"
              aria-label="Usu\u0144 warstw\u0119"
            >
              &#215;
            </button>
          </div>
        `;

        row
          .querySelector(
            ".ae-layer-select",
          )
          ?.addEventListener(
            "click",
            () => {
              selectEffect(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-toggle",
          )
          ?.addEventListener(
            "click",
            () => {
              toggleEffect(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-up",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectUp(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-down",
          )
          ?.addEventListener(
            "click",
            () => {
              moveEffectDown(
                instance.instanceId,
              );
            },
          );

        row
          .querySelector(
            ".layer-remove",
          )
          ?.addEventListener(
            "click",
            () => {
              removeEffect(
                instance.instanceId,
              );
            },
          );

        layersList.appendChild(
          row,
        );
      },
    );
}

function renderStatus(): void {
  const state =
    getEditorState();

  const activeCount =
    state.effects.filter(
      (effect) => effect.enabled,
    ).length;

  librarySummary.textContent =
    `${effectDefinitions.length} efekt\u00F3w`;

  activeSummary.textContent =
    `Aktywne: ${activeCount} \u00B7 Warstwy: ${state.effects.length}`;

  previewMeta.textContent =
    `${state.resolution.width} \u00D7 ${state.resolution.height} \u00B7 aktywne: ${activeCount}`;
}

function renderEditor(): void {
  renderPreview();
  renderLayers();
  renderStatus();

  if (!isInspectorRangeDragging) {
    renderInspector(
      inspector,
    );
  }
}

function setSidebarTab(
  tab: "effects" | "layers",
): void {
  document
    .querySelectorAll<HTMLButtonElement>(
      "[data-sidebar-tab]",
    )
    .forEach(
      (button) => {
        const isActive =
          button.dataset.sidebarTab ===
          tab;

        button.classList.toggle(
          "is-active",
          isActive,
        );

        button.setAttribute(
          "aria-selected",
          String(isActive),
        );
      },
    );

  document
    .querySelectorAll<HTMLElement>(
      "[data-sidebar-view]",
    )
    .forEach(
      (view) => {
        const isActive =
          view.dataset.sidebarView ===
          tab;

        view.hidden = !isActive;
        view.classList.toggle(
          "is-active",
          isActive,
        );
      },
    );
}

renderCategoryOptions();
renderEffectLibrary();

subscribe(
  renderEditor,
);

/*
  Keep the actual <input type="range"> alive for the whole pointer gesture.
  updateEffectSettings() may re-render preview/layers/status on every "input",
  but the inspector itself is not replaced until pointerup/pointercancel.
*/
inspector.addEventListener(
  "pointerdown",
  (event) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      target.type === "range"
    ) {
      isInspectorRangeDragging = true;
    }
  },
);

const finishInspectorRangeDrag = (): void => {
  if (!isInspectorRangeDragging) {
    return;
  }

  isInspectorRangeDragging = false;

  /*
    One final inspector render synchronizes its markup with state
    after the continuous drag has finished.
  */
  renderInspector(
    inspector,
  );
};

window.addEventListener(
  "pointerup",
  finishInspectorRangeDrag,
);

window.addEventListener(
  "pointercancel",
  finishInspectorRangeDrag,
);

effectSearch.addEventListener(
  "input",
  () => {
    searchQuery =
      effectSearch.value;

    renderEffectLibrary();
  },
);

effectCategory.addEventListener(
  "change",
  () => {
    selectedCategory =
      effectCategory.value;

    renderEffectLibrary();
  },
);

document
  .querySelectorAll<HTMLButtonElement>(
    "[data-sidebar-tab]",
  )
  .forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          const tab =
            button.dataset.sidebarTab;

          if (
            tab === "effects" ||
            tab === "layers"
          ) {
            setSidebarTab(tab);
          }
        },
      );
    },
  );

document
  .querySelector<HTMLButtonElement>(
    "#clear-preview",
  )
  ?.addEventListener(
    "click",
    clearEffects,
  );

document
  .querySelector<HTMLButtonElement>(
    "#export-stream-elements",
  )
  ?.addEventListener(
    "click",
    () => {
      openExportPanel(
        exportDialog,
      );
    },
  );

addEffect(
  "rainfall",
);

'@

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
      class="inspector-group inspector-group-${group.id} ${
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
      class="inspector-group inspector-group-composition ${
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

$colorCss = @'
/* === AE_COLOR_HIERARCHY_PACK_01_START === */

/*
  Color hierarchy pack:
  - keeps the dark Dev aesthetic
  - introduces restrained color by function/category
  - improves visual scanning without turning the UI into a rainbow
  - keeps contrast/accessibility changes from Accessibility Pack 01
*/

:root {
  --ae-cyan: #57c7ff;
  --ae-blue: #6d91ff;
  --ae-violet: #a88cff;
  --ae-magenta: #d67cff;
  --ae-teal: #55d6c2;
  --ae-green: #72d98b;
  --ae-amber: #f0b85a;
  --ae-orange: #f39a62;
  --ae-coral: #f07a7a;

  --ae-left-surface: #101725;
  --ae-center-surface: #0b111a;
  --ae-right-surface: #111824;
  --ae-card-surface: #151d2a;
}

/* Distinct app regions -------------------------------------- */

.ae-app-header {
  background:
    linear-gradient(
      180deg,
      #131b2a,
      #0f1622
    );
}

.ae-left-panel {
  background:
    linear-gradient(
      180deg,
      #101725,
      #0d1420
    );
}

.ae-stage-panel {
  background:
    linear-gradient(
      180deg,
      #0c121c,
      #090f17
    );
}

.ae-inspector-panel {
  background:
    linear-gradient(
      180deg,
      #111824,
      #0f1621
    );
}

.ae-panel-heading,
.ae-sidebar-tabs,
.ae-stage-toolbar {
  background:
    rgba(16, 23, 36, 0.94);
}

/* Header accents -------------------------------------------- */

.ae-brand-mark {
  border-color:
    rgba(168, 140, 255, 0.55);

  background:
    linear-gradient(
      145deg,
      rgba(168, 140, 255, 0.22),
      rgba(87, 199, 255, 0.09)
    );

  color: #e2d9ff;
}

.ae-button-primary {
  background:
    linear-gradient(
      135deg,
      #7356e9,
      #8d68f2
    );

  box-shadow:
    0 8px 20px
    rgba(93, 70, 205, 0.22);
}

.ae-button-primary:hover {
  background:
    linear-gradient(
      135deg,
      #8064ee,
      #9b79f7
    );
}

/* Sidebar tabs ---------------------------------------------- */

.ae-sidebar-tab.is-active {
  border-color:
    rgba(168, 140, 255, 0.52);

  background:
    linear-gradient(
      90deg,
      rgba(168, 140, 255, 0.18),
      rgba(87, 199, 255, 0.06)
    );

  color: #f5f2ff;
}

/* Effect cards: category color system ----------------------- */

.ae-effect-card {
  --category-color: var(--ae-violet);
  --category-rgb: 168, 140, 255;

  position: relative;

  overflow: hidden;

  background:
    linear-gradient(
      90deg,
      rgba(var(--category-rgb), 0.055),
      rgba(21, 29, 42, 0.98) 26%
    );

  border-color:
    rgba(255, 255, 255, 0.13);
}

.ae-effect-card::before {
  content: "";

  position: absolute;
  inset:
    9px
    auto
    9px
    0;

  width: 3px;

  border-radius:
    0
    999px
    999px
    0;

  background:
    var(--category-color);
}

.ae-effect-card:hover {
  border-color:
    rgba(var(--category-rgb), 0.58);

  background:
    linear-gradient(
      90deg,
      rgba(var(--category-rgb), 0.11),
      rgba(22, 30, 44, 0.99) 34%
    );
}

.ae-effect-card-subline small {
  color: var(--category-color);
}

.ae-effect-card
  .ae-performance-dots
  i.is-filled {
  background:
    var(--category-color);
}

.ae-effect-card
  .ae-variant-badge {
  border-color:
    rgba(var(--category-rgb), 0.38);

  background:
    rgba(var(--category-rgb), 0.11);

  color:
    var(--category-color);
}

.ae-effect-card
  .ae-add-icon {
  border-color:
    rgba(var(--category-rgb), 0.34);

  background:
    rgba(var(--category-rgb), 0.09);

  color:
    var(--category-color);
}

.ae-effect-card:hover
  .ae-add-icon {
  border-color:
    rgba(var(--category-rgb), 0.66);

  background:
    rgba(var(--category-rgb), 0.17);

  color: #ffffff;
}

/* Weather */
.ae-effect-card[data-category="weather"] {
  --category-color: #57c7ff;
  --category-rgb: 87, 199, 255;
}

/* Tech */
.ae-effect-card[data-category="tech"],
.ae-effect-card[data-category="sci-fi"] {
  --category-color: #6d91ff;
  --category-rgb: 109, 145, 255;
}

/* Cosmic */
.ae-effect-card[data-category="cosmic"] {
  --category-color: #a88cff;
  --category-rgb: 168, 140, 255;
}

/* Fantasy */
.ae-effect-card[data-category="fantasy"] {
  --category-color: #d67cff;
  --category-rgb: 214, 124, 255;
}

/* Energy */
.ae-effect-card[data-category="energy"],
.ae-effect-card[data-category="solar"] {
  --category-color: #f0b85a;
  --category-rgb: 240, 184, 90;
}

/* Botanical / calm */
.ae-effect-card[data-category="botanical"],
.ae-effect-card[data-category="calm"] {
  --category-color: #72d98b;
  --category-rgb: 114, 217, 139;
}

/* Retro */
.ae-effect-card[data-category="retro"] {
  --category-color: #f07a7a;
  --category-rgb: 240, 122, 122;
}

/* Cinematic / urban */
.ae-effect-card[data-category="cinematic"],
.ae-effect-card[data-category="urban"] {
  --category-color: #f39a62;
  --category-rgb: 243, 154, 98;
}

/* Steampunk */
.ae-effect-card[data-category="steampunk"] {
  --category-color: #c89762;
  --category-rgb: 200, 151, 98;
}

/* Other */
.ae-effect-card[data-category="other"] {
  --category-color: #9aa9bd;
  --category-rgb: 154, 169, 189;
}

/* Search / select fields ------------------------------------ */

.ae-search-wrap:focus-within,
.ae-category-select:focus {
  border-color:
    rgba(87, 199, 255, 0.58);

  box-shadow:
    0 0 0 3px
    rgba(87, 199, 255, 0.11);
}

/* Preview frame --------------------------------------------- */

.effect-preview {
  border-color:
    rgba(109, 145, 255, 0.23);

  box-shadow:
    0 24px 68px
    rgba(0, 0, 0, 0.40),
    0 0 0 1px
    rgba(87, 199, 255, 0.025);
}

.ae-stage-hint {
  border-color:
    rgba(87, 199, 255, 0.20);

  background:
    rgba(87, 199, 255, 0.055);

  color: #a9dfff;
}

/* Inspector title / variant --------------------------------- */

.ae-inspector-content
  .inspector-title {
  border-color:
    rgba(168, 140, 255, 0.48);

  background:
    linear-gradient(
      120deg,
      rgba(168, 140, 255, 0.13),
      rgba(17, 24, 36, 0.96) 42%
    );
}

.inspector-variant-panel {
  border-color:
    rgba(214, 124, 255, 0.34);

  background:
    linear-gradient(
      120deg,
      rgba(214, 124, 255, 0.095),
      rgba(17, 24, 36, 0.98) 46%
    );
}

.inspector-variant-count {
  border-color:
    rgba(214, 124, 255, 0.48);

  background:
    rgba(214, 124, 255, 0.14);

  color: #edc4ff;
}

/* Inspector groups: color by function ----------------------- */

.inspector-group {
  --group-color: #a88cff;
  --group-rgb: 168, 140, 255;

  position: relative;

  border-color:
    rgba(var(--group-rgb), 0.22);

  background:
    linear-gradient(
      110deg,
      rgba(var(--group-rgb), 0.055),
      rgba(17, 24, 36, 0.98) 38%
    );
}

.inspector-group::before {
  content: "";

  position: absolute;
  inset:
    9px
    auto
    9px
    0;

  width: 3px;

  border-radius:
    0
    999px
    999px
    0;

  background:
    var(--group-color);
}

.inspector-group-primary {
  --group-color: #57c7ff;
  --group-rgb: 87, 199, 255;
}

.inspector-group-transform {
  --group-color: #a88cff;
  --group-rgb: 168, 140, 255;
}

.inspector-group-appearance {
  --group-color: #55d6c2;
  --group-rgb: 85, 214, 194;
}

.inspector-group-composition {
  --group-color: #f0b85a;
  --group-rgb: 240, 184, 90;
}

.inspector-group-heading strong {
  color:
    var(--group-color);
}

.inspector-group-toggle:hover {
  background:
    rgba(var(--group-rgb), 0.045);
}

.inspector-group-chevron::before,
.inspector-group-chevron::after {
  background:
    var(--group-color);
}

/* Range controls -------------------------------------------- */

.ae-inspector-content
  .inspector-field
  input[type="range"] {
  accent-color:
    var(--group-color, #a88cff);
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-webkit-slider-thumb {
  background:
    var(--group-color, #a88cff);
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-moz-range-thumb {
  background:
    var(--group-color, #a88cff);
}

.ae-inspector-content
  .inspector-label
  output {
  border-color:
    rgba(var(--group-rgb, 168, 140, 255), 0.22);

  background:
    rgba(var(--group-rgb, 168, 140, 255), 0.055);
}

/* Resets should be neutral until needed --------------------- */

.inspector-field-reset:not(:disabled):hover,
.inspector-reset-button:hover {
  border-color:
    rgba(240, 184, 90, 0.48);

  background:
    rgba(240, 184, 90, 0.10);

  color: #ffd995;
}

/* Selected layer: clearer non-monochrome state -------------- */

.ae-layer-row.is-selected {
  border-color:
    rgba(87, 199, 255, 0.68);

  background:
    linear-gradient(
      90deg,
      rgba(87, 199, 255, 0.16),
      rgba(168, 140, 255, 0.055) 54%,
      rgba(21, 29, 42, 0.98)
    );

  box-shadow:
    inset 4px 0 0
    #57c7ff;
}

/* Focus ring remains obvious but less uniformly purple ------ */

.ae-app-shell
  button:focus-visible,
.ae-app-shell
  input:focus-visible,
.ae-app-shell
  select:focus-visible,
.ae-app-shell
  [tabindex]:focus-visible {
  outline-color:
    #57c7ff;

  box-shadow:
    0 0 0 5px
    rgba(87, 199, 255, 0.20);
}

/* === AE_COLOR_HIERARCHY_PACK_01_END === */
'@

$currentStyle = [System.IO.File]::ReadAllText($stylePath)

$startMarker = "/* === AE_COLOR_HIERARCHY_PACK_01_START === */"
$endMarker = "/* === AE_COLOR_HIERARCHY_PACK_01_END === */"

$start = $currentStyle.IndexOf($startMarker)
$end = $currentStyle.IndexOf($endMarker)

if ($start -ge 0 -and $end -gt $start) {
  $end += $endMarker.Length

  $before = ($currentStyle.Substring(0, $start)).TrimEnd()
  $after = ($currentStyle.Substring($end)).TrimStart()

  $newStyle = $before + "`r`n`r`n" + $colorCss.Trim() + "`r`n"

  if ($after.Length -gt 0) {
    $newStyle += "`r`n" + $after
  }
}
else {
  $newStyle = $currentStyle.TrimEnd() + "`r`n`r`n" + $colorCss.Trim() + "`r`n"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
  $mainPath,
  $newMain,
  $utf8NoBom
)

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
  Write-Host "Color Hierarchy Pack 01 zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - rozne odcienie tla dla 3 glownych obszarow"
  Write-Host "  - kolory kategorii efektow"
  Write-Host "  - kolorowe akcenty sekcji Inspectora"
  Write-Host "  - bardziej rozpoznawalny aktywny layer"
  Write-Host "  - subtelny kolor preview i naglowka"
  Write-Host "  - mniej jednolity fiolet w calym UI"
  Write-Host "  - zachowane ustawienia accessibility"
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item $mainBackup $mainPath -Force
  Copy-Item $inspectorBackup $inspectorPath -Force
  Copy-Item $styleBackup $stylePath -Force

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
