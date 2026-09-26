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

$currentMain =
  [System.IO.File]::ReadAllText($mainPath)

if (
  !$currentMain.Contains(
    'class="ae-app-shell"'
  ) -or
  !$currentMain.Contains(
    'ae-brand-copy'
  )
) {
  throw "Nie wykryto aktualnego Dev UI v4. Nie nadpisuje plikow."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot =
  Join-Path $ProjectRoot ".animated-effects-backup\$stamp"

$mainBackup =
  Join-Path $backupRoot "src\main.ts"

$inspectorBackup =
  Join-Path $backupRoot "src\editor\inspector.ts"

$styleBackup =
  Join-Path $backupRoot "src\style.css"

New-Item -ItemType Directory -Force -Path (
  Split-Path $mainBackup -Parent
) | Out-Null

New-Item -ItemType Directory -Force -Path (
  Split-Path $inspectorBackup -Parent
) | Out-Null

New-Item -ItemType Directory -Force -Path (
  Split-Path $styleBackup -Parent
) | Out-Null

Copy-Item $mainPath $mainBackup -Force
Copy-Item $inspectorPath $inspectorBackup -Force
Copy-Item $stylePath $styleBackup -Force

Write-Host ""
Write-Host "Animated Effects - Final Dev UI Polish v5" -ForegroundColor Cyan
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

      button.title =
        definition.description;

      const performanceLabel =
        `Koszt wydajno\u015Bci: ${definition.performanceCost}/5`;

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
): string {
  const value = settings[field.key];

  return `
    <label class="inspector-field">
      <span class="inspector-label">
        <span>${field.label}</span>

        <output
          data-output="${field.key}"
          aria-live="off"
        >
          ${value}${field.suffix}
        </output>
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

    ${groups
      .map(
        (group) =>
          groupTemplate(
            group,
            selected.settings,
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

$polishCss = @'
/* === AE_EDITOR_UI_V5_POLISH_START === */

/*
  Final Dev polish:
  - slightly larger typography without increasing panel widths
  - plain header status instead of pill-heavy layout
  - compact effect cards with performance dots
  - stronger selected-layer state
  - collapsible inspector groups
  - consistent 32/34 px control heights
  - clearer preview toolbar
  - subtle tooltips through native title attributes
*/

:root {
  --ae-control-h: 34px;
  --ae-control-radius: 8px;
}

/* Global readability ----------------------------------------- */

.ae-app-shell {
  font-size: 12px;
}

.ae-brand h1 {
  font-size: 14px;
}

.ae-dev-context {
  font-size: 8.5px;
}

.ae-sidebar-heading strong,
.ae-panel-heading strong,
.ae-stage-toolbar strong {
  font-size: 11px;
}

.ae-sidebar-heading span,
.ae-panel-heading span,
.ae-stage-toolbar span {
  font-size: 9px;
}

.ae-sidebar-tab,
.ae-button,
.ae-search-wrap input,
.ae-category-select,
.ae-effect-card-main strong,
.ae-layer-copy strong,
.ae-inspector-content .inspector-label,
.ae-inspector-content .inspector-field select {
  font-size: 10px;
}

/* Header ----------------------------------------------------- */

.ae-app-header {
  grid-template-columns:
    minmax(190px, auto)
    minmax(0, 1fr)
    auto;
}

.ae-header-status {
  min-width: 0;

  justify-content: center;

  gap: 0;

  color: #78879d;
}

.ae-status-pill {
  min-height: auto;

  padding: 0;

  border: 0;
  border-radius: 0;

  background: transparent;

  color: #78879d;

  font-size: 9.5px;
  font-weight: 650;

  white-space: nowrap;
}

.ae-status-pill + .ae-status-pill::before {
  content: "\2022";

  display: inline-block;

  margin: 0 8px;

  color: #46546a;
}

.ae-header-actions {
  gap: 6px;
}

.ae-button {
  height: var(--ae-control-h);
  min-height: var(--ae-control-h);

  border-radius: var(--ae-control-radius);
}

/* Left panel ------------------------------------------------- */

.ae-sidebar-tabs {
  padding-left: 10px;
  padding-right: 10px;
}

.ae-sidebar-tab {
  height: 32px;
  min-height: 32px;
}

.ae-effect-filters {
  padding-left: 10px;
  padding-right: 10px;
}

.ae-search-wrap,
.ae-category-select {
  height: var(--ae-control-h);
}

.ae-effect-library,
.ae-layer-list {
  gap: 5px;

  padding-left: 10px;
  padding-right: 10px;
}

.ae-effect-card {
  min-height: 52px;

  grid-template-columns:
    minmax(0, 1fr)
    28px;

  gap: 8px;

  padding:
    7px
    8px
    7px
    10px;
}

.ae-effect-card-main {
  min-width: 0;

  display: grid;
  gap: 4px;

  text-align: left;
}

.ae-effect-card-main strong {
  overflow: hidden;

  color: #eef3fb;

  font-weight: 740;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.ae-effect-card-subline {
  min-width: 0;

  display: flex;
  align-items: center;

  gap: 8px;
}

.ae-effect-card-subline small {
  overflow: hidden;

  color: #6e7d93;

  font-size: 8.5px;
  font-weight: 720;

  letter-spacing: 0.035em;

  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.ae-performance-badge {
  display: none;
}

.ae-performance-dots {
  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;

  gap: 2px;
}

.ae-performance-dots i {
  width: 4px;
  height: 4px;

  border-radius: 50%;

  background: #2c3544;
}

.ae-performance-dots i.is-filled {
  background: #7764d7;
}

.ae-add-icon {
  width: 28px;
  min-width: 28px;
  height: 28px;

  display: grid;
  place-items: center;

  padding: 0;

  border-radius: 7px;

  font-size: 16px;
  font-weight: 450;

  line-height: 1;
}

.ae-effect-card:hover .ae-add-icon {
  border-color: rgba(124, 92, 255, 0.44);

  background: rgba(124, 92, 255, 0.15);

  color: #ddd7ff;
}

/* Layers ----------------------------------------------------- */

.ae-layer-row {
  position: relative;

  overflow: hidden;

  min-height: 50px;
}

.ae-layer-row::before {
  content: "";

  position: absolute;
  inset:
    7px
    auto
    7px
    0;

  width: 2px;

  border-radius: 999px;

  background: transparent;
}

.ae-layer-row.is-selected {
  border-color: rgba(124, 92, 255, 0.58);

  background:
    linear-gradient(
      90deg,
      rgba(124, 92, 255, 0.15),
      rgba(124, 92, 255, 0.045) 50%,
      #111722
    );

  box-shadow:
    inset 0 0 0 1px
      rgba(124, 92, 255, 0.045);
}

.ae-layer-row.is-selected::before {
  background: #8d73ff;
}

.ae-layer-row.is-selected
  .ae-layer-copy strong {
  color: #ffffff;
}

.ae-layer-copy small {
  color: #6f7e94;
}

.ae-icon-button {
  transition:
    border-color 120ms ease,
    background 120ms ease,
    color 120ms ease;
}

/* Preview ---------------------------------------------------- */

.ae-stage-toolbar {
  min-height: 44px;
}

.ae-stage-toolbar > div:first-child {
  min-width: 0;

  display: flex;
  align-items: baseline;

  gap: 8px;
}

.ae-stage-toolbar > div:first-child > span {
  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.ae-stage-hint {
  height: 26px;

  display: inline-flex;
  align-items: center;

  padding: 0 8px;

  border-radius: 7px;

  color: #8593a8;

  font-size: 8.5px;
  font-weight: 700;
}

.ae-preview-shell {
  padding: 18px;
}

.effect-preview {
  border-color: rgba(255, 255, 255, 0.11);

  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.38);
}

/* Inspector -------------------------------------------------- */

.ae-inspector-content {
  padding:
    10px
    10px
    16px;
}

.ae-inspector-content .inspector-title {
  margin-bottom: 7px;
}

.inspector-title-copy strong {
  font-size: 11.5px;
}

.inspector-title-copy span {
  font-size: 8.5px;
}

.inspector-reset-button {
  min-height: 28px;

  padding: 0 9px;

  font-size: 8.5px;
}

.inspector-group {
  margin-bottom: 7px;

  padding: 0;

  overflow: hidden;
}

.inspector-group-toggle {
  width: 100%;
  min-height: 44px;

  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    20px;
  align-items: center;

  gap: 8px;

  margin: 0;
  padding:
    8px
    9px
    7px;

  border: 0;

  background: transparent;
  color: inherit;

  cursor: pointer;

  text-align: left;
}

.inspector-group-toggle:hover {
  background:
    rgba(255, 255, 255, 0.018);
}

.inspector-group-heading {
  min-width: 0;

  display: grid;

  gap: 2px;

  margin: 0;
}

.inspector-group-heading strong {
  color: #d8e0ec;

  font-size: 9.5px;
  font-weight: 760;
}

.inspector-group-heading span {
  overflow: hidden;

  color: #66758c;

  font-size: 8px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspector-group-chevron {
  position: relative;

  width: 18px;
  height: 18px;

  border-radius: 5px;
}

.inspector-group-chevron::before,
.inspector-group-chevron::after {
  content: "";

  position: absolute;
  top: 8px;

  width: 6px;
  height: 1px;

  background: #718097;

  transition: transform 130ms ease;
}

.inspector-group-chevron::before {
  left: 4px;
  transform: rotate(45deg);
}

.inspector-group-chevron::after {
  right: 4px;
  transform: rotate(-45deg);
}

.inspector-group.is-collapsed
  .inspector-group-chevron::before {
  transform: rotate(-45deg);
}

.inspector-group.is-collapsed
  .inspector-group-chevron::after {
  transform: rotate(45deg);
}

.inspector-group-fields {
  padding:
    0
    9px
    4px;
}

.inspector-group-fields[hidden] {
  display: none;
}

.ae-inspector-content .inspector-field {
  gap: 5px;

  margin-bottom: 10px;
}

.ae-inspector-content .inspector-label {
  font-size: 9.5px;
}

.ae-inspector-content .inspector-label output {
  min-width: 48px;

  font-size: 8.5px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"] {
  height: 18px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-webkit-slider-runnable-track {
  height: 5px;
}

.ae-inspector-content
  .inspector-field
  input[type="range"]::-moz-range-track {
  height: 5px;
}

.ae-inspector-content
  .inspector-field
  select {
  height: 34px;

  border-radius: 8px;
}

/* Scrollbar consistency -------------------------------------- */

.ae-effect-library,
.ae-layer-list,
.ae-inspector-content {
  scrollbar-width: thin;
  scrollbar-color:
    #30394a
    transparent;
}

.ae-effect-library::-webkit-scrollbar,
.ae-layer-list::-webkit-scrollbar,
.ae-inspector-content::-webkit-scrollbar {
  width: 7px;
}

.ae-effect-library::-webkit-scrollbar-track,
.ae-layer-list::-webkit-scrollbar-track,
.ae-inspector-content::-webkit-scrollbar-track {
  background: transparent;
}

.ae-effect-library::-webkit-scrollbar-thumb,
.ae-layer-list::-webkit-scrollbar-thumb,
.ae-inspector-content::-webkit-scrollbar-thumb {
  border:
    2px solid
    transparent;
  border-radius: 999px;

  background:
    #30394a
    padding-box;
}

/* Responsive ------------------------------------------------- */

@media (max-width: 1180px) {
  .ae-editor-grid {
    grid-template-columns:
      260px
      minmax(0, 1fr)
      300px;
  }

  .ae-header-status {
    justify-content: flex-start;
  }
}

/* === AE_EDITOR_UI_V5_POLISH_END === */
'@

$currentStyle =
  [System.IO.File]::ReadAllText($stylePath)

$startMarker =
  "/* === AE_EDITOR_UI_V5_POLISH_START === */"

$endMarker =
  "/* === AE_EDITOR_UI_V5_POLISH_END === */"

$start =
  $currentStyle.IndexOf($startMarker)

$end =
  $currentStyle.IndexOf($endMarker)

if (
  $start -ge 0 -and
  $end -gt $start
) {
  $end += $endMarker.Length

  $before = (
    $currentStyle.Substring(
      0,
      $start
    )
  ).TrimEnd()

  $after = (
    $currentStyle.Substring(
      $end
    )
  ).TrimStart()

  $newStyle =
    $before +
    "`r`n`r`n" +
    $polishCss.Trim() +
    "`r`n"

  if ($after.Length -gt 0) {
    $newStyle +=
      "`r`n" +
      $after
  }
}
else {
  $newStyle =
    $currentStyle.TrimEnd() +
    "`r`n`r`n" +
    $polishCss.Trim() +
    "`r`n"
}

$utf8NoBom =
  New-Object System.Text.UTF8Encoding($false)

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
  Write-Host "Final Dev UI Polish v5 zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - czytelniejsza typografia"
  Write-Host "  - spokojniejszy status naglowka"
  Write-Host "  - uproszczone karty efektow"
  Write-Host "  - koszt efektu jako 5 subtelnych kropek"
  Write-Host "  - mocniejszy stan zaznaczonej warstwy"
  Write-Host "  - zwijane sekcje Inspectora"
  Write-Host "  - spojne wysokosci kontrolek i przyciskow"
  Write-Host "  - czytelniejszy toolbar podgladu"
  Write-Host "  - ujednolicone ciemne scrollbary"
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
