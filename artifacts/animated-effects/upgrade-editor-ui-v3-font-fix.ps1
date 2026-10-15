param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

$packageJson = Join-Path $ProjectRoot "package.json"
$mainPath = Join-Path $ProjectRoot "src\main.ts"
$inspectorPath = Join-Path $ProjectRoot "src\editor\inspector.ts"
$stylePath = Join-Path $ProjectRoot "src\style.css"
$indexPath = Join-Path $ProjectRoot "index.html"

if (
  !(Test-Path $packageJson) -or
  !(Test-Path $mainPath) -or
  !(Test-Path $inspectorPath) -or
  !(Test-Path $stylePath) -or
  !(Test-Path $indexPath)
) {
  throw "Uruchom ten skrypt w katalogu glownym projektu animated-effects."
}

$currentMain =
  [System.IO.File]::ReadAllText($mainPath)

if (
  !$currentMain.Contains(
    'id="effect-library"'
  ) -or
  !$currentMain.Contains(
    'id="inspector"'
  )
) {
  throw "Nie wykryto Editor UI v2. Nie nadpisuje plikow."
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

$indexBackup =
  Join-Path $backupRoot "index.html"

New-Item -ItemType Directory -Force -Path (
  Split-Path $mainBackup -Parent
) | Out-Null

New-Item -ItemType Directory -Force -Path (
  Split-Path $inspectorBackup -Parent
) | Out-Null

Copy-Item $mainPath $mainBackup -Force
Copy-Item $inspectorPath $inspectorBackup -Force
Copy-Item $stylePath $styleBackup -Force
Copy-Item $indexPath $indexBackup -Force

Write-Host ""
Write-Host "Animated Effects - Editor UI v3" -ForegroundColor Cyan
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
        <div class="ae-brand-mark">AE</div>

        <div>
          <h1>Animated Effects</h1>
          <p>Edytor efekt\u00F3w dla OBS i StreamElements</p>
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

          <div class="ae-stage-hint">
            Format 16:9
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
        `Koszt ${definition.performanceCost}/5`;

      button.innerHTML = `
        <span class="ae-effect-card-main">
          <strong>${definition.name}</strong>
          <small>
            ${categoryLabel(
              definition.category,
            )}
          </small>
        </span>

        <span class="ae-effect-card-meta">
          <span
            class="ae-performance-badge"
            title="Szacunkowy koszt wydajno\u015Bci"
          >
            ${performanceLabel}
          </span>

          <span class="ae-add-icon">
            + Dodaj
          </span>
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
  title: string;
  description: string;
  fields: RangeField[];
}

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
  return `
    <section class="inspector-group">
      <div class="inspector-group-heading">
        <strong>${group.title}</strong>
        <span>${group.description}</span>
      </div>

      <div class="inspector-group-fields">
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
      title: "Podstawowe",
      description:
        "Widoczno\u015B\u0107, liczba element\u00F3w i tempo animacji",
      fields: primaryFields,
    },
    {
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

    <section class="inspector-group">
      <div class="inspector-group-heading">
        <strong>Kompozycja</strong>
        <span>
          Spos\u00F3b \u0142\u0105czenia warstwy z pozosta\u0142ymi
        </span>
      </div>

      <div class="inspector-group-fields">
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

$uiCss = @'
/* === AE_EDITOR_UI_V3_START === */

/*
  UI v3:
  - larger, clearer typography
  - denser but more readable sidebars
  - grouped inspector
  - dark scrollbars
  - clearer layer actions
  - larger preview area
*/

:root {
  --ae-bg: #070a11;
  --ae-panel: #0b1018;
  --ae-panel-soft: #101722;
  --ae-panel-raised: #151d2a;
  --ae-line: rgba(255, 255, 255, 0.075);
  --ae-line-strong: rgba(255, 255, 255, 0.14);
  --ae-text: #f4f7ff;
  --ae-muted: #92a0b5;
  --ae-muted-2: #68778f;
  --ae-accent: #7c5cff;
  --ae-accent-strong: #8d73ff;
  --ae-accent-soft: rgba(124, 92, 255, 0.13);
  --ae-accent-line: rgba(124, 92, 255, 0.5);
  --ae-danger: #ff667a;
}

html,
body,
#app,
button,
input,
select,
textarea {
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;
}

body {
  font-size: 13px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

button,
input,
select,
textarea {
  font: inherit;
}

* {
  scrollbar-width: thin;
  scrollbar-color:
    rgba(124, 92, 255, 0.45)
    rgba(255, 255, 255, 0.035);
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.025);
}

*::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background:
    linear-gradient(
      rgba(124, 92, 255, 0.5),
      rgba(124, 92, 255, 0.5)
    )
    padding-box;
}

*::-webkit-scrollbar-thumb:hover {
  background:
    linear-gradient(
      rgba(141, 115, 255, 0.7),
      rgba(141, 115, 255, 0.7)
    )
    padding-box;
}

.ae-app-shell {
  grid-template-rows: 70px minmax(0, 1fr);
}

.ae-app-header {
  gap: 18px;
  padding: 0 18px;
}

.ae-brand {
  gap: 11px;
}

.ae-brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 12px;
}

.ae-brand h1 {
  font-size: 16px;
  line-height: 1.15;
}

.ae-brand p {
  margin-top: 4px;
  color: var(--ae-muted);
  font-size: 11px;
  line-height: 1.2;
}

.ae-header-status {
  gap: 7px;
}

.ae-status-pill {
  padding: 6px 10px;
  border-color: var(--ae-line);
  background: rgba(255, 255, 255, 0.028);
  color: #a6b2c5;
  font-size: 10.5px;
  font-weight: 650;
}

.ae-button {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 750;
}

.ae-editor-grid {
  grid-template-columns:
    clamp(290px, 18vw, 330px)
    minmax(520px, 1fr)
    clamp(330px, 21vw, 390px);
}

.ae-left-panel,
.ae-inspector-panel {
  background:
    linear-gradient(
      180deg,
      rgba(14, 19, 29, 0.98),
      rgba(9, 14, 22, 0.98)
    );
}

.ae-sidebar-tabs {
  gap: 7px;
  padding: 11px 12px;
}

.ae-sidebar-tab {
  min-height: 38px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 780;
}

.ae-sidebar-tab.is-active {
  border-color: rgba(124, 92, 255, 0.46);
  background:
    linear-gradient(
      135deg,
      rgba(124, 92, 255, 0.18),
      rgba(124, 92, 255, 0.08)
    );
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.ae-tab-count {
  min-width: 21px;
  height: 21px;
  font-size: 9.5px;
}

.ae-sidebar-heading,
.ae-panel-heading {
  padding: 16px 16px 12px;
}

.ae-sidebar-heading > div,
.ae-panel-heading > div {
  gap: 5px;
}

.ae-sidebar-heading strong,
.ae-panel-heading strong,
.ae-stage-toolbar strong {
  color: #f2f5fc;
  font-size: 12.5px;
  font-weight: 800;
}

.ae-sidebar-heading span,
.ae-panel-heading span,
.ae-stage-toolbar span {
  color: var(--ae-muted-2);
  font-size: 10px;
  line-height: 1.35;
}

.ae-effect-filters {
  grid-template-columns: minmax(0, 1fr) 126px;
  gap: 8px;
  padding: 0 12px 12px;
}

.ae-search-wrap {
  height: 38px;
  gap: 8px;
  border-radius: 10px;
}

.ae-search-wrap input {
  font-size: 11px;
}

.ae-category-select {
  height: 38px;
  padding: 0 10px;
  border-radius: 10px;
  color: #d0d8e7;
  font-size: 10.5px;
}

.ae-effect-library,
.ae-layer-list {
  gap: 8px;
  padding: 0 12px 16px;
}

.ae-effect-card {
  min-height: 64px;
  gap: 10px;
  padding: 10px 10px 10px 12px;
  border-radius: 12px;
}

.ae-effect-card:hover {
  transform: translateY(-1px);
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.18);
}

.ae-effect-card-main {
  gap: 5px;
}

.ae-effect-card-main strong {
  font-size: 11.5px;
  line-height: 1.2;
}

.ae-effect-card-main small {
  color: #74839a;
  font-size: 9px;
  letter-spacing: 0.055em;
}

.ae-effect-card-meta {
  gap: 7px;
}

.ae-performance-badge {
  padding: 4px 6px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.025);
  color: #6f7e95;
  font-size: 8.5px;
  font-weight: 700;
  white-space: nowrap;
}

.ae-add-icon {
  width: auto;
  min-width: 54px;
  height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  color: #c7bcff;
  font-size: 9.5px;
  font-weight: 800;
  white-space: nowrap;
}

.ae-layer-row {
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
}

.ae-layer-select {
  gap: 9px;
  padding: 6px;
  border-radius: 8px;
}

.ae-layer-color-dot {
  width: 6px;
  height: 34px;
}

.ae-layer-copy {
  gap: 4px;
}

.ae-layer-copy strong {
  font-size: 10.5px;
  line-height: 1.15;
}

.ae-layer-copy small {
  color: #708097;
  font-size: 9px;
}

.ae-layer-actions {
  display: grid;
  grid-template-columns: repeat(4, 30px);
  gap: 4px;
}

.ae-icon-button {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  background: #171f2c;
  color: #b7c2d1;
  font-size: 12px;
  font-weight: 800;
}

.ae-icon-button:hover {
  border-color: rgba(124, 92, 255, 0.35);
  background: #202a3a;
}

.ae-toggle-button {
  font-size: 8px;
  letter-spacing: 0.02em;
}

.ae-empty-state {
  margin: 0 12px;
  padding: 26px 16px;
  border-radius: 12px;
  color: #728198;
  font-size: 10.5px;
  line-height: 1.55;
}

.ae-stage-panel {
  grid-template-rows: 50px minmax(0, 1fr);
  background:
    linear-gradient(
      rgba(255, 255, 255, 0.018) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.018) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 50% 42%,
      rgba(65, 82, 132, 0.13),
      transparent 42%
    ),
    #080b12;
  background-size:
    28px 28px,
    28px 28px,
    auto,
    auto;
}

.ae-stage-toolbar {
  padding: 0 16px;
  background: rgba(8, 11, 18, 0.88);
  backdrop-filter: blur(10px);
}

.ae-stage-toolbar > div:first-child {
  gap: 10px;
}

.ae-stage-hint {
  padding: 5px 8px;
  border-color: rgba(255, 255, 255, 0.075);
  background: rgba(255, 255, 255, 0.022);
  color: #748199;
  font-size: 9px;
}

.ae-preview-shell {
  padding: 20px 24px 24px;
}

#preview-host {
  width: min(1400px, 100%);
}

.effect-preview {
  border-radius: 16px;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.46),
    0 0 0 1px rgba(255, 255, 255, 0.018);
}

.ae-panel-heading {
  min-height: 50px;
  display: flex;
  align-items: center;
  padding-top: 11px;
  padding-bottom: 11px;
}

.ae-inspector-content {
  padding: 12px 12px 18px;
}

.ae-inspector-content .inspector-title {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 10px;
  padding: 12px 13px;
  border: 1px solid rgba(124, 92, 255, 0.42);
  border-radius: 12px;
  background:
    linear-gradient(
      135deg,
      rgba(124, 92, 255, 0.12),
      rgba(124, 92, 255, 0.04)
    );
}

.inspector-title-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.inspector-title-copy strong {
  overflow: hidden;
  color: #f2efff;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspector-title-copy span {
  color: #7d8ba2;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  font-size: 9px;
}

.inspector-reset-button {
  min-height: 30px;
  flex: 0 0 auto;
  padding: 0 9px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
  color: #aab6c8;
  font-size: 9.5px;
  font-weight: 750;
}

.inspector-reset-button:hover {
  border-color: rgba(124, 92, 255, 0.35);
  background: rgba(124, 92, 255, 0.1);
  color: #ece8ff;
}

.inspector-group {
  margin-bottom: 9px;
  padding: 12px 12px 4px;
  border: 1px solid rgba(255, 255, 255, 0.065);
  border-radius: 12px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.018),
      rgba(255, 255, 255, 0.008)
    );
}

.inspector-group-heading {
  display: grid;
  gap: 3px;
  margin-bottom: 11px;
}

.inspector-group-heading strong {
  color: #dfe6f2;
  font-size: 10.5px;
  font-weight: 800;
}

.inspector-group-heading span {
  color: #65748b;
  font-size: 8.5px;
  line-height: 1.35;
}

.inspector-group-fields {
  display: grid;
  gap: 1px;
}

.ae-inspector-content .inspector-field {
  gap: 7px;
  margin: 0 0 11px;
}

.ae-inspector-content .inspector-label {
  font-size: 10px;
  font-weight: 700;
}

.ae-inspector-content .inspector-label output {
  min-width: 50px;
  padding: 3px 7px;
  border-radius: 7px;
  color: #f3f5fa;
  font-size: 9px;
}

.ae-inspector-content .inspector-field input[type="range"] {
  height: 18px;
}

.ae-inspector-content .inspector-field select {
  height: 36px;
  border-radius: 9px;
  font-size: 10px;
}

.inspector-empty {
  min-height: 150px;
  display: grid;
  place-content: center;
  gap: 6px;
  padding: 24px;
  color: #728198;
  text-align: center;
}

.inspector-empty strong {
  color: #b8c3d2;
  font-size: 11px;
}

.inspector-empty span {
  max-width: 230px;
  font-size: 9.5px;
  line-height: 1.5;
}

.export-dialog {
  border: 1px solid var(--ae-line-strong);
  background: #0d121b;
}

@media (max-width: 1320px) {
  .ae-editor-grid {
    grid-template-columns:
      275px
      minmax(480px, 1fr)
      320px;
  }

  .ae-effect-filters {
    grid-template-columns: 1fr;
  }

  .ae-layer-actions {
    grid-template-columns: repeat(2, 30px);
  }
}

@media (max-width: 1050px) {
  .ae-header-status {
    display: none;
  }

  .ae-app-header {
    grid-template-columns: auto 1fr;
  }

  .ae-header-actions {
    justify-self: end;
  }

  .ae-editor-grid {
    grid-template-columns:
      260px
      minmax(0, 1fr)
      300px;
  }
}

/* === AE_EDITOR_UI_V3_END === */

'@

$currentStyle =
  [System.IO.File]::ReadAllText($stylePath)

$startMarker =
  "/* === AE_EDITOR_UI_V3_START === */"

$endMarker =
  "/* === AE_EDITOR_UI_V3_END === */"

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
    $uiCss.Trim() +
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
    $uiCss.Trim() +
    "`r`n"
}

$currentIndex =
  [System.IO.File]::ReadAllText($indexPath)

if (
  $currentIndex -notmatch
  '(?i)<meta\s+charset='
) {
  $newIndex =
    $currentIndex -replace
    '(?i)<head>',
    "<head>`r`n    <meta charset=`"UTF-8`">"
}
else {
  $newIndex = $currentIndex
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

[System.IO.File]::WriteAllText(
  $indexPath,
  $newIndex,
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
  Write-Host "Editor UI v3 zainstalowany." -ForegroundColor Green
  Write-Host "Zmiany:"
  Write-Host "  - naprawione polskie znaki i symbol stopni"
  Write-Host "  - kod UI zapisany jako ASCII + Unicode escapes"
  Write-Host "  - wieksza i czytelniejsza typografia"
  Write-Host "  - ciemne paski przewijania"
  Write-Host "  - czytelniejsze karty efektow i warstw"
  Write-Host "  - akcje warstwy bez uszkodzonych ikon"
  Write-Host "  - Inspector podzielony na grupy"
  Write-Host "  - przycisk Resetuj ustawienia efektu"
  Write-Host "  - powiekszony i uporzadkowany obszar podgladu"
  Write-Host ""
  Write-Host "Odswiez aktywny localhost z Vite."
}
catch {
  Write-Host ""
  Write-Host "Walidacja nie przeszla. Przywracam backup..." -ForegroundColor Red

  Copy-Item $mainBackup $mainPath -Force
  Copy-Item $inspectorBackup $inspectorPath -Force
  Copy-Item $styleBackup $stylePath -Force
  Copy-Item $indexBackup $indexPath -Force

  Write-Host "Przywrocono poprzednie pliki." -ForegroundColor Yellow
  throw
}
finally {
  Pop-Location
}
